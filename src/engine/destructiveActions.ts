import {
  createDefaultBackMeta,
  createDefaultCompleteMeta,
  createDefaultCoverMeta,
  isHeroCameraCustomized,
  type BackCoverMeta,
  type CompleteMeta,
  type CoverMeta,
} from '../cover/coverLayout';
import type { StepLayoutGroup } from './pageLayout';
import { FOCUS_MODE_OPTIONS, type StepOverrideLike } from './stepToolbar';
import {
  getWordlessSurfaceDefaults,
  resolvePageNumberFormatForMode,
} from './wordlessMode';

export type DestructiveTone = 'warning' | 'danger';

export interface DestructiveNotice {
  tone: DestructiveTone;
  message: string;
  /** True when Undo can restore the previous state; false when permanent / clears Undo history. */
  undoable: boolean;
}

export interface PartOffsetLike {
  x?: number;
  y?: number;
  z?: number;
  tilt?: number;
  arrow?: boolean;
}

export interface StepOverrideWithPartsLike extends StepOverrideLike {
  partOffsets?: Record<string, PartOffsetLike>;
}

export interface StepLike {
  id: string;
  num: number;
  absNum?: number;
  parts?: ReadonlyArray<{ id: string }>;
  subassembly?: { name?: string } | null;
  defaultPartOffsets?: Record<string, PartOffsetLike> | null;
}

export interface ChapterLike {
  id: string;
  name?: string;
  steps: ReadonlyArray<StepLike>;
}

export interface StepOverrideSummary {
  hasCameraAngle: boolean;
  hasZoom: boolean;
  hasFraming: boolean;
  hasCameraAny: boolean;
  partOffsetCount: number;
  hasPliScale: boolean;
  hasPageBreak: boolean;
  hasCalloutOverride: boolean;
  insertCount: number;
  hasSubassembly: boolean;
  labels: string[];
  hasAny: boolean;
}

export interface ManualEditsSummary {
  cameraOverrideSteps: number;
  partOffsetCount: number;
  pliScaleSteps: number;
  pageBreakSteps: number;
  calloutOverrideSteps: number;
  stepInsertCount: number;
  dividerCount: number;
  layoutGroupCount: number;
  manualSplitSteps: number;
  hasCoverOrExtraPageEdits: boolean;
  /** All edit categories across the entire manual (for Close / Replace Model). */
  items: string[];
  /** Step, override, note, layout-group, and divider edits (for Step Regeneration). */
  stepItems: string[];
  hasAnyEdits: boolean;
  hasStepOrLayoutEdits: boolean;
}

function plural(n: number, singular: string, pluralForm = `${singular}s`): string {
  return `${n.toLocaleString()} ${n === 1 ? singular : pluralForm}`;
}

