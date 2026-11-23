import {
  THEME_FILE_EXT,
  THEME_PACK_FORMAT,
  THEME_SINGLE_FORMAT,
  assertThemeFileName,
} from '../storage/fileFormats';

export type ThemeBgType = 'solid' | 'gradient';

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
  createdAt?: string;
  updatedAt?: string;
}

export interface ThemeExportSinglePayload {
  format: typeof THEME_SINGLE_FORMAT;
  version: 1;
  exportedAt: string;
  theme: Omit<ManualTheme, 'builtIn'>;
}

export interface ThemeExportPackPayload {
  format: typeof THEME_PACK_FORMAT;
  version: 1;
  exportedAt: string;
  themes: Array<Omit<ManualTheme, 'builtIn'>>;
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
  const payload: ThemeExportSinglePayload = {
    format: THEME_SINGLE_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    theme: stripBuiltInFlag(theme),
  };
  return JSON.stringify(payload, null, 2);
}

export function serializeThemesPackExport(themes: ManualTheme[]): string {
  const payload: ThemeExportPackPayload = {
    format: THEME_PACK_FORMAT,
    version: 1,
    exportedAt: new Date().toISOString(),
    themes: themes.map(stripBuiltInFlag),
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

/**
 * Strictly parses a Brick Instruction Works `.biwtheme` payload (single theme or
 * theme pack). Rejects legacy `.bictheme.json` and raw JSON payloads.
 */
export function parseImportedThemesJson(rawText: string): ManualTheme[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Could not parse theme file. Please select a valid ${THEME_FILE_EXT} theme file.`);
  }

  let candidates: unknown[] = [];
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (obj.format === THEME_PACK_FORMAT && obj.version === 1 && Array.isArray(obj.themes)) {
      candidates = obj.themes;
    } else if (obj.format === THEME_SINGLE_FORMAT && obj.version === 1 && obj.theme && typeof obj.theme === 'object') {
      candidates = [obj.theme];
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
  return normalized;
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
