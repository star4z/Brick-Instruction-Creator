import { resolvePartDefinition } from '../data/partCatalog';
import type {
  BuildChapter,
  CanonicalModel,
  ConnectivityGraph,
  ImportMode,
  InstructionPlan,
  Mat3,
  PacingPreset,
  PartInstance,
  StepNode,
  StepOverride,
  SubassemblyNode,
  Vec3,
} from '../types/manual';
import {
  CANONICAL_VIEWS,
  optimizeCameraSequence,
  scoreStepVisibility,
} from './cameraOptimizer';
import { computePartWorldAabb } from './connectivity';
import {
  IDENTITY_MAT3,
  mat3AlignVectors,
  mat3MulVec,
  transformNormal,
  vec3Add,
  vec3Dot,
  vec3Normalize,
  vec3Sub,
} from './math';

interface PacingLimits {
  minParts: number;
  maxParts: number;
  maxUniqueTypes: number;
}

const PACING_CONFIG: Record<PacingPreset, PacingLimits> = {
  kids: { minParts: 1, maxParts: 3, maxUniqueTypes: 2 },
  standard: { minParts: 2, maxParts: 6, maxUniqueTypes: 4 },
  adult: { minParts: 4, maxParts: 11, maxUniqueTypes: 7 },
};

function isMinifigPart(partId: string): boolean {
  const def = resolvePartDefinition(partId);
  return def.category === 'Minifigure';
}

function getLocalUp(part: PartInstance): Vec3 {
  return transformNormal(part.rotation, [0, 1, 0]);
}

function isSnotOriented(part: PartInstance): boolean {
  const up = getLocalUp(part);
  // Standard upright or upside-down bricks have |up.y| close to 1; SNOT pieces are rotated sideways
  return Math.abs(up[1]) < 0.68;
}

/**
 * Computes a translation- & orientation-invariant structural signature for a cluster of parts
 * so identical repeated subassemblies (e.g., 2x Wings or 4x Wheel Pods) are detected reliably.
 */
