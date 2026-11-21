export interface DemoModelPreset {
  id: string;
  name: string;
  subtitle: string;
  author: string;
  setNumber: string;
  highlights: string[];
  ldrawSource: string;
}

/**
 * 1. Vanguard SNOT Starfighter & Pilot
 * Showcases:
 * - Multi-chapter disconnected component handling (Pilot minifigure + Starfighter)
 * - SNOT side-stud wing pods built sideways on 4733 SNOT bricks
 * - Repeated identical subassemblies (2x Wing + Laser Rod Pods with bar & clip)
 * - Automatic camera rotation when adding rear thrusters and underside landing skids
 */
const STARFIGHTER_LDR = `0 Vanguard SNOT Starfighter
0 Name: vanguard_starfighter.ldr
0 Author: Sample Model
0 !LDRAW_ORG Unofficial_Model
0 // === CHAPTER: MAIN STARFIGHTER FUSELAGE ===
0 // Underside landing skids (y_yup = -8 -> y_ldr = 8)
1 72 0 8 20 1 0 0 0 1 0 0 0 1 3023.dat
1 72 0 8 -40 1 0 0 0 1 0 0 0 1 3023.dat
0 // Main spine plates (y_yup = 0 -> y_ldr = 0)
1 71 0 0 0 0 0 1 0 1 0 -1 0 0 3034.dat
1 15 0 -8 0 0 0 1 0 1 0 -1 0 0 3020.dat
0 // Nose cone plates & slope (z_yup = -60..-100 -> z_ldr = 60..100)
1 4 0 -8 -60 0 0 1 0 1 0 -1 0 0 3023.dat
1 15 0 -32 -60 0 0 1 0 1 0 -1 0 0 3040b.dat
0 // Core cockpit & SNOT mounts (y_yup = 24..32 -> y_ldr = -24..-32)
1 72 -10 -32 0 1 0 0 0 1 0 0 0 1 4733.dat
1 72 10 -32 0 1 0 0 0 1 0 0 0 1 4733.dat
1 72 -10 -32 -20 1 0 0 0 1 0 0 0 1 4733.dat
1 72 10 -32 -20 1 0 0 0 1 0 0 0 1 4733.dat
0 // Rear engine block & glowing thrusters (z_yup = 40..60 -> z_ldr = -40..-60)
1 71 0 -32 40 1 0 0 0 1 0 0 0 1 3004.dat
1 72 -10 -32 60 1 0 0 0 1 0 0 0 1 3062b.dat
1 72 10 -32 60 1 0 0 0 1 0 0 0 1 3062b.dat
1 41 -10 -40 60 1 0 0 0 1 0 0 0 1 4073.dat
1 41 10 -40 60 1 0 0 0 1 0 0 0 1 4073.dat
0 // Upper dorsal spine & canopy
1 15 0 -40 20 0 0 1 0 1 0 -1 0 0 3021.dat
1 4 0 -48 20 1 0 0 0 1 0 0 0 1 3069b.dat
1 41 0 -56 -20 0 0 1 0 1 0 -1 0 0 45705.dat
1 4 0 -64 40 1 0 0 0 1 0 0 0 1 3040b.dat
0 // === RIGHT SNOT WING POD (+X side of 4733 at x=10, y_yup=20, z_yup=10) ===
1 15 28 -20 -10 0 -1 0 1 0 0 0 0 1 3022.dat
1 4 36 -20 -10 0 -1 0 1 0 0 0 0 1 3020.dat
1 71 44 -20 -10 0 -1 0 1 0 0 0 0 1 3069b.dat
1 72 44 -20 -30 0 -1 0 1 0 0 0 0 1 6019.dat
1 57 40 -36 -50 1 0 0 0 0 -1 0 1 0 30374.dat
0 // === LEFT SNOT WING POD (-X side of 4733 at x=-10, y_yup=20, z_yup=10) ===
1 15 -28 -20 -10 0 1 0 -1 0 0 0 0 1 3022.dat
1 4 -36 -20 -10 0 1 0 -1 0 0 0 0 1 3020.dat
1 71 -44 -20 -10 0 1 0 -1 0 0 0 0 1 3069b.dat
1 72 -44 -20 -30 0 1 0 -1 0 0 0 0 1 6019.dat
1 57 -40 -36 -50 1 0 0 0 0 -1 0 1 0 30374.dat
0 // === CHAPTER: PILOT MINIFIGURE (physically separate component) ===
1 272 130 -28 0 1 0 0 0 1 0 0 0 1 3815.dat
1 25 130 -56 0 1 0 0 0 1 0 0 0 1 973.dat
1 14 130 -78 0 1 0 0 0 1 0 0 0 1 3626b.dat
1 15 130 -102 0 1 0 0 0 1 0 0 0 1 2446.dat
`;

