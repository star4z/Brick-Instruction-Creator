import { describe, expect, it } from 'vitest';
import {
  computePageNavigationState,
  resolvePageNavigationTarget,
} from '../pageNavigation';

describe('pageNavigation', () => {
  it('disables all controls when there are 0 or 1 pages', () => {
    expect(computePageNavigationState(0, 0)).toEqual({
      canGoFirst: false,
      canGoPrev: false,
      canGoNext: false,
      canGoLast: false,
    });
    expect(computePageNavigationState(0, 1)).toEqual({
      canGoFirst: false,
      canGoPrev: false,
      canGoNext: false,
      canGoLast: false,
    });
    expect(resolvePageNavigationTarget(0, 0, 'first')).toBe(0);
    expect(resolvePageNavigationTarget(0, 0, 'last')).toBe(0);
    expect(resolvePageNavigationTarget(0, 1, 'next')).toBe(0);
    expect(resolvePageNavigationTarget(0, 1, 'last')).toBe(0);
  });

  it('disables first/prev and enables next/last on the first page', () => {
    expect(computePageNavigationState(0, 10)).toEqual({
      canGoFirst: false,
      canGoPrev: false,
      canGoNext: true,
      canGoLast: true,
    });
    expect(resolvePageNavigationTarget(0, 10, 'first')).toBe(0);
    expect(resolvePageNavigationTarget(0, 10, 'prev')).toBe(0);
    expect(resolvePageNavigationTarget(0, 10, 'next')).toBe(1);
    expect(resolvePageNavigationTarget(0, 10, 'last')).toBe(9);
  });

  it('enables all four controls on a middle page and resolves each target', () => {
    expect(computePageNavigationState(4, 10)).toEqual({
      canGoFirst: true,
      canGoPrev: true,
      canGoNext: true,
      canGoLast: true,
    });
    expect(resolvePageNavigationTarget(4, 10, 'first')).toBe(0);
    expect(resolvePageNavigationTarget(4, 10, 'prev')).toBe(3);
    expect(resolvePageNavigationTarget(4, 10, 'next')).toBe(5);
    expect(resolvePageNavigationTarget(4, 10, 'last')).toBe(9);
  });

  it('enables first/prev and disables next/last on the last page', () => {
    expect(computePageNavigationState(9, 10)).toEqual({
      canGoFirst: true,
      canGoPrev: true,
      canGoNext: false,
      canGoLast: false,
    });
    expect(resolvePageNavigationTarget(9, 10, 'first')).toBe(0);
    expect(resolvePageNavigationTarget(9, 10, 'prev')).toBe(8);
    expect(resolvePageNavigationTarget(9, 10, 'next')).toBe(9);
    expect(resolvePageNavigationTarget(9, 10, 'last')).toBe(9);
  });

  it('clamps out-of-range and non-finite inputs safely', () => {
    expect(computePageNavigationState(-3, 5)).toEqual({
      canGoFirst: false,
      canGoPrev: false,
      canGoNext: true,
      canGoLast: true,
    });
    expect(computePageNavigationState(99, 5)).toEqual({
      canGoFirst: true,
      canGoPrev: true,
      canGoNext: false,
      canGoLast: false,
    });
    expect(computePageNavigationState(Number.NaN, 5)).toEqual({
      canGoFirst: false,
      canGoPrev: false,
      canGoNext: true,
      canGoLast: true,
    });
    expect(resolvePageNavigationTarget(-3, 5, 'last')).toBe(4);
    expect(resolvePageNavigationTarget(99, 5, 'first')).toBe(0);
    expect(resolvePageNavigationTarget(Number.NaN, Number.NaN, 'last')).toBe(0);
  });
});
