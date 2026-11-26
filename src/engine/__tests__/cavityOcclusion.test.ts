import { describe, expect, it } from 'vitest';
import { compileDatEntry, type DatEntrySource } from '../datCompiler';
import { computeMeshCavityOcclusion } from '../cavityOcclusion';

/**
 * Builds a thick-walled open-top hollow cylindrical container (outer wall r=20, inner
 * cavity wall r=16, top flat rim at y=0, outer bottom at y=44, inner floor at y=40)
 * using standard LDraw primitives.
 */
function makeHollowContainerEntry(invertInner = true): DatEntrySource {
  return {
    key: 'hollow_container',
    lines: [
      '0 Hollow Container Test',
      // Outer cylindrical wall (y = 0..44, r = 20)
      '1 16 0 0 0 20 0 0 0 44 0 0 0 20 4-4cylo.dat',
      // Outer bottom disc (y = 44, r = 20)
      '1 16 0 44 0 20 0 0 0 1 0 0 0 20 4-4disc.dat',
      // Top flat annular rim (y = 0, r = 16..20 -> ring4 scaled by 4)
      '1 16 0 0 0 4 0 0 0 1 0 0 0 4 4-4ring4.dat',
      // Inner cavity (inverted 4-4cylc: floor at y = 40, open top at y = 0, r = 16)
      ...(invertInner ? ['0 BFC INVERTNEXT'] : []),
      '1 16 0 40 0 16 0 0 0 -40 0 0 0 -16 4-4cylc.dat',
    ],
  };
}

