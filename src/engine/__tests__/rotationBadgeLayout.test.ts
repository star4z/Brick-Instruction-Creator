import { describe, expect, it } from 'vitest';
import {
  computeRotationBadgeMetrics,
  computeRotationBadgePlacement,
} from '../rotationBadgeLayout';

/** Identity 4x4 column-major MVP where world (x, y) in [-1, 1] maps directly to NDC. */
const IDENTITY_MVP = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);

/** Builds two triangles forming a quad in NDC coordinates [x0..x1] x [y0..y1] (y up). */
function makeNdcQuad(x0: number, y0: number, x1: number, y1: number): Float32Array {
  return new Float32Array([
    x0, y0, 0,  x1, y0, 0,  x1, y1, 0,
    x0, y0, 0,  x1, y1, 0,  x0, y1, 0,
  ]);
}

describe('computeRotationBadgeMetrics', () => {
  const pt = (p: number) => p * 1.25;

  it('produces spacious, well-proportioned circular medallions for icon-only cues', () => {
    const regular = computeRotationBadgeMetrics(pt, false, { text: '', iconOnly: true });
    const tight = computeRotationBadgeMetrics(pt, true, { text: '', iconOnly: true });

    expect(regular.medallionPx).toBeGreaterThanOrEqual(42);
    expect(regular.outerH).toBeGreaterThanOrEqual(52);
    expect(regular.estWidth).toBe(regular.outerH);
    expect(regular.svgPx).toBeGreaterThanOrEqual(30);
    expect(tight.medallionPx).toBeGreaterThanOrEqual(32);
    expect(tight.medallionPx).toBeLessThan(regular.medallionPx);
  });

  it('produces wider pill metrics when label text is shown', () => {
    const iconOnly = computeRotationBadgeMetrics(pt, false, { text: '', iconOnly: true });
    const withDeg = computeRotationBadgeMetrics(pt, false, { text: '90°', iconOnly: false });
    const withPhrase = computeRotationBadgeMetrics(pt, false, { text: 'Rotate 90°', iconOnly: false });

    expect(withDeg.estWidth).toBeGreaterThan(iconOnly.estWidth);
    expect(withPhrase.estWidth).toBeGreaterThan(withDeg.estWidth);
    expect(withDeg.fontPx).toBeGreaterThanOrEqual(13);
  });
});

