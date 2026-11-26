import { describe, expect, it } from 'vitest';
import {
  build1to1SilhouetteSvg,
  buildCoaxialPositionCalloutSvg,
  buildLengthBadgeSvg,
  classifyPartLengthBadge,
  detectCoaxialPositionCallout,
} from '../lengthBadges';
import {
  buildAttachmentStarburstSvg,
  buildCurvedMotionArrowSvg,
  buildOrthogonalLeadersSvg,
  detectMirroredSubassemblyPairs,
  detectNonOrthogonalArticulationAngle,
  routeOrthogonalLeaders,
  shouldShowGhostSubmodelPreview,
} from '../calloutCraft';
import {
  buildProgressBarHtml,
  classifyLooseUnbaggedParts,
  computeAbsoluteStepProgressFraction,
  computeBagProgressFraction,
  computeBuildRoadmapPages,
  computeProgressBarSegmentRender,
  resolvePageProgressBar,
} from '../buildRoadmap';
import { assignAbsoluteStepNumbers, getAbsStepNum } from '../stepNumbering';
import {
  CONTRAST_ARROW_BLUE,
  CONTRAST_ARROW_GREEN,
  DEFAULT_ARROW_COLOR,
  computePlacementArrowSegments,
  resolveContrastArrowColor,
} from '../placementArrows';
import { computeStepCameraFraming } from '../stepCamera';
import {
  computeRelativeBomScales,
  packVariableWidthBomColumns,
} from '../partsList';
import { buildPdfBinary } from '../../export/pdfBinary';
import {
  BUILT_IN_THEMES,
  DEFAULT_THEME_STYLE_OPTIONS,
  normalizeThemeStyleOptions,
  sanitizeProgressBarSpan,
} from '../../themes/customThemes';

describe('Official Manual Craft — Length Badges & 1:1 Coaxial Callouts', () => {
  it('classifies axles & bars as circled (N) and liftarms/beams as squared [N]', () => {
    const axle4 = classifyPartLengthBadge('Technic Axle 4');
    expect(axle4).toMatchObject({ lengthL: 4, label: '4', shape: 'circle', kind: 'axle', mm: 32 });

    const bar32 = classifyPartLengthBadge('Bar 3.2L');
    expect(bar32).toMatchObject({ lengthL: 3.2, label: '3.2', shape: 'circle', kind: 'bar' });

    const liftarm5 = classifyPartLengthBadge('Technic Liftarm 1 x 5 Thick');
    expect(liftarm5).toMatchObject({ lengthL: 5, label: '5', shape: 'square', kind: 'liftarm', mm: 40 });

    const techBrick7 = classifyPartLengthBadge('Technic Brick 1 x 7 with Holes');
    expect(techBrick7).toMatchObject({ lengthL: 7, label: '7', shape: 'square', kind: 'technic_brick', mm: 56 });

    expect(classifyPartLengthBadge('Brick 2 x 4')).toBeNull();
  });

  it('generates valid SVG badges and true-scale orthographic silhouettes', () => {
    const axle = classifyPartLengthBadge('Technic Axle 4')!;
    const liftarm = classifyPartLengthBadge('Technic Liftarm 1 x 5 Thick')!;

    expect(buildLengthBadgeSvg(axle, 18)).toContain('<circle');
    expect(buildLengthBadgeSvg(liftarm, 18)).toContain('<rect');
    expect(build1to1SilhouetteSvg(axle, 36, 10, '#111827')).toContain('<line');
    expect(build1to1SilhouetteSvg(liftarm, 45, 12, '#9ca3af')).toContain('<circle');
  });

  it('detects coaxial gear/bush interior stop positions on axles and builds 1:1 callout SVG', () => {
    const axle = {
      id: 'axle-1',
      title: 'Technic Axle 4',
      colorHex: '#1e293b',
      box: { min: [-4, 0, -4] as [number, number, number], max: [4, 80, 4] as [number, number, number], center: [0, 40, 0] as [number, number, number] },
    };
    const gear = {
      id: 'gear-1',
      title: 'Technic Gear 12 Tooth Bevel',
      colorHex: '#d4a84f',
      box: { min: [-12, 12, -12] as [number, number, number], max: [12, 24, 12] as [number, number, number], center: [0, 18, 0] as [number, number, number] },
    };
    const callout = detectCoaxialPositionCallout([gear], [axle]);
    expect(callout).not.toBeNull();
    expect(callout!.axleLengthL).toBe(4);
    expect(callout!.collarKind).toBe('gear');
    expect(callout!.positionRatio).toBeGreaterThan(0.15);
    expect(callout!.positionRatio).toBeLessThan(0.35);
    const svg = buildCoaxialPositionCalloutSvg(callout!);
    expect(svg).toContain('1:1');
    expect(svg).toContain('#fff5cc');
  });
});

