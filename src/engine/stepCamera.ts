import {
  DEFAULT_STUDIO_CAMERA,
  STUDIO_CORNERS,
  cameraBasis,
  computeStudioRotationCue,
  rayHitsBoxInFront,
  type OccluderBox,
  type StudioCameraPose,
  type StudioCornerId,
  type StudioRotationCue,
} from './minifigCamera';
import type { Vec3, WorldBox } from './minifigPose';

export interface StepOcclusionMetrics {
  /** Combined visibility score in [0..1] weighting both average and worst-case brick visibility. */
  visibility: number;
  /** Mean weighted visibility across all bricks in the step. */
  meanVisibility: number;
  /** Lowest per-brick visibility among bricks in the step. */
  minVisibility: number;
}

export interface StudioStepCameraChoice extends StudioCameraPose {
  cue: StudioRotationCue;
  visibility: number;
}

export interface OptimizableStepCameraInput {
  stepBoxes: readonly WorldBox[];
  /** Shared or per-step occluder list containing boxes placed BEFORE this step. */
  occludersBefore: ReadonlyArray<WorldBox | OccluderBox>;
  /** Optional prefix length into `occludersBefore` to avoid copying arrays per step. */
  occluderCountBefore?: number;
  builtBoundsBefore: WorldBox | null;
  /** True for large section/roof attachment steps that should stay extra steady. */
  isSectionAttach?: boolean;
}

export interface OptimizeStepCameraOptions {
  /** Starting camera carried over from a previous segment (e.g. prior bag or minifigure placement). */
  initialCamera?: StudioCameraPose | null;
}

export interface StepFramingInput {
  focusMode?: string;
  hasPrevParts: boolean;
  fullCenter: Vec3;
  fullRadius: number;
  newCenter: Vec3 | null;
  newRadius: number;
}

export interface StepFramingResult {
  center: Vec3;
  radius: number;
  isZoomedIn: boolean;
}

export interface CanonicalStudioView extends StudioCameraPose {
  yawIndex: number;
  isBottom: boolean;
}

export const CANONICAL_STUDIO_VIEWS: readonly CanonicalStudioView[] = [
  ...STUDIO_CORNERS.map((c) => ({
    side: 'top' as const,
    corner: c.id,
    az: c.az,
    el: 30,
    yawIndex: c.yawIndex,
    isBottom: false,
  })),
  ...STUDIO_CORNERS.map((c) => ({
    side: 'bottom' as const,
    corner: c.id,
    az: c.az,
    el: -30,
    yawIndex: c.yawIndex,
    isBottom: true,
  })),
];

/** Visibility at or above this threshold is clearly readable and incurs ZERO penalty to stay put. */
export const STEP_VISIBILITY_DEADBAND = 0.72;
/** Minimum top visibility below which an underside flip may even be considered. */
export const UNDERSIDE_TOP_OCCLUSION_THRESHOLD = 0.55;
/** Maximum vertical gap (LDU) between a brick's top and an overhead ceiling to count as true underside attachment. */
export const UNDERSIDE_MAX_OVERHEAD_GAP_LDU = 32;

/** Strong transition costs prevent jitter, 1-step ping-pongs, and gratuitous layer-by-layer spinning. */
export const STEP_CAMERA_YAW_90_COST = 0.68;
export const STEP_CAMERA_YAW_180_COST = 0.95;
export const STEP_CAMERA_FLIP_COST = 1.35;

/** Auto framing stays steady on the full model up to this bounding radius (~34 studs across). */
export const AUTO_FOCUS_MIN_FULL_RADIUS_LDU = 340;
export const AUTO_FOCUS_MAX_NEW_RATIO = 0.24;

const CORNER_YAW_INDEX = new Map<StudioCornerId, number>(
  STUDIO_CORNERS.map((c) => [c.id, c.yawIndex]),
);

const CORNER_DIR_XZ = new Map<StudioCornerId, { dirX: number; dirZ: number }>(
  STUDIO_CORNERS.map((c) => {
    const rad = (c.az * Math.PI) / 180;
    return [c.id, { dirX: Math.sin(rad), dirZ: Math.cos(rad) }];
  }),
);

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function isOccluderWrapper(item: WorldBox | OccluderBox): item is OccluderBox {
  return 'box' in item;
}

function extractBox(item: WorldBox | OccluderBox): WorldBox {
  return isOccluderWrapper(item) ? item.box : item;
}

function isTransparentOccluder(item: WorldBox | OccluderBox): boolean {
  return isOccluderWrapper(item) ? Boolean(item.transparent) : false;
}

