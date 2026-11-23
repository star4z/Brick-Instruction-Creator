# Customizable Page Layouts & Step Range Groups Design

## Purpose
Give manual creators full control over paper size, orientation, margins, and how steps are arranged on pages—beyond fixed 1/2/4-up grids—with live visual guides for every option while keeping live Studio previews and exported PDFs 100% consistent.

## Data Model
Implemented in [`src/engine/pageLayout.ts`](../src/engine/pageLayout.ts) and [`src/engine/stepToolbar.ts`](../src/engine/stepToolbar.ts):

- **Expanded Paper Formats (`PAPER_FORMAT_SPECS`)**:
  - `screen` (Screen Fit), `letter` (US Letter), `a4` (A4), `a5` (A5 Booklet), `b5` (B5 Booklet), `half_letter` (Half Letter), `legal` (US Legal), `tabloid` (Tabloid / Ledger), `a3` (A3 Poster), `square` (Booklet Square), and `custom` (Custom Size in `in` or `cm`).
  - `computePaperPreviewBox()` computes exact scaled miniature sheet proportions in the active orientation for the live preview box beside the Page Format dropdown.
- **`PageLayoutSpec`**:
  - `mode`: `'auto' | 'custom'`
  - `stepsPerPage`: arbitrary integer `1..24` (presets `Auto`, `1`, `2`, `3`, `4`, `6`, plus numeric input)
  - `cols`: `'auto' | 1..6`
  - `rows`: `'auto' | 1..6`
  - `flow`: `'row'` (Left → Right, then Top → Bottom, e.g. `12 13 / 14 15`) or `'column'` (Top → Bottom, then Left → Right, e.g. `12 14 / 13 15`)
  - `mixedLayout`:
    - `'even'`: Uniform `cols × rows` grid
    - `'hero_left'`: First step featured large on the left (~56–62% width); remaining steps stacked smaller on the right
    - `'hero_top'`: First step featured full-width along the top; remaining steps arranged smaller along the bottom
    - `'hero_right'`: Companion steps stacked smaller on the left; final step featured large on the right
    - `'custom_weights'`: Per-slot `S / M / L` relative sizing (`slotSizes: ('sm' | 'md' | 'lg')[]`)
- **`StepLayoutGroup`**:
  - Named, editable rule covering an inclusive 1-based **absolute** step range (`startStepNum..endStepNum`, `stepBasis: 'absolute'`; see [`ABSOLUTE_STEP_NUMBERING_DESIGN.md`](./ABSOLUTE_STEP_NUMBERING_DESIGN.md))
  - Carries its own `PageLayoutSpec`, optional `themeId` style override, and optional `showStepBorders` override
  - Multiple groups can coexist; overlapping ranges resolve with latest-group precedence so narrower overrides can refine broader sections.

## Live & PDF Rendering Parity
- `computePageSlotRects(slotCount, spec, isLandscape, contentW, contentH, gap)` computes deterministic non-overlapping rectangles `{ x, y, w, h, isFeatured, isCompact }[]`.
- `renderAll()` positions step slots inside `#pageFrame` using the exact percentage geometry from `computePageSlotRects`, scaling step numbers, PLI thumbnails, and WebGL snapshot resolutions per slot.
- `renderPageToJpegBytes()` uses the exact same `computePageSlotRects` output for PDF canvas export.
- `getThemeForPage(page)` resolves a group's `themeId` override (if set) for both live display and PDF rendering.

## Visual Guides in Page Setup (`#pageSetupModal`)
1. **Page Format Dropdown + Live Proportion Box**: `<select id="paperFormatSelect">` on the left paired with `#paperFormatPreview` on the right showing the exact paper aspect ratio in the active orientation.
2. **Orientation**: Separate horizontal (`Landscape`) and vertical (`Portrait`) rectangle icons.
3. **Default Steps per Page & Grid**: Live `#layoutGridPreview` rendered directly from `computePageSlotRects()` in the current page's aspect ratio, margins, and borders, plus inline mini-diagram icons on Step Order Direction (`Rows` / `Columns`), Mixed Layouts, Page Density & Margins, and Page Number Format.
4. **Step Range Groups**: Create, edit, and delete per-range layout/theme rules with a live `#grpGridPreview` inside the inline editor (`populateGroupThemeOptions()` iterates `Object.values(BUILT_IN_THEMES)`).
5. **Persistence & Undo**: `layoutConfig` and `layoutGroups` are persisted in IndexedDB session prefs, included in `.biw` project exports/imports, and captured in Undo/Redo snapshots.
