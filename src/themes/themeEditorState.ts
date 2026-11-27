/**
 * Pure navigation and presentation state for the split Styles surfaces:
 * - Theme Selector page (shared theme browser + selection)
 * - Theme Editor page (unified editor opened from Styles, Parts List Setup,
 *   App Settings default theme, or Import Wizard)
 */

export type StylePanelView = 'selector' | 'editor';

export type ThemeEditorOrigin =
  | 'style-selector'
  | 'wizard-selector'
  | 'wizard-direct'
  | 'bom-setup'
  | 'settings';

export interface ThemeEditorSession {
  view: StylePanelView;
  origin: ThemeEditorOrigin | null;
  /**
   * Explicit theme ID being edited when the editor is NOT targeting the active
   * project's `state.themeId` (currently used when editing App Settings'
   * Custom Default theme).
   */
  targetThemeId: string | null;
}

export interface StylePanelPresentation {
  isModal: boolean;
  showSelectorView: boolean;
  showEditorView: boolean;
  showBackButton: boolean;
  showHeaderIcon: boolean;
  showCollapseAll: boolean;
  showModalClose: boolean;
  showModalFooter: boolean;
  showBomLink: boolean;
  showPopoverTail: boolean;
  headerTitle: string;
  backAriaLabel: string;
  footerButtonLabel: string;
}

export function createInitialThemeEditorSession(): ThemeEditorSession {
  return {
    view: 'selector',
    origin: null,
    targetThemeId: null,
  };
}

export function isModalThemeEditorOrigin(origin: ThemeEditorOrigin | null): boolean {
  return (
    origin === 'wizard-selector' ||
    origin === 'wizard-direct' ||
    origin === 'bom-setup' ||
    origin === 'settings'
  );
}

export function getStylePanelPresentation(
  session: ThemeEditorSession,
  isWizardStyle: boolean,
): StylePanelPresentation {
  const showEditorView = session.view === 'editor';
  const showSelectorView = !showEditorView;
  const isModal = Boolean(isWizardStyle || (showEditorView && isModalThemeEditorOrigin(session.origin)));

  let headerTitle = isWizardStyle ? 'Style & Themes' : 'Styles';
  let backAriaLabel = 'Back';
  let footerButtonLabel = 'Done';

  if (showSelectorView) {
    headerTitle = isWizardStyle ? 'Themes' : 'Styles';
    backAriaLabel = isWizardStyle ? 'Back to Import Wizard' : 'Close Styles';
    footerButtonLabel = isWizardStyle ? 'Back to Import Wizard' : 'Done';
  } else {
    headerTitle = 'Edit Theme';
    switch (session.origin) {
      case 'style-selector':
      case 'wizard-selector':
        backAriaLabel = 'Back to Themes';
        footerButtonLabel = session.origin === 'wizard-selector' ? 'Back to Import Wizard' : 'Done';
        break;
      case 'wizard-direct':
        backAriaLabel = 'Back to Import Wizard';
        footerButtonLabel = 'Back to Import Wizard';
        break;
      case 'bom-setup':
        backAriaLabel = 'Back to Parts List Setup';
        footerButtonLabel = 'Back to Parts List Setup';
        break;
      case 'settings':
        backAriaLabel = 'Back to Settings';
        footerButtonLabel = 'Back to Settings';
        break;
      default:
        backAriaLabel = 'Back to Themes';
        footerButtonLabel = 'Done';
        break;
    }
  }

  const showBackButton = showEditorView || isWizardStyle;
  const showBomLink =
    showEditorView &&
    !isWizardStyle &&
    session.origin !== 'settings' &&
    session.origin !== 'bom-setup';

  return {
    isModal,
    showSelectorView,
    showEditorView,
    showBackButton,
    showHeaderIcon: !showBackButton,
    showCollapseAll: showEditorView,
    showModalClose: isModal,
    showModalFooter: isModal,
    showBomLink,
    showPopoverTail: !isModal,
    headerTitle,
    backAriaLabel,
    footerButtonLabel,
  };
}
