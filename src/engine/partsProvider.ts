import { openDB, type IDBPDatabase } from 'idb';
import JSZip from 'jszip';
import { normalizePartId } from '../data/partCatalog';
import type { Mat3, RawLDrawGeometry, Vec3 } from '../types/manual';
import {
  IDENTITY_MAT3,
  ldrawMatToYUp,
  ldrawPosToYUp,
  mat3Det,
  mat3Mul,
  mat3MulVec,
  vec3Add,
} from './math';

const DB_NAME = 'brick-instruction-creator-parts-cache-v1';
const STORE_NAME = 'ldraw_dat';

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

/**
 * Generates standard LDraw circular primitives (e.g. 1-4cyli, 4-4cyli, 1-4edge, 4-4disc)
 * when an embedded model2.ldr references a standard primitive not bundled inline.
 */
function synthesizeStandardPrimitive(
  normKey: string,
  triangles: number[],
  lines: number[],
  mat: Mat3,
  pos: Vec3,
): boolean {
  const m = normKey.match(/^(\d+)-(\d+)(cyli|cylo|edge|disc)$/);
  if (!m) return false;
  const num = parseInt(m[1], 10);
  const den = parseInt(m[2], 10);
  const kind = m[3];
  if (!num || !den || num > den) return false;

  const totalAngle = (num / den) * Math.PI * 2;
  const segs = Math.max(4, Math.round((num / den) * 16));
  const xf = (x: number, y: number, z: number): Vec3 =>
    ldrawPosToYUp(vec3Add(pos, mat3MulVec(mat, [x, y, z])));

  for (let i = 0; i < segs; i++) {
    const a0 = (i / segs) * totalAngle;
    const a1 = ((i + 1) / segs) * totalAngle;
    const x0 = Math.cos(a0), z0 = Math.sin(a0);
    const x1 = Math.cos(a1), z1 = Math.sin(a1);

    if (kind === 'edge') {
      lines.push(...xf(x0, 0, z0), ...xf(x1, 0, z1));
    } else if (kind === 'disc') {
      triangles.push(...xf(0, 0, 0), ...xf(x0, 0, z0), ...xf(x1, 0, z1));
    } else {
      // cyli / cylo: cylinder from y=0 to y=1 in LDraw space
      const b0 = xf(x0, 0, z0);
      const b1 = xf(x1, 0, z1);
      const t0 = xf(x0, 1, z0);
      const t1 = xf(x1, 1, z1);
      triangles.push(...b0, ...b1, ...t1, ...b0, ...t1, ...t0);
    }
  }
  return true;
}

/**
 * Recursively compiles an LDraw .dat definition (including nested type-1 subfile & primitive
 * references such as stud.dat, box5.dat, 4-4cyli.dat, 48/... and s/...) into Y-up buffers.
 */
