import type { MinifigLeafRole, Vec3, WorldBox } from './minifigPose';

export type StudioCornerId = 'front_right' | 'back_right' | 'back_left' | 'front_left';

export type StudioRotationCue =
  | 'none'
  | 'yaw_90_cw'
  | 'yaw_90_ccw'
  | 'yaw_180'
  | 'flip_vertical';

export interface StudioCameraPose {
  side: 'top' | 'bottom';
  corner: StudioCornerId;
  az: number;
  el: number;
}

export interface MinifigTargetBox {
  box: WorldBox;
  role?: MinifigLeafRole;
}

export interface OccluderBox {
  box: WorldBox;
  transparent?: boolean;
}

export interface CameraVisibilityMetrics {
  bodyVisibility: number;
  coreVisibility: number;
  haloVisibility: number;
  frontAlignment: number;
}

export interface PlacementCameraChoice extends StudioCameraPose, CameraVisibilityMetrics {
  cue: StudioRotationCue;
  score: number;
}

export const STUDIO_CORNERS: ReadonlyArray<{
  id: StudioCornerId;
  az: number;
  yawIndex: number;
}> = [
  { id: 'front_right', az: 38, yawIndex: 0 },
  { id: 'back_right', az: 142, yawIndex: 1 },
  { id: 'back_left', az: 218, yawIndex: 2 },
  { id: 'front_left', az: 322, yawIndex: 3 },
];

export const DEFAULT_STUDIO_CAMERA: StudioCameraPose = {
  side: 'top',
  corner: 'front_right',
  az: 38,
  el: 30,
};

interface WeightedSample {
  pt: Vec3;
  weight: number;
  isCore: boolean;
}

interface CandidateView {
  corner: StudioCornerId;
  az: number;
  el: number;
  tierPenalty: number;
}

function normalizeDeltaDeg(deltaDeg: number): number {
  return ((((deltaDeg % 360) + 540) % 360) - 180);
}

function roleWeight(role?: MinifigLeafRole): { weight: number; isCore: boolean } {
  switch (role) {
    case 'head':
      return { weight: 3.0, isCore: true };
    case 'torso':
      return { weight: 3.0, isCore: true };
    case 'hips':
    case 'legs_unit':
    case 'leg_l':
    case 'leg_r':
      return { weight: 2.0, isCore: true };
    case 'headgear':
    case 'arm_l':
    case 'arm_r':
    case 'hand':
      return { weight: 1.2, isCore: false };
    case 'accessory':
      return { weight: 0.7, isCore: false };
    default:
      return { weight: 2.0, isCore: true };
  }
}

export function cameraBasis(azDeg: number, elDeg: number): {
  viewDir: Vec3;
  right: Vec3;
  up: Vec3;
} {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  const sinAz = Math.sin(az);
  const cosAz = Math.cos(az);
  const sinEl = Math.sin(el);
  const cosEl = Math.cos(el);

  // Unit vector pointing FROM target TOWARD orthographic camera eye (matches WebGLBrickEngine.computeMVP)
  const viewDir: Vec3 = [sinAz * cosEl, sinEl, cosAz * cosEl];
  const right: Vec3 = [cosAz, 0, -sinAz];
  const up: Vec3 = [-sinAz * sinEl, cosEl, -cosAz * sinEl];
  return { viewDir, right, up };
}

function boxProjectionInterval(box: WorldBox, axis: Vec3): [number, number] {
  const minX = axis[0] >= 0 ? box.min[0] : box.max[0];
  const maxX = axis[0] >= 0 ? box.max[0] : box.min[0];
  const minY = axis[1] >= 0 ? box.min[1] : box.max[1];
  const maxY = axis[1] >= 0 ? box.max[1] : box.min[1];
  const minZ = axis[2] >= 0 ? box.min[2] : box.max[2];
  const maxZ = axis[2] >= 0 ? box.max[2] : box.min[2];

  const lo = minX * axis[0] + minY * axis[1] + minZ * axis[2];
  const hi = maxX * axis[0] + maxY * axis[1] + maxZ * axis[2];
  return [lo, hi];
}

