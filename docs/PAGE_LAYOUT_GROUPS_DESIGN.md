# Customizable Page Layouts & Step Range Groups Design

## Purpose
Give manual creators full control over paper size, orientation, margins, and how steps are arranged on pages—beyond fixed 1/2/4-up grids—with live visual guides for every option while keeping live Studio previews and exported PDFs 100% consistent.

## Data Model
Implemented in [`src/engine/pageLayout.ts`](../src/engine/pageLayout.ts) and [`src/engine/stepToolbar.ts`](../src/engine/stepToolbar.ts):

- **Expanded Paper Formats (`PAPER_FORMAT_SPECS`)**:
  - `screen` (Screen Fit), `letter` (US Letter), `a4` (A4), `a5` (A5 Booklet), `b5` (B5 Booklet), `half_letter` (Half Letter), `legal` (US Legal), `tabloid` (Tabloid / Ledger), `a3` (A3 Poster), `square` (Booklet Square), and `custom` (Custom Size in `in` or `cm`).
  - `computePaperPreviewBox()` computes exact scaled miniature sheet proportions in the active orientation for the live preview box beside the Page Format dropdown.
- **`PageLayoutSpec`**:
  - `mode`: `'auto' | 'custom'` — **derived**, never user-set
  - `stepsPerPage`: **derived, read-only** — there is no "Steps per Page" control. `deriveStepsPerPageFromLayout()` computes it from explicit grid tracks:
    - explicit `cols × rows` → `cols * rows`
    - only `cols` (or only `rows`) set → a single row (or column) of that many steps
    - `cols: 'auto'` and `rows: 'auto'` → `null` = **physical Smart Auto Grid** for **all Step Proportions** (`even`, `hero_left`, `hero_top`, `hero_right`, `custom_weights`), with no hardcoded item limits
    - The result is an upper bound: **page breaks** (step `pin` overrides), group boundaries, sequential minifig builds, and full-page submodel callouts still start a new page.
    - `normalizePageLayoutSpec()` ignores saved `stepsPerPage` values from older projects; legacy `'1-up'` / `'4-up'` map to `1×1` / `2×2` grids, other legacy counts fall back to Auto. `withDerivedStepsPerPage()` re-syncs the derived fields after edits.
  - `cols`: `'auto' | 1..6`
  - `rows`: `'auto' | 1..6`
  - `flow`: `'row'` (Left → Right, then Top → Bottom, e.g. `12 13 / 14 15`) or `'column'` (Top → Bottom, then Left → Right, e.g. `12 14 / 13 15`)
  - `mixedLayout` (**Step Proportions**):
    - `'even'`: Uniform `cols × rows` grid
    - `'hero_left'`: First step featured large on the left (~56–62% width); remaining steps packed dynamically on the right
    - `'hero_top'`: First step featured full-width along the top; remaining steps packed dynamically along the bottom
    - `'hero_right'`: Companion steps packed dynamically on the left; final step featured large on the right
    - `'custom_weights'`: Per-slot `S / M / L` relative sizing (`slotSizes: ('sm' | 'md' | 'lg')[]`) packed dynamically by physical min sizes
- **`StepLayoutGroup`**:
  - Named, editable rule covering an inclusive 1-based **absolute** step range (`startStepNum..endStepNum`, `stepBasis: 'absolute'`; see [`ABSOLUTE_STEP_NUMBERING_DESIGN.md`](./ABSOLUTE_STEP_NUMBERING_DESIGN.md))
  - Carries its own `PageLayoutSpec`, optional `themeId` style override, and optional `showStepBorders` override
  - Multiple groups can coexist; overlapping ranges resolve with latest-group precedence so narrower overrides can refine broader sections.

## Physical Smart Auto Grid & Page-Size Readability Warnings
When Columns & Rows are left on Auto (`cols: 'auto'`, `rows: 'auto'`), `packSmartAutoPage()` in [`src/engine/pageLayout.ts`](../src/engine/pageLayout.ts) computes steps per page directly from physical page geometry, the active Step Proportions (`even`, `hero_*`, `custom_weights`), and each step's rendered piece scale—with **no artificial item limits**:

