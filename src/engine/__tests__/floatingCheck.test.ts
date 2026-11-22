import { describe, expect, it } from 'vitest';
import { buildConnectivityGraph } from '../connectivity';
import {
  GROUND_TOLERANCE_LDU,
  type Box3Like,
  classifyDetachedPart,
  computeGroundPlaneY,
  isBoxGrounded,
} from '../floatingCheck';
import { parseLDrawSource } from '../ldrawParser';

function box(minY: number, maxY: number, x = 0, z = 0): Box3Like {
  return {
    min: [x - 10, minY, z - 10],
    max: [x + 10, maxY, z + 10],
  };
}

describe('Ground-aware floating piece classification', () => {
  it('anchors the reference ground plane to connected parts so a stray underground piece cannot skew it', () => {
    const boxes: Box3Like[] = [
      box(0, 24, 0, 0),    // connected main model base
      box(24, 48, 0, 0),   // connected upper brick
      box(-80, -56, 200),  // stray isolated piece far below floor
      box(0, 28, 120, 0),  // standalone trash can resting on floor
    ];
    const connected = [true, true, false, false];
    const groundY = computeGroundPlaneY(boxes, (i) => connected[i]);
    expect(groundY).toBe(0);
    expect(isBoxGrounded(boxes[3], groundY)).toBe(true);
  });

  it('falls back to all parts when no parts touch each other', () => {
    const boxes: Box3Like[] = [
      box(0, 24, 0, 0),
      box(0, 28, 100, 0),
      box(48, 72, 200, 0),
    ];
    const groundY = computeGroundPlaneY(boxes, () => false);
    expect(groundY).toBe(0);
    expect(isBoxGrounded(boxes[0], groundY)).toBe(true);
    expect(isBoxGrounded(boxes[1], groundY)).toBe(true);
    expect(isBoxGrounded(boxes[2], groundY)).toBe(false);
  });

  it('does not flag a separate standalone prop resting on the ground (even next to flanged train wheels)', () => {
    // Flanged train wheels dip ~5-6 LDU below Studio's Y=0 ground grid
    const groundY = -6;
    const trashCanOnGround = box(0, 32, 120, 0);

    const res = classifyDetachedPart({
      box: trashCanOnGround,
      groundY,
      nearestGapLdu: Infinity,
    });
    expect(res.status).toBe('grounded');
    expect(res.detachedGap).toBe(0);
    expect(res.floatHeight).toBe(0);
  });

  it('flags a disconnected piece actually floating above the ground with its elevation', () => {
    const groundY = 0;
    const floatingOneBrick = box(24, 48, 120, 0);
    const floatingJustOverTolerance = box(GROUND_TOLERANCE_LDU + 2, GROUND_TOLERANCE_LDU + 26, 120, 0);

    const res1 = classifyDetachedPart({
      box: floatingOneBrick,
      groundY,
      nearestGapLdu: Infinity,
    });
    expect(res1.status).toBe('floating');
    expect(res1.detachedGap).toBe(Infinity);
    expect(res1.floatHeight).toBe(24);

    const res2 = classifyDetachedPart({
      box: floatingJustOverTolerance,
      groundY,
      nearestGapLdu: Infinity,
    });
    expect(res2.status).toBe('floating');
    expect(res2.detachedGap).toBe(Infinity);
    expect(res2.floatHeight).toBe(GROUND_TOLERANCE_LDU + 2);
  });

  it('ignores horizontal near-miss gaps for grounded props while keeping weak-connection warnings for elevated parts and wheels', () => {
    const groundY = 0;

    // Grounded prop sitting 8 LDU (0.4 studs) beside the model
    const groundedProp = classifyDetachedPart({
      box: box(0, 28, 30, 0),
      groundY,
      nearestGapLdu: 8,
      isWheel: false,
    });
    expect(groundedProp.status).toBe('grounded');
    expect(groundedProp.detachedGap).toBe(0);

    // Elevated piece hovering 8 LDU from a wall at 48 LDU off the ground
    const elevatedWeak = classifyDetachedPart({
      box: box(48, 72, 30, 0),
      groundY,
      nearestGapLdu: 8,
      isWheel: false,
    });
    expect(elevatedWeak.status).toBe('weak_connection');
    expect(elevatedWeak.detachedGap).toBe(8);
    expect(elevatedWeak.floatHeight).toBe(48);

    // Wheel 8 LDU from its wheel holder (still warns even at ground level)
    const wheelWeak = classifyDetachedPart({
      box: box(0, 20, 30, 0),
      groundY,
      nearestGapLdu: 8,
      isWheel: true,
    });
    expect(wheelWeak.status).toBe('weak_connection');
    expect(wheelWeak.detachedGap).toBe(8);

    // Tight fallback snap <= 4.5 LDU -> connected
    const snapped = classifyDetachedPart({
      box: box(48, 72, 30, 0),
      groundY,
      nearestGapLdu: 3.2,
      isWheel: false,
    });
    expect(snapped.status).toBe('connected');
    expect(snapped.detachedGap).toBe(0);
  });

  it('integrates with buildConnectivityGraph: accepts grounded standalone props and flags mid-air floating parts', () => {
    // LDraw Y-down: y=-24 is bottom at y=0 (24 LDU tall brick 3001), y=-48 sits on top of it.
    // A separate brick at x=200, y=-24 is resting on the ground (bottom y=0) -> NOT floating.
    const groundedSceneLdr = [
      '0 Grounded Prop Test',
      '1 4 0 -24 0 1 0 0 0 1 0 0 0 1 3001.dat',
      '1 1 0 -48 0 1 0 0 0 1 0 0 0 1 3001.dat',
      '1 71 200 -24 0 1 0 0 0 1 0 0 0 1 3005.dat',
    ].join('\n');

    const groundedModel = parseLDrawSource(groundedSceneLdr, 'grounded.ldr', 'ldr');
    const groundedGraph = buildConnectivityGraph(groundedModel.parts);
    expect(groundedGraph.components).toHaveLength(2);
    expect(groundedGraph.floatingWarnings).toHaveLength(0);

    // Now lift the standalone 1x1 brick 2 bricks (48 LDU) into the air (y=-72 in LDraw Y-down -> bottom at +48 LDU)
    const floatingSceneLdr = [
      '0 Floating Piece Test',
      '1 4 0 -24 0 1 0 0 0 1 0 0 0 1 3001.dat',
      '1 1 0 -48 0 1 0 0 0 1 0 0 0 1 3001.dat',
      '1 71 200 -72 0 1 0 0 0 1 0 0 0 1 3005.dat',
    ].join('\n');

    const floatingModel = parseLDrawSource(floatingSceneLdr, 'floating.ldr', 'ldr');
    const floatingGraph = buildConnectivityGraph(floatingModel.parts);
    expect(floatingGraph.components).toHaveLength(2);
    expect(floatingGraph.floatingWarnings).toHaveLength(1);
    expect(floatingGraph.floatingWarnings[0].partId).toBe('3005');
    expect(floatingGraph.floatingWarnings[0].message).toContain('above the ground');
  });
});