function unionWorldBoxes(boxes: WorldBox[]): WorldBox {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    if (b.min[0] < min[0]) min[0] = b.min[0];
    if (b.min[1] < min[1]) min[1] = b.min[1];
    if (b.min[2] < min[2]) min[2] = b.min[2];
    if (b.max[0] > max[0]) max[0] = b.max[0];
    if (b.max[1] > max[1]) max[1] = b.max[1];
    if (b.max[2] > max[2]) max[2] = b.max[2];
  }
  if (!Number.isFinite(min[0])) {
    return { min: [-20, 0, -10], max: [20, 100, 10], center: [0, 50, 0] };
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

/**
 * Exact ray-AABB intersection test for orthographic occlusion.
 * Returns true when the ray `origin + t * dir` (t > 0) intersects a significant
 * depth slice of `[min, max]` strictly in front of `origin`.
 */
export function rayHitsBoxInFront(
  origin: Vec3,
  dir: Vec3,
  min: Vec3,
  max: Vec3,
  minExitT = 2.0,
  minOverlap = 1.5,
): boolean {
  let tmin = -Infinity;
  let tmax = Infinity;

  for (let i = 0; i < 3; i++) {
    const d = dir[i];
    if (Math.abs(d) < 1e-6) {
      if (origin[i] < min[i] || origin[i] > max[i]) return false;
    } else {
      const invD = 1 / d;
      let t1 = (min[i] - origin[i]) * invD;
      let t2 = (max[i] - origin[i]) * invD;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tmin) tmin = t1;
      if (t2 < tmax) tmax = t2;
      if (tmin > tmax) return false;
    }
  }

  if (tmax < minExitT) return false;
  const frontEntry = tmin > 0 ? tmin : 0;
  return tmax - frontEntry >= minOverlap;
}

function buildTargetSamples(targets: MinifigTargetBox[]): {
  samples: WeightedSample[];
  groupBox: WorldBox;
  coreBox: WorldBox;
} {
  const samples: WeightedSample[] = [];
  const allBoxes: WorldBox[] = [];
  const coreBoxes: WorldBox[] = [];

  for (const t of targets) {
    const b = t.box;
    allBoxes.push(b);
    const { weight, isCore } = roleWeight(t.role);
    if (isCore) coreBoxes.push(b);

    const cx = b.center[0];
    const cy = b.center[1];
    const cz = b.center[2];
    const sx = Math.max(0, b.max[0] - b.min[0]);
    const sy = Math.max(0, b.max[1] - b.min[1]);
    const sz = Math.max(0, b.max[2] - b.min[2]);
    const ix = Math.min(2.0, sx * 0.22);
    const iy = Math.min(2.0, sy * 0.22);
    const iz = Math.min(2.0, sz * 0.22);

    samples.push({ pt: [cx, cy, cz], weight: weight * 2.0, isCore });
    if (sx > 1) {
      samples.push({ pt: [b.min[0] + ix, cy, cz], weight, isCore });
      samples.push({ pt: [b.max[0] - ix, cy, cz], weight, isCore });
    }
    if (sy > 1) {
      samples.push({ pt: [cx, b.min[1] + iy, cz], weight, isCore });
      samples.push({ pt: [cx, b.max[1] - iy, cz], weight, isCore });
    }
    if (sz > 1) {
      samples.push({ pt: [cx, cy, b.min[2] + iz], weight, isCore });
      samples.push({ pt: [cx, cy, b.max[2] - iz], weight, isCore });
    }
  }

  const groupBox = unionWorldBoxes(allBoxes);
  const coreBox = coreBoxes.length > 0 ? unionWorldBoxes(coreBoxes) : groupBox;
  return { samples, groupBox, coreBox };
}

/**
 * Evaluates orthographic visibility of a minifigure from a specific (az, el) camera angle
 * against all previously placed model bricks.
 */
