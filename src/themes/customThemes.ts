import {
  THEME_FILE_EXT,
  THEME_PACK_FORMAT,
  THEME_SINGLE_FORMAT,
  assertThemeFileName,
} from '../storage/fileFormats';
import {
  type BomConfig,
  DEFAULT_BOM_CONFIG,
  bomConfigsEqual,
  createDefaultBomConfig,
  normalizeBomConfig,
} from '../engine/partsList';

import {
  type CustomUploadedFont,
  type ThemeFontId,
  collectReferencedCustomFonts,
  sanitizeCustomUploadedFont,
  sanitizeThemeFontId,
} from './customFonts';

export {
  type BuiltInThemeFontId,
  type CustomFontFormat,
  type CustomThemeFontId,
  type CustomUploadedFont,
  type ThemeFontCategory,
  type ThemeFontCategoryMeta,
  type ThemeFontId,
  type ThemeFontOption,
  type ThemeFontRole,
  type ThemeFontSelectionLike,
  CUSTOM_FONT_EXT_MAP,
  DEFAULT_THEME_FONT,
  MAX_CUSTOM_FONT_BYTES,
  THEME_FONTS,
  THEME_FONT_CATEGORIES,
  THEME_FONT_IDS,
  applyThemeFontsToElement,
  buildCustomFontFamilyName,
  clearCustomUploadedFonts,
  collectReferencedCustomFonts,
  deriveFontDisplayName,
  ensureThemeFontsLoaded,
  generateCustomFontId,
  getAllThemeFontOptions,
  getCustomUploadedFontById,
  getCustomUploadedFonts,
  getThemeFontOption,
  getThemeFontStack,
  hydrateCustomUploadedFonts,
  isCustomThemeFontId,
  parseUploadedFontFile,
  registerCustomUploadedFont,
  sanitizeCustomUploadedFont,
  sanitizeThemeFontId,
  themeCanvasFont,
  unregisterCustomUploadedFont,
} from './customFonts';

export type ThemeBgType = 'solid' | 'gradient';

export type ThemeMinifigStyle = 'exploded' | 'sequential' | 'classic';
export type LineWeightId = 'light' | 'medium' | 'heavy' | 'extra-heavy';

export function sanitizeLineWeight(value: unknown, fallback: LineWeightId = 'medium'): LineWeightId {
  return value === 'light' || value === 'medium' || value === 'heavy' || value === 'extra-heavy'
    ? value
    : fallback;
}

/**
 * Returns clip-space (NDC) multi-tap offsets for crisp resolution-scaled WebGL line weights
 * (`light` | `medium` | `heavy` | `extra-heavy`) that bypass ANGLE/WebGL `gl.lineWidth(1)` limits.
 */
export function getLineWeightTapOffsets(
  weight: LineWeightId | string | undefined,
  width: number,
  height: number,
): Array<[number, number]> {
  const w = Math.max(1, width || 1);
  const h = Math.max(1, height || 1);
  const mode = sanitizeLineWeight(weight, 'medium');
  if (mode === 'light') return [[0, 0]];

  const scale = Math.max(0.75, Math.min(1.65, w / 1500));
  const toNdc = (px: number, py: number): [number, number] => [(2 * px) / w, (2 * py) / h];

  if (mode === 'medium') {
    const r = 0.78 * scale;
    return [[0, 0], toNdc(r, 0), toNdc(-r, 0), toNdc(0, r), toNdc(0, -r)];
  }

  if (mode === 'heavy') {
    const r1 = 0.85 * scale;
    const r2 = 1.55 * scale;
    const d2 = r2 * 0.7071;
    return [
      [0, 0],
      toNdc(r1, 0), toNdc(-r1, 0), toNdc(0, r1), toNdc(0, -r1),
      toNdc(r2, 0), toNdc(-r2, 0), toNdc(0, r2), toNdc(0, -r2),
      toNdc(d2, d2), toNdc(-d2, d2), toNdc(d2, -d2), toNdc(-d2, -d2),
    ];
  }

  // extra-heavy: filled multi-ring disk for bold, gap-free outlines
  const r1 = 0.95 * scale;
  const r2 = 1.85 * scale;
  const r3 = 2.65 * scale;
  const d2 = r2 * 0.7071;
  const d3 = r3 * 0.7071;
  return [
    [0, 0],
    toNdc(r1, 0), toNdc(-r1, 0), toNdc(0, r1), toNdc(0, -r1),
    toNdc(r2, 0), toNdc(-r2, 0), toNdc(0, r2), toNdc(0, -r2),
    toNdc(d2, d2), toNdc(-d2, d2), toNdc(d2, -d2), toNdc(-d2, -d2),
    toNdc(r3, 0), toNdc(-r3, 0), toNdc(0, r3), toNdc(0, -r3),
    toNdc(d3, d3), toNdc(-d3, d3), toNdc(d3, -d3), toNdc(-d3, -d3),
  ];
}

