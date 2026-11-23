// Pure-TS LDraw Library Fetcher, Dependency Resolver & MPD/LDR Parser Utilities.
// Provides fast, CORS-safe, HTTP/2-friendly recursive fetching of official LDraw .dat parts,
// subparts, primitives, and !TEXMAP PNG textures with smart mirror failover and clean title parsing.

import { DIRECT_RGB_COLOR_FLAG, normalizeDatRef } from './datCompiler';

export interface LDrawMirrorConfig {
  url: string;
  label: string;
  /** Mirrors sharing the same upstream repository commit share a repoGroup so clean 404s aren't retried redundantly. */
  repoGroup: string;
  /** 'official' = official LDraw complete library; 'unofficial' = LDraw unofficial + BrickLink Studio custom parts. */
  scope?: 'official' | 'unofficial' | 'custom';
}

export const PUBLIC_LDRAW_MIRRORS: readonly LDrawMirrorConfig[] = [
  {
    url: 'https://raw.githubusercontent.com/kulits/ldraw-parts/master/ldraw/',
    label: 'Official LDraw Library (Daily Sync · GitHub)',
    repoGroup: 'kulits',
    scope: 'official',
  },
  {
    url: 'https://mrubens.github.io/ldraw-library/',
    label: 'Official LDraw Library (GitHub Pages Mirror)',
    repoGroup: 'mrubens',
    scope: 'official',
  },
  {
    url: 'https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/',
    label: 'Classic LDraw Parts Mirror (GitHub)',
    repoGroup: 'gkjohnson',
    scope: 'official',
  },
  {
    url: 'https://cdn.jsdelivr.net/gh/kulits/ldraw-parts@master/ldraw/',
    label: 'Official LDraw Library (jsDelivr CDN)',
    repoGroup: 'kulits',
    scope: 'official',
  },
  {
    url: 'https://raw.githubusercontent.com/iefierros/LegoMaster/main/ldraw/UnOfficial/',
    label: 'LDraw Unofficial & Studio Parts Mirror (GitHub)',
    repoGroup: 'iefierros-unofficial',
    scope: 'unofficial',
  },
];

export const PUBLIC_LDRAW_MIRROR_URLS: readonly string[] = PUBLIC_LDRAW_MIRRORS.map((m) => m.url);

/**
 * Primitives synthesized directly in `datCompiler.ts` before `lookupSubfile` is called.
 * Skipping network requests for these eliminates hundreds of redundant fetches per model.
 */
const SYNTHESIZED_PRIMITIVE_BASE_RE =
  /^(?:stud|stud2|stud2a|stud3|stud3a|stud4|stud4a|studp01|rect|rect2p|\d+-\d+(?:cyli|cylo|cylc|disc|edge|ring\d+|rin\d+|chrd|ndis))$/;

/**
 * Primitive naming patterns that live under `p/` rather than `parts/`.
 * Trying `p/` first avoids wasted 404 round-trips to `parts/`.
 */
const PRIMITIVE_FIRST_RE =
  /^(?:box|rect|tri|quad|edge|cyl|con|disc|ndis|chrd|ring|rin|stud|stug|axle|peg|conn|clip|bush|hinge|beam|npeg|t\d{2}[oiq]\d{4}|\d+-\d+[a-z])/;

/** Standard numeric LDraw part IDs (3+ digits, e.g. 3029, 27448, 86210, 3069b, 3626cp01). */
const STANDARD_NUMERIC_PART_RE = /^\d{3,}[a-z0-9_-]*$/;

/** BrickLink Studio custom / assembly part IDs (e.g. bl_76925, bb892c01, 1234-bl) hosted in UnOfficial libraries. */
const STUDIO_CUSTOM_PART_RE = /^(?:bl_|.*-bl$|bb\d+)/i;

export function isStudioCustomPartId(cleanKey: string): boolean {
  const clean = normalizeDatRef(cleanKey);
  return Boolean(clean && !clean.includes('/') && STUDIO_CUSTOM_PART_RE.test(clean));
}

