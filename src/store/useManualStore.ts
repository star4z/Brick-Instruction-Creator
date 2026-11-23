import { create } from 'zustand';
import { DEMO_MODELS } from '../data/demoModels';
import { THEME_PRESETS } from '../data/themePresets';
import { optimizeCameraSequence } from '../engine/cameraOptimizer';
import { buildConnectivityGraph } from '../engine/connectivity';
import { buildPagePlans } from '../engine/layoutEngine';
import { parseLDrawSource, parseModelFile } from '../engine/ldrawParser';
import { partsProvider } from '../engine/partsProvider';
import { applySmartReimportDiff } from '../engine/reimportDiff';
import {
  mergeStepWithNext,
  movePartBetweenSteps,
  reorderStep,
  splitStep,
} from '../engine/stepEditing';
import { generateInstructionPlan } from '../engine/stepGenerator';
import { technicalRenderer } from '../renderer/technicalRenderer';
import { PROJECT_FILE_FORMAT } from '../storage/fileFormats';
import {
  loadAutosaveProject,
  saveAutosaveProject,
} from '../storage/projectStorage';
import type {
  BackConfig,
  BicProjectFile,
  BomConfig,
  CanonicalModel,
  CoverConfig,
  ImportMode,
  InstructionPlan,
  PacingPreset,
  PagePlan,
  PartInstance,
  PresentationTransform,
  ReimportDiffReport,
  StepOverride,
  ThemePresetId,
  ThemeSettings,
} from '../types/manual';

interface HistorySnapshot {
  plan: InstructionPlan;
  overrides: Record<string, StepOverride>;
}

interface ManualState {
  model: CanonicalModel;
  plan: InstructionPlan;
  overrides: Record<string, StepOverride>;
  theme: ThemeSettings;
  cover: CoverConfig;
  back: BackConfig;
  bom: BomConfig;
  pages: PagePlan[];

  currentPageIndex: number;
  selectedStepId: string | null;
  interactive3DStepId: string | null;

  // Pending import dialog (whenever uploaded .io/.mpd has existing steps or submodels)
  pendingImportModel: CanonicalModel | null;
  lastDiffReport: ReimportDiffReport | null;
  statusMessage: string | null;

  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];

  // Actions
  hydrateFromAutosave: () => Promise<void>;
  loadDemoModel: (demoId: string) => void;
  uploadModelFile: (file: File) => Promise<void>;
  confirmPendingImport: (mode: ImportMode) => void;
  cancelPendingImport: () => void;
  reimportModelDiffFile: (file: File) => Promise<void>;
  clearDiffReport: () => void;

  setPacing: (pacing: PacingPreset) => void;
  regenerateSteps: () => void;

  selectPage: (index: number) => void;
  selectStep: (stepId: string | null) => void;
  toggleInteractive3D: (stepId: string | null) => void;

  // 3-Tier Customization
  applyThemePreset: (presetId: ThemePresetId) => void;
  updateTheme: (patch: Partial<ThemeSettings>) => void;
  updateCover: (patch: Partial<CoverConfig>) => void;
  updateBack: (patch: Partial<BackConfig>) => void;
  updateBom: (patch: Partial<BomConfig>) => void;

  // Semantic Step Overrides (never bound to page numbers!)
  updateStepOverride: (stepId: string, patch: Partial<StepOverride>) => void;
  resetStepOverride: (stepId: string) => void;
  updatePresentationTransform: (
    stepId: string,
    targetId: string,
    patch: Partial<PresentationTransform>,
  ) => void;
  clearPresentationTransform: (stepId: string, targetId: string) => void;

  // Non-destructive Step Editing
  splitSelectedStep: (stepId: string) => void;
  mergeSelectedStep: (stepId: string) => void;
  reorderSelectedStep: (stepId: string, dir: 'up' | 'down') => void;
  movePartToStep: (partId: string, fromStepId: string, toStepId: string) => void;

  // Project Load/Save & Undo/Redo
  loadProjectFile: (project: BicProjectFile) => void;
  getProjectSnapshot: () => BicProjectFile;
  undo: () => void;
  redo: () => void;
  setStatusMessage: (msg: string | null) => void;
}

