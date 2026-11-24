# Scope-Based Editor, Unified 3D Camera & Menu UX Design

## Architecture & Separation of Concerns

### 1. Scope-Based Bottom Mode Pill (`#modePill`)
Every mode tab corresponds to an unambiguous editing scope (eliminating the previous overlap between `Select`, `Rotate`, and `Edit`, and removing the full-screen `#stepEditModal` in favor of live compact floating cards over the active page):

- **Step pages (`page.kind === 'steps'`)**: `[ Pan | Parts | Step | Page ]`
  - **`Pan`**: 1-finger pan & pinch zoom on the live page (hides contextual overlays). On touch / mobile viewports (`(pointer: coarse)` / `< md`), the bottom-right page view zoom box (`#zoomControlsBar`) is hidden so pinch-to-zoom is the natural primary interaction while desktop mouse users keep the zoom stepper (`Zoom Page View Out / In / Reset`).
  - **`Parts`** *(Part-level scope)*: 1-finger tap on 3D parts or Parts Box entries to nudge via visual color-coded 3D axis controls (`Up/Dn`, `L/R`, `Depth`), adjust part `Tilt` (`−15° / deg / +15°`), toggle arrows, or reset placement (**`Selected Parts`** scope). Below a clear divider, cross-step part reorganization actions (`New Step Before`, `New Step After`, `Move to Step…`, `Make Submodel`) are explicitly marked with an amber **`Affects Other Steps`** badge.
  - **`Step`** *(Step-level scope, with inline sub-tabs `Camera | Layout | Notes`)*:
    - **`Camera`**: Live drag-to-orbit on the step's 3D WebGL canvas (matching the static snapshot's exact pixel dimensions and framing), **Cube + Camera** SVG icons for **View** (`Top` / `Bottom`) and 4 neutral isometric **Angle** presets (`45°`, `135°`, `225°`, `315°`), inline **Zoom** (`− / % / +`), **Framing** (`Auto`, `Close-Up`, `Full Model`), and **Reset** (**`This Step`** scope). Separated by a divider, **`Apply Camera to Steps…`** is labeled with an amber **`Step Range`** badge.
    - **`Layout`**: Step-specific **Parts Box Size** and inline subassembly callout direction (**`This Step`**), **Subassembly Display** (`Inline Callout Box` vs. `Separate Full Pages`, tagged **`Adds / Removes Pages`**), **`Merge into Step N-1`** (relocated out of `Parts` and tagged **`Affects Prev Step`**), and **Minifigure Style** + `1:1 Actual-Size Height Card` when viewing a minifigure step (tagged **`All Minifigures`**).
    - **`Notes`**: Step-bound custom text notes & images (`state.stepInserts[step.id]`, tagged **`This Step`**) with direct drag-to-position inside the step slot, corner presets (`TL / TR / BL / BR`), scale (`− / % / +`), and delete.
  - **`Page`** *(Page-level scope)*: Live floating card cleanly separating **`This Page`** identity, **`Affects Later Pages`** (`New Page` / `Break On` per step slot + `+ Divider After`), **`Step Range`** (current Step Range Group or `Custom Layout for Page…`), and **`All Pages`** summary with quick links to `Page Setup…` and `Style…`.
- **Cover & Build Complete pages (`cover`, `complete`)**: `[ Pan | Camera | Page ]`
  - **`Camera`**: Matches the step camera controls — live 3D drag-to-orbit directly over the hero model (using fast interactive `StudioPhotoRenderer.renderToCanvas`), the same 4 neutral isometric **Cube + Camera** angle presets (`45°`, `135°`, `225°`, `315°`), live `az° / el°` readout, **Zoom** (`− / % / +`), and **Reset Camera**, scoped to **`Cover Page`** / **`Build Complete`**. Elevation stays clamped above the studio floor (`4°..60°`) and omits the `Top` / `Bottom` toggle so studio floor shadows remain natural.
  - **`Page`**: Content, logos, toggles, and background image controls (**`This Page`**) cleanly separated from **`All Pages`** quick links (`Page Setup…`, `Style…`).
