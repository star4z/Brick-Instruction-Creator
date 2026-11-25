# Keyboard Controls & Customizable Shortcuts Design

> **Status**: Implemented across the Studio runtime ([`src/studioRuntime.ts`](../src/studioRuntime.ts)), Main Menu drawer ([`index.html`](../index.html)), and Billund pressroom keycap styling ([`src/index.css`](../src/index.css)). Pure engine module lives in [`src/engine/keyboardShortcuts.ts`](../src/engine/keyboardShortcuts.ts) with unit tests in [`src/engine/__tests__/keyboardShortcuts.test.ts`](../src/engine/__tests__/keyboardShortcuts.test.ts) and runtime wiring assertions in [`src/__tests__/studioRuntimeSafety.test.ts`](../src/__tests__/studioRuntimeSafety.test.ts).

## Problem Statement

Manual creators iterate rapidly through dozens of pages—undoing camera tweaks, flipping between pages, rotating step angles, toggling page breaks, nudging exploded parts, and opening Style or Page Setup dialogs. Previously, the live Studio runtime only handled `Escape` for a subset of modals and had no keyboard controls for Undo/Redo, page navigation, zoom, mode switching, camera rotation, or panel access, nor any way to view or customize shortcuts.

## Design Principles

1. **Cross-Platform Primary Modifier (`Mod`)**: Canonical bindings store `Mod` instead of hardcoding `Ctrl` or `Meta`. On macOS/iPadOS, `Mod` maps to `⌘` (Command) and displays native Apple modifier glyphs (`⌃⌥⇧⌘`); on Windows/Linux/ChromeOS, `Mod` maps to `Ctrl` (`Ctrl+Alt+Shift+`). Recording and runtime dispatch both share `eventToCanonicalCombo()` for 100% round-trip fidelity across OSes and keyboard layouts (including macOS `Option+letter` `e.code` fallback and layout-independent `?` / `+` handling).
2. **Never Hijack Text Input or Browser Primitives**:
   - All shortcuts (including `Mod+Z` / `Mod+Shift+Z`) yield to native browser behavior inside `<input>` (text/search/number/url/range/color), `<textarea>`, `<select>`, `[contenteditable]`, and IME composition (`e.isComposing`), so native text-input undo/redo and slider arrows always work.
   - Focused buttons, links, checkboxes, and radios preserve native unmodified `Space` / `Enter` activation.
   - Essential browser shortcuts (`Mod+C/V/X/A/W/T/N/R/L/F`, browser zoom `Mod++` / `Mod+-` / `Mod+0`, and macOS `⌘Y` History) are never stolen by defaults.
3. **Context & Surface Gating**: Actions only run when their prerequisites are met (model loaded, matching page kind, Parts mode with selected parts, compatible active modal/drawer surface, and `allowRepeat` permission for held keys). Toggle and dialog actions block key-repeat so holding a key never flickers modals or triggers repeated file exports.
4. **Universal Hierarchical `Escape`**: `Escape` is intentionally reserved (non-rebindable) and cleanly unwinds one layer at a time: active shortcut recording → Keyboard Shortcuts screen → Page Break `?` help tooltip → Bricks Library color picker → Bricks Library → Apply Camera to Steps → Parts List Setup → Page Setup → Export/Print → Model Issues → Open Model → Missing Parts → Import Assistant → Pages & Steps Overview → Style popover → Main Menu drawer → clear selected parts → return to Pan mode.
5. **Dedicated Keyboard Shortcuts Screen**: Clicking **Customize Shortcuts** (`#menuShortcutsBtn`) in the main slide-out menu drawer (`#menuScrollBody`)—or pressing `?` anytime—opens the dedicated **Keyboard Shortcuts** screen modal (`#shortcutsModal`), matching Page Setup, Parts List Setup, and Bricks Library. Users can search/filter shortcuts, view full action descriptions, click any keycap to record a custom combo, resolve conflicts cleanly without silent overwrites, unbind individual actions, reset single bindings, or reset all defaults—persisted in `localStorage` as a sparse diff (`biw_keyboard_shortcuts_v1`).
6. **Live Dynamic Tooltips**: Button tooltips across the Studio (`#btnUndo`, `#btnRedo`, `#btnOpenMenu`, `#btnStylePop`, `#btnHeaderExport`, page navigation, zoom bar, mode pill tabs, and menu items) automatically reflect each user's live custom keybindings (and omit parentheses when an action is unbound).

---

## Implemented Keyboard Controls Catalog (35 Actions)

