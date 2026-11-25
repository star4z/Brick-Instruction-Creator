# Style Dialog Themes Design

The Style dialog (`#stylePopover`) is now the only place to choose and edit themes. The separate Custom Theme Editor modal and its "Start From Base" templates are gone.

## Layout

1. **Sticky theme header** (`#stylePopoverThemeHeader` + `#themeStrip`): pinned at the top of the popover (`shrink-0` above the `#stylePopoverScroll` pane) so the active theme and strip stay visible while scrolling the style options below. One horizontally scrollable row contains every theme, built-in and custom. Each card shows a mini page preview: background, step number "1" in the theme's heading font, a parts box, muted text in the body font, and an accent dot. Custom themes have a small pencil marker.
   - **Alignment & Desktop Scrolling:** `#themeStrip` uses matching inline padding and `scroll-padding-inline: 1rem` (`px-4 scroll-px-4`) so the first theme card aligns flush with the left margin of all other sections in `#stylePopover` instead of snapping against the popover edge. On desktop fine-pointer devices (`@media (hover: hover) and (pointer: fine)`), a compact `#themeStripScrollHint` below the strip notes `Shift + Scroll` to browse themes, backed by a `wheel` handler that translates `Shift + vertical wheel` reliably across browsers.
   - **Order:** the current theme always comes first, then other themes by most recent use, then themes never used in their default order (built-ins, then custom themes in creation order). This comes from `orderThemesByRecent()`, with recents kept in `localStorage` (`bic_theme_recents_v1`) via `touchThemeRecent()`. The renderAll wrapper calls `noteThemeUsed()`, so every way of changing the theme (strip, import, project load, delete) updates the order.
   - **New from Current** (`#btnNewCustomTheme`) copies the current theme into a new custom theme, selects it, and focuses the name field.
2. **Theme name** plus **Import / Export / Delete** (first section inside `#stylePopoverScroll`). Delete is disabled for built-ins. A hint explains that changing a built-in creates a custom copy.
3. **Page Background**, **Text, Boxes & Accents**, **Typography**: the former editor controls. They apply live.
4. **Rendering Style**: lighting (`None` / `Standard` / `Studio`), outlines (`Outline New Parts` + color + line weight, `Outline All Parts` + line weight), and `Fade Earlier Pieces`, all stored on the theme.
5. **Step Display**: rotation badges, 1:1 axle & beam guides, minifigure step style & 1:1 view, step borders, and model title on pages, all stored on the theme.
6. **Parts List**: a direct link (`#btnStyleOpenBomSetup`) to the **Parts List Setup** dialog (`#bomSetupModal`) with a compact summary of the active theme's Parts List configuration; `#bomSetupModal`'s **Saved with theme** banner (`#btnBomOpenStyle`) links back to the Style dialog.

## Editing Model

- `patchActiveTheme(patch)` is the single write path. **Built-in themes are never modified.** The first change to one forks it with `forkThemeIntoCustom()` (named "<Name> Custom" and de-duplicated by `makeUniqueThemeName()`), applies the change, selects the fork, and shows a toast.
- Custom themes save automatically. The theme is normalized on each change, localStorage/IndexedDB writes are debounced (300 ms), and re-renders are batched per animation frame, so dragging a color picker stays smooth.
- Renaming applies as you type. An empty field keeps the previous name, and the field resets to the saved name on blur.

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
| `minifigStyle` (Minifigure Steps) | `exploded` |
| `showMinifig1to1` (1:1 Minifigure View) | `false` |
| `showStepBorders` (Box Around Each Step) | `true` |
| `showPageTitle` (Model Title on Pages) | `true` |
| `bomConfig` (Parts List format, grid sizing, flow, variable scaling, fields/columns, sorting) | `createDefaultBomConfig()` (Grid, Auto 0.5″ min, LTR/TTB, Image/Qty/Name/LEGO Part ID) |

- Built-in themes use the defaults. `normalizeThemeStyleOptions()` checks types and clamps or sanitizes values (e.g. `fadeOpacity` is kept within 0.2–1, `highlightColor` must be a hex color, `stepLighting` is sanitized to `'none' | 'standard' | 'studio'`, and `bomConfig` is sanitized by `normalizeBomConfig()`). All options including `bomConfig` are included in `.biwtheme` exports.
- `applyActiveThemeStyleToState()` copies the active theme's options into `state` before every render, so the renderers stay cleanly decoupled from theme storage. Every control that used to write these `state` fields directly now goes through `patchActiveTheme()` (and `patchBomConfig()` for Parts List controls). That includes the Page Setup duplicates of Box Around Each Step and Model Title on Pages, the Step Edit modal's 1:1 Minifigure checkbox, `applyMinifigStyleChange()`, and the `#bomSetupModal` Parts List Setup dialog (linked directly from the **Parts List** section of `#stylePopover`; see [`PARTS_LIST_DESIGN.md`](./PARTS_LIST_DESIGN.md)).
- **Migration:** `adoptLegacyStyleOptions()` reads the old top-level values (including legacy `bomConfig` and `highQualityStepRender`) from saved session prefs and pre-theme `.biw` projects. If they differ from the active theme, it applies them to the theme (forking a built-in, or updating a custom theme in place), so existing users keep their settings without forking unmodified defaults.

## Export: One File

- Export always writes **one** `.biwtheme` file for the current theme. Multi-theme pack export was removed. Older pack files still import.
- On iOS, the extra "2 Items" in Save to Files came from the share call. It passed a `title` along with the file, and iOS saved that title as a second item. All share calls now pass only `{ files: [file] }`. See [`CUSTOM_FILE_EXTENSIONS_DESIGN.md`](./CUSTOM_FILE_EXTENSIONS_DESIGN.md).
