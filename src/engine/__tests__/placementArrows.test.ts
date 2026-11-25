import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ARROW_COLOR,
  computeAutoPlacementOffsetsForSequence,
  computePlacementArrowSegments,
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

  it('computes 1 centered non-clipping arrow for compact pieces and 2 end-aligned arrows for elongated pieces', () => {
    // Compact 1x2 plate lifted +28 LDU
    const compactBox = makeBox(0, 8, 0, 40, 8, 20);
    const compactSegs = computePlacementArrowSegments(compactBox, [0, 28, 0]);
    expect(compactSegs).toHaveLength(1);
    expect(compactSegs[0].from[0]).toBeCloseTo(0, 4);
    expect(compactSegs[0].from[1]).toBeLessThan(compactBox.center[1] + 28 - 4); // starts outside lifted plate bottom
    expect(compactSegs[0].to[1]).toBeGreaterThan(compactBox.center[1]); // lands cleanly above seated center

    // Elongated 1x4 plate (80x8x20) lifted +28 LDU -> 2 parallel arrows at X = ±30
    const longPlateBox = makeBox(0, 8, 0, 80, 8, 20);
    const longSegs = computePlacementArrowSegments(longPlateBox, [0, 28, 0]);
    expect(longSegs).toHaveLength(2);
    expect(longSegs[0].from[0]).toBeCloseTo(-30, 4);
    expect(longSegs[1].from[0]).toBeCloseTo(30, 4);
    expect(longSegs[0].from[1]).toBeGreaterThan(longSegs[0].to[1]);

    // Elongated Technic beam (140x24x20) offset laterally along +Z -> 2 parallel horizontal arrows
    const beamBox = makeBox(0, 0, 0, 140, 24, 20);
    const beamSegs = computePlacementArrowSegments(beamBox, [0, 0, 40]);
    expect(beamSegs).toHaveLength(2);
    expect(beamSegs[0].from[0]).toBeCloseTo(-60, 4);
    expect(beamSegs[1].from[0]).toBeCloseTo(60, 4);
    expect(beamSegs[0].from[2]).toBeGreaterThan(beamSegs[0].to[2]);
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

    const segs = computePlacementArrowSegments(topOff.arrowBox!, [topOff.x, topOff.y, topOff.z], topOff.arrowTo);
    expect(segs).toHaveLength(2);
    expect(segs[0].to[2]).toBeCloseTo(-10, 2);
    expect(segs[1].to[2]).toBeCloseTo(-10, 2);
    expect(segs[0].to[0]).toBeCloseTo(-50, 2);
    expect(segs[1].to[0]).toBeCloseTo(50, 2);
  });
});