export function evaluateMinifigCameraVisibility(
  targets: MinifigTargetBox[],
  occluders: OccluderBox[],
  azDeg: number,
  elDeg: number,
  minifigForward?: Vec3,
  precomputed?: {
    samples: WeightedSample[];
    groupBox: WorldBox;
    coreBox: WorldBox;
  },
): CameraVisibilityMetrics {
  const { samples, groupBox, coreBox } = precomputed ?? buildTargetSamples(targets);
  const { viewDir, right, up } = cameraBasis(azDeg, elDeg);

  // Horizontal front-face alignment [0..1] (1 = camera looks directly at minifigure's front/face)
  let frontAlignment = 0.5;
  if (minifigForward) {
    const fLen = Math.hypot(minifigForward[0], minifigForward[2]);
    const cLen = Math.hypot(viewDir[0], viewDir[2]);
    if (fLen > 1e-4 && cLen > 1e-4) {
      const dotXZ =
        (minifigForward[0] * viewDir[0] + minifigForward[2] * viewDir[2]) / (fLen * cLen);
      frontAlignment = Math.max(0, Math.min(1, (dotXZ + 1) * 0.5));
    }
  }

  if (samples.length === 0 || occluders.length === 0) {
    return {
      bodyVisibility: 1,
      coreVisibility: 1,
      haloVisibility: 1,
      frontAlignment,
    };
  }

  // Broad-phase filter: discard occluders completely behind the minifigure or outside its padded 2D screen box
  const [mfMinD] = boxProjectionInterval(groupBox, viewDir);
  const [mfMinR, mfMaxR] = boxProjectionInterval(groupBox, right);
  const [mfMinU, mfMaxU] = boxProjectionInterval(groupBox, up);
  const haloPad = 12;

  const activeOccluders: OccluderBox[] = [];
  for (let i = 0; i < occluders.length; i++) {
    const occ = occluders[i];
    const [, occMaxD] = boxProjectionInterval(occ.box, viewDir);
    if (occMaxD < mfMinD + 1.5) continue;

    const [occMinR, occMaxR] = boxProjectionInterval(occ.box, right);
    if (occMaxR < mfMinR - haloPad || occMinR > mfMaxR + haloPad) continue;

    const [occMinU, occMaxU] = boxProjectionInterval(occ.box, up);
    if (occMaxU < mfMinU - haloPad || occMinU > mfMaxU + haloPad) continue;

    activeOccluders.push(occ);
  }

  if (activeOccluders.length === 0) {
    return {
      bodyVisibility: 1,
      coreVisibility: 1,
      haloVisibility: 1,
      frontAlignment,
    };
  }

  // Sort opaque occluders first so rays early-exit on opaque hits immediately
  const opaqueOccluders: OccluderBox[] = [];
  const transOccluders: OccluderBox[] = [];
  for (const occ of activeOccluders) {
    if (occ.transparent) transOccluders.push(occ);
    else opaqueOccluders.push(occ);
  }

  let bodyVisSum = 0;
  let bodyWeightSum = 0;
  let coreVisSum = 0;
  let coreWeightSum = 0;

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    let occAmount = 0;

    for (let j = 0; j < opaqueOccluders.length; j++) {
      const b = opaqueOccluders[j].box;
      if (rayHitsBoxInFront(s.pt, viewDir, b.min, b.max, 2.0, 1.5)) {
        occAmount = 1.0;
        break;
      }
    }

    if (occAmount < 1.0 && transOccluders.length > 0) {
      for (let j = 0; j < transOccluders.length; j++) {
        const b = transOccluders[j].box;
        if (rayHitsBoxInFront(s.pt, viewDir, b.min, b.max, 2.0, 1.5)) {
          occAmount = 0.45;
          break;
        }
      }
    }

    const vis = 1 - occAmount;
    bodyVisSum += vis * s.weight;
    bodyWeightSum += s.weight;
    if (s.isCore) {
      coreVisSum += vis * s.weight;
      coreWeightSum += s.weight;
    }
  }

  const bodyVisibility = bodyWeightSum > 0 ? bodyVisSum / bodyWeightSum : 1;
  const coreVisibility = coreWeightSum > 0 ? coreVisSum / coreWeightSum : bodyVisibility;

  // Foreground halo clearance: sample 7 upper/side points just outside the core body silhouette
  // so views where the minifigure barely peeks past a model corner lose to truly open foreground views.
  let haloVisibility = 1;
  if (opaqueOccluders.length > 0) {
    const [coreMinR, coreMaxR] = boxProjectionInterval(coreBox, right);
    const [coreMinU, coreMaxU] = boxProjectionInterval(coreBox, up);
    const hr = Math.max(8, (coreMaxR - coreMinR) * 0.5) + 6;
    const hu = Math.max(12, (coreMaxU - coreMinU) * 0.5) + 6;
    const c = coreBox.center;
    const offsets: Array<[number, number]> = [
      [-hr, 0],
      [hr, 0],
      [0, hu],
      [-hr, hu * 0.75],
      [hr, hu * 0.75],
      [-hr, -hu * 0.35],
      [hr, -hu * 0.35],
    ];
    let clearCount = 0;
    for (const [dr, du] of offsets) {
      const hPt: Vec3 = [
        c[0] + right[0] * dr + up[0] * du,
        c[1] + right[1] * dr + up[1] * du,
        c[2] + right[2] * dr + up[2] * du,
      ];
      let blocked = false;
      for (let j = 0; j < opaqueOccluders.length; j++) {
        const b = opaqueOccluders[j].box;
        if (rayHitsBoxInFront(hPt, viewDir, b.min, b.max, 4.0, 2.0)) {
          blocked = true;
          break;
        }
      }
      if (!blocked) clearCount += 1;
    }
    haloVisibility = clearCount / offsets.length;
  }

  return {
    bodyVisibility,
    coreVisibility,
    haloVisibility,
    frontAlignment,
  };
}

/**
 * Computes the official-style rotation cue badge between two model step cameras.
 */
