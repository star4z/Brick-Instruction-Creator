import { describe, expect, it } from 'vitest';
import {
  createQuickPinchTracker,
  easeOutCubic,
  interpolateStageReset,
  recordQuickPinchSample,
  shouldTriggerQuickPinchFit,
} from '../stageGestures';

function simulatePinch(points: Array<{ dist: number; timeMs: number }>, endTimeMs: number): boolean {
  let tracker = createQuickPinchTracker(points[0].dist, points[0].timeMs);
  for (let i = 1; i < points.length; i++) {
    tracker = recordQuickPinchSample(tracker, points[i].dist, points[i].timeMs);
  }
  return shouldTriggerQuickPinchFit(tracker, endTimeMs);
}

describe('stageGestures — Procreate quick pinch to fit', () => {
  it('triggers on a brisk inward pinch on a phone-sized finger span', () => {
    const triggered = simulatePinch(
      [
        { dist: 140, timeMs: 0 },
        { dist: 122, timeMs: 60 },
        { dist: 102, timeMs: 120 },
        { dist: 85, timeMs: 170 },
      ],
      180,
    );
    expect(triggered).toBe(true);
  });

  it('triggers on a brisk inward pinch on a tablet-sized finger span', () => {
    const triggered = simulatePinch(
      [
        { dist: 280, timeMs: 1000 },
        { dist: 235, timeMs: 1050 },
        { dist: 190, timeMs: 1110 },
        { dist: 150, timeMs: 1185 },
      ],
      1200,
    );
    expect(triggered).toBe(true);
  });

  it('triggers reliably on 120Hz displays with small per-frame deltas', () => {
    const points: Array<{ dist: number; timeMs: number }> = [];
    for (let i = 0; i <= 18; i++) {
      points.push({ dist: 200 - i * 4.5, timeMs: i * 8 });
    }
    expect(simulatePinch(points, 152)).toBe(true);
  });

  it('triggers on a snappy inward flick at the end of a longer 2-finger pan/zoom', () => {
    const triggered = simulatePinch(
      [
        { dist: 220, timeMs: 0 },
        { dist: 222, timeMs: 200 },
        { dist: 218, timeMs: 400 },
        { dist: 220, timeMs: 600 },
        { dist: 195, timeMs: 640 },
        { dist: 165, timeMs: 685 },
        { dist: 140, timeMs: 730 },
      ],
      745,
    );
    expect(triggered).toBe(true);
  });

  it('does NOT trigger on a deliberate slow pinch-to-zoom-out', () => {
    const triggered = simulatePinch(
      [
        { dist: 260, timeMs: 0 },
        { dist: 240, timeMs: 160 },
        { dist: 220, timeMs: 320 },
        { dist: 200, timeMs: 480 },
        { dist: 175, timeMs: 650 },
      ],
      680,
    );
    expect(triggered).toBe(false);
  });

  it('does NOT trigger when the user pinches quickly and then pauses/holds before lifting', () => {
    const triggered = simulatePinch(
      [
        { dist: 240, timeMs: 0 },
        { dist: 190, timeMs: 70 },
        { dist: 140, timeMs: 140 },
        // User holds fingers still (with tiny jitter) for 180ms to inspect framing
        { dist: 140.4, timeMs: 220 },
        { dist: 139.8, timeMs: 310 },
      ],
      320,
    );
    expect(triggered).toBe(false);
  });

  it('does NOT trigger when the user pinches in then spreads back out to adjust zoom', () => {
    const triggered = simulatePinch(
      [
        { dist: 240, timeMs: 0 },
        { dist: 150, timeMs: 120 },
        { dist: 168, timeMs: 210 },
      ],
      220,
    );
    expect(triggered).toBe(false);
  });

  it('does NOT trigger on an outward pinch (zoom in)', () => {
    const triggered = simulatePinch(
      [
        { dist: 100, timeMs: 0 },
        { dist: 160, timeMs: 80 },
        { dist: 220, timeMs: 160 },
      ],
      175,
    );
    expect(triggered).toBe(false);
  });

  it('does NOT trigger on a 2-finger pan with minor distance drift', () => {
    const triggered = simulatePinch(
      [
        { dist: 160, timeMs: 0 },
        { dist: 156, timeMs: 80 },
        { dist: 150, timeMs: 180 },
      ],
      195,
    );
    expect(triggered).toBe(false);
  });

  it('does NOT trigger on a 2-finger tap with no meaningful contraction', () => {
    const triggered = simulatePinch(
      [
        { dist: 180, timeMs: 0 },
        { dist: 176, timeMs: 70 },
      ],
      85,
    );
    expect(triggered).toBe(false);
  });

  it('returns false for null tracker or zero elapsed duration', () => {
    expect(shouldTriggerQuickPinchFit(null, 100)).toBe(false);
    const tracker = createQuickPinchTracker(200, 100);
    expect(shouldTriggerQuickPinchFit(tracker, 100)).toBe(false);
  });
});

describe('stageGestures — stage reset animation interpolation', () => {
  it('easeOutCubic starts at 0, ends at 1, and decelerates monotonically', () => {
    expect(easeOutCubic(-0.5)).toBe(0);
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(1.5)).toBe(1);
  });

  it('interpolates zoomed & panned stage smoothly back to centered 100% fit', () => {
    const from = { zoom: 2.4, panX: 120, panY: -80 };
    expect(interpolateStageReset(from, 0)).toEqual(from);

    const mid = interpolateStageReset(from, 0.5);
    expect(mid.zoom).toBeLessThan(2.4);
    expect(mid.zoom).toBeGreaterThan(1);
    expect(mid.panX).toBeLessThan(120);
    expect(mid.panX).toBeGreaterThan(0);
    expect(mid.panY).toBeGreaterThan(-80);
    expect(mid.panY).toBeLessThan(0);

    expect(interpolateStageReset(from, 1)).toEqual({ zoom: 1, panX: 0, panY: 0 });
  });

  it('interpolates from zoomed-out stage back up to 100% fit', () => {
    const from = { zoom: 0.55, panX: -40, panY: 30 };
    const mid = interpolateStageReset(from, 0.5);
    expect(mid.zoom).toBeGreaterThan(0.55);
    expect(mid.zoom).toBeLessThan(1);
    expect(interpolateStageReset(from, 1)).toEqual({ zoom: 1, panX: 0, panY: 0 });
  });
});
