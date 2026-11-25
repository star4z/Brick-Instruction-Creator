/**
 * Stage touch gesture recognition and animation helpers.
 *
 * Implements Procreate-style "Quick Pinch to Fit" (pinch-to-fill):
 * a brisk inward two-finger pinch followed by an immediate release smoothly
 * snaps the proofing page back to centered 100% fit-to-screen, while deliberate
 * zoom-outs, hold-before-release pinches, two-finger pans, and outward pinches
 * continue behaving as normal manual zoom/pan.
 */

export interface PinchSample {
  dist: number;
  timeMs: number;
}

export interface QuickPinchTracker {
  startDist: number;
  startTimeMs: number;
  lastDist: number;
  lastTimeMs: number;
  minDist: number;
  lastInwardTimeMs: number;
  hasInwardMove: boolean;
  samples: PinchSample[];
}

export interface QuickPinchConfig {
  /** Maximum total gesture duration (ms) for a standard quick pinch. */
  maxQuickDurationMs: number;
  /** Minimum inward finger distance contraction (px) for a standard quick pinch. */
  minQuickShrinkPx: number;
  /** Maximum end/start distance ratio (e.g. 0.80 = at least 20% contraction). */
  maxQuickDistRatio: number;
  /** Minimum inward closing velocity (px/ms) for a standard quick pinch. */
  minQuickVelocityPxPerMs: number;
  /** Maximum hold/pause duration (ms) after the last inward movement before release. */
  maxQuickTrailingPauseMs: number;
  /** Maximum outward rebound (px) allowed after reaching minimum finger distance. */
  maxReboundPx: number;
  /** Lookback window (ms) for detecting a snappy inward flick at the end of a longer pinch. */
  recentWindowMs: number;
  /** Minimum inward contraction (px) inside the recent window for a mid-gesture snap. */
  minFlickShrinkPx: number;
  /** Maximum end/windowStart ratio for a mid-gesture snap. */
  maxFlickDistRatio: number;
  /** Minimum closing velocity (px/ms) for a mid-gesture snap. */
  minFlickVelocityPxPerMs: number;
  /** Maximum trailing pause (ms) for a mid-gesture snap. */
  maxFlickTrailingPauseMs: number;
  /** Minimum drop below running minDist (px) to count as active inward motion. */
  inwardStepEpsilonPx: number;
}

export const DEFAULT_QUICK_PINCH_CONFIG: Readonly<QuickPinchConfig> = {
  maxQuickDurationMs: 360,
  minQuickShrinkPx: 32,
  maxQuickDistRatio: 0.8,
  minQuickVelocityPxPerMs: 0.25,
  maxQuickTrailingPauseMs: 130,
  maxReboundPx: 8,
  recentWindowMs: 180,
  minFlickShrinkPx: 48,
  maxFlickDistRatio: 0.72,
  minFlickVelocityPxPerMs: 0.45,
  maxFlickTrailingPauseMs: 110,
  inwardStepEpsilonPx: 1.5,
};

/** Duration (ms) for the animated snap-back to 100% centered fit. */
export const STAGE_RESET_ANIM_DURATION_MS = 220;

export interface StageTransform {
  zoom: number;
  panX: number;
  panY: number;
}

export function createQuickPinchTracker(initialDist: number, nowMs: number): QuickPinchTracker {
  const safeDist = Math.max(10, initialDist);
  return {
    startDist: safeDist,
    startTimeMs: nowMs,
    lastDist: safeDist,
    lastTimeMs: nowMs,
    minDist: safeDist,
    lastInwardTimeMs: nowMs,
    hasInwardMove: false,
    samples: [{ dist: safeDist, timeMs: nowMs }],
  };
}

