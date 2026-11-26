/**
 * Pure, DOM-free LRU pixel-budget cache, deterministic render cache keys,
 * adaptive sub-render supersampling, and adjacent-page pre-warm scheduling
 * helpers used to eliminate page-change latency across step & minifigure pages.
 */

export interface PixelBudgetCacheOptions<T> {
  maxEntries: number;
  maxTotalPixels: number;
  getPixels: (value: T) => number;
  /** Optional guard returning false when an entry is actively mounted and must not be evicted. */
  canEvict?: (value: T) => boolean;
  /** Optional cleanup hook invoked when an entry is evicted or cleared (e.g. releasing canvas memory). */
  onEvict?: (value: T) => void;
}

export interface PixelBudgetCache<T> {
  get: (key: string) => T | undefined;
  has: (key: string) => boolean;
  set: (key: string, value: T) => void;
  delete: (key: string) => boolean;
  clear: () => void;
  bumpEpoch: () => number;
  getEpoch: () => number;
  size: () => number;
  totalPixels: () => number;
}

export function createPixelBudgetCache<T>(options: PixelBudgetCacheOptions<T>): PixelBudgetCache<T> {
  const maxEntries = Math.max(2, Math.floor(options.maxEntries));
  const maxTotalPixels = Math.max(256 * 256, Math.floor(options.maxTotalPixels));
  const { getPixels, canEvict, onEvict } = options;

  const map = new Map<string, { value: T; pixels: number }>();
  let totalPx = 0;
  let epoch = 1;

  const safePixels = (value: T): number => {
    const px = getPixels(value);
    return Number.isFinite(px) && px > 0 ? Math.floor(px) : 0;
  };

  const evictIfNeeded = (protectedKey?: string): void => {
    if (map.size <= maxEntries && totalPx <= maxTotalPixels) return;
    // Iterate from LRU (oldest) to MRU, skipping protected or actively connected entries
    for (const [k, entry] of Array.from(map.entries())) {
      if (map.size <= maxEntries && totalPx <= maxTotalPixels) break;
      if (k === protectedKey) continue;
      if (canEvict && !canEvict(entry.value)) continue;
      map.delete(k);
      totalPx = Math.max(0, totalPx - entry.pixels);
      if (onEvict) onEvict(entry.value);
    }
  };

  return {
    get(key: string): T | undefined {
      const entry = map.get(key);
      if (!entry) return undefined;
      // Refresh recency (move to MRU tail)
      map.delete(key);
      map.set(key, entry);
      return entry.value;
    },
    has(key: string): boolean {
      return map.has(key);
    },
    set(key: string, value: T): void {
      const prev = map.get(key);
      if (prev) {
        map.delete(key);
        totalPx = Math.max(0, totalPx - prev.pixels);
        if (prev.value !== value && onEvict && (!canEvict || canEvict(prev.value))) {
          onEvict(prev.value);
        }
      }
      const pixels = safePixels(value);
      map.set(key, { value, pixels });
      totalPx += pixels;
      evictIfNeeded(key);
    },
    delete(key: string): boolean {
      const entry = map.get(key);
      if (!entry) return false;
      map.delete(key);
      totalPx = Math.max(0, totalPx - entry.pixels);
      if (onEvict && (!canEvict || canEvict(entry.value))) {
        onEvict(entry.value);
      }
      return true;
    },
    clear(): void {
      if (onEvict) {
        for (const entry of map.values()) {
          if (!canEvict || canEvict(entry.value)) {
            onEvict(entry.value);
          }
        }
      }
      map.clear();
      totalPx = 0;
    },
    bumpEpoch(): number {
      epoch += 1;
      this.clear();
      return epoch;
    },
    getEpoch(): number {
      return epoch;
    },
    size(): number {
      return map.size;
    },
    totalPixels(): number {
      return totalPx;
    },
  };
}

