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
  STEP_CAMERA_FRAMING_MARGIN,
  STEP_VISIBILITY_DEADBAND,
  computeLayoutAlignedCanonicalAzimuth,
  computeProjectedBoxesExtents,
  computeProjectedOrthoHalfExtents,
  computeStepCameraFraming,
  computeStepOrthoFrustum,
  evaluateStepOcclusionVisibility,
  findPreviousStudioModelStep,
  isStrictUndersidePlacement,
  optimizeStudioStepCameraSequence,
  resolveEffectiveStudioStepCue,
  resolveStudioStepCamera,
  stepVisibilityPenalty,
  type OptimizableStepCameraInput,
} from '../stepCamera';
import { optimizeCameraSequence, recomputeStepRotationCues } from '../cameraOptimizer';
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

  it('resolves free-orbit step camera angles and rotation indicators for both the orbited step and the following step', () => {
    const s1 = { id: 's1', side: 'top', corner: 'front_right', az: 38, el: 30, cue: 'none' };
    const s2 = { id: 's2', side: 'top', corner: 'front_right', az: 38, el: 30, cue: 'none' };
    const s3 = { id: 's3', side: 'top', corner: 'front_right', az: 38, el: 30, cue: 'none' };
    const ch = { id: 'ch1', kind: 'main', sectionId: 'sec_1', steps: [s1, s2, s3] };
    const chapters = [ch];

    // Free-orbit s2 horizontally off-preset (90° CW -> az 128°, no preset corner match)
    const cwOverrides = { s2: { side: 'top', az: 128, el: 24 } };
    expect(resolveEffectiveStudioStepCue(chapters, ch, s1, cwOverrides)).toBe('none');
    expect(resolveEffectiveStudioStepCue(chapters, ch, s2, cwOverrides)).toBe('yaw_90_cw');
    expect(resolveEffectiveStudioStepCue(chapters, ch, s3, cwOverrides)).toBe('yaw_90_ccw');

    // Free-orbit s2 to the back (~180° -> az 215°)
    const backOverrides = { s2: { side: 'top', az: 215, el: 28 } };
    expect(resolveEffectiveStudioStepCue(chapters, ch, s2, backOverrides)).toBe('yaw_180');
    expect(resolveEffectiveStudioStepCue(chapters, ch, s3, backOverrides)).toBe('yaw_180');

    // Free-orbit s2 underneath via negative elevation even if side is omitted
    const flipOverrides = { s2: { az: 45, el: -28 } };
    expect(resolveStudioStepCamera(s2, flipOverrides.s2)).toMatchObject({
      side: 'bottom',
      az: 45,
      el: -28,
    });
    expect(resolveEffectiveStudioStepCue(chapters, ch, s2, flipOverrides)).toBe('flip_vertical');
    expect(resolveEffectiveStudioStepCue(chapters, ch, s3, flipOverrides)).toBe('flip_vertical');

    // Free-orbit s1 wraps around 0°/360° -> s1 stays 'none', s2 rotates from s1's custom angle
    const wrapOverrides = { s1: { side: 'top', az: -10, el: 25 }, s2: { side: 'top', az: 80, el: 25 } };
    expect(resolveStudioStepCamera(s1, wrapOverrides.s1).az).toBe(350);
    expect(resolveEffectiveStudioStepCue(chapters, ch, s1, wrapOverrides)).toBe('none');
    expect(resolveEffectiveStudioStepCue(chapters, ch, s2, wrapOverrides)).toBe('yaw_90_cw');

    // Small <40° free-orbit tweak produces no rotation badge
    const smallTweak = { s2: { side: 'top', az: 65, el: 35 } };
    expect(resolveEffectiveStudioStepCue(chapters, ch, s2, smallTweak)).toBe('none');
    expect(resolveEffectiveStudioStepCue(chapters, ch, s3, smallTweak)).toBe('none');
  });

  it('tracks free-orbit rotation indicators across multi-chapter sections (bags & submodel splits) while isolating submodels and skipping pose steps', () => {
    const m1 = { id: 'm1', side: 'top', corner: 'front_right', az: 38, el: 30, cue: 'none' };
    const sub1 = { id: 'sub1', side: 'top', corner: 'front_right', az: 38, el: 30, cue: 'none' };
    const sub2 = { id: 'sub2', side: 'top', corner: 'front_right', az: 38, el: 30, cue: 'none' };
    const pose = { id: 'pose', side: 'top', corner: 'front_right', az: 20, el: 18, cue: 'none', isMinifigPoseStep: true };
    const m2 = { id: 'm2', side: 'top', corner: 'front_right', az: 38, el: 30, cue: 'none' };

    const chMain1 = { id: 'ch_m1', kind: 'main', sectionId: 'sec_1', steps: [m1] };
    const chSub = { id: 'ch_sub', kind: 'submodel', sectionId: 'subsec_1', steps: [sub1, sub2] };
    const chMain2 = { id: 'ch_m2', kind: 'main', sectionId: 'sec_1', steps: [pose, m2] };
    const chapters = [chMain1, chSub, chMain2];

    // m2's preceding model step is m1 across the submodel & pose step
    expect(findPreviousStudioModelStep(chapters, chMain2, m2)?.id).toBe('m1');
    expect(findPreviousStudioModelStep(chapters, chSub, sub1)).toBeNull();
    expect(findPreviousStudioModelStep(chapters, chSub, sub2)?.id).toBe('sub1');

    // Free-orbiting m2 (first model step of chMain2) must show a cue relative to m1
    expect(
      resolveEffectiveStudioStepCue(chapters, chMain2, m2, {
        m2: { side: 'top', az: 130, el: 22 },
      }),
    ).toBe('yaw_90_cw');

    // Free-orbiting m1 (last step of chMain1) must trigger a return cue on m2
    expect(
      resolveEffectiveStudioStepCue(chapters, chMain2, m2, {
        m1: { side: 'bottom', az: 38, el: -35 },
      }),
    ).toBe('flip_vertical');

    // Submodel step 1 stays 'none' even when free-orbited; submodel step 2 compares against sub1
    const subOverrides = { sub1: { side: 'top', az: 200, el: 30 } };
    expect(resolveEffectiveStudioStepCue(chapters, chSub, sub1, subOverrides)).toBe('none');
    expect(resolveEffectiveStudioStepCue(chapters, chSub, sub2, subOverrides)).toBe('yaw_180');
  });

  it('respects free-orbit customAzimuthDeg/customElevationDeg overrides in modular optimizeCameraSequence', () => {
    const cottage = DEMO_MODELS.find((d) => d.id === 'alpine-cottage')!;
    const model = parseLDrawSource(cottage.ldrawSource, 'cottage.ldr', 'demo');
    const graph = buildConnectivityGraph(model.parts);
    const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});

    const steps = plan.chapters[0].stepIds.map((id) => plan.steps[id]);
    expect(steps.length).toBeGreaterThanOrEqual(3);
    const partsById = Object.fromEntries(model.parts.map((p) => [p.id, p]));

    // Free-orbit step 0, step 1, and step 2 to distinct custom angles without setting cameraViewOverride
    const freeYaw = optimizeCameraSequence(steps, partsById, {
      [steps[0].id]: { customAzimuthDeg: 40, customElevationDeg: 32 },
      [steps[1].id]: { customAzimuthDeg: 220, customElevationDeg: 28 },
      [steps[2].id]: { customAzimuthDeg: 130, customElevationDeg: 30 },
    });
    expect(freeYaw[0].rotationCue).toBe('none');
    expect(freeYaw[1].rotationCue).toBe('yaw_180');
    expect(freeYaw[2].rotationCue).toBe('yaw_90_ccw');

    // Recomputing rotation cues after free-orbiting ONLY step 1 underneath keeps neighboring steps upright and shows both flip cues
    const freeFlip = recomputeStepRotationCues(steps, {
      [steps[1].id]: { customAzimuthDeg: 40, customElevationDeg: -32 },
    });
    expect(freeFlip[0].rotationCue).toBe('none');
    expect(freeFlip[1].rotationCue).toBe('flip_vertical');
    expect(freeFlip[2].rotationCue).toBe('flip_vertical');

    // Recomputing rotation cues after free-orbiting ONLY step 1 horizontally by 90° CW shows CW in and CCW back out
    const singleStepOrbit = recomputeStepRotationCues(steps, {
      [steps[1].id]: { customAzimuthDeg: 130, customElevationDeg: 26 },
    });
    expect(singleStepOrbit[0].rotationCue).toBe('none');
    expect(singleStepOrbit[1].rotationCue).toBe('yaw_90_cw');
    expect(singleStepOrbit[2].rotationCue).toBe('yaw_90_ccw');
  });

  it('frames elongated and tall models tightly via projected 2D half-extents and keeps adjacent steps at consistent scale', () => {
    // Elongated model (6×9×64 studs = 120×180×1280 LDU), full bounding sphere radius ~649 LDU
    const elongatedBounds = {
      minX: -60,
      maxX: 60,
      minY: 0,
      maxY: 180,
      minZ: -640,
      maxZ: 640,
    };
    const fullRadius = Math.hypot(60, 90, 640);

    // Full-model step (e.g. joining two large halves: ratio >= 0.24 -> viewRadius = fullRadius)
    const fullProj = computeProjectedOrthoHalfExtents(elongatedBounds, fullRadius, fullRadius, 38, 28);
    expect(fullProj.halfW).toBeLessThan(fullRadius * 0.75);
    expect(fullProj.halfH).toBeLessThan(fullRadius * 0.58);

    // Adjacent step adding a small detail (auto-focus zoom: viewRadius = 0.62 * fullRadius)
    const detailRadius = fullRadius * 0.62;
    const detailProj = computeProjectedOrthoHalfExtents(elongatedBounds, fullRadius, detailRadius, 38, 28);
    // Projected half-extents stay tightly consistent (~10% difference instead of a jarring 1.6x jump)
    expect(fullProj.halfW / detailProj.halfW).toBeLessThan(1.15);
    expect(fullProj.halfH).toBeCloseTo(detailProj.halfH, 3);

    // Portrait frustum fits width tightly without bounding-sphere dead space
    const portraitFrustum = computeStepOrthoFrustum(
      elongatedBounds,
      fullRadius,
      fullRadius,
      38,
      28,
      0.78,
      1.0,
    );
    expect(portraitFrustum.orthoHalfW).toBeCloseTo(fullProj.halfW * STEP_CAMERA_FRAMING_MARGIN, 3);
    expect(portraitFrustum.orthoHalfW).toBeLessThan(fullRadius * 0.85);

    // Tall narrow model (6×50×6 studs = 120×1000×120 LDU) is height-limited
    const tallBounds = {
      minX: -60,
      maxX: 60,
      minY: 0,
      maxY: 1000,
      minZ: -60,
      maxZ: 60,
    };
    const tallRadius = Math.hypot(60, 500, 60);
    const tallProj = computeProjectedOrthoHalfExtents(tallBounds, tallRadius, tallRadius, 38, 28);
    expect(tallProj.halfH).toBeGreaterThan(tallProj.halfW * 3);

    // Fallback when bounds are omitted preserves exact sphere-radius framing
    const fallbackFrustum = computeStepOrthoFrustum(null, 200, 200, 38, 28, 1.33, 1.0);
    expect(fallbackFrustum.orthoHalfH).toBeCloseTo(200 * STEP_CAMERA_FRAMING_MARGIN, 4);
    expect(fallbackFrustum.orthoHalfW).toBeCloseTo(200 * STEP_CAMERA_FRAMING_MARGIN * 1.33, 4);
  });

  it('eliminates phantom union-AABB bloat and visually centers asymmetric models using per-part 2D projected bounds', () => {
    // Elongated body along Z with a lower undercarriage near center and a tall offset piece at the +Z front end
    const body = makeBox(-50, 0, -240, 50, 96, 240);
    const under = makeBox(-40, -32, -60, 40, 0, 60);
    const frontOffsetPart = makeBox(-10, 120, 200, 10, 220, 240);
    const parts = [body, under, frontOffsetPart];
    const unionBounds = { minX: -50, maxX: 50, minY: -32, maxY: 220, minZ: -240, maxZ: 240 };
    const fullR = Math.hypot(50, 126, 240);

    const aabbOnly = computeProjectedOrthoHalfExtents(unionBounds, fullR, fullR, 38, 30);
    const perPart = computeProjectedOrthoHalfExtents(unionBounds, fullR, fullR, 38, 30, parts);

    // Per-part 2D projection drops the phantom back-top & front-bottom corners -> significantly tighter height!
    expect(perPart.halfH).toBeLessThan(aabbOnly.halfH * 0.85);

    const frustum = computeStepOrthoFrustum(unionBounds, fullR, fullR, 38, 30, 1.45, 1.0, STEP_CAMERA_FRAMING_MARGIN, {
      partBoxes: parts,
      origin: [0, 94, 0],
    });
    expect(frustum.halfH).toBeCloseTo(perPart.halfH, 3);
    // Asymmetric vertical protrusion shifts the 2D silhouette midpoint away from the union-AABB midpoint
    expect(Math.abs(frustum.centerOffsetU)).toBeGreaterThan(5);
  });

  it('aligns elongated models with Landscape and Portrait layouts identically regardless of X vs Z orientation', () => {
    // Cube stays cleanly at classic 38°
    const cube = [makeBox(-80, 0, -80, 80, 120, 80)];
    expect(computeLayoutAlignedCanonicalAzimuth(cube, 1.45)).toBe(38);
    expect(computeLayoutAlignedCanonicalAzimuth(cube, 0.72)).toBe(38);

    // Long along Z vs identical model rotated 90° along X
    const longZ = [makeBox(-60, 0, -320, 60, 110, 320)];
    const longX = [makeBox(-320, 0, -60, 320, 110, 60)];

    // Landscape (1.45): Z-elongated turns toward broadside (> 38°) so its projected aspect matches 1.45 and scale matches X-elongated!
    const azZLand = computeLayoutAlignedCanonicalAzimuth(longZ, 1.45);
    const azXLand = computeLayoutAlignedCanonicalAzimuth(longX, 1.45);
    expect(azZLand).toBeGreaterThan(38);
    const extZ = computeProjectedBoxesExtents(longZ, [], [0, 55, 0], azZLand, 30)!;
    const extX = computeProjectedBoxesExtents(longX, [], [0, 55, 0], azXLand, 30)!;
    const scaleZ = Math.min(1.45 / extZ.halfW, 1 / extZ.halfH);
    const scaleX = Math.min(1.45 / extX.halfW, 1 / extX.halfH);
    expect(Math.abs(scaleZ - scaleX) / Math.max(scaleZ, scaleX)).toBeLessThan(0.06);

    // Portrait (0.72): Z-elongated turns toward a steeper angle (< 32°) while X-elongated turns toward > 56°
    const azZPort = computeLayoutAlignedCanonicalAzimuth(longZ, 0.72);
    const azXPort = computeLayoutAlignedCanonicalAzimuth(longX, 0.72);
    expect(azZPort).toBeLessThanOrEqual(32);
    expect(azXPort).toBeGreaterThanOrEqual(56);

    // optimizeStudioStepCameraSequence adopts the layout-aligned azimuth when targetAspect is supplied
    const seq = optimizeStudioStepCameraSequence(
      [{ stepBoxes: longZ, occludersBefore: [], occluderCountBefore: 0, builtBoundsBefore: null }],
      { targetAspect: 1.45 },
    );
    expect(seq[0].az).toBe(azZLand);
  });

  it('auto-zooms large unreadable full-model steps just enough to keep studs >= 0.5 cm without cropping new parts, and clamps 2D frustum bounds', () => {
    // 1. Model that ALREADY fits within the physical page readable budget stays 100% steady full-model
    const fitsFraming = computeStepCameraFraming({
      focusMode: 'auto',
      hasPrevParts: true,
      fullCenter: [0, 60, 0],
      fullRadius: 260,
      newCenter: [0, 60, 180],
      newRadius: 28,
      readableTarget: {
        maxHalfW: 450,
        maxHalfH: 310,
        fullHalfW: 240,
        fullHalfH: 180,
        newHalfW: 24,
        newHalfH: 24,
      },
    });
    expect(fitsFraming.isZoomedIn).toBe(false);
    expect(fitsFraming.targetHalfW).toBeUndefined();

    // 2. Massive 64-stud model exceeding page readable budget with a small local addition auto-zooms to <= maxHalf
    const zoomedFraming = computeStepCameraFraming({
      focusMode: 'auto',
      hasPrevParts: true,
      fullCenter: [0, 60, 0],
      fullRadius: 640,
      newCenter: [0, 60, -260],
      newRadius: 32,
      readableTarget: {
        maxHalfW: 450,
        maxHalfH: 310,
        fullHalfW: 540,
        fullHalfH: 390,
        newHalfW: 30,
        newHalfH: 30,
      },
    });
    expect(zoomedFraming.isZoomedIn).toBe(true);
    expect(zoomedFraming.targetHalfW).toBeLessThanOrEqual(450);
    expect(zoomedFraming.targetHalfH).toBeLessThanOrEqual(310);
    expect(zoomedFraming.locator).toBeDefined();

    // 3. Huge step whose NEW parts themselves exceed maxHalfW keeps all new parts uncropped
    const hugeNewFraming = computeStepCameraFraming({
      focusMode: 'auto',
      hasPrevParts: true,
      fullCenter: [0, 60, 0],
      fullRadius: 640,
      newCenter: [0, 60, 0],
      newRadius: 600,
      readableTarget: {
        maxHalfW: 450,
        maxHalfH: 310,
        fullHalfW: 560,
        fullHalfH: 390,
        newHalfW: 520,
        newHalfH: 360,
      },
    });
    expect(hugeNewFraming.isZoomedIn).toBe(false);

    // 4. Zoomed-in 2D bounds clamping prevents wasting empty air past the focused end of the model
    const endA = makeBox(-40, 0, -600, 40, 100, -560);
    const endB = makeBox(-40, 0, 560, 40, 100, 600);
    const focusPart = makeBox(-20, 20, -580, 20, 80, -540);
    const parts = [endA, endB, focusPart];
    const bounds = { minX: -40, maxX: 40, minY: 0, maxY: 100, minZ: -600, maxZ: 600 };
    const fullExt = computeProjectedBoxesExtents(parts, [], [0, 50, -560], 56, 30)!;
    const clampedFrustum = computeStepOrthoFrustum(
      bounds,
      620,
      360,
      56,
      30,
      1.45,
      1.0,
      STEP_CAMERA_FRAMING_MARGIN,
      {
        partBoxes: parts,
        newPartBoxes: [focusPart],
        origin: [0, 50, -560],
        isZoomedIn: true,
        targetHalfW: 380,
        targetHalfH: 260,
      },
    );
    // Frustum center must shift inward from the extreme end (-560) so the viewport does not show empty air beyond endA
    expect(Math.hypot(clampedFrustum.centerOffsetR, clampedFrustum.centerOffsetU)).toBeGreaterThan(20);
    // And the model's extreme edge must stay near the frustum edge (not floating far inside with empty void)
    const camR = clampedFrustum.centerOffsetR;
    expect(camR + clampedFrustum.orthoHalfW).toBeLessThanOrEqual(fullExt.maxR + fullExt.halfW * 0.1 + 1);
  });

  it('detects and clears top-left PLI obstacles via bounded 2D shifts without overlapping model geometry', () => {
    // Diagonal/compact model whose top-left quadrant is naturally clear of a compact top-left PLI pill
    const diagParts = [
      makeBox(-120, 0, 120, -40, 40, 200),
      makeBox(40, 0, -200, 120, 40, -120),
    ];
    const clearFrustum = computeStepOrthoFrustum(
      { minX: -120, maxX: 120, minY: 0, maxY: 40, minZ: -200, maxZ: 200 },
      240,
      240,
      38,
      30,
      1.45,
      1.0,
      STEP_CAMERA_FRAMING_MARGIN,
      {
        partBoxes: diagParts,
        origin: [0, 20, 0],
        pliObstacle: { widthFrac: 0.24, heightFrac: 0.12 },
      },
    );
    expect(clearFrustum.pliCleared).toBe(true);

    // Tall full-bleed square slab that fills both top-left and bottom-right with zero spare margin cannot clear a huge obstacle
    const fullSlab = [makeBox(-200, -200, -200, 200, 200, 200)];
    const blockedFrustum = computeStepOrthoFrustum(
      { minX: -200, maxX: 200, minY: -200, maxY: 200, minZ: -200, maxZ: 200 },
      350,
      350,
      0,
      0,
      1.0,
      1.0,
      STEP_CAMERA_FRAMING_MARGIN,
      {
        partBoxes: fullSlab,
        origin: [0, 0, 0],
        pliObstacle: { widthFrac: 0.5, heightFrac: 0.25 },
      },
    );
    expect(blockedFrustum.pliCleared).toBe(false);
  });

  it('rotates Step 1 camera horizontally so the lower piece is closer to the camera than an overhanging upper piece', () => {
    // Bottom 2x6 plate at z=[-40..0], upper 2x6 plate at z=[-20..+20] overhanging toward +Z (front_right).
    // Rotating ~180° horizontally to a rear corner (cos(az) < 0) places the lower plate closer
    // to the camera than the upper plate so the connection point is completely unobstructed.
    const bottomPlate = makeBox(-60, 0, -40, 60, 8, 0);
    const upperPlate = makeBox(-60, 8, -20, 60, 16, 20);

    const res = optimizeStudioStepCameraSequence([
      {
        stepBoxes: [bottomPlate, upperPlate],
        occludersBefore: [],
        occluderCountBefore: 0,
        builtBoundsBefore: null,
      },
    ]);

    expect(res).toHaveLength(1);
    expect(res[0].side).toBe('top');
    // Must rotate to a rear corner (cos(az) < 0) so lower plate (z=-20) is closer to camera than upper (z=0)
    expect(Math.cos((res[0].az * Math.PI) / 180)).toBeLessThan(0);
    expect(res[0].corner === 'back_left' || res[0].corner === 'back_right').toBe(true);
  });

  it('always starts Step 1 upright even if forceSide=bottom is mistakenly requested with zero prior occluders', () => {
    const res = optimizeStudioStepCameraSequence([
      {
        stepBoxes: [makeBox(-40, 0, -20, 40, 8, 20), makeBox(-40, 8, -20, 40, 16, 20)],
        occludersBefore: [],
        occluderCountBefore: 0,
        builtBoundsBefore: null,
        forceSide: 'bottom',
      },
    ]);
    expect(res[0].side).toBe('top');
    expect(res[0].el).toBeGreaterThan(0);
    expect(res[0].cue).toBe('none');
  });

  it('prevents rapid consecutive vertical flip ping-pongs across alternating underside and upright steps', () => {
    const floorAndUpper: WorldBox[] = [
      makeBox(-80, 24, -80, 0, 48, 0),
      makeBox(0, 24, -80, 80, 48, 0),
      makeBox(-80, 24, 0, 0, 48, 80),
      makeBox(0, 24, 0, 80, 48, 80),
      makeBox(-60, 48, -60, 60, 96, 60),
    ];
    const underA = [makeBox(0, 0, 0, 40, 24, 40)];
    const topMid = [makeBox(-20, 96, -20, 20, 120, 20)];
    const underB = [makeBox(-40, 0, -40, 0, 24, 0)];
    const topEnd = [makeBox(-20, 120, -20, 20, 144, 20)];

    const res = optimizeStudioStepCameraSequence(
      buildSequenceInputs([floorAndUpper, underA, topMid, underB, topEnd]),
    );
    const flipCount = res.filter((r) => r.cue === 'flip_vertical').length;
    // Must NEVER emit 4 consecutive flips (top -> bottom -> top -> bottom -> top)!
    expect(flipCount).toBeLessThanOrEqual(2);
    expect(res[0].side).toBe('top');
  });

  it('links isSectionModule continuation chunks across pre-built sub-chapters when resolving flip_vertical cues', () => {
    const sDeck = { id: 'sec_s1', side: 'top' as 'top' | 'bottom', corner: 'front_right' as const, az: 38, el: 30 };
    const sMech = { id: 'mech_s1', side: 'top' as 'top' | 'bottom', corner: 'front_right' as const, az: 38, el: 30 };
    const sAttach = { id: 'sec_s2', side: 'bottom' as 'top' | 'bottom', corner: 'front_right' as const, az: 38, el: -30 };

    const chDeck = { id: 'subch_1', kind: 'submodel', isSectionModule: true, sectionId: 'subsec_front', steps: [sDeck] };
    const chMech = { id: 'subch_2', kind: 'submodel', isSectionModule: false, sectionId: 'subsec_mech', steps: [sMech] };
    const chCont = { id: 'subch_3', kind: 'submodel', isSectionModule: true, sectionId: 'subsec_front', steps: [sAttach] };
    const chapters = [chDeck, chMech, chCont];

    expect(resolveEffectiveStudioStepCue(chapters, chCont, sAttach)).toBe('flip_vertical');
    expect(resolveEffectiveStudioStepCue(chapters, chMech, sMech)).toBe('none');
  });

  it('evaluates top-view occlusion on 1-3 part early bases so Viterbi turns a submodel around from Step 1 when a tall Step-1 brick occludes Step-2 parts', () => {
    // Reproduces Underside Module: Step 1 places 3 parts (wedge plate + 1x6 plate + tall 2x6 brick on the +Z front edge);
    // Step 2 places shorter slopes/tile behind the 2x6 brick (-Z side); Step 3 places a round tile on the -Z side.
    const step1 = [
      makeBox(-60, 0, -40, 60, 12, 40),   // 4x6 base plate
      makeBox(-60, 0, 40, 60, 12, 60),    // 1x6 front lip plate
      makeBox(-60, 8, 10, 60, 36, 50),    // tall 2x6 brick along the +Z front edge
    ];
    const step2 = [
      makeBox(-60, 8, -30, -40, 28, -10), // left slope behind 2x6 brick
      makeBox(40, 8, -30, 60, 28, -10),   // right slope behind 2x6 brick
      makeBox(-40, 8, -30, 40, 16, -10),  // 1x4 tile tucked behind 2x6 brick
    ];
    const step3 = [
      makeBox(-20, 16, -40, 20, 24, 0),   // 2x2 round tile
    ];

    const res = optimizeStudioStepCameraSequence(buildSequenceInputs([step1, step2, step3]));
    expect(res).toHaveLength(3);
    // Must pick a back corner (viewing from -Z so the 2x6 brick sits in the background) from Step 1 with zero mid-submodel turns!
    expect(res[0].side).toBe('top');
    expect(res[0].corner === 'back_left' || res[0].corner === 'back_right').toBe(true);
    expect(res[1].corner).toBe(res[0].corner);
    expect(res[1].cue).toBe('none');
    expect(res[2].corner).toBe(res[0].corner);
    expect(res[2].cue).toBe('none');
  });

  it('turns the camera so a lifted attachedSubmodel sits near the camera without hiding its mating Technic axle behind itself', () => {
    // Flipped underside chassis spanning Z in [-240, 240]; Technic axle + liftarm sit at the far -Z end (Z = -210),
    // and the lifted Underside Module has a tall 2x6 brick on its +Z side (Z = -170..-130) that would hide the axle
    // when viewed from front_right (+Z), but exposes the axle clearly when viewed from back_left / back_right (-Z).
    const deck = [
      makeBox(-60, 80, -240, 60, 92, -80),
      makeBox(-60, 80, -80, 60, 92, 80),
      makeBox(-60, 80, 80, 60, 92, 240),
      makeBox(-60, 92, -240, 60, 100, 240),
    ];
    const mech = [
      makeBox(-10, 20, -220, 10, 88, -200), // protruding vertical Technic axle at -Z end
      makeBox(-12, 48, -225, 12, 58, -165), // horizontal Technic liftarm
    ];
    const subSeated = [
      makeBox(-60, 24, -220, 60, 36, -140), // wedge/base plate (with hole around axle at Z=-210)
      makeBox(-60, 36, -180, 60, 72, -140), // tall 2x6 brick on the +Z inner side of the submodel
    ];
    const subShifted = subSeated.map((b) =>
      makeBox(b.min[0], b.min[1] - 44, b.min[2], b.max[0], b.max[1] - 44, b.max[2]),
    );

    const inputs = buildSequenceInputs([deck, mech, subSeated]);
    inputs[1].forceSide = 'bottom';
    inputs[1].isSubmodelAttach = true;
    inputs[2].forceSide = 'bottom';
    inputs[2].isSubmodelAttach = true;
    inputs[2].shiftedStepBoxes = subShifted;

    const res = optimizeStudioStepCameraSequence(inputs);
    expect(res[2].side).toBe('bottom');
    // Must turn to the -Z side (back_left or back_right) so the submodel and mating axle face/are near the camera!
    expect(res[2].corner === 'back_left' || res[2].corner === 'back_right').toBe(true);
  });
});