/**
 * 2. Alpine Brick Cottage
 * Showcases:
 * - Layered architectural masonry with clean front/back rotations
 * - Pitched 45° roof slopes and chimney
 * - Side lantern hung via clip & bar rod
 */
const COTTAGE_LDR = `0 Alpine Brick Cottage
0 Name: alpine_cottage.ldr
0 Author: Sample Model
0 // Foundation baseplate
1 2 0 0 0 1 0 0 0 1 0 0 0 1 3036.dat
1 71 0 -8 40 1 0 0 0 1 0 0 0 1 3069b.dat
0 // Course 1 walls (y_yup = 24 -> y_ldr = -24)
1 19 -50 -24 20 1 0 0 0 1 0 0 0 1 3004.dat
1 19 50 -24 20 1 0 0 0 1 0 0 0 1 3004.dat
1 19 -60 -24 -10 0 0 1 0 1 0 -1 0 0 3004.dat
1 19 60 -24 -10 0 0 1 0 1 0 -1 0 0 3004.dat
1 19 0 -24 -40 1 0 0 0 1 0 0 0 1 3009.dat
1 70 0 -24 20 1 0 0 0 1 0 0 0 1 3004.dat
0 // Course 2 walls (y_yup = 48 -> y_ldr = -48)
1 15 -50 -48 20 1 0 0 0 1 0 0 0 1 3004.dat
1 15 50 -48 20 1 0 0 0 1 0 0 0 1 3004.dat
1 15 -60 -48 -10 0 0 1 0 1 0 -1 0 0 3004.dat
1 15 60 -48 -10 0 0 1 0 1 0 -1 0 0 3004.dat
1 15 -40 -48 -40 1 0 0 0 1 0 0 0 1 3004.dat
1 41 0 -48 -40 1 0 0 0 1 0 0 0 1 3004.dat
1 15 40 -48 -40 1 0 0 0 1 0 0 0 1 3004.dat
1 70 0 -48 20 1 0 0 0 1 0 0 0 1 3004.dat
0 // Course 3 lintel & porch lantern clip
1 70 0 -72 20 1 0 0 0 1 0 0 0 1 3009.dat
1 70 0 -72 -40 1 0 0 0 1 0 0 0 1 3009.dat
1 15 -60 -72 -10 0 0 1 0 1 0 -1 0 0 3004.dat
1 15 60 -72 -10 0 0 1 0 1 0 -1 0 0 3004.dat
1 0 70 -80 20 1 0 0 0 1 0 0 0 1 6019.dat
1 46 86 -76 20 1 0 0 0 1 0 0 0 1 87994.dat
0 // Roof eaves & pitched slopes (y_yup = 80..128)
1 320 0 -96 20 0 0 1 0 1 0 -1 0 0 3037.dat
1 320 0 -96 -40 0 0 -1 0 1 0 1 0 0 3037.dat
1 320 -40 -96 20 0 0 1 0 1 0 -1 0 0 3039.dat
1 320 40 -96 20 0 0 1 0 1 0 -1 0 0 3039.dat
1 320 -40 -96 -40 0 0 -1 0 1 0 1 0 0 3039.dat
1 320 40 -96 -40 0 0 -1 0 1 0 1 0 0 3039.dat
1 320 0 -104 -10 1 0 0 0 1 0 0 0 1 3034.dat
1 72 -40 -128 -10 1 0 0 0 1 0 0 0 1 3003.dat
1 71 -40 -136 -10 1 0 0 0 1 0 0 0 1 3068b.dat
`;

