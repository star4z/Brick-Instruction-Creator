import { resolvePartDefinition } from '../data/partCatalog';
import type {
  ArticulatedJoinPlan,
  CanonicalModel,
  ConnectivityGraph,
  ProposedSection,
  SubdivisionAssessment,
  SubdivisionOutputMode,
  SubdivisionProposal,
  SubdivisionStrategyId,
  Vec3,
} from '../types/manual';
import { computePartWorldAabb } from './connectivity';

export interface SubdivisionPartInput {
  index: number;
  id: string;
  partId: string;
  partName?: string;
  colorId: number;
  box: {
    min: Vec3;
    max: Vec3;
    center: Vec3;
  };
  isTile?: boolean;
  hasTopStuds?: boolean;
  /** Fraction of top surface covered by studs (0.0 = smooth tile, 0.25-0.67 = jumper/partial, 1.0 = full studs) */
  studFraction?: number;
  isUpright?: boolean;
  isInverted?: boolean;
  isSidewaysCapable?: boolean;
  isWheel?: boolean;
  isWheelHolder?: boolean;
  isBogiePart?: boolean;
  isTechnicAxle?: boolean;
  /** True if this part grips a Technic axle via a cross (+) axle hole */
  hasCrossAxleHole?: boolean;
  /** True if this part is a compact circular cross-axle piece (4032, 3941, 3713, 4265c, gear, etc.) */
  isAxleCollar?: boolean;
  isPinholeCoupler?: boolean;
  isTechnicPin?: boolean;
  /** True if this part connects via a clip, bar, hinge, turntable, or ball-socket joint */
  isClipOrHinge?: boolean;
  hasEmbeddedAxleHole?: boolean;
  isMinifig?: boolean;
  submodelKey?: string;
  submodelInstanceId?: string;
}

export interface SubdivisionAnalysisResult {
  assessment: SubdivisionAssessment;
  proposals: SubdivisionProposal[];
}

export const SECTION_PREVIEW_PALETTE = [
  '#2563eb', // Royal Blue
  '#f97316', // Vivid Orange
  '#10b981', // Emerald
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#06b6d4', // Cyan
  '#eab308', // Amber
  '#14b8a6', // Teal
];

const JOIN_PREVIEW_COLOR = '#e11d48';

const TRAIN_WHEEL_IDS = new Set([
  '38340', '55423', '57878', '50254', '2928', '4180', '7049',
  '73983', '85489', '65734', '65735', '64711',
]);

const WHEEL_HOLDER_IDS = new Set([
  '38339', '2878', '4025', '4092', '65632', '28740', 'bb892', '88011', '88002',
]);

const BOGIE_SWIVEL_TOP_IDS = new Set(['4025', '65632', '2878', '4092']);

const BOGIE_DECOR_IDS = new Set(['2871', '2871b', '4025', '4092', '65632', '2878', '38339', '28740', 'bb892', '88011', '88002']);

const TECHNIC_AXLE_IDS = new Set([
  '32062', '4519', '3705', '32073', '3706', '44294', '3707', '60485',
  '3737', '23948', '3708', '50451', '50450',
  '6587', '24316', '87083', '15462', '32209', '55013',
]);

const AXLE_COLLAR_IDS = new Set([
  // Round plates, bricks & cones with cross axle hole
  '4032', '3941', '6143', '92947', '3942', '6116',
  // Technic bushes & round axle connectors
  '3713', '4265', '32123', '6590', '6538', '59443', '18654', '62462',
  // Circular Technic discs, pulleys, knob wheels & gears with cross axle hole
  '4185', '2958', '2723', '32072', '3736', '6575', '35185', '35186',
  '3647', '3648', '3649', '3650', '10928', '32269', '32270', '6589',
  '94925', '4019', '6542', '69778', '69779', '24121', '65487',
  '42610', '55981', '56902', '56904', '11208', '44292', '6118', '3482',
]);

// Non-circular parts that ALSO grip a Technic axle via a cross (+) axle hole
const EXTRA_CROSS_AXLE_HOLE_IDS = new Set([
  '50254', '32064', '31493', '6536', '32013', '32014', '32015', '32016',
  '32034', '32192', '22961', '32039', '32184', '15100', '42003', '10197',
  '92907', '56145', '15038', '44772', '55982', '86652', '61254',
]);

const STUDLESS_TECHNIC_IDS = new Set([
  '32523', '32524', '32525', '32316', '40490', '32278', '32063', '32054',
  '6632', '32017', '32065', '32009', '32348', '32526', '32271', '32140',
  '60483', '60484', '11478', '14720', '64179', '64178', '39790', '39794',
  '3713', '4265', '32123', '6590', '6538', '59443', '18654', '62462',
  '4185', '2958', '2723', '32072', '3736', '6575',
  '3647', '3648', '3649', '3650', '10928', '32269', '32270', '6589', '94925', '4019', '6542',
]);

const PINHOLE_COUPLER_IDS = new Set([
  '3176', '2444', '2817', '32001', '3709', '15535', '18674', '60474', '11833',
  '32523', '32524', '32525', '32316', '32063', '6632',
]);

const TECHNIC_PIN_IDS = new Set([
  '2780', '3673', '4274', '6558', '32054', '89678', '6628', '43093', '3749', '11214', '32002',
]);

const CLIP_HINGE_IDS = new Set([
  // Clips & bars
  '60475', '15712', '60470', '6019', '4085', '63868', '92280', '2555', '44842', '11476',
  '30374', '63965', '87994', '78258', '48729', '60478', '2540', '3839',
  // Hinges
  '3937', '3938', '2429', '2430', '44302', '44301', '6134', '30383', '30386', '3830', '3831', '19954',
  // Ball joints & turntables
  '14417', '14418', '14419', '14704', '22890',
  '3680', '3679', '61485', '27448', '18938', '18939', '3403', '3404',
]);

const SMOOTH_TILE_IDS = new Set([
  '3070', '3069', '63864', '2431', '6636', '4162', '3068', '26603', '87079', '69729',
  '2412', '25269', '98138', '14769', '15535', '20482', '22385', '35399', '6881', '6934',
  '1751', '66857', '4150', '27925', '35787', '49612',
]);

const PARTIAL_STUD_FRACTION: Record<string, number> = {
  '3794': 0.5,  // 1x2 Jumper Plate (1 stud / 2)
  '15573': 0.5, // 1x2 Jumper Plate (1 stud / 2)
  '87580': 0.25, // 2x2 Jumper Plate (1 stud / 4)
  '92593': 0.5, // 1x4 Plate with 2 Studs
  '41740': 0.5, // 1x4 Plate with 2 Studs
  '34103': 0.67, // 1x3 Plate with 2 Studs
  '3176': 0.67, // 3x2 Plate with Hole (rounded end smooth)
};

export function normalizeSubdivisionPartKey(rawPartId: string): { key: string; baseNum: string } {
  const key = String(rawPartId || '')
    .trim()
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^ldraw\//, '')
    .replace(/^parts\//, '')
    .replace(/^p\//, '')
    .replace(/\.dat$/i, '')
    .replace(/^bl_/, '')
    .replace(/-bl$/, '');
  const noComp = key.replace(/c\d+[a-z]?$/i, '');
  const baseNum = noComp.replace(/(?:pb|ps|pat|pr)\d+[a-z0-9_]*$/i, '').replace(/[a-z]+$/i, '');
  return { key, baseNum: baseNum || key };
}

export function classifySubdivisionPartFlags(
  partId: string,
  partName: string | undefined,
  box: { min: Vec3; max: Vec3; center: Vec3 },
  hints?: {
    isTile?: boolean;
    hasTopStuds?: boolean;
    hasEmbeddedAxleHole?: boolean;
    isSidewaysCapable?: boolean;
    isUpright?: boolean;
    isInverted?: boolean;
  },
): Pick<
  SubdivisionPartInput,
  | 'isTile'
  | 'hasTopStuds'
  | 'studFraction'
  | 'isUpright'
  | 'isInverted'
  | 'isSidewaysCapable'
  | 'isWheel'
  | 'isWheelHolder'
  | 'isBogiePart'
  | 'isTechnicAxle'
  | 'hasCrossAxleHole'
  | 'isAxleCollar'
  | 'isPinholeCoupler'
  | 'isTechnicPin'
  | 'isClipOrHinge'
> {
  const { key, baseNum } = normalizeSubdivisionPartKey(partId);
  const name = (partName || '').toLowerCase();
  const spanX = box.max[0] - box.min[0];
  const spanY = box.max[1] - box.min[1];
  const spanZ = box.max[2] - box.min[2];

  const isWheelHolder =
    WHEEL_HOLDER_IDS.has(key) ||
    WHEEL_HOLDER_IDS.has(baseNum) ||
    /wheel\s*holder|bogie\s*(?:plate|holder)|train\s*motor/i.test(name);

  const isWheel =
    !isWheelHolder &&
    (TRAIN_WHEEL_IDS.has(key) ||
      TRAIN_WHEEL_IDS.has(baseNum) ||
      (/\b(wheel|tire|tyre|rim)\b/i.test(name) &&
        !/holder|bogie|motor|plate|brick|arch|fender|mudguard|steering|ship|cog|gear|pulley|knob\s+wheel|belt\s+wheel|axle\s*hole/i.test(name)));

  const isBogiePart =
    isWheelHolder ||
    BOGIE_DECOR_IDS.has(key) ||
    BOGIE_DECOR_IDS.has(baseNum) ||
    /bogie|train\s*motor.*side|wheel\s*holder/i.test(name);

  const isTechnicAxle =
    TECHNIC_AXLE_IDS.has(key) ||
    TECHNIC_AXLE_IDS.has(baseNum) ||
    (/\baxle\b/i.test(name) &&
      !/hole|brick|plate|wheel|connector|hub|frame|beam|liftarm|bush|gear|cam|pin\s+with|with\s+pin|holder|steering|fork|shock|motor|turntable|differential|portal/i.test(name));

  const isTechnicPin =
    TECHNIC_PIN_IDS.has(key) ||
    TECHNIC_PIN_IDS.has(baseNum) ||
    (/\btechnic\s+pin\b/i.test(name) && !/hole|brick|plate|beam|liftarm|connector/i.test(name));

  const isCompactCircularFootprint =
    Math.abs(spanX - spanZ) <= 8.5 && Math.max(spanX, spanZ) <= 86 && Math.min(spanX, spanZ) >= 12;

  const isAxleCollar =
    !isWheel &&
    !isWheelHolder &&
    !isTechnicAxle &&
    (AXLE_COLLAR_IDS.has(key) ||
      AXLE_COLLAR_IDS.has(baseNum) ||
      (/\baxle\s*hole\b/i.test(name) &&
        /\b(round|cylind|cone|disc|disk|gear|pulley|bush|ring|hub|knob|wheel)\b/i.test(name)) ||
      /\btechnic\s+bush\b|\bbush\s+1\/2\b|\btechnic\s+(?:gear|disc|disk|pulley|wedge\s+belt|knob\s+wheel)\b|\baxle\s+connector\b/i.test(name) ||
      (Boolean(hints?.hasEmbeddedAxleHole) && isCompactCircularFootprint && spanY <= 52));

  const hasCrossAxleHole =
    !isTechnicAxle &&
    (isAxleCollar ||
      EXTRA_CROSS_AXLE_HOLE_IDS.has(key) ||
      EXTRA_CROSS_AXLE_HOLE_IDS.has(baseNum) ||
      /\baxle\s*hole\b/i.test(name) ||
      Boolean(hints?.hasEmbeddedAxleHole));

  const isPinholeCoupler =
    PINHOLE_COUPLER_IDS.has(key) ||
    PINHOLE_COUPLER_IDS.has(baseNum) ||
    (/\b(pin\s*hole|with\s+hole)\b/i.test(name) && /\b(plate|tile|beam|liftarm)\b/i.test(name));

  const isClipOrHinge =
    CLIP_HINGE_IDS.has(key) ||
    CLIP_HINGE_IDS.has(baseNum) ||
    /\b(clip|hinge|ball\s*joint|socket|turntable|swivel|coupler)\b/i.test(name);

  const isStudlessTechnic =
    STUDLESS_TECHNIC_IDS.has(key) ||
    STUDLESS_TECHNIC_IDS.has(baseNum) ||
    (/\b(liftarm|technic\s+beam|technic\s+bush|technic\s+gear|technic\s+disc|technic\s+pulley|wedge\s+belt|knob\s+wheel)\b/i.test(name) &&
      !/brick|plate/i.test(name));

  const isSmoothTile =
    SMOOTH_TILE_IDS.has(key) ||
    SMOOTH_TILE_IDS.has(baseNum) ||
    (Boolean(hints?.isTile) && !/clip|hinge|bar|holder|handle|turntable/i.test(name)) ||
    (/\btile\b/i.test(name) && !/clip|hinge|bar|holder|handle|modified|turntable|stud/i.test(name));

  const isTile = hints?.isTile ?? isSmoothTile;

  let hasTopStuds = hints?.hasTopStuds;
  const forceNoTopStuds =
    isSmoothTile ||
    isTechnicAxle ||
    isStudlessTechnic ||
    isWheel ||
    BOGIE_SWIVEL_TOP_IDS.has(key) ||
    BOGIE_SWIVEL_TOP_IDS.has(baseNum);
  if (hasTopStuds === undefined) {
    hasTopStuds = !forceNoTopStuds;
  } else if (forceNoTopStuds) {
    hasTopStuds = false;
  }

  let studFraction = hasTopStuds ? 1.0 : 0.0;
  if (hasTopStuds) {
    if (PARTIAL_STUD_FRACTION[key] !== undefined) studFraction = PARTIAL_STUD_FRACTION[key];
    else if (PARTIAL_STUD_FRACTION[baseNum] !== undefined) studFraction = PARTIAL_STUD_FRACTION[baseNum];
    else if (/\bjumper\b|1\s*stud|2\s*studs/i.test(name)) studFraction = 0.5;
  }

  const isSidewaysCapable =
    hints?.isSidewaysCapable ??
    (isTechnicPin ||
      isTechnicAxle ||
      isClipOrHinge ||
      isWheel ||
      isWheelHolder ||
      /snot|bracket|clip|hinge|bar|axle|pin|technic|liftarm|beam|turntable|handle|hook|grab|magnet|coupler|buffer|ball|socket|window|glass|door|fence|rail|ladder|hose|antenna|lever/i.test(name));

  return {
    isTile,
    hasTopStuds,
    studFraction,
    isUpright: hints?.isUpright ?? true,
    isInverted: hints?.isInverted ?? false,
    isSidewaysCapable,
    isWheel,
    isWheelHolder,
    isBogiePart,
    isTechnicAxle,
    hasCrossAxleHole,
    isAxleCollar,
    isPinholeCoupler,
    isTechnicPin,
    isClipOrHinge,
  };
}

function enrichPartInput(p: SubdivisionPartInput): SubdivisionPartInput {
  if (
    p.isWheel !== undefined &&
    p.isWheelHolder !== undefined &&
    p.isTechnicAxle !== undefined &&
    p.hasCrossAxleHole !== undefined &&
    p.isAxleCollar !== undefined &&
    p.hasTopStuds !== undefined &&
    p.studFraction !== undefined &&
    p.isClipOrHinge !== undefined
  ) {
    return p;
  }
  const flags = classifySubdivisionPartFlags(p.partId, p.partName, p.box, {
    isTile: p.isTile,
    hasTopStuds: p.hasTopStuds,
    hasEmbeddedAxleHole: p.hasEmbeddedAxleHole,
    isSidewaysCapable: p.isSidewaysCapable,
    isUpright: p.isUpright,
    isInverted: p.isInverted,
  });
  return { ...p, ...flags };
}

export function buildSubdivisionInputsFromCanonical(
  model: CanonicalModel,
  graph: ConnectivityGraph,
): { parts: SubdivisionPartInput[]; adjacency: number[][] } {
  const idToIndex = new Map<string, number>();
  const parts: SubdivisionPartInput[] = model.parts.map((p, index) => {
    idToIndex.set(p.id, index);
    const def = resolvePartDefinition(p.partId);
    const box = computePartWorldAabb(p);
    const m4 = p.rotation[4];
    const flags = classifySubdivisionPartFlags(p.partId, p.partName || def.name, box, {
      isTile: def.shape === 'tile',
      hasTopStuds: def.hasTopStuds,
      isUpright: Math.abs(m4) >= 0.7,
      isInverted: m4 <= -0.7,
      isSidewaysCapable:
        Math.abs(m4) < 0.5 ||
        def.shape === 'snot_brick' ||
        def.shape === 'snot_bracket' ||
        def.shape === 'clip_plate' ||
        def.shape === 'bar_plate' ||
        def.shape === 'bar' ||
        def.shape === 'technic_brick' ||
        def.shape === 'technic_pin' ||
        def.shape === 'hinge_plate',
    });
    return {
      index,
      id: p.id,
      partId: p.partId,
      partName: p.partName || def.name,
      colorId: p.colorId,
      box,
      ...flags,
      isMinifig: def.category === 'Minifigure',
      submodelKey: p.submodelPath[p.submodelPath.length - 1],
    };
  });

  const adjacency: number[][] = Array.from({ length: parts.length }, () => []);
  for (const edge of graph.edges) {
    const a = idToIndex.get(edge.a);
    const b = idToIndex.get(edge.b);
    if (a !== undefined && b !== undefined && a !== b) {
      adjacency[a].push(b);
      adjacency[b].push(a);
    }
  }
  return { parts, adjacency };
}

function computeModelBounds(items: SubdivisionPartInput[]) {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const p of items) {
    if (p.box.min[0] < minX) minX = p.box.min[0];
    if (p.box.min[1] < minY) minY = p.box.min[1];
    if (p.box.min[2] < minZ) minZ = p.box.min[2];
    if (p.box.max[0] > maxX) maxX = p.box.max[0];
    if (p.box.max[1] > maxY) maxY = p.box.max[1];
    if (p.box.max[2] > maxZ) maxZ = p.box.max[2];
  }
  if (!Number.isFinite(minX)) {
    return {
      min: [0, 0, 0] as Vec3,
      max: [0, 0, 0] as Vec3,
      center: [0, 0, 0] as Vec3,
      spanX: 0,
      spanY: 0,
      spanZ: 0,
      diag: 1,
    };
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const spanZ = maxZ - minZ;
  return {
    min: [minX, minY, minZ] as Vec3,
    max: [maxX, maxY, maxZ] as Vec3,
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2] as Vec3,
    spanX,
    spanY,
    spanZ,
    diag: Math.max(1, Math.hypot(spanX, spanY, spanZ)),
  };
}

/**
 * 2D Principal Component Analysis (PCA) on horizontal XZ part centroids.
 * Finds the true lengthwise direction of a model even when built at a diagonal angle.
 */
export function computeHorizontalPrincipalAxis(items: SubdivisionPartInput[]): {
  axis: [number, number];
  perp: [number, number];
  centerXZ: [number, number];
  majorSpan: number;
  minorSpan: number;
} {
  if (items.length === 0) {
    return { axis: [1, 0], perp: [0, 1], centerXZ: [0, 0], majorSpan: 0, minorSpan: 0 };
  }
  let meanX = 0;
  let meanZ = 0;
  for (const p of items) {
    meanX += p.box.center[0];
    meanZ += p.box.center[2];
  }
  meanX /= items.length;
  meanZ /= items.length;

  let cxx = 0;
  let czz = 0;
  let cxz = 0;
  for (const p of items) {
    const dx = p.box.center[0] - meanX;
    const dz = p.box.center[2] - meanZ;
    cxx += dx * dx;
    czz += dz * dz;
    cxz += dx * dz;
  }

  let ux = 1;
  let uz = 0;
  if (Math.abs(cxz) < 1e-4) {
    if (czz > cxx) {
      ux = 0;
      uz = 1;
    }
  } else {
    const halfTrace = (cxx + czz) * 0.5;
    const diff = (cxx - czz) * 0.5;
    const lambda1 = halfTrace + Math.hypot(diff, cxz);
    const vx = cxz;
    const vz = lambda1 - cxx;
    const len = Math.hypot(vx, vz) || 1;
    ux = vx / len;
    uz = vz / len;
  }

  // Canonicalize sign and snap nearly orthogonal models (within ~5 degrees) to exact X or Z
  if (Math.abs(ux) >= 0.996) {
    ux = 1;
    uz = 0;
  } else if (Math.abs(uz) >= 0.996) {
    ux = 0;
    uz = 1;
  } else if (ux < 0 || (ux === 0 && uz < 0)) {
    ux = -ux;
    uz = -uz;
  }

  const px = -uz;
  const pz = ux;

  let minMaj = Infinity, maxMaj = -Infinity;
  let minMin = Infinity, maxMin = -Infinity;
  for (const p of items) {
    const corners: Array<[number, number]> = [
      [p.box.min[0], p.box.min[2]],
      [p.box.max[0], p.box.min[2]],
      [p.box.min[0], p.box.max[2]],
      [p.box.max[0], p.box.max[2]],
    ];
    for (const [x, z] of corners) {
      const maj = (x - meanX) * ux + (z - meanZ) * uz;
      const min = (x - meanX) * px + (z - meanZ) * pz;
      if (maj < minMaj) minMaj = maj;
      if (maj > maxMaj) maxMaj = maj;
      if (min < minMin) minMin = min;
      if (min > maxMin) maxMin = min;
    }
  }

  return {
    axis: [ux, uz],
    perp: [px, pz],
    centerXZ: [meanX, meanZ],
    majorSpan: Math.max(0, maxMaj - minMaj),
    minorSpan: Math.max(0, maxMin - minMin),
  };
}

/**
 * Multi-signal assessment of whether a model benefits from subdivision suggestions on import.
 * Considers raw piece count, physical span (LDU), elongated aspect ratio, and projected readability.
 */
export function assessModelSubdivisionNeed(parts: SubdivisionPartInput[]): SubdivisionAssessment {
  const nonMini = parts.filter((p) => !p.isMinifig);
  const active = nonMini.length >= 10 ? nonMini : parts;
  const bounds = computeModelBounds(active);
  const pca = computeHorizontalPrincipalAxis(active);

  const dims = [bounds.spanX, bounds.spanY, bounds.spanZ].sort((a, b) => b - a);
  const longestSpanLdu = Math.max(dims[0], pca.majorSpan);
  const medianSpanLdu = Math.max(20, dims[1]);
  const horizontalAspect = pca.minorSpan > 1 ? pca.majorSpan / pca.minorSpan : 1;
  const boxAspect = longestSpanLdu / medianSpanLdu;
  const aspectRatio = Math.round(Math.max(horizontalAspect, boxAspect) * 10) / 10;

  const partDiags = active
    .map((p) =>
      Math.hypot(
        p.box.max[0] - p.box.min[0],
        p.box.max[1] - p.box.min[1],
        p.box.max[2] - p.box.min[2],
      ),
    )
    .sort((a, b) => a - b);
  const medianPartDiag = partDiags.length > 0 ? partDiags[Math.floor(partDiags.length / 2)] : 40;
  const readabilityRatio = Math.round((medianPartDiag / bounds.diag) * 1000) / 1000;

  const partCount = parts.length;
  const reasons: string[] = [];

  if (partCount >= 350) {
    reasons.push(`${partCount.toLocaleString()} parts`);
  }
  const longestStuds = Math.round(longestSpanLdu / 20);
  if (longestSpanLdu >= 560) {
    reasons.push(`${longestStuds} studs long`);
  }
  if (aspectRatio >= 3.0 && longestSpanLdu >= 360) {
    reasons.push(`elongated ${aspectRatio.toFixed(1)}:1 shape (${longestStuds} studs)`);
  }
  if (readabilityRatio < 0.045 && active.length >= 40) {
    reasons.push('small bricks relative to full model size');
  }

  const shouldPrompt =
    active.length >= 24 &&
    (partCount >= 350 ||
      longestSpanLdu >= 560 ||
      (aspectRatio >= 3.0 && longestSpanLdu >= 360) ||
      (readabilityRatio < 0.045 && active.length >= 45));

  const tier: SubdivisionAssessment['tier'] =
    partCount >= 1500
      ? 'massive'
      : shouldPrompt
        ? 'suggest'
        : partCount >= 150 || longestSpanLdu >= 400
          ? 'borderline'
          : 'compact';

  return {
    partCount,
    spanX: Math.round(bounds.spanX),
    spanY: Math.round(bounds.spanY),
    spanZ: Math.round(bounds.spanZ),
    longestSpanLdu: Math.round(longestSpanLdu),
    medianSpanLdu: Math.round(medianSpanLdu),
    aspectRatio,
    medianPartDiag: Math.round(medianPartDiag),
    readabilityRatio,
    shouldPrompt,
    tier,
    reasons,
  };
}

function getConnectedComponents(indices: number[], adjacency: number[][]): number[][] {
  const allowed = new Set(indices);
  const visited = new Set<number>();
  const comps: number[][] = [];
  for (const start of indices) {
    if (visited.has(start)) continue;
    const comp: number[] = [];
    const queue = [start];
    visited.add(start);
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      comp.push(u);
      for (const v of adjacency[u] ?? []) {
        if (allowed.has(v) && !visited.has(v)) {
          visited.add(v);
          queue.push(v);
        }
      }
    }
    comps.push(comp);
  }
  comps.sort((a, b) => b.length - a.length);
  return comps;
}