1. **Physical Page Context (`buildSmartAutoPageContext`)**:
   - Uses exact physical sheet dimensions (`widthIn × heightIn`) and print-calibrated margins, grid gaps, footer height, optional submodel intro banner, and slot padding from `computePageTypography()` for the active density (`compact` / `balanced` / `spacious`).
2. **Dual Readability Constraints (`evaluateStepInSlot`)**:
   - **Minimum Step Area**: Every step's usable 3D visual box must be at least **`1.0″ × 1.0″`** (`SMART_AUTO_MIN_STEP_AREA_WIDTH_IN` × `SMART_AUTO_MIN_STEP_AREA_HEIGHT_IN`) **plus** slot margins, step number & PLI header height (accounting for multi-SKU PLI wrapping), optional inline subassembly callout box, optional 1:1 minifigure reference card, and pose legend strip.
   - **Minimum Piece Size (`1 stud ≥ 0.5 cm`)**: Computes each step's union AABB & framing radius via `computeBoundingSphereFromBoxLists()` + `computeStepCameraFraming()`, projects the 3D AABB onto the active step camera's `(right, up)` plane via `computeProjectedOrthoHalfExtents()` (`projHalfWLdu`, `projHalfHLdu`, bounded by `viewRadiusLdu`), and checks the exact aspect-fitted orthographic rendered size of 1 LEGO stud (`20 LDU`) under `computeStepOrthoFrustum` / `WebGLBrickEngine.computeMVP`'s `1.12` framing margin:
     $$\text{studSizeCm} = 20 \times 2.54 \times \max(0.4, \text{modelScale}) \times \min\!\left(\frac{\text{modelAreaWIn}}{2 \times 1.12 \times \text{projHalfW}}, \frac{\text{modelAreaHIn}}{2 \times 1.12 \times \text{projHalfH}}\right) \ge 0.5\text{ cm}$$
3. **Greedy Packing & Optimal Grid Selection (`findBestSmartAutoGridForSteps` + `packSmartAutoPage`)**:
   - Packs as many consecutive eligible steps onto each page as simultaneously satisfy both constraints (respecting page breaks, group boundaries, sequential minifig pages, full-page submodel callouts, and keeping minifigure Pose + Place pairs together).
   - Evaluates all tight `(cols, rows)` grids physically supported by the page dimensions (with **no hardcoded track or step-count cap**) and picks the grid that maximizes rendered piece scale with balanced cell aspect ratios and minimal unused corners. Stores `page.autoGrid` on every smart-auto page so live DOM previews and PDF exports share identical grids.
4. **Larger Page Size Warnings (`analyzePageSizeFit` + `formatPageSizeWarningForPage`)**:
   - Applies only to **physical print paper formats** (`letter`, `a4`, `a5`, `b5`, `half_letter`, `legal`, `tabloid`, `a3`, `square`, `custom`). Default **`Screen Fit` (`screen`)** has no fixed physical sheet size and supports interactive zoom, so it never triggers a physical print-size warning while still using Smart Auto Grid packing.
   - Evaluates every step at `1×1` (full-page 1-up allocation). Whenever a step cannot satisfy the minimum `1″ × 1″ (+ margins)` step area or `1 stud ≥ 0.5 cm` even at 1 step per page, checks first whether rotating the current standard sheet (e.g. Portrait ↔ Landscape) satisfies every step, then computes the smallest larger standard paper format(s) (or aspect-appropriate minimum Custom sheet dimensions when larger than A3/Tabloid) that satisfy every step.
   - Surfaces unobtrusively through the app's **regular warning & diagnostics pipeline** (never as a floating canvas overlay):
     - **Model Issues (`state.diagnostics`)**: Emits a `category: 'layout'`, `severity: 'warning'` entry synchronized on every pagination pass (`syncLayoutDiagnostic()`), surfaced via the amber warning badge on `#btnOpenMenu` / `Model Issues` drawer row and the `Page Layout` filter tab inside `#errorsModal` with quick actions (`Use <Suggested Size>`, `Page Setup`, and `Step N →` jump).
     - **Page Setup modal** (`#pageSizeFitWarning`) & **Menu drawer dot** (`#menuPageSetupWarnDot`): Contextual inline warning right below Paper Size / Orientation with one-click switching.
     - **Page Mode contextual card** (`Page` mode): Cleanly stacked inline notice when viewing Page layout tools.

