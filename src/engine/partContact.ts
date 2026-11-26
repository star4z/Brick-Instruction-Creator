import type { Mat3, Vec3, WorldBox } from './minifigPose';

/** Compact local-space axis-aligned sub-box: [minX, minY, minZ, maxX, maxY, maxZ]. */
export type LocalBox6 = readonly [number, number, number, number, number, number];

export interface TriangleMeshSource {
  tris: Float32Array;
}

const CELL_TARGET_XZ = 10; // Half a stud (1 stud = 20 LDU)
const CELL_TARGET_Y = 8;   // 1 plate (1 plate = 8 LDU)
const MAX_GRID_X = 18;
const MAX_GRID_Y = 14;
const MAX_GRID_Z = 18;
const INTERNAL_SHRINK_EPS = 0.35;

/**
 * Exact Akenine-Möller Triangle-vs-AABB Separating Axis Theorem (SAT) test.
 * Zero allocations; determines whether triangle (v0, v1, v2) intersects box [bMin, bMax].
 */
function triIntersectsBox(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number,
): boolean {
  const hx = (maxX - minX) * 0.5;
  const hy = (maxY - minY) * 0.5;
  const hz = (maxZ - minZ) * 0.5;
  const mx = (minX + maxX) * 0.5;
  const my = (minY + maxY) * 0.5;
  const mz = (minZ + maxZ) * 0.5;

  // Translate triangle into box-centered coordinates
  const v0x = ax - mx, v0y = ay - my, v0z = az - mz;
  const v1x = bx - mx, v1y = by - my, v1z = bz - mz;
  const v2x = cx - mx, v2y = cy - my, v2z = cz - mz;

  // 1. Box face normals (X, Y, Z) with epsilon for coplanar outer-boundary faces
  if (Math.min(v0x, v1x, v2x) > hx + 1e-4 || Math.max(v0x, v1x, v2x) < -hx - 1e-4) return false;
  if (Math.min(v0y, v1y, v2y) > hy + 1e-4 || Math.max(v0y, v1y, v2y) < -hy - 1e-4) return false;
  if (Math.min(v0z, v1z, v2z) > hz + 1e-4 || Math.max(v0z, v1z, v2z) < -hz - 1e-4) return false;

  // Triangle edges
  const e0x = v1x - v0x, e0y = v1y - v0y, e0z = v1z - v0z;
  const e1x = v2x - v1x, e1y = v2y - v1y, e1z = v2z - v1z;
  const e2x = v0x - v2x, e2y = v0y - v2y, e2z = v0z - v2z;

  // 2. Triangle plane vs AABB (scale tolerance by normal magnitude for Float32 precision on large faces)
  const nx = e0y * e1z - e0z * e1y;
  const ny = e0z * e1x - e0x * e1z;
  const nz = e0x * e1y - e0y * e1x;
  const d = nx * v0x + ny * v0y + nz * v0z;
  const nMag = Math.abs(nx) + Math.abs(ny) + Math.abs(nz);
  const rPlane = hx * Math.abs(nx) + hy * Math.abs(ny) + hz * Math.abs(nz);
  if (Math.abs(d) > rPlane + 1e-4 * nMag + 1e-6) return false;

  // 3. 9 edge cross-product axes
  const axisTest = (ax0: number, ax1: number, ax2: number): boolean => {
    const p0 = ax0 * v0x + ax1 * v0y + ax2 * v0z;
    const p1 = ax0 * v1x + ax1 * v1y + ax2 * v1z;
    const p2 = ax0 * v2x + ax1 * v2y + ax2 * v2z;
    const aMag = Math.abs(ax0) + Math.abs(ax1) + Math.abs(ax2);
    const tol = 1e-4 * aMag + 1e-6;
    const r = hx * Math.abs(ax0) + hy * Math.abs(ax1) + hz * Math.abs(ax2);
    return Math.min(p0, p1, p2) <= r + tol && Math.max(p0, p1, p2) >= -r - tol;
  };

  // Edge 0 x {X, Y, Z}
  if (!axisTest(0, -e0z, e0y)) return false;
  if (!axisTest(e0z, 0, -e0x)) return false;
  if (!axisTest(-e0y, e0x, 0)) return false;
  // Edge 1 x {X, Y, Z}
  if (!axisTest(0, -e1z, e1y)) return false;
  if (!axisTest(e1z, 0, -e1x)) return false;
  if (!axisTest(-e1y, e1x, 0)) return false;
  // Edge 2 x {X, Y, Z}
  if (!axisTest(0, -e2z, e2y)) return false;
  if (!axisTest(e2z, 0, -e2x)) return false;
  if (!axisTest(-e2y, e2x, 0)) return false;

  return true;
}

/**
 * Builds a compact list of local-space tight axis-aligned sub-boxes covering a
 * compiled part's actual solid geometry (triangles + optional skipped underside
 * anti-stud tubes).
 *
 * Returns `undefined` for convex/compact parts whose solid volume already fills
 * >= 90% of their outer AABB (so simple bricks/plates incur zero narrow-phase
 * overhead), and returns 2..N tight sub-boxes for concave parts such as:
 * - T-shaped / U-shaped train wheel holders
 * - L-shaped bogie side plates, brackets, and corner plates
 * - Arches, window/door frames, panels, mudguards, and slopes
 */
