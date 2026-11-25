/**
 * Pure, DOM-free resolution & supersampling calculations for 3D model renders
 * on step pages, minifig diagrams, submodel callouts, and print-ready PDF exports.
 */

export const DEFAULT_SCREEN_MAX_EDGE = 3600;
export const DEFAULT_SCREEN_MAX_PIXELS = 9_600_000;
export const DEFAULT_PDF_MAX_EDGE = 3840;
export const DEFAULT_PDF_MAX_PIXELS = 11_000_000;
export const DEFAULT_GPU_MAX_DIM = 4096;

export const STEP_PDF_PT_SCALE = 3.472; // ~250 DPI (72 pt/in * 3.472) for razor-sharp printed step pages
export const COVER_PDF_PT_SCALE = 4.167; // 300 DPI (72 pt/in * 4.167 = 300 px/in) for print-quality covers
export const STEP_PDF_MAX_EDGE = 3400;
export const COVER_PDF_MAX_EDGE = 3600;
export const COVER_HERO_MAX_EDGE = 3840; // True 4K / 300 DPI print cover hero ceiling
export const COVER_HERO_MAX_PIXELS = 11_000_000;

export interface RenderDimensions {
  width: number;
  height: number;
}

export interface StepSlotRenderSizeInput {
  /** Estimated visual width of the step slot (CSS px on screen, or canvas px in PDF). */
  slotWidth: number;
  /** Estimated visual height of the step slot (CSS px on screen, or canvas px in PDF). */
  slotHeight: number;
  /** Number of step slots on the page. */
  slotCount: number;
  isFeatured?: boolean;
  isCompact?: boolean;
  /** Display devicePixelRatio (screen mode). */
  dpr?: number;
  /** Current stage page zoom factor (screen mode, 1 = fit). */
  zoom?: number;
  /** Page fit scale on the viewport at zoom = 1 (screen mode). */
  stageFitScale?: number;
  /** Target rendering mode. */
  mode?: 'screen' | 'pdf';
  /** WebGL hardware max viewport/renderbuffer edge. */
  gpuMaxDim?: number;
}

export interface MinifigDiagramRenderSizeInput {
  kind: 'exploded' | 'sequential';
  slotCount: number;
  isFeatured?: boolean;
  stageCount?: number;
  dpr?: number;
  zoom?: number;
  targetWidth?: number;
  targetHeight?: number;
  mode?: 'screen' | 'pdf';
  gpuMaxDim?: number;
}

/**
 * Clamp target pixel dimensions to a max edge and max pixel budget while
 * preserving aspect ratio and ensuring valid positive integer bounds.
 */
export function clampRenderDimensions(
  width: number,
  height: number,
  maxEdge: number,
  maxPixels: number,
  minEdge = 64,
): RenderDimensions {
  const safeMaxEdge = Math.max(minEdge, Math.floor(maxEdge || DEFAULT_SCREEN_MAX_EDGE));
  const safeMaxPixels = Math.max(minEdge * minEdge, Math.floor(maxPixels || DEFAULT_SCREEN_MAX_PIXELS));

  let w = Math.max(minEdge, Number.isFinite(width) ? width : minEdge);
  let h = Math.max(minEdge, Number.isFinite(height) ? height : minEdge);

  const longest = Math.max(w, h);
  if (longest > safeMaxEdge) {
    const s = safeMaxEdge / longest;
    w *= s;
    h *= s;
  }

  const area = w * h;
  if (area > safeMaxPixels) {
    const s = Math.sqrt(safeMaxPixels / area);
    w *= s;
    h *= s;
  }

  return {
    width: Math.max(minEdge, Math.round(w)),
    height: Math.max(minEdge, Math.round(h)),
  };
}

/**
 * Compute HiDPI + zoom-aware preview resolution multiplier for on-screen renders.
 * - Floors at 2.25× even on 1× desktop displays for ultra-crisp supersampled edges, studs & decals.
 * - Supports native 3× Retina displays (iPhone / iPad Pro).
 * - Scales smoothly when the user zooms into a page (up to 5.0× before per-slot caps).
 */
export function computePreviewResolutionScale(dpr = 1, zoom = 1): number {
  const safeDpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const baseScale = Math.min(3.25, Math.max(2.25, safeDpr * 1.15));
  const zoomBoost = safeZoom > 1.05 ? Math.min(2.25, safeZoom) : 1;
  return Math.min(5.0, Number((baseScale * zoomBoost).toFixed(3)));
}

/**
 * Compute crisp high-resolution WebGL render dimensions for a step slot,
 * matching the slot's visual aspect ratio (preventing wasted letterboxing pixels)
 * and scaling cleanly with HiDPI displays, page zoom, and print-ready PDF targets.
 */
