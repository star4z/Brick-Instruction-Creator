/**
 * Pure Page Layout, Physical Smart Auto Grid & Step Range Group Engine
 *
 * Supports:
 * - Physical Smart Auto pagination: packs as many steps per page as fit while
 *   guaranteeing a minimum 3D step area (1" × 1" + margins/header chrome) AND
 *   a minimum rendered piece scale (1 LEGO stud = 20 LDU ≥ 0.5 cm), with zero
 *   artificial 1–2 step cap.
 * - Page-size readability validation & larger paper format suggestions whenever
 *   a step cannot meet the minimum area or 0.5 cm/stud threshold even at 1-up.
 * - Explicit grid dimensions (columns × rows, or Auto)
 * - Fill direction: Row-first (L→R, then T→B) vs Column-first (T→B, then L→R)
 * - Mixed layouts where featured steps are rendered larger than companion steps
 *   ('even', 'hero_left', 'hero_top', 'hero_right', 'custom_weights')
 * - Reusable, editable Step Range Layout Groups with optional theme & border overrides
 * - Deterministic pixel/fractional slot rectangles shared identically by both
 *   the live Studio renderer and the PDF export pipeline.
 */

import type { StepBorderStyle } from '../themes/customThemes';
import type { Vec3, WorldBox } from './minifigPose';
import { computePageTypography, type PageDensity } from './pageTypography';
import type { WorldBounds3D } from './stepCamera';
import { PAPER_FORMAT_ORDER, PAPER_FORMAT_SPECS, type PaperFormatSpec } from './stepToolbar';

export type StepFlowDirection = 'row' | 'column';

export type MixedLayoutStyle =
  | 'even'
  | 'hero_left'
  | 'hero_top'
  | 'hero_right'
  | 'custom_weights';

export type SlotSizeWeight = 'sm' | 'md' | 'lg';

export type PageNumberPosition = 'right' | 'outside';
export type ResolvedPageNumberSide = 'left' | 'right';

export const DEFAULT_PAGE_NUMBER_POSITION: PageNumberPosition = 'right';

/**
 * Sanitizes a persisted or user-supplied page number position preference.
 * Unknown or legacy values fall back to `'right'`.
 */
export function normalizePageNumberPosition(val: unknown): PageNumberPosition {
  return val === 'outside' ? 'outside' : 'right';
}

/**
 * Resolves which horizontal edge a printed page number occupies on a 1-based physical page.
 *
 * - `'right'`: always bottom-right (standard single-sided / screen layout).
 * - `'outside'`: booklet recto/verso placement — odd physical pages (1, 3, 5, …) are
 *   right-hand (recto) pages with the outside edge on `'right'`, and even physical
 *   pages (2, 4, 6, …) are left-hand (verso) pages with the outside edge on `'left'`.
 */
export function resolvePageNumberSide(
  pageNumber: number,
  position: PageNumberPosition | string | undefined,
): ResolvedPageNumberSide {
  if (normalizePageNumberPosition(position) !== 'outside') return 'right';
  const n = Math.max(1, Math.floor(Number.isFinite(pageNumber) ? pageNumber : 1));
  return n % 2 === 0 ? 'left' : 'right';
}

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
  stepBorderStyle?: StepBorderStyle | null;
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
    flow: 'column',
    mixedLayout: 'even',
    slotSizes: [],
  };
}

/**
 * Derives how many steps fit on a page purely from explicit grid tracks:
 * - explicit columns × rows → cols * rows
 * - only columns (or only rows) set → a single row (or column) of that many steps
 * - Columns & Rows both Auto → `null` (dynamic Smart Auto pagination by physical
 *   page size & minimum step readability, for all Step Proportions)
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

  const flow: StepFlowDirection = obj.flow === 'row' ? 'row' : 'column';
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
  subGridOverride?: ResolvedGridDims | null,
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
  const hasValidSubOverride =
    Boolean(subGridOverride) &&
    Number.isFinite(subGridOverride!.cols) &&
    Number.isFinite(subGridOverride!.rows) &&
    Math.round(subGridOverride!.cols) >= 1 &&
    Math.round(subGridOverride!.rows) >= 1 &&
    Math.round(subGridOverride!.cols) * Math.round(subGridOverride!.rows) >= count;

  if (hasValidSubOverride) {
    cols = Math.round(subGridOverride!.cols);
    rows = Math.round(subGridOverride!.rows);
  } else if (count <= 4) {
    if (preferHorizontal) {
      cols = count;
      rows = 1;
    } else {
      cols = 1;
      rows = count;
    }
  } else {
    const aspect = availW / Math.max(1, availH);
    cols = Math.max(1, Math.min(count, Math.round(Math.sqrt(count * aspect))));
    rows = Math.ceil(count / cols);
  }

  const cellW = Math.max(1, (availW - gap * (cols - 1)) / cols);
  const cellH = Math.max(1, (availH - gap * (rows - 1)) / rows);
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
  resolvedGridOverride?: ResolvedGridDims | null,
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

  // Step Proportion: Large Left (first step large on left, rest smaller on right)
  if (spec.mixedLayout === 'hero_left') {
    const heroRatio = n === 2 ? 0.62 : n === 3 ? 0.58 : 0.56;
    const heroW = Math.max(1, (W - g) * heroRatio);
    const sideW = Math.max(1, W - g - heroW);
    const hero: ComputedSlotRect = {
      slotIndex: 0,
      x: 0,
      y: 0,
      w: heroW,
      h: H,
      isFeatured: true,
      isCompact: false,
    };
    const rest = layoutSubGrid(n - 1, heroW + g, 0, sideW, H, g, false, spec.flow, 1, resolvedGridOverride);
    return tagCompact([hero, ...rest]);
  }

  // Step Proportion: Large Right (earlier steps smaller on left, final step large on right)
  if (spec.mixedLayout === 'hero_right') {
    const heroRatio = n === 2 ? 0.62 : n === 3 ? 0.58 : 0.56;
    const heroW = Math.max(1, (W - g) * heroRatio);
    const sideW = Math.max(1, W - g - heroW);
    const rest = layoutSubGrid(n - 1, 0, 0, sideW, H, g, false, spec.flow, 0, resolvedGridOverride);
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

  // Step Proportion: Large Top (first step large across top, rest smaller along bottom)
  if (spec.mixedLayout === 'hero_top') {
    const heroRatio = n === 2 ? 0.62 : n === 3 ? 0.58 : 0.56;
    const heroH = Math.max(1, (H - g) * heroRatio);
    const stripH = Math.max(1, H - g - heroH);
    const hero: ComputedSlotRect = {
      slotIndex: 0,
      x: 0,
      y: 0,
      w: W,
      h: heroH,
      isFeatured: true,
      isCompact: false,
    };
    const rest = layoutSubGrid(n - 1, 0, heroH + g, W, stripH, g, true, spec.flow, 1, resolvedGridOverride);
    return tagCompact([hero, ...rest]);
  }

  // Step Proportion: Custom Per-Slot Weights (S / M / L)
  if (spec.mixedLayout === 'custom_weights') {
    const weights = Array.from({ length: n }, (_, i) => weightValue(spec.slotSizes?.[i]));
    const hasValidOverride =
      Boolean(resolvedGridOverride) &&
      Number.isFinite(resolvedGridOverride!.cols) &&
      Number.isFinite(resolvedGridOverride!.rows) &&
      Math.round(resolvedGridOverride!.cols) >= 1 &&
      Math.round(resolvedGridOverride!.rows) >= 1 &&
      Math.round(resolvedGridOverride!.cols) * Math.round(resolvedGridOverride!.rows) >= n;
    const { cols, rows } = hasValidOverride
      ? {
          cols: Math.round(resolvedGridOverride!.cols),
          rows: Math.round(resolvedGridOverride!.rows),
        }
      : resolveGridDimensions(n, spec, isLandscape);
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

  // Uniform Even Grid (supports any N, explicit cols/rows, smart-auto overrides, and Row-first vs Column-first flow!)
  const hasValidOverride =
    Boolean(resolvedGridOverride) &&
    Number.isFinite(resolvedGridOverride!.cols) &&
    Number.isFinite(resolvedGridOverride!.rows) &&
    Math.round(resolvedGridOverride!.cols) >= 1 &&
    Math.round(resolvedGridOverride!.rows) >= 1 &&
    Math.round(resolvedGridOverride!.cols) * Math.round(resolvedGridOverride!.rows) >= n;
  const { cols, rows } = hasValidOverride
    ? {
        cols: Math.round(resolvedGridOverride!.cols),
        rows: Math.round(resolvedGridOverride!.rows),
      }
    : resolveGridDimensions(n, spec, isLandscape);
  const cellW = Math.max(1, (W - g * (cols - 1)) / cols);
  const cellH = Math.max(1, (H - g * (rows - 1)) / rows);
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

export interface PageDividerLine {
  orientation: 'vertical' | 'horizontal';
  /** 0 = primary full-span divider, 1+ = secondary nested divider */
  level: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PageDividerLineOptions {
  /**
   * Visual gap left where a secondary divider stops short of a perpendicular
   * higher-priority divider (clean LEGO T-junction spacing).
   */
  junctionGap?: number;
}

