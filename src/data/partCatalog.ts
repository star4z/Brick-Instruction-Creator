import type { SnapPoint, Vec3 } from '../types/manual';

export type PartShapeKind =
  | 'brick'
  | 'plate'
  | 'tile'
  | 'slope'
  | 'inverted_slope'
  | 'wedge_plate'
  | 'round_brick'
  | 'round_plate'
  | 'cone'
  | 'bar'
  | 'clip_plate'
  | 'bar_plate'
  | 'snot_brick'
  | 'snot_bracket'
  | 'technic_brick'
  | 'technic_pin'
  | 'wheel'
  | 'canopy'
  | 'hinge_plate'
  | 'minifig_legs'
  | 'minifig_torso'
  | 'minifig_head'
  | 'minifig_helmet';

export interface PartDefinition {
  partId: string;
  name: string;
  category: string;
  shape: PartShapeKind;
  /** Width along X in studs (1 stud = 20 LDU) */
  studsX: number;
  /** Depth along Z in studs (1 stud = 20 LDU) */
  studsZ: number;
  /** Height in LDU (plate = 8, brick = 24) */
  heightLdu: number;
  /** Whether top has standard studs */
  hasTopStuds: boolean;
  /** Whether bottom has anti-studs */
  hasBottomAntiStuds: boolean;
  /** Extra shape parameters (e.g., snot sides, bar length, clip axis) */
  meta?: {
    snotFaces?: Array<'px' | 'nx' | 'pz' | 'nz'>;
    barAxis?: 'x' | 'y' | 'z';
    barLengthLdu?: number;
    clipSide?: 'px' | 'nx' | 'pz' | 'nz' | 'py';
    slopeDir?: 'px' | 'nx' | 'pz' | 'nz';
    topStudsX?: number;
  };
  snaps: SnapPoint[];
  boundsMin: Vec3;
  boundsMax: Vec3;
}

const STUD_PITCH = 20;

function generateGridSnaps(
  studsX: number,
  studsZ: number,
  y: number,
  kind: 'stud' | 'anti_stud',
  normal: Vec3,
  skipPredicate?: (ix: number, iz: number) => boolean,
): SnapPoint[] {
  const snaps: SnapPoint[] = [];
  const startX = -((studsX - 1) * STUD_PITCH) / 2;
  const startZ = -((studsZ - 1) * STUD_PITCH) / 2;
  for (let ix = 0; ix < studsX; ix++) {
    for (let iz = 0; iz < studsZ; iz++) {
      if (skipPredicate?.(ix, iz)) continue;
      snaps.push({
        kind,
        position: [startX + ix * STUD_PITCH, y, startZ + iz * STUD_PITCH],
        normal,
      });
    }
  }
  return snaps;
}

function makeStandardPart(
  partId: string,
  name: string,
  category: string,
  shape: PartShapeKind,
  studsX: number,
  studsZ: number,
  heightLdu: number,
  hasTopStuds: boolean,
  hasBottomAntiStuds: boolean,
  extraSnaps: SnapPoint[] = [],
  meta?: PartDefinition['meta'],
): PartDefinition {
  const snaps: SnapPoint[] = [];
  if (hasTopStuds) {
    const topX = meta?.topStudsX ?? studsX;
    snaps.push(
      ...generateGridSnaps(studsX, studsZ, 0, 'stud', [0, 1, 0], (ix) => ix >= topX),
    );
  }
  if (hasBottomAntiStuds) {
    snaps.push(...generateGridSnaps(studsX, studsZ, -heightLdu, 'anti_stud', [0, -1, 0]));
  }
  snaps.push(...extraSnaps);

  const halfX = (studsX * STUD_PITCH) / 2;
  const halfZ = (studsZ * STUD_PITCH) / 2;
  return {
    partId,
    name,
    category,
    shape,
    studsX,
    studsZ,
    heightLdu,
    hasTopStuds,
    hasBottomAntiStuds,
    meta,
    snaps,
    boundsMin: [-halfX, -heightLdu, -halfZ],
    boundsMax: [halfX, hasTopStuds ? 4 : 0, halfZ],
  };
}

