import {
  classifyMinifigGroupKind,
  classifyMinifigLeafRole,
  mat3Multiply,
  mat3Orthonormalize,
  mat3Transpose,
  mat3Vec,
  R_IDENTITY,
  type Mat3,
  type RuntimePart,
  type Vec3,
  type WorldBox,
} from './minifigPose';

export type MinifigStepStyle = 'exploded' | 'sequential' | 'classic';

export function normalizeMinifigStepStyle(raw: unknown): MinifigStepStyle {
  if (raw === 'exploded' || raw === 'sequential' || raw === 'classic') return raw;
  return 'exploded';
}

export interface MinifigPartOffset {
  x: number;
  y: number;
  z: number;
  arrow?: boolean;
}

export interface MinifigArrow3D {
  from: Vec3;
  to: Vec3;
  color: 'red' | 'blue' | 'dark';
  kind: 'double_hip' | 'single' | 'accessory';
}

export interface MinifigAccessoryGroup {
  id: string;
  parts: RuntimePart[];
  isMultiPart: boolean;
  side: 'left' | 'right' | 'center';
  box: WorldBox;
  /** Bottom-to-top (or along primary axis) exploded offsets for inside a subassembly callout box. */
  subassemblyOffsets: Record<string, MinifigPartOffset>;
  /** 3D arrows inside the multi-part accessory subassembly callout box. */
  subassemblyArrows: MinifigArrow3D[];
  /**
   * Front-facing preview of the accessory for the "before attaching" callout box / pill.
   * The primary part's world rotation is removed so the piece faces the camera in its
   * native LDraw orientation; the assembled figure keeps using the posed `parts`.
   */
  display: MinifigAccessoryDisplay;
}

export interface MinifigAccessoryDisplay {
  parts: RuntimePart[];
  box: WorldBox;
  subassemblyOffsets: Record<string, MinifigPartOffset>;
  subassemblyArrows: MinifigArrow3D[];
}

export interface DecomposedMinifig {
  legs: RuntimePart[];
  torso: RuntimePart[];
  cape: RuntimePart[];
  neckwear: RuntimePart[];
  head: RuntimePart[];
  headgear: RuntimePart[];
  accessories: MinifigAccessoryGroup[];
  bodyBox: WorldBox;
  fullBox: WorldBox;
  /**
   * Vertical neck/stud centerline (x, z) shared by every stacked body layer. Derived from the
   * bare torso body (arms & hands excluded) so raised/posed arms never skew stacking arrows.
   */
  axis: { x: number; z: number };
  /** Box of the bare torso body (no arms/hands); its max Y is the top of the neck stud. */
  torsoCoreBox: WorldBox | null;
}

export interface MinifigExplodedLayer {
  role: 'legs' | 'torso' | 'cape' | 'neckwear' | 'head' | 'headgear';
  parts: RuntimePart[];
  offsetY: number;
  box: WorldBox;
}

export interface MinifigExplodedPlan {
  style: 'exploded';
  decomposed: DecomposedMinifig;
  /** Vertical body stack parts rendered inside the left white exploded callout box. */
  stackParts: RuntimePart[];
  /** Per-part vertical offsets (in canonical LDU) for the exploded stack. */
  stackOffsets: Record<string, MinifigPartOffset>;
  /** Ordered vertical layers from bottom to top. */
  stackLayers: MinifigExplodedLayer[];
  /** Exact 3D red downward arrows between consecutive exploded body layers. */
  stackArrows: MinifigArrow3D[];
  /** Full standing assembled minifigure parts rendered on the right. */
  assembledParts: RuntimePart[];
  /** Optional handheld accessory callout boxes rendered above the assembled minifigure. */
  accessoryCallouts: MinifigAccessoryGroup[];
}

export interface MinifigSequentialStage {
  stepNumber: number;
  kind:
    | 'legs_torso'
    | 'cape'
    | 'neckwear_head'
    | 'head'
    | 'headgear'
    | 'accessory_subassembly'
    | 'accessory_single'
    | 'celebration';
  label: string;
  /** Parts already assembled at canonical offset (dy = 0). */
  baseParts: RuntimePart[];
  /** Newly added parts in this stage (may be vertically offset above baseParts). */
  addedParts: RuntimePart[];
  /** Per-part offsets in canonical LDU for newly added parts. */
  partOffsets: Record<string, MinifigPartOffset>;
  /** Exact 3D blue downward arrows between floating added parts and their attachment points. */
  arrows: MinifigArrow3D[];
  /** Present on multi-part accessory stages (e.g., lightsaber blade + hilt pill above figure). */
  accessoryPill: MinifigAccessoryGroup | null;
  /** True on the final completion stage (renders starburst rays + outline stars). */
  isCelebration: boolean;
}

export interface MinifigSequentialPlan {
  style: 'sequential';
  decomposed: DecomposedMinifig;
  stages: MinifigSequentialStage[];
  /** Shared world-space camera center so all stages share an identical foot baseline. */
  sharedCenter: Vec3;
  /** Shared orthographic half-height so every stage renders at identical physical scale. */
  sharedHalfH: number;
  /** True when at least one stage includes a tall above-hand accessory subassembly pill. */
  hasTallAccessoryPill: boolean;
}