function unionBoxes(boxes: readonly WorldBox[]): WorldBox {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < boxes.length; i++) {
    const b = boxes[i];
    if (b.min[0] < min[0]) min[0] = b.min[0];
    if (b.min[1] < min[1]) min[1] = b.min[1];
    if (b.min[2] < min[2]) min[2] = b.min[2];
    if (b.max[0] > max[0]) max[0] = b.max[0];
    if (b.max[1] > max[1]) max[1] = b.max[1];
    if (b.max[2] > max[2]) max[2] = b.max[2];
  }
  if (!Number.isFinite(min[0])) {
    return { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0] };
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

function boxProjectionInterval(box: WorldBox, axis: Vec3): [number, number] {
  const minX = axis[0] >= 0 ? box.min[0] : box.max[0];
  const maxX = axis[0] >= 0 ? box.max[0] : box.min[0];
  const minY = axis[1] >= 0 ? box.min[1] : box.max[1];
  const maxY = axis[1] >= 0 ? box.max[1] : box.min[1];
  const minZ = axis[2] >= 0 ? box.min[2] : box.max[2];
  const maxZ = axis[2] >= 0 ? box.max[2] : box.min[2];
  return [
    minX * axis[0] + minY * axis[1] + minZ * axis[2],
    maxX * axis[0] + maxY * axis[1] + maxZ * axis[2],
  ];
}

/**
 * Fraction of `a`'s volume strictly overlapping `b`. Used to ignore coarse concave
 * parent AABBs that envelop a newly placed brick (e.g., inside an arch/L-brick cutout).
 */
function boxOverlapRatioOfFirst(a: WorldBox, b: WorldBox): number {
  const ox = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
  if (ox <= 0.5) return 0;
  const oy = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
  if (oy <= 0.5) return 0;
  const oz = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
  if (oz <= 0.5) return 0;
  const volA = Math.max(
    1,
    (a.max[0] - a.min[0]) * (a.max[1] - a.min[1]) * (a.max[2] - a.min[2]),
  );
  return (ox * oy * oz) / volA;
}

function cornerDot(box: WorldBox, corner: StudioCornerId, refBounds: WorldBox): number {
  const dir = CORNER_DIR_XZ.get(corner) ?? CORNER_DIR_XZ.get('front_right')!;
  const halfX = Math.max(20, (refBounds.max[0] - refBounds.min[0]) * 0.5);
  const halfZ = Math.max(20, (refBounds.max[2] - refBounds.min[2]) * 0.5);
  const nx = clamp((box.center[0] - refBounds.center[0]) / halfX, -1.5, 1.5);
  const nz = clamp((box.center[2] - refBounds.center[2]) / halfZ, -1.5, 1.5);
  return nx * dir.dirX + nz * dir.dirZ;
}

/**
 * Checks whether a step's bricks sit strictly and closely underneath already-built
 * overhead structure (not merely inside an open room far beneath a high roof).
 */
export function isStrictUndersidePlacement(
  stepBoxes: readonly WorldBox[],
  builtBoxes: ReadonlyArray<WorldBox | OccluderBox>,
  builtBounds: WorldBox | null,
  builtCountLimit?: number,
): boolean {
  const occCount = Math.min(builtBoxes.length, builtCountLimit ?? builtBoxes.length);
  if (stepBoxes.length === 0 || !builtBounds || occCount < 4) return false;
  const builtHeight = builtBounds.max[1] - builtBounds.min[1];
  if (builtHeight < 24) return false;

  const lowerCutoffY = builtBounds.min[1] + Math.max(24, builtHeight * 0.4);
  let coveredCount = 0;

  for (let si = 0; si < stepBoxes.length; si++) {
    const sb = stepBoxes[si];
    if (sb.max[1] > lowerCutoffY) continue;

    const area = Math.max(1, (sb.max[0] - sb.min[0]) * (sb.max[2] - sb.min[2]));
    let maxCoverRatio = 0;
    let totalCoverArea = 0;

    for (let bi = 0; bi < occCount; bi++) {
      const bb = extractBox(builtBoxes[bi]);
      // Overhead brick must sit directly above (within ~1.3 bricks vertically) — not a distant roof
      if (bb.min[1] < sb.max[1] - 4) continue;
      if (bb.min[1] > sb.max[1] + UNDERSIDE_MAX_OVERHEAD_GAP_LDU) continue;
      if (bb.max[1] <= sb.max[1] + 4) continue;

      const ovX = Math.max(0, Math.min(sb.max[0], bb.max[0]) - Math.max(sb.min[0], bb.min[0]));
      const ovZ = Math.max(0, Math.min(sb.max[2], bb.max[2]) - Math.max(sb.min[2], bb.min[2]));
      if (ovX <= 2 || ovZ <= 2) continue;

      const ovArea = ovX * ovZ;
      totalCoverArea += ovArea;
      const ratio = ovArea / area;
      if (ratio > maxCoverRatio) maxCoverRatio = ratio;
    }

    if (maxCoverRatio >= 0.55 || totalCoverArea / area >= 0.7) {
      coveredCount++;
    }
  }

  return coveredCount >= Math.ceil(stepBoxes.length * 0.6);
}

