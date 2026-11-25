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
import type { StepOverrideLike } from './stepToolbar';
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
  /** Labels for edits made outside the Parts tab (camera, Parts Box, page break, callout, notes). */
  nonPartLabels: string[];
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
  hasCustomCoverText: boolean;
  hasCustomCompleteText: boolean;
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

  const nonPartLabels: string[] = [];
  if (hasCameraAny) nonPartLabels.push('custom camera');
  if (hasPliScale) nonPartLabels.push('Parts Box size');
  if (hasPageBreak) nonPartLabels.push('page break');
  if (hasCalloutOverride) nonPartLabels.push('callout layout');
  if (safeInserts > 0) nonPartLabels.push(plural(safeInserts, 'note'));
  if (hasSubassembly) nonPartLabels.push('subassembly callout');

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
    nonPartLabels,
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
  const hasCustomCoverText = hasCustomCoverTitle || hasCustomCoverSub;

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
    hasCustomCoverText ||
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
    hasCustomCoverText,
    hasCustomCompleteText,
    hasCoverOrExtraPageEdits,
    items,
    stepItems,
    hasAnyEdits: items.length > 0,
    hasStepOrLayoutEdits: stepItems.length > 0,
  };
}

/**
 * 1. Apply Camera to Steps modal: warns ONLY when other steps inside the selected range
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
 * 2. Wordless Instructions toggle: warns ONLY when the user has customized extra-page
 *    text/page-number settings or edited custom Cover/Build Complete titles that toggling
 *    Wordless mode will reset or hide. Untouched defaults show no warning.
 */
export function getWordlessToggleDestructiveNotice(input: {
  currentWordless: boolean;
  coverShowText: boolean;
  completeShowText: boolean;
  bomShowTextFields: boolean;
  pageNumberFormat: string | undefined;
  hasCustomCoverText?: boolean;
  hasCustomCompleteText?: boolean;
}): DestructiveNotice | null {
  const curDefs = getWordlessSurfaceDefaults(input.currentWordless);
  const nextWordless = !input.currentWordless;
  const nextDefs = getWordlessSurfaceDefaults(nextWordless);
  const nextPgFmt = resolvePageNumberFormatForMode(input.pageNumberFormat, nextWordless);

  const hasCustomizedSurfaceToggle =
    input.coverShowText !== curDefs.coverShowText ||
    input.completeShowText !== curDefs.completeShowText ||
    input.bomShowTextFields !== curDefs.bomShowTextFields;

  const pageNumChanges = Boolean(input.pageNumberFormat && nextPgFmt !== input.pageNumberFormat);

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

  // Case A: Turning Wordless ON will hide custom Cover or Build Complete text the user edited
  const hiddenCustomTitles: string[] = [];
  if (nextWordless) {
    if (input.hasCustomCoverText && input.coverShowText) {
      hiddenCustomTitles.push('custom Front Cover title/subtitle');
    }
    if (input.hasCustomCompleteText && input.completeShowText) {
      hiddenCustomTitles.push('custom Build Complete text');
    }
  }

  // Only warn if user actually made custom overrides or custom cover/complete text
  if (!hasCustomizedSurfaceToggle && hiddenCustomTitles.length === 0) {
    return null;
  }

  if (changedTextSurfaces.length === 0 && !pageNumChanges && hiddenCustomTitles.length === 0) {
    return null;
  }

  if (nextWordless) {
    if (hiddenCustomTitles.length > 0 && !hasCustomizedSurfaceToggle) {
      return {
        tone: 'warning',
        message: `Turning on hides your ${formatCompactList(hiddenCustomTitles, 2)}. Undo is available.`,
        undoable: true,
      };
    }
    const items = [...hiddenCustomTitles];
    for (const s of changedTextSurfaces) {
      if (s === 'Front Cover title' && hiddenCustomTitles.some((x) => x.includes('Front Cover'))) {
        continue;
      }
      if (s === 'Build Complete text' && hiddenCustomTitles.some((x) => x.includes('Build Complete'))) {
        continue;
      }
      items.push(s);
    }
    if (items.length > 0 && pageNumChanges) {
      return {
        tone: 'warning',
        message: `Turning on resets extra-page text overrides (hides ${formatCompactList(items, 3)}) and switches page numbers to 1. Undo is available.`,
        undoable: true,
      };
    }
    if (items.length > 0) {
      return {
        tone: 'warning',
        message: `Turning on resets extra-page text overrides (hides ${formatCompactList(items, 3)}). Undo is available.`,
        undoable: true,
      };
    }
    if (pageNumChanges) {
      return {
        tone: 'warning',
        message: 'Turning on switches page numbers from Page 1 to 1. Undo is available.',
        undoable: true,
      };
    }
    return null;
  }

  // Turning Wordless OFF after the user customized one or more extra-page toggles in Wordless mode
  if (changedTextSurfaces.length > 0 && pageNumChanges) {
    return {
      tone: 'warning',
      message: `Turning off resets your extra-page text overrides (enables ${formatCompactList(changedTextSurfaces, 3)}) and switches page numbers to Page 1. Undo is available.`,
      undoable: true,
    };
  }
  if (changedTextSurfaces.length > 0) {
    return {
      tone: 'warning',
      message: `Turning off resets your extra-page text overrides (enables ${formatCompactList(changedTextSurfaces, 3)}). Undo is available.`,
      undoable: true,
    };
  }
  if (pageNumChanges) {
    return {
      tone: 'warning',
      message: 'Turning off switches page numbers from 1 to Page 1. Undo is available.',
      undoable: true,
    };
  }
  return null;
}

