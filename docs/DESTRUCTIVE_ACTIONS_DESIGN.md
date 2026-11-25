# Destructive & Override-Impact Action Notices Design

> **Status**: Implemented across modals, menu drawer, Style popover, Step/Parts cards, and Bricks Library. Pure impact engine lives in [`src/engine/destructiveActions.ts`](../src/engine/destructiveActions.ts) with unit tests in [`src/engine/__tests__/destructiveActions.test.ts`](../src/engine/__tests__/destructiveActions.test.ts).

## Problem Statement

Brick Instruction Works supports rich per-part, per-step, per-range, cover/extra-page, and theme-level overrides across multiple editing surfaces. When a user edits overrides in one place (for example, setting custom camera angles on specific steps, customizing Cover/Parts List text toggles, nudging parts, assigning a custom theme to a Step Range Group, or adding step notes and page breaks) and later triggers a broader action elsewhere (such as **Apply Camera to Steps**, toggling **Wordless Instructions**, **Regenerating Steps**, **Merging Steps**, or saving an overlapping **Step Range Group**), or triggers a **permanent non-undoable action** (**Delete Custom Theme**, **Remove Saved Part**, **Clear Saved Library**, or **Closing / Replacing** a manual with unsaved edits), those controls should show a calm inline notice directly beside the triggering button.

At the same time, **undoable actions that only change things visible on the current screen** (such as resetting the active step or cover camera, resetting selected part nudges, deleting a divider page currently being viewed, deleting the currently edited Step Range Group, or clearing page breaks inside Pages & Steps Overview) must stay completely quiet — the user sees the result immediately and can press Undo at any time.

## Design Principles

1. **No Warnings for Undoable On-Screen Actions**: Actions that are undoable (`pushUndo()` captures the prior state) and only affect what is directly visible on the current screen never display warning banners.
2. **Off-Screen / Cross-Surface Undoable Impacts Are Strictly Conditional**: Undoable actions that overwrite, clear, or shift edits made *elsewhere* (other steps, other pages, or other editor tabs) stay hidden (`null`) when untouched and appear dynamically only when real user overrides are affected.
3. **Permanent (Non-Undoable) Actions Always Warn Honestly**: Actions that permanently delete browser-stored data or discard unsaved work & Undo history (`undoable: false`) show a crimson `danger` notice stating that the action cannot be undone.
4. **Inline & Adjacent to the Triggering Control**: Notices appear directly above or below the exact button or toggle — never hidden behind hover-only tooltips (mobile/touch safe).
5. **Two-Tier Reversibility Semantics**:
   - **Warning (`data-tone="warning"`, amber `--warning` / `--warning-soft`)**: Overwrites, clears, or shifts edits made elsewhere where **Undo is available**.
   - **Danger (`data-tone="danger"`, crimson `--danger` / `--danger-soft`)**: Permanently deletes stored data or discards unsaved edits & Undo history (**cannot be undone**).

## Decision Matrix

| Scope \ Reversibility | **Undoable (`pushUndo()`)** | **Non-Undoable / Permanent** |
| :--- | :--- | :--- |
| **Visible on current screen only** | **No warning** (e.g., Cover/Step `Reset Camera`, Parts `Reset`, Divider `Delete Page`, Overview `Clear All` Page Breaks, Group `Delete`) | **Danger notice** (e.g., `Delete Custom Theme`, Bricks Library `Remove Saved Part`) |
| **Affects edits / overrides elsewhere** | **Conditional warning** — shown only when existing overrides are affected | **Danger notice** — shown when unsaved edits, Undo history, or open-model parts are affected |

## Coverage Matrix

### Category 1: Undoable Off-Screen / Cross-Surface Override Impacts (Strictly Conditional)