interface PartitionBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PartitionTouch {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

function findGuillotineCuts(
  subset: readonly ComputedSlotRect[],
  axis: 'vertical' | 'horizontal',
): number[] {
  if (subset.length <= 1) return [];
  const eps = 0.25;
  const candidateEdges = subset
    .map((r) => (axis === 'vertical' ? r.x + r.w : r.y + r.h))
    .sort((a, b) => a - b);

  const cuts: number[] = [];
  for (let i = 0; i < candidateEdges.length; i++) {
    const edge = candidateEdges[i];
    if (i > 0 && Math.abs(edge - candidateEdges[i - 1]) <= eps) continue;

    let beforeCount = 0;
    let afterCount = 0;
    let maxBefore = -Infinity;
    let minAfter = Infinity;

    for (let j = 0; j < subset.length; j++) {
      const r = subset[j];
      const start = axis === 'vertical' ? r.x : r.y;
      const end = axis === 'vertical' ? r.x + r.w : r.y + r.h;
      if (end <= edge + eps) {
        beforeCount++;
        if (end > maxBefore) maxBefore = end;
      } else if (start >= edge - eps) {
        afterCount++;
        if (start < minAfter) minAfter = start;
      } else {
        // A slot rectangle crosses this candidate boundary — not a valid guillotine cut.
        beforeCount = -1;
        break;
      }
    }

    if (beforeCount > 0 && afterCount > 0 && beforeCount + afterCount === subset.length) {
      const mid = (maxBefore + minAfter) / 2;
      if (cuts.length === 0 || Math.abs(mid - cuts[cuts.length - 1]) > eps) {
        cuts.push(mid);
      }
    }
  }
  return cuts;
}

/**
 * Computes LEGO-style divider lines between step slots inside `(0, 0) .. (contentW, contentH)`
 * using pure recursive guillotine partitioning over the computed slot rectangles.
 *
 * Line priority follows the page's step reading orientation (`flow`):
 * - **Column-first (`'column'`, default)**: Vertical dividers between columns take
 *   priority and span continuously; vertically stacked steps inside a column flow
 *   top-to-bottom without horizontal lines between them (matching official LEGO
 *   multi-step layouts like `60↓61 | 62↓63` and `3↓4 | 5`). When no full-height
 *   vertical cut exists (e.g. a full-width top/bottom hero step or a single-column
 *   portrait page), a full-width horizontal divider is emitted first and any
 *   side-by-side companion steps receive clean gapped vertical dividers.
 * - **Row-first (`'row'`)**: Horizontal dividers between rows take priority and span
 *   continuously; side-by-side steps within each row receive clean secondary vertical
 *   dividers stopping short of the horizontal line (`junctionGap`). When no full-width
 *   horizontal cut exists (e.g. side-by-side `2×1` or full-height left/right hero),
 *   a full-height vertical divider is emitted first and stacked companion rows receive
 *   clean gapped horizontal dividers.
 *
 * Used identically by the Live Studio renderer, Page Setup previews, and PDF export.
 */
export function computePageDividerLines(
  rects: readonly ComputedSlotRect[],
  contentW: number,
  contentH: number,
  flow: StepFlowDirection = 'column',
  options?: PageDividerLineOptions,
): PageDividerLine[] {
  if (!rects || rects.length <= 1) return [];
  const W = Math.max(1, contentW);
  const H = Math.max(1, contentH);
  const junctionGap = Math.max(0, Number(options?.junctionGap) || 0);
  const lines: PageDividerLine[] = [];

  const partition = (
    subset: readonly ComputedSlotRect[],
    bounds: PartitionBounds,
    touch: PartitionTouch,
    level: number,
  ): void => {
    if (subset.length <= 1) return;

    const vCuts = findGuillotineCuts(subset, 'vertical');
    const hCuts = findGuillotineCuts(subset, 'horizontal');

    const emitVertical = (cuts: readonly number[]) => {
      const y1 = bounds.y + (touch.top ? junctionGap : 0);
      const y2 = bounds.y + bounds.h - (touch.bottom ? junctionGap : 0);
      for (const x of cuts) {
        if (y2 > y1 + 0.5) {
          lines.push({ orientation: 'vertical', level, x1: x, y1, x2: x, y2 });
        }
      }

      const edges = [bounds.x, ...cuts, bounds.x + bounds.w];
      for (let i = 0; i < edges.length - 1; i++) {
        const lo = edges[i];
        const hi = edges[i + 1];
        const strip = subset.filter((r) => {
          const cx = r.x + r.w * 0.5;
          return cx >= lo && cx <= hi;
        });
        if (strip.length <= 1) continue;

        // In column-first flow, vertically stacked steps within a single column flow
        // naturally top-to-bottom without horizontal lines between them; only recurse
        // if the strip itself contains further side-by-side sub-columns.
        if (flow === 'column' && findGuillotineCuts(strip, 'vertical').length === 0) {
          continue;
        }

        const stripBounds: PartitionBounds = {
          x: lo,
          y: bounds.y,
          w: hi - lo,
          h: bounds.h,
        };
        const stripTouch: PartitionTouch = {
          left: i > 0 || touch.left,
          right: i < cuts.length || touch.right,
          top: touch.top,
          bottom: touch.bottom,
        };
        partition(strip, stripBounds, stripTouch, level + 1);
      }
    };

    const emitHorizontal = (cuts: readonly number[]) => {
      const x1 = bounds.x + (touch.left ? junctionGap : 0);
      const x2 = bounds.x + bounds.w - (touch.right ? junctionGap : 0);
      for (const y of cuts) {
        if (x2 > x1 + 0.5) {
          lines.push({ orientation: 'horizontal', level, x1, y1: y, x2, y2: y });
        }
      }

      const edges = [bounds.y, ...cuts, bounds.y + bounds.h];
      for (let i = 0; i < edges.length - 1; i++) {
        const lo = edges[i];
        const hi = edges[i + 1];
        const strip = subset.filter((r) => {
          const cy = r.y + r.h * 0.5;
          return cy >= lo && cy <= hi;
        });
        if (strip.length <= 1) continue;

        const stripBounds: PartitionBounds = {
          x: bounds.x,
          y: lo,
          w: bounds.w,
          h: hi - lo,
        };
        const stripTouch: PartitionTouch = {
          left: touch.left,
          right: touch.right,
          top: i > 0 || touch.top,
          bottom: i < cuts.length || touch.bottom,
        };
        partition(strip, stripBounds, stripTouch, level + 1);
      }
    };

    // When forced to fall back to the secondary axis (because a spanning slot blocks
    // any full-span primary-axis cut), keep only the secondary cuts needed to isolate
    // the spanning blocker(s). Consecutive bands whose union admits a primary-axis cut
    // stay merged so recursion immediately restores primary-axis divider priority.
    const filterFallbackCuts = (
      cuts: readonly number[],
      secondaryAxis: 'vertical' | 'horizontal',
      primaryAxis: 'vertical' | 'horizontal',
    ): number[] => {
      if (cuts.length <= 1) return [...cuts];
      const rangeStart = secondaryAxis === 'vertical' ? bounds.x : bounds.y;
      const rangeEnd = secondaryAxis === 'vertical' ? bounds.x + bounds.w : bounds.y + bounds.h;
      const edges = [rangeStart, ...cuts, rangeEnd];
      const bands: ComputedSlotRect[][] = [];
      for (let i = 0; i < edges.length - 1; i++) {
        const lo = edges[i];
        const hi = edges[i + 1];
        bands.push(
          subset.filter((r) => {
            const c = secondaryAxis === 'vertical' ? r.x + r.w * 0.5 : r.y + r.h * 0.5;
            return c >= lo && c <= hi;
          }),
        );
      }
      const keptCuts: number[] = [];
      let activeGroup: ComputedSlotRect[] = bands[0] ? [...bands[0]] : [];
      for (let i = 1; i < bands.length; i++) {
        const nextBand = bands[i];
        const merged = [...activeGroup, ...nextBand];
        if (
          activeGroup.length > 0 &&
          nextBand.length > 0 &&
          findGuillotineCuts(merged, primaryAxis).length > 0
        ) {
          activeGroup = merged;
        } else {
          keptCuts.push(cuts[i - 1]);
          activeGroup = [...nextBand];
        }
      }
      return keptCuts;
    };

    if (flow === 'row') {
      if (hCuts.length > 0) emitHorizontal(hCuts);
      else if (vCuts.length > 0) emitVertical(filterFallbackCuts(vCuts, 'vertical', 'horizontal'));
    } else {
      if (vCuts.length > 0) emitVertical(vCuts);
      else if (hCuts.length > 0) emitHorizontal(filterFallbackCuts(hCuts, 'horizontal', 'vertical'));
    }
  };

  partition(
    rects,
    { x: 0, y: 0, w: W, h: H },
    { left: false, right: false, top: false, bottom: false },
    0,
  );

  return lines;
}

/**
 * Resolves the effective step separation style for a page, honoring any
 * StepLayoutGroup override (`stepBorderStyle` or legacy `showStepBorders`)
 * before falling back to the active theme's `stepBorderStyle`.
 */
export function resolveEffectiveStepBorderStyle(
  group: Pick<StepLayoutGroup, 'stepBorderStyle' | 'showStepBorders'> | null | undefined,
  fallback: StepBorderStyle = 'lines',
): StepBorderStyle {
  if (
    group?.stepBorderStyle === 'lines' ||
    group?.stepBorderStyle === 'boxes' ||
    group?.stepBorderStyle === 'none'
  ) {
    return group.stepBorderStyle;
  }
  if (typeof group?.showStepBorders === 'boolean') {
    return group.showStepBorders ? 'boxes' : 'none';
  }
  return fallback === 'boxes' || fallback === 'none' ? fallback : 'lines';
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
    const stepBorderStyle: StepBorderStyle | null =
      obj.stepBorderStyle === 'lines' ||
      obj.stepBorderStyle === 'boxes' ||
      obj.stepBorderStyle === 'none'
        ? obj.stepBorderStyle
        : null;
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
      stepBorderStyle,
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

  if (spec.flow === 'row') {
    parts.push('Rows →');
  } else if (spec.cols !== 'auto' || spec.rows !== 'auto') {
    parts.push('Columns ↓');
  }

  if (spec.mixedLayout === 'hero_left') parts.push('Large Left');
  else if (spec.mixedLayout === 'hero_top') parts.push('Large Top');
  else if (spec.mixedLayout === 'hero_right') parts.push('Large Right');
  else if (spec.mixedLayout === 'custom_weights') parts.push('Mixed Sizes');

  return parts.join(' · ');
}

// =========================================================================
// PHYSICAL SMART AUTO GRID & PAGE-SIZE READABILITY VALIDATION
// =========================================================================

export const CM_PER_INCH = 2.54;
export const LDU_PER_STUD = 20;
/** Exact orthographic half-height framing margin used by WebGLBrickEngine.computeMVP (`mesh.radius * 1.12 / zoom`). */
export const STEP_CAMERA_RADIUS_MARGIN = 1.12;

/** Minimum physical 3D step visual area (excluding margins/padding & header chrome): 1" × 1". */
export const SMART_AUTO_MIN_STEP_AREA_WIDTH_IN = 1.0;
export const SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN = 1.0;

/** Minimum physical rendered size of 1 LEGO stud (20 LDU): 0.5 cm. */
export const SMART_AUTO_MIN_STUD_SIZE_CM = 0.5;

export interface BoundingSphereLdu {
  center: Vec3;
  radius: number;
  /** Axis-aligned union world bounds of the input boxes (when non-empty). */
  bounds?: WorldBounds3D;
}

export interface SmartAutoPageContext {
  /** Full physical page width in inches. */
  pageWidthIn: number;
  /** Full physical page height in inches. */
  pageHeightIn: number;
  /** Usable step grid width in inches (after outer page margins). */
  gridWidthIn: number;
  /** Usable step grid height in inches (after outer page margins, footer, and optional submodel intro banner). */
  gridHeightIn: number;
  /** Physical gap between adjacent step slots in inches. */
  gapIn: number;
  /** Internal slot padding on each edge in inches. */
  slotPadIn: number;
  /** Scale factor from computePageTypography (relative to 8.5" US Letter short side). */
  typeScale: number;
  /** Minimum 3D step visual width in inches (default 1.0"). */
  minStepAreaWidthIn: number;
  /** Minimum 3D step visual height in inches (default 1.0"). */
  minStepAreaHeightIn: number;
  /** Minimum rendered 1-stud size in cm (default 0.5 cm). */
  minStudSizeCm: number;
}

export interface SmartAutoStepMetric {
  stepId: string;
  stepNum: number;
  absStepNum?: number;
  /** Orthographic camera framing radius in LDU (from computeStepCameraFraming). */
  viewRadiusLdu: number;
  /** Projected half-width along camera right axis in LDU (from computeProjectedOrthoHalfExtents). */
  projHalfWLdu?: number;
  /** Projected half-height along camera up axis in LDU (from computeProjectedOrthoHalfExtents). */
  projHalfHLdu?: number;
  /** User/override step zoom multiplier (default 1.0, clamped >= 0.4). */
  modelScale?: number;
  /** Distinct (partId, colorId) entries rendered in the step's PLI box (0..7). */
  pliUniqueCount?: number;
  /** True when the step renders an inline subassembly callout box inside the slot. */
  hasInlineCallout?: boolean;
  calloutDir?: 'horizontal' | 'vertical';
  /** True when the step renders a side-by-side 1:1 minifigure reference card. */
  hasMinifig1to1?: boolean;
  /** True when the step renders a bottom minifigure pose legend strip. */
  hasPoseLegend?: boolean;
  /** True for official exploded/sequential minifigure diagrams (no standard PLI header). */
  isOfficialMinifigStyle?: boolean;
  /** True when this step poses a minifigure right before attaching it. */
  isMinifigPoseStep?: boolean;
  /** True when this step places a minifigure onto the model. */
  hasAttachedMinifig?: boolean;
}

export interface StepSlotPhysicalEvaluation {
  slotWidthIn: number;
  slotHeightIn: number;
  modelAreaWidthIn: number;
  modelAreaHeightIn: number;
  studSizeCm: number;
  meetsMinArea: boolean;
  meetsMinStudSize: boolean;
  fits: boolean;
  /** Minimum slot width in inches needed to satisfy both constraints for this step. */
  requiredSlotWidthIn: number;
  /** Minimum slot height in inches needed to satisfy both constraints for this step. */
  requiredSlotHeightIn: number;
}

export interface SmartAutoGridResolution {
  cols: number;
  rows: number;
  fits: boolean;
  minStudSizeCm: number;
  minModelWidthIn: number;
  minModelHeightIn: number;
  slotWidthIn: number;
  slotHeightIn: number;
  worstEval: StepSlotPhysicalEvaluation;
}

export interface SmartAutoPageGroupResult {
  /** Number of steps packed onto this page (>= 1). */
  count: number;
  /** Optimal grid dimensions for the packed steps. */
  grid: ResolvedGridDims;
  /** False when even 1 step cannot meet minimum area & stud size at this page size. */
  fits: boolean;
  /** Evaluation of the tightest step on the page (or 1×1 fallback when fits === false). */
  worstEval: StepSlotPhysicalEvaluation;
}

export interface PageSizeStepCheck {
  metric: SmartAutoStepMetric;
  pageId?: string;
  pageNum?: number;
  hasSubmodelIntro?: boolean;
}

export interface PageSizeViolation {
  stepId: string;
  stepNum: number;
  absStepNum?: number;
  pageId?: string;
  pageNum?: number;
  reason: 'area' | 'stud_size' | 'both';
  studSizeCm: number;
  minStudSizeCm: number;
  modelAreaWidthIn: number;
  modelAreaHeightIn: number;
  minStepAreaWidthIn: number;
  minStepAreaHeightIn: number;
  requiredSlotWidthIn: number;
  requiredSlotHeightIn: number;
}

export interface SuggestedPageSize {
  formatId: string;
  name: string;
  shortName: string;
  orientation: 'landscape' | 'portrait' | null;
  widthIn: number;
  heightIn: number;
  label: string;
}

export interface PageSizeWarningSummary {
  hasWarning: boolean;
  affectedStepCount: number;
  affectedPageIds: string[];
  violations: PageSizeViolation[];
  worstViolation: PageSizeViolation | null;
  /** Up to 2 smallest larger standard paper formats that satisfy all steps. */
  suggestedFormats: SuggestedPageSize[];
  /** Minimum custom page dimensions (in inches) that satisfy every step on a 1-up page. */
  minRequiredPageWidthIn: number;
  minRequiredPageHeightIn: number;
  /** Detailed warning copy for Page Setup & Page contextual card. */
  message: string;
  /** Compact single-line warning copy for the floating workspace banner. */
  shortMessage: string;
}

/**
 * Computes the bounding sphere `(center, radius)` of one or two lists of `WorldBox`es,
 * matching `buildMeshBuffers`'s union-AABB center + farthest-corner radius without
 * allocating GPU buffers or copying box arrays.
 */
export function computeBoundingSphereFromBoxLists(
  firstBoxes: readonly WorldBox[],
  secondBoxes: readonly WorldBox[] = [],
  minRadius = 20,
): BoundingSphereLdu {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  const scanUnion = (list: readonly WorldBox[]) => {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!b) continue;
      if (b.min[0] < minX) minX = b.min[0];
      if (b.min[1] < minY) minY = b.min[1];
      if (b.min[2] < minZ) minZ = b.min[2];
      if (b.max[0] > maxX) maxX = b.max[0];
      if (b.max[1] > maxY) maxY = b.max[1];
      if (b.max[2] > maxZ) maxZ = b.max[2];
    }
  };

  scanUnion(firstBoxes);
  scanUnion(secondBoxes);

  if (!Number.isFinite(minX)) {
    return { center: [0, 0, 0], radius: Math.max(1, minRadius) };
  }

  const cx = (minX + maxX) * 0.5;
  const cy = (minY + maxY) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  let maxR2 = 0;

  const scanRadius = (list: readonly WorldBox[]) => {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (!b) continue;
      const dx = Math.max(Math.abs(b.min[0] - cx), Math.abs(b.max[0] - cx));
      const dy = Math.max(Math.abs(b.min[1] - cy), Math.abs(b.max[1] - cy));
      const dz = Math.max(Math.abs(b.min[2] - cz), Math.abs(b.max[2] - cz));
      const r2 = dx * dx + dy * dy + dz * dz;
      if (r2 > maxR2) maxR2 = r2;
    }
  };

  scanRadius(firstBoxes);
  scanRadius(secondBoxes);

  return {
    center: [cx, cy, cz],
    radius: Math.max(minRadius, Math.sqrt(maxR2)),
    bounds: { minX, minY, minZ, maxX, maxY, maxZ },
  };
}

