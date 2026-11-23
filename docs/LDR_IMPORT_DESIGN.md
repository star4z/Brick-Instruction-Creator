# LDraw (`.ldr` / `.mpd`) Automatic Import & Parts Resolution Design

## 1. Problem Statement

BrickLink Studio `.io` archives embed complete `.dat` geometry for every part in `model2.ldr`, whereas plain LDraw `.ldr` and `.mpd` files only reference external part IDs (e.g., `3029.dat`, `27448.dat`, `86210.dat`). Previously, importing `.ldr` / `.mpd` files suffered from several compounding failures:

1. **No automatic part fetching on import**: `.ldr` / `.mpd` files were parsed, analyzed for subdivision, previewed in 3D, and turned into steps *before* any `.dat` geometry was loaded. Missing parts fell back to `1×1` brick bounding boxes (e.g., `3029.dat` Plate 4×12 collapsed to 1×1) and catalog shapes fell back to solid rectangular boxes, producing dozens of Missing Shape errors, false Disconnected/Floating errors, broken subdivision cuts, and mangled renders.
2. **Stale & slow mirror fetching**: Manual fetching used an older April 2024 mirror at concurrency 6, sequentially probing `parts/`, `p/`, and `parts/s/` across duplicate mirrors on every 404.
3. **Printed official parts skipped when unprinted base was cached**: Checking fallback-matched cache entries prevented official printed parts (e.g., `3626cp01.dat`, `3069bp01.dat`) from being fetched whenever the unprinted base mold (`3626c`, `3069b`) was already loaded.
4. **MPD / LDR parser edge cases**:
   - Comment-only preambles before the first `0 FILE` were flushed as an empty root model.
   - Submodels declaring `0 !LDRAW_ORG Model` or `Unofficial_Model` were misclassified as single `.dat` parts instead of expanded submodels.
   - Backslash vs. forward-slash mismatches in `0 FILE` submodel references broke lookups.
   - Direct RGB hex colors (`0x2RRGGBB`) on type-1 lines parsed as `0` (Black), and common official LDConfig colors (such as `256` Rubber Black, `182` Trans-Bright Orange, `402` Reddish Orange, and Satin Trans finishes) triggered false unknown-color warnings.
   - `~Moved to <target>` redirect stubs and `=` alias prefixes leaked raw LDraw syntax into BOM/PLI part titles.
   - External `!TEXMAP` PNG textures and `0 !: 1 ...` subfile references inside `!TEXMAP` blocks were not fetched.

---

## 2. Architecture (`src/engine/ldrLibrary.ts` + `src/studioRuntime.ts`)

```mermaid
flowchart LR
    File[".ldr / .mpd / .io File"] --> Parse["splitMpd + flattenMpd\n(Normalized keys, 0x2RRGGBB,\nModel vs Part !LDRAW_ORG)"]
    Parse --> AutoFetch["autoFetchMissingPartsForParsed\n(High-concurrency BFS = 16,\nIndexedDB cache + Skip UI)"]
    AutoFetch --> Compile["datCompiler + textureStore\n(Exact 3D meshes & !TEXMAP)"]
    Compile --> Subdiv["Subdivision Analyzer &\n3D Import Preview"]
    Subdiv --> Steps["Zero-Floating Step Generator\n& Cover / PLI / BOM Render"]
```

### 2.1 Automatic Pre-Analysis Fetching & Session Healing
- Immediately after `parseImportedModel(...)` in `fileInput.onchange` (and when reopening a saved `.ldr` / `.io` model in `restoreLastSessionOnStart()`), `autoFetchMissingPartsForParsed(parsed, displayName)` runs **before** `prepareSubdivisionData`, `analyzeModelSubdivisions`, `openImportAssistant`, and `buildManualFromParsed`.
- If all parts are already cached in IndexedDB (`partsLib`), the check finishes synchronously in milliseconds with zero UI flicker.
- If network downloads are needed, `#importFetchOverlay` displays live download progress (`Loaded N shapes (processed/total)`) plus a **Skip & Continue** button wired to an `AbortController`.
- Downloaded `.dat` files and `!TEXMAP` PNG textures (stored under `__tex__:<filename>`) are batch-persisted to IndexedDB so future imports are instant.
- If a restored model or manual **Fetch Online** / **Import .zip** adds missing shapes to a model with an active subdivision plan, `refreshSubdivisionPlanForParsed` re-evaluates the matching subdivision strategy against the real 3D bounding boxes.

### 2.2 Up-to-Date CORS Mirror Chain & Smart Failover
- Primary mirror: `https://raw.githubusercontent.com/kulits/ldraw-parts/master/ldraw/` (daily-synced official LDraw `complete.zip`, including 2024–2026 updates, served via GitHub Fastly CDN with `Access-Control-Allow-Origin: *`).
- Independent fallbacks: `https://mrubens.github.io/ldraw-library/`, `https://raw.githubusercontent.com/gkjohnson/ldraw-parts-library/master/complete/ldraw/`, and `https://cdn.jsdelivr.net/gh/kulits/ldraw-parts@master/ldraw/`.
- Mirrors share a `repoGroup` tag: a clean HTTP `404` skips duplicate mirrors of the same repository, whereas `403` / `429` / `5xx` / timeout / network errors transparently fail over to the next mirror.
- Candidate paths are ordered by LDraw directory conventions (`s/` → `parts/s/`, `48/`/`8/` → `p/`, primitive prefixes → `p/` first, standard numeric parts → `parts/` only), eliminating wasted 404 probes.

### 2.3 Direct-Match BFS & `!TEXMAP` Support
- `fetchLDrawDependencyGraph` checks exact/direct cache membership (`getDirectLoadedDatLines`) rather than stripped fallbacks, ensuring official printed parts (`3626cp01`, `3069bp01`) are downloaded even when their unprinted base mold is already cached.
- `extractDatDependencies` scans both standard `1 ...` lines and `0 !: 1 ...` lines inside `!TEXMAP` blocks, skips primitives natively synthesized by `datCompiler.ts`, and queues external `parts/textures/*.png` files for download and `textureStore` pre-decoding.

### 2.4 Clean Metadata, MPD Parsing & Extended LDConfig Colors
- `hasMpdGeometryOrPartLines` skips comment-only preambles before the first `0 FILE`.
- `normalizeMpdSubfileKey` normalizes path separators, leading `./`, and casing for reliable submodel lookup.
- `isLDrawPartSubfile` treats `0 !LDRAW_ORG Model` / `Unofficial_Model` as submodels while keeping `Part` / `Subpart` / `Primitive` / `Shortcut` as embedded `.dat` parts.
- `extractCleanDatTitle` and `extractMovedToTarget` clean `=` alias prefixes, collapse repeated whitespace, and follow `~Moved to <target>` chains in `getHumanPartName`.
- `parseLDrawColorToken` and `resolveColorInfo` support direct RGB (`0x2RRGGBB`) plus expanded official LDConfig rubber, translucent, satin, metallic, and modern colors.