/**
 * Returns true iff the induced subgraph on `indices` is a single connected component
 * (zero floating parts or disconnected fragments inside the section).
 */
export function isConnectedSubgraph(indices: number[], adjacency: number[][]): boolean {
  if (indices.length <= 1) return true;
  const allowed = new Set(indices);
  const visited = new Set<number>();
  const queue = [indices[0]];
  visited.add(indices[0]);
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    for (const v of adjacency[u] ?? []) {
      if (allowed.has(v) && !visited.has(v)) {
        visited.add(v);
        queue.push(v);
      }
    }
  }
  return visited.size === allowed.size;
}

/**
 * Early-exit BFS check verifying that removing `node` from a connected `clusterSet`
 * does NOT split `clusterSet` into disconnected floating pieces (i.e. `node` is not a cut-vertex).
 */
function wouldStayConnectedWithout(
  clusterSet: Set<number>,
  node: number,
  adjacency: number[][],
): boolean {
  const nbs: number[] = [];
  for (const nb of adjacency[node] ?? []) {
    if (nb !== node && clusterSet.has(nb)) nbs.push(nb);
  }
  if (nbs.length <= 1) return true;

  const targetSet = new Set(nbs);
  const visited = new Set<number>([nbs[0]]);
  targetSet.delete(nbs[0]);
  const queue = [nbs[0]];
  let head = 0;
  while (head < queue.length && targetSet.size > 0) {
    const u = queue[head++];
    for (const v of adjacency[u] ?? []) {
      if (v === node || visited.has(v) || !clusterSet.has(v)) continue;
      visited.add(v);
      targetSet.delete(v);
      if (targetSet.size === 0) return true;
      queue.push(v);
    }
  }
  return targetSet.size === 0;
}

function indexSetsTouch(setA: Set<number>, setB: Set<number>, adjacency: number[][]): boolean {
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  for (const u of smaller) {
    for (const nb of adjacency[u] ?? []) {
      if (larger.has(nb)) return true;
    }
  }
  return false;
}

function countSharedEdgesBetween(setA: Set<number>, setB: Set<number>, adjacency: number[][]): number {
  const [smaller, larger] = setA.size <= setB.size ? [setA, setB] : [setB, setA];
  let count = 0;
  for (const u of smaller) {
    for (const nb of adjacency[u] ?? []) {
      if (larger.has(nb)) count++;
    }
  }
  return count;
}

function boxGap3D(
  a: { min: Vec3; max: Vec3 },
  b: { min: Vec3; max: Vec3 },
): number {
  const gx = Math.max(0, a.min[0] - b.max[0], b.min[0] - a.max[0]);
  const gy = Math.max(0, a.min[1] - b.max[1], b.min[1] - a.max[1]);
  const gz = Math.max(0, a.min[2] - b.max[2], b.min[2] - a.max[2]);
  return Math.hypot(gx, gy, gz);
}

/**
 * Returns true iff two proposed sections share at least one physical adjacency edge
 * (meaning merging them preserves single-component connectivity with zero floating parts).
 */
export function sectionsShareEdge(
  secA: ProposedSection,
  secB: ProposedSection,
  adjacency: number[][],
): boolean {
  const setA = new Set<number>(
    secA.repeatPartIndexGroups ? secA.repeatPartIndexGroups.flat() : secA.partIndices,
  );
  const setB = new Set<number>(
    secB.repeatPartIndexGroups ? secB.repeatPartIndexGroups.flat() : secB.partIndices,
  );
  return indexSetsTouch(setA, setB, adjacency);
}

/**
 * Verifies that every section (and every copy in repeat groups) in a subdivision proposal
 * is a single connected subgraph with zero floating parts.
 */
export function verifyProposalZeroFloating(
  proposal: SubdivisionProposal,
  adjacency: number[][],
): { valid: boolean; disconnectedSectionIds: string[] } {
  const disconnectedSectionIds: string[] = [];
  for (const sec of proposal.sections) {
    const groups =
      sec.repeatPartIndexGroups && sec.repeatPartIndexGroups.length > 0
        ? sec.repeatPartIndexGroups
        : [sec.partIndices];
    for (const grp of groups) {
      if (!isConnectedSubgraph(grp, adjacency)) {
        disconnectedSectionIds.push(sec.id);
        break;
      }
    }
  }
  return {
    valid: disconnectedSectionIds.length === 0,
    disconnectedSectionIds,
  };
}

/**
 * Anchored Connected Graph Partitioner:
 * Given a single connected component and an initial spatial bucket assignment (0..k-1),
 * guarantees that EVERY resulting section is a single connected component in `adjacency`
 * (zero floating parts or disconnected fragments), while maximizing spatial fidelity and seam cleanliness.
 */
function enforceConnectedPartition(
  component: number[],
  initialBucketOf: Map<number, number>,
  k: number,
  adjacency: number[][],
  options: {
    minSegmentSize?: number;
    smoothingPasses?: number;
    lockedNodes?: Set<number>;
    scoreCandidate?: (
      node: number,
      targetBucketId: number,
      edgesToTarget: number,
      targetSize: number,
      idealSize: number,
    ) => number;
  } = {},
): { segments: number[][]; bucketIds: number[] } {
  const minSegSize = options.minSegmentSize ?? 4;
  const smoothingPasses = options.smoothingPasses ?? 2;
  const lockedNodes = options.lockedNodes;

  const rawBuckets: number[][] = Array.from({ length: k }, () => []);
  for (const idx of component) {
    const b = initialBucketOf.get(idx) ?? 0;
    const clamped = Math.max(0, Math.min(k - 1, b));
    rawBuckets[clamped].push(idx);
  }

  // 1. Lock the largest connected component of each non-empty spatial bucket as its anchored core.
  const segSets: Set<number>[] = [];
  const bucketIds: number[] = [];
  const segOf = new Map<number, number>();
  const unassigned = new Set<number>();

  for (let b = 0; b < k; b++) {
    if (rawBuckets[b].length === 0) continue;
    const comps = getConnectedComponents(rawBuckets[b], adjacency);
    const core = comps[0];
    const segIdx = segSets.length;
    const set = new Set<number>(core);
    segSets.push(set);
    bucketIds.push(b);
    for (const u of core) segOf.set(u, segIdx);
    for (let ci = 1; ci < comps.length; ci++) {
      for (const u of comps[ci]) unassigned.add(u);
    }
  }

  if (segSets.length <= 1) {
    return { segments: [component], bucketIds: [bucketIds[0] ?? 0] };
  }

  const idealSize = component.length / segSets.length;

  // 2. Anchored Priority Frontier Expansion:
  //    Claim every detached/unassigned node ONLY across physical edges into an already-connected segment.
  const frontier = new Set<number>();
  for (const u of unassigned) {
    for (const nb of adjacency[u] ?? []) {
      if (segOf.has(nb)) {
        frontier.add(u);
        break;
      }
    }
  }

  while (unassigned.size > 0 && frontier.size > 0) {
    let bestNode = -1;
    let bestSeg = -1;
    let bestScore = -Infinity;

    for (const v of frontier) {
      const edgeCounts = new Map<number, number>();
      for (const nb of adjacency[v] ?? []) {
        const s = segOf.get(nb);
        if (s !== undefined) edgeCounts.set(s, (edgeCounts.get(s) ?? 0) + 1);
      }
      const origBucket = initialBucketOf.get(v) ?? 0;

      for (const [s, ec] of edgeCounts.entries()) {
        const bId = bucketIds[s];
        let score: number;
        if (options.scoreCandidate) {
          score = options.scoreCandidate(v, bId, ec, segSets[s].size, idealSize);
        } else {
          const sameBucketBonus = bId === origBucket ? 40 : -Math.abs(bId - origBucket) * 14;
          const balancePenalty =
            segSets[s].size > idealSize * 1.25
              ? (segSets[s].size - idealSize * 1.25) * 0.4
              : 0;
          score = sameBucketBonus + ec * 12 - balancePenalty;
        }
        if (score > bestScore) {
          bestScore = score;
          bestNode = v;
          bestSeg = s;
        }
      }
    }

    if (bestNode < 0 || bestSeg < 0) break;
    segOf.set(bestNode, bestSeg);
    segSets[bestSeg].add(bestNode);
    unassigned.delete(bestNode);
    frontier.delete(bestNode);

    for (const nb of adjacency[bestNode] ?? []) {
      if (unassigned.has(nb)) frontier.add(nb);
    }
  }

  // 3. Connectivity-Preserving Boundary Smoothing (with strict articulation-point check)
  const minKeep = Math.max(minSegSize, Math.floor(component.length * 0.05));
  for (let pass = 0; pass < smoothingPasses; pass++) {
    let moved = 0;
    for (const u of component) {
      if (lockedNodes?.has(u)) continue;
      const curr = segOf.get(u);
      if (curr === undefined || segSets[curr].size <= minKeep) continue;

      const edgeCounts = new Map<number, number>();
      for (const nb of adjacency[u] ?? []) {
        const ns = segOf.get(nb);
        if (ns !== undefined) edgeCounts.set(ns, (edgeCounts.get(ns) ?? 0) + 1);
      }
      const sameEdges = edgeCounts.get(curr) ?? 0;
      const origBucket = initialBucketOf.get(u) ?? bucketIds[curr];

      let bestTarget = curr;
      let bestTargetScore = sameEdges + (bucketIds[curr] === origBucket ? 0.4 : 0);

      for (const [ns, ec] of edgeCounts.entries()) {
        if (ns === curr) continue;
        if (segSets[ns].size > idealSize * 1.45) continue;
        const candScore = ec + (bucketIds[ns] === origBucket ? 0.4 : 0);
        if (candScore > bestTargetScore && ec >= sameEdges) {
          bestTargetScore = candScore;
          bestTarget = ns;
        }
      }

      if (bestTarget !== curr && wouldStayConnectedWithout(segSets[curr], u, adjacency)) {
        segSets[curr].delete(u);
        segSets[bestTarget].add(u);
        segOf.set(u, bestTarget);
        moved++;
      }
    }
    if (moved === 0) break;
  }

  // 4. Absorb any undersized sliver segments into their most-connected neighbor segment
  const activeMask = segSets.map(() => true);
  let activeCount = segSets.length;
  while (activeCount > 1) {
    let tinyIdx = -1;
    let tinySize = minSegSize;
    for (let s = 0; s < segSets.length; s++) {
      if (activeMask[s] && segSets[s].size < tinySize) {
        tinySize = segSets[s].size;
        tinyIdx = s;
      }
    }
    if (tinyIdx < 0) break;

    let bestNb = -1;
    let bestEdges = -1;
    for (let other = 0; other < segSets.length; other++) {
      if (!activeMask[other] || other === tinyIdx) continue;
      const shared = countSharedEdgesBetween(segSets[tinyIdx], segSets[other], adjacency);
      if (shared > bestEdges) {
        bestEdges = shared;
        bestNb = other;
      }
    }
    if (bestNb < 0 || bestEdges <= 0) break;
    for (const u of segSets[tinyIdx]) {
      segSets[bestNb].add(u);
      segOf.set(u, bestNb);
    }
    segSets[tinyIdx].clear();
    activeMask[tinyIdx] = false;
    activeCount--;
  }

  const outSegments: number[][] = [];
  const outBucketIds: number[] = [];
  for (let s = 0; s < segSets.length; s++) {
    if (activeMask[s] && segSets[s].size > 0) {
      outSegments.push(Array.from(segSets[s]));
      outBucketIds.push(bucketIds[s]);
    }
  }
  return { segments: outSegments, bucketIds: outBucketIds };
}

/**
 * Orders a list of connected segments from the same global component into a grounded,
 * cumulative-connected build sequence: segment 0 starts at the lowest base, and each
 * subsequent segment shares at least one physical edge with previously placed segments.
 */
