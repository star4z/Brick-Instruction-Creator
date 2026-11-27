import { describe, expect, it } from 'vitest';
import {
  DEFAULT_BOM_CONFIG,
  bomConfigsEqual,
  comparePartIdsNatural,
  computeAutoBomGrid,
  computeBomCellTypography,
  computeBomTableColumns,
  computeBomTablePlan,
  computeBomTableTypography,
  computePartGridSpans,
  createDefaultBomConfig,
  formatDisplayPartId,
  getEnabledBomFields,
  normalizeBomConfig,
  packBomGridPages,
  projectPartDimensionsLdu,
  reorderBomFields,
  resolveBomGridPlan,
  summarizeBomConfig,
  toggleBomField,
  wrapBomTextLines,
} from '../partsList';

function makeBrick(id: string, dx: number, dy: number, dz: number) {
  const proj = projectPartDimensionsLdu(dx, dy, dz);
  return { id, ...proj };
}

describe('Parts List (BOM) configuration & legacy migration', () => {
  it('migrates unmodified legacy bomConfig cleanly to the new defaults without false diffs', () => {
    const legacyDefault = {
      density: 'balanced',
      flow: 'rows',
      align: 'start',
      sortPrimary: 'color',
      sortSecondary: 'category',
      showNames: true,
    };
    const normalized = normalizeBomConfig(legacyDefault);
    expect(bomConfigsEqual(normalized, DEFAULT_BOM_CONFIG)).toBe(true);
    expect(getEnabledBomFields(normalized)).toEqual(['image', 'qty', 'name', 'partId']);
  });

  it('migrates customized legacy bomConfig properties faithfully', () => {
    const legacyCustom = {
      density: 'spacious',
      flow: 'columns',
      align: 'center',
      sortPrimary: 'qty',
      sortSecondary: 'name',
      showNames: false,
    };
    const normalized = normalizeBomConfig(legacyCustom);
    expect(normalized.flowAxis).toBe('columns');
    expect(normalized.align).toBe('center');
    expect(normalized.sortPrimary).toBe('qty');
    expect(normalized.sortSecondary).toBe('name');
    expect(normalized.minCellSizeIn).toBeGreaterThan(1.0);
    expect(getEnabledBomFields(normalized)).not.toContain('name');
    expect(getEnabledBomFields(normalized)).toContain('partId');
  });

  it('reorders fields cleanly and prevents disabling the last active field', () => {
    const base = createDefaultBomConfig().fields;
    // Move partId (index 3) to index 1
    const reordered = reorderBomFields(base, 3, 1);
    expect(reordered.map((f) => f.id)).toEqual(['image', 'partId', 'qty', 'name', 'color']);

    // Disable all except one
    let cur = reordered;
    cur = toggleBomField(cur, 'image', false);
    cur = toggleBomField(cur, 'partId', false);
    cur = toggleBomField(cur, 'qty', false);
    expect(cur.filter((f) => f.enabled).map((f) => f.id)).toEqual(['name']);
    // Attempting to disable the last remaining enabled field is a no-op
    cur = toggleBomField(cur, 'name', false);
    expect(cur.filter((f) => f.enabled).map((f) => f.id)).toEqual(['name']);
  });

  it('formats LEGO/LDraw part IDs cleanly and sorts naturally', () => {
    expect(formatDisplayPartId('parts/bl_3001.dat')).toBe('3001');
    expect(formatDisplayPartId('3070b-bl.dat')).toBe('3070b');
    expect(formatDisplayPartId('ldraw\\parts\\973pb1234.dat')).toBe('973pb1234');

    const ids = ['15573', '3069b', '3001', '3069a', '3023'];
    ids.sort(comparePartIdsNatural);
    expect(ids).toEqual(['3001', '3023', '3069a', '3069b', '15573']);

    expect(normalizeBomConfig({ minCellSizeIn: 0.2 }).minCellSizeIn).toBe(0.5);
    expect(normalizeBomConfig({ minCellSizeIn: 3.5 }).minCellSizeIn).toBe(2.0);
  });
});

