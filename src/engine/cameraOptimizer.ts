import type {
  CanonicalViewId,
  PartInstance,
  RotationCueType,
  StepNode,
  StepOverride,
  Vec3,
} from '../types/manual';
import { computePartWorldAabb } from './connectivity';
import { vec3Dot, vec3Normalize } from './math';

export interface CanonicalViewSpec {
  id: CanonicalViewId;
  label: string;
  shortLabel: string;
  azimuthDeg: number;
  elevationDeg: number;
  yawIndex: number; // 0..3
  isBottom: boolean;
  /** Unit vector pointing FROM target TOWARD camera */
  viewDir: Vec3;
}

function makeViewSpec(
  id: CanonicalViewId,
  label: string,
  shortLabel: string,
  azimuthDeg: number,
  elevationDeg: number,
  yawIndex: number,
  isBottom: boolean,
): CanonicalViewSpec {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  const cosEl = Math.cos(el);
  const viewDir: Vec3 = vec3Normalize([
    Math.sin(az) * cosEl,
    Math.sin(el),
    Math.cos(az) * cosEl,
  ]);
  return { id, label, shortLabel, azimuthDeg, elevationDeg, yawIndex, isBottom, viewDir };
}

export const CANONICAL_VIEWS: CanonicalViewSpec[] = [
  makeViewSpec('top_front_right', 'Front Right (Standard)', 'FR', 40, 32, 0, false),
  makeViewSpec('top_back_right', 'Back Right (90°)', 'BR', 130, 32, 1, false),
  makeViewSpec('top_back_left', 'Back Left (180°)', 'BL', 220, 32, 2, false),
  makeViewSpec('top_front_left', 'Front Left (270°)', 'FL', 310, 32, 3, false),
  makeViewSpec('bottom_front_right', 'Underside Front Right', 'U-FR', 40, -34, 0, true),
  makeViewSpec('bottom_back_right', 'Underside Back Right', 'U-BR', 130, -34, 1, true),
  makeViewSpec('bottom_back_left', 'Underside Back Left', 'U-BL', 220, -34, 2, true),
  makeViewSpec('bottom_front_left', 'Underside Front Left', 'U-FL', 310, -34, 3, true),
];

export const CANONICAL_VIEW_MAP: Record<CanonicalViewId, CanonicalViewSpec> = Object.fromEntries(
  CANONICAL_VIEWS.map((v) => [v.id, v]),
) as Record<CanonicalViewId, CanonicalViewSpec>;

