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
  isUpright?: boolean;
  isInverted?: boolean;
  isSidewaysCapable?: boolean;
  isWheel?: boolean;
  isWheelHolder?: boolean;
  isBogiePart?: boolean;
  isTechnicAxle?: boolean;
  isAxleCollar?: boolean;
  isPinholeCoupler?: boolean;
  isTechnicPin?: boolean;
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

const SMOOTH_TILE_IDS = new Set([
  '3070', '3069', '63864', '2431', '6636', '4162', '3068', '26603', '87079', '69729',
  '2412', '25269', '98138', '14769', '15535', '20482', '22385', '35399', '6881', '6934',
]);

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
  | 'isUpright'
  | 'isInverted'
  | 'isSidewaysCapable'
  | 'isWheel'
  | 'isWheelHolder'
  | 'isBogiePart'
  | 'isTechnicAxle'
  | 'isAxleCollar'
  | 'isPinholeCoupler'
  | 'isTechnicPin'
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

  const isPinholeCoupler =
    PINHOLE_COUPLER_IDS.has(key) ||
    PINHOLE_COUPLER_IDS.has(baseNum) ||
    (/\b(pin\s*hole|with\s+hole)\b/i.test(name) && /\b(plate|tile|beam|liftarm)\b/i.test(name));

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
  if (hasTopStuds === undefined) {
    if (
      isSmoothTile ||
      isTechnicAxle ||
      isStudlessTechnic ||
      isWheel ||
      BOGIE_SWIVEL_TOP_IDS.has(key) ||
      BOGIE_SWIVEL_TOP_IDS.has(baseNum)
    ) {
      hasTopStuds = false;
    } else {
      hasTopStuds = true;
    }
  } else if (
    isSmoothTile ||
    isTechnicAxle ||
    isStudlessTechnic ||
    isWheel ||
    BOGIE_SWIVEL_TOP_IDS.has(key) ||
    BOGIE_SWIVEL_TOP_IDS.has(baseNum)
  ) {
    hasTopStuds = false;
  }

  const isSidewaysCapable =
    hints?.isSidewaysCapable ??
    (isTechnicPin ||
      isTechnicAxle ||
      isWheel ||
      isWheelHolder ||
      /snot|bracket|clip|hinge|bar|axle|pin|technic|liftarm|beam|turntable|handle|hook|grab|magnet|coupler|buffer|ball|socket|window|glass|door|fence|rail|ladder|hose|antenna|lever/i.test(name));

  return {
    isTile,
    hasTopStuds,
    isUpright: hints?.isUpright ?? true,
    isInverted: hints?.isInverted ?? false,
    isSidewaysCapable,
    isWheel,
    isWheelHolder,
    isBogiePart,
    isTechnicAxle,
    isAxleCollar,
    isPinholeCoupler,
    isTechnicPin,
  };
}

