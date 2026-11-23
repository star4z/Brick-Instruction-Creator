export type StudioMode = 'pan' | 'select' | 'rotate' | 'arrange' | 'edit';

export type MinifigStyleOptionId = 'exploded' | 'sequential' | 'classic';
export type StepFocusModeId = 'auto' | 'focus' | 'full';

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
    description: 'Automatically zooms in for small details and zooms out when showing larger assemblies.',
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

export function getVisibleModeTabs(pageKind: string | null | undefined): StudioMode[] {
  if (pageKind === 'steps') {
    return ['pan', 'select', 'rotate', 'arrange', 'edit'];
  }
  if (
    pageKind === 'cover' ||
    pageKind === 'complete' ||
    pageKind === 'back' ||
    pageKind === 'divider' ||
    pageKind === 'bom'
  ) {
    return ['pan', 'edit'];
  }
  return [];
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

export interface StepToolbarCapabilityInput {
  isMinifigBuild: boolean;
  minifigStyle: string;
  hasSubassembly: boolean;
  override?: StepOverrideLike | null;
  pageInsertCount: number;
  followingStepCount: number;
}

export interface StepToolbarCapabilities {
  isOfficialMinifigStyle: boolean;
  hasPartsBox: boolean;
  hasMovableCallout: boolean;
  hasMovableElements: boolean;
  hasCustomCameraAngle: boolean;
  hasCustomArrangeLayout: boolean;
  canApplyAngleToFollowing: boolean;
  showMinifigSettings: boolean;
  showSubassemblySettings: boolean;
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
  const hasMovableElements = hasPartsBox || hasMovableCallout || input.pageInsertCount > 0;

  const hasCustomCameraAngle =
    ov.side !== undefined ||
    ov.corner !== undefined ||
    typeof ov.az === 'number' ||
    typeof ov.el === 'number';

  const pliPos = ov.pliPos;
  const calloutPos = ov.calloutPos;
  const hasMovedPli = Boolean(pliPos && (pliPos.x !== 0 || pliPos.y !== 0));
  const hasMovedCallout = Boolean(calloutPos && (calloutPos.x !== 0 || calloutPos.y !== 0));
  const hasScaledPli = typeof ov.pliScale === 'number' && Math.abs(ov.pliScale - 1) > 0.001;
  const hasCustomArrangeLayout = hasMovedPli || hasMovedCallout || hasScaledPli;

  return {
    isOfficialMinifigStyle,
    hasPartsBox,
    hasMovableCallout,
    hasMovableElements,
    hasCustomCameraAngle,
    hasCustomArrangeLayout,
    canApplyAngleToFollowing: input.followingStepCount > 0,
    showMinifigSettings: input.isMinifigBuild,
    showSubassemblySettings: input.hasSubassembly,
  };
}

export function clearStepCameraOverride<T extends StepOverrideLike>(override?: T | null): Partial<T> {
  if (!override) return {};
  const next = { ...override };
  delete next.side;
  delete next.corner;
  delete next.az;
  delete next.el;
  return next;
}

export function clearStepArrangeOverride<T extends StepOverrideLike>(override?: T | null): Partial<T> {
  const next = { ...(override || {}) } as Partial<T>;
  next.pliPos = { x: 0, y: 0 };
  next.pliScale = 1;
  next.calloutPos = { x: 0, y: 0 };
  return next;
}
