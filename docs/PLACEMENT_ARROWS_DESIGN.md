# LEGO-Style Placement Arrows & Offsets Design

## Overview

Official LEGO instruction manuals do **not** outline or highlight every newly added piece on every step. Instead, they keep the model clean and readable by offsetting newly added pieces along their physical insertion axis with crisp crimson-red placement arrow(s) whenever:

1. **First step of a build sequence** (2+ parts): keeps the physical base piece(s) grounded and offsets the attached piece(s) along their insertion axes so the builder immediately sees how the initial pieces connect.
2. **Subsequent steps where an added piece could be hard to notice**:
   - **Lateral / horizontal insertion** — pieces attaching to a side face (`±X`/`±Z`) without vertical support underneath (e.g., Technic pins, axles, beams, side brackets, SNOT bricks).
   - **Partial camera occlusion** — pieces tucked behind or inside existing geometry from the step's actual orthographic camera view `(az, el)`.
   - **Color camouflage** — slender or modest pieces placed directly against touching existing pieces of the same or perceptually near-identical color (redmean perceptual RGB distance `< 42`).
   - **Small relative size** — tiny/small details added onto a much larger existing assembly.

Large, contrasting, unobstructed, top-placed bricks on subsequent steps remain seated cleanly with no arrows and no highlight clutter.

## Architecture

- **Core engine**: [`src/engine/placementArrows.ts`](../src/engine/placementArrows.ts)
  - Pure, domain-neutral geometric and perceptual analysis (`computeAutoPlacementOffsetsForSequence`).
  - Distinguishes **vertical through-hole & coaxial sleeve insertions** (e.g., vertical axles/pins passing through horizontal beam holes, or bushes/collars sliding onto vertical rods) from **lateral horizontal insertions** (`±X`/`±Z`) so vertical through-hole pins are never offset sideways through a solid beam wall.
  - Collision-aware offset resolution (`resolveOffsetAlongAxis`) that targets a crisp ~20 LDU visible arrow gap, enforces a minimum `16` LDU clear air gap past any coaxial corridor obstacle tip (e.g., an axle protruding through a bush) with `arrowTo` at the entry tip, anchors arrows onto the actual attaching stud/contact overlap (`arrowBox`), and raises vertical lifts via exact orthographic 2D ray-exit sightline clearance (`tFront * tan(|el|) + 20`) so wide overhanging plates never block the camera's view of their attaching studs or arrows.
  - Non-clipping 3D arrow segment generator (`computePlacementArrowSegments`): emits **1 centered arrow** for compact pieces and **2 parallel end-aligned arrows** for elongated pieces (`span >= 60` LDU perpendicular to the offset axis and aspect ratio `>= 2.2`).
  - Clutter caps (`MAX_FIRST_STEP_OFFSETS = 6`, `MAX_SUBSEQUENT_STEP_OFFSETS = 4`) so dense steps stay readable.
- **Step 1 connection-seam camera orientation**: [`src/engine/stepCamera.ts`](../src/engine/stepCamera.ts)
  - `computeStep1ConnectionFacingCost` scores top views on Step 1 when an upper piece rests on and overhangs a lower piece, preferring a horizontal viewpoint where the lower base sits in front of the upper piece so the attaching studs and connection seam face directly toward the camera (rotating 180° horizontally when the default corner would hide the seam behind the upper overhang).
- **Step generation integration**: [`src/studioRuntime.ts`](../src/studioRuntime.ts)
  - `assignAutoPlacementOffsets(chapters)` runs automatically at the end of `optimizeManualStepCameras(chapters)` so every build sequence (main sections, bags, join sequences, and standalone submodels) uses each step's final camera angle.
  - Stored on `step.autoPartOffsets`, cleanly separated from structural `step.defaultPartOffsets` (e.g., join slide/rod/cap snaps) and user manual `state.overrides[step.id].partOffsets`.
  - Combined via `getBaseDefaultPartOffsets(step)` and `getEffectivePartOffsets(step, ov)` across step framing, live rendering, Parts mode editing/reset/nudging, overview thumbnails, PDF export, and Interactive 3D HTML export.
- **Theme & Rendering Style defaults**: [`src/themes/customThemes.ts`](../src/themes/customThemes.ts) & [`index.html`](../index.html)
  - `highlightNew` ("Outline New Parts") defaults to `false` across all built-in themes and remains available as an opt-in theme toggle.
  - `autoPlacementArrows` ("Placement Arrows & Offsets") defaults to `true` with `arrowColor` defaulting to `#dc2626` (official LEGO crimson red), both editable in the Style dialog and persisted on themes.
- **Interactive 3D HTML Export**: [`src/export/interactiveHtmlExporter.ts`](../src/export/interactiveHtmlExporter.ts)
  - Step scenes carry precomputed 3D arrow segments (`arrows`) and `arrowColor`, rendered directly in WebGL alongside the offset parts.
