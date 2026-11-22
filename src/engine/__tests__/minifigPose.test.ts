import { describe, expect, it } from 'vitest';
import {
  LDU_TO_MM,
  MM_PER_INCH,
  R_IDENTITY,
  classifyMinifigGroupKind,
  computeMinifigOneToOneLayout,
  extractMinifigureGroups,
  isNonMinifigPart,
  mat3AngleDeg,
  mat3Col,
  mat3Multiply,
  mat3Orthonormalize,
  mat3Vec,
  normalizeCompositeThumbPart,
  normalizeMinifigureForBuild,
  type Mat3,
  type RuntimePart,
  type WorldBox,
} from '../minifigPose';

function rotX(deg: number): Mat3 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [1, 0, 0, 0, c, -s, 0, s, c];
}

function rotY(deg: number): Mat3 {
  const r = (deg * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

function simpleBox(part: RuntimePart): WorldBox {
  if (part.children && part.children.length > 0) {
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const ch of part.children) {
      const b = simpleBox(ch);
      for (let k = 0; k < 3; k++) {
        if (b.min[k] < min[k]) min[k] = b.min[k];
        if (b.max[k] > max[k]) max[k] = b.max[k];
      }
    }
    return {
      min,
      max,
      center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
    };
  }
  const m = part.m || R_IDENTITY;
  const half = part.p === '3820' ? [4, 4, 5] : part.p === '3816' || part.p === '3817' ? [10, 16, 8] : [12, 16, 8];
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const v = mat3Vec(m, sx * half[0], sy * half[1], sz * half[2]);
        const wx = part.x + v[0];
        const wy = part.y + v[1];
        const wz = part.z + v[2];
        if (wx < min[0]) min[0] = wx;
        if (wy < min[1]) min[1] = wy;
        if (wz < min[2]) min[2] = wz;
        if (wx > max[0]) max[0] = wx;
        if (wy > max[1]) max[1] = wy;
        if (wz > max[2]) max[2] = wz;
      }
    }
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

const NAMES: Record<string, string> = {
  asm_970c00_0: 'Minifigure Hips & Legs',
  '3815': 'Minifigure Hips',
  '3816': 'Minifigure Leg (Right)',
  '3817': 'Minifigure Leg (Left)',
  asm_973c01_26: 'Minifigure Torso Assembly',
  '973': 'Minifigure Torso',
  '3818': 'Minifigure Arm (Right)',
  '3819': 'Minifigure Arm (Left)',
  '3820': 'Minifigure Hand',
  '3626c': 'Minifigure Head',
  '21778': 'Minifigure Hair',
  '3899': 'Minifigure Mug',
};

const resolveName = (pid: string) => NAMES[pid] || pid;

// Official LDraw neutral arm matrices in GL coordinates (9.9 deg outward tilt)
const ARM_R_NEUTRAL: Mat3 = [0.985, -0.172, 0, 0.172, 0.985, 0, 0, 0, 1];
const ARM_L_NEUTRAL: Mat3 = [0.985, 0.172, 0, -0.172, 0.985, 0, 0, 0, 1];

