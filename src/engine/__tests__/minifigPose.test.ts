import { describe, expect, it } from 'vitest';
import {
  LDU_TO_MM,
  MM_PER_INCH,
  R_IDENTITY,
  computeMinifigOneToOneLayout,
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
