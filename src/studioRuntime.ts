// @ts-nocheck
/* eslint-disable */
// Brick Instruction Creator — Interactive WebGL Manual Studio Runtime
// Compiled & bundled locally by Vite for GitHub Pages and Neocities deployment.

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

const THEMES = {
  blue:      { id:'blue',      name:'Classic Blue',   bg:'linear-gradient(180deg,#d8ecfd 0%,#b7daf9 100%)', text:'#172536', muted:'#4a607a', pliBg:'rgba(255,255,255,0.92)', pliBorder:'#8ab8e6', accent:'#1a73e8', calloutBg:'#fffbe6', calloutBorder:'#eab308', bp:false },
  white:     { id:'white',     name:'Clean White',    bg:'#ffffff', text:'#202124', muted:'#5f6368', pliBg:'#f8f9fa', pliBorder:'#dadce0', accent:'#1a73e8', calloutBg:'#f1f3f4', calloutBorder:'#bdc1c6', bp:false },
  dark:      { id:'dark',      name:'Editorial Dark', bg:'linear-gradient(160deg,#1a1d24 0%,#101218 100%)', text:'#f1f3f4', muted:'#9aa0a6', pliBg:'rgba(255,255,255,0.08)', pliBorder:'rgba(255,255,255,0.16)', accent:'#8ab4f8', calloutBg:'rgba(255,255,255,0.06)', calloutBorder:'rgba(255,255,255,0.2)', bp:false },
  blueprint: { id:'blueprint', name:'Blueprint',      bg:'#0d3b66', text:'#eef6ff', muted:'#9dc4e8', pliBg:'rgba(9,40,72,0.88)', pliBorder:'#5aa9e6', accent:'#64dfdf', calloutBg:'rgba(8,33,58,0.9)', calloutBorder:'#64dfdf', bp:true },
};

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

