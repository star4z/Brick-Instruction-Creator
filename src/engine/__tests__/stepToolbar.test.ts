import { describe, expect, it } from 'vitest';
import {
  CAMERA_ANGLE_PRESETS,
  FOCUS_MODE_OPTIONS,
  MINIFIG_STYLE_OPTIONS,
  PAPER_FORMAT_ORDER,
  PAPER_FORMAT_SPECS,
  applyCameraAngleToStepRange,
  clearStepArrangeOverride,
  clearStepCameraOverride,
  computePaperPreviewBox,
  getCameraAngleLabel,
  getEditModeButtonLabel,
  getFocusModeDescription,
  getVisibleModeTabs,
  isModalEditPageKind,
  migratePageInsertsToSteps,
  resolveStepToolbarCapabilities,
} from '../stepToolbar';

describe('Step Toolbar & Full-Page Editor Capabilities', () => {
  it('exposes Pan, Select, Rotate, and Edit tabs on step pages (Arrange removed)', () => {
    expect(getVisibleModeTabs('steps')).toEqual(['pan', 'select', 'rotate', 'edit']);
  });

  it('exposes Pan and Edit tabs on cover, build complete, back cover, divider, and Parts List pages', () => {
    expect(getVisibleModeTabs('cover')).toEqual(['pan', 'edit']);
    expect(getVisibleModeTabs('complete')).toEqual(['pan', 'edit']);
    expect(getVisibleModeTabs('back')).toEqual(['pan', 'edit']);
    expect(getVisibleModeTabs('divider')).toEqual(['pan', 'edit']);
    expect(getVisibleModeTabs('bom')).toEqual(['pan', 'edit']);
  });

  it('hides mode tabs on unknown or empty page kinds', () => {
    expect(getVisibleModeTabs(null)).toEqual([]);
    expect(getVisibleModeTabs(undefined)).toEqual([]);
  });

  it('labels the Edit mode button as Customize Parts List on BOM pages and opens modal editors directly on steps and BOM pages', () => {
    expect(getEditModeButtonLabel('bom')).toBe('Customize Parts List');
    expect(getEditModeButtonLabel('steps')).toBe('Edit');
    expect(getEditModeButtonLabel('cover')).toBe('Edit');
    expect(getEditModeButtonLabel('complete')).toBe('Edit');
    expect(getEditModeButtonLabel('back')).toBe('Edit');
    expect(getEditModeButtonLabel('divider')).toBe('Edit');
    expect(getEditModeButtonLabel(null)).toBe('Edit');

    expect(isModalEditPageKind('bom')).toBe(true);
    expect(isModalEditPageKind('steps')).toBe(true);
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
    });
    expect(classicMf.isOfficialMinifigStyle).toBe(false);
    expect(classicMf.hasPartsBox).toBe(true);
    expect(classicMf.hasMovableElements).toBe(true);
    expect(classicMf.showMinifigSettings).toBe(true);

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
  });

  it('detects custom camera angles and custom arrange layouts independently', () => {
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
    expect(caps.hasCustomArrangeLayout).toBe(true);

    const clean = resolveStepToolbarCapabilities({
      isMinifigBuild: false,
      minifigStyle: 'exploded',
      hasSubassembly: false,
      override: { focusMode: 'focus', modelScale: 1.3, pin: true },
      stepInsertCount: 0,
      totalStepCount: 2,
      followingStepCount: 1,
    });
    expect(clean.hasCustomCameraAngle).toBe(false);
    expect(clean.hasCustomArrangeLayout).toBe(false);
  });

  it('clears only camera angle fields without disturbing framing, scale, layout, or page breaks', () => {
    const next = clearStepCameraOverride({
      side: 'bottom',
      corner: 'back_left',
      az: 225,
      el: -30,
      focusMode: 'focus',
      modelScale: 1.4,
      pliPos: { x: 20, y: 15 },
      pin: true,
    });
    expect(next).toEqual({
      focusMode: 'focus',
      modelScale: 1.4,
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

  it('applies camera angle cleanly across any inclusive step range (before and after current step)', () => {
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
});