/**
 * Builds the physical inch-space layout context for a page using the exact same
 * print-calibrated margins, gaps, footer, and slot padding as `computePageTypography`.
 */
export function buildSmartAutoPageContext(params: {
  pageWidthIn: number;
  pageHeightIn: number;
  density?: PageDensity | string;
  hasSubmodelIntro?: boolean;
  minStepAreaWidthIn?: number;
  minStepAreaHeightIn?: number;
  minStudSizeCm?: number;
}): SmartAutoPageContext {
  const safeW = Math.max(0.5, Number.isFinite(params.pageWidthIn) ? params.pageWidthIn : 11);
  const safeH = Math.max(0.5, Number.isFinite(params.pageHeightIn) ? params.pageHeightIn : 8.5);
  const typo = computePageTypography({
    widthIn: safeW,
    heightIn: safeH,
    pxPerInch: 72,
    density: params.density,
  });

  const padIn = typo.pad / 72;
  const gapIn = typo.gap / 72;
  const footerIn = typo.footerH / 72;
  const introIn = params.hasSubmodelIntro
    ? (typo.steps.introThumbH + typo.pt(20)) / 72
    : 0;
  const slotPadIn = typo.steps.slotPad / 72;

  return {
    pageWidthIn: safeW,
    pageHeightIn: safeH,
    gridWidthIn: Math.max(0, safeW - padIn * 2),
    gridHeightIn: Math.max(0, safeH - padIn * 2 - footerIn - introIn),
    gapIn,
    slotPadIn,
    typeScale: typo.typeScale,
    minStepAreaWidthIn: Math.max(
      0.25,
      params.minStepAreaWidthIn ?? SMART_AUTO_MIN_STEP_AREA_WIDTH_IN,
    ),
    minStepAreaHeightIn: Math.max(
      0.25,
      params.minStepAreaHeightIn ?? SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN,
    ),
    minStudSizeCm: Math.max(0.1, params.minStudSizeCm ?? SMART_AUTO_MIN_STUD_SIZE_CM),
  };
}

/**
 * Computes the physical printed length (in cm) of 1 LEGO stud (20 LDU) inside a
 * step's 3D render box `(modelAreaWidthIn × modelAreaHeightIn)` under the exact
 * aspect-fitted orthographic projection used by `computeStepOrthoFrustum` /
 * `WebGLBrickEngine.computeMVP` + `object-contain`.
 *
 * When `projHalfWLdu` and `projHalfHLdu` are omitted, falls back to isotropic
 * `viewRadiusLdu` on both axes.
 */
