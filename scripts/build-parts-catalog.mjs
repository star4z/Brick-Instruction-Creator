#!/usr/bin/env node
// Builds the bundled Online Parts Catalog index served from `public/parts-catalog/`.
//
// The catalog lists every top-level part (ID + title) available from the public mirrors the app
// already fetches geometry from — WITHOUT bundling any geometry (official LDraw is ~311 MB of .dat
// files and the UnOfficial/Studio mirror ~1 GB). The Bricks Library uses it for browse/search and
// downloads each part's exact .dat on demand.
//
// Usage: node scripts/build-parts-catalog.mjs   (set GITHUB_TOKEN to avoid API rate limits)
//
// Only the first ~1.5 KB of each .dat is requested (HTTP Range) to read its header.

import fs from 'node:fs';
import path from 'node:path';

const SOURCES = [
  {
    id: 'official',
    label: 'Official LDraw Library',
    repo: 'kulits/ldraw-parts',
    branch: 'master',
    partsPrefix: 'ldraw/parts/',
  },
  {
    id: 'unofficial',
    label: 'LDraw Unofficial & Studio Parts',
    repo: 'iefierros/LegoMaster',
    branch: 'main',
    partsPrefix: 'ldraw/UnOfficial/parts/',
  },
];

const OUT_DIR = path.resolve(process.cwd(), 'public/parts-catalog');
const CONCURRENCY = Number(process.env.CATALOG_CONCURRENCY || 48);
const RANGE_BYTES = 1536;

const ghHeaders = { Accept: 'application/vnd.github+json', 'User-Agent': 'brick-instruction-catalog' };
if (process.env.GITHUB_TOKEN) ghHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function getTree(src) {
  const ref = await fetch(`https://api.github.com/repos/${src.repo}/commits/${src.branch}`, { headers: ghHeaders });
  if (!ref.ok) throw new Error(`commit lookup failed for ${src.repo}: ${ref.status}`);
  const sha = (await ref.json()).sha;
  const res = await fetch(`https://api.github.com/repos/${src.repo}/git/trees/${sha}?recursive=1`, { headers: ghHeaders });
  if (!res.ok) throw new Error(`tree fetch failed for ${src.repo}: ${res.status}`);
  const json = await res.json();
  if (json.truncated) throw new Error(`tree for ${src.repo} is truncated`);
  const files = json.tree
    .filter((t) => t.type === 'blob' && t.path.startsWith(src.partsPrefix))
    .map((t) => t.path.slice(src.partsPrefix.length))
    .filter((rel) => !rel.includes('/') && /\.dat$/i.test(rel));
  return { sha, files };
}

/** Mirrors `extractCleanDatTitle` in src/engine/ldrLibrary.ts plus type/alias flags. */
function parseHeader(text) {
  const lines = text.split(/\r?\n/).slice(0, 24);
  let title = null;
  let orgType = '';
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l.startsWith('0 ')) continue;
    const org = l.match(/^0\s+!LDRAW_ORG\s+(\S+)/i);
    if (org) orgType = org[1].replace(/^Unofficial_/i, '');
    if (title !== null) continue;
    if (/^0\s+(?:FILE|Name:|Author:|IsSubModel|BL_|Flexible|Render|IsAssembly|!|BFC|PE_TEX_|\/\/|NumOfBricks|CustomBrick)/i.test(l)) continue;
    title = l.replace(/^0\s+/, '').trim();
  }
  return { title: title || '', orgType };
}

async function fetchHeader(url, attempt = 0) {
  try {
    const res = await fetch(url, { headers: { Range: `bytes=0-${RANGE_BYTES - 1}` } });
    if (res.status === 404) return null;
    if (!res.ok && res.status !== 206) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    if (attempt < 4) {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      return fetchHeader(url, attempt + 1);
    }
    console.warn(`  ! ${url}: ${err.message}`);
    return null;
  }
}

async function buildSource(src, skipIds) {
  const { sha, files } = await getTree(src);
  console.log(`${src.repo}@${sha.slice(0, 7)}: ${files.length} part files`);
  const base = `https://raw.githubusercontent.com/${src.repo}/${sha}/${src.partsPrefix}`;
  const todo = files.filter((f) => !skipIds.has(f.replace(/\.dat$/i, '').toLowerCase()));
  const entries = [];
  let idx = 0;
  let done = 0;
  async function worker() {
    while (idx < todo.length) {
      const file = todo[idx++];
      const text = await fetchHeader(base + encodeURIComponent(file));
      done++;
      if (done % 2000 === 0) console.log(`  ${done}/${todo.length}`);
      if (text == null) continue;
      const id = file.replace(/\.dat$/i, '').toLowerCase();
      const { title, orgType } = parseHeader(text);
      if (/^~?Moved\s+to\b/i.test(title)) continue; // redirect stubs
      let flags = '';
      if (/^(?:Subpart|Primitive|48_Primitive|8_Primitive)$/i.test(orgType) || title.startsWith('~')) flags += 'h';
      if (title.startsWith('=') || /Alias/i.test(orgType)) flags += 'a';
      let clean = title.replace(/^[=~_]+/, '').replace(/\s{2,}/g, ' ').trim();
      if (/^(?:UntitledModel|Untitled Model)$/i.test(clean)) clean = '';
      entries.push(flags ? [id, clean, flags] : [id, clean]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  entries.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  return { sha, entries };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const seen = new Set();
  for (const src of SOURCES) {
    const { sha, entries } = await buildSource(src, seen);
    for (const e of entries) seen.add(e[0]);
    const payload = {
      format: 'brick-instruction-works-parts-catalog',
      version: 1,
      source: src.id,
      label: src.label,
      repo: src.repo,
      commit: sha,
      generatedAt: new Date().toISOString(),
      count: entries.length,
      // [id, title, flags?] — flags: 'h' = subpart/primitive helper, 'a' = alias
      parts: entries,
    };
    const outFile = path.join(OUT_DIR, `${src.id}.json`);
    fs.writeFileSync(outFile, JSON.stringify(payload));
    console.log(`wrote ${outFile} (${entries.length} parts, ${(fs.statSync(outFile).size / 1024).toFixed(0)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
