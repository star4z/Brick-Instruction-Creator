// Front cover metadata, editorial LEGO-style layout geometry, and camera-space framing helpers.

export const PROGRAM_NAME = 'Brick Instruction Creator';
export const PROGRAM_URL = 'https://star4z.github.io/Brick-Instruction-Creator/';

export interface CoverMeta {
  title: string;
  subtitle: string;
  az: number;
  el: number;
  zoom: number;
  bgSrc: string | null;
  creatorLogoSrc: string | null;
  themeImageSrc: string | null;
  showQrCode: boolean;
  showProgramBadge: boolean;
}

export interface RectBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CoverLayoutMetrics {
  pad: number;
  topLeftMaxW: number;
  creatorLogoMaxW: number;
  creatorLogoMaxH: number;
  creatorLogoGap: number;
  titleFontPx: number;
  titleLineHeightPx: number;
  subtitleFontPx: number;
  subtitleGap: number;
  topRightMaxW: number;
  topRightMaxH: number;
  heroRect: RectBox;
  /** Exact bounding box of the clickable bottom-right attribution + QR group. */
  brandGroupRect: RectBox;
  brandCardRect: RectBox;
  brandIconSize: number;
  brandTitleFontPx: number;
  brandGap: number;
  qrCardRect: RectBox | null;
  qrInnerInset: number;
  cardRadius: number;
}

export function createDefaultCoverMeta(): CoverMeta {
  return {
    title: '',
    subtitle: '',
    az: 34,
    el: 18,
    zoom: 1.0,
    bgSrc: null,
    creatorLogoSrc: null,
    themeImageSrc: null,
    showQrCode: true,
    showProgramBadge: true,
  };
}

export function clampCoverElevation(el: number): number {
  if (!Number.isFinite(el)) return 18;
  return Math.max(4, Math.min(60, Math.round(el)));
}

export function clampCoverZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return 1.0;
  return Math.max(0.7, Math.min(1.4, Math.round(zoom * 100) / 100));
}

export function normalizeCoverMeta(raw: unknown): CoverMeta {
  const def = createDefaultCoverMeta();
  if (!raw || typeof raw !== 'object') return def;
  const r = raw as Record<string, unknown>;
  return {
    title: typeof r.title === 'string' ? r.title : def.title,
    subtitle: typeof r.subtitle === 'string' ? r.subtitle : def.subtitle,
    az: typeof r.az === 'number' && Number.isFinite(r.az) ? ((r.az % 360) + 360) % 360 : def.az,
    el: typeof r.el === 'number' ? clampCoverElevation(r.el) : def.el,
    zoom: typeof r.zoom === 'number' ? clampCoverZoom(r.zoom) : def.zoom,
    bgSrc: typeof r.bgSrc === 'string' && r.bgSrc.length > 0 ? r.bgSrc : null,
    creatorLogoSrc: typeof r.creatorLogoSrc === 'string' && r.creatorLogoSrc.length > 0 ? r.creatorLogoSrc : null,
    themeImageSrc: typeof r.themeImageSrc === 'string' && r.themeImageSrc.length > 0 ? r.themeImageSrc : null,
    showQrCode: typeof r.showQrCode === 'boolean' ? r.showQrCode : def.showQrCode,
    showProgramBadge: typeof r.showProgramBadge === 'boolean' ? r.showProgramBadge : def.showProgramBadge,
  };
}

export interface CoverLayoutInput {
  pageW: number;
  pageH: number;
  hasCreatorLogo: boolean;
  hasSubtitle: boolean;
  hasThemeImage: boolean;
  showQrCode: boolean;
  showProgramBadge: boolean;
  densityPadFactor?: number;
}

/**
 * Computes deterministic, aspect-adaptive cover layout metrics shared by both the live DOM preview
 * and the PDF 2D canvas exporter so visual composition and clickable PDF annotations align 1:1.
 */
