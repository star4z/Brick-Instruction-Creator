# Page Render Caching & Navigation Performance Design

## Overview

Brick Instruction Creator renders high-resolution HiDPI WebGL diagrams (up to `3600px` wide) for Cover, Build Complete, Section Divider, Submodel, Step, and Official Minifigure pages. Without caching and fast-path navigation, flipping between pages — especially minifigure pages (Exploded Stack, Sequential Step-by-Step, and 1:1 Reference) — caused multi-second main-thread stalls due to:

1. **Wasted full-step snapshot renders on official minifigure pages** (`renderSnapshot()` previously executed unconditionally before branching to `renderMinifigExplodedDiagram` / `renderMinifigSequentialStage`, discarding the multi-megapixel result on every visit and revisit).
2. **Synchronous `canvas.toDataURL('image/png')` + base64 HTML + image decode round-trips** on every live render and every revisit.
3. **Double-supersampling on minifigure sub-renders**, multiplying `1.5×`–`2.0×` on top of an already-HiDPI composite diagram canvas (`computeMinifigDiagramRenderSize`) with WebGL MSAA enabled.
4. **Zero caching for live step renders and 1:1 minifigure cards**, forcing complete mesh rebuild + WebGL draw + PNG encode on every page revisit.
5. **Redundant `rebuildPages()` and `syncMenuControls()` passes** on pure Next/Prev page flips (recomputing all bounding boxes, Smart Auto Grid packing, Parts List packing, and hidden modal previews on every click).
6. **PLI thumbnail `toDataURL` pipeline flushes** firing after queuing multi-megapixel step renders on the shared WebGL `snapshotCanvas`.

This document describes the general, model-agnostic rendering cache and navigation pipeline implemented in `src/engine/pageRenderCache.ts` and wired into `src/studioRuntime.ts`.

---

## Architecture

### 1. Pure Caching & Scheduling Engine (`src/engine/pageRenderCache.ts`)

All cache policy, key generation, adaptive supersampling, and pre-warm ordering live in a pure, DOM-free TypeScript module:

- **`createPixelBudgetCache<T>(options)`**:
  - O(1) `Map`-based LRU cache bounded simultaneously by **`maxEntries`** and **`maxTotalPixels`** so HiDPI canvas memory stays strictly bounded on both desktop and mobile devices.
  - Supports `canEvict(value)` so offscreen `<canvas>` elements currently mounted in the live DOM (`canvas.isConnected`) are never zeroed out during eviction.
  - Supports `onEvict(value)` to release backing-store memory (`canvas.width = 0; canvas.height = 0`) when entries are evicted or epochs are bumped.
  - Exposes `bumpEpoch()` / `getEpoch()` for instant O(1) cache invalidation on model reload, texture decode, lighting mode change, or library updates.
- **Deterministic Render Cache Keys**:
  - `buildLiveStepRenderCacheKey`: hashes part signatures (part IDs, colors, transforms), camera azimuth/elevation, `modelScale`, target dimensions, highlight/fade/lighting/outline/background flags, arrow settings, part offsets, selected part IDs, and minifigure prep metadata.
  - `buildMinifigOneToOneCacheKey`: keys 1:1 minifigure renders by parts signature, physical page height, bounding box limits, accent, outline weight, and lighting mode.
  - `buildStaticPageSnapCacheKey`: keys `section_divider`, `submodel_page`, and `sub_callout` renders by parts signature, camera, dimensions, lighting, outlines, and background polarity.
- **`computeSubrenderSupersampleFactor(dstW, dstH, requestedFactor)`**:
  - Preserves up to `1.5×` WebGL supersampling for small callouts (`max(dstW, dstH) <= 340px`, such as minifigure accessory callout boxes).
  - Tapers smoothly between `340px` and `720px`.
  - Renders `1.0×` (exact native HiDPI resolution with WebGL MSAA `antialias: true`) for large sub-renders (`>= 720px`) already sized at `2.25×`–`3.25×` above CSS pixels by `computeMinifigDiagramRenderSize`, eliminating wasteful double-supersampling without reducing output resolution.
- **`computePrewarmPageIndices(currentPageIdx, totalPages, lastDirection)`**:
  - Orders adjacent pages `[primary, secondary]` according to the user's current travel direction (`+1` forward or `-1` backward).

---

### 2. Zero-Encode Canvas Mounting & Direct PDF Drawing (`src/studioRuntime.ts`)

