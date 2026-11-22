import { resolvePartDefinition } from '../data/partCatalog';
import type {
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
  colorId: number;
  box: {
    min: Vec3;
    max: Vec3;
    center: Vec3;
  };
  isTile?: boolean;
  isMinifig?: boolean;
  submodelKey?: string;
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

export function buildSubdivisionInputsFromCanonical(
  model: CanonicalModel,
  graph: ConnectivityGraph,
): { parts: SubdivisionPartInput[]; adjacency: number[][] } {
  const idToIndex = new Map<string, number>();
  const parts: SubdivisionPartInput[] = model.parts.map((p, index) => {
    idToIndex.set(p.id, index);
    const def = resolvePartDefinition(p.partId);
    const box = computePartWorldAabb(p);
    return {
      index,
      id: p.id,
      partId: p.partId,
      colorId: p.colorId,
      box,
      isTile: def.shape === 'tile' || !def.hasTopStuds,
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

/**
 * Strategy A: Longitudinal Halves & Multi-Segment Split ("Build Halves First, Then Connect").
 * Uses 2D PCA to find the model's lengthwise direction, sweeps transverse planes to minimize
 * spanning coupler bricks, puts spanning bricks into a clean Connect/Join step, and detects
 * identical 2x halves when symmetric.
 */
export function buildLongitudinalHalvesProposal(
  allParts: SubdivisionPartInput[],
  adjacency: number[][],
  segmentCount = 2,
  allowRepeatCollapse = true,
): SubdivisionProposal | null {
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
      let cutEdges = 0;

      for (const p of active) {
        const lo = projMin.get(p.index)!;
        const hi = projMax.get(p.index)!;
        const c = projCenter.get(p.index)!;
        if (lo < t - 2.5 && hi > t + 2.5) spanning++;
        if (c < t) leftCount++;
      }

      for (const p of active) {
        const ca = projCenter.get(p.index)!;
        if (ca >= t) continue;
        for (const nb of adjacency[p.index] ?? []) {
          const cb = projCenter.get(nb);
          if (cb !== undefined && cb >= t) cutEdges++;
        }
      }

      const fracDiff = Math.abs(leftCount / active.length - idealFrac);
      const score = spanning * 7.5 + cutEdges * 1.4 + fracDiff * active.length * 1.8;
      if (score < bestScore) {
        bestScore = score;
        bestT = t;
      }
    }
    cutPositions.push(bestT);
  }

  // Assign each part to a segment 0..k-1, or to the spanning/join bucket
  const rawSegments: number[][] = Array.from({ length: k }, () => []);
  const spanningIndices: number[] = [];

  for (const p of active) {
    const lo = projMin.get(p.index)!;
    const hi = projMax.get(p.index)!;
    const c = projCenter.get(p.index)!;
    const crossesCut = cutPositions.some((t) => lo < t - 2.5 && hi > t + 2.5);
    if (crossesCut) {
      spanningIndices.push(p.index);
    } else {
      let segIdx = 0;
      while (segIdx < cutPositions.length && c >= cutPositions[segIdx]) segIdx++;
      rawSegments[segIdx].push(p.index);
    }
  }

  // If too many bricks physically span the cut (> 35% of parts, e.g. long overlapping Technic frame),
  // assign spanning bricks by center so halves stay balanced and prefer Numbered Bags mode.
  const heavySpanning = spanningIndices.length > Math.max(20, Math.floor(active.length * 0.35));
  const joinIndices: number[] = [];

  if (heavySpanning) {
    for (const idx of spanningIndices) {
      const c = projCenter.get(idx)!;
      let segIdx = 0;
      while (segIdx < cutPositions.length && c >= cutPositions[segIdx]) segIdx++;
      rawSegments[segIdx].push(idx);
    }
  } else {
    joinIndices.push(...spanningIndices);
  }

  // Enforce internal connectivity inside each segment: any small detached fragment moves to Join
  const cleanSegments: number[][] = [];
  for (const seg of rawSegments) {
    if (seg.length === 0) continue;
    const comps = getConnectedComponents(seg, adjacency);
    if (comps.length <= 1) {
      cleanSegments.push(seg);
    } else {
      cleanSegments.push(comps[0]);
      for (let ci = 1; ci < comps.length; ci++) {
        if (!heavySpanning && comps[ci].length <= Math.max(8, Math.floor(seg.length * 0.25))) {
          joinIndices.push(...comps[ci]);
        } else {
          cleanSegments[cleanSegments.length - 1].push(...comps[ci]);
        }
      }
    }
  }

  if (cleanSegments.length < 2) return null;

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

  if (joinIndices.length > 0 && outputMode === 'modular_chapters') {
    sections.push({
      id: 'sec_join_center',
      name: cleanSegments.length === 2 ? 'Center Connector & Join' : 'Connect Sections',
      partIndices: joinIndices,
      partIds: joinIndices.map((i) => allParts[i].id),
      role: 'join',
      cutEdgeCount: countCutEdges(joinIndices, adjacency),
      explodeOffset: [0, 0.85, 0],
      previewColor: JOIN_PREVIEW_COLOR,
    });
  }

  const maxSegDiag = Math.max(...cleanSegments.map((s) => computeSectionDiag(s, allParts)), 1);
  const zoomGainEstimate = Math.max(1.1, Math.round((bounds.diag / maxSegDiag) * 10) / 10);

  const aspect = pca.minorSpan > 1 ? pca.majorSpan / pca.minorSpan : 1;
  const spanRatio = spanningIndices.length / active.length;
  let confidence = 72;
  if (aspect >= 2.2) confidence += 14;
  if (aspect >= 3.5) confidence += 6;
  if (spanRatio <= 0.08) confidence += 8;
  else if (spanRatio > 0.25) confidence -= 12;
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
  const rationale = isIdenticalHalves
    ? `Both halves match (${cleanSegments[0].length} pcs each${joinNote}) — build once ×2 at ~${zoomGainEstimate}× larger zoom, then connect.`
    : heavySpanning
      ? `Splits along the ${Math.round(pca.majorSpan / 20)}-stud length into ${cleanSegments.length} balanced stages (tightly interlocked spine).`
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
