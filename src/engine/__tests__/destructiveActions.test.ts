import { describe, expect, it } from 'vitest';
import {
  formatCompactList,
  getApplyCameraDestructiveNotice,
  getClearAllPageBreaksDestructiveNotice,
  getCloseModelDestructiveNotice,
  getDeleteDividerDestructiveNotice,
  getDeleteThemeDestructiveNotice,
  getHeroResetCameraDestructiveNotice,
  getLayoutGroupDestructiveNotices,
  getLibraryClearSavedDestructiveNotice,
  getLibraryRemovePartDestructiveNotice,
  getMergeStepDestructiveNotice,
  getPartsActionDestructiveNotices,
  getReplaceModelModalDestructiveNotice,
  getStepGenerationDestructiveNotice,
  getStepResetCameraDestructiveNotice,
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

  it('summarizes per-step overrides and full manual edits accurately', () => {
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
    it('warns when turning Wordless ON will hide active extra-page text toggles and change page numbers', () => {
      const notice = getWordlessToggleDestructiveNotice({
        currentWordless: false,
        coverShowText: true,
        completeShowText: true,
        bomShowTextFields: true,
        pageNumberFormat: 'page_n',
      });
      expect(notice?.tone).toBe('warning');
      expect(notice?.message).toContain('Front Cover title');
      expect(notice?.message).toContain('Build Complete text');
      expect(notice?.message).toContain('Parts List names & colors');
      expect(notice?.message).toContain('switches page numbers to 1');
    });

    it('lists only the specific surfaces that actually change when user customized others', () => {
      const notice = getWordlessToggleDestructiveNotice({
        currentWordless: true,
        coverShowText: true, // already enabled by user override
        completeShowText: false,
        bomShowTextFields: true, // already enabled by user override
        pageNumberFormat: 'n_of_total', // preserved by resolvePageNumberFormatForMode
      });
      expect(notice?.message).toContain('enables Build Complete text');
      expect(notice?.message).not.toContain('Front Cover title');
      expect(notice?.message).not.toContain('page numbers');
    });

    it('returns null when toggling changes none of the extra-page text or page-number overrides', () => {
      const notice = getWordlessToggleDestructiveNotice({
        currentWordless: false,
        coverShowText: false,
        completeShowText: false,
        bomShowTextFields: false,
        pageNumberFormat: 'none',
      });
      expect(notice).toBeNull();
    });
  });

  it('lists exact camera overrides cleared by Step Camera Reset and Hero Camera Reset', () => {
    const stepNotice = getStepResetCameraDestructiveNotice({
      stepNum: 6,
      override: { az: 142, modelScale: 1.3, focusMode: 'focus' },
    });
    expect(stepNotice?.tone).toBe('warning');
    expect(stepNotice?.message).toContain('angle (142°)');
    expect(stepNotice?.message).toContain('zoom (130%)');
    expect(stepNotice?.message).toContain('Close-Up framing');
    expect(stepNotice?.message).toContain('Step 6');

    expect(getStepResetCameraDestructiveNotice({ stepNum: 6, override: {} })).toBeNull();

    const heroNotice = getHeroResetCameraDestructiveNotice({
      pageLabel: 'Cover Page',
      az: 120,
      el: 22,
      zoom: 1.2,
      defaultAz: 34,
      defaultEl: 18,
      defaultZoom: 1.0,
    });
    expect(heroNotice?.message).toContain('camera angle and zoom (120%)');
    expect(heroNotice?.message).toContain('Cover Page');
  });

  it('reports step overrides and notes cleared when merging a step into previous step', () => {
    const withEdits = getMergeStepDestructiveNotice({
      stepNum: 5,
      prevStepNum: 4,
      override: { az: 218, pin: true, partOffsets: { p1: { x: 20, y: 0, z: 0 } } },
      insertCount: 1,
      hasSubassembly: false,
    });
    expect(withEdits.tone).toBe('warning');
    expect(withEdits.message).toContain('deletes Step 5');
    expect(withEdits.message).toContain('custom camera');
    expect(withEdits.message).toContain('1 part nudge');
    expect(withEdits.message).toContain('page break');
    expect(withEdits.message).toContain('1 note');

    const clean = getMergeStepDestructiveNotice({
      stepNum: 5,
      prevStepNum: 4,
      override: {},
      insertCount: 0,
      hasSubassembly: false,
    });
    expect(clean.message).toContain('moves its parts into Step 4');
  });

  it('warns on Parts Mode Reset, all-parts Move deletion, nudged part split, and existing subassembly replacement', () => {
    const allSel = getPartsActionDestructiveNotices({
      stepNum: 3,
      totalPartsInStep: 2,
      selectedPartIds: ['p1', 'p2'],
      override: { az: 142, partOffsets: { p1: { x: 20, y: 0, z: 0 } } },
      insertCount: 1,
      existingSubassemblyName: 'Wing',
    });
    expect(allSel.resetNotice?.message).toContain('1 selected part');
    expect(allSel.reorgNotice?.message).toContain('All parts selected');
    expect(allSel.reorgNotice?.message).toContain('deletes Step 3');
    expect(allSel.reorgNotice?.message).toContain('replaces the existing "Wing" callout');

    const subsetNudged = getPartsActionDestructiveNotices({
      stepNum: 3,
      totalPartsInStep: 4,
      selectedPartIds: ['p1'],
      override: { partOffsets: { p1: { x: 0, y: 20, z: 0 } } },
      insertCount: 0,
      existingSubassemblyName: null,
    });
    expect(subsetNudged.resetNotice?.message).toContain('1 selected part');
    expect(subsetNudged.reorgNotice?.message).toContain('Moving or splitting clears custom nudge/tilt offsets');

    const subsetClean = getPartsActionDestructiveNotices({
      stepNum: 3,
      totalPartsInStep: 4,
      selectedPartIds: ['p1'],
      override: {},
      insertCount: 0,
      existingSubassemblyName: null,
    });
    expect(subsetClean.resetNotice).toBeNull();
    expect(subsetClean.reorgNotice).toBeNull();
  });

  it('produces clear messages for Clear All Page Breaks, Step Generation, Close Model, and Replace Model', () => {
    expect(getClearAllPageBreaksDestructiveNotice(0)).toBeNull();
    expect(getClearAllPageBreaksDestructiveNotice(1)?.message).toContain('1 manual page break');
    expect(getClearAllPageBreaksDestructiveNotice(4)?.message).toContain('all 4 manual page breaks');

    const editsSummary = summarizeManualEdits({
      chapters: [{ id: 'c1', steps: [{ id: 's1', num: 1 }] }],
      overrides: { s1: { az: 142, pin: true } },
      stepInserts: { s1: [{ id: 'n1' }] },
    });

    const regenPost = getStepGenerationDestructiveNotice({
      isPostImport: true,
      hasOpenModel: true,
      openModelTitle: 'Speedster',
      editsSummary,
      willChangeWordless: true,
      targetWordless: false,
    });
    expect(regenPost?.tone).toBe('warning');
    expect(regenPost?.undoable).toBe(true);
    expect(regenPost?.message).toContain('1 camera override');
    expect(regenPost?.message).toContain('1 page break');
    expect(regenPost?.message).toContain('extra-page text settings');

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

    expect(
      getStepGenerationDestructiveNotice({
        isPostImport: false,
        hasOpenModel: false,
        editsSummary: summarizeManualEdits({}),
      }),
    ).toBeNull();

    const closeNotice = getCloseModelDestructiveNotice({ modelTitle: 'Speedster', editsSummary });
    expect(closeNotice.tone).toBe('danger');
    expect(closeNotice.undoable).toBe(false);
    expect(closeNotice.message).toContain('Export .biw first');

    const openModalNotice = getReplaceModelModalDestructiveNotice({
      hasOpenModel: true,
      modelTitle: 'Speedster',
      editsSummary,
    });
    expect(openModalNotice?.tone).toBe('danger');
    expect(openModalNotice?.message).toContain('Speedster');
    expect(
      getReplaceModelModalDestructiveNotice({
        hasOpenModel: false,
        editsSummary: summarizeManualEdits({}),
      }),
    ).toBeNull();
  });

  it('warns on Delete Theme referencing Step Range Groups and on overlapping Step Range Groups', () => {
    expect(
      getDeleteThemeDestructiveNotice({
        themeName: 'Classic Blue',
        isBuiltIn: true,
        referencingGroupNames: [],
      }),
    ).toBeNull();

    const themeWithGroups = getDeleteThemeDestructiveNotice({
      themeName: 'Midnight Mint',
      isBuiltIn: false,
      referencingGroupNames: ['Detail Steps', 'Roof'],
    });
    expect(themeWithGroups?.tone).toBe('danger');
    expect(themeWithGroups?.message).toContain('2 Step Range Groups');
    expect(themeWithGroups?.message).toContain('Detail Steps and Roof');

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

    const newOverlapping = getLayoutGroupDestructiveNotices({
      editingId: null,
      startStepNum: 4,
      endStepNum: 8,
      existingGroups: groups,
    });
    expect(newOverlapping.deleteNotice).toBeNull();
    expect(newOverlapping.overlapNotice?.message).toContain('Saving overrides');
    expect(newOverlapping.overlapNotice?.message).toContain('"Chassis" (#1–#6)');

    const editEarlierOverlappingLater = getLayoutGroupDestructiveNotices({
      editingId: 'g1',
      editingGroupThemeName: 'Midnight Mint',
      startStepNum: 1,
      endStepNum: 9,
      existingGroups: groups,
    });
    expect(editEarlierOverlappingLater.deleteNotice?.message).toContain('Midnight Mint');
    expect(editEarlierOverlappingLater.overlapNotice?.message).toContain('listed later and takes priority');
  });

  it('produces accurate notices for Divider Delete and Bricks Library removal', () => {
    expect(getDeleteDividerDestructiveNotice({ title: 'Next Section', note: '' }).message).toContain(
      'Removes this inserted divider page',
    );
    expect(getDeleteDividerDestructiveNotice({ title: 'Bag 3', note: 'Attach roof' }).message).toContain(
      'clears its custom title/note',
    );

    const inUsePart = getLibraryRemovePartDestructiveNotice({
      partId: '3001',
      usedInModel: true,
      hasEmbeddedCopy: false,
    });
    expect(inUsePart.tone).toBe('danger');
    expect(inUsePart.message).toContain('open model uses it');

    const unusedPart = getLibraryRemovePartDestructiveNotice({
      partId: '3001',
      usedInModel: false,
      hasEmbeddedCopy: false,
    });
    expect(unusedPart.message).toContain('cannot be undone');

    expect(
      getLibraryClearSavedDestructiveNotice({ savedFileCount: 10, modelReliantSavedCount: 0 }),
    ).toBeNull();
    expect(
      getLibraryClearSavedDestructiveNotice({ savedFileCount: 10, modelReliantSavedCount: 3 })?.message,
    ).toContain('3 parts');
  });
});