export function computeRenderedStudSizeCm(
  modelAreaWidthIn: number,
  modelAreaHeightIn: number,
  viewRadiusLdu: number,
  modelScale = 1.0,
  projHalfWLdu?: number,
  projHalfHLdu?: number,
): number {
  const safeW = Math.max(0, Number.isFinite(modelAreaWidthIn) ? modelAreaWidthIn : 0);
  const safeH = Math.max(0, Number.isFinite(modelAreaHeightIn) ? modelAreaHeightIn : 0);
  const safeZoom = Math.max(0.4, Number.isFinite(modelScale) ? modelScale : 1.0);
  const safeRadius = Math.max(20, Number.isFinite(viewRadiusLdu) ? viewRadiusLdu : 20);
  const effHalfW = Math.max(
    12,
    typeof projHalfWLdu === 'number' && Number.isFinite(projHalfWLdu) ? projHalfWLdu : safeRadius,
  );
  const effHalfH = Math.max(
    12,
    typeof projHalfHLdu === 'number' && Number.isFinite(projHalfHLdu) ? projHalfHLdu : safeRadius,
  );
  const inPerLduW = safeW / (2 * STEP_CAMERA_RADIUS_MARGIN * effHalfW);
  const inPerLduH = safeH / (2 * STEP_CAMERA_RADIUS_MARGIN * effHalfH);
  return LDU_PER_STUD * CM_PER_INCH * Math.min(inPerLduW, inPerLduH) * safeZoom;
}

/**
 * Exact inverse of `computeRenderedStudSizeCm` along a single axis: returns the
 * minimum physical model-area side (in inches) required for a projected half-extent
 * `halfExtentLdu` so that 1 stud renders at least `minStudSizeCm` centimeters.
 */
export function computeRequiredModelSideForStudCm(
  halfExtentLdu: number,
  modelScale = 1.0,
  minStudSizeCm = SMART_AUTO_MIN_STUD_SIZE_CM,
): number {
  const safeZoom = Math.max(0.4, Number.isFinite(modelScale) ? modelScale : 1.0);
  const safeHalf = Math.max(12, Number.isFinite(halfExtentLdu) ? halfExtentLdu : 20);
  return (
    (Math.max(0.1, minStudSizeCm) * 2 * STEP_CAMERA_RADIUS_MARGIN * safeHalf) /
    (LDU_PER_STUD * CM_PER_INCH * safeZoom)
  );
}

/**
 * Evaluates whether a single step fits inside a slot of physical size
 * `(slotWidthIn × slotHeightIn)` while satisfying BOTH:
 * 1. Minimum 3D step area (default `1" × 1"`) + slot margins, header/PLI & callout chrome
 * 2. Minimum rendered piece scale (default `1 stud ≥ 0.5 cm`)
 */
export function evaluateStepInSlot(
  step: SmartAutoStepMetric,
  slotWidthIn: number,
  slotHeightIn: number,
  ctx: SmartAutoPageContext,
  slotCount = 1,
): StepSlotPhysicalEvaluation {
  const safeSlotW = Math.max(0, slotWidthIn);
  const safeSlotH = Math.max(0, slotHeightIn);
  const ts = ctx.typeScale;
  const isTight =
    slotCount >= 4 || safeSlotH < (250 / 72) * ts || safeSlotW < (230 / 72) * ts;
  const slotPadIn = ctx.slotPadIn;

  // Inline subassembly callout box reserve
  let calloutReserveWIn = 0;
  let calloutReserveHIn = 0;
  const calloutGapIn = (6 / 72) * ts;
  if (step.hasInlineCallout && !step.isOfficialMinifigStyle) {
    if (step.calloutDir === 'vertical') {
      calloutReserveHIn = Math.min(safeSlotH * 0.36, 1.15 * ts) + calloutGapIn;
    } else {
      const targetW = ((isTight ? 92 : 115) / 72) * ts;
      calloutReserveWIn = Math.min(safeSlotW * 0.42, targetW) + calloutGapIn;
    }
  }

  // Side-by-side 1:1 minifigure reference card reserve
  const mf1to1ReserveWIn = step.hasMinifig1to1 ? Math.min(safeSlotW * 0.34, 1.35) : 0;

  // Step number + PLI header reserve (including natural wrapping for multi-SKU steps)
  let headerHIn = 0;
  let singleRowHeaderHIn = 0;
  if (step.isOfficialMinifigStyle) {
    headerHIn = slotCount > 1 ? ((7.5 * 1.8) / 72) * ts : 0;
    singleRowHeaderHIn = headerHIn;
  } else {
    const pliThumbIn = ((isTight ? 20 : 25) / 72) * ts;
    const singlePliRowHIn = pliThumbIn + (10 / 72) * ts;
    const headerGapIn = (8 / 72) * ts;
    singleRowHeaderHIn = singlePliRowHIn + headerGapIn;
    const pliCount = Math.max(0, Math.min(7, Math.round(step.pliUniqueCount ?? 1)));
    const stepNumPt = isTight ? 15 : slotCount === 1 ? 21 : 17.5;
    const stepNumWIn = ((stepNumPt * 1.3) / 72) * ts;
    const availPliWIn = Math.max(0.35, safeSlotW - slotPadIn * 2 - stepNumWIn - (8 / 72) * ts);
    const chipWIn = pliThumbIn + (20 / 72) * ts;
    const chipsPerRow = Math.max(1, Math.floor(availPliWIn / Math.max(0.3, chipWIn)));
    const pliRows = pliCount <= 1 ? 1 : Math.min(3, Math.ceil(pliCount / chipsPerRow));
    const rawHeaderHIn = singlePliRowHIn * (1 + (pliRows - 1) * 0.72) + headerGapIn;
    headerHIn =
      pliRows > 1 ? Math.min(rawHeaderHIn, Math.max(singleRowHeaderHIn, safeSlotH * 0.36)) : singleRowHeaderHIn;
  }

  const poseLegendHIn = step.hasPoseLegend ? (22 / 72) * ts : 0;

  const modelAreaWidthIn = Math.max(0, safeSlotW - slotPadIn * 2 - calloutReserveWIn - mf1to1ReserveWIn);
  const modelAreaHeightIn = Math.max(
    0,
    safeSlotH - slotPadIn * 2 - headerHIn - calloutReserveHIn - poseLegendHIn,
  );

  const modelScale = Math.max(0.4, Number.isFinite(step.modelScale) ? step.modelScale! : 1.0);
  const studSizeCm = computeRenderedStudSizeCm(
    modelAreaWidthIn,
    modelAreaHeightIn,
    step.viewRadiusLdu,
    modelScale,
    step.projHalfWLdu,
    step.projHalfHLdu,
  );

  const meetsMinArea =
    modelAreaWidthIn >= ctx.minStepAreaWidthIn - 1e-4 &&
    modelAreaHeightIn >= ctx.minStepAreaHeightIn - 1e-4;
  const meetsMinStudSize = studSizeCm >= ctx.minStudSizeCm - 1e-4;

  // Minimum slot footprint needed to satisfy both constraints (1-row PLI baseline)
  const safeRadius = Math.max(20, Number.isFinite(step.viewRadiusLdu) ? step.viewRadiusLdu : 20);
  const effHalfW =
    typeof step.projHalfWLdu === 'number' && Number.isFinite(step.projHalfWLdu)
      ? Math.max(12, step.projHalfWLdu)
      : safeRadius;
  const effHalfH =
    typeof step.projHalfHLdu === 'number' && Number.isFinite(step.projHalfHLdu)
      ? Math.max(12, step.projHalfHLdu)
      : safeRadius;
  const reqModelW = Math.max(
    ctx.minStepAreaWidthIn,
    computeRequiredModelSideForStudCm(effHalfW, modelScale, ctx.minStudSizeCm),
  );
  const reqModelH = Math.max(
    ctx.minStepAreaHeightIn,
    computeRequiredModelSideForStudCm(effHalfH, modelScale, ctx.minStudSizeCm),
  );
  const reqCalloutW =
    step.hasInlineCallout && !step.isOfficialMinifigStyle && step.calloutDir !== 'vertical'
      ? (115 / 72) * ts + calloutGapIn
      : 0;
  const reqCalloutH =
    step.hasInlineCallout && !step.isOfficialMinifigStyle && step.calloutDir === 'vertical'
      ? 1.15 * ts + calloutGapIn
      : 0;
  const reqMf1to1W = step.hasMinifig1to1 ? 1.35 : 0;

  const requiredSlotWidthIn = reqModelW + slotPadIn * 2 + reqCalloutW + reqMf1to1W;
  const requiredSlotHeightIn =
    reqModelH + slotPadIn * 2 + singleRowHeaderHIn + reqCalloutH + poseLegendHIn;

  return {
    slotWidthIn: safeSlotW,
    slotHeightIn: safeSlotH,
    modelAreaWidthIn,
    modelAreaHeightIn,
    studSizeCm,
    meetsMinArea,
    meetsMinStudSize,
    fits: meetsMinArea && meetsMinStudSize,
    requiredSlotWidthIn,
    requiredSlotHeightIn,
  };
}

/**
 * Finds the best tight `(cols, rows)` grid for `steps` on a page with physical
 * context `ctx` and Step Proportions `spec` where EVERY step meets both minimum
 * step area and minimum rendered stud size.
 *
 * - For `'even'` and `'custom_weights'`, `(cols, rows)` is the full page grid.
 * - For `'hero_left' | 'hero_right' | 'hero_top'`, `(cols, rows)` is the companion
 *   sub-grid for the `k - 1` companion steps alongside the featured hero step.
 *
 * Returns `fits: false` (with the 1×1 evaluation) when no valid grid satisfies all steps.
 */
