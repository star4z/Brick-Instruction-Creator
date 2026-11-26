/**
 * Parts List (Bill of Materials) Layout, Sizing & Formatting Engine
 *
 * Pure TypeScript module (zero DOM/WebGL dependencies) shared identically by:
 * - Live Studio DOM page renderer (`renderAll`)
 * - High-DPI Canvas/PDF exporter (`renderPageToJpegBytes`)
 * - Interactive 3D HTML exporter (`interactiveHtmlExporter`)
 * - Parts List Setup modal live mini-preview (`renderBomSetupPreview`)
 * - Theme storage & `.biwtheme` serialization (`customThemes`)
 */

export type BomFormat = 'grid' | 'table';
export type BomGridMode = 'auto' | 'custom';
export type BomFlowAxis = 'rows' | 'columns';
export type BomHorizontalDir = 'ltr' | 'rtl';
export type BomVerticalDir = 'ttb' | 'btt';
export type BomHangingAlign = 'start' | 'center' | 'end';
export type BomSortTrait = 'color' | 'category' | 'qty' | 'size' | 'name' | 'partId';
export type BomFieldId = 'image' | 'qty' | 'name' | 'partId' | 'color';
export type BomLegacyDensity = 'compact' | 'balanced' | 'spacious';

export interface BomFieldConfig {
  id: BomFieldId;
  enabled: boolean;
}

export interface BomConfig {
  format: BomFormat;
  gridMode: BomGridMode;
  /** Minimum physical cell width & height in inches (including labels) for Auto grid sizing. */
  minCellSizeIn: number;
  /** Explicit column count when gridMode === 'custom' (1..MAX_BOM_GRID_TRACKS). */
  customCols: number;
  /** Explicit row count when gridMode === 'custom' (1..MAX_BOM_GRID_TRACKS). */
  customRows: number;
  /** Primary grid fill axis: fill horizontally across rows first, or vertically along columns first. */
  flowAxis: BomFlowAxis;
  /** Horizontal progression direction: Left-to-Right or Right-to-Left. */
  horizontalDir: BomHorizontalDir;
  /** Vertical progression direction: Top-to-Bottom or Bottom-to-Top. */
  verticalDir: BomVerticalDir;
  /** Alignment of partial/hanging final row (or column) relative to the flow start. */
  align: BomHangingAlign;
  /** When true, physically larger bricks span strict integer multiples (2×1, 1×2, 2×2, 3×1, etc.) of the base grid cell. */
  variableSizing: boolean;
  /** When true, thumbnails inside BOM cells scale proportionally to real physical part dimensions. */
  relativeScale?: boolean;
  /** When true, packs Parts List into variable-width vertical masonry columns (official LEGO style). */
  variableWidthColumns?: boolean;
  /** When true (default), renders circled (N) / squared [N] length badges on axles, bars, and liftarms. */
  showLengthBadges?: boolean;
  /** Table format row count mode. */
  tableRowsMode: 'auto' | 'custom';
  /** Explicit rows per page when format === 'table' && tableRowsMode === 'custom'. */
  tableRowsPerPage: number;
  /**
   * Ordered list of all 5 fields. Controls left-to-right column order in Table format
   * and top-to-bottom (or side-by-side) visual item order in Grid format.
   */
  fields: BomFieldConfig[];
  sortPrimary: BomSortTrait;
  sortSecondary: BomSortTrait;
  /** Legacy density tag preserved for typography compatibility. */
  density: BomLegacyDensity;
}

export const MIN_BOM_CELL_SIZE_IN = 0.5;
export const MAX_BOM_CELL_SIZE_IN = 2.0;
export const DEFAULT_BOM_MIN_CELL_SIZE_IN = 0.5;
export const MIN_BOM_GRID_TRACKS = 1;
export const MAX_BOM_GRID_TRACKS = 24;
export const MAX_AUTO_BOM_GRID_TRACKS = 30;
export const MIN_BOM_TABLE_ROWS = 4;
export const MAX_BOM_TABLE_ROWS = 60;
export const DEFAULT_BOM_TABLE_ROWS = 20;

export const BOM_FIELD_IDS: readonly BomFieldId[] = [
  'image',
  'qty',
  'name',
  'partId',
  'color',
] as const;

export interface BomFieldMeta {
  id: BomFieldId;
  label: string;
  tableHeader: string;
  sample: string;
  align: 'left' | 'center' | 'right';
}

export const BOM_FIELD_META: Record<BomFieldId, BomFieldMeta> = {
  image: {
    id: 'image',
    label: 'Image Preview',
    tableHeader: 'Part',
    sample: '3D',
    align: 'center',
  },
  qty: {
    id: 'qty',
    label: 'Quantity',
    tableHeader: 'Qty',
    sample: '4×',
    align: 'right',
  },
  name: {
    id: 'name',
    label: 'Part Name',
    tableHeader: 'Part Name',
    sample: 'Brick 2×4',
    align: 'left',
  },
  partId: {
    id: 'partId',
    label: 'LEGO Part ID',
    tableHeader: 'Part ID',
    sample: '3001',
    align: 'left',
  },
  color: {
    id: 'color',
    label: 'Color',
    tableHeader: 'Color',
    sample: 'Red',
    align: 'left',
  },
};

export const DEFAULT_BOM_FIELDS: readonly BomFieldConfig[] = [
  { id: 'image', enabled: true },
  { id: 'qty', enabled: true },
  { id: 'name', enabled: true },
  { id: 'partId', enabled: true },
  { id: 'color', enabled: false },
];

export function cloneBomFields(fields: readonly BomFieldConfig[] = DEFAULT_BOM_FIELDS): BomFieldConfig[] {
  return fields.map((f) => ({ id: f.id, enabled: Boolean(f.enabled) }));
}

export const DEFAULT_BOM_CONFIG: BomConfig = {
  format: 'grid',
  gridMode: 'auto',
  minCellSizeIn: DEFAULT_BOM_MIN_CELL_SIZE_IN,
  customCols: 8,
  customRows: 6,
  flowAxis: 'rows',
  horizontalDir: 'ltr',
  verticalDir: 'ttb',
  align: 'start',
  variableSizing: false,
  tableRowsMode: 'auto',
  tableRowsPerPage: DEFAULT_BOM_TABLE_ROWS,
  fields: cloneBomFields(DEFAULT_BOM_FIELDS),
  sortPrimary: 'color',
  sortSecondary: 'category',
  density: 'balanced',
};

export function createDefaultBomConfig(): BomConfig {
  return {
    ...DEFAULT_BOM_CONFIG,
    fields: cloneBomFields(DEFAULT_BOM_FIELDS),
  };
}

const VALID_SORT_TRAITS = new Set<BomSortTrait>(['color', 'category', 'qty', 'size', 'name', 'partId']);
const VALID_FIELD_IDS = new Set<BomFieldId>(BOM_FIELD_IDS);

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function roundTo(v: number, decimals: number): number {
  const m = Math.pow(10, decimals);
  return Math.round(v * m) / m;
}

/**
 * Normalizes a field order & visibility array so it always contains every
 * BomFieldId exactly once and keeps at least one field enabled.
 */
