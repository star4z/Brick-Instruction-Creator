import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STUDIO_CAMERA,
  type StudioCameraPose,
} from '../minifigCamera';
import type { WorldBox } from '../minifigPose';
import {
  areOnOppositeWalls,
  cameraCornerBucket,
  chooseStickyStepCamera,
  classifySameSkuPattern,
  compareFrontierCandidates,
  computeBoundsFromBoxes,
  computeEvenRunTarget,
  selectDynamicStepIndices,
  type DynamicPartDescriptor,
} from '../dynamicStepSizer';

function makeBox(cx: number, cy: number, cz: number, sx = 20, sy = 24, sz = 20): WorldBox {
  return {
    min: [cx - sx / 2, cy - sy / 2, cz - sz / 2],
    max: [cx + sx / 2, cy + sy / 2, cz + sz / 2],
    center: [cx, cy, cz],
  };
}

function makePart(
  index: number,
  partId: string,
  colorId: number,
  box: WorldBox,
  role = 'structural',
  isCladding = false,
): DynamicPartDescriptor {
  return {
    index,
    partId,
    colorId,
    sku: `${partId}|${colorId}`,
    role,
    box,
    layerY: box.min[1],
    isCladding,
  };
}

describe('dynamicStepSizer', () => {
  it('starts Step 1 gently with 1-3 foundation bricks even when many base bricks are available', () => {
    const parts: DynamicPartDescriptor[] = [];
    for (let i = 0; i < 10; i++) {
      parts.push(makePart(i, '3004', 4, makeBox(i * 20, 12, 0, 20, 24, 20)));
    }
    const modelBounds = computeBoundsFromBoxes(parts.map((p) => p.box));
    const step1 = selectDynamicStepIndices({
      anchor: 0,
      parts,
      getEligibleCandidates: (placed) =>
        parts.map((p) => p.index).filter((i) => !placed.has(i)),
      modelBounds,
      builtBounds: null,
      activeCam: DEFAULT_STUDIO_CAMERA,
      isFirstStep: true,
      totalPartsInScope: parts.length,
    });

    expect(step1.length).toBeGreaterThanOrEqual(1);
    expect(step1.length).toBeLessThanOrEqual(3);
  });

  it('strongly favors identical pieces in a linear row over nearby unrelated singletons', () => {
    // 4 identical 1x2 red bricks in a straight row along X, plus 4 distinct nearby bricks
    const parts: DynamicPartDescriptor[] = [
      makePart(0, '3004', 4, makeBox(0, 36, 40)),
      makePart(1, '3004', 4, makeBox(20, 36, 40)),
      makePart(2, '3004', 4, makeBox(40, 36, 40)),
      makePart(3, '3004', 4, makeBox(60, 36, 40)),
      makePart(4, '3005', 1, makeBox(10, 36, 20)),
      makePart(5, '3023', 14, makeBox(30, 36, 20)),
      makePart(6, '3040', 2, makeBox(50, 36, 20)),
      makePart(7, '3069', 15, makeBox(20, 36, 60)),
    ];
    const modelBounds = computeBoundsFromBoxes(parts.map((p) => p.box));
    const builtBounds = makeBox(30, 12, 40, 120, 24, 80);

    const picked = selectDynamicStepIndices({
      anchor: 0,
      parts,
      getEligibleCandidates: (placed) =>
        parts.map((p) => p.index).filter((i) => !placed.has(i)),
      modelBounds,
      builtBounds,
      activeCam: DEFAULT_STUDIO_CAMERA,
      isFirstStep: false,
      totalPartsInScope: 40,
    });

    // Must pick all 4 identical bricks first
    expect(picked.slice(0, 4).sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
    // Because 4 identical bricks already carry a mixed-after-repeat surcharge,
    // it should NOT dump all 4 unrelated singletons into the same step
    const uniqueSkus = new Set(picked.map((i) => parts[i].sku));
    expect(uniqueSkus.size).toBeLessThanOrEqual(3);
  });

  it('splits very large uniform rows into even balanced chunks (16 -> 8 + 8)', () => {
    expect(computeEvenRunTarget(8)).toBe(8);
    expect(computeEvenRunTarget(12)).toBe(12);
    expect(computeEvenRunTarget(16)).toBe(8);
    expect(computeEvenRunTarget(20)).toBe(10);
    expect(computeEvenRunTarget(24)).toBe(8);

    const parts: DynamicPartDescriptor[] = [];
    for (let i = 0; i < 16; i++) {
      parts.push(makePart(i, '3004', 71, makeBox(i * 20, 36, 40, 20, 24, 20)));
    }
    // Add an unrelated brick nearby to verify the split chunk stays homogeneous
    parts.push(makePart(16, '3005', 4, makeBox(0, 36, 20, 20, 24, 20)));

    const modelBounds = computeBoundsFromBoxes(parts.map((p) => p.box));
    const builtBounds = makeBox(150, 12, 40, 340, 24, 80);

    const chunk1 = selectDynamicStepIndices({
      anchor: 0,
      parts,
      getEligibleCandidates: (placed) =>
        parts.map((p) => p.index).filter((i) => !placed.has(i)),
      modelBounds,
      builtBounds,
      activeCam: DEFAULT_STUDIO_CAMERA,
      isFirstStep: false,
      totalPartsInScope: 60,
    });

    expect(chunk1.length).toBe(8);
    expect(chunk1.every((i) => parts[i].sku === '3004|71')).toBe(true);
  });

  it('classifies linear rows, grids, and mirror pairs as structured vs irregular texture as scattered', () => {
    const modelBounds = makeBox(0, 40, 0, 120, 80, 120);
    const a = makeBox(-40, 36, 40);
    const rowNeighbor = makeBox(-20, 36, 40);
    const mirrorPartner = makeBox(40, 36, 40);
    const scattered = makeBox(13, 36, -17);

    expect(classifySameSkuPattern(rowNeighbor, [a], modelBounds)).toBe('structured');
    expect(classifySameSkuPattern(mirrorPartner, [a], modelBounds)).toBe('structured');
    expect(classifySameSkuPattern(scattered, [a], modelBounds)).toBe('scattered');
  });

  it('caps scattered castle-wall texture repeats smaller (3-5) than structured rows', () => {
    // 9 identical 1x1 masonry bricks sprinkled at irregular non-row offsets on the front-right side
    const coords: Array<[number, number]> = [
      [10, 10],
      [33, 27],
      [58, 12],
      [17, 49],
      [44, 62],
      [79, 38],
      [96, 17],
      [63, 81],
      [25, 92],
    ];
    const parts = coords.map(([x, z], i) =>
      makePart(i, '98283', 71, makeBox(x, 36, z, 20, 24, 20)),
    );
    const modelBounds = makeBox(0, 36, 0, 220, 72, 220);
    const builtBounds = makeBox(0, 12, 0, 220, 24, 220);

    const picked = selectDynamicStepIndices({
      anchor: 0,
      parts,
      getEligibleCandidates: (placed) =>
        parts.map((p) => p.index).filter((i) => !placed.has(i)),
      modelBounds,
      builtBounds,
      activeCam: DEFAULT_STUDIO_CAMERA,
      isFirstStep: false,
      totalPartsInScope: 80,
    });

    expect(picked.length).toBeGreaterThanOrEqual(3);
    expect(picked.length).toBeLessThanOrEqual(5);
  });

  it('allows up to ~8 compact distinct simple singletons in one step under cognitive budget', () => {
    // 10 distinct compact 1x1 pieces clustered tightly on the front-right corner
    const parts: DynamicPartDescriptor[] = [];
    for (let i = 0; i < 10; i++) {
      const gx = (i % 5) * 16;
      const gz = Math.floor(i / 5) * 16;
      parts.push(makePart(i, `p${i}`, i + 1, makeBox(40 + gx, 36, 40 + gz, 16, 24, 16)));
    }
    const modelBounds = makeBox(0, 36, 0, 200, 72, 200);
    const builtBounds = makeBox(0, 12, 0, 200, 24, 200);

    const picked = selectDynamicStepIndices({
      anchor: 0,
      parts,
      getEligibleCandidates: (placed) =>
        parts.map((p) => p.index).filter((i) => !placed.has(i)),
      modelBounds,
      builtBounds,
      activeCam: DEFAULT_STUDIO_CAMERA,
      isFirstStep: false,
      totalPartsInScope: 100,
    });

    expect(picked.length).toBeGreaterThanOrEqual(6);
    expect(picked.length).toBeLessThanOrEqual(8);
  });

  it('prevents mixing opposite exterior walls of a sizeable build in one step', () => {
    const modelBounds = makeBox(0, 48, 0, 240, 96, 240);
    const frontWall = makeBox(100, 48, 100);
    const backWall = makeBox(-100, 48, -100);
    expect(areOnOppositeWalls(frontWall, backWall, modelBounds)).toBe(true);

    const parts = [
      makePart(0, '3004', 4, frontWall),
      makePart(1, '3004', 4, makeBox(80, 48, 100)),
      makePart(2, '3004', 4, backWall),
    ];
    const picked = selectDynamicStepIndices({
      anchor: 0,
      parts,
      getEligibleCandidates: (placed) =>
        parts.map((p) => p.index).filter((i) => !placed.has(i)),
      modelBounds,
      builtBounds: modelBounds,
      activeCam: DEFAULT_STUDIO_CAMERA,
      isFirstStep: false,
      totalPartsInScope: 50,
    });

    expect(picked).toContain(0);
    expect(picked).toContain(1);
    expect(picked).not.toContain(2);
  });

  it('orders frontier candidates on the camera-facing side before the far side within the same layer band', () => {
    const refBounds = makeBox(0, 24, 0, 200, 48, 200);
    const frontRightBrick = makePart(0, '3004', 4, makeBox(80, 36, 80));
    const backLeftBrick = makePart(1, '3004', 4, makeBox(-80, 36, -80));

    expect(cameraCornerBucket(frontRightBrick.box, 'front_right', refBounds)).toBe(0);
    expect(cameraCornerBucket(backLeftBrick.box, 'front_right', refBounds)).toBe(2);

    const sortedFromFrontRight = [backLeftBrick, frontRightBrick].sort((a, b) =>
      compareFrontierCandidates(a, b, 'front_right', refBounds),
    );
    expect(sortedFromFrontRight[0].index).toBe(0);

    const sortedFromBackLeft = [frontRightBrick, backLeftBrick].sort((a, b) =>
      compareFrontierCandidates(a, b, 'back_left', refBounds),
    );
    expect(sortedFromBackLeft[0].index).toBe(1);
  });

  it('keeps camera sticky on front/center placements and rotates only when pieces are on the far corner', () => {
    const builtBoxes: WorldBox[] = [
      makeBox(-60, 24, -60, 80, 48, 80),
      makeBox(60, 24, -60, 80, 48, 80),
      makeBox(-60, 24, 60, 80, 48, 80),
      makeBox(60, 24, 60, 80, 48, 80),
      makeBox(0, 72, 0, 120, 48, 120),
    ];
    const builtBounds = computeBoundsFromBoxes(builtBoxes);

    // 1. Front-right piece -> stays on front_right with cue 'none'
    const frontRes = chooseStickyStepCamera(
      [makeBox(80, 36, 80)],
      builtBoxes,
      builtBounds,
      DEFAULT_STUDIO_CAMERA,
    );
    expect(frontRes.corner).toBe('front_right');
    expect(frontRes.changed).toBe(false);
    expect(frontRes.cue).toBe('none');

    // 2. Center piece -> stays sticky on front_right
    const centerRes = chooseStickyStepCamera(
      [makeBox(0, 36, 0)],
      builtBoxes,
      builtBounds,
      DEFAULT_STUDIO_CAMERA,
    );
    expect(centerRes.corner).toBe('front_right');
    expect(centerRes.changed).toBe(false);

    // 3. Far back-left corner piece -> rotates to back_left with yaw_180 cue
    const backRes = chooseStickyStepCamera(
      [makeBox(-90, 36, -90)],
      builtBoxes,
      builtBounds,
      DEFAULT_STUDIO_CAMERA,
    );
    expect(backRes.side).toBe('top');
    expect(backRes.corner).toBe('back_left');
    expect(backRes.changed).toBe(true);
    expect(backRes.cue).toBe('yaw_180');

    // 4. Subsequent back-left piece stays sticky at back_left without spinning back!
    const nextBackCam: StudioCameraPose = {
      side: backRes.side,
      corner: backRes.corner,
      az: backRes.az,
      el: backRes.el,
    };
    const backStayRes = chooseStickyStepCamera(
      [makeBox(-70, 36, -80)],
      builtBoxes,
      builtBounds,
      nextBackCam,
    );
    expect(backStayRes.corner).toBe('back_left');
    expect(backStayRes.changed).toBe(false);
    expect(backStayRes.cue).toBe('none');
  });

  it('flips to bottom view for true underside placements and flips back to top afterward', () => {
    const builtBoxes: WorldBox[] = [
      makeBox(-40, 36, -40, 80, 24, 80),
      makeBox(40, 36, -40, 80, 24, 80),
      makeBox(-40, 36, 40, 80, 24, 80),
      makeBox(40, 36, 40, 80, 24, 80),
      makeBox(0, 60, 0, 120, 24, 120),
      makeBox(0, 84, 0, 120, 24, 120),
    ];
    const builtBounds = computeBoundsFromBoxes(builtBoxes);

    // Brick attached strictly underneath the built floor plate
    const underRes = chooseStickyStepCamera(
      [makeBox(20, 12, 20, 40, 24, 40)],
      builtBoxes,
      builtBounds,
      DEFAULT_STUDIO_CAMERA,
    );
    expect(underRes.side).toBe('bottom');
    expect(underRes.cue).toBe('flip_vertical');

    // Next step placed on top flips back to top view
    const backTopRes = chooseStickyStepCamera(
      [makeBox(20, 108, 20, 40, 24, 40)],
      builtBoxes,
      builtBounds,
      { side: underRes.side, corner: underRes.corner, az: underRes.az, el: underRes.el },
    );
    expect(backTopRes.side).toBe('top');
    expect(backTopRes.cue).toBe('flip_vertical');
  });
});