function hashString32(seed: number, text: string): number {
  let h = seed >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export interface PartOffsetLike {
  x?: number;
  y?: number;
  z?: number;
  dx?: number;
  dy?: number;
  dz?: number;
  tilt?: number;
  arrow?: boolean;
  arrowSide?: string;
  arrowColorOverride?: string;
  arrowTo?: number[] | null;
  throughGuideTo?: number[] | null;
}

function hashPartOffsets(offsets: Record<string, PartOffsetLike> | null | undefined): string {
  if (!offsets) return '';
  const keys = Object.keys(offsets);
  if (keys.length === 0) return '';
  keys.sort();
  let h = 2166136261;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const o = offsets[k];
    if (!o) continue;
    const x = Math.round(((o.x ?? o.dx) || 0) * 10);
    const y = Math.round(((o.y ?? o.dy) || 0) * 10);
    const z = Math.round(((o.z ?? o.dz) || 0) * 10);
    const tilt = Math.round((o.tilt || 0) * 10);
    const arr = o.arrow === false ? '0' : o.arrow === true ? '1' : '';
    const side = o.arrowSide || '';
    const col = o.arrowColorOverride || '';
    const to = Array.isArray(o.arrowTo) ? o.arrowTo.map((v) => Math.round((v || 0) * 10)).join(',') : '';
    const tg = Array.isArray(o.throughGuideTo) ? o.throughGuideTo.map((v) => Math.round((v || 0) * 10)).join(',') : '';
    h = hashString32(h, `${k}:${x},${y},${z},${tilt},${arr},${side},${col},${to},${tg};`);
  }
  return `${keys.length}:${h.toString(36)}`;
}

function hashSelectedIds(ids: Iterable<string> | null | undefined): string {
  if (!ids) return '';
  const arr = Array.from(ids);
  if (arr.length === 0) return '';
  arr.sort();
  let h = 2166136261;
  for (let i = 0; i < arr.length; i++) {
    h = hashString32(h, `${arr[i]};`);
  }
  return `${arr.length}:${h.toString(36)}`;
}

export interface LiveStepRenderCacheKeyInput {
  epoch: number;
  stepId: string;
  prevSignature: string;
  stepSignature: string;
  camAz: number;
  camEl: number;
  modelScale: number;
  width: number;
  height: number;
  highlightNew: boolean;
  highlightColor?: string;
  highlightLineWeight?: string;
  fadePrev: boolean;
  fadeOpacity?: number;
  stepLighting: string;
  starkBlackOutlines: boolean;
  outlineLineWeight?: string;
  darkBackground: boolean;
  showArrows: boolean;
  arrowColor?: string;
  arrowStyle?: string;
  arrowOutlines?: boolean;
  arrowLighting?: boolean;
  accent?: string;
  focusMode?: string;
  framingTag?: string;
  offX?: number;
  offY?: number;
  offZ?: number;
  panX?: number;
  panY?: number;
  hingeDeg?: number;
  partOffsets?: Record<string, PartOffsetLike> | null;
  selectedPartIds?: Iterable<string> | null;
  minifigPrepId?: string | null;
  minifigIndicatorCount?: number;
}

export function buildLiveStepRenderCacheKey(input: LiveStepRenderCacheKeyInput): string {
  const offHash = hashPartOffsets(input.partOffsets);
  const selHash = hashSelectedIds(input.selectedPartIds);
  const ovShift = (input.offX || input.offY || input.offZ)
    ? `${Math.round((input.offX || 0) * 10)},${Math.round((input.offY || 0) * 10)},${Math.round((input.offZ || 0) * 10)}`
    : '';
  const panShift = (input.panX || input.panY)
    ? `${Math.round((input.panX || 0) * 100)},${Math.round((input.panY || 0) * 100)}`
    : '';
  const hingeKey = input.hingeDeg ? `hg:${Math.round(input.hingeDeg * 10)}` : '';

  return [
    'lstep',
    input.epoch,
    input.stepId,
    input.prevSignature,
    input.stepSignature,
    Math.round(input.camAz * 10),
    Math.round(input.camEl * 10),
    Math.round((input.modelScale || 1) * 100),
    `${Math.round(input.width)}x${Math.round(input.height)}`,
    input.highlightNew ? `h1:${input.highlightColor || ''}:${input.highlightLineWeight || ''}` : 'h0',
    input.fadePrev ? `f1:${Math.round((input.fadeOpacity ?? 0.5) * 100)}` : 'f0',
    input.stepLighting || 'standard',
    input.starkBlackOutlines ? `sb:${input.outlineLineWeight || 'medium'}` : 'n',
    input.darkBackground ? 'd' : 'l',
    input.showArrows
      ? `a:${input.arrowColor || ''}:${input.arrowStyle || ''}:${input.arrowOutlines ? '1' : '0'}:${input.arrowLighting ? '1' : '0'}`
      : 'a0',
    input.accent || '',
    input.focusMode || '',
    input.framingTag || '',
    ovShift,
    panShift,
    hingeKey,
    offHash,
    selHash,
    input.minifigPrepId ? `mp:${input.minifigPrepId}:${input.minifigIndicatorCount || 0}` : '',
  ].join('|');
}