describe('Parts List 8-direction grid packing & hanging alignment', () => {
  const items = ['A', 'B', 'C', 'D', 'E', 'F'];
  const unitSpans = items.map(() => ({ colSpan: 1, rowSpan: 1 }));

  it('places items accurately for Rows × LTR/RTL × TTB/BTT', () => {
    // Rows + LTR + TTB + start (4x2)
    const ltrTtb = packBomGridPages(items, unitSpans, 4, 2, {
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
    })[0];
    expect(ltrTtb.map((c) => [c.item, c.col, c.row])).toEqual([
      ['A', 0, 0], ['B', 1, 0], ['C', 2, 0], ['D', 3, 0],
      ['E', 0, 1], ['F', 1, 1],
    ]);

    // Rows + RTL + TTB + start (4x2): A starts top-right, hanging E/F flush right
    const rtlTtb = packBomGridPages(items, unitSpans, 4, 2, {
      flowAxis: 'rows',
      horizontalDir: 'rtl',
      verticalDir: 'ttb',
      align: 'start',
    })[0];
    expect(rtlTtb.map((c) => [c.item, c.col, c.row])).toEqual([
      ['A', 3, 0], ['B', 2, 0], ['C', 1, 0], ['D', 0, 0],
      ['E', 3, 1], ['F', 2, 1],
    ]);

    // Rows + LTR + BTT + center (4x2): A..D on bottom row (row 1), E..F centered on top row (row 0)
    const ltrBttCenter = packBomGridPages(items, unitSpans, 4, 2, {
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'btt',
      align: 'center',
    })[0];
    expect(ltrBttCenter.map((c) => [c.item, c.col, c.row])).toEqual([
      ['A', 0, 1], ['B', 1, 1], ['C', 2, 1], ['D', 3, 1],
      ['E', 1, 0], ['F', 2, 0],
    ]);

    // Rows + RTL + BTT + end (4x2): A..D bottom row right-to-left, hanging E/F at left end of top row
    const rtlBttEnd = packBomGridPages(items, unitSpans, 4, 2, {
      flowAxis: 'rows',
      horizontalDir: 'rtl',
      verticalDir: 'btt',
      align: 'end',
    })[0];
    expect(rtlBttEnd.map((c) => [c.item, c.col, c.row])).toEqual([
      ['A', 3, 1], ['B', 2, 1], ['C', 1, 1], ['D', 0, 1],
      ['E', 1, 0], ['F', 0, 0],
    ]);
  });

  it('places items accurately for Columns × BTT × LTR/RTL', () => {
    const colLtrBtt = packBomGridPages(items, unitSpans, 4, 2, {
      flowAxis: 'columns',
      horizontalDir: 'ltr',
      verticalDir: 'btt',
      align: 'start',
    })[0];
    expect(colLtrBtt.map((c) => [c.item, c.col, c.row])).toEqual([
      ['A', 0, 1], ['B', 0, 0],
      ['C', 1, 1], ['D', 1, 0],
      ['E', 2, 1], ['F', 2, 0],
    ]);

    const colRtlBtt = packBomGridPages(items, unitSpans, 4, 2, {
      flowAxis: 'columns',
      horizontalDir: 'rtl',
      verticalDir: 'btt',
      align: 'start',
    })[0];
    expect(colRtlBtt.map((c) => [c.item, c.col, c.row])).toEqual([
      ['A', 3, 1], ['B', 3, 0],
      ['C', 2, 1], ['D', 2, 0],
      ['E', 1, 1], ['F', 1, 0],
    ]);
  });
});

