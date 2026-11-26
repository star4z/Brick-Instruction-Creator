# Official Manual Craft & Reference Learnings — Design Specification

> **Status**: Implemented across core engine modules (`src/engine/lengthBadges.ts`, `src/engine/calloutCraft.ts`, `src/engine/buildRoadmap.ts`, `src/engine/placementArrows.ts`, `src/engine/stepCamera.ts`, `src/engine/partsList.ts`), theme presets (`src/themes/customThemes.ts`), rendering (`src/renderer/brickGeometry.ts`, `src/studioRuntime.ts`), and export pipelines (`src/export/pdfBinary.ts`, `src/export/interactiveHtmlExporter.ts`). Living document.

## 1. Motivation & Reference Study

To elevate **Brick Instruction Works** to official publication-caliber quality across both compact family builds and massive collector builds, we analyzed two official LEGO instruction manuals spanning different scales and eras:

- **LEGO Creator 3-in-1 Record Player with Flowers (#31172, 2025)** — 366 pieces, 108 pages, 100 steps (modern 2025 visual language: bottom progress bar, inline cream callout boxes, forked orthogonal leaders, 1:1 coaxial gear-on-axle position callouts, ghost submodel previews, attachment starbursts, play-feature demo pages, and relative-scale column BOM).
- **LEGO Star Wars UCS Millennium Falcon (#75192)** — 7,541 pieces, 468 pages, 1,379 steps (large-scale collector/technical craft: neutral light-gray print-friendly canvas, Build Roadmap spread, inline bag opener cards with loose oversized parts, contrast-adaptive green arrows on red bricks, squared `[N]` liftarm vs. circled `(N)` axle badges, zero-part hinge-folding steps, regional cropped close-up views, chiral mirrored callout pairing, and 10-column variable-width BOM).

Every mechanism below is implemented using **pure physical, geometric, and perceptual principles** with zero model-specific heuristics.

---

## 2. Architecture & Modules

### 2.1 Contrast-Adaptive Placement Arrows & Through-Hole Guides ([`src/engine/placementArrows.ts`](../src/engine/placementArrows.ts))
- **`resolveContrastArrowColor(baseArrowHex, targetRgb, neighborRgbs?)`**: Evaluates redmean perceptual RGB distance between the active arrow color (default crimson `#dc2626`) and the moved brick / touching neighbor colors. When distance `< 115` (e.g., red arrow on red or orange brick), automatically switches to high-contrast green (`#16a34a`), or blue (`#2563eb`) if the user's base arrow color is already green.
- **Through-Hole Alignment Guide Segments**: `computePlacementArrowSegments` accepts an optional `throughGuideTo` endpoint and emits thin `isGuideLine: true` pass-through guide segments rendered in WebGL (`src/studioRuntime.ts`) and Interactive 3D HTML (`src/export/interactiveHtmlExporter.ts`).

### 2.2 Luminance-Aware Light Edge Lines on Dark Parts ([`src/renderer/brickGeometry.ts`](../src/renderer/brickGeometry.ts), [`src/studioRuntime.ts`](../src/studioRuntime.ts))
- Computes perceived luminance (`0.299R + 0.587G + 0.114B`) for every part color (standard LDraw palette and direct RGB colors).
- Dark parts (`baseLuma < 52` in standard mode, `< 56` in stark-outline mode) automatically receive crisp light-gray/silver edge lines (`#cbd5e1` / `[204, 212, 222]`) so black and dark-tone bricks remain cleanly readable in Steps, PLI, and BOM renders.

### 2.3 Shape-Specific Length Badges, True-Scale 1:1 Silhouettes & Coaxial Position Callouts ([`src/engine/lengthBadges.ts`](../src/engine/lengthBadges.ts))
- **`classifyPartLengthBadge`**: Distinguishes **circled `(N)`** badges for axles and bars (including fractional lengths like `3.2`) from **squared `[N]`** badges for Technic liftarms, beams, and perforated Technic bricks/plates.
- **True-Scale Orthographic Silhouettes** (`build1to1SilhouetteSvg` / `draw1to1SilhouetteCanvas`): Renders fluted cross-axles, rounded cylindrical bars, and exact `N`-hole liftarms/beams rather than generic bars.
- **1:1 Coaxial Assembly-Position Callouts** (`detectCoaxialPositionCallout`, `buildCoaxialPositionCalloutSvg`, `drawCoaxialPositionCalloutCanvas`): Detects when a step mounts a gear, bush, or collar partway along an axle or bar (not flush at either end) and generates a cream `1:1` positional depth callout.

### 2.4 Callout Routing, Chiral Pairing, Starbursts & Articulation ([`src/engine/calloutCraft.ts`](../src/engine/calloutCraft.ts))
- **`routeOrthogonalLeaders`**: Routes clean L-shaped (single target) and shared-trunk multi-forked orthogonal leader lines (2+ targets) with crisp arrowheads in both SVG and Canvas 2D.
- **`detectMirroredSubassemblyPairs`**: Uses centered quantized 3D reflection signatures across X/Z mirror planes (while rejecting rigid Y-rotational duplicates) to pair chiral left/right subassemblies.
- **Ghost Submodel Preview (`shouldShowGhostSubmodelPreview`)**, **Attachment Starburst (`buildAttachmentStarburstSvg` / `drawAttachmentStarburstCanvas`)**, and **Curved Yellow Articulation Arrows (`buildCurvedMotionArrowSvg`, `drawCurvedMotionArrowCanvas`, `detectNonOrthogonalArticulationAngle`)**.

### 2.5 Build Roadmap, Inline Bag Openers & Bottom-Edge Progress Bar ([`src/engine/buildRoadmap.ts`](../src/engine/buildRoadmap.ts))
- **`computeBuildRoadmapPages`**: Paginates multi-stage builds into 2-column × 3-row cumulative stage progression pages (up to 6 stages per page).
- **`classifyLooseUnbaggedParts`**: Identifies oversized unbagged parts (`maxDimLdu >= 240`) for inline bag opener callouts.
- **Bottom-Edge Build Progress Bar** (`computeAbsoluteStepProgressFraction`, `buildProgressBarHtml`, `drawProgressBarCanvas`): Tracks step progress `0..1` continuously across the model's absolute steps (`1..N` across all chapters, submodels, minifigures, and bags) without finishing early or restarting when printed step labels reset; renders in Live DOM and PDF Canvas, controlled via `ThemeStyleOptions.showProgressBar` (`#toggleProgressBar`).

### 2.6 Technical Gray Theme Preset ([`src/themes/customThemes.ts`](../src/themes/customThemes.ts))
- Adds built-in theme `gray` (**Technical Gray**): neutral print-friendly `#e3e4e5` canvas, sky-blue PLI boxes (`#cbe2f6`, `#1e293b` border), warm cream callout boxes (`#fff5cc`), and dark charcoal typography.

### 2.7 Regional Cropped Close-Up Framing ([`src/engine/stepCamera.ts`](../src/engine/stepCamera.ts))
- Adds `'regional'` framing mode to `computeStepCameraFraming`, focusing tightly on the active build region with surrounding context and emitting normalized `locator` coordinates (`{ cxNorm, czNorm, radiusNorm }`) for miniature locator insets on large models.

### 2.8 Relative-Scale & Variable-Width Masonry BOM ([`src/engine/partsList.ts`](../src/engine/partsList.ts))
- **`computeRelativeBomScales`**: Derives consistent sub-linear physical thumbnail scale factors across a Parts List so small studs/pins scale naturally relative to long beams and large plates.
- **`packVariableWidthBomColumns`**: Packs color-grouped items into variable-width vertical masonry columns matched to each column's widest part.

### 2.9 Searchable PDF Part Metadata & Interactive HTML Part Finder ([`src/export/pdfBinary.ts`](../src/export/pdfBinary.ts), [`src/export/interactiveHtmlExporter.ts`](../src/export/interactiveHtmlExporter.ts))
- **PDF Export**: `buildPdfBinary` embeds invisible `3 Tr` Helvetica text streams (`searchableText`) containing each page's step numbers and LDraw part IDs, enabling native `Ctrl+F` part lookup in any PDF viewer with zero visual clutter.
- **Interactive 3D HTML Export**: Adds a live **Find Part** filter (`#bomFindInput`) and direct `→ Step N` jump buttons on the Parts List page, plus per-segment contrast-adaptive WebGL placement arrow colors.

### 2.10 Pass 2 End-to-End Wiring & New Craft Features
- **Live DOM & PDF Parity**: Wired orthogonal/forked inline callout leader overlays, automatic `1:1` coaxial assembly-position callouts, attachment starbursts, hinge articulation curved yellow arrows, regional close-up framing (`Regional Crop` in `FOCUS_MODE_OPTIONS`) with miniature full-model locator inset, loose-part bag opener callouts, and `1:1` orthographic silhouettes + circled/squared length badges in both Live DOM and PDF export (plus BOM length badges).
- **Relative-Scale Step PLI & Confusable Dark-Color Differentiation**: Scales step PLI thumbnails proportionally to each part's physical LDU span and automatically displays high-contrast color-code swatch pills (`detectConfusablePliColors`) whenever a step's PLI contains perceptually close dark colors (redmean distance `< 38`).
- **LEGO-Style Step Divider Lines (`stepBorderStyle: 'lines' | 'boxes' | 'none'`)**: Default `'lines'` across all themes with column-first ordering and orientation-based guillotine line priority (`computePageDividerLines()`), exposed via synchronized `Lines` / `Boxes` / `None` controls in both Style and Page Setup across Live DOM, Page Setup previews, and PDF export (see [`PAGE_LAYOUT_GROUPS_DESIGN.md`](./PAGE_LAYOUT_GROUPS_DESIGN.md)).
- **Inline Horizontal Numbered Sub-Step Strips & Radial Symmetry Compression** ([`src/engine/substepStrips.ts`](../src/engine/substepStrips.ts)): Pure planners for consolidated-PLI horizontal `1 2 3 4` strips and radial symmetric ring completion.
- **General Vertical Exploded-Stack Columns & Precision Dual Alignment Lines**: `detectVerticalStackColumn` for 2–4 layer vertical sub-stacks and `computePrecisionAlignmentLines` for razor-thin dual projection lines on compact lateral multi-contact brackets (wired in WebGL).
- **Calm 2025 Celebration Finale**: Soft radial starburst + 5 hollow outline stars behind the full completed 3D model hero (which already includes all placed minifigures in 3D) on Build Complete across Live DOM, PDF, and Interactive HTML exports.


### 2.11 Pass 3 Full Pipeline Parity (Live DOM ↔ PDF ↔ Interactive 3D HTML)
- **PDF Export Parity**: PDF export (`renderPageToJpegBytes`) draws attachment starbursts (`drawAttachmentStarburstCanvas`), orthogonal/forked inline callout leaders (`drawOrthogonalLeadersCanvas`), `1:1` coaxial assembly-position callouts (`drawCoaxialPositionCalloutCanvas`), hinge articulation curved yellow arrows (`drawCurvedMotionArrowCanvas`), confusable dark-color PLI swatch dots (`detectConfusablePliColors`), and BOM circled/squared length badges + physical relative part scaling.
- **Interactive 3D HTML Parity**: Added a live bottom-edge build progress bar (`#viewerProgressBar`) tracking viewer progress and circled/squared length badges on step PLI chips.
- **Parts List Setup Controls**: Exposed **Relative Part Scale** (`#bomRelativeScale`) and **Length Badges (N) / [N]** (`#bomShowLengthBadges`) in `#bomSetupModal`, persisted on `BomConfig` and verified in desktop + mobile Playwright UI audits.
