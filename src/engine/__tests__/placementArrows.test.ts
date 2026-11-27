import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ARROW_COLOR,
  buildPlacementArrowGeometry,
  computeAutoPlacementOffsetsForSequence,
  computePlacementArrowSegments,
  computeSubassemblyAttachmentOffsets,
  detectCoaxialPinHoleArrows,
  perceptualRgbDistance,
  type PlacementAABB,
  type PlacementPartInput,
  type PlacementStepInput,
} from '../placementArrows';

function makeBox(cx: number, minY: number, cz: number, sx: number, sy: number, sz: number): PlacementAABB {
  return {
    min: [cx - sx / 2, minY, cz - sz / 2],
    max: [cx + sx / 2, minY + sy, cz + sz / 2],
    center: [cx, minY + sy / 2, cz],
  };
}

function makePart(
  id: string,
  cx: number,
  minY: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  rgb: [number, number, number],
  sku?: string,
): PlacementPartInput {
  return {
    id,
    box: makeBox(cx, minY, cz, sx, sy, sz),
    rgb,
    sku: sku ?? `${sx}x${sy}x${sz}`,
  };
}

const LIGHT_BLUE: [number, number, number] = [159, 195, 233];
const YELLOW: [number, number, number] = [242, 205, 55];
const TAN: [number, number, number] = [228, 205, 158];
const DARK_GRAY: [number, number, number] = [108, 110, 104];
const RED: [number, number, number] = [201, 26, 9];
const BLACK: [number, number, number] = [27, 42, 52];

