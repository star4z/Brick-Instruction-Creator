import { describe, expect, it } from 'vitest';
import {
  BLANK_STAGE_CLICK_MAX_MOVE_PX,
  CAMERA_ANGLE_PRESETS,
  CAMERA_ROTATION_STEPS,
  FOCUS_MODE_OPTIONS,
  MINIFIG_STYLE_OPTIONS,
  PAPER_FORMAT_ORDER,
  PAPER_FORMAT_SPECS,
  applyCameraAngleToStepRange,
  clampStepModelScale,
  clearStepArrangeOverride,
  clearStepCameraOverride,
  computePaperPreviewBox,
  computeStageOverlayClearance,
  findMatchingCameraPreset,
  getCameraAngleLabel,
  getEditModeButtonLabel,
  getFocusModeDescription,
  getVisibleModeTabs,
  isBlankStageClickTarget,
  isLiveCameraOverlayMode,
  isModalEditPageKind,
  migratePageInsertsToSteps,
  resolveModeForPage,
  resolveStepToolbarCapabilities,
  rotateCameraAzimuth,
  shouldResetModeOnBlankStageClick,
} from '../stepToolbar';

describe('Step Toolbar & Scope-Based Editor Capabilities', () => {
  it('exposes scope-based Pan, Parts, Step, and Page tabs on step pages', () => {
    expect(getVisibleModeTabs('steps')).toEqual(['pan', 'parts', 'step', 'page']);
  });

  it('exposes Pan, Camera, and Page tabs on Cover and Build Complete pages', () => {
    expect(getVisibleModeTabs('cover')).toEqual(['pan', 'camera', 'page']);
    expect(getVisibleModeTabs('complete')).toEqual(['pan', 'camera', 'page']);
  });

  it('exposes Pan and Page tabs on Back Cover, Divider, and Parts List pages', () => {
    expect(getVisibleModeTabs('back')).toEqual(['pan', 'page']);
    expect(getVisibleModeTabs('divider')).toEqual(['pan', 'page']);
    expect(getVisibleModeTabs('bom')).toEqual(['pan', 'page']);
  });

  it('hides mode tabs on unknown or empty page kinds', () => {
    expect(getVisibleModeTabs(null)).toEqual([]);
    expect(getVisibleModeTabs(undefined)).toEqual([]);
    expect(getVisibleModeTabs('section_divider')).toEqual([]);
  });

  it('resolves legacy mode IDs and smoothly maps Camera <-> Step across page kinds', () => {
    // Legacy migrations
    expect(resolveModeForPage('select', 'steps')).toBe('parts');
    expect(resolveModeForPage('rotate', 'steps')).toBe('step');
    expect(resolveModeForPage('rotate', 'cover')).toBe('camera');
    expect(resolveModeForPage('edit', 'steps')).toBe('page');
    expect(resolveModeForPage('edit', 'cover')).toBe('page');
    expect(resolveModeForPage('arrange', 'steps')).toBe('pan');

    // Cross-page transitions preserve camera editing intent
    expect(resolveModeForPage('camera', 'steps')).toBe('step');
    expect(resolveModeForPage('step', 'cover')).toBe('camera');
    expect(resolveModeForPage('step', 'complete')).toBe('camera');
    expect(resolveModeForPage('parts', 'cover')).toBe('pan');
    expect(resolveModeForPage('camera', 'bom')).toBe('pan');
    expect(resolveModeForPage('page', 'bom')).toBe('page');
    expect(resolveModeForPage('page', null)).toBe('pan');
  });

  it('matches arbitrary azimuths (including wrap-around) to the nearest Cube+Camera preset', () => {
    expect(findMatchingCameraPreset(38)?.id).toBe('front_right');
    expect(findMatchingCameraPreset(34)?.id).toBe('front_right'); // default Cover angle
    expect(findMatchingCameraPreset(315)?.id).toBe('front_left'); // default Build Complete angle
    expect(findMatchingCameraPreset(-38)?.id).toBe('front_left'); // negative wrap-around
    expect(findMatchingCameraPreset(502)?.id).toBe('back_right'); // >360 wrap-around (142°)
    expect(findMatchingCameraPreset(90)).toBeNull(); // midway between 38° and 142°
    expect(findMatchingCameraPreset(Number.NaN)).toBeNull();
  });

  it('clamps step 3D model zoom scale cleanly within 50%..220%', () => {
    expect(clampStepModelScale(0.1)).toBe(0.5);
    expect(clampStepModelScale(3.5)).toBe(2.2);
    expect(clampStepModelScale(1.149)).toBe(1.15);
    expect(clampStepModelScale(Number.NaN)).toBe(1.0);
  });

  it('labels the Page mode button as Customize Parts List on BOM pages and opens the Parts List modal directly', () => {
    expect(getEditModeButtonLabel('bom')).toBe('Customize Parts List');
    expect(getEditModeButtonLabel('steps')).toBe('Page');
    expect(getEditModeButtonLabel('cover')).toBe('Page');
    expect(getEditModeButtonLabel('complete')).toBe('Page');
    expect(getEditModeButtonLabel('back')).toBe('Page');
    expect(getEditModeButtonLabel('divider')).toBe('Page');
    expect(getEditModeButtonLabel(null)).toBe('Page');

    expect(isModalEditPageKind('bom')).toBe(true);
    expect(isModalEditPageKind('steps')).toBe(false);
    expect(isModalEditPageKind('cover')).toBe(false);
    expect(isModalEditPageKind('complete')).toBe(false);
    expect(isModalEditPageKind('back')).toBe(false);
    expect(isModalEditPageKind('divider')).toBe(false);
    expect(isModalEditPageKind(undefined)).toBe(false);
  });

  it('recognizes that official Exploded and Step-by-Step minifigure pages have no movable Parts Box', () => {
    const exploded = resolveStepToolbarCapabilities({
      isMinifigBuild: true,
      minifigStyle: 'exploded',
      hasSubassembly: false,
      stepInsertCount: 0,
      totalStepCount: 4,
      followingStepCount: 3,
    });
    expect(exploded.isOfficialMinifigStyle).toBe(true);
    expect(exploded.hasPartsBox).toBe(false);
    expect(exploded.hasMovableElements).toBe(false);
    expect(exploded.showMinifigSettings).toBe(true);
    expect(exploded.canApplyAngleToRange).toBe(true);
    expect(exploded.hasStepLayoutControls).toBe(true);

    const withInsert = resolveStepToolbarCapabilities({
      isMinifigBuild: true,
      minifigStyle: 'sequential',
      hasSubassembly: false,
      stepInsertCount: 1,
      totalStepCount: 1,
      followingStepCount: 0,
    });
    expect(withInsert.hasPartsBox).toBe(false);
    expect(withInsert.hasMovableElements).toBe(true);
    expect(withInsert.canApplyAngleToRange).toBe(false);
  });

  it('enables Parts Box controls for Classic minifigure steps and standard build steps', () => {
    const classicMf = resolveStepToolbarCapabilities({
      isMinifigBuild: true,
      minifigStyle: 'classic',
      hasSubassembly: false,
      stepInsertCount: 0,
      totalStepCount: 3,
      followingStepCount: 2,
      canMergeWithPrev: true,
    });
    expect(classicMf.isOfficialMinifigStyle).toBe(false);
    expect(classicMf.hasPartsBox).toBe(true);
    expect(classicMf.hasMovableElements).toBe(true);
    expect(classicMf.showMinifigSettings).toBe(true);
    expect(classicMf.canMergeWithPrev).toBe(true);

    const subCallout = resolveStepToolbarCapabilities({
      isMinifigBuild: false,
      minifigStyle: 'exploded',
      hasSubassembly: true,
      override: { calloutAsPages: false },
      stepInsertCount: 0,
      totalStepCount: 6,
      followingStepCount: 5,
    });
    expect(subCallout.hasPartsBox).toBe(false);
    expect(subCallout.hasMovableCallout).toBe(true);
    expect(subCallout.hasMovableElements).toBe(true);
    expect(subCallout.showSubassemblySettings).toBe(true);

    const subPages = resolveStepToolbarCapabilities({
      isMinifigBuild: false,
      minifigStyle: 'exploded',
      hasSubassembly: true,
      override: { calloutAsPages: true },
      stepInsertCount: 0,
      totalStepCount: 6,
      followingStepCount: 5,
    });
    expect(subPages.hasPartsBox).toBe(true);
    expect(subPages.hasMovableCallout).toBe(false);

    const dividerOnly = resolveStepToolbarCapabilities({
      isMinifigBuild: false,
      minifigStyle: 'exploded',
      hasSubassembly: false,
      stepInsertCount: 0,
      totalStepCount: 1,
      followingStepCount: 0,
      canMergeWithPrev: false,
      canInsertDividerAfterPage: true,
    });
    expect(dividerOnly.canInsertDividerAfterPage).toBe(true);
    expect(dividerOnly.hasStepLayoutControls).toBe(true);
  });

  it('detects custom camera angle, zoom, framing, and arrange layouts independently', () => {
    const caps = resolveStepToolbarCapabilities({
      isMinifigBuild: false,
      minifigStyle: 'exploded',
      hasSubassembly: false,
      override: { az: 145, el: 25, pliScale: 1.2 },
      stepInsertCount: 0,
      totalStepCount: 2,
      followingStepCount: 1,
    });
    expect(caps.hasCustomCameraAngle).toBe(true);
    expect(caps.hasCustomModelZoom).toBe(false);
    expect(caps.hasCustomFocusMode).toBe(false);
    expect(caps.hasCustomCameraAny).toBe(true);
    expect(caps.hasCustomArrangeLayout).toBe(true);

    const zoomOnly = resolveStepToolbarCapabilities({
      isMinifigBuild: false,
      minifigStyle: 'exploded',
      hasSubassembly: false,
      override: { focusMode: 'focus', modelScale: 1.3, pin: true },
      stepInsertCount: 0,
      totalStepCount: 2,
      followingStepCount: 1,
    });
    expect(zoomOnly.hasCustomCameraAngle).toBe(false);
    expect(zoomOnly.hasCustomModelZoom).toBe(true);
    expect(zoomOnly.hasCustomFocusMode).toBe(true);
    expect(zoomOnly.hasCustomCameraAny).toBe(true);
    expect(zoomOnly.hasCustomArrangeLayout).toBe(false);
  });

  it('clears camera angle fields and optionally clears zoom & framing without disturbing layout or page breaks', () => {
    const ov = {
      side: 'bottom',
      corner: 'back_left',
      az: 225,
      el: -30,
      focusMode: 'focus',
      modelScale: 1.4,
      pliPos: { x: 20, y: 15 },
      pin: true,
    };

    expect(clearStepCameraOverride(ov)).toEqual({
      focusMode: 'focus',
      modelScale: 1.4,
      pliPos: { x: 20, y: 15 },
      pin: true,
    });

    expect(clearStepCameraOverride(ov, true)).toEqual({
      pliPos: { x: 20, y: 15 },
      pin: true,
    });
  });

  it('resets only arrange box offsets and PLI scale without disturbing camera or page breaks', () => {
    const next = clearStepArrangeOverride({
      az: 120,
      el: 35,
      modelScale: 1.25,
      pliPos: { x: 40, y: 12 },
      pliScale: 1.3,
      calloutPos: { x: -10, y: 8 },
      pin: true,
    });
    expect(next).toEqual({
      az: 120,
      el: 35,
      modelScale: 1.25,
      pliPos: { x: 0, y: 0 },
      pliScale: 1,
      calloutPos: { x: 0, y: 0 },
      pin: true,
    });
  });

  it('uses neutral camera angle presets (no arbitrary Front/Back naming) while preserving legacy corner IDs', () => {
    expect(CAMERA_ANGLE_PRESETS.map((c) => c.id)).toEqual([
      'front_right',
      'back_right',
      'back_left',
      'front_left',
    ]);
    for (const c of CAMERA_ANGLE_PRESETS) {
      expect(c.label.toLowerCase()).not.toContain('front');
      expect(c.label.toLowerCase()).not.toContain('back');
    }
    expect(getCameraAngleLabel('back_right')).toBe('135°');
  });

  it('provides relative camera rotation steps (−90°, −45°, +45°, +90°, 180°) and wrap-safe azimuth math', () => {
    expect(CAMERA_ROTATION_STEPS.map((s) => s.deltaDeg)).toEqual([-90, -45, 45, 90, 180]);
    expect(CAMERA_ROTATION_STEPS.map((s) => s.label)).toEqual(['−90°', '−45°', '+45°', '+90°', '180°']);

    // Basic relative rotation from default isometric 38°
    expect(rotateCameraAzimuth(38, 90)).toBe(128);
    expect(rotateCameraAzimuth(38, -90)).toBe(308);
    expect(rotateCameraAzimuth(38, 45)).toBe(83);
    expect(rotateCameraAzimuth(38, -45)).toBe(353);
    expect(rotateCameraAzimuth(38, 180)).toBe(218);

    // Exact reversibility and full 360° loop from any arbitrary drag-orbited angle
    const start = 17;
    const afterPlus90 = rotateCameraAzimuth(start, 90);
    expect(rotateCameraAzimuth(afterPlus90, -90)).toBe(start);
    let az = start;
    for (let i = 0; i < 4; i++) az = rotateCameraAzimuth(az, 90);
    expect(az).toBe(start);

    // Wrap boundaries and non-finite fallbacks
    expect(rotateCameraAzimuth(350, 45)).toBe(35);
    expect(rotateCameraAzimuth(10, -45)).toBe(325);
    expect(rotateCameraAzimuth(0, 360)).toBe(0);
    expect(rotateCameraAzimuth(Number.NaN, 90)).toBe(90);
    expect(rotateCameraAzimuth(38, Number.NaN)).toBe(38);
  });

  it('applies camera angle (and optional zoom & framing) cleanly across any inclusive step range', () => {
    const steps = [
      { id: 's1', num: 1 },
      { id: 's2', num: 2 },
      { id: 's3', num: 3 },
      { id: 's4', num: 4 },
      { id: 's5', num: 5 },
    ];
    const res = applyCameraAngleToStepRange(
      steps,
      { s2: { modelScale: 1.2 } },
      4,
      2, // reversed order should still normalize cleanly
      { side: 'bottom', corner: 'back_left', az: 218, el: -30 },
    );
    expect(res.appliedCount).toBe(3);
    expect(res.overrides.s1).toBeUndefined();
    expect(res.overrides.s2).toEqual({ modelScale: 1.2, side: 'bottom', corner: 'back_left', az: 218, el: -30 });
    expect(res.overrides.s3).toEqual({ side: 'bottom', corner: 'back_left', az: 218, el: -30 });
    expect(res.overrides.s4).toEqual({ side: 'bottom', corner: 'back_left', az: 218, el: -30 });
    expect(res.overrides.s5).toBeUndefined();

    const withFraming = applyCameraAngleToStepRange(
      steps,
      {},
      2,
      3,
      { side: 'top', corner: 'front_right', az: 38, el: 29, modelScale: 1.4, focusMode: 'focus' },
    );
    expect(withFraming.appliedCount).toBe(2);
    expect(withFraming.overrides.s2).toEqual({
      side: 'top',
      corner: 'front_right',
      az: 38,
      el: 29,
      modelScale: 1.4,
      focusMode: 'focus',
    });
    expect(withFraming.overrides.s3?.modelScale).toBe(1.4);
    expect(withFraming.overrides.s3?.focusMode).toBe('focus');
  });

  it('applies camera ranges by absolute step number so submodel steps with the same printed number are not included', () => {
    // Minifigures steps 1–3 (abs 1–3), then Front Half submodel restarts at Step 1 (abs 4–6).
    const steps = [
      { id: 'mf1', num: 1, absNum: 1 },
      { id: 'mf2', num: 2, absNum: 2 },
      { id: 'mf3', num: 3, absNum: 3 },
      { id: 'fh1', num: 1, absNum: 4 },
      { id: 'fh2', num: 2, absNum: 5 },
      { id: 'fh3', num: 3, absNum: 6 },
    ];
    const res = applyCameraAngleToStepRange(steps, {}, 1, 2, { side: 'top', corner: 'front_right', az: 38, el: 29 });
    expect(res.appliedCount).toBe(2);
    expect(Object.keys(res.overrides).sort()).toEqual(['mf1', 'mf2']);
  });

  it('computes accurate paper format preview box proportions for landscape, portrait, A4, A5, and square', () => {
    expect(PAPER_FORMAT_ORDER).toContain('letter');
    expect(PAPER_FORMAT_ORDER).toContain('a4');
    expect(PAPER_FORMAT_ORDER).toContain('a5');
    expect(PAPER_FORMAT_ORDER).toContain('b5');
    expect(PAPER_FORMAT_ORDER).toContain('tabloid');
    expect(PAPER_FORMAT_SPECS.a5.supportsOrientation).toBe(true);

    const letterLand = computePaperPreviewBox({ paperFormat: 'letter', orientation: 'landscape', maxWidthPx: 80, maxHeightPx: 64 });
    expect(letterLand.isLandscape).toBe(true);
    expect(letterLand.widthPx).toBeGreaterThan(letterLand.heightPx);
    expect(letterLand.widthIn).toBe(11);
    expect(letterLand.heightIn).toBe(8.5);

    const letterPort = computePaperPreviewBox({ paperFormat: 'letter', orientation: 'portrait', maxWidthPx: 80, maxHeightPx: 64 });
    expect(letterPort.isLandscape).toBe(false);
    expect(letterPort.heightPx).toBeGreaterThan(letterPort.widthPx);

    const a4Port = computePaperPreviewBox({ paperFormat: 'a4', orientation: 'portrait', maxWidthPx: 80, maxHeightPx: 64 });
    // A4 portrait is taller/narrower than US Letter portrait
    expect(a4Port.widthPx / a4Port.heightPx).toBeLessThan(letterPort.widthPx / letterPort.heightPx);

    const sq = computePaperPreviewBox({ paperFormat: 'square', orientation: 'landscape', maxWidthPx: 80, maxHeightPx: 64 });
    expect(sq.widthPx).toBe(sq.heightPx);
    expect(sq.ratioLabel).toBe('1 : 1');
  });

  it('migrates legacy page-keyed custom callouts to step-keyed custom callouts without duplicates', () => {
    const migrated = migratePageInsertsToSteps(
      {
        pg_1: [{ id: 'ins1', kind: 'text', text: 'Press firmly', x: 20, y: 30, scale: 1 }],
      },
      {
        s1: [{ id: 'ins0', kind: 'text', text: 'Existing step note', corner: 'top-right', scale: 1 }],
      },
      [{ id: 'pg_1', kind: 'steps', slots: [{ step: { id: 's1' } }, { step: { id: 's2' } }] }],
    );
    expect(migrated.s1).toHaveLength(2);
    expect(migrated.s1[1].id).toBe('ins1');
    expect(migrated.s1[1].corner).toBe('bottom-right');
  });

  it('provides descriptive metadata for all minifigure styles and framing modes', () => {
    expect(MINIFIG_STYLE_OPTIONS.map((o) => o.id)).toEqual(['exploded', 'sequential', 'classic']);
    expect(FOCUS_MODE_OPTIONS.map((o) => o.id)).toEqual(['auto', 'focus', 'full']);
    for (const opt of [...MINIFIG_STYLE_OPTIONS, ...FOCUS_MODE_OPTIONS]) {
      expect(opt.label.length).toBeGreaterThan(2);
      expect(opt.description.length).toBeGreaterThan(15);
    }
    expect(getFocusModeDescription('focus')).toContain('Zooms closely');
    expect(getFocusModeDescription(undefined)).toContain('Automatically');
  });

  it('distinguishes blank stage space outside #pageFrame from document and floating chrome targets', () => {
    const stepSlot = { id: 'stepSlot' };
    const pageFrame = {
      id: 'pageFrame',
      contains: (n: unknown) => n === pageFrame || n === stepSlot,
    };
    const stageContainer = {
      id: 'stageContainer',
      contains: (n: unknown) => n === stageContainer || pageFrame.contains(n),
    };
    const stage = {
      id: 'stageViewport',
      contains: (n: unknown) => n === stage || stageContainer.contains(n),
    };
    const bottomDock = { id: 'bottomDock' };
    const contextCard = { id: 'contextCard' };

    // Blank space inside #stageViewport but outside #pageFrame
    expect(isBlankStageClickTarget(stage, stage, pageFrame)).toBe(true);
    expect(isBlankStageClickTarget(stageContainer, stage, pageFrame)).toBe(true);

    // Inside the document (#pageFrame or its descendants)
    expect(isBlankStageClickTarget(pageFrame, stage, pageFrame)).toBe(false);
    expect(isBlankStageClickTarget(stepSlot, stage, pageFrame)).toBe(false);

    // Floating UI siblings outside #stageViewport
    expect(isBlankStageClickTarget(bottomDock, stage, pageFrame)).toBe(false);
    expect(isBlankStageClickTarget(contextCard, stage, pageFrame)).toBe(false);
    expect(isBlankStageClickTarget(null, stage, pageFrame)).toBe(false);
    expect(isBlankStageClickTarget(stage, null, pageFrame)).toBe(false);
  });

  it('switches Parts, Step, Page, and Camera modes back to Pan on a clean blank-stage click', () => {
    const base = {
      hasModel: true,
      startedInBlankSpace: true,
      endedInBlankSpace: true,
      movedPx: 0,
      isPrimaryButton: true,
      wasMultiTouch: false,
      dismissedTransientOverlay: false,
    };

    // Step pages: Parts, Step, and Page all switch back to Pan
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'steps', mode: 'parts' })).toBe(true);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'steps', mode: 'step' })).toBe(true);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'steps', mode: 'page' })).toBe(true);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'steps', mode: 'pan' })).toBe(false);

    // Cover & Build Complete pages: Camera and Page switch back to Pan
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'cover', mode: 'camera' })).toBe(true);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'cover', mode: 'page' })).toBe(true);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'complete', mode: 'camera' })).toBe(true);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'complete', mode: 'page' })).toBe(true);

    // Back Cover & Divider pages: Page switches back to Pan
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'back', mode: 'page' })).toBe(true);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'divider', mode: 'page' })).toBe(true);

    // Slight click/tap jitter within threshold still resets
    expect(
      shouldResetModeOnBlankStageClick({
        ...base,
        pageKind: 'steps',
        mode: 'step',
        movedPx: BLANK_STAGE_CLICK_MAX_MOVE_PX,
      }),
    ).toBe(true);
  });

  it('ignores drags, cross-boundary releases, multi-touch pinch, right-clicks, and popover dismissals', () => {
    const base = {
      hasModel: true,
      pageKind: 'steps',
      mode: 'step',
      startedInBlankSpace: true,
      endedInBlankSpace: true,
      movedPx: 0,
      isPrimaryButton: true,
      wasMultiTouch: false,
      dismissedTransientOverlay: false,
    };

    expect(shouldResetModeOnBlankStageClick({ ...base, hasModel: false })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: 'section_divider' })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, pageKind: null })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, startedInBlankSpace: false })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, endedInBlankSpace: false })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, movedPx: BLANK_STAGE_CLICK_MAX_MOVE_PX + 0.5 })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, movedPx: Number.NaN })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, isPrimaryButton: false })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, wasMultiTouch: true })).toBe(false);
    expect(shouldResetModeOnBlankStageClick({ ...base, dismissedTransientOverlay: true })).toBe(false);
  });

  it('identifies live camera overlay modes across Step, Cover, and Build Complete pages', () => {
    expect(isLiveCameraOverlayMode('steps', 'step', 'camera')).toBe(true);
    expect(isLiveCameraOverlayMode('steps', 'step', undefined)).toBe(true);
    expect(isLiveCameraOverlayMode('steps', 'step', 'layout')).toBe(false);
    expect(isLiveCameraOverlayMode('steps', 'step', 'notes')).toBe(false);
    expect(isLiveCameraOverlayMode('steps', 'pan', 'camera')).toBe(false);
    expect(isLiveCameraOverlayMode('steps', 'parts', 'camera')).toBe(false);
    expect(isLiveCameraOverlayMode('cover', 'camera', 'camera')).toBe(true);
    expect(isLiveCameraOverlayMode('complete', 'camera', 'camera')).toBe(true);
    expect(isLiveCameraOverlayMode('cover', 'page', 'camera')).toBe(false);
    expect(isLiveCameraOverlayMode('bom', 'page', 'camera')).toBe(false);
  });

  it('computes mobile stage clearance so the entire page fits unobstructed above the camera overlay', () => {
    // Simulated iPhone portrait viewport (390x664) with compact 92px camera bar
    const mobileCompact = computeStageOverlayClearance({
      isCameraOverlayOpen: true,
      stageWidth: 390,
      stageHeight: 664,
      stagePaddingTop: 104,
      stagePaddingX: 24,
      defaultPaddingBottom: 112,
      overlayBottomOffset: 114,
      overlayHeight: 92,
      pageWidth: 740,
      pageHeight: 960,
      baseFitScale: 0.48,
      gapPx: 10,
    });
    expect(mobileCompact.active).toBe(true);
    expect(mobileCompact.paddingBottomPx).toBe(216);
    // Remaining height = 664 - 104 - 216 = 344px; scaled page height <= 344px!
    expect(mobileCompact.fitScale * 960).toBeLessThanOrEqual(344.5);
    expect(mobileCompact.fitScale).toBeGreaterThan(0.34);

    // When expanded on mobile (220px overlay), page scales down further to stay unobstructed
    const mobileExpanded = computeStageOverlayClearance({
      isCameraOverlayOpen: true,
      stageWidth: 390,
      stageHeight: 664,
      stagePaddingTop: 104,
      stagePaddingX: 24,
      defaultPaddingBottom: 112,
      overlayBottomOffset: 114,
      overlayHeight: 220,
      pageWidth: 740,
      pageHeight: 960,
      baseFitScale: 0.48,
      gapPx: 10,
    });
    expect(mobileExpanded.active).toBe(true);
    expect(mobileExpanded.paddingBottomPx).toBe(344);
    expect(mobileExpanded.fitScale).toBeLessThan(mobileCompact.fitScale);
    expect(mobileExpanded.fitScale * 960).toBeLessThanOrEqual(216.5);

    // When camera overlay is closed, restores default stylesheet padding and baseFitScale
    const closed = computeStageOverlayClearance({
      isCameraOverlayOpen: false,
      stageWidth: 390,
      stageHeight: 664,
      stagePaddingTop: 104,
      stagePaddingX: 24,
      defaultPaddingBottom: 112,
      overlayBottomOffset: 114,
      overlayHeight: 92,
      pageWidth: 740,
      pageHeight: 960,
      baseFitScale: 0.48,
    });
    expect(closed).toEqual({ active: false, paddingBottomPx: null, fitScale: 0.48 });
  });
});