describe('Official Manual Craft — Callout Routing, Chiral Pairing & Articulation', () => {
  it('routes single and multi-forked orthogonal leaders cleanly with arrowheads', () => {
    const rect = { x: 40, y: 20, w: 120, h: 60 };
    const single = routeOrthogonalLeaders(rect, [{ x: 100, y: 180 }]);
    expect(single).toHaveLength(1);
    expect(single[0].points[0].y).toBe(80);
    expect(single[0].tipDir).toEqual({ x: 0, y: 1 });

    const forked = routeOrthogonalLeaders(rect, [
      { x: 60, y: 180 },
      { x: 180, y: 200 },
    ]);
    expect(forked).toHaveLength(2);
    expect(forked[0].points).toHaveLength(4);
    expect(forked[1].points).toHaveLength(4);
    const svg = buildOrthogonalLeadersSvg(forked, 300, 240);
    expect(svg).toContain('<polyline');
    expect(svg).toContain('<polygon');
  });

  it('pairs chiral mirror-symmetric subassemblies while skipping rigidly identical ones', () => {
    const left = {
      id: 'sub-L',
      parts: [
        { partId: '3001', colorId: 71, pos: [0, 0, 0] as [number, number, number] },
        { partId: '3023', colorId: 4, pos: [20, 0, 0] as [number, number, number] },
        { partId: '3024', colorId: 14, pos: [20, 0, 20] as [number, number, number] },
      ],
    };
    const rightMirror = {
      id: 'sub-R',
      parts: [
        { partId: '3001', colorId: 71, pos: [0, 0, 0] as [number, number, number] },
        { partId: '3023', colorId: 4, pos: [-20, 0, 0] as [number, number, number] },
        { partId: '3024', colorId: 14, pos: [-20, 0, 20] as [number, number, number] },
      ],
    };
    const pairs = detectMirroredSubassemblyPairs([left, rightMirror]);
    expect(pairs).toHaveLength(1);
    expect(pairs[0]).toMatchObject({ leftId: 'sub-L', rightId: 'sub-R' });

    // Rigidly identical copy (not chiral) must NOT be paired as mirrored
    expect(detectMirroredSubassemblyPairs([left, { ...left, id: 'sub-copy' }])).toHaveLength(0);
  });

  it('renders ghost preview rule, starbursts, curved motion arrows, and hinge angles', () => {
    expect(shouldShowGhostSubmodelPreview(3, true)).toBe(true);
    expect(shouldShowGhostSubmodelPreview(1, true)).toBe(false);
    expect(buildAttachmentStarburstSvg(120)).toContain('<polygon');
    expect(buildCurvedMotionArrowSvg(44, 'cw')).toContain('#facc15');
    expect(detectNonOrthogonalArticulationAngle([1, 0, 0, 0, 1, 0, 0, 0, 1])).toBeNull();
    const c = Math.cos(Math.PI / 4);
    const s = Math.sin(Math.PI / 4);
    expect(detectNonOrthogonalArticulationAngle([c, -s, 0, s, c, 0, 0, 0, 1])).toBe(45);
  });
});

