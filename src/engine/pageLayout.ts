/**
 * Pure Page Layout & Step Range Group Engine
 *
 * Supports:
 * - Steps per page DERIVED from the layout (columns × rows / mixed layout slots)
 *   and split by page breaks — Auto smart pagination when the grid is Auto
 * - Explicit grid dimensions (columns × rows, or Auto)
 * - Fill direction: Row-first (L→R, then T→B) vs Column-first (T→B, then L→R)
 * - Mixed layouts where featured steps are rendered larger than companion steps
 *   ('even', 'hero_left', 'hero_top', 'hero_right', 'custom_weights')
 * - Reusable, editable Step Range Layout Groups with optional theme & border overrides
 * - Deterministic pixel/fractional slot rectangles shared identically by both
 *   the live Studio renderer and the PDF export pipeline.
 */

export type StepFlowDirection = 'row' | 'column';

export type MixedLayoutStyle =
  | 'even'
  | 'hero_left'
  | 'hero_top'
  | 'hero_right'
  | 'custom_weights';

export type SlotSizeWeight = 'sm' | 'md' | 'lg';

export interface PageLayoutSpec {
  /** Derived: 'custom' when the layout fixes a slot count, 'auto' for smart pagination. */
  mode: 'auto' | 'custom';
  /** Derived (read-only): slots per page implied by the layout. Not user-editable. */
  stepsPerPage: number;
  cols: number | 'auto';
  rows: number | 'auto';
  flow: StepFlowDirection;
  mixedLayout: MixedLayoutStyle;
  slotSizes?: SlotSizeWeight[];
}

export interface StepLayoutGroup {
  id: string;
  name: string;
  /** Inclusive range start. Absolute step number (unique across the manual) when stepBasis === 'absolute'. */
  startStepNum: number;
  endStepNum: number;
  /**
   * 'absolute' — range uses absolute step numbers (current format).
   * 'legacy'   — saved before absolute numbering; range uses printed main-build numbers
   *              and is migrated by migrateLegacyLayoutGroups() once the model is known.
   */
  stepBasis?: 'absolute' | 'legacy';
  layout: PageLayoutSpec;
  themeId?: string | null;
  showStepBorders?: boolean | null;
}

export interface ComputedSlotRect {
  slotIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  isFeatured: boolean;
  isCompact: boolean;
}

export interface ResolvedGridDims {
  cols: number;
  rows: number;
}

export const MIN_STEPS_PER_PAGE = 1;
export const MAX_STEPS_PER_PAGE = 24;
export const MAX_GRID_TRACKS = 6;

export function createDefaultPageLayoutSpec(): PageLayoutSpec {
  return {
    mode: 'auto',
    stepsPerPage: 2,
    cols: 'auto',
    rows: 'auto',
    flow: 'row',
    mixedLayout: 'even',
    slotSizes: [],
  };
}

/** Default slot count for mixed layouts when the grid is left on Auto. */
const MIXED_HERO_DEFAULT_SLOTS = 3;
const CUSTOM_WEIGHTS_DEFAULT_SLOTS = 4;

/**
 * Derives how many steps fit on a page purely from the layout:
 * - explicit columns × rows → cols * rows
 * - mixed "Large Left / Top / Right" with an Auto grid → hero + 2 companions (3)
 * - custom S/M/L weights with an Auto grid → 4 slots
 * - only columns (or only rows) set → a single row (or column) of that many steps
 * - everything Auto → `null` (smart auto pagination by step complexity)
 *
 * Page breaks then split pages further; the count is never edited directly.
 */
export function deriveStepsPerPageFromLayout(
  spec: Pick<PageLayoutSpec, 'cols' | 'rows' | 'mixedLayout'>,
): number | null {
  const c = typeof spec.cols === 'number' && spec.cols >= 1 ? Math.round(spec.cols) : null;
  const r = typeof spec.rows === 'number' && spec.rows >= 1 ? Math.round(spec.rows) : null;
  let n: number | null;
  if (c && r) n = c * r;
  else if (spec.mixedLayout === 'hero_left' || spec.mixedLayout === 'hero_top' || spec.mixedLayout === 'hero_right') {
    n = MIXED_HERO_DEFAULT_SLOTS;
  } else if (spec.mixedLayout === 'custom_weights') n = CUSTOM_WEIGHTS_DEFAULT_SLOTS;
  else if (c) n = c;
  else if (r) n = r;
  else n = null;
  return n === null ? null : Math.max(MIN_STEPS_PER_PAGE, Math.min(MAX_STEPS_PER_PAGE, n));
}

