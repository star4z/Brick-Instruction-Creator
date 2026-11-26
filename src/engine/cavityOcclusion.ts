import { STUD_INNER_COLOR_FLAG, STUD_SIDE_COLOR_FLAG } from './datCompiler';

/**
 * Pure geometric concave-cavity ambient occlusion for compiled LDraw part meshes.
 *
 * Uses a winding-independent two-sided hemisphere test (`min(occ(+n), occ(-n))`)
 * accelerated by a uniform 3D voxel grid + 3D DDA traversal:
 * - Exterior surfaces (brick tops, walls, tiles, plates, slopes, outer cylinder walls,
 *   flat lids, handles, rims) have at least one hemisphere open to the sky -> AO = 0.
 * - Recessed hollow cavities (interior walls & floors of bins, cups, buckets, barrels,
 *   Technic pin holes, open tubes, and brick undersides) are occluded on both sides
 *   (plastic wall thickness on one side, opposing cavity wall on the visible side) -> AO > 0.
 *
 * Returns a per-vertex `Uint8Array` (0..255) only when at least one cavity vertex is
 * detected, or `undefined` for solid/convex parts (zero memory overhead).
 */

const OCC_THRESHOLD = 0.42; // <= 3/9 rays hit -> strictly 0 (preserves flat exterior colors & shallow L-corners)
const OCC_FULL = 0.80;
const MAX_MISSES_BEFORE_ABORT = 6; // If 6 of 9 rays escape, hit fraction <= 3/9 <= OCC_THRESHOLD
const MAX_TRIS_FOR_CAVITY_AO = 6000;

// 9 hemisphere ray directions in local tangent frame (tu, tv, tn):
// 1 center ray (0°), 4 mid-cone rays (45°), 4 wide-cone diagonal rays (65°).
const HEMI_RAYS: readonly [number, number, number][] = [
  [0, 0, 1],
  [0.70710678, 0, 0.70710678],
  [-0.70710678, 0, 0.70710678],
  [0, 0.70710678, 0.70710678],
  [0, -0.70710678, 0.70710678],
  [0.64085638, 0.64085638, 0.42261826],
  [-0.64085638, 0.64085638, 0.42261826],
  [0.64085638, -0.64085638, 0.42261826],
  [-0.64085638, -0.64085638, 0.42261826],
];

interface UniformTriGrid {
  minX: number;
  minY: number;
  minZ: number;
  invCellX: number;
  invCellY: number;
  invCellZ: number;
  nx: number;
  ny: number;
  nz: number;
  cellOffsets: Int32Array;
  cellTris: Int32Array;
  // Precomputed per-triangle vertices and edges for fast Möller–Trumbore
  v0x: Float32Array;
  v0y: Float32Array;
  v0z: Float32Array;
  e1x: Float32Array;
  e1y: Float32Array;
  e1z: Float32Array;
  e2x: Float32Array;
  e2y: Float32Array;
  e2z: Float32Array;
  triStamp: Int32Array;
  curStamp: number;
}

