import type { Mat3, Vec3 } from '../types/manual';

/**
 * BrickLink Studio part-origin corrections.
 *
 * A handful of parts in BrickLink Studio's own library use a different local origin than the
 * LDraw library file we download for the same part number (Studio's mesh was derived from LEGO
 * Digital Designer, while the LDraw author re-centered the part on its connection point).
 * Studio writes its own origin into exported `.ldr`/`.io` placement lines, so when we render the
 * part with LDraw geometry it appears shifted (e.g. a handbag hanging below the hand instead of
 * the handle sitting inside the hand's grip).
 *
 * Each entry is the position of the LDraw origin expressed in Studio's part-local LDraw frame
 * (LDraw axes: -Y is up). The corrected LDraw placement is `P' = P + R · offset`.
 *
 * Corrections are only applied to Studio-authored sources and only when the part geometry is
 * NOT embedded in the file (embedded Studio geometry already matches Studio's origin).
 */
export const STUDIO_PART_ORIGIN_OFFSETS: Record<string, Vec3> = {
  // Figure Friends Handbag with Zipper: Studio's origin sits on the base of the bag, LDraw's
  // origin is on the handle bar axis, 28.5 LDU above the base.
  '93091': [0, -28.5, 0],
};

const STUDIO_MARKER_RE =
  /^0\s+(?:FlexibleBrickControlPointUnitLength\b|NumOfBricks:|CustomBrick\b|FlexibleBrick:|PE_TEX_PATH\b|PE_TEX_INFO\b|IsSubModel\b)/im;

/** True when an LDraw/MPD source was written by BrickLink Studio (export or `.io` payload). */
export function isStudioAuthoredSource(source: string): boolean {
  return STUDIO_MARKER_RE.test(source);
}

/** Returns the Studio→LDraw origin offset for a normalized part id, if any. */
export function getStudioOriginOffset(partId: string): Vec3 | null {
  const key = partId.toLowerCase().replace(/\.dat$/i, '').replace(/^bl_/, '');
  return STUDIO_PART_ORIGIN_OFFSETS[key] ?? null;
}

/** Applies a Studio origin offset (part-local, LDraw frame) to an LDraw world placement. */
export function applyStudioOriginOffset(pos: Vec3, rot: Mat3, offset: Vec3): Vec3 {
  return [
    pos[0] + rot[0] * offset[0] + rot[1] * offset[1] + rot[2] * offset[2],
    pos[1] + rot[3] * offset[0] + rot[4] * offset[1] + rot[5] * offset[2],
    pos[2] + rot[6] * offset[0] + rot[7] * offset[1] + rot[8] * offset[2],
  ];
}
