import { describe, expect, it } from 'vitest';
import {
  MANUAL_SNAPSHOT_SCHEMA_VERSION,
  NOT_FOUND_CACHE_TTL_MS,
  buildLibraryCandidateKeys,
  collectLeafPartIdsFromChapters,
  computeSourceSignature,
  deserializeEmbeddedModelAssets,
  deserializeNotFoundCache,
  isMatchingManualSnapshot,
  isRestorableManualSnapshot,
  serializeEmbeddedModelAssets,
  serializeNotFoundCache,
} from '../sessionCache';
import { textureStore } from '../textureStore';

describe('sessionCache', () => {
  it('computes deterministic source signatures that change when content or settings change', () => {
    const ab1 = new Uint8Array([1, 2, 3, 4, 5, 6]).buffer;
    const ab2 = new Uint8Array([1, 2, 3, 4, 5, 7]).buffer;
    const sig1 = computeSourceSignature({ kind: 'io', fileName: 'train.io', data: ab1, importMode: 'auto' });
    const sig1Again = computeSourceSignature({ kind: 'io', fileName: 'train.io', data: ab1, importMode: 'auto' });
    const sigDiffBytes = computeSourceSignature({ kind: 'io', fileName: 'train.io', data: ab2, importMode: 'auto' });
    const sigDiffMode = computeSourceSignature({ kind: 'io', fileName: 'train.io', data: ab1, importMode: 'keep' });

    expect(sig1).toBe(sig1Again);
    expect(sig1).not.toBe(sigDiffBytes);
    expect(sig1).not.toBe(sigDiffMode);

    const ldr1 = computeSourceSignature({ kind: 'ldr', fileName: 'car.ldr', data: '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat' });
    const ldr2 = computeSourceSignature({ kind: 'ldr', fileName: 'car.ldr', data: '1 1 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat' });
    expect(ldr1).not.toBe(ldr2);
  });

  it('round-trips embedded .dat geometry, titles, composite defs, and embedded textures', () => {
    const payload = serializeEmbeddedModelAssets({
      embeddedDatRaw: new Map([['custom_part', ['0 Custom Tile', '4 16 0 0 0 10 0 0 10 0 10 0 0 10']]]),
      embeddedDatTitles: new Map([['custom_part', 'Custom Tile 1 x 1']]),
      compositePartDefs: new Map([['asm_torso_1', { name: 'Minifig Torso Classic' }]]),
      embeddedTextures: [{ names: ['textures/face.png', 'face.png'], base64Png: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB' }],
    });

    const restored = deserializeEmbeddedModelAssets(payload);
    expect(restored.embeddedDat.get('custom_part')).toEqual([
      '0 Custom Tile',
      '4 16 0 0 0 10 0 0 10 0 10 0 0 10',
    ]);
    expect(restored.embeddedDatTitles.get('custom_part')).toBe('Custom Tile 1 x 1');
    expect(restored.compositePartDefs.get('asm_torso_1')).toEqual({ name: 'Minifig Torso Classic' });
    expect(restored.embeddedTextures).toHaveLength(1);
    expect(restored.embeddedTextures[0].names).toEqual(['textures/face.png', 'face.png']);
  });

  it('exports and re-imports embedded textures via textureStore without leaking library textures', () => {
    textureStore.clearAll();
    const embB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk';
    const libB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNk';
    textureStore.registerBase64Texture(embB64, { name: 'textures/decal.png', source: 'embedded' });
    textureStore.registerBase64Texture(libB64, { name: 'textures/lib_only.png', source: 'library' });

    const exported = textureStore.exportEmbeddedTextures();
    expect(exported).toHaveLength(1);
    expect(exported[0].base64Png).toBe(embB64);
    expect(exported[0].names).toContain('decal.png');

    textureStore.clearEmbedded();
    expect(textureStore.lookupByName('textures/decal.png')).toBeNull();
    expect(textureStore.lookupByName('textures/lib_only.png')).not.toBeNull();

    const keys = textureStore.importEmbeddedTextures(exported);
    expect(keys).toHaveLength(1);
    expect(textureStore.lookupByName('textures/decal.png')?.base64Png).toBe(embB64);
    textureStore.clearAll();
  });

  it('validates matching and standalone manual snapshots', () => {
    const snap = {
      schemaVersion: MANUAL_SNAPSHOT_SCHEMA_VERSION,
      sourceSignature: 'abc_123',
      kind: 'io' as const,
      fileName: 'model.io',
      title: 'Space Rover',
      chapters: [{ id: 'ch1', steps: [{ id: 's1', num: 1, parts: [] }] }],
      savedAt: Date.now(),
    };
    expect(isMatchingManualSnapshot(snap, 'abc_123')).toBe(true);
    expect(isMatchingManualSnapshot(snap, 'different')).toBe(false);
    expect(isMatchingManualSnapshot({ ...snap, schemaVersion: 999 }, 'abc_123')).toBe(false);
    expect(isRestorableManualSnapshot({ ...snap, kind: 'project' })).toBe(true);
    expect(isRestorableManualSnapshot({ ...snap, chapters: [] })).toBe(false);
  });

  it('collects unique leaf part IDs from chapters including fused children and nested submodels', () => {
    const chapters = [
      {
        steps: [
          {
            parts: [
              { p: '3001' },
              { p: 'asm_torso_1', children: [{ p: '973' }, { p: '3818' }, { p: '3819' }] },
            ],
            submodel: {
              steps: [{ parts: [{ p: '3001' }, { p: '3020' }] }],
            },
          },
        ],
      },
    ];
    expect(collectLeafPartIdsFromChapters(chapters)).toEqual(['3001', '973', '3818', '3819', '3020']);
  });

  it('builds IndexedDB candidate keys matching BrickLink/LDraw prefix and suffix variants', () => {
    expect(buildLibraryCandidateKeys('3001')).toEqual(['3001', 'bl_3001', '3001-bl']);
    expect(buildLibraryCandidateKeys('bl_973c01')).toEqual(['bl_973c01', 'bl_973c01-bl', '973c01']);
    expect(buildLibraryCandidateKeys('s/3001s01')).toEqual(['s/3001s01']);
  });

  it('persists notFoundDatCache with TTL pruning', () => {
    const now = 1_700_000_000_000;
    const map = new Map<string, number>([
      ['fresh_part', now - 1000],
      ['expired_part', now - NOT_FOUND_CACHE_TTL_MS - 1000],
    ]);
    const serialized = serializeNotFoundCache(map, now);
    expect(Object.keys(serialized)).toEqual(['fresh_part']);

    const restored = deserializeNotFoundCache(
      { fresh_part: now - 5000, expired_part: now - NOT_FOUND_CACHE_TTL_MS - 500, bad: 'nope' },
      now,
    );
    expect(Array.from(restored.keys())).toEqual(['fresh_part']);
  });
});
