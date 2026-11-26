/**
 * Pre-Export Manual Quality Preflight Analyzer (Phase E).
 *
 * Runs pure, deterministic checks before PDF / Interactive HTML export to flag:
 *   - Dark-on-dark theme print ink warnings (suggests Print-Friendly Light Mode)
 *   - High page count manuals (>= 180 pages) suggesting multi-booklet splitting
 *   - Floating/unconnected steps or missing 1:1 size guides on long axles/beams
 *   - Compact paper size readability warnings
 */

export interface PreflightFinding {
  id: string;
  severity: 'info' | 'warn';
  title: string;
  detail: string;
}

export interface ManualPreflightInput {
  pageCount: number;
  stepCount: number;
  isDarkTheme: boolean;
  showSizeGuides: boolean;
  hasLongAxlesOrBeams: boolean;
  floatingStepCount: number;
  hasPageSizeWarning: boolean;
}

export function runManualPreflight(input: ManualPreflightInput): PreflightFinding[] {
  const findings: PreflightFinding[] = [];

  if (input.floatingStepCount > 0) {
    findings.push({
      id: 'floating-steps',
      severity: 'warn',
      title: `${input.floatingStepCount} step${input.floatingStepCount === 1 ? '' : 's'} with floating parts`,
      detail: 'Review Model Issues to ensure every newly added part connects physically to the existing assembly.',
    });
  }

  if (input.hasPageSizeWarning) {
    findings.push({
      id: 'page-size-fit',
      severity: 'warn',
      title: 'Some steps are tight for the current paper format',
      detail: 'Consider switching to a larger paper size or Regional Crop framing for small parts.',
    });
  }

  if (input.hasLongAxlesOrBeams && !input.showSizeGuides) {
    findings.push({
      id: 'missing-size-guides',
      severity: 'info',
      title: '1:1 Axle & Beam Guides are turned off',
      detail: 'This model includes long axles or Technic beams; enabling 1:1 guides in Style helps builders measure lengths accurately.',
    });
  }

  if (input.isDarkTheme) {
    findings.push({
      id: 'dark-theme-ink',
      severity: 'info',
      title: 'Dark theme uses heavy print ink',
      detail: 'Great for screens and collector prints — switch to Technical Gray or Clean White if printing on a home inkjet.',
    });
  }

  if (input.pageCount >= 180) {
    findings.push({
      id: 'multi-booklet-hint',
      severity: 'info',
      title: `Large manual (${input.pageCount} pages)`,
      detail: 'Official 180+ page manuals are often split into Book 1 / Book 2 on bag or chapter boundaries for easier binding.',
    });
  }

  return findings;
}