export function findBestSmartAutoGridForSteps(
  steps: readonly SmartAutoStepMetric[],
  ctx: SmartAutoPageContext,
  spec?: Pick<PageLayoutSpec, 'mixedLayout' | 'flow' | 'slotSizes'> | null,
): SmartAutoGridResolution {
  const k = steps.length;
  const mixedLayout: MixedLayoutStyle = spec?.mixedLayout ?? 'even';
  const isHero =
    mixedLayout === 'hero_left' || mixedLayout === 'hero_right' || mixedLayout === 'hero_top';
  const isCustomWeights = mixedLayout === 'custom_weights';
  const fullSpec: PageLayoutSpec = {
    mode: 'auto',
    stepsPerPage: Math.max(1, k),
    cols: 'auto',
    rows: 'auto',
    flow: spec?.flow === 'row' ? 'row' : 'column',
    mixedLayout,
    slotSizes: spec?.slotSizes || [],
  };
  const isLandscape = ctx.gridWidthIn >= ctx.gridHeightIn;
  const PT = 72;

  if (k <= 0) {
    const fallbackStep: SmartAutoStepMetric = { stepId: '', stepNum: 1, viewRadiusLdu: 40 };
    const ev = evaluateStepInSlot(fallbackStep, ctx.gridWidthIn, ctx.gridHeightIn, ctx, 1);
    return {
      cols: 1,
      rows: 1,
      fits: ev.fits,
      minStudSizeCm: ev.studSizeCm,
      minModelWidthIn: ev.modelAreaWidthIn,
      minModelHeightIn: ev.modelAreaHeightIn,
      slotWidthIn: ev.slotWidthIn,
      slotHeightIn: ev.slotHeightIn,
      worstEval: ev,
    };
  }

  const evalRects = (cols: number, rows: number, rectsIn: readonly { slotIndex: number; w: number; h: number }[]) => {
    let allFit = true;
    let minStud = Infinity;
    let minModelW = Infinity;
    let minModelH = Infinity;
    let minModelSide = Infinity;
    let minSlotW = Infinity;
    let minSlotH = Infinity;
    let worstEval: StepSlotPhysicalEvaluation | null = null;

    for (let i = 0; i < rectsIn.length; i++) {
      const r = rectsIn[i];
      const step = steps[r.slotIndex];
      if (!step) continue;
      const ev = evaluateStepInSlot(step, r.w, r.h, ctx, k);
      if (!ev.fits) allFit = false;
      if (ev.studSizeCm < minStud) minStud = ev.studSizeCm;
      if (ev.modelAreaWidthIn < minModelW) minModelW = ev.modelAreaWidthIn;
      if (ev.modelAreaHeightIn < minModelH) minModelH = ev.modelAreaHeightIn;
      if (r.w < minSlotW) minSlotW = r.w;
      if (r.h < minSlotH) minSlotH = r.h;
      const side = Math.min(ev.modelAreaWidthIn, ev.modelAreaHeightIn);
      if (side < minModelSide) minModelSide = side;
      if (
        !worstEval ||
        (!ev.fits && worstEval.fits) ||
        (ev.fits === worstEval.fits && ev.studSizeCm < worstEval.studSizeCm)
      ) {
        worstEval = ev;
      }
    }

    return {
      cols,
      rows,
      fits: allFit,
      minStudSizeCm: minStud,
      minModelWidthIn: minModelW,
      minModelHeightIn: minModelH,
      minModelSide,
      slotWidthIn: minSlotW,
      slotHeightIn: minSlotH,
      worstEval: worstEval!,
    };
  };

  const evalGrid = (cols: number, rows: number) => {
    if (!isHero && !isCustomWeights) {
      const slotW = (ctx.gridWidthIn - ctx.gapIn * (cols - 1)) / cols;
      const slotH = (ctx.gridHeightIn - ctx.gapIn * (rows - 1)) / rows;
      let allFit = true;
      let minStud = Infinity;
      let minModelW = Infinity;
      let minModelH = Infinity;
      let minModelSide = Infinity;
      let worstEval: StepSlotPhysicalEvaluation | null = null;

      for (let i = 0; i < k; i++) {
        const ev = evaluateStepInSlot(steps[i], slotW, slotH, ctx, k);
        if (!ev.fits) allFit = false;
        if (ev.studSizeCm < minStud) minStud = ev.studSizeCm;
        if (ev.modelAreaWidthIn < minModelW) minModelW = ev.modelAreaWidthIn;
        if (ev.modelAreaHeightIn < minModelH) minModelH = ev.modelAreaHeightIn;
        const side = Math.min(ev.modelAreaWidthIn, ev.modelAreaHeightIn);
        if (side < minModelSide) minModelSide = side;
        if (
          !worstEval ||
          (!ev.fits && worstEval.fits) ||
          (ev.fits === worstEval.fits && ev.studSizeCm < worstEval.studSizeCm)
        ) {
          worstEval = ev;
        }
      }

      return {
        cols,
        rows,
        fits: allFit,
        minStudSizeCm: minStud,
        minModelWidthIn: minModelW,
        minModelHeightIn: minModelH,
        minModelSide,
        slotWidthIn: slotW,
        slotHeightIn: slotH,
        worstEval: worstEval!,
      };
    }

    const ptRects = computePageSlotRects(
      k,
      fullSpec,
      isLandscape,
      ctx.gridWidthIn * PT,
      ctx.gridHeightIn * PT,
      ctx.gapIn * PT,
      { cols, rows },
    );
    return evalRects(
      cols,
      rows,
      ptRects.map((r) => ({ slotIndex: r.slotIndex, w: r.w / PT, h: r.h / PT })),
    );
  };

  if (k === 1) {
    const single = evalGrid(1, 1);
    return {
      cols: 1,
      rows: 1,
      fits: single.fits,
      minStudSizeCm: single.minStudSizeCm,
      minModelWidthIn: single.minModelWidthIn,
      minModelHeightIn: single.minModelHeightIn,
      slotWidthIn: single.slotWidthIn,
      slotHeightIn: single.slotHeightIn,
      worstEval: single.worstEval,
    };
  }

  const minRawCellW = ctx.minStepAreaWidthIn + ctx.slotPadIn * 2;
  const minRawCellH = ctx.minStepAreaHeightIn + ctx.slotPadIn * 2;

  let searchCount = k;
  let regionWIn = ctx.gridWidthIn;
  let regionHIn = ctx.gridHeightIn;
  if (isHero) {
    searchCount = k - 1;
    const heroRatio = k === 2 ? 0.62 : k === 3 ? 0.58 : 0.56;
    if (mixedLayout === 'hero_top') {
      regionHIn = Math.max(0, (ctx.gridHeightIn - ctx.gapIn) * (1 - heroRatio));
    } else {
      regionWIn = Math.max(0, (ctx.gridWidthIn - ctx.gapIn) * (1 - heroRatio));
    }
  }

  const maxCols = Math.min(
    searchCount,
    Math.max(1, Math.floor((regionWIn + ctx.gapIn) / Math.max(0.5, minRawCellW + ctx.gapIn))),
  );
  const maxRows = Math.min(
    searchCount,
    Math.max(1, Math.floor((regionHIn + ctx.gapIn) / Math.max(0.5, minRawCellH + ctx.gapIn))),
  );

  let best: SmartAutoGridResolution | null = null;
  let bestScore = -Infinity;

  for (let cols = 1; cols <= maxCols; cols++) {
    const rows = Math.ceil(searchCount / cols);
    if (rows > maxRows) continue;
    // Ensure tight grid with no completely empty column (rows already satisfies no empty row)
    if (cols > 1 && (cols - 1) * rows >= searchCount) continue;

    const cand = evalGrid(cols, rows);
    if (!cand.fits) continue;

    const aspect = cand.minModelWidthIn / Math.max(0.05, cand.minModelHeightIn);
    const idealAspect = 1.15;
    const distortion = Math.max(aspect / idealAspect, idealAspect / aspect);
    const aspectFactor = 1 / Math.pow(distortion, 0.12);
    const fillRatio = searchCount / (cols * rows);
    const fillFactor = 0.95 + 0.05 * fillRatio;
    // Primary driver is physical model scale (`minModelSide`), with mild aspect & fullness tie-breakers
    const score = cand.minModelSide * aspectFactor * fillFactor;

    if (score > bestScore + 1e-6) {
      bestScore = score;
      best = {
        cols: cand.cols,
        rows: cand.rows,
        fits: true,
        minStudSizeCm: cand.minStudSizeCm,
        minModelWidthIn: cand.minModelWidthIn,
        minModelHeightIn: cand.minModelHeightIn,
        slotWidthIn: cand.slotWidthIn,
        slotHeightIn: cand.slotHeightIn,
        worstEval: cand.worstEval,
      };
    }
  }

  if (best) return best;

  const fallback = evalGrid(1, 1);
  return {
    cols: 1,
    rows: 1,
    fits: false,
    minStudSizeCm: fallback.minStudSizeCm,
    minModelWidthIn: fallback.minModelWidthIn,
    minModelHeightIn: fallback.minModelHeightIn,
    slotWidthIn: fallback.slotWidthIn,
    slotHeightIn: fallback.slotHeightIn,
    worstEval: fallback.worstEval,
  };
}

/**
 * Greedily packs as many contiguous `eligibleSteps` onto a single Smart Auto Grid
 * page as can simultaneously satisfy BOTH minimum step area (`1" × 1"` + margins)
 * AND minimum piece scale (`1 stud ≥ 0.5 cm`) with zero artificial step cap,
 * adapting dynamically for all Step Proportions (`even`, `hero_*`, `custom_weights`).
 *
 * Always emits at least 1 step so no step is ever dropped; when even 1 step cannot
 * satisfy the physical minimums, returns `fits: false` along with its 1×1 evaluation
 * so the UI can warn the user to choose a larger page size.
 */
export function packSmartAutoPage(
  eligibleSteps: readonly SmartAutoStepMetric[],
  ctx: SmartAutoPageContext,
  spec?: Pick<PageLayoutSpec, 'mixedLayout' | 'flow' | 'slotSizes'> | null,
): SmartAutoPageGroupResult {
  if (eligibleSteps.length === 0) {
    const emptyRes = findBestSmartAutoGridForSteps([], ctx, spec);
    return {
      count: 0,
      grid: { cols: 1, rows: 1 },
      fits: emptyRes.fits,
      worstEval: emptyRes.worstEval,
    };
  }

  const firstRes = findBestSmartAutoGridForSteps([eligibleSteps[0]], ctx, spec);
  if (!firstRes.fits) {
    return {
      count: 1,
      grid: { cols: 1, rows: 1 },
      fits: false,
      worstEval: firstRes.worstEval,
    };
  }

  let bestCount = 1;
  let bestRes = firstRes;

  for (let k = 2; k <= eligibleSteps.length; k++) {
    const candidate = findBestSmartAutoGridForSteps(eligibleSteps.slice(0, k), ctx, spec);
    if (!candidate.fits) break;
    bestCount = k;
    bestRes = candidate;
  }

  // Keep a minifigure Pose + Place pair together rather than stranding Pose as the final slot
  if (
    bestCount > 1 &&
    bestCount < eligibleSteps.length &&
    eligibleSteps[bestCount - 1]?.isMinifigPoseStep &&
    eligibleSteps[bestCount]?.hasAttachedMinifig
  ) {
    const trimmed = findBestSmartAutoGridForSteps(eligibleSteps.slice(0, bestCount - 1), ctx, spec);
    if (trimmed.fits) {
      bestCount -= 1;
      bestRes = trimmed;
    }
  }

  return {
    count: bestCount,
    grid: { cols: bestRes.cols, rows: bestRes.rows },
    fits: true,
    worstEval: bestRes.worstEval,
  };
}

