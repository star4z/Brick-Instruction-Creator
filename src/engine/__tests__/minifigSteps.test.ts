import { describe, expect, it } from 'vitest';
import { R_IDENTITY, type RuntimePart, type WorldBox } from '../minifigPose';
import {
  buildMinifigExplodedPlan,
  buildMinifigSequentialPlan,
  decomposeMinifigParts,
  normalizeMinifigStepStyle,
  paginateMinifigSequentialStages,
} from '../minifigSteps';

const PART_NAMES: Record<string, string> = {
  '3815c01': 'Minifigure Hips & Legs',
  '3815': 'Minifigure Hips',
  '3816': 'Minifigure Leg (Right)',
  '3817': 'Minifigure Leg (Left)',
  '973c01': 'Minifigure Torso Assembly',
  '973': 'Minifigure Torso',
  '3818': 'Minifigure Arm (Right)',
  '3819': 'Minifigure Arm (Left)',
  '3820': 'Minifigure Hand',
  '3626c': 'Minifigure Head',
  '3901': 'Minifigure Hair',
  '30367': 'Minifigure Helmet Darth Vader',
  '522': 'Minifigure Cape Cloth',
  '2587': 'Minifigure Armor Collar',
  '64567': 'Lightsaber Hilt',
  '30374': 'Lightsaber Blade Bar 4L',
  '3069b': 'Tile 1x2 Letter Envelope',
  '98138': 'Tile Round 1x1 Cookie',
};

const PART_HALF_EXTENTS: Record<string, [number, number, number]> = {
  '3815c01': [16, 20, 8],
  '3815': [16, 6, 8],
  '3816': [7, 15, 7],
  '3817': [7, 15, 7],
  '973c01': [22, 18, 9],
  '973': [15, 16, 8],
  '3818': [6, 12, 8],
  '3819': [6, 12, 8],
  '3820': [4, 4, 5],
  '3626c': [11, 12, 11],
  '3901': [13, 10, 13],
  '30367': [15, 14, 15],
  '522': [16, 24, 3],
  '2587': [16, 6, 12],
  '64567': [4, 10, 4],
  '30374': [3, 30, 3],
  '3069b': [8, 2, 10],
  '98138': [6, 2, 6],
};

function resolveName(partId: string): string {
  return PART_NAMES[partId] || partId;
}

function computeBox(part: RuntimePart): WorldBox {
  const [hx, hy, hz] = PART_HALF_EXTENTS[part.p] || [8, 8, 8];
  return {
    min: [part.x - hx, part.y - hy, part.z - hz],
    max: [part.x + hx, part.y + hy, part.z + hz],
    center: [part.x, part.y, part.z],
  };
}

function makePart(id: string, p: string, x: number, y: number, z: number, c = 14): RuntimePart {
  return { id, p, c, x, y, z, m: [...R_IDENTITY] };
}

