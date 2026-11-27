import { describe, expect, it } from 'vitest';
import { createDefaultBomConfig } from '../partsList';
import {
  DEFAULT_WORDLESS_MODE,
  buildAttachArrowIconSvg,
  buildBomTableHeaderIconSvg,
  buildBrickGlyphSvg,
  buildFlipVerticalIconInnerSvg,
  buildMinifigPoseIconSvg,
  buildNumberedBagSvg,
  buildPartsGridIconSvg,
  buildPoseAdjustIconSvg,
  buildStepHintIconSvg,
  buildStepsBookletIconSvg,
  classifyStepHintAction,
  formatManualPageNumber,
  formatMinifig1to1Header,
  formatMinifigPoseBadgeText,
  getBomTableHeaderText,
  getRotationCueDisplay,
  getWordlessSurfaceDefaults,
  resolveEffectiveBomConfig,
  resolvePageNumberFormatForMode,
} from '../wordlessMode';

describe('Wordless Instructions Mode Engine', () => {
  it('defaults fresh imports to LEGO-style wordless instructions across all configurable surfaces', () => {
    expect(DEFAULT_WORDLESS_MODE).toBe(true);
    expect(getWordlessSurfaceDefaults(true)).toEqual({
      coverShowText: false,
      completeShowText: false,
      bomShowTextFields: false,
      pageNumberFormat: 'number',
    });
    expect(getWordlessSurfaceDefaults(false)).toEqual({
      coverShowText: true,
      completeShowText: true,
      bomShowTextFields: true,
      pageNumberFormat: 'page_n',
    });
  });

  it('resolves page number formats on mode toggle without clobbering n_of_total or none', () => {
    expect(resolvePageNumberFormatForMode('page_n', true)).toBe('number');
    expect(resolvePageNumberFormatForMode('number', true)).toBe('number');
    expect(resolvePageNumberFormatForMode('n_of_total', true)).toBe('n_of_total');
    expect(resolvePageNumberFormatForMode('none', true)).toBe('none');
    expect(resolvePageNumberFormatForMode(undefined, true)).toBe('number');

    expect(resolvePageNumberFormatForMode('number', false)).toBe('page_n');
    expect(resolvePageNumberFormatForMode('page_n', false)).toBe('page_n');
    expect(resolvePageNumberFormatForMode('n_of_total', false)).toBe('n_of_total');
    expect(resolvePageNumberFormatForMode('none', false)).toBe('none');
    expect(resolvePageNumberFormatForMode(undefined, false)).toBe('page_n');
  });

  it('never emits the word "Page" when formatting page numbers in wordless mode', () => {
    expect(formatManualPageNumber(3, 12, 'page_n', true)).toBe('3');
    expect(formatManualPageNumber(3, 12, 'number', true)).toBe('3');
    expect(formatManualPageNumber(3, 12, 'n_of_total', true)).toBe('3 / 12');
    expect(formatManualPageNumber(3, 12, 'none', true)).toBe('');

    expect(formatManualPageNumber(3, 12, 'page_n', false)).toBe('Page 3');
    expect(formatManualPageNumber(3, 12, 'number', false)).toBe('3');
    expect(formatManualPageNumber(3, 12, 'n_of_total', false)).toBe('3 / 12');
    expect(formatManualPageNumber(3, 12, 'none', false)).toBe('');
  });

  it('formats rotation cues with degree numerals or icon-only medallions in wordless mode', () => {
    expect(getRotationCueDisplay('yaw_90_cw', true)).toEqual({
      text: '90°',
      iconOnly: false,
      ariaLabel: 'Rotate 90°',
    });
    expect(getRotationCueDisplay('yaw_90_ccw', true)).toEqual({
      text: '90°',
      iconOnly: false,
      ariaLabel: 'Rotate 90° CCW',
    });
    expect(getRotationCueDisplay('yaw_180', true)).toEqual({
      text: '180°',
      iconOnly: false,
      ariaLabel: 'Turn 180°',
    });
    expect(getRotationCueDisplay('flip_vertical', true)).toEqual({
      text: '',
      iconOnly: true,
      ariaLabel: 'Flip Over',
    });

    expect(getRotationCueDisplay('yaw_90_cw', false).text).toBe('Rotate 90°');
    expect(getRotationCueDisplay('yaw_180', false).text).toBe('Turn 180°');
    expect(getRotationCueDisplay('flip_vertical', false)).toEqual({
      text: 'Flip Over',
      iconOnly: false,
      ariaLabel: 'Flip Over',
    });
  });

  it('classifies mechanical step hints into universal visual action icons', () => {
    expect(classifyStepHintAction('Slide sections together')).toBe('slide_together');
    expect(classifyStepHintAction('Push axle through beam')).toBe('push_axle');
    expect(classifyStepHintAction('Push rod straight through')).toBe('push_axle');
    expect(classifyStepHintAction('Attach axle onto hub')).toBe('attach_axle');
    expect(classifyStepHintAction('Connect pin to bracket')).toBe('attach_axle');
    expect(classifyStepHintAction('Place roof cap from above')).toBe('drop');
    expect(classifyStepHintAction(undefined)).toBe('drop');
  });

  it('formats minifigure pose pills as angles only in wordless mode', () => {
    expect(formatMinifigPoseBadgeText({ label: 'Legs 90° forward', angleDeg: 90 }, true)).toBe('90°');
    expect(formatMinifigPoseBadgeText({ label: 'Arm 45° up', angleDeg: -45.4 }, true)).toBe('45°');
    expect(formatMinifigPoseBadgeText({ label: 'Adjust posture', angleDeg: 0 }, true)).toBe('↻');
    expect(formatMinifigPoseBadgeText({ label: 'Legs 90° forward', angleDeg: 90 }, false)).toBe('Legs 90° forward');
    expect(formatMinifigPoseBadgeText(null, true)).toBe('');
  });

  it('formats 1:1 minifigure headers without English words or unit abbreviations in wordless mode', () => {
    expect(formatMinifig1to1Header(40.2, true, true)).toEqual({
      badge: '1:1',
      detail: '',
      canvasLabel: '1:1',
    });
    expect(formatMinifig1to1Header(40.2, false, true)).toEqual({
      badge: '≈1:1',
      detail: '',
      canvasLabel: '≈1:1',
    });
    expect(formatMinifig1to1Header(40.2, true, false)).toEqual({
      badge: '1:1',
      detail: '40 mm',
      canvasLabel: '1:1 · 40 mm',
    });
    expect(formatMinifig1to1Header(40.2, false, false)).toEqual({
      badge: '1:1 · Fit',
      detail: '40 mm',
      canvasLabel: '1:1 Fit · 40 mm',
    });
  });

  it('filters English BOM text fields non-destructively and maps table headers to universal symbols', () => {
    const base = createDefaultBomConfig();
    base.fields = base.fields.map((f) => ({ ...f, enabled: true }));

    // Labeled / showTextFields=true keeps all fields intact
    const labeled = resolveEffectiveBomConfig(base, true);
    expect(labeled).toBe(base);

    // Wordless / showTextFields=false disables name & color without mutating the original theme bomConfig
    const wordless = resolveEffectiveBomConfig(base, false);
    expect(wordless.fields.filter((f) => f.enabled).map((f) => f.id)).toEqual(['image', 'qty', 'partId']);
    expect(base.fields.every((f) => f.enabled)).toBe(true);

    // Safety fallback if a user only had text fields enabled
    const textOnly = {
      ...base,
      fields: base.fields.map((f) => ({ ...f, enabled: f.id === 'name' || f.id === 'color' })),
    };
    const fallback = resolveEffectiveBomConfig(textOnly, false);
    expect(fallback.fields.filter((f) => f.enabled).map((f) => f.id)).toEqual(['image', 'qty']);

    // Wordless table column headers use universal symbols instead of English words
    expect(getBomTableHeaderText('image', true)).toBe('');
    expect(getBomTableHeaderText('qty', true)).toBe('×');
    expect(getBomTableHeaderText('partId', true)).toBe('#');
    expect(getBomTableHeaderText('name', true)).toBe('Aa');
    expect(getBomTableHeaderText('color', true)).toBe('●');
    expect(getBomTableHeaderText('qty', false)).toBe('Qty');
    expect(getBomTableHeaderText('partId', false)).toBe('Part ID');
  });

  it('generates valid, language-neutral SVG icons for every wordless surface', () => {
    const bag = buildNumberedBagSvg(2, 56, '#1a73e8', '#ffffff', '#1e293b');
    expect(bag).toContain('<svg');
    expect(bag).toContain('>2</text>');
    expect(bag).not.toMatch(/stage|bag|section/i);

    for (const svg of [
      buildBrickGlyphSvg(14),
      buildPartsGridIconSvg(18),
      buildBomTableHeaderIconSvg('image', 14),
      buildBomTableHeaderIconSvg('qty', 14),
      buildBomTableHeaderIconSvg('partId', 14),
      buildBomTableHeaderIconSvg('name', 14),
      buildBomTableHeaderIconSvg('color', 14),
      buildStepsBookletIconSvg(14),
      buildAttachArrowIconSvg(14),
      buildPoseAdjustIconSvg(16),
      buildStepHintIconSvg('slide_together', 16),
      buildStepHintIconSvg('push_axle', 16),
      buildStepHintIconSvg('attach_axle', 16),
      buildStepHintIconSvg('drop', 16),
      buildMinifigPoseIconSvg('legs', 14),
      buildMinifigPoseIconSvg('arm_r', 14),
      buildMinifigPoseIconSvg('head', 14),
      buildMinifigPoseIconSvg('figure', 14),
    ]) {
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).not.toContain('<text');
    }

    const flipInner = buildFlipVerticalIconInnerSvg();
    expect(flipInner).toContain('<path');
    expect(flipInner).toContain('<polyline');
    expect(flipInner).not.toContain('<rect');
  });
});
