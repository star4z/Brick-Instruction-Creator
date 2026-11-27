import { describe, expect, it } from 'vitest';
import type { WorldBox } from '../minifigPose';
import { optimizeStudioStepCameraSequence } from '../stepCamera';
import {
  analyzeUndersideAssembly,
  buildInvertedVerticalPrereqMap,
  collectCapInnerAttachments,
  isLooseHoleBearing,
  isStrictDeckUndersidePart,
  isTechnicMechanismPart,
  type UndersidePartInput,
} from '../undersideAssembly';

function makeBox(
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): WorldBox {
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
  };
}

function makePart(
  index: number,
  partId: string,
  partName: string,
  box: WorldBox,
  opts: Partial<UndersidePartInput> = {},
): UndersidePartInput {
  return {
    index,
    partId,
    partName,
    role: opts.role ?? 'structural',
    shape: opts.shape,
    hasStuds: opts.hasStuds ?? true,
    box,
    isCladding: opts.isCladding ?? false,
  };
}

function link(adj: number[][], a: number, b: number): void {
  if (!adj[a].includes(b)) adj[a].push(b);
  if (!adj[b].includes(a)) adj[b].push(a);
}

describe('undersideAssembly — general deck-first & upside-down underside physics', () => {
  it('classifies thin round-hole tiles as loose hole bearings and Technic axles/beams/bushes as mechanisms', () => {
    const roundTile = makePart(0, '15535', 'Tile, Round 2 x 2 with Hole', makeBox(-20, 25, -20, 20, 33, 20), {
      shape: 'round_hole',
      hasStuds: false,
    });
    const normalPlate = makePart(1, '3032', 'Plate 4 x 6', makeBox(-40, 73, -60, 40, 81, 60));
    const techPlate = makePart(2, '32001', 'Technic Plate 2 x 6 with 5 Holes', makeBox(-60, 73, -20, 60, 81, 20), {
      shape: 'technic_plate',
      hasStuds: true,
    });
    const axle = makePart(3, '4519', 'Technic, Axle 3L', makeBox(-4, 25, -4, 4, 85, 4), {
      role: 'axle',
      hasStuds: false,
    });
    const liftarm = makePart(4, '2825', 'Technic, Liftarm, Modified Stud Connector Thin 1 x 4', makeBox(-8, 35, -8, 8, 43, 60), {
      hasStuds: false,
    });
    const bush = makePart(5, '3713', 'Technic Bush', makeBox(-8, 55, -8, 8, 71, 8), {
      hasStuds: false,
    });

    expect(isLooseHoleBearing(roundTile)).toBe(true);
    expect(isLooseHoleBearing(normalPlate)).toBe(false);
    expect(isTechnicMechanismPart(axle)).toBe(true);
    expect(isTechnicMechanismPart(liftarm)).toBe(true);
    expect(isTechnicMechanismPart(bush)).toBe(true);
    expect(isTechnicMechanismPart(techPlate)).toBe(false);
    expect(isTechnicMechanismPart(normalPlate)).toBe(false);
  });

  it('returns hasSuspendedUnderside=false for a normal building resting on a full-span ground baseplate', () => {
    const parts: UndersidePartInput[] = [];
    const adj: number[][] = [];
    const add = (p: Omit<UndersidePartInput, 'index'>) => {
      const idx = parts.length;
      parts.push({ ...p, index: idx });
      adj.push([]);
      return idx;
    };

    // Full-span ground baseplate at Y = 0..8 spanning Z = -200..+200
    const baseA = add({ partId: '3032', partName: 'Plate 4 x 6', role: 'structural', hasStuds: true, box: makeBox(-60, 0, -200, 60, 8, 0), isCladding: false });
    const baseB = add({ partId: '3032', partName: 'Plate 4 x 6', role: 'structural', hasStuds: true, box: makeBox(-60, 0, 0, 60, 8, 200), isCladding: false });
    link(adj, baseA, baseB);

    // 24 wall bricks stacked above the baseplate
    for (let k = 0; k < 24; k++) {
      const z0 = -180 + (k % 12) * 30;
      const y0 = 8 + Math.floor(k / 12) * 24;
      const idx = add({
        partId: '3004',
        partName: 'Brick 1 x 2',
        role: 'structural',
        hasStuds: true,
        box: makeBox(-50, y0, z0, -30, y0 + 24, z0 + 28),
        isCladding: false,
      });
      link(adj, idx, z0 < 0 ? baseA : baseB);
    }

    const plan = analyzeUndersideAssembly(parts, adj);
    expect(plan.hasSuspendedUnderside).toBe(false);
  });

  it('detects a Primary Structural Deck above isolated suspended underside pockets and extracts captured Technic axle mechanisms', () => {
    const parts: UndersidePartInput[] = [];
    const adj: number[][] = [];
    const add = (
      partId: string,
      partName: string,
      box: WorldBox,
      opts: Partial<UndersidePartInput> = {},
    ) => {
      const idx = parts.length;
      parts.push(makePart(idx, partId, partName, box, opts));
      adj.push([]);
      return idx;
    };

    // Primary Structural Deck at Y = 72..80 spanning Z = -300..+260 (560 LDU long)
    const deckIndices: number[] = [];
    const deck0 = add('32001', 'Technic Plate 2 x 6 with 5 Holes', makeBox(-60, 72, -300, 60, 80, -260), {
      shape: 'technic_plate',
    });
    deckIndices.push(deck0);
    for (let k = 0; k < 6; k++) {
      const z0 = -260 + k * 85;
      const d = add('3032', 'Plate 4 x 6', makeBox(-60, 72, z0, 60, 80, z0 + 86));
      link(adj, deckIndices[deckIndices.length - 1], d);
      deckIndices.push(d);
    }

    // Upper body walls above deck (Y = 80..152)
    for (let k = 0; k < 10; k++) {
      const z0 = -240 + k * 48;
      const w = add('3005', 'Brick 1 x 1', makeBox(-50, 80, z0, -30, 152, z0 + 20));
      link(adj, w, deckIndices[Math.min(deckIndices.length - 1, 1 + Math.floor(k / 2))]);
    }

    // Suspended Underside Pocket 1 (front hanging housing at Z = -300..-220, Y = 16..72)
    const upperBrickL = add('3665', 'Slope, Inverted 45 2 x 1', makeBox(-50, 48, -290, -30, 72, -250));
    const upperBrickR = add('3665', 'Slope, Inverted 45 2 x 1', makeBox(30, 48, -290, 50, 72, -250));
    const midBrick = add('2456', 'Brick 2 x 6', makeBox(-60, 24, -270, 60, 48, -230));
    const capPlate = add('32059', 'Wedge, Plate 4 x 6 Cut Corners', makeBox(-60, 16, -300, 60, 24, -230));
    const roundHoleTile = add('15535', 'Tile, Round 2 x 2 with Hole', makeBox(-20, 24, -300, 20, 32, -260), {
      shape: 'round_hole',
      hasStuds: false,
    });
    const innerTile = add('2431', 'Tile 1 x 4', makeBox(-40, 24, -260, 40, 32, -240), {
      hasStuds: false,
    });

    // Captured Technic axle mechanism penetrating deck0 down into roundHoleTile
    const vAxle = add('4519', 'Technic, Axle 3L', makeBox(-4, 25, -284, 4, 84, -276), {
      role: 'axle',
      hasStuds: false,
    });
    const beam = add('2825', 'Technic, Liftarm, Modified Stud Connector Thin 1 x 4', makeBox(-8, 36, -340, 8, 44, -272), {
      hasStuds: false,
    });
    const bush = add('3713', 'Technic Bush', makeBox(-8, 52, -288, 8, 68, -272), {
      hasStuds: false,
    });

    link(adj, deck0, upperBrickL);
    link(adj, deck0, upperBrickR);
    link(adj, upperBrickL, midBrick);
    link(adj, upperBrickR, midBrick);
    link(adj, midBrick, capPlate);
    link(adj, capPlate, roundHoleTile);
    link(adj, capPlate, innerTile);
    link(adj, deck0, vAxle);
    link(adj, roundHoleTile, vAxle);
    link(adj, vAxle, beam);
    link(adj, vAxle, bush);

    const plan = analyzeUndersideAssembly(parts, adj);
    expect(plan.hasSuspendedUnderside).toBe(true);
    expect(plan.deckMinY).toBe(72);
    expect(plan.deckPartIndices).toContain(deck0);

    // Pocket 1 contains the pre-built 3-part Technic mechanism (vAxle, beam, bush)
    expect(plan.pockets.length).toBe(1);
    expect(plan.mechanisms.length).toBe(1);
    expect(new Set(plan.mechanisms[0].partIndices)).toEqual(new Set([vAxle, beam, bush]));

    // Inverted-gravity prereqs: upperBrickL/R -> midBrick -> capPlate
    const placedAfterDeckAndMech = new Set([...plan.deckPartIndices, vAxle, beam, bush]);
    const boxes = parts.map((p) => p.box);
    const roles = parts.map((p) => p.role);
    const cladding = parts.map((p) => p.isCladding);
    const aboveMap = buildInvertedVerticalPrereqMap(
      boxes,
      adj,
      roles,
      cladding,
      plan.pockets[0].structuralIndices,
      placedAfterDeckAndMech,
    );
    expect(aboveMap[midBrick]).toContain(upperBrickL);
    expect(aboveMap[midBrick]).toContain(upperBrickR);
    expect(aboveMap[capPlate]).toContain(midBrick);
    expect(aboveMap[capPlate]).toContain(roundHoleTile);

    // Inner-face cap attachments co-attach with capPlate when upside down
    const pocketRem = new Set([capPlate, roundHoleTile, innerTile]);
    const extras = collectCapInnerAttachments([capPlate], pocketRem, boxes, adj, roles);
    expect(new Set(extras)).toEqual(new Set([roundHoleTile, innerTile]));
  });

  it('locks upside-down underside steps to side=bottom and emits flip_vertical cues on entry and exit', () => {
    const deckBox = makeBox(-60, 72, -100, 60, 80, 100);
    const mechBox = makeBox(-8, 25, -80, 8, 84, -40);
    const capBox = makeBox(-60, 16, -100, 60, 24, -20);
    const wallBox = makeBox(-50, 80, -80, -30, 104, 80);

    const choices = optimizeStudioStepCameraSequence([
      {
        stepBoxes: [deckBox],
        occludersBefore: [],
        builtBoundsBefore: null,
      },
      {
        stepBoxes: [mechBox],
        occludersBefore: [deckBox],
        builtBoundsBefore: deckBox,
        forceSide: 'bottom',
      },
      {
        stepBoxes: [capBox],
        occludersBefore: [deckBox, mechBox],
        builtBoundsBefore: makeBox(-60, 25, -100, 60, 84, 100),
        forceSide: 'bottom',
      },
      {
        stepBoxes: [wallBox],
        occludersBefore: [deckBox, mechBox, capBox],
        builtBoundsBefore: makeBox(-60, 16, -100, 60, 84, 100),
      },
    ]);

    expect(choices[0].side).toBe('top');
    expect(choices[1].side).toBe('bottom');
    expect(choices[1].cue).toBe('flip_vertical');
    expect(choices[2].side).toBe('bottom');
    expect(choices[2].cue).toBe('none');
    expect(choices[3].side).toBe('top');
    expect(choices[3].cue).toBe('flip_vertical');
  });

  it('promotes cohesive multi-part underside housings and wheel assemblies into pre-built sub-modules and detects strict deck-underside plates', () => {
    const parts: UndersidePartInput[] = [];
    const adj: number[][] = [];
    const add = (
      partId: string,
      partName: string,
      box: WorldBox,
      opts: Partial<UndersidePartInput> = {},
    ) => {
      const idx = parts.length;
      parts.push(makePart(idx, partId, partName, box, opts));
      adj.push([]);
      return idx;
    };

    // Wide Primary Structural Deck at Y = 72..80 spanning Z = -320..+320 (640 LDU)
    const deck: number[] = [];
    for (let k = 0; k < 8; k++) {
      const z0 = -320 + k * 80;
      const d = add('3032', 'Plate 4 x 6', makeBox(-60, 72, z0, 60, 80, z0 + 82));
      if (deck.length > 0) link(adj, deck[deck.length - 1], d);
      deck.push(d);
    }
    // Upper walls so total model height >= 40
    for (let k = 0; k < 8; k++) {
      const z0 = -280 + k * 70;
      const w = add('3005', 'Brick 1 x 1', makeBox(-50, 80, z0, -30, 140, z0 + 20));
      link(adj, w, deck[k]);
    }

    // Pocket 1: Cohesive 5-part gray front underside housing (multi-layer, height = 56 >= 14)
    const hTopL = add('3665', 'Slope Inverted', makeBox(-50, 48, -310, -30, 72, -260));
    const hTopR = add('3665', 'Slope Inverted', makeBox(30, 48, -310, 50, 72, -260));
    const hMid = add('3009', 'Brick 1 x 6', makeBox(-60, 24, -300, 60, 48, -260));
    const hCap = add('3032', 'Plate 4 x 6', makeBox(-60, 16, -310, 60, 24, -250));
    const hRetainer = add('15535', 'Tile, Round 2 x 2 with Hole', makeBox(-20, 24, -295, 20, 32, -265), {
      shape: 'round_hole',
      hasStuds: false,
    });
    link(adj, deck[0], hTopL);
    link(adj, deck[0], hTopR);
    link(adj, hTopL, hMid);
    link(adj, hTopR, hMid);
    link(adj, hMid, hCap);
    link(adj, hCap, hRetainer);

    // Pocket 2: Cohesive 5-part wheeled underside assembly under center deck
    const bogieFrame = add('2878', 'Train Wheel Holder', makeBox(-40, 40, -40, 40, 72, 40), {
      role: 'wheel_holder',
    });
    const w1 = add('55423', 'Train Wheel', makeBox(-50, 16, -30, -36, 48, -10), { role: 'wheel', hasStuds: false });
    const w2 = add('55423', 'Train Wheel', makeBox(36, 16, -30, 50, 48, -10), { role: 'wheel', hasStuds: false });
    const w3 = add('55423', 'Train Wheel', makeBox(-50, 16, 10, -36, 48, 30), { role: 'wheel', hasStuds: false });
    const w4 = add('55423', 'Train Wheel', makeBox(36, 16, 10, 50, 48, 30), { role: 'wheel', hasStuds: false });
    link(adj, deck[4], bogieFrame);
    link(adj, bogieFrame, w1);
    link(adj, bogieFrame, w2);
    link(adj, bogieFrame, w3);
    link(adj, bogieFrame, w4);

    const plan = analyzeUndersideAssembly(parts, adj);
    expect(plan.hasSuspendedUnderside).toBe(true);
    expect(plan.subassemblies.length).toBe(2);
    const names = plan.subassemblies.map((s) => s.name).sort();
    expect(names).toEqual(['Underside Module', 'Wheel Assembly']);

    // Every part of Pocket 1 (including the 15535 loose hole retainer!) and Pocket 2 is cleanly promoted
    const modSub = plan.subassemblies.find((s) => s.name === 'Underside Module')!;
    expect(new Set(modSub.partIndices)).toEqual(new Set([hTopL, hTopR, hMid, hCap, hRetainer]));
    const wheelSub = plan.subassemblies.find((s) => s.name === 'Wheel Assembly')!;
    expect(new Set(wheelSub.partIndices)).toEqual(new Set([bogieFrame, w1, w2, w3, w4]));

    // Strict deck-underside check: a plate tucked strictly under an already-placed spanning plate returns true,
    // while a plate sitting on top of the deck returns false.
    const boxes = parts.map((p) => p.box);
    const placedDeck = new Set(deck);
    expect(isStrictDeckUndersidePart(hTopL, boxes, adj, placedDeck)).toBe(true);
    expect(isStrictDeckUndersidePart(8, boxes, adj, placedDeck)).toBe(false);
  });

  it('captures the first brick layer directly beneath a deck whose Y sits off an 8-LDU grid multiple (with 4 LDU top studs)', () => {
    const parts: UndersidePartInput[] = [];
    const adj: number[][] = [];
    const add = (
      partId: string,
      partName: string,
      box: WorldBox,
      opts: Partial<UndersidePartInput> = {},
    ): number => {
      const index = parts.length;
      parts.push({
        index,
        partId,
        partName,
        role: opts.role ?? 'structural',
        box,
        isCladding: false,
        hasStuds: opts.hasStuds ?? true,
        shape: opts.shape,
      });
      adj.push([]);
      return index;
    };

    // Deck plates sitting at Y=[73.003..85.003] (1.003 LDU above the 72 quantized bucket!)
    const deck: number[] = [];
    for (let k = 0; k < 8; k++) {
      const z0 = -240 + k * 60;
      const d = add('3032', 'Plate 4x6', makeBox(-60, 73.003, z0, 60, 85.003, z0 + 60));
      deck.push(d);
      if (k > 0) link(adj, deck[k - 1], d);
    }
    // Upper walls above the deck so the deck sits in the lower 55% of model height and total parts >= 24
    for (let k = 0; k < 8; k++) {
      const z0 = -240 + k * 60;
      const wL = add('3001', 'Brick 2x4', makeBox(-60, 81.003, z0, -40, 157.003, z0 + 60));
      const wR = add('3001', 'Brick 2x4', makeBox(40, 81.003, z0, 60, 157.003, z0 + 60));
      link(adj, deck[k], wL);
      link(adj, deck[k], wR);
    }

    // Upper underside brick layer directly clutched to deck underside (Y=[49.003..77.003], maxY = 77.003 > 72 + 5.0!)
    const upperA = add('2357', 'Brick 2x2 Corner', makeBox(-40, 49.003, -240, 0, 77.003, -200));
    const upperB = add('2357', 'Brick 2x2 Corner', makeBox(0, 49.003, -240, 40, 77.003, -200));
    // Lower underside bricks & cap plate attached beneath upperA/upperB
    const midBrick = add('2456', 'Brick 2x6', makeBox(-60, 25.003, -240, 60, 53.003, -200));
    const capPlate = add('32059', 'Plate Modified 4x6', makeBox(-60, 17.003, -240, 60, 29.003, -180));
    link(adj, deck[0], upperA);
    link(adj, deck[0], upperB);
    link(adj, upperA, midBrick);
    link(adj, upperB, midBrick);
    link(adj, midBrick, capPlate);

    const plan = analyzeUndersideAssembly(parts, adj);
    expect(plan.hasSuspendedUnderside).toBe(true);
    // Both upper underside bricks MUST be included in the pocket & Underside Module (never missing!)
    expect(plan.allUndersideIndices.has(upperA)).toBe(true);
    expect(plan.allUndersideIndices.has(upperB)).toBe(true);
    expect(plan.subassemblies).toHaveLength(1);
    expect(new Set(plan.subassemblies[0].partIndices)).toEqual(
      new Set([upperA, upperB, midBrick, capPlate]),
    );
  });
});


