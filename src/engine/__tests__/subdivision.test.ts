import { describe, expect, it } from 'vitest';
import { buildConnectivityGraph } from '../connectivity';
import { parseLDrawSource } from '../ldrawParser';
import { generateInstructionPlan } from '../stepGenerator';
import {
  analyzeModelSubdivisions,
  assessModelSubdivisionNeed,
  buildSubdivisionInputsFromCanonical,
  computeHorizontalPrincipalAxis,
  mergeProposedSections,
  recomputeProposalWithCount,
  splitProposedSection,
  type SubdivisionPartInput,
} from '../subdivisionAnalyzer';

/** Builds a synthetic elongated symmetric train chassis (48 studs long, 4 studs wide) with a center coupler */
function buildSyntheticTrainChassisLdr(): string {
  const lines: string[] = ['0 Synthetic Elongated Train Chassis'];
  // Left half: 6 chained 2x4 plates + 2x4 bricks + red buffer plate at far left end (x = -440..-40)
  // Right half: mirror/identical (x = +40..+440)
  // Center coupler plate spanning x = 0 at y = -8 (1 plate up in LDraw Y-down)
  const xs = [-420, -340, -260, -180, -100];
  for (const x of xs) {
    // Base plate (3020 = 2x4 plate, height 8)
    lines.push(`1 72 ${x} 0 0 1 0 0 0 1 0 0 0 1 3020.dat`);
    // Second plate layer
    lines.push(`1 71 ${x} -8 0 1 0 0 0 1 0 0 0 1 3020.dat`);
    // Brick layer on top (3001 = 2x4 brick)
    lines.push(`1 72 ${x} -32 0 1 0 0 0 1 0 0 0 1 3001.dat`);
    // Side details (1x2 plates)
    lines.push(`1 71 ${x} -40 -10 1 0 0 0 1 0 0 0 1 3023.dat`);
    lines.push(`1 71 ${x} -40 10 1 0 0 0 1 0 0 0 1 3023.dat`);
  }
  // Red end buffer brick on left end
  lines.push(`1 4 -440 -16 0 1 0 0 0 1 0 0 0 1 3004.dat`);

  // Right half (identical!)
  for (const x of [100, 180, 260, 340, 420]) {
    lines.push(`1 72 ${x} 0 0 1 0 0 0 1 0 0 0 1 3020.dat`);
    lines.push(`1 71 ${x} -8 0 1 0 0 0 1 0 0 0 1 3020.dat`);
    lines.push(`1 72 ${x} -32 0 1 0 0 0 1 0 0 0 1 3001.dat`);
    lines.push(`1 71 ${x} -40 -10 1 0 0 0 1 0 0 0 1 3023.dat`);
    lines.push(`1 71 ${x} -40 10 1 0 0 0 1 0 0 0 1 3023.dat`);
  }
  // Red end buffer brick on right end
  lines.push(`1 4 440 -16 0 1 0 0 0 1 0 0 0 1 3004.dat`);

  // Center bridge plates spanning the middle seam between x = -60 and x = +60
  lines.push(`1 72 -40 0 0 1 0 0 0 1 0 0 0 1 3020.dat`);
  lines.push(`1 72 40 0 0 1 0 0 0 1 0 0 0 1 3020.dat`);
  lines.push(`1 71 0 -8 0 1 0 0 0 1 0 0 0 1 3020.dat`);
  lines.push(`1 0 0 -32 0 1 0 0 0 1 0 0 0 1 3003.dat`);

  return lines.join('\n');
}

