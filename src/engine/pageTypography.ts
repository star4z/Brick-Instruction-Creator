export const CANONICAL_DPI = 96;
export const MAX_CANONICAL_EDGE_PX = 1600;
export const LETTER_SHORT_SIDE_IN = 8.5;

export type PageDensity = 'compact' | 'balanced' | 'spacious';

export interface CanonicalPageMetricsInput {
  paperFormat: string;
  widthIn: number;
  heightIn: number;
  viewportW: number;
  viewportH: number;
}

export interface CanonicalPageMetrics {
  /** Physical page dimensions in inches */
  widthIn: number;
  heightIn: number;
  /** Effective pixels per physical inch in the canonical DOM page frame */
  pxPerInch: number;
  /** Canonical layout dimensions in CSS px */
  width: number;
  height: number;
  /** Viewport scale factor applied at zoom = 1 so the page fits cleanly on screen */
  fitScale: number;
  /** Visual rendered size on screen at zoom = 1 */
  displayWidth: number;
  displayHeight: number;
  isLandscape: boolean;
}

export interface PageTypographyInput {
  widthIn: number;
  heightIn: number;
  pxPerInch: number;
  density?: PageDensity | string;
  bomDensity?: PageDensity | string;
}

export interface PageTypography {
  /** Scale multiplier relative to US Letter short side (8.5 in) */
  typeScale: number;
  /** Conversion helper: typographic points -> pixels in current coordinate space */
  pt: (points: number) => number;
  /** Page outer padding and multi-step grid gap */
  pad: number;
  gap: number;
  footerH: number;
  footerFont: number;
  borderRadius: number;

  cover: {
    badgeFont: number;
    titleFont: number;
    subtitleFont: number;
    metaFont: number;
    logoSize: number;
  };
  complete: {
    titleFont: number;
    subtitleFont: number;
  };
  back: {
    logoBox: number;
    logoIcon: number;
    creditFont: number;
  };
  divider: {
    badgeFont: number;
    titleFont: number;
    metaFont: number;
    subMetaFont: number;
    customTitleFont: number;
    customNoteFont: number;
  };
  submodelPage: {
    titleFont: number;
    badgeFont: number;
  };
  bom: {
    titleFont: number;
    pageCountFont: number;
    summaryFont: number;
    headerPb: number;
    headerMb: number;
    headerH: number;
    qtyFont: number;
    nameFont: number;
    cellPadX: number;
    cellPadY: number;
    imgPad: number;
    textGap: number;
  };
  steps: {
    stepNum1Up: number;
    stepNum2Up: number;
    stepNumTight: number;
    slotPad: number;
    pliThumb: number;
    pliThumbTight: number;
    pliQtyFont: number;
    pliQtyFontTight: number;
    pliGuideFont: number;
    pliSubThumbW: number;
    pliSubThumbH: number;
    pliSubThumbWTight: number;
    pliSubThumbHTight: number;
    pliMfThumb: number;
    pliMfThumbTight: number;
    pliSubCountFont: number;
    pliSubNameFont: number;
    cueFont: number;
    calloutW: number;
    calloutWTight: number;
    calloutFont: number;
    introThumbW: number;
    introThumbH: number;
    introLabelFont: number;
    introTitleFont: number;
    introPillFont: number;
    subFinalFont: number;
    mf1to1Font: number;
    insertTextFont: number;
    insertTextMaxW: number;
    insertImgSize: number;
  };
}

export interface BomCellGeometry {
  cellW: number;
  cellH: number;
  textAreaH: number;
  imageAreaW: number;
  imageAreaH: number;
  imageHeightRatio: number;
}

const DENSITY_PAD_PT: Record<PageDensity, { padPt: number; gapPt: number }> = {
  compact: { padPt: 20, gapPt: 8 },
  balanced: { padPt: 28, gapPt: 12 },
  spacious: { padPt: 38, gapPt: 18 },
};

const BOM_CELL_TEXT_PT: Record<PageDensity, { qtyPt: number; namePt: number }> = {
  compact: { qtyPt: 8.5, namePt: 6.5 },
  balanced: { qtyPt: 9.5, namePt: 7.0 },
  spacious: { qtyPt: 10.5, namePt: 7.5 },
};

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function normalizeDensity(d?: string): PageDensity {
  if (d === 'compact' || d === 'spacious') return d;
  return 'balanced';
}