function makeBarPart(partId: string, name: string, studsLength: number): PartDefinition {
  const lengthLdu = studsLength * STUD_PITCH;
  const halfY = lengthLdu / 2;
  // Bar extends along Y by default in LDraw (vertical lightsaber/rod), centered around Y=0.. -length or symmetric
  // In LDraw 30374 (Bar 4L), bar is centered along Y from -40 to +40.
  const snaps: SnapPoint[] = [];
  const sampleCount = Math.max(3, studsLength * 2 + 1);
  for (let i = 0; i < sampleCount; i++) {
    const y = -halfY + (lengthLdu * i) / (sampleCount - 1);
    snaps.push({ kind: 'bar', position: [0, y, 0], normal: [0, 1, 0], radius: 4, length: lengthLdu });
  }
  return {
    partId,
    name,
    category: 'Bar & Rod',
    shape: 'bar',
    studsX: 0.4,
    studsZ: 0.4,
    heightLdu: lengthLdu,
    hasTopStuds: false,
    hasBottomAntiStuds: false,
    meta: { barAxis: 'y', barLengthLdu: lengthLdu },
    snaps,
    boundsMin: [-4, -halfY, -4],
    boundsMax: [4, halfY, 4],
  };
}

const CATALOG_LIST: PartDefinition[] = [
  // Standard Bricks
  makeStandardPart('3005', 'Brick 1 x 1', 'Brick', 'brick', 1, 1, 24, true, true),
  makeStandardPart('3004', 'Brick 1 x 2', 'Brick', 'brick', 2, 1, 24, true, true),
  makeStandardPart('3622', 'Brick 1 x 3', 'Brick', 'brick', 3, 1, 24, true, true),
  makeStandardPart('3010', 'Brick 1 x 4', 'Brick', 'brick', 4, 1, 24, true, true),
  makeStandardPart('3009', 'Brick 1 x 6', 'Brick', 'brick', 6, 1, 24, true, true),
  makeStandardPart('3003', 'Brick 2 x 2', 'Brick', 'brick', 2, 2, 24, true, true),
  makeStandardPart('3002', 'Brick 2 x 3', 'Brick', 'brick', 3, 2, 24, true, true),
  makeStandardPart('3001', 'Brick 2 x 4', 'Brick', 'brick', 4, 2, 24, true, true),
  makeStandardPart('2456', 'Brick 2 x 6', 'Brick', 'brick', 6, 2, 24, true, true),
  makeStandardPart('3007', 'Brick 2 x 8', 'Brick', 'brick', 8, 2, 24, true, true),

  // Plates
  makeStandardPart('3024', 'Plate 1 x 1', 'Plate', 'plate', 1, 1, 8, true, true),
  makeStandardPart('3023', 'Plate 1 x 2', 'Plate', 'plate', 2, 1, 8, true, true),
  makeStandardPart('3623', 'Plate 1 x 3', 'Plate', 'plate', 3, 1, 8, true, true),
  makeStandardPart('3710', 'Plate 1 x 4', 'Plate', 'plate', 4, 1, 8, true, true),
  makeStandardPart('3666', 'Plate 1 x 6', 'Plate', 'plate', 6, 1, 8, true, true),
  makeStandardPart('3460', 'Plate 1 x 8', 'Plate', 'plate', 8, 1, 8, true, true),
  makeStandardPart('3022', 'Plate 2 x 2', 'Plate', 'plate', 2, 2, 8, true, true),
  makeStandardPart('3021', 'Plate 2 x 3', 'Plate', 'plate', 3, 2, 8, true, true),
  makeStandardPart('3020', 'Plate 2 x 4', 'Plate', 'plate', 4, 2, 8, true, true),
  makeStandardPart('3795', 'Plate 2 x 6', 'Plate', 'plate', 6, 2, 8, true, true),
  makeStandardPart('3034', 'Plate 2 x 8', 'Plate', 'plate', 8, 2, 8, true, true),
  makeStandardPart('3031', 'Plate 4 x 4', 'Plate', 'plate', 4, 4, 8, true, true),
  makeStandardPart('3032', 'Plate 4 x 6', 'Plate', 'plate', 6, 4, 8, true, true),
  makeStandardPart('3035', 'Plate 4 x 8', 'Plate', 'plate', 8, 4, 8, true, true),
  makeStandardPart('3958', 'Plate 6 x 6', 'Plate', 'plate', 6, 6, 8, true, true),
  makeStandardPart('3036', 'Plate 6 x 8', 'Plate', 'plate', 8, 6, 8, true, true),
  makeStandardPart('3811', 'Baseplate 8 x 8', 'Plate', 'plate', 8, 8, 8, true, true),

  // Tiles
  makeStandardPart('3070b', 'Tile 1 x 1', 'Tile', 'tile', 1, 1, 8, false, true),
  makeStandardPart('3069b', 'Tile 1 x 2', 'Tile', 'tile', 2, 1, 8, false, true),
  makeStandardPart('63864', 'Tile 1 x 3', 'Tile', 'tile', 3, 1, 8, false, true),
  makeStandardPart('2431', 'Tile 1 x 4', 'Tile', 'tile', 4, 1, 8, false, true),
  makeStandardPart('3068b', 'Tile 2 x 2', 'Tile', 'tile', 2, 2, 8, false, true),
  makeStandardPart('87079', 'Tile 2 x 4', 'Tile', 'tile', 4, 2, 8, false, true),
  makeStandardPart('2412b', 'Tile Grille 1 x 2', 'Tile', 'tile', 2, 1, 8, false, true),

  // Slopes & Wedges
  makeStandardPart('54200', 'Cheese Slope 1 x 1', 'Slope', 'slope', 1, 1, 16, false, true, [], { slopeDir: 'px' }),
  makeStandardPart('3040b', 'Slope 45° 2 x 1', 'Slope', 'slope', 2, 1, 24, true, true, [], { slopeDir: 'px', topStudsX: 1 }),
  makeStandardPart('3039', 'Slope 45° 2 x 2', 'Slope', 'slope', 2, 2, 24, true, true, [], { slopeDir: 'px', topStudsX: 1 }),
  makeStandardPart('3037', 'Slope 45° 2 x 4', 'Slope', 'slope', 2, 4, 24, true, true, [], { slopeDir: 'px', topStudsX: 1 }),
  makeStandardPart('3665', 'Slope Inverted 45° 2 x 1', 'Slope', 'inverted_slope', 2, 1, 24, true, true, [], { slopeDir: 'px' }),
  makeStandardPart('41769', 'Wedge Plate 4 x 2 Right', 'Wedge', 'wedge_plate', 4, 2, 8, true, true),
  makeStandardPart('41770', 'Wedge Plate 4 x 2 Left', 'Wedge', 'wedge_plate', 4, 2, 8, true, true),
  makeStandardPart('24299', 'Wedge Plate 2 x 2 Left', 'Wedge', 'wedge_plate', 2, 2, 8, true, true),
  makeStandardPart('24307', 'Wedge Plate 2 x 2 Right', 'Wedge', 'wedge_plate', 2, 2, 8, true, true),
  makeStandardPart('50950', 'Curved Slope 3 x 1', 'Slope', 'slope', 3, 1, 16, false, true, [], { slopeDir: 'px' }),

  // Round & Cones
  makeStandardPart('3062b', 'Round Brick 1 x 1', 'Round', 'round_brick', 1, 1, 24, true, true, [
    { kind: 'bar', position: [0, -12, 0], normal: [0, 1, 0], radius: 4 },
  ]),
  makeStandardPart('4073', 'Round Plate 1 x 1', 'Round', 'round_plate', 1, 1, 8, true, true),
  makeStandardPart('3941', 'Round Brick 2 x 2', 'Round', 'round_brick', 2, 2, 24, true, true),
  makeStandardPart('4589b', 'Cone 1 x 1', 'Round', 'cone', 1, 1, 24, true, true),

  // SNOT Bricks & Brackets (Multi-directional!)
  makeStandardPart(
    '87087',
    'Brick 1 x 1 with Stud on 1 Side',
    'SNOT',
    'snot_brick',
    1,
    1,
    24,
    true,
    true,
    [{ kind: 'side_stud', position: [10, -12, 0], normal: [1, 0, 0] }],
    { snotFaces: ['px'] },
  ),
  makeStandardPart(
    '4733',
    'Brick 1 x 1 with Studs on 4 Sides',
    'SNOT',
    'snot_brick',
    1,
    1,
    24,
    true,
    true,
    [
      { kind: 'side_stud', position: [10, -12, 0], normal: [1, 0, 0] },
      { kind: 'side_stud', position: [-10, -12, 0], normal: [-1, 0, 0] },
      { kind: 'side_stud', position: [0, -12, 10], normal: [0, 0, 1] },
      { kind: 'side_stud', position: [0, -12, -10], normal: [0, 0, -1] },
    ],
    { snotFaces: ['px', 'nx', 'pz', 'nz'] },
  ),
  makeStandardPart(
    '4070',
    'Headlight Brick 1 x 1',
    'SNOT',
    'snot_brick',
    1,
    1,
    24,
    true,
    true,
    [{ kind: 'side_stud', position: [10, -12, 0], normal: [1, 0, 0] }],
    { snotFaces: ['px'] },
  ),
  makeStandardPart(
    '99780',
    'Bracket 1 x 2 - 1 x 2 Inverted',
    'SNOT',
    'snot_bracket',
    2,
    1,
    8,
    true,
    true,
    [
      { kind: 'side_stud', position: [-10, -12, 12], normal: [0, 0, 1] },
      { kind: 'side_stud', position: [10, -12, 12], normal: [0, 0, 1] },
    ],
    { snotFaces: ['pz'] },
  ),
  makeStandardPart(
    '99781',
    'Bracket 1 x 2 - 1 x 2 Up',
    'SNOT',
    'snot_bracket',
    2,
    1,
    8,
    true,
    true,
    [
      { kind: 'side_stud', position: [-10, 12, 12], normal: [0, 0, 1] },
      { kind: 'side_stud', position: [10, 12, 12], normal: [0, 0, 1] },
    ],
    { snotFaces: ['pz'] },
  ),

  // Bars, Rods & Clips (Non-brick structures!)
  makeBarPart('30374', 'Bar 4L (Lightsaber Blade / Rod)', 4),
  makeBarPart('63965', 'Bar 6L with Stop Ring', 6),
  makeBarPart('87994', 'Bar 3L', 3),
  makeStandardPart(
    '6019',
    'Plate 1 x 1 with Horizontal Clip',
    'Clip & Bar',
    'clip_plate',
    1,
    1,
    8,
    true,
    true,
    [{ kind: 'clip', position: [16, -4, 0], normal: [1, 0, 0], radius: 4 }],
    { clipSide: 'px' },
  ),
  makeStandardPart(
    '4085d',
    'Plate 1 x 1 with Vertical Clip',
    'Clip & Bar',
    'clip_plate',
    1,
    1,
    8,
    true,
    true,
    [{ kind: 'clip', position: [0, 8, 0], normal: [0, 1, 0], radius: 4 }],
    { clipSide: 'py' },
  ),
  makeStandardPart(
    '48336',
    'Plate 1 x 2 with Handle Bar on Side',
    'Clip & Bar',
    'bar_plate',
    2,
    1,
    8,
    true,
    true,
    [
      { kind: 'bar', position: [-8, -4, 16], normal: [1, 0, 0], radius: 4, length: 24 },
      { kind: 'bar', position: [0, -4, 16], normal: [1, 0, 0], radius: 4, length: 24 },
      { kind: 'bar', position: [8, -4, 16], normal: [1, 0, 0], radius: 4, length: 24 },
    ],
    { clipSide: 'pz' },
  ),
  makeStandardPart(
    '60470b',
    'Plate 1 x 2 with 2 Clips Horizontal',
    'Clip & Bar',
    'clip_plate',
    2,
    1,
    8,
    true,
    true,
    [
      { kind: 'clip', position: [-10, -4, 16], normal: [0, 0, 1], radius: 4 },
      { kind: 'clip', position: [10, -4, 16], normal: [0, 0, 1], radius: 4 },
    ],
    { clipSide: 'pz' },
  ),
  makeStandardPart(
    '48729b',
    'Bar Holder with Clip',
    'Clip & Bar',
    'clip_plate',
    1,
    1,
    8,
    false,
    false,
    [
      { kind: 'bar', position: [-10, 0, 0], normal: [-1, 0, 0], radius: 4 },
      { kind: 'clip', position: [10, 0, 0], normal: [1, 0, 0], radius: 4 },
    ],
    { clipSide: 'px' },
  ),

  // Technic, Hinges, Canopy, Wheels
  makeStandardPart(
    '3700',
    'Technic Brick 1 x 2 with Pin Hole',
    'Technic',
    'technic_brick',
    2,
    1,
    24,
    true,
    true,
    [
      { kind: 'pin_hole', position: [0, -14, 10], normal: [0, 0, 1] },
      { kind: 'pin_hole', position: [0, -14, -10], normal: [0, 0, -1] },
    ],
  ),
  makeStandardPart(
    '2780',
    'Technic Pin with Friction Ridges',
    'Technic',
    'technic_pin',
    1,
    1,
    16,
    false,
    false,
    [
      { kind: 'pin', position: [0, 0, 10], normal: [0, 0, 1] },
      { kind: 'pin', position: [0, 0, -10], normal: [0, 0, -1] },
    ],
  ),
  makeStandardPart(
    '3937',
    'Hinge Brick 1 x 2 Base',
    'Hinge',
    'hinge_plate',
    2,
    1,
    16,
    false,
    true,
    [{ kind: 'hinge', position: [0, 0, 0], normal: [0, 1, 0] }],
  ),
  makeStandardPart(
    '3938',
    'Hinge Brick 1 x 2 Top Plate',
    'Hinge',
    'hinge_plate',
    2,
    1,
    8,
    true,
    false,
    [{ kind: 'hinge', position: [0, -8, 0], normal: [0, -1, 0] }],
  ),
  makeStandardPart(
    '30383',
    'Hinge Plate 1 x 2 Locking',
    'Hinge',
    'hinge_plate',
    2,
    1,
    8,
    true,
    true,
    [{ kind: 'hinge', position: [0, -4, 12], normal: [0, 0, 1] }],
  ),
  makeStandardPart('45705', 'Windscreen Canopy 4 x 2', 'Vehicle', 'canopy', 4, 2, 24, false, true),
  makeStandardPart(
    '50945',
    'Tire & Wheel 14mm',
    'Vehicle',
    'wheel',
    1,
    1,
    24,
    false,
    false,
    [
      { kind: 'pin_hole', position: [0, -12, 10], normal: [0, 0, 1] },
      { kind: 'pin_hole', position: [0, -12, -10], normal: [0, 0, -1] },
      { kind: 'anti_stud', position: [0, -12, 0], normal: [0, 0, 1] },
    ],
  ),

  // Minifigure parts (separate chapter demo!)
  makeStandardPart(
    '3815',
    'Minifigure Legs Assembly',
    'Minifigure',
    'minifig_legs',
    2,
    1,
    28,
    true,
    true,
  ),
  makeStandardPart(
    '973',
    'Minifigure Torso with Arms',
    'Minifigure',
    'minifig_torso',
    2,
    1,
    28,
    false,
    true,
    [
      { kind: 'stud', position: [0, 0, 0], normal: [0, 1, 0] },
      { kind: 'clip', position: [-22, -18, 6], normal: [0, 0, 1], radius: 4 },
      { kind: 'clip', position: [22, -18, 6], normal: [0, 0, 1], radius: 4 },
    ],
  ),
  makeStandardPart(
    '3626b',
    'Minifigure Head',
    'Minifigure',
    'minifig_head',
    1,
    1,
    22,
    true,
    true,
  ),
  makeStandardPart(
    '2446',
    'Minifigure Pilot Helmet',
    'Minifigure',
    'minifig_helmet',
    1,
    1,
    24,
    false,
    true,
  ),
];