export function buildLocalSubBoxes(
  tris: Float32Array,
  boundsMin: Vec3,
  boundsMax: Vec3,
  extraBoxes?: readonly LocalBox6[],
  extraMeshes?: readonly TriangleMeshSource[],
): LocalBox6[] | undefined {
  const minX = boundsMin[0], minY = boundsMin[1], minZ = boundsMin[2];
  const maxX = boundsMax[0], maxY = boundsMax[1], maxZ = boundsMax[2];
  const dx = maxX - minX;
  const dy = maxY - minY;
  const dz = maxZ - minZ;

  // Tiny 1x1 parts cannot host meaningful multi-stud concave cutouts
  if (Math.max(dx, dz) <= 22 && dy <= 28) return undefined;
  if (dx <= 1e-3 || dy <= 1e-3 || dz <= 1e-3) return undefined;

  const nx = Math.max(1, Math.min(MAX_GRID_X, Math.ceil(dx / CELL_TARGET_XZ)));
  const ny = Math.max(1, Math.min(MAX_GRID_Y, Math.ceil(dy / CELL_TARGET_Y)));
  const nz = Math.max(1, Math.min(MAX_GRID_Z, Math.ceil(dz / CELL_TARGET_XZ)));
  if (nx * ny * nz <= 1) return undefined;

  const sx = dx / nx;
  const sy = dy / ny;
  const sz = dz / nz;
  const totalCells = nx * ny * nz;

  const occ = new Uint8Array(totalCells);
  const cMinX = new Float32Array(totalCells);
  const cMinY = new Float32Array(totalCells);
  const cMinZ = new Float32Array(totalCells);
  const cMaxX = new Float32Array(totalCells);
  const cMaxY = new Float32Array(totalCells);
  const cMaxZ = new Float32Array(totalCells);
  cMinX.fill(Infinity);
  cMinY.fill(Infinity);
  cMinZ.fill(Infinity);
  cMaxX.fill(-Infinity);
  cMaxY.fill(-Infinity);
  cMaxZ.fill(-Infinity);

  const cellIndex = (ix: number, iy: number, iz: number) => (iy * nz + iz) * nx + ix;

  const markCellBounds = (
    ix: number, iy: number, iz: number,
    bx0: number, by0: number, bz0: number,
    bx1: number, by1: number, bz1: number,
  ) => {
    const cx0 = minX + ix * sx, cx1 = ix === nx - 1 ? maxX : cx0 + sx;
    const cy0 = minY + iy * sy, cy1 = iy === ny - 1 ? maxY : cy0 + sy;
    const cz0 = minZ + iz * sz, cz1 = iz === nz - 1 ? maxZ : cz0 + sz;
    const lx0 = bx0 > cx0 ? bx0 : cx0;
    const ly0 = by0 > cy0 ? by0 : cy0;
    const lz0 = bz0 > cz0 ? bz0 : cz0;
    const lx1 = bx1 < cx1 ? bx1 : cx1;
    const ly1 = by1 < cy1 ? by1 : cy1;
    const lz1 = bz1 < cz1 ? bz1 : cz1;
    const idx = cellIndex(ix, iy, iz);
    occ[idx] = 1;
    if (lx0 < cMinX[idx]) cMinX[idx] = lx0;
    if (ly0 < cMinY[idx]) cMinY[idx] = ly0;
    if (lz0 < cMinZ[idx]) cMinZ[idx] = lz0;
    if (lx1 > cMaxX[idx]) cMaxX[idx] = lx1;
    if (ly1 > cMaxY[idx]) cMaxY[idx] = ly1;
    if (lz1 > cMaxZ[idx]) cMaxZ[idx] = lz1;
  };

  const rasterizeTris = (arr: Float32Array) => {
    for (let t = 0; t + 8 < arr.length; t += 9) {
      const ax = arr[t], ay = arr[t + 1], az = arr[t + 2];
      const bx = arr[t + 3], by = arr[t + 4], bz = arr[t + 5];
      const cx = arr[t + 6], cy = arr[t + 7], cz = arr[t + 8];
      const tx0 = Math.min(ax, bx, cx), tx1 = Math.max(ax, bx, cx);
      const ty0 = Math.min(ay, by, cy), ty1 = Math.max(ay, by, cy);
      const tz0 = Math.min(az, bz, cz), tz1 = Math.max(az, bz, cz);

      const ix0 = Math.max(0, Math.min(nx - 1, Math.floor((tx0 - minX) / sx)));
      const ix1 = Math.max(0, Math.min(nx - 1, Math.floor((tx1 - minX) / sx)));
      const iy0 = Math.max(0, Math.min(ny - 1, Math.floor((ty0 - minY) / sy)));
      const iy1 = Math.max(0, Math.min(ny - 1, Math.floor((ty1 - minY) / sy)));
      const iz0 = Math.max(0, Math.min(nz - 1, Math.floor((tz0 - minZ) / sz)));
      const iz1 = Math.max(0, Math.min(nz - 1, Math.floor((tz1 - minZ) / sz)));

      // Fast path: triangle lies completely within a single cell
      if (ix0 === ix1 && iy0 === iy1 && iz0 === iz1) {
        markCellBounds(ix0, iy0, iz0, tx0, ty0, tz0, tx1, ty1, tz1);
        continue;
      }

      let hitAny = false;
      for (let iy = iy0; iy <= iy1; iy++) {
        const cy0 = minY + iy * sy;
        const cy1 = iy === ny - 1 ? maxY : cy0 + sy;
        const sy0 = iy > 0 ? cy0 + INTERNAL_SHRINK_EPS : cy0;
        const sy1 = iy < ny - 1 ? cy1 - INTERNAL_SHRINK_EPS : cy1;
        if (ty1 < sy0 || ty0 > sy1) continue;

        for (let iz = iz0; iz <= iz1; iz++) {
          const cz0 = minZ + iz * sz;
          const cz1 = iz === nz - 1 ? maxZ : cz0 + sz;
          const sz0 = iz > 0 ? cz0 + INTERNAL_SHRINK_EPS : cz0;
          const sz1 = iz < nz - 1 ? cz1 - INTERNAL_SHRINK_EPS : cz1;
          if (tz1 < sz0 || tz0 > sz1) continue;

          for (let ix = ix0; ix <= ix1; ix++) {
            const cx0 = minX + ix * sx;
            const cx1 = ix === nx - 1 ? maxX : cx0 + sx;
            const sx0 = ix > 0 ? cx0 + INTERNAL_SHRINK_EPS : cx0;
            const sx1 = ix < nx - 1 ? cx1 - INTERNAL_SHRINK_EPS : cx1;
            if (tx1 < sx0 || tx0 > sx1) continue;

            if (triIntersectsBox(ax, ay, az, bx, by, bz, cx, cy, cz, sx0, sy0, sz0, sx1, sy1, sz1)) {
              markCellBounds(ix, iy, iz, tx0, ty0, tz0, tx1, ty1, tz1);
              hitAny = true;
            }
          }
        }
      }

      // Fallback for a zero-thickness sheet lying exactly on an internal grid divider:
      // assign its clamped zero-thickness bounds so no real thin feature is dropped,
      // while keeping zero protrusion into adjacent empty space.
      if (!hitAny) {
        const midX = (tx0 + tx1) * 0.5;
        const midY = (ty0 + ty1) * 0.5;
        const midZ = (tz0 + tz1) * 0.5;
        const fx = Math.max(0, Math.min(nx - 1, Math.floor((midX - minX - 1e-4) / sx)));
        const fy = Math.max(0, Math.min(ny - 1, Math.floor((midY - minY - 1e-4) / sy)));
        const fz = Math.max(0, Math.min(nz - 1, Math.floor((midZ - minZ - 1e-4) / sz)));
        markCellBounds(fx, fy, fz, tx0, ty0, tz0, tx1, ty1, tz1);
      }
    }
  };

  rasterizeTris(tris);
  if (extraMeshes) {
    for (const m of extraMeshes) {
      if (m.tris.length > 0) rasterizeTris(m.tris);
    }
  }

  // Include skipped underside anti-stud boxes (stud3/stud4) so brick/plate undersides
  // always register solid clutch contact at every tube location.
  if (extraBoxes) {
    for (const eb of extraBoxes) {
      const [bx0, by0, bz0, bx1, by1, bz1] = eb;
      const ix0 = Math.max(0, Math.min(nx - 1, Math.floor((bx0 - minX) / sx)));
      const ix1 = Math.max(0, Math.min(nx - 1, Math.floor((bx1 - minX) / sx)));
      const iy0 = Math.max(0, Math.min(ny - 1, Math.floor((by0 - minY) / sy)));
      const iy1 = Math.max(0, Math.min(ny - 1, Math.floor((by1 - minY) / sy)));
      const iz0 = Math.max(0, Math.min(nz - 1, Math.floor((bz0 - minZ) / sz)));
      const iz1 = Math.max(0, Math.min(nz - 1, Math.floor((bz1 - minZ) / sz)));
      for (let iy = iy0; iy <= iy1; iy++) {
        for (let iz = iz0; iz <= iz1; iz++) {
          for (let ix = ix0; ix <= ix1; ix++) {
            const cx0 = minX + ix * sx, cx1 = ix === nx - 1 ? maxX : cx0 + sx;
            const cy0 = minY + iy * sy, cy1 = iy === ny - 1 ? maxY : cy0 + sy;
            const cz0 = minZ + iz * sz, cz1 = iz === nz - 1 ? maxZ : cz0 + sz;
            const sx0 = ix > 0 ? cx0 + INTERNAL_SHRINK_EPS : cx0;
            const sx1 = ix < nx - 1 ? cx1 - INTERNAL_SHRINK_EPS : cx1;
            const sy0 = iy > 0 ? cy0 + INTERNAL_SHRINK_EPS : cy0;
            const sy1 = iy < ny - 1 ? cy1 - INTERNAL_SHRINK_EPS : cy1;
            const sz0 = iz > 0 ? cz0 + INTERNAL_SHRINK_EPS : cz0;
            const sz1 = iz < nz - 1 ? cz1 - INTERNAL_SHRINK_EPS : cz1;
            if (bx1 >= sx0 && bx0 <= sx1 && by1 >= sy0 && by0 <= sy1 && bz1 >= sz0 && bz0 <= sz1) {
              markCellBounds(ix, iy, iz, bx0, by0, bz0, bx1, by1, bz1);
            }
          }
        }
      }
    }
  }

  // Enclosed-cavity fill: mark empty interior cells enclosed on all 4 horizontal sides
  // with a ceiling above (e.g. hollow underside of standard bricks/plates without stud4),
  // while leaving all open exterior notches (T-shaped wheel holders, L-brackets, corner
  // plates, arches, frames) completely empty!
  const toFill: number[] = [];
  for (let iy = 0; iy < ny - 1; iy++) {
    for (let iz = 1; iz < nz - 1; iz++) {
      for (let ix = 1; ix < nx - 1; ix++) {
        const idx = cellIndex(ix, iy, iz);
        if (occ[idx]) continue;
        let hasAbove = false;
        for (let y2 = iy + 1; y2 < ny; y2++) {
          if (occ[cellIndex(ix, y2, iz)]) { hasAbove = true; break; }
        }
        if (!hasAbove) continue;
        let hasNegX = false, hasPosX = false, hasNegZ = false, hasPosZ = false;
        for (let x2 = 0; x2 < ix; x2++) if (occ[cellIndex(x2, iy, iz)]) { hasNegX = true; break; }
        if (!hasNegX) continue;
        for (let x2 = ix + 1; x2 < nx; x2++) if (occ[cellIndex(x2, iy, iz)]) { hasPosX = true; break; }
        if (!hasPosX) continue;
        for (let z2 = 0; z2 < iz; z2++) if (occ[cellIndex(ix, iy, z2)]) { hasNegZ = true; break; }
        if (!hasNegZ) continue;
        for (let z2 = iz + 1; z2 < nz; z2++) if (occ[cellIndex(ix, iy, z2)]) { hasPosZ = true; break; }
        if (!hasPosZ) continue;
        toFill.push(idx);
      }
    }
  }
  for (const idx of toFill) {
    const iy = Math.floor(idx / (nx * nz));
    const rem = idx - iy * nx * nz;
    const iz = Math.floor(rem / nx);
    const ix = rem - iz * nx;
    const cx0 = minX + ix * sx, cx1 = ix === nx - 1 ? maxX : cx0 + sx;
    const cy0 = minY + iy * sy, cy1 = iy === ny - 1 ? maxY : cy0 + sy;
    const cz0 = minZ + iz * sz, cz1 = iz === nz - 1 ? maxZ : cz0 + sz;
    occ[idx] = 1;
    cMinX[idx] = cx0; cMinY[idx] = cy0; cMinZ[idx] = cz0;
    cMaxX[idx] = cx1; cMaxY[idx] = cy1; cMaxZ[idx] = cz1;
  }

  // Check cell occupancy ratio vs outer AABB: solid/hollow convex bricks & plates
  // (whose outer surface + enclosed interior fill >= 90% of grid cells) collapse to
  // undefined (single AABB) for zero narrow-phase runtime overhead.
  let occCount = 0;
  for (let i = 0; i < totalCells; i++) {
    if (occ[i]) occCount++;
  }
  if (occCount === 0) return undefined;
  if (occCount / totalCells >= 0.90) return undefined;

  // Greedy 3D box merging of adjacent occupied cells with matching perpendicular bounds
  // so T-shaped / L-shaped parts collapse to ~2-12 exact tight sub-boxes!
  const used = new Uint8Array(totalCells);
  const merged: LocalBox6[] = [];
  const MERGE_TOL = 0.6;

  const approxEq = (a: number, b: number) => Math.abs(a - b) <= MERGE_TOL;

  for (let iy = 0; iy < ny; iy++) {
    for (let iz = 0; iz < nz; iz++) {
      for (let ix = 0; ix < nx; ix++) {
        const startIdx = cellIndex(ix, iy, iz);
        if (!occ[startIdx] || used[startIdx]) continue;

        let bx0 = cMinX[startIdx], by0 = cMinY[startIdx], bz0 = cMinZ[startIdx];
        let bx1 = cMaxX[startIdx], by1 = cMaxY[startIdx], bz1 = cMaxZ[startIdx];

        // Expand along +X while perpendicular Y/Z bounds match and X is contiguous
        let ex = ix;
        while (ex + 1 < nx) {
          const nIdx = cellIndex(ex + 1, iy, iz);
          if (
            !occ[nIdx] || used[nIdx] ||
            !approxEq(cMinY[nIdx], by0) || !approxEq(cMaxY[nIdx], by1) ||
            !approxEq(cMinZ[nIdx], bz0) || !approxEq(cMaxZ[nIdx], bz1) ||
            cMinX[nIdx] > bx1 + MERGE_TOL
          ) break;
          bx1 = Math.max(bx1, cMaxX[nIdx]);
          ex++;
        }

        // Expand along +Z across the full [ix..ex] strip
        let ez = iz;
        while (ez + 1 < nz) {
          let rowOk = true;
          let nextZ1 = bz1;
          for (let x = ix; x <= ex; x++) {
            const nIdx = cellIndex(x, iy, ez + 1);
            if (
              !occ[nIdx] || used[nIdx] ||
              !approxEq(cMinY[nIdx], by0) || !approxEq(cMaxY[nIdx], by1) ||
              (x === ix && !approxEq(cMinX[nIdx], bx0)) ||
              (x === ex && !approxEq(cMaxX[nIdx], bx1)) ||
              cMinZ[nIdx] > bz1 + MERGE_TOL
            ) {
              rowOk = false;
              break;
            }
            if (x === ix) nextZ1 = cMaxZ[nIdx];
            else if (!approxEq(cMaxZ[nIdx], nextZ1)) { rowOk = false; break; }
          }
          if (!rowOk) break;
          bz1 = Math.max(bz1, nextZ1);
          ez++;
        }

        // Expand along +Y across the full [ix..ex] x [iz..ez] slab
        let ey = iy;
        while (ey + 1 < ny) {
          let slabOk = true;
          let nextY1 = by1;
          for (let z = iz; z <= ez && slabOk; z++) {
            for (let x = ix; x <= ex; x++) {
              const nIdx = cellIndex(x, ey + 1, z);
              if (
                !occ[nIdx] || used[nIdx] ||
                (x === ix && !approxEq(cMinX[nIdx], bx0)) ||
                (x === ex && !approxEq(cMaxX[nIdx], bx1)) ||
                (z === iz && !approxEq(cMinZ[nIdx], bz0)) ||
                (z === ez && !approxEq(cMaxZ[nIdx], bz1)) ||
                cMinY[nIdx] > by1 + MERGE_TOL
              ) {
                slabOk = false;
                break;
              }
              if (x === ix && z === iz) nextY1 = cMaxY[nIdx];
              else if (!approxEq(cMaxY[nIdx], nextY1)) { slabOk = false; break; }
            }
          }
          if (!slabOk) break;
          by1 = Math.max(by1, nextY1);
          ey++;
        }

        for (let y = iy; y <= ey; y++) {
          for (let z = iz; z <= ez; z++) {
            for (let x = ix; x <= ex; x++) {
              used[cellIndex(x, y, z)] = 1;
            }
          }
        }
        merged.push([bx0, by0, bz0, bx1, by1, bz1]);
      }
    }
  }

  return merged.length > 1 ? merged : undefined;
}

