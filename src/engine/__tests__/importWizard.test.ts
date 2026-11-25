import { describe, expect, it } from 'vitest';
import {
  buildImportWizardSummaryItems,
  formatWizardPageFormatSummary,
  formatWizardRenderingSummary,
  formatWizardSlicingSummary,
  getFreshImportWizardDefaults,
  getWizardSubpageVisibility,
  type ImportWizardSummaryInput,
} from '../importWizard';

function baseInput(overrides: Partial<ImportWizardSummaryInput> = {}): ImportWizardSummaryInput {
  return {
    importMode: 'auto',
    activeProposal: null,
    detectDuplicates: true,
    hasFileSteps: false,
    themeName: 'Classic Blue',
    themeBuiltIn: true,
    themeBgColor: '#d8ecfd',
    themeBgColorEnd: '#b7daf9',
    themeBgType: 'gradient',
    themeAccent: '#1a73e8',
    themeText: '#172536',
    stepLighting: 'none',
    highQualityStepRender: false,
    starkBlackOutlines: true,
    outlineLineWeight: 'medium',
    highlightNew: false,
    highlightLineWeight: 'medium',
    fadeOpacity: 1.0,
    wordlessMode: true,
    paperFormat: 'screen',
    paperFormatLabel: 'Screen Fit',
    supportsOrientation: false,
    orientation: 'landscape',
    layoutSummary: 'Auto',
    density: 'balanced',
    ...overrides,
  };
}

