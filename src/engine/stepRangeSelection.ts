/**
 * Pure interactive selection state machine for selecting individual and
 * discontinuous step ranges across both desktop (click / Shift+click) and
 * mobile (tap / hold-and-drag).
 */

export type StepSelectionAction = 'select' | 'deselect';

export interface StepRangeSelectionModel {
  /** Currently selected 1-based absolute step numbers. */
  selectedSteps: Set<number>;
  /** Most recently interacted step number used as the anchor for Shift+click ranges. */
  anchorStep: number | null;
  /** Whether the anchor interaction selected or deselected, mirrored by Shift+click. */
  anchorAction: StepSelectionAction;
}

/** Creates a fresh selection model, optionally seeded with initial step numbers. */
export function createStepRangeSelection(initialSteps?: Iterable<number>): StepRangeSelectionModel {
  const selectedSteps = new Set<number>();
  let last: number | null = null;
  if (initialSteps) {
    for (const n of initialSteps) {
      if (typeof n === 'number' && Number.isFinite(n) && n >= 1) {
        const r = Math.round(n);
        selectedSteps.add(r);
        last = r;
      }
    }
  }
  return {
    selectedSteps,
    anchorStep: last,
    anchorAction: 'select',
  };
}

/** Replaces the selection with a single contiguous inclusive range [lo..hi]. */
export function setStepRangeSelectionSpan(
  model: StepRangeSelectionModel,
  lo: number,
  hi: number,
): void {
  const a = Math.max(1, Math.round(Math.min(lo, hi)));
  const b = Math.max(a, Math.round(Math.max(lo, hi)));
  model.selectedSteps.clear();
  for (let n = a; n <= b; n++) {
    model.selectedSteps.add(n);
  }
  model.anchorStep = b;
  model.anchorAction = 'select';
}

/** Clears all selected steps and resets the Shift+click anchor. */
export function clearStepRangeSelection(model: StepRangeSelectionModel): void {
  model.selectedSteps.clear();
  model.anchorStep = null;
  model.anchorAction = 'select';
}

/**
 * Handles a click/tap on a single step:
 * - Plain click: toggles that step individually and updates the anchor.
 * - Shift+click (when an anchor exists): applies the anchor's action ('select' or 'deselect')
 *   to every step in the inclusive range between the anchor and `stepNum`.
 */
export function clickStepInSelection(
  model: StepRangeSelectionModel,
  stepNum: number,
  opts: { shiftKey?: boolean } = {},
): void {
  const target = Math.max(1, Math.round(stepNum));
  if (opts.shiftKey && model.anchorStep !== null) {
    const lo = Math.min(model.anchorStep, target);
    const hi = Math.max(model.anchorStep, target);
    for (let n = lo; n <= hi; n++) {
      if (model.anchorAction === 'select') {
        model.selectedSteps.add(n);
      } else {
        model.selectedSteps.delete(n);
      }
    }
    model.anchorStep = target;
    return;
  }

  if (model.selectedSteps.has(target)) {
    model.selectedSteps.delete(target);
    model.anchorStep = target;
    model.anchorAction = 'deselect';
  } else {
    model.selectedSteps.add(target);
    model.anchorStep = target;
    model.anchorAction = 'select';
  }
}

/**
 * Handles clicking a page header representing an inclusive span [lo..hi]:
 * - Plain click: if all steps in [lo..hi] are selected, deselects them; otherwise selects them all.
 * - Shift+click (when an anchor exists): extends from anchor across [lo..hi] using anchorAction.
 */
export function clickSpanInSelection(
  model: StepRangeSelectionModel,
  lo: number,
  hi: number,
  opts: { shiftKey?: boolean } = {},
): void {
  const a = Math.max(1, Math.round(Math.min(lo, hi)));
  const b = Math.max(a, Math.round(Math.max(lo, hi)));

  if (opts.shiftKey && model.anchorStep !== null) {
    const rangeLo = Math.min(model.anchorStep, a);
    const rangeHi = Math.max(model.anchorStep, b);
    for (let n = rangeLo; n <= rangeHi; n++) {
      if (model.anchorAction === 'select') {
        model.selectedSteps.add(n);
      } else {
        model.selectedSteps.delete(n);
      }
    }
    model.anchorStep = Math.abs(b - model.anchorStep) >= Math.abs(a - model.anchorStep) ? b : a;
    return;
  }

  let allSelected = true;
  for (let n = a; n <= b; n++) {
    if (!model.selectedSteps.has(n)) {
      allSelected = false;
      break;
    }
  }
  if (allSelected) {
    for (let n = a; n <= b; n++) model.selectedSteps.delete(n);
    model.anchorStep = a;
    model.anchorAction = 'deselect';
  } else {
    for (let n = a; n <= b; n++) model.selectedSteps.add(n);
    model.anchorStep = b;
    model.anchorAction = 'select';
  }
}

/**
 * Resolves whether a hold-and-drag gesture starting on `startStep` should select
 * or deselect the dragged range.
 *
 * - If `startStep` was not selected, the drag immediately selects (`'select'`).
 * - If `startStep` was already selected (e.g. user tapped it first, then held & dragged),
 *   action stays `null` until the pointer reaches a different step `targetStep`:
 *   moving onto an unselected step resolves to `'select'`, whereas moving onto an
 *   already-selected step resolves to `'deselect'`.
 */
export function resolveDragRangeAction(
  baseSelected: ReadonlySet<number>,
  startStep: number,
  targetStep: number | null,
): StepSelectionAction | null {
  if (!baseSelected.has(startStep)) return 'select';
  if (targetStep === null || targetStep === startStep) return null;
  return baseSelected.has(targetStep) ? 'deselect' : 'select';
}

/**
 * Computes the new selected set by applying `action` over the inclusive range
 * `[min(startStep, currentStep)..max(startStep, currentStep)]` on top of the
 * pre-drag `baseSelected` snapshot.
 */
export function computeDragRangeSelection(
  baseSelected: ReadonlySet<number>,
  startStep: number,
  currentStep: number,
  action: StepSelectionAction,
): Set<number> {
  const next = new Set<number>(baseSelected);
  const lo = Math.max(1, Math.round(Math.min(startStep, currentStep)));
  const hi = Math.max(lo, Math.round(Math.max(startStep, currentStep)));
  for (let n = lo; n <= hi; n++) {
    if (action === 'select') {
      next.add(n);
    } else {
      next.delete(n);
    }
  }
  return next;
}