| Surface & Control | Tone | Dynamic Trigger / Impact Communicated |
| :--- | :--- | :--- |
| **Apply Camera to Steps** (`#applyAngleModal` → `#btnConfirmApplyAngle`) | `warning` | Shown only when 1+ *other* steps inside `[lo..hi]` already have custom camera angles (or custom zoom/framing when **Also copy Zoom & Framing** is checked). Updates live and tags conflicting rows in `#angleStepList` with **`Will overwrite`**. |
| **Page Setup → Wordless Instructions** (`#toggleWordlessMode`) | `warning` | Hidden on untouched defaults. Shown only when the user customized extra-page text toggles away from the current mode's defaults or edited custom Cover / Build Complete titles that toggling Wordless mode will reset or hide. |
| **Step Generation Modal (Post-Import)** (`#importModal` → `#impBtnAuto` & `#impBtnKeep`) | `warning` | Hidden on untouched manuals. Shown only when live step/layout overrides (split steps, camera overrides, part nudges, Parts Box sizes, page breaks, callout layouts, step notes, Step Range Groups, divider pages) or custom Wordless text overrides will be cleared or shifted. |
| **Step Mode → Layout → Merge into Step N-1** (`#stepMergePrevBtn`) | `warning` | Hidden on unedited steps. Shown only when the step being merged has overrides or notes (custom camera, part nudges, Parts Box size, page break, callout layout, notes, or subassembly callout) that merging silently clears. |
| **Parts Mode → Move to Step…** (`#actMoveStep`) | `warning` | Hidden for subset selections or steps without off-tab overrides. Shown only when **all** parts in the step are selected *and* the step has overrides made outside Parts mode (camera, Parts Box size, page break, callout layout, notes, or subassembly callout) that removing the emptied step would clear. |
| **Page Setup → Step Range Group Editor** (`#btnGrpSave` → `#grpOverlapNotice`) | `warning` | Hidden when ranges do not collide. Shown live when `[lo..hi]` overlaps another existing Step Range Group, specifying whether saving overrides an earlier group or is shadowed by a later group. |

### Category 2: Non-Undoable / Permanent Actions (`undoable: false`)

| Surface & Control | Tone | Dynamic Trigger / Impact Communicated |
| :--- | :--- | :--- |
| **Style Popover → Delete Custom Theme** (`#btnDeleteTheme`) | `danger` | Hidden for built-in themes (button disabled). For custom themes, warns deletion from browser storage cannot be undone and explicitly names any **Step Range Groups** whose theme override will also be cleared. |
| **Bricks Library → Remove Saved Part** (`#libPreviewRemoveBtn`) | `danger` | Shown for saved library parts (immediately deleted from browser IndexedDB with no Undo); calls out when the currently open model renders that part from Saved Library and will fall back to a simplified shape. |
| **Bricks Library → Clear Entire Saved Library** (`#libClearSavedBtn`) | `danger` | Supplements the danger section description & two-step confirmation with a live notice whenever the open model currently renders parts from Saved Library. |
| **Menu Drawer → Close Model** (`#menuCloseModelBtn`) | `danger` | Hidden on untouched manuals with no edits or Undo history. Shown when unsaved edits or session Undo history exist; enumerates active edits and warns Undo history is permanently cleared (recommends exporting `.biw` first). |
| **Open / Import Model Modal** (`#openModelModal`), **Missing Parts Modal** (`#missingPartsModal`), & **Step Generation (New Import)** | `danger` | Hidden when no model is open or when the open manual is completely untouched. Shown when replacing an open manual with unsaved edits or Undo history; enumerates edits and warns replacing cannot be undone. |

## Architecture

- **Pure Engine Module**: [`src/engine/destructiveActions.ts`](../src/engine/destructiveActions.ts)
  - `summarizeStepOverrides()` — per-step override & insert classifier (including `nonPartLabels` for off-tab overrides).
  - `summarizeManualEdits()` — manual-wide live edit counter (separates `stepItems` affected by step regeneration from full `items` affected by close/replace; tracks `hasCustomCoverText` and `hasCustomCompleteText`; ignores stale keys from deleted steps).
  - 11 pure notice builders returning `DestructiveNotice | null` (`{ tone: 'warning' | 'danger', message, undoable }`).
- **Styling**: `.destructive-notice` and `.destructive-notice-compact` in [`src/index.css`](../src/index.css), bound to `--warning` / `--warning-soft` and `--danger` / `--danger-soft` with `:not(.hidden)` display guards so Tailwind's `.hidden` utility always takes precedence.
- **Runtime Helpers**: `renderDestructiveNoticeHtml()`, `applyDestructiveNoticeToEl()`, and `getCurrentManualEditsSummary()` in [`src/studioRuntime.ts`](../src/studioRuntime.ts).
- **Tests**: [`src/engine/__tests__/destructiveActions.test.ts`](../src/engine/__tests__/destructiveActions.test.ts) and wiring/omission assertions in [`src/__tests__/studioRuntimeSafety.test.ts`](../src/__tests__/studioRuntimeSafety.test.ts).
