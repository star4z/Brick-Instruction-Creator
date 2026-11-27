import zlib from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import {
  createOnSitePartsChunkLoader,
  findChunkForPartKey,
  findIndexEntry,
  type PartsChunksManifest,
  type PartsPackIndex,
} from '../partsChunks';
import { fetchLDrawDependencyGraph } from '../ldrLibrary';

function gzipBytes(data: string | Buffer): Buffer {
  return zlib.gzipSync(typeof data === 'string' ? Buffer.from(data, 'utf8') : data);
}

function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

function makeGzipChunk(dict: Record<string, string>): ArrayBuffer {
  return toArrayBuffer(gzipBytes(JSON.stringify(dict)));
}

const SAMPLE_V1_MANIFEST: PartsChunksManifest = {
  version: 1,
  partCount: 4,
  officialCount: 3,
  unofficialCount: 1,
  chunks: [
    { file: 'c000.bin', first: '3001', last: '3005', count: 2, bytes: 120 },
    { file: 'c001.bin', first: 's/3001s01', last: 's/3005s01', count: 2, bytes: 110 },
  ],
};

function buildSampleV2Fixture() {
  const part3001 = '0 Brick 2 x 4\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/3001s01.dat\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 axlehol2.dat';
  const part3005 = '0 Brick 1 x 1\n4 16 0 0 0 1 0 0 1 1 0 0 1 0';
  const sub3001 = '0 ~Brick 2 x 4 Subpart\n4 16 0 0 0 1 0 0 1 1 0 0 1 0';
  const primAxle = '0 Axle Hole 2\n4 16 0 0 0 1 0 0 1 1 0 0 1 0';

  const gz3001 = gzipBytes(part3001);
  const gz3005 = gzipBytes(part3005);
  const gzSub = gzipBytes(sub3001);
  const pack0 = Buffer.concat([gz3001, gz3005, gzSub]);

  const coreBundle = gzipBytes(JSON.stringify({ axlehol2: primAxle }));

  // Keys sorted in JS code-unit order: '3001' < '3005' < 'axlehol2' < 's/3001s01'
  const index: PartsPackIndex = {
    keys: ['3001', '3005', 'axlehol2', 's/3001s01'],
    p: [0, 0, -1, 0],
    o: [0, gz3001.length, 0, gz3001.length + gz3005.length],
    l: [gz3001.length, gz3005.length, 0, gzSub.length],
  };
  const indexGz = gzipBytes(JSON.stringify(index));

  const manifest: PartsChunksManifest = {
    version: 2,
    partCount: 4,
    officialCount: 4,
    unofficialCount: 0,
    coreBundle: { file: 'core.bin', count: 1, bytes: coreBundle.length },
    index: { file: 'index.bin', bytes: indexGz.length },
    packs: [{ file: 'p00.bin', count: 3, bytes: pack0.length }],
  };

  return { manifest, index, indexGz, coreBundle, pack0 };
}

