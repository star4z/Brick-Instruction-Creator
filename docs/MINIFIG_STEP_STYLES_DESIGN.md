# Official LEGO Minifigure Step Styles Design

## Overview

Official LEGO instruction manuals use two distinct visual conventions for minifigure construction steps depending on the set's target age and layout style:

1. **Exploded Stack Callout (`exploded`)** — Compact adult / standard set style:
   - A slender **white vertical callout box** (`#ffffff`, crisp dark border) on the left displays the minifigure's vertical body layers exploded from bottom to top (`legs` → `torso` → optional `cape` / `neckwear` → `head` → optional `headgear`) with **crimson-red downward assembly arrows** (two parallel arrows from the torso waist into the left and right hip studs; single centered arrows for upper layers).
   - A crisp **horizontal connector arrow** points from the lower-right side of the vertical box to the **completed standing minifigure** on the right.
   - Any **handheld accessories** (e.g., letter tile, mug, lightsaber) appear in crisp **white bordered accessory callout boxes** positioned above the minifigure's hand(s), with a white-haloed downward pointer arrow landing directly on the accessory in hand (and internal exploded red arrow(s) if the accessory is multi-part).

2. **Sequential Step-by-Step (`sequential`)** — Detailed / 4+ booklet style:
   - Breaks the minifigure into **numbered local sub-steps (`1, 2, 3, ...`)** laid out horizontally across pages (3 across per page for 5–6+ stage figures, or up to 4 across on landscape pages for 4-stage figures).
   - **Stage 1**: Standing legs with floating torso and **two parallel cyan-blue downward arrows** into the hip studs.
   - **Stage 2 (optional)**: Floating cape / back wearable with cyan-blue downward arrow onto the neck stud.
   - **Stage 3**: Floating head (or stacked collar/neckwear + head with continuous cyan-blue downward arrows).
   - **Stage 4 (optional)**: Floating hair / helmet / headgear with cyan-blue downward arrow onto the head stud.
   - **Multi-part accessory stages**: Assembled minifigure holding the accessory, with a **warm peach/amber rounded pill callout box** (`#fde4a6`, crisp dark border) centered directly above the accessory showing its constituent parts exploded with a cyan-blue arrow and a **black downward pointer arrow** pointing into the minifigure's hand.
   - **Final completion stage**: Fully completed minifigure (including any final single-piece prop) backed by a **radial light-ray starburst** and **three hollow 5-point outline stars**.

3. **Classic PLI (`classic`)** — Preserves the original single-step render with Parts List (PLI) box for users who prefer standard step formatting.

---

## Architecture

### Pure Planning Engine — [`src/engine/minifigSteps.ts`](../src/engine/minifigSteps.ts)
- **`decomposeMinifigParts`**: Buckets canonical standing minifigure parts (normalized by [`src/engine/minifigPose.ts`](../src/engine/minifigPose.ts)) into `legs`, `torso`, `cape`, `neckwear`, `head`, `headgear`, and proximity-clustered `accessories` (grouping touching props within `14 LDU` so multi-part accessories like lightsaber hilt + blade stay paired). Keeps both fused `.io` assemblies and un-fused flat `.ldr` limbs glued to their canonical `legs` and `torso` units.
- **`buildMinifigExplodedPlan`**: Computes non-overlapping vertical `stackOffsets` (guaranteeing at least `24–28 LDU` clear air gaps between adjacent layers regardless of cape drop or helmet skirt) and exact 3D world-space `stackArrows`.
- **`buildMinifigSequentialPlan`**: Emits numbered `MinifigSequentialStage[]` stages plus a shared orthographic camera anchor (`sharedCenter` + `sharedHalfH`) so all sub-steps share an identical horizontal foot baseline and physical scale.
- **`paginateMinifigSequentialStages`**: Splits sequential stages into clean horizontal rows (`1–3` on 1 page; `4` as `4` on landscape or `2 + 2` on portrait; `5+` in chunks of `3`, matching 6-stage `3 + 3` booklets).

### High-Resolution WebGL + Canvas2D Compositors — [`src/studioRuntime.ts`](../src/studioRuntime.ts)
- **`WebGLBrickEngine.computeMVP`**: Accepts an optional `fixedCenter` draw option so sequential sub-steps maintain exact baseline alignment across pages.
- **`renderMinifigExplodedDiagram`** & **`renderMinifigSequentialStage`**: Render the WebGL meshes, project exact 3D stud/socket/accessory coordinates through `projectWorldToNdc(pt, mvp)`, and draw razor-sharp 2D vector arrows, rounded callout boxes, and theme-adaptive starburst graphics.
- **WYSIWYG PDF Export Parity**: Both live HTML canvas (`renderAll`) and PDF export (`renderPageToJpegBytes`) invoke the exact same compositors, ensuring pixel-accurate arrows and layout parity on screen and on paper.

---

## User Controls & Persistence

- **Style Popover (`#stylePopover`)**: Segmented **Minifigure Steps** selector (`Exploded` | `Step-by-Step` | `Classic`) directly above **1:1 Minifigure View**.
- **Full-Page Step Editor (`#stepEditModal`, opened via the bottom `Edit` tab)**: Displays clearly labeled descriptive cards for `Exploded`, `Step-by-Step`, and `Classic` (tagged `All minifigure steps`) alongside the **1:1 Actual-Size Minifigure Preview** toggle, keeping `Rotate` and `Arrange` focused strictly on 3D camera orientation and 2D box positioning.
- **Step Numbering**: In `exploded` and `sequential` styles, minifigure chapters use local numbering so the main model build begins cleanly at **Step 1**.
- **Persistence**: `minifigStyle` is saved automatically in IndexedDB session preferences and embedded in `.biw` project exports/imports (defaulting to `'exploded'`).