interface ViewOccluderProjections {
  maxD: Float64Array;
  minR: Float64Array;
  maxR: Float64Array;
  minU: Float64Array;
  maxU: Float64Array;
  transparent: Uint8Array;
  boxes: WorldBox[];
}

function buildViewOccluderProjections(
  occluders: ReadonlyArray<WorldBox | OccluderBox>,
  azDeg: number,
  elDeg: number,
): ViewOccluderProjections {
  const n = occluders.length;
  const { viewDir, right, up } = cameraBasis(azDeg, elDeg);
  const maxD = new Float64Array(n);
  const minR = new Float64Array(n);
  const maxR = new Float64Array(n);
  const minU = new Float64Array(n);
  const maxU = new Float64Array(n);
  const transparent = new Uint8Array(n);
  const boxes = new Array<WorldBox>(n);

  const dx = viewDir[0], dy = viewDir[1], dz = viewDir[2];
  const rx = right[0], ry = right[1], rz = right[2];
  const ux = up[0], uy = up[1], uz = up[2];

  for (let i = 0; i < n; i++) {
    const item = occluders[i];
    const b = extractBox(item);
    boxes[i] = b;
    transparent[i] = isTransparentOccluder(item) ? 1 : 0;

    const bMinX = b.min[0], bMaxX = b.max[0];
    const bMinY = b.min[1], bMaxY = b.max[1];
    const bMinZ = b.min[2], bMaxZ = b.max[2];

    maxD[i] =
      (dx >= 0 ? bMaxX : bMinX) * dx +
      (dy >= 0 ? bMaxY : bMinY) * dy +
      (dz >= 0 ? bMaxZ : bMinZ) * dz;

    minR[i] =
      (rx >= 0 ? bMinX : bMaxX) * rx +
      (ry >= 0 ? bMinY : bMaxY) * ry +
      (rz >= 0 ? bMinZ : bMaxZ) * rz;
    maxR[i] =
      (rx >= 0 ? bMaxX : bMinX) * rx +
      (ry >= 0 ? bMaxY : bMinY) * ry +
      (rz >= 0 ? bMaxZ : bMinZ) * rz;

    minU[i] =
      (ux >= 0 ? bMinX : bMaxX) * ux +
      (uy >= 0 ? bMinY : bMaxY) * uy +
      (uz >= 0 ? bMinZ : bMaxZ) * uz;
    maxU[i] =
      (ux >= 0 ? bMaxX : bMinX) * ux +
      (uy >= 0 ? bMaxY : bMinY) * uy +
      (uz >= 0 ? bMaxZ : bMinZ) * uz;
  }

  return { maxD, minR, maxR, minU, maxU, transparent, boxes };
}

