/**
 * LEGO-authentic Automatic Placement Arrows & Offsets Engine.
 *
 * Official LEGO instructions do not outline/highlight every newly added piece.
 * Instead, they offset newly added pieces along their physical insertion axis
 * with crisp red placement arrow(s) whenever:
 *   1. It is the first step of a build sequence (with 2+ parts), showing how
 *      the initial parts connect together onto the base piece.
 *   2. On subsequent steps, an added piece could be hard to notice because it
 *      is laterally inserted (sideways pin/axle/beam/SNOT), partially occluded
 *      from the step's camera angle, camouflaged against a same/similar-color
 *      touching neighbor, or small relative to the existing assembly.
 *
 * All rules are purely physical/geometric/perceptual with zero model-specific
 * heuristics.
 */

export interface PlacementAABB {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
}

export interface AutoPartOffset {
  x: number;
  y: number;
  z: number;
  tilt: number;
  arrow: boolean;
  /** Optional world-space landing point along the insertion axis (e.g. tip of a coaxial axle) so the arrowhead never clips inside an obstacle. */
  arrowTo?: [number, number, number];
  /** Optional contact-overlap box (matching the lifted part's thickness along the offset axis, clipped perpendicularly to the actual attaching stud/contact overlap). */
  arrowBox?: PlacementAABB;
  /** Optional through-hole alignment guide endpoint extending cleanly through the destination hole/beam. */
  throughGuideTo?: [number, number, number];
  /** Optional perceptual contrast-adapted arrow hex color (e.g. green on red bricks). */
  arrowColorOverride?: string;
}

export interface PlacementPartInput {
  id: string;
  box: PlacementAABB;
  rgb: [number, number, number];
  sku?: string;
}

export interface PlacementStepInput {
  id: string;
  parts: PlacementPartInput[];
  camera: {
    az: number;
    el: number;
    side?: 'top' | 'bottom';
  };
  /** True for standalone minifigures, pose steps, section-attach steps, or steps with explicit structural offsets. */
  skip?: boolean;
}

export interface PlacementArrowSegment {
  from: [number, number, number];
  to: [number, number, number];
  /** True for a thin pass-through alignment guide line (no cone arrowhead, e.g. pin/beam through-hole guide). */
  isGuideLine?: boolean;
  /** Optional contrast-adapted hex color override for this segment. */
  color?: string;
}

export const DEFAULT_ARROW_COLOR = '#dc2626';
export const CONTRAST_ARROW_GREEN = '#16a34a';
export const CONTRAST_ARROW_BLUE = '#2563eb';

const CONTACT_EPS = 6;
const COLOR_NEIGHBOR_EPS = 10;
const SAME_COLOR_DIST_THRESHOLD = 42;
const ARROW_CONTRAST_DIST_THRESHOLD = 75;
const MAX_FIRST_STEP_OFFSETS = 6;
const MAX_SUBSEQUENT_STEP_OFFSETS = 4;

type Vec3 = [number, number, number];

function boxSize(b: PlacementAABB): Vec3 {
  return [
    Math.max(0.5, b.max[0] - b.min[0]),
    Math.max(0.5, b.max[1] - b.min[1]),
    Math.max(0.5, b.max[2] - b.min[2]),
  ];
}

function boxVolume(b: PlacementAABB): number {
  const s = boxSize(b);
  return s[0] * s[1] * s[2];
}

function boxDiag(b: PlacementAABB): number {
  const s = boxSize(b);
  return Math.hypot(s[0], s[1], s[2]);
}

function shiftBox(b: PlacementAABB, dx: number, dy: number, dz: number): PlacementAABB {
  return {
    min: [b.min[0] + dx, b.min[1] + dy, b.min[2] + dz],
    max: [b.max[0] + dx, b.max[1] + dy, b.max[2] + dz],
    center: [b.center[0] + dx, b.center[1] + dy, b.center[2] + dz],
  };
}

function expandBounds(acc: PlacementAABB | null, b: PlacementAABB): PlacementAABB {
  if (!acc) {
    return {
      min: [b.min[0], b.min[1], b.min[2]],
      max: [b.max[0], b.max[1], b.max[2]],
      center: [b.center[0], b.center[1], b.center[2]],
    };
  }
  const min: Vec3 = [
    Math.min(acc.min[0], b.min[0]),
    Math.min(acc.min[1], b.min[1]),
    Math.min(acc.min[2], b.min[2]),
  ];
  const max: Vec3 = [
    Math.max(acc.max[0], b.max[0]),
    Math.max(acc.max[1], b.max[1]),
    Math.max(acc.max[2], b.max[2]),
  ];
  return {
    min,
    max,
    center: [(min[0] + max[0]) * 0.5, (min[1] + max[1]) * 0.5, (min[2] + max[2]) * 0.5],
  };
}

function overlap1D(aMin: number, aMax: number, bMin: number, bMax: number): number {
  return Math.min(aMax, bMax) - Math.max(aMin, bMin);
}

function boxesIntersectStrict(a: PlacementAABB, b: PlacementAABB, margin = 1.5): boolean {
  return (
    a.min[0] < b.max[0] - margin &&
    a.max[0] > b.min[0] + margin &&
    a.min[1] < b.max[1] - margin &&
    a.max[1] > b.min[1] + margin &&
    a.min[2] < b.max[2] - margin &&
    a.max[2] > b.min[2] + margin
  );
}