export function normalizeBomFields(
  raw: unknown,
  fallback: readonly BomFieldConfig[] = DEFAULT_BOM_FIELDS,
): BomFieldConfig[] {
  const fbMap = new Map<BomFieldId, boolean>(fallback.map((f) => [f.id, f.enabled]));
  const result: BomFieldConfig[] = [];
  const seen = new Set<BomFieldId>();

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === 'string' && VALID_FIELD_IDS.has(item as BomFieldId)) {
        const id = item as BomFieldId;
        if (!seen.has(id)) {
          seen.add(id);
          result.push({ id, enabled: true });
        }
      } else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        const id = typeof obj.id === 'string' && VALID_FIELD_IDS.has(obj.id as BomFieldId)
          ? (obj.id as BomFieldId)
          : null;
        if (id && !seen.has(id)) {
          seen.add(id);
          result.push({
            id,
            enabled: typeof obj.enabled === 'boolean' ? obj.enabled : (fbMap.get(id) ?? true),
          });
        }
      }
    }
  }

  for (const fb of fallback) {
    if (!seen.has(fb.id)) {
      seen.add(fb.id);
      result.push({ id: fb.id, enabled: fb.enabled });
    }
  }
  for (const id of BOM_FIELD_IDS) {
    if (!seen.has(id)) {
      seen.add(id);
      result.push({ id, enabled: fbMap.get(id) ?? false });
    }
  }

  if (!result.some((f) => f.enabled)) {
    const img = result.find((f) => f.id === 'image') || result[0];
    if (img) img.enabled = true;
  }

  return result;
}

/** Returns enabled field IDs in exact user display order. */
export function getEnabledBomFields(cfg: Pick<BomConfig, 'fields'> | null | undefined): BomFieldId[] {
  const fields = cfg?.fields ? normalizeBomFields(cfg.fields) : cloneBomFields();
  return fields.filter((f) => f.enabled).map((f) => f.id);
}

/** Checks if a given field is enabled in the BOM config. */
export function isBomFieldEnabled(
  cfg: Pick<BomConfig, 'fields'> | null | undefined,
  fieldId: BomFieldId,
): boolean {
  const fields = cfg?.fields ? normalizeBomFields(cfg.fields) : cloneBomFields();
  return Boolean(fields.find((f) => f.id === fieldId)?.enabled);
}

/** Reorders a field from `fromIndex` to `toIndex`, returning a new normalized list. */
export function reorderBomFields(
  fields: readonly BomFieldConfig[],
  fromIndex: number,
  toIndex: number,
): BomFieldConfig[] {
  const list = normalizeBomFields(fields);
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    fromIndex >= list.length ||
    toIndex < 0 ||
    toIndex >= list.length
  ) {
    return list;
  }
  const [moved] = list.splice(fromIndex, 1);
  list.splice(toIndex, 0, moved);
  return list;
}

/** Toggles a field's enabled flag while guaranteeing at least one field stays enabled. */
export function toggleBomField(
  fields: readonly BomFieldConfig[],
  fieldId: BomFieldId,
  enabled: boolean,
): BomFieldConfig[] {
  const list = normalizeBomFields(fields);
  const enabledCount = list.filter((f) => f.enabled).length;
  if (!enabled && enabledCount <= 1 && list.find((f) => f.id === fieldId)?.enabled) {
    return list;
  }
  return list.map((f) => (f.id === fieldId ? { ...f, enabled } : f));
}

function isUnmodifiedLegacyBomConfig(r: Record<string, unknown>): boolean {
  const hasNewKeys =
    r.format !== undefined ||
    r.gridMode !== undefined ||
    r.minCellSizeIn !== undefined ||
    r.customCols !== undefined ||
    r.customRows !== undefined ||
    r.flowAxis !== undefined ||
    r.horizontalDir !== undefined ||
    r.verticalDir !== undefined ||
    r.variableSizing !== undefined ||
    r.tableRowsMode !== undefined ||
    r.tableRowsPerPage !== undefined ||
    r.fields !== undefined;
  if (hasNewKeys) return false;

  const dens = r.density === undefined || r.density === 'balanced';
  const flow = r.flow === undefined || r.flow === 'rows';
  const align = r.align === undefined || r.align === 'start';
  const sp = r.sortPrimary === undefined || r.sortPrimary === 'color';
  const ss = r.sortSecondary === undefined || r.sortSecondary === 'category';
  const sn = r.showNames === undefined || r.showNames === true;
  const spid = r.showPartIds === undefined;
  return dens && flow && align && sp && ss && sn && spid;
}

/**
 * Normalizes untrusted or legacy `BomConfig` objects into a safe, complete config.
 * Automatically migrates pre-v2 legacy properties (`flow`, `showNames`, `density`).
 */
export function normalizeBomConfig(
  raw: unknown,
  fallback: Partial<BomConfig> = DEFAULT_BOM_CONFIG,
): BomConfig {
  const fb: BomConfig = {
    ...DEFAULT_BOM_CONFIG,
    ...fallback,
    fields: normalizeBomFields(fallback.fields, DEFAULT_BOM_FIELDS),
  };

  if (!raw || typeof raw !== 'object') {
    return { ...fb, fields: cloneBomFields(fb.fields) };
  }

  const r = raw as Record<string, unknown>;
  if (isUnmodifiedLegacyBomConfig(r)) {
    return { ...fb, fields: cloneBomFields(fb.fields) };
  }

  const format: BomFormat = r.format === 'table' || r.format === 'grid' ? r.format : fb.format;

  const legacyDensity: BomLegacyDensity =
    r.density === 'compact' || r.density === 'spacious' || r.density === 'balanced'
      ? r.density
      : fb.density;

  const gridMode: BomGridMode =
    r.gridMode === 'custom' || r.gridMode === 'auto'
      ? r.gridMode
      : fb.gridMode;

  let minCellSizeIn = fb.minCellSizeIn;
  if (typeof r.minCellSizeIn === 'number' && Number.isFinite(r.minCellSizeIn)) {
    minCellSizeIn = roundTo(clamp(r.minCellSizeIn, MIN_BOM_CELL_SIZE_IN, MAX_BOM_CELL_SIZE_IN), 2);
  } else if (r.gridMode === undefined && r.density === 'spacious') {
    minCellSizeIn = 1.35;
  } else if (r.gridMode === undefined && r.density === 'compact') {
    minCellSizeIn = 0.55;
  }

  const customCols =
    typeof r.customCols === 'number' && Number.isFinite(r.customCols)
      ? Math.round(clamp(r.customCols, MIN_BOM_GRID_TRACKS, MAX_BOM_GRID_TRACKS))
      : fb.customCols;

  const customRows =
    typeof r.customRows === 'number' && Number.isFinite(r.customRows)
      ? Math.round(clamp(r.customRows, MIN_BOM_GRID_TRACKS, MAX_BOM_GRID_TRACKS))
      : fb.customRows;

  // Support both new `flowAxis` and legacy `flow`
  const rawFlow = r.flowAxis ?? r.flow;
  const flowAxis: BomFlowAxis =
    rawFlow === 'columns' || rawFlow === 'rows' ? rawFlow : fb.flowAxis;

  const horizontalDir: BomHorizontalDir =
    r.horizontalDir === 'rtl' || r.horizontalDir === 'ltr' ? r.horizontalDir : fb.horizontalDir;

  const verticalDir: BomVerticalDir =
    r.verticalDir === 'btt' || r.verticalDir === 'ttb' ? r.verticalDir : fb.verticalDir;

  const align: BomHangingAlign =
    r.align === 'start' || r.align === 'center' || r.align === 'end' ? r.align : fb.align;

  const variableSizing =
    typeof r.variableSizing === 'boolean' ? r.variableSizing : fb.variableSizing;

  const tableRowsMode: 'auto' | 'custom' =
    r.tableRowsMode === 'custom' || r.tableRowsMode === 'auto' ? r.tableRowsMode : fb.tableRowsMode;

  const tableRowsPerPage =
    typeof r.tableRowsPerPage === 'number' && Number.isFinite(r.tableRowsPerPage)
      ? Math.round(clamp(r.tableRowsPerPage, MIN_BOM_TABLE_ROWS, MAX_BOM_TABLE_ROWS))
      : fb.tableRowsPerPage;

  let fields = r.fields !== undefined
    ? normalizeBomFields(r.fields, fb.fields)
    : cloneBomFields(fb.fields);

  // Legacy migration for `showNames` / `showPartIds` when `fields` wasn't saved
  if (r.fields === undefined) {
    if (typeof r.showNames === 'boolean') {
      fields = toggleBomField(fields, 'name', r.showNames);
    }
    if (typeof r.showPartIds === 'boolean') {
      fields = toggleBomField(fields, 'partId', r.showPartIds);
    }
  }

  const sortPrimary: BomSortTrait =
    typeof r.sortPrimary === 'string' && VALID_SORT_TRAITS.has(r.sortPrimary as BomSortTrait)
      ? (r.sortPrimary as BomSortTrait)
      : fb.sortPrimary;

  const sortSecondary: BomSortTrait =
    typeof r.sortSecondary === 'string' && VALID_SORT_TRAITS.has(r.sortSecondary as BomSortTrait)
      ? (r.sortSecondary as BomSortTrait)
      : fb.sortSecondary;

  const relativeScale =
    typeof r.relativeScale === 'boolean' ? r.relativeScale : fb.relativeScale;
  const variableWidthColumns =
    typeof r.variableWidthColumns === 'boolean' ? r.variableWidthColumns : fb.variableWidthColumns;
  const showLengthBadges =
    typeof r.showLengthBadges === 'boolean' ? r.showLengthBadges : fb.showLengthBadges;

  return {
    format,
    gridMode,
    minCellSizeIn,
    customCols,
    customRows,
    flowAxis,
    horizontalDir,
    verticalDir,
    align,
    variableSizing,
    ...(relativeScale !== undefined ? { relativeScale } : {}),
    ...(variableWidthColumns !== undefined ? { variableWidthColumns } : {}),
    ...(showLengthBadges !== undefined ? { showLengthBadges } : {}),
    tableRowsMode,
    tableRowsPerPage,
    fields,
    sortPrimary,
    sortSecondary,
    density: legacyDensity,
  };
}