/**
 * Picks a representative (median physical extent) step metric from a list of steps
 * so Page Setup / Step Range Group previews reflect the actual loaded model's
 * proportions rather than a hardcoded tiny placeholder brick.
 */
export function computeRepresentativeStepMetric(
  steps: readonly SmartAutoStepMetric[],
): SmartAutoStepMetric | null {
  if (!steps || steps.length === 0) return null;
  const ranked = steps.map((step) => {
    const safeR = Math.max(20, Number.isFinite(step.viewRadiusLdu) ? step.viewRadiusLdu : 20);
    const hw =
      typeof step.projHalfWLdu === 'number' && Number.isFinite(step.projHalfWLdu)
        ? Math.max(12, step.projHalfWLdu)
        : safeR;
    const hh =
      typeof step.projHalfHLdu === 'number' && Number.isFinite(step.projHalfHLdu)
        ? Math.max(12, step.projHalfHLdu)
        : safeR;
    const zoom = Math.max(0.4, Number.isFinite(step.modelScale) ? step.modelScale! : 1.0);
    return { step, span: Math.max(hw, hh) / zoom };
  });
  ranked.sort((a, b) => a.span - b.span);
  const pick = ranked[Math.floor(ranked.length / 2)].step;
  return {
    stepId: pick.stepId || 'preview',
    stepNum: pick.stepNum || 1,
    absStepNum: pick.absStepNum,
    viewRadiusLdu: Math.max(20, Number.isFinite(pick.viewRadiusLdu) ? pick.viewRadiusLdu : 20),
    projHalfWLdu: pick.projHalfWLdu,
    projHalfHLdu: pick.projHalfHLdu,
    modelScale: pick.modelScale ?? 1.0,
    pliUniqueCount: pick.pliUniqueCount ?? 2,
    hasInlineCallout: pick.hasInlineCallout,
    calloutDir: pick.calloutDir,
    hasMinifig1to1: pick.hasMinifig1to1,
    hasPoseLegend: pick.hasPoseLegend,
    isOfficialMinifigStyle: pick.isOfficialMinifigStyle,
  };
}

/**
 * Computes the dynamic Smart Auto Grid layout for a homogeneous page of typical
 * steps at the active page size and Step Proportions (used for live Page
 * Setup & Step Range Group previews).
 *
 * Accepts either a scalar `typicalRadiusLdu` (default `45` when no model is loaded)
 * or a `Partial<SmartAutoStepMetric>` derived from the active model's actual steps.
 */
export function computeSmartAutoPreviewGrid(
  ctx: SmartAutoPageContext,
  typicalRadiusOrMetric: number | Partial<SmartAutoStepMetric> = 45,
  spec?: Pick<PageLayoutSpec, 'mixedLayout' | 'flow' | 'slotSizes'> | null,
): { cols: number; rows: number; maxSteps: number; fits: boolean } {
  const sampleStep: SmartAutoStepMetric =
    typeof typicalRadiusOrMetric === 'number'
      ? {
          stepId: 'preview',
          stepNum: 1,
          viewRadiusLdu: Math.max(20, typicalRadiusOrMetric),
          modelScale: 1.0,
          pliUniqueCount: 2,
        }
      : {
          stepId: typicalRadiusOrMetric.stepId || 'preview',
          stepNum: typicalRadiusOrMetric.stepNum || 1,
          viewRadiusLdu: Math.max(
            20,
            Number.isFinite(typicalRadiusOrMetric.viewRadiusLdu)
              ? typicalRadiusOrMetric.viewRadiusLdu!
              : 45,
          ),
          projHalfWLdu: typicalRadiusOrMetric.projHalfWLdu,
          projHalfHLdu: typicalRadiusOrMetric.projHalfHLdu,
          modelScale: typicalRadiusOrMetric.modelScale ?? 1.0,
          pliUniqueCount: typicalRadiusOrMetric.pliUniqueCount ?? 2,
          hasInlineCallout: typicalRadiusOrMetric.hasInlineCallout,
          calloutDir: typicalRadiusOrMetric.calloutDir,
          hasMinifig1to1: typicalRadiusOrMetric.hasMinifig1to1,
          hasPoseLegend: typicalRadiusOrMetric.hasPoseLegend,
          isOfficialMinifigStyle: typicalRadiusOrMetric.isOfficialMinifigStyle,
        };
  const single = evaluateStepInSlot(sampleStep, ctx.gridWidthIn, ctx.gridHeightIn, ctx, 1);
  if (!single.fits) {
    return { cols: 1, rows: 1, maxSteps: 1, fits: false };
  }

  const mixedLayout: MixedLayoutStyle = spec?.mixedLayout ?? 'even';
  const minCellW = ctx.minStepAreaWidthIn + ctx.slotPadIn * 2;
  const minCellH = ctx.minStepAreaHeightIn + ctx.slotPadIn * 2;

  if (mixedLayout === 'hero_left' || mixedLayout === 'hero_right' || mixedLayout === 'hero_top') {
    let bestCols = 1;
    let bestRows = 1;
    let bestCount = 1;
    let bestMinSide = Math.min(single.modelAreaWidthIn, single.modelAreaHeightIn);

    const maxRegionW =
      mixedLayout === 'hero_top'
        ? ctx.gridWidthIn
        : Math.max(0, (ctx.gridWidthIn - ctx.gapIn) * 0.44);
    const maxRegionH =
      mixedLayout === 'hero_top'
        ? Math.max(0, (ctx.gridHeightIn - ctx.gapIn) * 0.44)
        : ctx.gridHeightIn;
    const maxSubCols = Math.max(
      1,
      Math.floor((maxRegionW + ctx.gapIn) / Math.max(0.5, minCellW + ctx.gapIn)),
    );
    const maxSubRows = Math.max(
      1,
      Math.floor((maxRegionH + ctx.gapIn) / Math.max(0.5, minCellH + ctx.gapIn)),
    );

    for (let c = 1; c <= maxSubCols; c++) {
      for (let r = 1; r <= maxSubRows; r++) {
        const count = 1 + c * r;
        if (count < bestCount) continue;
        const heroRatio = count === 2 ? 0.62 : count === 3 ? 0.58 : 0.56;
        const heroW = mixedLayout === 'hero_top' ? ctx.gridWidthIn : (ctx.gridWidthIn - ctx.gapIn) * heroRatio;
        const heroH = mixedLayout === 'hero_top' ? (ctx.gridHeightIn - ctx.gapIn) * heroRatio : ctx.gridHeightIn;
        const sideW = mixedLayout === 'hero_top' ? ctx.gridWidthIn : ctx.gridWidthIn - ctx.gapIn - heroW;
        const sideH = mixedLayout === 'hero_top' ? ctx.gridHeightIn - ctx.gapIn - heroH : ctx.gridHeightIn;
        const compW = (sideW - ctx.gapIn * (c - 1)) / c;
        const compH = (sideH - ctx.gapIn * (r - 1)) / r;

        const heroEv = evaluateStepInSlot(sampleStep, heroW, heroH, ctx, count);
        if (!heroEv.fits) continue;
        const compEv = evaluateStepInSlot(sampleStep, compW, compH, ctx, count);
        if (!compEv.fits) continue;

        const minSide = Math.min(
          heroEv.modelAreaWidthIn,
          heroEv.modelAreaHeightIn,
          compEv.modelAreaWidthIn,
          compEv.modelAreaHeightIn,
        );
        if (count > bestCount || (count === bestCount && minSide > bestMinSide + 1e-4)) {
          bestCount = count;
          bestCols = c;
          bestRows = r;
          bestMinSide = minSide;
        }
      }
    }

    return { cols: bestCols, rows: bestRows, maxSteps: bestCount, fits: true };
  }

  const maxCols = Math.max(
    1,
    Math.floor((ctx.gridWidthIn + ctx.gapIn) / Math.max(0.5, minCellW + ctx.gapIn)),
  );
  const maxRows = Math.max(
    1,
    Math.floor((ctx.gridHeightIn + ctx.gapIn) / Math.max(0.5, minCellH + ctx.gapIn)),
  );

  let bestCols = 1;
  let bestRows = 1;
  let bestCount = 1;
  let bestMinSide = Math.min(single.modelAreaWidthIn, single.modelAreaHeightIn);

  if (mixedLayout === 'custom_weights') {
    const PT = 72;
    const isLandscape = ctx.gridWidthIn >= ctx.gridHeightIn;
    const fullSpec: PageLayoutSpec = {
      mode: 'auto',
      stepsPerPage: 1,
      cols: 'auto',
      rows: 'auto',
      flow: spec?.flow === 'row' ? 'row' : 'column',
      mixedLayout: 'custom_weights',
      slotSizes: spec?.slotSizes || [],
    };
    for (let c = 1; c <= maxCols; c++) {
      let anyRowFit = false;
      for (let r = 1; r <= maxRows; r++) {
        const count = c * r;
        const rects = computePageSlotRects(
          count,
          fullSpec,
          isLandscape,
          ctx.gridWidthIn * PT,
          ctx.gridHeightIn * PT,
          ctx.gapIn * PT,
          { cols: c, rows: r },
        );
        let allFit = true;
        let minSide = Infinity;
        for (let i = 0; i < rects.length; i++) {
          const ev = evaluateStepInSlot(sampleStep, rects[i].w / PT, rects[i].h / PT, ctx, count);
          if (!ev.fits) {
            allFit = false;
            break;
          }
          const side = Math.min(ev.modelAreaWidthIn, ev.modelAreaHeightIn);
          if (side < minSide) minSide = side;
        }
        if (!allFit) break;
        anyRowFit = true;
        if (count > bestCount || (count === bestCount && minSide > bestMinSide + 1e-4)) {
          bestCount = count;
          bestCols = c;
          bestRows = r;
          bestMinSide = minSide;
        }
      }
      if (!anyRowFit && c > 1) break;
    }
    return { cols: bestCols, rows: bestRows, maxSteps: bestCount, fits: true };
  }

  for (let c = 1; c <= maxCols; c++) {
    for (let r = 1; r <= maxRows; r++) {
      const count = c * r;
      if (count < bestCount) continue;
      const slotW = (ctx.gridWidthIn - ctx.gapIn * (c - 1)) / c;
      const slotH = (ctx.gridHeightIn - ctx.gapIn * (r - 1)) / r;
      const ev = evaluateStepInSlot(sampleStep, slotW, slotH, ctx, count);
      if (!ev.fits) continue;
      const minSide = Math.min(ev.modelAreaWidthIn, ev.modelAreaHeightIn);
      if (count > bestCount || (count === bestCount && minSide > bestMinSide + 1e-4)) {
        bestCount = count;
        bestCols = c;
        bestRows = r;
        bestMinSide = minSide;
      }
    }
  }

  return { cols: bestCols, rows: bestRows, maxSteps: bestCount, fits: true };
}

