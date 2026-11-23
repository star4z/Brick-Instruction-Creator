import { describe, expect, it } from 'vitest';
import {
  LDU_TO_MM,
  MM_PER_INCH,
  R_IDENTITY,
  classifyMinifigGroupKind,
  classifyMinifigLeafRole,
  computeMinifigOneToOneLayout,
  extractMinifigureGroups,
  isArmPosingAccessory,
  isNonMinifigPart,
  mat3AngleDeg,
  mat3Col,
  mat3Determinant,
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

  it('classifies BrickLink body IDs (981/982/983, 970/971/972, 3814/76382) without false-matching 5-digit bricks', () => {
    expect(classifyMinifigLeafRole('982', 'Arm, Right')).toBe('arm_r');
    expect(classifyMinifigLeafRole('981', 'Arm, Left')).toBe('arm_l');
    expect(classifyMinifigLeafRole('983', 'Hand')).toBe('hand');
    expect(classifyMinifigLeafRole('971', 'Leg, Right')).toBe('leg_r');
    expect(classifyMinifigLeafRole('972', 'Leg, Left')).toBe('leg_l');
    expect(classifyMinifigLeafRole('970', 'Hips')).toBe('hips');
    expect(classifyMinifigLeafRole('3814', 'Torso Plain')).toBe('torso');
    expect(classifyMinifigLeafRole('76382pfo', 'Minifig Torso')).toBe('torso');
    expect(classifyMinifigLeafRole('61976', 'Minifigure Messenger Bag')).toBe('accessory');
    expect(isArmPosingAccessory('61976', 'Minifigure Messenger Bag')).toBe(true);
    expect(isArmPosingAccessory('93091', 'Minifigure Handbag / Purse')).toBe(true);
    expect(isArmPosingAccessory('3899', 'Minifigure Mug')).toBe(false);

    // Must NOT misclassify 5-digit bricks/tiles/hair starting with 981/982/983
    expect(classifyMinifigLeafRole('98138', 'Tile, Round 1 x 1')).toBe('accessory');
    expect(classifyMinifigLeafRole('98283', 'Brick, Modified 1 x 2 with Masonry Profile')).toBe('accessory');
    expect(classifyMinifigLeafRole('98385', 'Minifigure Hair')).toBe('headgear');
  });

  it('resets BrickLink Studio raised right arm (982/981/983 + custom IDs + off-pin/mirrored) to default position in build step and PLI thumb', () => {
    // Official GL neutral right arm (3818/982): outward tilt at x = -15.552
    const ARM_R_GL: Mat3 = mat3Orthonormalize([0.9854, 0.17, 0, -0.17, 0.9854, 0, 0, 0, 1]);
    const ARM_L_GL: Mat3 = mat3Orthonormalize([0.9854, -0.17, 0, 0.17, 0.9854, 0, 0, 0, 1]);

    // Right arm raised 70 deg forward AND yawed 25 deg off-pin (typical Studio free-rotate)
    const armRPosedM = mat3Multiply(rotY(25), mat3Multiply(ARM_R_GL, rotX(-70)));
    const shoulderR: [number, number, number] = [-15.552, -9, 0];
    const wristOffsetR: [number, number, number] = [-5, -18, 10];
    const handDeltaR = mat3Vec(armRPosedM, ...wristOffsetR);

    const blNames: Record<string, string> = {
      asm_973c27_330: 'Torso Plain / Olive Green Arms / Yellow Hands',
      '3814': 'Torso Plain',
      '982': 'Arm, Right',
      '981': 'Arm, Left',
      '983': 'Hand',
      '3626c': 'Minifigure Head',
    };
    const blResolve = (pid: string) => blNames[pid] || pid;

    const torsoComposite: RuntimePart = {
      id: 'torso_asm',
      p: 'asm_973c27_330',
      c: 330,
      x: 0,
      y: 0,
      z: 0,
      m: R_IDENTITY,
      children: [
        { id: 't', p: '3814', c: 330, x: 0, y: 0, z: 0, m: R_IDENTITY },
        { id: 'ar', p: '982', c: 330, x: shoulderR[0], y: shoulderR[1], z: shoulderR[2], m: armRPosedM },
        { id: 'al', p: '981', c: 330, x: 15.552, y: -9, z: 0, m: ARM_L_GL },
        {
          id: 'hr',
          p: '983',
          c: 14,
          x: shoulderR[0] + handDeltaR[0],
          y: shoulderR[1] + handDeltaR[1],
          z: shoulderR[2] + handDeltaR[2],
          m: armRPosedM,
        },
        { id: 'hl', p: '983', c: 14, x: 23.69, y: -26.77, z: 9.9, m: ARM_L_GL },
      ],
    };

    const res = normalizeMinifigureForBuild(
      [torsoComposite, { id: 'head', p: '3626c', c: 14, x: 0, y: 24, z: 0, m: R_IDENTITY }],
      blResolve,
      simpleBox,
      'bl_mf',
    );
    const canonArmR = res.canonicalParts[0].children![1];
    const canonHandR = res.canonicalParts[0].children![3];
    expect(mat3AngleDeg(mat3Orthonormalize(canonArmR.m), ARM_R_GL)).toBeLessThan(0.5);
    expect(res.poseSummary.armsMoved).toBe(true);
    expect(res.poseSummary.armsPosedDeg).toBeGreaterThan(60);

    // Hand followed the arm cleanly back to the neutral wrist offset
    const expectedHandR = mat3Vec(ARM_R_GL, ...wristOffsetR);
    expect(canonHandR.x - canonArmR.x).toBeCloseTo(expectedHandR[0], 1);
    expect(canonHandR.y - canonArmR.y).toBeCloseTo(expectedHandR[1], 1);
    expect(canonHandR.z - canonArmR.z).toBeCloseTo(expectedHandR[2], 1);

    // PLI thumbnail normalization ALSO returns the torso with default hanging arms
    const thumb = normalizeCompositeThumbPart(torsoComposite, blResolve, simpleBox);
    expect(mat3AngleDeg(mat3Orthonormalize(thumb.children![1].m), ARM_R_GL)).toBeLessThan(0.5);

    // Mirrored arm (det < 0) also un-poses cleanly while preserving negative determinant
    const reflectX: Mat3 = [-1, 0, 0, 0, 1, 0, 0, 0, 1];
    const mirroredPosed = mat3Multiply(mat3Multiply(ARM_L_GL, rotX(60)), reflectX);
    const customTorso: RuntimePart = {
      id: 'custom_torso',
      p: 'asm_973pb999c01_1',
      c: 1,
      x: 0,
      y: 0,
      z: 0,
      m: R_IDENTITY,
      children: [
        { id: 'c_body', p: 'custom_body_x', c: 1, x: 0, y: 0, z: 0, m: R_IDENTITY },
        { id: 'c_arm_l', p: 'custom_arm_x', c: 1, x: 15.552, y: -9, z: 0, m: mirroredPosed },
        { id: 'c_hand_l', p: 'custom_hand_x', c: 14, x: 20, y: -15, z: 18, m: mat3Multiply(ARM_L_GL, rotX(60)) },
      ],
    };
    const customBox = (p: RuntimePart): WorldBox => {
      if (p.children?.length) return simpleBox(p);
      const half = p.p === 'custom_body_x' ? [18, 16, 10] : p.p === 'custom_arm_x' ? [6, 12, 6] : [4, 4, 4];
      return {
        min: [p.x - half[0], p.y - half[1], p.z - half[2]],
        max: [p.x + half[0], p.y + half[1], p.z + half[2]],
        center: [p.x, p.y, p.z],
      };
    };
    const resCustom = normalizeMinifigureForBuild(
      [customTorso],
      (pid) => (pid === 'asm_973pb999c01_1' ? 'Printed Torso Assembly' : pid),
      customBox,
      'cust',
    );
    const canonCustomArm = resCustom.canonicalParts[0].children![1];
    expect(mat3Determinant(canonCustomArm.m!)).toBeLessThan(0);
    expect(mat3AngleDeg(mat3Orthonormalize(mat3Multiply(canonCustomArm.m!, reflectX)), ARM_L_GL)).toBeLessThan(0.5);
  });

  it('keeps an arm posed when holding a purse (93091) while resetting the other empty raised arm to default', () => {
    const ARM_R_GL: Mat3 = mat3Orthonormalize([0.9854, 0.17, 0, -0.17, 0.9854, 0, 0, 0, 1]);
    const ARM_L_GL: Mat3 = mat3Orthonormalize([0.9854, -0.17, 0, 0.17, 0.9854, 0, 0, 0, 1]);

    // Right arm raised 45 deg holding a purse (93091); left arm raised 70 deg empty
    const armRPosed = mat3Multiply(ARM_R_GL, rotX(-45));
    const armLPosed = mat3Multiply(ARM_L_GL, rotX(-70));
    const shR: [number, number, number] = [-15.552, -9, 0];
    const shL: [number, number, number] = [15.552, -9, 0];
    const handRDelta = mat3Vec(armRPosed, -5, -18, 10);
    const handLDelta = mat3Vec(armLPosed, 5, -18, 10);
    const purseDelta = mat3Vec(armRPosed, -6, -24, 14);

    const purseNames: Record<string, string> = {
      ...NAMES,
      '93091': 'Minifigure Handbag / Purse',
    };
    const res = normalizeMinifigureForBuild(
      [
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
            { id: 'arm_r', p: '3818', c: 26, x: shR[0], y: shR[1], z: shR[2], m: armRPosed },
            { id: 'arm_l', p: '3819', c: 26, x: shL[0], y: shL[1], z: shL[2], m: armLPosed },
            { id: 'hand_r', p: '3820', c: 14, x: shR[0] + handRDelta[0], y: shR[1] + handRDelta[1], z: shR[2] + handRDelta[2], m: armRPosed },
            { id: 'hand_l', p: '3820', c: 14, x: shL[0] + handLDelta[0], y: shL[1] + handLDelta[1], z: shL[2] + handLDelta[2], m: armLPosed },
          ],
        },
        {
          id: 'purse',
          p: '93091',
          c: 29,
          x: shR[0] + purseDelta[0],
          y: shR[1] + purseDelta[1],
          z: shR[2] + purseDelta[2],
          m: armRPosed,
        },
      ],
      (pid) => purseNames[pid] || pid,
      simpleBox,
      'purse_fig',
    );

    const canonArmR = res.canonicalParts[0].children![1];
    const canonArmL = res.canonicalParts[0].children![2];
    // Right arm stayed posed at 45 deg for the purse!
    expect(mat3AngleDeg(mat3Orthonormalize(canonArmR.m), armRPosed)).toBeLessThan(0.5);
    // Left arm (no purse) returned to default neutral hanging position!
    expect(mat3AngleDeg(mat3Orthonormalize(canonArmL.m), ARM_L_GL)).toBeLessThan(0.5);
    expect(res.poseSummary.armsMoved).toBe(true);
    expect(res.poseSummary.armsPosedDeg).toBeCloseTo(70, 0);
  });

  it('keeps an arm posed to clear a crossbody satchel/messenger bag (61976) on that hip while resetting the opposite arm', () => {
    const ARM_R_GL: Mat3 = mat3Orthonormalize([0.9854, 0.17, 0, -0.17, 0.9854, 0, 0, 0, 1]);
    const ARM_L_GL: Mat3 = mat3Orthonormalize([0.9854, -0.17, 0, 0.17, 0.9854, 0, 0, 0, 1]);

    const armRPosed = mat3Multiply(ARM_R_GL, rotX(-40));
    const armLPosed = mat3Multiply(ARM_L_GL, rotX(-65));
    const shR: [number, number, number] = [-15.552, -9, 0];
    const shL: [number, number, number] = [15.552, -9, 0];
    const handRDelta = mat3Vec(armRPosed, -5, -18, 10);
    const handLDelta = mat3Vec(armLPosed, 5, -18, 10);

    const satchelBox = (part: RuntimePart): WorldBox => {
      if (part.p === '61976') {
        // Crossbody pouch hanging right against the right hip/side
        return {
          min: [part.x - 6, part.y - 10, part.z - 6],
          max: [part.x + 6, part.y + 10, part.z + 6],
          center: [part.x, part.y, part.z],
        };
      }
      return simpleBox(part);
    };

    const res = normalizeMinifigureForBuild(
      [
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
            { id: 'arm_r', p: '3818', c: 26, x: shR[0], y: shR[1], z: shR[2], m: armRPosed },
            { id: 'arm_l', p: '3819', c: 26, x: shL[0], y: shL[1], z: shL[2], m: armLPosed },
            { id: 'hand_r', p: '3820', c: 14, x: shR[0] + handRDelta[0], y: shR[1] + handRDelta[1], z: shR[2] + handRDelta[2], m: armRPosed },
            { id: 'hand_l', p: '3820', c: 14, x: shL[0] + handLDelta[0], y: shL[1] + handLDelta[1], z: shL[2] + handLDelta[2], m: armLPosed },
          ],
        },
        { id: 'satchel', p: '61976', c: 70, x: -22, y: -24, z: 0, m: R_IDENTITY },
      ],
      (pid) => (pid === '61976' ? 'Minifigure Messenger Bag' : resolveName(pid)),
      satchelBox,
      'satchel_fig',
    );

    const canonArmR = res.canonicalParts[0].children![1];
    const canonArmL = res.canonicalParts[0].children![2];
    expect(mat3AngleDeg(mat3Orthonormalize(canonArmR.m), armRPosed)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(canonArmL.m), ARM_L_GL)).toBeLessThan(0.5);
  });

  it('keeps an arm posed via 3D clearance guard if lowering an unknown bulky accessory would dip below the feet', () => {
    const ARM_L_GL: Mat3 = mat3Orthonormalize([0.9854, -0.17, 0, 0.17, 0.9854, 0, 0, 0, 1]);
    const armLPosed = mat3Multiply(ARM_L_GL, rotX(-55));
    const shL: [number, number, number] = [15.552, -9, 0];
    const handLDelta = mat3Vec(armLPosed, 5, -18, 10);
    const propDelta = mat3Vec(armLPosed, 5, -30, 12);

    const propBox = (part: RuntimePart): WorldBox => {
      if (part.p === 'custom_tall_item') {
        // Tall hanging item (54 LDU tall) whose bottom (~-45) clears feet (-72) when arm is raised,
        // but would dip ~7 LDU below the feet (~-79 < -72) if the arm were lowered to neutral
        const m = part.m || R_IDENTITY;
        const min: [number, number, number] = [Infinity, Infinity, Infinity];
        const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
        for (const sx of [-5, 5]) {
          for (const sy of [-42, 12]) {
            for (const sz of [-5, 5]) {
              const v = mat3Vec(m, sx, sy, sz);
              min[0] = Math.min(min[0], part.x + v[0]);
              min[1] = Math.min(min[1], part.y + v[1]);
              min[2] = Math.min(min[2], part.z + v[2]);
              max[0] = Math.max(max[0], part.x + v[0]);
              max[1] = Math.max(max[1], part.y + v[1]);
              max[2] = Math.max(max[2], part.z + v[2]);
            }
          }
        }
        return { min, max, center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] };
      }
      return simpleBox(part);
    };

    const res = normalizeMinifigureForBuild(
      [
        {
          id: 'legs_asm',
          p: 'asm_970c00_0',
          c: 0,
          x: 0,
          y: -48,
          z: 0,
          m: R_IDENTITY,
          children: [
            { id: 'hips', p: '3815', c: 0, x: 0, y: -32, z: 0, m: R_IDENTITY },
            { id: 'leg_r', p: '3816', c: 0, x: -10, y: -56, z: 0, m: R_IDENTITY },
            { id: 'leg_l', p: '3817', c: 0, x: 10, y: -56, z: 0, m: R_IDENTITY },
          ],
        },
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
            { id: 'arm_l', p: '3819', c: 26, x: shL[0], y: shL[1], z: shL[2], m: armLPosed },
            { id: 'hand_l', p: '3820', c: 14, x: shL[0] + handLDelta[0], y: shL[1] + handLDelta[1], z: shL[2] + handLDelta[2], m: armLPosed },
          ],
        },
        {
          id: 'tall_prop',
          p: 'custom_tall_item',
          c: 4,
          x: shL[0] + propDelta[0],
          y: shL[1] + propDelta[1],
          z: shL[2] + propDelta[2],
          m: armLPosed,
        },
      ],
      resolveName,
      propBox,
      'tall_fig',
    );

    const canonArmL = res.canonicalParts[1].children![1];
    expect(mat3AngleDeg(mat3Orthonormalize(canonArmL.m), armLPosed)).toBeLessThan(0.5);
    expect(res.poseSummary.armsMoved).toBe(false);
  });

  it('keeps both arms posed when holding a shared two-handed accessory', () => {
    const ARM_R_GL: Mat3 = mat3Orthonormalize([0.9854, 0.17, 0, -0.17, 0.9854, 0, 0, 0, 1]);
    const ARM_L_GL: Mat3 = mat3Orthonormalize([0.9854, -0.17, 0, 0.17, 0.9854, 0, 0, 0, 1]);
    const armRPosed = mat3Multiply(ARM_R_GL, rotX(-60));
    const armLPosed = mat3Multiply(ARM_L_GL, rotX(-60));
    const shR: [number, number, number] = [-15.552, -9, 0];
    const shL: [number, number, number] = [15.552, -9, 0];
    const handRDelta = mat3Vec(armRPosed, -5, -18, 10);
    const handLDelta = mat3Vec(armLPosed, 5, -18, 10);

    const barBox = (part: RuntimePart): WorldBox => {
      if (part.p === 'custom_bar') {
        return {
          min: [part.x - 28, part.y - 3, part.z - 3],
          max: [part.x + 28, part.y + 3, part.z + 3],
          center: [part.x, part.y, part.z],
        };
      }
      return simpleBox(part);
    };

    const res = normalizeMinifigureForBuild(
      [
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
            { id: 'arm_r', p: '3818', c: 26, x: shR[0], y: shR[1], z: shR[2], m: armRPosed },
            { id: 'arm_l', p: '3819', c: 26, x: shL[0], y: shL[1], z: shL[2], m: armLPosed },
            { id: 'hand_r', p: '3820', c: 14, x: shR[0] + handRDelta[0], y: shR[1] + handRDelta[1], z: shR[2] + handRDelta[2], m: armRPosed },
            { id: 'hand_l', p: '3820', c: 14, x: shL[0] + handLDelta[0], y: shL[1] + handLDelta[1], z: shL[2] + handLDelta[2], m: armLPosed },
          ],
        },
        {
          id: 'bar',
          p: 'custom_bar',
          c: 72,
          x: 0,
          y: shR[1] + handRDelta[1],
          z: shR[2] + handRDelta[2],
          m: R_IDENTITY,
        },
      ],
      resolveName,
      barBox,
      'two_hand',
    );

    expect(mat3AngleDeg(mat3Orthonormalize(res.canonicalParts[0].children![1].m), armRPosed)).toBeLessThan(0.5);
    expect(mat3AngleDeg(mat3Orthonormalize(res.canonicalParts[0].children![2].m), armLPosed)).toBeLessThan(0.5);
    expect(res.poseSummary.armsMoved).toBe(false);
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

  it('excludes train stanchion/handrail bars (30374 Bar 4L, 63965, 87994, 4095) from standing passengers in Stage A and Stage B', () => {
    // BrickLink Studio names 30374 as "Bar 4L (Lightsaber Blade / Wand)" and 4095 as "Bar 6.6L with Stop Ring (Patio Umbrella Stand)"
    expect(isNonMinifigPart('30374', 'Bar 4L (Lightsaber Blade / Wand)')).toBe(true);
    expect(isNonMinifigPart('4095', 'Bar 6.6L with Stop Ring (Patio Umbrella Stand)')).toBe(true);
    expect(isNonMinifigPart('63965', 'Bar 6L with Stop Ring')).toBe(true);
    expect(isNonMinifigPart('87994', 'Bar 3L (Bar Arrow)')).toBe(true);
    expect(isNonMinifigPart('21462', 'Bar 2L')).toBe(true);
    expect(
      classifyMinifigGroupKind(
        { id: 'bar1', p: '30374', c: 297, x: -22, y: 56, z: 0 },
        () => 'Bar 4L (Lightsaber Blade / Wand)',
      ),
    ).toBeNull();

    // Standing passenger (like BART Minifigure 6) flanked by two vertical pearl-gold 30374 grab bars
    const parts: RuntimePart[] = [
      { id: 'mf_legs', p: '970c00', c: 1, x: 0, y: 20, z: 0, m: R_IDENTITY },
      { id: 'mf_torso', p: '973', c: 72, x: 0, y: 56, z: 0, m: R_IDENTITY },
      { id: 'mf_head', p: '3626c', c: 14, x: 0, y: 86, z: 0, m: R_IDENTITY },
      { id: 'mf_hair', p: '21778', c: 0, x: 0, y: 102, z: 0, m: R_IDENTITY },
      { id: 'rail_l', p: '30374', c: 297, x: -24, y: 56, z: 6, m: R_IDENTITY },
      { id: 'rail_r', p: '30374', c: 297, x: 24, y: 56, z: 6, m: R_IDENTITY },
      { id: 'floor_plate', p: '3022', c: 71, x: 0, y: 0, z: 0, m: R_IDENTITY },
    ];
    const barNames: Record<string, string> = {
      ...NAMES,
      '30374': 'Bar 4L (Lightsaber Blade / Wand)',
      '3022': 'Plate 2 x 2',
    };
    const boxes = parts.map((p) =>
      customBox(p, {
        rail_l: [3, 40, 3],
        rail_r: [3, 40, 3],
        floor_plate: [40, 4, 40],
      }),
    );
    const adjacency: number[][] = [
      [1, 6], // legs
      [0, 2], // torso
      [1, 3], // head
      [2],    // hair
      [6],    // rail_l anchored to floor_plate
      [6],    // rail_r anchored to floor_plate
      [0, 4, 5],
    ];

    const { groups, claimed } = extractMinifigureGroups(parts, boxes, (pid) => barNames[pid] || pid, adjacency);
    expect(groups).toHaveLength(1);
    const ids = groups[0].indices.map((i) => parts[i].id);
    expect(ids).toEqual(['mf_torso', 'mf_legs', 'mf_head', 'mf_hair']);
    expect(claimed[4]).toBe(0); // rail_l stays in train!
    expect(claimed[5]).toBe(0); // rail_r stays in train!

    // Even when grouped inside a single-figure submodel (Stage A), vertical bars and unknown side poles stay in the train
    const sub = [{ name: 'Commuter', instId: 501 }];
    const subParts: RuntimePart[] = [
      { id: 's_legs', p: '970c00', c: 1, x: 0, y: 20, z: 0, m: R_IDENTITY, subChain: sub },
      { id: 's_torso', p: '973', c: 72, x: 0, y: 56, z: 0, m: R_IDENTITY, subChain: sub },
      { id: 's_head', p: '3626c', c: 14, x: 0, y: 86, z: 0, m: R_IDENTITY, subChain: sub },
      { id: 's_hair', p: '21778', c: 0, x: 0, y: 102, z: 0, m: R_IDENTITY, subChain: sub },
      { id: 's_rail', p: '30374', c: 297, x: 22, y: 56, z: 4, m: R_IDENTITY, subChain: sub },
      { id: 's_unknown_pole', p: 'bl_custom_pole', c: 297, x: -20, y: 64, z: 4, m: R_IDENTITY, subChain: sub },
    ];
    const subBoxes = subParts.map((p) =>
      customBox(p, {
        s_rail: [3, 40, 3],
        s_unknown_pole: [3, 28, 3], // 56 LDU tall thin vertical side pole
      }),
    );
    const subRes = extractMinifigureGroups(subParts, subBoxes, (pid) => barNames[pid] || pid);
    expect(subRes.groups).toHaveLength(1);
    expect(subRes.groups[0].indices.map((i) => subParts[i].id)).toEqual(['s_legs', 's_torso', 's_head', 's_hair']);
    expect(subRes.claimed[4]).toBe(0);
    expect(subRes.claimed[5]).toBe(0);
  });

  it('keeps genuine lightsaber blade (30374) attached to a minifigure lightsaber hilt while keeping model-anchored props in the model', () => {
    const parts: RuntimePart[] = [
      {
        id: 'v_legs',
        p: '970c00',
        c: 0,
        x: 0,
        y: 20,
        z: 0,
        m: R_IDENTITY,
      },
      {
        id: 'v_torso',
        p: 'asm_973c01_0',
        c: 0,
        x: 0,
        y: 56,
        z: 0,
        m: R_IDENTITY,
        children: [
          { id: 'v_torso_b', p: '973', c: 0, x: 0, y: 56, z: 0, m: R_IDENTITY },
          { id: 'v_hand_r', p: '3820', c: 0, x: -20, y: 48, z: 10, m: R_IDENTITY },
        ],
      },
      { id: 'v_head', p: '3626c', c: 71, x: 0, y: 86, z: 0, m: R_IDENTITY },
      { id: 'v_hilt', p: '64567', c: 71, x: -20, y: 52, z: 12, m: R_IDENTITY },
      { id: 'v_blade', p: '30374', c: 36, x: -20, y: 98, z: 12, m: R_IDENTITY },
      // A mug sitting on a train table (anchored to table brick, NOT touching minifigure hand)
      { id: 'table_mug', p: '3899', c: 4, x: 28, y: 38, z: 10, m: R_IDENTITY },
      { id: 'train_table', p: '3022', c: 71, x: 28, y: 24, z: 10, m: R_IDENTITY },
    ];
    const extraNames: Record<string, string> = {
      ...NAMES,
      asm_973c01_0: 'Minifigure Torso Assembly',
      '64567': 'Minifigure, Weapon Lightsaber Hilt Straight',
      '30374': 'Bar 4L (Lightsaber Blade / Wand)',
      '3022': 'Plate 2 x 2',
    };
    const boxes = parts.map((p) =>
      customBox(p, {
        v_hilt: [4, 10, 4],
        v_blade: [3, 40, 3],
        table_mug: [6, 6, 6],
        train_table: [16, 4, 16],
      }),
    );
    const adjacency: number[][] = [
      [1],          // v_legs
      [0, 2, 3],    // v_torso
      [1],          // v_head
      [1, 4],       // v_hilt touches torso/hand + blade
      [3],          // v_blade touches ONLY hilt (NOT train structure!)
      [6],          // table_mug anchored to train_table
      [5],          // train_table
    ];

    const { groups, claimed } = extractMinifigureGroups(parts, boxes, (pid) => extraNames[pid] || pid, adjacency);
    expect(groups).toHaveLength(1);
    const picked = groups[0].indices.map((i) => parts[i].id);
    expect(picked).toContain('v_hilt');
    expect(picked).toContain('v_blade');
    expect(picked).not.toContain('table_mug');
    expect(claimed[4]).toBe(1); // v_blade claimed with hilt!
    expect(claimed[5]).toBe(0); // table_mug stays on train table!
  });
});