/**
 * Recomputes the derived `mode` / `stepsPerPage` fields from the layout.
 * Call after changing cols, rows or mixedLayout.
 */
export function withDerivedStepsPerPage<T extends PageLayoutSpec>(spec: T): T {
  const n = deriveStepsPerPageFromLayout(spec);
  return { ...spec, mode: n === null ? 'auto' : 'custom', stepsPerPage: n ?? 2 };
}

/**
 * Converts legacy string layout values ('auto' | '1-up' | '2-up' | '4-up')
 * or partial saved objects into a fully normalized PageLayoutSpec.
 *
 * Saved explicit step counts (from the removed "Steps per Page" control) are
 * ignored — the count is always derived from the grid. Legacy '1-up' / '4-up'
 * map to their orientation-independent grids (1×1 / 2×2); others become Auto.
 */
export function normalizePageLayoutSpec(
  raw: unknown,
  legacyLayout?: string | null,
): PageLayoutSpec {
  const base = createDefaultPageLayoutSpec();

  if (!raw || typeof raw !== 'object') {
    if (legacyLayout === '1-up') return withDerivedStepsPerPage({ ...base, cols: 1, rows: 1 });
    if (legacyLayout === '4-up') return withDerivedStepsPerPage({ ...base, cols: 2, rows: 2 });
    return base;
  }

  const obj = raw as Partial<PageLayoutSpec>;

  const parseTrack = (v: unknown): number | 'auto' => {
    if (v === 'auto' || v == null || v === '') return 'auto';
    const n = Number(v);
    if (!Number.isFinite(n) || n < 1) return 'auto';
    return Math.max(1, Math.min(MAX_GRID_TRACKS, Math.round(n)));
  };

  const flow: StepFlowDirection = obj.flow === 'column' ? 'column' : 'row';
  const validMixed: MixedLayoutStyle[] = [
    'even',
    'hero_left',
    'hero_top',
    'hero_right',
    'custom_weights',
  ];
  const mixedLayout: MixedLayoutStyle = validMixed.includes(obj.mixedLayout as MixedLayoutStyle)
    ? (obj.mixedLayout as MixedLayoutStyle)
    : 'even';

  const slotSizes: SlotSizeWeight[] = Array.isArray(obj.slotSizes)
    ? obj.slotSizes.slice(0, MAX_STEPS_PER_PAGE).map((s) =>
        s === 'sm' || s === 'lg' ? s : 'md',
      )
    : [];

  return withDerivedStepsPerPage({
    mode: 'auto',
    stepsPerPage: base.stepsPerPage,
    cols: parseTrack(obj.cols),
    rows: parseTrack(obj.rows),
    flow,
    mixedLayout,
    slotSizes,
  });
}

/**
 * Effective steps-per-page cap for pagination, derived from the layout.
 * `null` means smart auto pagination.
 */
export function getSpecStepsPerPageCap(spec: PageLayoutSpec): number | null {
  return deriveStepsPerPageFromLayout(spec);
}

/**
 * Resolves the grid columns & rows for a uniform or custom-weighted grid.
 * Always guarantees cols * rows >= slotCount so no step is ever dropped.
 */
export function resolveGridDimensions(
  slotCount: number,
  spec: Pick<PageLayoutSpec, 'cols' | 'rows' | 'flow'>,
  isLandscape: boolean,
): ResolvedGridDims {
  const n = Math.max(1, Math.round(slotCount));
  const explicitCols = typeof spec.cols === 'number' && spec.cols >= 1 ? Math.min(MAX_GRID_TRACKS, Math.round(spec.cols)) : null;
  const explicitRows = typeof spec.rows === 'number' && spec.rows >= 1 ? Math.min(MAX_GRID_TRACKS, Math.round(spec.rows)) : null;

  if (explicitCols && explicitRows) {
    if (explicitCols * explicitRows >= n) {
      return { cols: explicitCols, rows: explicitRows };
    }
    if (spec.flow === 'column') {
      return { cols: Math.ceil(n / explicitRows), rows: explicitRows };
    }
    return { cols: explicitCols, rows: Math.ceil(n / explicitCols) };
  }

  if (explicitCols) {
    return { cols: explicitCols, rows: Math.ceil(n / explicitCols) };
  }

  if (explicitRows) {
    return { cols: Math.ceil(n / explicitRows), rows: explicitRows };
  }

  // Smart orientation-aware defaults
  if (n === 1) return { cols: 1, rows: 1 };
  if (n === 2) return isLandscape ? { cols: 2, rows: 1 } : { cols: 1, rows: 2 };
  if (n === 3) return isLandscape ? { cols: 3, rows: 1 } : { cols: 1, rows: 3 };
  if (n === 4) return { cols: 2, rows: 2 };
  if (n <= 6) return isLandscape ? { cols: 3, rows: 2 } : { cols: 2, rows: 3 };
  if (n <= 8) return isLandscape ? { cols: 4, rows: 2 } : { cols: 2, rows: 4 };
  if (n <= 9) return { cols: 3, rows: 3 };

  const cols = isLandscape
    ? Math.min(MAX_GRID_TRACKS, Math.ceil(Math.sqrt(n * 1.25)))
    : Math.min(MAX_GRID_TRACKS, Math.max(2, Math.floor(Math.sqrt(n))));
  return { cols, rows: Math.ceil(n / cols) };
}

