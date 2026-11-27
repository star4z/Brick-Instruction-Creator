/**
 * General Hinged Sub-Assembly Detection & Upright-Build / Deferred-Tilt Planning.
 *
 * Official LEGO manuals do not ask builders to insert a hinge brick top plate at an
 * arbitrary oblique angle (e.g. 8.6°) and then stack a windshield or nose assembly
 * diagonally in mid-air before the roof behind it even exists.
 *
 * Instead, official manuals:
 *   1. Place the upright hinge base first (enforced via `basePrereqPairs`).
 *   2. Snap the hinge top plate vertically straight down from the top in a straight
 *      upright (0°) orientation.
 *   3. Build the bricks/window/panels attached to that hinge straight up-and-down (0°).
 *   4. After any stationary rest-stop structure adjacent to the final tilted pose
 *      (such as the roof edge or cab frame the tilted assembly leans against) is built,
 *      emit a dedicated Tilt / Fold step with crisp 3D curved rotation arrow(s) tilting
 *      the hinged assembly smoothly into its final angled pose.
 *
 * All rules are derived strictly from 3D rigid-body kinematics and physical geometry,
 * with zero model-specific or theme-specific heuristics.
 */

import type { WorldBox } from './minifigPose';

export interface HingePartInput {
  index: number;
  partId: string;
  partName: string;
  role: string;
  x: number;
  y: number;
  z: number;
  /** 9-element row-major 3x3 rotation matrix (local -> world). */
  m: readonly number[];
  box: WorldBox;
}

export interface HingeCurvedIndicator {
  kind: 'hinge_tilt';
  pivot: [number, number, number];
  axis: [number, number, number];
  startDir: [number, number, number];
  angleDeg: number;
  radius: number;
  lateralOffset?: [number, number, number];
  color?: string;
}

export interface UprightPartTransform {
  x: number;
  y: number;
  z: number;
  m: number[];
}

export interface HingedAssemblySpec {
  id: string;
  /** Indices of all parts in the oblique-tilted hinged assembly. */
  partIndices: number[];
  /** Indices of stationary upright hinge base parts anchoring this assembly. */
  baseIndices: number[];
  /** Prerequisite pairs `[hingeTopIdx, baseIdx]` ensuring every hinge base is placed before its hinge top. */
  basePrereqPairs: Array<[number, number]>;
  /** Stationary non-hinged parts adjacent to the final tilted pose (e.g. roof edge) placed BEFORE tilting. */
  restStopIndices: number[];
  /** Exact 3D hinge pivot point on the hinge axis line. */
  pivot: [number, number, number];
  /** Unit 3D rotation axis taking upright (0°) -> final tilted pose. */
  axis: [number, number, number];
  /** Horizontal unit vector pointing from upright pose toward the final tilted resting pose. */
  tangent: [number, number, number];
  /** Tilt angle in degrees (positive around `axis`, from upright -> final). */
  angleDeg: number;
  /** Straight-upright (0°) transforms for every part index in `partIndices`. */
  uprightTransforms: Map<number, UprightPartTransform>;
  /** 3D curved rotation arrow indicator(s) for the tilt step. */
  indicators: HingeCurvedIndicator[];
}

export interface HingedAssemblyPlan {
  assemblies: HingedAssemblySpec[];
  /** All `[hingeTopIdx, baseIdx]` pairs (even for non-tilted 0° stacked hinges so bases always precede tops). */
  allBasePrereqPairs: Array<[number, number]>;
}

const HINGE_LEAF_RE =
  /^(?:bl_)?(?:3938|6134|3830|3831|4275|4276|44301|44302|44567|44568|30383|30386|2429|2430|73983|19954|98285|98286|30552|30553|30554|4625|4504|2582|3149)[a-z]?$/i;

const HINGE_BASE_RE =
  /^(?:bl_)?(?:3937|3830|3831|4275|4276|44301|44302|44567|44568|30383|30386|2429|2430|73983|19954|98285|98286|30552|30553|30554|4625|4504|2582|3149|60478|60470|48336|4085|6019|2555|15712)[a-z]?$/i;

function normPartId(id: string): string {
  return String(id || '').toLowerCase().replace(/\.dat$/i, '').trim();
}

export function isHingeLeafPart(p: Pick<HingePartInput, 'partId' | 'partName'>): boolean {
  const k = normPartId(p.partId);
  if (HINGE_LEAF_RE.test(k)) return true;
  return /\bhinge\b/i.test(p.partName || '');
}

