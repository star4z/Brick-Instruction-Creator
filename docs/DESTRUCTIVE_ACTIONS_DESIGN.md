# Destructive & Override-Impact Action UX Design

> **Status**: Implemented across editor cards, modals, menu drawer, Style popover, and Bricks Library. Pure decision engine lives in [`src/engine/destructiveActions.ts`](../src/engine/destructiveActions.ts) with unit tests in [`src/engine/__tests__/destructiveActions.test.ts`](../src/engine/__tests__/destructiveActions.test.ts).

## Problem Statement

Brick Instruction Works supports rich per-part, per-step, per-range, cover/extra-page, and theme-level overrides across multiple editing surfaces, alongside permanent browser-storage and workspace actions. Different classes of actions call for different levels of friction:

- **Undoable actions that only change what is visible on the current screen** should never interrupt or clutter the UI — the user sees the result immediately and can press Undo anytime.
- **Undoable actions that overwrite, clear, or shift edits made *elsewhere*** (other steps, other pages, or other editor tabs) should show a calm, conditional **inline amber notice** right beside the triggering control — hidden whenever untouched.
- **Permanent (non-undoable) actions** should not litter sidebars, popovers, or modals with persistent red banners; instead, clicking the action opens a focused **"Are you sure?" confirmation dialog (`#confirmActionModal`)** that names exactly what will be permanently deleted or discarded before executing.

## Three-Tier Decision Matrix

| Scope \ Reversibility | **Undoable (`pushUndo()`)** | **Permanent / Non-Undoable** |
| :--- | :--- | :--- |
| **Visible on current screen only** | **Silent** — no inline warning, no dialog (Cover/Step `Reset Camera`, Parts `Reset`, Divider `Delete Page`, Overview `Clear All` Page Breaks, Step Range Group `Delete`) | **"Are you sure?" dialog** (`#confirmActionModal`) — e.g. `Delete Custom Theme`, Bricks Library `Remove Saved Part`, `Clear Entire Saved Library`, `Close Model` |
| **Affects edits / overrides elsewhere** | **Conditional inline amber notice** (`.destructive-notice[data-tone="warning"]`) — hidden when no existing overrides are affected | **"Are you sure?" dialog** (`#confirmActionModal`) — names exact unsaved edits, referencing groups, or open-model parts affected |

## Coverage Matrix

### Tier 1: Undoable On-Screen Actions (Zero Warnings)

Cover/Build Complete `Reset Camera`, Step Mode Camera `Reset`, Parts Mode `Reset` (and visible current-step part nudges/callouts), Divider Page `Delete Page`, Pages & Steps Overview `Clear All` Page Breaks, and Step Range Group `Delete` stay completely warning-free.

### Tier 2: Conditional Inline Amber Notices (Undoable Off-Screen / Cross-Surface Impacts)

| Surface & Control | Dynamic Trigger / Impact Communicated |
| :--- | :--- |
| **Apply Camera to Steps** (`#applyAngleModal` → `#btnConfirmApplyAngle`) | Shown only when 1+ *other* steps inside `[lo..hi]` already have custom camera angles (or custom zoom/framing when **Also copy Zoom & Framing** is checked). Updates live and tags conflicting rows in `#angleStepList` with **`Will overwrite`**. |
| **Page Setup → Wordless Instructions** (`#toggleWordlessMode`) | Hidden on untouched defaults. Shown only when the user customized extra-page text toggles away from the current mode's defaults or edited custom Cover / Build Complete titles that toggling Wordless mode will reset or hide. |
| **Step Generation Modal (Post-Import)** (`#importModal` → `#impBtnAuto` & `#impBtnKeep`) | Hidden on untouched manuals and on new imports. Shown post-import only when live step/layout overrides (split steps, camera overrides, part nudges, Parts Box sizes, page breaks, callout layouts, step notes, Step Range Groups, divider pages) or custom Wordless text overrides will be cleared or shifted. |
| **Step Mode → Layout → Merge into Step N-1** (`#stepMergePrevBtn`) | Hidden on unedited steps. Shown only when the step being merged has overrides or notes (custom camera, part nudges, Parts Box size, page break, callout layout, notes, or subassembly callout) that merging silently clears. |
| **Parts Mode → Move to Step…** (`#actMoveStep`) | Hidden for subset selections or steps without off-tab overrides. Shown only when **all** parts in the step are selected *and* the step has overrides made outside Parts mode (camera, Parts Box size, page break, callout layout, notes, or subassembly callout) that removing the emptied step would clear. |
| **Page Setup → Step Range Group Editor** (`#btnGrpSave` → `#grpOverlapNotice`) | Hidden when ranges do not collide. Shown live when `[lo..hi]` overlaps another existing Step Range Group, specifying whether saving overrides an earlier group or is shadowed by a later group. |

### Tier 3: "Are You Sure?" Confirmation Dialog (`#confirmActionModal`, Permanent Actions)

