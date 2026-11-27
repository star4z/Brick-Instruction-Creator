# Style Dialog Themes Design

The Styles surface (`#stylePopover`) is split into two distinct pages backed by shared components and navigation state ([`src/themes/themeEditorState.ts`](../src/themes/themeEditorState.ts)):

1. **Theme Selector page** (`#styleSelectorView`) — default view when opening Styles (from the top-right toolbar button, side menu, or Import Wizard's **Theme** row).
2. **Theme Editor page** (`#styleEditorView`) — unified theme editor opened from:
   - Styles → Theme Selector (`Edit "<Theme Name>"` or `New from Current`, popover mode with `←` back to Themes),
   - Parts List Setup (`#bomSetupModal` → **Saved with theme** banner `Edit Theme`, centered modal mode with `←` back to Parts List Setup),
   - App Settings (`#settingsModal` → **New Manual Defaults** → **Custom Defaults** → `Edit Theme`, centered modal mode targeting `appSettings.customDefaults.themeId` without mutating the active project's theme, with `←` back to Settings),
   - Import Wizard (`Theme` → Theme Selector → `Edit Theme`, or `Rendering Style` → Theme Editor scrolled to `#styleStepDisplaySection`, centered modal mode).

## Shared Theme Selector Component

`renderThemeSelector()` + `buildThemeSelectorCard()` render theme preview cards consistently across:
- **Styles → Theme Selector page** (`#themeStrip`, responsive grid: 2 columns in popover / mobile, 3 columns in centered modal), plus pinned actions: primary **Edit Theme** button (`#btnEditActiveTheme`) and a 3-column **New** / **Import** / **Delete** row (`#btnNewCustomTheme`, `#btnImportTheme`, `#btnSelectorDeleteTheme`).
- **App Settings → Custom Defaults → Default Theme** (`#settingsDefThemeStrip`, horizontal recency-ordered strip with `Shift + Scroll` desktop wheel support) paired with an **Edit Theme** button (`#btnSettingsEditDefTheme`).
- **Import Wizard → Theme** (opens the Styles Theme Selector page in modal mode, with one-click access into the Theme Editor).

Each card shows a mini page preview (background, step number `"1"` in the heading font, a parts box, muted text in the body font, accent dot, and a compact pencil marker for custom themes) ordered via `orderThemesByRecent()` with the currently selected theme first:
- **Stable order while open**: the theme order is snapshotted right before showing the selector (every time Styles opens, returns from Theme Editor to Theme Selector, or Settings opens) and stays frozen while open so cards never jump around under the pointer while browsing.
- **Selected styling**: uses the app's primary maroon selection treatment (`bg-[var(--primary)] text-[var(--primary-foreground)]` — white label on logo maroon card in both light and dark modes).
- **Tap/click selected to edit**: clicking an unselected card selects it; clicking the already-selected card opens the Theme Editor directly.
- **Delete from selector**: custom themes can be deleted via (1) swiping left on the card to expose an iOS Mail-style circular Delete button with label below on the right side, (2) right-clicking / long-pressing a card to open `#themeCardContextMenu` (`Edit Theme`, `Duplicate`, `Delete Theme`), or (3) the bottom `#btnSelectorDeleteTheme` button — all routed through `deleteThemeById()` and the permanent-action confirmation dialog.

## Theme Editor Layout & Editing Model

- **Unified Header** (`#stylePopoverHeader`): top-left Back button (`#btnStyleBack`), title (`Edit Theme` + theme name subtitle), `Collapse All / Expand All` (`#btnToggleAllStyleSections`, shown only in Theme Editor), and modal Close (`×`) when presented as a centered modal.
- **Sticky Live Preview** (`#themeEditorPreviewHeader` + `#themeEditorPreview`): pinned above `#stylePopoverScroll` so background, typography, colors, step dividers, and progress bar changes preview live while scrolling.
- **Collapsible Sections** (`#stylePopoverScroll`) with scope chips (`All Pages` / `All Steps`) placed inside at the top of each section body:
  1. **Theme Name** + **Export / Delete** (delete disabled for built-ins; built-in auto-fork hint).
  2. **Page Background** (`All Pages`).
  3. **Text, Boxes & Accents** (`All Pages`) with **Colors** and **Fonts** (`#styleTypographySection`) subheadings.
  4. **Rendering Style** (`All Steps`): lighting (`None` / `Standard` / `Studio`), outlines, placement arrows, and `Fade Earlier Pieces`.
  5. **Step Display** (`All Pages`): rotation badges, 1:1 axle & beam guides, attachment starburst, minifigure step style & 1:1 view, step dividers, step number weight, model title, and build progress bar.
  6. **Parts List** (no redundant scope chip): direct link (`#btnStyleOpenBomSetup`) to `#bomSetupModal` (hidden in Import Wizard, Settings, and when opened from Parts List Setup).
- `patchEditedTheme(patch)` routes edits to `patchActiveTheme(patch)` for project-scoped origins, or updates/auto-forks `appSettings.customDefaults.themeId` when opened from App Settings (also syncing the open project if it happens to use the same theme). **Built-in themes are never modified.**
- Custom themes save automatically (300 ms debounced storage persistence, RAF-batched re-renders). Renaming applies as you type and restores the saved name on blur if cleared.

## Style Options Stored on the Theme

`ThemeStyleOptions` in [`src/themes/customThemes.ts`](../src/themes/customThemes.ts) uses the same key names as the runtime `state`:

| Option | Default |
| --- | --- |
| `stepLighting` / `highQualityStepRender` (Lighting: `none` flat uniform unlit colors, `standard` 3-point ABS plastic shading, `studio` cover-quality bevels & soft shadows) | `'none'` / `false` (`highQualityStepRender` derived from `stepLighting === 'studio'`; legacy `highQualityStepRender: true` migrates to `'studio'`) |
| `highlightNew` / `highlightColor` / `highlightLineWeight` (Outline New Parts & line weight) | `false` / `#ff2d55` / `'medium'` |
| `starkBlackOutlines` / `outlineLineWeight` (Outline All Parts & outline weight) | `true` / `'medium'` |
| `fadeOpacity` / `fadePrev` (Fade Earlier Pieces: Off `1.0`, Subtle `0.82`, Medium `0.65`, Heavy `0.45`; includes swatch chips and live stacked-brick preview) | `1.0` / `false` (`fadePrev` derived from `fadeOpacity < 0.99`) |
| `showRotCues` (Rotation Badges) | `true` |
| `showSizeGuides` (1:1 Axle & Beam Guides) | `true` |
| `showMinifig1to1` (1:1 Minifigure View) | `false` |
| `stepBorderStyle` / `showStepBorders` (Step Dividers: `lines` LEGO-style divider lines between steps with orientation-based line priority, `boxes` full box around each step, `none` open borderless) | `'lines'` / `false` (`showStepBorders` derived from `stepBorderStyle === 'boxes'`; legacy `showStepBorders: false` migrates to `'none'`) |
| `showPageTitle` (Model Title on Pages) | `true` |
| `bomConfig` (Parts List format, grid sizing, flow, variable scaling, fields/columns, sorting) | `createDefaultBomConfig()` (Grid, Auto 0.5″ min, LTR/TTB, Image/Qty/Name/LEGO Part ID) |

- Built-in themes use the defaults. `normalizeThemeStyleOptions()` checks types and clamps or sanitizes values (e.g. `fadeOpacity` is kept within 0.2–1, `highlightColor` must be a hex color, `stepLighting` is sanitized to `'none' | 'standard' | 'studio'`, `stepBorderStyle` is sanitized to `'lines' | 'boxes' | 'none'`, and `bomConfig` is sanitized by `normalizeBomConfig()`). All options including `bomConfig` are included in `.biwtheme` exports.
- `applyActiveThemeStyleToState()` copies the active theme's options into `state` before every render, so the renderers stay cleanly decoupled from theme storage. Every control that used to write these `state` fields directly now goes through `patchActiveTheme()` (and `patchBomConfig()` for Parts List controls). That includes the Page Setup duplicates of Step Dividers (`Lines` / `Boxes` / `None`) and Model Title on Pages, the Step Edit modal's 1:1 Minifigure checkbox, and the `#bomSetupModal` Parts List Setup dialog (linked directly from the **Parts List** section of `#stylePopover`; see [`PARTS_LIST_DESIGN.md`](./PARTS_LIST_DESIGN.md)). Minifigure Steps (`minifigStyle`) lives in **Step Generation** (`#importModal`) as a project-level setting rather than on the theme.
- **Migration:** `adoptLegacyStyleOptions()` reads the old top-level values (including legacy `bomConfig` and `highQualityStepRender`) from saved session prefs and pre-theme `.biw` projects. If they differ from the active theme, it applies them to the theme (forking a built-in, or updating a custom theme in place), so existing users keep their settings without forking unmodified defaults.

## Export: One File

- Export always writes **one** `.biwtheme` file for the current theme. Multi-theme pack export was removed. Older pack files still import.
- On iOS, the extra "2 Items" in Save to Files came from the share call. It passed a `title` along with the file, and iOS saved that title as a second item. All share calls now pass only `{ files: [file] }`. See [`CUSTOM_FILE_EXTENSIONS_DESIGN.md`](./CUSTOM_FILE_EXTENSIONS_DESIGN.md).