export function formatCompactList(items: ReadonlyArray<string>, maxShown = 3): string {
  const clean = items.filter((s) => Boolean(s && s.trim()));
  if (clean.length === 0) return '';
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} and ${clean[1]}`;
  if (clean.length <= maxShown) {
    return `${clean.slice(0, -1).join(', ')}, and ${clean[clean.length - 1]}`;
  }
  const shown = clean.slice(0, maxShown);
  const rest = clean.length - maxShown;
  return `${shown.join(', ')}, and ${rest} more`;
}

export function hasCustomPartOffset(
  entry: PartOffsetLike | null | undefined,
  defaultEntry?: PartOffsetLike | null,
): boolean {
  if (!entry) return false;
  const dx = Number(entry.x) || 0;
  const dy = Number(entry.y) || 0;
  const dz = Number(entry.z) || 0;
  const tilt = Number(entry.tilt) || 0;
  const arrow = entry.arrow !== false;

  if (defaultEntry) {
    const defX = Number(defaultEntry.x) || 0;
    const defY = Number(defaultEntry.y) || 0;
    const defZ = Number(defaultEntry.z) || 0;
    const defTilt = Number(defaultEntry.tilt) || 0;
    const defArrow = defaultEntry.arrow !== false;
    return (
      Math.abs(dx - defX) > 0.01 ||
      Math.abs(dy - defY) > 0.01 ||
      Math.abs(dz - defZ) > 0.01 ||
      Math.abs(tilt - defTilt) > 0.01 ||
      arrow !== defArrow
    );
  }

  return (
    Math.abs(dx) > 0.01 ||
    Math.abs(dy) > 0.01 ||
    Math.abs(dz) > 0.01 ||
    Math.abs(tilt) > 0.01 ||
    !arrow
  );
}

export function hasCameraAngleOverride(ov: StepOverrideLike | null | undefined): boolean {
  if (!ov) return false;
  return (
    ov.side !== undefined ||
    ov.corner !== undefined ||
    typeof ov.az === 'number' ||
    typeof ov.el === 'number'
  );
}

export function hasCameraZoomOverride(ov: StepOverrideLike | null | undefined): boolean {
  if (!ov) return false;
  return typeof ov.modelScale === 'number' && Math.abs(ov.modelScale - 1) > 0.001;
}

export function hasCameraFramingOverride(ov: StepOverrideLike | null | undefined): boolean {
  if (!ov) return false;
  return Boolean(ov.focusMode && ov.focusMode !== 'auto');
}

export function summarizeStepOverrides(
  override: StepOverrideWithPartsLike | null | undefined,
  insertCount = 0,
  hasSubassembly = false,
  defaultPartOffsets?: Record<string, PartOffsetLike> | null,
): StepOverrideSummary {
  const ov = override || {};
  const hasCameraAngle = hasCameraAngleOverride(ov);
  const hasZoom = hasCameraZoomOverride(ov);
  const hasFraming = hasCameraFramingOverride(ov);
  const hasCameraAny = hasCameraAngle || hasZoom || hasFraming;

  let partOffsetCount = 0;
  if (ov.partOffsets && typeof ov.partOffsets === 'object') {
    for (const [partId, entry] of Object.entries(ov.partOffsets)) {
      if (hasCustomPartOffset(entry, defaultPartOffsets?.[partId])) {
        partOffsetCount += 1;
      }
    }
  }

  const hasPliScale = typeof ov.pliScale === 'number' && Math.abs(ov.pliScale - 1) > 0.001;
  const hasPageBreak = Boolean(ov.pin);
  const hasCalloutOverride = Boolean(ov.calloutAsPages) || ov.calloutDir === 'vertical';
  const safeInserts = Math.max(0, Math.round(Number(insertCount) || 0));

  const labels: string[] = [];
  if (hasCameraAny) labels.push('custom camera');
  if (partOffsetCount > 0) labels.push(plural(partOffsetCount, 'part nudge'));
  if (hasPliScale) labels.push('Parts Box size');
  if (hasPageBreak) labels.push('page break');
  if (hasCalloutOverride) labels.push('callout layout');
  if (safeInserts > 0) labels.push(plural(safeInserts, 'note'));
  if (hasSubassembly) labels.push('subassembly callout');

  return {
    hasCameraAngle,
    hasZoom,
    hasFraming,
    hasCameraAny,
    partOffsetCount,
    hasPliScale,
    hasPageBreak,
    hasCalloutOverride,
    insertCount: safeInserts,
    hasSubassembly,
    labels,
    hasAny: labels.length > 0,
  };
}

export function summarizeManualEdits(input: {
  chapters?: ReadonlyArray<ChapterLike> | null;
  overrides?: Readonly<Record<string, StepOverrideWithPartsLike>> | null;
  stepInserts?: Readonly<Record<string, ReadonlyArray<unknown>>> | null;
  dividerAfter?: Readonly<Record<string, unknown>> | null;
  layoutGroups?: ReadonlyArray<StepLayoutGroup> | null;
  coverMeta?: Partial<CoverMeta> | null;
  completeMeta?: Partial<CompleteMeta> | null;
  backMeta?: Partial<BackCoverMeta> | null;
  modelTitle?: string | null;
  wordlessMode?: boolean;
}): ManualEditsSummary {
  const chapters = input.chapters || [];
  const overrides = input.overrides || {};
  const stepInserts = input.stepInserts || {};

  let cameraOverrideSteps = 0;
  let partOffsetCount = 0;
  let pliScaleSteps = 0;
  let pageBreakSteps = 0;
  let calloutOverrideSteps = 0;
  let stepInsertCount = 0;
  let manualSplitSteps = 0;

  const seenStepIds = new Set<string>();
  for (const ch of chapters) {
    for (const step of ch.steps || []) {
      if (!step?.id || seenStepIds.has(step.id)) continue;
      seenStepIds.add(step.id);

      if (step.id.includes('_s_')) {
        manualSplitSteps += 1;
      }

      const ins = stepInserts[step.id];
      const insLen = Array.isArray(ins) ? ins.length : 0;
      stepInsertCount += insLen;

      const summary = summarizeStepOverrides(
        overrides[step.id],
        insLen,
        false,
        step.defaultPartOffsets,
      );
      if (summary.hasCameraAny) cameraOverrideSteps += 1;
      partOffsetCount += summary.partOffsetCount;
      if (summary.hasPliScale) pliScaleSteps += 1;
      if (summary.hasPageBreak) pageBreakSteps += 1;
      if (summary.hasCalloutOverride) calloutOverrideSteps += 1;
    }
  }

  const dividerCount = input.dividerAfter ? Object.keys(input.dividerAfter).length : 0;
  const layoutGroupCount = Array.isArray(input.layoutGroups) ? input.layoutGroups.length : 0;

  const wlDefs = getWordlessSurfaceDefaults(Boolean(input.wordlessMode));
  const defCover = createDefaultCoverMeta({ showText: wlDefs.coverShowText });
  const defComplete = { ...createDefaultCompleteMeta(), showText: wlDefs.completeShowText };
  const defBack = createDefaultBackMeta();

  const cm = input.coverMeta || {};
  const comp = input.completeMeta || {};
  const bm = input.backMeta || {};
  const modelTitle = (input.modelTitle || '').trim();

  const coverTitleTrim = (cm.title || '').trim();
  const hasCustomCoverTitle = Boolean(coverTitleTrim && coverTitleTrim !== modelTitle);
  const hasCustomCoverSub = Boolean((cm.subtitle || '').trim());
  const hasCustomCoverCam = isHeroCameraCustomized(
    {
      az: typeof cm.az === 'number' ? cm.az : defCover.az,
      el: typeof cm.el === 'number' ? cm.el : defCover.el,
      zoom: typeof cm.zoom === 'number' ? cm.zoom : defCover.zoom,
    },
    defCover,
  );
  const hasCustomCompleteCam = isHeroCameraCustomized(
    {
      az: typeof comp.az === 'number' ? comp.az : defComplete.az,
      el: typeof comp.el === 'number' ? comp.el : defComplete.el,
      zoom: typeof comp.zoom === 'number' ? comp.zoom : defComplete.zoom,
    },
    defComplete,
  );
  const hasCustomCompleteText =
    Boolean(comp.title && comp.title.trim() !== defComplete.title) ||
    Boolean(comp.subtitle !== undefined && comp.subtitle.trim() !== defComplete.subtitle);

  const hasCoverOrExtraPageEdits = Boolean(
    hasCustomCoverTitle ||
      hasCustomCoverSub ||
      hasCustomCoverCam ||
      cm.creatorLogoSrc ||
      cm.themeImageSrc ||
      cm.bgSrc ||
      (typeof cm.showText === 'boolean' && cm.showText !== wlDefs.coverShowText) ||
      hasCustomCompleteCam ||
      hasCustomCompleteText ||
      comp.bgSrc ||
      (typeof comp.showText === 'boolean' && comp.showText !== wlDefs.completeShowText) ||
      comp.showFireworks === false ||
      bm.bgSrc ||
      (typeof bm.az === 'number' && Math.abs(bm.az - defBack.az) > 0.5),
  );

  const stepItems: string[] = [];
  if (manualSplitSteps > 0) stepItems.push(plural(manualSplitSteps, 'split step'));
  if (cameraOverrideSteps > 0) stepItems.push(plural(cameraOverrideSteps, 'camera override'));
  if (partOffsetCount > 0) stepItems.push(plural(partOffsetCount, 'part nudge'));
  if (pliScaleSteps > 0) stepItems.push(plural(pliScaleSteps, 'Parts Box size'));
  if (pageBreakSteps > 0) stepItems.push(plural(pageBreakSteps, 'page break'));
  if (calloutOverrideSteps > 0) stepItems.push(plural(calloutOverrideSteps, 'callout layout'));
  if (stepInsertCount > 0) stepItems.push(plural(stepInsertCount, 'step note'));
  if (layoutGroupCount > 0) stepItems.push(plural(layoutGroupCount, 'Step Range Group'));
  if (dividerCount > 0) stepItems.push(plural(dividerCount, 'divider page'));

  const items = [...stepItems];
  if (hasCoverOrExtraPageEdits) items.push('cover/extra-page edits');

  return {
    cameraOverrideSteps,
    partOffsetCount,
    pliScaleSteps,
    pageBreakSteps,
    calloutOverrideSteps,
    stepInsertCount,
    dividerCount,
    layoutGroupCount,
    manualSplitSteps,
    hasCoverOrExtraPageEdits,
    items,
    stepItems,
    hasAnyEdits: items.length > 0,
    hasStepOrLayoutEdits: stepItems.length > 0,
  };
}

/**
 * 1. Apply Camera to Steps modal: warns when other steps inside the selected range
 *    already have custom camera angles (or custom zoom/framing when includeFraming is on).
 */
export function getApplyCameraDestructiveNotice(input: {
  steps: ReadonlyArray<StepLike>;
  overrides: Readonly<Record<string, StepOverrideWithPartsLike>> | null | undefined;
  sourceStepId: string | null | undefined;
  startNum: number;
  endNum: number;
  includeFraming: boolean;
}): {
  notice: DestructiveNotice | null;
  affectedStepIds: string[];
  angleConflictCount: number;
  framingConflictCount: number;
} {
  const lo = Math.min(input.startNum, input.endNum);
  const hi = Math.max(input.startNum, input.endNum);
  const overrides = input.overrides || {};

  const affectedStepIds: string[] = [];
  const affectedLabels: string[] = [];
  let angleConflictCount = 0;
  let framingConflictCount = 0;

  for (const step of input.steps) {
    if (!step || step.id === input.sourceStepId) continue;
    const abs = typeof step.absNum === 'number' ? step.absNum : step.num;
    if (abs < lo || abs > hi) continue;

    const ov = overrides[step.id];
    const hasAngle = hasCameraAngleOverride(ov);
    const hasFraming =
      input.includeFraming && (hasCameraZoomOverride(ov) || hasCameraFramingOverride(ov));

    if (hasAngle || hasFraming) {
      affectedStepIds.push(step.id);
      if (hasAngle) angleConflictCount += 1;
      if (hasFraming) framingConflictCount += 1;
      affectedLabels.push(abs !== step.num ? `Step ${step.num} (#${abs})` : `Step ${step.num}`);
    }
  }

  if (affectedStepIds.length === 0) {
    return {
      notice: null,
      affectedStepIds,
      angleConflictCount,
      framingConflictCount,
    };
  }

  let what = 'custom camera angle';
  if (angleConflictCount > 0 && framingConflictCount > 0) {
    what = 'custom camera, zoom, or framing overrides';
  } else if (framingConflictCount > 0) {
    what = 'custom zoom or framing overrides';
  } else if (angleConflictCount > 1) {
    what = 'custom camera angles';
  }

  const countPhrase =
    affectedStepIds.length === 1
      ? `1 other step in this range (${affectedLabels[0]})`
      : affectedStepIds.length <= 3
        ? `${affectedStepIds.length} other steps in this range (${affectedLabels.join(', ')})`
        : `${affectedStepIds.length} other steps in this range`;

  return {
    notice: {
      tone: 'warning',
      message: `Overwrites ${what} on ${countPhrase}. Undo is available.`,
      undoable: true,
    },
    affectedStepIds,
    angleConflictCount,
    framingConflictCount,
  };
}

