/**
 * Inline Horizontal Numbered Sub-Step Strips & Radial Symmetric Pattern-Completion Compression.
 *
 * Inspired by official 2025 LEGO manuals (e.g. 31172 p. 35, 47, 71, 85):
 *   - Compact 2–4 step subassemblies can share one consolidated top-left PLI and render
 *     numbered sub-steps `1  2  3  4` horizontally across a single step slot.
 *   - Rotationally symmetric placements (e.g. 4 identical curved tiles/wedges forming a ring)
 *     compress cleanly into 3 visual stages: `1` (first piece with arrows) → `2` (seated + hub)
 *     → `3` (completed symmetric ring with starburst).
 *
 * Pure geometric algorithms with zero model-specific heuristics.
 */

export interface StripPartLike {
  id: string;
  partId: string;
  colorId: number;
  center: [number, number, number];
}

export interface SubstepStripInput {
  stepId: string;
  parts: StripPartLike[];
}

export interface SubstepStripPlan {
  /** Numbered sub-steps (`1..N`) laid out horizontally. */
  substeps: Array<{
    subNum: number;
    stepId: string;
    partIds: string[];
  }>;
  /** Consolidated part counts across all substeps for a single shared PLI. */
  consolidatedPli: Array<{
    partId: string;
    colorId: number;
    qty: number;
  }>;
  /** True when the final substep completes a radial symmetric pattern (warrants a starburst). */
  radialCompletion: boolean;
}

export interface RadialPatternMatch {
  partId: string;
  colorId: number;
  count: number;
  /** World-space XZ centroid of the symmetric ring. */
  ringCenter: [number, number, number];
  /** Mean radius from `ringCenter` in LDU. */
  ringRadius: number;
  /** Part IDs belonging to the symmetric ring. */
  ringPartIds: string[];
}

/**
 * Detects whether a step's parts contain a rotationally symmetric ring of `>= 3`
 * identical `(partId, colorId)` pieces arranged equidistantly around a common Y-axis center
 * at the same elevation (e.g. 4 curved tiles/wedges/petals around a hub, like 31172 p. 71).
 */
export function detectRadialSymmetricCompletion(
  parts: ReadonlyArray<StripPartLike>,
): RadialPatternMatch | null {
  if (parts.length < 3) return null;

  // Group by (partId, colorId)
  const groups = new Map<string, StripPartLike[]>();
  for (const p of parts) {
    const k = `${p.partId}:${p.colorId}`;
    const list = groups.get(k);
    if (list) list.push(p);
    else groups.set(k, [p]);
  }

  for (const group of groups.values()) {
    if (group.length < 3 || group.length > 12) continue;

    // All pieces must sit on roughly the same horizontal plane (Y within 6 LDU)
    const meanY = group.reduce((s, p) => s + p.center[1], 0) / group.length;
    if (group.some((p) => Math.abs(p.center[1] - meanY) > 6)) continue;

    const cx = group.reduce((s, p) => s + p.center[0], 0) / group.length;
    const cz = group.reduce((s, p) => s + p.center[2], 0) / group.length;
    const radii = group.map((p) => Math.hypot(p.center[0] - cx, p.center[2] - cz));
    const meanR = radii.reduce((s, r) => s + r, 0) / radii.length;
    if (meanR < 10) continue;

    // Equidistant from center (within 15% tolerance)
    if (radii.some((r) => Math.abs(r - meanR) > Math.max(4, meanR * 0.15))) continue;

    // Check angular spacing uniformity around the circle
    const angles = group
      .map((p) => Math.atan2(p.center[2] - cz, p.center[0] - cx))
      .sort((a, b) => a - b);
    const expectedStep = (Math.PI * 2) / group.length;
    let uniform = true;
    for (let i = 0; i < angles.length; i++) {
      const next = i + 1 < angles.length ? angles[i + 1] : angles[0] + Math.PI * 2;
      const diff = next - angles[i];
      if (Math.abs(diff - expectedStep) > expectedStep * 0.25) {
        uniform = false;
        break;
      }
    }
    if (!uniform) continue;

    return {
      partId: group[0].partId,
      colorId: group[0].colorId,
      count: group.length,
      ringCenter: [cx, meanY, cz],
      ringRadius: meanR,
      ringPartIds: group.map((p) => p.id),
    };
  }

  return null;
}

/**
 * Plans an inline horizontal numbered sub-step strip (`1  2  3  4`) sharing a single
 * consolidated top-left PLI when a subassembly has 2–4 compact steps (`<= 16` total parts).
 */
export function planInlineSubstepStrip(
  steps: ReadonlyArray<SubstepStripInput>,
): SubstepStripPlan | null {
  if (steps.length < 2 || steps.length > 4) return null;
  const totalParts = steps.reduce((s, st) => s + st.parts.length, 0);
  if (totalParts === 0 || totalParts > 18) return null;

  const pliMap = new Map<string, { partId: string; colorId: number; qty: number }>();
  let radialCompletion = false;

  const substeps = steps.map((st, idx) => {
    if (idx === steps.length - 1 && detectRadialSymmetricCompletion(st.parts)) {
      radialCompletion = true;
    }
    for (const p of st.parts) {
      const k = `${p.partId}:${p.colorId}`;
      const cur = pliMap.get(k);
      if (cur) cur.qty += 1;
      else pliMap.set(k, { partId: p.partId, colorId: p.colorId, qty: 1 });
    }
    return {
      subNum: idx + 1,
      stepId: st.stepId,
      partIds: st.parts.map((p) => p.id),
    };
  });

  return {
    substeps,
    consolidatedPli: Array.from(pliMap.values()),
    radialCompletion,
  };
}
