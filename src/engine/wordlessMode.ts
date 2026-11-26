// Wordless (LEGO-style) instruction mode helpers, iconographic SVG builders,
// and Canvas 2D vector drawing primitives shared by Live Preview, PDF Export,
// and the self-contained Interactive 3D HTML viewer.

import type { MinifigIndicatorKind } from './minifigPose';
import type { BomConfig, BomFieldId } from './partsList';
import { BOM_FIELD_META } from './partsList';

export type PageNumberFormat = 'number' | 'page_n' | 'n_of_total' | 'none';
export type RotationCueKind = 'none' | 'yaw_90_cw' | 'yaw_90_ccw' | 'yaw_180' | 'flip_vertical';
export type StepHintActionKind = 'slide_together' | 'push_axle' | 'attach_axle' | 'drop';

/** Every fresh model import defaults to LEGO-style wordless instructions. */
export const DEFAULT_WORDLESS_MODE = true;

export interface WordlessSurfaceDefaults {
  coverShowText: boolean;
  completeShowText: boolean;
  bomShowTextFields: boolean;
  pageNumberFormat: PageNumberFormat;
}

/**
 * Returns default text-visibility settings for all configurable manual surfaces
 * when initializing a fresh import or toggling Wordless mode on/off.
 */
export function getWordlessSurfaceDefaults(wordless: boolean): WordlessSurfaceDefaults {
  return wordless
    ? {
        coverShowText: false,
        completeShowText: false,
        bomShowTextFields: false,
        pageNumberFormat: 'number',
      }
    : {
        coverShowText: true,
        completeShowText: true,
        bomShowTextFields: true,
        pageNumberFormat: 'page_n',
      };
}

/**
 * Returns an effective view of `bomConfig` for rendering/pagination without mutating
 * the underlying theme's `bomConfig` (preventing accidental built-in theme forks).
 * When `showTextFields` is false, English-text fields (`name`, `color`) are suppressed
 * while visual & numeric fields (`image`, `qty`, `partId`) stay active.
 */
export function resolveEffectiveBomConfig(bomConfig: BomConfig, showTextFields: boolean): BomConfig {
  if (showTextFields) return bomConfig;
  const filtered = bomConfig.fields.map((f) =>
    f.id === 'name' || f.id === 'color' ? { ...f, enabled: false } : { ...f },
  );
  if (!filtered.some((f) => f.enabled)) {
    return {
      ...bomConfig,
      fields: filtered.map((f) =>
        f.id === 'image' || f.id === 'qty' ? { ...f, enabled: true } : f,
      ),
    };
  }
  return { ...bomConfig, fields: filtered };
}

/**
 * Resolves a Parts List table column header label.
 * In Wordless mode, language-dependent English column names become universal symbols.
 */
export function getBomTableHeaderText(fieldId: BomFieldId, wordless: boolean): string {
  if (!wordless) return BOM_FIELD_META[fieldId].tableHeader;
  switch (fieldId) {
    case 'image':
      return '';
    case 'qty':
      return '×';
    case 'partId':
      return '#';
    case 'name':
      return 'Aa';
    case 'color':
      return '●';
  }
}

/**
 * Adapts the page number format when toggling Wordless mode without clobbering
 * explicit user preferences like `'n_of_total'` or `'none'`.
 */
export function resolvePageNumberFormatForMode(
  currentFormat: string | undefined,
  wordless: boolean,
): PageNumberFormat {
  const fmt: PageNumberFormat =
    currentFormat === 'number' ||
    currentFormat === 'page_n' ||
    currentFormat === 'n_of_total' ||
    currentFormat === 'none'
      ? currentFormat
      : wordless
        ? 'number'
        : 'page_n';

  if (wordless && fmt === 'page_n') return 'number';
  if (!wordless && fmt === 'number') return 'page_n';
  return fmt;
}

/**
 * Formats a manual page number. In Wordless mode the English word "Page" is
 * never printed even if a legacy `'page_n'` format is active.
 */