describe('placementArrows — LEGO-style automatic placement arrows & offsets', () => {
  it('uses vivid crimson red as the default arrow color', () => {
    expect(DEFAULT_ARROW_COLOR).toBe('#dc2626');
  });

  it('first step with stacked plates keeps the base plate grounded and lifts the upper plate with an arrow', () => {
    // Mirrors IMG_0366 Step 1: 1x4 light-blue plate on bottom + 1x2 yellow plate on top
    const step1: PlacementStepInput = {
      id: 's1',
      camera: { az: 38, el: 28, side: 'top' },
      parts: [
        makePart('base_1x4', 0, 0, 0, 80, 8, 20, LIGHT_BLUE),
        makePart('top_1x2', -20, 8, 0, 40, 8, 20, YELLOW),
      ],
    };

    const res = computeAutoPlacementOffsetsForSequence([step1]);
    const offs = res.get('s1');
    expect(offs).toBeDefined();
    expect(offs!['base_1x4']).toBeUndefined();
    expect(offs!['top_1x2']).toBeDefined();
    expect(offs!['top_1x2'].y).toBeGreaterThanOrEqual(24);
    expect(offs!['top_1x2'].x).toBe(0);
    expect(offs!['top_1x2'].z).toBe(0);
    expect(offs!['top_1x2'].arrow).toBe(true);
  });

  it('first step with a beam and lateral pins keeps the beam grounded and offsets pins laterally', () => {
    // Mirrors IMG_0365 Step 1 / Step 8: 1x5 red Technic brick + 2 black pins inserted from sides
    const step1: PlacementStepInput = {
      id: 's1',
      camera: { az: 38, el: 28, side: 'top' },
      parts: [
        makePart('beam_1x5', 0, 0, 0, 100, 24, 20, RED),
        makePart('pin_front', -20, 6, 18, 12, 12, 16, BLACK),
        makePart('pin_back', 20, 6, -18, 12, 12, 16, BLACK),
      ],
    };

    const res = computeAutoPlacementOffsetsForSequence([step1]);
    const offs = res.get('s1');
    expect(offs).toBeDefined();
    expect(offs!['beam_1x5']).toBeUndefined();
    expect(offs!['pin_front'].z).toBeGreaterThan(20);
    expect(offs!['pin_front'].arrow).toBe(true);
    expect(offs!['pin_back'].z).toBeLessThan(-20);
    expect(offs!['pin_back'].arrow).toBe(true);
  });

  it('does not add offsets on a single-part first step', () => {
    const step1: PlacementStepInput = {
      id: 's1',
      camera: { az: 38, el: 28, side: 'top' },
      parts: [makePart('solo', 0, 0, 0, 80, 8, 40, LIGHT_BLUE)],
    };
    const res = computeAutoPlacementOffsetsForSequence([step1]);
    expect(res.get('s1')).toBeUndefined();
  });

  it('does NOT add arrows to large, obvious, contrasting top-placed pieces on subsequent steps', () => {
    // Mirrors IMG_0366 Steps 2-4 & IMG_0364 Step 7 (large contrasting tan 1x6 plates on dark gray frame)
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('base_1', 0, 0, 0, 80, 8, 80, DARK_GRAY),
          makePart('base_2', 80, 0, 0, 80, 8, 80, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('tan_1x6', 40, 8, 0, 120, 8, 20, TAN),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    expect(res.get('s1')).toBeDefined();
    expect(res.get('s2')).toBeUndefined();
  });

  it('adds an upward offset + arrow when a slender same-color piece blends into adjacent existing parts', () => {
    // Mirrors IMG_0364 Step 8: 1x4 light-blue plate placed onto existing light-blue plates
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('frame_a', 0, 0, 0, 80, 8, 80, DARK_GRAY),
          makePart('frame_b', 80, 0, 0, 80, 8, 80, DARK_GRAY),
          makePart('edge_a', 0, 0, -50, 80, 8, 20, LIGHT_BLUE),
          makePart('edge_b', 80, 0, -50, 80, 8, 20, LIGHT_BLUE),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('camo_1x4', 80, 8, -50, 80, 8, 20, LIGHT_BLUE),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    expect(offs!['camo_1x4'].y).toBeGreaterThanOrEqual(24);
    expect(offs!['camo_1x4'].arrow).toBe(true);
  });

  it('adds a lateral offset + arrow for sideways-inserted pins/beams on subsequent steps', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [makePart('chassis', 0, 0, 0, 160, 24, 20, DARK_GRAY)],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [makePart('side_pin', 40, 6, 18, 12, 12, 16, BLACK)],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    expect(offs!['side_pin'].z).toBeGreaterThan(20);
    expect(offs!['side_pin'].y).toBe(0);
    expect(offs!['side_pin'].arrow).toBe(true);
  });

  it('adds an offset + arrow for tiny pieces added to a much larger model', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('b1', 0, 0, 0, 120, 24, 120, DARK_GRAY),
          makePart('b2', 120, 0, 0, 120, 24, 120, DARK_GRAY),
          makePart('b3', 0, 0, 120, 120, 24, 120, DARK_GRAY),
          makePart('b4', 120, 0, 120, 120, 24, 120, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('tiny_1x1', 20, 24, 20, 20, 8, 20, YELLOW),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    expect(offs!['tiny_1x1'].y).toBeGreaterThanOrEqual(24);
    expect(offs!['tiny_1x1'].arrow).toBe(true);
  });

  it('adds an offset + arrow for a partially occluded piece behind an existing wall', () => {
    // Camera at az=0, el=20 looks from +Z toward -Z; wall at z=+40 occludes brick at z=0
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 0, el: 20, side: 'top' },
        parts: [
          makePart('floor', 0, 0, 0, 120, 8, 120, DARK_GRAY),
          makePart('front_wall', 0, 8, 45, 120, 72, 20, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 0, el: 20, side: 'top' },
        parts: [
          makePart('hidden_brick', 0, 8, 0, 40, 24, 20, YELLOW),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    expect(offs!['hidden_brick'].y).toBeGreaterThanOrEqual(24);
    expect(offs!['hidden_brick'].arrow).toBe(true);
  });

  it('offsets downward (-Y) on upside-down underside steps', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: -28, side: 'bottom' },
        parts: [
          makePart('deck', 0, 0, 0, 120, 8, 120, DARK_GRAY),
          makePart('under_plate', 0, -8, 0, 40, 8, 20, YELLOW),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s1');
    expect(offs).toBeDefined();
    expect(offs!['under_plate'].y).toBeLessThanOrEqual(-24);
    expect(offs!['under_plate'].arrow).toBe(true);
  });

  it('caps auto offsets on crowded subsequent steps to prevent clutter', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('b1', 0, 0, 0, 200, 24, 200, DARK_GRAY),
          makePart('b2', 200, 0, 0, 200, 24, 200, DARK_GRAY),
          makePart('b3', 0, 0, 200, 200, 24, 200, DARK_GRAY),
          makePart('b4', 200, 0, 200, 200, 24, 200, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: Array.from({ length: 8 }, (_, i) =>
          makePart(`small_${i}`, i * 40, 24, 0, 20, 8, 20, DARK_GRAY),
        ),
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    expect(Object.keys(offs!).length).toBeLessThanOrEqual(4);
  });

  it('skips steps marked skip:true while still accumulating their parts as prevParts', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1_skip',
        skip: true,
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('p1', 0, 0, 0, 120, 24, 20, DARK_GRAY),
          makePart('p2', 0, 24, 0, 40, 8, 20, YELLOW),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [makePart('pin', 20, 6, 18, 12, 12, 16, BLACK)],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    expect(res.get('s1_skip')).toBeUndefined();
    expect(res.get('s2')?.['pin']?.z).toBeGreaterThan(20);
  });

  it('aligns placement arrows on the horizontal plane to the centers of the nearest and furthest studs from the camera (diagonal when > 1 stud wide)', () => {
    // 1x1 plate lifted +28 LDU -> 1 arrow centered on its single stud
    const singleStudBox = makeBox(0, 8, 0, 20, 8, 20);
    const singleSegs = computePlacementArrowSegments(singleStudBox, [0, 28, 0], null, null, 38);
    expect(singleSegs).toHaveLength(1);
    expect(singleSegs[0].from[0]).toBeCloseTo(0, 4);
    expect(singleSegs[0].from[2]).toBeCloseTo(0, 4);
    expect(singleSegs[0].from[1]).toBeCloseTo(singleStudBox.min[1] + 28, 4);
    expect(singleSegs[0].to[1]).toBeCloseTo(singleStudBox.min[1] + 4, 4);

    // 1x2 plate (40x8x20) lifted +28 LDU at az=38° (front-right: +X, +Z) -> nearest stud (+10, 0) & furthest stud (-10, 0)
    const plate1x2 = makeBox(0, 8, 0, 40, 8, 20);
    const segs1x2 = computePlacementArrowSegments(plate1x2, [0, 28, 0], null, null, 38);
    expect(segs1x2).toHaveLength(2);
    expect(segs1x2[0].from[0]).toBeCloseTo(10, 4);
    expect(segs1x2[0].from[2]).toBeCloseTo(0, 4);
    expect(segs1x2[1].from[0]).toBeCloseTo(-10, 4);
    expect(segs1x2[1].from[2]).toBeCloseTo(0, 4);

    // 1x4 plate (80x8x20) lifted +28 LDU at az=38° -> end studs at X = +30 (nearest) and X = -30 (furthest)
    const longPlateBox = makeBox(0, 8, 0, 80, 8, 20);
    const longSegs = computePlacementArrowSegments(longPlateBox, [0, 28, 0], null, null, 38);
    expect(longSegs).toHaveLength(2);
    expect(longSegs[0].from[0]).toBeCloseTo(30, 4);
    expect(longSegs[0].from[2]).toBeCloseTo(0, 4);
    expect(longSegs[1].from[0]).toBeCloseTo(-30, 4);
    expect(longSegs[1].from[2]).toBeCloseTo(0, 4);
    expect(longSegs[0].from[1]).toBeGreaterThan(longSegs[0].to[1]);

    // 2x4 plate (80x8x40, LDraw 79.5x8x39.5) lifted +28 LDU -> DIAGONAL nearest & furthest corner studs!
    const plate2x4 = makeBox(0, 8, 0, 79.5, 8, 39.5);
    // Front-right camera (az=38° -> +X, +Z): nearest (+30, +10), furthest (-30, -10)
    const segsFR = computePlacementArrowSegments(plate2x4, [0, 28, 0], null, null, 38);
    expect(segsFR).toHaveLength(2);
    expect(segsFR[0].to[0]).toBeCloseTo(30, 4);
    expect(segsFR[0].to[2]).toBeCloseTo(10, 4);
    expect(segsFR[1].to[0]).toBeCloseTo(-30, 4);
    expect(segsFR[1].to[2]).toBeCloseTo(-10, 4);

    // Back-right camera (az=142° -> +X, -Z): nearest (+30, -10), furthest (-30, +10)
    const segsBR = computePlacementArrowSegments(plate2x4, [0, 28, 0], null, null, 142);
    expect(segsBR).toHaveLength(2);
    expect(segsBR[0].to[0]).toBeCloseTo(30, 4);
    expect(segsBR[0].to[2]).toBeCloseTo(-10, 4);
    expect(segsBR[1].to[0]).toBeCloseTo(-30, 4);
    expect(segsBR[1].to[2]).toBeCloseTo(10, 4);

    // Back-left camera (az=218° -> -X, -Z): nearest (-30, -10), furthest (+30, +10)
    const segsBL = computePlacementArrowSegments(plate2x4, [0, 28, 0], null, null, 218);
    expect(segsBL).toHaveLength(2);
    expect(segsBL[0].to[0]).toBeCloseTo(-30, 4);
    expect(segsBL[0].to[2]).toBeCloseTo(-10, 4);
    expect(segsBL[1].to[0]).toBeCloseTo(30, 4);
    expect(segsBL[1].to[2]).toBeCloseTo(10, 4);

    // Front-left camera (az=322° -> -X, +Z): nearest (-30, +10), furthest (+30, -10)
    const segsFL = computePlacementArrowSegments(plate2x4, [0, 28, 0], null, null, 322);
    expect(segsFL).toHaveLength(2);
    expect(segsFL[0].to[0]).toBeCloseTo(-30, 4);
    expect(segsFL[0].to[2]).toBeCloseTo(10, 4);
    expect(segsFL[1].to[0]).toBeCloseTo(30, 4);
    expect(segsFL[1].to[2]).toBeCloseTo(-10, 4);

    // 2x2 plate (40x8x40) at az=38° -> near/far diagonal (+10,+10)/(-10,-10) projects only 3.44 LDU apart in screen X,
    // so it switches to the wider non-overlapping left/right diagonal (+10, -10) and (-10, +10) (~28 LDU screen separation)
    const plate2x2 = makeBox(0, 8, 0, 40, 8, 40);
    const segs2x2 = computePlacementArrowSegments(plate2x2, [0, 28, 0], null, null, 38);
    expect(segs2x2).toHaveLength(2);
    expect(segs2x2[0].to[0]).toBeCloseTo(10, 4);
    expect(segs2x2[0].to[2]).toBeCloseTo(-10, 4);
    expect(segs2x2[1].to[0]).toBeCloseTo(-10, 4);
    expect(segs2x2[1].to[2]).toBeCloseTo(10, 4);

    // Elongated Technic beam (140x24x20) offset laterally along +Z -> 2 parallel horizontal arrows at nearest/furthest X studs (±60)
    const beamBox = makeBox(0, 0, 0, 140, 24, 20);
    const beamSegs = computePlacementArrowSegments(beamBox, [0, 0, 40], null, null, 38);
    expect(beamSegs).toHaveLength(2);
    expect(beamSegs[0].from[0]).toBeCloseTo(60, 4);
    expect(beamSegs[1].from[0]).toBeCloseTo(-60, 4);
    expect(beamSegs[0].from[2]).toBeGreaterThan(beamSegs[0].to[2]);
  });

  it('builds flat 2D camera-facing arrows without outlines by default and supports optional outlines and 3D style', () => {
    const spec = {
      box: makeBox(0, 8, 0, 20, 8, 20),
      offset: [0, 32, 0] as [number, number, number],
      rgb: [220, 38, 38] as [number, number, number],
    };

    // Default: flat 2D (3 triangles = 9 vertices = 27 floats) with zero outlines
    const flatDefault = buildPlacementArrowGeometry([spec], 38, 28);
    expect(flatDefault.triPos.length).toBe(27);
    expect(flatDefault.linePos.length).toBe(0);
    // Every vertex normal points uniformly toward camera (flat plane)
    const az = (38 * Math.PI) / 180;
    const el = (28 * Math.PI) / 180;
    const vx = Math.sin(az) * Math.cos(el);
    const vy = Math.sin(el);
    const vz = Math.cos(az) * Math.cos(el);
    expect(flatDefault.triNorm[0]).toBeCloseTo(vx, 4);
    expect(flatDefault.triNorm[1]).toBeCloseTo(vy, 4);
    expect(flatDefault.triNorm[2]).toBeCloseTo(vz, 4);

    // Flat 2D with outlines enabled emits 7 perimeter segments (14 vertices = 42 floats)
    const flatOutlined = buildPlacementArrowGeometry([spec], 38, 28, { style: 'flat', outlines: true });
    expect(flatOutlined.triPos.length).toBe(27);
    expect(flatOutlined.linePos.length).toBe(42);

    // 3D style emits full cylindrical shaft + cone mesh, with outlines only when opted in
    const mesh3dNoOutline = buildPlacementArrowGeometry([spec], 38, 28, { style: '3d', outlines: false });
    expect(mesh3dNoOutline.triPos.length).toBeGreaterThan(200);
    expect(mesh3dNoOutline.linePos.length).toBe(0);

    const mesh3dOutlined = buildPlacementArrowGeometry([spec], 38, 28, { style: '3d', outlines: true });
    expect(mesh3dOutlined.triPos.length).toBe(mesh3dNoOutline.triPos.length);
    expect(mesh3dOutlined.linePos.length).toBeGreaterThan(0);
  });

  it('perceptualRgbDistance distinguishes identical colors from contrasting colors', () => {
    expect(perceptualRgbDistance(LIGHT_BLUE, LIGHT_BLUE)).toBe(0);
    expect(perceptualRgbDistance(LIGHT_BLUE, TAN)).toBeGreaterThan(50);
    expect(perceptualRgbDistance(DARK_GRAY, YELLOW)).toBeGreaterThan(80);
  });

  it('offsets a vertical through-hole pin vertically (+Y) instead of sideways through a horizontal beam', () => {
    // Horizontal flat beam with a vertical axle + vertical towball-pin passing through its holes
    const step1: PlacementStepInput = {
      id: 's1',
      camera: { az: 38, el: 28, side: 'top' },
      parts: [
        makePart('flat_beam', 0, 0, 0, 100, 16, 20, BLACK),
        makePart('vert_axle', -20, -20, 0, 12, 100, 12, YELLOW),
        makePart('vert_towball_pin', 20, -14, 0, 16, 44, 16, DARK_GRAY),
      ],
    };

    const res = computeAutoPlacementOffsetsForSequence([step1]);
    const offs = res.get('s1');
    expect(offs).toBeDefined();
    expect(offs!['flat_beam']).toBeUndefined();
    // Both vertical through-hole parts must lift vertically along +Y with zero sideways drift
    expect(offs!['vert_axle'].x).toBe(0);
    expect(offs!['vert_axle'].z).toBe(0);
    expect(offs!['vert_axle'].y).toBeGreaterThan(30);
    expect(offs!['vert_towball_pin'].x).toBe(0);
    expect(offs!['vert_towball_pin'].z).toBe(0);
    expect(offs!['vert_towball_pin'].y).toBeGreaterThan(24);
  });

  it('lifts a coaxial bush cleanly above a vertical axle tip and terminates its arrow above the axle without clipping', () => {
    // Step 1: flat beam + vertical axle extending up to y=60
    // Step 2: bush seated around the vertical axle at y=[20..40] (axle sticks 20 LDU above the bush!)
    const bushBox = makeBox(-20, 20, 0, 18, 20, 18);
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('flat_beam', 0, 0, 0, 100, 16, 20, BLACK),
          makePart('vert_axle', -20, -20, 0, 12, 80, 12, YELLOW), // maxY = 60
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          { id: 'bush', box: bushBox, rgb: BLACK, sku: 'bush' },
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    const bushOff = offs!['bush'];
    expect(bushOff).toBeDefined();
    expect(bushOff.x).toBe(0);
    expect(bushOff.z).toBe(0);
    // Lifted bush bottom (20 + bushOff.y) must clear axle top (60) by at least 16 LDU
    expect(bushBox.min[1] + bushOff.y).toBeGreaterThanOrEqual(60 + 16);
    // arrowTo must stop cleanly at the axle entry tip (y = 62), never inside the axle
    expect(bushOff.arrowTo).toBeDefined();
    expect(bushOff.arrowTo![1]).toBeCloseTo(62, 1);

    const segs = computePlacementArrowSegments(bushBox, [bushOff.x, bushOff.y, bushOff.z], bushOff.arrowTo);
    expect(segs).toHaveLength(1);
    expect(segs[0].to[1]).toBeGreaterThanOrEqual(61);
    expect(segs[0].from[1] - segs[0].to[1]).toBeGreaterThanOrEqual(12);
  });

  it('anchors arrows directly over the overlapping stud strip and lifts high enough for overhanging plates to clear the camera sightline', () => {
    // Two 2x6 plates (120x8x40) overlapping by 1x6 studs (z in [-20, 0]),
    // with the top plate overhanging 1 stud toward +Z (toward the camera at az=38, el=28).
    const step1: PlacementStepInput = {
      id: 's1',
      camera: { az: 38, el: 28, side: 'top' },
      parts: [
        makePart('bottom_2x6', 0, 0, -20, 120, 8, 40, RED), // z in [-40, 0]
        makePart('top_2x6', 0, 8, 0, 120, 8, 40, RED),      // z in [-20, +20]
      ],
    };

    const res = computeAutoPlacementOffsetsForSequence([step1]);
    const offs = res.get('s1');
    expect(offs).toBeDefined();
    expect(offs!['bottom_2x6']).toBeUndefined();
    const topOff = offs!['top_2x6'];
    expect(topOff).toBeDefined();
    // Must lift high enough (>= 38 LDU) so the front overhang clears the sightline to the attaching studs & arrows
    expect(topOff.y).toBeGreaterThanOrEqual(38);
    // arrowBox must be clipped to the exact 1x6 attaching stud strip (z in [-20, 0], center z = -10)
    expect(topOff.arrowBox).toBeDefined();
    expect(topOff.arrowBox!.center[2]).toBeCloseTo(-10, 2);

    const segs = computePlacementArrowSegments(topOff.arrowBox!, [topOff.x, topOff.y, topOff.z], topOff.arrowTo, null, 38);
    expect(segs).toHaveLength(2);
    expect(segs[0].to[2]).toBeCloseTo(-10, 2);
    expect(segs[1].to[2]).toBeCloseTo(-10, 2);
    expect(segs[0].to[0]).toBeCloseTo(50, 2);
    expect(segs[1].to[0]).toBeCloseTo(-50, 2);
  });

  it('never offsets a multi-brick stacked underside cluster together (keeps stacked plates seated and avoids through-plate false camouflage)', () => {
    // Upside-down underside step adding a 4-part touching/stacked cluster onto a red/black deck:
    // - red_4x6 attaches under the black deck at Y=[-8..0]
    // - black_4x4 and yellow_round_4x4 stack directly underneath red_4x6 at Y=[-16..-8]
    // - red_2x2 attaches under the red side rail at Y=[-8..0]
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        skip: true,
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('deck_black_center', 0, 0, 0, 80, 8, 120, BLACK),
          makePart('deck_red_rail_l', -50, 0, 0, 20, 8, 160, RED),
          makePart('deck_red_rail_r', 50, 0, 0, 20, 8, 160, RED),
          makePart('deck_red_front', 0, 0, 90, 120, 8, 60, RED),
          makePart('deck_black_back', 0, 0, -90, 80, 8, 60, BLACK),
        ],
      },
      {
        id: 's5',
        camera: { az: 38, el: -30, side: 'bottom' },
        parts: [
          makePart('red_4x6', 0, -8, 0, 80, 8, 120, RED),
          makePart('red_2x2', -60, -8, -40, 40, 8, 40, RED),
          makePart('black_4x4', 0, -16, -20, 80, 8, 80, BLACK),
          makePart('yellow_round_4x4', 0, -16, 60, 80, 8, 80, YELLOW),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s5') ?? {};
    // None of the stacked cluster bricks (red_4x6 supporting black_4x4/yellow_round_4x4, or those stacked children) may be offset
    expect(offs['red_4x6']).toBeUndefined();
    expect(offs['black_4x4']).toBeUndefined();
    expect(offs['yellow_round_4x4']).toBeUndefined();
    // At most 1 isolated unblocked piece (red_2x2) may be offset — never a multi-brick cluster
    expect(Object.keys(offs).length).toBeLessThanOrEqual(1);
  });

  it('never offsets two physically touching sibling parts together on a subsequent step', () => {
    // Two touching 1x4 light-blue plates side-by-side on a light-blue base (both would individually score for color camouflage)
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('b1', 0, 0, 0, 80, 8, 80, LIGHT_BLUE),
          makePart('b2', 80, 0, 0, 80, 8, 80, LIGHT_BLUE),
          makePart('b3', 0, 0, 80, 80, 8, 80, LIGHT_BLUE),
          makePart('b4', 80, 0, 80, 80, 8, 80, LIGHT_BLUE),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('strip_a', 40, 8, 20, 80, 8, 20, LIGHT_BLUE), // z in [10, 30]
          makePart('strip_b', 40, 8, 40, 80, 8, 20, LIGHT_BLUE), // z in [30, 50] — touches strip_a at z=30
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2') ?? {};
    // Must never lift both touching plates together as a floating 2-brick cluster
    expect(Object.keys(offs).length).toBeLessThanOrEqual(1);
  });

  it('never offsets a stacked or touching multi-brick cluster together on Step 1', () => {
    // 3-brick vertical stack on Step 1: base -> mid -> top
    const stackStep1: PlacementStepInput = {
      id: 's1_stack',
      camera: { az: 38, el: 28, side: 'top' },
      parts: [
        makePart('base_2x4', 0, 0, 0, 80, 8, 40, DARK_GRAY),
        makePart('mid_2x2', 0, 8, 0, 40, 8, 40, RED),
        makePart('top_1x2', 0, 16, 0, 40, 8, 20, YELLOW),
      ],
    };
    const stackRes = computeAutoPlacementOffsetsForSequence([stackStep1]).get('s1_stack') ?? {};
    expect(stackRes['base_2x4']).toBeUndefined();
    expect(stackRes['mid_2x2']).toBeUndefined();
    expect(stackRes['top_1x2']).toBeDefined();
    expect(stackRes['top_1x2'].y).toBeGreaterThanOrEqual(24);
    expect(Object.keys(stackRes)).toHaveLength(1);

    // Two side-by-side touching plates atop a base on Step 1
    const pairStep1: PlacementStepInput = {
      id: 's1_pair',
      camera: { az: 38, el: 28, side: 'top' },
      parts: [
        makePart('base_2x4', 0, 0, 0, 80, 8, 40, DARK_GRAY),
        makePart('top_a', 0, 8, -10, 80, 8, 20, YELLOW), // z in [-20, 0]
        makePart('top_b', 0, 8, 10, 80, 8, 20, TAN),     // z in [0, 20] — touches top_a at z=0
      ],
    };
    const pairRes = computeAutoPlacementOffsetsForSequence([pairStep1]).get('s1_pair') ?? {};
    expect(pairRes['base_2x4']).toBeUndefined();
    // Never float both touching upper plates together as a glued cluster
    expect(Object.keys(pairRes)).toHaveLength(1);
  });

  it('leaves a brick cleanly seated instead of forcing a colliding offset when blocked in all withdrawal directions', () => {
    // Small brick enclosed between a floor below, ceiling above, and solid walls on all 4 sides
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        skip: true,
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('floor', 0, 0, 0, 120, 8, 120, DARK_GRAY),
          makePart('ceiling', 0, 32, 0, 120, 8, 120, DARK_GRAY),
          makePart('wall_px', 30, 8, 0, 20, 24, 120, DARK_GRAY),
          makePart('wall_nx', -30, 8, 0, 20, 24, 120, DARK_GRAY),
          makePart('wall_pz', 0, 8, 30, 120, 24, 20, DARK_GRAY),
          makePart('wall_nz', 0, 8, -30, 120, 24, 20, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('trapped_1x1', 0, 8, 0, 20, 24, 20, DARK_GRAY),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    expect(res.get('s2')).toBeUndefined();
  });

  it('offsets a horizontal Technic pin coaxially out the OPEN hole end without lifting vertically or clipping through a blocking cap brick', () => {
    // Deck plate (maxY=4), two seated 6541 Technic bricks along Z, a blocking 1x2 brick on the -Z end,
    // and an open hole on the +Z end. Pin sits at y=[6..22] (2 LDU above deck studs).
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('deck', 0, -8, 0, 120, 12, 120, DARK_GRAY),         // maxY = 4
          makePart('technic_back', 0, 0, -10, 20, 28, 20, LIGHT_BLUE), // z in [-20..0]
          makePart('technic_front', 0, 0, 10, 20, 28, 20, BLACK),      // z in [0..20]
          makePart('back_cap_1x2', 0, 0, -30, 40, 28, 20, TAN),        // z in [-40..-20] blocks -Z!
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('pin_2780', 0, 6, 0, 16, 16, 40, BLACK),            // y in [6..22], z in [-20..20]
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const pinOff = res.get('s2')?.['pin_2780'];
    expect(pinOff).toBeDefined();
    // Must exit strictly horizontally along +Z (open end), never lifted vertically (+Y)
    expect(pinOff!.x).toBe(0);
    expect(pinOff!.y).toBe(0);
    expect(pinOff!.z).toBeGreaterThanOrEqual(36);
    // Shifted pin back edge (z = -20 + pinOff.z) must clear technic_front (+20) by >= 16 LDU (no clipping!)
    expect(-20 + pinOff!.z).toBeGreaterThanOrEqual(20 + 16);
    // Arrowhead terminates cleanly at the open hole face (z ≈ +22)
    expect(pinOff!.arrowTo).toBeDefined();
    expect(pinOff!.arrowTo![2]).toBeCloseTo(22, 1);
  });

  it('prevents same-step pin + host brick clipping (e.g. imported steps) by keeping host grounded and sliding pin horizontally', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('deck', 0, -8, 0, 200, 12, 200, DARK_GRAY),
          makePart('side_a', -80, 0, 0, 40, 24, 160, DARK_GRAY),
          makePart('side_b', 80, 0, 0, 40, 24, 160, DARK_GRAY),
          makePart('back_a', 0, 0, -80, 120, 24, 40, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('host_6541', 0, 0, 0, 20, 28, 20, LIGHT_BLUE),
          makePart('pin_half', 0, 6, 10, 16, 16, 28, BLACK),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    // Host stays grounded so the pin can slide horizontally into it with zero clipping
    expect(offs!['host_6541']).toBeUndefined();
    const pinOff = offs!['pin_half'];
    expect(pinOff).toBeDefined();
    expect(pinOff!.y).toBe(0);
    expect(pinOff!.z).toBeGreaterThanOrEqual(24);
  });

  it('does NOT trigger unnecessary offset placements for contrasting, unobstructed standard 1x2 bricks on large models', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('chassis_1', -150, 0, 0, 200, 16, 120, DARK_GRAY),
          makePart('chassis_2', 50, 0, 0, 200, 16, 120, DARK_GRAY),
          makePart('chassis_3', 250, 0, 0, 200, 16, 120, DARK_GRAY),
          makePart('deck_lbg', 0, 16, 0, 120, 8, 80, [160, 165, 169]),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('brick_1x2_a', -20, 24, 0, 40, 28, 20, BLACK),
          makePart('brick_1x2_b', 20, 24, 20, 40, 28, 20, RED),
          makePart('brick_1x2_c', 20, 24, -20, 40, 28, 20, YELLOW),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    expect(res.get('s2')).toBeUndefined();
  });

  it('caps subsequent-step non-lateral offsets and skips nearby candidates that would crowd/occlude an accepted offset in screen space', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('b1', 0, 0, 0, 200, 24, 200, DARK_GRAY),
          makePart('b2', 200, 0, 0, 200, 24, 200, DARK_GRAY),
          makePart('b3', 0, 0, 200, 200, 24, 200, DARK_GRAY),
          makePart('b4', 200, 0, 200, 200, 24, 200, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        // Four immediately adjacent same-color camouflaged 1x2 bricks packed right next to each other
        parts: [
          makePart('adj_0', 0, 24, 0, 40, 28, 20, DARK_GRAY),
          makePart('adj_1', 0, 24, 20, 40, 28, 20, DARK_GRAY),
          makePart('adj_2', 0, 24, 40, 40, 28, 20, DARK_GRAY),
          makePart('adj_3', 0, 24, 60, 40, 28, 20, DARK_GRAY),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs).toBeDefined();
    // Should never explode all 4 adjacent bricks on top of each other — cap <= 2 and skip crowding neighbors
    expect(Object.keys(offs!).length).toBeLessThanOrEqual(2);
  });

  it('never misclassifies stacked or underside-attached plates with 4 LDU top-stud overlap as horizontal coaxial pins', () => {
    // Compiled LDraw plates have total height 12 LDU (8 LDU body + 4 LDU top studs),
    // so stacking a 2x6 plate at y=0..12 onto a 2x6 plate at y=-8..4 creates ovY = 4 > 3!
    // Similarly, attaching a 1x12 plate at y=-8..4 underneath an overhanging 2x6 plate at y=0..12 creates ovY = 4 > 3.
    // Both MUST offset purely vertically along the direction of the studs (NEVER shot sideways!).
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('plate_2x6_bot', 0, -8, -20, 120, 12, 40, RED), // y in [-8, 4], z in [-40, 0]
          makePart('plate_2x6_top', 0, 0, 0, 120, 12, 40, RED),    // y in [0, 12], z in [-20, 20]
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          // 1x12 red plate tucked under the overhanging row of plate_2x6_top (z in [0, 20]) and flush with plate_2x6_bot
          makePart('plate_1x12_under', 50, -8, 120, 20, 12, 240, RED), // y in [-8, 4], z in [0, 240]
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);

    // Step 1: upper 2x6 plate must lift strictly UP (+Y), zero X/Z sideways slide!
    const s1Off = res.get('s1')?.['plate_2x6_top'];
    expect(s1Off).toBeDefined();
    expect(s1Off!.x).toBe(0);
    expect(s1Off!.z).toBe(0);
    expect(s1Off!.y).toBeGreaterThanOrEqual(24);

    // Step 2: if plate_1x12_under is offset (e.g. occlusion/camouflage), it must move strictly along Y (NEVER shot horizontally along Z!)
    const s2Off = res.get('s2')?.['plate_1x12_under'];
    if (s2Off) {
      expect(s2Off.x).toBe(0);
      expect(s2Off.z).toBe(0);
      expect(s2Off.y).toBeLessThanOrEqual(-24);
    }
  });

  it('offsets a vertical SNOT tile purely in the direction of its engaged side studs even when its bottom edge rests on a brick and side walls graze it', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('lower_bumper', 30, 0, 4, 20, 24, 16, DARK_GRAY), // top at y=24 directly under tile bottom
          {
            ...makePart('snot_bot', 30, 24, -8, 20, 24, 24, BLACK), // z in [-20, +4] incl. 4 LDU side stud
            localUp: [0, 1, 0],
            studs: [
              [30, 48, -10, 0, 1, 0],
              [30, 34, 0, 0, 0, 1], // side stud pointing +Z!
            ],
          },
          {
            ...makePart('snot_top', 30, 120, -8, 20, 24, 24, BLACK), // z in [-20, +4] incl. 4 LDU side stud
            localUp: [0, 1, 0],
            studs: [
              [30, 144, -10, 0, 1, 0],
              [30, 134, 0, 0, 0, 1], // side stud pointing +Z!
            ],
          },
          // 3 wall bricks grazing the tile's smooth -X side
          makePart('side_wall_1', 10, 24, 4, 20, 24, 8, DARK_GRAY),
          makePart('side_wall_2', 10, 48, 4, 20, 24, 8, DARK_GRAY),
          makePart('side_wall_3', 10, 72, 4, 20, 24, 8, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('red_snot_1x6', 30, 24, 4, 20, 120, 8, RED), // x:[20..40], y:[24..144], z:[0..8]
            localUp: [0, 0, 1],
          },
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const off = res.get('s2')?.['red_snot_1x6'];
    expect(off).toBeDefined();
    expect(off!.z).toBeGreaterThanOrEqual(24);
    expect(off!.x).toBe(0);
    expect(off!.y).toBe(0);
    expect(off!.arrow).toBe(true);

    const segs = computePlacementArrowSegments(off!.arrowBox || steps[1].parts[0].box, [off!.x, off!.y, off!.z], off!.arrowTo, null, 38);
    expect(segs).toHaveLength(2);
    expect(segs[0].to[0]).toBeCloseTo(30, 2);
    expect(segs[0].to[1]).toBeCloseTo(134, 2);
    expect(segs[1].to[0]).toBeCloseTo(30, 2);
    expect(segs[1].to[1]).toBeCloseTo(34, 2);
  });

  it('anchors arrows to the exact engaged side studs when a SNOT tile overhangs beyond its studs', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('snot_single', 30, 24, -8, 20, 24, 24, BLACK),
            localUp: [0, 1, 0],
            studs: [[30, 34, 0, 0, 0, 1]],
          },
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('red_overhang_1x6', 30, 24, 4, 20, 120, 8, RED),
            localUp: [0, 0, 1],
          },
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const off = res.get('s2')?.['red_overhang_1x6'];
    expect(off).toBeDefined();
    expect(off!.z).toBeGreaterThanOrEqual(24);
    expect(off!.y).toBe(0);
    expect(off!.arrowBox).toBeDefined();
    expect(off!.arrowBox!.center[1]).toBeCloseTo(34, 2);

    const segs = computePlacementArrowSegments(off!.arrowBox!, [off!.x, off!.y, off!.z], off!.arrowTo, null, 38);
    expect(segs).toHaveLength(1);
    expect(segs[0].to[1]).toBeCloseTo(34, 2);
  });

  it('still offsets a SNOT tile along its stud axis via localUp fallback when compiled stud primitives are absent', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('lower_bumper', 30, 0, 4, 20, 24, 16, DARK_GRAY),
          makePart('snot_back_no_studs', 30, 24, -8, 20, 24, 24, BLACK),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('red_tile_localup', 30, 24, 4, 20, 120, 8, RED),
            localUp: [0, 0, 1],
          },
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const off = res.get('s2')?.['red_tile_localup'];
    expect(off).toBeDefined();
    expect(off!.z).toBeGreaterThanOrEqual(24);
    expect(off!.x).toBe(0);
    expect(off!.y).toBe(0);
  });

  it('offsets in -studNormal when a newly placed part plugs its own side studs into an existing vertical plate, and keeps upright SNOT bricks lifting +Y when placed on top studs', () => {
    const stepsSelfStud: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          { ...makePart('vert_wall', 0, 0, -4, 40, 80, 8, DARK_GRAY), localUp: [0, 0, -1] },
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('snot_plugger', 0, 24, 10, 20, 24, 20, YELLOW),
            localUp: [0, 1, 0],
            studs: [
              [0, 48, 10, 0, 1, 0],
              [0, 34, 0, 0, 0, -1],
            ],
          },
        ],
      },
    ];
    const selfRes = computeAutoPlacementOffsetsForSequence(stepsSelfStud);
    const selfOff = selfRes.get('s2')?.['snot_plugger'];
    expect(selfOff).toBeDefined();
    expect(selfOff!.z).toBeGreaterThanOrEqual(24);
    expect(selfOff!.y).toBe(0);

    const stepsUprightSnot: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('base_plate', 0, 0, 0, 80, 12, 20, DARK_GRAY),
            localUp: [0, 1, 0],
            studs: [[-30, 8, 0, 0, 1, 0], [-10, 8, 0, 0, 1, 0], [10, 8, 0, 0, 1, 0], [30, 8, 0, 0, 1, 0]],
          },
          {
            ...makePart('upright_snot', 10, 8, 0, 20, 28, 20, BLACK),
            localUp: [0, 1, 0],
            studs: [[10, 32, 0, 0, 1, 0], [10, 18, 10, 0, 0, 1]],
          },
        ],
      },
    ];
    const upRes = computeAutoPlacementOffsetsForSequence(stepsUprightSnot);
    const upOff = upRes.get('s1')?.['upright_snot'];
    expect(upOff).toBeDefined();
    expect(upOff!.y).toBeGreaterThanOrEqual(24);
    expect(upOff!.z).toBe(0);
  });

  it('offsets angled 45-degree SNOT tiles cleanly along the 45-degree stud normal and aligns lateral SNOT 1x2 and 2x4 arrows to stud centers', () => {
    const invSqrt2 = Math.SQRT1_2;
    const stepsAngled: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('angled_snot_base', 0, 0, 0, 24, 24, 24, BLACK),
            studs: [[10, 22, 0, invSqrt2, invSqrt2, 0]],
          },
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('angled_tile', 14, 16, 0, 20, 20, 20, RED),
            localUp: [invSqrt2, invSqrt2, 0],
          },
        ],
      },
    ];
    const angledRes = computeAutoPlacementOffsetsForSequence(stepsAngled);
    const angledOff = angledRes.get('s2')?.['angled_tile'];
    expect(angledOff).toBeDefined();
    expect(angledOff!.x).toBeGreaterThanOrEqual(16);
    expect(angledOff!.y).toBeGreaterThanOrEqual(16);
    expect(Math.abs(angledOff!.x - angledOff!.y)).toBeLessThanOrEqual(2);
    expect(angledOff!.z).toBe(0);

    const snot1x2 = makeBox(0, 0, 0, 20, 40, 8);
    const segs1x2 = computePlacementArrowSegments(snot1x2, [0, 0, 28], null, null, 38);
    expect(segs1x2).toHaveLength(2);
    expect(segs1x2[0].to[1]).toBeCloseTo(30, 2);
    expect(segs1x2[1].to[1]).toBeCloseTo(10, 2);

    const snot2x4 = makeBox(0, 0, 0, 40, 80, 8);
    const segs2x4 = computePlacementArrowSegments(snot2x4, [0, 0, 28], null, null, 38);
    expect(segs2x4).toHaveLength(2);
    expect(segs2x4[0].to[0]).toBeCloseTo(10, 2);
    expect(segs2x4[0].to[1]).toBeCloseTo(70, 2);
    expect(segs2x4[1].to[0]).toBeCloseTo(-10, 2);
    expect(segs2x4[1].to[1]).toBeCloseTo(10, 2);
  });

  it('never inserts a plate upward through an already-placed overhead plate even when 4 LDU top studs overlap', () => {
    // Lower rail at y=[-8..4] (with studs at y=0..4), overhead 6x14 deck plate at y=[8..20],
    // and red 2x3 plate sandwiched underneath at y=[0..12] (its 4 LDU top studs overlap overhead plate by 4 LDU!).
    // Must NEVER lift the red 2x3 plate +Y straight through the solid overhead 6x14 plate!
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 30, side: 'top' },
        parts: [
          {
            ...makePart('lower_rail', 0, -8, 0, 40, 12, 160, RED),
            studs: [
              [-10, 0, -10, 0, 1, 0],
              [10, 0, -10, 0, 1, 0],
              [-10, 0, 10, 0, 1, 0],
              [10, 0, 10, 0, 1, 0],
            ],
          },
          makePart('overhead_6x14', 0, 8, 0, 120, 12, 280, BLACK),
          makePart('frame_left', -50, 0, 0, 20, 12, 240, RED),
          makePart('frame_right', 50, 0, 0, 20, 12, 240, RED),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 30, side: 'top' },
        parts: [
          {
            ...makePart('trapped_red_2x3', 0, 0, 0, 40, 12, 60, RED),
            localUp: [0, 1, 0],
            studs: [
              [-10, 8, -20, 0, 1, 0],
              [10, 8, -20, 0, 1, 0],
              [-10, 8, 0, 0, 1, 0],
              [10, 8, 0, 0, 1, 0],
              [-10, 8, 20, 0, 1, 0],
              [10, 8, 20, 0, 1, 0],
            ],
          },
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const off = res.get('s2')?.['trapped_red_2x3'];
    // Must either reject upward teleportation (undefined) or move away without crossing y=8..20
    if (off) {
      expect(off.y).toBeLessThanOrEqual(0);
    }
  });

  it('slides a flat 2x2 round tile with center hole vertically along a protruding vertical Technic axle instead of sideways through it', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: -30, side: 'bottom' },
        parts: [
          makePart('deck', 0, 72, 0, 120, 12, 240, RED),
          makePart('vert_axle', 0, 20, 0, 8, 64, 8, BLACK),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: -30, side: 'bottom' },
        parts: [
          makePart('round_hole_tile_15535', 0, 24, 0, 40, 8, 40, BLACK),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const off = res.get('s2')?.['round_hole_tile_15535'];
    expect(off).toBeDefined();
    expect(off!.x).toBe(0);
    expect(off!.z).toBe(0);
    // In bottom view, pulls cleanly in -Y (off the free end of the vertical axle)
    expect(off!.y).toBeLessThanOrEqual(-16);
  });

  it('terminates placement arrows right at the top center of the target stud for plates, bricks, tiles, tall parts, SNOT, and underside attachments', () => {
    // Standard plate (body 8 + stud 4 = 12 LDU) sitting on deck Y=0 (stud top at Y=4)
    const plate12 = makeBox(0, 0, 0, 20, 12, 20);
    const plateSegs = computePlacementArrowSegments(plate12, [0, 32, 0], null, null, 38);
    expect(plateSegs).toHaveLength(1);
    expect(plateSegs[0].to[0]).toBeCloseTo(0, 4);
    expect(plateSegs[0].to[1]).toBeCloseTo(4, 4);
    expect(plateSegs[0].to[2]).toBeCloseTo(0, 4);

    // Standard brick (body 24 + stud 4 = 28 LDU) sitting on deck Y=8 (stud top at Y=12)
    const brick28 = makeBox(20, 8, -10, 40, 28, 20);
    const brickSegs = computePlacementArrowSegments(brick28, [0, 48, 0], null, null, 38);
    expect(brickSegs).toHaveLength(2);
    expect(brickSegs[0].to[0]).toBeCloseTo(30, 4);
    expect(brickSegs[0].to[1]).toBeCloseTo(12, 4);
    expect(brickSegs[0].to[2]).toBeCloseTo(-10, 4);
    expect(brickSegs[1].to[0]).toBeCloseTo(10, 4);
    expect(brickSegs[1].to[1]).toBeCloseTo(12, 4);
    expect(brickSegs[1].to[2]).toBeCloseTo(-10, 4);

    // Tall 3-brick part (76 LDU) sitting on deck Y=0 (stud top at Y=4)
    const tall76 = makeBox(0, 0, 0, 20, 76, 20);
    const tallSegs = computePlacementArrowSegments(tall76, [0, 96, 0], null, null, 38);
    expect(tallSegs).toHaveLength(1);
    expect(tallSegs[0].to[1]).toBeCloseTo(4, 4);

    // SNOT plate (12 LDU thick along +Z) attaching onto side studs at Z=0..4 (stud top at Z=4)
    const snotPlate = makeBox(10, 20, 6, 20, 40, 12); // z in [0, 12]
    const snotSegs = computePlacementArrowSegments(snotPlate, [0, 0, 32], null, null, 38);
    expect(snotSegs).toHaveLength(2);
    expect(snotSegs[0].to[2]).toBeCloseTo(4, 4);
    expect(snotSegs[1].to[2]).toBeCloseTo(4, 4);

    // Upside-down plate (body Y in [-8, 0], own studs Y in [0, 4]) attaching under deck at Y=0
    const underPlate = makeBox(0, -8, 0, 20, 12, 20); // minY=-8, maxY=4
    const underSegs = computePlacementArrowSegments(underPlate, [0, -32, 0], null, null, 38);
    expect(underSegs).toHaveLength(1);
    expect(underSegs[0].to[1]).toBeCloseTo(0, 4);
  });

  it('centers arrows on exact engaged stud tops for overhanging seam-tolerant plates and hanging brackets', () => {
    // 2x2 plate with LDraw seam tolerance (39.5 x 12 x 39.5) overhanging a 1x10 plate onto 2 studs at X=10, Z=±10, Y=0..4
    const stepsOverhang: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('rail_1x10', 10, -8, 0, 19.5, 12, 199.5, RED),
            localUp: [0, 1, 0],
            studs: [
              [10, 0, -30, 0, 1, 0],
              [10, 0, -10, 0, 1, 0],
              [10, 0, 10, 0, 1, 0],
              [10, 0, 30, 0, 1, 0],
            ],
          },
          makePart('deck_a', -30, -8, -40, 60, 12, 80, DARK_GRAY),
          makePart('deck_b', -30, -8, 40, 60, 12, 80, DARK_GRAY),
          makePart('deck_c', 50, -8, 0, 60, 12, 160, RED),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('overhang_2x2', 0, 0, 0, 39.5, 12, 39.5, RED),
            localUp: [0, 1, 0],
          },
        ],
      },
    ];

    const resOver = computeAutoPlacementOffsetsForSequence(stepsOverhang);
    const overOff = resOver.get('s2')?.['overhang_2x2'];
    expect(overOff).toBeDefined();
    expect(overOff!.arrowBox).toBeDefined();
    // Must be dead-center on X=10 (not skewed to 9.875 by 39.5 seam clamping)
    expect(overOff!.arrowBox!.center[0]).toBeCloseTo(10, 4);
    const overSegs = computePlacementArrowSegments(
      overOff!.arrowBox!,
      [overOff!.x, overOff!.y, overOff!.z],
      overOff!.arrowTo,
      null,
      38,
    );
    expect(overSegs).toHaveLength(2);
    expect(overSegs[0].to[0]).toBeCloseTo(10, 4);
    expect(overSegs[0].to[1]).toBeCloseTo(4, 4);
    expect(overSegs[0].to[2]).toBeCloseTo(10, 4);
    expect(overSegs[1].to[0]).toBeCloseTo(10, 4);
    expect(overSegs[1].to[1]).toBeCloseTo(4, 4);
    expect(overSegs[1].to[2]).toBeCloseTo(-10, 4);

    // Lipped bracket/skirt whose AABB drops 4 LDU below the engaged studs (minY=-4, studs at Y=0..4)
    const stepsBracket: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('base_brick', 0, -24, 0, 40, 28, 40, RED),
            localUp: [0, 1, 0],
            studs: [
              [-10, 0, 10, 0, 1, 0],
              [10, 0, 10, 0, 1, 0],
            ],
          },
          {
            // Top horizontal flange sits on Y=0..8, front skirt lip drops down to Y=-4
            ...makePart('lipped_bracket', 0, -4, 12, 40, 12, 24, RED),
            localUp: [0, 1, 0],
          },
        ],
      },
    ];
    const resBracket = computeAutoPlacementOffsetsForSequence(stepsBracket);
    const brOff = resBracket.get('s1')?.['lipped_bracket'];
    expect(brOff).toBeDefined();
    expect(brOff!.arrowTo).toBeDefined();
    expect(brOff!.arrowTo![1]).toBeCloseTo(4, 4);
    const brSegs = computePlacementArrowSegments(
      brOff!.arrowBox || stepsBracket[0].parts[1].box,
      [brOff!.x, brOff!.y, brOff!.z],
      brOff!.arrowTo,
      null,
      38,
    );
    expect(brSegs).toHaveLength(2);
    expect(brSegs[0].to[0]).toBeCloseTo(10, 4);
    expect(brSegs[0].to[1]).toBeCloseTo(4, 4);
    expect(brSegs[0].to[2]).toBeCloseTo(10, 4);
    expect(brSegs[1].to[0]).toBeCloseTo(-10, 4);
    expect(brSegs[1].to[1]).toBeCloseTo(4, 4);
    expect(brSegs[1].to[2]).toBeCloseTo(10, 4);
  });

  it('suppresses downward offset on an upright top view when the attachment point and arrow are obscured beneath an overhead deck (but allows it when flipped upside down)', () => {
    const buildDeckSteps = (camera: { az: number; el: number; side: 'top' | 'bottom' }): PlacementStepInput[] => [
      {
        id: 's1',
        camera,
        parts: [
          makePart('upper_deck_6x6', 0, 8, -70, 120, 12, 120, RED),
          makePart('mid_black_4x4', 0, 0, 30, 80, 12, 80, BLACK),
          makePart('right_long_1x10', 50, 0, 10, 20, 12, 200, RED),
          makePart('right_cap_2x2', 40, 8, 90, 40, 12, 40, RED),
        ],
      },
      {
        id: 's2',
        camera,
        parts: [
          makePart('front_yellow_4x4', 0, 0, 110, 80, 12, 80, YELLOW),
          {
            ...makePart('left_long_1x10', -50, 0, 10, 20, 12, 200, RED),
            localUp: [0, 1, 0],
            studs: [
              [-50, 8, -80, 0, 1, 0],
              [-50, 8, -60, 0, 1, 0],
              [-50, 8, -40, 0, 1, 0],
              [-50, 8, -20, 0, 1, 0],
              [-50, 8, 0, 0, 1, 0],
              [-50, 8, 20, 0, 1, 0],
              [-50, 8, 40, 0, 1, 0],
              [-50, 8, 60, 0, 1, 0],
              [-50, 8, 80, 0, 1, 0],
              [-50, 8, 100, 0, 1, 0],
            ],
          },
        ],
      },
    ];

    // Viewed from ABOVE (top): pushing the long plate downward (-Y) hides its rear attachment
    // point and arrows behind the overhead deck & black plate — must stay cleanly seated.
    const topRes = computeAutoPlacementOffsetsForSequence(buildDeckSteps({ az: 38, el: 30, side: 'top' }));
    expect(topRes.get('s2')?.['left_long_1x10']).toBeUndefined();

    // Viewed from BELOW (flipped model): -Y moves toward the camera (up on screen), so the
    // exposed underside attachment studs & arrows are 100% visible — offset cleanly in -Y.
    const botRes = computeAutoPlacementOffsetsForSequence(buildDeckSteps({ az: 38, el: -30, side: 'bottom' }));
    const botOff = botRes.get('s2')?.['left_long_1x10'];
    expect(botOff).toBeDefined();
    expect(botOff!.y).toBeLessThanOrEqual(-20);
  });

  it('suppresses lateral offset for a rear-facing SNOT tile completely hidden behind a tall wall', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('base', 0, 0, 0, 160, 8, 160, DARK_GRAY),
          {
            ...makePart('tall_wall', 0, 8, 0, 120, 72, 20, DARK_GRAY),
            studs: [[0, 32, -10, 0, 0, -1]],
          },
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          {
            ...makePart('rear_snot_tile', 0, 20, -14, 40, 24, 8, RED),
            localUp: [0, 0, -1],
          },
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    expect(res.get('s2')?.['rear_snot_tile']).toBeUndefined();
  });

  it('never inserts an asymmetric headed fastener (e.g. towball-axle) head-first backwards through a narrow liftarm hole', () => {
    // 1. Towball-axle with wide ball on TOP (+Y): lifts cleanly +Y (drops shaft-first down into liftarm)
    const uprightRes = computeAutoPlacementOffsetsForSequence([
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('liftarm', 0, 20, 0, 18, 8, 80, BLACK),
          {
            ...makePart('towball_top', 0, 8, 20, 16, 37, 16, DARK_GRAY),
            headedShaftDir: [0, 1, 0],
          },
        ],
      },
    ]);
    const topOff = uprightRes.get('s1')?.['towball_top'];
    expect(topOff).toBeDefined();
    expect(topOff!.y).toBeGreaterThanOrEqual(24);
    expect(topOff!.x).toBe(0);
    expect(topOff!.z).toBe(0);

    // 2. Towball-axle with wide ball on BOTTOM (-Y) viewed from top:
    // MUST NEVER pull +Y (which would try to push the 16 LDU ball downwards through a 12 LDU hole!)
    const invRes = computeAutoPlacementOffsetsForSequence([
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('liftarm', 0, 20, 0, 18, 8, 80, BLACK),
          {
            ...makePart('towball_bot', 0, 8, 20, 16, 37, 16, DARK_GRAY),
            headedShaftDir: [0, -1, 0],
          },
        ],
      },
    ]);
    const invOff = invRes.get('s1')?.['towball_bot'];
    if (invOff) {
      expect(invOff.y).toBeLessThan(0);
    }

    // 3. Towball-axle with wide ball on BOTTOM (-Y) viewed from flipped bottom camera:
    // pulls cleanly -Y (UP on screen on the flipped model, dropping shaft-first into liftarm!)
    const botViewRes = computeAutoPlacementOffsetsForSequence([
      {
        id: 's1',
        camera: { az: 38, el: -28, side: 'bottom' },
        parts: [
          makePart('liftarm', 0, 20, 0, 18, 8, 80, BLACK),
          {
            ...makePart('towball_bot', 0, 8, 20, 16, 37, 16, DARK_GRAY),
            headedShaftDir: [0, -1, 0],
          },
        ],
      },
    ]);
    const botOff = botViewRes.get('s1')?.['towball_bot'];
    expect(botOff).toBeDefined();
    expect(botOff!.y).toBeLessThanOrEqual(-24);
  });

  it('stops arrowheads on top of a supporting brick nested inside a concave/U-shaped part (no buried arrowheads or jagged screen overlap)', () => {
    // Supporting 2x10 brick at Y=[17..45] (body 17..41, top studs 41..45)
    // Concave U-shaped housing/holder at Y=[17..69] whose outer forks hang 24 LDU below the brick's top studs
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          makePart('spine_2x10', 0, 17, 0, 40, 28, 200, BLACK),
          makePart('deck_plate', 0, 41, 0, 80, 12, 80, BLACK),
          makePart('side_a', -50, 17, 0, 20, 28, 80, BLACK),
          makePart('side_b', 50, 17, 0, 20, 28, 80, BLACK),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [
          // Straddles spine_2x10 at z=[50..90] (2x2 contact overlap with spine_2x10), outer flanges hang down to y=17
          {
            ...makePart('concave_holder', 0, 17, 70, 80, 52, 40, BLACK),
            localUp: [0, 1, 0],
          },
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const off = res.get('s2')?.['concave_holder'];
    expect(off).toBeDefined();
    // Must lift high enough that bottom of lifted holder clears spine_2x10 top studs (Y=45) by >= 16 LDU
    expect(17 + off!.y).toBeGreaterThanOrEqual(45 + 16);
    // Must clamp arrowTo to the nested supporting brick's stud-top surface (Y=45), never buried at Y=21
    expect(off!.arrowTo).toBeDefined();
    expect(off!.arrowTo![1]).toBeCloseTo(45, 4);

    const segs = computePlacementArrowSegments(
      off!.arrowBox || steps[1].parts[0].box,
      [off!.x, off!.y, off!.z],
      off!.arrowTo,
      null,
      38,
    );
    expect(segs).toHaveLength(2);
    for (const seg of segs) {
      // Arrow tail starts right at the lifted recessed anti-stud bottom (41 + off.y),
      // and arrowhead lands right on top of the supporting brick's stud (Y=45).
      expect(seg.from[1]).toBeCloseTo(41 + off!.y, 4);
      expect(seg.to[1]).toBeCloseTo(45, 4);
      expect(seg.from[1] - seg.to[1]).toBeGreaterThanOrEqual(12);
    }
    // The two arrows must be clearly separated horizontally in screen X (>= 10 LDU) so they never look jagged/merged
    const azRad = (38 * Math.PI) / 180;
    const rx = Math.cos(azRad);
    const rz = -Math.sin(azRad);
    const u0 = segs[0].to[0] * rx + segs[0].to[2] * rz;
    const u1 = segs[1].to[0] * rx + segs[1].to[2] * rz;
    expect(Math.abs(u0 - u1)).toBeGreaterThanOrEqual(10);
  });

  it('detects coaxial Technic pin/axle-to-hole arrows pointing between the axle tip and the top of the receiving hole', () => {
    // Stationary vertical 3L Technic axle (8x60x8) protruding downward from Y=85.4 down to tip Y=25.4 at (0, -308)
    const yellowAxle = makePart('axle_4519', 0, 25.4, -308, 8, 60, 8, [242, 205, 55]);
    // Moving 2x2 round tile with center hole (40x8x40) seated at Y=[25..33] wrapping the axle
    const holeTile = makePart('tile_15535', 0, 25, -308, 40, 8, 40, BLACK);

    // Offset downward by -44 LDU (piece slides UP into place onto the axle)
    const res = detectCoaxialPinHoleArrows([holeTile], [yellowAxle], [0, -44, 0]);
    expect(res.arrows).toHaveLength(1);
    const arrow = res.arrows[0];
    // Centered exactly on the axle centerline (X=0, Z=-308)
    expect(arrow.from[0]).toBeCloseTo(0, 4);
    expect(arrow.from[2]).toBeCloseTo(-308, 4);
    expect(arrow.to[0]).toBeCloseTo(0, 4);
    expect(arrow.to[2]).toBeCloseTo(-308, 4);
    // Starts at the lifted top of the hole (33 - 44 = -11) and terminates right at the axle tip (25.4)
    expect(arrow.from[1]).toBeCloseTo(-11, 4);
    expect(arrow.to[1]).toBeCloseTo(25.4, 4);
    expect(res.stationaryShaftBoxes).toHaveLength(1);
  });

  it('anchors underside sub-module stud arrows strictly to engaged studs AND adds a coaxial axle-to-hole arrow', () => {
    // Deck floor plate at Y=[73..81] + protruding vertical Technic axle at Z=-308 (tip at Y=25.4)
    const deck = makePart('deck', 0, 73, -278, 120, 8, 100, [196, 40, 27]);
    const yellowAxle = makePart('axle_4519', 0, 25.4, -308, 8, 60, 8, [242, 205, 55]);

    // Pre-built underside sub-module:
    // - 2x6 brick at back (Z=-248, Y=[49..73]) with top studs engaging deck underside at Y=73
    // - lower wedge plate at Y=[17..25] (does NOT touch deck)
    // - 2x2 round tile with hole at front (Z=-308, Y=[25..33]) receiving yellowAxle
    const backBrick: PlacementPartInput = {
      ...makePart('brick_2456', 0, 49, -248, 120, 24, 40, DARK_GRAY),
      studs: [
        [-50, 73, -258, 0, 1, 0],
        [-30, 73, -258, 0, 1, 0],
        [30, 73, -238, 0, 1, 0],
        [50, 73, -238, 0, 1, 0],
      ],
    };
    const basePlate = makePart('plate_32059', 0, 17, -288, 120, 8, 80, DARK_GRAY);
    const holeTile = makePart('tile_15535', 0, 25, -308, 40, 8, 40, BLACK);

    const attached = computeSubassemblyAttachmentOffsets(
      [backBrick, basePlate, holeTile],
      [deck, yellowAxle],
      [0, -1, 0],
      44,
      { az: 38, el: 30 },
    );

    expect(attached.hasCoaxialPinHole).toBe(true);
    // Lead arrow carrier must be the stud-engaging backBrick, NOT the untouched lower plate
    const leadOff = attached.offsets['brick_2456'];
    expect(leadOff.arrow).toBe(true);
    expect(attached.offsets['plate_32059'].arrow).toBe(false);
    expect(attached.offsets['tile_15535'].arrow).toBe(false);

    // Primary stud arrowBox must tightly frame the engaged backBrick studs (Z in [-268..-228]), not basePlate
    expect(leadOff.arrowBox).toBeDefined();
    expect(leadOff.arrowBox!.min[2]).toBeCloseTo(-268, 4);
    expect(leadOff.arrowBox!.max[2]).toBeCloseTo(-228, 4);
    // Must ALSO include the dedicated coaxial axle-to-hole arrow in extraArrows at (0, -308)
    expect(leadOff.extraArrows).toBeDefined();
    expect(leadOff.extraArrows!).toHaveLength(1);
    expect(leadOff.extraArrows![0].from).toEqual([0, 33 + leadOff.y, -308]);
    expect(leadOff.extraArrows![0].to).toEqual([0, 25.4, -308]);

    // buildPlacementArrowGeometry must render both stud arrows AND the coaxial extraSegment
    const geom = buildPlacementArrowGeometry(
      [
        {
          box: leadOff.arrowBox!,
          offset: [leadOff.x, leadOff.y, leadOff.z],
          arrowTo: leadOff.arrowTo ?? null,
          extraSegments: leadOff.extraArrows ?? null,
          rgb: [220, 38, 38],
        },
      ],
      38,
      30,
      { style: 'flat' },
    );
    // 2 stud arrows + 1 coaxial arrow = 3 flat arrows × 3 triangles × 9 floats = 81 floats
    expect(geom.triPos.length).toBe(81);
  });

  it('uses concave subBoxes so a 4x4 plate plugging vertically upward into L-bracket top flanges offsets vertically, never horizontally', () => {
    // Reproduces IMG_0419 Step 2: two L-shaped brackets (44728.dat) whose outer AABB drops down to Y=17,
    // while their horizontal top flange spans Y=[49..57]. A 4x4 plate at Y=[41..49] plugs its +Y studs
    // upward into the underside of the horizontal top flanges (Y=49) -> attachment is strictly vertical!
    const bracketA = {
      ...makePart('bracket_a', 30, 17, -20, 20, 44, 40, BLACK),
      localUp: [0, 1, 0] as readonly [number, number, number],
      subBoxes: [
        makeBox(20, 49, -40, 40, 61, 0), // horizontal top flange (underside at Y=49)
        makeBox(36, 17, -40, 44, 57, 0), // vertical side skirt hanging down to Y=17
      ],
    };
    const bracketB = {
      ...makePart('bracket_b', 30, 17, 20, 20, 44, 40, BLACK),
      localUp: [0, 1, 0] as readonly [number, number, number],
      subBoxes: [
        makeBox(20, 49, 0, 40, 61, 40),
        makeBox(36, 17, 0, 44, 57, 40),
      ],
    };
    const plate4x4 = {
      ...makePart('plate_4x4', 0, 41, 0, 80, 12, 80, BLACK),
      localUp: [0, 1, 0] as readonly [number, number, number],
      studs: [
        [30, 49, -30, 0, 1, 0] as const,
        [30, 49, -10, 0, 1, 0] as const,
        [30, 49, 10, 0, 1, 0] as const,
        [30, 49, 30, 0, 1, 0] as const,
      ],
    };

    const res = computeAutoPlacementOffsetsForSequence([
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [bracketA, bracketB],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [plate4x4],
      },
    ]);

    const off = res.get('s2')?.['plate_4x4'];
    // Either strictly vertical (-Y) or omitted if hidden, NEVER horizontal!
    if (off) {
      expect(off.x).toBe(0);
      expect(off.z).toBe(0);
      expect(off.y).toBeLessThan(0);
    }
  });

  it('never falls back to a physically impossible vertical offset when a purely lateral side attachment is on the camera-occluded far side', () => {
    // Reproduces Wheel hub Step 2: wheel holder at X=[-40..40], far-side wheel plugged horizontally
    // into its -X side (camDot < -0.15 from az=38). When the -X lateral pull is rejected by the
    // visibility gate, it must omit the offset rather than pulling the wheel vertically through the holder roof.
    const holder = makePart('wheel_holder', 0, 20, 0, 80, 36, 40, BLACK);
    const farWheel = makePart('wheel_far', -48, 0, 0, 20, 40, 40, BLACK);

    const res = computeAutoPlacementOffsetsForSequence([
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [holder],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [farWheel],
      },
    ]);

    const off = res.get('s2')?.['wheel_far'];
    if (off) {
      expect(off.y).toBe(0);
    }
  });

  it('never pulls a bottom-protruding wheel tucked underneath a closed-top wheel holder arch upward (+Y) through its solid roof', () => {
    // Reproduces Wheel hub x2 Step 2: 38340 wheel sits inside 38339 wheel holder XZ footprint,
    // protrudes below the holder (minY=10 < 21), and stays strictly below the closed top (maxY=48 < 65).
    const holder = makePart('wheel_holder_38339', 0, 21, 0, 120, 44, 40, BLACK);
    const wheelInArch = makePart('wheel_38340', -44, 10, 0, 22, 38, 32, BLACK);

    const res = computeAutoPlacementOffsetsForSequence([
      {
        id: 's1',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [holder],
      },
      {
        id: 's2',
        camera: { az: 38, el: 28, side: 'top' },
        parts: [wheelInArch],
      },
    ]);

    const off = res.get('s2')?.['wheel_38340'];
    // On an upright top view, pulling upward (+Y) through the closed top is impossible,
    // and pulling downward (-Y) is occluded behind the holder -> must stay cleanly seated (or never pull +Y).
    if (off) {
      expect(off.y).toBeLessThanOrEqual(0);
    }
  });
});

