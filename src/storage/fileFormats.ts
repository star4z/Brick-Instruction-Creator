/**
 * Custom file extensions, MIME types, and strict format validators for
 * Brick Instruction Works project (`.biw`) and custom theme (`.biwtheme`) files.
 *
 * Strictly enforces `.biw` and `.biwtheme` without backward compatibility for
 * legacy `.bic.json`, `.bictheme.json`, or generic `.json` files.
 */

export const PROJECT_FILE_EXT = '.biw';
export const THEME_FILE_EXT = '.biwtheme';

export const PROJECT_FILE_FORMAT = 'brick-instruction-works-project' as const;
export const PROJECT_FILE_STUDIO_VERSION = 4 as const;

export const THEME_SINGLE_FORMAT = 'brick-instruction-works-theme' as const;
export const THEME_PACK_FORMAT = 'brick-instruction-works-themes' as const;
export const THEME_PACK_FILE_NAME = `brick-custom-themes${THEME_FILE_EXT}`;

/**
 * Use `application/octet-stream` when downloading or sharing custom-extension
 * files so browsers (especially Safari/iOS) preserve `.biw` and `.biwtheme`
 * instead of silently appending `.json`.
 */
export const CUSTOM_FILE_MIME_TYPE = 'application/octet-stream';

export function isProjectFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return lower.length > PROJECT_FILE_EXT.length && lower.endsWith(PROJECT_FILE_EXT);
}

export function isThemeFileName(fileName: string): boolean {
  const lower = fileName.trim().toLowerCase();
  return lower.length > THEME_FILE_EXT.length && lower.endsWith(THEME_FILE_EXT);
}

export function assertProjectFileName(fileName: string): void {
  if (!isProjectFileName(fileName)) {
    throw new Error(`Please select a Brick Instruction Works project (${PROJECT_FILE_EXT}) file.`);
  }
}

export function assertThemeFileName(fileName: string): void {
  if (!isThemeFileName(fileName)) {
    throw new Error(`Please select a Brick Instruction Works theme (${THEME_FILE_EXT}) file.`);
  }
}

export function buildProjectFileName(title: string): string {
  const stem = title
    .trim()
    .replace(/[^a-z0-9_-]+/gi, '_')
    .replace(/^_+|_+$/g, '');
  return `${stem || 'manual'}${PROJECT_FILE_EXT}`;
}

export function buildThemeFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug || 'custom-theme'}${THEME_FILE_EXT}`;
}

export function parseStudioProjectJson(rawText: string): Record<string, unknown> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error(`Invalid Brick Instruction Works project (${PROJECT_FILE_EXT}) file.`);
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid Brick Instruction Works project (${PROJECT_FILE_EXT}) file.`);
  }

  const obj = parsed as Record<string, unknown>;
  if (
    obj.format !== PROJECT_FILE_FORMAT ||
    obj.version !== PROJECT_FILE_STUDIO_VERSION ||
    !Array.isArray(obj.chapters)
  ) {
    throw new Error(`Invalid Brick Instruction Works project (${PROJECT_FILE_EXT}) file.`);
  }

  return obj;
}
