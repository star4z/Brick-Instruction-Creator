import { openDB, type IDBPDatabase } from 'idb';
import type { BicProjectFile } from '../types/manual';

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
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function downloadProjectFile(project: BicProjectFile): void {
  const slug = project.model.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'manual';
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug}.bic.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function parseProjectFile(file: File): Promise<BicProjectFile> {
  const text = await file.text();
  const parsed = JSON.parse(text) as BicProjectFile;
  if (!parsed || parsed.version !== 1 || !parsed.model || !parsed.plan) {
    throw new Error('Invalid Brick Instruction Creator project (.bic.json) file.');
  }
  return parsed;
}
