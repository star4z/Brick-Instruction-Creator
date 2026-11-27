#!/usr/bin/env node
// Builds on-site 3D LDraw & Unofficial/Studio part geometry packs (`parts-chunks/`, format v2).
//
// Format v2 layout:
// - `manifest.json`: compact JSON describing `coreBundle`, `index`, and flat pack files (`p00.bin`…)
// - `core.bin`: single gzipped JSON dictionary of shared LDraw primitives (`p/`, `48/`, `8/`)
// - `index.bin`: gzipped parallel-array index `{ keys, p, o, l }` sorted by JS code-unit order
// - `pNN.bin`: flat binary pack files (<= 46 MB each — under GitHub's 50 MB warning & 100 MB hard
//   limit and Neocities Supporter's 100 MB per-file cap) containing individually gzipped `.dat`
//   entries fetched on demand via HTTP `Range: bytes=start-end`.
//
// Usage:
//   node scripts/build-parts-chunks.mjs --out thirdparty/parts-chunks
//   node scripts/build-parts-chunks.mjs --from-v1 /path/to/old/parts-chunks --out thirdparty/parts-chunks

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

const args = process.argv.slice(2);
function getArg(flag, fallback) {
  const idx = args.indexOf(flag);
  return idx >= 0 && args[idx + 1] ? args[idx + 1] : fallback;
}

const OUT_DIR = path.resolve(process.cwd(), getArg('--out', 'thirdparty/parts-chunks'));
const FROM_V1_DIR = getArg('--from-v1', '');
// 46 MB per pack: comfortably under GitHub's 50 MB soft warning / 100 MB hard limit
// and Neocities Supporter's 100 MB per-file hosted asset limit.
const MAX_PACK_BYTES = Number(getArg('--max-pack-bytes', String(46 * 1024 * 1024)));
const MAX_TOTAL_BYTES = Number(getArg('--max-total-bytes', String(50 * 1024 * 1024 * 1024))); // <= 50 GB Neocities Supporter cap
const SKIP_UNOFFICIAL = args.includes('--official-only');

const SOURCES = [
  {
    id: 'official',
    repoUrl: 'https://github.com/kulits/ldraw-parts.git',
    branch: 'master',
    dirs: [
      { rel: 'ldraw/parts', prefix: '', isCore: false },
      { rel: 'ldraw/parts/s', prefix: 's/', isCore: false },
      { rel: 'ldraw/p', prefix: '', isCore: true },
      { rel: 'ldraw/p/48', prefix: '48/', isCore: true },
      { rel: 'ldraw/p/8', prefix: '8/', isCore: true },
    ],
  },
  {
    id: 'unofficial',
    repoUrl: 'https://github.com/iefierros/LegoMaster.git',
    branch: 'main',
    dirs: [
      { rel: 'ldraw/UnOfficial/parts', prefix: '', isCore: false },
      { rel: 'ldraw/UnOfficial/parts/s', prefix: 's/', isCore: false },
      { rel: 'ldraw/UnOfficial/p', prefix: '', isCore: true },
      { rel: 'ldraw/UnOfficial/p/48', prefix: '48/', isCore: true },
      { rel: 'ldraw/UnOfficial/p/8', prefix: '8/', isCore: true },
    ],
  },
];

function normalizeKey(prefix, filename) {
  return (prefix + filename)
    .replace(/\\/g, '/')
    .replace(/\.dat$/i, '')
    .toLowerCase()
    .trim();
}

/** Heuristic for identifying LDraw primitives when repacking from a v1 chunk directory. */
function isHeuristicCorePrimitive(key, text) {
  if (key.startsWith('48/') || key.startsWith('8/')) return true;
  if (/^0\s+!LDRAW_ORG\s+(?:Unofficial_)?(?:48_)?(?:8_)?Primitive\b/im.test(text)) return true;
  if (/^(?:stud|box|cyl|disc|edge|ring|con|rect|tri|chrd|ndis|peghol|axlehol|t\d|1-4|2-4|3-4|4-4|1-8|2-8|3-8|5-8|7-8)/i.test(key)) {
    return true;
  }
  return false;
}

/**
 * Minifies an LDraw `.dat` file while preserving its title, `!LDRAW_ORG`, `BFC`, `!TEXMAP`,
 * `PE_TEX_*`, `~Moved to`, and all geometry/subfile lines (`1`, `2`, `3`, `4`, `5`).
 */
