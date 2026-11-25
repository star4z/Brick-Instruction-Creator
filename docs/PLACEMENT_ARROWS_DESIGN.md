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
  - Collision-aware offset resolution (`resolveOffsetAlongAxis`) that targets a crisp ~20 LDU visible arrow gap and nudges outward if an obstacle lies in the path.
  - Non-clipping 3D arrow segment generator (`computePlacementArrowSegments`): emits **1 centered arrow** for compact pieces and **2 parallel end-aligned arrows** for elongated pieces (`span >= 60` LDU perpendicular to the offset axis and aspect ratio `>= 2.2`).
  - Clutter caps (`MAX_FIRST_STEP_OFFSETS = 6`, `MAX_SUBSEQUENT_STEP_OFFSETS = 4`) so dense steps stay readable.
- **Step generation integration**: [`src/studioRuntime.ts`](../src/studioRuntime.ts)
  - `assignAutoPlacementOffsets(chapters)` runs automatically at the end of `optimizeManualStepCameras(chapters)` so every build sequence (main sections, bags, join sequences, and standalone submodels) uses each step's final camera angle.
  - Stored on `step.autoPartOffsets`, cleanly separated from structural `step.defaultPartOffsets` (e.g., join slide/rod/cap snaps) and user manual `state.overrides[step.id].partOffsets`.
  - Combined via `getBaseDefaultPartOffsets(step)` and `getEffectivePartOffsets(step, ov)` across step framing, live rendering, Parts mode editing/reset/nudging, overview thumbnails, PDF export, and Interactive 3D HTML export.
- **Theme & Rendering Style defaults**: [`src/themes/customThemes.ts`](../src/themes/customThemes.ts) & [`index.html`](../index.html)
  - `highlightNew` ("Outline New Parts") defaults to `false` across all built-in themes and remains available as an opt-in theme toggle.
  - `autoPlacementArrows` ("Placement Arrows & Offsets") defaults to `true` with `arrowColor` defaulting to `#dc2626` (official LEGO crimson red), both editable in the Style dialog and persisted on themes.
- **Interactive 3D HTML Export**: [`src/export/interactiveHtmlExporter.ts`](../src/export/interactiveHtmlExporter.ts)
  - Step scenes carry precomputed 3D arrow segments (`arrows`) and `arrowColor`, rendered directly in WebGL alongside the offset parts.
