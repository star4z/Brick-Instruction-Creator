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

import { cameraBasis } from './minifigCamera';

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

/** World-space external stud descriptor: [baseX, baseY, baseZ, dirX, dirY, dirZ] where dir is a unit outward stud normal. */
export type PlacementStud = readonly [number, number, number, number, number, number];

export interface PlacementPartInput {
  id: string;
  box: PlacementAABB;
  rgb: [number, number, number];
  sku?: string;
  /** Optional world-space unit vector pointing from the part's underside (anti-studs) toward its top face (local +Y transformed by part.m). */
  localUp?: readonly [number, number, number];
  /** Optional world-space outward studs belonging to this part (from compiled .dat geometry). */
  studs?: ReadonlyArray<PlacementStud>;
  /** Optional world-space unit vector pointing from narrow shaft toward wide head/ball/stop on asymmetric headed fasteners. */
  headedShaftDir?: readonly [number, number, number];
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
  /** True for razor-thin dual alignment projection lines on compact multi-contact brackets (matching 75192 p. 55 Step 76). */
  isPrecisionLine?: boolean;
  /** Optional contrast-adapted hex color override for this segment. */
  color?: string;
}

export const DEFAULT_ARROW_COLOR = '#dc2626';
export const CONTRAST_ARROW_GREEN = '#16a34a';
export const CONTRAST_ARROW_BLUE = '#2563eb';

const CONTACT_EPS = 6;
const STUD_HEIGHT_LDU = 4.0;
const SUPPORT_GAP_MAX = 1.5;
const COLOR_NEIGHBOR_EPS = CONTACT_EPS;
const TOUCH_COLOR_EPS = 4;
const SAME_COLOR_DIST_THRESHOLD = 42;
const ARROW_CONTRAST_DIST_THRESHOLD = 75;
const MAX_FIRST_STEP_OFFSETS = 6;
const MAX_SUBSEQUENT_STEP_OFFSETS = 2;
const MAX_SUBSEQUENT_STEP_LATERAL_OFFSETS = 3;

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
  /** True when the piece passes horizontally through a side hole (e.g. Technic pin/axle inside a Technic brick). */
  horizontalCoaxial: boolean;
  /** Primary world horizontal insertion axis (0 = X, 2 = Z) when `horizontalCoaxial` is true. */
  horizontalCoaxialAxis: 0 | 2 | null;
  /** Exact reference part IDs that genuinely form a coaxial through-hole/shaft pair with this part. */
  coaxialHostIds: Set<string>;
  lateralCount: number;
  /** Outward lateral normal from contacting reference parts toward this part. */
  lateralNormal: Vec3 | null;
  /** Physical pull-off unit direction dictated by engaged studs (or SNOT/inverted localUp stud-face contact). */
  studPullDir: Vec3 | null;
  /** World-space base coordinates of engaged studs along `studPullDir` (empty when inferred without compiled studs). */
  engagedStudPoints: Vec3[];
  /** World-space target tip coordinates of engaged studs (stud top center for ref studs; receiving face for part's own studs). */
  engagedStudTips: Vec3[];
  touchingRefs: PlacementPartInput[];
  /** Directly touching refs (within 4 LDU with real contact area) used for color-camouflage checks. */
  colorTouchingRefs: PlacementPartInput[];
}

function snapCardinalOrUnit(dx: number, dy: number, dz: number): Vec3 {
  const len = Math.hypot(dx, dy, dz);
  if (len < 1e-6) return [0, 1, 0];
  const ux = dx / len;
  const uy = dy / len;
  const uz = dz / len;
  const ax = Math.abs(ux);
  const ay = Math.abs(uy);
  const az = Math.abs(uz);
  if (ax >= ay && ax >= az) {
    if (ax >= 0.94) return [ux >= 0 ? 1 : -1, 0, 0];
  } else if (ay >= ax && ay >= az) {
    if (ay >= 0.94) return [0, uy >= 0 ? 1 : -1, 0];
  } else if (az >= 0.94) {
    return [0, 0, uz >= 0 ? 1 : -1];
  }
  return [ux, uy, uz];
}

/**
 * Returns true when an external stud `[bx, by, bz, nx, ny, nz]` (base at `(bx,by,bz)`,
 * extending 4 LDU along unit outward normal `n`) physically engages `targetBox` through
 * `targetBox`'s entry face facing `-n`.
 */
function isStudEngagingBox(stud: PlacementStud, targetBox: PlacementAABB): boolean {
  const bx = stud[0], by = stud[1], bz = stud[2];
  const nx = stud[3], ny = stud[4], nz = stud[5];
  const ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
  const maxComp = Math.max(ax, ay, az);

  if (maxComp >= 0.94) {
    const axis = ax >= ay && ax >= az ? 0 : (ay >= az ? 1 : 2);
    const sign = stud[3 + axis] >= 0 ? 1 : -1;
    const perpA = (axis + 1) % 3;
    const perpB = (axis + 2) % 3;
    // Stud center must sit strictly inside targetBox on both perpendicular axes (rejects grazing neighbor studs)
    if (stud[perpA] < targetBox.min[perpA] + 2 || stud[perpA] > targetBox.max[perpA] - 2) return false;
    if (stud[perpB] < targetBox.min[perpB] + 2 || stud[perpB] > targetBox.max[perpB] - 2) return false;
    const entryFace = sign > 0 ? targetBox.min[axis] : targetBox.max[axis];
    const exitFace = sign > 0 ? targetBox.max[axis] : targetBox.min[axis];
    const basePos = stud[axis];
    const faceDelta = (basePos - entryFace) * sign;
    const penetration = (exitFace - basePos) * sign;
    return faceDelta >= -2.5 && faceDelta <= 6.0 && penetration >= 3.5;
  }

  // General angled (non-cardinal SNOT) stud engagement test
  const inside = (x: number, y: number, z: number, pad: number): boolean =>
    x >= targetBox.min[0] - pad && x <= targetBox.max[0] + pad &&
    y >= targetBox.min[1] - pad && y <= targetBox.max[1] + pad &&
    z >= targetBox.min[2] - pad && z <= targetBox.max[2] + pad;
  const midIn = inside(bx + nx * 2, by + ny * 2, bz + nz * 2, 0.5);
  const tipIn = inside(bx + nx * 3.8, by + ny * 3.8, bz + nz * 3.8, 0.5);
  const centerAhead =
    (targetBox.center[0] - bx) * nx +
    (targetBox.center[1] - by) * ny +
    (targetBox.center[2] - bz) * nz;
  return midIn && tipIn && centerAhead >= 2.0;
}

interface EngagedStudSummary {
  pullDir: Vec3;
  count: number;
  studPoints: Vec3[];
  studTips: Vec3[];
}

function findEngagedStuds(
  part: PlacementPartInput,
  touchingRefs: ReadonlyArray<PlacementPartInput>,
): EngagedStudSummary | null {
  if (touchingRefs.length === 0) return null;

  type Bucket = {
    dir: Vec3;
    weight: number;
    count: number;
    points: Vec3[];
    tips: Vec3[];
    alignBonus: number;
  };
  const buckets = new Map<string, Bucket>();

  const addVote = (rawDir: Vec3, weight: number, point: Vec3, tip: Vec3, alignBonus: number) => {
    const dir = snapCardinalOrUnit(rawDir[0], rawDir[1], rawDir[2]);
    const key = `${Math.round(dir[0] * 20)},${Math.round(dir[1] * 20)},${Math.round(dir[2] * 20)}`;
    let b = buckets.get(key);
    if (!b) {
      b = { dir, weight: 0, count: 0, points: [], tips: [], alignBonus: 0 };
      buckets.set(key, b);
    }
    b.weight += weight;
    b.count += 1;
    b.alignBonus = Math.max(b.alignBonus, alignBonus);
    b.points.push(point);
    b.tips.push(tip);
  };

  // 1. Existing ref studs engaging `part` (pulling `part` off moves in +studNormal)
  for (let i = 0; i < touchingRefs.length; i++) {
    const ref = touchingRefs[i];
    if (!ref.studs || ref.studs.length === 0) continue;
    for (let j = 0; j < ref.studs.length; j++) {
      const st = ref.studs[j];
      if (!isStudEngagingBox(st, part.box)) continue;
      let weight = 1.0;
      let alignBonus = 0;
      if (part.localUp) {
        const align = st[3] * part.localUp[0] + st[4] * part.localUp[1] + st[5] * part.localUp[2];
        if (align <= -0.7) continue;
        if (align >= 0.7) {
          weight = 2.0;
          alignBonus = 1;
        } else {
          weight = 0.75;
        }
      }
      const basePt: Vec3 = [st[0], st[1], st[2]];
      const tipPt: Vec3 = [
        st[0] + st[3] * STUD_HEIGHT_LDU,
        st[1] + st[4] * STUD_HEIGHT_LDU,
        st[2] + st[5] * STUD_HEIGHT_LDU,
      ];
      addVote([st[3], st[4], st[5]], weight, basePt, tipPt, alignBonus);
    }
  }

  // 2. `part`'s own studs engaging an existing ref (pulling `part` off moves in -studNormal)
  if (part.studs && part.studs.length > 0) {
    for (let j = 0; j < part.studs.length; j++) {
      const st = part.studs[j];
      for (let i = 0; i < touchingRefs.length; i++) {
        const ref = touchingRefs[i];
        if (!isStudEngagingBox(st, ref.box)) continue;
        let weight = 1.0;
        let alignBonus = 0;
        if (ref.localUp) {
          const align = st[3] * ref.localUp[0] + st[4] * ref.localUp[1] + st[5] * ref.localUp[2];
          if (align <= -0.7) continue;
          if (align >= 0.7) {
            weight = 2.0;
            alignBonus = 1;
          } else {
            weight = 0.75;
          }
        }
        const basePt: Vec3 = [st[0], st[1], st[2]];
        addVote([-st[3], -st[4], -st[5]], weight, basePt, basePt, alignBonus);
        break;
      }
    }
  }

  let best: Bucket | null = null;
  for (const b of buckets.values()) {
    if (
      !best ||
      b.weight > best.weight + 1e-6 ||
      (Math.abs(b.weight - best.weight) <= 1e-6 &&
        (b.alignBonus > best.alignBonus || (b.alignBonus === best.alignBonus && b.count > best.count)))
    ) {
      best = b;
    }
  }
  if (!best) return null;
  return {
    pullDir: best.dir,
    count: best.count,
    studPoints: best.points,
    studTips: best.tips,
  };
}

/**
 * Fallback stud-axis inference for sideways (SNOT) or inverted parts when explicit
 * compiled stud primitives aren't available: checks whether a contacting reference
 * sits directly against the part's underside (-localUp) or top (+localUp) face.
 */
