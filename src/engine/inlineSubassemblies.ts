/**
 * Automatic Inline Micro-Subassembly Detection (Books, Hinged Containers, Chests, Suitcases, Laptops).
 *
 * Official LEGO instruction manuals assemble compact hinged / lidded / enclosed props
 * (such as a 2–3 piece Minifig Book `24324 + 24093 (+ 3069b page tile)`, a Treasure Chest
 * `base + lid (+ contents)`, a Suitcase, or a Laptop) in a SINGLE step with an inline
 * submodel callout box, rather than splitting the base and cover across separate steps or
 * mixing them into a busy structural wall/plate step.
 *
 * All rules are generalized from official LDraw part geometry, naming conventions, and
 * 3D contact/support topology — zero model-specific heuristics.
 */

export type EnclosureFamily =
  | 'book'
  | 'chest'
  | 'coffin'
  | 'suitcase'
  | 'laptop'
  | 'container';

export interface InlineSubassemblyBox {
  min: [number, number, number];
  max: [number, number, number];
  center: [number, number, number];
}

export interface InlineSubassemblyPartInput {
  index: number;
  partId: string;
  partName: string;
  role: string;
  box: InlineSubassemblyBox;
}

export interface EnclosurePartClassification {
  family: EnclosureFamily;
  partKind: 'base' | 'cover';
  displayName: string;
  /** True when the family can have multiple hinged shell pieces (e.g. 33009k*, 4449k*, 62698k*). */
  allowMultipleCovers: boolean;
}

export interface InlineSubassemblyCluster {
  id: string;
  family: EnclosureFamily;
  name: string;
  baseIndex: number;
  partIndices: number[];
}

export interface DetectInlineSubassembliesOptions {
  /** Optional set of part indices already claimed by another system (e.g. minifigures or duplicate submodels). */
  excludedIndices?: ReadonlySet<number>;
  /** Maximum total parts in a single inline micro-subassembly (default: 6). */
  maxClusterSize?: number;
  /** Maximum 3D AABB surface gap (LDU) to pair a base with its matching cover/lid (default: 10). */
  maxPairGapLdu?: number;
}

const MAX_COMPACT_CONTAINER_SPAN_LDU = 140;

function boxSpan(b: InlineSubassemblyBox): [number, number, number] {
  return [
    Math.max(0, b.max[0] - b.min[0]),
    Math.max(0, b.max[1] - b.min[1]),
    Math.max(0, b.max[2] - b.min[2]),
  ];
}

function boxMaxSpan(b: InlineSubassemblyBox): number {
  const [dx, dy, dz] = boxSpan(b);
  return Math.max(dx, dy, dz);
}

function boxGap3D(a: InlineSubassemblyBox, b: InlineSubassemblyBox): number {
  const gx = Math.max(0, a.min[0] - b.max[0], b.min[0] - a.max[0]);
  const gy = Math.max(0, a.min[1] - b.max[1], b.min[1] - a.max[1]);
  const gz = Math.max(0, a.min[2] - b.max[2], b.min[2] - a.max[2]);
  return Math.hypot(gx, gy, gz);
}

function mergeBoxes(boxes: ReadonlyArray<InlineSubassemblyBox>): InlineSubassemblyBox {
  const mn: [number, number, number] = [Infinity, Infinity, Infinity];
  const mx: [number, number, number] = [-Infinity, -Infinity, -Infinity];
  for (const b of boxes) {
    for (let k = 0; k < 3; k++) {
      if (b.min[k] < mn[k]) mn[k] = b.min[k];
      if (b.max[k] > mx[k]) mx[k] = b.max[k];
    }
  }
  return {
    min: mn,
    max: mx,
    center: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2],
  };
}

/**
 * Classifies an LDraw part into a hinged/lidded enclosure family (base or cover/lid)
 * using official LDraw part numbers and official description conventions.
 */