/** Builds a synthetic 2-story modular building with smooth tiles along the floor seam */
function buildSyntheticModularBuildingLdr(): string {
  const lines: string[] = ['0 Synthetic Modular Building'];
  // Ground floor walls: 4 brick layers high (y_ldr = 0, -24, -48, -72) around a 12x12 perimeter
  const perim: Array<[number, number]> = [
    [-80, -80], [0, -80], [80, -80],
    [-80, 80], [0, 80], [80, 80],
    [-80, 0], [80, 0],
  ];
  for (const layerY of [0, -24, -48, -72]) {
    for (const [x, z] of perim) {
      lines.push(`1 19 ${x} ${layerY} ${z} 1 0 0 0 1 0 0 0 1 3001.dat`);
    }
  }
  // Smooth tile perimeter at top of ground floor (y_ldr = -80) leaving only 2 jumper bricks
  for (const [x, z] of perim.slice(0, 6)) {
    lines.push(`1 71 ${x} -80 ${z} 1 0 0 0 1 0 0 0 1 3069b.dat`);
  }
  // Two anchor plates for 2nd floor
  lines.push(`1 71 -80 -80 0 1 0 0 0 1 0 0 0 1 3022.dat`);
  lines.push(`1 71 80 -80 0 1 0 0 0 1 0 0 0 1 3022.dat`);

  // Second floor walls (y_ldr = -104, -128, -152, -176)
  for (const layerY of [-104, -128, -152, -176]) {
    for (const [x, z] of perim) {
      lines.push(`1 4 ${x} ${layerY} ${z} 1 0 0 0 1 0 0 0 1 3001.dat`);
    }
  }
  return lines.join('\n');
}

