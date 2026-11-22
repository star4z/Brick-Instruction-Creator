// @ts-nocheck
/* eslint-disable */
// Brick Instruction Creator — Interactive WebGL Manual Studio Runtime
// Compiled & bundled locally by Vite for GitHub Pages and Neocities deployment.

import {
  analyzeModelSubdivisions,
  mergeProposedSections,
  recomputeProposalWithCount,
  splitProposedSection,
} from './engine/subdivisionAnalyzer';
import { compileDatEntry as compileLDrawDatEntry } from './engine/datCompiler';
import {
  MINIFIG_BUILD_CAMERA,
  classifyMinifigGroupKind,
  computeMinifigOneToOneLayout,
  extractMinifigureGroups,
  normalizeCompositeThumbPart,
  normalizeMinifigureForBuild,
} from './engine/minifigPose';
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
  14:{name:'Yellow',hex:'#f2cd37',edge:'#9e810d'},
  15:{name:'White',hex:'#f6f7f9',edge:'#9aa0a6'},
  17:{name:'Light Green',hex:'#c2dab8',edge:'#739168'},
  18:{name:'Light Yellow',hex:'#fbe696',edge:'#ad9747'},
  19:{name:'Tan',hex:'#e4cd9e',edge:'#947d50'},
  22:{name:'Purple',hex:'#81007b',edge:'#4a0047'},
  25:{name:'Orange',hex:'#fe8a18',edge:'#a15003'},
  26:{name:'Magenta',hex:'#923978',edge:'#541d44'},
  27:{name:'Lime',hex:'#bbe90b',edge:'#6d8a04'},
  28:{name:'Dark Tan',hex:'#958a73',edge:'#595243'},
  29:{name:'Bright Pink',hex:'#e4adc8',edge:'#9c617f'},
  30:{name:'Medium Lavender',hex:'#ac78ba',edge:'#6b4276'},
  31:{name:'Lavender',hex:'#e1d5ed',edge:'#9683ab'},
  33:{name:'Trans-Dark Blue',hex:'#0020a0',edge:'#001155',alpha:0.46},
  34:{name:'Trans-Green',hex:'#237841',edge:'#124223',alpha:0.46},
  36:{name:'Trans-Red',hex:'#c91a09',edge:'#730e04',alpha:0.48},
  40:{name:'Trans-Black',hex:'#42464f',edge:'#1d2026',alpha:0.42},
  41:{name:'Trans-Light Blue',hex:'#7ec8f2',edge:'#3b7ca3',alpha:0.44},
  42:{name:'Trans-Neon Green',hex:'#d8f030',edge:'#849613',alpha:0.50},
  43:{name:'Trans-Very Lt Blue',hex:'#c1dff0',edge:'#719ab3',alpha:0.42},
  46:{name:'Trans-Yellow',hex:'#f5cd2f',edge:'#9c7e09',alpha:0.50},
  47:{name:'Trans-Clear',hex:'#e2ecf5',edge:'#8a99a8',alpha:0.34},
  57:{name:'Trans-Orange',hex:'#f08f1c',edge:'#945205',alpha:0.50},
  70:{name:'Reddish Brown',hex:'#582a12',edge:'#2e1406'},
  71:{name:'Light Bluish Gray',hex:'#a0a5a9',edge:'#5c6064'},
  72:{name:'Dark Bluish Gray',hex:'#6c6e68',edge:'#3a3c38'},
  73:{name:'Medium Blue',hex:'#5a93db',edge:'#2e5991'},
  74:{name:'Medium Green',hex:'#73dca1',edge:'#388a5b'},
  78:{name:'Light Nougat',hex:'#f6d7b3',edge:'#a88760'},
  84:{name:'Medium Nougat',hex:'#aa7d55',edge:'#63452a'},
  85:{name:'Dark Purple',hex:'#3f3691',edge:'#211b54'},
  110:{name:'Violet',hex:'#4354a3',edge:'#242f63'},
  115:{name:'Medium Lime',hex:'#c7d23c',edge:'#7c8519'},
  151:{name:'Sand Green',hex:'#a0bcac',edge:'#5b7566'},
  179:{name:'Flat Silver',hex:'#898788',edge:'#4e4d4e'},
  191:{name:'Bright Light Orange',hex:'#f8bb3d',edge:'#a37414'},
  212:{name:'Bright Light Blue',hex:'#9fc3e9',edge:'#577ea8'},
  226:{name:'Bright Light Yellow',hex:'#fff03a',edge:'#a69a12'},
  272:{name:'Dark Blue',hex:'#0a3463',edge:'#041a33'},
  288:{name:'Dark Green',hex:'#184632',edge:'#0b2419'},
  297:{name:'Pearl Gold',hex:'#aa7f2e',edge:'#614613'},
  308:{name:'Dark Brown',hex:'#352100',edge:'#1a1000'},
  320:{name:'Dark Red',hex:'#720e0f',edge:'#3d0607'},
  321:{name:'Dark Azure',hex:'#078bc9',edge:'#034e73'},
  322:{name:'Medium Azure',hex:'#36aebf',edge:'#1b6570'},
  323:{name:'Light Aqua',hex:'#adc3c0',edge:'#637a77'},
  326:{name:'Yellowish Green',hex:'#dfeea5',edge:'#8e9e53'},
  330:{name:'Olive Green',hex:'#9b9a5a',edge:'#57562d'},
  378:{name:'Sand Blue',hex:'#6074a1',edge:'#374566'},
  484:{name:'Dark Orange',hex:'#a95500',edge:'#5e2f00'},
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

  // Known exact LDraw mold equivalences
  if (effective === '28621') { add('3626c'); add('3626b'); add('3626'); }
  if (effective === '3626c') { add('3626b'); add('3626'); }
  if (/^970c\d+$/i.test(effective)) { add('970c00'); add('3815c01'); }

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
  '93091': 'Minifigure Accessory',
  '24093': 'Minifigure Accessory',
  '3815': 'Minifigure Hips',
  '3816': 'Minifigure Leg (Right)',
  '3817': 'Minifigure Leg (Left)',
  '3818': 'Minifigure Arm (Right)',
  '3819': 'Minifigure Arm (Left)',
  '3820': 'Minifigure Hand',
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