export function isSynthesizedPrimitiveBase(base: string): boolean {
  return SYNTHESIZED_PRIMITIVE_BASE_RE.test(base);
}

/**
 * Normalizes an MPD `0 FILE` or type-1 submodel reference key so backslash vs forward-slash
 * differences, leading `./`, and casing mismatches never break submodel resolution.
 */
export function normalizeMpdSubfileKey(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .toLowerCase();
}

/**
 * Returns true if the given lines contain at least one LDraw placement or geometry statement
 * (type 1, 11, 2, 3, 4, or 5). Used to ensure comment-only preambles before the first `0 FILE`
 * header are never mistaken for the root model.
 */
export function hasMpdGeometryOrPartLines(lines: readonly string[]): boolean {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^(?:1|11|2|3|4|5)\s+/.test(l)) return true;
  }
  return false;
}

/**
 * Distinguishes embedded LDraw part/subpart/primitive/shortcut definitions from model/submodel files.
 * Crucially, `0 !LDRAW_ORG Model` and `0 !LDRAW_ORG Unofficial_Model` are models (submodels), NOT parts!
 */
export function isLDrawPartSubfile(name: string, lines: readonly string[]): boolean {
  if (String(name || '').trim().toLowerCase().endsWith('.dat')) return true;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/^[234]\s+/.test(l)) return true;
    if (/^0\s+(?:PE_TEX_INFO|PE_TEX_PATH|!TEXMAP)\b/i.test(l)) return true;
    if (/^0\s+!LDRAW_ORG\s+(?:Unofficial_)?(?:Part|Subpart|Primitive|48_Primitive|8_Primitive|Shortcut)\b/i.test(l)) {
      return true;
    }
  }
  return false;
}

/**
 * Parses an LDraw type-1 color token, supporting standard integer LDraw color IDs,
 * color 16 / negative inheritance, and direct RGB hex colors (`0x2RRGGBB`).
 */
export function parseLDrawColorToken(rawToken: string, parentColor: number): number {
  const tok = String(rawToken || '').trim();
  if (/^0x2[0-9a-f]{6}$/i.test(tok)) {
    const rgb = parseInt(tok.slice(3), 16);
    if (Number.isFinite(rgb)) return DIRECT_RGB_COLOR_FLAG | (rgb & 0xffffff);
  }
  const c = parseInt(tok, 10);
  if (!Number.isFinite(c) || c === 16 || c < 0) return parentColor;
  return c;
}

/**
 * Detects an LDraw `0 ~Moved to <target>` redirect header and returns the normalized target ID.
 */
export function extractMovedToTarget(lines: readonly string[]): string | null {
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const l = lines[i].trim();
    const m = l.match(/^0\s+~?Moved\s+to\s+([^\s]+)$/i);
    if (m && m[1]) {
      const target = normalizeDatRef(m[1]);
      if (target) return target;
    }
  }
  return null;
}

/**
 * Extracts a clean, human-readable part description from LDraw `.dat` header lines,
 * stripping leading `=` / `~` markers and collapsing repeated internal whitespace.
 * Returns `null` for `~Moved to ...` redirect stubs so callers resolve the target part's title.
 */
export function extractCleanDatTitle(lines: readonly string[]): string | null {
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const l = lines[i].trim();
    if (!l.startsWith('0 ')) continue;
    if (/^0\s+(?:FILE|Name:|Author:|IsSubModel|BL_|Flexible|Render|IsAssembly|!|BFC|PE_TEX_|\/\/)/i.test(l)) {
      continue;
    }
    const raw = l.replace(/^0\s+/, '').trim();
    if (!raw || /^~?Moved\s+to\s+/i.test(raw)) return null;
    const cleaned = raw.replace(/^[=~]+/, '').replace(/\s{2,}/g, ' ').trim();
    return cleaned.length > 0 ? cleaned : null;
  }
  return null;
}

/**
 * Returns the ordered relative candidate paths to probe on an LDraw library mirror for `cleanKey`.
 */
