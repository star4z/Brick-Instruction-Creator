import type { ThemePresetId, ThemeSettings } from '../types/manual';

export interface ThemePresetDefinition {
  id: ThemePresetId;
  label: string;
  tagline: string;
  swatch: [string, string, string];
  settings: ThemeSettings;
}

export const THEME_PRESETS: Record<ThemePresetId, ThemePresetDefinition> = {
  'classic-lego-blue': {
    id: 'classic-lego-blue',
    label: 'Classic Manual Blue',
    tagline: 'Iconic sky-blue gradient pages, bright white PLI cards & vivid cyan highlights',
    swatch: ['#B9DAF4', '#FFFFFF', '#006CB7'],
    settings: {
      presetId: 'classic-lego-blue',
      pageSize: 'letter',
      orientation: 'landscape',
      defaultLayout: 'auto',
      backgroundMode: 'gradient',
      backgroundColor: '#C5E2F8',
      backgroundGradientEnd: '#8BC2EE',
      accentColor: '#006CB7',
      textColor: '#0F2439',
      mutedTextColor: '#3B5875',
      pliBackground: '#FFFFFF',
      pliBorderColor: '#8FB9DC',
      calloutBackground: '#EDF6FE',
      calloutBorderColor: '#3D88C7',
      fontFamily: 'jakarta',
      stepNumberScale: 1.05,
      showPageNumbers: true,
      highlightNewParts: true,
      highlightColor: '#FF2D55',
      highlightIntensity: 0.9,
      fadePreviousParts: true,
      fadeOpacity: 0.85,
      fadeDesaturation: 0.25,
      showEdgeLines: true,
      showPlacementArrows: true,
      showRotationIndicators: true,
    },
  },
  'modern-clean-white': {
    id: 'modern-clean-white',
    label: 'Modern Studio White',
    tagline: 'Crisp gallery paper, restrained slate borders & architectural clarity',
    swatch: ['#F7F7F5', '#ECEEF2', '#D9480F'],
    settings: {
      presetId: 'modern-clean-white',
      pageSize: 'letter',
      orientation: 'landscape',
      defaultLayout: 'auto',
      backgroundMode: 'solid',
      backgroundColor: '#F8F8F6',
      backgroundGradientEnd: '#EFEFE9',
      accentColor: '#D9480F',
      textColor: '#16191D',
      mutedTextColor: '#5B626D',
      pliBackground: '#FFFFFF',
      pliBorderColor: '#D6D9DF',
      calloutBackground: '#F1F3F6',
      calloutBorderColor: '#ADB5C2',
      fontFamily: 'space',
      stepNumberScale: 1.0,
      showPageNumbers: true,
      highlightNewParts: true,
      highlightColor: '#FF5A1F',
      highlightIntensity: 0.85,
      fadePreviousParts: true,
      fadeOpacity: 0.78,
      fadeDesaturation: 0.45,
      showEdgeLines: true,
      showPlacementArrows: true,
      showRotationIndicators: true,
    },
  },
  'dark-collector': {
    id: 'dark-collector',
    label: 'Collector 18+ Dark',
    tagline: 'Matte obsidian spreads with warm gold numerals inspired by UCS manuals',
    swatch: ['#17191D', '#242830', '#E2B44F'],
    settings: {
      presetId: 'dark-collector',
      pageSize: 'letter',
      orientation: 'landscape',
      defaultLayout: 'auto',
      backgroundMode: 'gradient',
      backgroundColor: '#1D2026',
      backgroundGradientEnd: '#121418',
      accentColor: '#E2B44F',
      textColor: '#F4F5F7',
      mutedTextColor: '#9AA3B2',
      pliBackground: '#262B34',
      pliBorderColor: '#3E4654',
      calloutBackground: '#20242C',
      calloutBorderColor: '#B8923E',
      fontFamily: 'space',
      stepNumberScale: 1.1,
      showPageNumbers: true,
      highlightNewParts: true,
      highlightColor: '#FFD166',
      highlightIntensity: 0.95,
      fadePreviousParts: true,
      fadeOpacity: 0.72,
      fadeDesaturation: 0.4,
      showEdgeLines: true,
      showPlacementArrows: true,
      showRotationIndicators: true,
    },
  },
  'technical-blueprint': {
    id: 'technical-blueprint',
    label: 'Drafting Blueprint',
    tagline: 'Prussian technical blueprint styling with crisp white callouts & monospace indices',
    swatch: ['#133B6B', '#1C4E8A', '#74D3FF'],
    settings: {
      presetId: 'technical-blueprint',
      pageSize: 'a4',
      orientation: 'landscape',
      defaultLayout: 'auto',
      backgroundMode: 'blueprint-grid',
      backgroundColor: '#123A6B',
      backgroundGradientEnd: '#0D2B52',
      accentColor: '#74D3FF',
      textColor: '#F0F7FF',
      mutedTextColor: '#9BC4EC',
      pliBackground: '#17467E',
      pliBorderColor: '#5DA6E5',
      calloutBackground: '#0E305A',
      calloutBorderColor: '#74D3FF',
      fontFamily: 'mono',
      stepNumberScale: 1.0,
      showPageNumbers: true,
      highlightNewParts: true,
      highlightColor: '#5CF2FF',
      highlightIntensity: 0.95,
      fadePreviousParts: true,
      fadeOpacity: 0.74,
      fadeDesaturation: 0.55,
      showEdgeLines: true,
      showPlacementArrows: true,
      showRotationIndicators: true,
    },
  },
};

export function getPageDimensions(
  size: ThemeSettings['pageSize'],
  orientation: ThemeSettings['orientation'],
): { widthMm: number; heightMm: number; aspectRatio: number } {
  const base =
    size === 'a4'
      ? { w: 210, h: 297 }
      : size === 'square'
        ? { w: 220, h: 220 }
        : { w: 215.9, h: 279.4 }; // letter
  const widthMm = orientation === 'landscape' ? Math.max(base.w, base.h) : Math.min(base.w, base.h);
  const heightMm = orientation === 'landscape' ? Math.min(base.w, base.h) : Math.max(base.w, base.h);
  return { widthMm, heightMm, aspectRatio: widthMm / heightMm };
}
