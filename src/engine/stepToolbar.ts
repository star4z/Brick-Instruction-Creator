export type StudioMode = 'pan' | 'parts' | 'camera' | 'step' | 'page';
export type StepEditorSubTab = 'camera' | 'layout' | 'notes';
export type ScopeTier = 'local' | 'range' | 'manual';

export type MinifigStyleOptionId = 'exploded' | 'sequential' | 'classic';
export type StepFocusModeId = 'auto' | 'focus' | 'full';
export type StepInsertCorner = 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

export interface MinifigStyleOption {
  id: MinifigStyleOptionId;
  label: string;
  description: string;
}

export interface StepFocusModeOption {
  id: StepFocusModeId;
  label: string;
  description: string;
}

export interface CameraAnglePreset {
  /** Corner ID stored in overrides and .biw projects */
  id: 'front_right' | 'back_right' | 'back_left' | 'front_left';
  /** Neutral display label (avoids implying an arbitrary "front" side of the model) */
  label: string;
  /** Isometric camera azimuth in degrees */
  az: number;
  /** Quadrant hint for visual cube + camera icon positioning */
  quadrant: 'se' | 'ne' | 'nw' | 'sw';
}

export interface PaperFormatSpec {
  id: string;
  name: string;
  shortName: string;
  wIn: number;
  hIn: number;
  metricLabel: string;
  supportsOrientation: boolean;
  description: string;
}

export interface PaperPreviewBox {
  widthPx: number;
  heightPx: number;
  widthIn: number;
  heightIn: number;
  isLandscape: boolean;
  ratioLabel: string;
}

export const CAMERA_ANGLE_PRESETS: readonly CameraAnglePreset[] = [
  { id: 'front_right', label: '45°', az: 38, quadrant: 'se' },
  { id: 'back_right', label: '135°', az: 142, quadrant: 'ne' },
  { id: 'back_left', label: '225°', az: 218, quadrant: 'nw' },
  { id: 'front_left', label: '315°', az: 322, quadrant: 'sw' },
];

export const PAPER_FORMAT_SPECS: Readonly<Record<string, PaperFormatSpec>> = {
  screen: {
    id: 'screen',
    name: 'Screen Fit',
    shortName: 'Screen Fit',
    wIn: 11,
    hIn: 8.5,
    metricLabel: 'Adapts to current screen',
    supportsOrientation: false,
    description: 'Fills your current display proportions',
  },
  letter: {
    id: 'letter',
    name: 'US Letter (8.5 × 11 in)',
    shortName: 'US Letter',
    wIn: 8.5,
    hIn: 11,
    metricLabel: '216 × 279 mm',
    supportsOrientation: true,
    description: 'Standard North American letter sheet',
  },
  a4: {
    id: 'a4',
    name: 'A4 (210 × 297 mm)',
    shortName: 'A4',
    wIn: 8.27,
    hIn: 11.69,
    metricLabel: '210 × 297 mm',
    supportsOrientation: true,
    description: 'Standard international print sheet',
  },
  a5: {
    id: 'a5',
    name: 'A5 Booklet (148 × 210 mm)',
    shortName: 'A5',
    wIn: 5.83,
    hIn: 8.27,
    metricLabel: '148 × 210 mm',
    supportsOrientation: true,
    description: 'Compact instruction booklet size',
  },
  b5: {
    id: 'b5',
    name: 'B5 Booklet (176 × 250 mm)',
    shortName: 'B5',
    wIn: 6.93,
    hIn: 9.84,
    metricLabel: '176 × 250 mm',
    supportsOrientation: true,
    description: 'Mid-size manual booklet format',
  },
  half_letter: {
    id: 'half_letter',
    name: 'Half Letter (5.5 × 8.5 in)',
    shortName: 'Half Letter',
    wIn: 5.5,
    hIn: 8.5,
    metricLabel: '140 × 216 mm',
    supportsOrientation: true,
    description: 'Folded US Letter booklet',
  },
  legal: {
    id: 'legal',
    name: 'US Legal (8.5 × 14 in)',
    shortName: 'US Legal',
    wIn: 8.5,
    hIn: 14,
    metricLabel: '216 × 356 mm',
    supportsOrientation: true,
    description: 'Extra-long US print sheet',
  },
  tabloid: {
    id: 'tabloid',
    name: 'Tabloid / Ledger (11 × 17 in)',
    shortName: 'Tabloid',
    wIn: 11,
    hIn: 17,
    metricLabel: '279 × 432 mm',
    supportsOrientation: true,
    description: 'Large double-letter spread',
  },
  a3: {
    id: 'a3',
    name: 'A3 Poster (297 × 420 mm)',
    shortName: 'A3',
    wIn: 11.69,
    hIn: 16.54,
    metricLabel: '297 × 420 mm',
    supportsOrientation: true,
    description: 'Large international spread sheet',
  },
  square: {
    id: 'square',
    name: 'Booklet Square (8.5 × 8.5 in)',
    shortName: 'Square',
    wIn: 8.5,
    hIn: 8.5,
    metricLabel: '216 × 216 mm',
    supportsOrientation: false,
    description: 'Equal-sided square manual',
  },
  custom: {
    id: 'custom',
    name: 'Custom Size…',
    shortName: 'Custom',
    wIn: 10,
    hIn: 8,
    metricLabel: 'User-defined dimensions',
    supportsOrientation: false,
    description: 'Set any width and height in in or cm',
  },
};