export function classifyEnclosurePart(
  partId: string,
  partName: string,
  box?: InlineSubassemblyBox,
): EnclosurePartClassification | null {
  const id = String(partId || '').trim().toLowerCase().replace(/\.dat$/i, '');
  const name = String(partName || '').trim().toLowerCase();

  // Never classify stickers, printed tiles, panels, bookcases, Duplo, or pre-assembled complete shortcuts
  if (/\b(?:sticker|bookcase|panel|duplo|bygglek)\b/.test(name)) return null;
  if (/(?:c\d+|-f\d+)$/i.test(id)) return null;

  // 1. Minifig Book (24324 Book Base + 24093/29167 Book Cover; 33009k01..k05 Spine/Front/Back/Joints)
  if (
    /^(?:bl_)?(?:24324|33009k01)(?:[^0-9]|$)/.test(id) ||
    (/\bbook\b/.test(name) && /\b(?:base|spine|back)\b/.test(name) && !/\bcover\b/.test(name))
  ) {
    return { family: 'book', partKind: 'base', displayName: 'Book', allowMultipleCovers: true };
  }
  if (
    /^(?:bl_)?(?:24093|29167|33009k0[2-5])(?:[^0-9]|$)/.test(id) ||
    (/\bbook\b/.test(name) && /\b(?:cover|front|joint)\b/.test(name) && !/\bbase\b/.test(name))
  ) {
    return { family: 'book', partKind: 'cover', displayName: 'Book', allowMultipleCovers: true };
  }

  // 2. Treasure Chest (4738/54195/62622 Base + 4739/62623/80835 Lid)
  if (
    /^(?:bl_)?(?:4739|62623|80835)(?:[^0-9]|$)/.test(id) ||
    (/\btreasure\s+chest\b/.test(name) && /\blid\b/.test(name))
  ) {
    return { family: 'chest', partKind: 'cover', displayName: 'Treasure Chest', allowMultipleCovers: false };
  }
  if (
    /^(?:bl_)?(?:4738|54195|62622)(?:[^0-9]|$)/.test(id) ||
    (/\btreasure\s+chest\b/.test(name) && !/\blid\b/.test(name))
  ) {
    return { family: 'chest', partKind: 'base', displayName: 'Treasure Chest', allowMultipleCovers: false };
  }

  // 3. Coffin (30163 Base + 10304/30164 Lid)
  if (
    /^(?:bl_)?(?:10304|30164)(?:[^0-9]|$)/.test(id) ||
    (/\bcoffin\b/.test(name) && /\blid\b/.test(name))
  ) {
    return { family: 'coffin', partKind: 'cover', displayName: 'Coffin', allowMultipleCovers: false };
  }
  if (
    /^(?:bl_)?30163(?:[^0-9]|$)/.test(id) ||
    (/\bcoffin\b/.test(name) && !/\blid\b/.test(name))
  ) {
    return { family: 'coffin', partKind: 'base', displayName: 'Coffin', allowMultipleCovers: false };
  }

  // 4. Minifig Suitcase halves (4449k01..03, 37178k01..02, 37702)
  if (
    /^(?:bl_)?(?:4449k02|37178k01|37702)(?:[^0-9]|$)/.test(id) ||
    (/\bsuitcase\b/.test(name) && /\b(?:male|hinge)\b/.test(name) && !/\blid\b/.test(name))
  ) {
    return { family: 'suitcase', partKind: 'base', displayName: 'Suitcase', allowMultipleCovers: true };
  }
  if (
    /^(?:bl_)?(?:4449k0[13]|37178k02)(?:[^0-9]|$)/.test(id) ||
    (/\bsuitcase\b/.test(name) && /\b(?:female|joiner|lid)\b/.test(name))
  ) {
    return { family: 'suitcase', partKind: 'cover', displayName: 'Suitcase', allowMultipleCovers: true };
  }

  // 5. Minifig Laptop halves (62698k01 Keyboard + 62698k02/03 Hinge/Screen)
  if (
    /^(?:bl_)?62698k01(?:[^0-9]|$)/.test(id) ||
    (/\blaptop\b/.test(name) && /\bkeyboard\b/.test(name))
  ) {
    return { family: 'laptop', partKind: 'base', displayName: 'Laptop', allowMultipleCovers: true };
  }
  if (
    /^(?:bl_)?62698k0[23](?:[^0-9]|$)/.test(id) ||
    (/\blaptop\b/.test(name) && /\b(?:screen|hinge)\b/.test(name))
  ) {
    return { family: 'laptop', partKind: 'cover', displayName: 'Laptop', allowMultipleCovers: true };
  }

  // 6. Generic compact LDraw Container Base + Lid/Cover (<= 140 LDU)
  if (/^container\b/.test(name) && (!box || boxMaxSpan(box) <= MAX_COMPACT_CONTAINER_SPAN_LDU)) {
    if (/\b(?:lid|cover)\b/.test(name)) {
      return { family: 'container', partKind: 'cover', displayName: 'Container', allowMultipleCovers: false };
    }
    if (!/\b(?:door|drawer|pod)\b/.test(name)) {
      return { family: 'container', partKind: 'base', displayName: 'Container', allowMultipleCovers: false };
    }
  }

  return null;
}

