# Parts List (Bill of Materials) Layout, Sizing & Table Format Design

> **Status**: Implemented in [`src/engine/partsList.ts`](../src/engine/partsList.ts), [`src/themes/customThemes.ts`](../src/themes/customThemes.ts), [`src/studioRuntime.ts`](../src/studioRuntime.ts), [`src/export/interactiveHtmlExporter.ts`](../src/export/interactiveHtmlExporter.ts), and [`index.html`](../index.html). Living document — update as Parts List capabilities evolve.

## Purpose

Give manual creators dense, customizable, print-ready Parts List (BOM) pages across both **Grid** and **Table** formats, with automatic page-filling grid sizing, strict grid-multiple variable part sizing, full 8-direction grid flows, unified draggable field/column selection (including LEGO Part IDs and Color swatches), clear visual indicators for every setting, and theme-level persistence.

---

## 1. Data Model & Theme Storage

`BomConfig` (defined in [`src/engine/partsList.ts`](../src/engine/partsList.ts)) is stored on `ThemeStyleOptions` / `ManualTheme` in [`src/themes/customThemes.ts`](../src/themes/customThemes.ts):

| Field | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `format` | `'grid' \| 'table'` | `'grid'` | Visual tile grid or tabular inventory list |
| `gridMode` | `'auto' \| 'custom'` | `'auto'` | Page- & count-aware automatic sizing vs. explicit `cols × rows` |
| `minCellSizeIn` | `number` (`0.5–2.0`) | `0.5` | Minimum physical cell width & height (in inches, including labels) for Auto mode |
| `customCols` / `customRows` | `number` (`1–24`) | `8` / `6` | Explicit column & row counts when `gridMode === 'custom'` |
| `flowAxis` | `'rows' \| 'columns'` | `'rows'` | Primary grid traversal axis (fill across rows first vs. along columns first) |
| `horizontalDir` | `'ltr' \| 'rtl'` | `'ltr'` | Horizontal progression direction (Left → Right vs. Right → Left) |
| `verticalDir` | `'ttb' \| 'btt'` | `'ttb'` | Vertical progression direction (Top → Bottom vs. Bottom → Top) |
| `align` | `'start' \| 'center' \| 'end'` | `'start'` | Alignment of the partial hanging final row or column relative to flow start |
| `variableSizing` | `boolean` | `false` | Scales larger parts to strict integer grid multiples (`2×1`, `1×2`, `2×2`, `3×1`, `3×2`…) |
| `tableRowsMode` | `'auto' \| 'custom'` | `'auto'` | Balanced automatic row count vs. fixed rows per page (`4–60`) |
| `tableRowsPerPage` | `number` (`4–60`) | `20` | Fixed rows per page when `tableRowsMode === 'custom'` |
| `fields` | `BomFieldConfig[]` | `[image✓, qty✓, name✓, partId✓, color✗]` | Unified ordered list of all 5 fields (`image`, `qty`, `name`, `partId`, `color`) |
| `sortPrimary` / `sortSecondary` | `BomSortTrait` | `'color'` / `'category'` | Supports `color`, `category`, `qty`, `size`, `name`, and `partId` (natural numeric sort) |

### Theme Integration & Legacy Migration
- Editing any Parts List setting calls `patchBomConfig()`, which updates the active theme via `patchActiveTheme({ bomConfig })`.
- Built-in themes stay unchanged and auto-fork into `"<Theme> Custom"` on the first edit; custom themes auto-save to `localStorage` and IndexedDB and round-trip `bomConfig` in `.biwtheme` files.
- `normalizeBomConfig()` migrates legacy configs (`density`, `flow`, `showNames`) cleanly; unmodified legacy defaults map to the new defaults without triggering unnecessary theme forks.
- The **Style** popover (`#stylePopover`) includes a compact **Parts List** section (format switcher, LEGO Part ID toggle, summary badge, and shortcut to **Parts List Setup**), while `#bomSetupModal` displays the owning theme banner.

---

## 2. Automatic Page-Filling Grid Sizing (`computeAutoBomGrid`)

Given the physical printable content box `(contentWidthIn, contentHeightIn)`, unique part list, and `minCellSizeIn` (default `0.5 in` including labels):

