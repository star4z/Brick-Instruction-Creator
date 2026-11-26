/**
 * Independent toggles and settings navigation helpers for manual booklet pages
 * (Front Cover, Build Complete, Parts List, and Back Cover).
 *
 * Replaces the legacy all-or-nothing `showExtras` flag while preserving full
 * backward compatibility with older IndexedDB sessions and `.biw` projects.
 */

export type ExtraPageKind =
  | 'cover'
  | 'spec_sheet'
  | 'brick_separator'
  | 'roadmap'
  | 'play_features'
  | 'complete'
  | 'bom'
  | 'back';

export interface ExtraPagesConfig {
  showCover: boolean;
  showSpecSheet?: boolean;
  showBrickSeparator?: boolean;
  showBuildRoadmap?: boolean;
  showPlayFeatures?: boolean;
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
    showSpecSheet: false,
    showBrickSeparator: false,
    showBuildRoadmap: false,
    showPlayFeatures: false,
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
    showSpecSheet: typeof raw?.showSpecSheet === 'boolean' ? raw.showSpecSheet : false,
    showBrickSeparator: typeof raw?.showBrickSeparator === 'boolean' ? raw.showBrickSeparator : false,
    showBuildRoadmap: typeof raw?.showBuildRoadmap === 'boolean' ? raw.showBuildRoadmap : false,
    showPlayFeatures: typeof raw?.showPlayFeatures === 'boolean' ? raw.showPlayFeatures : false,
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
    case 'spec_sheet':
      return Boolean(config.showSpecSheet);
    case 'brick_separator':
      return Boolean(config.showBrickSeparator);
    case 'roadmap':
      return Boolean(config.showBuildRoadmap);
    case 'play_features':
      return Boolean(config.showPlayFeatures);
    case 'complete':
      return Boolean(config.showBuildComplete);
    case 'bom':
      return Boolean(config.showPartsList);
    case 'back':
      return Boolean(config.showBackCover);
  }
}

export function canOpenExtraPageSettings(
  config: ExtraPagesConfig,
  kind: ExtraPageKind,
  hasModel: boolean,
): boolean {
  return Boolean(hasModel) && isExtraPageEnabled(config, kind);
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