describe('Minifigure Standing Normalization & 1:1 Scale', () => {
  it('stands up a seated, backward-facing minifigure to face +Z while preserving posed preview for placement', () => {
    const worldRot = rotY(180); // facing away from camera (-Z)
    const legSeatedM = mat3Multiply(worldRot, rotX(-90));

    const worldParts: RuntimePart[] = [
      {
        id: 'legs_asm',
        p: 'asm_970c00_0',
        c: 0,
        x: 120,
        y: 32,
        z: -60,
        m: R_IDENTITY,
        children: [
          { id: 'hips', p: '3815', c: 0, x: 120, y: 40, z: -60, m: worldRot },
          { id: 'leg_r', p: '3816', c: 0, x: 120, y: 28, z: -60, m: legSeatedM },
          { id: 'leg_l', p: '3817', c: 0, x: 120, y: 28, z: -60, m: legSeatedM },
        ],
      },
      {
        id: 'torso_asm',
        p: 'asm_973c01_26',
        c: 26,
        x: 120,
        y: 72,
        z: -60,
        m: R_IDENTITY,
        children: [
          { id: 'torso', p: '973', c: 26, x: 120, y: 72, z: -60, m: worldRot },
          {
            id: 'arm_r',
            p: '3818',
            c: 26,
            x: 120 + mat3Vec(worldRot, -15.552, -8, 0)[0],
            y: 72 - 8,
            z: -60,
            m: mat3Multiply(worldRot, ARM_R_NEUTRAL),
          },
          {
            id: 'arm_l',
            p: '3819',
            c: 26,
            x: 120 + mat3Vec(worldRot, 15.552, -8, 0)[0],
            y: 72 - 8,
            z: -60,
            m: mat3Multiply(worldRot, ARM_L_NEUTRAL),
          },
        ],
      },
      { id: 'head', p: '3626c', c: 14, x: 120, y: 96, z: -60, m: worldRot },
      { id: 'hair', p: '21778', c: 0, x: 120, y: 96, z: -60, m: worldRot },
    ];

    const res = normalizeMinifigureForBuild(worldParts, resolveName, simpleBox, 'mf1');

    // Every canonical body part is upright and facing +Z (identity rotation)
    const canonLegs = res.canonicalParts[0].children!;
    const canonTorso = res.canonicalParts[1].children![0];
    const canonHead = res.canonicalParts[2];
    const canonHair = res.canonicalParts[3];

    expect(mat3AngleDeg(mat3Orthonormalize(canonTorso.m), R_IDENTITY)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(canonLegs[0].m), R_IDENTITY)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(canonLegs[1].m), R_IDENTITY)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(canonLegs[2].m), R_IDENTITY)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(canonHead.m), R_IDENTITY)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(canonHair.m), R_IDENTITY)).toBeLessThan(0.5);

    // Standing torso front vector points directly toward +Z (camera)
    expect(mat3Col(canonTorso.m!, 2)[2]).toBeCloseTo(1, 3);
    // Standing minifigure bottom rests at Y = 0
    const b = simpleBox({ id: 'grp', p: 'grp', c: 0, x: 0, y: 0, z: 0, children: res.canonicalParts });
    expect(b.min[1]).toBeCloseTo(0, 2);

    // Pose summary accurately detects seated legs + 180-deg rotation
    expect(res.poseSummary.legsBent).toBe(true);
    expect(res.poseSummary.legsPosedDeg).toBeCloseTo(90, 0);
    expect(res.poseSummary.bodyRotated).toBe(true);
    expect(res.needsTransform).toBe(true);
    expect(res.transformLabel).toBe('Sit legs & rotate');

    // Posed preview preserves exact seated leg orientation and backward facing for pre-placement step
    const posedLegR = res.posedPreviewParts[0].children![1];
    expect(mat3AngleDeg(mat3Orthonormalize(posedLegR.m), mat3Orthonormalize(legSeatedM))).toBeLessThan(0.5);
  });

  it('un-poses raised arm together with attached hand and handheld mug rigidly', () => {
    // Left arm raised forward 65 deg around its shoulder pin, with hand + mug attached
    const armRaise = rotX(65);
    const armLPosedM = mat3Multiply(ARM_L_NEUTRAL, armRaise);
    const shoulderPos: [number, number, number] = [15.552, -8, 0];
    const wristOffsetLocal: [number, number, number] = [5, -19, 10];
    const wristDeltaPosed = mat3Vec(armLPosedM, ...wristOffsetLocal);
    const handPosPosed: [number, number, number] = [
      shoulderPos[0] + wristDeltaPosed[0],
      shoulderPos[1] + wristDeltaPosed[1],
      shoulderPos[2] + wristDeltaPosed[2],
    ];
    const mugDeltaPosed = mat3Vec(armLPosedM, 5, -19, 16);
    const mugPosPosed: [number, number, number] = [
      shoulderPos[0] + mugDeltaPosed[0],
      shoulderPos[1] + mugDeltaPosed[1],
      shoulderPos[2] + mugDeltaPosed[2],
    ];

    const worldParts: RuntimePart[] = [
      {
        id: 'torso_asm',
        p: 'asm_973c01_26',
        c: 26,
        x: 0,
        y: 0,
        z: 0,
        m: R_IDENTITY,
        children: [
          { id: 'torso', p: '973', c: 26, x: 0, y: 0, z: 0, m: R_IDENTITY },
          { id: 'arm_l', p: '3819', c: 26, x: shoulderPos[0], y: shoulderPos[1], z: shoulderPos[2], m: armLPosedM },
          { id: 'hand_l', p: '3820', c: 14, x: handPosPosed[0], y: handPosPosed[1], z: handPosPosed[2], m: armLPosedM },
        ],
      },
      { id: 'mug', p: '3899', c: 4, x: mugPosPosed[0], y: mugPosPosed[1], z: mugPosPosed[2], m: armLPosedM },
    ];

    const res = normalizeMinifigureForBuild(worldParts, resolveName, simpleBox, 'mf2');
    const canonTorso = res.canonicalParts[0].children![0];
    const canonArmL = res.canonicalParts[0].children![1];
    const canonHandL = res.canonicalParts[0].children![2];
    const canonMug = res.canonicalParts[1];

    // Arm rotated cleanly back to neutral hanging pose
    expect(mat3AngleDeg(mat3Orthonormalize(canonArmL.m), mat3Orthonormalize(ARM_L_NEUTRAL))).toBeLessThan(0.5);
    expect(res.poseSummary.armsMoved).toBe(true);
    expect(res.poseSummary.armsPosedDeg).toBeCloseTo(65, 0);

    // Hand returned to exact neutral wrist position relative to shoulder!
    const expectedNeutralHand = mat3Vec(ARM_L_NEUTRAL, ...wristOffsetLocal);
    expect(canonHandL.x - canonArmL.x).toBeCloseTo(expectedNeutralHand[0], 1);
    expect(canonHandL.y - canonArmL.y).toBeCloseTo(expectedNeutralHand[1], 1);
    expect(canonHandL.z - canonArmL.z).toBeCloseTo(expectedNeutralHand[2], 1);

    // Handheld mug stayed attached to the hand!
    const expectedNeutralMug = mat3Vec(ARM_L_NEUTRAL, 5, -19, 16);
    expect(canonMug.x - canonArmL.x).toBeCloseTo(expectedNeutralMug[0], 1);
    expect(canonMug.y - canonArmL.y).toBeCloseTo(expectedNeutralMug[1], 1);
    expect(canonMug.z - canonArmL.z).toBeCloseTo(expectedNeutralMug[2], 1);
    expect(canonTorso.m).toBeDefined();
  });

  it('respects 180-deg alternate face flip when headgear faces front, but straightens turned head + headgear together', () => {
    // Case 1: Head and hair both turned 45 deg right -> both straighten to +Z
    const turnedParts: RuntimePart[] = [
      { id: 't', p: '973', c: 1, x: 0, y: 0, z: 0, m: R_IDENTITY },
      { id: 'h', p: '3626c', c: 14, x: 0, y: 24, z: 0, m: rotY(45) },
      { id: 'hr', p: '21778', c: 0, x: 0, y: 24, z: 0, m: rotY(45) },
    ];
    const resTurned = normalizeMinifigureForBuild(turnedParts, resolveName, simpleBox, 'turn');
    expect(resTurned.poseSummary.headTurned).toBe(true);
    expect(mat3AngleDeg(mat3Orthonormalize(resTurned.canonicalParts[1].m), R_IDENTITY)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(resTurned.canonicalParts[2].m), R_IDENTITY)).toBeLessThan(0.5);

    // Case 2: Intentional 180-deg double-sided alternate face (hair faces +Z, head faces 180 deg)
    const altFaceParts: RuntimePart[] = [
      { id: 't', p: '973', c: 1, x: 0, y: 0, z: 0, m: R_IDENTITY },
      { id: 'h', p: '3626c', c: 14, x: 0, y: 24, z: 0, m: rotY(180) },
      { id: 'hr', p: '21778', c: 0, x: 0, y: 24, z: 0, m: R_IDENTITY },
    ];
    const resAlt = normalizeMinifigureForBuild(altFaceParts, resolveName, simpleBox, 'alt');
    expect(resAlt.poseSummary.headTurned).toBe(false);
    expect(mat3AngleDeg(mat3Orthonormalize(resAlt.canonicalParts[1].m), rotY(180))).toBeLessThan(0.5);
  });

  it('normalizes seated backward-facing legs composite into clean standing PLI thumbnail', () => {
    const worldRot = rotY(180);
    const legSeatedM = mat3Multiply(worldRot, rotX(-90));
    const seatedLegsComposite: RuntimePart = {
      id: 'legs_asm',
      p: 'asm_970c00_0',
      c: 0,
      x: 50,
      y: 20,
      z: -30,
      m: R_IDENTITY,
      children: [
        { id: 'hips', p: '3815', c: 0, x: 50, y: 28, z: -30, m: worldRot },
        { id: 'leg_r', p: '3816', c: 0, x: 50, y: 16, z: -30, m: legSeatedM },
        { id: 'leg_l', p: '3817', c: 0, x: 50, y: 16, z: -30, m: legSeatedM },
      ],
    };

    const thumb = normalizeCompositeThumbPart(seatedLegsComposite, resolveName, simpleBox);
    expect(thumb.children).toHaveLength(3);
    for (const ch of thumb.children!) {
      expect(mat3AngleDeg(mat3Orthonormalize(ch.m), R_IDENTITY)).toBeLessThan(0.5);
    }
  });

  it('computes exact 1:1 physical page scale (0.4 mm / LDU) and clamps cleanly on tiny slots', () => {
    // Standard 100 LDU (40.0 mm) minifigure on US Letter Landscape (8.5 in tall) rendered at 850 px tall
    const pageHIn = 8.5;
    const pagePxH = 850;
    const layout = computeMinifigOneToOneLayout({ widthLdu: 40, heightLdu: 100 }, pagePxH, pageHIn, 400, 500);

    expect(layout.heightMm).toBeCloseTo(100 * LDU_TO_MM, 5); // 40.0 mm
    expect(layout.isExact).toBe(true);
    expect(layout.fitScale).toBe(1);

    // Exact physical check: heightMm / (pageHIn * 25.4) of the page height
    const pxPerMm = pagePxH / (pageHIn * MM_PER_INCH);
    const expectedFigurePxH = 40 * pxPerMm;
    const renderedFigurePxH = (100 / layout.worldSpanH) * layout.displayPxH;
    expect(Math.abs(renderedFigurePxH - expectedFigurePxH)).toBeLessThan(1.0);

    // Tiny slot clamps cleanly without clipping and marks isExact = false
    const tight = computeMinifigOneToOneLayout({ widthLdu: 40, heightLdu: 100 }, pagePxH, pageHIn, 40, 60);
    expect(tight.isExact).toBe(false);
    expect(tight.displayPxH).toBeLessThanOrEqual(60);
    expect(tight.displayPxW).toBeLessThanOrEqual(40);
  });
});

