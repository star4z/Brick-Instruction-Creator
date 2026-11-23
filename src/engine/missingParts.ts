/**
 * Pre-Import Missing Parts & Decal Analyzer
 *
 * Inspects a newly parsed .io / .ldr / .mpd model BEFORE running subdivision
 * analysis or opening the step generation wizard so the user can be prompted
 * to fetch missing 3D part shapes, official printed LDraw .dat parts, and
 * !TEXMAP PNG decals first.
 */

import { extractTexmapTextureNamesFromLines, normalizeTextureName } from './textureStore';

export interface MissingPartLeaf {
  p: string;
}

export interface MissingPartNode {
  p: string;
  children?: MissingPartLeaf[];
}

export interface MissingPartItem {
  partId: string;
  count: number;
  kind: 'missing_shape' | 'missing_printed';
  fetchable: boolean;
}

export interface MissingPartsAnalysis {
  missingShapes: MissingPartItem[];
  missingPrinted: MissingPartItem[];
  missingTextures: string[];
  fetchableCount: number;
  customOnlyCount: number;
  totalMissingUnique: number;
  totalMissingInstances: number;
  shouldPrompt: boolean;
}

export interface MissingPartsLookupDeps {
  lookupExactRawDat: (partId: string) => { key: string; lines: string[] } | null | undefined;
  hasKnownShape: (partId: string) => boolean;
  getPartIdFallbacks: (partId: string) => string[];
  hasTexture: (texName: string) => boolean;
}

export function normalizePartId(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^ldraw\//, '')
    .replace(/^parts\//, '')
    .replace(/^p\//, '')
    .replace(/\.dat$/i, '');
}

/**
 * Matches BrickLink-Studio-proprietary part IDs that are NOT distributed verbatim
 * on official LDraw public mirrors (e.g. bl_3626pb3988, 3626cpb2451, bb1234, *_torso).
 * Preserves 1-2 digit official LDraw pattern codes such as 3626cpb6 / 3626cpb7.
 */
export function isBrickLinkProprietaryId(normId: string): boolean {
  if (!normId || normId.includes('/')) return false;
  return /^(?:bl_|bb\d+|.*-bl$|.*(?:pb|ps|pat|pr)\d{3,}|.*_torso$)/i.test(normId);
}

/**
 * Matches official LDraw printed / patterned part IDs (e.g. 3626cp01, 3626cpb7,
 * 3626bp8a, 3626cpx0, 973p1b, 3069bp01) that can be downloaded directly from
 * public LDraw mirrors even when a procedural unprinted base mold exists.
 */
export function isOfficialLDrawPatternId(normId: string): boolean {
  if (!normId || normId.includes('/')) return false;
  if (isBrickLinkProprietaryId(normId)) return false;
  return /^\d+[a-z]*p[0-9a-z]{2,}$/i.test(normId);
}

function canFetchMissingShapeFromPublicMirrors(
  normId: string,
  getPartIdFallbacks: (partId: string) => string[],
): boolean {
  if (!normId) return false;
  if (/^bb\d+/i.test(normId)) return false;
  if (isBrickLinkProprietaryId(normId)) {
    const fbs = getPartIdFallbacks(normId);
    return fbs.some((fb) => {
      const nfb = normalizePartId(fb);
      return Boolean(nfb) && !isBrickLinkProprietaryId(nfb);
    });
  }
  return true;
}

/**
 * Analyze a parsed model's parts to identify missing 3D shapes, missing official
 * LDraw printed .dat files, and missing !TEXMAP PNG textures before step generation.
 */
export function analyzeMissingParts(
  parts: MissingPartNode[],
  deps: MissingPartsLookupDeps,
): MissingPartsAnalysis {
  const shapeCounts = new Map<string, MissingPartItem>();
  const printedCounts = new Map<string, MissingPartItem>();
  const missingTexSet = new Set<string>();
  const scannedDatKeys = new Set<string>();

  const scanLoadedDatForTextures = (entry: { key: string; lines: string[] }, depth: number) => {
    if (!entry || depth > 8 || scannedDatKeys.has(entry.key)) return;
    scannedDatKeys.add(entry.key);

    for (const tn of extractTexmapTextureNamesFromLines(entry.lines)) {
      const clean = normalizeTextureName(tn);
      if (clean && !deps.hasTexture(clean)) {
        missingTexSet.add(clean);
      }
    }

    for (const rawLine of entry.lines) {
      const tr = rawLine.trim();
      const unwrapped = /^0\s+!:\s*/.test(tr) ? tr.replace(/^0\s+!:\s*/, '').trim() : tr;
      if (!/^1\s/.test(unwrapped)) continue;
      const toks = unwrapped.split(/\s+/);
      if (toks.length < 15) continue;
      const subId = normalizePartId(toks.slice(14).join(' '));
      if (!subId) continue;
      const subEntry = deps.lookupExactRawDat(subId);
      if (subEntry) scanLoadedDatForTextures(subEntry, depth + 1);
    }
  };

  for (const part of parts || []) {
    const leaves: MissingPartLeaf[] =
      part.children && part.children.length > 0 ? part.children : [part];
    for (const lf of leaves) {
      const k = normalizePartId(lf.p);
      if (!k) continue;

      const exact = deps.lookupExactRawDat(k);
      if (exact) {
        scanLoadedDatForTextures(exact, 0);
        continue;
      }

      if (!deps.hasKnownShape(k)) {
        const existing = shapeCounts.get(k);
        if (existing) {
          existing.count++;
        } else {
          shapeCounts.set(k, {
            partId: k,
            count: 1,
            kind: 'missing_shape',
            fetchable: canFetchMissingShapeFromPublicMirrors(k, deps.getPartIdFallbacks),
          });
        }
      } else if (isOfficialLDrawPatternId(k)) {
        const existing = printedCounts.get(k);
        if (existing) {
          existing.count++;
        } else {
          printedCounts.set(k, {
            partId: k,
            count: 1,
            kind: 'missing_printed',
            fetchable: true,
          });
        }
      }
    }
  }

  const sortItems = (a: MissingPartItem, b: MissingPartItem) =>
    Number(b.fetchable) - Number(a.fetchable) || b.count - a.count || a.partId.localeCompare(b.partId);

  const missingShapes = Array.from(shapeCounts.values()).sort(sortItems);
  const missingPrinted = Array.from(printedCounts.values()).sort(sortItems);
  const missingTextures = Array.from(missingTexSet).sort();

  const fetchableCount =
    missingShapes.filter((m) => m.fetchable).length +
    missingPrinted.filter((m) => m.fetchable).length +
    missingTextures.length;
  const customOnlyCount = missingShapes.filter((m) => !m.fetchable).length;
  const totalMissingUnique = missingShapes.length + missingPrinted.length + missingTextures.length;
  const totalMissingInstances =
    missingShapes.reduce((sum, m) => sum + m.count, 0) +
    missingPrinted.reduce((sum, m) => sum + m.count, 0);

  return {
    missingShapes,
    missingPrinted,
    missingTextures,
    fetchableCount,
    customOnlyCount,
    totalMissingUnique,
    totalMissingInstances,
    shouldPrompt: totalMissingUnique > 0,
  };
}
