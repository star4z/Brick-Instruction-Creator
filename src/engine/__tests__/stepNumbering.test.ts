import { describe, expect, it } from 'vitest';
import {
  assignAbsoluteStepNumbers,
  formatAbsRange,
  formatDualStepLabel,
  getAbsStepNum,
  getChapterAbsRange,
  getSectionAbsRange,
  migrateLegacyLayoutGroups,
} from '../stepNumbering';
import { findLayoutGroupForStep, normalizeLayoutGroups } from '../pageLayout';

describe('stepNumbering', () => {
  it('assigns unique absolute numbers across chapters whose printed numbers restart', () => {
    const chapters = [
      { kind: 'minifigure', steps: [{ num: 1 }, { num: 2 }] },
      { kind: 'submodel', steps: [{ num: 1 }, { num: 2 }, { num: 3 }] },
      { kind: 'main', steps: [{ num: 1 }] },
    ] as Array<{ kind: string; steps: Array<{ num: number; absNum?: number }> }>;
    const total = assignAbsoluteStepNumbers(chapters);
    expect(total).toBe(6);
    expect(chapters.flatMap((c) => c.steps.map((s) => s.absNum))).toEqual([1, 2, 3, 4, 5, 6]);
    expect(chapters[1].steps.map((s) => s.num)).toEqual([1, 2, 3]);
  });

  it('formats dual labels and absolute ranges', () => {
    expect(formatDualStepLabel({ num: 1, absNum: 9 })).toBe('Step 1 · #9');
    expect(formatDualStepLabel({ num: 4, absNum: 4 })).toBe('Step 4');
    expect(formatDualStepLabel({ num: 4, absNum: 4 }, { alwaysShowAbs: true })).toBe('Step 4 · #4');
    expect(formatAbsRange(9, 4)).toBe('#4–#9');
    expect(formatAbsRange(3, 3)).toBe('#3');
    expect(getAbsStepNum({ num: 2 })).toBe(2);
  });

  it('migrates legacy (printed main-number) layout groups to absolute ranges', () => {
    // Submodel steps (abs 1–3, printed 1–3) precede main steps (abs 4–8, printed 1–5).
    const refs = [
      { num: 1, absNum: 1, isMain: false },
      { num: 2, absNum: 2, isMain: false },
      { num: 3, absNum: 3, isMain: false },
      { num: 1, absNum: 4, isMain: true },
      { num: 2, absNum: 5, isMain: true },
      { num: 3, absNum: 6, isMain: true },
      { num: 4, absNum: 7, isMain: true },
      { num: 5, absNum: 8, isMain: true },
    ];
    const legacy = normalizeLayoutGroups([{ id: 'g', name: 'G', startStepNum: 2, endStepNum: 4, layout: {} }]);
    expect(legacy[0].stepBasis).toBe('legacy');
    const [migrated] = migrateLegacyLayoutGroups(legacy, refs);
    expect(migrated.stepBasis).toBe('absolute');
    expect([migrated.startStepNum, migrated.endStepNum]).toEqual([5, 7]);
    // Submodel step with printed num 2 (abs 2) must NOT match the group.
    expect(findLayoutGroupForStep([migrated], 2)).toBeNull();
    expect(findLayoutGroupForStep([migrated], 6)?.id).toBe('g');
    // Already-absolute groups are untouched.
    const abs = normalizeLayoutGroups([{ id: 'a', name: 'A', startStepNum: 2, endStepNum: 3, stepBasis: 'absolute', layout: {} }]);
    expect(migrateLegacyLayoutGroups(abs, refs)[0]).toBe(abs[0]);
  });

  it('computes submodel and section preset ranges in absolute numbers', () => {
    const chapters = [
      { id: 'mf', kind: 'minifigure', sectionId: 'sec_minifigs', steps: [{ num: 1 }, { num: 2 }] },
      { id: 'bag1', kind: 'bag', sectionId: 'sec_bags', steps: [{ num: 1 }, { num: 2 }] },
      { id: 'fh', kind: 'submodel', sectionId: 'subsec_fh', steps: [{ num: 1 }, { num: 2 }, { num: 3 }] },
      { id: 'bag2', kind: 'bag', sectionId: 'sec_bags', steps: [{ num: 3 }] },
    ] as Array<{ id: string; kind: string; sectionId: string; steps: Array<{ num: number; absNum?: number }> }>;
    assignAbsoluteStepNumbers(chapters);
    expect(getChapterAbsRange(chapters[2])).toEqual({ lo: 5, hi: 7 });
    expect(getSectionAbsRange(chapters, chapters[2])).toEqual({ lo: 5, hi: 7 });
    expect(getSectionAbsRange(chapters, chapters[1])).toEqual({ lo: 3, hi: 8 });
    expect(getSectionAbsRange(chapters, chapters[0])).toEqual({ lo: 1, hi: 2 });
    expect(getChapterAbsRange(null)).toBeNull();
  });
});