export function formatManualPageNumber(
  num: number,
  total: number,
  format: string | undefined,
  wordless: boolean,
): string {
  if (format === 'none') return '';
  if (format === 'n_of_total') return `${num} / ${total}`;
  if (format === 'number' || wordless) return String(num);
  return `Page ${num}`;
}

export interface RotationCueDisplay {
  /** Text displayed next to the circular arrow medallion (empty for icon-only). */
  text: string;
  /** True when the badge renders as a pure circular icon medallion with no label pill. */
  iconOnly: boolean;
  /** Accessible title / tooltip describing the turn for screen readers & hover. */
  ariaLabel: string;
}

/**
 * Resolves the label and badge style for a camera rotation cue.
 * - Labeled mode: "Rotate 90°", "Turn 180°", "Flip Over"
 * - Wordless mode: universal degree numerals "90°" / "180°" alongside directional
 *   curved arrows for horizontal turns, and a pure icon-only medallion for vertical flips.
 */
export function getRotationCueDisplay(
  cue: RotationCueKind | string | undefined,
  wordless: boolean,
): RotationCueDisplay {
  if (cue === 'flip_vertical') {
    return {
      text: wordless ? '' : 'Flip Over',
      iconOnly: wordless,
      ariaLabel: 'Flip Over',
    };
  }
  if (cue === 'yaw_180') {
    return {
      text: wordless ? '180°' : 'Turn 180°',
      iconOnly: false,
      ariaLabel: 'Turn 180°',
    };
  }
  const aria = cue === 'yaw_90_ccw' ? 'Rotate 90° CCW' : 'Rotate 90°';
  return {
    text: wordless ? '90°' : 'Rotate 90°',
    iconOnly: false,
    ariaLabel: aria,
  };
}

/**
 * Classifies an auto-generated mechanical step hint string (from articulated joins
 * or detachable caps) into a universal visual action icon kind.
 */
export function classifyStepHintAction(hint: string | undefined | null): StepHintActionKind {
  const s = String(hint || '').toLowerCase();
  if (/slide|together/.test(s)) return 'slide_together';
  if (/push|through|rod|axle/.test(s) && !/attach/.test(s)) return 'push_axle';
  if (/attach|connect/.test(s)) return 'attach_axle';
  return 'drop';
}

/**
 * Formats a minifigure pose indicator pill's text:
 * - Labeled mode: full English phrase (e.g. "Legs 90° forward")
 * - Wordless mode: numeric angle only (e.g. "90°"), paired with a body-joint pictogram & color dot.
 */
export function formatMinifigPoseBadgeText(
  indicator: { label?: string; angleDeg?: number } | null | undefined,
  wordless: boolean,
): string {
  if (!indicator) return '';
  if (!wordless) return String(indicator.label || '');
  const deg = Math.round(Math.abs(Number(indicator.angleDeg) || 0));
  return deg > 0 ? `${deg}°` : '↻';
}

/**
 * Formats the 1:1 minifigure actual-size card header:
 * - Labeled mode: { badge: "1:1" | "1:1 · Fit", detail: "40 mm" }
 * - Wordless mode: { badge: "1:1" | "≈1:1", detail: "" } (zero words/abbreviations)
 */
export function formatMinifig1to1Header(
  heightMm: number,
  isExact: boolean,
  wordless: boolean,
): { badge: string; detail: string; canvasLabel: string } {
  if (wordless) {
    const badge = isExact ? '1:1' : '≈1:1';
    return { badge, detail: '', canvasLabel: badge };
  }
  const badge = isExact ? '1:1' : '1:1 · Fit';
  const detail = `${Math.round(heightMm)} mm`;
  return {
    badge,
    detail,
    canvasLabel: `1:1${isExact ? '' : ' Fit'} · ${detail}`,
  };
}

// =========================================================================
// SVG ICON BUILDERS (DOM Live Preview & Interactive 3D HTML)
// =========================================================================