/**
 * 3. Mars Exploration Rover
 * Showcases:
 * - 4x identical SNOT Wheel Pods
 * - Rod/Bar + Clip robotic sensor mast
 * - Solar array deck
 */
const ROVER_LDR = `0 Mars Exploration Rover
0 Name: mars_rover.ldr
0 Author: Sample Model
0 // Chassis deck
1 72 0 0 0 1 0 0 0 1 0 0 0 1 3032.dat
1 15 0 -8 0 1 0 0 0 1 0 0 0 1 3020.dat
0 // Four SNOT wheel mount bricks
1 72 -40 -32 -30 1 0 0 0 1 0 0 0 1 4733.dat
1 72 40 -32 -30 1 0 0 0 1 0 0 0 1 4733.dat
1 72 -40 -32 30 1 0 0 0 1 0 0 0 1 4733.dat
1 72 40 -32 30 1 0 0 0 1 0 0 0 1 4733.dat
0 // 4x Wheel Pods attached sideways (SNOT)
1 14 -40 -20 -48 1 0 0 0 0 -1 0 1 0 3024.dat
1 0 -40 -20 -56 1 0 0 0 0 -1 0 1 0 3062b.dat
1 14 40 -20 -48 1 0 0 0 0 -1 0 1 0 3024.dat
1 0 40 -20 -56 1 0 0 0 0 -1 0 1 0 3062b.dat
1 14 -40 -20 48 1 0 0 0 0 1 0 -1 0 3024.dat
1 0 -40 -20 56 1 0 0 0 0 1 0 -1 0 3062b.dat
1 14 40 -20 48 1 0 0 0 0 1 0 -1 0 3024.dat
1 0 40 -20 56 1 0 0 0 0 1 0 -1 0 3062b.dat
0 // Equipment core & solar wings
1 15 0 -32 0 1 0 0 0 1 0 0 0 1 3001.dat
1 25 0 -40 0 1 0 0 0 1 0 0 0 1 3031.dat
1 272 -20 -48 0 1 0 0 0 1 0 0 0 1 3068b.dat
1 272 20 -48 0 1 0 0 0 1 0 0 0 1 3068b.dat
0 // Vertical clip & sensor mast bar
1 72 30 -48 10 1 0 0 0 1 0 0 0 1 4085d.dat
1 80 30 -88 10 1 0 0 0 1 0 0 0 1 30374.dat
1 41 30 -128 10 1 0 0 0 1 0 0 0 1 4073.dat
`;

export const DEMO_MODELS: DemoModelPreset[] = [
  {
    id: 'vanguard-starfighter',
    name: 'Vanguard SNOT Starfighter',
    subtitle: 'SNOT wings (2x), bar/clip laser cannons & pilot minifigure chapter',
    author: 'Sample Model',
    setNumber: 'BF-0104',
    highlights: ['2× SNOT Subassembly', 'Bars & Clips', 'Minifig Chapter'],
    ldrawSource: STARFIGHTER_LDR,
  },
  {
    id: 'alpine-cottage',
    name: 'Alpine Brick Cottage',
    subtitle: 'Multi-course architectural build with pitched roof & clipped lantern',
    author: 'Sample Model',
    setNumber: 'BF-0208',
    highlights: ['Multi-Layer Masonry', '45° Roof Slopes', 'Clip Lantern'],
    ldrawSource: COTTAGE_LDR,
  },
  {
    id: 'mars-rover',
    name: 'Mars Exploration Rover',
    subtitle: '4× SNOT wheel pods, solar array deck & vertical rod sensor mast',
    author: 'Sample Model',
    setNumber: 'BF-0312',
    highlights: ['4× Repeated Pods', 'Vertical Bar Mast', 'Compact Chassis'],
    ldrawSource: ROVER_LDR,
  },
];
