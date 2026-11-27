import { describe, expect, it } from 'vitest';
import {
  SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN,
  SMART_AUTO_MIN_STEP_AREA_WIDTH_IN,
  SMART_AUTO_MIN_STUD_SIZE_CM,
  analyzePageSizeFit,
  buildSmartAutoPageContext,
  computeBoundingSphereFromBoxLists,
  computePageDividerLines,
  computePageSlotRects,
  computeRenderedStudSizeCm,
  computeRepresentativeStepMetric,
  computeRequiredModelSideForStudCm,
  computeSmartAutoPreviewGrid,
  computeStepPliOverlaySpec,
  createDefaultPageLayoutSpec,
  deriveStepsPerPageFromLayout,
  describePageLayoutSpec,
  evaluateStepInSlot,
  findBestSmartAutoGridForSteps,
  findLayoutGroupForStep,
  formatPageSizeWarningForPage,
  getPageSizeWarningStepLinks,
  getSpecStepsPerPageCap,
  DEFAULT_PAGE_NUMBER_POSITION,
  normalizeLayoutGroups,
  normalizePageLayoutSpec,
  normalizePageNumberPosition,
  packSmartAutoPage,
  resolveEffectiveStepBorderStyle,
  resolveGridDimensions,
  resolvePageNumberSide,
  type PageLayoutSpec,
  type SmartAutoStepMetric,
  type StepLayoutGroup,
} from '../pageLayout';