function orderConnectedSections(
  segments: number[][],
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): number[][] {
  if (segments.length <= 1) return segments;
  const sets = segments.map((s) => new Set(s));
  const minYs = segments.map((s) =>
    s.reduce((acc, idx) => Math.min(acc, allParts[idx].box.min[1]), Infinity),
  );

  let first = 0;
  for (let i = 1; i < segments.length; i++) {
    if (
      minYs[i] < minYs[first] - 4 ||
      (Math.abs(minYs[i] - minYs[first]) <= 4 && segments[i].length > segments[first].length)
    ) {
      first = i;
    }
  }

  const placedMask = segments.map(() => false);
  const placedNodes = new Set<number>(segments[first]);
  const ordered: number[][] = [segments[first]];
  placedMask[first] = true;

  while (ordered.length < segments.length) {
    let bestIdx = -1;
    let bestScore = -Infinity;
    for (let i = 0; i < segments.length; i++) {
      if (placedMask[i]) continue;
      const shared = countSharedEdgesBetween(sets[i], placedNodes, adjacency);
      if (shared <= 0) continue;
      const score = shared * 2.5 - minYs[i] * 0.2;
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    if (bestIdx < 0) {
      for (let i = 0; i < segments.length; i++) {
        if (!placedMask[i]) {
          bestIdx = i;
          break;
        }
      }
    }
    if (bestIdx < 0) break;
    placedMask[bestIdx] = true;
    ordered.push(segments[bestIdx]);
    for (const u of segments[bestIdx]) placedNodes.add(u);
  }
  return ordered;
}

/**
 * Places secondary global components (e.g. a separate station platform vs an unlinked bogie/detail
 * resting directly against a car section):
 * - Components physically resting within 16 LDU of an existing non-join section attach to that section
 *   (e.g. an unlinked wheel bogie directly underneath a car floor or a tiny roof tile on top of a car).
 * - Genuinely separate assemblies (> 16 LDU away) stay in their own standalone connected sections
 *   so they NEVER float far away beside an unrelated section!
 */
function placeSecondaryGlobalComponents(
  sections: ProposedSection[],
  secondaryComps: number[][],
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  globalCenter: Vec3,
  outputMode: SubdivisionOutputMode,
  allowProximityFold = false,
): void {
  const standalone: number[][] = [];
  for (const comp of secondaryComps) {
    if (comp.length === 0) continue;
    if (allowProximityFold) {
      const compBounds = computeModelBounds(comp.map((i) => allParts[i]));
      let bestSec: ProposedSection | null = null;
      let bestGap = 16;
      for (const sec of sections) {
        if (sec.role === 'join' || sec.repeatPartIndexGroups) continue;
        for (const pi of sec.partIndices) {
          const g = boxGap3D(compBounds, allParts[pi].box);
          if (g < bestGap) {
            bestGap = g;
            bestSec = sec;
          }
        }
      }
      if (bestSec) {
        bestSec.partIndices.push(...comp);
        bestSec.partIds.push(...comp.map((i) => allParts[i].id));
        continue;
      }
    }
    standalone.push(comp);
  }

  standalone.forEach((comp, idx) => {
    const sb = computeModelBounds(comp.map((i) => allParts[i]));
    const dx = sb.center[0] - globalCenter[0];
    const dz = sb.center[2] - globalCenter[2];
    const hLen = Math.hypot(dx, dz) || 1;
    const secIdx = sections.length;
    sections.push({
      id: `sec_extra_${idx + 1}`,
      name:
        outputMode === 'numbered_bags'
          ? `Bag ${secIdx + 1} (Separate Build)`
          : standalone.length === 1
            ? 'Separate Assembly'
            : `Separate Assembly ${idx + 1}`,
      partIndices: comp,
      partIds: comp.map((i) => allParts[i].id),
      role: outputMode === 'numbered_bags' ? 'bag' : 'module',
      cutEdgeCount: countCutEdges(comp, adjacency),
      explodeOffset: [dx / hLen, 0, dz / hLen],
      previewColor: SECTION_PREVIEW_PALETTE[secIdx % SECTION_PREVIEW_PALETTE.length],
    });
  });
}

/**
 * Computes proportional radial explode offsets from the mean centroid of a set of section centers.
 * Dividing all deltas by a single shared max radius produces a homothetic expansion so collinear
 * sections (e.g. 3+ baseplates or modules in a row) all separate evenly from each other rather
 * than two sections on the same side of the centroid collapsing onto the same unit vector.
 */
export function computeRadialExplodeOffsets(
  centers: Vec3[],
  opts: { horizontalOnly?: boolean; scale?: number; yScale?: number; clampYNonNegative?: boolean } = {},
): Vec3[] {
  const n = centers.length;
  if (n === 0) return [];
  const horizontalOnly = Boolean(opts.horizontalOnly);
  const scale = opts.scale ?? 1.0;
  const yScale = opts.yScale ?? 0.5;
  const clampYNonNegative = Boolean(opts.clampYNonNegative);

  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const c of centers) {
    cx += c[0];
    cy += c[1];
    cz += c[2];
  }
  cx /= n;
  cy /= n;
  cz /= n;

  const deltas = centers.map(
    (c) => [c[0] - cx, horizontalOnly ? 0 : c[1] - cy, c[2] - cz] as Vec3,
  );

  let maxR = 0;
  for (const d of deltas) {
    const r = horizontalOnly ? Math.hypot(d[0], d[2]) : Math.hypot(d[0], d[1], d[2]);
    if (r > maxR) maxR = r;
  }
  if (maxR < 1e-4) {
    return centers.map(() => [0, 0, 0] as Vec3);
  }

  return deltas.map((d) => {
    const ox = (d[0] / maxR) * scale;
    const rawY = horizontalOnly ? 0 : (d[1] / maxR) * scale * yScale;
    const oy = clampYNonNegative ? Math.max(0, rawY) : rawY;
    const oz = (d[2] / maxR) * scale;
    return [ox, oy, oz] as Vec3;
  });
}

function countCutEdges(indices: number[], adjacency: number[][]): number {
  const set = new Set(indices);
  let cut = 0;
  for (const i of indices) {
    for (const nb of adjacency[i] ?? []) {
      if (!set.has(nb)) cut++;
    }
  }
  return cut;
}

function areSectionsStructurallyIdentical(
  indicesA: number[],
  indicesB: number[],
  allParts: SubdivisionPartInput[],
): boolean {
  if (indicesA.length !== indicesB.length || indicesA.length < 6) return false;

  const bagKey = (list: number[]): string => {
    const counts = new Map<string, number>();
    for (const idx of list) {
      const p = allParts[idx];
      const k = `${p.partId}:${p.colorId}`;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([k, c]) => `${k}x${c}`)
      .join(',');
  };
  if (bagKey(indicesA) !== bagKey(indicesB)) return false;

  // Compare quantized distance profile from each section's centroid (invariant under 180° rotation & reflection)
  const distProfile = (list: number[]): string => {
    let cx = 0, cy = 0, cz = 0;
    for (const idx of list) {
      cx += allParts[idx].box.center[0];
      cy += allParts[idx].box.center[1];
      cz += allParts[idx].box.center[2];
    }
    cx /= list.length;
    cy /= list.length;
    cz /= list.length;
    return list
      .map((idx) => {
        const p = allParts[idx];
        const d = Math.hypot(p.box.center[0] - cx, p.box.center[1] - cy, p.box.center[2] - cz);
        return `${p.partId}:${p.colorId}@${Math.round(d / 6) * 6}`;
      })
      .sort()
      .join('|');
  };

  return distProfile(indicesA) === distProfile(indicesB);
}

function estimateStepsAndPages(totalParts: number, sectionCount: number, pacingPartsPerStep = 6) {
  const estimatedStepCount = Math.max(sectionCount, Math.ceil(totalParts / pacingPartsPerStep));
  const estimatedPageCount = Math.max(
    sectionCount + 2,
    Math.ceil(estimatedStepCount * 0.62) + sectionCount,
  );
  return { estimatedStepCount, estimatedPageCount };
}

function computeSectionDiag(indices: number[], allParts: SubdivisionPartInput[]): number {
  const subset = indices.map((i) => allParts[i]).filter(Boolean);
  return computeModelBounds(subset).diag;
}

export type TypedConnectionKind =
  | 'stud'
  | 'axle_cross'
  | 'wheel_mount'
  | 'rigid_pin'
  | 'axle_round'
  | 'clip_hinge'
  | 'tile_rest'
  | 'tile_seam';

export interface TypedConnectionEdge {
  a: number;
  b: number;
  kind: TypedConnectionKind;
  strength: 'strong' | 'weak';
  contactArea: number;
  lowerIdx?: number;
  upperIdx?: number;
}

export interface TypedConnectionGraph {
  edges: TypedConnectionEdge[];
  strongAdj: number[][];
  weakAdj: number[][];
  edgeMap: Map<number, TypedConnectionEdge>;
  tileSeamCapPartSets: Set<number>[];
}

function isVerticalPivotRod(p: SubdivisionPartInput): boolean {
  const spanX = p.box.max[0] - p.box.min[0];
  const spanY = p.box.max[1] - p.box.min[1];
  const spanZ = p.box.max[2] - p.box.min[2];
  const horiz = Math.max(spanX, spanZ);
  if (spanY < 32 || spanY < horiz * 1.6) return false;
  if (p.isTechnicAxle) return true;
  if (horiz <= 16 && spanY >= 48 && /\b(axle|rod|bar)\b/i.test(p.partName || '')) return true;
  return false;
}

const TURNTABLE_IDS = new Set(['3680', '3679', '61485', '27448', '18938', '18939', '3403', '3404']);

/**
 * Classifies a physical contact between two adjacent LEGO parts from first principles:
 * - STRONG: stud-to-anti-stud, SNOT side-studs, Technic axle through a cross (+) hole,
 *           wheel-to-wheel-holder mount, rigid Technic pins.
 * - WEAK:   Technic axle through a round pinhole, clip/bar/hinge/turntable/ball-socket/swivel,
 *           opposing pinhole coupler tongues, resting on top of a smooth tile.
 * - NONE:   concave-scoop hollow AABB overlaps or smooth side-wall grazing.
 */
export function classifyConnectionEdge(
  a: SubdivisionPartInput,
  b: SubdivisionPartInput,
): {
  kind: TypedConnectionKind | 'none';
  strength: 'strong' | 'weak' | 'none';
  contactArea: number;
  lowerIdx?: number;
  upperIdx?: number;
} {
  const boxA = a.box;
  const boxB = b.box;
  const ovX = Math.min(boxA.max[0], boxB.max[0]) - Math.max(boxA.min[0], boxB.min[0]);
  const ovY = Math.min(boxA.max[1], boxB.max[1]) - Math.max(boxA.min[1], boxB.min[1]);
  const ovZ = Math.min(boxA.max[2], boxB.max[2]) - Math.max(boxA.min[2], boxB.min[2]);

  // 1. Technic Axle connections:
  //    - Axle through a CROSS (+) hole -> STRONG (axle_cross)
  //    - Axle through a ROUND hole     -> WEAK   (axle_round, like clips/hinges)
  if (a.isTechnicAxle || b.isTechnicAxle) {
    if (a.isTechnicAxle && b.isTechnicAxle) {
      return { kind: 'none', strength: 'none', contactArea: 0 };
    }
    const other = a.isTechnicAxle ? b : a;
    if (other.hasCrossAxleHole) {
      return { kind: 'axle_cross', strength: 'strong', contactArea: 400 };
    }
    return { kind: 'axle_round', strength: 'weak', contactArea: 200 };
  }

  // 2. Wheel <-> Wheel Holder mount (general for cars, trains, trucks, aircraft)
  if (a.isWheel || b.isWheel) {
    if ((a.isWheel && b.isWheelHolder) || (b.isWheel && a.isWheelHolder)) {
      return { kind: 'wheel_mount', strength: 'strong', contactArea: 400 };
    }
    return { kind: 'none', strength: 'none', contactArea: 0 };
  }

  const lower = boxA.center[1] <= boxB.center[1] ? a : b;
  const upper = lower === a ? b : a;
  const keyA = normalizeSubdivisionPartKey(a.partId);
  const keyB = normalizeSubdivisionPartKey(b.partId);
  const lowerKey = lower === a ? keyA : keyB;

  // 3. Turntable base <-> top & swivel pin tops are articulated pivots (WEAK)
  if (
    (TURNTABLE_IDS.has(keyA.key) || TURNTABLE_IDS.has(keyA.baseNum)) &&
    (TURNTABLE_IDS.has(keyB.key) || TURNTABLE_IDS.has(keyB.baseNum))
  ) {
    return { kind: 'clip_hinge', strength: 'weak', contactArea: Math.max(0, ovX) * Math.max(0, ovZ) };
  }
  if (
    (BOGIE_SWIVEL_TOP_IDS.has(lowerKey.key) || BOGIE_SWIVEL_TOP_IDS.has(lowerKey.baseNum)) &&
    upper.box.min[1] >= lower.box.max[1] - 6
  ) {
    return {
      kind: 'clip_hinge',
      strength: 'weak',
      contactArea: Math.max(0, ovX) * Math.max(0, ovZ),
      lowerIdx: lower.index,
      upperIdx: upper.index,
    };
  }
  if (
    lower.isWheelHolder &&
    !upper.isBogiePart &&
    !upper.isWheelHolder &&
    Math.max(upper.box.max[0] - upper.box.min[0], upper.box.max[2] - upper.box.min[2]) >= 120
  ) {
    return {
      kind: 'clip_hinge',
      strength: 'weak',
      contactArea: Math.max(0, ovX) * Math.max(0, ovZ),
      lowerIdx: lower.index,
      upperIdx: upper.index,
    };
  }

  // 4. Vertical face-to-face stacking contact (rejects concave-scoop hollow AABB enclosure!)
  const faceGap = Math.abs(lower.box.max[1] - upper.box.min[1]);
  if (ovX >= 3.0 && ovZ >= 3.0 && faceGap <= 6.5) {
    const contactArea = Math.max(0, ovX) * Math.max(0, ovZ);

    if (a.isTechnicPin || b.isTechnicPin) {
      return { kind: 'rigid_pin', strength: 'strong', contactArea, lowerIdx: lower.index, upperIdx: upper.index };
    }

    // Opposing pinhole coupler plates/beams overlapping only at their pivot holes swivel freely (WEAK)
    if (a.isPinholeCoupler && b.isPinholeCoupler) {
      const centerDistXZ = Math.hypot(
        boxA.center[0] - boxB.center[0],
        boxA.center[2] - boxB.center[2],
      );
      if (centerDistXZ >= 14) {
        return { kind: 'clip_hinge', strength: 'weak', contactArea, lowerIdx: lower.index, upperIdx: upper.index };
      }
    }

    // Compact circular cross-axle collar resting against a pinhole coupler plate/beam does not stud-weld
    if (
      (a.isAxleCollar && b.isPinholeCoupler) ||
      (b.isAxleCollar && a.isPinholeCoupler)
    ) {
      return { kind: 'tile_rest', strength: 'weak', contactArea, lowerIdx: lower.index, upperIdx: upper.index };
    }

    const lowerUpright = lower.isUpright !== false;
    const upperUpright = upper.isUpright !== false;
    if (lowerUpright && upperUpright) {
      if (lower.isInverted && !upper.isInverted) {
        return { kind: 'none', strength: 'none', contactArea: 0 };
      }
      if (!lower.isInverted && upper.isInverted) {
        return { kind: 'none', strength: 'none', contactArea: 0 };
      }
      const studBearing = lower.isInverted && upper.isInverted ? upper : lower;
      const frac = studBearing.studFraction ?? (studBearing.hasTopStuds === false ? 0 : 1);
      if (frac <= 0.05) {
        // Resting on top of a smooth tile / studless surface -> NOT strongly connected!
        return { kind: 'tile_rest', strength: 'weak', contactArea, lowerIdx: lower.index, upperIdx: upper.index };
      }
      return { kind: 'stud', strength: 'strong', contactArea, lowerIdx: lower.index, upperIdx: upper.index };
    }

    // Sideways (SNOT) part meeting vertically with genuine contact
    if (a.isSidewaysCapable || b.isSidewaysCapable) {
      if (a.isClipOrHinge && b.isClipOrHinge) {
        return { kind: 'clip_hinge', strength: 'weak', contactArea, lowerIdx: lower.index, upperIdx: upper.index };
      }
      return { kind: 'stud', strength: 'strong', contactArea, lowerIdx: lower.index, upperIdx: upper.index };
    }
    return { kind: 'none', strength: 'none', contactArea: 0 };
  }

  // 5. Sideways / SNOT / Clip / Hinge / Pin contact:
  // Upright circular axle collars have NO side studs or clips (rejects concave-scoop hollow overlap!)
  if ((a.isAxleCollar && a.isUpright !== false) || (b.isAxleCollar && b.isUpright !== false)) {
    return { kind: 'none', strength: 'none', contactArea: 0 };
  }

  const goodAxes = (ovX >= 1.5 ? 1 : 0) + (ovY >= 1.5 ? 1 : 0) + (ovZ >= 1.5 ? 1 : 0);
  if (goodAxes < 2) return { kind: 'none', strength: 'none', contactArea: 0 };

  // Sideways clip <-> bar, hinge <-> hinge, ball <-> socket are articulated joints (WEAK)
  if (a.isClipOrHinge && b.isClipOrHinge) {
    return { kind: 'clip_hinge', strength: 'weak', contactArea: 200 };
  }
  if (a.isTechnicPin || b.isTechnicPin) {
    return { kind: 'rigid_pin', strength: 'strong', contactArea: 200 };
  }
  if ((!a.isUpright || !b.isUpright) && ovX >= 1.5 && ovY >= 1.5 && ovZ >= 1.5) {
    return { kind: 'stud', strength: 'strong', contactArea: 400 };
  }
  if (a.isSidewaysCapable && b.isSidewaysCapable) {
    return { kind: 'stud', strength: 'strong', contactArea: 400 };
  }
  return { kind: 'none', strength: 'none', contactArea: 0 };
}

/** Backwards-compatible predicate: true when an edge is a strong LEGO clutch connection. */
export function isRigidStudEdge(a: SubdivisionPartInput, b: SubdivisionPartInput): boolean {
  const res = classifyConnectionEdge(a, b);
  return res.strength === 'strong';
}

/**
 * Builds the general LEGO Typed Connection-Strength Graph and applies the
 * Tile-Majority Seam Rule: whenever an upper assembly rests on a horizontal mix
 * of smooth tiles and minimal anchor studs where tile contact area exceeds stud
 * contact area, treat the seam like the majority (weak detachable seam, e.g.
 * removable train roofs, vehicle tops, or modular building floors).
 */
