export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

export type Vec3 = [number, number, number];

export interface WorldBox {
  min: Vec3;
  max: Vec3;
  center: Vec3;
}

export interface RuntimePart {
  id: string;
  p: string;
  c: number;
  x: number;
  y: number;
  z: number;
  m?: Mat3;
  children?: RuntimePart[];
  [key: string]: unknown;
}

export type MinifigLeafRole =
  | 'torso'
  | 'hips'
  | 'leg_r'
  | 'leg_l'
  | 'legs_unit'
  | 'arm_r'
  | 'arm_l'
  | 'hand'
  | 'head'
  | 'headgear'
  | 'accessory';

export interface MinifigPoseSummary {
  legsBent: boolean;
  armsMoved: boolean;
  headTurned: boolean;
  bodyTilted: boolean;
  bodyRotated: boolean;
  legsPosedDeg: number;
  armsPosedDeg: number;
  headPosedDeg: number;
  bodyTiltDeg: number;
  bodyYawDeg: number;
}

export interface MinifigMetrics {
  widthLdu: number;
  heightLdu: number;
  depthLdu: number;
  widthMm: number;
  heightMm: number;
}

export interface NormalizedMinifigResult {
  canonicalParts: RuntimePart[];
  posedPreviewParts: RuntimePart[];
  poseSummary: MinifigPoseSummary;
  needsTransform: boolean;
  transformLabel: string;
  metrics: MinifigMetrics;
}

export interface OneToOneLayout {
  widthMm: number;
  heightMm: number;
  worldSpanW: number;
  worldSpanH: number;
  fixedHalfH: number;
  displayPxW: number;
  displayPxH: number;
  truePxW: number;
  truePxH: number;
  fitScale: number;
  isExact: boolean;
}

/** Standard LDraw scale: 1 LDU = 0.4 mm (1 stud = 20 LDU = 8.0 mm). */
export const LDU_TO_MM = 0.4;
export const MM_PER_INCH = 25.4;

/** Default close front 3/4 portrait camera preset for minifigure construction steps. */
export const MINIFIG_BUILD_CAMERA = {
  side: 'top' as const,
  corner: 'front_right' as const,
  az: 26,
  el: 16,
};