/**
 * 2. Wordless Instructions toggle: warns whenever toggling will overwrite or reset
 *    extra-page text settings (Cover title, Build Complete text, Parts List names/colors)
 *    or Page Number Format.
 */
export function getWordlessToggleDestructiveNotice(input: {
  currentWordless: boolean;
  coverShowText: boolean;
  completeShowText: boolean;
  bomShowTextFields: boolean;
  pageNumberFormat: string | undefined;
}): DestructiveNotice | null {
  const nextWordless = !input.currentWordless;
  const nextDefs = getWordlessSurfaceDefaults(nextWordless);
  const nextPgFmt = resolvePageNumberFormatForMode(input.pageNumberFormat, nextWordless);

  const changedTextSurfaces: string[] = [];
  if (input.coverShowText !== nextDefs.coverShowText) {
    changedTextSurfaces.push('Front Cover title');
  }
  if (input.completeShowText !== nextDefs.completeShowText) {
    changedTextSurfaces.push('Build Complete text');
  }
  if (input.bomShowTextFields !== nextDefs.bomShowTextFields) {
    changedTextSurfaces.push('Parts List names & colors');
  }

  const pageNumChanges = Boolean(input.pageNumberFormat && nextPgFmt !== input.pageNumberFormat);

  if (changedTextSurfaces.length === 0 && !pageNumChanges) {
    return null;
  }

  if (nextWordless) {
    if (changedTextSurfaces.length > 0 && pageNumChanges) {
      return {
        tone: 'warning',
        message: `Turning on resets extra-page text settings (hides ${formatCompactList(changedTextSurfaces, 3)}) and switches page numbers to 1. Undo is available.`,
        undoable: true,
      };
    }
    if (changedTextSurfaces.length > 0) {
      return {
        tone: 'warning',
        message: `Turning on resets extra-page text settings (hides ${formatCompactList(changedTextSurfaces, 3)}). Undo is available.`,
        undoable: true,
      };
    }
    return {
      tone: 'warning',
      message: 'Turning on switches page numbers from Page 1 to 1. Undo is available.',
      undoable: true,
    };
  }

  if (changedTextSurfaces.length > 0 && pageNumChanges) {
    return {
      tone: 'warning',
      message: `Turning off resets extra-page text settings (enables ${formatCompactList(changedTextSurfaces, 3)}) and switches page numbers to Page 1. Undo is available.`,
      undoable: true,
    };
  }
  if (changedTextSurfaces.length > 0) {
    return {
      tone: 'warning',
      message: `Turning off resets extra-page text settings (enables ${formatCompactList(changedTextSurfaces, 3)}). Undo is available.`,
      undoable: true,
    };
  }
  return {
    tone: 'warning',
    message: 'Turning off switches page numbers from 1 to Page 1. Undo is available.',
    undoable: true,
  };
}

