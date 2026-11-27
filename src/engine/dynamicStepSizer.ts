import {
  DEFAULT_STUDIO_CAMERA,
  STUDIO_CORNERS,
  computeStudioRotationCue,
  type StudioCameraPose,
  type StudioCornerId,
  type StudioRotationCue,
} from './minifigCamera';
import type { Vec3, WorldBox } from './minifigPose';
import {
  STEP_VISIBILITY_DEADBAND,
  UNDERSIDE_TOP_OCCLUSION_THRESHOLD,
  evaluateStepOcclusionVisibility,
  isStrictUndersidePlacement,
} from './stepCamera';

export interface DynamicPartDescriptor {
  index: number;
  partId: string;
  colorId: number;
  sku: string;
  role: string;
  box: WorldBox;
  layerY: number;
  isCladding: boolean;
}

export type RepeatPatternKind = 'structured' | 'scattered';

export interface StickyCameraResult extends StudioCameraPose {
  cue: StudioRotationCue;
  changed: boolean;
}

export interface DynamicStepSelectionOptions {
  anchor: number;
  parts: readonly DynamicPartDescriptor[];
  /**
   * Returns all currently remaining part indices that satisfy the caller's
   * structural/physical eligibility rules (layer tolerance, vertical prereqs,
   * connectivity, cladding readiness, duplicate-submodel exclusions, etc.).
   */
  getEligibleCandidates: (placedInStep: ReadonlySet<number>) => number[];
  modelBounds: WorldBox;
  builtBounds: WorldBox | null;
  activeCam: StudioCameraPose;
  isFirstStep: boolean;
  totalPartsInScope: number;
  isSubmodel?: boolean;
  /**
   * Optional set of Step 1 co-planar floor-plane partners that sit directly
   * underneath an immediate upper bridging piece touching `anchor` so Step 2
   * does not awkwardly overhang `anchor`.
   */
  coPlanarFloorPartners?: ReadonlySet<number>;
}

export const STEP_COGNITIVE_BUDGET = 8.0;
export const MAX_UNIQUE_SKUS_PER_STEP = 8;
export const MAX_TOTAL_PARTS_PER_STEP = 12;
export const PREFERRED_RUN_CHUNK = 10;
export const FIRST_STEP_MAX_PARTS = 3;

const CORNER_LOOKUP = new Map<StudioCornerId, { az: number; dirX: number; dirZ: number }>(
  STUDIO_CORNERS.map((c) => {
    const rad = (c.az * Math.PI) / 180;
    return [c.id, { az: c.az, dirX: Math.sin(rad), dirZ: Math.cos(rad) }];
  }),
);

export function computeBoundsFromBoxes(boxes: readonly WorldBox[]): WorldBox {
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
    return { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0] };
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

