import { describe, expect, it, vi } from 'vitest';
import { DIRECT_RGB_COLOR_FLAG } from '../datCompiler';
import {
  buildLDrawCandidatePaths,
  buildMirrorConfigList,
  extractCleanDatTitle,
  extractDatDependencies,
  extractMovedToTarget,
  fetchDatFromMirrors,
  fetchLDrawDependencyGraph,
  hasMpdGeometryOrPartLines,
  isLDrawPartSubfile,
  isSynthesizedPrimitiveBase,
  normalizeMpdSubfileKey,
  parseLDrawColorToken,
  PUBLIC_LDRAW_MIRRORS,
  type LDrawMirrorConfig,
} from '../ldrLibrary';

function mockResponse(status: number, body: string | Uint8Array = ''): Response {
  const ok = status >= 200 && status < 300;
  return {
    ok,
    status,
    text: async () => (typeof body === 'string' ? body : new TextDecoder().decode(body)),
    arrayBuffer: async () => {
      if (body instanceof Uint8Array) {
        return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength);
      }
      const enc = new TextEncoder().encode(body);
      return enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);
    },
  } as unknown as Response;
}

describe('ldrLibrary parser and metadata helpers', () => {
  it('normalizes MPD subfile keys across slashes, leading ./, and case', () => {
    expect(normalizeMpdSubfileKey('Submodels\\Bogie_Front.LDR')).toBe('submodels/bogie_front.ldr');
    expect(normalizeMpdSubfileKey('./Car_A.ldr ')).toBe('car_a.ldr');
  });

  it('distinguishes comment-only preambles from actual geometry/part lines', () => {
    expect(hasMpdGeometryOrPartLines(['0 Exported from BrickLink Studio', '0 Author: Builder'])).toBe(false);
    expect(hasMpdGeometryOrPartLines(['0 Header', '1 71 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat'])).toBe(true);
    expect(hasMpdGeometryOrPartLines(['4 16 0 0 0 10 0 0 10 0 10 0 0 10'])).toBe(true);
  });

  it('does NOT misclassify !LDRAW_ORG Model or Unofficial_Model submodels as embedded parts', () => {
    expect(
      isLDrawPartSubfile('bogie.ldr', [
        '0 Bogie Submodel',
        '0 Name: bogie.ldr',
        '0 !LDRAW_ORG Unofficial_Model',
        '1 0 0 0 0 1 0 0 0 1 0 0 0 1 38339.dat',
      ]),
    ).toBe(false);

    expect(
      isLDrawPartSubfile('car_half.ldr', [
        '0 Car Half',
        '0 !LDRAW_ORG Model',
        '1 71 0 0 0 1 0 0 0 1 0 0 0 1 3029.dat',
      ]),
    ).toBe(false);

    expect(
      isLDrawPartSubfile('custom_part.ldr', [
        '0 Custom Part',
        '0 !LDRAW_ORG Unofficial_Part',
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 box5.dat',
      ]),
    ).toBe(true);

    expect(isLDrawPartSubfile('3029.dat', ['0 Plate 4 x 12'])).toBe(true);
    expect(isLDrawPartSubfile('inline.ldr', ['4 16 0 0 0 1 0 0 1 0 1 0 0 1'])).toBe(true);
  });

  it('parses standard LDraw color IDs, color 16 inheritance, and direct RGB 0x2RRGGBB tokens', () => {
    expect(parseLDrawColorToken('71', 15)).toBe(71);
    expect(parseLDrawColorToken('16', 4)).toBe(4);
    expect(parseLDrawColorToken('-1', 14)).toBe(14);
    expect(parseLDrawColorToken('0x2C91A09', 71)).toBe(DIRECT_RGB_COLOR_FLAG | 0xc91a09);
    expect(parseLDrawColorToken('0X200ff88', 71)).toBe(DIRECT_RGB_COLOR_FLAG | 0x00ff88);
  });

  it('cleans official LDraw part titles and resolves ~Moved to redirects', () => {
    expect(extractCleanDatTitle(['0 =Tile  1 x  2 with Groove', '0 Name: 30070.dat'])).toBe(
      'Tile 1 x 2 with Groove',
    );
    expect(extractCleanDatTitle(['0 Plate  4 x 12', '0 Name: 3029.dat'])).toBe('Plate 4 x 12');
    expect(extractCleanDatTitle(['0 ~Moved to 3069b', '0 Name: 3069.dat'])).toBeNull();
    expect(extractMovedToTarget(['0 ~Moved to 3069b', '0 Name: 3069.dat'])).toBe('3069b');
    expect(extractMovedToTarget(['0 ~Moved to s\\3029s01.dat'])).toBe('s/3029s01');
  });

  it('orders LDraw candidate paths cleanly without redundant 404 probes', () => {
    expect(buildLDrawCandidatePaths('3029')).toEqual(['parts/3029.dat']);
    expect(buildLDrawCandidatePaths('86210')).toEqual(['parts/86210.dat']);
    expect(buildLDrawCandidatePaths('s/86210s01')).toEqual(['parts/s/86210s01.dat']);
    expect(buildLDrawCandidatePaths('48/1-4con0')).toEqual(['p/48/1-4con0.dat']);
    expect(buildLDrawCandidatePaths('box5')).toEqual(['p/box5.dat', 'parts/box5.dat']);
    expect(buildLDrawCandidatePaths('1-4con0')).toEqual(['p/1-4con0.dat', 'parts/1-4con0.dat']);
    expect(isSynthesizedPrimitiveBase('stud')).toBe(true);
    expect(isSynthesizedPrimitiveBase('4-4cyli')).toBe(true);
    expect(isSynthesizedPrimitiveBase('box5')).toBe(false);
    expect(isSynthesizedPrimitiveBase('3029')).toBe(false);
  });

  it('extracts standard type-1 subfiles, !TEXMAP 0 !: 1 subfiles, and external PNG textures', () => {
    const dat = [
      '0 Printed Tile',
      '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s\\86210s01.dat',
      '1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud.dat',
      '1 16 0 0 0 1 0 0 0 1 0 0 0 1 4-4cyli.dat',
      '0 !TEXMAP START PLANAR 0 0 0 20 0 0 0 0 20 sticker_logo.png',
      '0 !: 1 16 0 0 0 1 0 0 0 1 0 0 0 1 box5.dat',
      '0 !TEXMAP END',
    ].join('\n');

    const deps = extractDatDependencies(dat);
    expect(deps.subfiles).toEqual(['s/86210s01', 'box5']);
    expect(deps.textures).toEqual(['sticker_logo.png']);
  });
});

