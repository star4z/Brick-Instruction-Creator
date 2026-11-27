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
  createGroundedPrereqChecker,
  expandBoundsWithBox,
  findCoPlanarFloorFoundation,
  hasAvoidableOverhang,
  isCandidateConnectedForStep,
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

  it('never groups detached underside plates with a train bogie axle and waits until the bridging floor connects them', () => {
    // Reproduces a train motor/bogie with a vertical axle and 4x6 + 2x6 plates sitting
    // on either side underneath an unplaced long train floor:
    //   0: Train Motor (already built in Step 1)
    //   1: Vertical Technic Axle (touches Train Motor 0 and Train Floor 2)
    //   2: Train Floor (touches Motor 0, Axle 1, and underside plates 3..6)
    //   3: Front 4x6 Plate (touches ONLY Train Floor 2)
    //   4: Front 2x6 Plate (touches ONLY Train Floor 2)
    //   5: Rear 4x6 Plate (touches ONLY Train Floor 2)
    //   6: Rear 2x6 Plate (touches ONLY Train Floor 2)
    const parts: DynamicPartDescriptor[] = [
      makePart(0, '88011', 72, makeBox(0, 12, 0, 120, 24, 200), 'wheel_holder'),
      makePart(1, '3707', 72, makeBox(0, 52, 0, 8, 96, 8), 'axle'),
      makePart(2, '6584', 72, makeBox(0, 28, 0, 120, 8, 480), 'structural'),
      makePart(3, '3032', 72, makeBox(0, 12, 160, 120, 8, 80), 'structural'),
      makePart(4, '3795', 72, makeBox(0, 12, 220, 120, 8, 40), 'structural'),
      makePart(5, '3032', 72, makeBox(0, 12, -160, 120, 8, 80), 'structural'),
      makePart(6, '3795', 72, makeBox(0, 12, -220, 120, 8, 40), 'structural'),
    ];
    const adj: number[][] = [
      [1, 2],       // 0: motor
      [0, 2],       // 1: vertical axle
      [0, 1, 3, 4, 5, 6], // 2: train floor
      [2],          // 3: front 4x6
      [2],          // 4: front 2x6
      [2],          // 5: rear 4x6
      [2],          // 6: rear 2x6
    ];
    const belowMap: number[][] = [
      [],
      [],
      [0, 3, 4, 5, 6],
      [],
      [],
      [],
      [],
    ];

    const modelBounds = computeBoundsFromBoxes(parts.map((p) => p.box));
    const placed = new Set<number>([0]);
    const remaining = new Set<number>([1, 2, 3, 4, 5, 6]);
    let builtBounds = expandBoundsWithBox(null, parts[0].box);
    const activeCam = DEFAULT_STUDIO_CAMERA;
    const steps: number[][] = [];

    while (remaining.size > 0) {
      const placedBeforeStep = new Set(placed);
      const isGrounded = createGroundedPrereqChecker(adj, belowMap, placedBeforeStep, remaining);
      const rawFrontier = Array.from(remaining).filter((i) =>
        adj[i].some((nb) => placedBeforeStep.has(nb)),
      );
      const unblocked = rawFrontier.filter(
        (i) => !belowMap[i].some((u) => remaining.has(u) && isGrounded(u)),
      );
      const frontier = unblocked.length > 0 ? unblocked : rawFrontier;
      frontier.sort((a, b) =>
        compareFrontierCandidates(parts[a], parts[b], activeCam.corner, builtBounds),
      );

      const anchor = frontier[0];
      const anchorY = parts[anchor].layerY;
      const anchorConnectedToPrev = adj[anchor].some((nb) => placedBeforeStep.has(nb));
      const stepIndices = selectDynamicStepIndices({
        anchor,
        parts,
        getEligibleCandidates: (placedInStep) =>
          Array.from(remaining).filter((i) => {
            if (placedInStep.has(i)) return false;
            if (Math.abs(parts[i].layerY - anchorY) > 12) return false;
            if (belowMap[i].some((u) => !placedBeforeStep.has(u) && isGrounded(u))) return false;
            return isCandidateConnectedForStep(
              i,
              anchorConnectedToPrev,
              adj,
              placedBeforeStep,
              placedInStep,
            );
          }),
        modelBounds,
        builtBounds,
        activeCam,
        isFirstStep: false,
        totalPartsInScope: parts.length,
      });

      // Invariant: every single piece placed in Steps 2+ must directly touch placedBeforeStep!
      for (const idx of stepIndices) {
        expect(adj[idx].some((nb) => placedBeforeStep.has(nb))).toBe(true);
      }

      steps.push(stepIndices);
      for (const idx of stepIndices) {
        remaining.delete(idx);
        placed.add(idx);
        builtBounds = expandBoundsWithBox(builtBounds, parts[idx].box);
      }
    }

    const stepOf = (idx: number) => steps.findIndex((s) => s.includes(idx));
    // Vertical axle (1) must NOT share a step with any detached underside plate (3..6)
    for (const plateIdx of [3, 4, 5, 6]) {
      expect(stepOf(plateIdx)).not.toBe(stepOf(1));
      // Every underside plate must be placed strictly AFTER the train floor (2) connects it
      expect(stepOf(plateIdx)).toBeGreaterThan(stepOf(2));
    }
  });

  it('keeps grounded vertical prerequisites strict on an existing baseplate while unblocking detached baseplates until bridged', () => {
    // 0: Baseplate L (placed)
    // 1: Wall L1 (placed, on Baseplate L)
    // 2: Wall R1 (unplaced, on Baseplate L -> grounded!)
    // 3: Wall R2 (unplaced, on Wall R1 -> transitively grounded!)
    // 4: Roof Lintel (unplaced, bridges Wall L1 and Wall R2)
    // 5: Detached Baseplate R (unplaced, does NOT touch Baseplate L)
    // 6: Bridge Plate (unplaced, touches Baseplate L and sits above Detached Baseplate R)
    const adj: number[][] = [
      [1, 2, 6], // 0: Baseplate L
      [0, 4],    // 1: Wall L1
      [0, 3],    // 2: Wall R1
      [2, 4],    // 3: Wall R2
      [1, 3],    // 4: Roof Lintel
      [6],       // 5: Detached Baseplate R
      [0, 5],    // 6: Bridge Plate
    ];
    const belowMap: number[][] = [
      [],     // 0
      [0],    // 1
      [0],    // 2
      [2],    // 3
      [1, 3], // 4: needs 3 (which needs 2 on placed 0)
      [],     // 5: detached
      [0, 5], // 6: sits above placed 0 and detached 5
    ];

    const placed = new Set<number>([0, 1]);
    const remaining = new Set<number>([2, 3, 4, 5, 6]);
    const isGrounded = createGroundedPrereqChecker(adj, belowMap, placed, remaining);

    // Wall R1 (2) and Wall R2 (3) ARE grounded in placed Baseplate L -> Roof Lintel (4) stays blocked!
    expect(isGrounded(2)).toBe(true);
    expect(isGrounded(3)).toBe(true);
    expect(belowMap[4].some((u) => remaining.has(u) && isGrounded(u))).toBe(true);

    // Detached Baseplate R (5) is NOT grounded in placed -> Bridge Plate (6) is NOT deadlocked!
    expect(isGrounded(5)).toBe(false);
    expect(belowMap[6].some((u) => remaining.has(u) && isGrounded(u))).toBe(false);
  });

  it('enforces strict step connectivity on Step 1 and during disconnected-island fallback', () => {
    // Island A: 0 -- 1
    // Island B: 2 -- 3 (disconnected from Island A)
    // Island C: 4 (singleton disconnected from both)
    const adj: number[][] = [
      [1],
      [0],
      [3],
      [2],
      [],
    ];

    // Step 1 (nothing placed yet): anchor = 0
    const emptyPrev = new Set<number>();
    const step1 = new Set<number>([0]);
    expect(isCandidateConnectedForStep(1, false, adj, emptyPrev, step1)).toBe(true);
    expect(isCandidateConnectedForStep(2, false, adj, emptyPrev, step1)).toBe(false);
    expect(isCandidateConnectedForStep(4, false, adj, emptyPrev, step1)).toBe(false);

    // Disconnected-island fallback after Island A is placed: anchor = 2 (in Island B)
    const prevWithA = new Set<number>([0, 1]);
    const fallbackStep = new Set<number>([2]);
    // 3 connects to 2 in Island B -> allowed
    expect(isCandidateConnectedForStep(3, false, adj, prevWithA, fallbackStep)).toBe(true);
    // 4 is in separate Island C -> NEVER lumped with Island B
    expect(isCandidateConnectedForStep(4, false, adj, prevWithA, fallbackStep)).toBe(false);
  });

  it('co-places co-planar floor foundation plates in Step 1 so Step 2 bridging plates never awkwardly overhang', () => {
    // 2-layer staggered plate sandwich on a wide chassis (span >= 400 LDU):
    // Layer 0 (y = 0..8):
    //   0: 2x6 plate at rear (x=0..120, z=0..40)
    //   1: 1x10 plate along right edge (x=100..120, z=40..240)
    //   2: 4x4 plate in middle (x=20..100, z=40..120)
    //   3: 1x10 plate along left edge (x=0..20, z=40..240)
    //   4: 4x4 round plate further forward (x=20..100, z=120..200) — NOT under U1/U2
    // Layer 1 (y = 8..16):
    //   5: 4x6 plate (x=0..80, z=0..120) — bridges 0, 2, 3 (only 33% on 0 alone!)
    //   6: 2x6 plate (x=80..120, z=0..120) — bridges 0, 2, 1 (only 33% on 0 alone!)
    //   7: 2x2 plate (x=40..80, z=100..140) — sits on 2 and 4
    //   8: 4x6 plate (x=0..80, z=120..240) — bridges 3 and 4 (overhangs while 4 is unplaced!)
    const parts: DynamicPartDescriptor[] = [
      makePart(0, '3795', 4, makeBox(60, 4, 20, 120, 8, 40)),
      makePart(1, '4477', 4, makeBox(110, 4, 140, 20, 8, 200)),
      makePart(2, '3031', 72, makeBox(60, 4, 80, 80, 8, 80)),
      makePart(3, '4477', 4, makeBox(10, 4, 140, 20, 8, 200)),
      makePart(4, '60474', 14, makeBox(60, 4, 160, 80, 8, 80)),
      makePart(5, '3032', 4, makeBox(40, 12, 60, 80, 8, 120)),
      makePart(6, '3795', 4, makeBox(100, 12, 60, 40, 8, 120)),
      makePart(7, '3022', 4, makeBox(60, 12, 120, 40, 8, 40)),
      makePart(8, '3032', 4, makeBox(40, 12, 180, 80, 8, 120)),
    ];
    const boxes = parts.map((p) => p.box);
    const roles = parts.map((p) => p.role);
    const cladding = parts.map(() => false);
    const adj: number[][] = [
      [5, 6],       // 0: rear 2x6
      [6],          // 1: right 1x10
      [5, 6, 7],    // 2: middle 4x4
      [5, 8],       // 3: left 1x10
      [7, 8],       // 4: forward 4x4 round
      [0, 2, 3],    // 5: 4x6 bridge
      [0, 1, 2],    // 6: 2x6 bridge
      [2, 4],       // 7: 2x2 bridge
      [3, 4],       // 8: forward 4x6 bridge
    ];
    const belowMap: number[][] = parts.map(() => []);
    const remaining = new Set<number>(parts.map((p) => p.index));
    // Simulate a wide model (span 480 >= 400 so baseMaxSpread = 120)
    const wideModelBounds: WorldBox = {
      min: [0, 0, 0],
      max: [120, 80, 480],
      center: [60, 40, 240],
    };

    const partners = findCoPlanarFloorFoundation(0, remaining, boxes, adj, roles, cladding, belowMap);
    expect(Array.from(partners).sort((a, b) => a - b)).toEqual([1, 2, 3]);
    expect(partners.has(4)).toBe(false);

    const step1 = selectDynamicStepIndices({
      anchor: 0,
      parts,
      getEligibleCandidates: (placedInStep) =>
        Array.from(remaining).filter((i) => {
          if (placedInStep.has(i)) return false;
          if (Math.abs(parts[i].layerY - parts[0].layerY) > 12) return false;
          if (partners.has(i)) return true;
          return isCandidateConnectedForStep(i, false, adj, new Set(), placedInStep);
        }),
      modelBounds: wideModelBounds,
      builtBounds: null,
      activeCam: DEFAULT_STUDIO_CAMERA,
      isFirstStep: true,
      totalPartsInScope: 342,
      coPlanarFloorPartners: partners,
    });

    // Step 1 places all 4 co-planar foundation plates together on the table
    expect(step1.slice().sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);

    // After Step 1, U1 (5) and U2 (6) have 100% support (zero avoidable overhang),
    // while forward 4x6 (8) has avoidable overhang because round plate (4) is still unplaced!
    const placedAfter1 = new Set<number>(step1);
    const remAfter1 = new Set<number>([4, 5, 6, 7, 8]);
    expect(hasAvoidableOverhang(5, boxes, adj, placedAfter1, remAfter1, roles, cladding)).toBe(false);
    expect(hasAvoidableOverhang(6, boxes, adj, placedAfter1, remAfter1, roles, cladding)).toBe(false);
    expect(hasAvoidableOverhang(8, boxes, adj, placedAfter1, remAfter1, roles, cladding)).toBe(true);

    // compareFrontierCandidates orders well-supported U1 (5) ahead of avoidably overhanging U4 (8)
    const overhangSet = new Set<number>([8]);
    const builtBounds1 = computeBoundsFromBoxes(step1.map((i) => boxes[i]));
    expect(
      compareFrontierCandidates(parts[5], parts[8], DEFAULT_STUDIO_CAMERA.corner, builtBounds1, undefined, overhangSet),
    ).toBeLessThan(0);
  });

  it('ignores non-coplanar suspended parts in findCoPlanarFloorFoundation and never flags intentional cantilevers', () => {
    // 0: Floor plate (y=0..8, 4x4)
    // 1: Hanging skirt (y=2..8, NOT co-planar — minY differs by 2 LDU > 1.5!)
    // 2: Spanning upper plate (y=8..16, 4x8) sitting on 0 and 1
    // 3: Intentional cantilever wingtip (y=8..16, 2x6) sitting 33% on 0 with NOTHING under its overhanging 67%
    const boxes: WorldBox[] = [
      makeBox(0, 4, 0, 80, 8, 80),     // 0: minY=0, maxY=8
      makeBox(80, 5, 0, 80, 6, 80),    // 1: minY=2, maxY=8 (suspended skirt)
      makeBox(40, 12, 0, 160, 8, 80),  // 2: minY=8, maxY=16
      makeBox(-60, 12, 0, 120, 8, 40), // 3: minY=8, maxY=16 (overhangs left into empty air)
    ];
    const roles = ['structural', 'structural', 'structural', 'structural'];
    const cladding = [false, false, false, false];
    const adj: number[][] = [
      [2, 3],
      [2],
      [0, 1],
      [0],
    ];
    const belowMap: number[][] = [[], [], [], []];
    const remaining = new Set<number>([0, 1, 2, 3]);

    // Suspended skirt (1) is NOT co-planar with floor (0) -> excluded
    const partners = findCoPlanarFloorFoundation(0, remaining, boxes, adj, roles, cladding, belowMap);
    expect(partners.size).toBe(0);

    // Wingtip (3) has NO unplaced lower support -> NOT an avoidable overhang!
    const placed = new Set<number>([0]);
    const remAfter = new Set<number>([1, 2, 3]);
    expect(hasAvoidableOverhang(3, boxes, adj, placed, remAfter, roles, cladding)).toBe(false);
    // Spanning plate (2) DOES have unplaced lower support (1) -> avoidable overhang!
    expect(hasAvoidableOverhang(2, boxes, adj, placed, remAfter, roles, cladding)).toBe(true);
  });

  it('groups compact mirror-symmetric pairs generically across elongated, 8-to-10-stud, winged, and asymmetric-protrusion models', () => {
    // 1. Elongated 6-stud-wide (120 LDU) by 27-stud-long (540 LDU) chassis: pairDist = 100
    const elongatedBounds = makeBox(0, 60, -30, 120, 120, 540);
    const slopeL = makePart(0, '3665', 72, makeBox(-50, 61, -265, 20, 24, 40));
    const slopeR = makePart(1, '3665', 72, makeBox(50, 61, -265, 20, 24, 40));
    expect(classifySameSkuPattern(slopeR.box, [slopeL.box], elongatedBounds)).toBe('structured');
    expect(
      selectDynamicStepIndices({
        anchor: 0,
        parts: [slopeL, slopeR],
        getEligibleCandidates: (placed) => [0, 1].filter((i) => !placed.has(i)),
        modelBounds: elongatedBounds,
        builtBounds: elongatedBounds,
        activeCam: DEFAULT_STUDIO_CAMERA,
        isFirstStep: false,
        totalPartsInScope: 20,
      }),
    ).toEqual([0, 1]);

    // 2. 10-stud-wide (200 LDU) elongated vehicle: pairDist = 180 (within COMPACT_MIRROR_MAX_DIST_LDU)
    const tenStudBounds = makeBox(0, 40, 0, 200, 80, 440);
    const fenderL = makePart(0, '3040', 4, makeBox(-90, 24, -120, 20, 24, 40));
    const fenderR = makePart(1, '3040', 4, makeBox(90, 24, -120, 20, 24, 40));
    expect(areOnOppositeWalls(fenderL.box, fenderR.box, tenStudBounds, true)).toBe(false);
    expect(
      selectDynamicStepIndices({
        anchor: 0,
        parts: [fenderL, fenderR],
        getEligibleCandidates: (placed) => [0, 1].filter((i) => !placed.has(i)),
        modelBounds: tenStudBounds,
        builtBounds: tenStudBounds,
        activeCam: DEFAULT_STUDIO_CAMERA,
        isFirstStep: false,
        totalPartsInScope: 40,
      }),
    ).toEqual([0, 1]);

    // 3. Wide winged starfighter (spanX = 360): inner cockpit pair at x = ±40 (pairDist = 80) still groups
    const wingedBounds = makeBox(0, 40, 0, 360, 80, 300);
    const cockpitL = makePart(0, '3665', 71, makeBox(-40, 24, 60, 20, 24, 40));
    const cockpitR = makePart(1, '3665', 71, makeBox(40, 24, 60, 20, 24, 40));
    expect(classifySameSkuPattern(cockpitR.box, [cockpitL.box], wingedBounds)).toBe('structured');

    // 4. Off-center flanking pair (e.g. twin pillars around a doorway at x = +30 and x = +110, NOT on centerline x = 0)
    const asymmetricBounds = makeBox(0, 40, 0, 320, 80, 240);
    const doorPillarL = makePart(0, '3665', 72, makeBox(30, 24, -60, 20, 24, 40));
    const doorPillarR = makePart(1, '3665', 72, makeBox(110, 24, -60, 20, 24, 40));
    expect(classifySameSkuPattern(doorPillarR.box, [doorPillarL.box], asymmetricBounds)).toBe('structured');
    expect(
      selectDynamicStepIndices({
        anchor: 0,
        parts: [doorPillarL, doorPillarR],
        getEligibleCandidates: (placed) => [0, 1].filter((i) => !placed.has(i)),
        modelBounds: asymmetricBounds,
        builtBounds: asymmetricBounds,
        activeCam: DEFAULT_STUDIO_CAMERA,
        isFirstStep: false,
        totalPartsInScope: 30,
      }),
    ).toEqual([0, 1]);

    // 5. Off-center 2x2 corner rectangle (all 4 corners group cleanly without centerline symmetry)
    const c1 = makeBox(20, 24, 20, 20, 24, 20);
    const c2 = makeBox(100, 24, 20, 20, 24, 20);
    const c3 = makeBox(20, 24, 100, 20, 24, 20);
    const c4 = makeBox(100, 24, 100, 20, 24, 20);
    expect(classifySameSkuPattern(c2, [c1], asymmetricBounds)).toBe('structured');
    expect(classifySameSkuPattern(c3, [c1, c2], asymmetricBounds)).toBe('structured');
    expect(classifySameSkuPattern(c4, [c1, c2, c3], asymmetricBounds)).toBe('structured');

    // 6. Non-uniform 3rd collinear piece is still classified as scattered
    const irregularThird = makeBox(150, 24, 20, 20, 24, 20);
    expect(classifySameSkuPattern(irregularThird, [c1, c2], asymmetricBounds)).toBe('scattered');

    // 7. Wide building (320 x 320): opposite exterior walls (pairDist = 300 > 180) remain separated
    const wideBounds = makeBox(0, 60, 0, 320, 120, 320);
    const wallL = makePart(0, '3665', 72, makeBox(-150, 12, 0, 20, 24, 40));
    const wallR = makePart(1, '3665', 72, makeBox(150, 12, 0, 20, 24, 40));
    expect(classifySameSkuPattern(wallR.box, [wallL.box], wideBounds)).toBe('scattered');
    expect(areOnOppositeWalls(wallL.box, wallR.box, wideBounds, true)).toBe(true);
  });
});