export function minifyDatText(raw) {
  const lines = raw.split(/\r?\n/);
  const out = [];
  let keptTitle = false;
  for (let i = 0; i < lines.length; i++) {
    const tr = lines[i].trim();
    if (!tr) continue;
    const ch = tr.charCodeAt(0);
    // Geometry & subfile lines: 1, 2, 3, 4, 5
    if (ch >= 49 && ch <= 53 && tr.charCodeAt(1) === 32) {
      out.push(tr.replace(/\s+/g, ' '));
      continue;
    }
    if (ch === 48 && tr.charCodeAt(1) === 32) {
      // Preserve critical meta directives
      if (
        /^0\s+(?:!LDRAW_ORG|BFC|!TEXMAP|!:|PE_TEX_|~?Moved\s+to\b)/i.test(tr)
      ) {
        out.push(tr);
        continue;
      }
      // Keep the first clean description/title line
      if (
        !keptTitle &&
        !/^0\s+(?:FILE|Name:|Author:|!LICENSE|!HISTORY|!HELP|!CATEGORY|!KEYWORDS|!CMDLINE|\/\/|IsSubModel|BL_|Flexible|Render|IsAssembly|NumOfBricks|CustomBrick)/i.test(tr)
      ) {
        keptTitle = true;
        out.push(tr);
      }
    }
  }
  return out.join('\n');
}

function collectDatFilesFromDir(dirPath, prefix, isCore, map, origin) {
  if (!fs.existsSync(dirPath)) return 0;
  let added = 0;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile() || !/\.dat$/i.test(entry.name)) continue;
    const key = normalizeKey(prefix, entry.name);
    if (!key || map.has(key)) continue; // Official wins over Unofficial
    const full = path.join(dirPath, entry.name);
    const raw = fs.readFileSync(full, 'utf8');
    const min = minifyDatText(raw);
    if (!min) continue;
    map.set(key, { text: min, origin, isCore });
    added++;
  }
  return added;
}

