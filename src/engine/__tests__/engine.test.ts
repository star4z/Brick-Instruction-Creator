import { describe, expect, it } from 'vitest';
import { DEMO_MODELS } from '../../data/demoModels';
import { THEME_PRESETS } from '../../data/themePresets';
import type { BackConfig, BomConfig, CoverConfig, StepOverride } from '../../types/manual';
import { buildConnectivityGraph } from '../connectivity';
import { buildPagePlans } from '../layoutEngine';
import { parseLDrawSource } from '../ldrawParser';
import { applySmartReimportDiff } from '../reimportDiff';
import { splitStep } from '../stepEditing';
import { generateInstructionPlan } from '../stepGenerator';

const DEFAULT_THEME = THEME_PRESETS['classic-lego-blue'].settings;
const DEFAULT_COVER: CoverConfig = {
  enabled: true,
  title: 'Test Manual',
  subtitle: 'Subtitle',
  author: 'Tester',
  setNumber: 'T-001',
  showPieceCount: true,
  showStepCount: true,
  heroView: 'top_front_right',
};
const DEFAULT_BACK: BackConfig = {
  enabled: true,
  headline: 'Done!',
  footerNote: 'Footer',
  showCompletionRender: true,
  showStatsSummary: true,
};
const DEFAULT_BOM: BomConfig = {
  enabled: true,
  title: 'Parts Inventory',
  sortMode: 'color-part',
  columns: 5,
};