export const PAPER_FORMAT_ORDER: readonly string[] = [
  'screen',
  'letter',
  'a4',
  'a5',
  'b5',
  'half_letter',
  'legal',
  'tabloid',
  'a3',
  'square',
  'custom',
];

export function computePaperPreviewBox(input: {
  paperFormat: string;
  orientation: 'landscape' | 'portrait' | string;
  customWidthIn?: number;
  customHeightIn?: number;
  screenAspect?: number;
  maxWidthPx?: number;
  maxHeightPx?: number;
}): PaperPreviewBox {
  const maxW = Math.max(24, input.maxWidthPx ?? 76);
  const maxH = Math.max(24, input.maxHeightPx ?? 64);
  let widthIn: number;
  let heightIn: number;

  if (input.paperFormat === 'custom') {
    widthIn = Math.max(2, Math.min(48, Number(input.customWidthIn) || 10));
    heightIn = Math.max(2, Math.min(48, Number(input.customHeightIn) || 8));
  } else if (input.paperFormat === 'screen') {
    const aspect = Math.max(0.55, Math.min(1.85, Number(input.screenAspect) || 16 / 10));
    widthIn = aspect >= 1 ? 10 * aspect : 10;
    heightIn = aspect >= 1 ? 10 : 10 / aspect;
  } else {
    const spec = PAPER_FORMAT_SPECS[input.paperFormat] || PAPER_FORMAT_SPECS.letter;
    if (!spec.supportsOrientation) {
      widthIn = spec.wIn;
      heightIn = spec.hIn;
    } else {
      const shortSide = Math.min(spec.wIn, spec.hIn);
      const longSide = Math.max(spec.wIn, spec.hIn);
      if (input.orientation === 'portrait') {
        widthIn = shortSide;
        heightIn = longSide;
      } else {
        widthIn = longSide;
        heightIn = shortSide;
      }
    }
  }

  const ratio = widthIn / Math.max(0.01, heightIn);
  let widthPx: number;
  let heightPx: number;
  if (maxW / maxH >= ratio) {
    heightPx = maxH;
    widthPx = Math.max(18, Math.round(heightPx * ratio));
  } else {
    widthPx = maxW;
    heightPx = Math.max(18, Math.round(widthPx / ratio));
  }

  const ratioLabel =
    Math.abs(ratio - 1) < 0.03
      ? '1 : 1'
      : ratio > 1
        ? `${ratio.toFixed(2)} : 1`
        : `1 : ${(1 / ratio).toFixed(2)}`;

  return {
    widthPx,
    heightPx,
    widthIn,
    heightIn,
    isLandscape: widthIn >= heightIn * 1.02,
    ratioLabel,
  };
}