function weightValue(w: SlotSizeWeight | undefined): number {
  if (w === 'lg') return 1.65;
  if (w === 'sm') return 0.65;
  return 1.0;
}

function layoutSubGrid(
  count: number,
  originX: number,
  originY: number,
  availW: number,
  availH: number,
  gap: number,
  preferHorizontal: boolean,
  flow: StepFlowDirection,
  startIndex: number,
): ComputedSlotRect[] {
  if (count <= 0) return [];
  if (count === 1) {
    return [
      {
        slotIndex: startIndex,
        x: originX,
        y: originY,
        w: availW,
        h: availH,
        isFeatured: false,
        isCompact: availW * availH < 0, // updated by caller
      },
    ];
  }

  let cols: number;
  let rows: number;
  if (preferHorizontal) {
    // Bottom strip (hero_top): 1 row up to 4 items, then 2 rows
    cols = count <= 4 ? count : Math.ceil(count / 2);
    rows = Math.ceil(count / cols);
  } else {
    // Side strip (hero_left / hero_right): 1 col up to 4 items, then 2 cols
    rows = count <= 4 ? count : Math.ceil(count / 2);
    cols = Math.ceil(count / rows);
  }

  const cellW = Math.max(10, (availW - gap * (cols - 1)) / cols);
  const cellH = Math.max(10, (availH - gap * (rows - 1)) / rows);
  const out: ComputedSlotRect[] = [];

  for (let i = 0; i < count; i++) {
    const col = flow === 'column' ? Math.floor(i / rows) : i % cols;
    const row = flow === 'column' ? i % rows : Math.floor(i / cols);
    out.push({
      slotIndex: startIndex + i,
      x: originX + col * (cellW + gap),
      y: originY + row * (cellH + gap),
      w: cellW,
      h: cellH,
      isFeatured: false,
      isCompact: true,
    });
  }
  return out;
}

/**
 * Computes exact pixel rectangles for each step slot inside a page content area
 * `(0, 0) .. (contentW, contentH)` with `gap` pixels between cells.
 *
 * Used identically by both the Live DOM PageCanvas and the Canvas PDF Exporter
 * so live previews and exported PDFs match pixel-for-pixel.
 */