function boxesWithinMargin(a: PlacementAABB, b: PlacementAABB, margin: number): boolean {
  return (
    a.min[0] <= b.max[0] + margin &&
    a.max[0] >= b.min[0] - margin &&
    a.min[1] <= b.max[1] + margin &&
    a.max[1] >= b.min[1] - margin &&
    a.min[2] <= b.max[2] + margin &&
    a.max[2] >= b.min[2] - margin
  );
}

/**
 * Redmean perceptual RGB distance (0..~765, normalized to 0..255 scale).
 * Same LEGO color = 0; very close shades (e.g. LBG vs Light Gray) ~20–35;
 * contrasting colors (tan vs light blue, red vs gray) > 85.
 */
export function perceptualRgbDistance(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  const rMean = (a[0] + b[0]) * 0.5;
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  const weighted =
    (2 + rMean / 256) * dr * dr +
    4 * dg * dg +
    (2 + (255 - rMean) / 256) * db * db;
  return Math.sqrt(weighted / 9);
}

/** Orthographic ray-AABB intersection distance t > 0 (returns null if no hit). */
function rayIntersectsBox(origin: Vec3, dir: Vec3, box: PlacementAABB, eps = 0.5): number | null {
  let tMin = -Infinity;
  let tMax = Infinity;
  for (let k = 0; k < 3; k++) {
    const o = origin[k];
    const d = dir[k];
    const bMin = box.min[k] + eps;
    const bMax = box.max[k] - eps;
    if (bMin >= bMax) return null;
    if (Math.abs(d) < 1e-7) {
      if (o < bMin || o > bMax) return null;
    } else {
      let t1 = (bMin - o) / d;
      let t2 = (bMax - o) / d;
      if (t1 > t2) {
        const tmp = t1;
        t1 = t2;
        t2 = tmp;
      }
      if (t1 > tMin) tMin = t1;
      if (t2 < tMax) tMax = t2;
      if (tMin > tMax) return null;
    }
  }
  return tMax > 2 ? (tMin > 2 ? tMin : tMax) : null;
}

/**
 * Estimates what fraction of `box` is occluded by `occluders` along the
 * orthographic camera view ray `(az, el)` (0 = fully clear, 1 = fully hidden).
 */
function estimateCameraOcclusion(
  box: PlacementAABB,
  occluders: ReadonlyArray<PlacementPartInput>,
  azDeg: number,
  elDeg: number,
): number {
  if (occluders.length === 0) return 0;
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  const viewDir: Vec3 = [
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    Math.cos(az) * Math.cos(el),
  ];

  // Sample center + 6 inset face-centers (7 rays total — fast and accurate)
  const s = boxSize(box);
  const c = box.center;
  const ix = Math.min(s[0] * 0.32, Math.max(0.5, s[0] * 0.5 - 2));
  const iy = Math.min(s[1] * 0.32, Math.max(0.5, s[1] * 0.5 - 1.5));
  const iz = Math.min(s[2] * 0.32, Math.max(0.5, s[2] * 0.5 - 2));
  const samples: Vec3[] = [
    c,
    [c[0] + ix, c[1], c[2]],
    [c[0] - ix, c[1], c[2]],
    [c[0], c[1] + iy, c[2]],
    [c[0], c[1] - iy, c[2]],
    [c[0], c[1], c[2] + iz],
    [c[0], c[1], c[2] - iz],
  ];

  let hits = 0;
  for (const pt of samples) {
    let blocked = false;
    for (let i = 0; i < occluders.length; i++) {
      if (rayIntersectsBox(pt, viewDir, occluders[i].box) !== null) {
        blocked = true;
        break;
      }
    }
    if (blocked) hits++;
  }
  return hits / samples.length;
}

interface ContactSummary {
  supportedFromBelow: boolean;
  supportedFromAbove: boolean;
  /** True when the piece passes vertically through a hole or sleeves coaxially around a vertical rod/axle. */
  verticalCoaxial: boolean;
  lateralCount: number;
  /** Outward lateral normal from contacting reference parts toward this part. */
  lateralNormal: Vec3 | null;
  touchingRefs: PlacementPartInput[];
}