function evaluateStepVisibilityWithProj(
  stepBoxes: readonly WorldBox[],
  proj: ViewOccluderProjections,
  occCount: number,
  azDeg: number,
  elDeg: number,
): StepOcclusionMetrics {
  if (stepBoxes.length === 0 || occCount === 0) {
    return { visibility: 1, meanVisibility: 1, minVisibility: 1 };
  }

  // Subsample evenly if attaching a huge pre-built section/submodel (>16 bricks)
  let sampledBoxes: readonly WorldBox[] = stepBoxes;
  if (stepBoxes.length > 16) {
    const picked: WorldBox[] = [];
    const stride = stepBoxes.length / 16;
    for (let k = 0; k < 16; k++) {
      picked.push(stepBoxes[Math.min(stepBoxes.length - 1, Math.floor(k * stride))]);
    }
    sampledBoxes = picked;
  }

  const { viewDir, right, up } = cameraBasis(azDeg, elDeg);
  const stepUnion = unionBoxes(sampledBoxes);
  const [stepMinD] = boxProjectionInterval(stepUnion, viewDir);
  const [stepMinR, stepMaxR] = boxProjectionInterval(stepUnion, right);
  const [stepMinU, stepMaxU] = boxProjectionInterval(stepUnion, up);
  const pad = 2.5;

  const { maxD, minR, maxR, minU, maxU, transparent, boxes } = proj;
  const activeIndices: number[] = [];

  for (let i = 0; i < occCount; i++) {
    if (maxD[i] < stepMinD + 1.5) continue;
    if (maxR[i] < stepMinR - pad || minR[i] > stepMaxR + pad) continue;
    if (maxU[i] < stepMinU - pad || minU[i] > stepMaxU + pad) continue;
    activeIndices.push(i);
  }

  if (activeIndices.length === 0) {
    return { visibility: 1, meanVisibility: 1, minVisibility: 1 };
  }

  const isBottom = elDeg < 0;
  let sumVis = 0;
  let minVis = 1;

  for (let bi = 0; bi < sampledBoxes.length; bi++) {
    const b = sampledBoxes[bi];
    const [bMinD] = boxProjectionInterval(b, viewDir);
    const [bMinR, bMaxR] = boxProjectionInterval(b, right);
    const [bMinU, bMaxU] = boxProjectionInterval(b, up);

    // Per-brick broad-phase culling + skip coarse concave parent AABBs enveloping this brick
    const brickOpaque: WorldBox[] = [];
    const brickTrans: WorldBox[] = [];
    for (let k = 0; k < activeIndices.length; k++) {
      const idx = activeIndices[k];
      if (maxD[idx] < bMinD + 1.5) continue;
      if (maxR[idx] < bMinR - 1.5 || minR[idx] > bMaxR + 1.5) continue;
      if (maxU[idx] < bMinU - 1.5 || minU[idx] > bMaxU + 1.5) continue;
      const occ = boxes[idx];
      if (boxOverlapRatioOfFirst(b, occ) > 0.35) continue;
      if (transparent[idx]) brickTrans.push(occ);
      else brickOpaque.push(occ);
    }

    if (brickOpaque.length === 0 && brickTrans.length === 0) {
      sumVis += 1;
      continue;
    }

    const cx = b.center[0];
    const cy = b.center[1];
    const cz = b.center[2];
    const sx = Math.max(0, b.max[0] - b.min[0]);
    const sy = Math.max(0, b.max[1] - b.min[1]);
    const sz = Math.max(0, b.max[2] - b.min[2]);
    const ix = Math.min(3.0, sx * 0.25);
    const iy = Math.min(2.5, sy * 0.25);
    const iz = Math.min(3.0, sz * 0.25);

    const pts: Array<{ pt: Vec3; weight: number }> = [
      { pt: [cx, cy, cz], weight: 2.5 },
    ];
    if (sy > 1) {
      pts.push({ pt: [cx, b.max[1] - iy, cz], weight: isBottom ? 0.6 : 2.5 });
      pts.push({ pt: [cx, b.min[1] + iy, cz], weight: isBottom ? 2.5 : 0.6 });
    }
    if (sx > 1) {
      pts.push({ pt: [b.min[0] + ix, cy, cz], weight: 1.0 });
      pts.push({ pt: [b.max[0] - ix, cy, cz], weight: 1.0 });
    }
    if (sz > 1) {
      pts.push({ pt: [cx, cy, b.min[2] + iz], weight: 1.0 });
      pts.push({ pt: [cx, cy, b.max[2] - iz], weight: 1.0 });
    }

    let visWeightSum = 0;
    let totalWeight = 0;

    for (let pi = 0; pi < pts.length; pi++) {
      const { pt, weight } = pts[pi];
      let occAmt = 0;

      for (let j = 0; j < brickOpaque.length; j++) {
        const occ = brickOpaque[j];
        if (rayHitsBoxInFront(pt, viewDir, occ.min, occ.max, 2.0, 2.0)) {
          occAmt = 1.0;
          break;
        }
      }

      if (occAmt < 1.0 && brickTrans.length > 0) {
        for (let j = 0; j < brickTrans.length; j++) {
          const occ = brickTrans[j];
          if (rayHitsBoxInFront(pt, viewDir, occ.min, occ.max, 2.0, 2.0)) {
            occAmt = 0.4;
            break;
          }
        }
      }

      visWeightSum += (1 - occAmt) * weight;
      totalWeight += weight;
    }

    const brickVis = totalWeight > 0 ? visWeightSum / totalWeight : 1;
    sumVis += brickVis;
    if (brickVis < minVis) minVis = brickVis;
  }

  const meanVisibility = sumVis / sampledBoxes.length;
  const visibility = meanVisibility * 0.72 + minVis * 0.28;
  return { visibility, meanVisibility, minVisibility: minVis };
}

/**
 * Evaluates true orthographic ray-AABB visibility of a step's newly added bricks
 * against all previously placed bricks from `(azDeg, elDeg)`.
 *
 * Uses broad-phase depth & 2D screen-box culling matching `WebGLBrickEngine.computeMVP`,
 * skips coarse concave self-overlapping container AABBs, and treats transparent occluders
 * (glass/windshields) as only partially occluding.
 */
export function evaluateStepOcclusionVisibility(
  stepBoxes: readonly WorldBox[],
  occluders: ReadonlyArray<WorldBox | OccluderBox>,
  azDeg: number,
  elDeg: number,
  occluderCountLimit?: number,
): StepOcclusionMetrics {
  const occCount = Math.min(occluders.length, occluderCountLimit ?? occluders.length);
  if (stepBoxes.length === 0 || occCount === 0) {
    return { visibility: 1, meanVisibility: 1, minVisibility: 1 };
  }
  const slice = occCount === occluders.length ? occluders : occluders.slice(0, occCount);
  const proj = buildViewOccluderProjections(slice, azDeg, elDeg);
  return evaluateStepVisibilityWithProj(stepBoxes, proj, occCount, azDeg, elDeg);
}