| Category | Action ID | Action | Windows / Linux Default | macOS Default | Repeat | Scope & Notes |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **History** | `undo` | Undo | `Ctrl+Z` | `⌘Z` | Yes | Model loaded; also works in Pages & Steps Overview. |
| **History** | `redo` | Redo | `Ctrl+Shift+Z` *(also `Ctrl+Y`)* | `⇧⌘Z` | Yes | Model loaded; `Ctrl+Y` secondary alias applies on non-macOS when Redo uses default and nothing else claims `Ctrl+Y`. |
| **Page Navigation** | `pagePrev` | Previous Page | `←` | `←` | Yes | Model loaded, main stage. |
| **Page Navigation** | `pageNext` | Next Page | `→` | `→` | Yes | Model loaded, main stage. |
| **Page Navigation** | `pageFirst` | First Page | `Home` | `Home` | No | Jumps to Cover / first page. |
| **Page Navigation** | `pageLast` | Last Page | `End` | `End` | No | Jumps to Back Cover / last page. |
| **Page Navigation** | `stepPrevSlot` | Previous Step on Page | `[` | `[` | Yes | Cycles active step slot backward on multi-step pages. |
| **Page Navigation** | `stepNextSlot` | Next Step on Page | `]` | `]` | Yes | Cycles active step slot forward on multi-step pages. |
| **View & Zoom** | `zoomIn` | Zoom Page In | `+` *(also `=`, Numpad `+`)* | `+` | Yes | Zooms the live page stage (`×1.22`). |
| **View & Zoom** | `zoomOut` | Zoom Page Out | `−` *(also Numpad `−`)* | `−` | Yes | Zooms out of the live page stage (`×0.82`). |
| **View & Zoom** | `zoomReset` | Reset Page Zoom | `0` | `0` | No | Resets stage zoom & pan to `100%`. |
| **Editor Modes** | `modePan` | Pan Mode | `1` | `1` | No | Switches to Pan mode (matches bottom dock left-to-right order). |
| **Editor Modes** | `modeParts` | Parts Mode | `2` | `2` | No | Switches to Parts mode on step pages. |
| **Editor Modes** | `modeStepCamera` | Step / Camera Mode | `3` | `3` | No | Switches to Step mode on step pages or Camera mode on Cover / Build Complete. |
| **Editor Modes** | `modePage` | Page / Parts List Mode | `4` | `4` | No | Switches to Page mode (or toggles Parts List Setup on BOM pages). |
| **Step & Camera** | `cameraRotateLeft` | Rotate Camera −90° | `Q` | `Q` | Yes | Rotates active step or Cover / Build Complete camera 90° CCW (undoable). |
| **Step & Camera** | `cameraRotateRight` | Rotate Camera +90° | `E` | `E` | Yes | Rotates active step or Cover / Build Complete camera 90° CW (undoable). |
| **Step & Camera** | `cameraFlipSide` | Flip Camera Top / Bottom | `F` | `F` | No | Toggles active step camera between top (`+30°`) and underside (`−30°`) (undoable). |
| **Step & Camera** | `cameraReset` | Reset Camera | `R` | `R` | No | Resets custom camera angle, zoom, and framing on active step or hero page (undoable). |
| **Step & Camera** | `togglePageBreak` | Toggle Page Break | `B` | `B` | No | Pins/unpins a page break before the active step (undoable). |
| **Parts Editing** | `partNudgeUp` | Nudge Parts Up | `Shift+↑` | `⇧↑` | Yes | Lifts selected parts `+1` stud in Parts mode (undoable). |
| **Parts Editing** | `partNudgeDown` | Nudge Parts Down | `Shift+↓` | `⇧↓` | Yes | Lowers selected parts `−1` stud in Parts mode (undoable). |
| **Parts Editing** | `partNudgeLeft` | Nudge Parts Left | `Shift+←` | `⇧←` | Yes | Nudges selected parts left `1` stud in Parts mode (undoable). |
| **Parts Editing** | `partNudgeRight` | Nudge Parts Right | `Shift+→` | `⇧→` | Yes | Nudges selected parts right `1` stud in Parts mode (undoable). |
| **Parts Editing** | `partToggleArrow` | Toggle Placement Arrow | `A` | `A` | No | Toggles exploded placement arrows on selected parts (undoable). |
| **Panels & Files** | `toggleMenu` | Toggle Studio Menu | `M` | `M` | No | Opens/closes the main slide-out menu drawer (works on Welcome screen too). |
| **Panels & Files** | `toggleOverview` | Pages & Steps Overview | `G` | `G` | No | Opens/closes the Pages & Steps overview modal. |
| **Panels & Files** | `toggleStyle` | Style & Themes | `T` | `T` | No | Opens/closes the floating Style & Themes popover. |
| **Panels & Files** | `openPageSetup` | Page Setup | `P` | `P` | No | Opens/closes the Page Setup modal. |
| **Panels & Files** | `openBomSetup` | Parts List Setup | `L` | `L` | No | Opens/closes the Parts List Setup modal. |
| **Panels & Files** | `openBricksLibrary` | Bricks Library | `K` | `K` | No | Opens/closes the 3D Bricks Library modal (works on Welcome screen too). |
| **Panels & Files** | `importFile` | Import Model / Project | `Ctrl+O` | `⌘O` | No | Opens the Import Model or Project dialog (works on Welcome screen too). |
| **Panels & Files** | `exportProject` | Export Project (`.biw`) | `Ctrl+S` | `⌘S` | No | Saves/exports the current project as a `.biw` file. |
| **Panels & Files** | `openExport` | Print / Export PDF | `Ctrl+P` | `⌘P` | No | Opens the Print & Export PDF dialog when a model is loaded. |
| **Panels & Files** | `openShortcuts` | Keyboard Shortcuts | `?` | `?` | No | Opens/closes the dedicated Keyboard Shortcuts screen and focuses the filter input. |

