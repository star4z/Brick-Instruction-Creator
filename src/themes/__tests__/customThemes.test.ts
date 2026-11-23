import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  BUILT_IN_THEMES,
  CUSTOM_THEMES_STORAGE_KEY,
  buildThemeBgCss,
  createThemeDraftFromBase,
  loadCustomThemesFromStorage,
  mergeImportedThemes,
  normalizeCustomTheme,
  parseImportedThemesJson,
  resolveThemeById,
  sanitizeCssColor,
  saveCustomThemesToStorage,
  serializeThemeExport,
  serializeThemesPackExport,
  slugifyThemeFilename,
  toHexColor,
} from '../customThemes';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('customThemes utilities', () => {
  it('sanitizes valid hex and rgb(a) colors and rejects unsafe CSS values', () => {
    expect(sanitizeCssColor('#ABC', '#000000')).toBe('#aabbcc');
    expect(sanitizeCssColor(' #1A73E8 ', '#000000')).toBe('#1a73e8');
    expect(sanitizeCssColor('rgba(255, 255, 255, 0.92)', '#000000')).toBe('rgba(255, 255, 255, 0.92)');
    expect(sanitizeCssColor('red; background: url(evil)', '#123456')).toBe('#123456');
    expect(sanitizeCssColor('expression(alert(1))', '#123456')).toBe('#123456');
  });

  it('converts translucent rgba colors to composited 6-digit hex for color pickers', () => {
    expect(toHexColor('rgba(255,255,255,0.5)', '#000000')).toBe('#808080');
    expect(toHexColor('#f0a', '#ffffff')).toBe('#ff00aa');
    expect(toHexColor('rgba(255,255,255,0.08)', '#1a1d24')).toBe('#2c2f36');
  });

  it('builds solid and gradient CSS backgrounds cleanly', () => {
    expect(buildThemeBgCss('solid', '#ffffff', '#000000', 180)).toBe('#ffffff');
    expect(buildThemeBgCss('gradient', '#fff1e6', '#ffd6ba', 135)).toBe(
      'linear-gradient(135deg,#fff1e6 0%,#ffd6ba 100%)',
    );
  });

  it('normalizes legacy and partial theme objects without allowing built-in ID collisions', () => {
    const t = normalizeCustomTheme({
      id: 'blue',
      name: 'Retro Sunset',
      bg: 'linear-gradient(135deg, #ffe5d9 0%, #ffcad4 100%)',
      accent: '#d81159',
      bp: true,
    });
    expect(t).not.toBeNull();
    expect(t!.id).not.toBe('blue');
    expect(t!.id.startsWith('custom_')).toBe(true);
    expect(t!.bgType).toBe('gradient');
    expect(t!.bgColor).toBe('#ffe5d9');
    expect(t!.bgColorEnd).toBe('#ffcad4');
    expect(t!.bgAngle).toBe(135);
    expect(t!.accent).toBe('#d81159');
    expect(t!.bp).toBe(true);
  });

  it('round-trips single theme and theme pack export/import formats', () => {
    const sunset = createThemeDraftFromBase(BUILT_IN_THEMES.blue, 'Sunset Studio');
    sunset.bgColor = '#fff1e6';
    sunset.bgColorEnd = '#ffd6ba';
    sunset.accent = '#e85d04';

    const singleJson = serializeThemeExport(sunset);
    const parsedSingle = parseImportedThemesJson(singleJson);
    expect(parsedSingle).toHaveLength(1);
    expect(parsedSingle[0].name).toBe('Sunset Studio');
    expect(parsedSingle[0].bgColor).toBe('#fff1e6');
    expect(parsedSingle[0].bgColorEnd).toBe('#ffd6ba');
    expect(parsedSingle[0].accent).toBe('#e85d04');

    const forest = createThemeDraftFromBase(BUILT_IN_THEMES.dark, 'Forest Blueprint');
    forest.bgColor = '#102a1f';
    forest.bp = true;

    const packJson = serializeThemesPackExport([sunset, forest]);
    const parsedPack = parseImportedThemesJson(packJson);
    expect(parsedPack).toHaveLength(2);
    expect(parsedPack.map((t) => t.name)).toEqual(['Sunset Studio', 'Forest Blueprint']);
    expect(parsedPack[1].bp).toBe(true);
  });

  it('rejects invalid or empty theme imports with a clear error', () => {
    expect(() => parseImportedThemesJson('{not json')).toThrow(/parse theme file/i);
    expect(() => parseImportedThemesJson(JSON.stringify({ hello: 'world' }))).toThrow(/No valid themes/i);
  });

  it('merges imported themes safely without clobbering unrelated themes', () => {
    const existing = createThemeDraftFromBase(BUILT_IN_THEMES.white, 'Mint Paper');
    existing.id = 'custom_mint';

    // Re-importing same ID + same name updates in place
    const updatedIncoming = { ...existing, accent: '#0f766e' };
    const r1 = mergeImportedThemes([existing], [updatedIncoming]);
    expect(r1.merged).toHaveLength(1);
    expect(r1.updatedCount).toBe(1);
    expect(r1.merged[0].accent).toBe('#0f766e');

    // Importing same ID + different name assigns a new ID so neither is lost
    const collisionIncoming = { ...existing, name: 'Ocean Paper', accent: '#0284c7' };
    const r2 = mergeImportedThemes(r1.merged, [collisionIncoming]);
    expect(r2.merged).toHaveLength(2);
    expect(r2.addedCount).toBe(1);
    expect(r2.merged[0].id).toBe('custom_mint');
    expect(r2.merged[1].id).not.toBe('custom_mint');
    expect(r2.merged[1].name).toBe('Ocean Paper');
  });

  it('persists and loads custom themes across sessions via localStorage and falls back safely', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    });

    const theme = createThemeDraftFromBase(BUILT_IN_THEMES.blueprint, 'Cyber Grid');
    saveCustomThemesToStorage([theme, BUILT_IN_THEMES.blue]);

    expect(store.has(CUSTOM_THEMES_STORAGE_KEY)).toBe(true);
    const loaded = loadCustomThemesFromStorage();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].name).toBe('Cyber Grid');
    expect(loaded[0].bp).toBe(true);

    expect(resolveThemeById(loaded[0].id, loaded).name).toBe('Cyber Grid');
    expect(resolveThemeById('dark', loaded).name).toBe('Editorial Dark');
    expect(resolveThemeById('deleted_custom_id', loaded).id).toBe('blue');
    expect(slugifyThemeFilename('My Cool Theme #1!')).toBe('my-cool-theme-1');
  });
});