describe('Official Manual Craft — Contrast Arrows, Roadmap, Progress Bar, Regional Framing & BOM', () => {
  it('switches red arrows to high-contrast green on red bricks and preserves red on gray/white', () => {
    expect(resolveContrastArrowColor(DEFAULT_ARROW_COLOR, [201, 26, 9])).toBe(CONTRAST_ARROW_GREEN);
    expect(resolveContrastArrowColor(DEFAULT_ARROW_COLOR, [160, 165, 169])).toBe(DEFAULT_ARROW_COLOR);
    expect(resolveContrastArrowColor(CONTRAST_ARROW_GREEN, [22, 163, 74])).toBe(CONTRAST_ARROW_BLUE);
  });

  it('emits through-hole pass-through guide segments when throughGuideTo is provided', () => {
    const segs = computePlacementArrowSegments(
      { min: [-10, -10, -10], max: [10, 10, 10], center: [0, 0, 0] },
      [40, 0, 0],
      [12, 0, 0],
      [-18, 0, 0],
    );
    expect(segs.some((s) => !s.isGuideLine)).toBe(true);
    expect(segs.some((s) => s.isGuideLine)).toBe(true);
  });

  it('paginates Build Roadmap, classifies loose parts, and builds progress bar HTML', () => {
    const stages = Array.from({ length: 8 }, (_, i) => ({
      stageNumber: i + 1,
      title: `Bag ${i + 1}`,
      partCount: 100,
      stepStart: i * 10 + 1,
      stepEnd: (i + 1) * 10,
    }));
    const pages = computeBuildRoadmapPages(stages, 6);
    expect(pages).toHaveLength(2);
    expect(pages[0].cols).toBe(2);
    expect(pages[0].stages).toHaveLength(6);
    expect(pages[1].stages).toHaveLength(2);

    const loose = classifyLooseUnbaggedParts([
      { partId: '3703', colorId: 72, title: 'Technic Brick 1x16', maxDimLdu: 320 },
      { partId: '3703', colorId: 72, title: 'Technic Brick 1x16', maxDimLdu: 320 },
      { partId: '3024', colorId: 4, title: 'Plate 1x1', maxDimLdu: 20 },
    ]);
    expect(loose).toHaveLength(1);
    expect(loose[0]).toMatchObject({ partId: '3703', count: 2 });

    expect(computeBagProgressFraction(0, 10)).toBe(0);
    expect(computeBagProgressFraction(9, 10)).toBe(1);
    expect(computeAbsoluteStepProgressFraction(1, 10)).toBe(0);
    expect(computeAbsoluteStepProgressFraction(10, 10)).toBe(1);
    expect(computeAbsoluteStepProgressFraction(1, 1)).toBe(1);
    expect(computeAbsoluteStepProgressFraction(0, 10)).toBe(0);
    expect(computeAbsoluteStepProgressFraction(15, 10)).toBe(1);
    expect(computeAbsoluteStepProgressFraction(Number.NaN, 10)).toBe(0);

    // Multi-chapter manual where printed step labels restart at 1 in each submodel/minifig chapter
    const chapters = [
      { kind: 'minifigure', steps: [{ num: 1 }, { num: 2 }] },
      { kind: 'submodel', steps: [{ num: 1 }, { num: 2 }, { num: 3 }] },
      { kind: 'bag', steps: [{ num: 1 }, { num: 2 }, { num: 3 }] },
      { kind: 'bag', steps: [{ num: 4 }, { num: 5 }] },
    ];
    const totalAbs = assignAbsoluteStepNumbers(chapters);
    expect(totalAbs).toBe(10);
    const fracs = chapters
      .flatMap((ch) => ch.steps)
      .map((s) => computeAbsoluteStepProgressFraction(getAbsStepNum(s), totalAbs));
    expect(fracs[0]).toBe(0);
    expect(fracs[fracs.length - 1]).toBe(1);
    for (let i = 1; i < fracs.length; i++) {
      expect(fracs[i]).toBeGreaterThan(fracs[i - 1]);
    }
    // Never hits 1.0 early at intermediate chapter boundaries (e.g. end of minifig or submodel)
    for (let i = 0; i < fracs.length - 1; i++) {
      expect(fracs[i]).toBeLessThan(1);
    }

    const barHtml = buildProgressBarHtml(0.5);
    expect(barHtml).toContain('50.00%');
    expect(barHtml).toContain('data-progress-fraction="0.5000"');
    expect(barHtml).toContain('data-progress-segment="full"');
  });

  it('starts progress bar all the way to the left on the first step page and spans two facing pages in spread mode', () => {
    // Single-page mode with multiple steps packed onto the first step page (steps 1-3 on p.2)
    const multiStepPages = [
      { pageNum: 1, isStepPage: false, lastAbsStepNum: 0 }, // Cover
      { pageNum: 2, isStepPage: true, lastAbsStepNum: 3 },  // Steps 1-3 (first step page)
      { pageNum: 3, isStepPage: true, lastAbsStepNum: 6 },  // Steps 4-6
      { pageNum: 4, isStepPage: true, lastAbsStepNum: 8 },  // Steps 7-8
      { pageNum: 5, isStepPage: true, lastAbsStepNum: 10 }, // Steps 9-10 (last step page)
    ];
    expect(resolvePageProgressBar(multiStepPages, 1, 'page')).toBeNull();
    expect(resolvePageProgressBar(multiStepPages, 2, 'page')).toEqual({ fraction: 0, segment: 'full' });
    expect(resolvePageProgressBar(multiStepPages, 3, 'page')!.fraction).toBeCloseTo(3 / 7, 5);
    expect(resolvePageProgressBar(multiStepPages, 4, 'page')!.fraction).toBeCloseTo(5 / 7, 5);
    expect(resolvePageProgressBar(multiStepPages, 5, 'page')).toEqual({ fraction: 1, segment: 'full' });

    // Single-step-page manual still starts all the way to the left (0)
    const singlePage = [
      { pageNum: 1, isStepPage: false, lastAbsStepNum: 0 },
      { pageNum: 2, isStepPage: true, lastAbsStepNum: 4 },
    ];
    expect(resolvePageProgressBar(singlePage, 2, 'page')).toEqual({ fraction: 0, segment: 'full' });

    // Two-page spread mode: facing pairs (2,3), (4,5), (6,7)
    const spreadPages = [
      { pageNum: 1, isStepPage: false, lastAbsStepNum: 0 }, // Cover
      { pageNum: 2, isStepPage: true, lastAbsStepNum: 2 },
      { pageNum: 3, isStepPage: true, lastAbsStepNum: 4 },
      { pageNum: 4, isStepPage: true, lastAbsStepNum: 6 },
      { pageNum: 5, isStepPage: true, lastAbsStepNum: 8 },
      { pageNum: 6, isStepPage: true, lastAbsStepNum: 10 },
      { pageNum: 7, isStepPage: true, lastAbsStepNum: 12 },
    ];
    expect(resolvePageProgressBar(spreadPages, 2, 'spread')).toEqual({ fraction: 0, segment: 'left' });
    expect(resolvePageProgressBar(spreadPages, 3, 'spread')).toEqual({ fraction: 0, segment: 'right' });
    expect(resolvePageProgressBar(spreadPages, 4, 'spread')).toEqual({ fraction: 0.5, segment: 'left' });
    expect(resolvePageProgressBar(spreadPages, 5, 'spread')).toEqual({ fraction: 0.5, segment: 'right' });
    expect(resolvePageProgressBar(spreadPages, 6, 'spread')).toEqual({ fraction: 1, segment: 'left' });
    expect(resolvePageProgressBar(spreadPages, 7, 'spread')).toEqual({ fraction: 1, segment: 'right' });

    // Solo step pages facing non-step pages fall back to 'full' so the bead never disappears
    const mixedSpreadPages = [
      { pageNum: 1, isStepPage: false, lastAbsStepNum: 0 }, // Cover
      { pageNum: 2, isStepPage: false, lastAbsStepNum: 0 }, // Roadmap
      { pageNum: 3, isStepPage: true, lastAbsStepNum: 2 },  // Solo first step page
      { pageNum: 4, isStepPage: true, lastAbsStepNum: 4 },  // Spread left
      { pageNum: 5, isStepPage: true, lastAbsStepNum: 6 },  // Spread right
      { pageNum: 6, isStepPage: true, lastAbsStepNum: 8 },  // Solo last step page
      { pageNum: 7, isStepPage: false, lastAbsStepNum: 0 }, // Build Complete
    ];
    expect(resolvePageProgressBar(mixedSpreadPages, 3, 'spread')).toEqual({ fraction: 0, segment: 'full' });
    expect(resolvePageProgressBar(mixedSpreadPages, 4, 'spread')!.segment).toBe('left');
    expect(resolvePageProgressBar(mixedSpreadPages, 5, 'spread')!.segment).toBe('right');
    expect(resolvePageProgressBar(mixedSpreadPages, 4, 'spread')!.fraction).toBeCloseTo(4 / 6, 5);
    expect(resolvePageProgressBar(mixedSpreadPages, 5, 'spread')!.fraction).toBeCloseTo(4 / 6, 5);
    expect(resolvePageProgressBar(mixedSpreadPages, 6, 'spread')).toEqual({ fraction: 1, segment: 'full' });

    // Segment geometry projection (left = 0..0.5, right = 0.5..1.0)
    expect(computeProgressBarSegmentRender(0, 'left')).toEqual({
      localFill: 0, beadPos: 0, roundLeft: true, roundRight: false,
    });
    expect(computeProgressBarSegmentRender(0, 'right')).toEqual({
      localFill: 0, beadPos: null, roundLeft: false, roundRight: true,
    });
    expect(computeProgressBarSegmentRender(0.25, 'left')).toEqual({
      localFill: 0.5, beadPos: 0.5, roundLeft: true, roundRight: false,
    });
    expect(computeProgressBarSegmentRender(0.75, 'left')).toEqual({
      localFill: 1, beadPos: null, roundLeft: true, roundRight: false,
    });
    expect(computeProgressBarSegmentRender(0.75, 'right')).toEqual({
      localFill: 0.5, beadPos: 0.5, roundLeft: false, roundRight: true,
    });

    // HTML output reflects segment, bead presence, and flat spine ends
    const leftHtml = buildProgressBarHtml(0, { segment: 'left' });
    expect(leftHtml).toContain('data-progress-segment="left"');
    expect(leftHtml).toContain('biw-progress-bead');
    expect(leftHtml).toContain('left:0.00%');

    const rightStartHtml = buildProgressBarHtml(0, { segment: 'right' });
    expect(rightStartHtml).toContain('data-progress-segment="right"');
    expect(rightStartHtml).not.toContain('biw-progress-bead');

    const rightEndHtml = buildProgressBarHtml(1, { segment: 'right' });
    expect(rightEndHtml).toContain('biw-progress-bead');
    expect(rightEndHtml).toContain('left:100.00%');

    // Theme option defaults & sanitization
    expect(DEFAULT_THEME_STYLE_OPTIONS.progressBarSpan).toBe('page');
    expect(sanitizeProgressBarSpan('spread')).toBe('spread');
    expect(sanitizeProgressBarSpan('invalid')).toBe('page');
    expect(normalizeThemeStyleOptions({ progressBarSpan: 'spread' }).progressBarSpan).toBe('spread');
    expect(normalizeThemeStyleOptions({ progressBarSpan: 'bogus' }).progressBarSpan).toBe('page');
  });

  it('computes regional cropped close-up framing with normalized locator bounds', () => {
    const framing = computeStepCameraFraming({
      focusMode: 'regional',
      hasPrevParts: true,
      fullCenter: [0, 0, 0],
      fullRadius: 480,
      newCenter: [240, 20, -120],
      newRadius: 45,
    });
    expect(framing.isZoomedIn).toBe(true);
    expect(framing.radius).toBeLessThan(480 * 0.75);
    expect(framing.locator).toBeDefined();
    expect(framing.locator!.cxNorm).toBeGreaterThan(0.6);
  });

  it('computes relative-scale BOM factors and packs variable-width masonry columns', () => {
    const items = [
      { key: 'pin', projW: 20, projH: 20 },
      { key: 'brick24', projW: 70, projH: 48 },
      { key: 'beam16', projW: 280, projH: 42 },
    ];
    const scales = computeRelativeBomScales(items);
    expect(scales.get('pin')!.scaleFactor).toBeLessThan(scales.get('beam16')!.scaleFactor);

    const pages = packVariableWidthBomColumns(items, (it) => it.key, scales, 400, 160);
    expect(pages.length).toBeGreaterThanOrEqual(1);
    const totalPacked = pages.reduce((n, p) => n + p.columns.reduce((m, c) => m + c.items.length, 0), 0);
    expect(totalPacked).toBe(3);
  });

  it('embeds invisible Ctrl+F searchable text metadata in PDF binary output and provides Technical Gray theme', () => {
    const pdf = buildPdfBinary(
      [
        {
          bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]),
          pxW: 100,
          pxH: 100,
          searchableText: ['Step 1', '3001', '3023'],
        },
      ],
      612,
      792,
    );
    const text = new TextDecoder('latin1').decode(pdf);
    expect(text).toContain('/BaseFont /Helvetica');
    expect(text).toContain('3 Tr');
    expect(text).toContain('(Step 1 3001 3023) Tj');

    expect(BUILT_IN_THEMES.gray).toBeDefined();
    expect(BUILT_IN_THEMES.gray.bgColor).toBe('#e3e4e5');
    expect(BUILT_IN_THEMES.gray.stepBorderStyle).toBe('lines');
    expect(DEFAULT_THEME_STYLE_OPTIONS.showProgressBar).toBe(true);
    expect(DEFAULT_THEME_STYLE_OPTIONS.stepBorderStyle).toBe('lines');
  });
});