/** Classic LEGO 2-stud brick silhouette glyph (replaces English "pcs" label). */
export function buildBrickGlyphSvg(sizePx: number): string {
  const s = Math.max(10, Math.round(sizePx));
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${s}px;height:${s}px;flex-shrink:0"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M6.5 9V6.2A1.2 1.2 0 0 1 7.7 5h2.6a1.2 1.2 0 0 1 1.2 1.2V9"/><path d="M12.5 9V6.2A1.2 1.2 0 0 1 13.7 5h2.6a1.2 1.2 0 0 1 1.2 1.2V9"/></svg>`;
}

/** Parts inventory 2×2 grid icon (replaces English "Parts List" heading). */
export function buildPartsGridIconSvg(sizePx: number): string {
  const s = Math.max(12, Math.round(sizePx));
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${s}px;height:${s}px;flex-shrink:0"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg>`;
}

/** Booklet / steps sequence icon (paired with "1–18" numeric step range). */
export function buildStepsBookletIconSvg(sizePx: number): string {
  const s = Math.max(10, Math.round(sizePx));
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${s}px;height:${s}px;flex-shrink:0"><path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H12v18H4.5A2.5 2.5 0 0 1 2 18.5Z"/><path d="M22 5.5A2.5 2.5 0 0 0 19.5 3H12v18h7.5a2.5 2.5 0 0 0 2.5-2.5Z"/></svg>`;
}

/** Official LEGO-style numbered polybag graphic for Build Stage / Bag opener pages. */
export function buildNumberedBagSvg(
  bagNumber: number,
  heightPx: number,
  accentColor: string,
  fillBg: string,
  textColor: string,
): string {
  const h = Math.max(36, Math.round(heightPx));
  const w = Math.round(h * 0.84);
  const numStr = String(bagNumber || 1);
  const fontSize = numStr.length >= 3 ? 18 : numStr.length >= 2 ? 24 : 30;
  return `<svg width="${w}" height="${h}" viewBox="0 0 64 76" fill="none" aria-hidden="true" style="width:${w}px;height:${h}px;flex-shrink:0;display:block">
    <path d="M12 4 L52 4 L56 14 L58 68 A4 4 0 0 1 54 72 L10 72 A4 4 0 0 1 6 68 L8 14 Z" fill="${fillBg}" stroke="${accentColor}" stroke-width="3.2" stroke-linejoin="round"/>
    <path d="M11 14 L53 14" stroke="${accentColor}" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="32" cy="9" r="2.2" fill="${accentColor}"/>
    <rect x="13" y="22" width="38" height="40" rx="7" fill="${accentColor}" fill-opacity="0.12"/>
    <text x="32" y="51" text-anchor="middle" font-size="${fontSize}" font-weight="900" fill="${textColor}" font-family="inherit">${numStr}</text>
  </svg>`;
}

/** Snap / connect arrow glyph for section attachment PLI badges. */
export function buildAttachArrowIconSvg(sizePx: number): string {
  const s = Math.max(11, Math.round(sizePx));
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${s}px;height:${s}px;flex-shrink:0"><path d="M5 12h11"/><path d="m12 7 5 5-5 5"/><line x1="20" y1="6" x2="20" y2="18"/></svg>`;
}

/** Circular pose / adjust curved-arrow glyph for minifigure Prepare steps. */
export function buildPoseAdjustIconSvg(sizePx: number): string {
  const s = Math.max(12, Math.round(sizePx));
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${s}px;height:${s}px;flex-shrink:0"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><polyline points="21 3 21 9 15 9"/></svg>`;
}