describe('Front-Facing Minifig Pose Step & 3D Rotation Indicators', () => {
  it('faces posedFrontParts toward the camera (+Z) with legs & yaw rotation indicators, aligned ghosts, and selective highlights', () => {
    const worldRot = rotY(180); // seated passenger facing away from camera (-Z)
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
          { id: 'leg_r', p: '3816', c: 0, x: 128, y: 28, z: -60, m: legSeatedM },
          { id: 'leg_l', p: '3817', c: 0, x: 112, y: 28, z: -60, m: legSeatedM },
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
          { id: 'arm_r', p: '3818', c: 26, x: 135.552, y: 64, z: -60, m: mat3Multiply(worldRot, ARM_R_NEUTRAL) },
          { id: 'arm_l', p: '3819', c: 26, x: 104.448, y: 64, z: -60, m: mat3Multiply(worldRot, ARM_L_NEUTRAL) },
        ],
      },
      { id: 'head', p: '3626c', c: 14, x: 120, y: 96, z: -60, m: worldRot },
      { id: 'hair', p: '21778', c: 0, x: 120, y: 96, z: -60, m: worldRot },
    ];

    const res = normalizeMinifigureForBuild(worldParts, resolveName, simpleBox, 'seated');

    // posedFrontParts faces +Z (toward camera!) while legs remain seated forward (+Z)
    const frontTorso = res.posedFrontParts[1].children![0];
    const frontLegR = res.posedFrontParts[0].children![1];
    const frontLegL = res.posedFrontParts[0].children![2];
    expect(mat3Col(frontTorso.m!, 2)[2]).toBeCloseTo(1, 3);
    expect(mat3Vec(frontLegR.m!, 0, -1, 0)[2]).toBeCloseTo(1, 3);
    expect(mat3Vec(frontLegL.m!, 0, -1, 0)[2]).toBeCloseTo(1, 3);
    expect(res.poseCamera.az).toBeGreaterThan(0);

    // Indicators: merged 90-deg forward legs arc + 180-deg base yaw arc (sweeping opposite side from +X leg arc!)
    const legsInd = res.poseIndicators.find((i) => i.kind === 'legs');
    const yawInd = res.poseIndicators.find((i) => i.kind === 'body_yaw');
    expect(legsInd).toBeDefined();
    expect(legsInd!.angleDeg).toBeCloseTo(90, 0);
    expect(legsInd!.startDir[1]).toBeCloseTo(-1, 2);
    expect(legsInd!.endDir[2]).toBeCloseTo(1, 2);
    expect(legsInd!.label).toBe('Legs 90° forward');

    expect(yawInd).toBeDefined();
    expect(yawInd!.angleDeg).toBeCloseTo(180, 0);
    expect(yawInd!.startDir[2]).toBeCloseTo(1, 2);
    expect(yawInd!.endDir[2]).toBeCloseTo(-1, 2);
    expect(yawInd!.axis[1]).toBeLessThan(0); // wraps opposite (-X) side to stay clear of +X leg arc
    expect(yawInd!.label).toBe('Turn figure 180°');

    // Standing ghost legs align cleanly upright right below the seated hips
    expect(res.poseGhostParts).toHaveLength(2);
    for (const gp of res.poseGhostParts) {
      expect(mat3AngleDeg(mat3Orthonormalize(gp.m), R_IDENTITY)).toBeLessThan(0.5);
    }

    // Selective highlight contains ONLY the legs (stationary torso/head/hair excluded)
    expect(res.rotatedPartIds).toContain(frontLegR.id);
    expect(res.rotatedPartIds).toContain(frontLegL.id);
    expect(res.rotatedPartIds).not.toContain(frontTorso.id);
    expect(res.rotatedPartIds).not.toContain(res.posedFrontParts[2].id);
    expect(res.rotatedPartIds).not.toContain(res.posedFrontParts[3].id);
  });

  it('emits separate leg indicators for asymmetric walking poses and picks front-left camera when only right arm moves', () => {
    const walkingParts: RuntimePart[] = [
      {
        id: 'legs_asm',
        p: 'asm_970c00_0',
        c: 0,
        x: 0,
        y: 32,
        z: 0,
        m: R_IDENTITY,
        children: [
          { id: 'hips', p: '3815', c: 0, x: 0, y: 40, z: 0, m: R_IDENTITY },
          { id: 'leg_r', p: '3816', c: 0, x: -8, y: 28, z: 0, m: rotX(30) }, // back 30 deg
          { id: 'leg_l', p: '3817', c: 0, x: 8, y: 28, z: 0, m: rotX(-35) }, // forward 35 deg
        ],
      },
      { id: 'torso', p: '973', c: 26, x: 0, y: 72, z: 0, m: R_IDENTITY },
    ];
    const walkRes = normalizeMinifigureForBuild(walkingParts, resolveName, simpleBox, 'walk');
    const legRInd = walkRes.poseIndicators.find((i) => i.kind === 'leg_r');
    const legLInd = walkRes.poseIndicators.find((i) => i.kind === 'leg_l');
    expect(legRInd).toBeDefined();
    expect(legLInd).toBeDefined();
    expect(legRInd!.label).toContain('back');
    expect(legLInd!.label).toContain('forward');

    // Only right arm raised forward -> camera chooses front-left 3/4 (az < 0) so right arm is unobstructed
    const rightArmParts: RuntimePart[] = [
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
          { id: 'arm_r', p: '3818', c: 26, x: -15.552, y: -8, z: 0, m: mat3Multiply(ARM_R_NEUTRAL, rotX(-75)) },
          { id: 'arm_l', p: '3819', c: 26, x: 15.552, y: -8, z: 0, m: ARM_L_NEUTRAL },
        ],
      },
    ];
    const armRes = normalizeMinifigureForBuild(rightArmParts, resolveName, simpleBox, 'armr');
    const armRInd = armRes.poseIndicators.find((i) => i.kind === 'arm_r');
    expect(armRInd).toBeDefined();
    expect(armRInd!.angleDeg).toBeCloseTo(75, 0);
    expect(armRes.poseCamera.corner).toBe('front_left');
    expect(armRes.poseCamera.az).toBeLessThan(0);
  });

  it('generates head turn and reclining body tilt indicators while keeping front facing +Z', () => {
    const worldM = mat3Multiply(rotY(90), rotX(-25));
    const headM = mat3Multiply(worldM, rotY(45));
    const parts: RuntimePart[] = [
      { id: 't', p: '973', c: 1, x: 0, y: 0, z: 0, m: worldM },
      { id: 'h', p: '3626c', c: 14, x: 0, y: 24, z: 0, m: headM },
      { id: 'hr', p: '21778', c: 0, x: 0, y: 24, z: 0, m: headM },
    ];
    const res = normalizeMinifigureForBuild(parts, resolveName, simpleBox, 'tilt');

    const frontTorsoFwd = mat3Col(res.posedFrontParts[0].m!, 2);
    expect(frontTorsoFwd[2]).toBeGreaterThan(0.85);
    expect(Math.abs(frontTorsoFwd[0])).toBeLessThan(0.05);

    const headInd = res.poseIndicators.find((i) => i.kind === 'head');
    const tiltInd = res.poseIndicators.find((i) => i.kind === 'body_tilt');
    const yawInd = res.poseIndicators.find((i) => i.kind === 'body_yaw');
    expect(headInd).toBeDefined();
    expect(headInd!.angleDeg).toBeCloseTo(45, 0);
    expect(tiltInd).toBeDefined();
    expect(tiltInd!.angleDeg).toBeCloseTo(25, 0);
    expect(yawInd).toBeDefined();
    expect(yawInd!.angleDeg).toBeCloseTo(90, 0);
  });
});


