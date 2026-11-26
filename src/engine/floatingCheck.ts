/**
 * Ground-aware floating & detached piece classification.
 *
 * World coordinates are Y-up in LDraw Units (LDU):
 *   - 1 stud = 20 LDU
 *   - 1 plate = 8 LDU
 *   - 1 brick = 24 LDU
 *
 * A standalone piece with no physical contact to the rest of the model is only
 * considered "floating" when its bottom sits above the model's ground plane
 * beyond GROUND_TOLERANCE_LDU. Separate props resting on the ground (e.g., a
 * trash can, crate, or accessory beside a vehicle or building) are treated as
 * grounded standalone pieces rather than floating errors.
 */

export interface Box3Like {
  min: readonly [number, number, number];
  max: readonly [number, number, number];
}

/**
 * Maximum height above the model's reference ground plane (in LDU) for a
 * standalone piece to still be considered resting on the ground.
 *
 * 10 LDU (1.25 plates / 4 mm) absorbs thin baseplates (~3.2–4 LDU), flanged
 * train wheels (~4–6 LDU below tread), and up to 1 plate (8 LDU) of Studio
 * ground-grid offset while still flagging pieces floating >= 1.5 plates
 * (12 LDU) or >= 1 brick (24 LDU) in mid-air.
 */
export const GROUND_TOLERANCE_LDU = 10;

/**
 * Minimum fallback neighbor gap (in LDU) above which a non-grounded (or wheel)
 * near-miss part is flagged as a weak connection warning.
 */
export const WEAK_CONNECTION_MIN_GAP_LDU = 4.5;

export type DetachedPartStatus = 'connected' | 'grounded' | 'weak_connection' | 'floating';

export interface DetachedPartClassification {
  status: DetachedPartStatus;
  /** 0 = no diagnostic; finite > 0 = weak connection gap (LDU); Infinity = truly floating */
  detachedGap: number;
  /** Height of part bottom above the model's ground plane in LDU (0 when grounded/connected) */
  floatHeight: number;
}

/**
 * Computes the model's reference ground elevation (minimum world Y).
 *
 * Anchors to connected parts (parts with at least one neighbor) when any exist,
 * so a single stray piece accidentally dropped below the build plate cannot
 * distort the ground plane for the rest of the model. Falls back to all parts
 * when no parts are connected to each other.
 */
export function computeGroundPlaneY(
  boxes: readonly Box3Like[],
  isConnected?: (index: number) => boolean,
): number {
  if (boxes.length === 0) return 0;

  let connectedMinY = Infinity;
  let overallMinY = Infinity;

  for (let i = 0; i < boxes.length; i++) {
    const y = boxes[i].min[1];
    if (!Number.isFinite(y)) continue;
    if (y < overallMinY) overallMinY = y;
    if (isConnected && isConnected(i) && y < connectedMinY) {
      connectedMinY = y;
    }
  }

  if (Number.isFinite(connectedMinY)) return connectedMinY;
  return Number.isFinite(overallMinY) ? overallMinY : 0;
}

/**
 * Returns true if the part's bottom sits at or below the model's ground plane
 * within the allowed ground tolerance.
 */
export function isBoxGrounded(
  box: Box3Like,
  groundY: number,
  toleranceLdu: number = GROUND_TOLERANCE_LDU,
): boolean {
  const lowerBound = groundY - Math.max(toleranceLdu * 4, 40);
  return box.min[1] <= groundY + toleranceLdu && box.min[1] >= lowerBound;
}

/**
 * Height of a part's bottom above the reference ground plane in LDU (rounded to 0.1 LDU).
 */
export function computeHeightAboveGround(box: Box3Like, groundY: number): number {
  const delta = box.min[1] - groundY;
  if (!Number.isFinite(delta) || delta <= 0) return 0;
  return Math.round(delta * 10) / 10;
}

/**
 * Classifies a part that had no direct physical contact in the adjacency graph.
 */
export function classifyDetachedPart(params: {
  box: Box3Like;
  groundY: number;
  nearestGapLdu: number;
  isWheel?: boolean;
  groundToleranceLdu?: number;
  weakGapThresholdLdu?: number;
}): DetachedPartClassification {
  const {
    box,
    groundY,
    nearestGapLdu,
    isWheel = false,
    groundToleranceLdu = GROUND_TOLERANCE_LDU,
    weakGapThresholdLdu = WEAK_CONNECTION_MIN_GAP_LDU,
  } = params;

  const grounded = isBoxGrounded(box, groundY, groundToleranceLdu);
  const floatHeight = computeHeightAboveGround(box, groundY);

  if (!Number.isFinite(nearestGapLdu)) {
    if (grounded) {
      return { status: 'grounded', detachedGap: 0, floatHeight: 0 };
    }
    return { status: 'floating', detachedGap: Infinity, floatHeight };
  }

  if (nearestGapLdu > weakGapThresholdLdu) {
    if (grounded && !isWheel) {
      return { status: 'grounded', detachedGap: 0, floatHeight: 0 };
    }
    return {
      status: 'weak_connection',
      detachedGap: Math.round(nearestGapLdu * 10) / 10,
      floatHeight,
    };
  }

  return { status: 'connected', detachedGap: 0, floatHeight: 0 };
}
