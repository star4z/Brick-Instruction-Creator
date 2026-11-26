import { describe, expect, it } from 'vitest';
import {
  buildLiveStepRenderCacheKey,
  buildMinifigOneToOneCacheKey,
  buildStaticPageSnapCacheKey,
  computePrewarmPageIndices,
  computeSubrenderSupersampleFactor,
  createPixelBudgetCache,
} from '../pageRenderCache';

describe('pageRenderCache', () => {
  it('enforces LRU eviction by entry count and total pixel budget while invoking onEvict', () => {
    const evicted: string[] = [];
    const cache = createPixelBudgetCache<{ id: string; w: number; h: number }>({
      maxEntries: 4,
      maxTotalPixels: 2_500_000,
      getPixels: (v) => v.w * v.h,
      onEvict: (v) => evicted.push(v.id),
    });

    cache.set('a', { id: 'a', w: 1000, h: 1000 }); // 1M
    cache.set('b', { id: 'b', w: 1000, h: 1000 }); // 2M
    expect(cache.size()).toBe(2);
    expect(cache.totalPixels()).toBe(2_000_000);

    // Touch 'a' so 'b' becomes LRU
    expect(cache.get('a')?.id).toBe('a');

    // Adding 'c' (1M -> 3M > 2.5M) must evict 'b', keeping 'a' and 'c'
    cache.set('c', { id: 'c', w: 1000, h: 1000 });
    expect(evicted).toEqual(['b']);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.has('c')).toBe(true);
    expect(cache.totalPixels()).toBe(2_000_000);
  });

  it('respects canEvict guard so actively connected canvases are never evicted', () => {
    const evicted: string[] = [];
    const cache = createPixelBudgetCache<{ id: string; connected: boolean; px: number }>({
      maxEntries: 2,
      maxTotalPixels: 1_500_000,
      getPixels: (v) => v.px,
      canEvict: (v) => !v.connected,
      onEvict: (v) => evicted.push(v.id),
    });

    cache.set('mounted', { id: 'mounted', connected: true, px: 1_000_000 });
    cache.set('idle', { id: 'idle', connected: false, px: 400_000 });
    cache.set('newest', { id: 'newest', connected: false, px: 400_000 });

    // Must evict 'idle' and preserve 'mounted' + 'newest'
    expect(evicted).toEqual(['idle']);
    expect(cache.has('mounted')).toBe(true);
    expect(cache.has('newest')).toBe(true);
  });

  it('bumps epoch and clears releasable entries cleanly', () => {
    const evicted: string[] = [];
    const cache = createPixelBudgetCache<{ id: string; px: number }>({
      maxEntries: 8,
      maxTotalPixels: 10_000_000,
      getPixels: (v) => v.px,
      onEvict: (v) => evicted.push(v.id),
    });
    expect(cache.getEpoch()).toBe(1);
    cache.set('k1', { id: 'k1', px: 500_000 });
    cache.set('k2', { id: 'k2', px: 500_000 });

    const nextEpoch = cache.bumpEpoch();
    expect(nextEpoch).toBe(2);
    expect(cache.size()).toBe(0);
    expect(cache.totalPixels()).toBe(0);
    expect(evicted).toEqual(['k1', 'k2']);
  });

  it('builds deterministic live step cache keys that vary on visual & selection changes', () => {
    const base = {
      epoch: 1,
      stepId: 's_1',
      prevSignature: '10:abc',
      stepSignature: '4:def',
      camAz: 38,
      camEl: 26,
      modelScale: 1,
      width: 2400,
      height: 1600,
      highlightNew: true,
      highlightColor: '#ff2d55',
      highlightLineWeight: 'medium',
      fadePrev: false,
      fadeOpacity: 0.5,
      stepLighting: 'standard',
      starkBlackOutlines: false,
      outlineLineWeight: 'light',
      darkBackground: false,
      showArrows: true,
      arrowColor: '#e53935',
      accent: '#1a73e8',
    };

    const k1 = buildLiveStepRenderCacheKey(base);
    expect(k1).toBe(buildLiveStepRenderCacheKey({ ...base }));
    expect(buildLiveStepRenderCacheKey({ ...base, camAz: 45 })).not.toBe(k1);
    expect(buildLiveStepRenderCacheKey({ ...base, stepLighting: 'studio' })).not.toBe(k1);
    expect(buildLiveStepRenderCacheKey({ ...base, starkBlackOutlines: true, outlineLineWeight: 'heavy' })).not.toBe(k1);
    expect(buildLiveStepRenderCacheKey({ ...base, selectedPartIds: new Set(['p1']) })).not.toBe(k1);
    expect(buildLiveStepRenderCacheKey({ ...base, partOffsets: { p1: { x: 0, y: 20, z: 0 } } })).not.toBe(k1);
    expect(buildLiveStepRenderCacheKey({ ...base, width: 2800 })).not.toBe(k1);
  });

  it('builds deterministic minifig 1:1 and static page snapshot cache keys', () => {
    const mfBase = {
      epoch: 1,
      partsSignature: '6:xyz',
      pagePxH: 792,
      pageHIn: 8.5,
      maxPxW: 320,
      maxPxH: 480,
      accent: '#1a73e8',
      starkBlackOutlines: false,
      outlineLineWeight: 'light',
      unlit: false,
    };
    const mk1 = buildMinifigOneToOneCacheKey(mfBase);
    expect(mk1).toBe(buildMinifigOneToOneCacheKey({ ...mfBase }));
    expect(buildMinifigOneToOneCacheKey({ ...mfBase, starkBlackOutlines: true })).not.toBe(mk1);
    expect(buildMinifigOneToOneCacheKey({ ...mfBase, unlit: true })).not.toBe(mk1);

    const stBase = {
      epoch: 1,
      kind: 'section_divider' as const,
      id: 'sec_1',
      partsSignature: '50:qwe',
      az: 38,
      el: 28,
      width: 1920,
      height: 1200,
      accent: '#1a73e8',
      stepLighting: 'standard',
      starkBlackOutlines: false,
      outlineLineWeight: 'light',
      darkBackground: false,
    };
    const sk1 = buildStaticPageSnapCacheKey(stBase);
    expect(sk1).toBe(buildStaticPageSnapCacheKey({ ...stBase }));
    expect(buildStaticPageSnapCacheKey({ ...stBase, darkBackground: true })).not.toBe(sk1);
  });

  it('tapers sub-render supersampling so small callouts stay supersampled while HiDPI targets render 1:1', () => {
    expect(computeSubrenderSupersampleFactor(220, 260, 2.0)).toBe(1.5);
    expect(computeSubrenderSupersampleFactor(220, 260, 1.3)).toBe(1.3);
    const mid = computeSubrenderSupersampleFactor(530, 480, 1.5);
    expect(mid).toBeGreaterThan(1.0);
    expect(mid).toBeLessThan(1.5);
    expect(computeSubrenderSupersampleFactor(1400, 1400, 1.5)).toBe(1.0);
    expect(computeSubrenderSupersampleFactor(600, 1540, 1.5)).toBe(1.0);
  });

  it('orders adjacent prewarm page indices by travel direction and clamps to bounds', () => {
    expect(computePrewarmPageIndices(0, 8, 1)).toEqual([1]);
    expect(computePrewarmPageIndices(3, 8, 1)).toEqual([4, 2]);
    expect(computePrewarmPageIndices(3, 8, -1)).toEqual([2, 4]);
    expect(computePrewarmPageIndices(7, 8, 1)).toEqual([6]);
    expect(computePrewarmPageIndices(0, 1, 1)).toEqual([]);
  });
});
