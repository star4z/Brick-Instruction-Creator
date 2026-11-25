/**
 * Self-Contained Interactive 3D HTML Instruction Viewer Exporter
 *
 * Generates a single offline-capable .html file (zero external CDN scripts)
 * modeled after interactive 3D brick builder apps:
 * - Free 360° orbit rotation, 2-finger/wheel zoom, and pan on EVERY 3D page
 * - Includes all manual pages (Cover, Section Dividers, Submodels, Build Steps,
 *   Divider Pages, Build Complete, Parts List, and Back Cover) — making even
 *   editorial pages like Cover and Build Complete rotatable in 3D!
 * - Deduplicated GPU-cached part geometry + embedded decal textures
 * - Full static HTML+CSS fallback (#noJsFallback) rendered by default so viewers
 *   that disable JavaScript (such as iOS Quick Look in Files/Mail/AirDrop) still
 *   display the complete illustrated manual instead of a blank screen, with a clear
 *   prompt to open in a browser for interactive 3D controls.
 * - Direct link back to Brick Instruction Creator
 */

export const DEFAULT_EDITOR_URL = 'https://star4z.github.io/Brick-Instruction-Creator/';
export const TOOL_DISPLAY_NAME = 'Brick Instruction Creator';

export interface NavigatorLike {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}

export interface IosHtmlExportWarningSpec {
  tone: 'warning';
  title: string;
  message: string;
  detail: string;
  confirmLabel: string;
  cancelLabel: string;
}

/**
 * Returns true on iPhone, iPad, iPod, and iPadOS 13+ desktop-mode Safari
 * (`platform === 'MacIntel'` with multi-touch).
 */
export function isIosDevice(
  nav: NavigatorLike | null | undefined = typeof navigator !== 'undefined' ? navigator : undefined,
): boolean {
  if (!nav) return false;
  const ua = nav.userAgent || '';
  if (/iPad|iPhone|iPod/i.test(ua)) return true;
  if (nav.platform === 'MacIntel' && (nav.maxTouchPoints || 0) > 1) return true;
  return false;
}

/**
 * Builds the warning dialog spec shown on iOS/iPadOS when the user selects
 * Interactive HTML Export. Returns `null` on non-iOS platforms.
 */
export function getIosHtmlExportWarningDialog(
  nav?: NavigatorLike | null,
): IosHtmlExportWarningSpec | null {
  if (!isIosDevice(nav)) return null;
  return {
    tone: 'warning',
    title: 'Not Viewable on iOS',
    message:
      'Interactive 3D HTML files cannot be viewed directly on iOS or iPadOS (Files, Mail, Messages, and Safari block scripts in local HTML files).',
    detail:
      'You can still export the file to share or open on a Mac, Windows PC, or Android device — or export a PDF to view on iOS.',
    confirmLabel: 'Export Anyway',
    cancelLabel: 'Cancel',
  };
}

export interface InteractiveTexDraw {
  k: string;   // texture key in payload.textures
  tp: string;  // base64 Float32Array positions
  tn: string;  // base64 Float32Array normals
  uv: string;  // base64 Float32Array uvs
  tc: string;  // base64 Uint8Array RGBA
}

export interface InteractivePartPrototype {
  tp: string;  // base64 Float32Array tri positions
  tn: string;  // base64 Float32Array tri normals
  tc: string;  // base64 Uint8Array tri RGBA
  oc: number;  // opaque vertex count
  xc: number;  // transparent vertex count
  lp: string;  // base64 Float32Array line positions
  lc: string;  // base64 Uint8Array line RGBA
  td?: InteractiveTexDraw[];
  b: [number, number, number, number, number, number]; // local AABB [minX,minY,minZ,maxX,maxY,maxZ]
}

export interface InteractivePartPlacement {
  k: number;   // index into payload.prototypes
  x: number;
  y: number;
  z: number;
  m?: number[]; // 9-float 3x3 rotation matrix (omitted when identity)
}

export interface InteractivePliEntry {
  partId: string;
  name: string;
  qty: number;
  thumb: string;
  colorName?: string;
  colorHex?: string;
}

export interface InteractiveSceneSpec {
  prevPartIdx: number[];
  newPartIdx: number[];
  az: number;
  el: number;
  zoom: number;
  hero?: boolean;
}

export interface InteractiveStepScene extends InteractiveSceneSpec {
  stepId: string;
  stepNum: number;
  label: string;
  rotationCue?: string;
  rotationCueKind?: 'none' | 'yaw_90_cw' | 'yaw_90_ccw' | 'yaw_180' | 'flip_vertical';
  pli: InteractivePliEntry[];
  subLabel?: string;
  previewUrl?: string; // Static preview fallback image for JS-disabled viewers (e.g., iOS Quick Look)
}

export interface InteractiveViewerPage {
  id: string;
  kind: 'cover' | 'section_divider' | 'submodel_page' | 'steps' | 'divider' | 'complete' | 'bom' | 'back';
  num: number;
  label: string;
  chapterName?: string;
  title?: string;
  subtitle?: string;
  note?: string;
  badge?: string;
  bagNumber?: number;
  previewUrl?: string; // Static preview fallback image for JS-disabled viewers (e.g., iOS Quick Look)
  scene?: InteractiveSceneSpec;
  steps?: InteractiveStepScene[];
  bomItems?: InteractivePliEntry[];
  bomFormat?: 'grid' | 'table';
  bomFields?: Array<'image' | 'qty' | 'name' | 'partId' | 'color'>;
}

export interface InteractiveViewerTheme {
  bg: string;
  bgEnd?: string;
  bgType?: 'solid' | 'gradient';
  bgAngle?: number;
  text: string;
  muted: string;
  accent: string;
  pliBg: string;
  pliBorder: string;
  calloutBg: string;
  calloutBorder: string;
  /** CSS font stack for headings, step numbers & counts (theme heading font). */
  headingFont?: string;
  /** CSS font stack for body text & labels (theme body font). */
  bodyFont?: string;
  /** Optional embedded custom uploaded font faces referenced by this theme. */
  customFontFaces?: Array<{
    family: string;
    format: 'woff2' | 'woff' | 'truetype' | 'opentype';
    dataUrl: string;
  }>;
  isDark: boolean;
}

const DEFAULT_VIEWER_FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const SAFE_EMBED_FONT_FAMILY_RE = /^BIW User uf_[a-zA-Z0-9_-]{3,48}$/;
const SAFE_EMBED_FONT_DATA_URL_RE =
  /^data:(?:font\/(?:woff2|woff|ttf|otf)|application\/(?:font-woff2?|x-font-(?:ttf|otf|woff)|octet-stream));base64,[A-Za-z0-9+/=]+$/;

/**
 * Restricts a CSS font-family stack to safe characters so it can be embedded
 * in an inline `<style>` block without breaking out of the declaration.
 */
