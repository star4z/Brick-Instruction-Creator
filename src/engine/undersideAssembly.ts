import type { WorldBox } from './minifigPose';

export interface UndersidePartInput {
  index: number;
  partId: string;
  partName: string;
  shape?: string;
  hasStuds?: boolean;
  role: string;
  box: WorldBox;
  isCladding: boolean;
}

export interface TechnicMechanismSpec {
  id: string;
  name: string;
  partIndices: number[];
  pocketIndex: number;
}

export interface UndersideSubassemblySpec {
  id: string;
  name: string;
  partIndices: number[];
  pocketIndex: number;
}

export interface UndersidePocketSpec {
  partIndices: number[];
  mechanisms: TechnicMechanismSpec[];
  /** Cohesive multi-part underside structural modules to pre-build right-side up before snapping onto the flipped deck. */
  subassemblies: UndersideSubassemblySpec[];
  /** All non-mechanism structural indices in this pocket. */
  structuralIndices: number[];
  /** Remaining small/flat structural indices not claimed by a pre-built sub-module. */
  looseStructuralIndices: number[];
}

export interface UndersideAssemblyPlan {
  hasSuspendedUnderside: boolean;
  deckMinY: number;
  deckBandMaxY: number;
  deckPartIndices: number[];
  pockets: UndersidePocketSpec[];
  allUndersideIndices: Set<number>;
  mechanisms: TechnicMechanismSpec[];
  /** All cohesive multi-part underside structural sub-modules across pockets, pre-built right-side up. */
  subassemblies: UndersideSubassemblySpec[];
}

const TECHNIC_MECH_FALLBACK_ID_RE =
  /^(?:3713|32123|4265|6590|2825|41677|32013|32034|32184|6536|6538|2736|32523|32524|6632|32063|32065|32140|60483|60484|6553|44224|44225)/;

/**
 * Returns true if the part is a thin smooth tile/plate with a circular pass-through hole
 * (e.g. a 2x2 round tile with center hole). Such parts have no axial clutch on a Technic
 * axle and act as loose retaining bearings rather than rigid vertical foundations.
 */
export function isLooseHoleBearing(part: UndersidePartInput): boolean {
  const height = part.box.max[1] - part.box.min[1];
  if (height > 10.5) return false;
  if (part.shape === 'round_hole') return true;
  const id = (part.partId || '').toLowerCase();
  if (id === '15535' || id === '18674' || id === '85861') return true;
  const name = (part.partName || '').toLowerCase();
  return part.hasStuds === false && /\btile\b/.test(name) && /\bhole\b/.test(name);
}

/**
 * Returns true if the part is a non-stud-host Technic mechanism component
 * (Technic axle, bush, liftarm/beam, axle connector, or towball axle) that
 * assembles into a standalone mechanical sub-assembly rather than a stud-stacked brick host.
 */
export function isTechnicMechanismPart(part: UndersidePartInput): boolean {
  if (part.role === 'axle') return true;
  if (part.role === 'wheel' || part.role === 'wheel_holder' || part.role === 'figure') {
    return false;
  }
  const id = (part.partId || '').toLowerCase();
  const name = (part.partName || '').toLowerCase();
  // Exclude stud-bearing Technic chassis hosts (Technic bricks & plates with holes)
  if (/\b(?:technic[,\s]*(?:brick|plate)|wheel\s*holder|bogie|motor)\b/.test(name)) {
    return false;
  }
  if (part.shape === 'technic_brick' || part.shape === 'technic_plate') {
    return false;
  }
  if (
    /\b(?:liftarm|technic[,\s]*beam|bush|axle\s*(?:connector|joiner|pin)|tow\s*ball)\b/.test(
      name,
    )
  ) {
    return true;
  }
  if (part.hasStuds === true && !/\bliftarm\b/.test(name)) {
    return false;
  }
  return TECHNIC_MECH_FALLBACK_ID_RE.test(id);
}

function isVerticalAxle(part: UndersidePartInput): boolean {
  if (part.role !== 'axle') return false;
  const dx = part.box.max[0] - part.box.min[0];
  const dy = part.box.max[1] - part.box.min[1];
  const dz = part.box.max[2] - part.box.min[2];
  return dy > Math.max(dx, dz) * 1.3;
}

