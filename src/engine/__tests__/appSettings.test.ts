import { describe, expect, it } from 'vitest';
import {
  APP_SETTINGS_STORAGE_KEY,
  createDefaultAppSettings,
  createDefaultCustomImportDefaults,
  formatPhysicalDimensionsForUnit,
  loadAppSettings,
  normalizeAppSettings,
  resolveImportStartDefaults,
  resolveInitialDesktopSideMenuExpanded,
  saveAppSettings,
  shouldOpenImportWizard,
  summarizeAppSettings,
} from '../appSettings';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('App Settings Engine', () => {
  it('provides clean built-in defaults and normalizes invalid or partial inputs safely', () => {
    const def = createDefaultAppSettings();
    expect(def.defaultsMode).toBe('builtin');
    expect(def.importWizardMode).toBe('always');
    expect(def.defaultCreatorLogoSrc).toBeNull();
    expect(def.defaultCoverSubtitle).toBe('');
    expect(def.measurementUnit).toBe('in');
    expect(def.desktopSideMenuStartup).toBe('expanded');
    expect(def.missingPartsPolicy).toBe('ask');
    expect(summarizeAppSettings(def)).toBe('Defaults');

    const normalized = normalizeAppSettings({
      defaultsMode: 'invalid' as never,
      importWizardMode: 'bogus' as never,
      measurementUnit: 'mm' as never,
      defaultCreatorLogoSrc: 'https://evil.example/logo.png',
      customDefaults: {
        themeId: '  ',
        paperFormat: 'unknown_size',
        cols: 99,
        rows: -2,
        orientation: 'sideways' as never,
        density: 'dense' as never,
        wordlessMode: false,
        showCover: false,
        showBuildComplete: true,
        showPartsList: true,
        showBackCover: false,
      },
    });

    expect(normalized.defaultsMode).toBe('builtin');
    expect(normalized.importWizardMode).toBe('always');
    expect(normalized.measurementUnit).toBe('in');
    expect(normalized.defaultCreatorLogoSrc).toBeNull();
    expect(normalized.customDefaults.themeId).toBe('blue');
    expect(normalized.customDefaults.paperFormat).toBe('screen');
    expect(normalized.customDefaults.cols).toBe(6);
    expect(normalized.customDefaults.rows).toBe('auto');
    expect(normalized.customDefaults.wordlessMode).toBe(false);
    expect(normalized.customDefaults.showCover).toBe(false);
    expect(normalized.customDefaults.showBackCover).toBe(false);
  });

  it('persists and reloads settings from storage', () => {
    const store = createMemoryStorage();
    const custom = normalizeAppSettings({
      defaultsMode: 'custom',
      importWizardMode: 'when_needed',
      defaultCreatorLogoSrc: 'data:image/png;base64,AAA=',
      defaultCoverSubtitle: 'Designed by Test Studio',
      measurementUnit: 'cm',
      desktopSideMenuStartup: 'remember',
      lastDesktopSideMenuExpanded: false,
      missingPartsPolicy: 'never',
      customDefaults: {
        ...createDefaultCustomImportDefaults(),
        themeId: 'custom_1',
        paperFormat: 'a4',
        orientation: 'portrait',
        density: 'compact',
        cols: 2,
        rows: 2,
        wordlessMode: false,
      },
    });

    expect(saveAppSettings(custom, store)).toBe(true);
    expect(store.getItem(APP_SETTINGS_STORAGE_KEY)).toBeTruthy();

    const loaded = loadAppSettings(store);
    expect(loaded).toEqual(custom);
    expect(summarizeAppSettings(loaded)).toBe('Custom Defaults');
  });

  it('resolves import start defaults across Built-in, Custom, and Remember Last Used modes with deleted-theme fallback', () => {
    const lastUsed = {
      ...createDefaultCustomImportDefaults(),
      themeId: 'custom_old',
      paperFormat: 'letter',
      orientation: 'portrait' as const,
      density: 'compact' as const,
      wordlessMode: false,
    };

    // Built-in ignores lastUsed
    const builtin = resolveImportStartDefaults({
      settings: createDefaultAppSettings(),
      lastUsed,
      availableThemeIds: ['blue', 'custom_old'],
    });
    expect(builtin.themeId).toBe('blue');
    expect(builtin.paperFormat).toBe('screen');
    expect(builtin.orientation).toBe('landscape');

    // Last Used picks up lastUsed and falls back to 'blue' if the theme was deleted
    const lastUsedSettings = normalizeAppSettings({ defaultsMode: 'last_used' });
    const resolvedLast = resolveImportStartDefaults({
      settings: lastUsedSettings,
      lastUsed,
      availableThemeIds: ['blue'],
    });
    expect(resolvedLast.themeId).toBe('blue');
    expect(resolvedLast.paperFormat).toBe('letter');
    expect(resolvedLast.orientation).toBe('portrait');
    expect(resolvedLast.wordlessMode).toBe(false);

    // Custom picks user-configured defaults
    const customSettings = normalizeAppSettings({
      defaultsMode: 'custom',
      customDefaults: {
        ...createDefaultCustomImportDefaults(),
        themeId: 'dark',
        paperFormat: 'a4',
        cols: 2,
        rows: 3,
      },
    });
    const resolvedCustom = resolveImportStartDefaults({
      settings: customSettings,
      lastUsed,
      availableThemeIds: ['blue', 'dark'],
    });
    expect(resolvedCustom.themeId).toBe('dark');
    expect(resolvedCustom.paperFormat).toBe('a4');
    expect(resolvedCustom.cols).toBe(2);
    expect(resolvedCustom.rows).toBe(3);
  });

  it('evaluates Import Wizard prompt mode, desktop side menu startup, and unit-ordered dimensions', () => {
    expect(
      shouldOpenImportWizard({
        mode: 'always',
        hasSteps: false,
        submodelCount: 0,
        shouldPromptSubdivision: false,
      }),
    ).toBe(true);
    expect(
      shouldOpenImportWizard({
        mode: 'never',
        hasSteps: true,
        submodelCount: 3,
        shouldPromptSubdivision: true,
      }),
    ).toBe(false);
    expect(
      shouldOpenImportWizard({
        mode: 'when_needed',
        hasSteps: false,
        submodelCount: 0,
        shouldPromptSubdivision: false,
      }),
    ).toBe(false);
    expect(
      shouldOpenImportWizard({
        mode: 'when_needed',
        hasSteps: false,
        submodelCount: 1,
        shouldPromptSubdivision: false,
      }),
    ).toBe(true);

    expect(
      resolveInitialDesktopSideMenuExpanded(
        normalizeAppSettings({ desktopSideMenuStartup: 'expanded', lastDesktopSideMenuExpanded: false }),
      ),
    ).toBe(true);
    expect(
      resolveInitialDesktopSideMenuExpanded(
        normalizeAppSettings({ desktopSideMenuStartup: 'collapsed', lastDesktopSideMenuExpanded: true }),
      ),
    ).toBe(false);
    expect(
      resolveInitialDesktopSideMenuExpanded(
        normalizeAppSettings({ desktopSideMenuStartup: 'remember', lastDesktopSideMenuExpanded: false }),
      ),
    ).toBe(false);

    expect(formatPhysicalDimensionsForUnit(11, 8.5, 'in')).toBe('11.0 × 8.5 in · 27.9 × 21.6 cm');
    expect(formatPhysicalDimensionsForUnit(11, 8.5, 'cm')).toBe('27.9 × 21.6 cm · 11.0 × 8.5 in');
  });
});
