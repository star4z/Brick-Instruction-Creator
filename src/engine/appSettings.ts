/**
 * Pure app-wide Settings model, persistence helpers, and resolvers for
 * Brick Instruction Works.
 */

export const APP_SETTINGS_STORAGE_KEY = 'bic_app_settings_v1';

export type ImportDefaultsMode = 'builtin' | 'custom' | 'last_used';
export type ImportWizardPromptMode = 'always' | 'when_needed' | 'never';
export type DesktopSideMenuStartup = 'expanded' | 'collapsed' | 'remember';
export type MissingPartsFetchPolicy = 'ask' | 'auto' | 'never';
export type MeasurementUnit = 'in' | 'cm';
export type PageDensityMode = 'compact' | 'balanced' | 'spacious';
export type PageOrientationMode = 'landscape' | 'portrait';

export interface CustomImportDefaults {
  themeId: string;
  paperFormat: string;
  orientation: PageOrientationMode;
  density: PageDensityMode;
  cols: number | 'auto';
  rows: number | 'auto';
  wordlessMode: boolean;
  showCover: boolean;
  showBuildComplete: boolean;
  showPartsList: boolean;
  showBackCover: boolean;
}

export interface AppSettings {
  defaultsMode: ImportDefaultsMode;
  customDefaults: CustomImportDefaults;
  importWizardMode: ImportWizardPromptMode;
  defaultCreatorLogoSrc: string | null;
  defaultCoverSubtitle: string;
  measurementUnit: MeasurementUnit;
  desktopSideMenuStartup: DesktopSideMenuStartup;
  lastDesktopSideMenuExpanded: boolean;
  missingPartsPolicy: MissingPartsFetchPolicy;
}

const VALID_DEFAULTS_MODES = new Set<ImportDefaultsMode>(['builtin', 'custom', 'last_used']);
const VALID_WIZARD_MODES = new Set<ImportWizardPromptMode>(['always', 'when_needed', 'never']);
const VALID_MENU_STARTUP = new Set<DesktopSideMenuStartup>(['expanded', 'collapsed', 'remember']);
const VALID_MISSING_PARTS_POLICY = new Set<MissingPartsFetchPolicy>(['ask', 'auto', 'never']);
const VALID_UNITS = new Set<MeasurementUnit>(['in', 'cm']);
const VALID_DENSITIES = new Set<PageDensityMode>(['compact', 'balanced', 'spacious']);
const VALID_ORIENTATIONS = new Set<PageOrientationMode>(['landscape', 'portrait']);
const VALID_PAPER_FORMATS = new Set<string>([
  'screen',
  'letter',
  'a4',
  'a5',
  'b5',
  'half_letter',
  'legal',
  'tabloid',
  'a3',
  'square',
  'custom',
]);

function sanitizeGridDim(val: unknown): number | 'auto' {
  if (val === 'auto' || val === null || val === undefined || val === '') return 'auto';
  const n = Math.round(Number(val));
  if (!Number.isFinite(n) || n < 1) return 'auto';
  return Math.min(6, Math.max(1, n));
}

export function createDefaultCustomImportDefaults(): CustomImportDefaults {
  return {
    themeId: 'blue',
    paperFormat: 'screen',
    orientation: 'landscape',
    density: 'balanced',
    cols: 'auto',
    rows: 'auto',
    wordlessMode: true,
    showCover: true,
    showBuildComplete: true,
    showPartsList: true,
    showBackCover: true,
  };
}

export function createDefaultAppSettings(): AppSettings {
  return {
    defaultsMode: 'builtin',
    customDefaults: createDefaultCustomImportDefaults(),
    importWizardMode: 'always',
    defaultCreatorLogoSrc: null,
    defaultCoverSubtitle: '',
    measurementUnit: 'in',
    desktopSideMenuStartup: 'expanded',
    lastDesktopSideMenuExpanded: true,
    missingPartsPolicy: 'ask',
  };
}

export function normalizeCustomImportDefaults(
  raw: Partial<CustomImportDefaults> | null | undefined,
): CustomImportDefaults {
  const def = createDefaultCustomImportDefaults();
  if (!raw || typeof raw !== 'object') return def;

  const themeId =
    typeof raw.themeId === 'string' && raw.themeId.trim().length > 0
      ? raw.themeId.trim()
      : def.themeId;
  const paperFormat =
    typeof raw.paperFormat === 'string' && VALID_PAPER_FORMATS.has(raw.paperFormat)
      ? raw.paperFormat
      : def.paperFormat;
  const orientation = VALID_ORIENTATIONS.has(raw.orientation as PageOrientationMode)
    ? (raw.orientation as PageOrientationMode)
    : def.orientation;
  const density = VALID_DENSITIES.has(raw.density as PageDensityMode)
    ? (raw.density as PageDensityMode)
    : def.density;

  return {
    themeId,
    paperFormat,
    orientation,
    density,
    cols: sanitizeGridDim(raw.cols),
    rows: sanitizeGridDim(raw.rows),
    wordlessMode: typeof raw.wordlessMode === 'boolean' ? raw.wordlessMode : def.wordlessMode,
    showCover: typeof raw.showCover === 'boolean' ? raw.showCover : def.showCover,
    showBuildComplete:
      typeof raw.showBuildComplete === 'boolean' ? raw.showBuildComplete : def.showBuildComplete,
    showPartsList: typeof raw.showPartsList === 'boolean' ? raw.showPartsList : def.showPartsList,
    showBackCover: typeof raw.showBackCover === 'boolean' ? raw.showBackCover : def.showBackCover,
  };
}