describe('Large & Elongated Model Subdivision Analyzer', () => {
  it('triggers subdivision on elongated train chassis and recommends Building Halves First with ~2x zoom gain', () => {
    const model = parseLDrawSource(buildSyntheticTrainChassisLdr(), 'train_chassis.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const { parts, adjacency } = buildSubdivisionInputsFromCanonical(model, graph);

    const { assessment, proposals } = analyzeModelSubdivisions(parts, adjacency);
    expect(assessment.shouldPrompt).toBe(true);
    expect(assessment.aspectRatio).toBeGreaterThanOrEqual(3.0);
    expect(proposals.length).toBeGreaterThanOrEqual(2);

    // Top recommendation for an elongated train chassis should be longitudinal halves!
    const top = proposals[0];
    expect(top.strategy).toBe('longitudinal_halves');
    expect(top.outputMode).toBe('modular_chapters');
    expect(top.zoomGainEstimate).toBeGreaterThanOrEqual(1.5);

    // Every non-minifig part must be accounted for exactly once across sections (including repeat groups)
    const covered = new Set<number>();
    for (const sec of top.sections) {
      const list = sec.repeatPartIndexGroups ? sec.repeatPartIndexGroups.flat() : sec.partIndices;
      for (const idx of list) {
        expect(covered.has(idx), `Duplicate part index ${idx}`).toBe(false);
        covered.add(idx);
      }
    }
    expect(covered.size).toBe(parts.length);
  });

  it('finds diagonal model principal axis cleanly via 2D PCA', () => {
    // 20 parts placed along a 45-degree diagonal (x === z)
    const diagParts: SubdivisionPartInput[] = Array.from({ length: 20 }, (_, i) => {
      const v = (i - 10) * 30;
      return {
        index: i,
        id: `p_${i}`,
        partId: '3001',
        colorId: 72,
        box: {
          min: [v - 10, 0, v - 10],
          max: [v + 10, 24, v + 10],
          center: [v, 12, v],
        },
      };
    });
    const pca = computeHorizontalPrincipalAxis(diagParts);
    // Axis should be ~[0.707, 0.707]
    expect(Math.abs(pca.axis[0] - Math.SQRT1_2)).toBeLessThan(0.05);
    expect(Math.abs(pca.axis[1] - Math.SQRT1_2)).toBeLessThan(0.05);
    expect(pca.majorSpan).toBeGreaterThan(pca.minorSpan * 5);
  });

  it('detects smooth-tile modular floor seams in multi-story buildings', () => {
    const model = parseLDrawSource(buildSyntheticModularBuildingLdr(), 'modular_shop.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const { parts, adjacency } = buildSubdivisionInputsFromCanonical(model, graph);

    const { proposals } = analyzeModelSubdivisions(parts, adjacency);
    const floorProp = proposals.find((p) => p.strategy === 'horizontal_floors');
    expect(floorProp).toBeDefined();
    expect(floorProp!.outputMode).toBe('modular_chapters');
    expect(floorProp!.sections.length).toBeGreaterThanOrEqual(2);
    expect(floorProp!.sections[0].name).toContain('Ground Floor');
  });

  it('supports live granularity tuning, 1-click merge, and 1-click split without dropping any parts', () => {
    const model = parseLDrawSource(buildSyntheticTrainChassisLdr(), 'train.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const { parts, adjacency } = buildSubdivisionInputsFromCanonical(model, graph);

    const threeSegs = recomputeProposalWithCount('longitudinal_halves', parts, adjacency, 3, false);
    expect(threeSegs).not.toBeNull();
    expect(threeSegs!.sections.filter((s) => s.role !== 'join').length).toBe(3);

    const merged = mergeProposedSections(threeSegs!, 0, 1, parts, adjacency);
    expect(merged.sections.length).toBe(threeSegs!.sections.length - 1);

    const splitAgain = splitProposedSection(merged, 0, parts, adjacency);
    expect(splitAgain.sections.length).toBe(merged.sections.length + 1);

    const covered = new Set<number>();
    for (const s of splitAgain.sections) {
      for (const idx of s.partIndices) covered.add(idx);
    }
    expect(covered.size).toBe(parts.length);
  });

  it('prevents grouping opposite-end parts of an elongated model into a single step (Spatial Spread Guard)', () => {
    const model = parseLDrawSource(buildSyntheticTrainChassisLdr(), 'train.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const plan = generateInstructionPlan(model, graph, 'standard', 'regenerate_all', {});
    const partsById = Object.fromEntries(model.parts.map((p) => [p.id, p]));

    for (const step of Object.values(plan.steps)) {
      if (step.partIds.length < 2) continue;
      for (let i = 0; i < step.partIds.length; i++) {
        for (let j = i + 1; j < step.partIds.length; j++) {
          const pa = partsById[step.partIds[i]];
          const pb = partsById[step.partIds[j]];
          const dist = Math.hypot(
            pa.position[0] - pb.position[0],
            pa.position[1] - pb.position[1],
            pa.position[2] - pb.position[2],
          );
          // Opposite ends are ~880 LDU apart; spread guard keeps step parts within local reach
          expect(dist).toBeLessThanOrEqual(450);
        }
      }
    }
  });

  it('handles a 1,000-part model quickly via spatial hash connectivity and subdivision analysis', () => {
    const lines: string[] = ['0 Large 1000-Part Tower'];
    // 10x10 footprint x 10 layers of 2x2 bricks = 1,000 parts
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        for (let z = 0; z < 10; z++) {
          lines.push(`1 71 ${x * 40} ${-y * 24} ${z * 40} 1 0 0 0 1 0 0 0 1 3003.dat`);
        }
      }
    }
    const t0 = performance.now();
    const model = parseLDrawSource(lines.join('\n'), 'large_1000.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const { parts, adjacency } = buildSubdivisionInputsFromCanonical(model, graph);
    const assessment = assessModelSubdivisionNeed(parts);
    const { proposals } = analyzeModelSubdivisions(parts, adjacency);
    const elapsedMs = performance.now() - t0;

    expect(model.parts).toHaveLength(1000);
    expect(graph.floatingWarnings).toHaveLength(0);
    expect(assessment.shouldPrompt).toBe(true);
    expect(proposals.length).toBeGreaterThanOrEqual(2);
    expect(elapsedMs).toBeLessThan(2500);
  });

  it('keeps an articulated train middle bogie intact, keeps stud-connected seam bricks on their halves, and isolates only bogie + Technic rod + circular cross-axle pieces in the middle section', () => {
    // Construct an articulated light rail vehicle (LRV) along X in Y-up LDU coordinates:
    // - Front Half (x = -460..-10) with Front Bogie + curved scoop & coupler tongue crossing x=0 (stud-connected ONLY to Front Half)
    // - Rear Half (x = +10..+460) with Rear Bogie + curved scoop & coupler tongue crossing x=0 (stud-connected ONLY to Rear Half)
    // - Middle Jacobs Bogie straddling x = 0 (2878 wheel holder + 4 wheels 55423 + 4025 bogie plate + 2871 decorative sides)
    // - Vertical Technic Rod (3707, 8L axle) at x = 0, z = 0
    // - Floating Circular Cross-Axle Pieces (4032 Round Plate 2x2 w/ Axle Hole & 3713 Technic Bush) coaxial with rod inside scoops
    // - Stray small roof detail far from cut (x = -340, disconnected in adjacency) that MUST stay in Front Half!
    const parts: SubdivisionPartInput[] = [];
    const adj: number[][] = [];
    const addPart = (
      id: string,
      partId: string,
      partName: string,
      min: [number, number, number],
      max: [number, number, number],
      extra: Partial<SubdivisionPartInput> = {},
    ): number => {
      const index = parts.length;
      parts.push({
        index,
        id,
        partId,
        partName,
        colorId: 72,
        box: {
          min,
          max,
          center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
        },
        ...extra,
      });
      adj.push([]);
      return index;
    };
    const link = (a: number, b: number) => {
      if (a === b) return;
      if (!adj[a].includes(b)) adj[a].push(b);
      if (!adj[b].includes(a)) adj[b].push(a);
    };

    // --- FRONT HALF (Left, x < 0) ---
    const frontIndices: number[] = [];
    let prevFloorL = -1;
    for (let x = -440; x <= -120; x += 80) {
      const fl = addPart(`fl_${x}`, '3020', 'Plate 2x4', [x - 40, 32, -40], [x + 40, 40, 40]);
      const wall = addPart(`wl_${x}`, '3001', 'Brick 2x4', [x - 40, 40, -40], [x + 40, 64, 40]);
      const roof = addPart(`rl_${x}`, '3020', 'Plate 2x4', [x - 40, 64, -40], [x + 40, 72, 40]);
      link(fl, wall);
      link(wall, roof);
      if (prevFloorL >= 0) {
        // Tie brick spanning previous and current bay
        const tie = addPart(`tl_${x}`, '3020', 'Plate 2x4', [x - 80, 40, -20], [x, 48, 20]);
        link(prevFloorL, tie);
        link(fl, tie);
        frontIndices.push(tie);
      }
      prevFloorL = fl;
      frontIndices.push(fl, wall, roof);
    }

    // Front Half protruding coupler plate & tall curved scoop that physically cross x = 0,
    // connected by studs ONLY to Front Half!
    const frontFloorEnd = addPart('fl_end', '3020', 'Plate 2x4', [-120, 32, -40], [-40, 40, 40]);
    const frontTieEnd = addPart('tl_end', '3020', 'Plate 2x4', [-160, 40, -20], [-80, 48, 20]);
    link(prevFloorL, frontTieEnd);
    link(frontFloorEnd, frontTieEnd);
    // Protruding coupler tongue (3176 Plate Modified 3x2 w/ Hole) extending from x = -45 to x = +15 (crosses x = 0!)
    const frontTongue = addPart('front_tongue', '3176', 'Plate 3 x 2 with Hole', [-45, 40, -20], [15, 48, 20]);
    link(frontFloorEnd, frontTongue);
    // Tall concave scoop brick attached by studs on top of Front Half floor, AABB overlaps x = 0 and encloses center cavity!
    const frontScoop = addPart('front_scoop', '30562', 'Cylinder Quarter 4x4x6', [-60, 40, -40], [10, 112, 40]);
    link(frontFloorEnd, frontScoop);
    frontIndices.push(frontFloorEnd, frontTieEnd, frontTongue, frontScoop);

    // Front Bogie (intact under Front Half around x = -320)
    const fbHolder = addPart('fb_holder', '2878', 'Train Wheel RC Holder', [-380, 8, -20], [-260, 28, 20]);
    const fbW1 = addPart('fb_w1', '55423', 'Train Wheel RC', [-365, 0, -30], [-335, 28, -20]);
    const fbW2 = addPart('fb_w2', '55423', 'Train Wheel RC', [-365, 0, 20], [-335, 28, 30]);
    const fbW3 = addPart('fb_w3', '55423', 'Train Wheel RC', [-305, 0, -30], [-275, 28, -20]);
    const fbW4 = addPart('fb_w4', '55423', 'Train Wheel RC', [-305, 0, 20], [-275, 28, 30]);
    const fbPlate = addPart('fb_plate', '4025', 'Train Bogie Plate', [-350, 28, -20], [-290, 34, 20]);
    link(fbHolder, fbW1); link(fbHolder, fbW2); link(fbHolder, fbW3); link(fbHolder, fbW4);
    link(fbHolder, fbPlate);
    frontIndices.push(fbHolder, fbW1, fbW2, fbW3, fbW4, fbPlate);

    // Stray disconnected roof detail far from cut (x = -360) -> MUST stay in Front Half, NOT Join!
    const strayRoofDetail = addPart('stray_roof', '3070b', 'Tile 1x1', [-370, 76, -10], [-350, 84, 10]);
    frontIndices.push(strayRoofDetail);

    // --- REAR HALF (Right, x > 0) ---
    const rearIndices: number[] = [];
    let prevFloorR = -1;
    for (let x = 120; x <= 440; x += 80) {
      const fl = addPart(`fr_${x}`, '3020', 'Plate 2x4', [x - 40, 32, -40], [x + 40, 40, 40]);
      const wall = addPart(`wr_${x}`, '3001', 'Brick 2x4', [x - 40, 40, -40], [x + 40, 64, 40]);
      const roof = addPart(`rr_${x}`, '3020', 'Plate 2x4', [x - 40, 64, -40], [x + 40, 72, 40]);
      link(fl, wall);
      link(wall, roof);
      if (prevFloorR >= 0) {
        const tie = addPart(`tr_${x}`, '3020', 'Plate 2x4', [x - 80, 40, -20], [x, 48, 20]);
        link(prevFloorR, tie);
        link(fl, tie);
        rearIndices.push(tie);
      }
      prevFloorR = fl;
      rearIndices.push(fl, wall, roof);
    }

    const rearFloorEnd = addPart('fr_end', '3020', 'Plate 2x4', [40, 32, -40], [120, 40, 40]);
    const rearTieEnd = addPart('tr_end', '3020', 'Plate 2x4', [80, 40, -20], [160, 48, 20]);
    link(rearFloorEnd, rearTieEnd);
    // Connect rearTieEnd to fr_120 (first rear floor bay)
    const fr120 = parts.find((p) => p.id === 'fr_120')!.index;
    link(fr120, rearTieEnd);
    // Protruding coupler tongue (3176) extending from x = -15 to x = +45 (crosses x = 0!)
    const rearTongue = addPart('rear_tongue', '3176', 'Plate 3 x 2 with Hole', [-15, 72, -20], [45, 80, 20]);
    const rearWallEnd = addPart('wr_end', '3001', 'Brick 2x4', [40, 40, -40], [120, 72, 40]);
    link(rearFloorEnd, rearWallEnd);
    link(rearWallEnd, rearTongue);
    // Concave scoop on Rear Half crossing x = 0
    const rearScoop = addPart('rear_scoop', '30562', 'Cylinder Quarter 4x4x6', [-10, 40, -40], [60, 112, 40]);
    link(rearFloorEnd, rearScoop);
    rearIndices.push(rearFloorEnd, rearTieEnd, rearWallEnd, rearTongue, rearScoop);

    // Rear Bogie (intact under Rear Half around x = +320)
    const rbHolder = addPart('rb_holder', '2878', 'Train Wheel RC Holder', [260, 8, -20], [380, 28, 20]);
    const rbW1 = addPart('rb_w1', '55423', 'Train Wheel RC', [275, 0, -30], [305, 28, -20]);
    const rbW2 = addPart('rb_w2', '55423', 'Train Wheel RC', [275, 0, 20], [305, 28, 30]);
    const rbW3 = addPart('rb_w3', '55423', 'Train Wheel RC', [335, 0, -30], [365, 28, -20]);
    const rbW4 = addPart('rb_w4', '55423', 'Train Wheel RC', [335, 0, 20], [365, 28, 30]);
    const rbPlate = addPart('rb_plate', '4025', 'Train Bogie Plate', [290, 28, -20], [350, 34, 20]);
    link(rbHolder, rbW1); link(rbHolder, rbW2); link(rbHolder, rbW3); link(rbHolder, rbW4);
    link(rbHolder, rbPlate);
    rearIndices.push(rbHolder, rbW1, rbW2, rbW3, rbW4, rbPlate);

    // --- MIDDLE SECTION: Intact Middle Jacobs Bogie + Vertical Technic Rod + Floating Circular Cross-Axle Pieces ---
    const mbHolder = addPart('mb_holder', '2878', 'Train Wheel RC Holder', [-60, 8, -20], [60, 28, 20]);
    const mbW1 = addPart('mb_w1', '55423', 'Train Wheel RC', [-48, 0, -30], [-18, 28, -20]);
    const mbW2 = addPart('mb_w2', '55423', 'Train Wheel RC', [-48, 0, 20], [-18, 28, 30]);
    const mbW3 = addPart('mb_w3', '55423', 'Train Wheel RC', [18, 0, -30], [48, 28, -20]);
    const mbW4 = addPart('mb_w4', '55423', 'Train Wheel RC', [18, 0, 20], [48, 28, 30]);
    const mbPlate = addPart('mb_plate', '4025', 'Train Bogie Plate', [-30, 28, -20], [30, 34, 20]);
    const mbSideL = addPart('mb_side_l', '2871b', 'Train Motor Decorative Side', [-56, 8, -28], [56, 26, -20]);
    const mbSideR = addPart('mb_side_r', '2871b', 'Train Motor Decorative Side', [-56, 8, 20], [56, 26, 28]);
    link(mbHolder, mbW1); link(mbHolder, mbW2); link(mbHolder, mbW3); link(mbHolder, mbW4);
    link(mbHolder, mbPlate); link(mbHolder, mbSideL); link(mbHolder, mbSideR);
    // Simulate physical grazing between middle bogie swivel top and car floors!
    link(mbPlate, frontFloorEnd);
    link(mbPlate, rearFloorEnd);

    // Vertical Technic Axle 8L at x = 0, z = 0 running from bogie up through both tongues & collars
    const rod = addPart('center_rod', '3707', 'Technic Axle 8L', [-4, 16, -4], [4, 108, 4]);
    link(rod, mbHolder);
    link(rod, mbPlate);
    link(rod, frontTongue);
    link(rod, rearTongue);

    // Floating circular pieces attaching directly to the rod with a cross (+):
    // 4032 (Plate Round 2x2 w/ Axle Hole) resting on frontTongue inside the concave scoops,
    // plus 3713 (Technic Bush) directly above it inside the scoops!
    const collar1 = addPart('collar_4032', '4032', 'Plate 2 x 2 Round with Axlehole', [-20, 48, -20], [20, 56, 20]);
    const collar2 = addPart('collar_3713', '3713', 'Technic Bush', [-10, 56, -10], [10, 72, 10]);
    link(rod, collar1);
    link(rod, collar2);
    link(collar1, collar2);
    // Simulate AABB overlap with frontTongue and concave scoops!
    link(collar1, frontTongue);
    link(collar1, frontScoop);
    link(collar1, rearScoop);
    link(collar2, rearTongue);
    link(collar2, frontScoop);
    link(collar2, rearScoop);

    const expectedBogie = new Set([mbHolder, mbW1, mbW2, mbW3, mbW4, mbPlate, mbSideL, mbSideR]);
    const expectedCollars = new Set([collar1, collar2]);
    const expectedRods = new Set([rod]);

    const { proposals } = analyzeModelSubdivisions(parts, adj);
    const top = proposals[0];
    expect(top.strategy).toBe('longitudinal_halves');
    expect(top.outputMode).toBe('modular_chapters');

    const frontSec = top.sections.find((s) => s.role === 'module' && s.partIndices.includes(frontFloorEnd));
    const rearSec = top.sections.find((s) => s.role === 'module' && s.partIndices.includes(rearFloorEnd));
    const joinSec = top.sections.find((s) => s.role === 'join');

    expect(frontSec).toBeDefined();
    expect(rearSec).toBeDefined();
    expect(joinSec).toBeDefined();
    expect(joinSec!.articulatedJoin).toBeDefined();

    // 1. Middle bogie MUST NOT be cut in half — ALL 8 bogie parts must be intact in the join section!
    expect(new Set(joinSec!.articulatedJoin!.bogiePartIndices)).toEqual(expectedBogie);
    for (const bi of expectedBogie) {
      expect(frontSec!.partIndices).not.toContain(bi);
      expect(rearSec!.partIndices).not.toContain(bi);
    }

    // 2. Stud-connected bricks crossing x=0 (tongues & curved scoops) MUST stay on their corresponding halves!
    expect(frontSec!.partIndices).toContain(frontTongue);
    expect(frontSec!.partIndices).toContain(frontScoop);
    expect(rearSec!.partIndices).toContain(rearTongue);
    expect(rearSec!.partIndices).toContain(rearScoop);
    expect(joinSec!.partIndices).not.toContain(frontTongue);
    expect(joinSec!.partIndices).not.toContain(frontScoop);
    expect(joinSec!.partIndices).not.toContain(rearTongue);
    expect(joinSec!.partIndices).not.toContain(rearScoop);

    // 3. Stray roof detail far from cut stays on Front Half (NOT dumped into Center Join!)
    expect(frontSec!.partIndices).toContain(strayRoofDetail);
    expect(joinSec!.partIndices).not.toContain(strayRoofDetail);

    // 4. ONLY the bogie, Technic rod, and floating circular cross-axle pieces are in the middle section!
    expect(new Set(joinSec!.articulatedJoin!.pivotRodIndices)).toEqual(expectedRods);
    expect(new Set(joinSec!.articulatedJoin!.floatingCollarIndices)).toEqual(expectedCollars);
    expect(joinSec!.articulatedJoin!.finishPartIndices).toHaveLength(0);
    expect(new Set(joinSec!.partIndices)).toEqual(
      new Set([...expectedBogie, ...expectedRods, ...expectedCollars]),
    );

    // 5. Articulated join stays centered on track level in exploded preview
    expect(joinSec!.explodeOffset).toEqual([0, 0, 0]);

    // 6. Exact partition invariant: every part accounted for exactly once
    const covered = new Set<number>();
    for (const sec of top.sections) {
      const list = sec.repeatPartIndexGroups ? sec.repeatPartIndexGroups.flat() : sec.partIndices;
      for (const idx of list) {
        expect(covered.has(idx)).toBe(false);
        covered.add(idx);
      }
    }
    expect(covered.size).toBe(parts.length);
  });

  it('handles brick-built custom Jacobs bogies (50254 wheels + horizontal Technic axles + Technic bricks) and directly stacked opposing 3176 coupler tongues', () => {
    const parts: SubdivisionPartInput[] = [];
    const adj: number[][] = [];
    const addPart = (
      id: string,
      partId: string,
      partName: string,
      min: [number, number, number],
      max: [number, number, number],
    ): number => {
      const index = parts.length;
      parts.push({
        index,
        id,
        partId,
        partName,
        colorId: 72,
        box: {
          min,
          max,
          center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2],
        },
      });
      adj.push([]);
      return index;
    };
    const link = (a: number, b: number) => {
      if (a === b) return;
      if (!adj[a].includes(b)) adj[a].push(b);
      if (!adj[b].includes(a)) adj[b].push(a);
    };

    // Left & Right train halves
    let prevL = -1;
    for (let x = -360; x <= -120; x += 80) {
      const fl = addPart(`fl_${x}`, '3020', 'Plate 2x4', [x - 40, 48, -40], [x + 40, 56, 40]);
      const wl = addPart(`wl_${x}`, '3001', 'Brick 2x4', [x - 40, 56, -40], [x + 40, 80, 40]);
      link(fl, wl);
      if (prevL >= 0) {
        const tie = addPart(`tl_${x}`, '3020', 'Plate 2x4', [x - 80, 56, -20], [x, 64, 20]);
        link(prevL, tie); link(fl, tie);
      }
      prevL = fl;
    }
    const flEnd = addPart('fl_end', '3020', 'Plate 2x4', [-120, 48, -40], [-40, 56, 40]);
    const tlEnd = addPart('tl_end', '3020', 'Plate 2x4', [-160, 56, -20], [-80, 64, 20]);
    link(prevL, tlEnd); link(flEnd, tlEnd);

    let prevR = -1;
    for (let x = 120; x <= 360; x += 80) {
      const fl = addPart(`fr_${x}`, '3020', 'Plate 2x4', [x - 40, 48, -40], [x + 40, 56, 40]);
      const wl = addPart(`wr_${x}`, '3001', 'Brick 2x4', [x - 40, 56, -40], [x + 40, 80, 40]);
      link(fl, wl);
      if (prevR >= 0) {
        const tie = addPart(`tr_${x}`, '3020', 'Plate 2x4', [x - 80, 56, -20], [x, 64, 20]);
        link(prevR, tie); link(fl, tie);
      }
      prevR = fl;
    }
    const frEnd = addPart('fr_end', '3020', 'Plate 2x4', [40, 48, -40], [120, 56, 40]);
    const trEnd = addPart('tr_end', '3020', 'Plate 2x4', [80, 56, -20], [160, 64, 20]);
    link(frEnd, trEnd);
    link(parts.find((p) => p.id === 'fr_120')!.index, trEnd);

    // Directly stacked opposing 3176 coupler tongues (gap = 0 vertically at x = 0!)
    const tongueL = addPart('tongue_l', '3176', 'Plate 3 x 2 with Hole', [-45, 56, -20], [15, 64, 20]);
    const tongueR = addPart('tongue_r', '3176', 'Plate 3 x 2 with Hole', [-15, 64, -20], [45, 72, 20]);
    link(flEnd, tongueL);
    const frSupport = addPart('fr_sup', '3020', 'Plate 2x4', [25, 56, -20], [105, 64, 20]);
    link(frEnd, frSupport);
    link(frSupport, tongueR);
    // Physical vertical contact between the two opposing pinhole tongues at x = 0!
    link(tongueL, tongueR);

    // Brick-built custom Jacobs bogie straddling x = 0:
    // 4x 50254 wheels on 2 horizontal 3705 axles + 2x 3700 Technic bricks + 3020 bogie frame + 3069b smooth top tiles
    const ax1 = addPart('bogie_ax1', '3705', 'Technic Axle 4L', [-44, 10, -40], [-36, 18, 40]);
    const ax2 = addPart('bogie_ax2', '3705', 'Technic Axle 4L', [36, 10, -40], [44, 18, 40]);
    const w1 = addPart('bw1', '50254', 'Train Wheel Small', [-54, 0, -40], [-26, 28, -28]);
    const w2 = addPart('bw2', '50254', 'Train Wheel Small', [-54, 0, 28], [-26, 28, 40]);
    const w3 = addPart('bw3', '50254', 'Train Wheel Small', [26, 0, -40], [54, 28, -28]);
    const w4 = addPart('bw4', '50254', 'Train Wheel Small', [26, 0, 28], [54, 28, 40]);
    const tb1 = addPart('btb1', '3700', 'Technic Brick 1x2', [-50, 8, -20], [-30, 32, 20]);
    const tb2 = addPart('btb2', '3700', 'Technic Brick 1x2', [30, 8, -20], [50, 32, 20]);
    const bFrame = addPart('b_frame', '3020', 'Plate 2x4', [-50, 32, -20], [50, 40, 20]);
    const bTile = addPart('b_tile', '3068b', 'Tile 2x2', [-40, 40, -20], [40, 48, 20]);
    link(ax1, w1); link(ax1, w2); link(ax1, tb1);
    link(ax2, w3); link(ax2, w4); link(ax2, tb2);
    link(tb1, bFrame); link(tb2, bFrame); link(bFrame, bTile);
    // Smooth tile top touches car floors physically (no stud weld!)
    link(bTile, flEnd); link(bTile, frEnd);

    // Vertical Technic rod + circular 3941 round brick w/ axle hole coaxial on rod
    const vRod = addPart('v_rod', '3706', 'Technic Axle 6L', [-4, 28, -4], [4, 108, 4]);
    const roundCollar = addPart('collar_3941', '3941', 'Brick 2 x 2 Round with Axlehole', [-20, 72, -20], [20, 96, 20]);
    link(vRod, bFrame); link(vRod, bTile); link(vRod, tongueL); link(vRod, tongueR); link(vRod, roundCollar);
    link(roundCollar, tongueR);

    const { proposals } = analyzeModelSubdivisions(parts, adj);
    const top = proposals[0];
    expect(top.strategy).toBe('longitudinal_halves');
    const frontSec = top.sections.find((s) => s.role === 'module' && s.partIndices.includes(flEnd))!;
    const rearSec = top.sections.find((s) => s.role === 'module' && s.partIndices.includes(frEnd))!;
    const joinSec = top.sections.find((s) => s.role === 'join')!;

    // Both opposing 3176 coupler tongues belong to their respective halves (NOT middle section!)
    expect(frontSec.partIndices).toContain(tongueL);
    expect(rearSec.partIndices).toContain(tongueR);
    expect(joinSec.partIndices).not.toContain(tongueL);
    expect(joinSec.partIndices).not.toContain(tongueR);

    // Entire custom brick-built bogie (10 parts) stays intact inside joinSec.articulatedJoin.bogiePartIndices!
    const expectedBogie = new Set([ax1, ax2, w1, w2, w3, w4, tb1, tb2, bFrame, bTile]);
    expect(new Set(joinSec.articulatedJoin!.bogiePartIndices)).toEqual(expectedBogie);
    expect(new Set(joinSec.articulatedJoin!.pivotRodIndices)).toEqual(new Set([vRod]));
    expect(new Set(joinSec.articulatedJoin!.floatingCollarIndices)).toEqual(new Set([roundCollar]));
    expect(joinSec.articulatedJoin!.finishPartIndices).toHaveLength(0);
  });
});
