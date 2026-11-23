import { describe, expect, it } from 'vitest';
import {
  analyzeMissingParts,
  isBrickLinkProprietaryId,
  isOfficialLDrawPatternId,
  normalizePartId,
} from '../missingParts';

describe('missingParts — pre-import detection', () => {
  it('returns shouldPrompt=false when all parts have exact embedded .dat shapes and textures', () => {
    const embedded = new Map([
      ['3001', { key: '3001', lines: ['3 16 0 0 0 1 0 0 0 1 0'] }],
      ['bl_3626pb3988', { key: 'bl_3626pb3988', lines: ['0 PE_TEX_INFO iVBORw0KGgo='] }],
    ]);

    const res = analyzeMissingParts(
      [{ p: '3001.dat' }, { p: 'bl_3626pb3988.dat' }],
      {
        lookupExactRawDat: (k) => embedded.get(k) || null,
        hasKnownShape: () => true,
        getPartIdFallbacks: () => [],
        hasTexture: () => true,
      },
    );

    expect(res.shouldPrompt).toBe(false);
    expect(res.totalMissingUnique).toBe(0);
    expect(res.fetchableCount).toBe(0);
  });

  it('flags missing unknown 3D shapes and separates fetchable LDraw parts from Studio-only custom IDs', () => {
    const res = analyzeMissingParts(
      [
        { p: '30236.dat' },
        { p: '30236.dat' },
        { p: '61409.dat' },
        { p: 'bb1234.dat' },
        { p: '3001.dat' }, // known via procedural catalog
      ],
      {
        lookupExactRawDat: () => null,
        hasKnownShape: (k) => k === '3001',
        getPartIdFallbacks: () => [],
        hasTexture: () => false,
      },
    );

    expect(res.shouldPrompt).toBe(true);
    expect(res.missingShapes.map((m) => [m.partId, m.count, m.fetchable])).toEqual([
      ['30236', 2, true],
      ['61409', 1, true],
      ['bb1234', 1, false],
    ]);
    expect(res.fetchableCount).toBe(2);
    expect(res.customOnlyCount).toBe(1);
    expect(res.totalMissingInstances).toBe(4);
  });

  it('detects missing official LDraw printed heads/torsos even when blank procedural base molds exist', () => {
    const res = analyzeMissingParts(
      [
        {
          p: 'minifig_1',
          children: [
            { p: '3626cp01.dat' },
            { p: '3626cpb7.dat' },
            { p: '973p1b.dat' },
            { p: 'bl_3626pb3988.dat' }, // BrickLink proprietary, base 3626c is known
          ],
        },
      ],
      {
        lookupExactRawDat: () => null,
        hasKnownShape: () => true,
        getPartIdFallbacks: (k) => (k.includes('3626') ? ['3626c', '3626'] : ['973']),
        hasTexture: () => false,
      },
    );

    expect(res.shouldPrompt).toBe(true);
    expect(res.missingShapes).toEqual([]);
    expect(res.missingPrinted.map((m) => m.partId)).toEqual(['3626cp01', '3626cpb7', '973p1b']);
    expect(res.fetchableCount).toBe(3);
  });

  it('detects missing !TEXMAP PNG textures referenced by already-loaded .dat parts and subparts', () => {
    const loaded = new Map([
      [
        '3626cpx0',
        {
          key: '3626cpx0',
          lines: [
            '0 !TEXMAP START PLANAR -13 0 10 13 0 10 -13 21 10 3626cpx0a.png',
            '0 !: 1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/3626cpx0s01.dat',
            '0 !TEXMAP END',
          ],
        },
      ],
      [
        's/3626cpx0s01',
        {
          key: 's/3626cpx0s01',
          lines: [
            '0 !TEXMAP NEXT CYLINDRICAL 0 0 0 0 -24 0 0 0 -10 180 3626cpx0b.png',
          ],
        },
      ],
    ]);

    const res = analyzeMissingParts([{ p: '3626cpx0.dat' }], {
      lookupExactRawDat: (k) => loaded.get(k) || null,
      hasKnownShape: () => true,
      getPartIdFallbacks: () => [],
      hasTexture: (name) => name === '3626cpx0b.png',
    });

    expect(res.shouldPrompt).toBe(true);
    expect(res.missingTextures).toEqual(['3626cpx0a.png']);
    expect(res.fetchableCount).toBe(1);
  });

  it('distinguishes BrickLink proprietary IDs from official LDraw pattern IDs', () => {
    expect(normalizePartId('parts\\3626cpb7.DAT')).toBe('3626cpb7');
    expect(isOfficialLDrawPatternId('3626cp01')).toBe(true);
    expect(isOfficialLDrawPatternId('3626cpb7')).toBe(true);
    expect(isOfficialLDrawPatternId('3626cpx0')).toBe(true);
    expect(isOfficialLDrawPatternId('3069bp01')).toBe(true);
    expect(isOfficialLDrawPatternId('3001')).toBe(false);
    expect(isOfficialLDrawPatternId('3626c')).toBe(false);
    expect(isOfficialLDrawPatternId('3626cpb2451')).toBe(false);
    expect(isBrickLinkProprietaryId('3626cpb2451')).toBe(true);
    expect(isBrickLinkProprietaryId('bl_3626pb3988')).toBe(true);
    expect(isBrickLinkProprietaryId('3626cpb7')).toBe(false);
  });
});
