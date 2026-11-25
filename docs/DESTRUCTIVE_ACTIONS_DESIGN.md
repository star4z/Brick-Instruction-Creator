# Destructive & Override-Impact Action Notices Design

> **Status**: Implemented across all editor floating cards, modals, menu drawer, Style popover, Pages & Steps overview, and Bricks Library. Pure impact engine lives in [`src/engine/destructiveActions.ts`](../src/engine/destructiveActions.ts) with unit tests in [`src/engine/__tests__/destructiveActions.test.ts`](../src/engine/__tests__/destructiveActions.test.ts).

## Problem Statement

Brick Instruction Works supports rich per-part, per-step, per-range, cover/extra-page, and theme-level overrides across multiple editing surfaces. Previously, when a user edited overrides in one area (for example, setting custom camera angles on specific steps, enabling Cover/Parts List text in Wordless mode, nudging parts, assigning a custom theme to a Step Range Group, or adding step notes and page breaks) and later triggered a broader action elsewhere (such as **Apply Camera to Steps**, toggling **Wordless Instructions**, **Regenerating Steps**, **Merging Steps**, **Deleting a Theme**, **Closing**, or **Replacing the Model**), those controls gave little or no inline indication near the button that existing edits would be overwritten, cleared, or permanently discarded.

## Design Principles

1. **Inline & Adjacent to the Triggering Control**: Notices appear directly above or below the exact button or toggle that affects edits — never hidden behind hover-only tooltips (mobile/touch safe) and never buried in unrelated sections.
2. **Live, State-Aware Impact Detection**: Messages inspect current live manual state (`state.overrides`, `state.stepInserts`, `state.dividerAfter`, `state.layoutGroups`, `coverMeta`, `completeMeta`, `backMeta`, `wordlessMode`, `bomShowTextFields`, `pageNumberFormat`, and Bricks Library storage) and enumerate the exact edits affected.
3. **Zero False Alarms for Conditional Overwriters**: Conditional override-overwriters (like **Apply Camera to Steps**, **Parts Mode Reset**, **Move/Split/Make Submodel**, **Step Range Group overlap**, and **Bricks Library model-reliance**) stay hidden when no existing overrides are affected and appear dynamically the instant an edit or range selection introduces a conflict.
4. **Honest Two-Tier Reversibility Semantics**:
   - **Warning (`data-tone="warning"`, amber `--warning` / `--warning-soft`)**: Overwrites, resets, clears, or deletes edits where **Undo is available** (`pushUndo()` captures the affected state).
   - **Danger (`data-tone="danger"`, crimson `--danger` / `--danger-soft`)**: Permanently removes/replaces data or clears Undo history (**cannot be undone**).

## Complete Coverage Matrix

