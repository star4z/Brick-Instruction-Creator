import { describe, expect, it } from 'vitest';
import {
  computePageSlotRects,
  createDefaultPageLayoutSpec,
  deriveStepsPerPageFromLayout,
  describePageLayoutSpec,
  findLayoutGroupForStep,
  getSpecStepsPerPageCap,
  normalizeLayoutGroups,
  normalizePageLayoutSpec,
  resolveGridDimensions,
  type PageLayoutSpec,
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
});