- All live page renderers (`renderSnapshot`, `renderMeshSnapshot`, `renderStepWithStudioPhoto`, `renderCoverHeroSnapshot`, `renderMinifigOneToOne`, `renderMinifigExplodedDiagram`, `renderMinifigSequentialStage`) capture their WebGL output directly into an offscreen 2D `<canvas>` (`captureOffscreenCanvas`) and return a result object (`createCanvasRenderResult`) with a **lazy `.url` getter** (`toDataURL('image/png')` is computed and memoized *only* if a consumer actually needs a data URL).
- `renderAll()` mounts cached `<canvas>` elements directly into `<span data-canvas-mount="...">` placeholders via `mountRenderedCanvas()`, completely eliminating PNG compression, multi-megabyte base64 strings in `frame.innerHTML`, and browser PNG decoding on both first visits and revisits.
- `refreshStepModelsForZoom()` swaps upgraded `<canvas>` elements in place (`swapRenderedElement`) while preserving `data-pick-step` / `data-cover-hero-img` attributes, and `bindStepPageInteractions()` delegates picking through `.step-slot` so upgraded canvases remain clickable in Parts Mode.
- PDF export (`renderPageToJpegBytes`) draws cached/rendered `<canvas>` elements directly onto the PDF canvas via `resolveRenderDrawable()`, avoiding unnecessary PNG round-trips during PDF generation as well.
- Cache budgets are tuned per device class:
  - `pageRenderCache`: `36` entries / `54M` px on desktop (`18` entries / `22M` px on mobile).
  - `minifigDiagramCache`: `24` entries / `48M` px on desktop (`12` entries / `20M` px on mobile).
  - `minifigOneToOneCache`: `16` entries / `16M` px on desktop (`8` entries / `8M` px on mobile).
  - `coverHeroCache`: `8` entries / `36M` px on desktop (`4` entries / `16M` px on mobile), plus separate mesh caching (`coverHeroMeshCache`).

---

### 3. Minifigure & Step Page Fast Paths

- **Skip Wasted Minifigure Step Snapshot**: On official minifigure pages (`exploded` or `sequential` style), `renderAll()` skips `renderSnapshot()` completely unless live 3D camera orbit (`showLive3D`) is active — in which case `buildLiveStepMeshOnly()` builds only the mesh buffers needed by the live orbit engine without performing an unused static render.
- **Skip Static Cover/Complete Hero in Live Camera Mode**: Cover and Build Complete pages skip `renderCoverHeroSnapshot()` while interactive `#liveHeroCanvas` is mounted.
- **Cached Minifigure Decomposition Plans**: Both `getMinifigExplodedPlanForStep` and `getMinifigSequentialPlanForStep` memoize their geometric decomposition plans.
- **PLI Thumbnail Ordering**: On step pages, any uncached `420×420` PLI thumbnails are generated *before* queuing multi-megapixel step renders on `snapshotCanvas`, preventing small `toDataURL` readbacks from triggering a synchronous GPU pipeline flush behind queued step frames.
- **Zero Duplicate Rotation-Badge Geometry Scan**: `renderAll()` computes rotation-cue badge placement once in `positionVisibleStepRotationBadges()` after DOM mount rather than scanning triangles twice.

---

### 4. Pure Page-Navigation Fast Path (`pageNavigationOnly`)

- Pure page navigation and mode-switching entry points (`navigatePage`, `jumpToStepById`, `jumpToPageAndStep`, `switchStudioMode`, `stepGotoDivBtn`, `openExtraPageSettings`, and step/part selection clicks) call `renderAll({ pageNavigationOnly: true })`.
- In `pageNavigationOnly` mode (when `state.model` and `state.pages` are already built):
  - Skips `rebuildPages()` (no layout reflow, BOM re-sorting, or bounding-box recomputation).
  - Skips static model card/stats DOM updates, `syncPageSizeWarningUI()`, and `syncMenuControls()` (which otherwise rebuilds hidden Style/BOM/Paper/Layout modal previews).
  - Keeps `syncStepToolbars()` and all page-specific chrome (page label/counter, prev/next buttons, active mode tabs, context overlay) synchronized.
- Structural mutations that already call `rebuildPages()` immediately beforehand (`toggleStepPageBreak`, `applyMinifigStyleChange`, `clearAllStepPageBreaks`, `toggleExtraPage`) pass `{ skipRebuildPages: true }` to avoid running `rebuildPages()` twice.

---

### 5. Paint-Aware Adjacent-Page Idle Pre-Warming

- At the end of `renderAll()`, `scheduleAdjacentPagePrewarm()` waits **two `requestAnimationFrame` frames** so the current page finishes painting without GPU contention, then schedules one-task-per-idle-slice pre-warming (`requestIdleCallback`, falling back to `setTimeout`) for adjacent pages ordered by `computePrewarmPageIndices`.
- Pre-warming covers Cover/Complete heroes, Section Dividers, Submodel pages, Exploded & Sequential Minifigure diagrams, 1:1 Minifigure cards, Step renders, Subassembly callouts, and PLI/BOM thumbnails.
- Any new `renderAll()`, zoom change (`state.zoom > 1.05`), tab hide (`document.hidden`), Overview modal open, or cache invalidation immediately cancels in-flight pre-warm timers and animation frames via `cancelAdjacentPagePrewarm()`.