export function computeStepSlotRenderSize(input: StepSlotRenderSizeInput): RenderDimensions {
  const mode = input.mode ?? 'screen';
  const gpuLimit = Math.max(1024, Math.floor(input.gpuMaxDim || DEFAULT_GPU_MAX_DIM));
  const slotCount = Math.max(1, input.slotCount || 1);
  const isLargeSlot = slotCount === 1 || Boolean(input.isFeatured);
  const isCompact = Boolean(input.isCompact);

  // Estimate usable model box inside the slot (subtracting top step-number/PLI strip)
  const rawW = Math.max(120, Number.isFinite(input.slotWidth) ? input.slotWidth : 640);
  const rawH = Math.max(120, Number.isFinite(input.slotHeight) ? input.slotHeight : 440);
  const visualW = mode === 'pdf' ? rawW : rawW * 0.94;
  const visualH = mode === 'pdf' ? rawH : rawH * (isLargeSlot ? 0.78 : 0.74);

  // Clamp aspect ratio to a sensible framing range so extreme slots don't distort
  const aspect = Math.max(0.72, Math.min(2.25, visualW / Math.max(1, visualH)));

  if (mode === 'pdf') {
    // Supersample 1.75x over the high-DPI PDF slot rectangle so downsampling yields print-grade AA
    const minW = isLargeSlot ? 2400 : isCompact ? 1600 : 1920;
    const targetW = Math.max(minW, Math.round(visualW * 1.75));
    const targetH = Math.round(targetW / aspect);
    const maxEdge = Math.min(DEFAULT_PDF_MAX_EDGE, gpuLimit);
    return clampRenderDimensions(targetW, targetH, maxEdge, DEFAULT_PDF_MAX_PIXELS, 240);
  }

  const dpr = Number.isFinite(input.dpr) && (input.dpr as number) > 0 ? (input.dpr as number) : 1;
  const zoom = Number.isFinite(input.zoom) && (input.zoom as number) > 0 ? (input.zoom as number) : 1;
  const fitScale = Number.isFinite(input.stageFitScale) && (input.stageFitScale as number) > 0
    ? (input.stageFitScale as number)
    : 1;

  const resScale = computePreviewResolutionScale(dpr, zoom);

  // High-resolution baseline floors (in canonical px before resScale) so even 1x desktop viewports are razor-sharp
  const baseW = isLargeSlot ? 1120 : isCompact ? 680 : 840;
  const baseH = isLargeSlot ? 780 : isCompact ? 500 : 620;

  // Displayed physical pixels on screen * 1.5 supersampling factor
  const displayOversample = Math.max(resScale, Math.min(5.0, fitScale * zoom * Math.max(1.75, dpr) * 1.5));
  const fromSlotW = visualW * displayOversample;
  const fromSlotH = visualH * displayOversample;
  const fromBaseW = baseW * resScale;
  const fromBaseH = baseH * resScale;

  // Choose the larger target while respecting the actual slot's visual aspect ratio
  const desiredArea = Math.max(fromSlotW * fromSlotH, fromBaseW * fromBaseH);
  const desiredW = Math.sqrt(desiredArea * aspect);
  const desiredH = desiredW / aspect;

  const maxEdge = Math.min(DEFAULT_SCREEN_MAX_EDGE, gpuLimit);
  return clampRenderDimensions(desiredW, desiredH, maxEdge, DEFAULT_SCREEN_MAX_PIXELS, 240);
}

/**
 * Compute crisp pixel dimensions for Minifigure Exploded & Sequential step diagrams.
 */
export function computeMinifigDiagramRenderSize(input: MinifigDiagramRenderSizeInput): RenderDimensions {
  const mode = input.mode ?? 'screen';
  const gpuLimit = Math.max(1024, Math.floor(input.gpuMaxDim || DEFAULT_GPU_MAX_DIM));
  const isLarge = input.slotCount === 1 || Boolean(input.isFeatured);

  if (mode === 'pdf') {
    const maxEdge = Math.min(DEFAULT_PDF_MAX_EDGE, gpuLimit);
    if (input.kind === 'exploded') {
      const w = Math.max(2000, Math.round((input.targetWidth || 1200) * 1.65));
      const h = Math.max(1380, Math.round((input.targetHeight || 840) * 1.65));
      return clampRenderDimensions(w, h, maxEdge, DEFAULT_PDF_MAX_PIXELS, 360);
    }
    const w = Math.max(900, Math.round((input.targetWidth || 560) * 1.65));
    const h = Math.max(1160, Math.round((input.targetHeight || 740) * 1.65));
    return clampRenderDimensions(w, h, Math.min(2400, maxEdge), 4_500_000, 240);
  }

  const resScale = Math.min(3.2, computePreviewResolutionScale(input.dpr ?? 1, input.zoom ?? 1));
  const maxEdge = Math.min(DEFAULT_SCREEN_MAX_EDGE, gpuLimit);
  if (input.kind === 'exploded') {
    const baseW = isLarge ? 1200 : 900;
    const baseH = isLarge ? 840 : 640;
    return clampRenderDimensions(baseW * resScale, baseH * resScale, maxEdge, DEFAULT_SCREEN_MAX_PIXELS, 360);
  }

  const stages = Math.max(1, input.stageCount || 3);
  const baseW = stages >= 4 ? 440 : stages === 3 ? 520 : 580;
  const baseH = stages >= 4 ? 600 : 700;
  return clampRenderDimensions(baseW * resScale, baseH * resScale, Math.min(2200, maxEdge), 3_800_000, 240);
}

