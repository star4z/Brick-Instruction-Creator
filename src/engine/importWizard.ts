/**
 * Pure state, summary formatting, and project-level visibility rules for the
 * Import Wizard.
 *
 * The Import Wizard presents a read-only summary of the defaults selected for a
 * newly imported model (Slicing, Theme, Wordless, Rendering Style, Page Format)
 * and links each item to its corresponding project-level editable page before
 * steps are rendered.
 */

export type ImportWizardSubpage = 'slicing' | 'style' | 'pageSetup';

export type ImportWizardSectionTarget =
  | 'slicing'
  | 'theme'
  | 'rendering'
  | 'wordless'
  | 'format';

export type ImportWizardItemId =
  | 'slicing'
  | 'theme'
  | 'rendering'
  | 'wordless'
  | 'format';

export interface ImportWizardThemeSwatch {
  bgColor: string;
  bgColorEnd?: string;
  bgType?: 'solid' | 'gradient';
  accent: string;
  text: string;
}

export interface ImportWizardSummaryItem {
  id: ImportWizardItemId;
  label: string;
  value: string;
  detail: string;
  targetSubpage: ImportWizardSubpage;
  targetSection: ImportWizardSectionTarget;
  /** Name of the editable project-level page this item links to. */
  targetPageLabel: string;
  swatch?: ImportWizardThemeSwatch;
}

export interface ImportWizardProposalSummary {
  title: string;
  outputMode?: string;
  sections: ReadonlyArray<{ role?: string }>;
}

export interface ImportWizardSummaryInput {
  importMode: 'auto' | 'keep';
  activeProposal: ImportWizardProposalSummary | null;
  detectDuplicates: boolean;
  hasFileSteps?: boolean;

  themeName: string;
  themeBuiltIn: boolean;
  themeBgColor: string;
  themeBgColorEnd?: string;
  themeBgType?: 'solid' | 'gradient';
  themeAccent: string;
  themeText: string;

  stepLighting?: 'none' | 'standard' | 'studio';
  highQualityStepRender: boolean;
  starkBlackOutlines: boolean;
  outlineLineWeight?: string;
  autoPlacementArrows?: boolean;
  highlightNew: boolean;
  highlightLineWeight?: string;
  fadeOpacity: number;

  wordlessMode: boolean;

  paperFormat: string;
  paperFormatLabel: string;
  supportsOrientation: boolean;
  orientation: 'landscape' | 'portrait';
  customWidth?: number;
  customHeight?: number;
  customUnit?: 'in' | 'cm';
  layoutSummary: string;
  density: 'compact' | 'balanced' | 'spacious';
  pageNumberPosition?: 'right' | 'outside';
}

export interface FreshImportWizardDefaults {
  themeId: string;
  paperFormat: string;
  orientation: 'landscape' | 'portrait';
  density: 'compact' | 'balanced' | 'spacious';
  wordlessMode: boolean;
  detectDuplicates: boolean;
  showCover: boolean;
  showBuildComplete: boolean;
  showPartsList: boolean;
  showBackCover: boolean;
}

export function getFreshImportWizardDefaults(): FreshImportWizardDefaults {
  return {
    themeId: 'blue',
    paperFormat: 'screen',
    orientation: 'landscape',
    density: 'balanced',
    wordlessMode: true,
    detectDuplicates: true,
    showCover: true,
    showBuildComplete: true,
    showPartsList: true,
    showBackCover: true,
  };
}

export interface WizardSubpageVisibility {
  /** Step Range Groups in Page Setup require rendered steps — hidden in wizard mode. */
  showStepRangeGroups: boolean;
  /** Per-page Settings links (Cover/Complete/Parts List/Back Cover) require rendered pages — hidden in wizard mode. */
  showExtraPageSettingsLinks: boolean;
  /** Step-based page-size fit warning requires rendered steps — hidden in wizard mode. */
  showPageSizeFitWarning: boolean;
  /** Destructive notices about losing manual edits only apply post-import — hidden in wizard mode. */
  showWordlessDestructiveNotice: boolean;
  /** Parts List Setup link inside Style requires an active manual — hidden in wizard mode. */
  showStyleBomLink: boolean;
  /** Step Generation destructive notice only applies post-import — hidden in wizard mode. */
  showStepGenDestructiveNotice: boolean;
  /** Popover anchor tail is hidden when Style is presented as a centered wizard modal. */
  showStylePopoverTail: boolean;
  /** Modal header & Back-to-Wizard footer inside Style are shown only in wizard mode. */
  showStyleWizardChrome: boolean;
  /** Top-left back arrow button shown on all editable subpages opened from the Import Wizard. */
  showWizardBackButton: boolean;
}