export function buildTypedConnectionGraph(
  rawAllParts: SubdivisionPartInput[],
  adjacency: number[][],
): TypedConnectionGraph {
  const allParts = rawAllParts.map(enrichPartInput);
  const n = allParts.length;
  const strongAdj: number[][] = Array.from({ length: n }, () => []);
  const weakAdj: number[][] = Array.from({ length: n }, () => []);
  const edges: TypedConnectionEdge[] = [];
  const edgeMap = new Map<number, TypedConnectionEdge>();

  for (let i = 0; i < n; i++) {
    const pa = allParts[i];
    if (!pa || pa.isMinifig) continue;
    for (const j of adjacency[i] ?? []) {
      if (j <= i) continue;
      const pb = allParts[j];
      if (!pb || pb.isMinifig) continue;
      const c = classifyConnectionEdge(pa, pb);
      if (c.kind === 'none' || c.strength === 'none') continue;
      const edge: TypedConnectionEdge = {
        a: i,
        b: j,
        kind: c.kind,
        strength: c.strength,
        contactArea: c.contactArea,
        lowerIdx: c.lowerIdx,
        upperIdx: c.upperIdx,
      };
      edges.push(edge);
      edgeMap.set(i * n + j, edge);
      if (edge.strength === 'strong') {
        strongAdj[i].push(j);
        strongAdj[j].push(i);
      } else {
        weakAdj[i].push(j);
        weakAdj[j].push(i);
      }
    }
  }

  // Tile-Majority Seam Weakening:
  // Inspect each initial strong component for horizontal interfaces with smooth tiles
  // (or partial-stud jumper plates) where smooth tile area > stud contact area.
  const activeIndices = allParts.filter((p) => !p.isMinifig).map((p) => p.index);
  const initComps = getConnectedComponents(activeIndices, strongAdj);
  const tileSeamCapPartSets: Set<number>[] = [];

  const getEdge = (u: number, v: number): TypedConnectionEdge | undefined => {
    const lo = u < v ? u : v;
    const hi = u < v ? v : u;
    return edgeMap.get(lo * n + hi);
  };

  for (const comp of initComps) {
    if (comp.length < 10) continue;
    const compSet = new Set(comp);

    // Collect candidate horizontal seam Y values where tile_rest or partial-stud contacts occur
    const candidateYs = new Set<number>();
    for (const u of comp) {
      for (const v of weakAdj[u] ?? []) {
        if (v <= u || !compSet.has(v)) continue;
        const e = getEdge(u, v);
        if (e && e.kind === 'tile_rest' && e.lowerIdx !== undefined) {
          candidateYs.add(Math.round(allParts[e.lowerIdx].box.max[1] / 4) * 4);
        }
      }
      for (const v of strongAdj[u] ?? []) {
        if (v <= u || !compSet.has(v)) continue;
        const e = getEdge(u, v);
        if (e && e.kind === 'stud' && e.lowerIdx !== undefined) {
          const frac = allParts[e.lowerIdx].studFraction ?? 1;
          if (frac < 0.9) {
            candidateYs.add(Math.round(allParts[e.lowerIdx].box.max[1] / 4) * 4);
          }
        }
      }
    }
    if (candidateYs.size === 0) continue;

    // Peel from highest seam down (roofs first, then upper floors)
    const sortedYs = Array.from(candidateYs).sort((a, b) => b - a);
    const remainingInComp = new Set<number>(comp);

    for (const y of sortedYs) {
      const aboveY: number[] = [];
      for (const idx of remainingInComp) {
        if (allParts[idx].box.min[1] >= y - 4.5) aboveY.push(idx);
      }
      if (aboveY.length < 4 || remainingInComp.size - aboveY.length < 4) continue;

      const aboveComps = getConnectedComponents(aboveY, strongAdj);
      for (const upperComp of aboveComps) {
        if (upperComp.length < 4 || remainingInComp.size - upperComp.length < 4) continue;
        const upperSet = new Set(upperComp);

        let tileArea = 0;
        let studArea = 0;
        let trappedUnderOverhang = false;
        const strongSeamEdges: TypedConnectionEdge[] = [];

        for (const u of upperComp) {
          for (const nb of adjacency[u] ?? []) {
            if (!remainingInComp.has(nb) || upperSet.has(nb)) continue;
            const e = getEdge(u, nb);
            if (!e) continue;

            if (e.strength === 'strong') {
              // If a lower/spanning part sits rigidly ON TOP of upperComp, upperComp cannot lift off cleanly
              if (e.lowerIdx === u && e.upperIdx === nb) {
                trappedUnderOverhang = true;
                break;
              }
              strongSeamEdges.push(e);
              if (e.kind === 'stud' && e.lowerIdx === nb && e.upperIdx === u) {
                const frac = allParts[nb].studFraction ?? 1;
                studArea += e.contactArea * frac;
                tileArea += e.contactArea * (1 - frac);
              } else {
                studArea += Math.max(400, e.contactArea);
              }
            } else if (e.kind === 'tile_rest' && e.lowerIdx === nb && e.upperIdx === u) {
              tileArea += e.contactArea;
            }
          }
          if (trappedUnderOverhang) break;
        }

        // Majority rule: smooth tile contact strictly exceeds stud contact!
        if (!trappedUnderOverhang && tileArea > studArea && tileArea >= 600) {
          for (const e of strongSeamEdges) {
            e.kind = 'tile_seam';
            e.strength = 'weak';
            // Move edge from strongAdj to weakAdj
            strongAdj[e.a] = strongAdj[e.a].filter((x) => x !== e.b);
            strongAdj[e.b] = strongAdj[e.b].filter((x) => x !== e.a);
            if (!weakAdj[e.a].includes(e.b)) weakAdj[e.a].push(e.b);
            if (!weakAdj[e.b].includes(e.a)) weakAdj[e.b].push(e.a);
          }
          tileSeamCapPartSets.push(upperSet);
          for (const u of upperComp) remainingInComp.delete(u);
        }
      }
    }
  }

  // Also preserve strong components resting purely on smooth tiles (zero anchor studs)
  // so 100%-tile removable roofs/lids are treated identically to minimal-stud tile-majority roofs!
  const finalStrongComps = getConnectedComponents(activeIndices, strongAdj);
  const alreadyRecorded = new Set<number>();
  for (const s of tileSeamCapPartSets) {
    for (const idx of s) alreadyRecorded.add(idx);
  }
  for (const comp of finalStrongComps) {
    if (comp.length < 6) continue;
    if (comp.every((idx) => alreadyRecorded.has(idx))) continue;
    const compSet = new Set(comp);
    let tileAreaUnder = 0;
    let hasOtherExternalWeak = false;
    let hasPartRestingAbove = false;
    for (const u of comp) {
      for (const nb of weakAdj[u] ?? []) {
        if (compSet.has(nb)) continue;
        const e = getEdge(u, nb);
        if (!e) continue;
        if (e.kind === 'tile_rest' && e.lowerIdx === nb && e.upperIdx === u) {
          tileAreaUnder += e.contactArea;
        } else if (e.kind === 'tile_rest' && e.lowerIdx === u && e.upperIdx === nb) {
          hasPartRestingAbove = true;
        } else {
          hasOtherExternalWeak = true;
        }
      }
    }
    if (tileAreaUnder >= 600 && !hasOtherExternalWeak && !hasPartRestingAbove) {
      tileSeamCapPartSets.push(compSet);
    }
  }

  return { edges, strongAdj, weakAdj, edgeMap, tileSeamCapPartSets };
}

export function buildStudClutchAdjacency(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): number[][] {
  return buildTypedConnectionGraph(allParts, adjacency).strongAdj;
}

interface StrongGroup {
  id: number;
  indices: number[];
  /** Preserved strong sub-units folded in via leaf absorption (e.g. an end assembly at the tip of an axle) */
  subUnits: number[][];
  isTileSeamCap: boolean;
  minP: number;
  maxP: number;
  centerP: number;
  minY: number;
  maxY: number;
}

/**
 * Pure graph leaf-absorption on the strong-component quotient graph:
 * Any small non-cap strong component whose ONLY weak connections go into a single parent
 * component folds into that parent (e.g., wheel+axle pairs into their frame, clip-on doors
 * into their cabin, end bogie into its half or pivot axle) — completely general, zero
 * train-specific special cases!
 */
function buildCohesiveStrongGroups(
  active: SubdivisionPartInput[],
  allParts: SubdivisionPartInput[],
  graph: TypedConnectionGraph,
  projMin: Map<number, number>,
  projMax: Map<number, number>,
): { groups: StrongGroup[]; partToGroup: Map<number, number>; groupWeakAdj: Map<number, Set<number>> } {
  const activeIndices = active.map((p) => p.index);
  const rawComps = getConnectedComponents(activeIndices, graph.strongAdj);

  const isCapComp = (indices: number[]): boolean => {
    for (const capSet of graph.tileSeamCapPartSets) {
      let overlap = 0;
      for (const idx of indices) if (capSet.has(idx)) overlap++;
      if (overlap >= indices.length * 0.8) return true;
    }
    return false;
  };

  let nextId = 0;
  const groupMap = new Map<number, { indices: number[]; subUnits: number[][]; isTileSeamCap: boolean }>();
  const partToGroup = new Map<number, number>();

  for (const comp of rawComps) {
    const gid = nextId++;
    groupMap.set(gid, {
      indices: [...comp],
      subUnits: [[...comp]],
      isTileSeamCap: isCapComp(comp),
    });
    for (const idx of comp) partToGroup.set(idx, gid);
  }

  const buildWeakGraph = () => {
    const gAdj = new Map<number, Set<number>>();
    for (const gid of groupMap.keys()) gAdj.set(gid, new Set<number>());
    for (const [gid, g] of groupMap.entries()) {
      const set = gAdj.get(gid)!;
      for (const idx of g.indices) {
        for (const nb of graph.weakAdj[idx] ?? []) {
          const nbGid = partToGroup.get(nb);
          if (nbGid !== undefined && nbGid !== gid) set.add(nbGid);
        }
      }
    }
    return gAdj;
  };

  // Iteratively absorb degree-1 leaf strong components into their unique weak neighbor,
  // preserving significant tile-majority detachable caps (like removable roofs & modular floors!)
  let changed = true;
  while (changed) {
    changed = false;
    const gAdj = buildWeakGraph();
    const gids = Array.from(groupMap.keys()).sort(
      (a, b) => groupMap.get(a)!.indices.length - groupMap.get(b)!.indices.length,
    );

    for (const gid of gids) {
      const leaf = groupMap.get(gid);
      if (!leaf) continue;
      // Preserve significant tile-majority detachable caps (e.g., removable roofs, modular floors)
      if (leaf.isTileSeamCap && leaf.indices.length >= 6) continue;

      const neighbors = Array.from(gAdj.get(gid) ?? []);
      if (neighbors.length !== 1) continue;
      const parentId = neighbors[0];
      const parent = groupMap.get(parentId);
      if (!parent) continue;

      const parentDeg = (gAdj.get(parentId)?.size ?? 0);
      const isSmallRelative = leaf.indices.length <= Math.max(16, Math.floor(parent.indices.length * 0.35));
      const isHubAttachment = parentDeg >= 2 && leaf.indices.length <= 60;
      // Do not absorb a major body half into a tiny pivot rod!
      const leafIsMajorHalf = leaf.indices.length >= Math.max(12, Math.floor(active.length * 0.25));
      if (leafIsMajorHalf) continue;

      if (isSmallRelative || isHubAttachment) {
        parent.indices.push(...leaf.indices);
        parent.subUnits.push(...leaf.subUnits);
        for (const idx of leaf.indices) partToGroup.set(idx, parentId);
        groupMap.delete(gid);
        changed = true;
        break;
      }
    }
  }

  const finalWeakAdj = buildWeakGraph();
  const groups: StrongGroup[] = [];
  for (const [id, g] of groupMap.entries()) {
    let minP = Infinity;
    let maxP = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const idx of g.indices) {
      const lo = projMin.get(idx)!;
      const hi = projMax.get(idx)!;
      if (lo < minP) minP = lo;
      if (hi > maxP) maxP = hi;
      if (allParts[idx].box.min[1] < minY) minY = allParts[idx].box.min[1];
      if (allParts[idx].box.max[1] > maxY) maxY = allParts[idx].box.max[1];
    }
    groups.push({
      id,
      indices: g.indices,
      subUnits: g.subUnits,
      isTileSeamCap: g.isTileSeamCap,
      minP,
      maxP,
      centerP: (minP + maxP) * 0.5,
      minY,
      maxY,
    });
  }

  return { groups, partToGroup, groupWeakAdj: finalWeakAdj };
}

function autoNameEndAssembly(indices: number[], allParts: SubdivisionPartInput[]): string {
  const hasWheels = indices.some((i) => allParts[i].isWheel || allParts[i].isWheelHolder || allParts[i].isBogiePart);
  if (hasWheels) return 'Center Wheel Assembly';
  const hasGearOrTurntable = indices.some((i) =>
    /gear|turntable|hub/i.test(allParts[i].partName || ''),
  );
  if (hasGearOrTurntable) return 'Pivot Assembly';
  return 'Center End Assembly';
}

/**
 * Strategy A: Longitudinal Halves & Multi-Segment Split ("Build Halves First, Then Connect").
 * Uses 2D PCA + the general LEGO Connection-Strength Graph (strong stud & cross-axle connections
 * vs. weak round-hole axle, clip/hinge, and tile-majority seams) so:
 * - Intact strong assemblies at the seam (bogies, pivot hubs, cross-axle collars) are never cut in half,
 * - Bricks connected by studs to a single half stay on that half,
 * - Tile-majority removable roofs/caps lift off cleanly as separate sub-builds,
 * - Articulated axle-through-round-hole joints produce the exact 4-stage physical assembly plan.
 */
