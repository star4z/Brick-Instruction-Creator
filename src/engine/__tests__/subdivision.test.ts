import { describe, expect, it } from 'vitest';
import { buildConnectivityGraph } from '../connectivity';
import { parseLDrawSource } from '../ldrawParser';
import { generateInstructionPlan } from '../stepGenerator';
import {
  analyzeModelSubdivisions,
  assessModelSubdivisionNeed,
  buildBaseplateSplitProposal,
  buildSpatialSectorsProposal,
  buildSubdivisionInputsFromCanonical,
  detectGroundBaseplates,
  classifyConnectionEdge,
  classifySubdivisionPartFlags,
  computeHorizontalPrincipalAxis,
  computeRadialExplodeOffsets,
  isConnectedSubgraph,
  mergeProposedSections,
  recomputeProposalWithCount,
  splitProposedSection,
  verifyProposalZeroFloating,
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
    expect(verifyProposalZeroFloating(top, adj).valid).toBe(true);
  });

  it('guarantees zero floating parts across ALL strategies on an articulated 66-stud light rail train with cut-crossing roofs & pods', () => {
    const lines: string[] = ['0 Articulated 66-Stud Light Rail Vehicle'];
    // Floor base: 16 chained 2x4 plates (64 studs)
    for (let i = 0; i < 16; i++) {
      const x = -600 + i * 80;
      lines.push(`1 72 ${x} 0 -20 1 0 0 0 1 0 0 0 1 3020.dat`);
      lines.push(`1 72 ${x} 0 20 1 0 0 0 1 0 0 0 1 3020.dat`);
    }
    // Interlocking floor sub-layer shifted by 40 LDU
    for (let i = 0; i < 15; i++) {
      const x = -560 + i * 80;
      lines.push(`1 71 ${x} -8 0 1 0 0 0 1 0 0 0 1 3020.dat`);
      lines.push(`1 71 ${x} -8 -30 1 0 0 0 1 0 0 0 1 3023.dat`);
      lines.push(`1 71 ${x} -8 30 1 0 0 0 1 0 0 0 1 3023.dat`);
    }
    // Staggered running-bond side walls
    for (let i = 0; i < 16; i++) {
      const x = -600 + i * 80;
      lines.push(`1 15 ${x} -32 -30 1 0 0 0 1 0 0 0 1 3004.dat`);
      lines.push(`1 15 ${x} -32 30 1 0 0 0 1 0 0 0 1 3004.dat`);
    }
    for (let i = 0; i < 15; i++) {
      const x = -560 + i * 80;
      lines.push(`1 4 ${x} -56 -30 1 0 0 0 1 0 0 0 1 3004.dat`);
      lines.push(`1 4 ${x} -56 30 1 0 0 0 1 0 0 0 1 3004.dat`);
    }
    // Overlapping roof deck crossing BOTH 1/3 and 2/3 cut planes
    for (let i = 0; i < 15; i++) {
      const x = -560 + i * 80;
      lines.push(`1 72 ${x} -64 -20 1 0 0 0 1 0 0 0 1 3020.dat`);
      lines.push(`1 72 ${x} -64 20 1 0 0 0 1 0 0 0 1 3020.dat`);
    }
    // Two rooftop AC/pantograph pods sitting directly over the 1/3 and 2/3 cuts
    for (const podX of [-200, 200]) {
      for (const dx of [-40, 0, 40]) {
        lines.push(`1 71 ${podX + dx} -72 0 1 0 0 0 1 0 0 0 1 3022.dat`);
        lines.push(`1 72 ${podX + dx} -96 0 1 0 0 0 1 0 0 0 1 3003.dat`);
        lines.push(`1 15 ${podX + dx} -104 0 1 0 0 0 1 0 0 0 1 3069b.dat`);
      }
    }
    // Tiny 1x1 rooftop beacons near cuts & ends
    for (const bx of [-560, -280, -120, 120, 280, 560]) {
      lines.push(`1 14 ${bx} -72 20 1 0 0 0 1 0 0 0 1 3024.dat`);
    }
    // Asymmetric front nose
    lines.push(`1 4 -620 -32 0 1 0 0 0 1 0 0 0 1 3003.dat`);
    lines.push(`1 1 -620 -56 0 1 0 0 0 1 0 0 0 1 3003.dat`);

    const model = parseLDrawSource(lines.join('\n'), 'muni_lrv4_like.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const { parts, adjacency } = buildSubdivisionInputsFromCanonical(model, graph);

    expect(graph.components).toHaveLength(1);
    const { assessment, proposals } = analyzeModelSubdivisions(parts, adjacency);
    expect(assessment.shouldPrompt).toBe(true);
    expect(assessment.aspectRatio).toBeGreaterThanOrEqual(3.0);

    // 3-segment longitudinal splits and random numbered bags are intentionally excluded from wizard proposals
    expect(proposals.find((p) => p.id === 'prop_long_3')).toBeUndefined();
    expect(proposals.find((p) => p.strategy === 'numbered_bags')).toBeUndefined();

    const thirds = recomputeProposalWithCount('longitudinal_halves', parts, adjacency, 3, false);
    expect(thirds).toBeDefined();
    // Critical regression check: NO floating red 'join' debris cloud!
    expect(thirds!.sections.filter((s) => s.role === 'join')).toHaveLength(0);
    expect(thirds!.sections).toHaveLength(3);

    const allToCheck = [
      ...proposals,
      recomputeProposalWithCount('longitudinal_halves', parts, adjacency, 2, true),
      thirds,
      recomputeProposalWithCount('longitudinal_halves', parts, adjacency, 4, false),
      recomputeProposalWithCount('structural_modules', parts, adjacency, 3, false),
      recomputeProposalWithCount('numbered_bags', parts, adjacency, 3, false),
    ].filter((p): p is NonNullable<typeof p> => p !== null);

    for (const prop of allToCheck) {
      const check = verifyProposalZeroFloating(prop, adjacency);
      expect(
        check.valid,
        `Proposal ${prop.id} (${prop.strategy}) had disconnected sections: ${check.disconnectedSectionIds.join(', ')}`,
      ).toBe(true);

      const covered = new Set<number>();
      for (const sec of prop.sections) {
        const list = sec.repeatPartIndexGroups ? sec.repeatPartIndexGroups.flat() : sec.partIndices;
        for (const idx of list) {
          expect(covered.has(idx)).toBe(false);
          covered.add(idx);
        }
      }
      expect(covered.size).toBe(parts.length);
    }

    // Refuses merging non-adjacent sections (Front + Rear, skipping Middle)
    const refusedMerge = mergeProposedSections(thirds!, 0, 2, parts, adjacency);
    expect(refusedMerge.sections).toHaveLength(3);
    expect(verifyProposalZeroFloating(refusedMerge, adjacency).valid).toBe(true);

    // Adjacent merge and subsequent split stay 100% connected
    const validMerge = mergeProposedSections(thirds!, 0, 1, parts, adjacency);
    expect(validMerge.sections).toHaveLength(2);
    expect(verifyProposalZeroFloating(validMerge, adjacency).valid).toBe(true);

    const resplit = splitProposedSection(validMerge, 0, parts, adjacency);
    expect(resplit.sections).toHaveLength(3);
    expect(verifyProposalZeroFloating(resplit, adjacency).valid).toBe(true);

    // Numbered Build Bags are ALSO cumulatively connected bottom-up
    const bags = recomputeProposalWithCount('numbered_bags', parts, adjacency, 3, false)!;
    const cumulative: number[] = [];
    for (const bag of bags.sections) {
      expect(isConnectedSubgraph(bag.partIndices, adjacency)).toBe(true);
      cumulative.push(...bag.partIndices);
      expect(isConnectedSubgraph(cumulative, adjacency)).toBe(true);
    }
  });

  it('splits wide dioramas into connected Baseplate Sectors with zero floating seam pieces', () => {
    const lines: string[] = ['0 Wide 28x28 Baseplate Diorama'];
    for (let ix = 0; ix < 7; ix++) {
      for (let iz = 0; iz < 14; iz++) {
        lines.push(`1 2 ${ix * 80} 0 ${iz * 40} 1 0 0 0 1 0 0 0 1 3020.dat`);
      }
    }
    for (let iz = 1; iz < 13; iz += 2) {
      lines.push(`1 71 240 -8 ${iz * 40} 1 0 0 0 1 0 0 0 1 3020.dat`);
    }
    const model = parseLDrawSource(lines.join('\n'), 'diorama.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const { parts, adjacency } = buildSubdivisionInputsFromCanonical(model, graph);

    const sectors = buildSpatialSectorsProposal(parts, adjacency);
    expect(sectors).not.toBeNull();
    expect(sectors!.sections.length).toBeGreaterThanOrEqual(2);
    expect(sectors!.sections.filter((s) => s.role === 'join')).toHaveLength(0);
    expect(verifyProposalZeroFloating(sectors!, adjacency).valid).toBe(true);
  });

  it('keeps genuinely disconnected distant assemblies in separate sections instead of floating them inside a car section', () => {
    const base = buildSyntheticTrainChassisLdr();
    const extra: string[] = [];
    for (let x = -40; x <= 40; x += 40) {
      extra.push(`1 6 ${x} 0 320 1 0 0 0 1 0 0 0 1 3003.dat`);
      extra.push(`1 6 ${x} -24 320 1 0 0 0 1 0 0 0 1 3003.dat`);
    }
    const model = parseLDrawSource(`${base}\n${extra.join('\n')}`, 'train_and_bench.ldr', 'ldr');
    const graph = buildConnectivityGraph(model.parts);
    const { parts, adjacency } = buildSubdivisionInputsFromCanonical(model, graph);

    expect(graph.components.length).toBe(2);
    const { proposals } = analyzeModelSubdivisions(parts, adjacency);
    expect(proposals.length).toBeGreaterThanOrEqual(1);
    for (const prop of proposals) {
      expect(verifyProposalZeroFloating(prop, adjacency).valid).toBe(true);
      const covered = new Set<number>();
      for (const sec of prop.sections) {
        for (const idx of sec.repeatPartIndexGroups ? sec.repeatPartIndexGroups.flat() : sec.partIndices) {
          covered.add(idx);
        }
      }
      expect(covered.size).toBe(parts.length);
    }
  });

  it('classifies LEGO connection strengths from first principles (cross-axle & studs strong; round-hole axle, clips, hinges & tile tops weak)', () => {
    const mk = (
      index: number,
      partId: string,
      partName: string,
      min: [number, number, number],
      max: [number, number, number],
    ): SubdivisionPartInput => {
      const box = {
        min,
        max,
        center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] as [number, number, number],
      };
      return {
        index,
        id: `p_${index}`,
        partId,
        partName,
        colorId: 72,
        box,
        ...classifySubdivisionPartFlags(partId, partName, box),
      };
    };

    const axle = mk(0, '3706', 'Technic Axle 6L', [-4, 0, -4], [4, 120, 4]);
    const crossCollar = mk(1, '4032', 'Plate 2 x 2 Round with Axlehole', [-20, 40, -20], [20, 48, 20]);
    const roundHolePlate = mk(2, '3176', 'Plate 3 x 2 with Hole', [-45, 32, -20], [15, 40, 20]);
    const brickBelow = mk(3, '3001', 'Brick 2x4', [-40, 0, -20], [40, 24, 20]);
    const plateAbove = mk(4, '3020', 'Plate 2x4', [-40, 24, -20], [40, 32, 20]);
    const smoothTile = mk(5, '3069b', 'Tile 1x2', [-40, 24, -10], [0, 32, 10]);
    const plateOnTile = mk(6, '3020', 'Plate 2x4', [-40, 32, -20], [40, 40, 20]);
    const clipBrick = mk(7, '60475b', 'Brick 1x1 w/ Vertical Clip', [-10, 0, -10], [10, 24, 10]);
    const barRod = mk(8, '30374', 'Bar 4L', [8, 0, -4], [16, 80, 4]);

    // Axle through cross (+) hole -> STRONG
    expect(classifyConnectionEdge(axle, crossCollar)).toMatchObject({ kind: 'axle_cross', strength: 'strong' });
    // Axle through round hole -> WEAK
    expect(classifyConnectionEdge(axle, roundHolePlate)).toMatchObject({ kind: 'axle_round', strength: 'weak' });
    // Stud connection -> STRONG
    expect(classifyConnectionEdge(brickBelow, plateAbove)).toMatchObject({ kind: 'stud', strength: 'strong' });
    // Piece on top of smooth tile -> WEAK
    expect(classifyConnectionEdge(smoothTile, plateOnTile)).toMatchObject({ kind: 'tile_rest', strength: 'weak' });
    // Clip <-> bar -> WEAK
    expect(classifyConnectionEdge(clipBrick, barRod)).toMatchObject({ kind: 'clip_hinge', strength: 'weak' });
  });

  it('treats tile-majority seams with minimal anchor studs as detachable roofs on both ends while keeping stud-only roofs attached', () => {
    // Two articulated halves (non-train generic vehicle / building wings) connected by a central vertical Technic axle
    // through round holes + cross-axle collar.
    // BOTH halves have removable roofs resting on 8 smooth 1x4 tiles + only 2 minimal 1x1 anchor studs (tileArea >> studArea)!
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

    const buildEndWithRemovableRoof = (prefix: string, sign: -1 | 1) => {
      const bodyIds: number[] = [];
      const roofIds: number[] = [];
      const xs = [60, 140, 220, 300].map((v) => v * sign).sort((a, b) => a - b);

      const wallBases: number[] = [];
      const wallTops: number[] = [];
      let prevFloor = -1;
      for (const x of xs) {
        const fl = addPart(`${prefix}_fl_${x}`, '3020', 'Plate 2x4', [x - 40, 0, -40], [x + 40, 8, 40]);
        const w1 = addPart(`${prefix}_w1_${x}`, '3001', 'Brick 2x4', [x - 40, 8, -40], [x + 40, 32, 40]);
        const w2 = addPart(`${prefix}_w2_${x}`, '3001', 'Brick 2x4', [x - 40, 32, -40], [x + 40, 56, 40]);
        link(fl, w1); link(w1, w2);
        if (prevFloor >= 0) {
          const tie = addPart(`${prefix}_tie_${x}`, '3020', 'Plate 2x4', [x - 80, 8, -20], [x, 16, 20]);
          link(prevFloor, tie); link(fl, tie);
          bodyIds.push(tie);
        }
        prevFloor = fl;
        wallBases.push(w1);
        wallTops.push(w2);
        bodyIds.push(fl, w1, w2);
      }

      // Tile-majority seam at y = 56..64: mostly smooth tiles (2431 Tile 1x4) + only 1 minimal 1x1 anchor plate (3024)!
      const seamTiles: number[] = [];
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        const tileA = addPart(`${prefix}_stA_${x}`, '2431', 'Tile 1x4', [x - 40, 56, -40], [x + 40, 64, -20]);
        const tileB = addPart(`${prefix}_stB_${x}`, '2431', 'Tile 1x4', [x - 40, 56, 20], [x + 40, 64, 40]);
        link(wallTops[i], tileA);
        link(wallTops[i], tileB);
        seamTiles.push(tileA, tileB);
        bodyIds.push(tileA, tileB);
      }
      // Minimal 1x1 anchor stud plate at one corner to hold the roof lightly
      const anchorX = xs[1];
      const anchorStud = addPart(`${prefix}_anchor`, '3024', 'Plate 1x1', [anchorX - 10, 56, -10], [anchorX + 10, 64, 10]);
      link(wallTops[1], anchorStud);
      bodyIds.push(anchorStud);

      // Removable Roof sitting on y = 64..80 (connected via 1 minimal anchor stud + resting on 8 smooth 1x4 tiles!)
      let prevRoof = -1;
      for (let i = 0; i < xs.length; i++) {
        const x = xs[i];
        const rp = addPart(`${prefix}_rp_${x}`, '3020', 'Plate 2x4', [x - 40, 64, -40], [x + 40, 72, 40]);
        const rt = addPart(`${prefix}_rt_${x}`, '87079', 'Tile 2x4', [x - 40, 72, -40], [x + 40, 80, 40]);
        link(rp, rt);
        // Rests on the two smooth 1x4 tiles underneath
        link(seamTiles[i * 2], rp);
        link(seamTiles[i * 2 + 1], rp);
        if (i === 1) link(anchorStud, rp); // Minimal stud connection!
        if (prevRoof >= 0) {
          const rTie = addPart(`${prefix}_rtie_${x}`, '3020', 'Plate 2x4', [x - 80, 72, -20], [x, 80, 20]);
          link(prevRoof, rTie); link(rp, rTie);
          roofIds.push(rTie);
        }
        prevRoof = rp;
        roofIds.push(rp, rt);
      }

      // Coupler tongue with round pinhole extending to x = 0:
      // front sits at y=[24,32] under front_w2 (y=[32,56]); rear sits at y=[32,40] on top of rear_w1 (y=[8,32])!
      const anchorBrick = sign < 0 ? wallTops[wallTops.length - 1] : wallBases[0];
      const tongue = addPart(
        `${prefix}_tongue`,
        '3176',
        'Plate 3 x 2 with Hole',
        sign < 0 ? [-45, 24, -20] : [-15, 32, -20],
        sign < 0 ? [15, 32, 20] : [45, 40, 20],
      );
      link(anchorBrick, tongue);
      bodyIds.push(tongue);

      return { bodyIds, roofIds, tongue };
    };

    const front = buildEndWithRemovableRoof('front', -1);
    const rear = buildEndWithRemovableRoof('rear', 1);

    // Center non-train articulated joint: vertical Technic axle through round holes + 1 cross-axle collar (4032)
    const rod = addPart('pivot_axle', '3706', 'Technic Axle 6L', [-4, 10, -4], [4, 70, 4]);
    const collar = addPart('pivot_collar', '4032', 'Plate 2 x 2 Round with Axlehole', [-20, 40, -20], [20, 48, 20]);
    link(rod, front.tongue);
    link(rod, rear.tongue);
    link(rod, collar);
    link(collar, rear.tongue);

    const { proposals } = analyzeModelSubdivisions(parts, adj);
    const longProp = proposals.find((p) => p.strategy === 'longitudinal_halves')!;
    expect(longProp).toBeDefined();

    // Both removable roofs should be cleanly detected as separate detachable cap sections!
    const capSecs = longProp.sections.filter((s) => s.isDetachableCap);
    expect(capSecs).toHaveLength(2);
    expect(capSecs.map((c) => c.name).sort()).toEqual(['Front Roof', 'Rear Roof']);

    const frontRoofSec = capSecs.find((c) => c.name === 'Front Roof')!;
    const rearRoofSec = capSecs.find((c) => c.name === 'Rear Roof')!;
    expect(new Set(frontRoofSec.partIndices)).toEqual(new Set(front.roofIds));
    expect(new Set(rearRoofSec.partIndices)).toEqual(new Set(rear.roofIds));
    // Roofs lift cleanly upward in 3D exploded preview
    expect(frontRoofSec.explodeOffset[1]).toBeGreaterThan(0.5);
    expect(rearRoofSec.explodeOffset[1]).toBeGreaterThan(0.5);

    // Center joint contains ONLY the Technic axle and cross-axle collar (zero train-specific parts!)
    const joinSec = longProp.sections.find((s) => s.role === 'join')!;
    expect(joinSec).toBeDefined();
    expect(new Set(joinSec.partIndices)).toEqual(new Set([rod, collar]));
    expect(joinSec.articulatedJoin!.pivotRodIndices).toEqual([rod]);
    expect(joinSec.articulatedJoin!.floatingCollarIndices).toEqual([collar]);

    // Exact partition check
    const covered = new Set<number>();
    for (const sec of longProp.sections) {
      for (const idx of sec.partIndices) {
        expect(covered.has(idx)).toBe(false);
        covered.add(idx);
      }
    }
    expect(covered.size).toBe(parts.length);

    // Negative check: when the seam is majority STUDS (plates instead of tiles), roofs stay attached!
    const studParts = parts.map((p) =>
      p.partId === '2431'
        ? { ...p, partId: '3710', partName: 'Plate 1x4' }
        : { ...p },
    );
    const studResult = analyzeModelSubdivisions(studParts, adj);
    const studLongProp = studResult.proposals.find((p) => p.strategy === 'longitudinal_halves')!;
    expect(studLongProp).toBeDefined();
    expect(studLongProp.sections.filter((s) => s.isDetachableCap)).toHaveLength(0);
  });

  it('uses general clip/hinge weak edges to separate non-train hinged assemblies cleanly in structural modules', () => {
    // Non-train spaceship / mech with a central fuselage and 2 side wings attached purely by clip/bar joints
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

    const buildCluster = (prefix: string, cx: number, cz: number, countX: number) => {
      const ids: number[] = [];
      let prev = -1;
      for (let i = 0; i < countX; i++) {
        const x = cx + (i - (countX - 1) / 2) * 80;
        const p1 = addPart(`${prefix}_p_${i}`, '3020', 'Plate 2x4', [x - 40, 0, cz - 40], [x + 40, 8, cz + 40]);
        const b1 = addPart(`${prefix}_b_${i}`, '3001', 'Brick 2x4', [x - 40, 8, cz - 40], [x + 40, 32, cz + 40]);
        const p2 = addPart(`${prefix}_t_${i}`, '3020', 'Plate 2x4', [x - 40, 32, cz - 40], [x + 40, 40, cz + 40]);
        link(p1, b1); link(b1, p2);
        if (prev >= 0) {
          const tie = addPart(`${prefix}_tie_${i}`, '3020', 'Plate 2x4', [x - 80, 32, cz - 20], [x, 40, cz + 20]);
          link(prev, tie); link(b1, tie);
          ids.push(tie);
        }
        prev = b1;
        ids.push(p1, b1, p2);
      }
      return ids;
    };

    const core = buildCluster('core', 0, 0, 4);
    const leftWing = buildCluster('lwing', 0, -110, 4);
    const rightWing = buildCluster('rwing', 0, 110, 4);

    // Attach left & right wings to core via weak clip <-> bar hinge joints
    const coreBarL = addPart('core_bar_l', '48729', 'Bar Holder with Clip', [-20, 8, -50], [20, 32, -38]);
    const wingClipL = addPart('wing_clip_l', '60475b', 'Brick 1x1 w/ Vertical Clip', [-20, 8, -72], [20, 32, -48]);
    link(core[0], coreBarL);
    link(leftWing[0], wingClipL);
    link(coreBarL, wingClipL);

    const coreBarR = addPart('core_bar_r', '48729', 'Bar Holder with Clip', [-20, 8, 38], [20, 32, 50]);
    const wingClipR = addPart('wing_clip_r', '60475b', 'Brick 1x1 w/ Vertical Clip', [-20, 8, 48], [20, 32, 72]);
    link(core[0], coreBarR);
    link(rightWing[0], wingClipR);
    link(coreBarR, wingClipR);

    const { proposals } = analyzeModelSubdivisions(parts, adj);
    const modProp = proposals.find((p) => p.strategy === 'structural_modules')!;
    expect(modProp).toBeDefined();
    // All 3 hinged assemblies (core + 2 wings) should stay cleanly separated along the weak clip joints!
    const totalSections = modProp.sections.reduce(
      (acc, s) => acc + (s.repeatPartIndexGroups ? s.repeatPartIndexGroups.length : 1),
      0,
    );
    expect(totalSections).toBe(3);
  });

  describe('Split by Baseplate', () => {
    /** Two 16x32 baseplates side by side (x = -160 / +160), each with a small brick building, plus an optional bridge. */
    function buildTwoBaseplateLdr(withBridge: boolean, withUpperFloorPlate = false): string {
      const lines: string[] = ['0 Two Baseplate Layout'];
      lines.push('1 2 -160 0 0 1 0 0 0 1 0 0 0 1 3857.dat');
      lines.push('1 2 160 0 0 1 0 0 0 1 0 0 0 1 3857.dat');
      for (const cx of [-160, 160]) {
        for (const layerY of [-24, -48, -72]) {
          for (const dz of [-120, -40, 40, 120]) {
            lines.push(`1 4 ${cx - 40} ${layerY} ${dz} 1 0 0 0 1 0 0 0 1 3001.dat`);
            lines.push(`1 4 ${cx + 40} ${layerY} ${dz} 1 0 0 0 1 0 0 0 1 3001.dat`);
          }
        }
      }
      if (withBridge) {
        // 2x4 brick wall layers on each side of the seam + a plate tying them together on top
        lines.push('1 15 -20 -24 0 0 0 1 0 1 0 -1 0 0 3001.dat');
        lines.push('1 15 20 -24 0 0 0 1 0 1 0 -1 0 0 3001.dat');
        lines.push('1 15 0 -32 0 1 0 0 0 1 0 0 0 1 3020.dat');
      }
      if (withUpperFloorPlate) {
        // A 16x16 baseplate-sized plate used as an upper floor must NOT count as a ground baseplate
        lines.push('1 7 -160 -76 0 1 0 0 0 1 0 0 0 1 3867.dat');
      }
      return lines.join('\n');
    }

    function prep(src: string) {
      const model = parseLDrawSource(src, 'layout.ldr', 'ldr');
      const graph = buildConnectivityGraph(model.parts);
      return buildSubdivisionInputsFromCanonical(model, graph);
    }

    it('detects only ground-level baseplates', () => {
      const { parts } = prep(buildTwoBaseplateLdr(false, true));
      const plates = detectGroundBaseplates(parts);
      expect(plates).toHaveLength(2);
      for (const idx of plates) expect(parts[idx].partId).toContain('3857');
    });

    it('creates one connected section per baseplate covering every part', () => {
      const { parts, adjacency } = prep(buildTwoBaseplateLdr(true));
      const prop = buildBaseplateSplitProposal(parts, adjacency);
      expect(prop).not.toBeNull();
      expect(prop!.strategy).toBe('baseplates');
      expect(prop!.outputMode).toBe('modular_chapters');
      const plateSecs = prop!.sections.filter((s) => s.id.startsWith('sec_baseplate_'));
      expect(plateSecs).toHaveLength(2);
      expect(plateSecs[0].name).toMatch(/^Baseplate 1 \(16×32\)$/);
      expect(verifyProposalZeroFloating(prop!, adjacency).valid).toBe(true);

      const plates = detectGroundBaseplates(parts);
      const owner = (idx: number) => plateSecs.findIndex((s) => s.partIndices.includes(idx));
      expect(owner(plates[0])).not.toBe(owner(plates[1]));

      const covered = new Set<number>();
      for (const sec of prop!.sections) for (const idx of sec.partIndices) covered.add(idx);
      expect(covered.size).toBe(parts.length);
    });

    it('works for separate unconnected baseplates and is offered by the analyzer', () => {
      const { parts, adjacency } = prep(buildTwoBaseplateLdr(false));
      const { proposals } = analyzeModelSubdivisions(parts, adjacency);
      const prop = proposals.find((p) => p.strategy === 'baseplates');
      expect(prop).toBeDefined();
      expect(prop!.sections.filter((s) => s.id.startsWith('sec_baseplate_'))).toHaveLength(2);
      expect(verifyProposalZeroFloating(prop!, adjacency).valid).toBe(true);
      expect(recomputeProposalWithCount('baseplates', parts, adjacency, 2)?.strategy).toBe('baseplates');
    });

    it('is not offered when the model has a single baseplate', () => {
      const lines = ['0 Single', '1 2 0 0 0 1 0 0 0 1 0 0 0 1 3811.dat'];
      for (let i = 0; i < 12; i++) lines.push(`1 4 ${-200 + i * 40} -24 0 1 0 0 0 1 0 0 0 1 3001.dat`);
      const { parts, adjacency } = prep(lines.join('\n'));
      expect(buildBaseplateSplitProposal(parts, adjacency)).toBeNull();
    });

    it('separates all three collinear baseplates evenly instead of sticking two together', () => {
      // Three 16x32 baseplates in a row, with slightly uneven spacing so the middle plate is
      // not at the exact overall bounding-box center (the case that broke unit-vector explode).
      const lines: string[] = ['0 Three Baseplates In A Row'];
      const centersX = [-360, 20, 380];
      for (const cx of centersX) {
        lines.push(`1 2 ${cx} 0 0 1 0 0 0 1 0 0 0 1 3857.dat`);
        for (const layerY of [-24, -48]) {
          for (const dz of [-80, 0, 80]) {
            lines.push(`1 4 ${cx - 40} ${layerY} ${dz} 1 0 0 0 1 0 0 0 1 3001.dat`);
            lines.push(`1 4 ${cx + 40} ${layerY} ${dz} 1 0 0 0 1 0 0 0 1 3001.dat`);
          }
        }
      }
      const { parts, adjacency } = prep(lines.join('\n'));
      const prop = buildBaseplateSplitProposal(parts, adjacency);
      expect(prop).not.toBeNull();
      const plateSecs = prop!.sections.filter((s) => s.id.startsWith('sec_baseplate_'));
      expect(plateSecs).toHaveLength(3);

      const xs = plateSecs.map((s) => s.explodeOffset[0]).sort((a, b) => a - b);
      // Every adjacent pair must have a substantial positive separation (no two sections stuck together)
      expect(xs[1] - xs[0]).toBeGreaterThan(0.7);
      expect(xs[2] - xs[1]).toBeGreaterThan(0.7);
      // Leftmost goes negative, rightmost goes positive, middle stays near center
      expect(xs[0]).toBeLessThan(-0.8);
      expect(Math.abs(xs[1])).toBeLessThan(0.25);
      expect(xs[2]).toBeGreaterThan(0.8);
    });
  });

  it('computeRadialExplodeOffsets expands collinear, grid, and L-shaped layouts proportionally', () => {
    // 3 collinear sections (even off-center)
    const row = computeRadialExplodeOffsets(
      [
        [-300, 0, 0],
        [40, 0, 0],
        [340, 0, 0],
      ],
      { horizontalOnly: true, scale: 1.0 },
    );
    expect(row[0][0]).toBeCloseTo(-1.0, 2);
    expect(row[1][0]).toBeGreaterThan(row[0][0] + 0.5);
    expect(row[2][0]).toBeGreaterThan(row[1][0] + 0.5);

    // 2x2 grid expands symmetrically
    const grid = computeRadialExplodeOffsets(
      [
        [-100, 0, -100],
        [100, 0, -100],
        [-100, 0, 100],
        [100, 0, 100],
      ],
      { horizontalOnly: true, scale: 1.0 },
    );
    for (let i = 0; i < grid.length; i++) {
      for (let j = i + 1; j < grid.length; j++) {
        const sep = Math.hypot(grid[i][0] - grid[j][0], grid[i][2] - grid[j][2]);
        expect(sep).toBeGreaterThan(1.3);
      }
    }
  });
});
