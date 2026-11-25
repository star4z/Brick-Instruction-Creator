import zlib from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import {
  createOnSitePartsChunkLoader,
  findChunkForPartKey,
  type PartsChunksManifest,
} from '../partsChunks';
import { fetchLDrawDependencyGraph } from '../ldrLibrary';

function makeGzipChunk(dict: Record<string, string>): ArrayBuffer {
  const buf = zlib.gzipSync(Buffer.from(JSON.stringify(dict), 'utf8'));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

const SAMPLE_MANIFEST: PartsChunksManifest = {
  version: 1,
  partCount: 4,
  officialCount: 3,
  unofficialCount: 1,
  chunks: [
    { file: 'c000.bin', first: '3001', last: '3005', count: 2, bytes: 120 },
    { file: 'c001.bin', first: 's/3001s01', last: 's/3005s01', count: 2, bytes: 110 },
  ],
};

describe('partsChunks', () => {
  it('binary-searches sorted chunk ranges accurately', () => {
    expect(findChunkForPartKey(SAMPLE_MANIFEST, '3001')?.file).toBe('c000.bin');
    expect(findChunkForPartKey(SAMPLE_MANIFEST, '3005.DAT')?.file).toBe('c000.bin');
    expect(findChunkForPartKey(SAMPLE_MANIFEST, 's\\3001s01.dat')?.file).toBe('c001.bin');
    expect(findChunkForPartKey(SAMPLE_MANIFEST, '1000')).toBeNull();
    expect(findChunkForPartKey(SAMPLE_MANIFEST, '9999')).toBeNull();
    expect(findChunkForPartKey(SAMPLE_MANIFEST, 'z999')).toBeNull();
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
        return new Response(JSON.stringify(SAMPLE_MANIFEST), { status: 200 });
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

  it('resolves entire dependency graph from on-site chunks with zero external mirror calls', async () => {
    const chunk0 = makeGzipChunk({
      '3001': '0 Brick 2 x 4\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/3001s01.dat',
    });
    const chunk1 = makeGzipChunk({
      's/3001s01': '0 ~Brick 2 x 4 Subpart\n4 16 0 0 0 1 0 0 1 1 0 0 1 0',
    });

    const onSiteFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('manifest.json')) return new Response(JSON.stringify(SAMPLE_MANIFEST), { status: 200 });
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
