export type PageNavigationAction = 'first' | 'prev' | 'next' | 'last';

export interface PageNavigationState {
  canGoFirst: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  canGoLast: boolean;
}

/**
 * Computes enabled/disabled capabilities for the page navigation controls.
 *
 * - First and Previous are enabled whenever there are multiple pages and the
 *   current page is not the first page.
 * - Next and Last are enabled whenever there are multiple pages and the
 *   current page is not the last page.
 * - All controls are disabled when there are 0 or 1 pages.
 */
export function computePageNavigationState(
  pageIdx: number,
  pageCount: number,
): PageNavigationState {
  const count = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0;
  if (count <= 1) {
    return {
      canGoFirst: false,
      canGoPrev: false,
      canGoNext: false,
      canGoLast: false,
    };
  }

  const rawIdx = Number.isFinite(pageIdx) ? Math.floor(pageIdx) : 0;
  const clampedIdx = Math.min(count - 1, Math.max(0, rawIdx));
  const canGoBack = clampedIdx > 0;
  const canGoForward = clampedIdx < count - 1;

  return {
    canGoFirst: canGoBack,
    canGoPrev: canGoBack,
    canGoNext: canGoForward,
    canGoLast: canGoForward,
  };
}

/**
 * Resolves the target page index for a page navigation action ('first', 'prev',
 * 'next', or 'last'), clamped to valid page bounds.
 */
export function resolvePageNavigationTarget(
  pageIdx: number,
  pageCount: number,
  action: PageNavigationAction,
): number {
  const count = Number.isFinite(pageCount) ? Math.max(0, Math.floor(pageCount)) : 0;
  if (count <= 1) return 0;

  const rawIdx = Number.isFinite(pageIdx) ? Math.floor(pageIdx) : 0;
  const clampedIdx = Math.min(count - 1, Math.max(0, rawIdx));

  switch (action) {
    case 'first':
      return 0;
    case 'prev':
      return Math.max(0, clampedIdx - 1);
    case 'next':
      return Math.min(count - 1, clampedIdx + 1);
    case 'last':
      return count - 1;
  }
}
