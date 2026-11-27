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
  /** True for pre-built submodel attachment steps (e.g. mechanisms, underside modules, wheel assemblies). */
  isSubmodelAttach?: boolean;
  /** Optional lifted/offset boxes of the attached submodel when `defaultPartOffsets` pulls it above its mating site. */
  shiftedStepBoxes?: readonly WorldBox[];
  /** Optional world-space horizontal outward normals of SNOT parts attaching onto side studs in this step. */
  engagedSideNormals?: readonly Vec3[];
  /** Optional world-space horizontal outward normals of exposed side studs on SNOT brackets/bricks placed in this step. */
  exposedSideStudNormals?: readonly Vec3[];
  /** Optional hard side constraint (e.g. 'bottom' during an upside-down underside assembly phase). */
  forceSide?: 'top' | 'bottom';
}

export interface OptimizeStepCameraOptions {
  /** Starting camera carried over from a previous segment (e.g. prior bag or minifigure placement). */
  initialCamera?: StudioCameraPose | null;
  /** Optional target viewport aspect ratio (width / height) to align elongated models with the page layout. */
  targetAspect?: number | null;
  /** Optional explicit base 3/4 azimuth angle in [24°, 66°] overriding automatic aspect alignment. */
  baseAzimuthDeg?: number | null;
}

export interface StepFramingReadableTarget {
  /** Maximum projected half-width (LDU) that still renders >= minStudSizeCm on a 1-up page. */
  maxHalfW: number;
  /** Maximum projected half-height (LDU) that still renders >= minStudSizeCm on a 1-up page. */
  maxHalfH: number;
  /** Current full-model projected half-width (LDU) at the active camera angle. */
  fullHalfW: number;
  /** Current full-model projected half-height (LDU) at the active camera angle. */
  fullHalfH: number;
  /** Newly added parts' projected half-width (LDU) at the active camera angle. */
  newHalfW: number;
  /** Newly added parts' projected half-height (LDU) at the active camera angle. */
  newHalfH: number;
}

export interface StepFramingInput {
  focusMode?: string;
  hasPrevParts: boolean;
  fullCenter: Vec3;
  fullRadius: number;
  newCenter: Vec3 | null;
  newRadius: number;
  /** Optional physical-page readability bounds so auto framing zooms in cleanly when full view < 0.5 cm/stud. */
  readableTarget?: StepFramingReadableTarget | null;
}

export interface StepFramingResult {
  center: Vec3;
  radius: number;
  isZoomedIn: boolean;
  /** Optional per-axis target half-extents (LDU) when readability-aware auto zoom is active. */
  targetHalfW?: number;
  targetHalfH?: number;
  /** Normalized 0..1 regional crop center & radius within the full model (for optional locator inset). */
  locator?: {
    cxNorm: number;
    czNorm: number;
    radiusNorm: number;
  };
}

export interface CanonicalStudioView extends StudioCameraPose {
  yawIndex: number;
  isBottom: boolean;
}

/**
 * Builds the 8 symmetric top/bottom canonical 3/4 views for a given base azimuth
 * `baseAzDeg` in `[24°, 66°]`. At the default `38°`, produces `[38, 142, 218, 322]`.
 */
export function buildCanonicalViewsForBaseAzimuth(baseAzDeg = 38): readonly CanonicalStudioView[] {
  const theta = Math.round(clamp(Number.isFinite(baseAzDeg) ? baseAzDeg : 38, 24, 66));
  const corners: ReadonlyArray<{ id: StudioCornerId; az: number; yawIndex: number }> = [
    { id: 'front_right', az: theta, yawIndex: 0 },
    { id: 'back_right', az: 180 - theta, yawIndex: 1 },
    { id: 'back_left', az: 180 + theta, yawIndex: 2 },
    { id: 'front_left', az: 360 - theta, yawIndex: 3 },
  ];
  return [
    ...corners.map((c) => ({
      side: 'top' as const,
      corner: c.id,
      az: c.az,
      el: 30,
      yawIndex: c.yawIndex,
      isBottom: false,
    })),
    ...corners.map((c) => ({
      side: 'bottom' as const,
      corner: c.id,
      az: c.az,
      el: -30,
      yawIndex: c.yawIndex,
      isBottom: true,
    })),
  ];
}

export const CANONICAL_STUDIO_VIEWS: readonly CanonicalStudioView[] =
  buildCanonicalViewsForBaseAzimuth(38);

/** Shared orthographic framing margin (6% breathing room around projected bounds). */
export const STEP_CAMERA_FRAMING_MARGIN = 1.06;

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
/** Extra penalty for re-entering bottom view within 2 steps of flipping back upright (stops consecutive flip ping-pongs). */
export const STEP_CAMERA_RAPID_REFLIP_COST = 2.4;

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
 * Evaluates how well a top-down camera azimuth `azDeg` reveals the attaching
 * studs on Step 1 when an upper piece rests on and overhangs a lower base
 * piece. The attaching studs on the lower piece sit on its `lower -> upper`
 * side: viewing from that side (positive alignment with camera vector `v`)
 * places the attaching studs on the camera-facing near edge of the lower piece
 * (negative cost), whereas viewing from the opposite side hides the attaching
 * studs on the far back edge away from the camera (positive cost).
 */