/**
 * Piecewise visibility penalty with a zero-cost deadband (`vis >= deadband`):
 * - Clearly readable steps (`vis >= 0.72`) have **0.00** penalty, so the camera never
 *   leaves a good angle merely to chase tiny marginal gains.
 * - Mild partial occlusion (`0.35..0.72`) incurs a modest ramp that avoids 1-step
 *   ping-pongs while still justifying a clean turn for multi-step hidden runs.
 * - Severe occlusion (`< 0.35`) escalates steeply so truly hidden or underside bricks
 *   reliably rotate/flip into view.
 */
export function stepVisibilityPenalty(
  visibility: number,
  deadband = STEP_VISIBILITY_DEADBAND,
): number {
  const v = clamp(visibility, 0, 1);
  if (v >= deadband) return 0;
  const severeEdge = Math.min(0.35, deadband * 0.5);
  if (v >= severeEdge) {
    return ((deadband - v) / Math.max(0.01, deadband - severeEdge)) * 0.65;
  }
  return 0.65 + ((severeEdge - v) / Math.max(0.01, severeEdge)) * 2.4;
}

/**
 * Transition penalty between two canonical studio poses.
 */
export function stepCameraTransitionCost(
  from: Pick<StudioCameraPose, 'side' | 'corner'>,
  to: Pick<StudioCameraPose, 'side' | 'corner'>,
): number {
  if (from.side === to.side && from.corner === to.corner) return 0;
  const flipCost = from.side !== to.side ? STEP_CAMERA_FLIP_COST : 0;
  const yFrom = CORNER_YAW_INDEX.get(from.corner) ?? 0;
  const yTo = CORNER_YAW_INDEX.get(to.corner) ?? 0;
  const diff = Math.abs(yFrom - yTo);
  const minYawSteps = Math.min(diff, 4 - diff);
  const yawCost =
    minYawSteps === 0
      ? 0
      : minYawSteps === 1
        ? STEP_CAMERA_YAW_90_COST
        : STEP_CAMERA_YAW_180_COST;
  return flipCost + yawCost;
}

/**
 * Global Viterbi Dynamic Programming camera sequence optimizer for a continuous
 * section, bag chain, join sequence, or submodel.
 *
 * Minimizes `sum_t [ VisibilityPenalty(t, v_t) + TransitionCost(v_{t-1} -> v_t) ]`
 * over exact orthographic ray-AABB occlusion across all steps at once:
 * - Zero rotations whenever the current camera keeps all steps above the readability deadband.
 * - Eliminates 1-step ping-pongs and unnecessary layer-by-layer spinning.
 * - Picks shared viewpoints across consecutive occluded steps instead of chaining turns.
 * - Permits underside flips only when bricks are strictly tucked underneath overhead structure
 *   and occluded from top views.
 */