// Fast recursive LDraw .dat compiler (checks embedded .io model2.ldr first, then user-imported LDraw Library!)
function lookupEmbeddedDat(ref, allowVirtual = true) {
  const k = normId(ref);
  const stripped = k.replace(/^(48|8|s)\//, '');
  const base = k.split('/').pop();
  for (const store of [embeddedDatRaw, userLibRaw]) {
    if (store.has(k)) return { key: k, lines: store.get(k), offset: null };
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
  return compileLDrawDatEntry(found, lookupEmbeddedDat);
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

  const pushTri = (a, b, c, n, col, aByte) => {
    const isTrans = aByte < 245;
    const P = isTrans ? trPos : opPos, N = isTrans ? trNorm : opNorm, C = isTrans ? trCol : opCol;
    P.push9(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    N.push9(n[0],n[1],n[2], n[0],n[1],n[2], n[0],n[1],n[2]);
    C.push12(col[0], col[1], col[2], aByte);
  };
  const pushEdge = (a, b, col, aByte) => {
    lnPos.push3(a[0],a[1],a[2]); lnPos.push3(b[0],b[1],b[2]);
    lnCol.push4(col[0],col[1],col[2],aByte); lnCol.push4(col[0],col[1],col[2],aByte);
  };

  const addBox = (cx, cy, cz, w, h, d, m, ox, oy, oz, hinge, col, eCol, aByte) => {
    const hw=w/2, hh=h/2, hd=d/2;
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
        pushEdge(v[i], v[j], eCol, aByte);
    }
  };

  const addCyl = (cx, cy, cz, rTop, rBot, h, axis, segs, m, ox, oy, oz, hinge, col, eCol, aByte) => {
    const hh = h / 2;
    const mk = (u, v, t) => axis === 'y' ? [cx+u,cy+t,cz+v] : axis === 'x' ? [cx+t,cy+u,cz+v] : [cx+u,cy+v,cz+t];
    const nTop = xformNorm(axis==='y'?[0,1,0]:axis==='x'?[1,0,0]:[0,0,1], m, hinge);
    const nBot = [-nTop[0], -nTop[1], -nTop[2]];
    const topC = xformPt(mk(0,0,hh), m, ox, oy, oz, hinge);
    const botC = xformPt(mk(0,0,-hh), m, ox, oy, oz, hinge);
    for (let i = 0; i < segs; i++) {
      const a0 = (i/segs)*Math.PI*2, a1 = ((i+1)/segs)*Math.PI*2;
      const t0 = xformPt(mk(Math.cos(a0)*rTop, Math.sin(a0)*rTop, hh), m, ox, oy, oz, hinge);
      const t1 = xformPt(mk(Math.cos(a1)*rTop, Math.sin(a1)*rTop, hh), m, ox, oy, oz, hinge);
      const b0 = xformPt(mk(Math.cos(a0)*rBot, Math.sin(a0)*rBot, -hh), m, ox, oy, oz, hinge);
      const b1 = xformPt(mk(Math.cos(a1)*rBot, Math.sin(a1)*rBot, -hh), m, ox, oy, oz, hinge);
      const am = (a0+a1)/2;
      const sn = xformNorm(axis==='y'?[Math.cos(am),0,Math.sin(am)]:axis==='x'?[0,Math.cos(am),Math.sin(am)]:[Math.cos(am),Math.sin(am),0], m, hinge);
      pushTri(b0, b1, t1, sn, col, aByte); pushTri(b0, t1, t0, sn, col, aByte);
      if (rTop > 0.05) pushTri(topC, t0, t1, nTop, col, aByte);
      if (rBot > 0.05) pushTri(botC, b1, b0, nBot, col, aByte);
      if (includeEdges && rTop > 0.05) pushEdge(t0, t1, eCol, aByte);
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

  const addTopStuds = (def, m, ox, oy, oz, hinge, col, eCol, aByte) => {
    if (!def.studs) return;
    const topX = def.topStudsX || Math.round(def.sx);
    const sx = Math.round(def.sx), sz = Math.round(def.sz);
    const startX = -((sx - 1) * 20) / 2, startZ = -((sz - 1) * 20) / 2;
    for (let ix = 0; ix < topX; ix++)
      for (let iz = 0; iz < sz; iz++)
        addCyl(startX + ix*20, 1.8, startZ + iz*20, 5.8, 5.8, 4.4, 'y', 8, m, ox, oy, oz, hinge, col, eCol, aByte);
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

  const emitSingleLeaf = (leafPart, isNew, isSelected, offX, offY, offZ, hingeRad, parentId = null) => {
    const def = resolvePart(leafPart.p);
    const cInfo = COLORS[leafPart.c] || COLORS[71];
    const lookupId = parentId || leafPart.id;
    const overrideHex = opts.partColorOverrides?.[lookupId] || opts.partColorOverrides?.[leafPart.id] || null;
    const isDimmed = Boolean(opts.dimPartIds && (opts.dimPartIds.has(lookupId) || opts.dimPartIds.has(leafPart.id)));
    const isFaded = (!isNew && opts.fadePrev) || isDimmed;
    const isRealTrans = !overrideHex && (cInfo.alpha || 1) < 0.96;
    // Fade solid earlier bricks via clean color muting (NOT alpha transparency with depthMask=false!)
    // so bricks underneath ALWAYS stay properly depth-occluded by plates above them!
    const fadeMix = isDimmed
      ? 0.72
      : isFaded
        ? Math.max(0, Math.min(0.76, (1.0 - opts.fadeOpacity) * 0.95 + (opts.fadeOpacity < 0.99 ? 0.16 : 0)))
        : 0;
    const baseHex = overrideHex || cInfo.hex;
    const baseCol = isSelected ? [26, 115, 232] : hexToRgb255(baseHex, fadeMix);
    const edgeCol = isSelected
      ? [255, 255, 255]
      : overrideHex
        ? hexToRgb255('#1e293b', isDimmed ? 0.72 : 0.25)
        : (isNew && opts.highlightNew ? hexToRgb255(opts.highlightColor, 0) : hexToRgb255(cInfo.edge, fadeMix * 0.85));
    const aByte = isRealTrans
      ? Math.round(255 * (cInfo.alpha || 0.7) * (isFaded ? Math.max(0.55, opts.fadeOpacity) : 1))
      : 255;
    const m = leafPart.m || R_ID;
    const ox = leafPart.x + offX, oy = leafPart.y + offY, oz = leafPart.z + offZ;

    const compiled = compileEmbeddedDat(leafPart.p);
    if (compiled) {
      const T = compiled.tris, N = compiled.norms, E = compiled.edges, TC = compiled.triCols;
      const subColCache = TC && !isSelected && !overrideHex ? new Map() : null;
      for (let i = 0, ti = 0; i < T.length; i += 9, ti++) {
        const a = xformPt([T[i],T[i+1],T[i+2]], m, ox, oy, oz, hingeRad);
        const b = xformPt([T[i+3],T[i+4],T[i+5]], m, ox, oy, oz, hingeRad);
        const c = xformPt([T[i+6],T[i+7],T[i+8]], m, ox, oy, oz, hingeRad);
        const n = xformNorm([N[i],N[i+1],N[i+2]], m, hingeRad);
        let triRgb = baseCol;
        let triAlpha = aByte;
        if (subColCache) {
          const cid = TC[ti];
          if (cid !== 16 && COLORS[cid]) {
            let cached = subColCache.get(cid);
            if (!cached) {
              const sc = COLORS[cid];
              const scTrans = (sc.alpha || 1) < 0.96;
              cached = {
                rgb: hexToRgb255(sc.hex, fadeMix),
                alpha: scTrans ? Math.round(255 * (sc.alpha || 0.7) * (isFaded ? Math.max(0.55, opts.fadeOpacity) : 1)) : 255,
              };
              subColCache.set(cid, cached);
            }
            triRgb = cached.rgb;
            triAlpha = cached.alpha;
          }
        }
        pushTri(a, b, c, n, triRgb, triAlpha);
      }
      if ((includeEdges || isNew || isSelected) && E.length > 0) {
        for (let i = 0; i < E.length; i += 6) {
          const a = xformPt([E[i],E[i+1],E[i+2]], m, ox, oy, oz, hingeRad);
          const b = xformPt([E[i+3],E[i+4],E[i+5]], m, ox, oy, oz, hingeRad);
          pushEdge(a, b, edgeCol, aByte);
        }
      }
      return;
    }

    const w = def.sx * 20 - 0.5, d = def.sz * 20 - 0.5, h = def.h;
    if (def.shape === 'bar') addCyl(0, def.centered ? 0 : -h/2, 0, 3.8,3.8,h,'y',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    else if (def.shape === 'round') { addCyl(0,-h/2,0, (def.sx*20)/2-0.3,(def.sx*20)/2-0.3,h,'y',12, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte); addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte); }
    else if (def.shape === 'snot4' || def.shape === 'snot1') {
      addBox(0,-h/2,0, w,h,d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(w/2+1.9,-h/2,0, 5.8,5.8,4.6,'x',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      if (def.shape === 'snot4') {
        addCyl(-w/2-1.9,-h/2,0, 5.8,5.8,4.6,'x',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
        addCyl(0,-h/2,d/2+1.9, 5.8,5.8,4.6,'z',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
        addCyl(0,-h/2,-d/2-1.9, 5.8,5.8,4.6,'z',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      }
    } else if (def.shape === 'mf_legs') {
      addBox(0,-3,0, 32,6,16, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addBox(-8.5,-17,0, 14,22,14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addBox(8.5,-17,0, 14,22,14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'mf_torso_body') {
      // Bare minifigure torso (exact LDraw 973.dat proportions: y=0 shoulders, y=-32 waist, neck +0..+11.2)
      addMinifigTorso([0, 0, 0], false, m, ox, oy, oz, hingeRad, baseCol, edgeCol, baseCol, edgeCol, aByte);
    } else if (def.shape === 'mf_torso') {
      const sh = isBrickLinkTorsoAssemblyId(normId(leafPart.p)) ? [-20, 32, -10] : [0, 0, 0];
      const yellowInfo = COLORS[14];
      const handCol = (isSelected || overrideHex) ? baseCol : hexToRgb255(yellowInfo.hex, fadeMix);
      const handEdge = (isSelected || overrideHex)
        ? edgeCol
        : (isNew && opts.highlightNew ? hexToRgb255(opts.highlightColor, 0) : hexToRgb255(yellowInfo.edge, fadeMix * 0.85));
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
      addBox(0,-11,10, 16,8,5, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else {
      addBox(0,-h/2,0, w,h,d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
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

  const opP = opPos.slice(), trP = trPos.slice();
  const opN = opNorm.slice(), trN = trNorm.slice();
  const opC = opCol.slice(), trC = trCol.slice();

  const triPos = new Float32Array(opP.length + trP.length); triPos.set(opP, 0); triPos.set(trP, opP.length);
  const triNorm = new Float32Array(opN.length + trN.length); triNorm.set(opN, 0); triNorm.set(trN, opN.length);
  const triCol = new Uint8Array(opC.length + trC.length); triCol.set(opC, 0); triCol.set(trC, opC.length);

  // 1. Full model bounding sphere
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  for (let i=0; i<triPos.length; i+=3) {
    const x=triPos[i], y=triPos[i+1], z=triPos[i+2];
    if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;if(z<minZ)minZ=z;if(z>maxZ)maxZ=z;
  }
  const fcx=isFinite(minX)?(minX+maxX)/2:0, fcy=isFinite(minY)?(minY+maxY)/2:0, fcz=isFinite(minZ)?(minZ+maxZ)/2:0;
  let fullR2 = 0;
  for (let i=0; i<triPos.length; i+=3) {
    const dx=triPos[i]-fcx, dy=triPos[i+1]-fcy, dz=triPos[i+2]-fcz;
    const r2 = dx*dx + dy*dy + dz*dz;
    if (r2 > fullR2) fullR2 = r2;
  }
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
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'default' });
    this.gl = gl;
    if (!gl) return;
    const vsTri = `attribute vec3 aPos; attribute vec3 aNorm; attribute vec4 aCol; uniform mat4 uMVP; varying vec3 vNorm; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); vNorm = aNorm; vCol = aCol; }`;
    const fsTri = `precision mediump float; varying vec3 vNorm; varying vec4 vCol; void main(){ vec3 n = normalize(vNorm); if (!gl_FrontFacing) n = -n; float key = max(dot(n, normalize(vec3(0.55,0.85,0.55))), 0.0); float fill = max(dot(n, normalize(vec3(-0.7,0.35,-0.5))), 0.0); float hemi = 0.50 + 0.15 * n.y; float shade = min(1.08, hemi + key * 0.44 + fill * 0.18); gl_FragColor = vec4(vCol.rgb * shade, vCol.a); }`;
    const vsLine = `attribute vec3 aPos; attribute vec4 aCol; uniform mat4 uMVP; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); gl_Position.z -= 0.00022; vCol = aCol; }`;
    const fsLine = `precision mediump float; varying vec4 vCol; void main(){ gl_FragColor = vCol; }`;
    const cmp = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
    const lnk = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, cmp(gl.VERTEX_SHADER, v)); gl.attachShader(p, cmp(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p); return p; };
    this.triProg = lnk(vsTri, fsTri);
    this.lineProg = lnk(vsLine, fsLine);
    this.loc = {
      tMVP: gl.getUniformLocation(this.triProg, 'uMVP'),
      tPos: gl.getAttribLocation(this.triProg, 'aPos'),
      tNorm: gl.getAttribLocation(this.triProg, 'aNorm'),
      tCol: gl.getAttribLocation(this.triProg, 'aCol'),
      lMVP: gl.getUniformLocation(this.lineProg, 'uMVP'),
      lPos: gl.getAttribLocation(this.lineProg, 'aPos'),
      lCol: gl.getAttribLocation(this.lineProg, 'aCol'),
    };
    this.bTriPos = gl.createBuffer(); this.bTriNorm = gl.createBuffer(); this.bTriCol = gl.createBuffer();
    this.bLinePos = gl.createBuffer(); this.bLineCol = gl.createBuffer();
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
  computeMVP(mesh, w, h, azDeg, elDeg, zoom = 1, fixedHalfH = 0) {
    const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
    // Tight near/far ortho depth range around full model radius for 4x sharper Z-buffer occlusion!
    const clipRadius = Math.max(mesh.fullRadius || mesh.radius, mesh.radius);
    const dist = clipRadius * 2.5;
    const eye = [mesh.center[0]+dist*Math.sin(az)*Math.cos(el), mesh.center[1]+dist*Math.sin(el), mesh.center[2]+dist*Math.cos(az)*Math.cos(el)];
    const halfH = fixedHalfH > 0 ? fixedHalfH : ((mesh.radius * 1.12) / Math.max(0.4, zoom));
    const halfW = halfH * (w / Math.max(1, h));
    const near = Math.max(1, dist - clipRadius * 2.2);
    const far = dist + clipRadius * 2.2;
    return mulMat4(orthoMat4(-halfW, halfW, -halfH, halfH, near, far), lookAtMat4(eye, mesh.center, [0, 1, 0]));
  }
  draw(mesh, w, h, azDeg, elDeg, zoom = 1, fixedHalfH = 0) {
    const gl = this.gl;
    if (!gl || mesh.triPos.length === 0) return null;
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.uploadIfNeeded(mesh);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.0, 1.0);

    const mvp = this.computeMVP(mesh, w, h, azDeg, elDeg, zoom, fixedHalfH);
    gl.useProgram(this.triProg);
    gl.uniformMatrix4fv(this.loc.tMVP, false, mvp);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos); gl.enableVertexAttribArray(this.loc.tPos); gl.vertexAttribPointer(this.loc.tPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm); gl.enableVertexAttribArray(this.loc.tNorm); gl.vertexAttribPointer(this.loc.tNorm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol); gl.enableVertexAttribArray(this.loc.tCol); gl.vertexAttribPointer(this.loc.tCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);

    gl.depthMask(true);
    if (mesh.opaqueCount > 0) gl.drawArrays(gl.TRIANGLES, 0, mesh.opaqueCount);
    if (mesh.transCount > 0) {
      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, mesh.opaqueCount, mesh.transCount);
      gl.depthMask(true);
    }
    if (mesh.linePos.length > 0) {
      gl.useProgram(this.lineProg);
      gl.uniformMatrix4fv(this.loc.lMVP, false, mvp);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLinePos); gl.enableVertexAttribArray(this.loc.lPos); gl.vertexAttribPointer(this.loc.lPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLineCol); gl.enableVertexAttribArray(this.loc.lCol); gl.vertexAttribPointer(this.loc.lCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      gl.drawArrays(gl.LINES, 0, mesh.linePos.length / 3);
    }
    return mvp;
  }
  dispose() {
    if (!this.gl) return;
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
  }
}

const snapshotCanvas = document.createElement('canvas');
const snapshotEngine = new WebGLBrickEngine(snapshotCanvas);
let activeLiveEngine = null;
const pliThumbCache = new Map();

function getPliThumb(part) {
  const key = `${part.p}:${part.c}`;
  if (pliThumbCache.has(key)) return pliThumbCache.get(key);
  const samplePart = normalizeCompositeThumbPart(part, (pid) => resolvePart(pid).name, computeWorldBox);
  const mesh = buildMeshBuffers([], [samplePart], { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  snapshotEngine.draw(mesh, 112, 112, 32, 22, 1.05);
  const url = snapshotCanvas.toDataURL('image/png');
  if (pliThumbCache.size > 220) pliThumbCache.clear();
  pliThumbCache.set(key, url);
  return url;
}

function renderSnapshot(prev, next, az, el, w, h, zoom, opts) {
  const mesh = buildMeshBuffers(prev, next, opts);
  const mvp = snapshotEngine.draw(mesh, w, h, az, el, zoom, opts?.fixedHalfH || 0);
  return { url: snapshotCanvas.toDataURL('image/png'), mesh, mvp, w, h };
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

// =========================================================================
// 3. STUDIO .io PARSER WITH PRE-ASSEMBLED MINIFIGURE FUSION + ZERO-FLOATING STEP GENERATOR
// =========================================================================
function splitMpd(src, fallbackName) {
  const map = new Map();
  const lines = src.replace(/^\uFEFF/, '').split(/\r?\n/);
  let name = fallbackName, buf = [], sawFile = false;
  const flush = () => { if (buf.length > 0 && name) map.set(name.toLowerCase(), { name, lines: buf }); };
  for (const raw of lines) {
    const l = raw.trim(); if (!l) continue;
    const m = l.match(/^0\s+FILE\s+(.+)$/i);
    if (m) { if (sawFile || buf.length > 0) flush(); sawFile = true; name = m[1].trim(); buf = []; continue; }
    if (/^0\s+NOFILE\b/i.test(l)) { flush(); name = null; buf = []; continue; }
    if (!name) name = fallbackName;
    buf.push(l);
  }
  flush();
  return map;
}

function cleanSubName(raw) {
  return String(raw || 'Main Build').replace(/\.(ldr|mpd|io)$/i,'').replace(/\s+copy(\s*\d+)?$/i,'').trim() || 'Main Build';
}

function isAssemblySubfile(sf) {
  if (!sf) return false;
  if (sf.lines.some(l => /^0\s+IsAssembly\s+True/i.test(l))) return true;
  if (sf.lines.some(l => /^0\s+FlexibleBrick:/i.test(l))) return true;
  const nk = normId(sf.name);
  if (/^(bl_)?(973|3815|970|970c|3815c)[a-z0-9_]*c\d+/i.test(nk)) return true;
  return false;
}

function getSubfileTitle(sf) {
  const tLine = sf.lines.find(l => l.startsWith('0 ') && !/^0\s+(FILE|Name:|Author:|IsSubModel|BL_|Flexible|Render|IsAssembly|!|BFC)/i.test(l));
  return tLine ? tLine.replace(/^0\s+/, '').trim() : cleanSubName(sf.name);
}

async function readZipEntryText(bytes, view, entry) {
  if (entry.flags & 1) throw new Error('This .io file uses legacy Studio encryption. Re-save in Studio 2.x or export as .ldr.');
  const lOff = entry.localOffset;
  const dataStart = lOff + 30 + view.getUint16(lOff + 26, true) + view.getUint16(lOff + 28, true);
  const compBytes = bytes.subarray(dataStart, dataStart + entry.compSize);
  if (entry.method === 0) return new TextDecoder().decode(compBytes);
  if (entry.method === 8) {
    const stream = new Blob([compBytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return await new Response(stream).text();
  }
  throw new Error(`Unsupported ZIP method (${entry.method}).`);
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

  embeddedDatRaw.clear(); embeddedDatTitles.clear(); embeddedDatCompiled.clear(); compositePartDefs.clear(); pliThumbCache.clear(); submodelThumbCache.clear();
  if (m2Text) {
    const m2Map = splitMpd(m2Text, 'model2.ldr');
    for (const sf of m2Map.values()) {
      const isPart = sf.name.toLowerCase().endsWith('.dat') || sf.lines.some(l => /^0\s+IsSubModel\s+False/i.test(l));
      if (isPart) {
        const nk = normId(sf.name);
        embeddedDatRaw.set(nk, sf.lines);
        embeddedDatTitles.set(nk, getSubfileTitle(sf));
      }
    }
  }
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
      const isChildSub = useIsSubModelFlag
        ? (child && child.lines.some(l => /^0\s+IsSubModel\s+True/i.test(l)))
        : (child && !child.lines.some(l => /^[234]\s+/.test(l)));

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

// Identify wheels, tires, and loose accessories so Step 1 NEVER starts on a floating wheel!
function classifyPartRole(part) {
  const k = normId(part.p);
  const name = (resolvePart(part.p).name || '').toLowerCase();
  if (/38340|55423|57878|2878/.test(k) || (/\b(wheel|tire|tyre|rim)\b/.test(name) && !/holder|bogie|motor|plate|brick|arch/.test(name))) {
    return 'wheel';
  }
  if (/38339|2878c/.test(k) || /wheel.*holder|bogie.*holder/.test(name)) return 'wheel_holder';
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
  if (role === 'wheel' || role === 'figure') return true;
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
// - Train wheels attach ONLY to wheel holders.
// - Upright bricks/plates/slopes/tiles connect via vertical stud footprint overlap (ovX >= 3 && ovZ >= 3),
//   NOT by grazing smooth vertical side walls (which caused floating inverted slopes & train-body bleed into bogies!).
// - Sideways contacts require either 3-axis interlocking (SNOT studs/pins/clips engaged >= 1.5 LDU)
//   or BOTH parts having sideways/SNOT/clip/hinge/window connection capability.
function boxesPhysicallyTouch(a, b, roleA, roleB, sideCapA = true, sideCapB = true) {
  const isWheelPair = (roleA === 'wheel' || roleB === 'wheel');
  const otherIsHolder = (roleA === 'wheel_holder' || roleB === 'wheel_holder');
  if (isWheelPair && otherIsHolder) {
    // Wheel clips into wheel holder pin slots (can be up to 6 LDU clearance along axle)
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

  // Fallback for any isolated wheel/detail whose axle wasn't tagged wheel_holder: connect to nearest structural/axle neighbor
  for (let i = 0; i < n; i++) {
    parts[i]._detachedGap = 0;
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
      if (bestD > 4.5) parts[i]._detachedGap = Math.round(bestD * 10) / 10;
    } else {
      parts[i]._detachedGap = Infinity;
    }
  }
  return adj;
}

function classifyMinifigPieceFast(part) {
  return classifyMinifigGroupKind(part, (pid) => resolvePart(pid).name);
}

function prepareSubdivisionData(parsed) {
  const parts = parsed.parts;
  const boxes = parts.map(p => computeWorldBox(p));
  const roles = parts.map(p => classifyPartRole(p));
  const adjacency = buildSpatialAdjacency(parts, boxes, roles);
  const inputs = parts.map((p, index) => {
    const def = resolvePart(p.p);
    const mf = classifyMinifigPieceFast(p);
    return {
      index,
      id: p.id,
      partId: normId(p.p),
      colorId: p.c,
      box: boxes[index],
      isTile: def.studs === false && def.h <= 10,
      isMinifig: mf === 'legs' || mf === 'torso' || mf === 'head',
      submodelKey: p.sub || undefined,
    };
  });
  return { boxes, roles, adjacency, inputs };
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
  } = extractMinifigureGroups(parts, boxes, (pid) => resolvePart(pid).name);

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
        targetSteps.push({
          id: `${idPrefix}_mfpose_${nm.id}_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          az: 38,
          el: 26,
          cue: 'none',
          isMinifigPoseStep: true,
          minifigPrep: {
            id: nm.id,
            name: nm.name,
            label: nm.transformLabel,
            canonicalParts: nm.canonicalParts,
            poseSummary: nm.poseSummary,
          },
          parts: nm.posedPreviewParts,
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
      const joinIndices = [
        ...resolvedSections.filter(s => s.role === 'join').flatMap(s => s.cleanRepeatGroups.flat()),
        ...leftover,
      ];

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
          });
        });
      });

      // Emit Connect & Finish chapter joining all completed sections + any center connector bricks!
      const joinSteps = [];
      const joinedPlaced = new Set();
      attachQueue.forEach((item, aIdx) => {
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
            attachVerb: aIdx === 0 ? 'Place' : 'Connect',
            canonicalParts: item.canonicalParts,
          },
        });
      });

      if (joinIndices.length > 0) {
        const { steps: connectorSteps } = buildStepsForIndexList(
          joinIndices,
          'join_conn',
          joinedPlaced,
          adaptiveMaxSpread,
        );
        joinSteps.push(...connectorSteps);
      }

      // Position / pose and place all minifigures onto the joined model in Connect & Finish
      for (const nm of normalizedMinifigs) {
        appendMinifigPlacementSteps(joinSteps, nm, 'join');
      }

      if (joinSteps.length > 0) {
        chapters.push({
          id: `ach_${++chSeq}_connect`,
          name: attachQueue.length === 2 ? 'Connect Halves & Finish' : 'Connect Sections & Finish',
          kind: 'main',
          sectionId: 'sec_connect',
          steps: joinSteps,
        });
      }

      const modCount = moduleSecs.length;
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
        curSteps.push({
          id: `ac${secIdx + 1}_mfpose_${nm.id}_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          az: 38,
          el: 26,
          cue: 'none',
          isMinifigPoseStep: true,
          minifigPrep: {
            id: nm.id,
            name: nm.name,
            label: nm.transformLabel,
            canonicalParts: nm.canonicalParts,
            poseSummary: nm.poseSummary,
          },
          parts: nm.posedPreviewParts,
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
  showMinifig1to1: false,
  showStepBorders: true,
  showPageTitle: true,
  pageNumberFormat: 'page_n', // 'number' | 'page_n' | 'n_of_total' | 'none'
  showExtras: true,
  overrides: {},           // keyed by stepId: { pin, side, corner, az, el, modelScale, pliScale, pliPos:{x,y}, calloutPos:{x,y}, calloutDir, calloutAsPages, partOffsets:{ [partId]: {x,y,z,tilt,arrow} } }
  pageInserts: {},         // keyed by pageId: [ { id, kind:'text'|'image', text, src, x, y, scale } ]
  dividerAfter: {},        // keyed by pageId: { title, note }
  coverMeta: { title:'', subtitle:'', az:38, el:26, bgSrc:null },
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
  state.coverMeta = s.coverMeta;
  if (s.completeMeta) state.completeMeta = s.completeMeta;
  state.backMeta = s.backMeta;
  state.selectedPartIds.clear();
  renderAll();
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
        ? (isPosePlacePair ? 2 : (first.subassembly || first.attachedSubmodel || first.attachedMinifig || first.parts.length >= 6 ? 1 : 2))
        : (state.layout === '1-up' ? 1 : state.layout === '2-up' ? 2 : 4);
      const slots = [];
      for (let k = 0; k < cap && i < ch.steps.length; k++) {
        const s = ch.steps[i];
        if (k > 0 && state.overrides[s.id]?.pin) break;
        if (k > 0 && (s.subassembly || s.attachedSubmodel || (s.attachedMinifig && !isPosePlacePair) || s.isMinifigPoseStep) && state.layout === 'auto') break;
        slots.push({ ch, step: s });
        i++;
        if ((s.subassembly || s.attachedSubmodel || s.attachedMinifig) && state.layout === 'auto') break;
      }
      const stepRange = slots.length === 1 ? `Step ${slots[0].step.num}` : `Steps ${slots[0].step.num}–${slots[slots.length-1].step.num}`;
      const label = isSubCh
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
    const isLand = state.paperFormat === 'screen'
      ? computePageFrameDimensions().isLandscape
      : (([wIn, hIn]) => wIn >= hIn * 1.02)(getActivePagePhysicalInches());
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
let stageRafId = 0, lastZoomText = '';
function flushStageTransform() {
  stageRafId = 0;
  const container = document.getElementById('stageContainer');
  if (!container) return;
  // Softly clamp pan so the page can't be lost completely offscreen
  const limX = Math.max(window.innerWidth * 0.75, window.innerWidth * state.zoom * 0.65);
  const limY = Math.max(window.innerHeight * 0.75, window.innerHeight * state.zoom * 0.65);
  state.panX = Math.max(-limX, Math.min(limX, state.panX));
  state.panY = Math.max(-limY, Math.min(limY, state.panY));
  container.style.transform = `translate3d(${state.panX.toFixed(2)}px, ${state.panY.toFixed(2)}px, 0) scale(${state.zoom.toFixed(4)})`;
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
  const clamped = Math.max(0.45, Math.min(3.5, nextZoom));
  if (focalX !== null && focalY !== null) {
    const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
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
  const vw = window.innerWidth, vh = window.innerHeight;
  const availW = Math.max(296, vw - 24);
  const availH = Math.max(360, vh - 170);
  if (state.paperFormat === 'screen') {
    const w = Math.min(920, availW);
    return { width: w, height: Math.min(640, availH), isLandscape: w >= Math.min(640, availH) };
  }
  const [wIn, hIn] = getActivePagePhysicalInches();
  const ratio = wIn / hIn;
  let w = availW, h = w / ratio;
  if (h > availH) { h = availH; w = h * ratio; }
  return { width: Math.round(Math.max(280, w)), height: Math.round(Math.max(200, h)), isLandscape: ratio >= 1.05 };
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
    if (fileTypeEl) { fileTypeEl.textContent = 'Import a .io or .ldr file to get started.'; fileTypeEl.classList.remove('hidden'); }
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

  // Apply Print / Screen Proportions & Density to Live Page Frame!
  const frame = document.getElementById('pageFrame');
  const dims = computePageFrameDimensions();
  const dens = DENSITY_PAD[state.density] || DENSITY_PAD.balanced;
  const padScale = Math.min(1, dims.width / 520);
  const padPx = Math.max(8, Math.round(dens.pad * padScale));
  const gapPx = Math.max(6, Math.round(dens.gap * padScale));
  frame.style.width = dims.width + 'px';
  frame.style.height = dims.height + 'px';
  frame.style.minHeight = '';
  frame.classList.remove('blueprint-grid');
  applyThemeBackgroundToElement(frame, theme);
  frame.style.color = theme.text;
  frame.innerHTML = '';

  const guideCls = (state.showPrintGuides && state.paperFormat !== 'screen') ? 'print-margin-guide' : '';

  // Render Page Contents
  if (page.kind === 'cover') {
    const cm = state.coverMeta;
    const title = cm.title || state.model.title;
    const sub = cm.subtitle || state.model.subtitle;
    const snap = renderSnapshot([], allParts, cm.az, cm.el, 680, 440, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between overflow-hidden ${guideCls}" style="padding:${padPx + 4}px;${cm.bgSrc ? `background-image:url(${cm.bgSrc});background-size:cover;background-position:center;` : ''}">
        <div class="shrink-0">
          <span class="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white mb-1.5" style="background:${theme.accent}">Building Instructions</span>
          <h1 class="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight truncate">${title}</h1>
          <p class="text-[11px] sm:text-xs mt-0.5 truncate" style="color:${theme.muted}">${sub}</p>
        </div>
        <div class="flex-1 min-h-0 flex items-center justify-center my-1.5 overflow-hidden">
          <img src="${snap.url}" alt="${title}" class="max-w-full max-h-full w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="shrink-0 flex items-center justify-between flex-wrap gap-1.5 pt-2 border-t text-[11px] font-semibold" style="border-color:${theme.pliBorder}">
          <div class="flex gap-1.5">
            <span class="px-2.5 py-0.5 rounded-full" style="background:${theme.pliBg};border:1px solid ${theme.pliBorder}">${allParts.length} Pieces</span>
            <span class="px-2.5 py-0.5 rounded-full" style="background:${theme.pliBg};border:1px solid ${theme.pliBorder}">${allSteps.length} Steps</span>
          </div>
          <span class="inline-flex items-center gap-1.5" style="color:${theme.muted}">
            <svg class="w-4 h-4 shrink-0" viewBox="0 0 64 64" fill="none" aria-hidden="true"><g transform="rotate(14 32 32)"><path d="M24.2 8.2 C9.0 15.8 7.2 31.8 14.8 40.4 L10.2 40.8 L19.6 50.4 L19.8 37.6 L17.4 39.4 C11.6 31.4 13.8 17.6 24.2 8.2 Z" fill="#38bdf8"/><path d="M32.0 4.6 C34.5 11.8 35.5 34.4 35.8 45.8 L40.5 43.9 L32.0 59.8 L23.5 43.9 L28.2 45.8 C28.5 34.4 29.5 11.8 32.0 4.6 Z" fill="#1a73e8"/><path d="M39.8 7.8 C50.4 17.6 52.0 34.2 45.2 43.4 L42.8 41.6 L42.2 54.6 L52.4 44.8 L47.8 44.3 C57.2 34.8 55.2 15.6 39.8 7.8 Z" fill="#1d48b8"/></g></svg>
            <span>Brick Instruction Creator</span>
          </span>
        </div>
      </div>`;
  } else if (page.kind === 'complete') {
    const cm = state.completeMeta;
    const snap = renderSnapshot([], allParts, cm.az, cm.el, 700, 460, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    const showText = cm.showText !== false;
    const showFw = cm.showFireworks !== false;
    frame.innerHTML = `
      <div class="relative w-full h-full text-center flex flex-col items-center justify-between overflow-hidden ${guideCls}" style="padding:${padPx + 4}px;${cm.bgSrc ? `background-image:url(${cm.bgSrc});background-size:cover;background-position:center;` : ''}">
        ${showFw ? buildFireworksSvg() : ''}
        <div class="relative z-10 shrink-0 ${showText ? '' : 'hidden'}">
          <h2 class="text-xl sm:text-3xl font-extrabold leading-tight">${escHtml(cm.title || 'Build Complete!')}</h2>
          ${cm.subtitle ? `<p class="text-[11px] sm:text-xs mt-0.5" style="color:${theme.muted}">${escHtml(cm.subtitle)}</p>` : ''}
        </div>
        <div class="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center my-1.5 overflow-hidden">
          <img src="${snap.url}" alt="Completed build" class="max-w-full max-h-full w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="relative z-10 w-full shrink-0 flex items-center justify-between text-[10px] font-medium" style="color:${theme.muted}">
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
      <div class="relative w-full h-full text-center flex flex-col items-center justify-center gap-3 overflow-hidden ${guideCls}" style="padding:${padPx + 10}px;${bm.bgSrc ? `background-image:url(${bm.bgSrc});background-size:cover;background-position:center;` : ''}">
        <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center shadow-sm" style="background:${theme.pliBg};border:1px solid ${theme.pliBorder}">
          <svg class="w-11 h-11 sm:w-14 sm:h-14" viewBox="0 0 64 64" fill="none" aria-hidden="true"><g transform="rotate(14 32 32)"><path d="M24.2 8.2 C9.0 15.8 7.2 31.8 14.8 40.4 L10.2 40.8 L19.6 50.4 L19.8 37.6 L17.4 39.4 C11.6 31.4 13.8 17.6 24.2 8.2 Z" fill="#38bdf8"/><path d="M32.0 4.6 C34.5 11.8 35.5 34.4 35.8 45.8 L40.5 43.9 L32.0 59.8 L23.5 43.9 L28.2 45.8 C28.5 34.4 29.5 11.8 32.0 4.6 Z" fill="#1a73e8"/><path d="M39.8 7.8 C50.4 17.6 52.0 34.2 45.2 43.4 L42.8 41.6 L42.2 54.6 L52.4 44.8 L47.8 44.3 C57.2 34.8 55.2 15.6 39.8 7.8 Z" fill="#1d48b8"/></g></svg>
        </div>
        <span class="text-xs sm:text-sm font-semibold" style="color:${theme.muted}">${escHtml(credit)}</span>
      </div>`;
  } else if (page.kind === 'divider') {
    const d = state.dividerAfter[page.sourcePgId] || { title:'Section Divider', note:'' };
    frame.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center text-center gap-2 ${guideCls}" style="padding:${padPx + 12}px">
        <div class="text-2xl sm:text-3xl font-extrabold">${escHtml(d.title)}</div>
        <div class="text-xs max-w-md" style="color:${theme.muted}">${escHtml(d.note || 'Switch to Edit mode to edit this divider page.')}</div>
      </div>`;
  } else if (page.kind === 'section_divider') {
    const snap = renderSnapshot([], page.previewParts || [], 38, 28, 620, 400, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between overflow-hidden ${guideCls}" style="padding:${padPx + 6}px">
        <div class="shrink-0 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <span class="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full text-white mb-1" style="background:${theme.accent}">Build Stage ${page.bagNumber || 1}</span>
            <h2 class="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight truncate">${escHtml(page.chapterName || page.label)}</h2>
          </div>
          <div class="shrink-0 flex flex-col items-end gap-1 text-[11px] font-bold">
            <span class="px-2.5 py-0.5 rounded-full" style="background:${theme.pliBg};border:1px solid ${theme.pliBorder}">${page.pieceCount || 0} pcs</span>
            <span class="text-[10px]" style="color:${theme.muted}">Steps ${page.firstStepNum}–${page.lastStepNum}</span>
          </div>
        </div>
        <div class="flex-1 min-h-0 flex items-center justify-center my-2 overflow-hidden">
          <img src="${snap.url}" alt="${escHtml(page.chapterName || 'Stage')}" class="max-w-full max-h-full w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="shrink-0 flex items-center justify-between text-[10px] font-medium" style="color:${theme.muted}">
          <span class="truncate">${state.showPageTitle ? escHtml(state.model.title) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else if (page.kind === 'submodel_page') {
    const sub = page.step.subassembly;
    const snap = renderSnapshot([], sub.buildParts, 38, 30, 620, 400, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    frame.innerHTML = `
      <div class="w-full h-full flex flex-col justify-between overflow-hidden ${guideCls}" style="padding:${padPx}px">
        <div class="shrink-0 flex items-center justify-between">
          <h2 class="text-lg font-extrabold">${escHtml(sub.name)}</h2>
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold text-white" style="background:${theme.accent}">Build ${sub.repeatCount}×</span>
        </div>
        <div class="flex-1 min-h-0 flex items-center justify-center my-1.5 overflow-hidden">
          <img src="${snap.url}" class="max-w-full max-h-full w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="shrink-0 flex justify-between text-[11px]" style="color:${theme.muted}">
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
    const imgSizeCls = cfg.density === 'compact' ? 'w-7 h-7 sm:w-9 sm:h-9' : cfg.density === 'spacious' ? 'w-12 h-12 sm:w-16 sm:h-16' : 'w-9 h-9 sm:w-11 sm:h-11';
    const qtySizeCls = cfg.density === 'compact' ? 'text-[9px]' : cfg.density === 'spacious' ? 'text-xs' : 'text-[10px]';

    frame.innerHTML = `
      <div id="bomPageTapArea" class="relative w-full h-full flex flex-col overflow-hidden cursor-pointer ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + 18}px">
        <div class="shrink-0 flex items-baseline justify-between gap-2 pb-1.5 mb-1.5 border-b" style="border-color:${theme.pliBorder}">
          <div class="flex items-baseline gap-2 min-w-0">
            <h2 class="text-sm sm:text-base font-bold truncate">Parts List</h2>
            ${page.bomPageCount > 1 ? `<span class="text-[10px] font-semibold opacity-70 shrink-0">${page.bomPageIdx + 1} / ${page.bomPageCount}</span>` : ''}
          </div>
          <span class="text-[10px] sm:text-[11px] shrink-0" style="color:${theme.muted}">${page.bomTotalPieces} pcs · ${page.bomTotalUnique} unique</span>
        </div>
        <div class="relative flex-1 min-h-0 w-full">
          ${cells.map(({ item, xFrac, yFrac, wFrac, hFrac }) => {
            const { part, qty, meta } = item;
            const thumb = getPliThumb(part);
            return `<div class="absolute p-0.5 flex flex-col items-center justify-center text-center overflow-hidden" style="left:${(xFrac*100).toFixed(4)}%;top:${(yFrac*100).toFixed(4)}%;width:${(wFrac*100).toFixed(4)}%;height:${(hFrac*100).toFixed(4)}%;background:transparent">
              <div class="flex-1 min-h-0 w-full flex items-center justify-center">
                <img src="${thumb}" alt="${escHtml(meta.name)}" class="max-w-full max-h-full ${imgSizeCls} object-contain pointer-events-none" />
              </div>
              <div class="shrink-0 leading-tight font-extrabold ${qtySizeCls}">${qty}×</div>
              ${cfg.showNames ? `<div class="shrink-0 text-[8px] sm:text-[9px] font-medium truncate w-full px-0.5 opacity-80" title="${escHtml(meta.name)}">${escHtml(meta.name)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>
        <div class="absolute bottom-1.5 left-3.5 right-3.5 flex justify-between text-[10px] font-medium pointer-events-none" style="color:${theme.muted}">
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
    const effectivePageHIn = state.paperFormat === 'screen'
      ? (dims.isLandscape ? 8.5 : 11)
      : getActivePagePhysicalInches()[1];
    const slotCols = slots.length === 1 ? 1 : slots.length === 2 ? (dims.isLandscape ? 2 : 1) : 2;
    const slotRows = Math.ceil(slots.length / slotCols);
    const estSlotW = Math.max(120, (dims.width - padPx * 2 - gapPx * (slotCols - 1)) / slotCols);
    const estSlotH = Math.max(120, (dims.height - padPx * 2 - 22 - gapPx * (slotRows - 1)) / slotRows);

    const slotData = slots.map(({ ch, step }) => {
      const prev = getPreviousPartsForStep(state.model, ch, step);
      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const modelScale = ov.modelScale || 1.0;
      const opts = {
        highlightNew: state.highlightNew, highlightColor: state.highlightColor,
        fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity,
        showArrows: true, accent: theme.accent, ov,
        partOffsets: ov.partOffsets || {},
        selectedPartIds: state.mode === 'select' && state.selectedStepId === step.id ? state.selectedPartIds : null,
      };
      const rw = slots.length === 1 ? 680 : 440, rh = slots.length === 1 ? 440 : 320;
      const snap = renderSnapshot(prev, step.parts, cam.az, cam.el, rw, rh, modelScale, opts);
      currentSlotRenderInfo.set(step.id, { ch, step, prev, cam, ov, snap, modelScale });

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
            38, 26, 120, 120,
          )
        : null;
      const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
      const mf1to1 = (state.showMinifig1to1 && isMfBuild)
        ? renderMinifigOneToOne(step.parts, dims.height, effectivePageHIn, Math.round(estSlotW * 0.36), Math.round(estSlotH * 0.66), theme.accent)
        : null;

      // Group PLI items + detect 1:1 Actual-Size Guides (skip individual bricks when attaching a pre-built submodel or minifigure!)
      const pliMap = new Map();
      if (!step.attachedSubmodel && !step.attachedMinifig && !step.minifigPrep) {
        for (const p of step.parts) {
          const k = `${p.p}:${p.c}`;
          if (!pliMap.has(k)) pliMap.set(k, { part: p, ids: [], qty: 0, guide: getActualSizeGuide(p.p) });
          const item = pliMap.get(k);
          item.qty++; item.ids.push(p.id);
        }
      }
      return { ch, step, prev, cam, ov, snap, subImg, attSubImg, mfPrepImg, attMfImg, mf1to1, pli: Array.from(pliMap.values()) };
    });

    const isRotateMode = state.mode === 'rotate';
    const isArrangeMode = state.mode === 'arrange';
    const isTightSlot = dims.height < 360 || slots.length >= 4 || (slots.length === 2 && !dims.isLandscape && dims.height < 460);
    const pgNumText = formatPageNumber(page.num, state.pages.length);

    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col overflow-hidden ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + 18}px">
        ${page.submodelIntro ? `
          <div class="shrink-0 mb-2 px-3 py-1.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs overflow-hidden" style="background:${theme.calloutBg};border:1.5px solid ${theme.calloutBorder}">
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <img src="${subIntroImg}" alt="${escHtml(page.submodelIntro.name)}" class="w-14 h-11 sm:w-20 sm:h-14 object-contain shrink-0 pointer-events-none" />
              <div class="min-w-0 flex-1 overflow-hidden">
                <div class="text-[9px] font-bold uppercase tracking-wider opacity-65 truncate">${page.submodelIntro.isSectionModule ? 'Build Section' : 'Submodel'}</div>
                <div class="text-xs sm:text-sm font-extrabold truncate">${escHtml(page.submodelIntro.name)}</div>
              </div>
            </div>
            <span class="shrink-0 px-3 py-1 rounded-full text-xs sm:text-sm font-black text-white shadow-xs" style="background:${theme.accent}">${page.submodelIntro.repeatCount > 1 ? `×${page.submodelIntro.repeatCount}` : `${page.submodelIntro.pieceCount || page.submodelIntro.canonicalParts.length} pcs`}</span>
          </div>` : ''}
        <div class="grid ${gridCls} flex-1 min-h-0" style="gap:${gapPx}px">
          ${slotData.map(({ step, ov, snap, subImg, attSubImg, mfPrepImg, attMfImg, mf1to1, pli }) => {
            const isSelStep = state.selectedStepId === step.id;
            const showLive3D = isRotateMode && isSelStep;
            const pliScale = ov.pliScale || (isTightSlot ? 0.86 : 1.0);
            const pliPos = ov.pliPos || { x: 0, y: 0 };
            const calloutPos = ov.calloutPos || { x: 0, y: 0 };
            const calloutSel = isArrangeMode && state.selectedArrangeEl?.stepId === step.id && state.selectedArrangeEl?.kind === 'callout';
            const pliSel = isArrangeMode && state.selectedArrangeEl?.stepId === step.id && state.selectedArrangeEl?.kind === 'pli';
            const slotBorderStyle = state.showStepBorders
              ? (isSelStep && state.mode !== 'pan' ? `2px solid ${theme.accent}` : `1px solid ${theme.pliBorder}`)
              : (isSelStep && state.mode !== 'pan' && slots.length > 1 ? `1.5px dashed ${theme.accent}` : '1px solid transparent');
            const slotBgStyle = state.showStepBorders ? 'rgba(255,255,255,0.05)' : 'transparent';

            const pliPadCls = isTightSlot ? 'gap-1.5 px-1.5 py-1' : 'gap-2 px-2 py-1';
            const calloutPliScale = ov.pliScale || 1.0;
            const calloutPliStyle = `background:${theme.calloutBg};border:${pliSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${calloutPliScale});transform-origin:top left;`;
            const renderCalloutPli = (imgSrc, imgCls, topText, topCls, nameText) => `
              <div data-drag="pli" data-step="${step.id}" title="${escHtml(`${topText} — ${nameText}`)}" class="draggable-el flex items-center ${pliPadCls} rounded-xl shadow-xs w-fit max-w-full min-w-0 overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="${calloutPliStyle}">
                <img src="${imgSrc}" alt="${escHtml(nameText)}" class="${imgCls} shrink-0 object-contain pointer-events-none" />
                <div class="min-w-0 flex-1 overflow-hidden leading-tight">
                  <div class="${topCls} truncate" style="color:${theme.accent}">${escHtml(topText)}</div>
                  <div class="text-[9px] font-semibold opacity-75 truncate">${escHtml(nameText)}</div>
                </div>
              </div>`;

            const pliBoxHtml = step.attachedSubmodel
              ? renderCalloutPli(
                  attSubImg,
                  isTightSlot ? 'w-7 h-5' : 'w-11 h-8',
                  step.attachedSubmodel.isSectionAttach ? (step.attachedSubmodel.attachVerb || 'Connect') : `×${step.attachedSubmodel.repeatCount}`,
                  'text-xs font-black',
                  step.attachedSubmodel.name || 'Submodel',
                )
              : step.minifigPrep
              ? renderCalloutPli(
                  mfPrepImg,
                  isTightSlot ? 'w-6 h-6' : 'w-9 h-9',
                  step.minifigPrep.label || 'Position',
                  'text-[10px] font-extrabold',
                  step.minifigPrep.name || 'Minifigure',
                )
              : step.attachedMinifig
              ? renderCalloutPli(
                  attMfImg,
                  isTightSlot ? 'w-6 h-6' : 'w-9 h-9',
                  `×${step.attachedMinifig.repeatCount || 1}`,
                  'text-xs font-black',
                  step.attachedMinifig.name || 'Minifigure',
                )
              : (!step.subassembly || ov.calloutAsPages ? `
                <div data-drag="pli" data-step="${step.id}" class="draggable-el flex items-center gap-1.5 px-1.5 py-0.5 rounded-xl flex-wrap shadow-xs w-fit max-w-full min-w-0 ${isArrangeMode ? 'cursor-move' : ''}" style="background:${theme.pliBg};border:${pliSel ? `2px solid ${theme.accent}` : `1px solid ${theme.pliBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${pliScale});transform-origin:top left;">
                  ${pli.slice(0, 7).map(item => {
                    const anySel = state.mode === 'select' && item.ids.some(id => state.selectedPartIds.has(id));
                    const thumb = getPliThumb(item.part);
                    return `<button type="button" data-pli-ids="${item.ids.join(',')}" data-step="${step.id}" class="pli-chip flex flex-col items-center px-0.5 py-0.5 rounded-lg transition ${anySel ? 'ring-2 ring-[#1a73e8] bg-[#1a73e8]/15' : ''}" title="${escHtml(resolvePart(item.part.p).name)}">
                      <div class="flex items-center gap-0.5 text-[11px] font-bold">
                        <img src="${thumb}" class="${isTightSlot ? 'w-5 h-5' : 'w-7 h-7'} shrink-0 object-contain pointer-events-none" />
                        <span>${item.qty}×</span>
                      </div>
                      ${state.showSizeGuides && item.guide ? `
                        <div class="flex items-center gap-1 text-[8px] font-extrabold px-1 rounded-full bg-black/10 dark:bg-white/15">
                          <span class="inline-block h-1 rounded-full bg-current" style="width:${Math.min(28, item.guide.lengthL * 3.5)}px"></span>
                          <span>1:1 ${item.guide.lengthL}L</span>
                        </div>` : ''}
                    </button>`;
                  }).join('')}
                </div>` : '');

            const headerBadgesHtml = [
              step.minifigPrep ? `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-[#202124] shadow-xs whitespace-nowrap max-w-full truncate" style="border:1.5px solid ${theme.accent}">↻ Prepare</span>` : '',
              state.showRotCues && step.cue && step.cue !== 'none' ? `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-[#202124] shadow-xs whitespace-nowrap max-w-full truncate" style="border:1.5px solid ${theme.accent}">↻ ${step.cue === 'flip_vertical' ? 'Flip Over' : step.cue === 'yaw_180' ? 'Turn 180°' : 'Rotate 90°'}</span>` : '',
            ].filter(Boolean).join('');
            const stackHeaderBadges = Boolean(headerBadgesHtml) && (isTightSlot || estSlotW < 280);

            return `
              <div data-step="${step.id}" class="step-slot relative rounded-xl p-2 flex flex-col min-h-0 overflow-hidden transition" style="border:${slotBorderStyle};background:${slotBgStyle}">
                <!-- Step Number & Draggable Parts List Box -->
                ${(() => {
                  const pinBadgeHtml = ov.pin
                    ? `<span class="no-print inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1a73e8]/15 text-[#1a73e8] shrink-0 whitespace-nowrap" title="Pinned page break: Step ${step.num} always starts a new page so earlier edits won't shift later pages"><svg class="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg><span>Page Break</span></span>`
                    : '';
                  return stackHeaderBadges ? `
                <div class="relative z-10 shrink-0 flex flex-col gap-1 min-w-0">
                  <div class="flex items-center justify-between gap-1 min-w-0">
                    <div class="flex items-center gap-1 min-w-0 shrink-0">
                      <span class="${isTightSlot ? 'text-lg' : 'text-2xl'} font-extrabold leading-none shrink-0">${step.num}</span>
                      ${pinBadgeHtml}
                    </div>
                    <div class="flex items-center gap-1 min-w-0 max-w-[75%] justify-end">${headerBadgesHtml}</div>
                  </div>
                  ${pliBoxHtml ? `<div class="min-w-0 max-w-full">${pliBoxHtml}</div>` : ''}
                </div>` : `
                <div class="relative z-10 shrink-0 flex items-start justify-between gap-1.5 min-w-0">
                  <div class="flex items-start gap-1.5 flex-wrap min-w-0 flex-1">
                    <span class="${isTightSlot ? 'text-lg' : 'text-2xl'} font-extrabold leading-none shrink-0">${step.num}</span>
                    ${pinBadgeHtml}
                    ${pliBoxHtml}
                  </div>
                  ${headerBadgesHtml ? `<div class="flex items-center gap-1 shrink-0 flex-wrap justify-end max-w-[45%]">${headerBadgesHtml}</div>` : ''}
                </div>`;
                })()}

                <!-- Step Visual Area (Callout + 3D Render + Optional 1:1 Minifig Card — STRICT min-h-0 so NEVER clipped!) -->
                <div class="flex-1 min-h-0 flex ${ov.calloutDir === 'vertical' ? 'flex-col' : 'flex-row'} items-center justify-center gap-1.5 mt-1 overflow-hidden">
                  ${step.subassembly && !ov.calloutAsPages ? `
                    <div data-drag="callout" data-step="${step.id}" class="draggable-el rounded-xl p-1.5 shrink-0 w-28 sm:w-40 ${ov.calloutDir === 'vertical' ? 'max-w-full' : 'max-w-[48%]'} max-h-full flex flex-col overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="background:${theme.calloutBg};border:${calloutSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${calloutPos.x}px,${calloutPos.y}px)">
                      <div class="flex items-center justify-between gap-1 text-[10px] font-bold shrink-0 min-w-0">
                        <span class="min-w-0 truncate">${escHtml(step.subassembly.name)}</span>
                        <span class="px-1.5 py-0.5 rounded-full text-white shrink-0" style="background:${theme.accent}">${step.subassembly.repeatCount}×</span>
                      </div>
                      <img src="${subImg}" class="w-full flex-1 min-h-0 object-contain pointer-events-none" />
                    </div>` : ''}

                  <div class="flex-1 min-w-0 min-h-0 w-full h-full flex items-center justify-center relative overflow-hidden">
                    ${showLive3D
                      ? `<canvas id="liveRotateCanvas" class="w-full h-full object-contain cursor-grab active:cursor-grabbing"></canvas>`
                      : `<img data-pick-step="${step.id}" src="${snap.url}" class="step-render-img max-w-full max-h-full w-full h-full object-contain ${state.mode === 'select' ? 'cursor-crosshair' : 'pointer-events-none'}" />`
                    }
                    ${step.isSubmodelFinal ? `<span class="absolute bottom-1.5 right-1.5 px-3 py-1 rounded-full text-sm sm:text-base font-black text-white shadow-md pointer-events-none" style="background:${theme.accent}">×${step.submodelRepeat || 2}</span>` : ''}
                  </div>

                  ${mf1to1 ? `
                    <div class="shrink-0 max-w-[45%] rounded-xl px-2 py-1.5 flex flex-col items-center justify-center gap-1 max-h-full overflow-hidden shadow-xs" style="background:${theme.calloutBg};border:1.5px solid ${theme.calloutBorder}" title="Actual-size 1:1 minifigure reference (${Math.round(mf1to1.heightMm)} mm tall)">
                      <div class="flex items-center gap-1 text-[9px] font-extrabold leading-none max-w-full overflow-hidden whitespace-nowrap">
                        <span class="px-1.5 py-0.5 rounded-full text-white shrink-0" style="background:${theme.accent}">1:1${mf1to1.isExact ? '' : ' · Fit'}</span>
                        <span class="opacity-75 tabular-nums truncate">${Math.round(mf1to1.heightMm)} mm</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <img src="${mf1to1.url}" alt="1:1 actual size minifigure" style="width:${mf1to1.displayPxW}px;height:${mf1to1.displayPxH}px" class="block shrink-0 pointer-events-none" />
                        <div class="flex flex-col items-center justify-between opacity-55" style="height:${Math.max(24, Math.round(mf1to1.displayPxH * 0.92))}px">
                          <span class="w-1.5 h-[1.5px] bg-current"></span>
                          <span class="w-[1.5px] flex-1 bg-current"></span>
                          <span class="w-1.5 h-[1.5px] bg-current"></span>
                        </div>
                      </div>
                    </div>` : ''}
                </div>
              </div>`;
          }).join('')}
        </div>

        <!-- Custom Page Inserts (Text Notes & Images — Draggable in Arrange Mode!) -->
        ${(state.pageInserts[page.id] || []).map(ins => {
          const isInsSel = isArrangeMode && state.selectedArrangeEl?.kind === 'insert' && state.selectedArrangeEl?.insertId === ins.id;
          return `<div data-drag="insert" data-insert-id="${ins.id}" class="draggable-el absolute z-20 rounded-xl p-2 ${isArrangeMode ? 'cursor-move' : ''}" style="left:${ins.x}px;top:${ins.y}px;transform:scale(${ins.scale || 1});transform-origin:top left;border:${isInsSel ? `2px solid ${theme.accent}` : '1px solid transparent'};background:${ins.kind === 'text' ? theme.pliBg : 'transparent'}">
            ${ins.kind === 'text'
              ? `<div class="text-xs font-bold max-w-[200px] leading-snug break-words overflow-hidden">${escHtml(ins.text)}</div>`
              : `<img src="${ins.src}" class="w-24 h-24 object-contain rounded-lg pointer-events-none" />`}
          </div>`;
        }).join('')}

        <!-- Page Footer -->
        <div class="absolute bottom-1.5 left-3.5 right-3.5 flex justify-between text-[10px] font-medium pointer-events-none" style="color:${theme.muted}">
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
        const pOv = ov.partOffsets?.[p.id] || {};
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
        const dx = (e.clientX - sx) / state.zoom, dy = (e.clientY - sy) / state.zoom;
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
    const meta = isCover ? state.coverMeta : isComplete ? state.completeMeta : state.backMeta;
    const label = isCover ? 'Cover Page' : isComplete ? 'Build Complete Page' : 'Back Cover';
    const defaultTitle = isCover ? state.model.title : 'Build Complete!';
    const backCredit = (!meta.subtitle || meta.subtitle === 'Created with Brick Instruction Creator')
      ? 'Made with Brick Instruction Creator'
      : meta.subtitle;
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
    box.querySelector('#covBgBtn').onclick = () => document.getElementById('coverImageInput').click();
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
    const pOv = ov.partOffsets?.[firstId] || { x:0, y:0, z:0, tilt:0, arrow:true };
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
        const cur = po[id] || { x:0, y:0, z:0, tilt:0, arrow:true };
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
        const cur = po[id] || { x:0, y:0, z:0, tilt:0, arrow:true };
        po[id] = { ...cur, arrow: nextVal };
      }
      state.overrides[step.id] = { ...curOv, partOffsets: po };
      renderAll();
    };
    box.querySelector('#btnResetSelPos').onclick = () => {
      pushUndo();
      const curOv = state.overrides[step.id] || {};
      const po = { ...(curOv.partOffsets || {}) };
      for (const id of state.selectedPartIds) delete po[id];
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
      if (step.parts.length === 0) ch.steps.splice(ch.steps.indexOf(step), 1);
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
    const isFront34 = Math.abs(cam.az - MINIFIG_BUILD_CAMERA.az) <= 4 && Math.abs(cam.el - MINIFIG_BUILD_CAMERA.el) <= 4;
    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-3xl p-3 w-full space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="font-bold">Step ${step.num} · Drag 3D to orbit</span>
          <div class="flex items-center gap-1 flex-wrap">
            <button id="camTop" class="px-2 py-1 rounded-full font-semibold ${cam.side === 'top' ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">Top</button>
            <button id="camBot" class="px-2 py-1 rounded-full font-semibold ${cam.side === 'bottom' ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">Bottom</button>
            ${isMfBuild ? `<button id="btnToggleMf1to1Quick" class="px-2.5 py-1 rounded-full font-semibold ${state.showMinifig1to1 ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">1:1 View</button>` : ''}
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
            ${isMfBuild ? `<button id="btnMfFront34" class="px-2.5 py-1 rounded-full text-[11px] font-semibold ${isFront34 ? 'bg-[#1a73e8]/15 text-[#1a73e8] ring-1 ring-[#1a73e8]' : 'bg-black/5 dark:bg-white/10'}">Front 3/4</button>` : ''}
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
      mf34Btn.onclick = () => setCam({ side: 'top', corner: 'front_right', az: MINIFIG_BUILD_CAMERA.az, el: MINIFIG_BUILD_CAMERA.el });
    }
    const mf1to1Btn = box.querySelector('#btnToggleMf1to1Quick');
    if (mf1to1Btn) {
      mf1to1Btn.onclick = () => { state.showMinifig1to1 = !state.showMinifig1to1; renderAll(); };
    }
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
    const isPinned = Boolean(ov.pin);
    const slotIdx = (page.slots || []).findIndex(s => s.step.id === step.id);
    const pinBtnLabel = isPinned
      ? 'Page Break Pinned'
      : (slotIdx > 0 ? `Start New Page at Step ${step.num}` : 'Pin Page Break');
    const pinBtnTitle = isPinned
      ? `Remove pinned page break before Step ${step.num}`
      : (slotIdx > 0
        ? `Move Step ${step.num} to the start of a new page and keep it anchored there`
        : `Keep Step ${step.num} at the start of a new page so earlier edits won't shift later pages`);
    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-3xl p-3 w-full space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="font-bold">Drag boxes on the page to arrange</span>
          <div class="flex items-center gap-1">
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
            <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>
            <span>${pinBtnLabel}</span>
          </button>
          ${hasSub ? `<button id="btnToggleCallout" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">${ov.calloutAsPages ? 'Convert to Callout Box' : 'Convert to Full Page'}</button>` : ''}
          ${hasSub && !ov.calloutAsPages ? `<button id="btnCalloutDir" class="px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 font-semibold">${ov.calloutDir === 'vertical' ? 'Side-by-Side' : 'Stack Vertically'}</button>` : ''}
          ${state.selectedArrangeEl?.kind === 'insert' ? `<button id="btnDelInsert" class="px-2.5 py-1.5 rounded-full bg-red-500/15 text-red-600 font-semibold">Delete Selected</button>` : ''}
        </div>
      </div>`;

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
      pushUndo();
      const nextOv = { ...(state.overrides[step.id] || {}) };
      const nextPinned = !isPinned;
      if (nextPinned) nextOv.pin = true;
      else delete nextOv.pin;
      state.overrides[step.id] = nextOv;
      rebuildPages();
      const targetIdx = state.pages.findIndex(pg => pg.slots?.some(sl => sl.step.id === step.id));
      if (targetIdx >= 0) state.pageIdx = targetIdx;
      const targetPg = state.pages[state.pageIdx];
      renderAll();
      if (nextPinned) {
        showToast(slotIdx > 0 && targetPg
          ? `Step ${step.num} now starts a new page (Page ${targetPg.num}).`
          : `Pinned page break before Step ${step.num} — earlier edits won't shift later pages.`);
      } else {
        showToast(`Removed page break before Step ${step.num} — pages can reflow freely.`);
      }
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

  const pinSvg = '<svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>';

  let pinnedCount = 0;
  for (const pg of state.pages) {
    const fs = pg.slots?.[0]?.step;
    if (fs && state.overrides[fs.id]?.pin) pinnedCount++;
  }

  const clearBtn = document.getElementById('btnClearAllPins');
  if (clearBtn) {
    if (pinnedCount > 0) {
      clearBtn.textContent = `Clear ${pinnedCount}`;
      clearBtn.title = `Remove all ${pinnedCount} pinned page break${pinnedCount === 1 ? '' : 's'}`;
      clearBtn.classList.remove('hidden');
      clearBtn.onclick = () => {
        pushUndo();
        for (const sid of Object.keys(state.overrides)) {
          if (state.overrides[sid]?.pin) {
            const nextOv = { ...state.overrides[sid] };
            delete nextOv.pin;
            state.overrides[sid] = nextOv;
          }
        }
        renderAll();
        renderOverviewModal();
        showToast('Cleared all pinned page breaks — pages can reflow freely.');
      };
    } else {
      clearBtn.classList.add('hidden');
      clearBtn.onclick = null;
    }
  }

  state.pages.forEach((pg, idx) => {
    const active = idx === state.pageIdx;
    const firstStep = pg.slots?.[0]?.step;
    const pinned = Boolean(firstStep && state.overrides[firstStep.id]?.pin);

    if (pinned && firstStep) {
      const divider = document.createElement('div');
      divider.className = 'flex items-center gap-2 px-2 pt-1 text-[10px] font-bold text-[#1a73e8] select-none';
      divider.innerHTML = `
        <div class="flex-1 border-t border-dashed border-[#1a73e8]/55"></div>
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          ${pinSvg}
          <span>Page Break · Step ${firstStep.num} always starts a new page</span>
        </span>
        <div class="flex-1 border-t border-dashed border-[#1a73e8]/55"></div>`;
      list.appendChild(divider);
    }

    const row = document.createElement('div');
    if (active) row.dataset.active = 'true';
    row.className = `flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border cursor-pointer transition ${active ? 'border-[#1a73e8] bg-[#1a73e8]/10' : 'border-[var(--border)] bg-[var(--background)]'}`;

    const stepRange = pg.slots?.length
      ? (pg.slots.length === 1 ? `Step ${pg.slots[0].step.num}` : `Steps ${pg.slots[0].step.num}–${pg.slots[pg.slots.length - 1].step.num}`)
      : null;
    const primaryLabel = stepRange ? `Page ${pg.num} · ${stepRange}` : `Page ${pg.num} · ${pg.label}`;
    const showChapterSub = Boolean(pg.chapterName && (stepRange || pg.chapterName !== pg.label));
    const pinTitle = firstStep
      ? (pinned
        ? `Remove pinned page break before Step ${firstStep.num}`
        : `Keep Step ${firstStep.num} at the start of a new page so earlier edits won't shift later pages`)
      : '';

    row.innerHTML = `
      <div class="min-w-0">
        <div class="font-bold truncate">${escHtml(primaryLabel)}</div>
        ${showChapterSub ? `<div class="text-[11px] text-[var(--muted-foreground)] truncate">${escHtml(pg.chapterName)}</div>` : ''}
      </div>
      <div class="flex items-center gap-1 shrink-0">
        ${firstStep ? `<button type="button" title="${escHtml(pinTitle)}" aria-pressed="${pinned ? 'true' : 'false'}" class="ov-pin px-2.5 py-1 rounded-full text-[11px] font-semibold border inline-flex items-center gap-1 transition ${pinned ? 'bg-[#1a73e8] text-white border-transparent' : 'border-[var(--border)] bg-[var(--card)] hover:border-[#1a73e8]/60'}">${pinSvg}<span>${pinned ? 'Pinned' : 'Pin Break'}</span></button>` : ''}
      </div>`;
    row.onclick = () => {
      state.pageIdx = idx;
      if (firstStep) state.selectedStepId = firstStep.id;
      state.selectedPartIds.clear();
      document.getElementById('overviewModal').classList.add('hidden');
      resetZoom();
      renderAll();
    };
    const pinBtn = row.querySelector('.ov-pin');
    if (pinBtn) {
      pinBtn.onclick = (e) => {
        e.stopPropagation();
        pushUndo();
        const nextOv = { ...(state.overrides[firstStep.id] || {}) };
        if (pinned) delete nextOv.pin;
        else nextOv.pin = true;
        state.overrides[firstStep.id] = nextOv;
        renderAll();
        renderOverviewModal();
        showToast(pinned
          ? `Removed page break before Step ${firstStep.num} — pages can reflow freely.`
          : `Pinned page break before Step ${firstStep.num} — earlier edits won't shift later pages.`);
      };
    }
    list.appendChild(row);
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
      const nextZoom = Math.max(0.45, Math.min(3.5, startZoom * (dist / startDist)));
      const cx = window.innerWidth / 2, cy = window.innerHeight / 2;
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
  const tLine = lines.find(l => l.startsWith('0 ') && !/^0\s+(FILE|Name:|Author:|IsSubModel|BL_|Flexible|Render|IsAssembly|!|BFC)/i.test(l));
  if (tLine) userLibTitles.set(k, tLine.replace(/^0\s+/, '').trim());
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
          if (name.toLowerCase().endsWith('.dat') && !(flags & 1)) {
            datEntries.push({ name, flags, method, compSize, localOffset });
          }
          ptr += 46 + nameLen + extraLen + commentLen;
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
    embeddedDatCompiled.clear(); pliThumbCache.clear(); submodelThumbCache.clear();
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
    if (/^(stud|stud2|stud2a|stud3|stud4|stud4a|stud10|stud15|studp01|axlehol|npeghol|beamhol|rect|\d+-\d+(cyli|cylo|cylc|disc|edge|ring\d+|chrd|ndis))$/.test(base)) return;
    // If already loaded as a real .dat (not a virtual synthesis), walk its nested type-1 subparts so partial shortcuts still fetch missing children!
    const existing = lookupEmbeddedDat(k, false);
    if (existing) {
      if (!visitedLoaded.has(existing.key)) {
        visitedLoaded.add(existing.key);
        for (const line of existing.lines) {
          const tr = line.trim();
          if (tr.startsWith('1 ')) {
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
            if (tr.startsWith('1 ')) {
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

    embeddedDatCompiled.clear(); pliThumbCache.clear(); submodelThumbCache.clear();
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
let errFilter = 'all', errorBannerTimer = null;

function computeModelDiagnostics() {
  const diags = [];
  if (!state.model) { state.diagnostics = []; updateErrorIndicators(); return; }
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
            ? `Part "${p.p}" in Step ${step.num} had no nearby pieces touching it and was placed on its own.`
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
      title: `Unknown LDraw color #${rec.colorId} (${rec.count}×)`,
      detail: `Color ID ${rec.colorId} is not in the color palette and fell back to Light Bluish Gray. First seen in Step ${stepArr[0]}.`,
      stepNum: stepArr[0],
      stepId: firstStep?.id || null,
    });
  }

  state.diagnostics = diags;
  updateErrorIndicators();
  const errModalEl = document.getElementById('errorsModal');
  if (errModalEl && !errModalEl.classList.contains('hidden')) renderErrorsModal();
}

function updateErrorIndicators() {
  const n = state.diagnostics.length;
  const menuDot = document.getElementById('menuBtnErrorBadge');
  const menuPill = document.getElementById('menuErrorCountBadge');
  if (menuDot) {
    menuDot.textContent = n > 99 ? '99+' : String(n);
    menuDot.classList.toggle('hidden', n === 0);
  }
  if (menuPill) {
    menuPill.textContent = String(n);
    menuPill.className = n > 0
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
      showSizeGuides: state.showSizeGuides, showMinifig1to1: state.showMinifig1to1, showStepBorders: state.showStepBorders,
      showPageTitle: state.showPageTitle, pageNumberFormat: state.pageNumberFormat,
      showExtras: state.showExtras, bomConfig: state.bomConfig,
      overrides: state.overrides, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter,
      coverMeta: state.coverMeta, completeMeta: state.completeMeta, backMeta: state.backMeta, pageIdx: state.pageIdx,
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
    if (typeof prefs.showMinifig1to1 === 'boolean') state.showMinifig1to1 = prefs.showMinifig1to1;
    if (typeof prefs.showStepBorders === 'boolean') state.showStepBorders = prefs.showStepBorders;
    if (typeof prefs.showPageTitle === 'boolean') state.showPageTitle = prefs.showPageTitle;
    if (prefs.pageNumberFormat) state.pageNumberFormat = prefs.pageNumberFormat;
    if (typeof prefs.showExtras === 'boolean') state.showExtras = prefs.showExtras;
    if (prefs.bomConfig) state.bomConfig = { ...state.bomConfig, ...prefs.bomConfig };

    if (rec.kind === 'io' && rec.data) {
      const { m1Text, m2Text } = await extractIoArchive(rec.data);
      const parsed = parseImportedModel(m1Text, m2Text, rec.fileName);
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto', rec.subdivisionPlan || null);
    } else if (rec.kind === 'ldr' && typeof rec.data === 'string') {
      const parsed = parseImportedModel(rec.data, '', rec.fileName);
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto', rec.subdivisionPlan || null);
    } else {
      renderAll(); return;
    }

    lastSourceRecord = rec;
    state.overrides = prefs.overrides || {};
    state.pageInserts = prefs.pageInserts || {};
    state.dividerAfter = prefs.dividerAfter || {};
    if (prefs.coverMeta) state.coverMeta = { ...state.coverMeta, ...prefs.coverMeta };
    if (prefs.completeMeta) state.completeMeta = { ...state.completeMeta, ...prefs.completeMeta };
    if (prefs.backMeta) state.backMeta = { ...state.backMeta, ...prefs.backMeta };
    state.pageIdx = Math.max(0, prefs.pageIdx || 0);
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
    if (state.diagnostics.length > 0) showImportErrorBanner();
  } catch (_) {
    renderAll();
  }
}

// =========================================================================
// 12. PURE-JS MULTI-PAGE PDF 1.4 GENERATOR (Zero External Dependencies!)
// =========================================================================
function getPdfPaperPts() {
  const [wIn, hIn] = getActivePagePhysicalInches();
  return [Math.round(wIn * 72), Math.round(hIn * 72)];
}

function buildPdfBinary(jpegPages, pageWpt, pageHpt) {
  const enc = (s) => new TextEncoder().encode(s);
  const chunks = [];
  let offset = 0;
  const push = (u8) => { chunks.push(u8); offset += u8.length; };
  const pushStr = (s) => push(enc(s));

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');
  const offsets = [0]; // 1-indexed object offsets

  // Obj 1: Catalog, Obj 2: Pages
  const pageObjNums = [];
  const startObj = 3;
  // Each page uses 3 objects: Page, Image XObject, Content Stream
  for (let i = 0; i < jpegPages.length; i++) pageObjNums.push(startObj + i * 3);

  offsets.push(offset);
  pushStr(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`);

  offsets.push(offset);
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map(n => n + ' 0 R').join(' ')}] /Count ${pageObjNums.length} >>\nendobj\n`);

  for (let i = 0; i < jpegPages.length; i++) {
    const pgObj = startObj + i * 3;
    const imgObj = pgObj + 1;
    const cntObj = pgObj + 2;
    const { bytes, pxW, pxH } = jpegPages[i];

    offsets.push(offset);
    pushStr(`${pgObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWpt} ${pageHpt}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${cntObj} 0 R >>\nendobj\n`);

    offsets.push(offset);
    pushStr(`${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);
    push(bytes);
    pushStr(`\nendstream\nendobj\n`);

    const contentStr = `q ${pageWpt} 0 0 ${pageHpt} 0 0 cm /Im0 Do Q\n`;
    offsets.push(offset);
    pushStr(`${cntObj} 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}endstream\nendobj\n`);
  }

  const xrefPos = offset;
  pushStr(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let i = 1; i < offsets.length; i++) {
    pushStr(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }
  pushStr(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`);

  const out = new Uint8Array(offset);
  let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}

function loadImgPromise(src) {
  return new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = src; });
}

function drawContain(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height || w <= 2 || h <= 2) return;
  const sc = Math.min(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

function drawBrandLogoCanvas(ctx, x, y, size) {
  if (typeof Path2D === 'undefined') return;
  const logoPaths = [
    ['M24.2 8.2 C9.0 15.8 7.2 31.8 14.8 40.4 L10.2 40.8 L19.6 50.4 L19.8 37.6 L17.4 39.4 C11.6 31.4 13.8 17.6 24.2 8.2 Z', '#38bdf8'],
    ['M32.0 4.6 C34.5 11.8 35.5 34.4 35.8 45.8 L40.5 43.9 L32.0 59.8 L23.5 43.9 L28.2 45.8 C28.5 34.4 29.5 11.8 32.0 4.6 Z', '#1a73e8'],
    ['M39.8 7.8 C50.4 17.6 52.0 34.2 45.2 43.4 L42.8 41.6 L42.2 54.6 L52.4 44.8 L47.8 44.3 C57.2 34.8 55.2 15.6 39.8 7.8 Z', '#1d48b8'],
  ];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.translate(32, 32);
  ctx.rotate((14 * Math.PI) / 180);
  ctx.translate(-32, -32);
  for (const [d, col] of logoPaths) { ctx.fillStyle = col; ctx.fill(new Path2D(d)); }
  ctx.restore();
}

async function renderPageToJpegBytes(page, pxW, pxH) {
  const canvas = document.createElement('canvas');
  canvas.width = pxW; canvas.height = pxH;
  const ctx = canvas.getContext('2d');
  const theme = getActiveTheme();
  const allParts = getAllParts(state.model);
  const allSteps = getAllSteps(state.model);

  // Fill background (supports solid, angled gradient, and blueprint grid for built-in & custom themes)
  fillThemeBackgroundCanvas(ctx, theme, pxW, pxH);

  const dens = DENSITY_PAD[state.density] || DENSITY_PAD.balanced;
  const pad = Math.round((dens.pad / 20) * (pxW * 0.04));
  const footerH = Math.round(pxH * 0.042);
  const pgNumText = formatPageNumber(page.num, state.pages.length);
  ctx.fillStyle = theme.text;
  ctx.textBaseline = 'top';

  if (page.kind === 'cover') {
    const cm = state.coverMeta;
    const title = cm.title || state.model.title;
    const sub = cm.subtitle || state.model.subtitle;
    ctx.fillStyle = theme.text;
    ctx.font = `bold ${Math.round(pxH * 0.055)}px -apple-system, sans-serif`;
    ctx.fillText(title, pad, pad);
    ctx.fillStyle = theme.muted;
    ctx.font = `500 ${Math.round(pxH * 0.024)}px -apple-system, sans-serif`;
    ctx.fillText(sub, pad, pad + pxH * 0.068);
    const snap = renderSnapshot([], allParts, cm.az, cm.el, 900, 600, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const img = await loadImgPromise(snap.url);
    drawContain(ctx, img, pad, pad + pxH * 0.12, pxW - pad * 2, pxH * 0.72);
    const logoSz = Math.round(pxH * 0.032);
    const footerY = pxH - pad - logoSz;
    drawBrandLogoCanvas(ctx, pad, footerY - Math.round(logoSz * 0.1), logoSz);
    ctx.fillStyle = theme.muted;
    ctx.font = `600 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
    ctx.fillText(`${allParts.length} Pieces · ${allSteps.length} Steps · Brick Instruction Creator`, pad + logoSz + Math.round(logoSz * 0.35), footerY + Math.round(logoSz * 0.12));
  } else if (page.kind === 'complete') {
    const cm = state.completeMeta;
    if (cm.showFireworks !== false) drawFireworksCanvas(ctx, pxW, pxH);
    const showText = cm.showText !== false;
    if (showText) {
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'center';
      ctx.font = `800 ${Math.round(pxH * 0.055)}px -apple-system, sans-serif`;
      ctx.fillText(cm.title || 'Build Complete!', pxW / 2, pad);
      if (cm.subtitle) {
        ctx.fillStyle = theme.muted;
        ctx.font = `500 ${Math.round(pxH * 0.022)}px -apple-system, sans-serif`;
        ctx.fillText(cm.subtitle, pxW / 2, pad + pxH * 0.068);
      }
      ctx.textAlign = 'left';
    }
    const snap = renderSnapshot([], allParts, cm.az, cm.el, 920, 620, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const img = await loadImgPromise(snap.url);
    const topOff = showText ? pad + pxH * 0.12 : pad + pxH * 0.04;
    const availH = pxH - topOff - pad - footerH;
    drawContain(ctx, img, pad, topOff, pxW - pad * 2, availH);
    if (state.showPageTitle) {
      ctx.fillStyle = theme.muted;
      ctx.font = `600 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(state.model.title, pad, pxH - pad - footerH * 0.4);
    }
    if (pgNumText) {
      ctx.fillStyle = theme.text; ctx.textAlign = 'right';
      ctx.font = `700 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(pgNumText, pxW - pad, pxH - pad - footerH * 0.4);
      ctx.textAlign = 'left';
    }
  } else if (page.kind === 'back') {
    const bm = state.backMeta;
    const credit = (!bm.subtitle || bm.subtitle === 'Created with Brick Instruction Creator')
      ? 'Made with Brick Instruction Creator'
      : bm.subtitle;
    ctx.textAlign = 'center';
    const logoSz = Math.round(Math.min(pxW, pxH) * 0.14);
    const logoY = Math.round(pxH * 0.5 - logoSz * 0.65);
    drawBrandLogoCanvas(ctx, (pxW - logoSz) / 2, logoY, logoSz);

    ctx.fillStyle = theme.muted;
    ctx.font = `600 ${Math.round(pxH * 0.022)}px -apple-system, sans-serif`;
    ctx.fillText(credit, pxW / 2, logoY + logoSz + Math.round(pxH * 0.03));
    ctx.textAlign = 'left';
  } else if (page.kind === 'section_divider') {
    const snap = renderSnapshot([], page.previewParts || [], 38, 28, 760, 480, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const img = await loadImgPromise(snap.url);
    ctx.fillStyle = theme.accent;
    ctx.font = `800 ${Math.round(pxH * 0.024)}px -apple-system, sans-serif`;
    ctx.fillText(`BUILD STAGE ${page.bagNumber || 1}`, pad, pad);
    ctx.fillStyle = theme.text;
    ctx.font = `800 ${Math.round(pxH * 0.048)}px -apple-system, sans-serif`;
    ctx.fillText(page.chapterName || page.label || 'Build Stage', pad, pad + Math.round(pxH * 0.036));
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'right';
    ctx.font = `700 ${Math.round(pxH * 0.022)}px -apple-system, sans-serif`;
    ctx.fillText(`${page.pieceCount || 0} pcs · Steps ${page.firstStepNum}–${page.lastStepNum}`, pxW - pad, pad + Math.round(pxH * 0.048));
    ctx.textAlign = 'left';
    drawContain(ctx, img, pad, pad + Math.round(pxH * 0.12), pxW - pad * 2, pxH - pad * 2 - Math.round(pxH * 0.14) - footerH);
    if (state.showPageTitle) {
      ctx.fillStyle = theme.muted;
      ctx.font = `600 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(state.model.title, pad, pxH - pad - footerH * 0.4);
    }
    if (pgNumText) {
      ctx.fillStyle = theme.text; ctx.textAlign = 'right';
      ctx.font = `700 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(pgNumText, pxW - pad, pxH - pad - footerH * 0.4);
      ctx.textAlign = 'left';
    }
  } else if (page.kind === 'bom') {
    const cfg = state.bomConfig;
    const cols = page.bomCols || (pxW > pxH ? 6 : 4);
    const rows = page.bomRows || (pxW > pxH ? 5 : 6);
    const entries = page.bomEntries || [];
    const headerTitle = page.bomPageCount > 1
      ? `Parts List (${page.bomPageIdx + 1} / ${page.bomPageCount})`
      : 'Parts List';

    ctx.fillStyle = theme.text;
    ctx.font = `bold ${Math.round(pxH * 0.036)}px -apple-system, sans-serif`;
    ctx.fillText(headerTitle, pad, pad);
    ctx.fillStyle = theme.muted;
    ctx.textAlign = 'right';
    ctx.font = `600 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
    ctx.fillText(`${page.bomTotalPieces || allParts.length} pcs · ${page.bomTotalUnique || entries.length} unique`, pxW - pad, pad + Math.round(pxH * 0.012));
    ctx.textAlign = 'left';

    const headerH = Math.round(pxH * 0.065);
    ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad + headerH - 6); ctx.lineTo(pxW - pad, pad + headerH - 6); ctx.stroke();

    const gridX = pad, gridY = pad + headerH;
    const gridW = pxW - pad * 2, gridH = pxH - gridY - pad - footerH;
    const cells = computeBomGridLayout(entries, cols, rows, cfg.flow, cfg.align);
    const qtyFontPx = Math.max(12, Math.round(Math.min(gridW / cols, gridH / rows) * 0.15));
    const nameFontPx = Math.max(9, Math.round(qtyFontPx * 0.72));
    const textAreaH = qtyFontPx + (cfg.showNames ? nameFontPx + 8 : 6);

    for (const c of cells) {
      const { part, qty, meta } = c.item;
      const cx = gridX + c.xFrac * gridW;
      const cy = gridY + c.yFrac * gridH;
      const cw = c.wFrac * gridW;
      const ch = c.hFrac * gridH;
      // Clear/transparent background — no opaque card boxes around BOM parts!
      const img = await loadImgPromise(getPliThumb(part));
      drawContain(ctx, img, cx + 6, cy + 4, cw - 12, Math.max(12, ch - textAreaH - 8));
      ctx.textAlign = 'center';
      ctx.fillStyle = theme.text;
      ctx.font = `800 ${qtyFontPx}px -apple-system, sans-serif`;
      ctx.fillText(`${qty}×`, cx + cw / 2, cy + ch - textAreaH);
      if (cfg.showNames) {
        ctx.fillStyle = theme.muted;
        ctx.font = `500 ${nameFontPx}px -apple-system, sans-serif`;
        const maxChars = Math.max(8, Math.floor((cw - 8) / (nameFontPx * 0.58)));
        const nm = meta.name.length > maxChars ? meta.name.slice(0, maxChars - 1) + '…' : meta.name;
        ctx.fillText(nm, cx + cw / 2, cy + ch - nameFontPx - 2);
      }
    }
    ctx.textAlign = 'left';
    if (state.showPageTitle) {
      ctx.fillStyle = theme.muted;
      ctx.font = `600 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(state.model.title, pad, pxH - pad - footerH * 0.4);
    }
    if (pgNumText) {
      ctx.fillStyle = theme.text; ctx.textAlign = 'right';
      ctx.font = `700 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(pgNumText, pxW - pad, pxH - pad - footerH * 0.4);
      ctx.textAlign = 'left';
    }
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
    const gap = Math.round(pad * 0.55);

    // Optional Finished Submodel / Section Intro Banner at top of chapter's first page
    let topY = pad;
    if (page.submodelIntro) {
      const sub = page.submodelIntro;
      const bannerH = Math.round(Math.min(pxH * 0.13, 130));
      const bannerW = pxW - pad * 2;
      drawRRect(pad, pad, bannerW, bannerH, 16);
      ctx.fillStyle = theme.calloutBg;
      ctx.fill();
      ctx.strokeStyle = theme.calloutBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      const multLabel = sub.repeatCount > 1 ? `×${sub.repeatCount}` : `${sub.pieceCount || sub.canonicalParts?.length || 0} pcs`;
      const pillFont = Math.round(bannerH * (sub.repeatCount > 1 ? 0.34 : 0.24));
      ctx.font = `900 ${pillFont}px -apple-system, sans-serif`;
      const pillW = Math.max(Math.round(bannerH * 0.95), Math.round(ctx.measureText(multLabel).width + 32));
      const pillH = Math.round(bannerH * 0.54);
      const pillX = pad + bannerW - pillW - 18;
      const pillY = pad + Math.round((bannerH - pillH) / 2);

      ctx.save();
      drawRRect(pad, pad, bannerW, bannerH, 16);
      ctx.clip();
      const thumbUrl = getSubmodelThumb(sub, 260, 160);
      if (thumbUrl) {
        const introImg = await loadImgPromise(thumbUrl);
        drawContain(ctx, introImg, pad + 14, pad + 8, Math.round(bannerH * 1.45), bannerH - 16);
      }
      const textX = pad + 14 + Math.round(bannerH * 1.45) + 14;
      const introTextMaxW = Math.max(0, pillX - textX - 12);
      ctx.fillStyle = theme.muted;
      ctx.font = `700 ${Math.round(bannerH * 0.16)}px -apple-system, sans-serif`;
      drawTruncatedText(sub.isSectionModule ? 'BUILD SECTION' : 'SUBMODEL', textX, pad + Math.round(bannerH * 0.2), introTextMaxW);
      ctx.fillStyle = theme.text;
      ctx.font = `800 ${Math.round(bannerH * 0.28)}px -apple-system, sans-serif`;
      drawTruncatedText(sub.name || 'Submodel', textX, pad + Math.round(bannerH * 0.44), introTextMaxW);

      drawRRect(pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${pillFont}px -apple-system, sans-serif`;
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

    for (let idx = 0; idx < slots.length; idx++) {
      const { ch, step } = slots[idx];
      const sx = pad + (idx % cols) * (slotW + gap);
      const sy = topY + Math.floor(idx / cols) * (slotH + gap);
      if (state.showStepBorders) {
        ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 2;
        ctx.strokeRect(sx, sy, slotW, slotH);
      }

      // Step number
      ctx.fillStyle = theme.text;
      ctx.font = `800 ${Math.round(Math.min(slotH * 0.11, 44))}px -apple-system, sans-serif`;
      ctx.fillText(String(step.num), sx + 12, sy + 10);

      // PLI Box (shows finished submodel/minifigure thumbnail + ×N or Connect verb on prep & attachment steps, or raw parts otherwise)
      const pliX = sx + Math.round(Math.min(slotH * 0.14, 62)), pliY = sy + 10;
      const pliH = Math.min(58, slotH * 0.22);
      if (step.attachedSubmodel) {
        const att = step.attachedSubmodel;
        const attBoxW = Math.min(slotW - (pliX - sx) - 14, Math.max(150, pliH * 3.4));
        drawRRect(pliX, pliY, attBoxW, pliH, 10);
        ctx.fillStyle = theme.calloutBg;
        ctx.fill();
        ctx.strokeStyle = theme.calloutBorder;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.save();
        drawRRect(pliX, pliY, attBoxW, pliH, 10);
        ctx.clip();
        const attUrl = getSubmodelThumb(att, 160, 120);
        if (attUrl) {
          const attImg = await loadImgPromise(attUrl);
          drawContain(ctx, attImg, pliX + 6, pliY + 4, pliH * 1.25, pliH - 8);
        }
        const tx = pliX + 6 + pliH * 1.25 + 8;
        const textMaxW = Math.max(0, pliX + attBoxW - tx - 8);
        ctx.fillStyle = theme.accent;
        ctx.font = `900 ${Math.round(pliH * (att.isSectionAttach ? 0.3 : 0.36))}px -apple-system, sans-serif`;
        drawTruncatedText(att.isSectionAttach ? (att.attachVerb || 'Connect') : `×${att.repeatCount}`, tx, pliY + Math.round(pliH * 0.14), textMaxW);
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(pliH * 0.24)}px -apple-system, sans-serif`;
        drawTruncatedText(att.name || 'Submodel', tx, pliY + Math.round(pliH * 0.56), textMaxW);
        ctx.restore();
      } else if (step.minifigPrep) {
        const prep = step.minifigPrep;
        const prepBoxW = Math.min(slotW - (pliX - sx) - 14, Math.max(175, pliH * 3.8));
        drawRRect(pliX, pliY, prepBoxW, pliH, 10);
        ctx.fillStyle = theme.calloutBg;
        ctx.fill();
        ctx.strokeStyle = theme.calloutBorder;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.save();
        drawRRect(pliX, pliY, prepBoxW, pliH, 10);
        ctx.clip();
        const prepUrl = getMinifigThumb(prep.canonicalParts, `prep_${prep.id}`, MINIFIG_BUILD_CAMERA.az, MINIFIG_BUILD_CAMERA.el, 120, 120);
        if (prepUrl) {
          const prepImg = await loadImgPromise(prepUrl);
          drawContain(ctx, prepImg, pliX + 6, pliY + 4, pliH * 1.0, pliH - 8);
        }
        const tx = pliX + 6 + pliH * 1.0 + 8;
        const textMaxW = Math.max(0, pliX + prepBoxW - tx - 8);
        ctx.fillStyle = theme.accent;
        ctx.font = `800 ${Math.round(pliH * 0.28)}px -apple-system, sans-serif`;
        drawTruncatedText(prep.label || 'Position', tx, pliY + Math.round(pliH * 0.16), textMaxW);
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(pliH * 0.23)}px -apple-system, sans-serif`;
        drawTruncatedText(prep.name || 'Minifigure', tx, pliY + Math.round(pliH * 0.56), textMaxW);
        ctx.restore();
      } else if (step.attachedMinifig) {
        const att = step.attachedMinifig;
        const attBoxW = Math.min(slotW - (pliX - sx) - 14, Math.max(150, pliH * 3.3));
        drawRRect(pliX, pliY, attBoxW, pliH, 10);
        ctx.fillStyle = theme.calloutBg;
        ctx.fill();
        ctx.strokeStyle = theme.calloutBorder;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.save();
        drawRRect(pliX, pliY, attBoxW, pliH, 10);
        ctx.clip();
        const attUrl = getMinifigThumb(att.previewParts || att.canonicalParts, `att_${att.id}`, 38, 26, 120, 120);
        if (attUrl) {
          const attImg = await loadImgPromise(attUrl);
          drawContain(ctx, attImg, pliX + 6, pliY + 4, pliH * 1.0, pliH - 8);
        }
        const tx = pliX + 6 + pliH * 1.0 + 8;
        const textMaxW = Math.max(0, pliX + attBoxW - tx - 8);
        ctx.fillStyle = theme.accent;
        ctx.font = `900 ${Math.round(pliH * 0.36)}px -apple-system, sans-serif`;
        drawTruncatedText(`×${att.repeatCount || 1}`, tx, pliY + Math.round(pliH * 0.14), textMaxW);
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(pliH * 0.24)}px -apple-system, sans-serif`;
        drawTruncatedText(att.name || 'Minifigure', tx, pliY + Math.round(pliH * 0.56), textMaxW);
        ctx.restore();
      } else {
        const pliMap = new Map();
        for (const p of step.parts) { const k = `${p.p}:${p.c}`; if (!pliMap.has(k)) pliMap.set(k, { part: p, qty: 0 }); pliMap.get(k).qty++; }
        const pli = Array.from(pliMap.values()).slice(0, 6);
        if (pli.length > 0) {
          const itemW = Math.min(72, (slotW - 80) / Math.max(1, pli.length));
          ctx.fillStyle = theme.pliBg;
          ctx.fillRect(pliX, pliY, pli.length * itemW + 10, pliH);
          ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.5;
          ctx.strokeRect(pliX, pliY, pli.length * itemW + 10, pliH);
          for (let pi = 0; pi < pli.length; pi++) {
            const im = await loadImgPromise(getPliThumb(pli[pi].part));
            drawContain(ctx, im, pliX + 6 + pi * itemW, pliY + 4, itemW * 0.56, pliH - 8);
            ctx.fillStyle = theme.text; ctx.font = `bold ${Math.round(pliH * 0.34)}px -apple-system, sans-serif`;
            ctx.fillText(`${pli[pi].qty}×`, pliX + 6 + pi * itemW + itemW * 0.58, pliY + pliH * 0.3);
          }
        }
      }

      // 3D Step Render (+ optional true physical 1:1 Minifigure View card on printed paper!)
      const prev = getPreviousPartsForStep(state.model, ch, step);
      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const snap = renderSnapshot(prev, step.parts, cam.az, cam.el, 760, 520, ov.modelScale || 1.0, {
        highlightNew: state.highlightNew, highlightColor: state.highlightColor,
        fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity,
        showArrows: true, accent: theme.accent, ov, partOffsets: ov.partOffsets || {},
      });
      const stepImg = await loadImgPromise(snap.url);
      const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
      const renderTopY = sy + pliH + 18;
      const renderAvailH = slotH - pliH - 28;
      if (state.showMinifig1to1 && isMfBuild) {
        const [, pdfHIn] = getActivePagePhysicalInches();
        const mf1 = renderMinifigOneToOne(step.parts, pxH, pdfHIn, Math.round(slotW * 0.34), Math.round(renderAvailH * 0.72), theme.accent);
        const cardPad = 12;
        const headerH = 22;
        const mfHeaderLabel = `1:1${mf1.isExact ? '' : ' Fit'} · ${Math.round(mf1.heightMm)} mm`;
        ctx.font = `800 12px -apple-system, sans-serif`;
        const mfHeaderW = Math.ceil(ctx.measureText(mfHeaderLabel).width);
        const cardW = Math.min(Math.round(slotW * 0.44), Math.max(82, mfHeaderW + cardPad * 2, mf1.displayPxW + cardPad * 2 + 12));
        const cardH = Math.min(renderAvailH - 4, mf1.displayPxH + headerH + cardPad * 2);
        const cardX = sx + slotW - cardW - 12;
        const cardY = renderTopY + Math.round((renderAvailH - cardH) / 2);
        drawContain(ctx, stepImg, sx + 10, renderTopY, Math.max(40, cardX - (sx + 18)), renderAvailH);

        drawRRect(cardX, cardY, cardW, cardH, 12);
        ctx.fillStyle = theme.calloutBg;
        ctx.fill();
        ctx.strokeStyle = theme.calloutBorder;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.save();
        drawRRect(cardX, cardY, cardW, cardH, 12);
        ctx.clip();
        ctx.fillStyle = theme.accent;
        ctx.font = `800 12px -apple-system, sans-serif`;
        drawTruncatedText(mfHeaderLabel, cardX + cardPad, cardY + 8, Math.max(0, cardW - cardPad * 2));
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
      } else {
        drawContain(ctx, stepImg, sx + 10, renderTopY, slotW - 20, renderAvailH);
      }

      // Final step of a duplicate submodel: show prominent ×N badge ONLY on this last step
      if (step.isSubmodelFinal) {
        const badgeLabel = `×${step.submodelRepeat || 2}`;
        const badgeFont = Math.round(Math.min(slotH * 0.085, 34));
        ctx.font = `900 ${badgeFont}px -apple-system, sans-serif`;
        const bW = Math.max(Math.round(badgeFont * 2.1), Math.round(ctx.measureText(badgeLabel).width + 26));
        const bH = Math.round(badgeFont * 1.55);
        const bX = sx + slotW - bW - 14;
        const bY = sy + slotH - bH - 12;
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

    if (state.showPageTitle) {
      ctx.fillStyle = theme.muted;
      ctx.font = `600 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(page.chapterName || '', pad, pxH - pad - footerH * 0.4);
    }
    if (pgNumText) {
      ctx.fillStyle = theme.text; ctx.textAlign = 'right';
      ctx.font = `700 ${Math.round(pxH * 0.02)}px -apple-system, sans-serif`;
      ctx.fillText(pgNumText, pxW - pad, pxH - pad - footerH * 0.4);
      ctx.textAlign = 'left';
    }
  }

  const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
  const b64 = dataUrl.split(',')[1];
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return { bytes, pxW, pxH, dataUrl };
}

let lastGeneratedPdfBlob = null, lastGeneratedPdfUrl = null, lastGeneratedPdfName = 'manual.pdf';
async function runPdfExport(pagesToExport) {
  const [pageWpt, pageHpt] = getPdfPaperPts();
  const pxW = Math.round(pageWpt * 1.45), pxH = Math.round(pageHpt * 1.45);
  document.getElementById('expProgressWrap').classList.remove('hidden');
  document.getElementById('expReadyWrap').classList.add('hidden');
  const jpegPages = [];
  for (let i = 0; i < pagesToExport.length; i++) {
    const pct = Math.round(((i + 1) / pagesToExport.length) * 100);
    document.getElementById('expProgressLabel').textContent = `Rendering page ${i + 1} of ${pagesToExport.length}…`;
    document.getElementById('expProgressPct').textContent = pct + '%';
    document.getElementById('expProgressBar').style.width = pct + '%';
    await new Promise(r => setTimeout(r, 8));
    jpegPages.push(await renderPageToJpegBytes(pagesToExport[i], pxW, pxH));
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
  const payload = JSON.stringify({ version: 3, title: state.model.title, chapters: state.model.chapters, overrides: state.overrides, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter, coverMeta: state.coverMeta, completeMeta: state.completeMeta, backMeta: state.backMeta, bomConfig: state.bomConfig, showStepBorders: state.showStepBorders, showPageTitle: state.showPageTitle, pageNumberFormat: state.pageNumberFormat, detectDuplicates: state.detectDuplicates, themeId: state.themeId, ...(embeddedCustomTheme ? { customTheme: embeddedCustomTheme } : {}), paperFormat: state.paperFormat, orientation: state.orientation, density: state.density, layout: state.layout }, null, 2);
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
    state.model = { title: data.title || 'Loaded Manual', subtitle: '', chapters: data.chapters || [] };
    state.overrides = data.overrides || {}; state.pageInserts = data.pageInserts || {};
    state.dividerAfter = data.dividerAfter || {};
    if (data.coverMeta) state.coverMeta = { ...state.coverMeta, ...data.coverMeta };
    if (data.completeMeta) state.completeMeta = { ...state.completeMeta, ...data.completeMeta };
    if (data.backMeta) state.backMeta = { ...state.backMeta, ...data.backMeta };
    if (data.bomConfig) state.bomConfig = { ...state.bomConfig, ...data.bomConfig };
    if (typeof data.showStepBorders === 'boolean') state.showStepBorders = data.showStepBorders;
    if (typeof data.showPageTitle === 'boolean') state.showPageTitle = data.showPageTitle;
    if (data.pageNumberFormat) state.pageNumberFormat = data.pageNumberFormat;
    if (typeof data.detectDuplicates === 'boolean') state.detectDuplicates = data.detectDuplicates;
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
    errFilter = 'all';
    lastSourceRecord = { kind: 'project', fileName: f.name };
    computeModelDiagnostics();
    closeMenu(); renderAll(); showToast(`Opened ${state.model.title}.`);
  } catch (err) { showToast('Could not read project file.'); }
};

// Image Insert & Cover Image Uploads
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
  const r = new FileReader();
  r.onload = () => {
    const pg = state.pages[state.pageIdx];
    pushUndo();
    if (pg.kind === 'cover') state.coverMeta.bgSrc = r.result;
    else if (pg.kind === 'complete') state.completeMeta.bgSrc = r.result;
    else if (pg.kind === 'back') state.backMeta.bgSrc = r.result;
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
  userLibRaw.clear(); userLibTitles.clear(); embeddedDatCompiled.clear(); pliThumbCache.clear(); submodelThumbCache.clear();
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
  highlightedSecId: null,
  allowRepeatCollapse: true,
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
  const dimPartIds = impState.highlightedSecId && prop ? new Set() : null;

  if (prop && prop.sections?.length) {
    const spanRef = Math.max(160, impState.assessment?.longestSpanLdu || 320);
    const explodeDist = Math.min(240, Math.max(48, spanRef * 0.24)) * (impState.explodePct / 100);

    prop.sections.forEach((sec) => {
      const isHighlighted = !impState.highlightedSecId || impState.highlightedSecId === sec.id;
      const groups = sec.repeatPartIndexGroups && sec.repeatPartIndexGroups.length > 1
        ? sec.repeatPartIndexGroups
        : [sec.partIndices];

      groups.forEach((grp, gIdx) => {
        const sign = groups.length === 2 && gIdx === 1 ? -1 : 1;
        const ox = (sec.explodeOffset?.[0] || 0) * explodeDist * sign;
        const oy = (sec.explodeOffset?.[1] || 0) * explodeDist * (gIdx === 1 && groups.length === 2 ? 1 : 1);
        const oz = (sec.explodeOffset?.[2] || 0) * explodeDist * sign;
        const colHex = groups.length === 2 && gIdx === 1 ? '#38bdf8' : sec.previewColor;

        for (const pi of grp) {
          const p = parts[pi];
          if (!p) continue;
          if (explodeDist > 1) partOffsets[p.id] = { x: ox, y: oy, z: oz, arrow: false };
          if (partColorOverrides) partColorOverrides[p.id] = colHex;
          if (dimPartIds && !isHighlighted) dimPartIds.add(p.id);
        }
      });
    });
  }
  return { parts, partOffsets, partColorOverrides, dimPartIds };
}

function rebuildAndDrawImportPreview() {
  const canvas = document.getElementById('impPreviewCanvas');
  if (!canvas || !impState.parsed) return;
  if (!impPreviewEngine) impPreviewEngine = new WebGLBrickEngine(canvas);

  const { parts, partOffsets, partColorOverrides, dimPartIds } = getPreviewPartMaps();
  impPreviewMesh = buildMeshBuffers([], parts, {
    highlightNew: false,
    fadePrev: false,
    fadeOpacity: 1.0,
    showArrows: false,
    accent: '#1a73e8',
    partOffsets,
    partColorOverrides,
    dimPartIds,
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
  const custWrap = document.getElementById('impCustomizeWrap');
  const secListEl = document.getElementById('impSectionList');
  const zoomPill = document.getElementById('impZoomGainPill');
  const autoBtn = document.getElementById('impBtnAuto');
  const granRow = document.getElementById('impGranularityRow');
  const countVal = document.getElementById('impCountVal');
  const identWrap = document.getElementById('impIdenticalWrap');
  const identToggle = document.getElementById('impToggleIdentical');
  const outModBtn = document.getElementById('impOutModular');
  const outBagBtn = document.getElementById('impOutBags');
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
      impState.highlightedSecId = null;
      if (pid === 'none') {
        impState.activeProposal = null;
      } else {
        const found = impState.proposals.find(p => p.id === pid);
        impState.activeProposal = found ? JSON.parse(JSON.stringify(found)) : null;
        impState.allowRepeatCollapse = Boolean(found?.hasIdenticalHalves);
      }
      renderImportAssistantUI();
      rebuildAndDrawImportPreview();
    };
  });

  const active = impState.activeProposal;
  if (!active) {
    custWrap.classList.add('hidden');
    zoomPill.classList.add('hidden');
    autoBtn.textContent = impState.isPostImport ? 'Rebuild as Single Build' : 'Generate Manual';
    return;
  }

  custWrap.classList.remove('hidden');
  if (active.zoomGainEstimate && active.zoomGainEstimate >= 1.25 && active.outputMode === 'modular_chapters') {
    zoomPill.textContent = `~${active.zoomGainEstimate}× larger bricks per step`;
    zoomPill.classList.remove('hidden');
  } else {
    zoomPill.classList.add('hidden');
  }

  // Output mode buttons
  const isMod = active.outputMode === 'modular_chapters';
  outModBtn.className = `px-2.5 py-1 rounded-full transition ${isMod ? 'bg-[#1a73e8] text-white' : 'text-[var(--muted-foreground)]'}`;
  outBagBtn.className = `px-2.5 py-1 rounded-full transition ${!isMod ? 'bg-[#1a73e8] text-white' : 'text-[var(--muted-foreground)]'}`;

  // Section count stepper
  const primarySecs = active.sections.filter(s => s.role !== 'join');
  const effectiveSegCount = active.hasIdenticalHalves ? 2 : primarySecs.length;
  countVal.textContent = String(effectiveSegCount);
  granRow.classList.toggle('hidden', active.strategy === 'spatial_sectors');

  // Show 2x Identical Halves toggle whenever longitudinal 2-half plan detected identical halves (or user toggled it off)
  const canToggleIdentical = active.strategy === 'longitudinal_halves' && effectiveSegCount === 2 && (active.hasIdenticalHalves || impState.proposals.some(p => p.id === impState.selectedId && p.hasIdenticalHalves));
  identWrap.classList.toggle('hidden', !canToggleIdentical || !isMod);
  identToggle.checked = Boolean(active.hasIdenticalHalves);

  // Editable sections list (tap to highlight in 3D, rename inline, 1-click Merge / Split)
  secListEl.innerHTML = active.sections.map((sec, idx) => {
    const isHi = impState.highlightedSecId === sec.id;
    const isRep = sec.repeatPartIndexGroups && sec.repeatPartIndexGroups.length > 1;
    const pcs = sec.partIndices.length;
    const canMerge = active.sections.length > 2 && idx < active.sections.length - 1;
    const canSplit = !isRep && pcs >= 10 && active.sections.length < 8;
    return `
      <div data-sec-row="${sec.id}" class="flex items-center gap-2 px-2.5 py-2 rounded-2xl border transition cursor-pointer ${isHi ? 'border-[#1a73e8] bg-[#1a73e8]/10' : 'border-[var(--border)] bg-[var(--background)]'}">
        <span class="w-3 h-3 rounded-full shrink-0 border border-black/15" style="background:${sec.previewColor}"></span>
        <input data-sec-rename="${idx}" type="text" value="${escHtml(sec.name)}" class="flex-1 min-w-0 bg-transparent text-[11px] font-bold outline-none focus:underline" />
        <span class="text-[10px] font-semibold text-[var(--muted-foreground)] shrink-0">${isRep ? `${sec.repeatPartIndexGroups.length}×${pcs}` : `${pcs} pcs`}</span>
        ${canSplit ? `<button type="button" data-sec-split="${idx}" class="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[10px] font-semibold hover:border-[#1a73e8] shrink-0">Split</button>` : ''}
        ${canMerge ? `<button type="button" data-sec-merge="${idx}" class="px-2 py-0.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[10px] font-semibold hover:border-[#1a73e8] shrink-0">Merge ↓</button>` : ''}
      </div>`;
  }).join('');

  secListEl.querySelectorAll('[data-sec-row]').forEach((row) => {
    row.onclick = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
      const sid = row.getAttribute('data-sec-row');
      impState.highlightedSecId = impState.highlightedSecId === sid ? null : sid;
      renderImportAssistantUI();
      rebuildAndDrawImportPreview();
    };
  });
  secListEl.querySelectorAll('[data-sec-rename]').forEach((inp) => {
    inp.oninput = () => {
      const idx = parseInt(inp.getAttribute('data-sec-rename'), 10);
      if (impState.activeProposal?.sections[idx]) {
        impState.activeProposal.sections[idx].name = inp.value;
      }
    };
  });
  secListEl.querySelectorAll('[data-sec-merge]').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-sec-merge'), 10);
      if (!impState.activeProposal || !impState.prep) return;
      impState.activeProposal = mergeProposedSections(
        impState.activeProposal, idx, idx + 1, impState.prep.inputs, impState.prep.adjacency,
      );
      impState.highlightedSecId = null;
      renderImportAssistantUI();
      rebuildAndDrawImportPreview();
    };
  });
  secListEl.querySelectorAll('[data-sec-split]').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute('data-sec-split'), 10);
      if (!impState.activeProposal || !impState.prep) return;
      impState.activeProposal = splitProposedSection(
        impState.activeProposal, idx, impState.prep.inputs, impState.prep.adjacency,
      );
      impState.highlightedSecId = null;
      renderImportAssistantUI();
      rebuildAndDrawImportPreview();
    };
  });

  const secCountLabel = isMod
    ? `${primarySecs.length} Section${primarySecs.length === 1 ? '' : 's'} + Join`
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
  impState.highlightedSecId = null;
  impState.az = 38;
  impState.el = 28;

  // Pre-select the #1 ranked subdivision when triggered by size/span/post-import; otherwise single build
  if ((assessment.shouldPrompt || isPostImport) && proposals.length > 0) {
    impState.selectedId = proposals[0].id;
    impState.activeProposal = JSON.parse(JSON.stringify(proposals[0]));
    impState.allowRepeatCollapse = Boolean(proposals[0].hasIdenticalHalves);
  } else {
    impState.selectedId = 'none';
    impState.activeProposal = null;
    impState.allowRepeatCollapse = true;
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
document.getElementById('impOutModular').onclick = () => {
  if (!impState.activeProposal) return;
  impState.activeProposal.outputMode = 'modular_chapters';
  impState.activeProposal.sections.forEach(s => { if (s.role === 'bag') s.role = 'module'; });
  renderImportAssistantUI();
};
document.getElementById('impOutBags').onclick = () => {
  if (!impState.activeProposal) return;
  impState.activeProposal.outputMode = 'numbered_bags';
  renderImportAssistantUI();
};
const adjustSectionCount = (delta) => {
  const act = impState.activeProposal;
  if (!act || !impState.prep) return;
  const currPrimary = act.hasIdenticalHalves ? 2 : act.sections.filter(s => s.role !== 'join').length;
  const nextCount = Math.max(2, Math.min(8, currPrimary + delta));
  if (nextCount === currPrimary) return;
  const prevOut = act.outputMode;
  const recomputed = recomputeProposalWithCount(
    act.strategy,
    impState.prep.inputs,
    impState.prep.adjacency,
    nextCount,
    impState.allowRepeatCollapse && nextCount === 2,
  );
  if (recomputed) {
    recomputed.outputMode = prevOut;
    impState.activeProposal = recomputed;
    impState.highlightedSecId = null;
    renderImportAssistantUI();
    rebuildAndDrawImportPreview();
  }
};
document.getElementById('impCountMinus').onclick = () => adjustSectionCount(-1);
document.getElementById('impCountPlus').onclick = () => adjustSectionCount(1);
document.getElementById('impToggleIdentical').onchange = (e) => {
  impState.allowRepeatCollapse = e.target.checked;
  const act = impState.activeProposal;
  if (!act || !impState.prep) return;
  const recomputed = recomputeProposalWithCount(
    act.strategy,
    impState.prep.inputs,
    impState.prep.adjacency,
    2,
    impState.allowRepeatCollapse,
  );
  if (recomputed) {
    recomputed.outputMode = act.outputMode;
    impState.activeProposal = recomputed;
    impState.highlightedSecId = null;
    renderImportAssistantUI();
    rebuildAndDrawImportPreview();
  }
};

function finishImport(parsed, mode, subdivisionPlan = null, isPostImport = false) {
  if (isPostImport) pushUndo();
  submodelThumbCache.clear();
  state.model = buildManualFromParsed(parsed, mode, subdivisionPlan);
  if (!isPostImport) {
    state.overrides = {}; state.pageInserts = {}; state.dividerAfter = {};
    state.coverMeta = { title:'', subtitle:'', az:38, el:26, bgSrc:null };
    state.undoStack = []; state.redoStack = [];
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
    } else {
      embeddedDatRaw.clear(); embeddedDatTitles.clear(); embeddedDatCompiled.clear(); compositePartDefs.clear(); pliThumbCache.clear(); submodelThumbCache.clear();
      const txt = await file.text();
      pendingRawFile = { kind: 'ldr', fileName: file.name, data: txt };
      parsed = parseImportedModel(txt, '', file.name);
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