describe('computeAnimatedStepOffsets', () => {
  it('gives side-by-side plates of different widths/lengths uniform lift distances instead of 2x discrepancy', async () => {
    const { computeAnimatedStepOffsets } = await import('../placementArrows');
    const baseHull = makePart('hull', 0, 0, 0, 120, 16, 120, RED);
    const plate1x6 = makePart('p_1x6', 0, -12, -50, 120, 8, 20, RED);
    const plate2x6 = makePart('p_2x6', 0, -12, -20, 120, 8, 40, RED);

    const offsets = computeAnimatedStepOffsets({
      stepParts: [plate1x6, plate2x6],
      prevParts: [baseHull],
      // Only one of the two plates received an auto-arrow offset (e.g. 32 LDU downward)
      autoOffsets: { p_1x6: { x: 0, y: -32, z: 0 } },
    });

    const off1 = offsets.get('p_1x6')!;
    const off2 = offsets.get('p_2x6')!;
    expect(off1[1]).toBeLessThan(0);
    expect(off2[1]).toBeLessThan(0);
    // Both 8-LDU-thick plates should lift by the exact same ~32 LDU distance
    expect(Math.abs(Math.hypot(...off1) - Math.hypot(...off2))).toBeLessThanOrEqual(4);
    expect(Math.hypot(...off2)).toBeLessThanOrEqual(40);
  });

  it('offsets a Technic washer and knob DOWN along a vertical axle when blocked above by a liftarm, even if washer localUp is horizontal', async () => {
    const { computeAnimatedStepOffsets } = await import('../placementArrows');
    // Black liftarm at top (y = 0..16), yellow vertical axle running down through it (y = -60..24)
    const liftarm = makePart('liftarm', 0, 0, 0, 80, 16, 16, BLACK);
    const yellowAxle = makePart('axle', 0, -60, 0, 12, 84, 12, YELLOW);
    // Grey 1/2 bush washer sitting just below the liftarm (y = -8..0), with horizontal localUp (like LDraw 4265c rotated)
    const greyWasher = {
      ...makePart('washer', 0, -8, 0, 16, 8, 16, DARK_GRAY),
      localUp: [1, 0, 0] as [number, number, number],
    };
    // Black knob/bush below the washer on the same axle (y = -24..-8)
    const blackKnob = makePart('knob', 0, -24, 0, 16, 16, 16, BLACK);

    const offsets = computeAnimatedStepOffsets({
      stepParts: [greyWasher, blackKnob],
      prevParts: [liftarm, yellowAxle],
    });

    const wOff = offsets.get('washer')!;
    const kOff = offsets.get('knob')!;
    // Both must offset strictly DOWN (-Y), never sideways along localUp (+X)
    expect(wOff[0]).toBe(0);
    expect(wOff[2]).toBe(0);
    expect(wOff[1]).toBeLessThan(-40);
    expect(kOff[0]).toBe(0);
    expect(kOff[2]).toBe(0);
    expect(kOff[1]).toBeLessThan(-40);
    // Both must clear the bottom tip of the yellow axle (y = -60) and not overlap each other
    const wMaxY = greyWasher.box.max[1] + wOff[1];
    const wMinY = greyWasher.box.min[1] + wOff[1];
    const kMaxY = blackKnob.box.max[1] + kOff[1];
    expect(wMaxY).toBeLessThan(-60);
    expect(kMaxY).toBeLessThan(wMinY);
  });
});

