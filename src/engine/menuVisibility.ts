/**
 * Menu drawer visibility rules.
 *
 * Every button and section in the top-left menu drawer is hidden whenever it
 * cannot currently be used (e.g. no model loaded, zero model issues, no missing
 * parts to fetch online, `.bic.json` project without parsed LDraw geometry for
 * regeneration/subdivision, or current page not eligible for a divider insert).
 */

export interface MenuVisibilityState {
  hasModel: boolean;
  hasParsedModel: boolean;
  pageCount: number;
  canInsertDividerAfterCurrentPage: boolean;
  diagnosticCount: number;
  savedLibraryCount: number;
  hasMissingPartsToFetch: boolean;
  isFetchingLibrary: boolean;
}

export interface MenuVisibility {
  showModelCard: boolean;
  showExportProject: boolean;
  showModelIssues: boolean;
  showPagePrintSection: boolean;
  showPageSetup: boolean;
  showBomSetup: boolean;
  showPrintPdf: boolean;
  showFetchLibrary: boolean;
  showClearLibrary: boolean;
  showAutoGenerateSection: boolean;
  showRegenerateSteps: boolean;
  showSubdivideModel: boolean;
  showPageInsertsSection: boolean;
  showInsertDivider: boolean;
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
  const showExportProject = hasModel;
  const showModelIssues = hasModel && input.diagnosticCount > 0;

  const showPageSetup = hasModel;
  const showBomSetup = hasModel;
  const showPrintPdf = hasPages;
  const showPagePrintSection = showPageSetup || showBomSetup || showPrintPdf;

  const showFetchLibrary = hasModel && (input.hasMissingPartsToFetch || input.isFetchingLibrary);
  const showClearLibrary = input.savedLibraryCount > 0;

  const showRegenerateSteps = hasParsed;
  const showSubdivideModel = hasParsed;
  const showAutoGenerateSection = showRegenerateSteps || showSubdivideModel;

  const showInsertDivider = hasPages && Boolean(input.canInsertDividerAfterCurrentPage);
  const showPageInsertsSection = showInsertDivider;

  return {
    showModelCard,
    showExportProject,
    showModelIssues,
    showPagePrintSection,
    showPageSetup,
    showBomSetup,
    showPrintPdf,
    showFetchLibrary,
    showClearLibrary,
    showAutoGenerateSection,
    showRegenerateSteps,
    showSubdivideModel,
    showPageInsertsSection,
    showInsertDivider,
  };
}