export function buildLDrawCandidatePaths(cleanKey: string): string[] {
  const clean = normalizeDatRef(cleanKey);
  if (!clean) return [];
  if (clean.startsWith('s/')) {
    return [`parts/${clean}.dat`];
  }
  if (clean.startsWith('48/') || clean.startsWith('8/')) {
    return [`p/${clean}.dat`];
  }
  if (isStudioCustomPartId(clean)) {
    return [`parts/${clean}.dat`];
  }
  if (PRIMITIVE_FIRST_RE.test(clean)) {
    return [`p/${clean}.dat`, `parts/${clean}.dat`];
  }
  if (STANDARD_NUMERIC_PART_RE.test(clean)) {
    return [`parts/${clean}.dat`];
  }
  return [`parts/${clean}.dat`, `p/${clean}.dat`, `parts/s/${clean}.dat`];
}

export interface ExtractedDatDependencies {
  subfiles: string[];
  textures: string[];
}

/**
 * Extracts nested subfile/primitive references (including `0 !: 1 ...` lines inside `!TEXMAP` blocks)
 * and external `!TEXMAP` texture filenames from raw `.dat` text.
 */
export function extractDatDependencies(datText: string): ExtractedDatDependencies {
  const subfileSet = new Set<string>();
  const textureSet = new Set<string>();

  for (const rawLine of datText.split(/\r?\n/)) {
    let tr = rawLine.trim();
    if (!tr) continue;

    if (tr.startsWith('0 ')) {
      // Unwrap `!TEXMAP` geometry lines (`0 !: 1 16 ...`)
      if (/^0\s+!:\s+1\s/.test(tr)) {
        tr = tr.replace(/^0\s+!:\s+/, '');
      } else if (/^0\s+!TEXMAP\s+(?:START|NEXT)\s+/i.test(tr)) {
        const mTex = tr.match(
          /^0\s+!TEXMAP\s+(?:START|NEXT)\s+(PLANAR|CYLINDRICAL|SPHERICAL)\s+(.+)$/i,
        );
        if (mTex) {
          const method = mTex[1].toUpperCase();
          const paramCount = method === 'PLANAR' ? 9 : method === 'CYLINDRICAL' ? 10 : 11;
          const rest = mTex[2].trim().split(/\s+/);
          if (rest.length > paramCount) {
            let texName = rest[paramCount];
            if (texName.startsWith('"')) {
              const qm = rest.slice(paramCount).join(' ').match(/^"([^"]+)"/);
              if (qm) texName = qm[1];
            }
            texName = texName.replace(/^["']|["']$/g, '').trim();
            if (/\.(?:png|jpg|jpeg|webp)$/i.test(texName)) {
              textureSet.add(texName);
            }
          }
        }
        continue;
      } else {
        continue;
      }
    }

    if (/^1\s/.test(tr)) {
      const toks = tr.split(/\s+/);
      if (toks.length >= 15) {
        const ref = normalizeDatRef(toks.slice(14).join(' '));
        const base = ref.split('/').pop() || '';
        if (ref && !isSynthesizedPrimitiveBase(base)) {
          subfileSet.add(ref);
        }
      }
    }
  }

  return {
    subfiles: Array.from(subfileSet),
    textures: Array.from(textureSet),
  };
}

export function buildMirrorConfigList(selectedBaseUrl?: string, customBaseUrl?: string): LDrawMirrorConfig[] {
  const out: LDrawMirrorConfig[] = [];
  const seen = new Set<string>();
  const pushUrl = (rawUrl: string) => {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) return;
    const url = trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
    if (seen.has(url)) return;
    seen.add(url);
    const known = PUBLIC_LDRAW_MIRRORS.find((m) => m.url === url);
    out.push(known ?? { url, label: 'Custom LDraw Mirror', repoGroup: `custom:${url}`, scope: 'custom' });
  };

  if (selectedBaseUrl === 'custom') {
    if (customBaseUrl) pushUrl(customBaseUrl);
  } else if (selectedBaseUrl) {
    pushUrl(selectedBaseUrl);
  }
  for (const m of PUBLIC_LDRAW_MIRRORS) pushUrl(m.url);
  return out;
}