function buildInitialState(demoIndex = 0) {
  const demo = DEMO_MODELS[demoIndex] ?? DEMO_MODELS[0];
  const model = parseLDrawSource(demo.ldrawSource, `${demo.id}.ldr`, 'demo');
  model.name = demo.name;
  model.author = demo.author;

  partsProvider.registerEmbeddedFiles(model.embeddedLDrawFiles);
  const graph = buildConnectivityGraph(model.parts);
  const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});
  const theme: ThemeSettings = { ...THEME_PRESETS['classic-lego-blue'].settings };
  const cover: CoverConfig = {
    enabled: true,
    title: demo.name,
    subtitle: demo.subtitle,
    author: demo.author,
    setNumber: demo.setNumber,
    showPieceCount: true,
    showStepCount: true,
    heroView: 'top_front_right',
  };
  const back: BackConfig = {
    enabled: true,
    headline: 'Build Complete!',
    footerNote: 'Generated with Brick Instruction Works — Non-Destructive Instruction Studio',
    showCompletionRender: true,
    showStatsSummary: true,
  };
  const bom: BomConfig = {
    enabled: true,
    title: 'Parts Inventory',
    sortMode: 'color-part',
    columns: 5,
  };
  const overrides: Record<string, StepOverride> = {};
  const pages = buildPagePlans(model, plan, overrides, theme, cover, back, bom);
  const firstStepPageIdx = pages.findIndex((p) => p.kind === 'steps');
  const firstStepId = plan.chapters[0]?.stepIds[0] ?? null;

  return {
    model,
    plan,
    overrides,
    theme,
    cover,
    back,
    bom,
    pages,
    currentPageIndex: firstStepPageIdx >= 0 ? firstStepPageIdx : 0,
    selectedStepId: firstStepId,
  };
}

const initial = buildInitialState(0);

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleAutosave(getState: () => ManualState) {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    void saveAutosaveProject(getState().getProjectSnapshot());
  }, 600);
}

