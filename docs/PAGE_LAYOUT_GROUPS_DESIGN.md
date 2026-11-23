# Customizable Page Layouts & Step Range Groups Design

## Purpose
Give manual creators full control over how steps are arranged on pages—beyond fixed 1/2/4-up grids—while keeping live Studio previews and exported PDFs 100% consistent.

## Data Model
Implemented in [`src/engine/pageLayout.ts`](../src/engine/pageLayout.ts):

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
  - Named, editable rule covering an inclusive 1-based step range (`startStepNum..endStepNum`)
  - Carries its own `PageLayoutSpec`, optional `themeId` style override, and optional `showStepBorders` override
  - Multiple groups can coexist; overlapping ranges resolve with latest-group precedence so narrower overrides can refine broader sections.

## Live & PDF Rendering Parity
- `computePageSlotRects(slotCount, spec, isLandscape, contentW, contentH, gap)` computes deterministic non-overlapping rectangles `{ x, y, w, h, isFeatured, isCompact }[]`.
- `renderAll()` positions step slots inside `#pageFrame` using the exact percentage geometry from `computePageSlotRects`, scaling step numbers, PLI thumbnails, and WebGL snapshot resolutions per slot.
- `renderPageToJpegBytes()` uses the exact same `computePageSlotRects` output for PDF canvas export.
- `getThemeForPage(page)` resolves a group's `themeId` override (if set) for both live display and PDF rendering.

## User Workflows
1. **Page Setup (`#pageSetupModal`)**:
   - Configure manual-wide defaults (steps/page, cols, rows, row/column flow, mixed layout, S/M/L weights).
   - Manage **Step Range Groups** (create, edit, delete, or fill range from current page steps).
2. **Pages & Steps Overview (`#overviewModal`)**:
   - Toggle **Select Range**, tap start and end steps (or page headers), and click **Style / Layout Group…** to open the Group Editor pre-filled with that exact range.
3. **Persistence & Undo**:
   - `layoutConfig` and `layoutGroups` are persisted in IndexedDB session prefs, included in `.bic.json` project exports/imports (backward-compatible with legacy `layout` strings), and captured in Undo/Redo snapshots.