function roundUpPageDimIn(valueIn: number): number {
  if (!Number.isFinite(valueIn) || valueIn <= 0) return 2;
  if (valueIn < 6) return Math.ceil(valueIn * 10) / 10;
  return Math.ceil(valueIn * 2) / 2;
}

function formatInchesCompact(wIn: number, hIn: number): string {
  const fmt = (n: number) => (Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1));
  return `${fmt(wIn)} × ${fmt(hIn)} in`;
}

function getFormatDisplayName(
  formatId: string,
  specs: Readonly<Record<string, PaperFormatSpec>>,
  widthIn: number,
  heightIn: number,
): string {
  if (formatId === 'custom') return `Custom (${formatInchesCompact(widthIn, heightIn)})`;
  return specs[formatId]?.shortName || specs[formatId]?.name || formatId;
}

/**
 * Checks every step in the manual against the active physical page size at 1 step per page
 * (the largest possible allocation on the current sheet). Whenever any step fails
 * the minimum step area (`1" × 1"` + margins) or minimum piece size (`1 stud ≥ 0.5 cm`),
 * computes the smallest larger standard paper format(s) — or minimum Custom size —
 * that can fit every step cleanly.
 *
 * `screen` ("Screen Fit") has no fixed physical paper dimensions and supports interactive
 * zoom, so physical print-size warnings are never emitted for `'screen'`.
 */
export function analyzePageSizeFit(params: {
  stepChecks: readonly PageSizeStepCheck[];
  currentFormatId: string;
  currentOrientation: 'landscape' | 'portrait' | string;
  currentPageWidthIn: number;
  currentPageHeightIn: number;
  density?: PageDensity | string;
  minStepAreaWidthIn?: number;
  minStepAreaHeightIn?: number;
  minStudSizeCm?: number;
  paperFormatSpecs?: Readonly<Record<string, PaperFormatSpec>>;
}): PageSizeWarningSummary {
  const specs = params.paperFormatSpecs ?? PAPER_FORMAT_SPECS;
  const curW = Math.max(0.5, Number.isFinite(params.currentPageWidthIn) ? params.currentPageWidthIn : 11);
  const curH = Math.max(0.5, Number.isFinite(params.currentPageHeightIn) ? params.currentPageHeightIn : 8.5);

  // Screen Fit adapts to the display viewport (with interactive zoom) and is not a fixed
  // physical print sheet, so never nag the user to pick a larger physical paper size.
  if (params.currentFormatId === 'screen') {
    return {
      hasWarning: false,
      affectedStepCount: 0,
      affectedPageIds: [],
      violations: [],
      worstViolation: null,
      suggestedFormats: [],
      minRequiredPageWidthIn: curW,
      minRequiredPageHeightIn: curH,
      message: '',
      shortMessage: '',
    };
  }

  const curOrient: 'landscape' | 'portrait' =
    params.currentOrientation === 'portrait' ? 'portrait' : 'landscape';

  const ctxNoIntro = buildSmartAutoPageContext({
    pageWidthIn: curW,
    pageHeightIn: curH,
    density: params.density,
    hasSubmodelIntro: false,
    minStepAreaWidthIn: params.minStepAreaWidthIn,
    minStepAreaHeightIn: params.minStepAreaHeightIn,
    minStudSizeCm: params.minStudSizeCm,
  });
  const ctxWithIntro = buildSmartAutoPageContext({
    pageWidthIn: curW,
    pageHeightIn: curH,
    density: params.density,
    hasSubmodelIntro: true,
    minStepAreaWidthIn: params.minStepAreaWidthIn,
    minStepAreaHeightIn: params.minStepAreaHeightIn,
    minStudSizeCm: params.minStudSizeCm,
  });

  const violations: PageSizeViolation[] = [];
  const affectedPageIdSet = new Set<string>();
  const checksToTest: PageSizeStepCheck[] =
    params.stepChecks.length > 0
      ? [...params.stepChecks]
      : [{ metric: { stepId: 'sample', stepNum: 1, viewRadiusLdu: 20, pliUniqueCount: 1 } }];
  const hasRealSteps = params.stepChecks.length > 0;

  for (const check of checksToTest) {
    const ctx = check.hasSubmodelIntro ? ctxWithIntro : ctxNoIntro;
    const ev = evaluateStepInSlot(check.metric, ctx.gridWidthIn, ctx.gridHeightIn, ctx, 1);
    if (!ev.fits) {
      const reason: PageSizeViolation['reason'] =
        !ev.meetsMinArea && !ev.meetsMinStudSize
          ? 'both'
          : !ev.meetsMinArea
            ? 'area'
            : 'stud_size';
      violations.push({
        stepId: check.metric.stepId,
        stepNum: check.metric.stepNum,
        absStepNum: check.metric.absStepNum,
        pageId: check.pageId,
        pageNum: check.pageNum,
        reason,
        studSizeCm: ev.studSizeCm,
        minStudSizeCm: ctx.minStudSizeCm,
        modelAreaWidthIn: ev.modelAreaWidthIn,
        modelAreaHeightIn: ev.modelAreaHeightIn,
        minStepAreaWidthIn: ctx.minStepAreaWidthIn,
        minStepAreaHeightIn: ctx.minStepAreaHeightIn,
        requiredSlotWidthIn: ev.requiredSlotWidthIn,
        requiredSlotHeightIn: ev.requiredSlotHeightIn,
      });
      if (check.pageId) affectedPageIdSet.add(check.pageId);
    }
  }

  if (violations.length === 0) {
    return {
      hasWarning: false,
      affectedStepCount: 0,
      affectedPageIds: [],
      violations: [],
      worstViolation: null,
      suggestedFormats: [],
      minRequiredPageWidthIn: curW,
      minRequiredPageHeightIn: curH,
      message: '',
      shortMessage: '',
    };
  }

  // Pick worst violation (prefer area failure if all steps fail area, otherwise lowest studSizeCm)
  let worstViolation = violations[0];
  for (let i = 1; i < violations.length; i++) {
    const v = violations[i];
    if (v.studSizeCm < worstViolation.studSizeCm - 1e-4) {
      worstViolation = v;
    }
  }

  // Iteratively compute minimum Custom page dimensions that satisfy every step on a 1-up sheet
  let reqPageW = curW;
  let reqPageH = curH;
  for (let iter = 0; iter < 4; iter++) {
    const tNoIntro = buildSmartAutoPageContext({
      pageWidthIn: reqPageW,
      pageHeightIn: reqPageH,
      density: params.density,
      hasSubmodelIntro: false,
      minStepAreaWidthIn: params.minStepAreaWidthIn,
      minStepAreaHeightIn: params.minStepAreaHeightIn,
      minStudSizeCm: params.minStudSizeCm,
    });
    const tWithIntro = buildSmartAutoPageContext({
      pageWidthIn: reqPageW,
      pageHeightIn: reqPageH,
      density: params.density,
      hasSubmodelIntro: true,
      minStepAreaWidthIn: params.minStepAreaWidthIn,
      minStepAreaHeightIn: params.minStepAreaHeightIn,
      minStudSizeCm: params.minStudSizeCm,
    });
    let maxNeedW = reqPageW;
    let maxNeedH = reqPageH;
    for (const check of checksToTest) {
      const c = check.hasSubmodelIntro ? tWithIntro : tNoIntro;
      const ev = evaluateStepInSlot(check.metric, c.gridWidthIn, c.gridHeightIn, c, 1);
      if (ev.fits) continue;
      const needW = ev.requiredSlotWidthIn + (reqPageW - c.gridWidthIn);
      const needH = ev.requiredSlotHeightIn + (reqPageH - c.gridHeightIn);
      if (needW > maxNeedW) maxNeedW = needW;
      if (needH > maxNeedH) maxNeedH = needH;
    }
    reqPageW = maxNeedW;
    reqPageH = maxNeedH;
  }
  const minRequiredPageWidthIn = roundUpPageDimIn(reqPageW);
  const minRequiredPageHeightIn = roundUpPageDimIn(reqPageH);

  // Test every standard paper format to find the smallest larger options that fit ALL steps
  const curArea = curW * curH;
  const allChecksFitAt = (wIn: number, hIn: number): boolean => {
    const cNo = buildSmartAutoPageContext({
      pageWidthIn: wIn,
      pageHeightIn: hIn,
      density: params.density,
      hasSubmodelIntro: false,
      minStepAreaWidthIn: params.minStepAreaWidthIn,
      minStepAreaHeightIn: params.minStepAreaHeightIn,
      minStudSizeCm: params.minStudSizeCm,
    });
    const cIntro = buildSmartAutoPageContext({
      pageWidthIn: wIn,
      pageHeightIn: hIn,
      density: params.density,
      hasSubmodelIntro: true,
      minStepAreaWidthIn: params.minStepAreaWidthIn,
      minStepAreaHeightIn: params.minStepAreaHeightIn,
      minStudSizeCm: params.minStudSizeCm,
    });
    for (const check of checksToTest) {
      const c = check.hasSubmodelIntro ? cIntro : cNo;
      const ev = evaluateStepInSlot(check.metric, c.gridWidthIn, c.gridHeightIn, c, 1);
      if (!ev.fits) return false;
    }
    return true;
  };

  const candidates: Array<SuggestedPageSize & { area: number }> = [];

  // First check whether simply rotating the current standard paper sheet (e.g. Portrait ↔ Landscape)
  // satisfies every step — for wide/elongated or tall models this often solves the warning without
  // requiring a physically larger paper stock.
  const curFmt = specs[params.currentFormatId];
  if (
    curFmt &&
    curFmt.id !== 'screen' &&
    curFmt.id !== 'custom' &&
    curFmt.supportsOrientation
  ) {
    const curShort = Math.min(curFmt.wIn, curFmt.hIn);
    const curLong = Math.max(curFmt.wIn, curFmt.hIn);
    const altOrient: 'landscape' | 'portrait' = curOrient === 'portrait' ? 'landscape' : 'portrait';
    const altDims = altOrient === 'portrait' ? [curShort, curLong] : [curLong, curShort];
    if (allChecksFitAt(altDims[0], altDims[1])) {
      candidates.push({
        formatId: curFmt.id,
        name: curFmt.name,
        shortName: curFmt.shortName,
        orientation: altOrient,
        widthIn: altDims[0],
        heightIn: altDims[1],
        label: `${curFmt.shortName} (${altOrient === 'portrait' ? 'Portrait' : 'Landscape'})`,
        area: curShort * curLong,
      });
    }
  }

  for (const fmtId of PAPER_FORMAT_ORDER) {
    if (fmtId === 'screen' || fmtId === 'custom') continue;
    const fmt = specs[fmtId];
    if (!fmt) continue;

    const shortSide = Math.min(fmt.wIn, fmt.hIn);
    const longSide = Math.max(fmt.wIn, fmt.hIn);
    const area = shortSide * longSide;

    // Recommend genuinely larger standard formats than the current sheet
    if (params.currentFormatId !== 'screen' && area <= curArea * 1.02) continue;

    if (!fmt.supportsOrientation) {
      if (allChecksFitAt(fmt.wIn, fmt.hIn)) {
        candidates.push({
          formatId: fmt.id,
          name: fmt.name,
          shortName: fmt.shortName,
          orientation: null,
          widthIn: fmt.wIn,
          heightIn: fmt.hIn,
          label: fmt.shortName,
          area,
        });
      }
      continue;
    }

    const primaryOrient = curOrient;
    const altOrient: 'landscape' | 'portrait' = curOrient === 'portrait' ? 'landscape' : 'portrait';
    const primaryDims = primaryOrient === 'portrait' ? [shortSide, longSide] : [longSide, shortSide];
    const altDims = altOrient === 'portrait' ? [shortSide, longSide] : [longSide, shortSide];

    if (allChecksFitAt(primaryDims[0], primaryDims[1])) {
      candidates.push({
        formatId: fmt.id,
        name: fmt.name,
        shortName: fmt.shortName,
        orientation: primaryOrient,
        widthIn: primaryDims[0],
        heightIn: primaryDims[1],
        label: fmt.shortName,
        area,
      });
    } else if (allChecksFitAt(altDims[0], altDims[1])) {
      candidates.push({
        formatId: fmt.id,
        name: fmt.name,
        shortName: fmt.shortName,
        orientation: altOrient,
        widthIn: altDims[0],
        heightIn: altDims[1],
        label: `${fmt.shortName} (${altOrient === 'portrait' ? 'Portrait' : 'Landscape'})`,
        area,
      });
    }
  }

  candidates.sort((a, b) => a.area - b.area || a.shortName.localeCompare(b.shortName));
  const suggestedFormats: SuggestedPageSize[] = candidates.slice(0, 2).map(({ area: _area, ...rest }) => rest);

  const curName = getFormatDisplayName(params.currentFormatId, specs, curW, curH);
  const minStudStr = `${ctxNoIntro.minStudSizeCm.toFixed(1)} cm`;
  const suggestPhrase =
    suggestedFormats.length === 2
      ? `Try a larger page size such as ${suggestedFormats[0].label} or ${suggestedFormats[1].label}.`
      : suggestedFormats.length === 1
        ? `Try a larger page size such as ${suggestedFormats[0].label}.`
        : `Try a larger Custom page size (at least ${formatInchesCompact(minRequiredPageWidthIn, minRequiredPageHeightIn)}) or subdivide the model.`;
  const shortSuggest =
    suggestedFormats.length === 2
      ? `Try ${suggestedFormats[0].label} or ${suggestedFormats[1].label}.`
      : suggestedFormats.length === 1
        ? `Try ${suggestedFormats[0].label}.`
        : `Try Custom ≥ ${formatInchesCompact(minRequiredPageWidthIn, minRequiredPageHeightIn)}.`;

  const areaOnlyFailure = violations.every((v) => v.reason === 'area') || !hasRealSteps;
  let message: string;
  let shortMessage: string;

  if (areaOnlyFailure) {
    message = `Current page size (${curName}) is too small to fit a ${ctxNoIntro.minStepAreaWidthIn}″ × ${ctxNoIntro.minStepAreaHeightIn}″ step area with margins. ${suggestPhrase}`;
    shortMessage = `${curName} is too small for a ${ctxNoIntro.minStepAreaWidthIn}″ × ${ctxNoIntro.minStepAreaHeightIn}″ step area — ${shortSuggest}`;
  } else if (violations.length === 1) {
    const v = worstViolation;
    const studTxt = `${v.studSizeCm.toFixed(2)} cm/stud`;
    message = `Step ${v.stepNum} cannot fit at ${curName} even at 1 step/page while keeping 1 stud ≥ ${minStudStr} (renders at ${studTxt}). ${suggestPhrase}`;
    shortMessage = `Step ${v.stepNum} is below ${minStudStr}/stud at ${curName} even at 1 step/page (${studTxt}) — ${shortSuggest}`;
  } else {
    const v = worstViolation;
    const studTxt = `${v.studSizeCm.toFixed(2)} cm/stud`;
    message = `${violations.length} steps cannot fit at ${curName} even at 1 step/page while keeping 1 stud ≥ ${minStudStr} (smallest: ${studTxt} on Step ${v.stepNum}). ${suggestPhrase}`;
    shortMessage = `${violations.length} steps are below ${minStudStr}/stud at ${curName} even at 1 step/page (min ${studTxt}) — ${shortSuggest}`;
  }

  return {
    hasWarning: true,
    affectedStepCount: hasRealSteps ? violations.length : 0,
    affectedPageIds: Array.from(affectedPageIdSet),
    violations,
    worstViolation,
    suggestedFormats,
    minRequiredPageWidthIn,
    minRequiredPageHeightIn,
    message,
    shortMessage,
  };
}

