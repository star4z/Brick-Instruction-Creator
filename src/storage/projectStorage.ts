import { openDB, type IDBPDatabase } from 'idb';
import type { BicProjectFile } from '../types/manual';
import {
  CUSTOM_FILE_MIME_TYPE,
  PROJECT_FILE_EXT,
  PROJECT_FILE_FORMAT,
  assertProjectFileName,
  buildProjectFileName,
} from './fileFormats';

const DB_NAME = 'brick-instruction-creator-projects-v1';
const STORE_NAME = 'autosave';
const AUTOSAVE_KEY = 'latest_project';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> | null {
  if (typeof indexedDB === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
      terminated() {
        dbPromise = null;
      },
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function saveAutosaveProject(project: BicProjectFile): Promise<void> {
  const db = getDb();
  if (!db) return;
  try {
    const handle = await db;
    await handle.put(STORE_NAME, project, AUTOSAVE_KEY);
  } catch {
    // Ignore quota/private-mode IndexedDB failures
  }
}

export async function loadAutosaveProject(): Promise<BicProjectFile | null> {
  const db = getDb();
  if (!db) return null;
  try {
    const handle = await db;
    const data = (await handle.get(STORE_NAME, AUTOSAVE_KEY)) as BicProjectFile | undefined;
    if (data && data.version === 1 && data.model && data.plan) {
      return { ...data, format: PROJECT_FILE_FORMAT };
    }
    return null;
  } catch {
    return null;
  }
}

export function downloadProjectFile(project: BicProjectFile): void {
  const payload: BicProjectFile = {
    ...project,
    format: PROJECT_FILE_FORMAT,
  };
  const json = JSON.stringify(payload);
  const blob = new Blob([json], { type: CUSTOM_FILE_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = buildProjectFileName(project.model.name);
  if (a.style) a.style.display = 'none';
  if (document.body && typeof document.body.appendChild === 'function') {
    document.body.appendChild(a);
  }
  try {
    a.click();
  } finally {
    if (typeof a.remove === 'function') a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function parseProjectFile(file: File): Promise<BicProjectFile> {
  assertProjectFileName(file.name);
  const text = await file.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Invalid Brick Instruction Works project (${PROJECT_FILE_EXT}) file.`);
  }
  const obj = parsed as Partial<BicProjectFile> | null;
  if (
    !obj ||
    typeof obj !== 'object' ||
    obj.format !== PROJECT_FILE_FORMAT ||
    obj.version !== 1 ||
    !obj.model ||
    !obj.plan
  ) {
    throw new Error(`Invalid Brick Instruction Works project (${PROJECT_FILE_EXT}) file.`);
  }
  return obj as BicProjectFile;
}
