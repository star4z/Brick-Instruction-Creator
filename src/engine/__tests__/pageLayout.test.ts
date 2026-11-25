import { describe, expect, it } from 'vitest';
import {
  SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN,
  SMART_AUTO_MIN_STEP_AREA_WIDTH_IN,
  SMART_AUTO_MIN_STUD_SIZE_CM,
  analyzePageSizeFit,
  buildSmartAutoPageContext,
  computeBoundingSphereFromBoxLists,
  computePageSlotRects,
  computeRenderedStudSizeCm,
  computeRequiredModelSideForStudCm,
  computeSmartAutoPreviewGrid,
  createDefaultPageLayoutSpec,
  deriveStepsPerPageFromLayout,
  describePageLayoutSpec,
  evaluateStepInSlot,
  findBestSmartAutoGridForSteps,
  findLayoutGroupForStep,
  formatPageSizeWarningForPage,
  getSpecStepsPerPageCap,
  normalizeLayoutGroups,
  normalizePageLayoutSpec,
  packSmartAutoPage,
  resolveGridDimensions,
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
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 'auto', mixedLayout: 'hero_left' })).toBe(3);
    expect(deriveStepsPerPageFromLayout({ cols: 'auto', rows: 'auto', mixedLayout: 'custom_weights' })).toBe(4);
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

  it('supports custom per-slot size weights (sm / md / lg)', () => {
    const weighted: PageLayoutSpec = {
      ...createDefaultPageLayoutSpec(),
      mode: 'custom',
      stepsPerPage: 4,
      cols: 2,
      rows: 2,
      mixedLayout: 'custom_weights',
      slotSizes: ['lg', 'sm', 'sm', 'md'],
    };
    const rects = computePageSlotRects(4, weighted, true, 800, 600, 10);
    expect(rects[0].w).toBeGreaterThan(rects[1].w * 2);
    expect(rects[0].h).toBeGreaterThan(rects[2].h);
    expect(rects[0].isFeatured).toBe(true);
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
});