No persistent inline red banners appear in the UI. Instead, invoking any permanent action opens the accessible `role="alertdialog"` modal (`#confirmActionModal`, `z-[65]`, `Cancel` focused by default, dismissible with `Escape` or backdrop click, focus restored on close):

| Action & Trigger | Pure Spec Builder | What the Confirmation Dialog Shows |
| :--- | :--- | :--- |
| **Menu Drawer → Close Model** (`#menuCloseModelBtn`) | `getCloseModelConfirmDialog()` | Always confirms closing (`Close "<Title>"?`). Enumerates active unsaved edits or session Undo history when present with a `.biw` export tip (`Close Without Saving`), or notes clearing the browser session when clean (`Close Model`). |
| **Replace Open Model** (`handleIncomingModelFile`, `handleIncomingProjectFile`) | `getReplaceModelConfirmDialog()` | Skips confirmation when no model is open or the open manual is untouched. When unsaved edits or Undo history exist, asks `Replace "<Open Title>"?` right before parsing/clearing caches — naming the incoming file, listing affected edits, and noting `.biw` export (`Replace Manual`). |
| **Style Popover → Delete Custom Theme** (`#btnDeleteTheme`) | `getDeleteThemeConfirmDialog()` | Replaces native `window.confirm()`. Asks `Delete "<Theme>"?`, states browser-storage deletion cannot be undone, and lists any **Step Range Groups** whose theme override will also be cleared (`Delete Theme`). |
| **Bricks Library → Remove Saved Part** (`#libPreviewRemoveBtn`) | `getLibraryRemovePartConfirmDialog()` | Asks `Remove <id>.dat from Saved Library?`, states IndexedDB deletion cannot be undone, and calls out if the currently open model renders that part from Saved Library (`Remove Part`). |
| **Bricks Library → Clear Entire Saved Library** (`#libClearSavedBtn`) | `getLibraryClearSavedConfirmDialog()` | Asks `Clear Entire Saved Library?` with exact saved file & texture counts, notes embedded `.io` / built-in shapes remain intact, and calls out any open-model parts that will fall back to simplified shapes (`Clear Saved Library`). |
| **Step Generation (Post-Import) → Changed Step Before Page Break** (`#importModal` → `#impBtnAuto`) | `getStepRegenerationPageBreakDialog()` | Shown conditionally via `openChoiceActionDialog()` only when rerunning step generation changes the parts in the step immediately before one or more active page breaks (detected by `analyzePageBreakChangesOnRegeneration()`). Offers **Proceed & Remove Page Breaks**, **Proceed & Keep Page Breaks** (remapping by step number when internal IDs change via `remapPageBreaksAfterRegeneration()`), or **Cancel** (leaving the manual and `#importModal` untouched). |

## Architecture

- **Pure Engine Modules**: [`src/engine/destructiveActions.ts`](../src/engine/destructiveActions.ts) & [`src/engine/pageBreaks.ts`](../src/engine/pageBreaks.ts)
  - `summarizeStepOverrides()` — per-step override & insert classifier (including `nonPartLabels` for off-tab overrides).
  - `summarizeManualEdits()` — manual-wide live edit counter (separates `stepItems` affected by step regeneration from full `items` affected by close/replace; tracks `hasCustomCoverText` and `hasCustomCompleteText`; ignores stale keys from deleted steps).
  - `analyzePageBreakChangesOnRegeneration()` & `remapPageBreaksAfterRegeneration()` — compares part sets in the step immediately before each active page break between the current and regenerated manuals, and preserves/remaps page breaks when kept.
  - 6 inline notice builders (`DestructiveNotice | null`) for Tier 2 undoable off-screen impacts.
  - 5 confirmation dialog builders (`PermanentActionConfirmSpec | null`) for Tier 3 permanent actions, plus `getStepRegenerationPageBreakDialog()` (`ChoiceActionDialogSpec | null`) for 3-way page break conflict resolution on step regeneration.
- **Inline Notice Styling**: `.destructive-notice` and `.destructive-notice-compact` in [`src/index.css`](../src/index.css) with `:not(.hidden)` display guards so Tailwind's `.hidden` utility always wins.
- **Confirmation & Choice Modal**: `#confirmActionModal` (with optional `#confirmActionSecondary`) in [`index.html`](../index.html), driven by `openConfirmActionDialog()`, `openChoiceActionDialog()`, `closeConfirmActionDialog()`, and `isConfirmActionDialogOpen()` in [`src/studioRuntime.ts`](../src/studioRuntime.ts).
- **Tests**: [`src/engine/__tests__/destructiveActions.test.ts`](../src/engine/__tests__/destructiveActions.test.ts), [`src/engine/__tests__/pageBreaks.test.ts`](../src/engine/__tests__/pageBreaks.test.ts), and full 3-tier wiring/omission checks in [`src/__tests__/studioRuntimeSafety.test.ts`](../src/__tests__/studioRuntimeSafety.test.ts).
