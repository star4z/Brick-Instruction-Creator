import { describe, expect, it } from 'vitest';
import {
  ONLINE_STARTER_PACKS,
  buildLibraryColorPalette,
  buildLibraryIndex,
  classifyDatEntryKind,
  classifyLDrawColorGroup,
  classifyLibraryCategory,
  computeStarterPackProgress,
  computeViewportPopoverPlacement,
  extractFetchablePartIdFromQuery,
  filterLibraryItems,
  formatLibraryMenuSummary,
  getAllStarterPackPartIds,
  getModelFetchCopy,
  normalizeLibrarySearchText,
  parsePartIdListInput,
  sortLDrawColorIdsPerceptually,
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
      expect(classifyDatEntryKind('stug-1x4', [])).toBe('primitive');
      expect(classifyDatEntryKind('stug2-2x2', [])).toBe('primitive');
      expect(classifyDatEntryKind('cylj4x6', [])).toBe('primitive');
      expect(classifyDatEntryKind('boxjcyl4', [])).toBe('primitive');
      expect(classifyDatEntryKind('clip13', [])).toBe('primitive');
      expect(classifyDatEntryKind('bump5000', [])).toBe('primitive');
      expect(classifyDatEntryKind('1-4cyls', [])).toBe('primitive');
      expect(classifyDatEntryKind('3001', ['0 Brick 2 x 4'])).toBe('part');
      expect(classifyDatEntryKind('3069b', ['0 Tile 1 x 2'])).toBe('part');
      expect(classifyDatEntryKind('helper', ['0 ~Moved to 3069b'], '~Moved to 3069b')).toBe('subpart');
    });

    it('detects Studio-flattened 48/, 8/, p/, and s/ paths from 0 Name: headers when !LDRAW_ORG is stripped', () => {
      expect(
        classifyDatEntryKind('confric5', [
          '0 Hi-Res Technic Friction Pin 1.0',
          '0 Name: 48\\confric5.dat',
          '0 IsSubModel False',
        ]),
      ).toBe('primitive');
      expect(
        classifyDatEntryKind('axl2hole', [
          '0 Hi-Res Technic Axle Hole Reduced Closed',
          '0 Name: 48\\axl2hole.dat',
          '0 IsSubModel False',
        ]),
      ).toBe('primitive');
      expect(
        classifyDatEntryKind('customprim', [
          '0 Custom Primitive',
          '0 Name: 8\\customprim.dat',
          '0 IsSubModel False',
        ]),
      ).toBe('primitive');
      expect(
        classifyDatEntryKind('17485s01', [
          '0 Brick 2 x 2 Round Subpart',
          '0 Name: s\\17485s01.dat',
          '0 IsSubModel False',
        ]),
      ).toBe('subpart');
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

    it('classifies unplaced internal embedded .io subfile dependencies as helpers rather than embedded parts', () => {
      const embeddedDatRaw = new Map<string, string[]>([
        [
          '3001',
          [
            '0 Brick 2 x 4',
            '0 IsSubModel False',
            '0 BL_Item_No 3001',
            '1 16 0 0 0 1 0 0 0 1 0 0 0 1 stug-2x4.dat',
            '1 16 0 0 0 1 0 0 0 1 0 0 0 1 custom_internal_helper.dat',
          ],
        ],
        [
          'stug-2x4',
          ['0 Stud Group 2 x 4', '0 Name: stug-2x4.dat', '0 IsSubModel False'],
        ],
        [
          'custom_internal_helper',
          ['0 Internal Geometry Helper', '0 Name: custom_internal_helper.dat', '0 IsSubModel False'],
        ],
      ]);
      const embeddedDatTitles = new Map<string, string>([
        ['3001', 'Brick 2 x 4'],
        ['stug-2x4', 'Stud Group 2 x 4'],
        ['custom_internal_helper', 'Internal Geometry Helper'],
      ]);

      const { items, stats } = buildLibraryIndex({
        userLibRaw: new Map(),
        userLibTitles: new Map(),
        embeddedDatRaw,
        embeddedDatTitles,
        builtInCatalog: {},
        modelPartIds: new Set(['3001']),
        missingShapePartIds: new Set(),
        missingExactDatPartIds: new Set(),
        resolveName: (id) => embeddedDatTitles.get(id) || id,
      });

      expect(stats.modelUniqueParts).toBe(1);
      expect(stats.embeddedParts).toBe(1);
      expect(stats.embeddedHelpers).toBe(2);
      expect(filterLibraryItems(items, { scope: 'embedded' }).map((i) => i.id)).toEqual(['3001']);
      expect(
        filterLibraryItems(items, { scope: 'embedded', includeHelpers: true }).map((i) => i.id).sort(),
      ).toEqual(['3001', 'custom_internal_helper', 'stug-2x4']);
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
      ).toBe('3 missing · 15 downloaded');
    });

    it('extracts direct subfile refs and filters specifically to referenced subfiles including helpers', () => {
      const userLibRaw = new Map<string, string[]>([
        [
          '3001',
          [
            '0 Brick 2 x 4',
            '0 !LDRAW_ORG Part',
            '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s\\3001s01.dat',
            '1 16 0 0 0 1 0 0 0 1 0 0 0 1 stud.dat',
          ],
        ],
        ['s/3001s01', ['0 ~Brick 2 x 4 Subpart', '0 !LDRAW_ORG Subpart']],
        ['stud', ['0 Stud', '0 !LDRAW_ORG Primitive']],
        ['3005', ['0 Brick 1 x 1', '0 !LDRAW_ORG Part']],
      ]);
      const { items } = buildLibraryIndex({
        userLibRaw,
        userLibTitles: new Map(),
        embeddedDatRaw: new Map(),
        embeddedDatTitles: new Map(),
        builtInCatalog: {},
        modelPartIds: new Set(),
        missingShapePartIds: new Set(),
        missingExactDatPartIds: new Set(),
        resolveName: (id) => id,
      });
      const b3001 = items.find((it) => it.id === '3001');
      expect(b3001?.subfileRefs).toEqual(['s/3001s01', 'stud']);

      // Filtering by onlyIds shows referenced subparts & primitives even when includeHelpers is false
      const subfiles = filterLibraryItems(items, {
        includeHelpers: false,
        onlyIds: new Set(b3001?.subfileRefs || []),
      });
      expect(subfiles.map((it) => it.id).sort()).toEqual(['s/3001s01', 'stud']);
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

  describe('LDraw preview color palette', () => {
    const sampleColors = {
      0: { name: 'Black', hex: '#1e2126' },
      4: { name: 'Red', hex: '#c91a09' },
      15: { name: 'White', hex: '#f6f7f9' },
      41: { name: 'Trans-Light Blue', hex: '#7ec8f2', alpha: 0.44 },
      71: { name: 'Light Bluish Gray', hex: '#a0a5a9' },
      256: { name: 'Rubber Black', hex: '#212121' },
      297: { name: 'Pearl Gold', hex: '#aa7f2e' },
      378: { name: 'Sand Green', hex: '#a0bcac' },
    };

    it('classifies LDraw colors into solid, transparent, metallic, and special finish groups', () => {
      expect(classifyLDrawColorGroup(sampleColors[4])).toBe('solid');
      expect(classifyLDrawColorGroup(sampleColors[41])).toBe('transparent');
      expect(classifyLDrawColorGroup(sampleColors[297])).toBe('metallic');
      expect(classifyLDrawColorGroup(sampleColors[256])).toBe('special');
    });

    it('surfaces an In Current Model section sorted by usage count and supports name/ID search', () => {
      const sections = buildLibraryColorPalette(sampleColors, {
        modelColorCounts: new Map([
          [378, 12],
          [71, 45],
        ]),
      });

      expect(sections[0]?.id).toBe('model');
      expect(sections[0]?.colors.map((c) => c.id)).toEqual([71, 378]);
      expect(sections.map((s) => s.id)).toEqual(['model', 'solid', 'transparent', 'metallic', 'special']);

      // Neutrals in Solid are ordered White -> Light Bluish Gray -> Black before chromatic hues
      const solidIds = sections.find((s) => s.id === 'solid')?.colors.map((c) => c.id) ?? [];
      expect(solidIds.slice(0, 3)).toEqual([15, 71, 0]);

      // Search by name
      const byName = buildLibraryColorPalette(sampleColors, { query: 'sand' });
      expect(byName.flatMap((s) => s.colors.map((c) => c.id))).toEqual([378]);

      // Search by LDraw numeric ID (with or without #)
      const byId = buildLibraryColorPalette(sampleColors, { query: '#297' });
      expect(byId.flatMap((s) => s.colors.map((c) => c.id))).toEqual([297]);
    });

    it('filters palette to colors with available parts and sorts part color IDs perceptually', () => {
      const counts = new Map<number, number>([
        [4, 1500],
        [378, 412],
        [297, 89],
      ]);
      const sections = buildLibraryColorPalette(sampleColors, {
        availablePartCounts: counts,
        onlyAvailable: true,
      });
      const flat = sections.flatMap((s) => s.colors);
      expect(flat.map((c) => c.id).sort((a, b) => a - b)).toEqual([4, 297, 378]);
      expect(flat.find((c) => c.id === 378)?.availablePartCount).toBe(412);

      // Neutrals (White 15 -> LBG 71 -> Black 0) sort ahead of chromatic colors (Red 4, Sand Green 378)
      expect(sortLDrawColorIdsPerceptually([4, 0, 378, 15, 71, 99999], sampleColors).slice(0, 3)).toEqual([
        15,
        71,
        0,
      ]);
    });
  });

  describe('computeViewportPopoverPlacement', () => {
    it('places below and right-aligned on desktop viewports with ample room', () => {
      const p = computeViewportPopoverPlacement(
        { top: 280, right: 950, bottom: 308, left: 820 },
        { width: 1440, height: 900 },
      );
      expect(p.placement).toBe('below');
      expect(p.top).toBe(314);
      expect(p.bottom).toBeNull();
      expect(p.width).toBe(336);
      expect(p.left).toBe(614);
      expect(p.maxHeight).toBe(460);
    });

    it('clamps maxHeight to remaining viewport space below the trigger on mobile portrait', () => {
      const p = computeViewportPopoverPlacement(
        { top: 400, right: 370, bottom: 428, left: 230 },
        { width: 390, height: 844 },
      );
      expect(p.placement).toBe('below');
      expect(p.top).toBe(434);
      expect(p.bottom).toBeNull();
      expect(p.top! + p.maxHeight).toBeLessThanOrEqual(844 - 12);
      expect(p.maxHeight).toBe(398);
      expect(p.left).toBeGreaterThanOrEqual(12);
      expect(p.left + p.width).toBeLessThanOrEqual(390 - 12);
    });

    it('flips above the trigger when a virtual keyboard shrinks visualViewport height below the button', () => {
      const p = computeViewportPopoverPlacement(
        { top: 400, right: 370, bottom: 428, left: 230 },
        { width: 390, height: 470, layoutHeight: 844 },
      );
      expect(p.placement).toBe('above');
      expect(p.top).toBeNull();
      expect(p.bottom).toBe(844 - (400 - 6));
      expect(p.maxHeight).toBe(382);
    });

    it('uses the full viewport height on short landscape screens when neither above nor below has comfortable room', () => {
      const p = computeViewportPopoverPlacement(
        { top: 180, right: 540, bottom: 208, left: 400 },
        { width: 844, height: 360 },
      );
      expect(p.placement).toBe('viewport');
      expect(p.top).toBe(12);
      expect(p.bottom).toBeNull();
      expect(p.maxHeight).toBe(336);
    });

    it('clamps width and horizontal position inside narrow viewports', () => {
      const p = computeViewportPopoverPlacement(
        { top: 100, right: 200, bottom: 128, left: 60 },
        { width: 320, height: 568 },
      );
      expect(p.width).toBe(296);
      expect(p.left).toBe(12);
      expect(p.left + p.width).toBe(308);
    });
  });
});

