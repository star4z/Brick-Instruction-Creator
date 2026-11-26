export type ThemeFontCategory = 'sans' | 'technical' | 'serif' | 'display' | 'custom';

export interface ThemeFontCategoryMeta {
  id: ThemeFontCategory;
  label: string;
}

export const THEME_FONT_CATEGORIES: readonly ThemeFontCategoryMeta[] = [
  { id: 'sans', label: 'Sans & Geometric' },
  { id: 'technical', label: 'Technical & Sci-Fi' },
  { id: 'serif', label: 'Editorial & Slab' },
  { id: 'display', label: 'Display & Playful' },
  { id: 'custom', label: 'Your Fonts' },
] as const;

export type BuiltInThemeFontId =
  | 'public-sans'
  | 'outfit'
  | 'plus-jakarta-sans'
  | 'rounded'
  | 'nunito'
  | 'rubik'
  | 'system'
  | 'condensed'
  | 'space-grotesk'
  | 'chakra-petch'
  | 'mono'
  | 'serif'
  | 'playfair-display'
  | 'slab'
  | 'bitter'
  | 'bungee'
  | 'bangers'
  | 'architects-daughter';

export type CustomThemeFontId = `uf_${string}`;
export type ThemeFontId = BuiltInThemeFontId | CustomThemeFontId;
export type ThemeFontRole = 'heading' | 'body';
export type CustomFontFormat = 'woff2' | 'woff' | 'truetype' | 'opentype';

export interface CustomUploadedFont {
  id: CustomThemeFontId;
  name: string;
  /** Strictly generated, CSS-safe FontFace family name (`BIW User <id>`). */
  family: string;
  format: CustomFontFormat;
  /** Base64 data URL (`data:font/...;base64,...`). */
  dataUrl: string;
  sizeBytes: number;
  addedAt: string;
}

export interface ThemeFontOption {
  id: ThemeFontId;
  label: string;
  category: ThemeFontCategory;
  /** Short descriptor shown in the visual font picker. */
  tagline: string;
  /** CSS `font-family` stack (also valid inside a canvas `ctx.font` string). */
  stack: string;
  /** Self-hosted family that must be loaded before canvas/PDF rendering. */
  bundledFamily?: string;
  isCustom?: boolean;
  customFont?: CustomUploadedFont;
}

export interface ThemeFontSelectionLike {
  headingFont?: ThemeFontId | string;
  bodyFont?: ThemeFontId | string;
}

const SYSTEM_SANS_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const CUSTOM_FONT_ID_RE = /^uf_[a-zA-Z0-9_-]{3,48}$/;
const SAFE_FONT_DATA_URL_RE =
  /^data:(?:font\/(?:woff2|woff|ttf|otf)|application\/(?:font-woff2?|x-font-(?:ttf|otf|woff)|octet-stream));base64,[A-Za-z0-9+/=]+$/;

export const MAX_CUSTOM_FONT_BYTES = 8 * 1024 * 1024;
const MAX_CUSTOM_FONT_DATA_URL_LEN = Math.ceil(MAX_CUSTOM_FONT_BYTES * 1.4) + 128;

export const CUSTOM_FONT_EXT_MAP: Record<string, { format: CustomFontFormat; mime: string }> = {
  '.woff2': { format: 'woff2', mime: 'font/woff2' },
  '.woff': { format: 'woff', mime: 'font/woff' },
  '.ttf': { format: 'truetype', mime: 'font/ttf' },
  '.otf': { format: 'opentype', mime: 'font/otf' },
};

/**
 * Curated, self-hosted WOFF2 font catalog for printed manual pages.
 * Legacy IDs (`rounded`, `condensed`, `serif`, `slab`) are preserved so older
 * saved themes and `.biwtheme` files upgrade seamlessly to real bundled faces.
 */
