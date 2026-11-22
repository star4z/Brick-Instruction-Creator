import { describe, expect, it } from 'vitest';
import {
  compileDatEntry,
  normalizeDatRef,
  type DatEntrySource,
} from '../datCompiler';

function makeTriangles(count: number, cx: number, cy: number, cz: number, color = 16): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const ox = cx + (i % 7) * 0.05;
    const oy = cy + Math.floor(i / 7) * 0.01;
    out.push(
      `3 ${color} ${ox} ${oy} ${cz} ${ox + 1} ${oy} ${cz} ${ox} ${oy + 1} ${cz + 0.5}`,
    );
  }
  return out;
}

function makeEdges(count: number, cx: number, cy: number, cz: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(`2 24 ${cx} ${cy + i * 0.01} ${cz} ${cx + 1} ${cy + i * 0.01} ${cz}`);
  }
  return out;
}

function hasVertexNearX(tris: Float32Array, targetX: number, tol = 2.5): boolean {
  for (let i = 0; i < tris.length; i += 3) {
    if (Math.abs(tris[i] - targetX) <= tol) return true;
  }
  return false;
}

describe('compileDatEntry — minifigure torso & sibling-fair budgeting', () => {
  it('compiles BOTH right and left hands on high-detail Studio torso assemblies exceeding 2,000 triangles', () => {
    // Reproduces the exact Studio model2.ldr bug where torso + right arm + left arm + right hand
    // crossed the old 18,000-float (2,000-tri) cap, causing the 2nd 3820.dat (left hand) to vanish.
    const db = new Map<string, DatEntrySource>([
      [
        '973',
        {
          key: '973',
          lines: [...makeTriangles(500, 0, 16, 0), ...makeEdges(250, 0, 16, 0)],
        },
      ],
      [
        '3818',
        {
          key: '3818',
          lines: [...makeTriangles(700, 0, 10, 0), ...makeEdges(250, 0, 10, 0)],
        },
      ],
      [
        '3819',
        {
          key: '3819',
          lines: [...makeTriangles(700, 0, 10, 0), ...makeEdges(250, 0, 10, 0)],
        },
      ],
      [
        '3820',
        {
          key: '3820',
          lines: [...makeTriangles(400, 0, 0, 0), ...makeEdges(200, 0, 0, 0)],
        },
      ],
    ]);

    const torsoAsm: DatEntrySource = {
      key: '973c01',
      lines: [
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 973.dat',
        '1 16 -15.552 9 0 0.985 -0.17 0 0.17 0.985 0 0 0 1 3818.dat',
        '1 16 15.552 9 0 0.985 0.17 0 -0.17 0.985 0 0 0 1 3819.dat',
        '1 14 -23.6904 26.774 -9.8982 1 0 0 0 1 0 0 0 1 3820.dat',
        '1 14 23.6904 26.774 -9.8982 1 0 0 0 1 0 0 0 1 3820.dat',
      ],
    };

    const mesh = compileDatEntry(torsoAsm, (ref) => db.get(normalizeDatRef(ref)));
    expect(mesh).not.toBeNull();
    // All 500 + 700 + 700 + 400 + 400 = 2,700 triangles must compile without truncation
    expect(mesh!.tris.length).toBe(2700 * 9);
    // Both right hand (-23.69) and left hand (+23.69) must be present!
    expect(hasVertexNearX(mesh!.tris, -23.69, 2)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, 23.69, 2)).toBe(true);
    // Both hands must also retain outline edges
    expect(hasVertexNearX(mesh!.edges, -23.69, 2)).toBe(true);
    expect(hasVertexNearX(mesh!.edges, 23.69, 2)).toBe(true);
    // Yellow hand sub-color (14) must be preserved
    expect(mesh!.triCols).not.toBeNull();
    expect(Array.from(mesh!.triCols!).filter((c) => c === 14).length).toBe(800);
  });

  it('preserves torso sides, both arms, and both hands even on ultra-dense printed torsos', () => {
    // Reproduces Step 7 (dense printed jacket with >35,000 print triangles) where direct print
    // geometry previously starved s/973s01.dat, both arms, and both hands.
    const db = new Map<string, DatEntrySource>([
      [
        's/973s01',
        {
          key: 's/973s01',
          lines: makeTriangles(120, 19, 16, 0, 16),
        },
      ],
      [
        'bl_973pb9999',
        {
          key: 'bl_973pb9999',
          lines: [
            // Massive direct print decal placed BEFORE the torso sides subpart
            ...makeTriangles(35000, 0, 16, -10, 3),
            '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/973s01.dat',
          ],
        },
      ],
      ['3818', { key: '3818', lines: makeTriangles(300, 0, 10, 0) }],
      ['3819', { key: '3819', lines: makeTriangles(300, 0, 10, 0) }],
      ['3820', { key: '3820', lines: makeTriangles(250, 0, 0, 0) }],
    ]);

    const printedTorsoAsm: DatEntrySource = {
      key: 'bl_973pb9999c01',
      lines: [
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 bl_973pb9999.dat',
        '1 16 -15.552 9 0 1 0 0 0 1 0 0 0 1 3818.dat',
        '1 16 15.552 9 0 1 0 0 0 1 0 0 0 1 3819.dat',
        '1 14 -23.69 26.77 -9.9 1 0 0 0 1 0 0 0 1 3820.dat',
        '1 14 23.69 26.77 -9.9 1 0 0 0 1 0 0 0 1 3820.dat',
      ],
    };

    const mesh = compileDatEntry(printedTorsoAsm, (ref) => db.get(normalizeDatRef(ref)));
    expect(mesh).not.toBeNull();
    // Torso sides (x=+19), both arms (x=±15.55), and BOTH hands (x=±23.69) must all exist!
    expect(hasVertexNearX(mesh!.tris, 19, 1.5)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, -15.55, 1.5)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, 15.55, 1.5)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, -23.69, 1.5)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, 23.69, 1.5)).toBe(true);
    // Both yellow hands compiled in full (250 + 250 = 500 yellow triangles)
    expect(Array.from(mesh!.triCols!).filter((c) => c === 14).length).toBe(500);
  });

  it('synthesizes ndis primitives and parses tab-separated LDraw lines', () => {
    const part: DatEntrySource = {
      key: 'ndis_test',
      lines: [
        '1\t16\t0\t0\t0\t5\t0\t0\t0\t1\t0\t0\t0\t5\t4-4ndis.dat',
      ],
    };
    const mesh = compileDatEntry(part, () => null);
    expect(mesh).not.toBeNull();
    // 4 quadrants * 3 segments = 12 triangles
    expect(mesh!.tris.length).toBe(12 * 9);
    expect(mesh!.min[0]).toBeCloseTo(-5, 3);
    expect(mesh!.max[0]).toBeCloseTo(5, 3);
  });
});