function analyzeContacts(
  part: PlacementPartInput,
  refs: ReadonlyArray<PlacementPartInput>,
): ContactSummary {
  const b = part.box;
  const s = boxSize(b);
  let supportedFromBelow = false;
  let supportedFromAbove = false;
  let verticalCoaxial = false;
  let lateralCount = 0;
  let latX = 0;
  let latZ = 0;
  const touchingRefs: PlacementPartInput[] = [];

  for (let i = 0; i < refs.length; i++) {
    const ref = refs[i];
    if (ref.id === part.id) continue;
    const rb = ref.box;
    if (!boxesWithinMargin(b, rb, COLOR_NEIGHBOR_EPS)) continue;
    touchingRefs.push(ref);

    const rs = boxSize(rb);
    const ovX = overlap1D(b.min[0], b.max[0], rb.min[0], rb.max[0]);
    const ovY = overlap1D(b.min[1], b.max[1], rb.min[1], rb.max[1]);
    const ovZ = overlap1D(b.min[2], b.max[2], rb.min[2], rb.max[2]);

    // Resting on top of ref
    if (ovX > 2 && ovZ > 2 && b.min[1] >= rb.max[1] - CONTACT_EPS && b.min[1] <= rb.max[1] + CONTACT_EPS) {
      supportedFromBelow = true;
    }
    // Attached underneath ref
    if (ovX > 2 && ovZ > 2 && rb.min[1] >= b.max[1] - CONTACT_EPS && rb.min[1] <= b.max[1] + CONTACT_EPS) {
      supportedFromAbove = true;
    }

    // Coaxial / through-hole penetration (overlapping in all 3 axes):
    // Distinguish vertical through-hole/sleeve insertions (±Y) from horizontal pin/axle insertions (±X/±Z).
    const nestedXZ = ovX > 1.5 && ovZ > 1.5;
    if (ovY > 3 && nestedXZ) {
      const partVertElongated = s[1] >= Math.max(s[0], s[2]) * 1.1;
      const partProtrudesVert = b.max[1] > rb.max[1] + 2 || b.min[1] < rb.min[1] - 2;
      const refHorizWider = Math.max(rs[0], rs[2]) >= Math.max(s[0], s[2]) * 1.3;
      const refVertRod = rs[1] >= Math.max(rs[0], rs[2]) * 1.25 && (rb.max[1] > b.max[1] + 2 || rb.min[1] < b.min[1] - 2);
      if ((partVertElongated && (partProtrudesVert || refHorizWider)) || (partProtrudesVert && refHorizWider) || refVertRod) {
        verticalCoaxial = true;
        continue;
      }
    }

    // Lateral contact (shared Y band, touching or nested on ±X or ±Z)
    if (ovY > 3) {
      const touchPosX = ovZ > 2 && Math.abs(b.min[0] - rb.max[0]) <= CONTACT_EPS;
      const touchNegX = ovZ > 2 && Math.abs(rb.min[0] - b.max[0]) <= CONTACT_EPS;
      const touchPosZ = ovX > 2 && Math.abs(b.min[2] - rb.max[2]) <= CONTACT_EPS;
      const touchNegZ = ovX > 2 && Math.abs(rb.min[2] - b.max[2]) <= CONTACT_EPS;
      if (touchPosX || touchNegX || touchPosZ || touchNegZ || nestedXZ) {
        lateralCount++;
        if (touchPosX) latX += 1;
        else if (touchNegX) latX -= 1;
        else if (touchPosZ) latZ += 1;
        else if (touchNegZ) latZ -= 1;
        else {
          // Embedded horizontal pin/axle inside a side hole: normalize by ref half-extent
          const rbHalfX = Math.max(1, (rb.max[0] - rb.min[0]) * 0.5);
          const rbHalfZ = Math.max(1, (rb.max[2] - rb.min[2]) * 0.5);
          const nx = (b.center[0] - rb.center[0]) / rbHalfX;
          const nz = (b.center[2] - rb.center[2]) / rbHalfZ;
          if (Math.abs(nx) >= Math.abs(nz)) {
            latX += nx >= 0 ? 1 : -1;
          } else {
            latZ += nz >= 0 ? 1 : -1;
          }
        }
      }
    }
  }

  let lateralNormal: Vec3 | null = null;
  if (lateralCount > 0 && (Math.abs(latX) > 0 || Math.abs(latZ) > 0)) {
    if (Math.abs(latX) >= Math.abs(latZ)) {
      lateralNormal = [latX >= 0 ? 1 : -1, 0, 0];
    } else {
      lateralNormal = [0, 0, latZ >= 0 ? 1 : -1];
    }
  }

  return {
    supportedFromBelow,
    supportedFromAbove,
    verticalCoaxial,
    lateralCount,
    lateralNormal,
    touchingRefs,
  };
}

const MIN_CORRIDOR_ARROW_GAP = 16;

/**
 * Computes the perpendicular overlap box between `partBox` and its contacting
 * supporting refs along `axis` (e.g. the exact XZ stud-overlap strip when one
 * plate overhangs another). Returns `null` if the part is fully supported with
 * no meaningful overhang shift.
 */
function computeContactArrowBox(
  partBox: PlacementAABB,
  touchingRefs: ReadonlyArray<PlacementPartInput>,
  axis: number,
  sign: number,
): PlacementAABB | null {
  if (touchingRefs.length === 0) return null;
  const perpA = (axis + 1) % 3;
  const perpB = (axis + 2) % 3;

  let minA = Infinity;
  let maxA = -Infinity;
  let minB = Infinity;
  let maxB = -Infinity;
  let found = false;

  for (let i = 0; i < touchingRefs.length; i++) {
    const rb = touchingRefs[i].box;
    // Check that ref is actually on the target/contacting side along `axis`
    const touchesAlong =
      sign > 0
        ? Math.abs(partBox.min[axis] - rb.max[axis]) <= CONTACT_EPS ||
          (rb.max[axis] > partBox.min[axis] - CONTACT_EPS && rb.min[axis] < partBox.max[axis] + CONTACT_EPS)
        : Math.abs(rb.min[axis] - partBox.max[axis]) <= CONTACT_EPS ||
          (rb.min[axis] < partBox.max[axis] + CONTACT_EPS && rb.max[axis] > partBox.min[axis] - CONTACT_EPS);
    if (!touchesAlong) continue;

    const loA = Math.max(partBox.min[perpA], rb.min[perpA]);
    const hiA = Math.min(partBox.max[perpA], rb.max[perpA]);
    const loB = Math.max(partBox.min[perpB], rb.min[perpB]);
    const hiB = Math.min(partBox.max[perpB], rb.max[perpB]);
    if (hiA - loA < 4 || hiB - loB < 4) continue;

    if (loA < minA) minA = loA;
    if (hiA > maxA) maxA = hiA;
    if (loB < minB) minB = loB;
    if (hiB > maxB) maxB = hiB;
    found = true;
  }

  if (!found) return null;

  const spanA = partBox.max[perpA] - partBox.min[perpA];
  const spanB = partBox.max[perpB] - partBox.min[perpB];
  const ovSpanA = maxA - minA;
  const ovSpanB = maxB - minB;
  // Only return a clipped contact box when there is an actual overhang (>= 6 LDU narrower on at least one axis)
  if (spanA - ovSpanA < 6 && spanB - ovSpanB < 6) return null;

  const mn: Vec3 = [partBox.min[0], partBox.min[1], partBox.min[2]];
  const mx: Vec3 = [partBox.max[0], partBox.max[1], partBox.max[2]];
  mn[perpA] = minA;
  mx[perpA] = maxA;
  mn[perpB] = minB;
  mx[perpB] = maxB;
  return {
    min: mn,
    max: mx,
    center: [(mn[0] + mx[0]) * 0.5, (mn[1] + mx[1]) * 0.5, (mn[2] + mx[2]) * 0.5],
  };
}