function buildUniformTriGrid(
  tris: Float32Array,
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): UniformTriGrid | null {
  const triCount = (tris.length / 9) | 0;
  if (triCount < 8) return null;

  const pad = 0.25;
  const bMinX = minX - pad;
  const bMinY = minY - pad;
  const bMinZ = minZ - pad;
  const spanX = Math.max(1e-3, maxX - minX + pad * 2);
  const spanY = Math.max(1e-3, maxY - minY + pad * 2);
  const spanZ = Math.max(1e-3, maxZ - minZ + pad * 2);
  const maxSpan = Math.max(spanX, spanY, spanZ);

  const targetRes = triCount > 1500 ? 12 : triCount > 400 ? 10 : 8;
  const nx = Math.max(2, Math.min(targetRes, Math.ceil((spanX / maxSpan) * targetRes)));
  const ny = Math.max(2, Math.min(targetRes, Math.ceil((spanY / maxSpan) * targetRes)));
  const nz = Math.max(2, Math.min(targetRes, Math.ceil((spanZ / maxSpan) * targetRes)));
  const invCellX = nx / spanX;
  const invCellY = ny / spanY;
  const invCellZ = nz / spanZ;
  const totalCells = nx * ny * nz;

  const v0x = new Float32Array(triCount);
  const v0y = new Float32Array(triCount);
  const v0z = new Float32Array(triCount);
  const e1x = new Float32Array(triCount);
  const e1y = new Float32Array(triCount);
  const e1z = new Float32Array(triCount);
  const e2x = new Float32Array(triCount);
  const e2y = new Float32Array(triCount);
  const e2z = new Float32Array(triCount);

  const triMinCx = new Int16Array(triCount);
  const triMaxCx = new Int16Array(triCount);
  const triMinCy = new Int16Array(triCount);
  const triMaxCy = new Int16Array(triCount);
  const triMinCz = new Int16Array(triCount);
  const triMaxCz = new Int16Array(triCount);
  const counts = new Int32Array(totalCells);

  for (let t = 0; t < triCount; t++) {
    const i = t * 9;
    const ax = tris[i], ay = tris[i + 1], az = tris[i + 2];
    const bx = tris[i + 3], by = tris[i + 4], bz = tris[i + 5];
    const cx = tris[i + 6], cy = tris[i + 7], cz = tris[i + 8];
    v0x[t] = ax; v0y[t] = ay; v0z[t] = az;
    e1x[t] = bx - ax; e1y[t] = by - ay; e1z[t] = bz - az;
    e2x[t] = cx - ax; e2y[t] = cy - ay; e2z[t] = cz - az;

    const tMinX = ax < bx ? (ax < cx ? ax : cx) : (bx < cx ? bx : cx);
    const tMaxX = ax > bx ? (ax > cx ? ax : cx) : (bx > cx ? bx : cx);
    const tMinY = ay < by ? (ay < cy ? ay : cy) : (by < cy ? by : cy);
    const tMaxY = ay > by ? (ay > cy ? ay : cy) : (by > cy ? by : cy);
    const tMinZ = az < bz ? (az < cz ? az : cz) : (bz < cz ? bz : cz);
    const tMaxZ = az > bz ? (az > cz ? az : cz) : (bz > cz ? bz : cz);

    const x0 = Math.max(0, Math.min(nx - 1, Math.floor((tMinX - bMinX) * invCellX)));
    const x1 = Math.max(0, Math.min(nx - 1, Math.floor((tMaxX - bMinX) * invCellX)));
    const y0 = Math.max(0, Math.min(ny - 1, Math.floor((tMinY - bMinY) * invCellY)));
    const y1 = Math.max(0, Math.min(ny - 1, Math.floor((tMaxY - bMinY) * invCellY)));
    const z0 = Math.max(0, Math.min(nz - 1, Math.floor((tMinZ - bMinZ) * invCellZ)));
    const z1 = Math.max(0, Math.min(nz - 1, Math.floor((tMaxZ - bMinZ) * invCellZ)));

    triMinCx[t] = x0; triMaxCx[t] = x1;
    triMinCy[t] = y0; triMaxCy[t] = y1;
    triMinCz[t] = z0; triMaxCz[t] = z1;

    for (let czIdx = z0; czIdx <= z1; czIdx++) {
      const zOff = czIdx * ny * nx;
      for (let cyIdx = y0; cyIdx <= y1; cyIdx++) {
        const yzOff = zOff + cyIdx * nx;
        for (let cxIdx = x0; cxIdx <= x1; cxIdx++) {
          counts[yzOff + cxIdx]++;
        }
      }
    }
  }

  const cellOffsets = new Int32Array(totalCells + 1);
  for (let c = 0; c < totalCells; c++) {
    cellOffsets[c + 1] = cellOffsets[c] + counts[c];
  }
  const cellTris = new Int32Array(cellOffsets[totalCells]);
  const writePtr = cellOffsets.slice(0, totalCells);

  for (let t = 0; t < triCount; t++) {
    const x0 = triMinCx[t], x1 = triMaxCx[t];
    const y0 = triMinCy[t], y1 = triMaxCy[t];
    const z0 = triMinCz[t], z1 = triMaxCz[t];
    for (let czIdx = z0; czIdx <= z1; czIdx++) {
      const zOff = czIdx * ny * nx;
      for (let cyIdx = y0; cyIdx <= y1; cyIdx++) {
        const yzOff = zOff + cyIdx * nx;
        for (let cxIdx = x0; cxIdx <= x1; cxIdx++) {
          const cid = yzOff + cxIdx;
          cellTris[writePtr[cid]++] = t;
        }
      }
    }
  }

  return {
    minX: bMinX,
    minY: bMinY,
    minZ: bMinZ,
    invCellX,
    invCellY,
    invCellZ,
    nx,
    ny,
    nz,
    cellOffsets,
    cellTris,
    v0x,
    v0y,
    v0z,
    e1x,
    e1y,
    e1z,
    e2x,
    e2y,
    e2z,
    triStamp: new Int32Array(triCount),
    curStamp: 0,
  };
}

