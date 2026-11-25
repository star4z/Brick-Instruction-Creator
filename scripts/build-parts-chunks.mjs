#!/usr/bin/env node
// Builds paginated on-site 3D LDraw & Unofficial/Studio part geometry chunks (`parts-chunks/`).
//
// Each chunk (`cNNN.bin`) is a gzip-compressed JSON dictionary `{ [normKey]: minifiedDatText }`
// sorted lexicographically by normalized key so `manifest.json` only stores `[first, last]` ranges
// (~5 KB total) and the browser downloads only the exact chunk(s) needed on demand.
//
// Usage:
//   node scripts/build-parts-chunks.mjs --out thirdparty/parts-chunks

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
const TARGET_RAW_CHUNK_BYTES = Number(getArg('--target-raw-bytes', String(14 * 1024 * 1024))); // ~1.5-2.5 MB gzipped
const MAX_COMPRESSED_CHUNK_BYTES = Number(getArg('--max-chunk-bytes', String(4_500_000))); // < 5 MB Neocities cap
const MAX_TOTAL_BYTES = Number(getArg('--max-total-bytes', String(450 * 1024 * 1024))); // < 500 MB Neocities cap
const SKIP_UNOFFICIAL = args.includes('--official-only');

const SOURCES = [
  {
    id: 'official',
    repoUrl: 'https://github.com/kulits/ldraw-parts.git',
    branch: 'master',
    dirs: [
      { rel: 'ldraw/parts', prefix: '' },
      { rel: 'ldraw/parts/s', prefix: 's/' },
      { rel: 'ldraw/p', prefix: '' },
      { rel: 'ldraw/p/48', prefix: '48/' },
      { rel: 'ldraw/p/8', prefix: '8/' },
    ],
  },
  {
    id: 'unofficial',
    repoUrl: 'https://github.com/iefierros/LegoMaster.git',
    branch: 'main',
    dirs: [
      { rel: 'ldraw/UnOfficial/parts', prefix: '' },
      { rel: 'ldraw/UnOfficial/parts/s', prefix: 's/' },
      { rel: 'ldraw/UnOfficial/p', prefix: '' },
      { rel: 'ldraw/UnOfficial/p/48', prefix: '48/' },
      { rel: 'ldraw/UnOfficial/p/8', prefix: '8/' },
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

function collectDatFilesFromDir(dirPath, prefix, map, origin) {
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
    map.set(key, { text: min, origin });
    added++;
  }
  return added;
}

function flushChunk(entries, chunksMeta, outDir, totalBytesRef) {
  if (entries.length === 0) return;

  const writeSlice = (slice) => {
    const obj = Object.create(null);
    for (const [k, v] of slice) obj[k] = v;
    const json = JSON.stringify(obj);
    const gz = zlib.gzipSync(Buffer.from(json, 'utf8'), { level: 9 });
    if (gz.length > MAX_COMPRESSED_CHUNK_BYTES) {
      if (slice.length > 1) {
        const mid = slice.length >>> 1;
        writeSlice(slice.slice(0, mid));
        writeSlice(slice.slice(mid));
        return;
      }
      console.warn(
        `Skipping oversized single entry ${slice[0][0]} (${(gz.length / 1024 / 1024).toFixed(2)} MB > ${(MAX_COMPRESSED_CHUNK_BYTES / 1024 / 1024).toFixed(2)} MB cap)`,
      );
      return;
    }
    const idx = chunksMeta.length;
    const file = `c${String(idx).padStart(3, '0')}.bin`;
    fs.writeFileSync(path.join(outDir, file), gz);
    totalBytesRef.bytes += gz.length;
    chunksMeta.push({
      file,
      first: slice[0][0],
      last: slice[slice.length - 1][0],
      count: slice.length,
      bytes: gz.length,
    });
  };

  writeSlice(entries);
}

function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bic-parts-chunks-'));
  console.log(`Working in ${tmpDir}`);

  try {
    const datMap = new Map();
    let officialCount = 0;
    let unofficialCount = 0;

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
        count += collectDatFilesFromDir(path.join(cloneDir, d.rel), d.prefix, datMap, src.id);
      }
      if (src.id === 'official') officialCount = count;
      else unofficialCount = count;
      console.log(`Collected ${count.toLocaleString()} .dat files from ${src.id}`);
    }

    // Sort lexicographically using JS code-unit comparison to match findChunkForPartKey binary search
    const sortedKeys = Array.from(datMap.keys()).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
    console.log(`Packing ${sortedKeys.length.toLocaleString()} total .dat entries into chunks…`);

    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const chunksMeta = [];
    const totalBytesRef = { bytes: 0 };
    let bucket = [];
    let bucketRawBytes = 0;

    for (const key of sortedKeys) {
      const { text } = datMap.get(key);
      const estBytes = key.length + text.length + 12;
      if (bucket.length > 0 && bucketRawBytes + estBytes > TARGET_RAW_CHUNK_BYTES) {
        flushChunk(bucket, chunksMeta, OUT_DIR, totalBytesRef);
        bucket = [];
        bucketRawBytes = 0;
      }
      bucket.push([key, text]);
      bucketRawBytes += estBytes;
    }
    flushChunk(bucket, chunksMeta, OUT_DIR, totalBytesRef);

    const manifest = {
      version: 1,
      partCount: sortedKeys.length,
      officialCount,
      unofficialCount,
      chunks: chunksMeta,
    };
    const manifestJson = JSON.stringify(manifest);
    fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), manifestJson);

    const totalMb = (totalBytesRef.bytes / (1024 * 1024)).toFixed(2);
    const maxChunkKb = (Math.max(...chunksMeta.map((c) => c.bytes)) / 1024).toFixed(1);
    console.log(
      `Done: ${chunksMeta.length} chunks, ${sortedKeys.length.toLocaleString()} files, total ${totalMb} MB (largest chunk ${maxChunkKb} KB, manifest ${(manifestJson.length / 1024).toFixed(1)} KB)`,
    );
    if (totalBytesRef.bytes > MAX_TOTAL_BYTES) {
      console.warn(`WARNING: Total size ${totalMb} MB exceeds ${(MAX_TOTAL_BYTES / (1024 * 1024)).toFixed(0)} MB budget.`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