export interface FetchDatResult {
  text: string | null;
  resolvedKey: string;
  networkBlocked: boolean;
  notFound: boolean;
}

async function fetchWithTimeout(
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<Response> {
  if (externalSignal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  if (typeof AbortController === 'undefined') {
    return fetchImpl(url, { mode: 'cors' });
  }
  const ctrl = new AbortController();
  const onExtAbort = () => ctrl.abort();
  externalSignal?.addEventListener('abort', onExtAbort, { once: true });
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { mode: 'cors', signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener('abort', onExtAbort);
  }
}

/**
 * Fetches a single `.dat` file (or one of its fallback base IDs) from the configured mirror chain.
 * - Clean HTTP 404 skips duplicate mirrors belonging to the same `repoGroup`.
 * - Non-404 errors (403, 429, 5xx, timeouts, network errors) transparently fail over to the next mirror.
 */
export async function fetchDatFromMirrors(
  normKey: string,
  mirrors: readonly LDrawMirrorConfig[],
  getFallbacks: (key: string) => string[],
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 8000,
  signal?: AbortSignal,
): Promise<FetchDatResult> {
  const tryKeys = [normKey, ...getFallbacks(normKey)];
  let sawNetworkError = false;
  let sawAnyHttpResponse = false;
  const hasScopedUnofficial = mirrors.some((m) => m.scope === 'unofficial' || m.scope === 'custom');

  for (const key of tryKeys) {
    if (signal?.aborted) break;
    const clean = normalizeDatRef(key);
    const paths = buildLDrawCandidatePaths(clean);
    if (paths.length === 0) continue;

    // Studio custom IDs (bl_*, *-bl, bb####) only live in UnOfficial / custom mirrors —
    // probe those directly without wasting 404s against official LDraw mirrors!
    const keyMirrors =
      isStudioCustomPartId(clean) && hasScopedUnofficial
        ? mirrors.filter((m) => m.scope === 'unofficial' || m.scope === 'custom')
        : mirrors;

    for (const rel of paths) {
      if (signal?.aborted) break;
      const confirmed404Groups = new Set<string>();
      for (const mirror of keyMirrors) {
        if (signal?.aborted) break;
        if (confirmed404Groups.has(mirror.repoGroup)) continue;
        try {
          const res = await fetchWithTimeout(mirror.url + rel, fetchImpl, timeoutMs, signal);
          sawAnyHttpResponse = true;
          if (res.ok) {
            const text = await res.text();
            if (text && text.length > 10 && !/^\s*(?:<!doctype|<html\b)/i.test(text)) {
              return { text, resolvedKey: clean, networkBlocked: false, notFound: false };
            }
          } else if (res.status === 404) {
            confirmed404Groups.add(mirror.repoGroup);
          }
          // For 403/429/5xx, do NOT mark repoGroup as 404 — try next mirror!
        } catch (err: unknown) {
          if (signal?.aborted) {
            return { text: null, resolvedKey: normKey, networkBlocked: false, notFound: false };
          }
          void err;
          sawNetworkError = true;
        }
      }
    }
  }

  return {
    text: null,
    resolvedKey: normKey,
    networkBlocked: sawNetworkError && !sawAnyHttpResponse,
    notFound: sawAnyHttpResponse,
  };
}

function uint8ToBase64(u8: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/**
 * Fetches an external LDraw `!TEXMAP` texture PNG from `parts/textures/<name>` and returns base64.
 */
export async function fetchTextureFromMirrors(
  texName: string,
  mirrors: readonly LDrawMirrorConfig[],
  fetchImpl: typeof fetch = fetch,
  timeoutMs = 8000,
  signal?: AbortSignal,
): Promise<string | null> {
  const clean = String(texName || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^ldraw\//i, '')
    .replace(/^parts\//i, '')
    .replace(/^textures\//i, '');
  if (!clean) return null;

  const paths = [`parts/textures/${clean}`, `textures/${clean}`];
  for (const rel of paths) {
    const confirmed404Groups = new Set<string>();
    for (const mirror of mirrors) {
      if (signal?.aborted) return null;
      if (confirmed404Groups.has(mirror.repoGroup)) continue;
      try {
        const res = await fetchWithTimeout(mirror.url + rel, fetchImpl, timeoutMs, signal);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          if (ab.byteLength > 24) {
            return uint8ToBase64(new Uint8Array(ab));
          }
        } else if (res.status === 404) {
          confirmed404Groups.add(mirror.repoGroup);
        }
      } catch {
        if (signal?.aborted) return null;
      }
    }
  }
  return null;
}

export interface FetchGraphOptions {
  rootPartIds: readonly string[];
  mirrors: readonly LDrawMirrorConfig[];
  /** Checks whether `normKey` has an EXACT `.dat` already loaded (NOT a stripped fallback!). */
  getDirectLoadedLines: (normKey: string) => readonly string[] | null;
  getFallbacks: (normKey: string) => string[];
  hasTexture?: (texName: string) => boolean;
  notFoundCache?: Set<string>;
  onDatLoaded: (storeKey: string, requestedKey: string, text: string) => void;
  onTextureLoaded?: (texName: string, base64: string) => void;
  onBatchComplete?: (
    datBatch: Array<[string, string]>,
    texBatch: Array<[string, string]>,
  ) => Promise<void> | void;
  onProgress?: (stats: { fetched: number; processed: number; total: number; aborted: boolean }) => void;
  concurrency?: number;
  maxQueue?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export interface FetchGraphResult {
  fetched: number;
  texturesFetched: number;
  processed: number;
  networkBlocked: boolean;
  aborted: boolean;
  alreadyComplete: boolean;
}

/**
 * High-concurrency bounded BFS fetcher for LDraw `.dat` parts, nested subparts/primitives,
 * and referenced `!TEXMAP` PNG textures.
 */
export async function fetchLDrawDependencyGraph(
  options: FetchGraphOptions,
): Promise<FetchGraphResult> {
  const {
    rootPartIds,
    mirrors,
    getDirectLoadedLines,
    getFallbacks,
    hasTexture,
    notFoundCache,
    onDatLoaded,
    onTextureLoaded,
    onBatchComplete,
    onProgress,
    concurrency = 16,
    maxQueue = 2500,
    timeoutMs = 8000,
    signal,
    fetchImpl = fetch,
  } = options;

  const queue: string[] = [];
  const queued = new Set<string>();
  const visitedLoaded = new Set<string>();
  const textureQueue: string[] = [];
  const queuedTextures = new Set<string>();

  const enqueueTexture = (texName: string) => {
    const clean = texName.trim();
    const norm = clean.toLowerCase();
    if (!clean || queuedTextures.has(norm) || hasTexture?.(clean)) return;
    if (notFoundCache?.has(`__tex__:${norm}`)) return;
    queuedTextures.add(norm);
    textureQueue.push(clean);
  };

  const enqueue = (rawId: string) => {
    const k = normalizeDatRef(rawId);
    const base = k.split('/').pop() || '';
    if (!k || queued.has(k)) return;
    if (isSynthesizedPrimitiveBase(base)) return;

    // If this exact .dat is already loaded, still walk its nested dependencies so partial caches
    // or shortcuts always download any missing subparts/primitives/textures!
    const existingLines = getDirectLoadedLines(k);
    if (existingLines) {
      if (!visitedLoaded.has(k)) {
        visitedLoaded.add(k);
        const deps = extractDatDependencies(existingLines.join('\n'));
        for (const sub of deps.subfiles) enqueue(sub);
        for (const tex of deps.textures) enqueueTexture(tex);
      }
      return;
    }

    // BrickLink-proprietary printed/decorated IDs (*pb####* with 3+ digits, *_torso) never exist
    // verbatim in public LDraw mirrors — enqueue their canonical unprinted base LDraw ID directly,
    // while keeping unprinted Studio custom shapes (bl_76925, bb892c01) and 1-2 digit official LDraw
    // pattern codes (3626cpb6, 3626cp01) eligible for direct fetch from UnOfficial / Official mirrors!
    if (!k.includes('/') && /(?:(?:pb|ps|pat|pr)\d{3,}|_torso$)/i.test(k)) {
      const fbs = getFallbacks(k);
      if (fbs.length > 0) {
        enqueue(fbs[0]);
        return;
      }
    }

    if (notFoundCache?.has(k)) return;

    queued.add(k);
    queue.push(k);
  };

  for (const id of rootPartIds) enqueue(id);

  if (queue.length === 0 && textureQueue.length === 0) {
    return {
      fetched: 0,
      texturesFetched: 0,
      processed: 0,
      networkBlocked: false,
      aborted: false,
      alreadyComplete: true,
    };
  }

  let fetched = 0;
  let texturesFetched = 0;
  let processed = 0;
  let blocked = 0;

  while (processed < queue.length && processed < maxQueue) {
    if (signal?.aborted) {
      onProgress?.({ fetched, processed, total: queue.length, aborted: true });
      return { fetched, texturesFetched, processed, networkBlocked: false, aborted: true, alreadyComplete: false };
    }

    const batchSize = Math.min(concurrency, queue.length - processed, maxQueue - processed);
    const batch = queue.slice(processed, processed + batchSize);
    processed += batch.length;

    const results = await Promise.all(
      batch.map(async (k) => {
        const res = await fetchDatFromMirrors(k, mirrors, getFallbacks, fetchImpl, timeoutMs, signal);
        return { k, ...res };
      }),
    );

    const datBatch: Array<[string, string]> = [];
    for (const r of results) {
      if (r.text) {
        const storeKey = r.resolvedKey || r.k;
        onDatLoaded(storeKey, r.k, r.text);
        datBatch.push([storeKey, r.text]);
        fetched++;
        const deps = extractDatDependencies(r.text);
        for (const sub of deps.subfiles) enqueue(sub);
        for (const tex of deps.textures) enqueueTexture(tex);
      } else if (r.notFound) {
        notFoundCache?.add(r.k);
      } else if (r.networkBlocked) {
        blocked++;
      }
    }

    if (datBatch.length > 0 && onBatchComplete) {
      await onBatchComplete(datBatch, []);
    }

    // If the entire initial batch failed due to network/CSP blocking, abort early!
    if (processed <= concurrency && fetched === 0 && blocked === batch.length) {
      return {
        fetched: 0,
        texturesFetched: 0,
        processed,
        networkBlocked: true,
        aborted: false,
        alreadyComplete: false,
      };
    }

    onProgress?.({
      fetched,
      processed,
      total: queue.length + textureQueue.length,
      aborted: false,
    });
  }

  // Fetch any external !TEXMAP PNG textures referenced by the downloaded .dat files
  let texIdx = 0;
  while (texIdx < textureQueue.length && !signal?.aborted) {
    const batch = textureQueue.slice(texIdx, texIdx + Math.min(8, concurrency));
    texIdx += batch.length;
    const results = await Promise.all(
      batch.map(async (texName) => {
        const base64 = await fetchTextureFromMirrors(texName, mirrors, fetchImpl, timeoutMs, signal);
        return { texName, base64 };
      }),
    );
    const texBatch: Array<[string, string]> = [];
    for (const r of results) {
      if (r.base64) {
        onTextureLoaded?.(r.texName, r.base64);
        texBatch.push([r.texName, r.base64]);
        texturesFetched++;
      } else {
        notFoundCache?.add(`__tex__:${r.texName.toLowerCase()}`);
      }
    }
    if (texBatch.length > 0 && onBatchComplete) {
      await onBatchComplete([], texBatch);
    }
  }

  return {
    fetched,
    texturesFetched,
    processed,
    networkBlocked: false,
    aborted: Boolean(signal?.aborted),
    alreadyComplete: false,
  };
}