/**
 * Exact 2D horizontal ray-exit distance from `anchorXZ` toward the orthographic
 * camera (`azDeg`) to exit `box`'s XZ footprint. Used to guarantee a lifted
 * overhanging plate clears the camera's sightline to the attaching studs and arrows.
 */
function computeHorizontalFrontOverhangDist(
  box: PlacementAABB,
  anchor: Vec3,
  azDeg: number,
): number {
  const az = (azDeg * Math.PI) / 180;
  const vx = Math.sin(az);
  const vz = Math.cos(az);
  let tExit = Infinity;
  if (Math.abs(vx) > 1e-5) {
    const tx = vx > 0 ? (box.max[0] - anchor[0]) / vx : (box.min[0] - anchor[0]) / vx;
    if (tx >= 0 && tx < tExit) tExit = tx;
  }
  if (Math.abs(vz) > 1e-5) {
    const tz = vz > 0 ? (box.max[2] - anchor[2]) / vz : (box.min[2] - anchor[2]) / vz;
    if (tz >= 0 && tz < tExit) tExit = tz;
  }
  return Number.isFinite(tExit) ? Math.max(0, tExit) : 0;
}

/**
 * Picks a clean, collision-free offset vector along the physical insertion axis.
 * - Guarantees a crisp open air gap past any coaxial obstacle tip (`arrowTo`).
 * - Anchors arrows directly over the actual contact/stud overlap (`arrowBox`).
 * - For vertical lifts, accounts for orthographic camera elevation so a wide
 *   overhanging plate never blocks the camera's view of its arrows or attaching studs.
 */