/**
 * Computes canonical physical page layout coordinates and viewport fit scale.
 *
 * Physical print formats (Letter, A4, Square, Custom) always render internally at
 * print-proportional coordinates (96 CSS px = 1 inch, capped at 1600px max edge for
 * poster-sized custom sheets) and scale smoothly to fit any viewport via CSS transform.
 * This guarantees WYSIWYG parity across mobile, tablet, desktop, and exported PDFs,
 * and prevents small screens from crushing BOM piece thumbnails under fixed-pixel text.
 */
export function computeCanonicalPageMetrics(input: CanonicalPageMetricsInput): CanonicalPageMetrics {
  const availW = Math.max(280, input.viewportW - 24);
  const availH = Math.max(300, input.viewportH - 170);

  if (input.paperFormat === 'screen') {
    const rawRatio = availW / availH;
    const clampedRatio = clamp(rawRatio, 0.62, 1.68);
    // Keep a generous canonical layout canvas (short side >= 720px) even on narrow phones
    // so multi-cell Parts List grids and multi-step pages never starve thumbnails.
    const targetShort = 740;
    const isLand = clampedRatio >= 1.0;
    const width = isLand ? Math.round(targetShort * clampedRatio) : targetShort;
    const height = isLand ? targetShort : Math.round(targetShort / clampedRatio);
    const fitScale = Math.min(availW / width, availH / height, 1.05);
    const widthIn = width / CANONICAL_DPI;
    const heightIn = height / CANONICAL_DPI;
    return {
      widthIn,
      heightIn,
      pxPerInch: CANONICAL_DPI,
      width,
      height,
      fitScale,
      displayWidth: Math.round(width * fitScale),
      displayHeight: Math.round(height * fitScale),
      isLandscape: width >= height * 1.02,
    };
  }

  const widthIn = Math.max(2, Number(input.widthIn) || 11);
  const heightIn = Math.max(2, Number(input.heightIn) || 8.5);
  const maxIn = Math.max(widthIn, heightIn);
  const pxPerInch = Math.min(CANONICAL_DPI, MAX_CANONICAL_EDGE_PX / maxIn);
  const width = Math.round(widthIn * pxPerInch);
  const height = Math.round(heightIn * pxPerInch);
  const fitScale = Math.min(availW / width, availH / height);

  return {
    widthIn,
    heightIn,
    pxPerInch,
    width,
    height,
    fitScale,
    displayWidth: Math.round(width * fitScale),
    displayHeight: Math.round(height * fitScale),
    isLandscape: widthIn >= heightIn * 1.02,
  };
}

/**
 * Computes print-calibrated typography and spacing in pixels for any target DPI.
 * Shared by both the live DOM page frame (96 DPI canonical) and the Canvas/PDF
 * exporter (~104.4 DPI) so screen preview and printed Letter/A4 output match closely.
 */
