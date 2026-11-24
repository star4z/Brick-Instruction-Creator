import { describe, expect, it } from 'vitest';
import { computeScrollJumpVisibility, DEFAULT_SCROLL_EDGE_THRESHOLD } from '../scrollJump';

describe('computeScrollJumpVisibility', () => {
  it('hides both arrows when the container fits without overflowing', () => {
    expect(
      computeScrollJumpVisibility({ scrollTop: 0, clientHeight: 400, scrollHeight: 400 }),
    ).toEqual({ showJumpTop: false, showJumpBottom: false });

    expect(
      computeScrollJumpVisibility({ scrollTop: 0, clientHeight: 400, scrollHeight: 320 }),
    ).toEqual({ showJumpTop: false, showJumpBottom: false });
  });

  it('hides both arrows when overflow is within the edge tolerance or element is hidden', () => {
    expect(
      computeScrollJumpVisibility({
        scrollTop: 0,
        clientHeight: 400,
        scrollHeight: 400 + DEFAULT_SCROLL_EDGE_THRESHOLD,
      }),
    ).toEqual({ showJumpTop: false, showJumpBottom: false });

    expect(
      computeScrollJumpVisibility({ scrollTop: 0, clientHeight: 0, scrollHeight: 1200 }),
    ).toEqual({ showJumpTop: false, showJumpBottom: false });
  });

  it('shows only jump-to-bottom when at the top of an overflowing list', () => {
    expect(
      computeScrollJumpVisibility({ scrollTop: 0, clientHeight: 400, scrollHeight: 1200 }),
    ).toEqual({ showJumpTop: false, showJumpBottom: true });

    // Within top tolerance still counts as at top
    expect(
      computeScrollJumpVisibility({
        scrollTop: DEFAULT_SCROLL_EDGE_THRESHOLD,
        clientHeight: 400,
        scrollHeight: 1200,
      }),
    ).toEqual({ showJumpTop: false, showJumpBottom: true });
  });

  it('shows only jump-to-top when at the bottom of an overflowing list', () => {
    expect(
      computeScrollJumpVisibility({ scrollTop: 800, clientHeight: 400, scrollHeight: 1200 }),
    ).toEqual({ showJumpTop: true, showJumpBottom: false });

    // Within bottom tolerance still counts as at bottom
    expect(
      computeScrollJumpVisibility({
        scrollTop: 800 - DEFAULT_SCROLL_EDGE_THRESHOLD,
        clientHeight: 400,
        scrollHeight: 1200,
      }),
    ).toEqual({ showJumpTop: true, showJumpBottom: false });
  });

  it('shows both arrows when scrolled into the middle (neither at top nor at bottom)', () => {
    expect(
      computeScrollJumpVisibility({ scrollTop: 300, clientHeight: 400, scrollHeight: 1200 }),
    ).toEqual({ showJumpTop: true, showJumpBottom: true });
  });

  it('handles rubber-band overscroll past the top or bottom gracefully', () => {
    // Negative scrollTop (iOS bounce at top)
    expect(
      computeScrollJumpVisibility({ scrollTop: -30, clientHeight: 400, scrollHeight: 1200 }),
    ).toEqual({ showJumpTop: false, showJumpBottom: true });

    // ScrollTop beyond maxScroll (iOS bounce at bottom)
    expect(
      computeScrollJumpVisibility({ scrollTop: 860, clientHeight: 400, scrollHeight: 1200 }),
    ).toEqual({ showJumpTop: true, showJumpBottom: false });
  });
});
