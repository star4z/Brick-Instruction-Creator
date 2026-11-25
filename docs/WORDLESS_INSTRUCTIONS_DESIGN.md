# Wordless Instructions (LEGO-Style) — Design Specification

## 1. Motivation & Design Principles

Official LEGO building manuals communicate every instruction visually — using step numbers, part silhouettes, multipliers (`2×`), 1:1 measurement badges, directional arrows, and numbered bags — so that builders of any language can follow a manual with zero translation.

**Wordless Instructions** brings this universal visual language to **Brick Instruction Works** across all three output pipelines (**Live DOM Preview**, **PDF / System Print Canvas**, and **Interactive 3D HTML Export**), while keeping every surface configurable when a builder wants titles, captions, or part names.

### Key Product Decisions
1. **Default on Every Fresh Import**: Every newly imported `.io` / `.ldr` / `.mpd` model starts in **Wordless (LEGO-Style)** mode (`DEFAULT_WORDLESS_MODE = true`), hiding language-dependent titles, captions, rotation words, step hint phrases, and Parts List text labels by default.
2. **Import-Time Choice**: Inside the **Import & Step Generation** modal (`#importModal`) — shown when a model has existing steps, submodels, or qualifies for subdivision — builders can choose between **Wordless (LEGO-Style)** (default) and **With Text Labels** before generating the manual. Compact single-build models that skip the modal apply the wordless default automatically, and builders can toggle the mode anytime afterward.
3. **Configurable Everywhere**: Toggling **Wordless Instructions (LEGO-Style)** in **Page Setup** (or via **Menu → Step Generation**) switches all configurable surfaces cleanly at once, while individual per-surface toggles remain independently configurable afterward:
   - Front Cover Title & Subtitle (`coverMeta.showText`) — also toggleable directly from the Front Cover Edit overlay (`Title Text`), while keeping the non-editable `Brick Instruction Works` attribution card + QR code intact per [`COVER_PAGE_DESIGN.md`](./COVER_PAGE_DESIGN.md).
   - Build Complete Text (`completeMeta.showText`).
   - Parts List Part Names & Color Names (`state.bomShowTextFields`) — also re-enableable with one click inside Parts List Setup (`#bomSetupModal`).
4. **No Accidental Theme Forking**: Both `wordlessMode` and `bomShowTextFields` are **manual-level** properties on `state` rather than theme properties on `ThemeStyleOptions`. Enabling or toggling Wordless mode never silently forks built-in themes into `"<Name> Custom"`, and switching themes preserves Wordless mode and Parts List text visibility cleanly via `resolveEffectiveBomConfig()`.
5. **100% Backward Compatibility**: Existing saved `.biw` project files and older IndexedDB sessions that predate `wordlessMode` default to `wordlessMode: false`, `bomShowTextFields: true`, and `coverMeta.showText: true` so previously saved labeled manuals reopen identically.

---

## 2. Visual Iconography Matrix (Labeled vs. Wordless)

All shared formatting rules, SVG builders, and Canvas 2D vector drawing primitives live in [`src/engine/wordlessMode.ts`](../src/engine/wordlessMode.ts) so Live Preview, PDF Export, and Interactive 3D HTML stay visually consistent.

