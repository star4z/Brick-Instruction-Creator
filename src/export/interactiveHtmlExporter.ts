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
 * - Direct link back to Brick Instruction Creator editor
 */

export const DEFAULT_EDITOR_URL = 'https://star4z.github.io/Brick-Instruction-Creator/';

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
  pli: InteractivePliEntry[];
  subLabel?: string;
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
  scene?: InteractiveSceneSpec;
  steps?: InteractiveStepScene[];
  bomItems?: InteractivePliEntry[];
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
  isDark: boolean;
}

export interface InteractiveHtmlPayload {
  version: 1;
  title: string;
  subtitle?: string;
  author?: string;
  editorUrl: string;
  totalPieces: number;
  totalSteps: number;
  theme: InteractiveViewerTheme;
  highlightNew: boolean;
  highlightColor: string;
  fadePrev: boolean;
  fadeOpacity: number;
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
 * Generates the complete, self-contained, zero-dependency Interactive 3D HTML file.
 */
export function generateInteractiveHtmlDocument(payload: InteractiveHtmlPayload): string {
  const safeTitle = escapeHtmlText(payload.title || 'Brick Instruction Manual');
  const safeEditorUrl = escapeHtmlText(payload.editorUrl || DEFAULT_EDITOR_URL);
  const t = payload.theme;
  const pageBgCss =
    t.bgType === 'gradient' && t.bgEnd
      ? `linear-gradient(${t.bgAngle ?? 180}deg, ${t.bg}, ${t.bgEnd})`
      : t.bg;
  const glassBg = t.isDark ? 'rgba(22, 26, 34, 0.84)' : 'rgba(255, 255, 255, 0.86)';
  const glassBorder = t.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.12)';
  const jsonPayload = serializeJsonForScriptTag(payload);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>${safeTitle} — Interactive 3D Instructions</title>
<style>
  :root {
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
  }
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body {
    margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--page-bg);
    color: var(--text);
    user-select: none;
    -webkit-user-select: none;
  }
  .app {
    position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; overflow: hidden;
  }
  .stage-wrap {
    position: relative; flex: 1; min-height: 0; width: 100%; height: 100%; overflow: hidden;
  }
  canvas#glStage {
    position: absolute; inset: 0; width: 100%; height: 100%; display: block;
    touch-action: none; cursor: grab;
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
    position: fixed; top: 12px; left: 12px; right: 12px; z-index: 20;
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    pointer-events: none;
  }
  .topbar > * { pointer-events: auto; }
  .pill {
    display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 14px;
    border-radius: 999px; font-size: 13px; font-weight: 700; color: var(--text);
    text-decoration: none; cursor: pointer; transition: transform 120ms ease, opacity 120ms ease;
    border: 1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
  }
  .pill:active { transform: scale(0.97); }
  .pill.icon-only { width: 40px; padding: 0; justify-content: center; }
  .pill.primary { background: var(--accent); color: #fff; border-color: transparent; }
  .title-pill { max-width: min(56vw, 340px); overflow: hidden; }
  .title-pill span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .editor-link { font-size: 12px; font-weight: 600; opacity: 0.92; }
  .editor-link:hover { opacity: 1; }

  .hero-overlay {
    position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 15;
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
    position: fixed; top: 64px; left: 12px; z-index: 15;
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
  .step-cue {
    display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px;
    background: var(--accent); color: #fff; font-size: 10px; font-weight: 800; width: fit-content;
  }

  .page-step-tabs {
    display: flex; flex-wrap: wrap; gap: 4px;
  }
  .step-tab-btn {
    border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text);
    border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer;
  }
  .step-tab-btn.active { background: var(--accent); color: #fff; border-color: transparent; }

  .pli-panel {
    border-radius: 16px; padding: 8px 10px; max-width: min(88vw, 360px); max-height: 36vh; overflow-y: auto;
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
    position: fixed; right: 12px; top: 64px; z-index: 15;
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
    position: fixed; left: 50%; transform: translateX(-50%); bottom: 92px; z-index: 12;
    padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600;
    background: rgba(0,0,0,0.36); color: #fff; pointer-events: none; white-space: nowrap;
    transition: opacity 400ms ease;
  }

  .bottom-dock {
    position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); z-index: 20;
    width: min(94vw, 520px); border-radius: 24px; padding: 8px 10px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .dock-row {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .nav-btn {
    height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--glass-border);
    background: transparent; color: var(--text); font-size: 13px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; gap: 5px;
  }
  .nav-btn.primary { background: var(--accent); color: #fff; border-color: transparent; }
  .nav-btn:disabled { opacity: 0.32; cursor: default; }
  .page-btn {
    flex: 1; min-width: 0; height: 36px; border: none; background: transparent; color: var(--text);
    font-size: 12px; font-weight: 700; cursor: pointer; border-radius: 999px; padding: 0 8px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .page-btn:hover { background: rgba(127,127,127,0.12); }
  .scrubber {
    width: 100%; accent-color: var(--accent); height: 4px; cursor: pointer; margin: 0;
  }

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

  .divider-card {
    max-width: 520px; margin: 12vh auto 0; padding: 32px 24px; border-radius: 28px; text-align: center;
  }

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
    display: flex; align-items: center; justify-content: space-between; font-weight: 800; font-size: 14px;
  }
  .drawer-list {
    overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 6px;
  }
  .drawer-item {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
    width: 100%; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--glass-border);
    background: transparent; color: var(--text); font-size: 12px; font-weight: 700; cursor: pointer; text-align: left;
  }
  .drawer-item.active { background: var(--accent); color: #fff; border-color: transparent; }
  .drawer-num { font-size: 11px; opacity: 0.72; flex-shrink: 0; }

  @media (max-width: 600px) {
    .editor-link .label-long { display: none; }
    .step-num-big { font-size: 24px; }
    .pli-panel { max-height: 24vh; }
  }
</style>
</head>
<body>
<div class="app">
  <header class="topbar">
    <button id="btnPagesTop" class="pill title-pill" type="button" title="Browse pages">
      <span>${safeTitle}</span>
    </button>
    <a class="pill editor-link" href="${safeEditorUrl}" target="_blank" rel="noopener noreferrer" title="Open Brick Instruction Creator">
      <span class="label-long">Edit in </span><span>Brick Studio ↗</span>
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
    <div id="hintChip" class="hint-chip">Drag to rotate · Pinch or scroll to zoom · Shift-drag or 2-finger to pan</div>
    <div id="flatView" class="flat-view"></div>
  </div>

  <footer class="bottom-dock glass">
    <div class="dock-row">
      <button id="btnPrev" class="nav-btn" type="button">← Prev</button>
      <button id="btnPagePicker" class="page-btn" type="button">Page 1</button>
      <button id="btnNext" class="nav-btn primary" type="button">Next →</button>
    </div>
    <input id="pageScrubber" class="scrubber" type="range" min="0" max="0" value="0" aria-label="Jump to step" />
  </footer>

  <div id="drawerBackdrop" class="drawer-backdrop">
    <div class="drawer glass">
      <div class="drawer-head">
        <span>Pages &amp; Steps</span>
        <button id="btnCloseDrawer" class="nav-btn" type="button" style="height:30px;padding:0 10px">✕</button>
      </div>
      <div id="drawerList" class="drawer-list"></div>
    </div>
  </div>
</div>

<script>
(function() {
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

  // Matrix helpers (column-major Float32Array for WebGL)
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
    // Convert row-major 3x3 + translation to column-major mat4
    return new Float32Array([
      m[0], m[3], m[6], 0,
      m[1], m[4], m[7], 0,
      m[2], m[5], m[8], 0,
      p.x,  p.y,  p.z,  1,
    ]);
  }
  function partNormMat3(p) {
    const m = p.m || [1,0,0, 0,1,0, 0,0,1];
    // Cofactor matrix (inverse-transpose * det) in column-major order handles non-uniform/mirrored parts
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

  // Compute bounding sphere for a scene's part list
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

  // Lightweight Vanilla WebGL Renderer (matches Studio brick shaders + decals)
  const canvas = document.getElementById('glStage');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: true, powerPreference: 'default' });
  const glTextures = new Map();
  let emptyTex = null;
  let progs = null;

  if (gl) {
    const cmp = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const lnk = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, cmp(gl.VERTEX_SHADER, v)); gl.attachShader(p, cmp(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p); return p; };

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
      uniform float uHeroMode; uniform float uFadeMix; uniform vec3 uViewDir;
      varying vec3 vNorm; varying vec4 vCol;
      void main() {
        vec3 n = normalize(vNorm);
        if (!gl_FrontFacing) n = -n;
        vec3 base = mix(vCol.rgb, vec3(0.855, 0.871, 0.894), uFadeMix);
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
      uniform sampler2D uTex; uniform float uUseTex; uniform float uFadeMix; uniform float uHeroMode; uniform vec3 uViewDir;
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
    progs = {
      tri: {
        p: triProg,
        vp: gl.getUniformLocation(triProg, 'uVP'),
        model: gl.getUniformLocation(triProg, 'uModel'),
        nmat: gl.getUniformLocation(triProg, 'uNormMat'),
        hero: gl.getUniformLocation(triProg, 'uHeroMode'),
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
    emptyTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, emptyTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0,0,0,0]));

    // Decode embedded PNG decal textures asynchronously
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
  }

  function ensureProtoGpu(pr) {
    if (pr.gpu || !gl) return pr.gpu;
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

  // Flatten viewer items: each page or each individual step on a multi-step page
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
    if (!gl || !progs || !activeScene) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(100, Math.round(rect.width * dpr));
    const h = Math.max(100, Math.round(rect.height * dpr));
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
    gl.uniform3f(progs.tri.vdir, vdir[0], vdir[1], vdir[2]);
    gl.enableVertexAttribArray(progs.tri.pos);
    gl.enableVertexAttribArray(progs.tri.norm);
    gl.enableVertexAttribArray(progs.tri.col);

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
    gl.uniform3f(progs.tex.vdir, vdir[0], vdir[1], vdir[2]);
    gl.uniform1i(progs.tex.tex, 0);
    gl.enableVertexAttribArray(progs.tex.pos);
    gl.enableVertexAttribArray(progs.tex.norm);
    gl.enableVertexAttribArray(progs.tex.uv);
    gl.enableVertexAttribArray(progs.tex.col);

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
    gl.disableVertexAttribArray(progs.tex.uv);
    gl.polygonOffset(1.0, 1.0);

    // 3. Transparent triangles
    gl.depthMask(false);
    gl.useProgram(progs.tri.p);
    gl.uniformMatrix4fv(progs.tri.vp, false, vp);
    gl.enableVertexAttribArray(progs.tri.pos);
    gl.enableVertexAttribArray(progs.tri.norm);
    gl.enableVertexAttribArray(progs.tri.col);
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
    gl.enableVertexAttribArray(progs.line.pos);
    gl.enableVertexAttribArray(progs.line.col);
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

  // Interactive pointer + touch orbit / pan / pinch-zoom
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
    canvas.setPointerCapture(e.pointerId);
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
    if (pointers.size === 1 && now - lastTapTime < 280) {
      resetCameraSmooth();
    }
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

    if (pg.kind === 'steps' && step) {
      const siblingTabs = pg.steps && pg.steps.length > 1
        ? '<div class="page-step-tabs">' + pg.steps.map((st, si) => {
            const targetIdx = viewerItems.findIndex(v => v.pageIndex === item.pageIndex && v.stepSlotIndex === si);
            return '<button type="button" class="step-tab-btn ' + (si === item.stepSlotIndex ? 'active' : '') + '" data-jump="' + targetIdx + '">Step ' + st.stepNum + '</button>';
          }).join('') + '</div>'
        : '';
      const pliHtml = showPli && step.pli && step.pli.length > 0
        ? '<div class="pli-panel"><div class="pli-grid">' + step.pli.map(p =>
            '<div class="pli-item">' +
              (p.thumb ? '<img src="' + p.thumb + '" alt="' + esc(p.name) + '" />' : '') +
              '<div><div class="pli-qty">' + p.qty + '×</div><div class="pli-id">' + esc(p.partId.toUpperCase()) + '</div></div>' +
            '</div>'
          ).join('') + '</div></div>'
        : '';
      stepHud.innerHTML =
        '<div class="step-header-card glass">' +
          '<div class="step-num-big">' + step.stepNum + '</div>' +
          '<div class="step-meta">' +
            '<div class="step-chapter">' + esc(pg.chapterName || step.label || '') + '</div>' +
            (step.subLabel ? '<div class="step-chapter" style="color:var(--accent)">' + esc(step.subLabel) + '</div>' : '') +
            (step.rotationCue ? '<span class="step-cue">↻ ' + esc(step.rotationCue) + '</span>' : '') +
          '</div>' +
        '</div>' +
        siblingTabs +
        pliHtml;
      stepHud.style.display = 'flex';
      stepHud.querySelectorAll('[data-jump]').forEach((b) => {
        b.onclick = () => { curIdx = Number(b.getAttribute('data-jump')); renderView(); };
      });
    } else if (pg.kind === 'cover' || pg.kind === 'complete' || pg.kind === 'section_divider' || pg.kind === 'submodel_page' || pg.kind === 'back') {
      const ctaBtn = pg.kind === 'cover' && viewerItems.length > 1
        ? '<button id="heroStartBtn" type="button" class="pill primary">Start Building →</button>'
        : pg.kind === 'back'
          ? '<a class="pill primary" href="' + esc(DATA.editorUrl) + '" target="_blank" rel="noopener noreferrer">Open in Brick Instruction Creator ↗</a>'
          : '';
      heroEl.innerHTML =
        (pg.badge ? '<span class="hero-badge">' + esc(pg.badge) + '</span>' : '') +
        '<h1 class="hero-title">' + esc(pg.title || pg.label) + '</h1>' +
        (pg.subtitle ? '<p class="hero-sub">' + esc(pg.subtitle) + '</p>' : '') +
        (pg.note ? '<p class="hero-sub" style="font-size:11px;opacity:.85">' + esc(pg.note) + '</p>' : '') +
        (ctaBtn ? '<div class="hero-cta-row">' + ctaBtn + '</div>' : '');
      heroEl.style.display = 'flex';
      const startBtn = document.getElementById('heroStartBtn');
      if (startBtn) startBtn.onclick = () => { curIdx = Math.min(viewerItems.length - 1, curIdx + 1); renderView(); };
    } else if (pg.kind === 'bom') {
      const items = pg.bomItems || [];
      flatEl.innerHTML =
        '<div class="flat-inner">' +
          '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap">' +
            '<h2 style="margin:0;font-size:22px;font-weight:900">' + esc(pg.title || 'Parts List') + '</h2>' +
            '<span style="font-size:12px;color:var(--muted);font-weight:600">Tap parts to check them off · ' + DATA.totalPieces + ' total pcs</span>' +
          '</div>' +
          '<div class="bom-grid">' + items.map((b, bi) => {
            const key = pg.id + ':' + bi;
            return '<div class="bom-card ' + (checkedBom.has(key) ? 'checked' : '') + '" data-bom="' + key + '">' +
              (b.thumb ? '<img src="' + b.thumb + '" alt="' + esc(b.name) + '" />' : '') +
              '<div class="bom-qty">' + b.qty + '×</div>' +
              '<div class="bom-name">' + esc(b.name) + '</div>' +
              '<div class="bom-sub">' + esc((b.colorName ? b.colorName + ' · ' : '') + b.partId.toUpperCase()) + '</div>' +
            '</div>';
          }).join('') + '</div>' +
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
      flatEl.innerHTML =
        '<div class="divider-card glass">' +
          '<h2 style="margin:0 0 8px;font-size:24px;font-weight:900">' + esc(pg.title || pg.label) + '</h2>' +
          (pg.subtitle ? '<p style="margin:0;font-size:14px;color:var(--muted)">' + esc(pg.subtitle) + '</p>' : '') +
        '</div>';
      flatEl.classList.add('open');
    }

    // Update bottom dock
    document.getElementById('btnPrev').disabled = curIdx <= 0;
    document.getElementById('btnNext').disabled = curIdx >= viewerItems.length - 1;
    const pgPicker = document.getElementById('btnPagePicker');
    const stepText = step ? ('Step ' + step.stepNum + ' · Page ' + pg.num) : (pg.label + ' · Page ' + pg.num);
    pgPicker.textContent = stepText + ' / ' + DATA.pages.length;
    const scrub = document.getElementById('pageScrubber');
    scrub.max = String(Math.max(0, viewerItems.length - 1));
    scrub.value = String(curIdx);
  }

  function openDrawer() {
    const list = document.getElementById('drawerList');
    list.innerHTML = viewerItems.map((it, idx) => {
      const label = it.step ? ('Step ' + it.step.stepNum + (it.page.chapterName ? ' · ' + it.page.chapterName : '')) : it.page.label;
      return '<button type="button" class="drawer-item ' + (idx === curIdx ? 'active' : '') + '" data-idx="' + idx + '">' +
        '<span>' + esc(label) + '</span>' +
        '<span class="drawer-num">Page ' + it.page.num + '</span>' +
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
  }

  document.getElementById('btnPrev').onclick = () => { if (curIdx > 0) { curIdx--; renderView(); } };
  document.getElementById('btnNext').onclick = () => { if (curIdx < viewerItems.length - 1) { curIdx++; renderView(); } };
  document.getElementById('pageScrubber').oninput = (e) => { curIdx = Number(e.target.value) || 0; renderView(); };
  document.getElementById('btnPagePicker').onclick = openDrawer;
  document.getElementById('btnPagesTop').onclick = openDrawer;
  document.getElementById('btnCloseDrawer').onclick = () => document.getElementById('drawerBackdrop').classList.remove('open');
  document.getElementById('drawerBackdrop').onclick = (e) => { if (e.target.id === 'drawerBackdrop') e.target.classList.remove('open'); };
  document.getElementById('btnResetCam').onclick = resetCameraSmooth;
  document.getElementById('btnZoomIn').onclick = () => { targetCam = null; cam.zoom = Math.min(4.8, cam.zoom * 1.2); requestDraw(); };
  document.getElementById('btnZoomOut').onclick = () => { targetCam = null; cam.zoom = Math.max(0.4, cam.zoom / 1.2); requestDraw(); };
  document.getElementById('btnTogglePli').onclick = () => { showPli = !showPli; renderView(); };
  document.getElementById('btnToggleHl').onclick = () => { highlightNew = !highlightNew; document.getElementById('btnToggleHl').classList.toggle('active', highlightNew); requestDraw(); };

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { if (curIdx < viewerItems.length - 1) { curIdx++; renderView(); } }
    else if (e.key === 'ArrowLeft') { if (curIdx > 0) { curIdx--; renderView(); } }
    else if (e.key === 'r' || e.key === 'R') { resetCameraSmooth(); }
    else if (e.key === '+' || e.key === '=') { cam.zoom = Math.min(4.8, cam.zoom * 1.15); requestDraw(); }
    else if (e.key === '-' || e.key === '_') { cam.zoom = Math.max(0.4, cam.zoom / 1.15); requestDraw(); }
    else if (e.key === 'Escape') { document.getElementById('drawerBackdrop').classList.remove('open'); }
  });
  window.addEventListener('resize', requestDraw);

  renderView();
})();
</script>
</body>
</html>`;
}