describe('Import Wizard Engine', () => {
  it('uses clean built-in defaults on every fresh import (Classic Blue, Screen Fit, Landscape, Balanced, Wordless)', () => {
    expect(getFreshImportWizardDefaults()).toEqual({
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
    });
  });

  it('builds all five read-only default summary items linked to their editable pages', () => {
    const items = buildImportWizardSummaryItems(baseInput());
    expect(items.map((item) => item.id)).toEqual([
      'slicing',
      'theme',
      'wordless',
      'rendering',
      'format',
    ]);

    const byId = Object.fromEntries(items.map((item) => [item.id, item]));

    expect(byId.slicing.targetSubpage).toBe('slicing');
    expect(byId.slicing.targetPageLabel).toBe('Step Generation');
    expect(byId.slicing.value).toBe('Single Continuous Build');

    expect(byId.theme.targetSubpage).toBe('style');
    expect(byId.theme.targetSection).toBe('theme');
    expect(byId.theme.targetPageLabel).toBe('Style & Themes');
    expect(byId.theme.value).toBe('Classic Blue');
    expect(byId.theme.swatch?.bgColor).toBe('#d8ecfd');

    expect(byId.wordless.label).toBe('Text & Labels');
    expect(byId.wordless.targetSubpage).toBe('pageSetup');
    expect(byId.wordless.targetSection).toBe('wordless');
    expect(byId.wordless.targetPageLabel).toBe('Page Setup');
    expect(byId.wordless.value).toBe('Wordless (LEGO-Style)');

    expect(byId.rendering.targetSubpage).toBe('style');
    expect(byId.rendering.targetSection).toBe('rendering');
    expect(byId.rendering.targetPageLabel).toBe('Style & Themes');
    expect(byId.rendering.value).toBe('Flat (No Lighting)');
    expect(byId.rendering.detail).toContain('Outline all parts (Medium)');
    expect(byId.rendering.detail).toContain('No fade');

    expect(byId.format.targetSubpage).toBe('pageSetup');
    expect(byId.format.targetSection).toBe('format');
    expect(byId.format.targetPageLabel).toBe('Page Setup');
    expect(byId.format.value).toBe('Screen Fit');
    expect(byId.format.detail).toBe('Auto grid · Balanced margins');
  });

  it('formats slicing summaries for modular sections, non-modular sections, single build, and keep-file-steps', () => {
    expect(
      formatWizardSlicingSummary({
        importMode: 'keep',
        activeProposal: { title: '3 Sections', sections: [{}, {}, {}] },
        detectDuplicates: true,
      }),
    ).toEqual({
      value: 'Keep Existing File Steps',
      detail: 'Preserves STEP markers saved in your file',
    });

    expect(
      formatWizardSlicingSummary({
        importMode: 'auto',
        activeProposal: {
          title: 'Modular Floors',
          outputMode: 'modular_chapters',
          sections: [{ role: 'module' }, { role: 'module' }, { role: 'join' }],
        },
        detectDuplicates: true,
      }),
    ).toEqual({
      value: '2 Sections + Join',
      detail: 'Modular Floors · Duplicate submodels on',
    });

    expect(
      formatWizardSlicingSummary({
        importMode: 'auto',
        activeProposal: null,
        detectDuplicates: false,
      }),
    ).toEqual({
      value: 'Single Continuous Build',
      detail: 'Auto-generated steps · Duplicate submodels off',
    });
  });

  it('formats rendering style summaries across lighting modes, outline modes, and fade levels', () => {
    expect(
      formatWizardRenderingSummary({
        stepLighting: 'studio',
        highQualityStepRender: true,
        starkBlackOutlines: true,
        outlineLineWeight: 'heavy',
        highlightNew: true,
        highlightLineWeight: 'light',
        fadeOpacity: 1.0,
      }),
    ).toEqual({
      value: 'Studio Lighting',
      detail: 'Outline all parts (Heavy) · No fade',
    });

    expect(
      formatWizardRenderingSummary({
        stepLighting: 'standard',
        highQualityStepRender: false,
        starkBlackOutlines: false,
        highlightNew: true,
        highlightLineWeight: 'medium',
        fadeOpacity: 0.82,
      }),
    ).toEqual({
      value: 'Standard Lighting',
      detail: 'Outline new parts (Medium) · Subtle fade',
    });

    expect(
      formatWizardRenderingSummary({
        stepLighting: 'none',
        highQualityStepRender: false,
        starkBlackOutlines: false,
        highlightNew: false,
        fadeOpacity: 0.45,
      }),
    ).toEqual({
      value: 'Flat (No Lighting)',
      detail: 'No outlines · Heavy fade',
    });
  });

  it('formats page format summaries for orientation-aware and custom paper sizes', () => {
    expect(
      formatWizardPageFormatSummary({
        paperFormat: 'letter',
        paperFormatLabel: 'US Letter',
        supportsOrientation: true,
        orientation: 'portrait',
        layoutSummary: '2×2',
        density: 'compact',
      }),
    ).toEqual({
      value: 'US Letter · Portrait',
      detail: '2×2 grid · Compact margins',
    });

    expect(
      formatWizardPageFormatSummary({
        paperFormat: 'custom',
        paperFormatLabel: 'Custom',
        supportsOrientation: false,
        orientation: 'landscape',
        customWidth: 20,
        customHeight: 15,
        customUnit: 'cm',
        layoutSummary: 'Auto',
        density: 'spacious',
      }),
    ).toEqual({
      value: 'Custom (20×15 cm)',
      detail: 'Auto grid · Spacious margins',
    });
  });

  it('enforces project-level-only visibility and top-left back arrow on wizard sub-pages before steps are rendered', () => {
    const wizardVis = getWizardSubpageVisibility(true);
    expect(wizardVis.showStepRangeGroups).toBe(false);
    expect(wizardVis.showExtraPageSettingsLinks).toBe(false);
    expect(wizardVis.showPageSizeFitWarning).toBe(false);
    expect(wizardVis.showWordlessDestructiveNotice).toBe(false);
    expect(wizardVis.showStyleBomLink).toBe(false);
    expect(wizardVis.showStepGenDestructiveNotice).toBe(false);
    expect(wizardVis.showStylePopoverTail).toBe(false);
    expect(wizardVis.showStyleWizardChrome).toBe(true);
    expect(wizardVis.showWizardBackButton).toBe(true);

    const normalVis = getWizardSubpageVisibility(false);
    expect(normalVis.showStepRangeGroups).toBe(true);
    expect(normalVis.showExtraPageSettingsLinks).toBe(true);
    expect(normalVis.showPageSizeFitWarning).toBe(true);
    expect(normalVis.showWordlessDestructiveNotice).toBe(true);
    expect(normalVis.showStyleBomLink).toBe(true);
    expect(normalVis.showStepGenDestructiveNotice).toBe(true);
    expect(normalVis.showStylePopoverTail).toBe(true);
    expect(normalVis.showStyleWizardChrome).toBe(false);
    expect(normalVis.showWizardBackButton).toBe(false);
  });
});