function findConnectedComponents(
  indices: readonly number[],
  adj: readonly (readonly number[])[],
): number[][] {
  const allowed = new Set(indices);
  const visited = new Set<number>();
  const comps: number[][] = [];
  for (const start of indices) {
    if (visited.has(start)) continue;
    const comp: number[] = [];
    const queue: number[] = [start];
    visited.add(start);
    let head = 0;
    while (head < queue.length) {
      const cur = queue[head++];
      comp.push(cur);
      for (const nb of adj[cur] ?? []) {
        if (!allowed.has(nb) || visited.has(nb)) continue;
        visited.add(nb);
        queue.push(nb);
      }
    }
    comps.push(comp);
  }
  return comps;
}

function horizontalSpan(indices: readonly number[], parts: readonly UndersidePartInput[]): number {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const i of indices) {
    const b = parts[i].box;
    if (b.min[0] < minX) minX = b.min[0];
    if (b.max[0] > maxX) maxX = b.max[0];
    if (b.min[2] < minZ) minZ = b.min[2];
    if (b.max[2] > maxZ) maxZ = b.max[2];
  }
  if (!Number.isFinite(minX)) return 0;
  return Math.max(maxX - minX, maxZ - minZ);
}

function emptyPlan(): UndersideAssemblyPlan {
  return {
    hasSuspendedUnderside: false,
    deckMinY: 0,
    deckBandMaxY: 0,
    deckPartIndices: [],
    pockets: [],
    allUndersideIndices: new Set<number>(),
    mechanisms: [],
    subassemblies: [],
  };
}

/**
 * Analyzes a section or model using pure geometry and mechanical connectivity to determine
 * whether it has a broad Primary Structural Deck sitting above isolated suspended underside
 * pockets (and whether any pocket contains a captured multi-part Technic axle/bar mechanism).
 *
 * Completely model- and theme-agnostic:
 * - Models resting on a ground baseplate (houses, castles, towers) fail the isolated-pocket
 *   check and return `hasSuspendedUnderside: false` (standard bottom-up build).
 * - Models with a wide chassis/hull deck above localized underside structures (vehicles,
 *   aircraft, starships, bridges, mechs) build the rigid deck first, flip upside down
 *   (`side: 'bottom'`, `cue: 'flip_vertical'`), insert any pre-built Technic axle mechanisms
 *   into the underside deck holes, stack the underside bricks & retaining caps in inverted
 *   gravity order, then flip right-side up to build upward.
 */