/**
 * Exact O(1) Arvo center-extent transform of a local sub-box into a world-space AABB.
 */
export function transformLocalBox6ToWorld(
  box: LocalBox6,
  m: Mat3,
  ox: number,
  oy: number,
  oz: number,
): WorldBox {
  const cx = (box[0] + box[3]) * 0.5;
  const cy = (box[1] + box[4]) * 0.5;
  const cz = (box[2] + box[5]) * 0.5;
  const ex = (box[3] - box[0]) * 0.5;
  const ey = (box[4] - box[1]) * 0.5;
  const ez = (box[5] - box[2]) * 0.5;

  const wcx = m[0] * cx + m[1] * cy + m[2] * cz + ox;
  const wcy = m[3] * cx + m[4] * cy + m[5] * cz + oy;
  const wcz = m[6] * cx + m[7] * cy + m[8] * cz + oz;

  const wex = Math.abs(m[0]) * ex + Math.abs(m[1]) * ey + Math.abs(m[2]) * ez;
  const wey = Math.abs(m[3]) * ex + Math.abs(m[4]) * ey + Math.abs(m[5]) * ez;
  const wez = Math.abs(m[6]) * ex + Math.abs(m[7]) * ey + Math.abs(m[8]) * ez;

  return {
    min: [wcx - wex, wcy - wey, wcz - wez],
    max: [wcx + wex, wcy + wey, wcz + wez],
    center: [wcx, wcy, wcz],
  };
}

