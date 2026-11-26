/**
 * Pure helpers for rendering, keying, and caching step & page preview
 * thumbnails in the "Pages & Steps" overview modal (`#overviewModal`).
 */

export const OVERVIEW_THUMB_BASE_W = 96;
export const OVERVIEW_THUMB_BASE_H = 72;
export const OVERVIEW_THUMB_MAX_CACHE = 400;

export interface OverviewThumbDimensions {
  width: number;
  height: number;
}

export function computeOverviewThumbDimensions(resScale: number): OverviewThumbDimensions {
  const safeScale = Number.isFinite(resScale) ? Math.min(2, Math.max(1, resScale)) : 1.5;
  return {
    width: Math.round(OVERVIEW_THUMB_BASE_W * safeScale),
    height: Math.round(OVERVIEW_THUMB_BASE_H * safeScale),
  };
}

export interface PreviewPartLike {
  id?: string;
  p?: string;
  c?: number;
  x?: number;
  y?: number;
  z?: number;
}

function hashString32(seed: number, text: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/**
 * Computes a compact deterministic signature for a step's parts list so any part
 * add/remove/recolor/move invalidates affected thumbnails without serializing
 * giant JSON payloads.
 */
export function computeStepPreviewPartSignature(
  parts: ReadonlyArray<PreviewPartLike> | null | undefined,
): string {
  if (!parts || parts.length === 0) return '0:0';
  let h = 2166136261;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const token = `${p.id || ''}|${p.p || ''}|${p.c ?? ''}|${Math.round((p.x || 0) * 10)},${Math.round((p.y || 0) * 10)},${Math.round((p.z || 0) * 10)};`;
    h = hashString32(h, token);
  }
  return `${parts.length}:${h.toString(36)}`;
}

export interface PreviewChapterLike {
  id: string;
  kind?: string;
  sectionId?: string;
  steps: ReadonlyArray<{
    id: string;
    parts?: ReadonlyArray<PreviewPartLike>;
    isStandaloneFigure?: boolean;
    isMinifigPoseStep?: boolean;
  }>;
}

export interface OverviewStepPrevContext {
  prevCount: number;
  prevSignature: string;
  stepSignature: string;
}

/**
 * Computes cumulative previous-part counts & hashes for every step in a single
 * O(N) pass matching `getPreviousPartsForStep` semantics (per-submodel for
 * submodels, per-section for main chapters, empty for standalone figures and
 * pose steps).
 */
export function computeOverviewStepSignatures(
  chapters: ReadonlyArray<PreviewChapterLike> | null | undefined,
): Map<string, OverviewStepPrevContext> {
  const out = new Map<string, OverviewStepPrevContext>();
  if (!chapters) return out;

  const sectionState = new Map<string, { count: number; hash: number }>();

  for (const ch of chapters) {
    if (ch.kind === 'submodel') {
      let count = 0;
      let hash = 2166136261;
      for (const step of ch.steps) {
        const stepSig = computeStepPreviewPartSignature(step.parts);
        if (step.isStandaloneFigure || step.isMinifigPoseStep) {
          out.set(step.id, { prevCount: 0, prevSignature: '0:0', stepSignature: stepSig });
        } else {
          out.set(step.id, {
            prevCount: count,
            prevSignature: `${count}:${hash.toString(36)}`,
            stepSignature: stepSig,
          });
          count += step.parts?.length || 0;
          hash = hashString32(hash, `${step.id}:${stepSig}`);
        }
      }
      continue;
    }

    const sec = ch.sectionId || ch.id;
    const running = sectionState.get(sec) || { count: 0, hash: 2166136261 };
    for (const step of ch.steps) {
      const stepSig = computeStepPreviewPartSignature(step.parts);
      if (step.isStandaloneFigure || step.isMinifigPoseStep) {
        out.set(step.id, { prevCount: 0, prevSignature: '0:0', stepSignature: stepSig });
      } else {
        out.set(step.id, {
          prevCount: running.count,
          prevSignature: `${running.count}:${running.hash.toString(36)}`,
          stepSignature: stepSig,
        });
        running.count += step.parts?.length || 0;
        running.hash = hashString32(running.hash, `${step.id}:${stepSig}`);
      }
    }
    sectionState.set(sec, running);
  }

  return out;
}

