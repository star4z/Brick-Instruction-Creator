import { describe, expect, it } from 'vitest';
import {
  analyzeTiltedHingedAssemblies,
  isHingeBasePart,
  isHingeLeafPart,
  mat3FromAxisAngle,
  type HingePartInput,
} from '../hingedAssembly';
import type { WorldBox } from '../minifigPose';

const R_ID = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function boxFromCenterSize(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): WorldBox {
  return {
    min: [cx - sx / 2, cy - sy / 2, cz - sz / 2],
    max: [cx + sx / 2, cy + sy / 2, cz + sz / 2],
    center: [cx, cy, cz],
  };
}

function rotatePointAround(
  pt: [number, number, number],
  pivot: [number, number, number],
  m: readonly number[],
): [number, number, number] {
  const dx = pt[0] - pivot[0];
  const dy = pt[1] - pivot[1];
  const dz = pt[2] - pivot[2];
  return [
    pivot[0] + m[0] * dx + m[1] * dy + m[2] * dz,
    pivot[1] + m[3] * dx + m[4] * dy + m[5] * dz,
    pivot[2] + m[6] * dx + m[7] * dy + m[8] * dz,
  ];
}

function rotateBoxAround(box: WorldBox, pivot: [number, number, number], m: readonly number[]): WorldBox {
  let mnX = Infinity, mnY = Infinity, mnZ = Infinity;
  let mxX = -Infinity, mxY = -Infinity, mxZ = -Infinity;
  for (const x of [box.min[0], box.max[0]]) {
    for (const y of [box.min[1], box.max[1]]) {
      for (const z of [box.min[2], box.max[2]]) {
        const p = rotatePointAround([x, y, z], pivot, m);
        if (p[0] < mnX) mnX = p[0];
        if (p[0] > mxX) mxX = p[0];
        if (p[1] < mnY) mnY = p[1];
        if (p[1] > mxY) mxY = p[1];
        if (p[2] < mnZ) mnZ = p[2];
        if (p[2] > mxZ) mxZ = p[2];
      }
    }
  }
  return {
    min: [mnX, mnY, mnZ],
    max: [mxX, mxY, mxZ],
    center: [(mnX + mxX) / 2, (mnY + mxY) / 2, (mnZ + mxZ) / 2],
  };
}