/**
 * 3. Step Camera Reset (`#btnResetCam`): names all camera overrides cleared at once.
 */
export function getStepResetCameraDestructiveNotice(input: {
  stepNum: number;
  override: StepOverrideWithPartsLike | null | undefined;
}): DestructiveNotice | null {
  const ov = input.override;
  if (!ov) return null;

  const cleared: string[] = [];
  if (hasCameraAngleOverride(ov)) {
    const angleDesc =
      typeof ov.az === 'number'
        ? `angle (${Math.round(((ov.az % 360) + 360) % 360)}°)`
        : 'camera angle';
    cleared.push(angleDesc);
  }
  if (hasCameraZoomOverride(ov)) {
    cleared.push(`zoom (${Math.round((ov.modelScale || 1) * 100)}%)`);
  }
  if (hasCameraFramingOverride(ov)) {
    const fLabel =
      (FOCUS_MODE_OPTIONS.find((o) => o.id === ov.focusMode) || FOCUS_MODE_OPTIONS[0]).label;
    cleared.push(`${fLabel} framing`);
  }

  if (cleared.length === 0) return null;
  return {
    tone: 'warning',
    message: `Reset clears custom ${formatCompactList(cleared, 3)} on Step ${input.stepNum}. Undo is available.`,
    undoable: true,
  };
}

