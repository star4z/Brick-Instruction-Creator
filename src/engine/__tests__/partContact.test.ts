import { describe, expect, it } from 'vitest';
import { compileDatEntry, type DatEntrySource } from '../datCompiler';
import {
  DEFAULT_STUDIO_CAMERA,
  type StudioCameraPose,
} from '../minifigCamera';
import type { Mat3, WorldBox } from '../minifigPose';
import {
  compareFrontierCandidates,
  computeBoundsFromBoxes,
  expandBoundsWithBox,
  selectDynamicStepIndices,
  type DynamicPartDescriptor,
} from '../dynamicStepSizer';
import {
  buildLocalSubBoxes,
  buildPhysicalVerticalPrereqMap,
  minSubBoxGap,
  partsPhysicallyTouch,
  transformLocalBox6ToWorld,
  type LocalBox6,
} from '../partContact';

const R_ID: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];
const R_180_Y: Mat3 = [-1, 0, 0, 0, 1, 0, 0, 0, -1];
const R_90_Y: Mat3 = [0, 0, 1, 0, 1, 0, -1, 0, 0];

/** Emits LDraw type-4 quad lines for an axis-aligned solid box in Y-up coords converted to LDraw Y-down/Z-flipped. */
function ldrawBoxQuads(
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number,
): string[] {
  // Convert desired Y-up (x, y, z) -> LDraw (x, -y, -z)
  const x0 = minX, x1 = maxX;
  const y0 = -maxY, y1 = -minY;
  const z0 = -maxZ, z1 = -minZ;
  return [
    // Top & bottom
    `4 16 ${x0} ${y0} ${z0} ${x1} ${y0} ${z0} ${x1} ${y0} ${z1} ${x0} ${y0} ${z1}`,
    `4 16 ${x0} ${y1} ${z1} ${x1} ${y1} ${z1} ${x1} ${y1} ${z0} ${x0} ${y1} ${z0}`,
    // Front & back
    `4 16 ${x0} ${y0} ${z0} ${x0} ${y1} ${z0} ${x1} ${y1} ${z0} ${x1} ${y0} ${z0}`,
    `4 16 ${x1} ${y0} ${z1} ${x1} ${y1} ${z1} ${x0} ${y1} ${z1} ${x0} ${y0} ${z1}`,
    // Left & right
    `4 16 ${x0} ${y0} ${z1} ${x0} ${y1} ${z1} ${x0} ${y1} ${z0} ${x0} ${y0} ${z0}`,
    `4 16 ${x1} ${y0} ${z0} ${x1} ${y1} ${z0} ${x1} ${y1} ${z1} ${x1} ${y0} ${z1}`,
  ];
}

function makeWorldBox(
  minX: number, minY: number, minZ: number,
  maxX: number, maxY: number, maxZ: number,
): WorldBox {
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
  };
}

function compileLines(key: string, lines: string[]) {
  const src: DatEntrySource = { key, lines };
  return compileDatEntry(src, () => null);
}