describe('Automatic grid sizing (min brick size + expand to fill pages)', () => {
  const letterContentW = 10.22;
  const letterContentH = 7.08;
  const fields = ['image', 'qty', 'name', 'partId'] as const;

  it('expands cells generously when few parts fit on 1 page', () => {
    const smallItems = Array.from({ length: 18 }, (_, i) => makeBrick(`p${i}`, 40, 24, 20));
    const plan = computeAutoBomGrid({
      items: smallItems,
      contentWidthIn: letterContentW,
      contentHeightIn: letterContentH,
      minCellSizeIn: 0.5,
      enabledFields: fields,
      variableSizing: false,
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
    });

    expect(plan.pageCount).toBe(1);
    expect(plan.cols * plan.rows).toBeGreaterThanOrEqual(18);
    expect(plan.cols * plan.rows).toBeLessThanOrEqual(24);
    expect(plan.cellWidthIn).toBeGreaterThan(1.5);
    expect(plan.cellHeightIn).toBeGreaterThan(1.5);
  });

  it('packs dense single-page lists down to ~0.5 in cells before spilling onto page 2', () => {
    const denseItems = Array.from({ length: 240 }, (_, i) => makeBrick(`p${i}`, 20, 8, 20));
    const plan = computeAutoBomGrid({
      items: denseItems,
      contentWidthIn: letterContentW,
      contentHeightIn: letterContentH,
      minCellSizeIn: 0.5,
      enabledFields: fields,
      variableSizing: false,
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
    });

    // At 0.5" min, max capacity is 20x14 = 280, so 240 fits on 1 page!
    expect(plan.pageCount).toBe(1);
    expect(plan.cellWidthIn).toBeGreaterThanOrEqual(0.5);
    expect(plan.cellHeightIn).toBeGreaterThanOrEqual(0.5);
  });

  it('expands layout to fill available space once spillover requires 2 pages', () => {
    // 300 parts > 280 (20x14 max on 1 page at 0.5"), so 2 pages are required.
    // Instead of staying at 20x14 (0.50" cells), Auto should expand to ~15x10 (~0.68" cells)!
    const items300 = Array.from({ length: 300 }, (_, i) => makeBrick(`p${i}`, 20, 8, 20));
    const plan = computeAutoBomGrid({
      items: items300,
      contentWidthIn: letterContentW,
      contentHeightIn: letterContentH,
      minCellSizeIn: 0.5,
      enabledFields: fields,
      variableSizing: false,
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
    });

    expect(plan.pageCount).toBe(2);
    expect(plan.cols * plan.rows).toBeGreaterThanOrEqual(150);
    expect(plan.cols * plan.rows).toBeLessThan(200);
    expect(plan.cellWidthIn).toBeGreaterThan(0.60);
    expect(plan.cellHeightIn).toBeGreaterThan(0.60);
  });

  it('respects larger minCellSizeIn settings by using more pages with bigger bricks', () => {
    const items80 = Array.from({ length: 80 }, (_, i) => makeBrick(`p${i}`, 40, 24, 20));
    const densePlan = computeAutoBomGrid({
      items: items80,
      contentWidthIn: letterContentW,
      contentHeightIn: letterContentH,
      minCellSizeIn: 0.5,
      enabledFields: fields,
      variableSizing: false,
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
    });
    const roomyPlan = computeAutoBomGrid({
      items: items80,
      contentWidthIn: letterContentW,
      contentHeightIn: letterContentH,
      minCellSizeIn: 1.25,
      enabledFields: fields,
      variableSizing: false,
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
    });

    expect(densePlan.pageCount).toBe(1);
    expect(roomyPlan.pageCount).toBeGreaterThan(1);
    expect(roomyPlan.cellWidthIn).toBeGreaterThanOrEqual(1.25);
    expect(roomyPlan.cellHeightIn).toBeGreaterThanOrEqual(1.25);
  });
});