| Manual Surface / Element | With Text Labels (`wordlessMode: false`) | Wordless (`wordlessMode: true`) |
| --- | --- | --- |
| **Front Cover** | Creator Logo, Model Title, Subtitle, Series Logo, Hero 3D Render, locked `Brick Instruction Works` Attribution + QR | Creator Logo (optional), Series Logo (optional), Expanded Page-Filling Hero 3D Render (reclaiming top title area), locked `Brick Instruction Works` Attribution + QR. Model Title & Subtitle configurable via `coverMeta.showText`. |
| **Build Complete Page** | `"Build Complete!"`, Subtitle, Fireworks, Hero 3D Render | Fireworks + Hero 3D Render only. Configurable via `completeMeta.showText`. |
| **Back Cover** | Centered Brand Logo Card + locked `"Made with Brick Instruction Works"` credit | Unchanged — keeps the locked `Brick Instruction Works` attribution per [`COVER_PAGE_DESIGN.md`](./COVER_PAGE_DESIGN.md). |
| **Section / Build Stage Opener** | `"BUILD STAGE N"` badge, Chapter Title, `"120 pcs · Steps 1–24"` | Numbered LEGO polybag graphic (`buildNumberedBagSvg` / `drawNumberedBagCanvas`), Brick Glyph + `120` pill, Open Booklet Icon + `1–24` range, 3D section preview. |
| **Submodel Intro Banner** | Thumbnail + `"SUBMODEL"` / `"BUILD SECTION"` + Name + `"×2"` / `"18 pcs"` | Thumbnail + accent pill (`×2`, or Brick Glyph + `18` when non-repeated). |
| **Submodel Callout Box & Page** | Name + `2×` / `"Build 2×"` | `2×` / `×2` badge only (no submodel name or `"Build"`). |
| **Attachment & Minifig Prep PLIs** | Thumbnail + `"Connect"` / `"Position"` / `×N` + Submodel/Minifig Name | Compact pill: Thumbnail + Snap-Arrow Icon + `×N` (section attach), Thumbnail + `×N` (submodel/minifig attach), or Thumbnail + Curved Pose Icon (minifig prepare). |
| **Rotation Cues** | Circular Arrow Medallion + `"Rotate 90°"` / `"Turn 180°"` / `"Flip Over"` | Horizontal turns: Arrow Medallion + `"90°"` / `"180°"`. Vertical flip: pure circular icon medallion with central brick bar + top/bottom flip arcs (zero text). |
| **Mechanical Step Hints** (`step.stepHint`) | Text pill (e.g. `"Slide sections together"`, `"Push axle through"`) | Circular accent-bordered pictogram badge classified via `classifyStepHintAction()` (`slide_together`, `push_axle`, `attach_axle`, `drop`). |
| **Minifigure Prepare Badge & Pose Pills** | Top-right `"↻ Prepare"` pill; bottom pills e.g. `"Legs 90° forward"` | Top-right circular curved-arrow medallion; bottom pills with color dot + body-joint silhouette pictogram (`legs`, `arm`, `head`, `figure`) + degree numeral (`90°`). |
| **Official Minifig Multi-Step Header** | `"Minifigure 1"` | Omitted (diagram communicates assembly directly). |
| **1:1 Axle / Beam Length Guide** | Bar + `"1:1 4L"` | `"1:1"` + Bar + circled numeral `(4)` (authentic LEGO stud-length notation). |
| **1:1 Minifigure Reference Card** | `"1:1"` / `"1:1 · Fit"` + `"40 mm"` | `"1:1"` (exact) or `"≈1:1"` (fitted) with height bracket and zero unit text. |
| **Parts List (BOM — Grid & Table)** | `"Parts List"`, `"240 pcs · 52 unique"`, English table headers (`Part`, `Qty`, `Part Name`, `Part ID`, `Color`), all theme-enabled fields shown | 2×2 Parts Grid icon (+ `1 / 2` if multi-page), Brick Glyph + `240` on right; Table headers become universal symbols (Brick icon, `×`, `#`, `Aa`, `●`); English-text fields (`name`, `color`) suppressed via `resolveEffectiveBomConfig()` while keeping `image`, `qty`, `partId` active (`state.bomShowTextFields = false`, configurable anytime). |
| **Page Footers & Numbers** | Model/Chapter Title on left; `"Page 1"` / `"1"` / `"1 / N"` on right | Footer title suppressed (checkboxes disabled with `Wordless` badge); `"Page 1"` format disabled and resolved to bare numeral `"1"` (while `"1 / N"` and `"Off"` remain selectable). |
| **Custom Divider Pages** | Default title `"Next Section"` + edit helper prompt | Empty default title/note (user-entered custom text/notes remain untouched if explicitly typed). |
| **Interactive 3D HTML Export** | Full English chrome (`Start Building`, `Parts List`, `← Prev`, `Next →`, `Page N`, `Static Preview Mode`) | Iconographic toolbar & navigation arrows, numeric step/page counters (`1 / 12`), brick-glyph piece counts, numbered bag badges, degree-only rotation badges, wordless BOM grid/table headers, and zero English UI copy. |

---

## 3. Architecture & Data Flow

### Core Module: `src/engine/wordlessMode.ts`
- `DEFAULT_WORDLESS_MODE = true`
- `getWordlessSurfaceDefaults(wordless)` — computes defaults for `coverShowText`, `completeShowText`, `bomShowTextFields`, and `pageNumberFormat`.
- `resolveEffectiveBomConfig(bomConfig, showTextFields)` — returns a non-destructive effective copy of the active theme's `bomConfig` with `name` and `color` disabled when `showTextFields` is `false` (falling back to `image` + `qty` if a user had only text fields enabled), ensuring pagination, preview, PDF, and HTML export stay in sync without mutating or forking the active theme.
- `getBomTableHeaderText(fieldId, wordless)` — maps Table format column headers to universal symbols (`''` + brick glyph, `'×'`, `'#'`, `'Aa'`, `'●'`) in Wordless mode.
- `resolvePageNumberFormatForMode(currentFormat, wordless)` — toggles between `'number'` and `'page_n'` without clobbering explicit `'n_of_total'` or `'none'` preferences.
- `formatManualPageNumber(num, total, format, wordless)` — enforces numeric-only formatting when `wordless` is active.
- `getRotationCueDisplay(cue, wordless)`, `classifyStepHintAction(hint)`, `formatMinifigPoseBadgeText(ind, wordless)`, and `formatMinifig1to1Header(heightMm, isExact, wordless)`.
- Parallel DOM SVG builders (`build*Svg`) and Canvas 2D drawers (`draw*Canvas`) for all iconography.

