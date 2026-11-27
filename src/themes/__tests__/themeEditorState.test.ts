import { describe, it, expect } from 'vitest';
import {
  createInitialThemeEditorSession,
  getStylePanelPresentation,
  isModalThemeEditorOrigin,
} from '../themeEditorState';

describe('themeEditorState', () => {
  it('starts in selector view with no modal origin', () => {
    const s = createInitialThemeEditorSession();
    expect(s).toEqual({ view: 'selector', origin: null, targetThemeId: null });
    const pres = getStylePanelPresentation(s, false);
    expect(pres.isModal).toBe(false);
    expect(pres.showSelectorView).toBe(true);
    expect(pres.showEditorView).toBe(false);
    expect(pres.showBackButton).toBe(false);
    expect(pres.showCollapseAll).toBe(false);
    expect(pres.showPopoverTail).toBe(true);
    expect(pres.headerTitle).toBe('Styles');
  });

  it('shows popover editor when opened from style-selector', () => {
    const pres = getStylePanelPresentation(
      { view: 'editor', origin: 'style-selector', targetThemeId: null },
      false,
    );
    expect(pres.isModal).toBe(false);
    expect(pres.showEditorView).toBe(true);
    expect(pres.showSelectorView).toBe(false);
    expect(pres.showBackButton).toBe(true);
    expect(pres.showCollapseAll).toBe(true);
    expect(pres.showBomLink).toBe(true);
    expect(pres.showPopoverTail).toBe(true);
    expect(pres.backAriaLabel).toBe('Back to Themes');
  });

  it('presents centered modal without BOM link when opened from Settings', () => {
    const pres = getStylePanelPresentation(
      { view: 'editor', origin: 'settings', targetThemeId: 'dark' },
      false,
    );
    expect(pres.isModal).toBe(true);
    expect(pres.showEditorView).toBe(true);
    expect(pres.showBackButton).toBe(true);
    expect(pres.showModalClose).toBe(true);
    expect(pres.showModalFooter).toBe(true);
    expect(pres.showBomLink).toBe(false);
    expect(pres.showPopoverTail).toBe(false);
    expect(pres.backAriaLabel).toBe('Back to Settings');
    expect(pres.footerButtonLabel).toBe('Back to Settings');
  });

  it('presents centered modal returning to Parts List Setup when opened from bom-setup', () => {
    const pres = getStylePanelPresentation(
      { view: 'editor', origin: 'bom-setup', targetThemeId: null },
      false,
    );
    expect(pres.isModal).toBe(true);
    expect(pres.showEditorView).toBe(true);
    expect(pres.showBomLink).toBe(false);
    expect(pres.backAriaLabel).toBe('Back to Parts List Setup');
    expect(pres.footerButtonLabel).toBe('Back to Parts List Setup');
  });

  it('handles Import Wizard selector and editor subpages', () => {
    const selPres = getStylePanelPresentation(
      { view: 'selector', origin: null, targetThemeId: null },
      true,
    );
    expect(selPres.isModal).toBe(true);
    expect(selPres.showSelectorView).toBe(true);
    expect(selPres.showBackButton).toBe(true);
    expect(selPres.showCollapseAll).toBe(false);
    expect(selPres.footerButtonLabel).toBe('Back to Import Wizard');

    const edFromSel = getStylePanelPresentation(
      { view: 'editor', origin: 'wizard-selector', targetThemeId: null },
      true,
    );
    expect(edFromSel.isModal).toBe(true);
    expect(edFromSel.showEditorView).toBe(true);
    expect(edFromSel.showBomLink).toBe(false);
    expect(edFromSel.backAriaLabel).toBe('Back to Themes');
    expect(edFromSel.footerButtonLabel).toBe('Back to Import Wizard');

    const edDirect = getStylePanelPresentation(
      { view: 'editor', origin: 'wizard-direct', targetThemeId: null },
      true,
    );
    expect(edDirect.isModal).toBe(true);
    expect(edDirect.backAriaLabel).toBe('Back to Import Wizard');
    expect(edDirect.footerButtonLabel).toBe('Back to Import Wizard');
  });

  it('classifies modal origins accurately', () => {
    expect(isModalThemeEditorOrigin('style-selector')).toBe(false);
    expect(isModalThemeEditorOrigin(null)).toBe(false);
    expect(isModalThemeEditorOrigin('settings')).toBe(true);
    expect(isModalThemeEditorOrigin('bom-setup')).toBe(true);
    expect(isModalThemeEditorOrigin('wizard-selector')).toBe(true);
    expect(isModalThemeEditorOrigin('wizard-direct')).toBe(true);
  });
});
