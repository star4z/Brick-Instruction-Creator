// On-site 3D LDraw part geometry loader (v1 gzipped JSON chunks + v2 HTTP Range-indexed packs).
//
// Format v2 (preferred):
// - `manifest.json`: small JSON describing `coreBundle`, `index`, and flat pack files (`p00.bin`…)
// - `index.bin`: gzipped parallel-array index `{ keys, p, o, l }` mapping each normalized `.dat` key
//   to either the core primitives bundle (`p = -1`) or `[packIndex, byteOffset, byteLength]`
// - `core.bin`: single gzipped JSON dictionary of shared LDraw primitives (`p/`, `48/`, `8/`)
// - `pNN.bin`: flat binary packs (< 50 MB each, well under the 100 MB Neocities Supporter cap)
//   containing individually gzipped `.dat` entries fetched via HTTP `Range: bytes=start-end`
//
// Format v1 (legacy fallback):
// - `manifest.json` with lexicographically sorted `chunks[]` (`cNNN.bin` gzipped JSON dicts).

import { normalizeDatRef } from './datCompiler';

export interface PartsChunkRange {
  /** Relative filename inside `parts-chunks/` (e.g. `c000.bin`). */
  file: string;
  /** Lexicographically smallest normalized key in this chunk. */
  first: string;
  /** Lexicographically largest normalized key in this chunk. */
  last: string;
  /** Number of `.dat` entries packed into this chunk. */
  count: number;
  /** Compressed byte size of the chunk file. */
  bytes: number;
}

export interface PartsPackInfo {
  /** Relative filename inside `parts-chunks/` (e.g. `p00.bin`). */
  file: string;
  /** Number of `.dat` entries stored in this pack. */
  count: number;
  /** Total byte size of this pack file. */
  bytes: number;
}

export interface PartsCoreBundleInfo {
  /** Relative filename inside `parts-chunks/` (e.g. `core.bin`). */
  file: string;
  /** Number of primitive `.dat` entries packed into the core bundle. */
  count: number;
  /** Compressed byte size of the core bundle. */
  bytes: number;
}

export interface PartsPackIndexInfo {
  /** Relative filename inside `parts-chunks/` (e.g. `index.bin`). */
  file: string;
  /** Compressed byte size of the index file. */
  bytes: number;
}

export interface PartsPackIndex {
  /** Lexicographically sorted normalized `.dat` keys (JS code-unit order). */
  keys: string[];
  /** Pack index per key (`-1` means entry lives in `coreBundle`). */
  p: number[];
  /** Byte offset within the pack file (`0` for core bundle entries). */
  o: number[];
  /** Compressed byte length within the pack file (`0` for core bundle entries). */
  l: number[];
}

export interface PartsChunksManifest {
  version: number;
  partCount: number;
  officialCount: number;
  unofficialCount: number;
  /** v1 chunk list (present when `version === 1`). */
  chunks?: PartsChunkRange[];
  /** v2 optional core primitives bundle (`p/`, `48/`, `8/`). */
  coreBundle?: PartsCoreBundleInfo;
  /** v2 compact sorted index file. */
  index?: PartsPackIndexInfo;
  /** v2 flat binary pack files queried via HTTP Range requests. */
  packs?: PartsPackInfo[];
}

export interface OnSitePartsChunkLoader {
  /** Loads `manifest.json` once (cached); returns null if on-site chunks are not present. */
  getManifest: () => Promise<PartsChunksManifest | null>;
  /** Resolves a normalized `.dat` key from on-site packs/chunks, or null if absent/unavailable. */
  resolveDat: (normKey: string, signal?: AbortSignal) => Promise<string | null>;
  /** Clears in-memory caches (useful for tests). */
  clearCache: () => void;
}

/**
 * Binary-searches sorted `[first, last]` v1 chunk ranges to locate the chunk that may contain `normKey`.
 */