/**
 * Formats a concise page-aware warning string for contextual page-layout warnings.
 * When the user is viewing an affected page, calls out the step(s) on that page;
 * otherwise returns the manual-wide summary.
 */
export function formatPageSizeWarningForPage(
  summary: PageSizeWarningSummary | null | undefined,
  currentPageId?: string | null,
): string {
  if (!summary || !summary.hasWarning) return '';
  if (!currentPageId) return summary.shortMessage;
  const pageViolations = summary.violations.filter((v) => v.pageId === currentPageId);
  if (pageViolations.length === 0) return summary.shortMessage;

  const shortSuggest =
    summary.suggestedFormats.length === 2
      ? `Try ${summary.suggestedFormats[0].label} or ${summary.suggestedFormats[1].label}.`
      : summary.suggestedFormats.length === 1
        ? `Try ${summary.suggestedFormats[0].label}.`
        : `Try Custom ≥ ${formatInchesCompact(summary.minRequiredPageWidthIn, summary.minRequiredPageHeightIn)}.`;

  if (pageViolations.every((v) => v.reason === 'area')) {
    return summary.shortMessage;
  }

  let worst = pageViolations[0];
  for (let i = 1; i < pageViolations.length; i++) {
    if (pageViolations[i].studSizeCm < worst.studSizeCm) worst = pageViolations[i];
  }
  const minStudStr = `${worst.minStudSizeCm.toFixed(1)} cm`;
  const studTxt = `${worst.studSizeCm.toFixed(2)} cm/stud`;
  if (pageViolations.length === 1) {
    return `Step ${worst.stepNum} renders at ${studTxt} even at 1 step/page (below ${minStudStr}/stud) — ${shortSuggest}`;
  }
  return `${pageViolations.length} steps on this page render below ${minStudStr}/stud even at 1 step/page (min ${studTxt}) — ${shortSuggest}`;
}

export interface PageSizeWarningStepLink {
  stepId: string;
  stepNum: number;
  absStepNum?: number;
  pageId?: string;
  pageNum?: number;
  label: string;
  detail: string;
  studSizeCm: number;
  reason: PageSizeViolation['reason'];
  isWorst: boolean;
}

/**
 * Returns deduplicated, manual-ordered navigable step link descriptors for every real step
 * violating the active page size. When `currentPageId` is supplied and matches one or more
 * non-area-only violations on that page, returns only those page-scoped steps so the list
 * stays in 1:1 parity with `formatPageSizeWarningForPage()`.
 */
export function getPageSizeWarningStepLinks(
  summary: PageSizeWarningSummary | null | undefined,
  currentPageId?: string | null,
): PageSizeWarningStepLink[] {
  if (!summary || !summary.hasWarning || summary.affectedStepCount <= 0) return [];
  const realViolations = summary.violations.filter((v) => Boolean(v.stepId) && v.stepId !== 'sample');
  if (realViolations.length === 0) return [];

  let scoped = realViolations;
  if (currentPageId) {
    const pageMatches = realViolations.filter((v) => v.pageId === currentPageId);
    if (pageMatches.length > 0 && !pageMatches.every((v) => v.reason === 'area')) {
      scoped = pageMatches;
    }
  }

  let worstId = summary.worstViolation?.stepId ?? null;
  if (scoped !== realViolations) {
    let worst = scoped[0];
    for (let i = 1; i < scoped.length; i++) {
      if (scoped[i].studSizeCm < worst.studSizeCm - 1e-4) worst = scoped[i];
    }
    worstId = worst.stepId;
  }

  const seen = new Set<string>();
  const out: PageSizeWarningStepLink[] = [];
  for (const v of scoped) {
    if (seen.has(v.stepId)) continue;
    seen.add(v.stepId);
    const hasDistinctAbs = typeof v.absStepNum === 'number' && Number.isFinite(v.absStepNum) && v.absStepNum !== v.stepNum;
    const label = hasDistinctAbs ? `Step ${v.stepNum} · #${v.absStepNum}` : `Step ${v.stepNum}`;
    const detail = v.reason === 'area' ? 'area too small' : `${v.studSizeCm.toFixed(2)} cm/stud`;
    out.push({
      stepId: v.stepId,
      stepNum: v.stepNum,
      absStepNum: v.absStepNum,
      pageId: v.pageId,
      pageNum: v.pageNum,
      label,
      detail,
      studSizeCm: v.studSizeCm,
      reason: v.reason,
      isWorst: worstId !== null && v.stepId === worstId,
    });
  }
  return out;
}
