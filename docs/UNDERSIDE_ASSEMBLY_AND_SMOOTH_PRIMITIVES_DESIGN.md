# Underside Assembly, Pre-Built Technic Mechanisms & Smooth Circular Primitives Design

## Overview

This document specifies three general, model-agnostic improvements to the 3D LDraw mesh compiler and physical step generator:

1. **High-Resolution Circular LDraw Primitive Substitution (`48/` quality)** so circular tiles, plates, bricks, rings, dishes, wheels, and Technic collars render smoothly round rather than 16-sided polygons.
2. **Primary Structural Deck & Upside-Down Underside Pocket Assembly** so models with localized hanging underside structures build their rigid primary deck first, flip upside down (`side: 'bottom'`, `cue: 'flip_vertical'`), attach underside structures in inverted-gravity order, and flip right-side up.
3. **Pre-Built Technic Axle/Bar Mechanisms** so multi-part Technic axle assemblies passing into deck holes or loose round-hole bearings are built first as standalone sub-assemblies and inserted while upside down before surrounding/capping bricks and retaining collars lock them in place.

All rules are derived strictly from **geometry and LEGO mechanical physics** with zero model-specific or theme-specific heuristics.

---

## 1. High-Resolution Circular LDraw Primitives (`src/engine/datCompiler.ts`)

### Problem
Standard LDraw circular primitives (`4-4cyli`, `1-8cyli`, `4-4ring*`, `1-4edge`, `4-4disc`, `4-4ndis`, etc.) are authored at 16 segments (22.5° per chord). On larger circular parts such as a 2×2 round tile with hole (`15535.dat`, radius 20 LDU), 16 segments produce visibly polygonal 7.8 LDU straight edges along both the shaded outer wall and the Part Outlines rim.

### Solution
- In `compileDatEntry` (`src/engine/datCompiler.ts`), `emitSynthPrim` upgrades standard 16-segment circular primitives (`circleRes === 16`) to **48 segments** (matching official LDraw `48/` hi-res primitives).
- Explicit low-resolution `8/` primitives remain at 8 segments.
- Because `48 = 3 × 16`, every 16-gon vertex (`k × 22.5°`) is an exact vertex of the 48-gon (`3k × 7.5°`). Partial arcs (`1-16`, `1-8`, `1-4`, `3-8`, `1-2`, `3-4`) therefore align vertex-for-vertex with any adjacent hand-authored 16-gon geometry (such as printed minifigure faces or underside notches) with zero seam cracks.
- Synthesized cylinders (`cyli`, `cylo`, `cylc`) also emit vertical silhouette conditional lines (`condEdges`), giving curved outer walls crisp silhouettes under Part Outlines.

---

## 2. Primary Structural Deck & Upside-Down Underside Assembly (`src/engine/undersideAssembly.ts`)

### Problem
Pure lowest-Y-first ordering starts on any tiny hanging appendage at the bottom of a model (such as a small underside nose plate, landing pod, or recessed bumper housing), builds a wobbly localized stack, and may attempt to balance a vertical Technic axle inside a thin smooth round-hole tile (`15535`) before the upper structural floor exists.

### General Physical Algorithm
Implemented in `analyzeUndersideAssembly`, `buildInvertedVerticalPrereqMap`, and `collectCapInnerAttachments` (`src/engine/undersideAssembly.ts`):

1. **Primary Structural Deck Detection** (applies to sections/models with `>= 24` parts, long span `>= 160 LDU`, height `>= 40 LDU`):
   - Scans quantized horizontal structural layers above `minY` to find the lowest connected horizontal deck band whose span covers `>= 55%` of the section's longest horizontal axis.
   - Verifies that all parts strictly below that deck break into **isolated localized underside pockets** (no single connected component below the deck spans `>= 50%` of the model's long axis — ensuring buildings/castles resting on a ground baseplate always stay normal bottom-up).
   - Verifies at least one substantial pocket (`>= 4` parts) attaches directly to the deck from below.

2. **Pre-Built Technic Axle/Bar Mechanism Extraction**:
   - Inside each suspended underside pocket, identifies connected clusters of non-stud-host Technic mechanism parts (Technic axles, liftarms/beams, bushes, axle connectors, towball axles) with `>= 2` parts containing at least one axle and one non-axle mechanism part, where the cluster has a vertical axle or touches the deck or a loose round-hole bearing (`isLooseHoleBearing`).
   - Emits each mechanism as a standalone pre-built submodel chapter right before its parent section chapter so the builder assembles the Technic pole/bar unit first.

3. **Three-Phase Section Build Order** (wired in `buildLocalSubmodelSteps` in `src/studioRuntime.ts`):
   - **Phase 1 (Upright, `side: 'top'`)**: Build the Primary Structural Deck to establish a rigid, flat chassis.
   - **Phase 2 (Upside Down, `side: 'bottom'`, `cue: 'flip_vertical'`)**:
     - Lock camera side via `forceSide: 'bottom'` in `optimizeStudioStepCameraSequence` (`src/engine/stepCamera.ts`).
     - For each suspended underside pocket:
       1. Insert any pre-built **Technic mechanism** into the underside deck holes first (single attachment step with submodel callout).
       2. Stack remaining pocket bricks in **inverted-gravity order** (descending world Y, from highest bricks touching the deck down to the bottom cap plate), obeying `buildInvertedVerticalPrereqMap` so inner parts are never trapped under lower caps.
       3. Co-attach thin inner-face cap tiles/retainers (such as round-hole bearing tiles clutched to a bottom cap plate) via `collectCapInnerAttachments`.
   - **Phase 3 (Upright, `side: 'top'`, `cue: 'flip_vertical'`)**: Flip right-side up and build the remaining upper structure bottom-up.

---

## 3. Generalized Naming (`src/engine/subdivisionAnalyzer.ts`)

- Replaced theme-specific `'Middle Bogie'` / `'Center Joint & Bogie'` labels in `autoNameEndAssembly` and join section naming with general mechanical labels **`Center Wheel Assembly`** and **`Center Joint & Wheels`** so wheeled articulated models of any theme (vehicles, rovers, trailers, trains) receive accurate domain-neutral names.
- Submodel names authored directly inside imported `.io`/`.mpd` files (such as user-named minifigure submodels) continue to be preserved verbatim from the source file.
