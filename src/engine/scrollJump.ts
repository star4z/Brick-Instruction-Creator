export interface ScrollMetrics {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

export interface ScrollJumpVisibility {
  showJumpTop: boolean;
  showJumpBottom: boolean;
}

export const DEFAULT_SCROLL_EDGE_THRESHOLD = 8;

/**
 * Computes visibility for Jump-to-Top and Jump-to-Bottom controls in a
 * vertically scrollable list.
 *
 * - Jump-to-Top appears whenever the list overflows and is NOT at the top
 *   (e.g. scrolled down or at the bottom).
 * - Jump-to-Bottom appears whenever the list overflows and is NOT at the bottom
 *   (e.g. at the top or scrolled up from the bottom).
 * - Neither control appears when the list fits without meaningful overflow.
 */
export function computeScrollJumpVisibility(
  metrics: ScrollMetrics,
  edgeThreshold: number = DEFAULT_SCROLL_EDGE_THRESHOLD,
): ScrollJumpVisibility {
  const clientHeight = Number.isFinite(metrics.clientHeight) ? Math.max(0, metrics.clientHeight) : 0;
  const scrollHeight = Number.isFinite(metrics.scrollHeight) ? Math.max(0, metrics.scrollHeight) : 0;
  const threshold = Number.isFinite(edgeThreshold) ? Math.max(0, edgeThreshold) : DEFAULT_SCROLL_EDGE_THRESHOLD;
  const maxScroll = Math.max(0, scrollHeight - clientHeight);

  if (clientHeight <= 0 || maxScroll <= threshold) {
    return { showJumpTop: false, showJumpBottom: false };
  }

  const rawTop = Number.isFinite(metrics.scrollTop) ? metrics.scrollTop : 0;
  const clampedTop = Math.min(maxScroll, Math.max(0, rawTop));

  return {
    showJumpTop: clampedTop > threshold,
    showJumpBottom: maxScroll - clampedTop > threshold,
  };
}