describe('pageLayout engine', () => {
  it('derives steps per page from the layout (grid / mixed layout), ignoring saved counts', () => {
    expect(normalizePageLayoutSpec(null, '1-up')).toMatchObject({ mode: 'custom', stepsPerPage: 1, cols: 1, rows: 1 });
    expect(normalizePageLayoutSpec(null, '2-up')).toMatchObject({ mode: 'auto' });
    expect(normalizePageLayoutSpec(null, '4-up')).toMatchObject({ mode: 'custom', stepsPerPage: 4, cols: 2, rows: 2 });
    // Legacy explicit counts with an Auto grid fall back to smart pagination
    expect(normalizePageLayoutSpec({ mode: 'custom', stepsPerPage: 9, flow: 'column' })).toMatchObject({
      mode: 'auto',
      flow: 'column',
    });
    expect(normalizePageLayoutSpec({ cols: 3, rows: 2 })).toMatchObject({ mode: 'custom', stepsPerPage: 6 });
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 'auto', mixedLayout: 'even' })).toBeNull();
    expect(deriveStepsPerPageFromLayout({ cols: 3, rows: 'auto', mixedLayout: 'even' })).toBe(3);
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 2, mixedLayout: 'even' })).toBe(2);
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 'auto', mixedLayout: 'hero_left' })).toBeNull();
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 'auto', mixedLayout: 'hero_top' })).toBeNull();
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 'auto', mixedLayout: 'hero_right' })).toBeNull();
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 'auto', mixedLayout: 'custom_weights' })).toBeNull();
    expect(deriveStepsPerPageFromLayout({ cols: 2, rows: 3, mixedLayout: 'hero_top' })).toBe(6);
    expect(getSpecStepsPerPageCap(normalizePageLayoutSpec({ cols: 2, rows: 2 }))).toBe(4);
    expect(getSpecStepsPerPageCap(createDefaultPageLayoutSpec())).toBeNull();
  });

  it('orders 2×2 grid row-first vs column-first accurately (12,13,14,15 example)', () => {
    const rowSpec: PageLayoutSpec = {
      ...createDefaultPageLayoutSpec(),
      mode: 'custom',
      stepsPerPage: 4,
      cols: 2,
      rows: 2,
      flow: 'row',
    };
    const rowRects = computePageSlotRects(4, rowSpec, true, 800, 600, 10);
    // Row-first: 0(12) top-left, 1(13) top-right, 2(14) bottom-left, 3(15) bottom-right
    expect(rowRects[0].y).toBe(rowRects[1].y);
    expect(rowRects[0].x).toBeLessThan(rowRects[1].x);
    expect(rowRects[2].x).toBe(rowRects[0].x);
    expect(rowRects[2].y).toBeGreaterThan(rowRects[0].y);

    const colSpec: PageLayoutSpec = { ...rowSpec, flow: 'column' };
    const colRects = computePageSlotRects(4, colSpec, true, 800, 600, 10);
    // Column-first: 0(12) top-left, 1(13) bottom-left, 2(14) top-right, 3(15) bottom-right
    expect(colRects[0].x).toBe(colRects[1].x);
    expect(colRects[0].y).toBeLessThan(colRects[1].y);
    expect(colRects[2].y).toBe(colRects[0].y);
    expect(colRects[2].x).toBeGreaterThan(colRects[0].x);
    expect(colRects[3].x).toBe(colRects[2].x);
    expect(colRects[3].y).toBeGreaterThan(colRects[2].y);
  });

  it('supports arbitrary step counts > 4 (e.g., 6, 8, 9, 12 steps) with zero overlap', () => {
    for (const count of [6, 8, 9, 12]) {
      const spec: PageLayoutSpec = {
        ...createDefaultPageLayoutSpec(),
        mode: 'custom',
        stepsPerPage: count,
      };
      const rects = computePageSlotRects(count, spec, true, 1000, 750, 8);
      expect(rects).toHaveLength(count);
      for (let i = 0; i < rects.length; i++) {
        expect(rects[i].w).toBeGreaterThan(0);
        expect(rects[i].h).toBeGreaterThan(0);
        expect(rects[i].x + rects[i].w).toBeLessThanOrEqual(1000.5);
        expect(rects[i].y + rects[i].h).toBeLessThanOrEqual(750.5);
        for (let j = i + 1; j < rects.length; j++) {
          const a = rects[i];
          const b = rects[j];
          const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
          const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
          expect(overlapX > 0.5 && overlapY > 0.5).toBe(false);
        }
      }
    }
  });

  it('expands grid tracks if explicit cols×rows is smaller than actual slotCount', () => {
    expect(resolveGridDimensions(6, { cols: 2, rows: 2, flow: 'row' }, true)).toEqual({ cols: 2, rows: 3 });
    expect(resolveGridDimensions(6, { cols: 2, rows: 2, flow: 'column' }, true)).toEqual({ cols: 3, rows: 2 });
  });

  it('supports mixed layouts where featured steps are larger than companion steps', () => {
    const heroLeft: PageLayoutSpec = {
      ...createDefaultPageLayoutSpec(),
      mode: 'custom',
      stepsPerPage: 3,
      mixedLayout: 'hero_left',
    };
    const rectsLeft = computePageSlotRects(3, heroLeft, true, 900, 600, 12);
    expect(rectsLeft).toHaveLength(3);
    expect(rectsLeft[0].w * rectsLeft[0].h).toBeGreaterThan(rectsLeft[1].w * rectsLeft[1].h * 2);
    expect(rectsLeft[0].isFeatured).toBe(true);
    expect(rectsLeft[1].isCompact).toBe(true);

    const heroTop: PageLayoutSpec = { ...heroLeft, mixedLayout: 'hero_top' };
    const rectsTop = computePageSlotRects(4, heroTop, true, 900, 600, 12);
    expect(rectsTop[0].w).toBeCloseTo(900, 1);
    expect(rectsTop[0].h).toBeGreaterThan(rectsTop[1].h);

    const heroRight: PageLayoutSpec = { ...heroLeft, mixedLayout: 'hero_right' };
    const rectsRight = computePageSlotRects(3, heroRight, true, 900, 600, 12);
    expect(rectsRight[2].isFeatured).toBe(true);
    expect(rectsRight[2].x).toBeGreaterThan(rectsRight[0].x);
    expect(rectsRight[2].w * rectsRight[2].h).toBeGreaterThan(rectsRight[0].w * rectsRight[0].h * 2);
  });

  it('supports custom per-slot size weights (sm / md / lg) in both column-first (default) and row-first flows', () => {
    expect(createDefaultPageLayoutSpec().flow).toBe('column');

    const weightedCol: PageLayoutSpec = {
      ...createDefaultPageLayoutSpec(),
      mode: 'custom',
      stepsPerPage: 4,
      cols: 2,
      rows: 2,
      mixedLayout: 'custom_weights',
      slotSizes: ['lg', 'sm', 'sm', 'md'],
    };
    const colRects = computePageSlotRects(4, weightedCol, true, 800, 600, 10);
    // In column-first flow: col 0 has slots [0 ('lg'), 1 ('sm')], col 1 has slots [2 ('sm'), 3 ('md')]
    expect(colRects[0].h).toBeGreaterThan(colRects[1].h * 2);
    expect(colRects[0].w).toBeGreaterThan(colRects[2].w);
    expect(colRects[0].isFeatured).toBe(true);

    const weightedRow: PageLayoutSpec = { ...weightedCol, flow: 'row' };
    const rowRects = computePageSlotRects(4, weightedRow, true, 800, 600, 10);
    expect(rowRects[0].w).toBeGreaterThan(rowRects[1].w * 2);
    expect(rowRects[0].h).toBeGreaterThan(rowRects[2].h);
    expect(rowRects[0].isFeatured).toBe(true);
  });

  it('resolves overlapping step layout groups with latest group taking precedence', () => {
    const groups: StepLayoutGroup[] = normalizeLayoutGroups([
      {
        id: 'g1',
        name: 'Early Steps',
        startStepNum: 1,
        endStepNum: 10,
        layout: { cols: 2, rows: 2, flow: 'column' },
      },
      {
        id: 'g2',
        name: 'Hero Detail',
        startStepNum: 5,
        endStepNum: 7,
        layout: { mode: 'custom', stepsPerPage: 3, mixedLayout: 'hero_left' },
        themeId: 'dark',
      },
    ]);

    expect(findLayoutGroupForStep(groups, 2)?.id).toBe('g1');
    expect(findLayoutGroupForStep(groups, 6)?.id).toBe('g2');
    expect(findLayoutGroupForStep(groups, 6)?.themeId).toBe('dark');
    expect(findLayoutGroupForStep(groups, 12)).toBeNull();
    expect(describePageLayoutSpec(groups[0].layout)).toContain('4/page');
    expect(describePageLayoutSpec(groups[0].layout)).toContain('Columns ↓');
    expect(describePageLayoutSpec(groups[1].layout)).toContain('Large Left');
  });

  it('supports discontinuous stepRanges in StepLayoutGroup lookup and normalization', () => {
    const groups: StepLayoutGroup[] = normalizeLayoutGroups([
      {
        id: 'disc',
        name: 'Key Details',
        startStepNum: 1,
        endStepNum: 9,
        stepRanges: [
          { start: 1, end: 2 },
          { start: 6, end: 6 },
          { start: 8, end: 9 },
        ],
        stepBasis: 'absolute',
        layout: { cols: 1, rows: 1, flow: 'column' },
        themeId: 'dark',
      },
    ]);

    expect(groups[0].startStepNum).toBe(1);
    expect(groups[0].endStepNum).toBe(9);
    expect(groups[0].stepRanges).toEqual([
      { start: 1, end: 2 },
      { start: 6, end: 6 },
      { start: 8, end: 9 },
    ]);
    expect(findLayoutGroupForStep(groups, 1)?.id).toBe('disc');
    expect(findLayoutGroupForStep(groups, 2)?.id).toBe('disc');
    expect(findLayoutGroupForStep(groups, 3)).toBeNull();
    expect(findLayoutGroupForStep(groups, 5)).toBeNull();
    expect(findLayoutGroupForStep(groups, 6)?.id).toBe('disc');
    expect(findLayoutGroupForStep(groups, 7)).toBeNull();
    expect(findLayoutGroupForStep(groups, 8)?.id).toBe('disc');
    expect(findLayoutGroupForStep(groups, 9)?.id).toBe('disc');
  });

  it('packs more than 2 steps per page in Smart Auto Grid based on 1"×1" (+ margins) and 1 stud ≥ 0.5 cm', () => {
    const letterLand = buildSmartAutoPageContext({
      pageWidthIn: 11,
      pageHeightIn: 8.5,
      density: 'balanced',
    });
    const smallSteps: SmartAutoStepMetric[] = Array.from({ length: 20 }, (_, i) => ({
      stepId: `s${i + 1}`,
      stepNum: i + 1,
      viewRadiusLdu: 60, // ~4×4 stud early build
      pliUniqueCount: 2,
    }));

    const packed = packSmartAutoPage(smallSteps, letterLand);
    expect(packed.fits).toBe(true);
    // No artificial 1–2 step cap: plenty of small steps fit cleanly on US Letter Landscape
    expect(packed.count).toBeGreaterThanOrEqual(8);
    expect(packed.grid.cols * packed.grid.rows).toBeGreaterThanOrEqual(packed.count);
    expect(packed.worstEval.modelAreaWidthIn).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STEP_AREA_WIDTH_IN - 1e-3);
    expect(packed.worstEval.modelAreaHeightIn).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN - 1e-3);
    expect(packed.worstEval.studSizeCm).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STUD_SIZE_CM - 1e-3);

    // A larger sheet (Tabloid 17×11) packs even more of the exact same steps
    const tabloidLand = buildSmartAutoPageContext({
      pageWidthIn: 17,
      pageHeightIn: 11,
      density: 'balanced',
    });
    const packedTabloid = packSmartAutoPage(smallSteps, tabloidLand);
    expect(packedTabloid.fits).toBe(true);
    expect(packedTabloid.count).toBeGreaterThan(packed.count);
  });

  it('enforces exact stud scale inverse math and scales down steps per page as model radius grows', () => {
    const reqSide = computeRequiredModelSideForStudCm(160, 1.0, 0.5);
    expect(computeRenderedStudSizeCm(reqSide, reqSide, 160, 1.0)).toBeCloseTo(0.5, 4);

    const letterLand = buildSmartAutoPageContext({
      pageWidthIn: 11,
      pageHeightIn: 8.5,
      density: 'balanced',
    });

    const tinySteps: SmartAutoStepMetric[] = Array.from({ length: 30 }, (_, i) => ({
      stepId: `tiny_${i}`,
      stepNum: i + 1,
      viewRadiusLdu: 25,
      pliUniqueCount: 1,
    }));
    const mediumSteps: SmartAutoStepMetric[] = Array.from({ length: 12 }, (_, i) => ({
      stepId: `med_${i}`,
      stepNum: i + 1,
      viewRadiusLdu: 165, // mid-sized car (~6×14 studs)
      pliUniqueCount: 2,
    }));
    const largeSteps: SmartAutoStepMetric[] = Array.from({ length: 6 }, (_, i) => ({
      stepId: `lg_${i}`,
      stepNum: i + 1,
      viewRadiusLdu: 280, // ~16×24 stud building
      pliUniqueCount: 3,
    }));

    const pTiny = packSmartAutoPage(tinySteps, letterLand);
    const pMed = packSmartAutoPage(mediumSteps, letterLand);
    const pLarge = packSmartAutoPage(largeSteps, letterLand);

    // Tiny steps are bounded by 1"×1" + margins floor, medium drops to ~2/page, large drops to 1/page
    expect(pTiny.count).toBeGreaterThan(pMed.count);
    expect(pMed.count).toBe(2);
    expect(pLarge.count).toBe(1);
    expect(pLarge.fits).toBe(true);
    expect(pTiny.worstEval.modelAreaWidthIn).toBeGreaterThanOrEqual(1.0 - 1e-3);
    expect(pTiny.worstEval.modelAreaHeightIn).toBeGreaterThanOrEqual(1.0 - 1e-3);
  });

  it('accounts for density margins, PLI count, callouts, and user modelScale in slot evaluation', () => {
    const compactCtx = buildSmartAutoPageContext({ pageWidthIn: 11, pageHeightIn: 8.5, density: 'compact' });
    const spaciousCtx = buildSmartAutoPageContext({ pageWidthIn: 11, pageHeightIn: 8.5, density: 'spacious' });
    const steps: SmartAutoStepMetric[] = Array.from({ length: 30 }, (_, i) => ({
      stepId: `d_${i}`,
      stepNum: i + 1,
      viewRadiusLdu: 40,
      pliUniqueCount: 1,
    }));
    expect(packSmartAutoPage(steps, compactCtx).count).toBeGreaterThanOrEqual(
      packSmartAutoPage(steps, spaciousCtx).count,
    );

    // Inline callout reserves space and reduces available 3D model area compared to a plain step
    const plainEval = evaluateStepInSlot({ stepId: 'a', stepNum: 1, viewRadiusLdu: 100, pliUniqueCount: 1 }, 3.2, 3.2, compactCtx, 4);
    const calloutEval = evaluateStepInSlot(
      { stepId: 'b', stepNum: 1, viewRadiusLdu: 100, pliUniqueCount: 1, hasInlineCallout: true, calloutDir: 'horizontal' },
      3.2,
      3.2,
      compactCtx,
      4,
    );
    expect(calloutEval.modelAreaWidthIn).toBeLessThan(plainEval.modelAreaWidthIn);
    expect(calloutEval.studSizeCm).toBeLessThan(plainEval.studSizeCm);

    // Zooming in via modelScale increases rendered stud size proportionally
    const zoomedEval = evaluateStepInSlot({ stepId: 'z', stepNum: 1, viewRadiusLdu: 250, modelScale: 1.5 }, 5, 5, compactCtx, 1);
    const normalEval = evaluateStepInSlot({ stepId: 'n', stepNum: 1, viewRadiusLdu: 250, modelScale: 1.0 }, 5, 5, compactCtx, 1);
    expect(zoomedEval.studSizeCm).toBeCloseTo(normalEval.studSizeCm * 1.5, 4);
  });

  it('warns and suggests larger standard page sizes when 1 stud < 0.5 cm even at 1 step/page', () => {
    const largeStep: SmartAutoStepMetric = {
      stepId: 'step_big',
      stepNum: 14,
      absStepNum: 14,
      viewRadiusLdu: 280, // needs ~6.17" model box -> fits on Letter/A4, fails on A5
      pliUniqueCount: 2,
    };

    // On A5 (8.27 × 5.83 in landscape), even 1-up cannot keep 1 stud >= 0.5 cm
    const a5Warn = analyzePageSizeFit({
      stepChecks: [{ metric: largeStep, pageId: 'pg_step_big', pageNum: 8 }],
      currentFormatId: 'a5',
      currentOrientation: 'landscape',
      currentPageWidthIn: 8.27,
      currentPageHeightIn: 5.83,
      density: 'balanced',
    });
    expect(a5Warn.hasWarning).toBe(true);
    expect(a5Warn.affectedStepCount).toBe(1);
    expect(a5Warn.worstViolation?.reason).toBe('stud_size');
    expect(a5Warn.worstViolation?.studSizeCm).toBeLessThan(0.5);
    expect(a5Warn.suggestedFormats.length).toBeGreaterThanOrEqual(1);
    // Suggested formats should be strictly larger than A5 (e.g., Square / US Letter / A4)
    expect(a5Warn.suggestedFormats[0].widthIn * a5Warn.suggestedFormats[0].heightIn).toBeGreaterThan(8.27 * 5.83);
    expect(a5Warn.message).toContain('0.5 cm');
    expect(a5Warn.message).toContain('larger page size');
    expect(formatPageSizeWarningForPage(a5Warn, 'pg_step_big')).toContain('Step 14');

    // Switching to the top suggested format resolves the warning cleanly!
    const top = a5Warn.suggestedFormats[0];
    const resolved = analyzePageSizeFit({
      stepChecks: [{ metric: largeStep, pageId: 'pg_step_big', pageNum: 8 }],
      currentFormatId: top.formatId,
      currentOrientation: top.orientation || 'landscape',
      currentPageWidthIn: top.widthIn,
      currentPageHeightIn: top.heightIn,
      density: 'balanced',
    });
    expect(resolved.hasWarning).toBe(false);
  });

  it('warns when a tiny custom page cannot fit 1"×1" + margins and suggests a larger size', () => {
    const smallStep: SmartAutoStepMetric = {
      stepId: 's1',
      stepNum: 1,
      viewRadiusLdu: 20,
      pliUniqueCount: 1,
    };

    const tinyWarn = analyzePageSizeFit({
      stepChecks: [{ metric: smallStep, pageId: 'pg_s1', pageNum: 1 }],
      currentFormatId: 'custom',
      currentOrientation: 'landscape',
      currentPageWidthIn: 2.0,
      currentPageHeightIn: 2.0,
      density: 'balanced',
    });
    expect(tinyWarn.hasWarning).toBe(true);
    expect(tinyWarn.worstViolation?.reason).toBe('area');
    expect(tinyWarn.message).toContain('1″ × 1″');
    expect(tinyWarn.suggestedFormats.length).toBeGreaterThanOrEqual(1);
    expect(tinyWarn.minRequiredPageHeightIn).toBeGreaterThan(2.0);

    // Using the computed minimum custom page size resolves the warning!
    const customResolved = analyzePageSizeFit({
      stepChecks: [{ metric: smallStep, pageId: 'pg_s1', pageNum: 1 }],
      currentFormatId: 'custom',
      currentOrientation: 'landscape',
      currentPageWidthIn: tinyWarn.minRequiredPageWidthIn,
      currentPageHeightIn: tinyWarn.minRequiredPageHeightIn,
      density: 'balanced',
    });
    expect(customResolved.hasWarning).toBe(false);
  });

  it('suggests a larger Custom page size when a giant model exceeds even A3/Tabloid', () => {
    const giantStep: SmartAutoStepMetric = {
      stepId: 'giant',
      stepNum: 42,
      viewRadiusLdu: 640, // ~45×45 stud UCS build
      pliUniqueCount: 3,
    };

    const a3Warn = analyzePageSizeFit({
      stepChecks: [{ metric: giantStep, pageId: 'pg_giant', pageNum: 30 }],
      currentFormatId: 'a3',
      currentOrientation: 'landscape',
      currentPageWidthIn: 16.54,
      currentPageHeightIn: 11.69,
      density: 'balanced',
    });
    expect(a3Warn.hasWarning).toBe(true);
    expect(a3Warn.suggestedFormats).toEqual([]);
    expect(a3Warn.minRequiredPageHeightIn).toBeGreaterThan(14);
    expect(a3Warn.message).toContain('Custom page size');

    // Applying the recommended Custom dimensions eliminates the warning
    const resolved = analyzePageSizeFit({
      stepChecks: [{ metric: giantStep, pageId: 'pg_giant', pageNum: 30 }],
      currentFormatId: 'custom',
      currentOrientation: 'landscape',
      currentPageWidthIn: a3Warn.minRequiredPageWidthIn,
      currentPageHeightIn: a3Warn.minRequiredPageHeightIn,
      density: 'balanced',
    });
    expect(resolved.hasWarning).toBe(false);
  });

  it('never emits a physical page-size warning on default Screen Fit (even for huge models)', () => {
    const trainSteps: SmartAutoStepMetric[] = [
      { stepId: 'bogie_1', stepNum: 1, viewRadiusLdu: 60, pliUniqueCount: 2 },
      { stepId: 'bogie_2', stepNum: 2, viewRadiusLdu: 65, pliUniqueCount: 2 },
      { stepId: 'bogie_3', stepNum: 3, viewRadiusLdu: 70, pliUniqueCount: 2 },
      { stepId: 'bogie_4', stepNum: 4, viewRadiusLdu: 75, pliUniqueCount: 2 },
      { stepId: 'full_train', stepNum: 156, viewRadiusLdu: 700, pliUniqueCount: 4 },
    ];

    // On Screen Fit (e.g., portrait mobile canonical 7.71" × 12.44"), Smart Auto still packs
    // early small steps dynamically (>2/page) and gives giant steps 1/page, with zero print-size warning.
    const mobileScreenCtx = buildSmartAutoPageContext({
      pageWidthIn: 7.71,
      pageHeightIn: 12.44,
      density: 'balanced',
    });
    expect(packSmartAutoPage(trainSteps.slice(0, 4), mobileScreenCtx).count).toBeGreaterThanOrEqual(4);
    expect(packSmartAutoPage([trainSteps[4]], mobileScreenCtx).count).toBe(1);

    const screenCheck = analyzePageSizeFit({
      stepChecks: trainSteps.map((metric, idx) => ({ metric, pageId: `pg_${idx}`, pageNum: idx + 1 })),
      currentFormatId: 'screen',
      currentOrientation: 'portrait',
      currentPageWidthIn: 7.71,
      currentPageHeightIn: 12.44,
      density: 'balanced',
    });
    expect(screenCheck.hasWarning).toBe(false);
    expect(screenCheck.violations).toEqual([]);
    expect(screenCheck.affectedStepCount).toBe(0);
    expect(screenCheck.message).toBe('');
  });

  it('supports Smart Auto resolvedGridOverride > 6 tracks in computePageSlotRects with zero overlap', () => {
    const autoSpec = createDefaultPageLayoutSpec();
    const rects = computePageSlotRects(28, autoSpec, true, 1400, 900, 8, { cols: 7, rows: 4 });
    expect(rects).toHaveLength(28);
    // Verify 7 distinct X columns and 4 distinct Y rows with zero overlap
    const xs = new Set(rects.map((r) => Math.round(r.x)));
    const ys = new Set(rects.map((r) => Math.round(r.y)));
    expect(xs.size).toBe(7);
    expect(ys.size).toBe(4);
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(overlapX > 0.5 && overlapY > 0.5).toBe(false);
      }
    }

    // Bounding sphere helper & preview capacity sanity check
    const sphere = computeBoundingSphereFromBoxLists([
      { min: [0, 0, 0], max: [80, 24, 80], center: [40, 12, 40] },
    ]);
    expect(sphere.center).toEqual([40, 12, 40]);
    expect(sphere.radius).toBeCloseTo(Math.hypot(40, 12, 40), 3);

    const preview = computeSmartAutoPreviewGrid(
      buildSmartAutoPageContext({ pageWidthIn: 11, pageHeightIn: 8.5, density: 'balanced' }),
    );
    expect(preview.fits).toBe(true);
    expect(preview.maxSteps).toBeGreaterThan(2);

    const bestGrid = findBestSmartAutoGridForSteps(
      Array.from({ length: 6 }, (_, i) => ({ stepId: `x${i}`, stepNum: i + 1, viewRadiusLdu: 70 })),
      buildSmartAutoPageContext({ pageWidthIn: 11, pageHeightIn: 8.5, density: 'balanced' }),
    );
    expect(bestGrid.fits).toBe(true);
    expect(bestGrid.cols).toBe(3);
    expect(bestGrid.rows).toBe(2);
  });

  it('scales Smart Auto Grid dynamically with page size without any artificial track or step-count cap', () => {
    const letterPreview = computeSmartAutoPreviewGrid(
      buildSmartAutoPageContext({ pageWidthIn: 11, pageHeightIn: 8.5, density: 'balanced' }),
    );
    const tabloidPreview = computeSmartAutoPreviewGrid(
      buildSmartAutoPageContext({ pageWidthIn: 17, pageHeightIn: 11, density: 'balanced' }),
    );
    const posterPreview = computeSmartAutoPreviewGrid(
      buildSmartAutoPageContext({ pageWidthIn: 48, pageHeightIn: 36, density: 'balanced' }),
    );

    expect(letterPreview.cols).toBeGreaterThan(2);
    expect(tabloidPreview.cols).toBeGreaterThan(letterPreview.cols);
    // Poster sheets scale cleanly past the old 24-track cap
    expect(posterPreview.cols).toBeGreaterThan(24);
    expect(posterPreview.maxSteps).toBe(posterPreview.cols * posterPreview.rows);

    // Compact preview container renders dense grids without overflowing bounds
    const autoSpec = createDefaultPageLayoutSpec();
    const denseRects = computePageSlotRects(
      posterPreview.cols * posterPreview.rows,
      autoSpec,
      true,
      128,
      84,
      1,
      { cols: posterPreview.cols, rows: posterPreview.rows },
    );
    expect(denseRects).toHaveLength(posterPreview.cols * posterPreview.rows);
    for (const r of denseRects) {
      expect(r.x + r.w).toBeLessThanOrEqual(128.5);
      expect(r.y + r.h).toBeLessThanOrEqual(84.5);
    }
  });

  it('adapts all non-even Step Proportions (hero_left, hero_top, hero_right, custom_weights) dynamically by page size & min sizes', () => {
    const letterCtx = buildSmartAutoPageContext({ pageWidthIn: 11, pageHeightIn: 8.5, density: 'balanced' });
    const tabloidCtx = buildSmartAutoPageContext({ pageWidthIn: 17, pageHeightIn: 11, density: 'balanced' });
    const compactSteps: SmartAutoStepMetric[] = Array.from({ length: 24 }, (_, i) => ({
      stepId: `p_${i + 1}`,
      stepNum: i + 1,
      viewRadiusLdu: 45,
      pliUniqueCount: 2,
    }));

    for (const mixedLayout of ['hero_left', 'hero_top', 'hero_right'] as const) {
      const spec = { mixedLayout, flow: 'row' as const, slotSizes: [] };
      const packedLetter = packSmartAutoPage(compactSteps, letterCtx, spec);
      const packedTabloid = packSmartAutoPage(compactSteps, tabloidCtx, spec);
      // Scales past the old hardcoded 3-step limit based on physical min sizes
      expect(packedLetter.fits).toBe(true);
      expect(packedLetter.count).toBeGreaterThan(3);
      expect(packedTabloid.count).toBeGreaterThan(packedLetter.count);
      expect(packedLetter.worstEval.modelAreaWidthIn).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STEP_AREA_WIDTH_IN - 1e-3);
      expect(packedLetter.worstEval.modelAreaHeightIn).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN - 1e-3);
      expect(packedLetter.worstEval.studSizeCm).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STUD_SIZE_CM - 1e-3);

      const prevLetter = computeSmartAutoPreviewGrid(letterCtx, 45, spec);
      const prevTabloid = computeSmartAutoPreviewGrid(tabloidCtx, 45, spec);
      expect(prevLetter.maxSteps).toBeGreaterThan(3);
      expect(prevTabloid.maxSteps).toBeGreaterThan(prevLetter.maxSteps);
    }

    const customSpec = {
      mixedLayout: 'custom_weights' as const,
      flow: 'row' as const,
      slotSizes: ['lg' as const, 'sm' as const, 'md' as const, 'sm' as const],
    };
    const customLetter = packSmartAutoPage(compactSteps, letterCtx, customSpec);
    const customTabloid = packSmartAutoPage(compactSteps, tabloidCtx, customSpec);
    // Scales past the old hardcoded 4-step limit based on physical min sizes
    expect(customLetter.fits).toBe(true);
    expect(customLetter.count).toBeGreaterThan(4);
    expect(customTabloid.count).toBeGreaterThan(customLetter.count);
    expect(customLetter.worstEval.modelAreaWidthIn).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STEP_AREA_WIDTH_IN - 1e-3);
    expect(customLetter.worstEval.modelAreaHeightIn).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN - 1e-3);
    expect(customLetter.worstEval.studSizeCm).toBeGreaterThanOrEqual(SMART_AUTO_MIN_STUD_SIZE_CM - 1e-3);
  });

  it('computes tighter aspect-aware stud sizes using projected half-extents and suggests rotating the same sheet when it resolves the warning', () => {
    // Elongated low-profile model: full bounding sphere radius 520 LDU,
    // projected half-width 390 LDU, projected half-height 220 LDU.
    // On US Letter Portrait (modelArea ~7.5" × 8.5"):
    //   - Width-limited at 390 LDU -> studSize ~0.46 cm (< 0.50 cm)
    // On US Letter Landscape (modelArea ~10.0" × 6.2"):
    //   - Both axes >= 0.50 cm/stud -> fits WITHOUT needing larger paper!
    const wideStep: SmartAutoStepMetric = {
      stepId: 's_wide',
      stepNum: 3,
      viewRadiusLdu: 520,
      projHalfWLdu: 390,
      projHalfHLdu: 220,
      pliUniqueCount: 1,
    };

    const portraitStud = computeRenderedStudSizeCm(7.4, 8.5, 520, 1.0, 390, 220);
    const landscapeStud = computeRenderedStudSizeCm(10.0, 6.2, 520, 1.0, 390, 220);
    const sphereOnlyStud = computeRenderedStudSizeCm(7.4, 8.5, 520, 1.0);
    expect(portraitStud).toBeGreaterThan(sphereOnlyStud * 1.25);
    expect(landscapeStud).toBeGreaterThan(portraitStud);
    expect(landscapeStud).toBeGreaterThanOrEqual(0.5);

    const portraitWarn = analyzePageSizeFit({
      stepChecks: [{ metric: wideStep, pageId: 'pg_wide', pageNum: 1 }],
      currentFormatId: 'letter',
      currentOrientation: 'portrait',
      currentPageWidthIn: 8.5,
      currentPageHeightIn: 11,
      density: 'balanced',
    });
    expect(portraitWarn.hasWarning).toBe(true);
    expect(portraitWarn.suggestedFormats.length).toBeGreaterThanOrEqual(1);
    expect(portraitWarn.suggestedFormats[0].formatId).toBe('letter');
    expect(portraitWarn.suggestedFormats[0].orientation).toBe('landscape');
    expect(portraitWarn.suggestedFormats[0].label).toBe('US Letter (Landscape)');
    // Required custom dimensions stay compact instead of inflating height/width to the full bounding sphere
    expect(portraitWarn.minRequiredPageWidthIn).toBeLessThanOrEqual(9.5);
    expect(portraitWarn.minRequiredPageHeightIn).toBe(11);

    const landscapeCheck = analyzePageSizeFit({
      stepChecks: [{ metric: wideStep, pageId: 'pg_wide', pageNum: 1 }],
      currentFormatId: 'letter',
      currentOrientation: 'landscape',
      currentPageWidthIn: 11,
      currentPageHeightIn: 8.5,
      density: 'balanced',
    });
    expect(landscapeCheck.hasWarning).toBe(false);
  });

  it('returns union AABB bounds from computeBoundingSphereFromBoxLists', () => {
    const sphere = computeBoundingSphereFromBoxLists(
      [{ min: [-40, 0, -200], max: [40, 80, 0], center: [0, 40, -100] }],
      [{ min: [-40, 0, 0], max: [40, 80, 200], center: [0, 40, 100] }],
    );
    expect(sphere.bounds).toEqual({
      minX: -40,
      minY: 0,
      minZ: -200,
      maxX: 40,
      maxY: 80,
      maxZ: 200,
    });
  });

  it('uses model-representative step metrics in Smart Auto Grid previews and states even at 1 step/page on multi-step warnings', () => {
    const modelSteps: SmartAutoStepMetric[] = [
      { stepId: 's1', stepNum: 1, absStepNum: 1, viewRadiusLdu: 60, projHalfWLdu: 55, projHalfHLdu: 45, pliUniqueCount: 2 },
      { stepId: 's2', stepNum: 2, absStepNum: 2, viewRadiusLdu: 380, projHalfWLdu: 360, projHalfHLdu: 340, pliUniqueCount: 2 },
      { stepId: 's3', stepNum: 3, absStepNum: 3, viewRadiusLdu: 420, projHalfWLdu: 400, projHalfHLdu: 390, pliUniqueCount: 3 },
      { stepId: 's4', stepNum: 4, absStepNum: 4, viewRadiusLdu: 430, projHalfWLdu: 410, projHalfHLdu: 400, pliUniqueCount: 3 },
    ];

    const rep = computeRepresentativeStepMetric(modelSteps);
    expect(rep).not.toBeNull();
    expect(rep!.viewRadiusLdu).toBe(420);

    // On US Letter landscape, the representative step cannot fit even 1-up, so the preview
    // shows 1×1 (fits: false) instead of a misleading 24-cell grid from a tiny placeholder brick.
    const letterCtx = buildSmartAutoPageContext({ pageWidthIn: 11, pageHeightIn: 8.5, density: 'balanced' });
    const letterPreview = computeSmartAutoPreviewGrid(letterCtx, rep!);
    expect(letterPreview.cols).toBe(1);
    expect(letterPreview.rows).toBe(1);
    expect(letterPreview.maxSteps).toBe(1);
    expect(letterPreview.fits).toBe(false);

    // On A3 landscape, the same representative step fits cleanly at 1-up.
    const a3Ctx = buildSmartAutoPageContext({ pageWidthIn: 16.54, pageHeightIn: 11.69, density: 'balanced' });
    const a3Preview = computeSmartAutoPreviewGrid(a3Ctx, rep!);
    expect(a3Preview.fits).toBe(true);

    // Multi-step warning explicitly clarifies "even at 1 step/page"
    const multiWarn = analyzePageSizeFit({
      stepChecks: modelSteps.map((metric, idx) => ({ metric, pageId: `pg_${idx + 1}`, pageNum: idx + 1 })),
      currentFormatId: 'letter',
      currentOrientation: 'landscape',
      currentPageWidthIn: 11,
      currentPageHeightIn: 8.5,
      density: 'balanced',
    });
    expect(multiWarn.hasWarning).toBe(true);
    expect(multiWarn.affectedStepCount).toBe(3);
    expect(multiWarn.message).toContain('even at 1 step/page');
    expect(multiWarn.shortMessage).toContain('even at 1 step/page');
    expect(formatPageSizeWarningForPage(multiWarn, 'pg_4')).toContain('even at 1 step/page');
  });

  it('builds deduplicated navigable step links in manual order with page scoping and worst-step tagging', () => {
    const stepChecks = [
      {
        metric: { stepId: 's1', stepNum: 1, absStepNum: 1, viewRadiusLdu: 50, projHalfWLdu: 45, projHalfHLdu: 40, pliUniqueCount: 1 },
        pageId: 'pg_1',
        pageNum: 2,
      },
      {
        metric: { stepId: 's2', stepNum: 2, absStepNum: 12, viewRadiusLdu: 380, projHalfWLdu: 360, projHalfHLdu: 340, pliUniqueCount: 2 },
        pageId: 'pg_2',
        pageNum: 3,
      },
      {
        metric: { stepId: 's3', stepNum: 3, absStepNum: 13, viewRadiusLdu: 440, projHalfWLdu: 420, projHalfHLdu: 410, pliUniqueCount: 3 },
        pageId: 'pg_3',
        pageNum: 4,
      },
      {
        metric: { stepId: 's4', stepNum: 4, absStepNum: 4, viewRadiusLdu: 400, projHalfWLdu: 390, projHalfHLdu: 370, pliUniqueCount: 2 },
        pageId: 'pg_4',
        pageNum: 5,
      },
    ];

    const warn = analyzePageSizeFit({
      stepChecks,
      currentFormatId: 'letter',
      currentOrientation: 'landscape',
      currentPageWidthIn: 11,
      currentPageHeightIn: 8.5,
      density: 'balanced',
    });
    expect(warn.hasWarning).toBe(true);

    const allLinks = getPageSizeWarningStepLinks(warn);
    expect(allLinks.map((l) => l.stepId)).toEqual(['s2', 's3', 's4']);
    expect(allLinks[0].label).toBe('Step 2 · #12');
    expect(allLinks[2].label).toBe('Step 4');
    expect(allLinks[1].isWorst).toBe(true);
    expect(allLinks[0].isWorst).toBe(false);
    expect(allLinks[1].detail).toMatch(/^\d+\.\d{2} cm\/stud$/);

    // Page-scoped links match only the violating step on pg_2, and fall back to all on unaffected pg_1
    const pg2Links = getPageSizeWarningStepLinks(warn, 'pg_2');
    expect(pg2Links.map((l) => l.stepId)).toEqual(['s2']);
    expect(pg2Links[0].isWorst).toBe(true);

    const pg1Links = getPageSizeWarningStepLinks(warn, 'pg_1');
    expect(pg1Links.map((l) => l.stepId)).toEqual(['s2', 's3', 's4']);

    // Placeholder / no-model warnings return no navigable step links
    const sampleWarn = analyzePageSizeFit({
      stepChecks: [],
      currentFormatId: 'custom',
      currentOrientation: 'landscape',
      currentPageWidthIn: 2,
      currentPageHeightIn: 2,
      density: 'balanced',
    });
    expect(sampleWarn.hasWarning).toBe(true);
    expect(getPageSizeWarningStepLinks(sampleWarn)).toEqual([]);
    expect(getPageSizeWarningStepLinks(null)).toEqual([]);
  });

  it('resolves booklet outside-edge page number placement (even left / odd right) vs bottom-right default', () => {
    expect(DEFAULT_PAGE_NUMBER_POSITION).toBe('right');
    expect(normalizePageNumberPosition('outside')).toBe('outside');
    expect(normalizePageNumberPosition('right')).toBe('right');
    expect(normalizePageNumberPosition(undefined)).toBe('right');
    expect(normalizePageNumberPosition('center')).toBe('right');

    // Default ('right') keeps every page number on the right edge
    for (const p of [1, 2, 3, 4, 5, 10]) {
      expect(resolvePageNumberSide(p, 'right')).toBe('right');
      expect(resolvePageNumberSide(p, undefined)).toBe('right');
    }

    // Outside-edge ('outside') alternates verso (even -> left) and recto (odd -> right)
    expect(resolvePageNumberSide(1, 'outside')).toBe('right');
    expect(resolvePageNumberSide(2, 'outside')).toBe('left');
    expect(resolvePageNumberSide(3, 'outside')).toBe('right');
    expect(resolvePageNumberSide(4, 'outside')).toBe('left');
    expect(resolvePageNumberSide(11, 'outside')).toBe('right');
    expect(resolvePageNumberSide(12, 'outside')).toBe('left');

    // Defensive handling for non-positive / non-finite page numbers
    expect(resolvePageNumberSide(0, 'outside')).toBe('right');
    expect(resolvePageNumberSide(-2, 'outside')).toBe('right');
    expect(resolvePageNumberSide(Number.NaN, 'outside')).toBe('right');
  });

  it('computes LEGO-style step divider lines matching all reference edge cases and orientation priority', () => {
    const W = 800;
    const H = 600;
    const gap = 12;
    const jGap = 6;

    // 1. Single step (1×1): zero divider lines
    const oneRect = computePageSlotRects(1, createDefaultPageLayoutSpec(), true, W, H, gap);
    expect(computePageDividerLines(oneRect, W, H, 'column', { junctionGap: jGap })).toEqual([]);

    // 2. Side-by-side 2×1 (e.g. Steps 44 | 45): single full-height vertical line
    const twoWide = computePageSlotRects(
      2,
      { ...createDefaultPageLayoutSpec(), cols: 2, rows: 1 },
      true,
      W,
      H,
      gap,
    );
    const twoWideLines = computePageDividerLines(twoWide, W, H, 'column', { junctionGap: jGap });
    expect(twoWideLines).toHaveLength(1);
    expect(twoWideLines[0]).toMatchObject({
      orientation: 'vertical',
      level: 0,
      x1: W / 2,
      y1: 0,
      x2: W / 2,
      y2: H,
    });

    // 3. Portrait 1×2 (single column, 2 stacked steps): single full-width horizontal line
    const twoTall = computePageSlotRects(
      2,
      { ...createDefaultPageLayoutSpec(), cols: 1, rows: 2 },
      false,
      600,
      800,
      gap,
    );
    const twoTallLines = computePageDividerLines(twoTall, 600, 800, 'column', { junctionGap: jGap });
    expect(twoTallLines).toHaveLength(1);
    expect(twoTallLines[0]).toMatchObject({
      orientation: 'horizontal',
      level: 0,
      x1: 0,
      y1: 400,
      x2: 600,
      y2: 400,
    });

    // 4. 2×2 grid in default column-first flow (60↓61 | 62↓63):
    //    ONLY 1 full-height vertical line between columns; NO horizontal lines between stacked steps
    const grid2x2Col = computePageSlotRects(
      4,
      { ...createDefaultPageLayoutSpec(), cols: 2, rows: 2, flow: 'column' },
      true,
      W,
      H,
      gap,
    );
    const grid2x2ColLines = computePageDividerLines(grid2x2Col, W, H, 'column', { junctionGap: jGap });
    expect(grid2x2ColLines).toHaveLength(1);
    expect(grid2x2ColLines[0]).toMatchObject({
      orientation: 'vertical',
      level: 0,
      x1: W / 2,
      y1: 0,
      x2: W / 2,
      y2: H,
    });

    // 5. 2×2 grid in row-first flow (1→2 / 3→4):
    //    Horizontal divider has priority (full-width), with secondary gapped verticals in each row
    const grid2x2Row = computePageSlotRects(
      4,
      { ...createDefaultPageLayoutSpec(), cols: 2, rows: 2, flow: 'row' },
      true,
      W,
      H,
      gap,
    );
    const grid2x2RowLines = computePageDividerLines(grid2x2Row, W, H, 'row', { junctionGap: jGap });
    const rowHoriz = grid2x2RowLines.filter((l) => l.orientation === 'horizontal');
    const rowVerts = grid2x2RowLines.filter((l) => l.orientation === 'vertical');
    expect(rowHoriz).toHaveLength(1);
    expect(rowHoriz[0]).toMatchObject({ level: 0, x1: 0, y1: H / 2, x2: W, y2: H / 2 });
    expect(rowVerts).toHaveLength(2);
    expect(rowVerts[0]).toMatchObject({ level: 1, x1: W / 2, y1: 0, x2: W / 2, y2: H / 2 - jGap });
    expect(rowVerts[1]).toMatchObject({ level: 1, x1: W / 2, y1: H / 2 + jGap, x2: W / 2, y2: H });

    // 6. Hero Right 3-step (3↓4 on left, 5 full-height on right) in column-first flow:
    //    ONLY 1 full-height vertical line; NO horizontal line between 3 and 4
    const heroRightCol = computePageSlotRects(
      3,
      { ...createDefaultPageLayoutSpec(), mixedLayout: 'hero_right', flow: 'column' },
      true,
      W,
      H,
      gap,
    );
    const heroRightColLines = computePageDividerLines(heroRightCol, W, H, 'column', { junctionGap: jGap });
    expect(heroRightColLines).toHaveLength(1);
    expect(heroRightColLines[0].orientation).toBe('vertical');
    expect(heroRightColLines[0].y1).toBe(0);
    expect(heroRightColLines[0].y2).toBe(H);

    // 7. Hero Left 3-step in row-first flow (full-height left | 2 over 3 right):
    //    Full-height vertical line + gapped partial horizontal line only in right half
    const heroLeftRow = computePageSlotRects(
      3,
      { ...createDefaultPageLayoutSpec(), mixedLayout: 'hero_left', flow: 'row' },
      true,
      W,
      H,
      gap,
    );
    const heroLeftRowLines = computePageDividerLines(heroLeftRow, W, H, 'row', { junctionGap: jGap });
    expect(heroLeftRowLines).toHaveLength(2);
    const hlVert = heroLeftRowLines.find((l) => l.orientation === 'vertical')!;
    const hlHoriz = heroLeftRowLines.find((l) => l.orientation === 'horizontal')!;
    expect(hlVert.level).toBe(0);
    expect(hlVert.y1).toBe(0);
    expect(hlVert.y2).toBe(H);
    expect(hlHoriz.level).toBe(1);
    expect(hlHoriz.x1).toBeCloseTo(hlVert.x1 + jGap, 2);
    expect(hlHoriz.x2).toBe(W);

    // 8. Two-over-one (40 | 41 on top, 42 full-width on bottom via custom_weights row-first):
    //    Full-width horizontal line + partial vertical line only in top half stopping short of horizontal
    const twoOverOne = computePageSlotRects(
      3,
      { ...createDefaultPageLayoutSpec(), cols: 2, rows: 2, flow: 'row', mixedLayout: 'custom_weights' },
      true,
      W,
      H,
      gap,
    );
    const twoOverOneLines = computePageDividerLines(twoOverOne, W, H, 'row', { junctionGap: jGap });
    expect(twoOverOneLines).toHaveLength(2);
    const tHoriz = twoOverOneLines.find((l) => l.orientation === 'horizontal')!;
    const tVert = twoOverOneLines.find((l) => l.orientation === 'vertical')!;
    expect(tHoriz).toMatchObject({ level: 0, x1: 0, x2: W });
    expect(tVert.level).toBe(1);
    expect(tVert.y1).toBe(0);
    expect(tVert.y2).toBeCloseTo(tHoriz.y1 - jGap, 2);

    // 9. Hero Top 3-step (1 full-width on top, 2 | 3 on bottom) in default column-first flow:
    //    Full-width horizontal line + partial vertical line only in bottom half stopping short of horizontal
    const heroTopCol = computePageSlotRects(
      3,
      { ...createDefaultPageLayoutSpec(), mixedLayout: 'hero_top', flow: 'column' },
      true,
      W,
      H,
      gap,
    );
    const heroTopColLines = computePageDividerLines(heroTopCol, W, H, 'column', { junctionGap: jGap });
    expect(heroTopColLines).toHaveLength(2);
    const htHoriz = heroTopColLines.find((l) => l.orientation === 'horizontal')!;
    const htVert = heroTopColLines.find((l) => l.orientation === 'vertical')!;
    expect(htHoriz).toMatchObject({ level: 0, x1: 0, x2: W });
    expect(htVert.level).toBe(1);
    expect(htVert.y1).toBeCloseTo(htHoriz.y1 + jGap, 2);
    expect(htVert.y2).toBe(H);

    // 10. Partial last row in row-first 2×2 (3 steps: 1|2 top, 3 bottom-left): zero orphan vertical in bottom row
    const partialRow = computePageSlotRects(
      3,
      { ...createDefaultPageLayoutSpec(), cols: 2, rows: 2, flow: 'row' },
      true,
      W,
      H,
      gap,
    );
    const partialRowLines = computePageDividerLines(partialRow, W, H, 'row', { junctionGap: jGap });
    expect(partialRowLines.filter((l) => l.orientation === 'horizontal')).toHaveLength(1);
    expect(partialRowLines.filter((l) => l.orientation === 'vertical')).toHaveLength(1);
    expect(partialRowLines.find((l) => l.orientation === 'vertical')!.y2).toBeLessThan(H / 2);

    // 11. Hero Top with 5 steps in column-first flow (1 wide top, 2↓3 | 4↓5 bottom):
    //     Full horizontal + 1 partial vertical in bottom half, no extra horizontal between 2&3 or 4&5
    const heroTop5Col = computePageSlotRects(
      5,
      { ...createDefaultPageLayoutSpec(), mixedLayout: 'hero_top', flow: 'column' },
      true,
      W,
      H,
      gap,
      { cols: 2, rows: 2 },
    );
    const heroTop5Lines = computePageDividerLines(heroTop5Col, W, H, 'column', { junctionGap: jGap });
    expect(heroTop5Lines.filter((l) => l.orientation === 'horizontal')).toHaveLength(1);
    expect(heroTop5Lines.filter((l) => l.orientation === 'vertical')).toHaveLength(1);

    // 12. Hero Left with 5 steps in row-first flow (1 tall left, 2|3 over 4|5 right):
    //     1 full-height vertical separating left from right, 1 partial horizontal across right half,
    //     and 2 gapped vertical lines inside the two right-hand rows
    const heroLeft5Row = computePageSlotRects(
      5,
      { ...createDefaultPageLayoutSpec(), mixedLayout: 'hero_left', flow: 'row' },
      true,
      W,
      H,
      gap,
      { cols: 2, rows: 2 },
    );
    const heroLeft5Lines = computePageDividerLines(heroLeft5Row, W, H, 'row', { junctionGap: jGap });
    expect(heroLeft5Lines.filter((l) => l.orientation === 'vertical' && l.level === 0)).toHaveLength(1);
    expect(heroLeft5Lines.filter((l) => l.orientation === 'horizontal' && l.level === 1)).toHaveLength(1);
    expect(heroLeft5Lines.filter((l) => l.orientation === 'vertical' && l.level === 2)).toHaveLength(2);
  });

  it('resolves effective step border style from StepLayoutGroup overrides and legacy flags', () => {
    expect(resolveEffectiveStepBorderStyle(null, 'lines')).toBe('lines');
    expect(resolveEffectiveStepBorderStyle(null, 'boxes')).toBe('boxes');
    expect(resolveEffectiveStepBorderStyle({ stepBorderStyle: 'boxes' }, 'lines')).toBe('boxes');
    expect(resolveEffectiveStepBorderStyle({ stepBorderStyle: 'none' }, 'lines')).toBe('none');
    expect(resolveEffectiveStepBorderStyle({ showStepBorders: false }, 'lines')).toBe('none');
    expect(resolveEffectiveStepBorderStyle({ showStepBorders: true }, 'lines')).toBe('boxes');
  });

  it('reclaims vertical header space on 1-up slots when top-left PLI overlay is eligible and verified clear', () => {
    const letterCtx = buildSmartAutoPageContext({
      pageWidthIn: 11,
      pageHeightIn: 8.5,
      density: 'balanced',
    });

    const baseStep: SmartAutoStepMetric = {
      stepId: 's_overlay',
      stepNum: 92,
      viewRadiusLdu: 360,
      projHalfWLdu: 340,
      projHalfHLdu: 330,
      pliUniqueCount: 2,
    };

    const spec1Up = computeStepPliOverlaySpec(baseStep, letterCtx.gridWidthIn, letterCtx.gridHeightIn, letterCtx, 1);
    expect(spec1Up.eligible).toBe(true);
    expect(spec1Up.widthFrac).toBeLessThan(0.4);
    expect(spec1Up.heightFrac).toBeLessThan(0.2);

    // Multi-step pages or steps with inline callouts/header badges are never overlaid
    expect(computeStepPliOverlaySpec(baseStep, letterCtx.gridWidthIn / 2, letterCtx.gridHeightIn, letterCtx, 2).eligible).toBe(false);
    expect(computeStepPliOverlaySpec({ ...baseStep, hasInlineCallout: true }, letterCtx.gridWidthIn, letterCtx.gridHeightIn, letterCtx, 1).eligible).toBe(false);
    expect(computeStepPliOverlaySpec({ ...baseStep, hasHeaderBadges: true }, letterCtx.gridWidthIn, letterCtx.gridHeightIn, letterCtx, 1).eligible).toBe(false);

    // With canOverlayPli: true on 1-up, modelAreaHeightIn and studSizeCm increase meaningfully
    const stackedEval = evaluateStepInSlot({ ...baseStep, canOverlayPli: false }, letterCtx.gridWidthIn, letterCtx.gridHeightIn, letterCtx, 1);
    const overlayEval = evaluateStepInSlot({ ...baseStep, canOverlayPli: true }, letterCtx.gridWidthIn, letterCtx.gridHeightIn, letterCtx, 1);
    expect(overlayEval.modelAreaHeightIn).toBeGreaterThan(stackedEval.modelAreaHeightIn + 0.4);
    expect(overlayEval.studSizeCm).toBeGreaterThan(stackedEval.studSizeCm * 1.07);
    expect(stackedEval.fits).toBe(false);
    expect(overlayEval.fits).toBe(true);
  });
});