function rayIntersectsAabb(
  origin: Vec3,
  dir: Vec3,
  min: Vec3,
  max: Vec3,
  minT = 2.0,
): boolean {
  let tmin = -Infinity;
  let tmax = Infinity;

  for (let i = 0; i < 3; i++) {
    if (Math.abs(dir[i]) < 1e-6) {
      if (origin[i] < min[i] || origin[i] > max[i]) return false;
    } else {
      const invD = 1 / dir[i];
      let t1 = (min[i] - origin[i]) * invD;
      let t2 = (max[i] - origin[i]) * invD;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return tmax >= minT;
}

/**
 * Evaluates visibility [0..1] of newly added parts in a step from a canonical viewpoint,
 * accounting for ray-box occlusion against previously placed parts and attachment normal alignment.
 */
export function scoreStepVisibility(
  newParts: PartInstance[],
  previousParts: PartInstance[],
  insertionDir: Vec3,
  view: CanonicalViewSpec,
): number {
  if (newParts.length === 0) return view.isBottom ? 0.4 : 0.9;

  const prevBoxes = previousParts.map((p) => computePartWorldAabb(p));
  const dir = view.viewDir;
  let totalScore = 0;

  for (const part of newParts) {
    const box = computePartWorldAabb(part);
    const samplePoints: Vec3[] = [
      box.center,
      [box.center[0], box.max[1] - 1, box.center[2]],
      [box.center[0], box.min[1] + 1, box.center[2]],
      [box.max[0] - 1, box.center[1], box.center[2]],
      [box.min[0] + 1, box.center[1], box.center[2]],
    ];

    let visibleSamples = 0;
    for (const pt of samplePoints) {
      let occluded = false;
      for (const prev of prevBoxes) {
        if (rayIntersectsAabb(pt, dir, prev.min, prev.max, 2.5)) {
          occluded = true;
          break;
        }
      }
      if (!occluded) visibleSamples += 1;
    }

    const occlusionScore = visibleSamples / samplePoints.length;

    // Reward seeing the side the piece is being attached from (e.g., underside parts prefer underside view)
    const normalAlignment = (vec3Dot(vec3Normalize(insertionDir), dir) + 1) * 0.5;
    // Gentle preference for upright views unless underside visibility actually demands flipping
    const uprightBonus = view.isBottom ? (insertionDir[1] < -0.5 ? 0.14 : -0.18) : 0.08;

    totalScore += Math.max(0, Math.min(1, occlusionScore * 0.72 + normalAlignment * 0.28 + uprightBonus));
  }

  return totalScore / newParts.length;
}

export function transitionCost(from: CanonicalViewSpec, to: CanonicalViewSpec): number {
  if (from.id === to.id) return 0;
  const flipCost = from.isBottom !== to.isBottom ? 0.95 : 0;
  const yawDiff = Math.abs(from.yawIndex - to.yawIndex);
  const minYawSteps = Math.min(yawDiff, 4 - yawDiff);
  const yawCost = minYawSteps === 0 ? 0 : minYawSteps === 1 ? 0.26 : 0.42;
  return flipCost + yawCost;
}

export function computeRotationCue(
  prevViewId: CanonicalViewId | null,
  nextViewId: CanonicalViewId,
): RotationCueType {
  if (!prevViewId || prevViewId === nextViewId) return 'none';
  const prev = CANONICAL_VIEW_MAP[prevViewId];
  const next = CANONICAL_VIEW_MAP[nextViewId];
  if (prev.isBottom !== next.isBottom) return 'flip_vertical';
  const delta = (next.yawIndex - prev.yawIndex + 4) % 4;
  if (delta === 1) return 'yaw_90_cw';
  if (delta === 2) return 'yaw_180';
  if (delta === 3) return 'yaw_90_ccw';
  return 'none';
}

/**
 * Global Viterbi Dynamic Programming camera/rotation optimizer.
 * Minimizes: sum_t [ (1 - Visibility(t, v_t)) + TransitionCost(v_{t-1} -> v_t) ]
 * Respects any manual user cameraViewOverride as a hard constraint.
 */
export function optimizeCameraSequence(
  steps: StepNode[],
  partsById: Record<string, PartInstance>,
  overrides: Record<string, StepOverride> = {},
  subassemblyPartLookup?: (subId: string) => string[],
): StepNode[] {
  if (steps.length === 0) return [];

  const V = CANONICAL_VIEWS.length;
  const T = steps.length;

  // Build cumulative placed parts per step
  const stepNewParts: PartInstance[][] = [];
  const stepPrevParts: PartInstance[][] = [];
  const placedSoFar: PartInstance[] = [];

  for (const step of steps) {
    const newIds = new Set<string>(step.partIds);
    if (subassemblyPartLookup) {
      for (const subId of step.attachedSubassemblyIds) {
        for (const pid of subassemblyPartLookup(subId)) {
          newIds.add(pid);
        }
      }
    }
    const newList = Array.from(newIds)
      .map((id) => partsById[id])
      .filter((p): p is PartInstance => Boolean(p));

    stepPrevParts.push([...placedSoFar]);
    stepNewParts.push(newList);
    placedSoFar.push(...newList);
  }

  const dp: number[][] = Array.from({ length: T }, () => new Array(V).fill(Infinity));
  const backptr: number[][] = Array.from({ length: T }, () => new Array(V).fill(0));

  for (let t = 0; t < T; t++) {
    const step = steps[t];
    const pinnedView = overrides[step.id]?.cameraViewOverride;

    for (let v = 0; v < V; v++) {
      const view = CANONICAL_VIEWS[v];
      if (pinnedView && view.id !== pinnedView) continue;

      const vis = scoreStepVisibility(
        stepNewParts[t],
        stepPrevParts[t],
        step.insertionDirection,
        view,
      );
      // Slight anchor preference for standard Front-Right on step 0 when tied
      const initialBias = t === 0 && view.id === 'top_front_right' ? -0.05 : 0;
      const emissionCost = (1 - vis) * 1.35 + initialBias;

      if (t === 0) {
        dp[t][v] = emissionCost;
        backptr[t][v] = v;
      } else {
        let bestPrev = 0;
        let bestCost = Infinity;
        for (let u = 0; u < V; u++) {
          if (!Number.isFinite(dp[t - 1][u])) continue;
          const c = dp[t - 1][u] + transitionCost(CANONICAL_VIEWS[u], view);
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

  // Backtrack optimal sequence
  let bestEnd = 0;
  let bestEndCost = Infinity;
  for (let v = 0; v < V; v++) {
    if (dp[T - 1][v] < bestEndCost) {
      bestEndCost = dp[T - 1][v];
      bestEnd = v;
    }
  }

  const chosen: CanonicalViewId[] = new Array(T);
  let curr = bestEnd;
  for (let t = T - 1; t >= 0; t--) {
    chosen[t] = CANONICAL_VIEWS[curr].id;
    curr = backptr[t][curr];
  }

  return steps.map((step, idx) => ({
    ...step,
    cameraView: chosen[idx],
    rotationCue: computeRotationCue(idx === 0 ? null : chosen[idx - 1], chosen[idx]),
  }));
}
