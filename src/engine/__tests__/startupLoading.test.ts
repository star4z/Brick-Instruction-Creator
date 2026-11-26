import { describe, expect, it } from 'vitest';
import {
  STARTUP_MODEL_HINT_KEY,
  getStartupLoadingViewModel,
  isRestorableModelRecord,
  readStartupModelHint,
  stripModelExtension,
  writeStartupModelHint,
  type StartupLoadingPhase,
} from '../startupLoading';

function createMemoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
  };
}

describe('startupLoading', () => {
  it('strips BrickLink Studio and LDraw extensions cleanly', () => {
    expect(stripModelExtension('My Castle.io')).toBe('My Castle');
    expect(stripModelExtension('spaceship.LDR')).toBe('spaceship');
    expect(stripModelExtension('modular_house.mpd')).toBe('modular_house');
    expect(stripModelExtension('  Plain Title  ')).toBe('Plain Title');
  });

  it('persists, reads, and clears the synchronous startup model hint', () => {
    const storage = createMemoryStorage();
    expect(readStartupModelHint(storage)).toBeNull();

    writeStartupModelHint({ fileName: 'train.io', kind: 'io', title: 'Express Train' }, storage);
    expect(readStartupModelHint(storage)).toEqual({
      fileName: 'train.io',
      kind: 'io',
      title: 'Express Train',
    });

    writeStartupModelHint(null, storage);
    expect(readStartupModelHint(storage)).toBeNull();
    expect(storage.getItem(STARTUP_MODEL_HINT_KEY)).toBeNull();
  });

  it('ignores malformed or unsupported hint payloads safely', () => {
    const storage = createMemoryStorage();
    storage.setItem(STARTUP_MODEL_HINT_KEY, '{not-json');
    expect(readStartupModelHint(storage)).toBeNull();

    storage.setItem(STARTUP_MODEL_HINT_KEY, JSON.stringify({ kind: 'project', fileName: 'foo.biw' }));
    expect(readStartupModelHint(storage)).toBeNull();
  });

  it('validates restorable IndexedDB lastModel records', () => {
    expect(isRestorableModelRecord(null)).toBe(false);
    expect(isRestorableModelRecord(undefined)).toBe(false);
    expect(isRestorableModelRecord({ kind: 'io', data: null })).toBe(false);
    expect(isRestorableModelRecord({ kind: 'io', data: new ArrayBuffer(8), fileName: 'a.io' })).toBe(true);
    expect(isRestorableModelRecord({ kind: 'ldr', data: '' })).toBe(false);
    expect(isRestorableModelRecord({ kind: 'ldr', data: '1 4 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat' })).toBe(true);
    expect(isRestorableModelRecord({ kind: 'project', data: '{}' })).toBe(false);
  });

  it('produces monotonically increasing progress and clean copy across all phases', () => {
    const phases: StartupLoadingPhase[] = [
      'restoring',
      'library',
      'extracting',
      'parsing',
      'fetching_parts',
      'textures',
      'building',
      'rendering',
    ];
    let prevPct = 0;
    for (const phase of phases) {
      const vm = getStartupLoadingViewModel(phase, { fileName: 'test-tower.ldr' });
      expect(vm.title).toBe('Loading test-tower');
      expect(vm.status.length).toBeGreaterThan(0);
      expect(vm.progressPct).toBeGreaterThan(prevPct);
      expect(vm.progressPct).toBeLessThan(100);
      prevPct = vm.progressPct;
    }

    const withTitle = getStartupLoadingViewModel('building', {
      fileName: 'raw-file.io',
      title: 'Corner Bakery',
    });
    expect(withTitle.title).toBe('Loading Corner Bakery');

    const fallback = getStartupLoadingViewModel('restoring', null);
    expect(fallback.title).toBe('Loading Last Model');
  });
});