function findLocalUpStudDir(
  part: PlacementPartInput,
  touchingRefs: ReadonlyArray<PlacementPartInput>,
): Vec3 | null {
  if (!part.localUp || touchingRefs.length === 0) return null;
  const u = snapCardinalOrUnit(part.localUp[0], part.localUp[1], part.localUp[2]);
  if (u[1] >= 0.7) return null;

  const ax = Math.abs(u[0]), ay = Math.abs(u[1]), az = Math.abs(u[2]);
  if (Math.max(ax, ay, az) < 0.94) return null;
  const axis = ax >= ay && ax >= az ? 0 : (ay >= az ? 1 : 2);
  const sign = u[axis] >= 0 ? 1 : -1;
  const perpA = (axis + 1) % 3;
  const perpB = (axis + 2) % 3;
  const b = part.box;

  let undersideContacts = 0;
  let topContacts = 0;

  for (let i = 0; i < touchingRefs.length; i++) {
    const rb = touchingRefs[i].box;
    const ovA = overlap1D(b.min[perpA], b.max[perpA], rb.min[perpA], rb.max[perpA]);
    const ovB = overlap1D(b.min[perpB], b.max[perpB], rb.min[perpB], rb.max[perpB]);
    if (ovA <= 2 || ovB <= 2) continue;
    // Ignore refs that symmetrically enclose `part` along `axis` (e.g. beam surrounding a shaft)
    if (rb.min[axis] < b.min[axis] - 2 && rb.max[axis] > b.max[axis] + 2) continue;

    if (sign > 0) {
      if (rb.max[axis] >= b.min[axis] - CONTACT_EPS && rb.max[axis] <= b.min[axis] + CONTACT_EPS && rb.min[axis] < b.min[axis] + 2) {
        undersideContacts++;
      } else if (rb.min[axis] <= b.max[axis] + CONTACT_EPS && rb.min[axis] >= b.max[axis] - CONTACT_EPS && rb.max[axis] > b.max[axis] - 2) {
        topContacts++;
      }
    } else {
      if (rb.min[axis] <= b.max[axis] + CONTACT_EPS && rb.min[axis] >= b.max[axis] - CONTACT_EPS && rb.max[axis] > b.max[axis] - 2) {
        undersideContacts++;
      } else if (rb.max[axis] >= b.min[axis] - CONTACT_EPS && rb.max[axis] <= b.min[axis] + CONTACT_EPS && rb.min[axis] < b.min[axis] + 2) {
        topContacts++;
      }
    }
  }

  if (undersideContacts > 0 && undersideContacts >= topContacts) return u;
  if (topContacts > 0) return [-u[0], -u[1], -u[2]];
  return null;
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
  let horizontalCoaxial = false;
  let horizontalCoaxialAxis: 0 | 2 | null = null;
  const coaxialHostIds = new Set<string>();
  let lateralCount = 0;
  let latX = 0;
  let latZ = 0;
  const touchingRefs: PlacementPartInput[] = [];
  const colorTouchingRefs: PlacementPartInput[] = [];

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

    if (boxesWithinMargin(b, rb, TOUCH_COLOR_EPS)) {
      const solidAxes = (ovX >= 4 ? 1 : 0) + (ovY >= 4 ? 1 : 0) + (ovZ >= 4 ? 1 : 0);
      if (solidAxes >= 2) {
        colorTouchingRefs.push(ref);
      }
    }

    // Resting on top of ref (allow -CONTACT_EPS for 4 LDU stud penetration, but at most +1.5 LDU air gap
    // so horizontal Technic pins sitting 2 LDU above deck studs are never misclassified as vertically seated)
    if (ovX > 2 && ovZ > 2 && b.min[1] >= rb.max[1] - CONTACT_EPS && b.min[1] <= rb.max[1] + SUPPORT_GAP_MAX) {
      supportedFromBelow = true;
    }
    // Attached underneath ref
    if (ovX > 2 && ovZ > 2 && rb.min[1] >= b.max[1] - CONTACT_EPS && rb.min[1] <= b.max[1] + SUPPORT_GAP_MAX) {
      supportedFromAbove = true;
    }

    // Coaxial / through-hole penetration (overlapping in all 3 axes):
    // Distinguish vertical through-hole/sleeve insertions (±Y) from horizontal pin/axle insertions (±X/±Z).
    const nestedXZ = ovX > 1.5 && ovZ > 1.5;
    const coaxialXZ =
      ovX >= Math.min(s[0], rs[0]) * 0.72 &&
      ovZ >= Math.min(s[2], rs[2]) * 0.72;
    if (ovY > 3 && nestedXZ) {
      const partVertElongated = s[1] >= Math.max(s[0], s[2]) * 1.1;
      const partHorizElongated = Math.max(s[0], s[2]) >= s[1] * 1.15;
      const partProtrudesVert = b.max[1] > rb.max[1] + 2 || b.min[1] < rb.min[1] - 2;
      const refHorizWider = Math.max(rs[0], rs[2]) >= Math.max(s[0], s[2]) * 1.3;
      const partWrapsRefXZ = s[0] >= rs[0] + 1 && s[2] >= rs[2] + 1;
      const refInsidePartXZ =
        rb.min[0] >= b.min[0] - 1.5 &&
        rb.max[0] <= b.max[0] + 1.5 &&
        rb.min[2] >= b.min[2] - 1.5 &&
        rb.max[2] <= b.max[2] + 1.5;
      // Any ring, bush, half-bush, round-hole tile, or plate threaded around a slender protruding
      // vertical rod MUST slide vertically along ±Y (never sideways through the rod).
      const refVertRod =
        partWrapsRefXZ &&
        refInsidePartXZ &&
        rs[1] >= Math.max(rs[0], rs[2]) * 1.8 &&
        (rb.max[1] > b.max[1] + 2 || rb.min[1] < b.min[1] - 2);
      if (coaxialXZ && ((partVertElongated && (partProtrudesVert || refHorizWider)) || (partProtrudesVert && refHorizWider) || refVertRod)) {
        verticalCoaxial = true;
        coaxialHostIds.add(ref.id);
        continue;
      }

      // Horizontal pin/axle embedded coaxially inside a Technic brick/beam side hole:
      // MUST be vertically contained inside the host brick's Y span (`nestedInsideRefY`),
      // so stacked horizontal plates overlapping by 4 LDU of top/bottom studs are NEVER
      // misclassified as horizontal coaxial pins!
      const nestedInsideRefY = b.min[1] >= rb.min[1] + 1.5 && b.max[1] <= rb.max[1] - 1.5;
      if (nestedInsideRefY && (partHorizElongated || ovY >= s[1] * 0.72)) {
        horizontalCoaxial = true;
        horizontalCoaxialAxis = s[0] >= s[2] ? 0 : 2;
        coaxialHostIds.add(ref.id);
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

  const engaged = findEngagedStuds(part, touchingRefs);
  let studPullDir: Vec3 | null = engaged ? engaged.pullDir : null;
  const engagedStudPoints: Vec3[] = engaged ? engaged.studPoints : [];
  const engagedStudTips: Vec3[] = engaged ? engaged.studTips : [];
  if (!studPullDir && !verticalCoaxial && !horizontalCoaxial) {
    studPullDir = findLocalUpStudDir(part, touchingRefs);
  }

  return {
    supportedFromBelow,
    supportedFromAbove,
    verticalCoaxial,
    horizontalCoaxial,
    horizontalCoaxialAxis,
    coaxialHostIds,
    lateralCount,
    lateralNormal,
    studPullDir,
    engagedStudPoints,
    engagedStudTips,
    touchingRefs,
    colorTouchingRefs,
  };
}

const MIN_CORRIDOR_ARROW_GAP = 16;

function unionBox(a: PlacementAABB, b: PlacementAABB): PlacementAABB {
  const min: Vec3 = [
    Math.min(a.min[0], b.min[0]),
    Math.min(a.min[1], b.min[1]),
    Math.min(a.min[2], b.min[2]),
  ];
  const max: Vec3 = [
    Math.max(a.max[0], b.max[0]),
    Math.max(a.max[1], b.max[1]),
    Math.max(a.max[2], b.max[2]),
  ];
  return {
    min,
    max,
    center: [(min[0] + max[0]) * 0.5, (min[1] + max[1]) * 0.5, (min[2] + max[2]) * 0.5],
  };
}

interface ScreenRect2D {
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

/** Projects a 3D AABB into orthographic 2D camera screen coordinates `(u, v)`. */
function projectBoxToScreen2D(
  box: PlacementAABB,
  azDeg: number,
  elDeg: number,
): ScreenRect2D {
  const { right, up } = cameraBasis(azDeg, elDeg);
  const rx = right[0];
  const rz = right[2];
  const ux = up[0];
  const uy = up[1];
  const uz = up[2];

  let uMin = Infinity;
  let uMax = -Infinity;
  let vMin = Infinity;
  let vMax = -Infinity;
  for (let ix = 0; ix < 2; ix++) {
    const x = ix === 0 ? box.min[0] : box.max[0];
    for (let iy = 0; iy < 2; iy++) {
      const y = iy === 0 ? box.min[1] : box.max[1];
      for (let iz = 0; iz < 2; iz++) {
        const z = iz === 0 ? box.min[2] : box.max[2];
        const u = x * rx + z * rz;
        const v = x * ux + y * uy + z * uz;
        if (u < uMin) uMin = u;
        if (u > uMax) uMax = u;
        if (v < vMin) vMin = v;
        if (v > vMax) vMax = v;
      }
    }
  }
  return { uMin, uMax, vMin, vMax };
}

function screenRectsOverlap(a: ScreenRect2D, b: ScreenRect2D, pad = 6): boolean {
  return (
    a.uMin - pad < b.uMax &&
    a.uMax + pad > b.uMin &&
    a.vMin - pad < b.vMax &&
    a.vMax + pad > b.vMin
  );
}

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

function expandBoxMargin(b: PlacementAABB, margin: number): PlacementAABB {
  return {
    min: [b.min[0] - margin, b.min[1] - margin, b.min[2] - margin],
    max: [b.max[0] + margin, b.max[1] + margin, b.max[2] + margin],
    center: [b.center[0], b.center[1], b.center[2]],
  };
}

/**
 * Builds the swept withdrawal corridor strictly ahead of `box` along `(axis, sign)`
 * up to `mag` LDU so a brick can never teleport through a blocking sibling or wall.
 */
function buildSweptCorridorBox(
  box: PlacementAABB,
  axis: number,
  sign: number,
  mag: number,
): PlacementAABB {
  const min: Vec3 = [box.min[0], box.min[1], box.min[2]];
  const max: Vec3 = [box.max[0], box.max[1], box.max[2]];
  if (sign > 0) {
    min[axis] = box.max[axis];
    max[axis] = box.max[axis] + mag;
  } else {
    min[axis] = box.min[axis] - mag;
    max[axis] = box.min[axis];
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) * 0.5, (min[1] + max[1]) * 0.5, (min[2] + max[2]) * 0.5],
  };
}

function computeEngagedStudArrowBox(
  partBox: PlacementAABB,
  studPoints: ReadonlyArray<Vec3>,
  axis: number,
): PlacementAABB | null {
  if (studPoints.length === 0) return null;
  const perpA = (axis + 1) % 3;
  const perpB = (axis + 2) % 3;

  let minA = Infinity;
  let maxA = -Infinity;
  let minB = Infinity;
  let maxB = -Infinity;
  for (let i = 0; i < studPoints.length; i++) {
    const p = studPoints[i];
    if (p[perpA] < minA) minA = p[perpA];
    if (p[perpA] > maxA) maxA = p[perpA];
    if (p[perpB] < minB) minB = p[perpB];
    if (p[perpB] > maxB) maxB = p[perpB];
  }

  // Expand symmetrically by half a stud (10 LDU) around outermost engaged stud centers
  // without clamping against partBox edges so LDraw seam tolerances never skew stud centering.
  const loA = minA - 10;
  const hiA = maxA + 10;
  const loB = minB - 10;
  const hiB = maxB + 10;
  if (hiA - loA < 4 || hiB - loB < 4) return null;

  const spanA = partBox.max[perpA] - partBox.min[perpA];
  const spanB = partBox.max[perpB] - partBox.min[perpB];
  const centerA = (loA + hiA) * 0.5;
  const centerB = (loB + hiB) * 0.5;
  const centerShifted =
    Math.abs(centerA - partBox.center[perpA]) > 0.25 ||
    Math.abs(centerB - partBox.center[perpB]) > 0.25;
  if (!centerShifted && spanA - (hiA - loA) < 2 && spanB - (hiB - loB) < 2) return null;

  const mn: Vec3 = [partBox.min[0], partBox.min[1], partBox.min[2]];
  const mx: Vec3 = [partBox.max[0], partBox.max[1], partBox.max[2]];
  mn[perpA] = loA;
  mx[perpA] = hiA;
  mn[perpB] = loB;
  mx[perpB] = hiB;
  return {
    min: mn,
    max: mx,
    center: [(mn[0] + mx[0]) * 0.5, (mn[1] + mx[1]) * 0.5, (mn[2] + mx[2]) * 0.5],
  };
}

/**
 * Picks a clean, collision-free offset vector along the physical insertion axis.
 * - Guarantees a crisp open air gap past any coaxial obstacle tip (`arrowTo`).
 * - Rejects directions whose swept withdrawal corridor passes through a blocking
 *   sibling part or non-coaxial solid obstacle.
 * - Anchors arrows directly over the actual engaged studs or contact overlap (`arrowBox`).
 * - For vertical lifts, accounts for orthographic camera elevation so a wide
 *   overhanging plate never blocks the camera's view of its arrows or attaching studs.
 * - Returns `null` when every candidate direction is blocked/colliding so trapped
 *   bricks remain cleanly seated instead of colliding or clipping through neighbors.
 */
interface OffsetArrowVisibility {
  camDot: number;
  bestObsTipClear: boolean;
  bestObsArrowVis: number;
  bestTipClear: boolean;
  bestArrowVis: number;
}

/**
 * Evaluates orthographic camera visibility of a candidate offset's rendered
 * placement arrow(s) and attachment tip (`t = 0.92`) against scene obstacles
 * and the offset piece itself (`shiftedBox`).
 *
 * Prevents emitting offsets that push a piece away from the camera or behind
 * existing geometry where its attachment point and arrow are obscured.
 */
function evaluateOffsetArrowVisibility(
  arrowBaseBox: PlacementAABB,
  shiftedBox: PlacementAABB,
  offset: Vec3,
  arrowTo: Vec3 | null,
  visObstacles: ReadonlyArray<PlacementPartInput>,
  camera: { az: number; el: number },
): OffsetArrowVisibility {
  const mag = Math.hypot(offset[0], offset[1], offset[2]);
  const { viewDir } = cameraBasis(camera.az, camera.el);
  const camDot =
    mag > 1e-6
      ? (offset[0] * viewDir[0] + offset[1] * viewDir[1] + offset[2] * viewDir[2]) / mag
      : 0;

  const segs = computePlacementArrowSegments(arrowBaseBox, offset, arrowTo, null, camera.az);
  if (segs.length === 0) {
    return {
      camDot,
      bestObsTipClear: false,
      bestObsArrowVis: 0,
      bestTipClear: false,
      bestArrowVis: 0,
    };
  }

  const sampleTs = [0.08, 0.28, 0.5, 0.72, 0.92] as const;
  let bestObsTipClear = false;
  let bestObsArrowVis = 0;
  let bestTipClear = false;
  let bestArrowVis = 0;

  for (const seg of segs) {
    let obsClearCount = 0;
    let allClearCount = 0;
    let obsTipClear = true;
    let allTipClear = true;

    for (let si = 0; si < sampleTs.length; si++) {
      const t = sampleTs[si];
      const pt: Vec3 = [
        seg.from[0] + (seg.to[0] - seg.from[0]) * t,
        seg.from[1] + (seg.to[1] - seg.from[1]) * t,
        seg.from[2] + (seg.to[2] - seg.from[2]) * t,
      ];

      let obsBlocked = false;
      for (let i = 0; i < visObstacles.length; i++) {
        if (rayIntersectsBox(pt, viewDir, visObstacles[i].box) !== null) {
          obsBlocked = true;
          break;
        }
      }
      const selfBlocked =
        t >= 0.5 && rayIntersectsBox(pt, viewDir, shiftedBox) !== null;

      if (!obsBlocked) obsClearCount++;
      if (!obsBlocked && !selfBlocked) allClearCount++;
      if (si === sampleTs.length - 1) {
        obsTipClear = !obsBlocked;
        allTipClear = !obsBlocked && !selfBlocked;
      }
    }

    const obsVis = obsClearCount / sampleTs.length;
    const allVis = allClearCount / sampleTs.length;
    if (obsTipClear) bestObsTipClear = true;
    if (allTipClear) bestTipClear = true;
    if (obsVis > bestObsArrowVis) bestObsArrowVis = obsVis;
    if (allVis > bestArrowVis) bestArrowVis = allVis;
  }

  return {
    camDot,
    bestObsTipClear,
    bestObsArrowVis,
    bestTipClear,
    bestArrowVis,
  };
}

function resolveOffsetAlongAxis(
  part: PlacementPartInput,
  preferredDir: Vec3,
  fallbackDirs: ReadonlyArray<Vec3>,
  obstacles: ReadonlyArray<PlacementPartInput>,
  camera?: { az: number; el: number },
  touchingRefs: ReadonlyArray<PlacementPartInput> = [],
  siblingObstacles: ReadonlyArray<PlacementPartInput> = [],
  options: {
    preferShortestDir?: boolean;
    studPullDir?: Vec3 | null;
    engagedStudPoints?: ReadonlyArray<Vec3>;
    engagedStudTips?: ReadonlyArray<Vec3>;
    coaxialAxis?: 0 | 1 | 2 | null;
    coaxialHostIds?: ReadonlySet<string>;
  } = {},
): AutoPartOffset | null {
  const s = boxSize(part.box);
  const dirs: Vec3[] = [preferredDir, ...fallbackDirs];
  const studPullDir = options.studPullDir ?? null;
  const engagedStudPoints = options.engagedStudPoints ?? [];
  const engagedStudTips = options.engagedStudTips ?? [];
  const coaxialAxis = options.coaxialAxis ?? null;
  const coaxialHostIds = options.coaxialHostIds;

  const visObstacles: PlacementPartInput[] = [];
  if (camera) {
    for (let i = 0; i < obstacles.length; i++) {
      if (obstacles[i].id !== part.id) visObstacles.push(obstacles[i]);
    }
    for (let i = 0; i < siblingObstacles.length; i++) {
      if (siblingObstacles[i].id !== part.id) visObstacles.push(siblingObstacles[i]);
    }
  }
  let cachedSeatedVis: number | null = null;
  const getSeatedVis = (): number => {
    if (cachedSeatedVis === null) {
      cachedSeatedVis = camera
        ? 1 - estimateCameraOcclusion(part.box, visObstacles, camera.az, camera.el)
        : 1;
    }
    return cachedSeatedVis;
  };

  const isCoaxialHostAlongAxis = (obs: PlacementPartInput, axis: number): boolean => {
    if (coaxialAxis !== axis || !coaxialHostIds || !coaxialHostIds.has(obs.id)) return false;
    // Require deep coaxial shaft/hole overlap (> 6 LDU), never a shallow 4 LDU stud penetration
    const ovAlong = overlap1D(part.box.min[axis], part.box.max[axis], obs.box.min[axis], obs.box.max[axis]);
    return ovAlong > CONTACT_EPS + 1.5;
  };

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

  let bestCandidate: { res: AutoPartOffset; mag: number; dirIdx: number } | null = null;

  for (let dirIdx = 0; dirIdx < dirs.length; dirIdx++) {
    const dir = dirs[dirIdx];
    const ax = Math.abs(dir[0]), ay = Math.abs(dir[1]), az = Math.abs(dir[2]);
    const axis = ax >= ay && ax >= az ? 0 : (ay >= az ? 1 : 2);
    const isCardinal = Math.max(ax, ay, az) >= 0.94;
    const sign = dir[axis] >= 0 ? 1 : -1;
    const perpA = (axis + 1) % 3;
    const perpB = (axis + 2) % 3;

    const alignsWithEngagedStuds =
      studPullDir !== null &&
      engagedStudPoints.length > 0 &&
      dir[0] * studPullDir[0] + dir[1] * studPullDir[1] + dir[2] * studPullDir[2] >= 0.94;

    const arrowBox = !isCardinal
      ? null
      : alignsWithEngagedStuds
        ? computeEngagedStudArrowBox(part.box, engagedStudPoints, axis)
        : computeContactArrowBox(part.box, touchingRefs, axis, sign);
    const arrowAnchor = arrowBox ? arrowBox.center : part.box.center;

    // Find any genuine coaxial through-hole/shaft host along the insertion path (e.g., vertical axle inside a bush
    // or Technic brick hole face around a horizontal pin). Solid stacked plates/bricks NEVER qualify!
    let corridorObsTip: number | null = null;
    if (isCardinal) {
      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (obs.id === part.id) continue;
        if (!isCoaxialHostAlongAxis(obs, axis)) continue;
        const ob = obs.box;
        const ovA = overlap1D(part.box.min[perpA], part.box.max[perpA], ob.min[perpA], ob.max[perpA]);
        const ovB = overlap1D(part.box.min[perpB], part.box.max[perpB], ob.min[perpB], ob.max[perpB]);
        if (ovA <= 1.5 || ovB <= 1.5) continue;
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
    }

    // Also detect any non-coaxial solid obstacle nested inside a concave/forked/lipped part's
    // underside (e.g. a brick sitting inside a U-shaped wheel holder, arch, or hanging bracket)
    // so the arrowhead stops right on that obstacle's stud-top surface instead of burying inside it.
    let surfaceObsTip: number | null = null;
    if (isCardinal) {
      const targetBox = arrowBox || part.box;
      const defaultEntryFace = sign > 0 ? part.box.min[axis] : part.box.max[axis];
      const defaultTipAxis = defaultEntryFace + sign * STUD_HEIGHT_LDU;
      const partExitFace = sign > 0 ? part.box.max[axis] : part.box.min[axis];

      const tSpanA = Math.max(0.5, targetBox.max[perpA] - targetBox.min[perpA]);
      const tSpanB = Math.max(0.5, targetBox.max[perpB] - targetBox.min[perpB]);
      const hA = studAxisHalfOffset(tSpanA);
      const hB = studAxisHalfOffset(tSpanB);
      const probePts: Array<[number, number]> =
        hA > 0 || hB > 0
          ? [
              [targetBox.center[perpA] + hA, targetBox.center[perpB] + hB],
              [targetBox.center[perpA] - hA, targetBox.center[perpB] - hB],
              [targetBox.center[perpA] + hA, targetBox.center[perpB] - hB],
              [targetBox.center[perpA] - hA, targetBox.center[perpB] + hB],
            ]
          : [[targetBox.center[perpA], targetBox.center[perpB]]];

      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (obs.id === part.id) continue;
        if (isCoaxialHostAlongAxis(obs, axis)) continue;
        const ob = obs.box;
        const obsFace = sign > 0 ? ob.max[axis] : ob.min[axis];
        if ((obsFace - defaultTipAxis) * sign <= 1.0) continue;
        if ((partExitFace - obsFace) * sign <= 2.0) continue;
        let hitsAnchor = false;
        for (let k = 0; k < probePts.length; k++) {
          const pa = probePts[k][0];
          const pb = probePts[k][1];
          if (
            pa >= ob.min[perpA] + 0.5 && pa <= ob.max[perpA] - 0.5 &&
            pb >= ob.min[perpB] + 0.5 && pb <= ob.max[perpB] - 0.5
          ) {
            hitsAnchor = true;
            break;
          }
        }
        if (!hitsAnchor) continue;
        if (surfaceObsTip === null || (obsFace - surfaceObsTip) * sign > 0) {
          surfaceObsTip = obsFace;
        }
      }
    }

    const baseMag = computeBaseMag(dir, arrowAnchor);
    let corridorBlockedDir = false;
    for (let extra = 0; extra <= 96; extra += 8) {
      const mag = baseMag + extra;
      const dx = Math.round(dir[0] * mag);
      const dy = Math.round(dir[1] * mag);
      const dz = Math.round(dir[2] * mag);
      const shifted = shiftBox(part.box, dx, dy, dz);
      const swept = unionBox(part.box, shifted);

      if (isCardinal) {
        const corridor = buildSweptCorridorBox(part.box, axis, sign, mag);

        // Reject this direction if ANY sibling part or non-coaxial solid obstacle sits inside
        // the swept withdrawal corridor ahead of `part` (prevents jumping through stacked plates/ceilings/walls).
        for (let i = 0; i < siblingObstacles.length; i++) {
          const obs = siblingObstacles[i];
          if (obs.id === part.id) continue;
          const isLeading = (obs.box.center[axis] - part.box.center[axis]) * sign > 1.0;
          if (
            boxesIntersectStrict(corridor, obs.box, 1.5) ||
            (isLeading && boxesIntersectStrict(swept, obs.box, 2.0))
          ) {
            corridorBlockedDir = true;
            break;
          }
        }
        if (corridorBlockedDir) break;

        for (let i = 0; i < obstacles.length; i++) {
          const obs = obstacles[i];
          if (obs.id === part.id) continue;
          if (isCoaxialHostAlongAxis(obs, axis)) continue; // genuine coaxial pin/axle handled via corridorObsTip
          const isLeading = (obs.box.center[axis] - part.box.center[axis]) * sign > 1.0;
          if (
            boxesIntersectStrict(corridor, obs.box, 1.5) ||
            (isLeading && boxesIntersectStrict(swept, obs.box, 2.0))
          ) {
            corridorBlockedDir = true;
            break;
          }
        }
        if (corridorBlockedDir) break;
      }

      // Ensure crisp open air gap past any coaxial obstacle tip (e.g., bush lifted above axle tip)
      // or nested underside surface (e.g., brick inside a U-shaped arch/bracket/holder).
      const effectiveTip =
        corridorObsTip !== null && surfaceObsTip !== null
          ? ((corridorObsTip - surfaceObsTip) * sign >= 0 ? corridorObsTip : surfaceObsTip)
          : (corridorObsTip ?? surfaceObsTip);
      if (effectiveTip !== null) {
        const nearFace = sign > 0 ? shifted.min[axis] : shifted.max[axis];
        const gapToTip = sign > 0 ? nearFace - effectiveTip : effectiveTip - nearFace;
        if (gapToTip < MIN_CORRIDOR_ARROW_GAP) continue;
      }

      let collides = false;
      for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (obs.id === part.id) continue;
        if (boxesIntersectStrict(shifted, obs.box, 1.5)) {
          collides = true;
          break;
        }
        if (!isCardinal && !isCoaxialHostAlongAxis(obs, axis)) {
          const isLeading =
            (obs.box.center[0] - part.box.center[0]) * dir[0] +
            (obs.box.center[1] - part.box.center[1]) * dir[1] +
            (obs.box.center[2] - part.box.center[2]) * dir[2] > 1.0;
          for (const frac of [0.25, 0.5, 0.75]) {
            if (!isLeading && frac <= 0.25) continue;
            const mid = shiftBox(part.box, dx * frac, dy * frac, dz * frac);
            if (boxesIntersectStrict(mid, obs.box, 1.5)) {
              collides = true;
              break;
            }
          }
          if (collides) break;
        }
      }
      if (!collides) {
        for (let i = 0; i < siblingObstacles.length; i++) {
          const obs = siblingObstacles[i];
          if (obs.id === part.id) continue;
          if (boxesIntersectStrict(shifted, obs.box, 1.5)) {
            collides = true;
            break;
          }
          if (!isCardinal) {
            const isLeading =
              (obs.box.center[0] - part.box.center[0]) * dir[0] +
              (obs.box.center[1] - part.box.center[1]) * dir[1] +
              (obs.box.center[2] - part.box.center[2]) * dir[2] > 1.0;
            for (const frac of [0.25, 0.5, 0.75]) {
              if (!isLeading && frac <= 0.25) continue;
              const mid = shiftBox(part.box, dx * frac, dy * frac, dz * frac);
              if (boxesIntersectStrict(mid, obs.box, 1.5)) {
                collides = true;
                break;
              }
            }
            if (collides) break;
          }
        }
      }
      if (!collides) {
        const res: AutoPartOffset = { x: dx, y: dy, z: dz, tilt: 0, arrow: true };
        if (arrowBox) res.arrowBox = arrowBox;
        // Stop the arrowhead cleanly at a coaxial obstacle tip (e.g. axle) OR at the exact
        // engaged stud top / nested supporting surface when the part's AABB hangs past the studs.
        const defaultEntryFace = sign > 0 ? part.box.min[axis] : part.box.max[axis];
        const defaultTipAxis = defaultEntryFace + sign * STUD_HEIGHT_LDU;
        let targetTipAxis: number | null = null;
        if (corridorObsTip !== null) {
          const pastCenter = sign > 0
            ? corridorObsTip - part.box.center[axis]
            : part.box.center[axis] - corridorObsTip;
          if (pastCenter > 2) {
            targetTipAxis = corridorObsTip + sign * 2;
          } else if ((corridorObsTip - defaultTipAxis) * sign > 1.0) {
            targetTipAxis = corridorObsTip;
          }
        }
        if (isCardinal && alignsWithEngagedStuds && engagedStudTips.length > 0) {
          let studTipAxis = sign > 0 ? -Infinity : Infinity;
          for (let i = 0; i < engagedStudTips.length; i++) {
            const v = engagedStudTips[i][axis];
            if (sign > 0 ? v > studTipAxis : v < studTipAxis) studTipAxis = v;
          }
          if ((studTipAxis - defaultTipAxis) * sign > 1.0) {
            if (targetTipAxis === null || (studTipAxis - targetTipAxis) * sign > 0) {
              targetTipAxis = studTipAxis;
            }
          }
        }
        if (surfaceObsTip !== null) {
          if (targetTipAxis === null || (surfaceObsTip - targetTipAxis) * sign > 0) {
            targetTipAxis = surfaceObsTip;
          }
        }
        if (targetTipAxis !== null) {
          const arrowTo: Vec3 = [arrowAnchor[0], arrowAnchor[1], arrowAnchor[2]];
          arrowTo[axis] = targetTipAxis;
          res.arrowTo = arrowTo;
        }

        // Orthographic visibility & clarity gate: never emit an offset whose attachment point
        // and placement arrow are obscured behind existing geometry (making the step less clear).
        if (camera && visObstacles.length > 0) {
          const vis = evaluateOffsetArrowVisibility(
            res.arrowBox ?? part.box,
            shifted,
            [dx, dy, dz],
            res.arrowTo ?? null,
            visObstacles,
            camera,
          );
          if (vis.camDot < -0.15) {
            // Pulling AWAY from the camera:
            const shiftedVis = 1 - estimateCameraOcclusion(shifted, visObstacles, camera.az, camera.el);
            const seatedVis = getSeatedVis();
            if (axis === 1) {
              // Vertical away-from-camera (-Y on top view or +Y on bottom view):
              // pushing a piece underneath an overhang is only helpful when the attachment
              // tip and arrow stay clearly visible and the piece isn't buried deeper.
              if (!vis.bestObsTipClear || vis.bestObsArrowVis < 0.6) {
                break;
              }
              if (shiftedVis < seatedVis - 0.08) {
                break;
              }
              if (!vis.bestTipClear || vis.bestArrowVis < 0.6) {
                continue;
              }
            } else {
              // Horizontal/lateral away-from-camera (e.g. a rear pin sliding out from a beam):
              // allow when the attachment tip is visible OR the piece pulls out into clear open
              // view with a mostly visible arrow shaft; reject when hidden behind a wall/deck.
              const tipAndShaftClear = vis.bestObsTipClear && vis.bestObsArrowVis >= 0.6;
              const pullsIntoOpenView =
                vis.bestObsArrowVis >= 0.55 &&
                shiftedVis >= 0.7 &&
                shiftedVis >= seatedVis - 0.05;
              if (!tipAndShaftClear && !pullsIntoOpenView) {
                continue;
              }
              if (!vis.bestTipClear && vis.bestArrowVis < 0.55) {
                continue;
              }
            }
          } else {
            // Moving perpendicular to or toward the camera:
            // If the offset piece itself hides an otherwise-visible attachment tip, lift slightly further.
            if (vis.bestObsTipClear && !vis.bestTipClear) {
              continue;
            }
            // If scene obstacles hide BOTH the attachment tip and most of the arrow shaft, only allow
            // the offset when it genuinely rescues a heavily hidden seated piece into open view
            // (continuing `extra` steps so lifting higher can clear a foreground wall).
            if (!vis.bestObsTipClear && vis.bestObsArrowVis < 0.45) {
              const seatedVis = getSeatedVis();
              const shiftedVis = 1 - estimateCameraOcclusion(shifted, visObstacles, camera.az, camera.el);
              if (seatedVis >= 0.45 || shiftedVis < seatedVis + 0.25) {
                continue;
              }
            }
          }
        }
        // Auto-detect pass-through alignment guide when a lateral pin/axle penetrates a perforated beam/frame
        if (isCardinal && axis !== 1) {
          const penetratingHostBoxes = obstacles
            .filter((o) => o.id !== part.id && boxesIntersectStrict(part.box, o.box, 1.5))
            .map((o) => o.box);
          if (penetratingHostBoxes.length > 0) {
            const guideTarget = detectThroughHoleGuideTarget(
              part.box,
              [dx, dy, dz],
              penetratingHostBoxes,
            );
            if (guideTarget) res.throughGuideTo = guideTarget;
          }
        }
        if (!options.preferShortestDir) {
          return res;
        }
        if (!bestCandidate || mag + 8 < bestCandidate.mag) {
          bestCandidate = { res, mag, dirIdx };
        }
        break;
      }
    }
  }

  return bestCandidate ? bestCandidate.res : null;
}

