/**
 * Menu drawer visibility rules.
 *
 * Every button and section in the top-left menu drawer is hidden whenever it
 * cannot currently be used (e.g. no model loaded, zero model issues, no missing
 * parts to fetch online, or `.biw` project without parsed LDraw geometry for
 * regeneration/subdivision).
 */

export interface MenuVisibilityState {
  hasModel: boolean;
  hasParsedModel: boolean;
  pageCount: number;
  diagnosticCount: number;
  savedLibraryCount: number;
  hasMissingPartsToFetch: boolean;
  isFetchingLibrary: boolean;
  /** Whether Parts List pages are currently enabled in Page Setup (defaults to true). */
  showPartsList?: boolean;
}

export interface MenuVisibility {
  showModelCard: boolean;
  showCloseModel: boolean;
  showExportProject: boolean;
  showModelIssues: boolean;
  showPagePrintSection: boolean;
  showPageSetup: boolean;
  showStyle: boolean;
  showBomSetup: boolean;
  showPrintPdf: boolean;
  showFetchLibrary: boolean;
  showClearLibrary: boolean;
  showAutoGenerateSection: boolean;
  showRegenerateSteps: boolean;
  showSubdivideModel: boolean;
}

/**
 * Determines whether a divider page can be inserted after the given page.
 * `rebuildPages()` only attaches custom dividers after `kind === 'steps'` pages,
 * and each step page can host at most one divider directly after it.
 */
export function canInsertDividerAfterPage(
  page: { id?: string; kind?: string } | null | undefined,
  dividerAfter: Readonly<Record<string, unknown>> | null | undefined,
): boolean {
  if (!page || !page.id || page.kind !== 'steps') return false;
  return !dividerAfter?.[page.id];
}

/**
 * Computes which menu drawer buttons and sections should be visible based on
 * the current studio state.
 */
export function computeMenuVisibility(input: MenuVisibilityState): MenuVisibility {
  const hasModel = Boolean(input.hasModel);
  const hasParsed = hasModel && Boolean(input.hasParsedModel);
  const hasPages = hasModel && input.pageCount > 0;

  const showModelCard = hasModel;
  const showCloseModel = hasModel;
  const showExportProject = hasModel;
  const showModelIssues = hasModel && input.diagnosticCount > 0;

  const showPageSetup = hasModel;
  const showStyle = hasModel;
  const showBomSetup = hasModel && input.showPartsList !== false;
  const showPrintPdf = hasPages;
  const showPagePrintSection = showPageSetup || showStyle || showBomSetup || showPrintPdf;

  const showFetchLibrary = hasModel && (input.hasMissingPartsToFetch || input.isFetchingLibrary);
  const showClearLibrary = input.savedLibraryCount > 0;

  const showRegenerateSteps = hasParsed;
  const showSubdivideModel = hasParsed;
  const showAutoGenerateSection = showRegenerateSteps || showSubdivideModel;

  return {
    showModelCard,
    showCloseModel,
    showExportProject,
    showModelIssues,
    showPagePrintSection,
    showPageSetup,
    showStyle,
    showBomSetup,
    showPrintPdf,
    showFetchLibrary,
    showClearLibrary,
    showAutoGenerateSection,
    showRegenerateSteps,
    showSubdivideModel,
  };
}
