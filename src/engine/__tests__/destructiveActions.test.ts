import { describe, expect, it } from 'vitest';
import {
  formatCompactList,
  getApplyCameraDestructiveNotice,
  getCloseModelConfirmDialog,
  getDeleteThemeConfirmDialog,
  getLayoutGroupOverlapDestructiveNotice,
  getLibraryClearSavedConfirmDialog,
  getLibraryRemovePartConfirmDialog,
  getMergeStepDestructiveNotice,
  getPartsMoveStepDestructiveNotice,
  getReplaceModelConfirmDialog,
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

  describe('Inline undoable off-screen / cross-surface notices', () => {
    const steps = [
      { id: 's1', num: 1, absNum: 1 },
      { id: 's2', num: 2, absNum: 2 },
      { id: 's3', num: 3, absNum: 3 },
      { id: 's4', num: 1, absNum: 4 },
      { id: 's5', num: 2, absNum: 5 },
    ];

    it('Apply Camera to Steps returns null when no other steps in range have overrides', () => {
      const res = getApplyCameraDestructiveNotice({
        steps,
        overrides: {
          s1: { az: 142, el: 30 },
          s5: { az: 218, el: 30 },
        },
        sourceStepId: 's1',
        startNum: 1,
        endNum: 3,
        includeFraming: false,
      });
      expect(res.notice).toBeNull();
      expect(res.affectedStepIds).toEqual([]);
    });

    it('Apply Camera to Steps warns about zoom/framing only when includeFraming is enabled', () => {
      const overrides = { s3: { modelScale: 1.4 } };
      expect(
        getApplyCameraDestructiveNotice({
          steps,
          overrides,
          sourceStepId: 's1',
          startNum: 1,
          endNum: 4,
          includeFraming: false,
        }).notice,
      ).toBeNull();

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

    it('Apply Camera to Steps names affected steps and formats dual submodel labels', () => {
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

    it('Wordless toggle stays silent on untouched defaults and warns when custom toggles or titles will be reset/hidden', () => {
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

      const hidesCustomTitle = getWordlessToggleDestructiveNotice({
        currentWordless: false,
        coverShowText: true,
        completeShowText: true,
        bomShowTextFields: true,
        pageNumberFormat: 'page_n',
        hasCustomCoverText: true,
      });
      expect(hidesCustomTitle?.tone).toBe('warning');
      expect(hidesCustomTitle?.undoable).toBe(true);
      expect(hidesCustomTitle?.message).toContain('hides your custom Front Cover title/subtitle');

      const resetsInWordless = getWordlessToggleDestructiveNotice({
        currentWordless: true,
        coverShowText: true,
        completeShowText: false,
        bomShowTextFields: true,
        pageNumberFormat: 'n_of_total',
      });
      expect(resetsInWordless?.message).toContain('resets your extra-page text overrides');
      expect(resetsInWordless?.message).toContain('enables Build Complete text');
      expect(resetsInWordless?.message).not.toContain('Front Cover title');
    });

    it('Merge Step warns only when the step has existing overrides or notes', () => {
      expect(
        getMergeStepDestructiveNotice({
          stepNum: 5,
          override: {},
          insertCount: 0,
          hasSubassembly: false,
        }),
      ).toBeNull();

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

    it('Parts Mode Move-to-Step warns only when ALL parts are selected AND step has off-tab overrides', () => {
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
      expect(notice?.message).not.toContain('part nudge');
    });

    it('Step Generation inline notice fires only post-import when step/layout or custom Wordless overrides exist', () => {
      const cleanEdits = summarizeManualEdits({});
      const editsSummary = summarizeManualEdits({
        chapters: [{ id: 'c1', steps: [{ id: 's1', num: 1 }] }],
        overrides: { s1: { az: 142, pin: true } },
        stepInserts: { s1: [{ id: 'n1' }] },
      });

      // New-import replacement is handled via confirmation dialog, never an inline banner
      expect(
        getStepGenerationDestructiveNotice({
          isPostImport: false,
          editsSummary,
        }),
      ).toBeNull();

      expect(
        getStepGenerationDestructiveNotice({
          isPostImport: true,
          editsSummary: cleanEdits,
        }),
      ).toBeNull();

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
        editsSummary,
        isKeepStepsAction: true,
      });
      expect(keepPost?.message).toContain('Keeping file steps');
    });

    it('Step Range Group overlap warns only when ranges collide', () => {
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

      const editEarlier = getLayoutGroupOverlapDestructiveNotice({
        editingId: 'g1',
        startStepNum: 1,
        endStepNum: 9,
        existingGroups: groups,
      });
      expect(editEarlier?.message).toContain('listed later and takes priority');
    });
  });

  describe('Permanent (non-undoable) "Are you sure?" confirmation dialogs', () => {
    const cleanEdits = summarizeManualEdits({});
    const editsSummary = summarizeManualEdits({
      chapters: [{ id: 'c1', steps: [{ id: 's1', num: 1 }] }],
      overrides: { s1: { az: 142, pin: true } },
      stepInserts: { s1: [{ id: 'n1' }] },
    });

    it('Close Model always returns a confirmation dialog tailored to edits, Undo history, or clean session', () => {
      const withEdits = getCloseModelConfirmDialog({
        modelTitle: 'Speedster',
        editsSummary,
      });
      expect(withEdits.title).toBe('Close "Speedster"?');
      expect(withEdits.message).toContain('1 camera override');
      expect(withEdits.message).toContain('cannot be undone');
      expect(withEdits.detail).toContain('.biw');
      expect(withEdits.confirmLabel).toBe('Close Without Saving');

      const withUndoOnly = getCloseModelConfirmDialog({
        modelTitle: 'Speedster',
        editsSummary: cleanEdits,
        undoHistoryCount: 2,
      });
      expect(withUndoOnly.message).toContain('unsaved session changes');
      expect(withUndoOnly.confirmLabel).toBe('Close Without Saving');

      const clean = getCloseModelConfirmDialog({
        modelTitle: 'Speedster',
        editsSummary: cleanEdits,
        undoHistoryCount: 0,
      });
      expect(clean.title).toBe('Close "Speedster"?');
      expect(clean.message).toContain('cannot be undone');
      expect(clean.confirmLabel).toBe('Close Model');
    });

    it('Replace Model returns null when untouched or no model open, and confirms when unsaved edits or Undo exist', () => {
      expect(
        getReplaceModelConfirmDialog({
          hasOpenModel: false,
          editsSummary,
          undoHistoryCount: 2,
        }),
      ).toBeNull();

      expect(
        getReplaceModelConfirmDialog({
          hasOpenModel: true,
          openModelTitle: 'Speedster',
          incomingLabel: 'spaceship.io',
          editsSummary: cleanEdits,
          undoHistoryCount: 0,
        }),
      ).toBeNull();

      const withEdits = getReplaceModelConfirmDialog({
        hasOpenModel: true,
        openModelTitle: 'Speedster',
        incomingLabel: 'spaceship.io',
        editsSummary,
      });
      expect(withEdits?.title).toBe('Replace "Speedster"?');
      expect(withEdits?.message).toContain('Opening "spaceship.io"');
      expect(withEdits?.message).toContain('1 camera override');
      expect(withEdits?.detail).toContain('.biw');
      expect(withEdits?.confirmLabel).toBe('Replace Manual');

      const withUndoOnly = getReplaceModelConfirmDialog({
        hasOpenModel: true,
        openModelTitle: 'Speedster',
        incomingLabel: 'other.biw',
        editsSummary: cleanEdits,
        undoHistoryCount: 1,
      });
      expect(withUndoOnly?.message).toContain('unsaved session changes');
      expect(withUndoOnly?.confirmLabel).toBe('Replace Manual');
    });

    it('Delete Theme returns null for built-in themes and confirms for custom themes with referencing groups', () => {
      expect(
        getDeleteThemeConfirmDialog({
          themeName: 'Classic Blue',
          isBuiltIn: true,
          referencingGroupNames: [],
        }),
      ).toBeNull();

      const noRefs = getDeleteThemeConfirmDialog({
        themeName: 'Midnight Mint',
        isBuiltIn: false,
        referencingGroupNames: [],
      });
      expect(noRefs?.title).toBe('Delete "Midnight Mint"?');
      expect(noRefs?.message).toContain('cannot be undone');
      expect(noRefs?.detail).toContain('.biwtheme');
      expect(noRefs?.confirmLabel).toBe('Delete Theme');

      const withRefs = getDeleteThemeConfirmDialog({
        themeName: 'Midnight Mint',
        isBuiltIn: false,
        referencingGroupNames: ['Detail Steps', 'Roof'],
      });
      expect(withRefs?.detail).toContain('2 Step Range Groups');
      expect(withRefs?.detail).toContain('Detail Steps and Roof');
    });

    it('Bricks Library Remove Part and Clear Downloaded Cache return clear confirmation dialogs with model impact', () => {
      const inUse = getLibraryRemovePartConfirmDialog({
        partId: '3001',
        usedInModel: true,
        hasEmbeddedCopy: false,
      });
      expect(inUse.title).toBe('Remove 3001.dat from Downloaded Cache?');
      expect(inUse.message).toContain('browser storage');
      expect(inUse.detail).toContain('simplified shapes');
      expect(inUse.confirmLabel).toBe('Remove Part');

      const unused = getLibraryRemovePartConfirmDialog({
        partId: '3001',
        usedInModel: false,
        hasEmbeddedCopy: false,
      });
      expect(unused.detail).toBeUndefined();

      expect(
        getLibraryClearSavedConfirmDialog({
          savedFileCount: 0,
          savedTextureCount: 0,
          modelReliantSavedCount: 0,
        }),
      ).toBeNull();

      const clearWithImpact = getLibraryClearSavedConfirmDialog({
        savedFileCount: 42,
        savedTextureCount: 3,
        modelReliantSavedCount: 5,
      });
      expect(clearWithImpact?.title).toBe('Clear Downloaded Cache?');
      expect(clearWithImpact?.message).toContain('42 downloaded files and 3 textures');
      expect(clearWithImpact?.detail).toContain('5 parts');
      expect(clearWithImpact?.confirmLabel).toBe('Clear Downloaded Cache');

      const clearNoImpact = getLibraryClearSavedConfirmDialog({
        savedFileCount: 10,
        savedTextureCount: 0,
        modelReliantSavedCount: 0,
      });
      expect(clearNoImpact?.message).toContain('10 downloaded files');
      expect(clearNoImpact?.detail).toBeUndefined();
    });
  });
});