function enrichPartInput(p: SubdivisionPartInput): SubdivisionPartInput {
  if (
    p.isWheel !== undefined &&
    p.isWheelHolder !== undefined &&
    p.isTechnicAxle !== undefined &&
    p.isAxleCollar !== undefined &&
    p.hasTopStuds !== undefined
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
    reasons.push(`${partCount.toLocaleString()} pieces`);
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

function isHorizontalWheelAxle(p: SubdivisionPartInput): boolean {
  if (!p.isTechnicAxle) return false;
  const spanY = p.box.max[1] - p.box.min[1];
  const horiz = Math.max(p.box.max[0] - p.box.min[0], p.box.max[2] - p.box.min[2]);
  return spanY <= 18 && horiz >= 28;
}

const TURNTABLE_IDS = new Set(['3680', '3679', '61485', '27448', '18938', '18939', '3403', '3404']);

/**
 * Determines whether an edge between two physically adjacent parts represents a genuine
 * rigid stud / SNOT / clip / pin clutch connection (as opposed to a sliding smooth-tile
 * seam, swiveling bogie pin, turntable pivot, opposing pinhole coupler tongues, sliding
 * Technic axle, wheel-clip, or concave-scoop AABB overlap).
 */
export function isRigidStudEdge(a: SubdivisionPartInput, b: SubdivisionPartInput): boolean {
  if (a.isTechnicAxle || b.isTechnicAxle) return false;
  if (a.isWheel || b.isWheel) return false;

  const boxA = a.box;
  const boxB = b.box;
  const ovX = Math.min(boxA.max[0], boxB.max[0]) - Math.max(boxA.min[0], boxB.min[0]);
  const ovY = Math.min(boxA.max[1], boxB.max[1]) - Math.max(boxA.min[1], boxB.min[1]);
  const ovZ = Math.min(boxA.max[2], boxB.max[2]) - Math.max(boxA.min[2], boxB.min[2]);

  // Identify lower vs upper part by center Y
  const lower = boxA.center[1] <= boxB.center[1] ? a : b;
  const upper = lower === a ? b : a;

  const keyA = normalizeSubdivisionPartKey(a.partId);
  const keyB = normalizeSubdivisionPartKey(b.partId);
  const lowerKey = lower === a ? keyA : keyB;

  // Turntable base <-> turntable top swivels freely (not a rigid weld)
  if (
    (TURNTABLE_IDS.has(keyA.key) || TURNTABLE_IDS.has(keyA.baseNum)) &&
    (TURNTABLE_IDS.has(keyB.key) || TURNTABLE_IDS.has(keyB.baseNum))
  ) {
    return false;
  }

  // Bogie swivel plates (4025 / 65632 / 2878) swivel on a pin; they do NOT stud-weld to upper car floors
  if (
    (BOGIE_SWIVEL_TOP_IDS.has(lowerKey.key) || BOGIE_SWIVEL_TOP_IDS.has(lowerKey.baseNum)) &&
    upper.box.min[1] >= lower.box.max[1] - 6
  ) {
    return false;
  }
  // Standard RC wheel holder (38339) does not stud-weld directly to wide/long car floors
  if (
    lower.isWheelHolder &&
    !upper.isBogiePart &&
    !upper.isWheelHolder &&
    Math.max(upper.box.max[0] - upper.box.min[0], upper.box.max[2] - upper.box.min[2]) >= 120
  ) {
    return false;
  }

  // 1. Strict vertical face-to-face stud stacking check:
  // Lower's top face must actually meet upper's bottom face (rejects concave-scoop hollow enclosure!)
  const faceGap = Math.abs(lower.box.max[1] - upper.box.min[1]);
  if (ovX >= 3.0 && ovZ >= 3.0 && faceGap <= 6.5) {
    // Technic pin engaged into a beam/brick
    if (a.isTechnicPin || b.isTechnicPin) return true;

    // Opposing pinhole coupler tongues (e.g., two 3176 / 2444 / 32001 plates overlapping only at their pivot holes)
    // swivel freely around the vertical axle and do NOT stud-weld to each other!
    if (a.isPinholeCoupler && b.isPinholeCoupler) {
      const centerDistXZ = Math.hypot(
        boxA.center[0] - boxB.center[0],
        boxA.center[2] - boxB.center[2],
      );
      if (centerDistXZ >= 14) return false;
    }

    // Floating circular cross-axle collars resting against pinhole coupler plates/beams do not stud-weld
    if (
      (a.isAxleCollar && b.isPinholeCoupler) ||
      (b.isAxleCollar && a.isPinholeCoupler)
    ) {
      return false;
    }

    const lowerUpright = lower.isUpright !== false;
    const upperUpright = upper.isUpright !== false;
    if (lowerUpright && upperUpright) {
      if (lower.isInverted && !upper.isInverted) return false;
      if (!lower.isInverted && upper.isInverted) return false;
      if (lower.isInverted && upper.isInverted) {
        return upper.hasTopStuds !== false;
      }
      // Standard upright stack: lower part MUST actually have top studs (rejects smooth tiles / liftarms / bushes!)
      return lower.hasTopStuds !== false;
    }
    // At least one part is sideways (SNOT) meeting vertically with genuine contact
    return Boolean(a.isSidewaysCapable || b.isSidewaysCapable);
  }

  // 2. Sideways / SNOT / clip / hinge / Technic pin connection:
  // Circular axle collars (4032, 3941, 3713, 4265c, gears) have NO side studs/clips —
  // reject concave-scoop or side-wall AABB overlaps involving upright axle collars!
  if ((a.isAxleCollar && a.isUpright !== false) || (b.isAxleCollar && b.isUpright !== false)) {
    return false;
  }

  const goodAxes = (ovX >= 1.5 ? 1 : 0) + (ovY >= 1.5 ? 1 : 0) + (ovZ >= 1.5 ? 1 : 0);
  if (goodAxes < 2) return false;

  if (a.isTechnicPin || b.isTechnicPin) return true;
  if ((!a.isUpright || !b.isUpright) && ovX >= 1.5 && ovY >= 1.5 && ovZ >= 1.5) return true;
  if (a.isSidewaysCapable && b.isSidewaysCapable) return true;
  return false;
}

export function buildStudClutchAdjacency(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): number[][] {
  const studAdj: number[][] = Array.from({ length: allParts.length }, () => []);
  for (let i = 0; i < allParts.length; i++) {
    const pa = allParts[i];
    for (const j of adjacency[i] ?? []) {
      if (j <= i) continue;
      const pb = allParts[j];
      if (!pa || !pb) continue;
      if (isRigidStudEdge(pa, pb)) {
        studAdj[i].push(j);
        studAdj[j].push(i);
      }
    }
  }
  return studAdj;
}

interface DetectedBogie {
  indices: number[];
  minP: number;
  maxP: number;
  centerP: number;
  maxY: number;
}

/**
 * Detects intact train bogies / wheel assemblies (explicit bogie submodels, standard RC/9V
 * wheel holders + wheels + bogie plates + decorative sides, and custom brick-built bogies)
 * so a longitudinal cut plane NEVER slices a middle bogey in half.
 */
function detectIntactBogies(
  active: SubdivisionPartInput[],
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  studAdjacency: number[][],
  projMin: Map<number, number>,
  projMax: Map<number, number>,
  projCenter: Map<number, number>,
): DetectedBogie[] {
  const activeSet = new Set(active.map((p) => p.index));
  const bogies: DetectedBogie[] = [];
  const claimed = new Set<number>();

  // 1. Check explicit submodel instances (from .io / .mpd) that are compact wheel assemblies
  const bySubInst = new Map<string, number[]>();
  for (const p of active) {
    if (!p.submodelInstanceId) continue;
    let list = bySubInst.get(p.submodelInstanceId);
    if (!list) {
      list = [];
      bySubInst.set(p.submodelInstanceId, list);
    }
    list.push(p.index);
  }
  for (const list of bySubInst.values()) {
    if (list.length < 3 || list.length > Math.min(60, Math.floor(active.length * 0.25))) continue;
    const wheelCount = list.filter((i) => allParts[i].isWheel).length;
    const holderCount = list.filter((i) => allParts[i].isWheelHolder).length;
    if (wheelCount < 2 && holderCount < 1) continue;
    let minP = Infinity;
    let maxP = -Infinity;
    let maxY = -Infinity;
    for (const i of list) {
      const lo = projMin.get(i)!;
      const hi = projMax.get(i)!;
      if (lo < minP) minP = lo;
      if (hi > maxP) maxP = hi;
      if (allParts[i].box.max[1] > maxY) maxY = allParts[i].box.max[1];
    }
    if (maxP - minP > 240) continue;
    for (const i of list) claimed.add(i);
    bogies.push({ indices: list, minP, maxP, centerP: (minP + maxP) * 0.5, maxY });
  }

  // 2. Geometric & graph-based bogie detection for remaining unclaimed wheels & wheel holders
  const seeds = active.filter((p) => !claimed.has(p.index) && (p.isWheel || p.isWheelHolder));
  if (seeds.length === 0) return bogies;

  const globalWheelBandMaxY = Math.max(...seeds.map((s) => s.box.max[1]));

  // Build car-body firewall: parts stud-connected to the upper train body (> wheelBand + 28 LDU)
  // cannot be swallowed by a bogie expansion!
  const carBodySet = new Set<number>();
  const carQueue: number[] = [];
  for (const p of active) {
    if (
      p.box.min[1] > globalWheelBandMaxY + 28 &&
      !isVerticalPivotRod(p) &&
      !p.isAxleCollar &&
      !p.isWheel &&
      !p.isWheelHolder &&
      !p.isBogiePart
    ) {
      carBodySet.add(p.index);
      carQueue.push(p.index);
    }
  }
  for (let head = 0; head < carQueue.length; head++) {
    const u = carQueue[head];
    for (const v of studAdjacency[u] ?? []) {
      if (!activeSet.has(v) || carBodySet.has(v)) continue;
      const vp = allParts[v];
      if (vp.isWheel || vp.isWheelHolder || vp.isBogiePart || isVerticalPivotRod(vp) || isHorizontalWheelAxle(vp)) {
        continue;
      }
      carBodySet.add(v);
      carQueue.push(v);
    }
  }

  // Cluster seeds belonging to the same bogie (same wheel-holder / axle connectivity OR within 135 LDU along train axis)
  const seedIdxList = seeds.map((s) => s.index);
  const seedVisited = new Set<number>();
  const seedClusters: number[][] = [];

  for (const sIdx of seedIdxList) {
    if (seedVisited.has(sIdx)) continue;
    const cluster: number[] = [sIdx];
    seedVisited.add(sIdx);
    let head = 0;
    while (head < cluster.length) {
      const curr = cluster[head++];
      const currP = projCenter.get(curr)!;
      const currY = allParts[curr].box.center[1];

      // Expand to other seeds within bogie wheelbase distance (<= 135 LDU = 6.75 studs) and same height band
      for (const other of seedIdxList) {
        if (seedVisited.has(other)) continue;
        const otherP = projCenter.get(other)!;
        const otherY = allParts[other].box.center[1];
        if (Math.abs(otherP - currP) <= 135 && Math.abs(otherY - currY) <= 32) {
          seedVisited.add(other);
          cluster.push(other);
        }
      }

      // Also link seeds connected by a short path (<= 3 hops) through low non-car-body non-vertical-rod parts
      const bfs: Array<{ idx: number; depth: number }> = [{ idx: curr, depth: 0 }];
      const seenLocal = new Set<number>([curr]);
      for (let bHead = 0; bHead < bfs.length; bHead++) {
        const { idx, depth } = bfs[bHead];
        if (depth >= 3) continue;
        for (const nb of adjacency[idx] ?? []) {
          if (!activeSet.has(nb) || seenLocal.has(nb) || claimed.has(nb)) continue;
          const nbp = allParts[nb];
          if (isVerticalPivotRod(nbp) || carBodySet.has(nb)) continue;
          if (nbp.box.max[1] > globalWheelBandMaxY + 32) continue;
          if (projMax.get(nb)! - projMin.get(nb)! > 200) continue;
          seenLocal.add(nb);
          if ((nbp.isWheel || nbp.isWheelHolder) && !seedVisited.has(nb)) {
            seedVisited.add(nb);
            cluster.push(nb);
          }
          bfs.push({ idx: nb, depth: depth + 1 });
        }
      }
    }
    seedClusters.push(cluster);
  }

  // Expand each seed cluster into its full intact bogie (wheel holders, horizontal axles, bogie frame, decorative sides)
  for (const sCluster of seedClusters) {
    let seedMinP = Infinity;
    let seedMaxP = -Infinity;
    let wheelTopY = -Infinity;
    for (const i of sCluster) {
      const lo = projMin.get(i)!;
      const hi = projMax.get(i)!;
      if (lo < seedMinP) seedMinP = lo;
      if (hi > seedMaxP) seedMaxP = hi;
      if (allParts[i].box.max[1] > wheelTopY) wheelTopY = allParts[i].box.max[1];
    }
    const seedSpan = seedMaxP - seedMinP;

    const bogieSet = new Set<number>(sCluster);
    const q: number[] = [...sCluster];
    for (let head = 0; head < q.length; head++) {
      const u = q[head];
      const up = allParts[u];
      const uNeighbors = new Set<number>([
        ...(studAdjacency[u] ?? []),
        // Wheels, wheel holders, horizontal axles, and bogie decor also use physical adjacency
        ...(up.isWheel || up.isWheelHolder || up.isBogiePart || isHorizontalWheelAxle(up)
          ? adjacency[u] ?? []
          : []),
      ]);

      for (const nb of uNeighbors) {
        if (!activeSet.has(nb) || bogieSet.has(nb) || claimed.has(nb)) continue;
        const nbp = allParts[nb];
        if (isVerticalPivotRod(nbp)) continue;
        if (carBodySet.has(nb) && !nbp.isBogiePart && !nbp.isWheel && !nbp.isWheelHolder) continue;
        const nbLo = projMin.get(nb)!;
        const nbHi = projMax.get(nb)!;
        if (nbHi - nbLo > Math.max(180, seedSpan + 48)) continue;
        if (nbLo < seedMinP - 36 || nbHi > seedMaxP + 36) continue;
        if (nbp.box.max[1] > wheelTopY + 32) continue;
        // Require either bogie/wheel/horizontal-axle role OR stud/pin attachment to bogie frame
        const isNativeBogiePiece =
          nbp.isWheel || nbp.isWheelHolder || nbp.isBogiePart || isHorizontalWheelAxle(nbp);
        const isStudAttachedToU = (studAdjacency[u] ?? []).includes(nb);
        if (!isNativeBogiePiece && !isStudAttachedToU && !up.isWheel && !up.isWheelHolder && !isHorizontalWheelAxle(up)) {
          continue;
        }
        // Do not pull floating circular cross-axle collars sitting above the bogie into the bogie
        if (nbp.isAxleCollar && !isStudAttachedToU && nbp.box.min[1] >= wheelTopY - 2) continue;

        bogieSet.add(nb);
        q.push(nb);
      }
    }

    const indices = Array.from(bogieSet);
    if (indices.length < 2) continue;
    let minP = Infinity;
    let maxP = -Infinity;
    let maxY = -Infinity;
    for (const i of indices) {
      claimed.add(i);
      const lo = projMin.get(i)!;
      const hi = projMax.get(i)!;
      if (lo < minP) minP = lo;
      if (hi > maxP) maxP = hi;
      if (allParts[i].box.max[1] > maxY) maxY = allParts[i].box.max[1];
    }
    bogies.push({ indices, minP, maxP, centerP: (minP + maxP) * 0.5, maxY });
  }

  return bogies;
}

/**
 * Strategy A: Longitudinal Halves & Multi-Segment Split ("Build Halves First, Then Connect").
 * Uses 2D PCA to find the model's lengthwise direction, sweeps transverse planes to minimize
 * rigid stud cut edges, preserves intact bogies (never slicing a middle bogie in half),
 * keeps stud-connected seam bricks on their corresponding halves, and recognizes articulated
 * Technic axle/rod + floating circular cross-axle collar + middle bogie joints.
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

  const k = Math.max(2, Math.min(6, Math.round(segmentCount)));
  const pca = computeHorizontalPrincipalAxis(active);
  if (pca.majorSpan < 120) return null;

  const [ux, uz] = pca.axis;
  const [mx, mz] = pca.centerXZ;
  const bounds = computeModelBounds(active);

  // Project each active part's AABB onto PC1
  const projMin = new Map<number, number>();
  const projMax = new Map<number, number>();
  const projCenter = new Map<number, number>();
  let globalMinP = Infinity;
  let globalMaxP = -Infinity;

  for (const p of active) {
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

  // Build strict stud-clutch adjacency graph & detect intact wheel bogies
  const studAdjacency = buildStudClutchAdjacency(allParts, adjacency);
  const detectedBogies = detectIntactBogies(
    active,
    allParts,
    adjacency,
    studAdjacency,
    projMin,
    projMax,
    projCenter,
  );
  const partToBogie = new Map<number, DetectedBogie>();
  for (const bogie of detectedBogies) {
    for (const idx of bogie.indices) partToBogie.set(idx, bogie);
  }

  const verticalPivotRods = active.filter((p) => isVerticalPivotRod(p));

  const totalProjSpan = Math.max(1, globalMaxP - globalMinP);
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
      let studCutEdges = 0;
      let physCutEdges = 0;

      for (const p of active) {
        const lo = projMin.get(p.index)!;
        const hi = projMax.get(p.index)!;
        const c = projCenter.get(p.index)!;
        if (lo < t - 2.5 && hi > t + 2.5) {
          // Do not heavily penalize an intact bogie / vertical pivot rod sitting cleanly at an articulation seam
          if (!partToBogie.has(p.index) && !isVerticalPivotRod(p) && !p.isAxleCollar) {
            spanning++;
          }
        }
        if (c < t) leftCount++;
      }

      for (const p of active) {
        const ca = projCenter.get(p.index)!;
        if (ca >= t) continue;
        for (const nb of studAdjacency[p.index] ?? []) {
          const cb = projCenter.get(nb);
          if (cb !== undefined && cb >= t && !partToBogie.has(p.index) && !partToBogie.has(nb)) {
            studCutEdges++;
          }
        }
        for (const nb of adjacency[p.index] ?? []) {
          const cb = projCenter.get(nb);
          if (cb !== undefined && cb >= t) physCutEdges++;
        }
      }

      const fracDiff = Math.abs(leftCount / active.length - idealFrac);
      const score = spanning * 4.5 + studCutEdges * 3.2 + physCutEdges * 0.6 + fracDiff * active.length * 1.8;
      if (score < bestScore) {
        bestScore = score;
        bestT = t;
      }
    }

    // If a vertical Technic pivot rod sits right near bestT (articulated joint!), snap cut plane directly to its axis
    let snappedT = bestT;
    let bestRodDist = 44;
    for (const rod of verticalPivotRods) {
      const rp = projCenter.get(rod.index)!;
      const dist = Math.abs(rp - bestT);
      if (dist < bestRodDist) {
        bestRodDist = dist;
        snappedT = rp;
      }
    }
    cutPositions.push(snappedT);
  }

  // Identify protected middle-joint assemblies at each cut plane:
  // 1. Intact middle bogie(s) straddling a cut plane (NEVER cut in half!)
  // 2. Vertical Technic pivot rod(s) at the cut plane
  // 3. Circular cross-axle pieces (4032, 3941, 3713, 4265c, etc.) coaxial with a pivot rod
  const cutBogieSet = new Set<number>();
  const cutBogieList: DetectedBogie[] = [];
  for (const bogie of detectedBogies) {
    const straddlesCut = cutPositions.some((t) => bogie.minP < t + 12 && bogie.maxP > t - 12);
    if (straddlesCut) {
      cutBogieList.push(bogie);
      for (const idx of bogie.indices) cutBogieSet.add(idx);
    }
  }

  const pivotRodSet = new Set<number>();
  for (const rod of verticalPivotRods) {
    const rp = projCenter.get(rod.index)!;
    const nearCut = cutPositions.some((t) => Math.abs(rp - t) <= 44);
    const touchesCutBogie = (adjacency[rod.index] ?? []).some((nb) => cutBogieSet.has(nb));
    if (nearCut || touchesCutBogie) {
      pivotRodSet.add(rod.index);
    }
  }

  // If a pivot rod touches a bogie that wasn't caught by the ±12 LDU band (e.g., slightly offset), include that bogie intact too
  for (const rodIdx of pivotRodSet) {
    for (const nb of adjacency[rodIdx] ?? []) {
      const bogie = partToBogie.get(nb);
      if (bogie && !cutBogieList.includes(bogie)) {
        const rodP = projCenter.get(rodIdx)!;
        if (Math.abs(bogie.centerP - rodP) <= 60) {
          cutBogieList.push(bogie);
          for (const idx of bogie.indices) cutBogieSet.add(idx);
        }
      }
    }
  }

  const floatingCollarSet = new Set<number>();
  for (const rodIdx of pivotRodSet) {
    const rod = allParts[rodIdx];
    const rx = rod.box.center[0];
    const rz = rod.box.center[2];
    const rodP = projCenter.get(rodIdx)!;
    const rMinY = rod.box.min[1];
    const rMaxY = rod.box.max[1];

    for (const p of active) {
      if (cutBogieSet.has(p.index) || pivotRodSet.has(p.index)) continue;
      if (!p.isAxleCollar) continue;
      const distXZ = Math.hypot(p.box.center[0] - rx, p.box.center[2] - rz);
      const overlapsY = p.box.max[1] >= rMinY - 4 && p.box.min[1] <= rMaxY + 4;
      if (distXZ <= 10 && overlapsY) {
        // Verify this circular collar is NOT firmly bricked into >= 2 non-coaxial bricks on the SAME side
        let leftSideStuds = 0;
        let rightSideStuds = 0;
        for (const nb of studAdjacency[p.index] ?? []) {
          if (cutBogieSet.has(nb) || pivotRodSet.has(nb)) continue;
          const nbp = allParts[nb];
          if (nbp.isAxleCollar || nbp.isPinholeCoupler) continue;
          const nbDistXZ = Math.hypot(nbp.box.center[0] - rx, nbp.box.center[2] - rz);
          if (nbDistXZ <= 10) continue;
          if ((projCenter.get(nb) ?? rodP) < rodP) leftSideStuds++;
          else rightSideStuds++;
        }
        const sandwichedBetweenHalves = leftSideStuds > 0 && rightSideStuds > 0;
        if (sandwichedBetweenHalves || Math.max(leftSideStuds, rightSideStuds) <= 1) {
          floatingCollarSet.add(p.index);
        }
      }
    }
  }

  const protectedJoinSet = new Set<number>([
    ...cutBogieSet,
    ...pivotRodSet,
    ...floatingCollarSet,
  ]);

  // Initial segment assignment for non-protected parts
  const segOwner = new Map<number, number>();
  const rawSpanning: number[] = [];

  // Keep non-cut bogies (e.g., Front Bogie, Rear Bogie) intact inside their side segment
  for (const bogie of detectedBogies) {
    if (cutBogieList.includes(bogie)) continue;
    let segIdx = 0;
    while (segIdx < cutPositions.length && bogie.centerP >= cutPositions[segIdx]) segIdx++;
    for (const idx of bogie.indices) {
      if (!protectedJoinSet.has(idx)) segOwner.set(idx, segIdx);
    }
  }

  for (const p of active) {
    if (protectedJoinSet.has(p.index) || segOwner.has(p.index)) continue;
    const lo = projMin.get(p.index)!;
    const hi = projMax.get(p.index)!;
    const c = projCenter.get(p.index)!;
    const crossesCut = cutPositions.some((t) => lo < t - 2.5 && hi > t + 2.5);
    if (crossesCut) {
      rawSpanning.push(p.index);
    } else {
      let segIdx = 0;
      while (segIdx < cutPositions.length && c >= cutPositions[segIdx]) segIdx++;
      segOwner.set(p.index, segIdx);
    }
  }

  // Reassign stud-connected cut-zone bricks back to their corresponding half!
  // Any brick crossing the cut plane that is connected by studs ONLY to one half (e.g.,
  // articulated train scoops & coupler tongues!) belongs in that half, NOT in the middle section.
  let remainingSpanning = [...rawSpanning];
  if (remainingSpanning.length > 0) {
    // Pass 1: Iterative single-side stud absorption
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
    // If an entire stud-connected spanning sub-cluster connects by studs ONLY to 1 half,
    // assign the whole cluster to that half!
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
        } else if (touchedSegs.size === 0 && pivotRodSet.size > 0) {
          // Completely unattached by studs to either half: if compact & coaxial with a pivot rod, promote to floating collar!
          const allCoaxial = comp.every((idx) => {
            const p = allParts[idx];
            const sx = p.box.max[0] - p.box.min[0];
            const sz = p.box.max[2] - p.box.min[2];
            if (Math.max(sx, sz) > 86 || Math.abs(sx - sz) > 12) return false;
            return Array.from(pivotRodSet).some((rIdx) => {
              const rod = allParts[rIdx];
              const d = Math.hypot(p.box.center[0] - rod.box.center[0], p.box.center[2] - rod.box.center[2]);
              return d <= 12 && p.box.max[1] >= rod.box.min[1] - 4 && p.box.min[1] <= rod.box.max[1] + 4;
            });
          });
          if (allCoaxial) {
            for (const idx of comp) {
              floatingCollarSet.add(idx);
              protectedJoinSet.add(idx);
            }
          } else {
            stillBridging.push(...comp);
          }
        } else {
          stillBridging.push(...comp);
        }
      }
      remainingSpanning = stillBridging;
    }
  }

  // If too many rigid bricks still physically bridge the cut (> 35% of parts, e.g. long overlapping Technic frame),
  // assign them by center so halves stay balanced and prefer Numbered Bags mode.
  const totalJoinCandidateCount = remainingSpanning.length + protectedJoinSet.size;
  const heavySpanning =
    remainingSpanning.length > Math.max(20, Math.floor(active.length * 0.35)) &&
    pivotRodSet.size === 0 &&
    cutBogieSet.size === 0;

  const rawSegments: number[][] = Array.from({ length: k }, () => []);
  for (const [idx, segIdx] of segOwner.entries()) {
    rawSegments[segIdx].push(idx);
  }

  const finishJoinIndices: number[] = [];
  if (heavySpanning) {
    for (const idx of [...remainingSpanning, ...protectedJoinSet]) {
      const c = projCenter.get(idx)!;
      let segIdx = 0;
      while (segIdx < cutPositions.length && c >= cutPositions[segIdx]) segIdx++;
      rawSegments[segIdx].push(idx);
    }
  } else {
    finishJoinIndices.push(...remainingSpanning);
  }

  const allJoinSet = new Set<number>(
    heavySpanning
      ? []
      : [...cutBogieSet, ...pivotRodSet, ...floatingCollarSet, ...finishJoinIndices],
  );

  // Enforce internal connectivity inside each segment:
  // ONLY move a small detached fragment to Join if it is actually adjacent to the cut plane
  // AND connected to the join zone (never pull stray roof/end details 20 studs away into Center Join!).
  const cleanSegments: number[][] = [];
  for (const seg of rawSegments) {
    if (seg.length === 0) continue;
    const comps = getConnectedComponents(seg, adjacency);
    if (comps.length <= 1) {
      cleanSegments.push(seg);
    } else {
      cleanSegments.push(comps[0]);
      for (let ci = 1; ci < comps.length; ci++) {
        const comp = comps[ci];
        const nearCutPlane = comp.some((idx) => {
          const lo = projMin.get(idx)!;
          const hi = projMax.get(idx)!;
          return cutPositions.some((t) => lo <= t + 36 && hi >= t - 36);
        });
        const touchesJoin = comp.some((idx) =>
          (adjacency[idx] ?? []).some((nb) => allJoinSet.has(nb)),
        );
        const isSmallFragment = comp.length <= Math.max(8, Math.floor(seg.length * 0.25));

        if (!heavySpanning && isSmallFragment && nearCutPlane && touchesJoin) {
          // If it's stud-connected ONLY to a cut bogie or is a floating collar on the pivot rod, classify accurately
          const touchesCutBogie = comp.some((idx) =>
            (adjacency[idx] ?? []).some((nb) => cutBogieSet.has(nb)),
          );
          if (touchesCutBogie && comp.every((idx) => allParts[idx].box.max[1] <= Math.max(...cutBogieList.map((b) => b.maxY), -Infinity) + 20)) {
            for (const idx of comp) {
              cutBogieSet.add(idx);
              allJoinSet.add(idx);
            }
          } else {
            for (const idx of comp) {
              finishJoinIndices.push(idx);
              allJoinSet.add(idx);
            }
          }
        } else {
          cleanSegments[cleanSegments.length - 1].push(...comp);
        }
      }
    }
  }

  if (cleanSegments.length < 2) return null;

  const bogiePartIndices = heavySpanning ? [] : Array.from(cutBogieSet);
  const pivotRodIndices = heavySpanning ? [] : Array.from(pivotRodSet);
  const floatingCollarIndices = heavySpanning ? [] : Array.from(floatingCollarSet);
  const joinIndices = heavySpanning
    ? []
    : [...floatingCollarIndices, ...pivotRodIndices, ...bogiePartIndices, ...finishJoinIndices];

  // Check if 2 halves are structurally identical (e.g., symmetrical train car ends!)
  const isIdenticalHalves =
    allowRepeatCollapse &&
    cleanSegments.length === 2 &&
    areSectionsStructurallyIdentical(cleanSegments[0], cleanSegments[1], allParts);

  const outputMode: SubdivisionOutputMode = heavySpanning ? 'numbered_bags' : 'modular_chapters';
  const sections: ProposedSection[] = [];
  const midSeg = (cleanSegments.length - 1) / 2;

  const segLabel = (idx: number, total: number): string => {
    if (total === 2) return idx === 0 ? 'Front Half' : 'Rear Half';
    if (total === 3) return idx === 0 ? 'Front Section' : idx === 1 ? 'Middle Section' : 'Rear Section';
    return `Section ${idx + 1}`;
  };

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
      previewColor: SECTION_PREVIEW_PALETTE[0],
    });
  } else {
    cleanSegments.forEach((seg, idx) => {
      const dirSign = idx - midSeg;
      const mag = Math.abs(dirSign) < 0.01 ? 0 : dirSign / Math.max(0.5, midSeg);
      sections.push({
        id: `sec_long_${idx + 1}`,
        name: outputMode === 'numbered_bags' ? `Bag ${idx + 1} (${segLabel(idx, cleanSegments.length)})` : segLabel(idx, cleanSegments.length),
        partIndices: seg,
        partIds: seg.map((i) => allParts[i].id),
        role: outputMode === 'numbered_bags' ? 'bag' : 'module',
        cutEdgeCount: countCutEdges(seg, adjacency),
        attachNormal: [ux * Math.sign(dirSign || 1), 0, uz * Math.sign(dirSign || 1)],
        explodeOffset: [ux * mag, 0, uz * mag],
        previewColor: SECTION_PREVIEW_PALETTE[idx % SECTION_PREVIEW_PALETTE.length],
      });
    });
  }

  const hasArticulatedJoint =
    cleanSegments.length === 2 &&
    outputMode === 'modular_chapters' &&
    (pivotRodIndices.length > 0 || bogiePartIndices.length > 0);

  const articulatedJoin: ArticulatedJoinPlan | undefined = hasArticulatedJoint
    ? {
        slideAxis: [ux, uz],
        floatingCollarIndices,
        pivotRodIndices,
        bogiePartIndices,
        bogieName: bogiePartIndices.length > 0 ? 'Middle Bogie' : undefined,
        finishPartIndices: finishJoinIndices,
      }
    : undefined;

  if (joinIndices.length > 0 && outputMode === 'modular_chapters') {
    const joinName = hasArticulatedJoint
      ? bogiePartIndices.length > 0 && pivotRodIndices.length > 0
        ? 'Center Joint & Bogie'
        : bogiePartIndices.length > 0
          ? 'Middle Bogie & Join'
          : 'Center Articulation Joint'
      : cleanSegments.length === 2
        ? 'Center Connector & Join'
        : 'Connect Sections';

    sections.push({
      id: 'sec_join_center',
      name: joinName,
      partIndices: joinIndices,
      partIds: joinIndices.map((i) => allParts[i].id),
      role: 'join',
      cutEdgeCount: countCutEdges(joinIndices, adjacency),
      // Keep articulated bogie/rod joints cleanly centered on track level between the pulled-apart halves
      explodeOffset: hasArticulatedJoint ? [0, 0, 0] : [0, 0.85, 0],
      previewColor: JOIN_PREVIEW_COLOR,
      articulatedJoin,
    });
  }

  const maxSegDiag = Math.max(...cleanSegments.map((s) => computeSectionDiag(s, allParts)), 1);
  const zoomGainEstimate = Math.max(1.1, Math.round((bounds.diag / maxSegDiag) * 10) / 10);

  const aspect = pca.minorSpan > 1 ? pca.majorSpan / pca.minorSpan : 1;
  const spanRatio = totalJoinCandidateCount / active.length;
  let confidence = 72;
  if (aspect >= 2.2) confidence += 14;
  if (aspect >= 3.5) confidence += 6;
  if (spanRatio <= 0.08) confidence += 8;
  else if (spanRatio > 0.25 && !hasArticulatedJoint) confidence -= 12;
  if (hasArticulatedJoint) confidence += 6;
  if (isIdenticalHalves) confidence += 6;
  confidence = Math.max(45, Math.min(98, Math.round(confidence)));

  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
    active.length,
    sections.length,
  );

  const title =
    cleanSegments.length === 2
      ? isIdenticalHalves
        ? 'Build 2× Identical Halves, Then Connect'
        : 'Build Halves First, Then Connect'
      : `Build in ${cleanSegments.length} Segments, Then Connect`;

  const joinNote =
    joinIndices.length > 0
      ? ` + ${joinIndices.length} connector piece${joinIndices.length === 1 ? '' : 's'}`
      : '';
  const articulatedDesc = hasArticulatedJoint
    ? [
        bogiePartIndices.length > 0 ? `intact middle bogie (${bogiePartIndices.length} pcs)` : null,
        pivotRodIndices.length > 0 ? `${pivotRodIndices.length} Technic rod` : null,
        floatingCollarIndices.length > 0 ? `${floatingCollarIndices.length} axle spacer${floatingCollarIndices.length === 1 ? '' : 's'}` : null,
      ]
        .filter(Boolean)
        .join(' + ')
    : '';
  const rationale = isIdenticalHalves
    ? `Both halves match (${cleanSegments[0].length} pcs each${joinNote}) — build once ×2 at ~${zoomGainEstimate}× larger zoom, then connect.`
    : heavySpanning
      ? `Splits along the ${Math.round(pca.majorSpan / 20)}-stud length into ${cleanSegments.length} balanced stages (tightly interlocked spine).`
      : hasArticulatedJoint && articulatedDesc
        ? `Builds both halves separately (~${zoomGainEstimate}× zoom), then connects via ${articulatedDesc}.`
        : `Builds ${cleanSegments.length} shorter sections first${joinNote} for ~${zoomGainEstimate}× larger bricks on screen before joining.`;

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
 * Sweeps plate-level horizontal planes (8 LDU) to find smooth-tile seams or low-stud transitions.
 */
export function buildHorizontalFloorsProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  floorCount?: number,
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 24) return null;

  const bounds = computeModelBounds(active);
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

    for (const p of active) {
      if (p.box.center[1] < y) below++;
      if (p.box.min[1] < y - 3 && p.box.max[1] > y + 3) spanning++;
      if (p.isTile && Math.abs(p.box.max[1] - y) <= 4.5) tileCount++;
    }
    if (below < Math.max(6, active.length * 0.12) || active.length - below < Math.max(6, active.length * 0.12)) {
      continue;
    }

    for (const p of active) {
      if (p.box.center[1] >= y) continue;
      for (const nb of adjacency[p.index] ?? []) {
        const nbPart = allParts[nb];
        if (nbPart && !nbPart.isMinifig && nbPart.box.center[1] >= y) cutEdges++;
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

  const buckets: number[][] = Array.from({ length: chosen.length + 1 }, () => []);
  for (const p of active) {
    let f = 0;
    while (f < chosen.length && p.box.center[1] >= chosen[f].y) f++;
    buckets[f].push(p.index);
  }

  const nonEmpty = buckets.filter((b) => b.length >= 4);
  if (nonEmpty.length < 2) return null;

  const avgTiles = chosen.reduce((acc, c) => acc + c.tileCount, 0) / chosen.length;
  const avgCut = chosen.reduce((acc, c) => acc + c.cutEdges, 0) / chosen.length;
  const hasModularTileSeams = avgTiles >= 3 && avgCut <= Math.max(18, active.length * 0.08);
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
      : `Separates the ${Math.round(bounds.spanY / 24)}-brick-tall build into ${nonEmpty.length} clean horizontal stages.`,
    zoomGainEstimate,
    confidence,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/**
 * Strategy C: Structural Modules & Graph Community Clustering.
 * Uses farthest-point seeding + connectivity-preserving boundary refinement to isolate
 * cohesive sub-builds (wings, pods, towers, bogies).
 */
export function buildStructuralModulesProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  targetModules?: number,
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 24) return null;

  const k = targetModules
    ? Math.max(2, Math.min(8, Math.round(targetModules)))
    : Math.max(2, Math.min(5, Math.round(active.length / 130)));

  const activeSet = new Set(active.map((p) => p.index));
  const bounds = computeModelBounds(active);

  // 1. Pick k well-separated spatial seeds
  const seeds: number[] = [];
  let firstSeed = active[0].index;
  let maxDist = -1;
  for (const p of active) {
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
    for (const p of active) {
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

  // 2. Multi-source balanced BFS growth along physical connections
  const clusterOf = new Map<number, number>();
  const clusterSizes = new Array<number>(seeds.length).fill(0);
  const queues: number[][] = seeds.map((s, cid) => {
    clusterOf.set(s, cid);
    clusterSizes[cid] = 1;
    return [s];
  });
  const qHeads = new Array<number>(seeds.length).fill(0);
  const targetSize = active.length / seeds.length;

  let progress = true;
  while (progress) {
    progress = false;
    // Always advance the smallest cluster that still has queued frontier nodes
    const order = seeds
      .map((_, cid) => cid)
      .sort((a, b) => clusterSizes[a] - clusterSizes[b]);
    for (const cid of order) {
      const q = queues[cid];
      while (qHeads[cid] < q.length) {
        const u = q[qHeads[cid]++];
        let expanded = false;
        for (const v of adjacency[u] ?? []) {
          if (!activeSet.has(v) || clusterOf.has(v)) continue;
          clusterOf.set(v, cid);
          clusterSizes[cid]++;
          q.push(v);
          expanded = true;
          progress = true;
        }
        if (expanded) break;
      }
    }
  }

  // Assign any disconnected islands to nearest seed
  for (const p of active) {
    if (clusterOf.has(p.index)) continue;
    let bestC = 0;
    let bestD = Infinity;
    seeds.forEach((s, cid) => {
      const sp = allParts[s];
      const d = Math.hypot(
        p.box.center[0] - sp.box.center[0],
        p.box.center[1] - sp.box.center[1],
        p.box.center[2] - sp.box.center[2],
      );
      if (d < bestD) {
        bestD = d;
        bestC = cid;
      }
    });
    clusterOf.set(p.index, bestC);
    clusterSizes[bestC]++;
  }

  // 3. Lightweight modularity smoothing (move boundary nodes to neighbor with strictly more edges)
  for (let pass = 0; pass < 3; pass++) {
    let moved = 0;
    for (const p of active) {
      const curr = clusterOf.get(p.index)!;
      if (clusterSizes[curr] <= 6) continue;
      const counts = new Map<number, number>();
      for (const nb of adjacency[p.index] ?? []) {
        const nc = clusterOf.get(nb);
        if (nc !== undefined) counts.set(nc, (counts.get(nc) ?? 0) + 1);
      }
      const sameEdges = counts.get(curr) ?? 0;
      let bestC = curr;
      let bestScore = sameEdges;
      for (const [nc, ec] of counts.entries()) {
        if (nc === curr) continue;
        if (clusterSizes[nc] > targetSize * 1.45) continue;
        if (ec > bestScore) {
          bestScore = ec;
          bestC = nc;
        }
      }
      if (bestC !== curr) {
        clusterOf.set(p.index, bestC);
        clusterSizes[curr]--;
        clusterSizes[bestC]++;
        moved++;
      }
    }
    if (moved === 0) break;
  }

  const grouped: number[][] = Array.from({ length: seeds.length }, () => []);
  for (const p of active) {
    grouped[clusterOf.get(p.index)!].push(p.index);
  }
  const validGroups = grouped.filter((g) => g.length >= 4);
  if (validGroups.length < 2) return null;

  // Order modules bottom-to-top, then front-to-back
  validGroups.sort((a, b) => {
    const ba = computeModelBounds(a.map((i) => allParts[i]));
    const bb = computeModelBounds(b.map((i) => allParts[i]));
    if (Math.abs(ba.min[1] - bb.min[1]) > 24) return ba.min[1] - bb.min[1];
    return ba.center[0] - bb.center[0];
  });

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

  const sections: ProposedSection[] = validGroups.map((indices, idx) => {
    const sb = computeModelBounds(indices.map((i) => allParts[i]));
    const dx = sb.center[0] - bounds.center[0];
    const dy = sb.center[1] - bounds.center[1];
    const dz = sb.center[2] - bounds.center[2];
    const len = Math.hypot(dx, dy, dz) || 1;
    return {
      id: `sec_mod_${idx + 1}`,
      name: `Module ${idx + 1}`,
      partIndices: indices,
      partIds: indices.map((i) => allParts[i].id),
      role: outputMode === 'modular_chapters' ? 'module' : 'bag',
      cutEdgeCount: countCutEdges(indices, adjacency),
      explodeOffset: [dx / len, Math.max(0, dy / len * 0.5), dz / len],
      previewColor: SECTION_PREVIEW_PALETTE[idx % SECTION_PREVIEW_PALETTE.length],
    };
  });

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
    rationale: `Groups densely connected bricks into ${validGroups.length} cohesive modules (${Math.round(cutRatio * 100)}% seam edges) before final assembly.`,
    zoomGainEstimate,
    confidence,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/**
 * Strategy D: Numbered Build Bags (Universal Sequential Staging).
 * Runs a fast grounded topological traversal and places bag dividers at clean milestones.
 */
export function buildNumberedBagsProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  bagCount?: number,
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 18) return null;

  const k = bagCount
    ? Math.max(2, Math.min(12, Math.round(bagCount)))
    : Math.max(2, Math.min(8, Math.round(active.length / 180)));

  const activeSet = new Set(active.map((p) => p.index));
  const sortedByY = [...active].sort(
    (a, b) => a.box.min[1] - b.box.min[1] || a.box.center[0] - b.box.center[0],
  );

  // Fast grounded topological ordering
  const placed = new Set<number>();
  const ordered: number[] = [];
  const frontier = new Set<number>();

  const seedPart = sortedByY[0].index;
  frontier.add(seedPart);

  while (ordered.length < active.length) {
    let pick = -1;
    if (frontier.size > 0) {
      let bestY = Infinity;
      for (const idx of frontier) {
        const y = allParts[idx].box.min[1];
        if (y < bestY) {
          bestY = y;
          pick = idx;
        }
      }
      frontier.delete(pick);
    } else {
      for (const p of sortedByY) {
        if (!placed.has(p.index)) {
          pick = p.index;
          break;
        }
      }
    }
    if (pick < 0) break;
    placed.add(pick);
    ordered.push(pick);
    for (const nb of adjacency[pick] ?? []) {
      if (activeSet.has(nb) && !placed.has(nb)) frontier.add(nb);
    }
  }

  const idealBagSize = ordered.length / k;
  const splitPoints: number[] = [0];
  const windowRadius = Math.max(3, Math.floor(idealBagSize * 0.18));

  for (let b = 1; b < k; b++) {
    const idealIdx = Math.round(b * idealBagSize);
    let bestIdx = idealIdx;
    let bestYJump = -1;
    // Prefer splitting right at a vertical height-layer transition near the target bag size
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

  const bounds = computeModelBounds(active);
  const sections: ProposedSection[] = [];
  for (let b = 0; b < splitPoints.length - 1; b++) {
    const slice = ordered.slice(splitPoints[b], splitPoints[b + 1]);
    if (slice.length === 0) continue;
    const sb = computeModelBounds(slice.map((i) => allParts[i]));
    const dx = sb.center[0] - bounds.center[0];
    const dy = sb.center[1] - bounds.center[1];
    const dz = sb.center[2] - bounds.center[2];
    const len = Math.hypot(dx, dy, dz) || 1;
    sections.push({
      id: `sec_bag_${b + 1}`,
      name: `Bag ${b + 1}`,
      partIndices: slice,
      partIds: slice.map((i) => allParts[i].id),
      role: 'bag',
      cutEdgeCount: countCutEdges(slice, adjacency),
      explodeOffset: [dx / len * 0.5, (b / Math.max(1, k - 1)) * 0.9, dz / len * 0.5],
      previewColor: SECTION_PREVIEW_PALETTE[b % SECTION_PREVIEW_PALETTE.length],
    });
  }

  const avgBag = Math.round(active.length / sections.length);
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
    rationale: `Keeps one continuous zero-floating build divided into ${sections.length} official-style numbered bags (~${avgBag} pcs/bag).`,
    confidence,
    sections,
    estimatedStepCount,
    estimatedPageCount,
  };
}

/**
 * Strategy E: Spatial Sector / Baseplate Grid Split (Wide Dioramas & Landscapes).
 */
export function buildSpatialSectorsProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
): SubdivisionProposal | null {
  const active = allParts.filter((p) => !p.isMinifig);
  if (active.length < 32) return null;

  const bounds = computeModelBounds(active);
  const minHoriz = Math.min(bounds.spanX, bounds.spanZ);
  const maxHoriz = Math.max(bounds.spanX, bounds.spanZ);
  if (maxHoriz < 480 || minHoriz < 240 || minHoriz / Math.max(24, bounds.spanY) < 1.25) {
    return null;
  }

  const midX = bounds.center[0];
  const midZ = bounds.center[2];
  const quads: number[][] = [[], [], [], []];
  const seamJoin: number[] = [];

  for (const p of active) {
    const crossX = p.box.min[0] < midX - 2.5 && p.box.max[0] > midX + 2.5;
    const crossZ = p.box.min[2] < midZ - 2.5 && p.box.max[2] > midZ + 2.5;
    if (crossX || crossZ) {
      seamJoin.push(p.index);
    } else {
      const qi = (p.box.center[0] >= midX ? 1 : 0) + (p.box.center[2] >= midZ ? 2 : 0);
      quads[qi].push(p.index);
    }
  }

  const heavySeam = seamJoin.length > active.length * 0.3;
  if (heavySeam) {
    for (const idx of seamJoin) {
      const p = allParts[idx];
      const qi = (p.box.center[0] >= midX ? 1 : 0) + (p.box.center[2] >= midZ ? 2 : 0);
      quads[qi].push(idx);
    }
    seamJoin.length = 0;
  }

  const names = ['Front-Left Sector', 'Front-Right Sector', 'Back-Left Sector', 'Back-Right Sector'];
  const dirs: Vec3[] = [
    [-0.75, 0, -0.75],
    [0.75, 0, -0.75],
    [-0.75, 0, 0.75],
    [0.75, 0, 0.75],
  ];

  const outputMode: SubdivisionOutputMode = heavySeam ? 'numbered_bags' : 'modular_chapters';
  const sections: ProposedSection[] = [];
  quads.forEach((indices, qi) => {
    if (indices.length === 0) return;
    sections.push({
      id: `sec_quad_${qi + 1}`,
      name: names[qi],
      partIndices: indices,
      partIds: indices.map((i) => allParts[i].id),
      role: outputMode === 'modular_chapters' ? 'module' : 'bag',
      cutEdgeCount: countCutEdges(indices, adjacency),
      explodeOffset: dirs[qi],
      previewColor: SECTION_PREVIEW_PALETTE[qi % SECTION_PREVIEW_PALETTE.length],
    });
  });
  if (sections.length < 2) return null;

  if (seamJoin.length > 0 && outputMode === 'modular_chapters') {
    sections.push({
      id: 'sec_quad_join',
      name: 'Seam Join & Connectors',
      partIndices: seamJoin,
      partIds: seamJoin.map((i) => allParts[i].id),
      role: 'join',
      cutEdgeCount: countCutEdges(seamJoin, adjacency),
      explodeOffset: [0, 0.85, 0],
      previewColor: JOIN_PREVIEW_COLOR,
    });
  }

  const maxQuadDiag = Math.max(...quads.filter((q) => q.length > 0).map((q) => computeSectionDiag(q, allParts)), 1);
  const zoomGainEstimate = Math.max(1.2, Math.round((bounds.diag / maxQuadDiag) * 10) / 10);
  const { estimatedStepCount, estimatedPageCount } = estimateStepsAndPages(
    active.length,
    sections.length,
  );

  return {
    id: 'prop_sectors_4',
    strategy: 'spatial_sectors',
    outputMode,
    title: `Baseplate Sectors (${sections.filter((s) => s.role !== 'join').length} Quadrants)`,
    rationale: `Splits the wide ${Math.round(bounds.spanX / 20)}×${Math.round(bounds.spanZ / 20)}-stud footprint into quadrants for ~${zoomGainEstimate}× clearer detail.`,
    zoomGainEstimate,
    confidence: heavySeam ? 74 : 88,
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

  // For very long models (≥ 40 studs), also offer a 3-segment option
  if (assessment.longestSpanLdu >= 800 && assessment.aspectRatio >= 3.0) {
    const thirds = buildLongitudinalHalvesProposal(parts, adjacency, 3, false);
    if (thirds) {
      thirds.confidence = Math.max(55, thirds.confidence - 6);
      proposals.push(thirds);
    }
  }

  const floors = buildHorizontalFloorsProposal(parts, adjacency);
  if (floors) proposals.push(floors);

  const sectors = buildSpatialSectorsProposal(parts, adjacency);
  if (sectors) proposals.push(sectors);

  const modules = buildStructuralModulesProposal(parts, adjacency);
  if (modules) proposals.push(modules);

  const bags = buildNumberedBagsProposal(parts, adjacency);
  if (bags) proposals.push(bags);

  proposals.sort((a, b) => b.confidence - a.confidence);
  return {
    assessment,
    proposals: proposals.slice(0, 4),
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
    default:
      return null;
  }
}

/**
 * Merges two proposed sections cleanly (used by the 1-click Merge button in the Import Assistant).
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
 * Splits a single proposed section into two halves along its own 2D PCA axis.
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

  const subset = sourceIndices.map((i) => allParts[i]).filter(Boolean);
  const pca = computeHorizontalPrincipalAxis(subset);
  const [ux, uz] = pca.axis;
  const [mx, mz] = pca.centerXZ;

  const sorted = [...subset].sort((a, b) => {
    const pa = (a.box.center[0] - mx) * ux + (a.box.center[2] - mz) * uz;
    const pb = (b.box.center[0] - mx) * ux + (b.box.center[2] - mz) * uz;
    return pa - pb;
  });
  const mid = Math.floor(sorted.length / 2);
  const leftIdx = sorted.slice(0, mid).map((p) => p.index);
  const rightIdx = sorted.slice(mid).map((p) => p.index);

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
