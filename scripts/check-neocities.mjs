import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
// Neocities Supporter per-file cap (100 MB) — applies only to hosted static assets in dist/
// (compiled JS/CSS, 3D part models/chunks, catalogs, fonts), not user-imported or exported files.
const MAX_FILE_BYTES = 100 * 1024 * 1024;
// Neocities Supporter total site storage cap (50 GB) for hosted dist/ assets.
const MAX_TOTAL_BYTES = 50 * 1024 * 1024 * 1024;

// Allowed static extensions for hosted dist/ assets (Neocities Supporter compatible)
const ALLOWED_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.json', '.geojson',
  '.txt', '.md', '.csv', '.tsv', '.xml', '.svg', '.png', '.jpg', '.jpeg',
  '.gif', '.webp', '.avif', '.ico', '.woff', '.woff2', '.ttf', '.eot',
  '.otf', '.bin', '.glb', '.gltf', '.glsl', '.webmanifest',
]);

function walk(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

const files = walk(DIST_DIR);
if (files.length === 0) {
  console.error('Neocities check failed: dist/ is empty or missing.');
  process.exit(1);
}

let totalBytes = 0;
let maxBytes = 0;
let largestFile = '';
const errors = [];

for (const file of files) {
  const stat = fs.statSync(file);
  const rel = path.relative(DIST_DIR, file);
  const ext = path.extname(file).toLowerCase();
  totalBytes += stat.size;
  if (stat.size > maxBytes) {
    maxBytes = stat.size;
    largestFile = rel;
  }
  if (stat.size > MAX_FILE_BYTES) {
    errors.push(`Hosted file exceeds 100 MB Neocities Supporter limit: ${rel} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    errors.push(`Disallowed hosted extension for Neocities: ${rel} (${ext})`);
  }
}

if (totalBytes > MAX_TOTAL_BYTES) {
  errors.push(`Total hosted dist size ${(totalBytes / 1024 / 1024 / 1024).toFixed(2)} GB exceeds 50 GB Neocities Supporter cap.`);
}

const chunksManifestPath = path.join(DIST_DIR, 'parts-chunks', 'manifest.json');
if (fs.existsSync(chunksManifestPath)) {
  try {
    const manifest = JSON.parse(fs.readFileSync(chunksManifestPath, 'utf8'));
    if (!manifest || !Array.isArray(manifest.chunks) || manifest.chunks.length === 0) {
      errors.push('dist/parts-chunks/manifest.json is missing a non-empty chunks array.');
    }
  } catch (err) {
    errors.push(`dist/parts-chunks/manifest.json is invalid JSON: ${err.message}`);
  }
}

if (errors.length > 0) {
  console.error('Neocities compliance check FAILED:');
  for (const err of errors) console.error('  -', err);
  process.exit(1);
}

console.log(
  `Neocities compliance PASSED: ${files.length} hosted files, total ${(totalBytes / 1024).toFixed(1)} KB (< 50 GB), largest ${largestFile} (${(maxBytes / 1024).toFixed(1)} KB < 100 MB).`
);