function rayHitsAnyTri(
  grid: UniformTriGrid,
  ox: number,
  oy: number,
  oz: number,
  dx: number,
  dy: number,
  dz: number,
  skipTri: number,
  tMin: number,
  tMax: number,
): boolean {
  const {
    minX, minY, minZ, invCellX, invCellY, invCellZ, nx, ny, nz,
    cellOffsets, cellTris, v0x, v0y, v0z, e1x, e1y, e1z, e2x, e2y, e2z, triStamp,
  } = grid;

  let cx = Math.floor((ox - minX) * invCellX);
  let cy = Math.floor((oy - minY) * invCellY);
  let cz = Math.floor((oz - minZ) * invCellZ);
  if (cx < 0 || cx >= nx || cy < 0 || cy >= ny || cz < 0 || cz >= nz) {
    return false;
  }

  const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
  const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;

  const cellSizeX = 1 / invCellX;
  const cellSizeY = 1 / invCellY;
  const cellSizeZ = 1 / invCellZ;

  let tMaxX =
    stepX !== 0
      ? ((minX + (cx + (stepX > 0 ? 1 : 0)) * cellSizeX) - ox) / dx
      : Infinity;
  let tMaxY =
    stepY !== 0
      ? ((minY + (cy + (stepY > 0 ? 1 : 0)) * cellSizeY) - oy) / dy
      : Infinity;
  let tMaxZ =
    stepZ !== 0
      ? ((minZ + (cz + (stepZ > 0 ? 1 : 0)) * cellSizeZ) - oz) / dz
      : Infinity;

  const tDeltaX = stepX !== 0 ? Math.abs(cellSizeX / dx) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(cellSizeY / dy) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(cellSizeZ / dz) : Infinity;

  const stamp = ++grid.curStamp;
  const maxSteps = nx + ny + nz + 2;

  for (let step = 0; step < maxSteps; step++) {
    const cid = (cz * ny + cy) * nx + cx;
    const start = cellOffsets[cid];
    const end = cellOffsets[cid + 1];
    for (let k = start; k < end; k++) {
      const t = cellTris[k];
      if (t === skipTri || triStamp[t] === stamp) continue;
      triStamp[t] = stamp;

      // Möller–Trumbore ray-triangle intersection (double-sided)
      const e1xi = e1x[t], e1yi = e1y[t], e1zi = e1z[t];
      const e2xi = e2x[t], e2yi = e2y[t], e2zi = e2z[t];
      const px = dy * e2zi - dz * e2yi;
      const py = dz * e2xi - dx * e2zi;
      const pz = dx * e2yi - dy * e2xi;
      const det = e1xi * px + e1yi * py + e1zi * pz;
      if (det > -1e-7 && det < 1e-7) continue;
      const invDet = 1 / det;

      const tx = ox - v0x[t];
      const ty = oy - v0y[t];
      const tz = oz - v0z[t];
      const u = (tx * px + ty * py + tz * pz) * invDet;
      if (u < -1e-5 || u > 1 + 1e-5) continue;

      const qx = ty * e1zi - tz * e1yi;
      const qy = tz * e1xi - tx * e1zi;
      const qz = tx * e1yi - ty * e1xi;
      const v = (dx * qx + dy * qy + dz * qz) * invDet;
      if (v < -1e-5 || u + v > 1 + 1e-5) continue;

      const dist = (e2xi * qx + e2yi * qy + e2zi * qz) * invDet;
      if (dist >= tMin && dist <= tMax) return true;
    }

    if (tMaxX < tMaxY) {
      if (tMaxX < tMaxZ) {
        if (tMaxX > tMax) break;
        cx += stepX;
        tMaxX += tDeltaX;
        if (cx < 0 || cx >= nx) break;
      } else {
        if (tMaxZ > tMax) break;
        cz += stepZ;
        tMaxZ += tDeltaZ;
        if (cz < 0 || cz >= nz) break;
      }
    } else if (tMaxY < tMaxZ) {
      if (tMaxY > tMax) break;
      cy += stepY;
      tMaxY += tDeltaY;
      if (cy < 0 || cy >= ny) break;
    } else {
      if (tMaxZ > tMax) break;
      cz += stepZ;
      tMaxZ += tDeltaZ;
      if (cz < 0 || cz >= nz) break;
    }
  }
  return false;
}