/**
 * 4. Cover / Build Complete Camera Reset (`#heroResetCam`).
 */
export function getHeroResetCameraDestructiveNotice(input: {
  pageLabel: string;
  az: number;
  el: number;
  zoom: number;
  defaultAz: number;
  defaultEl: number;
  defaultZoom: number;
}): DestructiveNotice | null {
  const cleared: string[] = [];
  if (Math.abs(input.az - input.defaultAz) > 0.5 || Math.abs(input.el - input.defaultEl) > 0.5) {
    cleared.push('camera angle');
  }
  if (Math.abs(input.zoom - input.defaultZoom) > 0.005) {
    cleared.push(`zoom (${Math.round(input.zoom * 100)}%)`);
  }
  if (cleared.length === 0) return null;
  return {
    tone: 'warning',
    message: `Reset Camera clears custom ${formatCompactList(cleared, 2)} on ${input.pageLabel}. Undo is available.`,
    undoable: true,
  };
}

/**
 * 5. Step Mode → Layout → Merge into Step N-1 (`#stepMergePrevBtn`).
 */
export function getMergeStepDestructiveNotice(input: {
  stepNum: number;
  prevStepNum: number;
  override: StepOverrideWithPartsLike | null | undefined;
  insertCount: number;
  hasSubassembly: boolean;
  defaultPartOffsets?: Record<string, PartOffsetLike> | null;
}): DestructiveNotice {
  const sum = summarizeStepOverrides(
    input.override,
    input.insertCount,
    input.hasSubassembly,
    input.defaultPartOffsets,
  );
  if (sum.hasAny) {
    return {
      tone: 'warning',
      message: `Merging deletes Step ${input.stepNum} and clears its ${formatCompactList(sum.labels, 4)}. Undo is available.`,
      undoable: true,
    };
  }
  return {
    tone: 'warning',
    message: `Merging deletes Step ${input.stepNum} and moves its parts into Step ${input.prevStepNum}. Undo is available.`,
    undoable: true,
  };
}

