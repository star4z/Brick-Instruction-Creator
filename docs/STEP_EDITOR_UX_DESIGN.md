# Step Editing, Rotate Camera & Menu UX Design

## Architecture & Separation of Concerns

### 1. Bottom Mode Pill (`#modePill`)
Every mode tab owns a single, unambiguous responsibility (the redundant `Arrange` mode was removed):
- **Step pages (`page.kind === 'steps'`)**: `[ Pan | Select | Rotate | Edit ]`
  - **`Pan`**: 1-finger pan & pinch zoom on the live page (hides contextual overlays). On touch / mobile viewports (`(pointer: coarse)` / `< md`), the bottom-right zoom box (`#zoomControlsBar`) is hidden so pinch-to-zoom is the natural primary interaction while desktop mouse users keep the zoom stepper.
  - **`Select`**: 1-finger tap on 3D bricks or Parts Box entries to nudge via visual color-coded 3D axis controls (`Up/Dn`, `L/R`, `Depth`) + visual brick `Tilt` indicator (`−15° / deg / +15°`), toggle arrows, split/merge steps, create submodels, or drag step-specific custom callouts directly inside their step slot.
  - **`Rotate`**: Strictly 3D camera orientation with zero preview shrinkage (the live WebGL canvas matches the static snapshot's exact pixel dimensions and framing options):
    - Bold, prominent **`Drag 3D model to orbit`** cue.
    - Visual **Cube + Simple Camera** SVG icons for **View** (`Top` / `Bottom`) and 4 neutral isometric **Angle** presets (`45°`, `135°`, `225°`, `315°` — avoiding arbitrary "Front/Back" labels while keeping legacy project IDs).
    - **`Apply Angle to Steps…`** button opening the dedicated `#applyAngleModal` step-range dialog.
  - **`Edit`**: Opens the dedicated full-page **`Edit Step & Page`** dialog (`#stepEditModal`) without discarding the user's underlying canvas mode.
- **Parts List pages (`bom`)**: `[ Pan | Customize Parts List ]` — pressing **`Customize Parts List`** directly opens `#bomSetupModal` without showing an intermediate floating chip, while `Pan` & pinch-zoom remain active on the page canvas.
- **Simple edit pages (`cover`, `complete`, `back`, `divider`)**: `[ Pan | Edit ]`

### 2. Apply Camera Angle to Steps Modal (`#applyAngleModal`)
Replaces one-way "Apply Angle to Following" with a visual range-picker modal:
- **Dual-Handle Range Slider** (`#angleRangeMin` / `#angleRangeMax` with highlighted track bar `#angleRangeFill`), styled like a flight/hotel date-range selector, allowing any contiguous range including steps *before* and *after* the current step.
- **Quick Range Presets**: `This Step Onward`, `This Submodel` (submodel steps only), `This Section` (all chapters sharing the section; hidden when identical to the submodel), `All Steps`.
- **Scrollable Step List with 3D Square Thumbnails**: Progressively renders a square 3D preview of each step on the left with step metadata on the right; clicking rows sets Start / End in sync with the dual-handle slider.
- **Absolute Step Ranges**: The range is expressed in absolute step numbers (`step.absNum`, unique across the manual), never printed per-submodel numbers. Rows show `Step N` plus a `#abs` chip, chapter headers separate submodels, and the From/To chips read `Step 1 · #9`. See [`ABSOLUTE_STEP_NUMBERING_DESIGN.md`](./ABSOLUTE_STEP_NUMBERING_DESIGN.md).

### 3. Dedicated Full-Page `Edit Step & Page` Modal (`#stepEditModal`)
1. **Minifigure Instruction Style** *(Scope: `All minifigure steps`)*
2. **Step Display & Framing** *(Scope: `This step`)* — Camera Framing, 3D Model Size, Parts Box Size, and `Rotate in 3D →`.
3. **Subassembly Layout** *(Scope: `This step`)* — Inline Callout Box vs. Separate Full Pages, Side-by-Side vs. Stacked Vertically.
4. **Pagination & Page Break** *(Scope: `This step`)* — Pinned page break toggle button with an integrated `?` help tooltip trigger (hover/click/focus explanation, no inline instruction copy) + `Open Page Setup…`.
5. **Step Notes & Images** *(Scope: `This step`)* — Custom callouts are bound to `step.id` (`state.stepInserts[step.id]`) rather than `page.id`, so they stay attached to their exact step even when pagination changes, render inside the step slot in both live previews and PDF exports, and include inline corner placement (`TL / TR / BL / BR`), scale (`− / % / +`), and `Delete` controls (with automatic backward-compatible migration of legacy `pageInserts`).

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
- `getVisibleModeTabs(pageKind)` — canonical bottom mode pill tab visibility (`['pan', 'select', 'rotate', 'edit']` on step pages).
- `getEditModeButtonLabel(pageKind)` & `isModalEditPageKind(pageKind)` — relabels the `edit` button to `Customize Parts List` on Parts List (`bom`) pages and marks modal-backed edit pages (`steps`, `bom`).
- `CAMERA_ANGLE_PRESETS` & `getCameraAngleLabel()` — neutral degree labels (`45°`, `135°`, `225°`, `315°`) mapped to legacy-compatible IDs.
- `PAPER_FORMAT_SPECS`, `PAPER_FORMAT_ORDER`, & `computePaperPreviewBox()` — expanded paper sizes (`Screen Fit`, `US Letter`, `A4`, `A5`, `B5`, `Half Letter`, `US Legal`, `Tabloid`, `A3`, `Booklet Square`, `Custom`) and exact aspect-ratio preview box geometry.
- `applyCameraAngleToStepRange()` — inclusive step-range camera override helper.
- `migratePageInsertsToSteps()` — legacy page-bound custom callout migration into step-bound `stepInserts`.
- `resolveStepToolbarCapabilities()`, `clearStepCameraOverride()`, `clearStepArrangeOverride()`.

[`src/engine/overviewPreviews.ts`](../src/engine/overviewPreviews.ts) centralizes:
- `computeOverviewThumbDimensions()`, `computeStepPreviewPartSignature()`, `computeOverviewStepSignatures()` (O(N) cumulative previous-part signatures matching `getPreviousPartsForStep`), `buildStepPreviewCacheKey()`, `buildPagePreviewCacheKey()`, `resolveOverviewPagePreviewKind()`, and `createOverviewThumbCache()`.

Unit tests live in [`src/engine/__tests__/stepToolbar.test.ts`](../src/engine/__tests__/stepToolbar.test.ts) and [`src/engine/__tests__/overviewPreviews.test.ts`](../src/engine/__tests__/overviewPreviews.test.ts).