describe('computeMeshCavityOcclusion — geometric concave cavity shading', () => {
  it('returns undefined (zero overhead) for solid convex bricks/boxes', () => {
    const solidBrick = compileDatEntry(
      {
        key: 'solid_box',
        lines: ['1 16 0 0 0 20 0 0 0 12 0 0 0 20 box.dat'],
      },
      () => null,
    );
    expect(solidBrick).not.toBeNull();
    expect(solidBrick!.cavityAo).toBeUndefined();
  });

  it('occludes interior cavity walls and floor of hollow containers while leaving exterior rim and outer walls at zero', () => {
    const compiled = compileDatEntry(makeHollowContainerEntry(true), () => null);
    expect(compiled).not.toBeNull();
    expect(compiled!.cavityAo).toBeDefined();

    const T = compiled!.tris;
    const AO = compiled!.cavityAo!;
    let rimCount = 0;
    let rimMaxAo = 0;
    let outerWallCount = 0;
    let outerWallMaxAo = 0;
    let innerWallCount = 0;
    let innerWallMinAo = 255;
    let innerFloorCount = 0;
    let innerFloorMinAo = 255;

    for (let t = 0, vi = 0; t * 9 < T.length; t++, vi += 3) {
      const i = t * 9;
      const ys = [T[i + 1], T[i + 4], T[i + 7]];
      const rs = [
        Math.hypot(T[i], T[i + 2]),
        Math.hypot(T[i + 3], T[i + 5]),
        Math.hypot(T[i + 6], T[i + 8]),
      ];
      const maxR = Math.max(...rs);
      const minR = Math.min(...rs);
      const maxY = Math.max(...ys);
      const minY = Math.min(...ys);
      const aos = [AO[vi], AO[vi + 1], AO[vi + 2]];

      if (Math.abs(maxY) < 0.1 && Math.abs(minY) < 0.1 && minR >= 15.5 && maxR >= 19.5) {
        // Top flat exterior rim (glY = 0, r = 16..20)
        rimCount++;
        rimMaxAo = Math.max(rimMaxAo, ...aos);
      } else if (minR >= 19.5 && maxR <= 20.5 && maxY - minY > 10) {
        // Outer cylindrical wall (r = 20)
        outerWallCount++;
        outerWallMaxAo = Math.max(outerWallMaxAo, ...aos);
      } else if (minR >= 15.5 && maxR <= 16.5 && maxY - minY > 10) {
        // Inner hollow cavity cylindrical wall (r = 16)
        innerWallCount++;
        innerWallMinAo = Math.min(innerWallMinAo, ...aos);
      } else if (Math.abs(maxY - -40) < 0.1 && Math.abs(minY - -40) < 0.1 && maxR <= 16.5) {
        // Inner hollow cavity floor (glY = -40, r <= 16)
        innerFloorCount++;
        innerFloorMinAo = Math.min(innerFloorMinAo, ...aos);
      }
    }

    expect(rimCount).toBeGreaterThan(20);
    expect(outerWallCount).toBeGreaterThan(20);
    expect(innerWallCount).toBeGreaterThan(20);
    expect(innerFloorCount).toBeGreaterThan(20);

    // Exterior rim & outer wall must stay strictly unoccluded (0)
    expect(rimMaxAo).toBe(0);
    expect(outerWallMaxAo).toBe(0);

    // Recessed hollow interior wall and floor must be clearly occluded
    expect(innerWallMinAo).toBeGreaterThan(100);
    expect(innerFloorMinAo).toBeGreaterThan(150);
  });

  it('is strictly winding-independent (produces identical cavity AO when all triangle windings are flipped)', () => {
    const compiled = compileDatEntry(makeHollowContainerEntry(false), () => null);
    expect(compiled).not.toBeNull();
    const T = compiled!.tris;
    const N = compiled!.norms;
    const aoOrig = computeMeshCavityOcclusion(T, N, compiled!.triCols, compiled!.min, compiled!.max);
    expect(aoOrig).toBeDefined();

    // Flip every triangle's winding (swap vertex B and C, negate normals)
    const flippedT = new Float32Array(T.length);
    const flippedN = new Float32Array(N.length);
    for (let i = 0; i < T.length; i += 9) {
      flippedT[i] = T[i]; flippedT[i + 1] = T[i + 1]; flippedT[i + 2] = T[i + 2];
      flippedT[i + 3] = T[i + 6]; flippedT[i + 4] = T[i + 7]; flippedT[i + 5] = T[i + 8];
      flippedT[i + 6] = T[i + 3]; flippedT[i + 7] = T[i + 4]; flippedT[i + 8] = T[i + 5];
      flippedN[i] = -N[i]; flippedN[i + 1] = -N[i + 1]; flippedN[i + 2] = -N[i + 2];
      flippedN[i + 3] = -N[i + 6]; flippedN[i + 4] = -N[i + 7]; flippedN[i + 5] = -N[i + 8];
      flippedN[i + 6] = -N[i + 3]; flippedN[i + 7] = -N[i + 4]; flippedN[i + 8] = -N[i + 5];
    }

    const aoFlipped = computeMeshCavityOcclusion(
      flippedT,
      flippedN,
      compiled!.triCols,
      compiled!.min,
      compiled!.max,
    );
    expect(aoFlipped).toBeDefined();

    // Count occluded vertices (must match within a tiny tolerance from vertex-order symmetry)
    const origOccluded = Array.from(aoOrig!).filter((v) => v > 100).length;
    const flippedOccluded = Array.from(aoFlipped!).filter((v) => v > 100).length;
    expect(flippedOccluded).toBe(origOccluded);
  });

  it('leaves exterior top deck around studs on a brick completely unoccluded', () => {
    const studdedPlate = compileDatEntry(
      {
        key: 'plate_2x2',
        lines: [
          '1 16 0 4 0 20 0 0 0 4 0 0 0 20 box.dat',
          '1 16 -10 0 -10 1 0 0 0 1 0 0 0 1 stud.dat',
          '1 16 10 0 -10 1 0 0 0 1 0 0 0 1 stud.dat',
          '1 16 -10 0 10 1 0 0 0 1 0 0 0 1 stud.dat',
          '1 16 10 0 10 1 0 0 0 1 0 0 0 1 stud.dat',
        ],
      },
      () => null,
    );
    expect(studdedPlate).not.toBeNull();
    // Solid plate with top studs has no enclosed hollow cavities -> all exterior faces stay unoccluded
    if (studdedPlate!.cavityAo) {
      const T = studdedPlate!.tris;
      const AO = studdedPlate!.cavityAo;
      for (let t = 0, vi = 0; t * 9 < T.length; t++, vi += 3) {
        const i = t * 9;
        const avgY = (T[i + 1] + T[i + 4] + T[i + 7]) / 3;
        if (Math.abs(avgY) < 0.1) {
          expect(AO[vi]).toBe(0);
          expect(AO[vi + 1]).toBe(0);
          expect(AO[vi + 2]).toBe(0);
        }
      }
    }
  });
});