export function normalizeAppSettings(
  raw: Partial<AppSettings> | null | undefined,
): AppSettings {
  const def = createDefaultAppSettings();
  if (!raw || typeof raw !== 'object') return def;

  const defaultsMode = VALID_DEFAULTS_MODES.has(raw.defaultsMode as ImportDefaultsMode)
    ? (raw.defaultsMode as ImportDefaultsMode)
    : def.defaultsMode;
  const importWizardMode = VALID_WIZARD_MODES.has(raw.importWizardMode as ImportWizardPromptMode)
    ? (raw.importWizardMode as ImportWizardPromptMode)
    : def.importWizardMode;
  const desktopSideMenuStartup = VALID_MENU_STARTUP.has(
    raw.desktopSideMenuStartup as DesktopSideMenuStartup,
  )
    ? (raw.desktopSideMenuStartup as DesktopSideMenuStartup)
    : def.desktopSideMenuStartup;
  const missingPartsPolicy = VALID_MISSING_PARTS_POLICY.has(
    raw.missingPartsPolicy as MissingPartsFetchPolicy,
  )
    ? (raw.missingPartsPolicy as MissingPartsFetchPolicy)
    : def.missingPartsPolicy;
  const measurementUnit = VALID_UNITS.has(raw.measurementUnit as MeasurementUnit)
    ? (raw.measurementUnit as MeasurementUnit)
    : def.measurementUnit;

  const defaultCreatorLogoSrc =
    typeof raw.defaultCreatorLogoSrc === 'string' &&
    raw.defaultCreatorLogoSrc.startsWith('data:image/')
      ? raw.defaultCreatorLogoSrc
      : null;

  const defaultCoverSubtitle =
    typeof raw.defaultCoverSubtitle === 'string'
      ? raw.defaultCoverSubtitle.slice(0, 120)
      : def.defaultCoverSubtitle;

  return {
    defaultsMode,
    customDefaults: normalizeCustomImportDefaults(raw.customDefaults),
    importWizardMode,
    defaultCreatorLogoSrc,
    defaultCoverSubtitle,
    measurementUnit,
    desktopSideMenuStartup,
    lastDesktopSideMenuExpanded:
      typeof raw.lastDesktopSideMenuExpanded === 'boolean'
        ? raw.lastDesktopSideMenuExpanded
        : def.lastDesktopSideMenuExpanded,
    missingPartsPolicy,
  };
}

export function loadAppSettings(storage?: Pick<Storage, 'getItem'> | null): AppSettings {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return createDefaultAppSettings();
    const raw = store.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!raw) return createDefaultAppSettings();
    return normalizeAppSettings(JSON.parse(raw));
  } catch {
    return createDefaultAppSettings();
  }
}

export function saveAppSettings(
  settings: AppSettings,
  storage?: Pick<Storage, 'setItem'> | null,
): boolean {
  try {
    const store = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return false;
    store.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(normalizeAppSettings(settings)));
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the project-level defaults to apply when starting a fresh model import.
 */
export function resolveImportStartDefaults(input: {
  settings: AppSettings;
  lastUsed?: Partial<CustomImportDefaults> | null;
  availableThemeIds?: ReadonlySet<string> | ReadonlyArray<string>;
}): CustomImportDefaults {
  const { settings, lastUsed, availableThemeIds } = input;
  const themeSet = availableThemeIds
    ? availableThemeIds instanceof Set
      ? availableThemeIds
      : new Set(availableThemeIds)
    : null;

  let resolved: CustomImportDefaults;
  if (settings.defaultsMode === 'custom') {
    resolved = normalizeCustomImportDefaults(settings.customDefaults);
  } else if (settings.defaultsMode === 'last_used' && lastUsed) {
    resolved = normalizeCustomImportDefaults(lastUsed);
  } else {
    resolved = createDefaultCustomImportDefaults();
  }

  if (themeSet && !themeSet.has(resolved.themeId)) {
    resolved = { ...resolved, themeId: 'blue' };
  }
  return resolved;
}

export function shouldOpenImportWizard(input: {
  mode: ImportWizardPromptMode;
  hasSteps: boolean;
  submodelCount: number;
  shouldPromptSubdivision: boolean;
}): boolean {
  if (input.mode === 'always') return true;
  if (input.mode === 'never') return false;
  return Boolean(input.hasSteps || input.submodelCount > 0 || input.shouldPromptSubdivision);
}

export function resolveInitialDesktopSideMenuExpanded(settings: AppSettings): boolean {
  if (settings.desktopSideMenuStartup === 'collapsed') return false;
  if (settings.desktopSideMenuStartup === 'remember') {
    return Boolean(settings.lastDesktopSideMenuExpanded);
  }
  return true;
}

export function formatPhysicalDimensionsForUnit(
  wIn: number,
  hIn: number,
  unit: MeasurementUnit = 'in',
): string {
  const wCm = wIn * 2.54;
  const hCm = hIn * 2.54;
  if (unit === 'cm') {
    return `${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm · ${wIn.toFixed(1)} × ${hIn.toFixed(1)} in`;
  }
  return `${wIn.toFixed(1)} × ${hIn.toFixed(1)} in · ${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm`;
}

export function summarizeAppSettings(settings: AppSettings): string {
  const def = createDefaultAppSettings();
  const isModified =
    settings.defaultsMode !== def.defaultsMode ||
    settings.importWizardMode !== def.importWizardMode ||
    Boolean(settings.defaultCreatorLogoSrc) ||
    settings.defaultCoverSubtitle.trim().length > 0 ||
    settings.measurementUnit !== def.measurementUnit ||
    settings.desktopSideMenuStartup !== def.desktopSideMenuStartup ||
    settings.missingPartsPolicy !== def.missingPartsPolicy;

  if (!isModified) return 'Defaults';
  if (settings.defaultsMode === 'custom') return 'Custom Defaults';
  if (settings.defaultsMode === 'last_used') return 'Last Used';
  return 'Customized';
}