export type StepLightingMode = 'none' | 'standard' | 'studio';

export const STEP_LIGHTING_MODES: StepLightingMode[] = ['none', 'standard', 'studio'];

export function sanitizeStepLightingMode(
  raw: unknown,
  fallback: StepLightingMode = 'none',
): StepLightingMode {
  if (raw === 'none' || raw === 'standard' || raw === 'studio') return raw;
  return fallback;
}

export type PlacementArrowStyle = 'flat' | '3d';

export const PLACEMENT_ARROW_STYLES: PlacementArrowStyle[] = ['flat', '3d'];

export function sanitizePlacementArrowStyle(
  raw: unknown,
  fallback: PlacementArrowStyle = 'flat',
): PlacementArrowStyle {
  if (raw === 'flat' || raw === '3d') return raw;
  return fallback;
}

/**
 * Step rendering and display options that belong to a theme (formerly loose
 * Style popover toggles). Field names intentionally match the studio runtime
 * `state` keys so the active theme can be mirrored into state with a simple copy.
 */
export interface ThemeStyleOptions {
  autoPlacementArrows: boolean;
  arrowColor: string;
  arrowStyle: PlacementArrowStyle;
  arrowOutlines: boolean;
  arrowLighting: boolean;
  highlightNew: boolean;
  highlightColor: string;
  highlightLineWeight: LineWeightId;
  fadePrev: boolean;
  fadeOpacity: number;
  stepLighting: StepLightingMode;
  highQualityStepRender: boolean;
  starkBlackOutlines: boolean;
  outlineLineWeight: LineWeightId;
  showRotCues: boolean;
  showSizeGuides: boolean;
  minifigStyle: ThemeMinifigStyle;
  showMinifig1to1: boolean;
  showStepBorders: boolean;
  showPageTitle: boolean;
  showProgressBar: boolean;
  bomConfig: BomConfig;
}

export const THEME_STYLE_OPTION_KEYS: Array<keyof ThemeStyleOptions> = [
  'autoPlacementArrows',
  'arrowColor',
  'arrowStyle',
  'arrowOutlines',
  'arrowLighting',
  'highlightNew',
  'highlightColor',
  'highlightLineWeight',
  'fadePrev',
  'fadeOpacity',
  'stepLighting',
  'highQualityStepRender',
  'starkBlackOutlines',
  'outlineLineWeight',
  'showRotCues',
  'showSizeGuides',
  'minifigStyle',
  'showMinifig1to1',
  'showStepBorders',
  'showPageTitle',
  'showProgressBar',
  'bomConfig',
];

export const DEFAULT_THEME_STYLE_OPTIONS: ThemeStyleOptions = {
  autoPlacementArrows: true,
  arrowColor: '#dc2626',
  arrowStyle: 'flat',
  arrowOutlines: false,
  arrowLighting: false,
  highlightNew: false,
  highlightColor: '#ff2d55',
  highlightLineWeight: 'medium',
  fadePrev: false,
  fadeOpacity: 1.0,
  stepLighting: 'none',
  highQualityStepRender: false,
  starkBlackOutlines: true,
  outlineLineWeight: 'medium',
  showRotCues: true,
  showSizeGuides: true,
  minifigStyle: 'exploded',
  showMinifig1to1: false,
  showStepBorders: true,
  showPageTitle: true,
  showProgressBar: true,
  bomConfig: createDefaultBomConfig(),
};

/**
 * Normalizes untrusted style options, falling back field-by-field to
 * `fallback` (default: {@link DEFAULT_THEME_STYLE_OPTIONS}).
 */