export const R_IDENTITY: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function mat3Multiply(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

export function mat3Vec(m: Mat3, x: number, y: number, z: number): Vec3 {
  return [
    m[0] * x + m[1] * y + m[2] * z,
    m[3] * x + m[4] * y + m[5] * z,
    m[6] * x + m[7] * y + m[8] * z,
  ];
}

export function mat3Transpose(m: Mat3): Mat3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

export function mat3Determinant(m: Mat3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

export function vec3Norm(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function mat3Col(m: Mat3, c: 0 | 1 | 2): Vec3 {
  return [m[c], m[c + 3], m[c + 6]];
}

export function mat3FromCols(c0: Vec3, c1: Vec3, c2: Vec3): Mat3 {
  return [
    c0[0], c1[0], c2[0],
    c0[1], c1[1], c2[1],
    c0[2], c1[2], c2[2],
  ];
}

/**
 * Orthonormalizes a 3x3 rotation matrix into a right-handed basis while
 * prioritizing its local +Y (up) and +Z (front) axes.
 */
export function mat3Orthonormalize(m?: Mat3): Mat3 {
  const src = m || R_IDENTITY;
  const up = vec3Norm(mat3Col(src, 1));
  const rawFwd = mat3Col(src, 2);
  const dotUF = vec3Dot(rawFwd, up);
  let fwd: Vec3 = [
    rawFwd[0] - up[0] * dotUF,
    rawFwd[1] - up[1] * dotUF,
    rawFwd[2] - up[2] * dotUF,
  ];
  if (Math.hypot(fwd[0], fwd[1], fwd[2]) < 1e-4) {
    fwd = Math.abs(up[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  }
  fwd = vec3Norm(fwd);
  const right = vec3Norm(vec3Cross(up, fwd));
  const cleanFwd = vec3Norm(vec3Cross(right, up));
  return mat3FromCols(right, up, cleanFwd);
}

/** Exact rotation angle in degrees between two orthonormal 3x3 matrices. */
export function mat3AngleDeg(a: Mat3, b: Mat3): number {
  const tr =
    a[0] * b[0] + a[3] * b[3] + a[6] * b[6] +
    a[1] * b[1] + a[4] * b[4] + a[7] * b[7] +
    a[2] * b[2] + a[5] * b[5] + a[8] * b[8];
  const cosTheta = Math.max(-1, Math.min(1, (tr - 1) / 2));
  return Math.acos(cosTheta) * (180 / Math.PI);
}

function normPartId(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^ldraw\//, '')
    .replace(/^parts\//, '')
    .replace(/^p\//, '')
    .replace(/\.dat$/i, '');
}

export function classifyMinifigLeafRole(partId: string, partName = ''): MinifigLeafRole {
  const k = normPartId(partId);
  const name = (partName || '').toLowerCase();

  if (/^(?:bl_)?3815(?!c\d)/i.test(k) || (/\bhips\b/i.test(name) && !/\blegs?\b/i.test(name))) {
    return 'hips';
  }
  if (/^(?:bl_)?3816/i.test(k) || /minifig.*leg.*right/i.test(name) || /_leg_?r\b/i.test(k)) {
    return 'leg_r';
  }
  if (/^(?:bl_)?3817/i.test(k) || /minifig.*leg.*left/i.test(name) || /_leg_?l\b/i.test(k)) {
    return 'leg_l';
  }
  if (
    /^(?:bl_)?(?:3815c|970|41879|16709|37364|36036)/i.test(k) ||
    /\bhips\b.*leg|minifig.*legs/i.test(name)
  ) {
    return 'legs_unit';
  }
  if (/^(?:bl_)?3818/i.test(k) || /minifig.*arm.*right/i.test(name) || /_arm_?r\b/i.test(k)) {
    return 'arm_r';
  }
  if (/^(?:bl_)?3819/i.test(k) || /minifig.*arm.*left/i.test(name) || /_arm_?l\b/i.test(k)) {
    return 'arm_l';
  }
  if (/^(?:bl_)?3820/i.test(k) || /minifig.*hand/i.test(name)) {
    return 'hand';
  }
  if (/^(?:bl_)?973/i.test(k) || /_torso$/i.test(k) || /minifig.*torso/i.test(name)) {
    return 'torso';
  }
  if (/^(?:bl_)?(?:3626|28621)/i.test(k) || /minifig.*head\b/i.test(name)) {
    return 'head';
  }
  if (
    /^(?:bl_)?(?:76925|26066|11303|66913|21778|98385|11256|61976|25376|3842)/i.test(k) ||
    /hair|helmet|hat|cap|hood|headgear|visor|crown|ponytail|wig|beard|glasses/i.test(name)
  ) {
    return 'headgear';
  }
  return 'accessory';
}

function deepClonePart(part: RuntimePart, idPrefix: string): RuntimePart {
  const clone: RuntimePart = {
    ...part,
    id: `${idPrefix}_${part.id}`,
    m: part.m ? ([...part.m] as Mat3) : ([...R_IDENTITY] as Mat3),
  };
  if (part.children && part.children.length > 0) {
    clone.children = part.children.map((ch) => ({
      ...ch,
      id: `${idPrefix}_${ch.id}`,
      m: ch.m ? ([...ch.m] as Mat3) : ([...R_IDENTITY] as Mat3),
    }));
  }
  return clone;
}

function recenterComposites(parts: RuntimePart[]): void {
  for (const p of parts) {
    if (p.children && p.children.length > 0) {
      let sx = 0;
      let sy = 0;
      let sz = 0;
      for (const ch of p.children) {
        sx += ch.x;
        sy += ch.y;
        sz += ch.z;
      }
      p.x = sx / p.children.length;
      p.y = sy / p.children.length;
      p.z = sz / p.children.length;
    }
  }
}

function translateParts(parts: RuntimePart[], dx: number, dy: number, dz: number): void {
  for (const p of parts) {
    p.x += dx;
    p.y += dy;
    p.z += dz;
    if (p.children && p.children.length > 0) {
      for (const ch of p.children) {
        ch.x += dx;
        ch.y += dy;
        ch.z += dz;
      }
    }
  }
}

function computeGroupBox(parts: RuntimePart[], computeBox: (part: RuntimePart) => WorldBox): WorldBox {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    const b = computeBox(p);
    for (let k = 0; k < 3; k++) {
      if (b.min[k] < min[k]) min[k] = b.min[k];
      if (b.max[k] > max[k]) max[k] = b.max[k];
    }
  }
  if (!isFinite(min[0])) {
    return { min: [-20, 0, -10], max: [20, 100, 10], center: [0, 50, 0] };
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

function rotateLeafAroundPivot(leaf: RuntimePart, pivot: Vec3, rot: Mat3): void {
  const d: Vec3 = [leaf.x - pivot[0], leaf.y - pivot[1], leaf.z - pivot[2]];
  const nd = mat3Vec(rot, d[0], d[1], d[2]);
  leaf.x = pivot[0] + nd[0];
  leaf.y = pivot[1] + nd[1];
  leaf.z = pivot[2] + nd[2];
  leaf.m = mat3Multiply(rot, leaf.m || R_IDENTITY);
}

function pointToBoxDistance(pt: Vec3, box: WorldBox): number {
  const dx = Math.max(box.min[0] - pt[0], 0, pt[0] - box.max[0]);
  const dy = Math.max(box.min[1] - pt[1], 0, pt[1] - box.max[1]);
  const dz = Math.max(box.min[2] - pt[2], 0, pt[2] - box.max[2]);
  return Math.hypot(dx, dy, dz);
}

export function describeMinifigTransform(ps: MinifigPoseSummary): string {
  const acts: string[] = [];
  if (ps.legsBent) acts.push('Sit legs');
  if (ps.armsMoved) acts.push('Pose arms');
  if (ps.headTurned) acts.push('Turn head');
  if (ps.bodyTilted) acts.push('Tilt figure');
  else if (ps.bodyRotated) acts.push('Rotate');
  if (acts.length === 0) return 'Position for placement';
  if (acts.length === 1) return acts[0];
  return `${acts.slice(0, -1).join(', ')} & ${acts[acts.length - 1].toLowerCase()}`;
}

interface TaggedLeaf {
  leaf: RuntimePart;
  parent: RuntimePart;
  role: MinifigLeafRole;
}

/**
 * Converts a minifigure group from its arbitrary world-space placement pose
 * (e.g. seated, facing backward, tilted, arms raised, head turned) into:
 *  - canonicalParts: standing straight up at origin, facing +Z (toward camera)
 *  - posedPreviewParts: exact placement pose & orientation centered at origin
 *  - poseSummary & transformLabel describing the pre-placement transformation
 */
export function normalizeMinifigureForBuild(
  groupParts: RuntimePart[],
  resolveName: (partId: string) => string,
  computeBox: (part: RuntimePart) => WorldBox,
  idPrefix = 'mf',
): NormalizedMinifigResult {
  const canonicalParts = groupParts.map((p) => deepClonePart(p, `${idPrefix}_std`));
  const posedPreviewParts = groupParts.map((p) => deepClonePart(p, `${idPrefix}_pose`));

  // Center posedPreviewParts at origin with bottom at Y=0 while preserving exact placement orientation & limb poses
  recenterComposites(posedPreviewParts);
  const posedBox = computeGroupBox(posedPreviewParts, computeBox);
  translateParts(posedPreviewParts, -posedBox.center[0], -posedBox.min[1], -posedBox.center[2]);

  // Collect all leaves and classify their roles (with structural fallback for custom printed Studio assemblies)
  const leaves: TaggedLeaf[] = [];
  for (const parent of canonicalParts) {
    const parentId = normPartId(parent.p);
    const parentName = resolveName(parent.p).toLowerCase();
    const isLegsAsm =
      /(?:asm_)?(?:bl_)?(?:3815|970|41879|16709)/i.test(parentId) ||
      /\bhips\b|minifig.*leg/i.test(parentName);
    const isTorsoAsm =
      /(?:asm_)?(?:bl_)?973/i.test(parentId) || /minifig.*torso|torso assembly/i.test(parentName);

    if (parent.children && parent.children.length > 0) {
      const childItems: TaggedLeaf[] = parent.children.map((ch) => ({
        leaf: ch,
        parent,
        role: classifyMinifigLeafRole(ch.p, resolveName(ch.p)),
      }));

      // Fallback role inference for custom Studio printed child IDs inside a legs assembly
      if (isLegsAsm && childItems.length === 3) {
        const hasHips = childItems.some((c) => c.role === 'hips');
        const hasLegs = childItems.filter((c) => c.role === 'leg_r' || c.role === 'leg_l').length;
        if (!hasHips || hasLegs < 2) {
          // Pick hips as the child not classified as a leg (preferring highest Y in world or smallest vertical span)
          let hipsItem = childItems.find((c) => c.role === 'hips');
          if (!hipsItem) {
            hipsItem = childItems.reduce((best, cur) => (cur.leaf.y > best.leaf.y ? cur : best), childItems[0]);
            hipsItem.role = 'hips';
          }
          const others = childItems.filter((c) => c !== hipsItem);
          others.sort((a, b) => a.leaf.x - b.leaf.x);
          if (others[0] && others[0].role !== 'leg_r' && others[0].role !== 'leg_l') others[0].role = 'leg_r';
          if (others[1] && others[1].role !== 'leg_r' && others[1].role !== 'leg_l') others[1].role = 'leg_l';
        }
      }

      // Fallback role inference for custom Studio printed torso body inside a torso assembly
      if (isTorsoAsm && !childItems.some((c) => c.role === 'torso')) {
        const nonArmHand = childItems.filter(
          (c) => c.role !== 'arm_r' && c.role !== 'arm_l' && c.role !== 'hand',
        );
        if (nonArmHand.length > 0) {
          nonArmHand[0].role = 'torso';
        }
      }

      leaves.push(...childItems);
    } else {
      leaves.push({
        leaf: parent,
        parent,
        role: classifyMinifigLeafRole(parent.p, resolveName(parent.p)),
      });
    }
  }

  // 1. Determine body reference frame from torso -> hips -> legs_unit -> head -> first leaf
  const refEntry =
    leaves.find((l) => l.role === 'torso') ||
    leaves.find((l) => l.role === 'hips') ||
    leaves.find((l) => l.role === 'legs_unit') ||
    leaves.find((l) => l.role === 'head') ||
    leaves[0];

  const R_body = mat3Orthonormalize(refEntry?.leaf.m);
  const R_inv = mat3Transpose(R_body);
  const refOrigin: Vec3 = refEntry ? [refEntry.leaf.x, refEntry.leaf.y, refEntry.leaf.z] : [0, 0, 0];

  const bodyUp = mat3Col(R_body, 1);
  const bodyFwd = mat3Col(R_body, 2);
  const bodyTiltDeg = Math.acos(Math.max(-1, Math.min(1, bodyUp[1]))) * (180 / Math.PI);
  const bodyYawDeg = Math.atan2(bodyFwd[0], bodyFwd[2]) * (180 / Math.PI);

  // 2. Transform EVERY leaf into the upright, front-facing (+Z) torso body frame
  for (const entry of leaves) {
    const lf = entry.leaf;
    const rel = mat3Vec(R_inv, lf.x - refOrigin[0], lf.y - refOrigin[1], lf.z - refOrigin[2]);
    lf.x = rel[0];
    lf.y = rel[1];
    lf.z = rel[2];
    lf.m = mat3Multiply(R_inv, lf.m || R_IDENTITY);
  }

  // 3. Un-pose Hips & Legs -> standing straight down (m = R_IDENTITY)
  let legsPosedDeg = 0;
  const hipsEntry = leaves.find((l) => l.role === 'hips');
  const legEntries = leaves.filter((l) => l.role === 'leg_r' || l.role === 'leg_l');
  const legsUnitEntries = leaves.filter((l) => l.role === 'legs_unit');

  if (hipsEntry) {
    const hipsM = mat3Orthonormalize(hipsEntry.leaf.m);
    const hipsAngle = mat3AngleDeg(hipsM, R_IDENTITY);
    if (hipsAngle > 1.5) {
      legsPosedDeg = Math.max(legsPosedDeg, hipsAngle);
      const R_hipsCorr = mat3Transpose(hipsM);
      const hp: Vec3 = [hipsEntry.leaf.x, hipsEntry.leaf.y, hipsEntry.leaf.z];
      hipsEntry.leaf.m = [...R_IDENTITY] as Mat3;
      for (const leg of legEntries) {
        rotateLeafAroundPivot(leg.leaf, hp, R_hipsCorr);
      }
    } else {
      hipsEntry.leaf.m = [...R_IDENTITY] as Mat3;
    }

    for (const leg of legEntries) {
      const legM = mat3Orthonormalize(leg.leaf.m);
      const legAngle = mat3AngleDeg(legM, R_IDENTITY);
      legsPosedDeg = Math.max(legsPosedDeg, legAngle);
      if (legAngle > 1.5) {
        // Standard LDraw hip hinge pin sits 12 LDU below hips origin (0, -12, 0 in GL space)
        const isPurePitch = Math.abs(legM[0]) > 0.88;
        const pivot: Vec3 = [
          isPurePitch ? leg.leaf.x : hipsEntry.leaf.x,
          hipsEntry.leaf.y - 12,
          hipsEntry.leaf.z,
        ];
        const R_unrot = mat3Transpose(legM);
        rotateLeafAroundPivot(leg.leaf, pivot, R_unrot);
        leg.leaf.m = [...R_IDENTITY] as Mat3;
      } else {
        leg.leaf.m = [...R_IDENTITY] as Mat3;
      }
    }
  } else {
    for (const leg of [...legEntries, ...legsUnitEntries]) {
      const legM = mat3Orthonormalize(leg.leaf.m);
      const legAngle = mat3AngleDeg(legM, R_IDENTITY);
      legsPosedDeg = Math.max(legsPosedDeg, legAngle);
      if (legAngle > 1.5) {
        leg.leaf.m = [...R_IDENTITY] as Mat3;
      }
    }
  }

  // 4. Un-pose Arms & Hands -> neutral hanging pose at sides (carrying matched hands & handheld accessories)
  let armsPosedDeg = 0;
  const armEntries = leaves.filter((l) => l.role === 'arm_r' || l.role === 'arm_l');
  const handEntries = leaves.filter((l) => l.role === 'hand');
  const accessoryEntries = leaves.filter((l) => l.role === 'accessory');

  if (armEntries.length > 0) {
    // Compute arm boxes BEFORE moving arms so hands match unambiguously to their arm
    const armBoxes = armEntries.map((ae) => computeBox(ae.leaf));
    const claimedHands = new Set<TaggedLeaf>();
    const claimedAccessories = new Set<TaggedLeaf>();

    // Match each hand to its nearest arm first
    const armToHands = new Map<TaggedLeaf, TaggedLeaf[]>();
    for (const ae of armEntries) armToHands.set(ae, []);
    for (const he of handEntries) {
      const hPos: Vec3 = [he.leaf.x, he.leaf.y, he.leaf.z];
      let bestArm: TaggedLeaf | null = null;
      let bestScore = 38;
      armEntries.forEach((ae, idx) => {
        const d = pointToBoxDistance(hPos, armBoxes[idx]);
        const sameSideBonus = Math.sign(he.leaf.x) === Math.sign(ae.leaf.x) && Math.abs(ae.leaf.x) > 4 ? -4 : 0;
        const score = d + sameSideBonus;
        if (score < bestScore) {
          bestScore = score;
          bestArm = ae;
        }
      });
      if (bestArm && !claimedHands.has(he)) {
        claimedHands.add(he);
        armToHands.get(bestArm)!.push(he);
      }
    }

    for (const ae of armEntries) {
      const armM = mat3Orthonormalize(ae.leaf.m);
      const u = mat3Col(armM, 0); // shoulder hinge pin axis
      // Only un-rotate around shoulder pin when the arm is properly oriented (not mirrored / flipped sideways)
      if (u[0] > 0.5 && Math.abs(u[2]) < 0.35 && mat3Determinant(armM) > 0) {
        const fTarget = vec3Norm([-u[0] * u[2], -u[1] * u[2], 1 - u[2] * u[2]]);
        const upTarget = vec3Norm(vec3Cross(fTarget, u));
        const R_armNeutral = mat3FromCols(u, upTarget, fTarget);
        const armAngle = mat3AngleDeg(armM, R_armNeutral);
        armsPosedDeg = Math.max(armsPosedDeg, armAngle);
        if (armAngle > 4) {
          const R_corr = mat3Multiply(R_armNeutral, mat3Transpose(armM));
          const pivot: Vec3 = [ae.leaf.x, ae.leaf.y, ae.leaf.z];
          ae.leaf.m = R_armNeutral;

          const matchedHands = armToHands.get(ae) || [];
          for (const he of matchedHands) {
            const handBoxBefore = computeBox(he.leaf);
            // Carry any small handheld accessory touching this hand rigidly along with the arm
            for (const acc of accessoryEntries) {
              if (claimedAccessories.has(acc)) continue;
              const accPos: Vec3 = [acc.leaf.x, acc.leaf.y, acc.leaf.z];
              if (pointToBoxDistance(accPos, handBoxBefore) <= 18) {
                claimedAccessories.add(acc);
                rotateLeafAroundPivot(acc.leaf, pivot, R_corr);
              }
            }
            rotateLeafAroundPivot(he.leaf, pivot, R_corr);
          }
        }
      }
    }
  }

  // 5. Un-pose Head & attached Headgear -> facing straight forward (+Z)
  let headPosedDeg = 0;
  const headEntry = leaves.find((l) => l.role === 'head');
  const headgearEntries = leaves.filter((l) => l.role === 'headgear');
  if (headEntry) {
    const headM = mat3Orthonormalize(headEntry.leaf.m);
    const headAngle = mat3AngleDeg(headM, R_IDENTITY);
    if (headAngle > 4) {
      // Respect intentional 180-degree double-sided alternate face when headgear already faces forward (+Z)
      const headgearAlignedFront =
        headgearEntries.length > 0 &&
        headgearEntries.every((hg) => mat3AngleDeg(mat3Orthonormalize(hg.leaf.m), R_IDENTITY) < 25);
      const isAltFaceFlip = headAngle > 155 && headgearAlignedFront;
      if (!isAltFaceFlip) {
        headPosedDeg = headAngle;
        const R_headCorr = mat3Transpose(headM);
        const hp: Vec3 = [headEntry.leaf.x, headEntry.leaf.y, headEntry.leaf.z];
        headEntry.leaf.m = [...R_IDENTITY] as Mat3;
        for (const hg of headgearEntries) {
          rotateLeafAroundPivot(hg.leaf, hp, R_headCorr);
        }
      }
    }
  }

  // 6. Recompute composite centers & recenter standing figure with feet resting on Y = 0
  recenterComposites(canonicalParts);
  const canonBox = computeGroupBox(canonicalParts, computeBox);
  translateParts(canonicalParts, -canonBox.center[0], -canonBox.min[1], -canonBox.center[2]);

  const widthLdu = Math.max(16, canonBox.max[0] - canonBox.min[0]);
  const heightLdu = Math.max(24, canonBox.max[1] - canonBox.min[1]);
  const depthLdu = Math.max(12, canonBox.max[2] - canonBox.min[2]);

  const poseSummary: MinifigPoseSummary = {
    legsBent: legsPosedDeg > 10,
    armsMoved: armsPosedDeg > 10,
    headTurned: headPosedDeg > 10,
    bodyTilted: bodyTiltDeg > 10,
    bodyRotated: Math.abs(bodyYawDeg) > 25,
    legsPosedDeg: Math.round(legsPosedDeg * 10) / 10,
    armsPosedDeg: Math.round(armsPosedDeg * 10) / 10,
    headPosedDeg: Math.round(headPosedDeg * 10) / 10,
    bodyTiltDeg: Math.round(bodyTiltDeg * 10) / 10,
    bodyYawDeg: Math.round(bodyYawDeg * 10) / 10,
  };

  const needsTransform =
    poseSummary.legsBent ||
    poseSummary.armsMoved ||
    poseSummary.headTurned ||
    poseSummary.bodyTilted ||
    poseSummary.bodyRotated;

  return {
    canonicalParts,
    posedPreviewParts,
    poseSummary,
    needsTransform,
    transformLabel: describeMinifigTransform(poseSummary),
    metrics: {
      widthLdu,
      heightLdu,
      depthLdu,
      widthMm: widthLdu * LDU_TO_MM,
      heightMm: heightLdu * LDU_TO_MM,
    },
  };
}

/**
 * Normalizes a composite minifigure sub-assembly (legs or torso) for clean
 * upright, neutral-pose PLI / Parts List thumbnails.
 */
export function normalizeCompositeThumbPart(
  part: RuntimePart,
  resolveName: (partId: string) => string,
  computeBox: (part: RuntimePart) => WorldBox,
): RuntimePart {
  if (!part.children || part.children.length === 0) {
    return { ...part, id: 't', x: 0, y: 0, z: 0, m: [...R_IDENTITY] as Mat3 };
  }
  const k = normPartId(part.p);
  const name = resolveName(part.p).toLowerCase();
  const isMfComposite =
    /(?:asm_)?(?:bl_)?(?:3815|970|973|41879|16709)/i.test(k) ||
    /minifig|torso|hips/i.test(name) ||
    part.children.some((ch) => {
      const r = classifyMinifigLeafRole(ch.p, resolveName(ch.p));
      return r === 'torso' || r === 'hips' || r === 'leg_r' || r === 'leg_l' || r === 'arm_r' || r === 'arm_l';
    });

  if (isMfComposite) {
    const res = normalizeMinifigureForBuild([part], resolveName, computeBox, 'thumb');
    return res.canonicalParts[0];
  }

  const cx = part.x;
  const cy = part.y;
  const cz = part.z;
  return {
    ...part,
    id: 't',
    x: 0,
    y: 0,
    z: 0,
    m: [...R_IDENTITY] as Mat3,
    children: part.children.map((ch) => ({
      ...ch,
      x: ch.x - cx,
      y: ch.y - cy,
      z: ch.z - cz,
    })),
  };
}

/**
 * Computes exact 1:1 physical-scale orthographic layout for a standing minifigure
 * on a page of physical height `pageHIn` inches rendered at `pagePxH` pixels.
 */
export function computeMinifigOneToOneLayout(
  boundsLdu: { widthLdu: number; heightLdu: number },
  pagePxH: number,
  pageHIn: number,
  maxPxW: number,
  maxPxH: number,
): OneToOneLayout {
  const widthLdu = Math.max(16, boundsLdu.widthLdu);
  const heightLdu = Math.max(24, boundsLdu.heightLdu);
  const widthMm = widthLdu * LDU_TO_MM;
  const heightMm = heightLdu * LDU_TO_MM;

  const pageHMm = Math.max(50, pageHIn * MM_PER_INCH);
  const pxPerMm = Math.max(0.5, pagePxH / pageHMm);

  const padFactor = 1.08;
  const worldSpanH = heightLdu * padFactor;
  const worldSpanW = Math.max(widthLdu * padFactor, worldSpanH * 0.46);

  const truePxH = worldSpanH * LDU_TO_MM * pxPerMm;
  const truePxW = worldSpanW * LDU_TO_MM * pxPerMm;

  const availW = Math.max(24, maxPxW);
  const availH = Math.max(36, maxPxH);
  const fitScale = Math.min(1, availW / Math.max(1, truePxW), availH / Math.max(1, truePxH));

  return {
    widthMm,
    heightMm,
    worldSpanW,
    worldSpanH,
    fixedHalfH: worldSpanH / 2,
    displayPxW: Math.max(24, Math.round(truePxW * fitScale)),
    displayPxH: Math.max(36, Math.round(truePxH * fitScale)),
    truePxW,
    truePxH,
    fitScale,
    isExact: fitScale >= 0.985,
  };
}