function measureHemisphereOcclusion(
  grid: UniformTriGrid,
  px: number,
  py: number,
  pz: number,
  nx: number,
  ny: number,
  nz: number,
  ux: number,
  uy: number,
  uz: number,
  vx: number,
  vy: number,
  vz: number,
  skipTri: number,
  tMax: number,
): number {
  const ox = px + nx * 0.12;
  const oy = py + ny * 0.12;
  const oz = pz + nz * 0.12;
  let hits = 0;
  let misses = 0;
  for (let r = 0; r < HEMI_RAYS.length; r++) {
    const [wu, wv, wn] = HEMI_RAYS[r];
    const dx = ux * wu + vx * wv + nx * wn;
    const dy = uy * wu + vy * wv + ny * wn;
    const dz = uz * wu + vz * wv + nz * wn;
    if (rayHitsAnyTri(grid, ox, oy, oz, dx, dy, dz, skipTri, 0.08, tMax)) {
      hits++;
    } else {
      misses++;
      if (misses >= MAX_MISSES_BEFORE_ABORT) return 0;
    }
  }
  return hits / HEMI_RAYS.length;
}

/**
 * Computes per-vertex concave-cavity ambient occlusion (0..255) for a compiled LDraw mesh.
 * Smoothly averages occlusion across vertices sharing a position and similar normal so
 * triangulated curved shells (like hollow cylinder walls) shade seamlessly while sharp
 * rim creases remain crisp.
 */