function resolveOffsetAlongAxis(
  part: PlacementPartInput,
  preferredDir: Vec3,
  fallbackDirs: ReadonlyArray<Vec3>,
  obstacles: ReadonlyArray<PlacementPartInput>,
  camera?: { az: number; el: number },
  touchingRefs: ReadonlyArray<PlacementPartInput> = [],
): AutoPartOffset {
  const s = boxSize(part.box);
  const dirs: Vec3[] = [preferredDir, ...fallbackDirs];

  const computeBaseMag = (d: Vec3, arrowAnchor: Vec3): number => {
    const dimAlong = Math.abs(d[0]) * s[0] + Math.abs(d[1]) * s[1] + Math.abs(d[2]) * s[2];
    // Target ~20 LDU crisp visible arrow gap between lifted piece and seated destination
    let mag = Math.max(26, Math.min(48, dimAlong + 20));
    // For vertical lifts, ensure the lifted piece's front-bottom edge clears the camera's
    // sightline to the attaching studs & red arrows (exact orthographic optics).
    if (camera && Math.abs(d[1]) >= 0.5) {
      const absEl = Math.min(58, Math.max(8, Math.abs(camera.el)));
      const tFront = computeHorizontalFrontOverhangDist(part.box, arrowAnchor, camera.az);
      const sightlineLift = Math.ceil(tFront * Math.tan((absEl * Math.PI) / 180) + 20);
      mag = Math.max(mag, Math.min(68, sightlineLift));
    }
    return Math.round(mag);
  };

  for (const dir of dirs) {
    const axis = Math.abs(dir[0]) >= 0.5 ? 0 : (Math.abs(dir[1]) >= 0.5 ? 1 : 2);
    const sign = dir[axis] >= 0 ? 1 : -1;
    const perpA = (axis + 1) % 3;
    const perpB = (axis + 2) % 3;

    const arrowBox = computeContactArrowBox(part.box, touchingRefs, axis, sign);
    const arrowAnchor = arrowBox ? arrowBox.center : part.box.center;

    // Find any coaxial / corridor obstacle directly along the insertion path (e.g., vertical axle inside a bush)
    let corridorObsTip: number | null = null;
    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (obs.id === part.id) continue;
      const ob = obs.box;
      const ovA = overlap1D(part.box.min[perpA], part.box.max[perpA], ob.min[perpA], ob.max[perpA]);
      const ovB = overlap1D(part.box.min[perpB], part.box.max[perpB], ob.min[perpB], ob.max[perpB]);
      if (ovA <= 1.5 || ovB <= 1.5) continue;
      // Check if obstacle overlaps part along the insertion axis or protrudes past part's center in `dir`
      if (sign > 0) {
        if (ob.max[axis] > part.box.min[axis] + 1 && ob.min[axis] < part.box.max[axis] + 24) {
          if (corridorObsTip === null || ob.max[axis] > corridorObsTip) corridorObsTip = ob.max[axis];
        }
      } else {
        if (ob.min[axis] < part.box.max[axis] - 1 && ob.max[axis] > part.box.min[axis] - 24) {
          if (corridorObsTip === null || ob.min[axis] < corridorObsTip) corridorObsTip = ob.min[axis];
        }
      }
    }

    const baseMag = computeBaseMag(dir, arrowAnchor);
    for (let extra = 0; extra <= 96; extra += 8) {
      const mag = baseMag + extra;
      const dx = Math.round(dir[0] * mag);
      const dy = Math.round(dir[1] * mag);
      const dz = Math.round(dir[2] * mag);
      const shifted = shiftBox(part.box, dx, dy, dz);

      // Ensure crisp open air gap past any coaxial obstacle tip (e.g., bush lifted above axle tip)
      if (corridorObsTip !== null) {
        const nearFace = sign > 0 ? shifted.min[axis] : shifted.max[axis];
        const gapToTip = sign > 0 ? nearFace - corridorObsTip : corridorObsTip - nearFace;
        if (gapToTip < MIN_CORRIDOR_ARROW_GAP) continue;
      }

      let collides = false;
      for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].id === part.id) continue;
        if (boxesIntersectStrict(shifted, obstacles[i].box, 1.5)) {
          collides = true;
          break;
        }
      }
      if (!collides) {
        const res: AutoPartOffset = { x: dx, y: dy, z: dz, tilt: 0, arrow: true };
        if (arrowBox) res.arrowBox = arrowBox;
        // If a coaxial obstacle extends beyond the seated center, stop the arrowhead cleanly at its entry tip
        if (corridorObsTip !== null) {
          const pastCenter = sign > 0
            ? corridorObsTip - part.box.center[axis]
            : part.box.center[axis] - corridorObsTip;
          if (pastCenter > 2) {
            const arrowTo: Vec3 = [arrowAnchor[0], arrowAnchor[1], arrowAnchor[2]];
            arrowTo[axis] = corridorObsTip + sign * 2;
            res.arrowTo = arrowTo;
          }
        }
        return res;
      }
    }
  }

  const mag = computeBaseMag(preferredDir, part.box.center);
  return {
    x: Math.round(preferredDir[0] * mag),
    y: Math.round(preferredDir[1] * mag),
    z: Math.round(preferredDir[2] * mag),
    tilt: 0,
    arrow: true,
  };
}

function chooseInsertionDirs(
  contacts: ContactSummary,
  cameraSide: 'top' | 'bottom',
  isLateralPrimary: boolean,
): { preferred: Vec3; fallbacks: Vec3[] } {
  const verticalDefault: Vec3 = cameraSide === 'bottom' ? [0, -1, 0] : [0, 1, 0];
  const verticalOpposite: Vec3 = cameraSide === 'bottom' ? [0, 1, 0] : [0, -1, 0];

  if (contacts.verticalCoaxial) {
    return {
      preferred: verticalDefault,
      fallbacks: [verticalOpposite],
    };
  }
  if (isLateralPrimary && contacts.lateralNormal) {
    const lat = contacts.lateralNormal;
    return {
      preferred: lat,
      fallbacks: [verticalDefault, [-lat[0], 0, -lat[2]], verticalOpposite],
    };
  }
  if (contacts.supportedFromAbove && !contacts.supportedFromBelow) {
    return {
      preferred: [0, -1, 0],
      fallbacks: contacts.lateralNormal ? [contacts.lateralNormal, [0, 1, 0]] : [[0, 1, 0]],
    };
  }
  if (contacts.supportedFromBelow) {
    return {
      preferred: verticalDefault,
      fallbacks: contacts.lateralNormal ? [contacts.lateralNormal, verticalOpposite] : [verticalOpposite],
    };
  }
  if (contacts.lateralNormal) {
    return {
      preferred: contacts.lateralNormal,
      fallbacks: [verticalDefault, verticalOpposite],
    };
  }
  return {
    preferred: verticalDefault,
    fallbacks: [verticalOpposite],
  };
}

/**
 * Computes Step 1 offsets: keeps the physical base piece(s) grounded and
 * offsets the attached piece(s) along their insertion axes with red arrows.
 */