### Cover Layout Integration: `src/cover/coverLayout.ts`
- `CoverMeta.showText: boolean` (defaults to `true` in `createDefaultCoverMeta()` / `normalizeCoverMeta(raw)` for legacy callers and `.biw` files; initialized to `false` on wordless imports).
- `CoverLayoutInput.hasTitle`:
  - When `!hasTitle && !hasSubtitle`, `heroTopRatio` shrinks (`0.06`, or `0.14` when creator/theme logos are present) so the 3D hero render expands upward into the freed title space.
  - Bottom-right `Brick Instruction Works` attribution card + QR code remain locked and non-editable in both modes.

### Runtime & Persistence (`src/studioRuntime.ts`)
- `getEffectiveBomConfig()` wraps `resolveEffectiveBomConfig(normalizeBomConfig(state.bomConfig), Boolean(state.bomShowTextFields))` and is shared across `rebuildPages()`, `getBomUsableAreaInches()`, live DOM `renderAll()`, PDF `renderPageToJpegBytes()`, `runInteractiveHtmlExport()`, and `syncBomSetupUI()` / `renderBomSetupPreview()`.
- `applyWordlessMode(enabled, { pushHistory, render })` atomically updates `state.wordlessMode`, `coverMeta.showText`, `completeMeta.showText`, `state.bomShowTextFields`, and `pageNumberFormat` (via `resolvePageNumberFormatForMode`), pushing a single undo snapshot via `captureHistorySnap()`.
- **Undo / Redo**: `captureHistorySnap()` and `applyHistorySnap()` capture and restore `wordlessMode`, `bomShowTextFields`, `pageNumberFormat`, `coverMeta`, `completeMeta`, and `backMeta`.
- **Session Persistence (IndexedDB `prefs`)**: Saves `wordlessMode` and `bomShowTextFields`; restores missing `wordlessMode` as `false` (and `bomShowTextFields` as `true`) for legacy sessions.
- **`.biw` Project Files**: Saves `wordlessMode` and `bomShowTextFields` alongside existing v4 fields (keeping `PROJECT_FILE_STUDIO_VERSION = 4`); missing fields in older `.biw` files load in labeled mode (`wordlessMode: false`, `bomShowTextFields: true`).

---

## 4. User Controls & Discovery

1. **Import & Step Generation Modal (`#importModal`)**:
   - **Instruction Language** radio cards: **Wordless (LEGO-Style)** vs. **With Text Labels**.
   - Defaults to **Wordless (LEGO-Style)** on fresh file import; reflects current `state.wordlessMode` when reopened post-import via **Menu → Step Generation**.
2. **Page Setup Modal (`#pageSetupModal`)**:
   - **Instruction Language** master checkbox: **Wordless Instructions (LEGO-Style)**.
   - **Page Number Format**: `"Page 1"` option is disabled with tooltip when Wordless is active.
   - **Model Title on Every Page** (both in Page Setup and Style Popover): disabled with a subtle `Wordless` pill badge while Wordless mode is active (preserving the underlying theme setting without forking the theme).
   - **Included Pages**: independent toggles for **Cover**, **Build Complete**, **Parts List**, and **Back Cover**, each showing a **Settings** link to the corresponding page when enabled (the duplicate per-page text & fireworks toggles previously under "Extra Pages" live on each individual page).
3. **Cover & Build Complete Page Edit Overlays**:
   - Cover Page: quick `Title Text` pill toggle right inside the Edit Cover Page toolbar, collapsing title/subtitle text inputs while hidden.
   - Build Complete Page: quick `Text` and `Fireworks` pill toggles right inside the Edit Build Complete toolbar, collapsing title/subtitle text inputs while hidden.
4. **Parts List Setup (`#bomSetupModal`)**:
   - Displays a subtle **Wordless** notice banner with a 1-click **Show Text** button whenever `state.bomShowTextFields` is `false`, marks `Part Name` and `Color` field rows with a `Wordless` badge, and automatically re-enables `state.bomShowTextFields` if the user checks either field directly.
