import { describe, expect, it } from 'vitest';
import { DEMO_MODELS } from '../../data/demoModels';
import { THEME_PRESETS } from '../../data/themePresets';
import { parseLDrawSource } from '../ldrawParser';
import { buildConnectivityGraph } from '../connectivity';
import { generateInstructionPlan } from '../stepGenerator';
import { buildPagePlans } from '../layoutEngine';
import {
  analyzePageBreakChangesOnRegeneration,
  areStepPartsEqual,
  clearAllStepPageBreaks,
  computeHelpTooltipPosition,
  countStepPageBreaks,
  findPageIndexForStep,
  getPageBreakHelpExplanation,
  getStepBreakFeedbackMessage,
  getStepBreakTooltip,
  hasStepPageBreak,
  isStepBreakContinuationSlice,
  remapPageBreaksAfterRegeneration,
  toggleStepPageBreakOverride,
  type RuntimeChapterLike,
  type RuntimeOverrideLike,
  type RuntimePageLike,
} from '../pageBreaks';
import type { BackConfig, BomConfig, CoverConfig, StepOverride } from '../../types/manual';

const DEFAULT_THEME = THEME_PRESETS['classic-lego-blue'].settings;
const DEFAULT_COVER: CoverConfig = {
  enabled: true,
  title: 'Test Manual',
  subtitle: 'Subtitle',
  author: 'Tester',
  setNumber: 'T-001',
  showPieceCount: true,
  showStepCount: true,
  heroView: 'top_front_right',
};
const DEFAULT_BACK: BackConfig = {
  enabled: true,
  headline: 'Done!',
  footerNote: 'Footer',
  showCompletionRender: true,
  showStatsSummary: true,
};
const DEFAULT_BOM: BomConfig = {
  enabled: true,
  title: 'Parts Inventory',
  sortMode: 'color-part',
  columns: 5,
};