describe('Minifigure Group Extraction & Chair/Furniture Exclusion', () => {
  const customBox = (
    part: RuntimePart,
    overrides: Record<string, [number, number, number]> = {},
  ): WorldBox => {
    const half = overrides[part.id];
    if (!half) return simpleBox(part);
    const min: [number, number, number] = [part.x - half[0], part.y - half[1], part.z - half[2]];
    const max: [number, number, number] = [part.x + half[0], part.y + half[1], part.z + half[2]];
    return {
      min,
      max,
      center: [part.x, part.y, part.z],
    };
  };

  it('rejects LEGO chairs/seats (4079, 4598, armchairs) and structural bricks while preserving minifigure parts', () => {
    // Chairs & seats must NEVER classify as minifigure parts even when named "Minifigure Seat" or "Minifigure, Utensil Seat"
    expect(isNonMinifigPart('4079', 'Minifigure Seat 2×2')).toBe(true);
    expect(isNonMinifigPart('4079b', 'Minifig Seat 2 x 2 with Two Studs on Back')).toBe(true);
    expect(isNonMinifigPart('bl_4079', 'Minifigure, Utensil Seat / Chair 2 x 2')).toBe(true);
    expect(isNonMinifigPart('4079', '')).toBe(true);
    expect(isNonMinifigPart('4598', 'Space Seat 3 x 2')).toBe(true);
    expect(isNonMinifigPart('99999', 'Armchair')).toBe(true);
    expect(isNonMinifigPart('3829', 'Car Steering Stand and Wheel')).toBe(true);
    expect(isNonMinifigPart('3022', 'Plate 2 x 2')).toBe(true);
    expect(isNonMinifigPart('4070', 'Brick 1 x 1 with Headlight')).toBe(true);

    expect(
      classifyMinifigGroupKind(
        { id: 'c1', p: '4079', c: 1, x: 0, y: 0, z: 0 },
        () => 'Minifigure, Utensil Seat / Chair 2 x 2',
      ),
    ).toBeNull();

    // Genuine minifigure parts keep their classification even with vehicle/furniture print descriptions
    expect(isNonMinifigPart('973p12', 'Minifig Torso with Train Seat Pattern')).toBe(false);
    expect(
      classifyMinifigGroupKind(
        { id: 't1', p: '973p12', c: 4, x: 0, y: 0, z: 0 },
        () => 'Minifig Torso with Train Seat Pattern',
      ),
    ).toBe('torso');
    expect(isNonMinifigPart('2446', 'Minifig Helmet Motorcycle')).toBe(false);
    expect(
      classifyMinifigGroupKind(
        { id: 'hm1', p: '2446', c: 15, x: 0, y: 0, z: 0 },
        () => 'Minifig Helmet Motorcycle',
      ),
    ).toBe('headgear');
    expect(
      classifyMinifigGroupKind(
        { id: 'hp1', p: '93555', c: 15, x: 0, y: 0, z: 0 },
        () => 'Minifigure, Neckwear Headphones',
      ),
    ).toBe('headgear');
  });

  it('excludes chairs (4079) from explicit seated-passenger submodels while keeping hair and headphones', () => {
    const legSeatedM = rotX(-90);
    const subA = [{ name: 'Passenger 1', instId: 101 }];
    const subB = [{ name: 'Passenger 2', instId: 102 }];

    const parts: RuntimePart[] = [
      // Passenger 1 (like Step 6): seated legs, torso, head, BLUE chair 4079, unrecognized-ID curly hair
      {
        id: 'p1_legs',
        p: 'asm_970c00_1',
        c: 1,
        x: 0,
        y: 28,
        z: 0,
        m: R_IDENTITY,
        subChain: subA,
        children: [
          { id: 'p1_hips', p: '3815', c: 1, x: 0, y: 40, z: 0, m: R_IDENTITY },
          { id: 'p1_leg_r', p: '3816', c: 1, x: -10, y: 28, z: 0, m: legSeatedM },
          { id: 'p1_leg_l', p: '3817', c: 1, x: 10, y: 28, z: 0, m: legSeatedM },
        ],
      },
      {
        id: 'p1_torso',
        p: 'asm_973c01_72',
        c: 72,
        x: 0,
        y: 72,
        z: 0,
        m: R_IDENTITY,
        subChain: subA,
        children: [{ id: 'p1_torso_b', p: '973', c: 72, x: 0, y: 72, z: 0, m: R_IDENTITY }],
      },
      { id: 'p1_head', p: '3626c', c: 14, x: 0, y: 96, z: 0, m: R_IDENTITY, subChain: subA },
      { id: 'p1_chair', p: '4079b', c: 1, x: 0, y: 26, z: 0, m: R_IDENTITY, subChain: subA },
      { id: 'p1_hair_unknown', p: '99881', c: 0, x: 0, y: 106, z: 0, m: R_IDENTITY, subChain: subA },

      // Passenger 2 (like Step 7): seated legs, torso, head, RED chair 4079, headphones, hair
      {
        id: 'p2_legs',
        p: 'asm_970c00_308',
        c: 308,
        x: 200,
        y: 28,
        z: 0,
        m: R_IDENTITY,
        subChain: subB,
        children: [
          { id: 'p2_hips', p: '3815', c: 308, x: 200, y: 40, z: 0, m: R_IDENTITY },
          { id: 'p2_leg_r', p: '3816', c: 308, x: 190, y: 28, z: 0, m: legSeatedM },
          { id: 'p2_leg_l', p: '3817', c: 308, x: 210, y: 28, z: 0, m: legSeatedM },
        ],
      },
      {
        id: 'p2_torso',
        p: 'asm_973c01_320',
        c: 320,
        x: 200,
        y: 72,
        z: 0,
        m: R_IDENTITY,
        subChain: subB,
        children: [{ id: 'p2_torso_b', p: '973', c: 320, x: 200, y: 72, z: 0, m: R_IDENTITY }],
      },
      { id: 'p2_head', p: '3626c', c: 14, x: 200, y: 96, z: 0, m: R_IDENTITY, subChain: subB },
      { id: 'p2_chair', p: '4079', c: 4, x: 200, y: 26, z: 0, m: R_IDENTITY, subChain: subB },
      { id: 'p2_headphones', p: '93555', c: 15, x: 200, y: 84, z: 0, m: R_IDENTITY, subChain: subB },
      { id: 'p2_hair', p: '21778', c: 308, x: 200, y: 106, z: 0, m: R_IDENTITY, subChain: subB },
    ];

    const extraNames: Record<string, string> = {
      ...NAMES,
      asm_970c00_1: 'Minifigure Hips & Legs',
      asm_973c01_72: 'Minifigure Torso Assembly',
      asm_970c00_308: 'Minifigure Hips & Legs',
      asm_973c01_320: 'Minifigure Torso Assembly',
      '4079': 'Minifigure Seat 2×2',
      '4079b': 'Minifig Seat 2 x 2 with Two Studs on Back',
      '93555': 'Minifigure Headphones',
      '99881': '99881', // Unrecognized hair mold with bare numeric title
    };
    const resName = (pid: string) => extraNames[pid] || pid;
    const boxOverrides: Record<string, [number, number, number]> = {
      p1_chair: [20, 22, 20],
      p2_chair: [20, 22, 20],
      p1_hair_unknown: [13, 14, 13],
      p2_headphones: [14, 10, 12],
    };
    const boxes = parts.map((p) => customBox(p, boxOverrides));

    const { groups, claimed } = extractMinifigureGroups(parts, boxes, resName);

    expect(groups).toHaveLength(2);
    const ids0 = groups[0].indices.map((i) => parts[i].id);
    const ids1 = groups[1].indices.map((i) => parts[i].id);

    // Neither minifigure group contains its chair!
    expect(ids0).toEqual(['p1_legs', 'p1_torso', 'p1_head', 'p1_hair_unknown']);
    expect(ids1).toEqual(['p2_legs', 'p2_torso', 'p2_head', 'p2_headphones', 'p2_hair']);

    // Both chairs remain unclaimed so they stay in the main model and are built before placing the seated figures
    expect(claimed[3]).toBe(0); // p1_chair
    expect(claimed[8]).toBe(0); // p2_chair

    // Standing normalization on Passenger 1 has no chair and cleanly straightens the seated legs
    const norm1 = normalizeMinifigureForBuild(
      groups[0].indices.map((i) => parts[i]),
      resName,
      (p) => customBox(p, boxOverrides),
      'mf1',
    );
    expect(norm1.canonicalParts.map((p) => p.p)).not.toContain('4079b');
    expect(norm1.poseSummary.legsBent).toBe(true);
    expect(norm1.transformLabel).toBe('Sit legs');
  });

  it('geometrically excludes an unknown custom seat sitting beneath seated hips inside a submodel', () => {
    const legSeatedM = rotX(-90);
    const sub = [{ name: 'Driver Seat', instId: 201 }];
    const parts: RuntimePart[] = [
      { id: 'legs', p: '970c00', c: 1, x: 0, y: 32, z: 0, m: legSeatedM, subChain: sub },
      { id: 'torso', p: '973', c: 4, x: 0, y: 72, z: 0, m: R_IDENTITY, subChain: sub },
      { id: 'head', p: '3626c', c: 14, x: 0, y: 96, z: 0, m: R_IDENTITY, subChain: sub },
      // Completely unknown ID & generic title sitting under hips/legs like a seat
      { id: 'mystery_seat', p: 'bl_custom_777', c: 0, x: 0, y: 24, z: 0, m: R_IDENTITY, subChain: sub },
      // Completely unknown hairpiece sitting on top of the head
      { id: 'mystery_hair', p: 'bl_custom_888', c: 0, x: 0, y: 106, z: 0, m: R_IDENTITY, subChain: sub },
    ];
    const boxOverrides: Record<string, [number, number, number]> = {
      mystery_seat: [20, 22, 20],
      mystery_hair: [13, 14, 13],
    };
    const boxes = parts.map((p) => customBox(p, boxOverrides));

    const { groups, claimed } = extractMinifigureGroups(parts, boxes, (pid) => NAMES[pid] || pid);
    expect(groups).toHaveLength(1);
    const picked = groups[0].indices.map((i) => parts[i].id);
    expect(picked).toContain('mystery_hair');
    expect(picked).not.toContain('mystery_seat');
    expect(claimed[3]).toBe(0);
  });

  it('never grabs a chair in Stage B (flat .ldr) and splits multi-minifig submodels cleanly', () => {
    const legSeatedM = rotX(-90);
    // Two seated passengers + two chairs grouped into ONE 10-part submodel (e.g. a train seating row)
    const rowSub = [{ name: 'Coach Seating Row', instId: 301 }];
    const parts: RuntimePart[] = [
      { id: 'a_legs', p: '970c00', c: 1, x: 0, y: 32, z: 0, m: legSeatedM, subChain: rowSub },
      { id: 'a_torso', p: '973', c: 4, x: 0, y: 72, z: 0, m: R_IDENTITY, subChain: rowSub },
      { id: 'a_head', p: '3626c', c: 14, x: 0, y: 96, z: 0, m: R_IDENTITY, subChain: rowSub },
      { id: 'a_hair', p: '21778', c: 0, x: 0, y: 106, z: 0, m: R_IDENTITY, subChain: rowSub },
      { id: 'a_chair', p: '4079', c: 1, x: 0, y: 24, z: 0, m: R_IDENTITY, subChain: rowSub },

      { id: 'b_legs', p: '970c00', c: 0, x: 100, y: 32, z: 0, m: legSeatedM, subChain: rowSub },
      { id: 'b_torso', p: '973', c: 2, x: 100, y: 72, z: 0, m: R_IDENTITY, subChain: rowSub },
      { id: 'b_head', p: '3626c', c: 14, x: 100, y: 96, z: 0, m: R_IDENTITY, subChain: rowSub },
      { id: 'b_hair', p: '21778', c: 0, x: 100, y: 106, z: 0, m: R_IDENTITY, subChain: rowSub },
      { id: 'b_chair', p: '4079', c: 4, x: 100, y: 24, z: 0, m: R_IDENTITY, subChain: rowSub },
    ];
    const resName = (pid: string) =>
      pid === '4079' ? 'Minifigure, Utensil Seat / Chair 2 x 2' : NAMES[pid] || pid;
    const boxes = parts.map((p) => customBox(p, { a_chair: [20, 22, 20], b_chair: [20, 22, 20] }));

    const { groups, claimed } = extractMinifigureGroups(parts, boxes, resName);

    // Split cleanly into 2 separate minifigures, zero chairs claimed!
    expect(groups).toHaveLength(2);
    expect(groups[0].indices.map((i) => parts[i].id)).toEqual(['a_torso', 'a_legs', 'a_head', 'a_hair']);
    expect(groups[1].indices.map((i) => parts[i].id)).toEqual(['b_torso', 'b_legs', 'b_head', 'b_hair']);
    expect(claimed[4]).toBe(0); // a_chair
    expect(claimed[9]).toBe(0); // b_chair
  });
});