export const THEME_FONTS: Record<BuiltInThemeFontId, ThemeFontOption> = {
  // --- Sans & Geometric ---
  'public-sans': {
    id: 'public-sans',
    label: 'Public Sans',
    category: 'sans',
    tagline: 'Clean neutral sans',
    stack: `"Public Sans", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Public Sans',
  },
  outfit: {
    id: 'outfit',
    label: 'Outfit',
    category: 'sans',
    tagline: 'Crisp manual geometric',
    stack: `"Outfit", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Outfit',
  },
  'plus-jakarta-sans': {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    category: 'sans',
    tagline: 'Modern studio sans',
    stack: `"Plus Jakarta Sans", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Plus Jakarta Sans',
  },
  rounded: {
    id: 'rounded',
    label: 'Fredoka',
    category: 'sans',
    tagline: 'Playful chunky rounded',
    stack: `"Fredoka", ui-rounded, "SF Pro Rounded", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Fredoka',
  },
  nunito: {
    id: 'nunito',
    label: 'Nunito',
    category: 'sans',
    tagline: 'Soft friendly rounded',
    stack: `"Nunito", ui-rounded, ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Nunito',
  },
  rubik: {
    id: 'rubik',
    label: 'Rubik',
    category: 'sans',
    tagline: 'Rounded block geometric',
    stack: `"Rubik", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Rubik',
  },
  system: {
    id: 'system',
    label: 'System Sans',
    category: 'sans',
    tagline: 'Native OS interface',
    stack: SYSTEM_SANS_STACK,
  },

  // --- Technical & Sci-Fi ---
  condensed: {
    id: 'condensed',
    label: 'Barlow Condensed',
    category: 'technical',
    tagline: 'Industrial condensed',
    stack: `"Barlow Condensed", "Arial Narrow", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Barlow Condensed',
  },
  'space-grotesk': {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    category: 'technical',
    tagline: 'Geometric tech grotesque',
    stack: `"Space Grotesk", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Space Grotesk',
  },
  'chakra-petch': {
    id: 'chakra-petch',
    label: 'Chakra Petch',
    category: 'technical',
    tagline: 'Mecha & sci-fi square',
    stack: `"Chakra Petch", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Chakra Petch',
  },
  mono: {
    id: 'mono',
    label: 'JetBrains Mono',
    category: 'technical',
    tagline: 'Blueprint monospace',
    stack: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    bundledFamily: 'JetBrains Mono',
  },

  // --- Editorial & Slab ---
  serif: {
    id: 'serif',
    label: 'Fraunces',
    category: 'serif',
    tagline: 'Warm expressive serif',
    stack: '"Fraunces", "Iowan Old Style", Georgia, serif',
    bundledFamily: 'Fraunces',
  },
  'playfair-display': {
    id: 'playfair-display',
    label: 'Playfair Display',
    category: 'serif',
    tagline: 'Collector editorial serif',
    stack: '"Playfair Display", Georgia, "Times New Roman", serif',
    bundledFamily: 'Playfair Display',
  },
  slab: {
    id: 'slab',
    label: 'Roboto Slab',
    category: 'serif',
    tagline: 'Bold mechanical slab',
    stack: '"Roboto Slab", Rockwell, Georgia, serif',
    bundledFamily: 'Roboto Slab',
  },
  bitter: {
    id: 'bitter',
    label: 'Bitter',
    category: 'serif',
    tagline: 'Crisp modern slab',
    stack: '"Bitter", Georgia, serif',
    bundledFamily: 'Bitter',
  },

  // --- Display & Playful ---
  bungee: {
    id: 'bungee',
    label: 'Bungee',
    category: 'display',
    tagline: 'Blocky poster display',
    stack: `"Bungee", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Bungee',
  },
  bangers: {
    id: 'bangers',
    label: 'Bangers',
    category: 'display',
    tagline: 'Comic-book action',
    stack: `"Bangers", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Bangers',
  },
  'architects-daughter': {
    id: 'architects-daughter',
    label: 'Architects Daughter',
    category: 'display',
    tagline: 'Drafting hand-lettering',
    stack: `"Architects Daughter", ${SYSTEM_SANS_STACK}`,
    bundledFamily: 'Architects Daughter',
  },
};

export const THEME_FONT_IDS = Object.keys(THEME_FONTS) as BuiltInThemeFontId[];
export const DEFAULT_THEME_FONT: BuiltInThemeFontId = 'public-sans';

// ---------------------------------------------------------------------------
// Custom Uploaded Font Registry (in-memory mirror of IndexedDB store)
// ---------------------------------------------------------------------------

const customFontRegistry = new Map<CustomThemeFontId, CustomUploadedFont>();
const registeredFontFaces = new Map<CustomThemeFontId, FontFace>();

export function isCustomThemeFontId(value: unknown): value is CustomThemeFontId {
  return typeof value === 'string' && CUSTOM_FONT_ID_RE.test(value);
}

export function buildCustomFontFamilyName(id: CustomThemeFontId): string {
  return `BIW User ${id}`;
}

export function generateCustomFontId(): CustomThemeFontId {
  const rand = Math.random().toString(36).slice(2, 8);
  return `uf_${Date.now().toString(36)}_${rand}`;
}

export function deriveFontDisplayName(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, '');
  const cleaned = base
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
  return (cleaned || 'Custom Font').slice(0, 48);
}

export function sanitizeCustomUploadedFont(raw: unknown): CustomUploadedFont | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (!isCustomThemeFontId(r.id)) return null;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, 48) : '';
  if (!name) return null;
  const format = r.format;
  if (format !== 'woff2' && format !== 'woff' && format !== 'truetype' && format !== 'opentype') {
    return null;
  }
  const dataUrl = typeof r.dataUrl === 'string' ? r.dataUrl.trim() : '';
  if (!dataUrl || dataUrl.length > MAX_CUSTOM_FONT_DATA_URL_LEN || !SAFE_FONT_DATA_URL_RE.test(dataUrl)) {
    return null;
  }
  const sizeBytes =
    typeof r.sizeBytes === 'number' && Number.isFinite(r.sizeBytes) && r.sizeBytes > 0
      ? Math.round(r.sizeBytes)
      : Math.round((dataUrl.length * 3) / 4);
  if (sizeBytes > MAX_CUSTOM_FONT_BYTES) return null;

  return {
    id: r.id,
    name,
    family: buildCustomFontFamilyName(r.id),
    format,
    dataUrl,
    sizeBytes,
    addedAt: typeof r.addedAt === 'string' ? r.addedAt : new Date().toISOString(),
  };
}

function customFontToOption(font: CustomUploadedFont): ThemeFontOption {
  const kb = Math.max(1, Math.round(font.sizeBytes / 1024));
  const extLabel =
    font.format === 'truetype' ? 'TTF' : font.format === 'opentype' ? 'OTF' : font.format.toUpperCase();
  return {
    id: font.id,
    label: font.name,
    category: 'custom',
    tagline: `Uploaded ${extLabel} · ${kb} KB`,
    stack: `"${font.family}", ${SYSTEM_SANS_STACK}`,
    bundledFamily: font.family,
    isCustom: true,
    customFont: font,
  };
}

export function getCustomUploadedFonts(): CustomUploadedFont[] {
  return [...customFontRegistry.values()];
}

export function getCustomUploadedFontById(id: string): CustomUploadedFont | undefined {
  if (!isCustomThemeFontId(id)) return undefined;
  return customFontRegistry.get(id);
}

/**
 * Registers a custom uploaded font in the in-memory catalog and loads it into
 * `document.fonts` (when running in a browser) so DOM & Canvas can render it.
 */
export async function registerCustomUploadedFont(font: CustomUploadedFont): Promise<boolean> {
  const safe = sanitizeCustomUploadedFont(font);
  if (!safe) return false;

  if (typeof FontFace !== 'undefined' && typeof document !== 'undefined' && document.fonts) {
    const prev = registeredFontFaces.get(safe.id);
    if (prev) {
      try {
        document.fonts.delete(prev);
      } catch {
        // ignore
      }
      registeredFontFaces.delete(safe.id);
    }
    try {
      const face = new FontFace(safe.family, `url("${safe.dataUrl}")`);
      const loaded = await face.load();
      document.fonts.add(loaded);
      registeredFontFaces.set(safe.id, loaded);
    } catch {
      return false;
    }
  }

  customFontRegistry.set(safe.id, safe);
  return true;
}

export function unregisterCustomUploadedFont(id: string): boolean {
  if (!isCustomThemeFontId(id)) return false;
  const existed = customFontRegistry.delete(id);
  const face = registeredFontFaces.get(id);
  if (face && typeof document !== 'undefined' && document.fonts) {
    try {
      document.fonts.delete(face);
    } catch {
      // ignore
    }
  }
  registeredFontFaces.delete(id);
  return existed;
}

export function clearCustomUploadedFonts(): void {
  for (const id of [...customFontRegistry.keys()]) {
    unregisterCustomUploadedFont(id);
  }
}

/**
 * Sanitizes and registers an array of custom uploaded fonts (e.g. from
 * IndexedDB on boot, or from an imported `.biwtheme` / `.biw` file).
 */
export async function hydrateCustomUploadedFonts(rawList: unknown): Promise<CustomUploadedFont[]> {
  if (!Array.isArray(rawList)) return [];
  const registered: CustomUploadedFont[] = [];
  for (const item of rawList) {
    const safe = sanitizeCustomUploadedFont(item);
    if (!safe) continue;
    const ok = await registerCustomUploadedFont(safe);
    if (ok) registered.push(safe);
  }
  return registered;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const parts: string[] = [];
  const chunk = 0x4000;
  for (let i = 0; i < bytes.length; i += chunk) {
    parts.push(String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)) as unknown as number[]));
  }
  return btoa(parts.join(''));
}

/**
 * Reads, validates, and verifies an uploaded `.ttf`, `.otf`, `.woff2`, or
 * `.woff` file, returning a ready-to-persist {@link CustomUploadedFont}.
 */
export async function parseUploadedFontFile(file: File): Promise<CustomUploadedFont> {
  const lower = (file.name || '').toLowerCase();
  const ext = Object.keys(CUSTOM_FONT_EXT_MAP).find((e) => lower.endsWith(e));
  if (!ext) {
    throw new Error('Unsupported font file. Please choose a .ttf, .otf, .woff2, or .woff file.');
  }
  if (file.size <= 0) {
    throw new Error('Font file is empty.');
  }
  if (file.size > MAX_CUSTOM_FONT_BYTES) {
    throw new Error(`Font file is too large (max ${Math.round(MAX_CUSTOM_FONT_BYTES / (1024 * 1024))} MB).`);
  }

  const meta = CUSTOM_FONT_EXT_MAP[ext];
  const buffer = await file.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);
  const dataUrl = `data:${meta.mime};base64,${base64}`;
  const id = generateCustomFontId();
  const font: CustomUploadedFont = {
    id,
    name: deriveFontDisplayName(file.name),
    family: buildCustomFontFamilyName(id),
    format: meta.format,
    dataUrl,
    sizeBytes: file.size,
    addedAt: new Date().toISOString(),
  };

  const ok = await registerCustomUploadedFont(font);
  if (!ok) {
    throw new Error(`Could not load "${file.name}". The font file may be corrupted or unsupported.`);
  }
  return font;
}

/**
 * Collects all registered custom uploaded fonts referenced by one or more themes
 * (used when serializing `.biwtheme`, `.biw`, or interactive HTML exports).
 */
export function collectReferencedCustomFonts(themes: ThemeFontSelectionLike[]): CustomUploadedFont[] {
  const found = new Map<CustomThemeFontId, CustomUploadedFont>();
  for (const t of themes) {
    for (const id of [t.headingFont, t.bodyFont]) {
      if (isCustomThemeFontId(id)) {
        const font = customFontRegistry.get(id);
        if (font && !found.has(font.id)) found.set(font.id, font);
      }
    }
  }
  return [...found.values()];
}

// ---------------------------------------------------------------------------
// Font Lookup, Sanitization & Rendering Helpers
// ---------------------------------------------------------------------------

export function sanitizeThemeFontId(
  value: unknown,
  fallback: ThemeFontId = DEFAULT_THEME_FONT,
): ThemeFontId {
  if (typeof value === 'string') {
    if (Object.prototype.hasOwnProperty.call(THEME_FONTS, value)) {
      return value as BuiltInThemeFontId;
    }
    if (CUSTOM_FONT_ID_RE.test(value)) {
      return value as CustomThemeFontId;
    }
  }
  return fallback;
}

export function getThemeFontOption(id: ThemeFontId | string | undefined): ThemeFontOption {
  const safeId = sanitizeThemeFontId(id);
  if (Object.prototype.hasOwnProperty.call(THEME_FONTS, safeId)) {
    return THEME_FONTS[safeId as BuiltInThemeFontId];
  }
  if (isCustomThemeFontId(safeId)) {
    const custom = customFontRegistry.get(safeId);
    if (custom) return customFontToOption(custom);
  }
  return THEME_FONTS[DEFAULT_THEME_FONT];
}

export function getAllThemeFontOptions(): ThemeFontOption[] {
  return [
    ...THEME_FONT_IDS.map((id) => THEME_FONTS[id]),
    ...getCustomUploadedFonts().map(customFontToOption),
  ];
}

/** Returns the CSS font stack for a theme's heading or body role. */
export function getThemeFontStack(
  theme: ThemeFontSelectionLike | null | undefined,
  role: ThemeFontRole,
): string {
  const id = sanitizeThemeFontId(role === 'heading' ? theme?.headingFont : theme?.bodyFont);
  return getThemeFontOption(id).stack;
}

/**
 * Builds a canvas `ctx.font` string. Weights ≥ 800 (step numbers, titles,
 * counts) use the heading font; lighter weights use the body font, mirroring
 * the DOM page rule that maps `.font-extrabold` / `.font-black` to headings.
 */
export function themeCanvasFont(
  theme: ThemeFontSelectionLike | null | undefined,
  weight: number,
  px: number,
): string {
  const role: ThemeFontRole = weight >= 800 ? 'heading' : 'body';
  return `${weight} ${px}px ${getThemeFontStack(theme, role)}`;
}

/**
 * Ensures self-hosted or uploaded fonts used by a theme are loaded so canvas
 * (PDF / image) rendering never silently falls back to a default face.
 */
export async function ensureThemeFontsLoaded(
  theme: ThemeFontSelectionLike | null | undefined,
): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts?.load) return;
  const families = new Set<string>();
  for (const id of [theme?.headingFont, theme?.bodyFont]) {
    const fam = getThemeFontOption(id).bundledFamily;
    if (fam) families.add(fam);
  }
  await Promise.all(
    [...families].flatMap((fam) =>
      ['400', '500', '700', '800', '900'].map((w) => document.fonts.load(`${w} 16px "${fam}"`).catch(() => [])),
    ),
  );
}

/**
 * Applies a theme's fonts to a DOM page element: the body font is set as the
 * element's `font-family`, and the heading font is exposed through the
 * `--theme-heading-font` CSS variable (consumed by `.font-extrabold` /
 * `.font-black` rules in `index.css`).
 */
export function applyThemeFontsToElement(
  el: HTMLElement,
  theme: ThemeFontSelectionLike | null | undefined,
): void {
  el.style.fontFamily = getThemeFontStack(theme, 'body');
  el.style.setProperty('--theme-heading-font', getThemeFontStack(theme, 'heading'));
}