export const MINIFIG_STYLE_OPTIONS: readonly MinifigStyleOption[] = [
  {
    id: 'exploded',
    label: 'Exploded',
    description: 'Vertical exploded parts callout with red assembly arrows next to the finished figure.',
  },
  {
    id: 'sequential',
    label: 'Step-by-Step',
    description: 'Numbered sub-steps (1, 2, 3…) laid out across the page for younger builders.',
  },
  {
    id: 'classic',
    label: 'Classic',
    description: 'Standard Parts Box and single 3D view matching regular build steps.',
  },
];

export const FOCUS_MODE_OPTIONS: readonly StepFocusModeOption[] = [
  {
    id: 'auto',
    label: 'Auto',
    description: 'Automatically keeps the full model framed steadily, zooming in gently only for tiny details on very large builds.',
  },
  {
    id: 'focus',
    label: 'Close-Up',
    description: 'Zooms closely onto the newly added bricks in this step.',
  },
  {
    id: 'full',
    label: 'Full Model',
    description: 'Frames the entire model built so far so surrounding context stays visible.',
  },
];

export function getFocusModeDescription(mode: string | undefined): string {
  const found = FOCUS_MODE_OPTIONS.find((opt) => opt.id === mode);
  return (found || FOCUS_MODE_OPTIONS[0]).description;
}

export function getCameraAngleLabel(cornerId: string | undefined): string {
  const found = CAMERA_ANGLE_PRESETS.find((c) => c.id === cornerId);
  return (found || CAMERA_ANGLE_PRESETS[0]).label;
}

/**
 * Matches a camera azimuth (e.g. from step drag-orbit or Cover / Build Complete angles)
 * to the nearest isometric Cube+Camera preset within `toleranceDeg`.
 */
export function findMatchingCameraPreset(
  azDeg: number,
  toleranceDeg = 14,
): CameraAnglePreset | null {
  if (!Number.isFinite(azDeg)) return null;
  const norm = ((azDeg % 360) + 360) % 360;
  let best: CameraAnglePreset | null = null;
  let bestDiff = Infinity;
  for (const preset of CAMERA_ANGLE_PRESETS) {
    const rawDiff = Math.abs(norm - preset.az);
    const diff = Math.min(rawDiff, 360 - rawDiff);
    if (diff <= toleranceDeg && diff < bestDiff) {
      best = preset;
      bestDiff = diff;
    }
  }
  return best;
}

export function clampStepModelScale(scale: number): number {
  if (!Number.isFinite(scale)) return 1.0;
  return Math.max(0.5, Math.min(2.2, Math.round(scale * 100) / 100));
}

export function getVisibleModeTabs(pageKind: string | null | undefined): StudioMode[] {
  if (pageKind === 'steps') {
    return ['pan', 'parts', 'step', 'page'];
  }
  if (pageKind === 'cover' || pageKind === 'complete') {
    return ['pan', 'camera', 'page'];
  }
  if (pageKind === 'back' || pageKind === 'divider' || pageKind === 'bom') {
    return ['pan', 'page'];
  }
  return [];
}

/**
 * Returns the bottom mode pill label for the `page` action button on a given page kind.
 * Parts List (`bom`) pages show "Customize Parts List" and directly open the Parts List dialog.
 */
export function getEditModeButtonLabel(pageKind: string | null | undefined): string {
  return pageKind === 'bom' ? 'Customize Parts List' : 'Page';
}

/**
 * Returns true when pressing the `page` mode pill action directly opens a dedicated modal
 * (Parts List Setup modal on BOM pages) rather than switching into an inline floating card.
 */
export function isModalEditPageKind(pageKind: string | null | undefined): boolean {
  return pageKind === 'bom';
}

/**
 * Normalizes legacy mode IDs and smoothly maps equivalent modes across page kinds
 * (e.g. Cover `camera` <-> Step `step`, legacy `select` -> `parts`, `rotate` -> `camera`/`step`, `edit` -> `page`).
 */