---

## Additional Keyboard Control Candidates Evaluated (Future / Optional)

These actions were evaluated during the proposal phase and intentionally left out of the default keymap to avoid crowding single-key bindings or triggering high-impact mutations accidentally; they can be added as **unbound-by-default** customizable slots in a future iteration if requested:

- **Parts Depth Nudge Forward / Back** (`dz = ±20` LDU) and **Part Tilt ±15°** (`Shift+Q` / `Shift+E` or `Alt+Arrow`): Useful for power users doing heavy exploded-view polishing without cluttering the initial Parts Editing group.
- **Step Mode Sub-Tab Switching** (`Camera` / `Layout` / `Notes`) and **Model Zoom In / Out** (`stepCamZoomUp` / `stepCamZoomDown`): Fast switching inside Step Mode without leaving the keyboard.
- **Split Selected Parts Before / After** (`actNewBefore` / `actNewAfter`) and **Merge Step into Previous** (`stepMergePrevBtn`): Deliberately omitted from single-key defaults because they restructure steps and can discard step-level overrides (requiring visual awareness of the inline destructive-impact notices described in [`DESTRUCTIVE_ACTIONS_DESIGN.md`](./DESTRUCTIVE_ACTIONS_DESIGN.md)).
- **Apply Camera to Steps Dialog** (`#btnApplyAngleRange`), **Insert Divider Page** (`#menuAddDivider`), **Export 3D Interactive Viewer (HTML)**, and **Toggle Outline New Parts / Wordless Mode**: Good candidates for optional unbound slots or a future command palette.

---

## Keyboard Shortcuts Screen UX (`#shortcutsModal`)

- **Entry Point**: Always visible in `#menuScrollBody` inside the main slide-out menu drawer (`#menuShortcutsSection` → `#menuShortcutsBtn`), matching Page Setup, Parts List Setup, and Bricks Library. Clicking **Customize Shortcuts** (or pressing `?`) closes the drawer and opens `#shortcutsModal`—a full-height, spacious screen modal with pinned search, grouped category cards showing both action labels and descriptions, and a sticky footer.
- **Summary & Status**: Displays `Defaults` or `<N> custom` in the menu button summary plus a primary-tinted `<N> custom` badge in both the menu section header (`#menuShortcutsCustomBadge`) and the modal header (`#shortcutsModalCustomBadge`) when overrides exist.
- **Filtering**: Live search input (`#shortcutsSearchInput`) matches action labels, descriptions, category names, and platform-formatted keycaps (e.g. `undo`, `camera`, `⌘z`, `ctrl`).
- **Recording**: Clicking any keycap toggles recording mode (`Press keys…`) with an inline action strip offering **Clear** (sets override to `null` / `Unbound`), **Default** (restores default), and **Cancel**.
  - Protected keys (`Escape`, `Tab`, `Shift+Tab`, bare `Enter`) are rejected with an inline explanation rather than silently breaking focus navigation or dismiss behavior.
  - Focusing the search input, pressing `Esc`, or closing the modal cleanly exits recording mode (while `Esc` during active recording cancels recording first without closing the modal).
- **Conflict Resolution**: Pressing a combo already assigned to another action opens `#shortcutsConflictBanner` in the pinned header area naming the conflicting action with **Assign & Unbind** and **Cancel** buttons, preventing accidental silent unbinding while making reassignment a single click. Single-action reset (`↺`) also guarantees uniqueness by cleanly unbinding any conflicting custom binding and notifying via toast.
- **Reset All**: `#btnResetAllShortcuts` in the modal footer is enabled whenever ≥ 1 custom/unbound override exists and is paired with a live `.destructive-notice` (`#shortcutsResetAllNotice`) showing the exact count of custom shortcuts that will be restored.
- **Persistence**: Sparse overrides (`Record<ShortcutActionId, string | null>`) persist in `localStorage` under `biw_keyboard_shortcuts_v1`, sanitized and deduplicated on load (`sanitizeShortcutOverrides`) and removed cleanly when all bindings return to defaults.