export function expandBoundsWithBox(bounds: WorldBox | null, box: WorldBox): WorldBox {
  if (!bounds) {
    return {
      min: [...box.min] as Vec3,
      max: [...box.max] as Vec3,
      center: [...box.center] as Vec3,
    };
  }
  const min: Vec3 = [
    Math.min(bounds.min[0], box.min[0]),
    Math.min(bounds.min[1], box.min[1]),
    Math.min(bounds.min[2], box.min[2]),
  ];
  const max: Vec3 = [
    Math.max(bounds.max[0], box.max[0]),
    Math.max(bounds.max[1], box.max[1]),
    Math.max(bounds.max[2], box.max[2]),
  ];
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

/**
 * Horizontal alignment of `box` toward `corner`'s orthographic eye relative to `refBounds`.
 * Positive values mean the part sits on the half/corner closest to that camera;
 * negative values mean it sits on the far/away side.
 */
export function cornerAlignmentDot(
  box: WorldBox,
  corner: StudioCornerId,
  refBounds: WorldBox,
): number {
  const info = CORNER_LOOKUP.get(corner) ?? CORNER_LOOKUP.get('front_right')!;
  const halfX = Math.max(20, (refBounds.max[0] - refBounds.min[0]) * 0.5);
  const halfZ = Math.max(20, (refBounds.max[2] - refBounds.min[2]) * 0.5);
  const nx = clamp((box.center[0] - refBounds.center[0]) / halfX, -1.5, 1.5);
  const nz = clamp((box.center[2] - refBounds.center[2]) / halfZ, -1.5, 1.5);
  return nx * info.dirX + nz * info.dirZ;
}

/**
 * Coarse camera-facing zone bucket for frontier ordering:
 * 0 = on the camera-facing corner/half (build first to avoid unnecessary rotations)
 * 1 = near center / neutral
 * 2 = on the far side away from the active camera
 */
export function cameraCornerBucket(
  box: WorldBox,
  corner: StudioCornerId,
  refBounds: WorldBox,
): 0 | 1 | 2 {
  const spanX = refBounds.max[0] - refBounds.min[0];
  const spanZ = refBounds.max[2] - refBounds.min[2];
  if (Math.max(spanX, spanZ) < 60) return 0;
  const dot = cornerAlignmentDot(box, corner, refBounds);
  if (dot >= -0.05) return 0;
  if (dot >= -0.35) return 1;
  return 2;
}

/**
 * Splits large uniform runs evenly across steps so e.g. 16 identical bricks in a
 * row become 8 + 8 instead of 12 + 4.
 */
export function computeEvenRunTarget(
  runSize: number,
  maxSingleStep = MAX_TOTAL_PARTS_PER_STEP,
  preferredChunk = PREFERRED_RUN_CHUNK,
): number {
  if (runSize <= 0) return 0;
  if (runSize <= maxSingleStep) return runSize;
  const chunks = Math.max(2, Math.ceil(runSize / preferredChunk));
  return Math.ceil(runSize / chunks);
}

/**
 * Prevents a single step from mixing opposite exterior walls of a sizeable build,
 * unless the pair is mirror-symmetric across a compact section where both sides
 * remain easy to read in a single frame.
 */
export function areOnOppositeWalls(
  anchorBox: WorldBox,
  candBox: WorldBox,
  refBounds: WorldBox,
  allowCompactMirror = false,
): boolean {
  const spanX = refBounds.max[0] - refBounds.min[0];
  const spanZ = refBounds.max[2] - refBounds.min[2];
  const halfX = spanX * 0.5;
  const halfZ = spanZ * 0.5;

  if (spanX >= 80 && halfX > 0) {
    const ax = (anchorBox.center[0] - refBounds.center[0]) / halfX;
    const bx = (candBox.center[0] - refBounds.center[0]) / halfX;
    if (Math.abs(ax) >= 0.45 && Math.abs(bx) >= 0.45 && ax * bx < -0.25) {
      if (!(allowCompactMirror && spanX <= 140)) return true;
    }
  }
  if (spanZ >= 80 && halfZ > 0) {
    const az = (anchorBox.center[2] - refBounds.center[2]) / halfZ;
    const bz = (candBox.center[2] - refBounds.center[2]) / halfZ;
    if (Math.abs(az) >= 0.45 && Math.abs(bz) >= 0.45 && az * bz < -0.25) {
      if (!(allowCompactMirror && spanZ <= 140)) return true;
    }
  }
  return false;
}

function isMirrorSymmetric(a: WorldBox, b: WorldBox, refBounds: WorldBox): boolean {
  if (Math.abs(a.center[1] - b.center[1]) > 5) return false;
  const horizDist = Math.hypot(a.center[0] - b.center[0], a.center[2] - b.center[2]);
  if (horizDist < 12 || horizDist > 165) return false;

  const cx = refBounds.center[0];
  const cz = refBounds.center[2];
  const mirrorX =
    Math.abs((a.center[0] - cx) + (b.center[0] - cx)) <= 6 &&
    Math.abs(a.center[2] - b.center[2]) <= 6;
  const mirrorZ =
    Math.abs((a.center[2] - cz) + (b.center[2] - cz)) <= 6 &&
    Math.abs(a.center[0] - b.center[0]) <= 6;

  return mirrorX || mirrorZ;
}

function axisGap(minA: number, maxA: number, minB: number, maxB: number): number {
  return Math.max(0, minA - maxB, minB - maxA);
}

/**
 * Determines whether adding `candBox` of the same SKU to `existingBoxes` extends
 * a structured/repeatable pattern (linear row, uniform grid, or mirror pair) vs.
 * a scattered/irregular placement (e.g. castle-wall texture/greebling).
 */
export function classifySameSkuPattern(
  candBox: WorldBox,
  existingBoxes: readonly WorldBox[],
  modelBounds: WorldBox,
): RepeatPatternKind {
  if (existingBoxes.length === 0) return 'structured';

  const candW = Math.max(12, candBox.max[0] - candBox.min[0]);
  const candD = Math.max(12, candBox.max[2] - candBox.min[2]);
  const sameLevel = existingBoxes.filter((b) => Math.abs(b.center[1] - candBox.center[1]) <= 6);

  // 1. Linear row along X (same Z within stud-alignment tolerance, adjacent or matching uniform X pitch)
  const sameZ = sameLevel.filter((b) => Math.abs(b.center[2] - candBox.center[2]) <= 3);
  if (sameZ.length > 0) {
    let minGapX = Infinity;
    for (const b of sameZ) {
      const g = axisGap(candBox.min[0], candBox.max[0], b.min[0], b.max[0]);
      if (g < minGapX) minGapX = g;
    }
    // Directly touching or within 1 stud gap in a straight line
    if (minGapX <= Math.max(22, candW * 0.6)) return 'structured';

    // Matching uniform pitch established by >=2 existing bricks in this X row
    if (sameZ.length >= 2) {
      const xs = sameZ.map((b) => b.center[0]).sort((a, b) => a - b);
      const pitches: number[] = [];
      for (let i = 1; i < xs.length; i++) {
        const d = xs[i] - xs[i - 1];
        if (d > 4) pitches.push(d);
      }
      if (pitches.length > 0) {
        const refPitch = pitches[0];
        const isUniformRow = pitches.every((p) => Math.abs(p - refPitch) <= 3);
        if (isUniformRow) {
          const distLo = Math.abs(xs[0] - candBox.center[0] - refPitch);
          const distHi = Math.abs(candBox.center[0] - xs[xs.length - 1] - refPitch);
          if (distLo <= 3.5 || distHi <= 3.5) return 'structured';
        }
      }
    }
  }

  // 2. Linear row along Z (same X within stud-alignment tolerance, adjacent or matching uniform Z pitch)
  const sameX = sameLevel.filter((b) => Math.abs(b.center[0] - candBox.center[0]) <= 3);
  if (sameX.length > 0) {
    let minGapZ = Infinity;
    for (const b of sameX) {
      const g = axisGap(candBox.min[2], candBox.max[2], b.min[2], b.max[2]);
      if (g < minGapZ) minGapZ = g;
    }
    if (minGapZ <= Math.max(22, candD * 0.6)) return 'structured';

    if (sameX.length >= 2) {
      const zs = sameX.map((b) => b.center[2]).sort((a, b) => a - b);
      const pitches: number[] = [];
      for (let i = 1; i < zs.length; i++) {
        const d = zs[i] - zs[i - 1];
        if (d > 4) pitches.push(d);
      }
      if (pitches.length > 0) {
        const refPitch = pitches[0];
        const isUniformRow = pitches.every((p) => Math.abs(p - refPitch) <= 3);
        if (isUniformRow) {
          const distLo = Math.abs(zs[0] - candBox.center[2] - refPitch);
          const distHi = Math.abs(candBox.center[2] - zs[zs.length - 1] - refPitch);
          if (distLo <= 3.5 || distHi <= 3.5) return 'structured';
        }
      }
    }
  }

  // 3. Regular 2D grid alignment (matches BOTH an existing X column and an existing Z row within nearby span)
  if (sameLevel.length >= 2) {
    const matchX = sameLevel.find((b) => Math.abs(b.center[0] - candBox.center[0]) <= 3);
    const matchZ = sameLevel.find((b) => Math.abs(b.center[2] - candBox.center[2]) <= 3);
    if (matchX && matchZ && matchX !== matchZ) {
      const dx = Math.abs(candBox.center[0] - matchZ.center[0]);
      const dz = Math.abs(candBox.center[2] - matchX.center[2]);
      if (dx <= 105 && dz <= 105) return 'structured';
    }
  }

  // 4. Mirror-symmetric pair across section/model centerline (on compact visible span)
  const modelSpan = Math.max(
    modelBounds.max[0] - modelBounds.min[0],
    modelBounds.max[2] - modelBounds.min[2],
  );
  if (modelSpan <= 180) {
    for (const b of existingBoxes) {
      if (isMirrorSymmetric(candBox, b, modelBounds)) return 'structured';
    }
  }

  return 'scattered';
}

/**
 * Frontier ordering comparator that preserves strict bottom-up layering and
 * wheel-last ordering while preferring the currently camera-facing corner/side
 * within the same vertical build band (minimizing unnecessary camera rotations).
 */
export function compareFrontierCandidates(
  a: DynamicPartDescriptor,
  b: DynamicPartDescriptor,
  activeCorner: StudioCornerId,
  refBounds: WorldBox,
  sameSkuBandCounts?: ReadonlyMap<string, number>,
  avoidableOverhangSet?: ReadonlySet<number>,
): number {
  const wa = a.role === 'wheel' ? 1 : 0;
  const wb = b.role === 'wheel' ? 1 : 0;
  if (wa !== wb) return wa - wb;

  // Coarse vertical band (16 LDU = 2 plates) keeps strict bottom-up construction
  // while letting camera-facing side finish cleanly before turning to the far side.
  const bandA = Math.round(a.layerY / 16);
  const bandB = Math.round(b.layerY / 16);
  if (bandA !== bandB) return bandA - bandB;

  // Place low bricks/plates on this floor before towering panels/windows (>=48 LDU)
  // so tall foreground walls never prematurely hide interior or back-side pieces.
  const tallA = a.box.max[1] - a.box.min[1] >= 48 ? 1 : 0;
  const tallB = b.box.max[1] - b.box.min[1] >= 48 ? 1 : 0;
  if (tallA !== tallB) return tallA - tallB;

  // Prefer solidly supported pieces before avoidably overhanging pieces that still
  // have unplaced lower support sitting directly underneath them.
  if (avoidableOverhangSet) {
    const ovA = avoidableOverhangSet.has(a.index) ? 1 : 0;
    const ovB = avoidableOverhangSet.has(b.index) ? 1 : 0;
    if (ovA !== ovB) return ovA - ovB;
  }

  const bucketA = cameraCornerBucket(a.box, activeCorner, refBounds);
  const bucketB = cameraCornerBucket(b.box, activeCorner, refBounds);
  if (bucketA !== bucketB) return bucketA - bucketB;

  if (a.isCladding !== b.isCladding) return a.isCladding ? 1 : -1;

  const fineA = Math.round(a.layerY / 8);
  const fineB = Math.round(b.layerY / 8);
  if (fineA !== fineB) return fineA - fineB;

  // Slightly favor starting on a SKU that has multiple ready pieces in this band
  // so repeated pieces group naturally together.
  if (sameSkuBandCounts) {
    const cntA = sameSkuBandCounts.get(a.sku) ?? 1;
    const cntB = sameSkuBandCounts.get(b.sku) ?? 1;
    const multiA = cntA >= 2 ? 1 : 0;
    const multiB = cntB >= 2 ? 1 : 0;
    if (multiA !== multiB) return multiB - multiA;
  }

  const dotBucketA = Math.round(cornerAlignmentDot(a.box, activeCorner, refBounds) * 6);
  const dotBucketB = Math.round(cornerAlignmentDot(b.box, activeCorner, refBounds) * 6);
  if (dotBucketA !== dotBucketB) return dotBucketB - dotBucketA;

  return a.partId.localeCompare(b.partId);
}

/**
 * Builds a memoized check for whether an unplaced prerequisite part `u` is
 * physically grounded in `placed` (either directly touching a placed part, or
 * resting atop a chain of unplaced `belowMap` prerequisites that reaches `placed`).
 *
 * Why: Blocking an upper bridge/floor on an unplaced lower part `u` is only
 * valid when `u` can itself be placed while connected to `placed`. If `u` is
 * NOT connected to `placed` (e.g., underside plates beneath an unplaced train
 * floor, or a second separate baseplate), blocking the bridge would force `u`
 * to be placed detached/floating before the bridge. Letting the bridge attach
 * to `placed` first immediately connects `u` to the model for the next step.
 */
export function createGroundedPrereqChecker(
  adjacency: readonly (readonly number[])[],
  belowMap: readonly (readonly number[])[],
  placed: ReadonlySet<number>,
  remaining: ReadonlySet<number>,
): (partIdx: number) => boolean {
  const memo = new Map<number, boolean>();
  const visiting = new Set<number>();

  const isGrounded = (u: number): boolean => {
    if (!remaining.has(u)) return false;
    const cached = memo.get(u);
    if (cached !== undefined) return cached;
    if (visiting.has(u)) return false; // Defensive cycle guard
    visiting.add(u);

    let grounded = false;
    for (const nb of adjacency[u] ?? []) {
      if (placed.has(nb)) {
        grounded = true;
        break;
      }
    }
    if (!grounded) {
      for (const lower of belowMap[u] ?? []) {
        if (remaining.has(lower) && isGrounded(lower)) {
          grounded = true;
          break;
        }
      }
    }

    visiting.delete(u);
    memo.set(u, grounded);
    return grounded;
  };

  return isGrounded;
}

/**
 * Enforces strict step connectivity so disconnected pieces are never grouped
 * into the same step:
 *
 * - On Step 1 (`placedBeforeStep.size === 0`): every added piece must
 *   physically touch at least one piece already chosen for this step
 *   (`placedInStep`), so Step 1 forms a single connected assembly.
 * - On Steps 2+ when `anchor` connects to `placedBeforeStep` (normal build):
 *   every added piece must also physically connect to `placedBeforeStep`, so
 *   every piece in the step snaps directly onto the already-built model.
 * - On Steps 2+ when `anchor` does NOT connect to `placedBeforeStep` (only
 *   reached in fallback for genuinely disconnected model islands): every added
 *   piece must physically touch `placedInStep` (staying strictly inside
 *   `anchor`'s own connected island) and must NOT touch `placedBeforeStep`.
 */
export function isCandidateConnectedForStep(
  candIdx: number,
  anchorConnectedToPrev: boolean,
  adjacency: readonly (readonly number[])[],
  placedBeforeStep: ReadonlySet<number>,
  placedInStep: ReadonlySet<number>,
): boolean {
  const nbs = adjacency[candIdx] ?? [];
  if (placedBeforeStep.size === 0) {
    return nbs.some((nb) => placedInStep.has(nb));
  }
  if (anchorConnectedToPrev) {
    return nbs.some((nb) => placedBeforeStep.has(nb));
  }
  // Disconnected-island fallback: only grow anchor's own connected island
  let touchesStep = false;
  for (const nb of nbs) {
    if (placedBeforeStep.has(nb)) return false;
    if (placedInStep.has(nb)) touchesStep = true;
  }
  return touchesStep;
}

/**
 * Identifies co-planar floor-plane partners of Step 1's `anchor` that sit directly
 * underneath an immediate upper bridging piece `U` (`U ∈ adj[anchor]`) which would
 * otherwise awkwardly overhang `anchor` on Step 2 (< 55% footprint supported by
 * `anchor` alone).
 *
 * All returned partners share the exact same floor plane (`min[1]` and `max[1]`
 * within 1.5 LDU of `anchor`), sit unblocked on the floor, and directly support `U`
 * from below — so laying them out flat on the table in Step 1 lets `U` drop cleanly
 * straight down onto a fully supported foundation in Step 2 with zero overhang and
 * zero upside-down underside tucking.
 */
export function findCoPlanarFloorFoundation(
  anchor: number,
  scopeRemaining: ReadonlySet<number>,
  boxes: readonly WorldBox[],
  adjacency: readonly (readonly number[])[],
  roles: readonly string[],
  claddingFlags: readonly boolean[],
  belowMap: readonly (readonly number[])[],
): Set<number> {
  const partners = new Set<number>();
  const ba = boxes[anchor];
  if (!ba) return partners;
  const anchorRole = roles[anchor];
  if (
    anchorRole === 'wheel' ||
    anchorRole === 'pin' ||
    anchorRole === 'figure' ||
    anchorRole === 'wheel_holder' ||
    claddingFlags[anchor]
  ) {
    return partners;
  }

  let baseFloorY = Infinity;
  for (const i of scopeRemaining) {
    const r = roles[i];
    if (r === 'wheel' || r === 'pin' || r === 'figure' || claddingFlags[i]) continue;
    const b = boxes[i];
    if (b && b.min[1] < baseFloorY) baseFloorY = b.min[1];
  }
  if (!Number.isFinite(baseFloorY) || ba.min[1] > baseFloorY + 4.5) {
    return partners;
  }

  for (const u of adjacency[anchor] ?? []) {
    if (!scopeRemaining.has(u)) continue;
    const ur = roles[u];
    if (ur === 'wheel' || ur === 'pin' || ur === 'figure' || claddingFlags[u]) continue;
    const bu = boxes[u];
    if (!bu) continue;
    // U must sit directly on top of anchor
    if (bu.min[1] < ba.max[1] - 4.5 || bu.min[1] > ba.max[1] + 4.5) continue;
    if (bu.center[1] <= ba.center[1] + 2.0) continue;

    const ovX = Math.min(bu.max[0], ba.max[0]) - Math.max(bu.min[0], ba.min[0]);
    const ovZ = Math.min(bu.max[2], ba.max[2]) - Math.max(bu.min[2], ba.min[2]);
    if (ovX < 3.0 || ovZ < 3.0) continue;

    const uArea = Math.max(1, (bu.max[0] - bu.min[0]) * (bu.max[2] - bu.min[2]));
    const anchorSupportRatio = (ovX * ovZ) / uArea;
    // If anchor alone already supports >= 55% of U, U does not awkwardly overhang anchor
    if (anchorSupportRatio >= 0.55) continue;

    for (const q of adjacency[u] ?? []) {
      if (q === anchor || !scopeRemaining.has(q)) continue;
      const qr = roles[q];
      if (qr === 'wheel' || qr === 'pin' || qr === 'figure' || qr === 'wheel_holder' || claddingFlags[q]) continue;
      if ((belowMap[q] ?? []).some((b) => scopeRemaining.has(b))) continue;
      const bq = boxes[q];
      if (!bq) continue;
      // Strictly co-planar with anchor (same table plane & same top contact plane)
      if (Math.abs(bq.min[1] - ba.min[1]) > 1.5) continue;
      if (Math.abs(bq.max[1] - ba.max[1]) > 1.5) continue;

      const qOvX = Math.min(bu.max[0], bq.max[0]) - Math.max(bu.min[0], bq.min[0]);
      const qOvZ = Math.min(bu.max[2], bq.max[2]) - Math.max(bu.min[2], bq.min[2]);
      if (qOvX < 3.0 || qOvZ < 3.0) continue;

      partners.add(q);
    }
  }

  return partners;
}

/**
 * Returns true when placing `idx` right now would leave it significantly overhanging
 * (< 50% of its horizontal footprint supported by `placedBeforeStep`, and < 65% of
 * its total underlying support placed) WHILE unplaced lower support parts still exist
 * directly underneath `idx` in `remaining`.
 *
 * Intentional cantilevers (wings, spoilers, eaves with nothing underneath them) have
 * zero unplaced underlying support and return `false`.
 */
export function hasAvoidableOverhang(
  idx: number,
  boxes: readonly WorldBox[],
  adjacency: readonly (readonly number[])[],
  placedBeforeStep: ReadonlySet<number>,
  remaining: ReadonlySet<number>,
  roles: readonly string[],
  claddingFlags: readonly boolean[],
): boolean {
  const b = boxes[idx];
  if (!b || placedBeforeStep.size === 0) return false;
  const area = Math.max(1, (b.max[0] - b.min[0]) * (b.max[2] - b.min[2]));
  let placedSupportArea = 0;
  let unplacedSupportArea = 0;

  for (const nb of adjacency[idx] ?? []) {
    const r = roles[nb];
    if (r === 'wheel' || r === 'pin' || r === 'figure' || claddingFlags[nb]) continue;
    const bn = boxes[nb];
    if (!bn) continue;
    // Must sit directly underneath idx
    if (bn.max[1] < b.min[1] - 4.5 || bn.max[1] > b.min[1] + 4.5) continue;
    if (bn.center[1] >= b.center[1] - 2.0) continue;

    const ovX = Math.min(b.max[0], bn.max[0]) - Math.max(b.min[0], bn.min[0]);
    const ovZ = Math.min(b.max[2], bn.max[2]) - Math.max(b.min[2], bn.min[2]);
    if (ovX < 3.0 || ovZ < 3.0) continue;

    const ovArea = ovX * ovZ;
    if (placedBeforeStep.has(nb)) {
      placedSupportArea += ovArea;
    } else if (remaining.has(nb)) {
      unplacedSupportArea += ovArea;
    }
  }

  if (unplacedSupportArea <= 4) return false;
  const placedRatio = placedSupportArea / area;
  const coveredShare = placedSupportArea / (placedSupportArea + unplacedSupportArea);
  return placedRatio < 0.55 && coveredShare < 0.65;
}

/**
 * Estimates the contiguous/structured run size of `anchor.sku` currently ready
 * in the same layer & camera-facing zone so large uniform runs can be split evenly.
 */
function estimateReadyStructuredRunSize(
  anchor: DynamicPartDescriptor,
  initialCandidates: readonly number[],
  parts: readonly DynamicPartDescriptor[],
  modelBounds: WorldBox,
  refBounds: WorldBox,
  maxSpread: number,
): number {
  const anchorBox = anchor.box;
  const sameSku = initialCandidates.filter((i) => {
    const p = parts[i];
    if (p.sku !== anchor.sku) return false;
    if (areOnOppositeWalls(anchorBox, p.box, refBounds, true)) return false;
    const d = Math.hypot(
      p.box.center[0] - anchorBox.center[0],
      p.box.center[1] - anchorBox.center[1],
      p.box.center[2] - anchorBox.center[2],
    );
    return d <= maxSpread * 1.45;
  });

  const accepted: WorldBox[] = [anchorBox];
  const pool = new Set(sameSku);
  let progressed = true;
  while (progressed) {
    progressed = false;
    for (const idx of Array.from(pool)) {
      const box = parts[idx].box;
      if (classifySameSkuPattern(box, accepted, modelBounds) === 'structured') {
        accepted.push(box);
        pool.delete(idx);
        progressed = true;
      }
    }
  }
  return accepted.length;
}

/**
 * Dynamic cognitive-budget step selector.
 *
 * Replaces static Few / Balanced / Many limits with:
 * - Cognitive budget (~8.0 units): up to ~8 compact unique pieces when simple,
 *   or up to 10-12 pieces when identical pieces form a structured row/grid/pair.
 * - Strong preference for grouping identical pieces together before mixing types.
 * - Even chunk splitting for large uniform runs (e.g. 16 -> 8 + 8).
 * - Tighter caps (~3-5) for scattered/irregular identical texture pieces.
 * - Gentle Step 1 anchor sizing (1-3 bricks) for clean manual openings.
 * - Spatial face/footprint guards so every step reads cleanly in one frame.
 */
export function selectDynamicStepIndices(options: DynamicStepSelectionOptions): number[] {
  const {
    anchor,
    parts,
    getEligibleCandidates,
    modelBounds,
    builtBounds,
    activeCam,
    isFirstStep,
    totalPartsInScope,
    isSubmodel = false,
    coPlanarFloorPartners,
  } = options;

  const anchorPart = parts[anchor];
  const refBounds = builtBounds ?? modelBounds;
  const modelHorizSpan = Math.max(
    modelBounds.max[0] - modelBounds.min[0],
    modelBounds.max[2] - modelBounds.min[2],
  );
  const baseMaxSpread = modelHorizSpan >= 400 ? 120 : 165;
  const structuredMaxFootprint = clamp(Math.max(160, modelHorizSpan * 0.55), 160, 260);
  const mixedMaxFootprint = clamp(Math.max(120, modelHorizSpan * 0.42), 120, 185);

  const stepIndices: number[] = [anchor];
  const placedInStep = new Set<number>([anchor]);

  // Step 1 of a model or section starts gently (1-3 foundation bricks),
  // and tiny submodels (<= 6 parts) pace gently so they aren't dumped in 1 step.
  // When Step 1 lays out a co-planar floor foundation supporting an immediate bridging
  // plate, allow up to 5 floor parts / 4 SKUs so flanking base plates sit together cleanly.
  const hasCoPlanarFloor = isFirstStep && Boolean(coPlanarFloorPartners && coPlanarFloorPartners.size > 0);
  let budget = STEP_COGNITIVE_BUDGET;
  let maxParts = MAX_TOTAL_PARTS_PER_STEP;
  let maxUnique = MAX_UNIQUE_SKUS_PER_STEP;
  if (isFirstStep) {
    budget = totalPartsInScope <= 4 ? 2.0 : hasCoPlanarFloor ? 4.2 : 3.0;
    maxParts = totalPartsInScope <= 4
      ? 2
      : hasCoPlanarFloor
        ? Math.max(FIRST_STEP_MAX_PARTS, Math.min(5, 1 + coPlanarFloorPartners!.size))
        : FIRST_STEP_MAX_PARTS;
    maxUnique = totalPartsInScope <= 4
      ? 2
      : hasCoPlanarFloor
        ? Math.max(FIRST_STEP_MAX_PARTS, Math.min(4, 1 + coPlanarFloorPartners!.size))
        : FIRST_STEP_MAX_PARTS;
  } else if (isSubmodel && totalPartsInScope <= 6) {
    const gentleCap = Math.max(2, Math.ceil(totalPartsInScope / 2));
    budget = gentleCap;
    maxParts = gentleCap;
    maxUnique = gentleCap;
  }

  let spentBudget = 1.0; // Anchor part costs 1.0 cognitive unit
  const skuCounts = new Map<string, number>([[anchorPart.sku, 1]]);
  const skuBoxes = new Map<string, WorldBox[]>([[anchorPart.sku, [anchorPart.box]]]);
  const skuScatteredCounts = new Map<string, number>();

  let stepBounds: WorldBox = expandBoundsWithBox(null, anchorPart.box);
  let anchorRunTarget: number | null = null;
  let splittingLargeRun = false;

  if (!isFirstStep) {
    const initialEligible = getEligibleCandidates(placedInStep);
    const readyRunSize = estimateReadyStructuredRunSize(
      anchorPart,
      initialEligible,
      parts,
      modelBounds,
      refBounds,
      baseMaxSpread,
    );
    if (readyRunSize > MAX_TOTAL_PARTS_PER_STEP) {
      anchorRunTarget = computeEvenRunTarget(readyRunSize);
      splittingLargeRun = true;
    } else if (readyRunSize >= 2) {
      anchorRunTarget = readyRunSize;
    }
  }

  while (stepIndices.length < maxParts && spentBudget < budget - 0.05) {
    // If we are intentionally splitting a large uniform run (e.g. 16 -> 8 + 8),
    // finish cleanly at the even chunk boundary without tacking on unrelated parts.
    if (splittingLargeRun && anchorRunTarget !== null) {
      const curAnchorCount = skuCounts.get(anchorPart.sku) ?? 0;
      if (curAnchorCount >= anchorRunTarget) break;
    }

    const rawEligible = getEligibleCandidates(placedInStep);
    if (rawEligible.length === 0) break;

    const evaluated: Array<{
      idx: number;
      cost: number;
      score: number;
      isSameSku: boolean;
      pattern: RepeatPatternKind | null;
    }> = [];

    const maxRepeatInStep = Math.max(...skuCounts.values());

    for (const idx of rawEligible) {
      if (placedInStep.has(idx)) continue;
      const cand = parts[idx];
      const existingOfSku = skuBoxes.get(cand.sku);
      const isSameSku = Boolean(existingOfSku && existingOfSku.length > 0);
      const alreadyScattered = (skuScatteredCounts.get(cand.sku) ?? 0) >= 1;
      const pattern: RepeatPatternKind | null = isSameSku
        ? (alreadyScattered ? 'scattered' : classifySameSkuPattern(cand.box, existingOfSku!, modelBounds))
        : null;
      const isCoPlanarPartner = Boolean(coPlanarFloorPartners && coPlanarFloorPartners.has(idx));

      // When Step 1 is laying out a co-planar floor foundation, keep it flat on the floor
      // plane so upper bridging plates drop cleanly on top in Step 2 instead of covering
      // or overhanging the foundation in Step 1.
      if (hasCoPlanarFloor && !isCoPlanarPartner && Math.abs(cand.box.min[1] - anchorPart.box.min[1]) > 1.5) {
        continue;
      }

      // When splitting a very large uniform run, keep the chunk purely homogeneous.
      if (splittingLargeRun && (!isSameSku || cand.sku !== anchorPart.sku || pattern !== 'structured')) {
        continue;
      }

      // Opposite-wall spatial guard (allow compact mirror pair only for same-SKU structured mirror,
      // and allow Step 1 co-planar floor partners that sit directly under the same bridging plate).
      const allowMirror = isSameSku && pattern === 'structured';
      if (!isCoPlanarPartner && areOnOppositeWalls(anchorPart.box, cand.box, refBounds, allowMirror)) {
        continue;
      }

      // Compute step footprint expansion check
      const nextBounds = expandBoundsWithBox(stepBounds, cand.box);
      const nextSpan = Math.max(
        nextBounds.max[0] - nextBounds.min[0],
        nextBounds.max[2] - nextBounds.min[2],
      );
      const footprintLimit = isSameSku && pattern === 'structured'
        ? structuredMaxFootprint
        : mixedMaxFootprint;

      // Allow adding a part that is itself very wide (e.g. long plate) as long as
      // distance from the current cluster center stays reasonable.
      const candSelfSpan = Math.max(
        cand.box.max[0] - cand.box.min[0],
        cand.box.max[2] - cand.box.min[2],
      );
      const effectiveFootprintLimit = Math.max(footprintLimit, candSelfSpan + 80);
      if (!isCoPlanarPartner && nextSpan > effectiveFootprintLimit) continue;

      const distToCluster = Math.hypot(
        cand.box.center[0] - stepBounds.center[0],
        cand.box.center[1] - stepBounds.center[1],
        cand.box.center[2] - stepBounds.center[2],
      );
      const maxCandDist = isSameSku && pattern === 'structured'
        ? baseMaxSpread * 1.45
        : baseMaxSpread;
      if (!isCoPlanarPartner && distToCluster > maxCandDist) continue;

      // Cognitive cost calculation
      let cost: number;
      if (isSameSku) {
        if (pattern === 'structured') {
          if (
            anchorRunTarget !== null &&
            cand.sku === anchorPart.sku &&
            (skuCounts.get(cand.sku) ?? 0) >= anchorRunTarget
          ) {
            continue;
          }
          cost = 0.45;
        } else {
          // Scattered identical texture pieces (castle wall greebling, irregular studs):
          // cap around 3-5 total per step so the builder doesn't have to hunt everywhere.
          const curSkuTotal = skuCounts.get(cand.sku) ?? 0;
          const scatteredCap = distToCluster <= 65 ? 5 : 4;
          if (curSkuTotal >= scatteredCap) continue;
          const distPenalty = distToCluster > 65 ? ((distToCluster - 65) / 100) * 0.45 : 0;
          cost = 1.15 + distPenalty;
        }
      } else {
        // New distinct SKU
        if (skuCounts.size >= maxUnique) continue;
        // If we already built a clean structured run of >= 4 identical pieces,
        // avoid cluttering it with unrelated 1x pieces unless very tight.
        const switchSurcharge = maxRepeatInStep >= 4 ? 1.6 : maxRepeatInStep >= 2 ? 0.75 : 0;
        const spreadSurcharge = isCoPlanarPartner
          ? 0
          : distToCluster > 60
            ? ((distToCluster - 60) / 100) * 0.6
            : 0;
        cost = 1.0 + switchSurcharge + spreadSurcharge;
      }

      if (spentBudget + cost > budget + 1e-6) continue;

      // Priority scoring: strongly favor structured identical pieces first, then
      // scattered identical pieces, then same shape, then compact camera-side neighbors.
      let score = 0;
      if (isSameSku && pattern === 'structured') {
        score += 170;
      } else if (isSameSku) {
        score += 80;
      } else if (cand.partId === anchorPart.partId) {
        // Same part shape in another color (e.g. alternating stripe/checkerboard)
        const sameShapePattern = classifySameSkuPattern(cand.box, [anchorPart.box], modelBounds);
        score += sameShapePattern === 'structured' ? 55 : 30;
      }
      if (cand.role === anchorPart.role) score += 15;
      if (isCoPlanarPartner) score += 40;

      // Prefer extending closely from the existing cluster and same exact height
      let nearestDist = Infinity;
      for (const sIdx of stepIndices) {
        const sb = parts[sIdx].box;
        const d = Math.hypot(
          cand.box.center[0] - sb.center[0],
          cand.box.center[2] - sb.center[2],
        );
        if (d < nearestDist) nearestDist = d;
      }
      score -= nearestDist * 0.45;
      score -= Math.abs(cand.layerY - anchorPart.layerY) * 2.0;

      // Favor staying on the camera-facing corner/side
      score += cornerAlignmentDot(cand.box, activeCam.corner, refBounds) * 18;

      evaluated.push({ idx, cost, score, isSameSku, pattern });
    }

    if (evaluated.length === 0) break;

    evaluated.sort((a, b) => b.score - a.score || a.idx - b.idx);
    const chosen = evaluated[0];
    const chosenPart = parts[chosen.idx];

    stepIndices.push(chosen.idx);
    placedInStep.add(chosen.idx);
    spentBudget += chosen.cost;
    stepBounds = expandBoundsWithBox(stepBounds, chosenPart.box);

    skuCounts.set(chosenPart.sku, (skuCounts.get(chosenPart.sku) ?? 0) + 1);
    const list = skuBoxes.get(chosenPart.sku);
    if (list) list.push(chosenPart.box);
    else skuBoxes.set(chosenPart.sku, [chosenPart.box]);

    if (chosen.isSameSku && chosen.pattern === 'scattered') {
      skuScatteredCounts.set(
        chosenPart.sku,
        (skuScatteredCounts.get(chosenPart.sku) ?? 0) + 1,
      );
    }
  }

  return stepIndices;
}

function makeCornerPose(side: 'top' | 'bottom', corner: StudioCornerId): StudioCameraPose {
  const info = CORNER_LOOKUP.get(corner) ?? CORNER_LOOKUP.get('front_right')!;
  return {
    side,
    corner,
    az: info.az,
    el: side === 'bottom' ? -30 : 30,
  };
}

function cornerYawSteps(a: StudioCornerId, b: StudioCornerId): number {
  const idxA = STUDIO_CORNERS.findIndex((c) => c.id === a);
  const idxB = STUDIO_CORNERS.findIndex((c) => c.id === b);
  if (idxA < 0 || idxB < 0) return 0;
  const diff = Math.abs(idxA - idxB);
  return Math.min(diff, 4 - diff);
}

/**
 * Occlusion-aware sticky camera-corner selector:
 * - Strongly prefers keeping `currentCam` (zero spinning while new bricks remain clearly visible).
 * - Uses exact orthographic ray-AABB visibility against `builtBoxes`, so open top layers,
 *   flat baseplates, and bottom-up walls never cause layer-by-layer spinning.
 * - Rotates to an unobstructed corner only when already-built structure genuinely occludes
 *   the newly placed pieces, or flips to `bottom` only when pieces sit strictly underneath
 *   close overhead structure and are hidden from top views.
 */
export function chooseStickyStepCamera(
  stepBoxes: readonly WorldBox[],
  builtBoxes: readonly WorldBox[],
  builtBounds: WorldBox | null,
  currentCam: StudioCameraPose = DEFAULT_STUDIO_CAMERA,
): StickyCameraResult {
  if (stepBoxes.length === 0 || !builtBounds || builtBoxes.length < 4) {
    return { ...currentCam, cue: 'none', changed: false };
  }

  const spanX = builtBounds.max[0] - builtBounds.min[0];
  const spanY = builtBounds.max[1] - builtBounds.min[1];
  const spanZ = builtBounds.max[2] - builtBounds.min[2];
  const horizSpan = Math.max(spanX, spanZ);

  // Tiny / flat early base: everything is immediately visible from the current angle
  if (horizSpan < 80 && spanY < 40) {
    return { ...currentCam, cue: 'none', changed: false };
  }

  const stepBox = computeBoundsFromBoxes(stepBoxes);
  const currentVis = evaluateStepOcclusionVisibility(
    stepBoxes,
    builtBoxes,
    currentCam.az,
    currentCam.el,
  ).visibility;

  // Evaluate all 4 top corners once for underside / rotation decisions
  const topScores = STUDIO_CORNERS.map((c) => ({
    corner: c.id,
    az: c.az,
    vis:
      currentCam.side === 'top' && currentCam.corner === c.id && Math.abs(currentCam.el - 30) < 1
        ? currentVis
        : evaluateStepOcclusionVisibility(stepBoxes, builtBoxes, c.az, 30).visibility,
    dot: cornerAlignmentDot(stepBox, c.id, builtBounds),
  }));
  const bestTopVis = Math.max(...topScores.map((s) => s.vis));

  // 1. Check strict underside / flip_vertical transitions
  const underside = isStrictUndersidePlacement(stepBoxes, builtBoxes, builtBounds);
  if (underside) {
    // Never flip upside down if the current top view already sees the bricks clearly
    if (currentCam.side === 'top' && (currentVis >= 0.62 || bestTopVis >= UNDERSIDE_TOP_OCCLUSION_THRESHOLD)) {
      // Fall through to normal top-corner logic below
    } else {
      const bottomScores = STUDIO_CORNERS.map((c) => ({
        corner: c.id,
        az: c.az,
        vis:
          currentCam.side === 'bottom' && currentCam.corner === c.id && Math.abs(currentCam.el + 30) < 1
            ? currentVis
            : evaluateStepOcclusionVisibility(stepBoxes, builtBoxes, c.az, -30).visibility,
        dot: cornerAlignmentDot(stepBox, c.id, builtBounds),
      }));
      const curBottom = bottomScores.find((s) => s.corner === currentCam.corner) ?? bottomScores[0];

      if (currentCam.side === 'bottom' && curBottom.vis >= STEP_VISIBILITY_DEADBAND) {
        return { ...currentCam, cue: 'none', changed: false };
      }

      let bestBottom = curBottom;
      let bestBottomScore = -Infinity;
      for (const s of bottomScores) {
        const yawSteps = cornerYawSteps(currentCam.corner, s.corner);
        const turnPen = yawSteps === 0 ? 0 : yawSteps === 1 ? 0.04 : 0.07;
        const sc = s.vis + s.dot * 0.08 - turnPen;
        if (sc > bestBottomScore) {
          bestBottomScore = sc;
          bestBottom = s;
        }
      }

      if (bestBottom.vis >= STEP_VISIBILITY_DEADBAND && bestBottom.vis - bestTopVis >= 0.3) {
        const targetCorner = curBottom.vis >= STEP_VISIBILITY_DEADBAND ? currentCam.corner : bestBottom.corner;
        const next = makeCornerPose('bottom', targetCorner);
        const cue = computeStudioRotationCue(currentCam, next);
        return { ...next, cue, changed: cue !== 'none' };
      }
      if (currentCam.side === 'bottom') {
        return { ...currentCam, cue: 'none', changed: false };
      }
    }
  }

  // If we were flipped upside-down and are now back on top / normal walls, flip back to top
  if (currentCam.side === 'bottom') {
    const curTop = topScores.find((s) => s.corner === currentCam.corner) ?? topScores[0];
    let targetCorner = currentCam.corner;
    if (curTop.vis < STEP_VISIBILITY_DEADBAND) {
      let bestTop = curTop;
      let bestScore = -Infinity;
      for (const s of topScores) {
        const yawSteps = cornerYawSteps(currentCam.corner, s.corner);
        const turnPen = yawSteps === 0 ? 0 : yawSteps === 1 ? 0.04 : 0.07;
        const sc = s.vis + s.dot * 0.08 - turnPen;
        if (sc > bestScore) {
          bestScore = sc;
          bestTop = s;
        }
      }
      if (bestTop.vis - curTop.vis >= 0.25) {
        targetCorner = bestTop.corner;
      }
    }
    const next = makeCornerPose('top', targetCorner);
    const cue = computeStudioRotationCue(currentCam, next);
    return { ...next, cue, changed: cue !== 'none' };
  }

  // 2. Normal top view: stay rock-steady whenever the current view already sees the bricks clearly!
  if (currentVis >= STEP_VISIBILITY_DEADBAND) {
    return { ...currentCam, cue: 'none', changed: false };
  }

  // Current view is genuinely occluded -> pick the clearest unobstructed top corner
  let best = topScores[0];
  let bestScore = -Infinity;
  for (const s of topScores) {
    const yawSteps = cornerYawSteps(currentCam.corner, s.corner);
    const turnPen = yawSteps === 0 ? 0 : yawSteps === 1 ? 0.04 : 0.07;
    const sc = s.vis + s.dot * 0.08 - turnPen;
    if (sc > bestScore) {
      bestScore = sc;
      best = s;
    }
  }

  if (
    best.corner !== currentCam.corner &&
    best.vis >= STEP_VISIBILITY_DEADBAND &&
    best.vis - currentVis >= 0.25
  ) {
    const next = makeCornerPose('top', best.corner);
    const cue = computeStudioRotationCue(currentCam, next);
    return { ...next, cue, changed: cue !== 'none' };
  }

  return { ...currentCam, cue: 'none', changed: false };
}