describe('placementArrows — sibling non-occlusion (never hide another piece behind an offset)', () => {
  it('bottom view: lifts a foreground red plate cleanly past a dark-gray sibling behind it instead of hiding it', () => {
    // Mirrors IMG_0465 Step 14: underside build (el = -30, side = 'bottom') where a red
    // plate sits directly in front of a newly added dark-gray plate along the camera view.
    const hull = [
      makePart('hull_1', 0, 0, -100, 120, 8, 100, RED),
      makePart('hull_2', 0, 0, 0, 120, 8, 100, RED),
      makePart('hull_3', 0, 0, 100, 120, 8, 100, RED),
      makePart('hull_4', 0, 8, 0, 120, 8, 300, DARK_GRAY),
    ];
    const cam = { az: 38, el: -30, side: 'bottom' as const };
    const redFront = makePart('red_front', 0, -8, 10, 80, 8, 40, RED);
    const grayBehind = makePart('gray_behind', 0, -8, -20, 80, 8, 20, DARK_GRAY);

    const soloOffs = computeAutoPlacementOffsetsForSequence([
      { id: 's1', camera: cam, parts: hull },
      { id: 's2', camera: cam, parts: [redFront] },
    ]).get('s2');
    const pairOffs = computeAutoPlacementOffsetsForSequence([
      { id: 's1', camera: cam, parts: hull },
      { id: 's2', camera: cam, parts: [redFront, grayBehind] },
    ]).get('s2');

    expect(soloOffs?.['red_front']).toBeDefined();
    expect(pairOffs?.['red_front']).toBeDefined();
    // With `gray_behind` present, `red_front` must lift strictly higher along -Y to clear its sightline
    expect(pairOffs!['red_front'].y).toBeLessThan(soloOffs!['red_front'].y);
    expect(pairOffs!['red_front'].y).toBeGreaterThanOrEqual(-72);
  });

  it('top view: lifts a foreground camouflaged plate cleanly past a sibling behind it', () => {
    const deck = [
      makePart('deck_1', 0, 0, -100, 120, 8, 100, LIGHT_BLUE),
      makePart('deck_2', 0, 0, 0, 120, 8, 100, LIGHT_BLUE),
      makePart('deck_3', 0, 0, 100, 120, 8, 100, LIGHT_BLUE),
      makePart('deck_4', 0, -8, 0, 120, 8, 300, DARK_GRAY),
    ];
    const cam = { az: 38, el: 30, side: 'top' as const };
    const blueFront = makePart('blue_front', 0, 8, 10, 80, 8, 40, LIGHT_BLUE);
    const yellowBehind = makePart('yellow_behind', 0, 8, -20, 80, 8, 20, YELLOW);

    const soloOffs = computeAutoPlacementOffsetsForSequence([
      { id: 's1', camera: cam, parts: deck },
      { id: 's2', camera: cam, parts: [blueFront] },
    ]).get('s2');
    const pairOffs = computeAutoPlacementOffsetsForSequence([
      { id: 's1', camera: cam, parts: deck },
      { id: 's2', camera: cam, parts: [blueFront, yellowBehind] },
    ]).get('s2');

    expect(soloOffs?.['blue_front']).toBeDefined();
    expect(pairOffs?.['blue_front']).toBeDefined();
    expect(pairOffs!['blue_front'].y).toBeGreaterThan(soloOffs!['blue_front'].y);
    expect(pairOffs!['blue_front'].y).toBeLessThanOrEqual(72);
  });

  it('rejects an offset when lifting within the natural height cap would still hide a tall sibling behind it', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 0, el: 30, side: 'top' },
        parts: [
          makePart('deck_1', 0, 0, -100, 120, 8, 100, RED),
          makePart('deck_2', 0, 0, 0, 120, 8, 100, RED),
          makePart('deck_3', 0, 0, 100, 120, 8, 100, RED),
          makePart('deck_4', 0, -8, 0, 120, 8, 300, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 0, el: 30, side: 'top' },
        parts: [
          // Foreground camouflaged 2x4 red plate (z = 10..50)
          makePart('red_front', 0, 8, 30, 80, 8, 40, RED),
          // Tall contrasting brick wall directly behind it (z = -30..0, y = 8..72) so every lift up to 68 LDU still hides it
          makePart('tall_behind', 0, 8, -15, 80, 64, 30, YELLOW),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs?.['red_front']).toBeUndefined();
  });

  it('control: keeps a compact lift height when the offset piece is BEHIND the seated sibling (Step 13)', () => {
    const steps: PlacementStepInput[] = [
      {
        id: 's1',
        camera: { az: 38, el: -30, side: 'bottom' },
        parts: [
          makePart('hull_1', 0, 0, -80, 120, 8, 80, RED),
          makePart('hull_2', 0, 0, 0, 120, 8, 80, RED),
          makePart('hull_3', 0, 0, 80, 120, 8, 80, RED),
          makePart('hull_4', 0, 8, 0, 120, 8, 240, DARK_GRAY),
        ],
      },
      {
        id: 's2',
        camera: { az: 38, el: -30, side: 'bottom' },
        parts: [
          // Red 1x6 plate FURTHER from camera (-Z) — lifting it moves into open background
          makePart('red_back', 0, -8, -40, 120, 8, 20, RED),
          // Dark gray 1x6 plate CLOSER to camera (+Z)
          makePart('gray_front', 0, -8, 10, 120, 8, 20, DARK_GRAY),
        ],
      },
    ];

    const res = computeAutoPlacementOffsetsForSequence(steps);
    const offs = res.get('s2');
    expect(offs?.['red_back']).toBeDefined();
    // Should remain compact (~28–36 LDU) since lifting `red_back` does not hide `gray_front`
    expect(Math.abs(offs!['red_back'].y)).toBeLessThanOrEqual(36);
  });
});