export function bomConfigsEqual(a: BomConfig, b: BomConfig): boolean {
  if (
    a.format !== b.format ||
    a.gridMode !== b.gridMode ||
    Math.abs(a.minCellSizeIn - b.minCellSizeIn) >= 0.005 ||
    a.customCols !== b.customCols ||
    a.customRows !== b.customRows ||
    a.flowAxis !== b.flowAxis ||
    a.horizontalDir !== b.horizontalDir ||
    a.verticalDir !== b.verticalDir ||
    a.align !== b.align ||
    a.variableSizing !== b.variableSizing ||
    Boolean(a.relativeScale) !== Boolean(b.relativeScale) ||
    Boolean(a.variableWidthColumns) !== Boolean(b.variableWidthColumns) ||
    (a.showLengthBadges !== false) !== (b.showLengthBadges !== false) ||
    a.tableRowsMode !== b.tableRowsMode ||
    a.tableRowsPerPage !== b.tableRowsPerPage ||
    a.sortPrimary !== b.sortPrimary ||
    a.sortSecondary !== b.sortSecondary ||
    a.fields.length !== b.fields.length
  ) {
    return false;
  }
  for (let i = 0; i < a.fields.length; i++) {
    if (a.fields[i].id !== b.fields[i].id || a.fields[i].enabled !== b.fields[i].enabled) {
      return false;
    }
  }
  return true;
}

/**
 * Formats an LDraw / BrickLink Studio part key into a clean LEGO / LDraw part ID
 * for display in the Parts List (e.g. `bl_3001.dat` -> `3001`, `parts/3070b.dat` -> `3070b`).
 */
export function formatDisplayPartId(rawPartId: string): string {
  const cleaned = String(rawPartId || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^(?:(?:ldraw|parts|p)\/)+/i, '')
    .replace(/\.dat$/i, '')
    .replace(/^bl_/i, '')
    .replace(/-bl$/i, '')
    .trim();
  return cleaned || String(rawPartId || '').trim();
}

/**
 * Natural comparison for LEGO / LDraw part IDs so `3001` < `3069b` < `15573`.
 */
export function comparePartIdsNatural(a: string, b: string): number {
  const fa = formatDisplayPartId(a).toLowerCase();
  const fb = formatDisplayPartId(b).toLowerCase();
  const ma = fa.match(/^(\d+)(.*)$/);
  const mb = fb.match(/^(\d+)(.*)$/);
  if (ma && mb) {
    const na = parseInt(ma[1], 10);
    const nb = parseInt(mb[1], 10);
    if (na !== nb) return na - nb;
    return ma[2].localeCompare(mb[2]);
  }
  return fa.localeCompare(fb);
}

// =========================================================================
// PHYSICAL BRICK DIMENSIONS & STRICT GRID-MULTIPLE SPAN ASSIGNMENT
// =========================================================================

export interface ProjectedPartDimensions {
  dx: number;
  dy: number;
  dz: number;
  /** Projected 2D width in LDU at standard PLI isometric view (az = 32°, el = 22°). */
  projW: number;
  /** Projected 2D height in LDU at standard PLI isometric view (az = 32°, el = 22°). */
  projH: number;
  /** Combined visual footprint score for sorting by size. */
  sizeScore: number;
}

const PLI_AZ_RAD = (32 * Math.PI) / 180;
const PLI_EL_RAD = (22 * Math.PI) / 180;
const COS_AZ = Math.cos(PLI_AZ_RAD);
const SIN_AZ = Math.sin(PLI_AZ_RAD);
const COS_EL = Math.cos(PLI_EL_RAD);
const SIN_EL = Math.sin(PLI_EL_RAD);

/**
 * Computes the analytical 2D orthographic projection dimensions of a part's
 * local LDU bounding box `[dx, dy, dz]` at the standard PLI camera `(32°, 22°)`.
 */
export function projectPartDimensionsLdu(dx: number, dy: number, dz: number): ProjectedPartDimensions {
  const sx = Math.max(4, Math.abs(Number(dx) || 20));
  const sy = Math.max(4, Math.abs(Number(dy) || 8));
  const sz = Math.max(4, Math.abs(Number(dz) || 20));
  const projW = sx * COS_AZ + sz * SIN_AZ;
  const projH = sx * SIN_AZ * SIN_EL + sy * COS_EL + sz * COS_AZ * SIN_EL;
  // Volume-weighted visual size score so large flat plates & tall frames both sort intuitively
  const maxSpan = Math.max(sx, sy, sz);
  const sizeScore = (projW * projH) / 100 + maxSpan * 0.5;
  return { dx: sx, dy: sy, dz: sz, projW, projH, sizeScore };
}

export interface BomPartSpan {
  colSpan: number;
  rowSpan: number;
}

export interface BomSizedItemInput {
  projW: number;
  projH: number;
}