describe('Per-Step Page Breaks', () => {
  it('toggles page breaks immutably on individual steps without affecting sibling overrides', () => {
    const initial: Record<string, RuntimeOverrideLike> = {
      s1: { az: 45, el: 30 },
      s2: { pliScale: 1.2 },
    };

    const enabled = toggleStepPageBreakOverride(initial, 's2');
    expect(enabled.pinned).toBe(true);
    expect(enabled.overrides.s2).toEqual({ pliScale: 1.2, pin: true });
    expect(enabled.overrides.s1).toEqual({ az: 45, el: 30 });
    expect(initial.s2).toEqual({ pliScale: 1.2 });

    const disabled = toggleStepPageBreakOverride(enabled.overrides, 's2');
    expect(disabled.pinned).toBe(false);
    expect(disabled.overrides.s2).toEqual({ pliScale: 1.2 });
    expect('pin' in disabled.overrides.s2).toBe(false);
  });

  it('counts live per-step page breaks accurately and ignores stale deleted-step keys', () => {
    const chapters: RuntimeChapterLike[] = [
      {
        id: 'ch_mf',
        kind: 'minifigure',
        steps: [{ id: 'mf_1', num: 1, minifigName: 'Explorer' }],
      },
      {
        id: 'ch_main',
        kind: 'main',
        steps: [
          { id: 's1', num: 2 },
          { id: 's2', num: 3 },
          { id: 's3', num: 4 },
        ],
      },
    ];
    const overrides: Record<string, RuntimeOverrideLike> = {
      mf_1: { pin: true },
      s2: { pin: true },
      deleted_step: { pin: true },
      s3: { az: 135 },
    };

    expect(countStepPageBreaks(chapters, overrides)).toBe(2);
  });

  it('never duplicates page-break state on sequential minifigure continuation pages', () => {
    const step = { id: 'mf_1', num: 1, minifigName: 'Explorer' };
    const overrides: Record<string, RuntimeOverrideLike> = { mf_1: { pin: true } };

    const firstSliceSlot = {
      step,
      minifigSeqSlice: { pageIdx: 0, pageCount: 2, start: 0, end: 3 },
    };
    const contSliceSlot = {
      step,
      minifigSeqSlice: { pageIdx: 1, pageCount: 2, start: 3, end: 6 },
    };

    expect(isStepBreakContinuationSlice(firstSliceSlot)).toBe(false);
    expect(isStepBreakContinuationSlice(contSliceSlot)).toBe(true);
    expect(hasStepPageBreak(overrides, step.id, firstSliceSlot)).toBe(true);
    expect(hasStepPageBreak(overrides, step.id, contSliceSlot)).toBe(false);
  });

  it('clears all per-step page breaks while keeping camera and layout overrides intact', () => {
    const overrides: Record<string, RuntimeOverrideLike> = {
      s1: { pin: true, az: 35 },
      s2: { pin: true },
      s3: { pliScale: 1.1 },
    };

    const cleared = clearAllStepPageBreaks(overrides);
    expect(cleared.clearedCount).toBe(2);
    expect(cleared.overrides.s1).toEqual({ az: 35 });
    expect(cleared.overrides.s2).toEqual({});
    expect(cleared.overrides.s3).toEqual({ pliScale: 1.1 });
    expect(overrides.s1.pin).toBe(true);
  });

  it('finds the first page index containing any target step and builds clear per-step tooltips & feedback', () => {
    const pages: RuntimePageLike[] = [
      { id: 'cover', kind: 'cover', num: 1 },
      { id: 'pg_s1', kind: 'steps', num: 2, slots: [{ step: { id: 's1', num: 1 } }, { step: { id: 's2', num: 2 } }] },
      { id: 'pg_s3', kind: 'steps', num: 3, slots: [{ step: { id: 's3', num: 3 } }] },
    ];

    expect(findPageIndexForStep(pages, 's1')).toBe(1);
    expect(findPageIndexForStep(pages, 's2')).toBe(1);
    expect(findPageIndexForStep(pages, 's3')).toBe(2);
    expect(findPageIndexForStep(pages, 'missing')).toBe(-1);

    expect(getStepBreakTooltip({ stepLabel: 'Step 2', pinned: false, slotIndex: 1 })).toContain(
      'starts on a new page',
    );
    expect(getStepBreakTooltip({ stepLabel: 'Step 1', pinned: false, slotIndex: 0 })).toContain(
      'before Step 1',
    );
    expect(getStepBreakTooltip({ stepLabel: 'Step 2', pinned: true, slotIndex: 0 })).toContain(
      'Remove page break before Step 2',
    );

    expect(
      getStepBreakFeedbackMessage({
        stepLabel: 'Step 2',
        pinned: true,
        movedToNewPage: true,
        targetPageNum: 3,
      }),
    ).toBe('Added page break — Step 2 now starts Page 3.');
    expect(
      getStepBreakFeedbackMessage({
        stepLabel: 'Step 2',
        pinned: false,
        movedToNewPage: false,
      }),
    ).toBe('Removed page break before Step 2 — pages can reflow freely.');
  });

  it('splits a non-first step off a multi-step page into a new page and reflows it back when cleared', () => {
    const cottage = DEMO_MODELS.find((d) => d.id === 'alpine-cottage')!;
    const model = parseLDrawSource(cottage.ldrawSource, 'cottage.ldr', 'demo');
    const graph = buildConnectivityGraph(model.parts);
    const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});

    const twoUpTheme = { ...DEFAULT_THEME, defaultLayout: '2-up' as const };
    const pagesBefore = buildPagePlans(
      model,
      plan,
      {},
      twoUpTheme,
      DEFAULT_COVER,
      DEFAULT_BACK,
      DEFAULT_BOM,
    );

    const multiStepPage = pagesBefore.find((p) => p.kind === 'steps' && (p.slots?.length || 0) >= 2);
    expect(multiStepPage).toBeDefined();

    const firstStepId = multiStepPage!.slots![0].stepId;
    const secondStepId = multiStepPage!.slots![1].stepId;

    const overrides: Record<string, StepOverride> = {
      [secondStepId]: { pinPageBreakBefore: true },
    };

    const pagesWithBreak = buildPagePlans(
      model,
      plan,
      overrides,
      twoUpTheme,
      DEFAULT_COVER,
      DEFAULT_BACK,
      DEFAULT_BOM,
    );

    const pageOfFirst = pagesWithBreak.find((p) => p.slots?.some((s) => s.stepId === firstStepId));
    const pageOfSecond = pagesWithBreak.find((p) => p.slots?.some((s) => s.stepId === secondStepId));
    expect(pageOfFirst).toBeDefined();
    expect(pageOfSecond).toBeDefined();
    expect(pageOfSecond!.pageNumber).toBe(pageOfFirst!.pageNumber + 1);
    expect(pageOfSecond!.slots![0].stepId).toBe(secondStepId);
    expect(pageOfSecond!.pinnedStart).toBe(true);

    // Removing the per-step break reflows secondStepId back onto firstStepId's page
    const pagesRestored = buildPagePlans(
      model,
      plan,
      {},
      twoUpTheme,
      DEFAULT_COVER,
      DEFAULT_BACK,
      DEFAULT_BOM,
    );
    const restoredPage = pagesRestored.find((p) => p.slots?.some((s) => s.stepId === firstStepId));
    expect(restoredPage!.slots!.map((s) => s.stepId)).toContain(secondStepId);
  });

  it('builds clear Page Break `?` help explanations for unpinned, pinned, and generic triggers', () => {
    expect(getPageBreakHelpExplanation({ stepLabel: 'Step 4', pinned: false })).toBe(
      'Locks Step 4 to the start of a new page so adding, splitting, or merging earlier steps won’t shift later pages.',
    );
    expect(getPageBreakHelpExplanation({ stepLabel: 'Step 4', pinned: true })).toBe(
      'Step 4 is locked to the start of a new page so earlier edits won’t shift later pages. Click Page Break to remove it.',
    );
    expect(getPageBreakHelpExplanation()).toBe(
      'Locks a step to the start of a new page so adding, splitting, or merging earlier steps won’t shift later pages.',
    );
    expect(getPageBreakHelpExplanation({ stepLabel: '   ', pinned: true })).toContain(
      'Locks a step to the start of a new page',
    );
  });

  it('positions floating help tooltips within viewport bounds and flips below near the top edge', () => {
    // Plenty of space above -> places above anchor and centers caret on anchor
    const above = computeHelpTooltipPosition({
      anchor: { left: 320, top: 300, right: 344, bottom: 328, width: 24, height: 28 },
      tooltip: { width: 260, height: 76 },
      viewport: { width: 1024, height: 768 },
    });
    expect(above.placement).toBe('top');
    expect(above.top).toBe(300 - 76 - 8);
    expect(above.left).toBe(332 - 130);
    expect(above.arrowLeft).toBe(130);

    // Near top edge -> flips below anchor
    const below = computeHelpTooltipPosition({
      anchor: { left: 320, top: 30, right: 344, bottom: 58, width: 24, height: 28 },
      tooltip: { width: 260, height: 76 },
      viewport: { width: 1024, height: 768 },
    });
    expect(below.placement).toBe('bottom');
    expect(below.top).toBe(58 + 8);

    // Near right edge on narrow mobile viewport -> clamps horizontally inside margin and aims arrow right
    const clampedRight = computeHelpTooltipPosition({
      anchor: { left: 340, top: 240, right: 364, bottom: 268, width: 24, height: 28 },
      tooltip: { width: 260, height: 76 },
      viewport: { width: 375, height: 667 },
    });
    expect(clampedRight.left).toBe(375 - 260 - 12);
    expect(clampedRight.left + 260).toBeLessThanOrEqual(375 - 12);
    expect(clampedRight.arrowLeft).toBe(Math.min(260 - 14, 352 - clampedRight.left));

    // Near left edge -> clamps left to margin and keeps arrow inset safely inside corner
    const clampedLeft = computeHelpTooltipPosition({
      anchor: { left: 4, top: 240, right: 24, bottom: 268, width: 20, height: 28 },
      tooltip: { width: 260, height: 76 },
      viewport: { width: 375, height: 667 },
    });
    expect(clampedLeft.left).toBe(12);
    expect(clampedLeft.arrowLeft).toBeGreaterThanOrEqual(14);
  });

  it('compares step part multisets order-independently by part id or geometric signature', () => {
    const a = { id: 's1', num: 1, parts: [{ id: 'imp_1', p: '3001', c: 4 }, { id: 'imp_2', p: '3003', c: 15 }] };
    const bSameReordered = { id: 's1', num: 1, parts: [{ id: 'imp_2', p: '3003', c: 15 }, { id: 'imp_1', p: '3001', c: 4 }] };
    const cDifferent = { id: 's1', num: 1, parts: [{ id: 'imp_1', p: '3001', c: 4 }, { id: 'imp_3', p: '3004', c: 15 }] };
    expect(areStepPartsEqual(a, bSameReordered)).toBe(true);
    expect(areStepPartsEqual(a, cDifferent)).toBe(false);
    expect(areStepPartsEqual(null, null)).toBe(true);
    expect(areStepPartsEqual(a, null)).toBe(false);
  });

  it('detects when the step before a page break changes parts on step regeneration', () => {
    const prevChapters: RuntimeChapterLike[] = [
      {
        id: 'ch1',
        steps: [
          { id: 'ac1_s1', num: 1, parts: [{ id: 'imp_1' }] },
          { id: 'ac1_s2', num: 2, parts: [{ id: 'imp_2' }, { id: 'imp_3' }] },
          { id: 'ac1_s3', num: 3, parts: [{ id: 'imp_4' }] },
          { id: 'ac1_s4', num: 4, parts: [{ id: 'imp_5' }] },
        ],
      },
    ];
    const overrides: Record<string, RuntimeOverrideLike> = {
      ac1_s3: { pin: true },
      deleted_step: { pin: true }, // stale override should be ignored
    };

    // Identical step 2 (even with reordered parts or changed step 3) -> no change warning
    const unchangedNext: RuntimeChapterLike[] = [
      {
        id: 'ch1',
        steps: [
          { id: 'ac1_s1', num: 1, parts: [{ id: 'imp_1' }] },
          { id: 'ac1_s2', num: 2, parts: [{ id: 'imp_3' }, { id: 'imp_2' }] },
          { id: 'ac1_s3', num: 3, parts: [{ id: 'imp_4' }, { id: 'imp_5' }] },
        ],
      },
    ];
    const unchangedRes = analyzePageBreakChangesOnRegeneration(prevChapters, unchangedNext, overrides);
    expect(unchangedRes.totalPageBreaks).toBe(1);
    expect(unchangedRes.hasChangedPredecessors).toBe(false);
    expect(unchangedRes.changedBreaks).toEqual([]);

    // Step 2 (immediately before the page break at Step 3) changed parts -> warning triggered
    const changedNext: RuntimeChapterLike[] = [
      {
        id: 'ch1',
        steps: [
          { id: 'ac1_s1', num: 1, parts: [{ id: 'imp_1' }] },
          { id: 'ac1_s2', num: 2, parts: [{ id: 'imp_2' }, { id: 'imp_3' }, { id: 'imp_4' }] },
          { id: 'ac1_s3', num: 3, parts: [{ id: 'imp_5' }] },
        ],
      },
    ];
    const changedRes = analyzePageBreakChangesOnRegeneration(prevChapters, changedNext, overrides);
    expect(changedRes.totalPageBreaks).toBe(1);
    expect(changedRes.hasChangedPredecessors).toBe(true);
    expect(changedRes.changedBreaks).toEqual([
      {
        stepId: 'ac1_s3',
        stepNum: 3,
        beforeStepNum: 2,
        nextStepId: 'ac1_s3',
        reason: 'parts_changed',
      },
    ]);

    // Regenerated manual has fewer steps so pinned Step 3 no longer exists -> warning triggered
    const shorterNext: RuntimeChapterLike[] = [
      {
        id: 'ch1',
        steps: [
          { id: 'kc1_s1', num: 1, parts: [{ id: 'imp_1' }, { id: 'imp_2' }] },
          { id: 'kc1_s2', num: 2, parts: [{ id: 'imp_3' }, { id: 'imp_4' }, { id: 'imp_5' }] },
        ],
      },
    ];
    const removedRes = analyzePageBreakChangesOnRegeneration(prevChapters, shorterNext, overrides);
    expect(removedRes.hasChangedPredecessors).toBe(true);
    expect(removedRes.changedBreaks[0]).toMatchObject({
      stepId: 'ac1_s3',
      stepNum: 3,
      beforeStepNum: 2,
      nextStepId: null,
      reason: 'step_removed',
    });
  });

  it('remaps kept page breaks by step number when regenerated step IDs change prefix', () => {
    const prevChapters: RuntimeChapterLike[] = [
      {
        id: 'ch1',
        steps: [
          { id: 'ac1_s1', num: 1, parts: [{ id: 'imp_1' }] },
          { id: 'ac1_s2', num: 2, parts: [{ id: 'imp_2' }] },
          { id: 'ac1_s3', num: 3, parts: [{ id: 'imp_3' }] },
        ],
      },
    ];
    const nextChapters: RuntimeChapterLike[] = [
      {
        id: 'kch1',
        steps: [
          { id: 'kc1_s1', num: 1, parts: [{ id: 'imp_1' }] },
          { id: 'kc1_s2', num: 2, parts: [{ id: 'imp_2' }] },
          { id: 'kc1_s3', num: 3, parts: [{ id: 'imp_3' }] },
        ],
      },
    ];
    const initial: Record<string, RuntimeOverrideLike> = {
      ac1_s3: { pin: true, az: 40 },
    };

    const remapped = remapPageBreaksAfterRegeneration(prevChapters, nextChapters, initial);
    expect(remapped.ac1_s3.pin).toBeUndefined();
    expect(remapped.ac1_s3.az).toBe(40);
    expect(remapped.kc1_s3.pin).toBe(true);
    // Original object untouched
    expect(initial.ac1_s3.pin).toBe(true);
    expect(initial.kc1_s3).toBeUndefined();
  });
});


