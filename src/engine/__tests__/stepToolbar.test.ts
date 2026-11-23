import { describe, expect, it } from 'vitest';
import {
  FOCUS_MODE_OPTIONS,
  MINIFIG_STYLE_OPTIONS,
  clearStepArrangeOverride,
  clearStepCameraOverride,
  getFocusModeDescription,
  getVisibleModeTabs,
  resolveStepToolbarCapabilities,
} from '../stepToolbar';

describe('Step Toolbar & Full-Page Editor Capabilities', () => {
  it('exposes Pan, Select, Rotate, Arrange, and Edit tabs on step pages', () => {
    expect(getVisibleModeTabs('steps')).toEqual(['pan', 'select', 'rotate', 'arrange', 'edit']);
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

  it('recognizes that official Exploded and Step-by-Step minifigure pages have no movable Parts Box', () => {
    const exploded = resolveStepToolbarCapabilities({
      isMinifigBuild: true,
      minifigStyle: 'exploded',
      hasSubassembly: false,
      pageInsertCount: 0,
      followingStepCount: 3,
    });
    expect(exploded.isOfficialMinifigStyle).toBe(true);
    expect(exploded.hasPartsBox).toBe(false);
    expect(exploded.hasMovableElements).toBe(false);
    expect(exploded.showMinifigSettings).toBe(true);

    const withInsert = resolveStepToolbarCapabilities({
      isMinifigBuild: true,
      minifigStyle: 'sequential',
      hasSubassembly: false,
      pageInsertCount: 1,
      followingStepCount: 0,
    });
    expect(withInsert.hasPartsBox).toBe(false);
    expect(withInsert.hasMovableElements).toBe(true);
    expect(withInsert.canApplyAngleToFollowing).toBe(false);
  });

  it('enables Parts Box arrange controls for Classic minifigure steps and standard build steps', () => {
    const classicMf = resolveStepToolbarCapabilities({
      isMinifigBuild: true,
      minifigStyle: 'classic',
      hasSubassembly: false,
      pageInsertCount: 0,
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
      pageInsertCount: 0,
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
      pageInsertCount: 0,
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
      pageInsertCount: 0,
      followingStepCount: 1,
    });
    expect(caps.hasCustomCameraAngle).toBe(true);
    expect(caps.hasCustomArrangeLayout).toBe(true);

    const clean = resolveStepToolbarCapabilities({
      isMinifigBuild: false,
      minifigStyle: 'exploded',
      hasSubassembly: false,
      override: { focusMode: 'focus', modelScale: 1.3, pin: true },
      pageInsertCount: 0,
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