export function resolveModeForPage(
  mode: string | null | undefined,
  pageKind: string | null | undefined,
): StudioMode {
  const visible = getVisibleModeTabs(pageKind);
  if (visible.length === 0) return 'pan';

  let mapped: string = mode || 'pan';
  if (mapped === 'select') mapped = 'parts';
  else if (mapped === 'rotate') mapped = pageKind === 'steps' ? 'step' : 'camera';
  else if (mapped === 'edit') mapped = 'page';
  else if (mapped === 'arrange') mapped = 'pan';

  if (mapped === 'camera' && pageKind === 'steps') mapped = 'step';
  if (mapped === 'step' && (pageKind === 'cover' || pageKind === 'complete')) mapped = 'camera';

  return visible.includes(mapped as StudioMode) ? (mapped as StudioMode) : 'pan';
}

/** Maximum pointer travel (CSS pixels) still treated as a blank-stage click/tap rather than a drag. */
export const BLANK_STAGE_CLICK_MAX_MOVE_PX = 8;

export interface NodeContainsLike {
  contains(node: unknown): boolean;
}

export interface BlankStageModeResetInput {
  hasModel: boolean;
  mode: string | null | undefined;
  pageKind: string | null | undefined;
  startedInBlankSpace: boolean;
  endedInBlankSpace: boolean;
  movedPx: number;
  isPrimaryButton?: boolean;
  wasMultiTouch?: boolean;
  dismissedTransientOverlay?: boolean;
}

/**
 * Returns true when an event target lies inside the editor stage viewport
 * (`#stageViewport`) and strictly outside the rendered manual page document (`#pageFrame`).
 */
export function isBlankStageClickTarget(
  target: unknown,
  stage: NodeContainsLike | null | undefined,
  pageFrame: NodeContainsLike | null | undefined,
): boolean {
  if (!target || !stage) return false;
  if (typeof Node !== 'undefined' && stage instanceof Node && !(target instanceof Node)) {
    return false;
  }
  if (!stage.contains(target)) return false;
  if (pageFrame && pageFrame.contains(target)) return false;
  return true;
}

/**
 * Determines whether clicking/tapping blank proofing-table space outside the
 * rendered document page should switch the bottom mode pill back to `pan`.
 */
export function shouldResetModeOnBlankStageClick(input: BlankStageModeResetInput): boolean {
  if (!input.hasModel) return false;
  if (input.isPrimaryButton === false) return false;
  if (input.wasMultiTouch) return false;
  if (input.dismissedTransientOverlay) return false;
  if (!input.startedInBlankSpace || !input.endedInBlankSpace) return false;
  if (!Number.isFinite(input.movedPx) || input.movedPx < 0 || input.movedPx > BLANK_STAGE_CLICK_MAX_MOVE_PX) {
    return false;
  }

  const visible = getVisibleModeTabs(input.pageKind);
  if (!visible.includes('pan')) return false;

  const resolved = resolveModeForPage(input.mode, input.pageKind);
  return resolved !== 'pan';
}

export interface StepOverrideLike {
  side?: string;
  corner?: string;
  az?: number;
  el?: number;
  focusMode?: string;
  modelScale?: number;
  pliPos?: { x: number; y: number };
  pliScale?: number;
  calloutPos?: { x: number; y: number };
  calloutAsPages?: boolean;
  calloutDir?: string;
  pin?: boolean;
  [key: string]: unknown;
}

export interface StepInsertItem {
  id: string;
  kind: 'text' | 'image';
  text?: string;
  src?: string;
  corner?: StepInsertCorner;
  x?: number;
  y?: number;
  scale?: number;
}

export interface StepToolbarCapabilityInput {
  isMinifigBuild: boolean;
  minifigStyle: string;
  hasSubassembly: boolean;
  override?: StepOverrideLike | null;
  stepInsertCount?: number;
  /** @deprecated legacy alias for stepInsertCount */
  pageInsertCount?: number;
  totalStepCount?: number;
  followingStepCount?: number;
  canMergeWithPrev?: boolean;
  canInsertDividerAfterPage?: boolean;
}