export function findChunkForPartKey(
  manifest: PartsChunksManifest,
  normKey: string,
): PartsChunkRange | null {
  const key = normalizeDatRef(normKey);
  const chunks = manifest?.chunks;
  if (!key || !chunks?.length) return null;
  let lo = 0;
  let hi = chunks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const chunk = chunks[mid];
    if (key < chunk.first) {
      hi = mid - 1;
    } else if (key > chunk.last) {
      lo = mid + 1;
    } else {
      return chunk;
    }
  }
  return null;
}

/**
 * Binary-searches a sorted v2 `PartsPackIndex` for `normKey`.
 */
export function findIndexEntry(
  index: PartsPackIndex,
  normKey: string,
): { packIndex: number; offset: number; length: number } | null {
  const key = normalizeDatRef(normKey);
  const keys = index?.keys;
  if (!key || !keys?.length) return null;
  let lo = 0;
  let hi = keys.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const midKey = keys[mid];
    if (key < midKey) {
      hi = mid - 1;
    } else if (key > midKey) {
      lo = mid + 1;
    } else {
      return {
        packIndex: index.p[mid],
        offset: index.o[mid],
        length: index.l[mid],
      };
    }
  }
  return null;
}

/**
 * Decompresses a gzip-encoded `ArrayBuffer` into UTF-8 text using the standard Web Streams
 * `DecompressionStream('gzip')` API (supported in Chrome 80+, Safari 16.4+, Firefox 113+, Node 18+).
 */
export async function decompressGzipToText(buffer: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('DecompressionStream is not available in this environment');
  }
  const ds = new DecompressionStream('gzip');
  const stream = new Blob([buffer]).stream().pipeThrough(ds);
  return await new Response(stream).text();
}

export interface CreateOnSitePartsChunkLoaderOptions {
  /** Base path for chunks/packs (defaults to `./parts-chunks/`). */
  baseUrl?: string;
  /** Maximum number of decompressed v1 chunk dictionaries to keep in memory. */
  maxCachedChunks?: number;
  /** Maximum number of individual v2 `.dat` entries to keep in the in-memory LRU cache. */
  maxCachedEntries?: number;
  /** Injectable fetch implementation for testing. */
  fetchImpl?: typeof fetch;
  /** Injectable decompressor for testing. */
  decompressImpl?: (buffer: ArrayBuffer) => Promise<string>;
}

