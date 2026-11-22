import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STUDIO_CAMERA,
  chooseMinifigPlacementCamera,
  computeStudioRotationCue,
  evaluateMinifigCameraVisibility,
  type MinifigTargetBox,
  type OccluderBox,
} from '../minifigCamera';
import type { WorldBox } from '../minifigPose';

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

/** Builds a realistic multi-part standing minifigure centered around (cx, baseY, cz). */
function makeStandingMinifig(cx: number, baseY: number, cz: number, withBroom = false): MinifigTargetBox[] {
  const parts: MinifigTargetBox[] = [
    { role: 'hips', box: makeBox(cx - 16, baseY + 28, cz - 10, cx + 16, baseY + 40, cz + 10) },
    { role: 'leg_r', box: makeBox(cx - 16, baseY, cz - 10, cx - 1, baseY + 28, cz + 10) },
    { role: 'leg_l', box: makeBox(cx + 1, baseY, cz - 10, cx + 16, baseY + 28, cz + 10) },
    { role: 'torso', box: makeBox(cx - 19, baseY + 40, cz - 10, cx + 19, baseY + 72, cz + 10) },
    { role: 'head', box: makeBox(cx - 12, baseY + 72, cz - 12, cx + 12, baseY + 96, cz + 12) },
    { role: 'headgear', box: makeBox(cx - 13, baseY + 92, cz - 13, cx + 13, baseY + 106, cz + 13) },
  ];
  if (withBroom) {
    // Broom held out to the -X side (like the Janitor in the train scene)
    parts.push({
      role: 'accessory',
      box: makeBox(cx - 38, baseY, cz - 6, cx - 18, baseY + 70, cz + 14),
    });
  }
  return parts;
}

