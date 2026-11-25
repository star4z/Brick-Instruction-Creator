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
  computeBagProgressFraction,
  computeBuildRoadmapPages,
} from '../buildRoadmap';
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
import { BUILT_IN_THEMES, DEFAULT_THEME_STYLE_OPTIONS } from '../../themes/customThemes';

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
    expect(buildProgressBarHtml(0.5)).toContain('50.00%');
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
    expect(BUILT_IN_THEMES.gray.stepDividerStyle).toBe('hairlines');
    expect(DEFAULT_THEME_STYLE_OPTIONS.showProgressBar).toBe(true);
    expect(DEFAULT_THEME_STYLE_OPTIONS.stepDividerStyle).toBe('boxes');
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
});

