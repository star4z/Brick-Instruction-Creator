// Bricks Library classification, curated starter packs, indexing, search, and UI copy helpers.
// Pure TypeScript module (DOM-free) so it can be unit-tested directly and shared by studioRuntime.

export type DatEntryKind = 'part' | 'subpart' | 'primitive';

export type LibraryCategory =
  | 'bricks'
  | 'plates'
  | 'tiles'
  | 'slopes'
  | 'technic'
  | 'minifigs'
  | 'windows'
  | 'other';

/**
 * `official` / `unofficial` = listed in the bundled Online Parts Catalog (geometry downloaded on demand).
 */
export type LibraryPartSource = 'embedded' | 'saved' | 'builtin' | 'official' | 'unofficial';

export type LibraryScopeFilter =
  | 'all'
  | 'saved'
  | 'embedded'
  | 'builtin'
  | 'official'
  | 'unofficial'
  | 'model'
  | 'missing';

export interface LibraryPartItem {
  id: string;
  name: string;
  kind: DatEntryKind;
  category: LibraryCategory;
  sources: LibraryPartSource[];
  primarySource: LibraryPartSource | 'missing';
  inCurrentModel: boolean;
  isMissingInModel: boolean;
  hasExactDat: boolean;
  subpartRefCount: number;
  /** Deduplicated normalized direct subfile references from type-1 lines (when exact `.dat` is loaded). */
  subfileRefs: string[];
  /** Precomputed normalized search haystack (memoized by `filterLibraryItems`). */
  searchText?: string;
  /** Sorted real-world LDraw color IDs this part is actually produced in (when indexed). */
  availableColors?: readonly number[];
  /** True when this entry is only a subpart/primitive/unplaced template inside the loaded `.io` bundle. */
  embeddedIsHelper?: boolean;
}

/** Minimal catalog entry shape consumed by `buildLibraryIndex` (see `partsCatalog.ts`). */
export interface LibraryCatalogEntry {
  name: string;
  origin: 'official' | 'unofficial';
  helper: boolean;
  category: LibraryCategory;
  searchText: string;
}

/** True when the part is part of the built-in catalog (procedural shape, official LDraw, or unofficial/Studio). */
export function isBuiltInLibraryItem(item: Pick<LibraryPartItem, 'sources'>): boolean {
  return (
    item.sources.includes('builtin') ||
    item.sources.includes('official') ||
    item.sources.includes('unofficial')
  );
}

/** True when the part's geometry is only available online (listed in the catalog, not loaded locally). */
export function isOnlineOnlyItem(item: LibraryPartItem): boolean {
  return item.primarySource === 'official' || item.primarySource === 'unofficial';
}

export interface LibraryStats {
  savedParts: number;
  savedHelpers: number;
  savedTotalFiles: number;
  savedTextures: number;
  embeddedParts: number;
  embeddedHelpers: number;
  builtInParts: number;
  modelUniqueParts: number;
  modelMissingShapeCount: number;
  modelMissingExactDatCount: number;
  /** Top-level parts listed in the bundled Online Parts Catalog, by origin (0 until it loads). */
  catalogOfficialParts: number;
  catalogUnofficialParts: number;
}

export interface StarterPack {
  id: string;
  name: string;
  description: string;
  partIds: readonly string[];
}

export interface StarterPackProgress {
  savedCount: number;
  totalCount: number;
  missingIds: string[];
}

export interface ModelFetchCopy {
  status: 'no_model' | 'complete' | 'missing_shapes' | 'can_upgrade';
  heading: string;
  description: string;
  buttonLabel: string;
  buttonEnabled: boolean;
}

export const LIBRARY_CATEGORIES: ReadonlyArray<{ id: LibraryCategory | 'all'; label: string }> = [
  { id: 'all', label: 'All Categories' },
  { id: 'bricks', label: 'Bricks' },
  { id: 'plates', label: 'Plates' },
  { id: 'tiles', label: 'Tiles' },
  { id: 'slopes', label: 'Slopes & Curves' },
  { id: 'technic', label: 'Technic & Bars' },
  { id: 'minifigs', label: 'Minifigures' },
  { id: 'windows', label: 'Windows & Panels' },
  { id: 'other', label: 'Other Parts' },
];

