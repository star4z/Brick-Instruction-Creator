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

export type MinifigIndicatorKind =
  | 'legs'
  | 'leg_r'
  | 'leg_l'
  | 'arm_r'
  | 'arm_l'
  | 'head'
  | 'body_tilt'
  | 'body_yaw';

export interface MinifigRotationIndicator {
  kind: MinifigIndicatorKind;
  label: string;
  partIds: string[];
  pivot: Vec3;
  axis: Vec3;
  startDir: Vec3;
  endDir: Vec3;
  angleDeg: number;
  radius: number;
  lateralOffset: Vec3;
  color: string;
}

export interface MinifigPoseCamera {
  side: 'top';
  corner: 'front_right' | 'front_left';
  az: number;
  el: number;
}

export interface NormalizedMinifigResult {
  canonicalParts: RuntimePart[];
  posedPreviewParts: RuntimePart[];
  posedFrontParts: RuntimePart[];
  poseCamera: MinifigPoseCamera;
  poseIndicators: MinifigRotationIndicator[];
  poseGhostParts: RuntimePart[];
  rotatedPartIds: string[];
  poseSummary: MinifigPoseSummary;
  needsTransform: boolean;
  transformLabel: string;
  metrics: MinifigMetrics;
  worldForward: Vec3;
  worldUp: Vec3;
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

/** Default front 3/4 portrait camera preset for minifigure pose/rotation preparation steps. */
export const MINIFIG_POSE_CAMERA: MinifigPoseCamera = {
  side: 'top',
  corner: 'front_right',
  az: 32,
  el: 20,
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

export type MinifigGroupKind = 'legs' | 'torso' | 'head' | 'headgear' | null;

export interface MinifigSubmodelRef {
  name: string;
  instId: number | string;
}

export interface DetectedMinifigGroup {
  name: string;
  indices: number[];
}

const CORE_LEGS_ID_RE = /^(?:asm_)?(?:bl_)?(?:3815|3816|3817|970|971|972|41879|16709|37364|36036)(?:[^0-9]|$)/i;
const CORE_TORSO_ID_RE = /^(?:asm_)?(?:bl_)?(?:973|3814|76382|3818|3819|3820|981|982|983)(?:[^0-9]|$)/i;
const CORE_HEAD_ID_RE = /^(?:bl_)?(?:3626|28621)(?:[^0-9]|$)/i;

/** Known LEGO furniture, seating, vehicle control, mount, and train part IDs that are never part of a minifigure. */
const NON_MINIFIG_PART_ID_RE =
  /^(?:bl_)?(?:4079|4598|30149|29602|65767|61482|60583|90195|3828|3829|73081|2819|30663|4491|2491|4719|30187|50859|15396|25214|38339|38340|29085|28740|bb892)(?:[^0-9]|$)/i;

/** Structural LEGO bar, pole, handrail, antenna, and hose part IDs (e.g. 30374 Bar 4L, 63965 Bar 6L, 87994 Bar 3L, 4095 Bar 6.6L). */
const STRUCTURAL_BAR_PART_ID_RE =
  /^(?:bl_)?(?:30374|63965|87994|4095|21462|78258|32828|48729|23443|30359|61975|28921|92690|87618|99784|3957|2569|75c\d+|78c\d+)(?:[^0-9]|$)/i;

/** Known LEGO lightsaber hilt IDs (distinct from generic structural bars). */
const LIGHTSABER_HILT_ID_RE = /^(?:bl_)?(?:64567|577|30373|23801|61199)(?:[^0-9]|$)/i;

/** Known LEGO minifigure hair and headgear part IDs. */
const HEADGEAR_ID_RE =
  /^(?:bl_)?(?:76925|26066|11303|66913|21778|98385|11256|25376|3842|3901|4530|62810|92081|20595|25972|28551|23186|88283|64798|87991|92746|15500|21268|21269|24791|25409|35699|68212|79768)(?:[^0-9]|$)/i;

/** Known LEGO minifigure bags, purses, satchels, and wearable/handheld accessory part IDs. */
const WEARABLE_ACCESSORY_ID_RE =
  /^(?:bl_)?(?:61976|93091|93082|10169|18987|25866|65768|92590|35654|4449|40239|77983|93221|26073|15619|24093|93555|65632|19918|26093|85974)(?:[^0-9]|$)/i;

/** Furniture, seats, fixtures, and large architectural parts that must NEVER be bundled into a minifigure build step. */
const NON_MINIFIG_FURNITURE_RE =
  /\b(seat|seats|seating|chair|chairs|armchair|recliner|stool|bench|sofa|couch|throne|bed|bunk|table|desk|toilet|sink|bathtub|wheelchair|saddle|stretcher|pram|stroller|crib|baseplate|steering|dashboard|console|cockpit|door|window|windscreen|windshield|fence|railing|ladder|stairs?|crate|barrel|cabinet|cupboard|locker|shelf|counter)\b/i;

/** Structural bricks, plates, bars, poles, vehicles, and Technic elements (only checked for non-core, non-wearable parts). */
const NON_MINIFIG_STRUCTURAL_RE =
  /\b(bicycle|bike|tricycle|motorcycle|motorbike|scooter|vespa|skateboard|surfboard|snowboard|boat|kayak|canoe|raft|cart|wagon|wheelbarrow|brick|plate|tile|slope|wedge|panel|bracket|hinge|technic|liftarm|beam|axle|pin|gear|turntable|wheel|tire|tyre|rim|bogie|track|rail|motor|coupler|buffer|arch|cylinder|cone|dish|dome|frame|glass|lattice|grille|jumper|bar|handrail|stanchion|pole|hose|antenna|mast|pillar|column|pipe|tube)\b|\b(?:car|vehicle|engine|truck)\s+hood\b/i;

const MINIFIG_WEARABLE_NAME_RE =
  /\b(hair|helmet|hat|cap|hood|headgear|visor|crown|scarf|cape|cloak|armor|armour|backpack|ponytail|wig|beard|moustache|mustache|glasses|goggles|headphones?|earmuffs?|neckwear|collar|epaulette|pauldron|quiver|scabbard|jetpack|tiara|turban|beanie|beret|bandana|headband)\b/i;

const MINIFIG_ACCESSORY_NAME_RE =
  /\b(utensil|mug|cup|goblet|bottle|broom|wand|sword|lightsaber|blaster|camera|briefcase|suitcase|handbag|purse|satchel|tote|pouch|bag|book|newspaper|letter|phone|walkie|radio|microphone|guitar|umbrella|torch|lantern|flashlight|wrench|hammer|shovel|pickaxe|binoculars|magnifying|megaphone|trophy|clipboard|laptop)\b|minifig.*accessory/i;

function isCoreBodyId(k: string): boolean {
  return CORE_LEGS_ID_RE.test(k) || CORE_TORSO_ID_RE.test(k) || CORE_HEAD_ID_RE.test(k) || /_(?:torso|leg_?[lr]|arm_?[lr])$/i.test(k);
}

function isLightsaberHiltPart(partId: string, partName = ''): boolean {
  const k = normPartId(partId).replace(/-bl$/, '');
  if (LIGHTSABER_HILT_ID_RE.test(k)) return true;
  const name = (partName || '').toLowerCase();
  return !/\bbar\b/i.test(name) && /\blightsaber\b.*\bhilt\b|\bhilt\b.*\blightsaber\b/i.test(name);
}

function isLightsaberBladeCandidate(partId: string, partName = ''): boolean {
  const k = normPartId(partId).replace(/-bl$/, '');
  if (/^(?:bl_)?30374(?:[^0-9]|$)/i.test(k)) return true;
  return /\blightsaber\s+blade\b/i.test(partName || '');
}

function isWearableOrBagPart(part: RuntimePart, resolveName: (partId: string) => string): boolean {
  const k = normPartId(part.p).replace(/-bl$/, '');
  const name = (resolveName(part.p) || '').toLowerCase();
  const childIds = (part.children || []).map((c) => normPartId(c.p).replace(/-bl$/, ''));
  const allIds = [k, ...childIds];
  return (
    allIds.some((id) => HEADGEAR_ID_RE.test(id) || WEARABLE_ACCESSORY_ID_RE.test(id)) ||
    MINIFIG_WEARABLE_NAME_RE.test(name) ||
    isArmPosingAccessory(k, name)
  );
}

/**
 * Returns true if a part is definitively NOT a minifigure body part, headgear, or wearable/handheld accessory
 * (for example, LEGO seats/chairs like 4079 "Minifigure Seat 2x2", structural bars/poles like 30374 "Bar 4L",
 * furniture, vehicles, or structural bricks).
 */
export function isNonMinifigPart(partId: string, partName = '', childPartIds: string[] = []): boolean {
  const k = normPartId(partId).replace(/-bl$/, '');
  const normChildren = childPartIds.map((c) => normPartId(c).replace(/-bl$/, ''));

  // Fused assemblies containing core minifigure body parts (e.g. torso+arms+hands, hips+legs) are always minifigure parts
  if (normChildren.some((ck) => isCoreBodyId(ck))) return false;
  if (isCoreBodyId(k)) return false;

  // Explicit non-minifig furniture/seat/vehicle/structural-bar IDs (e.g. 4079 chair/seat, 30374 Bar 4L, 63965 Bar 6L)
  if (
    NON_MINIFIG_PART_ID_RE.test(k) ||
    STRUCTURAL_BAR_PART_ID_RE.test(k) ||
    normChildren.some((ck) => NON_MINIFIG_PART_ID_RE.test(ck) || STRUCTURAL_BAR_PART_ID_RE.test(ck))
  ) {
    return true;
  }

  const name = (partName || '').toLowerCase();
  if (!name) return false;

  // Core body part names always win over print descriptions (e.g. "Minifig Torso with Train Pattern")
  if (/\bhips\b|minifig.*(?:leg|torso|arm|hand|head\b)|torso assembly|\b(?:arm|leg),?\s*(?:left|right)\b/i.test(name)) {
    return false;
  }

  // Chairs, seats, benches, tables, doors, windows, steering consoles are NEVER minifigure parts
  if (NON_MINIFIG_FURNITURE_RE.test(name)) {
    return true;
  }

  // Explicit headgear/wearables (e.g. "Minifig Helmet Motorcycle", "Minifig Headphones") are valid minifigure parts
  if (HEADGEAR_ID_RE.test(k) || WEARABLE_ACCESSORY_ID_RE.test(k) || MINIFIG_WEARABLE_NAME_RE.test(name)) {
    return false;
  }

  // Reject structural bricks, plates, tiles, slopes, bars, poles, wheels, Technic, and vehicles
  if (NON_MINIFIG_STRUCTURAL_RE.test(name)) {
    return true;
  }

  return false;
}

/**
 * Classifies a runtime part (or fused composite assembly) into its minifigure grouping kind,
 * returning null for chairs/seats, furniture, vehicles, and structural bricks.
 */
export function classifyMinifigGroupKind(
  part: RuntimePart,
  resolveName: (partId: string) => string,
): MinifigGroupKind {
  const k = normPartId(part.p).replace(/-bl$/, '');
  const name = (resolveName(part.p) || '').toLowerCase();
  const childIds = (part.children || []).map((c) => normPartId(c.p).replace(/-bl$/, ''));

  if (isNonMinifigPart(k, name, childIds)) {
    return null;
  }

  const allIds = [k, ...childIds];
  if (
    allIds.some((id) => CORE_LEGS_ID_RE.test(id)) ||
    /\bhips\b|minifig.*\blegs?\b|\bleg,?\s*(?:left|right)\b/i.test(name)
  ) {
    return 'legs';
  }
  if (
    allIds.some((id) => CORE_TORSO_ID_RE.test(id) || /_(?:torso|arm_?[lr])$/i.test(id)) ||
    /minifig.*torso|torso assembly|\btorso\b|minifig.*\barms?\b|\barm,?\s*(?:left|right)\b|minifig.*\bhand\b|^\s*hand\s*$/i.test(name)
  ) {
    return 'torso';
  }
  if (allIds.some((id) => CORE_HEAD_ID_RE.test(id)) || /minifig.*head\b/i.test(name)) {
    return 'head';
  }
  if (
    allIds.some((id) => HEADGEAR_ID_RE.test(id) || WEARABLE_ACCESSORY_ID_RE.test(id)) ||
    MINIFIG_WEARABLE_NAME_RE.test(name) ||
    MINIFIG_ACCESSORY_NAME_RE.test(name)
  ) {
    return 'headgear';
  }
  return null;
}

export function classifyMinifigLeafRole(partId: string, partName = ''): MinifigLeafRole {
  const k = normPartId(partId).replace(/-bl$/, '');
  const name = (partName || '').toLowerCase();

  if (isNonMinifigPart(k, name)) {
    return 'accessory';
  }
  if (
    /^(?:bl_)?(?:3815|970)(?!c\d)(?:[^0-9]|$)/i.test(k) ||
    (/\bhips\b/i.test(name) && !/\blegs?\b/i.test(name))
  ) {
    return 'hips';
  }
  if (
    /^(?:bl_)?(?:3816|971)(?:[^0-9]|$)/i.test(k) ||
    /minifig.*leg.*right|\bleg,?\s*right\b|\bright\s+leg\b/i.test(name) ||
    /_leg_?r\b/i.test(k)
  ) {
    return 'leg_r';
  }
  if (
    /^(?:bl_)?(?:3817|972)(?:[^0-9]|$)/i.test(k) ||
    /minifig.*leg.*left|\bleg,?\s*left\b|\bleft\s+leg\b/i.test(name) ||
    /_leg_?l\b/i.test(k)
  ) {
    return 'leg_l';
  }
  if (
    /^(?:bl_)?(?:3815c|970c|41879|16709|37364|36036)(?:[^0-9]|$)/i.test(k) ||
    /\bhips\b.*leg|minifig.*legs/i.test(name)
  ) {
    return 'legs_unit';
  }
  if (
    /^(?:bl_)?(?:3818|982)(?:[^0-9]|$)/i.test(k) ||
    /minifig.*arm.*right|\barm,?\s*right\b|\bright\s+arm\b/i.test(name) ||
    /_arm_?r\b/i.test(k)
  ) {
    return 'arm_r';
  }
  if (
    /^(?:bl_)?(?:3819|981)(?:[^0-9]|$)/i.test(k) ||
    /minifig.*arm.*left|\barm,?\s*left\b|\bleft\s+arm\b/i.test(name) ||
    /_arm_?l\b/i.test(k)
  ) {
    return 'arm_l';
  }
  if (
    /^(?:bl_)?(?:3820|983)(?:[^0-9]|$)/i.test(k) ||
    ((/minifig.*hand\b|^\s*(?:printed\s+)?hand\s*$/i.test(name)) &&
      !/\bhand\s*(?:bag|cart|gun|saw|truck|mirror|rail)\b/i.test(name))
  ) {
    return 'hand';
  }
  if (
    /^(?:bl_)?(?:973|3814|76382)(?:[^0-9]|$)/i.test(k) ||
    /_torso$/i.test(k) ||
    ((/minifig.*torso|\btorso\b/i.test(name)) && !/\barm\b|\bhand\b/i.test(name))
  ) {
    return 'torso';
  }
  if (CORE_HEAD_ID_RE.test(k) || /minifig.*head\b/i.test(name)) {
    return 'head';
  }
  if (
    HEADGEAR_ID_RE.test(k) ||
    /\b(hair|helmet|hat|cap|hood|headgear|visor|crown|ponytail|wig|beard|moustache|mustache|glasses|goggles|tiara|turban|beanie|beret|bandana|headband)\b/i.test(name)
  ) {
    return 'headgear';
  }
  return 'accessory';
}

/**
 * Returns true when an accessory is a purse, handbag, satchel, messenger bag,
 * tote, briefcase, suitcase, or shoulder-strap instrument whose physical fit
 * commonly requires keeping the adjacent/holding minifigure arm posed in the
 * initial build step.
 */
export function isArmPosingAccessory(partId: string, partName = ''): boolean {
  const k = normPartId(partId).replace(/-bl$/, '');
  const name = (partName || '').toLowerCase();
  if (
    /^(?:bl_)?(?:61976|93091|93082|10169|18987|25866|65768|92590|35654|40239|77983|93221|26073|15619|68495|80316|4449|3896|4523|18759|11640|25975|11099|65205|93564)(?:$|[^0-9])/i.test(
      k,
    )
  ) {
    return true;
  }
  return /\b(purse|handbag|satchel|messenger\s*bag|shoulder\s*bag|crossbody|tote|pouch|briefcase|suitcase|shopping\s*bag|duffel|duffle|knapsack|sack|guitar|accordion|banjo|keytar|violin|cello|bagpipe|bag)\b/i.test(
    name,
  );
}

// Official LDraw 973c01.dat neutral arm matrices converted to GL (+Y up, +Z front):
// Right arm (3818/982, x = -15.552): hangs down & slightly outward (-X), forearm forward (+Z)
const ARM_R_CANONICAL_GL: Mat3 = mat3Orthonormalize([
  0.9854, 0.17, 0,
  -0.17, 0.9854, 0,
  0, 0, 1,
]);
// Left arm (3819/981, x = +15.552): hangs down & slightly outward (+X), forearm forward (+Z)
const ARM_L_CANONICAL_GL: Mat3 = mat3Orthonormalize([
  0.9854, -0.17, 0,
  0.17, 0.9854, 0,
  0, 0, 1,
]);
const REFLECT_X: Mat3 = [-1, 0, 0, 0, 1, 0, 0, 0, 1];

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

function boxToBoxDistance(a: WorldBox, b: WorldBox): number {
  const dx = Math.max(a.min[0] - b.max[0], 0, b.min[0] - a.max[0]);
  const dy = Math.max(a.min[1] - b.max[1], 0, b.min[1] - a.max[1]);
  const dz = Math.max(a.min[2] - b.max[2], 0, b.min[2] - a.max[2]);
  return Math.hypot(dx, dy, dz);
}

function boxOverlapDepth(a: WorldBox, b: WorldBox): number {
  const ox = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
  const oy = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
  const oz = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
  if (ox <= 0 || oy <= 0 || oz <= 0) return 0;
  return Math.min(ox, oy, oz);
}

function boxVolume(b: WorldBox): number {
  return Math.max(0, b.max[0] - b.min[0]) * Math.max(0, b.max[1] - b.min[1]) * Math.max(0, b.max[2] - b.min[2]);
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
  idx: number;
  leaf: RuntimePart;
  parent: RuntimePart;
  role: MinifigLeafRole;
}

const INDICATOR_COLOR_LIMB = '#f97316';
const INDICATOR_COLOR_BODY_TILT = '#0ea5e9';
const INDICATOR_COLOR_BODY_YAW = '#2563eb';

function mat3RotY(rad: number): Mat3 {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c, 0, s, 0, 1, 0, -s, 0, c];
}

function projectPerp(v: Vec3, axis: Vec3): Vec3 {
  const d = vec3Dot(v, axis);
  const p: Vec3 = [v[0] - axis[0] * d, v[1] - axis[1] * d, v[2] - axis[2] * d];
  if (Math.hypot(p[0], p[1], p[2]) < 1e-4) {
    const fb: Vec3 = Math.abs(axis[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const df = vec3Dot(fb, axis);
    return vec3Norm([fb[0] - axis[0] * df, fb[1] - axis[1] * df, fb[2] - axis[2] * df]);
  }
  return vec3Norm(p);
}

/**
 * Converts a minifigure group from its arbitrary world-space placement pose
 * (e.g. seated, facing backward, tilted, arms raised, head turned) into:
 *  - canonicalParts: standing straight up at origin, facing +Z (toward camera),
 *    with arms returned to their default hanging position except when required
 *    to hold/clear an accessory such as a purse or two-handed item
 *  - posedPreviewParts: exact placement pose & orientation centered at origin
 *  - posedFrontParts: exact posed figure un-yawed so its front faces +Z (toward camera)
 *  - poseIndicators & poseGhostParts: 3D rotation arcs + aligned starting-pose ghosts
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
  const posedFrontParts = groupParts.map((p) => deepClonePart(p, `${idPrefix}_front`));

  // Center posedPreviewParts at origin with bottom at Y=0 while preserving exact placement orientation & limb poses
  recenterComposites(posedPreviewParts);
  const posedBox = computeGroupBox(posedPreviewParts, computeBox);
  translateParts(posedPreviewParts, -posedBox.center[0], -posedBox.min[1], -posedBox.center[2]);

  // Collect all leaves and classify their roles (with structural fallback for custom printed Studio assemblies)
  const leaves: TaggedLeaf[] = [];
  const frontLeaves: TaggedLeaf[] = [];
  const torsoAsmParents = new Set<RuntimePart>();

  canonicalParts.forEach((parent, parentIdx) => {
    const frontParent = posedFrontParts[parentIdx];
    const parentId = normPartId(parent.p);
    const parentName = resolveName(parent.p).toLowerCase();
    const isLegsAsm =
      /(?:asm_)?(?:bl_)?(?:3815|970|41879|16709)/i.test(parentId) ||
      /\bhips\b|minifig.*leg/i.test(parentName);
    const isTorsoAsm =
      /(?:asm_)?(?:bl_)?(?:973|3814|76382)/i.test(parentId) ||
      /\btorso\b/i.test(parentName);

    if (parent.children && parent.children.length > 0) {
      const childItems: TaggedLeaf[] = parent.children.map((ch) => ({
        idx: 0,
        leaf: ch,
        parent,
        role: classifyMinifigLeafRole(ch.p, resolveName(ch.p)),
      }));

      if (isTorsoAsm || childItems.some((c) => c.role === 'torso')) torsoAsmParents.add(parent);

      // Fallback role inference for custom Studio printed child IDs inside a legs assembly
      if (isLegsAsm && childItems.length === 3) {
        const hasHips = childItems.some((c) => c.role === 'hips');
        const hasLegs = childItems.filter((c) => c.role === 'leg_r' || c.role === 'leg_l').length;
        if (!hasHips || hasLegs < 2) {
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
          // Prefer largest-volume body piece so custom-ID arms/hands are not mistakenly picked as the torso
          let bestTorso = nonArmHand[0];
          let bestVol = boxVolume(computeBox(bestTorso.leaf));
          for (let i = 1; i < nonArmHand.length; i++) {
            const v = boxVolume(computeBox(nonArmHand[i].leaf));
            if (v > bestVol) {
              bestVol = v;
              bestTorso = nonArmHand[i];
            }
          }
          bestTorso.role = 'torso';
        }
      }

      childItems.forEach((item, ci) => {
        item.idx = leaves.length;
        leaves.push(item);
        frontLeaves.push({
          idx: item.idx,
          leaf: frontParent.children![ci],
          parent: frontParent,
          role: item.role,
        });
      });
    } else {
      const role = classifyMinifigLeafRole(parent.p, resolveName(parent.p));
      const idx = leaves.length;
      leaves.push({ idx, leaf: parent, parent, role });
      frontLeaves.push({ idx, leaf: frontParent, parent: frontParent, role });
    }
  });

  // 1. Determine body reference frame from torso -> hips -> legs_unit -> head -> first leaf
  const refEntry =
    leaves.find((l) => l.role === 'torso') ||
    leaves.find((l) => l.role === 'hips') ||
    leaves.find((l) => l.role === 'legs_unit') ||
    leaves.find((l) => l.role === 'head') ||
    leaves[0];
  const refIdx = refEntry ? refEntry.idx : 0;

  const R_body = mat3Orthonormalize(refEntry?.leaf.m);
  const R_inv = mat3Transpose(R_body);
  const refOrigin: Vec3 = refEntry ? [refEntry.leaf.x, refEntry.leaf.y, refEntry.leaf.z] : [0, 0, 0];

  const bodyUp = mat3Col(R_body, 1);
  const bodyFwd = mat3Col(R_body, 2);
  const bodyTiltDeg = Math.acos(Math.max(-1, Math.min(1, bodyUp[1]))) * (180 / Math.PI);
  const horizFwdLen = Math.hypot(bodyFwd[0], bodyFwd[2]);
  let yawRad: number;
  if (horizFwdLen > 0.25) {
    yawRad = Math.atan2(bodyFwd[0], bodyFwd[2]);
  } else {
    const bodyRight = mat3Col(R_body, 0);
    yawRad = Math.atan2(-bodyRight[2], bodyRight[0]);
  }
  const bodyYawDeg = yawRad * (180 / Math.PI);

  // 1b. Build posedFrontParts: un-yaw around world Y so the minifigure ALWAYS faces +Z (toward camera & key light)
  // while preserving every limb articulation and any intentional torso tilt!
  const R_unyaw = mat3RotY(-yawRad);
  for (const entry of frontLeaves) {
    const lf = entry.leaf;
    const rel = mat3Vec(R_unyaw, lf.x - refOrigin[0], lf.y - refOrigin[1], lf.z - refOrigin[2]);
    lf.x = rel[0];
    lf.y = rel[1];
    lf.z = rel[2];
    lf.m = mat3Multiply(R_unyaw, lf.m || R_IDENTITY);
  }
  recenterComposites(posedFrontParts);
  const frontBox = computeGroupBox(posedFrontParts, computeBox);
  translateParts(posedFrontParts, -frontBox.center[0], -frontBox.min[1], -frontBox.center[2]);
  const centeredFrontBox = computeGroupBox(posedFrontParts, computeBox);

  const frontRefLeaf = frontLeaves[refIdx]?.leaf;
  const R_torsoFront = mat3Orthonormalize(frontRefLeaf?.m);
  const torsoPosFront: Vec3 = frontRefLeaf ? [frontRefLeaf.x, frontRefLeaf.y, frontRefLeaf.z] : [0, 0, 0];

  // 2. Transform EVERY leaf into the upright, front-facing (+Z) torso body frame
  for (const entry of leaves) {
    const lf = entry.leaf;
    const rel = mat3Vec(R_inv, lf.x - refOrigin[0], lf.y - refOrigin[1], lf.z - refOrigin[2]);
    lf.x = rel[0];
    lf.y = rel[1];
    lf.z = rel[2];
    lf.m = mat3Multiply(R_inv, lf.m || R_IDENTITY);
  }

  // 2b. Canonical-frame structural fallback for custom/unknown child IDs inside torso assemblies
  for (const torsoParent of torsoAsmParents) {
    const pLeaves = leaves.filter((l) => l.parent === torsoParent);
    const unclassified = pLeaves.filter((l) => l.role === 'accessory');
    if (unclassified.length === 0) continue;

    let hasArmR = pLeaves.some((l) => l.role === 'arm_r');
    let hasArmL = pLeaves.some((l) => l.role === 'arm_l');

    // First identify arms by their canonical shoulder peg location (±15.552, -9, 0) in torso frame
    for (const item of unclassified) {
      const lf = item.leaf;
      const distR = Math.hypot(lf.x + 15.552, lf.y + 9, lf.z);
      const distL = Math.hypot(lf.x - 15.552, lf.y + 9, lf.z);
      const inShoulderBand =
        Math.abs(lf.x) >= 9 && Math.abs(lf.x) <= 22 && lf.y >= -16 && lf.y <= 2 && Math.abs(lf.z) <= 8;
      if (!hasArmR && (distR <= 8 || (inShoulderBand && lf.x < 0))) {
        item.role = 'arm_r';
        hasArmR = true;
      } else if (!hasArmL && (distL <= 8 || (inShoulderBand && lf.x > 0))) {
        item.role = 'arm_l';
        hasArmL = true;
      }
    }

    // Any remaining unclassified children inside a standard torso assembly (<= 5 parts) are hands
    const stillUnclassified = pLeaves.filter((l) => l.role === 'accessory');
    if (stillUnclassified.length > 0 && pLeaves.length <= 5 && (hasArmR || hasArmL)) {
      for (const item of stillUnclassified) {
        item.role = 'hand';
      }
    }
  }
  for (let i = 0; i < leaves.length; i++) {
    frontLeaves[i].role = leaves[i].role;
  }

  // 3. Un-pose Hips & Legs -> standing straight down (m = R_IDENTITY)
  let legsPosedDeg = 0;
  let hipsPosedDeg = 0;
  const hipsEntry = leaves.find((l) => l.role === 'hips');
  const legEntries = leaves.filter((l) => l.role === 'leg_r' || l.role === 'leg_l');
  const legsUnitEntries = leaves.filter((l) => l.role === 'legs_unit');
  const movedLegAngles = new Map<number, number>();

  if (hipsEntry) {
    const hipsM = mat3Orthonormalize(hipsEntry.leaf.m);
    const hipsAngle = mat3AngleDeg(hipsM, R_IDENTITY);
    hipsPosedDeg = hipsAngle;
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
      const combinedAngle = Math.max(legAngle, hipsAngle);
      legsPosedDeg = Math.max(legsPosedDeg, combinedAngle);
      if (combinedAngle > 10) movedLegAngles.set(leg.idx, combinedAngle);
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
      if (legAngle > 10) movedLegAngles.set(leg.idx, legAngle);
      if (legAngle > 1.5) {
        leg.leaf.m = [...R_IDENTITY] as Mat3;
      }
    }
  }

  // 4. Un-pose Arms & Hands -> default hanging pose at sides, EXCEPT when an arm pose
  //    is physically required for an accessory such as a purse/satchel/two-handed item
  //    or would cause the arm/hand/carried item to collide with the body, accessories, or floor.
  let armsPosedDeg = 0;
  const armEntries = leaves.filter((l) => l.role === 'arm_r' || l.role === 'arm_l');
  const handEntries = leaves.filter((l) => l.role === 'hand');
  const accessoryEntries = leaves.filter((l) => l.role === 'accessory');
  const movedArmInfo: Array<{
    armIdx: number;
    role: 'arm_r' | 'arm_l';
    angleDeg: number;
    handIndices: number[];
    accIndices: number[];
  }> = [];

  if (armEntries.length > 0) {
    // Compute standing body & floor bounds after legs have been straightened
    const standingBodyBoxes = leaves
      .filter((l) => l.role === 'torso' || l.role === 'hips' || l.role === 'leg_r' || l.role === 'leg_l' || l.role === 'legs_unit')
      .map((l) => computeBox(l.leaf));
    const legBoxes = leaves
      .filter((l) => l.role === 'leg_r' || l.role === 'leg_l' || l.role === 'legs_unit')
      .map((l) => computeBox(l.leaf));
    const hasFeetFloor = legBoxes.length > 0;
    const feetMinY = hasFeetFloor ? Math.min(...legBoxes.map((b) => b.min[1])) : -Infinity;

    // Compute arm, hand, and accessory boxes BEFORE moving arms so matching & collision checks are exact
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

    const handBoxes = new Map<TaggedLeaf, WorldBox>();
    for (const he of handEntries) handBoxes.set(he, computeBox(he.leaf));

    const accBoxes = new Map<TaggedLeaf, WorldBox>();
    for (const acc of accessoryEntries) accBoxes.set(acc, computeBox(acc.leaf));

    // Map each accessory to the arm(s) currently gripping it (supports two-handed detection)
    const armToHeldAccessories = new Map<TaggedLeaf, TaggedLeaf[]>();
    const accToGrippingArms = new Map<TaggedLeaf, TaggedLeaf[]>();
    for (const ae of armEntries) armToHeldAccessories.set(ae, []);
    for (const acc of accessoryEntries) {
      const accBox = accBoxes.get(acc)!;
      const accPos: Vec3 = [acc.leaf.x, acc.leaf.y, acc.leaf.z];
      const gripping: TaggedLeaf[] = [];
      for (const ae of armEntries) {
        const matchedHands = armToHands.get(ae) || [];
        const touchesHand = matchedHands.some((he) => {
          const hb = handBoxes.get(he)!;
          return pointToBoxDistance(accPos, hb) <= 18 || boxToBoxDistance(accBox, hb) <= 8;
        });
        if (touchesHand) {
          gripping.push(ae);
          armToHeldAccessories.get(ae)!.push(acc);
        }
      }
      accToGrippingArms.set(acc, gripping);
    }

    const simulateLeafBox = (leaf: RuntimePart, pivot: Vec3, rot: Mat3, overrideM?: Mat3): WorldBox => {
      const sim: RuntimePart = { ...leaf, m: leaf.m ? ([...leaf.m] as Mat3) : ([...R_IDENTITY] as Mat3) };
      rotateLeafAroundPivot(sim, pivot, rot);
      if (overrideM) sim.m = overrideM;
      return computeBox(sim);
    };

    armEntries.forEach((ae, armIdx) => {
      const rawM = ae.leaf.m || R_IDENTITY;
      const isMirrored = mat3Determinant(rawM) < 0;
      const armM = mat3Orthonormalize(isMirrored ? mat3Multiply(rawM, REFLECT_X) : rawM);
      const u = mat3Col(armM, 0); // shoulder hinge pin axis
      const isRightArm = ae.role === 'arm_r' || (ae.role !== 'arm_l' && ae.leaf.x < 0);

      let R_armNeutral: Mat3;
      if (u[0] > 0.5 && Math.abs(u[2]) < 0.08) {
        // Pure shoulder-pin rotation: preserve this arm's exact shoulder-pin tilt
        const fTarget = vec3Norm([-u[0] * u[2], -u[1] * u[2], 1 - u[2] * u[2]]);
        const upTarget = vec3Norm(vec3Cross(fTarget, u));
        R_armNeutral = mat3FromCols(u, upTarget, fTarget);
      } else {
        // Off-pin / yawed / splayed / flipped rotation: snap cleanly to canonical LDraw neutral hanging pose
        R_armNeutral = isRightArm ? ARM_R_CANONICAL_GL : ARM_L_CANONICAL_GL;
      }

      const armAngle = mat3AngleDeg(armM, R_armNeutral);
      if (armAngle <= 4) return;

      const R_corr = mat3Multiply(R_armNeutral, mat3Transpose(armM));
      const pivot: Vec3 = [ae.leaf.x, ae.leaf.y, ae.leaf.z];
      const finalArmM = isMirrored ? mat3Multiply(R_armNeutral, REFLECT_X) : R_armNeutral;
      const matchedHands = armToHands.get(ae) || [];
      const heldAccessories = armToHeldAccessories.get(ae) || [];
      const heldSet = new Set(heldAccessories);

      // Decide whether this arm MUST keep its posed angle for an accessory (e.g. purse/satchel/two-handed item)
      let keepPosedForAccessory = false;

      // 1) Two-handed grip or explicit purse/handbag/satchel/shoulder-bag held in this hand
      for (const acc of heldAccessories) {
        const gripping = accToGrippingArms.get(acc) || [];
        if (gripping.length >= 2) {
          keepPosedForAccessory = true;
          break;
        }
        if (isArmPosingAccessory(acc.leaf.p, resolveName(acc.leaf.p))) {
          keepPosedForAccessory = true;
          break;
        }
      }

      // 2) Simulate moving arm + matched hands to default neutral pose and test against non-held accessories
      if (!keepPosedForAccessory && accessoryEntries.length > 0) {
        const posedArmBox = armBoxes[armIdx];
        const posedHandBoxes = matchedHands.map((he) => handBoxes.get(he)!);
        const simArmBox = simulateLeafBox(ae.leaf, pivot, R_corr, finalArmM);
        const simHandBoxes = matchedHands.map((he) => simulateLeafBox(he.leaf, pivot, R_corr));
        const posedLimbBoxes = [posedArmBox, ...posedHandBoxes];
        const simLimbBoxes = [simArmBox, ...simHandBoxes];

        for (const acc of accessoryEntries) {
          if (heldSet.has(acc)) continue;
          const accBox = accBoxes.get(acc)!;

          // 2a) Geometric collision: moving arm to neutral clips into a body/shoulder accessory (e.g. crossbody purse)
          const overlapBefore = Math.max(...posedLimbBoxes.map((b) => boxOverlapDepth(b, accBox)));
          const overlapAfter = Math.max(...simLimbBoxes.map((b) => boxOverlapDepth(b, accBox)));
          if (overlapAfter > 2.0 && overlapAfter > overlapBefore + 1.5) {
            keepPosedForAccessory = true;
            break;
          }

          // 2b) Known purse / satchel / shoulder bag hanging on this arm's side within arm proximity
          if (isArmPosingAccessory(acc.leaf.p, resolveName(acc.leaf.p))) {
            const onThisSide = isRightArm
              ? accBox.min[0] < -6 && accBox.center[0] < 4
              : accBox.max[0] > 6 && accBox.center[0] > -4;
            const nearArmPath =
              boxToBoxDistance(simArmBox, accBox) <= 10 ||
              boxToBoxDistance(posedArmBox, accBox) <= 10 ||
              simHandBoxes.some((hb) => boxToBoxDistance(hb, accBox) <= 10);
            if (onThisSide && nearArmPath) {
              keepPosedForAccessory = true;
              break;
            }
          }
        }
      }

      // 3) Check carried handheld accessories for new body/legs collision or dipping below feet
      if (!keepPosedForAccessory && heldAccessories.length > 0) {
        for (const acc of heldAccessories) {
          const beforeAccBox = accBoxes.get(acc)!;
          const afterAccBox = simulateLeafBox(acc.leaf, pivot, R_corr);

          // 3a) Would the carried accessory dip below the standing minifigure's feet?
          if (hasFeetFloor && afterAccBox.min[1] < feetMinY - 2.0 && beforeAccBox.min[1] >= feetMinY - 2.0) {
            keepPosedForAccessory = true;
            break;
          }

          // 3b) Would the carried accessory clip into the torso, hips, or legs?
          for (const bodyBox of standingBodyBoxes) {
            const ovBefore = boxOverlapDepth(beforeAccBox, bodyBox);
            const ovAfter = boxOverlapDepth(afterAccBox, bodyBox);
            if (ovAfter > 2.5 && ovAfter > ovBefore + 1.5) {
              keepPosedForAccessory = true;
              break;
            }
          }
          if (keepPosedForAccessory) break;
        }
      }

      if (keepPosedForAccessory) return;

      // Reset arm (and rigidly carry matched hands & clear handheld accessories) to default hanging pose
      armsPosedDeg = Math.max(armsPosedDeg, armAngle);
      ae.leaf.m = finalArmM;

      for (const he of matchedHands) {
        rotateLeafAroundPivot(he.leaf, pivot, R_corr);
      }
      const carriedAccIndices: number[] = [];
      for (const acc of heldAccessories) {
        if (claimedAccessories.has(acc)) continue;
        claimedAccessories.add(acc);
        carriedAccIndices.push(acc.idx);
        rotateLeafAroundPivot(acc.leaf, pivot, R_corr);
      }
      if (armAngle > 10 && (ae.role === 'arm_r' || ae.role === 'arm_l')) {
        movedArmInfo.push({
          armIdx: ae.idx,
          role: ae.role,
          angleDeg: armAngle,
          handIndices: matchedHands.map((h) => h.idx),
          accIndices: carriedAccIndices,
        });
      }
    });
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

  // 7. Build 3D Rotation Indicators, Aligned Starting-Pose Ghost Limbs, and Selective Rotated Part IDs
  const poseIndicators: MinifigRotationIndicator[] = [];
  const poseGhostParts: RuntimePart[] = [];
  const rotatedPartIdSet = new Set<string>();

  const canonRefLeaf = leaves[refIdx]?.leaf;
  const torsoPosCanon: Vec3 = canonRefLeaf ? [canonRefLeaf.x, canonRefLeaf.y, canonRefLeaf.z] : [0, 0, 0];

  const makeGhostLeaf = (leafIdx: number): RuntimePart => {
    const src = leaves[leafIdx].leaf;
    const relX = src.x - torsoPosCanon[0];
    const relY = src.y - torsoPosCanon[1];
    const relZ = src.z - torsoPosCanon[2];
    const rotRel = mat3Vec(R_torsoFront, relX, relY, relZ);
    return {
      ...src,
      id: `${idPrefix}_ghost_${src.id}`,
      x: torsoPosFront[0] + rotRel[0],
      y: torsoPosFront[1] + rotRel[1],
      z: torsoPosFront[2] + rotRel[2],
      m: mat3Multiply(R_torsoFront, src.m || R_IDENTITY),
    };
  };

  const torsoRight = mat3Col(R_torsoFront, 0);
  const torsoUp = mat3Col(R_torsoFront, 1);
  const torsoFwd = mat3Col(R_torsoFront, 2);
  const torsoDown: Vec3 = [-torsoUp[0], -torsoUp[1], -torsoUp[2]];

  // 7a. Legs Indicators (merged when both legs bend together, or separate per leg for asymmetric walking poses)
  if (poseSummary.legsBent) {
    const frontHips = hipsEntry ? frontLeaves[hipsEntry.idx].leaf : null;
    const hipPinOffset = mat3Vec(R_torsoFront, 0, -12, 0);
    const legSpecs: Array<{
      idx: number;
      role: MinifigLeafRole;
      frontLeaf: RuntimePart;
      pivot: Vec3;
      startDir: Vec3;
      endDir: Vec3;
      axis: Vec3;
      angleDeg: number;
      fwdDot: number;
    }> = [];

    for (const [legIdx] of movedLegAngles.entries()) {
      const fl = frontLeaves[legIdx].leaf;
      const role = frontLeaves[legIdx].role;
      const startDir = vec3Norm(torsoDown);
      const endDir = vec3Norm(mat3Vec(mat3Orthonormalize(fl.m), 0, -1, 0));
      const dot = Math.max(-1, Math.min(1, vec3Dot(startDir, endDir)));
      const angleDeg = Math.acos(dot) * (180 / Math.PI);
      if (angleDeg <= 10) continue;
      const cross = vec3Cross(startDir, endDir);
      const axis =
        Math.hypot(cross[0], cross[1], cross[2]) > 1e-3
          ? vec3Norm(cross)
          : vec3Norm([-torsoRight[0], -torsoRight[1], -torsoRight[2]]);
      const pivot: Vec3 = frontHips
        ? [
            role === 'legs_unit' ? frontHips.x : fl.x,
            frontHips.y + hipPinOffset[1],
            frontHips.z + hipPinOffset[2],
          ]
        : [fl.x, fl.y, fl.z];
      legSpecs.push({
        idx: legIdx,
        role,
        frontLeaf: fl,
        pivot,
        startDir,
        endDir,
        axis,
        angleDeg,
        fwdDot: vec3Dot(endDir, torsoFwd),
      });
    }

    const rSpec = legSpecs.find((s) => s.role === 'leg_r');
    const lSpec = legSpecs.find((s) => s.role === 'leg_l');
    const canMergeLegs =
      Boolean(rSpec && lSpec) &&
      Math.abs(rSpec!.angleDeg - lSpec!.angleDeg) < 10 &&
      vec3Dot(rSpec!.endDir, lSpec!.endDir) > 0.96;

    if (canMergeLegs && rSpec && lSpec) {
      const avgDeg = Math.round((rSpec.angleDeg + lSpec.angleDeg) / 2);
      const dirWord = lSpec.fwdDot > 0.15 ? 'forward' : lSpec.fwdDot < -0.15 ? 'back' : '';
      const partIds = [rSpec.frontLeaf.id, lSpec.frontLeaf.id];
      if (frontHips && hipsPosedDeg > 10) partIds.push(frontHips.id);
      for (const pid of partIds) rotatedPartIdSet.add(pid);
      poseGhostParts.push(makeGhostLeaf(rSpec.idx), makeGhostLeaf(lSpec.idx));

      const legBoxL = computeBox(lSpec.frontLeaf);
      const midPivot: Vec3 = [
        (rSpec.pivot[0] + lSpec.pivot[0]) / 2,
        (rSpec.pivot[1] + lSpec.pivot[1]) / 2,
        (rSpec.pivot[2] + lSpec.pivot[2]) / 2,
      ];
      const sideDist = Math.max(22, Math.abs(legBoxL.max[0] - midPivot[0]) + 7);
      poseIndicators.push({
        kind: 'legs',
        label: dirWord ? `Legs ${avgDeg}° ${dirWord}` : `Legs ${avgDeg}°`,
        partIds,
        pivot: midPivot,
        axis: lSpec.axis,
        startDir: lSpec.startDir,
        endDir: lSpec.endDir,
        angleDeg: avgDeg,
        radius: 24,
        lateralOffset: [torsoRight[0] * sideDist, torsoRight[1] * sideDist, torsoRight[2] * sideDist],
        color: INDICATOR_COLOR_LIMB,
      });
    } else {
      for (const spec of legSpecs) {
        const deg = Math.round(spec.angleDeg);
        const dirWord = spec.fwdDot > 0.15 ? 'forward' : spec.fwdDot < -0.15 ? 'back' : '';
        const isRight = spec.role === 'leg_r';
        const isLeft = spec.role === 'leg_l';
        const kind: MinifigIndicatorKind = isRight ? 'leg_r' : isLeft ? 'leg_l' : 'legs';
        const prefix = isRight ? 'Right leg' : isLeft ? 'Left leg' : 'Legs';
        const sideSign = isRight ? -1 : 1;
        const sideDist = spec.role === 'legs_unit' ? 22 : 14;
        const partIds = [spec.frontLeaf.id];
        if (frontHips && hipsPosedDeg > 10) partIds.push(frontHips.id);
        for (const pid of partIds) rotatedPartIdSet.add(pid);
        poseGhostParts.push(makeGhostLeaf(spec.idx));

        poseIndicators.push({
          kind,
          label: dirWord ? `${prefix} ${deg}° ${dirWord}` : `${prefix} ${deg}°`,
          partIds,
          pivot: spec.pivot,
          axis: spec.axis,
          startDir: spec.startDir,
          endDir: spec.endDir,
          angleDeg: deg,
          radius: 24,
          lateralOffset: [
            torsoRight[0] * sideSign * sideDist,
            torsoRight[1] * sideSign * sideDist,
            torsoRight[2] * sideSign * sideDist,
          ],
          color: INDICATOR_COLOR_LIMB,
        });
      }
    }
  }

  // 7b. Arms Indicators (only for arms actually reset in canonical build — excludes purse/accessory-locked arms!)
  for (const info of movedArmInfo) {
    const frontArm = frontLeaves[info.armIdx].leaf;
    const pivot: Vec3 = [frontArm.x, frontArm.y, frontArm.z];
    const rawFrontM = frontArm.m || R_IDENTITY;
    const isMirrored = mat3Determinant(rawFrontM) < 0;
    const frontArmM = mat3Orthonormalize(isMirrored ? mat3Multiply(rawFrontM, REFLECT_X) : rawFrontM);
    const pinAxis = vec3Norm(mat3Col(frontArmM, 0));

    let rawStart: Vec3;
    let rawEnd: Vec3;
    if (info.handIndices.length > 0) {
      const ghostHand = makeGhostLeaf(info.handIndices[0]);
      const frontHand = frontLeaves[info.handIndices[0]].leaf;
      rawStart = [ghostHand.x - pivot[0], ghostHand.y - pivot[1], ghostHand.z - pivot[2]];
      rawEnd = [frontHand.x - pivot[0], frontHand.y - pivot[1], frontHand.z - pivot[2]];
    } else {
      const rawCanonM = leaves[info.armIdx].leaf.m || R_IDENTITY;
      const canonM = mat3Orthonormalize(isMirrored ? mat3Multiply(rawCanonM, REFLECT_X) : rawCanonM);
      const canonAttachedM = mat3Multiply(R_torsoFront, canonM);
      rawStart = mat3Vec(canonAttachedM, 0, -1, 0.35);
      rawEnd = mat3Vec(frontArmM, 0, -1, 0.35);
    }

    const startDir = projectPerp(rawStart, pinAxis);
    const endDir = projectPerp(rawEnd, pinAxis);
    const signedAng = Math.atan2(vec3Dot(pinAxis, vec3Cross(startDir, endDir)), vec3Dot(startDir, endDir));
    const angleDeg = Math.round(Math.abs(signedAng) * (180 / Math.PI));
    if (angleDeg <= 10) continue;

    const arcAxis: Vec3 = signedAng >= 0 ? pinAxis : [-pinAxis[0], -pinAxis[1], -pinAxis[2]];
    const endLocal = mat3Vec(mat3Transpose(R_torsoFront), endDir[0], endDir[1], endDir[2]);
    const dirWord = endLocal[1] > 0.35 ? 'up' : endLocal[2] > 0.25 ? 'forward' : endLocal[2] < -0.25 ? 'back' : '';
    const sideSign = info.role === 'arm_l' ? 1 : -1;
    const sideName = info.role === 'arm_l' ? 'Left arm' : 'Right arm';

    const partIds = [
      frontArm.id,
      ...info.handIndices.map((hi) => frontLeaves[hi].leaf.id),
      ...info.accIndices.map((ai) => frontLeaves[ai].leaf.id),
    ];
    for (const pid of partIds) rotatedPartIdSet.add(pid);
    poseGhostParts.push(makeGhostLeaf(info.armIdx), ...info.handIndices.map(makeGhostLeaf));

    poseIndicators.push({
      kind: info.role,
      label: dirWord ? `${sideName} ${angleDeg}° ${dirWord}` : `${sideName} ${angleDeg}°`,
      partIds,
      pivot,
      axis: arcAxis,
      startDir,
      endDir,
      angleDeg,
      radius: 21,
      lateralOffset: [
        torsoRight[0] * sideSign * 11,
        torsoRight[1] * sideSign * 11,
        torsoRight[2] * sideSign * 11,
      ],
      color: INDICATOR_COLOR_LIMB,
    });
  }

  // 7c. Head Turn Indicator
  if (poseSummary.headTurned && headEntry) {
    const frontHead = frontLeaves[headEntry.idx].leaf;
    const frontHeadgear = headgearEntries.map((hg) => frontLeaves[hg.idx].leaf);
    const headGroupBox = computeGroupBox([frontHead, ...frontHeadgear], computeBox);

    const startDir = projectPerp(torsoFwd, torsoUp);
    const endDir = projectPerp(mat3Col(mat3Orthonormalize(frontHead.m), 2), torsoUp);
    const signedAng = Math.atan2(vec3Dot(torsoUp, vec3Cross(startDir, endDir)), vec3Dot(startDir, endDir));
    const angleDeg = Math.round(Math.abs(signedAng) * (180 / Math.PI));
    if (angleDeg > 10) {
      const arcAxis: Vec3 = signedAng >= 0 ? torsoUp : [-torsoUp[0], -torsoUp[1], -torsoUp[2]];
      const partIds = [frontHead.id, ...frontHeadgear.map((hg) => hg.id)];
      for (const pid of partIds) rotatedPartIdSet.add(pid);

      const headSpan = Math.max(
        headGroupBox.max[0] - headGroupBox.min[0],
        headGroupBox.max[2] - headGroupBox.min[2],
      );
      poseIndicators.push({
        kind: 'head',
        label: `Turn head ${angleDeg}°`,
        partIds,
        pivot: [headGroupBox.center[0], headGroupBox.max[1] + 5, headGroupBox.center[2]],
        axis: arcAxis,
        startDir,
        endDir,
        angleDeg,
        radius: Math.max(14, Math.min(20, headSpan * 0.58)),
        lateralOffset: [0, 0, 0],
        color: INDICATOR_COLOR_LIMB,
      });
    }
  }

  // 7d. Whole-Body Tilt Indicator
  if (poseSummary.bodyTilted) {
    const startDir: Vec3 = [0, 1, 0];
    const endDir = vec3Norm(torsoUp);
    const cross = vec3Cross(startDir, endDir);
    const axis = Math.hypot(cross[0], cross[1], cross[2]) > 1e-3 ? vec3Norm(cross) : ([1, 0, 0] as Vec3);
    const deg = Math.round(bodyTiltDeg);
    const sideDist = Math.max(24, centeredFrontBox.max[0] - centeredFrontBox.center[0] + 10);
    poseIndicators.push({
      kind: 'body_tilt',
      label: `Tilt figure ${deg}°`,
      partIds: [],
      pivot: [centeredFrontBox.center[0], centeredFrontBox.center[1], centeredFrontBox.center[2]],
      axis,
      startDir,
      endDir,
      angleDeg: deg,
      radius: 28,
      lateralOffset: [sideDist, 0, 0],
      color: INDICATOR_COLOR_BODY_TILT,
    });
  }

  // 7e. Whole-Body Yaw Rotation Indicator (placed cleanly below figure, ghost legs, and all limb arcs)
  if (poseSummary.bodyRotated) {
    const absDeg = Math.min(180, Math.round(Math.abs(bodyYawDeg)));
    let lowestY = centeredFrontBox.min[1];
    if (poseGhostParts.length > 0) {
      const ghostBox = computeGroupBox(poseGhostParts, computeBox);
      if (ghostBox.min[1] < lowestY) lowestY = ghostBox.min[1];
    }
    for (const ind of poseIndicators) {
      const u0 = projectPerp(ind.startDir, ind.axis);
      const u1 = vec3Norm(vec3Cross(ind.axis, u0));
      const cy = ind.pivot[1] + ind.lateralOffset[1];
      const maxRad = (ind.angleDeg * Math.PI) / 180;
      for (let s = 0; s <= 6; s++) {
        const a = (s / 6) * maxRad;
        const py = cy + ind.radius * (Math.cos(a) * u0[1] + Math.sin(a) * u1[1]) - 5;
        if (py < lowestY) lowestY = py;
      }
    }
    const baseY = lowestY - 12;
    const startDir: Vec3 = [0, 0, 1];
    const endDir: Vec3 =
      absDeg >= 175 ? [0, 0, -1] : [Math.sin(yawRad), 0, Math.cos(yawRad)];
    const hasPlusXLimbArc = poseIndicators.some((ind) => ind.lateralOffset[0] > 4);
    const arcAxis: Vec3 =
      absDeg >= 175
        ? (hasPlusXLimbArc ? [0, -1, 0] : [0, 1, 0])
        : (bodyYawDeg >= 0 ? [0, 1, 0] : [0, -1, 0]);
    const horizSpan = Math.max(
      centeredFrontBox.max[0] - centeredFrontBox.min[0],
      centeredFrontBox.max[2] - centeredFrontBox.min[2],
    );
    poseIndicators.push({
      kind: 'body_yaw',
      label: absDeg >= 165 ? 'Turn figure 180°' : `Turn figure ${absDeg}°`,
      partIds: [],
      pivot: [0, baseY, 0],
      axis: arcAxis,
      startDir,
      endDir,
      angleDeg: absDeg,
      radius: Math.max(24, Math.min(34, horizSpan * 0.62)),
      lateralOffset: [0, 0, 0],
      color: INDICATOR_COLOR_BODY_YAW,
    });
  }

  // 7f. Smart front 3/4 camera: always faces the minifig (+Z), choosing front-left when ONLY right-side limbs move
  const hasRightOnlyLimb =
    poseIndicators.some((ind) => ind.kind === 'leg_r' || ind.kind === 'arm_r') &&
    !poseIndicators.some(
      (ind) => ind.kind === 'legs' || ind.kind === 'leg_l' || ind.kind === 'arm_l' || ind.kind === 'body_tilt',
    );
  const poseCamera: MinifigPoseCamera = hasRightOnlyLimb
    ? { side: 'top', corner: 'front_left', az: -MINIFIG_POSE_CAMERA.az, el: MINIFIG_POSE_CAMERA.el }
    : { ...MINIFIG_POSE_CAMERA };

  return {
    canonicalParts,
    posedPreviewParts,
    posedFrontParts,
    poseCamera,
    poseIndicators,
    poseGhostParts,
    rotatedPartIds: Array.from(rotatedPartIdSet),
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
    worldForward: bodyFwd,
    worldUp: bodyUp,
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
    /(?:asm_)?(?:bl_)?(?:3815|970|973|3814|76382|41879|16709)/i.test(k) ||
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

function transformBoxToLocal(box: WorldBox, origin: Vec3, rInv: Mat3): WorldBox {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const x of [box.min[0], box.max[0]]) {
    for (const y of [box.min[1], box.max[1]]) {
      for (const z of [box.min[2], box.max[2]]) {
        const p = mat3Vec(rInv, x - origin[0], y - origin[1], z - origin[2]);
        if (p[0] < min[0]) min[0] = p[0];
        if (p[1] < min[1]) min[1] = p[1];
        if (p[2] < min[2]) min[2] = p[2];
        if (p[0] > max[0]) max[0] = p[0];
        if (p[1] > max[1]) max[1] = p[1];
        if (p[2] > max[2]) max[2] = p[2];
      }
    }
  }
  return {
    min,
    max,
    center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
  };
}

function getCoreBodyLeaf(part: RuntimePart, resolveName: (partId: string) => string): RuntimePart {
  if (part.children && part.children.length > 0) {
    return (
      part.children.find((c) => classifyMinifigLeafRole(c.p, resolveName(c.p)) === 'torso') ||
      part.children.find((c) => classifyMinifigLeafRole(c.p, resolveName(c.p)) === 'hips') ||
      part.children[0]
    );
  }
  return part;
}

/**
 * Detects whole minifigure assemblies across an imported model while strictly excluding
 * chairs/seats (e.g. 4079), structural bars/poles/handrails (e.g. 30374 Bar 4L, 63965 Bar 6L),
 * furniture, vehicles, and structural bricks — even when a designer grouped a minifigure
 * with nearby vehicle fixtures inside the same Studio submodel.
 */
export function extractMinifigureGroups(
  parts: RuntimePart[],
  boxes: WorldBox[],
  resolveName: (partId: string) => string,
  adjacency?: number[][],
): {
  groups: DetectedMinifigGroup[];
  kinds: MinifigGroupKind[];
  claimed: Uint8Array;
} {
  const kinds: MinifigGroupKind[] = parts.map((p) => classifyMinifigGroupKind(p, resolveName));
  const claimed = new Uint8Array(parts.length);
  const groups: DetectedMinifigGroup[] = [];

  const isCoreTorsoPart = (part: RuntimePart, idx: number): boolean => {
    if (part.children && part.children.length > 0) return kinds[idx] === 'torso';
    return classifyMinifigLeafRole(part.p, resolveName(part.p)) === 'torso';
  };

  const isLooseArmOrHand = (part: RuntimePart): boolean => {
    if (part.children && part.children.length > 0) return false;
    const r = classifyMinifigLeafRole(part.p, resolveName(part.p));
    return r === 'arm_r' || r === 'arm_l' || r === 'hand';
  };

  const getPartUpVector = (part: RuntimePart): Vec3 => {
    const leaf = getCoreBodyLeaf(part, resolveName);
    return mat3Col(mat3Orthonormalize(leaf.m || R_IDENTITY), 1);
  };

  const isAnchoredToModelStructure = (partIdx: number, ignoreIndices?: Set<number>): boolean => {
    const nbs = adjacency?.[partIdx];
    if (!nbs || nbs.length === 0) return false;
    const selfIsHilt = isLightsaberHiltPart(parts[partIdx].p, resolveName(parts[partIdx].p));
    for (const nb of nbs) {
      if (ignoreIndices?.has(nb)) continue;
      if (kinds[nb] !== null) continue;
      // Do not treat an unanchored lightsaber blade plugged into a lightsaber hilt as model structure
      if (selfIsHilt && isLightsaberBladeCandidate(parts[nb].p, resolveName(parts[nb].p))) {
        const bladeNbs = adjacency?.[nb] || [];
        const bladeAnchored = bladeNbs.some(
          (bnb) => bnb !== partIdx && !ignoreIndices?.has(bnb) && kinds[bnb] === null,
        );
        if (!bladeAnchored) continue;
      }
      return true;
    }
    return false;
  };

  const collectGroupHandPoints = (indices: number[]): Vec3[] => {
    const pts: Vec3[] = [];
    for (const idx of indices) {
      const p = parts[idx];
      const leaves = p.children && p.children.length > 0 ? p.children : [p];
      for (const lf of leaves) {
        if (classifyMinifigLeafRole(lf.p, resolveName(lf.p)) === 'hand') {
          pts.push([lf.x, lf.y, lf.z]);
        }
      }
    }
    return pts;
  };

  const isUnknownPartAttachedToFigure = (
    candIdx: number,
    coreIndices: number[],
    origin: Vec3,
    rInv: Mat3,
    torsoLocal: WorldBox | null,
    headLocal: WorldBox | null,
    hipsLocal: WorldBox | null,
    handLocals: Vec3[],
    subIndexSet: Set<number>,
  ): boolean => {
    // Reject unknown parts physically anchored to the surrounding train/building structure
    if (isAnchoredToModelStructure(candIdx, subIndexSet)) return false;

    const lb = transformBoxToLocal(boxes[candIdx], origin, rInv);
    const sizeX = lb.max[0] - lb.min[0];
    const sizeY = lb.max[1] - lb.min[1];
    const sizeZ = lb.max[2] - lb.min[2];

    // Reject oversized props, bases, seats, or consoles
    if (sizeX > 48 || sizeZ > 48 || sizeY > 64) return false;

    const waistY = torsoLocal
      ? torsoLocal.min[1]
      : hipsLocal
        ? hipsLocal.max[1]
        : headLocal
          ? headLocal.min[1] - 32
          : -20;
    const torsoCenterY = torsoLocal
      ? (torsoLocal.min[1] + torsoLocal.max[1]) / 2
      : waistY + 16;
    const bodyCenterX = torsoLocal
      ? (torsoLocal.min[0] + torsoLocal.max[0]) / 2
      : headLocal
        ? headLocal.center[0]
        : 0;
    const bodyCenterZ = torsoLocal
      ? (torsoLocal.min[2] + torsoLocal.max[2]) / 2
      : headLocal
        ? headLocal.center[2]
        : 0;

    const horizDist = Math.hypot(lb.center[0] - bodyCenterX, lb.center[2] - bodyCenterZ);

    // Reject tall thin vertical poles/stanchions standing off to the side of the torso
    const isSideVerticalPole =
      sizeY >= 32 && Math.max(sizeX, sizeZ) <= 10 && Math.abs(lb.center[0] - bodyCenterX) >= 10;

    // 1. Head / neck / shoulders wearable zone (unrecognized hair, hats, headphones, collars, scarves)
    if (!isSideVerticalPole && horizDist <= 26 && lb.center[1] >= torsoCenterY - 2 && lb.min[1] >= waistY - 8) {
      return true;
    }

    // 2. Thin cape or backpack directly behind the torso
    if (
      !isSideVerticalPole &&
      horizDist <= 24 &&
      sizeZ <= 14 &&
      lb.max[2] <= (torsoLocal ? torsoLocal.min[2] + 8 : -2) &&
      lb.center[1] >= waistY - 12 &&
      lb.max[1] >= torsoCenterY - 4
    ) {
      return true;
    }

    // 3. Compact handheld prop touching a hand (must NOT wrap across body centerline below waist like a seat/base)
    const maxDim = Math.max(sizeX, sizeY, sizeZ);
    const spansUnderWaist =
      lb.min[0] < bodyCenterX - 6 && lb.max[0] > bodyCenterX + 6 && lb.min[1] < waistY - 4;
    if (maxDim <= 36 && !spansUnderWaist) {
      if (handLocals.length > 0 && handLocals.some((hp) => pointToBoxDistance(hp, lb) <= 16)) {
        return true;
      }
      if (
        handLocals.length === 0 &&
        Math.abs(lb.center[0] - bodyCenterX) >= 12 &&
        Math.abs(lb.center[0] - bodyCenterX) <= 38 &&
        lb.center[1] >= waistY - 10 &&
        lb.center[1] <= torsoCenterY + 18 &&
        Math.abs(lb.center[2] - bodyCenterZ) <= 28
      ) {
        return true;
      }
    }

    // Never keep unclaimed parts far from core body
    void coreIndices;
    return false;
  };

  // Stage A: Explicit minifigure submodels (2..16 parts containing >= 2 core body types for a SINGLE minifigure).
  // Non-minifigure parts (such as chairs/seats, structural bars, plates, or vehicle controls grouped with a passenger)
  // are filtered OUT so they stay in the main model and never clip into the standing minifigure build step.
  const mfSubInsts = new Map<string | number, { name: string; indices: number[] }>();
  for (let i = 0; i < parts.length; i++) {
    const chain = (parts[i].subChain as MinifigSubmodelRef[] | undefined) || [];
    for (const entry of chain) {
      if (!mfSubInsts.has(entry.instId)) {
        mfSubInsts.set(entry.instId, { name: entry.name, indices: [] });
      }
      mfSubInsts.get(entry.instId)!.indices.push(i);
    }
  }
  const mfSubCands = Array.from(mfSubInsts.values())
    .filter((r) => r.indices.length >= 2 && r.indices.length <= 16)
    .sort((a, b) => a.indices.length - b.indices.length);

  for (const rec of mfSubCands) {
    if (rec.indices.some((i) => claimed[i])) continue;

    const coreIndices = rec.indices.filter(
      (i) => kinds[i] === 'legs' || kinds[i] === 'torso' || kinds[i] === 'head',
    );
    const coreTypes = new Set(coreIndices.map((i) => kinds[i]));
    if (coreTypes.size < 2) continue;

    // Multi-minifigure submodels (e.g. an entire train seating row) are skipped here so Stage B splits each figure cleanly
    const torsoCount = coreIndices.filter((i) => isCoreTorsoPart(parts[i], i)).length;
    const headCount = coreIndices.filter((i) => kinds[i] === 'head').length;
    if (torsoCount > 1 || headCount > 1) continue;

    // Build local body frame from torso -> legs -> head so unknown wearables (hair/headphones) are kept
    // while seats, chairs, structural bars, floor plates, and other non-minifigure items are excluded.
    const refIdx =
      coreIndices.find((i) => isCoreTorsoPart(parts[i], i)) ??
      coreIndices.find((i) => kinds[i] === 'legs') ??
      coreIndices.find((i) => kinds[i] === 'head') ??
      coreIndices[0];
    const refLeaf = getCoreBodyLeaf(parts[refIdx], resolveName);
    const rBody = mat3Orthonormalize(refLeaf.m || R_IDENTITY);
    const rInv = mat3Transpose(rBody);
    const origin: Vec3 = [refLeaf.x, refLeaf.y, refLeaf.z];

    const torsoIdx = coreIndices.find((i) => isCoreTorsoPart(parts[i], i));
    const headIdx = coreIndices.find((i) => kinds[i] === 'head');
    const legsIdx = coreIndices.find((i) => kinds[i] === 'legs');
    const torsoLocal = torsoIdx !== undefined ? transformBoxToLocal(boxes[torsoIdx], origin, rInv) : null;
    const headLocal = headIdx !== undefined ? transformBoxToLocal(boxes[headIdx], origin, rInv) : null;
    const hipsLocal = legsIdx !== undefined ? transformBoxToLocal(boxes[legsIdx], origin, rInv) : null;

    const handLocals: Vec3[] = [];
    for (const ci of coreIndices) {
      const p = parts[ci];
      const leaves = p.children && p.children.length > 0 ? p.children : [p];
      for (const lf of leaves) {
        if (classifyMinifigLeafRole(lf.p, resolveName(lf.p)) === 'hand') {
          handLocals.push(mat3Vec(rInv, lf.x - origin[0], lf.y - origin[1], lf.z - origin[2]));
        }
      }
    }

    const subIndexSet = new Set(rec.indices);
    const coreCenters = coreIndices.map((i) => boxes[i].center);
    const filtered: number[] = [];

    for (const i of rec.indices) {
      const k = kinds[i];
      if (k === 'legs' || k === 'torso' || k === 'head') {
        filtered.push(i);
        continue;
      }

      const childIds = (parts[i].children || []).map((c) => c.p);
      if (isNonMinifigPart(parts[i].p, resolveName(parts[i].p), childIds)) {
        continue;
      }

      if (k === 'headgear') {
        const c = boxes[i].center;
        if (coreCenters.some((ac) => Math.hypot(c[0] - ac[0], c[1] - ac[1], c[2] - ac[2]) <= 56)) {
          filtered.push(i);
        }
        continue;
      }

      // Unclassified part inside an explicit minifigure submodel (e.g. unrecognized hair mold or neckwear)
      if (
        isUnknownPartAttachedToFigure(
          i,
          coreIndices,
          origin,
          rInv,
          torsoLocal,
          headLocal,
          hipsLocal,
          handLocals,
          subIndexSet,
        )
      ) {
        filtered.push(i);
      }
    }

    if (filtered.length >= 2) {
      filtered.forEach((i) => {
        claimed[i] = 1;
        parts[i]._detachedGap = 0;
      });
      groups.push({ name: rec.name || `Minifigure ${groups.length + 1}`, indices: filtered });
    }
  }

  // Stage B: Geometric whole-body minifigure detection (works on flat .ldr AND tilted/reclined figures!)
  for (let t = 0; t < parts.length; t++) {
    if (claimed[t] || !isCoreTorsoPart(parts[t], t)) continue;
    const tc = boxes[t].center;
    const up = getPartUpVector(parts[t]);
    const localRel = (c: Vec3) => {
      const dx = c[0] - tc[0];
      const dy = c[1] - tc[1];
      const dz = c[2] - tc[2];
      const along = vec3Dot([dx, dy, dz], up);
      const horiz = Math.hypot(dx - up[0] * along, dy - up[1] * along, dz - up[2] * along);
      return { along, horiz };
    };
    const grp = [t];
    // Attach any un-fused loose arms & hands belonging to this torso (flat .ldr files)
    const attachedArmCenters: Vec3[] = [];
    for (let j = 0; j < parts.length; j++) {
      if (claimed[j] || j === t || !isLooseArmOrHand(parts[j])) continue;
      const role = classifyMinifigLeafRole(parts[j].p, resolveName(parts[j].p));
      if (role !== 'arm_r' && role !== 'arm_l') continue;
      const c = boxes[j].center;
      if (Math.hypot(c[0] - tc[0], c[1] - tc[1], c[2] - tc[2]) <= 42) {
        grp.push(j);
        attachedArmCenters.push(c);
      }
    }
    for (let j = 0; j < parts.length; j++) {
      if (claimed[j] || j === t || grp.includes(j) || !isLooseArmOrHand(parts[j])) continue;
      const c = boxes[j].center;
      const nearTorso = Math.hypot(c[0] - tc[0], c[1] - tc[1], c[2] - tc[2]) <= 46;
      const nearArm = attachedArmCenters.some(
        (ac) => Math.hypot(c[0] - ac[0], c[1] - ac[1], c[2] - ac[2]) <= 28,
      );
      if (nearTorso || nearArm) grp.push(j);
    }
    // Nearest unclaimed legs below/at torso (along -up)
    let bestLegs = -1;
    let bestLegsD = 58;
    for (let j = 0; j < parts.length; j++) {
      if (claimed[j] || kinds[j] !== 'legs') continue;
      const { along, horiz } = localRel(boxes[j].center);
      const vDist = Math.abs(along);
      if (horiz <= 36 && along <= 12 && vDist <= 58 && horiz + vDist * 0.6 < bestLegsD) {
        bestLegsD = horiz + vDist * 0.6;
        bestLegs = j;
      }
    }
    if (bestLegs >= 0) {
      grp.push(bestLegs);
      // If un-fused flat .ldr legs (separate 3815 hips + 3816/3817 legs), pull in sibling leg pieces too!
      if (!parts[bestLegs].children?.length) {
        const lc = boxes[bestLegs].center;
        for (let j = 0; j < parts.length; j++) {
          if (claimed[j] || grp.includes(j) || kinds[j] !== 'legs') continue;
          if (parts[j].children?.length) continue;
          const c = boxes[j].center;
          if (Math.hypot(c[0] - lc[0], c[1] - lc[1], c[2] - lc[2]) <= 34) grp.push(j);
        }
      }
    }
    // Nearest unclaimed head above torso (along +up)
    let bestHead = -1;
    let bestHeadD = 62;
    for (let j = 0; j < parts.length; j++) {
      if (claimed[j] || kinds[j] !== 'head') continue;
      const { along, horiz } = localRel(boxes[j].center);
      if (horiz <= 30 && along >= -10 && along <= 72 && horiz + Math.abs(along - 36) * 0.5 < bestHeadD) {
        bestHeadD = horiz + Math.abs(along - 36) * 0.5;
        bestHead = j;
      }
    }
    if (bestHead >= 0) grp.push(bestHead);
    // Attach nearby headgear / wearables / handheld accessories belonging to this figure
    // (chairs/furniture/structural bars already have kind === null; loose props anchored to the model stay in the model)
    const anchors = grp.map((idx) => boxes[idx].center);
    const handPts = collectGroupHandPoints(grp);
    const grpSet = new Set(grp);
    for (let j = 0; j < parts.length; j++) {
      if (claimed[j] || grp.includes(j) || kinds[j] !== 'headgear') continue;
      const c = boxes[j].center;
      const near = anchors.some((ac) => Math.hypot(c[0] - ac[0], c[1] - ac[1], c[2] - ac[2]) <= 46);
      if (!near) continue;
      if (!isWearableOrBagPart(parts[j], resolveName)) {
        // Non-wearable handheld props (mugs, phones, radios, hilts, tools) that are physically mounted to
        // a non-minifig model structure (e.g. a train table, wall clip, or console) stay in the model unless gripped in hand
        const touchesHand = handPts.some((hp) => pointToBoxDistance(hp, boxes[j]) <= 12);
        if (isAnchoredToModelStructure(j, grpSet) && !touchesHand) continue;
      }
      grp.push(j);
      grpSet.add(j);
    }
    if (grp.length >= 2) {
      grp.forEach((i) => {
        claimed[i] = 1;
        parts[i]._detachedGap = 0;
      });
      groups.push({ name: `Minifigure ${groups.length + 1}`, indices: grp });
    }
  }

  // Safety net: merge any remaining unclaimed head (+ touching headgear) into the closest minifigure missing a head
  for (let h = 0; h < parts.length; h++) {
    if (claimed[h] || kinds[h] !== 'head') continue;
    const hc = boxes[h].center;
    let bestG: DetectedMinifigGroup | null = null;
    let bestD = 75;
    for (const g of groups) {
      if (g.indices.some((idx) => kinds[idx] === 'head')) continue;
      for (const idx of g.indices) {
        const c = boxes[idx].center;
        const d = Math.hypot(c[0] - hc[0], c[1] - hc[1], c[2] - hc[2]);
        if (d < bestD) {
          bestD = d;
          bestG = g;
        }
      }
    }
    if (bestG) {
      bestG.indices.push(h);
      claimed[h] = 1;
      parts[h]._detachedGap = 0;
      for (let j = 0; j < parts.length; j++) {
        if (claimed[j] || kinds[j] !== 'headgear') continue;
        const c = boxes[j].center;
        if (Math.hypot(c[0] - hc[0], c[1] - hc[1], c[2] - hc[2]) <= 36) {
          bestG.indices.push(j);
          claimed[j] = 1;
          parts[j]._detachedGap = 0;
        }
      }
    }
  }

  // Post-pass: attach a genuine lightsaber blade (e.g. 30374 Bar 4L) ONLY when plugged directly into
  // a minifigure's lightsaber hilt and NOT anchored to any surrounding model/train structure.
  for (const g of groups) {
    const hiltIndices = g.indices.filter((idx) => isLightsaberHiltPart(parts[idx].p, resolveName(parts[idx].p)));
    if (hiltIndices.length === 0) continue;
    const groupSet = new Set(g.indices);
    for (let b = 0; b < parts.length; b++) {
      if (claimed[b]) continue;
      if (!isLightsaberBladeCandidate(parts[b].p, resolveName(parts[b].p))) continue;
      if (isAnchoredToModelStructure(b, groupSet)) continue;
      const touchesHilt = hiltIndices.some((hi) => boxToBoxDistance(boxes[b], boxes[hi]) <= 8);
      if (!touchesHilt) continue;
      g.indices.push(b);
      groupSet.add(b);
      claimed[b] = 1;
      parts[b]._detachedGap = 0;
    }
  }

  return { groups, kinds, claimed };
}