/**
 * Sideways flush-contact capability for non-interlocking (`ov < 1.5` on the contact axis)
 * grazing checks in `boxesPhysicallyTouchBasic`:
 * - `'none'` / `false`: Cannot connect via flush side-wall grazing (must use vertical stud
 *   stacking `ovX >= 3 && ovZ >= 3` or 3-axis interlocking `ovX, ovY, ovZ >= 1.5`).
 * - `'articulated'` / `true`: True flush/small-clearance connectors (clips, bars, hinges,
 *   magnets, couplers, buffers, ball/socket joints, Technic pins/axles, wheels, minifigures).
 * - `'snot_host_synth'`: Procedural-only (non-`.dat`) SNOT brick/bracket whose fallback box
 *   lacks 4 LDU side-stud geometry; may connect flush ONLY to `'sideways_plate'`, NEVER to
 *   another upright bracket/SNOT brick or wheel holder.
 * - `'sideways_plate'`: Sideways-rotated brick/plate/tile (`|m[4]| < 0.5`); may connect flush
 *   ONLY to `'snot_host_synth'`, NEVER edge-to-edge to another sideways plate/tile.
 */
export type SidewaysCap = boolean | 'none' | 'articulated' | 'snot_host_synth' | 'sideways_plate';

export interface SidewaysCapInput {
  partId: string;
  partName?: string;
  shape?: string;
  role: string;
  /** True when the part's local +Y stud axis is rotated sideways (`|m[4]| < 0.5`). */
  isSideways: boolean;
  /** True when compiled LDraw `.dat` mesh geometry (with real 4 LDU side studs) is available. */
  hasCompiledMesh: boolean;
}