function computeFirstStepOffsets(
  step: PlacementStepInput,
): Record<string, AutoPartOffset> {
  const parts = step.parts;
  if (parts.length < 2) return {};

  const cameraSide = step.camera.side === 'bottom' ? 'bottom' : 'top';
  const isBottomView = cameraSide === 'bottom';

  // Identify which parts physically support another Step-1 part along the build axis
  // (from below when upright; from above when building upside-down)
  const supportCount = new Map<string, number>();
  const supportedByAnother = new Set<string>();
  for (let i = 0; i < parts.length; i++) {
    const a = parts[i];
    for (let j = 0; j < parts.length; j++) {
      if (i === j) continue;
      const b = parts[j];
      const ovX = overlap1D(a.box.min[0], a.box.max[0], b.box.min[0], b.box.max[0]);
      const ovZ = overlap1D(a.box.min[2], a.box.max[2], b.box.min[2], b.box.max[2]);
      const aSupportsB = isBottomView
        ? (ovX > 2 && ovZ > 2 && a.box.min[1] >= b.box.max[1] - CONTACT_EPS && a.box.min[1] <= b.box.max[1] + CONTACT_EPS)
        : (ovX > 2 && ovZ > 2 && b.box.min[1] >= a.box.max[1] - CONTACT_EPS && b.box.min[1] <= a.box.max[1] + CONTACT_EPS);
      if (aSupportsB) {
        supportCount.set(a.id, (supportCount.get(a.id) || 0) + 1);
        supportedByAnother.add(b.id);
      }
    }
  }

  let basePlaneY = isBottomView ? -Infinity : Infinity;
  for (const p of parts) {
    if (isBottomView) {
      if (p.box.max[1] > basePlaneY) basePlaneY = p.box.max[1];
    } else {
      if (p.box.min[1] < basePlaneY) basePlaneY = p.box.min[1];
    }
  }

  // Score each part for being the primary grounded base piece:
  // supporting other parts > central hub touching multiple Step-1 parts > largest volume > on base plane
  const baseScores = parts.map((p) => {
    const vol = boxVolume(p.box);
    const sup = supportCount.get(p.id) || 0;
    let touchCount = 0;
    for (const other of parts) {
      if (other.id !== p.id && boxesWithinMargin(p.box, other.box, CONTACT_EPS)) touchCount++;
    }
    const onGround = isBottomView
      ? (Math.abs(p.box.max[1] - basePlaneY) <= CONTACT_EPS ? 1 : 0)
      : (Math.abs(p.box.min[1] - basePlaneY) <= CONTACT_EPS ? 1 : 0);
    const isSupported = supportedByAnother.has(p.id) ? 1 : 0;
    return {
      part: p,
      score:
        sup * 1_000_000 +
        (1 - isSupported) * 200_000 +
        touchCount * 120_000 +
        onGround * 20_000 +
        vol,
    };
  });
  baseScores.sort((a, b) => b.score - a.score);

  const primaryBase = baseScores[0].part;
  const baseSet = new Set<string>([primaryBase.id]);

  // If there are stacked upper pieces AND multiple ground-layer base pieces that
  // each support upper pieces, keep all supporting ground pieces grounded.
  for (const entry of baseScores.slice(1)) {
    if ((supportCount.get(entry.part.id) || 0) > 0 && !supportedByAnother.has(entry.part.id)) {
      baseSet.add(entry.part.id);
    }
  }

  const baseParts = parts.filter((p) => baseSet.has(p.id));
  const attachedParts = parts.filter((p) => !baseSet.has(p.id));
  if (attachedParts.length === 0) return {};

  // Cap on unusually large Step 1 (e.g. imported file with 12+ parts in Step 1)
  const selected =
    attachedParts.length <= MAX_FIRST_STEP_OFFSETS
      ? attachedParts
      : [...attachedParts]
          .sort((a, b) => boxVolume(a.box) - boxVolume(b.box))
          .slice(0, MAX_FIRST_STEP_OFFSETS);

  const out: Record<string, AutoPartOffset> = {};
  for (const p of selected) {
    const contacts = analyzeContacts(p, baseParts);
    const isLateral = contacts.lateralCount > 0 && !contacts.supportedFromBelow && !contacts.supportedFromAbove;
    const { preferred, fallbacks } = chooseInsertionDirs(contacts, cameraSide, isLateral);
    out[p.id] = resolveOffsetAlongAxis(p, preferred, fallbacks, baseParts, step.camera, contacts.touchingRefs);
  }
  return out;
}

interface NoticeabilityCandidate {
  part: PlacementPartInput;
  score: number;
  contacts: ContactSummary;
  isLateral: boolean;
}

/**
 * Evaluates a subsequent step (`prevParts.length > 0`) and returns offsets for
 * pieces that would be hard to notice without highlighting.
 */