export function buildLongitudinalHalvesProposal(
  rawAllParts: SubdivisionPartInput[],
  adjacency: number[][],
  segmentCount = 2,
  allowRepeatCollapse = true,
): SubdivisionProposal | null {
  const allParts = rawAllParts.map(enrichPartInput);
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 16) return null;

  const globalComps = getConnectedComponents(
    active.map((p) => p.index),
    adjacency,
  );
  const primaryComp = globalComps[0] ?? [];
  const secondaryComps = globalComps.slice(1);
  if (primaryComp.length < 16) return null;

  const primaryParts = primaryComp.map((i) => allParts[i]);
  const primarySet = new Set(primaryComp);
  const k = Math.max(2, Math.min(6, Math.round(segmentCount)));
  const pca = computeHorizontalPrincipalAxis(primaryParts);
  if (pca.majorSpan < 120) return null;

  const [ux, uz] = pca.axis;
  const [mx, mz] = pca.centerXZ;
  const bounds = computeModelBounds(primaryParts);
  const allBounds = computeModelBounds(active);

  // Project each primary part's AABB onto PC1
  const projMin = new Map<number, number>();
  const projMax = new Map<number, number>();
  const projCenter = new Map<number, number>();
  let globalMinP = Infinity;
  let globalMaxP = -Infinity;

  for (const p of primaryParts) {
    const corners: Array<[number, number]> = [
      [p.box.min[0], p.box.min[2]],
      [p.box.max[0], p.box.min[2]],
      [p.box.min[0], p.box.max[2]],
      [p.box.max[0], p.box.max[2]],
    ];
    let lo = Infinity;
    let hi = -Infinity;
    for (const [x, z] of corners) {
      const pr = (x - mx) * ux + (z - mz) * uz;
      if (pr < lo) lo = pr;
      if (pr > hi) hi = pr;
    }
    projMin.set(p.index, lo);
    projMax.set(p.index, hi);
    projCenter.set(p.index, (p.box.center[0] - mx) * ux + (p.box.center[2] - mz) * uz);
    if (lo < globalMinP) globalMinP = lo;
    if (hi > globalMaxP) globalMaxP = hi;
  }

  // 1. Build general LEGO Typed Connection-Strength Graph (includes Tile-Majority Seam Weakening!)
  const typedGraph = buildTypedConnectionGraph(allParts, adjacency);
  const studAdjacency = typedGraph.strongAdj;
  const { groups, partToGroup, groupWeakAdj } = buildCohesiveStrongGroups(
    primaryParts,
    allParts,
    typedGraph,
    projMin,
    projMax,
  );
  const groupById = new Map<number, StrongGroup>(groups.map((g) => [g.id, g]));

  // Detect coupling rods: vertical Technic axles that pass through weak round-hole joints
  const verticalPivotRods = primaryParts.filter((p) => isVerticalPivotRod(p));

  // 2. Sweep transverse cut plane(s) minimizing STRONG connection cuts!
  const totalProjSpan = Math.max(1, globalMaxP - globalMinP);
  const isCompactSeamHub = (g: StrongGroup | undefined): boolean => {
    if (!g || g.isTileSeamCap) return false;
    const spanP = g.maxP - g.minP;
    if (spanP > totalProjSpan * 0.30 || g.indices.length >= primaryParts.length * 0.35) return false;
    const hasRod = g.indices.some((i) => isVerticalPivotRod(allParts[i]));
    const weakDeg = groupWeakAdj.get(g.id)?.size ?? 0;
    return hasRod || weakDeg >= 2;
  };
  const cutPositions: number[] = [];

  for (let m = 1; m < k; m++) {
    const idealFrac = m / k;
    const idealT = globalMinP + idealFrac * totalProjSpan;
    const searchHalf = Math.min(totalProjSpan * 0.14, totalProjSpan / (k * 2.2));
    const stepLdu = Math.max(10, Math.round((searchHalf * 2) / 28));

    let bestT = idealT;
    let bestScore = Infinity;

    for (let t = idealT - searchHalf; t <= idealT + searchHalf + 0.5; t += stepLdu) {
      let spanning = 0;
      let leftCount = 0;
      let strongCutEdges = 0;
      let weakCutEdges = 0;

      for (const p of primaryParts) {
        const lo = projMin.get(p.index)!;
        const hi = projMax.get(p.index)!;
        const c = projCenter.get(p.index)!;
        if (lo < t - 2.5 && hi > t + 2.5) {
          const g = groupById.get(partToGroup.get(p.index)!);
          // Do not penalize a compact intact seam hub (rod/collar/bogie/pivot) sitting at a weak joint
          if (!isCompactSeamHub(g)) {
            spanning++;
          }
        }
        if (c < t) leftCount++;
      }

      for (const p of primaryParts) {
        const ca = projCenter.get(p.index)!;
        if (ca >= t) continue;
        for (const nb of studAdjacency[p.index] ?? []) {
          if (!primarySet.has(nb)) continue;
          const cb = projCenter.get(nb);
          if (cb !== undefined && cb >= t) {
            const gA = partToGroup.get(p.index);
            const gB = partToGroup.get(nb);
            if (gA === gB) {
              const g = groupById.get(gA!);
              if (!isCompactSeamHub(g)) strongCutEdges++;
            } else {
              strongCutEdges++;
            }
          }
        }
        for (const nb of typedGraph.weakAdj[p.index] ?? []) {
          if (!primarySet.has(nb)) continue;
          const cb = projCenter.get(nb);
          if (cb !== undefined && cb >= t) weakCutEdges++;
        }
      }

      const fracDiff = Math.abs(leftCount / primaryParts.length - idealFrac);
      const score = spanning * 4.0 + strongCutEdges * 3.8 + weakCutEdges * 0.35 + fracDiff * primaryParts.length * 1.8;
      if (score < bestScore) {
        bestScore = score;
        bestT = t;
      }
    }

    // Snap cut plane onto a vertical Technic pivot rod when one sits inside the seam search window
    let snappedT = bestT;
    let bestRodDist = Math.max(60, searchHalf);
    for (const rod of verticalPivotRods) {
      const rp = projCenter.get(rod.index)!;
      if (Math.abs(rp - idealT) > searchHalf + 24) continue;
      const dist = Math.abs(rp - bestT);
      if (dist < bestRodDist) {
        bestRodDist = dist;
        snappedT = rp;
      }
    }
    cutPositions.push(snappedT);
  }

  // 3. Assign WHOLE strong groups cleanly (never cutting intact strong seam groups or stud-owned halves!)
  const detachableCapGroups: StrongGroup[] = [];
  const segOwner = new Map<number, number>();
  const joinGroupList: StrongGroup[] = [];
  const monolithicGroupsToSplit: StrongGroup[] = [];

  const sideOfCut = (val: number): number => {
    let segIdx = 0;
    while (segIdx < cutPositions.length && val >= cutPositions[segIdx]) segIdx++;
    return segIdx;
  };

  for (const g of groups) {
    // Separate significant tile-majority detachable caps (e.g., Front Roof, Rear Roof)
    if (g.isTileSeamCap && g.indices.length >= 6 && isConnectedSubgraph(g.indices, adjacency)) {
      detachableCapGroups.push(g);
      continue;
    }

    const sideCounts = new Array<number>(k).fill(0);
    for (const idx of g.indices) {
      sideCounts[sideOfCut(projCenter.get(idx)!)]++;
    }
    const maxSideCount = Math.max(...sideCounts);
    const dominantSide = sideCounts.indexOf(maxSideCount);
    const dominantRatio = maxSideCount / Math.max(1, g.indices.length);

    // Case A: Rigid strong component spanning heavily across multiple cut-plane segments
    const monolithMinParts = Math.max(
      k === 2 ? 24 : 16,
      Math.floor(primaryParts.length * (k === 2 ? 0.42 : 0.85 / k)),
    );
    const isLargeMonolith = g.indices.length >= monolithMinParts && dominantRatio < 0.85;
    if (isLargeMonolith) {
      monolithicGroupsToSplit.push(g);
      continue;
    }

    // Case B: Compact intact seam/joint group (e.g. Technic Rod + Cross-Axle Collars + Middle Bogie / Pivot Hub)
    const straddlesCut = cutPositions.some((t) => g.minP < t + 12 && g.maxP > t - 12);
    const nearCutRod = g.indices.some(
      (i) => isVerticalPivotRod(allParts[i]) && cutPositions.some((t) => Math.abs(projCenter.get(i)! - t) <= 60),
    );
    if (isCompactSeamHub(g) && (straddlesCut || nearCutRod)) {
      const weakNeighborSides = new Set<number>();
      for (const nbGid of groupWeakAdj.get(g.id) ?? []) {
        const nbG = groupById.get(nbGid);
        if (!nbG || nbG.isTileSeamCap) continue;
        weakNeighborSides.add(sideOfCut(nbG.centerP));
      }
      if (weakNeighborSides.size >= 2 || nearCutRod || (dominantRatio < 0.85 && straddlesCut)) {
        joinGroupList.push(g);
        continue;
      }
    }

    // Case C: Assign entire intact body group to its dominant side
    for (const idx of g.indices) segOwner.set(idx, dominantSide);
  }

  // Handle any monolithic rigid strong group(s) via stud-owned transverse slicing
  const monolithicSpanning: number[] = [];
  for (const g of monolithicGroupsToSplit) {
    for (const idx of g.indices) {
      const lo = projMin.get(idx)!;
      const hi = projMax.get(idx)!;
      const c = projCenter.get(idx)!;
      const crossesCut = cutPositions.some((t) => lo < t - 2.5 && hi > t + 2.5);
      if (crossesCut) {
        monolithicSpanning.push(idx);
      } else {
        segOwner.set(idx, sideOfCut(c));
      }
    }
  }

  // Reassign any monolithic cut-zone bricks connected by strong edges ONLY to one side back to that side!
  const protectedJoinSet = new Set<number>(joinGroupList.flatMap((g) => g.indices));
  let remainingSpanning = [...monolithicSpanning];
  if (remainingSpanning.length > 0) {
    let changed = true;
    while (changed && remainingSpanning.length > 0) {
      changed = false;
      const nextRemaining: number[] = [];
      const remSet = new Set(remainingSpanning);
      for (const idx of remainingSpanning) {
        const touchedSegs = new Set<number>();
        let touchesOtherSpanning = false;
        for (const nb of studAdjacency[idx] ?? []) {
          if (protectedJoinSet.has(nb)) continue;
          const ow = segOwner.get(nb);
          if (ow !== undefined) touchedSegs.add(ow);
          else if (remSet.has(nb)) touchesOtherSpanning = true;
        }
        if (touchedSegs.size === 1 && !touchesOtherSpanning) {
          segOwner.set(idx, Array.from(touchedSegs)[0]);
          changed = true;
        } else {
          nextRemaining.push(idx);
        }
      }
      remainingSpanning = nextRemaining;
    }

    // Pass 2: Stud-connected components of remaining spanning bricks.
    if (remainingSpanning.length > 0) {
      const spanComps = getConnectedComponents(remainingSpanning, studAdjacency);
      const stillBridging: number[] = [];
      for (const comp of spanComps) {
        const touchedSegs = new Set<number>();
        for (const idx of comp) {
          for (const nb of studAdjacency[idx] ?? []) {
            if (protectedJoinSet.has(nb)) continue;
            const ow = segOwner.get(nb);
            if (ow !== undefined) touchedSegs.add(ow);
          }
        }
        if (touchedSegs.size === 1) {
          const targetSeg = Array.from(touchedSegs)[0];
          for (const idx of comp) segOwner.set(idx, targetSeg);
        } else {
          stillBridging.push(...comp);
        }
      }
      remainingSpanning = stillBridging;
    }
  }

  const totalJoinCandidateCount = remainingSpanning.length + protectedJoinSet.size;

  const segLabel = (idx: number, total: number): string => {
    if (total === 2) return idx === 0 ? 'Front Half' : 'Rear Half';
    if (total === 3) return idx === 0 ? 'Front Section' : idx === 1 ? 'Middle Section' : 'Rear Section';
    return `Section ${idx + 1}`;
  };

  let cleanSegments: number[][] = [];
  let activeCapGroups: StrongGroup[] = [...detachableCapGroups];
  let endAssemblyIndices: number[] = [];
  let pivotRodIndices: number[] = [];
  let floatingCollarIndices: number[] = [];
  let finishPartIndices: number[] = [];
  let joinIndices: number[] = [];
  let endAttachSide: 'bottom' | 'top' = 'bottom';
  let hasArticulatedJoint = false;
  let isIdenticalHalves = false;
  let heavySpanning = false;

  const analyzeArticulatedJoinParts = (joinAll: number[]) => {
    const joinPool = new Set<number>(joinAll);
    const joinRods = joinAll.filter((i) => isVerticalPivotRod(allParts[i]));
    const rods: number[] = [];
    const collars: number[] = [];
    const endAsm: number[] = [];
    const finish: number[] = [];
    let attachSide: 'bottom' | 'top' = 'bottom';

    for (const rIdx of joinRods) {
      rods.push(rIdx);
      joinPool.delete(rIdx);
    }

    if (joinRods.length > 0) {
      const rodRef = allParts[joinRods[0]];
      const rx = rodRef.box.center[0];
      const rz = rodRef.box.center[2];
      const rodMidY = rodRef.box.center[1];

      const remainingJoinArr = Array.from(joinPool);
      const joinSubComps = getConnectedComponents(remainingJoinArr, studAdjacency);
      const subCompAssigned = new Set<number>();

      // Collect compact circular cross-axle collars coaxial with the rod
      for (let ci = 0; ci < joinSubComps.length; ci++) {
        const comp = joinSubComps[ci];
        const allCoaxialCrossCollars = comp.every((idx) => {
          const p = allParts[idx];
          if (!p.isAxleCollar) return false;
          return joinRods.some((rIdx) => {
            const rod = allParts[rIdx];
            const dXZ = Math.hypot(p.box.center[0] - rod.box.center[0], p.box.center[2] - rod.box.center[2]);
            return dXZ <= 12 && p.box.max[1] >= rod.box.min[1] - 4 && p.box.min[1] <= rod.box.max[1] + 4;
          });
        });
        if (allCoaxialCrossCollars) {
          collars.push(...comp);
          subCompAssigned.add(ci);
        }
      }

      const unassignedIndices: number[] = [];
      for (let ci = 0; ci < joinSubComps.length; ci++) {
        if (!subCompAssigned.has(ci)) unassignedIndices.push(...joinSubComps[ci]);
      }
      if (unassignedIndices.length > 0) {
        const endComps = getConnectedComponents(unassignedIndices, adjacency);
        for (const ec of endComps) {
          const touchesRod = ec.some((idx) =>
            joinRods.some((rIdx) => (adjacency[idx] ?? []).includes(rIdx)),
          );
          const nearRod = ec.some((idx) =>
            Math.hypot(allParts[idx].box.center[0] - rx, allParts[idx].box.center[2] - rz) <= 80,
          );
          if (
            (ec.length >= 2 && (touchesRod || nearRod)) ||
            ec.some((idx) => allParts[idx].isWheel || allParts[idx].isWheelHolder)
          ) {
            endAsm.push(...ec);
          } else {
            finish.push(...ec);
          }
        }
      }

      if (endAsm.length > 0) {
        const avgEndY =
          endAsm.reduce((acc, i) => acc + allParts[i].box.center[1], 0) / endAsm.length;
        attachSide = avgEndY <= rodMidY ? 'bottom' : 'top';
      }
    } else if (joinAll.length >= 2) {
      endAsm.push(...joinAll);
    } else {
      finish.push(...joinAll);
    }

    return { rods, collars, endAsm, finish, attachSide };
  };

  // --- CASE 1: Articulated 2-Half Model (Intact Seam Hub: Vertical Technic Rod + Cross-Axle Collars + Optional End Assembly/Bogie) ---
  // Only activate when k === 2 AND the protected joint itself is a single connected assembly!
  const protectedList = Array.from(protectedJoinSet);
  const canUseArticulated2Half =
    k === 2 &&
    joinGroupList.length > 0 &&
    protectedList.length > 0 &&
    isConnectedSubgraph(protectedList, adjacency);

  if (canUseArticulated2Half) {
    const capPartSet = new Set<number>(activeCapGroups.flatMap((g) => g.indices));
    const halfBucketOf = new Map<number, number>(segOwner);
    for (const idx of remainingSpanning) {
      halfBucketOf.set(idx, sideOfCut(projCenter.get(idx)!));
    }

    const nonJoinPrimary = primaryComp.filter((i) => !protectedJoinSet.has(i) && !capPartSet.has(i));
    const nonJoinComps = getConnectedComponents(nonJoinPrimary, adjacency);

    const half0Set = new Set<number>();
    const half1Set = new Set<number>();
    const half0Candidates: number[][] = [];
    const half1Candidates: number[][] = [];

    for (const comp of nonJoinComps) {
      const has0 = comp.some((u) => (halfBucketOf.get(u) ?? 0) === 0);
      const has1 = comp.some((u) => (halfBucketOf.get(u) ?? 0) === 1);
      if (has0 && has1) {
        const { segments, bucketIds } = enforceConnectedPartition(comp, halfBucketOf, 2, adjacency, {
          minSegmentSize: 3,
          smoothingPasses: 2,
        });
        segments.forEach((seg, sIdx) => {
          if ((bucketIds[sIdx] ?? sIdx) === 0) half0Candidates.push(seg);
          else half1Candidates.push(seg);
        });
      } else if (has0) {
        half0Candidates.push(comp);
      } else {
        half1Candidates.push(comp);
      }
    }

    half0Candidates.sort((a, b) => b.length - a.length);
    half1Candidates.sort((a, b) => b.length - a.length);
    const main0 = half0Candidates[0] ?? [];
    const main1 = half1Candidates[0] ?? [];
    for (const u of main0) half0Set.add(u);
    for (const u of main1) half1Set.add(u);

    const strayFragments = [...half0Candidates.slice(1), ...half1Candidates.slice(1)];
    const joinWorkingSet = new Set<number>(protectedJoinSet);
    let articulatedClean = main0.length >= 6 && main1.length >= 6;

    for (const frag of strayFragments) {
      const touchesJoint = frag.some((u) => (adjacency[u] ?? []).some((nb) => joinWorkingSet.has(nb)));
      if (touchesJoint && frag.length <= Math.max(8, Math.floor(primaryComp.length * 0.1))) {
        for (const u of frag) joinWorkingSet.add(u);
      } else {
        articulatedClean = false;
        break;
      }
    }

    if (articulatedClean) {
      const h0 = Array.from(half0Set);
      const h1 = Array.from(half1Set);
      const joinAll = Array.from(joinWorkingSet);
      if (
        isConnectedSubgraph(h0, adjacency) &&
        isConnectedSubgraph(h1, adjacency) &&
        isConnectedSubgraph(joinAll, adjacency)
      ) {
        const analyzed = analyzeArticulatedJoinParts(joinAll);
        cleanSegments = [h0, h1];
        pivotRodIndices = analyzed.rods;
        floatingCollarIndices = analyzed.collars;
        endAssemblyIndices = analyzed.endAsm;
        finishPartIndices = analyzed.finish;
        endAttachSide = analyzed.attachSide;
        joinIndices = [...floatingCollarIndices, ...pivotRodIndices, ...endAssemblyIndices, ...finishPartIndices];
        hasArticulatedJoint = pivotRodIndices.length > 0 || endAssemblyIndices.length > 0;
      }
    }
  }

  // --- CASE 2: Symmetric 2× Identical Halves with Optional Single-Connected Center Connector ---
  if (cleanSegments.length === 0 && k === 2 && allowRepeatCollapse && activeCapGroups.length === 0) {
    const t = cutPositions[0];
    const candLeft: number[] = [];
    const candRight: number[] = [];
    const candJoin: number[] = [];
    for (const p of primaryParts) {
      const lo = projMin.get(p.index)!;
      const hi = projMax.get(p.index)!;
      const c = projCenter.get(p.index)!;
      if (lo < t - 2.5 && hi > t + 2.5) {
        candJoin.push(p.index);
      } else if (c < t) {
        candLeft.push(p.index);
      } else {
        candRight.push(p.index);
      }
    }

    if (
      candLeft.length >= 6 &&
      candRight.length >= 6 &&
      isConnectedSubgraph(candLeft, adjacency) &&
      isConnectedSubgraph(candRight, adjacency) &&
      areSectionsStructurallyIdentical(candLeft, candRight, allParts)
    ) {
      const leftSet = new Set(candLeft);
      const rightSet = new Set(candRight);
      const joinValid =
        candJoin.length === 0 ||
        (isConnectedSubgraph(candJoin, adjacency) &&
          indexSetsTouch(new Set(candJoin), leftSet, adjacency) &&
          indexSetsTouch(new Set(candJoin), rightSet, adjacency));
      if (joinValid) {
        cleanSegments = [candLeft, candRight];
        finishPartIndices = candJoin;
        joinIndices = candJoin;
        isIdenticalHalves = true;
      }
    }
  }

  // --- CASE 3: General Zero-Floating Connected k-Partition (2 Halves, 3 Segments, 4+ Segments) ---
  // Guarantees ZERO floating join debris clouds and ZERO disconnected parts inside ANY segment!
  if (cleanSegments.length === 0) {
    let capPartSet = new Set<number>(activeCapGroups.flatMap((g) => g.indices));
    let partitionNodes = primaryComp.filter((i) => !capPartSet.has(i));
    // If removing caps disconnects the remaining primary body, fold caps back into the partition
    if (activeCapGroups.length > 0 && !isConnectedSubgraph(partitionNodes, adjacency)) {
      activeCapGroups = [];
      capPartSet = new Set<number>();
      partitionNodes = primaryComp;
    }

    const initialBucketOf = new Map<number, number>();
    for (const [idx, s] of segOwner.entries()) {
      if (!capPartSet.has(idx)) initialBucketOf.set(idx, s);
    }
    // Keep any compact seam hub intact in its spatial segment for multi-segment splits
    for (const g of joinGroupList) {
      const segIdx = sideOfCut(g.centerP);
      for (const idx of g.indices) {
        if (primarySet.has(idx) && !capPartSet.has(idx) && !initialBucketOf.has(idx)) {
          initialBucketOf.set(idx, segIdx);
        }
      }
    }
    for (const idx of partitionNodes) {
      if (initialBucketOf.has(idx)) continue;
      initialBucketOf.set(idx, sideOfCut(projCenter.get(idx)!));
    }

    const segCenterTargets = Array.from({ length: k }, (_, s) => {
      const lo = s === 0 ? globalMinP : cutPositions[s - 1];
      const hi = s === k - 1 ? globalMaxP : cutPositions[s];
      return (lo + hi) * 0.5;
    });

    const minSegSize = Math.max(4, Math.min(10, Math.floor(partitionNodes.length / (k * 4))));
    const { segments } = enforceConnectedPartition(partitionNodes, initialBucketOf, k, adjacency, {
      minSegmentSize: minSegSize,
      smoothingPasses: 2,
      scoreCandidate: (node, targetBucketId, edgesToTarget, targetSize, idealSize) => {
        const origBucket = initialBucketOf.get(node) ?? 0;
        const c = projCenter.get(node) ?? 0;
        const distToTarget = Math.abs(c - (segCenterTargets[targetBucketId] ?? 0));
        const sameBucketBonus = targetBucketId === origBucket ? 36 : -Math.abs(targetBucketId - origBucket) * 14;
        const distPenalty = (distToTarget / Math.max(40, totalProjSpan)) * 22;
        const balancePenalty =
          targetSize > idealSize * 1.28 ? (targetSize - idealSize * 1.28) * 0.35 : 0;
        return sameBucketBonus + edgesToTarget * 14 - distPenalty - balancePenalty;
      },
    });

    if (segments.length < 2) return null;

    cleanSegments = segments.sort((a, b) => {
      const meanA = a.reduce((acc, idx) => acc + (projCenter.get(idx) ?? 0), 0) / Math.max(1, a.length);
      const meanB = b.reduce((acc, idx) => acc + (projCenter.get(idx) ?? 0), 0) / Math.max(1, b.length);
      return meanA - meanB;
    });

    let totalInternal = 0;
    let totalCut = 0;
    for (const seg of cleanSegments) {
      const segSet = new Set(seg);
      for (const u of seg) {
        for (const nb of adjacency[u] ?? []) {
          if (segSet.has(nb)) totalInternal++;
          else totalCut++;
        }
      }
    }
    const cutRatio = totalCut / Math.max(1, totalInternal + totalCut);
    heavySpanning =
      remainingSpanning.length > Math.max(20, Math.floor(primaryParts.length * 0.38)) &&
      cutRatio > 0.28;

    if (heavySpanning && activeCapGroups.length > 0) {
      // In numbered_bags mode, keep caps merged cleanly into their touching segment
      const idxToSeg = new Map<number, number>();
      cleanSegments.forEach((seg, sIdx) => {
        for (const idx of seg) idxToSeg.set(idx, sIdx);
      });
      for (const cap of activeCapGroups) {
        let bestS = Math.min(cleanSegments.length - 1, sideOfCut(cap.centerP));
        for (const idx of cap.indices) {
          for (const nb of adjacency[idx] ?? []) {
            const s = idxToSeg.get(nb);
            if (s !== undefined) {
              bestS = s;
              break;
            }
          }
        }
        cleanSegments[bestS].push(...cap.indices);
      }
      activeCapGroups = [];
    }
  }

  // Pair detachable tile-majority caps (e.g. Front Roof, Rear Roof) with their parent segment
  const capsBySeg: StrongGroup[][] = cleanSegments.map(() => []);
  if (!heavySpanning && activeCapGroups.length > 0) {
    const idxToCleanSeg = new Map<number, number>();
    cleanSegments.forEach((seg, sIdx) => {
      for (const idx of seg) idxToCleanSeg.set(idx, sIdx);
    });
    for (const cap of activeCapGroups) {
      const counts = new Map<number, number>();
      for (const idx of cap.indices) {
        for (const nb of typedGraph.weakAdj[idx] ?? []) {
          const s = idxToCleanSeg.get(nb);
          if (s !== undefined) counts.set(s, (counts.get(s) ?? 0) + 1);
        }
      }
      let bestSeg = Math.min(cleanSegments.length - 1, sideOfCut(cap.centerP));
      let bestCount = -1;
      for (const [s, c] of counts.entries()) {
        if (c > bestCount) {
          bestCount = c;
          bestSeg = s;
        }
      }
      capsBySeg[bestSeg].push(cap);
    }
  }

  const hasSeparateCaps = capsBySeg.some((list) => list.length > 0);
  if (
    !isIdenticalHalves &&
    allowRepeatCollapse &&
    !heavySpanning &&
    !hasSeparateCaps &&
    cleanSegments.length === 2 &&
    areSectionsStructurallyIdentical(cleanSegments[0], cleanSegments[1], allParts)
  ) {
    isIdenticalHalves = true;
  }

  const outputMode: SubdivisionOutputMode = heavySpanning ? 'numbered_bags' : 'modular_chapters';
  const sections: ProposedSection[] = [];
  const midSeg = (cleanSegments.length - 1) / 2;

  let colorCursor = 0;
  if (isIdenticalHalves && outputMode === 'modular_chapters') {
    const half0 = cleanSegments[0];
    const half1 = cleanSegments[1];
    sections.push({
      id: 'sec_half_x2',
      name: 'End Half',
      partIndices: half0,
      partIds: half0.map((i) => allParts[i].id),
      repeatPartIndexGroups: [half0, half1],
      repeatPartIdGroups: [half0.map((i) => allParts[i].id), half1.map((i) => allParts[i].id)],
      role: 'module',
      cutEdgeCount: countCutEdges(half0, adjacency),
      explodeOffset: [-ux, 0, -uz],
      previewColor: SECTION_PREVIEW_PALETTE[colorCursor++ % SECTION_PREVIEW_PALETTE.length],
    });
  } else {
    cleanSegments.forEach((seg, idx) => {
      const dirSign = idx - midSeg;
      const mag = Math.abs(dirSign) < 0.01 ? 0 : dirSign / Math.max(0.5, midSeg);
      const secId = `sec_long_${idx + 1}`;
      const baseLabel = segLabel(idx, cleanSegments.length);
      const parentExplode: Vec3 = [ux * mag, 0, uz * mag];
      sections.push({
        id: secId,
        name: outputMode === 'numbered_bags' ? `Bag ${idx + 1} (${baseLabel})` : baseLabel,
        partIndices: seg,
        partIds: seg.map((i) => allParts[i].id),
        role: outputMode === 'numbered_bags' ? 'bag' : 'module',
        cutEdgeCount: countCutEdges(seg, adjacency),
        attachNormal: [ux * Math.sign(dirSign || 1), 0, uz * Math.sign(dirSign || 1)],
        explodeOffset: parentExplode,
        previewColor: SECTION_PREVIEW_PALETTE[colorCursor++ % SECTION_PREVIEW_PALETTE.length],
      });

      // Emit detachable tile-majority caps (e.g., Front Roof / Rear Roof) right after their parent half!
      const segBounds = computeModelBounds(seg.map((i) => allParts[i]));
      capsBySeg[idx].forEach((cap, capIdx) => {
        const isTopRoof = cap.minY >= segBounds.center[1] - 4 && cap.maxY >= segBounds.max[1] - 12;
        const capPrefix = cleanSegments.length === 2 ? (idx === 0 ? 'Front' : 'Rear') : baseLabel;
        const capName =
          capsBySeg[idx].length === 1
            ? isTopRoof
              ? `${capPrefix} Roof`
              : `${capPrefix} Removable Cap`
            : `${capPrefix} Roof ${capIdx + 1}`;
        sections.push({
          id: `${secId}_cap_${capIdx + 1}`,
          name: capName,
          partIndices: cap.indices,
          partIds: cap.indices.map((i) => allParts[i].id),
          role: 'module',
          isDetachableCap: true,
          attachToSectionId: secId,
          attachNormal: [0, 1, 0],
          cutEdgeCount: countCutEdges(cap.indices, adjacency),
          explodeOffset: [parentExplode[0], 0.85, parentExplode[2]],
          previewColor: SECTION_PREVIEW_PALETTE[colorCursor++ % SECTION_PREVIEW_PALETTE.length],
        });
      });
    });
  }

  const endAssemblyName =
    endAssemblyIndices.length > 0 ? autoNameEndAssembly(endAssemblyIndices, allParts) : undefined;

  const articulatedJoin: ArticulatedJoinPlan | undefined =
    hasArticulatedJoint && outputMode === 'modular_chapters'
      ? {
          slideAxis: [ux, uz],
          floatingCollarIndices,
          pivotRodIndices,
          bogiePartIndices: endAssemblyIndices,
          bogieName: endAssemblyName,
          endAttachSide,
          finishPartIndices,
        }
      : undefined;

  if (joinIndices.length > 0 && outputMode === 'modular_chapters') {
    const joinName = hasArticulatedJoint
      ? endAssemblyIndices.length > 0 && pivotRodIndices.length > 0
        ? endAssemblyName === 'Center Wheel Assembly'
          ? 'Center Joint & Wheels'
          : `Center Joint & ${endAssemblyName}`
        : endAssemblyIndices.length > 0
          ? `${endAssemblyName} & Join`
          : 'Center Articulation Joint'
      : 'Center Connector';

    sections.push({
      id: 'sec_join_center',
      name: joinName,
      partIndices: joinIndices,
      partIds: joinIndices.map((i) => allParts[i].id),
      role: 'join',
      cutEdgeCount: countCutEdges(joinIndices, adjacency),
      // Keep articulated bogie/rod joints centered on track level; lift compact symmetric connectors gently
      explodeOffset: hasArticulatedJoint ? [0, 0, 0] : [0, 0.55, 0],
      previewColor: JOIN_PREVIEW_COLOR,
      articulatedJoin,
    });
  }

  placeSecondaryGlobalComponents(
    sections,
    secondaryComps,
    allParts,
    adjacency,
    allBounds.center,
    outputMode,
    true,
  );

  const maxSegDiag = Math.max(...cleanSegments.map((s) => computeSectionDiag(s, allParts)), 1);
  const zoomGainEstimate = Math.max(1.1, Math.round((bounds.diag / maxSegDiag) * 10) / 10);

  const aspect = pca.minorSpan > 1 ? pca.majorSpan / pca.minorSpan : 1;
  const spanRatio = totalJoinCandidateCount / primaryParts.length;
  let confidence = 74;
  if (aspect >= 2.2) confidence += 14;
  if (aspect >= 3.5) confidence += 6;
  if (spanRatio <= 0.1) confidence += 6;
  else if (spanRatio > 0.3 && !hasArticulatedJoint) confidence -= 10;
  if (hasArticulatedJoint) confidence += 6;
  if (hasSeparateCaps) confidence += 4;
  if (isIdenticalHalves) confidence += 6;
  confidence = Math.max(45, Math.min(98, Math.round(confidence)));

  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
    active.length,
    sections.length,
  );

  const capCount = capsBySeg.reduce((acc, list) => acc + list.length, 0);
  const title =
    cleanSegments.length === 2
      ? isIdenticalHalves
        ? 'Build 2× Identical Halves, Then Connect'
        : capCount > 0
          ? `Build Halves & ${capCount} Removable Roof${capCount === 1 ? '' : 's'}, Then Connect`
          : 'Build Halves First, Then Connect'
      : `Build in ${cleanSegments.length} Segments, Then Connect`;

  const joinNote =
    joinIndices.length > 0
      ? ` + ${joinIndices.length}-part center connector`
      : '';
  const articulatedDesc = hasArticulatedJoint
    ? [
        endAssemblyIndices.length > 0 ? `${(endAssemblyName || 'center assembly').toLowerCase()} (${endAssemblyIndices.length} parts)` : null,
        pivotRodIndices.length > 0 ? `${pivotRodIndices.length} Technic axle` : null,
        floatingCollarIndices.length > 0 ? `${floatingCollarIndices.length} cross-axle part${floatingCollarIndices.length === 1 ? '' : 's'}` : null,
      ]
        .filter(Boolean)
        .join(' + ')
    : '';
  const roofNote = capCount > 0 ? ` + ${capCount} removable tile-seam roof${capCount === 1 ? '' : 's'}` : '';
  const rationale = isIdenticalHalves
    ? `Both halves match (${cleanSegments[0].length} parts each${joinNote}) — build once ×2, then connect.`
    : heavySpanning
      ? `Splits along the ${Math.round(pca.majorSpan / 20)}-stud length into ${cleanSegments.length} connected stages (tightly interlocked spine).`
      : hasArticulatedJoint && articulatedDesc
        ? `Builds both halves separately${roofNote}, then connects via ${articulatedDesc}.`
        : `Builds ${cleanSegments.length} solid, connected sections first${roofNote}${joinNote} before joining.`;

  return {
    id: `prop_long_${cleanSegments.length}${isIdenticalHalves ? '_x2' : ''}`,
    strategy: 'longitudinal_halves',
    outputMode,
    title,
    rationale,
    zoomGainEstimate,
    confidence,
    sections,
    estimatedStepCount,
    estimatedPageCount,
    hasIdenticalHalves: isIdenticalHalves,
  };
}

