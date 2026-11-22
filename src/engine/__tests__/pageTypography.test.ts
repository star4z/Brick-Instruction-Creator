import { describe, expect, it } from 'vitest';
import {
  CANONICAL_DPI,
  computeCanonicalPageMetrics,
  computePageTypography,
  estimateBomCellGeometry,
} from '../pageTypography';

describe('Canonical Physical Page Layout & Print-Calibrated Typography', () => {
  it('renders US Letter Landscape at 96-DPI canonical coordinates on both iPhone and Desktop and scales via fitScale', () => {
    const mobile = computeCanonicalPageMetrics({
      paperFormat: 'letter',
      widthIn: 11,
      heightIn: 8.5,
      viewportW: 390,
      viewportH: 844,
    });
    const desktop = computeCanonicalPageMetrics({
      paperFormat: 'letter',
      widthIn: 11,
      heightIn: 8.5,
      viewportW: 1440,
      viewportH: 900,
    });

    // Both devices lay out the exact same 1056 x 816 canonical US Letter page
    expect(mobile.width).toBe(11 * CANONICAL_DPI);
    expect(mobile.height).toBe(8.5 * CANONICAL_DPI);
    expect(desktop.width).toBe(mobile.width);
    expect(desktop.height).toBe(mobile.height);
    expect(mobile.pxPerInch).toBe(CANONICAL_DPI);

    // Fits comfortably inside the mobile viewport width (390 - 24 = 366px)
    expect(mobile.displayWidth).toBeLessThanOrEqual(366);
    expect(mobile.displayWidth).toBeGreaterThanOrEqual(350);
    expect(mobile.fitScale).toBeCloseTo(366 / 1056, 3);
    expect(desktop.fitScale).toBeGreaterThan(mobile.fitScale);
  });

  it('prevents BOM piece thumbnails from being crushed on mobile US Letter Landscape (6x5 with part names shown)', () => {
    const mobile = computeCanonicalPageMetrics({
      paperFormat: 'letter',
      widthIn: 11,
      heightIn: 8.5,
      viewportW: 390,
      viewportH: 844,
    });
    const typo = computePageTypography({
      widthIn: mobile.widthIn,
      heightIn: mobile.heightIn,
      pxPerInch: mobile.pxPerInch,
      density: 'balanced',
      bomDensity: 'balanced',
    });
    const cell = estimateBomCellGeometry({
      pageWidth: mobile.width,
      pageHeight: mobile.height,
      cols: 6,
      rows: 5,
      showNames: true,
      typo,
    });

    // Every piece thumbnail gets > 68% of the cell height (~95px in canonical coords), never crushed into a 2px dot!
    expect(cell.imageHeightRatio).toBeGreaterThan(0.68);
    expect(cell.imageAreaH).toBeGreaterThan(85);
    expect(cell.imageAreaW).toBeGreaterThan(120);
  });

  it('preserves generous BOM thumbnail area across compact, balanced, and spacious densities in both orientations and Screen Fit', () => {
    const configs = [
      { paperFormat: 'letter', widthIn: 11, heightIn: 8.5, cols: 7, rows: 6, bomDensity: 'compact' as const },
      { paperFormat: 'letter', widthIn: 11, heightIn: 8.5, cols: 6, rows: 5, bomDensity: 'balanced' as const },
      { paperFormat: 'letter', widthIn: 11, heightIn: 8.5, cols: 4, rows: 4, bomDensity: 'spacious' as const },
      { paperFormat: 'letter', widthIn: 8.5, heightIn: 11, cols: 5, rows: 7, bomDensity: 'compact' as const },
      { paperFormat: 'letter', widthIn: 8.5, heightIn: 11, cols: 4, rows: 6, bomDensity: 'balanced' as const },
      { paperFormat: 'a4', widthIn: 11.69, heightIn: 8.27, cols: 6, rows: 5, bomDensity: 'balanced' as const },
      { paperFormat: 'square', widthIn: 8.5, heightIn: 8.5, cols: 4, rows: 6, bomDensity: 'balanced' as const },
      { paperFormat: 'screen', widthIn: 11, heightIn: 8.5, cols: 4, rows: 6, bomDensity: 'balanced' as const },
    ];

    for (const c of configs) {
      const metrics = computeCanonicalPageMetrics({
        paperFormat: c.paperFormat,
        widthIn: c.widthIn,
        heightIn: c.heightIn,
        viewportW: 390,
        viewportH: 844,
      });
      const typo = computePageTypography({
        widthIn: metrics.widthIn,
        heightIn: metrics.heightIn,
        pxPerInch: metrics.pxPerInch,
        density: 'balanced',
        bomDensity: c.bomDensity,
      });
      const cell = estimateBomCellGeometry({
        pageWidth: metrics.width,
        pageHeight: metrics.height,
        cols: c.cols,
        rows: c.rows,
        showNames: true,
        typo,
      });

      expect(cell.imageHeightRatio).toBeGreaterThan(0.64);
      expect(cell.imageAreaH).toBeGreaterThan(68);
    }
  });

  it('keeps US Letter typography in refined physical print point ranges and consistent between live preview and PDF export', () => {
    const liveTypo = computePageTypography({
      widthIn: 11,
      heightIn: 8.5,
      pxPerInch: 96,
      density: 'balanced',
      bomDensity: 'balanced',
    });
    const pdfPxPerInch = 72 * 1.45; // Matches runPdfExport (104.4 DPI)
    const pdfTypo = computePageTypography({
      widthIn: 11,
      heightIn: 8.5,
      pxPerInch: pdfPxPerInch,
      density: 'balanced',
      bomDensity: 'balanced',
    });

    const toPt = (px: number, dpi: number) => (px / dpi) * 72;

    // Physical point sizes on US Letter should be clean print sizes (not oversized 15–30pt footers/labels)
    expect(toPt(liveTypo.footerFont, 96)).toBeCloseTo(8.5, 1);
    expect(toPt(liveTypo.bom.titleFont, 96)).toBeCloseTo(14, 1);
    expect(toPt(liveTypo.bom.qtyFont, 96)).toBeCloseTo(9.5, 1);
    expect(toPt(liveTypo.bom.nameFont, 96)).toBeCloseTo(7.0, 1);
    expect(toPt(liveTypo.cover.titleFont, 96)).toBeCloseTo(23, 1);
    expect(toPt(liveTypo.steps.stepNum1Up, 96)).toBeCloseTo(21, 1);

    // Live 96-DPI preview and 104.4-DPI PDF export produce identical physical point sizes
    expect(toPt(pdfTypo.footerFont, pdfPxPerInch)).toBeCloseTo(toPt(liveTypo.footerFont, 96), 1);
    expect(toPt(pdfTypo.bom.titleFont, pdfPxPerInch)).toBeCloseTo(toPt(liveTypo.bom.titleFont, 96), 1);
    expect(toPt(pdfTypo.bom.qtyFont, pdfPxPerInch)).toBeCloseTo(toPt(liveTypo.bom.qtyFont, 96), 1);
    expect(toPt(pdfTypo.bom.nameFont, pdfPxPerInch)).toBeCloseTo(toPt(liveTypo.bom.nameFont, 96), 1);
    expect(toPt(pdfTypo.cover.titleFont, pdfPxPerInch)).toBeCloseTo(toPt(liveTypo.cover.titleFont, 96), 1);
    expect(toPt(pdfTypo.steps.stepNum1Up, pdfPxPerInch)).toBeCloseTo(toPt(liveTypo.steps.stepNum1Up, 96), 1);
  });

  it('keeps portrait and landscape US Letter fonts physically identical instead of inflating portrait text', () => {
    const land = computePageTypography({ widthIn: 11, heightIn: 8.5, pxPerInch: 96 });
    const port = computePageTypography({ widthIn: 8.5, heightIn: 11, pxPerInch: 96 });

    expect(port.typeScale).toBe(land.typeScale);
    expect(port.footerFont).toBe(land.footerFont);
    expect(port.bom.titleFont).toBe(land.bom.titleFont);
    expect(port.bom.qtyFont).toBe(land.bom.qtyFont);
    expect(port.cover.titleFont).toBe(land.cover.titleFont);
  });
});
