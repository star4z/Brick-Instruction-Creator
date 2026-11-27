import { describe, expect, it } from 'vitest';
import {
  clearStepRangeSelection,
  clickSpanInSelection,
  clickStepInSelection,
  computeDragRangeSelection,
  createStepRangeSelection,
  resolveDragRangeAction,
  setStepRangeSelectionSpan,
} from '../stepRangeSelection';
import {
  countStepsInRangeSpans,
  doRangeSpansOverlap,
  formatStepRangeSpans,
  isStepInRangeSpans,
  normalizeStepRangeSpans,
  parseStepRangeInput,
  rangeSpansToStepSet,
  stepSetToRangeSpans,
} from '../stepNumbering';

describe('StepRangeSpan utilities', () => {
  it('normalizes, sorts, clamps, and merges adjacent or overlapping spans', () => {
    expect(
      normalizeStepRangeSpans([
        { start: 8, end: 10 },
        { start: 3, end: 1 },
        { start: 4, end: 5 },
        { start: 9, end: 12 },
      ]),
    ).toEqual([
      { start: 1, end: 5 },
      { start: 8, end: 12 },
    ]);

    expect(
      normalizeStepRangeSpans([{ start: 1, end: 20 }], 10),
    ).toEqual([{ start: 1, end: 10 }]);
  });

  it('converts between step sets and merged spans and formats/parses discontinuous strings', () => {
    const spans = stepSetToRangeSpans([9, 2, 1, 5, 10, 3, 8]);
    expect(spans).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 10 },
    ]);
    expect(formatStepRangeSpans(spans)).toBe('#1–#3, #5, #8–#10');
    expect(formatStepRangeSpans(spans, { prefix: '', rangeDash: '-' })).toBe('1-3, 5, 8-10');
    expect(countStepsInRangeSpans(spans)).toBe(7);
    expect(Array.from(rangeSpansToStepSet(spans))).toEqual([1, 2, 3, 5, 8, 9, 10]);
    expect(isStepInRangeSpans(4, spans)).toBe(false);
    expect(isStepInRangeSpans(5, spans)).toBe(true);

    expect(parseStepRangeInput('1-3, #5, 10–8; 12')).toEqual([
      { start: 1, end: 3 },
      { start: 5, end: 5 },
      { start: 8, end: 10 },
      { start: 12, end: 12 },
    ]);
    expect(parseStepRangeInput('   ')).toEqual([]);
  });

  it('checks exact span overlap without false positives in gaps', () => {
    const discontinuous = [
      { start: 1, end: 2 },
      { start: 7, end: 9 },
    ];
    expect(doRangeSpansOverlap(discontinuous, [{ start: 3, end: 6 }])).toBe(false);
    expect(doRangeSpansOverlap(discontinuous, [{ start: 6, end: 7 }])).toBe(true);
  });
});

describe('StepRangeSelectionModel interactions', () => {
  it('toggles individual steps on plain clicks to build discontinuous selections', () => {
    const sel = createStepRangeSelection();
    clickStepInSelection(sel, 2);
    clickStepInSelection(sel, 5);
    clickStepInSelection(sel, 8);
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([
      { start: 2, end: 2 },
      { start: 5, end: 5 },
      { start: 8, end: 8 },
    ]);

    // Clicking an already-selected step toggles it off without clearing others
    clickStepInSelection(sel, 5);
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([
      { start: 2, end: 2 },
      { start: 8, end: 8 },
    ]);
  });

  it('extends ranges with Shift+click while preserving prior discontinuous selections', () => {
    const sel = createStepRangeSelection();
    clickStepInSelection(sel, 1);
    clickStepInSelection(sel, 3, { shiftKey: true });
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([{ start: 1, end: 3 }]);

    // Click an individual step after a gap, then Shift+click to select a second range
    clickStepInSelection(sel, 7);
    clickStepInSelection(sel, 10, { shiftKey: true });
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([
      { start: 1, end: 3 },
      { start: 7, end: 10 },
    ]);

    // Deselect a step, then Shift+click to deselect a sub-range
    clickStepInSelection(sel, 8);
    clickStepInSelection(sel, 9, { shiftKey: true });
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([
      { start: 1, end: 3 },
      { start: 7, end: 7 },
      { start: 10, end: 10 },
    ]);
  });

  it('supports clicking page header spans and Shift+clicking across spans', () => {
    const sel = createStepRangeSelection();
    clickSpanInSelection(sel, 1, 4);
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([{ start: 1, end: 4 }]);

    clickSpanInSelection(sel, 9, 12);
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([
      { start: 1, end: 4 },
      { start: 9, end: 12 },
    ]);

    // Clicking a fully-selected page header toggles its steps off
    clickSpanInSelection(sel, 1, 4);
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([{ start: 9, end: 12 }]);

    // Reset & set contiguous span
    setStepRangeSelectionSpan(sel, 2, 5);
    expect(stepSetToRangeSpans(sel.selectedSteps)).toEqual([{ start: 2, end: 5 }]);
    clearStepRangeSelection(sel);
    expect(sel.selectedSteps.size).toBe(0);
  });

  it('supports mobile hold-and-drag range selection (including tap-then-hold-and-drag)', () => {
    // Case 1: Hold directly on unselected step #3 -> immediately resolves to 'select'
    const base1 = new Set<number>([1]);
    expect(resolveDragRangeAction(base1, 3, null)).toBe('select');
    const dragged1 = computeDragRangeSelection(base1, 3, 6, 'select');
    expect(stepSetToRangeSpans(dragged1)).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 6 },
    ]);

    // Case 2: Tap #3 (now selected), then hold #3 and drag onto #4 (unselected) -> resolves to 'select'
    const base2 = new Set<number>([3]);
    expect(resolveDragRangeAction(base2, 3, null)).toBeNull();
    expect(resolveDragRangeAction(base2, 3, 4)).toBe('select');
    const dragged2 = computeDragRangeSelection(base2, 3, 7, 'select');
    expect(stepSetToRangeSpans(dragged2)).toEqual([{ start: 3, end: 7 }]);

    // Dragging back up to #5 before release cleanly restores #6 and #7 from base snapshot
    const backedUp = computeDragRangeSelection(base2, 3, 5, 'select');
    expect(stepSetToRangeSpans(backedUp)).toEqual([{ start: 3, end: 5 }]);

    // Case 3: Hold inside selected #1..#10 at #4 and drag onto selected #5 -> resolves to 'deselect'
    const base3 = rangeSpansToStepSet([{ start: 1, end: 10 }]);
    expect(resolveDragRangeAction(base3, 4, 5)).toBe('deselect');
    const carved = computeDragRangeSelection(base3, 4, 6, 'deselect');
    expect(stepSetToRangeSpans(carved)).toEqual([
      { start: 1, end: 3 },
      { start: 7, end: 10 },
    ]);
  });
});