// BrickLink Studio un-expanded torso assemblies (bl_973pb*c01) have their local origin at waist corner
// instead of LDraw 973c01's neck-base origin: shifted by (-20, -32, +10) in LDraw coords.
function isBrickLinkTorsoAssemblyId(k) {
  return /^bl_973p[a-z0-9]+c\d+$/i.test(k);
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
  if (/^973p[a-z0-9]+c\d+$/i.test(noBl)) {
    add('973c01');
    add('973');
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
  const directTitle = embeddedDatTitles.get(k) || userLibTitles.get(k);
  if (directTitle) return directTitle;

  const isPrinted = /(?:pb|ps|pat|pr)\d+/i.test(k) || /^\d{3,}[a-z]?p[0-9a-z]{2,}/i.test(k);
  const lookupName = (id) => {
    const t = embeddedDatTitles.get(id) || userLibTitles.get(id);
    if (t) return t;
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

// Fast recursive LDraw .dat compiler (checks embedded .io model2.ldr first, then user-imported LDraw Library!)
function lookupEmbeddedDat(ref) {
  const k = normId(ref);
  const stripped = k.replace(/^(48|8|s)\//, '');
  const base = k.split('/').pop();
  for (const store of [embeddedDatRaw, userLibRaw]) {
    if (store.has(k)) return { key: k, lines: store.get(k), offset: null };
    if (store.has(stripped)) return { key: stripped, lines: store.get(stripped), offset: null };
    if (store.has(base)) return { key: base, lines: store.get(base), offset: null };
  }
  const fbs = getPartIdFallbacks(k);
  if (fbs.length > 0) {
    const offset = isBrickLinkTorsoAssemblyId(k) ? [-20, -32, 10] : null;
    for (const fb of fbs) {
      for (const store of [embeddedDatRaw, userLibRaw]) {
        if (store.has(fb)) return { key: fb, lines: store.get(fb), offset };
      }
    }
  }
  return null;
}

function compileEmbeddedDat(partId) {
  const k = normId(partId);
  if (embeddedDatCompiled.has(k)) return embeddedDatCompiled.get(k);
  const found = lookupEmbeddedDat(k);
  if (!found) { embeddedDatCompiled.set(k, null); return null; }

  const tris = [], norms = [], edges = [];
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;

  const upd = (p) => {
    if(p[0]<minX)minX=p[0]; if(p[0]>maxX)maxX=p[0];
    if(p[1]<minY)minY=p[1]; if(p[1]>maxY)maxY=p[1];
    if(p[2]<minZ)minZ=p[2]; if(p[2]>maxZ)maxZ=p[2];
  };
  const ld2gl = (pt) => [pt[0], -pt[1], -pt[2]];
  const emitTri = (la, lb, lc) => {
    const a = ld2gl(la), b = ld2gl(lb), c = ld2gl(lc);
    const ux=b[0]-a[0], uy=b[1]-a[1], uz=b[2]-a[2];
    const vx=c[0]-a[0], vy=c[1]-a[1], vz=c[2]-a[2];
    let nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx;
    const nl=Math.hypot(nx,ny,nz); if (nl < 1e-6) return;
    nx/=nl; ny/=nl; nz/=nl;
    tris.push(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    norms.push(nx,ny,nz, nx,ny,nz, nx,ny,nz);
    upd(a); upd(b); upd(c);
  };
  const emitEdge = (la, lb) => {
    const a = ld2gl(la), b = ld2gl(lb);
    edges.push(a[0],a[1],a[2], b[0],b[1],b[2]);
    upd(a); upd(b);
  };

  // Lightweight 8-sided cylinder stud (flush seated, 5x faster than 16/48-sided stud.dat!)
  const emitFastStud = (px, py, pz, pm, hollow) => {
    const segs = 8, r = 6;
    const tp = (x, y, z) => { const v = m3v(pm, x, y, z); return [px+v[0], py+v[1], pz+v[2]]; };
    const topC = tp(0, -4, 0);
    for (let i = 0; i < segs; i++) {
      const a0 = (i/segs)*Math.PI*2, a1 = ((i+1)/segs)*Math.PI*2;
      const t0 = tp(Math.cos(a0)*r, -4, Math.sin(a0)*r), t1 = tp(Math.cos(a1)*r, -4, Math.sin(a1)*r);
      const b0 = tp(Math.cos(a0)*r, 0.4, Math.sin(a0)*r), b1 = tp(Math.cos(a1)*r, 0.4, Math.sin(a1)*r);
      emitTri(b0, b1, t1); emitTri(b0, t1, t0);
      if (!hollow) emitTri(topC, t0, t1);
      emitEdge(t0, t1);
    }
  };

  // Synthesize LDraw arc primitives (low-poly 8-10 segs to stay fast on iPhone!)
  const emitSynthPrim = (base, px, py, pz, pm) => {
    const m = base.match(/^(\d+)-(\d+)(cyli|cylo|disc|edge|ring\d+|chrd|ndis)$/);
    if (!m) return false;
    const num = +m[1], den = +m[2], kind = m[3];
    const frac = Math.min(1, num / den);
    const segs = Math.max(2, Math.round(10 * frac));
    const maxA = frac * Math.PI * 2;
    const tp = (x, y, z) => { const v = m3v(pm, x, y, z); return [px+v[0], py+v[1], pz+v[2]]; };
    if (kind === 'edge') {
      for (let i = 0; i < segs; i++) {
        const a0 = (i/segs)*maxA, a1 = ((i+1)/segs)*maxA;
        emitEdge(tp(Math.cos(a0), 0, Math.sin(a0)), tp(Math.cos(a1), 0, Math.sin(a1)));
      }
      return true;
    }
    if (kind === 'cyli' || kind === 'cylo') {
      for (let i = 0; i < segs; i++) {
        const a0 = (i/segs)*maxA, a1 = ((i+1)/segs)*maxA;
        const t0 = tp(Math.cos(a0), 0, Math.sin(a0)), t1 = tp(Math.cos(a1), 0, Math.sin(a1));
        const b0 = tp(Math.cos(a0), 1, Math.sin(a0)), b1 = tp(Math.cos(a1), 1, Math.sin(a1));
        emitTri(t0, t1, b1); emitTri(t0, b1, b0);
      }
      return true;
    }
    if (kind === 'disc') {
      const c = tp(0, 0, 0);
      for (let i = 0; i < segs; i++) {
        const a0 = (i/segs)*maxA, a1 = ((i+1)/segs)*maxA;
        emitTri(c, tp(Math.cos(a0), 0, Math.sin(a0)), tp(Math.cos(a1), 0, Math.sin(a1)));
      }
      return true;
    }
    if (kind.startsWith('ring')) {
      const ri = parseInt(kind.slice(4), 10) || 1, ro = ri + 1;
      for (let i = 0; i < segs; i++) {
        const a0 = (i/segs)*maxA, a1 = ((i+1)/segs)*maxA;
        const i0 = tp(Math.cos(a0)*ri,0,Math.sin(a0)*ri), i1 = tp(Math.cos(a1)*ri,0,Math.sin(a1)*ri);
        const o0 = tp(Math.cos(a0)*ro,0,Math.sin(a0)*ro), o1 = tp(Math.cos(a1)*ro,0,Math.sin(a1)*ro);
        emitTri(i0, o0, o1); emitTri(i0, o1, i1);
      }
      return true;
    }
    return false;
  };

  const walk = (lines, px, py, pz, pm, depth) => {
    if (depth > 8 || tris.length > 18000) return;
    for (const raw of lines) {
      const ch = raw[0];
      if (ch === '3' && raw[1] === ' ') {
        const t = raw.split(/\s+/);
        if (t.length >= 11) {
          const a = m3v(pm,+t[2],+t[3],+t[4]), b = m3v(pm,+t[5],+t[6],+t[7]), c = m3v(pm,+t[8],+t[9],+t[10]);
          emitTri([px+a[0],py+a[1],pz+a[2]], [px+b[0],py+b[1],pz+b[2]], [px+c[0],py+c[1],pz+c[2]]);
        }
      } else if (ch === '4' && raw[1] === ' ') {
        const t = raw.split(/\s+/);
        if (t.length >= 14) {
          const a = m3v(pm,+t[2],+t[3],+t[4]), b = m3v(pm,+t[5],+t[6],+t[7]), c = m3v(pm,+t[8],+t[9],+t[10]), d = m3v(pm,+t[11],+t[12],+t[13]);
          const pa=[px+a[0],py+a[1],pz+a[2]], pb=[px+b[0],py+b[1],pz+b[2]], pc=[px+c[0],py+c[1],pz+c[2]], pd=[px+d[0],py+d[1],pz+d[2]];
          emitTri(pa, pb, pc); emitTri(pa, pc, pd);
        }
      } else if (ch === '2' && raw[1] === ' ') {
        const t = raw.split(/\s+/);
        if (t.length >= 8 && edges.length < 4800) {
          const a = m3v(pm,+t[2],+t[3],+t[4]), b = m3v(pm,+t[5],+t[6],+t[7]);
          emitEdge([px+a[0],py+a[1],pz+a[2]], [px+b[0],py+b[1],pz+b[2]]);
        }
      } else if (ch === '1' && raw[1] === ' ') {
        const t = raw.split(/\s+/);
        if (t.length >= 15) {
          const lx=+t[2], ly=+t[3], lz=+t[4];
          const lm=[+t[5],+t[6],+t[7], +t[8],+t[9],+t[10], +t[11],+t[12],+t[13]];
          const v = m3v(pm, lx, ly, lz);
          const nx = px+v[0], ny = py+v[1], nz = pz+v[2];
          const nm = mat3Mul(pm, lm);
          const ref = normId(t.slice(14).join(' '));
          const base = ref.split('/').pop();
          // Fast studs & skip hidden underside tubes/recesses!
          if (base === 'stud' || base === 'stud2' || base === 'stud2a' || base === 'studp01') {
            emitFastStud(nx, ny, nz, nm, base.startsWith('stud2')); continue;
          }
          if (/^(stud3|stud4|stud4a|stud10|stud15|axlehol[2-9]|axleho10|npeghol|beamhol)/.test(base)) continue;
          // Synthesize 48/ hi-res arcs as fast 10-sided primitives instead of 48-sided!
          if (emitSynthPrim(base, nx, ny, nz, nm)) continue;
          const sub = lookupEmbeddedDat(ref);
          if (sub) walk(sub.lines, nx, ny, nz, nm, depth + 1);
        }
      }
    }
  };
  const [rootOx, rootOy, rootOz] = found.offset || [0, 0, 0];
  walk(found.lines, rootOx, rootOy, rootOz, R_ID, 0);

  if (tris.length === 0) { embeddedDatCompiled.set(k, null); return null; }
  const res = {
    tris: new Float32Array(tris),
    norms: new Float32Array(norms),
    edges: new Float32Array(edges),
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
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

  const emitSingleLeaf = (leafPart, isNew, isSelected, offX, offY, offZ, hingeRad) => {
    const def = resolvePart(leafPart.p);
    const cInfo = COLORS[leafPart.c] || COLORS[71];
    const isFaded = !isNew && opts.fadePrev;
    const isRealTrans = (cInfo.alpha || 1) < 0.96;
    // Fade solid earlier bricks via clean color muting (NOT alpha transparency with depthMask=false!)
    // so bricks underneath ALWAYS stay properly depth-occluded by plates above them!
    const fadeMix = isFaded
      ? Math.max(0, Math.min(0.76, (1.0 - opts.fadeOpacity) * 0.95 + (opts.fadeOpacity < 0.99 ? 0.16 : 0)))
      : 0;
    const baseCol = isSelected ? [26, 115, 232] : hexToRgb255(cInfo.hex, fadeMix);
    const edgeCol = isSelected
      ? [255, 255, 255]
      : (isNew && opts.highlightNew ? hexToRgb255(opts.highlightColor, 0) : hexToRgb255(cInfo.edge, fadeMix * 0.85));
    const aByte = isRealTrans
      ? Math.round(255 * (cInfo.alpha || 0.7) * (isFaded ? Math.max(0.55, opts.fadeOpacity) : 1))
      : 255;
    const m = leafPart.m || R_ID;
    const ox = leafPart.x + offX, oy = leafPart.y + offY, oz = leafPart.z + offZ;

    const compiled = compileEmbeddedDat(leafPart.p);
    if (compiled) {
      const T = compiled.tris, N = compiled.norms, E = compiled.edges;
      for (let i = 0; i < T.length; i += 9) {
        const a = xformPt([T[i],T[i+1],T[i+2]], m, ox, oy, oz, hingeRad);
        const b = xformPt([T[i+3],T[i+4],T[i+5]], m, ox, oy, oz, hingeRad);
        const c = xformPt([T[i+6],T[i+7],T[i+8]], m, ox, oy, oz, hingeRad);
        const n = xformNorm([N[i],N[i+1],N[i+2]], m, hingeRad);
        pushTri(a, b, c, n, baseCol, aByte);
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
      // Bare minifigure torso (matches LDraw 973.dat origin: y=0 shoulders, y=-32 waist, neck +0..+10)
      addBox(0,-16,0, 30,32,15, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0,5.0,0, 5.8,5.8,10,'y',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'mf_torso') {
      const sh = isBrickLinkTorsoAssemblyId(normId(leafPart.p)) ? [-20, 32, -10] : [0, 0, 0];
      addBox(sh[0],sh[1]-16,sh[2], 30,32,15, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addBox(sh[0]-18.5,sh[1]-17,sh[2], 7,24,8, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addBox(sh[0]+18.5,sh[1]-17,sh[2], 7,24,8, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(sh[0],sh[1]+5.0,sh[2], 5.8,5.8,10,'y',10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
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
      for (const ch of part.children) emitSingleLeaf(ch, isNew, isSel, offX, offY, offZ, hingeRad);
    } else {
      emitSingleLeaf(part, isNew, isSel, offX, offY, offZ, hingeRad);
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
  computeMVP(mesh, w, h, azDeg, elDeg, zoom = 1) {
    const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
    // Tight near/far ortho depth range around full model radius for 4x sharper Z-buffer occlusion!
    const clipRadius = Math.max(mesh.fullRadius || mesh.radius, mesh.radius);
    const dist = clipRadius * 2.5;
    const eye = [mesh.center[0]+dist*Math.sin(az)*Math.cos(el), mesh.center[1]+dist*Math.sin(el), mesh.center[2]+dist*Math.cos(az)*Math.cos(el)];
    const halfH = (mesh.radius * 1.12) / Math.max(0.4, zoom);
    const halfW = halfH * (w / Math.max(1, h));
    const near = Math.max(1, dist - clipRadius * 2.2);
    const far = dist + clipRadius * 2.2;
    return mulMat4(orthoMat4(-halfW, halfW, -halfH, halfH, near, far), lookAtMat4(eye, mesh.center, [0, 1, 0]));
  }
  draw(mesh, w, h, azDeg, elDeg, zoom = 1) {
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

    const mvp = this.computeMVP(mesh, w, h, azDeg, elDeg, zoom);
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
  let samplePart;
  if (part.children && part.children.length > 0) {
    // Re-center composite assembly at origin for clean thumbnail
    const cx = part.x, cy = part.y, cz = part.z;
    samplePart = {
      id: 't', p: part.p, c: part.c, x: 0, y: 0, z: 0, m: R_ID,
      children: part.children.map(ch => ({ ...ch, x: ch.x - cx, y: ch.y - cy, z: ch.z - cz })),
    };
  } else {
    samplePart = { id: 't', p: part.p, c: part.c, x: 0, y: 0, z: 0, m: R_ID };
  }
  const mesh = buildMeshBuffers([], [samplePart], { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  snapshotEngine.draw(mesh, 112, 112, 38, 28, 1.05);
  const url = snapshotCanvas.toDataURL('image/png');
  if (pliThumbCache.size > 220) pliThumbCache.clear();
  pliThumbCache.set(key, url);
  return url;
}

function renderSnapshot(prev, next, az, el, w, h, zoom, opts) {
  const mesh = buildMeshBuffers(prev, next, opts);
  const mvp = snapshotEngine.draw(mesh, w, h, az, el, zoom);
  return { url: snapshotCanvas.toDataURL('image/png'), mesh, mvp, w, h };
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
    if (def.shape === 'mf_torso' || def.shape === 'mf_torso_body') {
      const sh = (def.shape === 'mf_torso' && isBrickLinkTorsoAssemblyId(normId(part.p))) ? [-20, 32, -10] : [0, 0, 0];
      lMin = [sh[0] - hx, sh[1] - def.h, sh[2] - hz];
      lMax = [sh[0] + hx, sh[1] + 10, sh[2] + hz];
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
  if (/minifig|hair|headgear|utensil|broom|cup|mug|book|laptop|bag|scarf|head/.test(name) || part.children) return 'figure';
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

// Strict contact check: rejects empty AABB corners of round wheels grazing nearby bogie side plates!
function boxesPhysicallyTouch(a, b, roleA, roleB) {
  const isWheelPair = (roleA === 'wheel' || roleB === 'wheel');
  const otherIsHolder = (roleA === 'wheel_holder' || roleB === 'wheel_holder');
  if (isWheelPair && otherIsHolder) {
    // Wheel clips into wheel holder pin slots (can be up to 6 LDU clearance along axle)
    const gx = Math.max(0, a.min[0]-b.max[0], b.min[0]-a.max[0]);
    const gy = Math.max(0, a.min[1]-b.max[1], b.min[1]-a.max[1]);
    const gz = Math.max(0, a.min[2]-b.max[2], b.min[2]-a.max[2]);
    return Math.max(gx, gy, gz) <= 6.0;
  }
  const tol = isWheelPair ? 0.5 : 2.8;
  const gx = Math.max(0, a.min[0]-b.max[0], b.min[0]-a.max[0]);
  const gy = Math.max(0, a.min[1]-b.max[1], b.min[1]-a.max[1]);
  const gz = Math.max(0, a.min[2]-b.max[2], b.min[2]-a.max[2]);
  if (gx > tol || gy > tol || gz > tol) return false;
  // Require real contact overlap on at least 2 axes so grazing corners don't falsely bond!
  const ovX = Math.min(a.max[0], b.max[0]) - Math.max(a.min[0], b.min[0]);
  const ovY = Math.min(a.max[1], b.max[1]) - Math.max(a.min[1], b.min[1]);
  const ovZ = Math.min(a.max[2], b.max[2]) - Math.max(a.min[2], b.min[2]);
  const minOv = isWheelPair ? 10 : 1.5;
  const goodAxes = (ovX >= minOv ? 1 : 0) + (ovY >= minOv ? 1 : 0) + (ovZ >= minOv ? 1 : 0);
  if (isWheelPair && !otherIsHolder) return false; // Train wheels attach ONLY via their wheel holder / axle!
  return goodAxes >= 2;
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

  candidates.sort((a, b) => b.savings - a.savings || b.count - a.count || b.size - a.size);
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

// Build bottom-up zero-floating steps for 1 canonical copy of a duplicate submodel
function buildLocalSubmodelSteps(canonicalParts, perStep, groupId, repeatCount) {
  const n = canonicalParts.length;
  const boxes = canonicalParts.map(p => computeWorldBox(p));
  const roles = canonicalParts.map(p => classifyPartRole(p));
  const claddingFlags = canonicalParts.map((p, i) => isSidewaysCladdingPart(p, boxes[i]));
  const layerY = canonicalParts.map((p, i) => computeBuildLayerY(p, boxes[i]));
  const adj = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (boxesPhysicallyTouch(boxes[i], boxes[j], roles[i], roles[j])) {
        adj[i].push(j); adj[j].push(i);
      }
    }
  }
  const subPerStep = Math.max(2, Math.min(perStep, n <= 4 ? 2 : 4));
  const placed = new Set();
  const remaining = new Set(Array.from({ length: n }, (_, i) => i));
  const steps = [];
  let sNum = 0;

  while (remaining.size > 0) {
    let frontier;
    if (placed.size === 0) {
      const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i]);
      const pool = nonWheels.length > 0 ? nonWheels : Array.from(remaining);
      pool.sort((a, b) => layerY[a] - layerY[b]);
      frontier = pool;
    } else {
      const rawFrontier = Array.from(remaining).filter(i => adj[i].some(nb => placed.has(nb)));
      const readyFrontier = rawFrontier.filter(i => !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed));
      frontier = readyFrontier.length > 0 ? readyFrontier : rawFrontier;
      if (frontier.length === 0) frontier = Array.from(remaining).sort((a, b) => layerY[a] - layerY[b]);
      frontier.sort((a, b) => (roles[a] === 'wheel' ? 1 : 0) - (roles[b] === 'wheel' ? 1 : 0) || Math.round(layerY[a]/8) - Math.round(layerY[b]/8));
    }
    const anchor = frontier[0];
    const anchorY = layerY[anchor];
    const stepIdx = [anchor];
    remaining.delete(anchor); placed.add(anchor);

    while (stepIdx.length < subPerStep && remaining.size > 0) {
      const cands = Array.from(remaining).filter(i =>
        Math.abs(layerY[i] - anchorY) <= 18
        && !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed)
        && adj[i].some(nb => placed.has(nb))
      );
      if (cands.length === 0) break;
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
  // Indicate ×N on ONLY the last step of the submodel!
  if (steps.length > 0) {
    steps[steps.length - 1].isSubmodelFinal = true;
    steps[steps.length - 1].submodelRepeat = repeatCount;
  }
  return steps;
}

// ZERO-FLOATING CHASSIS-FIRST STEP GENERATOR (with automatic duplicate submodel chapters!)
function buildManualFromParsed(parsed, mode) {
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
    return { title: parsed.title, subtitle: `${parts.length} pieces · ${globalStep} steps`, chapters, _parsed: parsed, _mode: mode };
  }

  // 1. Build strict physical adjacency graph (wheel-aware!)
  const adj = Array.from({ length: parts.length }, () => []);
  for (let i = 0; i < parts.length; i++) {
    for (let j = i + 1; j < parts.length; j++) {
      if (boxesPhysicallyTouch(boxes[i], boxes[j], roles[i], roles[j])) {
        adj[i].push(j); adj[j].push(i);
      }
    }
  }
  // Fallback for any isolated wheel/detail whose axle wasn't tagged wheel_holder: connect to nearest structural/axle neighbor
  for (let i = 0; i < parts.length; i++) {
    parts[i]._detachedGap = 0;
    if (adj[i].length > 0) continue;
    let bestJ = -1, bestD = 12;
    for (let j = 0; j < parts.length; j++) {
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

  // 1a. Whole-Minifigure Assembly Grouping (NEVER build just a head — always build the entire figure together!)
  const classifyMinifigPiece = (part) => {
    const k = normId(part.p);
    const name = (resolvePart(part.p).name || '').toLowerCase();
    const childKeys = (part.children || []).map(c => normId(c.p)).join(' ');
    const combo = `${k} ${childKeys}`;
    if (/(?:^|\s)(?:asm_)?(?:bl_)?(?:3815|3816|3817|970|41879|16709)/i.test(combo) || /\bhips\b|minifig.*leg/i.test(name)) return 'legs';
    if (/(?:^|\s)(?:asm_)?(?:bl_)?(?:973|3818|3819|3820)/i.test(combo) || /minifig.*torso|torso assembly/i.test(name)) return 'torso';
    if (/(?:^|\s)(?:bl_)?(?:3626|28621)/i.test(combo) || /minifig.*head\b/i.test(name)) return 'head';
    if (/(?:^|\s)(?:bl_)?(?:76925|26066|11303|66913|21778|98385|11256|61976|25376|93091|24093|3842)/i.test(combo) ||
        /hair|helmet|hat|cap|hood|headgear|visor|crown|scarf|cape|armor|backpack|bag|ponytail|wig|beard|glasses|utensil|minifig.*accessory/i.test(name)) return 'headgear';
    return null;
  };
  const mfKinds = parts.map(p => classifyMinifigPiece(p));
  const mfClaimed = new Uint8Array(parts.length);
  const minifigGroups = [];

  // Stage A: Explicit minifigure submodels (any submodel of 2..12 parts containing >= 2 core body types among legs/torso/head)
  const mfSubInsts = new Map();
  for (let i = 0; i < parts.length; i++) {
    for (const entry of (parts[i].subChain || [])) {
      if (!mfSubInsts.has(entry.instId)) mfSubInsts.set(entry.instId, { name: entry.name, indices: [] });
      mfSubInsts.get(entry.instId).indices.push(i);
    }
  }
  const mfSubCands = Array.from(mfSubInsts.values())
    .filter(r => r.indices.length >= 2 && r.indices.length <= 12)
    .sort((a, b) => a.indices.length - b.indices.length);
  for (const rec of mfSubCands) {
    if (rec.indices.some(i => mfClaimed[i])) continue;
    const core = new Set(rec.indices.map(i => mfKinds[i]).filter(t => t === 'legs' || t === 'torso' || t === 'head'));
    if (core.size >= 2) {
      rec.indices.forEach(i => { mfClaimed[i] = 1; parts[i]._detachedGap = 0; });
      minifigGroups.push({ name: rec.name || `Minifigure ${minifigGroups.length + 1}`, indices: rec.indices });
    }
  }

  // Stage B: Geometric whole-body minifigure detection (works even on flat .ldr files with ZERO submodels!)
  for (let t = 0; t < parts.length; t++) {
    if (mfClaimed[t] || mfKinds[t] !== 'torso') continue;
    const tc = boxes[t].center;
    const grp = [t];
    // Nearest unclaimed legs below/at torso
    let bestLegs = -1, bestLegsD = 58;
    for (let j = 0; j < parts.length; j++) {
      if (mfClaimed[j] || mfKinds[j] !== 'legs') continue;
      const c = boxes[j].center;
      const hDist = Math.hypot(c[0] - tc[0], c[2] - tc[2]);
      const vDist = Math.abs(c[1] - tc[1]);
      if (hDist <= 34 && vDist <= 56 && hDist + vDist * 0.6 < bestLegsD) { bestLegsD = hDist + vDist * 0.6; bestLegs = j; }
    }
    if (bestLegs >= 0) grp.push(bestLegs);
    // Nearest unclaimed head above torso
    let bestHead = -1, bestHeadD = 62;
    for (let j = 0; j < parts.length; j++) {
      if (mfClaimed[j] || mfKinds[j] !== 'head') continue;
      const c = boxes[j].center;
      const hDist = Math.hypot(c[0] - tc[0], c[2] - tc[2]);
      const dy = c[1] - tc[1];
      if (hDist <= 30 && dy >= -10 && dy <= 72 && hDist + Math.abs(dy - 36) * 0.5 < bestHeadD) {
        bestHeadD = hDist + Math.abs(dy - 36) * 0.5; bestHead = j;
      }
    }
    if (bestHead >= 0) grp.push(bestHead);
    // Attach nearby headgear / collar / accessories belonging to this figure
    const anchors = grp.map(idx => boxes[idx].center);
    for (let j = 0; j < parts.length; j++) {
      if (mfClaimed[j] || grp.includes(j) || mfKinds[j] !== 'headgear') continue;
      const c = boxes[j].center;
      const near = anchors.some(ac => Math.hypot(c[0] - ac[0], c[1] - ac[1], c[2] - ac[2]) <= 46);
      if (near) grp.push(j);
    }
    if (grp.length >= 2) {
      grp.forEach(i => { mfClaimed[i] = 1; parts[i]._detachedGap = 0; });
      minifigGroups.push({ name: `Minifigure ${minifigGroups.length + 1}`, indices: grp });
    }
  }

  // Safety net: merge any remaining unclaimed head (+ touching headgear) into the closest minifigure missing a head
  for (let h = 0; h < parts.length; h++) {
    if (mfClaimed[h] || mfKinds[h] !== 'head') continue;
    const hc = boxes[h].center;
    let bestG = null, bestD = 75;
    for (const g of minifigGroups) {
      if (g.indices.some(idx => mfKinds[idx] === 'head')) continue;
      for (const idx of g.indices) {
        const c = boxes[idx].center;
        const d = Math.hypot(c[0] - hc[0], c[1] - hc[1], c[2] - hc[2]);
        if (d < bestD) { bestD = d; bestG = g; }
      }
    }
    if (bestG) {
      bestG.indices.push(h); mfClaimed[h] = 1; parts[h]._detachedGap = 0;
      for (let j = 0; j < parts.length; j++) {
        if (mfClaimed[j] || mfKinds[j] !== 'headgear') continue;
        const c = boxes[j].center;
        if (Math.hypot(c[0] - hc[0], c[1] - hc[1], c[2] - hc[2]) <= 36) {
          bestG.indices.push(j); mfClaimed[j] = 1; parts[j]._detachedGap = 0;
        }
      }
    }
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

  // 3. Emit complete Minifigures chapter FIRST (1 whole minifigure per step), then Chassis-First Main Build!
  const chapters = [];
  const emittedSubChapters = new Set();
  let globalStep = 0, chSeq = 0;

  if (minifigGroups.length > 0) {
    const mfSteps = minifigGroups.map((mg) => {
      globalStep++;
      const order = { legs: 0, torso: 1, head: 2, headgear: 3 };
      const sortedIdx = [...mg.indices].sort((a, b) =>
        (order[mfKinds[a]] ?? 4) - (order[mfKinds[b]] ?? 4) || boxes[a].min[1] - boxes[b].min[1]
      );
      return {
        id: `mf_s${globalStep}`,
        num: globalStep,
        side: 'top',
        corner: 'front_right',
        cue: 'none',
        isStandaloneFigure: true,
        parts: sortedIdx.map(i => parts[i]),
      };
    });
    chapters.push({
      id: `ach_${++chSeq}`,
      name: minifigGroups.length === 1 ? 'Minifigure' : 'Minifigures',
      kind: 'minifigure',
      sectionId: 'sec_minifigs',
      steps: mfSteps,
    });
  }

  groupedComps.forEach((group, secIdx) => {
    const sectionId = `sec_${secIdx + 1}`;
    const isFigSec = false;
    const indices = group.indices;
    const placed = new Set();
    const remaining = new Set(indices);
    let curSteps = [];

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
        const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i]);
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
          if (isAnchorInst || touchesPlaced) readyInsts.push(unplacedInSec);
        });

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

        const attachIndices = readyInsts.flat();
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
        continue;
      }

      // NORMAL STEP (non-duplicate-submodel bricks)
      const anchorY = layerY[anchor];
      const anchorC = boxes[anchor].center;
      const stepIndices = [anchor];
      remaining.delete(anchor);
      placed.add(anchor);

      while (stepIndices.length < perStep && remaining.size > 0) {
        const cands = Array.from(remaining).filter(i => {
          if (partToDup.has(i)) return false;
          if (isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed)) return false;
          if (Math.abs(layerY[i] - anchorY) > 18) return false;
          if (!adj[i].some(nb => placed.has(nb))) return false;
          const d = Math.hypot(boxes[i].center[0]-anchorC[0], boxes[i].center[1]-anchorC[1], boxes[i].center[2]-anchorC[2]);
          return d <= 160;
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
      curSteps.push({
        id: `ac${secIdx+1}_s${globalStep}`,
        num: globalStep,
        side: 'top', corner: 'front_right', cue: 'none',
        parts: stepIndices.map(i => parts[i]),
      });
    }
    flushMainSteps();
  });

  const dupSummary = dupGroups.length > 0 ? ` · ${dupGroups.length} repeated submodel${dupGroups.length === 1 ? '' : 's'}` : '';
  return { title: parsed.title, subtitle: `${parts.length} pieces · ${globalStep} steps${dupSummary}`, chapters, _parsed: parsed, _mode: mode };
}

// Built-in Sample Model (includes fused minifigure + a genuine ×2 duplicate submodel showcase!)
function buildSampleModel() {
  const mk = (id, p, c, x, y, z) => ({ id, p, c, x, y, z, m: R_ID });
  const solarCanon = [mk('sc1','3023',15,0,8,0), mk('sc2','60470b',72,20,8,0), mk('sc3','3068b',1,0,16,0)];
  return {
    title: 'Orbital Rover',
    subtitle: 'Sample · 19 pieces · 5 steps · 1 repeated submodel',
    chapters: [
      {
        id: 'ch_mf', name: 'Astronaut', kind: 'minifigure', sectionId: 'sec_mf',
        steps: [
          { id:'s1', num:1, side:'top', corner:'front_right', cue:'none', parts:[mk('m1','3815c01',15,0,28,0), mk('m2','973c01',15,0,56,0)] },
          { id:'s2', num:2, side:'top', corner:'front_right', cue:'none', parts:[mk('m3','3626cp01',14,0,80,0), mk('m4','3842a',15,0,84,0)] },
        ],
      },
      {
        id: 'ch_main_1', name: 'Rover Chassis', kind: 'main', sectionId: 'sec_main',
        steps: [
          { id:'s3', num:3, side:'top', corner:'front_right', cue:'none', parts:[mk('r1','3031',72,0,8,0), mk('r2','3020',71,-30,16,0), mk('r3','3020',71,30,16,0)] },
          { id:'s4', num:4, side:'top', corner:'front_right', cue:'none', parts:[mk('r4','3001',15,0,40,0), mk('r5','4733',72,-30,40,0), mk('r6','4733',72,30,40,0), mk('r7','4519',0,0,48,0)] },
        ],
      },
      {
        id: 'ch_sub_solar', name: 'Solar Array', kind: 'submodel', sectionId: 'sub_solar', repeatCount: 2, canonicalParts: solarCanon,
        steps: [
          { id:'sub_s1', num:1, side:'top', corner:'front_right', cue:'none', isSubmodelStep:true, parts:[solarCanon[0], solarCanon[1]] },
          { id:'sub_s2', num:2, side:'top', corner:'front_right', cue:'none', isSubmodelStep:true, isSubmodelFinal:true, submodelRepeat:2, parts:[solarCanon[2]] },
        ],
      },
      {
        id: 'ch_main_2', name: 'Rover Chassis', kind: 'main', sectionId: 'sec_main',
        steps: [
          {
            id:'s5', num:5, side:'top', corner:'back_left', cue:'yaw_180',
            attachedSubmodel: { id:'sub_solar', name:'Solar Array', repeatCount:2, totalRepeatCount:2, canonicalParts: solarCanon },
            parts:[mk('r8','3023',15,-46,24,0), mk('r9','3068b',1,-46,32,0), mk('r10','3023',15,46,24,0), mk('r11','3068b',1,46,32,0), mk('r12','30374',71,0,66,0)],
          },
        ],
      },
    ],
  };
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
  mode: 'pan',             // pan | select | rotate | arrange
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
function getAllParts(model) { return getMainSteps(model).flatMap(x => x.step.parts); }
function renumberContinuousSteps(model) {
  let mainNum = 0;
  for (const ch of model.chapters) {
    if (ch.kind === 'submodel') {
      ch.steps.forEach((s, idx) => {
        s.num = idx + 1;
        s.isSubmodelStep = true;
        s.isSubmodelFinal = idx === ch.steps.length - 1;
        s.submodelRepeat = ch.repeatCount || 2;
      });
    } else {
      for (const s of ch.steps) s.num = ++mainNum;
    }
  }
}
function getPreviousPartsForStep(model, ch, step) {
  const prev = [];
  if (step.isStandaloneFigure) return prev;
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
  if (part.children || /minifig|torso|legs|head|hair|helmet|hat|utensil|hand|cape|arm/.test(name)) return [7, 'Minifigures'];
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
      const cap = state.layout === 'auto'
        ? (first.subassembly || first.attachedSubmodel || first.parts.length >= 6 ? 1 : 2)
        : (state.layout === '1-up' ? 1 : state.layout === '2-up' ? 2 : 4);
      const slots = [];
      for (let k = 0; k < cap && i < ch.steps.length; k++) {
        const s = ch.steps[i];
        if (k > 0 && state.overrides[s.id]?.pin) break;
        if (k > 0 && (s.subassembly || s.attachedSubmodel) && state.layout === 'auto') break;
        slots.push({ ch, step: s });
        i++;
        if ((s.subassembly || s.attachedSubmodel) && state.layout === 'auto') break;
      }
      const stepRange = slots.length === 1 ? `Step ${slots[0].step.num}` : `Steps ${slots[0].step.num}–${slots[slots.length-1].step.num}`;
      const label = isSubCh ? `${ch.name} ×${ch.repeatCount} · ${stepRange}` : stepRange;
      const pgId = 'pg_' + slots[0].step.id;
      pages.push({
        id: pgId,
        kind: 'steps',
        num: ++pNum,
        label,
        chapterName: isSubCh ? `${ch.name} (×${ch.repeatCount})` : ch.name,
        isSubmodelPage: isSubCh,
        submodelIntro: (isSubCh && isFirstChPage) ? {
          id: ch.id,
          name: ch.name,
          repeatCount: ch.repeatCount || 2,
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
  return { side, corner, az: ov.az ?? cObj.az, el: ov.el ?? (side === 'bottom' ? -30 : 30) };
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
  return { badge: 'SAMPLE', label: 'Built-In Sample Model', cls: 'bg-black/10 dark:bg-white/10 text-[var(--muted-foreground)]' };
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
  const theme = THEMES[state.themeId];
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

  // Update Mode Pill styling
  document.querySelectorAll('.mode-btn').forEach(b => {
    const active = b.getAttribute('data-mode') === state.mode;
    b.className = `mode-btn px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1 whitespace-nowrap transition ${
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
  frame.style.background = theme.bg;
  frame.style.color = theme.text;
  frame.classList.toggle('blueprint-grid', theme.bp);
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
        <div class="text-xs max-w-md" style="color:${theme.muted}">${escHtml(d.note || 'Switch to Arrange mode to edit this divider page or add notes/images.')}</div>
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

      // Group PLI items + detect 1:1 Actual-Size Guides (skip individual bricks when attaching a pre-built duplicate submodel!)
      const pliMap = new Map();
      if (!step.attachedSubmodel) {
        for (const p of step.parts) {
          const k = `${p.p}:${p.c}`;
          if (!pliMap.has(k)) pliMap.set(k, { part: p, ids: [], qty: 0, guide: getActualSizeGuide(p.p) });
          const item = pliMap.get(k);
          item.qty++; item.ids.push(p.id);
        }
      }
      return { ch, step, prev, cam, ov, snap, subImg, attSubImg, pli: Array.from(pliMap.values()) };
    });

    const isRotateMode = state.mode === 'rotate';
    const isArrangeMode = state.mode === 'arrange';
    const isTightSlot = dims.height < 360 || slots.length >= 4 || (slots.length === 2 && !dims.isLandscape && dims.height < 460);
    const pgNumText = formatPageNumber(page.num, state.pages.length);

    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col overflow-hidden ${guideCls}" style="padding:${padPx}px;padding-bottom:${padPx + 18}px">
        ${page.submodelIntro ? `
          <div class="shrink-0 mb-2 px-3 py-1.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs" style="background:${theme.calloutBg};border:1.5px solid ${theme.calloutBorder}">
            <div class="flex items-center gap-2.5 min-w-0">
              <img src="${subIntroImg}" alt="${escHtml(page.submodelIntro.name)}" class="w-14 h-11 sm:w-20 sm:h-14 object-contain shrink-0 pointer-events-none" />
              <div class="min-w-0">
                <div class="text-[9px] font-bold uppercase tracking-wider opacity-65">Submodel</div>
                <div class="text-xs sm:text-sm font-extrabold truncate">${escHtml(page.submodelIntro.name)}</div>
              </div>
            </div>
            <span class="shrink-0 px-3 py-1 rounded-full text-sm sm:text-base font-black text-white shadow-xs" style="background:${theme.accent}">×${page.submodelIntro.repeatCount}</span>
          </div>` : ''}
        <div class="grid ${gridCls} flex-1 min-h-0" style="gap:${gapPx}px">
          ${slotData.map(({ step, ov, snap, subImg, attSubImg, pli }) => {
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

            return `
              <div data-step="${step.id}" class="step-slot relative rounded-xl p-2 flex flex-col min-h-0 overflow-hidden transition" style="border:${slotBorderStyle};background:${slotBgStyle}">
                <!-- Step Number & Draggable Parts List Box -->
                <div class="relative z-10 shrink-0 flex items-start justify-between gap-1.5">
                  <div class="flex items-start gap-1.5 flex-wrap">
                    <span class="${isTightSlot ? 'text-lg' : 'text-2xl'} font-extrabold leading-none">${step.num}</span>
                    ${ov.pin ? '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900">Locked</span>' : ''}

                    ${step.attachedSubmodel ? `
                      <div data-drag="pli" data-step="${step.id}" class="draggable-el flex items-center gap-2 px-2 py-1 rounded-xl shadow-xs ${isArrangeMode ? 'cursor-move' : ''}" style="background:${theme.calloutBg};border:${pliSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${pliScale});transform-origin:top left;">
                        <img src="${attSubImg}" alt="${escHtml(step.attachedSubmodel.name)}" class="${isTightSlot ? 'w-8 h-6' : 'w-11 h-8'} object-contain pointer-events-none" />
                        <div class="leading-tight">
                          <div class="text-xs font-black" style="color:${theme.accent}">×${step.attachedSubmodel.repeatCount}</div>
                          <div class="text-[9px] font-semibold opacity-75 max-w-[96px] truncate">${escHtml(step.attachedSubmodel.name)}</div>
                        </div>
                      </div>`
                    : (!step.subassembly || ov.calloutAsPages ? `
                      <div data-drag="pli" data-step="${step.id}" class="draggable-el flex items-center gap-1.5 px-1.5 py-0.5 rounded-xl flex-wrap shadow-xs ${isArrangeMode ? 'cursor-move' : ''}" style="background:${theme.pliBg};border:${pliSel ? `2px solid ${theme.accent}` : `1px solid ${theme.pliBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${pliScale});transform-origin:top left;">
                        ${pli.slice(0, 7).map(item => {
                          const anySel = state.mode === 'select' && item.ids.some(id => state.selectedPartIds.has(id));
                          const thumb = getPliThumb(item.part);
                          return `<button type="button" data-pli-ids="${item.ids.join(',')}" data-step="${step.id}" class="pli-chip flex flex-col items-center px-0.5 py-0.5 rounded-lg transition ${anySel ? 'ring-2 ring-[#1a73e8] bg-[#1a73e8]/15' : ''}" title="${resolvePart(item.part.p).name}">
                            <div class="flex items-center gap-0.5 text-[11px] font-bold">
                              <img src="${thumb}" class="${isTightSlot ? 'w-5 h-5' : 'w-7 h-7'} object-contain pointer-events-none" />
                              <span>${item.qty}×</span>
                            </div>
                            ${state.showSizeGuides && item.guide ? `
                              <div class="flex items-center gap-1 text-[8px] font-extrabold px-1 rounded-full bg-black/10 dark:bg-white/15">
                                <span class="inline-block h-1 rounded-full bg-current" style="width:${Math.min(28, item.guide.lengthL * 3.5)}px"></span>
                                <span>1:1 ${item.guide.lengthL}L</span>
                              </div>` : ''}
                          </button>`;
                        }).join('')}
                      </div>` : '')}
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    ${state.showRotCues && step.cue && step.cue !== 'none' ? `<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white text-[#202124] shadow-xs" style="border:1.5px solid ${theme.accent}">↻ ${step.cue === 'flip_vertical' ? 'Flip Over' : step.cue === 'yaw_180' ? 'Turn 180°' : 'Rotate 90°'}</span>` : ''}
                  </div>
                </div>

                <!-- Step Visual Area (Callout + 3D Render — STRICT min-h-0 so NEVER clipped!) -->
                <div class="flex-1 min-h-0 flex ${ov.calloutDir === 'vertical' ? 'flex-col' : 'flex-row'} items-center justify-center gap-1.5 mt-1 overflow-hidden">
                  ${step.subassembly && !ov.calloutAsPages ? `
                    <div data-drag="callout" data-step="${step.id}" class="draggable-el rounded-xl p-1.5 shrink-0 w-28 sm:w-40 max-h-full flex flex-col overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="background:${theme.calloutBg};border:${calloutSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${calloutPos.x}px,${calloutPos.y}px)">
                      <div class="flex items-center justify-between gap-1 text-[10px] font-bold shrink-0">
                        <span class="truncate">${step.subassembly.name}</span>
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
                </div>
              </div>`;
          }).join('')}
        </div>

        <!-- Custom Page Inserts (Text Notes & Images — Draggable in Arrange Mode!) -->
        ${(state.pageInserts[page.id] || []).map(ins => {
          const isInsSel = isArrangeMode && state.selectedArrangeEl?.kind === 'insert' && state.selectedArrangeEl?.insertId === ins.id;
          return `<div data-drag="insert" data-insert-id="${ins.id}" class="draggable-el absolute z-20 rounded-xl p-2 ${isArrangeMode ? 'cursor-move' : ''}" style="left:${ins.x}px;top:${ins.y}px;transform:scale(${ins.scale || 1});transform-origin:top left;border:${isInsSel ? `2px solid ${theme.accent}` : '1px solid transparent'};background:${ins.kind === 'text' ? theme.pliBg : 'transparent'}">
            ${ins.kind === 'text'
              ? `<div class="text-xs font-bold max-w-[200px] leading-snug">${ins.text}</div>`
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
    box.innerHTML = `
      <div class="pointer-events-auto glass-pill rounded-3xl p-3 w-full space-y-2 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <span class="font-bold">Step ${step.num} · Drag 3D to orbit</span>
          <div class="flex items-center gap-1 flex-wrap">
            <button id="camTop" class="px-2 py-1 rounded-full font-semibold ${cam.side === 'top' ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">Top</button>
            <button id="camBot" class="px-2 py-1 rounded-full font-semibold ${cam.side === 'bottom' ? 'bg-[#1a73e8] text-white' : 'bg-black/5 dark:bg-white/10'}">Bottom</button>
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
            ${CORNERS.map(c => `<button data-corner="${c.id}" class="corner-btn px-2.5 py-1 rounded-full text-[11px] font-semibold ${cam.corner === c.id ? 'bg-[#1a73e8]/15 text-[#1a73e8] ring-1 ring-[#1a73e8]' : 'bg-black/5 dark:bg-white/10'}">${c.label}</button>`).join('')}
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
      state.overrides[step.id] = { ...cur, side: nextSide, corner: nextCorner, az: cObj.az, el: nextSide === 'bottom' ? -30 : 30 };
      renderAll();
    };
    box.querySelector('#camTop').onclick = () => setCam({ side: 'top' });
    box.querySelector('#camBot').onclick = () => setCam({ side: 'bottom' });
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
    const act = t.id === state.themeId;
    b.className = `p-2.5 rounded-2xl border text-left transition ${act ? 'border-[#1a73e8] ring-2 ring-[#1a73e8]/25' : 'border-[var(--border)]'}`;
    b.innerHTML = `<div class="h-6 rounded-lg mb-1.5 border border-black/10" style="background:${t.bg}"></div><div class="text-xs font-semibold">${t.name}</div>`;
    b.onclick = () => { state.themeId = t.id; renderAll(); };
    pg.appendChild(b);
  }
}

function renderOverviewModal() {
  const list = document.getElementById('overviewList');
  list.innerHTML = '';
  state.pages.forEach((pg, idx) => {
    const active = idx === state.pageIdx;
    const row = document.createElement('div');
    row.className = `flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border cursor-pointer transition ${active ? 'border-[#1a73e8] bg-[#1a73e8]/10' : 'border-[var(--border)] bg-[var(--background)]'}`;
    const firstStep = pg.slots?.[0]?.step;
    const pinned = firstStep && state.overrides[firstStep.id]?.pin;
    row.innerHTML = `
      <div class="min-w-0">
        <div class="font-bold truncate">Page ${pg.num} · ${pg.label}</div>
        ${pg.chapterName ? `<div class="text-[11px] text-[var(--muted-foreground)] truncate">${pg.chapterName}</div>` : ''}
      </div>
      <div class="flex items-center gap-1 shrink-0">
        ${firstStep ? `<button class="ov-pin px-2.5 py-1 rounded-full text-[11px] font-semibold border ${pinned ? 'bg-[#1a73e8] text-white border-transparent' : 'border-[var(--border)] bg-[var(--card)]'}">${pinned ? '🔒 Locked' : 'Lock Page'}</button>` : ''}
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
        state.overrides[firstStep.id] = { ...(state.overrides[firstStep.id] || {}), pin: !pinned };
        renderAll();
        renderOverviewModal();
      };
    }
    list.appendChild(row);
  });
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
    } else if (t.length === 1 && state.mode === 'pan') {
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
    } else if (modeTouch === 'pan' && t.length === 1 && state.mode === 'pan') {
      e.preventDefault();
      if (Math.hypot(t[0].clientX - startX, t[0].clientY - startY) > 10) touchMoved = true;
      state.panX = startPanX + (t[0].clientX - startX);
      state.panY = startPanY + (t[0].clientY - startY);
      applyStageTransform();
    }
  }, { passive: false });

  const endTouch = (e) => {
    const t = e.touches;
    if (t.length === 1 && state.mode === 'pan') {
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

  // Desktop mouse drag panning (Pan mode only)
  let mouseDragging = false;
  stage.addEventListener('mousedown', (e) => {
    if (!state.model || state.mode !== 'pan' || e.button !== 0) return;
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
      if (state.model._parsed) state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto');
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
  const enqueue = (rawId) => {
    const k = normId(rawId);
    const base = k.split('/').pop();
    if (!k || queued.has(k) || lookupEmbeddedDat(k)) return;
    // Skip standard studs/arcs we already synthesize procedurally at high speed!
    if (/^(stud|stud2|stud2a|stud3|stud4|stud4a|stud10|stud15|studp01|axlehol|npeghol|beamhol|\d+-\d+(cyli|cylo|disc|edge|ring\d+|chrd|ndis))$/.test(base)) return;
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
      if (fetched > 0 && state.model._parsed) state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto');
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

let lastSourceRecord = null; // { kind:'io'|'ldr'|'sample'|'project', fileName, data, importMode }
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
      showSizeGuides: state.showSizeGuides, showStepBorders: state.showStepBorders,
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
  const rec = await dbGet('lastModel');
  if (!rec) { renderAll(); return; }
  const prefs = (await dbGet('prefs')) || {};
  try {
    if (prefs.themeId) state.themeId = prefs.themeId;
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
    if (typeof prefs.showStepBorders === 'boolean') state.showStepBorders = prefs.showStepBorders;
    if (typeof prefs.showPageTitle === 'boolean') state.showPageTitle = prefs.showPageTitle;
    if (prefs.pageNumberFormat) state.pageNumberFormat = prefs.pageNumberFormat;
    if (typeof prefs.showExtras === 'boolean') state.showExtras = prefs.showExtras;
    if (prefs.bomConfig) state.bomConfig = { ...state.bomConfig, ...prefs.bomConfig };

    if (rec.kind === 'sample') {
      state.model = buildSampleModel();
    } else if (rec.kind === 'io' && rec.data) {
      const { m1Text, m2Text } = await extractIoArchive(rec.data);
      const parsed = parseImportedModel(m1Text, m2Text, rec.fileName);
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto');
    } else if (rec.kind === 'ldr' && typeof rec.data === 'string') {
      const parsed = parseImportedModel(rec.data, '', rec.fileName);
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto');
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
  const theme = THEMES[state.themeId];
  const allParts = getAllParts(state.model);
  const allSteps = getAllSteps(state.model);

  // Fill background
  if (theme.id === 'blue') {
    const g = ctx.createLinearGradient(0, 0, 0, pxH); g.addColorStop(0, '#d8ecfd'); g.addColorStop(1, '#b7daf9');
    ctx.fillStyle = g;
  } else if (theme.id === 'dark') {
    const g = ctx.createLinearGradient(0, 0, pxW, pxH); g.addColorStop(0, '#1a1d24'); g.addColorStop(1, '#101218');
    ctx.fillStyle = g;
  } else if (theme.id === 'blueprint') {
    ctx.fillStyle = '#0d3b66';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.fillRect(0, 0, pxW, pxH);

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

    const slots = page.slots;
    const isLand = pxW >= pxH;
    const cols = slots.length === 1 ? 1 : slots.length === 2 ? (isLand ? 2 : 1) : 2;
    const rows = Math.ceil(slots.length / cols);
    const gap = Math.round(pad * 0.55);

    // Optional Finished Submodel + ×N Intro Banner at top of submodel's first page
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

      const thumbUrl = getSubmodelThumb(sub, 260, 160);
      if (thumbUrl) {
        const introImg = await loadImgPromise(thumbUrl);
        drawContain(ctx, introImg, pad + 14, pad + 8, Math.round(bannerH * 1.45), bannerH - 16);
      }
      const textX = pad + 14 + Math.round(bannerH * 1.45) + 14;
      ctx.fillStyle = theme.muted;
      ctx.font = `700 ${Math.round(bannerH * 0.16)}px -apple-system, sans-serif`;
      ctx.fillText('SUBMODEL', textX, pad + Math.round(bannerH * 0.2));
      ctx.fillStyle = theme.text;
      ctx.font = `800 ${Math.round(bannerH * 0.28)}px -apple-system, sans-serif`;
      ctx.fillText(sub.name || 'Submodel', textX, pad + Math.round(bannerH * 0.44));

      const multLabel = `×${sub.repeatCount}`;
      const pillFont = Math.round(bannerH * 0.34);
      ctx.font = `900 ${pillFont}px -apple-system, sans-serif`;
      const pillW = Math.max(Math.round(bannerH * 0.95), Math.round(ctx.measureText(multLabel).width + 32));
      const pillH = Math.round(bannerH * 0.54);
      const pillX = pad + bannerW - pillW - 18;
      const pillY = pad + Math.round((bannerH - pillH) / 2);
      drawRRect(pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(multLabel, pillX + pillW / 2, pillY + pillH / 2 + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

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

      // PLI Box (shows finished submodel thumbnail + ×N on attachment steps, or raw parts otherwise)
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
        const attUrl = getSubmodelThumb(att, 160, 120);
        if (attUrl) {
          const attImg = await loadImgPromise(attUrl);
          drawContain(ctx, attImg, pliX + 6, pliY + 4, pliH * 1.25, pliH - 8);
        }
        const tx = pliX + 6 + pliH * 1.25 + 8;
        ctx.fillStyle = theme.accent;
        ctx.font = `900 ${Math.round(pliH * 0.36)}px -apple-system, sans-serif`;
        ctx.fillText(`×${att.repeatCount}`, tx, pliY + Math.round(pliH * 0.14));
        ctx.fillStyle = theme.text;
        ctx.font = `600 ${Math.round(pliH * 0.24)}px -apple-system, sans-serif`;
        ctx.fillText(att.name || 'Submodel', tx, pliY + Math.round(pliH * 0.56), Math.max(40, attBoxW - (tx - pliX) - 8));
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

      // 3D Step Render
      const prev = getPreviousPartsForStep(state.model, ch, step);
      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const snap = renderSnapshot(prev, step.parts, cam.az, cam.el, 760, 520, ov.modelScale || 1.0, {
        highlightNew: state.highlightNew, highlightColor: state.highlightColor,
        fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity,
        showArrows: true, accent: theme.accent, ov, partOffsets: ov.partOffsets || {},
      });
      const stepImg = await loadImgPromise(snap.url);
      drawContain(ctx, stepImg, sx + 10, sy + pliH + 18, slotW - 20, slotH - pliH - 28);

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

document.getElementById('btnStylePop').onclick = () => {
  document.getElementById('stylePopover').classList.toggle('hidden');
  syncMenuControls();
};
document.getElementById('btnCloseStyle').onclick = () => document.getElementById('stylePopover').classList.add('hidden');

document.getElementById('btnPageOverview').onclick = () => {
  renderOverviewModal();
  document.getElementById('overviewModal').classList.remove('hidden');
};
document.getElementById('btnCloseOverview').onclick = () => document.getElementById('overviewModal').classList.add('hidden');

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
    state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto');
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
  state.model = buildManualFromParsed(state.model._parsed, 'auto');
  state.pageIdx = 0; state.selectedPartIds.clear();
  computeModelDiagnostics();
  closeMenu(); renderAll(); showToast('Regenerated clean steps.');
};

// Save / Open .bic.json Project (supports iOS Share Sheet + Download!)
document.getElementById('menuSaveProj').onclick = async () => {
  if (!state.model) return;
  const payload = JSON.stringify({ version: 3, title: state.model.title, chapters: state.model.chapters, overrides: state.overrides, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter, coverMeta: state.coverMeta, completeMeta: state.completeMeta, backMeta: state.backMeta, bomConfig: state.bomConfig, showStepBorders: state.showStepBorders, showPageTitle: state.showPageTitle, pageNumberFormat: state.pageNumberFormat, detectDuplicates: state.detectDuplicates, themeId: state.themeId, paperFormat: state.paperFormat, orientation: state.orientation, density: state.density, layout: state.layout }, null, 2);
  const fileName = `${state.model.title.replace(/[^a-z0-9_-]+/gi, '_')}.bic.json`;
  const blob = new Blob([payload], { type: 'application/json' });
  const file = new File([blob], fileName, { type: 'application/json' });
  closeMenu();
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: fileName }); showToast('Shared project file.'); return; } catch (_) {}
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  showToast(`Saved ${fileName}`);
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
    if (data.themeId) state.themeId = data.themeId;
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

const loadSample = () => {
  embeddedDatRaw.clear(); embeddedDatTitles.clear(); embeddedDatCompiled.clear(); compositePartDefs.clear(); pliThumbCache.clear(); submodelThumbCache.clear();
  state.model = buildSampleModel();
  state.overrides = {}; state.pageInserts = {}; state.dividerAfter = {};
  state.coverMeta = { title:'', subtitle:'', az:38, el:26, bgSrc:null };
  state.pageIdx = 1; state.mode = 'pan'; state.selectedPartIds.clear();
  state.undoStack = []; state.redoStack = [];
  errFilter = 'all';
  lastSourceRecord = { kind: 'sample', fileName: 'Orbital Rover' };
  dbPut('lastModel', lastSourceRecord);
  computeModelDiagnostics();
  closeMenu(); resetZoom(); renderAll();
};
document.getElementById('loadSampleBtn').onclick = loadSample;
document.getElementById('menuSampleBtn').onclick = loadSample;

let pendingRawFile = null; // { kind:'io'|'ldr', fileName, data }
function finishImport(parsed, mode) {
  submodelThumbCache.clear();
  state.model = buildManualFromParsed(parsed, mode);
  state.overrides = {}; state.pageInserts = {}; state.dividerAfter = {};
  state.coverMeta = { title:'', subtitle:'', az:38, el:26, bgSrc:null };
  state.pageIdx = 0; state.mode = 'pan'; state.selectedPartIds.clear();
  state.undoStack = []; state.redoStack = [];
  errFilter = 'all';
  document.getElementById('importModal').classList.add('hidden');
  if (pendingRawFile) {
    lastSourceRecord = { ...pendingRawFile, importMode: mode };
    dbPut('lastModel', lastSourceRecord);
    pendingRawFile = null;
  }
  computeModelDiagnostics();
  resetZoom(); renderAll();
  const steps = getAllSteps(state.model);
  const dupSubs = state.model.chapters.filter(c => c.kind === 'submodel').length;
  showToast(`Imported ${parsed.title} (${parsed.parts.length} pieces, ${steps.length} steps${dupSubs ? `, ${dupSubs} repeated submodel${dupSubs === 1 ? '' : 's'}` : ''}).`);
  if (state.diagnostics.length > 0) showImportErrorBanner();
}

document.getElementById('impBtnAuto').onclick = () => { if (state.pendingImport) finishImport(state.pendingImport, 'auto'); };
document.getElementById('impBtnKeep').onclick = () => { if (state.pendingImport) finishImport(state.pendingImport, 'keep'); };
document.getElementById('impBtnCancel').onclick = () => { state.pendingImport = null; pendingRawFile = null; document.getElementById('importModal').classList.add('hidden'); };

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
    if (parsed.hasSteps || parsed.submodelCount > 0) {
      state.pendingImport = parsed;
      document.getElementById('impTitle').textContent = `Import ${parsed.title}`;
      document.getElementById('impSummary').textContent = `Found ${parsed.parts.length} pieces${parsed.submodelCount ? ` across ${parsed.submodelCount} submodels` : ''}.`;
      document.getElementById('importModal').classList.remove('hidden');
    } else {
      finishImport(parsed, 'auto');
    }
  } catch (err) {
    showToast(err?.message || 'Could not import this file.');
  }
};

window.addEventListener('resize', () => { if (state.model) renderAll(); });

// Automatically reload last opened model & session on start!
restoreLastSessionOnStart();
}
