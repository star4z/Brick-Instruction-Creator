import { describe, expect, it } from 'vitest';
import {
  ONLINE_STARTER_PACKS,
  buildLibraryIndex,
  classifyDatEntryKind,
  classifyLibraryCategory,
  computeStarterPackProgress,
  extractFetchablePartIdFromQuery,
  filterLibraryItems,
  formatLibraryMenuSummary,
  getAllStarterPackPartIds,
  getModelFetchCopy,
  normalizeLibrarySearchText,
  parsePartIdListInput,
} from '../bricksLibrary';

describe('bricksLibrary engine', () => {
  describe('classifyDatEntryKind', () => {
    it('uses !LDRAW_ORG headers when available', () => {
      expect(classifyDatEntryKind('3001', ['0 Brick  2 x  4', '0 !LDRAW_ORG Part UPDATE 2022-01'])).toBe('part');
      expect(classifyDatEntryKind('s/3001s01', ['0 ~Brick 2 x 4 Underside', '0 !LDRAW_ORG Subpart'])).toBe('subpart');
      expect(classifyDatEntryKind('box5', ['0 Box without bottom', '0 !LDRAW_ORG Primitive'])).toBe('primitive');
      expect(classifyDatEntryKind('48/4-4cyli', ['0 Cylinder 1.0', '0 !LDRAW_ORG 48_Primitive'])).toBe('primitive');
    });

    it('falls back to path/name heuristics when headers are absent', () => {
      expect(classifyDatEntryKind('s/973s01', ['0 Torso subpart'])).toBe('subpart');
      expect(classifyDatEntryKind('48/1-4disc', [])).toBe('primitive');
      expect(classifyDatEntryKind('8/4-4edge', [])).toBe('primitive');
      expect(classifyDatEntryKind('box5', [])).toBe('primitive');
      expect(classifyDatEntryKind('4-4edge', [])).toBe('primitive');
      expect(classifyDatEntryKind('stud2a', [])).toBe('primitive');
      expect(classifyDatEntryKind('3001', ['0 Brick 2 x 4'])).toBe('part');
      expect(classifyDatEntryKind('3069b', ['0 Tile 1 x 2'])).toBe('part');
      expect(classifyDatEntryKind('helper', ['0 ~Moved to 3069b'], '~Moved to 3069b')).toBe('subpart');
    });
  });

  describe('buildLibraryIndex & stats breakdown', () => {
    it('separates top-level parts from subparts/primitives and deduplicates BL_Item_No aliases', () => {
      const brick3001Lines = ['0 Brick  2 x  4', '0 !LDRAW_ORG Part', '1 16 0 0 0 1 0 0 0 1 0 0 0 1 box5.dat'];
      const userLibRaw = new Map<string, string[]>([
        ['3001', brick3001Lines],
        ['bl_3001_alias', brick3001Lines], // alias referencing the same lines array
        ['3020', ['0 Plate  2 x  4', '0 !LDRAW_ORG Part']],
        ['s/3001s01', ['0 ~Brick 2 x 4 Underside', '0 !LDRAW_ORG Subpart']],
        ['box5', ['0 Box open bottom', '0 !LDRAW_ORG Primitive']],
      ]);
      const userLibTitles = new Map<string, string>([
        ['3001', 'Brick  2 x  4'],
        ['3020', 'Plate  2 x  4'],
        ['s/3001s01', '~Brick 2 x 4 Underside'],
        ['box5', 'Box open bottom'],
      ]);
      const builtInCatalog = {
        '3001': { name: 'Brick 2×4' },
        '3069b': { name: 'Tile 1×2' },
      };

      const { items, stats } = buildLibraryIndex({
        userLibRaw,
        userLibTitles,
        embeddedDatRaw: new Map(),
        embeddedDatTitles: new Map(),
        builtInCatalog,
        modelPartIds: new Set(['3001', '99999']),
        missingShapePartIds: new Set(['99999']),
        missingExactDatPartIds: new Set(['99999']),
        resolveName: (id) => userLibTitles.get(id) || builtInCatalog[id as keyof typeof builtInCatalog]?.name || `Part ${id.toUpperCase()}`,
        savedTextureCount: 2,
      });

      // 2 real saved parts + 2 helpers = 4 saved files (alias is not double-counted!)
      expect(stats.savedParts).toBe(2);
      expect(stats.savedHelpers).toBe(2);
      expect(stats.savedTotalFiles).toBe(4);
      expect(stats.savedTextures).toBe(2);
      expect(stats.builtInParts).toBe(2);
      expect(stats.modelMissingShapeCount).toBe(1);

      const b3001 = items.find((x) => x.id === '3001');
      expect(b3001?.sources).toEqual(['saved', 'builtin']);
      expect(b3001?.primarySource).toBe('saved');
      expect(b3001?.subpartRefCount).toBe(1);
      expect(b3001?.inCurrentModel).toBe(true);

      const missing = items.find((x) => x.id === '99999');
      expect(missing?.primarySource).toBe('missing');
      expect(missing?.isMissingInModel).toBe(true);
    });
  });

  describe('search & filtering', () => {
    const sampleIndex = buildLibraryIndex({
      userLibRaw: new Map([
        ['3001', ['0 Brick  2 x  4', '0 !LDRAW_ORG Part']],
        ['3040b', ['0 Slope Brick 45  2 x  1', '0 !LDRAW_ORG Part']],
        ['s/3001s01', ['0 ~Brick 2 x 4 Sub', '0 !LDRAW_ORG Subpart']],
        ['box5', ['0 Box5', '0 !LDRAW_ORG Primitive']],
      ]),
      userLibTitles: new Map([
        ['3001', 'Brick  2 x  4'],
        ['3040b', 'Slope Brick 45  2 x  1'],
        ['s/3001s01', '~Brick 2 x 4 Sub'],
        ['box5', 'Box5'],
      ]),
      embeddedDatRaw: new Map([['3626cp01', ['0 Minifig Head Smile', '0 !LDRAW_ORG Part']]]),
      embeddedDatTitles: new Map([['3626cp01', 'Minifig Head Smile']]),
      builtInCatalog: {
        '3001': { name: 'Brick 2×4' },
        '3069b': { name: 'Tile 1×2' },
      },
      modelPartIds: new Set(['3001', '3626cp01', '88888']),
      missingShapePartIds: new Set(['88888']),
      missingExactDatPartIds: new Set(['88888']),
      resolveName: (id) => {
        if (id === '3001') return 'Brick  2 x  4';
        if (id === '3040b') return 'Slope Brick 45  2 x  1';
        if (id === '3626cp01') return 'Minifig Head Smile';
        if (id === '3069b') return 'Tile 1×2';
        return `Part ${id.toUpperCase()}`;
      },
    }).items;

    it('hides subparts and primitives by default and shows them when includeHelpers is true', () => {
      const defaultResults = filterLibraryItems(sampleIndex, {});
      expect(defaultResults.some((i) => i.id === 'box5')).toBe(false);
      expect(defaultResults.some((i) => i.id === 's/3001s01')).toBe(false);

      const withHelpers = filterLibraryItems(sampleIndex, { includeHelpers: true });
      expect(withHelpers.some((i) => i.id === 'box5')).toBe(true);
      expect(withHelpers.some((i) => i.id === 's/3001s01')).toBe(true);
    });

    it('matches dimensions flexibly across 2x4, 2×4, and 2 x 4', () => {
      expect(normalizeLibrarySearchText('Brick  2 x  4')).toBe('brick 2x4');
      expect(normalizeLibrarySearchText('Tile 1×2')).toBe('tile 1x2');

      const results = filterLibraryItems(sampleIndex, { query: 'brick 2x4' });
      expect(results.map((r) => r.id)).toEqual(['3001']);
    });

    it('ranks exact ID matches first and supports scope + category filters', () => {
      const byId = filterLibraryItems(sampleIndex, { query: '3001' });
      expect(byId[0]?.id).toBe('3001');

      const savedOnly = filterLibraryItems(sampleIndex, { scope: 'saved' });
      expect(savedOnly.map((r) => r.id).sort()).toEqual(['3001', '3040b']);

      const embeddedOnly = filterLibraryItems(sampleIndex, { scope: 'embedded' });
      expect(embeddedOnly.map((r) => r.id)).toEqual(['3626cp01']);

      const missingOnly = filterLibraryItems(sampleIndex, { scope: 'missing' });
      expect(missingOnly.map((r) => r.id)).toEqual(['88888']);

      const slopesOnly = filterLibraryItems(sampleIndex, { category: 'slopes' });
      expect(slopesOnly.map((r) => r.id)).toEqual(['3040b']);
    });
  });

  describe('starter packs & input parsing', () => {
    it('provides curated starter packs with over 100 unique parts', () => {
      const allIds = getAllStarterPackPartIds();
      expect(ONLINE_STARTER_PACKS.length).toBeGreaterThanOrEqual(4);
      expect(allIds.length).toBeGreaterThanOrEqual(100);
      expect(new Set(allIds).size).toBe(allIds.length);
    });

    it('tracks starter pack progress accurately', () => {
      const pack = ONLINE_STARTER_PACKS[0];
      const saved = new Set(['3001', '3002', '3020']);
      const progress = computeStarterPackProgress(pack, (id) => saved.has(id));
      expect(progress.savedCount).toBe(3);
      expect(progress.totalCount).toBe(pack.partIds.length);
      expect(progress.missingIds.length).toBe(pack.partIds.length - 3);
      expect(progress.missingIds).not.toContain('3001');
    });

    it('parses custom part ID lists cleanly', () => {
      expect(parsePartIdListInput('3001, parts/3069b.dat\n 3626c; 3001')).toEqual([
        '3001',
        '3069b',
        '3626c',
      ]);
    });

    it('detects fetchable part IDs in search queries while ignoring plain words', () => {
      expect(extractFetchablePartIdFromQuery('3001')).toBe('3001');
      expect(extractFetchablePartIdFromQuery('3626cp01.dat')).toBe('3626cp01');
      expect(extractFetchablePartIdFromQuery('brick')).toBeNull();
      expect(extractFetchablePartIdFromQuery('brick 2x4')).toBeNull();
    });
  });

  describe('context-aware UI copy', () => {
    it('never offers an active "Fetch Missing Parts" CTA when no model is loaded', () => {
      const copy = getModelFetchCopy({
        hasModel: false,
        missingShapeCount: 0,
        missingExactDatCount: 0,
      });
      expect(copy.status).toBe('no_model');
      expect(copy.buttonEnabled).toBe(false);
      expect(copy.heading).toContain('No Model');
    });

    it('clearly explains missing parts when a model is loaded', () => {
      const copy = getModelFetchCopy({
        hasModel: true,
        modelTitle: 'Starfighter',
        missingShapeCount: 5,
        missingExactDatCount: 8,
      });
      expect(copy.status).toBe('missing_shapes');
      expect(copy.buttonEnabled).toBe(true);
      expect(copy.buttonLabel).toContain('8');
      expect(copy.description).toContain('5 parts');
    });

    it('offers exact LDraw upgrades when all shapes are covered by built-in approximations', () => {
      const copy = getModelFetchCopy({
        hasModel: true,
        modelTitle: 'Cottage',
        missingShapeCount: 0,
        missingExactDatCount: 4,
      });
      expect(copy.status).toBe('can_upgrade');
      expect(copy.buttonEnabled).toBe(true);
      expect(copy.buttonLabel).toContain('4 Exact LDraw');
    });

    it('shows complete state when all model parts have exact shapes', () => {
      const copy = getModelFetchCopy({
        hasModel: true,
        modelTitle: 'Rover',
        missingShapeCount: 0,
        missingExactDatCount: 0,
      });
      expect(copy.status).toBe('complete');
      expect(copy.buttonEnabled).toBe(false);
    });

    it('formats concise menu summary text', () => {
      expect(
        formatLibraryMenuSummary({
          savedParts: 0,
          savedHelpers: 0,
          savedTotalFiles: 0,
          savedTextures: 0,
          embeddedParts: 0,
          embeddedHelpers: 0,
          builtInParts: 95,
          modelUniqueParts: 0,
          modelMissingShapeCount: 0,
          modelMissingExactDatCount: 0,
          catalogOfficialParts: 0,
          catalogUnofficialParts: 0,
        }),
      ).toBe('95 built-in');

      expect(
        formatLibraryMenuSummary({
          savedParts: 15,
          savedHelpers: 19,
          savedTotalFiles: 34,
          savedTextures: 0,
          embeddedParts: 0,
          embeddedHelpers: 0,
          builtInParts: 95,
          modelUniqueParts: 20,
          modelMissingShapeCount: 3,
          modelMissingExactDatCount: 3,
          catalogOfficialParts: 0,
          catalogUnofficialParts: 0,
        }),
      ).toBe('3 missing · 15 saved');
    });

    it('classifies categories sensibly', () => {
      expect(classifyLibraryCategory('3001', 'Brick 2 x 4')).toBe('bricks');
      expect(classifyLibraryCategory('3020', 'Plate 2 x 4')).toBe('plates');
      expect(classifyLibraryCategory('3069b', 'Tile 1 x 2')).toBe('tiles');
      expect(classifyLibraryCategory('54200', 'Cheese Slope 1 x 1')).toBe('slopes');
      expect(classifyLibraryCategory('3705', 'Technic Axle 4L')).toBe('technic');
      expect(classifyLibraryCategory('3626c', 'Minifigure Head')).toBe('minifigs');
      expect(classifyLibraryCategory('60594', 'Window Frame 1 x 4 x 3')).toBe('windows');
    });
  });
});