describe('ldrLibrary mirror fetching and dependency graph BFS', () => {
  const testMirrors: LDrawMirrorConfig[] = [
    { url: 'https://mirror-a.test/ldraw/', label: 'A1', repoGroup: 'groupA' },
    { url: 'https://mirror-a-cdn.test/ldraw/', label: 'A2', repoGroup: 'groupA' },
    { url: 'https://mirror-b.test/ldraw/', label: 'B1', repoGroup: 'groupB' },
  ];

  it('skips duplicate repoGroup mirrors on clean 404, but fails over on HTTP 403/500', async () => {
    const requested: string[] = [];
    const fakeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      if (url === 'https://mirror-a.test/ldraw/parts/99999.dat') return mockResponse(404);
      if (url === 'https://mirror-b.test/ldraw/parts/99999.dat') return mockResponse(404);
      if (url === 'https://mirror-a.test/ldraw/parts/38340.dat') return mockResponse(403);
      if (url === 'https://mirror-a-cdn.test/ldraw/parts/38340.dat') {
        return mockResponse(200, '0 Train Wheel\n4 16 0 0 0 1 0 0 1 0 1 0 0 1');
      }
      return mockResponse(404);
    });

    // Clean 404 on mirror-a (groupA) should skip mirror-a-cdn (groupA) and probe mirror-b (groupB)
    const miss = await fetchDatFromMirrors('99999', testMirrors, () => [], fakeFetch as unknown as typeof fetch);
    expect(miss.text).toBeNull();
    expect(miss.notFound).toBe(true);
    expect(miss.networkBlocked).toBe(false);
    expect(requested).toEqual([
      'https://mirror-a.test/ldraw/parts/99999.dat',
      'https://mirror-b.test/ldraw/parts/99999.dat',
    ]);

    // HTTP 403 on mirror-a MUST fail over to mirror-a-cdn (same repoGroup) and succeed!
    requested.length = 0;
    const hit = await fetchDatFromMirrors('38340', testMirrors, () => [], fakeFetch as unknown as typeof fetch);
    expect(hit.text).toContain('0 Train Wheel');
    expect(hit.resolvedKey).toBe('38340');
    expect(requested).toEqual([
      'https://mirror-a.test/ldraw/parts/38340.dat',
      'https://mirror-a-cdn.test/ldraw/parts/38340.dat',
    ]);
  });

  it('recursively fetches parts, subparts, primitives, and !TEXMAP PNGs without skipping official printed parts when base part is cached', async () => {
    const store = new Map<string, string[]>([
      // Base unprinted head 3626c is already loaded — must NOT stop 3626cp01 from being fetched!
      ['3626c', ['0 Minifig Head', '4 16 0 0 0 1 0 0 1 0 1 0 0 1']],
    ]);
    const loadedTextures = new Map<string, string>();
    const pngBytes = new Uint8Array(32).fill(7);

    const files: Record<string, string | Uint8Array> = {
      'parts/86210.dat':
        '0 Glass for Window 1 x 4 x 3\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 s\\86210s01.dat\n',
      'parts/s/86210s01.dat':
        '0 ~Glass Subfile\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 box5.dat\n',
      'p/box5.dat': '0 Box5 Primitive\n4 16 -1 0 -1 1 0 -1 1 0 1 -1 0 1\n',
      'parts/3626cp01.dat': [
        '0 Minifig Head with Classic Smile',
        '0 !TEXMAP START CYLINDRICAL 0 0 0 0 24 0 0 0 -10 180 face01.png',
        '0 !: 4 16 -5 0 -10 5 0 -10 5 10 -10 -5 10 -10',
        '0 !TEXMAP END',
      ].join('\n'),
      'parts/textures/face01.png': pngBytes,
    };

    const fakeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const rel = url.replace('https://mirror-a.test/ldraw/', '');
      if (Object.prototype.hasOwnProperty.call(files, rel)) {
        return mockResponse(200, files[rel]);
      }
      return mockResponse(404);
    });

    const result = await fetchLDrawDependencyGraph({
      rootPartIds: ['86210', '3626cp01'],
      mirrors: [testMirrors[0]],
      getDirectLoadedLines: (k) => store.get(k) ?? null,
      getFallbacks: (k) => (k === '3626cp01' ? ['3626c'] : []),
      hasTexture: (n) => loadedTextures.has(n),
      onDatLoaded: (storeKey, _reqKey, text) => {
        store.set(storeKey, text.split('\n'));
      },
      onTextureLoaded: (name, b64) => {
        loadedTextures.set(name, b64);
      },
      fetchImpl: fakeFetch as unknown as typeof fetch,
    });

    expect(result.alreadyComplete).toBe(false);
    expect(result.networkBlocked).toBe(false);
    expect(result.fetched).toBe(4); // 86210, 3626cp01, s/86210s01, box5
    expect(result.texturesFetched).toBe(1); // face01.png
    expect(store.has('86210')).toBe(true);
    expect(store.has('s/86210s01')).toBe(true);
    expect(store.has('box5')).toBe(true);
    expect(store.has('3626cp01')).toBe(true);
    expect(loadedTextures.has('face01.png')).toBe(true);
  });

  it('detects completely blocked/offline networks early without hanging', async () => {
    const fakeFetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });

    const result = await fetchLDrawDependencyGraph({
      rootPartIds: ['3029', '27448', '86210'],
      mirrors: [testMirrors[0]],
      getDirectLoadedLines: () => null,
      getFallbacks: () => [],
      onDatLoaded: () => {},
      fetchImpl: fakeFetch as unknown as typeof fetch,
    });

    expect(result.networkBlocked).toBe(true);
    expect(result.fetched).toBe(0);
  });

  it('builds mirror list prioritizing selected mirror and appending defaults without duplicates', () => {
    const list = buildMirrorConfigList(PUBLIC_LDRAW_MIRRORS[1].url);
    expect(list[0].url).toBe(PUBLIC_LDRAW_MIRRORS[1].url);
    expect(list.length).toBe(PUBLIC_LDRAW_MIRRORS.length);

    const customList = buildMirrorConfigList('custom', 'https://my-ldraw.example.com/lib');
    expect(customList[0].url).toBe('https://my-ldraw.example.com/lib/');
    expect(customList[0].scope).toBe('custom');
    expect(customList.length).toBe(PUBLIC_LDRAW_MIRRORS.length + 1);
  });

  it('routes Studio custom IDs (bl_76925, bb892c01) directly to UnOfficial mirrors and falls through for unofficial parts like 35287', async () => {
    const scopedMirrors: LDrawMirrorConfig[] = [
      { url: 'https://official.test/ldraw/', label: 'Official', repoGroup: 'off', scope: 'official' },
      { url: 'https://unofficial.test/UnOfficial/', label: 'UnOfficial', repoGroup: 'unoff', scope: 'unofficial' },
    ];
    const requested: string[] = [];
    const store = new Map<string, string[]>();

    const fakeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      if (url === 'https://unofficial.test/UnOfficial/parts/bl_76925.dat') {
        return mockResponse(200, '0 WIG NO. 50\n3 16 0 0 0 1 0 0 0 1 0\n');
      }
      if (url === 'https://unofficial.test/UnOfficial/parts/bb892c01.dat') {
        return mockResponse(200, '0 Powered Up Hub\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 stug-4x4.dat\n');
      }
      if (url === 'https://official.test/ldraw/p/stug-4x4.dat') {
        return mockResponse(200, '0 Stud Group 4x4\n4 16 0 0 0 1 0 0 1 0 1 0 0 1\n');
      }
      if (url === 'https://unofficial.test/UnOfficial/parts/35287.dat') {
        return mockResponse(200, '0 Glass for Window 1 x 2 x 3\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 s\\35287s01.dat\n');
      }
      if (url === 'https://unofficial.test/UnOfficial/parts/s/35287s01.dat') {
        return mockResponse(200, '0 ~Glass Subfile\n4 16 0 0 0 1 0 0 1 0 1 0 0 1\n');
      }
      return mockResponse(404);
    });

    expect(buildLDrawCandidatePaths('bl_76925')).toEqual(['parts/bl_76925.dat']);
    expect(buildLDrawCandidatePaths('bb892c01')).toEqual(['parts/bb892c01.dat']);

    const res = await fetchLDrawDependencyGraph({
      rootPartIds: ['bl_76925', 'bb892c01', '35287'],
      mirrors: scopedMirrors,
      getDirectLoadedLines: (k) => store.get(k) ?? null,
      getFallbacks: (k) => (k === 'bl_76925' ? ['76925'] : []),
      onDatLoaded: (storeKey, _reqKey, text) => {
        store.set(storeKey, text.split('\n'));
      },
      fetchImpl: fakeFetch as unknown as typeof fetch,
    });

    expect(res.fetched).toBe(5); // bl_76925, bb892c01, 35287, stug-4x4, s/35287s01
    expect(store.has('bl_76925')).toBe(true);
    expect(store.has('bb892c01')).toBe(true);
    expect(store.has('35287')).toBe(true);
    expect(store.has('s/35287s01')).toBe(true);
    expect(store.has('stug-4x4')).toBe(true);
    // Studio custom IDs never wasted 404 probes against the official mirror!
    expect(requested).not.toContain('https://official.test/ldraw/parts/bl_76925.dat');
    expect(requested).not.toContain('https://official.test/ldraw/parts/bb892c01.dat');
  });

  it('fetches BrickLink-numbered printed heads (3626cpb1965, bl_3626cpb1211) from UnOfficial mirrors even when the blank 3626c is cached', async () => {
    const scopedMirrors: LDrawMirrorConfig[] = [
      { url: 'https://official.test/ldraw/', label: 'Official', repoGroup: 'off', scope: 'official' },
      { url: 'https://unofficial.test/UnOfficial/', label: 'UnOfficial', repoGroup: 'unoff', scope: 'unofficial' },
    ];
    const requested: string[] = [];
    const store = new Map<string, string[]>([['3626c', ['0 Minifig Head', '4 16 0 0 0 1 0 0 1 0 1 0 0 1']]]);
    const notFound = new Set<string>();
    const printedHead = (name: string) =>
      `0 FILE ${name}.dat\n0 PE_TEX_PATH 0\n0 PE_TEX_INFO iVBORw0KGgo=\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 3626tex.dat\n`;

    const fakeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      if (url === 'https://unofficial.test/UnOfficial/parts/3626cpb1965.dat') return mockResponse(200, printedHead('3626cpb1965'));
      if (url === 'https://unofficial.test/UnOfficial/parts/bl_3626cpb1211.dat') return mockResponse(200, printedHead('bl_3626cpb1211'));
      if (url === 'https://unofficial.test/UnOfficial/parts/3626tex.dat') return mockResponse(200, '0 Head Tex\n3 16 0 0 0 1 0 0 0 1 0\n');
      return mockResponse(404);
    });

    const fallbacks = (k: string) => (/^(?:bl_)?3626cpb\d+$/.test(k) ? ['3626c', '3626b', '3626'] : []);
    const res = await fetchLDrawDependencyGraph({
      rootPartIds: ['3626cpb1965', 'bl_3626cpb1211', 'bl_3626cpb9999'],
      mirrors: scopedMirrors,
      getDirectLoadedLines: (k) => store.get(k) ?? null,
      getFallbacks: fallbacks,
      notFoundCache: notFound,
      onDatLoaded: (storeKey, _reqKey, text) => {
        store.set(storeKey, text.split('\n'));
      },
      fetchImpl: fakeFetch as unknown as typeof fetch,
    });

    expect(res.fetched).toBe(3); // 3626cpb1965, bl_3626cpb1211, 3626tex
    expect(store.has('3626cpb1965')).toBe(true);
    expect(store.has('bl_3626cpb1211')).toBe(true);
    expect(store.has('3626tex')).toBe(true);
    // Unhosted print falls back to the cached blank head without re-downloading it.
    expect(notFound.has('bl_3626cpb9999')).toBe(true);
    expect(requested.filter((u) => u.endsWith('/3626c.dat'))).toEqual([]);
    // BrickLink-numbered prints never waste 404 probes against the official mirror.
    expect(requested.some((u) => u.startsWith('https://official.test/') && u.includes('3626cpb'))).toBe(false);
  });

  it('probes unofficial mirrors first when preferUnofficial returns true, while falling back to official for shared subparts', async () => {
    const scopedMirrors: LDrawMirrorConfig[] = [
      { url: 'https://official.test/ldraw/', label: 'Official', repoGroup: 'off', scope: 'official' },
      { url: 'https://unofficial.test/UnOfficial/', label: 'UnOfficial', repoGroup: 'unoff', scope: 'unofficial' },
    ];
    const requested: string[] = [];
    const store = new Map<string, string[]>();

    const fakeFetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      requested.push(url);
      if (url === 'https://unofficial.test/UnOfficial/parts/77845.dat') {
        return mockResponse(200, '0 Unofficial Part\n1 16 0 0 0 1 0 0 0 1 0 0 0 1 box5.dat\n');
      }
      if (url === 'https://official.test/ldraw/p/box5.dat') {
        return mockResponse(200, '0 Box 5\n3 16 0 0 0 1 0 0 0 1 0\n');
      }
      return mockResponse(404);
    });

    const res = await fetchLDrawDependencyGraph({
      rootPartIds: ['77845'],
      mirrors: scopedMirrors,
      getDirectLoadedLines: (k) => store.get(k) ?? null,
      getFallbacks: () => [],
      preferUnofficial: (k) => k === '77845',
      onDatLoaded: (storeKey, _reqKey, text) => {
        store.set(storeKey, text.split('\n'));
      },
      fetchImpl: fakeFetch as unknown as typeof fetch,
    });

    expect(res.fetched).toBe(2);
    expect(store.has('77845')).toBe(true);
    expect(store.has('box5')).toBe(true);
    // 77845 hit unofficial directly on the first request without a wasted official 404
    expect(requested[0]).toBe('https://unofficial.test/UnOfficial/parts/77845.dat');
    // box5 (not flagged unofficial) hit official directly on its first request
    expect(requested[1]).toBe('https://official.test/ldraw/p/box5.dat');
  });
});