/**
 * Strategy B: Horizontal Floors & Vertical Layers (Modular Buildings, Towers, Castles).
 * Sweeps plate-level horizontal planes (8 LDU) to find smooth-tile seams or low-stud transitions,
 * then enforces strict single-connected-component floors with zero floating parts.
 */
export function buildHorizontalFloorsProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  floorCount?: number,
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 24) return null;

  const globalComps = getConnectedComponents(
    active.map((p) => p.index),
    adjacency,
  );
  const primaryComp = globalComps[0] ?? [];
  const secondaryComps = globalComps.slice(1);
  if (primaryComp.length < 24) return null;

  const primaryParts = primaryComp.map((i) => allParts[i]);
  const primarySet = new Set(primaryComp);
  const bounds = computeModelBounds(primaryParts);
  const allBounds = computeModelBounds(active);
  if (bounds.spanY < 72) return null; // Less than 3 bricks tall

  const targetFloors = floorCount
    ? Math.max(2, Math.min(6, Math.round(floorCount)))
    : Math.max(2, Math.min(4, Math.round(bounds.spanY / 120)));

  // Score every 8 LDU plane along Y
  const candidates: Array<{ y: number; score: number; cutEdges: number; tileCount: number; spanning: number }> = [];
  const startY = Math.ceil((bounds.min[1] + 24) / 8) * 8;
  const endY = Math.floor((bounds.max[1] - 24) / 8) * 8;

  for (let y = startY; y <= endY; y += 8) {
    let below = 0;
    let spanning = 0;
    let tileCount = 0;
    let cutEdges = 0;

    for (const p of primaryParts) {
      if (p.box.center[1] < y) below++;
      if (p.box.min[1] < y - 3 && p.box.max[1] > y + 3) spanning++;
      if (p.isTile && Math.abs(p.box.max[1] - y) <= 4.5) tileCount++;
    }
    if (
      below < Math.max(6, primaryParts.length * 0.12) ||
      primaryParts.length - below < Math.max(6, primaryParts.length * 0.12)
    ) {
      continue;
    }

    for (const p of primaryParts) {
      if (p.box.center[1] >= y) continue;
      for (const nb of adjacency[p.index] ?? []) {
        if (!primarySet.has(nb)) continue;
        const nbPart = allParts[nb];
        if (nbPart && nbPart.box.center[1] >= y) cutEdges++;
      }
    }

    const score = cutEdges + spanning * 5 - tileCount * 2.2;
    candidates.push({ y, score, cutEdges, tileCount, spanning });
  }

  if (candidates.length === 0) return null;

  // Pick up to (targetFloors - 1) well-spaced best local minima
  candidates.sort((a, b) => a.score - b.score);
  const chosen: typeof candidates = [];
  const minSpacing = Math.max(36, bounds.spanY / (targetFloors * 1.7));

  for (const cand of candidates) {
    if (chosen.length >= targetFloors - 1) break;
    if (chosen.every((c) => Math.abs(c.y - cand.y) >= minSpacing)) {
      chosen.push(cand);
    }
  }
  if (chosen.length === 0) return null;
  chosen.sort((a, b) => a.y - b.y);

  const initialBucketOf = new Map<number, number>();
  for (const p of primaryParts) {
    let f = 0;
    while (f < chosen.length && p.box.center[1] >= chosen[f].y) f++;
    initialBucketOf.set(p.index, f);
  }

  const floorBandCenters = Array.from({ length: chosen.length + 1 }, (_, f) => {
    const lo = f === 0 ? bounds.min[1] : chosen[f - 1].y;
    const hi = f === chosen.length ? bounds.max[1] : chosen[f].y;
    return (lo + hi) * 0.5;
  });

  const minFloorSize = Math.max(4, Math.floor(primaryComp.length * 0.08));
  const { segments } = enforceConnectedPartition(
    primaryComp,
    initialBucketOf,
    chosen.length + 1,
    adjacency,
    {
      minSegmentSize: minFloorSize,
      smoothingPasses: 2,
      scoreCandidate: (node, targetBucketId, edgesToTarget, targetSize, idealSize) => {
        const origBucket = initialBucketOf.get(node) ?? 0;
        const cy = allParts[node].box.center[1];
        const yDist = Math.abs(cy - (floorBandCenters[targetBucketId] ?? cy));
        const sameBonus = targetBucketId === origBucket ? 36 : -Math.abs(targetBucketId - origBucket) * 16;
        const yPen = (yDist / Math.max(24, bounds.spanY)) * 20;
        const balPen = targetSize > idealSize * 1.3 ? (targetSize - idealSize * 1.3) * 0.35 : 0;
        return sameBonus + edgesToTarget * 12 - yPen - balPen;
      },
    },
  );

  // Order connected floors strictly bottom-to-top
  const nonEmpty = segments
    .filter((b) => b.length >= 4)
    .sort((a, b) => {
      const meanA = a.reduce((acc, idx) => acc + allParts[idx].box.center[1], 0) / a.length;
      const meanB = b.reduce((acc, idx) => acc + allParts[idx].box.center[1], 0) / b.length;
      return meanA - meanB;
    });
  if (nonEmpty.length < 2) return null;

  const avgTiles = chosen.reduce((acc, c) => acc + c.tileCount, 0) / chosen.length;
  const avgCut = chosen.reduce((acc, c) => acc + c.cutEdges, 0) / chosen.length;
  const hasModularTileSeams = avgTiles >= 3 && avgCut <= Math.max(18, primaryParts.length * 0.08);
  const outputMode: SubdivisionOutputMode = hasModularTileSeams ? 'modular_chapters' : 'numbered_bags';

  const floorName = (idx: number, total: number): string => {
    if (hasModularTileSeams) {
      if (idx === 0) return 'Ground Floor';
      if (idx === total - 1) return 'Roof & Top Level';
      return `Floor ${idx + 1}`;
    }
    if (total === 2) return idx === 0 ? 'Lower Section' : 'Upper Section';
    if (total === 3) return idx === 0 ? 'Base Layer' : idx === 1 ? 'Middle Section' : 'Top Section';
    return `Layer ${idx + 1}`;
  };

  const mid = (nonEmpty.length - 1) / 2;
  const sections: ProposedSection[] = nonEmpty.map((indices, idx) => ({
    id: `sec_floor_${idx + 1}`,
    name: floorName(idx, nonEmpty.length),
    partIndices: indices,
    partIds: indices.map((i) => allParts[i].id),
    role: outputMode === 'modular_chapters' ? 'module' : 'bag',
    cutEdgeCount: countCutEdges(indices, adjacency),
    attachNormal: [0, 1, 0],
    explodeOffset: [0, (idx - mid) / Math.max(0.5, mid), 0],
    previewColor: SECTION_PREVIEW_PALETTE[idx % SECTION_PREVIEW_PALETTE.length],
  }));

  placeSecondaryGlobalComponents(
    sections,
    secondaryComps,
    allParts,
    adjacency,
    allBounds.center,
    outputMode,
    false,
  );

  const maxFloorDiag = Math.max(...nonEmpty.map((s) => computeSectionDiag(s, allParts)), 1);
  const zoomGainEstimate = Math.max(1.1, Math.round((bounds.diag / maxFloorDiag) * 10) / 10);

  const heightRatio = bounds.spanY / Math.max(1, Math.max(bounds.spanX, bounds.spanZ));
  let confidence = 62;
  if (hasModularTileSeams) confidence += 28;
  if (heightRatio >= 0.75) confidence += 10;
  if (bounds.spanY >= 160) confidence += 6;
  confidence = Math.max(40, Math.min(97, Math.round(confidence)));

  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
    active.length,
    sections.length,
  );

  return {
    id: `prop_floors_${nonEmpty.length}`,
    strategy: 'horizontal_floors',
    outputMode,
    title: hasModularTileSeams
      ? `Modular Floors (${nonEmpty.length} Levels)`
      : `Build Bottom-to-Top in ${nonEmpty.length} Vertical Layers`,
    rationale: hasModularTileSeams
      ? `Detected ${chosen.length} smooth-tile floor seam${chosen.length === 1 ? '' : 's'} with minimal anchor studs between levels.`
      : `Separates the ${Math.round(bounds.spanY / 24)}-brick-tall build into ${nonEmpty.length} connected vertical stages.`,
    zoomGainEstimate,
    confidence,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/**
 * Strategy C: Structural Modules & Graph Community Clustering.
 * Uses farthest-point seeding + connectivity-preserving boundary refinement (with strict
 * articulation-point checks) to isolate cohesive, 100% connected sub-builds.
 */
export function buildStructuralModulesProposal(
  rawAllParts: SubdivisionPartInput[],
  adjacency: number[][],
  targetModules?: number,
): SubdivisionProposal | null {
  const allParts = rawAllParts.map(enrichPartInput);
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 24) return null;

  const globalComps = getConnectedComponents(
    active.map((p) => p.index),
    adjacency,
  );
  const primaryComp = globalComps[0] ?? [];
  const secondaryComps = globalComps.slice(1);
  if (primaryComp.length < 24) return null;

  const primaryParts = primaryComp.map((i) => allParts[i]);
  const primarySet = new Set(primaryComp);
  const bounds = computeModelBounds(primaryParts);
  const allBounds = computeModelBounds(active);

  // Natural LEGO strong-component decomposition (clips, hinges, round-hole axles, tile-majority seams):
  // If weak joints already separate primaryComp into 2..8 cohesive, strictly connected strong modules, prefer those exact seams!
  if (targetModules === undefined) {
    const pca = computeHorizontalPrincipalAxis(primaryParts);
    const [ux, uz] = pca.axis;
    const [mx, mz] = pca.centerXZ;
    const pMin = new Map<number, number>();
    const pMax = new Map<number, number>();
    for (const p of primaryParts) {
      const pr = (p.box.center[0] - mx) * ux + (p.box.center[2] - mz) * uz;
      pMin.set(p.index, pr - 10);
      pMax.set(p.index, pr + 10);
    }
    const typed = buildTypedConnectionGraph(allParts, adjacency);
    const { groups } = buildCohesiveStrongGroups(primaryParts, allParts, typed, pMin, pMax);
    const substantive = groups.filter((g) => g.indices.length >= 4 && isConnectedSubgraph(g.indices, adjacency));
    const tiny = groups.filter((g) => g.indices.length < 4 || !isConnectedSubgraph(g.indices, adjacency));
    const maxGroupRatio =
      substantive.length > 0
        ? Math.max(...substantive.map((g) => g.indices.length)) / primaryParts.length
        : 1;

    if (substantive.length >= 2 && substantive.length <= 8 && maxGroupRatio <= 0.85) {
      const buckets = substantive.map((g) => ({
        indices: [...g.indices],
        isTileSeamCap: g.isTileSeamCap,
      }));
      // Fold any tiny (< 4 pcs) group strictly across physical adjacency edges so zero floating parts can appear
      const remainingTiny = tiny.map((tg) => [...tg.indices]);
      let progressed = true;
      while (remainingTiny.length > 0 && progressed) {
        progressed = false;
        for (let ti = remainingTiny.length - 1; ti >= 0; ti--) {
          const tNodes = remainingTiny[ti];
          const tSet = new Set(tNodes);
          let bestBi = -1;
          let bestEdges = 0;
          buckets.forEach((b, bi) => {
            const bSet = new Set(b.indices);
            let edges = 0;
            for (const u of tSet) {
              for (const nb of adjacency[u] ?? []) {
                if (bSet.has(nb)) edges++;
              }
            }
            if (edges > bestEdges) {
              bestEdges = edges;
              bestBi = bi;
            }
          });
          if (bestBi >= 0) {
            buckets[bestBi].indices.push(...tNodes);
            remainingTiny.splice(ti, 1);
            progressed = true;
          }
        }
      }

      if (remainingTiny.length === 0 && buckets.every((b) => isConnectedSubgraph(b.indices, adjacency))) {
        const capTagByFirstNode = new Map<number, boolean>();
        for (const b of buckets) {
          for (const idx of b.indices) capTagByFirstNode.set(idx, b.isTileSeamCap);
        }
        const orderedLists = orderConnectedSections(
          buckets.map((b) => b.indices),
          allParts,
          adjacency,
        );
        const sectionBounds = orderedLists.map((indices) =>
          computeModelBounds(indices.map((i) => allParts[i])),
        );
        const radialOffsets = computeRadialExplodeOffsets(
          sectionBounds.map((sb) => sb.center),
          { scale: orderedLists.length >= 3 ? 1.1 : 1.0, yScale: 0.5, clampYNonNegative: true },
        );
        const sections: ProposedSection[] = orderedLists.map((indices, idx) => {
          const sb = sectionBounds[idx];
          const baseOff = radialOffsets[idx];
          const isCap = Boolean(capTagByFirstNode.get(indices[0]));
          const isTopCap = isCap && sb.max[1] >= bounds.max[1] - 16;
          return {
            id: `sec_nat_${idx + 1}`,
            name: isTopCap ? `Removable Roof ${idx + 1}` : `Module ${idx + 1}`,
            partIndices: indices,
            partIds: indices.map((i) => allParts[i].id),
            role: 'module',
            isDetachableCap: isCap,
            cutEdgeCount: countCutEdges(indices, adjacency),
            explodeOffset: isCap
              ? [baseOff[0] * 0.4, 0.9, baseOff[2] * 0.4]
              : baseOff,
            previewColor: SECTION_PREVIEW_PALETTE[idx % SECTION_PREVIEW_PALETTE.length],
          };
        });

        placeSecondaryGlobalComponents(
          sections,
          secondaryComps,
          allParts,
          adjacency,
          allBounds.center,
          'modular_chapters',
          false,
        );

        const maxModDiag = Math.max(...orderedLists.map((b) => computeSectionDiag(b, allParts)), 1);
        const zoomGainEstimate = Math.max(1.1, Math.round((bounds.diag / maxModDiag) * 10) / 10);
        const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
          active.length,
          sections.length,
        );

        return {
          id: `prop_modules_${sections.length}`,
          strategy: 'structural_modules',
          outputMode: 'modular_chapters',
          title: `Natural Sub-Assemblies (${sections.length} Modules)`,
          rationale: `Splits cleanly along weak joints (clips, hinges, round-hole axles, and tile-majority seams) into ${sections.length} intact, connected modules.`,
          zoomGainEstimate,
          confidence: 87,
          sections,
          estimatedStepCount,
          estimatedPageCount,
        };
      }
    }
  }

  const k = targetModules
    ? Math.max(2, Math.min(8, Math.round(targetModules)))
    : Math.max(2, Math.min(5, Math.round(primaryComp.length / 130)));

  // 1. Pick k well-separated spatial seeds inside the primary connected component
  const seeds: number[] = [];
  let firstSeed = primaryParts[0].index;
  let maxDist = -1;
  for (const p of primaryParts) {
    const d = Math.hypot(
      p.box.center[0] - bounds.center[0],
      p.box.center[1] - bounds.center[1],
      p.box.center[2] - bounds.center[2],
    );
    if (d > maxDist) {
      maxDist = d;
      firstSeed = p.index;
    }
  }
  seeds.push(firstSeed);

  while (seeds.length < k) {
    let bestIdx = -1;
    let bestMinD = -1;
    for (const p of primaryParts) {
      if (seeds.includes(p.index)) continue;
      let minD = Infinity;
      for (const s of seeds) {
        const sp = allParts[s];
        const d = Math.hypot(
          p.box.center[0] - sp.box.center[0],
          p.box.center[1] - sp.box.center[1],
          p.box.center[2] - sp.box.center[2],
        );
        if (d < minD) minD = d;
      }
      if (minD > bestMinD) {
        bestMinD = minD;
        bestIdx = p.index;
      }
    }
    if (bestIdx < 0) break;
    seeds.push(bestIdx);
  }

  // 2. Multi-source balanced BFS growth along physical connections inside primaryComp
  const clusterOf = new Map<number, number>();
  const clusterSets: Set<number>[] = seeds.map((s) => new Set([s]));
  const queues: number[][] = seeds.map((s, cid) => {
    clusterOf.set(s, cid);
    return [s];
  });
  const qHeads = new Array<number>(seeds.length).fill(0);
  const targetSize = primaryComp.length / seeds.length;

  let progress = true;
  while (progress) {
    progress = false;
    const order = seeds
      .map((_, cid) => cid)
      .sort((a, b) => clusterSets[a].size - clusterSets[b].size);
    for (const cid of order) {
      const q = queues[cid];
      while (qHeads[cid] < q.length) {
        const u = q[qHeads[cid]++];
        let expanded = false;
        for (const v of adjacency[u] ?? []) {
          if (!primarySet.has(v) || clusterOf.has(v)) continue;
          clusterOf.set(v, cid);
          clusterSets[cid].add(v);
          q.push(v);
          expanded = true;
          progress = true;
        }
        if (expanded) break;
      }
    }
  }

  // 3. Connectivity-preserving modularity smoothing (articulation-point guarded)
  for (let pass = 0; pass < 3; pass++) {
    let moved = 0;
    for (const p of primaryParts) {
      const u = p.index;
      const curr = clusterOf.get(u);
      if (curr === undefined || clusterSets[curr].size <= 6) continue;
      const counts = new Map<number, number>();
      for (const nb of adjacency[u] ?? []) {
        const nc = clusterOf.get(nb);
        if (nc !== undefined) counts.set(nc, (counts.get(nc) ?? 0) + 1);
      }
      const sameEdges = counts.get(curr) ?? 0;
      let bestC = curr;
      let bestScore = sameEdges;
      for (const [nc, ec] of counts.entries()) {
        if (nc === curr) continue;
        if (clusterSets[nc].size > targetSize * 1.45) continue;
        if (ec > bestScore) {
          bestScore = ec;
          bestC = nc;
        }
      }
      if (bestC !== curr && wouldStayConnectedWithout(clusterSets[curr], u, adjacency)) {
        clusterSets[curr].delete(u);
        clusterSets[bestC].add(u);
        clusterOf.set(u, bestC);
        moved++;
      }
    }
    if (moved === 0) break;
  }

  // 4. Absorb any undersized cluster (< 4 parts) into its most-connected neighbor cluster
  const activeMask = clusterSets.map((s) => s.size > 0);
  let activeCount = activeMask.filter(Boolean).length;
  while (activeCount > 1) {
    let tinyIdx = -1;
    let tinySize = 4;
    for (let c = 0; c < clusterSets.length; c++) {
      if (activeMask[c] && clusterSets[c].size < tinySize) {
        tinySize = clusterSets[c].size;
        tinyIdx = c;
      }
    }
    if (tinyIdx < 0) break;
    let bestNb = -1;
    let bestShared = -1;
    for (let other = 0; other < clusterSets.length; other++) {
      if (!activeMask[other] || other === tinyIdx) continue;
      const shared = countSharedEdgesBetween(clusterSets[tinyIdx], clusterSets[other], adjacency);
      if (shared > bestShared) {
        bestShared = shared;
        bestNb = other;
      }
    }
    if (bestNb < 0 || bestShared <= 0) break;
    for (const u of clusterSets[tinyIdx]) {
      clusterSets[bestNb].add(u);
      clusterOf.set(u, bestNb);
    }
    clusterSets[tinyIdx].clear();
    activeMask[tinyIdx] = false;
    activeCount--;
  }

  const rawValidGroups = clusterSets
    .filter((s, idx) => activeMask[idx] && s.size >= 4)
    .map((s) => Array.from(s));
  if (rawValidGroups.length < 2) return null;

  const validGroups = orderConnectedSections(rawValidGroups, allParts, adjacency);

  let totalInternal = 0;
  let totalCut = 0;
  for (const g of validGroups) {
    const c = countCutEdges(g, adjacency);
    totalCut += c;
    const set = new Set(g);
    for (const i of g) {
      for (const nb of adjacency[i] ?? []) {
        if (set.has(nb)) totalInternal++;
      }
    }
  }
  const cutRatio = totalCut / Math.max(1, totalInternal + totalCut);
  const outputMode: SubdivisionOutputMode = cutRatio <= 0.22 ? 'modular_chapters' : 'numbered_bags';

  const groupBounds = validGroups.map((indices) =>
    computeModelBounds(indices.map((i) => allParts[i])),
  );
  const radialOffsets = computeRadialExplodeOffsets(
    groupBounds.map((sb) => sb.center),
    { scale: validGroups.length >= 3 ? 1.1 : 1.0, yScale: 0.5, clampYNonNegative: true },
  );
  const sections: ProposedSection[] = validGroups.map((indices, idx) => ({
    id: `sec_mod_${idx + 1}`,
    name: `Module ${idx + 1}`,
    partIndices: indices,
    partIds: indices.map((i) => allParts[i].id),
    role: outputMode === 'modular_chapters' ? 'module' : 'bag',
    cutEdgeCount: countCutEdges(indices, adjacency),
    explodeOffset: radialOffsets[idx],
    previewColor: SECTION_PREVIEW_PALETTE[idx % SECTION_PREVIEW_PALETTE.length],
  }));

  placeSecondaryGlobalComponents(
    sections,
    secondaryComps,
    allParts,
    adjacency,
    allBounds.center,
    outputMode,
    false,
  );

  const maxModDiag = Math.max(...validGroups.map((g) => computeSectionDiag(g, allParts)), 1);
  const zoomGainEstimate = Math.max(1.1, Math.round((bounds.diag / maxModDiag) * 10) / 10);

  let confidence = Math.round(78 - cutRatio * 60);
  if (active.length >= 250) confidence += 8;
  confidence = Math.max(45, Math.min(92, confidence));

  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
    active.length,
    sections.length,
  );

  return {
    id: `prop_modules_${validGroups.length}`,
    strategy: 'structural_modules',
    outputMode,
    title: `Structural Modules (${validGroups.length} Sub-Builds)`,
    rationale: `Groups densely connected parts into ${validGroups.length} cohesive modules (${Math.round(cutRatio * 100)}% seam edges) before final assembly.`,
    zoomGainEstimate,
    confidence,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/**
 * Strategy D: Numbered Build Bags (Universal Sequential Staging).
 * Produces bags that are BOTH individually 100% connected (zero floating shards in exploded preview
 * or if toggled to modular chapters) AND cumulatively connected bottom-up for continuous building.
 */
export function buildNumberedBagsProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  bagCount?: number,
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 18) return null;

  const globalComps = getConnectedComponents(
    active.map((p) => p.index),
    adjacency,
  );
  const primaryComp = globalComps[0] ?? [];
  const secondaryComps = globalComps.slice(1);
  if (primaryComp.length < 18) return null;

  const primaryParts = primaryComp.map((i) => allParts[i]);
  const primarySet = new Set(primaryComp);
  const k = bagCount
    ? Math.max(2, Math.min(12, Math.round(bagCount)))
    : Math.max(2, Math.min(8, Math.round(primaryComp.length / 180)));

  const pca = computeHorizontalPrincipalAxis(primaryParts);
  const [ux, uz] = pca.axis;
  const [mx, mz] = pca.centerXZ;
  const projOf = (idx: number) =>
    (allParts[idx].box.center[0] - mx) * ux + (allParts[idx].box.center[2] - mz) * uz;

  const sortedSeeds = [...primaryParts].sort(
    (a, b) =>
      Math.round(a.box.min[1] / 8) - Math.round(b.box.min[1] / 8) ||
      projOf(a.index) - projOf(b.index),
  );

  const placed = new Set<number>();
  const ordered: number[] = [];
  const frontier = new Set<number>();

  const seedPart = sortedSeeds[0].index;
  frontier.add(seedPart);
  let lastCenter = allParts[seedPart].box.center;
  const baseMinY = sortedSeeds[0].box.min[1];

  while (ordered.length < primaryComp.length) {
    let pick = -1;
    if (frontier.size > 0) {
      let bestScore = Infinity;
      for (const idx of frontier) {
        const b = allParts[idx].box;
        const yCost = (b.min[1] - baseMinY) * 1.4;
        const dCost =
          Math.hypot(
            b.center[0] - lastCenter[0],
            b.center[1] - lastCenter[1],
            b.center[2] - lastCenter[2],
          ) * 0.45;
        const sc = yCost + dCost;
        if (sc < bestScore) {
          bestScore = sc;
          pick = idx;
        }
      }
      frontier.delete(pick);
    } else {
      for (const p of sortedSeeds) {
        if (!placed.has(p.index)) {
          pick = p.index;
          break;
        }
      }
    }
    if (pick < 0) break;
    placed.add(pick);
    ordered.push(pick);
    lastCenter = allParts[pick].box.center;
    for (const nb of adjacency[pick] ?? []) {
      if (primarySet.has(nb) && !placed.has(nb)) frontier.add(nb);
    }
  }

  const idealBagSize = ordered.length / k;
  const splitPoints: number[] = [0];
  const windowRadius = Math.max(3, Math.floor(idealBagSize * 0.18));

  for (let b = 1; b < k; b++) {
    const idealIdx = Math.round(b * idealBagSize);
    let bestIdx = idealIdx;
    let bestYJump = -Infinity;
    for (
      let idx = Math.max(splitPoints[splitPoints.length - 1] + 4, idealIdx - windowRadius);
      idx <= Math.min(ordered.length - 4, idealIdx + windowRadius);
      idx++
    ) {
      const yPrev = allParts[ordered[idx - 1]].box.min[1];
      const yNext = allParts[ordered[idx]].box.min[1];
      const jump = Math.max(0, yNext - yPrev) - Math.abs(idx - idealIdx) * 0.15;
      if (jump > bestYJump) {
        bestYJump = jump;
        bestIdx = idx;
      }
    }
    splitPoints.push(bestIdx);
  }
  splitPoints.push(ordered.length);

  const initialBucketOf = new Map<number, number>();
  for (let b = 0; b < splitPoints.length - 1; b++) {
    for (let pos = splitPoints[b]; pos < splitPoints[b + 1]; pos++) {
      initialBucketOf.set(ordered[pos], b);
    }
  }

  const minBagSize = Math.max(4, Math.min(10, Math.floor(primaryComp.length / (k * 4))));
  const { segments } = enforceConnectedPartition(primaryComp, initialBucketOf, k, adjacency, {
    minSegmentSize: minBagSize,
    smoothingPasses: 2,
  });
  if (segments.length < 2 && secondaryComps.length === 0) return null;

  const orderedBags = orderConnectedSections(segments, allParts, adjacency);

  const allBounds = computeModelBounds(active);
  const bagBounds = orderedBags.map((slice) =>
    computeModelBounds(slice.map((i) => allParts[i])),
  );
  const radialOffsets = computeRadialExplodeOffsets(
    bagBounds.map((sb) => sb.center),
    { horizontalOnly: true, scale: 0.65 },
  );
  const sections: ProposedSection[] = orderedBags.map((slice, b) => ({
    id: `sec_bag_${b + 1}`,
    name: `Bag ${b + 1}`,
    partIndices: slice,
    partIds: slice.map((i) => allParts[i].id),
    role: 'bag',
    cutEdgeCount: countCutEdges(slice, adjacency),
    explodeOffset: [
      radialOffsets[b][0],
      (b / Math.max(1, orderedBags.length - 1)) * 0.6,
      radialOffsets[b][2],
    ],
    previewColor: SECTION_PREVIEW_PALETTE[b % SECTION_PREVIEW_PALETTE.length],
  }));

  placeSecondaryGlobalComponents(
    sections,
    secondaryComps,
    allParts,
    adjacency,
    allBounds.center,
    'numbered_bags',
    false,
  );

  const avgBag = Math.round(active.length / Math.max(1, sections.length));
  const confidence = active.length >= 400 ? 86 : 78;
  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
    active.length,
    sections.length,
  );

  return {
    id: `prop_bags_${sections.length}`,
    strategy: 'numbered_bags',
    outputMode: 'numbered_bags',
    title: `Numbered Build Bags (${sections.length} Bags)`,
    rationale: `Keeps one continuous build divided into ${sections.length} connected numbered bags (~${avgBag} parts per bag).`,
    confidence,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/**
 * Strategy E: Spatial Sector / Baseplate Grid Split (Wide Dioramas & Landscapes).
 * Partitions into connected quadrants with zero floating seam pieces.
 */
export function buildSpatialSectorsProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 32) return null;

  const globalComps = getConnectedComponents(
    active.map((p) => p.index),
    adjacency,
  );
  const primaryComp = globalComps[0] ?? [];
  const secondaryComps = globalComps.slice(1);
  if (primaryComp.length < 32) return null;

  const primaryParts = primaryComp.map((i) => allParts[i]);
  const bounds = computeModelBounds(primaryParts);
  const allBounds = computeModelBounds(active);
  const minHoriz = Math.min(bounds.spanX, bounds.spanZ);
  const maxHoriz = Math.max(bounds.spanX, bounds.spanZ);
  if (maxHoriz < 480 || minHoriz < 240 || minHoriz / Math.max(24, bounds.spanY) < 1.25) {
    return null;
  }

  const midX = bounds.center[0];
  const midZ = bounds.center[2];
  const initialBucketOf = new Map<number, number>();
  let rawSpanning = 0;

  for (const p of primaryParts) {
    const crossX = p.box.min[0] < midX - 2.5 && p.box.max[0] > midX + 2.5;
    const crossZ = p.box.min[2] < midZ - 2.5 && p.box.max[2] > midZ + 2.5;
    if (crossX || crossZ) rawSpanning++;
    const qi = (p.box.center[0] >= midX ? 1 : 0) + (p.box.center[2] >= midZ ? 2 : 0);
    initialBucketOf.set(p.index, qi);
  }

  const { segments, bucketIds } = enforceConnectedPartition(primaryComp, initialBucketOf, 4, adjacency, {
    minSegmentSize: Math.max(4, Math.floor(primaryComp.length * 0.06)),
    smoothingPasses: 2,
  });
  if (segments.length < 2) return null;

  const heavySeam = rawSpanning > primaryParts.length * 0.3;
  const names = ['Front-Left Sector', 'Front-Right Sector', 'Back-Left Sector', 'Back-Right Sector'];
  const dirs: Vec3[] = [
    [-0.75, 0, -0.75],
    [0.75, 0, -0.75],
    [-0.75, 0, 0.75],
    [0.75, 0, 0.75],
  ];

  const outputMode: SubdivisionOutputMode = heavySeam ? 'numbered_bags' : 'modular_chapters';
  const sections: ProposedSection[] = segments.map((indices, idx) => {
    const qi = bucketIds[idx] ?? idx;
    return {
      id: `sec_quad_${idx + 1}`,
      name: names[qi] ?? `Sector ${idx + 1}`,
      partIndices: indices,
      partIds: indices.map((i) => allParts[i].id),
      role: outputMode === 'modular_chapters' ? 'module' : 'bag',
      cutEdgeCount: countCutEdges(indices, adjacency),
      explodeOffset: dirs[qi] ?? [0.75, 0, 0],
      previewColor: SECTION_PREVIEW_PALETTE[idx % SECTION_PREVIEW_PALETTE.length],
    };
  });

  placeSecondaryGlobalComponents(
    sections,
    secondaryComps,
    allParts,
    adjacency,
    allBounds.center,
    outputMode,
    false,
  );

  const maxQuadDiag = Math.max(...segments.map((q) => computeSectionDiag(q, allParts)), 1);
  const zoomGainEstimate = Math.max(1.2, Math.round((bounds.diag / maxQuadDiag) * 10) / 10);
  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
    active.length,
    sections.length,
  );

  return {
    id: `prop_sectors_${segments.length}`,
    strategy: 'spatial_sectors',
    outputMode,
    title: `Footprint Quadrants (${segments.length} Sectors)`,
    rationale: `Splits the wide ${Math.round(bounds.spanX / 20)}×${Math.round(bounds.spanZ / 20)}-stud footprint into ${segments.length} connected quadrants.`,
    zoomGainEstimate,
    confidence: heavySeam ? 74 : 88,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/** Genuine LEGO baseplates (thin, studded ground plates incl. road plates). */
const BASEPLATE_IDS = new Set([
  '3811', '3867', '4186', '3857', '10701', '44336', '44341', '44342', '44343',
]);

/** A baseplate footprint must be at least ~16×16 studs when detected purely by geometry. */
const BASEPLATE_MIN_FOOTPRINT_LDU = 300;
const BASEPLATE_MAX_THICKNESS_LDU = 14;
const BASEPLATE_GROUND_TOLERANCE_LDU = 12;

/**
 * Returns true if a part looks like a baseplate (or a large ground plate acting as one):
 * known baseplate IDs, "Baseplate" in its name, or a thin plate spanning ≥ 16×16 studs.
 */
export function isBaseplateCandidate(p: SubdivisionPartInput): boolean {
  if (p.isMinifig) return false;
  const spanX = p.box.max[0] - p.box.min[0];
  const spanY = p.box.max[1] - p.box.min[1];
  const spanZ = p.box.max[2] - p.box.min[2];
  if (spanY > BASEPLATE_MAX_THICKNESS_LDU) return false;
  const { key, baseNum } = normalizeSubdivisionPartKey(p.partId);
  if (BASEPLATE_IDS.has(key) || BASEPLATE_IDS.has(baseNum)) return true;
  if (/\bbase\s*plate\b|\bbaseplate\b/i.test(p.partName || '')) return true;
  return Math.min(spanX, spanZ) >= BASEPLATE_MIN_FOOTPRINT_LDU;
}

/**
 * Detects the ground-level baseplates of a model. Plates stacked on/inside a larger
 * baseplate's footprint (e.g. a 16×16 plate resting on a 32×32 baseplate) are ignored,
 * as are large plates used as upper floors.
 */
export function detectGroundBaseplates(allParts: SubdivisionPartInput[]): number[] {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length === 0) return [];
  let globalMinY = Infinity;
  let globalMaxY = -Infinity;
  for (const p of active) {
    if (p.box.min[1] < globalMinY) globalMinY = p.box.min[1];
    if (p.box.max[1] > globalMaxY) globalMaxY = p.box.max[1];
  }
  const candidates = active.filter(isBaseplateCandidate);
  // Y-up is the canonical convention, but tolerate Y-down sources by picking the side holding more plates
  const low = candidates.filter((p) => p.box.min[1] <= globalMinY + BASEPLATE_GROUND_TOLERANCE_LDU);
  const high = candidates.filter((p) => p.box.max[1] >= globalMaxY - BASEPLATE_GROUND_TOLERANCE_LDU);
  const ground = high.length > low.length ? high : low;

  const area = (p: SubdivisionPartInput) =>
    (p.box.max[0] - p.box.min[0]) * (p.box.max[2] - p.box.min[2]);
  const sorted = [...ground].sort((a, b) => area(b) - area(a));
  const kept: SubdivisionPartInput[] = [];
  for (const p of sorted) {
    const covered = kept.some((k) => {
      const ox = Math.min(p.box.max[0], k.box.max[0]) - Math.max(p.box.min[0], k.box.min[0]);
      const oz = Math.min(p.box.max[2], k.box.max[2]) - Math.max(p.box.min[2], k.box.min[2]);
      return ox > 0 && oz > 0 && ox * oz >= area(p) * 0.5;
    });
    if (!covered) kept.push(p);
  }
  return kept.map((p) => p.index);
}

