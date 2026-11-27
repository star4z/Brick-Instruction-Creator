/**
 * Startup Model Loading Screen State & Synchronous Session Hint
 *
 * Persists a lightweight `localStorage` hint whenever a model is saved to
 * IndexedDB (`lastModel`) so subsequent page loads can show the startup
 * loading screen immediately without flashing the empty welcome state.
 */

export const STARTUP_MODEL_HINT_KEY = 'biw.lastModelHint.v1';

export type StartupModelKind = 'io' | 'ldr' | 'project';

export interface StartupModelHint {
  fileName: string;
  kind: StartupModelKind;
  title?: string;
}

export interface RestorableModelRecord {
  kind: 'io' | 'ldr';
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
  return name.replace(/\.(io|ldr|mpd|biw)$/i, '').trim();
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
    if (parsed.kind !== 'io' && parsed.kind !== 'ldr' && parsed.kind !== 'project') return null;
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

export type OperationLoadingPhase =
  | 'import_reading'
  | 'import_extracting'
  | 'import_parsing'
  | 'import_textures'
  | 'import_analyzing'
  | 'generate_building'
  | 'generate_diagnostics'
  | 'generate_rendering'
  | 'project_reading'
  | 'project_fonts'
  | 'project_rendering'
  | 'export_html_meshes'
  | 'export_html_pages'
  | 'export_html_packaging'
  | 'preview_html_meshes'
  | 'preview_html_pages'
  | 'preview_html_packaging';

export interface OperationLoadingOptions {
  label?: string;
  isUpdate?: boolean;
  progressPct?: number;
}

const OPERATION_PHASE_COPY: Record<
  OperationLoadingPhase,
  { verb: string; fallbackTitle: string; status: string; progressPct: number }
> = {
  import_reading: { verb: 'Opening', fallbackTitle: 'Opening Model', status: 'Reading model file…', progressPct: 18 },
  import_extracting: { verb: 'Opening', fallbackTitle: 'Opening Model', status: 'Unpacking studio archive…', progressPct: 36 },
  import_parsing: { verb: 'Opening', fallbackTitle: 'Opening Model', status: 'Reading model parts…', progressPct: 56 },
  import_textures: { verb: 'Opening', fallbackTitle: 'Opening Model', status: 'Preparing part decals…', progressPct: 74 },
  import_analyzing: { verb: 'Opening', fallbackTitle: 'Opening Model', status: 'Checking parts & structure…', progressPct: 88 },
  generate_building: { verb: 'Building', fallbackTitle: 'Building Manual', status: 'Generating build steps…', progressPct: 42 },
  generate_diagnostics: { verb: 'Building', fallbackTitle: 'Building Manual', status: 'Checking model connections…', progressPct: 74 },
  generate_rendering: { verb: 'Building', fallbackTitle: 'Building Manual', status: 'Rendering manual pages…', progressPct: 92 },
  project_reading: { verb: 'Opening', fallbackTitle: 'Opening Project', status: 'Reading project file…', progressPct: 24 },
  project_fonts: { verb: 'Opening', fallbackTitle: 'Opening Project', status: 'Loading custom fonts…', progressPct: 58 },
  project_rendering: { verb: 'Opening', fallbackTitle: 'Opening Project', status: 'Rendering manual pages…', progressPct: 88 },
  export_html_meshes: { verb: 'Exporting', fallbackTitle: 'Exporting 3D Viewer', status: 'Building 3D part meshes…', progressPct: 15 },
  export_html_pages: { verb: 'Exporting', fallbackTitle: 'Exporting 3D Viewer', status: 'Rendering step previews…', progressPct: 55 },
  export_html_packaging: { verb: 'Exporting', fallbackTitle: 'Exporting 3D Viewer', status: 'Packaging interactive HTML…', progressPct: 90 },
  preview_html_meshes: { verb: 'Previewing', fallbackTitle: 'Previewing 3D Viewer', status: 'Building 3D part meshes…', progressPct: 15 },
  preview_html_pages: { verb: 'Previewing', fallbackTitle: 'Previewing 3D Viewer', status: 'Rendering step previews…', progressPct: 55 },
  preview_html_packaging: { verb: 'Previewing', fallbackTitle: 'Previewing 3D Viewer', status: 'Preparing interactive preview…', progressPct: 90 },
};

export function stripProjectOrModelExtension(name: string): string {
  return name.replace(/\.(io|ldr|mpd|biw)$/i, '').trim();
}

export function getOperationLoadingViewModel(
  phase: OperationLoadingPhase,
  options: OperationLoadingOptions = {},
): StartupLoadingViewModel {
  const spec = OPERATION_PHASE_COPY[phase] ?? OPERATION_PHASE_COPY.import_reading;
  const rawLabel = (options.label || '').trim();
  const displayName = rawLabel ? stripProjectOrModelExtension(rawLabel) : '';
  const verb = options.isUpdate && spec.verb === 'Building' ? 'Updating' : spec.verb;
  const title = phase.startsWith('export_html_') || phase.startsWith('preview_html_')
    ? spec.fallbackTitle
    : displayName
      ? `${verb} ${displayName}`
      : options.isUpdate && spec.verb === 'Building'
        ? 'Updating Manual'
        : spec.fallbackTitle;
  const pct = typeof options.progressPct === 'number' && Number.isFinite(options.progressPct)
    ? Math.max(0, Math.min(100, Math.round(options.progressPct)))
    : spec.progressPct;
  return {
    title,
    status: spec.status,
    progressPct: pct,
  };
}