/**
 * Detects compact self-contained inline micro-subassemblies (books, chests, suitcases,
 * laptops, hinged containers) in a build scope so each is constructed in ONE step with
 * an inline submodel callout box.
 */
export function detectInlineSubassemblies(
  parts: ReadonlyArray<InlineSubassemblyPartInput>,
  adj: ReadonlyArray<ReadonlyArray<number>>,
  belowMap: ReadonlyArray<ReadonlyArray<number>>,
  options?: DetectInlineSubassembliesOptions,
): InlineSubassemblyCluster[] {
  const n = parts.length;
  if (n < 2) return [];

  const excluded = options?.excludedIndices ?? new Set<number>();
  const maxClusterSize = Math.max(2, options?.maxClusterSize ?? 6);
  const maxPairGap = Math.max(2, options?.maxPairGapLdu ?? 10);

  // Build reverse belowMap (supportedAbove[u] = list of parts that have u as a vertical prerequisite)
  const supportedAbove: number[][] = Array.from({ length: n }, () => []);
  for (let i = 0; i < n; i++) {
    for (const u of belowMap[i] || []) {
      if (u >= 0 && u < n) supportedAbove[u].push(i);
    }
  }

  // Classify every eligible part
  const classes: Array<EnclosurePartClassification | null> = parts.map((p, idx) => {
    if (excluded.has(idx)) return null;
    if (p.role === 'figure' || p.role === 'wheel' || p.role === 'wheel_holder') return null;
    return classifyEnclosurePart(p.partId, p.partName, p.box);
  });

  // Collect candidate (base, cover) pairs within the same family
  const candidatePairs: Array<{ base: number; cover: number; gap: number; family: EnclosureFamily }> = [];
  for (let bi = 0; bi < n; bi++) {
    const bc = classes[bi];
    if (!bc || bc.partKind !== 'base') continue;
    const adjSet = new Set(adj[bi] || []);
    for (let ci = 0; ci < n; ci++) {
      if (ci === bi) continue;
      const cc = classes[ci];
      if (!cc || cc.partKind !== 'cover' || cc.family !== bc.family) continue;
      const gap = boxGap3D(parts[bi].box, parts[ci].box);
      if (adjSet.has(ci) || gap <= maxPairGap) {
        candidatePairs.push({ base: bi, cover: ci, gap, family: bc.family });
      }
    }
  }

  if (candidatePairs.length === 0) return [];

  candidatePairs.sort((a, b) => a.gap - b.gap || a.base - b.base || a.cover - b.cover);

  const claimed = new Set<number>();
  const baseToCovers = new Map<number, number[]>();

  // Greedy closest-pair matching: first give each base its closest cover, then attach any
  // remaining multi-part shell pieces (e.g. 33009k* joints or 62698k* hinge+screen).
  for (const pair of candidatePairs) {
    if (claimed.has(pair.cover)) continue;
    if (baseToCovers.has(pair.base)) continue;
    baseToCovers.set(pair.base, [pair.cover]);
    claimed.add(pair.base);
    claimed.add(pair.cover);
  }

  for (const pair of candidatePairs) {
    if (claimed.has(pair.cover)) continue;
    const covers = baseToCovers.get(pair.base);
    const bc = classes[pair.base];
    if (!covers || !bc || !bc.allowMultipleCovers) continue;
    if (covers.length >= maxClusterSize - 1) continue;
    if (pair.gap <= Math.min(8, maxPairGap)) {
      covers.push(pair.cover);
      claimed.add(pair.cover);
    }
  }

  const clusters: InlineSubassemblyCluster[] = [];
  let seq = 0;

  for (const [baseIdx, coverIndices] of baseToCovers.entries()) {
    const bc = classes[baseIdx]!;
    const shellIndices = [baseIdx, ...coverIndices];
    const shellSet = new Set<number>(shellIndices);
    const encBox = mergeBoxes(shellIndices.map((i) => parts[i].box));
    const encMaxSpan = boxMaxSpan(encBox);

    // Collect small interior parts (e.g. 1x2 page tile inside a book, or gems/tiles inside a chest)
    const interiorIndices: number[] = [];
    const pad = 3;
    for (let i = 0; i < n; i++) {
      if (shellIndices.length + interiorIndices.length >= maxClusterSize) break;
      if (claimed.has(i) || excluded.has(i) || shellSet.has(i)) continue;
      const p = parts[i];
      if (p.role === 'figure' || p.role === 'wheel' || p.role === 'wheel_holder') continue;

      // 1. Center must lie inside the mated enclosure AABB (with small tolerance)
      const c = p.box.center;
      if (
        c[0] < encBox.min[0] - pad || c[0] > encBox.max[0] + pad ||
        c[1] < encBox.min[1] - pad || c[1] > encBox.max[1] + pad ||
        c[2] < encBox.min[2] - pad || c[2] > encBox.max[2] + pad
      ) {
        continue;
      }

      // 2. Must be compact enough to fit inside the enclosure
      const [dx, dy, dz] = boxSpan(p.box);
      if (Math.max(dx, dy, dz) > encMaxSpan + 4) continue;

      // 3. Must touch a shell piece (or be within tight proximity of the base)
      const nbs = adj[i] || [];
      const touchesShell = nbs.some((nb) => shellSet.has(nb));
      const nearBase = boxGap3D(p.box, parts[baseIdx].box) <= 4;
      if (!touchesShell && !nearBase) continue;

      // 4. Must not support any external part outside this cluster
      const hasExternalDependent = (supportedAbove[i] || []).some((dep) => !shellSet.has(dep));
      if (hasExternalDependent) continue;

      // 5. Must not be a structural wall/floor piece anchored to >= 2 external structural parts
      const extStructuralNbs = nbs.filter(
        (nb) => !shellSet.has(nb) && parts[nb].role === 'structural',
      );
      if (extStructuralNbs.length >= 2) continue;

      interiorIndices.push(i);
    }

    const memberIndices = [...shellIndices, ...interiorIndices];
    const memberSet = new Set<number>(memberIndices);

    // Structural leaf safety guard: skip if any external part rests vertically on top of this cluster
    const supportsExternalPart = memberIndices.some((m) =>
      (supportedAbove[m] || []).some((dep) => !memberSet.has(dep)),
    );
    if (supportsExternalPart) {
      for (const s of shellIndices) claimed.delete(s);
      continue;
    }

    for (const idx of interiorIndices) claimed.add(idx);

    // Deterministic order inside the cluster: base first, then covers, then interior parts bottom-up
    const sortedCovers = [...coverIndices].sort(
      (a, b) => parts[a].box.min[1] - parts[b].box.min[1] || a - b,
    );
    const sortedInterior = [...interiorIndices].sort(
      (a, b) => parts[a].box.min[1] - parts[b].box.min[1] || a - b,
    );

    seq++;
    clusters.push({
      id: `inline_${bc.family}_${seq}`,
      family: bc.family,
      name: bc.displayName,
      baseIndex: baseIdx,
      partIndices: [baseIdx, ...sortedCovers, ...sortedInterior],
    });
  }

  return clusters;
}