/**
 * Classifies whether a part can participate in flush (non-interlocking) sideways contact.
 *
 * Crucially:
 * - `wheel_holder` parts (e.g. `38339` "Train Wheel Bogie With Pin Slots", `2878` "Train Wheel
 *   Bogie Single Axle") ALWAYS return `'none'` — wheels attach via the dedicated wheel<->holder
 *   rule, and Technic pins in motor pin holes engage via 3-axis interlocking (>= 1.5 LDU).
 * - Compiled `.dat` upright SNOT bricks and brackets (e.g. `44728`, `99207`, `99780`, `99781`,
 *   `87087`, `4733`) return `'none'` because their 4 LDU side studs already produce 3-axis
 *   interlocking (`ov >= 1.5`) when a sideways part genuinely snaps onto them, while sitting
 *   flush side-by-side next to another bracket or wheel holder must NEVER register as connected.
 */
export function classifySidewaysCapability(input: SidewaysCapInput): Exclude<SidewaysCap, boolean> {
  const { role, isSideways, hasCompiledMesh } = input;
  if (role === 'wheel_holder') return 'none';
  if (role === 'wheel' || role === 'axle' || role === 'pin' || role === 'figure') return 'articulated';

  const k = (input.partId || '').toLowerCase();
  const shape = input.shape || '';
  const name = (input.partName || '').toLowerCase();

  if (shape === 'clip_h' || shape === 'clip_v' || shape === 'bar' || shape === 'axle') {
    return 'articulated';
  }
  if (
    /\b(?:clip|hinge|bar|axle|handle|hook|grab|magnet|coupler|buffer|ball|socket|hose|antenna|lever)\b/.test(name) ||
    (/\bpin\b/.test(name) && !/slot|hole|brick|plate|tile|beam|liftarm|bogie|wheel\s*holder/.test(name))
  ) {
    return 'articulated';
  }
  if (/^(3937|3938|44302|63868|37494|92582|2429|2430|60475|15712|60470|6019|4085|29085)/.test(k)) {
    return 'articulated';
  }

  if (isSideways) return 'sideways_plate';

  if (!hasCompiledMesh) {
    if (
      shape === 'snot1' || shape === 'snot4' ||
      shape === 'bracket' || shape === 'bracket_inv' ||
      /\b(?:snot|bracket)\b/.test(name) ||
      /^(4070|87087|4733|47905|22885|99206|99207|99780|99781|44728|36840|36841)/.test(k)
    ) {
      return 'snot_host_synth';
    }
  }
  return 'none';
}

export function canFlushSidewaysConnect(
  capA: SidewaysCap,
  capB: SidewaysCap,
): boolean {
  if (!capA || !capB || capA === 'none' || capB === 'none') return false;
  if (capA === true && capB === true) return true;
  if (capA === 'articulated' && capB === 'articulated') return true;
  if (
    (capA === 'snot_host_synth' && capB === 'sideways_plate') ||
    (capA === 'sideways_plate' && capB === 'snot_host_synth')
  ) {
    return true;
  }
  return false;
}

function isHorizontalFastenerBox(role: string, box: WorldBox): boolean {
  if (role !== 'pin' && role !== 'axle') return false;
  const dx = box.max[0] - box.min[0];
  const dy = box.max[1] - box.min[1];
  const dz = box.max[2] - box.min[2];
  return Math.max(dx, dz) > dy * 1.15;
}

/**
 * Strict LEGO clutch contact check between two axis-aligned boxes:
 * - Train wheels attach ONLY to wheel holders, Technic axles, or Technic pins.
 * - Horizontal Technic pins/axles sit inside side holes (~2 LDU above deck studs) and
 *   NEVER attach vertically to floor plates below them — they require 3-axis interlocking
 *   (`ovX, ovY, ovZ >= 1.5`) or tight coaxial articulated contact.
 * - Upright bricks/plates/slopes/tiles connect via vertical stud footprint overlap
 *   (ovX >= 3 && ovZ >= 3), NOT by grazing smooth vertical side walls.
 * - Sideways contacts require either 3-axis interlocking (SNOT studs/pins/clips
 *   engaged >= 1.5 LDU) or compatible flush-mating sideways connectors.
 */
export function boxesPhysicallyTouchBasic(
  a: WorldBox,
  b: WorldBox,
  roleA: string,
  roleB: string,
  sideCapA: SidewaysCap = true,
  sideCapB: SidewaysCap = true,
): boolean {
  const isWheelPair = roleA === 'wheel' || roleB === 'wheel';
  const otherIsHolder =
    roleA === 'wheel_holder' || roleB === 'wheel_holder' ||
    roleA === 'axle' || roleB === 'axle' ||
    roleA === 'pin' || roleB === 'pin';
  if (isWheelPair && otherIsHolder) {
    const gx = Math.max(0, a.min[0] - b.max[0], b.min[0] - a.max[0]);
    const gy = Math.max(0, a.min[1] - b.max[1], b.min[1] - a.max[1]);
    const gz = Math.max(0, a.min[2] - b.max[2], b.min[2] - a.max[2]);
    return Math.max(gx, gy, gz) <= 6.0;
  }
  if (isWheelPair && !otherIsHolder) return false;

  const tol = 2.8;
  const gx = Math.max(0, a.min[0] - b.max[0], b.min[0] - a.max[0]);
  const gy = Math.max(0, a.min[1] - b.max[1], b.min[1] - a.max[1]);
  const gz = Math.max(0, a.min[2] - b.max[2], b.min[2] - a.max[2]);
  if (gx > tol || gy > tol || gz > tol) return false;

  const ovX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
  const ovY = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
  const ovZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);

  // Horizontal Technic pins/axles (and vertical pins) NEVER connect across an air gap
  // to floor plates/studs below them; they engage via genuine 3-axis hole/stud interlocking.
  const horizFastA = isHorizontalFastenerBox(roleA, a);
  const horizFastB = isHorizontalFastenerBox(roleB, b);
  if (horizFastA || horizFastB || roleA === 'pin' || roleB === 'pin') {
    if (ovX >= 1.5 && ovY >= 1.5 && ovZ >= 1.5) return true;
    if (!horizFastA && !horizFastB) {
      // Vertical pin: allow tight flush vertical seat (e.g. stud/hole on procedural box)
      if (ovX >= 3.0 && ovZ >= 3.0 && gy <= 0.6) return true;
    }
    if (ovY >= 1.5 && (ovX >= 1.5 || ovZ >= 1.5) && Math.max(gx, gz) <= 0.8) {
      return canFlushSidewaysConnect(sideCapA, sideCapB);
    }
    return false;
  }

  // 1. Vertical stud/tube stacking contact (overlapping horizontal footprint)
  if (ovX >= 3.0 && ovZ >= 3.0) return true;

  // 2. Sideways / SNOT / clip / hinge / Technic pin contact
  const goodAxes = (ovX >= 1.5 ? 1 : 0) + (ovY >= 1.5 ? 1 : 0) + (ovZ >= 1.5 ? 1 : 0);
  if (goodAxes < 2) return false;
  if (ovX >= 1.5 && ovY >= 1.5 && ovZ >= 1.5) return true;
  return canFlushSidewaysConnect(sideCapA, sideCapB);
}

