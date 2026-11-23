import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CUSTOM_FILE_MIME_TYPE,
  PROJECT_FILE_EXT,
  PROJECT_FILE_FORMAT,
  PROJECT_FILE_STUDIO_VERSION,
  THEME_FILE_EXT,
  THEME_PACK_FILE_NAME,
  THEME_PACK_FORMAT,
  THEME_SINGLE_FORMAT,
  assertProjectFileName,
  assertThemeFileName,
  buildProjectFileName,
  buildThemeFileName,
  isProjectFileName,
  isThemeFileName,
  parseStudioProjectJson,
} from '../fileFormats';
import { downloadProjectFile, parseProjectFile } from '../projectStorage';
import {
  BUILT_IN_THEMES,
  createThemeDraftFromBase,
  parseImportedThemeFile,
  serializeThemeExport,
  serializeThemesPackExport,
} from '../../themes/customThemes';
import type { BicProjectFile } from '../../types/manual';

function makeFakeFile(name: string, content: string): File {
  return {
    name,
    text: async () => content,
  } as unknown as File;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('custom file extensions (.biw & .biwtheme)', () => {
  it('builds sanitized project (.biw) and theme (.biwtheme) filenames', () => {
    expect(buildProjectFileName('Space Explorer 2026!')).toBe(`Space_Explorer_2026${PROJECT_FILE_EXT}`);
    expect(buildProjectFileName('   ')).toBe('manual.biw');
    expect(buildThemeFileName('Sunset Studio #1')).toBe(`sunset-studio-1${THEME_FILE_EXT}`);
    expect(buildThemeFileName('***')).toBe('custom-theme.biwtheme');
    expect(THEME_PACK_FILE_NAME).toBe('brick-custom-themes.biwtheme');
  });

  it('strictly accepts only .biw for projects and rejects legacy .bic.json / .json / .bic extensions', () => {
    expect(isProjectFileName('spaceship.biw')).toBe(true);
    expect(isProjectFileName('SPACESHIP.BIW')).toBe(true);
    expect(() => assertProjectFileName('spaceship.biw')).not.toThrow();

    for (const invalid of [
      'spaceship.bic.json',
      'spaceship.json',
      'spaceship.bic',
      'spaceship.biw.json',
      'spaceship.biwtheme',
      '.biw',
      '',
    ]) {
      expect(isProjectFileName(invalid)).toBe(false);
      expect(() => assertProjectFileName(invalid)).toThrow(/\.biw/i);
    }
  });

  it('strictly accepts only .biwtheme for themes and rejects legacy .bictheme.json / .json extensions', () => {
    expect(isThemeFileName('sunset.biwtheme')).toBe(true);
    expect(isThemeFileName('SUNSET.BIWTHEME')).toBe(true);
    expect(() => assertThemeFileName('sunset.biwtheme')).not.toThrow();

    for (const invalid of [
      'sunset.bictheme.json',
      'sunset.json',
      'sunset.bictheme',
      'sunset.biwtheme.json',
      'sunset.biw',
      '.biwtheme',
      '',
    ]) {
      expect(isThemeFileName(invalid)).toBe(false);
      expect(() => assertThemeFileName(invalid)).toThrow(/\.biwtheme/i);
    }
  });

  it('strictly validates studio .biw project JSON payloads and rejects legacy v3 payloads', () => {
    const valid = JSON.stringify({
      format: PROJECT_FILE_FORMAT,
      version: PROJECT_FILE_STUDIO_VERSION,
      title: 'Lunar Rover',
      chapters: [],
    });
    const parsed = parseStudioProjectJson(valid);
    expect(parsed.title).toBe('Lunar Rover');

    // Legacy v3 payload without format header must be rejected
    const legacyV3 = JSON.stringify({ version: 3, title: 'Old Rover', chapters: [] });
    expect(() => parseStudioProjectJson(legacyV3)).toThrow(/\.biw/i);

    // Wrong format or wrong version must be rejected
    expect(() =>
      parseStudioProjectJson(JSON.stringify({ format: 'brick-instruction-creator-project', version: 4, chapters: [] })),
    ).toThrow(/\.biw/i);
    expect(() =>
      parseStudioProjectJson(JSON.stringify({ format: PROJECT_FILE_FORMAT, version: 3, chapters: [] })),
    ).toThrow(/\.biw/i);
    expect(() => parseStudioProjectJson('{bad json')).toThrow(/\.biw/i);
  });

  it('exports and imports React store projects strictly as .biw with application/octet-stream MIME type', async () => {
    const project = {
      format: PROJECT_FILE_FORMAT,
      version: 1,
      savedAt: '2026-11-23T00:00:00.000Z',
      model: { name: 'Modular Cafe', parts: [] },
      plan: { chapters: [] },
      overrides: {},
      theme: {},
      cover: {},
      back: {},
      bom: {},
    } as unknown as BicProjectFile;

    let capturedBlob: Blob | null = null;
    let capturedDownload = '';
    const fakeAnchor = {
      href: '',
      set download(val: string) {
        capturedDownload = val;
      },
      get download() {
        return capturedDownload;
      },
      click: vi.fn(),
    };

    vi.stubGlobal('URL', {
      createObjectURL: (blob: Blob) => {
        capturedBlob = blob;
        return 'blob:test';
      },
      revokeObjectURL: vi.fn(),
    });
    vi.stubGlobal('document', {
      createElement: () => fakeAnchor,
    });

    downloadProjectFile(project);
    expect(capturedDownload).toBe('Modular_Cafe.biw');
    expect(capturedBlob).not.toBeNull();
    expect(capturedBlob!.type).toBe(CUSTOM_FILE_MIME_TYPE);

    const validFile = makeFakeFile('Modular_Cafe.biw', JSON.stringify(project));
    const loaded = await parseProjectFile(validFile);
    expect(loaded.format).toBe(PROJECT_FILE_FORMAT);
    expect(loaded.model.name).toBe('Modular Cafe');

    // Legacy .bic.json filename is rejected even with valid payload
    const legacyExtFile = makeFakeFile('Modular_Cafe.bic.json', JSON.stringify(project));
    await expect(parseProjectFile(legacyExtFile)).rejects.toThrow(/\.biw/i);

    // Legacy payload without format field is rejected even if renamed to .biw
    const { format: _omit, ...legacyPayload } = project;
    const renamedLegacy = makeFakeFile('Modular_Cafe.biw', JSON.stringify(legacyPayload));
    await expect(parseProjectFile(renamedLegacy)).rejects.toThrow(/\.biw/i);
  });

  it('exports and strictly imports .biwtheme files and rejects legacy .bictheme.json files', async () => {
    const sunset = createThemeDraftFromBase(BUILT_IN_THEMES.blue, 'Sunset');
    const singleRaw = serializeThemeExport(sunset);
    expect(JSON.parse(singleRaw).format).toBe(THEME_SINGLE_FORMAT);

    const packRaw = serializeThemesPackExport([sunset]);
    expect(JSON.parse(packRaw).format).toBe(THEME_PACK_FORMAT);

    const validSingle = await parseImportedThemeFile(makeFakeFile('sunset.biwtheme', singleRaw));
    expect(validSingle).toHaveLength(1);
    expect(validSingle[0].name).toBe('Sunset');

    const validPack = await parseImportedThemeFile(makeFakeFile(THEME_PACK_FILE_NAME, packRaw));
    expect(validPack).toHaveLength(1);

    // Reject legacy extension even with new payload
    await expect(parseImportedThemeFile(makeFakeFile('sunset.bictheme.json', singleRaw))).rejects.toThrow(
      /\.biwtheme/i,
    );
    await expect(parseImportedThemeFile(makeFakeFile('sunset.json', singleRaw))).rejects.toThrow(/\.biwtheme/i);

    // Reject legacy payload even if renamed to .biwtheme
    const legacyPayload = JSON.stringify({
      format: 'brick-instruction-creator-theme',
      version: 1,
      theme: sunset,
    });
    await expect(parseImportedThemeFile(makeFakeFile('sunset.biwtheme', legacyPayload))).rejects.toThrow(
      /No valid themes/i,
    );
  });
});