export function isHingeBasePart(p: Pick<HingePartInput, 'partId' | 'partName'>): boolean {
  const k = normPartId(p.partId);
  if (HINGE_BASE_RE.test(k)) return true;
  return /\bhinge\b|\bbar\s+holder\b|\bclip\b/i.test(p.partName || '');
}

function normalize3(v: readonly [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

function cross3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function dot3(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Row-major 3x3 Rodrigues rotation matrix around unit `axis` by `angleRad`. */
export function mat3FromAxisAngle(
  axis: readonly [number, number, number],
  angleRad: number,
): number[] {
  const [kx, ky, kz] = normalize3(axis);
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  const t = 1 - c;
  return [
    c + kx * kx * t, kx * ky * t - kz * s, kx * kz * t + ky * s,
    ky * kx * t + kz * s, c + ky * ky * t, ky * kz * t - kx * s,
    kz * kx * t - ky * s, kz * ky * t + kx * s, c + kz * kz * t,
  ];
}

function mat3MulVec(m: readonly number[], v: readonly [number, number, number]): [number, number, number] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

function mat3Mul(a: readonly number[], b: readonly number[]): number[] {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

function snapNearZeroOrOne(val: number): number {
  if (Math.abs(val) < 1e-3) return 0;
  if (Math.abs(val - 1) < 1e-3) return 1;
  if (Math.abs(val + 1) < 1e-3) return -1;
  return val;
}

function boxesTouchWithin(a: WorldBox, b: WorldBox, margin: number): boolean {
  return (
    a.min[0] <= b.max[0] + margin &&
    a.max[0] >= b.min[0] - margin &&
    a.min[1] <= b.max[1] + margin &&
    a.max[1] >= b.min[1] - margin &&
    a.min[2] <= b.max[2] + margin &&
    a.max[2] >= b.min[2] - margin
  );
}

function boxOverlap3D(a: WorldBox, b: WorldBox): [number, number, number] {
  return [
    Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]),
    Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]),
    Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]),
  ];
}

function rotateWorldBoxAround(
  box: WorldBox,
  pivot: readonly [number, number, number],
  rotM: readonly number[],
): WorldBox {
  const mn: [number, number, number] = [Infinity, Infinity, Infinity];
  const mx: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const x of [box.min[0], box.max[0]]) {
    for (const y of [box.min[1], box.max[1]]) {
      for (const z of [box.min[2], box.max[2]]) {
        const dp = mat3MulVec(rotM, [x - pivot[0], y - pivot[1], z - pivot[2]]);
        const wx = pivot[0] + dp[0];
        const wy = pivot[1] + dp[1];
        const wz = pivot[2] + dp[2];
        if (wx < mn[0]) mn[0] = wx;
        if (wy < mn[1]) mn[1] = wy;
        if (wz < mn[2]) mn[2] = wz;
        if (wx > mx[0]) mx[0] = wx;
        if (wy > mx[1]) mx[1] = wy;
        if (wz > mx[2]) mx[2] = wz;
      }
    }
  }
  return {
    min: mn,
    max: mx,
    center: [(mn[0] + mx[0]) * 0.5, (mn[1] + mx[1]) * 0.5, (mn[2] + mx[2]) * 0.5],
  };
}

/**
 * Analyzes a section or model for oblique-tilted hinged assemblies (e.g. angled train
 * windshields, tilted car hoods, hinged cockpit canopies, angled roof panels) and
 * stacked hinge base->top prerequisites.
 */