export function compileLDrawDatRecursive(
  rootKey: string,
  rawSources: Map<string, string>,
  maxDepth = 10,
): RawLDrawGeometry | null {
  const triangles: number[] = [];
  const lines: number[] = [];
  const boundsMin: Vec3 = [Infinity, Infinity, Infinity];
  const boundsMax: Vec3 = [-Infinity, -Infinity, -Infinity];

  const expand = (p: Vec3) => {
    for (let i = 0; i < 3; i++) {
      if (p[i] < boundsMin[i]) boundsMin[i] = p[i];
      if (p[i] > boundsMax[i]) boundsMax[i] = p[i];
    }
  };

  const lookup = (ref: string): string | undefined => {
    const lower = ref.trim().toLowerCase().replace(/\\/g, '/');
    if (rawSources.has(lower)) return rawSources.get(lower);
    const base = normalizePartId(lower);
    if (rawSources.has(base)) return rawSources.get(base);
    if (rawSources.has(`${base}.dat`)) return rawSources.get(`${base}.dat`);
    return undefined;
  };

  const visit = (key: string, parentPos: Vec3, parentRot: Mat3, depth: number) => {
    if (depth > maxDepth) return;
    const text = lookup(key);
    if (!text) {
      synthesizeStandardPrimitive(normalizePartId(key), triangles, lines, parentRot, parentPos);
      return;
    }

    const flipWinding = mat3Det(parentRot) < 0;

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('0')) continue;
      const t = line.split(/\s+/);
      const kind = t[0];

      if (kind === '1' && t.length >= 15) {
        const lx = +t[2], ly = +t[3], lz = +t[4];
        const m: Mat3 = [+t[5], +t[6], +t[7], +t[8], +t[9], +t[10], +t[11], +t[12], +t[13]];
        if ([lx, ly, lz, ...m].some((n) => !Number.isFinite(n))) continue;
        const childPos = vec3Add(parentPos, mat3MulVec(parentRot, [lx, ly, lz]));
        const childRot = mat3Mul(parentRot, m);
        const ref = t.slice(14).join(' ').trim();
        visit(ref, childPos, childRot, depth + 1);
      } else if (kind === '2' && t.length >= 8) {
        const a = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[2], +t[3], +t[4]])));
        const b = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[5], +t[6], +t[7]])));
        if ([...a, ...b].every(Number.isFinite)) {
          lines.push(...a, ...b);
          expand(a);
          expand(b);
        }
      } else if (kind === '3' && t.length >= 11) {
        const a = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[2], +t[3], +t[4]])));
        const b = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[5], +t[6], +t[7]])));
        const c = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[8], +t[9], +t[10]])));
        if ([...a, ...b, ...c].every(Number.isFinite)) {
          if (flipWinding) triangles.push(...a, ...c, ...b);
          else triangles.push(...a, ...b, ...c);
          expand(a);
          expand(b);
          expand(c);
        }
      } else if (kind === '4' && t.length >= 14) {
        const a = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[2], +t[3], +t[4]])));
        const b = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[5], +t[6], +t[7]])));
        const c = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[8], +t[9], +t[10]])));
        const d = ldrawPosToYUp(vec3Add(parentPos, mat3MulVec(parentRot, [+t[11], +t[12], +t[13]])));
        if ([...a, ...b, ...c, ...d].every(Number.isFinite)) {
          if (flipWinding) triangles.push(...a, ...c, ...b, ...a, ...d, ...c);
          else triangles.push(...a, ...b, ...c, ...a, ...c, ...d);
          expand(a);
          expand(b);
          expand(c);
          expand(d);
        }
      }
    }
  };

  visit(rootKey, [0, 0, 0], IDENTITY_MAT3, 0);

  if (triangles.length === 0) return null;
  // Ensure finite bounds
  if (!Number.isFinite(boundsMin[0])) {
    return { triangles, lines, boundsMin: [-10, -24, -10], boundsMax: [10, 4, 10] };
  }
  // Keep unused helper imported cleanly
  void ldrawMatToYUp;
  return { triangles, lines, boundsMin, boundsMax };
}

export function parseRawLDrawDat(datText: string): RawLDrawGeometry | null {
  const map = new Map<string, string>([['__root__', datText]]);
  return compileLDrawDatRecursive('__root__', map, 1);
}

class LayeredPartsProvider {
  private rawSources = new Map<string, string>();
  private compiledCache = new Map<string, RawLDrawGeometry | null>();
  private partTitles = new Map<string, string>();
  private shardManifestLoaded = false;
  private shardManifest: Record<string, string> = {};

  registerEmbeddedFiles(files: Record<string, string>): void {
    for (const [key, content] of Object.entries(files)) {
      const norm = normalizePartId(key);
      this.rawSources.set(norm, content);
      this.rawSources.set(key.toLowerCase(), content);
      this.compiledCache.delete(norm);

      // Extract human-readable part title from line 2 comment (e.g., "0 Plate 2 x 3")
      const titleLine = content.split(/\r?\n/).find((l) => {
        const s = l.trim();
        return s.startsWith('0 ') && !/^0\s+(FILE|Name:|Author:|IsSubModel|BL_|Flexible|Render|IsAssembly|!|BFC)/i.test(s);
      });
      if (titleLine) {
        const title = titleLine.replace(/^0\s+/, '').trim();
        if (title.length > 1) this.partTitles.set(norm, title);
      }
    }
  }

