# Pre-Import Missing Parts Suggestion Design

## Problem Statement

When a user imports an LDraw (`.ldr` / `.mpd`) file — or a `.io` file referencing external/unbundled parts — missing 3D part shapes fall back to dummy `1×1` placeholder bounding boxes, and missing official printed LDraw `.dat` parts or `!TEXMAP` PNG decals render without faces/prints.

Previously, importing a file jumped directly into subdivision analysis (`prepareSubdivisionData` / `analyzeModelSubdivisions`) and the Step Generation Wizard (`#importModal`) before fetching missing parts. As a result:
- The 3D exploded preview inside the Step Generation Wizard showed placeholder boxes and blank heads.
- Adjacency graphs, subdivision proposals, and support/floating calculations operated on inaccurate bounding boxes.
- Users only learned about missing parts *after* the manual had already been generated.

## Architecture

### 1. Pure Pre-Import Analyzer (`src/engine/missingParts.ts`)
Runs immediately after `parseImportedModel` and before `prepareSubdivisionData` / `openImportAssistant`:
- Walks all leaf parts (unwrapping fused assembly `children`) and categorizes missing assets:
  1. **Missing 3D shapes (`missingShapes`)**: Parts with neither an exact `.dat` (`lookupExactRawDat`) nor a known catalog/procedural shape (`hasKnownShape`), tagged as either `fetchable: true` (standard LDraw ID or BrickLink ID with a fetchable base mold) or `fetchable: false` (Studio-only custom assemblies such as `bb####`).
  2. **Missing official LDraw printed parts (`missingPrinted`)**: Official patterned LDraw IDs (e.g., `3626cp01`, `3626cpb7`, `3626cpx0`, `973p1b`, `3069bp01`) where only a procedural/unprinted base mold is known (`!lookupExactRawDat(k)`), excluding BrickLink-proprietary `bl_*` / `pb###+` IDs.
  3. **Missing `!TEXMAP` PNG decals (`missingTextures`)**: Texture filenames referenced by already-loaded `.dat` parts/subparts not yet registered in `textureStore`.
- Sets `shouldPrompt = totalMissingUnique > 0`. Fully self-contained `.io` files and previously cached `.ldr` models yield `shouldPrompt = false` and proceed directly to the Step Generation Wizard with zero extra clicks.

### 2. Pre-Wizard Suggestion Modal (`#missingPartsModal` in `index.html` & `src/studioRuntime.ts`)
When `shouldPrompt` is `true`, `#missingPartsModal` opens **before** `prepareSubdivisionData` and `#importModal`:
- Displays a concise summary of missing 3D shapes, printed parts, and decal textures along with a scrollable preview list of missing part names, `.dat` codes, counts, and type badges (`Shape`, `Printed`, `Decal PNG`, `Custom ID`).
- **Primary CTA — Fetch Missing Parts Online**:
  - Invokes `fetchMissingPartsOnline({ parsed, silent: true, onProgress })` targeting the pending `parsed` model directly (without rebuilding the previously loaded `state.model`), streaming live progress for both `.dat` subparts and `!TEXMAP` PNG textures into the modal's inline progress bar.
  - Persists all downloaded `.dat` files and PNG textures to IndexedDB (`LIB_STORE`), clears mesh/thumbnail caches, and re-runs `analyzePendingImportMissingParts(parsed)`.
  - If all missing parts are resolved, automatically closes the modal and advances directly into `proceedAfterMissingPartsCheck(parsed)` (running fresh subdivision analysis on real 3D meshes and opening the Step Generation Wizard).
  - If the environment is offline/blocked or custom/unlisted IDs remain, shows an inline status notice and switches the primary CTA to **Continue to Step Wizard**.
- **Local Library Option — Import `.zip` / `.dat`**:
  - Lets users load LDraw `complete.zip` or custom Studio `.dat` files right from the prompt; once imported, automatically re-checks the pending model and either advances immediately or refreshes the remaining count.
- **Escape Hatch — Skip & Continue**:
  - Advances directly to the Step Generation Wizard and passes `skipAutoFetch: true` so `finishImport` respects the user's choice instead of re-triggering a background fetch.