export function computePageSlotRects(
  slotCount: number,
  spec: PageLayoutSpec,
  isLandscape: boolean,
  contentW: number,
  contentH: number,
  gap: number,
): ComputedSlotRect[] {
  const n = Math.max(1, Math.round(slotCount));
  const W = Math.max(20, contentW);
  const H = Math.max(20, contentH);
  const g = Math.max(0, gap);

  if (n === 1) {
    return [{ slotIndex: 0, x: 0, y: 0, w: W, h: H, isFeatured: true, isCompact: false }];
  }

  const totalArea = W * H;
  const tagCompact = (rects: ComputedSlotRect[]): ComputedSlotRect[] =>
    rects.map((r) => {
      const areaFrac = (r.w * r.h) / Math.max(1, totalArea);
      const isCompact = !r.isFeatured && (n >= 4 || areaFrac < 0.24 || r.h < H * 0.34);
      return { ...r, isCompact };
    });

  // Mixed Layout: Hero Left (first step large on left, rest smaller on right)
  if (spec.mixedLayout === 'hero_left') {
    const heroRatio = n === 2 ? 0.62 : n === 3 ? 0.58 : 0.56;
    const heroW = Math.max(20, (W - g) * heroRatio);
    const sideW = Math.max(20, W - g - heroW);
    const hero: ComputedSlotRect = {
      slotIndex: 0,
      x: 0,
      y: 0,
      w: heroW,
      h: H,
      isFeatured: true,
      isCompact: false,
    };
    const rest = layoutSubGrid(n - 1, heroW + g, 0, sideW, H, g, false, spec.flow, 1);
    return tagCompact([hero, ...rest]);
  }

  // Mixed Layout: Hero Right (earlier steps smaller on left, final step large on right)
  if (spec.mixedLayout === 'hero_right') {
    const heroRatio = n === 2 ? 0.62 : n === 3 ? 0.58 : 0.56;
    const heroW = Math.max(20, (W - g) * heroRatio);
    const sideW = Math.max(20, W - g - heroW);
    const rest = layoutSubGrid(n - 1, 0, 0, sideW, H, g, false, spec.flow, 0);
    const hero: ComputedSlotRect = {
      slotIndex: n - 1,
      x: sideW + g,
      y: 0,
      w: heroW,
      h: H,
      isFeatured: true,
      isCompact: false,
    };
    return tagCompact([...rest, hero]);
  }

  // Mixed Layout: Hero Top (first step large across top, rest smaller along bottom)
  if (spec.mixedLayout === 'hero_top') {
    const heroRatio = n === 2 ? 0.62 : n === 3 ? 0.58 : 0.56;
    const heroH = Math.max(20, (H - g) * heroRatio);
    const stripH = Math.max(20, H - g - heroH);
    const hero: ComputedSlotRect = {
      slotIndex: 0,
      x: 0,
      y: 0,
      w: W,
      h: heroH,
      isFeatured: true,
      isCompact: false,
    };
    const rest = layoutSubGrid(n - 1, 0, heroH + g, W, stripH, g, true, spec.flow, 1);
    return tagCompact([hero, ...rest]);
  }

  // Mixed Layout: Custom Per-Slot Weights (S / M / L)
  if (spec.mixedLayout === 'custom_weights') {
    const weights = Array.from({ length: n }, (_, i) => weightValue(spec.slotSizes?.[i]));
    const { cols, rows } = resolveGridDimensions(n, spec, isLandscape);
    const rects: ComputedSlotRect[] = new Array(n);

    if (spec.flow === 'column') {
      // Partition into columns of `rows` slots
      const colGroups: number[][] = [];
      for (let c = 0; c < cols; c++) {
        const items: number[] = [];
        for (let r = 0; r < rows; r++) {
          const idx = c * rows + r;
          if (idx < n) items.push(idx);
        }
        if (items.length > 0) colGroups.push(items);
      }
      const colTrackWeights = colGroups.map((grp) =>
        Math.max(...grp.map((idx) => weights[idx])),
      );
      const totalColWWeight = colTrackWeights.reduce((a, b) => a + b, 0) || 1;
      const usableW = Math.max(20, W - g * (colGroups.length - 1));
      let curX = 0;
      for (let ci = 0; ci < colGroups.length; ci++) {
        const grp = colGroups[ci];
        const colW = (usableW * colTrackWeights[ci]) / totalColWWeight;
        const usableH = Math.max(20, H - g * (grp.length - 1));
        const sumRowW = grp.reduce((acc, idx) => acc + weights[idx], 0) || 1;
        let curY = 0;
        for (let ri = 0; ri < grp.length; ri++) {
          const idx = grp[ri];
          const cellH = (usableH * weights[idx]) / sumRowW;
          rects[idx] = {
            slotIndex: idx,
            x: curX,
            y: curY,
            w: colW,
            h: cellH,
            isFeatured: spec.slotSizes?.[idx] === 'lg',
            isCompact: spec.slotSizes?.[idx] === 'sm',
          };
          curY += cellH + g;
        }
        curX += colW + g;
      }
      return tagCompact(rects);
    }

    // Row-first custom weights
    const rowGroups: number[][] = [];
    for (let r = 0; r < rows; r++) {
      const items: number[] = [];
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx < n) items.push(idx);
      }
      if (items.length > 0) rowGroups.push(items);
    }
    const rowTrackWeights = rowGroups.map((grp) =>
      Math.max(...grp.map((idx) => weights[idx])),
    );
    const totalRowHWeight = rowTrackWeights.reduce((a, b) => a + b, 0) || 1;
    const usableH = Math.max(20, H - g * (rowGroups.length - 1));
    let curY = 0;
    for (let ri = 0; ri < rowGroups.length; ri++) {
      const grp = rowGroups[ri];
      const rowH = (usableH * rowTrackWeights[ri]) / totalRowHWeight;
      const usableW = Math.max(20, W - g * (grp.length - 1));
      const sumColW = grp.reduce((acc, idx) => acc + weights[idx], 0) || 1;
      let curX = 0;
      for (let ci = 0; ci < grp.length; ci++) {
        const idx = grp[ci];
        const cellW = (usableW * weights[idx]) / sumColW;
        rects[idx] = {
          slotIndex: idx,
          x: curX,
          y: curY,
          w: cellW,
          h: rowH,
          isFeatured: spec.slotSizes?.[idx] === 'lg',
          isCompact: spec.slotSizes?.[idx] === 'sm',
        };
        curX += cellW + g;
      }
      curY += rowH + g;
    }
    return tagCompact(rects);
  }

  // Uniform Even Grid (supports any N, explicit cols/rows, and Row-first vs Column-first flow!)
  const { cols, rows } = resolveGridDimensions(n, spec, isLandscape);
  const cellW = Math.max(10, (W - g * (cols - 1)) / cols);
  const cellH = Math.max(10, (H - g * (rows - 1)) / rows);
  const rects: ComputedSlotRect[] = [];

  for (let i = 0; i < n; i++) {
    const col = spec.flow === 'column' ? Math.floor(i / rows) : i % cols;
    const row = spec.flow === 'column' ? i % rows : Math.floor(i / cols);
    rects.push({
      slotIndex: i,
      x: col * (cellW + g),
      y: row * (cellH + g),
      w: cellW,
      h: cellH,
      isFeatured: false,
      isCompact: false,
    });
  }

  return tagCompact(rects);
}