export function computeStep1ConnectionFacingCost(
  stepBoxes: readonly WorldBox[],
  azDeg: number,
  isBottom: boolean,
): number {
  if (isBottom || stepBoxes.length < 2) return 0;

  let sumDx = 0;
  let sumDz = 0;
  let totalWeight = 0;
  const CONTACT_EPS = 5;

  for (let i = 0; i < stepBoxes.length; i++) {
    const lower = stepBoxes[i];
    for (let j = 0; j < stepBoxes.length; j++) {
      if (i === j) continue;
      const upper = stepBoxes[j];
      // Upper piece rests directly on top of lower piece
      if (upper.min[1] < lower.max[1] - CONTACT_EPS || upper.min[1] > lower.max[1] + CONTACT_EPS) {
        continue;
      }
      const ovX = Math.min(lower.max[0], upper.max[0]) - Math.max(lower.min[0], upper.min[0]);
      const ovZ = Math.min(lower.max[2], upper.max[2]) - Math.max(lower.min[2], upper.min[2]);
      if (ovX <= 2 || ovZ <= 2) continue;

      // Only apply when the upper piece genuinely overhangs past the lower piece's edge
      const overhangs =
        upper.min[0] < lower.min[0] - 4 ||
        upper.max[0] > lower.max[0] + 4 ||
        upper.min[2] < lower.min[2] - 4 ||
        upper.max[2] > lower.max[2] + 4;
      if (!overhangs) continue;

      const dx = upper.center[0] - lower.center[0];
      const dz = upper.center[2] - lower.center[2];
      const shift = Math.hypot(dx, dz);
      if (shift < 6) continue;

      const w = ovX * ovZ;
      sumDx += (dx / shift) * w;
      sumDz += (dz / shift) * w;
      totalWeight += w;
    }
  }

  if (totalWeight <= 0) return 0;
  const dirLen = Math.hypot(sumDx, sumDz);
  if (dirLen < 1e-4) return 0;
  const ux = sumDx / dirLen;
  const uz = sumDz / dirLen;

  // Horizontal unit vector pointing from model toward the camera
  const azRad = (azDeg * Math.PI) / 180;
  const vx = Math.sin(azRad);
  const vz = Math.cos(azRad);

  // Positive alignment => upper piece is closer to camera than lower piece (overhang blocks seam -> bad)
  // Negative alignment => lower piece is closer to camera than upper piece (seam faces camera -> good)
  const alignment = ux * vx + uz * vz;
  return 0.85 * alignment;
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
export interface ProjectedBoxesExtents {
  minR: number;
  maxR: number;
  minU: number;
  maxU: number;
  halfW: number;
  halfH: number;
  centerOffsetR: number;
  centerOffsetU: number;
}

/**
 * Projects one or two lists of per-part `WorldBox`es onto the exact orthographic
 * camera `(right, up)` plane at `(azDeg, elDeg)`.
 *
 * Unlike projecting a single union AABB (which inflates 8 phantom corners for
 * asymmetric protrusions, L-shapes, or offset parts), per-part projection computes
 * the exact tight 2D silhouette bounds and visual center offset in O(N) time.
 */
export function computeProjectedBoxesExtents(
  firstBoxes: ReadonlyArray<WorldBox | OccluderBox>,
  secondBoxes: ReadonlyArray<WorldBox | OccluderBox> = [],
  origin: Vec3 = [0, 0, 0],
  azDeg = 38,
  elDeg = 30,
  firstCountLimit?: number,
): ProjectedBoxesExtents | null {
  const { right, up } = cameraBasis(azDeg, elDeg);
  const rx = right[0], ry = right[1], rz = right[2];
  const ux = up[0], uy = up[1], uz = up[2];

  let minR = Infinity;
  let maxR = -Infinity;
  let minU = Infinity;
  let maxU = -Infinity;

  const scan = (list: ReadonlyArray<WorldBox | OccluderBox>, limit: number) => {
    for (let i = 0; i < limit; i++) {
      const item = list[i];
      if (!item) continue;
      const b = extractBox(item);
      const loR =
        (rx >= 0 ? b.min[0] : b.max[0]) * rx +
        (ry >= 0 ? b.min[1] : b.max[1]) * ry +
        (rz >= 0 ? b.min[2] : b.max[2]) * rz;
      const hiR =
        (rx >= 0 ? b.max[0] : b.min[0]) * rx +
        (ry >= 0 ? b.max[1] : b.min[1]) * ry +
        (rz >= 0 ? b.max[2] : b.min[2]) * rz;
      const loU =
        (ux >= 0 ? b.min[0] : b.max[0]) * ux +
        (uy >= 0 ? b.min[1] : b.max[1]) * uy +
        (uz >= 0 ? b.min[2] : b.max[2]) * uz;
      const hiU =
        (ux >= 0 ? b.max[0] : b.min[0]) * ux +
        (uy >= 0 ? b.max[1] : b.min[1]) * uy +
        (uz >= 0 ? b.max[2] : b.min[2]) * uz;
      if (loR < minR) minR = loR;
      if (hiR > maxR) maxR = hiR;
      if (loU < minU) minU = loU;
      if (hiU > maxU) maxU = hiU;
    }
  };

  const firstLen = Math.min(firstBoxes.length, firstCountLimit ?? firstBoxes.length);
  scan(firstBoxes, firstLen);
  scan(secondBoxes, secondBoxes.length);

  if (!Number.isFinite(minR)) return null;

  const originR = origin[0] * rx + origin[1] * ry + origin[2] * rz;
  const originU = origin[0] * ux + origin[1] * uy + origin[2] * uz;
  const midR = (minR + maxR) * 0.5;
  const midU = (minU + maxU) * 0.5;

  return {
    minR,
    maxR,
    minU,
    maxU,
    halfW: Math.max(12, (maxR - minR) * 0.5),
    halfH: Math.max(12, (maxU - minU) * 0.5),
    centerOffsetR: midR - originR,
    centerOffsetU: midU - originU,
  };
}

/**
 * Computes the optimal base 3/4 canonical azimuth `theta` in `[24°, 66°]`
 * (generating symmetric corners `[theta, 180-theta, 180+theta, 360-theta]`)
 * that best aligns a model's 3D geometry with a target viewport aspect ratio
 * `targetAspect = width / height`.
 *
 * - Compact / near-square models stay at the classic `38°` LEGO 3/4 angle.
 * - Elongated models naturally rotate to align their long axis with the page's
 *   wider (Landscape) or taller (Portrait) dimension, making X- and Z-oriented
 *   models achieve identical rendered stud scale.
 */
export function computeLayoutAlignedCanonicalAzimuth(
  boxes: ReadonlyArray<WorldBox | OccluderBox>,
  targetAspect?: number | null,
  elDeg = 30,
): number {
  if (
    !targetAspect ||
    !Number.isFinite(targetAspect) ||
    targetAspect <= 0.1 ||
    boxes.length === 0
  ) {
    return 38;
  }

  // Keep horizontally compact / near-square models at the classic 38° LEGO 3/4 isometric angle
  // rather than flattening them toward a face-on view purely to shave off corner diagonal width.
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < boxes.length; i++) {
    const b = extractBox(boxes[i]);
    if (b.min[0] < minX) minX = b.min[0];
    if (b.max[0] > maxX) maxX = b.max[0];
    if (b.min[2] < minZ) minZ = b.min[2];
    if (b.max[2] > maxZ) maxZ = b.max[2];
  }
  if (!Number.isFinite(minX)) return 38;
  const spanX = Math.max(20, maxX - minX);
  const spanZ = Math.max(20, maxZ - minZ);
  const horizRatio = Math.max(spanX, spanZ) / Math.min(spanX, spanZ);
  if (horizRatio < 1.35) return 38;

  // Subsample evenly if there are thousands of boxes so alignment runs in <0.2ms
  let sampled: ReadonlyArray<WorldBox | OccluderBox> = boxes;
  if (boxes.length > 320) {
    const picked: Array<WorldBox | OccluderBox> = [];
    const stride = boxes.length / 320;
    for (let k = 0; k < 320; k++) {
      picked.push(boxes[Math.min(boxes.length - 1, Math.floor(k * stride))]);
    }
    sampled = picked;
  }

  const evalScale = (thetaDeg: number): number => {
    const extA = computeProjectedBoxesExtents(sampled, [], [0, 0, 0], thetaDeg, elDeg);
    if (!extA) return 0;
    const scaleA = Math.min(targetAspect / extA.halfW, 1 / extA.halfH);
    const extB = computeProjectedBoxesExtents(sampled, [], [0, 0, 0], 180 - thetaDeg, elDeg);
    if (!extB) return scaleA;
    const scaleB = Math.min(targetAspect / extB.halfW, 1 / extB.halfH);
    return (scaleA + scaleB) * 0.5;
  };

  const baseScale = evalScale(38);
  if (baseScale <= 0) return 38;

  let bestTheta = 38;
  let bestScore = 1.0;

  for (let theta = 24; theta <= 66; theta += 2) {
    const gain = evalScale(theta) / baseScale;
    const anchorPenalty = 0.045 * Math.pow((theta - 38) / 28, 2);
    const score = gain - anchorPenalty;
    if (score > bestScore + 1e-6) {
      bestScore = score;
      bestTheta = theta;
    }
  }

  // Only deviate from classic 38° when layout alignment gives a meaningful (>=3%) scale improvement
  return bestScore >= 1.03 ? bestTheta : 38;
}