describe('hingedAssembly — general 3D rigid-body hinged sub-assembly kinematics', () => {
  it('classifies canonical LDraw hinge bases and hinge leaf/top plates cleanly', () => {
    expect(isHingeBasePart({ partId: '3937', partName: 'Hinge Brick 1 x 2 Base' })).toBe(true);
    expect(isHingeLeafPart({ partId: '3938', partName: 'Hinge Brick 1 x 2 Top Plate' })).toBe(true);
    expect(isHingeLeafPart({ partId: '6134', partName: 'Hinge Brick 2 x 2 Top Plate' })).toBe(true);
    expect(isHingeBasePart({ partId: '3001', partName: 'Brick 2 x 4' })).toBe(false);
    expect(isHingeLeafPart({ partId: '3001', partName: 'Brick 2 x 4' })).toBe(false);
  });

  it('solves exact pivot, restores 0° upright transforms, enforces base->top prerequisites, and captures roof rest-stop parts', () => {
    // Reproduces an 8.57° backward-tilted windshield hinged on two 3937/3938 hinge bricks,
    // whose upper edge leans back (+Z) onto a roof front edge plate.
    const pivot: [number, number, number] = [0, 123, -305.5];
    const tiltRad = (8.57 * Math.PI) / 180;
    const rotTilt = mat3FromAxisAngle([1, 0, 0], tiltRad);

    const baseL: HingePartInput = {
      index: 0,
      partId: '3937',
      partName: 'Hinge Brick 1 x 2 Base',
      role: 'structural',
      x: -20,
      y: 133,
      z: -305.5,
      m: R_ID,
      box: boxFromCenterSize(-20, 121, -305.5, 40, 24, 20),
    };
    const baseR: HingePartInput = {
      index: 1,
      partId: '3937',
      partName: 'Hinge Brick 1 x 2 Base',
      role: 'structural',
      x: 20,
      y: 133,
      z: -305.5,
      m: R_ID,
      box: boxFromCenterSize(20, 121, -305.5, 40, 24, 20),
    };

    // Upright positions of hinge tops + windshield frame + top plate before tilting
    const uprightTopL = { p: [-20, 133, -305.5] as [number, number, number], box: boxFromCenterSize(-20, 127, -305.5, 40, 16, 20) };
    const uprightTopR = { p: [20, 133, -305.5] as [number, number, number], box: boxFromCenterSize(20, 127, -305.5, 40, 16, 20) };
    const uprightWin = { p: [0, 205, -305.5] as [number, number, number], box: boxFromCenterSize(0, 171, -305.5, 80, 72, 20) };
    const uprightCap = { p: [0, 213, -305.5] as [number, number, number], box: boxFromCenterSize(0, 211, -305.5, 80, 8, 20) };

    const makeTilted = (
      index: number,
      partId: string,
      partName: string,
      up: { p: [number, number, number]; box: WorldBox },
    ): HingePartInput => {
      const tp = rotatePointAround(up.p, pivot, rotTilt);
      return {
        index,
        partId,
        partName,
        role: 'structural',
        x: tp[0],
        y: tp[1],
        z: tp[2],
        m: rotTilt,
        box: rotateBoxAround(up.box, pivot, rotTilt),
      };
    };

    const topL = makeTilted(2, '3938', 'Hinge Brick 1 x 2 Top Plate', uprightTopL);
    const topR = makeTilted(3, '3938', 'Hinge Brick 1 x 2 Top Plate', uprightTopR);
    const win = makeTilted(4, '60594', 'Window 1 x 4 x 3', uprightWin);
    const cap = makeTilted(5, '3710', 'Plate 1 x 4', uprightCap);

    // Stationary roof front edge that the tilted windshield leans against (+Z side)
    const roofEdge: HingePartInput = {
      index: 6,
      partId: '11477',
      partName: 'Slope, Curved 2 x 1',
      role: 'structural',
      x: 0,
      y: 217,
      z: -272,
      m: R_ID,
      box: boxFromCenterSize(0, 217, -272, 80, 16, 20),
    };
    // Far-away stationary floor plate (should NOT be a rest stop)
    const farFloor: HingePartInput = {
      index: 7,
      partId: '3020',
      partName: 'Plate 2 x 4',
      role: 'structural',
      x: 0,
      y: 40,
      z: -100,
      m: R_ID,
      box: boxFromCenterSize(0, 40, -100, 80, 8, 40),
    };

    const parts = [baseL, baseR, topL, topR, win, cap, roofEdge, farFloor];
    const adj: number[][] = [
      [2],          // 0: baseL <-> topL
      [3],          // 1: baseR <-> topR
      [0, 4],       // 2: topL <-> baseL, win
      [1, 4],       // 3: topR <-> baseR, win
      [2, 3, 5],    // 4: win <-> topL, topR, cap
      [4, 6],       // 5: cap <-> win, roofEdge
      [5],          // 6: roofEdge
      [],           // 7: farFloor
    ];

    const plan = analyzeTiltedHingedAssemblies(parts, adj);
    expect(plan.assemblies).toHaveLength(1);
    const asm = plan.assemblies[0];

    expect(asm.partIndices.sort((a, b) => a - b)).toEqual([2, 3, 4, 5]);
    expect(asm.baseIndices.sort((a, b) => a - b)).toEqual([0, 1]);
    expect(asm.angleDeg).toBeCloseTo(8.57, 1);
    expect(asm.axis[0]).toBeCloseTo(1, 2);
    expect(asm.tangent[2]).toBeCloseTo(1, 2);
    expect(asm.pivot[1]).toBeCloseTo(123, 0);
    expect(asm.pivot[2]).toBeCloseTo(-305.5, 0);

    // Un-tilted upright transforms restore 3938 and 60594 back to exact 0° upright alignment!
    const upWin = asm.uprightTransforms.get(4)!;
    expect(upWin.m[4]).toBeCloseTo(1, 3); // localUp.y === 1 (straight vertical!)
    expect(upWin.z).toBeCloseTo(-305.5, 0);
    expect(upWin.y).toBeCloseTo(205, 0);

    // Base -> top prerequisite pairs guarantee 3937 precedes 3938
    expect(plan.allBasePrereqPairs).toContainEqual([2, 0]);
    expect(plan.allBasePrereqPairs).toContainEqual([3, 1]);

    // Roof edge is captured as a rest-stop part; far floor is not
    expect(asm.restStopIndices).toContain(6);
    expect(asm.restStopIndices).not.toContain(7);

    // Wide 80-LDU windshield gets a symmetric left+right pair of curved 3D tilt indicators
    expect(asm.indicators).toHaveLength(2);
    expect(asm.indicators[0].kind).toBe('hinge_tilt');
    expect(asm.indicators[0].angleDeg).toBeGreaterThanOrEqual(45);
  });

  it('still records base->top prerequisites for upright 0° stacked hinges without emitting a tilt step', () => {
    const base: HingePartInput = {
      index: 0,
      partId: '3937',
      partName: 'Hinge Brick 1 x 2 Base',
      role: 'structural',
      x: 0,
      y: 12,
      z: 0,
      m: R_ID,
      box: boxFromCenterSize(0, 12, 0, 40, 24, 20),
    };
    const top: HingePartInput = {
      index: 1,
      partId: '3938',
      partName: 'Hinge Brick 1 x 2 Top Plate',
      role: 'structural',
      x: 0,
      y: 22,
      z: 0,
      m: R_ID,
      box: boxFromCenterSize(0, 22, 0, 40, 16, 20),
    };
    const plan = analyzeTiltedHingedAssemblies([base, top], [[1], [0]]);
    expect(plan.assemblies).toHaveLength(0);
    expect(plan.allBasePrereqPairs).toEqual([[1, 0]]);
  });

  it('skips un-tilting when an upright 0° pose would deeply collide with a stationary wall', () => {
    const pivot: [number, number, number] = [0, 123, -305.5];
    const rotTilt = mat3FromAxisAngle([1, 0, 0], (25 * Math.PI) / 180);

    const base: HingePartInput = {
      index: 0,
      partId: '3937',
      partName: 'Hinge Brick 1 x 2 Base',
      role: 'structural',
      x: 0,
      y: 133,
      z: -305.5,
      m: R_ID,
      box: boxFromCenterSize(0, 121, -305.5, 40, 24, 20),
    };
    const topUpPos: [number, number, number] = [0, 133, -305.5];
    const topUpBox = boxFromCenterSize(0, 127, -305.5, 40, 16, 20);
    const panelUpPos: [number, number, number] = [0, 180, -305.5];
    const panelUpBox = boxFromCenterSize(0, 180, -305.5, 40, 60, 20);

    const topP = rotatePointAround(topUpPos, pivot, rotTilt);
    const panelP = rotatePointAround(panelUpPos, pivot, rotTilt);

    const top: HingePartInput = {
      index: 1,
      partId: '3938',
      partName: 'Hinge Brick 1 x 2 Top Plate',
      role: 'structural',
      x: topP[0],
      y: topP[1],
      z: topP[2],
      m: rotTilt,
      box: rotateBoxAround(topUpBox, pivot, rotTilt),
    };
    const panel: HingePartInput = {
      index: 2,
      partId: '3001',
      partName: 'Brick 2 x 4',
      role: 'structural',
      x: panelP[0],
      y: panelP[1],
      z: panelP[2],
      m: rotTilt,
      box: rotateBoxAround(panelUpBox, pivot, rotTilt),
    };
    // Solid stationary beam occupying the exact space where the un-tilted panel would stand!
    const blockingBeam: HingePartInput = {
      index: 3,
      partId: '3001',
      partName: 'Brick 2 x 4',
      role: 'structural',
      x: 0,
      y: 180,
      z: -305.5,
      m: R_ID,
      box: boxFromCenterSize(0, 180, -305.5, 40, 24, 20),
    };

    const plan = analyzeTiltedHingedAssemblies([base, top, panel, blockingBeam], [[1], [0, 2], [1], []]);
    expect(plan.assemblies).toHaveLength(0);
  });
});
