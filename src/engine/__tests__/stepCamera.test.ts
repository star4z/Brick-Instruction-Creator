import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STUDIO_CAMERA,
  chooseMinifigPlacementCamera,
  type OccluderBox,
  type StudioCameraPose,
} from '../minifigCamera';
import type { WorldBox } from '../minifigPose';
import {
  chooseStickyStepCamera,
  compareFrontierCandidates,
  computeBoundsFromBoxes,
  expandBoundsWithBox,
} from '../dynamicStepSizer';
import {
  AUTO_FOCUS_MIN_FULL_RADIUS_LDU,
  STEP_VISIBILITY_DEADBAND,
  computeStepCameraFraming,
  evaluateStepOcclusionVisibility,
  isStrictUndersidePlacement,
  optimizeStudioStepCameraSequence,
  stepVisibilityPenalty,
  type OptimizableStepCameraInput,
} from '../stepCamera';
import { optimizeCameraSequence } from '../cameraOptimizer';
import { DEMO_MODELS } from '../../data/demoModels';
import { buildConnectivityGraph } from '../connectivity';
import { parseLDrawSource } from '../ldrawParser';
import { generateInstructionPlan } from '../stepGenerator';

function makeBox(
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): WorldBox {
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
  };
}

function makeCenteredBox(
  cx: number,
  cy: number,
  cz: number,
  sx = 20,
  sy = 24,
  sz = 20,
): WorldBox {
  return makeBox(
    cx - sx / 2,
    cy - sy / 2,
    cz - sz / 2,
    cx + sx / 2,
    cy + sy / 2,
    cz + sz / 2,
  );
}

/** Builds cumulative DP inputs from an ordered list of step brick boxes. */
function buildSequenceInputs(
  stepBoxLists: readonly (readonly WorldBox[])[],
): OptimizableStepCameraInput[] {
  const allOccs: OccluderBox[] = [];
  let builtBounds: WorldBox | null = null;
  const inputs: OptimizableStepCameraInput[] = [];

  for (const stepBoxes of stepBoxLists) {
    inputs.push({
      stepBoxes,
      occludersBefore: allOccs,
      occluderCountBefore: allOccs.length,
      builtBoundsBefore: builtBounds,
    });
    for (const b of stepBoxes) {
      allOccs.push({ box: b, transparent: false });
      builtBounds = expandBoundsWithBox(builtBounds, b);
    }
  }
  return inputs;
}