/**
 * 6. Parts Mode: Reset placement (`#btnResetSelPos`) and Move / Split / Make Submodel actions.
 */
export function getPartsActionDestructiveNotices(input: {
  stepNum: number;
  totalPartsInStep: number;
  selectedPartIds: ReadonlyArray<string>;
  override: StepOverrideWithPartsLike | null | undefined;
  defaultPartOffsets?: Record<string, PartOffsetLike> | null;
  insertCount: number;
  existingSubassemblyName?: string | null;
}): {
  resetNotice: DestructiveNotice | null;
  reorgNotice: DestructiveNotice | null;
  selectedOffsetCount: number;
} {
  const ov = input.override || {};
  let selectedOffsetCount = 0;
  for (const pid of input.selectedPartIds) {
    if (hasCustomPartOffset(ov.partOffsets?.[pid], input.defaultPartOffsets?.[pid])) {
      selectedOffsetCount += 1;
    }
  }

  const resetNotice: DestructiveNotice | null =
    selectedOffsetCount > 0
      ? {
          tone: 'warning',
          message: `Reset clears custom nudge, tilt, or arrow overrides on ${plural(selectedOffsetCount, 'selected part')}. Undo is available.`,
          undoable: true,
        }
      : null;

  const reorgClauses: string[] = [];
  const allPartsSelected =
    input.totalPartsInStep > 0 && input.selectedPartIds.length >= input.totalPartsInStep;

  if (allPartsSelected) {
    const stepSum = summarizeStepOverrides(
      ov,
      input.insertCount,
      Boolean(input.existingSubassemblyName),
      input.defaultPartOffsets,
    );
    if (stepSum.hasAny) {
      reorgClauses.push(
        `All parts selected: Move to Step… deletes Step ${input.stepNum} and clears its ${formatCompactList(stepSum.labels, 3)}`,
      );
    } else {
      reorgClauses.push(`All parts selected: Move to Step… deletes Step ${input.stepNum}`);
    }
  } else if (selectedOffsetCount > 0) {
    reorgClauses.push(
      `Moving or splitting clears custom nudge/tilt offsets on ${plural(selectedOffsetCount, 'selected part')}`,
    );
  }

  if (input.existingSubassemblyName) {
    reorgClauses.push(
      `Make Submodel replaces the existing "${input.existingSubassemblyName}" callout on Step ${input.stepNum}`,
    );
  }

  const reorgNotice: DestructiveNotice | null =
    reorgClauses.length > 0
      ? {
          tone: 'warning',
          message: `${reorgClauses.join('. ')}. Undo is available.`,
          undoable: true,
        }
      : null;

  return { resetNotice, reorgNotice, selectedOffsetCount };
}

/**
 * 7. Pages & Steps Overview → Clear All Page Breaks (`#btnClearAllPins`).
 */
export function getClearAllPageBreaksDestructiveNotice(breakCount: number): DestructiveNotice | null {
  if (!Number.isFinite(breakCount) || breakCount <= 0) return null;
  const n = Math.round(breakCount);
  return {
    tone: 'warning',
    message:
      n === 1
        ? 'Clears 1 manual page break and lets pages reflow. Undo is available.'
        : `Clears all ${n} manual page breaks across the manual and lets pages reflow. Undo is available.`,
    undoable: true,
  };
}

/**
 * 8. Step Generation / Import Assistant Modal (`#importModal` → `#impBtnAuto` & `#impBtnKeep`).
 */
export function getStepGenerationDestructiveNotice(input: {
  isPostImport: boolean;
  hasOpenModel: boolean;
  openModelTitle?: string | null;
  editsSummary: ManualEditsSummary;
  willChangeWordless?: boolean;
  targetWordless?: boolean;
  isKeepStepsAction?: boolean;
}): DestructiveNotice | null {
  if (!input.isPostImport) {
    if (!input.hasOpenModel) return null;
    const title = (input.openModelTitle || 'current manual').trim();
    if (input.editsSummary.hasAnyEdits) {
      return {
        tone: 'danger',
        message: `Replaces "${title}" and permanently clears unsaved edits (${formatCompactList(input.editsSummary.items, 4)}) and Undo history — cannot be undone.`,
        undoable: false,
      };
    }
    return {
      tone: 'danger',
      message: `Replaces "${title}" and clears Undo history — cannot be undone.`,
      undoable: false,
    };
  }

  const affected = [...input.editsSummary.stepItems];
  if (input.willChangeWordless) {
    affected.push(
      input.targetWordless
        ? 'extra-page text overrides (hidden in Wordless mode)'
        : 'extra-page text settings (enabled in With Text mode)',
    );
  }

  if (input.isKeepStepsAction) {
    if (affected.length > 0) {
      return {
        tone: 'warning',
        message: `Keeping file steps replaces all generated steps and may clear or shift ${formatCompactList(affected, 4)}. Undo is available.`,
        undoable: true,
      };
    }
    return {
      tone: 'warning',
      message: 'Replaces current steps with the STEP markers saved in the file. Undo is available.',
      undoable: true,
    };
  }

  if (affected.length > 0) {
    return {
      tone: 'warning',
      message: `Regenerating rebuilds all steps and may clear or shift ${formatCompactList(affected, 4)}. Undo is available.`,
      undoable: true,
    };
  }

  return {
    tone: 'warning',
    message: 'Rebuilds all steps from the source file, replacing any manual step order. Undo is available.',
    undoable: true,
  };
}