/** Mechanical action pictogram SVG for wordless step hints (slide, push axle, drop, attach). */
export function buildStepHintIconSvg(kind: StepHintActionKind, sizePx: number): string {
  const s = Math.max(14, Math.round(sizePx));
  let body = '';
  if (kind === 'slide_together') {
    body = `
      <rect x="2.5" y="7" width="4.5" height="10" rx="1" fill="currentColor" fill-opacity="0.22"/>
      <rect x="17" y="7" width="4.5" height="10" rx="1" fill="currentColor" fill-opacity="0.22"/>
      <path d="M8.5 12h3m-1.4-2.2L11.8 12l-1.7 2.2"/>
      <path d="M15.5 12h-3m1.4-2.2L12.2 12l1.7 2.2"/>`;
  } else if (kind === 'push_axle') {
    body = `
      <line x1="12" y1="3" x2="12" y2="17"/>
      <polyline points="8.5 13.5 12 17.5 15.5 13.5"/>
      <ellipse cx="12" cy="19.5" rx="6.5" ry="2.2"/>`;
  } else if (kind === 'attach_axle') {
    body = `
      <line x1="12" y1="21" x2="12" y2="8"/>
      <polyline points="8.5 11.5 12 7.5 15.5 11.5"/>
      <rect x="6" y="3" width="12" height="3.5" rx="1" fill="currentColor" fill-opacity="0.22"/>`;
  } else {
    // drop / place cap from above
    body = `
      <line x1="12" y1="3.5" x2="12" y2="14.5"/>
      <polyline points="8.2 11 12 15 15.8 11"/>
      <path d="M5 15.5v3.5a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-3.5"/>`;
  }
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${s}px;height:${s}px;flex-shrink:0">${body}</svg>`;
}

/** Body-joint silhouette pictogram SVG for wordless minifigure pose pills. */
export function buildMinifigPoseIconSvg(kind: MinifigIndicatorKind | string, sizePx: number): string {
  const s = Math.max(12, Math.round(sizePx));
  let body = '';
  if (kind === 'legs' || kind === 'leg_r' || kind === 'leg_l') {
    // Hinged seated-leg L-silhouette + small bend arc
    body = `
      <path d="M8 5v9h8"/>
      <path d="M12.5 7.5A5 5 0 0 1 16.5 11"/>
      <polyline points="14.2 11 16.8 11.3 16.4 8.7"/>`;
  } else if (kind === 'arm_r' || kind === 'arm_l') {
    // Pivoting shoulder + raised arm arc
    body = `
      <circle cx="8" cy="15" r="2.2"/>
      <path d="M9.6 13.6 16.5 7"/>
      <path d="M13 17a7 7 0 0 0 4.5-6"/>`;
  } else if (kind === 'head') {
    // Minifig head cylinder + curved turn arrow below
    body = `
      <rect x="8.5" y="4" width="7" height="7.5" rx="2"/>
      <line x1="10.5" y1="2.5" x2="13.5" y2="2.5"/>
      <path d="M6 16.5c2 2 10 2 12 0"/>
      <polyline points="15.5 15 18.2 16.3 16.5 18.8"/>`;
  } else {
    // Whole-figure turn / tilt
    body = `
      <circle cx="12" cy="6.5" r="2.5"/>
      <path d="M8.5 15.5 9.5 10h5l1 5.5"/>
      <path d="M5 18.5c2.5 2 11.5 2 14 0"/>
      <polyline points="16.5 16.8 19.2 18.4 17.2 20.6"/>`;
  }
  return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:${s}px;height:${s}px;flex-shrink:0">${body}</svg>`;
}

/** Vertical flip-over icon inner SVG (clean opposing flip arcs with open center, no center dash). */
export function buildFlipVerticalIconInnerSvg(): string {
  return `
    <path d="M4.5 10C5.3 5.7 8.4 3.5 12 3.5c3.4 0 6.3 2 7.2 5.6"/>
    <polyline points="16.4 7.3 19.3 9.4 21.1 6.2"/>
    <path d="M19.5 14c-.8 4.3-3.9 6.5-7.5 6.5-3.4 0-6.3-2-7.2-5.6"/>
    <polyline points="7.6 16.7 4.7 14.6 2.9 17.8"/>`;
}