describe('Visibility-Aware Minifigure Placement Camera', () => {
  it('rotates away from front_right when a minifigure stands behind the far (-X) side of a train', () => {
    // Long train running along Z, occupying X in [-60, 60], Y in [0, 120], Z in [-220, 160]
    const trainOccluders: OccluderBox[] = [
      { box: makeBox(-60, 0, -220, 60, 120, 160) },
    ];
    // Janitor standing on the -X side near the front of the train (exact IMG_0310 geometry!)
    const janitor = makeStandingMinifig(-90, 0, 95, true);

    const defaultVis = evaluateMinifigCameraVisibility(
      janitor,
      trainOccluders,
      DEFAULT_STUDIO_CAMERA.az,
      DEFAULT_STUDIO_CAMERA.el,
      [-1, 0, 0],
    );
    expect(defaultVis.coreVisibility).toBeLessThan(0.6);

    const choice = chooseMinifigPlacementCamera(
      janitor,
      trainOccluders,
      [-1, 0, 0],
      DEFAULT_STUDIO_CAMERA,
    );

    expect(choice.corner).toBe('front_left');
    expect(choice.az).toBe(322);
    expect(choice.el).toBe(30);
    expect(choice.coreVisibility).toBeGreaterThan(0.95);
    expect(choice.bodyVisibility).toBeGreaterThan(0.95);
    expect(choice.cue).toBe('yaw_90_ccw');
  });

  it('rotates to a rear corner when a minifigure stands behind the -Z end of a model', () => {
    const trainOccluders: OccluderBox[] = [
      { box: makeBox(-60, 0, -180, 60, 120, 180) },
    ];
    const figureAtRear = makeStandingMinifig(0, 0, -210);

    const choice = chooseMinifigPlacementCamera(
      figureAtRear,
      trainOccluders,
      [0, 0, -1],
      DEFAULT_STUDIO_CAMERA,
    );

    expect(['back_right', 'back_left']).toContain(choice.corner);
    expect(choice.coreVisibility).toBeGreaterThan(0.95);
    expect(choice.cue).not.toBe('none');
  });

  it('keeps front_right with no rotation cue when the minifigure is already cleanly visible in front', () => {
    const trainOccluders: OccluderBox[] = [
      { box: makeBox(-60, 0, -220, 60, 120, 160) },
    ];
    // Standing on the +X, +Z side (front_right foreground) facing +X/+Z
    const frontFigure = makeStandingMinifig(95, 0, 95);

    const choice = chooseMinifigPlacementCamera(
      frontFigure,
      trainOccluders,
      [0.6, 0, 0.8],
      DEFAULT_STUDIO_CAMERA,
    );

    expect(choice.corner).toBe('front_right');
    expect(choice.cue).toBe('none');
    expect(choice.coreVisibility).toBe(1);
  });

  it('rotates even when only the corner of the model partially hides the minifigure while his broom sticks out', () => {
    // Front cab wall positioned so the broom (-128..-108) sticks out past the corner,
    // while the Janitor's right torso & head (-90) are clipped by the cab corner from front_right (az=38)
    const trainCab: OccluderBox[] = [
      { box: makeBox(-50, 0, 100, 50, 120, 210) },
    ];
    const janitor = makeStandingMinifig(-90, 0, 90, true);

    const defaultVis = evaluateMinifigCameraVisibility(
      janitor,
      trainCab,
      DEFAULT_STUDIO_CAMERA.az,
      DEFAULT_STUDIO_CAMERA.el,
      [-1, 0, 0],
    );
    expect(defaultVis.coreVisibility).toBeLessThan(0.85);

    const choice = chooseMinifigPlacementCamera(
      janitor,
      trainCab,
      [-1, 0, 0],
      DEFAULT_STUDIO_CAMERA,
    );

    expect(choice.corner).not.toBe('front_right');
    expect(choice.coreVisibility).toBe(1);
  });

  it('prefers showing the minifigure front/face over the back of his head when two views are equally unobstructed', () => {
    // Wall running along Z on the +X side; both front_left (322) and back_left (218) are 100% unobstructed.
    // Figure faces toward back_left (-X, -Z), so back_left shows his face while front_left shows his back-side.
    const wall: OccluderBox[] = [{ box: makeBox(-20, 0, -200, 60, 120, 200) }];
    const figure = makeStandingMinifig(-70, 0, 0);

    const choice = chooseMinifigPlacementCamera(
      figure,
      wall,
      [-0.6, 0, -0.8],
      DEFAULT_STUDIO_CAMERA,
    );

    expect(choice.corner).toBe('back_left');
    expect(choice.frontAlignment).toBeGreaterThan(0.95);
    expect(choice.coreVisibility).toBe(1);
  });

  it('elevates camera angle to see cleanly into an open-top walled cabin before the roof is placed', () => {
    // Four waist-to-shoulder walls around (0, 0, 0) with open top (no roof yet!)
    const cabinWalls: OccluderBox[] = [
      { box: makeBox(-55, 0, -55, -45, 78, 55) }, // -X wall
      { box: makeBox(45, 0, -55, 55, 78, 55) },   // +X wall
      { box: makeBox(-55, 0, -55, 55, 78, -45) }, // -Z wall
      { box: makeBox(-55, 0, 45, 55, 78, 55) },   // +Z wall
    ];
    const seatedDriver = makeStandingMinifig(0, 8, 0);

    const standardVis = evaluateMinifigCameraVisibility(
      seatedDriver,
      cabinWalls,
      38,
      30,
      [0, 0, 1],
    );
    const choice = chooseMinifigPlacementCamera(
      seatedDriver,
      cabinWalls,
      [0, 0, 1],
      DEFAULT_STUDIO_CAMERA,
    );

    expect(choice.el).toBeGreaterThan(40);
    expect(choice.bodyVisibility).toBeGreaterThan(standardVis.bodyVisibility + 0.15);
  });

  it('prefers looking through a transparent front windshield over solid opaque walls for an enclosed driver', () => {
    // Enclosed cab with solid opaque walls on -X, +X, -Z and roof, plus transparent windshield on +Z
    const enclosedCab: OccluderBox[] = [
      { box: makeBox(-50, 0, -50, -40, 110, 50), transparent: false }, // -X solid wall
      { box: makeBox(40, 0, -50, 50, 110, 50), transparent: false },   // +X solid wall
      { box: makeBox(-50, 0, -50, 50, 110, -40), transparent: false }, // -Z solid back wall
      { box: makeBox(-50, 108, -50, 50, 120, 50), transparent: false }, // solid roof
      { box: makeBox(-40, 20, 42, 40, 108, 50), transparent: true },   // +Z transparent windshield
    ];
    const driver = makeStandingMinifig(0, 8, 0);

    const choice = chooseMinifigPlacementCamera(
      driver,
      enclosedCab,
      [0, 0, 1],
      { side: 'top', corner: 'back_left', az: 218, el: 30 },
    );

    // Must rotate away from opaque back_left (218) toward the +Z transparent windshield side
    const viewZ = Math.cos((choice.az * Math.PI) / 180);
    expect(viewZ).toBeGreaterThan(0.5);
    expect(choice.bodyVisibility).toBeGreaterThan(0.35);
  });

  it('falls back to a cardinal view when a minifigure stands inside a narrow U-shaped alcove', () => {
    // Deep U-shaped alcove open ONLY toward +Z (az = 0): side walls at X = ±24 extend out to Z = +90
    const alcoveWalls: OccluderBox[] = [
      { box: makeBox(-44, 0, -40, -24, 120, 90) }, // left wall
      { box: makeBox(24, 0, -40, 44, 120, 90) },   // right wall
      { box: makeBox(-44, 0, -60, 44, 120, -24) }, // back wall
      { box: makeBox(-44, 112, -60, 44, 124, 90) }, // ceiling overhang
    ];
    const figInAlcove = makeStandingMinifig(0, 0, 0);

    const choice = chooseMinifigPlacementCamera(
      figInAlcove,
      alcoveWalls,
      [0, 0, 1],
      DEFAULT_STUDIO_CAMERA,
    );

    expect(choice.az).toBe(0);
    expect(choice.coreVisibility).toBeGreaterThan(0.8);
  });

  it('computes accurate rotation cues across yaw turns and top/bottom flips', () => {
    expect(computeStudioRotationCue({ side: 'top', az: 38 }, { side: 'top', az: 38 })).toBe('none');
    expect(computeStudioRotationCue({ side: 'top', az: 38 }, { side: 'top', az: 142 })).toBe('yaw_90_cw');
    expect(computeStudioRotationCue({ side: 'top', az: 38 }, { side: 'top', az: 322 })).toBe('yaw_90_ccw');
    expect(computeStudioRotationCue({ side: 'top', az: 38 }, { side: 'top', az: 218 })).toBe('yaw_180');
    expect(computeStudioRotationCue({ side: 'top', az: 322 }, { side: 'top', az: 38 })).toBe('yaw_90_cw');
    expect(computeStudioRotationCue({ side: 'top', az: 38 }, { side: 'bottom', az: 38 })).toBe('flip_vertical');
  });

  it('evaluates a 2,000-brick model quickly via broad-phase projection filtering', () => {
    const occluders: OccluderBox[] = [];
    for (let i = 0; i < 2000; i++) {
      const gx = (i % 10) * 20 - 100;
      const gy = Math.floor(i / 200) * 24;
      const gz = (Math.floor(i / 10) % 20) * 20 - 200;
      occluders.push({ box: makeBox(gx, gy, gz, gx + 20, gy + 24, gz + 20) });
    }
    const figure = makeStandingMinifig(-130, 0, 60);

    const t0 = performance.now();
    const choice = chooseMinifigPlacementCamera(figure, occluders, [-1, 0, 0], DEFAULT_STUDIO_CAMERA);
    const elapsedMs = performance.now() - t0;

    expect(choice.corner).toBe('front_left');
    expect(choice.coreVisibility).toBe(1);
    expect(elapsedMs).toBeLessThan(100);
  });
});