export function computeStudioRotationCue(
  prevCam: Pick<StudioCameraPose, 'side' | 'az'> | null | undefined,
  nextCam: Pick<StudioCameraPose, 'side' | 'az'>,
): StudioRotationCue {
  if (!prevCam) return 'none';
  if (prevCam.side !== nextCam.side) return 'flip_vertical';
  const dAz = normalizeDeltaDeg(nextCam.az - prevCam.az);
  const absD = Math.abs(dAz);
  if (absD < 40) return 'none';
  if (absD >= 135) return 'yaw_180';
  return dAz > 0 ? 'yaw_90_cw' : 'yaw_90_ccw';
}

function nearestCornerForAzimuth(azDeg: number, preferCorner: StudioCornerId): StudioCornerId {
  let bestId: StudioCornerId = STUDIO_CORNERS[0].id;
  let bestDist = Infinity;
  for (const c of STUDIO_CORNERS) {
    const dist = Math.abs(normalizeDeltaDeg(azDeg - c.az));
    const tieBias = c.id === preferCorner ? -0.5 : 0;
    if (dist + tieBias < bestDist) {
      bestDist = dist + tieBias;
      bestId = c.id;
    }
  }
  return bestId;
}

/**
 * Chooses the clearest, unobstructed camera viewpoint for placing a minifigure onto
 * an already-built model. Never leaves the minifigure hiding behind the model when
 * a clear viewpoint exists, prefers seeing the minifigure's front/face when views
 * are equally clear, and falls back to elevated or cardinal viewpoints for interior
 * cabs and alcoves.
 */
export function chooseMinifigPlacementCamera(
  targets: MinifigTargetBox[],
  occluders: OccluderBox[],
  minifigForward?: Vec3,
  prevCamera: StudioCameraPose = DEFAULT_STUDIO_CAMERA,
): PlacementCameraChoice {
  const precomputed = buildTargetSamples(targets);

  const candidates: CandidateView[] = [
    // Tier 1: Standard official 4 canonical top 3/4 corners (el = 30 deg)
    ...STUDIO_CORNERS.map((c) => ({
      corner: c.id,
      az: c.az,
      el: 30,
      tierPenalty: 0,
    })),
    // Tier 2a: Elevated top 3/4 corners (el = 52 deg) for open-top interiors / cabs
    ...STUDIO_CORNERS.map((c) => ({
      corner: c.id,
      az: c.az,
      el: 52,
      tierPenalty: 0.1,
    })),
    // Tier 2b: Low eye-level top 3/4 corners (el = 14 deg) for roof overhangs / canopies
    ...STUDIO_CORNERS.map((c) => ({
      corner: c.id,
      az: c.az,
      el: 14,
      tierPenalty: 0.11,
    })),
    // Tier 3: Cardinal front/back/side views (el = 30 deg) for alcoves / doorways
    ...[0, 90, 180, 270].map((az) => ({
      corner: nearestCornerForAzimuth(az, prevCamera.corner),
      az,
      el: 30,
      tierPenalty: 0.13,
    })),
    // Tier 4a: Low eye-level cardinal views (el = 14 deg) for covered doorways / alcoves
    ...[0, 90, 180, 270].map((az) => ({
      corner: nearestCornerForAzimuth(az, prevCamera.corner),
      az,
      el: 14,
      tierPenalty: 0.18,
    })),
    // Tier 4b: Elevated cardinal views (el = 52 deg) for tight walled recesses
    ...[0, 90, 180, 270].map((az) => ({
      corner: nearestCornerForAzimuth(az, prevCamera.corner),
      az,
      el: 52,
      tierPenalty: 0.19,
    })),
  ];

  let best: PlacementCameraChoice | null = null;

  for (const cand of candidates) {
    const metrics = evaluateMinifigCameraVisibility(
      targets,
      occluders,
      cand.az,
      cand.el,
      minifigForward,
      precomputed,
    );

    const absDeltaAz = Math.abs(normalizeDeltaDeg(cand.az - prevCamera.az));
    const rotPenalty = absDeltaAz < 20 ? 0 : absDeltaAz <= 115 ? 0.09 : 0.12;

    const score =
      metrics.bodyVisibility * 0.65 +
      metrics.coreVisibility * 0.35 +
      metrics.haloVisibility * 0.14 +
      metrics.frontAlignment * 0.08 -
      rotPenalty -
      cand.tierPenalty;

    if (!best || score > best.score + 1e-6) {
      best = {
        side: 'top',
        corner: cand.corner,
        az: cand.az,
        el: cand.el,
        cue: computeStudioRotationCue(prevCamera, { side: 'top', az: cand.az }),
        ...metrics,
        score,
      };
    }
  }

  return (
    best ?? {
      ...DEFAULT_STUDIO_CAMERA,
      cue: 'none',
      bodyVisibility: 1,
      coreVisibility: 1,
      haloVisibility: 1,
      frontAlignment: 0.5,
      score: 1,
    }
  );
}
