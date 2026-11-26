/**
 * Startup Model Loading Screen State & Synchronous Session Hint
 *
 * Persists a lightweight `localStorage` hint whenever a model is saved to
 * IndexedDB (`lastModel`) so subsequent page loads can show the startup
 * loading screen immediately without flashing the empty welcome state.
 */

export const STARTUP_MODEL_HINT_KEY = 'biw.lastModelHint.v1';

export type StartupModelKind = 'io' | 'ldr';

export interface StartupModelHint {
  fileName: string;
  kind: StartupModelKind;
  title?: string;
}

export interface RestorableModelRecord {
  kind: StartupModelKind;
  fileName?: string;
  data: unknown;
}

export type StartupLoadingPhase =
  | 'restoring'
  | 'library'
  | 'extracting'
  | 'parsing'
  | 'fetching_parts'
  | 'textures'
  | 'building'
  | 'rendering';

export interface StartupLoadingViewModel {
  title: string;
  status: string;
  progressPct: number;
}

const PHASE_COPY: Record<StartupLoadingPhase, { status: string; progressPct: number }> = {
  restoring: { status: 'Opening saved session…', progressPct: 12 },
  library: { status: 'Loading bricks library…', progressPct: 24 },
  extracting: { status: 'Unpacking studio file…', progressPct: 38 },
  parsing: { status: 'Reading model parts…', progressPct: 52 },
  fetching_parts: { status: 'Loading 3D part shapes…', progressPct: 66 },
  textures: { status: 'Preparing part decals…', progressPct: 78 },
  building: { status: 'Building instruction manual…', progressPct: 88 },
  rendering: { status: 'Rendering pages…', progressPct: 96 },
};

export function stripModelExtension(name: string): string {
  return name.replace(/\.(io|ldr|mpd)$/i, '').trim();
}

export function isRestorableModelRecord(rec: unknown): rec is RestorableModelRecord {
  if (!rec || typeof rec !== 'object') return false;
  const candidate = rec as Record<string, unknown>;
  if (candidate.kind === 'io') return Boolean(candidate.data);
  if (candidate.kind === 'ldr') return typeof candidate.data === 'string' && candidate.data.length > 0;
  return false;
}

function getDefaultStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function readStartupModelHint(
  storage: Pick<Storage, 'getItem'> | null = getDefaultStorage(),
): StartupModelHint | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STARTUP_MODEL_HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.kind !== 'io' && parsed.kind !== 'ldr') return null;
    const fileName = typeof parsed.fileName === 'string' ? parsed.fileName.trim() : '';
    const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
    const hint: StartupModelHint = { fileName, kind: parsed.kind };
    if (title) hint.title = title;
    return hint;
  } catch {
    return null;
  }
}

export function writeStartupModelHint(
  hint: StartupModelHint | null,
  storage: Pick<Storage, 'setItem' | 'removeItem'> | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    if (!hint) {
      storage.removeItem(STARTUP_MODEL_HINT_KEY);
      return;
    }
    const clean: StartupModelHint = {
      fileName: typeof hint.fileName === 'string' ? hint.fileName.trim() : '',
      kind: hint.kind,
    };
    const title = typeof hint.title === 'string' ? hint.title.trim() : '';
    if (title) clean.title = title;
    storage.setItem(STARTUP_MODEL_HINT_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage quota or private-browsing errors.
  }
}

export function getStartupLoadingViewModel(
  phase: StartupLoadingPhase,
  hint?: Pick<StartupModelHint, 'fileName' | 'title'> | null,
): StartupLoadingViewModel {
  const rawLabel = (hint?.title || hint?.fileName || '').trim();
  const displayName = rawLabel ? stripModelExtension(rawLabel) : '';
  const { status, progressPct } = PHASE_COPY[phase] ?? PHASE_COPY.restoring;
  return {
    title: displayName ? `Loading ${displayName}` : 'Loading Last Model',
    status,
    progressPct,
  };
}