describe('computeRotationBadgePlacement', () => {
  it('places the badge near a bottom-left model instead of stranding it in the far top-right corner', () => {
    // Model occupies bottom-left quadrant: NDC x in [-0.95, -0.05], y in [-0.95, -0.05]
    // In 400x400 container: x in [10, 190], y in [210, 390]
    const triPos = makeNdcQuad(-0.95, -0.95, -0.05, -0.05);
    const pos = computeRotationBadgePlacement({
      containerW: 400,
      containerH: 400,
      badgeW: 54,
      badgeH: 54,
      snapW: 400,
      snapH: 400,
      mvp: IDENTITY_MVP,
      triPos,
    });

    expect(pos.clearOfModel).toBe(true);
    // Must NOT be stranded in the far top-right corner (x > 310, y < 60)
    expect(pos.x < 280 || pos.y > 100).toBe(true);
    // Must be near the model (within ~45px of the model silhouette)
    expect(pos.distanceToModelPx).toBeGreaterThanOrEqual(6);
    expect(pos.distanceToModelPx).toBeLessThanOrEqual(45);
    // Must stay strictly inside container
    expect(pos.x).toBeGreaterThanOrEqual(0);
    expect(pos.y).toBeGreaterThanOrEqual(0);
    expect(pos.x + 54).toBeLessThanOrEqual(400);
    expect(pos.y + 54).toBeLessThanOrEqual(400);
  });

  it('moves away from the upper-right when the model occupies the upper-right quadrant', () => {
    // Model occupies upper-right: NDC x in [0.0, 0.96], y in [0.0, 0.96]
    // Container pixels: x in [200, 392], y in [8, 200]
    const triPos = makeNdcQuad(0.0, 0.0, 0.96, 0.96);
    const pos = computeRotationBadgePlacement({
      containerW: 400,
      containerH: 400,
      badgeW: 54,
      badgeH: 54,
      snapW: 400,
      snapH: 400,
      mvp: IDENTITY_MVP,
      triPos,
    });

    expect(pos.clearOfModel).toBe(true);
    // Badge rect must not overlap [200..392] x [8..200]
    const overlapsModelRect =
      pos.x < 392 && pos.x + 54 > 200 && pos.y < 200 && pos.y + 54 > 8;
    expect(overlapsModelRect).toBe(false);
    // Should still stay close to the model
    expect(pos.distanceToModelPx).toBeLessThanOrEqual(45);
  });

  it('hugs the upper-right shoulder of a small centered model', () => {
    // Small centered model: NDC [-0.25, 0.25] x [-0.25, 0.25]
    // Container 400x400: x in [150, 250], y in [150, 250]
    const triPos = makeNdcQuad(-0.25, -0.25, 0.25, 0.25);
    const pos = computeRotationBadgePlacement({
      containerW: 400,
      containerH: 400,
      badgeW: 52,
      badgeH: 52,
      snapW: 400,
      snapH: 400,
      mvp: IDENTITY_MVP,
      triPos,
    });

    expect(pos.clearOfModel).toBe(true);
    // Upper-right preference relative to model center (200, 200)
    expect(pos.x + 26).toBeGreaterThanOrEqual(195);
    expect(pos.y + 26).toBeLessThanOrEqual(205);
    expect(pos.distanceToModelPx).toBeLessThanOrEqual(40);
  });

  it('rasterizes large flat plates accurately so the badge never lands inside the plate interior', () => {
    // One big flat plate covering NDC [-0.6, 0.6] x [-0.6, 0.6] -> pixels [80, 320] x [80, 320]
    const triPos = makeNdcQuad(-0.6, -0.6, 0.6, 0.6);
    const pos = computeRotationBadgePlacement({
      containerW: 400,
      containerH: 400,
      badgeW: 50,
      badgeH: 50,
      snapW: 400,
      snapH: 400,
      mvp: IDENTITY_MVP,
      triPos,
    });

    expect(pos.clearOfModel).toBe(true);
    const insidePlate =
      pos.x < 320 && pos.x + 50 > 80 && pos.y < 320 && pos.y + 50 > 80;
    expect(insidePlate).toBe(false);
  });

  it('avoids obstacle rectangles such as a bottom-right submodel repeat badge', () => {
    // Model fills top & left; only bottom-right is open, with an obstacle at the far bottom-right
    const triPos = new Float32Array([
      ...makeNdcQuad(-0.98, -0.98, 0.1, 0.98),
      ...makeNdcQuad(0.0, 0.1, 0.98, 0.98),
    ]);
    const obstacle = { x: 320, y: 340, w: 72, h: 52 };
    const pos = computeRotationBadgePlacement({
      containerW: 400,
      containerH: 400,
      badgeW: 50,
      badgeH: 50,
      snapW: 400,
      snapH: 400,
      mvp: IDENTITY_MVP,
      triPos,
      obstacles: [obstacle],
    });

    expect(pos.clearOfModel).toBe(true);
    const overlapsObstacle =
      pos.x < obstacle.x + obstacle.w &&
      pos.x + 50 > obstacle.x &&
      pos.y < obstacle.y + obstacle.h &&
      pos.y + 50 > obstacle.y;
    expect(overlapsObstacle).toBe(false);
  });

  it('falls back cleanly to top-right inset when MVP is unavailable', () => {
    const pos = computeRotationBadgePlacement({
      containerW: 400,
      containerH: 300,
      badgeW: 52,
      badgeH: 52,
      snapW: 400,
      snapH: 300,
      mvp: null,
      triPos: null,
    });

    expect(pos.x).toBe(400 - 52 - 8);
    expect(pos.y).toBe(8);
    expect(pos.clearOfModel).toBe(true);
  });
});
