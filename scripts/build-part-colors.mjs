#!/usr/bin/env node
// Builds the bundled Part Color Availability index served from `public/parts-catalog/part-colors.json`.
//
// Uses Rebrickable's public daily CSV dumps (elements.csv.gz, inventory_parts.csv.gz,
// part_relationships.csv.gz) to record which real-world LEGO colors (translated to standard
// LDraw LDConfig.ldr color IDs) each part in the Bricks Library catalog has actually been
// produced in.
//
// Usage: node scripts/build-part-colors.mjs

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const CATALOG_DIR = path.resolve(process.cwd(), 'public/parts-catalog');
const STUDIO_RUNTIME_PATH = path.resolve(process.cwd(), 'src/studioRuntime.ts');
const BUILTIN_CATALOG_PATH = path.resolve(process.cwd(), 'src/data/partCatalog.ts');
const OUT_FILE = path.join(CATALOG_DIR, 'part-colors.json');

const REBRICKABLE_URLS = {
  elements: 'https://cdn.rebrickable.com/media/downloads/elements.csv.gz',
  inventoryParts: 'https://cdn.rebrickable.com/media/downloads/inventory_parts.csv.gz',
  partRelationships: 'https://cdn.rebrickable.com/media/downloads/part_relationships.csv.gz',
};

/**
 * Rebrickable color ID -> standard LDraw (`LDConfig.ldr`) color ID overrides for IDs where
 * Rebrickable diverges from LDraw (all other IDs < 1000 share identical numeric IDs).
 */
const REBRICKABLE_TO_LDRAW_COLOR = {
  45: 37,    // Trans-Dark Pink
  57: 38,    // Trans-Neon Orange
  143: 293,  // Trans-Medium Blue -> Trans-Light Blue Violet
  158: 326,  // Yellowish Green
  182: 57,   // Trans-Orange
  230: 45,   // Trans-Pink
  236: 44,   // Trans-Light Purple
  326: 330,  // Olive Green
  1000: 329, // Glow in Dark White
  1004: 231, // Trans-Flame Yellowish Orange -> Trans-Bright Light Orange
  1005: 234, // Trans-Fire Yellow
  1007: 218, // Reddish Lilac
  1050: 353, // Coral -> Vibrant Coral
  1053: 339, // Opal Trans-Light Blue -> Satin Trans-Light Blue
  1054: 367, // Opal Trans-Dark Pink -> Satin Trans-Dark Pink
  1055: 360, // Opal Trans-Clear -> Satin Trans-Clear
  1056: 363, // Opal Trans-Brown -> Satin Trans-Brown
  1058: 285, // Trans-Light Green
  1059: 364, // Opal Trans-Purple -> Satin Trans-Purple
  1060: 365, // Opal Trans-Bright Green -> Satin Trans-Bright Green
  1061: 362, // Opal Trans-Dark Blue -> Satin Trans-Dark Blue
  1062: 368, // Vibrant Yellow -> Neon Yellow
  1067: 128, // Dark Nougat
  1088: 370, // Medium Brown
  1089: 371, // Warm Tan
  1092: 300, // Metallic Copper
  1095: 40,  // Trans-Black
  1103: 148, // Pearl Titanium -> Pearl Dark Gray
  1136: 402, // Reddish Orange
  1137: 422, // Sienna Brown
  1138: 423, // Umber Brown
};

const PRINTED_PART_RE = /(?:pr\d+|pat\d+|pb\d+|ps\d+|p\d+[a-z0-9]*|d\d+[a-z0-9]*)$/i;

function readSupportedLDrawColors() {
  const src = fs.readFileSync(STUDIO_RUNTIME_PATH, 'utf8');
  const match = src.match(/const COLORS = \{([\s\S]*?)\n\};/);
  if (!match) throw new Error('Could not locate COLORS dictionary in src/studioRuntime.ts');
  const ids = new Set();
  for (const line of match[1].split('\n')) {
    const m = line.match(/^\s*(\d+):\{name:'/);
    if (m) ids.add(Number(m[1]));
  }
  return ids;
}

function readTargetPartIds() {
  const ids = new Set();
  for (const file of ['official.json', 'unofficial.json']) {
    const full = path.join(CATALOG_DIR, file);
    if (!fs.existsSync(full)) continue;
    const payload = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (!Array.isArray(payload.parts)) continue;
    for (const row of payload.parts) {
      if (!Array.isArray(row) || typeof row[0] !== 'string') continue;
      const flags = typeof row[2] === 'string' ? row[2] : '';
      if (flags.includes('h')) continue; // skip internal subparts/primitives
      ids.add(row[0].trim().toLowerCase());
    }
  }
  if (fs.existsSync(BUILTIN_CATALOG_PATH)) {
    const src = fs.readFileSync(BUILTIN_CATALOG_PATH, 'utf8');
    for (const m of src.matchAll(/^\s*'?([0-9a-z_-]+)'?\s*:\s*\{/gm)) {
      ids.add(m[1].toLowerCase());
    }
  }
  return ids;
}

function translateColorId(rawColorId, supportedLDrawColors) {
  const rbId = Number(rawColorId);
  if (!Number.isFinite(rbId) || rbId < 0 || rbId === 9999) return null;
  const ldrawId = Object.prototype.hasOwnProperty.call(REBRICKABLE_TO_LDRAW_COLOR, rbId)
    ? REBRICKABLE_TO_LDRAW_COLOR[rbId]
    : rbId;
  return supportedLDrawColors.has(ldrawId) ? ldrawId : null;
}

async function fetchCsvLines(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'brick-instruction-creator-part-colors' } });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return zlib.gunzipSync(buf).toString('utf8').split(/\r?\n/);
}