describe('Official Manual Craft Pass 2 — Substep Strips, Vertical Stacks, Celebration, Confusable Colors & Precision Lines', () => {
  it('detects radial symmetric ring completion and plans horizontal numbered substep strips', async () => {
    const { detectRadialSymmetricCompletion, planInlineSubstepStrip } = await import('../substepStrips');
    const ringParts = [
      { id: 'r1', partId: '24246', colorId: 71, center: [30, 0, 0] as [number, number, number] },
      { id: 'r2', partId: '24246', colorId: 71, center: [0, 0, 30] as [number, number, number] },
      { id: 'r3', partId: '24246', colorId: 71, center: [-30, 0, 0] as [number, number, number] },
      { id: 'r4', partId: '24246', colorId: 71, center: [0, 0, -30] as [number, number, number] },
    ];
    const match = detectRadialSymmetricCompletion(ringParts);
    expect(match).not.toBeNull();
    expect(match!.count).toBe(4);

    const strip = planInlineSubstepStrip([
      { stepId: 's1', parts: [{ id: 'p0', partId: '3024', colorId: 4, center: [0, 0, 0] }] },
      { stepId: 's2', parts: ringParts },
    ]);
    expect(strip).not.toBeNull();
    expect(strip!.substeps).toHaveLength(2);
    expect(strip!.radialCompletion).toBe(true);
    expect(strip!.consolidatedPli.find((c) => c.partId === '24246')?.qty).toBe(4);
  });

  it('detects general 2-4 layer vertical exploded-stack columns', async () => {
    const { detectVerticalStackColumn } = await import('../calloutCraft');
    const stack = detectVerticalStackColumn([
      { id: 'b1', box: { min: [-10, 0, -10], max: [10, 8, 10], center: [0, 4, 0] } },
      { id: 'b2', box: { min: [-10, 8, -10], max: [10, 16, 10], center: [0, 12, 0] } },
      { id: 'b3', box: { min: [-10, 16, -10], max: [10, 24, 10], center: [0, 20, 0] } },
    ]);
    expect(stack).not.toBeNull();
    expect(stack!.orderedPartIds).toEqual(['b1', 'b2', 'b3']);
  });

  it('renders 2025 calm celebration SVG, flags confusable dark PLI colors, and emits precision dual alignment lines', async () => {
    const { buildCalmCelebrationSvg, detectConfusablePliColors } = await import('../calloutCraft');
    const { computePrecisionAlignmentLines } = await import('../placementArrows');
    const { FOCUS_MODE_OPTIONS } = await import('../stepToolbar');

    const celebSvg = buildCalmCelebrationSvg(800, 600);
    expect(celebSvg).toContain('<polygon');
    expect(celebSvg).toContain('fill="none"');

    const flagged = detectConfusablePliColors([
      { colorId: 0, hex: '#1b2a34', name: 'Black' },
      { colorId: 72, hex: '#545955', name: 'Dark Bluish Gray' },
      { colorId: 14, hex: '#f2cd37', name: 'Yellow' },
    ]);
    expect(flagged.has(0)).toBe(true);
    expect(flagged.has(72)).toBe(true);
    expect(flagged.has(14)).toBe(false);

    const prec = computePrecisionAlignmentLines(
      { min: [-6, -10, -20], max: [6, 10, 20], center: [0, 0, 0] },
      [32, 0, 0],
    );
    expect(prec).toHaveLength(2);
    expect(prec!.every((s) => s.isPrecisionLine)).toBe(true);
    expect(FOCUS_MODE_OPTIONS.some((o) => o.id === 'regional')).toBe(true);
  });

  it('auto-detects through-hole alignment guide targets for lateral pins penetrating host beams', async () => {
    const { detectThroughHoleGuideTarget } = await import('../placementArrows');
    const pinBox = {
      min: [-20, -4, -4] as [number, number, number],
      max: [20, 4, 4] as [number, number, number],
      center: [0, 0, 0] as [number, number, number],
    };
    const hostBeam = {
      min: [-10, -10, -80] as [number, number, number],
      max: [10, 10, 80] as [number, number, number],
      center: [0, 0, 0] as [number, number, number],
    };

    // Pin withdrawn along +X (inserting in -X through the beam)
    const tip = detectThroughHoleGuideTarget(pinBox, [36, 0, 0], [hostBeam]);
    expect(tip).not.toBeNull();
    expect(tip![0]).toBeLessThan(pinBox.min[0]);
    expect(tip![1]).toBe(0);
    expect(tip![2]).toBe(0);

    // Vertical drop should not emit lateral through-hole guide
    expect(detectThroughHoleGuideTarget(pinBox, [0, 36, 0], [hostBeam])).toBeNull();
  });

  it('scales column widths proportionally in packBomGridPages when variableWidthColumns is enabled', async () => {
    const { packBomGridPages } = await import('../partsList');
    const items = [
      { id: 'stud', sx: 1, sz: 1, h: 8 },
      { id: 'beam16', sx: 16, sz: 1, h: 20 },
    ];
    const spans = [
      { colSpan: 1, rowSpan: 1 },
      { colSpan: 1, rowSpan: 1 },
    ];
    const pages = packBomGridPages(items, spans, 2, 1, {
      flowAxis: 'rows',
      horizontalDir: 'ltr',
      verticalDir: 'ttb',
      align: 'start',
      variableWidthColumns: true,
    });
    expect(pages).toHaveLength(1);
    const [studCell, beamCell] = pages[0];
    expect(studCell.wFrac).toBeLessThan(beamCell.wFrac);
    expect(studCell.xFrac + studCell.wFrac).toBeCloseTo(beamCell.xFrac, 5);
    expect(beamCell.xFrac + beamCell.wFrac).toBeCloseTo(1, 5);
  });

  it('provides Collector Black, Botanical Stone, stepNumWeight, and Pocket Booklet presets (Phase A)', async () => {
    const { BUILT_IN_THEMES, normalizeThemeStyleOptions } = await import('../../themes/customThemes');
    const { PAPER_FORMAT_SPECS } = await import('../stepToolbar');

    expect(BUILT_IN_THEMES['collector-black']).toBeDefined();
    expect(BUILT_IN_THEMES['collector-black'].bgColor).toBe('#000000');
    expect(BUILT_IN_THEMES['collector-black'].highlightNew).toBe(true);
    expect(BUILT_IN_THEMES['collector-black'].stepNumWeight).toBe(300);

    expect(BUILT_IN_THEMES['botanical-stone']).toBeDefined();
    expect(BUILT_IN_THEMES['botanical-stone'].bgColor).toBe('#e8e6e1');
    expect(BUILT_IN_THEMES['botanical-stone'].stepNumWeight).toBe(300);

    expect(normalizeThemeStyleOptions({ stepNumWeight: 500 }).stepNumWeight).toBe(500);
    expect(normalizeThemeStyleOptions({ stepNumWeight: 999 }).stepNumWeight).toBe(800);

    expect(PAPER_FORMAT_SPECS.pocket).toBeDefined();
    expect(PAPER_FORMAT_SPECS.pocket.wIn).toBeCloseTo(4.02, 2);
    expect(PAPER_FORMAT_SPECS.pocket.hIn).toBeCloseTo(5.31, 2);
  });

  it('renders Technic multi-part 1:1 cards, DO/DONT checks, target rings, and 3-axis rotation icons (Phase B)', async () => {
    const { buildMultiPart1to1CardSvg, classifyPartLengthBadge } = await import('../lengthBadges');
    const { buildOrientationCheckSvg, buildTargetRingSvg, build3AxisRotationIconSvg } = await import('../calloutCraft');

    const b4 = classifyPartLengthBadge('Technic Axle 4', '3705')!;
    const b8 = classifyPartLengthBadge('Technic Axle 8', '3707')!;
    const cardSvg = buildMultiPart1to1CardSvg([
      { badge: b8, colorHex: '#1b2a34' },
      { badge: b4, colorHex: '#dc2626' },
    ]);
    expect(cardSvg).toContain('1:1');
    expect(cardSvg).toContain('#dc2626');
    expect(cardSvg).toContain('>4<');
    expect(cardSvg).toContain('>8<');

    expect(buildOrientationCheckSvg()).toContain('#16a34a');
    expect(buildOrientationCheckSvg()).toContain('#dc2626');
    expect(buildTargetRingSvg()).toContain('<circle');
    expect(build3AxisRotationIconSvg('flipVertical')).toContain('flipVertical');
    expect(build3AxisRotationIconSvg('yaw180')).toContain('yaw180');
  });

  it('exports valid BrickLink Wanted List XML and Rebrickable CSV (Phase C)', async () => {
    const { buildBrickLinkWantedXml, buildRebrickableCsv } = await import('../../export/bomExporters');
    const items = [
      { partId: '3001.dat', colorId: 4, qty: 6 },
      { partId: '3705', colorId: 0, qty: 2 },
    ];
    const xml = buildBrickLinkWantedXml(items);
    expect(xml).toContain('<INVENTORY>');
    expect(xml).toContain('<ITEMID>3001</ITEMID>');
    expect(xml).toContain('<MINQTY>6</MINQTY>');

    const csv = buildRebrickableCsv(items);
    expect(csv.split('\n')[0]).toBe('Part,Color,Quantity');
    expect(csv).toContain('3001,4,6');
    expect(csv).toContain('3705,0,2');
  });

  it('detects and renders LEGO Art mosaic charts, sticker badges, and swap arrows (Phase D)', async () => {
    const { detectMosaicGridStep, buildMosaicChartSvg } = await import('../mosaicChart');
    const { buildStickerBadgeSvg, buildSwapArrowSvg } = await import('../calloutCraft');

    const tiles = Array.from({ length: 16 }, (_, i) => ({
      id: `t_${i}`,
      partId: '98138',
      colorId: i % 2 === 0 ? 1 : 4,
      colorHex: i % 2 === 0 ? '#1e5aa8' : '#b40000',
      center: [(i % 4) * 20, 0, Math.floor(i / 4) * 20] as [number, number, number],
      spanLdu: [20, 8, 20] as [number, number, number],
    }));
    const plan = detectMosaicGridStep(tiles);
    expect(plan).not.toBeNull();
    expect(plan!.cols).toBe(4);
    expect(plan!.rows).toBe(4);
    expect(plan!.legend).toHaveLength(2);
    const chartSvg = buildMosaicChartSvg(plan!);
    expect(chartSvg).toContain('Color-numbered mosaic chart');

    expect(buildStickerBadgeSvg(7)).toContain('>7<');
    expect(buildStickerBadgeSvg(3, 30, { transparent: true })).toContain('stroke-dasharray');
    expect(buildSwapArrowSvg()).toContain('#1d4ed8');
  });

  it('emits PDF /Outlines bookmarks and runs Manual Quality Preflight checks (Phase E)', async () => {
    const { buildPdfBinary } = await import('../../export/pdfBinary');
    const { runManualPreflight } = await import('../manualPreflight');

    const pdf = buildPdfBinary(
      [
        { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), pxW: 10, pxH: 10, bookmarkTitle: 'Cover' },
        { bytes: new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), pxW: 10, pxH: 10, bookmarkTitle: 'Parts List' },
      ],
      612,
      792,
    );
    const text = new TextDecoder('latin1').decode(pdf);
    expect(text).toContain('/Outlines');
    expect(text).toContain('/Title (Cover)');
    expect(text).toContain('/Title (Parts List)');

    const findings = runManualPreflight({
      pageCount: 220,
      stepCount: 300,
      isDarkTheme: true,
      showSizeGuides: false,
      hasLongAxlesOrBeams: true,
      floatingStepCount: 2,
      hasPageSizeWarning: true,
    });
    expect(findings.map((f) => f.id)).toEqual([
      'floating-steps',
      'page-size-fit',
      'missing-size-guides',
      'dark-theme-ink',
      'multi-booklet-hint',
    ]);
  });

  it('detects Play Features demonstration panels and renders yellow motion arrows', async () => {
    const { detectPlayFeaturePanels, buildPlayFeatureArrowSvg } = await import('../playFeatures');
    const panels = detectPlayFeaturePanels(
      [
        { id: 'p1', partId: '3937', title: 'Hinge Brick 1x2 Base', m: [0.707, 0, 0.707, 0, 1, 0, -0.707, 0, 0.707] },
        { id: 'p2', partId: '3648', title: 'Technic Gear 24 Tooth' },
      ],
      [
        { id: 'c1', kind: 'submodel', name: 'Roof' },
        { id: 'c2', kind: 'submodel', name: 'Wing' },
      ],
    );
    expect(panels).toHaveLength(3);
    expect(panels.map((p) => p.kind)).toEqual(['hinge', 'rotate', 'detach']);
    expect(buildPlayFeatureArrowSvg('hinge')).toContain('#facc15');
    expect(buildPlayFeatureArrowSvg('rotate')).toContain('#facc15');
    expect(buildPlayFeatureArrowSvg('detach')).toContain('#facc15');

    // Static model without hinges/wheels/submodels still gets 2 clean showcase views
    const fallbackPanels = detectPlayFeaturePanels([
      { id: 'b1', partId: '3001', title: 'Brick 2x4' },
    ]);
    expect(fallbackPanels).toHaveLength(2);
    expect(fallbackPanels.every((p) => p.kind === 'view')).toBe(true);
  });
});





