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
- Synthesized cylinders (`cyli`, `cylo`, `cylc`) also emit vertical silhouette conditional lines (`condEdges`), giving curved outer walls crisp silhouettes under Part Outlines. Following the official LDraw specification, `cylo` and `cylc` emit rim edges at both `y = 0` and `y = 1`, while `cylc` caps **only** the `y = 0` end (`*-disc.dat`) and leaves `y = 1` open so hollow containers that invert `cylc` (such as bins, mugs, and sockets) remain properly hollow.
- **Geometric Concave-Cavity Ambient Occlusion** (`src/engine/cavityOcclusion.ts`): `compileDatEntry` computes a winding-independent, 3D-grid-accelerated two-sided hemisphere occlusion pass (`min(occ(+n), occ(-n))`) per vertex. Exterior surfaces (brick tops, walls, tiles, plates, rims, handles, flat lids) have at least one open-sky hemisphere and stay strictly at `0` (preserving crisp pure flat colors under `Lighting: None`), while genuinely enclosed concave interiors (hollow bins, mugs, buckets, barrels, open tubes, and pin holes) receive smooth per-vertex interior shading so hollow openings read unmistakably open on step pages, PLI thumbnails, PDF exports, and Interactive 3D HTML exports even without lighting.

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

2. **Pre-Built Technic Mechanisms & Underside Sub-Modules (`UndersideSubassemblySpec`)**:
   - Inside each suspended underside pocket, identifies:
     - **Technic axle/bar mechanisms**: connected clusters of non-stud-host Technic mechanism parts (`>= 2` parts with at least one axle and one non-axle mechanism part, touching the deck or a loose round-hole bearing or having a vertical axle).
     - **Cohesive underside structural sub-modules**: remaining connected structural components inside the pocket with `>= 4` parts that either have multi-layer vertical height (`>= 14` LDU) or contain wheels (`Wheel Assembly` when wheeled, `Underside Module` otherwise). Rather than constructing complex housings or wheeled assemblies brick-by-brick hanging upside down (which leaves cantilevered pieces and impossible between-brick insertions), each sub-module is built right-side up bottom-up first as its own standalone sub-chapter and snapped onto the flipped deck in one clean attachment step.
   - Pre-built sub-chapters are emitted inline immediately before the chunk/step that attaches them (matching normalized submodel IDs across continuation chunks).

3. **Three-Phase Section Build Order & Batching Underside Parts** (wired in `buildLocalSubmodelSteps` in `src/studioRuntime.ts`):
   - **Phase 0 (Pre-Built Sub-Chapters, Gravity-Stable Upright & Nested Duplicate Sub-Assemblies)**: Build any extracted `mechanisms` and `subassemblies` in their own local frame first. When a pre-built Technic mechanism contains net downward-headed vertical shafts (`headedShaftDir[1] < -0.85`, e.g., a towball-axle or stop-axle whose wide ball/head would hang downward and fall out under gravity), its standalone canonical build frame is rotated 180° around X (`rotateCanonicalParts180X`) so the wide head drops straight down into the host beam and rests stably by gravity on Step 1, then flips over (`forceSide: 'bottom'`, `flip_vertical`) on Step 2 so all underside retaining bushes/collars drop straight down onto the protruding shafts (leaving the finished mechanism in the exact flipped orientation ready to snap into Phase 2). Inside compact standalone sub-modules (`>= 12` parts, such as wheeled housings or chassis sub-modules), `buildLocalSubmodelSteps` also runs `detectDuplicateSubassemblies` (both explicit `.io`/`.mpd` submodels and pure geometric rigid-body matching, with `maxSubSize = 35%` for compact sub-modules `<= 48` parts) to extract repeated symmetric sub-assemblies (e.g., paired bracket side assemblies `×2` and wheel hubs `×2`). Each nested duplicate sub-assembly is emitted via `emitSubmodelWithNested` in attachment order immediately before its parent sub-module so it is built once with stud-facing steps and attached atomically (`×2`) instead of building opposite sides piecemeal on the blind side.
   - **Phase 1 (Upright, `side: 'top'`)**: Build the Primary Structural Deck while enforcing `belowMap` vertical prerequisites (excluding deferred underside-only plates `strictUnderInDeck` from blocking top-of-deck plates) and deferring **only** genuine underside-only deck parts (`isStrictDeckUndersidePart`) into `deferredDeckUnderside` — never routing top-of-deck plates into upside-down Phase 2 steps.
   - **Phase 2 (Upside Down — Model Flipped, `side: 'bottom'`, `cue: 'flip_vertical'`)**:
     - Lock camera side via `forceSide: 'bottom'` in `optimizeStudioStepCameraSequence` (`src/engine/stepCamera.ts`).
     - Place `deferredDeckUnderside` plates onto the now-exposed inverted deck first.
     - For each suspended underside pocket:
       1. Insert any pre-built **Technic mechanism** into the underside deck holes first (single attachment step with submodel callout).
       2. Attach any pre-built **Underside Module** / **Wheel Assembly** onto the flipped deck in a single attachment step with a clear vertical downward drop onto the inverted deck (`-44` world-Y offset = above on screen on the flipped model).
       3. Stack any remaining flat/small `looseStructuralIndices` in **inverted-gravity order** (descending world Y, obeying `buildInvertedVerticalPrereqMap`), deferring loose round-hole bearings (`isLooseHoleBearing`) until their retaining cap plate is placed so they co-attach cleanly via `collectCapInnerAttachments` instead of floating alone on an axle.
   - **Phase 3 (Upright, `side: 'top'`, `cue: 'flip_vertical'`)**: Flip right-side up and build the remaining upper structure bottom-up, avoiding mixing upright and strict-underside parts in the same step and finishing upright parts in the active layer band first so any remaining underside overhang parts batch together cleanly instead of triggering repeated camera flips.

---

## 3. Smooth Studless Tile Top-Face Clutch Physics (`src/engine/partContact.ts`)

- **Physical rule**: A smooth studless top surface (tiles, flat ingots, grilles, studless panels/windscreens — detected via `isSmoothStudlessTopPart` in `src/studioRuntime.ts`, excluding modified tiles with studs/clips/bars/jumper studs) provides **zero** vertical stud-clutch grip on its top face.
- `boxesPhysicallyTouchBasic` and `partsPhysicallyTouch` reject false vertical adjacency when the lower part has `smoothTop = true` (while still permitting minifigures `role === 'figure'` resting on tiles, studded undersides below a tile, and 3-axis through-axles/pins `role === 'axle' | 'pin'` passing through hole-bearing tiles).
- `buildPhysicalVerticalPrereqMap` similarly excludes smooth-top tiles below `u` from counting as structural lower support in `hasLowerOrSideSupport(u)` (while preserving floor-supported tile prereq ordering so tiles aren't trapped under overhead roofs). As a result, structural bricks never attach onto smooth tiles as if they had studs, and inverted/underside sub-assemblies naturally build from real studded clutch connections.

---

## 4. Generalized Naming (`src/engine/subdivisionAnalyzer.ts`)

- Replaced theme-specific `'Middle Bogie'` / `'Center Joint & Bogie'` labels in `autoNameEndAssembly` and join section naming with general mechanical labels **`Center Wheel Assembly`** and **`Center Joint & Wheels`** so wheeled articulated models of any theme (vehicles, rovers, trailers, trains) receive accurate domain-neutral names.
- Submodel names authored directly inside imported `.io`/`.mpd` files (such as user-named minifigure submodels) continue to be preserved verbatim from the source file.
