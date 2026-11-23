// @ts-nocheck
/* eslint-disable */
// Brick Instruction Creator — Interactive WebGL Manual Studio Runtime
// Compiled & bundled locally by Vite for GitHub Pages and Neocities deployment.

import {
  analyzeModelSubdivisions,
  classifySubdivisionPartFlags,
} from './engine/subdivisionAnalyzer';
import {
  compileDatEntry as compileLDrawDatEntry,
  isDirectRgbColor,
} from './engine/datCompiler';
import { textureStore } from './engine/textureStore';
import {
  classifyDetachedPart,
  computeGroundPlaneY,
} from './engine/floatingCheck';
import {
  acknowledgeDiagnostics,
  deserializeSeenDiagnosticKeys,
  formatMenuIconErrorBadge,
  getMenuIconErrorBadgeCount,
  pruneSeenDiagnosticKeys,
  serializeSeenDiagnosticKeys,
} from './engine/diagnosticsBadge';
import {
  MINIFIG_BUILD_CAMERA,
  MINIFIG_POSE_CAMERA,
  classifyMinifigGroupKind,
  classifyMinifigLeafRole,
  computeMinifigOneToOneLayout,
  extractMinifigureGroups,
  normalizeCompositeThumbPart,
  normalizeMinifigureForBuild,
} from './engine/minifigPose';
import {
  DEFAULT_STUDIO_CAMERA,
  chooseMinifigPlacementCamera,
  computeStudioRotationCue,
} from './engine/minifigCamera';
import {
  buildMinifigExplodedPlan,
  buildMinifigSequentialPlan,
  normalizeMinifigStepStyle,
  paginateMinifigSequentialStages,
} from './engine/minifigSteps';
import {
  clearAllStepPageBreaks,
  countStepPageBreaks,
  findPageIndexForStep,
  getStepBreakFeedbackMessage,
  getStepBreakTooltip,
  hasStepPageBreak,
  isStepBreakContinuationSlice,
  toggleStepPageBreakOverride,
} from './engine/pageBreaks';
import {
  BUILT_IN_THEMES,
  BUILT_IN_THEME_IDS,
  applyThemeBackgroundToElement,
  buildThemeBgCss,
  createThemeDraftFromBase,
  fillThemeBackgroundCanvas,
  loadCustomThemesFromStorage,
  mergeImportedThemes,
  normalizeCustomTheme,
  parseImportedThemesJson,
  resolveThemeById,
  saveCustomThemesToStorage,
  serializeThemeExport,
  serializeThemesPackExport,
  slugifyThemeFilename,
  toHexColor,
} from './themes/customThemes';
import {
  PROGRAM_NAME,
  PROGRAM_URL,
  clampCoverElevation,
  clampCoverZoom,
  computeCameraBasis,
  computeCoverLayout,
  computeTightCameraBounds,
  createDefaultCoverMeta,
  normalizeCoverMeta,
} from './cover/coverLayout';
import { buildQrSvg, drawQrCanvas } from './cover/qrCode';
import { StudioPhotoRenderer } from './cover/studioPhotoRenderer';
import { buildPdfBinary, canvasRectToPdfLink } from './export/pdfBinary';
import {
  computeCanonicalPageMetrics,
  computePageTypography,
  estimateBomCellGeometry,
} from './engine/pageTypography';

const BRAND_LOGO_ROTATION_DEG = 12;
const BRAND_LOGO_PATHS: ReadonlyArray<readonly [string, string]> = [
  ['M24.8 7.8 Q17.9 12.8 13.7 20.2 L16.3 19.7 Q13.8 23.2 11.6 26.6 Q11.3 31.1 11.6 35.3 L14.9 32.7 Q13.9 38.0 13.3 42.8 Q14.6 45.2 15.8 47.2 L18.2 42.8 Q19.8 48.9 21.1 54.7 Q14.1 52.2 6.7 49.4 L13.1 48.9 Q12.0 46.5 11.1 43.7 Q7.5 38.4 3.3 32.7 L8.9 35.6 Q8.9 31.0 9.8 26.2 Q9.4 20.7 8.7 14.7 L11.7 19.3 Q17.3 12.2 24.8 7.8 Z', '#38bdf8'],
  ['M31.7 7.1 Q34.8 10.1 37.5 15.7 L40.5 12.6 Q39.4 17.0 38.6 21.0 Q39.3 24.7 39.7 28.3 L44.0 25.1 Q41.5 30.5 39.5 35.5 Q39.5 39.0 39.4 42.1 L45.1 39.1 Q41.3 43.9 38.0 48.3 Q37.7 50.7 37.2 52.6 L43.4 51.6 Q37.7 54.5 32.1 57.0 Q31.0 52.0 30.1 46.7 L33.7 51.3 Q34.4 49.7 35.3 47.6 Q34.4 43.5 33.2 39.1 L36.2 41.6 Q36.7 38.7 37.0 35.4 Q35.0 30.9 32.5 26.0 L36.9 28.4 Q36.8 24.9 36.5 21.3 Q34.9 18.4 32.8 15.4 L35.5 16.3 Q34.0 10.5 31.7 7.1 Z', '#7c152e'],
  ['M38.5 8.3 Q46.1 12.5 51.9 18.8 L54.4 14.1 Q54.1 19.9 54.2 25.1 Q55.2 29.4 55.5 33.5 L60.9 30.3 Q57.1 36.0 53.8 41.3 Q53.3 43.4 52.6 45.4 L58.5 45.0 Q51.8 48.7 45.4 51.9 Q46.2 46.3 47.4 40.3 L49.8 43.9 Q50.7 42.4 51.6 40.6 Q50.8 36.2 49.6 31.4 L52.8 33.4 Q52.8 29.7 52.3 25.6 Q50.1 22.7 47.5 19.6 L50.0 19.8 Q45.5 13.1 38.5 8.3 Z', '#ed7d1f'],
];
const BRAND_LOGO_SVG_BODY = `<g transform="rotate(${BRAND_LOGO_ROTATION_DEG} 32 32)">${BRAND_LOGO_PATHS.map(([d, col]) => `<path d="${d}" fill="${col}"/>`).join('')}</g>`;

let initialized = false;

export function initBrickInstructionCreator(): void {
  if (initialized) return;
  initialized = true;

// =========================================================================
// 1. COLORS, THEMES, PAPER FORMATS & PART CATALOG
// =========================================================================
const COLORS = {
  0:{name:'Black',hex:'#1e2126',edge:'#525864'},
  1:{name:'Blue',hex:'#0055bf',edge:'#002f6c'},
  2:{name:'Green',hex:'#237841',edge:'#144626'},
  3:{name:'Dark Turquoise',hex:'#008f9b',edge:'#00535b'},
  4:{name:'Red',hex:'#c91a09',edge:'#780f05'},
  5:{name:'Dark Pink',hex:'#c870a0',edge:'#7a3d5f'},
  6:{name:'Brown',hex:'#583927',edge:'#332016'},
  7:{name:'Light Gray',hex:'#9ba19d',edge:'#5d625f'},
  8:{name:'Dark Gray',hex:'#6d6e5c',edge:'#3f4035'},
  9:{name:'Light Blue',hex:'#b4d2e3',edge:'#6f93a8'},
  10:{name:'Bright Green',hex:'#4b9f4a',edge:'#295e28'},
  11:{name:'Light Turquoise',hex:'#55a5af',edge:'#2e646b'},
  12:{name:'Salmon',hex:'#f2705e',edge:'#9e3a2d'},
  13:{name:'Pink',hex:'#fc97ac',edge:'#a85466'},
  14:{name:'Yellow',hex:'#f2cd37',edge:'#9e810d'},
  15:{name:'White',hex:'#f6f7f9',edge:'#9aa0a6'},
  17:{name:'Light Green',hex:'#c2dab8',edge:'#739168'},
  18:{name:'Light Yellow',hex:'#fbe696',edge:'#ad9747'},
  19:{name:'Tan',hex:'#e4cd9e',edge:'#947d50'},
  20:{name:'Light Violet',hex:'#c9cae2',edge:'#7f809c'},
  22:{name:'Purple',hex:'#81007b',edge:'#4a0047'},
  23:{name:'Dark Blue-Violet',hex:'#2032b0',edge:'#101a66'},
  25:{name:'Orange',hex:'#fe8a18',edge:'#a15003'},
  26:{name:'Magenta',hex:'#923978',edge:'#541d44'},
  27:{name:'Lime',hex:'#bbe90b',edge:'#6d8a04'},
  28:{name:'Dark Tan',hex:'#958a73',edge:'#595243'},
  29:{name:'Bright Pink',hex:'#e4adc8',edge:'#9c617f'},
  30:{name:'Medium Lavender',hex:'#ac78ba',edge:'#6b4276'},
  31:{name:'Lavender',hex:'#e1d5ed',edge:'#9683ab'},
  33:{name:'Trans-Dark Blue',hex:'#0020a0',edge:'#001155',alpha:0.46},
  34:{name:'Trans-Green',hex:'#237841',edge:'#124223',alpha:0.46},
  35:{name:'Trans-Bright Green',hex:'#56e646',edge:'#2d8723',alpha:0.48},
  36:{name:'Trans-Red',hex:'#c91a09',edge:'#730e04',alpha:0.48},
  37:{name:'Trans-Dark Pink',hex:'#df6695',edge:'#8a3657',alpha:0.48},
  38:{name:'Trans-Neon Orange',hex:'#ff800d',edge:'#9e4a00',alpha:0.50},
  40:{name:'Trans-Black',hex:'#42464f',edge:'#1d2026',alpha:0.42},
  41:{name:'Trans-Light Blue',hex:'#7ec8f2',edge:'#3b7ca3',alpha:0.44},
  42:{name:'Trans-Neon Green',hex:'#d8f030',edge:'#849613',alpha:0.50},
  43:{name:'Trans-Very Lt Blue',hex:'#c1dff0',edge:'#719ab3',alpha:0.42},
  44:{name:'Trans-Light Purple',hex:'#96709f',edge:'#563a5e',alpha:0.46},
  45:{name:'Trans-Pink',hex:'#fc97ac',edge:'#a85466',alpha:0.46},
  46:{name:'Trans-Yellow',hex:'#f5cd2f',edge:'#9c7e09',alpha:0.50},
  47:{name:'Trans-Clear',hex:'#e2ecf5',edge:'#8a99a8',alpha:0.34},
  52:{name:'Trans-Purple',hex:'#a5a5cb',edge:'#5e5e82',alpha:0.46},
  54:{name:'Trans-Neon Yellow',hex:'#dab000',edge:'#826800',alpha:0.48},
  57:{name:'Trans-Orange',hex:'#f08f1c',edge:'#945205',alpha:0.50},
  68:{name:'Very Light Orange',hex:'#f3cf9b',edge:'#a68352'},
  69:{name:'Light Purple',hex:'#cd6298',edge:'#80355b'},
  70:{name:'Reddish Brown',hex:'#582a12',edge:'#2e1406'},
  71:{name:'Light Bluish Gray',hex:'#a0a5a9',edge:'#5c6064'},
  72:{name:'Dark Bluish Gray',hex:'#6c6e68',edge:'#3a3c38'},
  73:{name:'Medium Blue',hex:'#5a93db',edge:'#2e5991'},
  74:{name:'Medium Green',hex:'#73dca1',edge:'#388a5b'},
  77:{name:'Light Pink',hex:'#fecccf',edge:'#b37d81'},
  78:{name:'Light Nougat',hex:'#f6d7b3',edge:'#a88760'},
  80:{name:'Metallic Silver',hex:'#a5a9b4',edge:'#626670'},
  81:{name:'Metallic Green',hex:'#899b5f',edge:'#505c34'},
  82:{name:'Metallic Gold',hex:'#dbac34',edge:'#8a6915'},
  84:{name:'Medium Nougat',hex:'#aa7d55',edge:'#63452a'},
  85:{name:'Dark Purple',hex:'#3f3691',edge:'#211b54'},
  86:{name:'Dark Nougat',hex:'#7c503a',edge:'#452a1d'},
  89:{name:'Royal Blue',hex:'#4c61db',edge:'#25348a'},
  92:{name:'Nougat',hex:'#d09168',edge:'#825335'},
  100:{name:'Light Salmon',hex:'#febabd',edge:'#b06f72'},
  110:{name:'Violet',hex:'#4354a3',edge:'#242f63'},
  112:{name:'Blue-Violet',hex:'#6874ca',edge:'#394282'},
  115:{name:'Medium Lime',hex:'#c7d23c',edge:'#7c8519'},
  118:{name:'Aqua',hex:'#b3d7d1',edge:'#6a8f89'},
  120:{name:'Light Lime',hex:'#d9e4a7',edge:'#8c965c'},
  125:{name:'Light Orange',hex:'#f9ba61',edge:'#a87429'},
  128:{name:'Dark Nougat Alt',hex:'#ad6140',edge:'#66351f'},
  134:{name:'Copper',hex:'#ae7a59',edge:'#66432d'},
  135:{name:'Pearl Light Gray',hex:'#9ca3a8',edge:'#5a6066'},
  142:{name:'Pearl Light Gold',hex:'#dcbe61',edge:'#8c752e'},
  148:{name:'Pearl Dark Gray',hex:'#575857',edge:'#2d2e2d'},
  150:{name:'Pearl Very Light Gray',hex:'#bbbfc2',edge:'#73777a'},
  151:{name:'Very Light Bluish Gray',hex:'#e6e3e0',edge:'#9c9895'},
  178:{name:'Flat Dark Gold',hex:'#b48455',edge:'#6b4b2b'},
  179:{name:'Flat Silver',hex:'#898788',edge:'#4e4d4e'},
  183:{name:'Pearl White',hex:'#f2f3f2',edge:'#9ea19e'},
  191:{name:'Bright Light Orange',hex:'#f8bb3d',edge:'#a37414'},
  212:{name:'Bright Light Blue',hex:'#9fc3e9',edge:'#577ea8'},
  216:{name:'Rust',hex:'#b31004',edge:'#690700'},
  218:{name:'Reddish Lilac',hex:'#8e5597',edge:'#522c59'},
  219:{name:'Lilac',hex:'#564e9d',edge:'#2d275e'},
  222:{name:'Light Purple',hex:'#ee9dc3',edge:'#a3587b'},
  226:{name:'Bright Light Yellow',hex:'#fff03a',edge:'#a69a12'},
  232:{name:'Sky Blue',hex:'#7dbfdd',edge:'#427a94'},
  272:{name:'Dark Blue',hex:'#0a3463',edge:'#041a33'},
  288:{name:'Dark Green',hex:'#184632',edge:'#0b2419'},
  295:{name:'Flamingo Pink',hex:'#ff94c2',edge:'#b0537b'},
  297:{name:'Pearl Gold',hex:'#aa7f2e',edge:'#614613'},
  308:{name:'Dark Brown',hex:'#352100',edge:'#1a1000'},
  313:{name:'Maersk Blue',hex:'#3592c3',edge:'#1b5778'},
  320:{name:'Dark Red',hex:'#720e0f',edge:'#3d0607'},
  321:{name:'Dark Azure',hex:'#078bc9',edge:'#034e73'},
  322:{name:'Medium Azure',hex:'#36aebf',edge:'#1b6570'},
  323:{name:'Light Aqua',hex:'#adc3c0',edge:'#637a77'},
  325:{name:'Lavender Alt',hex:'#cda4de',edge:'#845c94'},
  326:{name:'Yellowish Green',hex:'#dfeea5',edge:'#8e9e53'},
  330:{name:'Olive Green',hex:'#9b9a5a',edge:'#57562d'},
  334:{name:'Chrome Gold',hex:'#bba53d',edge:'#70611b'},
  335:{name:'Sand Red',hex:'#d67572',edge:'#8a413f'},
  351:{name:'Medium Dark Pink',hex:'#f785b1',edge:'#a8476d'},
  353:{name:'Vibrant Coral',hex:'#ff6d77',edge:'#b03b43'},
  366:{name:'Earth Orange',hex:'#fa9c1c',edge:'#a66005'},
  368:{name:'Neon Yellow',hex:'#edff21',edge:'#9aa807'},
  373:{name:'Sand Purple',hex:'#845e84',edge:'#4d334d'},
  378:{name:'Sand Green',hex:'#a0bcac',edge:'#5b7566'},
  379:{name:'Sand Blue',hex:'#6074a1',edge:'#374566'},
  383:{name:'Chrome Silver',hex:'#e0e0e0',edge:'#8c8c8c'},
  450:{name:'Fabuland Brown',hex:'#b67b50',edge:'#6e4629'},
  462:{name:'Medium Orange',hex:'#ffa70b',edge:'#a86800'},
  484:{name:'Dark Orange',hex:'#a95500',edge:'#5e2f00'},
  503:{name:'Very Light Gray',hex:'#e6e3da',edge:'#99968e'},
};

const THEMES = BUILT_IN_THEMES;
let customThemes = loadCustomThemesFromStorage();

function getActiveTheme() {
  return resolveThemeById(state.themeId, customThemes);
}

function persistCustomThemes() {
  saveCustomThemesToStorage(customThemes);
  if (typeof dbPut === 'function') {
    dbPut('customThemes', customThemes);
  }
}

async function shareOrDownloadJsonFile(jsonText, fileName, sharedMsg, savedMsg) {
  const blob = new Blob([jsonText], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: fileName });
      showToast(sharedMsg);
      return;
    } catch (_) {
      // Fall back to direct file download if Share Sheet is canceled/unavailable
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  showToast(savedMsg);
}

const PAPER_FORMATS = {
  screen: { id:'screen', name:'Screen Fit',     wIn: 11,   hIn: 8.5 },
  letter: { id:'letter', name:'US Letter',      wIn: 8.5,  hIn: 11 },
  a4:     { id:'a4',     name:'A4 Paper',       wIn: 8.27, hIn: 11.69 },
  square: { id:'square', name:'Booklet Square', wIn: 8.5,  hIn: 8.5 },
  custom: { id:'custom', name:'Custom Size',    wIn: 10,   hIn: 8 },
};

const DENSITY_PAD = {
  compact:  { pad: 12, gap: 8 },
  balanced: { pad: 20, gap: 14 },
  spacious: { pad: 30, gap: 20 },
};

const CORNERS = [
  { id:'front_right', label:'Front Right', az: 38 },
  { id:'back_right',  label:'Back Right',  az: 142 },
  { id:'back_left',   label:'Back Left',   az: 218 },
  { id:'front_left',  label:'Front Left',  az: 322 },
];

const PARTS_CATALOG = {
  // Standard Bricks
  '3005':{name:'Brick 1×1',sx:1,sz:1,h:24,studs:true}, '3004':{name:'Brick 1×2',sx:2,sz:1,h:24,studs:true},
  '3622':{name:'Brick 1×3',sx:3,sz:1,h:24,studs:true}, '3010':{name:'Brick 1×4',sx:4,sz:1,h:24,studs:true},
  '3009':{name:'Brick 1×6',sx:6,sz:1,h:24,studs:true}, '3008':{name:'Brick 1×8',sx:8,sz:1,h:24,studs:true},
  '6111':{name:'Brick 1×10',sx:10,sz:1,h:24,studs:true}, '6112':{name:'Brick 1×12',sx:12,sz:1,h:24,studs:true},
  '3003':{name:'Brick 2×2',sx:2,sz:2,h:24,studs:true}, '3002':{name:'Brick 2×3',sx:3,sz:2,h:24,studs:true},
  '3001':{name:'Brick 2×4',sx:4,sz:2,h:24,studs:true}, '2456':{name:'Brick 2×6',sx:6,sz:2,h:24,studs:true},
  '3007':{name:'Brick 2×8',sx:8,sz:2,h:24,studs:true}, '3006':{name:'Brick 2×10',sx:10,sz:2,h:24,studs:true},
  '2357':{name:'Brick 2×2 Corner',sx:2,sz:2,h:24,studs:true}, '6541':{name:'Technic Brick 1×1',sx:1,sz:1,h:24,studs:true},
  '3700':{name:'Technic Brick 1×2',sx:2,sz:1,h:24,studs:true}, '3701':{name:'Technic Brick 1×4',sx:4,sz:1,h:24,studs:true},
  '3894':{name:'Technic Brick 1×6',sx:6,sz:1,h:24,studs:true},
  // Standard Plates
  '3024':{name:'Plate 1×1',sx:1,sz:1,h:8,studs:true}, '3023':{name:'Plate 1×2',sx:2,sz:1,h:8,studs:true},
  '3623':{name:'Plate 1×3',sx:3,sz:1,h:8,studs:true}, '3710':{name:'Plate 1×4',sx:4,sz:1,h:8,studs:true},
  '3666':{name:'Plate 1×6',sx:6,sz:1,h:8,studs:true}, '3460':{name:'Plate 1×8',sx:8,sz:1,h:8,studs:true},
  '4477':{name:'Plate 1×10',sx:10,sz:1,h:8,studs:true}, '60479':{name:'Plate 1×12',sx:12,sz:1,h:8,studs:true},
  '3022':{name:'Plate 2×2',sx:2,sz:2,h:8,studs:true}, '2420':{name:'Plate 2×2 Corner',sx:2,sz:2,h:8,studs:true},
  '3021':{name:'Plate 2×3',sx:3,sz:2,h:8,studs:true}, '3020':{name:'Plate 2×4',sx:4,sz:2,h:8,studs:true},
  '3795':{name:'Plate 2×6',sx:6,sz:2,h:8,studs:true}, '3034':{name:'Plate 2×8',sx:8,sz:2,h:8,studs:true},
  '3832':{name:'Plate 2×10',sx:10,sz:2,h:8,studs:true}, '2445':{name:'Plate 2×12',sx:12,sz:2,h:8,studs:true},
  '3031':{name:'Plate 4×4',sx:4,sz:4,h:8,studs:true}, '3032':{name:'Plate 4×6',sx:6,sz:4,h:8,studs:true},
  '3035':{name:'Plate 4×8',sx:8,sz:4,h:8,studs:true}, '3030':{name:'Plate 4×10',sx:10,sz:4,h:8,studs:true},
  '3958':{name:'Plate 6×6',sx:6,sz:6,h:8,studs:true}, '3036':{name:'Plate 6×8',sx:8,sz:6,h:8,studs:true},
  '3033':{name:'Plate 6×10',sx:10,sz:6,h:8,studs:true}, '3028':{name:'Plate 6×12',sx:12,sz:6,h:8,studs:true},
  '35480':{name:'Rounded Plate 1×2',sx:2,sz:1,h:8,studs:true}, '3794':{name:'Jumper Plate 1×2',sx:2,sz:1,h:8,studs:true},
  '15573':{name:'Jumper Plate 1×2',sx:2,sz:1,h:8,studs:true}, '87580':{name:'Jumper Plate 2×2',sx:2,sz:2,h:8,studs:true},
  '92593':{name:'Plate 1×4 (2 Studs)',sx:4,sz:1,h:8,studs:true}, '41740':{name:'Plate 1×4 (2 Studs)',sx:4,sz:1,h:8,studs:true},
  '32001':{name:'Technic Plate 2×6',sx:6,sz:2,h:8,studs:true},
  // Tiles & Grilles
  '3070b':{name:'Tile 1×1',sx:1,sz:1,h:8,studs:false}, '3069b':{name:'Tile 1×2',sx:2,sz:1,h:8,studs:false},
  '63864':{name:'Tile 1×3',sx:3,sz:1,h:8,studs:false}, '2431':{name:'Tile 1×4',sx:4,sz:1,h:8,studs:false},
  '6636':{name:'Tile 1×6',sx:6,sz:1,h:8,studs:false}, '4162':{name:'Tile 1×8',sx:8,sz:1,h:8,studs:false},
  '3068b':{name:'Tile 2×2',sx:2,sz:2,h:8,studs:false}, '26603':{name:'Tile 2×3',sx:3,sz:2,h:8,studs:false},
  '87079':{name:'Tile 2×4',sx:4,sz:2,h:8,studs:false}, '69729':{name:'Tile 2×6',sx:6,sz:2,h:8,studs:false},
  '2412b':{name:'Grille Tile 1×2',sx:2,sz:1,h:8,studs:false}, '25269':{name:'Quarter Round Tile 1×1',sx:1,sz:1,h:8,studs:false},
  '98138':{name:'Round Tile 1×1',sx:1,sz:1,h:8,studs:false,shape:'round'}, '14769':{name:'Round Tile 2×2',sx:2,sz:2,h:8,studs:false,shape:'round'},
  '15535':{name:'Round Tile 2×2 w/ Hole',sx:2,sz:2,h:8,studs:false,shape:'round'},
  // Round Bricks & Plates
  '4073':{name:'Round Plate 1×1',sx:1,sz:1,h:8,studs:true,shape:'round'}, '4032':{name:'Round Plate 2×2',sx:2,sz:2,h:8,studs:true,shape:'round'},
  '60474':{name:'Round Plate 4×4',sx:4,sz:4,h:8,studs:true,shape:'round'}, '3062b':{name:'Round Brick 1×1',sx:1,sz:1,h:24,studs:true,shape:'round'},
  '3941':{name:'Round Brick 2×2',sx:2,sz:2,h:24,studs:true,shape:'round'},
  // Slopes, Brackets, Windows, Clips & Modified
  '54200':{name:'Cheese Slope 1×1',sx:1,sz:1,h:16,studs:false,shape:'slope'}, '85984':{name:'Slope 30° 1×2×2/3',sx:2,sz:1,h:16,studs:false,shape:'slope'},
  '3040b':{name:'Slope 45° 2×1',sx:2,sz:1,h:24,studs:true,shape:'slope',topStudsX:1}, '3665':{name:'Inverted Slope 45° 2×1',sx:2,sz:1,h:24,studs:true},
  '3039':{name:'Slope 45° 2×2',sx:2,sz:2,h:24,studs:true,shape:'slope',topStudsX:1}, '49307':{name:'Curved Slope 1×1×2/3',sx:1,sz:1,h:16,studs:false,shape:'slope'},
  '4733':{name:'SNOT Brick 1×1 (4 Sides)',sx:1,sz:1,h:24,studs:true,shape:'snot4'}, '87087':{name:'SNOT Brick 1×1 (1 Side)',sx:1,sz:1,h:24,studs:true,shape:'snot1'},
  '99206':{name:'Plate 2×2×2/3 Bracket',sx:2,sz:2,h:16,studs:true}, '44728':{name:'Bracket 1×2 - 2×2',sx:2,sz:2,h:24,studs:true},
  '99780':{name:'Bracket 1×2 - 1×2 Inverted',sx:2,sz:1,h:24,studs:true}, '99781':{name:'Bracket 1×2 - 1×2',sx:2,sz:1,h:24,studs:true},
  '60475b':{name:'Brick 1×1 w/ Vertical Clip',sx:1,sz:1,h:24,studs:true,shape:'clip_h'}, '15712':{name:'Tile 1×1 w/ Clip',sx:1,sz:1,h:8,studs:false,shape:'clip_v'},
  '60470b':{name:'Plate 1×2 with Clips',sx:2,sz:1,h:8,studs:true,shape:'clip_h'}, '6019':{name:'Plate 1×1 with Clip',sx:1,sz:1,h:8,studs:true,shape:'clip_h'},
  '4085d':{name:'Plate 1×1 Vertical Clip',sx:1,sz:1,h:8,studs:false,shape:'clip_v'},
  '60594':{name:'Window Frame 1×4×3',sx:4,sz:1,h:72,studs:true}, '60593':{name:'Window Frame 1×2×3',sx:2,sz:1,h:72,studs:true},
  '60603':{name:'Window Glass 1×4×3',sx:4,sz:0.3,h:64,studs:false}, '60601':{name:'Window Glass 1×2×2',sx:2,sz:0.3,h:48,studs:false},
  '4079':{name:'Minifigure Seat 2×2',sx:2,sz:2,h:24,studs:false}, '38339':{name:'Train Wheel Holder',sx:2,sz:6,h:24,studs:true},
  '38340':{name:'Train Wheel RC',sx:1,sz:2,h:32,studs:false,shape:'round'},
  // Bars & Technic Axles (1:1 Size Guides)
  '30374':{name:'Bar 4L',sx:0.4,sz:0.4,h:80,studs:false,shape:'bar',lengthL:4},
  '63965':{name:'Bar 6L',sx:0.4,sz:0.4,h:120,studs:false,shape:'bar',lengthL:6},
  '3707':{name:'Technic Axle 8L',sx:0.4,sz:0.4,h:160,studs:false,shape:'bar',centered:true,lengthL:8},
  '4519':{name:'Technic Axle 3L',sx:0.4,sz:0.4,h:60,studs:false,shape:'bar',centered:true,lengthL:3},
  '32062':{name:'Technic Axle 2L',sx:0.4,sz:0.4,h:40,studs:false,shape:'bar',centered:true,lengthL:2},
  '3705':{name:'Technic Axle 4L',sx:0.4,sz:0.4,h:80,studs:false,shape:'bar',centered:true,lengthL:4},
  '32073':{name:'Technic Axle 5L',sx:0.4,sz:0.4,h:100,studs:false,shape:'bar',centered:true,lengthL:5},
  '3706':{name:'Technic Axle 6L',sx:0.4,sz:0.4,h:120,studs:false,shape:'bar',centered:true,lengthL:6},
  '3815c01':{name:'Minifigure Hips & Legs',sx:1.6,sz:0.8,h:28,studs:false,shape:'mf_legs'},
  '970c00':{name:'Minifigure Hips & Legs',sx:1.6,sz:0.8,h:28,studs:false,shape:'mf_legs'},
  '973':{name:'Minifigure Torso',sx:1.5,sz:0.75,h:32,studs:false,shape:'mf_torso_body'},
  '973c01':{name:'Minifigure Torso Assembly',sx:1.9,sz:0.8,h:32,studs:false,shape:'mf_torso'},
  '3626':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3626b':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3626c':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3626cp01':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '28621':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3842a':{name:'Minifigure Helmet',sx:1.2,sz:1.2,h:24,studs:false,shape:'mf_helmet'},
};

// Embedded .dat definitions extracted from Studio .io model2.ldr + User-imported LDraw Library
const embeddedDatRaw = new Map();
const embeddedDatTitles = new Map();
const userLibRaw = new Map();
const userLibTitles = new Map();
const embeddedDatCompiled = new Map();
const compositePartDefs = new Map(); // Fused assemblies (e.g., Minifig Torso+Arms+Hands, Hips+Legs)

function normId(raw) {
  return String(raw || '').trim().replace(/\\/g, '/').toLowerCase().replace(/^ldraw\//,'').replace(/^parts\//,'').replace(/^p\//,'').replace(/\.dat$/i,'');
}

// BrickLink Studio un-expanded torso assemblies (bl_973pb*c01, bl_973c*) have their local origin at waist corner
// instead of LDraw 973c01's neck-base origin: shifted by (-20, -32, +10) in LDraw coords.
function isBrickLinkTorsoAssemblyId(k) {
  const clean = normId(k).replace(/-bl$/, '');
  return /^bl_973(?:p[a-z0-9]*)?c\d+[a-z]?$/i.test(clean);
}

// Map BrickLink Studio / decorated / printed part IDs (bl_*, *-bl, *pb####*, *_torso)
// to their canonical unprinted LDraw base IDs so local cache & public LDraw mirrors resolve them!
function getPartIdFallbacks(raw) {
  const k = normId(raw);
  if (!k || k.includes('/')) return [];
  const out = [];
  const add = (id) => { if (id && id !== k && !out.includes(id)) out.push(id); };

  const noBl = k.replace(/^bl_/, '').replace(/-bl$/, '');

  // Minifig bare torso bodies (no arms!) vs complete torso+arms+hands assemblies
  if (/^973.*_torso$/i.test(noBl)) {
    add('973');
    return out;
  }
  if (/^973(?:p[a-z0-9]*)?c\d+[a-z]?$/i.test(noBl) || /^76382(?:p[a-z0-9]*)?(?:c\d+[a-z]?)?$/i.test(noBl)) {
    add('973c01');
    return out;
  }
  if (/^973p[a-z0-9]+$/i.test(noBl)) {
    add('973');
    return out;
  }

  // Strip BrickLink print/sticker suffixes (pb####, ps####, pat####, pr####)
  const noBlPrint = noBl.replace(/(?:pb|ps|pat|pr)\d+[a-z0-9_]*$/i, '');
  if (noBlPrint && noBlPrint !== noBl) {
    add(noBlPrint);
  } else if (noBl !== k) {
    add(noBl);
  }

  // Strip LDraw print/pattern suffix when preceded by a 3+ digit base mold (e.g., 3626cp01 -> 3626c)
  const candBase = noBlPrint || noBl;
  const mLdrawPrint = candBase.match(/^(\d{3,}[a-z]?)(?:p[0-9a-z]{2,}|d\d+)$/i);
  if (mLdrawPrint) add(mLdrawPrint[1]);

  const effective = mLdrawPrint ? mLdrawPrint[1] : candBase;
  if (/^\d{3,}[a-z]$/i.test(effective)) add(effective.slice(0, -1));
  if (/^\d{3,}c\d+$/i.test(effective)) add(effective.replace(/c\d+$/i, ''));

  // Known exact LDraw / BrickLink mold equivalences
  if (effective === '28621') { add('3626c'); add('3626b'); add('3626'); }
  if (effective === '3626c') { add('3626b'); add('3626'); }
  if (/^970c\d+$/i.test(effective)) { add('970c00'); add('3815c01'); }
  if (effective === '970') { add('3815'); }
  if (effective === '971') { add('3816'); }
  if (effective === '972') { add('3817'); }
  if (effective === '3814') { add('973'); }
  if (effective === '981') { add('3819'); }
  if (effective === '982') { add('3818'); }
  if (effective === '983') { add('3820'); }

  return out;
}

// Friendly human-readable names for common BrickLink / Studio & specialty LDraw part IDs
const KNOWN_EXTRA_PART_NAMES = {
  '28621': 'Minifigure Head (Hollow Stud)',
  '29085': 'Train Buffer Beam with Magnet Coupler',
  '29085c01': 'Train Buffer Beam with Magnet Coupler',
  'bb892': 'Powered Up Train Motor',
  'bb892c01': 'Powered Up Train Motor',
  '28740': 'Powered Up Train Motor',
  '28740c01': 'Powered Up Train Motor',
  '76925': 'Minifigure Hair / Headgear',
  '26066': 'Minifigure Hair / Headgear',
  '11303': 'Minifigure Hair',
  '66913': 'Minifigure Hair',
  '21778': 'Minifigure Hair',
  '98385': 'Minifigure Hair',
  '15207': 'Panel 1×4×1',
  '14716': 'Brick 1×1×3',
  '86996': 'Brick 1×1×2/3',
  '11477': 'Curved Slope 2×1',
  '41740': 'Plate 1×4 (2 Studs)',
  '15068': 'Curved Slope 2×2×2/3',
  '61976': 'Minifigure Messenger Bag',
  '93091': 'Minifigure Handbag / Purse',
  '93082': 'Minifigure Purse / Handbag',
  '92590': 'Minifigure Backpack / Bag',
  '10169': 'Minifigure Bag with Handle',
  '4449': 'Minifigure Suitcase / Briefcase',
  '24093': 'Minifigure Accessory',
  '3814': 'Minifigure Torso',
  '3815': 'Minifigure Hips',
  '3816': 'Minifigure Leg (Right)',
  '3817': 'Minifigure Leg (Left)',
  '3818': 'Minifigure Arm (Right)',
  '3819': 'Minifigure Arm (Left)',
  '3820': 'Minifigure Hand',
  '970': 'Minifigure Hips',
  '971': 'Minifigure Leg (Right)',
  '972': 'Minifigure Leg (Left)',
  '981': 'Minifigure Arm (Left)',
  '982': 'Minifigure Arm (Right)',
  '983': 'Minifigure Hand',
};

function getHumanPartName(pid) {
  const k = normId(pid);
  const isMeaningfulTitle = (t, id) => Boolean(t && normId(t) !== normId(id));
  const directTitle = embeddedDatTitles.get(k) || userLibTitles.get(k);
  if (isMeaningfulTitle(directTitle, k)) return directTitle;

  const isPrinted = /(?:pb|ps|pat|pr)\d+/i.test(k) || /^\d{3,}[a-z]?p[0-9a-z]{2,}/i.test(k);
  const lookupName = (id) => {
    const t = embeddedDatTitles.get(id) || userLibTitles.get(id);
    if (isMeaningfulTitle(t, id)) return t;
    if (KNOWN_EXTRA_PART_NAMES[id]) return KNOWN_EXTRA_PART_NAMES[id];
    if (PARTS_CATALOG[id]?.name) return PARTS_CATALOG[id].name;
    return null;
  };

  let baseName = lookupName(k);
  if (!baseName) {
    for (const fb of getPartIdFallbacks(k)) {
      baseName = lookupName(fb);
      if (baseName) break;
    }
  }
  if (!baseName) {
    const noBl = k.replace(/^bl_/, '').replace(/-bl$/, '');
    baseName = lookupName(noBl) || lookupName(noBl.replace(/[a-z].*$/, ''));
  }
  if (!baseName) {
    if (/^bb\d+/i.test(k)) return 'BrickLink Custom Assembly';
    if (/^bl_/i.test(k)) return isPrinted ? 'Printed BrickLink Studio Part' : 'BrickLink Studio Custom Part';
    if (isPrinted) return 'Printed Part';
    return `Part ${k.toUpperCase()}`;
  }
  if (isPrinted && !/^printed\b/i.test(baseName)) return `Printed ${baseName}`;
  return baseName;
}

function explainMissingPartReason(pid) {
  const k = normId(pid);
  const fbs = getPartIdFallbacks(k);
  const isPrinted = /(?:pb|ps|pat|pr)\d+/i.test(k) || /_torso$/i.test(k);
  const isBlCustom = /^bl_|-bl$/i.test(k);
  const isBbCustom = /^bb\d+/i.test(k);

  if (isPrinted || isBlCustom) {
    if (fbs.length > 0) {
      return `BrickLink Studio ${isPrinted ? 'printed/decorated' : 'custom'} part ID (not in official LDraw). Tap Fetch Online to load its unprinted base shape (${fbs[0]}.dat), or open the original .io file.`;
    }
    return `BrickLink Studio custom part ID not distributed in standard LDraw mirrors. Open the original Studio .io file to include its exact 3D geometry.`;
  }
  if (isBbCustom) {
    return `BrickLink custom assembly ID (not distributed in standard LDraw mirrors). Open the original Studio .io file to include its 3D geometry.`;
  }
  return `3D geometry for ${k}.dat is not in your saved Bricks Library yet. Tap Fetch Online to download it from the public LDraw library, or import complete.zip.`;
}

function hasKnownShape(pid) {
  const k = normId(pid);
  if (compositePartDefs.has(k)) return true;
  if (lookupEmbeddedDat(k)) return true;
  if (PARTS_CATALOG[k]) return true;
  for (const fb of getPartIdFallbacks(k)) {
    if (PARTS_CATALOG[fb]) return true;
  }
  const base = k.replace(/[a-z].*$/, '');
  return Boolean(PARTS_CATALOG[base]);
}

function resolvePart(pid) {
  const k = normId(pid);
  if (compositePartDefs.has(k)) {
    const comp = compositePartDefs.get(k);
    return { name: comp.name, sx: 1.8, sz: 1, h: 28, studs: false };
  }
  const friendly = getHumanPartName(k);
  if (PARTS_CATALOG[k]) return { ...PARTS_CATALOG[k], name: friendly };
  for (const fb of getPartIdFallbacks(k)) {
    if (PARTS_CATALOG[fb]) return { ...PARTS_CATALOG[fb], name: friendly };
  }
  const base = k.replace(/[a-z].*$/, '');
  if (PARTS_CATALOG[base]) return { ...PARTS_CATALOG[base], name: friendly };
  return { name: friendly, sx: 1, sz: 1, h: 24, studs: true };
}

// Detect 1:1 Actual-Size Guide length (in studs / L) for axles, bars, beams
function getActualSizeGuide(pid) {
  const k = normId(pid);
  const cat = PARTS_CATALOG[k] || PARTS_CATALOG[k.replace(/[a-z].*$/, '')];
  if (cat?.lengthL && cat.lengthL >= 2) return { lengthL: cat.lengthL, kind: /axle/i.test(cat.name) ? 'axle' : 'bar' };
  const title = (embeddedDatTitles.get(k) || userLibTitles.get(k) || '').toLowerCase();
  const mAx = title.match(/(?:axle|bar|hose)[^0-9]*(\d+(?:\.\d+)?)\s*l\b/i);
  if (mAx && parseFloat(mAx[1]) >= 2) return { lengthL: parseFloat(mAx[1]), kind: title.includes('axle') ? 'axle' : 'bar' };
  const mBm = title.match(/(?:liftarm|technic,?\s*plate|technic,?\s*brick)[^0-9]*1\s*x\s*(\d+)/i);
  if (mBm && parseInt(mBm[1], 10) >= 3) return { lengthL: parseInt(mBm[1], 10), kind: 'beam' };
  return null;
}

// =========================================================================
// 2. MATH & LOW-MEMORY HIGH-SPEED WEBGL 3D ENGINE (iOS Safari Safe!)
// =========================================================================
const R_ID = [1,0,0, 0,1,0, 0,0,1];
function mat3Mul(a, b) {
  return [
    a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
    a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
    a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8],
  ];
}
function m3v(m, x, y, z) {
  return [m[0]*x+m[1]*y+m[2]*z, m[3]*x+m[4]*y+m[5]*z, m[6]*x+m[7]*y+m[8]*z];
}
function xformPt(p, m, ox, oy, oz, hingeRad = 0) {
  let [x, y, z] = p;
  if (hingeRad) {
    const c = Math.cos(hingeRad), s = Math.sin(hingeRad);
    const ny = y*c - z*s, nz = y*s + z*c; y = ny; z = nz;
  }
  return [m[0]*x+m[1]*y+m[2]*z+ox, m[3]*x+m[4]*y+m[5]*z+oy, m[6]*x+m[7]*y+m[8]*z+oz];
}
function xformNorm(n, m, hingeRad = 0) {
  let [x, y, z] = n;
  if (hingeRad) {
    const c = Math.cos(hingeRad), s = Math.sin(hingeRad);
    const ny = y*c - z*s, nz = y*s + z*c; y = ny; z = nz;
  }
  const rx = m[0]*x+m[1]*y+m[2]*z, ry = m[3]*x+m[4]*y+m[5]*z, rz = m[6]*x+m[7]*y+m[8]*z;
  const l = Math.hypot(rx, ry, rz) || 1;
  return [rx/l, ry/l, rz/l];
}
function hexToRgb255(hex, fadeMix = 0) {
  const n = parseInt((hex || '#999999').replace('#',''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return [
    Math.round(r * (1 - fadeMix) + 218 * fadeMix),
    Math.round(g * (1 - fadeMix) + 222 * fadeMix),
    Math.round(b * (1 - fadeMix) + 228 * fadeMix),
  ];
}
function lookAtMat4(eye, target, up) {
  let zx = eye[0]-target[0], zy = eye[1]-target[1], zz = eye[2]-target[2];
  let zl = Math.hypot(zx, zy, zz) || 1; zx/=zl; zy/=zl; zz/=zl;
  let xx = up[1]*zz - up[2]*zy, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
  let xl = Math.hypot(xx, xy, xz) || 1; xx/=xl; xy/=xl; xz/=xl;
  let yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
    -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
    -(zx*eye[0]+zy*eye[1]+zz*eye[2]),
    1,
  ]);
}
function orthoMat4(l, r, b, t, n, f) {
  return new Float32Array([
    2/(r-l), 0, 0, 0,
    0, 2/(t-b), 0, 0,
    0, 0, -2/(f-n), 0,
    -(r+l)/(r-l), -(t+b)/(t-b), -(f+n)/(f-n), 1,
  ]);
}
function mulMat4(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      out[c*4+r] = a[0*4+r]*b[c*4+0] + a[1*4+r]*b[c*4+1] + a[2*4+r]*b[c*4+2] + a[3*4+r]*b[c*4+3];
  return out;
}
function projectWorldToNdc(pt, mvp) {
  const x = mvp[0]*pt[0] + mvp[4]*pt[1] + mvp[8]*pt[2] + mvp[12];
  const y = mvp[1]*pt[0] + mvp[5]*pt[1] + mvp[9]*pt[2] + mvp[13];
  const z = mvp[2]*pt[0] + mvp[6]*pt[1] + mvp[10]*pt[2] + mvp[14];
  const w = mvp[3]*pt[0] + mvp[7]*pt[1] + mvp[11]*pt[2] + mvp[15] || 1;
  return [x/w, y/w, z/w];
}

// Virtual LDraw definitions for Minifig Torso (973) & Torso Assembly (973c01) so un-expanded
// BrickLink Studio torso assemblies (e.g., bl_973pb*c01) immediately reuse real embedded LDraw
// arms (3818/3819), hands (3820), and torso subparts (s/973s01) already present in the model!
const VIRTUAL_973_WITH_SUBPART = [
  '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/973s01.dat',
  '4 16 -19 32 -10 19 32 -10 19 29 -10 -19 29 -10',
  '4 16 14.345 2 -10 -14.345 2 -10 -19 29 -10 19 29 -10',
  '4 16 12 0 -10 -12 0 -10 -14.345 2 -10 14.345 2 -10',
  '4 16 -19 29 10 19 29 10 19 32 10 -19 32 10',
  '4 16 19 29 10 -19 29 10 -14.345 2 10 14.345 2 10',
  '4 16 14.345 2 10 -14.345 2 10 -12 0 10 12 0 10',
];

const VIRTUAL_973_SOLID = [
  // Front & back tapered torso faces (exact LDraw 973.dat coordinates)
  '4 16 -19 32 -10 19 32 -10 19 29 -10 -19 29 -10',
  '4 16 14.345 2 -10 -14.345 2 -10 -19 29 -10 19 29 -10',
  '4 16 12 0 -10 -12 0 -10 -14.345 2 -10 14.345 2 -10',
  '4 16 -19 29 10 19 29 10 19 32 10 -19 32 10',
  '4 16 19 29 10 -19 29 10 -14.345 2 10 14.345 2 10',
  '4 16 14.345 2 10 -14.345 2 10 -12 0 10 12 0 10',
  // Left & right sides (waist band, sloped torso walls, shoulder bevels)
  '4 16 -19 32 -10 -19 29 -10 -19 29 10 -19 32 10',
  '4 16 -19 29 -10 -14.345 2 -10 -14.345 2 10 -19 29 10',
  '4 16 -14.345 2 -10 -12 0 -10 -12 0 10 -14.345 2 10',
  '4 16 19 32 10 19 29 10 19 29 -10 19 32 -10',
  '4 16 19 29 10 14.345 2 10 14.345 2 -10 19 29 -10',
  '4 16 14.345 2 10 12 0 10 12 0 -10 14.345 2 -10',
  // Shoulder top & waist bottom caps
  '4 16 -12 0 -10 12 0 -10 12 0 10 -12 0 10',
  '4 16 -19 32 10 19 32 10 19 32 -10 -19 32 -10',
  // Neck post (r=6, y=0..-12)
  '1 16 0 0 0 6 0 0 0 -12 0 0 0 6 4-4cyli.dat',
  '1 16 0 -12 0 6 0 0 0 1 0 0 0 6 4-4disc.dat',
  '1 16 0 0 0 6 0 0 0 1 0 0 0 6 4-4edge.dat',
  '1 16 0 -12 0 6 0 0 0 1 0 0 0 6 4-4edge.dat',
  // Clean outer silhouette edges
  '2 24 -19 32 -10 19 32 -10', '2 24 -19 32 10 19 32 10',
  '2 24 -19 32 -10 -19 29 -10', '2 24 19 32 -10 19 29 -10',
  '2 24 -19 32 10 -19 29 10', '2 24 19 32 10 19 29 10',
  '2 24 -19 29 -10 -14.345 2 -10', '2 24 19 29 -10 14.345 2 -10',
  '2 24 -19 29 10 -14.345 2 10', '2 24 19 29 10 14.345 2 10',
  '2 24 -14.345 2 -10 -12 0 -10', '2 24 14.345 2 -10 12 0 -10',
  '2 24 -14.345 2 10 -12 0 10', '2 24 14.345 2 10 12 0 10',
  '2 24 -12 0 -10 12 0 -10', '2 24 -12 0 10 12 0 10',
  '2 24 -19 32 -10 -19 32 10', '2 24 19 32 -10 19 32 10',
  '2 24 -12 0 -10 -12 0 10', '2 24 12 0 -10 12 0 10',
];

const VIRTUAL_973C01_LINES = [
  '1 16 0 0 0 1 0 0 0 1 0 0 0 1 973.dat',
  '1 16 -15.552 9 0 0.985 -0.17 0 0.17 0.985 0 0 0 1 3818.dat',
  '1 16 15.552 9 0 0.985 0.17 0 -0.17 0.985 0 0 0 1 3819.dat',
  '1 14 -23.6904 26.774 -9.8982 0.985 -0.1202 0.1202 0.17 0.6964 -0.6964 0 0.707 0.707 3820.dat',
  '1 14 23.6904 26.774 -9.8982 0.985 0.1202 -0.1202 -0.17 0.6964 -0.6964 0 0.707 0.707 3820.dat',
];

function hasRawDatKey(k) {
  return embeddedDatRaw.has(k) || userLibRaw.has(k);
}

function lookupVirtualMinifigDat(targetKey, offset) {
  if (targetKey === '973c01') {
    if ((hasRawDatKey('3818') || hasRawDatKey('3819')) && hasRawDatKey('3820')) {
      return { key: '973c01', lines: VIRTUAL_973C01_LINES, offset, virtual: true };
    }
    return null;
  }
  if (targetKey === '973') {
    if (hasRawDatKey('s/973s01') || hasRawDatKey('973s01')) {
      return { key: '973', lines: VIRTUAL_973_WITH_SUBPART, offset, virtual: true };
    }
    return { key: '973', lines: VIRTUAL_973_SOLID, offset, virtual: true };
  }
  if (targetKey === '3819' && hasRawDatKey('3818')) {
    return { key: '3819', lines: ['1 16 0 0 0 -1 0 0 0 1 0 0 0 1 3818.dat'], offset, virtual: true };
  }
  if (targetKey === '3818' && hasRawDatKey('3819')) {
    return { key: '3818', lines: ['1 16 0 0 0 -1 0 0 0 1 0 0 0 1 3819.dat'], offset, virtual: true };
  }
  return null;
}

let texReadyRerenderTimer = null;
function scheduleTextureReadyRerender() {
  if (texReadyRerenderTimer) return;
  texReadyRerenderTimer = setTimeout(() => {
    texReadyRerenderTimer = null;
    pliThumbCache.clear();
    submodelThumbCache.clear();
    clearMinifigDiagramCaches();
    coverHeroCache.clear();
    if (state.model) renderAll();
  }, 60);
}

// Fast recursive LDraw .dat compiler (checks embedded .io model2.ldr first, then user-imported LDraw Library!)
function lookupEmbeddedDat(ref, allowVirtual = true) {
  const k = normId(ref);
  const stripped = k.replace(/^(48|8|s)\//, '');
  const base = k.split('/').pop();
  const blPrefixed = !k.includes('/') && !k.startsWith('bl_') ? `bl_${k}` : null;
  const blSuffixed = !k.includes('/') && !k.endsWith('-bl') ? `${k}-bl` : null;
  const noBlPrefix = k.startsWith('bl_') ? k.slice(3) : null;
  for (const store of [embeddedDatRaw, userLibRaw]) {
    if (store.has(k)) return { key: k, lines: store.get(k), offset: null };
    if (blPrefixed && store.has(blPrefixed)) return { key: blPrefixed, lines: store.get(blPrefixed), offset: null };
    if (blSuffixed && store.has(blSuffixed)) return { key: blSuffixed, lines: store.get(blSuffixed), offset: null };
    if (noBlPrefix && store.has(noBlPrefix)) return { key: noBlPrefix, lines: store.get(noBlPrefix), offset: null };
    if (store.has(stripped)) return { key: stripped, lines: store.get(stripped), offset: null };
    if (store.has(base)) return { key: base, lines: store.get(base), offset: null };
  }
  const fbs = getPartIdFallbacks(k);
  const offset = isBrickLinkTorsoAssemblyId(k) ? [-20, -32, 10] : null;
  if (fbs.length > 0) {
    for (const fb of fbs) {
      for (const store of [embeddedDatRaw, userLibRaw]) {
        if (store.has(fb)) return { key: fb, lines: store.get(fb), offset };
      }
    }
  }
  if (allowVirtual) {
    const directVirt = lookupVirtualMinifigDat(k, null);
    if (directVirt) return directVirt;
    for (const fb of fbs) {
      const fbVirt = lookupVirtualMinifigDat(fb, offset);
      if (fbVirt) return fbVirt;
    }
  }
  return null;
}

function compileDatEntry(found) {
  const res = compileLDrawDatEntry(found, lookupEmbeddedDat, {
    lookupTexture: (texName) => textureStore.lookupByName(texName),
  });
  if (res?.texBatches?.length) {
    for (const tb of res.texBatches) {
      if (tb.base64Png && !textureStore.getRecord(tb.texKey)) {
        textureStore.registerBase64Texture(tb.base64Png, { source: 'embedded' });
      }
      if (!textureStore.getDecodedImage(tb.texKey)) {
        textureStore.decodeTexture(tb.texKey, scheduleTextureReadyRerender);
      }
    }
  }
  return res;
}

function compileEmbeddedDat(partId) {
  const k = normId(partId);
  if (embeddedDatCompiled.has(k)) return embeddedDatCompiled.get(k);
  const found = lookupEmbeddedDat(k);
  let res = found ? compileDatEntry(found) : null;
  // If a direct embedded stub produced 0 triangles (missing subparts), try canonical base fallbacks too
  if (!res) {
    const offset = isBrickLinkTorsoAssemblyId(k) ? [-20, -32, 10] : null;
    for (const fb of getPartIdFallbacks(k)) {
      if (found && found.key === fb) continue;
      const fbFound = lookupEmbeddedDat(fb);
      if (fbFound) {
        res = compileDatEntry(offset ? { ...fbFound, offset } : fbFound);
        if (res) break;
      }
    }
  }
  embeddedDatCompiled.set(k, res);
  return res;
}

// Compact Growable Typed Buffers (eliminates 100MB JS array spikes on iOS!)
class FloatBuf {
  constructor(cap = 4096) { this.d = new Float32Array(cap); this.len = 0; }
  ensure(n) {
    if (this.len + n <= this.d.length) return;
    let nc = this.d.length * 2; while (nc < this.len + n) nc *= 2;
    const nd = new Float32Array(nc); nd.set(this.d.subarray(0, this.len)); this.d = nd;
  }
  push3(a, b, c) { this.ensure(3); const i = this.len; this.d[i]=a; this.d[i+1]=b; this.d[i+2]=c; this.len = i+3; }
  push6(a0,a1, b0,b1, c0,c1) {
    this.ensure(6); const i = this.len, d = this.d;
    d[i]=a0; d[i+1]=a1; d[i+2]=b0; d[i+3]=b1; d[i+4]=c0; d[i+5]=c1;
    this.len = i+6;
  }
  push9(a0,a1,a2, b0,b1,b2, c0,c1,c2) {
    this.ensure(9); const i = this.len, d = this.d;
    d[i]=a0; d[i+1]=a1; d[i+2]=a2; d[i+3]=b0; d[i+4]=b1; d[i+5]=b2; d[i+6]=c0; d[i+7]=c1; d[i+8]=c2;
    this.len = i+9;
  }
  slice() { return this.d.subarray(0, this.len); }
}
class ByteBuf {
  constructor(cap = 4096) { this.d = new Uint8Array(cap); this.len = 0; }
  ensure(n) {
    if (this.len + n <= this.d.length) return;
    let nc = this.d.length * 2; while (nc < this.len + n) nc *= 2;
    const nd = new Uint8Array(nc); nd.set(this.d.subarray(0, this.len)); this.d = nd;
  }
  push4(r, g, b, a) { this.ensure(4); const i = this.len; this.d[i]=r; this.d[i+1]=g; this.d[i+2]=b; this.d[i+3]=a; this.len = i+4; }
  push12(r, g, b, a) {
    this.ensure(12); const i = this.len, d = this.d;
    d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=a;
    d[i+4]=r; d[i+5]=g; d[i+6]=b; d[i+7]=a;
    d[i+8]=r; d[i+9]=g; d[i+10]=b; d[i+11]=a;
    this.len = i+12;
  }
  slice() { return this.d.subarray(0, this.len); }
}

function buildMeshBuffers(prevParts, newParts, opts) {
  const totalParts = prevParts.length + newParts.length;
  const includeEdges = totalParts <= 320;
  const opPos = new FloatBuf(totalParts * 180), opNorm = new FloatBuf(totalParts * 180), opCol = new ByteBuf(totalParts * 240);
  const trPos = new FloatBuf(2048), trNorm = new FloatBuf(2048), trCol = new ByteBuf(2048);
  const lnPos = new FloatBuf(totalParts * 60), lnCol = new ByteBuf(totalParts * 80);
  const texGroups = new Map();

  const heroQuality = Boolean(opts.heroQuality);

  const pushTri = (a, b, c, n, col, aByte) => {
    const isTrans = aByte < 245;
    const P = isTrans ? trPos : opPos, N = isTrans ? trNorm : opNorm, C = isTrans ? trCol : opCol;
    P.push9(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    N.push9(n[0],n[1],n[2], n[0],n[1],n[2], n[0],n[1],n[2]);
    C.push12(col[0], col[1], col[2], aByte);
  };
  const pushTexTri = (texKey, fadeMix, isNewPart, a, b, c, n, uv0, uv1, uv2, col, aByte) => {
    const fadeKey = Math.round(fadeMix * 100);
    const gKey = `${texKey}|${fadeKey}`;
    let g = texGroups.get(gKey);
    if (!g) {
      g = {
        texKey,
        fadeMix,
        pos: new FloatBuf(512),
        norm: new FloatBuf(512),
        uv: new FloatBuf(342),
        col: new ByteBuf(684),
        prevPosEnd: 0,
      };
      texGroups.set(gKey, g);
    }
    if (!isNewPart) g.prevPosEnd = g.pos.len + 9;
    g.pos.push9(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    g.norm.push9(n[0],n[1],n[2], n[0],n[1],n[2], n[0],n[1],n[2]);
    g.uv.push6(uv0[0],uv0[1], uv1[0],uv1[1], uv2[0],uv2[1]);
    g.col.push12(col[0], col[1], col[2], aByte);
  };
  const pushTriSmooth = (a, b, c, na, nb, nc, col, aByte) => {
    const isTrans = aByte < 245;
    const P = isTrans ? trPos : opPos, N = isTrans ? trNorm : opNorm, C = isTrans ? trCol : opCol;
    P.push9(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    N.push9(na[0],na[1],na[2], nb[0],nb[1],nb[2], nc[0],nc[1],nc[2]);
    C.push12(col[0], col[1], col[2], aByte);
  };
  const pushEdge = (a, b, col, aByte) => {
    lnPos.push3(a[0],a[1],a[2]); lnPos.push3(b[0],b[1],b[2]);
    lnCol.push4(col[0],col[1],col[2],aByte); lnCol.push4(col[0],col[1],col[2],aByte);
  };

  const addBox = (cx, cy, cz, w, h, d, m, ox, oy, oz, hinge, col, eCol, aByte, eAlpha = aByte) => {
    const hw=w/2, hh=h/2, hd=d/2;
    if (heroQuality && hw > 1.2 && hh > 1.2 && hd > 1.2) {
      // Micro-beveled LEGO ABS brick: inset main faces + 12 chamfered 45° edges + 8 corner facets
      // catches realistic glossy studio softbox highlights along every brick seam!
      const b = Math.min(0.48, hw * 0.14, hh * 0.14, hd * 0.14);
      const iw = hw - b, ih = hh - b, id = hd - b;
      const pt = (x, y, z) => xformPt([cx + x, cy + y, cz + z], m, ox, oy, oz, hinge);
      const qFace = (p0, p1, p2, p3, nLocal) => {
        const wn = xformNorm(nLocal, m, hinge);
        pushTri(p0, p1, p2, wn, col, aByte);
        pushTri(p0, p2, p3, wn, col, aByte);
      };
      // 6 inset face quads (4 corners per face)
      const fZ1 = [pt(-iw,-ih, hd), pt( iw,-ih, hd), pt( iw, ih, hd), pt(-iw, ih, hd)];
      const fZ0 = [pt( iw,-ih,-hd), pt(-iw,-ih,-hd), pt(-iw, ih,-hd), pt( iw, ih,-hd)];
      const fY1 = [pt(-iw, hh, id), pt( iw, hh, id), pt( iw, hh,-id), pt(-iw, hh,-id)];
      const fY0 = [pt(-iw,-hh,-id), pt( iw,-hh,-id), pt( iw,-hh, id), pt(-iw,-hh, id)];
      const fX1 = [pt( hw,-ih, id), pt( hw,-ih,-id), pt( hw, ih,-id), pt( hw, ih, id)];
      const fX0 = [pt(-hw,-ih,-id), pt(-hw,-ih, id), pt(-hw, ih, id), pt(-hw, ih,-id)];

      qFace(fZ1[0], fZ1[1], fZ1[2], fZ1[3], [0, 0, 1]);
      qFace(fZ0[0], fZ0[1], fZ0[2], fZ0[3], [0, 0,-1]);
      qFace(fY1[0], fY1[1], fY1[2], fY1[3], [0, 1, 0]);
      qFace(fY0[0], fY0[1], fY0[2], fY0[3], [0,-1, 0]);
      qFace(fX1[0], fX1[1], fX1[2], fX1[3], [1, 0, 0]);
      qFace(fX0[0], fX0[1], fX0[2], fX0[3], [-1, 0, 0]);

      const s2 = 0.70710678;
      const s3 = 0.57735027;
      // 4 top edge bevels
      qFace(fZ1[3], fZ1[2], fY1[1], fY1[0], [0, s2, s2]);
      qFace(fZ0[3], fZ0[2], fY1[3], fY1[2], [0, s2,-s2]);
      qFace(fX1[3], fX1[2], fY1[2], fY1[1], [s2, s2, 0]);
      qFace(fX0[3], fX0[2], fY1[0], fY1[3], [-s2, s2, 0]);
      // 4 bottom edge bevels
      qFace(fY0[3], fY0[2], fZ1[1], fZ1[0], [0,-s2, s2]);
      qFace(fY0[1], fY0[0], fZ0[1], fZ0[0], [0,-s2,-s2]);
      qFace(fY0[2], fY0[1], fX1[1], fX1[0], [s2,-s2, 0]);
      qFace(fY0[0], fY0[3], fX0[1], fX0[0], [-s2,-s2, 0]);
      // 4 vertical edge bevels
      qFace(fZ1[1], fX1[0], fX1[3], fZ1[2], [s2, 0, s2]);
      qFace(fX1[1], fZ0[0], fZ0[3], fX1[2], [s2, 0,-s2]);
      qFace(fZ0[1], fX0[0], fX0[3], fZ0[2], [-s2, 0,-s2]);
      qFace(fX0[1], fZ1[0], fZ1[3], fX0[2], [-s2, 0, s2]);
      // 8 corner bevel triangles
      pushTri(fZ1[2], fX1[3], fY1[1], xformNorm([ s3, s3, s3], m, hinge), col, aByte);
      pushTri(fX1[2], fZ0[3], fY1[2], xformNorm([ s3, s3,-s3], m, hinge), col, aByte);
      pushTri(fZ0[2], fX0[3], fY1[3], xformNorm([-s3, s3,-s3], m, hinge), col, aByte);
      pushTri(fX0[2], fZ1[3], fY1[0], xformNorm([-s3, s3, s3], m, hinge), col, aByte);
      pushTri(fZ1[1], fY0[2], fX1[0], xformNorm([ s3,-s3, s3], m, hinge), col, aByte);
      pushTri(fX1[1], fY0[1], fZ0[0], xformNorm([ s3,-s3,-s3], m, hinge), col, aByte);
      pushTri(fZ0[1], fY0[0], fX0[0], xformNorm([-s3,-s3,-s3], m, hinge), col, aByte);
      pushTri(fX0[1], fY0[3], fZ1[0], xformNorm([-s3,-s3, s3], m, hinge), col, aByte);
      return;
    }

    const v = [
      xformPt([cx-hw,cy-hh,cz+hd],m,ox,oy,oz,hinge), xformPt([cx+hw,cy-hh,cz+hd],m,ox,oy,oz,hinge),
      xformPt([cx+hw,cy+hh,cz+hd],m,ox,oy,oz,hinge), xformPt([cx-hw,cy+hh,cz+hd],m,ox,oy,oz,hinge),
      xformPt([cx-hw,cy-hh,cz-hd],m,ox,oy,oz,hinge), xformPt([cx+hw,cy-hh,cz-hd],m,ox,oy,oz,hinge),
      xformPt([cx+hw,cy+hh,cz-hd],m,ox,oy,oz,hinge), xformPt([cx-hw,cy+hh,cz-hd],m,ox,oy,oz,hinge),
    ];
    const faces = [
      [[0,1,2,3],[0,0,1]], [[5,4,7,6],[0,0,-1]], [[3,2,6,7],[0,1,0]],
      [[4,5,1,0],[0,-1,0]], [[1,5,6,2],[1,0,0]], [[4,0,3,7],[-1,0,0]],
    ];
    for (const [q, n] of faces) {
      const wn = xformNorm(n, m, hinge);
      pushTri(v[q[0]],v[q[1]],v[q[2]], wn, col, aByte);
      pushTri(v[q[0]],v[q[2]],v[q[3]], wn, col, aByte);
    }
    if (includeEdges) {
      for (const [i,j] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])
        pushEdge(v[i], v[j], eCol, eAlpha);
    }
  };

  const addCyl = (cx, cy, cz, rTop, rBot, h, axis, segs, m, ox, oy, oz, hinge, col, eCol, aByte, bevelTop = false) => {
    const effSegs = heroQuality ? Math.max(segs, 16) : segs;
    const hh = h / 2;
    const mk = (u, v, t) => axis === 'y' ? [cx+u,cy+t,cz+v] : axis === 'x' ? [cx+t,cy+u,cz+v] : [cx+u,cy+v,cz+t];
    const mkN = (u, v, t) => xformNorm(axis === 'y' ? [u, t, v] : axis === 'x' ? [t, u, v] : [u, v, t], m, hinge);
    const nTop = xformNorm(axis==='y'?[0,1,0]:axis==='x'?[1,0,0]:[0,0,1], m, hinge);
    const nBot = [-nTop[0], -nTop[1], -nTop[2]];
    const topC = xformPt(mk(0,0,hh), m, ox, oy, oz, hinge);
    const botC = xformPt(mk(0,0,-hh), m, ox, oy, oz, hinge);
    const useBevel = heroQuality && bevelTop && rTop > 1.0 && h > 1.2;
    const bev = useBevel ? Math.min(0.42, rTop * 0.12, h * 0.16) : 0;
    const sideTopY = hh - bev;
    const capR = rTop - bev;
    for (let i = 0; i < effSegs; i++) {
      const a0 = (i/effSegs)*Math.PI*2, a1 = ((i+1)/effSegs)*Math.PI*2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const t0 = xformPt(mk(c0*rTop, s0*rTop, sideTopY), m, ox, oy, oz, hinge);
      const t1 = xformPt(mk(c1*rTop, s1*rTop, sideTopY), m, ox, oy, oz, hinge);
      const b0 = xformPt(mk(c0*rBot, s0*rBot, -hh), m, ox, oy, oz, hinge);
      const b1 = xformPt(mk(c1*rBot, s1*rBot, -hh), m, ox, oy, oz, hinge);
      if (heroQuality) {
        const sn0 = mkN(c0, s0, 0);
        const sn1 = mkN(c1, s1, 0);
        pushTriSmooth(b0, b1, t1, sn0, sn1, sn1, col, aByte);
        pushTriSmooth(b0, t1, t0, sn0, sn1, sn0, col, aByte);
      } else {
        const am = (a0+a1)/2;
        const sn = mkN(Math.cos(am), Math.sin(am), 0);
        pushTri(b0, b1, t1, sn, col, aByte); pushTri(b0, t1, t0, sn, col, aByte);
      }
      if (useBevel) {
        const ct0 = xformPt(mk(c0*capR, s0*capR, hh), m, ox, oy, oz, hinge);
        const ct1 = xformPt(mk(c1*capR, s1*capR, hh), m, ox, oy, oz, hinge);
        const bn0 = mkN(c0 * 0.7071, s0 * 0.7071, 0.7071);
        const bn1 = mkN(c1 * 0.7071, s1 * 0.7071, 0.7071);
        pushTriSmooth(t0, t1, ct1, bn0, bn1, bn1, col, aByte);
        pushTriSmooth(t0, ct1, ct0, bn0, bn1, bn0, col, aByte);
        pushTri(topC, ct0, ct1, nTop, col, aByte);
      } else {
        if (rTop > 0.05) pushTri(topC, t0, t1, nTop, col, aByte);
      }
      if (rBot > 0.05) pushTri(botC, b1, b0, nBot, col, aByte);
      if (!heroQuality && includeEdges && rTop > 0.05) pushEdge(t0, t1, eCol, aByte);
    }
  };

  // Arbitrary-direction 3D Arrow (points cleanly from start -> target along ANY 3D vector!)
  const addArrow3D = (s, t, col) => {
    const dx = t[0]-s[0], dy = t[1]-s[1], dz = t[2]-s[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 6) return;
    const ux = dx/len, uy = dy/len, uz = dz/len;
    // Orthonormal basis around arrow axis u
    let rx = Math.abs(uy) < 0.9 ? 0 : 1, ry = Math.abs(uy) < 0.9 ? 1 : 0, rz = 0;
    let bx = uy*rz - uz*ry, by = uz*rx - ux*rz, bz = ux*ry - uy*rx;
    const bl = Math.hypot(bx, by, bz) || 1; bx/=bl; by/=bl; bz/=bl;
    const cx = by*uz - bz*uy, cy = bz*ux - bx*uz, cz = bx*uy - by*ux;

    const headLen = Math.min(12, len * 0.45);
    const shaftEnd = [t[0] - ux*headLen, t[1] - uy*headLen, t[2] - uz*headLen];
    const segs = 10;
    const ring = (center, r, ang) => [
      center[0] + (Math.cos(ang)*bx + Math.sin(ang)*cx)*r,
      center[1] + (Math.cos(ang)*by + Math.sin(ang)*cy)*r,
      center[2] + (Math.cos(ang)*bz + Math.sin(ang)*cz)*r,
    ];
    for (let i = 0; i < segs; i++) {
      const a0 = (i/segs)*Math.PI*2, a1 = ((i+1)/segs)*Math.PI*2;
      const am = (a0+a1)/2;
      const sn = [Math.cos(am)*bx + Math.sin(am)*cx, Math.cos(am)*by + Math.sin(am)*cy, Math.cos(am)*bz + Math.sin(am)*cz];
      // Shaft
      const s0 = ring(s, 1.7, a0), s1 = ring(s, 1.7, a1), e0 = ring(shaftEnd, 1.7, a0), e1 = ring(shaftEnd, 1.7, a1);
      pushTri(s0, s1, e1, sn, col, 255); pushTri(s0, e1, e0, sn, col, 255);
      // Arrowhead cone
      const h0 = ring(shaftEnd, 5.2, a0), h1 = ring(shaftEnd, 5.2, a1);
      pushTri(h0, h1, t, sn, col, 255);
      pushTri(shaftEnd, h1, h0, [-ux,-uy,-uz], col, 255);
    }
  };

  // Curved 3D Rotation Arc Arrow (shows FROM starting pose -> TO target pose around any 3D joint/axis!)
  const addCurvedArrow3D = (ind) => {
    const totalAng = ((ind.angleDeg || 0) * Math.PI) / 180;
    const r = ind.radius || 22;
    if (totalAng < 0.12 || r < 4) return;
    const al = Math.hypot(ind.axis[0], ind.axis[1], ind.axis[2]) || 1;
    const ax = [ind.axis[0] / al, ind.axis[1] / al, ind.axis[2] / al];
    const sd = ind.startDir;
    const d0 = sd[0] * ax[0] + sd[1] * ax[1] + sd[2] * ax[2];
    let u0 = [sd[0] - ax[0] * d0, sd[1] - ax[1] * d0, sd[2] - ax[2] * d0];
    const u0l = Math.hypot(u0[0], u0[1], u0[2]);
    if (u0l < 1e-4) return;
    u0 = [u0[0] / u0l, u0[1] / u0l, u0[2] / u0l];
    const u1 = [
      ax[1] * u0[2] - ax[2] * u0[1],
      ax[2] * u0[0] - ax[0] * u0[2],
      ax[0] * u0[1] - ax[1] * u0[0],
    ];
    const lat = ind.lateralOffset || [0, 0, 0];
    const ctr = [ind.pivot[0] + lat[0], ind.pivot[1] + lat[1], ind.pivot[2] + lat[2]];
    const col = hexToRgb255(ind.color || opts.accent || '#f97316', 0);
    const ink = [24, 34, 48];

    const radAt = (a) => {
      const ca = Math.cos(a), sa = Math.sin(a);
      return [ca * u0[0] + sa * u1[0], ca * u0[1] + sa * u1[1], ca * u0[2] + sa * u1[2]];
    };
    const arcPt = (a, radScale = 1) => {
      const rd = radAt(a);
      return [ctr[0] + rd[0] * r * radScale, ctr[1] + rd[1] * r * radScale, ctr[2] + rd[2] * r * radScale];
    };

    const arcLen = r * totalAng;
    const headLen = Math.min(10.5, Math.max(5.5, arcLen * 0.34));
    const headAng = Math.min(totalAng * 0.42, headLen / Math.max(6, r));
    const shaftEndAng = Math.max(0.05, totalAng - headAng);
    const isBodyYaw = ind.kind === 'body_yaw';
    const tubeR = isBodyYaw ? 1.85 : 2.05;
    const coneR = isBodyYaw ? 5.1 : 5.5;
    const segs = Math.max(10, Math.min(32, Math.ceil(((shaftEndAng * 180) / Math.PI) / 7)));
    const crossSegs = 8;

    // 1. Start anchor marker ("FROM" node at angle = 0)
    const startC = arcPt(0);
    const nodeR = tubeR * 1.75;
    const nodeH = tubeR * 0.95;
    const nodeSegs = 10;
    const nTopC = [startC[0] + ax[0] * nodeH, startC[1] + ax[1] * nodeH, startC[2] + ax[2] * nodeH];
    const nBotC = [startC[0] - ax[0] * nodeH, startC[1] - ax[1] * nodeH, startC[2] - ax[2] * nodeH];
    for (let k = 0; k < nodeSegs; k++) {
      const p0 = (k / nodeSegs) * Math.PI * 2, p1 = ((k + 1) / nodeSegs) * Math.PI * 2, pm = (p0 + p1) / 2;
      const dA = [Math.cos(p0) * u0[0] + Math.sin(p0) * u1[0], Math.cos(p0) * u0[1] + Math.sin(p0) * u1[1], Math.cos(p0) * u0[2] + Math.sin(p0) * u1[2]];
      const dB = [Math.cos(p1) * u0[0] + Math.sin(p1) * u1[0], Math.cos(p1) * u0[1] + Math.sin(p1) * u1[1], Math.cos(p1) * u0[2] + Math.sin(p1) * u1[2]];
      const sn = [Math.cos(pm) * u0[0] + Math.sin(pm) * u1[0], Math.cos(pm) * u0[1] + Math.sin(pm) * u1[1], Math.cos(pm) * u0[2] + Math.sin(pm) * u1[2]];
      const t0 = [nTopC[0] + dA[0] * nodeR, nTopC[1] + dA[1] * nodeR, nTopC[2] + dA[2] * nodeR];
      const t1 = [nTopC[0] + dB[0] * nodeR, nTopC[1] + dB[1] * nodeR, nTopC[2] + dB[2] * nodeR];
      const b0 = [nBotC[0] + dA[0] * nodeR, nBotC[1] + dA[1] * nodeR, nBotC[2] + dA[2] * nodeR];
      const b1 = [nBotC[0] + dB[0] * nodeR, nBotC[1] + dB[1] * nodeR, nBotC[2] + dB[2] * nodeR];
      pushTri(b0, b1, t1, sn, col, 255); pushTri(b0, t1, t0, sn, col, 255);
      pushTri(nTopC, t0, t1, ax, col, 255);
      pushTri(nBotC, b1, b0, [-ax[0], -ax[1], -ax[2]], col, 255);
      pushEdge(t0, t1, ink, 220);
      pushEdge(b0, b1, ink, 220);
    }

    // Crisp start & target reference ticks for whole-body/head turns so "from -> to" is unmistakable
    if (isBodyYaw || ind.kind === 'head') {
      pushEdge(arcPt(0, 0.72), arcPt(0, 0.96), ink, 210);
      pushEdge(arcPt(totalAng, 0.72), arcPt(totalAng, 0.96), col, 240);
    }

    // 2. Smooth 3D curved tube shaft with crisp inner & outer silhouette rails
    const ringAt = (a) => {
      const c = arcPt(a);
      const rd = radAt(a);
      const pts = [];
      const norms = [];
      for (let k = 0; k < crossSegs; k++) {
        const phi = (k / crossSegs) * Math.PI * 2;
        const cp = Math.cos(phi), sp = Math.sin(phi);
        const n = [cp * rd[0] + sp * ax[0], cp * rd[1] + sp * ax[1], cp * rd[2] + sp * ax[2]];
        norms.push(n);
        pts.push([c[0] + n[0] * tubeR, c[1] + n[1] * tubeR, c[2] + n[2] * tubeR]);
      }
      return { pts, norms };
    };

    let prevRing = ringAt(0);
    const halfCross = crossSegs >> 1;
    for (let i = 1; i <= segs; i++) {
      const a = (i / segs) * shaftEndAng;
      const curRing = ringAt(a);
      for (let k = 0; k < crossSegs; k++) {
        const kn = (k + 1) % crossSegs;
        const n = [
          (prevRing.norms[k][0] + prevRing.norms[kn][0] + curRing.norms[k][0] + curRing.norms[kn][0]) * 0.25,
          (prevRing.norms[k][1] + prevRing.norms[kn][1] + curRing.norms[k][1] + curRing.norms[kn][1]) * 0.25,
          (prevRing.norms[k][2] + prevRing.norms[kn][2] + curRing.norms[k][2] + curRing.norms[kn][2]) * 0.25,
        ];
        pushTri(prevRing.pts[k], prevRing.pts[kn], curRing.pts[kn], n, col, 255);
        pushTri(prevRing.pts[k], curRing.pts[kn], curRing.pts[k], n, col, 255);
      }
      pushEdge(prevRing.pts[0], curRing.pts[0], ink, 225);
      pushEdge(prevRing.pts[halfCross], curRing.pts[halfCross], ink, 225);
      prevRing = curRing;
    }

    // 3. Sharp 3D cone arrowhead pointing directly into the target pose ("TO" tip)
    const baseC = arcPt(shaftEndAng);
    const tip = arcPt(totalAng);
    const cdx = tip[0] - baseC[0], cdy = tip[1] - baseC[1], cdz = tip[2] - baseC[2];
    const clen = Math.hypot(cdx, cdy, cdz) || 1;
    const cu = [cdx / clen, cdy / clen, cdz / clen];
    const rdEnd = radAt(shaftEndAng);
    const dEnd = rdEnd[0] * cu[0] + rdEnd[1] * cu[1] + rdEnd[2] * cu[2];
    let b1 = [rdEnd[0] - cu[0] * dEnd, rdEnd[1] - cu[1] * dEnd, rdEnd[2] - cu[2] * dEnd];
    const b1l = Math.hypot(b1[0], b1[1], b1[2]) || 1;
    b1 = [b1[0] / b1l, b1[1] / b1l, b1[2] / b1l];
    const b2 = [
      cu[1] * b1[2] - cu[2] * b1[1],
      cu[2] * b1[0] - cu[0] * b1[2],
      cu[0] * b1[1] - cu[1] * b1[0],
    ];
    const coneSegs = 10;
    const coneRing = (ang) => [
      baseC[0] + (Math.cos(ang) * b1[0] + Math.sin(ang) * b2[0]) * coneR,
      baseC[1] + (Math.cos(ang) * b1[1] + Math.sin(ang) * b2[1]) * coneR,
      baseC[2] + (Math.cos(ang) * b1[2] + Math.sin(ang) * b2[2]) * coneR,
    ];
    for (let k = 0; k < coneSegs; k++) {
      const a0 = (k / coneSegs) * Math.PI * 2, a1 = ((k + 1) / coneSegs) * Math.PI * 2, am = (a0 + a1) / 2;
      const sn = [
        Math.cos(am) * b1[0] + Math.sin(am) * b2[0],
        Math.cos(am) * b1[1] + Math.sin(am) * b2[1],
        Math.cos(am) * b1[2] + Math.sin(am) * b2[2],
      ];
      const h0 = coneRing(a0), h1 = coneRing(a1);
      pushTri(h0, h1, tip, sn, col, 255);
      pushTri(baseC, h1, h0, [-cu[0], -cu[1], -cu[2]], col, 255);
      pushEdge(h0, h1, ink, 225);
    }
    pushEdge(coneRing(0), tip, ink, 225);
    pushEdge(coneRing(Math.PI), tip, ink, 225);
  };

  const addTopStuds = (def, m, ox, oy, oz, hinge, col, eCol, aByte) => {
    if (!def.studs) return;
    const topX = def.topStudsX || Math.round(def.sx);
    const sx = Math.round(def.sx), sz = Math.round(def.sz);
    const startX = -((sx - 1) * 20) / 2, startZ = -((sz - 1) * 20) / 2;
    for (let ix = 0; ix < topX; ix++)
      for (let iz = 0; iz < sz; iz++)
        addCyl(startX + ix*20, 1.8, startZ + iz*20, 5.8, 5.8, 4.4, 'y', heroQuality ? 16 : 8, m, ox, oy, oz, hinge, col, eCol, aByte, true);
  };

  // Tapered arbitrary-axis limb segment (for sculpted minifigure arms & wrists)
  const addLimb = (p0, p1, r0, r1, segs, m, ox, oy, oz, hinge, col, eCol, aByte, capEdges = false) => {
    const dx = p1[0]-p0[0], dy = p1[1]-p0[1], dz = p1[2]-p0[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.1) return;
    const ux = dx/len, uy = dy/len, uz = dz/len;
    const rx = Math.abs(uy) < 0.9 ? 0 : 1, ry = Math.abs(uy) < 0.9 ? 1 : 0, rz = 0;
    let bx = uy*rz - uz*ry, by = uz*rx - ux*rz, bz = ux*ry - uy*rx;
    const bl = Math.hypot(bx, by, bz) || 1; bx/=bl; by/=bl; bz/=bl;
    const cx = by*uz - bz*uy, cy = bz*ux - bx*uz, cz = bx*uy - by*ux;
    const c0 = xformPt(p0, m, ox, oy, oz, hinge);
    const c1 = xformPt(p1, m, ox, oy, oz, hinge);
    const n0 = xformNorm([-ux, -uy, -uz], m, hinge);
    const n1 = xformNorm([ux, uy, uz], m, hinge);
    const ringPt = (center, r, ang) => xformPt([
      center[0] + (Math.cos(ang)*bx + Math.sin(ang)*cx)*r,
      center[1] + (Math.cos(ang)*by + Math.sin(ang)*cy)*r,
      center[2] + (Math.cos(ang)*bz + Math.sin(ang)*cz)*r,
    ], m, ox, oy, oz, hinge);
    for (let i = 0; i < segs; i++) {
      const a0 = (i/segs)*Math.PI*2, a1 = ((i+1)/segs)*Math.PI*2, am = (a0+a1)/2;
      const sn = xformNorm([
        Math.cos(am)*bx + Math.sin(am)*cx,
        Math.cos(am)*by + Math.sin(am)*cy,
        Math.cos(am)*bz + Math.sin(am)*cz,
      ], m, hinge);
      const v00 = ringPt(p0, r0, a0), v01 = ringPt(p0, r0, a1);
      const v10 = ringPt(p1, r1, a0), v11 = ringPt(p1, r1, a1);
      pushTri(v00, v01, v11, sn, col, aByte);
      pushTri(v00, v11, v10, sn, col, aByte);
      if (r0 > 0.1) pushTri(c0, v01, v00, n0, col, aByte);
      if (r1 > 0.1) pushTri(c1, v10, v11, n1, col, aByte);
      if (capEdges && includeEdges) {
        pushEdge(v10, v11, eCol, aByte);
      }
    }
  };

  // Sculpted authentic LEGO minifigure torso (exact LDraw 973.dat trapezoid + optional arms & yellow C-hands)
  const addMinifigTorso = (sh, withArms, m, ox, oy, oz, hinge, col, eCol, handCol, handEdge, aByte) => {
    const [sx, sy, sz] = sh;
    const tp = (x, y, z) => xformPt([sx + x, sy + y, sz + z], m, ox, oy, oz, hinge);
    const quad = (p0, p1, p2, p3, nLocal) => {
      const a = tp(p0[0], p0[1], p0[2]), b = tp(p1[0], p1[1], p1[2]);
      const c = tp(p2[0], p2[1], p2[2]), d = tp(p3[0], p3[1], p3[2]);
      const wn = xformNorm(nLocal, m, hinge);
      pushTri(a, b, c, wn, col, aByte);
      pushTri(a, c, d, wn, col, aByte);
    };
    const edge = (p0, p1) => {
      if (!includeEdges) return;
      pushEdge(tp(p0[0], p0[1], p0[2]), tp(p1[0], p1[1], p1[2]), eCol, aByte);
    };

    // Tapered torso tiers matching LDraw 973.dat (waist y=-32, band y=-29, bevel y=-2, top y=0, depth z=±10)
    const tiers = [
      { y0: -32, w0: 19, y1: -29, w1: 19 },
      { y0: -29, w0: 19, y1: -2,  w1: 14.345 },
      { y0: -2,  w0: 14.345, y1: 0, w1: 12 },
    ];
    for (const t of tiers) {
      // Front (+Z) & Back (-Z)
      quad([-t.w0, t.y0, 10], [t.w0, t.y0, 10], [t.w1, t.y1, 10], [-t.w1, t.y1, 10], [0, 0, 1]);
      quad([t.w0, t.y0, -10], [-t.w0, t.y0, -10], [-t.w1, t.y1, -10], [t.w1, t.y1, -10], [0, 0, -1]);
      // Sloped Left (-X) & Right (+X) walls
      const dy = t.y1 - t.y0, dw = t.w0 - t.w1;
      const nl = Math.hypot(dy, dw) || 1;
      quad([-t.w0, t.y0, -10], [-t.w0, t.y0, 10], [-t.w1, t.y1, 10], [-t.w1, t.y1, -10], [-dy/nl, dw/nl, 0]);
      quad([t.w0, t.y0, 10], [t.w0, t.y0, -10], [t.w1, t.y1, -10], [t.w1, t.y1, 10], [dy/nl, dw/nl, 0]);
    }
    // Top & bottom caps
    quad([-12, 0, 10], [12, 0, 10], [12, 0, -10], [-12, 0, -10], [0, 1, 0]);
    quad([-19, -32, -10], [19, -32, -10], [19, -32, 10], [-19, -32, 10], [0, -1, 0]);
    // Clean outer silhouette edges
    for (const z of [-10, 10]) {
      edge([-19, -32, z], [19, -32, z]);
      edge([-19, -32, z], [-19, -29, z]); edge([19, -32, z], [19, -29, z]);
      edge([-19, -29, z], [-14.345, -2, z]); edge([19, -29, z], [14.345, -2, z]);
      edge([-14.345, -2, z], [-12, 0, z]); edge([14.345, -2, z], [12, 0, z]);
      edge([-12, 0, z], [12, 0, z]);
    }
    edge([-19, -32, -10], [-19, -32, 10]); edge([19, -32, -10], [19, -32, 10]);
    edge([-12, 0, -10], [-12, 0, 10]); edge([12, 0, -10], [12, 0, 10]);
    // Neck post
    addCyl(sx, sy + 5.6, sz, 5.8, 5.8, 11.2, 'y', 12, m, ox, oy, oz, hinge, col, eCol, aByte);

    if (!withArms) return;

    // Sculpted angled LEGO minifigure arms & yellow C-shaped hands (matching LDraw 973c01.dat)
    for (const s of [-1, 1]) {
      // Rounded shoulder cap seated flush against torso slope + upper arm + forward-angled forearm
      addLimb([sx + s*14.6, sy - 9.0, sz], [sx + s*18.6, sy - 9.4, sz], 4.6, 4.7, 10, m, ox, oy, oz, hinge, col, eCol, aByte);
      addLimb([sx + s*18.0, sy - 6.2, sz], [sx + s*18.6, sy - 9.6, sz], 3.4, 4.9, 10, m, ox, oy, oz, hinge, col, eCol, aByte);
      addLimb([sx + s*18.6, sy - 9.4, sz], [sx + s*21.0, sy - 20.6, sz + 0.6], 4.9, 4.6, 10, m, ox, oy, oz, hinge, col, eCol, aByte);
      addLimb([sx + s*21.0, sy - 20.6, sz + 0.6], [sx + s*23.3, sy - 26.4, sz + 9.2], 4.5, 3.8, 10, m, ox, oy, oz, hinge, col, eCol, aByte, true);
      // Wrist pin (yellow)
      addLimb([sx + s*23.3, sy - 26.4, sz + 9.2], [sx + s*23.6, sy - 27.0, sz + 11.4], 2.5, 2.5, 8, m, ox, oy, oz, hinge, handCol, handEdge, aByte);
      // C-shaped LEGO hand claw (250° arc opening forward toward +Z, grip axis tilted slightly forward)
      const hc = [sx + s*23.8, sy - 27.4, sz + 14.0];
      const segs = 8, rOut = 5.4, rIn = 3.2, hh = 3.1;
      // Local hand basis: up axis tilted forward ~18°, forward axis points +Z/-Y
      const ux = 0, uy = 0.951, uz = 0.309;
      const fx = 0, fy = -0.309, fz = 0.951;
      const hpt = (r, ang, hOff) => xformPt([
        hc[0] + Math.sin(ang)*r + ux*hOff,
        hc[1] + Math.cos(ang)*r*fy + uy*hOff,
        hc[2] + Math.cos(ang)*r*fz + uz*hOff,
      ], m, ox, oy, oz, hinge);
      const startA = 0.72, endA = Math.PI * 2 - 0.72;
      const nTop = xformNorm([ux, uy, uz], m, hinge);
      const nBot = xformNorm([-ux, -uy, -uz], m, hinge);
      for (let i = 0; i < segs; i++) {
        const a0 = startA + (i / segs) * (endA - startA);
        const a1 = startA + ((i + 1) / segs) * (endA - startA);
        const am = (a0 + a1) / 2;
        const outN = xformNorm([Math.sin(am), Math.cos(am)*fy, Math.cos(am)*fz], m, hinge);
        const inN = [-outN[0], -outN[1], -outN[2]];
        const ot0 = hpt(rOut, a0, hh), ot1 = hpt(rOut, a1, hh), ob0 = hpt(rOut, a0, -hh), ob1 = hpt(rOut, a1, -hh);
        const it0 = hpt(rIn, a0, hh),  it1 = hpt(rIn, a1, hh),  ib0 = hpt(rIn, a0, -hh),  ib1 = hpt(rIn, a1, -hh);
        pushTri(ob0, ob1, ot1, outN, handCol, aByte); pushTri(ob0, ot1, ot0, outN, handCol, aByte);
        pushTri(it0, it1, ib1, inN, handCol, aByte);  pushTri(it0, ib1, ib0, inN, handCol, aByte);
        pushTri(it0, ot0, ot1, nTop, handCol, aByte); pushTri(it0, ot1, it1, nTop, handCol, aByte);
        pushTri(ob0, ib0, ib1, nBot, handCol, aByte); pushTri(ob0, ib1, ob1, nBot, handCol, aByte);
        if (includeEdges) {
          pushEdge(ot0, ot1, handEdge, aByte);
          pushEdge(ob0, ob1, handEdge, aByte);
        }
        if (i === 0) {
          const capN = xformNorm([-Math.cos(a0), Math.sin(a0)*fy, Math.sin(a0)*fz], m, hinge);
          pushTri(ib0, ob0, ot0, capN, handCol, aByte); pushTri(ib0, ot0, it0, capN, handCol, aByte);
        }
        if (i === segs - 1) {
          const capN = xformNorm([Math.cos(a1), -Math.sin(a1)*fy, -Math.sin(a1)*fz], m, hinge);
          pushTri(ob1, ib1, it1, capN, handCol, aByte); pushTri(ob1, it1, ot1, capN, handCol, aByte);
        }
      }
    }
  };

  const emitSingleLeaf = (leafPart, isNew, isSelected, offX, offY, offZ, hingeRad, parentId = null, isGhost = false) => {
    const def = resolvePart(leafPart.p);
    const cInfo = COLORS[leafPart.c] || COLORS[71];
    const lookupId = parentId || leafPart.id;
    const overrideHex = isGhost ? null : (opts.partColorOverrides?.[lookupId] || opts.partColorOverrides?.[leafPart.id] || null);
    const isDimmed = !isGhost && Boolean(opts.dimPartIds && (opts.dimPartIds.has(lookupId) || opts.dimPartIds.has(leafPart.id)));
    const isFaded = (!isNew && opts.fadePrev) || isDimmed;
    const isRealTrans = !isGhost && !overrideHex && (cInfo.alpha || 1) < 0.96;
    // Fade solid earlier bricks via clean color muting (NOT alpha transparency with depthMask=false!)
    // so bricks underneath ALWAYS stay properly depth-occluded by plates above them!
    const fadeMix = isGhost
      ? 0.62
      : isDimmed
        ? 0.72
        : isFaded
          ? Math.max(0, Math.min(0.76, (1.0 - opts.fadeOpacity) * 0.95 + (opts.fadeOpacity < 0.99 ? 0.16 : 0)))
          : 0;
    const hasSelectiveHighlight = Boolean(opts.highlightOnlyPartIds);
    const matchesSelectiveHighlight = hasSelectiveHighlight && (opts.highlightOnlyPartIds.has(leafPart.id) || opts.highlightOnlyPartIds.has(lookupId));
    const shouldHighlight = !isGhost && isNew && (
      hasSelectiveHighlight ? matchesSelectiveHighlight : Boolean(opts.highlightNew)
    );
    const hlColorHex = (hasSelectiveHighlight && !opts.highlightNew) ? '#f97316' : (opts.highlightColor || '#f97316');
    const baseHex = overrideHex || cInfo.hex;
    const baseCol = isGhost
      ? hexToRgb255(baseHex, 0.58)
      : isSelected
        ? [26, 115, 232]
        : hexToRgb255(baseHex, fadeMix);
    const edgeCol = isGhost
      ? [51, 65, 85]
      : isSelected
        ? [255, 255, 255]
        : overrideHex
          ? hexToRgb255('#1e293b', isDimmed ? 0.72 : 0.25)
          : (shouldHighlight ? hexToRgb255(hlColorHex, 0) : hexToRgb255(cInfo.edge, fadeMix * 0.85));
    const aByte = isGhost
      ? 82
      : isRealTrans
        ? Math.round(255 * (cInfo.alpha || 0.7) * (isFaded ? Math.max(0.55, opts.fadeOpacity) : 1))
        : 255;
    const edgeAlpha = isGhost ? 185 : aByte;
    const m = leafPart.m || R_ID;
    const ox = leafPart.x + offX, oy = leafPart.y + offY, oz = leafPart.z + offZ;

    const compiled = compileEmbeddedDat(leafPart.p);
    if (compiled) {
      const T = compiled.tris, N = compiled.norms, E = compiled.edges, TC = compiled.triCols;
      const allowSubCols = !isSelected && !overrideHex && !isGhost;
      const subColCache = allowSubCols ? new Map() : null;
      const resolveSubColor = (cid) => {
        if (!subColCache || cid === 16 || cid < 0) return null;
        let cached = subColCache.get(cid);
        if (cached !== undefined) return cached;
        if (isDirectRgbColor(cid)) {
          const r = (cid >> 16) & 255, g = (cid >> 8) & 255, b = cid & 255;
          cached = {
            rgb: [
              Math.round(r * (1 - fadeMix) + 218 * fadeMix),
              Math.round(g * (1 - fadeMix) + 222 * fadeMix),
              Math.round(b * (1 - fadeMix) + 228 * fadeMix),
            ],
            alpha: 255,
          };
        } else if (COLORS[cid]) {
          const sc = COLORS[cid];
          const scTrans = (sc.alpha || 1) < 0.96;
          cached = {
            rgb: hexToRgb255(sc.hex, fadeMix),
            alpha: scTrans ? Math.round(255 * (sc.alpha || 0.7) * (isFaded ? Math.max(0.55, opts.fadeOpacity) : 1)) : 255,
          };
        } else {
          cached = null;
        }
        subColCache.set(cid, cached);
        return cached;
      };
      for (let i = 0, ti = 0; i < T.length; i += 9, ti++) {
        const a = xformPt([T[i],T[i+1],T[i+2]], m, ox, oy, oz, hingeRad);
        const b = xformPt([T[i+3],T[i+4],T[i+5]], m, ox, oy, oz, hingeRad);
        const c = xformPt([T[i+6],T[i+7],T[i+8]], m, ox, oy, oz, hingeRad);
        const n = xformNorm([N[i],N[i+1],N[i+2]], m, hingeRad);
        let triRgb = baseCol;
        let triAlpha = aByte;
        if (TC && subColCache) {
          const sc = resolveSubColor(TC[ti]);
          if (sc) { triRgb = sc.rgb; triAlpha = sc.alpha; }
        }
        pushTri(a, b, c, n, triRgb, triAlpha);
      }
      if (compiled.texBatches && compiled.texBatches.length > 0) {
        const useTextures = !isSelected && !overrideHex && !isGhost;
        for (const tb of compiled.texBatches) {
          const BT = tb.tris, BN = tb.norms, BU = tb.uvs, BTC = tb.triCols;
          for (let i = 0, ui = 0, ti = 0; i < BT.length; i += 9, ui += 6, ti++) {
            const a = xformPt([BT[i],BT[i+1],BT[i+2]], m, ox, oy, oz, hingeRad);
            const b = xformPt([BT[i+3],BT[i+4],BT[i+5]], m, ox, oy, oz, hingeRad);
            const c = xformPt([BT[i+6],BT[i+7],BT[i+8]], m, ox, oy, oz, hingeRad);
            const n = xformNorm([BN[i],BN[i+1],BN[i+2]], m, hingeRad);
            let triRgb = baseCol;
            let triAlpha = aByte;
            if (BTC && subColCache) {
              const sc = resolveSubColor(BTC[ti]);
              if (sc) { triRgb = sc.rgb; triAlpha = sc.alpha; }
            }
            if (useTextures) {
              pushTexTri(
                tb.texKey,
                fadeMix,
                isNew,
                a, b, c, n,
                [BU[ui], BU[ui+1]],
                [BU[ui+2], BU[ui+3]],
                [BU[ui+4], BU[ui+5]],
                triRgb,
                triAlpha,
              );
            } else {
              pushTri(a, b, c, n, triRgb, triAlpha);
            }
          }
        }
      }
      if ((includeEdges || isNew || isSelected || isGhost) && E.length > 0) {
        for (let i = 0; i < E.length; i += 6) {
          const a = xformPt([E[i],E[i+1],E[i+2]], m, ox, oy, oz, hingeRad);
          const b = xformPt([E[i+3],E[i+4],E[i+5]], m, ox, oy, oz, hingeRad);
          pushEdge(a, b, edgeCol, edgeAlpha);
        }
      }
      return;
    }

    const w = def.sx * 20 - 0.5, d = def.sz * 20 - 0.5, h = def.h;
    if (def.shape === 'bar') addCyl(0, def.centered ? 0 : -h/2, 0, 3.8,3.8,h,'y',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    else if (def.shape === 'round') { addCyl(0,-h/2,0, (def.sx*20)/2-0.3,(def.sx*20)/2-0.3,h,'y',12, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte); addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte); }
    else if (def.shape === 'snot4' || def.shape === 'snot1') {
      addBox(0,-h/2,0, w,h,d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(w/2+1.9,-h/2,0, 5.8,5.8,4.6,'x',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      if (def.shape === 'snot4') {
        addCyl(-w/2-1.9,-h/2,0, 5.8,5.8,4.6,'x',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
        addCyl(0,-h/2,d/2+1.9, 5.8,5.8,4.6,'z',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
        addCyl(0,-h/2,-d/2-1.9, 5.8,5.8,4.6,'z',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      }
    } else if (def.shape === 'mf_legs') {
      addBox(0,-3,0, 32,6,16, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(-8.5,-17,0, 14,22,14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(8.5,-17,0, 14,22,14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
    } else if (def.shape === 'mf_torso_body') {
      // Bare minifigure torso (exact LDraw 973.dat proportions: y=0 shoulders, y=-32 waist, neck +0..+11.2)
      addMinifigTorso([0, 0, 0], false, m, ox, oy, oz, hingeRad, baseCol, edgeCol, baseCol, edgeCol, aByte);
    } else if (def.shape === 'mf_torso') {
      const sh = isBrickLinkTorsoAssemblyId(normId(leafPart.p)) ? [-20, 32, -10] : [0, 0, 0];
      const yellowInfo = COLORS[14];
      const handCol = (isSelected || overrideHex || isGhost) ? baseCol : hexToRgb255(yellowInfo.hex, fadeMix);
      const handEdge = (isSelected || overrideHex || isGhost)
        ? edgeCol
        : (shouldHighlight ? hexToRgb255(hlColorHex, 0) : hexToRgb255(yellowInfo.edge, fadeMix * 0.85));
      addMinifigTorso(sh, true, m, ox, oy, oz, hingeRad, baseCol, edgeCol, handCol, handEdge, aByte);
    } else if (def.shape === 'mf_head') {
      // Authentic LEGO minifigure head proportions (matches LDraw 3626c / 28621: crown y=0, neck bottom y=-24)
      addCyl(0, 2.0, 0, 5.8, 5.8, 4.4, 'y', 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -1.8, 0, 8.6, 12.6, 3.6, 'y', 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -10.5, 0, 12.6, 12.6, 13.8, 'y', 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -19.2, 0, 12.6, 8.6, 3.6, 'y', 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -22.5, 0, 8.0, 8.0, 3.2, 'y', 12, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'mf_helmet') {
      addCyl(0,-12,0, 11.5,12.2,20,'y',12, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addBox(0,-11,10, 16,8,5, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
    } else {
      addBox(0,-h/2,0, w,h,d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    }
  };

  const emitPart = (part, isNew) => {
    const pOv = isNew ? (opts.partOffsets?.[part.id] || null) : null;
    const stepOv = isNew ? (opts.ov || null) : null;
    const offX = (pOv?.x || 0) + (stepOv?.offX || 0);
    const offY = (pOv?.y || 0) + (stepOv?.offY || 0);
    const offZ = (pOv?.z || 0) + (stepOv?.offZ || 0);
    const hingeRad = (((pOv?.tilt || 0) + (stepOv?.hingeDeg || 0)) * Math.PI) / 180;
    const isSel = isNew && Boolean(opts.selectedPartIds?.has(part.id));

    if (part.children && part.children.length > 0) {
      for (const ch of part.children) emitSingleLeaf(ch, isNew, isSel, offX, offY, offZ, hingeRad, part.id);
    } else {
      emitSingleLeaf(part, isNew, isSel, offX, offY, offZ, hingeRad, part.id);
    }

    // Placement Arrows ONLY when a piece is ACTUALLY offset/exploded! (Zero random arrows!)
    const hasOffset = Math.hypot(offX, offY, offZ) >= 6;
    const arrowEnabled = pOv ? (pOv.arrow !== false) : (opts.showArrows !== false);
    if (isNew && hasOffset && arrowEnabled) {
      const box = computeWorldBox(part);
      const from = [box.center[0] + offX, box.center[1] + offY, box.center[2] + offZ];
      const to = [box.center[0], box.center[1], box.center[2]];
      addArrow3D(from, to, hexToRgb255(opts.accent || '#1a73e8', 0));
    }
  };

  prevParts.forEach(p => emitPart(p, false));
  const prevOpEnd = opPos.len, prevTrEnd = trPos.len;
  newParts.forEach(p => emitPart(p, true));

  // Starting-pose translucent ghost limbs & 3D curved rotation indicators (for minifigure Prepare steps!)
  if (Array.isArray(opts.ghostParts) && opts.ghostParts.length > 0) {
    for (const gp of opts.ghostParts) {
      if (gp.children && gp.children.length > 0) {
        for (const ch of gp.children) emitSingleLeaf(ch, false, false, 0, 0, 0, 0, gp.id, true);
      } else {
        emitSingleLeaf(gp, false, false, 0, 0, 0, 0, gp.id, true);
      }
    }
  }
  if (Array.isArray(opts.minifigIndicators) && opts.minifigIndicators.length > 0) {
    for (const ind of opts.minifigIndicators) addCurvedArrow3D(ind);
  }

  const opP = opPos.slice(), trP = trPos.slice();
  const opN = opNorm.slice(), trN = trNorm.slice();
  const opC = opCol.slice(), trC = trCol.slice();

  const triPos = new Float32Array(opP.length + trP.length); triPos.set(opP, 0); triPos.set(trP, opP.length);
  const triNorm = new Float32Array(opN.length + trN.length); triNorm.set(opN, 0); triNorm.set(trN, opN.length);
  const triCol = new Uint8Array(opC.length + trC.length); triCol.set(opC, 0); triCol.set(trC, opC.length);

  const texDraws = [];
  for (const g of texGroups.values()) {
    if (g.pos.len < 9) continue;
    texDraws.push({
      texKey: g.texKey,
      fadeMix: g.fadeMix,
      prevPosEnd: g.prevPosEnd,
      triPos: new Float32Array(g.pos.slice()),
      triNorm: new Float32Array(g.norm.slice()),
      triUv: new Float32Array(g.uv.slice()),
      triCol: new Uint8Array(g.col.slice()),
    });
  }

  // 1. Full model bounding sphere
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  const scanBounds = (arr) => {
    for (let i=0; i<arr.length; i+=3) {
      const x=arr[i], y=arr[i+1], z=arr[i+2];
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;if(z<minZ)minZ=z;if(z>maxZ)maxZ=z;
    }
  };
  scanBounds(triPos);
  for (const td of texDraws) scanBounds(td.triPos);
  const fcx=isFinite(minX)?(minX+maxX)/2:0, fcy=isFinite(minY)?(minY+maxY)/2:0, fcz=isFinite(minZ)?(minZ+maxZ)/2:0;
  let fullR2 = 0;
  const scanFullR = (arr) => {
    for (let i=0; i<arr.length; i+=3) {
      const dx=arr[i]-fcx, dy=arr[i+1]-fcy, dz=arr[i+2]-fcz;
      const r2 = dx*dx + dy*dy + dz*dz;
      if (r2 > fullR2) fullR2 = r2;
    }
  };
  scanFullR(triPos);
  for (const td of texDraws) scanFullR(td.triPos);
  const fullRadius = Math.max(Math.sqrt(fullR2), 20);

  // 2. New-pieces-only bounding sphere (for smart Close-Up framing on large models!)
  let nMinX=Infinity,nMinY=Infinity,nMinZ=Infinity,nMaxX=-Infinity,nMaxY=-Infinity,nMaxZ=-Infinity;
  const scanRange = (arr, start, end) => {
    for (let i = start; i < end; i += 3) {
      const x = arr[i], y = arr[i+1], z = arr[i+2];
      if(x<nMinX)nMinX=x;if(x>nMaxX)nMaxX=x;if(y<nMinY)nMinY=y;if(y>nMaxY)nMaxY=y;if(z<nMinZ)nMinZ=z;if(z>nMaxZ)nMaxZ=z;
    }
  };
  scanRange(opP, prevOpEnd, opP.length);
  scanRange(trP, prevTrEnd, trP.length);
  for (const td of texDraws) scanRange(td.triPos, td.prevPosEnd, td.triPos.length);

  let targetCenter = [fcx, fcy, fcz];
  let viewRadius = fullRadius;
  let isZoomedIn = false;

  if (prevParts.length > 0 && isFinite(nMinX)) {
    const ncx = (nMinX + nMaxX) / 2, ncy = (nMinY + nMaxY) / 2, ncz = (nMinZ + nMaxZ) / 2;
    let newR2 = 0;
    const scanR = (arr, start, end) => {
      for (let i = start; i < end; i += 3) {
        const dx = arr[i]-ncx, dy = arr[i+1]-ncy, dz = arr[i+2]-ncz;
        const r2 = dx*dx + dy*dy + dz*dz;
        if (r2 > newR2) newR2 = r2;
      }
    };
    scanR(opP, prevOpEnd, opP.length);
    scanR(trP, prevTrEnd, trP.length);
    for (const td of texDraws) scanR(td.triPos, td.prevPosEnd, td.triPos.length);
    const newRadius = Math.max(Math.sqrt(newR2), 18);
    const focusMode = opts.ov?.focusMode || 'auto';

    if (focusMode === 'focus' || (focusMode === 'auto' && fullRadius > 115 && (newRadius / fullRadius) < 0.44)) {
      // Blend 12% toward full model center so nearby recognizable structure stays in view!
      const blend = focusMode === 'focus' ? 0.08 : 0.12;
      targetCenter = [
        ncx + (fcx - ncx) * blend,
        ncy + (fcy - ncy) * blend,
        ncz + (fcz - ncz) * blend,
      ];
      viewRadius = Math.min(fullRadius * 0.85, Math.max(newRadius * 2.25, fullRadius * 0.26, 72));
      isZoomedIn = viewRadius < fullRadius * 0.86;
    }
  }

  return {
    triPos, triNorm, triCol,
    opaqueCount: opP.length / 3,
    transCount: trP.length / 3,
    texDraws,
    linePos: new Float32Array(lnPos.slice()),
    lineCol: new Uint8Array(lnCol.slice()),
    center: targetCenter,
    radius: viewRadius,
    fullRadius,
    isZoomedIn,
    bounds: isFinite(minX) ? { minX, minY, minZ, maxX, maxY, maxZ } : { minX: -20, minY: 0, minZ: -10, maxX: 20, maxY: 100, maxZ: 10 },
  };
}

// GPU-Cached WebGL Engine: Uploads buffers ONLY once per mesh (0 bytes uploaded while orbiting!)
class WebGLBrickEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.uploadedMesh = null;
    this.glTextures = new Map();
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'default' });
    this.gl = gl;
    if (!gl) return;
    const vsTri = `attribute vec3 aPos; attribute vec3 aNorm; attribute vec4 aCol; uniform mat4 uMVP; varying vec3 vNorm; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); vNorm = aNorm; vCol = aCol; }`;
    const fsTri = `precision mediump float;
      uniform float uHeroMode;
      uniform vec3 uViewDir;
      varying vec3 vNorm;
      varying vec4 vCol;
      void main(){
        vec3 n = normalize(vNorm);
        if (!gl_FrontFacing) n = -n;
        if (uHeroMode > 0.5) {
          vec3 v = normalize(uViewDir);
          vec3 keyDir = normalize(vec3(0.42, 0.86, 0.52));
          vec3 fillDir = normalize(vec3(-0.68, 0.38, 0.34));
          vec3 rimDir = normalize(vec3(-0.22, 0.58, -0.78));
          float key = max(dot(n, keyDir), 0.0);
          float fill = max(dot(n, fillDir), 0.0);
          float rim = max(dot(n, rimDir), 0.0);
          float hemi = 0.50 + 0.14 * n.y + 0.05 * max(-n.y, 0.0);
          float diff = min(1.06, hemi + key * 0.44 + fill * 0.18 + rim * 0.12);
          vec3 hKey = normalize(keyDir + v);
          float specKey = pow(max(dot(n, hKey), 0.0), 42.0) * 0.17;
          vec3 hRim = normalize(rimDir + v);
          float specRim = pow(max(dot(n, hRim), 0.0), 26.0) * 0.07;
          vec3 col = min(vec3(1.0), vCol.rgb * diff + vec3(specKey + specRim));
          gl_FragColor = vec4(col, vCol.a);
        } else {
          float key = max(dot(n, normalize(vec3(0.55,0.85,0.55))), 0.0);
          float fill = max(dot(n, normalize(vec3(-0.7,0.35,-0.5))), 0.0);
          float hemi = 0.50 + 0.15 * n.y;
          float shade = min(1.08, hemi + key * 0.44 + fill * 0.18);
          gl_FragColor = vec4(vCol.rgb * shade, vCol.a);
        }
      }`;
    const vsTex = `attribute vec3 aPos; attribute vec3 aNorm; attribute vec2 aUv; attribute vec4 aCol; uniform mat4 uMVP; varying vec3 vNorm; varying vec2 vUv; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); vNorm = aNorm; vUv = aUv; vCol = aCol; }`;
    const fsTex = `precision mediump float;
      uniform float uHeroMode;
      uniform vec3 uViewDir;
      uniform sampler2D uTex;
      uniform float uUseTex;
      uniform float uFadeMix;
      varying vec3 vNorm;
      varying vec2 vUv;
      varying vec4 vCol;
      void main(){
        vec3 n = normalize(vNorm);
        if (!gl_FrontFacing) n = -n;
        vec3 baseRgb = vCol.rgb;
        if (uUseTex > 0.5 && vUv.x >= 0.0 && vUv.x <= 1.0 && vUv.y >= 0.0 && vUv.y <= 1.0) {
          vec4 decal = texture2D(uTex, vUv);
          vec3 decalRgb = mix(decal.rgb, vec3(0.855, 0.871, 0.894), uFadeMix);
          baseRgb = mix(baseRgb, decalRgb, decal.a);
        }
        if (uHeroMode > 0.5) {
          vec3 v = normalize(uViewDir);
          vec3 keyDir = normalize(vec3(0.42, 0.86, 0.52));
          vec3 fillDir = normalize(vec3(-0.68, 0.38, 0.34));
          vec3 rimDir = normalize(vec3(-0.22, 0.58, -0.78));
          float key = max(dot(n, keyDir), 0.0);
          float fill = max(dot(n, fillDir), 0.0);
          float rim = max(dot(n, rimDir), 0.0);
          float hemi = 0.50 + 0.14 * n.y + 0.05 * max(-n.y, 0.0);
          float diff = min(1.06, hemi + key * 0.44 + fill * 0.18 + rim * 0.12);
          vec3 hKey = normalize(keyDir + v);
          float specKey = pow(max(dot(n, hKey), 0.0), 42.0) * 0.17;
          vec3 hRim = normalize(rimDir + v);
          float specRim = pow(max(dot(n, hRim), 0.0), 26.0) * 0.07;
          vec3 col = min(vec3(1.0), baseRgb * diff + vec3(specKey + specRim));
          gl_FragColor = vec4(col, vCol.a);
        } else {
          float key = max(dot(n, normalize(vec3(0.55,0.85,0.55))), 0.0);
          float fill = max(dot(n, normalize(vec3(-0.7,0.35,-0.5))), 0.0);
          float hemi = 0.50 + 0.15 * n.y;
          float shade = min(1.08, hemi + key * 0.44 + fill * 0.18);
          gl_FragColor = vec4(baseRgb * shade, vCol.a);
        }
      }`;
    const vsLine = `attribute vec3 aPos; attribute vec4 aCol; uniform mat4 uMVP; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); gl_Position.z -= 0.00022; vCol = aCol; }`;
    const fsLine = `precision mediump float; uniform float uLineAlpha; varying vec4 vCol; void main(){ gl_FragColor = vec4(vCol.rgb, vCol.a * uLineAlpha); }`;
    const cmp = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
    const lnk = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, cmp(gl.VERTEX_SHADER, v)); gl.attachShader(p, cmp(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p); return p; };
    this.triProg = lnk(vsTri, fsTri);
    this.texProg = lnk(vsTex, fsTex);
    this.lineProg = lnk(vsLine, fsLine);
    this.loc = {
      tMVP: gl.getUniformLocation(this.triProg, 'uMVP'),
      tHeroMode: gl.getUniformLocation(this.triProg, 'uHeroMode'),
      tViewDir: gl.getUniformLocation(this.triProg, 'uViewDir'),
      tPos: gl.getAttribLocation(this.triProg, 'aPos'),
      tNorm: gl.getAttribLocation(this.triProg, 'aNorm'),
      tCol: gl.getAttribLocation(this.triProg, 'aCol'),
      xMVP: gl.getUniformLocation(this.texProg, 'uMVP'),
      xHeroMode: gl.getUniformLocation(this.texProg, 'uHeroMode'),
      xViewDir: gl.getUniformLocation(this.texProg, 'uViewDir'),
      xTex: gl.getUniformLocation(this.texProg, 'uTex'),
      xUseTex: gl.getUniformLocation(this.texProg, 'uUseTex'),
      xFadeMix: gl.getUniformLocation(this.texProg, 'uFadeMix'),
      xPos: gl.getAttribLocation(this.texProg, 'aPos'),
      xNorm: gl.getAttribLocation(this.texProg, 'aNorm'),
      xUv: gl.getAttribLocation(this.texProg, 'aUv'),
      xCol: gl.getAttribLocation(this.texProg, 'aCol'),
      lMVP: gl.getUniformLocation(this.lineProg, 'uMVP'),
      lAlpha: gl.getUniformLocation(this.lineProg, 'uLineAlpha'),
      lPos: gl.getAttribLocation(this.lineProg, 'aPos'),
      lCol: gl.getAttribLocation(this.lineProg, 'aCol'),
    };
    this.bTriPos = gl.createBuffer(); this.bTriNorm = gl.createBuffer(); this.bTriCol = gl.createBuffer();
    this.bTexPos = gl.createBuffer(); this.bTexNorm = gl.createBuffer(); this.bTexUv = gl.createBuffer(); this.bTexCol = gl.createBuffer();
    this.bLinePos = gl.createBuffer(); this.bLineCol = gl.createBuffer();
    this.emptyTex = gl.createTexture();
    if (this.emptyTex) {
      gl.bindTexture(gl.TEXTURE_2D, this.emptyTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    }
  }
  getOrCreateGlTexture(texKey) {
    const gl = this.gl;
    if (!gl) return null;
    const cached = this.glTextures.get(texKey);
    if (cached) return cached;
    const img = textureStore.getDecodedImage(texKey);
    if (!img) return null;
    const tex = gl.createTexture();
    if (!tex) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    this.glTextures.set(texKey, tex);
    return tex;
  }
  uploadIfNeeded(mesh) {
    if (this.uploadedMesh === mesh || !this.gl) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos); gl.bufferData(gl.ARRAY_BUFFER, mesh.triPos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm); gl.bufferData(gl.ARRAY_BUFFER, mesh.triNorm, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol); gl.bufferData(gl.ARRAY_BUFFER, mesh.triCol, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bLinePos); gl.bufferData(gl.ARRAY_BUFFER, mesh.linePos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bLineCol); gl.bufferData(gl.ARRAY_BUFFER, mesh.lineCol, gl.STATIC_DRAW);
    this.uploadedMesh = mesh;
  }
  computeMVP(mesh, w, h, azDeg, elDeg, zoom = 1, fixedHalfH = 0, tightFit = false, fixedCenter = null) {
    const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
    const center = fixedCenter || mesh.center;
    // Tight near/far ortho depth range around full model radius for 4x sharper Z-buffer occlusion!
    const clipRadius = Math.max(mesh.fullRadius || mesh.radius, mesh.radius, fixedHalfH > 0 ? fixedHalfH * 1.35 : 0);
    const dist = clipRadius * 2.5;
    const eye = [center[0]+dist*Math.sin(az)*Math.cos(el), center[1]+dist*Math.sin(el), center[2]+dist*Math.cos(az)*Math.cos(el)];
    const near = Math.max(1, dist - clipRadius * 2.4);
    const far = dist + clipRadius * 2.4;
    const view = lookAtMat4(eye, center, [0, 1, 0]);
    const tightPos = mesh.triPos && mesh.triPos.length >= 9
      ? mesh.triPos
      : (mesh.texDraws && mesh.texDraws.length > 0 ? mesh.texDraws[0].triPos : null);
    if (tightFit && fixedHalfH <= 0 && tightPos && tightPos.length >= 9) {
      const tb = computeTightCameraBounds(tightPos, center, azDeg, elDeg, w, h, zoom, 1.07);
      if (tb) {
        // Reserve a small bottom strip (~3.5%) so the soft studio floor shadow never clips
        const shadowShiftY = tb.halfH * 0.035;
        return mulMat4(
          orthoMat4(
            tb.centerX - tb.halfW,
            tb.centerX + tb.halfW,
            tb.centerY - tb.halfH - shadowShiftY,
            tb.centerY + tb.halfH - shadowShiftY,
            near,
            far,
          ),
          view,
        );
      }
    }
    const halfH = fixedHalfH > 0
      ? (fixedCenter ? fixedHalfH / Math.max(0.4, zoom) : fixedHalfH)
      : ((mesh.radius * 1.12) / Math.max(0.4, zoom));
    const halfW = halfH * (w / Math.max(1, h));
    return mulMat4(orthoMat4(-halfW, halfW, -halfH, halfH, near, far), view);
  }
  draw(mesh, w, h, azDeg, elDeg, zoom = 1, fixedHalfH = 0, drawOpts = null) {
    const gl = this.gl;
    const hasTexDraws = Boolean(mesh.texDraws && mesh.texDraws.length > 0);
    if (!gl || (mesh.triPos.length === 0 && !hasTexDraws)) return null;
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.uploadIfNeeded(mesh);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.0, 1.0);

    const tightFit = Boolean(drawOpts?.tightFit);
    const heroShading = Boolean(drawOpts?.heroShading);
    const lineAlpha = typeof drawOpts?.lineAlpha === 'number' ? drawOpts.lineAlpha : (heroShading ? 0.52 : 1.0);
    const fixedCenter = drawOpts?.fixedCenter || null;
    const mvp = this.computeMVP(mesh, w, h, azDeg, elDeg, zoom, fixedHalfH, tightFit, fixedCenter);
    const { forward } = computeCameraBasis(azDeg, elDeg);

    gl.useProgram(this.triProg);
    gl.uniformMatrix4fv(this.loc.tMVP, false, mvp);
    gl.uniform1f(this.loc.tHeroMode, heroShading ? 1.0 : 0.0);
    gl.uniform3f(this.loc.tViewDir, forward[0], forward[1], forward[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos); gl.enableVertexAttribArray(this.loc.tPos); gl.vertexAttribPointer(this.loc.tPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm); gl.enableVertexAttribArray(this.loc.tNorm); gl.vertexAttribPointer(this.loc.tNorm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol); gl.enableVertexAttribArray(this.loc.tCol); gl.vertexAttribPointer(this.loc.tCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);

    gl.depthMask(true);
    if (mesh.opaqueCount > 0) gl.drawArrays(gl.TRIANGLES, 0, mesh.opaqueCount);

    if (hasTexDraws) {
      gl.polygonOffset(0.5, 0.5);
      gl.useProgram(this.texProg);
      gl.uniformMatrix4fv(this.loc.xMVP, false, mvp);
      gl.uniform1f(this.loc.xHeroMode, heroShading ? 1.0 : 0.0);
      gl.uniform3f(this.loc.xViewDir, forward[0], forward[1], forward[2]);
      gl.uniform1i(this.loc.xTex, 0);
      gl.enableVertexAttribArray(this.loc.xPos);
      gl.enableVertexAttribArray(this.loc.xNorm);
      gl.enableVertexAttribArray(this.loc.xUv);
      gl.enableVertexAttribArray(this.loc.xCol);
      for (const td of mesh.texDraws) {
        if (td.triPos.length < 9) continue;
        const glTex = this.getOrCreateGlTexture(td.texKey);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glTex || this.emptyTex);
        gl.uniform1f(this.loc.xUseTex, glTex ? 1.0 : 0.0);
        gl.uniform1f(this.loc.xFadeMix, td.fadeMix || 0.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexPos);
        gl.bufferData(gl.ARRAY_BUFFER, td.triPos, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xPos, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexNorm);
        gl.bufferData(gl.ARRAY_BUFFER, td.triNorm, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xNorm, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexUv);
        gl.bufferData(gl.ARRAY_BUFFER, td.triUv, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xUv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexCol);
        gl.bufferData(gl.ARRAY_BUFFER, td.triCol, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, td.triPos.length / 3);
      }
      gl.disableVertexAttribArray(this.loc.xUv);
      gl.polygonOffset(1.0, 1.0);
      // Restore triProg for transparent bricks if needed
      if (mesh.transCount > 0) {
        gl.useProgram(this.triProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos); gl.enableVertexAttribArray(this.loc.tPos); gl.vertexAttribPointer(this.loc.tPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm); gl.enableVertexAttribArray(this.loc.tNorm); gl.vertexAttribPointer(this.loc.tNorm, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol); gl.enableVertexAttribArray(this.loc.tCol); gl.vertexAttribPointer(this.loc.tCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      }
    }

    if (mesh.transCount > 0) {
      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, mesh.opaqueCount, mesh.transCount);
      gl.depthMask(true);
    }
    if (mesh.linePos.length > 0 && lineAlpha > 0.01) {
      gl.useProgram(this.lineProg);
      gl.uniformMatrix4fv(this.loc.lMVP, false, mvp);
      gl.uniform1f(this.loc.lAlpha, lineAlpha);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLinePos); gl.enableVertexAttribArray(this.loc.lPos); gl.vertexAttribPointer(this.loc.lPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLineCol); gl.enableVertexAttribArray(this.loc.lCol); gl.vertexAttribPointer(this.loc.lCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      gl.drawArrays(gl.LINES, 0, mesh.linePos.length / 3);
    }
    return mvp;
  }
  dispose() {
    if (!this.gl) return;
    for (const tex of this.glTextures.values()) this.gl.deleteTexture(tex);
    this.glTextures.clear();
    if (this.emptyTex) this.gl.deleteTexture(this.emptyTex);
    this.emptyTex = null;
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
  }
}

const snapshotCanvas = document.createElement('canvas');
const snapshotEngine = new WebGLBrickEngine(snapshotCanvas);
let studioPhotoEngine = null;
let activeLiveEngine = null;
const pliThumbCache = new Map();
const coverHeroCache = new Map();

function getStudioPhotoEngine() {
  if (!studioPhotoEngine) {
    try {
      studioPhotoEngine = new StudioPhotoRenderer();
    } catch (_) {
      studioPhotoEngine = null;
    }
  }
  return studioPhotoEngine;
}

function isDarkHexColor(hex) {
  const clean = String(hex || '#ffffff').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16) || 255;
  const g = parseInt(full.slice(2, 4), 16) || 255;
  const b = parseInt(full.slice(4, 6), 16) || 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
}

function getPliThumb(part) {
  const key = `${part.p}:${part.c}`;
  if (pliThumbCache.has(key)) return pliThumbCache.get(key);
  const samplePart = normalizeCompositeThumbPart(part, (pid) => resolvePart(pid).name, computeWorldBox);
  const mesh = buildMeshBuffers([], [samplePart], { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  snapshotEngine.draw(mesh, 160, 160, 32, 22, 1.08);
  const url = snapshotCanvas.toDataURL('image/png');
  if (pliThumbCache.size > 220) pliThumbCache.clear();
  pliThumbCache.set(key, url);
  return url;
}

function renderSnapshot(prev, next, az, el, w, h, zoom, opts) {
  const mesh = buildMeshBuffers(prev, next, opts);
  const mvp = snapshotEngine.draw(mesh, w, h, az, el, zoom, opts?.fixedHalfH || 0, opts);
  return { url: snapshotCanvas.toDataURL('image/png'), mesh, mvp, w, h };
}

function renderCoverHeroSnapshot(parts, az, el, zoom, targetW, targetH, theme) {
  const safeZoom = clampCoverZoom(zoom ?? 1.0);
  const rw = Math.max(480, Math.min(2000, Math.round(targetW)));
  const rh = Math.max(320, Math.min(2000, Math.round(targetH)));
  const darkTheme = isDarkHexColor(toHexColor(theme?.bgColor || '#ffffff', '#ffffff'));
  const cacheKey = `${parts.length}|${Math.round(az * 10)}|${Math.round(el * 10)}|${safeZoom}|${rw}x${rh}|${darkTheme ? 'd' : 'l'}`;
  if (coverHeroCache.has(cacheKey)) return coverHeroCache.get(cacheKey);

  // Reuse hero beveled mesh across angle/zoom/theme edits for instant responsiveness
  const meshCacheKey = `__hero_mesh_${parts.length}`;
  let mesh = coverHeroCache.get(meshCacheKey);
  if (!mesh) {
    mesh = buildMeshBuffers([], parts, {
      highlightNew: false,
      fadePrev: false,
      showArrows: false,
      heroQuality: true,
      accent: theme?.accent || '#1a73e8',
    });
    coverHeroCache.set(meshCacheKey, mesh);
  }

  // Primary path: Photorealistic multi-pass WebGL Studio Renderer (triple softbox shadow maps,
  // linear-space GGX ABS plastic PBR, Fresnel softbox reflections, 3D shadow-catcher floor, SSAO)
  const photo = getStudioPhotoEngine();
  if (photo && photo.isAvailable()) {
    const rendered = photo.render(mesh, {
      azDeg: az,
      elDeg: el,
      width: rw,
      height: rh,
      zoom: safeZoom,
      darkBackground: darkTheme,
      getTextureImage: (texKey) => textureStore.getDecodedImage(texKey),
    });
    if (rendered) {
      const out = { url: rendered.url, mesh, mvp: null, w: rendered.width, h: rendered.height };
      if (coverHeroCache.size > 18) {
        const keepMesh = coverHeroCache.get(meshCacheKey);
        coverHeroCache.clear();
        if (keepMesh) coverHeroCache.set(meshCacheKey, keepMesh);
      }
      coverHeroCache.set(cacheKey, out);
      return out;
    }
  }

  // Fallback path if FBO shadow maps are unavailable on the current device
  const mvp = snapshotEngine.draw(mesh, rw, rh, az, el, safeZoom, 0, {
    tightFit: true,
    heroShading: true,
    lineAlpha: 0.32,
  });

  const comp = document.createElement('canvas');
  comp.width = rw;
  comp.height = rh;
  const cctx = comp.getContext('2d');
  if (cctx && mvp && mesh.triPos.length >= 9) {
    const minY = mesh.bounds.minY;
    const baseTol = minY + Math.max(10, (mesh.bounds.maxY - minY) * 0.09);
    let allMinX = Infinity, allMaxX = -Infinity, allMinY = Infinity, allMaxY = -Infinity;
    let baseMinX = Infinity, baseMaxX = -Infinity, baseMinY = Infinity, baseMaxY = -Infinity;
    const stride = Math.max(3, Math.floor(mesh.triPos.length / 9000) * 3);
    for (let i = 0; i < mesh.triPos.length; i += stride) {
      const vx = mesh.triPos[i], vy = mesh.triPos[i + 1], vz = mesh.triPos[i + 2];
      const ndc = projectWorldToNdc([vx, minY, vz], mvp);
      const sx = (ndc[0] * 0.5 + 0.5) * rw;
      const sy = (0.5 - ndc[1] * 0.5) * rh;
      if (sx < allMinX) allMinX = sx;
      if (sx > allMaxX) allMaxX = sx;
      if (sy < allMinY) allMinY = sy;
      if (sy > allMaxY) allMaxY = sy;
      if (vy <= baseTol) {
        if (sx < baseMinX) baseMinX = sx;
        if (sx > baseMaxX) baseMaxX = sx;
        if (sy < baseMinY) baseMinY = sy;
        if (sy > baseMaxY) baseMaxY = sy;
      }
    }

    const drawSoftEllipse = (cx, cy, rx, ry, innerAlpha, midAlpha) => {
      if (!Number.isFinite(cx) || rx <= 2 || ry <= 2) return;
      cctx.save();
      cctx.translate(cx, cy);
      cctx.scale(rx, ry);
      const g = cctx.createRadialGradient(0, 0, 0.05, 0, 0, 1);
      const rgb = darkTheme ? '0,0,0' : '15,23,42';
      g.addColorStop(0, `rgba(${rgb},${innerAlpha})`);
      g.addColorStop(0.55, `rgba(${rgb},${midAlpha})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      cctx.fillStyle = g;
      cctx.beginPath();
      cctx.arc(0, 0, 1, 0, Math.PI * 2);
      cctx.fill();
      cctx.restore();
    };

    if (Number.isFinite(allMinX)) {
      const ambCx = (allMinX + allMaxX) * 0.5;
      const ambCy = (allMinY + allMaxY) * 0.5 + rh * 0.012;
      const ambRx = Math.max(rw * 0.08, (allMaxX - allMinX) * 0.56);
      const ambRy = Math.max(rh * 0.025, Math.min(rh * 0.14, (allMaxY - allMinY) * 0.54 + rh * 0.024));
      drawSoftEllipse(ambCx, ambCy, ambRx, ambRy, darkTheme ? 0.36 : 0.13, darkTheme ? 0.16 : 0.06);
    }
    if (Number.isFinite(baseMinX)) {
      const conCx = (baseMinX + baseMaxX) * 0.5;
      const conCy = (baseMinY + baseMaxY) * 0.5 + rh * 0.006;
      const conRx = Math.max(rw * 0.05, (baseMaxX - baseMinX) * 0.52);
      const conRy = Math.max(rh * 0.014, Math.min(rh * 0.08, (baseMaxY - baseMinY) * 0.48 + rh * 0.012));
      drawSoftEllipse(conCx, conCy, conRx, conRy, darkTheme ? 0.48 : 0.22, darkTheme ? 0.22 : 0.09);
    }

    cctx.imageSmoothingEnabled = true;
    cctx.imageSmoothingQuality = 'high';
    cctx.drawImage(snapshotCanvas, 0, 0, rw, rh);
  }

  const out = { url: comp.toDataURL('image/png'), mesh, mvp, w: rw, h: rh };
  if (coverHeroCache.size > 18) coverHeroCache.clear();
  coverHeroCache.set(cacheKey, out);
  return out;
}

function renderMinifigOneToOne(parts, pagePxH, pageHIn, maxPxW, maxPxH, accent = '#1a73e8') {
  const mesh = buildMeshBuffers([], parts, { highlightNew: false, fadePrev: false, showArrows: false, accent });
  const widthLdu = Math.max(16, mesh.bounds.maxX - mesh.bounds.minX);
  const heightLdu = Math.max(24, mesh.bounds.maxY - mesh.bounds.minY);
  const layout = computeMinifigOneToOneLayout({ widthLdu, heightLdu }, pagePxH, pageHIn, maxPxW, maxPxH);
  const aspect = layout.worldSpanW / Math.max(1, layout.worldSpanH);
  const rh = Math.max(160, Math.min(480, Math.round(layout.displayPxH * 2.5)));
  const rw = Math.max(96, Math.round(rh * aspect));
  snapshotEngine.draw(mesh, rw, rh, 0, 0, 1.0, layout.fixedHalfH);
  return { url: snapshotCanvas.toDataURL('image/png'), ...layout };
}

const minifigDiagramCache = new Map();
const minifigSeqPlanCache = new Map();

function clearMinifigDiagramCaches() {
  minifigDiagramCache.clear();
  minifigSeqPlanCache.clear();
}

function getMinifigSequentialPlanForStep(step) {
  const key = `${step.id}|${(step.parts || []).map(p => `${p.id}:${p.p}:${p.c}`).join(',')}`;
  if (minifigSeqPlanCache.has(key)) return minifigSeqPlanCache.get(key);
  const plan = buildMinifigSequentialPlan(step.parts || [], (pid) => resolvePart(pid).name, computeWorldBox);
  if (minifigSeqPlanCache.size > 48) minifigSeqPlanCache.clear();
  minifigSeqPlanCache.set(key, plan);
  return plan;
}

function projectWorldToCanvasPt(pt, mvp, offX, offY, w, h) {
  const ndc = projectWorldToNdc(pt, mvp);
  return [offX + (ndc[0] * 0.5 + 0.5) * w, offY + (0.5 - ndc[1] * 0.5) * h];
}

function drawMinifigRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawVectorArrow2D(ctx, x0, y0, x1, y1, opts = {}) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 6) return;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const color = opts.color || '#1f2937';
  const lineW = Math.max(1.6, opts.lineWidth || 2.4);
  const headLen = Math.min(len * 0.44, Math.max(7, opts.headLen || lineW * 4.2));
  const headHalfW = Math.max(3.6, opts.headHalfW || headLen * 0.46);
  const shaftEndX = x1 - ux * (headLen * 0.85);
  const shaftEndY = y1 - uy * (headLen * 0.85);
  const baseLeftX = x1 - ux * headLen + px * headHalfW;
  const baseLeftY = y1 - uy * headLen + py * headHalfW;
  const baseRightX = x1 - ux * headLen - px * headHalfW;
  const baseRightY = y1 - uy * headLen - py * headHalfW;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (opts.haloColor) {
    ctx.strokeStyle = opts.haloColor;
    ctx.lineWidth = lineW + (opts.haloWidth || 3.2);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(shaftEndX, shaftEndY);
    ctx.stroke();

    ctx.fillStyle = opts.haloColor;
    ctx.strokeStyle = opts.haloColor;
    ctx.lineWidth = opts.haloWidth || 2.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(baseLeftX, baseLeftY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(baseLeftX, baseLeftY);
  ctx.lineTo(baseRightX, baseRightY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFivePointStar2D(ctx, cx, cy, outerR, innerR, strokeColor, fillColor, lineWidth) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawMinifigCelebrationStarburst(ctx, cx, cy, radius, theme) {
  const bgHex = toHexColor(theme?.bgColor || '#ffffff', '#ffffff').toLowerCase();
  const darkBg = isDarkHexColor(bgHex);
  const pureWhiteBg = bgHex === '#ffffff' || bgHex === '#fefefe' || bgHex === '#fcfcfc' || bgHex === '#f9fafb';
  const cw = ctx.canvas.width || 320;
  const ch = ctx.canvas.height || 460;
  const maxFitR = Math.max(40, Math.min(radius, cw - cx - 6, cx - 6, cy - 6, ch - cy - 6));

  ctx.save();
  // Alternating luminous starburst rays radiating behind completed minifigure (official LEGO IMG_0315 Step 6!)
  const rayCount = 18;
  for (let i = 0; i < rayCount; i++) {
    const aMid = (i / rayCount) * Math.PI * 2;
    const halfSpread = ((Math.PI * 2) / rayCount) * (i % 2 === 0 ? 0.34 : 0.2);
    const rOuter = maxFitR * (i % 2 === 0 ? 1.0 : 0.8);
    const rInner = maxFitR * 0.14;
    const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    if (darkBg) {
      grad.addColorStop(0, 'rgba(255,255,255,0.22)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.09)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    } else if (pureWhiteBg) {
      grad.addColorStop(0, 'rgba(186,214,245,0.52)');
      grad.addColorStop(0.62, 'rgba(203,221,244,0.26)');
      grad.addColorStop(1, 'rgba(203,221,244,0)');
    } else {
      grad.addColorStop(0, 'rgba(255,255,255,0.72)');
      grad.addColorStop(0.62, 'rgba(255,255,255,0.34)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(aMid - halfSpread * 0.4) * rInner, cy + Math.sin(aMid - halfSpread * 0.4) * rInner);
    ctx.lineTo(cx + Math.cos(aMid - halfSpread) * rOuter, cy + Math.sin(aMid - halfSpread) * rOuter);
    ctx.lineTo(cx + Math.cos(aMid + halfSpread) * rOuter, cy + Math.sin(aMid + halfSpread) * rOuter);
    ctx.lineTo(cx + Math.cos(aMid + halfSpread * 0.4) * rInner, cy + Math.sin(aMid + halfSpread * 0.4) * rInner);
    ctx.closePath();
    ctx.fill();
  }

  // Three hollow 5-point outline stars floating around the completed minifigure (strictly inside stage bounds!)
  const starStroke = darkBg ? 'rgba(241,245,249,0.68)' : 'rgba(71,85,105,0.55)';
  const starFill = darkBg ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)';
  const lw = Math.max(1.3, maxFitR * 0.015);
  const starSpecs = [
    { dx: -0.14, dy: -0.80, r: 0.145 },
    { dx: 0.62, dy: -0.34, r: 0.165 },
    { dx: -0.62, dy: 0.54, r: 0.16 },
  ];
  for (const st of starSpecs) {
    const sr = Math.max(8, maxFitR * st.r);
    const sx = Math.max(sr + 6, Math.min(cw - sr - 6, cx + maxFitR * st.dx));
    const sy = Math.max(sr + 6, Math.min(ch - sr - 6, cy + radius * st.dy));
    drawFivePointStar2D(ctx, sx, sy, sr, sr * 0.43, starStroke, starFill, lw);
  }
  ctx.restore();
}

function drawProjectedMinifigArrows(ctx, arrows, mvp, offX, offY, w, h, colorMap, lineW, haloColor) {
  if (!mvp || !arrows || arrows.length === 0) return;
  for (const arr of arrows) {
    const p0 = projectWorldToCanvasPt(arr.from, mvp, offX, offY, w, h);
    const p1 = projectWorldToCanvasPt(arr.to, mvp, offX, offY, w, h);
    const col = colorMap[arr.color] || colorMap.blue || '#0088ce';
    drawVectorArrow2D(ctx, p0[0], p0[1], p1[0], p1[1], {
      color: col,
      lineWidth: lineW,
      headLen: Math.max(7, lineW * 4.0),
      headHalfW: Math.max(3.4, lineW * 1.8),
      haloColor,
      haloWidth: haloColor ? Math.max(2, lineW * 1.1) : 0,
    });
  }
}

/**
 * Option 1 (Official LEGO IMG_0316): Exploded Stack Callout
 * Left white vertical box with exploded body layers + red downward arrows,
 * black horizontal arrow -> completed standing minifigure + optional handheld accessory callout(s).
 */
function renderMinifigExplodedDiagram(step, cam, w, h, theme, zoom = 1.0) {
  const rw = Math.max(320, Math.round(w));
  const rh = Math.max(240, Math.round(h));
  const bgHex = toHexColor(theme?.bgColor || '#ffffff', '#ffffff');
  const darkBg = isDarkHexColor(bgHex);
  const cacheKey = `exp|${step.id}|${(step.parts || []).length}|${Math.round(cam.az)}|${Math.round(cam.el)}|${Math.round(zoom * 100)}|${rw}x${rh}|${darkBg ? 'd' : 'l'}`;
  if (minifigDiagramCache.has(cacheKey)) return minifigDiagramCache.get(cacheKey);

  const plan = buildMinifigExplodedPlan(step.parts || [], (pid) => resolvePart(pid).name, computeWorldBox);
  const comp = document.createElement('canvas');
  comp.width = rw;
  comp.height = rh;
  const ctx = comp.getContext('2d');
  if (!ctx) return { url: '', w: rw, h: rh, plan };

  const hasAcc = plan.accessoryCallouts.length > 0;
  const padX = Math.round(rw * 0.05);
  const padY = Math.round(rh * 0.06);

  // 1. Left white vertical exploded callout box (slender vertical proportions matching IMG_0316)
  const boxH = Math.round(rh - padY * 2);
  const boxW = Math.round(Math.min(rw * 0.34, Math.max(rw * 0.22, boxH * 0.42)));
  const boxX = Math.round(padX + Math.max(0, (rw * 0.4 - boxW) * 0.42));
  const boxY = padY;

  ctx.save();
  ctx.shadowColor = darkBg ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.12)';
  ctx.shadowBlur = Math.max(4, rh * 0.014);
  ctx.shadowOffsetY = Math.max(1, rh * 0.004);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.restore();

  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = Math.max(1.6, Math.min(2.6, rh * 0.0042));
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  // Render exploded body stack inside the white callout box
  const innerPadX = Math.round(boxW * 0.08);
  const innerPadY = Math.round(boxH * 0.045);
  const stackW = Math.max(48, boxW - innerPadX * 2);
  const stackH = Math.max(80, boxH - innerPadY * 2);
  const stackMesh = buildMeshBuffers([], plan.stackParts, {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    accent: theme?.accent || '#1a73e8',
    partOffsets: plan.stackOffsets,
  });
  const stackMvp = snapshotEngine.draw(stackMesh, stackW, stackH, cam.az, cam.el, Math.max(0.82, Math.min(1.18, zoom)), 0, {
    tightFit: true,
  });
  ctx.drawImage(snapshotCanvas, boxX + innerPadX, boxY + innerPadY, stackW, stackH);

  // Crisp crimson-red vertical downward arrows between exploded body layers
  const redLineW = Math.max(1.8, Math.min(3.2, rh * 0.0048));
  drawProjectedMinifigArrows(
    ctx,
    plan.stackArrows,
    stackMvp,
    boxX + innerPadX,
    boxY + innerPadY,
    stackW,
    stackH,
    { red: '#d92626', blue: '#0088ce', dark: '#1f2937' },
    redLineW,
    'rgba(255,255,255,0.82)',
  );

  // 2. Right region: Completed standing minifigure (with headroom above if accessories exist)
  const connGap = Math.round(Math.max(42, rw * 0.11));
  const figAreaX = boxX + boxW + connGap;
  const figAreaW = Math.max(96, rw - figAreaX - padX);
  const figTopOffset = hasAcc ? Math.round(rh * 0.28) : Math.round(rh * 0.16);
  const figAreaH = Math.max(110, rh - figTopOffset - padY);
  const figAreaY = figTopOffset;

  const figMesh = buildMeshBuffers([], plan.assembledParts, {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    accent: theme?.accent || '#1a73e8',
  });
  const figMvp = snapshotEngine.draw(figMesh, figAreaW, figAreaH, cam.az, cam.el, Math.max(0.75, Math.min(1.25, zoom)), 0, {
    tightFit: true,
  });
  ctx.drawImage(snapshotCanvas, figAreaX, figAreaY, figAreaW, figAreaH);

  // 3. Horizontal black connector arrow from lower-right edge of white callout box to the standing figure's legs
  const bodyBox = plan.decomposed.bodyBox;
  const legsTargetY = bodyBox.min[1] + (bodyBox.max[1] - bodyBox.min[1]) * 0.18;
  const figLeftLegPt = figMvp
    ? projectWorldToCanvasPt([bodyBox.min[0] - 3, legsTargetY, bodyBox.center[2]], figMvp, figAreaX, figAreaY, figAreaW, figAreaH)
    : [figAreaX + figAreaW * 0.3, boxY + boxH * 0.84];
  const arrowY = Math.max(boxY + boxH * 0.62, Math.min(boxY + boxH * 0.91, figLeftLegPt[1]));
  const arrowEndX = Math.max(boxX + boxW + 26, Math.min(figAreaX + figAreaW * 0.42, figLeftLegPt[0] - 8));
  drawVectorArrow2D(ctx, boxX + boxW + 1, arrowY, arrowEndX, arrowY, {
    color: darkBg ? '#f8fafc' : '#1f2937',
    lineWidth: Math.max(2.0, rh * 0.0046),
    headLen: Math.max(9, rh * 0.022),
    headHalfW: Math.max(4.5, rh * 0.0105),
    haloColor: darkBg ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.65)',
    haloWidth: 2.4,
  });

  // 4. Optional handheld accessory callout box(es) above the minifigure's hand(s) (matching IMG_0316 envelope box!)
  if (hasAcc && figMvp) {
    const shownAcc = plan.accessoryCallouts.slice(0, 2);
    const placedBoxes = [];
    for (let ai = 0; ai < shownAcc.length; ai++) {
      const acc = shownAcc[ai];
      const accCenterPt = projectWorldToCanvasPt(acc.box.center, figMvp, figAreaX, figAreaY, figAreaW, figAreaH);
      const accTopPt = projectWorldToCanvasPt(
        [acc.box.center[0], acc.box.max[1], acc.box.center[2]],
        figMvp,
        figAreaX,
        figAreaY,
        figAreaW,
        figAreaH,
      );

      const accBoxW = Math.round(Math.max(58, Math.min(rw * 0.16, rh * (acc.isMultiPart ? 0.18 : 0.21))));
      const accBoxH = Math.round(Math.max(46, Math.min(rh * (acc.isMultiPart ? 0.27 : 0.18), accTopPt[1] - padY - 26)));

      // Position cleanly above the accessory's X coordinate, avoiding the vertical stack box and other accessory boxes
      let ax = Math.round(accCenterPt[0] - accBoxW / 2);
      const minAx = boxX + boxW + 16;
      const maxAx = rw - padX - accBoxW;
      ax = Math.max(minAx, Math.min(maxAx, ax));
      for (const prevB of placedBoxes) {
        if (Math.abs(ax - prevB.x) < accBoxW + 10) {
          ax = Math.min(maxAx, prevB.x + prevB.w + 10);
        }
      }
      const ay = Math.round(Math.max(padY, Math.min(accTopPt[1] - accBoxH - 26, figAreaY - accBoxH * 0.35)));
      placedBoxes.push({ x: ax, y: ay, w: accBoxW, h: accBoxH });

      ctx.save();
      ctx.shadowColor = darkBg ? 'rgba(0,0,0,0.42)' : 'rgba(15,23,42,0.12)';
      ctx.shadowBlur = Math.max(3, rh * 0.01);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ax, ay, accBoxW, accBoxH);
      ctx.restore();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = Math.max(1.5, rh * 0.0036);
      ctx.strokeRect(ax + 0.5, ay + 0.5, accBoxW - 1, accBoxH - 1);

      const aPad = Math.max(5, Math.round(Math.min(accBoxW, accBoxH) * 0.12));
      const aInnerW = Math.max(28, accBoxW - aPad * 2);
      const aInnerH = Math.max(28, accBoxH - aPad * 2);
      const accMesh = buildMeshBuffers([], acc.parts, {
        highlightNew: false,
        fadePrev: false,
        showArrows: false,
        accent: theme?.accent || '#1a73e8',
        partOffsets: acc.isMultiPart ? acc.subassemblyOffsets : {},
      });
      const accMvp = snapshotEngine.draw(accMesh, aInnerW, aInnerH, cam.az, cam.el, 1.0, 0, { tightFit: true });
      ctx.drawImage(snapshotCanvas, ax + aPad, ay + aPad, aInnerW, aInnerH);

      if (acc.isMultiPart && acc.subassemblyArrows.length > 0) {
        drawProjectedMinifigArrows(
          ctx,
          acc.subassemblyArrows.map(a => ({ ...a, color: 'red' })),
          accMvp,
          ax + aPad,
          ay + aPad,
          aInnerW,
          aInnerH,
          { red: '#d92626', blue: '#0088ce', dark: '#1f2937' },
          Math.max(1.5, rh * 0.0036),
          'rgba(255,255,255,0.85)',
        );
      }

      // Crisp white-haloed downward pointer arrow straight to the accessory in the minifigure's hand
      const ptrStartX = Math.max(ax + 8, Math.min(ax + accBoxW - 8, accCenterPt[0]));
      const ptrStartY = ay + accBoxH + 1;
      const ptrEndX = accCenterPt[0];
      const ptrEndY = Math.max(ptrStartY + 14, accTopPt[1] - 3);
      drawVectorArrow2D(ctx, ptrStartX, ptrStartY, ptrEndX, ptrEndY, {
        color: darkBg ? '#f8fafc' : '#1f2937',
        lineWidth: Math.max(1.8, rh * 0.0038),
        headLen: Math.max(8, rh * 0.019),
        headHalfW: Math.max(4, rh * 0.009),
        haloColor: darkBg ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)',
        haloWidth: 2.8,
      });
    }
  }

  const out = { url: comp.toDataURL('image/png'), w: rw, h: rh, plan };
  if (minifigDiagramCache.size > 64) minifigDiagramCache.clear();
  minifigDiagramCache.set(cacheKey, out);
  return out;
}

/**
 * Option 2 (Official LEGO IMG_0315): Sequential Step-by-Step Minifigure Assembly
 * Renders one numbered sub-step (1, 2, 3...) at a shared foot baseline & physical scale,
 * with cyan-blue assembly arrows, warm peach multi-part accessory subassembly pill,
 * and final radial starburst + outline stars celebration!
 */
function renderMinifigSequentialStage(step, stage, plan, cam, w, h, theme, zoom = 1.0) {
  const rw = Math.max(200, Math.round(w));
  const rh = Math.max(240, Math.round(h));
  const bgHex = toHexColor(theme?.bgColor || '#ffffff', '#ffffff');
  const darkBg = isDarkHexColor(bgHex);
  const textColor = theme?.text || (darkBg ? '#f8fafc' : '#1f2937');
  const cacheKey = `seq|${step.id}|s${stage.stepNumber}|${(step.parts || []).length}|${Math.round(cam.az)}|${Math.round(cam.el)}|${Math.round(zoom * 100)}|${rw}x${rh}|${bgHex}|${textColor}`;
  if (minifigDiagramCache.has(cacheKey)) return minifigDiagramCache.get(cacheKey);

  const comp = document.createElement('canvas');
  comp.width = rw;
  comp.height = rh;
  const ctx = comp.getContext('2d');
  if (!ctx) return { url: '', w: rw, h: rh };

  const numColW = Math.round(rw * 0.14);
  const rightPad = Math.round(rw * 0.04);
  const topPad = Math.round(rh * 0.04);
  const botPad = Math.round(rh * 0.05);
  const figX = numColW;
  const figY = topPad;
  const figW = Math.max(96, rw - numColW - rightPad);
  const figH = Math.max(120, rh - topPad - botPad);

  const stageMesh = buildMeshBuffers(stage.baseParts, stage.addedParts, {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    accent: theme?.accent || '#1a73e8',
    partOffsets: stage.partOffsets || {},
  });
  const stageMvp = snapshotEngine.draw(
    stageMesh,
    figW,
    figH,
    cam.az,
    cam.el,
    Math.max(0.65, Math.min(1.6, zoom)),
    plan.sharedHalfH,
    { fixedCenter: plan.sharedCenter },
  );

  // 1. Celebratory starburst behind completed minifigure on the final sub-step (IMG_0315 Step 6!)
  if (stage.isCelebration && stageMvp) {
    const bodyBox = plan.decomposed.bodyBox;
    const centerPt = projectWorldToCanvasPt(bodyBox.center, stageMvp, figX, figY, figW, figH);
    const topPt = projectWorldToCanvasPt([bodyBox.center[0], bodyBox.max[1], bodyBox.center[2]], stageMvp, figX, figY, figW, figH);
    const botPt = projectWorldToCanvasPt([bodyBox.center[0], bodyBox.min[1], bodyBox.center[2]], stageMvp, figX, figY, figW, figH);
    const figVisualH = Math.max(80, Math.abs(botPt[1] - topPt[1]));
    drawMinifigCelebrationStarburst(ctx, centerPt[0], centerPt[1], figVisualH * 0.78, theme);
  }

  // 2. Composite crisp WebGL minifigure stage
  ctx.drawImage(snapshotCanvas, figX, figY, figW, figH);

  // 3. Crisp official LEGO cyan-blue assembly arrows
  const blueColor = darkBg ? '#38bdf8' : '#0088ce';
  const blueLineW = Math.max(2.0, Math.min(3.4, rh * 0.0056));
  drawProjectedMinifigArrows(
    ctx,
    stage.arrows,
    stageMvp,
    figX,
    figY,
    figW,
    figH,
    { blue: blueColor, red: '#d92626', dark: darkBg ? '#f8fafc' : '#1f2937' },
    blueLineW,
    darkBg ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.68)',
  );

  // 4. Multi-part accessory subassembly warm peach rounded pill box (IMG_0315 Step 5 lightsaber!)
  if (stage.accessoryPill && stageMvp) {
    const acc = stage.accessoryPill;
    const accTopPt = projectWorldToCanvasPt(
      [acc.box.center[0], acc.box.max[1], acc.box.center[2]],
      stageMvp,
      figX,
      figY,
      figW,
      figH,
    );
    const accSpanX = acc.box.max[0] - acc.box.min[0];
    const accSpanY = acc.box.max[1] - acc.box.min[1];
    const isTallAcc = accSpanY >= accSpanX * 0.8;

    const pillW = Math.round(
      isTallAcc
        ? Math.max(46, Math.min(rw * 0.25, rh * 0.145))
        : Math.max(72, Math.min(rw * 0.42, rh * 0.26)),
    );
    const maxAvailH = Math.max(72, accTopPt[1] - topPad - 28);
    const pillH = Math.round(
      isTallAcc
        ? Math.max(76, Math.min(maxAvailH, rh * 0.36))
        : Math.max(52, Math.min(maxAvailH, rh * 0.22)),
    );
    const pillX = Math.round(Math.max(numColW + 4, Math.min(rw - rightPad - pillW, accTopPt[0] - pillW / 2)));
    const pillY = Math.round(Math.max(topPad + 2, accTopPt[1] - pillH - 28));

    ctx.save();
    drawMinifigRoundedRect(ctx, pillX, pillY, pillW, pillH, Math.min(14, pillW * 0.28));
    ctx.fillStyle = '#fde4a6';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = Math.max(1.6, rh * 0.004);
    ctx.stroke();
    ctx.restore();

    const pPadX = Math.max(5, Math.round(pillW * 0.14));
    const pPadY = Math.max(6, Math.round(pillH * 0.08));
    const pInnerW = Math.max(24, pillW - pPadX * 2);
    const pInnerH = Math.max(36, pillH - pPadY * 2);
    const pillMesh = buildMeshBuffers([], acc.parts, {
      highlightNew: false,
      fadePrev: false,
      showArrows: false,
      accent: theme?.accent || '#1a73e8',
      partOffsets: acc.subassemblyOffsets || {},
    });
    const pillMvp = snapshotEngine.draw(pillMesh, pInnerW, pInnerH, cam.az, cam.el, 1.0, 0, { tightFit: true });
    ctx.drawImage(snapshotCanvas, pillX + pPadX, pillY + pPadY, pInnerW, pInnerH);

    // Blue downward arrow inside the warm peach pill (blade -> hilt)
    drawProjectedMinifigArrows(
      ctx,
      acc.subassemblyArrows,
      pillMvp,
      pillX + pPadX,
      pillY + pPadY,
      pInnerW,
      pInnerH,
      { blue: '#0088ce', red: '#d92626', dark: '#1f2937' },
      Math.max(1.8, rh * 0.0044),
      'rgba(253,228,166,0.8)',
    );

    // Crisp black downward arrow from peach pill straight down to the accessory in the minifigure's hand
    const ptrX = Math.max(pillX + 10, Math.min(pillX + pillW - 10, accTopPt[0]));
    const ptrY0 = pillY + pillH + 1;
    const ptrY1 = Math.max(ptrY0 + 14, accTopPt[1] - 4);
    drawVectorArrow2D(ctx, ptrX, ptrY0, accTopPt[0], ptrY1, {
      color: darkBg ? '#f8fafc' : '#1f2937',
      lineWidth: Math.max(1.9, rh * 0.0044),
      headLen: Math.max(9, rh * 0.022),
      headHalfW: Math.max(4.4, rh * 0.01),
      haloColor: darkBg ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.6)',
      haloWidth: 2.0,
    });
  }

  // 5. Crisp official LEGO sequential step number (1, 2, 3...) positioned to the left of the minifigure
  const bodyBox = plan.decomposed.bodyBox;
  const torsoLevelPt = stageMvp
    ? projectWorldToCanvasPt([bodyBox.min[0], bodyBox.min[1] + (bodyBox.max[1] - bodyBox.min[1]) * 0.56, bodyBox.center[2]], stageMvp, figX, figY, figW, figH)
    : [figX, figY + figH * 0.65];
  const fontSize = Math.round(Math.max(18, Math.min(34, rh * 0.072, rw * 0.11)));
  ctx.save();
  ctx.fillStyle = textColor;
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const numX = Math.max(4, Math.round(rw * 0.035));
  const numY = Math.max(fontSize, Math.min(rh - fontSize, Math.round(torsoLevelPt[1])));
  ctx.fillText(String(stage.stepNumber), numX, numY);
  ctx.restore();

  const out = { url: comp.toDataURL('image/png'), w: rw, h: rh };
  if (minifigDiagramCache.size > 96) minifigDiagramCache.clear();
  minifigDiagramCache.set(cacheKey, out);
  return out;
}

// =========================================================================
// 3. STUDIO .io PARSER WITH PRE-ASSEMBLED MINIFIGURE FUSION + ZERO-FLOATING STEP GENERATOR
// =========================================================================
function splitMpd(src, fallbackName) {
  const map = new Map();
  const lines = src.replace(/^\uFEFF/, '').split(/\r?\n/);
  let name = fallbackName, buf = [], sawFile = false;
  let dataName = null, dataChunks = [];
  const flushFile = () => { if (buf.length > 0 && name) map.set(name.toLowerCase(), { name, lines: buf }); };
  const flushData = () => {
    if (dataName && dataChunks.length > 0) {
      textureStore.registerBase64Texture(dataChunks.join(''), { name: dataName, source: 'embedded' });
    }
    dataName = null;
    dataChunks = [];
  };
  for (const raw of lines) {
    const l = raw.trim(); if (!l) continue;
    const mFile = l.match(/^0\s+FILE\s+(.+)$/i);
    if (mFile) {
      flushData();
      if (sawFile || buf.length > 0) flushFile();
      sawFile = true;
      name = mFile[1].trim();
      buf = [];
      continue;
    }
    const mData = l.match(/^0\s+!DATA\s+(.+)$/i);
    if (mData) {
      flushData();
      if (sawFile || buf.length > 0) flushFile();
      sawFile = true;
      name = null;
      buf = [];
      dataName = mData[1].trim();
      dataChunks = [];
      continue;
    }
    if (/^0\s+NOFILE\b/i.test(l)) { flushData(); flushFile(); name = null; buf = []; continue; }
    if (dataName) {
      const mChunk = l.match(/^0\s+!:\s*(.+)$/);
      if (mChunk) dataChunks.push(mChunk[1].trim());
      continue;
    }
    if (!name) name = fallbackName;
    buf.push(l);
  }
  flushData();
  flushFile();
  return map;
}

function registerEmbeddedDatEntry(sf, source = 'embedded') {
  const nk = normId(sf.name);
  const title = getSubfileTitle(sf);
  embeddedDatRaw.set(nk, sf.lines);
  embeddedDatTitles.set(nk, title);
  textureStore.scanDatLinesForTextures(sf.lines, source);
  // Also alias BrickLink Studio `0 BL_Item_No <id>` so model.ldr refs like `3626pb3988` resolve directly to `bl_3626pb3988`
  for (let i = 0; i < Math.min(sf.lines.length, 16); i++) {
    const mBl = sf.lines[i].match(/^0\s+BL_Item_No\s+(\S+)/i);
    if (mBl && mBl[1] && mBl[1] !== '-1') {
      const alias = normId(mBl[1]);
      if (alias && alias !== nk && !embeddedDatRaw.has(alias)) {
        embeddedDatRaw.set(alias, sf.lines);
        embeddedDatTitles.set(alias, title);
      }
      break;
    }
  }
}

function cleanSubName(raw) {
  return String(raw || 'Main Build').replace(/\.(ldr|mpd|io)$/i,'').replace(/\s+copy(\s*\d+)?$/i,'').trim() || 'Main Build';
}

function isAssemblySubfile(sf) {
  if (!sf) return false;
  if (sf.lines.some(l => /^0\s+IsAssembly\s+True/i.test(l))) return true;
  if (sf.lines.some(l => /^0\s+FlexibleBrick:/i.test(l))) return true;
  const nk = normId(sf.name);
  if (/^(bl_)?(973|76382|3815|970|970c|3815c)[a-z0-9_]*c\d+/i.test(nk)) return true;
  return false;
}

function getSubfileTitle(sf) {
  const tLine = sf.lines.find(l => l.startsWith('0 ') && !/^0\s+(FILE|Name:|Author:|IsSubModel|BL_|Flexible|Render|IsAssembly|!|BFC|PE_TEX_)/i.test(l));
  return tLine ? tLine.replace(/^0\s+/, '').trim() : cleanSubName(sf.name);
}

async function readZipEntryBytes(bytes, view, entry) {
  if (entry.flags & 1) throw new Error('This .io file uses legacy Studio encryption. Re-save in Studio 2.x or export as .ldr.');
  const lOff = entry.localOffset;
  const dataStart = lOff + 30 + view.getUint16(lOff + 26, true) + view.getUint16(lOff + 28, true);
  const compBytes = bytes.subarray(dataStart, dataStart + entry.compSize);
  if (entry.method === 0) return compBytes;
  if (entry.method === 8) {
    const stream = new Blob([compBytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  throw new Error(`Unsupported ZIP method (${entry.method}).`);
}

async function readZipEntryText(bytes, view, entry) {
  const u8 = await readZipEntryBytes(bytes, view, entry);
  return new TextDecoder().decode(u8);
}

function bytesToBase64(u8) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function extractIoArchive(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid BrickLink Studio (.io) archive.');
  const cdCount = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const entries = [];
  for (let i = 0; i < cdCount; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const flags = view.getUint16(ptr + 8, true);
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    entries.push({ name, flags, method, compSize, localOffset });
    ptr += 46 + nameLen + extraLen + commentLen;
  }

  const pick = (target) => entries.find(e => e.name.toLowerCase().split('/').pop() === target);
  const m1Entry = pick('model.ldr') || pick('modelv2.ldr') || entries.find(e => /\.(ldr|mpd)$/i.test(e.name));
  const m2Entry = pick('model2.ldr');
  if (!m1Entry && !m2Entry) throw new Error('Could not find model.ldr inside this .io file.');

  const m1Text = m1Entry ? await readZipEntryText(bytes, view, m1Entry) : '';
  const m2Text = m2Entry ? await readZipEntryText(bytes, view, m2Entry) : '';

  embeddedDatRaw.clear(); embeddedDatTitles.clear(); embeddedDatCompiled.clear(); compositePartDefs.clear(); pliThumbCache.clear(); submodelThumbCache.clear(); clearMinifigDiagramCaches();
  textureStore.clearEmbedded();

  // Extract any embedded texture PNGs bundled directly in the .io archive (skipping thumbnail.png)
  for (const ent of entries) {
    const lowerName = ent.name.toLowerCase();
    const baseName = lowerName.split('/').pop() || '';
    if (!/\.(png|jpg|jpeg|webp)$/i.test(baseName) || baseName === 'thumbnail.png' || (ent.flags & 1)) continue;
    try {
      const u8 = await readZipEntryBytes(bytes, view, ent);
      if (u8.length > 24) {
        textureStore.registerBase64Texture(bytesToBase64(u8), { name: ent.name, source: 'embedded' });
      }
    } catch (_) {}
  }

  if (m2Text) {
    const m2Map = splitMpd(m2Text, 'model2.ldr');
    for (const sf of m2Map.values()) {
      const isPart = sf.name.toLowerCase().endsWith('.dat') || sf.lines.some(l => /^0\s+IsSubModel\s+False/i.test(l));
      if (isPart) {
        registerEmbeddedDatEntry(sf, 'embedded');
      }
    }
  }
  await textureStore.predecodeAllPending();
  return { m1Text, m2Text };
}

function flattenMpd(source, fileName, useIsSubModelFlag = false) {
  const subfiles = splitMpd(source, fileName);
  const root = subfiles.values().next().value;
  if (!root) return { parts: [], hasSteps: false, submodelCount: 0 };
  const parts = [];
  let hasSteps = false, submodelCount = 0, seq = 0, asmSeq = 0, subInstSeq = 0;

  const visit = (sf, px, py, pz, pm, parentCol, topSub, depth, assemblyTag, subChain) => {
    if (!sf || depth > 18) return;
    let stepIdx = 0;
    for (const line of sf.lines) {
      if (/^0\s+STEP\b/i.test(line)) { stepIdx++; hasSteps = true; continue; }
      if (!line.startsWith('1 ') && !line.startsWith('11 ')) continue;
      const t = line.split(/\s+/);
      if (t.length < 15) continue;
      let c = parseInt(t[1], 10);
      if (c === 16 || c < 0 || !isFinite(c)) c = parentCol;
      const lx=+t[2], ly=+t[3], lz=+t[4];
      const lm=[+t[5],+t[6],+t[7], +t[8],+t[9],+t[10], +t[11],+t[12],+t[13]];
      if ([lx,ly,lz,...lm].some(n => !isFinite(n))) continue;
      const r = m3v(pm, lx, ly, lz);
      const wx = px+r[0], wy = py+r[1], wz = pz+r[2];
      const wm = mat3Mul(pm, lm);
      const ref = t.slice(14).join(' ').trim();
      const child = subfiles.get(ref.toLowerCase());

      // Detect pre-assembled LEGO assemblies (Minifig Torso+Arms+Hands, Hips+Legs) -> tag all children with same assemblyTag!
      const childIsAsm = !assemblyTag && child && isAssemblySubfile(child);
      const childLooksLikePart = child && (
        child.name.toLowerCase().endsWith('.dat') ||
        child.lines.some(l => /^[234]\s+/.test(l) || /^0\s+(?:PE_TEX_INFO|PE_TEX_PATH|!TEXMAP|!LDRAW_ORG)\b/i.test(l))
      );
      const isChildSub = useIsSubModelFlag
        ? (child && child.lines.some(l => /^0\s+IsSubModel\s+True/i.test(l)))
        : (child && (childIsAsm || !childLooksLikePart));

      if (isChildSub && child !== sf) {
        if (depth === 0 && !childIsAsm) submodelCount++;
        const nextAsm = childIsAsm
          ? { id: 'asm_' + (++asmSeq), key: normId(child.name.replace(/\s+copy(\s*\d+)?$/i,'')), name: getSubfileTitle(child), rootPos: [wx, -wy, -wz] }
          : assemblyTag;
        const cleanName = cleanSubName(child.name);
        const nextChain = childIsAsm ? subChain : [...subChain, { name: cleanName, instId: ++subInstSeq }];
        visit(child, wx, wy, wz, wm, c, topSub || (childIsAsm ? null : cleanName), depth + 1, nextAsm, nextChain);
      } else {
        parts.push({
          id: 'imp_' + (++seq),
          p: normId(ref),
          c,
          x: wx, y: -wy, z: -wz,
          m: [wm[0],-wm[1],-wm[2], -wm[3],wm[4],wm[5], -wm[6],wm[7],wm[8]],
          sub: topSub || 'Main Build',
          subChain,
          origStep: stepIdx,
          asm: assemblyTag || null,
        });
      }
    }
  };
  visit(root, 0, 0, 0, R_ID, 71, null, 0, null, []);
  return { parts, hasSteps, submodelCount };
}

// Fuse tagged pre-assembled minifigure parts (Torso+Arms+Hands -> 1 piece, Hips+Legs -> 1 piece)!
function fuseAssemblies(rawParts) {
  const out = [];
  const asmMap = new Map();
  for (const p of rawParts) {
    if (p.asm) {
      let group = asmMap.get(p.asm.id);
      if (!group) {
        const compKey = 'asm_' + p.asm.key + '_' + p.c;
        compositePartDefs.set(compKey, { name: p.asm.name });
        group = {
          id: p.asm.id,
          p: compKey,
          c: p.c,
          x: p.asm.rootPos[0], y: p.asm.rootPos[1], z: p.asm.rootPos[2],
          m: R_ID,
          sub: p.sub,
          subChain: p.subChain || [],
          origStep: p.origStep,
          children: [],
        };
        asmMap.set(p.asm.id, group);
        out.push(group);
      }
      group.children.push(p);
    } else {
      out.push(p);
    }
  }
  // Center composite root coordinates on average of children for clean thumbnails & arrows
  for (const g of asmMap.values()) {
    let sx=0, sy=0, sz=0;
    for (const c of g.children) { sx += c.x; sy += c.y; sz += c.z; }
    g.x = sx / g.children.length; g.y = sy / g.children.length; g.z = sz / g.children.length;
  }
  return out;
}

function parseImportedModel(m1Text, m2Text, fileName) {
  if (m1Text) {
    const m1Map = splitMpd(m1Text, fileName);
    for (const sf of m1Map.values()) {
      const isEmbeddedPart =
        sf.name.toLowerCase().endsWith('.dat') ||
        sf.lines.some(l => /^[234]\s+/.test(l) || /^0\s+(?:PE_TEX_INFO|PE_TEX_PATH|!TEXMAP|!LDRAW_ORG)\b/i.test(l));
      if (isEmbeddedPart) {
        const nk = normId(sf.name);
        if (!embeddedDatRaw.has(nk)) {
          registerEmbeddedDatEntry(sf, 'embedded');
        } else {
          textureStore.scanDatLinesForTextures(sf.lines, 'embedded');
        }
      }
    }
  }
  const f1 = m1Text ? flattenMpd(m1Text, fileName, false) : { parts:[], hasSteps:false, submodelCount:0 };
  const f2 = m2Text ? flattenMpd(m2Text, fileName, true) : { parts:[], hasSteps:false, submodelCount:0 };
  let rawParts;
  if (f2.parts.length > 0 && f2.parts.length === f1.parts.length) {
    // 1-to-1 pair: exact .dat meshes & IsAssembly tags from model2.ldr + exact standard LDraw colors from model.ldr!
    rawParts = f2.parts.map((p2, idx) => ({ ...p2, c: f1.parts[idx].c, origStep: f1.parts[idx].origStep }));
  } else if (f1.parts.length > 0) {
    rawParts = f1.parts;
  } else {
    rawParts = f2.parts;
  }
  if (rawParts.length === 0) throw new Error('No LEGO brick placements found inside this file.');
  const parts = fuseAssemblies(rawParts);
  return {
    title: cleanSubName(fileName),
    parts,
    hasSteps: f1.hasSteps || f2.hasSteps,
    submodelCount: Math.max(f1.submodelCount, f2.submodelCount),
  };
}

function computeLeafWorldBox(part) {
  const compiled = compileEmbeddedDat(part.p);
  let lMin, lMax;
  if (compiled) { lMin = compiled.min; lMax = compiled.max; }
  else {
    const def = resolvePart(part.p);
    const hx = (def.sx*20)/2, hz = (def.sz*20)/2;
    if (def.shape === 'mf_torso_body') {
      lMin = [-19, -32, -10];
      lMax = [19, 11.2, 10];
    } else if (def.shape === 'mf_torso') {
      const sh = isBrickLinkTorsoAssemblyId(normId(part.p)) ? [-20, 32, -10] : [0, 0, 0];
      lMin = [sh[0] - 27, sh[1] - 32, sh[2] - 10];
      lMax = [sh[0] + 27, sh[1] + 11.2, sh[2] + 19];
    } else if (def.shape === 'mf_head') {
      lMin = [-12.6, -24, -12.6];
      lMax = [12.6, 4.2, 12.6];
    } else {
      lMin = [-hx, -def.h, -hz]; lMax = [hx, def.studs ? 4 : 0, hz];
    }
  }
  let mn=[Infinity,Infinity,Infinity], mx=[-Infinity,-Infinity,-Infinity];
  for (const x of [lMin[0],lMax[0]]) for (const y of [lMin[1],lMax[1]]) for (const z of [lMin[2],lMax[2]]) {
    const w = xformPt([x,y,z], part.m || R_ID, part.x, part.y, part.z, 0);
    if(w[0]<mn[0])mn[0]=w[0]; if(w[1]<mn[1])mn[1]=w[1]; if(w[2]<mn[2])mn[2]=w[2];
    if(w[0]>mx[0])mx[0]=w[0]; if(w[1]>mx[1])mx[1]=w[1]; if(w[2]>mx[2])mx[2]=w[2];
  }
  return { min: mn, max: mx, center: [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2] };
}

function computeWorldBox(part) {
  if (part.children && part.children.length > 0) {
    let mn=[Infinity,Infinity,Infinity], mx=[-Infinity,-Infinity,-Infinity];
    for (const ch of part.children) {
      const b = computeLeafWorldBox(ch);
      for (let k=0;k<3;k++) { if(b.min[k]<mn[k])mn[k]=b.min[k]; if(b.max[k]>mx[k])mx[k]=b.max[k]; }
    }
    return { min: mn, max: mx, center: [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2] };
  }
  return computeLeafWorldBox(part);
}

// Identify wheels, wheel holders, axles, and loose accessories so Step 1 NEVER starts on a floating wheel!
function classifyPartRole(part) {
  const k = normId(part.p);
  const name = (resolvePart(part.p).name || '').toLowerCase();
  if (/^(?:bl_)?(?:38339|2878|4025|4092|65632|28740|bb892|88011|88002)(?:c\d+)?[a-z]?$/.test(k) ||
      /wheel\s*holder|bogie\s*(?:plate|holder)|train\s*motor/i.test(name)) {
    return 'wheel_holder';
  }
  if (/^(?:bl_)?(?:38340|55423|57878|50254|2928|4180|7049|73983|85489|65734|65735|64711)(?:c\d+)?[a-z]?$/.test(k) ||
      (/\b(wheel|tire|tyre|rim)\b/.test(name) && !/holder|bogie|motor|plate|brick|arch|fender|mudguard|steering|ship|cog|gear|pulley|knob\s+wheel|belt\s+wheel/.test(name))) {
    return 'wheel';
  }
  if (/^(?:bl_)?(?:32062|4519|3705|32073|3706|44294|3707|60485|3737|23948|3708|50451|50450|6587|24316|87083|15462|32209|55013)[a-z]?$/.test(k) ||
      (/\baxle\b/.test(name) && !/hole|brick|plate|wheel|connector|hub|frame|beam|liftarm|bush|gear|cam|holder|steering/.test(name))) {
    return 'axle';
  }
  if (classifyMinifigGroupKind(part, (pid) => resolvePart(pid).name) !== null) return 'figure';
  if (/plate|brick|tile|frame|base|beam|liftarm|chassis|slope|panel|bracket|hinge|turntable/.test(name)) return 'structural';
  return 'detail';
}

// Detect smooth finish tiles & sideways (SNOT) decorative cladding that should NOT
// stick out/hang in mid-air before the structural walls & supports behind their full height are built.
function isSidewaysCladdingPart(part, box) {
  if (!part || part.children) return false;
  const m = part.m || R_ID;
  const isSideways = Math.abs(m[4]) < 0.5; // local +Y stud axis rotated sideways (SNOT)
  const def = resolvePart(part.p);
  const name = (def.name || '').toLowerCase();
  const isSmoothTile = /\btile\b/.test(name) && !/clip|hinge|bar|holder|handle|modified|turntable/.test(name);
  const isFinishCladding = isSmoothTile || (def.studs === false && !/wheel|tire|tyre|rim|axle|pin|bar|rod|technic|bracket|hinge|clip|holder|window|door|seat|chair|steering/.test(name));
  const dy = box ? (box.max[1] - box.min[1]) : 0;
  return (isSideways && isFinishCladding) || (isSmoothTile && dy > 20);
}

// Effective build-layer height for bottom-up ordering:
// Upright bricks build from their bottom (min.y); sideways/vertical cladding tiles wait for their TOP (max.y)
// so walls and upper SNOT anchors behind them are solidly in place first.
function computeBuildLayerY(part, box) {
  if (isSidewaysCladdingPart(part, box)) return box.max[1] + 8;
  const def = resolvePart(part.p);
  const name = (def.name || '').toLowerCase();
  const isSmoothTile = /\btile\b/.test(name) && !/clip|hinge|bar|holder|handle|modified|turntable/.test(name);
  return isSmoothTile ? box.min[1] + 6 : box.min[1];
}

// Returns true when a tall vertical/sideways cladding tile still has unplaced non-cladding wall/SNOT
// supports along its upper half (prevents sticking a tall tile straight up into empty air).
function isCladdingWaitingForUpperSupport(idx, claddingFlags, boxes, adj, placed) {
  if (!claddingFlags[idx]) return false;
  const b = boxes[idx];
  if (b.max[1] - b.min[1] <= 24) return false;
  const upperNbs = adj[idx].filter(nb => boxes[nb].max[1] >= b.center[1] && !claddingFlags[nb]);
  if (upperNbs.length === 0) return false;
  return !upperNbs.some(nb => placed.has(nb));
}

// True ONLY if a part has genuine sideways connection capability (SNOT orientation, side studs,
// brackets, clips, hinges, Technic pins/holes, bars, axles, window frames/glass, etc.).
// Two plain upright bricks/plates/slopes/tiles grazing side-by-side do NOT physically stick together!
function canConnectSideways(part, role) {
  if (!part) return true;
  if (role === 'wheel' || role === 'axle' || role === 'figure') return true;
  const m = part.m || R_ID;
  if (Math.abs(m[4]) < 0.5) return true; // SNOT / sideways-mounted part
  const k = normId(part.p);
  const def = resolvePart(part.p);
  const name = (def.name || '').toLowerCase();
  if (def.shape === 'snot1' || def.shape === 'snot4' || def.shape === 'clip_h' || def.shape === 'clip_v' || def.shape === 'bar') return true;
  if (/snot|bracket|clip|hinge|bar|axle|pin|technic|liftarm|beam|turntable|handle|hook|grab|magnet|coupler|buffer|ball|socket|window|glass|door|fence|rail|ladder|hose|antenna|lever/.test(name)) return true;
  if (/^(3937|3938|44302|63868|37494|92582|2429|2430|3700|3701|3702|3894|32000|32018|6541|4070|87087|4733|47905|22885|99206|99207|99780|99781|44728|60475|15712|60470|6019|4085|36840|36841|29085|bb892)/.test(k)) return true;
  return false;
}

// Strict LEGO clutch contact check:
// - Train wheels attach ONLY to wheel holders or Technic axles.
// - Upright bricks/plates/slopes/tiles connect via vertical stud footprint overlap (ovX >= 3 && ovZ >= 3),
//   NOT by grazing smooth vertical side walls (which caused floating inverted slopes & train-body bleed into bogies!).
// - Sideways contacts require either 3-axis interlocking (SNOT studs/pins/clips engaged >= 1.5 LDU)
//   or BOTH parts having sideways/SNOT/clip/hinge/window connection capability.
function boxesPhysicallyTouch(a, b, roleA, roleB, sideCapA = true, sideCapB = true) {
  const isWheelPair = (roleA === 'wheel' || roleB === 'wheel');
  const otherIsHolder = (roleA === 'wheel_holder' || roleB === 'wheel_holder' || roleA === 'axle' || roleB === 'axle');
  if (isWheelPair && otherIsHolder) {
    // Wheel clips into wheel holder pin slots or mounts onto a Technic axle (up to 6 LDU clearance along axle)
    const gx = Math.max(0, a.min[0]-b.max[0], b.min[0]-a.max[0]);
    const gy = Math.max(0, a.min[1]-b.max[1], b.min[1]-a.max[1]);
    const gz = Math.max(0, a.min[2]-b.max[2], b.min[2]-a.max[2]);
    return Math.max(gx, gy, gz) <= 6.0;
  }
  if (isWheelPair && !otherIsHolder) return false; // Train wheels attach ONLY via their wheel holder / axle!
  const tol = 2.8;
  const gx = Math.max(0, a.min[0]-b.max[0], b.min[0]-a.max[0]);
  const gy = Math.max(0, a.min[1]-b.max[1], b.min[1]-a.max[1]);
  const gz = Math.max(0, a.min[2]-b.max[2], b.min[2]-a.max[2]);
  if (gx > tol || gy > tol || gz > tol) return false;

  const ovX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
  const ovY = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
  const ovZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);

  // 1. Vertical stud/tube stacking contact (overlapping horizontal footprint)
  if (ovX >= 3.0 && ovZ >= 3.0) return true;

  // 2. Sideways / SNOT / clip / hinge / Technic pin contact
  const goodAxes = (ovX >= 1.5 ? 1 : 0) + (ovY >= 1.5 ? 1 : 0) + (ovZ >= 1.5 ? 1 : 0);
  if (goodAxes < 2) return false;
  // Require real 3-axis interlocking (e.g., SNOT studs/pins engaged >= 1.5 LDU) OR both parts sideways-capable!
  if (ovX >= 1.5 && ovY >= 1.5 && ovZ >= 1.5) return true;
  return Boolean(sideCapA && sideCapB);
}

function mat3Transpose(m) {
  return [m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8]];
}
function mat3Det(m) {
  return m[0]*(m[4]*m[8]-m[5]*m[7]) - m[1]*(m[3]*m[8]-m[5]*m[6]) + m[2]*(m[3]*m[7]-m[4]*m[6]);
}

// Normalize a single canonical copy of a submodel to centered local coordinates (bottom at y=0)
function normalizeCanonicalSubParts(rawList, prefix) {
  let mnX = Infinity, mnY = Infinity, mnZ = Infinity, mxX = -Infinity, mxZ = -Infinity;
  for (const p of rawList) {
    const b = computeWorldBox(p);
    if (b.min[0] < mnX) mnX = b.min[0]; if (b.max[0] > mxX) mxX = b.max[0];
    if (b.min[1] < mnY) mnY = b.min[1];
    if (b.min[2] < mnZ) mnZ = b.min[2]; if (b.max[2] > mxZ) mxZ = b.max[2];
  }
  const cx = isFinite(mnX) ? (mnX + mxX) / 2 : 0;
  const cy = isFinite(mnY) ? mnY : 0;
  const cz = isFinite(mnZ) ? (mnZ + mxZ) / 2 : 0;
  return rawList.map((p, idx) => ({
    ...p,
    id: `${prefix}_c${idx}`,
    x: p.x - cx,
    y: p.y - cy,
    z: p.z - cz,
    children: p.children ? p.children.map((ch, ci) => ({
      ...ch,
      id: `${prefix}_c${idx}_${ci}`,
      x: ch.x - cx,
      y: ch.y - cy,
      z: ch.z - cz,
    })) : undefined,
  }));
}

function autoNameDuplicateSubmodel(indices, parts, fallbackNum) {
  const names = indices.map(i => (resolvePart(parts[i].p).name || '').toLowerCase());
  if (names.some(n => /wheel|bogie/.test(n))) return 'Wheel Assembly';
  if (names.some(n => /window|glass|windscreen/.test(n))) return 'Window Module';
  if (names.some(n => /door/.test(n))) return 'Door Assembly';
  if (names.some(n => /seat|chair/.test(n))) return 'Seat Assembly';
  if (names.some(n => /bracket|hinge|clip/.test(n))) return 'Side Assembly';
  if (names.some(n => /slope|wedge|arch/.test(n))) return 'Body Module';
  return `Submodel ${fallbackNum}`;
}

// Detect duplicate submodels AUTOMATICALLY:
// Stage 1: Explicit file submodels (.io / .mpd) appearing >= 2 times
// Stage 2: Submodel-agnostic geometric rigid-body duplicate detection on remaining bricks!
function detectDuplicateSubassemblies(parts, boxes, adj, roles) {
  if (!state.detectDuplicates || parts.length < 6) return [];
  const maxSubSize = Math.min(36, Math.max(8, Math.floor(parts.length * 0.28)));
  const candidates = [];

  // Stage 1: Explicit submodel instances from .io / .mpd files
  const byInst = new Map();
  for (let i = 0; i < parts.length; i++) {
    const chain = parts[i].subChain || [];
    for (const entry of chain) {
      if (!byInst.has(entry.instId)) byInst.set(entry.instId, { name: entry.name, indices: [] });
      byInst.get(entry.instId).indices.push(i);
    }
  }
  const byExplicitSig = new Map();
  for (const rec of byInst.values()) {
    if (rec.indices.length < 2 || rec.indices.length > maxSubSize) continue;
    if (rec.indices.every(i => roles[i] === 'figure')) continue;
    const sig = rec.indices.map(i => `${parts[i].p}:${parts[i].c}`).sort().join('|');
    if (!byExplicitSig.has(sig)) byExplicitSig.set(sig, []);
    byExplicitSig.get(sig).push(rec);
  }
  for (const instList of byExplicitSig.values()) {
    const disjoint = [];
    const seen = new Set();
    for (const rec of instList) {
      if (rec.indices.some(i => seen.has(i))) continue;
      rec.indices.forEach(i => seen.add(i));
      disjoint.push(rec.indices);
    }
    if (disjoint.length >= 2) {
      const sz = disjoint[0].length;
      const cleanName = (instList[0].name || 'Submodel').replace(/\s+copy(\s*\d+)?$/i, '').trim() || 'Submodel';
      candidates.push({
        name: cleanName,
        explicit: true,
        size: sz,
        count: disjoint.length,
        savings: (disjoint.length - 1) * sz + 20,
        instances: disjoint,
      });
    }
  }

  // Stage 2: Automatic geometric rigid-body duplicate detection (works even on flat .ldr files with ZERO submodels!)
  const byPC = new Map();
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].children || roles[i] === 'figure') continue;
    const k = `${parts[i].p}:${parts[i].c}`;
    if (!byPC.has(k)) byPC.set(k, []);
    byPC.get(k).push(i);
  }

  const triedGeoSigs = new Set();
  for (const idxs of byPC.values()) {
    if (idxs.length < 2 || idxs.length > 18) continue;
    const seedA = idxs[0];
    const mAT = mat3Transpose(parts[seedA].m || R_ID);
    const maxPairs = Math.min(idxs.length, 8);
    for (let bi = 1; bi < maxPairs; bi++) {
      const seedB = idxs[bi];
      const T = mat3Mul(parts[seedB].m || R_ID, mAT);
      if (Math.abs(mat3Det(T) - 1) > 0.08) continue;
      const rA = m3v(T, parts[seedA].x, parts[seedA].y, parts[seedA].z);
      const tx = parts[seedB].x - rA[0], ty = parts[seedB].y - rA[1], tz = parts[seedB].z - rA[2];
      if (Math.hypot(tx, ty, tz) < 5) continue;

      const setA = new Set([seedA]), setB = new Set([seedB]);
      const q = [seedA];
      while (q.length && setA.size < maxSubSize) {
        const u = q.shift();
        for (const nb of adj[u]) {
          if (setA.has(nb) || setB.has(nb) || parts[nb].children || roles[nb] === 'figure') continue;
          const pNb = parts[nb];
          const ru = m3v(T, pNb.x, pNb.y, pNb.z);
          const ex = ru[0] + tx, ey = ru[1] + ty, ez = ru[2] + tz;
          const pool = byPC.get(`${pNb.p}:${pNb.c}`);
          if (!pool) continue;
          let match = -1, bestD = 3.2;
          for (const cand of pool) {
            if (setA.has(cand) || setB.has(cand)) continue;
            const d = Math.hypot(parts[cand].x - ex, parts[cand].y - ey, parts[cand].z - ez);
            if (d < bestD) { bestD = d; match = cand; }
          }
          if (match >= 0) { setA.add(nb); setB.add(match); q.push(nb); }
        }
      }

      if (setA.size >= 3) {
        const arrA = Array.from(setA).sort((a, b) => a - b);
        const geoSig = arrA.join(',');
        if (triedGeoSigs.has(geoSig)) continue;
        triedGeoSigs.add(geoSig);

        const instances = [arrA];
        const used = new Set(arrA);
        for (const candSeed of idxs) {
          if (used.has(candSeed)) continue;
          const Tc = mat3Mul(parts[candSeed].m || R_ID, mAT);
          if (Math.abs(mat3Det(Tc) - 1) > 0.08) continue;
          const rc = m3v(Tc, parts[seedA].x, parts[seedA].y, parts[seedA].z);
          const tcx = parts[candSeed].x - rc[0], tcy = parts[candSeed].y - rc[1], tcz = parts[candSeed].z - rc[2];
          const matched = [], localUsed = new Set();
          let ok = true;
          for (const u of arrA) {
            const pu = parts[u];
            const ru = m3v(Tc, pu.x, pu.y, pu.z);
            const ex = ru[0] + tcx, ey = ru[1] + tcy, ez = ru[2] + tcz;
            const pool = byPC.get(`${pu.p}:${pu.c}`);
            let best = -1, bestD = 3.2;
            for (const v of pool) {
              if (used.has(v) || localUsed.has(v)) continue;
              const d = Math.hypot(parts[v].x - ex, parts[v].y - ey, parts[v].z - ez);
              if (d < bestD) { bestD = d; best = v; }
            }
            if (best < 0) { ok = false; break; }
            matched.push(best); localUsed.add(best);
          }
          if (ok) {
            instances.push(matched);
            matched.forEach(v => used.add(v));
          }
        }
        if (instances.length >= 2) {
          // Reject hollow/carved-out Stage 2 geometric submodels that sandwich external parts
          // vertically between lower and upper bricks of the submodel (physically impossible to assemble!).
          let sandwichesExternal = false;
          for (const inst of instances) {
            const instSet = new Set(inst);
            for (let u = 0; u < parts.length; u++) {
              if (instSet.has(u) || roles[u] === 'wheel' || roles[u] === 'figure') continue;
              const bu = boxes[u];
              let hasAbove = false, hasBelow = false;
              for (const pi of inst) {
                const bi = boxes[pi];
                const ovX = Math.min(bu.max[0], bi.max[0]) - Math.max(bu.min[0], bi.min[0]);
                const ovZ = Math.min(bu.max[2], bi.max[2]) - Math.max(bu.min[2], bi.min[2]);
                if (ovX < 3.0 || ovZ < 3.0) continue;
                if (!hasAbove && bi.min[1] >= bu.max[1] - 4.5 && bi.center[1] > bu.center[1] + 2.0 && (bi.min[1] - bu.max[1]) <= 36) hasAbove = true;
                if (!hasBelow && bu.min[1] >= bi.max[1] - 4.5 && bu.center[1] > bi.center[1] + 2.0 && (bu.min[1] - bi.max[1]) <= 36) hasBelow = true;
                if (hasAbove && hasBelow) break;
              }
              if (hasAbove && hasBelow) { sandwichesExternal = true; break; }
            }
            if (sandwichesExternal) break;
          }
          if (!sandwichesExternal) {
            candidates.push({
              name: null,
              explicit: false,
              size: arrA.length,
              count: instances.length,
              savings: (instances.length - 1) * arrA.length,
              instances,
            });
          }
        }
      }
    }
  }

  candidates.sort((a, b) => (b.explicit ? 1 : 0) - (a.explicit ? 1 : 0) || b.savings - a.savings || b.count - a.count || b.size - a.size);
  const claimed = new Uint8Array(parts.length);
  const groups = [];
  let gSeq = 0;
  for (const c of candidates) {
    if (c.instances.some(inst => inst.some(i => claimed[i]))) continue;
    c.instances.forEach(inst => inst.forEach(i => { claimed[i] = 1; }));
    gSeq++;
    const name = c.name || autoNameDuplicateSubmodel(c.instances[0], parts, gSeq);
    const gid = `dupsub_${gSeq}`;
    groups.push({
      id: gid,
      name,
      repeatCount: c.instances.length,
      instances: c.instances,
      canonicalParts: normalizeCanonicalSubParts(c.instances[0].map(i => parts[i]), gid),
    });
  }
  return groups;
}

// Build strict bottom-up vertical prerequisite DAG:
// belowMap[i] = parts sitting directly underneath `i` that MUST be placed in an earlier step before `i`
// (strict inequality on min[1] & center[1] guarantees a 100% cycle-free DAG!).
function buildVerticalPrereqMap(boxes, adj, roles, claddingFlags, activeIndices) {
  const idxList = activeIndices || boxes.map((_, i) => i);
  const activeSet = new Set(idxList);
  let baseMinY = Infinity;
  for (const i of idxList) {
    if (roles[i] === 'wheel' || roles[i] === 'figure' || claddingFlags[i]) continue;
    if (boxes[i].min[1] < baseMinY) baseMinY = boxes[i].min[1];
  }
  if (!isFinite(baseMinY)) baseMinY = 0;

  const hasLowerOrBaseSupport = (u) => {
    if (boxes[u].min[1] <= baseMinY + 20) return true;
    const bu = boxes[u];
    for (const w of adj[u]) {
      if (!activeSet.has(w) || roles[w] === 'wheel' || roles[w] === 'figure') continue;
      const bw = boxes[w];
      if (bw.min[1] < bu.max[1] - 4.0 && bw.center[1] <= bu.center[1] + 4.0) return true;
    }
    return false;
  };

  const belowMap = Array.from({ length: boxes.length }, () => []);
  for (const i of idxList) {
    if (roles[i] === 'wheel' || roles[i] === 'figure' || claddingFlags[i]) continue;
    const bi = boxes[i];
    for (const u of idxList) {
      if (u === i || roles[u] === 'wheel' || roles[u] === 'figure' || claddingFlags[u]) continue;
      const bu = boxes[u];
      if (bu.min[1] >= bi.min[1] - 2.0) continue;
      if (bu.center[1] >= bi.center[1] - 2.0) continue;
      if (bu.max[1] > bi.min[1] + 4.5) continue;
      if (bi.min[1] - bu.max[1] > 36) continue;
      const ovX = Math.min(bi.max[0], bu.max[0]) - Math.max(bi.min[0], bu.min[0]);
      const ovZ = Math.min(bi.max[2], bu.max[2]) - Math.max(bi.min[2], bu.min[2]);
      if (ovX < 3.0 || ovZ < 3.0) continue;
      if (!hasLowerOrBaseSupport(u)) continue;
      belowMap[i].push(u);
    }
  }
  return { belowMap, baseMinY };
}

// Unlock any unplaced base-layer prerequisites sitting underneath blocked frontier parts
// (e.g., two base bricks on the table bridged by a window frame above them).
function collectBasePrereqs(blockedIndices, belowMap, remaining, boxes, baseMinY) {
  const unlocked = new Set();
  const seen = new Set();
  const stack = [...blockedIndices];
  while (stack.length > 0) {
    const cur = stack.pop();
    for (const u of belowMap[cur]) {
      if (!remaining.has(u) || seen.has(u)) continue;
      seen.add(u);
      const uBlocked = belowMap[u].some(w => remaining.has(w));
      if (!uBlocked) {
        if (boxes[u].min[1] <= baseMinY + 24) unlocked.add(u);
      } else {
        stack.push(u);
      }
    }
  }
  return Array.from(unlocked);
}

// Build bottom-up zero-floating steps for 1 canonical copy of a duplicate submodel or modular section
function buildLocalSubmodelSteps(canonicalParts, perStep, groupId, repeatCount) {
  const n = canonicalParts.length;
  const boxes = canonicalParts.map(p => computeWorldBox(p));
  const roles = canonicalParts.map(p => classifyPartRole(p));
  const sideCaps = canonicalParts.map((p, i) => canConnectSideways(p, roles[i]));
  const claddingFlags = canonicalParts.map((p, i) => isSidewaysCladdingPart(p, boxes[i]));
  const layerY = canonicalParts.map((p, i) => computeBuildLayerY(p, boxes[i]));
  const adj = buildSpatialAdjacency(canonicalParts, boxes, roles, sideCaps);
  const { belowMap, baseMinY } = buildVerticalPrereqMap(boxes, adj, roles, claddingFlags);
  const subPerStep = n > 20 ? perStep : Math.max(2, Math.min(perStep, n <= 4 ? 2 : 4));
  const placed = new Set();
  const remaining = new Set(Array.from({ length: n }, (_, i) => i));
  const steps = [];
  let sNum = 0;

  while (remaining.size > 0) {
    const placedBeforeStep = new Set(placed);
    let frontier;
    if (placed.size === 0) {
      const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i] && !belowMap[i].some(u => remaining.has(u)));
      const pool = nonWheels.length > 0 ? nonWheels : Array.from(remaining);
      pool.sort((a, b) => layerY[a] - layerY[b] || adj[b].length - adj[a].length);
      frontier = pool;
    } else {
      const rawFrontier = Array.from(remaining).filter(i => adj[i].some(nb => placedBeforeStep.has(nb)));
      const unblocked = rawFrontier.filter(i =>
        !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placedBeforeStep)
        && !belowMap[i].some(u => remaining.has(u))
      );
      const blocked = rawFrontier.filter(i => belowMap[i].some(u => remaining.has(u)));
      const basePrereqs = blocked.length > 0 ? collectBasePrereqs(blocked, belowMap, remaining, boxes, baseMinY) : [];
      const merged = Array.from(new Set([...basePrereqs, ...unblocked]));
      if (merged.length > 0) {
        frontier = merged;
      } else {
        const claddingReady = rawFrontier.filter(i => !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placedBeforeStep));
        frontier = claddingReady.length > 0 ? claddingReady : rawFrontier;
      }
      if (frontier.length === 0) frontier = Array.from(remaining).sort((a, b) => layerY[a] - layerY[b]);
      frontier.sort((a, b) => (roles[a] === 'wheel' ? 1 : 0) - (roles[b] === 'wheel' ? 1 : 0) || Math.round(layerY[a]/8) - Math.round(layerY[b]/8));
    }
    const anchor = frontier[0];
    const anchorY = layerY[anchor];
    const anchorC = boxes[anchor].center;
    const stepIdx = [anchor];
    remaining.delete(anchor); placed.add(anchor);

    while (stepIdx.length < subPerStep && remaining.size > 0) {
      // Every piece added in Step K > 1 must directly touch the already-built model from Steps 1..(K-1)
      // AND have ALL parts directly underneath it already placed in an EARLIER step!
      const supportSet = placedBeforeStep.size > 0 ? placedBeforeStep : placed;
      const cands = Array.from(remaining).filter(i => {
        if (Math.abs(layerY[i] - anchorY) > 12) return false;
        if (isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, supportSet)) return false;
        if (placedBeforeStep.size > 0) {
          if (belowMap[i].some(u => !placedBeforeStep.has(u))) return false;
          const touchesPrev = adj[i].some(nb => placedBeforeStep.has(nb));
          const sameBaseLayer = boxes[i].min[1] <= baseMinY + 24 && Math.abs(boxes[i].min[1] - boxes[anchor].min[1]) <= 4 && belowMap[i].length === 0;
          if (!touchesPrev && !sameBaseLayer) return false;
        } else {
          if (belowMap[i].length > 0) return false;
          const touchesCur = adj[i].some(nb => placed.has(nb));
          const sameBaseLayer = boxes[i].min[1] <= baseMinY + 24 && Math.abs(boxes[i].min[1] - boxes[anchor].min[1]) <= 4;
          if (!touchesCur && !sameBaseLayer) return false;
        }
        const d = Math.hypot(boxes[i].center[0]-anchorC[0], boxes[i].center[1]-anchorC[1], boxes[i].center[2]-anchorC[2]);
        return d <= 140;
      });
      if (cands.length === 0) break;
      cands.sort((a, b) => {
        const sc = (i) => {
          let s = 0;
          if (canonicalParts[i].p === canonicalParts[anchor].p && canonicalParts[i].c === canonicalParts[anchor].c) s += 80;
          else if (canonicalParts[i].p === canonicalParts[anchor].p) s += 30;
          s -= Math.hypot(boxes[i].center[0]-anchorC[0], boxes[i].center[2]-anchorC[2]) * 0.45;
          s -= Math.abs(layerY[i] - anchorY) * 2.0;
          return s;
        };
        return sc(b) - sc(a);
      });
      const next = cands[0];
      stepIdx.push(next); remaining.delete(next); placed.add(next);
    }
    sNum++;
    steps.push({
      id: `${groupId}_s${sNum}`,
      num: sNum,
      side: 'top',
      corner: 'front_right',
      cue: 'none',
      parts: stepIdx.map(i => canonicalParts[i]),
      isSubmodelStep: true,
    });
  }
  // Indicate ×N on ONLY the last step of repeated submodels (repeatCount > 1)
  if (steps.length > 0 && repeatCount > 1) {
    steps[steps.length - 1].isSubmodelFinal = true;
    steps[steps.length - 1].submodelRepeat = repeatCount;
  }
  return steps;
}

// Fast 3D spatial hash broad-phase adjacency builder (wheel-aware & rejects smooth side-wall grazing!)
function buildSpatialAdjacency(parts, boxes, roles, sideCaps = null) {
  const n = parts.length;
  const caps = sideCaps || parts.map((p, i) => canConnectSideways(p, roles[i]));
  const adj = Array.from({ length: n }, () => []);
  const cellSize = 80;
  const pad = 12;
  const cells = new Map();
  const oversized = [];

  for (let i = 0; i < n; i++) {
    const b = boxes[i];
    const minCx = Math.floor((b.min[0] - pad) / cellSize);
    const maxCx = Math.floor((b.max[0] + pad) / cellSize);
    const minCy = Math.floor((b.min[1] - pad) / cellSize);
    const maxCy = Math.floor((b.max[1] + pad) / cellSize);
    const minCz = Math.floor((b.min[2] - pad) / cellSize);
    const maxCz = Math.floor((b.max[2] + pad) / cellSize);
    const cellCount = (maxCx - minCx + 1) * (maxCy - minCy + 1) * (maxCz - minCz + 1);
    if (cellCount > 256) {
      oversized.push(i);
      continue;
    }
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
          const key = `${cx},${cy},${cz}`;
          let bucket = cells.get(key);
          if (!bucket) { bucket = []; cells.set(key, bucket); }
          bucket.push(i);
        }
      }
    }
  }

  const tested = new Set();
  const testPair = (i, j) => {
    const lo = i < j ? i : j;
    const hi = i < j ? j : i;
    const pk = lo * n + hi;
    if (tested.has(pk)) return;
    tested.add(pk);
    if (boxesPhysicallyTouch(boxes[lo], boxes[hi], roles[lo], roles[hi], caps[lo], caps[hi])) {
      adj[lo].push(hi);
      adj[hi].push(lo);
    }
  };

  for (const bucket of cells.values()) {
    for (let a = 0; a < bucket.length; a++) {
      for (let b = a + 1; b < bucket.length; b++) {
        testPair(bucket[a], bucket[b]);
      }
    }
  }
  for (const oi of oversized) {
    for (let j = 0; j < n; j++) {
      if (oi !== j) testPair(oi, j);
    }
  }

  // Pass 1: Fallback for any isolated wheel/detail whose axle wasn't tagged wheel_holder: connect to nearest structural/axle neighbor
  const fallbackDist = new Float64Array(n);
  fallbackDist.fill(-1);
  for (let i = 0; i < n; i++) {
    parts[i]._detachedGap = 0;
    parts[i]._floatHeight = 0;
    if (adj[i].length > 0) continue;
    let bestJ = -1, bestD = 12;
    for (let j = 0; j < n; j++) {
      if (i === j || roles[j] === 'wheel') continue;
      const gx = Math.max(0, boxes[i].min[0]-boxes[j].max[0], boxes[j].min[0]-boxes[i].max[0]);
      const gy = Math.max(0, boxes[i].min[1]-boxes[j].max[1], boxes[j].min[1]-boxes[i].max[1]);
      const gz = Math.max(0, boxes[i].min[2]-boxes[j].max[2], boxes[j].min[2]-boxes[i].max[2]);
      const d = Math.hypot(gx, gy, gz);
      if (d < bestD) { bestD = d; bestJ = j; }
    }
    if (bestJ >= 0) {
      adj[i].push(bestJ); adj[bestJ].push(i);
      fallbackDist[i] = bestD;
    } else {
      fallbackDist[i] = Infinity;
    }
  }

  // Pass 2: Ground-aware floating/weak-connection classification.
  // Standalone pieces resting on the model's ground plane (e.g., loose props/accessories)
  // are NOT flagged as floating; only pieces actually elevated above ground are flagged.
  if (n > 1) {
    const groundY = computeGroundPlaneY(boxes, (idx) => adj[idx].length > 0);
    for (let i = 0; i < n; i++) {
      if (fallbackDist[i] < 0) continue;
      const res = classifyDetachedPart({
        box: boxes[i],
        groundY,
        nearestGapLdu: fallbackDist[i],
        isWheel: roles[i] === 'wheel',
      });
      parts[i]._detachedGap = res.detachedGap;
      parts[i]._floatHeight = res.floatHeight;
    }
  }

  // Pass 3: Bridge small non-figure sub-assemblies (e.g., 2–16 part bogies, pantographs, headlights, mirrors)
  // that have a tiny CAD clearance gap (<= 12 LDU) to the main structure so they never detach during subdivision.
  const compVisited = new Uint8Array(n);
  const subComps = [];
  for (let i = 0; i < n; i++) {
    if (compVisited[i] || roles[i] === 'figure') continue;
    const comp = [];
    const q = [i];
    compVisited[i] = 1;
    let head = 0;
    while (head < q.length) {
      const u = q[head++];
      comp.push(u);
      for (const v of adj[u]) {
        if (!compVisited[v] && roles[v] !== 'figure') {
          compVisited[v] = 1;
          q.push(v);
        }
      }
    }
    subComps.push(comp);
  }
  if (subComps.length > 1) {
    subComps.sort((a, b) => b.length - a.length);
    const compIdOf = new Int32Array(n).fill(-1);
    subComps.forEach((comp, cid) => {
      for (const u of comp) compIdOf[u] = cid;
    });
    for (let cid = 1; cid < subComps.length; cid++) {
      const comp = subComps[cid];
      if (comp.length > 16) continue;
      let bestU = -1, bestV = -1, bestD = 12;
      for (const u of comp) {
        const bu = boxes[u];
        for (let v = 0; v < n; v++) {
          if (compIdOf[v] < 0 || compIdOf[v] === cid || roles[v] === 'wheel' || roles[v] === 'figure') continue;
          const bv = boxes[v];
          const gx = Math.max(0, bu.min[0] - bv.max[0], bv.min[0] - bu.max[0]);
          const gy = Math.max(0, bu.min[1] - bv.max[1], bv.min[1] - bu.max[1]);
          const gz = Math.max(0, bu.min[2] - bv.max[2], bv.min[2] - bu.max[2]);
          const d = Math.hypot(gx, gy, gz);
          if (d < bestD) { bestD = d; bestU = u; bestV = v; }
        }
      }
      if (bestU >= 0 && bestV >= 0) {
        adj[bestU].push(bestV);
        adj[bestV].push(bestU);
        const targetCid = compIdOf[bestV];
        for (const u of comp) compIdOf[u] = targetCid;
      }
    }
  }
  return adj;
}

function hasEmbeddedAxleHole(pid) {
  const k = normId(pid);
  const lines = embeddedDatRaw.get(k) || userLibRaw.get(k);
  if (!lines) return false;
  return lines.some(l => /axlehol/i.test(l));
}

function prepareSubdivisionData(parsed) {
  const parts = parsed.parts;
  const boxes = parts.map(p => computeWorldBox(p));
  const roles = parts.map(p => classifyPartRole(p));
  const sideCaps = parts.map((p, i) => canConnectSideways(p, roles[i]));
  const adjacency = buildSpatialAdjacency(parts, boxes, roles, sideCaps);
  const {
    groups: minifigGroups,
    claimed: mfClaimed,
  } = extractMinifigureGroups(parts, boxes, (pid) => resolvePart(pid).name, adjacency);
  const inputs = parts.map((p, index) => {
    const def = resolvePart(p.p);
    const m = p.m || R_ID;
    const isUpright = Math.abs(m[4]) >= 0.7;
    const isInverted = m[4] <= -0.7;
    const lastSub = p.subChain && p.subChain.length > 0 ? p.subChain[p.subChain.length - 1] : null;
    const flags = classifySubdivisionPartFlags(normId(p.p), def.name, boxes[index], {
      isTile: def.studs === false && def.h <= 10,
      hasTopStuds: def.studs !== false,
      hasEmbeddedAxleHole: hasEmbeddedAxleHole(p.p),
      isSidewaysCapable: sideCaps[index],
      isUpright,
      isInverted,
    });
    return {
      index,
      id: p.id,
      partId: normId(p.p),
      partName: def.name,
      colorId: p.c,
      box: boxes[index],
      ...flags,
      isMinifig: Boolean(mfClaimed[index]),
      submodelKey: p.sub || undefined,
      submodelInstanceId: lastSub ? String(lastSub.instId) : undefined,
    };
  });
  return { boxes, roles, adjacency, inputs, mfClaimed, minifigGroups };
}

function extractTargetBoxesForMinifig(partsList) {
  const out = [];
  for (const p of partsList || []) {
    if (p.children && p.children.length > 0) {
      for (const ch of p.children) {
        out.push({
          box: computeLeafWorldBox(ch),
          role: classifyMinifigLeafRole(ch.p, resolvePart(ch.p).name),
        });
      }
    } else {
      out.push({
        box: computeLeafWorldBox(p),
        role: classifyMinifigLeafRole(p.p, resolvePart(p.p).name),
      });
    }
  }
  return out;
}

function appendOccluderBoxes(partsList, out) {
  for (const p of partsList || []) {
    if (p.children && p.children.length > 0) {
      for (const ch of p.children) {
        const col = COLORS[ch.c];
        out.push({
          box: computeLeafWorldBox(ch),
          transparent: Boolean(col && typeof col.alpha === 'number' && col.alpha < 0.99),
        });
      }
    } else {
      const col = COLORS[p.c];
      out.push({
        box: computeLeafWorldBox(p),
        transparent: Boolean(col && typeof col.alpha === 'number' && col.alpha < 0.99),
      });
    }
  }
}

function getDefaultStepCam(step) {
  const side = step.side || 'top';
  const corner = step.corner || 'front_right';
  const cObj = CORNERS.find(c => c.id === corner) || CORNERS[0];
  return {
    side,
    corner,
    az: typeof step.az === 'number' ? step.az : cObj.az,
    el: typeof step.el === 'number' ? step.el : (side === 'bottom' ? -30 : 30),
  };
}

// Ensures every minifigure placement step uses an unobstructed camera angle (never hiding behind the model!)
// and keeps paired pre-placement pose steps + subsequent model rotation cues in sync.
function optimizeMinifigPlacementCameras(chapters) {
  const sectionState = new Map();
  for (const ch of chapters) {
    if (ch.kind === 'submodel' || ch.kind === 'minifigure') continue;
    const secKey = ch.sectionId || ch.id;
    if (!sectionState.has(secKey)) {
      sectionState.set(secKey, { occluders: [], lastModelCam: null });
    }
    const sec = sectionState.get(secKey);
    const steps = ch.steps || [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.isStandaloneFigure || step.isMinifigPoseStep) continue;

      if (step.attachedMinifig) {
        const prevCam = sec.lastModelCam || DEFAULT_STUDIO_CAMERA;
        const targets = extractTargetBoxesForMinifig(step.parts);
        const chosen = chooseMinifigPlacementCamera(
          targets,
          sec.occluders,
          step.attachedMinifig.worldForward,
          prevCam,
        );
        step.side = chosen.side;
        step.corner = chosen.corner;
        step.az = chosen.az;
        step.el = chosen.el;
        step.cue = sec.lastModelCam ? chosen.cue : 'none';

        sec.lastModelCam = {
          side: chosen.side,
          corner: chosen.corner,
          az: chosen.az,
          el: chosen.el,
        };
        appendOccluderBoxes(step.parts, sec.occluders);
      } else {
        const curCam = getDefaultStepCam(step);
        step.cue = sec.lastModelCam ? computeStudioRotationCue(sec.lastModelCam, curCam) : 'none';
        sec.lastModelCam = curCam;
        appendOccluderBoxes(step.parts, sec.occluders);
      }
    }
  }
}

// ZERO-FLOATING CHASSIS-FIRST STEP GENERATOR (with automatic duplicate submodel & subdivision chapters!)
function buildManualFromParsed(parsed, mode, subdivisionPlan = null) {
  const perStep = state.pacing === 'few' ? 3 : state.pacing === 'many' ? 12 : 6;
  const parts = parsed.parts;
  const boxes = parts.map(p => computeWorldBox(p));
  const roles = parts.map(p => classifyPartRole(p));
  const claddingFlags = parts.map((p, i) => isSidewaysCladdingPart(p, boxes[i]));
  const layerY = parts.map((p, i) => computeBuildLayerY(p, boxes[i]));

  if (mode === 'keep' && parsed.hasSteps) {
    for (const p of parts) { p._detachedGap = 0; p._floatHeight = 0; }
    const bySub = new Map();
    for (const p of parts) {
      const k = cleanSubName(p.sub);
      if (!bySub.has(k)) bySub.set(k, []);
      bySub.get(k).push(p);
    }
    const chapters = [];
    let globalStep = 0, chIdx = 0;
    for (const [subName, list] of Array.from(bySub.entries()).sort((a,b) => a[1].length - b[1].length)) {
      chIdx++;
      const byOrig = new Map();
      for (const p of list) {
        const k = p.origStep || 0;
        if (!byOrig.has(k)) byOrig.set(k, []);
        byOrig.get(k).push(p);
      }
      const steps = Array.from(byOrig.keys()).sort((a,b)=>a-b).map(k => ({
        id: `kc${chIdx}_s${++globalStep}`, num: globalStep,
        side: 'top', corner: 'front_right', cue: 'none', parts: byOrig.get(k),
      }));
      chapters.push({ id: `kch_${chIdx}`, name: subName, kind: 'main', sectionId: `ksec_${chIdx}`, steps });
    }
    return { title: parsed.title, subtitle: `${parts.length} pieces · ${globalStep} steps`, chapters, _parsed: parsed, _mode: mode, _subdivisionPlan: null };
  }

  // 1. Build strict physical adjacency graph via 3D spatial hash broad-phase (wheel-aware & rejects smooth side-wall grazing!)
  const sideCaps = parts.map((p, i) => canConnectSideways(p, roles[i]));
  const adj = buildSpatialAdjacency(parts, boxes, roles, sideCaps);

  // 1a. Whole-Minifigure Assembly Grouping (NEVER build just a head — and NEVER sweep chairs/seats or furniture into figures!)
  const {
    groups: minifigGroups,
    kinds: mfKinds,
    claimed: mfClaimed,
  } = extractMinifigureGroups(parts, boxes, (pid) => resolvePart(pid).name, adj);
  for (let i = 0; i < parts.length; i++) {
    if (mfClaimed[i]) parts[i]._floatHeight = 0;
  }

  // 1b. Automatic Duplicate Submodel Detection (explicit submodels + geometric-only duplicates!)
  const dupGroups = detectDuplicateSubassemblies(parts, boxes, adj, roles).filter(g =>
    !g.instances.some(inst => inst.some(pi => mfClaimed[pi]))
  );
  const partToDup = new Map();
  for (const g of dupGroups) {
    g.instances.forEach((inst, instIdx) => {
      for (const pi of inst) partToDup.set(pi, { group: g, instIdx });
    });
  }

  // 2. Connected components for non-minifigure model parts
  const visited = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) if (mfClaimed[i]) visited[i] = 1;
  const rawComps = [];
  for (let i = 0; i < parts.length; i++) {
    if (visited[i]) continue;
    const q = [i], comp = []; visited[i] = 1;
    while (q.length) {
      const u = q.shift(); comp.push(u);
      for (const v of adj[u]) if (!visited[v]) { visited[v] = 1; q.push(v); }
    }
    rawComps.push(comp);
  }
  rawComps.sort((a, b) => b.length - a.length);
  const largeComps = rawComps.filter(c => c.length > 20 || rawComps.length === 1);
  const straySmall = rawComps.filter(c => c.length <= 20 && rawComps.length > 1);
  // Fold tiny stray non-figure clips/bars into the primary model component so they build with the model, not as fake figures!
  if (largeComps.length > 0 && straySmall.length > 0) {
    for (const sc of straySmall) largeComps[0].push(...sc);
  } else if (largeComps.length === 0 && straySmall.length > 0) {
    largeComps.push(straySmall.flat());
  }
  const groupedComps = largeComps.map((c, idx) => ({
    name: largeComps.length === 1 ? parsed.title : `${parsed.title} · Section ${idx + 1}`,
    indices: c,
  }));

  // 3. Normalize all detected minifigures into canonical standing-up front-facing construction pose,
  //    and prepare their placement transforms to run right before they are placed on the model!
  const hasMainModel = groupedComps.length > 0;
  const normalizedMinifigs = minifigGroups.map((mg, mfIdx) => {
    const order = { legs: 0, torso: 1, head: 2, headgear: 3 };
    const sortedIdx = [...mg.indices].sort((a, b) =>
      (order[mfKinds[a]] ?? 4) - (order[mfKinds[b]] ?? 4) || boxes[a].min[1] - boxes[b].min[1]
    );
    const worldParts = sortedIdx.map(i => parts[i]);
    const mfId = `mf_${mfIdx + 1}`;
    const norm = normalizeMinifigureForBuild(
      worldParts,
      (pid) => resolvePart(pid).name,
      computeWorldBox,
      mfId,
    );
    const wMin = [Infinity, Infinity, Infinity], wMax = [-Infinity, -Infinity, -Infinity];
    for (const idx of sortedIdx) {
      for (let k = 0; k < 3; k++) {
        if (boxes[idx].min[k] < wMin[k]) wMin[k] = boxes[idx].min[k];
        if (boxes[idx].max[k] > wMax[k]) wMax[k] = boxes[idx].max[k];
      }
    }
    const worldBox = {
      min: wMin, max: wMax,
      center: [(wMin[0] + wMax[0]) / 2, (wMin[1] + wMax[1]) / 2, (wMin[2] + wMax[2]) / 2],
    };
    return {
      id: mfId,
      name: mg.name || `Minifigure ${mfIdx + 1}`,
      indices: sortedIdx,
      worldParts,
      worldBox,
      ...norm,
    };
  });

  // Assign each minifigure to its closest main-model section so it is posed & placed right onto the model
  const sectionMinifigs = groupedComps.map(() => []);
  if (hasMainModel) {
    for (const nm of normalizedMinifigs) {
      let bestSec = 0, bestD = Infinity;
      groupedComps.forEach((g, secIdx) => {
        for (const pi of g.indices) {
          const b = boxes[pi];
          const gx = Math.max(0, nm.worldBox.min[0] - b.max[0], b.min[0] - nm.worldBox.max[0]);
          const gy = Math.max(0, nm.worldBox.min[1] - b.max[1], b.min[1] - nm.worldBox.max[1]);
          const gz = Math.max(0, nm.worldBox.min[2] - b.max[2], b.min[2] - nm.worldBox.max[2]);
          const d = Math.hypot(gx, gy, gz);
          if (d < bestD) { bestD = d; bestSec = secIdx; }
        }
      });
      sectionMinifigs[bestSec].push(nm);
    }
  }

  // 4. Emit complete Minifigures chapter FIRST (standing upright, facing camera in front 3/4 view),
  //    then Chassis-First Main Build with pre-placement pose/rotation + placement steps!
  const chapters = [];
  const emittedSubChapters = new Set();
  let globalStep = 0, chSeq = 0;

  if (normalizedMinifigs.length > 0) {
    const mfSteps = normalizedMinifigs.map((nm) => {
      globalStep++;
      return {
        id: `mf_s${globalStep}`,
        num: globalStep,
        side: MINIFIG_BUILD_CAMERA.side,
        corner: MINIFIG_BUILD_CAMERA.corner,
        az: MINIFIG_BUILD_CAMERA.az,
        el: MINIFIG_BUILD_CAMERA.el,
        cue: 'none',
        isStandaloneFigure: true,
        isMinifigBuildStep: true,
        placedInMain: hasMainModel,
        minifigId: nm.id,
        minifigName: nm.name,
        minifigMetrics: nm.metrics,
        parts: nm.canonicalParts,
      };
    });
    chapters.push({
      id: `ach_${++chSeq}`,
      name: normalizedMinifigs.length === 1 ? 'Minifigure' : 'Minifigures',
      kind: 'minifigure',
      sectionId: 'sec_minifigs',
      steps: mfSteps,
    });
  }

  // Compute horizontal span for adaptive spatial spread guard (stops far-end pieces from grouping on long builds)
  let mMinX = Infinity, mMaxX = -Infinity, mMinZ = Infinity, mMaxZ = -Infinity;
  for (let i = 0; i < parts.length; i++) {
    if (mfClaimed[i]) continue;
    if (boxes[i].min[0] < mMinX) mMinX = boxes[i].min[0];
    if (boxes[i].max[0] > mMaxX) mMaxX = boxes[i].max[0];
    if (boxes[i].min[2] < mMinZ) mMinZ = boxes[i].min[2];
    if (boxes[i].max[2] > mMaxZ) mMaxZ = boxes[i].max[2];
  }
  const modelHorizSpan = isFinite(mMinX) ? Math.max(mMaxX - mMinX, mMaxZ - mMinZ) : 0;
  const adaptiveMaxSpread = modelHorizSpan >= 400 ? 120 : 160;

  // Helper: zero-floating chassis-first step generation for any subset of world part indices
  const buildStepsForIndexList = (idxList, idPrefix, prePlacedSet = new Set(), maxSpread = adaptiveMaxSpread) => {
    const placed = new Set(prePlacedSet);
    const remaining = new Set(idxList);
    const outSteps = [];

    while (remaining.size > 0) {
      let frontier;
      if (placed.size === 0) {
        const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i]);
        const pool = nonWheels.length > 0 ? nonWheels : Array.from(remaining);
        pool.sort((a, b) => layerY[a] - layerY[b]);
        const minY = layerY[pool[0]];
        const lowBand = pool.filter(i => layerY[i] <= minY + 32);
        lowBand.sort((a, b) => {
          const sa = (roles[a] === 'structural' || roles[a] === 'wheel_holder' ? 50 : 0) + adj[a].length * 6 - (layerY[a] - minY) * 0.8;
          const sb = (roles[b] === 'structural' || roles[b] === 'wheel_holder' ? 50 : 0) + adj[b].length * 6 - (layerY[b] - minY) * 0.8;
          return sb - sa;
        });
        frontier = lowBand;
      } else {
        const rawFrontier = Array.from(remaining).filter(i => adj[i].some(nb => placed.has(nb)));
        const readyFrontier = rawFrontier.filter(i => !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed));
        frontier = readyFrontier.length > 0 ? readyFrontier : rawFrontier;
        if (frontier.length === 0) {
          frontier = Array.from(remaining).sort((a, b) => layerY[a] - layerY[b]);
        }
        frontier.sort((a, b) => {
          const wa = roles[a] === 'wheel' ? 1 : 0, wb = roles[b] === 'wheel' ? 1 : 0;
          if (wa !== wb) return wa - wb;
          return Math.round(layerY[a] / 8) - Math.round(layerY[b] / 8) || (claddingFlags[a] ? 1 : 0) - (claddingFlags[b] ? 1 : 0) || parts[a].p.localeCompare(parts[b].p);
        });
      }

      const anchor = frontier[0];
      const anchorY = layerY[anchor];
      const anchorC = boxes[anchor].center;
      const stepIndices = [anchor];
      remaining.delete(anchor);
      placed.add(anchor);

      while (stepIndices.length < perStep && remaining.size > 0) {
        const cands = Array.from(remaining).filter(i => {
          if (isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed)) return false;
          if (Math.abs(layerY[i] - anchorY) > 18) return false;
          if (!adj[i].some(nb => placed.has(nb))) return false;
          const d = Math.hypot(boxes[i].center[0]-anchorC[0], boxes[i].center[1]-anchorC[1], boxes[i].center[2]-anchorC[2]);
          return d <= maxSpread;
        });
        if (cands.length === 0) break;
        cands.sort((a, b) => {
          const score = (i) => {
            let s = 0;
            if (parts[i].p === parts[anchor].p && parts[i].c === parts[anchor].c) s += 85;
            else if (parts[i].p === parts[anchor].p) s += 35;
            if (roles[i] === roles[anchor]) s += 20;
            s -= Math.hypot(boxes[i].center[0]-anchorC[0], boxes[i].center[2]-anchorC[2]) * 0.45;
            s -= Math.abs(layerY[i] - anchorY) * 2.0;
            return s;
          };
          return score(b) - score(a);
        });
        const next = cands[0];
        stepIndices.push(next);
        remaining.delete(next);
        placed.add(next);
      }

      globalStep++;
      outSteps.push({
        id: `${idPrefix}_s${globalStep}`,
        num: globalStep,
        side: 'top',
        corner: 'front_right',
        cue: 'none',
        parts: stepIndices.map(i => parts[i]),
      });
    }
    return { steps: outSteps, placed };
  };

  // 3b. SUBDIVISION PLAN EXECUTION (Modular Halves / Floors / Modules + Connect, OR Numbered Build Bags!)
  if (subdivisionPlan && subdivisionPlan.strategy !== 'none' && Array.isArray(subdivisionPlan.sections) && subdivisionPlan.sections.length >= 1) {
    // Track every non-minifig part index so zero bricks are ever duplicated or dropped
    const assigned = new Set();
    const filterUnassigned = (list) => {
      const clean = [];
      for (const idx of list || []) {
        if (idx >= 0 && idx < parts.length && !mfClaimed[idx] && !assigned.has(idx)) {
          assigned.add(idx);
          clean.push(idx);
        }
      }
      return clean;
    };

    const resolvedSections = subdivisionPlan.sections.map((sec) => {
      if (sec.repeatPartIndexGroups && sec.repeatPartIndexGroups.length > 1) {
        const groups = sec.repeatPartIndexGroups.map(g => filterUnassigned(g)).filter(g => g.length > 0);
        return { ...sec, cleanIndices: groups[0] || [], cleanRepeatGroups: groups };
      }
      const clean = filterUnassigned(sec.partIndices);
      return { ...sec, cleanIndices: clean, cleanRepeatGroups: clean.length > 0 ? [clean] : [] };
    }).filter(s => s.cleanIndices.length > 0);

    // Fold any stray unassigned non-minifig parts into a join/final bucket
    const leftover = [];
    for (let i = 0; i < parts.length; i++) {
      if (!mfClaimed[i] && !assigned.has(i)) leftover.push(i);
    }

    const appendMinifigPlacementSteps = (targetSteps, nm, idPrefix) => {
      if (nm.needsTransform) {
        globalStep++;
        const poseCam = nm.poseCamera || MINIFIG_POSE_CAMERA;
        targetSteps.push({
          id: `${idPrefix}_mfpose_${nm.id}_s${globalStep}`,
          num: globalStep,
          side: poseCam.side,
          corner: poseCam.corner,
          az: poseCam.az,
          el: poseCam.el,
          cue: 'none',
          isMinifigPoseStep: true,
          minifigPrep: {
            id: nm.id,
            name: nm.name,
            label: nm.transformLabel,
            canonicalParts: nm.canonicalParts,
            poseSummary: nm.poseSummary,
            indicators: nm.poseIndicators || [],
            ghostParts: nm.poseGhostParts || [],
            rotatedPartIds: nm.rotatedPartIds || [],
          },
          parts: nm.posedFrontParts || nm.posedPreviewParts,
        });
      }
      globalStep++;
      targetSteps.push({
        id: `${idPrefix}_mfplace_${nm.id}_s${globalStep}`,
        num: globalStep,
        side: 'top',
        corner: 'front_right',
        cue: 'none',
        attachedMinifig: {
          id: nm.id,
          name: nm.name,
          repeatCount: 1,
          previewParts: nm.posedPreviewParts,
          canonicalParts: nm.canonicalParts,
          needsTransform: nm.needsTransform,
          transformLabel: nm.transformLabel,
          worldForward: nm.worldForward,
        },
        parts: nm.worldParts,
      });
    };

    if (subdivisionPlan.outputMode === 'numbered_bags') {
      const runningPlaced = new Set();
      const bagSections = [...resolvedSections];
      if (leftover.length > 0) {
        if (bagSections.length > 0) {
          bagSections[bagSections.length - 1].cleanRepeatGroups[0].push(...leftover);
          bagSections[bagSections.length - 1].cleanIndices.push(...leftover);
        } else {
          bagSections.push({ id: 'bag_rest', name: 'Final Bag', role: 'bag', cleanIndices: leftover, cleanRepeatGroups: [leftover] });
        }
      }

      // Assign each minifigure to the bag whose bricks are closest to its placement spot
      const bagMinifigs = bagSections.map(() => []);
      for (const nm of normalizedMinifigs) {
        let bestBag = Math.max(0, bagSections.length - 1), bestD = Infinity;
        bagSections.forEach((sec, bIdx) => {
          for (const pi of sec.cleanRepeatGroups.flat()) {
            const b = boxes[pi];
            const gx = Math.max(0, nm.worldBox.min[0] - b.max[0], b.min[0] - nm.worldBox.max[0]);
            const gy = Math.max(0, nm.worldBox.min[1] - b.max[1], b.min[1] - nm.worldBox.max[1]);
            const gz = Math.max(0, nm.worldBox.min[2] - b.max[2], b.min[2] - nm.worldBox.max[2]);
            const d = Math.hypot(gx, gy, gz);
            if (d < bestD) { bestD = d; bestBag = bIdx; }
          }
        });
        if (bagMinifigs[bestBag]) bagMinifigs[bestBag].push(nm);
      }

      bagSections.forEach((sec, bIdx) => {
        const bagIndices = sec.cleanRepeatGroups.flat();
        const { steps: bagSteps, placed: afterPlaced } = buildStepsForIndexList(
          bagIndices,
          `bag${bIdx + 1}`,
          runningPlaced,
          adaptiveMaxSpread,
        );
        for (const pi of afterPlaced) runningPlaced.add(pi);
        for (const nm of (bagMinifigs[bIdx] || [])) {
          appendMinifigPlacementSteps(bagSteps, nm, `bag${bIdx + 1}`);
        }
        if (bagSteps.length > 0) {
          chapters.push({
            id: `bagch_${++chSeq}_${sec.id}`,
            name: sec.name || `Bag ${bIdx + 1}`,
            kind: 'bag',
            sectionId: 'sec_bags',
            bagNumber: bIdx + 1,
            pieceCount: bagIndices.length,
            bagPreviewParts: bagIndices.map(i => parts[i]),
            steps: bagSteps,
          });
        }
      });

      optimizeMinifigPlacementCameras(chapters);
      return {
        title: parsed.title,
        subtitle: `${parts.length} pieces · ${globalStep} steps · ${bagSections.length} build bags`,
        chapters,
        _parsed: parsed,
        _mode: mode,
        _subdivisionPlan: subdivisionPlan,
      };
    } else {
      // MODULAR CHAPTERS + CONNECT / FINAL ASSEMBLY
      const moduleSecs = resolvedSections.filter(s => s.role !== 'join');
      const joinSecs = resolvedSections.filter(s => s.role === 'join');
      const joinIndices = [
        ...joinSecs.flatMap(s => s.cleanRepeatGroups.flat()),
        ...leftover,
      ];
      const artSec = joinSecs.find(s => s.articulatedJoin);
      const artJoin = artSec?.articulatedJoin || null;

      const attachQueue = [];
      moduleSecs.forEach((sec, mIdx) => {
        const repeatCount = sec.cleanRepeatGroups.length;
        const subId = `mod_${mIdx + 1}_${sec.id}`;
        const canonicalParts = normalizeCanonicalSubParts(sec.cleanIndices.map(i => parts[i]), subId);
        const subSteps = buildLocalSubmodelSteps(canonicalParts, perStep, subId, repeatCount);
        // Mark as a standalone section module (uses clean "SECTION · N pcs" banner when repeatCount === 1)
        chapters.push({
          id: `subch_${++chSeq}_${subId}`,
          name: sec.name || `Section ${mIdx + 1}`,
          kind: 'submodel',
          isSectionModule: true,
          sectionId: `subsec_${subId}`,
          repeatCount,
          pieceCount: sec.cleanIndices.length,
          canonicalParts,
          steps: subSteps,
        });

        sec.cleanRepeatGroups.forEach((grpIndices, copyIdx) => {
          attachQueue.push({
            id: `${subId}_c${copyIdx}`,
            name: repeatCount > 1 ? `${sec.name} #${copyIdx + 1}` : sec.name,
            baseName: sec.name,
            indices: grpIndices,
            canonicalParts,
            isDetachableCap: Boolean(sec.isDetachableCap),
          });
        });
      });

      const primaryAttachQueue = attachQueue.filter(item => !item.isDetachableCap);
      const capAttachQueue = attachQueue.filter(item => item.isDetachableCap);
      const mainAttachList = primaryAttachQueue.length > 0 ? primaryAttachQueue : attachQueue;
      const deferredCaps = primaryAttachQueue.length > 0 ? capAttachQueue : [];

      // Partition join indices cleanly when an articulated axle-through-round-hole joint is present
      let useArticulatedSequence = false;
      let cleanCollarIndices = [];
      let cleanRodIndices = [];
      let cleanBogieIndices = [];
      let cleanFinishIndices = [];
      let bogieSubId = null;
      let bogieCanonical = null;

      if (artJoin && mainAttachList.length >= 2) {
        const joinPool = new Set(joinIndices);
        const takeFromPool = (list) => {
          const out = [];
          for (const idx of list || []) {
            if (joinPool.has(idx)) {
              joinPool.delete(idx);
              out.push(idx);
            }
          }
          return out;
        };
        cleanCollarIndices = takeFromPool(artJoin.floatingCollarIndices);
        cleanRodIndices = takeFromPool(artJoin.pivotRodIndices);
        cleanBogieIndices = takeFromPool(artJoin.bogiePartIndices);
        cleanFinishIndices = [...takeFromPool(artJoin.finishPartIndices), ...Array.from(joinPool)];

        if (cleanBogieIndices.length > 0 || cleanRodIndices.length > 0) {
          useArticulatedSequence = true;
          // Build the intact end assembly (e.g. Middle Bogie / Pivot Assembly) as its own zoomed-in chapter first!
          if (cleanBogieIndices.length >= 2) {
            bogieSubId = 'mod_center_end_asm';
            bogieCanonical = normalizeCanonicalSubParts(cleanBogieIndices.map(i => parts[i]), bogieSubId);
            const bogieSteps = buildLocalSubmodelSteps(bogieCanonical, perStep, bogieSubId, 1);
            chapters.push({
              id: `subch_${++chSeq}_${bogieSubId}`,
              name: artJoin.bogieName || 'Center Assembly',
              kind: 'submodel',
              isSectionModule: true,
              sectionId: `subsec_${bogieSubId}`,
              repeatCount: 1,
              pieceCount: cleanBogieIndices.length,
              canonicalParts: bogieCanonical,
              steps: bogieSteps,
            });
          }
        }
      }

      // Emit Connect & Finish chapter joining all completed sections + any center connector bricks!
      const joinSteps = [];
      const joinedPlaced = new Set();

      if (useArticulatedSequence) {
        const halfA = mainAttachList[0];
        const halfB = mainAttachList[1];
        const endSide = artJoin.endAttachSide === 'top' ? 'top' : 'bottom';
        const endName = artJoin.bogieName || 'Center Assembly';
        const [ax, az] = artJoin.slideAxis || [1, 0];
        const centroidXZ = (idxList) => {
          let sx = 0, sz = 0;
          for (const i of idxList) { sx += boxes[i].center[0]; sz += boxes[i].center[2]; }
          const denom = Math.max(1, idxList.length);
          return [sx / denom, sz / denom];
        };
        const cA = centroidXZ(halfA.indices);
        const cB = centroidXZ(halfB.indices);
        const dirSign = ((cB[0] - cA[0]) * ax + (cB[1] - cA[1]) * az) >= 0 ? 1 : -1;
        const slideDir = [ax * dirSign, 0, az * dirSign];

        // Stage 1: Place First Half
        for (const pi of halfA.indices) joinedPlaced.add(pi);
        globalStep++;
        joinSteps.push({
          id: `join_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          cue: 'none',
          parts: halfA.indices.map(i => parts[i]),
          attachedSubmodel: {
            id: halfA.id,
            name: halfA.name,
            repeatCount: 1,
            totalRepeatCount: 1,
            isSectionAttach: true,
            attachVerb: 'Place',
            canonicalParts: halfA.canonicalParts,
          },
        });

        // Stage 2: Drop floating circular cross-axle pieces into the cavity/scoop before closing halves
        if (cleanCollarIndices.length > 0) {
          const sortedCollars = [...cleanCollarIndices].sort((a, b) => boxes[a].min[1] - boxes[b].min[1]);
          const chunkSize = Math.max(4, perStep);
          for (let ci = 0; ci < sortedCollars.length; ci += chunkSize) {
            const chunk = sortedCollars.slice(ci, ci + chunkSize);
            const defaultPartOffsets = {};
            chunk.forEach((idx, posInChunk) => {
              joinedPlaced.add(idx);
              defaultPartOffsets[parts[idx].id] = {
                x: Math.round(slideDir[0] * 18),
                y: 28,
                z: Math.round(slideDir[2] * 18),
                tilt: 0,
                arrow: posInChunk === 0 || posInChunk === chunk.length - 1,
              };
            });
            globalStep++;
            joinSteps.push({
              id: `join_collar_s${globalStep}`,
              num: globalStep,
              side: 'top',
              corner: 'front_right',
              cue: 'none',
              stepHint: 'Drop into joint',
              defaultPartOffsets,
              parts: chunk.map(i => parts[i]),
            });
          }
        }

        // Stage 3: Slide the Second Half together with the First Half around the center pieces
        const halfBOffsets = {};
        let minProjB = Infinity, midYB = 0;
        for (const i of halfB.indices) midYB += boxes[i].center[1];
        midYB /= Math.max(1, halfB.indices.length);
        let leadArrowId = parts[halfB.indices[0]]?.id || null;
        let bestLeadScore = Infinity;
        for (const i of halfB.indices) {
          const pr = boxes[i].center[0] * slideDir[0] + boxes[i].center[2] * slideDir[2];
          if (pr < minProjB) minProjB = pr;
        }
        for (const i of halfB.indices) {
          const pr = boxes[i].center[0] * slideDir[0] + boxes[i].center[2] * slideDir[2];
          const score = (pr - minProjB) + Math.abs(boxes[i].center[1] - midYB) * 0.4;
          if (score < bestLeadScore) { bestLeadScore = score; leadArrowId = parts[i].id; }
        }
        const slideOffX = Math.round(slideDir[0] * 60);
        const slideOffZ = Math.round(slideDir[2] * 60);
        for (const i of halfB.indices) {
          joinedPlaced.add(i);
          halfBOffsets[parts[i].id] = {
            x: slideOffX,
            y: 0,
            z: slideOffZ,
            tilt: 0,
            arrow: parts[i].id === leadArrowId,
          };
        }
        globalStep++;
        joinSteps.push({
          id: `join_slide_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          cue: 'none',
          stepHint: 'Slide sections together',
          defaultPartOffsets: halfBOffsets,
          parts: halfB.indices.map(i => parts[i]),
          attachedSubmodel: {
            id: halfB.id,
            name: halfB.name,
            repeatCount: 1,
            totalRepeatCount: 1,
            isSectionAttach: true,
            attachVerb: 'Slide Together',
            canonicalParts: halfB.canonicalParts,
          },
        });

        // Attach any extra non-cap modules beyond the first two halves
        for (let aIdx = 2; aIdx < mainAttachList.length; aIdx++) {
          const item = mainAttachList[aIdx];
          for (const pi of item.indices) joinedPlaced.add(pi);
          globalStep++;
          joinSteps.push({
            id: `join_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            parts: item.indices.map(i => parts[i]),
            attachedSubmodel: {
              id: item.id,
              name: item.name,
              repeatCount: 1,
              totalRepeatCount: 1,
              isSectionAttach: true,
              attachVerb: 'Connect',
              canonicalParts: item.canonicalParts,
            },
          });
        }

        // Stage 4: Push the vertical Technic axle/rod through both halves & cross-axle pieces
        let rodTargetXZ = null;
        if (cleanRodIndices.length > 0) {
          const rodOffsets = {};
          let rSx = 0, rSz = 0;
          for (const rIdx of cleanRodIndices) {
            joinedPlaced.add(rIdx);
            const rb = boxes[rIdx];
            rSx += rb.center[0];
            rSz += rb.center[2];
            if (endSide === 'bottom') {
              let seamMaxY = rb.max[1];
              for (const pi of joinedPlaced) {
                if (pi === rIdx) continue;
                const pb = boxes[pi];
                if (Math.hypot(pb.center[0] - rb.center[0], pb.center[2] - rb.center[2]) <= 60 && pb.max[1] > seamMaxY) {
                  seamMaxY = pb.max[1];
                }
              }
              const liftY = Math.round(Math.max(48, Math.min(96, (seamMaxY - rb.max[1]) + 34)));
              rodOffsets[parts[rIdx].id] = { x: 0, y: liftY, z: 0, tilt: 0, arrow: true };
            } else {
              rodOffsets[parts[rIdx].id] = { x: 0, y: -56, z: 0, tilt: 0, arrow: true };
            }
          }
          rodTargetXZ = [rSx / cleanRodIndices.length, rSz / cleanRodIndices.length];
          globalStep++;
          joinSteps.push({
            id: `join_rod_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            stepHint: 'Push axle through',
            defaultPartOffsets: rodOffsets,
            parts: cleanRodIndices.map(i => parts[i]),
          });
        }

        // Stage 5: Attach the intact end assembly (e.g., Middle Bogie / Pivot Assembly) onto the protruding end of the rod
        if (cleanBogieIndices.length > 0) {
          const bogieOffsets = {};
          let bCx = 0, bCz = 0;
          for (const i of cleanBogieIndices) { bCx += boxes[i].center[0]; bCz += boxes[i].center[2]; }
          bCx /= cleanBogieIndices.length;
          bCz /= cleanBogieIndices.length;
          const refX = rodTargetXZ ? rodTargetXZ[0] : bCx;
          const refZ = rodTargetXZ ? rodTargetXZ[1] : bCz;
          let bogieArrowId = parts[cleanBogieIndices[0]]?.id || null;
          let bestBogieScore = Infinity;
          for (const i of cleanBogieIndices) {
            const dXZ = Math.hypot(boxes[i].center[0] - refX, boxes[i].center[2] - refZ);
            const yBias = endSide === 'bottom' ? -boxes[i].max[1] * 0.25 : boxes[i].min[1] * 0.25;
            const score = dXZ + yBias;
            if (score < bestBogieScore) { bestBogieScore = score; bogieArrowId = parts[i].id; }
          }
          const endOffY = endSide === 'bottom' ? -44 : 44;
          for (const i of cleanBogieIndices) {
            joinedPlaced.add(i);
            bogieOffsets[parts[i].id] = {
              x: 0,
              y: endOffY,
              z: 0,
              tilt: 0,
              arrow: parts[i].id === bogieArrowId,
            };
          }
          globalStep++;
          const bogieStep = {
            id: `join_bogie_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            stepHint: cleanRodIndices.length > 0 ? `Attach ${endName.toLowerCase()} to axle` : `Attach ${endName.toLowerCase()}`,
            defaultPartOffsets: bogieOffsets,
            parts: cleanBogieIndices.map(i => parts[i]),
          };
          if (bogieCanonical && bogieSubId) {
            bogieStep.attachedSubmodel = {
              id: `${bogieSubId}_c0`,
              name: endName,
              repeatCount: 1,
              totalRepeatCount: 1,
              isSectionAttach: true,
              attachVerb: cleanRodIndices.length > 0 ? 'Attach to Axle' : 'Attach',
              canonicalParts: bogieCanonical,
            };
          }
          joinSteps.push(bogieStep);
        }

        // Stage 6: Any remaining finish/connector pieces after the articulated joint is locked
        if (cleanFinishIndices.length > 0) {
          const { steps: connectorSteps } = buildStepsForIndexList(
            cleanFinishIndices,
            'join_conn',
            joinedPlaced,
            adaptiveMaxSpread,
          );
          joinSteps.push(...connectorSteps);
        }
      } else {
        const pendingAttach = [...mainAttachList];
        let pendingJoin = [...joinIndices];
        const countTouchEdges = (indices, targetSet) => {
          let edges = 0;
          for (const pi of indices) {
            for (const nb of (adj[pi] || [])) {
              if (targetSet.has(nb)) edges++;
            }
          }
          return edges;
        };
        const emitAttachItem = (item, isFirst) => {
          for (const pi of item.indices) joinedPlaced.add(pi);
          globalStep++;
          joinSteps.push({
            id: `join_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            parts: item.indices.map(i => parts[i]),
            attachedSubmodel: {
              id: item.id,
              name: item.name,
              repeatCount: 1,
              totalRepeatCount: 1,
              isSectionAttach: true,
              attachVerb: isFirst ? 'Place' : 'Connect',
              canonicalParts: item.canonicalParts,
            },
          });
        };

        if (pendingAttach.length > 0) {
          emitAttachItem(pendingAttach.shift(), true);
        }
        while (pendingAttach.length > 0) {
          let bestIdx = -1, bestEdges = 0;
          for (let i = 0; i < pendingAttach.length; i++) {
            const edges = countTouchEdges(pendingAttach[i].indices, joinedPlaced);
            if (edges > bestEdges) { bestEdges = edges; bestIdx = i; }
          }
          if (bestIdx >= 0) {
            emitAttachItem(pendingAttach.splice(bestIdx, 1)[0], false);
            continue;
          }
          if (pendingJoin.length > 0 && countTouchEdges(pendingJoin, joinedPlaced) > 0) {
            const { steps: bridgeSteps, placed: afterBridge } = buildStepsForIndexList(
              pendingJoin,
              'join_conn',
              joinedPlaced,
              adaptiveMaxSpread,
            );
            for (const pi of afterBridge) joinedPlaced.add(pi);
            joinSteps.push(...bridgeSteps);
            pendingJoin = [];
            continue;
          }
          emitAttachItem(pendingAttach.shift(), false);
        }

        if (pendingJoin.length > 0) {
          const { steps: connectorSteps } = buildStepsForIndexList(
            pendingJoin,
            'join_conn',
            joinedPlaced,
            adaptiveMaxSpread,
          );
          joinSteps.push(...connectorSteps);
        }
      }

      // Place minifigures BEFORE snapping on removable roofs/caps so interior figures can be seated easily!
      for (const nm of normalizedMinifigs) {
        appendMinifigPlacementSteps(joinSteps, nm, 'join');
      }

      // Snap removable tile-majority roofs / caps cleanly onto the finished model with crisp downward arrows!
      for (const cap of deferredCaps) {
        const capOffsets = {};
        let cx = 0, cz = 0;
        for (const i of cap.indices) { cx += boxes[i].center[0]; cz += boxes[i].center[2]; }
        cx /= Math.max(1, cap.indices.length);
        cz /= Math.max(1, cap.indices.length);
        let capArrowId = parts[cap.indices[0]]?.id || null;
        let bestCapD = Infinity;
        for (const i of cap.indices) {
          const d = Math.hypot(boxes[i].center[0] - cx, boxes[i].center[2] - cz);
          if (d < bestCapD) { bestCapD = d; capArrowId = parts[i].id; }
        }
        for (const i of cap.indices) {
          joinedPlaced.add(i);
          capOffsets[parts[i].id] = {
            x: 0,
            y: 44,
            z: 0,
            tilt: 0,
            arrow: parts[i].id === capArrowId,
          };
        }
        globalStep++;
        joinSteps.push({
          id: `join_cap_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          cue: 'none',
          stepHint: /roof/i.test(cap.name) ? 'Place removable roof' : 'Place removable cap',
          defaultPartOffsets: capOffsets,
          parts: cap.indices.map(i => parts[i]),
          attachedSubmodel: {
            id: cap.id,
            name: cap.name,
            repeatCount: 1,
            totalRepeatCount: 1,
            isSectionAttach: true,
            attachVerb: 'Place',
            canonicalParts: cap.canonicalParts,
          },
        });
      }

      if (joinSteps.length > 0) {
        chapters.push({
          id: `ach_${++chSeq}_connect`,
          name: mainAttachList.length === 2 ? 'Connect Halves & Finish' : 'Connect Sections & Finish',
          kind: 'main',
          sectionId: 'sec_connect',
          steps: joinSteps,
        });
      }

      optimizeMinifigPlacementCameras(chapters);
      const modCount = moduleSecs.length + (bogieCanonical ? 1 : 0);
      return {
        title: parsed.title,
        subtitle: `${parts.length} pieces · ${modCount} section${modCount === 1 ? '' : 's'} + final join`,
        chapters,
        _parsed: parsed,
        _mode: mode,
        _subdivisionPlan: subdivisionPlan,
      };
    }
  }

  groupedComps.forEach((group, secIdx) => {
    const sectionId = `sec_${secIdx + 1}`;
    const isFigSec = false;
    const indices = group.indices;
    const placed = new Set();
    const remaining = new Set(indices);
    const { belowMap, baseMinY } = buildVerticalPrereqMap(boxes, adj, roles, claddingFlags, indices);
    let curSteps = [];

    // Analyze support & overhead enclosure for minifigures belonging to this model section
    const indexSet = new Set(indices);
    const unplacedMinifigs = (sectionMinifigs[secIdx] || []).map((nm) => {
      const mfIdxSet = new Set(nm.indices);
      const wb = nm.worldBox;
      const supportSet = new Set();
      const overheadSet = new Set();
      for (const j of indices) {
        const b = boxes[j];
        const ovX = Math.min(wb.max[0] + 8, b.max[0]) - Math.max(wb.min[0] - 8, b.min[0]);
        const ovZ = Math.min(wb.max[2] + 8, b.max[2]) - Math.max(wb.min[2] - 8, b.min[2]);
        if (ovX > 2 && ovZ > 2 && b.max[1] <= wb.min[1] + 28 && b.max[1] >= wb.min[1] - 32) {
          supportSet.add(j);
        }
        const strictOvX = Math.min(wb.max[0], b.max[0]) - Math.max(wb.min[0], b.min[0]);
        const strictOvZ = Math.min(wb.max[2], b.max[2]) - Math.max(wb.min[2], b.min[2]);
        if (strictOvX >= 6 && strictOvZ >= 6 && b.min[1] >= wb.max[1] - 12) {
          overheadSet.add(j);
        }
      }
      for (const mi of mfIdxSet) {
        for (const nb of adj[mi]) {
          if (indexSet.has(nb) && boxes[nb].max[1] <= wb.min[1] + 32) supportSet.add(nb);
        }
      }
      return {
        nm,
        supportIndices: Array.from(supportSet),
        overheadIndices: overheadSet,
        isEnclosed: overheadSet.size > 0,
      };
    });

    const emitMinifigPlacement = (nm) => {
      // Position / rotate / pose minifigure right before placing it on the model!
      if (nm.needsTransform) {
        globalStep++;
        const poseCam = nm.poseCamera || MINIFIG_POSE_CAMERA;
        curSteps.push({
          id: `ac${secIdx + 1}_mfpose_${nm.id}_s${globalStep}`,
          num: globalStep,
          side: poseCam.side,
          corner: poseCam.corner,
          az: poseCam.az,
          el: poseCam.el,
          cue: 'none',
          isMinifigPoseStep: true,
          minifigPrep: {
            id: nm.id,
            name: nm.name,
            label: nm.transformLabel,
            canonicalParts: nm.canonicalParts,
            poseSummary: nm.poseSummary,
            indicators: nm.poseIndicators || [],
            ghostParts: nm.poseGhostParts || [],
            rotatedPartIds: nm.rotatedPartIds || [],
          },
          parts: nm.posedFrontParts || nm.posedPreviewParts,
        });
      }
      globalStep++;
      curSteps.push({
        id: `ac${secIdx + 1}_mfplace_${nm.id}_s${globalStep}`,
        num: globalStep,
        side: 'top',
        corner: 'front_right',
        cue: 'none',
        attachedMinifig: {
          id: nm.id,
          name: nm.name,
          repeatCount: 1,
          previewParts: nm.posedPreviewParts,
          canonicalParts: nm.canonicalParts,
          needsTransform: nm.needsTransform,
          transformLabel: nm.transformLabel,
          worldForward: nm.worldForward,
        },
        parts: nm.worldParts,
      });
    };

    const flushReadyEnclosedMinifigs = (upcomingIndices = null) => {
      for (let mi = 0; mi < unplacedMinifigs.length; ) {
        const entry = unplacedMinifigs[mi];
        if (!entry.isEnclosed) { mi++; continue; }
        const supportReady = entry.supportIndices.length > 0 && entry.supportIndices.every(s => placed.has(s));
        const aboutToEnclose = Boolean(upcomingIndices && placed.size > 0 && upcomingIndices.some(u => entry.overheadIndices.has(u)));
        if (supportReady || aboutToEnclose) {
          unplacedMinifigs.splice(mi, 1);
          emitMinifigPlacement(entry.nm);
        } else {
          mi++;
        }
      }
    };

    const isInstBlockedFromBelow = (instIndices) => {
      const instSet = new Set(instIndices);
      for (const pi of instIndices) {
        if (!remaining.has(pi)) continue;
        for (const u of belowMap[pi]) {
          if (!instSet.has(u) && remaining.has(u)) return true;
        }
      }
      return false;
    };

    const isPartBlockedFromBelow = (i) => {
      const di = partToDup.get(i);
      if (di) return isInstBlockedFromBelow(di.group.instances[di.instIdx]);
      return belowMap[i].some(u => remaining.has(u));
    };

    const flushMainSteps = () => {
      if (curSteps.length === 0) return;
      chapters.push({
        id: `ach_${++chSeq}`,
        name: group.name,
        kind: isFigSec ? 'minifigure' : 'main',
        sectionId,
        steps: curSteps,
      });
      curSteps = [];
    };

    while (remaining.size > 0) {
      let frontier;
      if (placed.size === 0) {
        const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i] && !isPartBlockedFromBelow(i));
        const pool = nonWheels.length > 0 ? nonWheels : Array.from(remaining);
        pool.sort((a, b) => layerY[a] - layerY[b]);
        const minY = layerY[pool[0]];
        const lowBand = pool.filter(i => layerY[i] <= minY + 32);
        lowBand.sort((a, b) => {
          const sa = (partToDup.has(a) ? -80 : 0) + (roles[a] === 'structural' || roles[a] === 'wheel_holder' ? 50 : 0) + adj[a].length * 6 - (layerY[a] - minY) * 0.8;
          const sb = (partToDup.has(b) ? -80 : 0) + (roles[b] === 'structural' || roles[b] === 'wheel_holder' ? 50 : 0) + adj[b].length * 6 - (layerY[b] - minY) * 0.8;
          return sb - sa;
        });
        frontier = lowBand;
      } else {
        const rawFrontier = Array.from(remaining).filter(i => adj[i].some(nb => placed.has(nb)));
        const unblocked = rawFrontier.filter(i =>
          !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed)
          && !isPartBlockedFromBelow(i)
        );
        const blockedSeeds = [];
        for (const i of rawFrontier) {
          if (!isPartBlockedFromBelow(i)) continue;
          const di = partToDup.get(i);
          if (di) {
            for (const pi of di.group.instances[di.instIdx]) if (remaining.has(pi)) blockedSeeds.push(pi);
          } else {
            blockedSeeds.push(i);
          }
        }
        const basePrereqs = blockedSeeds.length > 0
          ? collectBasePrereqs(blockedSeeds, belowMap, remaining, boxes, baseMinY).filter(u => !isPartBlockedFromBelow(u))
          : [];
        const merged = Array.from(new Set([...basePrereqs, ...unblocked]));
        if (merged.length > 0) {
          frontier = merged;
        } else {
          const claddingReady = rawFrontier.filter(i => !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed));
          frontier = claddingReady.length > 0 ? claddingReady : rawFrontier;
        }
        if (frontier.length === 0) {
          frontier = Array.from(remaining).sort((a, b) => layerY[a] - layerY[b]);
        }
        frontier.sort((a, b) => {
          const wa = roles[a] === 'wheel' ? 1 : 0, wb = roles[b] === 'wheel' ? 1 : 0;
          if (wa !== wb) return wa - wb;
          return Math.round(layerY[a] / 8) - Math.round(layerY[b] / 8) || (claddingFlags[a] ? 1 : 0) - (claddingFlags[b] ? 1 : 0) || parts[a].p.localeCompare(parts[b].p);
        });
      }

      const anchor = frontier[0];
      const dupInfo = partToDup.get(anchor);

      // DUPLICATE SUBMODEL HANDLING: Build 1 canonical copy with ×N, then attach copies cleanly!
      if (dupInfo) {
        const g = dupInfo.group;
        const readyInsts = [];
        g.instances.forEach((instIndices, instIdx) => {
          const unplacedInSec = instIndices.filter(pi => remaining.has(pi));
          if (unplacedInSec.length === 0) return;
          const isAnchorInst = instIdx === dupInfo.instIdx;
          const touchesPlaced = placed.size === 0 || unplacedInSec.some(pi => adj[pi].some(nb => placed.has(nb)));
          const underClear = !isInstBlockedFromBelow(instIndices);
          if (isAnchorInst || (touchesPlaced && underClear)) readyInsts.push(unplacedInSec);
        });

        const attachIndices = readyInsts.flat();
        flushReadyEnclosedMinifigs(attachIndices);

        // Emit the submodel's own step-by-step chapter ONCE right before its first attachment!
        if (!emittedSubChapters.has(g.id)) {
          flushMainSteps();
          const subSteps = buildLocalSubmodelSteps(g.canonicalParts, perStep, g.id, g.repeatCount);
          chapters.push({
            id: `subch_${++chSeq}_${g.id}`,
            name: g.name,
            kind: 'submodel',
            sectionId: `subsec_${g.id}`,
            repeatCount: g.repeatCount,
            canonicalParts: g.canonicalParts,
            steps: subSteps,
          });
          emittedSubChapters.add(g.id);
        }

        for (const pi of attachIndices) { remaining.delete(pi); placed.add(pi); }
        globalStep++;
        curSteps.push({
          id: `ac${secIdx+1}_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          cue: 'none',
          parts: attachIndices.map(i => parts[i]),
          attachedSubmodel: {
            id: g.id,
            name: g.name,
            repeatCount: readyInsts.length,
            totalRepeatCount: g.repeatCount,
            canonicalParts: g.canonicalParts,
          },
        });
        flushReadyEnclosedMinifigs();
        continue;
      }

      // NORMAL STEP (non-duplicate-submodel bricks)
      const placedBeforeStep = new Set(placed);
      const anchorY = layerY[anchor];
      const anchorC = boxes[anchor].center;
      const stepIndices = [anchor];
      remaining.delete(anchor);
      placed.add(anchor);

      while (stepIndices.length < perStep && remaining.size > 0) {
        const supportSet = placedBeforeStep.size > 0 ? placedBeforeStep : placed;
        const cands = Array.from(remaining).filter(i => {
          if (partToDup.has(i)) return false;
          if (isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, supportSet)) return false;
          if (Math.abs(layerY[i] - anchorY) > 12) return false;
          if (placedBeforeStep.size > 0) {
            if (belowMap[i].some(u => !placedBeforeStep.has(u))) return false;
            const touchesPrev = adj[i].some(nb => placedBeforeStep.has(nb));
            const sameBaseLayer = boxes[i].min[1] <= baseMinY + 24 && Math.abs(boxes[i].min[1] - boxes[anchor].min[1]) <= 4 && belowMap[i].length === 0;
            if (!touchesPrev && !sameBaseLayer) return false;
          } else {
            if (belowMap[i].length > 0) return false;
            const touchesCur = adj[i].some(nb => placed.has(nb));
            const sameBaseLayer = boxes[i].min[1] <= baseMinY + 24 && Math.abs(boxes[i].min[1] - boxes[anchor].min[1]) <= 4;
            if (!touchesCur && !sameBaseLayer) return false;
          }
          const d = Math.hypot(boxes[i].center[0]-anchorC[0], boxes[i].center[1]-anchorC[1], boxes[i].center[2]-anchorC[2]);
          return d <= adaptiveMaxSpread;
        });
        if (cands.length === 0) break;
        cands.sort((a, b) => {
          const score = (i) => {
            let s = 0;
            if (parts[i].p === parts[anchor].p && parts[i].c === parts[anchor].c) s += 85;
            else if (parts[i].p === parts[anchor].p) s += 35;
            if (roles[i] === roles[anchor]) s += 20;
            s -= Math.hypot(boxes[i].center[0]-anchorC[0], boxes[i].center[2]-anchorC[2]) * 0.45;
            s -= Math.abs(layerY[i] - anchorY) * 2.0;
            return s;
          };
          return score(b) - score(a);
        });
        const next = cands[0];
        stepIndices.push(next);
        remaining.delete(next);
        placed.add(next);
      }

      // If this step places an overhead roof brick over an enclosed minifig, pose & place that minifig right BEFORE!
      flushReadyEnclosedMinifigs(stepIndices);

      globalStep++;
      curSteps.push({
        id: `ac${secIdx+1}_s${globalStep}`,
        num: globalStep,
        side: 'top', corner: 'front_right', cue: 'none',
        parts: stepIndices.map(i => parts[i]),
      });

      // If this step finished the floor/seat under an enclosed minifig, pose & place it right now!
      flushReadyEnclosedMinifigs();
    }

    // Place any remaining open-air / exterior minifigures at the end of this build section
    while (unplacedMinifigs.length > 0) {
      const entry = unplacedMinifigs.shift();
      emitMinifigPlacement(entry.nm);
    }

    flushMainSteps();
  });

  optimizeMinifigPlacementCameras(chapters);
  const dupSummary = dupGroups.length > 0 ? ` · ${dupGroups.length} repeated submodel${dupGroups.length === 1 ? '' : 's'}` : '';
  return { title: parsed.title, subtitle: `${parts.length} pieces · ${globalStep} steps${dupSummary}`, chapters, _parsed: parsed, _mode: mode, _subdivisionPlan: null };
}

// =========================================================================
// 4. APPLICATION STATE, UNDO/REDO STACK & PAGINATION
// =========================================================================
const state = {
  model: null,
  themeId: 'blue',
  paperFormat: 'screen',   // screen | letter | a4 | square | custom
  orientation: 'landscape',// landscape | portrait
  customWidth: 10,         // stored in customUnit
  customHeight: 8,
  customUnit: 'in',        // 'in' | 'cm'
  density: 'balanced',     // compact | balanced | spacious
  showPrintGuides: false,
  layout: 'auto',          // auto | 1-up | 2-up | 4-up
  pacing: 'standard',      // few | standard | many
  detectDuplicates: true,  // auto-detect explicit + geometric duplicate submodels
  highlightNew: true,
  highlightColor: '#ff2d55',
  fadePrev: true,
  fadeOpacity: 0.82,
  showRotCues: true,
  showSizeGuides: true,
  minifigStyle: 'exploded', // 'exploded' (IMG_0316) | 'sequential' (IMG_0315) | 'classic'
  showMinifig1to1: false,
  showStepBorders: true,
  showPageTitle: true,
  pageNumberFormat: 'page_n', // 'number' | 'page_n' | 'n_of_total' | 'none'
  showExtras: true,
  overrides: {},           // keyed by stepId: { pin, side, corner, az, el, modelScale, pliScale, pliPos:{x,y}, calloutPos:{x,y}, calloutDir, calloutAsPages, minifigStyle, partOffsets:{ [partId]: {x,y,z,tilt,arrow} } }
  pageInserts: {},         // keyed by pageId: [ { id, kind:'text'|'image', text, src, x, y, scale } ]
  dividerAfter: {},        // keyed by pageId: { title, note }
  coverMeta: createDefaultCoverMeta(),
  completeMeta: { title:'Build Complete!', subtitle:'Ready for display!', az:315, el:28, bgSrc:null, showText:true, showFireworks:true },
  backMeta:  { title:'', subtitle:'Made with Brick Instruction Creator', az:38, el:24, bgSrc:null },
  bomConfig: {
    density: 'balanced',     // 'compact' | 'balanced' | 'spacious'
    flow: 'rows',            // 'rows' | 'columns'
    align: 'start',          // 'start' | 'center' | 'end'
    sortPrimary: 'color',    // 'color' | 'category' | 'qty' | 'size' | 'name'
    sortSecondary: 'category',
    showNames: true,
  },
  bomShortcutVisible: false,
  pages: [],
  pageIdx: 0,
  mode: 'pan',             // pan | edit | select | rotate | arrange
  selectedStepId: null,
  selectedPartIds: new Set(),
  selectedArrangeEl: null, // { stepId, kind:'pli'|'callout'|'insert', insertId? }
  zoom: 1,
  panX: 0,
  panY: 0,
  pendingImport: null,
  undoStack: [],
  redoStack: [],
};

// Keep hit-test projection metadata for active rendered step slots
let currentSlotRenderInfo = new Map();

function pushUndo() {
  if (!state.model) return;
  const snap = JSON.stringify({
    chapters: state.model.chapters,
    overrides: state.overrides,
    pageInserts: state.pageInserts,
    dividerAfter: state.dividerAfter,
    coverMeta: state.coverMeta,
    completeMeta: state.completeMeta,
    backMeta: state.backMeta,
  });
  state.undoStack.push(snap);
  if (state.undoStack.length > 35) state.undoStack.shift();
  state.redoStack = [];
}

function applyHistorySnap(json) {
  const s = JSON.parse(json);
  state.model.chapters = s.chapters;
  state.overrides = s.overrides;
  state.pageInserts = s.pageInserts;
  state.dividerAfter = s.dividerAfter;
  state.coverMeta = normalizeCoverMeta(s.coverMeta);
  if (s.completeMeta) state.completeMeta = s.completeMeta;
  state.backMeta = s.backMeta;
  state.selectedPartIds.clear();
  renderAll();
  const ovModal = document.getElementById('overviewModal');
  if (ovModal && !ovModal.classList.contains('hidden')) {
    renderOverviewModal();
  }
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3600);
}

function getAllSteps(model) { return model ? model.chapters.flatMap(ch => ch.steps.map(step => ({ ch, step }))) : []; }
function getMainSteps(model) { return model ? model.chapters.filter(ch => ch.kind !== 'submodel').flatMap(ch => ch.steps.map(step => ({ ch, step }))) : []; }
function getAllParts(model) {
  return getMainSteps(model)
    .filter(({ step }) => !step.isMinifigPoseStep && !(step.isMinifigBuildStep && step.placedInMain))
    .flatMap(x => x.step.parts);
}
function getEffectiveMinifigStyle(step) {
  const ovStyle = step ? state.overrides[step.id]?.minifigStyle : null;
  return normalizeMinifigStepStyle(ovStyle || state.minifigStyle);
}
function renumberContinuousSteps(model) {
  let mainNum = 0;
  for (const ch of model.chapters) {
    if (ch.kind === 'submodel') {
      const rep = ch.repeatCount ?? (ch.isSectionModule ? 1 : 2);
      ch.steps.forEach((s, idx) => {
        s.num = idx + 1;
        s.isSubmodelStep = true;
        s.isSubmodelFinal = idx === ch.steps.length - 1 && rep > 1;
        s.submodelRepeat = rep;
      });
    } else if (ch.kind === 'minifigure' && normalizeMinifigStepStyle(state.minifigStyle) !== 'classic') {
      ch.steps.forEach((s, idx) => { s.num = idx + 1; });
    } else {
      for (const s of ch.steps) s.num = ++mainNum;
    }
  }
}
function getPreviousPartsForStep(model, ch, step) {
  const prev = [];
  if (step.isStandaloneFigure || step.isMinifigPoseStep) return prev;
  if (ch.kind === 'submodel') {
    for (const s of ch.steps) { if (s.id === step.id) break; prev.push(...s.parts); }
    return prev;
  }
  const sec = ch.sectionId || ch.id;
  for (const c of model.chapters) {
    if (c.kind === 'submodel') continue;
    if ((c.sectionId || c.id) !== sec) continue;
    for (const s of c.steps) {
      if (s.id === step.id) return prev;
      if (s.isMinifigPoseStep || s.isStandaloneFigure) continue;
      prev.push(...s.parts);
    }
    if (c.id === ch.id) break;
  }
  return prev;
}
const submodelThumbCache = new Map();
function getSubmodelThumb(subObj, w = 220, h = 150) {
  if (!subObj || !subObj.canonicalParts?.length) return '';
  if (submodelThumbCache.size > 120) submodelThumbCache.clear();
  const k = `${subObj.id || subObj.name}_${w}x${h}`;
  if (submodelThumbCache.has(k)) return submodelThumbCache.get(k);
  const snap = renderSnapshot([], subObj.canonicalParts, 38, 28, w, h, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  submodelThumbCache.set(k, snap.url);
  return snap.url;
}
function getMinifigThumb(partsList, cacheKey, az = MINIFIG_BUILD_CAMERA.az, el = MINIFIG_BUILD_CAMERA.el, w = 140, h = 140) {
  if (!partsList?.length) return '';
  if (submodelThumbCache.size > 140) submodelThumbCache.clear();
  const k = `mf_${cacheKey}_${az}_${el}_${w}x${h}`;
  if (submodelThumbCache.has(k)) return submodelThumbCache.get(k);
  const snap = renderSnapshot([], partsList, az, el, w, h, 1.04, { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  submodelThumbCache.set(k, snap.url);
  return snap.url;
}

function formatPageNumber(num, total) {
  if (state.pageNumberFormat === 'none') return '';
  if (state.pageNumberFormat === 'number') return String(num);
  if (state.pageNumberFormat === 'n_of_total') return `${num} / ${total}`;
  return `Page ${num}`;
}

function getBomGridDimensions(isLandscape) {
  const d = state.bomConfig?.density || 'balanced';
  if (d === 'compact') return isLandscape ? { cols: 7, rows: 6, perPage: 42 } : { cols: 5, rows: 7, perPage: 35 };
  if (d === 'spacious') return isLandscape ? { cols: 4, rows: 4, perPage: 16 } : { cols: 3, rows: 5, perPage: 15 };
  return isLandscape ? { cols: 6, rows: 5, perPage: 30 } : { cols: 4, rows: 6, perPage: 24 };
}

function classifyBomCategory(part) {
  const name = (resolvePart(part.p).name || '').toLowerCase();
  if (classifyMinifigGroupKind(part, (pid) => resolvePart(pid).name) !== null) return [7, 'Minifigures'];
  if (/wheel|tire|tyre|rim|bogie|track/.test(name)) return [6, 'Wheels & Tires'];
  if (/window|door|glass|panel|windscreen|fence|lattice|frame/.test(name)) return [5, 'Windows & Panels'];
  if (/technic|axle|pin|beam|liftarm|gear|bush|connector|cross/.test(name)) return [4, 'Technic'];
  if (/slope|wedge|curved|cheese|roof|wing|cone|dish/.test(name)) return [3, 'Slopes & Wedges'];
  if (/tile/.test(name)) return [2, 'Tiles'];
  if (/plate|baseplate|jumper|bracket|hinge|turntable|clip|bar/.test(name)) return [1, 'Plates'];
  if (/brick|arch|cylinder|round|pillar|column/.test(name)) return [0, 'Bricks'];
  return [8, 'Other'];
}

function getColorSortKey(colorId) {
  const col = COLORS[colorId] || { name: `Color ${colorId}`, hex: '#9ea3a8' };
  const cname = (col.name || '').toLowerCase();
  const isSpecial = /trans|chrome|pearl|metal|glow|glitter/.test(cname);
  const hex = (col.hex || '#9ea3a8').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255 || 0;
  const g = parseInt(hex.slice(2, 4), 16) / 255 || 0;
  const b = parseInt(hex.slice(4, 6), 16) / 255 || 0;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lum = (max + min) / 2;
  const d = max - min;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * lum - 1));
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  // Group 0: Neutrals (white -> gray -> black), Group 1: Solid colors by hue, Group 2: Trans/Metallic
  const grp = isSpecial ? 2 : (sat < 0.14 ? 0 : 1);
  const ord = grp === 0 ? (1 - lum) : (hue / 360);
  return grp * 1000 + ord * 100 + (1 - lum) * 10;
}

function getSortedBomEntries(allParts) {
  const map = new Map();
  for (const p of allParts) {
    const k = `${p.p}:${p.c}`;
    if (!map.has(k)) {
      const meta = resolvePart(p.p);
      const [catIdx, catName] = classifyBomCategory(p);
      const sizeScore = (meta.sx || 1) * (meta.sz || 1) * ((meta.h || 8) / 8);
      map.set(k, { part: p, qty: 0, meta, catIdx, catName, colorKey: getColorSortKey(p.c), sizeScore });
    }
    map.get(k).qty++;
  }
  const cmpTrait = (a, b, trait) => {
    if (trait === 'color') return (a.colorKey - b.colorKey) || (a.part.c - b.part.c);
    if (trait === 'category') return (a.catIdx - b.catIdx) || a.meta.name.localeCompare(b.meta.name);
    if (trait === 'qty') return b.qty - a.qty;
    if (trait === 'size') return b.sizeScore - a.sizeScore;
    if (trait === 'name') return a.meta.name.localeCompare(b.meta.name);
    return 0;
  };
  const primary = state.bomConfig?.sortPrimary || 'color';
  const secondary = state.bomConfig?.sortSecondary || 'category';
  return Array.from(map.values()).sort((a, b) =>
    cmpTrait(a, b, primary)
    || cmpTrait(a, b, secondary)
    || (b.qty - a.qty)
    || a.meta.name.localeCompare(b.meta.name)
  );
}

// Exact fractional layout shared by live HTML & PDF Canvas so hanging rows/columns match 100%
function computeBomGridLayout(items, cols, rows, flow, align) {
  const n = items.length;
  const cells = [];
  if (n === 0) return cells;
  if (flow === 'columns') {
    const lastCol = Math.floor((n - 1) / rows);
    const rem = n - lastCol * rows;
    const shift = rem < rows ? (align === 'center' ? (rows - rem) / 2 : align === 'end' ? (rows - rem) : 0) : 0;
    for (let i = 0; i < n; i++) {
      const col = Math.floor(i / rows);
      const row = (i % rows) + (col === lastCol ? shift : 0);
      cells.push({ item: items[i], xFrac: col / cols, yFrac: row / rows, wFrac: 1 / cols, hFrac: 1 / rows });
    }
  } else {
    const lastRow = Math.floor((n - 1) / cols);
    const rem = n - lastRow * cols;
    const shift = rem < cols ? (align === 'center' ? (cols - rem) / 2 : align === 'end' ? (cols - rem) : 0) : 0;
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols);
      const col = (i % cols) + (row === lastRow ? shift : 0);
      cells.push({ item: items[i], xFrac: col / cols, yFrac: row / rows, wFrac: 1 / cols, hFrac: 1 / rows });
    }
  }
  return cells;
}

const FIREWORK_BURSTS = [
  { cx: 14, cy: 20, r: 9.5, rays: 12, color: '#f59e0b', sub: '#ef4444' },
  { cx: 86, cy: 19, r: 10.5, rays: 14, color: '#1a73e8', sub: '#38bdf8' },
  { cx: 12, cy: 76, r: 8.5, rays: 10, color: '#10b981', sub: '#fbbf24' },
  { cx: 88, cy: 74, r: 9.0, rays: 12, color: '#ec4899', sub: '#f59e0b' },
  { cx: 26, cy: 11, r: 5.5, rays: 8,  color: '#ef4444', sub: '#facc15' },
  { cx: 75, cy: 84, r: 6.0, rays: 8,  color: '#38bdf8', sub: '#8b5cf6' },
];

function buildFireworksSvg() {
  const els = [];
  for (const b of FIREWORK_BURSTS) {
    for (let i = 0; i < b.rays; i++) {
      const a = (i / b.rays) * Math.PI * 2;
      const isLong = i % 2 === 0;
      const r0 = b.r * 0.28;
      const r1 = b.r * (isLong ? 1.0 : 0.68);
      const x0 = (b.cx + Math.cos(a) * r0).toFixed(2);
      const y0 = (b.cy + Math.sin(a) * r0).toFixed(2);
      const x1 = (b.cx + Math.cos(a) * r1).toFixed(2);
      const y1 = (b.cy + Math.sin(a) * r1).toFixed(2);
      const col = isLong ? b.color : b.sub;
      els.push(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${col}" stroke-width="${isLong ? 0.65 : 0.45}" stroke-linecap="round" opacity="0.88"/>`);
      if (isLong) {
        const dx = (b.cx + Math.cos(a) * (r1 + 1.35)).toFixed(2);
        const dy = (b.cy + Math.sin(a) * (r1 + 1.35)).toFixed(2);
        els.push(`<circle cx="${dx}" cy="${dy}" r="0.52" fill="${b.sub}" opacity="0.9"/>`);
      }
    }
    els.push(`<circle cx="${b.cx}" cy="${b.cy}" r="0.9" fill="${b.color}" opacity="0.85"/>`);
  }
  return `<svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${els.join('')}</svg>`;
}

function drawFireworksCanvas(ctx, pxW, pxH) {
  const unit = Math.min(pxW, pxH) / 100;
  ctx.save();
  for (const b of FIREWORK_BURSTS) {
    const cx = (b.cx / 100) * pxW;
    const cy = (b.cy / 100) * pxH;
    const rad = b.r * unit;
    for (let i = 0; i < b.rays; i++) {
      const a = (i / b.rays) * Math.PI * 2;
      const isLong = i % 2 === 0;
      const r0 = rad * 0.28;
      const r1 = rad * (isLong ? 1.0 : 0.68);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.strokeStyle = isLong ? b.color : b.sub;
      ctx.lineWidth = Math.max(1.5, (isLong ? 0.65 : 0.45) * unit);
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.88;
      ctx.stroke();
      if (isLong) {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (r1 + 1.35 * unit), cy + Math.sin(a) * (r1 + 1.35 * unit), Math.max(1.5, 0.52 * unit), 0, Math.PI * 2);
        ctx.fillStyle = b.sub;
        ctx.globalAlpha = 0.9;
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, 0.9 * unit), 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.restore();
}

function rebuildPages() {
  if (!state.model) { state.pages = []; return; }
  renumberContinuousSteps(state.model);
  const pages = [];
  let pNum = 0;
  const isLandPage = state.paperFormat === 'screen'
    ? computePageFrameDimensions().isLandscape
    : getActivePagePhysicalInches()[0] >= getActivePagePhysicalInches()[1];
  if (state.showExtras) pages.push({ id:'cover', kind:'cover', num:++pNum, label:'Cover' });

  for (const ch of state.model.chapters) {
    let i = 0;
    let isFirstChPage = true;
    const isSubCh = ch.kind === 'submodel';
    const subRepeat = ch.repeatCount ?? (ch.isSectionModule ? 1 : 2);

    // Emit an official-style Bag / Stage opener divider page before each numbered bag chapter
    if (ch.kind === 'bag' && ch.steps.length > 0) {
      pages.push({
        id: `secdiv_${ch.id}`,
        kind: 'section_divider',
        num: ++pNum,
        label: ch.name,
        chapterName: ch.name,
        bagNumber: ch.bagNumber || 1,
        pieceCount: ch.pieceCount || ch.steps.reduce((acc, s) => acc + s.parts.length, 0),
        stepCount: ch.steps.length,
        firstStepNum: ch.steps[0].num,
        lastStepNum: ch.steps[ch.steps.length - 1].num,
        previewParts: ch.bagPreviewParts || ch.steps.flatMap(s => s.parts),
      });
    }

    while (i < ch.steps.length) {
      const first = ch.steps[i];
      const firstOv = state.overrides[first.id] || {};
      const isFirstMfBuild = Boolean((first.isStandaloneFigure || ch.kind === 'minifigure') && !first.isMinifigPoseStep);
      const firstMfStyle = isFirstMfBuild ? getEffectiveMinifigStyle(first) : 'classic';

      // Sequential Step-by-Step Minifigure Assembly (IMG_0315): 1 horizontal row per page (e.g. 1-3 then 4-6)
      if (isFirstMfBuild && firstMfStyle === 'sequential') {
        const seqPlan = getMinifigSequentialPlanForStep(first);
        const slices = paginateMinifigSequentialStages(seqPlan.stages.length, isLandPage);
        const mfTitle = first.minifigName || (ch.steps.length > 1 ? `Minifigure ${i + 1}` : 'Minifigure');
        for (const sl of slices) {
          const pgId = sl.pageIdx === 0 ? `pg_${first.id}` : `pg_${first.id}_seq${sl.pageIdx + 1}`;
          const stepLabel = sl.end - sl.start === 1 ? `Step ${sl.start + 1}` : `Steps ${sl.start + 1}–${sl.end}`;
          pages.push({
            id: pgId,
            kind: 'steps',
            num: ++pNum,
            label: `${mfTitle} · ${stepLabel}`,
            chapterName: mfTitle,
            isSubmodelPage: false,
            submodelIntro: null,
            pinned: sl.pageIdx === 0 ? Boolean(firstOv.pin) : false,
            slots: [{ ch, step: first, minifigSeqSlice: sl }],
          });
          if (state.dividerAfter[pgId]) {
            pages.push({ id: 'div_' + pgId, kind: 'divider', num: ++pNum, label: 'Divider Page', sourcePgId: pgId });
          }
        }
        i++;
        isFirstChPage = false;
        continue;
      }

      // Submodel converted to Full Pages gets its own dedicated page before attachment!
      if (first.subassembly && firstOv.calloutAsPages) {
        pages.push({
          id: 'subpg_' + first.id, kind: 'submodel_page', num: ++pNum,
          label: `${first.subassembly.name} (${first.subassembly.repeatCount}×)`,
          chapterName: ch.name, step: first, ch,
        });
      }
      const nextStep = ch.steps[i + 1];
      const isPosePlacePair = Boolean(first.isMinifigPoseStep && nextStep?.attachedMinifig);
      const cap = state.layout === 'auto'
        ? (isPosePlacePair
          ? 2
          : (isFirstMfBuild && firstMfStyle === 'exploded'
            ? (isLandPage && first.parts.length <= 7 ? 2 : 1)
            : (first.subassembly || first.attachedSubmodel || first.attachedMinifig || first.parts.length >= 6 ? 1 : 2)))
        : (state.layout === '1-up' ? 1 : state.layout === '2-up' ? 2 : 4);
      const slots = [];
      for (let k = 0; k < cap && i < ch.steps.length; k++) {
        const s = ch.steps[i];
        const isSMfBuild = Boolean((s.isStandaloneFigure || ch.kind === 'minifigure') && !s.isMinifigPoseStep);
        if (k > 0 && isSMfBuild && getEffectiveMinifigStyle(s) === 'sequential') break;
        if (k > 0 && state.overrides[s.id]?.pin) break;
        if (k > 0 && (s.subassembly || s.attachedSubmodel || (s.attachedMinifig && !isPosePlacePair) || s.isMinifigPoseStep) && state.layout === 'auto') break;
        slots.push({ ch, step: s });
        i++;
        if ((s.subassembly || s.attachedSubmodel || s.attachedMinifig) && state.layout === 'auto') break;
      }
      const allExplodedMf = slots.every(sl =>
        Boolean((sl.step.isStandaloneFigure || sl.ch.kind === 'minifigure') && !sl.step.isMinifigPoseStep) &&
        getEffectiveMinifigStyle(sl.step) === 'exploded',
      );
      const stepRange = slots.length === 1 ? `Step ${slots[0].step.num}` : `Steps ${slots[0].step.num}–${slots[slots.length-1].step.num}`;
      const label = allExplodedMf
        ? (slots.length === 1 ? (slots[0].step.minifigName || 'Minifigure') : `Minifigures ${slots[0].step.num}–${slots[slots.length - 1].step.num}`)
        : isSubCh
          ? (subRepeat > 1 ? `${ch.name} ×${subRepeat} · ${stepRange}` : `${ch.name} · ${stepRange}`)
          : (ch.kind === 'bag' ? `${ch.name} · ${stepRange}` : stepRange);
      const pgId = 'pg_' + slots[0].step.id;
      pages.push({
        id: pgId,
        kind: 'steps',
        num: ++pNum,
        label,
        chapterName: isSubCh && subRepeat > 1 ? `${ch.name} (×${subRepeat})` : ch.name,
        isSubmodelPage: isSubCh,
        submodelIntro: (isSubCh && isFirstChPage) ? {
          id: ch.id,
          name: ch.name,
          repeatCount: subRepeat,
          isSectionModule: Boolean(ch.isSectionModule),
          pieceCount: ch.pieceCount || (ch.canonicalParts ? ch.canonicalParts.length : 0),
          canonicalParts: ch.canonicalParts || [],
        } : null,
        pinned: Boolean(state.overrides[slots[0].step.id]?.pin),
        slots,
      });
      isFirstChPage = false;
      if (state.dividerAfter[pgId]) {
        pages.push({ id: 'div_' + pgId, kind: 'divider', num: ++pNum, label: 'Divider Page', sourcePgId: pgId });
      }
    }
  }
  if (state.showExtras) {
    // 1. Build Complete celebration page BEFORE Parts List
    pages.push({ id:'complete', kind:'complete', num:++pNum, label:'Build Complete' });

    // 2. Multi-page spillover Parts List (zero cut-off!)
    const allParts = getAllParts(state.model);
    const bomEntries = getSortedBomEntries(allParts);
    const isLand = isLandPage;
    const gridDims = getBomGridDimensions(isLand);
    const bomPageCount = Math.max(1, Math.ceil(bomEntries.length / gridDims.perPage));
    for (let bi = 0; bi < bomPageCount; bi++) {
      const slice = bomEntries.slice(bi * gridDims.perPage, (bi + 1) * gridDims.perPage);
      pages.push({
        id: `bom_${bi}`,
        kind: 'bom',
        num: ++pNum,
        label: bomPageCount > 1 ? `Parts List (${bi + 1}/${bomPageCount})` : 'Parts List',
        bomPageIdx: bi,
        bomPageCount,
        bomTotalUnique: bomEntries.length,
        bomTotalPieces: allParts.length,
        bomCols: gridDims.cols,
        bomRows: gridDims.rows,
        bomEntries: slice,
      });
    }

    // 3. Distinct Back Cover
    pages.push({ id:'back', kind:'back', num:++pNum, label:'Back Cover' });
  }
  state.pages = pages;
  if (state.pageIdx >= pages.length) state.pageIdx = Math.max(0, pages.length - 1);
}

function getStepCamera(step) {
  const ov = state.overrides[step.id] || {};
  const side = ov.side || step.side || 'top';
  const corner = ov.corner || step.corner || 'front_right';
  const cObj = CORNERS.find(c => c.id === corner) || CORNERS[0];
  return {
    side,
    corner,
    az: ov.az ?? (typeof step.az === 'number' ? step.az : cObj.az),
    el: ov.el ?? (typeof step.el === 'number' ? step.el : (side === 'bottom' ? -30 : 30)),
  };
}

function getActiveStepObj() {
  const pg = state.pages[state.pageIdx];
  if (!pg || pg.kind !== 'steps') return null;
  const found = pg.slots.find(s => s.step.id === state.selectedStepId) || pg.slots[0];
  if (found) state.selectedStepId = found.step.id;
  return found;
}

// =========================================================================
// 5. ZOOM & PAN ENGINE (Hardware-Accelerated CSS Transform — Zero Crash!)
// =========================================================================
let stageRafId = 0, lastZoomText = '', currentPageFitScale = 1;
function getEffectiveStageScale() {
  return Math.max(0.1, currentPageFitScale * state.zoom);
}
function getStageOrigin() {
  const stage = document.getElementById('stageViewport');
  if (!stage) return { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
  const rect = stage.getBoundingClientRect();
  const cs = getComputedStyle(stage);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const pt = parseFloat(cs.paddingTop) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  return {
    cx: rect.left + pl + (rect.width - pl - pr) / 2,
    cy: rect.top + pt + (rect.height - pt - pb) / 2,
  };
}
function flushStageTransform() {
  stageRafId = 0;
  const container = document.getElementById('stageContainer');
  if (!container) return;
  // Softly clamp pan so the page can't be lost completely offscreen
  const limX = Math.max(window.innerWidth * 0.75, window.innerWidth * state.zoom * 0.65);
  const limY = Math.max(window.innerHeight * 0.75, window.innerHeight * state.zoom * 0.65);
  state.panX = Math.max(-limX, Math.min(limX, state.panX));
  state.panY = Math.max(-limY, Math.min(limY, state.panY));
  const effScale = getEffectiveStageScale();
  container.style.transform = `translate3d(${state.panX.toFixed(2)}px, ${state.panY.toFixed(2)}px, 0) scale(${effScale.toFixed(4)})`;
  const txt = Math.round(state.zoom * 100) + '%';
  if (txt !== lastZoomText) {
    lastZoomText = txt;
    const lbl = document.getElementById('btnZoomFit');
    if (lbl) lbl.textContent = txt;
  }
}

function applyStageTransform() {
  if (!stageRafId) stageRafId = requestAnimationFrame(flushStageTransform);
}

function setZoom(nextZoom, focalX = null, focalY = null) {
  const prevZoom = state.zoom;
  const clamped = Math.max(0.45, Math.min(4.5, nextZoom));
  if (focalX !== null && focalY !== null) {
    const { cx, cy } = getStageOrigin();
    const vx = focalX - cx, vy = focalY - cy;
    const ratio = clamped / prevZoom;
    state.panX = vx - (vx - state.panX) * ratio;
    state.panY = vy - (vy - state.panY) * ratio;
  }
  state.zoom = clamped;
  if (Math.abs(state.zoom - 1) < 0.03 && focalX === null) { state.zoom = 1; state.panX = 0; state.panY = 0; }
  applyStageTransform();
}

function resetZoom() { state.zoom = 1; state.panX = 0; state.panY = 0; applyStageTransform(); }

function getActivePagePhysicalInches() {
  if (state.paperFormat === 'custom') {
    const div = state.customUnit === 'cm' ? 2.54 : 1;
    const wIn = Math.max(2, Math.min(48, (Number(state.customWidth) || 10) / div));
    const hIn = Math.max(2, Math.min(48, (Number(state.customHeight) || 8) / div));
    return [wIn, hIn];
  }
  const fmt = PAPER_FORMATS[state.paperFormat] || PAPER_FORMATS.letter;
  if (state.paperFormat === 'square') return [fmt.wIn, fmt.hIn];
  const shortSide = Math.min(fmt.wIn, fmt.hIn), longSide = Math.max(fmt.wIn, fmt.hIn);
  return state.orientation === 'portrait' ? [shortSide, longSide] : [longSide, shortSide];
}

function formatPhysicalDims(wIn, hIn) {
  const wCm = wIn * 2.54, hCm = hIn * 2.54;
  return `${wIn.toFixed(1)} × ${hIn.toFixed(1)} in · ${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm`;
}

function computePageFrameDimensions() {
  const [wIn, hIn] = getActivePagePhysicalInches();
  return computeCanonicalPageMetrics({
    paperFormat: state.paperFormat,
    widthIn: wIn,
    heightIn: hIn,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
  });
}

// =========================================================================
// 6. MAIN RENDERER (LIVE FULL-SCREEN PAGE + FLOATING CONTEXT OVERLAYS)
// =========================================================================
function getModelFileTypeInfo() {
  const rec = lastSourceRecord;
  const rawName = (rec?.fileName || '').trim();
  const lower = rawName.toLowerCase();
  if (lower.endsWith('.io') || rec?.kind === 'io') {
    return { badge: '.IO', label: 'BrickLink Studio (.io)', cls: 'bg-[#1a73e8]/15 text-[#1a73e8]' };
  }
  if (lower.endsWith('.mpd')) {
    return { badge: '.MPD', label: 'LDraw Multi-Part (.mpd)', cls: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300' };
  }
  if (lower.endsWith('.ldr') || rec?.kind === 'ldr') {
    return { badge: '.LDR', label: 'LDraw (.ldr)', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' };
  }
  if (rec?.kind === 'project' || lower.endsWith('.json')) {
    return { badge: '.JSON', label: 'Saved Project (.bic.json)', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' };
  }
  return { badge: 'MODEL', label: 'Imported Model', cls: 'bg-black/10 dark:bg-white/10 text-[var(--muted-foreground)]' };
}

function isSimpleEditPage(page) {
  return Boolean(page && (page.kind === 'cover' || page.kind === 'complete' || page.kind === 'back' || page.kind === 'divider' || page.kind === 'bom'));
}

function isPanGestureEnabled() {
  const page = state.pages[state.pageIdx];
  return state.mode === 'pan' || (page?.kind !== 'steps' && !isSimpleEditPage(page));
}

function renderAll() {
  if (activeLiveEngine) { activeLiveEngine.dispose(); activeLiveEngine = null; }
  currentSlotRenderInfo.clear();

  const hasModel = Boolean(state.model);
  document.getElementById('emptyState').classList.toggle('hidden', hasModel);
  document.getElementById('stageViewport').classList.toggle('hidden', !hasModel);
  document.getElementById('topRightPills').classList.toggle('hidden', !hasModel);
  document.getElementById('bottomDock').classList.toggle('hidden', !hasModel);

  const typeBadgeEl = document.getElementById('menuModelTypeBadge');
  const fileTypeEl = document.getElementById('menuModelFileType');
  const statsEl = document.getElementById('menuModelStats');

  if (!hasModel) {
    document.getElementById('desktopModelName').textContent = 'Brick Instruction Creator';
    document.getElementById('desktopModelMeta').textContent = '';
    document.getElementById('menuModelName').textContent = 'No model loaded';
    if (typeBadgeEl) typeBadgeEl.classList.add('hidden');
    if (fileTypeEl) { fileTypeEl.textContent = 'Import a model below to get started.'; fileTypeEl.classList.remove('hidden'); }
    if (statsEl) { statsEl.innerHTML = ''; statsEl.classList.add('hidden'); }
    document.getElementById('contextOverlay').classList.add('hidden');
    syncMenuControls();
    return;
  }

  rebuildPages();
  const theme = getActiveTheme();
  const allSteps = getAllSteps(state.model);
  const allParts = getAllParts(state.model);
  const ft = getModelFileTypeInfo();

  document.getElementById('desktopModelName').textContent = state.model.title;
  document.getElementById('desktopModelMeta').textContent = `· ${ft.badge} · ${allParts.length} pcs`;
  document.getElementById('menuModelName').textContent = state.model.title;
  if (typeBadgeEl) {
    typeBadgeEl.textContent = ft.badge;
    typeBadgeEl.className = `shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${ft.cls}`;
  }
  if (fileTypeEl) {
    fileTypeEl.textContent = ft.label;
    fileTypeEl.classList.remove('hidden');
  }
  if (statsEl) {
    statsEl.innerHTML = `
      <span class="px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)]">${allParts.length} pieces</span>
      <span class="px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)]">${allSteps.length} steps</span>
      <span class="px-2 py-0.5 rounded-full bg-[var(--card)] border border-[var(--border)]">${state.pages.length} pages</span>`;
    statsEl.classList.remove('hidden');
  }

  document.getElementById('btnUndo').disabled = state.undoStack.length === 0;
  document.getElementById('btnRedo').disabled = state.redoStack.length === 0;

  const page = state.pages[state.pageIdx];
  const fullLabel = `${page.label} · ${page.num}/${state.pages.length}`;
  document.getElementById('pageLabelText').textContent = page.label;
  const pageCountEl = document.getElementById('pageCountText');
  if (pageCountEl) pageCountEl.textContent = `· ${page.num}/${state.pages.length}`;
  document.getElementById('btnPageOverview').title = fullLabel;
  document.getElementById('prevPage').disabled = state.pageIdx <= 0;
  document.getElementById('nextPage').disabled = state.pageIdx >= state.pages.length - 1;

  const isSteps = page.kind === 'steps';
  const isSimpleEdit = isSimpleEditPage(page);
  if (isSteps && state.mode === 'edit') {
    state.mode = 'pan';
  }

  // Update Mode Pill visibility & styling for the current page type
  const modePill = document.getElementById('modePill');
  if (modePill) modePill.classList.toggle('hidden', !isSteps && !isSimpleEdit);
  document.querySelectorAll('.mode-btn').forEach(b => {
    const m = b.getAttribute('data-mode');
    const visible = m === 'pan'
      ? (isSteps || isSimpleEdit)
      : m === 'edit'
        ? isSimpleEdit
        : isSteps;
    const active = isSimpleEdit
      ? (m === 'pan' ? state.mode === 'pan' : m === 'edit' && state.mode !== 'pan')
      : m === state.mode;
    b.className = `mode-btn ${visible ? 'flex' : 'hidden'} px-2.5 sm:px-3 py-1.5 rounded-full items-center gap-1 whitespace-nowrap transition ${
      active ? 'bg-[#1a73e8] text-white shadow-xs' : 'opacity-75 hover:opacity-100'
    }`;
  });

  // Apply Canonical Physical Print / Screen Proportions & Unified Typography to Live Page Frame!
  const frame = document.getElementById('pageFrame');
  const dims = computePageFrameDimensions();
  currentPageFitScale = dims.fitScale;
  const typo = computePageTypography({
    widthIn: dims.widthIn,
    heightIn: dims.heightIn,
    pxPerInch: dims.pxPerInch,
    density: state.density,
    bomDensity: state.bomConfig?.density,
  });
  const padPx = typo.pad;
  const gapPx = typo.gap;
  const footerH = typo.footerH;
  const invFit = 1 / Math.max(0.25, dims.fitScale);
  frame.style.width = dims.width + 'px';
  frame.style.height = dims.height + 'px';
  frame.style.minHeight = '';
  frame.style.borderRadius = Math.round(14 * invFit) + 'px';
  frame.style.borderWidth = Math.max(1, Number(invFit.toFixed(2))) + 'px';
  frame.classList.remove('blueprint-grid');
  applyThemeBackgroundToElement(frame, theme);
  frame.style.color = theme.text;
  frame.innerHTML = '';
  // Apply stage scale immediately so there is never an unscaled flash before rAF
  flushStageTransform();

  const guideCls = (state.showPrintGuides && state.paperFormat !== 'screen') ? 'print-margin-guide' : '';
  const footerPadBottom = Math.max(4, Math.round(padPx * 0.42));

  // Render Page Contents
  if (page.kind === 'cover') {
    const dens = DENSITY_PAD[state.density] || DENSITY_PAD.balanced;
    const cm = normalizeCoverMeta(state.coverMeta);
    const title = (cm.title || state.model.title || 'Untitled Model').trim();
    const sub = (cm.subtitle || '').trim();
    const layout = computeCoverLayout({
      pageW: dims.width,
      pageH: dims.height,
      hasCreatorLogo: Boolean(cm.creatorLogoSrc),
      hasSubtitle: sub.length > 0,
      hasThemeImage: Boolean(cm.themeImageSrc),
      showQrCode: cm.showQrCode !== false,
      showProgramBadge: cm.showProgramBadge !== false,
      densityPadFactor: dens.pad / 20,
    });
    const heroScale = Math.min(2.2, 1600 / Math.max(layout.heroRect.w, layout.heroRect.h, 1));
    const snap = renderCoverHeroSnapshot(
      allParts,
      cm.az,
      cm.el,
      cm.zoom,
      Math.round(layout.heroRect.w * heroScale),
      Math.round(layout.heroRect.h * heroScale),
      theme,
    );
    const darkBg = isDarkHexColor(toHexColor(theme.bgColor || '#ffffff', '#ffffff'));
    const badgeSurface = darkBg ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.92)';
    const badgeBorder = darkBg ? 'rgba(255,255,255,0.20)' : 'rgba(15,23,42,0.14)';
    const badgeTextColor = darkBg ? '#f8fafc' : '#1e293b';
    const qrSvg = layout.qrCardRect
      ? buildQrSvg(PROGRAM_URL, {
          fg: '#111827',
          bg: '#ffffff',
          quietZone: 1,
          ariaLabel: `QR code for ${PROGRAM_NAME}`,
        })
      : '';
    const titleShadow = cm.bgSrc ? 'text-shadow:0 1px 8px rgba(0,0,0,0.28);' : '';
    const brandPadX = Math.max(6, Math.round(layout.brandCardRect.h * 0.18));
    const brandInnerGap = Math.max(5, Math.round(layout.brandCardRect.h * 0.14));

    frame.innerHTML = `
      <div class="relative w-full h-full overflow-hidden ${guideCls}" style="${cm.bgSrc ? `background-image:url(${cm.bgSrc});background-size:cover;background-position:center;` : ''}">
        <!-- High-Quality Page-Filling Hero Render -->
        <div class="absolute z-0 flex items-center justify-center pointer-events-none" style="left:${layout.heroRect.x}px;top:${layout.heroRect.y}px;width:${layout.heroRect.w}px;height:${layout.heroRect.h}px;">
          <img src="${snap.url}" alt="${escHtml(title)}" class="w-full h-full object-contain pointer-events-none select-none" />
        </div>

        <!-- Top-Left: Optional Creator Logo + Model Name + Optional Subtitle -->
        <div class="absolute z-10 flex flex-col items-start pointer-events-none" style="left:${layout.pad}px;top:${layout.pad}px;max-width:${layout.topLeftMaxW}px;">
          ${cm.creatorLogoSrc ? `
            <img src="${cm.creatorLogoSrc}" alt="Creator logo" class="block object-contain object-left pointer-events-none select-none" style="max-width:${layout.creatorLogoMaxW}px;max-height:${layout.creatorLogoMaxH}px;margin-bottom:${layout.creatorLogoGap}px;" />
          ` : ''}
          <h1 class="font-extrabold tracking-tight" style="font-size:${layout.titleFontPx}px;line-height:${layout.titleLineHeightPx}px;letter-spacing:-0.02em;color:${theme.text};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;${titleShadow}">${escHtml(title)}</h1>
          ${sub ? `
            <p class="font-medium" style="font-size:${layout.subtitleFontPx}px;line-height:1.25;margin-top:${layout.subtitleGap}px;color:${theme.muted};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;${titleShadow}">${escHtml(sub)}</p>
          ` : ''}
        </div>

        <!-- Top-Right: Optional Theming Image -->
        ${cm.themeImageSrc ? `
          <div class="absolute z-10 flex items-start justify-end pointer-events-none" style="right:${layout.pad}px;top:${layout.pad}px;max-width:${layout.topRightMaxW}px;max-height:${layout.topRightMaxH}px;">
            <img src="${cm.themeImageSrc}" alt="Theme image" class="block object-contain object-right-top pointer-events-none select-none" style="max-width:${layout.topRightMaxW}px;max-height:${layout.topRightMaxH}px;" />
          </div>
        ` : ''}

        <!-- Bottom-Right: Clickable Program Icon + Name + Optional QR Code -->
        ${layout.brandGroupRect.w > 0 ? `
          <a href="${PROGRAM_URL}" target="_blank" rel="noopener noreferrer" data-cover-link="true" title="Open ${PROGRAM_NAME}" class="absolute z-10 flex items-stretch hover:opacity-90 active:scale-[0.98] transition cursor-pointer" style="right:${layout.pad}px;bottom:${layout.pad}px;height:${layout.brandGroupRect.h}px;gap:${layout.brandGap}px;text-decoration:none;">
            <div class="flex items-center shrink-0 shadow-xs overflow-hidden" style="min-width:${layout.brandCardRect.w}px;height:${layout.brandCardRect.h}px;border-radius:${layout.cardRadius}px;padding:0 ${brandPadX}px;gap:${brandInnerGap}px;background:${badgeSurface};border:1px solid ${badgeBorder};backdrop-filter:blur(6px);">
              <svg class="shrink-0" style="width:${layout.brandIconSize}px;height:${layout.brandIconSize}px;" viewBox="0 0 64 64" fill="none" aria-hidden="true">${BRAND_LOGO_SVG_BODY}</svg>
              <div class="min-w-0 leading-tight" style="color:${badgeTextColor};">
                <div class="font-extrabold tracking-tight whitespace-nowrap" style="font-size:${layout.brandTitleFontPx}px;line-height:1.14;">Brick Instruction</div>
                <div class="font-semibold opacity-75 whitespace-nowrap" style="font-size:${layout.brandTitleFontPx}px;line-height:1.14;">Creator</div>
              </div>
            </div>
            ${layout.qrCardRect ? `
              <div class="shrink-0 shadow-xs overflow-hidden flex items-center justify-center" style="width:${layout.qrCardRect.w}px;height:${layout.qrCardRect.h}px;border-radius:${layout.cardRadius}px;padding:${layout.qrInnerInset}px;background:#ffffff;border:1px solid rgba(15,23,42,0.14);">
                <div class="w-full h-full">${qrSvg}</div>
              </div>
            ` : ''}
          </a>
        ` : ''}
      </div>`;
  } else if (page.kind === 'complete') {
    const cm = state.completeMeta;
    const snap = renderCoverHeroSnapshot(allParts, cm.az, cm.el, 1.0, Math.round(dims.width * 1.6), Math.round(dims.height * 1.15), theme);
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    const showText = cm.showText !== false;
    const showFw = cm.showFireworks !== false;
    frame.innerHTML = `
      <div class="relative w-full h-full text-center flex flex-col items-center justify-between overflow-hidden ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px;${cm.bgSrc ? `background-image:url(${cm.bgSrc});background-size:cover;background-position:center;` : ''}">
        ${showFw ? buildFireworksSvg() : ''}
        <div class="relative z-10 shrink-0 ${showText ? '' : 'hidden'}">
          <h2 class="font-extrabold leading-tight" style="font-size:${typo.complete.titleFont}px">${escHtml(cm.title || 'Build Complete!')}</h2>
          ${cm.subtitle ? `<p style="color:${theme.muted};font-size:${typo.complete.subtitleFont}px;margin-top:${Math.round(typo.pt(2.5))}px">${escHtml(cm.subtitle)}</p>` : ''}
        </div>
        <div class="relative z-10 flex-1 min-h-0 w-full overflow-hidden" style="margin:${Math.round(typo.pt(8))}px 0">
          <img src="${snap.url}" alt="Completed build" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="absolute z-10 flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${state.showPageTitle ? escHtml(state.model.title) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else if (page.kind === 'back') {
    const bm = state.backMeta;
    const credit = (!bm.subtitle || bm.subtitle === 'Created with Brick Instruction Creator')
      ? 'Made with Brick Instruction Creator'
      : bm.subtitle;
    frame.innerHTML = `
      <div class="relative w-full h-full text-center flex flex-col items-center justify-center overflow-hidden ${guideCls}" style="padding:${padPx + Math.round(typo.pt(8))}px;${bm.bgSrc ? `background-image:url(${bm.bgSrc});background-size:cover;background-position:center;` : ''}">
        <a href="${PROGRAM_URL}" target="_blank" rel="noopener noreferrer" data-cover-link="true" title="Open ${PROGRAM_NAME}" class="inline-flex flex-col items-center hover:opacity-90 transition cursor-pointer" style="gap:${Math.round(typo.pt(12))}px;text-decoration:none;">
          <div class="flex items-center justify-center shadow-sm" style="width:${typo.back.logoBox}px;height:${typo.back.logoBox}px;border-radius:${Math.round(typo.back.logoBox * 0.28)}px;background:${theme.pliBg};border:1px solid ${theme.pliBorder}">
            <svg style="width:${typo.back.logoIcon}px;height:${typo.back.logoIcon}px" viewBox="0 0 64 64" fill="none" aria-hidden="true">${BRAND_LOGO_SVG_BODY}</svg>
          </div>
          <span class="font-semibold" style="color:${theme.muted};font-size:${typo.back.creditFont}px">${escHtml(credit)}</span>
        </a>
      </div>`;
  } else if (page.kind === 'divider') {
    const d = state.dividerAfter[page.sourcePgId] || { title:'Section Divider', note:'' };
    frame.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center text-center ${guideCls}" style="padding:${padPx + Math.round(typo.pt(10))}px;gap:${Math.round(typo.pt(8))}px">
        <div class="font-extrabold" style="font-size:${typo.divider.customTitleFont}px">${escHtml(d.title)}</div>
        <div style="color:${theme.muted};font-size:${typo.divider.customNoteFont}px;max-width:${Math.round(typo.pt(320))}px">${escHtml(d.note || 'Switch to Edit mode to edit this divider page.')}</div>
      </div>`;
  } else if (page.kind === 'section_divider') {
    const snap = renderSnapshot([], page.previewParts || [], 38, 28, 720, 460, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    const pillPadX = Math.round(typo.pt(8));
    const pillPadY = Math.round(typo.pt(2.5));
    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between overflow-hidden ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        <div class="shrink-0 flex items-center justify-between" style="gap:${Math.round(typo.pt(12))}px">
          <div class="min-w-0">
            <span class="inline-block font-extrabold uppercase tracking-wider rounded-full text-white" style="background:${theme.accent};font-size:${typo.divider.badgeFont}px;padding:${pillPadY}px ${pillPadX}px;margin-bottom:${Math.round(typo.pt(4))}px">Build Stage ${page.bagNumber || 1}</span>
            <h2 class="font-extrabold tracking-tight leading-tight truncate" style="font-size:${typo.divider.titleFont}px">${escHtml(page.chapterName || page.label)}</h2>
          </div>
          <div class="shrink-0 flex flex-col items-end font-bold" style="gap:${Math.round(typo.pt(3))}px;font-size:${typo.divider.metaFont}px">
            <span class="rounded-full" style="background:${theme.pliBg};border:1px solid ${theme.pliBorder};padding:${pillPadY}px ${pillPadX}px">${page.pieceCount || 0} pcs</span>
            <span style="color:${theme.muted};font-size:${typo.divider.subMetaFont}px">Steps ${page.firstStepNum}–${page.lastStepNum}</span>
          </div>
        </div>
        <div class="relative flex-1 min-h-0 overflow-hidden" style="margin:${Math.round(typo.pt(8))}px 0">
          <img src="${snap.url}" alt="${escHtml(page.chapterName || 'Stage')}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${state.showPageTitle ? escHtml(state.model.title) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else if (page.kind === 'submodel_page') {
    const sub = page.step.subassembly;
    const snap = renderSnapshot([], sub.buildParts, 38, 30, 720, 460, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between overflow-hidden ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        <div class="shrink-0 flex items-center justify-between">
          <h2 class="font-extrabold" style="font-size:${typo.submodelPage.titleFont}px">${escHtml(sub.name)}</h2>
          <span class="rounded-full font-bold text-white" style="background:${theme.accent};font-size:${typo.submodelPage.badgeFont}px;padding:${Math.round(typo.pt(2.5))}px ${Math.round(typo.pt(8))}px">Build ${sub.repeatCount}×</span>
        </div>
        <div class="relative flex-1 min-h-0 overflow-hidden" style="margin:${Math.round(typo.pt(8))}px 0">
          <img src="${snap.url}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${state.showPageTitle ? escHtml(page.chapterName) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else if (page.kind === 'bom') {
    const cfg = state.bomConfig;
    const cols = page.bomCols || 6;
    const rows = page.bomRows || 5;
    const entries = page.bomEntries || [];
    const cells = computeBomGridLayout(entries, cols, rows, cfg.flow, cfg.align);
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    const bt = typo.bom;

    frame.innerHTML = `
      <div id="bomPageTapArea" class="relative w-full h-full flex flex-col overflow-hidden cursor-pointer ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        <div class="shrink-0 flex items-baseline justify-between border-b" style="border-color:${theme.pliBorder};padding-bottom:${bt.headerPb}px;margin-bottom:${bt.headerMb}px;gap:${Math.round(typo.pt(8))}px">
          <div class="flex items-baseline min-w-0" style="gap:${Math.round(typo.pt(8))}px">
            <h2 class="font-bold truncate leading-tight" style="font-size:${bt.titleFont}px">Parts List</h2>
            ${page.bomPageCount > 1 ? `<span class="font-semibold opacity-70 shrink-0" style="font-size:${bt.pageCountFont}px">${page.bomPageIdx + 1} / ${page.bomPageCount}</span>` : ''}
          </div>
          <span class="shrink-0 font-medium" style="color:${theme.muted};font-size:${bt.summaryFont}px">${page.bomTotalPieces} pcs · ${page.bomTotalUnique} unique</span>
        </div>
        <div class="relative flex-1 min-h-0 w-full">
          ${cells.map(({ item, xFrac, yFrac, wFrac, hFrac }) => {
            const { part, qty, meta } = item;
            const thumb = getPliThumb(part);
            return `<div class="absolute flex flex-col items-center justify-end text-center overflow-hidden" style="left:${(xFrac*100).toFixed(4)}%;top:${(yFrac*100).toFixed(4)}%;width:${(wFrac*100).toFixed(4)}%;height:${(hFrac*100).toFixed(4)}%;padding:${bt.cellPadY}px ${bt.cellPadX}px;background:transparent">
              <div class="relative flex-1 min-h-0 w-full">
                <img src="${thumb}" alt="${escHtml(meta.name)}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" style="padding:${bt.imgPad}px" />
              </div>
              <div class="shrink-0 font-extrabold" style="font-size:${bt.qtyFont}px;line-height:1.15;margin-top:${bt.textGap}px">${qty}×</div>
              ${cfg.showNames ? `<div class="shrink-0 font-medium truncate w-full opacity-80" style="font-size:${bt.nameFont}px;line-height:1.2;margin-top:${Math.max(1, Math.round(bt.textGap * 0.6))}px;padding:0 ${Math.round(typo.pt(1.5))}px" title="${escHtml(meta.name)}">${escHtml(meta.name)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${state.showPageTitle ? escHtml(state.model.title) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;

    const tapArea = frame.querySelector('#bomPageTapArea');
    if (tapArea) {
      tapArea.addEventListener('click', () => {
        state.bomShortcutVisible = !state.bomShortcutVisible;
        renderContextOverlay(page);
      });
    }
  } else {
    // STEPS PAGE
    const activeObj = getActiveStepObj();
    const slots = page.slots;
    const gridCls = slots.length === 1 ? 'grid-cols-1 grid-rows-1'
      : slots.length === 2 ? (dims.isLandscape ? 'grid-cols-2 grid-rows-1' : 'grid-cols-1 grid-rows-2')
      : 'grid-cols-2 grid-rows-2';

    const subIntroImg = page.submodelIntro ? getSubmodelThumb(page.submodelIntro, 240, 150) : null;
    const effectivePageHIn = dims.heightIn;
    const slotCols = slots.length === 1 ? 1 : slots.length === 2 ? (dims.isLandscape ? 2 : 1) : 2;
    const slotRows = Math.ceil(slots.length / slotCols);
    const estSlotW = Math.max(140, (dims.width - padPx * 2 - gapPx * (slotCols - 1)) / slotCols);
    const estSlotH = Math.max(140, (dims.height - padPx * 2 - footerH - gapPx * (slotRows - 1)) / slotRows);

    const slotData = slots.map(({ ch, step, minifigSeqSlice }) => {
      const prev = getPreviousPartsForStep(state.model, ch, step);
      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const modelScale = ov.modelScale || 1.0;
      const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
      const mfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : 'classic';
      const isMfExploded = isMfBuild && mfStyle === 'exploded';
      const isMfSeq = isMfBuild && mfStyle === 'sequential';
      const effectivePartOffsets = step.defaultPartOffsets
        ? { ...step.defaultPartOffsets, ...(ov.partOffsets || {}) }
        : (ov.partOffsets || {});
      const mfPrep = step.isMinifigPoseStep ? step.minifigPrep : null;
      const opts = {
        highlightNew: state.highlightNew, highlightColor: state.highlightColor,
        fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity,
        showArrows: true, accent: theme.accent, ov,
        partOffsets: effectivePartOffsets,
        selectedPartIds: state.mode === 'select' && state.selectedStepId === step.id ? state.selectedPartIds : null,
        ...(mfPrep ? {
          minifigIndicators: mfPrep.indicators || [],
          ghostParts: mfPrep.ghostParts || [],
          highlightOnlyPartIds: new Set(mfPrep.rotatedPartIds || []),
        } : {}),
      };
      const rw = slots.length === 1 ? 760 : 500, rh = slots.length === 1 ? 500 : 360;
      const snap = renderSnapshot(prev, step.parts, cam.az, cam.el, rw, rh, modelScale, opts);
      currentSlotRenderInfo.set(step.id, { ch, step, prev, cam, ov, snap, modelScale });

      let mfExploded = null;
      let mfSeqStages = null;
      if (isMfExploded) {
        const expW = slots.length === 1 ? 920 : 640;
        const expH = slots.length === 1 ? 640 : 480;
        mfExploded = renderMinifigExplodedDiagram(step, cam, expW, expH, theme, modelScale);
      } else if (isMfSeq) {
        const seqPlan = getMinifigSequentialPlanForStep(step);
        const sl = minifigSeqSlice || { start: 0, end: seqPlan.stages.length, cols: Math.min(3, seqPlan.stages.length), pageIdx: 0, pageCount: 1 };
        const visibleStages = seqPlan.stages.slice(sl.start, sl.end);
        const stW = visibleStages.length >= 4 ? 320 : visibleStages.length === 3 ? 380 : 440;
        const stH = visibleStages.length >= 4 ? 460 : 540;
        mfSeqStages = visibleStages.map(st => ({
          stage: st,
          img: renderMinifigSequentialStage(step, st, seqPlan, cam, stW, stH, theme, modelScale),
        }));
      }

      const subImg = (step.subassembly && !ov.calloutAsPages)
        ? renderSnapshot([], step.subassembly.buildParts, 38, 30, 260, 180, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent }).url
        : null;
      const attSubImg = step.attachedSubmodel ? getSubmodelThumb(step.attachedSubmodel, 160, 120) : null;
      const mfPrepImg = step.minifigPrep
        ? getMinifigThumb(step.minifigPrep.canonicalParts, `prep_${step.minifigPrep.id}`, MINIFIG_BUILD_CAMERA.az, MINIFIG_BUILD_CAMERA.el, 120, 120)
        : null;
      const attMfImg = step.attachedMinifig
        ? getMinifigThumb(
            step.attachedMinifig.previewParts || step.attachedMinifig.canonicalParts,
            `att_${step.attachedMinifig.id}`,
            Math.round(cam.az),
            Math.round(Math.min(30, Math.max(16, cam.el))),
            120,
            120,
          )
        : null;
      const allowMf1to1OnPage = !isMfSeq || !minifigSeqSlice || minifigSeqSlice.pageIdx === minifigSeqSlice.pageCount - 1;
      const mf1to1 = (state.showMinifig1to1 && isMfBuild && allowMf1to1OnPage)
        ? renderMinifigOneToOne(step.parts, dims.height, effectivePageHIn, Math.round(estSlotW * (isMfSeq ? 0.24 : 0.32)), Math.round(estSlotH * 0.64), theme.accent)
        : null;

      // Group PLI items + detect 1:1 Actual-Size Guides (skip individual bricks on official exploded/sequential minifig styles or submodel attachments!)
      const pliMap = new Map();
      if (!step.attachedSubmodel && !step.attachedMinifig && !step.minifigPrep && !isMfExploded && !isMfSeq) {
        for (const p of step.parts) {
          const k = `${p.p}:${p.c}`;
          if (!pliMap.has(k)) pliMap.set(k, { part: p, ids: [], qty: 0, guide: getActualSizeGuide(p.p) });
          const item = pliMap.get(k);
          item.qty++; item.ids.push(p.id);
        }
      }
      return { ch, step, minifigSeqSlice, prev, cam, ov, snap, isMfBuild, isMfExploded, isMfSeq, mfExploded, mfSeqStages, subImg, attSubImg, mfPrepImg, attMfImg, mf1to1, pli: Array.from(pliMap.values()) };
    });

    const isRotateMode = state.mode === 'rotate';
    const isArrangeMode = state.mode === 'arrange';
    const isTightSlot = slots.length >= 4 || estSlotH < typo.pt(260);
    const st = typo.steps;
    const stepNumPx = slots.length === 1 ? st.stepNum1Up : (isTightSlot ? st.stepNumTight : st.stepNum2Up);
    const pliThumbPx = isTightSlot ? st.pliThumbTight : st.pliThumb;
    const pliQtyPx = isTightSlot ? st.pliQtyFontTight : st.pliQtyFont;
    const pgNumText = formatPageNumber(page.num, state.pages.length);

    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col overflow-hidden ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        ${page.submodelIntro ? `
          <div class="shrink-0 flex items-center justify-between shadow-xs overflow-hidden" style="margin-bottom:${Math.round(typo.pt(7))}px;padding:${Math.round(typo.pt(5))}px ${Math.round(typo.pt(10))}px;border-radius:${Math.round(typo.pt(10))}px;gap:${Math.round(typo.pt(10))}px;background:${theme.calloutBg};border:1.5px solid ${theme.calloutBorder}">
            <div class="flex items-center min-w-0 flex-1" style="gap:${Math.round(typo.pt(8))}px">
              <img src="${subIntroImg}" alt="${escHtml(page.submodelIntro.name)}" style="width:${st.introThumbW}px;height:${st.introThumbH}px" class="object-contain shrink-0 pointer-events-none" />
              <div class="min-w-0 flex-1 overflow-hidden">
                <div class="font-bold uppercase tracking-wider opacity-65 truncate" style="font-size:${st.introLabelFont}px">${page.submodelIntro.isSectionModule ? 'Build Section' : 'Submodel'}</div>
                <div class="font-extrabold truncate" style="font-size:${st.introTitleFont}px">${escHtml(page.submodelIntro.name)}</div>
              </div>
            </div>
            <span class="shrink-0 rounded-full font-black text-white shadow-xs" style="background:${theme.accent};font-size:${st.introPillFont}px;padding:${Math.round(typo.pt(3))}px ${Math.round(typo.pt(10))}px">${page.submodelIntro.repeatCount > 1 ? `×${page.submodelIntro.repeatCount}` : `${page.submodelIntro.pieceCount || page.submodelIntro.canonicalParts.length} pcs`}</span>
          </div>` : ''}
        <div class="grid ${gridCls} flex-1 min-h-0" style="gap:${gapPx}px">
          ${slotData.map(({ ch, step, minifigSeqSlice, ov, snap, isMfExploded, isMfSeq, mfExploded, mfSeqStages, subImg, attSubImg, mfPrepImg, attMfImg, mf1to1, pli }) => {
            const isSelStep = state.selectedStepId === step.id;
            const showLive3D = isRotateMode && isSelStep;
            const isOfficialMfStyle = isMfExploded || isMfSeq;
            const pliScale = ov.pliScale || (isTightSlot ? 0.92 : 1.0);
            const pliPos = ov.pliPos || { x: 0, y: 0 };
            const calloutPos = ov.calloutPos || { x: 0, y: 0 };
            const calloutSel = isArrangeMode && state.selectedArrangeEl?.stepId === step.id && state.selectedArrangeEl?.kind === 'callout';
            const pliSel = isArrangeMode && state.selectedArrangeEl?.stepId === step.id && state.selectedArrangeEl?.kind === 'pli';
            const showSlotFrame = state.showStepBorders && !(isOfficialMfStyle && slots.length === 1);
            const slotBorderStyle = showSlotFrame
              ? (isSelStep && state.mode !== 'pan' ? `2px solid ${theme.accent}` : `1px solid ${theme.pliBorder}`)
              : (isSelStep && state.mode !== 'pan' && slots.length > 1 ? `1.5px dashed ${theme.accent}` : '1px solid transparent');
            const slotBgStyle = showSlotFrame ? 'rgba(255,255,255,0.05)' : 'transparent';

            const calloutPliScale = ov.pliScale || 1.0;
            const calloutPliStyle = `gap:${Math.round(typo.pt(isTightSlot ? 4.5 : 6))}px;padding:${Math.round(typo.pt(3.5))}px ${Math.round(typo.pt(isTightSlot ? 5.5 : 7))}px;border-radius:${Math.round(typo.pt(8))}px;background:${theme.calloutBg};border:${pliSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${calloutPliScale});transform-origin:top left;`;
            const renderCalloutPli = (imgSrc, imgW, imgH, topText, topWeightCls, nameText) => `
              <div data-drag="pli" data-step="${step.id}" title="${escHtml(`${topText} — ${nameText}`)}" class="draggable-el flex items-center shadow-xs w-fit max-w-full min-w-0 overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="${calloutPliStyle}">
                <img src="${imgSrc}" alt="${escHtml(nameText)}" style="width:${imgW}px;height:${imgH}px" class="shrink-0 object-contain pointer-events-none" />
                <div class="min-w-0 flex-1 overflow-hidden leading-tight">
                  <div class="${topWeightCls} truncate" style="color:${theme.accent};font-size:${st.pliSubCountFont}px">${escHtml(topText)}</div>
                  <div class="font-semibold opacity-75 truncate" style="font-size:${st.pliSubNameFont}px">${escHtml(nameText)}</div>
                </div>
              </div>`;

            const pliBoxHtml = isOfficialMfStyle
              ? ''
              : step.attachedSubmodel
              ? renderCalloutPli(
                  attSubImg,
                  isTightSlot ? st.pliSubThumbWTight : st.pliSubThumbW,
                  isTightSlot ? st.pliSubThumbHTight : st.pliSubThumbH,
                  step.attachedSubmodel.isSectionAttach ? (step.attachedSubmodel.attachVerb || 'Connect') : `×${step.attachedSubmodel.repeatCount}`,
                  'font-black',
                  step.attachedSubmodel.name || 'Submodel',
                )
              : step.minifigPrep
              ? renderCalloutPli(
                  mfPrepImg,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  step.minifigPrep.label || 'Position',
                  'font-extrabold',
                  step.minifigPrep.name || 'Minifigure',
                )
              : step.attachedMinifig
              ? renderCalloutPli(
                  attMfImg,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  `×${step.attachedMinifig.repeatCount || 1}`,
                  'font-black',
                  step.attachedMinifig.name || 'Minifigure',
                )
              : (!step.subassembly || ov.calloutAsPages ? `
                <div data-drag="pli" data-step="${step.id}" class="draggable-el flex items-center flex-wrap shadow-xs w-fit max-w-full min-w-0 ${isArrangeMode ? 'cursor-move' : ''}" style="gap:${Math.round(typo.pt(5))}px;padding:${Math.round(typo.pt(2.5))}px ${Math.round(typo.pt(6))}px;border-radius:${Math.round(typo.pt(8))}px;background:${theme.pliBg};border:${pliSel ? `2px solid ${theme.accent}` : `1px solid ${theme.pliBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${pliScale});transform-origin:top left;">
                  ${pli.slice(0, 7).map(item => {
                    const anySel = state.mode === 'select' && item.ids.some(id => state.selectedPartIds.has(id));
                    const thumb = getPliThumb(item.part);
                    return `<button type="button" data-pli-ids="${item.ids.join(',')}" data-step="${step.id}" class="pli-chip flex flex-col items-center rounded-lg transition ${anySel ? 'ring-2 ring-[#1a73e8] bg-[#1a73e8]/15' : ''}" style="padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(2))}px" title="${escHtml(resolvePart(item.part.p).name)}">
                      <div class="flex items-center font-bold" style="gap:${Math.round(typo.pt(2.5))}px;font-size:${pliQtyPx}px">
                        <img src="${thumb}" style="width:${pliThumbPx}px;height:${pliThumbPx}px" class="shrink-0 object-contain pointer-events-none" />
                        <span>${item.qty}×</span>
                      </div>
                      ${state.showSizeGuides && item.guide ? `
                        <div class="flex items-center font-extrabold rounded-full bg-black/10 dark:bg-white/15" style="gap:${Math.round(typo.pt(3))}px;font-size:${st.pliGuideFont}px;padding:0 ${Math.round(typo.pt(3.5))}px">
                          <span class="inline-block rounded-full bg-current" style="height:${Math.max(2, Math.round(typo.pt(2.5)))}px;width:${Math.min(34, Math.round(item.guide.lengthL * typo.pt(3)))}px"></span>
                          <span>1:1 ${item.guide.lengthL}L</span>
                        </div>` : ''}
                    </button>`;
                  }).join('')}
                </div>` : '');

            const headerBadgesHtml = [
              step.stepHint ? `<span class="font-bold rounded-full bg-white text-[#202124] shadow-xs whitespace-nowrap max-w-full truncate" style="border:1.5px solid ${theme.accent};font-size:${st.cueFont}px;padding:${Math.round(typo.pt(2))}px ${Math.round(typo.pt(6))}px">${escHtml(step.stepHint)}</span>` : '',
              step.minifigPrep ? `<span class="font-bold rounded-full bg-white text-[#202124] shadow-xs whitespace-nowrap max-w-full truncate" style="border:1.5px solid ${theme.accent};font-size:${st.cueFont}px;padding:${Math.round(typo.pt(2))}px ${Math.round(typo.pt(6))}px">↻ Prepare</span>` : '',
              state.showRotCues && step.cue && step.cue !== 'none' ? `<span class="font-bold rounded-full bg-white text-[#202124] shadow-xs whitespace-nowrap max-w-full truncate" style="border:1.5px solid ${theme.accent};font-size:${st.cueFont}px;padding:${Math.round(typo.pt(2))}px ${Math.round(typo.pt(6))}px">↻ ${step.cue === 'flip_vertical' ? 'Flip Over' : step.cue === 'yaw_180' ? 'Turn 180°' : 'Rotate 90°'}</span>` : '',
            ].filter(Boolean).join('');
            const stackHeaderBadges = Boolean(headerBadgesHtml) && (isTightSlot || estSlotW < typo.pt(250));

            return `
              <div data-step="${step.id}" class="step-slot relative flex flex-col min-h-0 overflow-hidden transition ${isArrangeMode && slots.length > 1 ? 'cursor-pointer' : ''}" style="border-radius:${typo.borderRadius}px;padding:${isOfficialMfStyle ? Math.round(st.slotPad * 0.5) : st.slotPad}px;border:${slotBorderStyle};background:${slotBgStyle}">
                <!-- Step Number & Draggable Parts List Box -->
                ${(() => {
                  const pinIconPx = Math.round(st.cueFont * 1.05);
                  const pinBadgeHtml = hasStepPageBreak(state.overrides, step.id, { step, minifigSeqSlice })
                    ? `<span class="no-print inline-flex items-center font-bold rounded-full bg-[#1a73e8]/15 text-[#1a73e8] shrink-0 whitespace-nowrap" style="gap:${Math.round(typo.pt(2))}px;font-size:${st.cueFont}px;padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(5))}px" title="Page break: Step ${step.num} always starts a new page so earlier edits won't shift later pages"><svg style="width:${pinIconPx}px;height:${pinIconPx}px" class="shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4"/><path d="M10 12h4"/><path d="M17 12h4"/><path d="M6 4v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4"/><path d="M6 20v-3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg><span>Page Break</span></span>`
                    : '';
                  if (isOfficialMfStyle) {
                    const showMfLabel = ch.steps.length > 1 || slots.length > 1;
                    if (!showMfLabel && !pinBadgeHtml && !headerBadgesHtml) return '';
                    return `
                <div class="relative z-10 shrink-0 flex items-center justify-between gap-1.5 px-1 min-w-0">
                  <div class="flex items-center gap-1.5 min-w-0">
                    ${showMfLabel ? `<span class="font-bold tracking-tight opacity-75 truncate" style="font-size:${st.pliSubNameFont}px">${escHtml(step.minifigName || `Minifigure ${step.num}`)}</span>` : ''}
                    ${pinBadgeHtml}
                  </div>
                  ${headerBadgesHtml ? `<div class="flex items-center gap-1 shrink-0">${headerBadgesHtml}</div>` : ''}
                </div>`;
                  }
                  return stackHeaderBadges ? `
                <div class="relative z-10 shrink-0 flex flex-col min-w-0" style="gap:${Math.round(typo.pt(4))}px">
                  <div class="flex items-center justify-between min-w-0" style="gap:${Math.round(typo.pt(4))}px">
                    <div class="flex items-center min-w-0 shrink-0" style="gap:${Math.round(typo.pt(4))}px">
                      <span class="font-extrabold leading-none shrink-0" style="font-size:${stepNumPx}px">${step.num}</span>
                      ${pinBadgeHtml}
                    </div>
                    <div class="flex items-center min-w-0 max-w-[75%] justify-end" style="gap:${Math.round(typo.pt(4))}px">${headerBadgesHtml}</div>
                  </div>
                  ${pliBoxHtml ? `<div class="min-w-0 max-w-full">${pliBoxHtml}</div>` : ''}
                </div>` : `
                <div class="relative z-10 shrink-0 flex items-start justify-between min-w-0" style="gap:${Math.round(typo.pt(5))}px">
                  <div class="flex items-start flex-wrap min-w-0 flex-1" style="gap:${Math.round(typo.pt(6))}px">
                    <span class="font-extrabold leading-none shrink-0" style="font-size:${stepNumPx}px">${step.num}</span>
                    ${pinBadgeHtml}
                    ${pliBoxHtml}
                  </div>
                  ${headerBadgesHtml ? `<div class="flex items-center shrink-0 flex-wrap justify-end max-w-[45%]" style="gap:${Math.round(typo.pt(4))}px">${headerBadgesHtml}</div>` : ''}
                </div>`;
                })()}

                <!-- Step Visual Area (Callout + 3D Render / Official Minifig Style + Optional 1:1 Minifig Card — STRICT min-h-0 so NEVER clipped!) -->
                <div class="flex-1 min-h-0 flex ${ov.calloutDir === 'vertical' ? 'flex-col' : 'flex-row'} items-center justify-center overflow-hidden" style="gap:${Math.round(typo.pt(6))}px;margin-top:${isOfficialMfStyle ? 0 : Math.round(typo.pt(4))}px">
                  ${step.subassembly && !ov.calloutAsPages && !isOfficialMfStyle ? `
                    <div data-drag="callout" data-step="${step.id}" class="draggable-el shrink-0 ${ov.calloutDir === 'vertical' ? 'max-w-full' : 'max-w-[48%]'} max-h-full flex flex-col overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="width:${isTightSlot ? st.calloutWTight : st.calloutW}px;padding:${Math.round(typo.pt(5))}px;border-radius:${Math.round(typo.pt(8))}px;background:${theme.calloutBg};border:${calloutSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${calloutPos.x}px,${calloutPos.y}px)">
                      <div class="flex items-center justify-between font-bold shrink-0 min-w-0" style="gap:${Math.round(typo.pt(4))}px;font-size:${st.calloutFont}px">
                        <span class="min-w-0 truncate">${escHtml(step.subassembly.name)}</span>
                        <span class="rounded-full text-white shrink-0" style="background:${theme.accent};padding:${Math.round(typo.pt(1))}px ${Math.round(typo.pt(4.5))}px">${step.subassembly.repeatCount}×</span>
                      </div>
                      <img src="${subImg}" class="w-full flex-1 min-h-0 object-contain pointer-events-none" />
                    </div>` : ''}

                  <div class="flex-1 min-w-0 min-h-0 w-full h-full flex items-center justify-center relative overflow-hidden">
                    ${showLive3D
                      ? `<canvas id="liveRotateCanvas" class="w-full h-full object-contain cursor-grab active:cursor-grabbing"></canvas>`
                      : isMfExploded && mfExploded
                        ? `<img data-pick-step="${step.id}" src="${mfExploded.url}" alt="${escHtml(step.minifigName || 'Minifigure assembly')}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />`
                        : isMfSeq && mfSeqStages
                          ? `<div class="w-full h-full grid items-center justify-items-center gap-1 sm:gap-2 px-1" style="grid-template-columns:repeat(${mfSeqStages.length},minmax(0,1fr))">
                              ${mfSeqStages.map(({ stage, img }) => `
                                <div class="w-full h-full min-w-0 min-h-0 flex items-center justify-center overflow-hidden">
                                  <img src="${img.url}" alt="${escHtml(`Step ${stage.stepNumber}: ${stage.label}`)}" class="max-w-full max-h-full w-full h-full object-contain pointer-events-none" />
                                </div>`).join('')}
                            </div>`
                          : `<img data-pick-step="${step.id}" src="${snap.url}" class="step-render-img absolute inset-0 w-full h-full object-contain ${state.mode === 'select' ? 'cursor-crosshair' : 'pointer-events-none'}" />`
                    }
                    ${step.isSubmodelFinal ? `<span class="absolute rounded-full font-black text-white shadow-md pointer-events-none" style="bottom:${Math.round(typo.pt(5))}px;right:${Math.round(typo.pt(5))}px;padding:${Math.round(typo.pt(3))}px ${Math.round(typo.pt(9))}px;font-size:${st.subFinalFont}px;background:${theme.accent}">×${step.submodelRepeat || 2}</span>` : ''}
                  </div>

                  ${mf1to1 ? `
                    <div class="shrink-0 max-w-[45%] flex flex-col items-center justify-center max-h-full overflow-hidden shadow-xs" style="border-radius:${Math.round(typo.pt(8))}px;padding:${Math.round(typo.pt(5))}px ${Math.round(typo.pt(7))}px;gap:${Math.round(typo.pt(4))}px;background:${theme.calloutBg};border:1.5px solid ${theme.calloutBorder}" title="Actual-size 1:1 minifigure reference (${Math.round(mf1to1.heightMm)} mm tall)">
                      <div class="flex items-center font-extrabold leading-none max-w-full overflow-hidden whitespace-nowrap" style="gap:${Math.round(typo.pt(4))}px;font-size:${st.mf1to1Font}px">
                        <span class="rounded-full text-white shrink-0" style="background:${theme.accent};padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(5))}px">1:1${mf1to1.isExact ? '' : ' · Fit'}</span>
                        <span class="opacity-75 tabular-nums truncate">${Math.round(mf1to1.heightMm)} mm</span>
                      </div>
                      <div class="flex items-center" style="gap:${Math.round(typo.pt(4))}px">
                        <img src="${mf1to1.url}" alt="1:1 actual size minifigure" style="width:${mf1to1.displayPxW}px;height:${mf1to1.displayPxH}px" class="block shrink-0 pointer-events-none" />
                        <div class="flex flex-col items-center justify-between opacity-55" style="height:${Math.max(24, Math.round(mf1to1.displayPxH * 0.92))}px">
                          <span class="w-1.5 h-[1.5px] bg-current"></span>
                          <span class="w-[1.5px] flex-1 bg-current"></span>
                          <span class="w-1.5 h-[1.5px] bg-current"></span>
                        </div>
                      </div>
                    </div>` : ''}
                </div>
                ${step.isMinifigPoseStep && step.minifigPrep?.indicators?.length > 0 ? `
                  <div class="shrink-0 flex items-center justify-center flex-wrap pointer-events-none" style="gap:${Math.round(typo.pt(4))}px;margin-top:${Math.round(typo.pt(4))}px">
                    ${step.minifigPrep.indicators.map(ind => `
                      <span class="inline-flex items-center font-bold rounded-full shadow-xs bg-white/90 text-[#1e293b] whitespace-nowrap" style="gap:${Math.round(typo.pt(3.5))}px;padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(6))}px;font-size:${st.cueFont}px;border:1.5px solid ${ind.color || theme.accent}">
                        <span class="rounded-full shrink-0" style="width:${Math.max(6, Math.round(st.cueFont * 0.72))}px;height:${Math.max(6, Math.round(st.cueFont * 0.72))}px;background:${ind.color || theme.accent}"></span>
                        <span>${escHtml(ind.label)}</span>
                      </span>`).join('')}
                  </div>` : ''}
              </div>`;
          }).join('')}
        </div>

        <!-- Custom Page Inserts (Text Notes & Images — Draggable in Arrange Mode!) -->
        ${(state.pageInserts[page.id] || []).map(ins => {
          const isInsSel = isArrangeMode && state.selectedArrangeEl?.kind === 'insert' && state.selectedArrangeEl?.insertId === ins.id;
          return `<div data-drag="insert" data-insert-id="${ins.id}" class="draggable-el absolute z-20 ${isArrangeMode ? 'cursor-move' : ''}" style="left:${ins.x}px;top:${ins.y}px;padding:${Math.round(typo.pt(6))}px;border-radius:${Math.round(typo.pt(8))}px;transform:scale(${ins.scale || 1});transform-origin:top left;border:${isInsSel ? `2px solid ${theme.accent}` : '1px solid transparent'};background:${ins.kind === 'text' ? theme.pliBg : 'transparent'}">
            ${ins.kind === 'text'
              ? `<div class="font-bold leading-snug break-words overflow-hidden" style="font-size:${st.insertTextFont}px;max-width:${st.insertTextMaxW}px">${escHtml(ins.text)}</div>`
              : `<img src="${ins.src}" style="width:${st.insertImgSize}px;height:${st.insertImgSize}px" class="object-contain rounded-lg pointer-events-none" />`}
          </div>`;
        }).join('')}

        <!-- Page Footer -->
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${state.showPageTitle ? escHtml(page.chapterName) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;

    bindStepPageInteractions(page);
  }

  renderContextOverlay(page);
  syncMenuControls();
  applyStageTransform();
}

// =========================================================================
// 7. DIRECT CANVAS INTERACTIONS (3D Picking, Live Orbit, 2D Drag-and-Drop)
// =========================================================================
function bindStepPageInteractions(page) {
  const frame = document.getElementById('pageFrame');

  // Tap a step slot to make it active
  frame.querySelectorAll('.step-slot').forEach(slotEl => {
    slotEl.addEventListener('click', () => {
      const sid = slotEl.getAttribute('data-step');
      if (state.selectedStepId !== sid) {
        state.selectedStepId = sid;
        state.selectedPartIds.clear();
        renderAll();
      }
    });
  });

  // SELECT MODE: Tap PLI chip to select/toggle those exact pieces!
  frame.querySelectorAll('.pli-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (state.mode !== 'select') return;
      e.stopPropagation();
      const sid = btn.getAttribute('data-step');
      const ids = btn.getAttribute('data-pli-ids').split(',').filter(Boolean);
      if (state.selectedStepId !== sid) { state.selectedStepId = sid; state.selectedPartIds.clear(); }
      const allSelected = ids.every(id => state.selectedPartIds.has(id));
      ids.forEach(id => allSelected ? state.selectedPartIds.delete(id) : state.selectedPartIds.add(id));
      renderAll();
    });
  });

  // SELECT MODE: Tap directly on a 3D piece in the step render to pick it!
  frame.querySelectorAll('.step-render-img').forEach(img => {
    img.addEventListener('click', (e) => {
      if (state.mode !== 'select') return;
      e.stopPropagation();
      const sid = img.getAttribute('data-pick-step');
      const info = currentSlotRenderInfo.get(sid);
      if (!info || !info.snap.mvp) return;
      const rect = img.getBoundingClientRect();
      // Account for object-contain letterboxing inside the img element
      const imgAspect = info.snap.w / info.snap.h;
      const boxAspect = rect.width / rect.height;
      let drawW = rect.width, drawH = rect.height, ox = 0, oy = 0;
      if (boxAspect > imgAspect) { drawW = rect.height * imgAspect; ox = (rect.width - drawW) / 2; }
      else { drawH = rect.width / imgAspect; oy = (rect.height - drawH) / 2; }
      const ndcX = ((e.clientX - rect.left - ox) / drawW) * 2 - 1;
      const ndcY = 1 - ((e.clientY - rect.top - oy) / drawH) * 2;

      // Pick closest new piece in this step whose projected 3D box contains (or is nearest to) tap
      let bestId = null, bestScore = 0.28;
      const ov = info.ov || {};
      for (const p of info.step.parts) {
        const pOv = ov.partOffsets?.[p.id] || info.step.defaultPartOffsets?.[p.id] || {};
        const box = computeWorldBox(p);
        const dx = (pOv.x || 0) + (ov.offX || 0), dy = (pOv.y || 0) + (ov.offY || 0), dz = (pOv.z || 0) + (ov.offZ || 0);
        const c = projectWorldToNdc([box.center[0]+dx, box.center[1]+dy, box.center[2]+dz], info.snap.mvp);
        const dist = Math.hypot(c[0] - ndcX, c[1] - ndcY);
        if (dist < bestScore) { bestScore = dist; bestId = p.id; }
      }
      if (bestId) {
        if (state.selectedStepId !== sid) { state.selectedStepId = sid; state.selectedPartIds.clear(); }
        if (state.selectedPartIds.has(bestId)) state.selectedPartIds.delete(bestId);
        else state.selectedPartIds.add(bestId);
        renderAll();
      } else {
        showToast('Tap a highlighted piece or a piece in the Parts List box.');
      }
    });
  });

  // ROTATE 3D MODE: Attach single GPU-cached live WebGL canvas (0 bytes uploaded while dragging!)
  if (state.mode === 'rotate') {
    const liveCanvas = document.getElementById('liveRotateCanvas');
    const info = currentSlotRenderInfo.get(state.selectedStepId);
    if (liveCanvas && info) {
      activeLiveEngine = new WebGLBrickEngine(liveCanvas);
      const w = 640, h = 420;
      let az = info.cam.az, el = info.cam.el;
      activeLiveEngine.draw(info.snap.mesh, w, h, az, el, info.modelScale);

      let dragging = false, lx = 0, ly = 0;
      liveCanvas.onpointerdown = (e) => { e.stopPropagation(); dragging = true; lx = e.clientX; ly = e.clientY; liveCanvas.setPointerCapture(e.pointerId); };
      liveCanvas.onpointermove = (e) => {
        if (!dragging || !activeLiveEngine) return;
        e.stopPropagation();
        az = (az - (e.clientX - lx) * 0.7 + 360) % 360;
        el = Math.max(-75, Math.min(75, el + (e.clientY - ly) * 0.5));
        lx = e.clientX; ly = e.clientY;
        state.overrides[info.step.id] = { ...(state.overrides[info.step.id] || {}), az: Math.round(az), el: Math.round(el) };
        activeLiveEngine.draw(info.snap.mesh, w, h, az, el, info.modelScale);
      };
      liveCanvas.onpointerup = () => { dragging = false; };
    }
  }

  // ARRANGE MODE: Direct 1-finger drag for PLI Box, Callout Box, and Custom Inserts!
  if (state.mode === 'arrange') {
    frame.querySelectorAll('.draggable-el').forEach(el => {
      let dragging = false, sx = 0, sy = 0, origX = 0, origY = 0;
      const kind = el.getAttribute('data-drag');
      const sid = el.getAttribute('data-step');
      const insId = el.getAttribute('data-insert-id');

      el.onpointerdown = (e) => {
        e.stopPropagation();
        dragging = true; sx = e.clientX; sy = e.clientY;
        el.setPointerCapture(e.pointerId);
        state.selectedArrangeEl = { stepId: sid, kind, insertId: insId };
        if (sid) state.selectedStepId = sid;
        if (kind === 'pli') { const p = state.overrides[sid]?.pliPos || { x:0, y:0 }; origX = p.x; origY = p.y; }
        else if (kind === 'callout') { const p = state.overrides[sid]?.calloutPos || { x:0, y:0 }; origX = p.x; origY = p.y; }
        else if (kind === 'insert') {
          const ins = (state.pageInserts[page.id] || []).find(x => x.id === insId);
          origX = ins?.x || 24; origY = ins?.y || 24;
        }
        renderContextOverlay(page);
      };
      el.onpointermove = (e) => {
        if (!dragging) return;
        e.stopPropagation();
        const effScale = getEffectiveStageScale();
        const dx = (e.clientX - sx) / effScale, dy = (e.clientY - sy) / effScale;
        const nx = Math.round(origX + dx), ny = Math.round(origY + dy);
        if (kind === 'pli') {
          const ov = state.overrides[sid] || {};
          state.overrides[sid] = { ...ov, pliPos: { x: nx, y: ny } };
          el.style.transform = `translate(${nx}px,${ny}px) scale(${ov.pliScale || 1})`;
        } else if (kind === 'callout') {
          const ov = state.overrides[sid] || {};
          state.overrides[sid] = { ...ov, calloutPos: { x: nx, y: ny } };
          el.style.transform = `translate(${nx}px,${ny}px)`;
        } else if (kind === 'insert') {
          const ins = (state.pageInserts[page.id] || []).find(x => x.id === insId);
          if (ins) { ins.x = nx; ins.y = ny; el.style.left = nx + 'px'; el.style.top = ny + 'px'; }
        }
      };
      el.onpointerup = () => { dragging = false; };
    });
  }
}

// =========================================================================
// 8. FLOATING CONTEXTUAL OVERLAYS (D-Pad, Step Split Bar, Camera Pill, Arrange Pill)
// =========================================================================
function renderContextOverlay(page) {
  const box = document.getElementById('contextOverlay');
  box.innerHTML = '';

  // PARTS LIST TAP SHORTCUT (works in ANY mode, including Pan! Tap the Parts List page to toggle)
  if (page.kind === 'bom') {
    if (!state.bomShortcutVisible && state.mode === 'pan') { box.classList.add('hidden'); return; }
    box.classList.remove('hidden');
    box.innerHTML = `
      <button id="bomQuickCustomizeBtn" class="pointer-events-auto glass-pill px-4 py-2.5 rounded-full inline-flex items-center gap-2 text-xs font-bold text-[#1a73e8] hover:scale-[1.02] active:scale-95 transition">
        <svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        <span>Customize Parts List</span>
      </button>`;
    box.querySelector('#bomQuickCustomizeBtn').onclick = () => openBomSetupModal();
    return;
  }

  if (state.mode === 'pan') { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');

  // COVER / BUILD COMPLETE / BACK COVER EDITOR OVERLAY
  if (page.kind === 'cover' || page.kind === 'complete' || page.kind === 'back') {
    const isCover = page.kind === 'cover';
    const isComplete = page.kind === 'complete';
    const isBack = page.kind === 'back';
    if (isCover) state.coverMeta = normalizeCoverMeta(state.coverMeta);
    const meta = isCover ? state.coverMeta : isComplete ? state.completeMeta : state.backMeta;
    const label = isCover ? 'Cover Page' : isComplete ? 'Build Complete Page' : 'Back Cover';
    const defaultTitle = isCover ? state.model.title : 'Build Complete!';
    const backCredit = (!meta.subtitle || meta.subtitle === 'Created with Brick Instruction Creator')
      ? 'Made with Brick Instruction Creator'
      : meta.subtitle;

    if (isCover) {
      const hasCreatorLogo = Boolean(meta.creatorLogoSrc);
      const hasThemeImg = Boolean(meta.themeImageSrc);
      const hasBg = Boolean(meta.bgSrc);
      const qrOn = meta.showQrCode !== false;
      box.innerHTML = `
        <div class="pointer-events-auto glass-pill rounded-2xl p-3 w-full space-y-2 text-xs">
          <div class="flex items-center justify-between gap-1.5 flex-wrap font-bold">
            <span>Edit Cover Page</span>
            <div class="flex items-center gap-1 flex-wrap">
              <button id="covRotL" title="Rotate model left" class="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">↺</button>
              <button id="covRotR" title="Rotate model right" class="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">↻</button>
              <button id="covTiltU" title="Tilt camera up" class="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">↑</button>
              <button id="covTiltD" title="Tilt camera down" class="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">↓</button>
              <button id="covZoomOut" title="Zoom model out" class="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">−</button>
              <button id="covZoomIn" title="Zoom model in" class="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">+</button>
              <button id="covResetCam" title="Reset hero camera" class="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10 font-medium">Reset</button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-1.5">
            <input id="covTitleIn" value="${escHtml(meta.title || defaultTitle)}" placeholder="Model name" class="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 outline-none" />
            <input id="covSubIn" value="${escHtml(meta.subtitle || '')}" placeholder="Subtitle (optional)" class="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 outline-none" />
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <div class="inline-flex items-center rounded-full overflow-hidden ${hasCreatorLogo ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">
              <button id="covCreatorLogoBtn" class="px-2.5 py-1 font-semibold">Creator Logo</button>
              ${hasCreatorLogo ? `<button id="covCreatorLogoClr" title="Remove creator logo" class="pr-2 pl-1 py-1 opacity-85 hover:opacity-100">×</button>` : ''}
            </div>
            <div class="inline-flex items-center rounded-full overflow-hidden ${hasThemeImg ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">
              <button id="covThemeImgBtn" class="px-2.5 py-1 font-semibold">Theme Image</button>
              ${hasThemeImg ? `<button id="covThemeImgClr" title="Remove theme image" class="pr-2 pl-1 py-1 opacity-85 hover:opacity-100">×</button>` : ''}
            </div>
            <div class="inline-flex items-center rounded-full overflow-hidden ${hasBg ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">
              <button id="covBgBtn" class="px-2.5 py-1 font-semibold">Bg Image</button>
              ${hasBg ? `<button id="covBgClr" title="Remove background image" class="pr-2 pl-1 py-1 opacity-85 hover:opacity-100">×</button>` : ''}
            </div>
            <button id="covQrToggle" class="px-2.5 py-1 rounded-full font-semibold ${qrOn ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">QR Code</button>
          </div>
        </div>`;

      box.querySelector('#covTitleIn').onchange = (e) => { pushUndo(); meta.title = e.target.value; renderAll(); };
      box.querySelector('#covSubIn').onchange = (e) => { pushUndo(); meta.subtitle = e.target.value; renderAll(); };
      box.querySelector('#covRotL').onclick = () => { pushUndo(); meta.az = (meta.az - 22.5 + 360) % 360; renderAll(); };
      box.querySelector('#covRotR').onclick = () => { pushUndo(); meta.az = (meta.az + 22.5) % 360; renderAll(); };
      box.querySelector('#covTiltU').onclick = () => { pushUndo(); meta.el = clampCoverElevation(meta.el + 8); renderAll(); };
      box.querySelector('#covTiltD').onclick = () => { pushUndo(); meta.el = clampCoverElevation(meta.el - 8); renderAll(); };
      box.querySelector('#covZoomIn').onclick = () => { pushUndo(); meta.zoom = clampCoverZoom((meta.zoom ?? 1.0) + 0.08); renderAll(); };
      box.querySelector('#covZoomOut').onclick = () => { pushUndo(); meta.zoom = clampCoverZoom((meta.zoom ?? 1.0) - 0.08); renderAll(); };
      box.querySelector('#covResetCam').onclick = () => {
        pushUndo();
        const def = createDefaultCoverMeta();
        meta.az = def.az; meta.el = def.el; meta.zoom = def.zoom;
        renderAll();
      };
      box.querySelector('#covCreatorLogoBtn').onclick = () => openCoverImagePicker('creatorLogo');
      const clrCreator = box.querySelector('#covCreatorLogoClr');
      if (clrCreator) clrCreator.onclick = () => { pushUndo(); meta.creatorLogoSrc = null; renderAll(); };
      box.querySelector('#covThemeImgBtn').onclick = () => openCoverImagePicker('themeImage');
      const clrTheme = box.querySelector('#covThemeImgClr');
      if (clrTheme) clrTheme.onclick = () => { pushUndo(); meta.themeImageSrc = null; renderAll(); };
      box.querySelector('#covBgBtn').onclick = () => openCoverImagePicker('bg');
      const clrBg = box.querySelector('#covBgClr');
      if (clrBg) clrBg.onclick = () => { pushUndo(); meta.bgSrc = null; renderAll(); };
      box.querySelector('#covQrToggle').onclick = () => { pushUndo(); meta.showQrCode = !(meta.showQrCode !== false); renderAll(); };
      return;
    }

    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-2xl p-3 w-full space-y-2 text-xs">
        <div class="flex items-center justify-between gap-1.5 flex-wrap font-bold">
          <span>Edit ${label}</span>
          <div class="flex items-center gap-1 flex-wrap">
            ${!isBack ? `
              <button id="covRotL" class="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10">↺ Angle</button>
              <button id="covRotR" class="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10">↻ Angle</button>
            ` : ''}
            ${isComplete ? `
              <button id="compToggleText" class="px-2.5 py-1 rounded-full ${meta.showText !== false ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">Text</button>
              <button id="compToggleFw" class="px-2.5 py-1 rounded-full ${meta.showFireworks !== false ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">✦ Fireworks</button>
            ` : ''}
            <button id="covBgBtn" class="px-2.5 py-1 rounded-full bg-[#1a73e8] text-white">Bg Image</button>
          </div>
        </div>
        ${isBack ? `
          <input id="covSubIn" value="${escHtml(backCredit)}" placeholder="Back cover text" class="w-full px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 outline-none" />
        ` : `
          <div class="grid grid-cols-2 gap-1.5">
            <input id="covTitleIn" value="${escHtml(meta.title || defaultTitle)}" placeholder="Title" class="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 outline-none" />
            <input id="covSubIn" value="${escHtml(meta.subtitle || '')}" placeholder="Subtitle" class="px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 outline-none" />
          </div>
        `}
      </div>`;
    const titleIn = box.querySelector('#covTitleIn');
    if (titleIn) titleIn.onchange = (e) => { pushUndo(); meta.title = e.target.value; renderAll(); };
    box.querySelector('#covSubIn').onchange = (e) => { pushUndo(); meta.subtitle = e.target.value; renderAll(); };
    const rotL = box.querySelector('#covRotL');
    if (rotL) rotL.onclick = () => { pushUndo(); meta.az = (meta.az - 30 + 360) % 360; renderAll(); };
    const rotR = box.querySelector('#covRotR');
    if (rotR) rotR.onclick = () => { pushUndo(); meta.az = (meta.az + 30) % 360; renderAll(); };
    const tText = box.querySelector('#compToggleText');
    if (tText) tText.onclick = () => { pushUndo(); meta.showText = !(meta.showText !== false); renderAll(); };
    const tFw = box.querySelector('#compToggleFw');
    if (tFw) tFw.onclick = () => { pushUndo(); meta.showFireworks = !(meta.showFireworks !== false); renderAll(); };
    box.querySelector('#covBgBtn').onclick = () => openCoverImagePicker('bg');
    return;
  }

  if (page.kind === 'divider') {
    const d = state.dividerAfter[page.sourcePgId] || { title:'Section Divider', note:'' };
    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-2xl p-3 w-full space-y-2 text-xs">
        <div class="flex justify-between items-center font-bold">
          <span>Edit Divider Page</span>
          <button id="delDividerBtn" class="px-2.5 py-1 rounded-full bg-red-500/15 text-red-600 font-semibold">Delete Page</button>
        </div>
        <input id="divTitleIn" value="${d.title.replace(/"/g,'&quot;')}" class="w-full px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 outline-none" placeholder="Divider Title" />
        <input id="divNoteIn" value="${(d.note || '').replace(/"/g,'&quot;')}" class="w-full px-2.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 outline-none" placeholder="Optional note..." />
      </div>`;
    box.querySelector('#divTitleIn').onchange = (e) => { pushUndo(); state.dividerAfter[page.sourcePgId].title = e.target.value; renderAll(); };
    box.querySelector('#divNoteIn').onchange = (e) => { pushUndo(); state.dividerAfter[page.sourcePgId].note = e.target.value; renderAll(); };
    box.querySelector('#delDividerBtn').onclick = () => { pushUndo(); delete state.dividerAfter[page.sourcePgId]; state.pageIdx = Math.max(0, state.pageIdx - 1); renderAll(); };
    return;
  }

  if (page.kind !== 'steps') { box.classList.add('hidden'); return; }
  const active = getActiveStepObj();
  if (!active) { box.classList.add('hidden'); return; }
  const { ch, step } = active;
  const ov = state.overrides[step.id] || {};

  // ---- MODE: SELECT PIECES (Floating D-Pad + Step Action Bar — ZERO SLIDERS!) ----
  if (state.mode === 'select') {
    const selCount = state.selectedPartIds.size;
    if (selCount === 0) {
      box.innerHTML = `
        <div class="pointer-events-auto glass-pill px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#1a73e8]"></span>
          <span>Tap pieces in the 3D step or Parts List to move or split them</span>
        </div>`;
      return;
    }

    const firstId = Array.from(state.selectedPartIds)[0];
    const pOv = ov.partOffsets?.[firstId] || step.defaultPartOffsets?.[firstId] || { x:0, y:0, z:0, tilt:0, arrow:true };
    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-3xl p-3 w-full space-y-2.5 text-xs">
        <div class="flex items-center justify-between gap-2">
          <span class="font-bold text-[#1a73e8]">${selCount} piece${selCount > 1 ? 's' : ''} selected · Step ${step.num}</span>
          <div class="flex items-center gap-1">
            <button id="btnToggleArrow" class="px-2.5 py-1 rounded-full border text-[11px] font-semibold ${pOv.arrow !== false ? 'bg-[#1a73e8]/15 border-[#1a73e8] text-[#1a73e8]' : 'border-black/15'}">Arrow ${pOv.arrow !== false ? 'On' : 'Off'}</button>
            <button id="btnResetSelPos" class="px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-semibold">Reset</button>
            <button id="btnClearSel" class="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center">✕</button>
          </div>
        </div>

        <!-- Floating Directional Pad (1-stud crisp nudges + Tilt — NO SLIDERS!) -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1">
            <span class="text-[10px] font-bold uppercase opacity-60 mr-0.5">Move</span>
            <button data-nudge="0,20,0" class="nudge-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold" title="Lift Up">↑</button>
            <button data-nudge="0,-20,0" class="nudge-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold" title="Lower">↓</button>
            <button data-nudge="-20,0,0" class="nudge-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold" title="Left">←</button>
            <button data-nudge="20,0,0" class="nudge-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold" title="Right">→</button>
            <button data-nudge="0,0,20" class="nudge-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold" title="Forward">↙</button>
            <button data-nudge="0,0,-20" class="nudge-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold" title="Back">↗</button>
          </div>
          <div class="flex items-center gap-1">
            <span class="text-[10px] font-bold uppercase opacity-60 mr-0.5">Tilt</span>
            <button data-tilt="-15" class="tilt-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold">↺</button>
            <button data-tilt="15" class="tilt-btn h-8 px-2.5 rounded-xl bg-black/5 dark:bg-white/10 font-bold">↻</button>
          </div>
        </div>

        <!-- Direct Step Reorganization Bar (replaces blind Split!) -->
        <div class="flex items-center gap-1.5 flex-wrap pt-2 border-t border-black/10 dark:border-white/10">
          <button id="actNewBefore" class="px-2.5 py-1.5 rounded-full bg-[#1a73e8] text-white font-semibold">New Step Before</button>
          <button id="actNewAfter" class="px-2.5 py-1.5 rounded-full bg-[#1a73e8] text-white font-semibold">New Step After</button>
          <button id="actMoveStep" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">Move to Step…</button>
          <button id="actMergePrev" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">Merge Prev</button>
          <button id="actMakeSub" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">Make Submodel</button>
        </div>
      </div>`;

    const nudgeSelected = (dx, dy, dz, dtilt) => {
      pushUndo();
      const curOv = state.overrides[step.id] || {};
      const po = { ...(curOv.partOffsets || {}) };
      for (const id of state.selectedPartIds) {
        const cur = po[id] || step.defaultPartOffsets?.[id] || { x:0, y:0, z:0, tilt:0, arrow:true };
        po[id] = { x: cur.x + dx, y: cur.y + dy, z: cur.z + dz, tilt: cur.tilt + dtilt, arrow: cur.arrow };
      }
      state.overrides[step.id] = { ...curOv, partOffsets: po };
      renderAll();
    };
    box.querySelectorAll('.nudge-btn').forEach(b => {
      b.onclick = () => { const [dx,dy,dz] = b.getAttribute('data-nudge').split(',').map(Number); nudgeSelected(dx,dy,dz,0); };
    });
    box.querySelectorAll('.tilt-btn').forEach(b => {
      b.onclick = () => nudgeSelected(0,0,0, Number(b.getAttribute('data-tilt')));
    });
    box.querySelector('#btnToggleArrow').onclick = () => {
      pushUndo();
      const curOv = state.overrides[step.id] || {};
      const po = { ...(curOv.partOffsets || {}) };
      const nextVal = pOv.arrow === false;
      for (const id of state.selectedPartIds) {
        const cur = po[id] || step.defaultPartOffsets?.[id] || { x:0, y:0, z:0, tilt:0, arrow:true };
        po[id] = { ...cur, arrow: nextVal };
      }
      state.overrides[step.id] = { ...curOv, partOffsets: po };
      renderAll();
    };
    box.querySelector('#btnResetSelPos').onclick = () => {
      pushUndo();
      const curOv = state.overrides[step.id] || {};
      const po = { ...(curOv.partOffsets || {}) };
      for (const id of state.selectedPartIds) {
        if (step.defaultPartOffsets?.[id]) po[id] = { x:0, y:0, z:0, tilt:0, arrow:false };
        else delete po[id];
      }
      state.overrides[step.id] = { ...curOv, partOffsets: po };
      renderAll();
    };
    box.querySelector('#btnClearSel').onclick = () => { state.selectedPartIds.clear(); renderAll(); };

    const splitSelectedToOffset = (deltaIdx) => {
      const moved = step.parts.filter(p => state.selectedPartIds.has(p.id));
      const kept = step.parts.filter(p => !state.selectedPartIds.has(p.id));
      if (moved.length === 0 || kept.length === 0) { showToast('Select a subset of pieces in this step to split.'); return; }
      pushUndo();
      step.parts = kept;
      const idx = ch.steps.indexOf(step);
      const newStep = { id: step.id + '_s_' + Date.now().toString(36), num: step.num, side: step.side, corner: step.corner, cue: 'none', parts: moved };
      ch.steps.splice(idx + (deltaIdx < 0 ? 0 : 1), 0, newStep);
      state.selectedStepId = newStep.id;
      state.selectedPartIds.clear();
      showToast(`Moved ${moved.length} piece(s) into a new step.`);
      renderAll();
    };
    box.querySelector('#actNewBefore').onclick = () => splitSelectedToOffset(-1);
    box.querySelector('#actNewAfter').onclick = () => splitSelectedToOffset(1);
    box.querySelector('#actMoveStep').onclick = () => {
      const targetNum = parseInt(prompt('Move selected pieces to which Step number?'), 10);
      if (!targetNum) return;
      const all = getAllSteps(state.model);
      const dest = all.find(x => x.step.num === targetNum);
      if (!dest || dest.step.id === step.id) { showToast('Pick a different valid step number.'); return; }
      pushUndo();
      const moved = step.parts.filter(p => state.selectedPartIds.has(p.id));
      step.parts = step.parts.filter(p => !state.selectedPartIds.has(p.id));
      dest.step.parts.push(...moved);
      if (step.parts.length === 0) {
        ch.steps.splice(ch.steps.indexOf(step), 1);
        delete state.overrides[step.id];
      }
      state.selectedPartIds.clear();
      showToast(`Moved ${moved.length} piece(s) to Step ${targetNum}.`);
      renderAll();
    };
    box.querySelector('#actMergePrev').onclick = () => {
      const idx = ch.steps.indexOf(step);
      if (idx <= 0) { showToast('No previous step in this section to merge into.'); return; }
      pushUndo();
      ch.steps[idx - 1].parts.push(...step.parts);
      ch.steps.splice(idx, 1);
      delete state.overrides[step.id];
      state.selectedStepId = ch.steps[idx - 1].id;
      state.selectedPartIds.clear();
      showToast('Merged into previous step.');
      renderAll();
    };
    box.querySelector('#actMakeSub').onclick = () => {
      const picked = step.parts.filter(p => state.selectedPartIds.has(p.id));
      if (picked.length === 0) return;
      const name = prompt('Submodel name:', 'Subassembly');
      if (!name) return;
      pushUndo();
      step.subassembly = { name, repeatCount: 1, direction: 'horizontal', asPages: false, buildParts: picked };
      state.selectedPartIds.clear();
      showToast(`Created "${name}" callout on Step ${step.num}.`);
      renderAll();
    };
    return;
  }

  // ---- MODE: ROTATE 3D (Floating Camera Pill + Focus Framing + Apply-to-Following + Model Size −/+) ----
  if (state.mode === 'rotate') {
    const cam = getStepCamera(step);
    const scalePct = Math.round((ov.modelScale || 1.0) * 100);
    const fMode = ov.focusMode || 'auto';
    const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
    const curMfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : 'classic';
    const isMfStep = isMfBuild || Boolean(step.isMinifigPoseStep);
    const mfDefaultCam = step.isMinifigPoseStep
      ? { side: 'top', corner: step.corner || MINIFIG_POSE_CAMERA.corner, az: step.az ?? MINIFIG_POSE_CAMERA.az, el: step.el ?? MINIFIG_POSE_CAMERA.el }
      : MINIFIG_BUILD_CAMERA;
    const isFront34 = isMfStep && Math.abs(cam.az - mfDefaultCam.az) <= 4 && Math.abs(cam.el - mfDefaultCam.el) <= 4;
    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-3xl p-3 w-full space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="font-bold">${isMfBuild ? escHtml(step.minifigName || 'Minifigure') : `Step ${step.num}`} · Drag 3D to orbit</span>
          <div class="flex items-center gap-1 flex-wrap">
            <button id="camTop" class="px-2 py-1 rounded-full font-semibold ${cam.side === 'top' ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">Top</button>
            <button id="camBot" class="px-2 py-1 rounded-full font-semibold ${cam.side === 'bottom' ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">Bottom</button>
            ${isMfBuild ? `
              <div class="inline-flex rounded-full bg-black/5 dark:bg-white/10 p-0.5 text-[10px] font-semibold">
                <button data-mf-quick="exploded" class="mf-quick-style px-2 py-0.5 rounded-full ${curMfStyle === 'exploded' ? 'bg-[#1a73e8] text-white' : ''}">Exploded</button>
                <button data-mf-quick="sequential" class="mf-quick-style px-2 py-0.5 rounded-full ${curMfStyle === 'sequential' ? 'bg-[#1a73e8] text-white' : ''}">Step-by-Step</button>
                <button data-mf-quick="classic" class="mf-quick-style px-2 py-0.5 rounded-full ${curMfStyle === 'classic' ? 'bg-[#1a73e8] text-white' : ''}">Classic</button>
              </div>
              <button id="btnToggleMf1to1Quick" class="px-2.5 py-1 rounded-full font-semibold ${state.showMinifig1to1 ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">1:1 View</button>` : ''}
            <div class="inline-flex rounded-full bg-black/5 dark:bg-white/10 p-0.5 text-[10px] font-semibold">
              <button data-focus="auto" class="focus-btn px-2 py-0.5 rounded-full ${fMode === 'auto' ? 'bg-[#1a73e8] text-white' : ''}">Auto</button>
              <button data-focus="focus" class="focus-btn px-2 py-0.5 rounded-full ${fMode === 'focus' ? 'bg-[#1a73e8] text-white' : ''}">Close-Up</button>
              <button data-focus="full" class="focus-btn px-2 py-0.5 rounded-full ${fMode === 'full' ? 'bg-[#1a73e8] text-white' : ''}">Full</button>
            </div>
            <div class="flex items-center gap-1 bg-black/5 dark:bg-white/10 rounded-full px-1.5 py-0.5">
              <button id="modScaleDown" class="w-5 h-5 font-bold">−</button>
              <span class="text-[10px] font-bold tabular-nums">${scalePct}%</span>
              <button id="modScaleUp" class="w-5 h-5 font-bold">+</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-1.5 flex-wrap">
          <div class="flex gap-1 flex-wrap">
            ${isMfStep ? `<button id="btnMfFront34" class="px-2.5 py-1 rounded-full text-[11px] font-semibold ${isFront34 ? 'bg-[#1a73e8]/15 text-[#1a73e8] ring-1 ring-[#1a73e8]' : 'bg-black/5 dark:bg-white/10'}">Front 3/4</button>` : ''}
            ${CORNERS.map(c => `<button data-corner="${c.id}" class="corner-btn px-2.5 py-1 rounded-full text-[11px] font-semibold ${!isFront34 && cam.corner === c.id ? 'bg-[#1a73e8]/15 text-[#1a73e8] ring-1 ring-[#1a73e8]' : 'bg-black/5 dark:bg-white/10'}">${c.label}</button>`).join('')}
          </div>
          <button id="btnApplyFollowing" class="px-3 py-1 rounded-full bg-[#1a73e8] text-white text-[11px] font-semibold">Apply to Following</button>
        </div>
      </div>`;

    const setCam = (patch) => {
      pushUndo();
      const cur = state.overrides[step.id] || {};
      const nextSide = patch.side ?? cur.side ?? step.side ?? 'top';
      const nextCorner = patch.corner ?? cur.corner ?? step.corner ?? 'front_right';
      const cObj = CORNERS.find(c => c.id === nextCorner) || CORNERS[0];
      state.overrides[step.id] = {
        ...cur,
        side: nextSide,
        corner: nextCorner,
        az: patch.az ?? cObj.az,
        el: patch.el ?? (nextSide === 'bottom' ? -30 : 30),
      };
      renderAll();
    };
    box.querySelector('#camTop').onclick = () => setCam({ side: 'top' });
    box.querySelector('#camBot').onclick = () => setCam({ side: 'bottom' });
    const mf34Btn = box.querySelector('#btnMfFront34');
    if (mf34Btn) {
      mf34Btn.onclick = () => setCam({ side: 'top', corner: mfDefaultCam.corner, az: mfDefaultCam.az, el: mfDefaultCam.el });
    }
    const mf1to1Btn = box.querySelector('#btnToggleMf1to1Quick');
    if (mf1to1Btn) {
      mf1to1Btn.onclick = () => { state.showMinifig1to1 = !state.showMinifig1to1; renderAll(); };
    }
    box.querySelectorAll('.mf-quick-style').forEach(b => {
      b.onclick = () => applyMinifigStyleChange(b.getAttribute('data-mf-quick'), step.id);
    });
    box.querySelectorAll('.focus-btn').forEach(b => {
      b.onclick = () => {
        pushUndo();
        state.overrides[step.id] = { ...(state.overrides[step.id] || {}), focusMode: b.getAttribute('data-focus') };
        renderAll();
      };
    });
    box.querySelectorAll('.corner-btn').forEach(b => { b.onclick = () => setCam({ corner: b.getAttribute('data-corner') }); });
    box.querySelector('#modScaleDown').onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, modelScale: Math.max(0.5, (ov.modelScale || 1) - 0.15) }; renderAll(); };
    box.querySelector('#modScaleUp').onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, modelScale: Math.min(2.2, (ov.modelScale || 1) + 0.15) }; renderAll(); };
    box.querySelector('#btnApplyFollowing').onclick = () => {
      pushUndo();
      const curCam = getStepCamera(step);
      const idx = ch.steps.indexOf(step);
      let count = 0;
      for (let i = idx + 1; i < ch.steps.length; i++) {
        const s = ch.steps[i];
        state.overrides[s.id] = { ...(state.overrides[s.id] || {}), side: curCam.side, corner: curCam.corner, az: curCam.az, el: curCam.el };
        count++;
      }
      showToast(`Applied camera angle to ${count} following step(s).`);
      renderAll();
    };
    return;
  }

  // ---- MODE: ARRANGE LAYOUT (Drag 2D boxes, Resize PLI, Callout toggle, Inserts!) ----
  if (state.mode === 'arrange') {
    const pliPct = Math.round((ov.pliScale || 1.0) * 100);
    const hasSub = Boolean(step.subassembly);
    const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
    const curMfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : 'classic';
    const slots = page.slots || [];
    const slotIdx = slots.findIndex(s => s.step.id === step.id);
    const isPinned = Boolean(ov.pin);
    const stepShortLabel = getStepShortLabel(step, ch);
    const pinBtnTitle = getStepBreakTooltip({
      stepLabel: stepShortLabel,
      pinned: isPinned,
      slotIndex: Math.max(0, slotIdx),
    });
    const arrangeHeaderLeftHtml = slots.length > 1
      ? `<div class="inline-flex items-center gap-0.5 rounded-full bg-black/5 dark:bg-white/10 p-0.5 text-[11px] font-bold">
          ${slots.map(sl => `<button type="button" data-arrange-step="${sl.step.id}" class="arrange-step-btn px-2 py-0.5 rounded-full transition ${sl.step.id === step.id ? 'bg-[#1a73e8] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}">Step ${sl.step.num}</button>`).join('')}
        </div>`
      : `<span class="font-bold">${isMfBuild ? escHtml(step.minifigName || `Step ${step.num}`) : `Step ${step.num}`} · Drag boxes to arrange</span>`;
    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-3xl p-3 w-full space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          ${arrangeHeaderLeftHtml}
          <div class="flex items-center gap-1 flex-wrap">
            ${isMfBuild ? `
              <div class="inline-flex rounded-full bg-black/5 dark:bg-white/10 p-0.5 text-[10px] font-semibold mr-1">
                <button data-mf-quick="exploded" class="mf-quick-style px-2 py-0.5 rounded-full ${curMfStyle === 'exploded' ? 'bg-[#1a73e8] text-white' : ''}">Exploded</button>
                <button data-mf-quick="sequential" class="mf-quick-style px-2 py-0.5 rounded-full ${curMfStyle === 'sequential' ? 'bg-[#1a73e8] text-white' : ''}">Step-by-Step</button>
                <button data-mf-quick="classic" class="mf-quick-style px-2 py-0.5 rounded-full ${curMfStyle === 'classic' ? 'bg-[#1a73e8] text-white' : ''}">Classic</button>
              </div>` : ''}
            <span class="text-[11px] opacity-65">Parts Box:</span>
            <button id="pliDown" class="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 font-bold">−</button>
            <span class="text-[11px] font-bold tabular-nums">${pliPct}%</span>
            <button id="pliUp" class="w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 font-bold">+</button>
            <button id="btnResetArrange" class="ml-1 px-2.5 py-1 rounded-full bg-black/5 dark:bg-white/10 text-[11px] font-semibold">Reset</button>
          </div>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button id="btnInsText" class="px-2.5 py-1.5 rounded-full bg-[#1a73e8] text-white font-semibold">+ Text Note</button>
          <button id="btnInsImg" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">+ Image / Logo</button>
          <button id="btnArrangePinBreak" title="${escHtml(pinBtnTitle)}" aria-pressed="${isPinned ? 'true' : 'false'}" class="px-2.5 py-1.5 rounded-full font-semibold inline-flex items-center gap-1 transition ${isPinned ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">
            <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4"/><path d="M10 12h4"/><path d="M17 12h4"/><path d="M6 4v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4"/><path d="M6 20v-3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>
            <span>Page Break · Step ${step.num}</span>
          </button>
          ${hasSub ? `<button id="btnToggleCallout" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">${ov.calloutAsPages ? 'Convert to Callout Box' : 'Convert to Full Page'}</button>` : ''}
          ${hasSub && !ov.calloutAsPages ? `<button id="btnCalloutDir" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">${ov.calloutDir === 'vertical' ? 'Side-by-Side' : 'Stack Vertically'}</button>` : ''}
          ${state.selectedArrangeEl?.kind === 'insert' ? `<button id="btnDelInsert" class="px-2.5 py-1.5 rounded-full bg-red-500/15 text-red-600 font-semibold">Delete Selected</button>` : ''}
        </div>
      </div>`;

    box.querySelectorAll('.arrange-step-btn').forEach(b => {
      b.onclick = () => {
        const sid = b.getAttribute('data-arrange-step');
        if (sid && state.selectedStepId !== sid) {
          state.selectedStepId = sid;
          state.selectedPartIds.clear();
          renderAll();
        }
      };
    });
    box.querySelectorAll('.mf-quick-style').forEach(b => {
      b.onclick = () => applyMinifigStyleChange(b.getAttribute('data-mf-quick'), step.id);
    });
    box.querySelector('#pliDown').onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, pliScale: Math.max(0.6, (ov.pliScale || 1) - 0.1) }; renderAll(); };
    box.querySelector('#pliUp').onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, pliScale: Math.min(1.6, (ov.pliScale || 1) + 0.1) }; renderAll(); };
    box.querySelector('#btnResetArrange').onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, pliPos:{x:0,y:0}, pliScale:1, calloutPos:{x:0,y:0} }; renderAll(); };
    box.querySelector('#btnInsText').onclick = () => {
      const txt = prompt('Enter note text to place on this page:', 'Check alignment before pressing down.');
      if (!txt) return;
      pushUndo();
      const arr = state.pageInserts[page.id] || [];
      arr.push({ id: 'ins_' + Date.now().toString(36), kind: 'text', text: txt, x: 30, y: 80, scale: 1 });
      state.pageInserts[page.id] = arr;
      renderAll();
    };
    box.querySelector('#btnInsImg').onclick = () => document.getElementById('insertImageInput').click();
    box.querySelector('#btnArrangePinBreak').onclick = () => {
      toggleStepPageBreak(step, { ch, followToggledStep: true });
    };
    if (hasSub) {
      box.querySelector('#btnToggleCallout').onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, calloutAsPages: !ov.calloutAsPages }; renderAll(); };
      const dirBtn = box.querySelector('#btnCalloutDir');
      if (dirBtn) dirBtn.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, calloutDir: ov.calloutDir === 'vertical' ? 'horizontal' : 'vertical' }; renderAll(); };
    }
    const delBtn = box.querySelector('#btnDelInsert');
    if (delBtn) delBtn.onclick = () => {
      pushUndo();
      state.pageInserts[page.id] = (state.pageInserts[page.id] || []).filter(x => x.id !== state.selectedArrangeEl.insertId);
      state.selectedArrangeEl = null;
      renderAll();
    };
  }
}

function getStepShortLabel(step, ch = null) {
  const isMfBuild = Boolean((step.isStandaloneFigure || ch?.kind === 'minifigure') && !step.isMinifigPoseStep);
  if (isMfBuild && step.minifigName) return `Step ${step.num} (${step.minifigName})`;
  return `Step ${step.num}`;
}

function toggleStepPageBreak(step, opts = {}) {
  if (!step) return;
  const { ch = null, followToggledStep = false, refreshOverview = false } = opts;
  const currentPage = state.pages[state.pageIdx];
  const anchorStepId = state.selectedStepId || currentPage?.slots?.[0]?.step?.id || null;
  const prevPageIdx = findPageIndexForStep(state.pages, step.id);
  const prevPage = prevPageIdx >= 0 ? state.pages[prevPageIdx] : null;
  const prevSlotIdx = prevPage?.slots ? prevPage.slots.findIndex(sl => sl.step.id === step.id) : 0;
  const toggledWasSelectedOnCurrentPage = Boolean(
    currentPage?.slots?.some(sl => sl.step.id === step.id) && state.selectedStepId === step.id,
  );

  pushUndo();
  const res = toggleStepPageBreakOverride(state.overrides, step.id);
  state.overrides = res.overrides;
  rebuildPages();

  const targetIdx = findPageIndexForStep(state.pages, step.id);
  if (followToggledStep || toggledWasSelectedOnCurrentPage) {
    if (targetIdx >= 0) state.pageIdx = targetIdx;
    state.selectedStepId = step.id;
  } else if (anchorStepId) {
    const anchorIdx = findPageIndexForStep(state.pages, anchorStepId);
    if (anchorIdx >= 0) state.pageIdx = anchorIdx;
  }

  renderAll();
  const ovModal = document.getElementById('overviewModal');
  if (refreshOverview || (ovModal && !ovModal.classList.contains('hidden'))) {
    renderOverviewModal();
  }

  const targetPg = targetIdx >= 0 ? state.pages[targetIdx] : null;
  const movedToNewPage = res.pinned && prevSlotIdx > 0;
  showToast(getStepBreakFeedbackMessage({
    stepLabel: getStepShortLabel(step, ch),
    pinned: res.pinned,
    movedToNewPage,
    targetPageNum: targetPg?.num ?? null,
  }));
}

function applyMinifigStyleChange(rawStyle, anchorStepId = null) {
  const nextStyle = normalizeMinifigStepStyle(rawStyle);
  const currentStepId = anchorStepId || state.pages[state.pageIdx]?.slots?.[0]?.step?.id || null;
  state.minifigStyle = nextStyle;
  rebuildPages();
  if (currentStepId) {
    const idx = state.pages.findIndex(pg => pg.slots?.some(sl => sl.step.id === currentStepId));
    if (idx >= 0) state.pageIdx = idx;
  }
  renderAll();
}

// =========================================================================
// 9. MENU, STYLE POPOVER & PAGE OVERVIEW OVERLAY SYNC
// =========================================================================
function syncMenuControls() {
  const hasModel = Boolean(state.model);
  document.getElementById('menuSaveProj').disabled = !hasModel;
  document.getElementById('menuRegenBtn').disabled = !hasModel || !state.model._parsed;
  const subBtn = document.getElementById('menuSubdivideBtn');
  if (subBtn) subBtn.disabled = !hasModel || !state.model._parsed;

  document.querySelectorAll('.fmt-btn').forEach(b => {
    const fmtId = b.getAttribute('data-format');
    const act = fmtId === state.paperFormat;
    b.className = `fmt-btn py-2.5 px-3 rounded-xl border text-left transition ${fmtId === 'custom' ? 'sm:col-span-2 ' : ''}${act ? 'border-[#1a73e8] bg-[#1a73e8]/15 text-[#1a73e8]' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  document.getElementById('customSizeWrap').classList.toggle('hidden', state.paperFormat !== 'custom');
  document.getElementById('orientationWrap').classList.toggle('hidden', state.paperFormat === 'screen' || state.paperFormat === 'square' || state.paperFormat === 'custom');
  const wInEl = document.getElementById('customWidthIn'), hInEl = document.getElementById('customHeightIn');
  if (wInEl && document.activeElement !== wInEl) wInEl.value = String(Number(state.customWidth.toFixed(2)));
  if (hInEl && document.activeElement !== hInEl) hInEl.value = String(Number(state.customHeight.toFixed(2)));
  document.querySelectorAll('.unit-btn').forEach(b => {
    const act = b.getAttribute('data-unit') === state.customUnit;
    b.className = `unit-btn px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${act ? 'bg-[#1a73e8] text-white' : 'text-[var(--muted-foreground)]'}`;
  });
  const cDiv = state.customUnit === 'cm' ? 2.54 : 1;
  const cWIn = Math.max(2, (Number(state.customWidth) || 10) / cDiv);
  const cHIn = Math.max(2, (Number(state.customHeight) || 8) / cDiv);
  const customFmtSub = document.getElementById('customFmtSub');
  if (customFmtSub) customFmtSub.textContent = formatPhysicalDims(cWIn, cHIn);
  const equivEl = document.getElementById('customUnitEquiv');
  if (equivEl) {
    equivEl.textContent = state.customUnit === 'in'
      ? `= ${(cWIn * 2.54).toFixed(1)} × ${(cHIn * 2.54).toFixed(1)} cm`
      : `= ${cWIn.toFixed(2)} × ${cHIn.toFixed(2)} in`;
  }
  const activeFmt = PAPER_FORMATS[state.paperFormat] || PAPER_FORMATS.screen;
  const [actWIn, actHIn] = getActivePagePhysicalInches();
  const menuPageSum = document.getElementById('menuPageSetupSummary');
  if (menuPageSum) {
    const orientShort = (state.paperFormat === 'letter' || state.paperFormat === 'a4')
      ? ` · ${state.orientation === 'portrait' ? 'Portrait' : 'Landscape'}`
      : state.paperFormat === 'custom'
        ? ` · ${state.customWidth}×${state.customHeight} ${state.customUnit}`
        : '';
    menuPageSum.textContent = `${activeFmt.name}${orientShort}`;
  }
  const pageSetupSub = document.getElementById('pageSetupSubtitle');
  if (pageSetupSub) {
    pageSetupSub.textContent = state.paperFormat === 'screen'
      ? 'Adapts to current screen · Change paper size, margins & steps per page'
      : `${activeFmt.name} · ${formatPhysicalDims(actWIn, actHIn)}`;
  }
  document.querySelectorAll('.orient-btn').forEach(b => {
    const act = b.getAttribute('data-orient') === state.orientation;
    b.className = `orient-btn py-2 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  document.querySelectorAll('.layout-btn').forEach(b => {
    const act = b.getAttribute('data-layout') === state.layout;
    b.className = `layout-btn py-2 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  document.querySelectorAll('.dens-btn').forEach(b => {
    const act = b.getAttribute('data-density') === state.density;
    b.className = `dens-btn py-2 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  document.querySelectorAll('.pgnum-btn').forEach(b => {
    const act = b.getAttribute('data-pgnum') === state.pageNumberFormat;
    b.className = `pgnum-btn py-2 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
  setChk('toggleStepBorders', state.showStepBorders);
  setChk('toggleStepBordersSetup', state.showStepBorders);
  setChk('togglePageTitle', state.showPageTitle);
  setChk('togglePageTitleSetup', state.showPageTitle);
  setChk('toggleCompleteText', state.completeMeta.showText !== false);
  setChk('toggleCompleteFireworks', state.completeMeta.showFireworks !== false);
  setChk('togglePrintGuides', state.showPrintGuides);
  setChk('toggleExtras', state.showExtras);
  setChk('toggleDetectDuplicates', state.detectDuplicates);
  setChk('toggleMinifig1to1', state.showMinifig1to1);
  const curMfStyleGlobal = normalizeMinifigStepStyle(state.minifigStyle);
  document.querySelectorAll('.mf-style-btn').forEach(b => {
    const act = b.getAttribute('data-mf-style') === curMfStyleGlobal;
    b.className = `mf-style-btn py-1.5 px-1 rounded-full border font-semibold text-[11px] transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });

  const bc = state.bomConfig;
  document.querySelectorAll('.bom-dens-btn').forEach(b => {
    const act = b.getAttribute('data-bom-dens') === bc.density;
    b.className = `bom-dens-btn py-2 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  document.querySelectorAll('.bom-flow-btn').forEach(b => {
    const act = b.getAttribute('data-bom-flow') === bc.flow;
    b.className = `bom-flow-btn py-2 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  const alignHead = document.getElementById('bomAlignHeading');
  if (alignHead) alignHead.textContent = bc.flow === 'columns' ? 'Hanging Column Alignment' : 'Hanging Row Alignment';
  const alignLabels = bc.flow === 'columns'
    ? { start: 'Top', center: 'Center', end: 'Bottom' }
    : { start: 'Left', center: 'Center', end: 'Right' };
  document.querySelectorAll('.bom-align-btn').forEach(b => {
    const id = b.getAttribute('data-bom-align');
    const act = id === bc.align;
    b.textContent = alignLabels[id] || id;
    b.className = `bom-align-btn py-2 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  const spEl = document.getElementById('bomSortPrimary');
  if (spEl) spEl.value = bc.sortPrimary;
  const ssEl = document.getElementById('bomSortSecondary');
  if (ssEl) ssEl.value = bc.sortSecondary;
  setChk('toggleBomNames', bc.showNames !== false);

  const traitNames = { color: 'Color', category: 'Category', qty: 'Quantity', size: 'Size', name: 'Name' };
  const densNames = { compact: 'Compact', balanced: 'Balanced', spacious: 'Spacious' };
  const bomMenuSum = document.getElementById('menuBomSetupSummary');
  if (bomMenuSum) bomMenuSum.textContent = `${densNames[bc.density] || 'Balanced'} · ${traitNames[bc.sortPrimary] || 'Color'}`;
  const bomSub = document.getElementById('bomSetupSubtitle');
  if (bomSub) {
    const bomPages = state.pages.filter(p => p.kind === 'bom');
    const uniqueN = bomPages[0]?.bomTotalUnique || 0;
    bomSub.textContent = bomPages.length > 0
      ? `${uniqueN} unique parts across ${bomPages.length} page${bomPages.length === 1 ? '' : 's'} · ${traitNames[bc.sortPrimary]} → ${traitNames[bc.sortSecondary]}`
      : `${densNames[bc.density]} · ${bc.flow === 'columns' ? 'Columns' : 'Rows'} · By ${traitNames[bc.sortPrimary]}`;
  }

  document.querySelectorAll('.pacing-btn').forEach(b => {
    const act = b.getAttribute('data-pacing') === state.pacing;
    b.className = `pacing-btn py-1.5 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });
  document.querySelectorAll('.fade-chip').forEach(b => {
    const act = Math.abs(parseFloat(b.getAttribute('data-fade')) - state.fadeOpacity) < 0.05;
    b.className = `fade-chip py-1 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });

  const pg = document.getElementById('presetGrid');
  pg.innerHTML = '';
  for (const t of Object.values(THEMES)) {
    const b = document.createElement('button');
    b.type = 'button';
    const act = t.id === state.themeId;
    b.className = `p-2.5 rounded-2xl border text-left transition ${act ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/25' : 'border-[var(--border)] hover:border-[#1a73e8]/50'}`;
    const swatch = document.createElement('div');
    swatch.className = 'h-6 rounded-lg mb-1.5 border border-black/10 relative overflow-hidden';
    applyThemeBackgroundToElement(swatch, t);
    const label = document.createElement('div');
    label.className = 'text-xs font-semibold truncate';
    label.textContent = t.name;
    b.appendChild(swatch);
    b.appendChild(label);
    b.onclick = () => { state.themeId = t.id; renderAll(); };
    pg.appendChild(b);
  }

  const cg = document.getElementById('customThemeGrid');
  const exportBtn = document.getElementById('btnExportThemes');
  if (exportBtn) {
    exportBtn.classList.toggle('hidden', customThemes.length === 0);
    exportBtn.title = customThemes.length === 1
      ? 'Export custom theme (.bictheme.json)'
      : `Export all ${customThemes.length} custom themes (.bictheme.json)`;
  }
  if (cg) {
    cg.innerHTML = '';
    cg.classList.toggle('hidden', customThemes.length === 0);
    for (const t of customThemes) {
      const card = document.createElement('div');
      const act = t.id === state.themeId;
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
      card.className = `p-2.5 rounded-2xl border text-left transition cursor-pointer ${act ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/25' : 'border-[var(--border)] hover:border-[#1a73e8]/50'}`;

      const swatch = document.createElement('div');
      swatch.className = 'h-6 rounded-lg mb-1.5 border border-black/10 relative overflow-hidden flex items-center justify-end px-1.5';
      applyThemeBackgroundToElement(swatch, t);
      const dot = document.createElement('span');
      dot.className = 'w-2.5 h-2.5 rounded-full border border-white/70 shadow-xs shrink-0';
      dot.style.background = t.accent;
      swatch.appendChild(dot);

      const footer = document.createElement('div');
      footer.className = 'flex items-center justify-between gap-1';
      const label = document.createElement('span');
      label.className = 'text-xs font-semibold truncate min-w-0';
      label.textContent = t.name;

      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.title = `Edit ${t.name}`;
      editBtn.setAttribute('aria-label', `Edit ${t.name}`);
      editBtn.className = 'w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[var(--muted-foreground)] hover:text-[#1a73e8] hover:bg-black/5 dark:hover:bg-white/10 transition';
      editBtn.innerHTML = '<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        openThemeEditor(t);
      };

      footer.appendChild(label);
      footer.appendChild(editBtn);
      card.appendChild(swatch);
      card.appendChild(footer);
      card.onclick = () => { state.themeId = t.id; renderAll(); };
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          state.themeId = t.id;
          renderAll();
        }
      };
      cg.appendChild(card);
    }
  }
}

function renderOverviewModal() {
  const list = document.getElementById('overviewList');
  const prevScrollTop = list.scrollTop;
  list.innerHTML = '';

  const pageBreakSvg = '<svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4"/><path d="M10 12h4"/><path d="M17 12h4"/><path d="M6 4v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4"/><path d="M6 20v-3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>';

  const breakCount = countStepPageBreaks(state.model?.chapters, state.overrides);

  const clearBtn = document.getElementById('btnClearAllPins');
  if (clearBtn) {
    if (breakCount > 0) {
      clearBtn.textContent = `Clear ${breakCount}`;
      clearBtn.title = `Remove all ${breakCount} page break${breakCount === 1 ? '' : 's'}`;
      clearBtn.classList.remove('hidden');
      clearBtn.onclick = () => {
        const anchorStepId = state.selectedStepId || state.pages[state.pageIdx]?.slots?.[0]?.step?.id || null;
        pushUndo();
        const cleared = clearAllStepPageBreaks(state.overrides);
        state.overrides = cleared.overrides;
        rebuildPages();
        if (anchorStepId) {
          const anchorIdx = findPageIndexForStep(state.pages, anchorStepId);
          if (anchorIdx >= 0) state.pageIdx = anchorIdx;
        }
        renderAll();
        renderOverviewModal();
        showToast('Cleared all page breaks — pages can reflow freely.');
      };
    } else {
      clearBtn.classList.add('hidden');
      clearBtn.onclick = null;
    }
  }

  const jumpToPageAndStep = (idx, stepId = null) => {
    state.pageIdx = idx;
    if (stepId) state.selectedStepId = stepId;
    state.selectedPartIds.clear();
    document.getElementById('overviewModal').classList.add('hidden');
    resetZoom();
    renderAll();
  };

  state.pages.forEach((pg, idx) => {
    const active = idx === state.pageIdx;
    const slots = pg.slots || [];

    // Non-step pages (Cover, Divider, Submodel Page, Build Complete, Parts List, Back Cover)
    if (slots.length === 0) {
      const row = document.createElement('div');
      if (active) row.dataset.active = 'true';
      row.className = `flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border cursor-pointer transition ${active ? 'border-[#1a73e8] bg-[#1a73e8]/10' : 'border-[var(--border)] bg-[var(--background)] hover:border-[#1a73e8]/45'}`;
      const showChapterSub = Boolean(pg.chapterName && pg.chapterName !== pg.label);
      row.innerHTML = `
        <div class="min-w-0">
          <div class="font-bold truncate">${escHtml(`Page ${pg.num} · ${pg.label}`)}</div>
          ${showChapterSub ? `<div class="text-[11px] text-[var(--muted-foreground)] truncate">${escHtml(pg.chapterName)}</div>` : ''}
        </div>`;
      row.onclick = () => jumpToPageAndStep(idx, null);
      list.appendChild(row);
      return;
    }

    const firstSlot = slots[0];
    const firstStep = firstSlot.step;
    const startsWithBreak = hasStepPageBreak(state.overrides, firstStep.id, firstSlot);

    if (startsWithBreak) {
      const divider = document.createElement('div');
      divider.className = 'flex items-center gap-2 px-2 pt-1 text-[10px] font-bold text-[#1a73e8] select-none';
      divider.innerHTML = `
        <div class="flex-1 border-t border-dashed border-[#1a73e8]/55"></div>
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          ${pageBreakSvg}
          <span>Page Break · ${escHtml(getStepShortLabel(firstStep, firstSlot.ch))} starts a new page</span>
        </span>
        <div class="flex-1 border-t border-dashed border-[#1a73e8]/55"></div>`;
      list.appendChild(divider);
    }

    const card = document.createElement('div');
    card.className = `rounded-2xl border overflow-hidden transition ${active ? 'border-[#1a73e8] bg-[#1a73e8]/[0.04]' : 'border-[var(--border)] bg-[var(--background)]'}`;

    const pageHeader = document.createElement('div');
    pageHeader.className = `flex items-center justify-between gap-2 px-3 py-1.5 border-b cursor-pointer transition ${active ? 'border-[#1a73e8]/25 bg-[#1a73e8]/10' : 'border-[var(--border)]/70 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}`;
    const showChapterName = Boolean(pg.chapterName);
    pageHeader.innerHTML = `
      <div class="flex items-center gap-1.5 min-w-0 text-[11px]">
        <span class="font-bold shrink-0">Page ${pg.num}</span>
        ${showChapterName ? `<span class="text-[var(--muted-foreground)] truncate">· ${escHtml(pg.chapterName)}</span>` : ''}
      </div>
      <span class="text-[10px] font-semibold text-[var(--muted-foreground)] shrink-0">${slots.length === 1 ? '1 step' : `${slots.length} steps`}</span>`;
    pageHeader.onclick = () => jumpToPageAndStep(idx, firstStep.id);
    card.appendChild(pageHeader);

    const stepsWrap = document.createElement('div');
    stepsWrap.className = 'divide-y divide-[var(--border)]/60';

    slots.forEach((slot, slotIdx) => {
      const step = slot.step;
      const isSeqCont = isStepBreakContinuationSlice(slot);
      const hasBreak = hasStepPageBreak(state.overrides, step.id, slot);
      const isStepActive = active && (state.selectedStepId === step.id || (!state.selectedStepId && slotIdx === 0));
      const isMfBuild = Boolean((step.isStandaloneFigure || slot.ch?.kind === 'minifigure') && !step.isMinifigPoseStep);

      const stepTitle = isMfBuild && step.minifigName
        ? `Step ${step.num} · ${step.minifigName}`
        : `Step ${step.num}`;

      const metaParts = [];
      if (slot.minifigSeqSlice) {
        const sl = slot.minifigSeqSlice;
        metaParts.push(sl.end - sl.start === 1 ? `Sub-step ${sl.start + 1}` : `Sub-steps ${sl.start + 1}–${sl.end}`);
      } else {
        const partCount = (step.parts || []).length;
        if (partCount > 0) metaParts.push(`${partCount} pc${partCount === 1 ? '' : 's'}`);
      }
      if (step.subassembly) metaParts.push(step.subassembly.name || 'Callout');
      else if (step.attachedSubmodel) metaParts.push(`Attach ${step.attachedSubmodel.name || 'Submodel'}`);
      else if (step.attachedMinifig) metaParts.push(`Place ${step.attachedMinifig.name || 'Minifigure'}`);
      else if (step.isMinifigPoseStep) metaParts.push('Pose');
      const stepMeta = metaParts.join(' · ');

      const stepRow = document.createElement('div');
      if (isStepActive) stepRow.dataset.active = 'true';
      stepRow.className = `flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition ${isStepActive ? 'bg-[#1a73e8]/10' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'}`;

      const breakTitle = getStepBreakTooltip({
        stepLabel: getStepShortLabel(step, slot.ch),
        pinned: hasBreak,
        slotIndex: slotIdx,
      });

      stepRow.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          ${isStepActive ? '<span class="w-1.5 h-1.5 rounded-full bg-[#1a73e8] shrink-0" aria-hidden="true"></span>' : ''}
          <div class="min-w-0">
            <div class="font-semibold truncate ${isStepActive ? 'text-[#1a73e8]' : ''}">${escHtml(stepTitle)}</div>
            ${stepMeta ? `<div class="text-[11px] text-[var(--muted-foreground)] truncate">${escHtml(stepMeta)}</div>` : ''}
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          ${isSeqCont
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-medium text-[var(--muted-foreground)] bg-black/5 dark:bg-white/10">Continued</span>'
            : `<button type="button" title="${escHtml(breakTitle)}" aria-label="${escHtml(`Page break before Step ${step.num}`)}" aria-pressed="${hasBreak ? 'true' : 'false'}" class="ov-step-pin px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1 transition ${hasBreak ? 'bg-[#1a73e8] text-white border-transparent' : 'border-[var(--border)] bg-[var(--card)] hover:border-[#1a73e8]/60'}">${pageBreakSvg}<span>Page Break</span></button>`}
        </div>`;

      stepRow.onclick = () => jumpToPageAndStep(idx, step.id);

      const pinBtn = stepRow.querySelector('.ov-step-pin');
      if (pinBtn) {
        pinBtn.onclick = (e) => {
          e.stopPropagation();
          toggleStepPageBreak(step, { ch: slot.ch, refreshOverview: true });
        };
      }

      stepsWrap.appendChild(stepRow);
    });

    card.appendChild(stepsWrap);
    list.appendChild(card);
  });

  list.scrollTop = prevScrollTop;
}

// =========================================================================
// 10. STAGE GESTURES (Zero-Jitter Native Touch Pinch/Pan + Focal Wheel Zoom)
// =========================================================================
(function setupStageGestures() {
  const stage = document.getElementById('stageViewport');
  let modeTouch = null; // 'pan' | 'pinch' | null
  let startZoom = 1, startPanX = 0, startPanY = 0;
  let startX = 0, startY = 0, startDist = 0, startMidX = 0, startMidY = 0;
  let lastTapTime = 0, touchMoved = false;

  // Desktop mouse wheel focal-point zoom
  stage.addEventListener('wheel', (e) => {
    if (!state.model) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0018);
    setZoom(state.zoom * factor, e.clientX, e.clientY);
  }, { passive: false });

  // Native synchronous Touch Events (iOS Safari samples both fingers on the exact same timestamp -> ZERO jitter!)
  stage.addEventListener('touchstart', (e) => {
    if (!state.model) return;
    if (e.target?.closest?.('a[href]')) return;
    const t = e.touches;
    if (t.length === 2) {
      e.preventDefault();
      modeTouch = 'pinch'; touchMoved = true;
      startZoom = state.zoom; startPanX = state.panX; startPanY = state.panY;
      startDist = Math.max(10, Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY));
      startMidX = (t[0].clientX + t[1].clientX) / 2;
      startMidY = (t[0].clientY + t[1].clientY) / 2;
    } else if (t.length === 1 && isPanGestureEnabled()) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTapTime < 280) { resetZoom(); modeTouch = null; touchMoved = true; return; }
      lastTapTime = now;
      modeTouch = 'pan'; touchMoved = false;
      startPanX = state.panX; startPanY = state.panY;
      startX = t[0].clientX; startY = t[0].clientY;
    }
  }, { passive: false });

  stage.addEventListener('touchmove', (e) => {
    if (!state.model || !modeTouch) return;
    const t = e.touches;
    if (modeTouch === 'pinch' && t.length >= 2) {
      e.preventDefault();
      touchMoved = true;
      const dist = Math.max(10, Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY));
      const midX = (t[0].clientX + t[1].clientX) / 2;
      const midY = (t[0].clientY + t[1].clientY) / 2;
      const nextZoom = Math.max(0.45, Math.min(4.5, startZoom * (dist / startDist)));
      const { cx, cy } = getStageOrigin();
      const ratio = nextZoom / startZoom;
      state.zoom = nextZoom;
      state.panX = (midX - cx) - ((startMidX - cx) - startPanX) * ratio;
      state.panY = (midY - cy) - ((startMidY - cy) - startPanY) * ratio;
      applyStageTransform();
    } else if (modeTouch === 'pan' && t.length === 1 && isPanGestureEnabled()) {
      e.preventDefault();
      if (Math.hypot(t[0].clientX - startX, t[0].clientY - startY) > 10) touchMoved = true;
      state.panX = startPanX + (t[0].clientX - startX);
      state.panY = startPanY + (t[0].clientY - startY);
      applyStageTransform();
    }
  }, { passive: false });

  const endTouch = (e) => {
    const t = e.touches;
    if (t.length === 1 && isPanGestureEnabled()) {
      modeTouch = 'pan';
      startPanX = state.panX; startPanY = state.panY;
      startX = t[0].clientX; startY = t[0].clientY;
    } else if (t.length === 0) {
      if (modeTouch === 'pan' && !touchMoved && state.pages[state.pageIdx]?.kind === 'bom') {
        state.bomShortcutVisible = !state.bomShortcutVisible;
        renderContextOverlay(state.pages[state.pageIdx]);
      }
      modeTouch = null;
    }
  };
  stage.addEventListener('touchend', endTouch, { passive: true });
  stage.addEventListener('touchcancel', endTouch, { passive: true });

  // Desktop mouse drag panning (Pan mode or read-only pages)
  let mouseDragging = false;
  stage.addEventListener('mousedown', (e) => {
    if (!state.model || !isPanGestureEnabled() || e.button !== 0) return;
    if (e.target?.closest?.('a[href]')) return;
    mouseDragging = true;
    startPanX = state.panX; startPanY = state.panY;
    startX = e.clientX; startY = e.clientY;
  });
  window.addEventListener('mousemove', (e) => {
    if (!mouseDragging) return;
    state.panX = startPanX + (e.clientX - startX);
    state.panY = startPanY + (e.clientY - startY);
    applyStageTransform();
  });
  window.addEventListener('mouseup', () => { mouseDragging = false; });
})();

// =========================================================================
// 11. INDEXEDDB PERSISTENCE, BRICKS LIBRARY IMPORTER & ERRORS/DIAGNOSTICS
// =========================================================================
const DB_NAME = 'BrickInstructionCreatorDB', DB_STORE = 'session', LIB_STORE = 'partsLib';
function openSessionDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('No IndexedDB'));
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE);
      if (!req.result.objectStoreNames.contains(LIB_STORE)) req.result.createObjectStore(LIB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(key, val, storeName = DB_STORE) {
  try {
    const db = await openSessionDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(val, key);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch (_) {}
}
async function dbGet(key, storeName = DB_STORE) {
  try {
    const db = await openSessionDB();
    return await new Promise((res, rej) => {
      const tx = db.transaction(storeName, 'readonly');
      const r = tx.objectStore(storeName).get(key);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  } catch (_) { return null; }
}
async function dbClearStore(storeName) {
  try {
    const db = await openSessionDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch (_) {}
}

function registerUserLibDat(rawName, text) {
  const k = normId(rawName);
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  userLibRaw.set(k, lines);
  textureStore.scanDatLinesForTextures(lines, 'library');
  const tLine = lines.find(l => l.startsWith('0 ') && !/^0\s+(FILE|Name:|Author:|IsSubModel|BL_|Flexible|Render|IsAssembly|!|BFC|PE_TEX_)/i.test(l));
  const title = tLine ? tLine.replace(/^0\s+/, '').trim() : null;
  if (title) userLibTitles.set(k, title);
  for (let i = 0; i < Math.min(lines.length, 16); i++) {
    const mBl = lines[i].match(/^0\s+BL_Item_No\s+(\S+)/i);
    if (mBl && mBl[1] && mBl[1] !== '-1') {
      const alias = normId(mBl[1]);
      if (alias && alias !== k && !userLibRaw.has(alias)) {
        userLibRaw.set(alias, lines);
        if (title) userLibTitles.set(alias, title);
      }
      break;
    }
  }
}

function updateLibraryStatusUI() {
  const libCount = userLibRaw.size;
  const embCount = embeddedDatRaw.size;
  const statusEl = document.getElementById('libStatusText');
  const clearBtn = document.getElementById('menuClearLibBtn');
  if (statusEl) {
    statusEl.textContent = libCount > 0
      ? `${libCount.toLocaleString()} saved${embCount ? ` · ${embCount} embedded` : ''}`
      : (embCount > 0 ? `${embCount} embedded (.io)` : 'None imported');
  }
  if (clearBtn) clearBtn.classList.toggle('hidden', libCount === 0);
}

async function loadSavedBricksLibrary() {
  try {
    const db = await openSessionDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(LIB_STORE, 'readonly');
      const req = tx.objectStore(LIB_STORE).openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          registerUserLibDat(cursor.key, cursor.value);
          cursor.continue();
        } else res();
      };
      req.onerror = () => rej(req.error);
    });
  } catch (_) {}
  await textureStore.predecodeAllPending();
  updateLibraryStatusUI();
}

async function importBricksLibraryFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const progWrap = document.getElementById('libProgressWrap');
  const progLabel = document.getElementById('libProgressLabel');
  const progPct = document.getElementById('libProgressPct');
  const progBar = document.getElementById('libProgressBar');
  progWrap.classList.remove('hidden');

  let imported = 0;
  try {
    const db = await openSessionDB().catch(() => null);
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.dat')) {
        const text = await file.text();
        const k = normId(file.name);
        registerUserLibDat(k, text);
        if (db) await dbPut(k, text, LIB_STORE);
        imported++;
      } else if (lower.endsWith('.zip')) {
        progLabel.textContent = `Reading ${file.name}…`;
        const ab = await file.arrayBuffer();
        const bytes = new Uint8Array(ab), view = new DataView(ab);
        let eocd = -1;
        for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
          if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
        }
        if (eocd < 0) throw new Error('Not a valid ZIP archive.');
        const cdCount = view.getUint16(eocd + 10, true);
        let ptr = view.getUint32(eocd + 16, true);
        const datEntries = [];
        const texEntries = [];
        for (let i = 0; i < cdCount; i++) {
          if (view.getUint32(ptr, true) !== 0x02014b50) break;
          const flags = view.getUint16(ptr + 8, true);
          const method = view.getUint16(ptr + 10, true);
          const compSize = view.getUint32(ptr + 20, true);
          const nameLen = view.getUint16(ptr + 28, true);
          const extraLen = view.getUint16(ptr + 30, true);
          const commentLen = view.getUint16(ptr + 32, true);
          const localOffset = view.getUint32(ptr + 42, true);
          const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
          const ln = name.toLowerCase();
          if (ln.endsWith('.dat') && !(flags & 1)) {
            datEntries.push({ name, flags, method, compSize, localOffset });
          } else if (/\.(png|jpg|jpeg|webp)$/i.test(ln) && ln.includes('texture') && !(flags & 1)) {
            texEntries.push({ name, flags, method, compSize, localOffset });
          }
          ptr += 46 + nameLen + extraLen + commentLen;
        }
        for (const ent of texEntries) {
          try {
            const u8 = await readZipEntryBytes(bytes, view, ent);
            if (u8.length > 24) {
              textureStore.registerBase64Texture(bytesToBase64(u8), { name: ent.name, source: 'library' });
            }
          } catch (_) {}
        }
        // Batch write to IndexedDB in chunks of 250 for speed & stability
        for (let i = 0; i < datEntries.length; i += 250) {
          const batch = datEntries.slice(i, i + 250);
          const decoded = [];
          for (const ent of batch) {
            try {
              const txt = await readZipEntryText(bytes, view, ent);
              const k = normId(ent.name);
              registerUserLibDat(k, txt);
              decoded.push([k, txt]);
              imported++;
            } catch (_) {}
          }
          if (db && decoded.length) {
            await new Promise((res) => {
              const tx = db.transaction(LIB_STORE, 'readwrite');
              const st = tx.objectStore(LIB_STORE);
              for (const [k, txt] of decoded) st.put(txt, k);
              tx.oncomplete = () => res(); tx.onerror = () => res();
            });
          }
          const pct = Math.round((Math.min(i + 250, datEntries.length) / Math.max(1, datEntries.length)) * 100);
          progLabel.textContent = `Imported ${imported.toLocaleString()} / ${datEntries.length.toLocaleString()} parts…`;
          progPct.textContent = pct + '%';
          progBar.style.width = pct + '%';
          await new Promise(r => setTimeout(r, 4));
        }
      }
    }
    await textureStore.predecodeAllPending();
    embeddedDatCompiled.clear(); pliThumbCache.clear(); submodelThumbCache.clear(); clearMinifigDiagramCaches(); coverHeroCache.clear();
    updateLibraryStatusUI();
    if (state.model) {
      if (state.model._parsed) state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto', state.model._subdivisionPlan || null);
      computeModelDiagnostics();
      renderAll();
    }
    showToast(`Imported ${imported.toLocaleString()} brick shape${imported === 1 ? '' : 's'} into library.`);
  } catch (err) {
    showToast(err?.message || 'Could not import bricks library.');
  } finally {
    progWrap.classList.add('hidden');
  }
}

const PUBLIC_LDRAW_MIRRORS = [
  'https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/',
  'https://cdn.jsdelivr.net/gh/gkjohnson/ldraw-parts-library@master/complete/ldraw/',
];

function getSelectedPublicLibBases() {
  const sel = document.getElementById('libSourceSelect')?.value || PUBLIC_LDRAW_MIRRORS[0];
  if (sel === 'custom') {
    const raw = (document.getElementById('libCustomUrlInput')?.value || '').trim();
    if (raw) {
      const normalized = raw.endsWith('/') ? raw : raw + '/';
      return [normalized, ...PUBLIC_LDRAW_MIRRORS];
    }
    return [...PUBLIC_LDRAW_MIRRORS];
  }
  return [sel, ...PUBLIC_LDRAW_MIRRORS.filter(u => u !== sel)];
}

async function fetchDatFromPublicMirrors(normKey, bases) {
  const tryKeys = [normKey, ...getPartIdFallbacks(normKey)];
  let sawNetworkError = false;
  for (const key of tryKeys) {
    const clean = key.replace(/\.dat$/i, '');
    const paths = clean.startsWith('s/')
      ? [`parts/${clean}.dat`, `${clean}.dat`]
      : clean.startsWith('48/') || clean.startsWith('8/')
        ? [`p/${clean}.dat`, `${clean}.dat`]
        : [`parts/${clean}.dat`, `p/${clean}.dat`, `parts/s/${clean}.dat`];

    for (const base of bases) {
      for (const rel of paths) {
        try {
          const res = await fetch(base + rel, { mode: 'cors' });
          if (res.ok) {
            const text = await res.text();
            if (text && text.length > 10 && !/^\s*<!doctype/i.test(text)) {
              return { text, resolvedKey: clean, networkBlocked: false };
            }
          }
        } catch (_) {
          sawNetworkError = true;
        }
      }
    }
  }
  return { text: null, resolvedKey: normKey, networkBlocked: sawNetworkError };
}

let libHighlightTimer = null;
function scrollMenuToBricksLibrary(highlight = true) {
  const scrollBox = document.getElementById('menuScrollBody');
  const sec = document.getElementById('menuBricksLibSection');
  if (!sec) return;
  const doScroll = () => {
    if (scrollBox) {
      const boxRect = scrollBox.getBoundingClientRect();
      const secRect = sec.getBoundingClientRect();
      const targetTop = scrollBox.scrollTop + (secRect.top - boxRect.top) - 12;
      scrollBox.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
    } else {
      sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  // Two animation frames guarantee the newly unhidden drawer has completed layout on iOS Safari
  requestAnimationFrame(() => requestAnimationFrame(doScroll));
  if (highlight) {
    clearTimeout(libHighlightTimer);
    sec.classList.add('ring-2', 'ring-[#1a73e8]/60', 'rounded-2xl', 'p-2.5', '-mx-2.5', 'bg-[#1a73e8]/5');
    libHighlightTimer = setTimeout(() => {
      sec.classList.remove('ring-2', 'ring-[#1a73e8]/60', 'rounded-2xl', 'p-2.5', '-mx-2.5', 'bg-[#1a73e8]/5');
    }, 1800);
  }
}

async function fetchMissingPartsOnline() {
  const progWrap = document.getElementById('libProgressWrap');
  const progLabel = document.getElementById('libProgressLabel');
  const progPct = document.getElementById('libProgressPct');
  const progBar = document.getElementById('libProgressBar');
  progWrap.classList.remove('hidden');
  progLabel.textContent = 'Checking missing parts…';
  progPct.textContent = '0%';
  progBar.style.width = '0%';
  scrollMenuToBricksLibrary(false);

  // Gather missing leaf part IDs from current model (or starter set if no model loaded)
  const queue = [];
  const queued = new Set();
  const visitedLoaded = new Set();
  const enqueue = (rawId) => {
    const k = normId(rawId);
    const base = k.split('/').pop();
    if (!k || queued.has(k)) return;
    // Skip standard studs/arcs/rects we already synthesize procedurally at high speed!
    if (/^(stud|stud2|stud2a|stud3|stud3a|stud4|stud4a|studp01|rect|rect2p|\d+-\d+(cyli|cylo|cylc|disc|edge|ring\d+|rin\d+|chrd|ndis))$/.test(base)) return;
    // If already loaded as a real .dat (not a virtual synthesis), walk its nested type-1 subparts so partial shortcuts still fetch missing children!
    const existing = lookupEmbeddedDat(k, false);
    if (existing) {
      if (!visitedLoaded.has(existing.key)) {
        visitedLoaded.add(existing.key);
        for (const line of existing.lines) {
          const tr = line.trim();
          if (/^1\s/.test(tr)) {
            const toks = tr.split(/\s+/);
            if (toks.length >= 15) enqueue(toks.slice(14).join(' '));
          }
        }
      }
      return;
    }
    // BrickLink-proprietary printed/prefixed IDs (bl_*, *-bl, *pb####*, *_torso) never exist verbatim
    // in official LDraw mirrors — directly enqueue their canonical unprinted base LDraw ID!
    if (!k.includes('/') && /^(?:bl_|.*-bl$|.*(?:pb|ps|pat|pr)\d+|.*_torso$)/i.test(k)) {
      const fbs = getPartIdFallbacks(k);
      if (fbs.length > 0) {
        enqueue(fbs[0]);
        return;
      }
    }
    queued.add(k);
    queue.push(k);
  };

  if (state.model) {
    for (const { step } of getAllSteps(state.model)) {
      for (const p of step.parts) {
        const leaves = p.children && p.children.length > 0 ? p.children : [p];
        for (const lf of leaves) enqueue(lf.p);
      }
    }
  } else {
    ['3001','3002','3003','3004','3005','3020','3021','3022','3023','3024','3069b','3070b','3040b','4073','4733'].forEach(enqueue);
  }

  if (queue.length === 0) {
    progWrap.classList.add('hidden');
    showToast('All parts in this model already have 3D shapes loaded!');
    return;
  }

  const bases = getSelectedPublicLibBases();
  const db = await openSessionDB().catch(() => null);
  let fetched = 0, processed = 0, blocked = 0;

  // Bounded BFS over parts + their nested subparts/primitives (concurrency = 6)
  try {
    while (processed < queue.length && processed < 1500) {
      const batch = queue.slice(processed, Math.min(queue.length, processed + 6));
      processed += batch.length;
      const results = await Promise.all(batch.map(async (k) => {
        const res = await fetchDatFromPublicMirrors(k, bases);
        return { k, ...res };
      }));

      const toStore = [];
      for (const r of results) {
        if (r.text) {
          const storeKey = r.resolvedKey || r.k;
          registerUserLibDat(storeKey, r.text);
          toStore.push([storeKey, r.text]);
          fetched++;
          // Enqueue any referenced subparts / primitives inside this .dat!
          for (const line of r.text.split(/\r?\n/)) {
            const tr = line.trim();
            if (/^1\s/.test(tr)) {
              const toks = tr.split(/\s+/);
              if (toks.length >= 15) enqueue(toks.slice(14).join(' '));
            }
          }
        } else if (r.networkBlocked) {
          blocked++;
        }
      }

      if (db && toStore.length) {
        await new Promise((res) => {
          const tx = db.transaction(LIB_STORE, 'readwrite');
          const st = tx.objectStore(LIB_STORE);
          for (const [k, txt] of toStore) st.put(txt, k);
          tx.oncomplete = () => res(); tx.onerror = () => res();
        });
      }

      // If first batch is completely blocked by sandbox CSP / offline, stop early and guide user clearly
      if (processed <= 6 && fetched === 0 && blocked === batch.length) {
        progWrap.classList.add('hidden');
        showToast('Online fetch is blocked in this preview sandbox (works on Neocities / web). Use Import .zip / .dat here.');
        return;
      }

      const pct = Math.min(99, Math.round((processed / Math.max(1, queue.length)) * 100));
      progLabel.textContent = `Fetched ${fetched} part${fetched === 1 ? '' : 's'} (${processed}/${queue.length})…`;
      progPct.textContent = pct + '%';
      progBar.style.width = pct + '%';
    }

    await textureStore.predecodeAllPending();
    embeddedDatCompiled.clear(); pliThumbCache.clear(); submodelThumbCache.clear(); clearMinifigDiagramCaches(); coverHeroCache.clear();
    updateLibraryStatusUI();
    if (state.model) {
      if (fetched > 0 && state.model._parsed) state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto', state.model._subdivisionPlan || null);
      computeModelDiagnostics();
      renderAll();
    }
    showToast(fetched > 0
      ? `Fetched ${fetched} part shape${fetched === 1 ? '' : 's'} from public LDraw library.`
      : 'No matching parts found at that public source.');
  } finally {
    progWrap.classList.add('hidden');
  }
}

// ---- MODEL ERRORS & DIAGNOSTICS ENGINE ----
state.diagnostics = [];
state.seenDiagnosticKeys = new Set();
let errFilter = 'all', errorBannerTimer = null;

function computeModelDiagnostics() {
  const diags = [];
  if (!state.model) {
    state.diagnostics = [];
    state.seenDiagnosticKeys = new Set();
    updateErrorIndicators();
    return;
  }
  const missingByPart = new Map();
  const unknownColors = new Map();
  const allSteps = getMainSteps(state.model);

  for (const { step } of allSteps) {
    if (step.isMinifigPoseStep || (step.isMinifigBuildStep && step.placedInMain)) continue;
    for (const p of step.parts) {
      const leaves = p.children && p.children.length > 0 ? p.children : [p];
      // 1. Check for missing 3D piece shapes
      const missingLeaf = leaves.find(lf => !hasKnownShape(lf.p));
      if (missingLeaf) {
        const k = normId(missingLeaf.p);
        if (!missingByPart.has(k)) missingByPart.set(k, { partId: k, count: 0, steps: new Set() });
        const rec = missingByPart.get(k);
        rec.count++; rec.steps.add(step.num);
      }
      // 2. Check for unmapped / unknown LDraw color IDs
      for (const lf of leaves) {
        if (!COLORS[lf.c]) {
          if (!unknownColors.has(lf.c)) unknownColors.set(lf.c, { colorId: lf.c, count: 0, steps: new Set() });
          const rec = unknownColors.get(lf.c);
          rec.count++; rec.steps.add(step.num);
        }
      }
      // 3. Check for disconnected / floating pieces
      if (p._detachedGap && p._detachedGap > 0) {
        const name = resolvePart(p.p).name;
        const isCompletelyFloating = !isFinite(p._detachedGap);
        diags.push({
          category: 'floating',
          severity: isCompletelyFloating ? 'error' : 'warning',
          title: isCompletelyFloating ? `Floating piece: ${name}` : `Weak connection: ${name}`,
          detail: isCompletelyFloating
            ? (p._floatHeight && p._floatHeight > 0
                ? `Part "${p.p}" in Step ${step.num} is floating ${(p._floatHeight / 20).toFixed(2)} studs above the ground with no nearby pieces touching it.`
                : `Part "${p.p}" in Step ${step.num} had no nearby pieces touching it and was placed on its own.`)
            : `Part "${p.p}" in Step ${step.num} was ${(p._detachedGap / 20).toFixed(2)} studs away from its nearest neighbor.`,
          stepNum: step.num,
          stepId: step.id,
        });
      }
    }
  }

  for (const rec of missingByPart.values()) {
    const stepArr = Array.from(rec.steps).sort((a, b) => a - b);
    const firstStep = allSteps.find(x => x.step.num === stepArr[0])?.step;
    const friendlyName = getHumanPartName(rec.partId);
    const reason = explainMissingPartReason(rec.partId);
    diags.push({
      category: 'missing_shape',
      severity: 'error',
      title: `${friendlyName} (${rec.count}×)`,
      partCode: `${rec.partId}.dat`,
      detail: `${reason} Used in Step${stepArr.length > 1 ? 's' : ''} ${stepArr.slice(0, 5).join(', ')}${stepArr.length > 5 ? '…' : ''}.`,
      stepNum: stepArr[0],
      stepId: firstStep?.id || null,
    });
  }

  for (const rec of unknownColors.values()) {
    const stepArr = Array.from(rec.steps).sort((a, b) => a - b);
    const firstStep = allSteps.find(x => x.step.num === stepArr[0])?.step;
    diags.push({
      category: 'color',
      severity: 'warning',
      colorId: rec.colorId,
      title: `Unknown LDraw color #${rec.colorId} (${rec.count}×)`,
      detail: `Color ID ${rec.colorId} is not in the color palette and fell back to Light Bluish Gray. First seen in Step ${stepArr[0]}.`,
      stepNum: stepArr[0],
      stepId: firstStep?.id || null,
    });
  }

  state.diagnostics = diags;
  state.seenDiagnosticKeys = pruneSeenDiagnosticKeys(diags, state.seenDiagnosticKeys);
  const errModalEl = document.getElementById('errorsModal');
  const isErrorsModalOpen = Boolean(errModalEl && !errModalEl.classList.contains('hidden'));
  if (isErrorsModalOpen) {
    state.seenDiagnosticKeys = acknowledgeDiagnostics(diags, state.seenDiagnosticKeys);
  }
  updateErrorIndicators();
  if (isErrorsModalOpen) renderErrorsModal();
}

function acknowledgeCurrentDiagnostics() {
  if (state.diagnostics.length === 0) return;
  const beforeSize = state.seenDiagnosticKeys.size;
  state.seenDiagnosticKeys = acknowledgeDiagnostics(state.diagnostics, state.seenDiagnosticKeys);
  updateErrorIndicators();
  if (state.seenDiagnosticKeys.size !== beforeSize) {
    scheduleSaveSessionPrefs();
  }
}

function updateErrorIndicators() {
  const totalCount = state.diagnostics.length;
  const badgeCount = getMenuIconErrorBadgeCount(state.diagnostics, state.seenDiagnosticKeys);
  const menuDot = document.getElementById('menuBtnErrorBadge');
  const menuPill = document.getElementById('menuErrorCountBadge');
  if (menuDot) {
    menuDot.textContent = formatMenuIconErrorBadge(badgeCount);
    menuDot.classList.toggle('hidden', badgeCount === 0);
  }
  if (menuPill) {
    menuPill.textContent = String(totalCount);
    menuPill.className = totalCount > 0
      ? 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white'
      : 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  }
}

let errorBannerFadeTimer = null;
function dismissErrorBanner(immediate = false) {
  clearTimeout(errorBannerTimer);
  clearTimeout(errorBannerFadeTimer);
  const el = document.getElementById('errorBanner');
  if (!el) return;
  if (immediate || el.classList.contains('hidden')) {
    el.classList.add('hidden');
    el.classList.remove('opacity-0', 'pointer-events-none');
    return;
  }
  el.classList.add('opacity-0', 'pointer-events-none');
  errorBannerFadeTimer = setTimeout(() => {
    el.classList.add('hidden');
    el.classList.remove('opacity-0', 'pointer-events-none');
  }, 300);
}

function showImportErrorBanner() {
  const n = state.diagnostics.length;
  if (n === 0) { dismissErrorBanner(true); return; }
  const txt = document.getElementById('errorBannerText');
  if (txt) txt.textContent = n === 1 ? 'There is 1 error.' : `There are ${n} errors.`;
  const el = document.getElementById('errorBanner');
  clearTimeout(errorBannerTimer);
  clearTimeout(errorBannerFadeTimer);
  el.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
  errorBannerTimer = setTimeout(() => dismissErrorBanner(false), 4500);
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderErrorsModal() {
  const diags = state.diagnostics;
  const counts = {
    all: diags.length,
    missing_shape: diags.filter(d => d.category === 'missing_shape').length,
    floating: diags.filter(d => d.category === 'floating').length,
    color: diags.filter(d => d.category === 'color').length,
  };
  if (!Object.prototype.hasOwnProperty.call(counts, errFilter)) errFilter = 'all';

  document.getElementById('errModalTitle').textContent = diags.length === 0
    ? 'No Model Errors'
    : `Model Errors & Warnings (${diags.length})`;

  const tabs = [
    { id: 'all', label: `All (${counts.all})` },
    { id: 'missing_shape', label: `Missing Shapes (${counts.missing_shape})` },
    { id: 'floating', label: `Disconnected (${counts.floating})` },
    { id: 'color', label: `Colors (${counts.color})` },
  ];
  const bar = document.getElementById('errFilterBar');
  bar.innerHTML = tabs.map(t => `
    <button data-ef="${t.id}" class="ef-btn shrink-0 px-3 py-1 rounded-full font-semibold transition ${errFilter === t.id ? 'bg-[#1a73e8] text-white' : 'bg-[var(--background)] border border-[var(--border)]'}">${t.label}</button>
  `).join('');
  bar.querySelectorAll('.ef-btn').forEach(b => {
    b.onclick = () => {
      errFilter = b.getAttribute('data-ef') || 'all';
      renderErrorsModal();
    };
  });

  const body = document.getElementById('errListBody');
  // Reset scroll offset BEFORE replacing innerHTML so iOS WebKit never leaves the
  // composited scroll layer stranded below shorter tab content (e.g., 22 items -> 1 item).
  body.scrollTop = 0;

  const filtered = errFilter === 'all' ? diags : diags.filter(d => d.category === errFilter);

  if (filtered.length === 0) {
    body.innerHTML = `
      <div class="py-10 text-center space-y-2">
        <div class="w-11 h-11 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-lg font-bold">✓</div>
        <div class="font-bold text-sm">Looking clean!</div>
        <p class="text-[11px] text-[var(--muted-foreground)]">No issues in this category.</p>
      </div>`;
    body.scrollTop = 0;
    requestAnimationFrame(() => { body.scrollTop = 0; });
    return;
  }

  let html = '';
  if (counts.missing_shape > 0 && (errFilter === 'all' || errFilter === 'missing_shape')) {
    html += `
      <div class="p-3 rounded-2xl bg-[#1a73e8]/10 border border-[#1a73e8]/30 flex items-center justify-between gap-2 flex-wrap">
        <div class="text-[11px]">
          <div class="font-bold text-[#1a73e8]">Missing ${counts.missing_shape} piece shape${counts.missing_shape > 1 ? 's' : ''}</div>
          <div class="text-[var(--muted-foreground)]">Fetch missing shapes from the public LDraw library or import <b>complete.zip</b>.</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button id="errFetchLibQuick" class="px-3 py-1.5 rounded-full bg-[#1a73e8] text-white font-semibold">Fetch Online</button>
          <button id="errImportLibQuick" class="px-3 py-1.5 rounded-full border border-[#1a73e8]/40 text-[#1a73e8] bg-[var(--card)] font-semibold">Import .zip</button>
        </div>
      </div>`;
  }

  html += filtered.map(d => {
    const isErr = d.severity === 'error';
    return `
      <div class="p-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-start justify-between gap-2.5">
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isErr ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'}">${isErr ? 'Error' : 'Warning'}</span>
            <span class="font-bold break-words">${escHtml(d.title)}</span>
            ${d.partCode ? `<span class="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-black/5 dark:bg-white/10 text-[var(--muted-foreground)] break-all">${escHtml(d.partCode)}</span>` : ''}
          </div>
          <p class="text-[11px] text-[var(--muted-foreground)] leading-relaxed break-words">${escHtml(d.detail)}</p>
        </div>
        ${d.stepId ? `<button data-jump-step="${escHtml(d.stepId)}" class="jump-step-btn shrink-0 px-2.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] font-semibold hover:border-[#1a73e8] hover:text-[#1a73e8]">Step ${d.stepNum} →</button>` : ''}
      </div>`;
  }).join('');

  body.innerHTML = html;
  // Force clean scroll & WebKit compositing sync after DOM update
  body.scrollTop = 0;
  void body.offsetHeight;
  requestAnimationFrame(() => { body.scrollTop = 0; });

  const quickFetch = body.querySelector('#errFetchLibQuick');
  if (quickFetch) quickFetch.onclick = async () => {
    document.getElementById('errorsModal').classList.add('hidden');
    openMenu();
    scrollMenuToBricksLibrary(true);
    await fetchMissingPartsOnline();
  };
  const quickLib = body.querySelector('#errImportLibQuick');
  if (quickLib) quickLib.onclick = () => {
    document.getElementById('errorsModal').classList.add('hidden');
    openMenu();
    scrollMenuToBricksLibrary(true);
    document.getElementById('libImportInput').click();
  };
  body.querySelectorAll('.jump-step-btn').forEach(btn => {
    btn.onclick = () => {
      const sid = btn.getAttribute('data-jump-step');
      const pIdx = state.pages.findIndex(pg => pg.slots?.some(sl => sl.step.id === sid));
      if (pIdx >= 0) {
        state.pageIdx = pIdx; state.selectedStepId = sid; state.selectedPartIds.clear();
        document.getElementById('errorsModal').classList.add('hidden');
        resetZoom(); renderAll();
      }
    };
  });
}

function openErrorsModal() {
  closeMenu();
  dismissErrorBanner();
  if (errFilter !== 'all' && state.diagnostics.length > 0 && !state.diagnostics.some(d => d.category === errFilter)) {
    errFilter = 'all';
  }
  acknowledgeCurrentDiagnostics();
  renderErrorsModal();
  document.getElementById('errorsModal').classList.remove('hidden');
}

function openPageSetupModal() {
  closeMenu();
  syncMenuControls();
  document.getElementById('pageSetupModal').classList.remove('hidden');
}

function openBomSetupModal() {
  closeMenu();
  syncMenuControls();
  document.getElementById('bomSetupModal').classList.remove('hidden');
}

let lastSourceRecord = null; // { kind:'io'|'ldr'|'project', fileName, data, importMode }
let savePrefsTimer = null;
function scheduleSaveSessionPrefs() {
  if (!state.model) return;
  clearTimeout(savePrefsTimer);
  savePrefsTimer = setTimeout(() => {
    dbPut('prefs', {
      themeId: state.themeId, paperFormat: state.paperFormat, orientation: state.orientation,
      customWidth: state.customWidth, customHeight: state.customHeight, customUnit: state.customUnit,
      density: state.density, showPrintGuides: state.showPrintGuides, layout: state.layout,
      pacing: state.pacing, detectDuplicates: state.detectDuplicates, highlightNew: state.highlightNew, highlightColor: state.highlightColor,
      fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity, showRotCues: state.showRotCues,
      showSizeGuides: state.showSizeGuides, minifigStyle: state.minifigStyle, showMinifig1to1: state.showMinifig1to1, showStepBorders: state.showStepBorders,
      showPageTitle: state.showPageTitle, pageNumberFormat: state.pageNumberFormat,
      showExtras: state.showExtras, bomConfig: state.bomConfig,
      overrides: state.overrides, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter,
      coverMeta: state.coverMeta, completeMeta: state.completeMeta, backMeta: state.backMeta, pageIdx: state.pageIdx,
      seenDiagnosticKeys: serializeSeenDiagnosticKeys(state.seenDiagnosticKeys),
    });
  }, 450);
}

// Hook renderAll to keep session preferences persisted automatically
const _origRenderAll = renderAll;
renderAll = function () {
  _origRenderAll();
  updateLibraryStatusUI();
  updateErrorIndicators();
  scheduleSaveSessionPrefs();
};

async function restoreLastSessionOnStart() {
  await loadSavedBricksLibrary();
  const dbThemes = await dbGet('customThemes');
  if (Array.isArray(dbThemes) && dbThemes.length > 0 && customThemes.length === 0) {
    const restored = dbThemes.map(t => normalizeCustomTheme(t)).filter(Boolean);
    if (restored.length > 0) {
      customThemes = restored;
      saveCustomThemesToStorage(customThemes);
    }
  } else if (customThemes.length > 0 && (!Array.isArray(dbThemes) || dbThemes.length === 0)) {
    dbPut('customThemes', customThemes);
  }
  const rec = await dbGet('lastModel');
  if (!rec) { renderAll(); return; }
  const prefs = (await dbGet('prefs')) || {};
  try {
    if (prefs.themeId) state.themeId = resolveThemeById(prefs.themeId, customThemes).id;
    if (prefs.paperFormat) state.paperFormat = prefs.paperFormat;
    if (prefs.orientation) state.orientation = prefs.orientation;
    if (typeof prefs.customWidth === 'number') state.customWidth = prefs.customWidth;
    if (typeof prefs.customHeight === 'number') state.customHeight = prefs.customHeight;
    if (prefs.customUnit === 'in' || prefs.customUnit === 'cm') state.customUnit = prefs.customUnit;
    if (prefs.density) state.density = prefs.density;
    if (typeof prefs.showPrintGuides === 'boolean') state.showPrintGuides = prefs.showPrintGuides;
    if (prefs.layout) state.layout = prefs.layout;
    if (prefs.pacing) state.pacing = prefs.pacing;
    if (typeof prefs.detectDuplicates === 'boolean') state.detectDuplicates = prefs.detectDuplicates;
    if (typeof prefs.highlightNew === 'boolean') state.highlightNew = prefs.highlightNew;
    if (prefs.highlightColor) state.highlightColor = prefs.highlightColor;
    if (typeof prefs.fadePrev === 'boolean') state.fadePrev = prefs.fadePrev;
    if (typeof prefs.fadeOpacity === 'number') state.fadeOpacity = prefs.fadeOpacity;
    if (typeof prefs.showRotCues === 'boolean') state.showRotCues = prefs.showRotCues;
    if (typeof prefs.showSizeGuides === 'boolean') state.showSizeGuides = prefs.showSizeGuides;
    if (prefs.minifigStyle) state.minifigStyle = normalizeMinifigStepStyle(prefs.minifigStyle);
    if (typeof prefs.showMinifig1to1 === 'boolean') state.showMinifig1to1 = prefs.showMinifig1to1;
    if (typeof prefs.showStepBorders === 'boolean') state.showStepBorders = prefs.showStepBorders;
    if (typeof prefs.showPageTitle === 'boolean') state.showPageTitle = prefs.showPageTitle;
    if (prefs.pageNumberFormat) state.pageNumberFormat = prefs.pageNumberFormat;
    if (typeof prefs.showExtras === 'boolean') state.showExtras = prefs.showExtras;
    if (prefs.bomConfig) state.bomConfig = { ...state.bomConfig, ...prefs.bomConfig };

    if (rec.kind === 'io' && rec.data) {
      const { m1Text, m2Text } = await extractIoArchive(rec.data);
      const parsed = parseImportedModel(m1Text, m2Text, rec.fileName);
      await textureStore.predecodeAllPending();
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto', rec.subdivisionPlan || null);
    } else if (rec.kind === 'ldr' && typeof rec.data === 'string') {
      textureStore.clearEmbedded();
      const parsed = parseImportedModel(rec.data, '', rec.fileName);
      await textureStore.predecodeAllPending();
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto', rec.subdivisionPlan || null);
    } else {
      renderAll(); return;
    }

    lastSourceRecord = rec;
    state.overrides = prefs.overrides || {};
    state.pageInserts = prefs.pageInserts || {};
    state.dividerAfter = prefs.dividerAfter || {};
    if (prefs.coverMeta) state.coverMeta = normalizeCoverMeta({ ...state.coverMeta, ...prefs.coverMeta });
    if (prefs.completeMeta) state.completeMeta = { ...state.completeMeta, ...prefs.completeMeta };
    if (prefs.backMeta) state.backMeta = { ...state.backMeta, ...prefs.backMeta };
    state.pageIdx = Math.max(0, prefs.pageIdx || 0);
    state.seenDiagnosticKeys = deserializeSeenDiagnosticKeys(prefs.seenDiagnosticKeys);
    // Sync checkboxes in DOM
    document.getElementById('togglePrintGuides').checked = state.showPrintGuides;
    document.getElementById('toggleExtras').checked = state.showExtras;
    document.getElementById('toggleHighlight').checked = state.highlightNew;
    document.getElementById('highlightColor').value = state.highlightColor;
    document.getElementById('toggleFade').checked = state.fadePrev;
    document.getElementById('toggleRotCues').checked = state.showRotCues;
    document.getElementById('toggleSizeGuides').checked = state.showSizeGuides;
    const mf1El = document.getElementById('toggleMinifig1to1');
    if (mf1El) mf1El.checked = state.showMinifig1to1;
    const dupEl = document.getElementById('toggleDetectDuplicates');
    if (dupEl) dupEl.checked = state.detectDuplicates;

    computeModelDiagnostics();
    resetZoom();
    renderAll();
    showToast(`Reloaded ${state.model.title}`);
    if (getMenuIconErrorBadgeCount(state.diagnostics, state.seenDiagnosticKeys) > 0) showImportErrorBanner();
  } catch (_) {
    renderAll();
  }
}

// =========================================================================
// 12. PURE-JS MULTI-PAGE PDF 1.4 GENERATOR (Imported from src/export/pdfBinary.ts)
// =========================================================================
function getPdfPaperPts() {
  const [wIn, hIn] = getActivePagePhysicalInches();
  return [Math.round(wIn * 72), Math.round(hIn * 72)];
}

function loadImgPromise(src) {
  return new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = src; });
}

function drawContain(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height || w <= 2 || h <= 2) return null;
  const sc = Math.min(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

function drawAlignedContain(ctx, img, x, y, maxW, maxH, alignX = 'left', alignY = 'top') {
  if (!img || !img.width || !img.height || maxW <= 2 || maxH <= 2) return null;
  const sc = Math.min(maxW / img.width, maxH / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  const dx = alignX === 'right' ? (x + maxW - dw) : alignX === 'center' ? (x + (maxW - dw) / 2) : x;
  const dy = alignY === 'bottom' ? (y + maxH - dh) : alignY === 'center' ? (y + (maxH - dh) / 2) : y;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

function drawCoverImage(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height || w <= 2 || h <= 2) return;
  const sc = Math.max(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxW, lineH, maxLines = 2) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxW) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length >= maxLines - 1) {
        const rest = [current, ...words.slice(i + 1)].join(' ');
        current = rest;
        break;
      }
    }
  }
  lines.push(current);
  const finalLines = lines.slice(0, maxLines);
  finalLines.forEach((ln, idx) => {
    ctx.fillText(ln, x, y + idx * lineH, maxW);
  });
  return finalLines.length * lineH;
}

function drawBrandLogoCanvas(ctx, x, y, size) {
  if (typeof Path2D === 'undefined') return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.translate(32, 32);
  ctx.rotate((BRAND_LOGO_ROTATION_DEG * Math.PI) / 180);
  ctx.translate(-32, -32);
  for (const [d, col] of BRAND_LOGO_PATHS) { ctx.fillStyle = col; ctx.fill(new Path2D(d)); }
  ctx.restore();
}

async function renderPageToJpegBytes(page, pxW, pxH, pageWpt = 792, pageHpt = 612) {
  const canvas = document.createElement('canvas');
  canvas.width = pxW; canvas.height = pxH;
  const ctx = canvas.getContext('2d');
  const theme = getActiveTheme();
  const allParts = getAllParts(state.model);
  const allSteps = getAllSteps(state.model);
  const links = [];

  // Fill background (supports solid, angled gradient, and blueprint grid for built-in & custom themes)
  fillThemeBackgroundCanvas(ctx, theme, pxW, pxH);

  const [wIn, hIn] = getActivePagePhysicalInches();
  const pxPerInch = pxW / Math.max(1, wIn);
  const typo = computePageTypography({
    widthIn: wIn,
    heightIn: hIn,
    pxPerInch,
    density: state.density,
    bomDensity: state.bomConfig?.density,
  });
  const pad = typo.pad;
  const footerH = typo.footerH;
  const footerTextY = pxH - Math.max(6, Math.round(pad * 0.42)) - Math.round(typo.footerFont * 1.15);
  const pgNumText = formatPageNumber(page.num, state.pages.length);
  const drawFooter = (leftLabel) => {
    if (state.showPageTitle && leftLabel) {
      ctx.fillStyle = theme.muted;
      ctx.font = `600 ${typo.footerFont}px -apple-system, sans-serif`;
      ctx.fillText(leftLabel, pad, footerTextY);
    }
    if (pgNumText) {
      ctx.fillStyle = theme.text; ctx.textAlign = 'right';
      ctx.font = `700 ${typo.footerFont}px -apple-system, sans-serif`;
      ctx.fillText(pgNumText, pxW - pad, footerTextY);
      ctx.textAlign = 'left';
    }
  };
  ctx.fillStyle = theme.text;
  ctx.textBaseline = 'top';

  if (page.kind === 'cover') {
    const dens = DENSITY_PAD[state.density] || DENSITY_PAD.balanced;
    const cm = normalizeCoverMeta(state.coverMeta);
    const title = (cm.title || state.model.title || 'Untitled Model').trim();
    const sub = (cm.subtitle || '').trim();
    const layout = computeCoverLayout({
      pageW: pxW,
      pageH: pxH,
      hasCreatorLogo: Boolean(cm.creatorLogoSrc),
      hasSubtitle: sub.length > 0,
      hasThemeImage: Boolean(cm.themeImageSrc),
      showQrCode: cm.showQrCode !== false,
      showProgramBadge: cm.showProgramBadge !== false,
      densityPadFactor: dens.pad / 20,
    });

    if (cm.bgSrc) {
      const bgImg = await loadImgPromise(cm.bgSrc);
      if (bgImg) drawCoverImage(ctx, bgImg, 0, 0, pxW, pxH);
    }

    // 1. High-Quality Page-Filling Hero Model Render
    const heroScale = Math.min(1.45, 2000 / Math.max(layout.heroRect.w, layout.heroRect.h, 1));
    const snap = renderCoverHeroSnapshot(
      allParts,
      cm.az,
      cm.el,
      cm.zoom,
      Math.round(layout.heroRect.w * heroScale),
      Math.round(layout.heroRect.h * heroScale),
      theme,
    );
    const heroImg = await loadImgPromise(snap.url);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawContain(ctx, heroImg, layout.heroRect.x, layout.heroRect.y, layout.heroRect.w, layout.heroRect.h);

    // 2. Top-Left: Optional Creator Logo + Model Name + Optional Subtitle
    let topLeftY = layout.pad;
    if (cm.creatorLogoSrc) {
      const creatorImg = await loadImgPromise(cm.creatorLogoSrc);
      const drawn = drawAlignedContain(
        ctx,
        creatorImg,
        layout.pad,
        topLeftY,
        layout.creatorLogoMaxW,
        layout.creatorLogoMaxH,
        'left',
        'top',
      );
      if (drawn) topLeftY += drawn.h + layout.creatorLogoGap;
    }

    ctx.save();
    if (cm.bgSrc) {
      ctx.shadowColor = 'rgba(0,0,0,0.28)';
      ctx.shadowBlur = Math.max(4, Math.round(pxH * 0.008));
      ctx.shadowOffsetY = 1;
    }
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.font = `800 ${layout.titleFontPx}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const titleH = drawWrappedText(ctx, title, layout.pad, topLeftY, layout.topLeftMaxW, layout.titleLineHeightPx, 2);

    if (sub) {
      ctx.fillStyle = theme.muted;
      ctx.font = `500 ${layout.subtitleFontPx}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      drawWrappedText(
        ctx,
        sub,
        layout.pad,
        topLeftY + titleH + layout.subtitleGap,
        layout.topLeftMaxW,
        Math.round(layout.subtitleFontPx * 1.25),
        2,
      );
    }
    ctx.restore();

    // 3. Top-Right: Optional Theming Image
    if (cm.themeImageSrc) {
      const themeImg = await loadImgPromise(cm.themeImageSrc);
      drawAlignedContain(
        ctx,
        themeImg,
        pxW - layout.pad - layout.topRightMaxW,
        layout.pad,
        layout.topRightMaxW,
        layout.topRightMaxH,
        'right',
        'top',
      );
    }

    // 4. Bottom-Right: Clickable Program Badge (Icon + Name) + Optional QR Code
    if (layout.brandGroupRect.w > 0) {
      const darkBg = isDarkHexColor(toHexColor(theme.bgColor || '#ffffff', '#ffffff'));
      const bc = layout.brandCardRect;
      const lineW = Math.max(1, Math.round(pxH * 0.0014));

      // Program badge card
      drawRoundedRectPath(ctx, bc.x, bc.y, bc.w, bc.h, layout.cardRadius);
      ctx.fillStyle = darkBg ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.94)';
      ctx.fill();
      ctx.strokeStyle = darkBg ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.14)';
      ctx.lineWidth = lineW;
      ctx.stroke();

      const brandPadX = Math.max(6, Math.round(bc.h * 0.18));
      const brandInnerGap = Math.max(5, Math.round(bc.h * 0.14));
      const iconX = bc.x + brandPadX;
      const iconY = bc.y + Math.round((bc.h - layout.brandIconSize) / 2);
      drawBrandLogoCanvas(ctx, iconX, iconY, layout.brandIconSize);

      const textX = iconX + layout.brandIconSize + brandInnerGap;
      const textMaxW = Math.max(20, bc.x + bc.w - textX - brandPadX);
      const lineH = Math.round(layout.brandTitleFontPx * 1.15);
      const textStartY = bc.y + Math.round((bc.h - lineH * 2) / 2);
      ctx.fillStyle = darkBg ? '#f8fafc' : '#1e293b';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `800 ${layout.brandTitleFontPx}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText('Brick Instruction', textX, textStartY, textMaxW);
      ctx.globalAlpha = 0.78;
      ctx.font = `600 ${layout.brandTitleFontPx}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText('Creator', textX, textStartY + lineH, textMaxW);
      ctx.globalAlpha = 1;

      // QR Code square card
      if (layout.qrCardRect) {
        const qr = layout.qrCardRect;
        drawRoundedRectPath(ctx, qr.x, qr.y, qr.w, qr.h, layout.cardRadius);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(15,23,42,0.16)';
        ctx.lineWidth = lineW;
        ctx.stroke();

        const inset = layout.qrInnerInset;
        drawQrCanvas(ctx, PROGRAM_URL, qr.x + inset, qr.y + inset, qr.w - inset * 2, {
          fg: '#111827',
          bg: '#ffffff',
          quietZone: 1,
        });
      }

      // Register clickable PDF hyperlink over the program badge + QR code
      links.push(canvasRectToPdfLink(layout.brandGroupRect, pxW, pxH, pageWpt, pageHpt, PROGRAM_URL));
    }
  } else if (page.kind === 'complete') {
    const cm = state.completeMeta;
    if (cm.bgSrc) {
      const bgImg = await loadImgPromise(cm.bgSrc);
      if (bgImg) drawCoverImage(ctx, bgImg, 0, 0, pxW, pxH);
    }
    if (cm.showFireworks !== false) drawFireworksCanvas(ctx, pxW, pxH);
    const showText = cm.showText !== false;
    let topOff = pad + Math.round(typo.pt(8));
    if (showText) {
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'center';
      ctx.font = `800 ${typo.complete.titleFont}px -apple-system, sans-serif`;
      ctx.fillText(cm.title || 'Build Complete!', pxW / 2, pad);
      topOff = pad + Math.round(typo.complete.titleFont * 1.3);
      if (cm.subtitle) {
        ctx.fillStyle = theme.muted;
        ctx.font = `500 ${typo.complete.subtitleFont}px -apple-system, sans-serif`;
        ctx.fillText(cm.subtitle, pxW / 2, topOff);
        topOff += Math.round(typo.complete.subtitleFont * 1.5);
      }
      ctx.textAlign = 'left';
    }
    const availH = pxH - topOff - pad - footerH;
    const snap = renderCoverHeroSnapshot(allParts, cm.az, cm.el, 1.0, Math.min(1800, Math.round((pxW - pad * 2) * 1.35)), Math.min(1600, Math.round(availH * 1.35)), theme);
    const img = await loadImgPromise(snap.url);
    drawContain(ctx, img, pad, topOff, pxW - pad * 2, availH);
    drawFooter(state.model.title);
  } else if (page.kind === 'back') {
    const bm = state.backMeta;
    if (bm.bgSrc) {
      const bgImg = await loadImgPromise(bm.bgSrc);
      if (bgImg) drawCoverImage(ctx, bgImg, 0, 0, pxW, pxH);
    }
    const credit = (!bm.subtitle || bm.subtitle === 'Created with Brick Instruction Creator')
      ? 'Made with Brick Instruction Creator'
      : bm.subtitle;
    ctx.textAlign = 'center';
    const logoSz = typo.back.logoIcon;
    const logoY = Math.round(pxH * 0.5 - logoSz * 0.65);
    drawBrandLogoCanvas(ctx, (pxW - logoSz) / 2, logoY, logoSz);

    const creditFontPx = typo.back.creditFont;
    const creditY = logoY + logoSz + Math.round(typo.pt(12));
    ctx.fillStyle = theme.muted;
    ctx.font = `600 ${creditFontPx}px -apple-system, sans-serif`;
    ctx.fillText(credit, pxW / 2, creditY);
    const creditW = Math.max(logoSz, Math.round(ctx.measureText(credit).width));
    ctx.textAlign = 'left';

    links.push(
      canvasRectToPdfLink(
        {
          x: Math.round((pxW - creditW) / 2),
          y: logoY,
          w: creditW,
          h: creditY + creditFontPx * 1.4 - logoY,
        },
        pxW,
        pxH,
        pageWpt,
        pageHpt,
        PROGRAM_URL,
      ),
    );
  } else if (page.kind === 'section_divider') {
    const snap = renderSnapshot([], page.previewParts || [], 38, 28, 760, 480, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const img = await loadImgPromise(snap.url);
    ctx.fillStyle = theme.accent;
    ctx.font = `800 ${typo.divider.badgeFont}px -apple-system, sans-serif`;
    ctx.fillText(`BUILD STAGE ${page.bagNumber || 1}`, pad, pad);
    const titleY = pad + Math.round(typo.divider.badgeFont * 1.5);
    ctx.fillStyle = theme.text;
    ctx.font = `800 ${typo.divider.titleFont}px -apple-system, sans-serif`;
    ctx.fillText(page.chapterName || page.label || 'Build Stage', pad, titleY);
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'right';
    ctx.font = `700 ${typo.divider.metaFont}px -apple-system, sans-serif`;
    ctx.fillText(`${page.pieceCount || 0} pcs · Steps ${page.firstStepNum}–${page.lastStepNum}`, pxW - pad, titleY + Math.round((typo.divider.titleFont - typo.divider.metaFont) * 0.5));
    ctx.textAlign = 'left';
    const imgTop = titleY + Math.round(typo.divider.titleFont * 1.4);
    drawContain(ctx, img, pad, imgTop, pxW - pad * 2, pxH - imgTop - pad - footerH);
    drawFooter(state.model.title);
  } else if (page.kind === 'bom') {
    const cfg = state.bomConfig;
    const cols = page.bomCols || (pxW > pxH ? 6 : 4);
    const rows = page.bomRows || (pxW > pxH ? 5 : 6);
    const entries = page.bomEntries || [];
    const bt = typo.bom;
    const headerTitle = page.bomPageCount > 1
      ? `Parts List  ${page.bomPageIdx + 1} / ${page.bomPageCount}`
      : 'Parts List';

    ctx.fillStyle = theme.text;
    ctx.font = `700 ${bt.titleFont}px -apple-system, sans-serif`;
    ctx.fillText(headerTitle, pad, pad);
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'right';
    ctx.font = `500 ${bt.summaryFont}px -apple-system, sans-serif`;
    ctx.fillText(`${page.bomTotalPieces || allParts.length} pcs · ${page.bomTotalUnique || entries.length} unique`, pxW - pad, pad + Math.round((bt.titleFont - bt.summaryFont) * 0.72));
    ctx.textAlign = 'left';

    const headerH = bt.headerH;
    ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(pad, pad + headerH - bt.headerMb); ctx.lineTo(pxW - pad, pad + headerH - bt.headerMb); ctx.stroke();

    const gridX = pad, gridY = pad + headerH;
    const gridW = pxW - pad * 2, gridH = pxH - gridY - pad - footerH;
    const cells = computeBomGridLayout(entries, cols, rows, cfg.flow, cfg.align);
    const cellGeom = estimateBomCellGeometry({
      pageWidth: pxW,
      pageHeight: pxH,
      cols,
      rows,
      showNames: Boolean(cfg.showNames),
      typo,
    });
    const qtyFontPx = bt.qtyFont;
    const nameFontPx = bt.nameFont;
    const textAreaH = cellGeom.textAreaH;

    for (const c of cells) {
      const { part, qty, meta } = c.item;
      const cx = gridX + c.xFrac * gridW;
      const cy = gridY + c.yFrac * gridH;
      const cw = c.wFrac * gridW;
      const ch = c.hFrac * gridH;
      // Clear/transparent background — no opaque card boxes around BOM parts!
      const img = await loadImgPromise(getPliThumb(part));
      const padX = bt.cellPadX + bt.imgPad;
      const padY = bt.cellPadY + bt.imgPad;
      drawContain(ctx, img, cx + padX, cy + padY, cw - padX * 2, Math.max(14, ch - textAreaH - padY * 2));
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.text;
      ctx.font = `800 ${qtyFontPx}px -apple-system, sans-serif`;
      const qtyY = cy + ch - bt.cellPadY - textAreaH + bt.textGap;
      ctx.fillText(`${qty}×`, cx + cw / 2, qtyY);
      if (cfg.showNames) {
        ctx.fillStyle = theme.muted;
        ctx.font = `500 ${nameFontPx}px -apple-system, sans-serif`;
        const maxChars = Math.max(8, Math.floor((cw - bt.cellPadX * 2) / (nameFontPx * 0.56)));
        const nm = meta.name.length > maxChars ? meta.name.slice(0, maxChars - 1) + '…' : meta.name;
        ctx.fillText(nm, cx + cw / 2, qtyY + Math.round(qtyFontPx * 1.18) + Math.max(1, Math.round(bt.textGap * 0.6)));
      }
    }
    ctx.textAlign = 'left';
    drawFooter(state.model.title);
  } else if (page.kind === 'steps') {
    const drawRRect = (x, y, w, h, r) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };
    const drawTruncatedText = (rawText, x, y, maxW) => {
      const text = String(rawText || '');
      if (!text || maxW <= 2) return;
      if (ctx.measureText(text).width <= maxW) {
        ctx.fillText(text, x, y);
        return;
      }
      const ell = '…';
      const ellW = ctx.measureText(ell).width;
      if (ellW >= maxW) return;
      let lo = 0;
      let hi = text.length;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (ctx.measureText(text.slice(0, mid)).width + ellW <= maxW) lo = mid;
        else hi = mid - 1;
      }
      ctx.fillText(lo > 0 ? text.slice(0, lo).trimEnd() + ell : ell, x, y);
    };

    const slots = page.slots;
    const isLand = pxW >= pxH;
    const cols = slots.length === 1 ? 1 : slots.length === 2 ? (isLand ? 2 : 1) : 2;
    const rows = Math.ceil(slots.length / cols);
    const gap = typo.gap;
    const st = typo.steps;

    // Optional Finished Submodel / Section Intro Banner at top of chapter's first page
    let topY = pad;
    if (page.submodelIntro) {
      const sub = page.submodelIntro;
      const bannerH = Math.round(st.introThumbH + typo.pt(12));
      const bannerW = pxW - pad * 2;
      drawRRect(pad, pad, bannerW, bannerH, Math.round(typo.pt(10)));
      ctx.fillStyle = theme.calloutBg;
      ctx.fill();
      ctx.strokeStyle = theme.calloutBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const multLabel = sub.repeatCount > 1 ? `×${sub.repeatCount}` : `${sub.pieceCount || sub.canonicalParts?.length || 0} pcs`;
      ctx.font = `900 ${st.introPillFont}px -apple-system, sans-serif`;
      const pillW = Math.max(Math.round(typo.pt(42)), Math.round(ctx.measureText(multLabel).width + typo.pt(20)));
      const pillH = Math.round(st.introPillFont * 1.9);
      const pillX = pad + bannerW - pillW - Math.round(typo.pt(10));
      const pillY = pad + Math.round((bannerH - pillH) / 2);

      ctx.save();
      drawRRect(pad, pad, bannerW, bannerH, Math.round(typo.pt(10)));
      ctx.clip();
      const thumbUrl = getSubmodelThumb(sub, 260, 160);
      if (thumbUrl) {
        const introImg = await loadImgPromise(thumbUrl);
        drawContain(ctx, introImg, pad + Math.round(typo.pt(10)), pad + Math.round(typo.pt(6)), st.introThumbW, bannerH - Math.round(typo.pt(12)));
      }
      const textX = pad + Math.round(typo.pt(10)) + st.introThumbW + Math.round(typo.pt(10));
      const introTextMaxW = Math.max(0, pillX - textX - Math.round(typo.pt(8)));
      ctx.fillStyle = theme.muted;
      ctx.font = `700 ${st.introLabelFont}px -apple-system, sans-serif`;
      drawTruncatedText(sub.isSectionModule ? 'BUILD SECTION' : 'SUBMODEL', textX, pad + Math.round(bannerH * 0.22), introTextMaxW);
      ctx.fillStyle = theme.text;
      ctx.font = `800 ${st.introTitleFont}px -apple-system, sans-serif`;
      drawTruncatedText(sub.name || 'Submodel', textX, pad + Math.round(bannerH * 0.48), introTextMaxW);

      drawRRect(pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${st.introPillFont}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(multLabel, pillX + pillW / 2, pillY + pillH / 2 + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.restore();

      topY = pad + bannerH + Math.round(gap * 0.8);
    }

    const slotW = (pxW - pad * 2 - gap * (cols - 1)) / cols;
    const slotH = (pxH - topY - pad - footerH - gap * (rows - 1)) / rows;
    const isTightSlot = slots.length >= 4 || slotH < typo.pt(260);
    const stepNumPx = slots.length === 1 ? st.stepNum1Up : (isTightSlot ? st.stepNumTight : st.stepNum2Up);
    const pliThumbPx = isTightSlot ? st.pliThumbTight : st.pliThumb;
    const pliQtyPx = isTightSlot ? st.pliQtyFontTight : st.pliQtyFont;

    for (let idx = 0; idx < slots.length; idx++) {
      const { ch, step, minifigSeqSlice } = slots[idx];
      const sx = pad + (idx % cols) * (slotW + gap);
      const sy = topY + Math.floor(idx / cols) * (slotH + gap);
      const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
      const mfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : 'classic';
      const isMfExploded = isMfBuild && mfStyle === 'exploded';
      const isMfSeq = isMfBuild && mfStyle === 'sequential';
      const isOfficialMfStyle = isMfExploded || isMfSeq;

      if (state.showStepBorders && !(isOfficialMfStyle && slots.length === 1)) {
        ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.5;
        ctx.strokeRect(sx, sy, slotW, slotH);
      }

      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const modelScale = ov.modelScale || 1.0;

      const pliH = Math.min(Math.round(pliThumbPx + typo.pt(10)), slotH * 0.22);
      const pliRadius = Math.round(typo.pt(7));
      const mfPrep = step.isMinifigPoseStep ? step.minifigPrep : null;
      const poseLegendH = (mfPrep && mfPrep.indicators && mfPrep.indicators.length > 0) ? Math.round(typo.pt(22)) : 0;
      let renderTopY = sy + st.slotPad + pliH + Math.round(typo.pt(8));
      let renderAvailH = Math.max(40, slotH - st.slotPad * 2 - pliH - Math.round(typo.pt(10)) - poseLegendH);

      if (isOfficialMfStyle) {
        const showMfLabel = ch.steps.length > 1 || slots.length > 1;
        if (showMfLabel) {
          ctx.fillStyle = theme.muted;
          ctx.font = `700 ${st.pliSubNameFont}px -apple-system, sans-serif`;
          ctx.fillText(step.minifigName || `Minifigure ${step.num}`, sx + st.slotPad, sy + st.slotPad);
          renderTopY = sy + st.slotPad + Math.round(st.pliSubNameFont * 1.6);
          renderAvailH = Math.max(40, slotH - st.slotPad * 2 - Math.round(st.pliSubNameFont * 1.8));
        } else {
          renderTopY = sy + st.slotPad;
          renderAvailH = Math.max(40, slotH - st.slotPad * 2);
        }
      } else {
        // Step number
        ctx.fillStyle = theme.text;
        ctx.font = `800 ${stepNumPx}px -apple-system, sans-serif`;
        ctx.fillText(String(step.num), sx + st.slotPad, sy + st.slotPad);
        const numWidth = Math.max(Math.round(stepNumPx * 1.15), Math.round(ctx.measureText(String(step.num)).width));

        // PLI Box (shows finished submodel/minifigure thumbnail + ×N or Connect verb on prep & attachment steps, or raw parts otherwise)
        const pliX = sx + st.slotPad + numWidth + Math.round(typo.pt(8));
        const pliY = sy + st.slotPad;
        if (step.attachedSubmodel) {
          const att = step.attachedSubmodel;
          const attBoxW = Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(115)), pliH * 3.4));
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.fillStyle = theme.calloutBg;
          ctx.fill();
          ctx.strokeStyle = theme.calloutBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.save();
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.clip();
          const attUrl = getSubmodelThumb(att, 160, 120);
          if (attUrl) {
            const attImg = await loadImgPromise(attUrl);
            drawContain(ctx, attImg, pliX + 6, pliY + 4, pliH * 1.25, pliH - 8);
          }
          const tx = pliX + 6 + pliH * 1.25 + 8;
          const textMaxW = Math.max(0, pliX + attBoxW - tx - 8);
          ctx.fillStyle = theme.accent;
          ctx.font = `900 ${st.pliSubCountFont}px -apple-system, sans-serif`;
          drawTruncatedText(att.isSectionAttach ? (att.attachVerb || 'Connect') : `×${att.repeatCount}`, tx, pliY + Math.round(pliH * 0.16), textMaxW);
          ctx.fillStyle = theme.text;
          ctx.font = `600 ${st.pliSubNameFont}px -apple-system, sans-serif`;
          drawTruncatedText(att.name || 'Submodel', tx, pliY + Math.round(pliH * 0.56), textMaxW);
          ctx.restore();
        } else if (step.minifigPrep) {
          const prep = step.minifigPrep;
          const prepBoxW = Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(130)), pliH * 3.8));
          drawRRect(pliX, pliY, prepBoxW, pliH, pliRadius);
          ctx.fillStyle = theme.calloutBg;
          ctx.fill();
          ctx.strokeStyle = theme.calloutBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.save();
          drawRRect(pliX, pliY, prepBoxW, pliH, pliRadius);
          ctx.clip();
          const prepUrl = getMinifigThumb(prep.canonicalParts, `prep_${prep.id}`, MINIFIG_BUILD_CAMERA.az, MINIFIG_BUILD_CAMERA.el, 120, 120);
          if (prepUrl) {
            const prepImg = await loadImgPromise(prepUrl);
            drawContain(ctx, prepImg, pliX + 6, pliY + 4, pliH * 1.0, pliH - 8);
          }
          const tx = pliX + 6 + pliH * 1.0 + 8;
          const textMaxW = Math.max(0, pliX + prepBoxW - tx - 8);
          ctx.fillStyle = theme.accent;
          ctx.font = `800 ${st.pliSubCountFont}px -apple-system, sans-serif`;
          drawTruncatedText(prep.label || 'Position', tx, pliY + Math.round(pliH * 0.16), textMaxW);
          ctx.fillStyle = theme.text;
          ctx.font = `600 ${st.pliSubNameFont}px -apple-system, sans-serif`;
          drawTruncatedText(prep.name || 'Minifigure', tx, pliY + Math.round(pliH * 0.56), textMaxW);
          ctx.restore();
        } else if (step.attachedMinifig) {
          const att = step.attachedMinifig;
          const attBoxW = Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(115)), pliH * 3.3));
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.fillStyle = theme.calloutBg;
          ctx.fill();
          ctx.strokeStyle = theme.calloutBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.save();
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.clip();
          const attUrl = getMinifigThumb(
            att.previewParts || att.canonicalParts,
            `att_${att.id}`,
            Math.round(cam.az),
            Math.round(Math.min(30, Math.max(16, cam.el))),
            120,
            120,
          );
          if (attUrl) {
            const attImg = await loadImgPromise(attUrl);
            drawContain(ctx, attImg, pliX + 6, pliY + 4, pliH * 1.0, pliH - 8);
          }
          const tx = pliX + 6 + pliH * 1.0 + 8;
          const textMaxW = Math.max(0, pliX + attBoxW - tx - 8);
          ctx.fillStyle = theme.accent;
          ctx.font = `900 ${st.pliSubCountFont}px -apple-system, sans-serif`;
          drawTruncatedText(`×${att.repeatCount || 1}`, tx, pliY + Math.round(pliH * 0.16), textMaxW);
          ctx.fillStyle = theme.text;
          ctx.font = `600 ${st.pliSubNameFont}px -apple-system, sans-serif`;
          drawTruncatedText(att.name || 'Minifigure', tx, pliY + Math.round(pliH * 0.56), textMaxW);
          ctx.restore();
        } else {
          const pliMap = new Map();
          for (const p of step.parts) { const k = `${p.p}:${p.c}`; if (!pliMap.has(k)) pliMap.set(k, { part: p, qty: 0 }); pliMap.get(k).qty++; }
          const pli = Array.from(pliMap.values()).slice(0, 6);
          if (pli.length > 0) {
            const itemW = Math.min(Math.round(pliThumbPx * 1.95), (slotW - (pliX - sx) - st.slotPad - 10) / Math.max(1, pli.length));
            drawRRect(pliX, pliY, pli.length * itemW + 10, pliH, pliRadius);
            ctx.fillStyle = theme.pliBg;
            ctx.fill();
            ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.25;
            ctx.stroke();
            for (let pi = 0; pi < pli.length; pi++) {
              const im = await loadImgPromise(getPliThumb(pli[pi].part));
              drawContain(ctx, im, pliX + 5 + pi * itemW, pliY + 4, itemW * 0.54, pliH - 8);
              ctx.fillStyle = theme.text; ctx.font = `700 ${pliQtyPx}px -apple-system, sans-serif`;
              ctx.fillText(`${pli[pi].qty}×`, pliX + 5 + pi * itemW + itemW * 0.58, pliY + Math.round((pliH - pliQtyPx) * 0.45));
            }
          }
        }
      }

      let badgeRightX = sx + slotW - 10;
      if (state.showRotCues && step.cue && step.cue !== 'none') {
        const cueLabel = step.cue === 'flip_vertical' ? '↻ Flip Over' : step.cue === 'yaw_180' ? '↻ Turn 180°' : '↻ Rotate 90°';
        const cueFont = Math.max(10, Math.round(Math.min(pliH * 0.24, 13)));
        ctx.font = `700 ${cueFont}px -apple-system, sans-serif`;
        const cueW = Math.round(ctx.measureText(cueLabel).width + 18);
        const cueH = Math.round(cueFont * 1.9);
        const cueX = badgeRightX - cueW;
        const cueY = sy + 12;
        drawRRect(cueX, cueY, cueW, cueH, cueH / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.fillStyle = '#202124';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cueLabel, cueX + cueW / 2, cueY + cueH / 2 + 0.5);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        badgeRightX = cueX - 6;
      }

      if (step.stepHint) {
        ctx.font = '700 11px -apple-system, sans-serif';
        const hintW = Math.min(slotW * 0.42, ctx.measureText(step.stepHint).width + 18);
        const hintX = badgeRightX - hintW;
        const hintY = sy + 12;
        drawRRect(hintX, hintY, hintW, 22, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        ctx.fillStyle = '#202124';
        ctx.fillText(step.stepHint, hintX + 9, hintY + 5, hintW - 16);
      }

      // 3D Step Render / Official Minifig Style (+ optional true physical 1:1 Minifigure View card on printed paper!)
      const prev = getPreviousPartsForStep(state.model, ch, step);
      const allowMf1to1OnPage = !isMfSeq || !minifigSeqSlice || minifigSeqSlice.pageIdx === minifigSeqSlice.pageCount - 1;
      const show1to1Here = Boolean(state.showMinifig1to1 && isMfBuild && allowMf1to1OnPage);

      let mainAvailW = slotW - st.slotPad * 2;
      let mf1CardInfo = null;
      if (show1to1Here) {
        const mf1 = renderMinifigOneToOne(step.parts, pxH, hIn, Math.round(slotW * (isMfSeq ? 0.24 : 0.34)), Math.round(renderAvailH * 0.72), theme.accent);
        const cardPad = Math.round(typo.pt(8));
        const headerH = Math.round(st.mf1to1Font * 1.9);
        const mfHeaderLabel = `1:1${mf1.isExact ? '' : ' Fit'} · ${Math.round(mf1.heightMm)} mm`;
        ctx.font = `800 ${st.mf1to1Font}px -apple-system, sans-serif`;
        const mfHeaderW = Math.ceil(ctx.measureText(mfHeaderLabel).width);
        const cardW = Math.min(Math.round(slotW * 0.44), Math.max(Math.round(typo.pt(68)), mfHeaderW + cardPad * 2, mf1.displayPxW + cardPad * 2 + 12));
        const cardH = Math.min(renderAvailH - 4, mf1.displayPxH + headerH + cardPad * 2);
        const cardX = sx + slotW - cardW - st.slotPad;
        const cardY = renderTopY + Math.round((renderAvailH - cardH) / 2);
        const cardRadius = Math.round(typo.pt(8));
        mainAvailW = Math.max(40, cardX - (sx + st.slotPad + 8));
        mf1CardInfo = { mf1, cardPad, headerH, mfHeaderLabel, cardW, cardH, cardX, cardY, cardRadius };
      }

      if (isMfExploded) {
        const expDiag = renderMinifigExplodedDiagram(step, cam, Math.max(760, Math.round(mainAvailW * 1.2)), Math.max(520, Math.round(renderAvailH * 1.2)), theme, modelScale);
        const expImg = await loadImgPromise(expDiag.url);
        drawContain(ctx, expImg, sx + st.slotPad, renderTopY, mainAvailW, renderAvailH);
      } else if (isMfSeq) {
        const seqPlan = getMinifigSequentialPlanForStep(step);
        const sl = minifigSeqSlice || { start: 0, end: seqPlan.stages.length, cols: Math.min(3, seqPlan.stages.length), pageIdx: 0, pageCount: 1 };
        const visibleStages = seqPlan.stages.slice(sl.start, sl.end);
        const stGap = Math.round(Math.max(8, mainAvailW * 0.015));
        const stCellW = (mainAvailW - stGap * Math.max(0, visibleStages.length - 1)) / Math.max(1, visibleStages.length);
        const stPixW = Math.max(320, Math.round(stCellW * 1.25));
        const stPixH = Math.max(440, Math.round(renderAvailH * 1.25));
        for (let si = 0; si < visibleStages.length; si++) {
          const stDiag = renderMinifigSequentialStage(step, visibleStages[si], seqPlan, cam, stPixW, stPixH, theme, modelScale);
          const stImg = await loadImgPromise(stDiag.url);
          drawContain(ctx, stImg, sx + st.slotPad + si * (stCellW + stGap), renderTopY, stCellW, renderAvailH);
        }
      } else {
        const effectivePartOffsets = step.defaultPartOffsets
          ? { ...step.defaultPartOffsets, ...(ov.partOffsets || {}) }
          : (ov.partOffsets || {});
        const snap = renderSnapshot(prev, step.parts, cam.az, cam.el, 760, 520, modelScale, {
          highlightNew: state.highlightNew, highlightColor: state.highlightColor,
          fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity,
          showArrows: true, accent: theme.accent, ov, partOffsets: effectivePartOffsets,
          ...(mfPrep ? {
            minifigIndicators: mfPrep.indicators || [],
            ghostParts: mfPrep.ghostParts || [],
            highlightOnlyPartIds: new Set(mfPrep.rotatedPartIds || []),
          } : {}),
        });
        const stepImg = await loadImgPromise(snap.url);
        drawContain(ctx, stepImg, sx + st.slotPad, renderTopY, mainAvailW, renderAvailH);
      }

      if (mf1CardInfo) {
        const { mf1, cardPad, headerH, mfHeaderLabel, cardW, cardH, cardX, cardY, cardRadius } = mf1CardInfo;
        drawRRect(cardX, cardY, cardW, cardH, cardRadius);
        ctx.fillStyle = theme.calloutBg;
        ctx.fill();
        ctx.strokeStyle = theme.calloutBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        drawRRect(cardX, cardY, cardW, cardH, cardRadius);
        ctx.clip();
        ctx.fillStyle = theme.accent;
        ctx.font = `800 ${st.mf1to1Font}px -apple-system, sans-serif`;
        drawTruncatedText(mfHeaderLabel, cardX + cardPad, cardY + Math.round(cardPad * 0.7), Math.max(0, cardW - cardPad * 2));
        const mf1Img = await loadImgPromise(mf1.url);
        const imgX = cardX + Math.round((cardW - 10 - mf1.displayPxW) / 2);
        const imgY = cardY + headerH + Math.round((cardH - headerH - cardPad - mf1.displayPxH) / 2);
        ctx.drawImage(mf1Img, imgX, imgY, mf1.displayPxW, mf1.displayPxH);

        // Vertical height bracket next to 1:1 figure
        const rx = imgX + mf1.displayPxW + 5;
        const ry0 = imgY + Math.round(mf1.displayPxH * 0.04);
        const ry1 = imgY + Math.round(mf1.displayPxH * 0.96);
        ctx.strokeStyle = theme.muted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx - 3, ry0); ctx.lineTo(rx + 3, ry0);
        ctx.moveTo(rx, ry0); ctx.lineTo(rx, ry1);
        ctx.moveTo(rx - 3, ry1); ctx.lineTo(rx + 3, ry1);
        ctx.stroke();
        ctx.restore();
      }

      // Color-coded rotation indicator pills at bottom of minifigure Prepare steps
      if (mfPrep && mfPrep.indicators && mfPrep.indicators.length > 0) {
        const pillFont = Math.max(9, st.cueFont);
        ctx.font = `700 ${pillFont}px -apple-system, sans-serif`;
        const pillH = Math.round(pillFont * 1.85), pillGap = Math.round(typo.pt(6)), dotR = Math.max(3, pillFont * 0.34);
        const pills = mfPrep.indicators.map(ind => {
          const textW = ctx.measureText(ind.label || '').width;
          return { ind, w: Math.ceil(textW + pillFont * 2.1) };
        });
        const totalW = pills.reduce((sum, p) => sum + p.w, 0) + pillGap * Math.max(0, pills.length - 1);
        let pxCur = sx + Math.max(st.slotPad, Math.round((slotW - totalW) / 2));
        const pyCur = sy + slotH - pillH - st.slotPad;
        for (const p of pills) {
          if (pxCur + p.w > sx + slotW - st.slotPad) break;
          const pCol = p.ind.color || theme.accent;
          drawRRect(pxCur, pyCur, p.w, pillH, pillH / 2);
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.fill();
          ctx.strokeStyle = pCol;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = pCol;
          ctx.beginPath();
          ctx.arc(pxCur + Math.round(pillFont * 0.9), pyCur + pillH / 2, dotR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#1e293b';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.ind.label || '', pxCur + Math.round(pillFont * 1.5), pyCur + pillH / 2 + 0.5);
          ctx.textBaseline = 'top';
          pxCur += p.w + pillGap;
        }
      }

      // Final step of a duplicate submodel: show prominent ×N badge ONLY on this last step
      if (step.isSubmodelFinal) {
        const badgeLabel = `×${step.submodelRepeat || 2}`;
        const badgeFont = st.subFinalFont;
        ctx.font = `900 ${badgeFont}px -apple-system, sans-serif`;
        const bW = Math.max(Math.round(badgeFont * 2.1), Math.round(ctx.measureText(badgeLabel).width + typo.pt(16)));
        const bH = Math.round(badgeFont * 1.6);
        const bX = sx + slotW - bW - st.slotPad;
        const bY = sy + slotH - bH - st.slotPad;
        drawRRect(bX, bY, bW, bH, bH / 2);
        ctx.fillStyle = theme.accent;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeLabel, bX + bW / 2, bY + bH / 2 + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
      }
    }

    drawFooter(page.chapterName || '');
  }

  const jpegQuality = page.kind === 'cover' ? 0.94 : 0.88;
  const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
  const b64 = dataUrl.split(',')[1];
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return { bytes, pxW, pxH, dataUrl, links };
}

let lastGeneratedPdfBlob = null, lastGeneratedPdfUrl = null, lastGeneratedPdfName = 'manual.pdf';
async function runPdfExport(pagesToExport) {
  const [pageWpt, pageHpt] = getPdfPaperPts();
  const basePxW = Math.round(pageWpt * 1.45), basePxH = Math.round(pageHpt * 1.45);
  const coverPxW = Math.min(2400, Math.round(pageWpt * 2.1)), coverPxH = Math.min(2400, Math.round(pageHpt * 2.1));
  document.getElementById('expProgressWrap').classList.remove('hidden');
  document.getElementById('expReadyWrap').classList.add('hidden');
  const jpegPages = [];
  for (let i = 0; i < pagesToExport.length; i++) {
    const pct = Math.round(((i + 1) / pagesToExport.length) * 100);
    document.getElementById('expProgressLabel').textContent = `Rendering page ${i + 1} of ${pagesToExport.length}…`;
    document.getElementById('expProgressPct').textContent = pct + '%';
    document.getElementById('expProgressBar').style.width = pct + '%';
    await new Promise(r => setTimeout(r, 8));
    const pg = pagesToExport[i];
    const w = pg.kind === 'cover' ? coverPxW : basePxW;
    const h = pg.kind === 'cover' ? coverPxH : basePxH;
    jpegPages.push(await renderPageToJpegBytes(pg, w, h, pageWpt, pageHpt));
  }
  const pdfBytes = buildPdfBinary(jpegPages, pageWpt, pageHpt);
  if (lastGeneratedPdfUrl) URL.revokeObjectURL(lastGeneratedPdfUrl);
  lastGeneratedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  lastGeneratedPdfUrl = URL.createObjectURL(lastGeneratedPdfBlob);
  lastGeneratedPdfName = `${state.model.title.replace(/[^a-z0-9_-]+/gi, '_')}_${pagesToExport.length === 1 ? 'page' + pagesToExport[0].num : 'manual'}.pdf`;

  document.getElementById('expProgressWrap').classList.add('hidden');
  document.getElementById('expReadyWrap').classList.remove('hidden');
  document.getElementById('expReadyNote').textContent = `PDF Ready (${(pdfBytes.length / 1024).toFixed(0)} KB · ${pagesToExport.length} page${pagesToExport.length > 1 ? 's' : ''})`;
  const prevImg = document.getElementById('expPreviewImg');
  if (prevImg && jpegPages[0]?.dataUrl) prevImg.src = jpegPages[0].dataUrl;
  const dlLink = document.getElementById('linkDownloadPdf');
  dlLink.href = lastGeneratedPdfUrl; dlLink.download = lastGeneratedPdfName;

  const shareBtn = document.getElementById('btnSharePdf');
  const canShareFiles = Boolean(navigator.share && navigator.canShare && navigator.canShare({ files: [new File([lastGeneratedPdfBlob], lastGeneratedPdfName, { type: 'application/pdf' })] }));
  shareBtn.classList.toggle('hidden', !canShareFiles);
}

// =========================================================================
// 13. EVENT WIRING & FILE IMPORT / EXPORT
// =========================================================================
function openMenu() { document.getElementById('menuBackdrop').classList.remove('hidden'); syncMenuControls(); }
function closeMenu() { document.getElementById('menuBackdrop').classList.add('hidden'); }

document.getElementById('btnOpenMenu').onclick = openMenu;
document.getElementById('desktopModelChip').onclick = openMenu;
document.getElementById('btnCloseMenu').onclick = closeMenu;
document.getElementById('menuDismissArea').onclick = closeMenu;

const stylePopEl = document.getElementById('stylePopover');
const btnStylePopEl = document.getElementById('btnStylePop');

function updateStylePopoverTail() {
  if (!stylePopEl || !btnStylePopEl || stylePopEl.classList.contains('hidden')) return;
  const btnRect = btnStylePopEl.getBoundingClientRect();
  const popRect = stylePopEl.getBoundingClientRect();
  const btnCenterX = btnRect.left + btnRect.width / 2;
  const tailRight = Math.max(24, Math.min(popRect.width - 24, popRect.right - btnCenterX));
  stylePopEl.style.setProperty('--style-tail-right', `${tailRight.toFixed(1)}px`);
}

function setStylePopoverOpen(open) {
  if (!stylePopEl || !btnStylePopEl) return;
  stylePopEl.classList.toggle('hidden', !open);
  btnStylePopEl.classList.toggle('style-chip-open', open);
  btnStylePopEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    syncMenuControls();
    updateStylePopoverTail();
  }
}

btnStylePopEl.onclick = () => {
  setStylePopoverOpen(stylePopEl.classList.contains('hidden'));
};
document.addEventListener('pointerdown', (e) => {
  if (!stylePopEl || stylePopEl.classList.contains('hidden')) return;
  const t = e.target;
  if (t instanceof Node && (stylePopEl.contains(t) || (btnStylePopEl && btnStylePopEl.contains(t)))) return;
  setStylePopoverOpen(false);
}, true);

// Custom Theme Editor Modal + Import / Export
const themeEditorModalEl = document.getElementById('themeEditorModal');
let themeEditorDraft = null;
let themeEditorEditingId = null;

function syncThemeEditorUI() {
  if (!themeEditorDraft) return;
  const d = themeEditorDraft;
  d.bg = buildThemeBgCss(d.bgType, d.bgColor, d.bgColorEnd, d.bgAngle);

  const nameInput = document.getElementById('themeNameInput');
  if (nameInput && nameInput.value !== d.name) nameInput.value = d.name;

  const setPicker = (id, val, fallback) => {
    const el = document.getElementById(id);
    if (el) el.value = toHexColor(val || fallback, d.bgColor);
  };
  setPicker('themeColorBg', d.bgColor, '#d8ecfd');
  setPicker('themeColorBgEnd', d.bgColorEnd, '#b7daf9');
  setPicker('themeColorText', d.text, '#172536');
  setPicker('themeColorMuted', d.muted, '#4a607a');
  setPicker('themeColorAccent', d.accent, '#1a73e8');
  setPicker('themeColorPliBg', d.pliBg, '#ffffff');
  setPicker('themeColorPliBorder', d.pliBorder, '#8ab8e6');
  setPicker('themeColorCalloutBg', d.calloutBg, '#fffbe6');
  setPicker('themeColorCalloutBorder', d.calloutBorder, '#eab308');

  const bpEl = document.getElementById('themeBlueprintGrid');
  if (bpEl) bpEl.checked = Boolean(d.bp);

  const isGrad = d.bgType === 'gradient';
  document.getElementById('themeColorBgEndWrap')?.classList.toggle('hidden', !isGrad);
  document.getElementById('themeAngleWrap')?.classList.toggle('hidden', !isGrad);

  document.querySelectorAll('.theme-bgtype-btn').forEach(b => {
    const act = b.getAttribute('data-bg-type') === d.bgType;
    b.className = `theme-bgtype-btn px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition ${act ? 'bg-[#1a73e8] text-white' : 'text-[var(--muted-foreground)]'}`;
  });
  document.querySelectorAll('.theme-angle-btn').forEach(b => {
    const act = Number(b.getAttribute('data-bg-angle')) === Number(d.bgAngle);
    b.className = `theme-angle-btn py-1.5 rounded-full border font-semibold transition ${act ? 'border-[#1a73e8] bg-[#1a73e8] text-white' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });

  // Update live preview card
  const prevCard = document.getElementById('themePreviewCard');
  if (prevCard) {
    applyThemeBackgroundToElement(prevCard, d);
    prevCard.style.color = d.text;
    prevCard.style.borderColor = d.pliBorder;
  }
  const prevStep = document.getElementById('themePreviewStepNum');
  if (prevStep) prevStep.style.color = d.text;
  const prevPli = document.getElementById('themePreviewPli');
  if (prevPli) {
    prevPli.style.background = d.pliBg;
    prevPli.style.border = `1px solid ${d.pliBorder}`;
    prevPli.style.color = d.text;
  }
  const prevCallout = document.getElementById('themePreviewCallout');
  if (prevCallout) {
    prevCallout.style.background = d.calloutBg;
    prevCallout.style.border = `1.5px solid ${d.calloutBorder}`;
    prevCallout.style.color = d.text;
  }
  const prevAccent = document.getElementById('themePreviewAccent');
  if (prevAccent) prevAccent.style.background = d.accent;
  const prevMuted = document.getElementById('themePreviewMuted');
  if (prevMuted) {
    prevMuted.style.color = d.muted;
    prevMuted.textContent = state.model?.title || 'My Model';
  }
  const prevPageNum = document.getElementById('themePreviewPageNum');
  if (prevPageNum) prevPageNum.style.color = d.text;
}

function openThemeEditor(existingTheme = null) {
  setStylePopoverOpen(false);
  if (existingTheme && !existingTheme.builtIn) {
    themeEditorEditingId = existingTheme.id;
    themeEditorDraft = {
      ...existingTheme,
      bgColor: toHexColor(existingTheme.bgColor, '#ffffff'),
      bgColorEnd: toHexColor(existingTheme.bgColorEnd, existingTheme.bgColor),
      text: toHexColor(existingTheme.text, existingTheme.bgColor),
      muted: toHexColor(existingTheme.muted, existingTheme.bgColor),
      pliBg: toHexColor(existingTheme.pliBg, existingTheme.bgColor),
      pliBorder: toHexColor(existingTheme.pliBorder, existingTheme.bgColor),
      accent: toHexColor(existingTheme.accent, existingTheme.bgColor),
      calloutBg: toHexColor(existingTheme.calloutBg, existingTheme.bgColor),
      calloutBorder: toHexColor(existingTheme.calloutBorder, existingTheme.bgColor),
    };
    document.getElementById('themeEditorTitle').textContent = 'Edit Custom Theme';
    document.getElementById('btnThemeEditorDelete').classList.remove('hidden');
  } else {
    themeEditorEditingId = null;
    themeEditorDraft = createThemeDraftFromBase(getActiveTheme());
    document.getElementById('themeEditorTitle').textContent = 'New Custom Theme';
    document.getElementById('btnThemeEditorDelete').classList.add('hidden');
  }
  syncThemeEditorUI();
  themeEditorModalEl.classList.remove('hidden');
}

function closeThemeEditor() {
  themeEditorModalEl.classList.add('hidden');
  themeEditorDraft = null;
  themeEditorEditingId = null;
}

document.getElementById('btnNewCustomTheme').onclick = () => openThemeEditor(null);
document.getElementById('btnCloseThemeEditor').onclick = closeThemeEditor;
document.getElementById('btnThemeEditorCancel').onclick = closeThemeEditor;
themeEditorModalEl.onclick = (e) => { if (e.target === themeEditorModalEl) closeThemeEditor(); };

document.getElementById('themeNameInput').oninput = (e) => {
  if (!themeEditorDraft) return;
  themeEditorDraft.name = e.target.value.slice(0, 40);
};

document.querySelectorAll('.theme-base-btn').forEach(b => {
  b.onclick = () => {
    if (!themeEditorDraft) return;
    const base = THEMES[b.getAttribute('data-theme-base')] || THEMES.blue;
    const preservedName = themeEditorDraft.name;
    const preservedId = themeEditorDraft.id;
    themeEditorDraft = createThemeDraftFromBase(base, preservedName);
    themeEditorDraft.id = preservedId;
    syncThemeEditorUI();
  };
});

document.querySelectorAll('.theme-bgtype-btn').forEach(b => {
  b.onclick = () => {
    if (!themeEditorDraft) return;
    themeEditorDraft.bgType = b.getAttribute('data-bg-type') === 'gradient' ? 'gradient' : 'solid';
    syncThemeEditorUI();
  };
});

document.querySelectorAll('.theme-angle-btn').forEach(b => {
  b.onclick = () => {
    if (!themeEditorDraft) return;
    themeEditorDraft.bgAngle = Number(b.getAttribute('data-bg-angle')) || 180;
    syncThemeEditorUI();
  };
});

document.getElementById('themeBlueprintGrid').onchange = (e) => {
  if (!themeEditorDraft) return;
  themeEditorDraft.bp = e.target.checked;
  syncThemeEditorUI();
};

const bindThemeColorInput = (elId, field) => {
  const el = document.getElementById(elId);
  if (!el) return;
  el.oninput = (e) => {
    if (!themeEditorDraft) return;
    themeEditorDraft[field] = e.target.value;
    syncThemeEditorUI();
  };
};
bindThemeColorInput('themeColorBg', 'bgColor');
bindThemeColorInput('themeColorBgEnd', 'bgColorEnd');
bindThemeColorInput('themeColorText', 'text');
bindThemeColorInput('themeColorMuted', 'muted');
bindThemeColorInput('themeColorAccent', 'accent');
bindThemeColorInput('themeColorPliBg', 'pliBg');
bindThemeColorInput('themeColorPliBorder', 'pliBorder');
bindThemeColorInput('themeColorCalloutBg', 'calloutBg');
bindThemeColorInput('themeColorCalloutBorder', 'calloutBorder');

document.getElementById('btnThemeEditorSave').onclick = () => {
  if (!themeEditorDraft) return;
  const cleanedName = (document.getElementById('themeNameInput').value || '').trim() || 'Custom Theme';
  const normalized = normalizeCustomTheme({
    ...themeEditorDraft,
    id: themeEditorEditingId || themeEditorDraft.id,
    name: cleanedName,
    updatedAt: new Date().toISOString(),
  });
  if (!normalized) return;

  const idx = customThemes.findIndex(t => t.id === normalized.id);
  if (idx >= 0) {
    customThemes[idx] = { ...normalized, createdAt: customThemes[idx].createdAt || normalized.createdAt };
  } else {
    customThemes.push(normalized);
  }
  persistCustomThemes();
  state.themeId = normalized.id;
  closeThemeEditor();
  renderAll();
  showToast(idx >= 0 ? `Updated "${normalized.name}".` : `Saved theme "${normalized.name}".`);
};

document.getElementById('btnThemeEditorDelete').onclick = () => {
  if (!themeEditorEditingId) return;
  const removed = customThemes.find(t => t.id === themeEditorEditingId);
  customThemes = customThemes.filter(t => t.id !== themeEditorEditingId);
  persistCustomThemes();
  if (state.themeId === themeEditorEditingId) {
    state.themeId = 'blue';
  }
  closeThemeEditor();
  renderAll();
  showToast(removed ? `Deleted "${removed.name}".` : 'Deleted custom theme.');
};

document.getElementById('btnThemeEditorExport').onclick = async () => {
  if (!themeEditorDraft) return;
  const cleanedName = (document.getElementById('themeNameInput').value || '').trim() || 'Custom Theme';
  const normalized = normalizeCustomTheme({
    ...themeEditorDraft,
    id: themeEditorEditingId || themeEditorDraft.id,
    name: cleanedName,
  });
  if (!normalized) return;
  const json = serializeThemeExport(normalized);
  const fileName = `${slugifyThemeFilename(normalized.name)}.bictheme.json`;
  await shareOrDownloadJsonFile(json, fileName, `Shared "${normalized.name}" theme.`, `Exported ${fileName}`);
};

document.getElementById('btnExportThemes').onclick = async () => {
  if (!customThemes.length) { showToast('Create a custom theme first.'); return; }
  if (customThemes.length === 1) {
    const t = customThemes[0];
    const fileName = `${slugifyThemeFilename(t.name)}.bictheme.json`;
    await shareOrDownloadJsonFile(serializeThemeExport(t), fileName, `Shared "${t.name}" theme.`, `Exported ${fileName}`);
  } else {
    const fileName = 'brick-custom-themes.bictheme.json';
    await shareOrDownloadJsonFile(
      serializeThemesPackExport(customThemes),
      fileName,
      `Shared ${customThemes.length} custom themes.`,
      `Exported ${customThemes.length} custom themes (${fileName})`,
    );
  }
};

document.getElementById('btnImportTheme').onclick = () => {
  document.getElementById('themeImportInput').click();
};

document.getElementById('themeImportInput').onchange = async (e) => {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  try {
    const incoming = parseImportedThemesJson(await f.text());
    const { merged, importedIds } = mergeImportedThemes(customThemes, incoming);
    customThemes = merged;
    persistCustomThemes();
    if (importedIds.length > 0) {
      state.themeId = importedIds[0];
    }
    renderAll();
    const first = customThemes.find(t => t.id === importedIds[0]);
    showToast(
      importedIds.length === 1 && first
        ? `Imported theme "${first.name}".`
        : `Imported ${importedIds.length} custom themes.`,
    );
  } catch (err) {
    showToast(err?.message || 'Could not import theme file.');
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const ovModal = document.getElementById('overviewModal');
  if (ovModal && !ovModal.classList.contains('hidden')) {
    ovModal.classList.add('hidden');
  } else if (themeEditorModalEl && !themeEditorModalEl.classList.contains('hidden')) {
    closeThemeEditor();
  } else if (stylePopEl && !stylePopEl.classList.contains('hidden')) {
    setStylePopoverOpen(false);
  }
});

document.getElementById('btnPageOverview').onclick = () => {
  renderOverviewModal();
  const modal = document.getElementById('overviewModal');
  modal.classList.remove('hidden');
  const activeRow = modal.querySelector('[data-active="true"]');
  if (activeRow) activeRow.scrollIntoView({ block: 'center' });
};
document.getElementById('btnCloseOverview').onclick = () => document.getElementById('overviewModal').classList.add('hidden');
document.getElementById('overviewModal').onclick = (e) => {
  if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
};

document.getElementById('btnUndo').onclick = () => {
  if (!state.undoStack.length) return;
  const cur = JSON.stringify({ chapters: state.model.chapters, overrides: state.overrides, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter, coverMeta: state.coverMeta, backMeta: state.backMeta });
  state.redoStack.push(cur);
  applyHistorySnap(state.undoStack.pop());
};
document.getElementById('btnRedo').onclick = () => {
  if (!state.redoStack.length) return;
  const cur = JSON.stringify({ chapters: state.model.chapters, overrides: state.overrides, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter, coverMeta: state.coverMeta, backMeta: state.backMeta });
  state.undoStack.push(cur);
  applyHistorySnap(state.redoStack.pop());
};

document.querySelectorAll('.mode-btn').forEach(b => {
  b.onclick = () => {
    state.mode = b.getAttribute('data-mode');
    if (state.mode === 'pan') state.bomShortcutVisible = false;
    if (state.mode !== 'select') state.selectedPartIds.clear();
    if (state.mode !== 'arrange') state.selectedArrangeEl = null;
    renderAll();
  };
});

document.getElementById('prevPage').onclick = () => {
  dismissErrorBanner();
  if (state.pageIdx > 0) { state.pageIdx--; state.bomShortcutVisible = false; state.selectedPartIds.clear(); resetZoom(); renderAll(); }
};
document.getElementById('nextPage').onclick = () => {
  dismissErrorBanner();
  if (state.pageIdx < state.pages.length - 1) { state.pageIdx++; state.bomShortcutVisible = false; state.selectedPartIds.clear(); resetZoom(); renderAll(); }
};
document.getElementById('btnZoomIn').onclick = () => setZoom(state.zoom * 1.22);
document.getElementById('btnZoomOut').onclick = () => setZoom(state.zoom * 0.82);
document.getElementById('btnZoomFit').onclick = resetZoom;

// Print & Page Setup + Parts List Setup
document.querySelectorAll('.fmt-btn').forEach(b => { b.onclick = () => { state.paperFormat = b.getAttribute('data-format'); resetZoom(); renderAll(); }; });
document.querySelectorAll('.unit-btn').forEach(b => {
  b.onclick = () => {
    const nextUnit = b.getAttribute('data-unit');
    if (nextUnit === state.customUnit) return;
    if (nextUnit === 'cm') { state.customWidth = +(state.customWidth * 2.54).toFixed(1); state.customHeight = +(state.customHeight * 2.54).toFixed(1); }
    else { state.customWidth = +(state.customWidth / 2.54).toFixed(2); state.customHeight = +(state.customHeight / 2.54).toFixed(2); }
    state.customUnit = nextUnit;
    renderAll();
  };
});
const onCustomDimChange = () => {
  const w = parseFloat(document.getElementById('customWidthIn').value);
  const h = parseFloat(document.getElementById('customHeightIn').value);
  if (isFinite(w) && w >= 2) state.customWidth = w;
  if (isFinite(h) && h >= 2) state.customHeight = h;
  resetZoom();
  renderAll();
};
document.getElementById('customWidthIn').onchange = onCustomDimChange;
document.getElementById('customHeightIn').onchange = onCustomDimChange;
document.querySelectorAll('.orient-btn').forEach(b => { b.onclick = () => { state.orientation = b.getAttribute('data-orient'); resetZoom(); renderAll(); }; });
document.querySelectorAll('.layout-btn').forEach(b => { b.onclick = () => { state.layout = b.getAttribute('data-layout'); renderAll(); }; });
document.querySelectorAll('.dens-btn').forEach(b => { b.onclick = () => { state.density = b.getAttribute('data-density'); renderAll(); }; });
document.querySelectorAll('.pgnum-btn').forEach(b => { b.onclick = () => { state.pageNumberFormat = b.getAttribute('data-pgnum'); renderAll(); }; });
document.querySelectorAll('.pacing-btn').forEach(b => { b.onclick = () => { state.pacing = b.getAttribute('data-pacing'); syncMenuControls(); }; });
document.querySelectorAll('.fade-chip').forEach(b => { b.onclick = () => { state.fadeOpacity = parseFloat(b.getAttribute('data-fade')); renderAll(); }; });

// Parts List Setup controls
document.querySelectorAll('.bom-dens-btn').forEach(b => { b.onclick = () => { state.bomConfig.density = b.getAttribute('data-bom-dens'); renderAll(); }; });
document.querySelectorAll('.bom-flow-btn').forEach(b => { b.onclick = () => { state.bomConfig.flow = b.getAttribute('data-bom-flow'); renderAll(); }; });
document.querySelectorAll('.bom-align-btn').forEach(b => { b.onclick = () => { state.bomConfig.align = b.getAttribute('data-bom-align'); renderAll(); }; });
document.getElementById('bomSortPrimary').onchange = (e) => { state.bomConfig.sortPrimary = e.target.value; renderAll(); };
document.getElementById('bomSortSecondary').onchange = (e) => { state.bomConfig.sortSecondary = e.target.value; renderAll(); };
document.getElementById('toggleBomNames').onchange = (e) => { state.bomConfig.showNames = e.target.checked; renderAll(); };

document.getElementById('togglePrintGuides').onchange = (e) => { state.showPrintGuides = e.target.checked; renderAll(); };
document.getElementById('toggleExtras').onchange = (e) => { state.showExtras = e.target.checked; renderAll(); };
document.getElementById('toggleHighlight').onchange = (e) => { state.highlightNew = e.target.checked; renderAll(); };
document.getElementById('highlightColor').oninput = (e) => { state.highlightColor = e.target.value; renderAll(); };
document.getElementById('toggleFade').onchange = (e) => { state.fadePrev = e.target.checked; renderAll(); };
document.getElementById('toggleRotCues').onchange = (e) => { state.showRotCues = e.target.checked; renderAll(); };
document.getElementById('toggleSizeGuides').onchange = (e) => { state.showSizeGuides = e.target.checked; renderAll(); };
const mf1to1ToggleEl = document.getElementById('toggleMinifig1to1');
if (mf1to1ToggleEl) mf1to1ToggleEl.onchange = (e) => { state.showMinifig1to1 = e.target.checked; renderAll(); };
document.querySelectorAll('.mf-style-btn').forEach(b => {
  b.onclick = () => applyMinifigStyleChange(b.getAttribute('data-mf-style'));
});
const setStepBorders = (e) => { state.showStepBorders = e.target.checked; renderAll(); };
document.getElementById('toggleStepBorders').onchange = setStepBorders;
document.getElementById('toggleStepBordersSetup').onchange = setStepBorders;
const setPageTitle = (e) => { state.showPageTitle = e.target.checked; renderAll(); };
document.getElementById('togglePageTitle').onchange = setPageTitle;
document.getElementById('togglePageTitleSetup').onchange = setPageTitle;
document.getElementById('toggleCompleteText').onchange = (e) => { state.completeMeta.showText = e.target.checked; renderAll(); };
document.getElementById('toggleCompleteFireworks').onchange = (e) => { state.completeMeta.showFireworks = e.target.checked; renderAll(); };
document.getElementById('toggleDetectDuplicates').onchange = (e) => {
  state.detectDuplicates = e.target.checked;
  if (state.model?._parsed) {
    pushUndo();
    submodelThumbCache.clear();
    state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto', state.model._subdivisionPlan || null);
    state.pageIdx = 0; state.selectedPartIds.clear();
    computeModelDiagnostics();
    renderAll();
    const subCount = state.model.chapters.filter(c => c.kind === 'submodel').length;
    showToast(state.detectDuplicates
      ? (subCount > 0 ? `Detected ${subCount} duplicate submodel${subCount === 1 ? '' : 's'}.` : 'No repeated submodels detected in this build.')
      : 'Duplicate submodel grouping disabled.');
  } else {
    scheduleSaveSessionPrefs();
    syncMenuControls();
  }
};

// Open real Print & Export PDF Modal (never silently closes!)
function openExportModal() {
  if (!state.model) { showToast('Import a model first.'); return; }
  closeMenu();
  document.getElementById('pageSetupModal').classList.add('hidden');
  document.getElementById('bomSetupModal').classList.add('hidden');
  const fmt = PAPER_FORMATS[state.paperFormat] || PAPER_FORMATS.letter;
  const [wIn, hIn] = getActivePagePhysicalInches();
  document.getElementById('expFormatSummary').textContent = `${fmt.name} (${formatPhysicalDims(wIn, hIn)}) · ${state.pages.length} pages`;
  document.getElementById('expPageCountBadge').textContent = `${state.pages.length} pages`;
  document.getElementById('expProgressWrap').classList.add('hidden');
  document.getElementById('expReadyWrap').classList.add('hidden');
  document.getElementById('exportModal').classList.remove('hidden');
}
document.getElementById('menuPrintBtn').onclick = openExportModal;
document.getElementById('menuPageSetupBtn').onclick = openPageSetupModal;
const closePageSetupModal = () => document.getElementById('pageSetupModal').classList.add('hidden');
document.getElementById('btnClosePageSetup').onclick = closePageSetupModal;
document.getElementById('pageSetupDoneBtn').onclick = closePageSetupModal;
document.getElementById('pageSetupPrintBtn').onclick = openExportModal;
document.getElementById('pageSetupModal').onclick = (e) => { if (e.target.id === 'pageSetupModal') closePageSetupModal(); };

document.getElementById('menuBomSetupBtn').onclick = openBomSetupModal;
const closeBomSetupModal = () => document.getElementById('bomSetupModal').classList.add('hidden');
document.getElementById('btnCloseBomSetup').onclick = closeBomSetupModal;
document.getElementById('bomSetupDoneBtn').onclick = closeBomSetupModal;
document.getElementById('bomSetupModal').onclick = (e) => { if (e.target.id === 'bomSetupModal') closeBomSetupModal(); };
document.getElementById('bomSetupJumpBtn').onclick = () => {
  closeBomSetupModal();
  if (!state.model) { showToast('Import a model first.'); return; }
  if (!state.showExtras) { state.showExtras = true; rebuildPages(); }
  const idx = state.pages.findIndex(p => p.kind === 'bom');
  if (idx >= 0) { state.pageIdx = idx; state.bomShortcutVisible = false; resetZoom(); renderAll(); }
};
document.getElementById('errorsModal').onclick = (e) => { if (e.target.id === 'errorsModal') document.getElementById('errorsModal').classList.add('hidden'); };
document.getElementById('btnCloseExport').onclick = () => document.getElementById('exportModal').classList.add('hidden');
document.getElementById('btnExpCurrentPdf').onclick = () => runPdfExport([state.pages[state.pageIdx]]);
document.getElementById('btnExpAllPdf').onclick = () => runPdfExport(state.pages);
document.getElementById('btnSharePdf').onclick = async () => {
  if (!lastGeneratedPdfBlob) return;
  try {
    const file = new File([lastGeneratedPdfBlob], lastGeneratedPdfName, { type: 'application/pdf' });
    await navigator.share({ files: [file], title: state.model.title });
  } catch (_) {}
};
document.getElementById('btnSysPrint').onclick = () => {
  document.getElementById('exportModal').classList.add('hidden');
  resetZoom();
  // Synchronous print directly inside click gesture (required on iOS Safari!)
  window.print();
};

document.getElementById('menuAddDivider').onclick = () => {
  if (!state.model) return;
  const pg = state.pages[state.pageIdx];
  pushUndo();
  state.dividerAfter[pg.id] = { title: 'Next Section', note: '' };
  closeMenu(); renderAll(); showToast('Inserted divider page after current page.');
};
document.getElementById('menuRegenBtn').onclick = () => {
  if (!state.model?._parsed) return;
  pushUndo();
  submodelThumbCache.clear();
  state.model = buildManualFromParsed(state.model._parsed, 'auto', state.model._subdivisionPlan || null);
  state.pageIdx = 0; state.selectedPartIds.clear();
  computeModelDiagnostics();
  closeMenu(); renderAll(); showToast('Regenerated clean steps.');
};
const menuSubdivideBtn = document.getElementById('menuSubdivideBtn');
if (menuSubdivideBtn) {
  menuSubdivideBtn.onclick = () => {
    if (!state.model?._parsed) { showToast('Import a model first.'); return; }
    closeMenu();
    openImportAssistant(state.model._parsed, true);
  };
}

// Save / Open .bic.json Project (supports iOS Share Sheet + Download!)
document.getElementById('menuSaveProj').onclick = async () => {
  if (!state.model) return;
  const activeTheme = getActiveTheme();
  const embeddedCustomTheme = activeTheme && !activeTheme.builtIn && !BUILT_IN_THEME_IDS.has(activeTheme.id) ? activeTheme : undefined;
  const payload = JSON.stringify({ version: 3, title: state.model.title, chapters: state.model.chapters, overrides: state.overrides, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter, coverMeta: state.coverMeta, completeMeta: state.completeMeta, backMeta: state.backMeta, bomConfig: state.bomConfig, showStepBorders: state.showStepBorders, showPageTitle: state.showPageTitle, pageNumberFormat: state.pageNumberFormat, detectDuplicates: state.detectDuplicates, minifigStyle: state.minifigStyle, showMinifig1to1: state.showMinifig1to1, themeId: state.themeId, ...(embeddedCustomTheme ? { customTheme: embeddedCustomTheme } : {}), paperFormat: state.paperFormat, orientation: state.orientation, density: state.density, layout: state.layout }, null, 2);
  const fileName = `${state.model.title.replace(/[^a-z0-9_-]+/gi, '_')}.bic.json`;
  closeMenu();
  await shareOrDownloadJsonFile(payload, fileName, 'Shared project file.', `Saved ${fileName}`);
};
document.getElementById('menuLoadProj').onclick = () => document.getElementById('projectLoadInput').click();
document.getElementById('projectLoadInput').onchange = async (e) => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    submodelThumbCache.clear();
    coverHeroCache.clear();
    clearMinifigDiagramCaches();
    state.model = { title: data.title || 'Loaded Manual', subtitle: '', chapters: data.chapters || [] };
    state.overrides = data.overrides || {}; state.pageInserts = data.pageInserts || {};
    state.dividerAfter = data.dividerAfter || {};
    state.coverMeta = normalizeCoverMeta(data.coverMeta);
    if (data.completeMeta) state.completeMeta = { ...state.completeMeta, ...data.completeMeta };
    if (data.backMeta) state.backMeta = { ...state.backMeta, ...data.backMeta };
    if (data.bomConfig) state.bomConfig = { ...state.bomConfig, ...data.bomConfig };
    if (typeof data.showStepBorders === 'boolean') state.showStepBorders = data.showStepBorders;
    if (typeof data.showPageTitle === 'boolean') state.showPageTitle = data.showPageTitle;
    if (data.pageNumberFormat) state.pageNumberFormat = data.pageNumberFormat;
    if (typeof data.detectDuplicates === 'boolean') state.detectDuplicates = data.detectDuplicates;
    if (data.minifigStyle) state.minifigStyle = normalizeMinifigStepStyle(data.minifigStyle);
    if (typeof data.showMinifig1to1 === 'boolean') state.showMinifig1to1 = data.showMinifig1to1;
    if (data.customTheme) {
      const normalized = normalizeCustomTheme(data.customTheme);
      if (normalized) {
        const { merged, importedIds } = mergeImportedThemes(customThemes, [normalized]);
        customThemes = merged;
        persistCustomThemes();
        if (importedIds[0]) state.themeId = importedIds[0];
      }
    } else if (data.themeId) {
      state.themeId = resolveThemeById(data.themeId, customThemes).id;
    }
    if (data.paperFormat) state.paperFormat = data.paperFormat;
    if (data.orientation) state.orientation = data.orientation;
    if (data.density) state.density = data.density;
    if (data.layout) state.layout = data.layout;
    state.pageIdx = 0; state.undoStack = []; state.redoStack = [];
    state.seenDiagnosticKeys = new Set();
    errFilter = 'all';
    lastSourceRecord = { kind: 'project', fileName: f.name };
    computeModelDiagnostics();
    closeMenu(); renderAll(); showToast(`Opened ${state.model.title}.`);
  } catch (err) { showToast('Could not read project file.'); }
};

// Image Insert & Cover Image Uploads (Creator Logo, Theme Image, Background)
let pendingCoverImageSlot = 'bg';
function openCoverImagePicker(slot = 'bg') {
  pendingCoverImageSlot = slot;
  const inp = document.getElementById('coverImageInput');
  if (inp) inp.click();
}

document.getElementById('insertImageInput').onchange = (e) => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const pg = state.pages[state.pageIdx];
    pushUndo();
    const arr = state.pageInserts[pg.id] || [];
    arr.push({ id: 'ins_' + Date.now().toString(36), kind: 'image', src: r.result, x: 40, y: 90, scale: 1 });
    state.pageInserts[pg.id] = arr;
    renderAll();
  };
  r.readAsDataURL(f);
};
document.getElementById('coverImageInput').onchange = (e) => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  const slot = pendingCoverImageSlot || 'bg';
  pendingCoverImageSlot = 'bg';
  const r = new FileReader();
  r.onload = () => {
    const pg = state.pages[state.pageIdx];
    pushUndo();
    if (pg.kind === 'cover') {
      state.coverMeta = normalizeCoverMeta(state.coverMeta);
      if (slot === 'creatorLogo') state.coverMeta.creatorLogoSrc = r.result;
      else if (slot === 'themeImage') state.coverMeta.themeImageSrc = r.result;
      else state.coverMeta.bgSrc = r.result;
    } else if (pg.kind === 'complete') {
      state.completeMeta.bgSrc = r.result;
    } else if (pg.kind === 'back') {
      state.backMeta.bgSrc = r.result;
    }
    renderAll();
  };
  r.readAsDataURL(f);
};

// Model Import Triggers
const triggerImport = () => { closeMenu(); document.getElementById('fileInput').click(); };
document.getElementById('emptyImportBtn').onclick = triggerImport;
document.getElementById('menuImportBtn').onclick = triggerImport;

// Errors Modal, Bottom Error Banner & Bricks Library Wiring
document.getElementById('menuErrorsBtn').onclick = openErrorsModal;
document.getElementById('btnCloseErrors').onclick = () => document.getElementById('errorsModal').classList.add('hidden');
document.getElementById('btnBannerSeeErrors').onclick = openErrorsModal;
document.getElementById('btnBannerDismiss').onclick = dismissErrorBanner;
document.getElementById('libSourceSelect').onchange = (e) => {
  document.getElementById('libCustomUrlInput').classList.toggle('hidden', e.target.value !== 'custom');
};
document.getElementById('menuFetchLibBtn').onclick = () => fetchMissingPartsOnline();
document.getElementById('menuImportLibBtn').onclick = () => document.getElementById('libImportInput').click();
document.getElementById('libImportInput').onchange = async (e) => {
  const files = e.target.files;
  if (files && files.length) await importBricksLibraryFiles(files);
  e.target.value = '';
};
document.getElementById('menuClearLibBtn').onclick = async () => {
  userLibRaw.clear(); userLibTitles.clear(); embeddedDatCompiled.clear(); pliThumbCache.clear(); submodelThumbCache.clear(); clearMinifigDiagramCaches(); coverHeroCache.clear();
  await dbClearStore(LIB_STORE);
  updateLibraryStatusUI();
  if (state.model) { computeModelDiagnostics(); renderAll(); }
  showToast('Cleared saved Bricks Library.');
};

let pendingRawFile = null; // { kind:'io'|'ldr', fileName, data }
let impPreviewEngine = null;
let impPreviewMesh = null;
let impState = {
  parsed: null,
  prep: null,
  assessment: null,
  proposals: [],
  selectedId: 'none', // 'none' or proposal.id
  activeProposal: null,
  explodePct: 45,
  colorMode: 'sections', // 'sections' | 'bricks'
  az: 38,
  el: 28,
  isPostImport: false,
};

function closeImportAssistant() {
  state.pendingImport = null;
  pendingRawFile = null;
  impState.parsed = null;
  impState.activeProposal = null;
  impPreviewMesh = null;
  document.getElementById('importModal').classList.add('hidden');
}

function getPreviewPartMaps() {
  const parts = impState.parsed?.parts || [];
  const prop = impState.activeProposal;
  const partOffsets = {};
  const partColorOverrides = impState.colorMode === 'sections' && prop ? {} : null;

  if (prop && prop.sections?.length) {
    const spanRef = Math.max(160, impState.assessment?.longestSpanLdu || 320);
    const explodeDist = Math.min(240, Math.max(48, spanRef * 0.24)) * (impState.explodePct / 100);
    const renderedGroups = [];
    const coveredIndices = new Set();

    prop.sections.forEach((sec) => {
      const groups = sec.repeatPartIndexGroups && sec.repeatPartIndexGroups.length > 1
        ? sec.repeatPartIndexGroups
        : [sec.partIndices];

      groups.forEach((grp, gIdx) => {
        const sign = groups.length === 2 && gIdx === 1 ? -1 : 1;
        const ox = (sec.explodeOffset?.[0] || 0) * explodeDist * sign;
        const oy = (sec.explodeOffset?.[1] || 0) * explodeDist;
        const oz = (sec.explodeOffset?.[2] || 0) * explodeDist * sign;
        const colHex = groups.length === 2 && gIdx === 1 ? '#38bdf8' : sec.previewColor;

        renderedGroups.push({ indices: grp, ox, oy, oz });

        for (const pi of grp) {
          coveredIndices.add(pi);
          const p = parts[pi];
          if (!p) continue;
          if (explodeDist > 1) partOffsets[p.id] = { x: ox, y: oy, z: oz, arrow: false };
          if (partColorOverrides) partColorOverrides[p.id] = colHex;
        }
      });
    });

    // Move each minifigure assembly together with its closest host section so seated drivers &
    // passengers ride inside their car in the 3D exploded preview instead of floating in empty space!
    const boxes = impState.prep?.boxes;
    const minifigGroups = impState.prep?.minifigGroups || [];
    if (boxes && renderedGroups.length > 0 && minifigGroups.length > 0) {
      for (const mg of minifigGroups) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (const idx of mg.indices) {
          const b = boxes[idx];
          if (!b) continue;
          if (b.min[0] < minX) minX = b.min[0]; if (b.max[0] > maxX) maxX = b.max[0];
          if (b.min[1] < minY) minY = b.min[1]; if (b.max[1] > maxY) maxY = b.max[1];
          if (b.min[2] < minZ) minZ = b.min[2]; if (b.max[2] > maxZ) maxZ = b.max[2];
        }
        if (!isFinite(minX)) continue;
        let bestGrp = renderedGroups[0], bestD = Infinity;
        for (const rg of renderedGroups) {
          for (const pi of rg.indices) {
            const b = boxes[pi];
            if (!b) continue;
            const gx = Math.max(0, minX - b.max[0], b.min[0] - maxX);
            const gy = Math.max(0, minY - b.max[1], b.min[1] - maxY);
            const gz = Math.max(0, minZ - b.max[2], b.min[2] - maxZ);
            const d = Math.hypot(gx, gy, gz);
            if (d < bestD) { bestD = d; bestGrp = rg; }
          }
        }
        for (const idx of mg.indices) {
          if (coveredIndices.has(idx)) continue;
          const p = parts[idx];
          if (!p) continue;
          if (explodeDist > 1) {
            partOffsets[p.id] = { x: bestGrp.ox, y: bestGrp.oy, z: bestGrp.oz, arrow: false };
          }
        }
      }
    }
  }
  return { parts, partOffsets, partColorOverrides };
}

function rebuildAndDrawImportPreview() {
  const canvas = document.getElementById('impPreviewCanvas');
  if (!canvas || !impState.parsed) return;
  if (!impPreviewEngine) impPreviewEngine = new WebGLBrickEngine(canvas);

  const { parts, partOffsets, partColorOverrides } = getPreviewPartMaps();
  impPreviewMesh = buildMeshBuffers([], parts, {
    highlightNew: false,
    fadePrev: false,
    fadeOpacity: 1.0,
    showArrows: false,
    accent: '#1a73e8',
    partOffsets,
    partColorOverrides,
  });
  drawImportPreviewFrame();
}

function drawImportPreviewFrame() {
  const canvas = document.getElementById('impPreviewCanvas');
  if (!canvas || !impPreviewEngine || !impPreviewMesh) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(240, Math.round((rect.width || 360) * dpr));
  const h = Math.max(180, Math.round((rect.height || 240) * dpr));
  impPreviewEngine.draw(impPreviewMesh, w, h, impState.az, impState.el, 1.0);
}

// Orbit pointer gesture for the 3D Import Preview canvas (touch + mouse)
(function bindImportPreviewOrbit() {
  const canvas = document.getElementById('impPreviewCanvas');
  if (!canvas) return;
  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    impState.az = (impState.az - dx * 0.55 + 360) % 360;
    impState.el = Math.max(-75, Math.min(80, impState.el + dy * 0.45));
    drawImportPreviewFrame();
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
})();

function renderImportAssistantUI() {
  const listEl = document.getElementById('impProposalList');
  const zoomPill = document.getElementById('impZoomGainPill');
  const autoBtn = document.getElementById('impBtnAuto');
  const colSecBtn = document.getElementById('impColorModeSections');
  const colBrkBtn = document.getElementById('impColorModeBricks');

  // Color mode pill styling
  colSecBtn.className = `px-2.5 py-1 rounded-full transition ${impState.colorMode === 'sections' ? 'bg-[#1a73e8] text-white' : 'text-[var(--muted-foreground)]'}`;
  colBrkBtn.className = `px-2.5 py-1 rounded-full transition ${impState.colorMode === 'bricks' ? 'bg-[#1a73e8] text-white' : 'text-[var(--muted-foreground)]'}`;

  // Proposal cards (ranked suggestions + Single Continuous Build escape hatch)
  const cardsHtml = impState.proposals.map((prop, idx) => {
    const isSel = impState.selectedId === prop.id;
    const isRec = idx === 0 && impState.assessment?.shouldPrompt;
    return `
      <button type="button" data-prop-id="${prop.id}" class="imp-prop-card w-full text-left p-3 rounded-2xl border-2 transition ${isSel ? 'border-[#1a73e8] bg-[#1a73e8]/10' : 'border-[var(--border)] bg-[var(--background)] hover:border-[#1a73e8]/45'}">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span class="text-xs font-bold ${isSel ? 'text-[#1a73e8]' : ''}">${escHtml(prop.title)}</span>
            ${isRec ? '<span class="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#1a73e8] text-white">Recommended</span>' : ''}
          </div>
          ${prop.zoomGainEstimate && prop.zoomGainEstimate >= 1.3 ? `<span class="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">~${prop.zoomGainEstimate}× zoom</span>` : ''}
        </div>
        <div class="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-snug">${escHtml(prop.rationale)}</div>
      </button>`;
  }).join('') + `
    <button type="button" data-prop-id="none" class="imp-prop-card w-full text-left p-3 rounded-2xl border-2 transition ${impState.selectedId === 'none' ? 'border-[#1a73e8] bg-[#1a73e8]/10' : 'border-[var(--border)] bg-[var(--background)] hover:border-[#1a73e8]/45'}">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold ${impState.selectedId === 'none' ? 'text-[#1a73e8]' : ''}">Keep as Single Continuous Build</span>
        ${!impState.assessment?.shouldPrompt ? '<span class="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#1a73e8] text-white">Recommended</span>' : ''}
      </div>
      <div class="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-snug">Auto-generate clean zero-floating steps in one continuous chapter without splitting.</div>
    </button>`;

  listEl.innerHTML = cardsHtml;
  listEl.querySelectorAll('.imp-prop-card').forEach((btn) => {
    btn.onclick = () => {
      const pid = btn.getAttribute('data-prop-id');
      impState.selectedId = pid;
      if (pid === 'none') {
        impState.activeProposal = null;
      } else {
        const found = impState.proposals.find(p => p.id === pid);
        impState.activeProposal = found ? JSON.parse(JSON.stringify(found)) : null;
      }
      renderImportAssistantUI();
      rebuildAndDrawImportPreview();
    };
  });

  const active = impState.activeProposal;
  if (!active) {
    zoomPill.classList.add('hidden');
    autoBtn.textContent = impState.isPostImport ? 'Rebuild as Single Build' : 'Generate Manual';
    return;
  }

  if (active.zoomGainEstimate && active.zoomGainEstimate >= 1.25 && active.outputMode === 'modular_chapters') {
    zoomPill.textContent = `~${active.zoomGainEstimate}× larger bricks per step`;
    zoomPill.classList.remove('hidden');
  } else {
    zoomPill.classList.add('hidden');
  }

  const isMod = active.outputMode === 'modular_chapters';
  const primarySecs = active.sections.filter(s => s.role !== 'join');
  const hasJoin = active.sections.some(s => s.role === 'join');
  const secCountLabel = isMod
    ? `${primarySecs.length} Section${primarySecs.length === 1 ? '' : 's'}${hasJoin ? ' + Join' : ''}`
    : `${active.sections.length} Bags`;
  autoBtn.textContent = `${impState.isPostImport ? 'Apply' : 'Generate Manual'} (${secCountLabel})`;
}

function openImportAssistant(parsed, isPostImport = false) {
  const prep = prepareSubdivisionData(parsed);
  const { assessment, proposals } = analyzeModelSubdivisions(prep.inputs, prep.adjacency);

  state.pendingImport = parsed;
  impState.parsed = parsed;
  impState.prep = prep;
  impState.assessment = assessment;
  impState.proposals = proposals;
  impState.isPostImport = isPostImport;
  impState.explodePct = assessment.shouldPrompt || isPostImport ? 45 : 0;
  impState.colorMode = 'sections';
  impState.az = 38;
  impState.el = 28;

  // Pre-select the #1 ranked subdivision when triggered by size/span/post-import; otherwise single build
  if ((assessment.shouldPrompt || isPostImport) && proposals.length > 0) {
    impState.selectedId = proposals[0].id;
    impState.activeProposal = JSON.parse(JSON.stringify(proposals[0]));
  } else {
    impState.selectedId = 'none';
    impState.activeProposal = null;
  }

  document.getElementById('impTitle').textContent = isPostImport
    ? `Subdivide ${parsed.title}`
    : assessment.shouldPrompt
      ? `Split "${parsed.title}" for Easier Building?`
      : `Import ${parsed.title}`;

  const badge = document.getElementById('impSizeBadge');
  if (assessment.shouldPrompt) {
    badge.textContent = assessment.aspectRatio >= 3.0
      ? `${Math.round(assessment.longestSpanLdu / 20)} Studs Long`
      : `${parsed.parts.length} Pieces`;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  const reasonStr = assessment.reasons.length > 0
    ? `Detected ${assessment.reasons.join(' · ')}. Building sections first keeps bricks larger and easier to see.`
    : `Found ${parsed.parts.length} pieces${parsed.submodelCount ? ` across ${parsed.submodelCount} submodels` : ''}.`;
  document.getElementById('impSummary').textContent = reasonStr;

  document.getElementById('impKeepWrap').classList.toggle('hidden', isPostImport || !parsed.hasSteps);
  const slider = document.getElementById('impExplodeSlider');
  slider.value = String(impState.explodePct);
  document.getElementById('impExplodeVal').textContent = `${impState.explodePct}%`;

  document.getElementById('importModal').classList.remove('hidden');
  renderImportAssistantUI();
  requestAnimationFrame(() => rebuildAndDrawImportPreview());
}

// Wire Import Assistant controls
document.getElementById('impExplodeSlider').oninput = (e) => {
  impState.explodePct = parseInt(e.target.value, 10) || 0;
  document.getElementById('impExplodeVal').textContent = `${impState.explodePct}%`;
  rebuildAndDrawImportPreview();
};
document.getElementById('impColorModeSections').onclick = () => {
  impState.colorMode = 'sections';
  renderImportAssistantUI();
  rebuildAndDrawImportPreview();
};
document.getElementById('impColorModeBricks').onclick = () => {
  impState.colorMode = 'bricks';
  renderImportAssistantUI();
  rebuildAndDrawImportPreview();
};

function finishImport(parsed, mode, subdivisionPlan = null, isPostImport = false) {
  if (isPostImport) pushUndo();
  submodelThumbCache.clear();
  coverHeroCache.clear();
  state.model = buildManualFromParsed(parsed, mode, subdivisionPlan);
  if (!isPostImport) {
    state.overrides = {}; state.pageInserts = {}; state.dividerAfter = {};
    state.coverMeta = createDefaultCoverMeta();
    state.undoStack = []; state.redoStack = [];
    state.seenDiagnosticKeys = new Set();
  }
  state.pageIdx = 0; state.mode = 'pan'; state.selectedPartIds.clear();
  errFilter = 'all';
  closeImportAssistant();
  if (!isPostImport && pendingRawFile) {
    lastSourceRecord = { ...pendingRawFile, importMode: mode, subdivisionPlan: subdivisionPlan || null };
    dbPut('lastModel', lastSourceRecord);
    pendingRawFile = null;
  } else if (isPostImport && lastSourceRecord && (lastSourceRecord.kind === 'io' || lastSourceRecord.kind === 'ldr')) {
    lastSourceRecord = { ...lastSourceRecord, importMode: mode, subdivisionPlan: subdivisionPlan || null };
    dbPut('lastModel', lastSourceRecord);
  }
  computeModelDiagnostics();
  resetZoom(); renderAll();
  const steps = getAllSteps(state.model);
  const subSummary = subdivisionPlan && subdivisionPlan.strategy !== 'none'
    ? ` · ${subdivisionPlan.title}`
    : '';
  showToast(`${isPostImport ? 'Updated' : 'Imported'} ${parsed.title} (${parsed.parts.length} pieces, ${steps.length} steps${subSummary}).`);
  if (!isPostImport && state.diagnostics.length > 0) showImportErrorBanner();
}

document.getElementById('impBtnAuto').onclick = () => {
  if (!impState.parsed) return;
  finishImport(impState.parsed, 'auto', impState.activeProposal, impState.isPostImport);
};
document.getElementById('impBtnKeep').onclick = () => {
  if (!impState.parsed) return;
  finishImport(impState.parsed, 'keep', null, impState.isPostImport);
};
document.getElementById('impBtnCancel').onclick = closeImportAssistant;
document.getElementById('impBtnCloseX').onclick = closeImportAssistant;
document.getElementById('importModal').onclick = (e) => {
  if (e.target.id === 'importModal') closeImportAssistant();
};

document.getElementById('fileInput').onchange = async (e) => {
  const file = e.target.files?.[0]; e.target.value = ''; if (!file) return;
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.io') && !lower.endsWith('.ldr') && !lower.endsWith('.mpd')) {
    showToast('Please select a BrickLink Studio (.io) or LDraw (.ldr / .mpd) file.'); return;
  }
  showToast(`Reading ${file.name}…`);
  try {
    let parsed;
    if (lower.endsWith('.io')) {
      const ab = await file.arrayBuffer();
      pendingRawFile = { kind: 'io', fileName: file.name, data: ab };
      const { m1Text, m2Text } = await extractIoArchive(ab);
      parsed = parseImportedModel(m1Text, m2Text, file.name);
      await textureStore.predecodeAllPending();
    } else {
      embeddedDatRaw.clear(); embeddedDatTitles.clear(); embeddedDatCompiled.clear(); compositePartDefs.clear(); pliThumbCache.clear(); submodelThumbCache.clear(); clearMinifigDiagramCaches();
      textureStore.clearEmbedded();
      const txt = await file.text();
      pendingRawFile = { kind: 'ldr', fileName: file.name, data: txt };
      parsed = parseImportedModel(txt, '', file.name);
      await textureStore.predecodeAllPending();
    }
    const prep = prepareSubdivisionData(parsed);
    const { assessment } = analyzeModelSubdivisions(prep.inputs, prep.adjacency);
    if (parsed.hasSteps || parsed.submodelCount > 0 || assessment.shouldPrompt) {
      openImportAssistant(parsed, false);
    } else {
      finishImport(parsed, 'auto', null, false);
      if (assessment.tier === 'borderline') {
        showToast(`Imported ${parsed.title}. Tip: Open Menu → Subdivide Model to split into sections.`);
      }
    }
  } catch (err) {
    showToast(err?.message || 'Could not import this file.');
  }
};

window.addEventListener('resize', () => {
  if (state.model) renderAll();
  if (impState.parsed && !document.getElementById('importModal').classList.contains('hidden')) {
    drawImportPreviewFrame();
  }
  updateStylePopoverTail();
});

// Automatically reload last opened model & session on start!
restoreLastSessionOnStart();
}