export function analyzeTiltedHingedAssemblies(
  parts: ReadonlyArray<HingePartInput>,
  adj: ReadonlyArray<ReadonlyArray<number>>,
): HingedAssemblyPlan {
  const n = parts.length;
  const allBasePrereqPairs: Array<[number, number]> = [];
  const seenPrereqKey = new Set<string>();

  const recordBasePrereq = (topIdx: number, baseIdx: number) => {
    const key = `${topIdx}:${baseIdx}`;
    if (seenPrereqKey.has(key)) return;
    seenPrereqKey.add(key);
    allBasePrereqPairs.push([topIdx, baseIdx]);
  };

  // 0. Always detect stacked vertical hinge base -> hinge top pairs (even at 0° upright!)
  //    e.g. 3937 Hinge Brick Base underneath 3938/6134 Hinge Brick Top, so the base is NEVER
  //    placed after or in the same step as the top plate!
  for (let i = 0; i < n; i++) {
    const pi = parts[i];
    if (pi.role === 'figure') continue;
    const ki = normPartId(pi.partId);
    const isStackedTop = /^(?:bl_)?(?:3938|6134)[a-z]?$/.test(ki);
    if (!isStackedTop) continue;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const pj = parts[j];
      const kj = normPartId(pj.partId);
      if (!/^(?:bl_)?(?:3937)[a-z]?$/.test(kj)) continue;
      if (pj.m[4] < 0.95) continue;
      const [ovX, ovY, ovZ] = boxOverlap3D(pi.box, pj.box);
      if (ovX >= 8 && ovY >= 4 && ovZ >= 8 && pj.box.min[1] < pi.box.min[1] - 2) {
        recordBasePrereq(i, j);
      }
    }
  }

  // 1. Find all oblique-tilted non-figure parts (3° <= tiltFromUp <= 60°)
  const tiltedIndices: number[] = [];
  const upVecs = new Map<number, [number, number, number]>();
  for (let i = 0; i < n; i++) {
    const p = parts[i];
    if (p.role === 'figure') continue;
    const up = normalize3([p.m[1], p.m[4], p.m[7]]);
    const tiltRad = Math.acos(Math.max(-1, Math.min(1, up[1])));
    const tiltDeg = (tiltRad * 180) / Math.PI;
    if (tiltDeg >= 3.0 && tiltDeg <= 60.0) {
      tiltedIndices.push(i);
      upVecs.set(i, up);
    }
  }

  if (tiltedIndices.length < 2) {
    return { assemblies: [], allBasePrereqPairs };
  }

  // 2. Group co-tilted connected parts into rigid hinged clusters
  const tiltedSet = new Set<number>(tiltedIndices);
  const visited = new Set<number>();
  const clusters: number[][] = [];

  for (const start of tiltedIndices) {
    if (visited.has(start)) continue;
    const comp: number[] = [];
    const queue: number[] = [start];
    visited.add(start);
    const refUp = upVecs.get(start)!;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      comp.push(cur);
      const curBox = parts[cur].box;
      // Check both spatial adjacency AND direct proximity to catch tilted glass/inserts
      for (const nb of tiltedIndices) {
        if (visited.has(nb)) continue;
        const nbUp = upVecs.get(nb)!;
        if (dot3(refUp, nbUp) < 0.9985) continue; // > ~3.1° mismatch
        const inAdj = (adj[cur] ?? []).includes(nb);
        if (inAdj || boxesTouchWithin(curBox, parts[nb].box, 3.0)) {
          visited.add(nb);
          queue.push(nb);
        }
      }
    }
    if (comp.length >= 2) {
      clusters.push(comp);
    }
  }

  const assemblies: HingedAssemblySpec[] = [];
  let asmSeq = 0;

  for (const cluster of clusters) {
    const clusterSet = new Set<number>(cluster);

    // 3. Find upright hinge base anchor(s) directly engaging hinge leaf part(s) in this cluster
    const leafBasePairs: Array<{ leafIdx: number; baseIdx: number }> = [];
    const baseSet = new Set<number>();
    for (const leafIdx of cluster) {
      const leaf = parts[leafIdx];
      if (!isHingeLeafPart(leaf)) continue;
      for (let bIdx = 0; bIdx < n; bIdx++) {
        if (clusterSet.has(bIdx) || tiltedSet.has(bIdx)) continue;
        const base = parts[bIdx];
        if (base.role === 'figure') continue;
        if (base.m[4] < 0.985) continue; // base must be upright
        if (!isHingeBasePart(base)) continue;
        const [ovX, ovY, ovZ] = boxOverlap3D(leaf.box, base.box);
        if (ovX >= 4 && ovY >= 2 && ovZ >= 4) {
          leafBasePairs.push({ leafIdx, baseIdx: bIdx });
          baseSet.add(bIdx);
          if (base.box.min[1] < leaf.box.min[1] - 1.5) {
            recordBasePrereq(leafIdx, bIdx);
          }
        }
      }
    }
    if (leafBasePairs.length === 0) continue;

    // 4. Compute exact tilt axis & angle from upright [0, 1, 0] -> meanUp
    let ux = 0;
    let uy = 0;
    let uz = 0;
    for (const idx of cluster) {
      const u = upVecs.get(idx)!;
      ux += u[0];
      uy += u[1];
      uz += u[2];
    }
    const meanUp = normalize3([ux, uy, uz]);
    const crossUp = cross3([0, 1, 0], meanUp);
    const sinTheta = Math.hypot(crossUp[0], crossUp[1], crossUp[2]);
    if (sinTheta < 0.05) continue;
    const axis = normalize3(crossUp);
    const thetaRad = Math.atan2(sinTheta, meanUp[1]);
    const angleDeg = (thetaRad * 180) / Math.PI;
    const tangent = normalize3(cross3(axis, [0, 1, 0]));

    // 5. Solve exact 3D hinge pivot point P from kinematic displacement of hinge leaves vs bases
    let pSumX = 0;
    let pSumY = 0;
    let pSumZ = 0;
    for (const { leafIdx, baseIdx } of leafBasePairs) {
      const leaf = parts[leafIdx];
      const base = parts[baseIdx];
      const horizDist = Math.hypot(leaf.x - base.x, leaf.z - base.z);
      const dTan = (leaf.x - base.x) * tangent[0] + (leaf.z - base.z) * tangent[2];
      const solvedR = dTan / sinTheta;
      if (horizDist <= 18 && solvedR >= -2 && solvedR <= 22) {
        const r = Math.max(0, Math.min(22, solvedR));
        pSumX += leaf.x - r * sinTheta * tangent[0];
        pSumY += leaf.y - r * Math.cos(thetaRad);
        pSumZ += leaf.z - r * sinTheta * tangent[2];
      } else {
        // Fallback for end-to-end plate hinges: midpoint of overlap box
        pSumX += (Math.max(leaf.box.min[0], base.box.min[0]) + Math.min(leaf.box.max[0], base.box.max[0])) * 0.5;
        pSumY += (Math.max(leaf.box.min[1], base.box.min[1]) + Math.min(leaf.box.max[1], base.box.max[1])) * 0.5;
        pSumZ += (Math.max(leaf.box.min[2], base.box.min[2]) + Math.min(leaf.box.max[2], base.box.max[2])) * 0.5;
      }
    }
    const pivot: [number, number, number] = [
      pSumX / leafBasePairs.length,
      pSumY / leafBasePairs.length,
      pSumZ / leafBasePairs.length,
    ];

    // 6. Compute straight-upright (0°) transforms & check collision clearance against stationary parts
    const rotUntilt = mat3FromAxisAngle(axis, -thetaRad);
    const uprightTransforms = new Map<number, UprightPartTransform>();
    const leafIdxSet = new Set(leafBasePairs.map((p) => p.leafIdx));
    let hasHardCollision = false;

    for (const idx of cluster) {
      const p = parts[idx];
      const dp = mat3MulVec(rotUntilt, [p.x - pivot[0], p.y - pivot[1], p.z - pivot[2]]);
      const nx = pivot[0] + dp[0];
      const ny = pivot[1] + dp[1];
      const nz = pivot[2] + dp[2];
      const nm = mat3Mul(rotUntilt, p.m).map(snapNearZeroOrOne);
      uprightTransforms.set(idx, { x: nx, y: ny, z: nz, m: nm });

      if (!leafIdxSet.has(idx)) {
        const uprightBox = rotateWorldBoxAround(p.box, pivot, rotUntilt);
        for (let sIdx = 0; sIdx < n; sIdx++) {
          if (clusterSet.has(sIdx) || baseSet.has(sIdx)) continue;
          if (parts[sIdx].role === 'figure') continue;
          const [ox, oy, oz] = boxOverlap3D(uprightBox, parts[sIdx].box);
          if (ox > 6.5 && oy > 6.5 && oz > 6.5) {
            hasHardCollision = true;
            break;
          }
        }
      }
      if (hasHardCollision) break;
    }
    if (hasHardCollision) continue;

    // 7. Compute final tilted union box & detect stationary rest-stop parts (e.g. roof edge / cab frame)
    //    adjacent to the upper portion of the final tilted pose so tilting happens AFTER they are built!
    const finalMn: [number, number, number] = [Infinity, Infinity, Infinity];
    const finalMx: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const idx of cluster) {
      const b = parts[idx].box;
      for (let k = 0; k < 3; k++) {
        if (b.min[k] < finalMn[k]) finalMn[k] = b.min[k];
        if (b.max[k] > finalMx[k]) finalMx[k] = b.max[k];
      }
    }
    const finalBox: WorldBox = {
      min: finalMn,
      max: finalMx,
      center: [
        (finalMn[0] + finalMx[0]) * 0.5,
        (finalMn[1] + finalMx[1]) * 0.5,
        (finalMn[2] + finalMx[2]) * 0.5,
      ],
    };

    const restStopIndices: number[] = [];
    for (let sIdx = 0; sIdx < n; sIdx++) {
      if (clusterSet.has(sIdx) || baseSet.has(sIdx) || tiltedSet.has(sIdx)) continue;
      const sp = parts[sIdx];
      if (sp.role === 'figure') continue;
      const sb = sp.box;
      // Must lie near the upper half of the tilted assembly (above hinge pivot)
      if (sb.max[1] < Math.max(pivot[1] + 16, finalBox.center[1] - 12)) continue;
      if (sb.min[1] > finalBox.max[1] + 24) continue;
      // Must sit on or toward the tilt-target (+tangent) side within 24 LDU of the final tilted pose
      const tanDist =
        (sb.center[0] - pivot[0]) * tangent[0] +
        (sb.center[1] - pivot[1]) * tangent[1] +
        (sb.center[2] - pivot[2]) * tangent[2];
      if (tanDist < -10) continue;
      if (boxesTouchWithin(finalBox, sb, 24)) {
        restStopIndices.push(sIdx);
      }
    }

    // 8. Build crisp 3D curved rotation arrow indicator(s) arching cleanly over the top
    //    edge of the hinged assembly, sweeping unmistakably from upright -> final tilted pose.
    let maxRadius = 24;
    let minAxisProj = Infinity;
    let maxAxisProj = -Infinity;
    for (const idx of cluster) {
      const ub = rotateWorldBoxAround(parts[idx].box, pivot, rotUntilt);
      const topDist = ub.max[1] - pivot[1];
      if (topDist > maxRadius) maxRadius = topDist;
      for (const cx of [ub.min[0], ub.max[0]]) {
        for (const cz of [ub.min[2], ub.max[2]]) {
          const proj = (cx - pivot[0]) * axis[0] + (cz - pivot[2]) * axis[2];
          if (proj < minAxisProj) minAxisProj = proj;
          if (proj > maxAxisProj) maxAxisProj = proj;
        }
      }
    }
    // Use a tight, high-curvature arc centered just below the top rim of the hinged assembly
    // so small physical tilt angles (e.g. 8.6°) read as bold, unmistakable curved LEGO arrows
    // rather than nearly-straight lines on a huge radius.
    const arcRadius = Math.max(30, Math.min(48, Math.round(maxRadius * 0.44)));
    const topCenterY = pivot[1] + maxRadius - arcRadius * 0.12;
    const tiltShift = maxRadius * Math.sin((angleDeg * Math.PI) / 180) * 0.5;
    const arcPivot: [number, number, number] = [
      pivot[0] + tangent[0] * tiltShift,
      topCenterY,
      pivot[2] + tangent[2] * tiltShift,
    ];
    const displayAngleDeg = Math.max(50, Math.min(72, Math.round(angleDeg + 42)));
    const preBackRad = (displayAngleDeg * 0.52 * Math.PI) / 180;
    const startDir = normalize3([
      -Math.sin(preBackRad) * tangent[0],
      Math.cos(preBackRad),
      -Math.sin(preBackRad) * tangent[2],
    ]);

    const axisSpan = Number.isFinite(minAxisProj) ? maxAxisProj - minAxisProj : 0;
    const indicators: HingeCurvedIndicator[] = [];
    if (axisSpan >= 52) {
      // Pair of symmetric curved arrows flanking the left & right upper corners of the wide hinged assembly
      const sideOffsets = [minAxisProj - 8, maxAxisProj + 8];
      for (const sOff of sideOffsets) {
        indicators.push({
          kind: 'hinge_tilt',
          pivot: arcPivot,
          axis,
          startDir,
          angleDeg: displayAngleDeg,
          radius: arcRadius,
          lateralOffset: [axis[0] * sOff, axis[1] * sOff, axis[2] * sOff],
          color: '#dc2626',
        });
      }
    } else {
      const midOff = Number.isFinite(minAxisProj) ? (minAxisProj + maxAxisProj) * 0.5 : 0;
      indicators.push({
        kind: 'hinge_tilt',
        pivot: arcPivot,
        axis,
        startDir,
        angleDeg: displayAngleDeg,
        radius: arcRadius,
        lateralOffset: [axis[0] * midOff, axis[1] * midOff, axis[2] * midOff],
        color: '#dc2626',
      });
    }

    asmSeq++;
    const basePrereqPairs = leafBasePairs
      .filter(({ leafIdx, baseIdx }) => parts[baseIdx].box.min[1] < parts[leafIdx].box.min[1] - 1.5)
      .map(({ leafIdx, baseIdx }): [number, number] => [leafIdx, baseIdx]);

    assemblies.push({
      id: `hinge_${asmSeq}`,
      partIndices: cluster,
      baseIndices: Array.from(baseSet),
      basePrereqPairs,
      restStopIndices,
      pivot,
      axis,
      tangent,
      angleDeg,
      uprightTransforms,
      indicators,
    });
  }

  return { assemblies, allBasePrereqPairs };
}