export function analyzeUndersideAssembly(
  parts: readonly UndersidePartInput[],
  adj: readonly (readonly number[])[],
): UndersideAssemblyPlan {
  const n = parts.length;
  if (n < 24) return emptyPlan();

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;

  const structuralIndices: number[] = [];
  for (let i = 0; i < n; i++) {
    const p = parts[i];
    if (p.role === 'wheel' || p.role === 'figure' || p.isCladding) continue;
    structuralIndices.push(i);
    const b = p.box;
    if (b.min[0] < minX) minX = b.min[0];
    if (b.max[0] > maxX) maxX = b.max[0];
    if (b.min[1] < minY) minY = b.min[1];
    if (b.max[1] > maxY) maxY = b.max[1];
    if (b.min[2] < minZ) minZ = b.min[2];
    if (b.max[2] > maxZ) maxZ = b.max[2];
  }

  if (structuralIndices.length < 16 || !Number.isFinite(minY)) return emptyPlan();
  const longSpan = Math.max(maxX - minX, maxZ - minZ);
  const totalHeight = maxY - minY;
  if (longSpan < 160 || totalHeight < 40) return emptyPlan();

  // Quantize candidate deck heights on 8 LDU (1 plate) boundaries
  const yBuckets = new Set<number>();
  const maxDeckSearchY = minY + Math.min(128, totalHeight * 0.55);
  for (const i of structuralIndices) {
    const qy = Math.round(parts[i].box.min[1] / 8) * 8;
    if (qy >= minY + 16 && qy <= maxDeckSearchY) {
      yBuckets.add(qy);
    }
  }
  const candYs = Array.from(yBuckets).sort((a, b) => a - b);

  const mechFlags = parts.map((p) => isTechnicMechanismPart(p));
  const looseHoleFlags = parts.map((p) => isLooseHoleBearing(p));

  let chosenDeckY: number | null = null;
  let chosenDeckComp: number[] = [];
  let chosenBelowComps: number[][] = [];

  for (const yCand of candYs) {
    // Parts forming the horizontal deck band at yCand (tight -4 LDU lower bound prevents
    // grabbing recessed underside connectors sitting 1 plate = 8 LDU below the real deck)
    const bandParts: number[] = [];
    for (const i of structuralIndices) {
      if (mechFlags[i]) continue;
      const b = parts[i].box;
      if (b.min[1] >= yCand - 4 && b.min[1] <= yCand + 12 && b.max[1] <= yCand + 32) {
        bandParts.push(i);
      }
    }
    if (bandParts.length < 4) continue;

    const bandComps = findConnectedComponents(bandParts, adj);
    bandComps.sort((a, b) => horizontalSpan(b, parts) - horizontalSpan(a, parts));
    const mainDeckComp = bandComps[0];
    const deckSpan = horizontalSpan(mainDeckComp, parts);
    if (deckSpan < longSpan * 0.55 || mainDeckComp.length < 4) continue;

    // Require the deck's own base layer at yCand (minY <= yCand + 4) to cover a real structural
    // span (>= 40% of longSpan) so a lone underside part 1 plate below the true deck cannot
    // trigger a premature deck match at yCand - 8 while borrowing the real deck above via +12.
    const baseLayerParts = mainDeckComp.filter((i) => parts[i].box.min[1] <= yCand + 4);
    if (baseLayerParts.length < 2 || horizontalSpan(baseLayerParts, parts) < longSpan * 0.40) {
      continue;
    }

    // Use the exact underside plane of `baseLayerParts` (rather than the 8-LDU quantized
    // bucket `yCand`) so bricks clutched directly beneath the deck with 4 LDU top studs
    // are never dropped when a model's deck sits slightly off an exact 8-LDU multiple.
    let actualDeckMinY = Infinity;
    const mainDeckSet = new Set<number>(mainDeckComp);
    for (const i of baseLayerParts) {
      if (parts[i].box.min[1] < actualDeckMinY) actualDeckMinY = parts[i].box.min[1];
    }
    const deckFloorY = Number.isFinite(actualDeckMinY) ? actualDeckMinY : yCand;

    // Collect parts strictly below the deck (plus vertical Technic mechanisms hanging below it
    // and recessed underside connectors/turntables whose base sits below the deck while their
    // upper snap lip/collar reaches up into a deck opening)
    const belowParts: number[] = [];
    const belowSet = new Set<number>();
    for (let i = 0; i < n; i++) {
      if (mainDeckSet.has(i)) continue;
      const p = parts[i];
      if (p.role === 'figure') continue;
      const b = p.box;
      if (b.max[1] <= deckFloorY + 5.5) {
        belowParts.push(i);
        belowSet.add(i);
      } else if (mechFlags[i] && b.min[1] < deckFloorY - 8.0 && b.center[1] < deckFloorY + 6.0) {
        // Vertical axle/mechanism extending from below up into a deck hole
        belowParts.push(i);
        belowSet.add(i);
      } else if (
        b.min[1] < deckFloorY - 4.0 &&
        b.max[1] <= deckFloorY + 12.0 &&
        b.center[1] <= deckFloorY + 4.0
      ) {
        // Recessed underside connector (e.g. 2x2 turntable flat base, socket plate, or coupler)
        // resting on top of an underside sub-assembly whose upper snap collar reaches into a deck
        // opening without rising above the deck floor.
        belowParts.push(i);
        belowSet.add(i);
      }
    }
    if (belowParts.length < 4) continue;

    const belowComps = findConnectedComponents(belowParts, adj);
    // Reject if a single continuous structure underneath already spans >= 50% of the model
    // (that indicates a normal ground baseplate / full lower floor, not suspended pockets)
    const maxBelowSpan = belowComps.reduce(
      (best, comp) => Math.max(best, horizontalSpan(comp, parts)),
      0,
    );
    if (maxBelowSpan >= longSpan * 0.50) continue;

    // Require at least one substantial pocket (>= 4 parts) genuinely attached to the deck above
    const deckAndAbove = new Set<number>();
    for (let i = 0; i < n; i++) {
      if (!belowSet.has(i) && parts[i].box.min[1] >= deckFloorY - 4 && parts[i].role !== 'figure') {
        deckAndAbove.add(i);
      }
    }
    const attachedPockets = belowComps.filter(
      (comp) =>
        comp.length >= 2 &&
        comp.some((i) => (adj[i] ?? []).some((nb) => deckAndAbove.has(nb))),
    );
    if (!attachedPockets.some((comp) => comp.length >= 4)) continue;

    chosenDeckY = deckFloorY;
    chosenDeckComp = mainDeckComp;
    chosenBelowComps = attachedPockets;
    break;
  }

  if (chosenDeckY === null || chosenBelowComps.length === 0) {
    return emptyPlan();
  }

  const deckBandMaxY = chosenDeckY + 20;
  const deckSet = new Set<number>(chosenDeckComp);
  const chosenBelowSet = new Set<number>();
  for (const comp of chosenBelowComps) {
    for (const i of comp) chosenBelowSet.add(i);
  }
  // Include any additional deck-band structural parts touching the main deck component
  for (const i of structuralIndices) {
    if (deckSet.has(i) || chosenBelowSet.has(i) || mechFlags[i]) continue;
    const b = parts[i].box;
    if (b.min[1] >= chosenDeckY - 4 && b.max[1] <= deckBandMaxY + 12) {
      if ((adj[i] ?? []).some((nb) => deckSet.has(nb))) {
        deckSet.add(i);
      }
    }
  }

  const allUndersideIndices = new Set<number>();
  const pockets: UndersidePocketSpec[] = [];
  const allMechanisms: TechnicMechanismSpec[] = [];
  const allSubassemblies: UndersideSubassemblySpec[] = [];
  let mechSeq = 0;
  let wheelSubSeq = 0;
  let modSubSeq = 0;

  for (let pIdx = 0; pIdx < chosenBelowComps.length; pIdx++) {
    const comp = chosenBelowComps[pIdx];
    for (const i of comp) allUndersideIndices.add(i);

    // Detect multi-part Technic axle/bar mechanisms inside this underside pocket
    const mechCandidates = comp.filter((i) => mechFlags[i]);
    const mechComps = findConnectedComponents(mechCandidates, adj);
    const pocketMechanisms: TechnicMechanismSpec[] = [];
    const claimedByMech = new Set<number>();

    for (const mc of mechComps) {
      if (mc.length < 2) continue;
      const hasAxle = mc.some((i) => parts[i].role === 'axle');
      const hasNonAxleMech = mc.some((i) => parts[i].role !== 'axle');
      if (!hasAxle || !hasNonAxleMech) continue;

      const hasVertAxle = mc.some((i) => isVerticalAxle(parts[i]));
      const touchesLooseHole = mc.some((i) =>
        (adj[i] ?? []).some((nb) => looseHoleFlags[nb]),
      );
      const touchesDeck = mc.some((i) =>
        (adj[i] ?? []).some((nb) => deckSet.has(nb) || parts[nb].box.min[1] >= chosenDeckY - 6),
      );
      if (!hasVertAxle && !touchesLooseHole && !touchesDeck) continue;

      mechSeq++;
      const spec: TechnicMechanismSpec = {
        id: `technic_mech_${mechSeq}`,
        name: mechSeq === 1 ? 'Technic Mechanism' : `Technic Mechanism ${mechSeq}`,
        partIndices: mc,
        pocketIndex: pIdx,
      };
      pocketMechanisms.push(spec);
      allMechanisms.push(spec);
      for (const i of mc) claimedByMech.add(i);
    }

    const pocketStructural = comp.filter((i) => !claimedByMech.has(i));

    // Promote cohesive multi-part underside structural clusters (>= 4 parts and multi-layer
    // or wheeled) into standalone sub-modules built right-side up bottom-up FIRST, then
    // snapped cleanly onto the flipped deck as a single completed assembly — eliminating
    // floating pieces and impossible wedged-in-between insertions.
    const structComps = findConnectedComponents(pocketStructural, adj);
    structComps.sort((a, b) => b.length - a.length);
    const pocketSubassemblies: UndersideSubassemblySpec[] = [];
    const claimedBySub = new Set<number>();

    for (const sc of structComps) {
      if (sc.length < 4) continue;
      let scMinY = Infinity;
      let scMaxY = -Infinity;
      let hasWheel = false;
      for (const idx of sc) {
        const b = parts[idx].box;
        if (b.min[1] < scMinY) scMinY = b.min[1];
        if (b.max[1] > scMaxY) scMaxY = b.max[1];
        if (parts[idx].role === 'wheel' || parts[idx].role === 'wheel_holder') {
          hasWheel = true;
        }
      }
      const scHeight = Number.isFinite(scMinY) ? scMaxY - scMinY : 0;
      if (scHeight < 14 && !hasWheel) continue;

      let subId: string;
      let subName: string;
      if (hasWheel) {
        wheelSubSeq++;
        subId = `underside_wheel_${wheelSubSeq}`;
        subName = wheelSubSeq === 1 ? 'Wheel Assembly' : `Wheel Assembly ${wheelSubSeq}`;
      } else {
        modSubSeq++;
        subId = `underside_mod_${modSubSeq}`;
        subName = modSubSeq === 1 ? 'Underside Module' : `Underside Module ${modSubSeq}`;
      }
      const subSpec: UndersideSubassemblySpec = {
        id: subId,
        name: subName,
        partIndices: sc,
        pocketIndex: pIdx,
      };
      pocketSubassemblies.push(subSpec);
      allSubassemblies.push(subSpec);
      for (const idx of sc) claimedBySub.add(idx);
    }

    const looseStructuralIndices = pocketStructural.filter((i) => !claimedBySub.has(i));
    pockets.push({
      partIndices: comp,
      mechanisms: pocketMechanisms,
      subassemblies: pocketSubassemblies,
      structuralIndices: pocketStructural,
      looseStructuralIndices,
    });
  }

  // Order pockets with Technic mechanisms first so they attach cleanly right after flipping
  pockets.sort((a, b) => b.mechanisms.length - a.mechanisms.length || b.partIndices.length - a.partIndices.length);
  pockets.forEach((p, idx) => {
    for (const m of p.mechanisms) m.pocketIndex = idx;
    for (const s of p.subassemblies) s.pocketIndex = idx;
  });

  return {
    hasSuspendedUnderside: true,
    deckMinY: chosenDeckY,
    deckBandMaxY,
    deckPartIndices: Array.from(deckSet),
    pockets,
    allUndersideIndices,
    mechanisms: allMechanisms,
    subassemblies: allSubassemblies,
  };
}

