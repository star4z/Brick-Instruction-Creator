export interface RuntimeStepLike {
  id: string;
  num: number;
  parts?: unknown[];
  minifigName?: string;
  isStandaloneFigure?: boolean;
  isMinifigPoseStep?: boolean;
  subassembly?: { name?: string };
  attachedSubmodel?: { name?: string };
  attachedMinifig?: { name?: string };
}

export interface RuntimeChapterLike {
  id: string;
  kind?: string;
  name?: string;
  steps: RuntimeStepLike[];
}

export interface RuntimeOverrideLike {
  pin?: boolean;
  [key: string]: unknown;
}

export interface RuntimeMinifigSeqSliceLike {
  pageIdx: number;
  pageCount: number;
  start: number;
  end: number;
}

export interface RuntimePageSlotLike {
  ch?: RuntimeChapterLike;
  step: RuntimeStepLike;
  minifigSeqSlice?: RuntimeMinifigSeqSliceLike;
}

export interface RuntimePageLike {
  id: string;
  kind: string;
  num: number;
  slots?: RuntimePageSlotLike[];
  [key: string]: unknown;
}

/**
 * Returns true when a page slot is a continuation slice (page 2+) of a multi-page
 * sequential minifigure step. The step's page break belongs to its first slice only.
 */
export function isStepBreakContinuationSlice(
  slot: RuntimePageSlotLike | null | undefined,
): boolean {
  return Boolean(slot?.minifigSeqSlice && slot.minifigSeqSlice.pageIdx > 0);
}

/**
 * Returns true if the given step (and optional page slot) has an active page break
 * before it. Continuation slices of a sequential minifigure step never report a
 * duplicate break.
 */
export function hasStepPageBreak(
  overrides: Record<string, RuntimeOverrideLike> | null | undefined,
  stepId: string | null | undefined,
  slot?: RuntimePageSlotLike | null,
): boolean {
  if (!stepId || !overrides) return false;
  if (isStepBreakContinuationSlice(slot)) return false;
  return Boolean(overrides[stepId]?.pin);
}

/**
 * Counts unique live steps across all chapters that currently have a page break
 * enabled. Ignores stale override keys for deleted/merged steps and avoids
 * double-counting multi-page sequential minifigure steps.
 */
export function countStepPageBreaks(
  chapters: RuntimeChapterLike[] | null | undefined,
  overrides: Record<string, RuntimeOverrideLike> | null | undefined,
): number {
  if (!chapters || !overrides) return 0;
  const pinnedIds = new Set<string>();
  for (const ch of chapters) {
    for (const step of ch.steps || []) {
      if (overrides[step.id]?.pin) {
        pinnedIds.add(step.id);
      }
    }
  }
  return pinnedIds.size;
}

/**
 * Immutably toggles the per-step `pin` (page break before step) override for `stepId`
 * while preserving all other overrides on that step and all other steps.
 */
export function toggleStepPageBreakOverride<T extends RuntimeOverrideLike>(
  overrides: Record<string, T>,
  stepId: string,
): { overrides: Record<string, T>; pinned: boolean } {
  const prev = overrides[stepId] || ({} as T);
  const nextPinned = !Boolean(prev.pin);
  const nextEntry = { ...prev } as T;
  if (nextPinned) {
    nextEntry.pin = true;
  } else {
    delete nextEntry.pin;
  }
  return {
    overrides: {
      ...overrides,
      [stepId]: nextEntry,
    },
    pinned: nextPinned,
  };
}

/**
 * Immutably removes all per-step page breaks while preserving every other override
 * (camera angles, PLI offsets, part offsets, callout toggles, etc.).
 */
export function clearAllStepPageBreaks<T extends RuntimeOverrideLike>(
  overrides: Record<string, T>,
): { overrides: Record<string, T>; clearedCount: number } {
  let clearedCount = 0;
  const next: Record<string, T> = { ...overrides };
  for (const sid of Object.keys(overrides)) {
    if (overrides[sid]?.pin) {
      const nextEntry = { ...overrides[sid] } as T;
      delete nextEntry.pin;
      next[sid] = nextEntry;
      clearedCount += 1;
    }
  }
  return { overrides: next, clearedCount };
}

/**
 * Finds the first page index containing `stepId` in its rendered step slots.
 */