export function normalizeThemeStyleOptions(
  raw: unknown,
  fallback: Partial<ThemeStyleOptions> = DEFAULT_THEME_STYLE_OPTIONS,
): ThemeStyleOptions {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const fb = {
    ...DEFAULT_THEME_STYLE_OPTIONS,
    ...fallback,
    bomConfig: normalizeBomConfig(fallback.bomConfig, DEFAULT_BOM_CONFIG),
  };
  const bool = (k: keyof ThemeStyleOptions) => (typeof r[k] === 'boolean' ? (r[k] as boolean) : (fb[k] as boolean));
  const rawFade = typeof r.fadeOpacity === 'number' && Number.isFinite(r.fadeOpacity)
    ? Math.max(0.2, Math.min(1, r.fadeOpacity))
    : fb.fadeOpacity;
  const fade = r.fadePrev === false ? 1 : rawFade;
  const fadePrev = fade < 0.99;
  const mf = r.minifigStyle === 'exploded' || r.minifigStyle === 'sequential' || r.minifigStyle === 'classic'
    ? r.minifigStyle
    : fb.minifigStyle;
  const fbLighting: StepLightingMode =
    fb.stepLighting === 'none' || fb.stepLighting === 'standard' || fb.stepLighting === 'studio'
      ? fb.stepLighting
      : (fb.highQualityStepRender ? 'studio' : 'none');
  let stepLighting: StepLightingMode;
  if (r.stepLighting === 'none' || r.stepLighting === 'standard' || r.stepLighting === 'studio') {
    stepLighting = r.stepLighting;
  } else if (typeof r.highQualityStepRender === 'boolean') {
    stepLighting = r.highQualityStepRender ? 'studio' : (fbLighting === 'none' ? 'none' : 'standard');
  } else {
    stepLighting = fbLighting;
  }
  const highQualityStepRender = stepLighting === 'studio';
  return {
    autoPlacementArrows: bool('autoPlacementArrows'),
    arrowColor: sanitizeHexColor(r.arrowColor, sanitizeHexColor(fb.arrowColor, '#dc2626')),
    arrowStyle: sanitizePlacementArrowStyle(r.arrowStyle, sanitizePlacementArrowStyle(fb.arrowStyle, 'flat')),
    arrowOutlines: bool('arrowOutlines'),
    arrowLighting: bool('arrowLighting'),
    highlightNew: bool('highlightNew'),
    highlightColor: sanitizeHexColor(r.highlightColor, sanitizeHexColor(fb.highlightColor, '#ff2d55')),
    highlightLineWeight: sanitizeLineWeight(r.highlightLineWeight, sanitizeLineWeight(fb.highlightLineWeight, 'medium')),
    fadePrev,
    fadeOpacity: fade,
    stepLighting,
    highQualityStepRender,
    starkBlackOutlines: bool('starkBlackOutlines'),
    outlineLineWeight: sanitizeLineWeight(r.outlineLineWeight, sanitizeLineWeight(fb.outlineLineWeight, 'medium')),
    showRotCues: bool('showRotCues'),
    showSizeGuides: bool('showSizeGuides'),
    minifigStyle: mf,
    showMinifig1to1: bool('showMinifig1to1'),
    showStepBorders: bool('showStepBorders'),
    showPageTitle: bool('showPageTitle'),
    showProgressBar: bool('showProgressBar'),
    bomConfig: normalizeBomConfig(r.bomConfig, fb.bomConfig),
  };
}

/** Extracts a theme's complete, normalized style options. */
export function getThemeStyleOptions(theme: Partial<ManualTheme> | null | undefined): ThemeStyleOptions {
  return normalizeThemeStyleOptions(theme);
}

/** True when every style option in `a` equals the matching option in `b`. */
export function themeStyleOptionsEqual(a: ThemeStyleOptions, b: ThemeStyleOptions): boolean {
  return THEME_STYLE_OPTION_KEYS.every((k) => {
    if (k === 'fadeOpacity') return Math.abs(a.fadeOpacity - b.fadeOpacity) < 0.001;
    if (k === 'bomConfig') return bomConfigsEqual(a.bomConfig, b.bomConfig);
    return a[k] === b[k];
  });
}

export interface ManualTheme {
  id: string;
  name: string;
  builtIn?: boolean;
  bgType: ThemeBgType;
  bgColor: string;
  bgColorEnd: string;
  bgAngle: number;
  bg: string;
  text: string;
  muted: string;
  pliBg: string;
  pliBorder: string;
  accent: string;
  calloutBg: string;
  calloutBorder: string;
  bp: boolean;
  /** Font for step numbers, titles, counts & page numbers (defaults to `public-sans`). */
  headingFont?: ThemeFontId;
  /** Font for labels, part names & body text (defaults to `public-sans`). */
  bodyFont?: ThemeFontId;
  // Rendering style, step display & Parts List style options (see ThemeStyleOptions)
  autoPlacementArrows?: boolean;
  arrowColor?: string;
  arrowStyle?: PlacementArrowStyle;
  arrowOutlines?: boolean;
  arrowLighting?: boolean;
  highlightNew?: boolean;
  highlightColor?: string;
  highlightLineWeight?: LineWeightId;
  fadePrev?: boolean;
  fadeOpacity?: number;
  stepLighting?: StepLightingMode;
  highQualityStepRender?: boolean;
  starkBlackOutlines?: boolean;
  outlineLineWeight?: LineWeightId;
  showRotCues?: boolean;
  showSizeGuides?: boolean;
  minifigStyle?: ThemeMinifigStyle;
  showMinifig1to1?: boolean;
  showStepBorders?: boolean;
  showPageTitle?: boolean;
  showProgressBar?: boolean;
  bomConfig?: BomConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeExportSinglePayload {
  format: typeof THEME_SINGLE_FORMAT;
  version: 1;
  exportedAt: string;
  theme: Omit<ManualTheme, 'builtIn'>;
  customFonts?: CustomUploadedFont[];
}

export interface ThemeExportPackPayload {
  format: typeof THEME_PACK_FORMAT;
  version: 1;
  exportedAt: string;
  themes: Array<Omit<ManualTheme, 'builtIn'>>;
  customFonts?: CustomUploadedFont[];
}

export const CUSTOM_THEMES_STORAGE_KEY = 'bic_custom_themes_v1';

const SAFE_HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SAFE_RGBA_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*(?:0|1|0?\.\d+))?\s*\)$/;