export const PART_CATALOG: Record<string, PartDefinition> = Object.fromEntries(
  CATALOG_LIST.map((p) => [p.partId.toLowerCase(), p]),
);

export function normalizePartId(raw: string): string {
  return raw
    .trim()
    .replace(/\\/g, '/')
    .split('/')
    .pop()!
    .replace(/\.(dat|ldr|mpd)$/i, '')
    .toLowerCase();
}

/**
 * Resolves a part definition from the built-in catalog, or synthesizes an intelligent
 * parametric fallback for unknown LDraw part IDs (never crashes or leaves invisible parts).
 */
export function resolvePartDefinition(rawPartId: string): PartDefinition {
  const id = normalizePartId(rawPartId);
  const direct = PART_CATALOG[id];
  if (direct) return direct;

  // Strip common suffix letters (e.g. 3069b -> 3069, 3040p01 -> 3040)
  const baseNumeric = id.replace(/[a-z].*$/, '');
  for (const [key, def] of Object.entries(PART_CATALOG)) {
    if (key.replace(/[a-z].*$/, '') === baseNumeric && baseNumeric.length >= 3) {
      return { ...def, partId: id };
    }
  }

  // Synthesize smart fallback 1x2 brick so unknown parts remain connectable and renderable
  return makeStandardPart(
    id,
    `Part ${id.toUpperCase()}`,
    'Custom',
    'brick',
    1,
    1,
    24,
    true,
    true,
  );
}
