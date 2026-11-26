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
  createGroundedPrereqChecker,
  expandBoundsWithBox,
  isCandidateConnectedForStep,
  selectDynamicStepIndices,
  type DynamicPartDescriptor,
} from '../dynamicStepSizer';
import {
  boxesPhysicallyTouchBasic,
  buildLocalSubBoxes,
  buildPhysicalVerticalPrereqMap,
  canFlushSidewaysConnect,
  classifySidewaysCapability,
  createHorizontalFastenerGuards,
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
      '1 16 0 4 0 1 0 0 0 -5 0 0 0 1 stud4.dat',
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
      '1 16 -20 4 0 1 0 0 0 -5 0 0 0 1 stud4.dat',
      '1 16 0 4 0 1 0 0 0 -5 0 0 0 1 stud4.dat',
      '1 16 20 4 0 1 0 0 0 -5 0 0 0 1 stud4.dat',
    ])!;
    expect(studdedBrick.subBoxes).toBeUndefined();

    // Direct call on empty/tiny mesh returns undefined cleanly
    expect(buildLocalSubBoxes(new Float32Array(0), [0, 0, 0], [20, 8, 20])).toBeUndefined();
    const extra: LocalBox6[] = [[-8, -24, -8, 8, 0, 8]];
    expect(buildLocalSubBoxes(brickCompiled.tris, brickCompiled.min, brickCompiled.max, extra)).toBeUndefined();
  });

  it('rejects flush side-wall grazing for wheel holders (38339/2878), side-by-side SNOT brackets (44728), and edge-to-edge sideways plates while keeping real SNOT & articulated contacts', () => {
    const wh38339Cap = classifySidewaysCapability({
      partId: '38339',
      partName: 'Train Wheel Bogie With Pin Slots without Wheelset',
      role: 'wheel_holder',
      isSideways: false,
      hasCompiledMesh: true,
    });
    const wh2878Cap = classifySidewaysCapability({
      partId: '2878',
      partName: 'Train Wheel Bogie Single Axle without Wheelset',
      role: 'wheel_holder',
      isSideways: false,
      hasCompiledMesh: true,
    });
    const compiledBracketCap = classifySidewaysCapability({
      partId: '44728',
      partName: 'Bracket 1 x 2 - 2 x 2',
      shape: 'bracket',
      role: 'structural',
      isSideways: false,
      hasCompiledMesh: true,
    });
    const synthBracketCap = classifySidewaysCapability({
      partId: '44728',
      partName: 'Bracket 1 x 2 - 2 x 2',
      shape: 'bracket',
      role: 'structural',
      isSideways: false,
      hasCompiledMesh: false,
    });
    const synthSnotCap = classifySidewaysCapability({
      partId: '4733',
      partName: 'SNOT Brick 1×1 (4 Sides)',
      shape: 'snot4',
      role: 'structural',
      isSideways: false,
      hasCompiledMesh: false,
    });
    const sidewaysPlateCap = classifySidewaysCapability({
      partId: '3710',
      partName: 'Plate 1 x 4',
      role: 'structural',
      isSideways: true,
      hasCompiledMesh: true,
    });
    const clipCap = classifySidewaysCapability({
      partId: '4085',
      partName: 'Plate 1 x 1 with Clip Vertical',
      shape: 'clip_v',
      role: 'structural',
      isSideways: false,
      hasCompiledMesh: true,
    });
    const barCap = classifySidewaysCapability({
      partId: '30374',
      partName: 'Bar 4L',
      shape: 'bar',
      role: 'detail',
      isSideways: true,
      hasCompiledMesh: true,
    });
    const couplerCap = classifySidewaysCapability({
      partId: '29085',
      partName: 'Train Buffer Beam with Closed Buffer Bottom for Sealed Magnet',
      role: 'structural',
      isSideways: false,
      hasCompiledMesh: true,
    });

    expect(wh38339Cap).toBe('none');
    expect(wh2878Cap).toBe('none');
    expect(compiledBracketCap).toBe('none');
    expect(synthBracketCap).toBe('snot_host_synth');
    expect(synthSnotCap).toBe('snot_host_synth');
    expect(sidewaysPlateCap).toBe('sideways_plate');
    expect(clipCap).toBe('articulated');
    expect(barCap).toBe('articulated');
    expect(couplerCap).toBe('articulated');

    // Flush (non-interlocking) pairs that MUST NOT connect:
    expect(canFlushSidewaysConnect(wh38339Cap, compiledBracketCap)).toBe(false);
    expect(canFlushSidewaysConnect(wh38339Cap, synthBracketCap)).toBe(false);
    expect(canFlushSidewaysConnect(compiledBracketCap, compiledBracketCap)).toBe(false);
    expect(canFlushSidewaysConnect(synthBracketCap, synthBracketCap)).toBe(false);
    expect(canFlushSidewaysConnect(sidewaysPlateCap, sidewaysPlateCap)).toBe(false);

    // Legitimate flush pairs that MUST connect:
    expect(canFlushSidewaysConnect(clipCap, barCap)).toBe(true);
    expect(canFlushSidewaysConnect(couplerCap, couplerCap)).toBe(true);
    expect(canFlushSidewaysConnect(synthSnotCap, sidewaysPlateCap)).toBe(true);
    expect(canFlushSidewaysConnect(synthBracketCap, sidewaysPlateCap)).toBe(true);
  });

  it('never places side-by-side SNOT brackets hanging in Step 1 next to a Train Wheel Bogie (38339) before the spanning top plate', () => {
    // Reproduces MUNI Metro LRV4 Front Half Step 1:
    // - WH1 (38339, x in [-80, 0]): wide housing [-80..-40, 8..36, -60..60], lowered center deck [-40..0, 8..28, -20..20]
    // - WH2 (38339, x in [80, 160]): mirrored at other end
    // - B_center (Brick 2x8, x in [-40, 120], y in [-16, 12], z in [-20, 20]): bridges WH1 & WH2 from underneath
    // - Br1 (44728, x in [-40, 0], z in [-64, -40]): L-bracket sitting flush next to WH1's wide housing (x=-40), outward studs at z=-64..-60
    // - Br2 (44728, x in [0, 40], z in [-64, -40]): second L-bracket sitting flush next to Br1 (x=0), outward studs at z=-64..-60
    // - P_side (sideways Plate 1x4, x in [-40, 40], y in [8, 28], z in [-68, -60]): snaps onto Br1 & Br2 outward 4 LDU SNOT studs!
    // - P_top (spanning Plate 6x8, x in [-60, 100], y in [32, 40], z in [-60, 60]): locks WH1, WH2, Br1, Br2 from above!
    const whCompiled = compileLines('wh_38339', [
      ...ldrawBoxQuads(-80, 8, -60, -40, 36, 60),
      ...ldrawBoxQuads(-40, 8, -20, 0, 28, 20),
    ])!;
    // L-shaped Bracket 1x2 - 2x2 (44728) with real 4 LDU outward studs on -Z face (z in [-64, -60])
    const brCompiled = compileLines('br_44728', [
      ...ldrawBoxQuads(-20, 28, -60, 20, 36, -40), // horizontal 1x2 top flange + top studs
      ...ldrawBoxQuads(-20, 8, -64, 20, 32, -56),  // vertical 2x2 wall + 4 LDU outward studs
    ])!;

    const names = ['WH1', 'WH2', 'B_center', 'Br1', 'Br2', 'P_side', 'P_top'];
    const roles = ['wheel_holder', 'wheel_holder', 'structural', 'structural', 'structural', 'structural', 'structural'];
    const partIds = ['38339', '38339', '3007', '44728', '44728', '3710', '3032'];
    const partNames = [
      'Train Wheel Bogie With Pin Slots without Wheelset',
      'Train Wheel Bogie With Pin Slots without Wheelset',
      'Brick 2 x 8',
      'Bracket 1 x 2 - 2 x 2',
      'Bracket 1 x 2 - 2 x 2',
      'Plate 1 x 4',
      'Plate 6 x 8',
    ];
    const isSideways = [false, false, false, false, false, true, false];
    const boxes: WorldBox[] = [
      makeWorldBox(-80, 8, -60, 0, 36, 60),    // 0: WH1
      makeWorldBox(80, 8, -60, 160, 36, 60),   // 1: WH2
      makeWorldBox(-40, -16, -20, 120, 12, 20),// 2: B_center
      makeWorldBox(-40, 8, -64, 0, 36, -40),   // 3: Br1 (flush with WH1 at x=-40)
      makeWorldBox(0, 8, -64, 40, 36, -40),    // 4: Br2 (flush with Br1 at x=0)
      makeWorldBox(-40, 8, -68, 40, 28, -60),  // 5: P_side (interlocks 4 LDU with Br1 & Br2 studs)
      makeWorldBox(-60, 32, -60, 100, 40, 60), // 6: P_top (spans WH1, WH2, Br1, Br2)
    ];
    const subBoxes: (WorldBox[] | null)[] = [
      whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 0, 0, 0)),
      whCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_180_Y, 80, 0, 0)),
      null,
      brCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, -20, 0, 0)),
      brCompiled.subBoxes!.map((sb) => transformLocalBox6ToWorld(sb, R_ID, 20, 0, 0)),
      null,
      null,
    ];
    const sideCaps = partIds.map((pid, i) =>
      classifySidewaysCapability({
        partId: pid,
        partName: partNames[i],
        role: roles[i],
        isSideways: isSideways[i],
        hasCompiledMesh: true,
      }),
    );

    const adj: number[][] = boxes.map(() => []);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (partsPhysicallyTouch(boxes[i], boxes[j], subBoxes[i], subBoxes[j], roles[i], roles[j], sideCaps[i], sideCaps[j])) {
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }

    // Br1 MUST NOT touch WH1 (flush smooth wall) or Br2 (flush side-by-side)!
    expect(adj[3]).not.toContain(0);
    expect(adj[3]).not.toContain(4);
    // Br1 & Br2 MUST connect to P_side (real 4 LDU SNOT stud interlocking) AND P_top (vertical stacking)!
    expect(adj[3]).toContain(5);
    expect(adj[3]).toContain(6);
    expect(adj[4]).toContain(5);
    expect(adj[4]).toContain(6);

    const { belowMap } = buildPhysicalVerticalPrereqMap(boxes, adj, roles, roles.map(() => false), undefined, subBoxes);
    const descriptors: DynamicPartDescriptor[] = boxes.map((box, index) => ({
      index,
      partId: partIds[index],
      colorId: 0,
      sku: `${partIds[index]}|0`,
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
      const isPrereqGrounded = placedBeforeStep.size > 0
        ? createGroundedPrereqChecker(adj, belowMap, placedBeforeStep, remaining)
        : null;
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
        const unblocked = rawFrontier.filter((i) => !belowMap[i].some((u) => remaining.has(u) && isPrereqGrounded!(u)));
        frontier = unblocked.length > 0 ? unblocked : rawFrontier;
        const skuCounts = new Map<string, number>();
        for (const idx of frontier) skuCounts.set(descriptors[idx].sku, (skuCounts.get(descriptors[idx].sku) ?? 0) + 1);
        frontier.sort((a, b) => compareFrontierCandidates(descriptors[a], descriptors[b], activeCam.corner, builtBounds ?? modelBounds, skuCounts));
      }

      const anchor = frontier[0];
      const anchorY = descriptors[anchor].layerY;
      const anchorConnectedToPrev = placedBeforeStep.size > 0 && adj[anchor].some((nb) => placedBeforeStep.has(nb));
      const stepIdx = selectDynamicStepIndices({
        anchor,
        parts: descriptors,
        getEligibleCandidates: (placedInStep) =>
          Array.from(remaining).filter((i) => {
            if (placedInStep.has(i)) return false;
            if (Math.abs(descriptors[i].layerY - anchorY) > 12) return false;
            if (placedBeforeStep.size > 0) {
              if (belowMap[i].some((u) => !placedBeforeStep.has(u) && isPrereqGrounded!(u))) return false;
            } else {
              if (belowMap[i].length > 0) return false;
            }
            return isCandidateConnectedForStep(i, anchorConnectedToPrev, adj, placedBeforeStep, placedInStep);
          }),
        modelBounds,
        builtBounds,
        activeCam,
        isFirstStep: stepHistory.length === 0,
        totalPartsInScope: boxes.length,
        isSubmodel: false,
      });

      if (placedBeforeStep.size > 0) {
        for (const pi of stepIdx) {
          expect(adj[pi].some((nb) => placedBeforeStep.has(nb)), `${names[pi]} floated in step ${stepHistory.length + 1}`).toBe(true);
        }
      }
      stepHistory.push(stepIdx);
      for (const pi of stepIdx) {
        remaining.delete(pi);
        placed.add(pi);
        builtBounds = expandBoundsWithBox(builtBounds, boxes[pi]);
      }
    }

    const stepOf = (idx: number) => stepHistory.findIndex((s) => s.includes(idx));
    // Step 1 must NOT contain either hanging SNOT bracket (Br1=3, Br2=4)!
    expect(stepHistory[0]).not.toContain(3);
    expect(stepHistory[0]).not.toContain(4);
    // Spanning top plate (P_top=6) MUST be placed strictly BEFORE Br1, Br2, and P_side!
    expect(stepOf(6)).toBeLessThan(stepOf(3));
    expect(stepOf(6)).toBeLessThan(stepOf(4));
    expect(stepOf(3)).toBeLessThan(stepOf(5));
    expect(stepOf(4)).toBeLessThan(stepOf(5));
  });

  it('rejects false floor-plate grazing for horizontal Technic pins while keeping genuine 3-axis hole interlocking', () => {
    // Deck plate with studs rising to y = 4
    const deckPlate = makeWorldBox(-40, -8, -40, 40, 4, 40);
    // Two 1x1 Technic bricks (6541) sitting on the deck at y = [0..28] along Z
    const technicA = makeWorldBox(-10, 0, -20, 10, 28, 0);
    const technicB = makeWorldBox(-10, 0, 0, 10, 28, 20);
    // Horizontal Technic pin (2780) centered at hole height y = 14, collar radius 8 -> y in [6..22]
    // Notice the 2.0 LDU air gap above deckPlate studs (6 - 4 = 2.0 <= 2.8)!
    const pin2780 = makeWorldBox(-8, 6, -20, 8, 22, 20);

    expect(partsPhysicallyTouch(pin2780, deckPlate, null, null, 'pin', 'structural', 'articulated', 'none')).toBe(false);
    expect(partsPhysicallyTouch(pin2780, technicA, null, null, 'pin', 'structural', 'articulated', 'none')).toBe(true);
    expect(partsPhysicallyTouch(pin2780, technicB, null, null, 'pin', 'structural', 'articulated', 'none')).toBe(true);
  });

  it('orders both vertically-seated Technic bricks BEFORE their joining horizontal pin and keeps one axial entrance open until the pin slides in', () => {
    // Exact sandwich: [backCap 1x2] | [technicA 6541] ==(pin2780)== [technicB 6541] | [frontCap 1x2]
    // all sitting atop a deck plate.
    const boxes: WorldBox[] = [
      makeWorldBox(-40, -8, -50, 40, 4, 50),  // 0: deckPlate (y <= 4)
      makeWorldBox(-10, 0, -20, 10, 28, 0),   // 1: technicA (LBG 6541)
      makeWorldBox(-10, 0, 0, 10, 28, 20),    // 2: technicB (Black 6541)
      makeWorldBox(-8, 6, -20, 8, 22, 20),    // 3: pin2780 (horizontal along Z)
      makeWorldBox(-20, 0, -40, 20, 28, -20), // 4: backCap (LBG 1x2 blocking -Z end)
      makeWorldBox(-20, 0, 20, 20, 28, 40),   // 5: frontCap (Black 1x2 blocking +Z end)
    ];
    const roles = ['structural', 'structural', 'structural', 'pin', 'structural', 'structural'];
    const sideCaps: Array<'none' | 'articulated'> = ['none', 'none', 'none', 'articulated', 'none', 'none'];
    const cladding = boxes.map(() => false);
    const partIds = ['3034', '6541', '6541', '2780', '3004', '3004'];
    const colors = [72, 71, 0, 0, 71, 0];

    const adj: number[][] = boxes.map(() => []);
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        if (partsPhysicallyTouch(boxes[i], boxes[j], null, null, roles[i], roles[j], sideCaps[i], sideCaps[j])) {
          adj[i].push(j);
          adj[j].push(i);
        }
      }
    }

    // Pin (3) connects ONLY to technicA (1) and technicB (2) — never to deckPlate (0) or end caps (4, 5)
    expect([...adj[3]].sort((a, b) => a - b)).toEqual([1, 2]);

    const { belowMap } = buildPhysicalVerticalPrereqMap(boxes, adj, roles, cladding);
    const fastenerGuards = createHorizontalFastenerGuards(boxes, adj, roles, belowMap);
    const descriptors: DynamicPartDescriptor[] = boxes.map((box, i) => ({
      index: i,
      partId: partIds[i],
      colorId: colors[i],
      sku: `${partIds[i]}|${colors[i]}`,
      role: roles[i],
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
      const isPrereqGrounded = placedBeforeStep.size > 0
        ? createGroundedPrereqChecker(adj, belowMap, placedBeforeStep, remaining)
        : null;
      let frontier: number[];
      if (placed.size === 0) {
        frontier = Array.from(remaining)
          .filter((i) => roles[i] !== 'pin' && belowMap[i].length === 0)
          .sort((a, b) => boxes[a].min[1] - boxes[b].min[1]);
      } else {
        const rawFrontier = Array.from(remaining).filter((i) => adj[i].some((nb) => placedBeforeStep.has(nb)));
        const emptyStepSet = new Set<number>();
        const baseUnblocked = rawFrontier.filter((i) => !belowMap[i].some((u) => remaining.has(u) && isPrereqGrounded!(u)));
        const fastenerUnblocked = baseUnblocked.filter((i) => !fastenerGuards.isBlocked(i, placedBeforeStep, emptyStepSet, remaining));
        frontier = fastenerUnblocked.length > 0 ? fastenerUnblocked : (baseUnblocked.length > 0 ? baseUnblocked : rawFrontier);
        const refBounds = builtBounds ?? modelBounds;
        frontier.sort((a, b) => compareFrontierCandidates(descriptors[a], descriptors[b], activeCam.corner, refBounds));
      }

      const anchor = frontier[0];
      const anchorY = boxes[anchor].min[1];
      const anchorConnectedToPrev = placedBeforeStep.size > 0 && adj[anchor].some((nb) => placedBeforeStep.has(nb));
      const stepIdx = selectDynamicStepIndices({
        anchor,
        parts: descriptors,
        getEligibleCandidates: (placedInStep) =>
          Array.from(remaining).filter((i) => {
            if (placedInStep.has(i)) return false;
            if (Math.abs(boxes[i].min[1] - anchorY) > 12) return false;
            if (fastenerGuards.isBlocked(i, placedBeforeStep, placedInStep, remaining)) return false;
            if (placedBeforeStep.size > 0) {
              if (belowMap[i].some((u) => !placedBeforeStep.has(u) && isPrereqGrounded!(u))) return false;
            } else {
              if (belowMap[i].length > 0) return false;
            }
            return isCandidateConnectedForStep(i, anchorConnectedToPrev, adj, placedBeforeStep, placedInStep);
          }),
        modelBounds,
        builtBounds,
        activeCam,
        isFirstStep: stepHistory.length === 0,
        totalPartsInScope: boxes.length,
        isSubmodel: false,
      });

      stepHistory.push(stepIdx);
      for (const pi of stepIdx) {
        remaining.delete(pi);
        placed.add(pi);
        builtBounds = expandBoundsWithBox(builtBounds, boxes[pi]);
      }
    }

    const stepOf = (idx: number) => stepHistory.findIndex((s) => s.includes(idx));
    // Pin (3) MUST be placed strictly AFTER BOTH technicA (1) AND technicB (2) —
    // never in the same step as its host brick, and never forcing technicB to drop through a protruding pin!
    expect(stepOf(1)).toBeLessThan(stepOf(3));
    expect(stepOf(2)).toBeLessThan(stepOf(3));
    // At least one axial end cap (backCap=4 or frontCap=5) MUST be placed strictly AFTER pin (3)
    // so the pin always has an open hole entrance to slide into!
    expect(Math.max(stepOf(4), stepOf(5))).toBeGreaterThan(stepOf(3));
  });

  it('rejects structural stud-clutch contact on smooth studless tile tops while allowing minifigures, studded undersides, and through-axles', () => {
    const floorPlate = makeWorldBox(-40, 0, -40, 40, 12, 40);
    const smoothTile = makeWorldBox(-20, 8, -20, 20, 16, 20);
    const brickAboveTile = makeWorldBox(-20, 16, -20, 20, 40, 20);
    const minifigOnTile = makeWorldBox(-15, 16, -10, 15, 44, 10);
    const vertAxleThroughTile = makeWorldBox(-4, 0, -4, 4, 48, 4);

    // Floor plate (studded) -> smoothTile: valid clutch on the tile's underside
    expect(
      boxesPhysicallyTouchBasic(floorPlate, smoothTile, 'structural', 'structural', 'none', 'none', false, true),
    ).toBe(true);

    // smoothTile (smooth top, zero studs) -> brickAboveTile: NOT a structural clutch connection
    expect(
      boxesPhysicallyTouchBasic(smoothTile, brickAboveTile, 'structural', 'structural', 'none', 'none', true, false),
    ).toBe(false);

    // smoothTile -> minifigure standing loosely on top: allowed
    expect(
      boxesPhysicallyTouchBasic(smoothTile, minifigOnTile, 'structural', 'figure', 'none', 'none', true, false),
    ).toBe(true);

    // smoothTile (round tile with hole) <-> vertical axle passing through it (3-axis interlocking): allowed
    expect(
      boxesPhysicallyTouchBasic(smoothTile, vertAxleThroughTile, 'structural', 'axle', 'none', 'articulated', true, false),
    ).toBe(true);

    // In buildPhysicalVerticalPrereqMap: a floor-supported tile still sits in roof's belowMap (never trapped),
    // while a brick whose ONLY lower neighbor is a smooth tile does NOT treat the tile as lower stud support.
    const boxes: WorldBox[] = [
      floorPlate,                                // 0: studded floor
      smoothTile,                                // 1: smooth tile on floor
      makeWorldBox(-20, 16, -20, 20, 32, 20),    // 2: loose brick resting only on smooth tile
      makeWorldBox(-40, 32, -40, 40, 44, 40),    // 3: spanning roof above tile & brick
    ];
    const adj: number[][] = [
      [1],    // 0: floor -> tile
      [0, 2], // 1: tile -> floor, (fallback edge to brick)
      [1, 3], // 2: brick -> tile, roof
      [2],    // 3: roof -> brick
    ];
    const roles = ['structural', 'structural', 'structural', 'structural'];
    const cladding = [false, false, false, false];
    const smoothTopFlags = [false, true, false, false];
    const { belowMap } = buildPhysicalVerticalPrereqMap(boxes, adj, roles, cladding, undefined, null, smoothTopFlags);

    // Tile (1) is supported by studded floor (0) so it blocks Roof (3)
    expect(belowMap[3]).toContain(1);
    // Brick (2) only has smooth tile (1) below it, so smooth tile does NOT count as structural lower support
    expect(belowMap[3]).not.toContain(2);
  });
});

