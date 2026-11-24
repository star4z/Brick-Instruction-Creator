# Dedicated Bricks Library Screen & Searchable 3D Parts Preview — Design Specification

## 1. Motivation & UX Problems Solved

Previously, Bricks Library controls were embedded directly inside the slide-out menu drawer and suffered from four UX and transparency issues:

1. **Silent 15-Part Fallback (~34 Files)**: Clicking **Fetch Missing Parts Online** with no model loaded silently fell back to a hardcoded list of 15 basic brick IDs, which expanded into ~34 `.dat` files (15 top-level parts + 19 internal subparts/primitives) with no explanation of why only 34 files were saved.
2. **Ambiguous "Missing Parts" State Without a Model**: The button always said *"Fetch Missing Parts Online"* even when no model was loaded, leaving users unclear on what was "missing".
3. **Confusing "Clear" Button Placement Next to "Import"**: Positioning a `Clear` button directly beside `Import .zip / .dat` implied it cleared the last import action, when in reality it wiped the entire saved Bricks Library from IndexedDB without confirmation.
4. **No Library Inspection or Search**: Users had no way to preview what parts were currently loaded (saved, embedded `.io`, or built-in), search for a part by ID or name, or fetch specific parts/packs on demand.

---

## 2. Information Architecture

### 2.1 Menu Drawer Entry
- The slide-out menu drawer (`#menuDrawer`) displays a clean **`Bricks Library →`** navigation button (`#menuBricksLibBtn`) matching **Page Setup** and **Parts List Setup**, with concise purpose-oriented helper copy (*"3D brick shapes needed to render parts in your models."*) rather than listing internal library-management features.
- Its right-aligned summary (`#libStatusText`) concisely reports current state via `formatLibraryMenuSummary()`:
  - Missing model parts take priority with an amber highlight (e.g., `3 missing · 15 saved`).
  - Otherwise shows saved top-level part count (`15 parts saved`), embedded `.io` count (`42 embedded (.io)`), or built-in count (`95 built-in`).
- Quick actions inside **Model Issues** (`#errorsModal`) open the dedicated Bricks Library screen directly rather than scrolling the menu drawer.

### 2.2 Dedicated Bricks Library Screen (`#bricksLibraryModal`)
A responsive full-height modal (`max-w-4xl`) organized into two top-level tabs plus a shared live progress bar (with a working **Cancel** button during online fetches):