function addColor(map, rawPartId, ldrawColorId) {
  if (ldrawColorId === null) return;
  const id = String(rawPartId || '').trim().toLowerCase();
  if (!id) return;
  let set = map.get(id);
  if (!set) {
    set = new Set();
    map.set(id, set);
  }
  set.add(ldrawColorId);
}

async function main() {
  const supportedColors = readSupportedLDrawColors();
  const targetPartIds = readTargetPartIds();
  console.log(`Loaded ${supportedColors.size} supported LDraw colors and ${targetPartIds.size} target catalog parts.`);

  const [elemLines, invLines, relLines] = await Promise.all([
    fetchCsvLines(REBRICKABLE_URLS.elements),
    fetchCsvLines(REBRICKABLE_URLS.inventoryParts),
    fetchCsvLines(REBRICKABLE_URLS.partRelationships),
  ]);

  const colorsByPart = new Map();
  const colorsByDesign = new Map();

  for (let i = 1; i < elemLines.length; i++) {
    const line = elemLines[i];
    if (!line) continue;
    const cols = line.split(',');
    if (cols.length < 3) continue;
    const partNum = cols[1].trim().toLowerCase();
    const ldrawCol = translateColorId(cols[2], supportedColors);
    if (ldrawCol === null) continue;
    addColor(colorsByPart, partNum, ldrawCol);
    const designId = cols[3]?.trim().toLowerCase();
    if (designId && !PRINTED_PART_RE.test(partNum)) {
      addColor(colorsByDesign, designId, ldrawCol);
    }
  }

  for (let i = 1; i < invLines.length; i++) {
    const line = invLines[i];
    if (!line) continue;
    const cols = line.split(',');
    if (cols.length < 3) continue;
    const ldrawCol = translateColorId(cols[2], supportedColors);
    if (ldrawCol === null) continue;
    addColor(colorsByPart, cols[1], ldrawCol);
  }

  // Mold (M) and Alternate (A) equivalences for unprinted parts that don't have a direct Rebrickable part_num match
  const moldEquiv = new Map();
  for (let i = 1; i < relLines.length; i++) {
    const line = relLines[i];
    if (!line) continue;
    const cols = line.split(',');
    const type = cols[0];
    if (type !== 'M' && type !== 'A') continue;
    const c = cols[1]?.trim().toLowerCase();
    const p = cols[2]?.trim().toLowerCase();
    if (!c || !p) continue;
    if (!moldEquiv.has(c)) moldEquiv.set(c, new Set());
    if (!moldEquiv.has(p)) moldEquiv.set(p, new Set());
    moldEquiv.get(c).add(p);
    moldEquiv.get(p).add(c);
  }

  const sortedTargetIds = Array.from(targetPartIds).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );

  const parts = {};
  const distinctColors = new Set();
  let directMatches = 0;
  let relMatches = 0;
  let designMatches = 0;
  let totalPairs = 0;

  for (const id of sortedTargetIds) {
    let colorSet = colorsByPart.get(id);
    if (colorSet && colorSet.size > 0) {
      directMatches++;
    } else if (!PRINTED_PART_RE.test(id)) {
      if (moldEquiv.has(id)) {
        const merged = new Set();
        for (const eq of moldEquiv.get(id)) {
          const eqCols = colorsByPart.get(eq);
          if (eqCols) for (const c of eqCols) merged.add(c);
        }
        if (merged.size > 0) {
          colorSet = merged;
          relMatches++;
        }
      }
      if ((!colorSet || colorSet.size === 0) && colorsByDesign.has(id)) {
        colorSet = colorsByDesign.get(id);
        designMatches++;
      }
    }

    if (colorSet && colorSet.size > 0) {
      const arr = Array.from(colorSet).sort((a, b) => a - b);
      parts[id] = arr;
      totalPairs += arr.length;
      for (const c of arr) distinctColors.add(c);
    }
  }

  const payload = {
    format: 'brick-instruction-works-part-colors',
    version: 1,
    source: 'rebrickable',
    generatedAt: new Date().toISOString(),
    partCount: Object.keys(parts).length,
    colorCount: distinctColors.size,
    parts,
  };

  fs.mkdirSync(CATALOG_DIR, { recursive: true });
  const json = JSON.stringify(payload);
  fs.writeFileSync(OUT_FILE, json);
  const gzSize = zlib.gzipSync(json).length;
  console.log(
    `wrote ${OUT_FILE} (${payload.partCount} parts, ${payload.colorCount} colors, ${totalPairs} pairs — ` +
      `direct: ${directMatches}, mold/alt: ${relMatches}, design: ${designMatches}; ` +
      `${(json.length / 1024).toFixed(1)} KB raw, ${(gzSize / 1024).toFixed(1)} KB gzipped)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
