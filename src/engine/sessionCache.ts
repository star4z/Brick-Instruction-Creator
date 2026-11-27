/**
 * Portable `.biw` Project Embedded Assets & Internal Session Helpers
 *
 * Pure helpers shared by:
 * - Fully portable `.biw` project export & import (embedding custom `.dat`
 *   geometry, titles, fused assembly definitions, and `.io`/MPD decals)
 * - Fast startup restoration by saving the exact same `.biw` project internally
 *   in IndexedDB (`lastProject`) alongside `lastModel`
 * - Targeted lazy `partsLib` lookups for only the active manual's part IDs
 */

import {
  PROJECT_FILE_FORMAT,
  PROJECT_FILE_STUDIO_VERSION,
} from '../storage/fileFormats';

export interface EmbeddedTextureEntry {
  names: string[];
  base64Png: string;
}

export interface EmbeddedModelAssetsPayload {
  embeddedDat?: Record<string, string>;
  embeddedDatTitles?: Record<string, string>;
  compositePartDefs?: Record<string, { name: string }>;
  embeddedTextures?: EmbeddedTextureEntry[];
}

export interface DeserializedEmbeddedModelAssets {
  embeddedDat: Map<string, string[]>;
  embeddedDatTitles: Map<string, string>;
  compositePartDefs: Map<string, { name: string }>;
  embeddedTextures: EmbeddedTextureEntry[];
}

export interface InternalBiwSessionMeta {
  sourceSignature: string;
  kind: 'io' | 'ldr' | 'project';
  fileName: string;
  importMode?: string;
  subdivisionPlan?: unknown;
  cameraLayoutAspect?: number;
  pageIdx?: number;
  seenDiagnosticKeys?: string[];
  savedAt: number;
}