- **Parts List pages (`bom`)**: `[ Pan | Customize Parts List ]` — the `Page` pill button relabels to **`Customize Parts List`** and directly opens `#bomSetupModal` (tagged **`All Parts List Pages`**) while `Pan` & pinch-zoom remain active on the canvas.
- **Back Cover & Divider pages (`back`, `divider`)**: `[ Pan | Page ]`
- **Section Dividers & Submodel Pages**: Mode pill hidden (`[]`).
- **Cross-page mode continuity**: Switching between Cover/Complete and Step pages smoothly maps `camera ↔ step` via `resolveModeForPage()` so users can keep adjusting cameras without re-selecting a tab, and migrates legacy saved mode IDs (`select`, `rotate`, `edit`, `arrange`).

### 2. Three-Tier Scope Badge System
Whenever a control affects more than the currently focused part, step, or page, the UI communicates its blast radius with a consistent three-tier badge system aligned to `src/index.css` semantic tokens:
- **Local (`local`)** — neutral muted pill with dot: `Selected Parts`, `This Step`, `This Page`, `Cover Page`, `Build Complete`.
- **Multi-Step / Range (`range`)** — warm amber pill (`--warning-soft` / `--warning`) with layers icon: `Affects Other Steps`, `Step Range`, `Affects Prev Step`, `Affects Later Pages`, `Adds / Removes Pages`.
- **Whole-Manual (`manual`)** — sky blue pill (`--info-soft` / `--info`) with grid icon: `All Minifigures`, `All Pages`, `All Step Pages`, `All Parts List Pages`, `All Steps in Theme`.

The same scope badges also appear inside `#stylePopover`, `#pageSetupModal`, `#bomSetupModal`, and `#applyAngleModal`.

### 3. Apply Camera to Steps Modal (`#applyAngleModal`)
Visual range-picker modal tagged **`Step Range`**:
- **Dual-Handle Range Slider** (`#angleRangeMin` / `#angleRangeMax` with highlighted track bar `#angleRangeFill`), styled like a flight/hotel date-range selector, allowing any contiguous range including steps *before* and *after* the current step.
- **Quick Range Presets**: `This Step Onward`, `This Submodel` (submodel steps only), `This Section` (all chapters sharing the section; hidden when identical to the submodel), `All Steps`.
- **Optional Zoom & Framing Copy** (`#applyCameraIncludeFraming`): Defaults to copying camera orientation (`side`, `corner`, `az`, `el`) only, with a one-click checkbox to also propagate the current step's **Zoom (%) & Framing** (`modelScale`, `focusMode`) across the chosen range.
- **Scrollable Step List with 3D Square Thumbnails**: Progressively renders a square 3D preview of each step on the left with step metadata on the right; clicking rows sets Start / End in sync with the dual-handle slider.
- **Absolute Step Ranges**: The range is expressed in absolute step numbers (`step.absNum`, unique across the manual), never printed per-submodel numbers. Rows show `Step N` plus a `#abs` chip, chapter headers separate submodels, and the From/To chips read `Step 1 · #9`. See [`ABSOLUTE_STEP_NUMBERING_DESIGN.md`](./ABSOLUTE_STEP_NUMBERING_DESIGN.md).

### 4. Main Drawer Menu Reorganization
- **Model & Project**: `Import Model or Project…` opens the dismissible Open Model dialog (`#openModelModal`, mirroring the initial welcome sheet with drag-and-drop, Import Model, and Import Project), plus `Export Project (.biw)` and `Model Issues`.
- **Page & Export**: `Page Setup`, `Parts List Setup`, `Export Interactive 3D (.html)`, `Print / Export PDF`.
- **Step Generation** *(placed directly below `Page & Export` and above `Bricks Library`)*: Single neutral-styled **`Step Generation >`** button opening the unified `#importModal` where **Build Organization** is a `<select>` dropdown paired with **Auto-Detect Duplicate Submodels** so subdivision and step regeneration apply together in one step.
- **Bricks Library** & **Page Inserts**.

