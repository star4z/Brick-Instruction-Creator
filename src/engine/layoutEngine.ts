import type {
  BackConfig,
  BomConfig,
  BomEntry,
  CanonicalModel,
  CoverConfig,
  InstructionPlan,
  PageLayoutTemplate,
  PagePlan,
  PageSlot,
  PartInstance,
  StepNode,
  StepOverride,
  ThemeSettings,
} from '../types/manual';

export function buildBomEntries(
  parts: PartInstance[],
  sortMode: BomConfig['sortMode'],
): BomEntry[] {
  const map = new Map<string, BomEntry>();
  for (const p of parts) {
    const key = `${p.partId}::${p.colorId}`;
    const existing = map.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      map.set(key, {
        partId: p.partId,
        partName: p.partName,
        colorId: p.colorId,
        quantity: 1,
      });
    }
  }
  const entries = Array.from(map.values());
  if (sortMode === 'quantity-desc') {
    entries.sort((a, b) => b.quantity - a.quantity || a.partId.localeCompare(b.partId));
  } else if (sortMode === 'part-id') {
    entries.sort((a, b) => a.partId.localeCompare(b.partId) || a.colorId - b.colorId);
  } else {
    // color-part (classic LEGO BOM grouping by color then part)
    entries.sort((a, b) => a.colorId - b.colorId || a.partId.localeCompare(b.partId));
  }
  return entries;
}

export function buildStepPliEntries(
  step: StepNode,
  partsById: Record<string, PartInstance>,
): BomEntry[] {
  const parts = step.partIds.map((id) => partsById[id]).filter(Boolean);
  return buildBomEntries(parts, 'quantity-desc');
}

function layoutCapacity(layout: Exclude<PageLayoutTemplate, 'auto'>): number {
  switch (layout) {
    case '1-up':
      return 1;
    case '2-up':
      return 2;
    case '3-up':
      return 3;
    case '4-up':
      return 4;
  }
}

/**
 * Estimates visual complexity of a step so 'auto' layout never crowds callouts or large PLIs.
 */
function estimateAutoCapacity(
  step: StepNode,
  partsById: Record<string, PartInstance>,
  orientation: ThemeSettings['orientation'],
): Exclude<PageLayoutTemplate, 'auto'> {
  if (step.attachedSubassemblyIds.length > 0) return '1-up';
  const uniqueTypes = new Set(
    step.partIds
      .map((id) => partsById[id])
      .filter(Boolean)
      .map((p) => `${p.partId}:${p.colorId}`),
  ).size;
  if (uniqueTypes >= 5 || step.partIds.length >= 7) return '1-up';
  if (orientation === 'portrait') return '2-up';
  return uniqueTypes <= 2 && step.partIds.length <= 3 ? '2-up' : '2-up';
}

/**
 * Reactive Flow Layout Engine:
 * - Converts chapters & steps into non-overlapping pages (Cover -> Steps -> BOM -> Back)
 * - Binds all overrides & page-break pins to semantic Step IDs (never page indices)
 * - Guarantees that edits before a Pinned Page Break never scramble downstream page groupings
 */