function formatLineWeightLabel(weight?: string): string {
  switch (weight) {
    case 'light':
      return 'Light';
    case 'heavy':
      return 'Heavy';
    case 'extra-heavy':
      return 'X-Heavy';
    default:
      return 'Medium';
  }
}

function formatFadeLabel(fadeOpacity: number): string {
  if (!Number.isFinite(fadeOpacity) || fadeOpacity >= 0.99) return 'No fade';
  if (fadeOpacity >= 0.74) return 'Subtle fade';
  if (fadeOpacity >= 0.55) return 'Medium fade';
  return 'Heavy fade';
}

function formatDensityLabel(density: 'compact' | 'balanced' | 'spacious'): string {
  switch (density) {
    case 'compact':
      return 'Compact';
    case 'spacious':
      return 'Spacious';
    default:
      return 'Balanced';
  }
}

export function formatWizardSlicingSummary(input: {
  importMode: 'auto' | 'keep';
  activeProposal: ImportWizardProposalSummary | null;
  detectDuplicates: boolean;
}): { value: string; detail: string } {
  if (input.importMode === 'keep') {
    return {
      value: 'Keep Existing File Steps',
      detail: '',
    };
  }

  const prop = input.activeProposal;
  if (prop && prop.sections.length > 0) {
    return {
      value: prop.title,
      detail: '',
    };
  }

  return {
    value: 'Single Continuous Build',
    detail: '',
  };
}

export function formatWizardRenderingSummary(input: {
  stepLighting?: 'none' | 'standard' | 'studio';
  highQualityStepRender: boolean;
  starkBlackOutlines: boolean;
  outlineLineWeight?: string;
  autoPlacementArrows?: boolean;
  highlightNew: boolean;
  highlightLineWeight?: string;
  fadeOpacity: number;
}): { value: string; detail: string } {
  const lighting = input.stepLighting ?? (input.highQualityStepRender ? 'studio' : 'none');
  const value =
    lighting === 'none'
      ? 'Flat (No Lighting)'
      : lighting === 'studio'
        ? 'Studio Lighting'
        : 'Standard Lighting';
  const parts: string[] = [];

  if (input.autoPlacementArrows) {
    parts.push('Placement arrows');
  }

  if (input.starkBlackOutlines) {
    parts.push(`Outline all parts (${formatLineWeightLabel(input.outlineLineWeight)})`);
  } else if (input.highlightNew) {
    parts.push(`Outline new parts (${formatLineWeightLabel(input.highlightLineWeight)})`);
  } else if (!input.autoPlacementArrows) {
    parts.push('No outlines');
  }

  parts.push(formatFadeLabel(input.fadeOpacity));
  return {
    value,
    detail: parts.join(' · '),
  };
}

export function formatWizardPageFormatSummary(input: {
  paperFormat: string;
  paperFormatLabel: string;
  supportsOrientation: boolean;
  orientation: 'landscape' | 'portrait';
  customWidth?: number;
  customHeight?: number;
  customUnit?: 'in' | 'cm';
  layoutSummary: string;
  density: 'compact' | 'balanced' | 'spacious';
  pageNumberPosition?: 'right' | 'outside';
}): { value: string; detail: string } {
  let value = input.paperFormatLabel || 'Screen Fit';
  if (input.paperFormat === 'custom' && input.customWidth && input.customHeight) {
    const unit = input.customUnit === 'cm' ? 'cm' : 'in';
    value = `Custom (${input.customWidth}×${input.customHeight} ${unit})`;
  } else if (input.supportsOrientation) {
    value = `${value} · ${input.orientation === 'portrait' ? 'Portrait' : 'Landscape'}`;
  }

  const gridLabel =
    input.layoutSummary && input.layoutSummary.trim()
      ? `${input.layoutSummary.trim()} grid`
      : 'Auto grid';
  const posSuffix = input.pageNumberPosition === 'outside' ? ' · Outside page numbers' : '';
  const detail = `${gridLabel} · ${formatDensityLabel(input.density)} margins${posSuffix}`;
  return { value, detail };
}