export function optimizeStudioStepCameraSequence(
  steps: readonly OptimizableStepCameraInput[],
  options: OptimizeStepCameraOptions = {},
): StudioStepCameraChoice[] {
  const T = steps.length;
  if (T === 0) return [];

  const V = CANONICAL_STUDIO_VIEWS.length;
  const initialCam = options.initialCamera ?? null;

  const dp: number[][] = Array.from({ length: T }, () => new Array<number>(V).fill(Infinity));
  const backptr: number[][] = Array.from({ length: T }, () => new Array<number>(V).fill(0));
  const visTable: number[][] = Array.from({ length: T }, () => new Array<number>(V).fill(1));
  const stepUnionBoxes: WorldBox[] = steps.map((s) => unionBoxes(s.stepBoxes));
  const projCache = new Map<
    ReadonlyArray<WorldBox | OccluderBox>,
    Array<ViewOccluderProjections | undefined>
  >();
  const getProj = (
    occs: ReadonlyArray<WorldBox | OccluderBox>,
    viewIdx: number,
  ): ViewOccluderProjections => {
    let perView = projCache.get(occs);
    if (!perView) {
      perView = new Array<ViewOccluderProjections | undefined>(V);
      projCache.set(occs, perView);
    }
    let p = perView[viewIdx];
    if (!p) {
      const view = CANONICAL_STUDIO_VIEWS[viewIdx];
      p = buildViewOccluderProjections(occs, view.az, view.el);
      perView[viewIdx] = p;
    }
    return p;
  };

  for (let t = 0; t < T; t++) {
    const step = steps[t];
    const occCount = Math.min(
      step.occludersBefore.length,
      step.occluderCountBefore ?? step.occludersBefore.length,
    );
    const builtBounds = step.builtBoundsBefore;
    const spanX = builtBounds ? builtBounds.max[0] - builtBounds.min[0] : 0;
    const spanY = builtBounds ? builtBounds.max[1] - builtBounds.min[1] : 0;
    const spanZ = builtBounds ? builtBounds.max[2] - builtBounds.min[2] : 0;
    const isTinyEarlyBase = occCount < 4 || (Math.max(spanX, spanZ) < 80 && spanY < 40);

    // Evaluate all 4 top canonical views first
    let bestTopVis = 0;
    for (let v = 0; v < 4; v++) {
      if (isTinyEarlyBase || step.stepBoxes.length === 0) {
        visTable[t][v] = 1;
      } else {
        const view = CANONICAL_STUDIO_VIEWS[v];
        visTable[t][v] = evaluateStepVisibilityWithProj(
          step.stepBoxes,
          getProj(step.occludersBefore, v),
          occCount,
          view.az,
          view.el,
        ).visibility;
      }
      if (visTable[t][v] > bestTopVis) bestTopVis = visTable[t][v];
    }

    // Only allow bottom views when bricks are genuinely tucked directly underneath AND hidden from top
    const allowBottom =
      !isTinyEarlyBase &&
      !step.isSectionAttach &&
      bestTopVis < UNDERSIDE_TOP_OCCLUSION_THRESHOLD &&
      isStrictUndersidePlacement(step.stepBoxes, step.occludersBefore, builtBounds, occCount);

    for (let v = 4; v < V; v++) {
      if (!allowBottom) {
        visTable[t][v] = -1;
      } else {
        const view = CANONICAL_STUDIO_VIEWS[v];
        visTable[t][v] = evaluateStepVisibilityWithProj(
          step.stepBoxes,
          getProj(step.occludersBefore, v),
          occCount,
          view.az,
          view.el,
        ).visibility;
      }
    }

    const deadband = step.isSectionAttach ? 0.6 : STEP_VISIBILITY_DEADBAND;

    for (let v = 0; v < V; v++) {
      const view = CANONICAL_STUDIO_VIEWS[v];
      if (view.isBottom && !allowBottom) continue;

      const vis = visTable[t][v];
      const uprightBias = view.isBottom ? 0.12 : 0;
      const startAnchorBias =
        t === 0 && !initialCam && !view.isBottom && view.corner === DEFAULT_STUDIO_CAMERA.corner
          ? -0.08
          : 0;
      const emissionCost = stepVisibilityPenalty(vis, deadband) + uprightBias + startAnchorBias;

      if (t === 0) {
        const initTransCost = initialCam ? stepCameraTransitionCost(initialCam, view) : 0;
        // One-time non-accumulating tie-break toward facing corner only when transitioning
        const initTieBreak =
          initTransCost > 0 && builtBounds
            ? -0.01 * clamp(cornerDot(stepUnionBoxes[t], view.corner, builtBounds), -1, 1)
            : 0;
        dp[t][v] = initTransCost + initTieBreak + emissionCost;
        backptr[t][v] = v;
      } else {
        let bestPrev = 0;
        let bestCost = Infinity;
        for (let u = 0; u < V; u++) {
          if (!Number.isFinite(dp[t - 1][u])) continue;
          const prevView = CANONICAL_STUDIO_VIEWS[u];
          const baseTrans = stepCameraTransitionCost(prevView, view);
          // Tiny one-time tie-break ONLY on actual turns (u !== v) so it never accumulates while staying put
          const tieBreak =
            u !== v && builtBounds
              ? -0.01 * clamp(cornerDot(stepUnionBoxes[t], view.corner, builtBounds), -1, 1)
              : 0;
          const c = dp[t - 1][u] + baseTrans + tieBreak;
          if (c < bestCost) {
            bestCost = c;
            bestPrev = u;
          }
        }
        dp[t][v] = bestCost + emissionCost;
        backptr[t][v] = bestPrev;
      }
    }
  }

  let bestEnd = 0;
  let bestEndCost = Infinity;
  for (let v = 0; v < V; v++) {
    if (dp[T - 1][v] < bestEndCost) {
      bestEndCost = dp[T - 1][v];
      bestEnd = v;
    }
  }

  const chosenIdx: number[] = new Array<number>(T);
  let curr = bestEnd;
  for (let t = T - 1; t >= 0; t--) {
    chosenIdx[t] = curr;
    curr = backptr[t][curr];
  }

  const out: StudioStepCameraChoice[] = [];
  for (let t = 0; t < T; t++) {
    const view = CANONICAL_STUDIO_VIEWS[chosenIdx[t]];
    const prevPose: StudioCameraPose | null =
      t === 0 ? initialCam : out[t - 1];
    out.push({
      side: view.side,
      corner: view.corner,
      az: view.az,
      el: view.el,
      cue: prevPose ? computeStudioRotationCue(prevPose, view) : 'none',
      visibility: Math.max(0, visTable[t][chosenIdx[t]]),
    });
  }

  return out;
}