describe('Variable brick sizing (strict integer grid multiples & zero-overlap 2D packing)', () => {
  const mixedBricks = [
    makeBrick('plate1x1', 20, 8, 20),
    makeBrick('brick1x2', 40, 24, 20),
    makeBrick('plate1x12', 240, 8, 20),
    makeBrick('plate2x2', 40, 8, 40),
    makeBrick('window1x4x6', 80, 144, 20),
    makeBrick('baseplate16x16', 320, 8, 320),
    ...Array.from({ length: 16 }, (_, i) => makeBrick(`small_${i}`, 20, 16, 20)),
  ];

  it('assigns strict integer grid multiples proportional to physical dimensions', () => {
    const spans = computePartGridSpans(mixedBricks, 8, 6, true);
    for (const s of spans) {
      expect(Number.isInteger(s.colSpan)).toBe(true);
      expect(Number.isInteger(s.rowSpan)).toBe(true);
      expect(s.colSpan).toBeGreaterThanOrEqual(1);
      expect(s.rowSpan).toBeGreaterThanOrEqual(1);
    }
    // 1x1 plate stays 1x1
    expect(spans[0]).toEqual({ colSpan: 1, rowSpan: 1 });
    // Long 1x12 plate spans multiple columns horizontally
    expect(spans[2].colSpan).toBeGreaterThanOrEqual(2);
    expect(spans[2].rowSpan).toBe(1);
    // Tall 1x4x6 window spans multiple rows vertically
    expect(spans[4].rowSpan).toBeGreaterThanOrEqual(2);
    // Huge 16x16 baseplate spans multiple columns and rows
    expect(spans[5].colSpan).toBeGreaterThanOrEqual(3);
    expect(spans[5].rowSpan).toBeGreaterThanOrEqual(2);
  });

  it('packs multi-span bricks with zero overlaps and zero dropped items across all directions', () => {
    const cfgBase = { ...createDefaultBomConfig(), gridMode: 'custom' as const, customCols: 6, customRows: 5, variableSizing: true };
    for (const flowAxis of ['rows', 'columns'] as const) {
      for (const horizontalDir of ['ltr', 'rtl'] as const) {
        for (const verticalDir of ['ttb', 'btt'] as const) {
          const plan = resolveBomGridPlan({
            items: mixedBricks,
            config: { ...cfgBase, flowAxis, horizontalDir, verticalDir },
            contentWidthIn: 10.2,
            contentHeightIn: 7.0,
          });

          const seenIds = new Set<string>();
          for (const page of plan.pages) {
            const occupied = new Set<string>();
            for (const cell of page) {
              expect(seenIds.has(cell.item.id)).toBe(false);
              seenIds.add(cell.item.id);
              expect(cell.col).toBeGreaterThanOrEqual(0);
              expect(cell.row).toBeGreaterThanOrEqual(0);
              expect(cell.col + cell.colSpan).toBeLessThanOrEqual(plan.cols);
              expect(cell.row + cell.rowSpan).toBeLessThanOrEqual(plan.rows);
              for (let r = cell.row; r < cell.row + cell.rowSpan; r++) {
                for (let c = cell.col; c < cell.col + cell.colSpan; c++) {
                  const key = `${c},${r}`;
                  expect(occupied.has(key)).toBe(false);
                  occupied.add(key);
                }
              }
            }
          }
          expect(seenIds.size).toBe(mixedBricks.length);
        }
      }
    }
  });

  it('optimizes Auto grid sizing cleanly with variableSizing enabled', () => {
    const plan = computeAutoBomGrid({
      items: mixedBricks,
      contentWidthIn: 10.22,
      contentHeightIn: 7.08,
      minCellSizeIn: 0.5,
      enabledFields: ['image', 'qty', 'partId'],
      variableSizing: true,
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
    });

    expect(plan.pageCount).toBe(1);
    const totalPlaced = plan.pages.reduce((acc, p) => acc + p.length, 0);
    expect(totalPlaced).toBe(mixedBricks.length);
    // Should expand way bigger than the 20x14 maximum grid!
    expect(plan.cols).toBeLessThan(12);
    expect(plan.cellWidthIn).toBeGreaterThan(0.9);
  });
});