/**
 * Inverted-gravity vertical prerequisite DAG for upside-down underside building:
 * `aboveMap[i]` lists parts `u` in the pocket sitting strictly ABOVE `i` in world space
 * (i.e. closer to the already-built deck, therefore *underneath* `i` when flipped upside down)
 * that have support from above/sideways and MUST be placed before `i` so `u` is never trapped
 * beneath a lower cap plate.
 */
export function buildInvertedVerticalPrereqMap(
  boxes: readonly WorldBox[],
  adj: readonly (readonly number[])[],
  roles: readonly string[],
  claddingFlags: readonly boolean[],
  pocketIndices: readonly number[],
  externalSupportSet: ReadonlySet<number>,
): number[][] {
  const pocketSet = new Set(pocketIndices);
  const aboveMap: number[][] = Array.from({ length: boxes.length }, () => []);

  const hasUpperOrSideSupport = (u: number): boolean => {
    const bu = boxes[u];
    for (const w of adj[u] ?? []) {
      if (externalSupportSet.has(w)) return true;
      if (!pocketSet.has(w) || roles[w] === 'wheel' || roles[w] === 'figure' || claddingFlags[w]) {
        continue;
      }
      const bw = boxes[w];
      // Exclude neighbors sitting strictly below `u` in world space
      if (bw.max[1] <= bu.min[1] + 4.5 && bw.center[1] < bu.center[1] - 2.0) continue;
      if (bw.max[1] > bu.min[1] + 4.0 && bw.center[1] >= bu.center[1] - 4.0) return true;
    }
    return false;
  };

  for (const i of pocketIndices) {
    if (roles[i] === 'wheel' || roles[i] === 'figure' || claddingFlags[i]) continue;
    const bi = boxes[i];
    for (const u of pocketIndices) {
      if (u === i || roles[u] === 'wheel' || roles[u] === 'figure' || claddingFlags[u]) continue;
      const bu = boxes[u];
      if (bu.max[1] <= bi.max[1] + 2.0) continue;
      if (bu.center[1] <= bi.center[1] + 2.0) continue;
      if (bu.min[1] < bi.max[1] - 4.5) continue;
      if (bu.min[1] - bi.max[1] > 36) continue;
      const ovX = Math.min(bu.max[0], bi.max[0]) - Math.max(bu.min[0], bi.min[0]);
      const ovZ = Math.min(bu.max[2], bi.max[2]) - Math.max(bu.min[2], bi.min[2]);
      if (ovX < 3.0 || ovZ < 3.0) continue;
      if (!hasUpperOrSideSupport(u)) continue;
      aboveMap[i].push(u);
    }
  }

  return aboveMap;
}