/**
 * Finds the matching StepLayoutGroup for a given 1-based ABSOLUTE step number
 * (unique across the manual — never the printed per-submodel number).
 * Later groups in the array take precedence if ranges overlap (allowing users to
 * refine a sub-range inside a broader group without losing the outer group).
 */
export function findLayoutGroupForStep(
  groups: StepLayoutGroup[] | null | undefined,
  stepNum: number,
): StepLayoutGroup | null {
  if (!groups || groups.length === 0) return null;
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (!g) continue;
    const lo = Math.min(g.startStepNum, g.endStepNum);
    const hi = Math.max(g.startStepNum, g.endStepNum);
    if (stepNum >= lo && stepNum <= hi) return g;
  }
  return null;
}

/**
 * Normalizes a persisted array of StepLayoutGroup records.
 */
export function normalizeLayoutGroups(raw: unknown): StepLayoutGroup[] {
  if (!Array.isArray(raw)) return [];
  const out: StepLayoutGroup[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== 'object') continue;
    const obj = item as Partial<StepLayoutGroup>;
    const start = Math.max(1, Math.round(Number(obj.startStepNum) || 1));
    const end = Math.max(start, Math.round(Number(obj.endStepNum) || start));
    const id = typeof obj.id === 'string' && obj.id.trim() ? obj.id.trim() : `grp_${i + 1}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({
      id,
      name:
        typeof obj.name === 'string' && obj.name.trim()
          ? obj.name.trim().slice(0, 48)
          : `Steps ${start}–${end}`,
      startStepNum: start,
      endStepNum: end,
      stepBasis: obj.stepBasis === 'absolute' ? 'absolute' : 'legacy',
      layout: normalizePageLayoutSpec(obj.layout),
      themeId: typeof obj.themeId === 'string' && obj.themeId.trim() ? obj.themeId.trim() : null,
      showStepBorders: typeof obj.showStepBorders === 'boolean' ? obj.showStepBorders : null,
    });
  }
  return out;
}

/**
 * Returns a concise human-readable summary of a PageLayoutSpec for badges & cards.
 */
export function describePageLayoutSpec(spec: PageLayoutSpec): string {
  const parts: string[] = [];
  const derived = deriveStepsPerPageFromLayout(spec);
  if (derived === null) {
    parts.push('Auto');
  } else {
    parts.push(`${derived}/page`);
  }

  if (spec.cols !== 'auto' || spec.rows !== 'auto') {
    parts.push(`${spec.cols === 'auto' ? 'Auto' : spec.cols}×${spec.rows === 'auto' ? 'Auto' : spec.rows}`);
  }

  if (spec.flow === 'column') {
    parts.push('Columns ↓');
  }

  if (spec.mixedLayout === 'hero_left') parts.push('Large Left');
  else if (spec.mixedLayout === 'hero_top') parts.push('Large Top');
  else if (spec.mixedLayout === 'hero_right') parts.push('Large Right');
  else if (spec.mixedLayout === 'custom_weights') parts.push('Mixed Sizes');

  return parts.join(' · ');
}