/**
 * Builds the read-only summary rows for the main Import Wizard page.
 * Each item displays the currently selected project-level default and links to
 * the editable project-level page that modifies it.
 */
export function buildImportWizardSummaryItems(
  input: ImportWizardSummaryInput,
): ImportWizardSummaryItem[] {
  const slicing = formatWizardSlicingSummary({
    importMode: input.importMode,
    activeProposal: input.activeProposal,
    detectDuplicates: input.detectDuplicates,
  });

  const rendering = formatWizardRenderingSummary({
    stepLighting: input.stepLighting,
    highQualityStepRender: input.highQualityStepRender,
    starkBlackOutlines: input.starkBlackOutlines,
    outlineLineWeight: input.outlineLineWeight,
    autoPlacementArrows: input.autoPlacementArrows,
    highlightNew: input.highlightNew,
    highlightLineWeight: input.highlightLineWeight,
    fadeOpacity: input.fadeOpacity,
  });

  const pageFormat = formatWizardPageFormatSummary({
    paperFormat: input.paperFormat,
    paperFormatLabel: input.paperFormatLabel,
    supportsOrientation: input.supportsOrientation,
    orientation: input.orientation,
    customWidth: input.customWidth,
    customHeight: input.customHeight,
    customUnit: input.customUnit,
    layoutSummary: input.layoutSummary,
    density: input.density,
    pageNumberPosition: input.pageNumberPosition,
  });

  return [
    {
      id: 'slicing',
      label: 'Slicing',
      value: slicing.value,
      detail: slicing.detail,
      targetSubpage: 'slicing',
      targetSection: 'slicing',
      targetPageLabel: 'Step Generation',
    },
    {
      id: 'theme',
      label: 'Theme',
      value: input.themeName || 'Classic Blue',
      detail: '',
      targetSubpage: 'style',
      targetSection: 'theme',
      targetPageLabel: 'Style & Themes',
      swatch: {
        bgColor: input.themeBgColor,
        bgColorEnd: input.themeBgColorEnd,
        bgType: input.themeBgType,
        accent: input.themeAccent,
        text: input.themeText,
      },
    },
    {
      id: 'wordless',
      label: 'Text & Labels',
      value: input.wordlessMode ? 'Wordless' : 'With Text Labels',
      detail: input.wordlessMode
        ? 'Icons, diagrams & numbers only'
        : 'Titles, section names & part names',
      targetSubpage: 'pageSetup',
      targetSection: 'wordless',
      targetPageLabel: 'Page Setup',
    },
    {
      id: 'rendering',
      label: 'Rendering Style',
      value: rendering.value,
      detail: rendering.detail,
      targetSubpage: 'style',
      targetSection: 'rendering',
      targetPageLabel: 'Style & Themes',
    },
    {
      id: 'format',
      label: 'Page Format',
      value: pageFormat.value,
      detail: pageFormat.detail,
      targetSubpage: 'pageSetup',
      targetSection: 'format',
      targetPageLabel: 'Page Setup',
    },
  ];
}

/**
 * Computes which controls are visible in sub-pages when opened from the Import
 * Wizard (project-level only, before steps are rendered) vs. post-import.
 */
export function getWizardSubpageVisibility(isWizardMode: boolean): WizardSubpageVisibility {
  return {
    showStepRangeGroups: !isWizardMode,
    showExtraPageSettingsLinks: !isWizardMode,
    showPageSizeFitWarning: !isWizardMode,
    showWordlessDestructiveNotice: !isWizardMode,
    showStyleBomLink: !isWizardMode,
    showStepGenDestructiveNotice: !isWizardMode,
    showStylePopoverTail: !isWizardMode,
    showStyleWizardChrome: isWizardMode,
    showWizardBackButton: isWizardMode,
  };
}