function medianOf(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Assigns strict integer grid multiples (`colSpan × rowSpan`, e.g. 1×1, 2×1, 1×2, 2×2, 3×1, 3×2)
 * to each item based on its physical projected brick dimensions.
 *
 * When `variableSizing` is false, every item receives `{ colSpan: 1, rowSpan: 1 }`.
 */
export function computePartGridSpans(
  items: readonly BomSizedItemInput[],
  cols: number,
  rows: number,
  variableSizing: boolean,
): BomPartSpan[] {
  if (!variableSizing || items.length === 0) {
    return items.map(() => ({ colSpan: 1, rowSpan: 1 }));
  }

  const safeCols = Math.max(1, Math.round(cols));
  const safeRows = Math.max(1, Math.round(rows));
  const maxColSpan = safeCols <= 1 ? 1 : (safeCols <= 3 ? 2 : (safeCols <= 9 ? 3 : 4));
  const maxRowSpan = safeRows <= 1 ? 1 : (safeRows <= 3 ? 2 : (safeRows <= 9 ? 3 : 4));

  const medW = medianOf(items.map((it) => Math.max(12, it.projW || 28)));
  const medH = medianOf(items.map((it) => Math.max(12, it.projH || 24)));

  // Reference 1×1 unit anchored to physical brick scale while adapting gently to model median
  const baseW = clamp(medW * 1.45, 72, 112);
  const baseH = clamp(medH * 1.65, 62, 92);

  const quantizeSpan = (val: number, base: number, maxSpan: number): number => {
    if (maxSpan <= 1) return 1;
    const ratio = val / Math.max(1, base);
    if (ratio <= 1.2) return 1;
    if (ratio <= 2.15) return Math.min(2, maxSpan);
    if (ratio <= 3.25) return Math.min(3, maxSpan);
    return Math.min(4, maxSpan);
  };

  return items.map((it) => {
    const pw = Math.max(12, it.projW || 28);
    const ph = Math.max(12, it.projH || 24);
    let colSpan = quantizeSpan(pw, baseW, maxColSpan);
    let rowSpan = quantizeSpan(ph, baseH, maxRowSpan);

    // Prevent a single item from consuming more than 50% of a tiny grid unless grid itself is <= 2
    if (safeCols >= 4 && colSpan === safeCols) colSpan = Math.max(1, safeCols - 1);
    if (safeRows >= 4 && rowSpan === safeRows) rowSpan = Math.max(1, safeRows - 1);

    // Extra boost for huge broad flat pieces (e.g. 6×12 plates, 16×16 baseplates)
    // whose isometric vertical foreshortening still deserves 2 rows of vertical room,
    // without inflating narrow 1-stud long beams/plates (like 1×12).
    if (colSpan >= 3 && rowSpan === 1 && ph >= baseH * 1.1 && ph / Math.max(1, pw) >= 0.34 && maxRowSpan >= 2) {
      rowSpan = 2;
    }

    return {
      colSpan: clamp(colSpan, 1, safeCols),
      rowSpan: clamp(rowSpan, 1, safeRows),
    };
  });
}

// =========================================================================
// 2D STRICT-GRID PACKING WITH ALL 8 DIRECTIONAL FLOWS & HANGING ALIGNMENT
// =========================================================================

export interface BomGridCellPlacement<T> {
  item: T;
  /** Physical 0-based column index (may be fractional only for centered hanging row). */
  col: number;
  /** Physical 0-based row index (may be fractional only for centered hanging column). */
  row: number;
  /** Strict integer column span (>= 1). */
  colSpan: number;
  /** Strict integer row span (>= 1). */
  rowSpan: number;
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
}

export interface BomGridPackOptions {
  flowAxis: BomFlowAxis;
  horizontalDir: BomHorizontalDir;
  verticalDir: BomVerticalDir;
  align: BomHangingAlign;
}

interface LogicalPlacement<T> {
  item: T;
  p: number; // position along primary axis
  s: number; // position along secondary axis
  spanP: number;
  spanS: number;
}

/**
 * Packs items (each with a strict integer `colSpan × rowSpan`) onto one or more
 * `cols × rows` pages, preserving order across pages, supporting all 8 combinations of
 * (`rows|columns`) × (`ltr|rtl`) × (`ttb|btt`) plus hanging row/column alignment.
 */
export function packBomGridPages<T>(
  items: readonly T[],
  spans: readonly BomPartSpan[],
  cols: number,
  rows: number,
  opts: BomGridPackOptions,
): Array<Array<BomGridCellPlacement<T>>> {
  const safeCols = Math.max(1, Math.round(cols));
  const safeRows = Math.max(1, Math.round(rows));

  if (items.length === 0) return [[]];

  const isRows = opts.flowAxis !== 'columns';
  const primaryLen = isRows ? safeCols : safeRows;
  const secondaryLen = isRows ? safeRows : safeCols;

  const makeOcc = (): Uint8Array => new Uint8Array(primaryLen * secondaryLen);
  const canPlace = (occ: Uint8Array, p: number, s: number, spanP: number, spanS: number): boolean => {
    if (p + spanP > primaryLen || s + spanS > secondaryLen) return false;
    for (let ds = 0; ds < spanS; ds++) {
      const rowOff = (s + ds) * primaryLen;
      for (let dp = 0; dp < spanP; dp++) {
        if (occ[rowOff + p + dp]) return false;
      }
    }
    return true;
  };
  const markOcc = (occ: Uint8Array, p: number, s: number, spanP: number, spanS: number): void => {
    for (let ds = 0; ds < spanS; ds++) {
      const rowOff = (s + ds) * primaryLen;
      for (let dp = 0; dp < spanP; dp++) {
        occ[rowOff + p + dp] = 1;
      }
    }
  };
  const findFirstFit = (occ: Uint8Array, spanP: number, spanS: number): { p: number; s: number } | null => {
    for (let s = 0; s <= secondaryLen - spanS; s++) {
      for (let p = 0; p <= primaryLen - spanP; p++) {
        if (canPlace(occ, p, s, spanP, spanS)) return { p, s };
      }
    }
    return null;
  };

  const logicalPages: Array<Array<LogicalPlacement<T>>> = [];
  let occ = makeOcc();
  let curPage: Array<LogicalPlacement<T>> = [];

  for (let i = 0; i < items.length; i++) {
    const rawSpan = spans[i] || { colSpan: 1, rowSpan: 1 };
    const colSpan = clamp(Math.round(rawSpan.colSpan || 1), 1, safeCols);
    const rowSpan = clamp(Math.round(rawSpan.rowSpan || 1), 1, safeRows);
    const spanP = isRows ? colSpan : rowSpan;
    const spanS = isRows ? rowSpan : colSpan;

    let pos = findFirstFit(occ, spanP, spanS);
    if (!pos && curPage.length > 0) {
      logicalPages.push(curPage);
      curPage = [];
      occ = makeOcc();
      pos = findFirstFit(occ, spanP, spanS);
    }
    if (!pos) {
      pos = { p: 0, s: 0 };
    }
    markOcc(occ, pos.p, pos.s, spanP, spanS);
    curPage.push({ item: items[i], p: pos.p, s: pos.s, spanP, spanS });
  }

  if (curPage.length > 0) {
    logicalPages.push(curPage);
  }

  // Apply hanging alignment & transform logical coordinates to physical coordinates
  return logicalPages.map((pageCells) => {
    // Check if the final occupied secondary track is a clean hanging band
    let maxS = -1;
    for (const c of pageCells) {
      const endS = c.s + c.spanS - 1;
      if (endS > maxS) maxS = endS;
    }
    if (opts.align !== 'start' && maxS >= 0) {
      const inLastTrack = pageCells.filter((c) => c.s === maxS && c.spanS === 1);
      const crossesIntoLast = pageCells.some((c) => c.s < maxS && c.s + c.spanS > maxS);
      if (inLastTrack.length > 0 && !crossesIntoLast) {
        const minP = Math.min(...inLastTrack.map((c) => c.p));
        const maxEndP = Math.max(...inLastTrack.map((c) => c.p + c.spanP));
        const freeP = primaryLen - maxEndP;
        if (minP === 0 && freeP > 0) {
          const shift = opts.align === 'center' ? freeP / 2 : freeP;
          for (const c of inLastTrack) c.p += shift;
        }
      }
    }

    return pageCells.map((c) => {
      const col0 = isRows ? c.p : c.s;
      const row0 = isRows ? c.s : c.p;
      const colSpan = isRows ? c.spanP : c.spanS;
      const rowSpan = isRows ? c.spanS : c.spanP;

      const col = opts.horizontalDir === 'rtl' ? safeCols - col0 - colSpan : col0;
      const row = opts.verticalDir === 'btt' ? safeRows - row0 - rowSpan : row0;

      return {
        item: c.item,
        col,
        row,
        colSpan,
        rowSpan,
        xFrac: col / safeCols,
        yFrac: row / safeRows,
        wFrac: colSpan / safeCols,
        hFrac: rowSpan / safeRows,
      };
    });
  });
}

// =========================================================================
// AUTOMATIC PAGE-AWARE & COUNT-AWARE GRID SIZER
// =========================================================================

export interface AutoBomGridInput<T extends BomSizedItemInput> {
  items: readonly T[];
  contentWidthIn: number;
  contentHeightIn: number;
  minCellSizeIn: number;
  enabledFields: readonly BomFieldId[];
  variableSizing: boolean;
  flowAxis: BomFlowAxis;
  horizontalDir: BomHorizontalDir;
  verticalDir: BomVerticalDir;
  align: BomHangingAlign;
}

export interface ResolvedBomGridPlan<T> {
  cols: number;
  rows: number;
  perPageNominal: number;
  pageCount: number;
  cellWidthIn: number;
  cellHeightIn: number;
  isAuto: boolean;
  pages: Array<Array<BomGridCellPlacement<T>>>;
}

/**
 * Computes the ideal single-cell aspect ratio (width / height) based on enabled fields.
 */
export function computeIdealBomCellAspect(enabledFields: readonly BomFieldId[]): number {
  const hasImage = enabledFields.includes('image');
  const textCount = enabledFields.filter((f) => f !== 'image').length;
  if (!hasImage) {
    return textCount <= 2 ? 1.7 : 1.45;
  }
  if (textCount <= 1) return 1.02;
  if (textCount === 2) return 0.94;
  if (textCount === 3) return 0.88;
  return 0.82;
}

function scoreGridCandidate(
  cols: number,
  rows: number,
  contentWIn: number,
  contentHIn: number,
  idealAspect: number,
  targetPages: number,
  usedUnits: number,
): number {
  const cellW = contentWIn / cols;
  const cellH = contentHIn / rows;
  const aspect = cellW / Math.max(0.01, cellH);
  const distortion = Math.max(aspect / idealAspect, idealAspect / aspect);

  // Effective usable box size inside the cell normalized to idealAspect
  const effectiveDim = Math.min(cellW, cellH * idealAspect);

  // Penalize stretched cells gracefully so e.g. 3×2 beats a skinny 3×1 banner
  const aspectPenalty = Math.pow(distortion, 0.55);

  // Small tie-breaker favoring filling the available slots without huge empty whitespace
  const totalSlots = cols * rows * targetPages;
  const fillRatio = clamp(usedUnits / Math.max(1, totalSlots), 0.1, 1.0);
  const fillBonus = 0.94 + 0.06 * fillRatio;

  return (effectiveDim / aspectPenalty) * fillBonus;
}

/**
 * Automatically selects optimal `(cols, rows)` given page dimensions, part count,
 * minimum physical cell size (including labels), and optional variable brick sizing:
 *
 * 1. Computes maximum density `(maxCols, maxRows)` allowed by `minCellSizeIn`.
 * 2. Determines minimum required `targetPages` under that max density.
 * 3. Expands cells to fill the space across `targetPages`, picking the largest,
 *    best-proportioned `(cols, rows)` that fits all parts within `targetPages`.
 */
export function computeAutoBomGrid<T extends BomSizedItemInput>(
  input: AutoBomGridInput<T>,
): ResolvedBomGridPlan<T> {
  const contentWIn = Math.max(1.0, input.contentWidthIn);
  const contentHIn = Math.max(1.0, input.contentHeightIn);
  const minCell = clamp(input.minCellSizeIn || DEFAULT_BOM_MIN_CELL_SIZE_IN, MIN_BOM_CELL_SIZE_IN, MAX_BOM_CELL_SIZE_IN);
  const idealAspect = computeIdealBomCellAspect(input.enabledFields);
  const packOpts: BomGridPackOptions = {
    flowAxis: input.flowAxis,
    horizontalDir: input.horizontalDir,
    verticalDir: input.verticalDir,
    align: input.align,
  };

  const maxCols = clamp(Math.floor(contentWIn / minCell), 1, MAX_AUTO_BOM_GRID_TRACKS);
  const maxRows = clamp(Math.floor(contentHIn / minCell), 1, MAX_AUTO_BOM_GRID_TRACKS);

  const count = input.items.length;
  if (count === 0) {
    const fallbackCols = clamp(Math.round(contentWIn / 1.6), 2, Math.max(2, maxCols));
    const fallbackRows = clamp(Math.round(contentHIn / 1.6), 2, Math.max(2, maxRows));
    return {
      cols: fallbackCols,
      rows: fallbackRows,
      perPageNominal: fallbackCols * fallbackRows,
      pageCount: 1,
      cellWidthIn: contentWIn / fallbackCols,
      cellHeightIn: contentHIn / fallbackRows,
      isAuto: true,
      pages: [[]],
    };
  }

  // Phase 1: determine minimum achievable page count respecting minCellSizeIn
  const maxSpans = computePartGridSpans(input.items, maxCols, maxRows, input.variableSizing);
  const maxPacked = packBomGridPages(input.items, maxSpans, maxCols, maxRows, packOpts);
  const targetPages = Math.max(1, maxPacked.length);

  // Estimate baseline units needed across targetPages
  const totalSpanUnits = maxSpans.reduce((acc, s) => acc + s.colSpan * s.rowSpan, 0);

  // Phase 2: search smaller (cols, rows) that still fit within targetPages to maximize brick size
  let bestCols = maxCols;
  let bestRows = maxRows;
  let bestPages = maxPacked;
  let bestScore = scoreGridCandidate(maxCols, maxRows, contentWIn, contentHIn, idealAspect, targetPages, totalSpanUnits);

  if (!input.variableSizing) {
    const minPerPage = Math.ceil(count / targetPages);
    for (let c = 1; c <= maxCols; c++) {
      const rNeeded = Math.ceil(minPerPage / c);
      if (rNeeded > maxRows) continue;
      // Check rNeeded and rNeeded + 1 (adding 1 row can improve aspect ratio for tiny item counts like 3 parts on 11×8.5)
      const rMax = count <= 6 ? Math.min(maxRows, rNeeded + 1) : rNeeded;
      for (let r = rNeeded; r <= rMax; r++) {
        const sc = scoreGridCandidate(c, r, contentWIn, contentHIn, idealAspect, targetPages, count);
        if (sc > bestScore + 1e-6) {
          bestScore = sc;
          bestCols = c;
          bestRows = r;
        }
      }
    }
    const finalSpans = computePartGridSpans(input.items, bestCols, bestRows, false);
    bestPages = packBomGridPages(input.items, finalSpans, bestCols, bestRows, packOpts);
  } else {
    // Variable sizing: for each column count c, find the smallest row count r that packs within targetPages
    const minItemsPerPage = Math.ceil(count / targetPages);
    for (let c = 1; c <= maxCols; c++) {
      const rLower = Math.max(1, Math.ceil(minItemsPerPage / c));
      if (rLower > maxRows) continue;
      let foundForC = false;
      for (let r = rLower; r <= maxRows; r++) {
        const spans = computePartGridSpans(input.items, c, r, true);
        const units = spans.reduce((acc, s) => acc + s.colSpan * s.rowSpan, 0);
        if (c * r * targetPages < units) continue;
        // Quick upper-bound check before running packer
        const sc = scoreGridCandidate(c, r, contentWIn, contentHIn, idealAspect, targetPages, units);
        if (sc <= bestScore + 1e-6) {
          // Since larger r decreases cell size when aspect is already past ideal, only skip if already found
          if (foundForC) break;
          continue;
        }
        const packed = packBomGridPages(input.items, spans, c, r, packOpts);
        if (packed.length <= targetPages) {
          bestScore = sc;
          bestCols = c;
          bestRows = r;
          bestPages = packed;
          foundForC = true;
          if (count > 6) break;
        }
      }
    }
  }

  return {
    cols: bestCols,
    rows: bestRows,
    perPageNominal: bestCols * bestRows,
    pageCount: Math.max(1, bestPages.length),
    cellWidthIn: contentWIn / bestCols,
    cellHeightIn: contentHIn / bestRows,
    isAuto: true,
    pages: bestPages,
  };
}

/**
 * Unified Grid Parts List resolver for both Auto and Custom grid modes.
 */
export function resolveBomGridPlan<T extends BomSizedItemInput>(params: {
  items: readonly T[];
  config: BomConfig;
  contentWidthIn: number;
  contentHeightIn: number;
}): ResolvedBomGridPlan<T> {
  const { items, config, contentWidthIn, contentHeightIn } = params;
  const enabledFields = getEnabledBomFields(config);

  if (config.gridMode === 'auto') {
    return computeAutoBomGrid({
      items,
      contentWidthIn,
      contentHeightIn,
      minCellSizeIn: config.minCellSizeIn,
      enabledFields,
      variableSizing: config.variableSizing,
      flowAxis: config.flowAxis,
      horizontalDir: config.horizontalDir,
      verticalDir: config.verticalDir,
      align: config.align,
    });
  }

  const cols = clamp(Math.round(config.customCols || 6), MIN_BOM_GRID_TRACKS, MAX_BOM_GRID_TRACKS);
  const rows = clamp(Math.round(config.customRows || 5), MIN_BOM_GRID_TRACKS, MAX_BOM_GRID_TRACKS);
  const spans = computePartGridSpans(items, cols, rows, config.variableSizing);
  const pages = packBomGridPages(items, spans, cols, rows, {
    flowAxis: config.flowAxis,
    horizontalDir: config.horizontalDir,
    verticalDir: config.verticalDir,
    align: config.align,
  });

  return {
    cols,
    rows,
    perPageNominal: cols * rows,
    pageCount: Math.max(1, pages.length),
    cellWidthIn: contentWidthIn / cols,
    cellHeightIn: contentHeightIn / rows,
    isAuto: false,
    pages,
  };
}

// =========================================================================
// ADAPTIVE GRID CELL TYPOGRAPHY & LAYOUT (DOM + PDF PARITY)
// =========================================================================

export type BomCellLayoutMode = 'vertical' | 'horizontal-img-first' | 'horizontal-img-last';

export interface BomCellTypography {
  layoutMode: BomCellLayoutMode;
  padX: number;
  padY: number;
  imgPad: number;
  textGap: number;
  qtyFont: number;
  nameFont: number;
  partIdFont: number;
  colorFont: number;
  swatchSize: number;
  qtyLineH: number;
  textLineH: number;
  idLineH: number;
  totalTextH: number;
  imageBoxW: number;
  imageBoxH: number;
}

/**
 * Computes adaptive per-cell typography and layout geometry for a grid cell
 * of physical dimensions `(cellW, cellH)` pixels at `pxPerInch` DPI.
 *
 * Guarantees crisp readability on generous cells AND protects at least ~50%+
 * image height even on ultra-dense 0.5" cells with multiple labels enabled.
 */
export function computeBomCellTypography(params: {
  cellW: number;
  cellH: number;
  pxPerInch: number;
  enabledFields: readonly BomFieldId[];
  typeScale?: number;
}): BomCellTypography {
  const { cellW, cellH, pxPerInch, enabledFields } = params;
  const typeScale = params.typeScale ?? 1.0;
  const ptToPx = (pts: number) => pts * (pxPerInch / 72) * typeScale;

  const hasImage = enabledFields.includes('image');
  const textFields = enabledFields.filter((f) => f !== 'image');
  const aspect = cellW / Math.max(1, cellH);

  // Switch to clean side-by-side layout for wide rectangular cells (e.g. 2×1 or 3×1 bricks)
  // while strictly preserving field order (image first -> image left, image last -> image right).
  let layoutMode: BomCellLayoutMode = 'vertical';
  if (hasImage && textFields.length > 0 && aspect >= 1.85) {
    if (enabledFields[0] === 'image') layoutMode = 'horizontal-img-first';
    else if (enabledFields[enabledFields.length - 1] === 'image') layoutMode = 'horizontal-img-last';
  }

  const cellWIn = cellW / Math.max(1, pxPerInch);
  const cellHIn = cellH / Math.max(1, pxPerInch);
  const minIn = Math.min(cellWIn, cellHIn);

  // Scale typography gracefully from micro-dense (0.45") to spacious (1.6"+) cells
  const sizeFactor = clamp((minIn - 0.35) / 0.95, 0, 1);
  let qtyPt = 5.6 + sizeFactor * 4.4;    // 5.6pt -> 10.0pt
  let namePt = 4.6 + sizeFactor * 2.8;   // 4.6pt -> 7.4pt
  let partIdPt = 4.5 + sizeFactor * 2.5; // 4.5pt -> 7.0pt
  let colorPt = 4.6 + sizeFactor * 2.6;  // 4.6pt -> 7.2pt

  // For horizontal wide cells, text stack has full cellH available; give fonts a slight boost
  if (layoutMode !== 'vertical') {
    const hFactor = clamp((cellHIn - 0.35) / 0.8, 0, 1);
    qtyPt = 6.2 + hFactor * 4.0;
    namePt = 5.0 + hFactor * 2.8;
    partIdPt = 4.8 + hFactor * 2.5;
    colorPt = 5.0 + hFactor * 2.6;
  }

  const padX = Math.max(1.5, Math.round(clamp(cellW * 0.035, 1.5, ptToPx(4))));
  const padY = Math.max(1, Math.round(clamp(cellH * 0.025, 1, ptToPx(2.5))));
  const imgPad = Math.max(1, Math.round(clamp(Math.min(cellW, cellH) * 0.025, 1, ptToPx(2.5))));
  let textGap = Math.max(1, Math.round(clamp(cellH * 0.015, 1, ptToPx(1.8))));

  const measureTextBlock = (scale: number) => {
    const qf = Math.max(4.2, ptToPx(qtyPt * scale));
    const nf = Math.max(3.8, ptToPx(namePt * scale));
    const pf = Math.max(3.8, ptToPx(partIdPt * scale));
    const cf = Math.max(3.8, ptToPx(colorPt * scale));
    const qH = qf * 1.14;
    const nH = nf * 1.18;
    const pH = pf * 1.16;
    const cH = cf * 1.18;
    let total = 0;
    for (let i = 0; i < textFields.length; i++) {
      const f = textFields[i];
      total += f === 'qty' ? qH : f === 'partId' ? pH : f === 'color' ? cH : nH;
      if (i > 0) total += textGap;
    }
    return { qf, nf, pf, cf, qH, nH, pH, cH, total };
  };

  let scale = 1.0;
  let m = measureTextBlock(scale);

  // Protect image area so thumbnails never collapse when many labels are checked on dense grids
  const availH = Math.max(10, cellH - padY * 2);
  const maxTextBudgetH = layoutMode === 'vertical' && hasImage
    ? availH * (textFields.length >= 4 ? 0.50 : textFields.length === 3 ? 0.46 : 0.40)
    : availH * 0.92;

  if (m.total > maxTextBudgetH && m.total > 0) {
    scale = clamp(maxTextBudgetH / m.total, 0.58, 1.0);
    textGap = Math.max(0.5, textGap * scale);
    m = measureTextBlock(scale);
  }

  let imageBoxW = 0;
  let imageBoxH = 0;
  if (hasImage) {
    if (layoutMode === 'vertical') {
      imageBoxW = Math.max(8, cellW - padX * 2 - imgPad * 2);
      const extraGap = textFields.length > 0 ? textGap : 0;
      imageBoxH = Math.max(8, availH - m.total - extraGap - imgPad * 2);
    } else {
      const imgColW = Math.max(14, (cellW - padX * 2) * 0.44);
      imageBoxW = Math.max(8, imgColW - imgPad * 2);
      imageBoxH = Math.max(8, availH - imgPad * 2);
    }
  }

  return {
    layoutMode,
    padX,
    padY,
    imgPad,
    textGap,
    qtyFont: roundTo(m.qf, 2),
    nameFont: roundTo(m.nf, 2),
    partIdFont: roundTo(m.pf, 2),
    colorFont: roundTo(m.cf, 2),
    swatchSize: roundTo(clamp(m.cf * 0.85, 4, 11), 1),
    qtyLineH: roundTo(m.qH, 2),
    textLineH: roundTo(m.nH, 2),
    idLineH: roundTo(m.pH, 2),
    totalTextH: roundTo(m.total, 2),
    imageBoxW: roundTo(imageBoxW, 1),
    imageBoxH: roundTo(imageBoxH, 1),
  };
}

// =========================================================================
// TABLE FORMAT ENGINE (AUTO / CUSTOM ROWS + PROPORTIONAL DRAGGABLE COLUMNS)
// =========================================================================

export interface BomTableColumn {
  id: BomFieldId;
  label: string;
  align: 'left' | 'center' | 'right';
  x: number;
  width: number;
  widthFrac: number;
}

export interface BomTablePlan<T> {
  rowsPerPage: number;
  isAutoRows: boolean;
  pageCount: number;
  pages: Array<T[]>;
}

const TABLE_HEADER_RATIO = 0.055; // ~5.5% of content height (clamped in inches)
const MIN_TABLE_ROW_HEIGHT_IN = 0.34;
const IDEAL_MAX_TABLE_ROW_HEIGHT_IN = 0.68;

/**
 * Resolves table rows-per-page (Auto or Custom) and paginates entries cleanly.
 * In Auto mode, picks the minimum page count respecting `MIN_TABLE_ROW_HEIGHT_IN`,
 * then expands row heights comfortably (up to `IDEAL_MAX_TABLE_ROW_HEIGHT_IN`) to
 * balance rows across pages cleanly.
 */
export function computeBomTablePlan<T>(params: {
  items: readonly T[];
  config: BomConfig;
  contentHeightIn: number;
}): BomTablePlan<T> {
  const { items, config, contentHeightIn } = params;
  const headerHIn = clamp(contentHeightIn * TABLE_HEADER_RATIO, 0.24, 0.42);
  const bodyHIn = Math.max(1.0, contentHeightIn - headerHIn);

  let rowsPerPage: number;
  const isAutoRows = config.tableRowsMode !== 'custom';

  if (!isAutoRows) {
    rowsPerPage = clamp(Math.round(config.tableRowsPerPage || DEFAULT_BOM_TABLE_ROWS), MIN_BOM_TABLE_ROWS, MAX_BOM_TABLE_ROWS);
  } else {
    const maxRows = clamp(Math.floor(bodyHIn / MIN_TABLE_ROW_HEIGHT_IN), MIN_BOM_TABLE_ROWS, MAX_BOM_TABLE_ROWS);
    const minComfortableRows = clamp(Math.ceil(bodyHIn / IDEAL_MAX_TABLE_ROW_HEIGHT_IN), MIN_BOM_TABLE_ROWS, maxRows);
    if (items.length === 0) {
      rowsPerPage = Math.min(maxRows, Math.max(minComfortableRows, 16));
    } else {
      const targetPages = Math.max(1, Math.ceil(items.length / maxRows));
      const balancedRows = Math.ceil(items.length / targetPages);
      rowsPerPage = clamp(Math.max(minComfortableRows, balancedRows), MIN_BOM_TABLE_ROWS, maxRows);
    }
  }

  const pageCount = Math.max(1, Math.ceil(items.length / rowsPerPage));
  const pages: Array<T[]> = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push(items.slice(i * rowsPerPage, (i + 1) * rowsPerPage));
  }

  return {
    rowsPerPage,
    isAutoRows,
    pageCount,
    pages,
  };
}