export const ONLINE_STARTER_PACKS: readonly StarterPack[] = [
  {
    id: 'bricks_plates',
    name: 'Bricks & Plates',
    description: 'Standard 1× & 2× bricks, plates, jumpers, corners, and round plates.',
    partIds: [
      '3005', '3004', '3622', '3010', '3009', '3008',
      '3003', '3002', '3001', '2456', '3007', '2357',
      '3062b', '3941',
      '3024', '3023', '3623', '3710', '3666', '3460',
      '3022', '2420', '3021', '3020', '3795', '3034',
      '3031', '3032', '3035', '3794b', '15573', '87580',
      '4073', '4032',
    ],
  },
  {
    id: 'tiles_slopes',
    name: 'Tiles, Slopes & SNOT',
    description: 'Smooth tiles, grilles, cheese slopes, curved slopes, and SNOT bricks.',
    partIds: [
      '3070b', '3069b', '63864', '2431', '6636', '4162',
      '3068b', '26603', '87079', '2412b', '98138', '14769', '25269',
      '54200', '85984', '3040b', '3665', '3039', '3038', '3037', '3660',
      '11477', '15068', '4733', '87087', '4070', '99780', '99781',
    ],
  },
  {
    id: 'technic_bars',
    name: 'Technic, Bars & Clips',
    description: 'Technic bricks, axles, pins, liftarms, bars, clips, and brackets.',
    partIds: [
      '6541', '3700', '3701', '3894',
      '32062', '4519', '3705', '32073', '3706', '3707',
      '2780', '3673', '3713', '32523', '32524',
      '30374', '63965', '60475b', '15712', '60470b',
      '6019', '4085d', '44728', '99206',
    ],
  },
  {
    id: 'minifigs_details',
    name: 'Minifigures & Windows',
    description: 'Minifigure heads, torsos, limbs, helmets, seats, windows, and panels.',
    partIds: [
      '3626c', '3626cp01', '973', '3818', '3819', '3820',
      '3815', '3816', '3817', '3842a', '4079',
      '60594', '60593', '60603', '60601', '4865b',
    ],
  },
];

