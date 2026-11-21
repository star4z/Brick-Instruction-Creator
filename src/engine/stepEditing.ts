import type {
  CanonicalModel,
  InstructionPlan,
  PartInstance,
  StepNode,
  StepOverride,
} from '../types/manual';
import { optimizeCameraSequence } from './cameraOptimizer';

function reoptimizeChapter(
  plan: InstructionPlan,
  model: CanonicalModel,
  overrides: Record<string, StepOverride>,
  chapterId: string,
): InstructionPlan {
  const chapter = plan.chapters.find((c) => c.id === chapterId);
  if (!chapter) return plan;

  const partsById: Record<string, PartInstance> = Object.fromEntries(
    model.parts.map((p) => [p.id, p]),
  );
  const rawSteps = chapter.stepIds
    .map((id) => plan.steps[id])
    .filter(Boolean)
    .map((s, idx) => ({ ...s, stepNumber: idx + 1 }));

  const optimized = optimizeCameraSequence(
    rawSteps,
    partsById,
    overrides,
    (subId) => plan.subassemblies[subId]?.instancePartIdGroups.flat() ?? [],
  );

  const nextSteps = { ...plan.steps };
  for (const s of optimized) {
    nextSteps[s.id] = s;
  }

  return {
    ...plan,
    steps: nextSteps,
  };
}

/**
 * Splits a step in half (or at an explicit list of partIds) into two consecutive steps,
 * preserving semantic IDs of all other steps so downstream pages & overrides remain untouched.
 */
export function splitStep(
  plan: InstructionPlan,
  model: CanonicalModel,
  overrides: Record<string, StepOverride>,
  stepId: string,
  movePartIds?: string[],
): { plan: InstructionPlan; newStepId: string | null } {
  const step = plan.steps[stepId];
  if (!step || step.partIds.length < 2) return { plan, newStepId: null };

  const toMove =
    movePartIds && movePartIds.length > 0 && movePartIds.length < step.partIds.length
      ? new Set(movePartIds)
      : new Set(step.partIds.slice(Math.ceil(step.partIds.length / 2)));

  const keepIds = step.partIds.filter((id) => !toMove.has(id));
  const movedIds = step.partIds.filter((id) => toMove.has(id));
  if (keepIds.length === 0 || movedIds.length === 0) return { plan, newStepId: null };

  const newStepId = `${step.chapterId}_step_split_${Date.now().toString(36)}`;
  const newStep: StepNode = {
    id: newStepId,
    chapterId: step.chapterId,
    stepNumber: step.stepNumber + 1,
    partIds: movedIds,
    attachedSubassemblyIds: [],
    cameraView: step.cameraView,
    rotationCue: 'none',
    insertionDirection: step.insertionDirection,
  };

  const nextSteps: Record<string, StepNode> = {
    ...plan.steps,
    [stepId]: { ...step, partIds: keepIds },
    [newStepId]: newStep,
  };

  const nextChapters = plan.chapters.map((ch) => {
    if (ch.id !== step.chapterId) return ch;
    const idx = ch.stepIds.indexOf(stepId);
    const nextIds = [...ch.stepIds];
    nextIds.splice(idx + 1, 0, newStepId);
    return { ...ch, stepIds: nextIds };
  });

  const updated = reoptimizeChapter(
    { ...plan, chapters: nextChapters, steps: nextSteps },
    model,
    overrides,
    step.chapterId,
  );
  return { plan: updated, newStepId };
}

/**
 * Merges `stepId` with the immediately following step in the same chapter.
 */
export function mergeStepWithNext(
  plan: InstructionPlan,
  model: CanonicalModel,
  overrides: Record<string, StepOverride>,
  stepId: string,
): InstructionPlan {
  const step = plan.steps[stepId];
  if (!step) return plan;
  const chapter = plan.chapters.find((c) => c.id === step.chapterId);
  if (!chapter) return plan;

  const idx = chapter.stepIds.indexOf(stepId);
  if (idx < 0 || idx >= chapter.stepIds.length - 1) return plan;

  const nextId = chapter.stepIds[idx + 1];
  const nextStep = plan.steps[nextId];
  if (!nextStep) return plan;

  const merged: StepNode = {
    ...step,
    partIds: [...step.partIds, ...nextStep.partIds],
    attachedSubassemblyIds: [...step.attachedSubassemblyIds, ...nextStep.attachedSubassemblyIds],
  };

  const nextSteps = { ...plan.steps, [stepId]: merged };
  delete nextSteps[nextId];

  const nextChapters = plan.chapters.map((ch) =>
    ch.id === chapter.id
      ? { ...ch, stepIds: ch.stepIds.filter((id) => id !== nextId) }
      : ch,
  );

  return reoptimizeChapter(
    { ...plan, chapters: nextChapters, steps: nextSteps },
    model,
    overrides,
    chapter.id,
  );
}

/**
 * Moves a single part instance from `fromStepId` into `toStepId` (non-destructive).
 */
export function movePartBetweenSteps(
  plan: InstructionPlan,
  model: CanonicalModel,
  overrides: Record<string, StepOverride>,
  partId: string,
  fromStepId: string,
  toStepId: string,
): InstructionPlan {
  if (fromStepId === toStepId) return plan;
  const from = plan.steps[fromStepId];
  const to = plan.steps[toStepId];
  if (!from || !to || !from.partIds.includes(partId)) return plan;

  const nextFromParts = from.partIds.filter((id) => id !== partId);
  const nextSteps: Record<string, StepNode> = {
    ...plan.steps,
    [toStepId]: { ...to, partIds: [...to.partIds, partId] },
  };

  let nextChapters = plan.chapters;
  if (nextFromParts.length === 0 && from.attachedSubassemblyIds.length === 0) {
    delete nextSteps[fromStepId];
    nextChapters = plan.chapters.map((ch) =>
      ch.id === from.chapterId
        ? { ...ch, stepIds: ch.stepIds.filter((id) => id !== fromStepId) }
        : ch,
    );
  } else {
    nextSteps[fromStepId] = { ...from, partIds: nextFromParts };
  }

  return reoptimizeChapter(
    { ...plan, chapters: nextChapters, steps: nextSteps },
    model,
    overrides,
    to.chapterId,
  );
}

/**
 * Moves a step earlier or later by 1 slot inside its chapter.
 */
export function reorderStep(
  plan: InstructionPlan,
  model: CanonicalModel,
  overrides: Record<string, StepOverride>,
  stepId: string,
  direction: 'up' | 'down',
): InstructionPlan {
  const step = plan.steps[stepId];
  if (!step) return plan;
  const chapter = plan.chapters.find((c) => c.id === step.chapterId);
  if (!chapter) return plan;

  const idx = chapter.stepIds.indexOf(stepId);
  const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= chapter.stepIds.length) return plan;

  const nextIds = [...chapter.stepIds];
  [nextIds[idx], nextIds[swapIdx]] = [nextIds[swapIdx], nextIds[idx]];

  const nextChapters = plan.chapters.map((ch) =>
    ch.id === chapter.id ? { ...ch, stepIds: nextIds } : ch,
  );

  return reoptimizeChapter(
    { ...plan, chapters: nextChapters },
    model,
    overrides,
    chapter.id,
  );
}