export function createOnSitePartsChunkLoader(
  options: CreateOnSitePartsChunkLoaderOptions = {},
): OnSitePartsChunkLoader {
  const baseUrl = (options.baseUrl ?? './parts-chunks/').replace(/\/?$/, '/');
  const maxCachedChunks = Math.max(2, options.maxCachedChunks ?? 24);
  const maxCachedEntries = Math.max(64, options.maxCachedEntries ?? 2048);
  const fetchImpl = options.fetchImpl ?? fetch;
  const decompressImpl = options.decompressImpl ?? decompressGzipToText;

  let manifestPromise: Promise<PartsChunksManifest | null> | null = null;
  let indexPromise: Promise<PartsPackIndex | null> | null = null;
  let coreBundlePromise: Promise<Record<string, string> | null> | null = null;

  // v1 caches
  const chunkCache = new Map<string, Record<string, string>>();
  const chunkInFlight = new Map<string, Promise<Record<string, string> | null>>();

  // v2 caches
  const entryCache = new Map<string, string>();
  const entryInFlight = new Map<string, Promise<string | null>>();

  const decodeMaybeGzipText = async (buf: ArrayBuffer): Promise<string> => {
    const bytes = new Uint8Array(buf);
    if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
      return await decompressImpl(buf);
    }
    return new TextDecoder().decode(bytes);
  };

  const getManifest = (): Promise<PartsChunksManifest | null> => {
    if (manifestPromise) return manifestPromise;
    const p = (async (): Promise<PartsChunksManifest | null> => {
      try {
        const res = await fetchImpl(`${baseUrl}manifest.json`, { cache: 'default' });
        if (!res.ok) return null;
        const json = (await res.json()) as Partial<PartsChunksManifest>;
        if (!json || typeof json !== 'object') return null;

        const version = Number(json.version) || 1;
        const isV2 =
          version >= 2 &&
          Boolean(json.index?.file) &&
          Array.isArray(json.packs) &&
          json.packs.length > 0;
        const isV1 = Array.isArray(json.chunks) && json.chunks.length > 0;
        if (!isV2 && !isV1) return null;

        return {
          version: isV2 ? version : 1,
          partCount: Number(json.partCount) || 0,
          officialCount: Number(json.officialCount) || 0,
          unofficialCount: Number(json.unofficialCount) || 0,
          ...(isV1 ? { chunks: json.chunks } : {}),
          ...(isV2 ? { index: json.index, packs: json.packs, coreBundle: json.coreBundle } : {}),
        };
      } catch {
        return null;
      }
    })();
    manifestPromise = p.then((res) => {
      if (!res) manifestPromise = null;
      return res;
    });
    return manifestPromise;
  };

  const raceWithSignal = <T>(promise: Promise<T>, signal?: AbortSignal): Promise<T | null> => {
    if (!signal) return promise;
    if (signal.aborted) return Promise.resolve(null);
    return new Promise<T | null>((resolve) => {
      const onAbort = () => resolve(null);
      signal.addEventListener('abort', onAbort, { once: true });
      promise.then(
        (val) => {
          signal.removeEventListener('abort', onAbort);
          resolve(signal.aborted ? null : val);
        },
        () => {
          signal.removeEventListener('abort', onAbort);
          resolve(null);
        },
      );
    });
  };

  const loadIndex = (
    manifest: PartsChunksManifest,
    signal?: AbortSignal,
  ): Promise<PartsPackIndex | null> => {
    if (!manifest.index?.file) return Promise.resolve(null);
    if (!indexPromise) {
      const idxFile = manifest.index.file;
      const p = (async (): Promise<PartsPackIndex | null> => {
        try {
          const res = await fetchImpl(`${baseUrl}${idxFile}`, { cache: 'default' });
          if (!res.ok) return null;
          const text = await decodeMaybeGzipText(await res.arrayBuffer());
          const parsed = JSON.parse(text) as Partial<PartsPackIndex>;
          if (
            !parsed ||
            !Array.isArray(parsed.keys) ||
            !Array.isArray(parsed.p) ||
            !Array.isArray(parsed.o) ||
            !Array.isArray(parsed.l) ||
            parsed.keys.length !== parsed.p.length
          ) {
            return null;
          }
          return parsed as PartsPackIndex;
        } catch {
          return null;
        }
      })();
      indexPromise = p.then((res) => {
        if (!res) indexPromise = null;
        return res;
      });
    }
    return raceWithSignal(indexPromise, signal);
  };

  const loadCoreBundle = (
    manifest: PartsChunksManifest,
    signal?: AbortSignal,
  ): Promise<Record<string, string> | null> => {
    if (!manifest.coreBundle?.file) return Promise.resolve(null);
    if (!coreBundlePromise) {
      const coreFile = manifest.coreBundle.file;
      const p = (async (): Promise<Record<string, string> | null> => {
        try {
          const res = await fetchImpl(`${baseUrl}${coreFile}`, { cache: 'default' });
          if (!res.ok) return null;
          const text = await decodeMaybeGzipText(await res.arrayBuffer());
          const parsed = JSON.parse(text) as Record<string, string>;
          return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
          return null;
        }
      })();
      coreBundlePromise = p.then((res) => {
        if (!res) coreBundlePromise = null;
        return res;
      });
    }
    return raceWithSignal(coreBundlePromise, signal);
  };

  const cacheEntry = (key: string, text: string) => {
    entryCache.set(key, text);
    while (entryCache.size > maxCachedEntries) {
      const oldest = entryCache.keys().next().value;
      if (oldest !== undefined) entryCache.delete(oldest);
      else break;
    }
  };

  const fetchPackEntry = (
    key: string,
    packFile: string,
    offset: number,
    length: number,
    signal?: AbortSignal,
  ): Promise<string | null> => {
    if (signal?.aborted) return Promise.resolve(null);
    const cached = entryCache.get(key);
    if (cached !== undefined) {
      entryCache.delete(key);
      entryCache.set(key, cached);
      return Promise.resolve(cached);
    }

    const existing = entryInFlight.get(key);
    if (existing) return raceWithSignal(existing, signal);

    const promise = (async (): Promise<string | null> => {
      try {
        const end = offset + length - 1;
        const res = await fetchImpl(`${baseUrl}${packFile}`, {
          cache: 'default',
          headers: { Range: `bytes=${offset}-${end}` },
        });
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        let sliceBuf = buf;
        // Fallback when a static server/proxy ignores the Range header and returns 200 OK with the full pack
        if (res.status === 200 && buf.byteLength > length && offset + length <= buf.byteLength) {
          sliceBuf = buf.slice(offset, offset + length);
        } else if (buf.byteLength < length) {
          return null;
        }
        const text = await decodeMaybeGzipText(sliceBuf);
        cacheEntry(key, text);
        return text;
      } catch {
        return null;
      } finally {
        entryInFlight.delete(key);
      }
    })();

    entryInFlight.set(key, promise);
    return raceWithSignal(promise, signal);
  };

  const loadChunk = async (
    file: string,
    signal?: AbortSignal,
  ): Promise<Record<string, string> | null> => {
    if (signal?.aborted) return null;
    const cached = chunkCache.get(file);
    if (cached) {
      // Refresh LRU position
      chunkCache.delete(file);
      chunkCache.set(file, cached);
      return cached;
    }

    const existing = chunkInFlight.get(file);
    if (existing) return raceWithSignal(existing, signal);

    const promise = (async (): Promise<Record<string, string> | null> => {
      try {
        const res = await fetchImpl(`${baseUrl}${file}`, { cache: 'default' });
        if (!res.ok) return null;
        const text = await decodeMaybeGzipText(await res.arrayBuffer());
        const parsed = JSON.parse(text) as Record<string, string>;
        if (!parsed || typeof parsed !== 'object') return null;

        chunkCache.set(file, parsed);
        while (chunkCache.size > maxCachedChunks) {
          const oldest = chunkCache.keys().next().value;
          if (oldest !== undefined) chunkCache.delete(oldest);
          else break;
        }
        return parsed;
      } catch {
        return null;
      } finally {
        chunkInFlight.delete(file);
      }
    })();

    chunkInFlight.set(file, promise);
    return raceWithSignal(promise, signal);
  };

  const resolveDat = async (normKey: string, signal?: AbortSignal): Promise<string | null> => {
    const key = normalizeDatRef(normKey);
    if (!key) return null;

    const cachedEntry = entryCache.get(key);
    if (cachedEntry !== undefined) {
      entryCache.delete(key);
      entryCache.set(key, cachedEntry);
      return cachedEntry;
    }

    const manifest = await getManifest();
    if (!manifest) return null;

    // v2: HTTP Range-indexed packs + Core Primitives bundle
    if (manifest.version >= 2 && manifest.index && manifest.packs?.length) {
      const index = await loadIndex(manifest, signal);
      if (!index) return null;
      const hit = findIndexEntry(index, key);
      if (!hit) return null;
      if (hit.packIndex === -1) {
        const core = await loadCoreBundle(manifest, signal);
        if (!core) return null;
        return typeof core[key] === 'string' ? core[key] : null;
      }
      const pack = manifest.packs[hit.packIndex];
      if (!pack || hit.length <= 0) return null;
      return await fetchPackEntry(key, pack.file, hit.offset, hit.length, signal);
    }

    // v1 legacy fallback: gzipped JSON chunks
    const chunk = findChunkForPartKey(manifest, key);
    if (!chunk) return null;
    const dict = await loadChunk(chunk.file, signal);
    if (!dict) return null;
    return typeof dict[key] === 'string' ? dict[key] : null;
  };

  const clearCache = () => {
    manifestPromise = null;
    indexPromise = null;
    coreBundlePromise = null;
    chunkCache.clear();
    chunkInFlight.clear();
    entryCache.clear();
    entryInFlight.clear();
  };

  return { getManifest, resolveDat, clearCache };
}