/**
 * Finds remaining inner-face cap attachments (e.g. tiles or round-hole retainer tiles clutched
 * to the top/inner studs of a bottom cap plate while upside down) that should be co-placed
 * with `stepIndices` so they are never trapped beneath the cap plate or left floating.
 */
export function collectCapInnerAttachments(
  stepIndices: readonly number[],
  pocketRemaining: ReadonlySet<number>,
  boxes: readonly WorldBox[],
  adj: readonly (readonly number[])[],
  roles: readonly string[],
): number[] {
  const stepSet = new Set(stepIndices);
  const extras: number[] = [];
  for (const host of stepIndices) {
    const bh = boxes[host];
    for (const nb of adj[host] ?? []) {
      if (stepSet.has(nb) || !pocketRemaining.has(nb)) continue;
      if (roles[nb] === 'wheel' || roles[nb] === 'figure' || roles[nb] === 'axle') continue;
      const bt = boxes[nb];
      // Must sit on the inner (higher world-Y) side of the cap host
      if (bt.min[1] < bh.max[1] - 4.5 || bt.min[1] > bh.max[1] + 4.5) continue;
      const ovX = Math.min(bt.max[0], bh.max[0]) - Math.max(bt.min[0], bh.min[0]);
      const ovZ = Math.min(bt.max[2], bh.max[2]) - Math.max(bt.min[2], bh.min[2]);
      if (ovX < 3.0 || ovZ < 3.0) continue;
      // Only pull in thin inner-face tiles/plates whose only non-axle structural contact in the pocket is the cap host
      if (bt.max[1] - bt.min[1] > 12) continue;
      const otherStructuralNbs = (adj[nb] ?? []).filter(
        (w) => w !== host && !stepSet.has(w) && pocketRemaining.has(w) && roles[w] !== 'axle',
      );
      if (otherStructuralNbs.length === 0) {
        extras.push(nb);
        stepSet.add(nb);
      }
    }
  }
  return extras;
}

