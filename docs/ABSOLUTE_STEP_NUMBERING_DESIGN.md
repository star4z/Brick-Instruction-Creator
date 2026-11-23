# Absolute Step Numbering Design

## Problem

Printed step numbers (`step.num`) restart at **1** for every submodel chapter (and for
non-classic minifigure chapters). Step ranges — the **Apply Camera Angle to Steps**
dialog, **Step Range Groups**, the **Pages & Steps Overview** range selector, the
"move pieces to step" prompt and diagnostics lookups — all compared `step.num`, so a
range like "Steps 1–5" silently matched Step 1–5 of *every* submodel (e.g. picking
Minifigures 1–5 also changed Front Half 1–5, reporting "37 steps").

## Model

Every step now carries two numbers, both recomputed in
`renumberContinuousSteps()` (called from `rebuildPages()`):

| Field | Meaning | Unique? | Used for |
|---|---|---|---|
| `num` | Printed/display step number. Restarts per submodel & non-classic minifig chapter. Main-build chapters share one continuous counter. | No | Page canvas, PDF/HTML export, page labels |
| `absNum` | Absolute step number, 1..N across **every** chapter in manual order. | Yes | All ranges, lookups, selection |
| `isMainNumbered` | `true` when `num` came from the continuous main counter (used only for legacy migration). | – | Migration |

Pure helpers live in [`src/engine/stepNumbering.ts`](../src/engine/stepNumbering.ts):
`assignAbsoluteStepNumbers`, `getAbsStepNum`, `formatDualStepLabel`
(`Step 1 · #9`), `formatAbsRange` (`#4–#9`) and `migrateLegacyLayoutGroups`.

## Where ranges use `absNum`

- `applyCameraAngleToStepRange()` (`stepToolbar.ts`) filters by `absNum` (falls back to `num` if missing).
- Apply Camera Angle dialog: slider bounds, presets (This Step Onward / This Section / All Steps), row taps and the count badge all use `absNum`.
- `findLayoutGroupForStep()` is called with `getAbsStepNum(step)` during pagination.
- Step Range Group editor (`From Step #` / `To Step #`), "Use Current Page", and Overview "Select Range → Group".
- "Move selected pieces to step" prompt asks for an absolute `#`.
- Diagnostics aggregate and look up first-seen steps by `absNum`.

## UI: showing both numbers

- **Apply Camera Angle dialog**: each row shows `Step N` plus a `#abs` chip; chapter headers
  (`FRONT HALF · #9–#16`) separate submodels; the From/To chips read `Step 1 · #9`.
- **Overview**: every step row shows a `#abs` chip next to the printed title.
- **Step Range Groups**: badge shows `#lo–#hi`; the card subtitle and an editor hint
  (`#grpRangeHint`) map the range back to chapter + printed steps, e.g.
  `#9–#12 = Front Half Steps 1–4`.
- **Edit Step & Page** subtitle appends `· #abs`; diagnostics jump buttons show `Step N · #abs` when they differ.

Printed manual output (canvas, PDF, HTML export) is unchanged — only `num` is printed.

## Persistence & migration

`StepLayoutGroup` gained `stepBasis?: 'absolute' | 'legacy'`. `normalizeLayoutGroups()`
marks any saved group without `stepBasis: 'absolute'` as `'legacy'`. On the next
`renumberContinuousSteps()`, legacy groups are converted: start → first main-numbered step
with `num ≥ start`, end → last main-numbered step with `num ≤ end` (the old ranges effectively
targeted the continuous main numbering). New groups are saved with `stepBasis: 'absolute'`.

Camera overrides are stored per step id, so previously applied angles need no migration.