function serializePartOffsets(
  offsets:
    | Record<
        string,
        {
          x?: number;
          y?: number;
          z?: number;
          tilt?: number;
          dx?: number;
          dy?: number;
          dz?: number;
          rx?: number;
          ry?: number;
          rz?: number;
        }
      >
    | null
    | undefined,
): string {
  if (!offsets) return '';
  const keys = Object.keys(offsets);
  if (keys.length === 0) return '';
  keys.sort();
  let h = 2166136261;
  for (const k of keys) {
    const o = offsets[k];
    if (!o) continue;
    const x = Math.round(((o.x ?? o.dx) || 0) * 10);
    const y = Math.round(((o.y ?? o.dy) || 0) * 10);
    const z = Math.round(((o.z ?? o.dz) || 0) * 10);
    const tilt = Math.round((o.tilt || 0) * 10);
    const rx = Math.round((o.rx || 0) * 10);
    const ry = Math.round((o.ry || 0) * 10);
    const rz = Math.round((o.rz || 0) * 10);
    const token = `${k}:${x},${y},${z},${tilt},${rx},${ry},${rz};`;
    h = hashString32(h, token);
  }
  return `${keys.length}:${h.toString(36)}`;
}

export interface StepPreviewCacheKeyInput {
  epoch: number;
  stepId: string;
  prevSignature: string;
  stepSignature: string;
  camAz: number;
  camEl: number;
  modelScale: number;
  partOffsets?: Record<string, { dx?: number; dy?: number; dz?: number; rx?: number; ry?: number; rz?: number }> | null;
  highlightNew: boolean;
  highlightColor: string;
  fadePrev: boolean;
  fadeOpacity: number;
  accent: string;
  minifigStyle?: string | null;
  seqSlice?: { start: number; end: number } | null;
  isMinifigPoseStep?: boolean;
  width: number;
  height: number;
}

export function buildStepPreviewCacheKey(input: StepPreviewCacheKeyInput): string {
  const offSig = serializePartOffsets(input.partOffsets);
  const sliceSig = input.seqSlice ? `${input.seqSlice.start}-${input.seqSlice.end}` : '';
  return [
    'step',
    input.epoch,
    input.stepId,
    input.prevSignature,
    input.stepSignature,
    Math.round(input.camAz),
    Math.round(input.camEl),
    Math.round((input.modelScale || 1) * 100),
    offSig,
    input.highlightNew ? `1:${input.highlightColor}` : '0',
    input.fadePrev ? `1:${Math.round(input.fadeOpacity * 100)}` : '0',
    input.accent,
    input.minifigStyle || '',
    sliceSig,
    input.isMinifigPoseStep ? 'pose' : '',
    `${input.width}x${input.height}`,
  ].join('|');
}

export interface PagePreviewCacheKeyInput {
  epoch: number;
  kind: string;
  pageId: string;
  partsSignature: string;
  camAz?: number;
  camEl?: number;
  accent?: string;
  width: number;
  height: number;
}

export function buildPagePreviewCacheKey(input: PagePreviewCacheKeyInput): string {
  return [
    'page',
    input.epoch,
    input.kind,
    input.pageId,
    input.partsSignature,
    Math.round(input.camAz ?? 38),
    Math.round(input.camEl ?? 28),
    input.accent || '',
    `${input.width}x${input.height}`,
  ].join('|');
}

export type OverviewPagePreviewKind = 'model_3d' | 'bom_grid' | 'divider_card' | 'back_card' | 'none';

export function resolveOverviewPagePreviewKind(
  page: { kind?: string } | null | undefined,
): OverviewPagePreviewKind {
  switch (page?.kind) {
    case 'cover':
    case 'complete':
    case 'section_divider':
    case 'submodel_page':
      return 'model_3d';
    case 'bom':
      return 'bom_grid';
    case 'divider':
      return 'divider_card';
    case 'back':
      return 'back_card';
    default:
      return 'none';
  }
}

export interface OverviewThumbCache {
  get: (key: string) => string | undefined;
  set: (key: string, value: string) => void;
  clear: () => void;
  bumpEpoch: () => number;
  getEpoch: () => number;
  size: () => number;
}

export function createOverviewThumbCache(maxEntries = OVERVIEW_THUMB_MAX_CACHE): OverviewThumbCache {
  const cap = Math.max(16, Math.floor(maxEntries));
  const map = new Map<string, string>();
  let epoch = 1;

  return {
    get(key: string): string | undefined {
      const hit = map.get(key);
      if (hit !== undefined) {
        // Refresh insertion order for LRU behavior
        map.delete(key);
        map.set(key, hit);
      }
      return hit;
    },
    set(key: string, value: string): void {
      if (map.has(key)) {
        map.delete(key);
      } else if (map.size >= cap) {
        const oldest = map.keys().next().value;
        if (oldest !== undefined) map.delete(oldest);
      }
      map.set(key, value);
    },
    clear(): void {
      map.clear();
    },
    bumpEpoch(): number {
      epoch += 1;
      map.clear();
      return epoch;
    },
    getEpoch(): number {
      return epoch;
    },
    size(): number {
      return map.size;
    },
  };
}