const TABLE_COL_WEIGHTS: Record<BomFieldId, number> = {
  image: 1.0,
  qty: 0.9,
  partId: 1.45,
  color: 2.0,
  name: 3.3,
};

/**
 * Computes exact column positions and widths in exact user field order,
 * shared identically by Live DOM Table and PDF Canvas Table rendering.
 */
export function computeBomTableColumns(
  enabledFields: readonly BomFieldId[],
  tableWidthPx: number,
  rowHeightPx: number,
): BomTableColumn[] {
  const fields: BomFieldId[] = enabledFields.length > 0 ? [...enabledFields] : ['image', 'qty', 'name'];
  const safeW = Math.max(60, tableWidthPx);
  const safeRowH = Math.max(16, rowHeightPx);

  // Give `image` and `qty` sensible minimum widths when mixed with flexible text columns
  const hasFlexible = fields.some((f) => f === 'name' || f === 'color' || f === 'partId');
  const widths = new Map<BomFieldId, number>();

  let fixedSum = 0;
  let flexWeightSum = 0;

  for (const id of fields) {
    if (hasFlexible && id === 'image') {
      const w = clamp(safeRowH * 1.28, safeW * 0.08, safeW * 0.20);
      widths.set(id, w);
      fixedSum += w;
    } else if (hasFlexible && id === 'qty') {
      const w = clamp(safeW * 0.10, 36, safeW * 0.16);
      widths.set(id, w);
      fixedSum += w;
    } else {
      flexWeightSum += TABLE_COL_WEIGHTS[id] || 1;
    }
  }

  const remW = Math.max(20, safeW - fixedSum);
  for (const id of fields) {
    if (!widths.has(id)) {
      const w = (remW * (TABLE_COL_WEIGHTS[id] || 1)) / Math.max(0.1, flexWeightSum);
      widths.set(id, w);
    }
  }

  // Normalize to sum exactly to safeW
  const total = Array.from(widths.values()).reduce((a, b) => a + b, 0) || 1;
  let curX = 0;
  return fields.map((id, idx) => {
    const meta = BOM_FIELD_META[id];
    const w = idx === fields.length - 1 ? Math.max(0, safeW - curX) : (widths.get(id)! / total) * safeW;
    const col: BomTableColumn = {
      id,
      label: meta.tableHeader,
      align: meta.align,
      x: curX,
      width: w,
      widthFrac: w / safeW,
    };
    curX += w;
    return col;
  });
}