export function getAllStarterPackPartIds(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const pack of ONLINE_STARTER_PACKS) {
    for (const id of pack.partIds) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

export function normalizeLibraryPartId(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^ldraw\//, '')
    .replace(/^parts\//, '')
    .replace(/^p\//, '')
    .replace(/\.dat$/i, '');
}

const PRIMITIVE_NAME_RE =
  /^(?:stud[\w-]*|stug[\w-]*|box(?:\d|j)[\w-]*|rect\w*|tri\d*|quad\d*|disc\d*|ring\w*|peghol\w*|axl\d*hol\w*|axlehol\w*|axleend\w*|connhol\w*|connect\w*|confric\w*|clip\d+[\w-]*|bump\d+[\w-]*|chrd\w*|ndis\w*|cyl[iocjsabh][\w-]*|edge\w*|empty|\d+-\d+(?:cyli|cylo|cylc|cyls|cyla|disc|edge|ring\d*|rin\d*|chrd|ndis|con\d*|sphe|tor\w*|tang\w*)|t\d+[a-z]\d+)$/i;

/**
 * Classifies an LDraw `.dat` entry as a user-facing `part`, an internal `subpart`,
 * or a low-level geometric `primitive`.
 */
export function classifyDatEntryKind(
  key: string,
  lines?: readonly string[] | null,
  title?: string | null,
): DatEntryKind {
  const k = normalizeLibraryPartId(key);

  if (lines && lines.length > 0) {
    let namePathKind: DatEntryKind | null = null;
    const maxScan = Math.min(lines.length, 16);
    for (let i = 0; i < maxScan; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('0 ')) continue;
      if (/^0\s+!LDRAW_ORG\s+(?:Unofficial_)?Subpart\b/i.test(line)) return 'subpart';
      if (/^0\s+!LDRAW_ORG\s+(?:Unofficial_)?(?:48_|8_)?Primitive\b/i.test(line)) return 'primitive';
      if (/^0\s+!LDRAW_ORG\s+(?:Unofficial_)?(?:Part|Shortcut)\b/i.test(line)) {
        if (title && title.trim().startsWith('~')) return 'subpart';
        return 'part';
      }
      // BrickLink Studio strips `!LDRAW_ORG` and flattens `0 FILE` paths in `model2.ldr`,
      // but preserves the original LDraw subfolder (`48\`, `8\`, `p\`, `s\`) in `0 Name:`.
      if (!namePathKind) {
        const mName = line.match(/^0\s+Name:\s*(.+)$/i);
        if (mName) {
          const normName = mName[1].trim().replace(/\\/g, '/').toLowerCase().replace(/^ldraw\//, '');
          if (normName.startsWith('s/') || normName.startsWith('parts/s/')) {
            namePathKind = 'subpart';
          } else if (
            normName.startsWith('48/') ||
            normName.startsWith('8/') ||
            normName.startsWith('p/')
          ) {
            namePathKind = 'primitive';
          }
        }
      }
    }
    if (namePathKind) return namePathKind;
  }

  if (k.startsWith('s/')) return 'subpart';
  if (k.startsWith('48/') || k.startsWith('8/')) return 'primitive';

  const base = k.split('/').pop() || k;
  if (PRIMITIVE_NAME_RE.test(base)) return 'primitive';
  if (title && title.trim().startsWith('~')) return 'subpart';

  return 'part';
}

export function classifyLibraryCategory(id: string, name: string): LibraryCategory {
  const text = `${id} ${name}`.toLowerCase();
  if (/\b(minifig|minifigure|torso|head|helmet|hair|hips|leg|legs|arm|arms|hand|hands|cape|visor|beard|hat|seat|accessory|bag|purse|backpack|suitcase)\b/i.test(text)) {
    return 'minifigs';
  }
  if (/\b(technic|axle|pin|liftarm|beam|gear|bush|bar|rod|hose|clip|bracket|hinge|turntable|connector|wheel|tyre|tire|train|motor|coupler|buffer)\b/i.test(text)) {
    return 'technic';
  }
  if (/\b(window|door|glass|pane|panel|wall|fence|arch|frame|windscreen|windshield|canopy)\b/i.test(text)) {
    return 'windows';
  }
  if (/\b(slope|wedge|roof|curve|curved|cone|dome|dish|cheese|inverted)\b/i.test(text)) {
    return 'slopes';
  }
  if (/\b(tile|grille|grill)\b/i.test(text)) {
    return 'tiles';
  }
  if (/\b(plate|baseplate|jumper)\b/i.test(text)) {
    return 'plates';
  }
  if (/\b(brick|snot)\b/i.test(text)) {
    return 'bricks';
  }
  return 'other';
}

/**
 * Parses comma-, whitespace-, or newline-separated LDraw part IDs entered by the user.
 */
export function parsePartIdListInput(raw: string): string[] {
  const tokens = String(raw || '')
    .split(/[\s,;]+/)
    .map((t) => normalizeLibraryPartId(t))
    .filter((t) => t.length > 0 && /^[a-z0-9_./-]+$/i.test(t));

  const seen = new Set<string>();
  const out: string[] = [];
  for (const tok of tokens) {
    if (!seen.has(tok)) {
      seen.add(tok);
      out.push(tok);
    }
  }
  return out;
}

/**
 * Checks whether a search query looks like a single fetchable LDraw part ID
 * (e.g., "3001", "3069b", "3626cp01", "60594").
 */
export function extractFetchablePartIdFromQuery(rawQuery: string): string | null {
  const trimmed = String(rawQuery || '').trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const norm = normalizeLibraryPartId(trimmed);
  if (!norm || norm.includes('/')) return null;
  if (!/^[a-z0-9][a-z0-9_-]{1,24}$/i.test(norm)) return null;
  // Must contain at least one digit so plain English words like "brick" or "slope" aren't treated as part IDs
  if (!/\d/.test(norm)) return null;
  return norm;
}

/**
 * Normalizes part names & queries for resilient search matching:
 * e.g. "Brick  2 x  4" and "brick 2x4" and "2×4" all normalize to "2x4".
 */
export function normalizeLibrarySearchText(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/(\d)\s*x\s*(\d)/g, '$1x$2')
    .replace(/[^a-z0-9x/._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractDirectSubfileRefs(lines?: readonly string[] | null): string[] {
  if (!lines) return [];
  const refs = new Set<string>();
  for (const raw of lines) {
    let tr = raw.trim();
    if (/^0\s+!:\s+1\s/.test(tr)) {
      tr = tr.replace(/^0\s+!:\s+/, '');
    }
    if (!tr.startsWith('1 ')) continue;
    const tokens = tr.split(/\s+/);
    if (tokens.length < 15) continue;
    const refRaw = tokens.slice(14).join(' ').trim();
    const normRef = normalizeLibraryPartId(refRaw);
    if (normRef) refs.add(normRef);
  }
  return Array.from(refs);
}

function countSubpartRefs(lines?: readonly string[] | null): number {
  if (!lines) return 0;
  let count = 0;
  for (const raw of lines) {
    const tr = raw.trim();
    if (tr.startsWith('1 ')) count++;
  }
  return count;
}

export interface BuildLibraryIndexInput {
  userLibRaw: ReadonlyMap<string, readonly string[]>;
  userLibTitles: ReadonlyMap<string, string>;
  embeddedDatRaw: ReadonlyMap<string, readonly string[]>;
  embeddedDatTitles: ReadonlyMap<string, string>;
  builtInCatalog: Readonly<Record<string, { name: string }>>;
  modelPartIds: ReadonlySet<string>;
  missingShapePartIds: ReadonlySet<string>;
  missingExactDatPartIds: ReadonlySet<string>;
  resolveName: (id: string) => string;
  savedTextureCount?: number;
  /** Bundled Online Parts Catalog entries keyed by normalized part ID (optional; loads lazily). */
  onlineCatalog?: ReadonlyMap<string, LibraryCatalogEntry> | null;
  /** Bundled real-world part -> LDraw color IDs availability map (optional; loads lazily). */
  partColors?: ReadonlyMap<string, readonly number[]> | null;
}

export interface BuildLibraryIndexResult {
  items: LibraryPartItem[];
  stats: LibraryStats;
}

/**
 * Deduplicates canonical keys vs `BL_Item_No` aliases that share the same lines array reference.
 * When `preferredKeys` is provided (e.g. `modelPartIds`), prefer a key present in `preferredKeys`
 * so aliased embedded `.dat` entries match the exact part ID placed in the model.
 */
function collectCanonicalMapKeys(
  map: ReadonlyMap<string, readonly string[]>,
  preferredKeys?: ReadonlySet<string>,
): Set<string> {
  const chosenByLines = new Map<readonly string[], string>();
  for (const [key, lines] of map.entries()) {
    const prev = chosenByLines.get(lines);
    if (!prev) {
      chosenByLines.set(lines, key);
    } else if (preferredKeys && !preferredKeys.has(prev) && preferredKeys.has(key)) {
      chosenByLines.set(lines, key);
    }
  }
  return new Set(chosenByLines.values());
}

export function buildLibraryIndex(input: BuildLibraryIndexInput): BuildLibraryIndexResult {
  const {
    userLibRaw,
    userLibTitles,
    embeddedDatRaw,
    embeddedDatTitles,
    builtInCatalog,
    modelPartIds,
    missingShapePartIds,
    missingExactDatPartIds,
    resolveName,
    savedTextureCount = 0,
    onlineCatalog = null,
    partColors = null,
  } = input;

  const savedCanonical = collectCanonicalMapKeys(userLibRaw);
  const embeddedCanonical = collectCanonicalMapKeys(embeddedDatRaw, modelPartIds);

  let savedParts = 0;
  let savedHelpers = 0;
  let embeddedParts = 0;
  let embeddedHelpers = 0;

  const byId = new Map<string, LibraryPartItem>();

  const upsert = (
    rawId: string,
    source: LibraryPartSource | null,
    lines: readonly string[] | null,
    explicitTitle: string | null,
    explicitKind?: DatEntryKind,
  ) => {
    const id = normalizeLibraryPartId(rawId);
    if (!id) return;
    const existing = byId.get(id);
    const kind =
      explicitKind ??
      (lines ? classifyDatEntryKind(id, lines, explicitTitle) : existing?.kind ?? 'part');
    const name = existing?.name || resolveName(id);
    const inCurrentModel = modelPartIds.has(id);
    const isMissingInModel = missingShapePartIds.has(id);
    const hasExactDat = embeddedDatRaw.has(id) || userLibRaw.has(id);

    if (!existing) {
      const sources: LibraryPartSource[] = source ? [source] : [];
      byId.set(id, {
        id,
        name,
        kind,
        category: classifyLibraryCategory(id, name),
        sources,
        primarySource: source ?? 'missing',
        inCurrentModel,
        isMissingInModel,
        hasExactDat,
        subpartRefCount: countSubpartRefs(lines),
        subfileRefs: extractDirectSubfileRefs(lines),
      });
    } else {
      if (source && !existing.sources.includes(source)) {
        existing.sources.push(source);
      }
      // Priority order: embedded > saved > builtin > catalog (official / unofficial) > missing
      if (existing.sources.includes('embedded')) existing.primarySource = 'embedded';
      else if (existing.sources.includes('saved')) existing.primarySource = 'saved';
      else if (existing.sources.includes('builtin')) existing.primarySource = 'builtin';
      else if (existing.sources.includes('official')) existing.primarySource = 'official';
      else if (existing.sources.includes('unofficial')) existing.primarySource = 'unofficial';
      else existing.primarySource = 'missing';

      if (lines) {
        existing.kind = kind;
        if (existing.subpartRefCount === 0) {
          existing.subpartRefCount = countSubpartRefs(lines);
        }
        if (existing.subfileRefs.length === 0) {
          existing.subfileRefs = extractDirectSubfileRefs(lines);
        }
      }
      existing.hasExactDat = existing.hasExactDat || hasExactDat;
      existing.inCurrentModel = existing.inCurrentModel || inCurrentModel;
      existing.isMissingInModel = existing.isMissingInModel || isMissingInModel;
    }
  };

  for (const k of embeddedCanonical) {
    const lines = embeddedDatRaw.get(k) || null;
    const title = embeddedDatTitles.get(k) || null;
    let kind = classifyDatEntryKind(k, lines, title);
    // Any embedded `.dat` bundled in a `.io`/`.mpd` archive that is not directly placed
    // in the model (internal subparts, primitives, or unposed assembly templates left behind
    // alongside posed FlexibleBrick copies) is an embedded helper rather than an embedded part.
    if (kind === 'part' && modelPartIds.size > 0 && !modelPartIds.has(k)) {
      kind = 'subpart';
    }
    if (kind === 'part') embeddedParts++;
    else embeddedHelpers++;
    upsert(k, 'embedded', lines, title, kind);
    if (kind !== 'part') {
      const entry = byId.get(normalizeLibraryPartId(k));
      if (entry) entry.embeddedIsHelper = true;
    }
  }

  for (const k of savedCanonical) {
    const lines = userLibRaw.get(k) || null;
    const title = userLibTitles.get(k) || null;
    const kind = classifyDatEntryKind(k, lines, title);
    if (kind === 'part') savedParts++;
    else savedHelpers++;
    upsert(k, 'saved', lines, title, kind);
  }

  const builtInKeys = Object.keys(builtInCatalog);
  for (const k of builtInKeys) {
    upsert(k, 'builtin', null, builtInCatalog[k]?.name ?? null);
  }

  // Bundled Online Parts Catalog (~46k IDs + titles). Catalog-only rows are created directly from the
  // precomputed entry (no per-row name resolution) so rebuilding the index stays fast.
  let catalogOfficialParts = 0;
  let catalogUnofficialParts = 0;
  if (onlineCatalog) {
    for (const [id, entry] of onlineCatalog) {
      if (!entry.helper) {
        if (entry.origin === 'official') catalogOfficialParts++;
        else catalogUnofficialParts++;
      }
      const existing = byId.get(id);
      if (existing) {
        upsert(id, entry.origin, null, null);
        if (!entry.helper && existing.embeddedIsHelper && existing.kind !== 'part') {
          existing.kind = 'part';
        }
        continue;
      }
      byId.set(id, {
        id,
        name: entry.name,
        kind: entry.helper ? 'subpart' : 'part',
        category: entry.category,
        sources: [entry.origin],
        primarySource: entry.origin,
        inCurrentModel: modelPartIds.has(id),
        isMissingInModel: missingShapePartIds.has(id),
        hasExactDat: false,
        subpartRefCount: 0,
        subfileRefs: [],
        searchText: entry.searchText,
      });
    }
  }

  for (const k of modelPartIds) {
    if (!byId.has(k)) {
      upsert(k, null, null, null);
    }
  }

  const items = Array.from(byId.values());

  let builtInParts = 0;
  for (const item of items) {
    if (partColors) {
      const cols = partColors.get(item.id);
      if (cols && cols.length > 0) {
        item.availableColors = cols;
      }
    }
    if (item.kind === 'part' && isBuiltInLibraryItem(item)) {
      builtInParts++;
    }
  }

  return {
    items,
    stats: {
      savedParts,
      savedHelpers,
      savedTotalFiles: savedParts + savedHelpers,
      savedTextures: savedTextureCount,
      embeddedParts,
      embeddedHelpers,
      builtInParts,
      modelUniqueParts: modelPartIds.size,
      modelMissingShapeCount: missingShapePartIds.size,
      modelMissingExactDatCount: missingExactDatPartIds.size,
      catalogOfficialParts,
      catalogUnofficialParts,
    },
  };
}

export interface FilterLibraryOptions {
  query?: string;
  scope?: LibraryScopeFilter;
  category?: LibraryCategory | 'all';
  includeHelpers?: boolean;
  /** When set to an LDraw color ID, only return parts actually produced in that color. */
  availableColorId?: number | null;
  /** Optional explicit set of normalized part/subfile IDs to filter down to (e.g. clicking subfile refs). */
  onlyIds?: ReadonlySet<string> | null;
}

export function filterLibraryItems(
  items: readonly LibraryPartItem[],
  options: FilterLibraryOptions = {},
): LibraryPartItem[] {
  const {
    query = '',
    scope = 'all',
    category = 'all',
    includeHelpers = false,
    availableColorId = null,
    onlyIds = null,
  } = options;

  const filterColor =
    typeof availableColorId === 'number' && Number.isFinite(availableColorId)
      ? availableColorId
      : null;
  const hasOnlyIds = Boolean(onlyIds && onlyIds.size > 0);
  const normQuery = normalizeLibrarySearchText(query);
  const queryTokens = normQuery ? normQuery.split(' ').filter(Boolean) : [];
  const rawQueryLower = query.trim().toLowerCase().replace(/\.dat$/i, '');

  const scored: Array<{ item: LibraryPartItem; score: number }> = [];

  for (const item of items) {
    if (hasOnlyIds && onlyIds) {
      const baseId = item.id.includes('/') ? item.id.slice(item.id.lastIndexOf('/') + 1) : item.id;
      if (!onlyIds.has(item.id) && !onlyIds.has(baseId)) continue;
    } else if (!includeHelpers && item.kind !== 'part') {
      continue;
    }

    if (!hasOnlyIds) {
      if (scope === 'saved' && !item.sources.includes('saved')) continue;
      if (scope === 'embedded') {
        if (!item.sources.includes('embedded')) continue;
        if (!includeHelpers && item.embeddedIsHelper) continue;
      }
      if (scope === 'builtin' && !isBuiltInLibraryItem(item)) continue;
      if (scope === 'official' && !item.sources.includes('official')) continue;
      if (scope === 'unofficial' && !item.sources.includes('unofficial')) continue;
      if (scope === 'model' && !item.inCurrentModel) continue;
      if (scope === 'missing' && !item.isMissingInModel) continue;

      if (category !== 'all' && item.category !== category) continue;
    }

    if (filterColor !== null) {
      if (!item.availableColors || !item.availableColors.includes(filterColor)) continue;
    }

    let score = 0;
    if (queryTokens.length > 0) {
      if (item.searchText === undefined) {
        item.searchText = normalizeLibrarySearchText(`${item.id} ${item.name} ${item.category}`);
      }
      const haystack = item.searchText;
      let allMatch = true;
      for (const tok of queryTokens) {
        if (!haystack.includes(tok)) {
          allMatch = false;
          break;
        }
      }
      if (!allMatch) continue;

      if (item.id === rawQueryLower) score += 1000;
      else if (item.id.startsWith(rawQueryLower)) score += 500;
      else if (normalizeLibrarySearchText(item.name).startsWith(normQuery)) score += 300;
      else score += 100;
    }

    // Prioritize missing / model / saved / embedded / builtin parts naturally
    if (item.isMissingInModel) score += 40;
    if (item.inCurrentModel) score += 25;
    if (item.primarySource === 'embedded' && !item.embeddedIsHelper) score += 15;
    else if (item.sources.includes('saved')) score += 12;
    else if (item.sources.includes('builtin')) score += 6;
    if (item.kind === 'part') score += 10;

    scored.push({ item, score });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.item.id.localeCompare(b.item.id, undefined, { numeric: true });
  });

  return scored.map((entry) => entry.item);
}

export function computeStarterPackProgress(
  pack: StarterPack,
  isPartSaved: (partId: string) => boolean,
): StarterPackProgress {
  const missingIds: string[] = [];
  let savedCount = 0;
  for (const id of pack.partIds) {
    if (isPartSaved(id)) {
      savedCount++;
    } else {
      missingIds.push(id);
    }
  }
  return {
    savedCount,
    totalCount: pack.partIds.length,
    missingIds,
  };
}

export function formatLibraryMenuSummary(stats: LibraryStats): string {
  if (stats.modelMissingShapeCount > 0) {
    return `${stats.modelMissingShapeCount} missing`;
  }
  return '';
}

export function getModelFetchCopy(opts: {
  hasModel: boolean;
  modelTitle?: string | null;
  missingShapeCount: number;
  missingExactDatCount: number;
}): ModelFetchCopy {
  const title = (opts.modelTitle || 'Current Model').trim();

  if (!opts.hasModel) {
    return {
      status: 'no_model',
      heading: 'No Model Loaded',
      description:
        'Load an LDraw (.ldr / .mpd) model to detect and fetch its missing 3D part shapes automatically. Without a model loaded, you can download starter packs, fetch specific part IDs, or import complete.zip below.',
      buttonLabel: 'Load a Model to Check Missing Parts',
      buttonEnabled: false,
    };
  }

  if (opts.missingShapeCount > 0) {
    const fetchCount = Math.max(opts.missingShapeCount, opts.missingExactDatCount);
    const extraUpgrade = Math.max(0, opts.missingExactDatCount - opts.missingShapeCount);
    return {
      status: 'missing_shapes',
      heading: title,
      description:
        `${opts.missingShapeCount} part${opts.missingShapeCount === 1 ? '' : 's'} in this model ${opts.missingShapeCount === 1 ? 'is' : 'are'} missing 3D shapes` +
        (extraUpgrade > 0
          ? ` (${extraUpgrade} more currently use simplified built-in approximations).`
          : '.'),
      buttonLabel: `Fetch ${fetchCount} Missing Model Part${fetchCount === 1 ? '' : 's'} Online`,
      buttonEnabled: true,
    };
  }

  if (opts.missingExactDatCount > 0) {
    return {
      status: 'can_upgrade',
      heading: title,
      description: `All parts have shapes, and ${opts.missingExactDatCount} part${opts.missingExactDatCount === 1 ? '' : 's'} can be upgraded from built-in approximations to exact LDraw 3D geometry.`,
      buttonLabel: `Fetch ${opts.missingExactDatCount} Exact LDraw Shape${opts.missingExactDatCount === 1 ? '' : 's'} for Model`,
      buttonEnabled: true,
    };
  }

  return {
    status: 'complete',
    heading: title,
    description: 'All parts in this model already have exact 3D shapes loaded.',
    buttonLabel: 'All Model Parts Loaded ✓',
    buttonEnabled: false,
  };
}

export type LibraryColorGroup = 'model' | 'solid' | 'transparent' | 'metallic' | 'special';

export interface LibraryColorDefinition {
  name: string;
  hex: string;
  edge?: string;
  alpha?: number;
}

export interface LibraryColorEntry extends LibraryColorDefinition {
  id: number;
  group: LibraryColorGroup;
  countInModel?: number;
  availablePartCount?: number;
}

export interface LibraryColorSection {
  id: LibraryColorGroup;
  label: string;
  colors: LibraryColorEntry[];
}

export function classifyLDrawColorGroup(
  entry: Pick<LibraryColorDefinition, 'name' | 'alpha'>,
): Exclude<LibraryColorGroup, 'model'> {
  if (entry.alpha !== undefined || /\b(?:trans-|glitter|satin)\b/i.test(entry.name)) {
    return 'transparent';
  }
  if (/\b(?:metallic|metal|pearl|chrome|flat silver|flat dark gold|copper|alloy)\b/i.test(entry.name)) {
    return 'metallic';
  }
  if (/\b(?:rubber|glow)\b/i.test(entry.name)) {
    return 'special';
  }
  return 'solid';
}

function hexToHsl(hex: string): { h: number; s: number; l: number; c: number } {
  const clean = String(hex || '#888888').replace(/^#/, '');
  const full =
    clean.length === 3
      ? clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2]
      : clean.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l, c: 0 };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l, c: d };
}

function sortColorsPerceptually(list: LibraryColorEntry[]): LibraryColorEntry[] {
  return [...list].sort((a, b) => {
    const ha = hexToHsl(a.hex);
    const hb = hexToHsl(b.hex);
    const aNeutral = ha.s < 0.12 || ha.c < 0.06;
    const bNeutral = hb.s < 0.12 || hb.c < 0.06;
    if (aNeutral !== bNeutral) return aNeutral ? -1 : 1;
    if (aNeutral && bNeutral) return hb.l - ha.l;
    // Group into 12 smooth hue bands (30 deg each), then sort light -> dark within each band
    const bandA = Math.floor(((ha.h + 15) % 360) / 30);
    const bandB = Math.floor(((hb.h + 15) % 360) / 30);
    if (bandA !== bandB) return bandA - bandB;
    return hb.l - ha.l;
  });
}

/**
 * Sorts a list of LDraw color IDs perceptually (neutrals light -> dark, then hue bands)
 * for scannable swatch strips such as "Available colors" in the Part Preview Inspector.
 */
export function sortLDrawColorIdsPerceptually(
  colorIds: readonly number[],
  colors: Readonly<Record<number, LibraryColorDefinition>>,
): number[] {
  const entries: LibraryColorEntry[] = [];
  for (const id of colorIds) {
    const def = colors[id];
    if (!def || !def.hex) continue;
    entries.push({
      id,
      name: def.name,
      hex: def.hex,
      edge: def.edge,
      alpha: def.alpha,
      group: classifyLDrawColorGroup(def),
    });
  }
  return sortColorsPerceptually(entries).map((e) => e.id);
}

/**
 * Organizes the full LDraw color dictionary into scannable finish sections (plus an optional
 * "In Current Model" section) with instant search by color name or LDraw numeric ID.
 */
export function buildLibraryColorPalette(
  colors: Readonly<Record<number, LibraryColorDefinition>>,
  options: {
    modelColorCounts?: ReadonlyMap<number, number> | null;
    availablePartCounts?: ReadonlyMap<number, number> | null;
    onlyAvailable?: boolean;
    query?: string;
  } = {},
): LibraryColorSection[] {
  const rawQuery = String(options.query || '').trim().toLowerCase();
  const idQuery = rawQuery.replace(/^#/, '');
  const matchesQuery = (id: number, name: string): boolean => {
    if (!rawQuery) return true;
    if (name.toLowerCase().includes(rawQuery)) return true;
    if (idQuery && String(id).includes(idQuery)) return true;
    return false;
  };
  const passesAvailability = (id: number): boolean => {
    if (!options.onlyAvailable || !options.availablePartCounts) return true;
    return (options.availablePartCounts.get(id) ?? 0) > 0;
  };

  const buckets: Record<Exclude<LibraryColorGroup, 'model'>, LibraryColorEntry[]> = {
    solid: [],
    transparent: [],
    metallic: [],
    special: [],
  };

  for (const [rawId, def] of Object.entries(colors)) {
    const id = Number(rawId);
    if (!Number.isFinite(id) || !def || !def.hex) continue;
    if (!passesAvailability(id)) continue;
    if (!matchesQuery(id, def.name)) continue;
    const group = classifyLDrawColorGroup(def);
    buckets[group].push({
      id,
      name: def.name,
      hex: def.hex,
      edge: def.edge,
      alpha: def.alpha,
      group,
      countInModel: options.modelColorCounts?.get(id),
      availablePartCount: options.availablePartCounts?.get(id),
    });
  }

  const sections: LibraryColorSection[] = [];

  if (options.modelColorCounts && options.modelColorCounts.size > 0) {
    const modelEntries: LibraryColorEntry[] = [];
    for (const [id, count] of options.modelColorCounts.entries()) {
      const def = colors[id];
      if (!def || !def.hex) continue;
      if (!passesAvailability(id)) continue;
      if (!matchesQuery(id, def.name)) continue;
      modelEntries.push({
        id,
        name: def.name,
        hex: def.hex,
        edge: def.edge,
        alpha: def.alpha,
        group: 'model',
        countInModel: count,
        availablePartCount: options.availablePartCounts?.get(id),
      });
    }
    modelEntries.sort((a, b) => (b.countInModel ?? 0) - (a.countInModel ?? 0) || a.id - b.id);
    if (modelEntries.length > 0) {
      sections.push({ id: 'model', label: 'In Current Model', colors: modelEntries });
    }
  }

  const orderedGroups: Array<{ id: Exclude<LibraryColorGroup, 'model'>; label: string }> = [
    { id: 'solid', label: 'Solid' },
    { id: 'transparent', label: 'Transparent & Satin' },
    { id: 'metallic', label: 'Metallic, Pearl & Chrome' },
    { id: 'special', label: 'Rubber & Glow' },
  ];

  for (const g of orderedGroups) {
    if (buckets[g.id].length > 0) {
      sections.push({
        id: g.id,
        label: g.label,
        colors: sortColorsPerceptually(buckets[g.id]),
      });
    }
  }

  return sections;
}

export interface ViewportPopoverRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ViewportPopoverBounds {
  width: number;
  height: number;
  offsetLeft?: number;
  offsetTop?: number;
  layoutHeight?: number;
}

export interface ViewportPopoverPlacementOptions {
  preferredWidth?: number;
  maxHeight?: number;
  minComfortableHeight?: number;
  margin?: number;
  gap?: number;
}

export interface ViewportPopoverPlacement {
  left: number;
  width: number;
  top: number | null;
  bottom: number | null;
  maxHeight: number;
  placement: 'below' | 'above' | 'viewport';
}

/**
 * Computes fixed-position coordinates and max-height for a popover anchored to a
 * trigger rect so it never overflows or gets clipped by any viewport edge (desktop,
 * mobile portrait/landscape, or shrunk visualViewport when a virtual keyboard is open).
 */
export function computeViewportPopoverPlacement(
  anchor: ViewportPopoverRect,
  viewport: ViewportPopoverBounds,
  options: ViewportPopoverPlacementOptions = {},
): ViewportPopoverPlacement {
  const margin = Math.max(0, options.margin ?? 12);
  const gap = Math.max(0, options.gap ?? 6);
  const preferredWidth = Math.max(160, options.preferredWidth ?? 336);
  const maxHeightCap = Math.max(120, options.maxHeight ?? 460);
  const minComfortableHeight = Math.max(120, options.minComfortableHeight ?? 260);

  const vpLeft = viewport.offsetLeft ?? 0;
  const vpTop = viewport.offsetTop ?? 0;
  const vpWidth = Math.max(1, viewport.width);
  const vpHeight = Math.max(1, viewport.height);
  const vpRight = vpLeft + vpWidth;
  const vpBottom = vpTop + vpHeight;
  const layoutHeight = Math.max(1, viewport.layoutHeight ?? vpHeight);

  const availableWidth = Math.max(160, vpWidth - margin * 2);
  const width = Math.min(preferredWidth, availableWidth);
  const desiredLeft = anchor.right - width;
  const maxLeft = Math.max(vpLeft + margin, vpRight - margin - width);
  const left = Math.round(Math.max(vpLeft + margin, Math.min(desiredLeft, maxLeft)));

  const spaceBelow = vpBottom - margin - (anchor.bottom + gap);
  const spaceAbove = anchor.top - gap - (vpTop + margin);
  const totalAvailableHeight = Math.max(120, vpHeight - margin * 2);

  if (spaceBelow >= minComfortableHeight) {
    const top = Math.round(Math.max(vpTop + margin, anchor.bottom + gap));
    const maxHeight = Math.round(Math.max(120, Math.min(maxHeightCap, vpBottom - margin - top)));
    return { left, width: Math.round(width), top, bottom: null, maxHeight, placement: 'below' };
  }

  if (spaceAbove >= minComfortableHeight && spaceAbove >= spaceBelow) {
    const anchorBottomEdge = Math.min(vpBottom - margin, anchor.top - gap);
    const maxHeight = Math.round(Math.max(120, Math.min(maxHeightCap, anchorBottomEdge - (vpTop + margin))));
    const bottom = Math.round(Math.max(margin, layoutHeight - anchorBottomEdge));
    return { left, width: Math.round(width), top: null, bottom, maxHeight, placement: 'above' };
  }

  const top = Math.round(vpTop + margin);
  const maxHeight = Math.round(Math.min(maxHeightCap, totalAvailableHeight));
  return { left, width: Math.round(width), top, bottom: null, maxHeight, placement: 'viewport' };
}


