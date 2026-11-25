import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildLibraryIndex, filterLibraryItems } from '../bricksLibrary';
import {
  PART_COLORS_FILE,
  PART_COLORS_FORMAT,
  loadPartColorsCatalog,
  parsePartColorsPayload,
} from '../partColors';

describe('Part Color Availability Catalog', () => {
  it('parses valid payloads, normalizes part IDs, deduplicates colors, and counts parts per color', () => {
    const parsed = parsePartColorsPayload({
      format: PART_COLORS_FORMAT,
      version: 1,
      parts: {
        '3001.DAT': [15, 4, 4, 378],
        '3023': [0, 378],
        invalidEmpty: [],
      },
    });

    expect(parsed.byPart.get('3001')).toEqual([4, 15, 378]);
    expect(parsed.byPart.get('3023')).toEqual([0, 378]);
    expect(parsed.byPart.has('invalidempty')).toBe(false);
    expect(parsed.byPartSet.get('3001')?.has(378)).toBe(true);
    expect(parsed.partCountByColor.get(378)).toBe(2);
    expect(parsed.partCountByColor.get(4)).toBe(1);
    expect(parsed.partCountByColor.get(0)).toBe(1);

    // Rejects invalid format cleanly
    expect(parsePartColorsPayload({ format: 'wrong', parts: { '3001': [4] } }).byPart.size).toBe(0);
  });

  it('loads via fetch and returns null on network or HTTP errors', async () => {
    const okFetch = (async () => ({
      ok: true,
      json: async () => ({
        format: PART_COLORS_FORMAT,
        version: 1,
        parts: { '3001': [4, 15] },
      }),
    })) as unknown as typeof fetch;

    const loaded = await loadPartColorsCatalog('', okFetch);
    expect(loaded?.byPart.get('3001')).toEqual([4, 15]);

    const failFetch = (async () => ({ ok: false })) as unknown as typeof fetch;
    expect(await loadPartColorsCatalog('', failFetch)).toBeNull();
  });

  it('integrates with buildLibraryIndex and filterLibraryItems to filter parts by real-world available colors', () => {
    const partColors = parsePartColorsPayload({
      format: PART_COLORS_FORMAT,
      version: 1,
      parts: {
        '3001': [4, 15, 378],
        '3023': [0, 378],
        '60594': [0, 15],
      },
    });

    const builtInCatalog: Record<string, { name: string }> = {
      '3001': { name: 'Brick 2 x 4' },
      '3023': { name: 'Plate 1 x 2' },
      '60594': { name: 'Window 1 x 2 x 2' },
      'custom1': { name: 'Unindexed Custom Part' },
    };

    const { items } = buildLibraryIndex({
      userLibRaw: new Map(),
      userLibTitles: new Map(),
      embeddedDatRaw: new Map(),
      embeddedDatTitles: new Map(),
      builtInCatalog,
      modelPartIds: new Set(),
      missingShapePartIds: new Set(),
      missingExactDatPartIds: new Set(),
      resolveName: (id) => builtInCatalog[id]?.name ?? id,
      partColors: partColors.byPart,
    });

    // Sand Green (378) returns only 3001 & 3023 (excludes 60594 and unindexed custom1)
    expect(filterLibraryItems(items, { availableColorId: 378 }).map((i) => i.id)).toEqual(['3001', '3023']);
    // Composes with category filter
    expect(
      filterLibraryItems(items, { availableColorId: 378, category: 'plates' }).map((i) => i.id),
    ).toEqual(['3023']);
    // Composes with search query
    expect(
      filterLibraryItems(items, { availableColorId: 15, query: 'window' }).map((i) => i.id),
    ).toEqual(['60594']);
    // Null color filter returns all parts including unindexed ones
    expect(filterLibraryItems(items, { availableColorId: null }).length).toBe(4);
  });

  it('bundled public/parts-catalog/part-colors.json is valid and covers classic LEGO parts & colors', () => {
    const root = path.resolve(__dirname, '../../..');
    const file = path.join(root, 'public', PART_COLORS_FILE);
    expect(fs.existsSync(file)).toBe(true);
    const parsed = parsePartColorsPayload(JSON.parse(fs.readFileSync(file, 'utf8')));
    expect(parsed.byPart.size).toBeGreaterThan(5000);
    expect(parsed.partCountByColor.size).toBeGreaterThan(100);
    // Brick 2 x 4 (3001) is produced in Red (4), White (15), Sand Green (378), Olive Green (330)
    expect(parsed.byPartSet.get('3001')?.has(4)).toBe(true);
    expect(parsed.byPartSet.get('3001')?.has(15)).toBe(true);
    expect(parsed.byPartSet.get('3001')?.has(378)).toBe(true);
    expect(parsed.byPartSet.get('3001')?.has(330)).toBe(true);
    // Window 1 x 2 x 2 (60594) is produced in White (15) but not Sand Green (378)
    expect(parsed.byPartSet.get('60594')?.has(15)).toBe(true);
    expect(parsed.byPartSet.get('60594')?.has(378)).toBe(false);
  });
});