export function computeCoverLayout(input: CoverLayoutInput): CoverLayoutMetrics {
  const { pageW, pageH } = input;
  const shortSide = Math.min(pageW, pageH);
  const densityScale = input.densityPadFactor ?? 1.0;
  const pad = Math.round(Math.max(12, shortSide * 0.048 * densityScale));

  const innerW = Math.max(80, pageW - pad * 2);
  const topLeftMaxW = Math.round(innerW * (input.hasThemeImage ? 0.48 : 0.64));
  const creatorLogoMaxW = Math.round(Math.min(pageW * 0.22, topLeftMaxW * 0.58));
  const creatorLogoMaxH = Math.round(shortSide * 0.10);
  const creatorLogoGap = Math.round(shortSide * 0.014);

  const titleFontPx = Math.round(
    Math.max(14, shortSide * (input.hasCreatorLogo ? 0.042 : 0.05)),
  );
  const titleLineHeightPx = Math.round(titleFontPx * 1.12);
  const subtitleFontPx = Math.round(Math.max(9.5, shortSide * 0.021));
  const subtitleGap = Math.round(shortSide * 0.007);

  const topRightMaxW = Math.round(innerW * 0.44);
  const topRightMaxH = Math.round(shortSide * 0.112);

  // Bottom-right program badge + optional QR code (proportioned like official LEGO Builder badge)
  const badgeH = Math.round(Math.max(32, shortSide * 0.098));
  const cardRadius = Math.round(badgeH * 0.18);
  const qrSize = badgeH;
  const qrInnerInset = Math.max(2, Math.round(qrSize * 0.06));
  const brandGap = Math.round(badgeH * 0.16);
  const brandIconSize = Math.round(badgeH * 0.56);
  const brandTitleFontPx = Math.round(Math.max(7.5, badgeH * 0.185));

  // Cross-platform safe width for the program badge card (icon + stacked "Brick Instruction / Creator")
  const brandCardW = Math.round(brandIconSize + badgeH * 2.05);
  const showBadge = input.showProgramBadge !== false;
  const showQr = input.showQrCode !== false && showBadge;

  const totalBrandW = showBadge
    ? (showQr ? brandCardW + brandGap + qrSize : brandCardW)
    : 0;
  const brandGroupX = pageW - pad - totalBrandW;
  const brandGroupY = pageH - pad - badgeH;

  const brandGroupRect: RectBox = {
    x: brandGroupX,
    y: brandGroupY,
    w: totalBrandW,
    h: showBadge ? badgeH : 0,
  };
  const brandCardRect: RectBox = {
    x: brandGroupX,
    y: brandGroupY,
    w: showBadge ? brandCardW : 0,
    h: showBadge ? badgeH : 0,
  };
  const qrCardRect: RectBox | null = showQr
    ? {
        x: pageW - pad - qrSize,
        y: brandGroupY,
        w: qrSize,
        h: qrSize,
      }
    : null;

  // Hero 3D model render zone: page-filling edge-to-edge width with clean clearance
  // below top branding/title and above bottom-right program badge + QR code
  const heroInsetX = Math.round(pageW * 0.026);
  const heroTopRatio = input.hasCreatorLogo
    ? (input.hasSubtitle ? 0.22 : 0.195)
    : input.hasThemeImage
      ? (input.hasSubtitle ? 0.175 : 0.16)
      : (input.hasSubtitle ? 0.155 : 0.13);
  const heroTop = Math.round(pageH * heroTopRatio);
  const heroBottomMargin = Math.round(pageH * (showBadge ? 0.125 : 0.045));
  const heroRect: RectBox = {
    x: heroInsetX,
    y: heroTop,
    w: Math.max(60, pageW - heroInsetX * 2),
    h: Math.max(60, pageH - heroTop - heroBottomMargin),
  };

  return {
    pad,
    topLeftMaxW,
    creatorLogoMaxW,
    creatorLogoMaxH,
    creatorLogoGap,
    titleFontPx,
    titleLineHeightPx,
    subtitleFontPx,
    subtitleGap,
    topRightMaxW,
    topRightMaxH,
    heroRect,
    brandGroupRect,
    brandCardRect,
    brandIconSize,
    brandTitleFontPx,
    brandGap,
    qrCardRect,
    qrInnerInset,
    cardRadius,
  };
}

export interface CameraBasis {
  right: [number, number, number];
  up: [number, number, number];
  forward: [number, number, number];
}

export interface TightOrthoBounds {
  centerX: number;
  centerY: number;
  halfW: number;
  halfH: number;
  minZ: number;
  maxZ: number;
}

/**
 * Builds orthonormal camera basis vectors for a given azimuth & elevation looking at the origin.
 */
export function computeCameraBasis(azDeg: number, elDeg: number): CameraBasis {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  // Direction from target to eye
  const fx = Math.sin(az) * Math.cos(el);
  const fy = Math.sin(el);
  const fz = Math.cos(az) * Math.cos(el);
  // right = normalize(worldUp × forward) where worldUp = (0, 1, 0)
  let rx = fz;
  let ry = 0;
  let rz = -fx;
  const rLen = Math.hypot(rx, ry, rz) || 1;
  rx /= rLen;
  rz /= rLen;
  // up = forward × right
  const ux = fy * rz - fz * ry;
  const uy = fz * rx - fx * rz;
  const uz = fx * ry - fy * rx;
  return {
    right: [rx, ry, rz],
    up: [ux, uy, uz],
    forward: [fx, fy, fz],
  };
}

/**
 * Projects mesh triangle vertices onto the camera's right/up/forward axes to compute a tight
 * orthographic frustum that makes models of ANY aspect ratio (long ships, tall towers, compact cars)
 * truly fill the cover frame cleanly without bounding-sphere dead space.
 */
export function computeTightCameraBounds(
  triPos: Float32Array,
  origin: [number, number, number],
  azDeg: number,
  elDeg: number,
  canvasW: number,
  canvasH: number,
  zoom = 1.0,
  marginFactor = 1.06,
): TightOrthoBounds | null {
  if (!triPos || triPos.length < 9) return null;
  const { right, up, forward } = computeCameraBasis(azDeg, elDeg);
  const [ox, oy, oz] = origin;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < triPos.length; i += 3) {
    const dx = triPos[i] - ox;
    const dy = triPos[i + 1] - oy;
    const dz = triPos[i + 2] - oz;
    const px = dx * right[0] + dy * right[1] + dz * right[2];
    const py = dx * up[0] + dy * up[1] + dz * up[2];
    const pz = dx * forward[0] + dy * forward[1] + dz * forward[2];
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
    if (pz < minZ) minZ = pz;
    if (pz > maxZ) maxZ = pz;
  }

  if (!Number.isFinite(minX)) return null;

  const spanX = Math.max(12, maxX - minX);
  const spanY = Math.max(12, maxY - minY);
  const aspect = Math.max(0.1, canvasW / Math.max(1, canvasH));
  const safeZoom = Math.max(0.4, zoom);

  let halfH = ((spanY * 0.5) * marginFactor) / safeZoom;
  let halfW = halfH * aspect;
  const reqHalfW = ((spanX * 0.5) * marginFactor) / safeZoom;
  if (reqHalfW > halfW) {
    halfW = reqHalfW;
    halfH = halfW / aspect;
  }

  return {
    centerX: (minX + maxX) * 0.5,
    centerY: (minY + maxY) * 0.5,
    halfW,
    halfH,
    minZ,
    maxZ,
  };
}