/**
 * Concave-aware physical contact check:
 * 1. Broad-phase check on outer AABBs (instant O(1) rejection for non-adjacent parts).
 * 2. Fast pass for wheel<->holder/axle and figure<->figure pairs.
 * 3. Narrow-phase pairwise sub-box verification whenever either part is concave
 *    (has > 1 sub-box), rejecting false positives where one part merely sits inside
 *    the empty AABB notch of another (e.g. a Bogie Side Plate tucked into the side
 *    cutout of a T-shaped Train Wheel Holder, or a brick inside an L-bracket/arch).
 */
export function partsPhysicallyTouch(
  boxA: WorldBox,
  boxB: WorldBox,
  subBoxesA: readonly WorldBox[] | null | undefined,
  subBoxesB: readonly WorldBox[] | null | undefined,
  roleA: string,
  roleB: string,
  sideCapA: SidewaysCap = true,
  sideCapB: SidewaysCap = true,
): boolean {
  if (!boxesPhysicallyTouchBasic(boxA, boxB, roleA, roleB, sideCapA, sideCapB)) {
    return false;
  }

  // Wheel-to-holder/axle and minifigure-to-minifigure parts rely on outer-box snap clearances
  const isWheelPair = roleA === 'wheel' || roleB === 'wheel';
  if (isWheelPair) return true;
  if (roleA === 'figure' && roleB === 'figure') return true;

  const hasSubA = Boolean(subBoxesA && subBoxesA.length > 1);
  const hasSubB = Boolean(subBoxesB && subBoxesB.length > 1);
  if (!hasSubA && !hasSubB) return true;

  const listA = hasSubA ? subBoxesA! : [boxA];
  const listB = hasSubB ? subBoxesB! : [boxB];
  for (let i = 0; i < listA.length; i++) {
    const sa = listA[i];
    for (let j = 0; j < listB.length; j++) {
      if (boxesPhysicallyTouchBasic(sa, listB[j], roleA, roleB, sideCapA, sideCapB)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Computes minimum Euclidean gap between two parts' actual sub-box geometries
 * (and whether any sub-box pair has genuine vertical footprint overlap).
 */
export function minSubBoxGap(
  boxA: WorldBox,
  boxB: WorldBox,
  subBoxesA?: readonly WorldBox[] | null,
  subBoxesB?: readonly WorldBox[] | null,
): { gap: number; hasVerticalOverlap: boolean } {
  const listA = subBoxesA && subBoxesA.length > 1 ? subBoxesA : [boxA];
  const listB = subBoxesB && subBoxesB.length > 1 ? subBoxesB : [boxB];
  let bestGap = Infinity;
  let hasVert = false;
  for (let i = 0; i < listA.length; i++) {
    const sa = listA[i];
    for (let j = 0; j < listB.length; j++) {
      const sb = listB[j];
      const gx = Math.max(0, sa.min[0] - sb.max[0], sb.min[0] - sa.max[0]);
      const gy = Math.max(0, sa.min[1] - sb.max[1], sb.min[1] - sa.max[1]);
      const gz = Math.max(0, sa.min[2] - sb.max[2], sb.min[2] - sa.max[2]);
      const d = Math.hypot(gx, gy, gz);
      const ovX = Math.min(sa.max[0], sb.max[0]) - Math.max(sa.min[0], sb.min[0]);
      const ovZ = Math.min(sa.max[2], sb.max[2]) - Math.max(sa.min[2], sb.min[2]);
      const vert = ovX >= 3.0 && ovZ >= 3.0;
      if (d < bestGap - 1e-4 || (Math.abs(d - bestGap) <= 1e-4 && vert && !hasVert)) {
        bestGap = d;
        hasVert = vert;
      }
    }
  }
  return { gap: bestGap, hasVerticalOverlap: hasVert };
}

/**
 * Checks whether part `lower` has genuine horizontal (XZ) solid overlap with
 * part `upper` using sub-boxes when available, preventing concave cutouts from
 * creating false vertical prerequisites.
 */
function hasSolidHorizontalOverlap(
  lowerBox: WorldBox,
  upperBox: WorldBox,
  lowerSubs?: readonly WorldBox[] | null,
  upperSubs?: readonly WorldBox[] | null,
): boolean {
  const ovX = Math.min(upperBox.max[0], lowerBox.max[0]) - Math.max(upperBox.min[0], lowerBox.min[0]);
  const ovZ = Math.min(upperBox.max[2], lowerBox.max[2]) - Math.max(upperBox.min[2], lowerBox.min[2]);
  if (ovX < 3.0 || ovZ < 3.0) return false;

  const hasSubL = Boolean(lowerSubs && lowerSubs.length > 1);
  const hasSubU = Boolean(upperSubs && upperSubs.length > 1);
  if (!hasSubL && !hasSubU) return true;

  const listL = hasSubL ? lowerSubs! : [lowerBox];
  const listU = hasSubU ? upperSubs! : [upperBox];
  for (let i = 0; i < listL.length; i++) {
    const sl = listL[i];
    for (let j = 0; j < listU.length; j++) {
      const su = listU[j];
      const sx = Math.min(su.max[0], sl.max[0]) - Math.max(su.min[0], sl.min[0]);
      const sz = Math.min(su.max[2], sl.max[2]) - Math.max(su.min[2], sl.min[2]);
      if (sx >= 3.0 && sz >= 3.0 && sl.max[1] <= su.min[1] + 4.5 && su.min[1] - sl.max[1] <= 36) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Builds the strict cycle-free bottom-up vertical prerequisite DAG:
 * `belowMap[i]` lists parts `u` directly underneath `i` that MUST be placed in an
 * earlier step before `i` so `u` is never trapped/sandwiched between a lower support
 * and `i`.
 *
 * Crucially, a part `u` is ONLY treated as a vertical prerequisite if `u` itself has
 * real physical support from below or sideways (a non-wheel, non-figure neighbor in
 * `adj[u]` that does not sit strictly above `u`). Pure top-hung / underside-attached
 * parts (such as bogie side plates, hanging skirts, underside brackets, or loose legs
 * without a baseplate) whose ONLY connections are to parts above them are NOT placed
 * into `belowMap`, allowing the spanning upper plate to be placed first so those parts
 * snap cleanly onto its underside with zero floating!
 */
export function buildPhysicalVerticalPrereqMap(
  boxes: readonly WorldBox[],
  adj: readonly (readonly number[])[],
  roles: readonly string[],
  claddingFlags: readonly boolean[],
  activeIndices?: readonly number[],
  subBoxes?: readonly (readonly WorldBox[] | null)[] | null,
): { belowMap: number[][]; baseMinY: number } {
  const idxList = activeIndices ?? boxes.map((_, i) => i);
  const activeSet = new Set(idxList);

  let baseMinY = Infinity;
  for (const i of idxList) {
    if (roles[i] === 'wheel' || roles[i] === 'pin' || roles[i] === 'figure' || claddingFlags[i]) continue;
    if (boxes[i].min[1] < baseMinY) baseMinY = boxes[i].min[1];
  }
  if (!Number.isFinite(baseMinY)) baseMinY = 0;

  // True ONLY when `u` has at least one genuine non-upper structural neighbor in `adj[u]`
  // (something below or horizontally supporting `u`, NOT merely resting on top of `u`).
  // Pure top-hung / underside-attached pieces return false so they attach AFTER the upper
  // plate that holds them up, instead of floating in mid-air before it.
  const hasLowerOrSideSupport = (u: number): boolean => {
    const bu = boxes[u];
    for (const w of adj[u] ?? []) {
      if (!activeSet.has(w) || roles[w] === 'wheel' || roles[w] === 'pin' || roles[w] === 'figure' || claddingFlags[w]) continue;
      const bw = boxes[w];
      // Exclude neighbors sitting strictly on top of `u`
      if (bw.min[1] >= bu.max[1] - 4.5 && bw.center[1] > bu.center[1] + 2.0) continue;
      if (bw.min[1] < bu.max[1] - 4.0 && bw.center[1] <= bu.center[1] + 4.0) return true;
    }
    return false;
  };

  const belowMap: number[][] = Array.from({ length: boxes.length }, () => []);
  for (const i of idxList) {
    if (roles[i] === 'wheel' || roles[i] === 'pin' || roles[i] === 'figure' || claddingFlags[i]) continue;
    const bi = boxes[i];
    const subI = subBoxes ? subBoxes[i] : null;
    for (const u of idxList) {
      if (u === i || roles[u] === 'wheel' || roles[u] === 'pin' || roles[u] === 'figure' || claddingFlags[u]) continue;
      const bu = boxes[u];
      if (bu.min[1] >= bi.min[1] - 2.0) continue;
      if (bu.center[1] >= bi.center[1] - 2.0) continue;
      if (bu.max[1] > bi.min[1] + 4.5) continue;
      if (bi.min[1] - bu.max[1] > 36) continue;
      const subU = subBoxes ? subBoxes[u] : null;
      if (!hasSolidHorizontalOverlap(bu, bi, subU, subI)) continue;
      if (!hasLowerOrSideSupport(u)) continue;
      belowMap[i].push(u);
    }
  }

  return { belowMap, baseMinY };
}

export interface HorizontalFastenerGuards {
  /**
   * True when `idx` is a horizontal Technic pin/axle that must wait for its
   * vertically-seated interlocking host brick(s) to be placed in a prior step:
   * - Prevents adding a pin in the exact same step as the brick it inserts into.
   * - Prevents inserting a pin into brick A while vertically-seated brick B is
   *   still unplaced (which would force a later step to shove brick B straight
   *   down through the protruding horizontal pin).
   */
  isFastenerWaitingForHosts: (
    idx: number,
    placedBeforeStep: ReadonlySet<number>,
    remaining: ReadonlySet<number>,
  ) => boolean;
  /**
   * True when placing `idx` would seal the LAST open axial entrance of an
   * unplaced horizontal pin/axle's insertion corridor (trapping the pin inside
   * a closed sandwich of bricks before it can be slid in).
   */
  wouldBlockFastenerCorridor: (
    idx: number,
    placedBeforeStep: ReadonlySet<number>,
    placedInStep: ReadonlySet<number>,
    remaining: ReadonlySet<number>,
  ) => boolean;
  /** Combined fastener-ordering blocker check. */
  isBlocked: (
    idx: number,
    placedBeforeStep: ReadonlySet<number>,
    placedInStep: ReadonlySet<number>,
    remaining: ReadonlySet<number>,
  ) => boolean;
}

interface HorizontalFastenerRecord {
  pinIdx: number;
  allHosts: number[];
  vertHosts: number[];
  negBlockers: Set<number>;
  posBlockers: Set<number>;
}

/**
 * Builds pure 3D rigid-body insertion-order guards for horizontal Technic pins
 * and horizontal axles inside a build scope.
 */
export function createHorizontalFastenerGuards(
  boxes: readonly WorldBox[],
  adj: readonly (readonly number[])[],
  roles: readonly string[],
  belowMap: readonly (readonly number[])[],
  activeIndices?: readonly number[],
): HorizontalFastenerGuards {
  const idxList = activeIndices ?? boxes.map((_, i) => i);
  const activeSet = new Set(idxList);
  const fastenerByPin = new Map<number, HorizontalFastenerRecord>();
  const blockerToFasteners = new Map<number, HorizontalFastenerRecord[]>();

  const isStructuralHostRole = (r: string): boolean =>
    r !== 'pin' && r !== 'axle' && r !== 'wheel' && r !== 'figure';

  const isVerticallySeated = (h: number): boolean => {
    if ((belowMap[h]?.length ?? 0) > 0) return true;
    const bh = boxes[h];
    for (const w of adj[h] ?? []) {
      if (!activeSet.has(w) || !isStructuralHostRole(roles[w])) continue;
      const bw = boxes[w];
      if (bw.max[1] > bh.min[1] + 4.5) continue;
      if (bh.min[1] - bw.max[1] > 4.5) continue;
      const ovX = Math.min(bh.max[0], bw.max[0]) - Math.max(bh.min[0], bw.min[0]);
      const ovZ = Math.min(bh.max[2], bw.max[2]) - Math.max(bh.min[2], bw.min[2]);
      if (ovX >= 3.0 && ovZ >= 3.0) return true;
    }
    return false;
  };

  for (const p of idxList) {
    if (!isHorizontalFastenerBox(roles[p], boxes[p])) continue;
    const bp = boxes[p];
    const dx = bp.max[0] - bp.min[0];
    const dz = bp.max[2] - bp.min[2];
    const axis: 0 | 2 = dx >= dz ? 0 : 2;
    const perpAxis: 0 | 2 = axis === 0 ? 2 : 0;

    const allHosts: number[] = [];
    for (const h of adj[p] ?? []) {
      if (!activeSet.has(h) || !isStructuralHostRole(roles[h])) continue;
      const bh = boxes[h];
      const ovX = Math.min(bp.max[0], bh.max[0]) - Math.max(bp.min[0], bh.min[0]);
      const ovY = Math.min(bp.max[1], bh.max[1]) - Math.max(bp.min[1], bh.min[1]);
      const ovZ = Math.min(bp.max[2], bh.max[2]) - Math.max(bp.min[2], bh.min[2]);
      if (ovX >= 1.5 && ovY >= 1.5 && ovZ >= 1.5) {
        allHosts.push(h);
      }
    }
    if (allHosts.length === 0) continue;

    const vertHosts = allHosts.filter((h) => isVerticallySeated(h));
    const hostSet = new Set(allHosts);
    const hostBelowSet = new Set<number>();
    for (const h of vertHosts) {
      for (const u of belowMap[h] ?? []) hostBelowSet.add(u);
    }

    const spanParts = vertHosts.length > 0 ? vertHosts : allHosts;
    let corridorMin = bp.min[axis];
    let corridorMax = bp.max[axis];
    for (const h of spanParts) {
      if (boxes[h].min[axis] < corridorMin) corridorMin = boxes[h].min[axis];
      if (boxes[h].max[axis] > corridorMax) corridorMax = boxes[h].max[axis];
    }

    const negBlockers = new Set<number>();
    const posBlockers = new Set<number>();
    for (const b of idxList) {
      if (b === p || hostSet.has(b) || hostBelowSet.has(b)) continue;
      if (!isStructuralHostRole(roles[b])) continue;
      const bb = boxes[b];
      const ovY = Math.min(bp.max[1], bb.max[1]) - Math.max(bp.min[1], bb.min[1]);
      const ovPerp = Math.min(bp.max[perpAxis], bb.max[perpAxis]) - Math.max(bp.min[perpAxis], bb.min[perpAxis]);
      if (ovY < 2.0 || ovPerp < 2.0) continue;
      if (bb.max[axis] <= corridorMin + 4.0 && bb.max[axis] >= corridorMin - 44.0) {
        negBlockers.add(b);
      }
      if (bb.min[axis] >= corridorMax - 4.0 && bb.min[axis] <= corridorMax + 44.0) {
        posBlockers.add(b);
      }
    }

    const rec: HorizontalFastenerRecord = { pinIdx: p, allHosts, vertHosts, negBlockers, posBlockers };
    fastenerByPin.set(p, rec);
    for (const b of negBlockers) {
      let list = blockerToFasteners.get(b);
      if (!list) { list = []; blockerToFasteners.set(b, list); }
      list.push(rec);
    }
    for (const b of posBlockers) {
      if (negBlockers.has(b)) continue;
      let list = blockerToFasteners.get(b);
      if (!list) { list = []; blockerToFasteners.set(b, list); }
      list.push(rec);
    }
  }

  const isFastenerWaitingForHosts = (
    idx: number,
    placedBeforeStep: ReadonlySet<number>,
    remaining: ReadonlySet<number>,
  ): boolean => {
    const rec = fastenerByPin.get(idx);
    if (!rec) return false;
    if (rec.vertHosts.length > 0) {
      return rec.vertHosts.some((h) => remaining.has(h) && !placedBeforeStep.has(h));
    }
    if (placedBeforeStep.size > 0) {
      return !rec.allHosts.some((h) => placedBeforeStep.has(h));
    }
    return false;
  };

  const wouldBlockFastenerCorridor = (
    idx: number,
    placedBeforeStep: ReadonlySet<number>,
    placedInStep: ReadonlySet<number>,
    remaining: ReadonlySet<number>,
  ): boolean => {
    const list = blockerToFasteners.get(idx);
    if (!list) return false;
    for (const rec of list) {
      if (!remaining.has(rec.pinIdx)) continue;
      const inNeg = rec.negBlockers.has(idx);
      const inPos = rec.posBlockers.has(idx);
      if (placedInStep.has(rec.pinIdx) && (inNeg || inPos)) {
        return true;
      }
      if (inNeg) {
        for (const opp of rec.posBlockers) {
          if (placedBeforeStep.has(opp) || placedInStep.has(opp)) return true;
        }
      }
      if (inPos) {
        for (const opp of rec.negBlockers) {
          if (placedBeforeStep.has(opp) || placedInStep.has(opp)) return true;
        }
      }
    }
    return false;
  };

  const isBlocked = (
    idx: number,
    placedBeforeStep: ReadonlySet<number>,
    placedInStep: ReadonlySet<number>,
    remaining: ReadonlySet<number>,
  ): boolean =>
    isFastenerWaitingForHosts(idx, placedBeforeStep, remaining) ||
    wouldBlockFastenerCorridor(idx, placedBeforeStep, placedInStep, remaining);

  return { isFastenerWaitingForHosts, wouldBlockFastenerCorridor, isBlocked };
}
