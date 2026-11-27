import { describe, expect, it } from 'vitest';
import {
  classifyEnclosurePart,
  detectInlineSubassemblies,
  type InlineSubassemblyBox,
  type InlineSubassemblyPartInput,
} from '../inlineSubassemblies';

function makeBox(
  minX: number,
  minY: number,
  minZ: number,
  maxX: number,
  maxY: number,
  maxZ: number,
): InlineSubassemblyBox {
  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
    center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
  };
}

describe('inlineSubassemblies', () => {
  it('classifies official LDraw book, chest, laptop, suitcase, and container base/cover parts', () => {
    expect(classifyEnclosurePart('24324.dat', 'Minifig Book Base with Two Studs')).toMatchObject({
      family: 'book',
      partKind: 'base',
      displayName: 'Book',
    });
    expect(classifyEnclosurePart('24093p02', 'Minifig Book Cover "MOBY BRICK"')).toMatchObject({
      family: 'book',
      partKind: 'cover',
      displayName: 'Book',
    });
    expect(classifyEnclosurePart('4738a', 'Container Treasure Chest with Slots')).toMatchObject({
      family: 'chest',
      partKind: 'base',
      displayName: 'Treasure Chest',
    });
    expect(classifyEnclosurePart('4739a', 'Container Treasure Chest with Slots Lid')).toMatchObject({
      family: 'chest',
      partKind: 'cover',
      displayName: 'Treasure Chest',
    });
    expect(classifyEnclosurePart('62698k01', 'Minifig Computer Laptop Keyboard')).toMatchObject({
      family: 'laptop',
      partKind: 'base',
      displayName: 'Laptop',
    });
    expect(classifyEnclosurePart('62698k03', 'Minifig Computer Laptop Screen')).toMatchObject({
      family: 'laptop',
      partKind: 'cover',
      displayName: 'Laptop',
    });
    // Rejects stickers, bookcases, panels, and pre-assembled shortcuts
    expect(classifyEnclosurePart('33009-f1', 'Minifig Book (Closed)')).toBeNull();
    expect(classifyEnclosurePart('1', 'Container Bookcase 2 x 4 x 4')).toBeNull();
    expect(classifyEnclosurePart('60581dm0', 'Panel 1 x 4 x 3 with Books Sticker')).toBeNull();
  });

  it('groups a 24324 book base, 24093 book cover, and enclosed 1x2 page tile into ONE inline Book subassembly without absorbing exterior wall tiles', () => {
    const parts: InlineSubassemblyPartInput[] = [
      // 0: Table plate supporting the book
      { index: 0, partId: '3020', partName: 'Plate 2 x 4', role: 'structural', box: makeBox(-40, 0, -20, 40, 8, 20) },
      // 1: Book Base sitting on the table
      { index: 1, partId: '24324', partName: 'Minifig Book Base with Two Studs', role: 'structural', box: makeBox(-12, 8, -18, 12, 16, 18) },
      // 2: Book Cover hinged onto the Book Base
      { index: 2, partId: '24093', partName: 'Minifig Book Cover', role: 'detail', box: makeBox(-14, 8, -18, 14, 34, 18) },
      // 3: 1x2 Page Tile studded inside the book
      { index: 3, partId: '3069b', partName: 'Tile 1 x 2 with Groove', role: 'structural', box: makeBox(-8, 16, -16, 8, 24, 16) },
      // 4: Adjacent wall brick next to the table
      { index: 4, partId: '3004', partName: 'Brick 1 x 2', role: 'structural', box: makeBox(40, 0, -20, 60, 24, 20) },
      // 5: Exterior wall tile on top of the wall brick (NOT inside the book)
      { index: 5, partId: '3069b', partName: 'Tile 1 x 2 with Groove', role: 'structural', box: makeBox(40, 24, -20, 60, 32, 20) },
    ];
    const adj: number[][] = [
      [1, 4],       // 0: table touches book base & wall brick
      [0, 2, 3],    // 1: book base touches table, cover, page tile
      [1],          // 2: book cover touches base
      [1],          // 3: page tile touches base
      [0, 5],       // 4: wall brick touches table & wall tile
      [4],          // 5: wall tile touches wall brick
    ];
    const belowMap: number[][] = [
      [],           // 0
      [0],          // 1: book base rests on table
      [1],          // 2: cover above base
      [1],          // 3: page tile above base
      [],           // 4
      [4],          // 5: wall tile rests on wall brick
    ];

    const clusters = detectInlineSubassemblies(parts, adj, belowMap);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].family).toBe('book');
    expect(clusters[0].name).toBe('Book');
    expect(clusters[0].baseIndex).toBe(1);
    expect(clusters[0].partIndices).toEqual([1, 2, 3]);
  });

  it('pairs a book base and cover even across a small CAD clearance gap without an adj edge', () => {
    const parts: InlineSubassemblyPartInput[] = [
      { index: 0, partId: '24324', partName: 'Minifig Book Base with Two Studs', role: 'structural', box: makeBox(0, 0, 0, 20, 8, 30) },
      { index: 1, partId: '24093', partName: 'Minifig Book Cover', role: 'detail', box: makeBox(0, 11, 0, 20, 35, 30) },
    ];
    const clusters = detectInlineSubassemblies(parts, [[], []], [[], []]);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].partIndices).toEqual([0, 1]);
  });

  it('pairs multiple books 1-to-1 by nearest distance without cross-pairing', () => {
    const parts: InlineSubassemblyPartInput[] = [
      // Book A at X = 0
      { index: 0, partId: '24324', partName: 'Minifig Book Base with Two Studs', role: 'structural', box: makeBox(0, 0, 0, 20, 8, 30) },
      { index: 1, partId: '24093', partName: 'Minifig Book Cover', role: 'detail', box: makeBox(0, 8, 0, 20, 32, 30) },
      // Book B at X = 120
      { index: 2, partId: '24324', partName: 'Minifig Book Base with Two Studs', role: 'structural', box: makeBox(120, 0, 0, 140, 8, 30) },
      { index: 3, partId: '24093', partName: 'Minifig Book Cover', role: 'detail', box: makeBox(120, 8, 0, 140, 32, 30) },
    ];
    const clusters = detectInlineSubassemblies(parts, [[1], [0], [3], [2]], [[], [0], [], [2]]);
    expect(clusters).toHaveLength(2);
    expect(clusters.map((c) => c.partIndices)).toEqual([
      [0, 1],
      [2, 3],
    ]);
  });

  it('skips an enclosure if an external structural brick rests vertically on top of it', () => {
    const parts: InlineSubassemblyPartInput[] = [
      { index: 0, partId: '4738a', partName: 'Container Treasure Chest with Slots', role: 'structural', box: makeBox(0, 0, 0, 40, 24, 30) },
      { index: 1, partId: '4739a', partName: 'Container Treasure Chest with Slots Lid', role: 'detail', box: makeBox(0, 24, 0, 40, 40, 30) },
      { index: 2, partId: '3001', partName: 'Brick 2 x 4', role: 'structural', box: makeBox(0, 40, 0, 40, 64, 30) },
    ];
    const adj = [[1], [0, 2], [1]];
    const belowMap = [[], [0], [1]]; // External brick 2 rests on lid 1!
    expect(detectInlineSubassemblies(parts, adj, belowMap)).toHaveLength(0);
  });

  it('respects excludedIndices (e.g. minifigure-claimed or duplicate-submodel parts)', () => {
    const parts: InlineSubassemblyPartInput[] = [
      { index: 0, partId: '24324', partName: 'Minifig Book Base with Two Studs', role: 'structural', box: makeBox(0, 0, 0, 20, 8, 30) },
      { index: 1, partId: '24093', partName: 'Minifig Book Cover', role: 'detail', box: makeBox(0, 8, 0, 20, 32, 30) },
    ];
    const clusters = detectInlineSubassemblies(parts, [[1], [0]], [[], [0]], {
      excludedIndices: new Set([0, 1]),
    });
    expect(clusters).toHaveLength(0);
  });
});