#### Tab 1: **Browse & Search** (`#libTabBrowse`)
- **Search Bar**: Real-time debounced search (`#libSearchInput`) matching part ID, human-readable name, and category. Search normalization (`normalizeLibrarySearchText`) unifies spacing and multiplication signs (`2 x 4`, `2×4`, `2x4`) so official LDraw names match naturally.
- **Direct Search-to-Fetch Shortcut**: When a user types a specific LDraw part ID (e.g., `3010` or `3626cp01`) that is not yet in the saved library, an inline banner offers one-click **Fetch `<id>` Online**.
- **Filters**:
  - **Scope pills**: `All`, `Saved`, `Embedded .io` (when present), `Built-in`, `In Model` (when a model is loaded), and `Missing` (when the loaded model has missing shapes).
  - **Category selector**: `All Categories`, `Bricks`, `Plates`, `Tiles`, `Slopes & Curves`, `Technic & Bars`, `Minifigures`, `Windows & Panels`, `Other Parts`.
  - **Helpers toggle**: `Show subparts & primitives` (off by default so internal `s/...` subparts and geometric primitives like `box5` or `4-4edge` don't clutter the browse grid).
- **Lazy 3D Thumbnail Grid**:
  - Paginated (48 items per batch + *"Load more parts"* button) so even a full 20,000-part `complete.zip` import stays responsive.
  - Uses `IntersectionObserver` + a 4-per-frame `requestAnimationFrame` WebGL snapshot queue (`libThumbCache`, bounded LRU up to 320 entries) with 10 selectable LEGO color swatches.
  - Renders crisp HiDPI 220×220 thumbnails using `heroQuality: true` (micro-beveled ABS brick edges, 18–24 segment smooth studs & curves) and `heroShading: true` (3-point studio softbox lighting + glossy ABS specular highlights + tight camera framing + subtle edge seams) over a soft radial studio backdrop.
  - Built-in catalog shapes render authentic procedural geometry rather than box placeholders (slopes, inverted slopes, smooth curved slopes, L-shaped corners, centered/end-stud jumpers, slotted grilles, rounded/quarter-round/holed tiles, Technic pin holes & `+`-section axles, open hollow window frames, SNOT brackets, horizontal/vertical C-clips, contoured seats, flanged train wheels/holders, and sculpted minifigure limbs & domed helmets).
- **Interactive 3D Part Preview Inspector (`#libPreviewPane`)**:
  - Displays a HiDPI 440×440 studio-lit WebGL render with 4 yaw angles (`Front`, `Right`, `Back`, `Left`) and a `Top`/`Bottom` flip toggle.
  - Shows part ID, human name, kind (`Part`/`Subpart`/`Primitive`), category, subfile reference count, and all source badges (`Embedded (.io)`, `Saved LDraw .dat`, `Built-in Shape`, `In Current Model` / `Missing in Model`).
  - Offers single-part actions: **Fetch Exact `<id>.dat` Online** (when not saved) or **Remove `<id>.dat` from Saved Library** (when saved).

#### Tab 2: **Fetch & Import** (`#libTabManage`)
Organized into four clearly separated cards:

1. **Current Model Card** (Context-Aware via `getModelFetchCopy`):
   - **No model loaded**: Explicitly reads *"No Model Loaded"* and disables the model-missing CTA (never says *"Fetch Missing Parts"* without a model).
   - **Model loaded with missing shapes**: Shows the model title, exact count, preview chips of missing `.dat` IDs, and an enabled **`Fetch N Missing Model Parts Online`** CTA.
   - **Model loaded with built-in approximations only**: Offers an optional **`Fetch N Exact LDraw Shapes for Model`** upgrade.
   - **Model complete**: Displays **`All Model Parts Loaded ✓`** (disabled).
2. **Download Starter Packs or Specific Parts Online**:
   - Mirror selector (`GitHub LDraw Library`, `jsDelivr LDraw CDN`, or custom base URL).
   - Four transparent **Curated Starter Packs** (`ONLINE_STARTER_PACKS`, 102 unique official parts total):
     - *Bricks & Plates* (34 parts)
     - *Tiles, Slopes & SNOT* (28 parts)
     - *Technic, Bars & Clips* (24 parts)
     - *Minifigures & Windows* (16 parts)
   - Each pack shows live `saved / total` progress and an individual fetch button, alongside a **Fetch All Starter Packs** button.
   - **Fetch Specific LDraw Part IDs** input accepting comma-, space-, or newline-separated IDs.
3. **Import Local Files (`.zip` / `.dat`)** — Standalone Card:
   - Contains only the **`Import .zip / .dat Files…`** action and an external link to `https://library.ldraw.org/updates?latest` for downloading the full ~20,000-part `complete.zip`.
   - No destructive button sits next to Import.
4. **Saved Library Storage** — Visually Separated Danger Zone:
   - Red-tinted bottom card displaying exact storage breakdown (`X parts + Y subparts/primitives (Z files · T textures)`).
   - Explicitly explains that clearing only removes saved fetched/imported library files from browser IndexedDB and does **not** affect the loaded model, embedded `.io` shapes, or built-in parametric shapes.
   - Uses a button clearly labeled **`Clear Entire Saved Library`** backed by an inline 2-step confirmation (`Yes, Clear Saved Library` / `Cancel`).

---

## 3. Data Classification & Pure Engine Module (`src/engine/bricksLibrary.ts`)

All pure classification, indexing, search, and UI copy rules live in `src/engine/bricksLibrary.ts` (covered by unit tests in `src/engine/__tests__/bricksLibrary.test.ts`):

- **`classifyDatEntryKind(key, lines, title)`**: Inspects `0 !LDRAW_ORG` headers first (`Part`/`Shortcut`, `Subpart`, `Primitive`/`48_Primitive`/`8_Primitive`), falling back to path prefixes (`s/`, `48/`, `8/`), `~`-prefixed helper titles, and standard LDraw primitive naming patterns.
- **`buildLibraryIndex(input)`**: Deduplicates `BL_Item_No` aliases sharing the same line-array reference, merges `embeddedDatRaw`, `userLibRaw`, `PARTS_CATALOG`, and current model part sets, and produces accurate `LibraryStats` separating top-level `savedParts` from `savedHelpers` (subparts + primitives).
- **`filterLibraryItems(items, options)`**: Filters by scope, category, helper visibility, and normalized multi-token search query, ranking exact ID matches first.
- **`textureStore.clearLibrary()`**: Added to `src/engine/textureStore.ts` so clearing the saved library also evicts library-sourced decal textures without touching `.io`-embedded textures.
