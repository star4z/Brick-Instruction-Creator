import { describe, expect, it } from 'vitest';
import {
  buildPageTargetFromPage,
  formatAppRoute,
  parseAppRoute,
  resolvePageIndexFromRouteTarget,
  type RoutablePageLike,
} from '../urlRouting';

const SAMPLE_PAGES: RoutablePageLike[] = [
  { kind: 'cover', num: 1 },
  { kind: 'steps', num: 2, slots: [{ step: { num: 1 } }, { step: { num: 2 } }] },
  { kind: 'steps', num: 3, slots: [{ step: { num: 3 } }] },
  { kind: 'complete', num: 4 },
  { kind: 'bom', num: 5 },
  { kind: 'bom', num: 6 },
  { kind: 'back', num: 7 },
];

describe('urlRouting', () => {
  it('parses manual page routes and semantic aliases', () => {
    expect(parseAppRoute('#/cover')).toEqual({ page: { kind: 'cover' }, modal: null });
    expect(parseAppRoute('#/page/3')).toEqual({ page: { kind: 'page', pageNum: 3 }, modal: null });
    expect(parseAppRoute('#/step/2')).toEqual({ page: { kind: 'step', stepNum: 2 }, modal: null });
    expect(parseAppRoute('#/complete')).toEqual({ page: { kind: 'complete' }, modal: null });
    expect(parseAppRoute('#/parts-list')).toEqual({ page: { kind: 'parts-list' }, modal: null });
    expect(parseAppRoute('#/parts-list/2')).toEqual({ page: { kind: 'parts-list', bomPageNum: 2 }, modal: null });
    expect(parseAppRoute('#/bom')).toEqual({ page: { kind: 'parts-list' }, modal: null });
    expect(parseAppRoute('#/back-cover')).toEqual({ page: { kind: 'back-cover' }, modal: null });
  });

  it('parses standalone app modal routes and composed page + modal routes', () => {
    expect(parseAppRoute('#/preview')).toEqual({ page: null, modal: 'preview' });
    expect(parseAppRoute('#/settings')).toEqual({ page: null, modal: 'settings' });
    expect(parseAppRoute('#/bricks-library')).toEqual({ page: null, modal: 'bricks-library' });
    expect(parseAppRoute('#/page/2?view=preview')).toEqual({
      page: { kind: 'page', pageNum: 2 },
      modal: 'preview',
    });
    expect(parseAppRoute('#/page/2?view=settings')).toEqual({
      page: { kind: 'page', pageNum: 2 },
      modal: 'settings',
    });
    expect(parseAppRoute('#/cover?view=page-setup')).toEqual({
      page: { kind: 'cover' },
      modal: 'page-setup',
    });
    expect(formatAppRoute({ page: { kind: 'page', pageNum: 2 }, modal: 'preview' })).toBe('#/page/2?view=preview');
  });

  it('returns null for empty or unrecognized routes so app falls back cleanly', () => {
    expect(parseAppRoute('')).toBeNull();
    expect(parseAppRoute('#')).toBeNull();
    expect(parseAppRoute('#/')).toBeNull();
    expect(parseAppRoute('#/page/0')).toBeNull();
    expect(parseAppRoute('#/page/abc')).toBeNull();
    expect(parseAppRoute('#/unknown-view')).toBeNull();
  });

  it('formats canonical hashes and round-trips page targets', () => {
    expect(formatAppRoute({ page: { kind: 'cover' } })).toBe('#/cover');
    expect(formatAppRoute({ page: { kind: 'page', pageNum: 3 } })).toBe('#/page/3');
    expect(formatAppRoute({ page: { kind: 'parts-list' } })).toBe('#/parts-list');
    expect(formatAppRoute({ page: { kind: 'parts-list', bomPageNum: 2 } })).toBe('#/parts-list/2');
    expect(formatAppRoute({ page: { kind: 'page', pageNum: 2 }, modal: 'export' })).toBe('#/page/2?view=export');
    expect(formatAppRoute({ modal: 'bricks-library' })).toBe('#/bricks-library');
    expect(formatAppRoute({})).toBe('');

    expect(buildPageTargetFromPage(SAMPLE_PAGES, 0)).toEqual({ kind: 'cover' });
    expect(buildPageTargetFromPage(SAMPLE_PAGES, 1)).toEqual({ kind: 'page', pageNum: 2 });
    expect(buildPageTargetFromPage(SAMPLE_PAGES, 3)).toEqual({ kind: 'complete' });
    expect(buildPageTargetFromPage(SAMPLE_PAGES, 4)).toEqual({ kind: 'parts-list' });
    expect(buildPageTargetFromPage(SAMPLE_PAGES, 5)).toEqual({ kind: 'parts-list', bomPageNum: 2 });
    expect(buildPageTargetFromPage(SAMPLE_PAGES, 6)).toEqual({ kind: 'back-cover' });
  });

  it('resolves page indices and returns null for out-of-range targets', () => {
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'cover' })).toBe(0);
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'page', pageNum: 2 })).toBe(1);
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'step', stepNum: 2 })).toBe(1);
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'step', stepNum: 3 })).toBe(2);
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'complete' })).toBe(3);
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'parts-list' })).toBe(4);
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'parts-list', bomPageNum: 2 })).toBe(5);
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'back-cover' })).toBe(6);

    // Out-of-range / missing -> null (fallback)
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'page', pageNum: 99 })).toBeNull();
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'step', stepNum: 99 })).toBeNull();
    expect(resolvePageIndexFromRouteTarget(SAMPLE_PAGES, { kind: 'parts-list', bomPageNum: 3 })).toBeNull();
  });
});