export interface StepToolbarCapabilities {
  isOfficialMinifigStyle: boolean;
  hasPartsBox: boolean;
  hasMovableCallout: boolean;
  hasMovableElements: boolean;
  hasCustomCameraAngle: boolean;
  hasCustomModelZoom: boolean;
  hasCustomFocusMode: boolean;
  hasCustomCameraAny: boolean;
  hasCustomArrangeLayout: boolean;
  canApplyAngleToRange: boolean;
  canApplyAngleToFollowing: boolean;
  showMinifigSettings: boolean;
  showSubassemblySettings: boolean;
  canMergeWithPrev: boolean;
  canInsertDividerAfterPage: boolean;
  hasStepLayoutControls: boolean;
}

export function resolveStepToolbarCapabilities(
  input: StepToolbarCapabilityInput,
): StepToolbarCapabilities {
  const ov = input.override || {};
  const isOfficialMinifigStyle =
    input.isMinifigBuild && (input.minifigStyle === 'exploded' || input.minifigStyle === 'sequential');
  const calloutAsPages = Boolean(ov.calloutAsPages);
  const hasPartsBox = !isOfficialMinifigStyle && (!input.hasSubassembly || calloutAsPages);
  const hasMovableCallout = !isOfficialMinifigStyle && input.hasSubassembly && !calloutAsPages;
  const insertCount = input.stepInsertCount ?? input.pageInsertCount ?? 0;
  const hasMovableElements = hasPartsBox || hasMovableCallout || insertCount > 0;

  const hasCustomCameraAngle =
    ov.side !== undefined ||
    ov.corner !== undefined ||
    typeof ov.az === 'number' ||
    typeof ov.el === 'number';
  const hasCustomModelZoom = typeof ov.modelScale === 'number' && Math.abs(ov.modelScale - 1) > 0.001;
  const hasCustomFocusMode = Boolean(ov.focusMode && ov.focusMode !== 'auto');
  const hasCustomCameraAny = hasCustomCameraAngle || hasCustomModelZoom || hasCustomFocusMode;

  const pliPos = ov.pliPos;
  const calloutPos = ov.calloutPos;
  const hasMovedPli = Boolean(pliPos && (pliPos.x !== 0 || pliPos.y !== 0));
  const hasMovedCallout = Boolean(calloutPos && (calloutPos.x !== 0 || calloutPos.y !== 0));
  const hasScaledPli = typeof ov.pliScale === 'number' && Math.abs(ov.pliScale - 1) > 0.001;
  const hasCustomArrangeLayout = hasMovedPli || hasMovedCallout || hasScaledPli;

  const followingCount = input.followingStepCount ?? 0;
  const totalSteps = input.totalStepCount ?? (followingCount > 0 ? followingCount + 1 : 1);
  const canMergeWithPrev = Boolean(input.canMergeWithPrev);
  const canInsertDividerAfterPage = Boolean(input.canInsertDividerAfterPage);
  const hasStepLayoutControls =
    hasPartsBox || input.hasSubassembly || input.isMinifigBuild || canMergeWithPrev || canInsertDividerAfterPage;

  return {
    isOfficialMinifigStyle,
    hasPartsBox,
    hasMovableCallout,
    hasMovableElements,
    hasCustomCameraAngle,
    hasCustomModelZoom,
    hasCustomFocusMode,
    hasCustomCameraAny,
    hasCustomArrangeLayout,
    canApplyAngleToRange: totalSteps >= 2,
    canApplyAngleToFollowing: followingCount > 0,
    showMinifigSettings: input.isMinifigBuild,
    showSubassemblySettings: input.hasSubassembly,
    canMergeWithPrev,
    canInsertDividerAfterPage,
    hasStepLayoutControls,
  };
}