export function computeMeshCavityOcclusion(
  tris: Float32Array,
  norms: Float32Array,
  triCols: Int32Array | null,
  min: [number, number, number],
  max: [number, number, number],
): Uint8Array | undefined {
  const triCount = (tris.length / 9) | 0;
  if (triCount < 8 || triCount > MAX_TRIS_FOR_CAVITY_AO) return undefined;

  const grid = buildUniformTriGrid(tris, min[0], min[1], min[2], max[0], max[1], max[2]);
  if (!grid) return undefined;

  const diag = Math.hypot(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  if (diag < 2) return undefined;
  const tMax = diag * 1.05;

  const vertCount = triCount * 3;
  const rawAo = new Float32Array(vertCount);
  let anyOccluded = false;

  for (let t = 0; t < triCount; t++) {
    if (triCols) {
      const c = triCols[t];
      if (c === STUD_SIDE_COLOR_FLAG || c === STUD_INNER_COLOR_FLAG) continue;
    }
    const i = t * 9;
    const ax = tris[i], ay = tris[i + 1], az = tris[i + 2];
    const bx = tris[i + 3], by = tris[i + 4], bz = tris[i + 5];
    const cx = tris[i + 6], cy = tris[i + 7], cz = tris[i + 8];

    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    let fnx = e1y * e2z - e1z * e2y;
    let fny = e1z * e2x - e1x * e2z;
    let fnz = e1x * e2y - e1y * e2x;
    const fl = Math.hypot(fnx, fny, fnz);
    if (fl < 1e-6) continue;
    fnx /= fl; fny /= fl; fnz /= fl;

    // Tangent basis perpendicular to face normal
    let ux: number, uy: number, uz: number;
    if (Math.abs(fny) < 0.9) {
      ux = fnz; uy = 0; uz = -fnx;
    } else {
      ux = 0; uy = -fnz; uz = fny;
    }
    const ul = Math.hypot(ux, uy, uz) || 1;
    ux /= ul; uy /= ul; uz /= ul;
    const vx = fny * uz - fnz * uy;
    const vy = fnz * ux - fnx * uz;
    const vz = fnx * uy - fny * ux;

    const midX = (ax + bx + cx) / 3;
    const midY = (ay + by + cy) / 3;
    const midZ = (az + bz + cz) / 3;

    const verts: [number, number, number][] = [
      [ax, ay, az],
      [bx, by, bz],
      [cx, cy, cz],
    ];

    for (let k = 0; k < 3; k++) {
      const [px0, py0, pz0] = verts[k];
      // Move a small fixed distance along the triangle toward its interior so rays at
      // open-rim vertices never graze coplanar rim faces and stay symmetric across diagonals.
      const toCx = midX - px0;
      const toCy = midY - py0;
      const toCz = midZ - pz0;
      const toCLen = Math.hypot(toCx, toCy, toCz);
      const inset = toCLen > 1e-5 ? Math.min(0.65, toCLen * 0.28) / toCLen : 0;
      const sx = px0 + toCx * inset;
      const sy = py0 + toCy * inset;
      const sz = pz0 + toCz * inset;

      const occPos = measureHemisphereOcclusion(
        grid, sx, sy, sz, fnx, fny, fnz, ux, uy, uz, vx, vy, vz, t, tMax,
      );
      if (occPos <= OCC_THRESHOLD) continue;

      const occNeg = measureHemisphereOcclusion(
        grid, sx, sy, sz, -fnx, -fny, -fnz, ux, uy, uz, -vx, -vy, -vz, t, tMax,
      );
      if (occNeg <= OCC_THRESHOLD) continue;

      const occ = occPos < occNeg ? occPos : occNeg;
      const normAo = Math.min(1, (occ - OCC_THRESHOLD) / (OCC_FULL - OCC_THRESHOLD));
      rawAo[t * 3 + k] = normAo;
      if (normAo > 0.02) anyOccluded = true;
    }
  }

  if (!anyOccluded) return undefined;

  // Smooth cavity AO across shared vertices with aligned normals (no bleeding across sharp rim creases).
  const groupSum = new Map<string, number>();
  const groupCnt = new Map<string, number>();
  const vertKeys: string[] = new Array(vertCount);
  for (let v = 0; v < vertCount; v++) {
    const pi = v * 3;
    const qx = Math.round(tris[pi] * 20) + 0;
    const qy = Math.round(tris[pi + 1] * 20) + 0;
    const qz = Math.round(tris[pi + 2] * 20) + 0;
    // Quantize smooth normal (sign-invariant via canonical orientation so inverted/mixed winding matches)
    let nx = norms[pi], ny = norms[pi + 1], nz = norms[pi + 2];
    if (nx < -1e-3 || (Math.abs(nx) <= 1e-3 && (ny < -1e-3 || (Math.abs(ny) <= 1e-3 && nz < 0)))) {
      nx = -nx; ny = -ny; nz = -nz;
    }
    const qnx = Math.round(nx * 4) + 0;
    const qny = Math.round(ny * 4) + 0;
    const qnz = Math.round(nz * 4) + 0;
    const key = `${qx},${qy},${qz}|${qnx},${qny},${qnz}`;
    vertKeys[v] = key;
    groupSum.set(key, (groupSum.get(key) ?? 0) + rawAo[v]);
    groupCnt.set(key, (groupCnt.get(key) ?? 0) + 1);
  }

  const out = new Uint8Array(vertCount);
  let hasNonZero = false;
  for (let v = 0; v < vertCount; v++) {
    const key = vertKeys[v];
    const avg = (groupSum.get(key) ?? 0) / (groupCnt.get(key) ?? 1);
    const b = Math.round(Math.max(0, Math.min(1, avg)) * 255);
    out[v] = b;
    if (b > 0) hasNonZero = true;
  }
  return hasNonZero ? out : undefined;
}
