export interface RuntimePartLike {
  id?: string;
  p?: string;
  c?: number;
  x?: number;
  y?: number;
  z?: number;
  [key: string]: unknown;
}

export interface RuntimeStepLike {
  id: string;
  num: number;
  parts?: ReadonlyArray<RuntimePartLike | unknown>;
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

export interface ChangedPageBreakPredecessor {
  /** Pinned step ID in the previous manual (the step immediately after the page break). */
  stepId: string;
  /** Pinned step number in the previous manual. */
  stepNum: number;
  /** Step number immediately before the page break in the previous manual (null if break was before Step 1). */
  beforeStepNum: number | null;
  /** Matched step ID in the regenerated manual (by ID first, then by step number), or null if no longer present. */
  nextStepId: string | null;
  /** Reason the predecessor changed: parts differed or the pinned step no longer exists. */
  reason: 'parts_changed' | 'step_removed';
}

export interface PageBreakRegenerationAnalysis {
  /** Total active page breaks in the previous manual. */
  totalPageBreaks: number;
  /** Page breaks whose immediately preceding step changed parts (or whose pinned step disappeared). */
  changedBreaks: ChangedPageBreakPredecessor[];
  /** True when at least one page break's preceding step has changed parts. */
  hasChangedPredecessors: boolean;
}

/**
 * Produces a deterministic, order-independent list of canonical keys representing
 * the parts placed in a single step. Uses each part's stable unique `id` when present,
 * falling back to part type + color + rounded world coordinates.
 */
export function getStepPartKeys(step: RuntimeStepLike | null | undefined): string[] {
  const parts = step?.parts;
  if (!parts || parts.length === 0) return [];
  const keys: string[] = [];
  for (const raw of parts) {
    if (raw && typeof raw === 'object') {
      const part = raw as RuntimePartLike;
      if (typeof part.id === 'string' && part.id.length > 0) {
        keys.push(`id:${part.id}`);
      } else {
        const px = typeof part.x === 'number' && Number.isFinite(part.x) ? Math.round(part.x * 100) : '';
        const py = typeof part.y === 'number' && Number.isFinite(part.y) ? Math.round(part.y * 100) : '';
        const pz = typeof part.z === 'number' && Number.isFinite(part.z) ? Math.round(part.z * 100) : '';
        keys.push(`sig:${String(part.p ?? '')}|${String(part.c ?? '')}|${px},${py},${pz}`);
      }
    } else {
      keys.push(`val:${String(raw)}`);
    }
  }
  keys.sort();
  return keys;
}

/**
 * Returns true when two steps contain the exact same multiset of parts (ignoring order).
 */
export function areStepPartsEqual(
  a: RuntimeStepLike | null | undefined,
  b: RuntimeStepLike | null | undefined,
): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  const ka = getStepPartKeys(a);
  const kb = getStepPartKeys(b);
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i]) return false;
  }
  return true;
}

function flattenChapterSteps(
  chapters: RuntimeChapterLike[] | null | undefined,
): RuntimeStepLike[] {
  if (!chapters) return [];
  const out: RuntimeStepLike[] = [];
  for (const ch of chapters) {
    if (ch?.steps) {
      for (const step of ch.steps) {
        out.push(step);
      }
    }
  }
  return out;
}

/**
 * Compares the current manual against a freshly regenerated manual to detect whether
 * the parts in the step immediately before any active page break have changed.
 */
export function analyzePageBreakChangesOnRegeneration(
  prevChapters: RuntimeChapterLike[] | null | undefined,
  nextChapters: RuntimeChapterLike[] | null | undefined,
  overrides: Record<string, RuntimeOverrideLike> | null | undefined,
): PageBreakRegenerationAnalysis {
  const prevSteps = flattenChapterSteps(prevChapters);
  const nextSteps = flattenChapterSteps(nextChapters);
  if (!overrides || prevSteps.length === 0) {
    return { totalPageBreaks: 0, changedBreaks: [], hasChangedPredecessors: false };
  }

  const nextIndexById = new Map<string, number>();
  const nextIndexByNum = new Map<number, number>();
  for (let j = 0; j < nextSteps.length; j++) {
    const s = nextSteps[j];
    if (!nextIndexById.has(s.id)) nextIndexById.set(s.id, j);
    if (!nextIndexByNum.has(s.num)) nextIndexByNum.set(s.num, j);
  }

  let totalPageBreaks = 0;
  const changedBreaks: ChangedPageBreakPredecessor[] = [];

  for (let i = 0; i < prevSteps.length; i++) {
    const prevStep = prevSteps[i];
    if (!overrides[prevStep.id]?.pin) continue;
    totalPageBreaks += 1;
    const prevBefore = i > 0 ? prevSteps[i - 1] : null;

    const nextIdx = nextIndexById.has(prevStep.id)
      ? nextIndexById.get(prevStep.id)!
      : (nextIndexByNum.has(prevStep.num) ? nextIndexByNum.get(prevStep.num)! : -1);

    if (nextIdx === -1) {
      changedBreaks.push({
        stepId: prevStep.id,
        stepNum: prevStep.num,
        beforeStepNum: prevBefore ? prevBefore.num : null,
        nextStepId: null,
        reason: 'step_removed',
      });
      continue;
    }

    const nextStep = nextSteps[nextIdx];
    const nextBefore = nextIdx > 0 ? nextSteps[nextIdx - 1] : null;
    if (!areStepPartsEqual(prevBefore, nextBefore)) {
      changedBreaks.push({
        stepId: prevStep.id,
        stepNum: prevStep.num,
        beforeStepNum: prevBefore ? prevBefore.num : null,
        nextStepId: nextStep.id,
        reason: 'parts_changed',
      });
    }
  }

  return {
    totalPageBreaks,
    changedBreaks,
    hasChangedPredecessors: changedBreaks.length > 0,
  };
}

/**
 * Immutably preserves active page breaks across step regeneration. When a pinned step's
 * internal ID changes (for example switching between Auto-Step, Keep File Steps, or a
 * different subdivision plan), transfers its `pin` flag to the matching step number in
 * the regenerated manual so choosing "Keep Page Breaks" keeps breaks visibly intact.
 */
export function remapPageBreaksAfterRegeneration<T extends RuntimeOverrideLike>(
  prevChapters: RuntimeChapterLike[] | null | undefined,
  nextChapters: RuntimeChapterLike[] | null | undefined,
  overrides: Record<string, T>,
): Record<string, T> {
  const prevSteps = flattenChapterSteps(prevChapters);
  const nextSteps = flattenChapterSteps(nextChapters);
  if (prevSteps.length === 0 || nextSteps.length === 0) return { ...overrides };

  const nextIdSet = new Set<string>();
  const nextByNum = new Map<number, RuntimeStepLike>();
  for (const s of nextSteps) {
    nextIdSet.add(s.id);
    if (!nextByNum.has(s.num)) nextByNum.set(s.num, s);
  }

  const next: Record<string, T> = { ...overrides };
  for (const prevStep of prevSteps) {
    if (!overrides[prevStep.id]?.pin) continue;
    if (nextIdSet.has(prevStep.id)) continue;

    // Clear stale pin on the old step ID (preserving any non-pin keys)
    const oldEntry = { ...next[prevStep.id] } as T;
    delete oldEntry.pin;
    next[prevStep.id] = oldEntry;

    // Transfer pin to the regenerated step at the same step number if present
    const matched = nextByNum.get(prevStep.num);
    if (matched) {
      const targetEntry = { ...(next[matched.id] || ({} as T)) } as T;
      targetEntry.pin = true;
      next[matched.id] = targetEntry;
    }
  }

  return next;
}


