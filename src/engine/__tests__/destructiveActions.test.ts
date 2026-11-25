import { describe, expect, it } from 'vitest';
import {
  formatCompactList,
  getApplyCameraDestructiveNotice,
  getCloseModelDestructiveNotice,
  getDeleteThemeDestructiveNotice,
  getLayoutGroupOverlapDestructiveNotice,
  getLibraryClearSavedDestructiveNotice,
  getLibraryRemovePartDestructiveNotice,
  getMergeStepDestructiveNotice,
  getPartsMoveStepDestructiveNotice,
  getReplaceModelModalDestructiveNotice,
  getStepGenerationDestructiveNotice,
  getWordlessToggleDestructiveNotice,
  hasCustomPartOffset,
  summarizeManualEdits,
  summarizeStepOverrides,
} from '../destructiveActions';
import { createDefaultPageLayoutSpec, type StepLayoutGroup } from '../pageLayout';

describe('destructiveActions engine', () => {
  it('formats compact human-readable lists cleanly', () => {
    expect(formatCompactList([])).toBe('');
    expect(formatCompactList(['camera'])).toBe('camera');
    expect(formatCompactList(['camera', 'zoom'])).toBe('camera and zoom');
    expect(formatCompactList(['camera', 'zoom', 'framing'])).toBe('camera, zoom, and framing');
    expect(formatCompactList(['a', 'b', 'c', 'd', 'e'], 3)).toBe('a, b, c, and 2 more');
  });

  it('detects custom part offsets including defaultPartOffsets diffs', () => {
    expect(hasCustomPartOffset(undefined)).toBe(false);
    expect(hasCustomPartOffset({ x: 0, y: 0, z: 0, tilt: 0, arrow: true })).toBe(false);
    expect(hasCustomPartOffset({ x: 20, y: 0, z: 0, tilt: 0, arrow: true })).toBe(true);
    expect(hasCustomPartOffset({ x: 0, y: 0, z: 0, tilt: 15, arrow: true })).toBe(true);
    expect(hasCustomPartOffset({ x: 0, y: 0, z: 0, tilt: 0, arrow: false })).toBe(true);
    expect(
      hasCustomPartOffset(
        { x: 0, y: 40, z: 0, tilt: 0, arrow: true },
        { x: 0, y: 40, z: 0, tilt: 0, arrow: true },
      ),
    ).toBe(false);
    expect(
      hasCustomPartOffset(
        { x: 0, y: 60, z: 0, tilt: 0, arrow: true },
        { x: 0, y: 40, z: 0, tilt: 0, arrow: true },
      ),
    ).toBe(true);
  });

  it('summarizes per-step overrides (including nonPartLabels) and full manual edits accurately', () => {
    const stepSum = summarizeStepOverrides(
      {
        az: 142,
        modelScale: 1.2,
        pliScale: 1.3,
        pin: true,
        calloutDir: 'vertical',
        partOffsets: {
          p1: { x: 20, y: 0, z: 0, tilt: 0, arrow: true },
          p2: { x: 0, y: 0, z: 0, tilt: 0, arrow: true },
        },
      },
      2,
      true,
    );
    expect(stepSum.hasAny).toBe(true);
    expect(stepSum.partOffsetCount).toBe(1);
    expect(stepSum.labels).toEqual([
      'custom camera',
      '1 part nudge',
      'Parts Box size',
      'page break',
      'callout layout',
      '2 notes',
      'subassembly callout',
    ]);
    expect(stepSum.nonPartLabels).toEqual([
      'custom camera',
      'Parts Box size',
      'page break',
      'callout layout',
      '2 notes',
      'subassembly callout',
    ]);

    const manualSum = summarizeManualEdits({
      chapters: [
        {
          id: 'ch1',
          steps: [
            { id: 's1', num: 1 },
            { id: 's2_s_abc', num: 2 },
          ],
        },
      ],
      overrides: {
        s1: { az: 142, pin: true },
        stale_deleted_step: { az: 225, pin: true },
      },
      stepInserts: {
        s1: [{ id: 'ins1' }],
        stale_deleted_step: [{ id: 'ins2' }],
      },
      dividerAfter: { pg_1: { title: 'Bag 2' } },
      layoutGroups: [
        {
          id: 'g1',
          name: 'Detail',
          startStepNum: 1,
          endStepNum: 2,
          stepBasis: 'absolute',
          layout: createDefaultPageLayoutSpec(),
        },
      ],
      coverMeta: { title: 'Custom Cover Title', showText: true },
      modelTitle: 'Original Model',
      wordlessMode: true,
    });

    expect(manualSum.cameraOverrideSteps).toBe(1);
    expect(manualSum.pageBreakSteps).toBe(1);
    expect(manualSum.stepInsertCount).toBe(1);
    expect(manualSum.manualSplitSteps).toBe(1);
    expect(manualSum.dividerCount).toBe(1);
    expect(manualSum.layoutGroupCount).toBe(1);
    expect(manualSum.hasCustomCoverText).toBe(true);
    expect(manualSum.hasCustomCompleteText).toBe(false);
    expect(manualSum.hasCoverOrExtraPageEdits).toBe(true);
    expect(manualSum.stepItems).not.toContain('cover/extra-page edits');
    expect(manualSum.items).toContain('cover/extra-page edits');
  });

  describe('getApplyCameraDestructiveNotice', () => {
    const steps = [
      { id: 's1', num: 1, absNum: 1 },
      { id: 's2', num: 2, absNum: 2 },
      { id: 's3', num: 3, absNum: 3 },
      { id: 's4', num: 1, absNum: 4 },
      { id: 's5', num: 2, absNum: 5 },
    ];

    it('returns null when no other steps in the selected range have overrides', () => {
      const res = getApplyCameraDestructiveNotice({
        steps,
        overrides: {
          s1: { az: 142, el: 30 }, // source step itself is ignored
          s5: { az: 218, el: 30 }, // outside range [1..3]
        },
        sourceStepId: 's1',
        startNum: 1,
        endNum: 3,
        includeFraming: false,
      });
      expect(res.notice).toBeNull();
      expect(res.affectedStepIds).toEqual([]);
    });

    it('warns only about zoom/framing conflicts when includeFraming is enabled', () => {
      const overrides = {
        s3: { modelScale: 1.4 },
      };
      const withoutFraming = getApplyCameraDestructiveNotice({
        steps,
        overrides,
        sourceStepId: 's1',
        startNum: 1,
        endNum: 4,
        includeFraming: false,
      });
      expect(withoutFraming.notice).toBeNull();

      const withFraming = getApplyCameraDestructiveNotice({
        steps,
        overrides,
        sourceStepId: 's1',
        startNum: 1,
        endNum: 4,
        includeFraming: true,
      });
      expect(withFraming.notice?.tone).toBe('warning');
      expect(withFraming.notice?.undoable).toBe(true);
      expect(withFraming.notice?.message).toContain('custom zoom or framing overrides');
      expect(withFraming.notice?.message).toContain('Step 3');
    });

    it('names up to 3 affected steps and formats dual submodel step labels', () => {
      const res = getApplyCameraDestructiveNotice({
        steps,
        overrides: {
          s2: { corner: 'back_right', az: 142 },
          s4: { side: 'bottom', el: -30 },
        },
        sourceStepId: 's1',
        startNum: 1,
        endNum: 5,
        includeFraming: false,
      });
      expect(res.affectedStepIds).toEqual(['s2', 's4']);
      expect(res.notice?.message).toContain('2 other steps in this range');
      expect(res.notice?.message).toContain('Step 2');
      expect(res.notice?.message).toContain('Step 1 (#4)');
    });
  });

  describe('getWordlessToggleDestructiveNotice', () => {
    it('returns null on untouched defaults (both Wordless ON and Wordless OFF)', () => {
      expect(
        getWordlessToggleDestructiveNotice({
          currentWordless: true,
          coverShowText: false,
          completeShowText: false,
          bomShowTextFields: false,
          pageNumberFormat: 'number',
        }),
      ).toBeNull();

      expect(
        getWordlessToggleDestructiveNotice({
          currentWordless: false,
          coverShowText: true,
          completeShowText: true,
          bomShowTextFields: true,
          pageNumberFormat: 'page_n',
        }),
      ).toBeNull();
    });

    it('warns when turning Wordless ON hides custom Cover or Build Complete text the user edited', () => {
      const notice = getWordlessToggleDestructiveNotice({
        currentWordless: false,
        coverShowText: true,
        completeShowText: true,
        bomShowTextFields: true,
        pageNumberFormat: 'page_n',
        hasCustomCoverText: true,
        hasCustomCompleteText: false,
      });
      expect(notice?.tone).toBe('warning');
      expect(notice?.undoable).toBe(true);
      expect(notice?.message).toContain('hides your custom Front Cover title/subtitle');
    });

    it('warns when turning Wordless OFF resets custom extra-page text overrides made in Wordless mode', () => {
      const notice = getWordlessToggleDestructiveNotice({
        currentWordless: true,
        coverShowText: true, // customized ON while in Wordless mode
        completeShowText: false,
        bomShowTextFields: true, // customized ON while in Wordless mode
        pageNumberFormat: 'n_of_total', // preserved by resolvePageNumberFormatForMode
      });
      expect(notice?.tone).toBe('warning');
      expect(notice?.message).toContain('resets your extra-page text overrides');
      expect(notice?.message).toContain('enables Build Complete text');
      expect(notice?.message).not.toContain('Front Cover title');
      expect(notice?.message).not.toContain('page numbers');
    });

    it('warns when turning Wordless ON resets customized extra-page toggles made in text mode', () => {
      const notice = getWordlessToggleDestructiveNotice({
        currentWordless: false,
        coverShowText: false, // customized OFF while in text mode
        completeShowText: true,
        bomShowTextFields: true,
        pageNumberFormat: 'page_n',
      });
      expect(notice?.tone).toBe('warning');
      expect(notice?.message).toContain('resets extra-page text overrides');
      expect(notice?.message).toContain('Build Complete text');
      expect(notice?.message).toContain('Parts List names & colors');
      expect(notice?.message).toContain('switches page numbers to 1');
    });
  });

  describe('getMergeStepDestructiveNotice', () => {
    it('returns null when the step has no overrides or notes', () => {
      expect(
        getMergeStepDestructiveNotice({
          stepNum: 5,
          override: {},
          insertCount: 0,
          hasSubassembly: false,
        }),
      ).toBeNull();
    });

    it('reports step overrides and notes cleared when merging a customized step', () => {
      const withEdits = getMergeStepDestructiveNotice({
        stepNum: 5,
        override: { az: 218, pin: true, partOffsets: { p1: { x: 20, y: 0, z: 0 } } },
        insertCount: 1,
        hasSubassembly: false,
      });
      expect(withEdits?.tone).toBe('warning');
      expect(withEdits?.undoable).toBe(true);
      expect(withEdits?.message).toContain("clears Step 5's");
      expect(withEdits?.message).toContain('custom camera');
      expect(withEdits?.message).toContain('1 part nudge');
      expect(withEdits?.message).toContain('page break');
      expect(withEdits?.message).toContain('1 note');
    });
  });

  describe('getPartsMoveStepDestructiveNotice', () => {
    it('returns null for subset selections and for all-parts selections without off-tab overrides', () => {
      // Subset selected even with camera/part overrides -> no warning
      expect(
        getPartsMoveStepDestructiveNotice({
          stepNum: 3,
          totalPartsInStep: 4,
          selectedPartCount: 2,
          override: { az: 142, partOffsets: { p1: { x: 20, y: 0, z: 0 } } },
          insertCount: 1,
          hasSubassembly: false,
        }),
      ).toBeNull();

      // All parts selected, only part nudges (visible on Parts tab) -> no warning
      expect(
        getPartsMoveStepDestructiveNotice({
          stepNum: 3,
          totalPartsInStep: 2,
          selectedPartCount: 2,
          override: { partOffsets: { p1: { x: 20, y: 0, z: 0 } } },
          insertCount: 0,
          hasSubassembly: false,
        }),
      ).toBeNull();
    });

    it('warns when ALL parts are selected and the step has off-tab overrides', () => {
      const notice = getPartsMoveStepDestructiveNotice({
        stepNum: 3,
        totalPartsInStep: 2,
        selectedPartCount: 2,
        override: { az: 142, pin: true, partOffsets: { p1: { x: 20, y: 0, z: 0 } } },
        insertCount: 1,
        hasSubassembly: true,
      });
      expect(notice?.tone).toBe('warning');
      expect(notice?.undoable).toBe(true);
      expect(notice?.message).toContain('All parts selected');
      expect(notice?.message).toContain('removes Step 3');
      expect(notice?.message).toContain('custom camera');
      expect(notice?.message).toContain('page break');
      expect(notice?.message).toContain('1 note');
      expect(notice?.message).toContain('subassembly callout');
      expect(notice?.message).not.toContain('part nudge');
    });
  });

  describe('Step Generation, Close Model, and Replace Model notices', () => {
    const cleanEdits = summarizeManualEdits({});
    const editsSummary = summarizeManualEdits({
      chapters: [{ id: 'c1', steps: [{ id: 's1', num: 1 }] }],
      overrides: { s1: { az: 142, pin: true } },
      stepInserts: { s1: [{ id: 'n1' }] },
    });

    it('shows zero warnings on untouched models with no edits and no Undo history', () => {
      expect(
        getStepGenerationDestructiveNotice({
          isPostImport: true,
          hasOpenModel: true,
          openModelTitle: 'Speedster',
          editsSummary: cleanEdits,
        }),
      ).toBeNull();

      expect(
        getStepGenerationDestructiveNotice({
          isPostImport: false,
          hasOpenModel: true,
          openModelTitle: 'Speedster',
          editsSummary: cleanEdits,
          undoHistoryCount: 0,
        }),
      ).toBeNull();

      expect(getCloseModelDestructiveNotice({ editsSummary: cleanEdits, undoHistoryCount: 0 })).toBeNull();

      expect(
        getReplaceModelModalDestructiveNotice({
          hasOpenModel: true,
          modelTitle: 'Speedster',
          editsSummary: cleanEdits,
          undoHistoryCount: 0,
        }),
      ).toBeNull();
    });

    it('warns on non-undoable Close / Replace / New Import when edits OR Undo history exist', () => {
      const replaceOnNewImport = getStepGenerationDestructiveNotice({
        isPostImport: false,
        hasOpenModel: true,
        openModelTitle: 'Speedster',
        editsSummary,
      });
      expect(replaceOnNewImport?.tone).toBe('danger');
      expect(replaceOnNewImport?.undoable).toBe(false);
      expect(replaceOnNewImport?.message).toContain('Replaces "Speedster"');
      expect(replaceOnNewImport?.message).toContain('cannot be undone');

      const closeWithEdits = getCloseModelDestructiveNotice({ editsSummary });
      expect(closeWithEdits?.tone).toBe('danger');
      expect(closeWithEdits?.undoable).toBe(false);
      expect(closeWithEdits?.message).toContain('Export .biw first');

      const closeWithUndoOnly = getCloseModelDestructiveNotice({
        editsSummary: cleanEdits,
        undoHistoryCount: 2,
      });
      expect(closeWithUndoOnly?.tone).toBe('danger');
      expect(closeWithUndoOnly?.undoable).toBe(false);
      expect(closeWithUndoOnly?.message).toContain('unsaved session changes');

      const openModalNotice = getReplaceModelModalDestructiveNotice({
        hasOpenModel: true,
        modelTitle: 'Speedster',
        editsSummary,
      });
      expect(openModalNotice?.tone).toBe('danger');
      expect(openModalNotice?.message).toContain('Speedster');

      const openModalUndoOnly = getReplaceModelModalDestructiveNotice({
        hasOpenModel: true,
        modelTitle: 'Speedster',
        editsSummary: cleanEdits,
        undoHistoryCount: 1,
      });
      expect(openModalUndoOnly?.tone).toBe('danger');
      expect(openModalUndoOnly?.message).toContain('unsaved session changes');

      expect(
        getReplaceModelModalDestructiveNotice({
          hasOpenModel: false,
          editsSummary,
          undoHistoryCount: 3,
        }),
      ).toBeNull();
    });

    it('warns on post-import Step Generation when step/layout overrides or custom Wordless overrides are affected', () => {
      const wordlessNotice = getWordlessToggleDestructiveNotice({
        currentWordless: false,
        coverShowText: true,
        completeShowText: true,
        bomShowTextFields: true,
        pageNumberFormat: 'page_n',
        hasCustomCoverText: true,
      });

      const regenPost = getStepGenerationDestructiveNotice({
        isPostImport: true,
        hasOpenModel: true,
        openModelTitle: 'Speedster',
        editsSummary,
        wordlessResetNotice: wordlessNotice,
      });
      expect(regenPost?.tone).toBe('warning');
      expect(regenPost?.undoable).toBe(true);
      expect(regenPost?.message).toContain('1 camera override');
      expect(regenPost?.message).toContain('1 page break');
      expect(regenPost?.message).toContain('custom extra-page text overrides');

      const keepPost = getStepGenerationDestructiveNotice({
        isPostImport: true,
        hasOpenModel: true,
        openModelTitle: 'Speedster',
        editsSummary,
        isKeepStepsAction: true,
      });
      expect(keepPost?.tone).toBe('warning');
      expect(keepPost?.message).toContain('Keeping file steps');
    });
  });

  describe('Delete Custom Theme and Step Range Group Overlap notices', () => {
    it('always warns on non-undoable custom theme deletion and names referencing groups', () => {
      expect(
        getDeleteThemeDestructiveNotice({
          themeName: 'Classic Blue',
          isBuiltIn: true,
          referencingGroupNames: [],
        }),
      ).toBeNull();

      const customNoRefs = getDeleteThemeDestructiveNotice({
        themeName: 'Midnight Mint',
        isBuiltIn: false,
        referencingGroupNames: [],
      });
      expect(customNoRefs?.tone).toBe('danger');
      expect(customNoRefs?.undoable).toBe(false);
      expect(customNoRefs?.message).toContain('cannot be undone');

      const customWithRefs = getDeleteThemeDestructiveNotice({
        themeName: 'Midnight Mint',
        isBuiltIn: false,
        referencingGroupNames: ['Detail Steps', 'Roof'],
      });
      expect(customWithRefs?.tone).toBe('danger');
      expect(customWithRefs?.undoable).toBe(false);
      expect(customWithRefs?.message).toContain('2 Step Range Groups');
      expect(customWithRefs?.message).toContain('Detail Steps and Roof');
    });

    it('warns on overlapping Step Range Groups and returns null for non-overlapping ranges', () => {
      const groups: StepLayoutGroup[] = [
        {
          id: 'g1',
          name: 'Chassis',
          startStepNum: 1,
          endStepNum: 6,
          stepBasis: 'absolute',
          layout: createDefaultPageLayoutSpec(),
          themeId: 'midnight',
        },
        {
          id: 'g2',
          name: 'Bodywork',
          startStepNum: 7,
          endStepNum: 12,
          stepBasis: 'absolute',
          layout: createDefaultPageLayoutSpec(),
        },
      ];

      expect(
        getLayoutGroupOverlapDestructiveNotice({
          editingId: null,
          startStepNum: 13,
          endStepNum: 16,
          existingGroups: groups,
        }),
      ).toBeNull();

      const newOverlapping = getLayoutGroupOverlapDestructiveNotice({
        editingId: null,
        startStepNum: 4,
        endStepNum: 8,
        existingGroups: groups,
      });
      expect(newOverlapping?.tone).toBe('warning');
      expect(newOverlapping?.undoable).toBe(true);
      expect(newOverlapping?.message).toContain('Saving overrides');
      expect(newOverlapping?.message).toContain('"Chassis" (#1–#6)');

      const editEarlierOverlappingLater = getLayoutGroupOverlapDestructiveNotice({
        editingId: 'g1',
        startStepNum: 1,
        endStepNum: 9,
        existingGroups: groups,
      });
      expect(editEarlierOverlappingLater?.message).toContain('listed later and takes priority');
    });
  });

  describe('Bricks Library permanent removal notices', () => {
    it('always warns on non-undoable single part removal and highlights open-model reliance', () => {
      const inUsePart = getLibraryRemovePartDestructiveNotice({
        partId: '3001',
        usedInModel: true,
        hasEmbeddedCopy: false,
      });
      expect(inUsePart.tone).toBe('danger');
      expect(inUsePart.undoable).toBe(false);
      expect(inUsePart.message).toContain('cannot be undone');
      expect(inUsePart.message).toContain('open model uses it');

      const unusedPart = getLibraryRemovePartDestructiveNotice({
        partId: '3001',
        usedInModel: false,
        hasEmbeddedCopy: false,
      });
      expect(unusedPart.tone).toBe('danger');
      expect(unusedPart.undoable).toBe(false);
      expect(unusedPart.message).toContain('cannot be undone');
      expect(unusedPart.message).not.toContain('open model uses it');
    });

    it('warns on Clear Saved Library only when the open model relies on saved parts', () => {
      expect(
        getLibraryClearSavedDestructiveNotice({ savedFileCount: 10, modelReliantSavedCount: 0 }),
      ).toBeNull();
      const reliant = getLibraryClearSavedDestructiveNotice({
        savedFileCount: 10,
        modelReliantSavedCount: 3,
      });
      expect(reliant?.tone).toBe('danger');
      expect(reliant?.undoable).toBe(false);
      expect(reliant?.message).toContain('3 parts');
      expect(reliant?.message).toContain('cannot be undone');
    });
  });
});