| Surface & Control | Tone | Dynamic Trigger / Impact Communicated |
| :--- | :--- | :--- |
| **Apply Camera to Steps** (`#applyAngleModal` → `#btnConfirmApplyAngle`) | `warning` | Appears dynamically whenever 1+ *other* steps inside `[lo..hi]` already have custom camera angles (or custom zoom/framing when **Also copy Zoom & Framing** is checked). Updates live on slider drag, preset click, row click, or checkbox toggle, and tags conflicting rows in `#angleStepList` with **`Will overwrite`**. |
| **Page Setup → Wordless Instructions** (`#toggleWordlessMode`) | `warning` | Dynamically lists which extra-page text toggles (**Front Cover title**, **Build Complete text**, **Parts List names & colors**) and **Page Number format** will be reset when toggling Wordless mode on or off. |
| **Step Generation Modal** (`#importModal` → `#impBtnAuto` & `#impBtnKeep`) | `warning` (post-import) / `danger` (new import replacing open model) | Post-import: enumerates live split steps, camera overrides, part nudges, Parts Box sizes, page breaks, callout layouts, step notes, Step Range Groups, divider pages, and Instruction Language resets that regenerating may clear or shift (Undo available). New import while a model is open: warns that generating replaces the active manual and permanently clears unsaved edits & Undo history. |
| **Step Mode → Layout → Merge into Step N-1** (`#stepMergePrevBtn`) | `warning` | Enumerates exact overrides, part nudges, page break, notes, and subassembly callout on the current step that merging deletes (Undo available). |
| **Step Mode → Camera → Reset** (`#btnResetCam`) | `warning` | Lists every camera override cleared at once on that step: angle (`az°`), zoom (`%`), and framing mode (Undo available). |
| **Cover / Build Complete → Camera → Reset Camera** (`#heroResetCam`) | `warning` | Lists custom camera angle and/or zoom cleared on the Cover or Build Complete page (Undo available). |
| **Parts Mode → Reset (`#btnResetSelPos`) & Move/Split/Make Submodel** (`#actNewBefore`, `#actNewAfter`, `#actMoveStep`, `#actMakeSub`) | `warning` | (1) Near `Reset`: appears when selected parts have custom nudge, tilt, or arrow overrides. (2) Below cross-step actions: appears when all parts in the step are selected (`Move to Step…` deletes the step and clears its overrides/notes), when selected parts have custom nudge/tilt offsets (cleared on move/split), or when `Make Submodel` replaces an existing callout on the step. |
| **Pages & Steps Overview → Clear All Page Breaks** (`#btnClearAllPins`) | `warning` | Explains that clicking removes all active manual page breaks across the manual and lets pages reflow (Undo available). |
| **Page Setup → Step Range Group Editor** (`#btnGrpDelete`, `#btnGrpSave`) | `warning` | (1) Near `Delete`: notes reverting `#lo–#hi` to the default grid (and clearing any group theme override). (2) Live range check: warns when `[lo..hi]` overlaps another Step Range Group, specifying whether saving overrides an earlier group or is shadowed by a later group. |
| **Style Popover → Delete Custom Theme** (`#btnDeleteTheme`) | `danger` | Shown for custom themes; warns deletion from browser storage cannot be undone and explicitly names any **Step Range Groups** whose theme override will be cleared. |
| **Divider Page → Delete Page** (`#delDividerBtn`) | `warning` | Notes removing the divider page and clearing any custom divider title/note (Undo available). |
| **Menu Drawer → Close Model** (`#menuCloseModelBtn`) | `danger` | Dynamically enumerates all active unsaved edits across the manual and warns Undo history & browser session are permanently cleared (recommends exporting `.biw` first). |
| **Open / Import Model or Project Modal** (`#openModelModal`) & **Missing Parts Modal** (`#missingPartsModal`) | `danger` | Shown whenever a manual is currently open; enumerates active unsaved edits and warns opening another file replaces the open manual and permanently clears Undo history. |
| **Bricks Library → Remove Part (`#libPreviewRemoveBtn`) & Clear Entire Saved Library (`#libClearSavedBtn`)** | `danger` | Single part: warns of permanent browser storage deletion and calls out when the open model uses that part (falls back to a simplified shape). Clear Saved Library: adds a live warning when the open model currently renders parts from Saved Library. |

## Architecture

- **Pure Engine Module**: [`src/engine/destructiveActions.ts`](../src/engine/destructiveActions.ts)
  - `summarizeStepOverrides()` — per-step override & insert classifier.
  - `summarizeManualEdits()` — manual-wide live edit counter (separates `stepItems` affected by step regeneration from full `items` affected by close/replace; ignores stale keys from deleted steps).
  - Dedicated pure notice builders for every control in the matrix above, returning `DestructiveNotice | null` (`{ tone: 'warning' | 'danger', message, undoable }`).
- **Styling**: `.destructive-notice` and `.destructive-notice-compact` in [`src/index.css`](../src/index.css), bound to `--warning` / `--warning-soft` and `--danger` / `--danger-soft` with `:not(.hidden)` display guards so Tailwind's `.hidden` utility always takes precedence.
- **Runtime Helpers**: `renderDestructiveNoticeHtml()`, `applyDestructiveNoticeToEl()`, and `getCurrentManualEditsSummary()` in [`src/studioRuntime.ts`](../src/studioRuntime.ts).
- **Tests**: [`src/engine/__tests__/destructiveActions.test.ts`](../src/engine/__tests__/destructiveActions.test.ts) and wiring assertions in [`src/__tests__/studioRuntimeSafety.test.ts`](../src/__tests__/studioRuntimeSafety.test.ts).
