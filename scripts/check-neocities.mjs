import fs from 'node:fs';
import path from 'node:path';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
// Conservative per-file cap (5 MB) — well under Neocities upload limits & fast in web uploader
const MAX_FILE_BYTES = 5 * 1024 * 1024;
// Conservative total site check (500 MB) — comfortably under Neocities 1 GB free storage cap
const MAX_TOTAL_BYTES = 500 * 1024 * 1024;

// Subset of Neocities free-tier allowed static extensions
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
    errors.push(`File exceeds 5 MB Neocities budget: ${rel} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    errors.push(`Disallowed extension for Neocities free tier: ${rel} (${ext})`);
  }
}

if (totalBytes > MAX_TOTAL_BYTES) {
  errors.push(`Total dist size ${(totalBytes / 1024 / 1024).toFixed(2)} MB exceeds 500 MB budget.`);
}

if (errors.length > 0) {
  console.error('Neocities compliance check FAILED:');
  for (const err of errors) console.error('  -', err);
  process.exit(1);
}

console.log(
  `Neocities compliance PASSED: ${files.length} files, total ${(totalBytes / 1024).toFixed(1)} KB, largest ${largestFile} (${(maxBytes / 1024).toFixed(1)} KB < 5120 KB).`
);