export function optimizeStudioStepCameraSequence(
  steps: readonly OptimizableStepCameraInput[],
  options: OptimizeStepCameraOptions = {},
): StudioStepCameraChoice[] {
  const T = steps.length;
  if (T === 0) return [];

  // Resolve layout-aligned canonical 3/4 views for this sequence (defaults to classic 38° when targetAspect omitted)
  let baseTheta = 38;
  if (typeof options.baseAzimuthDeg === 'number' && Number.isFinite(options.baseAzimuthDeg)) {
    baseTheta = Math.round(clamp(options.baseAzimuthDeg, 24, 66));
  } else if (typeof options.targetAspect === 'number' && Number.isFinite(options.targetAspect)) {
    const lastStep = steps[T - 1];
    const finalBoxes: Array<WorldBox | OccluderBox> = [];
    const lastOccCount = Math.min(
      lastStep.occludersBefore.length,
      lastStep.occluderCountBefore ?? lastStep.occludersBefore.length,
    );
    for (let i = 0; i < lastOccCount; i++) finalBoxes.push(lastStep.occludersBefore[i]);
    for (let i = 0; i < lastStep.stepBoxes.length; i++) finalBoxes.push(lastStep.stepBoxes[i]);
    if (finalBoxes.length === 0) {
      for (let t = 0; t < T; t++) {
        for (let i = 0; i < steps[t].stepBoxes.length; i++) finalBoxes.push(steps[t].stepBoxes[i]);
      }
    }
    baseTheta = computeLayoutAlignedCanonicalAzimuth(finalBoxes, options.targetAspect, 30);
  }
  const canonicalViews =
    baseTheta === 38 ? CANONICAL_STUDIO_VIEWS : buildCanonicalViewsForBaseAzimuth(baseTheta);
  const V = canonicalViews.length;
  // 3-level cooldown state per canonical view (cd in 0..2 = steps remaining before re-entering bottom without rapid-reflip penalty)
  const CD_LEVELS = 3;
  const S = V * CD_LEVELS;
  const initialCam = options.initialCamera ?? null;

  const dp: number[][] = Array.from({ length: T }, () => new Array<number>(S).fill(Infinity));
  const backptr: number[][] = Array.from({ length: T }, () => new Array<number>(S).fill(0));
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
      const view = canonicalViews[viewIdx];
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

    // Step 1 with zero prior occluders has nothing overhead and must always start upright ('top').
    let forceBottom = step.forceSide === 'bottom' && occCount > 0;
    let forceTop = step.forceSide === 'top';

    // For lifted pre-built submodel attachments (`isSubmodelAttach`), identify directly mating
    // prior connectors (e.g. protruding Technic axles/pins/mechanisms or compact target parts)
    // so we can (a) check whether an upright view clearly reveals a top-facing pin-in-hole
    // interface that would be hidden behind the submodel's own underside from below, and
    // (b) penalize viewpoints where the lifted submodel itself obscures the mating interface.
    let matingBoxes: WorldBox[] = [];
    let verticalShaftMatingBoxes: WorldBox[] = [];
    let isDownwardLiftedSub = false;
    if (
      step.isSubmodelAttach &&
      !step.isSectionAttach &&
      step.shiftedStepBoxes &&
      step.shiftedStepBoxes.length > 0 &&
      occCount > 0 &&
      step.stepBoxes.length > 0
    ) {
      let seatedSumY = 0;
      let shiftedSumY = 0;
      const cnt = Math.min(step.stepBoxes.length, step.shiftedStepBoxes.length);
      for (let k = 0; k < cnt; k++) {
        seatedSumY += step.stepBoxes[k].center[1];
        shiftedSumY += step.shiftedStepBoxes[k].center[1];
      }
      isDownwardLiftedSub = cnt > 0 && (shiftedSumY - seatedSumY) / cnt < -8;

      const interlocking: WorldBox[] = [];
      const compactTouching: WorldBox[] = [];
      for (let i = 0; i < occCount; i++) {
        const ob = extractBox(step.occludersBefore[i]);
        let touches = false;
        let interlocks = false;
        let shaftEntersFromAbove = false;
        const ox = ob.max[0] - ob.min[0];
        const oy = ob.max[1] - ob.min[1];
        const oz = ob.max[2] - ob.min[2];
        const isSlenderVertShaft =
          Math.max(ox, oz) <= 16.5 && oy >= 16 && oy >= Math.max(ox, oz) * 1.4;
        for (let j = 0; j < step.stepBoxes.length; j++) {
          const sb = step.stepBoxes[j];
          const gx = Math.max(0, ob.min[0] - sb.max[0], sb.min[0] - ob.max[0]);
          const gy = Math.max(0, ob.min[1] - sb.max[1], sb.min[1] - ob.max[1]);
          const gz = Math.max(0, ob.min[2] - sb.max[2], sb.min[2] - ob.max[2]);
          if (gx <= 4.0 && gy <= 4.0 && gz <= 4.0) {
            touches = true;
            const ovX = Math.min(ob.max[0], sb.max[0]) - Math.max(ob.min[0], sb.min[0]);
            const ovY = Math.min(ob.max[1], sb.max[1]) - Math.max(ob.min[1], sb.min[1]);
            const ovZ = Math.min(ob.max[2], sb.max[2]) - Math.max(ob.min[2], sb.min[2]);
            if (ovX > 1.5 && ovY > 1.5 && ovZ > 1.5) {
              interlocks = true;
              if (
                isSlenderVertShaft &&
                ovY > 4.5 &&
                ob.max[1] > sb.max[1] + 2 &&
                ob.center[0] >= sb.min[0] + 1.5 &&
                ob.center[0] <= sb.max[0] - 1.5 &&
                ob.center[2] >= sb.min[2] + 1.5 &&
                ob.center[2] <= sb.max[2] - 1.5
              ) {
                shaftEntersFromAbove = true;
              }
              break;
            }
          }
        }
        if (!touches) continue;
        const isLargeFlatDeck = Math.max(ox, oz) > 100 && oy <= 14;
        if (interlocks && !isLargeFlatDeck) {
          interlocking.push(ob);
          if (shaftEntersFromAbove) {
            const tipMaxY = Math.min(ob.max[1], ob.min[1] + 8);
            verticalShaftMatingBoxes.push({
              min: [ob.min[0], ob.min[1], ob.min[2]],
              max: [ob.max[0], tipMaxY, ob.max[2]],
              center: [ob.center[0], (ob.min[1] + tipMaxY) * 0.5, ob.center[2]],
            });
          }
        } else if (!isLargeFlatDeck) {
          compactTouching.push(ob);
        }
      }
      matingBoxes = interlocking.length > 0 ? interlocking : compactTouching;
    }

    // If a downward-lifted underside submodel receives a protruding vertical Technic pin/axle
    // into a top-facing hole, a bottom view hides that hole behind the submodel's own solid
    // underside. When an upright top view clearly reveals BOTH the lifted submodel and the
    // protruding vertical shaft tip, flip upright so the builder can see the pin entering the hole.
    if (
      forceBottom &&
      isDownwardLiftedSub &&
      verticalShaftMatingBoxes.length > 0 &&
      step.shiftedStepBoxes &&
      step.shiftedStepBoxes.length > 0
    ) {
      let hasClearTopPinHoleView = false;
      for (let v = 0; v < 4; v++) {
        const view = canonicalViews[v];
        const shiftedMetrics = evaluateStepVisibilityWithProj(
          step.shiftedStepBoxes,
          getProj(step.occludersBefore, v),
          occCount,
          view.az,
          view.el,
        );
        if (shiftedMetrics.meanVisibility < 0.55) continue;
        const shaftVisVsOcc = evaluateStepVisibilityWithProj(
          verticalShaftMatingBoxes,
          getProj(step.occludersBefore, v),
          occCount,
          view.az,
          view.el,
        ).visibility;
        const shaftVisVsSub = evaluateStepOcclusionVisibility(
          verticalShaftMatingBoxes,
          step.shiftedStepBoxes,
          view.az,
          view.el,
        ).visibility;
        if (Math.min(shaftVisVsOcc, shaftVisVsSub) >= 0.45) {
          hasClearTopPinHoleView = true;
          break;
        }
      }
      if (hasClearTopPinHoleView) {
        forceBottom = false;
        forceTop = true;
      }
    }

    // Evaluate all 4 top canonical views first (always run exact occlusion whenever occCount > 0
    // so a tall Step-1 brick blocking Step-2 details lets Viterbi pick the unobstructed side from Step 1)
    let bestTopVis = 0;
    for (let v = 0; v < 4; v++) {
      if (forceBottom) {
        visTable[t][v] = -1;
        continue;
      }
      if (occCount === 0 || step.stepBoxes.length === 0) {
        visTable[t][v] = 1;
      } else {
        const view = canonicalViews[v];
        const seatedVis = evaluateStepVisibilityWithProj(
          step.stepBoxes,
          getProj(step.occludersBefore, v),
          occCount,
          view.az,
          view.el,
        ).visibility;
        if (
          step.isSubmodelAttach &&
          !step.isSectionAttach &&
          step.shiftedStepBoxes &&
          step.shiftedStepBoxes.length > 0
        ) {
          const shiftedVis = evaluateStepVisibilityWithProj(
            step.shiftedStepBoxes,
            getProj(step.occludersBefore, v),
            occCount,
            view.az,
            view.el,
          ).visibility;
          visTable[t][v] = Math.max(seatedVis, shiftedVis);
        } else {
          visTable[t][v] = seatedVis;
        }
      }
      if (visTable[t][v] > bestTopVis) bestTopVis = visTable[t][v];
    }

    // Allow bottom views when explicitly required (upside-down underside phase)
    // or when bricks are genuinely tucked directly underneath AND hidden from top
    const allowBottom =
      forceBottom ||
      (!forceTop &&
        !isTinyEarlyBase &&
        !step.isSectionAttach &&
        bestTopVis < UNDERSIDE_TOP_OCCLUSION_THRESHOLD &&
        isStrictUndersidePlacement(step.stepBoxes, step.occludersBefore, builtBounds, occCount));

    for (let v = 4; v < V; v++) {
      if (!allowBottom) {
        visTable[t][v] = -1;
      } else if (step.stepBoxes.length === 0 || occCount === 0) {
        visTable[t][v] = 1;
      } else {
        const view = canonicalViews[v];
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

    // Compute dominant horizontal outward stud normal for SNOT steps (cancels cleanly to 0 when
    // opposite sides are placed simultaneously so symmetric bilateral steps stay steady).
    let studDirX = 0;
    let studDirZ = 0;
    let studIsEngaged = false;
    const activeSideNormals =
      step.engagedSideNormals && step.engagedSideNormals.length > 0
        ? ((studIsEngaged = true), step.engagedSideNormals)
        : step.exposedSideStudNormals && step.exposedSideStudNormals.length > 0
          ? step.exposedSideStudNormals
          : null;
    if (activeSideNormals) {
      let sx = 0;
      let sz = 0;
      for (let i = 0; i < activeSideNormals.length; i++) {
        const n = activeSideNormals[i];
        const hLen = Math.hypot(n[0], n[2]);
        if (hLen < 0.3) continue;
        sx += n[0] / hLen;
        sz += n[2] / hLen;
      }
      const meanLen = Math.hypot(sx, sz) / activeSideNormals.length;
      if (meanLen >= 0.35) {
        const norm = Math.hypot(sx, sz);
        studDirX = sx / norm;
        studDirZ = sz / norm;
      }
    }
    for (let v = 0; v < V; v++) {
      const view = canonicalViews[v];
      if (view.isBottom && !allowBottom) continue;
      if (!view.isBottom && forceBottom) continue;

      const vis = visTable[t][v];
      const uprightBias = view.isBottom ? (forceBottom ? 0 : 0.12) : 0;
      const startAnchorBias =
        t === 0 && !initialCam && !view.isBottom && view.corner === DEFAULT_STUDIO_CAMERA.corner
          ? -0.08
          : 0;
      const step1FacingCost =
        occCount === 0 && !view.isBottom && step.stepBoxes.length >= 2
          ? computeStep1ConnectionFacingCost(step.stepBoxes, view.az, view.isBottom)
          : 0;
      let subAttachCost = 0;
      if (step.isSubmodelAttach && !step.isSectionAttach) {
        if (matingBoxes.length > 0 && step.shiftedStepBoxes && step.shiftedStepBoxes.length > 0) {
          const matingVisSub = evaluateStepOcclusionVisibility(
            matingBoxes,
            step.shiftedStepBoxes,
            view.az,
            view.el,
          ).visibility;
          const matingVisOcc = !view.isBottom && verticalShaftMatingBoxes.length > 0
            ? evaluateStepVisibilityWithProj(
                verticalShaftMatingBoxes,
                getProj(step.occludersBefore, v),
                occCount,
                view.az,
                view.el,
              ).visibility
            : 1;
          subAttachCost += stepVisibilityPenalty(
            Math.min(matingVisSub, matingVisOcc),
            STEP_VISIBILITY_DEADBAND,
          );
        }
        if (builtBounds) {
          subAttachCost += -0.35 * clamp(cornerDot(stepUnionBoxes[t], view.corner, builtBounds), -1, 1);
        }
      }
      let studFacingCost = 0;
      if (studDirX !== 0 || studDirZ !== 0) {
        const azRad = (view.az * Math.PI) / 180;
        const dot = studDirX * Math.sin(azRad) + studDirZ * Math.cos(azRad);
        if (studIsEngaged) {
          // Blind-side SNOT stud attachment (dot < 0) is strongly penalized; facing camera (dot > 0) is rewarded
          studFacingCost = dot < 0 ? -dot * 0.95 : -dot * 0.25;
        } else {
          // Exposed SNOT bracket side studs gently prefer facing the camera (strong enough to pick the clear Step-1 corner)
          studFacingCost = -dot * 0.22;
        }
      }
      const emissionCost =
        stepVisibilityPenalty(vis, deadband) +
        uprightBias +
        startAnchorBias +
        step1FacingCost +
        subAttachCost +
        studFacingCost;

      if (t === 0) {
        const initTransCost = initialCam ? stepCameraTransitionCost(initialCam, view) : 0;
        const initTieBreak =
          initTransCost > 0 && builtBounds
            ? -0.01 * clamp(cornerDot(stepUnionBoxes[t], view.corner, builtBounds), -1, 1)
            : 0;
        const initCd = initialCam && initialCam.side === 'bottom' && !view.isBottom ? 2 : 0;
        const dstState = v * CD_LEVELS + initCd;
        dp[t][dstState] = initTransCost + initTieBreak + emissionCost;
        backptr[t][dstState] = dstState;
      } else {
        for (let u = 0; u < V; u++) {
          const prevView = canonicalViews[u];
          const baseTrans = stepCameraTransitionCost(prevView, view);
          // Tiny one-time tie-break ONLY on actual turns (u !== v) so it never accumulates while staying put
          const tieBreak =
            u !== v && builtBounds
              ? -0.01 * clamp(cornerDot(stepUnionBoxes[t], view.corner, builtBounds), -1, 1)
              : 0;
          const isExitingBottom = prevView.isBottom && !view.isBottom;
          const isEnteringBottom = !prevView.isBottom && view.isBottom;

          for (let prevCd = 0; prevCd < CD_LEVELS; prevCd++) {
            const srcState = u * CD_LEVELS + prevCd;
            const prevCost = dp[t - 1][srcState];
            if (!Number.isFinite(prevCost)) continue;

            const nextCd = view.isBottom
              ? 0
              : isExitingBottom
                ? 2
                : Math.max(0, prevCd - 1);
            const rapidReflipPenalty =
              isEnteringBottom && prevCd > 0 && !forceBottom
                ? STEP_CAMERA_RAPID_REFLIP_COST
                : 0;
            const c = prevCost + baseTrans + rapidReflipPenalty + tieBreak + emissionCost;
            const dstState = v * CD_LEVELS + nextCd;
            if (c < dp[t][dstState]) {
              dp[t][dstState] = c;
              backptr[t][dstState] = srcState;
            }
          }
        }
      }
    }
  }

  let bestEndState = 0;
  let bestEndCost = Infinity;
  for (let s = 0; s < S; s++) {
    if (dp[T - 1][s] < bestEndCost) {
      bestEndCost = dp[T - 1][s];
      bestEndState = s;
    }
  }

  const chosenIdx: number[] = new Array<number>(T);
  let currState = bestEndState;
  for (let t = T - 1; t >= 0; t--) {
    chosenIdx[t] = Math.floor(currState / CD_LEVELS);
    currState = backptr[t][currState];
  }

  const out: StudioStepCameraChoice[] = [];
  for (let t = 0; t < T; t++) {
    const view = canonicalViews[chosenIdx[t]];
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
 * - `'auto'` (default):
 *   - When `readableTarget` (from an active physical print page) is provided:
 *     - Keeps framing rock-steady on the full model whenever the full view already
 *       renders at `>= minStudSizeCm` (0.5 cm/stud).
 *     - When the full model exceeds the page's readable budget, smoothly zooms in
 *       just enough to keep `1 stud >= 0.5 cm` (showing maximum surrounding model
 *       context and a steady scale across consecutive steps) without ever cropping
 *       the newly added bricks.
 *   - Without `readableTarget` (e.g. Screen Fit): stays rock-steady on the full
 *     model up to `fullRadius <= 340` LDU and applies a smooth context-preserving
 *     zoom assist only on truly massive builds with tiny new details.
 */
export function computeStepCameraFraming(input: StepFramingInput): StepFramingResult {
  const mode = input.focusMode || 'auto';
  const { fullCenter, fullRadius, newCenter, newRadius, hasPrevParts, readableTarget } = input;

  if (!hasPrevParts || !newCenter || mode === 'full') {
    return {
      center: [fullCenter[0], fullCenter[1], fullCenter[2]],
      radius: fullRadius,
      isZoomedIn: false,
    };
  }

  if (mode === 'focus' || mode === 'regional') {
    const isRegional = mode === 'regional';
    const blend = isRegional ? 0.14 : 0.08;
    const center: Vec3 = [
      newCenter[0] + (fullCenter[0] - newCenter[0]) * blend,
      newCenter[1] + (fullCenter[1] - newCenter[1]) * blend,
      newCenter[2] + (fullCenter[2] - newCenter[2]) * blend,
    ];
    const radius = isRegional
      ? Math.min(fullRadius * 0.72, Math.max(newRadius * 2.6, fullRadius * 0.34, 110))
      : Math.min(fullRadius * 0.85, Math.max(newRadius * 2.25, fullRadius * 0.26, 72));
    const isZoomedIn = radius < fullRadius * 0.86;
    const invSpan = 1 / Math.max(1, fullRadius * 2);
    return {
      center,
      radius,
      isZoomedIn,
      ...(isZoomedIn
        ? {
            locator: {
              cxNorm: clamp(0.5 + (center[0] - fullCenter[0]) * invSpan, 0.08, 0.92),
              czNorm: clamp(0.5 + (center[2] - fullCenter[2]) * invSpan, 0.08, 0.92),
              radiusNorm: clamp(radius / Math.max(1, fullRadius), 0.18, 0.95),
            },
          }
        : {}),
    };
  }

  // Physical-page readability-aware auto framing:
  // Stay 100% steady on full model when it already fits >= 0.5 cm/stud; otherwise
  // zoom in just enough to keep the working region readable at >= 0.5 cm/stud while
  // never cropping newly added parts and preserving maximum surrounding context.
  if (
    readableTarget &&
    Number.isFinite(readableTarget.maxHalfW) &&
    Number.isFinite(readableTarget.maxHalfH) &&
    readableTarget.maxHalfW > 12 &&
    readableTarget.maxHalfH > 12
  ) {
    const fullW = Math.max(12, readableTarget.fullHalfW);
    const fullH = Math.max(12, readableTarget.fullHalfH);
    const newW = Math.max(12, readableTarget.newHalfW);
    const newH = Math.max(12, readableTarget.newHalfH);
    const maxW = readableTarget.maxHalfW;
    const maxH = readableTarget.maxHalfH;

    // Full model already renders >= minStudSizeCm -> rock-steady full-model framing!
    if (fullW <= maxW + 1e-3 && fullH <= maxH + 1e-3) {
      return {
        center: [fullCenter[0], fullCenter[1], fullCenter[2]],
        radius: fullRadius,
        isZoomedIn: false,
      };
    }

    // Zoom in just enough to meet the readable budget, while NEVER cropping new parts
    // (keep at least ~12% breathing context around the new parts whenever possible).
    const minNewW = Math.max(newW * 1.12, newW + 10);
    const minNewH = Math.max(newH * 1.12, newH + 10);
    const desiredW = Math.min(fullW, Math.max(minNewW, maxW));
    const desiredH = Math.min(fullH, Math.max(minNewH, maxH));

    // Only engage regional zoom when it meaningfully enlarges the limiting axis (> 3%)
    const currentRatio = Math.max(fullW / maxW, fullH / maxH);
    const zoomedRatio = Math.max(desiredW / maxW, desiredH / maxH);
    if (zoomedRatio < currentRatio * 0.97) {
      const effRadius = Math.max(desiredW, desiredH);
      const center: Vec3 = [newCenter[0], newCenter[1], newCenter[2]];
      const invSpan = 1 / Math.max(1, fullRadius * 2);
      return {
        center,
        radius: Math.min(fullRadius, effRadius),
        isZoomedIn: true,
        targetHalfW: desiredW,
        targetHalfH: desiredH,
        locator: {
          cxNorm: clamp(0.5 + (center[0] - fullCenter[0]) * invSpan, 0.08, 0.92),
          czNorm: clamp(0.5 + (center[2] - fullCenter[2]) * invSpan, 0.08, 0.92),
          radiusNorm: clamp(effRadius / Math.max(1, fullRadius), 0.18, 0.95),
        },
      };
    }

    return {
      center: [fullCenter[0], fullCenter[1], fullCenter[2]],
      radius: fullRadius,
      isZoomedIn: false,
    };
  }

  // Default 'auto' (Screen Fit / no physical target): steady full-model framing unless truly massive
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
  const isZoomedIn = radius < fullRadius * 0.92;
  const invSpan = 1 / Math.max(1, fullRadius * 2);

  return {
    center,
    radius,
    isZoomedIn,
    ...(isZoomedIn
      ? {
          locator: {
            cxNorm: clamp(0.5 + (center[0] - fullCenter[0]) * invSpan, 0.08, 0.92),
            czNorm: clamp(0.5 + (center[2] - fullCenter[2]) * invSpan, 0.08, 0.92),
            radiusNorm: clamp(radius / Math.max(1, fullRadius), 0.18, 0.95),
          },
        }
      : {}),
  };
}

export interface WorldBounds3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface ProjectedOrthoHalfExtents {
  /** Projected half-width along camera right axis in LDU (bounded by viewRadius). */
  halfW: number;
  /** Projected half-height along camera up axis in LDU (bounded by viewRadius). */
  halfH: number;
}

export interface StepPliObstacleRect {
  /** Normalized width [0..1] of the top-left header/PLI area inside the visual viewport. */
  widthFrac: number;
  /** Normalized height [0..1] of the top-left header/PLI area inside the visual viewport. */
  heightFrac: number;
}

export interface StepOrthoFrustumOptions {
  /** Exact per-part world boxes for tight 2D silhouette projection & visual centering. */
  partBoxes?: ReadonlyArray<WorldBox | OccluderBox> | null;
  /** Optional second list of per-part boxes (avoids array copying in pagination passes). */
  secondPartBoxes?: ReadonlyArray<WorldBox | OccluderBox> | null;
  /** Newly added part boxes (guaranteed to stay strictly inside the viewport when zoomed/shifted). */
  newPartBoxes?: ReadonlyArray<WorldBox | OccluderBox> | null;
  /** Camera look-at origin in world LDU (defaults to union bounds midpoint). */
  origin?: Vec3 | null;
  /** True when the step is regionally zoomed in onto a subset of the full model. */
  isZoomedIn?: boolean;
  /** Explicit per-axis zoomed half-width (LDU) from readability-aware auto framing. */
  targetHalfW?: number;
  /** Explicit per-axis zoomed half-height (LDU) from readability-aware auto framing. */
  targetHalfH?: number;
  /** Optional top-left header/PLI obstacle rectangle to clear via bounded 2D centering shift. */
  pliObstacle?: StepPliObstacleRect | null;
}

export interface StepOrthoFrustum extends ProjectedOrthoHalfExtents {
  /** Orthographic viewport half-width in LDU after aspect fitting, margin, and zoom. */
  orthoHalfW: number;
  /** Orthographic viewport half-height in LDU after aspect fitting, margin, and zoom. */
  orthoHalfH: number;
  /** Camera-right frustum center shift (LDU) relative to `origin` for visual centering & bounds clamping. */
  centerOffsetR: number;
  /** Camera-up frustum center shift (LDU) relative to `origin` for visual centering & bounds clamping. */
  centerOffsetU: number;
  /** True when `pliObstacle` was provided and all visible projected part boxes clear it cleanly. */
  pliCleared: boolean;
}

/**
 * Projects a step's 3D geometry onto the orthographic camera's `(right, up)` plane
 * at `(azDeg, elDeg)` and bounds each axis by `viewRadius` (or per-axis targets).
 *
 * When `partBoxes` are provided, computes the exact tight 2D projected silhouette
 * across individual parts (zero phantom 8-corner AABB bloat); otherwise falls back
 * to projecting the single union AABB `bounds`.
 */
export function computeProjectedOrthoHalfExtents(
  bounds: WorldBounds3D | null | undefined,
  fullRadius: number,
  viewRadius: number,
  azDeg: number,
  elDeg: number,
  partBoxes?: ReadonlyArray<WorldBox | OccluderBox> | null,
  secondPartBoxes?: ReadonlyArray<WorldBox | OccluderBox> | null,
): ProjectedOrthoHalfExtents {
  const safeViewR = Math.max(12, Number.isFinite(viewRadius) ? viewRadius : 20);
  const safeFullR = Math.max(safeViewR, Number.isFinite(fullRadius) ? fullRadius : safeViewR);

  if ((partBoxes && partBoxes.length > 0) || (secondPartBoxes && secondPartBoxes.length > 0)) {
    const ext = computeProjectedBoxesExtents(
      partBoxes || [],
      secondPartBoxes || [],
      [0, 0, 0],
      azDeg,
      elDeg,
    );
    if (ext) {
      const fullHalfW = Math.min(safeFullR, ext.halfW);
      const fullHalfH = Math.min(safeFullR, ext.halfH);
      return {
        halfW: Math.min(fullHalfW, safeViewR),
        halfH: Math.min(fullHalfH, safeViewR),
      };
    }
  }

  if (
    !bounds ||
    !Number.isFinite(bounds.minX) ||
    !Number.isFinite(bounds.maxX) ||
    !Number.isFinite(bounds.minY) ||
    !Number.isFinite(bounds.maxY) ||
    !Number.isFinite(bounds.minZ) ||
    !Number.isFinite(bounds.maxZ)
  ) {
    return { halfW: safeViewR, halfH: safeViewR };
  }

  const ex = Math.max(0, (bounds.maxX - bounds.minX) * 0.5);
  const ey = Math.max(0, (bounds.maxY - bounds.minY) * 0.5);
  const ez = Math.max(0, (bounds.maxZ - bounds.minZ) * 0.5);
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  const cosAz = Math.cos(az);
  const sinAz = Math.sin(az);
  const cosEl = Math.cos(el);
  const sinEl = Math.sin(el);

  // Camera right = [cosAz, 0, -sinAz], up = [-sinAz*sinEl, cosEl, -cosAz*sinEl]
  const rawHalfW = Math.abs(cosAz) * ex + Math.abs(sinAz) * ez;
  const rawHalfH =
    Math.abs(sinAz * sinEl) * ex +
    Math.abs(cosEl) * ey +
    Math.abs(cosAz * sinEl) * ez;

  // Clamp by safeFullR so AABB corners never inflate looser than the vertex bounding sphere,
  // then cap by safeViewR when zoomed in (Close-Up / massive-model auto-focus).
  const fullHalfW = Math.min(safeFullR, Math.max(12, rawHalfW));
  const fullHalfH = Math.min(safeFullR, Math.max(12, rawHalfH));
  return {
    halfW: Math.min(fullHalfW, safeViewR),
    halfH: Math.min(fullHalfH, safeViewR),
  };
}

/**
 * Computes the exact aspect-fitted orthographic frustum `(orthoHalfW, orthoHalfH)`
 * and 2D visual centering/clamping offsets `(centerOffsetR, centerOffsetU)` shared
 * 1:1 by `WebGLBrickEngine.computeMVP`, `computeStudioOrthoCamera`, and `pageLayout.ts`.
 */
export function computeStepOrthoFrustum(
  bounds: WorldBounds3D | null | undefined,
  fullRadius: number,
  viewRadius: number,
  azDeg: number,
  elDeg: number,
  aspect: number,
  zoom = 1.0,
  margin = STEP_CAMERA_FRAMING_MARGIN,
  options?: StepOrthoFrustumOptions | null,
): StepOrthoFrustum {
  const safeAspect = Math.max(0.1, Number.isFinite(aspect) ? aspect : 1);
  const safeZoom = Math.max(0.4, Number.isFinite(zoom) ? zoom : 1);
  const safeMargin = Math.max(1.0, Number.isFinite(margin) ? margin : STEP_CAMERA_FRAMING_MARGIN);
  const safeViewR = Math.max(12, Number.isFinite(viewRadius) ? viewRadius : 20);
  const safeFullR = Math.max(safeViewR, Number.isFinite(fullRadius) ? fullRadius : safeViewR);

  const origin: Vec3 = options?.origin
    ? options.origin
    : bounds && Number.isFinite(bounds.minX)
      ? [
          (bounds.minX + bounds.maxX) * 0.5,
          (bounds.minY + bounds.maxY) * 0.5,
          (bounds.minZ + bounds.maxZ) * 0.5,
        ]
      : [0, 0, 0];

  const hasPartBoxes = Boolean(
    (options?.partBoxes && options.partBoxes.length > 0) ||
      (options?.secondPartBoxes && options.secondPartBoxes.length > 0),
  );
  const fullExt = hasPartBoxes
    ? computeProjectedBoxesExtents(
        options?.partBoxes || [],
        options?.secondPartBoxes || [],
        origin,
        azDeg,
        elDeg,
      )
    : null;

  let fullHalfW: number;
  let fullHalfH: number;
  if (fullExt) {
    fullHalfW = Math.min(safeFullR, fullExt.halfW);
    fullHalfH = Math.min(safeFullR, fullExt.halfH);
  } else {
    const fallback = computeProjectedOrthoHalfExtents(bounds, safeFullR, safeFullR, azDeg, elDeg);
    fullHalfW = fallback.halfW;
    fullHalfH = fallback.halfH;
  }

  const hasExplicitTargets =
    typeof options?.targetHalfW === 'number' &&
    Number.isFinite(options.targetHalfW) &&
    typeof options?.targetHalfH === 'number' &&
    Number.isFinite(options.targetHalfH);
  const isZoomedIn = Boolean(options?.isZoomedIn || hasExplicitTargets || safeViewR < safeFullR - 1e-3);

  const halfW = hasExplicitTargets
    ? Math.min(fullHalfW, Math.max(12, options!.targetHalfW!))
    : Math.min(fullHalfW, safeViewR);
  const halfH = hasExplicitTargets
    ? Math.min(fullHalfH, Math.max(12, options!.targetHalfH!))
    : Math.min(fullHalfH, safeViewR);

  let orthoHalfH = (halfH * safeMargin) / safeZoom;
  let orthoHalfW = orthoHalfH * safeAspect;
  const reqHalfW = (halfW * safeMargin) / safeZoom;
  if (reqHalfW > orthoHalfW) {
    orthoHalfW = reqHalfW;
    orthoHalfH = orthoHalfW / safeAspect;
  }

  if (!fullExt) {
    return {
      halfW,
      halfH,
      orthoHalfW,
      orthoHalfH,
      centerOffsetR: 0,
      centerOffsetU: 0,
      pliCleared: false,
    };
  }

  const { right, up } = cameraBasis(azDeg, elDeg);
  const rx = right[0], ry = right[1], rz = right[2];
  const ux = up[0], uy = up[1], uz = up[2];
  const originR = origin[0] * rx + origin[1] * ry + origin[2] * rz;
  const originU = origin[0] * ux + origin[1] * uy + origin[2] * uz;

  const fullMidR = (fullExt.minR + fullExt.maxR) * 0.5;
  const fullMidU = (fullExt.minU + fullExt.maxU) * 0.5;
  const padR = fullExt.halfW * (safeMargin - 1);
  const padU = fullExt.halfH * (safeMargin - 1);
  const boundMinR = fullExt.minR - padR;
  const boundMaxR = fullExt.maxR + padR;
  const boundMinU = fullExt.minU - padU;
  const boundMaxU = fullExt.maxU + padU;

  const newExt =
    options?.newPartBoxes && options.newPartBoxes.length > 0
      ? computeProjectedBoxesExtents(options.newPartBoxes, [], origin, azDeg, elDeg)
      : null;

  let camR: number;
  let camU: number;

  if (!isZoomedIn) {
    // Full-model framing: center visually on the exact 2D silhouette midpoint
    camR = fullMidR;
    camU = fullMidU;
  } else {
    // Zoomed-in framing: start at focus origin, then clamp against the full model's
    // 2D silhouette so zero empty air is wasted beyond the model's ends while
    // keeping all newly added parts strictly inside the viewport.
    camR = originR;
    camU = originU;

    if (boundMaxR - boundMinR <= 2 * orthoHalfW) {
      camR = fullMidR;
    } else {
      camR = clamp(camR, boundMinR + orthoHalfW, boundMaxR - orthoHalfW);
    }

    if (boundMaxU - boundMinU <= 2 * orthoHalfH) {
      camU = fullMidU;
    } else {
      camU = clamp(camU, boundMinU + orthoHalfH, boundMaxU - orthoHalfH);
    }

    if (newExt) {
      const safeSpanR = orthoHalfW * 0.9;
      const safeSpanU = orthoHalfH * 0.9;
      if (newExt.maxR - newExt.minR <= 2 * safeSpanR) {
        if (newExt.minR < camR - safeSpanR) camR = newExt.minR + safeSpanR;
        if (newExt.maxR > camR + safeSpanR) camR = newExt.maxR - safeSpanR;
      } else {
        camR = (newExt.minR + newExt.maxR) * 0.5;
      }
      if (newExt.maxU - newExt.minU <= 2 * safeSpanU) {
        if (newExt.minU < camU - safeSpanU) camU = newExt.minU + safeSpanU;
        if (newExt.maxU > camU + safeSpanU) camU = newExt.maxU - safeSpanU;
      } else {
        camU = (newExt.minU + newExt.maxU) * 0.5;
      }
    }
  }

  // Optional top-left PLI obstacle clearance & bounded visual shift
  let pliCleared = false;
  const obs = options?.pliObstacle;
  if (
    obs &&
    obs.widthFrac > 0 &&
    obs.widthFrac < 0.9 &&
    obs.heightFrac > 0 &&
    obs.heightFrac < 0.9
  ) {
    const padClearR = orthoHalfW * 0.025;
    const padClearU = orthoHalfH * 0.025;
    const boxLists: Array<ReadonlyArray<WorldBox | OccluderBox>> = [];
    if (options?.partBoxes && options.partBoxes.length > 0) boxLists.push(options.partBoxes);
    if (options?.secondPartBoxes && options.secondPartBoxes.length > 0) {
      boxLists.push(options.secondPartBoxes);
    }

    const measureObstacleOverlap = (testCamR: number, testCamU: number) => {
      const viewMinR = testCamR - orthoHalfW;
      const viewMaxR = testCamR + orthoHalfW;
      const viewMinU = testCamU - orthoHalfH;
      const viewMaxU = testCamU + orthoHalfH;
      const obsMaxR = viewMinR + 2 * orthoHalfW * obs.widthFrac + padClearR;
      const obsMinU = viewMaxU - 2 * orthoHalfH * obs.heightFrac - padClearU;

      let hit = false;
      let maxNeedR = 0;
      let maxNeedU = 0;
      for (let li = 0; li < boxLists.length; li++) {
        const list = boxLists[li];
        for (let i = 0; i < list.length; i++) {
          const item = list[i];
          if (!item) continue;
          const b = extractBox(item);
          const loR =
            (rx >= 0 ? b.min[0] : b.max[0]) * rx +
            (ry >= 0 ? b.min[1] : b.max[1]) * ry +
            (rz >= 0 ? b.min[2] : b.max[2]) * rz;
          const hiR =
            (rx >= 0 ? b.max[0] : b.min[0]) * rx +
            (ry >= 0 ? b.max[1] : b.min[1]) * ry +
            (rz >= 0 ? b.max[2] : b.min[2]) * rz;
          if (hiR < viewMinR || loR > viewMaxR) continue;
          const loU =
            (ux >= 0 ? b.min[0] : b.max[0]) * ux +
            (uy >= 0 ? b.min[1] : b.max[1]) * uy +
            (uz >= 0 ? b.min[2] : b.max[2]) * uz;
          const hiU =
            (ux >= 0 ? b.max[0] : b.min[0]) * ux +
            (uy >= 0 ? b.max[1] : b.min[1]) * uy +
            (uz >= 0 ? b.max[2] : b.min[2]) * uz;
          if (hiU < viewMinU || loU > viewMaxU) continue;
          if (loR < obsMaxR && hiU > obsMinU) {
            hit = true;
            const needR = obsMaxR - loR;
            const needU = hiU - obsMinU;
            if (needR > maxNeedR) maxNeedR = needR;
            if (needU > maxNeedU) maxNeedU = needU;
          }
        }
      }
      return { hit, maxNeedR, maxNeedU };
    };

    const baseOverlap = measureObstacleOverlap(camR, camU);
    if (!baseOverlap.hit) {
      pliCleared = true;
    } else {
      // Compute how far we can safely shift the model right (camR -= shiftR) or down (camU += shiftU)
      // without clipping the model or pushing newly added parts near the frame edge.
      let freeRight = !isZoomedIn
        ? Math.max(0, camR + orthoHalfW - boundMaxR)
        : Math.max(0, camR - orthoHalfW - boundMinR);
      let freeBottom = !isZoomedIn
        ? Math.max(0, boundMinU - (camU - orthoHalfH))
        : Math.max(0, boundMaxU - (camU + orthoHalfH));

      if (isZoomedIn && newExt) {
        freeRight = Math.min(freeRight, Math.max(0, camR + orthoHalfW * 0.9 - newExt.maxR));
        freeBottom = Math.min(freeBottom, Math.max(0, newExt.minU - (camU - orthoHalfH * 0.9)));
      }

      const candidates: Array<{ sr: number; su: number }> = [];
      if (baseOverlap.maxNeedR > 0 && baseOverlap.maxNeedR <= freeRight + 1e-3) {
        candidates.push({ sr: Math.min(freeRight, baseOverlap.maxNeedR), su: 0 });
      }
      if (baseOverlap.maxNeedU > 0 && baseOverlap.maxNeedU <= freeBottom + 1e-3) {
        candidates.push({ sr: 0, su: Math.min(freeBottom, baseOverlap.maxNeedU) });
      }
      if (freeRight > 1 && freeBottom > 1) {
        const afterRight = measureObstacleOverlap(camR - freeRight, camU);
        if (!afterRight.hit) {
          candidates.push({ sr: freeRight, su: 0 });
        } else if (afterRight.maxNeedU <= freeBottom + 1e-3) {
          candidates.push({ sr: freeRight, su: Math.min(freeBottom, afterRight.maxNeedU) });
        }
        const afterDown = measureObstacleOverlap(camR, camU + freeBottom);
        if (!afterDown.hit) {
          candidates.push({ sr: 0, su: freeBottom });
        } else if (afterDown.maxNeedR <= freeRight + 1e-3) {
          candidates.push({ sr: Math.min(freeRight, afterDown.maxNeedR), su: freeBottom });
        }
      }

      let bestShift: { sr: number; su: number; dist: number } | null = null;
      for (const c of candidates) {
        const check = measureObstacleOverlap(camR - c.sr, camU + c.su);
        if (check.hit) continue;
        const dist = Math.hypot(c.sr / orthoHalfW, c.su / orthoHalfH);
        if (!bestShift || dist < bestShift.dist) {
          bestShift = { sr: c.sr, su: c.su, dist };
        }
      }
      if (bestShift) {
        camR -= bestShift.sr;
        camU += bestShift.su;
        pliCleared = true;
      }
    }
  }

  return {
    halfW,
    halfH,
    orthoHalfW,
    orthoHalfH,
    centerOffsetR: camR - originR,
    centerOffsetU: camU - originU,
    pliCleared,
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
  isSectionModule?: boolean;
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
 * - Standalone submodel chapters stay isolated in their own local frame.
 * - Section-module continuation chunks and main / numbered-bag / join chapters sharing
 *   a `sectionId` form one continuous sequence.
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
    (chapter.kind === 'submodel' && !chapter.isSectionModule) ||
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
    if (ch.kind === 'minifigure') continue;
    if (chapter.isSectionModule) {
      if (!ch.isSectionModule || (ch.sectionId || ch.id) !== secKey) continue;
    } else {
      if (ch.kind === 'submodel') continue;
      if ((ch.sectionId || ch.id) !== secKey) continue;
    }
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