function computeSubsequentStepOffsets(
  step: PlacementStepInput,
  prevParts: ReadonlyArray<PlacementPartInput>,
  builtBounds: PlacementAABB | null,
): Record<string, AutoPartOffset> {
  if (step.parts.length === 0 || prevParts.length === 0 || !builtBounds) return {};

  const cameraSide = step.camera.side === 'bottom' ? 'bottom' : 'top';
  const builtDiag = Math.max(20, boxDiag(builtBounds));
  const candidates: NoticeabilityCandidate[] = [];

  for (const part of step.parts) {
    const s = boxSize(part.box);
    const diag = boxDiag(part.box);
    const vol = boxVolume(part.box);
    const relDiag = diag / builtDiag;
    const maxHoriz = Math.max(s[0], s[2]);
    const minHoriz = Math.min(s[0], s[2]);
    const height = s[1];

    const contacts = analyzeContacts(part, prevParts);
    const isLateral =
      contacts.lateralCount > 0 &&
      !contacts.supportedFromBelow &&
      !contacts.supportedFromAbove;

    // 1. Lateral / horizontal insertion or coaxial through-hole/sleeve insertion (pins, axles, bushes, beams)
    let score = 0;
    if (isLateral || contacts.verticalCoaxial) {
      // Sideways and coaxial insertions are hard to read from an isometric view without an arrow
      score += 3.0;
    }

    // 2. Partial occlusion from the step's actual camera view
    const occlusion = estimateCameraOcclusion(part.box, prevParts, step.camera.az, step.camera.el);
    if (occlusion >= 0.18) {
      score += 2.2 + occlusion * 2.0;
    }

    // 3. Color camouflage against touching existing neighbors
    let minColorDist = Infinity;
    for (const ref of contacts.touchingRefs) {
      const d = perceptualRgbDistance(part.rgb, ref.rgb);
      if (d < minColorDist) minColorDist = d;
    }
    const isSlenderOrModest =
      minHoriz <= 22 || height <= 10 || relDiag < 0.42;
    if (
      contacts.touchingRefs.length > 0 &&
      minColorDist < SAME_COLOR_DIST_THRESHOLD &&
      isSlenderOrModest &&
      prevParts.length >= 4
    ) {
      // Blends visually into adjacent same-color brick(s)
      score += 1.8 + (1 - minColorDist / SAME_COLOR_DIST_THRESHOLD) * 0.8;
    }

    // 4. Small detail relative to the existing model
    const isSmallFootprint = maxHoriz <= 44 && vol <= 26000;
    const isTinyPiece = maxHoriz <= 24 && height <= 26 && vol <= 12000;
    if (prevParts.length >= 4 && ((isSmallFootprint && relDiag < 0.17) || (isTinyPiece && relDiag < 0.24))) {
      score += 1.6 + Math.max(0, 0.24 - relDiag) * 4.0;
    }

    if (score >= 1.5) {
      candidates.push({ part, score, contacts, isLateral });
    }
  }

  if (candidates.length === 0) return {};

  // Sort highest noticeability need first; cap to avoid clutter on large steps
  candidates.sort((a, b) => b.score - a.score);
  const chosen = candidates.slice(0, MAX_SUBSEQUENT_STEP_OFFSETS);

  const chosenIds = new Set(chosen.map((c) => c.part.id));
  const nonOffsetSiblings = step.parts.filter((p) => !chosenIds.has(p.id));
  const obstacles: PlacementPartInput[] = [...prevParts, ...nonOffsetSiblings];

  const out: Record<string, AutoPartOffset> = {};
  for (const c of chosen) {
    const { preferred, fallbacks } = chooseInsertionDirs(c.contacts, cameraSide, c.isLateral);
    out[c.part.id] = resolveOffsetAlongAxis(c.part, preferred, fallbacks, obstacles, step.camera, c.contacts.touchingRefs);
  }
  return out;
}

/**
 * Computes automatic LEGO-style placement offsets for every step in a single
 * continuous build sequence (a submodel chapter or a main/bag/join section).
 *
 * Returns a Map from `step.id` to `Record<partId, AutoPartOffset>`.
 * Steps with no auto offsets are omitted from the map.
 */
export function computeAutoPlacementOffsetsForSequence(
  steps: ReadonlyArray<PlacementStepInput>,
): Map<string, Record<string, AutoPartOffset>> {
  const result = new Map<string, Record<string, AutoPartOffset>>();
  const prevParts: PlacementPartInput[] = [];
  let builtBounds: PlacementAABB | null = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step.skip && step.parts.length > 0) {
      const offsets =
        prevParts.length === 0
          ? computeFirstStepOffsets(step)
          : computeSubsequentStepOffsets(step, prevParts, builtBounds);
      if (Object.keys(offsets).length > 0) {
        result.set(step.id, offsets);
      }
    }

    for (const p of step.parts) {
      prevParts.push(p);
      builtBounds = expandBounds(builtBounds, p.box);
    }
  }

  return result;
}

/**
 * Computes crisp, non-clipping 3D arrow segment(s) from an offset part back
 * toward its seated destination.
 *
 * - Compact pieces get 1 centered arrow.
 * - Elongated pieces (span >= 60 LDU perpendicular to the offset axis and
 *   aspect ratio >= 2.2, e.g., 1x4 plates or Technic beams) get 2 parallel
 *   arrows inset near their ends — matching official LEGO instruction manuals.
 */