/**
 * Returns true when part `idx` connects to `placedSet` ONLY from above (hanging
 * strictly underneath already-placed overhead bricks that cover >= 50% of its XZ
 * footprint within 24 LDU vertically, with zero lower or same-layer support in `placedSet`).
 *
 * Used during upright building so hidden underside attachments (e.g. turntable plates or
 * underside reinforcement plates clutched strictly beneath a spanning deck plate) are
 * deferred out of upright steps and placed cleanly in one batch after flipping the model over.
 */
export function isStrictDeckUndersidePart(
  idx: number,
  boxes: readonly WorldBox[],
  adj: readonly (readonly number[])[],
  placedSet: ReadonlySet<number>,
): boolean {
  const b = boxes[idx];
  if (!b || placedSet.size === 0) return false;
  const area = Math.max(1, (b.max[0] - b.min[0]) * (b.max[2] - b.min[2]));
  let placedNeighborCount = 0;
  let maxCoverRatio = 0;
  let totalCoverArea = 0;

  for (const nb of adj[idx] ?? []) {
    if (!placedSet.has(nb)) continue;
    placedNeighborCount++;
    const bn = boxes[nb];
    // If ANY placed neighbor sits below or at the same vertical band (not strictly above),
    // this piece is not a pure underside-only attachment.
    if (bn.min[1] < b.max[1] - 4.5 || bn.center[1] <= b.center[1] + 2.0) {
      return false;
    }
    if (bn.min[1] <= b.max[1] + 24) {
      const ovX = Math.max(0, Math.min(b.max[0], bn.max[0]) - Math.max(b.min[0], bn.min[0]));
      const ovZ = Math.max(0, Math.min(b.max[2], bn.max[2]) - Math.max(b.min[2], bn.min[2]));
      if (ovX > 2 && ovZ > 2) {
        const ovArea = ovX * ovZ;
        totalCoverArea += ovArea;
        const r = ovArea / area;
        if (r > maxCoverRatio) maxCoverRatio = r;
      }
    }
  }

  return placedNeighborCount > 0 && (maxCoverRatio >= 0.5 || totalCoverArea / area >= 0.65);
}

