import type {
  CanonicalModel,
  InstructionPlan,
  PartInstance,
  ReimportDiffReport,
  StepNode,
  StepOverride,
} from '../types/manual';
import { optimizeCameraSequence } from './cameraOptimizer';
import { buildConnectivityGraph } from './connectivity';
import { vec3Dist } from './math';

/**
 * Smart Model Re-Import Diffing:
 * Matches incoming model parts against existing parts by exact signature and then nearest-neighbor
 * (same partId + colorId within 2.5 LDU), keeping all matched parts in their existing Step IDs
 * and preserving every semantic StepOverride (camera, layout, pin breaks, presentation transforms).
 * Newly added parts are spliced into the earliest physically connected step without scrambling
 * downstream steps or pages!
 */
export function applySmartReimportDiff(
  oldModel: CanonicalModel,
  oldPlan: InstructionPlan,
  oldOverrides: Record<string, StepOverride>,
  incomingModel: CanonicalModel,
): {
  model: CanonicalModel;
  plan: InstructionPlan;
  overrides: Record<string, StepOverride>;
  report: ReimportDiffReport;
} {
  const oldIdToNewId = new Map<string, string>();
  const matchedNewIds = new Set<string>();

  // Pass 1: exact signature match
  const newBySig = new Map<string, PartInstance[]>();
  for (const np of incomingModel.parts) {
    const list = newBySig.get(np.signature) ?? [];
    list.push(np);
    newBySig.set(np.signature, list);
  }

  for (const op of oldModel.parts) {
    const bucket = newBySig.get(op.signature);
    if (bucket && bucket.length > 0) {
      const match = bucket.shift()!;
      oldIdToNewId.set(op.id, match.id);
      matchedNewIds.add(match.id);
    }
  }

  // Pass 2: fuzzy nearest-neighbor match for slightly nudged bricks (same partId & colorId within 2.5 LDU)
  for (const op of oldModel.parts) {
    if (oldIdToNewId.has(op.id)) continue;
    let best: PartInstance | null = null;
    let bestDist = 2.5;
    for (const np of incomingModel.parts) {
      if (matchedNewIds.has(np.id)) continue;
      if (np.partId !== op.partId || np.colorId !== op.colorId) continue;
      const d = vec3Dist(op.position, np.position);
      if (d <= bestDist) {
        bestDist = d;
        best = np;
      }
    }
    if (best) {
      oldIdToNewId.set(op.id, best.id);
      matchedNewIds.add(best.id);
    }
  }

  const addedParts = incomingModel.parts.filter((p) => !matchedNewIds.has(p.id));
  const removedCount = oldModel.parts.length - oldIdToNewId.size;

  // Remap subassemblies & steps using matched IDs
  const newSubassemblies = { ...oldPlan.subassemblies };
  for (const [subId, sub] of Object.entries(oldPlan.subassemblies)) {
    const remappedGroups = sub.instancePartIdGroups
      .map((g) => g.map((id) => oldIdToNewId.get(id)).filter((x): x is string => Boolean(x)))
      .filter((g) => g.length > 0);
    const remappedPrimary = remappedGroups[0] ?? [];
    const remappedSteps = sub.steps
      .map((s) => ({
        ...s,
        partIds: s.partIds.map((id) => oldIdToNewId.get(id)).filter((x): x is string => Boolean(x)),
      }))
      .filter((s) => s.partIds.length > 0);

    if (remappedPrimary.length === 0) {
      delete newSubassemblies[subId];
    } else {
      newSubassemblies[subId] = {
        ...sub,
        partIds: remappedPrimary,
        instancePartIdGroups: remappedGroups,
        repeatCount: remappedGroups.length,
        steps: remappedSteps,
      };
    }
  }

  const newSteps: Record<string, StepNode> = {};
  const newChapters = oldPlan.chapters.map((ch) => ({
    ...ch,
    partIds: ch.partIds.map((id) => oldIdToNewId.get(id)).filter((x): x is string => Boolean(x)),
    subassemblyIds: ch.subassemblyIds.filter((sid) => Boolean(newSubassemblies[sid])),
    stepIds: [...ch.stepIds],
  }));

  const newPartToStep = new Map<string, { chapterId: string; stepId: string }>();

  for (const ch of newChapters) {
    const survivingStepIds: string[] = [];
    for (const sid of ch.stepIds) {
      const oldStep = oldPlan.steps[sid];
      if (!oldStep) continue;
      const remappedPartIds = oldStep.partIds
        .map((id) => oldIdToNewId.get(id))
        .filter((x): x is string => Boolean(x));
      const remappedSubs = oldStep.attachedSubassemblyIds.filter((subId) =>
        Boolean(newSubassemblies[subId]),
      );

      if (remappedPartIds.length === 0 && remappedSubs.length === 0) continue;

      const updated: StepNode = {
        ...oldStep,
        partIds: remappedPartIds,
        attachedSubassemblyIds: remappedSubs,
      };
      newSteps[sid] = updated;
      survivingStepIds.push(sid);
      for (const pid of remappedPartIds) {
        newPartToStep.set(pid, { chapterId: ch.id, stepId: sid });
      }
    }
    ch.stepIds = survivingStepIds;
  }

  // Insert newly added parts into the earliest physically connected step (localized edit!)
  const graph = buildConnectivityGraph(incomingModel.parts);
  const affectedStepIds = new Set<string>();

  for (const added of addedParts) {
    let targetStepId: string | null = null;
    let targetChapterId: string | null = null;

    // Look for already-assigned connected neighbors
    for (const edge of graph.adjacency[added.id] ?? []) {
      const loc = newPartToStep.get(edge.b);
      if (loc) {
        targetStepId = loc.stepId;
        targetChapterId = loc.chapterId;
        break;
      }
    }

    // Fallback: attach to last step of main chapter
    if (!targetStepId) {
      const mainCh = newChapters[newChapters.length - 1];
      if (mainCh && mainCh.stepIds.length > 0) {
        targetChapterId = mainCh.id;
        targetStepId = mainCh.stepIds[mainCh.stepIds.length - 1];
      }
    }

    if (targetStepId && newSteps[targetStepId]) {
      newSteps[targetStepId] = {
        ...newSteps[targetStepId],
        partIds: [...newSteps[targetStepId].partIds, added.id],
      };
      const ch = newChapters.find((c) => c.id === targetChapterId);
      if (ch && !ch.partIds.includes(added.id)) ch.partIds.push(added.id);
      newPartToStep.set(added.id, { chapterId: targetChapterId!, stepId: targetStepId });
      affectedStepIds.add(targetStepId);
    }
  }

  // Remap presentationTransform partIds inside preserved StepOverrides
  const newOverrides: Record<string, StepOverride> = {};
  let preservedOverrideCount = 0;

  for (const [sid, ov] of Object.entries(oldOverrides)) {
    if (!newSteps[sid]) continue;
    const remappedTransforms: StepOverride['presentationTransforms'] = {};
    if (ov.presentationTransforms) {
      for (const [key, transform] of Object.entries(ov.presentationTransforms)) {
        const mappedKey = oldIdToNewId.get(key) ?? (newSubassemblies[key] ? key : null);
        if (mappedKey) remappedTransforms[mappedKey] = transform;
      }
    }
    newOverrides[sid] = {
      ...ov,
      presentationTransforms:
        Object.keys(remappedTransforms).length > 0 ? remappedTransforms : undefined,
    };
    preservedOverrideCount += 1;
  }

  // Renumber steps cleanly & re-run camera optimizer respecting preserved camera overrides
  const partsById: Record<string, PartInstance> = Object.fromEntries(
    incomingModel.parts.map((p) => [p.id, p]),
  );

  for (const ch of newChapters) {
    const ordered = ch.stepIds.map((sid, idx) => ({
      ...newSteps[sid],
      stepNumber: idx + 1,
    }));
    const reOptimized = optimizeCameraSequence(
      ordered,
      partsById,
      newOverrides,
      (subId) => newSubassemblies[subId]?.instancePartIdGroups.flat() ?? [],
    );
    for (const s of reOptimized) {
      newSteps[s.id] = s;
    }
  }

  return {
    model: incomingModel,
    plan: {
      ...oldPlan,
      chapters: newChapters.filter((ch) => ch.stepIds.length > 0),
      steps: newSteps,
      subassemblies: newSubassemblies,
      floatingWarnings: graph.floatingWarnings,
    },
    overrides: newOverrides,
    report: {
      matchedCount: oldIdToNewId.size,
      addedCount: addedParts.length,
      removedCount,
      preservedOverrideCount,
      affectedStepIds: Array.from(affectedStepIds),
    },
  };
}