1. **Minimum Page Count**: Compute maximum density `maxCols = floor(contentWidthIn / minCellSizeIn)` and `maxRows = floor(contentHeightIn / minCellSizeIn)` (clamped to `1..30`). Pack the items at `(maxCols, maxRows)` to determine `targetPages`, the fewest pages achievable without shrinking any `1×1` cell below `minCellSizeIn`.
2. **Space-Filling Expansion**: Search all candidate `(cols, rows)` with `cols <= maxCols, rows <= maxRows` that still fit all items within `targetPages` pages, scoring each candidate by usable cell size normalized to the ideal aspect ratio for the active field count (`computeIdealBomCellAspect`) with gentle aspect-distortion penalty and fill-ratio tie-breaking.
   - Example on US Letter Landscape (`10.22" × 7.08"` content area, `0.5"` minimum):
     - `18` parts → `1` page at `~5×4` (`~2.0" × 1.8"` cells)
     - `240` parts → `1` page at `~19×13` (`~0.54" × 0.55"` cells)
     - `300` parts → exceeds `20×14 = 280` on 1 page, so spills to `2` pages and automatically expands to `~15×10` (`~0.68" × 0.71"` cells) so both pages fill cleanly with larger parts!

---

## 3. Strict Grid-Multiple Variable Part Sizing

When `variableSizing === true`:

1. **Physical Isometric Projection (`projectPartDimensionsLdu`)**: Each unique part's true local LDU bounding box `[dx, dy, dz]` (from compiled `.dat` geometry, composite assemblies, or catalog metadata) is analytically projected onto the standard PLI isometric camera (`az = 32°`, `el = 22°`) to obtain `(projW, projH)`.
2. **Strict Integer Multiples (`computePartGridSpans`)**: Relative to a physical baseline anchored to standard LEGO brick proportions (gently adapted to the model median), each part receives strict integer grid spans `(colSpan, rowSpan)` ∈ `{1..4} × {1..4}` (clamped to the grid):
   - Small bricks/plates (`1×1`–`2×4`) → `1×1`
   - Long beams/plates (`1×8`, `1×12`, `4×8`) → `2×1` or `3×1`
   - Tall frames/windows/vertical bars → `1×2`
   - Large broad plates & baseplates (`6×12`, `16×16`) → `2×2`, `3×2`, etc.
3. **Aspect-Matched 3D Thumbnails (`getBomPartThumb`)**: Multi-span cells render tight-fit WebGL snapshots matching their `colSpan : rowSpan` aspect ratio so long or tall parts fill their expanded cell crisply.
4. **2D Occupancy Packing (`packBomGridPages`)**: Items pack sequentially across pages using first-fit occupancy placement in canonical logical `(primary, secondary)` space, then apply hanging alignment on the final track and transform cleanly into physical `(col, row)` coordinates across all 8 combinations of `flowAxis × horizontalDir × verticalDir`.

---

## 4. Unified Columns & Item Fields (Grid + Table)

A single draggable list of 5 fields (`Image Preview`, `Quantity`, `Part Name`, `LEGO Part ID`, `Color`) controls both formats:

- **Table Format**: Defines left-to-right column order and visibility (`computeBomTableColumns` assigns compact widths to `image`/`qty`, balanced widths to `partId`/`color`, and flexible width to `name`). Supports `Auto` (balanced rows across fewest comfortable pages) or `Custom` (`4–60` rows per page).
- **Grid Format**: Defines exact visual item order inside each cell (`computeBomCellTypography` scales fonts smoothly from micro-dense `0.5"` cells up to spacious cells while protecting thumbnail area). Wide cells (`aspect >= 1.85`, such as `2×1` or `3×1` parts) automatically switch to a side-by-side horizontal layout when `image` is first or last, preserving the exact field order.
- **Reordering**: Supports desktop HTML5 drag-and-drop, touch/pen pointer drag on the grip handle, and accessible `↑` / `↓` buttons. At least one field always remains enabled.

---

## 5. Visual Indicators & Live Parity

- Every option button in `#bomSetupModal` includes a miniature SVG diagram (Format, Grid Sizing, Min Cell Size presets, Uniform vs. Variable Multiples, Rows/Columns, Left→Right / Right→Left, Top→Bottom / Bottom→Top, and dynamic Hanging Alignment diagrams that mirror the active flow direction).
- A **Live Layout Preview** renders both a themed miniature page (in exact paper proportions, numbered cells showing flow start & direction, hanging alignment, multi-span blocks, or table columns) and a **Sample Part Format** preview updating live as fields are toggled or dragged.
- **100% Export Parity**: Live Studio DOM (`renderAll`), High-DPI PDF Canvas (`renderPageToJpegBytes`), and Interactive 3D HTML Export (`interactiveHtmlExporter.ts`, including static `#noJsFallback`) all consume the same `partsList.ts` plans and field order.
