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
});