/** Horizontal yaw rotation icon inner SVG (spacious opposing circular arcs with open center). */
export function buildYawRotateIconInnerSvg(ccw = false): string {
  const mirror = ccw ? ' transform="translate(24 0) scale(-1 1)"' : '';
  return `<g${mirror}>
    <path d="M19.8 10.2A8.2 8.2 0 0 0 6.1 6.3L4.4 8"/>
    <polyline points="4.4 4.2 4.4 8 8.2 8"/>
    <path d="M4.2 13.8A8.2 8.2 0 0 0 17.9 17.7L19.6 16"/>
    <polyline points="19.6 19.8 19.6 16 15.8 16"/>
  </g>`;
}

// =========================================================================
// CANVAS 2D VECTOR ICON DRAWERS (PDF / Print WYSIWYG Parity)
// =========================================================================

export function drawBrickGlyphCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Brick body
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(3, 9, 18, 11, 2) : ctx.rect(3, 9, 18, 11);
  ctx.stroke();
  // Two top studs
  ctx.strokeRect(6.5, 5, 4.5, 4);
  ctx.strokeRect(13, 5, 4.5, 4);
  ctx.restore();
}

export function drawPartsGridIconCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineJoin = 'round';
  const rects: Array<[number, number]> = [
    [3, 3],
    [13.5, 3],
    [3, 13.5],
    [13.5, 13.5],
  ];
  for (const [rx, ry] of rects) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(rx, ry, 7.5, 7.5, 1.6);
    else ctx.rect(rx, ry, 7.5, 7.5);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawStepsBookletIconCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(2.5, 3.5, 9.5, 17);
  ctx.strokeRect(12, 3.5, 9.5, 17);
  ctx.restore();
}

export function drawNumberedBagCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  height: number,
  bagNumber: number,
  accentColor: string,
  fillBg: string,
  textColor: string,
  fontString: string,
): number {
  const h = Math.max(36, height);
  const w = h * 0.84;
  ctx.save();
  ctx.translate(x, y);
  const sx = w / 64;
  const sy = h / 76;
  ctx.scale(sx, sy);

  // Polybag silhouette
  ctx.beginPath();
  ctx.moveTo(12, 4);
  ctx.lineTo(52, 4);
  ctx.lineTo(56, 14);
  ctx.lineTo(58, 68);
  ctx.quadraticCurveTo(58, 72, 54, 72);
  ctx.lineTo(10, 72);
  ctx.quadraticCurveTo(6, 72, 6, 68);
  ctx.lineTo(8, 14);
  ctx.closePath();
  ctx.fillStyle = fillBg;
  ctx.fill();
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3.2;
  ctx.lineJoin = 'round';
  ctx.stroke();

  // Top seal seam & hang hole
  ctx.beginPath();
  ctx.moveTo(11, 14);
  ctx.lineTo(53, 14);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(32, 9, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = accentColor;
  ctx.fill();

  // Soft tinted number panel
  ctx.save();
  ctx.globalAlpha = 0.13;
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(13, 22, 38, 40, 7);
  else ctx.rect(13, 22, 38, 40);
  ctx.fill();
  ctx.restore();

  // Bag numeral
  ctx.fillStyle = textColor;
  ctx.font = fontString;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(bagNumber || 1), 32, 43);
  ctx.restore();
  return w;
}

export function drawAttachArrowIconCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(4.5, 12);
  ctx.lineTo(16, 12);
  ctx.moveTo(11.5, 7);
  ctx.lineTo(16.5, 12);
  ctx.lineTo(11.5, 17);
  ctx.moveTo(20, 6);
  ctx.lineTo(20, 18);
  ctx.stroke();
  ctx.restore();
}

export function drawPoseAdjustIconCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.arc(12, 12, 8.5, -Math.PI * 0.25, Math.PI * 1.45, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(20.5, 3.5);
  ctx.lineTo(20.5, 9.5);
  ctx.lineTo(14.5, 9.5);
  ctx.stroke();
  ctx.restore();
}

