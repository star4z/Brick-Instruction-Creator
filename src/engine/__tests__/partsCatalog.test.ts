import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLibraryIndex, filterLibraryItems, isOnlineOnlyItem } from '../bricksLibrary';
import { PUBLIC_LDRAW_MIRRORS } from '../ldrLibrary';
import {
  PARTS_CATALOG_FILES,
  PARTS_CATALOG_FORMAT,
  loadPartsCatalog,
  mergeCatalogEntries,
  parseCatalogPayload,
} from '../partsCatalog';

const payload = (source: string, parts: unknown[]) => ({ format: PARTS_CATALOG_FORMAT, version: 1, source, parts });

describe('Online Parts Catalog', () => {
  it('parses entries, flags helpers/aliases, and replaces empty or ID-only titles', () => {
    const entries = parseCatalogPayload(
      payload('unofficial', [
        ['3626cpb1965', 'Minifigure, Head Beard Stubble Pattern'],
        ['bl_3626cpb1211', ''],
        ['bl_973pb1705c01', '973pb1705c01'],
        ['s/ignored', 'x', 'h'],
        ['u9655', 'Electric Switch', 'h'],
        ['30293', 'Rock 4 x 4', 'a'],
      ]),
      'unofficial',
    );
    const byId = new Map(entries.map((e) => [e.id, e]));
    expect(byId.get('3626cpb1965')?.category).toBe('minifigs');
    expect(byId.get('bl_3626cpb1211')?.name).toBe('Printed BrickLink Studio Part');
    expect(byId.get('bl_973pb1705c01')?.name).toBe('Printed BrickLink Studio Part');
    expect(byId.get('u9655')?.helper).toBe(true);
    expect(byId.get('30293')?.alias).toBe(true);
    expect(parseCatalogPayload({ format: 'nope', parts: [] }, 'official')).toEqual([]);
  });

  it('merges catalogs with official entries taking priority over duplicate unofficial IDs', () => {
    const official = parseCatalogPayload(payload('official', [['3001', 'Brick 2 x 4']]), 'official');
    const unofficial = parseCatalogPayload(
      payload('unofficial', [['3001', 'Old Brick'], ['bl_76925', 'Wig']]),
      'unofficial',
    );
    const cat = mergeCatalogEntries([official, unofficial]);
    expect(cat.entries.get('3001')?.origin).toBe('official');
    expect(cat.entries.get('3001')?.name).toBe('Brick 2 x 4');
    expect(cat.counts).toEqual({ official: 1, unofficial: 1 });
  });

  it('loads all bundled catalog files and tolerates a missing file', async () => {
    const fakeFetch = (async (url: string) => {
      if (url.endsWith('official.json')) {
        return { ok: true, json: async () => payload('official', [['3001', 'Brick 2 x 4']]) };
      }
      return { ok: false, json: async () => ({}) };
    }) as unknown as typeof fetch;
    const cat = await loadPartsCatalog('', fakeFetch);
    expect(cat.entries.size).toBe(1);
    expect(PARTS_CATALOG_FILES.map((f) => f.origin)).toEqual(['official', 'unofficial']);
  });

  it('merges catalog-only parts into the library index with scopes, search, and online-only state', () => {
    const cat = mergeCatalogEntries([
      parseCatalogPayload(payload('official', [['3001', 'Brick 2 x 4'], ['3626c', 'Minifig Head']]), 'official'),
      parseCatalogPayload(payload('unofficial', [['3626cpb1965', 'Minifigure, Head Beard Stubble']]), 'unofficial'),
    ]);
    const { items, stats } = buildLibraryIndex({
      userLibRaw: new Map([['3001', ['0 Brick 2 x 4', '0 !LDRAW_ORG Part']]]),
      userLibTitles: new Map([['3001', 'Brick 2 x 4']]),
      embeddedDatRaw: new Map(),
      embeddedDatTitles: new Map(),
      builtInCatalog: {},
      modelPartIds: new Set(),
      missingShapePartIds: new Set(),
      missingExactDatPartIds: new Set(),
      resolveName: (id) => id,
      onlineCatalog: cat.entries,
    });
    expect(stats.catalogOfficialParts).toBe(2);
    expect(stats.catalogUnofficialParts).toBe(1);
    const saved = items.find((i) => i.id === '3001')!;
    expect(saved.primarySource).toBe('saved');
    expect(saved.sources).toContain('official');
    expect(isOnlineOnlyItem(saved)).toBe(false);
    const head = items.find((i) => i.id === '3626cpb1965')!;
    expect(head.primarySource).toBe('unofficial');
    expect(isOnlineOnlyItem(head)).toBe(true);

    expect(filterLibraryItems(items, { scope: 'unofficial' }).map((i) => i.id)).toEqual(['3626cpb1965']);
    expect(filterLibraryItems(items, { query: 'beard' }).map((i) => i.id)).toEqual(['3626cpb1965']);
    // Saved parts rank ahead of catalog-only parts.
    expect(filterLibraryItems(items, { scope: 'official' })[0].id).toBe('3001');
  });

  it('bundled catalog files are valid and the importer source dropdown lists every public mirror', () => {
    const root = path.resolve(__dirname, '../../..');
    for (const { origin, path: rel } of PARTS_CATALOG_FILES) {
      const file = path.join(root, 'public', rel);
      expect(fs.existsSync(file)).toBe(true);
      const parsed = parseCatalogPayload(JSON.parse(fs.readFileSync(file, 'utf8')), origin);
      expect(parsed.length).toBeGreaterThan(origin === 'official' ? 10000 : 1000);
    }
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const m of PUBLIC_LDRAW_MIRRORS) {
      expect(html).toContain(`value="${m.url}"`);
    }
  });
});