export function clearStepCameraOverride<T extends StepOverrideLike>(
  override?: T | null,
  includeZoomAndFraming = false,
): Partial<T> {
  if (!override) return {};
  const next = { ...override };
  delete next.side;
  delete next.corner;
  delete next.az;
  delete next.el;
  if (includeZoomAndFraming) {
    delete next.modelScale;
    delete next.focusMode;
  }
  return next;
}

export function clearStepArrangeOverride<T extends StepOverrideLike>(override?: T | null): Partial<T> {
  const next = { ...(override || {}) } as Partial<T>;
  next.pliPos = { x: 0, y: 0 };
  next.pliScale = 1;
  next.calloutPos = { x: 0, y: 0 };
  return next;
}

/**
 * Applies a camera orientation (and optionally model zoom & framing) to every step in the
 * inclusive ABSOLUTE step range [startNum..endNum].
 * Uses `absNum` (unique across the manual) so submodels whose printed numbers restart at 1
 * are not accidentally included. Falls back to `num` only when `absNum` is missing.
 * Allows targeting steps both before and after the currently edited step.
 */
export function applyCameraAngleToStepRange<T extends StepOverrideLike>(
  steps: ReadonlyArray<{ id: string; num: number; absNum?: number }>,
  overrides: Readonly<Record<string, T>>,
  startNum: number,
  endNum: number,
  camera: { side: string; corner: string; az: number; el: number; modelScale?: number; focusMode?: string },
): { overrides: Record<string, T>; appliedCount: number } {
  const lo = Math.min(startNum, endNum);
  const hi = Math.max(startNum, endNum);
  const next: Record<string, T> = { ...overrides };
  let appliedCount = 0;
  for (const s of steps) {
    const n = typeof s.absNum === 'number' ? s.absNum : s.num;
    if (n >= lo && n <= hi) {
      const updated: StepOverrideLike = {
        ...(next[s.id] || ({} as T)),
        side: camera.side,
        corner: camera.corner,
        az: camera.az,
        el: camera.el,
      };
      if (typeof camera.modelScale === 'number' && Number.isFinite(camera.modelScale)) {
        updated.modelScale = clampStepModelScale(camera.modelScale);
      }
      if (typeof camera.focusMode === 'string' && camera.focusMode.length > 0) {
        updated.focusMode = camera.focusMode;
      }
      next[s.id] = updated as T;
      appliedCount++;
    }
  }
  return { overrides: next, appliedCount };
}

/**
 * Migrates legacy page-keyed custom inserts (`pageInserts[pageId]`) to
 * step-keyed custom inserts (`stepInserts[stepId]`) by binding each page's
 * legacy inserts to the first step on that page.
 */
export function migratePageInsertsToSteps(
  pageInserts: Readonly<Record<string, StepInsertItem[]>> | null | undefined,
  existingStepInserts: Readonly<Record<string, StepInsertItem[]>> | null | undefined,
  pages: ReadonlyArray<{ id: string; kind?: string; slots?: ReadonlyArray<{ step: { id: string } }> }>,
): Record<string, StepInsertItem[]> {
  const out: Record<string, StepInsertItem[]> = {};
  if (existingStepInserts) {
    for (const [stepId, list] of Object.entries(existingStepInserts)) {
      if (Array.isArray(list) && list.length > 0) {
        out[stepId] = list.map((item) => ({ ...item }));
      }
    }
  }
  if (!pageInserts) return out;
  for (const [pageId, list] of Object.entries(pageInserts)) {
    if (!Array.isArray(list) || list.length === 0) continue;
    const pg = pages.find((p) => p.id === pageId && p.kind === 'steps');
    const firstStepId = pg?.slots?.[0]?.step?.id;
    if (!firstStepId) continue;
    const target = out[firstStepId] || [];
    const existingIds = new Set(target.map((x) => x.id));
    for (const item of list) {
      if (!existingIds.has(item.id)) {
        target.push({ ...item, corner: item.corner || 'bottom-right' });
        existingIds.add(item.id);
      }
    }
    out[firstStepId] = target;
  }
  return out;
}