export function findPageIndexForStep(
  pages: RuntimePageLike[] | null | undefined,
  stepId: string | null | undefined,
): number {
  if (!pages || !stepId) return -1;
  return pages.findIndex((pg) => Boolean(pg.slots?.some((sl) => sl.step.id === stepId)));
}

/**
 * Builds a concise tooltip explaining what toggling a step's page break will do.
 */
export function getStepBreakTooltip(opts: {
  stepLabel: string;
  pinned: boolean;
  slotIndex: number;
}): string {
  const { stepLabel, pinned, slotIndex } = opts;
  if (pinned) {
    return `Remove page break before ${stepLabel}`;
  }
  if (slotIndex > 0) {
    return `Add a page break so ${stepLabel} starts on a new page`;
  }
  return `Add a page break before ${stepLabel} so earlier edits won't shift later pages`;
}

/**
 * Builds a clear toast notification after toggling a step's page break.
 */
export function getStepBreakFeedbackMessage(opts: {
  stepLabel: string;
  pinned: boolean;
  movedToNewPage: boolean;
  targetPageNum?: number | null;
}): string {
  const { stepLabel, pinned, movedToNewPage, targetPageNum } = opts;
  if (!pinned) {
    return `Removed page break before ${stepLabel} — pages can reflow freely.`;
  }
  if (movedToNewPage && targetPageNum != null) {
    return `Added page break — ${stepLabel} now starts Page ${targetPageNum}.`;
  }
  return `Added page break before ${stepLabel} — earlier edits won't shift later pages.`;
}

export interface TooltipRectLike {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface HelpTooltipPosition {
  left: number;
  top: number;
  placement: 'top' | 'bottom';
  arrowLeft: number;
}

/**
 * Builds the explanation shown in the Page Break `?` help tooltip.
 */
export function getPageBreakHelpExplanation(opts?: {
  stepLabel?: string | null;
  pinned?: boolean;
}): string {
  const label = opts?.stepLabel?.trim();
  if (label) {
    if (opts?.pinned) {
      return `${label} is locked to the start of a new page so earlier edits won’t shift later pages. Click Page Break to remove it.`;
    }
    return `Locks ${label} to the start of a new page so adding, splitting, or merging earlier steps won’t shift later pages.`;
  }
  return 'Locks a step to the start of a new page so adding, splitting, or merging earlier steps won’t shift later pages.';
}

/**
 * Computes fixed viewport coordinates and directional caret offset for a floating
 * help tooltip anchored to a `?` button so it never clips inside scroll containers
 * or overflows screen edges.
 */
export function computeHelpTooltipPosition(opts: {
  anchor: TooltipRectLike;
  tooltip: { width: number; height: number };
  viewport: { width: number; height: number };
  margin?: number;
  gap?: number;
}): HelpTooltipPosition {
  const margin = Number.isFinite(opts.margin) ? Math.max(4, opts.margin!) : 12;
  const gap = Number.isFinite(opts.gap) ? Math.max(0, opts.gap!) : 8;
  const vw = Math.max(0, opts.viewport.width);
  const vh = Math.max(0, opts.viewport.height);
  const tw = Math.max(0, opts.tooltip.width);
  const th = Math.max(0, opts.tooltip.height);

  const anchorCenterX = opts.anchor.left + opts.anchor.width / 2;

  const topAbove = opts.anchor.top - th - gap;
  const topBelow = opts.anchor.bottom + gap;
  const spaceAbove = opts.anchor.top - margin;
  const spaceBelow = vh - opts.anchor.bottom - margin;

  let placement: 'top' | 'bottom' = 'top';
  let rawTop = topAbove;
  if (topAbove < margin && spaceBelow >= spaceAbove) {
    placement = 'bottom';
    rawTop = topBelow;
  }

  const maxTop = Math.max(margin, vh - th - margin);
  const top = Math.round(Math.min(maxTop, Math.max(margin, rawTop)));

  const maxLeft = Math.max(margin, vw - tw - margin);
  const idealLeft = anchorCenterX - tw / 2;
  const left = Math.round(Math.min(maxLeft, Math.max(margin, idealLeft)));

  const arrowInset = Math.min(14, Math.max(6, Math.floor(tw / 4)));
  const maxArrow = Math.max(arrowInset, tw - arrowInset);
  const arrowLeft = Math.round(Math.min(maxArrow, Math.max(arrowInset, anchorCenterX - left)));

  return { left, top, placement, arrowLeft };
}

