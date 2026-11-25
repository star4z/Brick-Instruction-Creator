import { describe, expect, it } from 'vitest';
import {
  COVER_HERO_MAX_EDGE,
  DEFAULT_PDF_MAX_EDGE,
  DEFAULT_SCREEN_MAX_EDGE,
  DEFAULT_SCREEN_MAX_PIXELS,
  clampRenderDimensions,
  computeCoverHeroRenderSize,
  computeMinifigDiagramRenderSize,
  computePdfPagePixelDimensions,
  computePreviewResolutionScale,
  computeStepSlotRenderSize,
  shouldUpgradeStepRenderForZoom,
} from '../stepRenderResolution';

describe('stepRenderResolution', () => {
  it('supersamples previews at >= 2.25x on 1x displays, supports 3x Retina, and boosts on zoom', () => {
    expect(computePreviewResolutionScale(1, 1)).toBeGreaterThanOrEqual(2.25);
    expect(computePreviewResolutionScale(2, 1)).toBeGreaterThanOrEqual(2.25);
    expect(computePreviewResolutionScale(3, 1)).toBeGreaterThanOrEqual(3);

    const zoomed = computePreviewResolutionScale(2, 2.0);
    expect(zoomed).toBeGreaterThan(computePreviewResolutionScale(2, 1));
    expect(zoomed).toBeLessThanOrEqual(5.0);
  });

  it('produces significantly higher resolution for 1-up, 2-up, and 4-up step slots than legacy bounds', () => {
    const oneUp = computeStepSlotRenderSize({
      slotWidth: 960,
      slotHeight: 700,
      slotCount: 1,
      isFeatured: true,
      dpr: 1,
      zoom: 1,
    });
    expect(oneUp.width).toBeGreaterThanOrEqual(2400);
    expect(oneUp.height).toBeGreaterThanOrEqual(1500);

    const twoUp = computeStepSlotRenderSize({
      slotWidth: 480,
      slotHeight: 680,
      slotCount: 2,
      dpr: 2,
      zoom: 1,
    });
    expect(twoUp.width).toBeGreaterThanOrEqual(1550);
    expect(twoUp.height).toBeGreaterThanOrEqual(1700);

    const fourUp = computeStepSlotRenderSize({
      slotWidth: 460,
      slotHeight: 330,
      slotCount: 4,
      isCompact: true,
      dpr: 1,
      zoom: 1,
    });
    expect(fourUp.width).toBeGreaterThanOrEqual(1450);
    expect(fourUp.height).toBeGreaterThanOrEqual(900);
    expect(fourUp.width * fourUp.height).toBeGreaterThanOrEqual(1_400_000);
  });

  it('adapts render aspect ratio to portrait and landscape slots without clipping or extreme distortion', () => {
    const tallSlot = computeStepSlotRenderSize({
      slotWidth: 420,
      slotHeight: 760,
      slotCount: 2,
      dpr: 2,
      zoom: 1,
    });
    // Tall slot should render taller than wide (portrait aspect)
    expect(tallSlot.height).toBeGreaterThan(tallSlot.width);
    expect(tallSlot.width / tallSlot.height).toBeGreaterThanOrEqual(0.71);

    const wideSlot = computeStepSlotRenderSize({
      slotWidth: 960,
      slotHeight: 340,
      slotCount: 2,
      dpr: 2,
      zoom: 1,
    });
    expect(wideSlot.width).toBeGreaterThan(wideSlot.height);
    expect(wideSlot.width / wideSlot.height).toBeLessThanOrEqual(2.26);
  });

  it('increases step slot resolution when zoomed in and respects GPU/memory caps', () => {
    const normal = computeStepSlotRenderSize({
      slotWidth: 460,
      slotHeight: 330,
      slotCount: 4,
      isCompact: true,
      dpr: 1,
      zoom: 1,
    });
    const zoomedIn = computeStepSlotRenderSize({
      slotWidth: 460,
      slotHeight: 330,
      slotCount: 4,
      isCompact: true,
      dpr: 1,
      zoom: 2.5,
    });
    expect(zoomedIn.width).toBeGreaterThan(normal.width);
    expect(zoomedIn.height).toBeGreaterThan(normal.height);
    expect(Math.max(zoomedIn.width, zoomedIn.height)).toBeLessThanOrEqual(DEFAULT_SCREEN_MAX_EDGE);
    expect(zoomedIn.width * zoomedIn.height).toBeLessThanOrEqual(DEFAULT_SCREEN_MAX_PIXELS + 5000);

    const gpuCapped = computeStepSlotRenderSize({
      slotWidth: 960,
      slotHeight: 700,
      slotCount: 1,
      dpr: 3,
      zoom: 3,
      gpuMaxDim: 1536,
    });
    expect(Math.max(gpuCapped.width, gpuCapped.height)).toBeLessThanOrEqual(1536);
  });

  it('produces print-ready high-DPI PDF page & supersampled step model sizes', () => {
    // US Letter Landscape: 792 x 612 pt -> ~180 DPI (~1980 x 1530)
    const letterStepPage = computePdfPagePixelDimensions(792, 612, 'steps');
    expect(letterStepPage.width).toBeGreaterThanOrEqual(1900);
    expect(letterStepPage.height).toBeGreaterThanOrEqual(1480);

    // Cover remains ultra-sharp
    const letterCover = computePdfPagePixelDimensions(792, 612, 'cover');
    expect(letterCover.width).toBeGreaterThanOrEqual(letterStepPage.width);

    // Step model in PDF is supersampled over its drawn slot rectangle
    const pdfStepModel = computeStepSlotRenderSize({
      slotWidth: 1800,
      slotHeight: 1180,
      slotCount: 1,
      isFeatured: true,
      mode: 'pdf',
    });
    expect(pdfStepModel.width).toBeGreaterThanOrEqual(2200);
    expect(Math.max(pdfStepModel.width, pdfStepModel.height)).toBeLessThanOrEqual(DEFAULT_PDF_MAX_EDGE);
  });

  it('sizes Minifig exploded and sequential diagrams at HiDPI without the old 1.5x cap', () => {
    const exploded = computeMinifigDiagramRenderSize({
      kind: 'exploded',
      slotCount: 1,
      isFeatured: true,
      dpr: 2,
      zoom: 1,
    });
    expect(exploded.width).toBeGreaterThanOrEqual(1900);
    expect(exploded.height).toBeGreaterThanOrEqual(1300);

    const seq = computeMinifigDiagramRenderSize({
      kind: 'sequential',
      slotCount: 1,
      stageCount: 3,
      dpr: 2,
      zoom: 1,
    });
    expect(seq.width).toBeGreaterThanOrEqual(820);
    expect(seq.height).toBeGreaterThanOrEqual(1100);
  });

  it('clamps render dimensions while preserving aspect ratio', () => {
    const clamped = clampRenderDimensions(4000, 2000, 2000, 4_000_000);
    expect(clamped.width).toBe(2000);
    expect(clamped.height).toBe(1000);

    const areaClamped = clampRenderDimensions(2400, 2400, 2400, 3_600_000);
    expect(areaClamped.width).toBe(areaClamped.height);
    expect(areaClamped.width * areaClamped.height).toBeLessThanOrEqual(3_600_000 + 4000);
  });

  it('triggers zoom upgrade only when target size increases meaningfully', () => {
    expect(shouldUpgradeStepRenderForZoom(1200, 800, 1260, 840)).toBe(false);
    expect(shouldUpgradeStepRenderForZoom(1200, 800, 1500, 1000)).toBe(true);
    expect(shouldUpgradeStepRenderForZoom(0, 0, 800, 600)).toBe(true);
  });

  it('scales cover hero renders to 4K monitors and 300 DPI print quality while respecting GPU limits', () => {
    // 4K monitor (dpr=2, large stageFitScale=1.6)
    const cover4k = computeCoverHeroRenderSize({
      heroWidth: 960,
      heroHeight: 620,
      dpr: 2,
      zoom: 1,
      stageFitScale: 1.6,
      mode: 'screen',
      gpuMaxDim: 4096,
    });
    expect(cover4k.width).toBeGreaterThanOrEqual(3200);
    expect(cover4k.width).toBeLessThanOrEqual(COVER_HERO_MAX_EDGE);

    // 1x desktop monitor still gets print-grade floor (>= 2400px long edge)
    const cover1x = computeCoverHeroRenderSize({
      heroWidth: 960,
      heroHeight: 620,
      dpr: 1,
      zoom: 1,
      stageFitScale: 1.0,
      mode: 'screen',
      gpuMaxDim: 4096,
    });
    expect(cover1x.width).toBeGreaterThanOrEqual(2400);

    // 300 DPI US Letter cover PDF
    const pdfCoverPage = computePdfPagePixelDimensions(792, 612, 'cover');
    expect(pdfCoverPage.width).toBeGreaterThanOrEqual(3200);
    const pdfCoverHero = computeCoverHeroRenderSize({
      heroWidth: pdfCoverPage.width * 0.9,
      heroHeight: pdfCoverPage.height * 0.85,
      mode: 'pdf',
      gpuMaxDim: 4096,
    });
    expect(pdfCoverHero.width).toBeGreaterThanOrEqual(3200);
    expect(pdfCoverHero.width).toBeLessThanOrEqual(COVER_HERO_MAX_EDGE);

    // Respects smaller GPU hardware limit
    const capped = computeCoverHeroRenderSize({
      heroWidth: 960,
      heroHeight: 620,
      dpr: 2,
      zoom: 2,
      stageFitScale: 1.6,
      mode: 'screen',
      gpuMaxDim: 2048,
    });
    expect(Math.max(capped.width, capped.height)).toBeLessThanOrEqual(2048);
  });
});