export function recordQuickPinchSample(
  tracker: QuickPinchTracker,
  dist: number,
  nowMs: number,
  config: QuickPinchConfig = DEFAULT_QUICK_PINCH_CONFIG,
): QuickPinchTracker {
  const safeDist = Math.max(10, dist);
  const safeTime = Math.max(tracker.lastTimeMs, nowMs);

  let minDist = tracker.minDist;
  let lastInwardTimeMs = tracker.lastInwardTimeMs;
  let hasInwardMove = tracker.hasInwardMove;

  if (safeDist <= minDist - config.inwardStepEpsilonPx) {
    minDist = safeDist;
    lastInwardTimeMs = safeTime;
    hasInwardMove = true;
  }

  // Keep a bounded recent sample history (recentWindowMs + safety margin)
  const cutoff = safeTime - (config.recentWindowMs + 120);
  const nextSamples = tracker.samples.filter((s) => s.timeMs >= cutoff);
  nextSamples.push({ dist: safeDist, timeMs: safeTime });

  return {
    startDist: tracker.startDist,
    startTimeMs: tracker.startTimeMs,
    lastDist: safeDist,
    lastTimeMs: safeTime,
    minDist,
    lastInwardTimeMs,
    hasInwardMove,
    samples: nextSamples,
  };
}

export function shouldTriggerQuickPinchFit(
  tracker: QuickPinchTracker | null | undefined,
  endTimeMs: number,
  config: QuickPinchConfig = DEFAULT_QUICK_PINCH_CONFIG,
): boolean {
  if (!tracker || !tracker.hasInwardMove) return false;

  const safeEnd = Math.max(tracker.lastTimeMs, endTimeMs);
  const totalDurationMs = safeEnd - tracker.startTimeMs;
  if (totalDurationMs <= 0) return false;

  // Reject if the user spread their fingers back out after the tightest point
  const reboundPx = tracker.lastDist - tracker.minDist;
  if (reboundPx > config.maxReboundPx) return false;

  const trailingPauseMs = safeEnd - tracker.lastInwardTimeMs;

  // Path 1: Standard crisp quick pinch from touchstart to release
  if (totalDurationMs <= config.maxQuickDurationMs) {
    if (trailingPauseMs > config.maxQuickTrailingPauseMs) return false;
    const shrinkPx = tracker.startDist - tracker.lastDist;
    const distRatio = tracker.lastDist / tracker.startDist;
    const activeDurationMs = Math.max(1, tracker.lastInwardTimeMs - tracker.startTimeMs);
    const velocity = shrinkPx / activeDurationMs;

    if (
      shrinkPx >= config.minQuickShrinkPx &&
      distRatio <= config.maxQuickDistRatio &&
      velocity >= config.minQuickVelocityPxPerMs
    ) {
      return true;
    }
  }

  // Path 2: Snappy inward flick at the end of a longer 2-finger gesture
  if (trailingPauseMs > config.maxFlickTrailingPauseMs) return false;

  const windowStartCutoff = safeEnd - config.recentWindowMs;
  let windowAnchor = tracker.samples[0];
  for (let i = 0; i < tracker.samples.length; i++) {
    if (tracker.samples[i].timeMs >= windowStartCutoff) {
      windowAnchor = tracker.samples[i];
      break;
    }
  }
  if (!windowAnchor) return false;

  const recentShrinkPx = windowAnchor.dist - tracker.lastDist;
  const recentRatio = tracker.lastDist / windowAnchor.dist;
  const recentActiveMs = Math.max(1, tracker.lastInwardTimeMs - windowAnchor.timeMs);
  const recentVelocity = recentShrinkPx / recentActiveMs;

  return (
    recentShrinkPx >= config.minFlickShrinkPx &&
    recentRatio <= config.maxFlickDistRatio &&
    recentVelocity >= config.minFlickVelocityPxPerMs
  );
}

/** Crisp cubic ease-out matching Procreate's snap-to-fit feel. */
export function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const inv = 1 - clamped;
  return 1 - inv * inv * inv;
}

/**
 * Interpolates a stage transform from `from` toward centered 100% fit (`zoom=1, panX=0, panY=0`).
 */
export function interpolateStageReset(from: StageTransform, progress: number): StageTransform {
  if (progress >= 1) return { zoom: 1, panX: 0, panY: 0 };
  if (progress <= 0) return { zoom: from.zoom, panX: from.panX, panY: from.panY };
  const eased = easeOutCubic(progress);
  return {
    zoom: from.zoom + (1 - from.zoom) * eased,
    panX: from.panX + (0 - from.panX) * eased,
    panY: from.panY + (0 - from.panY) * eased,
  };
}
