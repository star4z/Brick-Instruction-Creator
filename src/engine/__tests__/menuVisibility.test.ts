import { describe, expect, it } from 'vitest';
import {
  canInsertDividerAfterPage,
  computeMenuVisibility,
  type MenuVisibilityState,
} from '../menuVisibility';

function baseState(overrides: Partial<MenuVisibilityState> = {}): MenuVisibilityState {
  return {
    hasModel: false,
    hasParsedModel: false,
    pageCount: 0,
    diagnosticCount: 0,
    savedLibraryCount: 0,
    hasMissingPartsToFetch: false,
    isFetchingLibrary: false,
    ...overrides,
  };
}

describe('computeMenuVisibility', () => {
  it('hides all model-dependent sections and unavailable buttons when no model is loaded', () => {
    const vis = computeMenuVisibility(baseState());
    expect(vis).toEqual({
      showModelCard: false,
      showCloseModel: false,
      showExportProject: false,
      showModelIssues: false,
      showPagePrintSection: false,
      showPageSetup: false,
      showBomSetup: false,
      showPrintPdf: false,
      showFetchLibrary: false,
      showClearLibrary: false,
      showAutoGenerateSection: false,
      showRegenerateSteps: false,
      showSubdivideModel: false,
    });
  });

  it('shows Clear library button even without a model when saved parts exist', () => {
    const vis = computeMenuVisibility(baseState({ savedLibraryCount: 42 }));
    expect(vis.showClearLibrary).toBe(true);
    expect(vis.showFetchLibrary).toBe(false);
  });

  it('hides Model Issues when a model has zero diagnostics and shows it when diagnostics exist', () => {
    const clean = computeMenuVisibility(baseState({ hasModel: true, pageCount: 5, diagnosticCount: 0 }));
    expect(clean.showModelIssues).toBe(false);

    const withIssues = computeMenuVisibility(baseState({ hasModel: true, pageCount: 5, diagnosticCount: 3 }));
    expect(withIssues.showModelIssues).toBe(true);
  });

  it('hides Print / Save PDF when no pages exist and shows it when pages are available', () => {
    const noPages = computeMenuVisibility(baseState({ hasModel: true, pageCount: 0 }));
    expect(noPages.showPrintPdf).toBe(false);
    expect(noPages.showPagePrintSection).toBe(true);

    const withPages = computeMenuVisibility(baseState({ hasModel: true, pageCount: 8 }));
    expect(withPages.showPrintPdf).toBe(true);
  });

  it('hides Auto-Generate Steps for imported .biw projects without parsed LDraw data', () => {
    const projectOnly = computeMenuVisibility(
      baseState({
        hasModel: true,
        hasParsedModel: false,
        pageCount: 6,
      }),
    );
    expect(projectOnly.showModelCard).toBe(true);
    expect(projectOnly.showCloseModel).toBe(true);
    expect(projectOnly.showExportProject).toBe(true);
    expect(projectOnly.showPagePrintSection).toBe(true);
    expect(projectOnly.showAutoGenerateSection).toBe(false);
    expect(projectOnly.showRegenerateSteps).toBe(false);
    expect(projectOnly.showSubdivideModel).toBe(false);
  });

  it('shows Auto-Generate Steps when a parsed .io/.ldr/.mpd model is loaded', () => {
    const parsed = computeMenuVisibility(
      baseState({
        hasModel: true,
        hasParsedModel: true,
        pageCount: 12,
      }),
    );
    expect(parsed.showAutoGenerateSection).toBe(true);
    expect(parsed.showRegenerateSteps).toBe(true);
    expect(parsed.showSubdivideModel).toBe(true);
  });

  it('shows Fetch Missing Parts Online only when a loaded model has missing parts or a fetch is active', () => {
    const allLoaded = computeMenuVisibility(
      baseState({ hasModel: true, pageCount: 4, hasMissingPartsToFetch: false }),
    );
    expect(allLoaded.showFetchLibrary).toBe(false);

    const missing = computeMenuVisibility(
      baseState({ hasModel: true, pageCount: 4, hasMissingPartsToFetch: true }),
    );
    expect(missing.showFetchLibrary).toBe(true);

    const fetching = computeMenuVisibility(
      baseState({ hasModel: true, pageCount: 4, hasMissingPartsToFetch: false, isFetchingLibrary: true }),
    );
    expect(fetching.showFetchLibrary).toBe(true);
  });

  it('hides Parts List Setup in the menu when Parts List pages are disabled', () => {
    const enabled = computeMenuVisibility(
      baseState({ hasModel: true, pageCount: 6, showPartsList: true }),
    );
    expect(enabled.showBomSetup).toBe(true);

    const disabled = computeMenuVisibility(
      baseState({ hasModel: true, pageCount: 6, showPartsList: false }),
    );
    expect(disabled.showBomSetup).toBe(false);
    expect(disabled.showPageSetup).toBe(true);
    expect(disabled.showPagePrintSection).toBe(true);
  });
});

describe('canInsertDividerAfterPage', () => {
  it('allows inserting a divider only after a steps page without an existing divider', () => {
    expect(canInsertDividerAfterPage({ id: 'pg_s1', kind: 'steps' }, {})).toBe(true);
    expect(canInsertDividerAfterPage({ id: 'pg_s1', kind: 'steps' }, { pg_s1: { title: 'Part 2' } })).toBe(false);
  });

  it('rejects non-steps pages and missing pages', () => {
    expect(canInsertDividerAfterPage(null, {})).toBe(false);
    expect(canInsertDividerAfterPage(undefined, {})).toBe(false);
    expect(canInsertDividerAfterPage({ id: 'cover', kind: 'cover' }, {})).toBe(false);
    expect(canInsertDividerAfterPage({ id: 'div_pg_s1', kind: 'divider' }, {})).toBe(false);
    expect(canInsertDividerAfterPage({ id: 'complete', kind: 'complete' }, {})).toBe(false);
    expect(canInsertDividerAfterPage({ id: 'bom_0', kind: 'bom' }, {})).toBe(false);
    expect(canInsertDividerAfterPage({ id: 'back', kind: 'back' }, {})).toBe(false);
    expect(canInsertDividerAfterPage({ id: 'secdiv_b1', kind: 'section_divider' }, {})).toBe(false);
    expect(canInsertDividerAfterPage({ id: 'subpg_s1', kind: 'submodel_page' }, {})).toBe(false);
  });
});