/**
 * Computes steady orthographic framing `(center, radius)` for a step render.
 *
 * - `'full'`: Always frames the entire model built so far.
 * - `'focus'`: Explicit user Close-Up zoomed tightly onto newly added bricks.
 * - `'auto'` (default): Keeps framing rock-steady on the full built model for all
 *   normal, medium, and subdivided builds (`fullRadius <= 340` LDU), preventing
 *   jarring zoom-in/zoom-out and corner-to-corner panning between steps. Only on
 *   truly massive un-subdivided builds (`fullRadius > 340` LDU) with tiny new details
 *   (`newRadius / fullRadius < 0.24`) does it apply a smooth, bounded, context-preserving
 *   zoom assist.
 */
export function computeStepCameraFraming(input: StepFramingInput): StepFramingResult {
  const mode = input.focusMode || 'auto';
  const { fullCenter, fullRadius, newCenter, newRadius, hasPrevParts } = input;

  if (!hasPrevParts || !newCenter || mode === 'full') {
    return {
      center: [fullCenter[0], fullCenter[1], fullCenter[2]],
      radius: fullRadius,
      isZoomedIn: false,
    };
  }

  if (mode === 'focus') {
    const blend = 0.08;
    const center: Vec3 = [
      newCenter[0] + (fullCenter[0] - newCenter[0]) * blend,
      newCenter[1] + (fullCenter[1] - newCenter[1]) * blend,
      newCenter[2] + (fullCenter[2] - newCenter[2]) * blend,
    ];
    const radius = Math.min(
      fullRadius * 0.85,
      Math.max(newRadius * 2.25, fullRadius * 0.26, 72),
    );
    return {
      center,
      radius,
      isZoomedIn: radius < fullRadius * 0.86,
    };
  }

  // Default 'auto': steady full-model framing unless the un-subdivided model is truly massive
  const ratio = newRadius / Math.max(1, fullRadius);
  if (fullRadius <= AUTO_FOCUS_MIN_FULL_RADIUS_LDU || ratio >= AUTO_FOCUS_MAX_NEW_RATIO) {
    return {
      center: [fullCenter[0], fullCenter[1], fullCenter[2]],
      radius: fullRadius,
      isZoomedIn: false,
    };
  }

  // Smooth continuous ramp with zero hard cliff, keeping >=58% anchor to full model center
  const sizeT = clamp((fullRadius - AUTO_FOCUS_MIN_FULL_RADIUS_LDU) / 160, 0, 1);
  const ratioT = clamp((AUTO_FOCUS_MAX_NEW_RATIO - ratio) / 0.14, 0, 1);
  const t = sizeT * ratioT;

  const targetRadius = Math.min(
    fullRadius,
    Math.max(newRadius * 3.0, fullRadius * 0.62, 180),
  );
  const radius = fullRadius + (targetRadius - fullRadius) * t;
  const centerShift = 0.42 * t;
  const center: Vec3 = [
    fullCenter[0] + (newCenter[0] - fullCenter[0]) * centerShift,
    fullCenter[1] + (newCenter[1] - fullCenter[1]) * centerShift,
    fullCenter[2] + (newCenter[2] - fullCenter[2]) * centerShift,
  ];

  return {
    center,
    radius,
    isZoomedIn: radius < fullRadius * 0.92,
  };
}

export interface StudioStepCameraSource {
  id?: string;
  side?: 'top' | 'bottom' | string;
  corner?: StudioCornerId | string;
  az?: number;
  el?: number;
  cue?: StudioRotationCue | string;
  isStandaloneFigure?: boolean;
  isMinifigPoseStep?: boolean;
}

export interface StudioStepCameraOverrideLike {
  side?: 'top' | 'bottom' | string;
  corner?: StudioCornerId | string;
  az?: number;
  el?: number;
}

export interface StudioStepChapterLike<
  TStep extends StudioStepCameraSource = StudioStepCameraSource,
> {
  id?: string;
  kind?: string;
  sectionId?: string;
  steps?: ReadonlyArray<TStep>;
}

/**
 * Resolves a step's effective 3D camera pose `(side, corner, az, el)`, combining
 * automatic optimizer defaults with any user preset or free-orbit override.
 */