describe('Official LEGO Minifigure Step Styles (Exploded IMG_0316 & Sequential IMG_0315)', () => {
  it('normalizes style preferences safely with exploded as default', () => {
    expect(normalizeMinifigStepStyle('exploded')).toBe('exploded');
    expect(normalizeMinifigStepStyle('sequential')).toBe('sequential');
    expect(normalizeMinifigStepStyle('classic')).toBe('classic');
    expect(normalizeMinifigStepStyle(undefined)).toBe('exploded');
    expect(normalizeMinifigStepStyle('unknown')).toBe('exploded');
  });

  it('builds IMG_0316 Exploded Stack Callout with double hip red arrows and handheld accessory callout', () => {
    const grandmaParts: RuntimePart[] = [
      makePart('legs', '3815c01', 0, 20, 0, 19),
      makePart('torso', '973c01', 0, 58, 0, 2),
      makePart('head', '3626c', 0, 88, 0, 14),
      makePart('hair', '3901', 0, 108, 0, 71),
      makePart('envelope', '3069b', -22, 48, 12, 15),
    ];

    const plan = buildMinifigExplodedPlan(grandmaParts, resolveName, computeBox);

    // Body stack has 4 strictly separated vertical layers: legs -> torso -> head -> headgear
    expect(plan.stackLayers.map((l) => l.role)).toEqual(['legs', 'torso', 'head', 'headgear']);
    expect(plan.stackParts.map((p) => p.id)).toEqual(['legs', 'torso', 'head', 'hair']);

    // Verify strict vertical air gap between every consecutive exploded layer (zero overlap!)
    for (let i = 1; i < plan.stackLayers.length; i++) {
      const prev = plan.stackLayers[i - 1];
      const cur = plan.stackLayers[i];
      const prevTop = prev.box.max[1] + prev.offsetY;
      const curBot = cur.box.min[1] + cur.offsetY;
      expect(curBot - prevTop).toBeGreaterThanOrEqual(20);
    }

    // Arrows: 2 parallel red downward hip arrows + 1 head->torso + 1 hair->head = 4 arrows
    expect(plan.stackArrows).toHaveLength(4);
    expect(plan.stackArrows.every((a) => a.color === 'red')).toBe(true);
    expect(plan.stackArrows.filter((a) => a.kind === 'double_hip')).toHaveLength(2);
    const hipArrows = plan.stackArrows.filter((a) => a.kind === 'double_hip');
    expect(hipArrows[0].from[0]).toBeLessThan(0);
    expect(hipArrows[1].from[0]).toBeGreaterThan(0);
    expect(hipArrows[0].from[1]).toBeGreaterThan(hipArrows[0].to[1]);

    // Handheld envelope becomes a separate accessory callout (NOT stacked on the head!)
    expect(plan.accessoryCallouts).toHaveLength(1);
    expect(plan.accessoryCallouts[0].parts.map((p) => p.id)).toEqual(['envelope']);
    expect(plan.accessoryCallouts[0].isMultiPart).toBe(false);
    expect(plan.accessoryCallouts[0].side).toBe('right');
  });

  it('builds exact 6-step IMG_0315 Sequential Minifig Assembly for Vader (cape, collar+head, helmet, 2-part lightsaber pill, cookie celebration)', () => {
    const vaderParts: RuntimePart[] = [
      makePart('legs', '3815c01', 0, 20, 0, 70),
      makePart('torso', '973c01', 0, 58, 0, 70),
      makePart('cape', '522', 0, 52, -10, 15),
      makePart('collar', '2587', 0, 76, 0, 70),
      makePart('head', '3626c', 0, 88, 0, 70),
      makePart('helmet', '30367', 0, 108, 0, 70),
      makePart('saber_hilt', '64567', -22, 54, 12, 71),
      makePart('saber_blade', '30374', -22, 96, 12, 36),
      makePart('cookie', '98138', 22, 48, 12, 19),
    ];

    const plan = buildMinifigSequentialPlan(vaderParts, resolveName, computeBox);

    expect(plan.stages).toHaveLength(6);
    expect(plan.stages.map((s) => s.stepNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(plan.stages.map((s) => s.kind)).toEqual([
      'legs_torso',
      'cape',
      'neckwear_head',
      'headgear',
      'accessory_subassembly',
      'celebration',
    ]);

    // Step 1: Legs + floating Torso with 2 parallel blue arrows
    expect(plan.stages[0].arrows).toHaveLength(2);
    expect(plan.stages[0].arrows.every((a) => a.color === 'blue' && a.kind === 'double_hip')).toBe(true);
    expect(plan.stages[0].partOffsets['torso'].y).toBeGreaterThan(20);

    // Step 2: Cape floats cleanly above torso with blue downward arrow
    expect(plan.stages[1].addedParts.map((p) => p.id)).toEqual(['cape']);
    expect(plan.stages[1].arrows).toHaveLength(1);
    expect(plan.stages[1].arrows[0].color).toBe('blue');

    // Step 3: Collar + Head stacked above torso with blue arrows (IMG_0315 Step 3)
    expect(plan.stages[2].addedParts.map((p) => p.id)).toEqual(['collar', 'head']);
    expect(plan.stages[2].partOffsets['head'].y).toBeGreaterThan(plan.stages[2].partOffsets['collar'].y);
    expect(plan.stages[2].arrows).toHaveLength(2);

    // Step 4: Helmet floats above head
    expect(plan.stages[3].addedParts.map((p) => p.id)).toEqual(['helmet']);
    expect(plan.stages[3].arrows).toHaveLength(1);

    // Step 5: Lightsaber clustered into a 2-part warm peach subassembly pill with internal blue arrow
    expect(plan.hasTallAccessoryPill).toBe(true);
    expect(plan.stages[4].accessoryPill).not.toBeNull();
    expect(plan.stages[4].accessoryPill!.isMultiPart).toBe(true);
    expect(plan.stages[4].accessoryPill!.parts.map((p) => p.id)).toEqual(['saber_hilt', 'saber_blade']);
    expect(plan.stages[4].accessoryPill!.subassemblyArrows).toHaveLength(1);
    expect(plan.stages[4].accessoryPill!.subassemblyArrows[0].color).toBe('blue');

    // Step 6: Celebration stage includes final single-part cookie + starburst flag
    expect(plan.stages[5].isCelebration).toBe(true);
    expect(plan.stages[5].addedParts.map((p) => p.id)).toEqual(['cookie']);
    expect(plan.stages[5].baseParts.length + plan.stages[5].addedParts.length).toBe(vaderParts.length);

    // Shared camera baseline & scale are finite and tall enough for exploded & pill views
    expect(plan.sharedHalfH).toBeGreaterThan(80);
    expect(plan.sharedCenter[1]).toBeGreaterThan(50);
  });

  it('keeps un-fused flat .ldr limbs glued to their canonical legs and torso units', () => {
    const flatLdrParts: RuntimePart[] = [
      makePart('hips', '3815', 0, 34, 0, 1),
      makePart('leg_r', '3816', -8, 15, 0, 1),
      makePart('leg_l', '3817', 8, 15, 0, 1),
      makePart('torso', '973', 0, 56, 0, 4),
      makePart('arm_r', '3818', -16, 56, 0, 4),
      makePart('arm_l', '3819', 16, 56, 0, 4),
      makePart('hand_r', '3820', -19, 44, 6, 14),
      makePart('hand_l', '3820', 19, 44, 6, 14),
      makePart('head', '3626c', 0, 86, 0, 14),
      makePart('hair', '3901', 0, 106, 0, 0),
    ];

    const dec = decomposeMinifigParts(flatLdrParts, resolveName, computeBox);
    expect(dec.legs.map((p) => p.id)).toEqual(['hips', 'leg_r', 'leg_l']);
    expect(dec.torso.map((p) => p.id)).toEqual(['torso', 'arm_r', 'arm_l', 'hand_r', 'hand_l']);
    expect(dec.head.map((p) => p.id)).toEqual(['head']);
    expect(dec.headgear.map((p) => p.id)).toEqual(['hair']);
    expect(dec.accessories).toHaveLength(0);

    // In exploded mode, all torso/arm/hand parts share the EXACT same vertical offset
    const exp = buildMinifigExplodedPlan(flatLdrParts, resolveName, computeBox);
    const torsoDy = exp.stackOffsets['torso'].y;
    expect(exp.stackOffsets['arm_r'].y).toBe(torsoDy);
    expect(exp.stackOffsets['arm_l'].y).toBe(torsoDy);
    expect(exp.stackOffsets['hand_r'].y).toBe(torsoDy);
    expect(exp.stackOffsets['hand_l'].y).toBe(torsoDy);
  });

  it('aims single stacking arrows at the neck stud even when a raised arm skews the torso box', () => {
    // Composite torso: bare torso centered at x=0 with the right arm/hand raised far to viewer-left
    const torso: RuntimePart = {
      ...makePart('torso', '973c01', -8, 58, 4, 85),
      children: [
        makePart('torso_core', '973', 0, 58, 0, 85),
        makePart('arm_r', '3818', -22, 64, 8, 85),
        makePart('hand_r', '3820', -30, 66, 18, 14),
        makePart('arm_l', '3819', 16, 56, 0, 85),
        makePart('hand_l', '3820', 19, 44, 6, 14),
      ],
    };
    const parts: RuntimePart[] = [
      makePart('legs', '3815c01', 0, 20, 0, 272),
      torso,
      makePart('scarf', '2587', 0, 76, 0, 28),
      makePart('head', '3626c', 0, 88, 0, 14),
      makePart('hair', '3901', 0, 108, 0, 29),
    ];
    // Torso box (incl. arm/hand children) is skewed left; computeBox in this test only uses
    // the composite's own extents, so emulate a merged box via children for realism.
    const boxWithChildren = (p: RuntimePart): WorldBox => {
      if (!p.children || p.children.length === 0) return computeBox(p);
      const bs = p.children.map(computeBox);
      const min: [number, number, number] = [0, 1, 2].map((k) => Math.min(...bs.map((b) => b.min[k]))) as [number, number, number];
      const max: [number, number, number] = [0, 1, 2].map((k) => Math.max(...bs.map((b) => b.max[k]))) as [number, number, number];
      return { min, max, center: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] };
    };

    const plan = buildMinifigExplodedPlan(parts, resolveName, boxWithChildren);
    expect(plan.decomposed.axis.x).toBeCloseTo(0, 5);
    expect(plan.decomposed.axis.z).toBeCloseTo(0, 5);
    const singles = plan.stackArrows.filter((a) => a.kind === 'single');
    expect(singles.length).toBeGreaterThanOrEqual(2);
    for (const a of singles) {
      expect(a.from[0]).toBeCloseTo(0, 5);
      expect(a.to[0]).toBeCloseTo(0, 5);
      expect(a.from[2]).toBeCloseTo(0, 5);
    }
    // Neckwear arrow lands on the top of the bare torso's neck stud (973 half-height 16 → top 74)
    const torsoLayer = plan.stackLayers.find((l) => l.role === 'torso')!;
    const neckArrow = singles[0];
    expect(neckArrow.to[1]).toBeCloseTo(74 + torsoLayer.offsetY + 2, 5);

    const seq = buildMinifigSequentialPlan(parts, resolveName, boxWithChildren);
    for (const st of seq.stages) {
      for (const a of st.arrows.filter((x) => x.kind === 'single')) {
        expect(a.from[0]).toBeCloseTo(0, 5);
      }
    }
  });

  it('shows accessory callouts front-facing while the assembled figure keeps the posed rotation', () => {
    // Bag rotated 90° about Z (handle vertical) in the figure's right hand
    const rotZ90: RuntimePart['m'] = [0, -1, 0, 1, 0, 0, 0, 0, 1];
    const bag: RuntimePart = { ...makePart('bag', '93091', -26, 40, 12, 26), m: rotZ90 };
    const parts: RuntimePart[] = [
      makePart('legs', '3815c01', 0, 20, 0, 272),
      makePart('torso', '973', 0, 58, 0, 85),
      makePart('arm_r', '3818', -16, 56, 0, 85),
      makePart('hand_r', '3820', -24, 44, 10, 14),
      makePart('head', '3626c', 0, 88, 0, 14),
      bag,
    ];
    const plan = buildMinifigExplodedPlan(parts, (pid) => (pid === '93091' ? 'Minifigure Handbag / Purse' : resolveName(pid)), computeBox);
    expect(plan.accessoryCallouts).toHaveLength(1);
    const acc = plan.accessoryCallouts[0];
    // Assembled figure: untouched posed rotation
    expect(acc.parts[0].m).toEqual(rotZ90);
    expect(plan.assembledParts.find((p) => p.id === 'bag')!.m).toEqual(rotZ90);
    // Callout preview: native (identity) orientation facing the camera, same id
    expect(acc.display.parts[0].id).toBe('bag');
    const m = acc.display.parts[0].m!;
    const ident = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    m.forEach((v, i) => expect(v).toBeCloseTo(ident[i], 6));
  });

  it('paginates sequential stages cleanly into horizontal rows for both landscape and portrait pages', () => {
    // 6-stage build (IMG_0315): always 3 + 3 across 2 pages!
    expect(paginateMinifigSequentialStages(6, false)).toEqual([
      { start: 0, end: 3, cols: 3, pageIdx: 0, pageCount: 2 },
      { start: 3, end: 6, cols: 3, pageIdx: 1, pageCount: 2 },
    ]);
    expect(paginateMinifigSequentialStages(6, true)).toEqual([
      { start: 0, end: 3, cols: 3, pageIdx: 0, pageCount: 2 },
      { start: 3, end: 6, cols: 3, pageIdx: 1, pageCount: 2 },
    ]);

    // 4-stage standard minifig: 1 row of 4 on landscape, 2 + 2 on portrait
    expect(paginateMinifigSequentialStages(4, true)).toEqual([
      { start: 0, end: 4, cols: 4, pageIdx: 0, pageCount: 1 },
    ]);
    expect(paginateMinifigSequentialStages(4, false)).toEqual([
      { start: 0, end: 2, cols: 2, pageIdx: 0, pageCount: 2 },
      { start: 2, end: 4, cols: 2, pageIdx: 1, pageCount: 2 },
    ]);

    // 3-stage bald minifig: 1 single row of 3
    expect(paginateMinifigSequentialStages(3, false)).toEqual([
      { start: 0, end: 3, cols: 3, pageIdx: 0, pageCount: 1 },
    ]);
  });
});