/**
 * 9. Menu Drawer → Close Model (`#menuCloseModelBtn`).
 */
export function getCloseModelDestructiveNotice(input: {
  modelTitle?: string | null;
  editsSummary: ManualEditsSummary;
}): DestructiveNotice {
  const title = (input.modelTitle || 'this manual').trim();
  if (input.editsSummary.hasAnyEdits) {
    return {
      tone: 'danger',
      message: `Permanently clears unsaved edits (${formatCompactList(input.editsSummary.items, 4)}) and Undo history — cannot be undone. Export .biw first to save.`,
      undoable: false,
    };
  }
  return {
    tone: 'danger',
    message: `Closes "${title}" and clears Undo history from this browser — cannot be undone.`,
    undoable: false,
  };
}

/**
 * 10. Open / Import Model or Project dialog (`#openModelModal`) & Missing Parts modal when a model is already open.
 */
export function getReplaceModelModalDestructiveNotice(input: {
  hasOpenModel: boolean;
  modelTitle?: string | null;
  editsSummary: ManualEditsSummary;
}): DestructiveNotice | null {
  if (!input.hasOpenModel) return null;
  const title = (input.modelTitle || 'current manual').trim();
  if (input.editsSummary.hasAnyEdits) {
    return {
      tone: 'danger',
      message: `Opening another file replaces "${title}" and permanently clears unsaved edits (${formatCompactList(input.editsSummary.items, 4)}) and Undo history. Export .biw first to keep them.`,
      undoable: false,
    };
  }
  return {
    tone: 'danger',
    message: `Opening another file replaces "${title}" and clears Undo history — cannot be undone.`,
    undoable: false,
  };
}

/**
 * 11. Style Popover → Delete Custom Theme (`#btnDeleteTheme`).
 */
export function getDeleteThemeDestructiveNotice(input: {
  themeName: string;
  isBuiltIn: boolean;
  referencingGroupNames: ReadonlyArray<string>;
}): DestructiveNotice | null {
  if (input.isBuiltIn) return null;
  const refs = input.referencingGroupNames.filter(Boolean);
  if (refs.length > 0) {
    return {
      tone: 'danger',
      message: `Delete permanently removes "${input.themeName}" and clears the theme override on ${plural(refs.length, 'Step Range Group')} (${formatCompactList(refs, 2)}) — cannot be undone.`,
      undoable: false,
    };
  }
  return {
    tone: 'danger',
    message: `Delete permanently removes "${input.themeName}" from this browser — cannot be undone.`,
    undoable: false,
  };
}

/**
 * 12. Page Setup → Step Range Group Editor (`#layoutGroupEditor`):
 *     Delete impact & overlapping-range precedence warning.
 */