export function resolveStudioStepCamera(
  step: StudioStepCameraSource | null | undefined,
  override?: StudioStepCameraOverrideLike | null,
): StudioCameraPose {
  const ov = override || {};
  const hasOvEl = typeof ov.el === 'number' && Number.isFinite(ov.el);
  const hasStepEl = typeof step?.el === 'number' && Number.isFinite(step.el);
  const rawSide =
    ov.side === 'top' || ov.side === 'bottom'
      ? ov.side
      : hasOvEl
        ? (ov.el! < 0 ? 'bottom' : 'top')
        : step?.side === 'top' || step?.side === 'bottom'
          ? step.side
          : hasStepEl
            ? (step!.el! < 0 ? 'bottom' : 'top')
            : 'top';
  const side: 'top' | 'bottom' = rawSide === 'bottom' ? 'bottom' : 'top';

  const hasOvCorner = typeof ov.corner === 'string' && ov.corner.length > 0;
  const rawCorner = hasOvCorner ? ov.corner : step?.corner || 'front_right';
  const cornerSpec =
    STUDIO_CORNERS.find((c) => c.id === rawCorner) || STUDIO_CORNERS[0];

  const rawAz =
    typeof ov.az === 'number' && Number.isFinite(ov.az)
      ? ov.az
      : hasOvCorner
        ? cornerSpec.az
        : typeof step?.az === 'number' && Number.isFinite(step.az)
          ? step.az
          : cornerSpec.az;
  const az = ((rawAz % 360) + 360) % 360;

  const el = hasOvEl
    ? ov.el!
    : ov.side === 'top' || ov.side === 'bottom'
      ? side === 'bottom'
        ? -30
        : 30
      : hasStepEl
        ? step!.el!
        : side === 'bottom'
          ? -30
          : 30;

  return {
    side,
    corner: cornerSpec.id,
    az,
    el,
  };
}

/**
 * Finds the immediately preceding model build step in the same continuous build
 * sequence as `step` (matching `optimizeManualStepCameras` and `getPreviousPartsForStep`):
 * - Standalone minifigure and minifigure-pose steps are skipped.
 * - Submodel chapters stay isolated in their own local frame.
 * - Main / numbered-bag / join chapters sharing a `sectionId` form one continuous sequence.
 */
export function findPreviousStudioModelStep<TStep extends StudioStepCameraSource>(
  chapters: ReadonlyArray<StudioStepChapterLike<TStep>> | null | undefined,
  chapter: StudioStepChapterLike<TStep> | null | undefined,
  step: TStep | null | undefined,
): TStep | null {
  if (!step || step.isStandaloneFigure || step.isMinifigPoseStep) return null;
  if (!chapter || chapter.kind === 'minifigure') return null;

  const isModelStep = (s: TStep | null | undefined): s is TStep =>
    Boolean(s && !s.isStandaloneFigure && !s.isMinifigPoseStep);
  const isSameStep = (s: TStep) =>
    s === step || (step.id != null && s.id === step.id);

  if (
    chapter.kind === 'submodel' ||
    !Array.isArray(chapters) ||
    chapters.length === 0
  ) {
    const steps = chapter.steps || [];
    let prev: TStep | null = null;
    for (const s of steps) {
      if (isSameStep(s)) return prev;
      if (isModelStep(s)) prev = s;
    }
    return null;
  }

  const secKey = chapter.sectionId || chapter.id;
  let prev: TStep | null = null;
  for (const ch of chapters) {
    if (ch.kind === 'submodel' || ch.kind === 'minifigure') continue;
    if ((ch.sectionId || ch.id) !== secKey) continue;
    const steps = ch.steps || [];
    for (const s of steps) {
      if (isSameStep(s)) return prev;
      if (isModelStep(s)) prev = s;
    }
    if (ch === chapter || (chapter.id != null && ch.id === chapter.id)) {
      break;
    }
  }
  return null;
}

/**
 * Computes the effective rotation indicator cue for `step` relative to its preceding
 * model step in the same continuous section/submodel, always taking both preset and
 * free-orbit camera overrides into account.
 */
export function resolveEffectiveStudioStepCue<TStep extends StudioStepCameraSource>(
  chapters: ReadonlyArray<StudioStepChapterLike<TStep>> | null | undefined,
  chapter: StudioStepChapterLike<TStep> | null | undefined,
  step: TStep | null | undefined,
  overrides?: Readonly<Record<string, StudioStepCameraOverrideLike | undefined>> | null,
): StudioRotationCue {
  if (!step || step.isStandaloneFigure || step.isMinifigPoseStep) return 'none';
  const prevStep = findPreviousStudioModelStep(chapters, chapter, step);
  if (!prevStep) return 'none';
  const prevCam = resolveStudioStepCamera(
    prevStep,
    prevStep.id ? overrides?.[prevStep.id] : undefined,
  );
  const currCam = resolveStudioStepCamera(
    step,
    step.id ? overrides?.[step.id] : undefined,
  );
  return computeStudioRotationCue(prevCam, currCam);
}