/**
 * Compute print-ready PDF page canvas pixel dimensions from PDF points (72 pt/in).
 */
export function computePdfPagePixelDimensions(
  pageWpt: number,
  pageHpt: number,
  pageKind: string,
): RenderDimensions {
  const safeW = Math.max(72, Number.isFinite(pageWpt) ? pageWpt : 792);
  const safeH = Math.max(72, Number.isFinite(pageHpt) ? pageHpt : 612);
  const isHero = pageKind === 'cover' || pageKind === 'complete';
  const scale = isHero ? COVER_PDF_PT_SCALE : STEP_PDF_PT_SCALE;
  const maxEdge = isHero ? COVER_PDF_MAX_EDGE : STEP_PDF_MAX_EDGE;
  const maxPixels = isHero ? COVER_HERO_MAX_PIXELS : 9_200_000;
  return clampRenderDimensions(safeW * scale, safeH * scale, maxEdge, maxPixels, 360);
}

export interface CoverHeroRenderSizeInput {
  /** Cover hero container width (CSS px on screen, or canvas px in PDF). */
  heroWidth: number;
  /** Cover hero container height (CSS px on screen, or canvas px in PDF). */
  heroHeight: number;
  /** Display devicePixelRatio (screen mode). */
  dpr?: number;
  /** Current stage page zoom factor (screen mode, 1 = fit). */
  zoom?: number;
  /** Page fit scale on the viewport at zoom = 1 (screen mode). */
  stageFitScale?: number;
  /** Target rendering mode. */
  mode?: 'screen' | 'pdf';
  /** WebGL hardware max viewport/renderbuffer/texture edge. */
  gpuMaxDim?: number;
}

/**
 * Compute 4K-ready & print-quality WebGL render dimensions for the front cover
 * and completion hero renders.
 * - Scales dynamically to physical display pixels (stageFitScale * zoom * dpr) with
 *   1.5× supersampling to eliminate offscreen WebGL1 FBO aliasing on 4K/Retina monitors.
 * - Enforces a print-grade minimum floor (>= 2400px long edge) so even 1× monitors get
 *   razor-sharp covers, scaling up to 3840px (or the GPU's hardware max dimension).
 */
export function computeCoverHeroRenderSize(input: CoverHeroRenderSizeInput): RenderDimensions {
  const mode = input.mode ?? 'screen';
  const gpuLimit = Math.max(1024, Math.floor(input.gpuMaxDim || DEFAULT_GPU_MAX_DIM));
  const maxEdge = Math.min(COVER_HERO_MAX_EDGE, gpuLimit);

  const rawW = Math.max(120, Number.isFinite(input.heroWidth) ? input.heroWidth : 800);
  const rawH = Math.max(120, Number.isFinite(input.heroHeight) ? input.heroHeight : 600);
  const aspect = rawW / Math.max(1, rawH);

  if (mode === 'pdf') {
    const targetLong = Math.max(2800, Math.round(Math.max(rawW, rawH) * 1.35));
    const targetW = aspect >= 1 ? targetLong : Math.round(targetLong * aspect);
    const targetH = aspect >= 1 ? Math.round(targetLong / aspect) : targetLong;
    return clampRenderDimensions(targetW, targetH, maxEdge, COVER_HERO_MAX_PIXELS, 480);
  }

  const dpr = Number.isFinite(input.dpr) && (input.dpr as number) > 0 ? (input.dpr as number) : 1;
  const zoom = Number.isFinite(input.zoom) && (input.zoom as number) > 0 ? (input.zoom as number) : 1;
  const fitScale = Number.isFinite(input.stageFitScale) && (input.stageFitScale as number) > 0
    ? (input.stageFitScale as number)
    : 1;

  // Physical on-screen pixels of the cover hero * 1.5x supersampling (compensates for non-MSAA FBO)
  const physicalLong = Math.max(rawW, rawH) * fitScale * zoom * Math.max(1, dpr) * 1.5;
  // Print-grade floor: >= 2400px on 1x displays, >= 2880px on 2x+ HiDPI/4K monitors
  const floorLong = dpr >= 1.5 ? 2880 : 2400;
  const desiredLong = Math.max(floorLong, Math.round(physicalLong));

  const targetW = aspect >= 1 ? desiredLong : Math.round(desiredLong * aspect);
  const targetH = aspect >= 1 ? Math.round(desiredLong / aspect) : desiredLong;
  return clampRenderDimensions(targetW, targetH, maxEdge, COVER_HERO_MAX_PIXELS, 480);
}

/**
 * Decide whether an already-rendered step snapshot should be re-rendered at higher
 * resolution after a user zoom change (avoids churn on small nudges).
 */
export function shouldUpgradeStepRenderForZoom(
  renderedW: number,
  renderedH: number,
  targetW: number,
  targetH: number,
  thresholdRatio = 1.18,
): boolean {
  if (renderedW <= 0 || renderedH <= 0) return true;
  const ratioW = targetW / renderedW;
  const ratioH = targetH / renderedH;
  return Math.max(ratioW, ratioH) >= thresholdRatio;
}