export const useManualStore = create<ManualState>((set, get) => {
  const pushHistory = (): HistorySnapshot[] => {
    const { plan, overrides, undoStack } = get();
    return [...undoStack.slice(-24), { plan, overrides }];
  };

  const recomputePages = (
    model: CanonicalModel,
    plan: InstructionPlan,
    overrides: Record<string, StepOverride>,
    theme: ThemeSettings,
    cover: CoverConfig,
    back: BackConfig,
    bom: BomConfig,
    keepStepId?: string | null,
  ): { pages: PagePlan[]; currentPageIndex: number } => {
    const pages = buildPagePlans(model, plan, overrides, theme, cover, back, bom);
    let currentPageIndex = Math.min(get().currentPageIndex, Math.max(0, pages.length - 1));
    if (keepStepId) {
      const idx = pages.findIndex((p) => p.slots?.some((s) => s.stepId === keepStepId));
      if (idx >= 0) currentPageIndex = idx;
    }
    return { pages, currentPageIndex };
  };

  const commitModelWithMode = (incoming: CanonicalModel, mode: ImportMode, presetSubtitle = '') => {
    partsProvider.registerEmbeddedFiles(incoming.embeddedLDrawFiles);
    technicalRenderer.clearStepCache();

    const graph = buildConnectivityGraph(incoming.parts);
    const pacing = get().plan.pacing;
    const plan = generateInstructionPlan(incoming, graph, pacing, mode, {});
    const overrides: Record<string, StepOverride> = {};
    const cover: CoverConfig = {
      ...get().cover,
      title: incoming.name,
      subtitle: presetSubtitle || `Custom ${incoming.sourceFormat.toUpperCase()} Model`,
      author: incoming.author || 'Builder',
    };
    const { theme, back, bom } = get();
    const pages = buildPagePlans(incoming, plan, overrides, theme, cover, back, bom);
    const firstStepIdx = pages.findIndex((p) => p.kind === 'steps');
    const firstStepId = plan.chapters[0]?.stepIds[0] ?? null;

    set({
      model: incoming,
      plan,
      overrides,
      cover,
      pages,
      currentPageIndex: firstStepIdx >= 0 ? firstStepIdx : 0,
      selectedStepId: firstStepId,
      interactive3DStepId: null,
      pendingImportModel: null,
      lastDiffReport: null,
      undoStack: [],
      redoStack: [],
      statusMessage: `Loaded "${incoming.name}" (${incoming.parts.length} parts across ${Object.keys(plan.steps).length} steps)`,
    });
    scheduleAutosave(get);
  };

  return {
    ...initial,
    interactive3DStepId: null,
    pendingImportModel: null,
    lastDiffReport: null,
    statusMessage: null,
    undoStack: [],
    redoStack: [],

    hydrateFromAutosave: async () => {
      const saved = await loadAutosaveProject();
      if (saved) {
        get().loadProjectFile(saved);
        set({ statusMessage: `Restored autosaved manual "${saved.model.name}"` });
      }
    },

    loadDemoModel: (demoId) => {
      const demo = DEMO_MODELS.find((d) => d.id === demoId);
      if (!demo) return;
      const parsed = parseLDrawSource(demo.ldrawSource, `${demo.id}.ldr`, 'demo');
      parsed.name = demo.name;
      parsed.author = demo.author;
      commitModelWithMode(parsed, 'regenerate_all', demo.subtitle);
      set((s) => ({
        cover: { ...s.cover, setNumber: demo.setNumber, subtitle: demo.subtitle },
      }));
    },

    uploadModelFile: async (file) => {
      try {
        const parsed = await parseModelFile(file);
        if (parsed.parts.length === 0) {
          set({ statusMessage: 'No LEGO parts were found in this file.' });
          return;
        }
        // Per user preference: ask in Import Dialog whenever existing steps or submodels exist
        if (parsed.hasExistingSteps || parsed.hasExistingSubmodels) {
          set({ pendingImportModel: parsed });
        } else {
          commitModelWithMode(parsed, 'regenerate_all');
        }
      } catch (err) {
        set({
          statusMessage: `Import failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },

    confirmPendingImport: (mode) => {
      const pending = get().pendingImportModel;
      if (!pending) return;
      commitModelWithMode(pending, mode);
    },

    cancelPendingImport: () => set({ pendingImportModel: null }),

    reimportModelDiffFile: async (file) => {
      try {
        const incoming = await parseModelFile(file);
        if (incoming.parts.length === 0) {
          set({ statusMessage: 'Re-import skipped: no LEGO parts found in file.' });
          return;
        }
        partsProvider.registerEmbeddedFiles(incoming.embeddedLDrawFiles);
        technicalRenderer.clearStepCache();

        const { model, plan, overrides, theme, cover, back, bom, selectedStepId } = get();
        const undoStack = pushHistory();
        const diffed = applySmartReimportDiff(model, plan, overrides, incoming);
        const { pages, currentPageIndex } = recomputePages(
          diffed.model,
          diffed.plan,
          diffed.overrides,
          theme,
          cover,
          back,
          bom,
          selectedStepId,
        );

        set({
          model: diffed.model,
          plan: diffed.plan,
          overrides: diffed.overrides,
          pages,
          currentPageIndex,
          lastDiffReport: diffed.report,
          undoStack,
          redoStack: [],
          statusMessage: `Smart Re-Import: ${diffed.report.matchedCount} matched, +${diffed.report.addedCount} added, -${diffed.report.removedCount} removed (${diffed.report.preservedOverrideCount} overrides kept)`,
        });
        scheduleAutosave(get);
      } catch (err) {
        set({
          statusMessage: `Re-import failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    },

    clearDiffReport: () => set({ lastDiffReport: null }),

    setPacing: (pacing) => {
      const { model, plan, overrides, theme, cover, back, bom } = get();
      const undoStack = pushHistory();
      const graph = buildConnectivityGraph(model.parts);
      const nextPlan = generateInstructionPlan(model, graph, pacing, plan.importMode, overrides);
      technicalRenderer.clearStepCache();
      const pages = buildPagePlans(model, nextPlan, overrides, theme, cover, back, bom);
      const firstStepIdx = pages.findIndex((p) => p.kind === 'steps');
      set({
        plan: nextPlan,
        pages,
        currentPageIndex: firstStepIdx >= 0 ? firstStepIdx : 0,
        selectedStepId: nextPlan.chapters[0]?.stepIds[0] ?? null,
        undoStack,
        redoStack: [],
        statusMessage: `Re-generated steps with "${pacing}" pacing (${Object.keys(nextPlan.steps).length} steps)`,
      });
      scheduleAutosave(get);
    },

    regenerateSteps: () => {
      get().setPacing(get().plan.pacing);
    },

    selectPage: (index) => {
      const { pages } = get();
      const clamped = Math.max(0, Math.min(pages.length - 1, index));
      const page = pages[clamped];
      const firstSlotStep = page?.slots?.[0]?.stepId ?? get().selectedStepId;
      set({ currentPageIndex: clamped, selectedStepId: firstSlotStep });
    },

    selectStep: (stepId) => {
      if (!stepId) {
        set({ selectedStepId: null });
        return;
      }
      const { pages } = get();
      const pageIdx = pages.findIndex((p) => p.slots?.some((s) => s.stepId === stepId));
      set({
        selectedStepId: stepId,
        currentPageIndex: pageIdx >= 0 ? pageIdx : get().currentPageIndex,
      });
    },

    toggleInteractive3D: (stepId) =>
      set((s) => ({
        interactive3DStepId: s.interactive3DStepId === stepId ? null : stepId,
      })),

    applyThemePreset: (presetId) => {
      const preset = THEME_PRESETS[presetId];
      if (!preset) return;
      const nextTheme: ThemeSettings = { ...preset.settings };
      technicalRenderer.clearStepCache();
      const { model, plan, overrides, cover, back, bom, selectedStepId } = get();
      const { pages, currentPageIndex } = recomputePages(
        model,
        plan,
        overrides,
        nextTheme,
        cover,
        back,
        bom,
        selectedStepId,
      );
      set({ theme: nextTheme, pages, currentPageIndex });
      scheduleAutosave(get);
    },

    updateTheme: (patch) => {
      const nextTheme = { ...get().theme, ...patch };
      technicalRenderer.clearStepCache();
      const { model, plan, overrides, cover, back, bom, selectedStepId } = get();
      const { pages, currentPageIndex } = recomputePages(
        model,
        plan,
        overrides,
        nextTheme,
        cover,
        back,
        bom,
        selectedStepId,
      );
      set({ theme: nextTheme, pages, currentPageIndex });
      scheduleAutosave(get);
    },

    updateCover: (patch) => {
      const nextCover = { ...get().cover, ...patch };
      const { model, plan, overrides, theme, back, bom } = get();
      const pages = buildPagePlans(model, plan, overrides, theme, nextCover, back, bom);
      set({ cover: nextCover, pages });
      scheduleAutosave(get);
    },

    updateBack: (patch) => {
      const nextBack = { ...get().back, ...patch };
      const { model, plan, overrides, theme, cover, bom } = get();
      const pages = buildPagePlans(model, plan, overrides, theme, cover, nextBack, bom);
      set({ back: nextBack, pages });
      scheduleAutosave(get);
    },

    updateBom: (patch) => {
      const nextBom = { ...get().bom, ...patch };
      const { model, plan, overrides, theme, cover, back } = get();
      const pages = buildPagePlans(model, plan, overrides, theme, cover, back, nextBom);
      set({ bom: nextBom, pages });
      scheduleAutosave(get);
    },

    updateStepOverride: (stepId, patch) => {
      const { model, plan, overrides, theme, cover, back, bom } = get();
      const undoStack = pushHistory();
      const nextOverrides: Record<string, StepOverride> = {
        ...overrides,
        [stepId]: { ...(overrides[stepId] ?? {}), ...patch },
      };

      // If cameraViewOverride changed, re-run Viterbi optimizer on that chapter so rotation cues stay accurate!
      let nextPlan = plan;
      if ('cameraViewOverride' in patch) {
        const step = plan.steps[stepId];
        if (step) {
          const ch = plan.chapters.find((c) => c.id === step.chapterId);
          if (ch) {
            const partsById: Record<string, PartInstance> = Object.fromEntries(
              model.parts.map((p) => [p.id, p]),
            );
            const ordered = ch.stepIds.map((id) => plan.steps[id]).filter(Boolean);
            const reOpt = optimizeCameraSequence(
              ordered,
              partsById,
              nextOverrides,
              (subId) => plan.subassemblies[subId]?.instancePartIdGroups.flat() ?? [],
            );
            const nextSteps = { ...plan.steps };
            for (const s of reOpt) nextSteps[s.id] = s;
            nextPlan = { ...plan, steps: nextSteps };
          }
        }
      }

      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        nextPlan,
        nextOverrides,
        theme,
        cover,
        back,
        bom,
        stepId,
      );
      set({
        plan: nextPlan,
        overrides: nextOverrides,
        pages,
        currentPageIndex,
        undoStack,
        redoStack: [],
      });
      scheduleAutosave(get);
    },

    resetStepOverride: (stepId) => {
      const { model, plan, overrides, theme, cover, back, bom } = get();
      const undoStack = pushHistory();
      const nextOverrides = { ...overrides };
      delete nextOverrides[stepId];
      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        plan,
        nextOverrides,
        theme,
        cover,
        back,
        bom,
        stepId,
      );
      set({ overrides: nextOverrides, pages, currentPageIndex, undoStack, redoStack: [] });
      scheduleAutosave(get);
    },

    updatePresentationTransform: (stepId, targetId, patch) => {
      const curr = get().overrides[stepId]?.presentationTransforms?.[targetId] ?? {
        offset: [0, 0, 0] as [number, number, number],
        hingeAngleDeg: 0,
        hingeAxis: 'x' as const,
        showArrow: true,
      };
      const nextTransforms = {
        ...(get().overrides[stepId]?.presentationTransforms ?? {}),
        [targetId]: { ...curr, ...patch },
      };
      get().updateStepOverride(stepId, { presentationTransforms: nextTransforms });
    },

    clearPresentationTransform: (stepId, targetId) => {
      const existing = { ...(get().overrides[stepId]?.presentationTransforms ?? {}) };
      delete existing[targetId];
      get().updateStepOverride(stepId, {
        presentationTransforms: Object.keys(existing).length > 0 ? existing : undefined,
      });
    },

    splitSelectedStep: (stepId) => {
      const { plan, model, overrides, theme, cover, back, bom } = get();
      const undoStack = pushHistory();
      const { plan: nextPlan, newStepId } = splitStep(plan, model, overrides, stepId);
      if (!newStepId) return;
      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        nextPlan,
        overrides,
        theme,
        cover,
        back,
        bom,
        stepId,
      );
      set({
        plan: nextPlan,
        pages,
        currentPageIndex,
        selectedStepId: stepId,
        undoStack,
        redoStack: [],
        statusMessage: 'Split step cleanly without altering downstream overrides.',
      });
      scheduleAutosave(get);
    },

    mergeSelectedStep: (stepId) => {
      const { plan, model, overrides, theme, cover, back, bom } = get();
      const undoStack = pushHistory();
      const nextPlan = mergeStepWithNext(plan, model, overrides, stepId);
      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        nextPlan,
        overrides,
        theme,
        cover,
        back,
        bom,
        stepId,
      );
      set({
        plan: nextPlan,
        pages,
        currentPageIndex,
        undoStack,
        redoStack: [],
        statusMessage: 'Merged step with next step.',
      });
      scheduleAutosave(get);
    },

    reorderSelectedStep: (stepId, dir) => {
      const { plan, model, overrides, theme, cover, back, bom } = get();
      const undoStack = pushHistory();
      const nextPlan = reorderStep(plan, model, overrides, stepId, dir);
      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        nextPlan,
        overrides,
        theme,
        cover,
        back,
        bom,
        stepId,
      );
      set({ plan: nextPlan, pages, currentPageIndex, undoStack, redoStack: [] });
      scheduleAutosave(get);
    },

    movePartToStep: (partId, fromStepId, toStepId) => {
      const { plan, model, overrides, theme, cover, back, bom } = get();
      const undoStack = pushHistory();
      const nextPlan = movePartBetweenSteps(plan, model, overrides, partId, fromStepId, toStepId);
      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        nextPlan,
        overrides,
        theme,
        cover,
        back,
        bom,
        toStepId,
      );
      set({
        plan: nextPlan,
        pages,
        currentPageIndex,
        selectedStepId: toStepId,
        undoStack,
        redoStack: [],
        statusMessage: 'Moved part to target step (downstream layouts preserved).',
      });
      scheduleAutosave(get);
    },

    loadProjectFile: (project) => {
      partsProvider.registerEmbeddedFiles(project.model.embeddedLDrawFiles ?? {});
      technicalRenderer.clearStepCache();
      const pages = buildPagePlans(
        project.model,
        project.plan,
        project.overrides,
        project.theme,
        project.cover,
        project.back,
        project.bom,
      );
      const firstStepIdx = pages.findIndex((p) => p.kind === 'steps');
      set({
        model: project.model,
        plan: project.plan,
        overrides: project.overrides,
        theme: project.theme,
        cover: project.cover,
        back: project.back,
        bom: project.bom,
        pages,
        currentPageIndex: firstStepIdx >= 0 ? firstStepIdx : 0,
        selectedStepId: project.plan.chapters[0]?.stepIds[0] ?? null,
        undoStack: [],
        redoStack: [],
      });
    },

    getProjectSnapshot: () => {
      const { model, plan, overrides, theme, cover, back, bom } = get();
      return {
        format: PROJECT_FILE_FORMAT,
        version: 1,
        savedAt: new Date().toISOString(),
        model,
        plan,
        overrides,
        theme,
        cover,
        back,
        bom,
      };
    },

    undo: () => {
      const { undoStack, redoStack, plan, overrides, model, theme, cover, back, bom, selectedStepId } =
        get();
      if (undoStack.length === 0) return;
      const prev = undoStack[undoStack.length - 1];
      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        prev.plan,
        prev.overrides,
        theme,
        cover,
        back,
        bom,
        selectedStepId,
      );
      set({
        plan: prev.plan,
        overrides: prev.overrides,
        pages,
        currentPageIndex,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, { plan, overrides }],
      });
    },

    redo: () => {
      const { undoStack, redoStack, plan, overrides, model, theme, cover, back, bom, selectedStepId } =
        get();
      if (redoStack.length === 0) return;
      const next = redoStack[redoStack.length - 1];
      technicalRenderer.clearStepCache();
      const { pages, currentPageIndex } = recomputePages(
        model,
        next.plan,
        next.overrides,
        theme,
        cover,
        back,
        bom,
        selectedStepId,
      );
      set({
        plan: next.plan,
        overrides: next.overrides,
        pages,
        currentPageIndex,
        undoStack: [...undoStack, { plan, overrides }],
        redoStack: redoStack.slice(0, -1),
      });
    },

    setStatusMessage: (msg) => set({ statusMessage: msg }),
  };
});
