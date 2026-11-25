// On-site paginated 3D LDraw part geometry chunk loader.
// Fetches compact gzipped JSON chunks (`./parts-chunks/cNNN.bin`) on demand from the app's own
// origin so built-in Official LDraw and Unofficial/Studio parts load with zero external API calls.

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

export interface PartsChunksManifest {
  version: number;
  partCount: number;
  officialCount: number;
  unofficialCount: number;
  chunks: PartsChunkRange[];
}

export interface OnSitePartsChunkLoader {
  /** Loads `manifest.json` once (cached); returns null if on-site chunks are not present. */
  getManifest: () => Promise<PartsChunksManifest | null>;
  /** Resolves a normalized `.dat` key from on-site chunks, or null if absent/unavailable. */
  resolveDat: (normKey: string, signal?: AbortSignal) => Promise<string | null>;
  /** Clears in-memory chunk cache (useful for tests). */
  clearCache: () => void;
}

/**
 * Binary-searches sorted `[first, last]` chunk ranges to locate the chunk that may contain `normKey`.
 */
export function findChunkForPartKey(
  manifest: PartsChunksManifest,
  normKey: string,
): PartsChunkRange | null {
  const key = normalizeDatRef(normKey);
  if (!key || !manifest?.chunks?.length) return null;
  let lo = 0;
  let hi = manifest.chunks.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1;
    const chunk = manifest.chunks[mid];
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
  /** Base path for chunks (defaults to `./parts-chunks/`). */
  baseUrl?: string;
  /** Maximum number of decompressed chunk dictionaries to keep in memory. */
  maxCachedChunks?: number;
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
  const fetchImpl = options.fetchImpl ?? fetch;
  const decompressImpl = options.decompressImpl ?? decompressGzipToText;

  let manifestPromise: Promise<PartsChunksManifest | null> | null = null;
  const chunkCache = new Map<string, Record<string, string>>();
  const chunkInFlight = new Map<string, Promise<Record<string, string> | null>>();

  const getManifest = (): Promise<PartsChunksManifest | null> => {
    if (manifestPromise) return manifestPromise;
    manifestPromise = (async () => {
      try {
        const res = await fetchImpl(`${baseUrl}manifest.json`, { cache: 'default' });
        if (!res.ok) return null;
        const json = (await res.json()) as Partial<PartsChunksManifest>;
        if (!json || !Array.isArray(json.chunks) || json.chunks.length === 0) return null;
        return {
          version: Number(json.version) || 1,
          partCount: Number(json.partCount) || 0,
          officialCount: Number(json.officialCount) || 0,
          unofficialCount: Number(json.unofficialCount) || 0,
          chunks: json.chunks,
        };
      } catch {
        return null;
      }
    })();
    return manifestPromise;
  };

  const loadChunk = async (
    file: string,
    signal?: AbortSignal,
  ): Promise<Record<string, string> | null> => {
    const cached = chunkCache.get(file);
    if (cached) {
      // Refresh LRU position
      chunkCache.delete(file);
      chunkCache.set(file, cached);
      return cached;
    }

    const existing = chunkInFlight.get(file);
    if (existing) return existing;

    const promise = (async (): Promise<Record<string, string> | null> => {
      try {
        const res = await fetchImpl(`${baseUrl}${file}`, { cache: 'force-cache', signal });
        if (!res.ok) return null;
        const buf = await res.arrayBuffer();
        let text: string;
        // Detect raw gzip magic bytes (0x1f 0x8b); also tolerate plain JSON if served uncompressed
        const bytes = new Uint8Array(buf);
        if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
          text = await decompressImpl(buf);
        } else {
          text = new TextDecoder().decode(bytes);
        }
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
    return promise;
  };

  const resolveDat = async (normKey: string, signal?: AbortSignal): Promise<string | null> => {
    const key = normalizeDatRef(normKey);
    if (!key) return null;
    const manifest = await getManifest();
    if (!manifest) return null;
    const chunk = findChunkForPartKey(manifest, key);
    if (!chunk) return null;
    const dict = await loadChunk(chunk.file, signal);
    if (!dict) return null;
    return typeof dict[key] === 'string' ? dict[key] : null;
  };

  const clearCache = () => {
    manifestPromise = null;
    chunkCache.clear();
    chunkInFlight.clear();
  };

  return { getManifest, resolveDat, clearCache };
}
