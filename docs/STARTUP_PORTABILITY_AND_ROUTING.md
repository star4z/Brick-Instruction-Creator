# Startup Performance, Portable `.biw` Projects & Hash URL Routing

## Overview

This document specifies the startup restoration fast path, parallel I/O optimizations, fully portable `.biw` project format, and hash-based URL routing for manual pages and app views.

## 1. Fast Startup & Session Caching (`src/engine/sessionCache.ts`)

Previously, reloading the last opened `.io`/`.ldr` manual scanned the entire IndexedDB `partsLib` store via `openCursor()`, predecoded every cached library texture, re-unzipped `.io` archives, re-probed missing parts over the network, and re-ran `buildManualFromParsed()` synchronously on the main thread.

### Key Optimizations
1. **Parallel IndexedDB startup reads**: `restoreLastSessionOnStart()` fetches `lastModel`, `lastManualSnapshot`, `customUploadedFonts`, `customThemes`, `prefs`, and `notFoundDatCache` concurrently via `Promise.all()`, while hydrating custom fonts in parallel with model/library loading.
2. **Built manual snapshot cache (`lastManualSnapshot`)**:
   - Keyed by a fast FNV-1a `computeSourceSignature(rec)` + `MANUAL_SNAPSHOT_SCHEMA_VERSION`.
   - Stores `chapters`, `title`, `subtitle`, `importMode`, `subdivisionPlan`, `cameraLayoutAspect`, and serialized `embeddedAssets` (`embeddedDat`, `embeddedDatTitles`, `compositePartDefs`, `embeddedTextures`).
   - On cache hit, startup restores the built manual directly—skipping `.io` unzipping, MPD flattening, and `buildManualFromParsed()`.
   - Raw `lastModel` remains in IndexedDB so clicking **Step Generation / Regenerate** lazily hydrates `state.model._parsed` via `ensureParsedModelHydrated()`.
   - Closing the model clears both `lastModel` and `lastManualSnapshot`.
3. **Targeted BFS lazy `partsLib` loading (`loadPartsFromLibraryForIds`)**:
   - Loads only the `.dat` files and `__tex__:` textures referenced by the active model's transitive dependency tree using single-transaction batched `dbGetMany()` waves.
   - Predecodes only the textures used by the current model (`textureStore.predecodeKeys(...)`).
   - Full library hydration (`ensureFullBricksLibraryLoaded()`) uses bulk `getAllKeys()` + `getAll()` and is deferred to idle time (`requestIdleCallback`) or on-demand when opening the Bricks Library modal.
4. **TTL-persisted 404 cache (`notFoundDatCache`)**:
   - Confirmed 404 part/texture keys are persisted in IndexedDB with a 7-day TTL (`NOT_FOUND_CACHE_TTL_MS`) so missing custom/printed parts are not re-probed across remote mirrors on every reload.
   - Cleared automatically on manual fetch, mirror switch, Bricks Library import, or library reset.

## 2. Additional Parallelization & Batching

- **`.io` archive extraction (`extractIoArchive`)**: Decompresses `model.ldr`, `model2.ldr`, and all embedded texture PNGs concurrently via `Promise.all()`, predecoding only embedded texture keys.
- **Bricks Library imports & saves**: Parallelizes `.dat` file reads and ZIP entry decompression per batch, and writes to IndexedDB in single batched `dbPutMany()` transactions.
- **PDF BOM table rendering**: Pre-decodes all unique row thumbnails concurrently via `Promise.all()` before drawing rows.
- **Multi-font uploads**: Parses uploaded font files concurrently via `Promise.allSettled()`.

## 3. Fully Portable `.biw` Project Files

Exported `.biw` files now include everything required to render the manual identically across browsers and devices:
- All step/part placements (`chapters`), edits (`overrides`, `stepInserts`, `pageInserts`, `dividerAfter`), cover/complete/back metadata, active custom theme, referenced custom fonts, and display/paper settings (`customWidth`, `customHeight`, `customUnit`, `highlightLineWeight`, `outlineLineWeight`, `highQualityStepRender`, `starkBlackOutlines`, `showSizeGuides`, `autoPlacementArrows`, plus fixed `stepLighting` string restoration).
- **Embedded model assets**: `embeddedDat`, `embeddedDatTitles`, `compositePartDefs`, and `embeddedTextures` (from `textureStore.exportEmbeddedTextures()`).
- **Auto-fetching on import**: `handleIncomingProjectFile()` runs `loadPartsFromLibraryForIds()` and `autoFetchMissingPartsForIds()` so standard LDraw shapes download automatically on a fresh browser.
- **Reload persistence**: Imported `.biw` projects persist as `lastManualSnapshot` with `kind: 'project'` so page reloads restore them immediately.

## 4. Hash URL Routing (`src/engine/urlRouting.ts`)

GitHub-Pages-safe hash URLs keep manual pages and app views directly addressable, reload-stable, and Back/Forward-compatible:

- **Manual pages**: `#/cover`, `#/page/<n>`, `#/step/<n>`, `#/complete`, `#/parts-list`, `#/parts-list/<n>`, `#/back-cover`
- **App views / modals**: `#/settings`, `#/bricks-library`, `#/overview`, `#/page-setup`, `#/parts-list-setup`, `#/export`, `#/issues`, `#/shortcuts`, `#/open`
- **Composed page + modal**: e.g. `#/page/4?view=settings` or `#/cover?view=page-setup`
- **Graceful fallback**: Empty, unknown, or out-of-range routes (or model-only routes when no model is open) fall back cleanly to the saved `prefs.pageIdx` or the welcome screen.
