import { describe, expect, it } from 'vitest';
import {
  canOpenExtraPageSettings,
  createDefaultExtraPagesConfig,
  getExtraPageSettingsAction,
  isExtraPageEnabled,
  normalizeExtraPagesConfig,
} from '../extraPages';

describe('extraPages', () => {
  it('defaults all four extra pages to enabled', () => {
    expect(createDefaultExtraPagesConfig()).toEqual({
      showCover: true,
      showBuildComplete: true,
      showPartsList: true,
      showBackCover: true,
    });
  });

  it('migrates legacy showExtras=false when individual flags are absent', () => {
    expect(normalizeExtraPagesConfig({ showExtras: false })).toEqual({
      showCover: false,
      showBuildComplete: false,
      showPartsList: false,
      showBackCover: false,
    });
  });

  it('prefers explicit individual flags over legacy showExtras fallback', () => {
    expect(
      normalizeExtraPagesConfig({
        showExtras: false,
        showCover: true,
        showPartsList: true,
      }),
    ).toEqual({
      showCover: true,
      showBuildComplete: false,
      showPartsList: true,
      showBackCover: false,
    });
  });

  it('handles null and undefined input cleanly', () => {
    expect(normalizeExtraPagesConfig(null)).toEqual(createDefaultExtraPagesConfig());
    expect(normalizeExtraPagesConfig(undefined)).toEqual(createDefaultExtraPagesConfig());
  });

  it('checks individual enabled state by page kind', () => {
    const cfg = {
      showCover: true,
      showBuildComplete: false,
      showPartsList: true,
      showBackCover: false,
    };
    expect(isExtraPageEnabled(cfg, 'cover')).toBe(true);
    expect(isExtraPageEnabled(cfg, 'complete')).toBe(false);
    expect(isExtraPageEnabled(cfg, 'bom')).toBe(true);
    expect(isExtraPageEnabled(cfg, 'back')).toBe(false);
  });

  it('blocks opening settings for disabled pages or when no model is loaded', () => {
    const cfg = {
      showCover: true,
      showBuildComplete: false,
      showPartsList: false,
      showBackCover: true,
    };
    expect(canOpenExtraPageSettings(cfg, 'cover', true)).toBe(true);
    expect(canOpenExtraPageSettings(cfg, 'complete', true)).toBe(false);
    expect(canOpenExtraPageSettings(cfg, 'bom', true)).toBe(false);
    expect(canOpenExtraPageSettings(cfg, 'back', true)).toBe(true);
    expect(canOpenExtraPageSettings(cfg, 'cover', false)).toBe(false);
    expect(canOpenExtraPageSettings(cfg, 'back', false)).toBe(false);
  });

  it('routes Cover, Build Complete, and Back Cover links to page mode and Parts List to the BOM modal', () => {
    expect(getExtraPageSettingsAction('cover')).toEqual({
      pageKind: 'cover',
      targetMode: 'page',
      openBomModal: false,
    });
    expect(getExtraPageSettingsAction('complete')).toEqual({
      pageKind: 'complete',
      targetMode: 'page',
      openBomModal: false,
    });
    expect(getExtraPageSettingsAction('back')).toEqual({
      pageKind: 'back',
      targetMode: 'page',
      openBomModal: false,
    });
    expect(getExtraPageSettingsAction('bom')).toEqual({
      pageKind: 'bom',
      targetMode: 'pan',
      openBomModal: true,
    });
  });
});