export interface BomTableTypography {
  headerH: number;
  rowH: number;
  headerFont: number;
  qtyFont: number;
  bodyFont: number;
  monoFont: number;
  cellPadX: number;
  imgPad: number;
  swatchSize: number;
}

/**
 * Computes consistent table typography & row sizing for both DOM and PDF Canvas.
 */
export function computeBomTableTypography(params: {
  tableHeightPx: number;
  rowsPerPage: number;
  pxPerInch: number;
  typeScale?: number;
}): BomTableTypography {
  const { tableHeightPx, rowsPerPage, pxPerInch } = params;
  const typeScale = params.typeScale ?? 1.0;
  const ptToPx = (pts: number) => pts * (pxPerInch / 72) * typeScale;

  const headerH = Math.round(clamp(ptToPx(20), 18, Math.max(20, tableHeightPx * 0.08)));
  const bodyH = Math.max(40, tableHeightPx - headerH);
  const rowH = bodyH / Math.max(1, rowsPerPage);

  const rowHIn = rowH / Math.max(1, pxPerInch);
  const rowFactor = clamp((rowHIn - 0.22) / 0.40, 0, 1);

  const headerFont = roundTo(clamp(ptToPx(7.5 + rowFactor * 1.2), 6.5, headerH * 0.56), 2);
  const qtyFont = roundTo(clamp(ptToPx(7.5 + rowFactor * 2.5), 6.5, rowH * 0.52), 2);
  const bodyFont = roundTo(clamp(ptToPx(7.0 + rowFactor * 2.0), 6.0, rowH * 0.48), 2);
  const monoFont = roundTo(clamp(ptToPx(6.6 + rowFactor * 1.8), 5.8, rowH * 0.45), 2);
  const cellPadX = Math.max(3, Math.round(ptToPx(5.5)));
  const imgPad = Math.max(1.5, Math.round(clamp(rowH * 0.08, 1.5, 4)));
  const swatchSize = roundTo(clamp(bodyFont * 0.92, 6, 13), 1);

  return {
    headerH,
    rowH: roundTo(rowH, 2),
    headerFont,
    qtyFont,
    bodyFont,
    monoFont,
    cellPadX,
    imgPad,
    swatchSize,
  };
}