/**
 * 3. Step Mode → Layout → Merge into Step N-1 (`#stepMergePrevBtn`):
 *    Warns ONLY when the step being merged has overrides or notes made in other tabs
 *    (camera, part nudges, Parts Box size, page break, callout layout, notes, or subassembly)
 *    that merging will silently clear.
 */
export function getMergeStepDestructiveNotice(input: {
  stepNum: number;
  override: StepOverrideWithPartsLike | null | undefined;
  insertCount: number;
  hasSubassembly: boolean;
  defaultPartOffsets?: Record<string, PartOffsetLike> | null;
}): DestructiveNotice | null {
  const sum = summarizeStepOverrides(
    input.override,
    input.insertCount,
    input.hasSubassembly,
    input.defaultPartOffsets,
  );
  if (!sum.hasAny) return null;
  return {
    tone: 'warning',
    message: `Merging clears Step ${input.stepNum}'s ${formatCompactList(sum.labels, 4)}. Undo is available.`,
    undoable: true,
  };
}

/**
 * 4. Parts Mode → Move to Step… (`#actMoveStep`):
 *    Warns ONLY when ALL parts in the step are selected AND the step has overrides made
 *    outside the Parts tab (camera, Parts Box size, page break, callout layout, notes, or
 *    subassembly) that deleting the emptied step would silently clear.
 */
export function getPartsMoveStepDestructiveNotice(input: {
  stepNum: number;
  totalPartsInStep: number;
  selectedPartCount: number;
  override: StepOverrideWithPartsLike | null | undefined;
  defaultPartOffsets?: Record<string, PartOffsetLike> | null;
  insertCount: number;
  hasSubassembly: boolean;
}): DestructiveNotice | null {
  if (input.totalPartsInStep <= 0 || input.selectedPartCount < input.totalPartsInStep) {
    return null;
  }
  const sum = summarizeStepOverrides(
    input.override,
    input.insertCount,
    input.hasSubassembly,
    input.defaultPartOffsets,
  );
  if (sum.nonPartLabels.length === 0) return null;
  return {
    tone: 'warning',
    message: `All parts selected: Move to Step… removes Step ${input.stepNum} and clears its ${formatCompactList(sum.nonPartLabels, 4)}. Undo is available.`,
    undoable: true,
  };
}

/**
 * 5. Step Generation / Import Assistant Modal (`#importModal` → `#impBtnAuto` & `#impBtnKeep`):
 *    - New import (not undoable): warns when replacing an open manual that has unsaved edits or Undo history.
 *    - Post-import (undoable): warns ONLY when existing step/layout overrides or custom Wordless text
 *      overrides made elsewhere will be cleared or shifted.
 */
export function getStepGenerationDestructiveNotice(input: {
  isPostImport: boolean;
  hasOpenModel: boolean;
  openModelTitle?: string | null;
  editsSummary: ManualEditsSummary;
  undoHistoryCount?: number;
  wordlessResetNotice?: DestructiveNotice | null;
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
    if ((input.undoHistoryCount || 0) > 0) {
      return {
        tone: 'danger',
        message: `Replaces "${title}" and permanently discards unsaved session changes and Undo history — cannot be undone.`,
        undoable: false,
      };
    }
    return null;
  }

  const affected = [...input.editsSummary.stepItems];
  if (input.wordlessResetNotice) {
    affected.push('custom extra-page text overrides');
  }

  if (affected.length === 0) return null;

  if (input.isKeepStepsAction) {
    return {
      tone: 'warning',
      message: `Keeping file steps replaces generated steps and may clear or shift ${formatCompactList(affected, 4)}. Undo is available.`,
      undoable: true,
    };
  }

  return {
    tone: 'warning',
    message: `Regenerating rebuilds all steps and may clear or shift ${formatCompactList(affected, 4)}. Undo is available.`,
    undoable: true,
  };
}

/**
 * 6. Menu Drawer → Close Model (`#menuCloseModelBtn`, NOT undoable):
 *    Warns when the open manual has unsaved edits or Undo history that closing will permanently clear.
 */
export function getCloseModelDestructiveNotice(input: {
  editsSummary: ManualEditsSummary;
  undoHistoryCount?: number;
}): DestructiveNotice | null {
  if (input.editsSummary.hasAnyEdits) {
    return {
      tone: 'danger',
      message: `Permanently clears unsaved edits (${formatCompactList(input.editsSummary.items, 4)}) and Undo history — cannot be undone. Export .biw first to save.`,
      undoable: false,
    };
  }
  if ((input.undoHistoryCount || 0) > 0) {
    return {
      tone: 'danger',
      message: 'Permanently discards unsaved session changes and clears Undo history — cannot be undone. Export .biw first to save.',
      undoable: false,
    };
  }
  return null;
}