describe('partsChunks (v1 legacy compatibility)', () => {
  it('binary-searches sorted chunk ranges accurately', () => {
    expect(findChunkForPartKey(SAMPLE_V1_MANIFEST, '3001')?.file).toBe('c000.bin');
    expect(findChunkForPartKey(SAMPLE_V1_MANIFEST, '3005.DAT')?.file).toBe('c000.bin');
    expect(findChunkForPartKey(SAMPLE_V1_MANIFEST, 's\\3001s01.dat')?.file).toBe('c001.bin');
    expect(findChunkForPartKey(SAMPLE_V1_MANIFEST, '1000')).toBeNull();
    expect(findChunkForPartKey(SAMPLE_V1_MANIFEST, '9999')).toBeNull();
    expect(findChunkForPartKey(SAMPLE_V1_MANIFEST, 'z999')).toBeNull();
  });

  it('fetches and decompresses gzipped on-site chunks lazily and caches them', async () => {
    const chunk0 = makeGzipChunk({
      '3001': '0 Brick 2 x 4\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/3001s01.dat',
      '3005': '0 Brick 1 x 1\n4 16 0 0 0 1 0 0 1 1 0 0 1 0',
    });
    const chunk1 = makeGzipChunk({
      's/3001s01': '0 ~Brick 2 x 4 Subpart\n4 16 0 0 0 1 0 0 1 1 0 0 1 0',
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('manifest.json')) {
        return new Response(JSON.stringify(SAMPLE_V1_MANIFEST), { status: 200 });
      }
      if (url.endsWith('c000.bin')) {
        return new Response(chunk0, { status: 200 });
      }
      if (url.endsWith('c001.bin')) {
        return new Response(chunk1, { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const loader = createOnSitePartsChunkLoader({
      baseUrl: './parts-chunks/',
      fetchImpl: fetchMock,
    });

    const dat3001 = await loader.resolveDat('3001');
    expect(dat3001).toContain('Brick 2 x 4');
    // Second lookup in same chunk must hit cache without another fetch
    const dat3005 = await loader.resolveDat('3005');
    expect(dat3005).toContain('Brick 1 x 1');
    expect(fetchMock).toHaveBeenCalledTimes(2); // manifest.json + c000.bin only

    // Missing key inside range returns null cleanly
    expect(await loader.resolveDat('3003')).toBeNull();
  });

  it('resolves entire dependency graph from v1 on-site chunks with zero external mirror calls', async () => {
    const chunk0 = makeGzipChunk({
      '3001': '0 Brick 2 x 4\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/3001s01.dat',
    });
    const chunk1 = makeGzipChunk({
      's/3001s01': '0 ~Brick 2 x 4 Subpart\n4 16 0 0 0 1 0 0 1 1 0 0 1 0',
    });

    const onSiteFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('manifest.json')) return new Response(JSON.stringify(SAMPLE_V1_MANIFEST), { status: 200 });
      if (url.endsWith('c000.bin')) return new Response(chunk0, { status: 200 });
      if (url.endsWith('c001.bin')) return new Response(chunk1, { status: 200 });
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const externalMirrorFetch = vi.fn(async () => {
      throw new Error('External mirror should NOT be called when on-site chunks have the part');
    }) as unknown as typeof fetch;

    const loader = createOnSitePartsChunkLoader({ fetchImpl: onSiteFetch });
    const loaded = new Map<string, string[]>();

    const res = await fetchLDrawDependencyGraph({
      rootPartIds: ['3001'],
      mirrors: [{ url: 'https://example.invalid/ldraw/', label: 'External', repoGroup: 'ext', scope: 'official' }],
      getDirectLoadedLines: (k) => loaded.get(k) || null,
      getFallbacks: () => [],
      resolveOnSiteDat: (k, sig) => loader.resolveDat(k, sig),
      onDatLoaded: (storeKey, _reqKey, text) => {
        loaded.set(storeKey, text.split('\n'));
      },
      fetchImpl: externalMirrorFetch,
    });

    expect(res.fetched).toBe(2);
    expect(loaded.has('3001')).toBe(true);
    expect(loaded.has('s/3001s01')).toBe(true);
    expect(externalMirrorFetch).not.toHaveBeenCalled();
  });
});

describe('partsChunks (v2 HTTP Range-indexed packs + core primitives)', () => {
  it('binary-searches sorted v2 index accurately', () => {
    const { index } = buildSampleV2Fixture();
    expect(findIndexEntry(index, '3001')?.packIndex).toBe(0);
    expect(findIndexEntry(index, '3005.DAT')?.packIndex).toBe(0);
    expect(findIndexEntry(index, 's\\3001s01.dat')?.packIndex).toBe(0);
    expect(findIndexEntry(index, 'axlehol2.dat')?.packIndex).toBe(-1);
    expect(findIndexEntry(index, '1000')).toBeNull();
    expect(findIndexEntry(index, '3003')).toBeNull();
    expect(findIndexEntry(index, 'zzzz')).toBeNull();
  });

  it('fetches exact byte ranges (206 Partial Content), caches entries, and serves core primitives from core.bin', async () => {
    const { manifest, indexGz, coreBundle, pack0 } = buildSampleV2Fixture();
    const rangeHeaders: string[] = [];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest), { status: 200 });
      if (url.endsWith('index.bin')) return new Response(toArrayBuffer(indexGz), { status: 200 });
      if (url.endsWith('core.bin')) return new Response(toArrayBuffer(coreBundle), { status: 200 });
      if (url.endsWith('p00.bin')) {
        const range = new Headers(init?.headers).get('Range') || '';
        rangeHeaders.push(range);
        const match = /^bytes=(\d+)-(\d+)$/.exec(range);
        if (match) {
          const start = Number(match[1]);
          const end = Number(match[2]);
          const slice = pack0.subarray(start, end + 1);
          return new Response(toArrayBuffer(slice), {
            status: 206,
            headers: { 'Content-Range': `bytes ${start}-${end}/${pack0.length}` },
          });
        }
        return new Response(toArrayBuffer(pack0), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const loader = createOnSitePartsChunkLoader({ fetchImpl: fetchMock });

    const dat3001 = await loader.resolveDat('3001');
    expect(dat3001).toContain('Brick 2 x 4');
    expect(rangeHeaders).toHaveLength(1);
    expect(rangeHeaders[0]).toMatch(/^bytes=0-\d+$/);

    // Second lookup for 3001 hits in-memory LRU cache without another fetch
    expect(await loader.resolveDat('3001')).toBe(dat3001);
    expect(rangeHeaders).toHaveLength(1);

    // Missing key resolves null immediately from index with zero pack fetches
    expect(await loader.resolveDat('nonexistent_9999')).toBeNull();
    expect(rangeHeaders).toHaveLength(1);

    // Core primitive loads from core.bin without touching p00.bin
    const axle = await loader.resolveDat('axlehol2.dat');
    expect(axle).toContain('0 Axle Hole 2');
    expect(rangeHeaders).toHaveLength(1);
  });

  it('gracefully slices full 200 OK pack responses when a host strips HTTP Range headers', async () => {
    const { manifest, indexGz, pack0 } = buildSampleV2Fixture();

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest), { status: 200 });
      if (url.endsWith('index.bin')) return new Response(toArrayBuffer(indexGz), { status: 200 });
      // Intentionally ignore Range header and return full pack with 200 OK
      if (url.endsWith('p00.bin')) return new Response(toArrayBuffer(pack0), { status: 200 });
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const loader = createOnSitePartsChunkLoader({ fetchImpl: fetchMock });
    const dat3005 = await loader.resolveDat('3005');
    expect(dat3005).toContain('Brick 1 x 1');
  });

  it('resolves entire dependency graph (part + subpart + core primitive) via v2 packs with zero external calls', async () => {
    const { manifest, indexGz, coreBundle, pack0 } = buildSampleV2Fixture();

    const onSiteFetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('manifest.json')) return new Response(JSON.stringify(manifest), { status: 200 });
      if (url.endsWith('index.bin')) return new Response(toArrayBuffer(indexGz), { status: 200 });
      if (url.endsWith('core.bin')) return new Response(toArrayBuffer(coreBundle), { status: 200 });
      if (url.endsWith('p00.bin')) {
        const range = new Headers(init?.headers).get('Range') || '';
        const match = /^bytes=(\d+)-(\d+)$/.exec(range);
        if (match) {
          const slice = pack0.subarray(Number(match[1]), Number(match[2]) + 1);
          return new Response(toArrayBuffer(slice), { status: 206 });
        }
        return new Response(toArrayBuffer(pack0), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    }) as unknown as typeof fetch;

    const externalMirrorFetch = vi.fn(async () => {
      throw new Error('External mirror should NOT be called when v2 packs have the part');
    }) as unknown as typeof fetch;

    const loader = createOnSitePartsChunkLoader({ fetchImpl: onSiteFetch });
    const loaded = new Map<string, string[]>();

    const res = await fetchLDrawDependencyGraph({
      rootPartIds: ['3001'],
      mirrors: [{ url: 'https://example.invalid/ldraw/', label: 'External', repoGroup: 'ext', scope: 'official' }],
      getDirectLoadedLines: (k) => loaded.get(k) || null,
      getFallbacks: () => [],
      resolveOnSiteDat: (k, sig) => loader.resolveDat(k, sig),
      onDatLoaded: (storeKey, _reqKey, text) => {
        loaded.set(storeKey, text.split('\n'));
      },
      fetchImpl: externalMirrorFetch,
    });

    expect(res.fetched).toBe(3);
    expect(loaded.has('3001')).toBe(true);
    expect(loaded.has('s/3001s01')).toBe(true);
    expect(loaded.has('axlehol2')).toBe(true);
    expect(externalMirrorFetch).not.toHaveBeenCalled();
  });
});