function chooseInsertionDirs(
  contacts: ContactSummary,
  cameraSide: 'top' | 'bottom',
  isLateralPrimary: boolean,
  cameraAzDeg = 38,
  headedShaftDir?: readonly [number, number, number],
): { preferred: Vec3; fallbacks: Vec3[]; preferShortestDir?: boolean } {
  const verticalDefault: Vec3 = cameraSide === 'bottom' ? [0, -1, 0] : [0, 1, 0];
  const verticalOpposite: Vec3 = cameraSide === 'bottom' ? [0, 1, 0] : [0, -1, 0];

  // Physical stud-clutch direction always takes top priority:
  // a piece attached to (or via) studs can ONLY be inserted/removed along the direction of those studs
  // (never slid sideways off studs or teleported backward through its host brick).
  if (contacts.studPullDir) {
    return {
      preferred: contacts.studPullDir,
      fallbacks: [],
    };
  }

  if (contacts.verticalCoaxial) {
    // An asymmetric headed shaft/towball/stop-axle can ONLY be inserted from its wide-head side
    // (withdrawn along `headedShaftDir`), never forced head-first backwards through a narrow hole.
    if (headedShaftDir && Math.abs(headedShaftDir[1]) >= 0.85) {
      return {
        preferred: [0, headedShaftDir[1] >= 0 ? 1 : -1, 0],
        fallbacks: [],
      };
    }
    return {
      preferred: verticalDefault,
      fallbacks: [verticalOpposite],
    };
  }
  if (contacts.horizontalCoaxial && contacts.horizontalCoaxialAxis !== null) {
    const axis = contacts.horizontalCoaxialAxis;
    if (headedShaftDir && Math.abs(headedShaftDir[axis]) >= 0.85) {
      const headSign = headedShaftDir[axis] >= 0 ? 1 : -1;
      const headDir: Vec3 = axis === 0 ? [headSign, 0, 0] : [0, 0, headSign];
      return {
        preferred: headDir,
        fallbacks: [],
      };
    }
    const az = (cameraAzDeg * Math.PI) / 180;
    const camSign = (axis === 0 ? Math.sin(az) : Math.cos(az)) >= 0 ? 1 : -1;
    const pref: Vec3 = axis === 0 ? [camSign, 0, 0] : [0, 0, camSign];
    const opp: Vec3 = axis === 0 ? [-camSign, 0, 0] : [0, 0, -camSign];
    return {
      preferred: pref,
      fallbacks: [opp],
      preferShortestDir: true,
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
 * offsets independent attached piece(s) along their insertion axes with red arrows.
 * Never offsets two or more physically touching/stacked pieces together as a cluster.
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
        ? (ovX > 2 && ovZ > 2 && a.box.min[1] >= b.box.max[1] - CONTACT_EPS && a.box.min[1] <= b.box.max[1] + SUPPORT_GAP_MAX)
        : (ovX > 2 && ovZ > 2 && b.box.min[1] >= a.box.max[1] - CONTACT_EPS && b.box.min[1] <= a.box.max[1] + SUPPORT_GAP_MAX);
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
  // supporting other parts > central hub touching multiple Step-1 parts > structural host over slender vertical shafts > on base plane > largest volume
  const baseScores = parts.map((p) => {
    const s = boxSize(p.box);
    const vol = boxVolume(p.box);
    const sup = supportCount.get(p.id) || 0;
    let touchCount = 0;
    for (const other of parts) {
      if (other.id !== p.id && boxesWithinMargin(p.box, other.box, CONTACT_EPS)) touchCount++;
    }
    const isSlenderVertShaft =
      s[1] > Math.max(s[0], s[2]) * 1.35 && Math.max(s[0], s[2]) <= 22;
    const onGround = isSlenderVertShaft
      ? 0
      : isBottomView
        ? (Math.abs(p.box.max[1] - basePlaneY) <= CONTACT_EPS ? 1 : 0)
        : (Math.abs(p.box.min[1] - basePlaneY) <= CONTACT_EPS ? 1 : 0);
    const isSupported = supportedByAnother.has(p.id) ? 1 : 0;
    return {
      part: p,
      score:
        sup * 1_000_000 +
        (1 - isSupported) * 200_000 +
        touchCount * 120_000 +
        (isSlenderVertShaft ? -40_000 : 0) +
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

  // Evaluate outermost, non-supporting pieces first (smaller volume as tie-breaker) so multi-layer
  // stacks keep lower layers grounded and lift only unblocked individual leaf piece(s).
  const orderedAttached = [...attachedParts].sort((a, b) => {
    const supDiff = (supportCount.get(a.id) || 0) - (supportCount.get(b.id) || 0);
    if (supDiff !== 0) return supDiff;
    const outerDiff = isBottomView
      ? a.box.min[1] - b.box.min[1]
      : b.box.max[1] - a.box.max[1];
    if (Math.abs(outerDiff) > 2) return outerDiff;
    return boxVolume(a.box) - boxVolume(b.box);
  });

  const out: Record<string, AutoPartOffset> = {};
  const acceptedParts: PlacementPartInput[] = [];
  const acceptedShiftedBoxes: PlacementAABB[] = [];
  const acceptedShiftedObstacles: PlacementPartInput[] = [];

  for (const p of orderedAttached) {
    if (acceptedParts.length >= MAX_FIRST_STEP_OFFSETS) break;
    // Never offset two physically touching bricks together as a floating cluster
    if (acceptedParts.some((acc) => boxesWithinMargin(p.box, acc.box, CONTACT_EPS))) continue;

    const seatedRefs = parts.filter((q) => q.id !== p.id && !out[q.id]);
    const contacts = analyzeContacts(p, seatedRefs);
    if (contacts.touchingRefs.length === 0) continue;

    const isStudDrivenLateral = contacts.studPullDir !== null && Math.abs(contacts.studPullDir[1]) < 0.94;
    const isLateral =
      isStudDrivenLateral ||
      (contacts.lateralCount > 0 && !contacts.supportedFromBelow && !contacts.supportedFromAbove);
    const { preferred, fallbacks, preferShortestDir } = chooseInsertionDirs(
      contacts,
      cameraSide,
      isLateral,
      step.camera.az,
      p.headedShaftDir,
    );
    const otherSiblings = parts.filter((q) => q.id !== p.id && !baseSet.has(q.id));
    const coaxialAxis: 0 | 1 | 2 | null = contacts.verticalCoaxial
      ? 1
      : contacts.horizontalCoaxial
        ? contacts.horizontalCoaxialAxis
        : null;
    const resolved = resolveOffsetAlongAxis(
      p,
      preferred,
      fallbacks,
      baseParts,
      step.camera,
      contacts.touchingRefs,
      [...otherSiblings, ...acceptedShiftedObstacles],
      {
        preferShortestDir,
        studPullDir: contacts.studPullDir,
        engagedStudPoints: contacts.engagedStudPoints,
        engagedStudTips: contacts.engagedStudTips,
        coaxialAxis,
        coaxialHostIds: contacts.coaxialHostIds,
      },
    );
    if (!resolved) continue;

    const shifted = shiftBox(p.box, resolved.x, resolved.y, resolved.z);
    if (acceptedShiftedBoxes.some((sb) => boxesWithinMargin(shifted, sb, CONTACT_EPS))) continue;

    out[p.id] = resolved;
    acceptedParts.push(p);
    acceptedShiftedBoxes.push(shifted);
    acceptedShiftedObstacles.push({
      id: `__shifted_${p.id}`,
      box: expandBoxMargin(shifted, CONTACT_EPS * 0.5),
      rgb: p.rgb,
    });
  }
  return out;
}

interface NoticeabilityCandidate {
  part: PlacementPartInput;
  score: number;
  contacts: ContactSummary;
  isLateral: boolean;
  isCoaxialOrLateral: boolean;
  extraHosts?: PlacementPartInput[];
}

/**
 * Evaluates a subsequent step (`prevParts.length > 0`) and returns clean,
 * non-clipping, non-occluding offsets for individual pieces that need arrows.
 *
 * Strict anti-cluster & non-occlusion invariants:
 * - Only loose pieces that directly contact `prevParts` (or a grounded same-step
 *   host brick for a horizontally embedded pin on imported steps) are eligible.
 * - Never pulls a piece out from underneath a sibling in the same step that
 *   depends on it for support.
 * - Never offsets two or more physically touching pieces together as a floating
 *   cluster (checked in both seated and shifted positions).
 * - Projects shifted pieces + arrow corridors into 2D orthographic screen space
 *   to prevent nearby offset placements from crowding or occluding each other.
 * - Rejects any offset whose swept withdrawal corridor passes through a sibling
 *   piece or non-coaxial obstacle.
 */
function computeSubsequentStepOffsets(
  step: PlacementStepInput,
  prevParts: ReadonlyArray<PlacementPartInput>,
  builtBounds: PlacementAABB | null,
): Record<string, AutoPartOffset> {
  if (step.parts.length === 0 || prevParts.length === 0 || !builtBounds) return {};

  const cameraSide = step.camera.side === 'bottom' ? 'bottom' : 'top';
  const isBottomView = cameraSide === 'bottom';
  const builtDiag = Math.max(20, boxDiag(builtBounds));

  // Defense-in-depth for steps (e.g. imported manual steps) where a horizontal pin/axle
  // is present in the same step as the brick it embeds into: keep the host brick grounded
  // so the pin slides cleanly horizontally into its hole instead of clipping through it.
  const sameStepPinnedHosts = new Set<string>();
  const sameStepHostByPin = new Map<string, PlacementPartInput[]>();
  if (step.parts.length >= 2) {
    for (const part of step.parts) {
      const sibContacts = analyzeContacts(part, step.parts);
      if (!sibContacts.horizontalCoaxial) continue;
      const pVol = boxVolume(part.box);
      const hosts = sibContacts.touchingRefs.filter((sib) => {
        if (sib.id === part.id) return false;
        const ovX = overlap1D(part.box.min[0], part.box.max[0], sib.box.min[0], sib.box.max[0]);
        const ovY = overlap1D(part.box.min[1], part.box.max[1], sib.box.min[1], sib.box.max[1]);
        const ovZ = overlap1D(part.box.min[2], part.box.max[2], sib.box.min[2], sib.box.max[2]);
        return ovX > 1.5 && ovY > 3 && ovZ > 1.5 && pVol < boxVolume(sib.box) * 0.7;
      });
      if (hosts.length > 0) {
        sameStepHostByPin.set(part.id, hosts);
        for (const h of hosts) sameStepPinnedHosts.add(h.id);
      }
    }
  }

  const contactsById = new Map<string, ContactSummary>();
  for (const part of step.parts) {
    const extraHosts = sameStepHostByPin.get(part.id);
    const refPool = extraHosts ? [...prevParts, ...extraHosts] : prevParts;
    contactsById.set(part.id, analyzeContacts(part, refPool));
  }

  const candidates: NoticeabilityCandidate[] = [];

  for (const part of step.parts) {
    if (sameStepPinnedHosts.has(part.id)) continue;

    const extraHosts = sameStepHostByPin.get(part.id);
    const contacts = contactsById.get(part.id)!;
    // Must directly attach to the already-built model (or a grounded same-step pin host);
    // pieces resting solely on another new piece in this step belong to an in-step stack.
    if (contacts.touchingRefs.length === 0) continue;

    // Never pull `part` away if another sibling in this step touches `part` and has
    // no direct contact with `prevParts` (pulling `part` would leave that sibling floating),
    // unless `part` itself is a horizontal pin embedding into its grounded same-step host.
    if (!extraHosts) {
      let hasDependentSibling = false;
      let stackedOnSibling = false;
      for (const sib of step.parts) {
        if (sib.id === part.id) continue;
        if (!boxesWithinMargin(part.box, sib.box, CONTACT_EPS)) continue;
        const sibContacts = contactsById.get(sib.id)!;
        if (sibContacts.touchingRefs.length === 0) {
          hasDependentSibling = true;
          break;
        }
        // Check if `sib` vertically supports `part` along the build axis while `part` lacks
        // vertical support from `prevParts` on that same side (i.e. stacked onto a same-step brick).
        const ovX = overlap1D(part.box.min[0], part.box.max[0], sib.box.min[0], sib.box.max[0]);
        const ovZ = overlap1D(part.box.min[2], part.box.max[2], sib.box.min[2], sib.box.max[2]);
        if (ovX > 2 && ovZ > 2) {
          if (
            isBottomView &&
            !contacts.supportedFromAbove &&
            sib.box.min[1] >= part.box.max[1] - CONTACT_EPS &&
            sib.box.min[1] <= part.box.max[1] + SUPPORT_GAP_MAX
          ) {
            stackedOnSibling = true;
            break;
          }
          if (
            !isBottomView &&
            !contacts.supportedFromBelow &&
            part.box.min[1] >= sib.box.max[1] - CONTACT_EPS &&
            part.box.min[1] <= sib.box.max[1] + SUPPORT_GAP_MAX
          ) {
            stackedOnSibling = true;
            break;
          }
        }
      }
      if (hasDependentSibling || stackedOnSibling) continue;
    }

    const s = boxSize(part.box);
    const diag = boxDiag(part.box);
    const vol = boxVolume(part.box);
    const relDiag = diag / builtDiag;
    const maxHoriz = Math.max(s[0], s[2]);
    const minHoriz = Math.min(s[0], s[2]);
    const height = s[1];

    const isStudDrivenLateral = contacts.studPullDir !== null && Math.abs(contacts.studPullDir[1]) < 0.94;
    const isLateral =
      isStudDrivenLateral ||
      (contacts.lateralCount > 0 &&
        !contacts.supportedFromBelow &&
        !contacts.supportedFromAbove);
    const isCoaxialOrLateral = isLateral || contacts.verticalCoaxial || contacts.horizontalCoaxial;

    // 1. Lateral / horizontal insertion or coaxial through-hole/sleeve insertion (pins, axles, bushes, beams, SNOT)
    let score = 0;
    if (isCoaxialOrLateral) {
      // Sideways and coaxial insertions are hard to read from an isometric view without an arrow
      score += 3.5;
    }

    // 2. Partial occlusion from the step's actual camera view
    const occlusion = estimateCameraOcclusion(part.box, prevParts, step.camera.az, step.camera.el);
    if (occlusion >= 0.18) {
      score += 2.2 + occlusion * 2.0;
    }

    // 3. Color camouflage against directly touching existing neighbors
    const colorRefs = contacts.colorTouchingRefs;
    let minColorDist = Infinity;
    for (const ref of colorRefs) {
      const d = perceptualRgbDistance(part.rgb, ref.rgb);
      if (d < minColorDist) minColorDist = d;
    }
    const isSlenderOrModest =
      minHoriz <= 22 ||
      (height <= 10 && minHoriz <= 44 && maxHoriz <= 84 && relDiag < 0.42) ||
      relDiag < 0.30;
    if (
      colorRefs.length > 0 &&
      minColorDist < SAME_COLOR_DIST_THRESHOLD &&
      isSlenderOrModest &&
      prevParts.length >= 4
    ) {
      // Blends visually into adjacent same-color brick(s)
      score += 1.8 + (1 - minColorDist / SAME_COLOR_DIST_THRESHOLD) * 0.8;
    }

    // 4. Truly tiny detail (e.g. 1x1 plate/tile/stud/clip, NOT full-height 1x2 bricks) on a much larger model
    const isTinyPiece = maxHoriz <= 24 && height <= 18 && vol <= 8500;
    if (prevParts.length >= 4 && isTinyPiece && relDiag < 0.22) {
      score += 1.6 + Math.max(0, 0.22 - relDiag) * 4.0;
    }

    if (score >= 1.5) {
      candidates.push({ part, score, contacts, isLateral, isCoaxialOrLateral, extraHosts });
    }
  }

  if (candidates.length === 0) return {};

  // Sort highest noticeability need first (mandatory lateral/coaxial insertions lead)
  candidates.sort(
    (a, b) =>
      (b.isCoaxialOrLateral ? 1 : 0) - (a.isCoaxialOrLateral ? 1 : 0) ||
      b.score - a.score,
  );

  const out: Record<string, AutoPartOffset> = {};
  const accepted: Array<{
    part: PlacementPartInput;
    shiftedBox: PlacementAABB;
    screenRect: ScreenRect2D;
    isCoaxialOrLateral: boolean;
  }> = [];
  const acceptedShiftedObstacles: PlacementPartInput[] = [];

  for (const c of candidates) {
    const cap = c.isCoaxialOrLateral
      ? MAX_SUBSEQUENT_STEP_LATERAL_OFFSETS
      : MAX_SUBSEQUENT_STEP_OFFSETS;
    if (accepted.length >= cap) continue;

    // Never offset two or more physically touching bricks together as a floating cluster
    if (accepted.some((acc) => boxesWithinMargin(c.part.box, acc.part.box, CONTACT_EPS))) {
      continue;
    }

    const extraHostIds = new Set((c.extraHosts ?? []).map((h) => h.id));
    const baseObstacles = c.extraHosts ? [...prevParts, ...c.extraHosts] : prevParts;
    const otherSiblings = step.parts.filter((p) => p.id !== c.part.id && !extraHostIds.has(p.id));

    const { preferred, fallbacks, preferShortestDir } = chooseInsertionDirs(
      c.contacts,
      cameraSide,
      c.isLateral,
      step.camera.az,
      c.part.headedShaftDir,
    );
    const coaxialAxis: 0 | 1 | 2 | null = c.contacts.verticalCoaxial
      ? 1
      : c.contacts.horizontalCoaxial
        ? c.contacts.horizontalCoaxialAxis
        : null;
    const resolved = resolveOffsetAlongAxis(
      c.part,
      preferred,
      fallbacks,
      baseObstacles,
      step.camera,
      c.contacts.touchingRefs,
      [...otherSiblings, ...acceptedShiftedObstacles],
      {
        preferShortestDir,
        studPullDir: c.contacts.studPullDir,
        engagedStudPoints: c.contacts.engagedStudPoints,
        engagedStudTips: c.contacts.engagedStudTips,
        coaxialAxis,
        coaxialHostIds: c.contacts.coaxialHostIds,
      },
    );
    if (!resolved) continue;

    const shiftedBox = shiftBox(c.part.box, resolved.x, resolved.y, resolved.z);
    if (accepted.some((acc) => boxesWithinMargin(shiftedBox, acc.shiftedBox, CONTACT_EPS))) {
      continue;
    }

    // Project shifted piece + its arrow corridor onto 2D orthographic screen plane
    // to prevent nearby offset placements from crowding or occluding each other.
    const liftedScreen = projectBoxToScreen2D(shiftedBox, step.camera.az, step.camera.el);
    const corridorScreen = projectBoxToScreen2D(
      unionBox(c.part.box, shiftedBox),
      step.camera.az,
      step.camera.el,
    );
    let crowdsExisting = false;
    for (const acc of accepted) {
      if (!c.isCoaxialOrLateral) {
        if (screenRectsOverlap(corridorScreen, acc.screenRect, 6)) {
          crowdsExisting = true;
          break;
        }
      } else if (screenRectsOverlap(liftedScreen, acc.screenRect, 2)) {
        // Even for two lateral/coaxial pieces, avoid stacking their lifted silhouettes directly on top of each other
        crowdsExisting = true;
        break;
      }
    }
    if (crowdsExisting) continue;

    out[c.part.id] = resolved;
    accepted.push({
      part: c.part,
      shiftedBox,
      screenRect: c.isCoaxialOrLateral ? liftedScreen : corridorScreen,
      isCoaxialOrLateral: c.isCoaxialOrLateral,
    });
    acceptedShiftedObstacles.push({
      id: `__shifted_${c.part.id}`,
      box: expandBoxMargin(shiftedBox, CONTACT_EPS * 0.5),
      rgb: c.part.rgb,
    });
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
 * Computes half-distance from box center to the outermost stud centers along a
 * horizontal axis (1 stud pitch = 20 LDU). Returns 0 for single-stud or narrower spans.
 */
function studAxisHalfOffset(span: number): number {
  if (span < 32) return 0;
  const studCount = Math.max(2, Math.round(span / 20));
  return Math.min((studCount - 1) * 10, Math.max(0, span * 0.5 - 5));
}

/**
 * Computes crisp, non-clipping placement arrow segment(s) from an offset part
 * back toward its seated destination.
 *
 * On the horizontal plane (XZ), arrows align directly to the center of the stud
 * nearest to the camera and the stud furthest from the camera (based on
 * `cameraAzDeg`):
 *   - 1×1 (single stud): 1 arrow centered on that stud.
 *   - 1×N / N×1 (multi-stud along one horizontal axis): 2 arrows at the nearest
 *     and furthest stud centers along that axis.
 *   - M×N (more than 1 stud wide in both X and Z, e.g. 2×2, 2×4, 2×6, 4×4):
 *     2 arrows placed diagonally at the nearest corner stud and furthest corner
 *     stud relative to the camera.
 */
export function computePlacementArrowSegments(
  box: PlacementAABB,
  offset: readonly [number, number, number],
  arrowTo?: readonly [number, number, number] | null,
  throughGuideTo?: readonly [number, number, number] | null,
  cameraAzDeg = 38,
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

  // Terminate the arrowhead right at the top center of the target stud (4 LDU above
  // the seated entry face `-halfAlong`, matching the official LDraw stud height).
  // For upside-down attachments onto anti-studs (where the part's own 4 LDU studs
  // protrude at `-halfAlong`), `-halfAlong + 4` lands flush on the receiving underside face.
  const studTopDist = -halfAlong + STUD_HEIGHT_LDU;
  let fromDist = mag - halfAlong - 2.0;
  let toDist = studTopDist;
  if (fromDist - toDist < 6) {
    // Small manual nudge fallback: still anchor the tip at the stud top whenever possible
    fromDist = Math.max(mag - halfAlong, studTopDist + 6.0);
  }

  // If a coaxial obstacle tip (e.g. top of a vertical axle inside a bush) or an elevated
  // engaged stud tip (e.g. hanging bracket) was provided, terminate cleanly at that tip.
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
    toDist = studTopDist;
  }

  // Primary movement axis
  const absU = [Math.abs(ux), Math.abs(uy), Math.abs(uz)];
  let primaryAxis = 1;
  if (absU[0] >= absU[1] && absU[0] >= absU[2]) primaryAxis = 0;
  else if (absU[2] >= absU[0] && absU[2] >= absU[1]) primaryAxis = 2;

  // Horizontal camera direction pointing FROM model TOWARD camera
  const azRad = (cameraAzDeg * Math.PI) / 180;
  const camX = Math.sin(azRad);
  const camZ = Math.cos(azRad);
  const sx = camX >= -1e-6 ? 1 : -1;
  const sz = camZ >= -1e-6 ? 1 : -1;

  // Anchor offsets [dx, dy, dz] relative to box.center
  let anchorOffsets: Vec3[];
  if (primaryAxis === 1) {
    // Vertical insertion: align on the horizontal XZ plane to the nearest and furthest stud centers,
    // unless that diagonal projects nearly collinearly in screen X (< 10 LDU, narrower than an arrowhead
    // — e.g. a 2x2 contact viewed near 45° azimuth), in which case use the wider left/right diagonal.
    const hx = studAxisHalfOffset(s[0]);
    const hz = studAxisHalfOffset(s[2]);
    if (hx > 0 && hz > 0) {
      const rxCam = Math.cos(azRad);
      const rzCam = -Math.sin(azRad);
      const sepNearFar = Math.abs(2 * (sx * hx * rxCam + sz * hz * rzCam));
      const sepLeftRight = Math.abs(2 * (sx * hx * rxCam - sz * hz * rzCam));
      if (sepNearFar < 10 && sepLeftRight > sepNearFar) {
        anchorOffsets = [
          [sx * hx, 0, -sz * hz],
          [-sx * hx, 0, sz * hz],
        ];
      } else {
        anchorOffsets = [
          [sx * hx, 0, sz * hz],
          [-sx * hx, 0, -sz * hz],
        ];
      }
    } else if (hx > 0 || hz > 0) {
      anchorOffsets = [
        [sx * hx, 0, sz * hz],
        [-sx * hx, 0, -sz * hz],
      ];
    } else {
      anchorOffsets = [[0, 0, 0]];
    }
  } else {
    // Lateral horizontal insertion (±X or ±Z): align on the perpendicular stud plane
    // (horizPerpAxis × Y) to the nearest and furthest stud centers (diagonal when > 1 stud in both axes).
    const horizPerpAxis = primaryAxis === 0 ? 2 : 0;
    const hPerp = studAxisHalfOffset(s[horizPerpAxis]);
    const hy = studAxisHalfOffset(s[1]);
    const sHoriz = horizPerpAxis === 0 ? sx : sz;
    if (hPerp > 0 || hy > 0) {
      const nearOff: Vec3 = [0, hy, 0];
      const farOff: Vec3 = [0, -hy, 0];
      nearOff[horizPerpAxis] = sHoriz * hPerp;
      farOff[horizPerpAxis] = -sHoriz * hPerp;
      anchorOffsets = [nearOff, farOff];
    } else {
      anchorOffsets = [[0, 0, 0]];
    }
  }

  const c = box.center;
  const segments: PlacementArrowSegment[] = anchorOffsets.map((off) => {
    const bx = c[0] + off[0];
    const by = c[1] + off[1];
    const bz = c[2] + off[2];
    return {
      from: [
        bx + ux * fromDist,
        by + uy * fromDist,
        bz + uz * fromDist,
      ],
      to: [
        bx + ux * toDist,
        by + uy * toDist,
        bz + uz * toDist,
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
      for (const off of anchorOffsets) {
        const bx = c[0] + off[0];
        const by = c[1] + off[1];
        const bz = c[2] + off[2];
        segments.push({
          from: [
            bx + ux * toDist,
            by + uy * toDist,
            bz + uz * toDist,
          ],
          to: [
            bx + ux * projGuide,
            by + uy * projGuide,
            bz + uz * projGuide,
          ],
          isGuideLine: true,
        });
      }
    }
  }

  return segments;
}

export interface PlacementArrowSpec {
  box: PlacementAABB;
  offset: [number, number, number];
  arrowTo?: [number, number, number] | null;
  throughGuideTo?: [number, number, number] | null;
  rgb: [number, number, number];
}

export interface PlacementArrowGeometryOptions {
  style?: 'flat' | '3d';
  outlines?: boolean;
}

export interface BuiltPlacementArrowGeometry {
  triPos: Float32Array;
  triNorm: Float32Array;
  triCol: Uint8Array;
  linePos: Float32Array;
  lineCol: Uint8Array;
}

/**
 * Builds render-ready WebGL triangle & optional outline buffers for placement
 * arrows from camera-aware stud-aligned segments.
 *
 * - `'flat'` (default): camera-facing 2D flat ribbon arrows with zero 3D bevel/cone
 *   distortion and crisp LEGO-manual proportions.
 * - `'3d'`: cylindrical shaft + conical arrowhead geometry.
 * - `outlines`: when false (default), emits zero outline edges.
 */
export function buildPlacementArrowGeometry(
  specs: ReadonlyArray<PlacementArrowSpec>,
  azDeg: number,
  elDeg: number,
  options: PlacementArrowGeometryOptions = {},
): BuiltPlacementArrowGeometry {
  const style = options.style === '3d' ? '3d' : 'flat';
  const outlines = Boolean(options.outlines);

  const triPosArr: number[] = [];
  const triNormArr: number[] = [];
  const triColArr: number[] = [];
  const linePosArr: number[] = [];
  const lineColArr: number[] = [];

  if (!specs || specs.length === 0) {
    return {
      triPos: new Float32Array(0),
      triNorm: new Float32Array(0),
      triCol: new Uint8Array(0),
      linePos: new Float32Array(0),
      lineCol: new Uint8Array(0),
    };
  }

  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  const vx = Math.sin(az) * Math.cos(el);
  const vy = Math.sin(el);
  const vz = Math.cos(az) * Math.cos(el);
  const rxCam = Math.cos(az);
  const ryCam = 0;
  const rzCam = -Math.sin(az);
  const ink: [number, number, number] = [24, 24, 28];

  const pushTri = (
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    c: readonly [number, number, number],
    n: readonly [number, number, number],
    col: readonly [number, number, number],
  ) => {
    triPosArr.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    triNormArr.push(n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2]);
    triColArr.push(
      col[0], col[1], col[2], 255,
      col[0], col[1], col[2], 255,
      col[0], col[1], col[2], 255,
    );
  };

  const pushEdge = (
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    col: readonly [number, number, number],
    alpha = 255,
  ) => {
    linePosArr.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    lineColArr.push(col[0], col[1], col[2], alpha, col[0], col[1], col[2], alpha);
  };

  const viewNorm: [number, number, number] = [vx, vy, vz];

  for (let si = 0; si < specs.length; si++) {
    const spec = specs[si];
    const segs = computePlacementArrowSegments(
      spec.box,
      spec.offset,
      spec.arrowTo || null,
      spec.throughGuideTo || null,
      azDeg,
    );
    const col = spec.rgb;

    for (let k = 0; k < segs.length; k++) {
      const seg = segs[k];
      const s = seg.from;
      const t = seg.to;
      const dx = t[0] - s[0];
      const dy = t[1] - s[1];
      const dz = t[2] - s[2];
      const len = Math.hypot(dx, dy, dz);
      if (len < 4) continue;
      const ux = dx / len;
      const uy = dy / len;
      const uz = dz / len;

      if (seg.isGuideLine) {
        if (style === 'flat') {
          let wx = vy * uz - vz * uy;
          let wy = vz * ux - vx * uz;
          let wz = vx * uy - vy * ux;
          const wl = Math.hypot(wx, wy, wz);
          if (wl < 1e-4) {
            wx = rxCam; wy = ryCam; wz = rzCam;
          } else {
            wx /= wl; wy /= wl; wz /= wl;
          }
          const gw = 0.85;
          const sL: Vec3 = [s[0] - wx * gw, s[1] - wy * gw, s[2] - wz * gw];
          const sR: Vec3 = [s[0] + wx * gw, s[1] + wy * gw, s[2] + wz * gw];
          const tL: Vec3 = [t[0] - wx * gw, t[1] - wy * gw, t[2] - wz * gw];
          const tR: Vec3 = [t[0] + wx * gw, t[1] + wy * gw, t[2] + wz * gw];
          pushTri(sL, tR, sR, viewNorm, col);
          pushTri(sL, tL, tR, viewNorm, col);
          if (outlines) {
            pushEdge(sL, tL, ink, 210);
            pushEdge(sR, tR, ink, 210);
          }
        } else {
          pushEdge(s, t, col, 255);
        }
        continue;
      }

      if (style === 'flat') {
        // Screen-aligned width vector perpendicular to BOTH view ray V and arrow axis u
        let wx = vy * uz - vz * uy;
        let wy = vz * ux - vx * uz;
        let wz = vx * uy - vy * ux;
        const wl = Math.hypot(wx, wy, wz);
        if (wl < 1e-4) {
          wx = rxCam; wy = ryCam; wz = rzCam;
        } else {
          wx /= wl; wy /= wl; wz /= wl;
        }

        const headLen = Math.min(9.5, len * 0.44);
        const shaftEnd: Vec3 = [t[0] - ux * headLen, t[1] - uy * headLen, t[2] - uz * headLen];
        const shaftHalfW = 1.6;
        const headHalfW = 4.6;

        const sL: Vec3 = [s[0] - wx * shaftHalfW, s[1] - wy * shaftHalfW, s[2] - wz * shaftHalfW];
        const sR: Vec3 = [s[0] + wx * shaftHalfW, s[1] + wy * shaftHalfW, s[2] + wz * shaftHalfW];
        const eL: Vec3 = [shaftEnd[0] - wx * shaftHalfW, shaftEnd[1] - wy * shaftHalfW, shaftEnd[2] - wz * shaftHalfW];
        const eR: Vec3 = [shaftEnd[0] + wx * shaftHalfW, shaftEnd[1] + wy * shaftHalfW, shaftEnd[2] + wz * shaftHalfW];
        const hL: Vec3 = [shaftEnd[0] - wx * headHalfW, shaftEnd[1] - wy * headHalfW, shaftEnd[2] - wz * headHalfW];
        const hR: Vec3 = [shaftEnd[0] + wx * headHalfW, shaftEnd[1] + wy * headHalfW, shaftEnd[2] + wz * headHalfW];

        pushTri(sL, eR, sR, viewNorm, col);
        pushTri(sL, eL, eR, viewNorm, col);
        pushTri(hL, t, hR, viewNorm, col);

        if (outlines) {
          pushEdge(sL, sR, ink, 220);
          pushEdge(sR, eR, ink, 220);
          pushEdge(eR, hR, ink, 220);
          pushEdge(hR, t, ink, 220);
          pushEdge(t, hL, ink, 220);
          pushEdge(hL, eL, ink, 220);
          pushEdge(eL, sL, ink, 220);
        }
      } else {
        // Classic 3D cylindrical shaft + conical arrowhead
        const rx = Math.abs(uy) < 0.9 ? 0 : 1;
        const ry = Math.abs(uy) < 0.9 ? 1 : 0;
        const rz = 0;
        let bx = uy * rz - uz * ry;
        let by = uz * rx - ux * rz;
        let bz = ux * ry - uy * rx;
        const bl = Math.hypot(bx, by, bz) || 1;
        bx /= bl; by /= bl; bz /= bl;
        const cx = by * uz - bz * uy;
        const cy = bz * ux - bx * uz;
        const cz = bx * uy - by * ux;

        const headLen = Math.min(9.5, len * 0.42);
        const shaftEnd: Vec3 = [t[0] - ux * headLen, t[1] - uy * headLen, t[2] - uz * headLen];
        const segs3d = 10;
        const shaftR = 1.45;
        const headR = 4.4;
        const ring = (center: Vec3, r: number, ang: number): Vec3 => [
          center[0] + (Math.cos(ang) * bx + Math.sin(ang) * cx) * r,
          center[1] + (Math.cos(ang) * by + Math.sin(ang) * cy) * r,
          center[2] + (Math.cos(ang) * bz + Math.sin(ang) * cz) * r,
        ];
        const backNorm: Vec3 = [-ux, -uy, -uz];
        for (let i = 0; i < segs3d; i++) {
          const a0 = (i / segs3d) * Math.PI * 2;
          const a1 = ((i + 1) / segs3d) * Math.PI * 2;
          const am = (a0 + a1) * 0.5;
          const sn: Vec3 = [
            Math.cos(am) * bx + Math.sin(am) * cx,
            Math.cos(am) * by + Math.sin(am) * cy,
            Math.cos(am) * bz + Math.sin(am) * cz,
          ];
          const s0 = ring(s, shaftR, a0);
          const s1 = ring(s, shaftR, a1);
          const e0 = ring(shaftEnd, shaftR, a0);
          const e1 = ring(shaftEnd, shaftR, a1);
          pushTri(s0, s1, e1, sn, col);
          pushTri(s0, e1, e0, sn, col);
          const h0 = ring(shaftEnd, headR, a0);
          const h1 = ring(shaftEnd, headR, a1);
          pushTri(h0, h1, t, sn, col);
          pushTri(shaftEnd, h1, h0, backNorm, col);
          if (outlines) {
            pushEdge(h0, h1, ink, 210);
          }
        }
        if (outlines) {
          for (const railAng of [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]) {
            pushEdge(ring(s, shaftR, railAng), ring(shaftEnd, shaftR, railAng), ink, 200);
            pushEdge(ring(shaftEnd, headR, railAng), t, ink, 210);
          }
        }
      }
    }
  }

  return {
    triPos: new Float32Array(triPosArr),
    triNorm: new Float32Array(triNormArr),
    triCol: new Uint8Array(triColArr),
    linePos: new Float32Array(linePosArr),
    lineCol: new Uint8Array(lineColArr),
  };
}

function parseHexToRgb255(hex: string): [number, number, number] {
  const raw = (hex || DEFAULT_ARROW_COLOR).replace('#', '').trim();
  const valid = /^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(raw) ? raw : DEFAULT_ARROW_COLOR.replace('#', '');
  const full = valid.length === 3
    ? `${valid[0]}${valid[0]}${valid[1]}${valid[1]}${valid[2]}${valid[2]}`
    : valid.slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
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

/**
 * Generates razor-thin dual alignment projection lines (without bulky 3D cones)
 * for compact multi-pin/dual-stud brackets attaching laterally onto dense frames
 * (matching 75192 p. 55 Step 76). Returns `null` when standard arrows are preferable.
 */
export function computePrecisionAlignmentLines(
  box: PlacementAABB,
  offset: readonly [number, number, number],
): PlacementArrowSegment[] | null {
  const ox = offset[0];
  const oy = offset[1];
  const oz = offset[2];
  const mag = Math.hypot(ox, oy, oz);
  if (mag < 12) return null;

  const s = boxSize(box);
  const maxDim = Math.max(s[0], s[1], s[2]);
  // Only compact brackets/clips/hinges (<= 48 LDU) attaching laterally
  if (maxDim > 48 || Math.abs(oy) >= Math.hypot(ox, oz)) return null;

  const ux = ox / mag;
  const uy = oy / mag;
  const uz = oz / mag;
  const absU = [Math.abs(ux), Math.abs(uy), Math.abs(uz)];
  let primaryAxis = 0;
  if (absU[1] >= absU[0] && absU[1] >= absU[2]) primaryAxis = 1;
  else if (absU[2] >= absU[0] && absU[2] >= absU[1]) primaryAxis = 2;

  const perpAxes = [0, 1, 2].filter((k) => k !== primaryAxis);
  const longAxis = s[perpAxes[0]] >= s[perpAxes[1]] ? perpAxes[0] : perpAxes[1];
  const longSpan = s[longAxis];
  // Require at least 2-stud span (~30 LDU) so two parallel alignment lines are clearly separated
  if (longSpan < 28) return null;

  const inset = Math.max(6, longSpan * 0.34);
  const c = box.center;
  const halfAlong = 0.5 * (Math.abs(ux) * s[0] + Math.abs(uy) * s[1] + Math.abs(uz) * s[2]);
  const fromDist = Math.max(4, mag - halfAlong - 1);
  const toDist = 0;

  return [-inset, inset].map((lat) => {
    const base: Vec3 = [c[0], c[1], c[2]];
    base[longAxis] += lat;
    return {
      from: [base[0] + ux * fromDist, base[1] + uy * fromDist, base[2] + uz * fromDist],
      to: [base[0] + ux * toDist, base[1] + uy * toDist, base[2] + uz * toDist],
      isGuideLine: true,
      isPrecisionLine: true,
    };
  });
}

/**
 * Pure geometric through-hole guide detector: when a slender pin, axle, or bar
 * is inserted laterally and penetrates a thicker host beam/brick/frame, computes
 * an alignment guide endpoint extending cleanly past the far exit face of the host.
 */
export function detectThroughHoleGuideTarget(
  partBox: PlacementAABB,
  offset: readonly [number, number, number],
  existingBoxes: ReadonlyArray<PlacementAABB>,
): [number, number, number] | null {
  if (!existingBoxes.length) return null;
  const [ox, oy, oz] = offset;
  if (Math.abs(oy) >= 1 || Math.hypot(ox, oz) < 10) return null;

  const axis: 0 | 2 = Math.abs(ox) >= Math.abs(oz) ? 0 : 2;
  const sign = offset[axis] > 0 ? 1 : -1;
  const s = boxSize(partBox);
  const perpAxes = axis === 0 ? ([1, 2] as const) : ([0, 1] as const);

  // Require slender pin/axle/bar geometry along insertion axis
  if (s[axis] < 18 || Math.max(s[perpAxes[0]], s[perpAxes[1]]) > 24) return null;

  let farFace: number | null = null;
  for (const ob of existingBoxes) {
    if (!boxesIntersectStrict(partBox, ob, 1.0)) continue;
    const os = boxSize(ob);
    if (os[axis] < 10) continue;
    // Host must be larger than the pin/axle on at least one perpendicular axis (beam/frame/brick)
    if (os[perpAxes[0]] <= s[perpAxes[0]] + 4 && os[perpAxes[1]] <= s[perpAxes[1]] + 4) continue;
    const exitFace = sign > 0 ? ob.min[axis] : ob.max[axis];
    if (farFace === null || (sign > 0 ? exitFace < farFace : exitFace > farFace)) {
      farFace = exitFace;
    }
  }
  if (farFace === null) return null;

  const tip: [number, number, number] = [partBox.center[0], partBox.center[1], partBox.center[2]];
  tip[axis] = sign > 0 ? Math.min(partBox.min[axis], farFace) - 14 : Math.max(partBox.max[axis], farFace) + 14;
  return tip;
}