function computeClusterIsomorphismKey(
  partIds: string[],
  partsById: Record<string, PartInstance>,
): string {
  const parts = partIds.map((id) => partsById[id]).filter(Boolean);
  const counts = new Map<string, number>();
  for (const p of parts) {
    const k = `${p.partId}:${p.colorId}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const partBag = Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, c]) => `${k}x${c}`)
    .join(',');

  // Pairwise quantized distance multiset verifies identical geometry regardless of mirror/rotation
  const dists: number[] = [];
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      const d = Math.hypot(
        parts[i].position[0] - parts[j].position[0],
        parts[i].position[1] - parts[j].position[1],
        parts[i].position[2] - parts[j].position[2],
      );
      dists.push(Math.round(d / 4) * 4);
    }
  }
  dists.sort((a, b) => a - b);
  return `${partBag}|${dists.slice(0, 12).join('-')}`;
}

interface RawSubCluster {
  partIds: string[];
  kind: SubassemblyNode['kind'];
  anchorMainPartId: string;
  attachNormal: Vec3;
  dominantUp: Vec3;
  explicitName?: string;
}

/**
 * Extracts multi-directional (SNOT) and cantilevered bar/clip subassembly clusters within a chapter.
 */
function detectSubassemblies(
  componentIds: string[],
  partsById: Record<string, PartInstance>,
  graph: ConnectivityGraph,
  model: CanonicalModel,
  importMode: ImportMode,
): { mainPartIds: string[]; clusters: RawSubCluster[] } {
  const compSet = new Set(componentIds);
  const claimed = new Set<string>();
  const clusters: RawSubCluster[] = [];

  // 1. Respect explicit MPD/Studio submodels when requested
  if (importMode !== 'regenerate_all' && model.explicitSubmodels.length > 0) {
    for (const sub of model.explicitSubmodels) {
      const subIds = sub.partIds.filter((id) => compSet.has(id) && !claimed.has(id));
      if (subIds.length < 2 || subIds.length >= componentIds.length - 1) continue;
      const subSet = new Set(subIds);
      let anchorMain = '';
      let attachNormal: Vec3 = [0, 1, 0];
      for (const pid of subIds) {
        for (const e of graph.adjacency[pid] ?? []) {
          if (compSet.has(e.b) && !subSet.has(e.b)) {
            anchorMain = e.b;
            attachNormal = vec3Normalize([-e.direction[0], -e.direction[1], -e.direction[2]]);
            break;
          }
        }
        if (anchorMain) break;
      }
      if (!anchorMain) continue;
      subIds.forEach((id) => claimed.add(id));
      const dominantUp = getLocalUp(partsById[subIds[0]]);
      clusters.push({
        partIds: subIds,
        kind: 'explicit',
        anchorMainPartId: anchorMain,
        attachNormal,
        dominantUp,
        explicitName: sub.name.replace(/\.(ldr|mpd)$/i, ''),
      });
    }
  }

  // 2. Auto-detect SNOT clusters (sideways bricks/plates + attached bars/clips)
  const snotSeeds = componentIds.filter((id) => {
    if (claimed.has(id)) return false;
    const p = partsById[id];
    const def = resolvePartDefinition(p.partId);
    // Bars alone oriented horizontally/vertically are grouped with their SNOT parent
    if (def.shape === 'bar') return false;
    return isSnotOriented(p);
  });

  const visitedSnot = new Set<string>();
  for (const seedId of snotSeeds) {
    if (visitedSnot.has(seedId) || claimed.has(seedId)) continue;

    // Flood-fill contiguous SNOT parts and their attached bars/clips
    const cluster: string[] = [];
    const queue = [seedId];
    visitedSnot.add(seedId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      cluster.push(curr);

      for (const edge of graph.adjacency[curr] ?? []) {
        const nb = edge.b;
        if (!compSet.has(nb) || visitedSnot.has(nb) || claimed.has(nb)) continue;
        const nbPart = partsById[nb];
        const nbDef = resolvePartDefinition(nbPart.partId);
        // Pull in connected SNOT parts OR bars/rods attached to this SNOT cluster
        const nbIsBarOnCluster =
          nbDef.shape === 'bar' &&
          (graph.adjacency[nb] ?? []).every((e2) => e2.b === curr || isSnotOriented(partsById[e2.b]));

        if (isSnotOriented(nbPart) || nbIsBarOnCluster) {
          visitedSnot.add(nb);
          queue.push(nb);
        }
      }
    }

    if (cluster.length >= 2 && cluster.length < componentIds.length - 1) {
      const clusterSet = new Set(cluster);
      let anchorMain = '';
      let attachNormal: Vec3 = [1, 0, 0];

      for (const pid of cluster) {
        for (const edge of graph.adjacency[pid] ?? []) {
          if (compSet.has(edge.b) && !clusterSet.has(edge.b)) {
            anchorMain = edge.b;
            attachNormal = vec3Normalize([-edge.direction[0], -edge.direction[1], -edge.direction[2]]);
            break;
          }
        }
        if (anchorMain) break;
      }

      if (anchorMain) {
        cluster.forEach((id) => claimed.add(id));
        const dominantUp = getLocalUp(partsById[cluster[0]]);
        clusters.push({
          partIds: cluster,
          kind: 'snot',
          anchorMainPartId: anchorMain,
          attachNormal,
          dominantUp,
        });
      }
    }
  }

  const mainPartIds = componentIds.filter((id) => !claimed.has(id));
  return { mainPartIds, clusters };
}

/**
 * Generates a strict zero-floating topological sequence of steps for a connected set of parts,
 * using a specified `upAxis` (so subassemblies are built bottom-up in their own natural frame!).
 */
function generateTopologicalSteps(
  partIds: string[],
  partsById: Record<string, PartInstance>,
  graph: ConnectivityGraph,
  pacing: PacingPreset,
  chapterId: string,
  idPrefix: string,
  upAxis: Vec3 = [0, 1, 0],
  subassemblyId?: string,
  subassemblyAttachMap?: Map<string, string[]>,
): StepNode[] {
  if (partIds.length === 0) return [];

  const limits = PACING_CONFIG[pacing];
  const allowedSet = new Set(partIds);

  // Project each part's center and lowest corner along upAxis
  const heightOf = new Map<string, number>();
  const centerOf = new Map<string, Vec3>();
  let minHeight = Infinity;

  for (const id of partIds) {
    const aabb = computePartWorldAabb(partsById[id]);
    centerOf.set(id, aabb.center);
    // Support height along upAxis
    const proj = vec3Dot(aabb.center, upAxis);
    const lowProj =
      upAxis[1] > 0.8
        ? aabb.min[1]
        : proj - Math.hypot(aabb.max[0] - aabb.min[0], aabb.max[1] - aabb.min[1], aabb.max[2] - aabb.min[2]) * 0.25;
    heightOf.set(id, lowProj);
    if (lowProj < minHeight) minHeight = lowProj;
  }

  const placed = new Set<string>();
  const remaining = new Set<string>(partIds);
  const steps: StepNode[] = [];
  const placedSubassemblies = new Set<string>();

  // Helper: check if candidate part is physically connected to at least one placed part
  const isConnectedToPlaced = (id: string): boolean => {
    for (const edge of graph.adjacency[id] ?? []) {
      if (placed.has(edge.b)) return true;
    }
    return false;
  };

  let stepIdx = 0;

  while (remaining.size > 0) {
    stepIdx += 1;
    const stepParts: string[] = [];
    const stepTypes = new Set<string>();

    // Determine eligible frontier:
    // On Step 1 (nothing placed yet), pick the lowest-height base part(s) so foundation is grounded.
    // On Steps 2+, ONLY parts physically connected to already-placed parts are eligible (ZERO FLOATING!).
    const pickCandidates = (): string[] => {
      if (placed.size === 0) {
        // Seed with lowest base layer parts
        const sorted = Array.from(remaining).sort((a, b) => (heightOf.get(a)! - heightOf.get(b)!));
        const baseY = heightOf.get(sorted[0])!;
        return sorted.filter((id) => heightOf.get(id)! <= baseY + 10);
      }
      const connected = Array.from(remaining).filter((id) => isConnectedToPlaced(id));
      if (connected.length > 0) return connected;
      // Fallback only if subset had disconnected internal islands
      return Array.from(remaining).sort((a, b) => (heightOf.get(a)! - heightOf.get(b)!));
    };

    const initialFrontier = pickCandidates();
    if (initialFrontier.length === 0) break;

    // Sort frontier by height layer, then distance to center (core-outward), then partId for grouping
    initialFrontier.sort((a, b) => {
      const ha = Math.round(heightOf.get(a)! / 8) * 8;
      const hb = Math.round(heightOf.get(b)! / 8) * 8;
      if (ha !== hb) return ha - hb;
      const pa = partsById[a];
      const pb = partsById[b];
      if (pa.partId !== pb.partId) return pa.partId.localeCompare(pb.partId);
      return pa.colorId - pb.colorId;
    });

    const anchorId = initialFrontier[0];
    const anchorHeight = heightOf.get(anchorId)!;
    const anchorPart = partsById[anchorId];

    // Add anchor part
    stepParts.push(anchorId);
    stepTypes.add(`${anchorPart.partId}:${anchorPart.colorId}`);
    remaining.delete(anchorId);
    placed.add(anchorId);

    // Greedily add compatible frontier parts up to pacing limit while checking visibility
    while (stepParts.length < limits.maxParts && remaining.size > 0) {
      const candidates = Array.from(remaining).filter((id) => {
        // Must connect to something placed BEFORE this step OR to a part already in this step (when on base)
        const connectsToPrior = (graph.adjacency[id] ?? []).some((e) => placed.has(e.b));
        if (!connectsToPrior) return false;
        // Keep within same build layer band
        const dh = Math.abs(heightOf.get(id)! - anchorHeight);
        return dh <= (pacing === 'adult' ? 28 : 16);
      });

      if (candidates.length === 0) break;

      // Score candidates: reward identical part+color (symmetric pairs!), same height, and high connectivity
      candidates.sort((a, b) => {
        const pa = partsById[a];
        const pb = partsById[b];
        const score = (id: string, p: PartInstance): number => {
          let s = 0;
          if (stepTypes.has(`${p.partId}:${p.colorId}`)) s += 50;
          if (p.partId === anchorPart.partId) s += 30;
          // Bilateral symmetry bonus (mirrored X or Z around 0)
          const ca = centerOf.get(anchorId)!;
          const cp = centerOf.get(id)!;
          if (Math.abs(ca[0] + cp[0]) < 4 && Math.abs(ca[2] - cp[2]) < 4) s += 45;
          if (Math.abs(ca[2] + cp[2]) < 4 && Math.abs(ca[0] - cp[0]) < 4) s += 35;
          s -= Math.abs(heightOf.get(id)! - anchorHeight) * 1.2;
          return s;
        };
        return score(b, pb) - score(a, pa);
      });

      let added = false;
      for (const candId of candidates) {
        const candPart = partsById[candId];
        const typeKey = `${candPart.partId}:${candPart.colorId}`;
        if (!stepTypes.has(typeKey) && stepTypes.size >= limits.maxUniqueTypes) continue;

        // Visibility Guard: ensure at least one canonical viewpoint sees all parts in this step clearly
        const trialParts = [...stepParts, candId].map((id) => partsById[id]);
        const prevParts = Array.from(placed)
          .filter((id) => !stepParts.includes(id))
          .map((id) => partsById[id]);
        const bestVis = Math.max(
          ...CANONICAL_VIEWS.map((v) => scoreStepVisibility(trialParts, prevParts, upAxis, v)),
        );
        if (bestVis < 0.54 && stepParts.length >= limits.minParts) {
          continue;
        }

        stepParts.push(candId);
        stepTypes.add(typeKey);
        remaining.delete(candId);
        placed.add(candId);
        added = true;
        break;
      }

      if (!added) break;
    }

    // Compute dominant insertion direction from connectivity edges into previously placed parts
    let dirSum: Vec3 = [0, 0, 0];
    let dirCount = 0;
    for (const pid of stepParts) {
      for (const e of graph.adjacency[pid] ?? []) {
        if (placed.has(e.b) && !stepParts.includes(e.b) && allowedSet.has(e.b)) {
          // Direction FROM anchor TO new part
          dirSum = vec3Add(dirSum, [-e.direction[0], -e.direction[1], -e.direction[2]]);
          dirCount += 1;
        }
      }
    }
    const insertionDirection: Vec3 =
      dirCount > 0 ? vec3Normalize(dirSum) : vec3Normalize(upAxis);

    steps.push({
      id: `${idPrefix}_step_${stepIdx}`,
      chapterId,
      subassemblyId,
      stepNumber: stepIdx,
      partIds: stepParts,
      attachedSubassemblyIds: [],
      cameraView: 'top_front_right',
      rotationCue: 'none',
      insertionDirection,
    });

    // Check if any subassembly's anchor parts are now all placed -> attach it right after!
    if (subassemblyAttachMap) {
      for (const [subId, anchorIds] of subassemblyAttachMap.entries()) {
        if (placedSubassemblies.has(subId)) continue;
        if (anchorIds.every((aid) => placed.has(aid))) {
          placedSubassemblies.add(subId);
          stepIdx += 1;
          steps.push({
            id: `${idPrefix}_step_${stepIdx}`,
            chapterId,
            stepNumber: stepIdx,
            partIds: [],
            attachedSubassemblyIds: [subId],
            cameraView: 'top_front_right',
            rotationCue: 'none',
            insertionDirection: [1, 0.25, 0],
            note: 'Attach completed subassembly',
          });
        }
      }
    }
  }

  // Attach any remaining subassemblies at the end
  if (subassemblyAttachMap) {
    for (const subId of subassemblyAttachMap.keys()) {
      if (placedSubassemblies.has(subId)) continue;
      placedSubassemblies.add(subId);
      stepIdx += 1;
      steps.push({
        id: `${idPrefix}_step_${stepIdx}`,
        chapterId,
        stepNumber: stepIdx,
        partIds: [],
        attachedSubassemblyIds: [subId],
        cameraView: 'top_front_right',
        rotationCue: 'none',
        insertionDirection: [1, 0.25, 0],
        note: 'Attach completed subassembly',
      });
    }
  }

  return steps;
}

/**
 * Generates steps directly from pre-existing 0 STEP markers in imported files when user chooses 'preserve_steps'.
 */
function generatePreservedSteps(
  partIds: string[],
  partsById: Record<string, PartInstance>,
  chapterId: string,
  idPrefix: string,
): StepNode[] {
  const byIndex = new Map<number, string[]>();
  for (const id of partIds) {
    const idx = partsById[id].originalStepIndex;
    const list = byIndex.get(idx) ?? [];
    list.push(id);
    byIndex.set(idx, list);
  }
  const sortedKeys = Array.from(byIndex.keys()).sort((a, b) => a - b);
  return sortedKeys.map((k, idx) => ({
    id: `${idPrefix}_step_${idx + 1}`,
    chapterId,
    stepNumber: idx + 1,
    partIds: byIndex.get(k)!,
    attachedSubassemblyIds: [],
    cameraView: 'top_front_right',
    rotationCue: 'none',
    insertionDirection: [0, 1, 0],
  }));
}

/**
 * Top-level Instruction Plan Generator:
 * 1. Splits physically disconnected components into ordered Build Chapters
 * 2. Auto-detects SNOT / multi-directional / repeated subassemblies (2x, 4x)
 * 3. Generates zero-floating topological steps with pacing presets
 * 4. Runs global Viterbi DP camera/rotation optimization across every chapter & subassembly
 */
export function generateInstructionPlan(
  model: CanonicalModel,
  graph: ConnectivityGraph,
  pacing: PacingPreset = 'standard',
  importMode: ImportMode = 'preserve_submodels',
  overrides: Record<string, StepOverride> = {},
): InstructionPlan {
  const partsById: Record<string, PartInstance> = Object.fromEntries(
    model.parts.map((p) => [p.id, p]),
  );

  // Order components: Minifigures first, small accessories second, largest main model last
  const sortedComponents = [...graph.components].sort((a, b) => {
    const aMini = a.every((id) => isMinifigPart(partsById[id].partId)) ? 0 : 1;
    const bMini = b.every((id) => isMinifigPart(partsById[id].partId)) ? 0 : 1;
    if (aMini !== bMini) return aMini - bMini;
    return a.length - b.length;
  });

  const chapters: BuildChapter[] = [];
  const allSteps: Record<string, StepNode> = {};
  const allSubassemblies: Record<string, SubassemblyNode> = {};

  let subCounter = 0;

  sortedComponents.forEach((compIds, idx) => {
    const chapterId = `ch_${idx + 1}`;
    const isMini = compIds.every((id) => isMinifigPart(partsById[id].partId));
    const isMain = idx === sortedComponents.length - 1;
    const kind: BuildChapter['kind'] = isMini
      ? 'minifigure'
      : isMain
        ? 'main'
        : 'accessory';

    const chapterName =
      kind === 'minifigure'
        ? 'Minifigure'
        : kind === 'main'
          ? sortedComponents.length > 1
            ? model.name
            : 'Main Build'
          : `Module ${idx + 1}`;

    if (importMode === 'preserve_steps' && model.hasExistingSteps) {
      const rawSteps = generatePreservedSteps(compIds, partsById, chapterId, chapterId);
      const optimized = optimizeCameraSequence(rawSteps, partsById, overrides);
      for (const s of optimized) allSteps[s.id] = s;
      chapters.push({
        id: chapterId,
        name: chapterName,
        kind,
        partIds: compIds,
        stepIds: optimized.map((s) => s.id),
        subassemblyIds: [],
      });
      return;
    }

    // Detect SNOT / explicit subassemblies & collapse repeated identical modules
    const { mainPartIds, clusters } = detectSubassemblies(
      compIds,
      partsById,
      graph,
      model,
      importMode,
    );

    const groupedByIso = new Map<string, RawSubCluster[]>();
    for (const cluster of clusters) {
      const isoKey = computeClusterIsomorphismKey(cluster.partIds, partsById);
      const group = groupedByIso.get(isoKey) ?? [];
      group.push(cluster);
      groupedByIso.set(isoKey, group);
    }

    const chapterSubIds: string[] = [];
    const subAttachAnchorMap = new Map<string, string[]>();

    for (const group of groupedByIso.values()) {
      const primary = group[0];
      const subId = `sub_${++subCounter}`;
      const repeatCount = group.length;

      // Compute buildOrientation that turns primary.dominantUp -> [0, 1, 0] (upright for easy building!)
      const buildOrientation: Mat3 = mat3AlignVectors(primary.dominantUp, [0, 1, 0]);
      const requiresAttachRotation = vec3Dot(primary.dominantUp, [0, 1, 0]) < 0.85;

      // Generate internal steps for canonical subassembly copy, ordered along its natural build up-axis
      const rawSubSteps = generateTopologicalSteps(
        primary.partIds,
        partsById,
        graph,
        pacing,
        chapterId,
        subId,
        primary.dominantUp,
        subId,
      );

      // Build rotated temporary parts in natural upright build frame for optimal callout camera selection
      const rotatedSubParts: Record<string, PartInstance> = {};
      const centroid = primary.partIds.reduce<Vec3>(
        (acc, id) => vec3Add(acc, partsById[id].position),
        [0, 0, 0],
      );
      centroid[0] /= primary.partIds.length;
      centroid[1] /= primary.partIds.length;
      centroid[2] /= primary.partIds.length;

      for (const pid of primary.partIds) {
        const orig = partsById[pid];
        rotatedSubParts[pid] = {
          ...orig,
          position: mat3MulVec(buildOrientation, vec3Sub(orig.position, centroid)),
        };
      }

      const optSubSteps = optimizeCameraSequence(rawSubSteps, rotatedSubParts, overrides);

      const labelPrefix =
        primary.explicitName ??
        (repeatCount > 1
          ? primary.kind === 'snot'
            ? 'Side Pod Assembly'
            : 'Module Assembly'
          : 'SNOT Subassembly');

      const subNode: SubassemblyNode = {
        id: subId,
        name: repeatCount > 1 ? `${labelPrefix} (${repeatCount}×)` : labelPrefix,
        chapterId,
        kind: repeatCount > 1 ? 'repeated' : primary.kind,
        partIds: primary.partIds,
        instancePartIdGroups: group.map((g) => g.partIds),
        repeatCount,
        buildOrientation,
        attachOrientation: [...IDENTITY_MAT3],
        attachDirection: primary.attachNormal,
        requiresAttachRotation,
        steps: optSubSteps,
      };

      allSubassemblies[subId] = subNode;
      chapterSubIds.push(subId);
      subAttachAnchorMap.set(
        subId,
        group.map((g) => g.anchorMainPartId),
      );
    }

    // Generate main chapter steps with zero-floating guarantee
    const rawMainSteps = generateTopologicalSteps(
      mainPartIds,
      partsById,
      graph,
      pacing,
      chapterId,
      chapterId,
      [0, 1, 0],
      undefined,
      subAttachAnchorMap,
    );

    // Run global Viterbi DP camera/rotation optimizer on main steps
    const optMainSteps = optimizeCameraSequence(
      rawMainSteps,
      partsById,
      overrides,
      (subId) => allSubassemblies[subId]?.instancePartIdGroups.flat() ?? [],
    );

    for (const s of optMainSteps) {
      allSteps[s.id] = s;
    }

    chapters.push({
      id: chapterId,
      name: chapterName,
      kind,
      partIds: compIds,
      stepIds: optMainSteps.map((s) => s.id),
      subassemblyIds: chapterSubIds,
    });
  });

  // Assign continuous sequential step numbers across the entire manual (never repeating "Step 1")
  let globalStepNumber = 0;
  for (const ch of chapters) {
    for (const sid of ch.stepIds) {
      if (allSteps[sid]) {
        globalStepNumber += 1;
        allSteps[sid] = { ...allSteps[sid], stepNumber: globalStepNumber };
      }
    }
  }

  return {
    pacing,
    importMode,
    chapters,
    steps: allSteps,
    subassemblies: allSubassemblies,
    floatingWarnings: graph.floatingWarnings,
  };
}