export function getLayoutGroupDestructiveNotices(input: {
  editingId: string | null;
  editingGroupThemeName?: string | null;
  startStepNum: number;
  endStepNum: number;
  existingGroups: ReadonlyArray<StepLayoutGroup>;
}): {
  deleteNotice: DestructiveNotice | null;
  overlapNotice: DestructiveNotice | null;
} {
  const lo = Math.min(input.startStepNum, input.endStepNum);
  const hi = Math.max(input.startStepNum, input.endStepNum);
  const rangeStr = lo === hi ? `#${lo}` : `#${lo}–#${hi}`;

  const editingIdx = input.editingId
    ? input.existingGroups.findIndex((g) => g.id === input.editingId)
    : -1;
  const effectiveIdx = editingIdx >= 0 ? editingIdx : input.existingGroups.length;

  let deleteNotice: DestructiveNotice | null = null;
  if (editingIdx >= 0) {
    const grp = input.existingGroups[editingIdx];
    const gLo = Math.min(grp.startStepNum, grp.endStepNum);
    const gHi = Math.max(grp.startStepNum, grp.endStepNum);
    const gRange = gLo === gHi ? `Step #${gLo}` : `Steps #${gLo}–#${gHi}`;
    const themeClause = input.editingGroupThemeName
      ? ` and clears its "${input.editingGroupThemeName}" theme override`
      : '';
    deleteNotice = {
      tone: 'warning',
      message: `Deleting reverts ${gRange} to the manual default grid${themeClause}. Undo is available.`,
      undoable: true,
    };
  }

  const overriddenEarlier: string[] = [];
  const shadowedByLater: string[] = [];

  input.existingGroups.forEach((grp, idx) => {
    if (grp.id === input.editingId) return;
    const gLo = Math.min(grp.startStepNum, grp.endStepNum);
    const gHi = Math.max(grp.startStepNum, grp.endStepNum);
    if (lo <= gHi && hi >= gLo) {
      const label = `"${grp.name}" (${gLo === gHi ? `#${gLo}` : `#${gLo}–#${gHi}`})`;
      if (idx < effectiveIdx) overriddenEarlier.push(label);
      else shadowedByLater.push(label);
    }
  });

  let overlapNotice: DestructiveNotice | null = null;
  if (overriddenEarlier.length > 0 && shadowedByLater.length > 0) {
    overlapNotice = {
      tone: 'warning',
      message: `Range ${rangeStr} overlaps ${formatCompactList(overriddenEarlier, 2)} (overridden by this group) and ${formatCompactList(shadowedByLater, 2)} (takes priority on shared steps).`,
      undoable: true,
    };
  } else if (overriddenEarlier.length > 0) {
    overlapNotice = {
      tone: 'warning',
      message: `Saving overrides ${formatCompactList(overriddenEarlier, 2)} on overlapping steps in ${rangeStr}. Undo is available.`,
      undoable: true,
    };
  } else if (shadowedByLater.length > 0) {
    overlapNotice = {
      tone: 'warning',
      message: `Overlaps ${formatCompactList(shadowedByLater, 2)}, which is listed later and takes priority on shared steps.`,
      undoable: true,
    };
  }

  return { deleteNotice, overlapNotice };
}

/**
 * 13. Divider Page → Page Mode → Delete Page (`#delDividerBtn`).
 */
export function getDeleteDividerDestructiveNotice(input: {
  title?: string | null;
  note?: string | null;
}): DestructiveNotice {
  const title = (input.title || '').trim();
  const note = (input.note || '').trim();
  const hasCustomText =
    note.length > 0 ||
    (title.length > 0 && title !== 'Section Divider' && title !== 'Next Section');
  return {
    tone: 'warning',
    message: hasCustomText
      ? 'Delete Page removes this divider and clears its custom title/note. Undo is available.'
      : 'Removes this inserted divider page. Undo is available.',
    undoable: true,
  };
}

/**
 * 14. Bricks Library → Remove Single Saved Part (`#libPreviewRemoveBtn`).
 */
export function getLibraryRemovePartDestructiveNotice(input: {
  partId: string;
  usedInModel: boolean;
  hasEmbeddedCopy: boolean;
}): DestructiveNotice {
  if (input.usedInModel && !input.hasEmbeddedCopy) {
    return {
      tone: 'danger',
      message: `Permanently deletes ${input.partId}.dat from browser storage — your open model uses it and will fall back to a simplified shape.`,
      undoable: false,
    };
  }
  return {
    tone: 'danger',
    message: `Permanently deletes ${input.partId}.dat from browser storage — cannot be undone.`,
    undoable: false,
  };
}

/**
 * 15. Bricks Library → Clear Entire Saved Library (`#libClearSavedBtn`):
 *     Extra live warning when the currently open model depends on saved library parts.
 */
export function getLibraryClearSavedDestructiveNotice(input: {
  savedFileCount: number;
  modelReliantSavedCount: number;
}): DestructiveNotice | null {
  if (input.savedFileCount <= 0 || input.modelReliantSavedCount <= 0) return null;
  return {
    tone: 'danger',
    message: `Your open model currently renders ${plural(input.modelReliantSavedCount, 'part')} from this Saved Library — clearing switches them to simplified shapes until re-fetched.`,
    undoable: false,
  };
}