export function sanitizeFontStack(value: unknown, fallback = DEFAULT_VIEWER_FONT_STACK): string {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.replace(/[^A-Za-z0-9 ,"'_-]/g, '').trim().slice(0, 300);
  return cleaned || fallback;
}

function buildCustomFontFacesCss(
  faces: InteractiveViewerTheme['customFontFaces'],
): string {
  if (!Array.isArray(faces) || faces.length === 0) return '';
  const rules: string[] = [];
  for (const f of faces) {
    if (!f || typeof f !== 'object') continue;
    if (!SAFE_EMBED_FONT_FAMILY_RE.test(f.family)) continue;
    if (f.format !== 'woff2' && f.format !== 'woff' && f.format !== 'truetype' && f.format !== 'opentype') continue;
    if (!SAFE_EMBED_FONT_DATA_URL_RE.test(f.dataUrl)) continue;
    rules.push(
      `  @font-face { font-family: "${f.family}"; font-style: normal; font-weight: 100 900; font-display: swap; src: url("${f.dataUrl}") format("${f.format}"); }`,
    );
  }
  return rules.length > 0 ? `${rules.join('\n')}\n` : '';
}

export interface InteractiveHtmlPayload {
  version: 1;
  title: string;
  subtitle?: string;
  author?: string;
  editorUrl: string;
  totalPieces: number;
  totalSteps: number;
  /** When true, renders LEGO-style wordless iconography and numeric UI chrome. */
  wordless?: boolean;
  theme: InteractiveViewerTheme;
  highlightNew: boolean;
  highlightColor: string;
  fadePrev: boolean;
  fadeOpacity: number;
  /** When true, renders instruction steps with flat unlit colors (no lighting or specular shading). */
  unlit?: boolean;
  prototypes: InteractivePartPrototype[];
  textures: Record<string, string>;
  parts: InteractivePartPlacement[];
  pages: InteractiveViewerPage[];
}

/**
 * Encodes a TypedArray (Float32Array or Uint8Array) to compact base64.
 */
export function encodeTypedArrayBase64(arr: Float32Array | Uint8Array): string {
  const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
  if (bytes.length === 0) return '';
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    const slice = bytes.subarray(i, Math.min(i + chunk, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

/**
 * Safely escapes HTML entities in text strings.
 */
export function escapeHtmlText(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Safely serializes JSON for embedding inside an inline <script> tag
 * without allowing premature </script> termination.
 */
export function serializeJsonForScriptTag(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Generates a slugified download filename for the interactive viewer HTML.
 */
export function buildInteractiveHtmlFilename(title: string): string {
  const slug =
    String(title || 'manual')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'manual';
  return `${slug}-interactive-3d.html`;
}

/**
 * Builds the static, zero-JavaScript HTML manual view rendered by default.
 * In browsers with JS + WebGL, this view is hidden immediately on boot;
 * in iOS Quick Look (Files / Mail / AirDrop) or JS-disabled viewers, users see
 * the complete illustrated manual instead of an empty screen.
 */
function buildStaticFallbackHtml(payload: InteractiveHtmlPayload, safeEditorUrl: string): string {
  const wordless = Boolean(payload.wordless);
  const pgLabel = (n: number) => (wordless ? String(n) : `Page ${n}`);
  const rotSvg = (kind?: string) => {
    if (kind === 'flip_vertical') {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="10.2" width="8" height="3.6" rx="0.9" fill="currentColor" stroke="none"/><path d="M5.5 9.5C6.2 5.6 8.9 3.6 12 3.6c3.2 0 5.9 2.1 6.6 5.9"/><polyline points="16 7.5 18.8 10 21 7.2"/><path d="M18.5 14.5c-.7 3.9-3.4 5.9-6.5 5.9-3.2 0-5.9-2.1-6.6-5.9"/><polyline points="8 16.5 5.2 14 3 16.8"/></svg>';
    }
    const mirror = kind === 'yaw_90_ccw' ? ' transform="translate(24 0) scale(-1 1)"' : '';
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g${mirror}><path d="M20.5 11.5A8.5 8.5 0 0 0 6.2 5.4L4 7.6"/><polyline points="4 3.5 4 7.6 8.1 7.6"/><path d="M3.5 12.5A8.5 8.5 0 0 0 17.8 18.6L20 16.4"/><polyline points="20 20.5 20 16.4 15.9 16.4"/></g></svg>`;
  };
  const partsIconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg>';
  const brickIconSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M6.5 9V6.2A1.2 1.2 0 0 1 7.7 5h2.6a1.2 1.2 0 0 1 1.2 1.2V9"/><path d="M12.5 9V6.2A1.2 1.2 0 0 1 13.7 5h2.6a1.2 1.2 0 0 1 1.2 1.2V9"/></svg>';
  const cards: string[] = [];

  for (const pg of payload.pages) {
    if (pg.kind === 'steps' && pg.steps && pg.steps.length > 0) {
      for (const st of pg.steps) {
        const pliHtml =
          st.pli && st.pli.length > 0
            ? `<div class="sf-pli">${st.pli
                .map(
                  (p) =>
                    `<div class="sf-pli-item">${
                      p.thumb ? `<img src="${p.thumb}" alt="${escapeHtmlText(p.name)}" />` : ''
                    }<div><strong>${p.qty}×</strong>${wordless ? '' : `<span>${escapeHtmlText(p.partId.toUpperCase())}</span>`}</div></div>`,
                )
                .join('')}</div>`
            : '';
        const showRot = Boolean(st.rotationCue || (st.rotationCueKind && st.rotationCueKind !== 'none'));
        cards.push(`
          <section class="sf-card">
            <div class="sf-card-head">
              <div class="sf-step-num">${st.stepNum}</div>
              <div class="sf-meta">
                ${wordless ? '' : `<div class="sf-ch">${escapeHtmlText(pg.chapterName || st.label)}</div>`}
                ${st.subLabel ? `<div class="sf-sub">${escapeHtmlText(st.subLabel)}</div>` : ''}
                ${showRot ? `<span class="sf-badge sf-rot-badge">${rotSvg(st.rotationCueKind)}${st.rotationCue ? `<span>${escapeHtmlText(st.rotationCue)}</span>` : ''}</span>` : ''}
              </div>
              <span class="sf-pg-num">${pgLabel(pg.num)}</span>
            </div>
            ${pliHtml}
            ${
              st.previewUrl
                ? `<img class="sf-img" src="${st.previewUrl}" alt="${wordless ? String(st.stepNum) : `Step ${st.stepNum}`}" />`
                : ''
            }
          </section>`);
      }
    } else if (pg.kind === 'bom' && pg.bomItems && pg.bomItems.length > 0) {
      const fields = (pg.bomFields && pg.bomFields.length > 0)
        ? pg.bomFields
        : (wordless ? (['image', 'qty', 'partId'] as const) : (['image', 'qty', 'name', 'partId'] as const));
      const colHeaders: Record<string, string> = wordless
        ? {
            image: brickIconSvg,
            qty: '×',
            name: 'Aa',
            partId: '#',
            color: '●',
          }
        : {
            image: 'Part',
            qty: 'Qty',
            name: 'Part Name',
            partId: 'Part ID',
            color: 'Color',
          };
      const renderColorChip = (b: InteractivePliEntry) => {
        const sw = b.colorHex
          ? `<span class="bom-swatch" style="background:${escapeHtmlText(b.colorHex)}"></span>`
          : '';
        return `<span class="bom-color-cell">${sw}<span>${escapeHtmlText(b.colorName || '')}</span></span>`;
      };
      const bodyHtml = pg.bomFormat === 'table'
        ? `<table class="sf-bom-table"><thead><tr>${fields
            .map((f) => `<th class="col-${f}">${wordless && f === 'image' ? colHeaders[f] : escapeHtmlText(colHeaders[f] || f)}</th>`)
            .join('')}</tr></thead><tbody>${pg.bomItems
            .map(
              (b) =>
                `<tr>${fields
                  .map((f) => {
                    if (f === 'image') return `<td class="col-image">${b.thumb ? `<img src="${b.thumb}" alt="${escapeHtmlText(b.name)}" />` : ''}</td>`;
                    if (f === 'qty') return `<td class="col-qty"><strong>${b.qty}×</strong></td>`;
                    if (f === 'name') return `<td class="col-name">${escapeHtmlText(b.name)}</td>`;
                    if (f === 'partId') return `<td class="col-partId"><code>${escapeHtmlText(b.partId)}</code></td>`;
                    return `<td class="col-color">${renderColorChip(b)}</td>`;
                  })
                  .join('')}</tr>`,
            )
            .join('')}</tbody></table>`
        : `<div class="sf-bom-grid">${pg.bomItems
            .map(
              (b) =>
                `<div class="sf-bom-item">${fields
                  .map((f) => {
                    if (f === 'image') return b.thumb ? `<img src="${b.thumb}" alt="${escapeHtmlText(b.name)}" />` : '';
                    if (f === 'qty') return `<strong>${b.qty}×</strong>`;
                    if (f === 'name') return `<span>${escapeHtmlText(b.name)}</span>`;
                    if (f === 'partId') return `<small class="bom-mono">${escapeHtmlText(b.partId)}</small>`;
                    return `<small>${renderColorChip(b)}</small>`;
                  })
                  .join('')}</div>`,
            )
            .join('')}</div>`;
      const bomTitleHtml = wordless
        ? `<h2 class="sf-h2" style="display:inline-flex;align-items:center;gap:8px">${partsIconSvg}${pg.title ? `<span>${escapeHtmlText(pg.title)}</span>` : ''}</h2>`
        : `<h2 class="sf-h2">${escapeHtmlText(pg.title || 'Parts List')}</h2>`;
      cards.push(`
        <section class="sf-card">
          <div class="sf-card-head">
            <div class="sf-meta">${bomTitleHtml}</div>
            <span class="sf-pg-num">${pgLabel(pg.num)}</span>
          </div>
          ${bodyHtml}
        </section>`);
    } else {
      const headingText = pg.title !== undefined ? pg.title : (wordless ? '' : pg.label);
      const bagSvgHtml =
        wordless && pg.kind === 'section_divider' && pg.bagNumber
          ? `<svg width="42" height="50" viewBox="0 0 64 76" fill="none" aria-hidden="true" style="display:block;margin-bottom:4px"><path d="M12 4 L52 4 L56 14 L58 68 A4 4 0 0 1 54 72 L10 72 A4 4 0 0 1 6 68 L8 14 Z" fill="var(--pli-bg)" stroke="var(--accent)" stroke-width="3.2" stroke-linejoin="round"/><path d="M11 14 L53 14" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="9" r="2.2" fill="var(--accent)"/><text x="32" y="51" text-anchor="middle" font-size="${String(pg.bagNumber).length >= 2 ? 24 : 30}" font-weight="900" fill="var(--text)" font-family="inherit">${escapeHtmlText(String(pg.bagNumber))}</text></svg>`
          : '';
      cards.push(`
        <section class="sf-card sf-hero-card">
          <div class="sf-card-head">
            <div class="sf-meta">
              ${bagSvgHtml}
              ${pg.badge ? `<span class="sf-badge">${escapeHtmlText(pg.badge)}</span>` : ''}
              ${headingText ? `<h2 class="sf-h2">${escapeHtmlText(headingText)}</h2>` : ''}
              ${pg.subtitle ? `<p class="sf-desc">${escapeHtmlText(pg.subtitle)}</p>` : ''}
              ${pg.note ? `<p class="sf-desc">${escapeHtmlText(pg.note)}</p>` : ''}
            </div>
            <span class="sf-pg-num">${pgLabel(pg.num)}</span>
          </div>
          ${
            pg.previewUrl
              ? `<img class="sf-img" src="${pg.previewUrl}" alt="${escapeHtmlText(headingText || String(pg.num))}" />`
              : ''
          }
          ${
            pg.kind === 'back'
              ? `<div style="margin-top:14px;text-align:center"><a class="sf-link-btn" href="${safeEditorUrl}" target="_blank" rel="noopener noreferrer">${wordless ? '↗' : `Open in ${TOOL_DISPLAY_NAME} ↗`}</a></div>`
              : ''
          }
        </section>`);
    }
  }

  return `
  <div id="noJsFallback" class="sf-root">
    <header class="sf-topbar">
      <div class="sf-brand">
        ${wordless
          ? `<span style="display:inline-flex;align-items:center;gap:6px">${brickIconSvg}<strong>${payload.totalPieces}</strong></span>`
          : `<h1>${escapeHtmlText(payload.title || TOOL_DISPLAY_NAME)}</h1><span>${payload.totalPieces} pieces · ${payload.totalSteps} steps</span>`}
      </div>
      <a class="sf-link-btn" href="${safeEditorUrl}" target="_blank" rel="noopener noreferrer">${wordless ? '↗' : `${TOOL_DISPLAY_NAME} ↗`}</a>
    </header>
    ${wordless ? '' : `<div class="sf-notice">
      <strong>Static Preview Mode</strong> — Interactive 3D rotation &amp; zoom require JavaScript (iOS Quick Look disables scripts in local HTML previews). Open this file in a web browser for full interactive 3D viewing.
    </div>`}
    <main class="sf-pages">
      ${cards.join('')}
    </main>
  </div>`;
}

/**
 * Generates the complete, self-contained, zero-dependency Interactive 3D HTML file.
 */
export function generateInteractiveHtmlDocument(payload: InteractiveHtmlPayload): string {
  const wordless = Boolean(payload.wordless);
  const safeTitle = escapeHtmlText(payload.title || TOOL_DISPLAY_NAME);
  const safeEditorUrl = escapeHtmlText(payload.editorUrl || DEFAULT_EDITOR_URL);
  const t = payload.theme;
  const pageBgCss =
    t.bgType === 'gradient' && t.bgEnd
      ? `linear-gradient(${t.bgAngle ?? 180}deg, ${t.bg}, ${t.bgEnd})`
      : t.bg;
  const bodyFontStack = sanitizeFontStack(t.bodyFont);
  const headingFontStack = sanitizeFontStack(t.headingFont, bodyFontStack);
  const customFontFacesCss = buildCustomFontFacesCss(t.customFontFaces);
  const glassBg = t.isDark ? 'rgba(22, 26, 34, 0.86)' : 'rgba(255, 255, 255, 0.88)';
  const glassBorder = t.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.12)';
  const staticFallbackHtml = buildStaticFallbackHtml(payload, safeEditorUrl);

  // Strip static fallback preview URLs and embedded font binaries from the JS 3D payload to avoid duplicating bytes in RAM
  const { customFontFaces: _cf, ...runtimeTheme } = payload.theme;
  const runtimePayload: InteractiveHtmlPayload = {
    ...payload,
    theme: runtimeTheme,
    pages: payload.pages.map((pg) => {
      const { previewUrl: _p, steps, ...rest } = pg;
      return {
        ...rest,
        ...(steps
          ? {
              steps: steps.map(({ previewUrl: _sp, ...sRest }) => sRest),
            }
          : {}),
      };
    }),
  };
  const jsonPayload = serializeJsonForScriptTag(runtimePayload);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
<title>${safeTitle} — Interactive 3D Instructions</title>
<style>
${customFontFacesCss}  :root {
    --page-bg: ${pageBgCss};
    --text: ${t.text};
    --muted: ${t.muted};
    --accent: ${t.accent};
    --pli-bg: ${t.pliBg};
    --pli-border: ${t.pliBorder};
    --callout-bg: ${t.calloutBg};
    --callout-border: ${t.calloutBorder};
    --glass-bg: ${glassBg};
    --glass-border: ${glassBorder};
    --font-body: ${bodyFontStack};
    --font-heading: ${headingFontStack};
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body {
    margin: 0; padding: 0; width: 100%; min-height: 100%;
    font-family: var(--font-body);
    background: var(--page-bg);
    color: var(--text);
  }
  h1, h2, .sf-step-num, .sf-h2, .hero-title, .step-num-big, .pli-qty, .bom-qty {
    font-family: var(--font-heading);
  }
  /* Active 3D mode (enabled only when JavaScript + WebGL boot cleanly) */
  html.js-3d-active, html.js-3d-active body {
    height: 100%; height: 100dvh; overflow: hidden;
  }
  html.js-3d-active #noJsFallback { display: none; }
  #interactiveApp { display: none; }
  html.js-3d-active #interactiveApp { display: flex; }

  /* Static Fallback (shown automatically in iOS Quick Look & JS-disabled previews) */
  .sf-root {
    max-width: 820px; margin: 0 auto; padding: 14px 14px 48px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .sf-topbar {
    display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;
    padding: 12px 16px; border-radius: 20px;
    background: var(--glass-bg); border: 1px solid var(--glass-border);
  }
  .sf-brand h1 { margin: 0; font-size: 17px; font-weight: 800; line-height: 1.2; }
  .sf-brand span { font-size: 12px; color: var(--muted); font-weight: 600; }
  .sf-link-btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px;
    background: var(--accent); color: #fff; text-decoration: none; font-size: 12px; font-weight: 700;
    white-space: nowrap;
  }
  .sf-notice {
    padding: 10px 14px; border-radius: 14px; font-size: 12px; line-height: 1.45;
    background: var(--callout-bg); border: 1px solid var(--callout-border); color: var(--text);
  }
  .sf-pages { display: flex; flex-direction: column; gap: 14px; }
  .sf-card {
    border-radius: 20px; padding: 14px;
    background: var(--glass-bg); border: 1px solid var(--glass-border);
    box-shadow: 0 6px 20px rgba(0,0,0,0.08);
  }
  .sf-card-head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px;
  }
  .sf-step-num { font-size: 28px; font-weight: 900; line-height: 1; letter-spacing: -0.03em; }
  .sf-meta { flex: 1; min-width: 0; }
  .sf-h2 { margin: 2px 0 0; font-size: 19px; font-weight: 900; line-height: 1.2; }
  .sf-ch { font-size: 12px; font-weight: 700; color: var(--muted); }
  .sf-sub { font-size: 11px; font-weight: 700; color: var(--accent); margin-top: 2px; }
  .sf-desc { margin: 4px 0 0; font-size: 13px; color: var(--muted); font-weight: 600; }
  .sf-pg-num { font-size: 11px; font-weight: 700; color: var(--muted); white-space: nowrap; }
  .sf-badge {
    display: inline-block; margin-top: 4px; padding: 2px 9px; border-radius: 999px;
    background: var(--accent); color: #fff; font-size: 10px; font-weight: 800;
  }
  .sf-pli {
    display: flex; flex-wrap: wrap; gap: 6px; padding: 8px; border-radius: 12px; margin-bottom: 10px;
    background: var(--pli-bg); border: 1px solid var(--pli-border);
  }
  .sf-pli-item {
    display: flex; align-items: center; gap: 5px; padding: 3px 6px; border-radius: 8px;
    background: rgba(127,127,127,0.08); font-size: 12px;
  }
  .sf-pli-item img { width: 32px; height: 32px; object-fit: contain; }
  .sf-pli-item strong { display: block; font-size: 12px; line-height: 1.1; }
  .sf-pli-item span { display: block; font-size: 10px; color: var(--muted); }
  .sf-img {
    display: block; width: 100%; max-height: 440px; object-fit: contain; border-radius: 12px; margin: 4px auto 0;
  }
  .sf-bom-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); gap: 8px;
  }
  .sf-bom-item {
    background: var(--pli-bg); border: 1px solid var(--pli-border); border-radius: 12px; padding: 8px;
    display: flex; flex-direction: column; align-items: center; text-align: center; gap: 3px; font-size: 11px;
  }
  .sf-bom-item img { width: 48px; height: 48px; object-fit: contain; }
  .sf-bom-item small { font-size: 10px; color: var(--muted); }
  .bom-mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  .bom-color-cell { display: inline-flex; align-items: center; gap: 5px; justify-content: center; }
  .bom-swatch { display: inline-block; width: 10px; height: 10px; border-radius: 999px; border: 1px solid rgba(127,127,127,0.45); flex-shrink: 0; }
  .sf-bom-table, .bom-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  .sf-bom-table th, .bom-table th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); padding: 7px 8px; border-bottom: 1.5px solid var(--pli-border); background: var(--pli-bg); }
  .sf-bom-table td, .bom-table td { padding: 6px 8px; border-bottom: 1px solid var(--pli-border); vertical-align: middle; }
  .sf-bom-table tr:nth-child(even) td, .bom-table tr:nth-child(even) td { background: rgba(127,127,127,0.05); }
  .sf-bom-table td.col-image, .bom-table td.col-image, .sf-bom-table th.col-image, .bom-table th.col-image { text-align: center; width: 54px; }
  .sf-bom-table td.col-image img, .bom-table td.col-image img { width: 34px; height: 34px; object-fit: contain; display: block; margin: 0 auto; }
  .sf-bom-table td.col-qty, .bom-table td.col-qty, .sf-bom-table th.col-qty, .bom-table th.col-qty { text-align: right; white-space: nowrap; }
  .sf-bom-table td.col-partId code, .bom-table td.col-partId code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; color: var(--muted); }
  .bom-table tbody tr { cursor: pointer; transition: opacity 150ms ease; }
  .bom-table tbody tr.checked { opacity: 0.42; text-decoration: line-through; }

  /* Interactive 3D App Styles */
  .app {
    position: relative; width: 100%; height: 100%; flex-direction: column; overflow: hidden;
  }
  .stage-wrap {
    position: relative; flex: 1; min-height: 0; width: 100%; height: 100%; overflow: hidden;
  }
  canvas#glStage {
    position: absolute; inset: 0; width: 100%; height: 100%; display: block;
    touch-action: none; cursor: grab;
    user-select: none; -webkit-user-select: none;
  }
  canvas#glStage:active { cursor: grabbing; }
  .glass {
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 28px rgba(0,0,0,0.12);
  }
  .topbar {
    position: fixed; top: max(12px, env(safe-area-inset-top)); left: 12px; right: 12px; z-index: 20;
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    pointer-events: none;
  }
  .topbar > * { pointer-events: auto; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 14px;
    border-radius: 999px; font-size: 13px; font-weight: 700; color: var(--text);
    text-decoration: none; cursor: pointer; transition: transform 120ms ease, opacity 120ms ease;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  }
  .pill:active { transform: scale(0.97); }
  .pill.primary { background: var(--accent); color: #fff; border-color: transparent; }
  .title-pill { max-width: min(50vw, 320px); overflow: hidden; }
  .title-pill span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .editor-link { font-size: 12px; font-weight: 600; opacity: 0.92; max-width: min(46vw, 240px); overflow: hidden; }
  .editor-link span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .editor-link:hover { opacity: 1; }

  .hero-overlay {
    position: fixed; top: calc(max(12px, env(safe-area-inset-top)) + 52px); left: 50%; transform: translateX(-50%); z-index: 15;
    width: min(92vw, 520px); text-align: center; pointer-events: none;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 999px;
    background: var(--accent); color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;
    box-shadow: 0 4px 14px rgba(0,0,0,0.16);
  }
  .hero-title {
    margin: 0; font-size: clamp(22px, 4.4vw, 34px); font-weight: 900; letter-spacing: -0.02em; line-height: 1.1;
    text-shadow: 0 2px 14px rgba(0,0,0,0.12);
  }
  .hero-sub {
    margin: 0; font-size: 13px; font-weight: 600; color: var(--muted); max-width: 420px;
  }
  .hero-cta-row {
    margin-top: 8px; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; pointer-events: auto;
  }

  .step-hud {
    position: fixed; top: calc(max(12px, env(safe-area-inset-top)) + 52px); left: 12px; z-index: 15;
    display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
    max-width: min(64vw, 380px); pointer-events: none;
  }
  .step-hud > * { pointer-events: auto; }
  .step-header-card {
    display: flex; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 18px;
  }
  .step-num-big { font-size: 30px; font-weight: 900; line-height: 1; letter-spacing: -0.03em; }
  .step-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .step-chapter { font-size: 11px; font-weight: 700; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
  .sf-rot-badge {
    display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px;
    font-size: 13px; font-weight: 800; box-shadow: 0 3px 10px rgba(0,0,0,0.16);
  }
  .step-cue {
    display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px 4px 5px; border-radius: 999px;
    background: #ffffff; color: #18181b; border: 2px solid var(--accent);
    font-size: 12px; font-weight: 800; width: fit-content; box-shadow: 0 3px 10px rgba(0,0,0,0.18);
  }
  .step-cue-icon {
    width: 24px; height: 24px; border-radius: 999px; background: var(--accent); color: #ffffff;
    display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
  }

  .page-step-tabs { display: flex; flex-wrap: wrap; gap: 4px; }
  .step-tab-btn {
    border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text);
    border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer;
  }
  .step-tab-btn.active { background: var(--accent); color: #fff; border-color: transparent; }

  .pli-panel {
    border-radius: 16px; padding: 8px 10px; max-width: min(88vw, 360px); max-height: 34vh; overflow-y: auto;
    background: var(--pli-bg); border: 1.5px solid var(--pli-border);
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  }
  .pli-grid { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .pli-item {
    display: flex; align-items: center; gap: 6px; padding: 4px 7px; border-radius: 10px;
    background: rgba(127,127,127,0.08);
  }
  .pli-item img { width: 34px; height: 34px; object-fit: contain; display: block; }
  .pli-qty { font-size: 13px; font-weight: 800; line-height: 1; }
  .pli-id { font-size: 10px; color: var(--muted); font-weight: 600; }

  .cam-tools {
    position: fixed; right: 12px; top: calc(max(12px, env(safe-area-inset-top)) + 52px); z-index: 15;
    display: flex; flex-direction: column; gap: 6px;
  }
  .tool-btn {
    width: 38px; height: 38px; border-radius: 999px; border: 1px solid var(--glass-border);
    background: var(--glass-bg); color: var(--text); font-size: 15px; font-weight: 800;
    display: flex; align-items: center; justify-content: center; cursor: pointer;
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 4px 14px rgba(0,0,0,0.1);
  }
  .tool-btn.active { background: var(--accent); color: #fff; border-color: transparent; }

  .hint-chip {
    position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(max(14px, env(safe-area-inset-bottom)) + 78px); z-index: 12;
    padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600;
    background: rgba(0,0,0,0.36); color: #fff; pointer-events: none; white-space: nowrap;
    transition: opacity 400ms ease;
  }

  .bottom-dock {
    position: fixed; bottom: max(14px, env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); z-index: 20;
    width: min(94vw, 560px); border-radius: 24px; padding: 8px 10px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .dock-row { display: flex; align-items: center; justify-content: space-between; gap: 6px; }
  .nav-btn {
    height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--glass-border);
    background: transparent; color: var(--text); font-size: 13px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; gap: 5px; flex-shrink: 0;
  }
  .nav-btn.icon-only { width: 36px; padding: 0; }
  .nav-btn.primary { background: var(--accent); color: #fff; border-color: transparent; }
  .nav-btn:disabled { opacity: 0.32; cursor: default; }
  .page-btn {
    flex: 1; min-width: 0; height: 36px; border: none; background: transparent; color: var(--text);
    font-size: 12px; font-weight: 700; cursor: pointer; border-radius: 999px; padding: 0 8px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .page-btn:hover { background: rgba(127,127,127,0.12); }
  .scrubber { width: 100%; accent-color: var(--accent); height: 4px; cursor: pointer; margin: 0; }

  .flat-view {
    position: absolute; inset: 0; z-index: 16; overflow-y: auto; padding: 74px 16px 116px;
    display: none;
  }
  .flat-view.open { display: block; }
  .flat-inner { max-width: 920px; margin: 0 auto; }
  .bom-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(124px, 1fr)); gap: 10px; margin-top: 14px;
  }
  .bom-card {
    background: var(--pli-bg); border: 1.5px solid var(--pli-border); border-radius: 14px;
    padding: 10px 8px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px;
    cursor: pointer; transition: opacity 150ms ease, transform 120ms ease;
  }
  .bom-card.checked { opacity: 0.42; text-decoration: line-through; }
  .bom-card img { width: 58px; height: 58px; object-fit: contain; }
  .bom-qty { font-size: 14px; font-weight: 900; }
  .bom-name { font-size: 11px; font-weight: 600; line-height: 1.25; }
  .bom-sub { font-size: 10px; color: var(--muted); }
  .divider-card { max-width: 520px; margin: 12vh auto 0; padding: 32px 24px; border-radius: 28px; text-align: center; }

  .drawer-backdrop {
    position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.45);
    display: none; align-items: flex-end; justify-content: center; padding: 12px;
  }
  .drawer-backdrop.open { display: flex; }
  .drawer {
    width: min(96vw, 520px); max-height: 76vh; border-radius: 26px; overflow: hidden;
    display: flex; flex-direction: column;
  }
  .drawer-head {
    padding: 14px 16px; border-bottom: 1px solid var(--glass-border);
    display: flex; align-items: center; justify-content: space-between; font-weight: 800; font-size: 14px; flex-shrink: 0;
  }
  .drawer-body {
    position: relative; flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; overflow: hidden;
  }
  .drawer-list { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px; }
  .drawer-jump {
    position: absolute; left: 50%; transform: translateX(-50%); z-index: 4;
    width: 34px; height: 34px; border-radius: 999px;
    display: flex; align-items: center; justify-content: center;
    color: var(--accent); cursor: pointer;
  }
  .drawer-jump[hidden] { display: none; }
  .drawer-jump-top { top: 8px; }
  .drawer-jump-bottom { bottom: 8px; }
  .drawer-item {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    width: 100%; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--glass-border);
    background: transparent; color: var(--text); font-size: 12px; font-weight: 700; cursor: pointer; text-align: left;
  }
  .drawer-item.active { background: var(--accent); color: #fff; border-color: transparent; }
  .drawer-num { font-size: 11px; opacity: 0.72; flex-shrink: 0; }

  @media (max-width: 600px) {
    .step-num-big { font-size: 24px; }
    .pli-panel { max-height: 24vh; }
    .dock-row { gap: 4px; }
    .nav-btn { height: 34px; padding: 0 10px; font-size: 12px; }
    .nav-btn.icon-only { width: 34px; padding: 0; }
  }
</style>
</head>
<body>
${staticFallbackHtml}

<div id="interactiveApp" class="app">
  <header class="topbar">
    <button id="btnPagesTop" class="pill title-pill" type="button" title="Browse pages" aria-label="Browse pages">
      ${wordless
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7" height="7" rx="1.4"/><rect x="14" y="4" width="7" height="7" rx="1.4"/><rect x="3" y="13" width="7" height="7" rx="1.4"/><rect x="14" y="13" width="7" height="7" rx="1.4"/></svg>`
        : `<span>${safeTitle}</span>`}
    </button>
    <a class="pill editor-link" href="${safeEditorUrl}" target="_blank" rel="noopener noreferrer" title="Open ${TOOL_DISPLAY_NAME}" aria-label="${TOOL_DISPLAY_NAME}">
      <span>${wordless ? '↗' : `${TOOL_DISPLAY_NAME} ↗`}</span>
    </a>
  </header>

  <div class="stage-wrap">
    <canvas id="glStage"></canvas>
    <div id="heroOverlay" class="hero-overlay" style="display:none"></div>
    <div id="stepHud" class="step-hud" style="display:none"></div>
    <div id="camTools" class="cam-tools" style="display:none">
      <button id="btnResetCam" class="tool-btn" type="button" title="Reset camera (R)" aria-label="Reset camera">↺</button>
      <button id="btnZoomIn" class="tool-btn" type="button" title="Zoom in (+)" aria-label="Zoom in">+</button>
      <button id="btnZoomOut" class="tool-btn" type="button" title="Zoom out (-)" aria-label="Zoom out">−</button>
      <button id="btnTogglePli" class="tool-btn" type="button" title="Toggle parts box" aria-label="Toggle parts box" style="display:none">▤</button>
      <button id="btnToggleHl" class="tool-btn" type="button" title="Toggle highlight new pieces" aria-label="Highlight new pieces" style="display:none">✦</button>
    </div>
    <div id="hintChip" class="hint-chip">${wordless ? '360° ↻ · ±' : 'Drag to rotate · Pinch or scroll to zoom · Shift-drag or 2-finger to pan'}</div>
    <div id="flatView" class="flat-view"></div>
  </div>

  <footer class="bottom-dock glass">
    <div class="dock-row">
      <button id="btnFirst" class="nav-btn icon-only" type="button" title="First page" aria-label="First page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m17 18-6-6 6-6"/><path d="M7 6v12"/></svg>
      </button>
      <button id="btnPrev" class="nav-btn" type="button" aria-label="Previous">${wordless ? '←' : '← Prev'}</button>
      <button id="btnPagePicker" class="page-btn" type="button">${wordless ? '1' : 'Page 1'}</button>
      <button id="btnNext" class="nav-btn primary" type="button" aria-label="Next">${wordless ? '→' : 'Next →'}</button>
      <button id="btnLast" class="nav-btn icon-only" type="button" title="Last page" aria-label="Last page">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 18 6-6-6-6"/><path d="M17 6v12"/></svg>
      </button>
    </div>
    <input id="pageScrubber" class="scrubber" type="range" min="0" max="0" value="0" aria-label="Jump to step" />
  </footer>

  <div id="drawerBackdrop" class="drawer-backdrop">
    <div class="drawer glass">
      <div class="drawer-head">
        <span>${wordless ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="7" height="7" rx="1.4"/><rect x="14" y="4" width="7" height="7" rx="1.4"/><rect x="3" y="13" width="7" height="7" rx="1.4"/><rect x="14" y="13" width="7" height="7" rx="1.4"/></svg>` : 'Pages &amp; Steps'}</span>
        <button id="btnCloseDrawer" class="nav-btn" type="button" style="height:30px;padding:0 10px">✕</button>
      </div>
      <div class="drawer-body">
        <div id="drawerList" class="drawer-list"></div>
        <button id="btnDrawerJumpTop" class="drawer-jump drawer-jump-top glass" type="button" title="Jump to top" aria-label="Jump to top" hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h14"/><path d="m6 13 6-6 6 6"/><path d="M12 7v13"/></svg>
        </button>
        <button id="btnDrawerJumpBottom" class="drawer-jump drawer-jump-bottom glass" type="button" title="Jump to bottom" aria-label="Jump to bottom" hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 20h14"/><path d="m6 11 6 6 6-6"/><path d="M12 4v13"/></svg>
        </button>
      </div>
    </div>
  </div>
</div>

<script>
(function() {
  try {
  const DATA = ${jsonPayload};

  function b64ToBytes(b64) {
    if (!b64) return new Uint8Array(0);
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function b64ToF32(b64) {
    const bytes = b64ToBytes(b64);
    return new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength >> 2);
  }
  function hexToRgb01(hex) {
    const clean = String(hex || '#ff2d55').replace('#', '');
    const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean.padEnd(6, '0');
    return [
      (parseInt(full.slice(0, 2), 16) || 255) / 255,
      (parseInt(full.slice(2, 4), 16) || 45) / 255,
      (parseInt(full.slice(4, 6), 16) || 85) / 255,
    ];
  }
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function orthoMat4(l, r, b, t, n, f) {
    const o = new Float32Array(16);
    o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n);
    o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); o[15] = 1;
    return o;
  }
  function lookAtMat4(eye, ctr, up) {
    let zx = eye[0]-ctr[0], zy = eye[1]-ctr[1], zz = eye[2]-ctr[2];
    let zl = Math.hypot(zx, zy, zz) || 1; zx/=zl; zy/=zl; zz/=zl;
    let xx = up[1]*zz - up[2]*zy, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
    let xl = Math.hypot(xx, xy, xz) || 1; xx/=xl; xy/=xl; xz/=xl;
    const yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
    const o = new Float32Array(16);
    o[0]=xx; o[1]=yx; o[2]=zx; o[3]=0;
    o[4]=xy; o[5]=yy; o[6]=zy; o[7]=0;
    o[8]=xz; o[9]=yz; o[10]=zz; o[11]=0;
    o[12]=-(xx*eye[0]+xy*eye[1]+xz*eye[2]);
    o[13]=-(yx*eye[0]+yy*eye[1]+yz*eye[2]);
    o[14]=-(zx*eye[0]+zy*eye[1]+zz*eye[2]);
    o[15]=1;
    return o;
  }
  function mulMat4(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        o[c*4+r] = a[0*4+r]*b[c*4+0] + a[1*4+r]*b[c*4+1] + a[2*4+r]*b[c*4+2] + a[3*4+r]*b[c*4+3];
      }
    }
    return o;
  }
  function partModelMat4(p) {
    const m = p.m || [1,0,0, 0,1,0, 0,0,1];
    return new Float32Array([
      m[0], m[3], m[6], 0,
      m[1], m[4], m[7], 0,
      m[2], m[5], m[8], 0,
      p.x,  p.y,  p.z,  1,
    ]);
  }
  function partNormMat3(p) {
    const m = p.m || [1,0,0, 0,1,0, 0,0,1];
    const c00 = m[4]*m[8] - m[5]*m[7];
    const c01 = -(m[3]*m[8] - m[5]*m[6]);
    const c02 = m[3]*m[7] - m[4]*m[6];
    const c10 = -(m[1]*m[8] - m[2]*m[7]);
    const c11 = m[0]*m[8] - m[2]*m[6];
    const c12 = -(m[0]*m[7] - m[1]*m[6]);
    const c20 = m[1]*m[5] - m[2]*m[4];
    const c21 = -(m[0]*m[5] - m[2]*m[3]);
    const c22 = m[0]*m[4] - m[1]*m[3];
    const det = m[0]*c00 + m[1]*c01 + m[2]*c02;
    const inv = Math.abs(det) > 1e-6 ? 1 / det : 1;
    return new Float32Array([
      c00*inv, c10*inv, c20*inv,
      c01*inv, c11*inv, c21*inv,
      c02*inv, c12*inv, c22*inv,
    ]);
  }

  const canvas = document.getElementById('glStage');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, powerPreference: 'default' })
    || canvas.getContext('experimental-webgl', { antialias: true, alpha: true });
  if (!gl) return; // Keep #noJsFallback visible cleanly if WebGL is unavailable

  const cmp = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader compile failed');
    return s;
  };
  const lnk = (v, f) => {
    const p = gl.createProgram();
    gl.attachShader(p, cmp(gl.VERTEX_SHADER, v));
    gl.attachShader(p, cmp(gl.FRAGMENT_SHADER, f));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Program link failed');
    return p;
  };

  const vsTri = \`
    attribute vec3 aPos; attribute vec3 aNorm; attribute vec4 aCol;
    uniform mat4 uVP; uniform mat4 uModel; uniform mat3 uNormMat;
    varying vec3 vNorm; varying vec4 vCol;
    void main() {
      gl_Position = uVP * uModel * vec4(aPos, 1.0);
      vNorm = uNormMat * aNorm;
      vCol = aCol;
    }\`;
  const fsTri = \`
    precision mediump float;
    uniform float uHeroMode; uniform float uUnlit; uniform float uFadeMix; uniform vec3 uViewDir;
    varying vec3 vNorm; varying vec4 vCol;
    void main() {
      vec3 n = normalize(vNorm);
      if (!gl_FrontFacing) n = -n;
      vec3 base = mix(vCol.rgb, vec3(0.855, 0.871, 0.894), uFadeMix);
      if (uUnlit > 0.5) {
        gl_FragColor = vec4(base, vCol.a);
        return;
      }
      if (uHeroMode > 0.5) {
        vec3 v = normalize(uViewDir);
        vec3 keyDir = normalize(vec3(0.42, 0.86, 0.52));
        vec3 fillDir = normalize(vec3(-0.68, 0.38, 0.34));
        vec3 rimDir = normalize(vec3(-0.22, 0.58, -0.78));
        float diff = min(1.06, 0.50 + 0.14*n.y + 0.05*max(-n.y,0.0) + max(dot(n,keyDir),0.0)*0.44 + max(dot(n,fillDir),0.0)*0.18 + max(dot(n,rimDir),0.0)*0.12);
        float spec = pow(max(dot(n, normalize(keyDir+v)), 0.0), 42.0)*0.16 + pow(max(dot(n, normalize(rimDir+v)), 0.0), 26.0)*0.07;
        gl_FragColor = vec4(min(vec3(1.0), base * diff + vec3(spec)), vCol.a);
      } else {
        float key = max(dot(n, normalize(vec3(0.55, 0.85, 0.55))), 0.0);
        float fill = max(dot(n, normalize(vec3(-0.7, 0.35, -0.5))), 0.0);
        float shade = min(1.08, 0.50 + 0.15*n.y + key*0.44 + fill*0.18);
        gl_FragColor = vec4(base * shade, vCol.a);
      }
    }\`;

  const vsTex = \`
    attribute vec3 aPos; attribute vec3 aNorm; attribute vec2 aUv; attribute vec4 aCol;
    uniform mat4 uVP; uniform mat4 uModel; uniform mat3 uNormMat;
    varying vec3 vNorm; varying vec2 vUv; varying vec4 vCol;
    void main() {
      gl_Position = uVP * uModel * vec4(aPos, 1.0);
      vNorm = uNormMat * aNorm; vUv = aUv; vCol = aCol;
    }\`;
  const fsTex = \`
    precision mediump float;
    uniform sampler2D uTex; uniform float uUseTex; uniform float uFadeMix; uniform float uHeroMode; uniform float uUnlit; uniform vec3 uViewDir;
    varying vec3 vNorm; varying vec2 vUv; varying vec4 vCol;
    void main() {
      vec3 n = normalize(vNorm);
      if (!gl_FrontFacing) n = -n;
      vec3 base = mix(vCol.rgb, vec3(0.855, 0.871, 0.894), uFadeMix);
      if (uUseTex > 0.5 && vUv.x >= 0.0 && vUv.x <= 1.0 && vUv.y >= 0.0 && vUv.y <= 1.0) {
        vec4 d = texture2D(uTex, vUv);
        vec3 dr = mix(d.rgb, vec3(0.855, 0.871, 0.894), uFadeMix);
        base = mix(base, dr, d.a);
      }
      if (uUnlit > 0.5) {
        gl_FragColor = vec4(base, vCol.a);
        return;
      }
      float key = max(dot(n, normalize(vec3(0.55, 0.85, 0.55))), 0.0);
      float fill = max(dot(n, normalize(vec3(-0.7, 0.35, -0.5))), 0.0);
      float shade = min(1.08, 0.50 + 0.15*n.y + key*0.44 + fill*0.18);
      gl_FragColor = vec4(base * shade, vCol.a);
    }\`;

  const vsLine = \`
    attribute vec3 aPos; attribute vec4 aCol;
    uniform mat4 uVP; uniform mat4 uModel;
    varying vec4 vCol;
    void main() {
      gl_Position = uVP * uModel * vec4(aPos, 1.0);
      gl_Position.z -= 0.00024;
      vCol = aCol;
    }\`;
  const fsLine = \`
    precision mediump float;
    uniform float uLineAlpha; uniform float uUseOverride; uniform vec3 uOverrideCol; uniform float uFadeMix;
    varying vec4 vCol;
    void main() {
      vec3 col = uUseOverride > 0.5 ? uOverrideCol : mix(vCol.rgb, vec3(0.75, 0.78, 0.82), uFadeMix * 0.85);
      gl_FragColor = vec4(col, vCol.a * uLineAlpha);
    }\`;

  const triProg = lnk(vsTri, fsTri);
  const texProg = lnk(vsTex, fsTex);
  const lineProg = lnk(vsLine, fsLine);
  const progs = {
    tri: {
      p: triProg,
      vp: gl.getUniformLocation(triProg, 'uVP'),
      model: gl.getUniformLocation(triProg, 'uModel'),
      nmat: gl.getUniformLocation(triProg, 'uNormMat'),
      hero: gl.getUniformLocation(triProg, 'uHeroMode'),
      unlit: gl.getUniformLocation(triProg, 'uUnlit'),
      fade: gl.getUniformLocation(triProg, 'uFadeMix'),
      vdir: gl.getUniformLocation(triProg, 'uViewDir'),
      pos: gl.getAttribLocation(triProg, 'aPos'),
      norm: gl.getAttribLocation(triProg, 'aNorm'),
      col: gl.getAttribLocation(triProg, 'aCol'),
    },
    tex: {
      p: texProg,
      vp: gl.getUniformLocation(texProg, 'uVP'),
      model: gl.getUniformLocation(texProg, 'uModel'),
      nmat: gl.getUniformLocation(texProg, 'uNormMat'),
      hero: gl.getUniformLocation(texProg, 'uHeroMode'),
      unlit: gl.getUniformLocation(texProg, 'uUnlit'),
      fade: gl.getUniformLocation(texProg, 'uFadeMix'),
      vdir: gl.getUniformLocation(texProg, 'uViewDir'),
      tex: gl.getUniformLocation(texProg, 'uTex'),
      useTex: gl.getUniformLocation(texProg, 'uUseTex'),
      pos: gl.getAttribLocation(texProg, 'aPos'),
      norm: gl.getAttribLocation(texProg, 'aNorm'),
      uv: gl.getAttribLocation(texProg, 'aUv'),
      col: gl.getAttribLocation(texProg, 'aCol'),
    },
    line: {
      p: lineProg,
      vp: gl.getUniformLocation(lineProg, 'uVP'),
      model: gl.getUniformLocation(lineProg, 'uModel'),
      alpha: gl.getUniformLocation(lineProg, 'uLineAlpha'),
      useOv: gl.getUniformLocation(lineProg, 'uUseOverride'),
      ovCol: gl.getUniformLocation(lineProg, 'uOverrideCol'),
      fade: gl.getUniformLocation(lineProg, 'uFadeMix'),
      pos: gl.getAttribLocation(lineProg, 'aPos'),
      col: gl.getAttribLocation(lineProg, 'aCol'),
    },
  };
  const glTextures = new Map();
  const emptyTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, emptyTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));

  const maxAttribs = Math.min(8, gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 8);
  function resetAttribs(enabledList) {
    for (let i = 0; i < maxAttribs; i++) {
      if (enabledList.indexOf(i) >= 0) gl.enableVertexAttribArray(i);
      else gl.disableVertexAttribArray(i);
    }
  }

  // Decode prototypes & precompute part matrices
  const decodedProtos = DATA.prototypes.map((pr) => ({
    tp: b64ToF32(pr.tp),
    tn: b64ToF32(pr.tn),
    tc: b64ToBytes(pr.tc),
    oc: pr.oc || 0,
    xc: pr.xc || 0,
    lp: b64ToF32(pr.lp),
    lc: b64ToBytes(pr.lc),
    td: (pr.td || []).map((d) => ({
      k: d.k,
      tp: b64ToF32(d.tp),
      tn: b64ToF32(d.tn),
      uv: b64ToF32(d.uv),
      tc: b64ToBytes(d.tc),
    })),
    b: pr.b || [-10, -10, -10, 10, 10, 10],
    gpu: null,
  }));

  const partMats = DATA.parts.map((p) => ({
    k: p.k,
    m4: partModelMat4(p),
    n3: partNormMat3(p),
    x: p.x, y: p.y, z: p.z,
    m: p.m || [1,0,0, 0,1,0, 0,0,1],
  }));

  function computeSceneBounds(indices) {
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < indices.length; i++) {
      const pm = partMats[indices[i]];
      if (!pm) continue;
      const pr = decodedProtos[pm.k];
      if (!pr) continue;
      const b = pr.b;
      const m = pm.m;
      const xs = [b[0], b[3]], ys = [b[1], b[4]], zs = [b[2], b[5]];
      for (let xi = 0; xi < 2; xi++) {
        for (let yi = 0; yi < 2; yi++) {
          for (let zi = 0; zi < 2; zi++) {
            const lx = xs[xi], ly = ys[yi], lz = zs[zi];
            const wx = m[0]*lx + m[1]*ly + m[2]*lz + pm.x;
            const wy = m[3]*lx + m[4]*ly + m[5]*lz + pm.y;
            const wz = m[6]*lx + m[7]*ly + m[8]*lz + pm.z;
            if (wx < minX) minX = wx; if (wx > maxX) maxX = wx;
            if (wy < minY) minY = wy; if (wy > maxY) maxY = wy;
            if (wz < minZ) minZ = wz; if (wz > maxZ) maxZ = wz;
          }
        }
      }
    }
    if (!Number.isFinite(minX)) return { center: [0, 0, 0], radius: 40 };
    const cx = (minX + maxX) * 0.5, cy = (minY + maxY) * 0.5, cz = (minZ + maxZ) * 0.5;
    const radius = Math.max(22, Math.hypot(maxX - minX, maxY - minY, maxZ - minZ) * 0.5);
    return { center: [cx, cy, cz], radius };
  }

  for (const [k, dataUrl] of Object.entries(DATA.textures || {})) {
    const img = new Image();
    img.onload = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      glTextures.set(k, tex);
      requestDraw();
    };
    img.src = dataUrl;
  }

  function ensureProtoGpu(pr) {
    if (pr.gpu) return pr.gpu;
    const mk = (arr) => {
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      return b;
    };
    pr.gpu = {
      tp: pr.tp.length ? mk(pr.tp) : null,
      tn: pr.tn.length ? mk(pr.tn) : null,
      tc: pr.tc.length ? mk(pr.tc) : null,
      lp: pr.lp.length ? mk(pr.lp) : null,
      lc: pr.lc.length ? mk(pr.lc) : null,
      td: pr.td.map((d) => ({
        k: d.k,
        count: d.tp.length / 3,
        tp: mk(d.tp), tn: mk(d.tn), uv: mk(d.uv), tc: mk(d.tc),
      })),
    };
    return pr.gpu;
  }

  const viewerItems = [];
  for (let pi = 0; pi < DATA.pages.length; pi++) {
    const pg = DATA.pages[pi];
    if (pg.kind === 'steps' && Array.isArray(pg.steps) && pg.steps.length > 0) {
      for (let si = 0; si < pg.steps.length; si++) {
        viewerItems.push({ page: pg, pageIndex: pi, step: pg.steps[si], stepSlotIndex: si });
      }
    } else {
      viewerItems.push({ page: pg, pageIndex: pi, step: null, stepSlotIndex: 0 });
    }
  }

  // Activate interactive 3D UI now that WebGL + shaders + buffers initialized cleanly
  document.documentElement.classList.add('js-3d-active');

  let curIdx = 0;
  let cam = { az: 38, el: 28, zoom: 1.0, panX: 0, panY: 0 };
  let targetCam = null;
  let activeScene = null;
  let activeBounds = { center: [0, 0, 0], radius: 40 };
  let showPli = true;
  let highlightNew = DATA.highlightNew !== false;
  let fadePrev = DATA.fadePrev !== false;
  const hlRgb = hexToRgb01(DATA.highlightColor || '#ff2d55');
  const fadeMixVal = Math.max(0, Math.min(0.76, (1 - (DATA.fadeOpacity ?? 0.68)) * 0.95 + ((DATA.fadeOpacity ?? 0.68) < 0.99 ? 0.16 : 0)));
  const checkedBom = new Set();
  let drawQueued = false;
  let interacted = false;

  function requestDraw() {
    if (drawQueued) return;
    drawQueued = true;
    requestAnimationFrame(() => {
      drawQueued = false;
      if (targetCam) {
        let done = true;
        const lerp = (a, b) => Math.abs(b - a) < 0.01 ? b : (done = false, a + (b - a) * 0.22);
        cam.az = lerp(cam.az, targetCam.az);
        cam.el = lerp(cam.el, targetCam.el);
        cam.zoom = lerp(cam.zoom, targetCam.zoom);
        cam.panX = lerp(cam.panX, targetCam.panX);
        cam.panY = lerp(cam.panY, targetCam.panY);
        if (done) targetCam = null;
        else requestDraw();
      }
      drawScene();
    });
  }

  function drawScene() {
    if (!activeScene) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 3);
    const w = Math.max(100, Math.round((rect.width || window.innerWidth) * dpr));
    const h = Math.max(100, Math.round((rect.height || window.innerHeight) * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }

    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.0, 1.0);

    const az = cam.az * Math.PI / 180;
    const el = cam.el * Math.PI / 180;
    const c = activeBounds.center;
    const r = activeBounds.radius;
    const dist = r * 3.0;
    const eye = [c[0] + dist*Math.sin(az)*Math.cos(el), c[1] + dist*Math.sin(el), c[2] + dist*Math.cos(az)*Math.cos(el)];
    const view = lookAtMat4(eye, c, [0, 1, 0]);
    const halfH = (r * 1.38) / Math.max(0.35, cam.zoom);
    const halfW = halfH * (w / Math.max(1, h));
    const pxX = cam.panX * halfW;
    const pxY = cam.panY * halfH;
    const vp = mulMat4(orthoMat4(-halfW - pxX, halfW - pxX, -halfH + pxY, halfH + pxY, Math.max(1, dist - r * 3.2), dist + r * 3.2), view);

    const vdir = [Math.sin(az)*Math.cos(el), Math.sin(el), Math.cos(az)*Math.cos(el)];
    const isHero = activeScene.hero ? 1.0 : 0.0;
    const isUnlit = (DATA.unlit && !activeScene.hero) ? 1.0 : 0.0;
    const prevIdx = activeScene.prevPartIdx || [];
    const newIdx = activeScene.newPartIdx || [];

    const drawGroups = [
      { list: prevIdx, fade: fadePrev ? fadeMixVal : 0.0, hl: false },
      { list: newIdx, fade: 0.0, hl: highlightNew && prevIdx.length > 0 },
    ];

    // 1. Opaque triangles
    gl.depthMask(true);
    gl.useProgram(progs.tri.p);
    gl.uniformMatrix4fv(progs.tri.vp, false, vp);
    gl.uniform1f(progs.tri.hero, isHero);
    gl.uniform1f(progs.tri.unlit, isUnlit);
    gl.uniform3f(progs.tri.vdir, vdir[0], vdir[1], vdir[2]);
    resetAttribs([progs.tri.pos, progs.tri.norm, progs.tri.col]);

    for (const grp of drawGroups) {
      gl.uniform1f(progs.tri.fade, grp.fade);
      for (let i = 0; i < grp.list.length; i++) {
        const pm = partMats[grp.list[i]];
        if (!pm) continue;
        const pr = decodedProtos[pm.k];
        if (!pr || pr.oc <= 0) continue;
        const gpu = ensureProtoGpu(pr);
        if (!gpu || !gpu.tp) continue;
        gl.uniformMatrix4fv(progs.tri.model, false, pm.m4);
        gl.uniformMatrix3fv(progs.tri.nmat, false, pm.n3);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.tp); gl.vertexAttribPointer(progs.tri.pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.tn); gl.vertexAttribPointer(progs.tri.norm, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.tc); gl.vertexAttribPointer(progs.tri.col, 4, gl.UNSIGNED_BYTE, true, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, pr.oc);
      }
    }

    // 2. Textured decal triangles
    gl.polygonOffset(0.5, 0.5);
    gl.useProgram(progs.tex.p);
    gl.uniformMatrix4fv(progs.tex.vp, false, vp);
    gl.uniform1f(progs.tex.hero, isHero);
    gl.uniform1f(progs.tex.unlit, isUnlit);
    gl.uniform3f(progs.tex.vdir, vdir[0], vdir[1], vdir[2]);
    gl.uniform1i(progs.tex.tex, 0);
    resetAttribs([progs.tex.pos, progs.tex.norm, progs.tex.uv, progs.tex.col]);

    for (const grp of drawGroups) {
      gl.uniform1f(progs.tex.fade, grp.fade);
      for (let i = 0; i < grp.list.length; i++) {
        const pm = partMats[grp.list[i]];
        if (!pm) continue;
        const pr = decodedProtos[pm.k];
        if (!pr || pr.td.length === 0) continue;
        const gpu = ensureProtoGpu(pr);
        gl.uniformMatrix4fv(progs.tex.model, false, pm.m4);
        gl.uniformMatrix3fv(progs.tex.nmat, false, pm.n3);
        for (const td of gpu.td) {
          const glTex = glTextures.get(td.k);
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, glTex || emptyTex);
          gl.uniform1f(progs.tex.useTex, glTex ? 1.0 : 0.0);
          gl.bindBuffer(gl.ARRAY_BUFFER, td.tp); gl.vertexAttribPointer(progs.tex.pos, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, td.tn); gl.vertexAttribPointer(progs.tex.norm, 3, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, td.uv); gl.vertexAttribPointer(progs.tex.uv, 2, gl.FLOAT, false, 0, 0);
          gl.bindBuffer(gl.ARRAY_BUFFER, td.tc); gl.vertexAttribPointer(progs.tex.col, 4, gl.UNSIGNED_BYTE, true, 0, 0);
          gl.drawArrays(gl.TRIANGLES, 0, td.count);
        }
      }
    }
    gl.polygonOffset(1.0, 1.0);

    // 3. Transparent triangles
    gl.depthMask(false);
    gl.useProgram(progs.tri.p);
    gl.uniformMatrix4fv(progs.tri.vp, false, vp);
    resetAttribs([progs.tri.pos, progs.tri.norm, progs.tri.col]);
    for (const grp of drawGroups) {
      gl.uniform1f(progs.tri.fade, grp.fade);
      for (let i = 0; i < grp.list.length; i++) {
        const pm = partMats[grp.list[i]];
        if (!pm) continue;
        const pr = decodedProtos[pm.k];
        if (!pr || pr.xc <= 0) continue;
        const gpu = ensureProtoGpu(pr);
        if (!gpu || !gpu.tp) continue;
        gl.uniformMatrix4fv(progs.tri.model, false, pm.m4);
        gl.uniformMatrix3fv(progs.tri.nmat, false, pm.n3);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.tp); gl.vertexAttribPointer(progs.tri.pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.tn); gl.vertexAttribPointer(progs.tri.norm, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.tc); gl.vertexAttribPointer(progs.tri.col, 4, gl.UNSIGNED_BYTE, true, 0, 0);
        gl.drawArrays(gl.TRIANGLES, pr.oc, pr.xc);
      }
    }
    gl.depthMask(true);

    // 4. Crisp edge lines
    gl.useProgram(progs.line.p);
    gl.uniformMatrix4fv(progs.line.vp, false, vp);
    gl.uniform1f(progs.line.alpha, isHero > 0.5 ? 0.55 : 0.92);
    gl.uniform3f(progs.line.ovCol, hlRgb[0], hlRgb[1], hlRgb[2]);
    resetAttribs([progs.line.pos, progs.line.col]);
    for (const grp of drawGroups) {
      gl.uniform1f(progs.line.fade, grp.fade);
      gl.uniform1f(progs.line.useOv, grp.hl ? 1.0 : 0.0);
      for (let i = 0; i < grp.list.length; i++) {
        const pm = partMats[grp.list[i]];
        if (!pm) continue;
        const pr = decodedProtos[pm.k];
        if (!pr || pr.lp.length === 0) continue;
        const gpu = ensureProtoGpu(pr);
        if (!gpu || !gpu.lp) continue;
        gl.uniformMatrix4fv(progs.line.model, false, pm.m4);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.lp); gl.vertexAttribPointer(progs.line.pos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, gpu.lc); gl.vertexAttribPointer(progs.line.col, 4, gl.UNSIGNED_BYTE, true, 0, 0);
        gl.drawArrays(gl.LINES, 0, pr.lp.length / 3);
      }
    }
  }

  const pointers = new Map();
  let lastPinchDist = 0;
  let lastMid = null;
  let lastTapTime = 0;

  function hideHintSoon() {
    if (interacted) return;
    interacted = true;
    const el = document.getElementById('hintChip');
    if (el) el.style.opacity = '0';
  }

  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey });
    targetCam = null;
    if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      lastMid = { x: (pts[0].x + pts[1].x) * 0.5, y: (pts[0].y + pts[1].y) * 0.5 };
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    if (pointers.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX; prev.y = e.clientY;
      if (Math.hypot(dx, dy) > 1) hideHintSoon();
      if (e.shiftKey || prev.btn === 2 || e.buttons === 2 || e.buttons === 4) {
        const rect = canvas.getBoundingClientRect();
        cam.panX += (dx / Math.max(100, rect.width)) * 2.0;
        cam.panY += (dy / Math.max(100, rect.height)) * 2.0;
      } else {
        cam.az = (cam.az - dx * 0.45 + 360) % 360;
        cam.el = Math.max(-85, Math.min(85, cam.el + dy * 0.4));
      }
      requestDraw();
    } else if (pointers.size === 2) {
      prev.x = e.clientX; prev.y = e.clientY;
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) * 0.5, y: (pts[0].y + pts[1].y) * 0.5 };
      if (lastPinchDist > 5) {
        cam.zoom = Math.max(0.4, Math.min(4.8, cam.zoom * (dist / lastPinchDist)));
      }
      if (lastMid) {
        const rect = canvas.getBoundingClientRect();
        cam.panX += ((mid.x - lastMid.x) / Math.max(100, rect.width)) * 2.0;
        cam.panY += ((mid.y - lastMid.y) / Math.max(100, rect.height)) * 2.0;
      }
      lastPinchDist = dist; lastMid = mid;
      hideHintSoon();
      requestDraw();
    }
  });
  const endPtr = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) { lastPinchDist = 0; lastMid = null; }
  };
  canvas.addEventListener('pointerup', (e) => {
    const now = Date.now();
    if (pointers.size === 1 && now - lastTapTime < 280) resetCameraSmooth();
    lastTapTime = now;
    endPtr(e);
  });
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    targetCam = null;
    const factor = e.deltaY < 0 ? 1.1 : 0.91;
    cam.zoom = Math.max(0.4, Math.min(4.8, cam.zoom * factor));
    hideHintSoon();
    requestDraw();
  }, { passive: false });

  function getDefaultCamForItem(item) {
    const sc = item.step || item.page.scene;
    return {
      az: sc ? (sc.az ?? 38) : 38,
      el: sc ? (sc.el ?? 28) : 28,
      zoom: sc ? (sc.zoom ?? 1.0) : 1.0,
      panX: 0,
      panY: 0,
    };
  }

  function resetCameraSmooth() {
    const item = viewerItems[curIdx];
    if (!item) return;
    targetCam = getDefaultCamForItem(item);
    requestDraw();
  }

  function renderView() {
    const item = viewerItems[curIdx];
    if (!item) return;
    const pg = item.page;
    const step = item.step;

    const heroEl = document.getElementById('heroOverlay');
    const stepHud = document.getElementById('stepHud');
    const camTools = document.getElementById('camTools');
    const flatEl = document.getElementById('flatView');
    const hintEl = document.getElementById('hintChip');
    const btnPli = document.getElementById('btnTogglePli');
    const btnHl = document.getElementById('btnToggleHl');

    heroEl.style.display = 'none';
    stepHud.style.display = 'none';
    flatEl.classList.remove('open');
    flatEl.innerHTML = '';

    const scene = step || pg.scene || null;
    activeScene = scene;

    if (scene) {
      const allIdx = [...(scene.prevPartIdx || []), ...(scene.newPartIdx || [])];
      activeBounds = computeSceneBounds(allIdx);
      cam = getDefaultCamForItem(item);
      targetCam = null;
      canvas.style.display = 'block';
      camTools.style.display = 'flex';
      hintEl.style.display = interacted ? 'none' : 'block';
      btnPli.style.display = step && step.pli && step.pli.length > 0 ? 'flex' : 'none';
      btnPli.classList.toggle('active', showPli);
      btnHl.style.display = step ? 'flex' : 'none';
      btnHl.classList.toggle('active', highlightNew);
      requestDraw();
    } else {
      canvas.style.display = 'none';
      camTools.style.display = 'none';
      hintEl.style.display = 'none';
    }

    const isWordless = Boolean(DATA.wordless);
    const rotIconSvg = (kind) => {
      if (kind === 'flip_vertical') {
        return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="10.2" width="8" height="3.6" rx="0.9" fill="currentColor" stroke="none"/><path d="M5.5 9.5C6.2 5.6 8.9 3.6 12 3.6c3.2 0 5.9 2.1 6.6 5.9"/><polyline points="16 7.5 18.8 10 21 7.2"/><path d="M18.5 14.5c-.7 3.9-3.4 5.9-6.5 5.9-3.2 0-5.9-2.1-6.6-5.9"/><polyline points="8 16.5 5.2 14 3 16.8"/></svg>';
      }
      const mirror = kind === 'yaw_90_ccw' ? ' transform="translate(24 0) scale(-1 1)"' : '';
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><g' + mirror + '><path d="M20.5 11.5A8.5 8.5 0 0 0 6.2 5.4L4 7.6"/><polyline points="4 3.5 4 7.6 8.1 7.6"/><path d="M3.5 12.5A8.5 8.5 0 0 0 17.8 18.6L20 16.4"/><polyline points="20 20.5 20 16.4 15.9 16.4"/></g></svg>';
    };

    if (pg.kind === 'steps' && step) {
      const siblingTabs = pg.steps && pg.steps.length > 1
        ? '<div class="page-step-tabs">' + pg.steps.map((st, si) => {
            const targetIdx = viewerItems.findIndex(v => v.pageIndex === item.pageIndex && v.stepSlotIndex === si);
            return '<button type="button" class="step-tab-btn ' + (si === item.stepSlotIndex ? 'active' : '') + '" data-jump="' + targetIdx + '">' + (isWordless ? st.stepNum : ('Step ' + st.stepNum)) + '</button>';
          }).join('') + '</div>'
        : '';
      const pliHtml = showPli && step.pli && step.pli.length > 0
        ? '<div class="pli-panel"><div class="pli-grid">' + step.pli.map(p =>
            '<div class="pli-item">' +
              (p.thumb ? '<img src="' + p.thumb + '" alt="' + esc(p.name) + '" />' : '') +
              '<div><div class="pli-qty">' + p.qty + '×</div>' + (isWordless ? '' : '<div class="pli-id">' + esc(p.partId.toUpperCase()) + '</div>') + '</div>' +
            '</div>'
          ).join('') + '</div></div>'
        : '';
      const showRot = Boolean(step.rotationCue || (step.rotationCueKind && step.rotationCueKind !== 'none'));
      const metaInner =
        (isWordless ? '' : '<div class="step-chapter">' + esc(pg.chapterName || step.label || '') + '</div>') +
        (step.subLabel ? '<div class="step-chapter" style="color:var(--accent)">' + esc(step.subLabel) + '</div>' : '') +
        (showRot
          ? '<span class="step-cue" style="' + (step.rotationCue ? '' : 'padding:3px') + '"><span class="step-cue-icon">' + rotIconSvg(step.rotationCueKind) + '</span>' + (step.rotationCue ? '<span>' + esc(step.rotationCue) + '</span>' : '') + '</span>'
          : '');
      stepHud.innerHTML =
        '<div class="step-header-card glass">' +
          '<div class="step-num-big">' + step.stepNum + '</div>' +
          (metaInner ? '<div class="step-meta">' + metaInner + '</div>' : '') +
        '</div>' +
        siblingTabs +
        pliHtml;
      stepHud.style.display = 'flex';
      stepHud.querySelectorAll('[data-jump]').forEach((b) => {
        b.onclick = () => { curIdx = Number(b.getAttribute('data-jump')); renderView(); };
      });
    } else if (pg.kind === 'cover' || pg.kind === 'complete' || pg.kind === 'section_divider' || pg.kind === 'submodel_page' || pg.kind === 'back') {
      const ctaBtn = pg.kind === 'cover' && viewerItems.length > 1
        ? '<button id="heroStartBtn" type="button" class="pill primary">' + (isWordless ? '▶' : 'Start Building →') + '</button>'
        : pg.kind === 'back'
          ? '<a class="pill primary" href="' + esc(DATA.editorUrl) + '" target="_blank" rel="noopener noreferrer">' + (isWordless ? '↗' : 'Open in ${TOOL_DISPLAY_NAME} ↗') + '</a>'
          : '';
      const heroTitle = pg.title !== undefined ? pg.title : (isWordless ? '' : pg.label);
      const bagSvgHtml = isWordless && pg.kind === 'section_divider' && pg.bagNumber
        ? '<svg width="46" height="54" viewBox="0 0 64 76" fill="none" aria-hidden="true" style="display:block;margin:0 auto 4px"><path d="M12 4 L52 4 L56 14 L58 68 A4 4 0 0 1 54 72 L10 72 A4 4 0 0 1 6 68 L8 14 Z" fill="var(--pli-bg)" stroke="var(--accent)" stroke-width="3.2" stroke-linejoin="round"/><path d="M11 14 L53 14" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="9" r="2.2" fill="var(--accent)"/><text x="32" y="51" text-anchor="middle" font-size="' + (String(pg.bagNumber).length >= 2 ? 24 : 30) + '" font-weight="900" fill="var(--text)" font-family="inherit">' + esc(String(pg.bagNumber)) + '</text></svg>'
        : '';
      heroEl.innerHTML =
        bagSvgHtml +
        (pg.badge ? '<span class="hero-badge">' + esc(pg.badge) + '</span>' : '') +
        (heroTitle ? '<h1 class="hero-title">' + esc(heroTitle) + '</h1>' : '') +
        (pg.subtitle ? '<p class="hero-sub">' + esc(pg.subtitle) + '</p>' : '') +
        (pg.note ? '<p class="hero-sub" style="font-size:11px;opacity:.85">' + esc(pg.note) + '</p>' : '') +
        (ctaBtn ? '<div class="hero-cta-row">' + ctaBtn + '</div>' : '');
      heroEl.style.display = 'flex';
      const startBtn = document.getElementById('heroStartBtn');
      if (startBtn) startBtn.onclick = () => { curIdx = Math.min(viewerItems.length - 1, curIdx + 1); renderView(); };
    } else if (pg.kind === 'bom') {
      const items = pg.bomItems || [];
      const fields = (pg.bomFields && pg.bomFields.length > 0)
        ? pg.bomFields
        : (isWordless ? ['image', 'qty', 'partId'] : ['image', 'qty', 'name', 'partId']);
      const partsSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg>';
      const brickSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M6.5 9V6.2A1.2 1.2 0 0 1 7.7 5h2.6a1.2 1.2 0 0 1 1.2 1.2V9"/><path d="M12.5 9V6.2A1.2 1.2 0 0 1 13.7 5h2.6a1.2 1.2 0 0 1 1.2 1.2V9"/></svg>';
      const headers = isWordless
        ? { image: brickSvg, qty: '×', name: 'Aa', partId: '#', color: '●' }
        : { image: 'Part', qty: 'Qty', name: 'Part Name', partId: 'Part ID', color: 'Color' };
      const colorHtml = (b) => '<span class="bom-color-cell">' +
        (b.colorHex ? '<span class="bom-swatch" style="background:' + esc(b.colorHex) + '"></span>' : '') +
        '<span>' + esc(b.colorName || '') + '</span></span>';
      const bodyHtml = pg.bomFormat === 'table'
        ? '<table class="bom-table"><thead><tr>' +
            fields.map((f) => '<th class="col-' + f + '">' + (isWordless && f === 'image' ? headers[f] : esc(headers[f] || f)) + '</th>').join('') +
          '</tr></thead><tbody>' +
            items.map((b, bi) => {
              const key = pg.id + ':' + bi;
              return '<tr class="' + (checkedBom.has(key) ? 'checked' : '') + '" data-bom="' + key + '">' +
                fields.map((f) => {
                  if (f === 'image') return '<td class="col-image">' + (b.thumb ? '<img src="' + b.thumb + '" alt="' + esc(b.name) + '" />' : '') + '</td>';
                  if (f === 'qty') return '<td class="col-qty"><span class="bom-qty">' + b.qty + '×</span></td>';
                  if (f === 'name') return '<td class="col-name">' + esc(b.name) + '</td>';
                  if (f === 'partId') return '<td class="col-partId"><code>' + esc(b.partId) + '</code></td>';
                  return '<td class="col-color">' + colorHtml(b) + '</td>';
                }).join('') + '</tr>';
            }).join('') +
          '</tbody></table>'
        : '<div class="bom-grid">' + items.map((b, bi) => {
            const key = pg.id + ':' + bi;
            return '<div class="bom-card ' + (checkedBom.has(key) ? 'checked' : '') + '" data-bom="' + key + '">' +
              fields.map((f) => {
                if (f === 'image') return b.thumb ? '<img src="' + b.thumb + '" alt="' + esc(b.name) + '" />' : '';
                if (f === 'qty') return '<div class="bom-qty">' + b.qty + '×</div>';
                if (f === 'name') return '<div class="bom-name">' + esc(b.name) + '</div>';
                if (f === 'partId') return '<div class="bom-sub bom-mono">' + esc(b.partId) + '</div>';
                return '<div class="bom-sub">' + colorHtml(b) + '</div>';
              }).join('') +
            '</div>';
          }).join('') + '</div>';
      const bomHeadingHtml = isWordless
        ? '<h2 style="margin:0;font-size:20px;font-weight:900;display:inline-flex;align-items:center;gap:8px">' + partsSvg + (pg.title ? '<span>' + esc(pg.title) + '</span>' : '') + '</h2>'
        : '<h2 style="margin:0;font-size:22px;font-weight:900">' + esc(pg.title || 'Parts List') + '</h2>';
      const bomSummaryHtml = isWordless
        ? '<span style="font-size:12px;color:var(--muted);font-weight:700;display:inline-flex;align-items:center;gap:5px">' + brickSvg + '<span>' + DATA.totalPieces + '</span></span>'
        : '<span style="font-size:12px;color:var(--muted);font-weight:600">Tap parts to check them off · ' + DATA.totalPieces + ' total pcs</span>';
      flatEl.innerHTML =
        '<div class="flat-inner">' +
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
            bomHeadingHtml +
            bomSummaryHtml +
          '</div>' +
          bodyHtml +
        '</div>';
      flatEl.classList.add('open');
      flatEl.querySelectorAll('[data-bom]').forEach((card) => {
        card.onclick = () => {
          const k = card.getAttribute('data-bom');
          if (checkedBom.has(k)) checkedBom.delete(k); else checkedBom.add(k);
          card.classList.toggle('checked', checkedBom.has(k));
        };
      });
    } else {
      const divTitle = pg.title !== undefined ? pg.title : (isWordless ? '' : pg.label);
      flatEl.innerHTML =
        '<div class="divider-card glass">' +
          (divTitle ? '<h2 style="margin:0 0 8px;font-size:24px;font-weight:900">' + esc(divTitle) + '</h2>' : '') +
          (pg.subtitle ? '<p style="margin:0;font-size:14px;color:var(--muted)">' + esc(pg.subtitle) + '</p>' : '') +
        '</div>';
      flatEl.classList.add('open');
    }

    document.getElementById('btnFirst').disabled = curIdx <= 0;
    document.getElementById('btnPrev').disabled = curIdx <= 0;
    document.getElementById('btnNext').disabled = curIdx >= viewerItems.length - 1;
    document.getElementById('btnLast').disabled = curIdx >= viewerItems.length - 1;
    const pgPicker = document.getElementById('btnPagePicker');
    if (isWordless) {
      pgPicker.textContent = pg.num + ' / ' + DATA.pages.length;
    } else {
      const stepText = step ? ('Step ' + step.stepNum + ' · Page ' + pg.num) : (pg.label + ' · Page ' + pg.num);
      pgPicker.textContent = stepText + ' / ' + DATA.pages.length;
    }
    const scrub = document.getElementById('pageScrubber');
    scrub.max = String(Math.max(0, viewerItems.length - 1));
    scrub.value = String(curIdx);
  }

  function syncDrawerScrollButtons() {
    const list = document.getElementById('drawerList');
    const topBtn = document.getElementById('btnDrawerJumpTop');
    const bottomBtn = document.getElementById('btnDrawerJumpBottom');
    if (!list || !topBtn || !bottomBtn) return;
    const threshold = 8;
    const maxScroll = Math.max(0, list.scrollHeight - list.clientHeight);
    if (list.clientHeight <= 0 || maxScroll <= threshold) {
      topBtn.hidden = true;
      bottomBtn.hidden = true;
      return;
    }
    const clampedTop = Math.min(maxScroll, Math.max(0, list.scrollTop));
    topBtn.hidden = !(clampedTop > threshold);
    bottomBtn.hidden = !(maxScroll - clampedTop > threshold);
  }

  function scrollDrawerTo(edge) {
    const list = document.getElementById('drawerList');
    if (!list) return;
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targetTop = edge === 'top' ? 0 : Math.max(0, list.scrollHeight - list.clientHeight);
    if (typeof list.scrollTo === 'function') {
      list.scrollTo({ top: targetTop, behavior: reduced ? 'auto' : 'smooth' });
    } else {
      list.scrollTop = targetTop;
    }
    syncDrawerScrollButtons();
  }

  function openDrawer() {
    const isWordless = Boolean(DATA.wordless);
    const list = document.getElementById('drawerList');
    list.innerHTML = viewerItems.map((it, idx) => {
      const label = isWordless
        ? (it.step ? String(it.step.stepNum) : (it.page.bagNumber ? '#' + it.page.bagNumber : (it.page.badge || String(it.page.num))))
        : (it.step ? ('Step ' + it.step.stepNum + (it.page.chapterName ? ' · ' + it.page.chapterName : '')) : it.page.label);
      return '<button type="button" class="drawer-item ' + (idx === curIdx ? 'active' : '') + '" data-idx="' + idx + '">' +
        '<span>' + esc(label) + '</span>' +
        '<span class="drawer-num">' + (isWordless ? String(it.page.num) : ('Page ' + it.page.num)) + '</span>' +
      '</button>';
    }).join('');
    list.querySelectorAll('[data-idx]').forEach((btn) => {
      btn.onclick = () => {
        curIdx = Number(btn.getAttribute('data-idx'));
        document.getElementById('drawerBackdrop').classList.remove('open');
        renderView();
      };
    });
    document.getElementById('drawerBackdrop').classList.add('open');
    const activeItem = list.querySelector('.drawer-item.active');
    if (activeItem && typeof activeItem.scrollIntoView === 'function') {
      activeItem.scrollIntoView({ block: 'center' });
    }
    syncDrawerScrollButtons();
    requestAnimationFrame(syncDrawerScrollButtons);
  }

  document.getElementById('btnFirst').onclick = () => { if (curIdx > 0) { curIdx = 0; renderView(); } };
  document.getElementById('btnPrev').onclick = () => { if (curIdx > 0) { curIdx--; renderView(); } };
  document.getElementById('btnNext').onclick = () => { if (curIdx < viewerItems.length - 1) { curIdx++; renderView(); } };
  document.getElementById('btnLast').onclick = () => { if (curIdx < viewerItems.length - 1) { curIdx = viewerItems.length - 1; renderView(); } };
  document.getElementById('pageScrubber').oninput = (e) => { curIdx = Number(e.target.value) || 0; renderView(); };
  document.getElementById('btnPagePicker').onclick = openDrawer;
  document.getElementById('btnPagesTop').onclick = openDrawer;
  document.getElementById('btnCloseDrawer').onclick = () => document.getElementById('drawerBackdrop').classList.remove('open');
  document.getElementById('drawerBackdrop').onclick = (e) => { if (e.target.id === 'drawerBackdrop') e.target.classList.remove('open'); };
  document.getElementById('drawerList').addEventListener('scroll', syncDrawerScrollButtons, { passive: true });
  document.getElementById('btnDrawerJumpTop').onclick = () => scrollDrawerTo('top');
  document.getElementById('btnDrawerJumpBottom').onclick = () => scrollDrawerTo('bottom');
  document.getElementById('btnResetCam').onclick = resetCameraSmooth;
  document.getElementById('btnZoomIn').onclick = () => { targetCam = null; cam.zoom = Math.min(4.8, cam.zoom * 1.2); requestDraw(); };
  document.getElementById('btnZoomOut').onclick = () => { targetCam = null; cam.zoom = Math.max(0.4, cam.zoom / 1.2); requestDraw(); };
  document.getElementById('btnTogglePli').onclick = () => { showPli = !showPli; renderView(); };
  document.getElementById('btnToggleHl').onclick = () => { highlightNew = !highlightNew; document.getElementById('btnToggleHl').classList.toggle('active', highlightNew); requestDraw(); };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { if (curIdx < viewerItems.length - 1) { curIdx++; renderView(); } }
    else if (e.key === 'ArrowLeft') { if (curIdx > 0) { curIdx--; renderView(); } }
    else if (e.key === 'Home') { if (curIdx > 0) { curIdx = 0; renderView(); } }
    else if (e.key === 'End') { if (curIdx < viewerItems.length - 1) { curIdx = viewerItems.length - 1; renderView(); } }
    else if (e.key === 'r' || e.key === 'R') { resetCameraSmooth(); }
    else if (e.key === '+' || e.key === '=') { cam.zoom = Math.min(4.8, cam.zoom * 1.15); requestDraw(); }
    else if (e.key === '-' || e.key === '_') { cam.zoom = Math.max(0.4, cam.zoom / 1.15); requestDraw(); }
    else if (e.key === 'Escape') { document.getElementById('drawerBackdrop').classList.remove('open'); }
  });
  window.addEventListener('resize', () => { requestDraw(); syncDrawerScrollButtons(); });

  renderView();
  } catch (err) {
    document.documentElement.classList.remove('js-3d-active');
  }
})();
</script>
</body>
</html>`;
}