/**
 * 7. Open / Import Model or Project dialog (`#openModelModal`) & Missing Parts modal (NOT undoable):
 *    Warns when an open manual has unsaved edits or Undo history that importing another file will discard.
 */
export function getReplaceModelModalDestructiveNotice(input: {
  hasOpenModel: boolean;
  modelTitle?: string | null;
  editsSummary: ManualEditsSummary;
  undoHistoryCount?: number;
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
  if ((input.undoHistoryCount || 0) > 0) {
    return {
      tone: 'danger',
      message: `Opening another file replaces "${title}" and permanently discards unsaved session changes and Undo history. Export .biw first to keep them.`,
      undoable: false,
    };
  }
  return null;
}

/**
 * 8. Style Popover → Delete Custom Theme (`#btnDeleteTheme`, NOT undoable):
 *    Built-in themes return null (button disabled). Custom themes always warn that deletion
 *    is permanent and cannot be undone, and name any Step Range Groups whose theme override
 *    will also be cleared.
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
      message: `Deleting "${input.themeName}" permanently removes it from browser storage and clears the theme override on ${plural(refs.length, 'Step Range Group')} (${formatCompactList(refs, 2)}) — cannot be undone.`,
      undoable: false,
    };
  }
  return {
    tone: 'danger',
    message: `Deleting "${input.themeName}" permanently removes it from browser storage — cannot be undone. Export first to keep a backup.`,
    undoable: false,
  };
}

/**
 * 9. Page Setup → Step Range Group Editor (`#layoutGroupEditor`, undoable):
 *    Warns ONLY when the step range overlaps another existing Step Range Group.
 */
export function getLayoutGroupOverlapDestructiveNotice(input: {
  editingId: string | null;
  startStepNum: number;
  endStepNum: number;
  existingGroups: ReadonlyArray<StepLayoutGroup>;
}): DestructiveNotice | null {
  const lo = Math.min(input.startStepNum, input.endStepNum);
  const hi = Math.max(input.startStepNum, input.endStepNum);
  const rangeStr = lo === hi ? `#${lo}` : `#${lo}–#${hi}`;

  const editingIdx = input.editingId
    ? input.existingGroups.findIndex((g) => g.id === input.editingId)
    : -1;
  const effectiveIdx = editingIdx >= 0 ? editingIdx : input.existingGroups.length;

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

  if (overriddenEarlier.length > 0 && shadowedByLater.length > 0) {
    return {
      tone: 'warning',
      message: `Range ${rangeStr} overlaps ${formatCompactList(overriddenEarlier, 2)} (overridden by this group) and ${formatCompactList(shadowedByLater, 2)} (takes priority on shared steps).`,
      undoable: true,
    };
  }
  if (overriddenEarlier.length > 0) {
    return {
      tone: 'warning',
      message: `Saving overrides ${formatCompactList(overriddenEarlier, 2)} on overlapping steps in ${rangeStr}. Undo is available.`,
      undoable: true,
    };
  }
  if (shadowedByLater.length > 0) {
    return {
      tone: 'warning',
      message: `Overlaps ${formatCompactList(shadowedByLater, 2)}, which is listed later and takes priority on shared steps.`,
      undoable: true,
    };
  }
  return null;
}

/**
 * 10. Bricks Library → Remove Single Saved Part (`#libPreviewRemoveBtn`, NOT undoable):
 *     Immediately deletes the saved part from browser storage with no Undo — always warns,
 *     and calls out when the open model relies on it.
 */
export function getLibraryRemovePartDestructiveNotice(input: {
  partId: string;
  usedInModel: boolean;
  hasEmbeddedCopy: boolean;
}): DestructiveNotice {
  if (input.usedInModel && !input.hasEmbeddedCopy) {
    return {
      tone: 'danger',
      message: `Permanently removes ${input.partId}.dat from browser storage — cannot be undone. Your open model uses it and will switch to a simplified shape.`,
      undoable: false,
    };
  }
  return {
    tone: 'danger',
    message: `Permanently removes ${input.partId}.dat from browser storage — cannot be undone.`,
    undoable: false,
  };
}

/**
 * 11. Bricks Library → Clear Entire Saved Library (`#libClearSavedBtn`, NOT undoable):
 *     Supplements the danger section description & confirmation with a live notice when
 *     the currently open model relies on saved library parts.
 */
export function getLibraryClearSavedDestructiveNotice(input: {
  savedFileCount: number;
  modelReliantSavedCount: number;
}): DestructiveNotice | null {
  if (input.savedFileCount <= 0 || input.modelReliantSavedCount <= 0) return null;
  return {
    tone: 'danger',
    message: `Your open model currently renders ${plural(input.modelReliantSavedCount, 'part')} from this Saved Library — clearing switches them to simplified shapes and cannot be undone.`,
    undoable: false,
  };
}