export function buildPagePlans(
  model: CanonicalModel,
  plan: InstructionPlan,
  overrides: Record<string, StepOverride>,
  theme: ThemeSettings,
  cover: CoverConfig,
  back: BackConfig,
  bom: BomConfig,
): PagePlan[] {
  const pages: PagePlan[] = [];
  let pageNumber = 0;

  const partsById: Record<string, PartInstance> = Object.fromEntries(
    model.parts.map((p) => [p.id, p]),
  );

  // 1. Cover Page
  if (cover.enabled) {
    pageNumber += 1;
    pages.push({
      id: 'page_cover',
      pageNumber,
      kind: 'cover',
    });
  }

  // 2. Instruction Pages per Chapter
  for (const chapter of plan.chapters) {
    const stepIds = chapter.stepIds.filter((id) => Boolean(plan.steps[id]));
    let cursor = 0;

    while (cursor < stepIds.length) {
      const firstId = stepIds[cursor];
      const firstStep = plan.steps[firstId];
      const firstOverride = overrides[firstId];

      const chosenLayout: Exclude<PageLayoutTemplate, 'auto'> =
        firstOverride?.pageLayoutOverride ??
        (theme.defaultLayout === 'auto'
          ? estimateAutoCapacity(firstStep, partsById, theme.orientation)
          : theme.defaultLayout);

      const maxSlots = layoutCapacity(chosenLayout);
      const slots: PageSlot[] = [];

      for (let s = 0; s < maxSlots && cursor < stepIds.length; s++) {
        const sid = stepIds[cursor];
        const step = plan.steps[sid];
        const ov = overrides[sid];

        // Honor semantic Pin Page Break boundary (never pull a pinned step onto an earlier page)
        if (s > 0 && ov?.pinPageBreakBefore) break;
        // Also respect explicit pageLayoutOverride starting a fresh page
        if (s > 0 && ov?.pageLayoutOverride) break;
        // Never crowd a subassembly callout step onto a multi-step page unless explicitly overridden
        if (s > 0 && step.attachedSubassemblyIds.length > 0 && !firstOverride?.pageLayoutOverride) {
          break;
        }

        slots.push({
          stepId: sid,
          chapterId: chapter.id,
          subassemblyIds: step.attachedSubassemblyIds,
        });
        cursor += 1;

        // If this step itself contains a subassembly callout and layout is auto, give it full page focus
        if (step.attachedSubassemblyIds.length > 0 && theme.defaultLayout === 'auto' && !firstOverride?.pageLayoutOverride) {
          break;
        }
      }

      const effectiveLayout: Exclude<PageLayoutTemplate, 'auto'> =
        slots.length === 1
          ? '1-up'
          : slots.length === 2
            ? '2-up'
            : slots.length === 3
              ? '3-up'
              : '4-up';

      pageNumber += 1;
      pages.push({
        id: `page_${firstId}`,
        pageNumber,
        kind: 'steps',
        chapterId: chapter.id,
        chapterName: chapter.name,
        layout: effectiveLayout,
        slots,
        pinnedStart: Boolean(firstOverride?.pinPageBreakBefore),
      });
    }
  }

  // 3. Bill of Materials (BOM) Roll-Up Pages
  if (bom.enabled && model.parts.length > 0) {
    const allBom = buildBomEntries(model.parts, bom.sortMode);
    const rowsPerPage = theme.orientation === 'landscape' ? 4 : 6;
    const perPage = Math.max(8, bom.columns * rowsPerPage);
    const totalBomPages = Math.max(1, Math.ceil(allBom.length / perPage));

    for (let i = 0; i < totalBomPages; i++) {
      pageNumber += 1;
      pages.push({
        id: `page_bom_${i + 1}`,
        pageNumber,
        kind: 'bom',
        bomEntries: allBom.slice(i * perPage, (i + 1) * perPage),
        bomPageIndex: i + 1,
        bomTotalPages: totalBomPages,
      });
    }
  }

  // 4. Back Page
  if (back.enabled) {
    pageNumber += 1;
    pages.push({
      id: 'page_back',
      pageNumber,
      kind: 'back',
    });
  }

  return pages;
}

/**
 * Returns the cumulative set of partIds placed BEFORE `targetStepId`, and the NEW partIds
 * placed IN `targetStepId` (including attached subassemblies) within the same chapter.
 */
export function getStepRenderPartSets(
  plan: InstructionPlan,
  chapterId: string,
  targetStepId: string,
): { previousPartIds: string[]; newPartIds: string[] } {
  const chapter = plan.chapters.find((c) => c.id === chapterId);
  if (!chapter) return { previousPartIds: [], newPartIds: [] };

  const previousPartIds: string[] = [];
  const newPartIds: string[] = [];

  for (const sid of chapter.stepIds) {
    const step = plan.steps[sid];
    if (!step) continue;

    const stepAllParts: string[] = [...step.partIds];
    for (const subId of step.attachedSubassemblyIds) {
      const sub = plan.subassemblies[subId];
      if (sub) {
        stepAllParts.push(...sub.instancePartIdGroups.flat());
      }
    }

    if (sid === targetStepId) {
      newPartIds.push(...stepAllParts);
      break;
    }
    previousPartIds.push(...stepAllParts);
  }

  return { previousPartIds, newPartIds };
}