export function drawStepHintIconCanvas(
  ctx: CanvasRenderingContext2D,
  kind: StepHintActionKind,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'slide_together') {
    ctx.globalAlpha = 0.22;
    ctx.fillRect(2.5, 7, 4.5, 10);
    ctx.fillRect(17, 7, 4.5, 10);
    ctx.globalAlpha = 1;
    ctx.strokeRect(2.5, 7, 4.5, 10);
    ctx.strokeRect(17, 7, 4.5, 10);
    ctx.beginPath();
    ctx.moveTo(8.5, 12);
    ctx.lineTo(11.6, 12);
    ctx.moveTo(9.9, 9.8);
    ctx.lineTo(11.8, 12);
    ctx.lineTo(9.9, 14.2);
    ctx.moveTo(15.5, 12);
    ctx.lineTo(12.4, 12);
    ctx.moveTo(14.1, 9.8);
    ctx.lineTo(12.2, 12);
    ctx.lineTo(14.1, 14.2);
    ctx.stroke();
  } else if (kind === 'push_axle') {
    ctx.beginPath();
    ctx.moveTo(12, 3);
    ctx.lineTo(12, 17);
    ctx.moveTo(8.5, 13.5);
    ctx.lineTo(12, 17.5);
    ctx.lineTo(15.5, 13.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(12, 19.5, 6.5, 2.2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'attach_axle') {
    ctx.globalAlpha = 0.22;
    ctx.fillRect(6, 3, 12, 3.5);
    ctx.globalAlpha = 1;
    ctx.strokeRect(6, 3, 12, 3.5);
    ctx.beginPath();
    ctx.moveTo(12, 21);
    ctx.lineTo(12, 8);
    ctx.moveTo(8.5, 11.5);
    ctx.lineTo(12, 7.5);
    ctx.lineTo(15.5, 11.5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(12, 3.5);
    ctx.lineTo(12, 14.5);
    ctx.moveTo(8.2, 11);
    ctx.lineTo(12, 15);
    ctx.lineTo(15.8, 11);
    ctx.moveTo(5, 15.5);
    ctx.lineTo(5, 19.5);
    ctx.lineTo(19, 19.5);
    ctx.lineTo(19, 15.5);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawMinifigPoseIconCanvas(
  ctx: CanvasRenderingContext2D,
  kind: MinifigIndicatorKind | string,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 24, size / 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'legs' || kind === 'leg_r' || kind === 'leg_l') {
    ctx.beginPath();
    ctx.moveTo(8, 5);
    ctx.lineTo(8, 14);
    ctx.lineTo(16, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(11.5, 12, 5, -Math.PI * 0.45, -Math.PI * 0.05, false);
    ctx.stroke();
  } else if (kind === 'arm_r' || kind === 'arm_l') {
    ctx.beginPath();
    ctx.arc(8, 15, 2.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(9.6, 13.6);
    ctx.lineTo(16.5, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10.5, 14, 7, -Math.PI * 0.25, Math.PI * 0.28, false);
    ctx.stroke();
  } else if (kind === 'head') {
    ctx.strokeRect(8.5, 4, 7, 7.5);
    ctx.beginPath();
    ctx.moveTo(10.5, 2.5);
    ctx.lineTo(13.5, 2.5);
    ctx.moveTo(6, 16.5);
    ctx.quadraticCurveTo(12, 19.5, 18, 16.5);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(12, 6.5, 2.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8.5, 15.5);
    ctx.lineTo(9.5, 10);
    ctx.lineTo(14.5, 10);
    ctx.lineTo(15.5, 15.5);
    ctx.moveTo(5, 18.5);
    ctx.quadraticCurveTo(12, 21.5, 19, 18.5);
    ctx.stroke();
  }
  ctx.restore();
}