export interface MinifigOneToOneCacheKeyInput {
  epoch: number;
  partsSignature: string;
  pagePxH: number;
  pageHIn: number;
  maxPxW: number;
  maxPxH: number;
  accent: string;
  starkBlackOutlines: boolean;
  outlineLineWeight?: string;
  unlit: boolean;
}

export function buildMinifigOneToOneCacheKey(input: MinifigOneToOneCacheKeyInput): string {
  return [
    'mf1to1',
    input.epoch,
    input.partsSignature,
    Math.round(input.pagePxH),
    Math.round(input.pageHIn * 100),
    Math.round(input.maxPxW),
    Math.round(input.maxPxH),
    input.accent || '',
    input.starkBlackOutlines ? `sb:${input.outlineLineWeight || 'medium'}` : 'n',
    input.unlit ? 'u' : 'l',
  ].join('|');
}

export interface StaticPageSnapCacheKeyInput {
  epoch: number;
  kind: 'section_divider' | 'submodel_page' | 'sub_callout';
  id: string;
  partsSignature: string;
  az: number;
  el: number;
  width: number;
  height: number;
  accent: string;
  stepLighting: string;
  starkBlackOutlines: boolean;
  outlineLineWeight?: string;
  darkBackground: boolean;
}

export function buildStaticPageSnapCacheKey(input: StaticPageSnapCacheKeyInput): string {
  return [
    input.kind,
    input.epoch,
    input.id,
    input.partsSignature,
    Math.round(input.az * 10),
    Math.round(input.el * 10),
    `${Math.round(input.width)}x${Math.round(input.height)}`,
    input.accent || '',
    input.stepLighting || 'standard',
    input.starkBlackOutlines ? `sb:${input.outlineLineWeight || 'medium'}` : 'n',
    input.darkBackground ? 'd' : 'l',
  ].join('|');
}

/**
 * Computes an adaptive WebGL supersampling multiplier for sub-renders drawn into
 * an already-HiDPI composite diagram canvas (e.g. Minifigure Exploded / Sequential).
 *
 * Small accessory callouts (<= 340px) keep crisp supersampling (up to 1.5×),
 * while large sub-renders (>= 720px) that are already 2.25×–3.2× above CSS pixels
 * render 1:1 with WebGL MSAA (`antialias: true`) to avoid wasteful double-supersampling.
 */
export function computeSubrenderSupersampleFactor(
  dstW: number,
  dstH: number,
  requestedFactor = 1.5,
): number {
  const safeReq = Number.isFinite(requestedFactor) ? Math.max(1.0, Math.min(2.0, requestedFactor)) : 1.5;
  const maxDim = Math.max(1, Number.isFinite(dstW) ? dstW : 1, Number.isFinite(dstH) ? dstH : 1);
  const cappedSmall = Math.min(safeReq, 1.5);
  if (maxDim <= 340) return cappedSmall;
  if (maxDim >= 720) return 1.0;
  const t = (maxDim - 340) / (720 - 340);
  return Number((cappedSmall + (1.0 - cappedSmall) * t).toFixed(3));
}

/**
 * Returns adjacent page indices to idle-prewarm after rendering `currentPageIdx`,
 * prioritizing the user's current travel direction (forward by default).
 */
export function computePrewarmPageIndices(
  currentPageIdx: number,
  totalPages: number,
  lastDirection: 1 | -1 = 1,
): number[] {
  if (!Number.isFinite(totalPages) || totalPages <= 1) return [];
  const cur = Math.max(0, Math.min(totalPages - 1, Math.floor(currentPageIdx)));
  const primary = cur + (lastDirection < 0 ? -1 : 1);
  const secondary = cur + (lastDirection < 0 ? 1 : -1);
  const out: number[] = [];
  if (primary >= 0 && primary < totalPages && primary !== cur) out.push(primary);
  if (secondary >= 0 && secondary < totalPages && secondary !== cur) out.push(secondary);
  return out;
}