/**
 * Compact human-readable summary of a `BomConfig` for menus and theme previews.
 */
export function summarizeBomConfig(cfg: BomConfig): string {
  const sortNames: Record<BomSortTrait, string> = {
    color: 'Color',
    category: 'Category',
    qty: 'Qty',
    size: 'Size',
    name: 'Name',
    partId: 'Part ID',
  };
  if (cfg.format === 'table') {
    const rowsLabel = cfg.tableRowsMode === 'auto' ? 'Auto rows' : `${cfg.tableRowsPerPage} rows`;
    return `Table · ${rowsLabel} · ${sortNames[cfg.sortPrimary] || 'Color'}`;
  }
  const sizeLabel = cfg.gridMode === 'auto'
    ? 'Auto'
    : `${cfg.customCols}×${cfg.customRows}`;
  return `Grid · ${sizeLabel} · ${sortNames[cfg.sortPrimary] || 'Color'}`;
}

export interface BomRelativeScaleInput {
  key: string;
  /** Physical isometric projected width & height in LDU (from `projectPartDimensionsLdu`). */
  projW: number;
  projH: number;
}

export interface BomRelativeScaleEntry {
  key: string;
  /** Rendered thumbnail scale factor (0.36..1.0) relative to its cell's available image box. */
  scaleFactor: number;
  /** Preferred column width in pixels for variable-width masonry packing. */
  preferredWidthPx: number;
  /** Preferred item height in pixels (thumbnail + labels) for variable-width masonry packing. */
  preferredHeightPx: number;
}