function collectFromV1Dir(v1Dir) {
  const manifestPath = path.join(v1Dir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const datMap = new Map();
  for (const chunk of manifest.chunks || []) {
    const buf = fs.readFileSync(path.join(v1Dir, chunk.file));
    const jsonText =
      buf.length >= 2 && buf[0] === 0x1f && buf[1] === 0x8b
        ? zlib.gunzipSync(buf).toString('utf8')
        : buf.toString('utf8');
    const dict = JSON.parse(jsonText);
    for (const [key, text] of Object.entries(dict)) {
      if (typeof text !== 'string' || datMap.has(key)) continue;
      datMap.set(key, { text, origin: 'v1', isCore: isHeuristicCorePrimitive(key, text) });
    }
  }
  return {
    datMap,
    officialCount: Number(manifest.officialCount) || datMap.size,
    unofficialCount: Number(manifest.unofficialCount) || 0,
  };
}

function main() {
  const tmpDir = FROM_V1_DIR ? '' : fs.mkdtempSync(path.join(os.tmpdir(), 'bic-parts-chunks-'));
  if (tmpDir) console.log(`Working in ${tmpDir}`);

  try {
    let datMap = new Map();
    let officialCount = 0;
    let unofficialCount = 0;

    if (FROM_V1_DIR) {
      console.log(`Repacking from v1 chunks directory: ${FROM_V1_DIR}`);
      const loaded = collectFromV1Dir(path.resolve(process.cwd(), FROM_V1_DIR));
      datMap = loaded.datMap;
      officialCount = loaded.officialCount;
      unofficialCount = loaded.unofficialCount;
    } else {
      for (const src of SOURCES) {
        if (src.id === 'unofficial' && SKIP_UNOFFICIAL) continue;
        const cloneDir = path.join(tmpDir, src.id);
        console.log(`Cloning ${src.repoUrl} (${src.branch})…`);
        execFileSync(
          'git',
          ['clone', '--depth', '1', '--branch', src.branch, '--filter=blob:none', '--sparse', src.repoUrl, cloneDir],
          { stdio: 'inherit' },
        );
        const sparsePaths = src.id === 'official' ? ['ldraw/parts', 'ldraw/p'] : ['ldraw/UnOfficial/parts', 'ldraw/UnOfficial/p'];
        execFileSync('git', ['-C', cloneDir, 'sparse-checkout', 'set', ...sparsePaths], { stdio: 'inherit' });

        let count = 0;
        for (const d of src.dirs) {
          count += collectDatFilesFromDir(path.join(cloneDir, d.rel), d.prefix, d.isCore, datMap, src.id);
        }
        if (src.id === 'official') officialCount = count;
        else unofficialCount = count;
        console.log(`Collected ${count.toLocaleString()} .dat files from ${src.id}`);
      }
    }

    // Sort lexicographically using JS code-unit comparison to match findIndexEntry binary search
    const sortedKeys = Array.from(datMap.keys()).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    console.log(`Packing ${sortedKeys.length.toLocaleString()} total .dat entries into v2 Range-indexed packs…`);

    // Write into a staging dir first so --from-v1 can safely point to OUT_DIR
    const stageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bic-parts-stage-'));

    try {
      const coreDict = Object.create(null);
      let coreCount = 0;

      const indexKeys = [];
      const indexPack = [];
      const indexOffset = [];
      const indexLength = [];

      const packsMeta = [];
      let currentPackBuffers = [];
      let currentPackBytes = 0;
      let currentPackCount = 0;
      let totalBytes = 0;

      const flushPack = () => {
        if (currentPackBuffers.length === 0) return;
        const packIdx = packsMeta.length;
        const file = `p${String(packIdx).padStart(2, '0')}.bin`;
        const merged = Buffer.concat(currentPackBuffers, currentPackBytes);
        fs.writeFileSync(path.join(stageDir, file), merged);
        packsMeta.push({ file, count: currentPackCount, bytes: merged.length });
        totalBytes += merged.length;
        currentPackBuffers = [];
        currentPackBytes = 0;
        currentPackCount = 0;
      };

      for (const key of sortedKeys) {
        const { text, isCore } = datMap.get(key);
        if (isCore) {
          coreDict[key] = text;
          coreCount++;
          indexKeys.push(key);
          indexPack.push(-1);
          indexOffset.push(0);
          indexLength.push(0);
          continue;
        }

        const gz = zlib.gzipSync(Buffer.from(text, 'utf8'), { level: 9 });
        if (gz.length > MAX_PACK_BYTES) {
          console.warn(
            `Skipping oversized single entry ${key} (${(gz.length / 1024 / 1024).toFixed(2)} MB > ${(MAX_PACK_BYTES / 1024 / 1024).toFixed(2)} MB cap)`,
          );
          continue;
        }
        if (currentPackCount > 0 && currentPackBytes + gz.length > MAX_PACK_BYTES) {
          flushPack();
        }
        const packIdx = packsMeta.length;
        const offset = currentPackBytes;
        currentPackBuffers.push(gz);
        currentPackBytes += gz.length;
        currentPackCount++;

        indexKeys.push(key);
        indexPack.push(packIdx);
        indexOffset.push(offset);
        indexLength.push(gz.length);
      }
      flushPack();

      // Write core primitives bundle
      let coreBundleMeta;
      if (coreCount > 0) {
        const coreGz = zlib.gzipSync(Buffer.from(JSON.stringify(coreDict), 'utf8'), { level: 9 });
        fs.writeFileSync(path.join(stageDir, 'core.bin'), coreGz);
        coreBundleMeta = { file: 'core.bin', count: coreCount, bytes: coreGz.length };
        totalBytes += coreGz.length;
      }

      // Write compact sorted index
      const indexObj = {
        keys: indexKeys,
        p: indexPack,
        o: indexOffset,
        l: indexLength,
      };
      const indexGz = zlib.gzipSync(Buffer.from(JSON.stringify(indexObj), 'utf8'), { level: 9 });
      fs.writeFileSync(path.join(stageDir, 'index.bin'), indexGz);
      totalBytes += indexGz.length;

      const manifest = {
        version: 2,
        partCount: indexKeys.length,
        officialCount,
        unofficialCount,
        ...(coreBundleMeta ? { coreBundle: coreBundleMeta } : {}),
        index: { file: 'index.bin', bytes: indexGz.length },
        packs: packsMeta,
      };
      const manifestJson = JSON.stringify(manifest);
      fs.writeFileSync(path.join(stageDir, 'manifest.json'), manifestJson);
      totalBytes += Buffer.byteLength(manifestJson, 'utf8');

      // Atomically swap into OUT_DIR
      fs.rmSync(OUT_DIR, { recursive: true, force: true });
      fs.mkdirSync(path.dirname(OUT_DIR), { recursive: true });
      fs.cpSync(stageDir, OUT_DIR, { recursive: true });

      const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
      const maxPackMb = (Math.max(...packsMeta.map((p) => p.bytes)) / (1024 * 1024)).toFixed(2);
      const coreKb = coreBundleMeta ? (coreBundleMeta.bytes / 1024).toFixed(1) : '0';
      console.log(
        `Done (v2): ${packsMeta.length} packs + core.bin (${coreCount.toLocaleString()} primitives, ${coreKb} KB) + index.bin (${(indexGz.length / 1024).toFixed(1)} KB) = ${indexKeys.length.toLocaleString()} total entries, ${totalMb} MB (largest pack ${maxPackMb} MB).`,
      );
      if (totalBytes > MAX_TOTAL_BYTES) {
        console.warn(`WARNING: Total size ${totalMb} MB exceeds ${(MAX_TOTAL_BYTES / (1024 * 1024 * 1024)).toFixed(0)} GB budget.`);
      }
    } finally {
      fs.rmSync(stageDir, { recursive: true, force: true });
    }
  } finally {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
