import { describe, expect, it } from 'vitest';
import {
  compileDatEntry,
  isDirectRgbColor,
  normalizeDatRef,
  type DatEntrySource,
} from '../datCompiler';
import {
  extractBase64FromPeTexInfoLine,
  extractTexmapTextureNamesFromLines,
  hashTextureBase64,
  normalizeTextureName,
  textureStore,
} from '../textureStore';

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

  it('synthesizes ndis primitives (including 4-4ndis and fractional 1-8ndis) at exact 16-segment LDraw alignment', () => {
    const part44: DatEntrySource = {
      key: 'ndis_test',
      lines: [
        '1\t16\t0\t0\t0\t5\t0\t0\t0\t1\t0\t0\t0\t5\t4-4ndis.dat',
      ],
    };
    const mesh44 = compileDatEntry(part44, () => null);
    expect(mesh44).not.toBeNull();
    // Exact 16-segment LDraw circle: 4 quadrants * 4 segments = 16 triangles
    expect(mesh44!.tris.length).toBe(16 * 9);
    expect(mesh44!.min[0]).toBeCloseTo(-5, 3);
    expect(mesh44!.max[0]).toBeCloseTo(5, 3);

    const part18: DatEntrySource = {
      key: 'ndis_1_8_test',
      lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 1-8ndis.dat'],
    };
    const mesh18 = compileDatEntry(part18, () => null);
    expect(mesh18).not.toBeNull();
    // 1/8th circle = 2 segments at 22.5° steps
    expect(mesh18!.tris.length).toBe(2 * 9);
  });

  it('preserves all 4 front forehead & chin torus bevels on high-poly printed minifigure heads even when torus .dat files are absent', () => {
    const lines: string[] = ['0 Minifig Head with Detailed Sunglasses Print'];
    for (let i = 0; i < 2400; i++) {
      const x0 = -4 + (i % 40) * 0.2;
      const y0 = 6 + Math.floor(i / 40) * 0.15;
      lines.push(`3 1 ${x0} ${y0} -13 ${x0 + 0.18} ${y0} -13 ${x0 + 0.09} ${y0 + 0.12} -13`);
    }
    lines.push(
      '1 16 0 4 0 0 0 -8 0 -6.4 0 -8 0 0 t04o6250.dat',
      '1 16 0 4 0 8 0 0 0 -6.4 0 0 0 -8 t04o6250.dat',
      '1 16 0 17 0 0 0 8 0 6.4 0 -8 0 0 t04o6250.dat',
      '1 16 0 17 0 -8 0 0 0 6.4 0 0 0 -8 t04o6250.dat',
    );

    const mesh = compileDatEntry({ key: '3626cp_test', lines }, () => null);
    expect(mesh).not.toBeNull();
    // 2,400 face tris + 4 * 32 torus tris = 2,528 tris
    expect(mesh!.tris.length).toBe(2528 * 9);
    expect(mesh!.min[0]).toBeCloseTo(-13, 1);
    expect(mesh!.max[0]).toBeCloseTo(13, 1);
    expect(mesh!.min[1]).toBeCloseTo(-21, 1);
    expect(mesh!.max[1]).toBeCloseTo(0, 1);
    expect(mesh!.max[2]).toBeCloseTo(13, 1);
  });

  it('synthesizes missing t08o6250, t16o6250, cone, rinN, and box5 fallback primitives', () => {
    const t08 = compileDatEntry({ key: 't08', lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 t08o6250.dat'] }, () => null);
    const t16 = compileDatEntry({ key: 't16', lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 t16o6250.dat'] }, () => null);
    const rin3 = compileDatEntry({ key: 'rin3', lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 1-16rin3.dat'] }, () => null);
    const cone = compileDatEntry({ key: 'con0', lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 1-4con0.dat'] }, () => null);
    const box5 = compileDatEntry({ key: 'box5', lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 box5.dat'] }, () => null);

    expect(t08!.tris.length / 9).toBe(16);
    expect(t16!.tris.length / 9).toBe(8);
    expect(rin3!.tris.length / 9).toBe(2);
    expect(cone!.tris.length / 9).toBe(4);
    expect(box5!.tris.length / 9).toBe(10);
  });

  it('prefers !TEXMAP FALLBACK geometry when present and unwraps 0 !: lines when FALLBACK is absent', () => {
    const withFallback = compileDatEntry(
      {
        key: 'tex_fb',
        lines: [
          '0 !TEXMAP START PLANAR 0 0 0 1 0 0 0 1 0 face.png',
          '0 !: 3 16 0 0 0 10 0 0 0 10 0',
          '0 !TEXMAP FALLBACK',
          '3 1 0 0 0 5 0 0 0 5 0',
          '3 4 5 0 0 10 0 0 5 5 0',
          '0 !TEXMAP END',
        ],
      },
      () => null,
    );
    expect(withFallback!.tris.length / 9).toBe(2);
    expect(Array.from(withFallback!.triCols!)).toEqual([1, 4]);

    const withoutFallback = compileDatEntry(
      {
        key: 'tex_only',
        lines: [
          '0 !TEXMAP START PLANAR 0 0 0 1 0 0 0 1 0 face.png',
          '0 !: 4 16 0 0 0 10 0 0 10 10 0 0 10 0',
          '0 !TEXMAP END',
        ],
      },
      () => null,
    );
    expect(withoutFallback!.tris.length / 9).toBe(2);
  });

  it('triangulates concave quads safely without folding over', () => {
    // Concave at vertex b (1, 1): diagonal (a, c) lies outside, diagonal (b, d) lies inside
    const mesh = compileDatEntry(
      { key: 'concave_quad', lines: ['4 1 0 0 0 1 1 0 4 0 0 1 4 0'] },
      () => null,
    );
    expect(mesh).not.toBeNull();
    expect(mesh!.tris.length / 9).toBe(2);
    // Both triangle normals must agree in orientation
    const n1z = mesh!.norms[2];
    const n2z = mesh!.norms[9 + 2];
    expect(n1z * n2z).toBeGreaterThan(0.99);
  });

  it('compiles 2736 Technic Axle Towball with a continuous solid axle shaft (no floating axleend X)', () => {
    // Reproduces the bug where SKIPPED_UNDERSIDE_RE dropped axlehol8/axlehol2/axlehol9,
    // erasing the 17-LDU cross-axle shaft and leaving axleend.dat floating in mid-air at x=17.
    const towball2736: DatEntrySource = {
      key: '2736',
      lines: [
        '1 16 0 0 0 0 1 0 1 0 0 0 0 1 axlehol2.dat',
        '1 16 0 0 0 0 1 0 1 0 0 0 0 1 axlehol9.dat',
        '1 16 17 0 0 0 1 0 1 0 0 0 0 1 axlehol2.dat',
        '1 16 17 0 0 0 1 0 1 0 0 0 0 1 axlehol9.dat',
        '1 16 0 0 0 0 17 0 1 0 0 0 0 1 axlehol8.dat',
        '1 16 17 0 0 0 -1 0 1 0 0 0 0 -1 axleend.dat',
        '1 16 0 0 0 0 -2 0 8 0 0 0 0 -8 4-4cylc.dat',
      ],
    };

    const countShaftSpanningTris = (tris: Float32Array): number => {
      let spanning = 0;
      for (let i = 0; i < tris.length; i += 9) {
        const xs = [tris[i], tris[i + 3], tris[i + 6]];
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        if (minX <= 0.1 && maxX >= 16.9) spanning++;
      }
      return spanning;
    };

    // Case 1: Official subfiles present in library (axlehol8 uses 4x box2-9p + 8 outer quads)
    const db = new Map<string, DatEntrySource>([
      [
        'box2-9p',
        {
          key: 'box2-9p',
          lines: [
            '2 24 1 1 1 -1 1 1',
            '2 24 1 -1 1 -1 -1 1',
            '2 24 1 1 -1 -1 1 -1',
            '4 16 1 1 1 1 1 -1 -1 1 -1 -1 1 1',
            '4 16 1 1 1 -1 1 1 -1 -1 1 1 -1 1',
          ],
        },
      ],
      [
        'axlehol8',
        {
          key: 'axlehol8',
          lines: [
            '1 16 3.80115 .5 3.80115 0 -1.80115 0 .5 0 0 0 0 -1.80115 box2-9p.dat',
            '1 16 -3.80115 .5 3.80115 0 1.80115 0 .5 0 0 0 0 -1.80115 box2-9p.dat',
            '1 16 -3.80115 .5 -3.80115 0 1.80115 0 .5 0 0 0 0 1.80115 box2-9p.dat',
            '1 16 3.80115 .5 -3.80115 0 -1.80115 0 .5 0 0 0 0 1.80115 box2-9p.dat',
            '4 16 5.6023 1 2 5.6023 0 2 6 0 0 6 1 0',
            '4 16 2 1 5.6023 0 1 6 0 0 6 2 0 5.6023',
            '4 16 -2 1 5.6023 -2 0 5.6023 0 0 6 0 1 6',
            '4 16 -5.6023 1 2 -6 1 0 -6 0 0 -5.6023 0 2',
            '4 16 -5.6023 1 -2 -5.6023 0 -2 -6 0 0 -6 1 0',
            '4 16 2 1 -5.6023 2 0 -5.6023 0 0 -6 0 1 -6',
            '4 16 -2 1 -5.6023 0 1 -6 0 0 -6 -2 0 -5.6023',
            '4 16 5.6023 1 -2 6 1 0 6 0 0 5.6023 0 -2',
          ],
        },
      ],
      [
        'axleend',
        {
          key: 'axleend',
          lines: [
            '4 16 6 0 0 5.602 0 2 2 0 2 0 0 0',
            '4 16 -6 0 0 0 0 0 -2 0 2 -5.602 0 2',
            '4 16 6 0 0 0 0 0 2 0 -2 5.602 0 -2',
            '4 16 -6 0 0 -5.602 0 -2 -2 0 -2 0 0 0',
            '4 16 0 0 6 0 0 0 2 0 2 2 0 5.602',
            '4 16 0 0 6 -2 0 5.602 -2 0 2 0 0 0',
            '4 16 0 0 -6 2 0 -5.602 2 0 -2 0 0 0',
            '4 16 0 0 -6 0 0 0 -2 0 -2 -2 0 -5.602',
          ],
        },
      ],
    ]);

    const meshWithLib = compileDatEntry(towball2736, (ref) => db.get(normalizeDatRef(ref)));
    expect(meshWithLib).not.toBeNull();
    // 16 shaft quads * 2 tris = 32 triangles spanning the full 0..17 LDU axle shaft
    expect(countShaftSpanningTris(meshWithLib!.tris)).toBe(32);
    expect(hasVertexNearX(meshWithLib!.edges, 17, 0.1)).toBe(true);

    // Case 2: Procedural fallback when axlehol8/axlehol2/axlehol9/axleend are absent from library
    const meshFallback = compileDatEntry(towball2736, () => null);
    expect(meshFallback).not.toBeNull();
    expect(countShaftSpanningTris(meshFallback!.tris)).toBe(32);
    expect(hasVertexNearX(meshFallback!.edges, 0, 0.1)).toBe(true);
    expect(hasVertexNearX(meshFallback!.edges, 17, 0.1)).toBe(true);
    expect(meshFallback!.max[0]).toBeCloseTo(17, 2);

    // Case 3: axlehol8 present, box2-9p missing -> box2-9p fallback fills all 8 inner shaft walls
    const dbNoBox2 = new Map(db);
    dbNoBox2.delete('box2-9p');
    const meshNoBox2 = compileDatEntry(towball2736, (ref) => dbNoBox2.get(normalizeDatRef(ref)));
    expect(meshNoBox2).not.toBeNull();
    expect(countShaftSpanningTris(meshNoBox2!.tris)).toBe(32);
  });

  it('keeps beamhole/npeghole/stud10 visible while still skipping hidden underside stud3/stud4 tubes', () => {
    const db = new Map<string, DatEntrySource>([
      ['beamhole', { key: 'beamhole', lines: makeTriangles(2, 10, 0, 0) }],
      ['npeghole', { key: 'npeghole', lines: makeTriangles(2, 20, 0, 0) }],
      ['stud10', { key: 'stud10', lines: makeTriangles(2, 30, 0, 0) }],
      ['stud3', { key: 'stud3', lines: makeTriangles(2, 40, 0, 0) }],
      ['stud4', { key: 'stud4', lines: makeTriangles(2, 50, 0, 0) }],
    ]);

    const mesh = compileDatEntry(
      {
        key: 'skip_check',
        lines: [
          '1 16 0 0 0 1 0 0 0 1 0 0 0 1 beamhole.dat',
          '1 16 0 0 0 1 0 0 0 1 0 0 0 1 npeghole.dat',
          '1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud10.dat',
          '1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud3.dat',
          '1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud4.dat',
        ],
      },
      (ref) => db.get(normalizeDatRef(ref)),
    );
    expect(mesh).not.toBeNull();
    expect(hasVertexNearX(mesh!.tris, 10, 1.5)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, 20, 1.5)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, 30, 1.5)).toBe(true);
    expect(hasVertexNearX(mesh!.tris, 40, 1.5)).toBe(false);
    expect(hasVertexNearX(mesh!.tris, 50, 1.5)).toBe(false);
  });

  it('compiles BrickLink Studio dual-sided minifigure heads with PE_TEX_PATH 1/2 and PE_TEX_INFO base64 PNG decals', () => {
    const frontPngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const backPngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    const db = new Map<string, DatEntrySource>([
      [
        's/bl_3626pb3997_0',
        {
          key: 's/bl_3626pb3997_0',
          lines: [
            '0 BFC CERTIFY CCW',
            '3 16 -12.6 -5 -1 12.6 -5 -1 0 -22 -1',
          ],
        },
      ],
      [
        's/bl_3626pb3997_1',
        {
          key: 's/bl_3626pb3997_1',
          lines: [
            '0 BFC CERTIFY CCW',
            '3 16 12.8 -5 0 0 -5 -12.8 0 -22 -12.8 0.99 0.18 0.50 0.18 0.50 0.88',
            '3 16 -12.8 -5 0 0 -22 -12.8 0 -5 -12.8 0.01 0.18 0.50 0.88 0.50 0.18',
          ],
        },
      ],
      [
        's/bl_3626pb3997_2',
        {
          key: 's/bl_3626pb3997_2',
          lines: [
            '0 BFC CERTIFY CCW',
            '3 16 -12.7 -5 0 0 -5 12.7 0 -22 12.7 0.99 0.18 0.50 0.18 0.50 0.88',
          ],
        },
      ],
    ]);

    const headPart: DatEntrySource = {
      key: 'bl_3626pb3997',
      lines: [
        '0 Minifigure, Head Dual Sided',
        '0 Name: bl_3626pb3997.dat',
        '0 BL_Item_No 3626pb3997',
        '0 BFC CERTIFY CCW',
        '0 PE_TEX_PATH 1',
        `0 PE_TEX_INFO ${frontPngB64}`,
        '0 PE_TEX_PATH 2',
        `0 PE_TEX_INFO ${backPngB64}`,
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/bl_3626pb3997_0.dat',
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/bl_3626pb3997_1.dat',
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/bl_3626pb3997_2.dat',
      ],
    };

    const mesh = compileDatEntry(headPart, (ref) => db.get(normalizeDatRef(ref)));
    expect(mesh).not.toBeNull();
    // Base untextured head mesh (_0) has 1 triangle
    expect(mesh!.tris.length / 9).toBe(1);
    // Front (_1) and Back (_2) face decals compile into 2 distinct textured batches
    expect(mesh!.texBatches).toBeDefined();
    expect(mesh!.texBatches!.length).toBe(2);

    const frontBatch = mesh!.texBatches!.find((b) => b.base64Png === frontPngB64);
    const backBatch = mesh!.texBatches!.find((b) => b.base64Png === backPngB64);
    expect(frontBatch).toBeDefined();
    expect(backBatch).toBeDefined();
    expect(frontBatch!.tris.length / 9).toBe(2);
    expect(frontBatch!.uvs.length).toBe(2 * 6);
    expect(frontBatch!.uvs[0]).toBeCloseTo(0.99, 3);
    expect(frontBatch!.uvs[1]).toBeCloseTo(0.18, 3);
    expect(frontBatch!.uvs[5]).toBeCloseTo(0.88, 3);
    expect(backBatch!.tris.length / 9).toBe(1);
    // Bounds include both front (+Z) and back (-Z) textured shells
    expect(mesh!.max[2]).toBeCloseTo(12.8, 1);
    expect(mesh!.min[2]).toBeCloseTo(-12.7, 1);
  });

  it('supports PE_TEX_PATH -1 with explicit quad UVs and preserves UVs across concave quad triangulation', () => {
    const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const part: DatEntrySource = {
      key: 'quad_uv_test',
      lines: [
        '0 PE_TEX_PATH -1',
        `0 PE_TEX_INFO ${pngB64}`,
        // Concave quad at b=(1,1) with explicit UVs (0,0), (0.25,0.25), (1,0), (0.25,1)
        '4 16 0 0 0 1 1 0 4 0 0 1 4 0 0 0 0.25 0.25 1 0 0.25 1',
      ],
    };

    const mesh = compileDatEntry(part, () => null);
    expect(mesh).not.toBeNull();
    expect(mesh!.tris.length).toBe(0);
    expect(mesh!.texBatches?.length).toBe(1);
    const tb = mesh!.texBatches![0];
    expect(tb.tris.length / 9).toBe(2);
    expect(tb.uvs.length).toBe(12);
    // All UVs must remain within [0, 1]
    for (let i = 0; i < tb.uvs.length; i++) {
      expect(tb.uvs[i]).toBeGreaterThanOrEqual(0);
      expect(tb.uvs[i]).toBeLessThanOrEqual(1);
    }
  });

  it('supports Studio PE_TEX_INFO 16-float planar box projection on un-UV-mapped subfiles', () => {
    const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const db = new Map<string, DatEntrySource>([
      [
        'tile_base',
        {
          key: 'tile_base',
          lines: [
            // Top face at y=0 spanning x=-10..10, z=-10..10
            '4 16 -10 0 -10 10 0 -10 10 0 10 -10 0 10',
            // Bottom face at y=8 (outside projection box y in [-2, 2])
            '4 16 -10 8 -10 10 8 -10 10 8 10 -10 8 10',
          ],
        },
      ],
    ]);
    const part: DatEntrySource = {
      key: 'bl_3070bpb001',
      lines: [
        '0 PE_TEX_PATH 0',
        `0 PE_TEX_INFO 0 0 0 20 0 0 0 4 0 0 0 20 -10 -10 10 10 ${pngB64}`,
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 tile_base.dat',
      ],
    };

    const mesh = compileDatEntry(part, (ref) => db.get(normalizeDatRef(ref)));
    expect(mesh).not.toBeNull();
    // Top face (2 tris) projected into texBatch; bottom face (2 tris) stays untextured
    expect(mesh!.texBatches?.length).toBe(1);
    expect(mesh!.texBatches![0].tris.length / 9).toBe(2);
    expect(mesh!.tris.length / 9).toBe(2);
  });

  it('projects LDraw !TEXMAP START PLANAR UVs when texture is resolved and falls back otherwise', () => {
    const part: DatEntrySource = {
      key: '3626cpx0_test',
      lines: [
        '0 !TEXMAP START PLANAR -13 0 10 13 0 10 -13 21 10 3626cpx0a.png',
        '0 !: 4 16 -13 0 -13 13 0 -13 13 21 -13 -13 21 -13',
        '0 !TEXMAP FALLBACK',
        '3 0 -4 8 -13 4 8 -13 0 12 -13',
        '0 !TEXMAP END',
      ],
    };

    // With texture available -> uses !TEXMAP geometry with projected UVs (top-left -> u=0,v=1; bottom-right -> u=1,v=0)
    const withTex = compileDatEntry(part, () => null, {
      lookupTexture: (name) => (name === '3626cpx0a.png' ? { texKey: 'tex_cpx0a' } : null),
    });
    expect(withTex).not.toBeNull();
    expect(withTex!.texBatches?.length).toBe(1);
    expect(withTex!.texBatches![0].texKey).toBe('tex_cpx0a');
    expect(withTex!.texBatches![0].tris.length / 9).toBe(2);
    // Vertex 0 is (-13, 0, -13) -> u=0, v=1 (top-left in OpenGL UV space)
    expect(withTex!.texBatches![0].uvs[0]).toBeCloseTo(0, 4);
    expect(withTex!.texBatches![0].uvs[1]).toBeCloseTo(1, 4);

    // Without texture -> keeps FALLBACK polygon (1 black triangle)
    const withoutTex = compileDatEntry(part, () => null);
    expect(withoutTex).not.toBeNull();
    expect(withoutTex!.texBatches).toBeUndefined();
    expect(withoutTex!.tris.length / 9).toBe(1);
    expect(Array.from(withoutTex!.triCols!)).toEqual([0]);
  });

  it('preserves direct RGB 0x2RRGGBB colors in Int32Array triCols and never confuses negative IDs with direct RGB', () => {
    const part: DatEntrySource = {
      key: 'direct_rgb_face',
      lines: ['3 0x2FF8844 0 0 -13 5 0 -13 0 5 -13'],
    };
    const mesh = compileDatEntry(part, () => null);
    expect(mesh).not.toBeNull();
    expect(mesh!.triCols).toBeInstanceOf(Int32Array);
    expect(mesh!.triCols![0]).toBe(0x2ff8844);

    expect(isDirectRgbColor(0x2000000)).toBe(true);
    expect(isDirectRgbColor(0x2ff8844)).toBe(true);
    expect(isDirectRgbColor(0x2ffffff)).toBe(true);
    expect(isDirectRgbColor(-1)).toBe(false);
    expect(isDirectRgbColor(-2)).toBe(false);
    expect(isDirectRgbColor(0)).toBe(false);
    expect(isDirectRgbColor(15)).toBe(false);
    expect(isDirectRgbColor(16)).toBe(false);
    expect(isDirectRgbColor(0x3000000)).toBe(false);
  });

  it('treats BrickLink Studio model2.ldr -1/-2 color codes as inherited main color (16) instead of leaking white', () => {
    const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const subfile: DatEntrySource = {
      key: 's/sub_panel',
      lines: [
        '3 -1 0 0 0 10 0 0 0 10 0',
        '4 -1 0 0 0 10 0 0 10 0 10 0 0 10',
      ],
    };
    const studioBrick: DatEntrySource = {
      key: 'studio_brick_3001',
      lines: [
        '0 Brick 2 x 4',
        '0 IsSubModel False',
        '1 -1 0 0 0 1 0 0 0 1 0 0 0 1 s/sub_panel.dat',
        '3 -1 0 24 0 20 24 0 0 24 20',
        '4 -2 0 0 0 20 0 0 20 24 0 0 24 0',
        '0 PE_TEX_PATH -1',
        `0 PE_TEX_INFO ${pngB64}`,
        '4 -1 0 0 20 20 0 20 20 24 20 0 24 20 0 1 1 1 1 0 0 0',
      ],
    };

    const mesh = compileDatEntry(studioBrick, (ref) => (ref === 's/sub_panel' ? subfile : null));
    expect(mesh).not.toBeNull();
    // All polygons inherit main brick color (16) -> no sub-color override array allocated!
    expect(mesh!.triCols).toBeNull();
    expect(mesh!.texBatches?.length).toBe(1);
    expect(mesh!.texBatches![0].triCols).toBeNull();

    // Nested subfile placed with an explicit sub-color (Red = 4) must pass 4 down to -1 polygons
    const redAccentPart: DatEntrySource = {
      key: 'studio_red_accent',
      lines: ['1 4 0 0 0 1 0 0 0 1 0 0 0 1 s/sub_panel.dat'],
    };
    const accentMesh = compileDatEntry(redAccentPart, (ref) => (ref === 's/sub_panel' ? subfile : null));
    expect(accentMesh).not.toBeNull();
    expect(accentMesh!.triCols).toBeInstanceOf(Int32Array);
    expect(Array.from(accentMesh!.triCols!)).toEqual([4, 4, 4]);
  });
});

describe('textureStore — embedded PNG deduplication and scanning', () => {
  it('deduplicates identical base64 PNGs, extracts PE_TEX_INFO lines, and resolves named textures', () => {
    textureStore.clearAll();
    const b64A = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const b64B = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    expect(hashTextureBase64(b64A)).toBe(hashTextureBase64(b64A));
    expect(hashTextureBase64(b64A)).not.toBe(hashTextureBase64(b64B));

    expect(extractBase64FromPeTexInfoLine(`0 PE_TEX_INFO ${b64A}`)).toBe(b64A);
    expect(
      extractBase64FromPeTexInfoLine(`0 PE_TEX_INFO 0 0 0 1 0 0 0 1 0 0 0 1 -1 -1 1 1 ${b64B}`),
    ).toBe(b64B);

    const scanned = textureStore.scanDatLinesForTextures([
      '0 PE_TEX_PATH 1',
      `0 PE_TEX_INFO ${b64A}`,
      '0 PE_TEX_PATH 2',
      `0 PE_TEX_INFO ${b64A}`,
    ]);
    expect(scanned.length).toBe(2);
    expect(scanned[0]).toBe(scanned[1]);
    expect(textureStore.size).toBe(1);

    const namedKey = textureStore.registerBase64Texture(b64B, {
      name: 'ldraw/parts/textures/3626cpx0a.png',
      source: 'embedded',
    });
    expect(namedKey).not.toBeNull();
    expect(normalizeTextureName('ldraw\\parts\\textures\\3626cpx0a.png')).toBe('3626cpx0a.png');
    expect(textureStore.lookupByName('3626cpx0a.png')?.texKey).toBe(namedKey);
    textureStore.clearAll();
  });

  it('extracts and deduplicates PNG filenames from LDraw !TEXMAP START and NEXT directives', () => {
    const names = extractTexmapTextureNamesFromLines([
      '0 Minifig Head with !TEXMAP',
      '0 !TEXMAP START PLANAR -13 0 10 13 0 10 -13 21 10 3626cpx0a.png',
      '0 !: 1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/3626cpx0s01.dat',
      '0 !TEXMAP NEXT CYLINDRICAL 0 0 0 0 -24 0 0 0 -10 180 "textures/3626cpx0b.png" GLOSSMAP g.png',
      '0 !TEXMAP START SPHERICAL 0 0 0 0 -10 0 0 0 -10 180 90 parts\\textures\\3626cpx0a.png',
      '0 !TEXMAP END',
    ]);
    expect(names).toEqual(['3626cpx0a.png', '3626cpx0b.png']);
  });
});

describe('compileDatEntry — smooth circular studs & crease-angle vertex normals', () => {
  it('emits 24-sided circular studs (solid and hollow) for normal parts and adapts on huge baseplates', () => {
    const solidStud = compileDatEntry(
      { key: 'stud_solid', lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud.dat'] },
      () => null,
    );
    expect(solidStud).not.toBeNull();
    // 24 segments: 24 * 2 side tris + 24 top cap tris = 72 tris, 48 rim edges (24 top + 24 base), 24 vertical silhouette condEdges
    expect(solidStud!.tris.length / 9).toBe(72);
    expect(solidStud!.edges.length / 6).toBe(48);
    expect(solidStud!.condEdges?.length ?? 0).toBe(24 * 12);

    const hollowStud = compileDatEntry(
      { key: 'stud_hollow', lines: ['1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud2.dat'] },
      () => null,
    );
    expect(hollowStud).not.toBeNull();
    // 24 segments: 24 * (2 outer + 2 top rim + 2 inner) = 144 tris, 48 rim edges (24 top + 24 base), 24 vertical silhouette condEdges
    expect(hollowStud!.tris.length / 9).toBe(144);
    expect(hollowStud!.edges.length / 6).toBe(48);
    expect(hollowStud!.condEdges?.length ?? 0).toBe(24 * 12);

    // 16x16 baseplate (256 studs) steps down to 16 segments to stay well inside budgets
    const baseplateLines: string[] = [];
    for (let ix = 0; ix < 16; ix++) {
      for (let iz = 0; iz < 16; iz++) {
        baseplateLines.push(`1 16 ${ix * 20} 0 ${iz * 20} 1 0 0 0 1 0 0 0 1 stud.dat`);
      }
    }
    const baseplate = compileDatEntry({ key: 'baseplate_16x16', lines: baseplateLines }, () => null);
    expect(baseplate).not.toBeNull();
    expect(baseplate!.tris.length / 9).toBe(256 * 48);
  });

  it('computes smooth radial per-vertex normals on curved cylinders while keeping 90-degree top caps crisp', () => {
    const cyl = compileDatEntry(
      {
        key: 'round_cyl',
        lines: [
          '1 16 0 0 0 10 0 0 0 24 0 0 0 10 4-4cyli.dat',
          '1 16 0 0 0 10 0 0 0 1 0 0 0 10 4-4disc.dat',
          '1 16 0 0 0 10 0 0 0 1 0 0 0 10 4-4edge.dat',
        ],
      },
      () => null,
    );
    expect(cyl).not.toBeNull();
    const T = cyl!.tris;
    const N = cyl!.norms;
    let foundSmoothSideTri = false;
    let checkedCapTris = 0;

    for (let i = 0; i < T.length; i += 9) {
      const ay = T[i + 1], by = T[i + 4], cy = T[i + 7];
      const isCap = Math.abs(ay) < 1e-3 && Math.abs(by) < 1e-3 && Math.abs(cy) < 1e-3;
      if (isCap) {
        checkedCapTris++;
        // Top disc cap must stay strictly vertical (|ny| == 1), never tilted toward the side wall
        expect(Math.abs(N[i + 1])).toBeCloseTo(1, 3);
        expect(Math.abs(N[i + 4])).toBeCloseTo(1, 3);
        expect(Math.abs(N[i + 7])).toBeCloseTo(1, 3);
      } else {
        // Side wall triangles must have horizontal normals that vary across vertices along the arc
        expect(Math.abs(N[i + 1])).toBeLessThan(1e-3);
        const dotAB = N[i] * N[i + 3] + N[i + 1] * N[i + 4] + N[i + 2] * N[i + 5];
        const dotAC = N[i] * N[i + 6] + N[i + 1] * N[i + 7] + N[i + 2] * N[i + 8];
        if (dotAB < 0.99 || dotAC < 0.99) {
          foundSmoothSideTri = true;
        }
      }
    }
    expect(checkedCapTris).toBe(16);
    expect(foundSmoothSideTri).toBe(true);
  });

  it('preserves crisp creases across shallow LDraw type-2 hard edges (e.g. 18-degree slopes)', () => {
    // Flat horizontal quad (y = 0, x in [-10, 0]) meeting an 18° slope (x in [0, 10])
    // along the shared type-2 hard edge at x = 0, y = 0, z in [-10, 10].
    const slopeDrop = 10 * Math.tan((18 * Math.PI) / 180);
    const part = compileDatEntry(
      {
        key: 'shallow_slope',
        lines: [
          '4 16 -10 0 -10  0 0 -10  0 0 10  -10 0 10',
          `4 16 0 0 -10  10 ${slopeDrop} -10  10 ${slopeDrop} 10  0 0 10`,
          '2 24 0 0 -10  0 0 10',
        ],
      },
      () => null,
    );
    expect(part).not.toBeNull();
    const T = part!.tris;
    const N = part!.norms;
    // First 2 triangles belong to the flat horizontal quad: all vertex normals must stay pure vertical
    for (let t = 0; t < 2; t++) {
      for (let v = 0; v < 3; v++) {
        const idx = t * 9 + v * 3;
        expect(Math.abs(N[idx])).toBeLessThan(1e-4);
        expect(Math.abs(N[idx + 1])).toBeCloseTo(1, 4);
      }
    }
    // Next 2 triangles belong to the 18° slope: all vertex normals must stay tilted by ~18°
    const expectedSin18 = Math.sin((18 * Math.PI) / 180);
    for (let t = 2; t < 4; t++) {
      for (let v = 0; v < 3; v++) {
        const idx = t * 9 + v * 3;
        expect(Math.abs(N[idx])).toBeCloseTo(expectedSin18, 3);
      }
    }
    expect(T.length / 9).toBe(4);
  });
});