## Live & PDF Rendering Parity
- `computePageSlotRects(slotCount, spec, isLandscape, contentW, contentH, gap, resolvedGridOverride)` computes deterministic non-overlapping rectangles `{ x, y, w, h, isFeatured, isCompact }[]`, honoring `page.autoGrid` when Smart Auto Grid is active.
- `renderAll()` positions step slots inside `#pageFrame` using the exact percentage geometry from `computePageSlotRects`, scaling step numbers, PLI thumbnails, and WebGL snapshot resolutions per slot.
- `renderPageToJpegBytes()` uses the exact same `computePageSlotRects` output (including `page.autoGrid`) for PDF canvas export.
- `getThemeForPage(page)` resolves a group's `themeId` override (if set) for both live display and PDF rendering.

## Visual Guides in Page Setup (`#pageSetupModal`)
1. **Page Format Dropdown + Live Proportion Box**: `<select id="paperFormatSelect">` on the left paired with `#paperFormatPreview` on the right showing the exact paper aspect ratio in the active orientation.
2. **Orientation**: Separate horizontal (`Landscape`) and vertical (`Portrait`) rectangle icons, followed by the live `#pageSizeFitWarning` notice whenever the current page size is too small for any step.
3. **Default Page Grid**: Live `#layoutGridPreview` rendered directly from `computePageSlotRects()` using `computeSmartAutoPreviewGrid()` for the active page dimensions, orientation, and margins—seeded with the loaded model's representative physical step metric via `computeRepresentativeStepMetric()` (falling back to compact placeholder steps only when no model is loaded), dynamically updating columns and rows as page size changes with **no max-step number or 24-cell cap** (`Smart Auto Grid · Dynamic by Page Size`)—plus Columns / Rows selects and inline mini-diagram icons on Step Order Direction (`Rows` / `Columns`), Mixed Layouts, Page Density & Margins, and Page Number Format. When any step exceeds the active paper sheet even at `1 step/page`, both the warning banner and the Smart Auto Grid caption explicitly note that oversized steps are already placed `1 step/page` and require a larger paper format (or Screen Fit) to maintain `1 stud ≥ 0.5 cm`.
4. **Step Range Groups**: Create, edit, and delete per-range layout/theme rules with a live `#grpGridPreview` inside the inline editor (`populateGroupThemeOptions()` iterates `Object.values(BUILT_IN_THEMES)`).
5. **Included Pages** ([`src/engine/extraPages.ts`](../src/engine/extraPages.ts)): Independent toggles for **Cover** (`showCover`), **Build Complete** (`showBuildComplete`), **Parts List** (`showPartsList`), and **Back Cover** (`showBackCover`), replacing the legacy single `showExtras` switch (with automatic migration on restore/import). When enabled, each row displays a **Settings** link that jumps straight to that page's own settings (`page` mode overlay for Cover, Build Complete, and Back Cover; `#bomSetupModal` on the Parts List page for Parts List). When a page is disabled, its settings cannot be opened from anywhere (`canOpenExtraPageSettings()` hides and disables Page Setup's **Settings** button, hides **Parts List Setup** in the Menu drawer and Style popover, blocks the `openBomSetup` shortcut, and guards `openBomSetupModal()` / `openExtraPageSettings()`). Per-page text and fireworks controls live solely on their respective page settings rather than duplicated inside Page Setup.
6. **Persistence & Undo**: `layoutConfig`, `layoutGroups`, and the four included-page flags are persisted in IndexedDB session prefs, included in `.biw` project exports/imports, and captured in Undo/Redo snapshots.