describe('Brick Instruction Creator Core Engine Invariants', () => {
  it('connects all bricks, SNOT side studs, bars & clips with zero floating warnings across all demo models', () => {
    for (const demo of DEMO_MODELS) {
      const model = parseLDrawSource(demo.ldrawSource, `${demo.id}.ldr`, 'demo');
      const graph = buildConnectivityGraph(model.parts);
      expect(graph.floatingWarnings, `Floating parts found in ${demo.id}`).toHaveLength(0);

      const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});
      expect(plan.chapters.length).toBeGreaterThan(0);

      // Verify zero-floating topological placement order in every chapter
      for (const ch of plan.chapters) {
        const placed = new Set<string>();
        for (let i = 0; i < ch.stepIds.length; i++) {
          const step = plan.steps[ch.stepIds[i]];
          const stepAdded: string[] = [
            ...step.partIds,
            ...step.attachedSubassemblyIds.flatMap(
              (subId) => plan.subassemblies[subId]?.instancePartIdGroups.flat() ?? [],
            ),
          ];
          if (i > 0 && stepAdded.length > 0) {
            // Every step after step 1 must physically attach to at least one previously placed part
            const hasPhysicalAnchor = stepAdded.some((pid) =>
              (graph.adjacency[pid] ?? []).some((e) => placed.has(e.b)),
            );
            expect(
              hasPhysicalAnchor,
              `Step ${step.stepNumber} in ${demo.id}/${ch.name} had no anchor to prior steps`,
            ).toBe(true);
          }
          stepAdded.forEach((id) => placed.add(id));
        }
      }
    }
  });

  it('auto-detects 2x SNOT wing+bar/clip subassemblies and separate minifigure chapter in Starfighter', () => {
    const starfighter = DEMO_MODELS.find((d) => d.id === 'vanguard-starfighter')!;
    const model = parseLDrawSource(starfighter.ldrawSource, 'starfighter.ldr', 'demo');
    const graph = buildConnectivityGraph(model.parts);
    const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});

    // 2 chapters: Pilot Minifigure first, Starfighter second
    expect(plan.chapters).toHaveLength(2);
    expect(plan.chapters[0].kind).toBe('minifigure');
    expect(plan.chapters[1].kind).toBe('main');

    // Collapsed 2x SNOT wing pod subassembly with build-vs-attach rotation cue
    const subs = Object.values(plan.subassemblies);
    const wingSub = subs.find((s) => s.repeatCount === 2);
    expect(wingSub).toBeDefined();
    expect(wingSub!.requiresAttachRotation).toBe(true);
    expect(wingSub!.partIds.length).toBe(5);
  });

  it('auto-detects 4x repeated SNOT wheel pods in Mars Exploration Rover', () => {
    const rover = DEMO_MODELS.find((d) => d.id === 'mars-rover')!;
    const model = parseLDrawSource(rover.ldrawSource, 'rover.ldr', 'demo');
    const graph = buildConnectivityGraph(model.parts);
    const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});

    const subs = Object.values(plan.subassemblies);
    const wheelSub = subs.find((s) => s.repeatCount === 4);
    expect(wheelSub).toBeDefined();
    expect(wheelSub!.requiresAttachRotation).toBe(true);
  });

  it('keeps downstream pages and semantic overrides untouched when editing early steps before a Pin Page Break', () => {
    const cottage = DEMO_MODELS.find((d) => d.id === 'alpine-cottage')!;
    const model = parseLDrawSource(cottage.ldrawSource, 'cottage.ldr', 'demo');
    const graph = buildConnectivityGraph(model.parts);
    const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});

    const stepIds = plan.chapters[0].stepIds;
    expect(stepIds.length).toBeGreaterThanOrEqual(4);

    // Pin page break at step index 3 and assign custom overrides on steps 3..end
    const pinStepId = stepIds[3];
    const overrides: Record<string, StepOverride> = {
      [pinStepId]: {
        pinPageBreakBefore: true,
        pageLayoutOverride: '2-up',
        cameraViewOverride: 'top_back_left',
      },
    };

    const pagesBefore = buildPagePlans(
      model,
      plan,
      overrides,
      DEFAULT_THEME,
      DEFAULT_COVER,
      DEFAULT_BACK,
      DEFAULT_BOM,
    );
    const pinnedIdxBefore = pagesBefore.findIndex((p) =>
      p.slots?.some((s) => s.stepId === pinStepId),
    );
    expect(pinnedIdxBefore).toBeGreaterThan(0);

    const downstreamSignaturesBefore = pagesBefore
      .slice(pinnedIdxBefore)
      .filter((p) => p.kind === 'steps')
      .map((p) => `${p.layout}:${p.slots!.map((s) => s.stepId).join(',')}`);

    // Now split an earlier step BEFORE the pin!
    const splittableEarlyStep = stepIds.slice(0, 3).find((id) => plan.steps[id].partIds.length >= 2);
    expect(splittableEarlyStep).toBeDefined();
    const { plan: editedPlan } = splitStep(plan, model, overrides, splittableEarlyStep!);

    const pagesAfter = buildPagePlans(
      model,
      editedPlan,
      overrides,
      DEFAULT_THEME,
      DEFAULT_COVER,
      DEFAULT_BACK,
      DEFAULT_BOM,
    );
    const pinnedIdxAfter = pagesAfter.findIndex((p) =>
      p.slots?.some((s) => s.stepId === pinStepId),
    );

    const downstreamSignaturesAfter = pagesAfter
      .slice(pinnedIdxAfter)
      .filter((p) => p.kind === 'steps')
      .map((p) => `${p.layout}:${p.slots!.map((s) => s.stepId).join(',')}`);

    // Downstream page layouts and step groupings after the Pin are 100% IDENTICAL!
    expect(downstreamSignaturesAfter).toEqual(downstreamSignaturesBefore);
    // Semantic override on pinned step is intact
    expect(overrides[pinStepId].cameraViewOverride).toBe('top_back_left');
  });

  it('preserves semantic Step IDs and overrides on Smart Re-Import Diff when adding a piece early', () => {
    const cottage = DEMO_MODELS.find((d) => d.id === 'alpine-cottage')!;
    const modelA = parseLDrawSource(cottage.ldrawSource, 'cottage.ldr', 'demo');
    const graphA = buildConnectivityGraph(modelA.parts);
    const planA = generateInstructionPlan(modelA, graphA, 'standard', 'regenerate_all', {});

    const lastStepId = planA.chapters[0].stepIds[planA.chapters[0].stepIds.length - 1];
    const overrides: Record<string, StepOverride> = {
      [lastStepId]: {
        cameraViewOverride: 'top_back_right',
        pinPageBreakBefore: true,
        zoomScale: 1.25,
      },
    };

    // Add a brand-new 1x2 tile on the front baseplate (y_yup = 8 -> y_ldr = -8)
    const modifiedSource = `${cottage.ldrawSource}\n1 14 40 -8 40 1 0 0 0 1 0 0 0 1 3069b.dat\n`;
    const modelB = parseLDrawSource(modifiedSource, 'cottage_v2.ldr', 'ldr');

    const diffed = applySmartReimportDiff(modelA, planA, overrides, modelB);

    expect(diffed.report.matchedCount).toBe(modelA.parts.length);
    expect(diffed.report.addedCount).toBe(1);
    expect(diffed.report.removedCount).toBe(0);
    expect(diffed.report.preservedOverrideCount).toBe(1);
    expect(diffed.overrides[lastStepId]).toEqual(overrides[lastStepId]);
    expect(diffed.plan.steps[lastStepId].cameraView).toBe('top_back_right');
  });

  it('detects existing STEP markers and MPD submodels to trigger the Import Dialog', () => {
    const mpd = `0 FILE main.ldr
1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat
0 STEP
1 16 0 -24 0 1 0 0 0 1 0 0 0 1 sub.ldr
0 FILE sub.ldr
1 14 0 0 0 1 0 0 0 1 0 0 0 1 3022.dat
1 15 0 -8 0 1 0 0 0 1 0 0 0 1 3022.dat
`;
    const model = parseLDrawSource(mpd, 'test.mpd', 'mpd');
    expect(model.hasExistingSteps).toBe(true);
    expect(model.hasExistingSubmodels).toBe(true);
    expect(model.explicitSubmodels).toHaveLength(1);
    expect(model.parts).toHaveLength(3);
  });
});
