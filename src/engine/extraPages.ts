/**
 * Independent toggles and settings navigation helpers for manual booklet pages
 * (Front Cover, Build Complete, Parts List, and Back Cover).
 *
 * Replaces the legacy all-or-nothing `showExtras` flag while preserving full
 * backward compatibility with older IndexedDB sessions and `.biw` projects.
 */

export type ExtraPageKind = 'cover' | 'complete' | 'bom' | 'back';

export interface ExtraPagesConfig {
  showCover: boolean;
  showBuildComplete: boolean;
  showPartsList: boolean;
  showBackCover: boolean;
}

export interface LegacyExtraPagesInput extends Partial<ExtraPagesConfig> {
  showExtras?: boolean;
}

export interface ExtraPageSettingsAction {
  pageKind: ExtraPageKind;
  targetMode: 'page' | 'pan';
  openBomModal: boolean;
}

export function createDefaultExtraPagesConfig(): ExtraPagesConfig {
  return {
    showCover: true,
    showBuildComplete: true,
    showPartsList: true,
    showBackCover: true,
  };
}

/**
 * Normalizes saved extra-page flags with fallback to the legacy `showExtras`
 * boolean (or `true` when neither is present).
 */
export function normalizeExtraPagesConfig(
  raw: LegacyExtraPagesInput | null | undefined,
): ExtraPagesConfig {
  const fallback = typeof raw?.showExtras === 'boolean' ? raw.showExtras : true;
  return {
    showCover: typeof raw?.showCover === 'boolean' ? raw.showCover : fallback,
    showBuildComplete:
      typeof raw?.showBuildComplete === 'boolean' ? raw.showBuildComplete : fallback,
    showPartsList: typeof raw?.showPartsList === 'boolean' ? raw.showPartsList : fallback,
    showBackCover: typeof raw?.showBackCover === 'boolean' ? raw.showBackCover : fallback,
  };
}

export function isExtraPageEnabled(
  config: ExtraPagesConfig,
  kind: ExtraPageKind,
): boolean {
  switch (kind) {
    case 'cover':
      return Boolean(config.showCover);
    case 'complete':
      return Boolean(config.showBuildComplete);
    case 'bom':
      return Boolean(config.showPartsList);
    case 'back':
      return Boolean(config.showBackCover);
  }
}

/**
 * Describes how Page Setup's per-page "Settings" link opens settings for an
 * enabled booklet page:
 * - Cover / Build Complete / Back Cover: navigate to that page in `page` mode.
 * - Parts List: navigate to the Parts List page and open `#bomSetupModal`.
 */
export function getExtraPageSettingsAction(kind: ExtraPageKind): ExtraPageSettingsAction {
  if (kind === 'bom') {
    return {
      pageKind: 'bom',
      targetMode: 'pan',
      openBomModal: true,
    };
  }
  return {
    pageKind: kind,
    targetMode: 'page',
    openBomModal: false,
  };
}