describe('Concave Sub-Box Collider & Zero-Floating Support Rules', () => {
  it('rejects false concave AABB overlap between T-shaped Train Wheel Holder and Bogie Side Plate while keeping real stud connections', () => {
    // T-shaped Train Wheel Holder (local Y-up):
    // - Wide wheel housing: x in [-80, -40], z in [-60, +60], y in [8, 36]
    // - Narrow lowered center deck: x in [-40, 0], z in [-20, +20], y in [8, 28]
    // Empty side cutouts: x in [-40, 0], z in [-60, -20] and [+20, +60]
    const wheelHolderLines = [
      ...ldrawBoxQuads(-80, 8, -60, -40, 36, 60),
      ...ldrawBoxQuads(-40, 8, -20, 0, 28, 20),
    ];
    const whCompiled = compileLines('wh_2878', wheelHolderLines)!;
    expect(whCompiled).not.toBeNull();
    expect(whCompiled.subBoxes).toBeDefined();
    expect(whCompiled.subBoxes!.length).toBeGreaterThan(1);

    // L-shaped Bogie Side Plate (local Y-up):
    // - 1x4 top stud flange: x in [-40, +40], z in [+20, +40], y in [24, 36]
    // - Hanging decorative outer skirt: x in [-40, +40], z in [+38, +60], y in [10, 32]
    const sidePlateLines = [
      ...ldrawBoxQuads(-40, 24, 20, 40, 36, 40),
      ...ldrawBoxQuads(-40, 10, 38, 40, 32, 60),
    ];
    const spCompiled = compileLines('sp_bogie', sidePlateLines)!;
    expect(spCompiled).not.toBeNull();
    expect(spCompiled.subBoxes).toBeDefined();

    // Place WH1 at origin (facing -X) and WH2 rotated 180° around Y (facing +X)
    const wh1Box = makeWorldBox(-80, 8, -60, 0, 36, 60);
    const wh1Subs = whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0));

    const wh2Box = makeWorldBox(0, 8, -60, 80, 36, 60);
    const wh2Subs = whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_180_Y, 0, 0, 0));

    // Place SP1 (right side, +Z) and SP2 (left side, -Z via 180° Y rotation)
    const sp1Box = makeWorldBox(-40, 10, 20, 40, 36, 60);
    const sp1Subs = spCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0));

    const sp2Box = makeWorldBox(-40, 10, -60, 40, 36, -20);
    const sp2Subs = spCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_180_Y, 0, 0, 0));

    // Center plate bridging WH1 and WH2 on their lowered center deck (y = 24..32)
    const pCenterBox = makeWorldBox(-40, 24, -20, 40, 32, 20);
    // Top spanning plate locking WH1, WH2, SP1, SP2 together from above (y = 32..40)
    const pTopBox = makeWorldBox(-60, 32, -60, 60, 40, 60);

    // 1. Neither Bogie Side Plate physically touches either Wheel Holder!
    expect(partsPhysicallyTouch(wh1Box, sp1Box, wh1Subs, sp1Subs, 'wheel_holder', 'structural', false, false)).toBe(false);
    expect(partsPhysicallyTouch(wh2Box, sp1Box, wh2Subs, sp1Subs, 'wheel_holder', 'structural', false, false)).toBe(false);
    expect(partsPhysicallyTouch(wh1Box, sp2Box, wh1Subs, sp2Subs, 'wheel_holder', 'structural', false, false)).toBe(false);
    expect(partsPhysicallyTouch(wh2Box, sp2Box, wh2Subs, sp2Subs, 'wheel_holder', 'structural', false, false)).toBe(false);

    // 2. Front & Rear Wheel Holders sitting nose-to-nose do NOT stick to each other without a bridging plate!
    expect(partsPhysicallyTouch(wh1Box, wh2Box, wh1Subs, wh2Subs, 'wheel_holder', 'wheel_holder', false, false)).toBe(false);

    // 3. Center plate genuinely connects to BOTH wheel holders, and NOT to the Bogie Side Plates!
    expect(partsPhysicallyTouch(wh1Box, pCenterBox, wh1Subs, null, 'wheel_holder', 'structural', false, false)).toBe(true);
    expect(partsPhysicallyTouch(wh2Box, pCenterBox, wh2Subs, null, 'wheel_holder', 'structural', false, false)).toBe(true);
    expect(partsPhysicallyTouch(sp1Box, pCenterBox, sp1Subs, null, 'structural', 'structural', false, false)).toBe(false);

    // 4. Top spanning plate genuinely connects to WH1, WH2, SP1, AND SP2!
    expect(partsPhysicallyTouch(wh1Box, pTopBox, wh1Subs, null, 'wheel_holder', 'structural', false, false)).toBe(true);
    expect(partsPhysicallyTouch(wh2Box, pTopBox, wh2Subs, null, 'wheel_holder', 'structural', false, false)).toBe(true);
    expect(partsPhysicallyTouch(sp1Box, pTopBox, sp1Subs, null, 'structural', 'structural', false, false)).toBe(true);
    expect(partsPhysicallyTouch(sp2Box, pTopBox, sp2Subs, null, 'structural', 'structural', false, false)).toBe(true);
  });

  it('orders Bogie Side Plates AFTER the spanning top plate so zero pieces ever float in any step', () => {
    const whCompiled = compileLines('wh_2878', [
      ...ldrawBoxQuads(-80, 8, -60, -40, 36, 60),
      ...ldrawBoxQuads(-40, 8, -20, 0, 28, 20),
    ])!;
    const spCompiled = compileLines('sp_bogie', [
      ...ldrawBoxQuads(-40, 24, 20, 40, 36, 40),
      ...ldrawBoxQuads(-40, 10, 38, 40, 32, 60),
    ])!;

    const names = ['WH1', 'WH2', 'SP1', 'SP2', 'P_center', 'P_top', 'W1', 'W2', 'W3', 'W4'];
    const roles = [
      'wheel_holder', 'wheel_holder',
      'structural', 'structural',
      'structural', 'structural',
      'wheel', 'wheel', 'wheel', 'wheel',
    ];
    const skus = ['2878|72', '2878|72', 'sp|0', 'sp|0', '3020|72', '3032|72', '55423|72', '55423|72', '55423|72', '55423|72'];
    const partIds = ['2878', '2878', 'sp', 'sp', '3020', '3032', '55423', '55423', '55423', '55423'];
    const boxes: WorldBox[] = [
      makeWorldBox(-80, 8, -60, 0, 36, 60),   // 0: WH1
      makeWorldBox(0, 8, -60, 80, 36, 60),    // 1: WH2
      makeWorldBox(-40, 10, 20, 40, 36, 60),  // 2: SP1 (Bogie Side Plate R)
      makeWorldBox(-40, 10, -60, 40, 36, -20),// 3: SP2 (Bogie Side Plate L)
      makeWorldBox(-40, 24, -20, 40, 32, 20), // 4: P_center
      makeWorldBox(-60, 32, -60, 60, 40, 60), // 5: P_top
      makeWorldBox(-70, 0, -56, -50, 20, -44),// 6: W1
      makeWorldBox(-70, 0, 44, -50, 20, 56),  // 7: W2
      makeWorldBox(50, 0, -56, 70, 20, -44),  // 8: W3
      makeWorldBox(50, 0, 44, 70, 20, 56),    // 9: W4
    ];
    const subBoxes: (WorldBox[] | null)[] = [
      whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0)),
      whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_180_Y, 0, 0, 0)),
      spCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0)),
      spCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_180_Y, 0, 0, 0)),
      null, null, null, null, null, null,
    ];
    const cladding = roles.map(() => false);
    const adj: number[][] = boxes.map(() => []);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const scA = roles[i] === 'wheel';
        const scB = roles[j] === 'wheel';
        if (partsPhysicallyTouch(boxes[i], boxes[j], subBoxes[i], subBoxes[j], roles[i], roles[j], scA, scB)) {
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }

    // Verify true graph: SP1 & SP2 ONLY connect to P_top (index 5)
    expect(adj[2]).toEqual([5]);
    expect(adj[3]).toEqual([5]);

    const { belowMap } = buildPhysicalVerticalPrereqMap(boxes, adj, roles, cladding, undefined, subBoxes);
    // SP1 and SP2 are pure top-hung leaves -> must NOT block P_top!
    expect(belowMap[5]).not.toContain(2);
    expect(belowMap[5]).not.toContain(3);

    // Run exact submodel step loop and assert ZERO floating pieces in every step!
    const descriptors: DynamicPartDescriptor[] = boxes.map((box, index) => ({
      index,
      partId: partIds[index],
      colorId: 0,
      sku: skus[index],
      role: roles[index],
      box,
      layerY: box.min[1],
      isCladding: false,
    }));
    const modelBounds = computeBoundsFromBoxes(boxes);
    let builtBounds: WorldBox | null = null;
    const activeCam: StudioCameraPose = { ...DEFAULT_STUDIO_CAMERA };
    const placed = new Set<number>();
    const remaining = new Set<number>(boxes.map((_, i) => i));
    const stepHistory: number[][] = [];

    while (remaining.size > 0) {
      const placedBeforeStep = new Set(placed);
      let frontier: number[];
      if (placed.size === 0) {
        const pool = Array.from(remaining).filter((i) => roles[i] !== 'wheel' && !belowMap[i].some((u) => remaining.has(u)));
        pool.sort((a, b) => descriptors[a].layerY - descriptors[b].layerY);
        const minY = descriptors[pool[0]].layerY;
        const lowBand = pool.filter((i) => descriptors[i].layerY <= minY + 32);
        lowBand.sort((a, b) => {
          const sa = (roles[a] === 'structural' || roles[a] === 'wheel_holder' ? 50 : 0) + adj[a].length * 6 - (descriptors[a].layerY - minY) * 0.8;
          const sb = (roles[b] === 'structural' || roles[b] === 'wheel_holder' ? 50 : 0) + adj[b].length * 6 - (descriptors[b].layerY - minY) * 0.8;
          return sb - sa;
        });
        frontier = lowBand;
      } else {
        const rawFrontier = Array.from(remaining).filter((i) => adj[i].some((nb) => placedBeforeStep.has(nb)));
        const unblocked = rawFrontier.filter((i) => !belowMap[i].some((u) => remaining.has(u)));
        frontier = unblocked.length > 0 ? unblocked : rawFrontier;
        const skuCounts = new Map<string, number>();
        for (const idx of frontier) skuCounts.set(descriptors[idx].sku, (skuCounts.get(descriptors[idx].sku) ?? 0) + 1);
        frontier.sort((a, b) => compareFrontierCandidates(descriptors[a], descriptors[b], activeCam.corner, builtBounds ?? modelBounds, skuCounts));
      }

      const anchor = frontier[0];
      const anchorY = descriptors[anchor].layerY;
      const stepIdx = selectDynamicStepIndices({
        anchor,
        parts: descriptors,
        getEligibleCandidates: (placedInStep) =>
          Array.from(remaining).filter((i) => {
            if (placedInStep.has(i)) return false;
            if (Math.abs(descriptors[i].layerY - anchorY) > 12) return false;
            if (placedBeforeStep.size > 0) {
              if (belowMap[i].some((u) => !placedBeforeStep.has(u))) return false;
              return adj[i].some((nb) => placedBeforeStep.has(nb));
            }
            if (belowMap[i].length > 0) return false;
            return adj[i].some((nb) => placedInStep.has(nb));
          }),
        modelBounds,
        builtBounds,
        activeCam,
        isFirstStep: stepHistory.length === 0,
        totalPartsInScope: boxes.length,
        isSubmodel: true,
      });

      // INVARIANT: Every piece in Step > 1 MUST physically connect to at least one piece already built!
      if (placedBeforeStep.size > 0) {
        for (const pi of stepIdx) {
          const connected = adj[pi].some((nb) => placedBeforeStep.has(nb));
          expect(connected, `Part ${names[pi]} floated in step ${stepHistory.length + 1}`).toBe(true);
        }
      }
      stepHistory.push(stepIdx);
      for (const pi of stepIdx) {
        remaining.delete(pi);
        placed.add(pi);
        builtBounds = expandBoundsWithBox(builtBounds, boxes[pi]);
      }
    }

    const stepOf = (partIdx: number) => stepHistory.findIndex((s) => s.includes(partIdx));
    // P_top (5) MUST be placed strictly BEFORE both Bogie Side Plates (2, 3)!
    expect(stepOf(5)).toBeLessThan(stepOf(2));
    expect(stepOf(5)).toBeLessThan(stepOf(3));
    // Both identical Bogie Side Plates group cleanly into the same step!
    expect(stepOf(2)).toBe(stepOf(3));
  });

  it('preserves solid underside clutch for hollow bricks (both with skipped stud4 tubes and without)', () => {
    // Hollow 4x4 brick (x,z in [-40, +40], y in [-24, 0]): top face + 4 outer walls, NO bottom face
    const topWallLines = [
      // Top roof
      ...ldrawBoxQuads(-40, -4, -40, 40, 0, 40),
      // 4 outer walls (3.2 LDU thick)
      ...ldrawBoxQuads(-40, -24, -40, -36.8, -4, 40),
      ...ldrawBoxQuads(36.8, -24, -40, 40, -4, 40),
      ...ldrawBoxQuads(-36.8, -24, -40, 36.8, -4, -36.8),
      ...ldrawBoxQuads(-36.8, -24, 36.8, 36.8, -4, 40),
    ];
    const hollowNoStud4 = compileLines('hollow_4x4', topWallLines)!;
    const hollowWithStud4 = compileLines('hollow_4x4_s4', [
      ...topWallLines,
      '1 16 0 4 0 1 0 0 0 20 0 0 0 1 stud4.dat',
    ])!;

    const upperBox = makeWorldBox(-40, 24, -40, 40, 48, 40);
    const upperSubsA = hollowNoStud4.subBoxes?.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 48, 0)) ?? null;
    const upperSubsB = hollowWithStud4.subBoxes?.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 48, 0)) ?? null;

    // 1x1 brick standing directly underneath the CENTER (0, 0) of the hollow 4x4 brick
    const center1x1Box = makeWorldBox(-10, 0, -10, 10, 28, 10);

    expect(partsPhysicallyTouch(upperBox, center1x1Box, upperSubsA, null, 'structural', 'structural', false, false)).toBe(true);
    expect(partsPhysicallyTouch(upperBox, center1x1Box, upperSubsB, null, 'structural', 'structural', false, false)).toBe(true);
  });

  it('rejects false overlap in empty cutout of L-shaped corner plate and open arch while preserving real contacts', () => {
    // 2x2 L-shaped corner plate (arms along [-20..20, -20..0] and [-20..0, 0..20]; cutout at [0..20, 0..20])
    const cornerCompiled = compileLines('corner_2420', [
      ...ldrawBoxQuads(-20, 0, -20, 20, 12, 0),
      ...ldrawBoxQuads(-20, 0, 0, 0, 12, 20),
    ])!;
    expect(cornerCompiled.subBoxes).toBeDefined();

    const cornerBox = makeWorldBox(-20, 0, -20, 20, 12, 20);
    const cornerSubs = cornerCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0));

    // Unrelated 1x1 brick standing inside the empty [0..20, 0..20] corner cutout
    const notchBrick = makeWorldBox(0, 0, 0, 20, 28, 20);
    expect(partsPhysicallyTouch(cornerBox, notchBrick, cornerSubs, null, 'structural', 'structural', false, false)).toBe(false);

    // 1x1 brick stacked on top of the solid [-20..0, 0..20] arm
    const stackedBrick = makeWorldBox(-20, 8, 0, 0, 32, 20);
    expect(partsPhysicallyTouch(cornerBox, stackedBrick, cornerSubs, null, 'structural', 'structural', false, false)).toBe(true);

    // Arch (left pillar [-40..-20], right pillar [+20..+40], top bridge y in [32..48]; open doorway x in [-20..+20], y in [0..32])
    const archCompiled = compileLines('arch_3659', [
      ...ldrawBoxQuads(-40, 0, -10, -20, 32, 10),
      ...ldrawBoxQuads(20, 0, -10, 40, 32, 10),
      ...ldrawBoxQuads(-40, 32, -10, 40, 48, 10),
    ])!;
    expect(archCompiled.subBoxes).toBeDefined();

    const archBox = makeWorldBox(-40, 0, -10, 40, 48, 10);
    const archSubs = archCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0));

    // Prop standing under the open arch (not touching pillars or ceiling)
    const propUnderArch = makeWorldBox(-10, 0, -10, 10, 24, 10);
    expect(partsPhysicallyTouch(archBox, propUnderArch, archSubs, null, 'structural', 'structural', false, false)).toBe(false);

    // Brick stacked on top of the arch
    const brickOnArch = makeWorldBox(-20, 44, -10, 20, 68, 10);
    expect(partsPhysicallyTouch(archBox, brickOnArch, archSubs, null, 'structural', 'structural', false, false)).toBe(true);

    // Rotated arch (90° around Y) still rejects prop standing under it
    const rotArchBox = makeWorldBox(-10, 0, -40, 10, 48, 40);
    const rotArchSubs = archCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_90_Y, 0, 0, 0));
    expect(partsPhysicallyTouch(rotArchBox, propUnderArch, rotArchSubs, null, 'structural', 'structural', false, false)).toBe(false);
  });

  it('keeps floor-supported interior parts in belowMap (no trapping) while excluding pure top-hung parts', () => {
    // 0: Floor plate (y = 0..8)
    // 1: Left wall (y = 8..32, sitting on floor)
    // 2: Interior seat/pillar (y = 8..32, sitting on floor)
    // 3: Roof plate (y = 32..40, sitting on left wall + interior seat + hanging skirt)
    // 4: Hanging exterior skirt (y = 12..32, ONLY connected to roof from above!)
    const boxes: WorldBox[] = [
      makeWorldBox(-40, 0, -20, 40, 8, 20),   // 0: Floor
      makeWorldBox(-40, 8, -20, -20, 32, 20), // 1: Left wall
      makeWorldBox(0, 8, -20, 20, 32, 20),    // 2: Interior pillar
      makeWorldBox(-40, 32, -20, 60, 40, 20), // 3: Roof
      makeWorldBox(40, 12, -20, 60, 32, 20),  // 4: Hanging skirt (only touches roof!)
    ];
    const roles = ['structural', 'structural', 'structural', 'structural', 'structural'];
    const cladding = [false, false, false, false, false];
    const adj: number[][] = [
      [1, 2],       // 0: Floor -> Left wall, Interior pillar
      [0, 3],       // 1: Left wall -> Floor, Roof
      [0, 3],       // 2: Interior pillar -> Floor, Roof
      [1, 2, 4],    // 3: Roof -> Left wall, Interior pillar, Hanging skirt
      [3],          // 4: Hanging skirt -> ONLY Roof!
    ];

    const { belowMap } = buildPhysicalVerticalPrereqMap(boxes, adj, roles, cladding);

    // Floor-supported wall (1) and interior pillar (2) MUST block Roof (3) so they are never trapped
    expect(belowMap[3]).toContain(1);
    expect(belowMap[3]).toContain(2);

    // Pure top-hung skirt (4) has NO lower support -> MUST NOT block Roof (3)
    expect(belowMap[3]).not.toContain(4);
  });

  it('prefers real vertical overlap over empty concave cutout air in minSubBoxGap', () => {
    const whSubBoxes: WorldBox[] = [
      makeWorldBox(-80, 8, -60, -40, 36, 60),
      makeWorldBox(-40, 8, -20, 0, 28, 20),
    ];
    const whOuter = makeWorldBox(-80, 8, -60, 0, 36, 60);
    const spBox = makeWorldBox(-38, 10, 22, 38, 36, 60); // 2 LDU clearance from WH1 faces
    const pTopBox = makeWorldBox(-60, 37, -60, 60, 45, 60); // 1 LDU vertical gap above SP1

    const toWh = minSubBoxGap(spBox, whOuter, null, whSubBoxes);
    const toTop = minSubBoxGap(spBox, pTopBox, null, null);

    expect(toWh.hasVerticalOverlap).toBe(false);
    expect(toTop.hasVerticalOverlap).toBe(true);
    expect(toTop.gap).toBeLessThan(toWh.gap);
  });

  it('orders Bogie Side Plates AFTER P_top even when no separate center plate exists (only top spanning plate)', () => {
    const whCompiled = compileLines('wh_2878', [
      ...ldrawBoxQuads(-80, 8, -60, -40, 36, 60),
      ...ldrawBoxQuads(-40, 8, -20, 0, 28, 20),
    ])!;
    const spCompiled = compileLines('sp_bogie', [
      ...ldrawBoxQuads(-40, 24, 20, 40, 36, 40),
      ...ldrawBoxQuads(-40, 10, 38, 40, 32, 60),
    ])!;

    // Only WH1, WH2, SP1, SP2, P_top, and 4 wheels (no P_center)
    const roles = ['wheel_holder', 'wheel_holder', 'structural', 'structural', 'structural', 'wheel', 'wheel', 'wheel', 'wheel'];
    const skus = ['2878|72', '2878|72', 'sp|0', 'sp|0', '3032|72', '55423|72', '55423|72', '55423|72', '55423|72'];
    const partIds = ['2878', '2878', 'sp', 'sp', '3032', '55423', '55423', '55423', '55423'];
    const boxes: WorldBox[] = [
      makeWorldBox(-80, 8, -60, 0, 36, 60),    // 0: WH1
      makeWorldBox(0, 8, -60, 80, 36, 60),     // 1: WH2
      makeWorldBox(-40, 10, 20, 40, 36, 60),   // 2: SP1
      makeWorldBox(-40, 10, -60, 40, 36, -20), // 3: SP2
      makeWorldBox(-60, 32, -60, 60, 40, 60),  // 4: P_top
      makeWorldBox(-70, 0, -56, -50, 20, -44), // 5: W1
      makeWorldBox(-70, 0, 44, -50, 20, 56),   // 6: W2
      makeWorldBox(50, 0, -56, 70, 20, -44),   // 7: W3
      makeWorldBox(50, 0, 44, 70, 20, 56),     // 8: W4
    ];
    const subBoxes: (WorldBox[] | null)[] = [
      whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0)),
      whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_180_Y, 0, 0, 0)),
      spCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0)),
      spCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_180_Y, 0, 0, 0)),
      null, null, null, null, null,
    ];
    const adj: number[][] = boxes.map(() => []);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const scA = roles[i] === 'wheel';
        const scB = roles[j] === 'wheel';
        if (partsPhysicallyTouch(boxes[i], boxes[j], subBoxes[i], subBoxes[j], roles[i], roles[j], scA, scB)) {
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }
    const { belowMap } = buildPhysicalVerticalPrereqMap(boxes, adj, roles, roles.map(() => false), undefined, subBoxes);
    expect(belowMap[4]).toEqual([]); // Pure top-hung WH1, WH2, SP1, SP2 never block P_top!

    const descriptors: DynamicPartDescriptor[] = boxes.map((box, index) => ({
      index, partId: partIds[index], colorId: 0, sku: skus[index], role: roles[index],
      box, layerY: box.min[1], isCladding: false,
    }));
    const modelBounds = computeBoundsFromBoxes(boxes);
    let builtBounds: WorldBox | null = null;
    const activeCam: StudioCameraPose = { ...DEFAULT_STUDIO_CAMERA };
    const placed = new Set<number>();
    const remaining = new Set<number>(boxes.map((_, i) => i));
    const stepHistory: number[][] = [];

    while (remaining.size > 0) {
      const placedBeforeStep = new Set(placed);
      let frontier: number[];
      if (placed.size === 0) {
        const pool = Array.from(remaining).filter((i) => roles[i] !== 'wheel' && !belowMap[i].some((u) => remaining.has(u)));
        pool.sort((a, b) => descriptors[a].layerY - descriptors[b].layerY);
        const minY = descriptors[pool[0]].layerY;
        const lowBand = pool.filter((i) => descriptors[i].layerY <= minY + 32);
        lowBand.sort((a, b) => {
          const sa = (roles[a] === 'structural' || roles[a] === 'wheel_holder' ? 50 : 0) + adj[a].length * 6 - (descriptors[a].layerY - minY) * 0.8;
          const sb = (roles[b] === 'structural' || roles[b] === 'wheel_holder' ? 50 : 0) + adj[b].length * 6 - (descriptors[b].layerY - minY) * 0.8;
          return sb - sa;
        });
        frontier = lowBand;
      } else {
        const rawFrontier = Array.from(remaining).filter((i) => adj[i].some((nb) => placedBeforeStep.has(nb)));
        frontier = rawFrontier;
        const skuCounts = new Map<string, number>();
        for (const idx of frontier) skuCounts.set(descriptors[idx].sku, (skuCounts.get(descriptors[idx].sku) ?? 0) + 1);
        frontier.sort((a, b) => compareFrontierCandidates(descriptors[a], descriptors[b], activeCam.corner, builtBounds ?? modelBounds, skuCounts));
      }
      const anchor = frontier[0];
      const anchorY = descriptors[anchor].layerY;
      const stepIdx = selectDynamicStepIndices({
        anchor,
        parts: descriptors,
        getEligibleCandidates: (placedInStep) =>
          Array.from(remaining).filter((i) => {
            if (placedInStep.has(i)) return false;
            if (Math.abs(descriptors[i].layerY - anchorY) > 12) return false;
            return placedBeforeStep.size > 0
              ? adj[i].some((nb) => placedBeforeStep.has(nb))
              : adj[i].some((nb) => placedInStep.has(nb));
          }),
        modelBounds,
        builtBounds,
        activeCam,
        isFirstStep: stepHistory.length === 0,
        totalPartsInScope: boxes.length,
        isSubmodel: true,
      });
      if (placedBeforeStep.size > 0) {
        for (const pi of stepIdx) {
          expect(adj[pi].some((nb) => placedBeforeStep.has(nb))).toBe(true);
        }
      }
      stepHistory.push(stepIdx);
      for (const pi of stepIdx) {
        remaining.delete(pi);
        placed.add(pi);
        builtBounds = expandBoundsWithBox(builtBounds, boxes[pi]);
      }
    }

    const stepOf = (partIdx: number) => stepHistory.findIndex((s) => s.includes(partIdx));
    expect(stepOf(4)).toBeLessThan(stepOf(2));
    expect(stepOf(4)).toBeLessThan(stepOf(3));
    expect(stepOf(2)).toBe(stepOf(3));
  });

  it('collapses solid convex bricks (including studded 2x4 brick) cleanly for zero runtime overhead', () => {
    const brickCompiled = compileLines('solid_2x4', ldrawBoxQuads(-40, -24, -20, 40, 4, 20))!;
    expect(brickCompiled.subBoxes).toBeUndefined();

    // Standard LDraw 2x4 brick: box walls + top deck at y=0 + 8 studs + 3 stud4 tubes
    const studdedBrick = compileLines('ldraw_3001', [
      ...ldrawBoxQuads(-40, -24, -20, 40, 0, 20),
      '1 16 -30 0 -10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 -10 0 -10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 10 0 -10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 30 0 -10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 -30 0 10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 -10 0 10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 10 0 10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 30 0 10 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 -20 4 0 1 0 0 0 20 0 0 0 1 stud4.dat',
      '1 16 0 4 0 1 0 0 0 20 0 0 0 1 stud4.dat',
      '1 16 20 4 0 1 0 0 0 20 0 0 0 1 stud4.dat',
    ])!;
    expect(studdedBrick.subBoxes).toBeUndefined();

    // Direct call on empty/tiny mesh returns undefined cleanly
    expect(buildLocalSubBoxes(new Float32Array(0), [0, 0, 0], [20, 8, 20])).toBeUndefined();
    const extra: LocalBox6[] = [[-8, -24, -8, 8, 0, 8]];
    expect(buildLocalSubBoxes(brickCompiled.tris, brickCompiled.min, brickCompiled.max, extra)).toBeUndefined();
  });
});