export function computePageTypography(input: PageTypographyInput): PageTypography {
  const shortSideIn = Math.min(Math.max(2, input.widthIn), Math.max(2, input.heightIn));
  const typeScale = clamp(shortSideIn / LETTER_SHORT_SIDE_IN, 0.72, 1.25);
  const pxPerPt = (input.pxPerInch / 72) * typeScale;
  const pt = (points: number) => Math.round(points * pxPerPt * 100) / 100;

  const dens = DENSITY_PAD_PT[normalizeDensity(input.density)];
  const bomDens = BOM_CELL_TEXT_PT[normalizeDensity(input.bomDensity)];

  const pad = Math.round(pt(dens.padPt));
  const gap = Math.round(pt(dens.gapPt));
  const footerFont = pt(8.5);
  const footerH = Math.round(pt(18));

  const bomTitleFont = pt(14);
  const bomHeaderPb = Math.round(pt(5));
  const bomHeaderMb = Math.round(pt(6));

  return {
    typeScale,
    pt,
    pad,
    gap,
    footerH,
    footerFont,
    borderRadius: Math.round(pt(10)),

    cover: {
      badgeFont: pt(7.5),
      titleFont: pt(23),
      subtitleFont: pt(10),
      metaFont: pt(8.5),
      logoSize: Math.round(pt(14)),
    },
    complete: {
      titleFont: pt(23),
      subtitleFont: pt(10),
    },
    back: {
      logoBox: Math.round(pt(64)),
      logoIcon: Math.round(pt(44)),
      creditFont: pt(9.5),
    },
    divider: {
      badgeFont: pt(7.5),
      titleFont: pt(20),
      metaFont: pt(8.5),
      subMetaFont: pt(8),
      customTitleFont: pt(21),
      customNoteFont: pt(9.5),
    },
    submodelPage: {
      titleFont: pt(14.5),
      badgeFont: pt(9),
    },
    bom: {
      titleFont: bomTitleFont,
      pageCountFont: pt(9),
      summaryFont: pt(8.5),
      headerPb: bomHeaderPb,
      headerMb: bomHeaderMb,
      headerH: Math.round(bomTitleFont * 1.28 + bomHeaderPb + bomHeaderMb + 2),
      qtyFont: pt(bomDens.qtyPt),
      nameFont: pt(bomDens.namePt),
      cellPadX: Math.round(pt(3)),
      cellPadY: Math.round(pt(1.5)),
      imgPad: Math.round(pt(2)),
      textGap: Math.max(1, Math.round(pt(1.2))),
    },
    steps: {
      stepNum1Up: pt(21),
      stepNum2Up: pt(17.5),
      stepNumTight: pt(15),
      slotPad: Math.round(pt(7)),
      pliThumb: Math.round(pt(25)),
      pliThumbTight: Math.round(pt(20)),
      pliQtyFont: pt(9),
      pliQtyFontTight: pt(8),
      pliGuideFont: pt(6.5),
      pliSubThumbW: Math.round(pt(36)),
      pliSubThumbH: Math.round(pt(27)),
      pliSubThumbWTight: Math.round(pt(28)),
      pliSubThumbHTight: Math.round(pt(21)),
      pliMfThumb: Math.round(pt(30)),
      pliMfThumbTight: Math.round(pt(24)),
      pliSubCountFont: pt(9),
      pliSubNameFont: pt(7.5),
      cueFont: pt(7.5),
      calloutW: Math.round(pt(115)),
      calloutWTight: Math.round(pt(92)),
      calloutFont: pt(8),
      introThumbW: Math.round(pt(58)),
      introThumbH: Math.round(pt(40)),
      introLabelFont: pt(7),
      introTitleFont: pt(11.5),
      introPillFont: pt(10),
      subFinalFont: pt(12.5),
      mf1to1Font: pt(7.5),
      insertTextFont: pt(9.5),
      insertTextMaxW: Math.round(pt(180)),
      insertImgSize: Math.round(pt(76)),
    },
  };
}

/**
 * Estimates per-cell BOM geometry so both DOM layout and PDF export reserve
 * generous vertical space for piece thumbnails across all grid densities.
 */
export function estimateBomCellGeometry(params: {
  pageWidth: number;
  pageHeight: number;
  cols: number;
  rows: number;
  showNames: boolean;
  typo: PageTypography;
}): BomCellGeometry {
  const { pageWidth, pageHeight, cols, rows, showNames, typo } = params;
  const gridW = Math.max(60, pageWidth - typo.pad * 2);
  const gridH = Math.max(60, pageHeight - typo.pad * 2 - typo.footerH - typo.bom.headerH);
  const cellW = gridW / Math.max(1, cols);
  const cellH = gridH / Math.max(1, rows);
  const qtyLineH = typo.bom.qtyFont * 1.18;
  const nameLineH = showNames ? typo.bom.nameFont * 1.22 + typo.bom.textGap : 0;
  const textAreaH = qtyLineH + nameLineH + typo.bom.textGap;
  const imageAreaW = Math.max(12, cellW - typo.bom.cellPadX * 2 - typo.bom.imgPad * 2);
  const imageAreaH = Math.max(12, cellH - typo.bom.cellPadY * 2 - textAreaH - typo.bom.imgPad * 2);
  return {
    cellW,
    cellH,
    textAreaH,
    imageAreaW,
    imageAreaH,
    imageHeightRatio: imageAreaH / Math.max(1, cellH),
  };
}