export interface MinifigSeqPageSlice {
  start: number;
  end: number;
  cols: number;
  pageIdx: number;
  pageCount: number;
}

const CAPE_PART_ID_RE =
  /^(?:bl_)?(?:522|50231|99464|56630|2524|92590|30133|3838|4498|15406|24135|19859|35635|64802)(?:[^0-9]|$)/i;
const CAPE_NAME_RE =
  /\b(cape|cloak|wing|wings|backpack|jetpack|airtank|air\s*tank|quiver|scabbard|shell|mantle|trenchcoat)\b/i;

const NECKWEAR_PART_ID_RE =
  /^(?:bl_)?(?:61976|2587|42446|98384|15499|88295|93565|24505|79766|26073|3840|3878|41637|88292|2526|15407)(?:[^0-9]|$)/i;
const NECKWEAR_NAME_RE =
  /\b(collar|armor|armour|pauldron|epaulette|scarf|neckwear|neck\s*bracket|chestplate|life\s*vest|vest|bib|bandolier|harness|suspenders|satchel|messenger\s*bag|crossbody|shoulder\s*bag|bowtie|bow\s*tie|tie|necklace|medallion)\b/i;

function normId(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^ldraw\//, '')
    .replace(/^parts\//, '')
    .replace(/^p\//, '')
    .replace(/\.dat$/i, '')
    .replace(/-bl$/, '');
}

function mergeBoxes(boxes: WorldBox[]): WorldBox {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    for (let k = 0; k < 3; k++) {
      if (b.min[k] < min[k]) min[k] = b.min[k];
      if (b.max[k] > max[k]) max[k] = b.max[k];
    }
  }
  if (!isFinite(min[0])) {
    return { min: [-12, 0, -8], max: [12, 40, 8], center: [0, 20, 0] };
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

function boxDistance(a: WorldBox, b: WorldBox): number {
  const dx = Math.max(a.min[0] - b.max[0], 0, b.min[0] - a.max[0]);
  const dy = Math.max(a.min[1] - b.max[1], 0, b.min[1] - a.max[1]);
  const dz = Math.max(a.min[2] - b.max[2], 0, b.min[2] - a.max[2]);
  return Math.hypot(dx, dy, dz);
}

function pointToBoxDist(pt: Vec3, b: WorldBox): number {
  const dx = Math.max(b.min[0] - pt[0], 0, pt[0] - b.max[0]);
  const dy = Math.max(b.min[1] - pt[1], 0, pt[1] - b.max[1]);
  const dz = Math.max(b.min[2] - pt[2], 0, pt[2] - b.max[2]);
  return Math.hypot(dx, dy, dz);
}

interface SubassemblyLayout {
  ordered: RuntimePart[];
  box: WorldBox;
  subassemblyOffsets: Record<string, MinifigPartOffset>;
  subassemblyArrows: MinifigArrow3D[];
}

/** Explodes a (possibly multi-part) accessory bottom-to-top (or along X when wider than tall). */
function layoutSubassembly(parts: RuntimePart[], partBoxes: Map<RuntimePart, WorldBox>): SubassemblyLayout {
  const groupBox = mergeBoxes(parts.map((p) => partBoxes.get(p)!));
  const subassemblyOffsets: Record<string, MinifigPartOffset> = {};
  const subassemblyArrows: MinifigArrow3D[] = [];

  if (parts.length <= 1) {
    return { ordered: parts, box: groupBox, subassemblyOffsets, subassemblyArrows };
  }

  // Sort constituent parts bottom-to-top along +Y (or along dominant axis if wider than tall)
  const spanX = groupBox.max[0] - groupBox.min[0];
  const spanY = groupBox.max[1] - groupBox.min[1];
  const spanZ = groupBox.max[2] - groupBox.min[2];
  const isVertical = spanY >= Math.max(spanX, spanZ) * 0.65;

  const ordered = [...parts].sort((a, b) => {
    const ba = partBoxes.get(a)!;
    const bb = partBoxes.get(b)!;
    return isVertical ? ba.min[1] - bb.min[1] : ba.min[0] - bb.min[0];
  });

  const gap = 22;
  let prevTop = isVertical ? partBoxes.get(ordered[0])!.max[1] : partBoxes.get(ordered[0])!.max[0];
  let prevShift = 0;

  for (let i = 1; i < ordered.length; i++) {
    const cur = ordered[i];
    const cb = partBoxes.get(cur)!;
    const prev = ordered[i - 1];
    const pb = partBoxes.get(prev)!;

    if (isVertical) {
      const shiftY = Math.max(prevShift + 16, prevTop + gap - cb.min[1]);
      subassemblyOffsets[cur.id] = { x: 0, y: shiftY, z: 0, arrow: false };
      const ax = (pb.center[0] + cb.center[0]) / 2;
      const az = (pb.center[2] + cb.center[2]) / 2;
      subassemblyArrows.push({
        from: [ax, cb.min[1] + shiftY - 2, az],
        to: [ax, prevTop + 2, az],
        color: 'blue',
        kind: 'accessory',
      });
      prevTop = cb.max[1] + shiftY;
      prevShift = shiftY;
    } else {
      const shiftX = Math.max(prevShift + 16, prevTop + gap - cb.min[0]);
      subassemblyOffsets[cur.id] = { x: shiftX, y: 0, z: 0, arrow: false };
      const ay = (pb.center[1] + cb.center[1]) / 2;
      const az = (pb.center[2] + cb.center[2]) / 2;
      subassemblyArrows.push({
        from: [cb.min[0] + shiftX - 2, ay, az],
        to: [prevTop + 2, ay, az],
        color: 'blue',
        kind: 'accessory',
      });
      prevTop = cb.max[0] + shiftX;
      prevShift = shiftX;
    }
  }

  return { ordered, box: groupBox, subassemblyOffsets, subassemblyArrows };
}

function boxVolume(b: WorldBox): number {
  return Math.max(0, b.max[0] - b.min[0]) * Math.max(0, b.max[1] - b.min[1]) * Math.max(0, b.max[2] - b.min[2]);
}

function rotateClonedLeaf(leaf: RuntimePart, pivot: Vec3, rot: Mat3): RuntimePart {
  const d = mat3Vec(rot, leaf.x - pivot[0], leaf.y - pivot[1], leaf.z - pivot[2]);
  return {
    ...leaf,
    x: pivot[0] + d[0],
    y: pivot[1] + d[1],
    z: pivot[2] + d[2],
    m: mat3Multiply(rot, (leaf.m as Mat3 | undefined) || R_IDENTITY),
  };
}

/**
 * Returns cloned accessory parts rotated so the primary (largest) part is shown in its
 * native LDraw orientation, i.e. facing the camera (+Z) and upright. All other parts of a
 * multi-part accessory keep their exact relative placement. Ids are preserved so offsets
 * computed on the display parts can be keyed the same way as the posed parts.
 */
export function buildFrontFacingAccessoryParts(
  parts: RuntimePart[],
  computeBox: (part: RuntimePart) => WorldBox,
): RuntimePart[] {
  if (parts.length === 0) return [];
  let primary = parts[0];
  let bestVol = -1;
  for (const p of parts) {
    const v = boxVolume(computeBox(p));
    if (v > bestVol) {
      bestVol = v;
      primary = p;
    }
  }
  // For composite parts, the primary leaf orientation is the composite's first leaf (or itself)
  const primaryLeaf = primary.children && primary.children.length > 0 ? primary.children[0] : primary;
  const primaryRot = mat3Orthonormalize((primaryLeaf.m as Mat3 | undefined) || R_IDENTITY);
  const unRot = mat3Transpose(primaryRot);
  const pivot: Vec3 = [primaryLeaf.x, primaryLeaf.y, primaryLeaf.z];

  return parts.map((p) => {
    const rotated = rotateClonedLeaf(p, pivot, unRot);
    if (p.children && p.children.length > 0) {
      rotated.children = p.children.map((ch) => rotateClonedLeaf(ch, pivot, unRot));
    }
    return rotated;
  });
}

function buildAccessorySubassembly(
  parts: RuntimePart[],
  partBoxes: Map<RuntimePart, WorldBox>,
  groupIdx: number,
  bodyCenterX: number,
  computeBox: (part: RuntimePart) => WorldBox,
): MinifigAccessoryGroup {
  const world = layoutSubassembly(parts, partBoxes);
  const groupBox = world.box;
  const side: 'left' | 'right' | 'center' =
    groupBox.center[0] < bodyCenterX - 4
      ? 'right' // viewer-left / minifig right hand
      : groupBox.center[0] > bodyCenterX + 4
        ? 'left' // viewer-right / minifig left hand
        : 'center';

  // Front-facing "before attaching" preview: un-rotate so the piece is recognizable
  const displayParts = buildFrontFacingAccessoryParts(world.ordered, computeBox);
  const displayBoxes = new Map<RuntimePart, WorldBox>();
  for (const dp of displayParts) displayBoxes.set(dp, computeBox(dp));
  const displayLayout = layoutSubassembly(displayParts, displayBoxes);

  return {
    id: `acc_${groupIdx + 1}`,
    parts: world.ordered,
    isMultiPart: parts.length > 1,
    side,
    box: groupBox,
    subassemblyOffsets: world.subassemblyOffsets,
    subassemblyArrows: world.subassemblyArrows,
    display: {
      parts: displayLayout.ordered,
      box: displayLayout.box,
      subassemblyOffsets: displayLayout.subassemblyOffsets,
      subassemblyArrows: displayLayout.subassemblyArrows,
    },
  };
}

/**
 * Computes the bare torso body box (arms & hands excluded) so the stacking centerline and the
 * neck-stud top are not skewed by posed/raised arms or hand-held props.
 */
function computeTorsoCoreBox(
  torso: RuntimePart[],
  resolveName: (partId: string) => string,
  computeBox: (part: RuntimePart) => WorldBox,
): WorldBox | null {
  if (torso.length === 0) return null;
  // Torso may be one composite (torso + arms + hands as children) or flat separate parts
  const allLeaves: RuntimePart[] = [];
  for (const tp of torso) {
    if (tp.children && tp.children.length > 0) allLeaves.push(...tp.children);
    else allLeaves.push(tp);
  }
  const roles = allLeaves.map((lf) => classifyMinifigLeafRole(lf.p, resolveName(lf.p)));
  const core = allLeaves.filter((_, i) => roles[i] === 'torso');
  const nonLimb = allLeaves.filter((_, i) => roles[i] !== 'arm_r' && roles[i] !== 'arm_l' && roles[i] !== 'hand');
  const leaves = core.length > 0 ? core : nonLimb.length > 0 ? nonLimb : allLeaves;
  return mergeBoxes(leaves.map((lf) => computeBox(lf)));
}

/**
 * Classifies all canonical upright minifigure parts into official LEGO assembly layers:
 * legs, torso, cape/back, neckwear/collar, head, headgear, and clustered handheld accessories.
 */
export function decomposeMinifigParts(
  canonicalParts: RuntimePart[],
  resolveName: (partId: string) => string,
  computeBox: (part: RuntimePart) => WorldBox,
): DecomposedMinifig {
  const legs: RuntimePart[] = [];
  const torso: RuntimePart[] = [];
  const cape: RuntimePart[] = [];
  const neckwear: RuntimePart[] = [];
  const head: RuntimePart[] = [];
  const headgear: RuntimePart[] = [];
  const rawAccessories: RuntimePart[] = [];

  const partBoxes = new Map<RuntimePart, WorldBox>();
  for (const p of canonicalParts) {
    partBoxes.set(p, computeBox(p));
  }

  // Pass 1: Extract core body groups (legs, torso, head)
  const remainder: RuntimePart[] = [];
  for (const p of canonicalParts) {
    const kind = classifyMinifigGroupKind(p, resolveName);
    if (kind === 'legs') {
      legs.push(p);
    } else if (kind === 'torso') {
      torso.push(p);
    } else if (kind === 'head') {
      head.push(p);
    } else {
      remainder.push(p);
    }
  }

  const legsBox = legs.length > 0 ? mergeBoxes(legs.map((p) => partBoxes.get(p)!)) : null;
  const torsoBox = torso.length > 0 ? mergeBoxes(torso.map((p) => partBoxes.get(p)!)) : null;
  const headBox = head.length > 0 ? mergeBoxes(head.map((p) => partBoxes.get(p)!)) : null;

  // Collect hand positions from torso leaves so handheld props are distinguished from neck/head wearables
  const handPoints: Vec3[] = [];
  for (const tp of torso) {
    const leaves = tp.children && tp.children.length > 0 ? tp.children : [tp];
    for (const lf of leaves) {
      if (classifyMinifigLeafRole(lf.p, resolveName(lf.p)) === 'hand') {
        handPoints.push([lf.x, lf.y, lf.z]);
      }
    }
  }

  // Neck/stud centerline from the bare torso body so posed arms don't skew it
  const torsoCoreBox = computeTorsoCoreBox(torso, resolveName, computeBox);
  const axisBox = torsoCoreBox ?? torsoBox;
  const bodyCenterX = axisBox ? axisBox.center[0] : headBox ? headBox.center[0] : legsBox ? legsBox.center[0] : 0;
  const bodyCenterZ = axisBox ? axisBox.center[2] : headBox ? headBox.center[2] : legsBox ? legsBox.center[2] : 0;

  // Pass 2: Classify wearables (cape, neckwear, headgear) vs handheld accessories
  for (const p of remainder) {
    const k = normId(p.p);
    const name = (resolveName(p.p) || '').toLowerCase();
    const box = partBoxes.get(p)!;
    const leafRole = classifyMinifigLeafRole(p.p, name);
    const horizDist = Math.hypot(box.center[0] - bodyCenterX, box.center[2] - bodyCenterZ);
    const distToNearestHand =
      handPoints.length > 0 ? Math.min(...handPoints.map((hp) => pointToBoxDist(hp, box))) : Infinity;

    // 1. Explicit cape / wings / backpack / quiver
    if (CAPE_PART_ID_RE.test(k) || CAPE_NAME_RE.test(name)) {
      cape.push(p);
      continue;
    }

    // 2. Explicit neckwear / collar / armor / scarf / crossbody shoulder bag
    if (NECKWEAR_PART_ID_RE.test(k) || NECKWEAR_NAME_RE.test(name)) {
      neckwear.push(p);
      continue;
    }

    // 3. Explicit headgear (hair, helmet, hat, visor, headphones, glasses, crown)
    if (leafRole === 'headgear') {
      // Beards mounted under the head belong in neckwear so they assemble before/with the head
      if (/\bbeard\b/i.test(name) && headBox && box.center[1] < headBox.center[1] - 2) {
        neckwear.push(p);
      } else {
        headgear.push(p);
      }
      continue;
    }

    // 4. Geometric fallback for unrecognized custom parts:
    // 4a. Thin back-mounted cape directly behind torso
    if (
      torsoBox &&
      horizDist <= 22 &&
      box.max[2] - box.min[2] <= 14 &&
      box.max[2] <= torsoBox.min[2] + 8 &&
      box.max[1] >= torsoBox.center[1]
    ) {
      cape.push(p);
      continue;
    }

    // 4b. Handheld prop near a hand (and off-center from head/neck centerline)
    const isNearHand = distToNearestHand <= 14 && Math.abs(box.center[0] - bodyCenterX) >= 8;
    if (isNearHand) {
      rawAccessories.push(p);
      continue;
    }

    // 4c. Centered above head -> headgear
    if (headBox && horizDist <= 22 && box.center[1] >= headBox.center[1] + 2) {
      headgear.push(p);
      continue;
    }

    // 4d. Centered at neck/shoulder seam between torso and head -> neckwear
    if (
      torsoBox &&
      headBox &&
      horizDist <= 18 &&
      box.center[1] >= torsoBox.max[1] - 12 &&
      box.center[1] <= headBox.min[1] + 10
    ) {
      neckwear.push(p);
      continue;
    }

    // Default: handheld / carried accessory
    rawAccessories.push(p);
  }

  // Sort headgear bottom-to-top (e.g. helmet first, visor/plume second)
  headgear.sort((a, b) => partBoxes.get(a)!.min[1] - partBoxes.get(b)!.min[1]);

  // Cluster handheld accessories by 3D bounding-box proximity so multi-part props (e.g. lightsaber hilt + blade) stay grouped
  const accVisited = new Uint8Array(rawAccessories.length);
  const accessories: MinifigAccessoryGroup[] = [];
  for (let i = 0; i < rawAccessories.length; i++) {
    if (accVisited[i]) continue;
    accVisited[i] = 1;
    const queue = [i];
    const cluster: RuntimePart[] = [];
    while (queue.length > 0) {
      const u = queue.shift()!;
      cluster.push(rawAccessories[u]);
      const bu = partBoxes.get(rawAccessories[u])!;
      for (let v = 0; v < rawAccessories.length; v++) {
        if (accVisited[v]) continue;
        const bv = partBoxes.get(rawAccessories[v])!;
        if (boxDistance(bu, bv) <= 14) {
          accVisited[v] = 1;
          queue.push(v);
        }
      }
    }
    accessories.push(buildAccessorySubassembly(cluster, partBoxes, accessories.length, bodyCenterX, computeBox));
  }

  // Order accessories so multi-part props come first (like lightsaber Step 5 before cookie Step 6 in IMG_0315)
  accessories.sort((a, b) => {
    if (a.isMultiPart !== b.isMultiPart) return a.isMultiPart ? -1 : 1;
    // Viewer-left (right hand) before viewer-right (left hand)
    return a.box.center[0] - b.box.center[0];
  });

  const bodyParts = [...legs, ...torso, ...cape, ...neckwear, ...head, ...headgear];
  const bodyBox = mergeBoxes(bodyParts.map((p) => partBoxes.get(p)!));
  const fullBox = mergeBoxes(canonicalParts.map((p) => partBoxes.get(p)!));

  return {
    legs,
    torso,
    cape,
    neckwear,
    head,
    headgear,
    accessories,
    bodyBox,
    fullBox,
    axis: { x: bodyCenterX, z: bodyCenterZ },
    torsoCoreBox,
  };
}

function computeDoubleHipArrows(
  legsBox: WorldBox,
  yFrom: number,
  yTo: number,
  color: 'red' | 'blue',
): MinifigArrow3D[] {
  const halfSep = Math.max(6, Math.min(9.5, (legsBox.max[0] - legsBox.min[0]) * 0.25));
  const cx = legsBox.center[0];
  const cz = legsBox.center[2];
  return [
    { from: [cx - halfSep, yFrom, cz], to: [cx - halfSep, yTo, cz], color, kind: 'double_hip' },
    { from: [cx + halfSep, yFrom, cz], to: [cx + halfSep, yTo, cz], color, kind: 'double_hip' },
  ];
}

/**
 * Builds the official LEGO "Exploded Stack Callout" plan (matching IMG_0316):
 * - Left white vertical callout box containing legs -> torso -> [cape/neckwear] -> head -> headgear
 *   separated vertically with crisp red downward assembly arrows (2 parallel arrows torso -> legs).
 * - Right assembled standing minifigure with horizontal connector arrow + optional handheld accessory callout(s).
 */
export function buildMinifigExplodedPlan(
  canonicalParts: RuntimePart[],
  resolveName: (partId: string) => string,
  computeBox: (part: RuntimePart) => WorldBox,
): MinifigExplodedPlan {
  const decomposed = decomposeMinifigParts(canonicalParts, resolveName, computeBox);
  const allRawLayers: Array<{ role: MinifigExplodedLayer['role']; parts: RuntimePart[] }> = [
    { role: 'legs', parts: decomposed.legs },
    { role: 'torso', parts: decomposed.torso },
    { role: 'cape', parts: decomposed.cape },
    { role: 'neckwear', parts: decomposed.neckwear },
    { role: 'head', parts: decomposed.head },
    { role: 'headgear', parts: decomposed.headgear },
  ];
  const rawLayers = allRawLayers.filter((layer) => layer.parts.length > 0);

  const stackLayers: MinifigExplodedLayer[] = [];
  const stackOffsets: Record<string, MinifigPartOffset> = {};
  const stackArrows: MinifigArrow3D[] = [];
  const stackParts: RuntimePart[] = [];

  for (let i = 0; i < rawLayers.length; i++) {
    const layer = rawLayers[i];
    const box = mergeBoxes(layer.parts.map((p) => computeBox(p)));
    let offsetY = 0;

    if (i > 0) {
      const prev = stackLayers[i - 1];
      const prevTopY = prev.box.max[1] + prev.offsetY;
      const gap = prev.role === 'legs' && layer.role === 'torso' ? 28 : 24;
      offsetY = Math.max(prev.offsetY + 14, prevTopY + gap - box.min[1]);

      const yFrom = box.min[1] + offsetY - 2;
      const yTo = prevTopY + 2;
      if (prev.role === 'legs' && layer.role === 'torso') {
        stackArrows.push(...computeDoubleHipArrows(prev.box, yFrom, yTo, 'red'));
      } else {
        // Land exactly on the neck stud / head stud centerline (not the arm-skewed box center)
        const cx = decomposed.axis.x;
        const cz = decomposed.axis.z;
        const attachTopY =
          prev.role === 'torso' && decomposed.torsoCoreBox
            ? decomposed.torsoCoreBox.max[1] + prev.offsetY
            : prevTopY;
        const singleYTo = attachTopY + 2;
        stackArrows.push({
          from: [cx, yFrom, cz],
          to: [cx, singleYTo, cz],
          color: 'red',
          kind: 'single',
        });
      }
    }

    stackLayers.push({ role: layer.role, parts: layer.parts, offsetY, box });
    for (const p of layer.parts) {
      stackParts.push(p);
      if (offsetY > 0.5) {
        stackOffsets[p.id] = { x: 0, y: offsetY, z: 0, arrow: false };
      }
    }
  }

  return {
    style: 'exploded',
    decomposed,
    stackParts: stackParts.length > 0 ? stackParts : canonicalParts,
    stackOffsets,
    stackLayers,
    stackArrows,
    assembledParts: canonicalParts,
    accessoryCallouts: decomposed.accessories,
  };
}

/**
 * Builds the official LEGO "Step-by-Step Sequential Minifigure Assembly" plan (matching IMG_0315):
 * 1. Legs + floating Torso (2 parallel blue arrows)
 * 2. Optional Cape (blue arrow onto neck)
 * 3. Head (or Collar/Neckwear + Head stacked with blue arrows)
 * 4. Optional Hair / Helmet (blue arrow onto head)
 * 5. Optional multi-part accessory stage(s) with warm peach subassembly pill + black pointer arrow
 * 6. Final celebration stage (completed figure + any final single-piece prop + radial starburst & stars)
 */
export function buildMinifigSequentialPlan(
  canonicalParts: RuntimePart[],
  resolveName: (partId: string) => string,
  computeBox: (part: RuntimePart) => WorldBox,
): MinifigSequentialPlan {
  const decomposed = decomposeMinifigParts(canonicalParts, resolveName, computeBox);
  const stages: MinifigSequentialStage[] = [];
  const assembledSoFar: RuntimePart[] = [];

  const legsBox = decomposed.legs.length > 0 ? mergeBoxes(decomposed.legs.map((p) => computeBox(p))) : null;
  const torsoBox = decomposed.torso.length > 0 ? mergeBoxes(decomposed.torso.map((p) => computeBox(p))) : null;
  const headBox = decomposed.head.length > 0 ? mergeBoxes(decomposed.head.map((p) => computeBox(p))) : null;
  // Shared neck/stud centerline (arms excluded) so every stacking arrow lands on the stud
  const centerX = decomposed.axis.x;
  const centerZ = decomposed.axis.z;
  const torsoTopY = decomposed.torsoCoreBox ? decomposed.torsoCoreBox.max[1] : torsoBox ? torsoBox.max[1] : null;

  let maxStageY = decomposed.fullBox.max[1];
  let hasTallAccessoryPill = false;

  const pushStage = (stage: Omit<MinifigSequentialStage, 'stepNumber'>) => {
    stages.push({ ...stage, stepNumber: stages.length + 1 });
  };

  // Stage 1: Legs + Torso
  if (decomposed.legs.length > 0 && decomposed.torso.length > 0 && legsBox && torsoBox) {
    const gap = 28;
    const dy = Math.max(24, legsBox.max[1] + gap - torsoBox.min[1]);
    const partOffsets: Record<string, MinifigPartOffset> = {};
    for (const p of decomposed.torso) partOffsets[p.id] = { x: 0, y: dy, z: 0, arrow: false };
    maxStageY = Math.max(maxStageY, torsoBox.max[1] + dy);
    pushStage({
      kind: 'legs_torso',
      label: 'Torso & Legs',
      baseParts: [...decomposed.legs],
      addedParts: [...decomposed.torso],
      partOffsets,
      arrows: computeDoubleHipArrows(legsBox, torsoBox.min[1] + dy - 2, legsBox.max[1] + 2, 'blue'),
      accessoryPill: null,
      isCelebration: false,
    });
    assembledSoFar.push(...decomposed.legs, ...decomposed.torso);
  } else {
    if (decomposed.legs.length > 0) assembledSoFar.push(...decomposed.legs);
    if (decomposed.torso.length > 0) assembledSoFar.push(...decomposed.torso);
  }

  // Stage 2: Optional Cape / Back wearable
  if (decomposed.cape.length > 0) {
    const capeBox = mergeBoxes(decomposed.cape.map((p) => computeBox(p)));
    const attachTopY = torsoTopY !== null ? torsoTopY : assembledSoFar.length > 0 ? mergeBoxes(assembledSoFar.map(computeBox)).max[1] : 72;
    const dy = Math.max(26, attachTopY + 24 - capeBox.min[1]);
    const partOffsets: Record<string, MinifigPartOffset> = {};
    for (const p of decomposed.cape) partOffsets[p.id] = { x: 0, y: dy, z: 0, arrow: false };
    maxStageY = Math.max(maxStageY, capeBox.max[1] + dy);
    pushStage({
      kind: 'cape',
      label: 'Cape',
      baseParts: [...assembledSoFar],
      addedParts: [...decomposed.cape],
      partOffsets,
      arrows: [
        {
          from: [centerX, capeBox.min[1] + dy - 2, centerZ],
          to: [centerX, attachTopY + 2, centerZ],
          color: 'blue',
          kind: 'single',
        },
      ],
      accessoryPill: null,
      isCelebration: false,
    });
    assembledSoFar.push(...decomposed.cape);
  }

  // Stage 3: Neckwear + Head (stacked like IMG_0315 Step 3) OR Head alone
  if (decomposed.neckwear.length > 0 && decomposed.head.length > 0 && headBox) {
    const neckBox = mergeBoxes(decomposed.neckwear.map((p) => computeBox(p)));
    const attachTopY = torsoTopY ?? 72;
    const dyNeck = Math.max(20, attachTopY + 22 - neckBox.min[1]);
    const neckTopY = neckBox.max[1] + dyNeck;
    const dyHead = Math.max(dyNeck + 16, neckTopY + 18 - headBox.min[1]);
    const partOffsets: Record<string, MinifigPartOffset> = {};
    for (const p of decomposed.neckwear) partOffsets[p.id] = { x: 0, y: dyNeck, z: 0, arrow: false };
    for (const p of decomposed.head) partOffsets[p.id] = { x: 0, y: dyHead, z: 0, arrow: false };
    maxStageY = Math.max(maxStageY, headBox.max[1] + dyHead);
    pushStage({
      kind: 'neckwear_head',
      label: 'Collar & Head',
      baseParts: [...assembledSoFar],
      addedParts: [...decomposed.neckwear, ...decomposed.head],
      partOffsets,
      arrows: [
        {
          from: [centerX, headBox.min[1] + dyHead - 2, centerZ],
          to: [centerX, neckTopY + 2, centerZ],
          color: 'blue',
          kind: 'single',
        },
        {
          from: [centerX, neckBox.min[1] + dyNeck - 2, centerZ],
          to: [centerX, attachTopY + 2, centerZ],
          color: 'blue',
          kind: 'single',
        },
      ],
      accessoryPill: null,
      isCelebration: false,
    });
    assembledSoFar.push(...decomposed.neckwear, ...decomposed.head);
  } else {
    if (decomposed.neckwear.length > 0) {
      const neckBox = mergeBoxes(decomposed.neckwear.map((p) => computeBox(p)));
      const attachTopY = torsoTopY ?? 72;
      const dy = Math.max(22, attachTopY + 22 - neckBox.min[1]);
      const partOffsets: Record<string, MinifigPartOffset> = {};
      for (const p of decomposed.neckwear) partOffsets[p.id] = { x: 0, y: dy, z: 0, arrow: false };
      maxStageY = Math.max(maxStageY, neckBox.max[1] + dy);
      pushStage({
        kind: 'neckwear_head',
        label: 'Neckwear',
        baseParts: [...assembledSoFar],
        addedParts: [...decomposed.neckwear],
        partOffsets,
        arrows: [
          {
            from: [centerX, neckBox.min[1] + dy - 2, centerZ],
            to: [centerX, attachTopY + 2, centerZ],
            color: 'blue',
            kind: 'single',
          },
        ],
        accessoryPill: null,
        isCelebration: false,
      });
      assembledSoFar.push(...decomposed.neckwear);
    }
    if (decomposed.head.length > 0 && headBox) {
      const attachTopY = torsoTopY ?? 72;
      const dy = Math.max(22, attachTopY + 24 - headBox.min[1]);
      const partOffsets: Record<string, MinifigPartOffset> = {};
      for (const p of decomposed.head) partOffsets[p.id] = { x: 0, y: dy, z: 0, arrow: false };
      maxStageY = Math.max(maxStageY, headBox.max[1] + dy);
      pushStage({
        kind: 'head',
        label: 'Head',
        baseParts: [...assembledSoFar],
        addedParts: [...decomposed.head],
        partOffsets,
        arrows: [
          {
            from: [centerX, headBox.min[1] + dy - 2, centerZ],
            to: [centerX, attachTopY + 2, centerZ],
            color: 'blue',
            kind: 'single',
          },
        ],
        accessoryPill: null,
        isCelebration: false,
      });
      assembledSoFar.push(...decomposed.head);
    }
  }

  // Stage 4: Optional Hair / Helmet / Headgear
  if (decomposed.headgear.length > 0) {
    const hgBox = mergeBoxes(decomposed.headgear.map((p) => computeBox(p)));
    const attachTopY = headBox ? headBox.max[1] : torsoTopY !== null ? torsoTopY + 24 : 96;
    const dy = Math.max(22, attachTopY + 24 - hgBox.min[1]);
    const partOffsets: Record<string, MinifigPartOffset> = {};
    for (const p of decomposed.headgear) partOffsets[p.id] = { x: 0, y: dy, z: 0, arrow: false };
    maxStageY = Math.max(maxStageY, hgBox.max[1] + dy);
    pushStage({
      kind: 'headgear',
      label: 'Headgear',
      baseParts: [...assembledSoFar],
      addedParts: [...decomposed.headgear],
      partOffsets,
      arrows: [
        {
          from: [centerX, hgBox.min[1] + dy - 2, centerZ],
          to: [centerX, attachTopY + 2, centerZ],
          color: 'blue',
          kind: 'single',
        },
      ],
      accessoryPill: null,
      isCelebration: false,
    });
    assembledSoFar.push(...decomposed.headgear);
  }

  // Stage 5+: Accessories (multi-part gets warm peach callout pill; final single-part joins celebration stage)
  const accessories = decomposed.accessories;
  let celebrationAccessories: RuntimePart[] = [];
  for (let i = 0; i < accessories.length; i++) {
    const acc = accessories[i];
    const isLast = i === accessories.length - 1;
    if (acc.isMultiPart) {
      hasTallAccessoryPill = true;
      pushStage({
        kind: 'accessory_subassembly',
        label: 'Accessory',
        baseParts: [...assembledSoFar],
        addedParts: [...acc.parts],
        partOffsets: {},
        arrows: [],
        accessoryPill: acc,
        isCelebration: false,
      });
      assembledSoFar.push(...acc.parts);
    } else if (isLast) {
      celebrationAccessories = [...acc.parts];
    } else {
      const dy = 24;
      const partOffsets: Record<string, MinifigPartOffset> = {};
      for (const p of acc.parts) partOffsets[p.id] = { x: 0, y: dy, z: 0, arrow: false };
      maxStageY = Math.max(maxStageY, acc.box.max[1] + dy);
      pushStage({
        kind: 'accessory_single',
        label: 'Accessory',
        baseParts: [...assembledSoFar],
        addedParts: [...acc.parts],
        partOffsets,
        arrows: [
          {
            from: [acc.box.center[0], acc.box.min[1] + dy - 2, acc.box.center[2]],
            to: [acc.box.center[0], acc.box.max[1] + 2, acc.box.center[2]],
            color: 'blue',
            kind: 'accessory',
          },
        ],
        accessoryPill: null,
        isCelebration: false,
      });
      assembledSoFar.push(...acc.parts);
    }
  }

  // Final Celebration Stage (IMG_0315 Step 6: completed figure + starburst + stars)
  pushStage({
    kind: 'celebration',
    label: 'Complete',
    baseParts: [...assembledSoFar],
    addedParts: celebrationAccessories,
    partOffsets: {},
    arrows: [],
    accessoryPill: null,
    isCelebration: true,
  });

  // Compute shared camera framing so every stage aligns on the EXACT same foot baseline & scale
  const minY = Math.min(0, decomposed.fullBox.min[1]);
  const topY = Math.max(maxStageY, decomposed.fullBox.max[1] + (hasTallAccessoryPill ? 78 : 26));
  const spanY = Math.max(120, topY - minY);
  const spanX = Math.max(76, decomposed.fullBox.max[0] - decomposed.fullBox.min[0] + 28);
  const sharedCenter: Vec3 = [decomposed.fullBox.center[0], minY + spanY * 0.48, decomposed.fullBox.center[2]];
  const sharedHalfH = Math.max(spanY * 0.56, spanX * 0.72);

  return {
    style: 'sequential',
    decomposed,
    stages,
    sharedCenter,
    sharedHalfH,
    hasTallAccessoryPill,
  };
}

/**
 * Paginates sequential minifigure stages into clean horizontal rows per page,
 * matching official LEGO booklets (e.g. 3 across per page on portrait / 6-step builds,
 * up to 4 across on a single landscape page when totalStages <= 4).
 */
export function paginateMinifigSequentialStages(
  totalStages: number,
  isLandscape: boolean,
): MinifigSeqPageSlice[] {
  const total = Math.max(1, totalStages);
  const ranges: Array<{ start: number; end: number }> = [];

  if (total <= 3) {
    ranges.push({ start: 0, end: total });
  } else if (total === 4) {
    if (isLandscape) {
      ranges.push({ start: 0, end: 4 });
    } else {
      ranges.push({ start: 0, end: 2 }, { start: 2, end: 4 });
    }
  } else {
    // 5 -> 3 + 2, 6 -> 3 + 3 (exact IMG_0315 layout!), 7+ -> chunks of 3
    for (let s = 0; s < total; s += 3) {
      ranges.push({ start: s, end: Math.min(total, s + 3) });
    }
  }

  return ranges.map((r, idx) => ({
    start: r.start,
    end: r.end,
    cols: Math.max(1, r.end - r.start),
    pageIdx: idx,
    pageCount: ranges.length,
  }));
}