### 5. Pages & Steps Overview (`#overviewModal`) Live Step & Page Previews
Every entry in the Pages & Steps list includes a theme-backed miniature preview on the left:
- **Step rows**: HiDPI 4:3 3D snapshot (`computeOverviewThumbDimensions(resScale)`) rendered on the page's active theme background (including custom Step Range Group themes), respecting each step's camera angle, model scale, part offsets, highlight/fade settings, minifigure pose indicators, and sequential minifigure sub-step slices. In **Select Range** mode, selected rows overlay a compact `✓` badge on the preview corner so row layout never shifts. Each step row's `Page Break` button includes an integrated `?` help trigger that opens a viewport-aware floating explanation tooltip (`#pageBreakHelpTooltip`) on hover, focus, or click/tap without toggling the break or jumping to the step; when one or more breaks are active, a compact conditional `#overviewPinsBar` shows the count and a `Clear All` action.
- **Non-step pages**: 3D previews for Cover, Build Complete, Section Dividers, and Submodel Pages; a 2×2 sample parts mini-grid for Parts List (`bom`) pages; and themed miniature glyphs for Divider and Back Cover pages.
- **Visibility-first lazy rendering & content-addressed caching**: `IntersectionObserver` rooted on `#overviewList` plus a viewport-prioritized `requestAnimationFrame` batch queue renders currently visible steps first (even when opening directly at a deep page) and cancels immediately on modal close. A bounded LRU cache keyed by O(N) cumulative step signatures, camera, offsets, display flags, slice, and library epoch makes range selection and page-break toggles synchronous and flicker-free without ever showing stale thumbnails.

---

## Pure Capability Modules

[`src/engine/stepToolbar.ts`](../src/engine/stepToolbar.ts) centralizes:
- `getVisibleModeTabs(pageKind)` — canonical scope-based bottom mode pill tabs (`['pan', 'parts', 'step', 'page']` on step pages, `['pan', 'camera', 'page']` on cover/complete, `['pan', 'page']` on back/divider/bom).
- `getEditModeButtonLabel(pageKind)` & `isModalEditPageKind(pageKind)` — relabels the `page` button to `Customize Parts List` on Parts List (`bom`) pages and marks modal-backed edit pages (`bom`).
- `resolveModeForPage(mode, pageKind)` — legacy mode migration and seamless `camera ↔ step` cross-page mapping.
- `CAMERA_ANGLE_PRESETS`, `getCameraAngleLabel()`, `findMatchingCameraPreset()`, & `clampStepModelScale()` — neutral degree labels (`45°`, `135°`, `225°`, `315°`), wrap-safe azimuth matching shared by Cover, Build Complete, and Step cameras, and clamped step zoom.
- `PAPER_FORMAT_SPECS`, `PAPER_FORMAT_ORDER`, & `computePaperPreviewBox()` — expanded paper sizes (`Screen Fit`, `US Letter`, `A4`, `A5`, `B5`, `Half Letter`, `US Legal`, `Tabloid`, `A3`, `Booklet Square`, `Custom`) and exact aspect-ratio preview box geometry.
- `applyCameraAngleToStepRange()` — inclusive absolute step-range camera override helper with optional `modelScale` & `focusMode` propagation.
- `migratePageInsertsToSteps()` — legacy page-bound custom callout migration into step-bound `stepInserts`.
- `resolveStepToolbarCapabilities()`, `clearStepCameraOverride(override, includeZoomAndFraming)`, `clearStepArrangeOverride()`.

[`src/engine/overviewPreviews.ts`](../src/engine/overviewPreviews.ts) centralizes:
- `computeOverviewThumbDimensions()`, `computeStepPreviewPartSignature()`, `computeOverviewStepSignatures()` (O(N) cumulative previous-part signatures matching `getPreviousPartsForStep`), `buildStepPreviewCacheKey()`, `buildPagePreviewCacheKey()`, `resolveOverviewPagePreviewKind()`, and `createOverviewThumbCache()`.

Unit tests live in [`src/engine/__tests__/stepToolbar.test.ts`](../src/engine/__tests__/stepToolbar.test.ts) and [`src/engine/__tests__/overviewPreviews.test.ts`](../src/engine/__tests__/overviewPreviews.test.ts).
