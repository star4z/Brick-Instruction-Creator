import { describe, expect, it } from 'vitest';
import {
  buildPagePreviewCacheKey,
  buildStepPreviewCacheKey,
  computeOverviewStepSignatures,
  computeOverviewThumbDimensions,
  computeStepPreviewPartSignature,
  createOverviewThumbCache,
  OVERVIEW_THUMB_BASE_H,
  OVERVIEW_THUMB_BASE_W,
  resolveOverviewPagePreviewKind,
} from '../overviewPreviews';

describe('overviewPreviews helpers', () => {
  it('computes HiDPI preview dimensions clamped between 1x and 2x', () => {
    expect(computeOverviewThumbDimensions(1)).toEqual({
      width: OVERVIEW_THUMB_BASE_W,
      height: OVERVIEW_THUMB_BASE_H,
    });
    expect(computeOverviewThumbDimensions(1.5)).toEqual({
      width: Math.round(OVERVIEW_THUMB_BASE_W * 1.5),
      height: Math.round(OVERVIEW_THUMB_BASE_H * 1.5),
    });
    expect(computeOverviewThumbDimensions(3.5)).toEqual({
      width: OVERVIEW_THUMB_BASE_W * 2,
      height: OVERVIEW_THUMB_BASE_H * 2,
    });
    expect(computeOverviewThumbDimensions(0.25)).toEqual({
      width: OVERVIEW_THUMB_BASE_W,
      height: OVERVIEW_THUMB_BASE_H,
    });
  });

  it('produces distinct part signatures when parts are added, moved, or recolored', () => {
    const base = [
      { id: 'p1', p: '3001', c: 4, x: 0, y: 0, z: 0 },
      { id: 'p2', p: '3004', c: 1, x: 20, y: -24, z: 0 },
    ];
    const sigBase = computeStepPreviewPartSignature(base);
    expect(sigBase).toBe(computeStepPreviewPartSignature([...base]));
    expect(computeStepPreviewPartSignature([base[0]])).not.toBe(sigBase);
    expect(
      computeStepPreviewPartSignature([base[0], { ...base[1], c: 14 }]),
    ).not.toBe(sigBase);
    expect(
      computeStepPreviewPartSignature([base[0], { ...base[1], y: -48 }]),
    ).not.toBe(sigBase);
    expect(computeStepPreviewPartSignature([])).toBe('0:0');
  });

  it('computes cumulative previous-part signatures matching section, submodel, and minifig isolation', () => {
    const chapters = [
      {
        id: 'ch_sub',
        kind: 'submodel',
        steps: [
          { id: 'sub_1', parts: [{ id: 's1', p: '3001', c: 4, x: 0, y: 0, z: 0 }] },
          { id: 'sub_2', parts: [{ id: 's2', p: '3001', c: 1, x: 0, y: -24, z: 0 }] },
        ],
      },
      {
        id: 'ch_mf',
        kind: 'minifigure',
        sectionId: 'sec_a',
        steps: [
          {
            id: 'mf_1',
            isStandaloneFigure: true,
            parts: [{ id: 'm1', p: '973', c: 1, x: 0, y: 0, z: 0 }],
          },
        ],
      },
      {
        id: 'ch_main_1',
        kind: 'main',
        sectionId: 'sec_a',
        steps: [
          { id: 'st_1', parts: [{ id: 'a1', p: '3001', c: 4, x: 0, y: 0, z: 0 }] },
          {
            id: 'st_pose',
            isMinifigPoseStep: true,
            parts: [{ id: 'm1', p: '973', c: 1, x: 0, y: 0, z: 0 }],
          },
          { id: 'st_2', parts: [{ id: 'a2', p: '3001', c: 2, x: 0, y: -24, z: 0 }] },
        ],
      },
      {
        id: 'ch_main_2',
        kind: 'main',
        sectionId: 'sec_a',
        steps: [
          { id: 'st_3', parts: [{ id: 'a3', p: '3001', c: 14, x: 0, y: -48, z: 0 }] },
        ],
      },
      {
        id: 'ch_sec_b',
        kind: 'main',
        sectionId: 'sec_b',
        steps: [
          { id: 'st_b1', parts: [{ id: 'b1', p: '3001', c: 15, x: 0, y: 0, z: 0 }] },
        ],
      },
    ];

    const sigs = computeOverviewStepSignatures(chapters);
    expect(sigs.get('sub_1')?.prevCount).toBe(0);
    expect(sigs.get('sub_2')?.prevCount).toBe(1);
    expect(sigs.get('mf_1')?.prevCount).toBe(0);
    // Standalone minifigure does not leak into main section previous parts
    expect(sigs.get('st_1')?.prevCount).toBe(0);
    // Pose step gets 0 previous parts and does not accumulate into subsequent steps
    expect(sigs.get('st_pose')?.prevCount).toBe(0);
    expect(sigs.get('st_2')?.prevCount).toBe(1);
    // Next chapter in the same section continues accumulating
    expect(sigs.get('st_3')?.prevCount).toBe(2);
    // Separate section starts fresh
    expect(sigs.get('st_b1')?.prevCount).toBe(0);

    // Mutating an earlier step invalidates downstream previous signatures in that section
    const mutatedChapters = chapters.map((ch) =>
      ch.id === 'ch_main_1'
        ? {
            ...ch,
            steps: ch.steps.map((st) =>
              st.id === 'st_1'
                ? { ...st, parts: [{ id: 'a1', p: '3001', c: 14, x: 0, y: 0, z: 0 }] }
                : st,
            ),
          }
        : ch,
    );
    const mutatedSigs = computeOverviewStepSignatures(mutatedChapters);
    expect(mutatedSigs.get('st_2')?.prevSignature).not.toBe(sigs.get('st_2')?.prevSignature);
    expect(mutatedSigs.get('st_3')?.prevSignature).not.toBe(sigs.get('st_3')?.prevSignature);
    // Unrelated sections and submodels keep identical signatures
    expect(mutatedSigs.get('sub_2')?.prevSignature).toBe(sigs.get('sub_2')?.prevSignature);
    expect(mutatedSigs.get('st_b1')?.prevSignature).toBe(sigs.get('st_b1')?.prevSignature);
  });

  it('invalidates step preview cache keys when camera, offsets, display options, or sequential slice change', () => {
    const base = {
      epoch: 1,
      stepId: 's_1',
      prevSignature: '4:abc',
      stepSignature: '2:def',
      camAz: 45,
      camEl: 26,
      modelScale: 1,
      partOffsets: null as Record<string, { dx?: number; dy?: number; dz?: number }> | null,
      highlightNew: true,
      highlightColor: '#ff2d55',
      fadePrev: false,
      fadeOpacity: 0.45,
      accent: '#7c152e',
      minifigStyle: null as string | null,
      seqSlice: null as { start: number; end: number } | null,
      isMinifigPoseStep: false,
      width: 144,
      height: 108,
    };

    const k0 = buildStepPreviewCacheKey(base);
    expect(buildStepPreviewCacheKey({ ...base })).toBe(k0);
    expect(buildStepPreviewCacheKey({ ...base, camAz: 135 })).not.toBe(k0);
    expect(buildStepPreviewCacheKey({ ...base, modelScale: 1.25 })).not.toBe(k0);
    expect(buildStepPreviewCacheKey({ ...base, partOffsets: { p1: { dy: -20 } } })).not.toBe(k0);
    expect(buildStepPreviewCacheKey({ ...base, highlightNew: false })).not.toBe(k0);
    expect(buildStepPreviewCacheKey({ ...base, fadePrev: true })).not.toBe(k0);
    expect(buildStepPreviewCacheKey({ ...base, minifigStyle: 'sequential', seqSlice: { start: 0, end: 2 } }))
      .not.toBe(buildStepPreviewCacheKey({ ...base, minifigStyle: 'sequential', seqSlice: { start: 2, end: 4 } }));
    expect(buildStepPreviewCacheKey({ ...base, epoch: 2 })).not.toBe(k0);
  });

  it('builds distinct page preview cache keys and classifies non-step page kinds', () => {
    const kCover = buildPagePreviewCacheKey({
      epoch: 1,
      kind: 'cover',
      pageId: 'cover',
      partsSignature: '10:xyz',
      camAz: 38,
      camEl: 24,
      accent: '#7c152e',
      width: 144,
      height: 108,
    });
    const kComplete = buildPagePreviewCacheKey({
      epoch: 1,
      kind: 'complete',
      pageId: 'complete',
      partsSignature: '10:xyz',
      camAz: 38,
      camEl: 24,
      accent: '#7c152e',
      width: 144,
      height: 108,
    });
    expect(kCover).not.toBe(kComplete);

    expect(resolveOverviewPagePreviewKind({ kind: 'cover' })).toBe('model_3d');
    expect(resolveOverviewPagePreviewKind({ kind: 'complete' })).toBe('model_3d');
    expect(resolveOverviewPagePreviewKind({ kind: 'section_divider' })).toBe('model_3d');
    expect(resolveOverviewPagePreviewKind({ kind: 'submodel_page' })).toBe('model_3d');
    expect(resolveOverviewPagePreviewKind({ kind: 'bom' })).toBe('bom_grid');
    expect(resolveOverviewPagePreviewKind({ kind: 'divider' })).toBe('divider_card');
    expect(resolveOverviewPagePreviewKind({ kind: 'back' })).toBe('back_card');
    expect(resolveOverviewPagePreviewKind({ kind: 'steps' })).toBe('none');
  });

  it('evicts least-recently-used thumbnails when bounded cache reaches capacity', () => {
    const cache = createOverviewThumbCache(16);
    for (let i = 0; i < 16; i++) {
      cache.set(`k${i}`, `url_${i}`);
    }
    expect(cache.size()).toBe(16);
    // Touch k0 so it becomes most-recently-used; k1 should be evicted next
    expect(cache.get('k0')).toBe('url_0');
    cache.set('k16', 'url_16');
    expect(cache.size()).toBe(16);
    expect(cache.get('k0')).toBe('url_0');
    expect(cache.get('k1')).toBeUndefined();

    const epochBefore = cache.getEpoch();
    expect(cache.bumpEpoch()).toBe(epochBefore + 1);
    expect(cache.size()).toBe(0);
  });
});