function footprintDistanceXZ(p: SubdivisionPartInput, plate: SubdivisionPartInput): number {
  const [x, , z] = p.box.center;
  const dx = Math.max(0, plate.box.min[0] - x, x - plate.box.max[0]);
  const dz = Math.max(0, plate.box.min[2] - z, z - plate.box.max[2]);
  return Math.hypot(dx, dz);
}

/**
 * Strategy F: Split by Baseplate.
 * Each ground-level baseplate becomes its own connected section containing every part built on it
 * (MILS modules, modular buildings on 16×32 baseplates, city layouts). Parts bridging two
 * baseplates join whichever baseplate's footprint holds their center, falling back to any
 * physically connected neighbor so every section stays one connected piece (zero floating parts).
 */
export function buildBaseplateSplitProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 8) return null;
  const plateIndices = detectGroundBaseplates(allParts);
  if (plateIndices.length < 2) return null;

  const plates = plateIndices.map((i) => allParts[i]);
  const allBounds = computeModelBounds(active);
  const pca = computeHorizontalPrincipalAxis(plates);
  const [ux, uz] = pca.axis;
  const [px, pz] = pca.perp;
  const projMajor = (p: SubdivisionPartInput) => p.box.center[0] * ux + p.box.center[2] * uz;
  const projMinor = (p: SubdivisionPartInput) => p.box.center[0] * px + p.box.center[2] * pz;
  // Number baseplates in reading order along the layout's long axis
  const orderedPlates = [...plates].sort(
    (a, b) => Math.round((projMajor(a) - projMajor(b)) / 40) || projMinor(a) - projMinor(b),
  );
  const plateSlot = new Map<number, number>();
  orderedPlates.forEach((p, slot) => plateSlot.set(p.index, slot));

  // Footprint bucket for every active part: smallest baseplate containing its center, else the nearest one
  const bucketOf = new Map<number, number>();
  for (const p of active) {
    const own = plateSlot.get(p.index);
    if (own !== undefined) {
      bucketOf.set(p.index, own);
      continue;
    }
    let best = 0;
    let bestDist = Infinity;
    let bestArea = Infinity;
    orderedPlates.forEach((plate, slot) => {
      const d = footprintDistanceXZ(p, plate);
      const a = (plate.box.max[0] - plate.box.min[0]) * (plate.box.max[2] - plate.box.min[2]);
      if (d < bestDist - 0.5 || (Math.abs(d - bestDist) <= 0.5 && a < bestArea)) {
        best = slot;
        bestDist = d;
        bestArea = a;
      }
    });
    bucketOf.set(p.index, best);
  }

  const members: number[][] = orderedPlates.map(() => []);
  const orphanComps: number[][] = [];
  const comps = getConnectedComponents(active.map((p) => p.index), adjacency);

  for (const comp of comps) {
    const compPlates = comp.filter((i) => plateSlot.has(i));
    if (compPlates.length === 0) {
      orphanComps.push(comp);
      continue;
    }
    if (compPlates.length === 1) {
      members[plateSlot.get(compPlates[0])!].push(...comp);
      continue;
    }

    const compSet = new Set(comp);
    const segOf = new Map<number, number>();
    // Pass A: grow each baseplate across parts sitting on its own footprint
    const queue: number[] = [];
    for (const pi of compPlates) {
      segOf.set(pi, plateSlot.get(pi)!);
      queue.push(pi);
    }
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      const seg = segOf.get(u)!;
      for (const v of adjacency[u] ?? []) {
        if (!compSet.has(v) || segOf.has(v) || bucketOf.get(v) !== seg) continue;
        segOf.set(v, seg);
        queue.push(v);
      }
    }
    // Pass B: claim leftovers (parts only reachable through a neighboring baseplate's build)
    const pending: number[] = [];
    for (const u of comp) {
      if (segOf.has(u)) continue;
      if ((adjacency[u] ?? []).some((v) => segOf.has(v))) pending.push(u);
    }
    head = 0;
    while (head < pending.length) {
      const v = pending[head++];
      if (segOf.has(v)) continue;
      const counts = new Map<number, number>();
      for (const nb of adjacency[v] ?? []) {
        const s = segOf.get(nb);
        if (s !== undefined) counts.set(s, (counts.get(s) ?? 0) + 1);
      }
      if (counts.size === 0) continue;
      const own = bucketOf.get(v);
      let chosen = own !== undefined && counts.has(own) ? own : -1;
      if (chosen < 0) {
        let bestCount = -1;
        for (const [s, c] of counts) {
          if (c > bestCount) {
            bestCount = c;
            chosen = s;
          }
        }
      }
      segOf.set(v, chosen);
      for (const nb of adjacency[v] ?? []) {
        if (compSet.has(nb) && !segOf.has(nb)) pending.push(nb);
      }
    }
    for (const u of comp) {
      const s = segOf.get(u);
      if (s !== undefined) members[s].push(u);
    }
  }

  const center = allBounds.center;
  const radialOffsets = computeRadialExplodeOffsets(
    orderedPlates.map((plate) => plate.box.center),
    { horizontalOnly: true, scale: orderedPlates.length >= 3 ? 1.1 : 0.85 },
  );
  const sections: ProposedSection[] = orderedPlates.map((plate, slot) => {
    const indices = members[slot];
    const spanA = Math.round((plate.box.max[0] - plate.box.min[0]) / 20);
    const spanB = Math.round((plate.box.max[2] - plate.box.min[2]) / 20);
    const dims = `${Math.min(spanA, spanB)}×${Math.max(spanA, spanB)}`;
    return {
      id: `sec_baseplate_${slot + 1}`,
      name: `Baseplate ${slot + 1} (${dims})`,
      partIndices: indices,
      partIds: indices.map((i) => allParts[i].id),
      role: 'module',
      cutEdgeCount: countCutEdges(indices, adjacency),
      explodeOffset: radialOffsets[slot],
      previewColor: SECTION_PREVIEW_PALETTE[slot % SECTION_PREVIEW_PALETTE.length],
    };
  });

  placeSecondaryGlobalComponents(
    sections,
    orphanComps,
    allParts,
    adjacency,
    center,
    'modular_chapters',
    false,
  );

  const plateCount = orderedPlates.length;
  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(active.length, sections.length);
  return {
    id: `prop_baseplates_${plateCount}`,
    strategy: 'baseplates',
    outputMode: 'modular_chapters',
    title: `Split by Baseplate (${plateCount} Baseplates)`,
    rationale: `Builds everything on each of the ${plateCount} baseplates as its own section, then sets the baseplates side by side.`,
    confidence: 93,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/**
 * Top-level Model Subdivision Analyzer:
 * Assesses size/span/readability and generates ranked LEGO-native subdivision proposals.
 */
export function analyzeModelSubdivisions(
  parts: SubdivisionPartInput[],
  adjacency: number[][],
): SubdivisionAnalysisResult {
  const assessment = assessModelSubdivisionNeed(parts);
  const proposals: SubdivisionProposal[] = [];

  const halves = buildLongitudinalHalvesProposal(parts, adjacency, 2, true);
  if (halves) proposals.push(halves);

  const floors = buildHorizontalFloorsProposal(parts, adjacency);
  if (floors) proposals.push(floors);

  const sectors = buildSpatialSectorsProposal(parts, adjacency);
  if (sectors) proposals.push(sectors);

  const modules = buildStructuralModulesProposal(parts, adjacency);
  if (modules) proposals.push(modules);

  proposals.sort((a, b) => b.confidence - a.confidence);
  const ranked = proposals.slice(0, 4);

  // Splitting by baseplate is always offered when 2+ ground baseplates exist (never trimmed by ranking)
  const baseplates = buildBaseplateSplitProposal(parts, adjacency);
  if (baseplates) {
    ranked.push(baseplates);
    ranked.sort((a, b) => b.confidence - a.confidence);
  }
  return {
    assessment,
    proposals: ranked,
  };
}

/**
 * Recomputes a proposal when the user adjusts the section-count slider or toggles 2x collapse.
 */
export function recomputeProposalWithCount(
  strategy: SubdivisionStrategyId,
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  targetCount: number,
  allowRepeatCollapse = true,
): SubdivisionProposal | null {
  switch (strategy) {
    case 'longitudinal_halves':
      return buildLongitudinalHalvesProposal(allParts, adjacency, targetCount, allowRepeatCollapse);
    case 'horizontal_floors':
      return buildHorizontalFloorsProposal(allParts, adjacency, targetCount);
    case 'structural_modules':
      return buildStructuralModulesProposal(allParts, adjacency, targetCount);
    case 'numbered_bags':
      return buildNumberedBagsProposal(allParts, adjacency, targetCount);
    case 'spatial_sectors':
      return buildSpatialSectorsProposal(allParts, adjacency);
    case 'baseplates':
      return buildBaseplateSplitProposal(allParts, adjacency);
    default:
      return null;
  }
}

/**
 * Merges two physically touching proposed sections cleanly (used by the 1-click Merge button).
 * Refuses to merge non-adjacent sections that would create disconnected floating parts.
 */
export function mergeProposedSections(
  proposal: SubdivisionProposal,
  idxA: number,
  idxB: number,
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): SubdivisionProposal {
  if (
    idxA === idxB ||
    idxA < 0 ||
    idxB < 0 ||
    idxA >= proposal.sections.length ||
    idxB >= proposal.sections.length
  ) {
    return proposal;
  }
  const lo = Math.min(idxA, idxB);
  const hi = Math.max(idxA, idxB);
  const secA = proposal.sections[lo];
  const secB = proposal.sections[hi];

  const mergedSet = new Set<number>([
    ...(secA.repeatPartIndexGroups ? secA.repeatPartIndexGroups.flat() : secA.partIndices),
    ...(secB.repeatPartIndexGroups ? secB.repeatPartIndexGroups.flat() : secB.partIndices),
  ]);
  const mergedIndices = Array.from(mergedSet);

  // Never merge two non-adjacent sections into a single disconnected section with floating parts
  if (!isConnectedSubgraph(mergedIndices, adjacency)) {
    return proposal;
  }

  const merged: ProposedSection = {
    ...secA,
    id: `${secA.id}_m`,
    name: `${secA.name} + ${secB.name}`,
    partIndices: mergedIndices,
    partIds: mergedIndices.map((i) => allParts[i].id),
    repeatPartIndexGroups: undefined,
    repeatPartIdGroups: undefined,
    articulatedJoin: undefined,
    role: secA.role === 'join' && secB.role === 'join' ? 'join' : secA.role === 'bag' ? 'bag' : 'module',
    cutEdgeCount: countCutEdges(mergedIndices, adjacency),
    explodeOffset: [
      (secA.explodeOffset[0] + secB.explodeOffset[0]) * 0.5,
      (secA.explodeOffset[1] + secB.explodeOffset[1]) * 0.5,
      (secA.explodeOffset[2] + secB.explodeOffset[2]) * 0.5,
    ],
  };

  const nextSections = proposal.sections.filter((_, i) => i !== lo && i !== hi);
  nextSections.splice(lo, 0, merged);
  return {
    ...proposal,
    hasIdenticalHalves: false,
    sections: nextSections,
  };
}

/**
 * Splits a single proposed section into two 100% connected halves along its own 2D PCA axis
 * (zero floating parts in either resulting half).
 */
export function splitProposedSection(
  proposal: SubdivisionProposal,
  sectionIdx: number,
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): SubdivisionProposal {
  const sec = proposal.sections[sectionIdx];
  if (!sec) return proposal;
  const sourceIndices = sec.repeatPartIndexGroups ? sec.repeatPartIndexGroups.flat() : sec.partIndices;
  if (sourceIndices.length < 8) return proposal;

  const comps = getConnectedComponents(sourceIndices, adjacency);
  if (comps.length > 1) {
    const leftIdx = comps[0];
    const rightIdx = comps.slice(1).flat();
    if (!isConnectedSubgraph(rightIdx, adjacency)) return proposal;
    const nextColorIdx = proposal.sections.length;
    const leftSec: ProposedSection = {
      id: `${sec.id}_a`,
      name: `${sec.name} A`,
      partIndices: leftIdx,
      partIds: leftIdx.map((i) => allParts[i].id),
      role: sec.role === 'join' ? 'join' : sec.role,
      cutEdgeCount: countCutEdges(leftIdx, adjacency),
      explodeOffset: sec.explodeOffset,
      previewColor: sec.previewColor,
    };
    const rightSec: ProposedSection = {
      id: `${sec.id}_b`,
      name: `${sec.name} B`,
      partIndices: rightIdx,
      partIds: rightIdx.map((i) => allParts[i].id),
      role: sec.role === 'join' ? 'join' : sec.role,
      cutEdgeCount: countCutEdges(rightIdx, adjacency),
      explodeOffset: [sec.explodeOffset[0], sec.explodeOffset[1] + 0.4, sec.explodeOffset[2]],
      previewColor: SECTION_PREVIEW_PALETTE[nextColorIdx % SECTION_PREVIEW_PALETTE.length],
    };
    const nextSections = [...proposal.sections];
    nextSections.splice(sectionIdx, 1, leftSec, rightSec);
    return { ...proposal, hasIdenticalHalves: false, sections: nextSections };
  }

  const subset = sourceIndices.map((i) => allParts[i]).filter(Boolean);
  const pca = computeHorizontalPrincipalAxis(subset);
  const [ux, uz] = pca.axis;
  const [mx, mz] = pca.centerXZ;

  const projOf = new Map<number, number>();
  const sorted = [...subset].sort((a, b) => {
    const pa = (a.box.center[0] - mx) * ux + (a.box.center[2] - mz) * uz;
    const pb = (b.box.center[0] - mx) * ux + (b.box.center[2] - mz) * uz;
    return pa - pb;
  });
  for (const p of subset) {
    projOf.set(p.index, (p.box.center[0] - mx) * ux + (p.box.center[2] - mz) * uz);
  }
  const mid = Math.floor(sorted.length / 2);
  const initialBucketOf = new Map<number, number>();
  sorted.forEach((p, i) => initialBucketOf.set(p.index, i < mid ? 0 : 1));

  const { segments } = enforceConnectedPartition(sourceIndices, initialBucketOf, 2, adjacency, {
    minSegmentSize: 3,
    smoothingPasses: 2,
  });
  if (segments.length < 2) return proposal;

  segments.sort((a, b) => {
    const ma = a.reduce((acc, idx) => acc + (projOf.get(idx) ?? 0), 0) / Math.max(1, a.length);
    const mb = b.reduce((acc, idx) => acc + (projOf.get(idx) ?? 0), 0) / Math.max(1, b.length);
    return ma - mb;
  });
  const [leftIdx, rightIdx] = segments;

  const nextColorIdx = proposal.sections.length;
  const leftSec: ProposedSection = {
    id: `${sec.id}_a`,
    name: `${sec.name} A`,
    partIndices: leftIdx,
    partIds: leftIdx.map((i) => allParts[i].id),
    role: sec.role === 'join' ? 'join' : sec.role,
    cutEdgeCount: countCutEdges(leftIdx, adjacency),
    explodeOffset: [
      sec.explodeOffset[0] - ux * 0.5,
      sec.explodeOffset[1],
      sec.explodeOffset[2] - uz * 0.5,
    ],
    previewColor: sec.previewColor,
  };
  const rightSec: ProposedSection = {
    id: `${sec.id}_b`,
    name: `${sec.name} B`,
    partIndices: rightIdx,
    partIds: rightIdx.map((i) => allParts[i].id),
    role: sec.role === 'join' ? 'join' : sec.role,
    cutEdgeCount: countCutEdges(rightIdx, adjacency),
    explodeOffset: [
      sec.explodeOffset[0] + ux * 0.5,
      sec.explodeOffset[1],
      sec.explodeOffset[2] + uz * 0.5,
    ],
    previewColor: SECTION_PREVIEW_PALETTE[nextColorIdx % SECTION_PREVIEW_PALETTE.length],
  };

  const nextSections = [...proposal.sections];
  nextSections.splice(sectionIdx, 1, leftSec, rightSec);
  return {
    ...proposal,
    hasIdenticalHalves: false,
    sections: nextSections,
  };
}