describe('Step Camera Stability & Steady Framing', () => {
  it('stays locked on front_right with zero rotations across a multi-course 4-wall house build', () => {
    // 160x120 baseplate + 4 courses of front/right/left/back walls + roof (18 steps total)
    const steps: WorldBox[][] = [
      // Baseplate split into 4 plates
      [makeBox(-80, 0, -60, 0, 8, 0), makeBox(0, 0, -60, 80, 8, 0)],
      [makeBox(-80, 0, 0, 0, 8, 60), makeBox(0, 0, 0, 80, 8, 60)],
    ];
    for (let course = 0; course < 4; course++) {
      const y0 = 8 + course * 24;
      const y1 = y0 + 24;
      steps.push([makeBox(-80, y0, 40, 80, y1, 60)]);   // front wall
      steps.push([makeBox(60, y0, -40, 80, y1, 40)]);   // right wall
      steps.push([makeBox(-80, y0, -40, -60, y1, 40)]); // left wall
      steps.push([makeBox(-80, y0, -60, 80, y1, -40)]); // back wall
    }
    // Roof cap
    steps.push([makeBox(-80, 104, -60, 80, 112, 60)]);

    const result = optimizeStudioStepCameraSequence(buildSequenceInputs(steps));
    expect(result).toHaveLength(steps.length);

    const rotations = result.filter((r) => r.cue !== 'none');
    expect(rotations).toHaveLength(0);
    for (const r of result) {
      expect(r.side).toBe('top');
      expect(r.corner).toBe('front_right');
    }
  });

  it('never spins across ends of an elongated flat train deck (480 x 120 LDU)', () => {
    const builtBoxes: WorldBox[] = [
      makeBox(-240, 0, -60, -120, 8, 60),
      makeBox(-120, 0, -60, 0, 8, 60),
      makeBox(0, 0, -60, 120, 8, 60),
      makeBox(120, 0, -60, 240, 8, 60),
    ];
    const builtBounds = computeBoundsFromBoxes(builtBoxes);

    // Placing bricks on left-back, left-front, right-back, right-front of the open deck
    const spots: WorldBox[] = [
      makeCenteredBox(-200, 20, -40),
      makeCenteredBox(-200, 20, 40),
      makeCenteredBox(200, 20, -40),
      makeCenteredBox(200, 20, 40),
    ];

    let cam: StudioCameraPose = { ...DEFAULT_STUDIO_CAMERA };
    for (const spot of spots) {
      const choice = chooseStickyStepCamera([spot], builtBoxes, builtBounds, cam);
      expect(choice.changed).toBe(false);
      expect(choice.cue).toBe('none');
      expect(choice.corner).toBe('front_right');
      cam = { side: choice.side, corner: choice.corner, az: choice.az, el: choice.el };
    }
  });

  it('rotates cleanly when new bricks are genuinely hidden behind a tall built wall and stays there for follow-up back-side steps', () => {
    const steps: WorldBox[][] = [
      // Tall front wall + floor (built from front_right)
      [
        makeBox(-80, 0, -60, 80, 8, 60),
        makeBox(-80, 8, 30, 80, 128, 60), // tall 120-LDU front wall blocking +Z
        makeBox(50, 8, -60, 80, 128, 30), // tall 120-LDU right wall blocking +X
        makeBox(-80, 8, -60, -60, 32, 30),
      ],
      // Step 1: brick on front face (clearly visible from front_right)
      [makeBox(10, 20, 60, 50, 44, 72)],
      // Step 2: brick tucked low behind the tall front+right walls (invisible from front_right!)
      [makeBox(-30, 8, -30, 10, 32, 10)],
      // Step 3: another brick tucked low behind the tall walls
      [makeBox(-50, 8, -45, -10, 32, -15)],
      // Step 4: top-rim brick visible from every top angle -> should STAY on back_left (no snap-back!)
      [makeBox(-40, 128, 30, 40, 152, 60)],
    ];

    const result = optimizeStudioStepCameraSequence(buildSequenceInputs(steps));
    expect(result[0].corner).toBe('front_right');
    expect(result[1].corner).toBe('front_right');
    // Must rotate away from front_right to reveal hidden Step 2
    expect(result[2].corner).not.toBe('front_right');
    expect(result[2].visibility).toBeGreaterThanOrEqual(STEP_VISIBILITY_DEADBAND);
    // Steps 3 and 4 stay steady at Step 2's corner without spinning back!
    expect(result[3].corner).toBe(result[2].corner);
    expect(result[3].cue).toBe('none');
    expect(result[4].corner).toBe(result[2].corner);
    expect(result[4].cue).toBe('none');
  });

  it('eliminates 1-step ping-pong rotations when a single step is only mildly grazed', () => {
    // Verify deadband & penalty curve prevent 1-step round trips for partially visible steps
    expect(stepVisibilityPenalty(1.0)).toBe(0);
    expect(stepVisibilityPenalty(STEP_VISIBILITY_DEADBAND)).toBe(0);
    expect(stepVisibilityPenalty(0.55)).toBeLessThan(0.4);

    // Build a low 24-LDU wall on the front; placing a 24-LDU brick right behind it leaves top visible (~0.55-0.85)
    const steps: WorldBox[][] = [
      [
        makeBox(-60, 0, -60, 60, 8, 60),
        makeBox(-60, 8, 20, 60, 32, 60),
        makeBox(20, 8, -60, 60, 32, 20),
        makeBox(-60, 8, -60, 20, 16, 20),
      ],
      // Brick behind the low 24-LDU wall (partially grazed on front side, top fully open)
      [makeBox(-10, 16, -10, 20, 40, 20)],
      // Next steps are on the front-right corner
      [makeBox(30, 32, 30, 60, 56, 60)],
      [makeBox(30, 56, 30, 60, 80, 60)],
    ];

    const result = optimizeStudioStepCameraSequence(buildSequenceInputs(steps));
    expect(result.every((r) => r.corner === 'front_right' && r.cue === 'none')).toBe(true);
  });

  it('flips to bottom for a true tightly covered underside placement, and does NOT flip for a brick under a distant high roof', () => {
    // 1. Brick directly under a floor plate (gap = 0 LDU)
    const floorAndUpper: WorldBox[] = [
      makeBox(-80, 24, -80, 0, 48, 0),
      makeBox(0, 24, -80, 80, 48, 0),
      makeBox(-80, 24, 0, 0, 48, 80),
      makeBox(0, 24, 0, 80, 48, 80),
      makeBox(-60, 48, -60, 60, 96, 60),
    ];
    const undersideStep = [makeBox(0, 0, 0, 40, 24, 40)];
    expect(
      isStrictUndersidePlacement(undersideStep, floorAndUpper, computeBoundsFromBoxes(floorAndUpper)),
    ).toBe(true);

    const dpRes = optimizeStudioStepCameraSequence(
      buildSequenceInputs([
        floorAndUpper,
        undersideStep,
        [makeBox(-20, 96, -20, 20, 120, 20)],
      ]),
    );
    expect(dpRes[0].side).toBe('top');
    expect(dpRes[1].side).toBe('bottom');
    expect(dpRes[1].cue).toBe('flip_vertical');
    expect(dpRes[2].side).toBe('top');
    expect(dpRes[2].cue).toBe('flip_vertical');

    // 2. Brick sitting on the ground floor 80 LDU below a high roof (openly visible from top 3/4 view!)
    const openPavilion: WorldBox[] = [
      makeBox(-80, 0, -80, 80, 8, 80),      // ground floor
      makeBox(-80, 8, -80, -60, 112, -60),  // back-left pillar
      makeBox(60, 8, -80, 80, 112, -60),    // back-right pillar
      makeBox(-80, 8, 60, -60, 112, 80),    // front-left pillar
      makeBox(-80, 112, -80, 80, 124, 80),  // high roof 80+ LDU above a 24-LDU floor brick
    ];
    const chairInsideRoom = [makeBox(0, 8, 0, 30, 32, 30)];
    expect(
      isStrictUndersidePlacement(chairInsideRoom, openPavilion, computeBoundsFromBoxes(openPavilion)),
    ).toBe(false);

    const pavilionRes = optimizeStudioStepCameraSequence(
      buildSequenceInputs([openPavilion, chairInsideRoom]),
    );
    expect(pavilionRes[1].side).toBe('top');
    expect(pavilionRes[1].cue).toBe('none');
  });

  it('continues smoothly from initialCamera across segments (e.g., after a minifigure rotation or between bags)', () => {
    const startCam: StudioCameraPose = {
      side: 'top',
      corner: 'front_left',
      az: 322,
      el: 30,
    };
    const steps: WorldBox[][] = [
      [makeBox(-60, 0, -40, 60, 8, 40), makeBox(-60, 8, -40, 60, 32, 40)],
      [makeBox(-40, 32, -20, 40, 56, 20)],
      [makeBox(-20, 56, -20, 20, 80, 20)],
    ];

    const res = optimizeStudioStepCameraSequence(buildSequenceInputs(steps), {
      initialCamera: startCam,
    });
    expect(res[0].corner).toBe('front_left');
    expect(res[0].cue).toBe('none');
    expect(res[1].corner).toBe('front_left');
    expect(res[2].corner).toBe('front_left');
  });

  it('keeps an already-unobstructed minifigure placement steady at prevCamera without needless spinning', () => {
    // Low flat baseplate — minifigure on front-right is 100% unobstructed from front_right,
    // even though the minifigure faces sideways (-X)
    const baseplate: OccluderBox[] = [{ box: makeBox(-100, 0, -100, 100, 8, 100) }];
    const figure = [
      { role: 'hips' as const, box: makeBox(30, 36, 30, 62, 48, 50) },
      { role: 'torso' as const, box: makeBox(27, 48, 30, 65, 80, 50) },
      { role: 'head' as const, box: makeBox(34, 80, 28, 58, 104, 52) },
    ];

    const choice = chooseMinifigPlacementCamera(figure, baseplate, [-1, 0, 0], DEFAULT_STUDIO_CAMERA);
    expect(choice.corner).toBe('front_right');
    expect(choice.cue).toBe('none');
  });

  it('keeps auto framing rock-steady on the full model for normal/medium builds and preserves explicit Close-Up / Full overrides', () => {
    // Normal / medium models (fullRadius <= AUTO_FOCUS_MIN_FULL_RADIUS_LDU): ZERO zoom or center jump!
    for (const fullRadius of [125, 180, 260, AUTO_FOCUS_MIN_FULL_RADIUS_LDU]) {
      const res = computeStepCameraFraming({
        focusMode: 'auto',
        hasPrevParts: true,
        fullCenter: [0, 40, 0],
        fullRadius,
        newCenter: [-120, 20, -80],
        newRadius: 22,
      });
      expect(res.center).toEqual([0, 40, 0]);
      expect(res.radius).toBe(fullRadius);
      expect(res.isZoomedIn).toBe(false);
    }

    // Explicit 'focus' (Close-Up): still zooms tightly onto the newly added bricks
    const closeUp = computeStepCameraFraming({
      focusMode: 'focus',
      hasPrevParts: true,
      fullCenter: [0, 40, 0],
      fullRadius: 200,
      newCenter: [-100, 20, -60],
      newRadius: 24,
    });
    expect(closeUp.isZoomedIn).toBe(true);
    expect(closeUp.radius).toBeLessThan(100);
    expect(closeUp.center[0]).toBeLessThan(-80);

    // Truly massive un-subdivided model (fullRadius = 520) with a tiny detail:
    // applies a gentle, bounded, context-preserving zoom (never cropping 75% off-screen!)
    const megaAuto = computeStepCameraFraming({
      focusMode: 'auto',
      hasPrevParts: true,
      fullCenter: [0, 80, 0],
      fullRadius: 520,
      newCenter: [-240, 40, 120],
      newRadius: 20,
    });
    expect(megaAuto.isZoomedIn).toBe(true);
    expect(megaAuto.radius).toBeGreaterThanOrEqual(520 * 0.62 - 1);
    expect(megaAuto.radius).toBeLessThan(520);
    // Center stays >=58% anchored to full model center (abs shift <= 42% of 240 = 100.8)
    expect(Math.abs(megaAuto.center[0])).toBeLessThanOrEqual(102);

    // Explicit 'full' ALWAYS stays on full model even on a 520-LDU mega build
    const megaFull = computeStepCameraFraming({
      focusMode: 'full',
      hasPrevParts: true,
      fullCenter: [0, 80, 0],
      fullRadius: 520,
      newCenter: [-240, 40, 120],
      newRadius: 20,
    });
    expect(megaFull.center).toEqual([0, 80, 0]);
    expect(megaFull.radius).toBe(520);
    expect(megaFull.isZoomedIn).toBe(false);
  });

  it('keeps modular cameraOptimizer steady across demo models without gratuitous spinning', () => {
    const cottage = DEMO_MODELS.find((d) => d.id === 'alpine-cottage')!;
    const model = parseLDrawSource(cottage.ldrawSource, 'cottage.ldr', 'demo');
    const graph = buildConnectivityGraph(model.parts);
    const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});

    const steps = plan.chapters[0].stepIds.map((id) => plan.steps[id]);
    const partsById = Object.fromEntries(model.parts.map((p) => [p.id, p]));
    const opt = optimizeCameraSequence(steps, partsById, {});
    const rotationCount = opt.filter((s) => s.rotationCue !== 'none').length;
    // A small open cottage should require at most 1 rotation across its entire build
    expect(rotationCount).toBeLessThanOrEqual(1);
  });

  it('runs global Viterbi camera optimization quickly on a 100-step, 1,000-brick model', () => {
    const steps: WorldBox[][] = [];
    for (let s = 0; s < 100; s++) {
      const layer = Math.floor(s / 10);
      const col = s % 10;
      const boxes: WorldBox[] = [];
      for (let b = 0; b < 10; b++) {
        boxes.push(makeCenteredBox(col * 20 - 100, layer * 24 + 12, b * 20 - 100));
      }
      steps.push(boxes);
    }

    const t0 = performance.now();
    const res = optimizeStudioStepCameraSequence(buildSequenceInputs(steps));
    const elapsedMs = performance.now() - t0;

    expect(res).toHaveLength(100);
    expect(res.filter((r) => r.cue !== 'none')).toHaveLength(0);
    expect(elapsedMs).toBeLessThan(250);
  });

  it('treats transparent occluders as partially see-through in evaluateStepOcclusionVisibility', () => {
    const brick = [makeBox(-20, 8, -20, 20, 32, 20)];
    const solidFrontWall: OccluderBox[] = [
      { box: makeBox(-60, 0, 24, 60, 120, 44), transparent: false },
    ];
    const glassFrontWall: OccluderBox[] = [
      { box: makeBox(-60, 0, 24, 60, 120, 44), transparent: true },
    ];

    const behindSolid = evaluateStepOcclusionVisibility(brick, solidFrontWall, 38, 30);
    const behindGlass = evaluateStepOcclusionVisibility(brick, glassFrontWall, 38, 30);
    expect(behindGlass.visibility).toBeGreaterThan(behindSolid.visibility + 0.3);
  });

  it('chooses a single shared 90-degree camera turn for consecutive occluded steps on the -X side instead of chaining multiple turns', () => {
    // Tall wall along the middle blocking +X from -X
    const tallWall: WorldBox[] = [
      makeBox(-60, 0, -100, 60, 8, 100),
      makeBox(-10, 8, -100, 10, 140, 100),
      makeBox(-60, 8, -100, -10, 24, -80),
      makeBox(10, 8, 80, 60, 24, 100),
    ];
    // Step 1: low brick on +X side (clear from front_right, hidden from front_left/back_left)
    // Step 2: low brick at (-45..-15, 8..32, -50..-20) on -X side (hidden from front_right, clear from front_left & back_left)
    // Step 3: low brick at (-45..-15, 8..32, +20..+50) on -X side (hidden from front_right, clear from front_left)
    const steps: WorldBox[][] = [
      tallWall,
      [makeBox(20, 8, 10, 50, 32, 40)],
      [makeBox(-45, 8, -50, -15, 32, -20)],
      [makeBox(-45, 8, 20, -15, 32, 50)],
    ];

    const res = optimizeStudioStepCameraSequence(buildSequenceInputs(steps));
    const turns = res.filter((r) => r.cue !== 'none');
    expect(turns).toHaveLength(1);
    expect(res[0].corner).toBe('front_right');
    expect(res[1].corner).toBe('front_right');
    expect(res[2].corner).toBe('front_left');
    expect(res[3].corner).toBe('front_left');
  });

  it('defers tall foreground window frames (>=48 LDU) until shorter bricks on the same floor are placed', () => {
    const refBounds = makeBox(-80, 0, -60, 80, 80, 60);
    const frontWindow = {
      index: 0,
      partId: '60594',
      colorId: 15,
      sku: '60594|15',
      role: 'structural',
      box: makeBox(20, 8, 40, 80, 80, 60), // 72 LDU tall on front-right!
      layerY: 8,
      isCladding: false,
    };
    const backSeat = {
      index: 1,
      partId: '4079',
      colorId: 4,
      sku: '4079|4',
      role: 'structural',
      box: makeBox(-60, 8, -40, -20, 32, 0), // 24 LDU tall on back-left
      layerY: 8,
      isCladding: false,
    };

    const sorted = [frontWindow, backSeat].sort((a, b) =>
      compareFrontierCandidates(a, b, 'front_right', refBounds),
    );
    expect(sorted[0].index).toBe(1);
  });
});