/**
 * Computes consistent physical relative-scale thumbnail factors across a Parts List
 * (matching official LEGO BOMs such as 31172 p. 106 and 75192 p. 464), so a 1×1 stud
 * is visually smaller than a 1×16 beam or 8×8 plate while preserving legibility bounds.
 */
export function computeRelativeBomScales(
  items: ReadonlyArray<BomRelativeScaleInput>,
  basePxPerLdu = 0.42,
  labelHeightPx = 22,
): Map<string, BomRelativeScaleEntry> {
  const out = new Map<string, BomRelativeScaleEntry>();
  if (items.length === 0) return out;

  const maxSpan = items.reduce(
    (m, it) => Math.max(m, Math.max(it.projW, it.projH)),
    60,
  );
  // Reference LDU span that fills 100% of a standard cell (clamped so huge baseplates don't crush 1x1 studs)
  const refLdu = Math.max(80, Math.min(220, maxSpan * 0.65));

  for (const it of items) {
    const diag = Math.max(it.projW, it.projH, 16);
    // Gentle sub-linear compression (pow 0.72) preserves authentic physical hierarchy without making tiny pins microscopic
    const rawScale = Math.pow(diag / refLdu, 0.72);
    const scaleFactor = roundTo(clamp(rawScale, 0.38, 1.0), 3);
    const preferredWidthPx = Math.round(clamp(it.projW * basePxPerLdu + 14, 44, 172));
    const preferredHeightPx = Math.round(clamp(it.projH * basePxPerLdu + labelHeightPx + 10, 48, 152));
    out.set(it.key, {
      key: it.key,
      scaleFactor,
      preferredWidthPx,
      preferredHeightPx,
    });
  }
  return out;
}

export interface VariableWidthBomColumn<T> {
  colIndex: number;
  xPx: number;
  widthPx: number;
  items: Array<{
    item: T;
    yPx: number;
    heightPx: number;
    scaleFactor: number;
  }>;
}

export interface VariableWidthBomPage<T> {
  pageIndex: number;
  columns: Array<VariableWidthBomColumn<T>>;
}

/**
 * Packs Parts List items into official LEGO-style variable-width vertical masonry columns
 * (matching 75192 p. 464 and 31172 p. 106): narrow columns for small pins/studs and wider
 * columns for long beams/plates, flowing top-to-bottom within each column and left-to-right
 * across pages with zero wasted horizontal whitespace.
 */
export function packVariableWidthBomColumns<T>(
  items: ReadonlyArray<T>,
  getKey: (item: T) => string,
  scales: ReadonlyMap<string, BomRelativeScaleEntry>,
  contentWidthPx: number,
  contentHeightPx: number,
  gapPx = 8,
): Array<VariableWidthBomPage<T>> {
  if (items.length === 0) return [];
  const usableW = Math.max(120, contentWidthPx);
  const usableH = Math.max(120, contentHeightPx);

  // Step 1: Group items sequentially into vertical columns that fit within `usableH`
  const rawCols: Array<{
    widthPx: number;
    entries: Array<{ item: T; yPx: number; heightPx: number; scaleFactor: number }>;
  }> = [];

  let curEntries: Array<{ item: T; yPx: number; heightPx: number; scaleFactor: number }> = [];
  let curY = 0;
  let curMaxW = 48;

  for (const item of items) {
    const sc = scales.get(getKey(item)) || {
      key: getKey(item),
      scaleFactor: 0.75,
      preferredWidthPx: 68,
      preferredHeightPx: 68,
    };
    const itemH = Math.min(usableH, sc.preferredHeightPx);
    if (curEntries.length > 0 && curY + itemH > usableH) {
      rawCols.push({ widthPx: curMaxW, entries: curEntries });
      curEntries = [];
      curY = 0;
      curMaxW = 48;
    }
    curEntries.push({
      item,
      yPx: curY,
      heightPx: itemH,
      scaleFactor: sc.scaleFactor,
    });
    curY += itemH + gapPx;
    curMaxW = Math.max(curMaxW, Math.min(usableW * 0.42, sc.preferredWidthPx));
  }
  if (curEntries.length > 0) {
    rawCols.push({ widthPx: curMaxW, entries: curEntries });
  }

  // Step 2: Pack variable-width columns onto pages that fit within `usableW`
  const pages: Array<VariableWidthBomPage<T>> = [];
  let pageCols: typeof rawCols = [];
  let pageW = 0;

  const flushPage = () => {
    if (pageCols.length === 0) return;
    const totalGaps = Math.max(0, pageCols.length - 1) * gapPx;
    const rawSum = pageCols.reduce((s, c) => s + c.widthPx, 0);
    // Gently distribute leftover horizontal space proportionally across columns
    const expand = rawSum > 0 ? Math.min(1.35, (usableW - totalGaps) / rawSum) : 1;
    let x = 0;
    const columns: Array<VariableWidthBomColumn<T>> = pageCols.map((c, idx) => {
      const w = roundTo(c.widthPx * expand, 1);
      const col: VariableWidthBomColumn<T> = {
        colIndex: idx,
        xPx: roundTo(x, 1),
        widthPx: w,
        items: c.entries,
      };
      x += w + gapPx;
      return col;
    });
    pages.push({ pageIndex: pages.length, columns });
    pageCols = [];
    pageW = 0;
  };

  for (const col of rawCols) {
    const needed = pageCols.length === 0 ? col.widthPx : col.widthPx + gapPx;
    if (pageCols.length > 0 && pageW + needed > usableW) {
      flushPage();
    }
    pageCols.push(col);
    pageW += pageCols.length === 1 ? col.widthPx : col.widthPx + gapPx;
  }
  flushPage();

  return pages;
}