export function sanitizeCssColor(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (SAFE_HEX_RE.test(trimmed)) {
    if (trimmed.length === 4) {
      const r = trimmed[1];
      const g = trimmed[2];
      const b = trimmed[3];
      return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
    }
    return trimmed.toLowerCase();
  }
  if (SAFE_RGBA_RE.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

export function sanitizeHexColor(value: unknown, fallback: string): string {
  const safe = sanitizeCssColor(value, fallback);
  if (SAFE_HEX_RE.test(safe)) return safe;
  return toHexColor(safe, fallback);
}

function parseRgbChannels(color: string): { r: number; g: number; b: number; a: number } | null {
  const trimmed = color.trim();
  if (SAFE_HEX_RE.test(trimmed)) {
    const hex = trimmed.length === 4
      ? `${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
      : trimmed.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    };
  }
  const m = trimmed.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(0|1|0?\.\d+))?\s*\)$/);
  if (!m) return null;
  return {
    r: Math.min(255, parseInt(m[1], 10)),
    g: Math.min(255, parseInt(m[2], 10)),
    b: Math.min(255, parseInt(m[3], 10)),
    a: m[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(m[4]))) : 1,
  };
}

function channelToHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
}

/**
 * Converts any hex or rgb(a) color to a 6-digit #rrggbb hex string suitable for
 * `<input type="color">`. Translucent colors are composited over `backdropHex`.
 */
export function toHexColor(color: string, backdropHex = '#ffffff'): string {
  const fg = parseRgbChannels(color);
  if (!fg) {
    const fb = parseRgbChannels(backdropHex);
    return fb ? `#${channelToHex(fb.r)}${channelToHex(fb.g)}${channelToHex(fb.b)}` : '#ffffff';
  }
  if (fg.a >= 0.999) {
    return `#${channelToHex(fg.r)}${channelToHex(fg.g)}${channelToHex(fg.b)}`;
  }
  const bg = parseRgbChannels(backdropHex) || { r: 255, g: 255, b: 255, a: 1 };
  const r = fg.r * fg.a + bg.r * (1 - fg.a);
  const g = fg.g * fg.a + bg.g * (1 - fg.a);
  const b = fg.b * fg.a + bg.b * (1 - fg.a);
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

export function buildThemeBgCss(
  bgType: ThemeBgType,
  bgColor: string,
  bgColorEnd: string,
  bgAngle = 180,
): string {
  const start = sanitizeHexColor(bgColor, '#ffffff');
  if (bgType === 'gradient') {
    const end = sanitizeHexColor(bgColorEnd, start);
    const angle = Number.isFinite(bgAngle) ? Math.round(((bgAngle % 360) + 360) % 360) : 180;
    return `linear-gradient(${angle}deg,${start} 0%,${end} 100%)`;
  }
  return start;
}

export const BUILT_IN_THEMES: Record<string, ManualTheme> = {
  blue: {
    id: 'blue',
    name: 'Classic Blue',
    builtIn: true,
    bgType: 'gradient',
    bgColor: '#d8ecfd',
    bgColorEnd: '#b7daf9',
    bgAngle: 180,
    bg: 'linear-gradient(180deg,#d8ecfd 0%,#b7daf9 100%)',
    text: '#172536',
    muted: '#4a607a',
    pliBg: 'rgba(255,255,255,0.92)',
    pliBorder: '#8ab8e6',
    accent: '#1a73e8',
    calloutBg: '#fffbe6',
    calloutBorder: '#eab308',
    bp: false,
    headingFont: 'public-sans',
    bodyFont: 'public-sans',
    ...DEFAULT_THEME_STYLE_OPTIONS,
  },
  white: {
    id: 'white',
    name: 'Clean White',
    builtIn: true,
    bgType: 'solid',
    bgColor: '#ffffff',
    bgColorEnd: '#f1f3f4',
    bgAngle: 180,
    bg: '#ffffff',
    text: '#202124',
    muted: '#5f6368',
    pliBg: '#f8f9fa',
    pliBorder: '#dadce0',
    accent: '#1a73e8',
    calloutBg: '#f1f3f4',
    calloutBorder: '#bdc1c6',
    bp: false,
    headingFont: 'public-sans',
    bodyFont: 'public-sans',
    ...DEFAULT_THEME_STYLE_OPTIONS,
  },
  dark: {
    id: 'dark',
    name: 'Editorial Dark',
    builtIn: true,
    bgType: 'gradient',
    bgColor: '#1a1d24',
    bgColorEnd: '#101218',
    bgAngle: 160,
    bg: 'linear-gradient(160deg,#1a1d24 0%,#101218 100%)',
    text: '#f1f3f4',
    muted: '#9aa0a6',
    pliBg: 'rgba(255,255,255,0.08)',
    pliBorder: 'rgba(255,255,255,0.16)',
    accent: '#8ab4f8',
    calloutBg: 'rgba(255,255,255,0.06)',
    calloutBorder: 'rgba(255,255,255,0.2)',
    bp: false,
    headingFont: 'public-sans',
    bodyFont: 'public-sans',
    ...DEFAULT_THEME_STYLE_OPTIONS,
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    builtIn: true,
    bgType: 'solid',
    bgColor: '#0d3b66',
    bgColorEnd: '#082744',
    bgAngle: 180,
    bg: '#0d3b66',
    text: '#eef6ff',
    muted: '#9dc4e8',
    pliBg: 'rgba(9,40,72,0.88)',
    pliBorder: '#5aa9e6',
    accent: '#64dfdf',
    calloutBg: 'rgba(8,33,58,0.9)',
    calloutBorder: '#64dfdf',
    bp: true,
    headingFont: 'public-sans',
    bodyFont: 'public-sans',
    ...DEFAULT_THEME_STYLE_OPTIONS,
  },
  gray: {
    id: 'gray',
    name: 'Technical Gray',
    builtIn: true,
    bgType: 'solid',
    bgColor: '#e3e4e5',
    bgColorEnd: '#d8dade',
    bgAngle: 180,
    bg: '#e3e4e5',
    text: '#111827',
    muted: '#4b5563',
    pliBg: '#cbe2f6',
    pliBorder: '#1e293b',
    accent: '#1d4ed8',
    calloutBg: '#fff5cc',
    calloutBorder: '#1e293b',
    bp: false,
    headingFont: 'public-sans',
    bodyFont: 'public-sans',
    ...DEFAULT_THEME_STYLE_OPTIONS,
  },
};

export const BUILT_IN_THEME_IDS = new Set(Object.keys(BUILT_IN_THEMES));

export function generateCustomThemeId(): string {
  const rand = Math.random().toString(36).slice(2, 7);
  return `custom_${Date.now().toString(36)}_${rand}`;
}

function parseLegacyBgString(rawBg: unknown): {
  bgType: ThemeBgType;
  bgColor: string;
  bgColorEnd: string;
  bgAngle: number;
} | null {
  if (typeof rawBg !== 'string') return null;
  const trimmed = rawBg.trim();
  if (SAFE_HEX_RE.test(trimmed)) {
    const hex = sanitizeHexColor(trimmed, '#ffffff');
    return { bgType: 'solid', bgColor: hex, bgColorEnd: hex, bgAngle: 180 };
  }
  const gradMatch = trimmed.match(
    /^linear-gradient\(\s*(-?\d+(?:\.\d+)?)deg\s*,\s*(#[0-9a-fA-F]{3,6})(?:\s+\d+%)?\s*,\s*(#[0-9a-fA-F]{3,6})(?:\s+\d+%)?\s*\)$/i,
  );
  if (gradMatch) {
    return {
      bgType: 'gradient',
      bgAngle: Math.round(parseFloat(gradMatch[1])),
      bgColor: sanitizeHexColor(gradMatch[2], '#d8ecfd'),
      bgColorEnd: sanitizeHexColor(gradMatch[3], '#b7daf9'),
    };
  }
  return null;
}

/**
 * Normalizes a partial/untrusted theme object into a safe, complete custom `ManualTheme`.
 */
export function normalizeCustomTheme(
  input: unknown,
  fallbackBase: ManualTheme = BUILT_IN_THEMES.white,
): ManualTheme | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;

  const rawName = typeof raw.name === 'string' ? raw.name.trim() : '';
  const name = (rawName || 'Custom Theme').slice(0, 40);

  let id = typeof raw.id === 'string' ? raw.id.trim().replace(/[^a-zA-Z0-9_-]/g, '') : '';
  if (!id || BUILT_IN_THEME_IDS.has(id)) {
    id = generateCustomThemeId();
  }

  const parsedLegacy = parseLegacyBgString(raw.bg);
  const bgType: ThemeBgType =
    raw.bgType === 'gradient' || raw.bgType === 'solid'
      ? raw.bgType
      : (parsedLegacy?.bgType ?? fallbackBase.bgType);
  const bgColor = sanitizeHexColor(
    raw.bgColor ?? parsedLegacy?.bgColor,
    fallbackBase.bgColor,
  );
  const bgColorEnd = sanitizeHexColor(
    raw.bgColorEnd ?? parsedLegacy?.bgColorEnd,
    bgType === 'gradient' ? fallbackBase.bgColorEnd : bgColor,
  );
  const rawAngle = typeof raw.bgAngle === 'number'
    ? raw.bgAngle
    : (parsedLegacy?.bgAngle ?? fallbackBase.bgAngle);
  const bgAngle = Number.isFinite(rawAngle) ? Math.round(((rawAngle % 360) + 360) % 360) : 180;
  const bg = buildThemeBgCss(bgType, bgColor, bgColorEnd, bgAngle);

  const now = new Date().toISOString();
  return {
    id,
    name,
    builtIn: false,
    bgType,
    bgColor,
    bgColorEnd,
    bgAngle,
    bg,
    text: sanitizeCssColor(raw.text, fallbackBase.text),
    muted: sanitizeCssColor(raw.muted, fallbackBase.muted),
    pliBg: sanitizeCssColor(raw.pliBg, fallbackBase.pliBg),
    pliBorder: sanitizeCssColor(raw.pliBorder, fallbackBase.pliBorder),
    accent: sanitizeCssColor(raw.accent, fallbackBase.accent),
    calloutBg: sanitizeCssColor(raw.calloutBg, fallbackBase.calloutBg),
    calloutBorder: sanitizeCssColor(raw.calloutBorder, fallbackBase.calloutBorder),
    bp: typeof raw.bp === 'boolean' ? raw.bp : false,
    headingFont: sanitizeThemeFontId(raw.headingFont, sanitizeThemeFontId(fallbackBase.headingFont)),
    bodyFont: sanitizeThemeFontId(raw.bodyFont, sanitizeThemeFontId(fallbackBase.bodyFont)),
    ...normalizeThemeStyleOptions(raw, getThemeStyleOptions(fallbackBase)),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  };
}

export function createThemeDraftFromBase(base: ManualTheme, name?: string): ManualTheme {
  const now = new Date().toISOString();
  const bgColor = sanitizeHexColor(base.bgColor, '#ffffff');
  const bgColorEnd = sanitizeHexColor(base.bgColorEnd, bgColor);
  return {
    id: generateCustomThemeId(),
    name: name || (base.builtIn ? `${base.name} Custom` : `${base.name} Copy`).slice(0, 40),
    builtIn: false,
    bgType: base.bgType,
    bgColor,
    bgColorEnd,
    bgAngle: base.bgAngle,
    bg: buildThemeBgCss(base.bgType, bgColor, bgColorEnd, base.bgAngle),
    text: toHexColor(base.text, bgColor),
    muted: toHexColor(base.muted, bgColor),
    pliBg: toHexColor(base.pliBg, bgColor),
    pliBorder: toHexColor(base.pliBorder, bgColor),
    accent: toHexColor(base.accent, bgColor),
    calloutBg: toHexColor(base.calloutBg, bgColor),
    calloutBorder: toHexColor(base.calloutBorder, bgColor),
    bp: Boolean(base.bp),
    headingFont: sanitizeThemeFontId(base.headingFont),
    bodyFont: sanitizeThemeFontId(base.bodyFont),
    ...getThemeStyleOptions(base),
    createdAt: now,
    updatedAt: now,
  };
}

export function getAllThemes(customThemes: ManualTheme[]): ManualTheme[] {
  return [...Object.values(BUILT_IN_THEMES), ...customThemes];
}

export function resolveThemeById(themeId: string, customThemes: ManualTheme[]): ManualTheme {
  if (themeId && BUILT_IN_THEMES[themeId]) {
    return BUILT_IN_THEMES[themeId];
  }
  const found = customThemes.find((t) => t.id === themeId);
  return found || BUILT_IN_THEMES.blue;
}

/**
 * Applies a theme's background (solid, gradient, and optional blueprint grid) to a DOM element.
 */
export function applyThemeBackgroundToElement(el: HTMLElement, theme: ManualTheme): void {
  const baseBg = buildThemeBgCss(theme.bgType, theme.bgColor, theme.bgColorEnd, theme.bgAngle);
  if (theme.bp) {
    const gridLayers = [
      'linear-gradient(to right, rgba(116, 211, 255, 0.16) 1px, transparent 1px)',
      'linear-gradient(to bottom, rgba(116, 211, 255, 0.16) 1px, transparent 1px)',
      'linear-gradient(to right, rgba(116, 211, 255, 0.28) 1px, transparent 1px)',
      'linear-gradient(to bottom, rgba(116, 211, 255, 0.28) 1px, transparent 1px)',
    ];
    el.style.background = '';
    el.style.backgroundColor = theme.bgColor;
    if (theme.bgType === 'gradient') {
      el.style.backgroundImage = `${gridLayers.join(', ')}, ${baseBg}`;
      el.style.backgroundSize = '16px 16px, 16px 16px, 80px 80px, 80px 80px, 100% 100%';
    } else {
      el.style.backgroundImage = gridLayers.join(', ');
      el.style.backgroundSize = '16px 16px, 16px 16px, 80px 80px, 80px 80px';
    }
  } else {
    el.style.backgroundImage = '';
    el.style.backgroundSize = '';
    el.style.backgroundColor = '';
    el.style.background = baseBg;
  }
}

/**
 * Renders a theme's background (solid, angled linear gradient, and optional blueprint grid)
 * directly onto a 2D canvas context for high-resolution PDF / image export.
 */
export function fillThemeBackgroundCanvas(
  ctx: CanvasRenderingContext2D,
  theme: ManualTheme,
  pxW: number,
  pxH: number,
): void {
  if (theme.bgType === 'gradient') {
    const rad = ((theme.bgAngle - 90) * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const halfLen = (Math.abs(pxW * dx) + Math.abs(pxH * dy)) / 2;
    const cx = pxW / 2;
    const cy = pxH / 2;
    const grad = ctx.createLinearGradient(
      cx - dx * halfLen,
      cy - dy * halfLen,
      cx + dx * halfLen,
      cy + dy * halfLen,
    );
    grad.addColorStop(0, sanitizeHexColor(theme.bgColor, '#d8ecfd'));
    grad.addColorStop(1, sanitizeHexColor(theme.bgColorEnd, '#b7daf9'));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = sanitizeHexColor(theme.bgColor, '#ffffff');
  }
  ctx.fillRect(0, 0, pxW, pxH);

  if (theme.bp) {
    const minorStep = Math.max(16, Math.round(Math.min(pxW, pxH) / 48));
    const majorStep = minorStep * 5;
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(116, 211, 255, 0.14)';
    ctx.beginPath();
    for (let x = minorStep; x < pxW; x += minorStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, pxH);
    }
    for (let y = minorStep; y < pxH; y += minorStep) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(pxW, y + 0.5);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(116, 211, 255, 0.26)';
    ctx.beginPath();
    for (let x = majorStep; x < pxW; x += majorStep) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, pxH);
    }
    for (let y = majorStep; y < pxH; y += majorStep) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(pxW, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }
}

export function loadCustomThemesFromStorage(): ManualTheme[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_THEMES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const result: ManualTheme[] = [];
    const seen = new Set<string>();
    for (const item of parsed) {
      const normalized = normalizeCustomTheme(item);
      if (normalized && !seen.has(normalized.id)) {
        seen.add(normalized.id);
        result.push(normalized);
      }
    }
    return result;
  } catch {
    return [];
  }
}

export function saveCustomThemesToStorage(themes: ManualTheme[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const clean = themes.filter((t) => !t.builtIn && !BUILT_IN_THEME_IDS.has(t.id));
    localStorage.setItem(CUSTOM_THEMES_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

function stripBuiltInFlag(theme: ManualTheme): Omit<ManualTheme, 'builtIn'> {
  const { builtIn: _ignored, ...rest } = theme;
  return {
    ...rest,
    bg: buildThemeBgCss(rest.bgType, rest.bgColor, rest.bgColorEnd, rest.bgAngle),
  };
}

export function serializeThemeExport(theme: ManualTheme): string {
  const customFonts = collectReferencedCustomFonts([theme]);
  const payload: ThemeExportSinglePayload = {
    format: THEME_SINGLE_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: stripBuiltInFlag(theme),
    ...(customFonts.length > 0 ? { customFonts } : {}),
  };
  return JSON.stringify(payload, null, 2);
}

export function serializeThemesPackExport(themes: ManualTheme[]): string {
  const customFonts = collectReferencedCustomFonts(themes);
  const payload: ThemeExportPackPayload = {
    format: THEME_PACK_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    themes: themes.map(stripBuiltInFlag),
    ...(customFonts.length > 0 ? { customFonts } : {}),
  };
  return JSON.stringify(payload, null, 2);
}

export function slugifyThemeFilename(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'custom-theme';
}

function looksLikeThemeObject(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const r = obj as Record<string, unknown>;
  return (
    typeof r.name === 'string' &&
    (typeof r.bgColor === 'string' ||
      typeof r.bg === 'string' ||
      typeof r.text === 'string' ||
      typeof r.accent === 'string')
  );
}

export interface ParsedThemeImportPayload {
  themes: ManualTheme[];
  customFonts: CustomUploadedFont[];
}

/**
 * Parses a Brick Instruction Works `.biwtheme` payload (single theme or theme
 * pack) and extracts any embedded custom uploaded fonts.
 */
export function parseImportedThemesPayload(rawText: string): ParsedThemeImportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Could not parse theme file. Please select a valid ${THEME_FILE_EXT} theme file.`);
  }

  let candidates: unknown[] = [];
  let rawCustomFonts: unknown[] = [];
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (obj.format === THEME_PACK_FORMAT && obj.version === 1 && Array.isArray(obj.themes)) {
      candidates = obj.themes;
      if (Array.isArray(obj.customFonts)) rawCustomFonts = obj.customFonts;
    } else if (obj.format === THEME_SINGLE_FORMAT && obj.version === 1 && obj.theme && typeof obj.theme === 'object') {
      candidates = [obj.theme];
      if (Array.isArray(obj.customFonts)) rawCustomFonts = obj.customFonts;
    }
  }

  const normalized: ManualTheme[] = [];
  for (const item of candidates) {
    if (!looksLikeThemeObject(item)) continue;
    const theme = normalizeCustomTheme(item);
    if (theme) normalized.push(theme);
  }

  if (normalized.length === 0) {
    throw new Error(`No valid themes were found in this ${THEME_FILE_EXT} file.`);
  }

  const customFonts: CustomUploadedFont[] = [];
  const seenFontIds = new Set<string>();
  for (const rawFont of rawCustomFonts) {
    const safeFont = sanitizeCustomUploadedFont(rawFont);
    if (safeFont && !seenFontIds.has(safeFont.id)) {
      seenFontIds.add(safeFont.id);
      customFonts.push(safeFont);
    }
  }

  return { themes: normalized, customFonts };
}

/**
 * Parses a Brick Instruction Works `.biwtheme` payload (single theme or theme pack).
 */
export function parseImportedThemesJson(rawText: string): ManualTheme[] {
  return parseImportedThemesPayload(rawText).themes;
}

/**
 * Strictly validates that the file has a `.biwtheme` extension and parses its
 * theme payload.
 */
export async function parseImportedThemeFile(file: File): Promise<ManualTheme[]> {
  assertThemeFileName(file.name);
  return parseImportedThemesJson(await file.text());
}

/**
 * Strictly validates that the file has a `.biwtheme` extension and parses both
 * its themes and any embedded custom uploaded fonts.
 */
export async function parseImportedThemeFileWithFonts(file: File): Promise<ParsedThemeImportPayload> {
  assertThemeFileName(file.name);
  return parseImportedThemesPayload(await file.text());
}

/**
 * Merges imported custom themes into the user's saved list without clobbering
 * unrelated themes or built-in theme IDs.
 */
export function mergeImportedThemes(
  existing: ManualTheme[],
  incoming: ManualTheme[],
): { merged: ManualTheme[]; importedIds: string[]; updatedCount: number; addedCount: number } {
  const merged = existing.map((t) => ({ ...t }));
  const importedIds: string[] = [];
  let updatedCount = 0;
  let addedCount = 0;

  for (const rawItem of incoming) {
    const item = { ...rawItem, builtIn: false };
    const existingIdx = merged.findIndex((t) => t.id === item.id);
    if (existingIdx >= 0) {
      if (merged[existingIdx].name.toLowerCase() === item.name.toLowerCase()) {
        merged[existingIdx] = {
          ...item,
          createdAt: merged[existingIdx].createdAt || item.createdAt,
          updatedAt: new Date().toISOString(),
        };
        importedIds.push(merged[existingIdx].id);
        updatedCount++;
      } else {
        const freshId = generateCustomThemeId();
        merged.push({ ...item, id: freshId, updatedAt: new Date().toISOString() });
        importedIds.push(freshId);
        addedCount++;
      }
    } else {
      const safeId = BUILT_IN_THEME_IDS.has(item.id) ? generateCustomThemeId() : item.id;
      merged.push({ ...item, id: safeId, updatedAt: new Date().toISOString() });
      importedIds.push(safeId);
      addedCount++;
    }
  }

  return { merged, importedIds, updatedCount, addedCount };
}

// ---------------------------------------------------------------------------
// Theme recents (Style dialog theme strip is ordered by last use)
// ---------------------------------------------------------------------------

export const THEME_RECENTS_STORAGE_KEY = 'bic_theme_recents_v1';

/**
 * Orders themes for the Style dialog strip: the current theme first, then
 * themes by most recent use, then never-used themes in their default order
 * (built-ins, then custom themes in creation order).
 */
export function orderThemesByRecent(
  themes: ManualTheme[],
  recentIds: string[],
  currentId: string,
): ManualTheme[] {
  const byId = new Map(themes.map((t) => [t.id, t] as const));
  const out: ManualTheme[] = [];
  const seen = new Set<string>();
  for (const id of [currentId, ...recentIds]) {
    const t = byId.get(id);
    if (t && !seen.has(id)) {
      seen.add(id);
      out.push(t);
    }
  }
  for (const t of themes) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      out.push(t);
    }
  }
  return out;
}

/** Moves `id` to the front of the recents list (deduped, capped). */
export function touchThemeRecent(recentIds: string[], id: string, max = 64): string[] {
  if (!id) return recentIds.slice(0, max);
  return [id, ...recentIds.filter((r) => r !== id)].slice(0, max);
}

export function loadThemeRecentsFromStorage(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(THEME_RECENTS_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string').slice(0, 64) : [];
  } catch {
    return [];
  }
}

export function saveThemeRecentsToStorage(recentIds: string[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(THEME_RECENTS_STORAGE_KEY, JSON.stringify(recentIds.slice(0, 64)));
  } catch {
    // Ignore storage quota or private browsing errors
  }
}

/** Returns `desired` or `desired 2`, `desired 3`, … so theme names stay unique. */
export function makeUniqueThemeName(desired: string, existingNames: string[]): string {
  const base = (desired.trim() || 'Custom Theme').slice(0, 36);
  const taken = new Set(existingNames.map((n) => n.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base} ${i}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return base;
}