  getPartTitle(partId: string): string | null {
    const norm = normalizePartId(partId);
    return this.partTitles.get(norm) ?? null;
  }

  getCachedRawGeometry(partId: string): RawLDrawGeometry | null {
    const norm = normalizePartId(partId);
    if (this.compiledCache.has(norm)) {
      return this.compiledCache.get(norm) ?? null;
    }

    // Try exact match first, then base numeric match (e.g. 3062b -> 3062)
    let sourceKey: string | null = null;
    if (this.rawSources.has(norm)) {
      sourceKey = norm;
    } else {
      const base = norm.replace(/[a-z].*$/, '');
      if (base.length >= 3 && this.rawSources.has(base)) {
        sourceKey = base;
      }
    }

    if (!sourceKey) return null;

    const compiled = compileLDrawDatRecursive(sourceKey, this.rawSources, 10);
    this.compiledCache.set(norm, compiled);
    return compiled;
  }

  async importLocalLibraryFile(
    file: File,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<number> {
    const lower = file.name.toLowerCase();
    const db = getDb();

    if (lower.endsWith('.dat')) {
      const text = await file.text();
      const id = normalizePartId(file.name);
      this.registerEmbeddedFiles({ [id]: text });
      if (db) {
        const handle = await db;
        await handle.put(STORE_NAME, text, id);
      }
      onProgress?.(1, 1);
      return 1;
    }

    if (lower.endsWith('.zip')) {
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const datEntries = Object.keys(zip.files).filter((k) => k.toLowerCase().endsWith('.dat'));
      let imported = 0;
      const handle = db ? await db : null;

      for (let i = 0; i < datEntries.length; i++) {
        const entry = datEntries[i];
        const text = await zip.files[entry].async('string');
        const id = normalizePartId(entry);
        this.rawSources.set(id, text);
        if (handle) {
          await handle.put(STORE_NAME, text, id);
        }
        imported += 1;
        if (imported % 200 === 0 || i === datEntries.length - 1) {
          onProgress?.(imported, datEntries.length);
        }
      }
      this.compiledCache.clear();
      return imported;
    }

    return 0;
  }

  async prefetchRawPart(partId: string): Promise<RawLDrawGeometry | null> {
    const id = normalizePartId(partId);
    const existing = this.getCachedRawGeometry(id);
    if (existing) return existing;

    const db = getDb();
    if (db) {
      try {
        const handle = await db;
        const cachedText = await handle.get(STORE_NAME, id);
        if (typeof cachedText === 'string') {
          this.registerEmbeddedFiles({ [id]: cachedText });
          return this.getCachedRawGeometry(id);
        }
      } catch {
        // Ignore IDB errors
      }
    }

    if (!this.shardManifestLoaded && typeof fetch !== 'undefined') {
      this.shardManifestLoaded = true;
      try {
        const res = await fetch('./ldraw-shards/manifest.json');
        if (res.ok) {
          const data = (await res.json()) as { parts?: Record<string, string> };
          if (data.parts) this.shardManifest = data.parts;
        }
      } catch {
        // Optional static shards not deployed
      }
    }

    const shardFile = this.shardManifest[id];
    if (shardFile && typeof fetch !== 'undefined') {
      try {
        const res = await fetch(`./ldraw-shards/${shardFile}`);
        if (res.ok) {
          const shardData = (await res.json()) as Record<string, string>;
          this.registerEmbeddedFiles(shardData);
          return this.getCachedRawGeometry(id);
        }
      } catch {
        // Fallback cleanly
      }
    }

    return null;
  }

  async fetchMissingPartsFromPublicCdn(
    partIds: string[],
    customBaseUrl?: string,
    onProgress?: (fetched: number, processed: number, total: number) => void,
  ): Promise<{ fetched: number; networkBlocked: boolean }> {
    const defaultMirrors = [
      'https://raw.githubusercontent.com/kulits/ldraw-parts/master/ldraw/',
      'https://mrubens.github.io/ldraw-library/',
      'https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/',
      'https://cdn.jsdelivr.net/gh/kulits/ldraw-parts@master/ldraw/',
      'https://raw.githubusercontent.com/iefierros/LegoMaster/main/ldraw/UnOfficial/',
    ];
    const bases = customBaseUrl
      ? [customBaseUrl.endsWith('/') ? customBaseUrl : `${customBaseUrl}/`, ...defaultMirrors]
      : defaultMirrors;

    const queue: string[] = [];
    const queued = new Set<string>();
    const enqueue = (rawId: string) => {
      const k = normalizePartId(rawId);
      const base = k.split('/').pop() ?? k;
      if (!k || queued.has(k) || this.rawSources.has(k)) return;
      if (/^(stud|stud2|stud2a|stud3|stud3a|stud4|stud4a|studp01|rect|rect2p|\d+-\d+(cyli|cylo|cylc|disc|edge|ring\d+|rin\d+|chrd|ndis))$/.test(base)) return;
      queued.add(k);
      queue.push(k);
    };
    partIds.forEach(enqueue);

    const db = getDb();
    const handle = db ? await db.catch(() => null) : null;
    let fetched = 0;
    let processed = 0;
    let blocked = 0;

    while (processed < queue.length && processed < 2500) {
      const batch = queue.slice(processed, Math.min(queue.length, processed + 16));
      processed += batch.length;

      const results = await Promise.all(
        batch.map(async (k) => {
          const clean = k.replace(/\.dat$/i, '');
          const paths = clean.startsWith('s/')
            ? [`parts/${clean}.dat`]
            : clean.startsWith('48/') || clean.startsWith('8/')
              ? [`p/${clean}.dat`]
              : /^(?:box|rect|tri|quad|edge|cyl|con|disc|ndis|chrd|ring|rin|stud|stug|axle|peg|conn|clip|bush|hinge|beam|npeg|t\d{2}[oiq]\d{4}|\d+-\d+[a-z])/.test(clean)
                ? [`p/${clean}.dat`, `parts/${clean}.dat`]
                : /^\d{3,}[a-z0-9_-]*$/.test(clean)
                  ? [`parts/${clean}.dat`]
                  : [`parts/${clean}.dat`, `p/${clean}.dat`, `parts/s/${clean}.dat`];

          let sawErr = false;
          for (const rel of paths) {
            for (const base of bases) {
              try {
                const res = await fetch(`${base}${rel}`, { mode: 'cors' });
                if (res.ok) {
                  const text = await res.text();
                  if (text.length > 10 && !/^\s*(?:<!doctype|<html\b)/i.test(text)) {
                    return { k, text, sawErr: false };
                  }
                }
              } catch {
                sawErr = true;
              }
            }
          }
          return { k, text: null as string | null, sawErr };
        }),
      );

      for (const r of results) {
        if (r.text) {
          this.registerEmbeddedFiles({ [r.k]: r.text });
          if (handle) await handle.put(STORE_NAME, r.text, r.k).catch(() => undefined);
          fetched += 1;
          for (const line of r.text.split(/\r?\n/)) {
            const tr = line.trim();
            if (tr.startsWith('1 ')) {
              const toks = tr.split(/\s+/);
              if (toks.length >= 15) enqueue(toks.slice(14).join(' '));
            }
          }
        } else if (r.sawErr) {
          blocked += 1;
        }
      }

      if (processed <= 16 && fetched === 0 && blocked === batch.length) {
        return { fetched: 0, networkBlocked: true };
      }
      onProgress?.(fetched, processed, queue.length);
    }

    this.compiledCache.clear();
    return { fetched, networkBlocked: false };
  }

  async getCachedCount(): Promise<number> {
    const db = getDb();
    if (!db) return this.rawSources.size;
    try {
      const handle = await db;
      return (await handle.count(STORE_NAME)) + this.rawSources.size;
    } catch {
      return this.rawSources.size;
    }
  }
}

export const partsProvider = new LayeredPartsProvider();