export function computePlacementArrowSegments(
  box: PlacementAABB,
  offset: readonly [number, number, number],
  arrowTo?: readonly [number, number, number] | null,
  throughGuideTo?: readonly [number, number, number] | null,
): PlacementArrowSegment[] {
  const ox = offset[0];
  const oy = offset[1];
  const oz = offset[2];
  const mag = Math.hypot(ox, oy, oz);
  if (mag < 6) return [];

  const ux = ox / mag;
  const uy = oy / mag;
  const uz = oz / mag;

  const s = boxSize(box);
  const halfAlong = 0.5 * (Math.abs(ux) * s[0] + Math.abs(uy) * s[1] + Math.abs(uz) * s[2]);

  // Clear gap between near face of lifted brick and seated destination (or coaxial obstacle tip)
  const clearGap = mag - halfAlong * 1.45;
  let fromDist: number;
  let toDist: number;
  if (clearGap >= 10) {
    // Start just outside the lifted part's near face, end just above the seated center
    fromDist = mag - halfAlong - 2.0;
    toDist = Math.min(halfAlong * 0.45, 4.0);
  } else {
    // Small manual nudge fallback
    fromDist = mag;
    toDist = 0;
  }

  // If a coaxial obstacle tip (e.g. top of a vertical axle inside a bush) was provided,
  // terminate the arrowhead cleanly at that entry tip so it never clips inside the obstacle.
  if (arrowTo) {
    const proj =
      (arrowTo[0] - box.center[0]) * ux +
      (arrowTo[1] - box.center[1]) * uy +
      (arrowTo[2] - box.center[2]) * uz;
    if (proj > toDist && fromDist - proj >= 8) {
      toDist = proj;
    }
  }

  if (fromDist - toDist < 6) {
    fromDist = mag;
    toDist = 0;
  }

  // Determine perpendicular axes to check if the part is elongated (dual arrows)
  const absU = [Math.abs(ux), Math.abs(uy), Math.abs(uz)];
  let primaryAxis = 1;
  if (absU[0] >= absU[1] && absU[0] >= absU[2]) primaryAxis = 0;
  else if (absU[2] >= absU[0] && absU[2] >= absU[1]) primaryAxis = 2;

  const perpAxes = [0, 1, 2].filter((k) => k !== primaryAxis);
  const spanA = s[perpAxes[0]];
  const spanB = s[perpAxes[1]];
  const longAxis = spanA >= spanB ? perpAxes[0] : perpAxes[1];
  const longSpan = Math.max(spanA, spanB);
  const shortSpan = Math.min(spanA, spanB);

  const lateralOffsets: number[] =
    longSpan >= 60 && longSpan >= shortSpan * 2.2
      ? [-(longSpan * 0.5 - 10), longSpan * 0.5 - 10]
      : [0];

  const c = box.center;
  const segments: PlacementArrowSegment[] = lateralOffsets.map((lat) => {
    const base: Vec3 = [c[0], c[1], c[2]];
    base[longAxis] += lat;
    return {
      from: [
        base[0] + ux * fromDist,
        base[1] + uy * fromDist,
        base[2] + uz * fromDist,
      ],
      to: [
        base[0] + ux * toDist,
        base[1] + uy * toDist,
        base[2] + uz * toDist,
      ],
    };
  });

  // Optional through-hole pass-through alignment guide (e.g., beam sliding onto multiple pins or pin through beam)
  if (throughGuideTo) {
    const projGuide =
      (throughGuideTo[0] - c[0]) * ux +
      (throughGuideTo[1] - c[1]) * uy +
      (throughGuideTo[2] - c[2]) * uz;
    if (toDist - projGuide >= 6) {
      for (const lat of lateralOffsets) {
        const base: Vec3 = [c[0], c[1], c[2]];
        base[longAxis] += lat;
        segments.push({
          from: [
            base[0] + ux * toDist,
            base[1] + uy * toDist,
            base[2] + uz * toDist,
          ],
          to: [
            base[0] + ux * projGuide,
            base[1] + uy * projGuide,
            base[2] + uz * projGuide,
          ],
          isGuideLine: true,
        });
      }
    }
  }

  return segments;
}

function parseHexToRgb255(hex: string): [number, number, number] {
  const clean = (hex || DEFAULT_ARROW_COLOR).replace('#', '').trim();
  const full = clean.length === 3
    ? `${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`
    : clean.padEnd(6, '0').slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16) || 0,
    parseInt(full.slice(2, 4), 16) || 0,
    parseInt(full.slice(4, 6), 16) || 0,
  ];
}

/**
 * Perceptual contrast-adaptive placement arrow color (matching official LEGO manuals):
 * when the base arrow color (default crimson red `#dc2626`) has low perceptual contrast
 * against the moved brick or its touching destination neighbor(s) (e.g. red/orange brick),
 * automatically switches to high-contrast green (`#16a34a`), or blue (`#2563eb`) if the
 * user's base arrow color is already green.
 */
export function resolveContrastArrowColor(
  baseArrowHex: string,
  targetRgb: readonly [number, number, number],
  neighborRgbs: ReadonlyArray<readonly [number, number, number]> = [],
): string {
  const baseHex = baseArrowHex || DEFAULT_ARROW_COLOR;
  const baseRgb = parseHexToRgb255(baseHex);
  const samples: Array<readonly [number, number, number]> = [targetRgb, ...neighborRgbs];

  let minDist = Infinity;
  for (const s of samples) {
    const d = perceptualRgbDistance(baseRgb, s);
    if (d < minDist) minDist = d;
  }
  if (minDist >= ARROW_CONTRAST_DIST_THRESHOLD) return baseHex;

  // Choose whichever high-contrast fallback (green vs blue) has greater minimum distance
  const greenRgb = parseHexToRgb255(CONTRAST_ARROW_GREEN);
  const blueRgb = parseHexToRgb255(CONTRAST_ARROW_BLUE);
  let minGreen = Infinity;
  let minBlue = Infinity;
  for (const s of samples) {
    minGreen = Math.min(minGreen, perceptualRgbDistance(greenRgb, s));
    minBlue = Math.min(minBlue, perceptualRgbDistance(blueRgb, s));
  }
  // Prefer official LEGO green whenever it clears the contrast threshold (and base isn't already green)
  if (minGreen >= ARROW_CONTRAST_DIST_THRESHOLD && perceptualRgbDistance(baseRgb, greenRgb) > 45) {
    return CONTRAST_ARROW_GREEN;
  }
  return minBlue >= minGreen ? CONTRAST_ARROW_BLUE : CONTRAST_ARROW_GREEN;
}