function fnv1aUpdate(hash: number, str: string): number {
  let h = hash >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

function fnv1aBytes(bytes: Uint8Array): string {
  let h = 0x811c9dc5;
  const len = bytes.length;
  h = fnv1aUpdate(h, String(len));
  const edge = Math.min(8192, len);
  for (let i = 0; i < edge; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  if (len > edge * 2) {
    const step = Math.max(1, Math.floor((len - edge * 2) / 4096));
    for (let i = edge; i < len - edge; i += step) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  if (len > edge) {
    for (let i = Math.max(edge, len - edge); i < len; i++) {
      h ^= bytes[i];
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return `${len}:${h.toString(16)}`;
}

/**
 * Computes a fast deterministic signature for a saved `lastModel` record so we
 * can verify whether the internally saved `.biw` (`lastProject`) matches it.
 */
export function computeSourceSignature(rec: {
  kind?: string;
  fileName?: string;
  data?: unknown;
  importMode?: string;
  subdivisionPlan?: unknown;
} | null | undefined): string {
  if (!rec || typeof rec !== 'object') return '';
  let h = 0x811c9dc5;
  h = fnv1aUpdate(h, String(rec.kind || ''));
  h = fnv1aUpdate(h, '|');
  h = fnv1aUpdate(h, String(rec.fileName || ''));
  h = fnv1aUpdate(h, '|');
  h = fnv1aUpdate(h, String(rec.importMode || 'auto'));
  h = fnv1aUpdate(h, '|');
  if (rec.subdivisionPlan != null) {
    try {
      h = fnv1aUpdate(h, JSON.stringify(rec.subdivisionPlan));
    } catch {
      h = fnv1aUpdate(h, 'subplan');
    }
  }
  let dataSig = 'none';
  if (typeof rec.data === 'string') {
    const s = rec.data;
    let dh = 0x811c9dc5;
    const edge = Math.min(8192, s.length);
    dh = fnv1aUpdate(dh, s.slice(0, edge));
    if (s.length > edge * 2) {
      const step = Math.max(1, Math.floor((s.length - edge * 2) / 2048));
      for (let i = edge; i < s.length - edge; i += step) {
        dh ^= s.charCodeAt(i);
        dh = Math.imul(dh, 0x01000193) >>> 0;
      }
    }
    if (s.length > edge) {
      dh = fnv1aUpdate(dh, s.slice(Math.max(edge, s.length - edge)));
    }
    dataSig = `str:${s.length}:${dh.toString(16)}`;
  } else if (rec.data instanceof ArrayBuffer) {
    dataSig = `ab:${fnv1aBytes(new Uint8Array(rec.data))}`;
  } else if (ArrayBuffer.isView(rec.data)) {
    const view = rec.data as ArrayBufferView;
    dataSig = `view:${fnv1aBytes(new Uint8Array(view.buffer, view.byteOffset, view.byteLength))}`;
  }
  return `${h.toString(16)}_${dataSig}`;
}

/**
 * Serializes in-memory embedded `.dat` parts, titles, composite assembly names,
 * and embedded textures into a JSON-safe object for portable `.biw` files.
 */
export function serializeEmbeddedModelAssets(input: {
  embeddedDatRaw: Map<string, string[]>;
  embeddedDatTitles: Map<string, string>;
  compositePartDefs: Map<string, { name: string }>;
  embeddedTextures: EmbeddedTextureEntry[];
}): EmbeddedModelAssetsPayload {
  const out: EmbeddedModelAssetsPayload = {};
  if (input.embeddedDatRaw.size > 0) {
    const datObj: Record<string, string> = {};
    for (const [k, lines] of input.embeddedDatRaw.entries()) {
      if (k && Array.isArray(lines) && lines.length > 0) {
        datObj[k] = lines.join('\n');
      }
    }
    if (Object.keys(datObj).length > 0) out.embeddedDat = datObj;
  }
  if (input.embeddedDatTitles.size > 0) {
    const titleObj: Record<string, string> = {};
    for (const [k, title] of input.embeddedDatTitles.entries()) {
      if (k && typeof title === 'string' && title.trim()) {
        titleObj[k] = title;
      }
    }
    if (Object.keys(titleObj).length > 0) out.embeddedDatTitles = titleObj;
  }
  if (input.compositePartDefs.size > 0) {
    const compObj: Record<string, { name: string }> = {};
    for (const [k, def] of input.compositePartDefs.entries()) {
      if (k && def && typeof def.name === 'string') {
        compObj[k] = { name: def.name };
      }
    }
    if (Object.keys(compObj).length > 0) out.compositePartDefs = compObj;
  }
  if (Array.isArray(input.embeddedTextures) && input.embeddedTextures.length > 0) {
    const cleanTex = input.embeddedTextures
      .filter((t) => t && typeof t.base64Png === 'string' && t.base64Png.length >= 16)
      .map((t) => ({
        names: Array.isArray(t.names) ? t.names.filter((n) => typeof n === 'string' && n.trim().length > 0) : [],
        base64Png: t.base64Png,
      }));
    if (cleanTex.length > 0) out.embeddedTextures = cleanTex;
  }
  return out;
}

/**
 * Safely deserializes embedded model assets from a `.biw` project payload.
 */
export function deserializeEmbeddedModelAssets(raw: unknown): DeserializedEmbeddedModelAssets {
  const embeddedDat = new Map<string, string[]>();
  const embeddedDatTitles = new Map<string, string>();
  const compositePartDefs = new Map<string, { name: string }>();
  const embeddedTextures: EmbeddedTextureEntry[] = [];

  if (!raw || typeof raw !== 'object') {
    return { embeddedDat, embeddedDatTitles, compositePartDefs, embeddedTextures };
  }
  const obj = raw as Record<string, unknown>;

  if (obj.embeddedDat && typeof obj.embeddedDat === 'object' && !Array.isArray(obj.embeddedDat)) {
    for (const [k, val] of Object.entries(obj.embeddedDat as Record<string, unknown>)) {
      if (!k) continue;
      if (typeof val === 'string') {
        const lines = val.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        if (lines.length > 0) embeddedDat.set(k, lines);
      } else if (Array.isArray(val)) {
        const lines = val.filter((l): l is string => typeof l === 'string' && l.trim().length > 0).map((l) => l.trim());
        if (lines.length > 0) embeddedDat.set(k, lines);
      }
    }
  }

  if (obj.embeddedDatTitles && typeof obj.embeddedDatTitles === 'object' && !Array.isArray(obj.embeddedDatTitles)) {
    for (const [k, val] of Object.entries(obj.embeddedDatTitles as Record<string, unknown>)) {
      if (k && typeof val === 'string' && val.trim()) {
        embeddedDatTitles.set(k, val);
      }
    }
  }

  if (obj.compositePartDefs && typeof obj.compositePartDefs === 'object' && !Array.isArray(obj.compositePartDefs)) {
    for (const [k, val] of Object.entries(obj.compositePartDefs as Record<string, unknown>)) {
      if (k && val && typeof val === 'object' && typeof (val as { name?: unknown }).name === 'string') {
        compositePartDefs.set(k, { name: (val as { name: string }).name });
      }
    }
  }

  if (Array.isArray(obj.embeddedTextures)) {
    for (const item of obj.embeddedTextures) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as { names?: unknown; name?: unknown; base64Png?: unknown };
      if (typeof rec.base64Png !== 'string' || rec.base64Png.length < 16) continue;
      const names = Array.isArray(rec.names)
        ? rec.names.filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
        : (typeof rec.name === 'string' && rec.name.trim() ? [rec.name.trim()] : []);
      embeddedTextures.push({ names, base64Png: rec.base64Png });
    }
  }

  return { embeddedDat, embeddedDatTitles, compositePartDefs, embeddedTextures };
}

/**
 * Checks whether an internally saved `.biw` project (`lastProject`) in IndexedDB
 * is structurally valid and ready to restore.
 */
export function isRestorableBiwProject(raw: unknown): raw is Record<string, unknown> & {
  chapters: unknown[];
  title?: string;
  _sessionMeta?: InternalBiwSessionMeta;
} {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const obj = raw as Record<string, unknown>;
  return (
    obj.format === PROJECT_FILE_FORMAT &&
    obj.version === PROJECT_FILE_STUDIO_VERSION &&
    Array.isArray(obj.chapters) &&
    obj.chapters.length > 0
  );
}

/**
 * Checks whether an internally saved `.biw` project matches a raw `lastModel`
 * source signature.
 */
export function matchesBiwSourceSignature(raw: unknown, expectedSignature: string): boolean {
  if (!isRestorableBiwProject(raw) || !expectedSignature) return false;
  return raw._sessionMeta?.sourceSignature === expectedSignature;
}

/**
 * Extracts all unique leaf LDraw part IDs referenced by a built manual's chapters
 * (including fused assembly `children` and nested submodel steps).
 */
export function collectLeafPartIdsFromChapters(chapters: unknown): string[] {
  const out = new Set<string>();
  if (!Array.isArray(chapters)) return [];

  const visitParts = (parts: unknown) => {
    if (!Array.isArray(parts)) return;
    for (const part of parts) {
      if (!part || typeof part !== 'object') continue;
      const p = part as { p?: unknown; children?: unknown };
      if (Array.isArray(p.children) && p.children.length > 0) {
        visitParts(p.children);
      } else if (typeof p.p === 'string' && p.p.trim()) {
        out.add(p.p.trim());
      }
    }
  };

  const visitSteps = (steps: unknown) => {
    if (!Array.isArray(steps)) return;
    for (const step of steps) {
      if (!step || typeof step !== 'object') continue;
      const s = step as { parts?: unknown; submodel?: { steps?: unknown } };
      visitParts(s.parts);
      if (s.submodel && Array.isArray(s.submodel.steps)) {
        visitSteps(s.submodel.steps);
      }
    }
  };

  for (const ch of chapters) {
    if (!ch || typeof ch !== 'object') continue;
    visitSteps((ch as { steps?: unknown }).steps);
  }

  return Array.from(out);
}

/**
 * Returns the ordered IndexedDB `partsLib` candidate keys to check for a
 * normalized LDraw part reference (matching `getDirectLoadedDatLines`).
 */
export function buildLibraryCandidateKeys(normKey: string): string[] {
  const k = normKey.trim().toLowerCase();
  if (!k) return [];
  const keys = [k];
  if (!k.includes('/')) {
    if (!k.startsWith('bl_')) keys.push(`bl_${k}`);
    if (!k.endsWith('-bl')) keys.push(`${k}-bl`);
  }
  if (k.startsWith('bl_')) {
    keys.push(k.slice(3));
  }
  return keys;
}