describe('Adaptive grid typography & Table format', () => {
  it('preserves thumbnail area even on dense 0.5-inch cells with 4 labels enabled', () => {
    const typo = computeBomCellTypography({
      cellW: 48, // 0.5 in at 96 DPI
      cellH: 48,
      pxPerInch: 96,
      enabledFields: ['image', 'qty', 'name', 'partId', 'color'],
    });
    expect(typo.layoutMode).toBe('vertical');
    expect(typo.imageBoxH).toBeGreaterThanOrEqual(18);
    expect(typo.qtyFont).toBeGreaterThanOrEqual(4.2);
  });

  it('uses side-by-side horizontal layout for wide multi-column cells preserving field order', () => {
    const imgFirst = computeBomCellTypography({
      cellW: 220,
      cellH: 90,
      pxPerInch: 96,
      enabledFields: ['image', 'qty', 'name', 'partId'],
    });
    expect(imgFirst.layoutMode).toBe('horizontal-img-first');

    const imgLast = computeBomCellTypography({
      cellW: 220,
      cellH: 90,
      pxPerInch: 96,
      enabledFields: ['qty', 'name', 'partId', 'image'],
    });
    expect(imgLast.layoutMode).toBe('horizontal-img-last');

    const imgMid = computeBomCellTypography({
      cellW: 220,
      cellH: 90,
      pxPerInch: 96,
      enabledFields: ['qty', 'image', 'name'],
    });
    expect(imgMid.layoutMode).toBe('vertical');
  });

  it('computes Table rows-per-page (Auto & Custom) and exact proportional draggable columns', () => {
    const items = Array.from({ length: 45 }, (_, i) => i);
    const autoCfg = normalizeBomConfig({ format: 'table', tableRowsMode: 'auto' });
    const autoPlan = computeBomTablePlan({ items, config: autoCfg, contentHeightIn: 7.0 });
    expect(autoPlan.isAutoRows).toBe(true);
    expect(autoPlan.pageCount).toBeGreaterThanOrEqual(2);
    expect(autoPlan.pages.flat()).toHaveLength(45);

    const customCfg = normalizeBomConfig({ format: 'table', tableRowsMode: 'custom', tableRowsPerPage: 15 });
    const customPlan = computeBomTablePlan({ items, config: customCfg, contentHeightIn: 7.0 });
    expect(customPlan.isAutoRows).toBe(false);
    expect(customPlan.rowsPerPage).toBe(15);
    expect(customPlan.pageCount).toBe(3);

    const orderedFields = ['partId', 'image', 'name', 'color', 'qty'] as const;
    const cols = computeBomTableColumns(orderedFields, 960, 36);
    expect(cols.map((c) => c.id)).toEqual(orderedFields);
    const totalW = cols.reduce((acc, c) => acc + c.width, 0);
    expect(totalW).toBeCloseTo(960, 4);
    expect(cols[2].width).toBeGreaterThan(cols[4].width); // Part Name wider than Qty

    const tTypo = computeBomTableTypography({ tableHeightPx: 640, rowsPerPage: 15, pxPerInch: 96 });
    expect(tTypo.headerH).toBeGreaterThanOrEqual(18);
    expect(tTypo.rowH).toBeGreaterThan(30);

    expect(summarizeBomConfig(customCfg)).toContain('Table');
    expect(summarizeBomConfig(customCfg)).toContain('15 rows');
  });

  it('normalizes and compares wrapPartNames and computes nameMaxLines when enabled', () => {
    const off = normalizeBomConfig({});
    const on = normalizeBomConfig({ wrapPartNames: true });
    expect(off.wrapPartNames).toBeUndefined();
    expect(on.wrapPartNames).toBe(true);
    expect(bomConfigsEqual(off, on)).toBe(false);
    expect(bomConfigsEqual(normalizeBomConfig({ wrapPartNames: false }), off)).toBe(true);

    const truncatedTypo = computeBomCellTypography({
      cellW: 90,
      cellH: 96,
      pxPerInch: 96,
      enabledFields: ['image', 'qty', 'name', 'partId'],
      wrapPartNames: false,
    });
    expect(truncatedTypo.nameMaxLines).toBe(1);

    const wrappedTypo = computeBomCellTypography({
      cellW: 90,
      cellH: 96,
      pxPerInch: 96,
      enabledFields: ['image', 'qty', 'name', 'partId'],
      wrapPartNames: true,
    });
    expect(wrappedTypo.nameMaxLines).toBeGreaterThanOrEqual(2);
    expect(wrappedTypo.nameMaxLines).toBeLessThanOrEqual(3);
  });

  it('wraps long part names cleanly across lines and only truncates when exceeding maxLines', () => {
    const measure = (s: string) => s.length * 6; // 6px per char
    expect(wrapBomTextLines('Tile 1 x 2', 80, measure, 3)).toEqual(['Tile 1 x 2']);

    const wrapped = wrapBomTextLines('Slope, Curved 1 x 2 x 2/3', 80, measure, 3);
    expect(wrapped.length).toBeGreaterThanOrEqual(2);
    expect(wrapped.length).toBeLessThanOrEqual(3);
    expect(wrapped.join(' ')).toBe('Slope, Curved 1 x 2 x 2/3');
    for (const line of wrapped) {
      expect(measure(line)).toBeLessThanOrEqual(80);
    }

    const clamped = wrapBomTextLines(
      'Technic, Plate 1 x 5 with Toothed Ends and Reinforced Axle Holes',
      80,
      measure,
      2,
    );
    expect(clamped).toHaveLength(2);
    expect(clamped[1].endsWith('…')).toBe(true);
    for (const line of clamped) {
      expect(measure(line)).toBeLessThanOrEqual(80);
    }

    // Overlong single token without spaces breaks across lines without overflowing
    const unbroken = wrapBomTextLines('Supercalifragilisticexpialidocious', 60, measure, 3);
    expect(unbroken.length).toBeGreaterThanOrEqual(2);
    for (const line of unbroken) {
      expect(measure(line)).toBeLessThanOrEqual(60);
    }
  });
});
