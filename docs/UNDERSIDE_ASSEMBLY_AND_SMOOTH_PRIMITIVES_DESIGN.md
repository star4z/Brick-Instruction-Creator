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
   - Scans quantized horizontal structural layers above `minY` to find the lowest connected horizontal deck band whose span covers `>= 55%` of the section's longest horizontal axis (requiring the deck's own base layer `minY <= yCand + 4` to cover `>= 40%` of the long axis so a lone underside piece one plate lower cannot hijack `yCand - 8`), then uses the exact underside plane `deckFloorY = min(b.min[1])` of `baseLayerParts` so bricks clutched directly beneath the deck with 4 LDU top studs (`maxY <= deckFloorY + 5.5`) are never dropped when a deck sits off an exact 8-LDU multiple.
   - Collects parts strictly below `deckFloorY`, vertical Technic mechanisms extending upward into deck holes, and **recessed underside connectors** (such as 2×2 turntable flat bases `27448` / `3680` or socket couplers whose base rests below the deck `minY < deckFloorY - 4` while their upper snap collar reaches into a deck opening `maxY <= deckFloorY + 12` and `centerY <= deckFloorY + 4`) so turntable/socket connectors stay attached to their underside sub-module instead of stranding in Phase 3 after the sub-module is closed up.
   - Verifies that all collected underside parts break into **isolated localized underside pockets** (no single connected component below the deck spans `>= 50%` of the model's long axis — ensuring buildings/castles resting on a ground baseplate always stay normal bottom-up).
   - Verifies at least one substantial pocket (`>= 4` parts) attaches directly to the deck from below.
   - Collects standalone 1-part underside pieces (`comp.length === 1`) that clutch directly upward into `deckAndAbove` (such as inverted 1×2 slopes `3665` tucked beneath a floor beside an underside sub-module) into `deckUndersideIndices` so they are attached directly to the flipped floor in Phase 2.0 before neighboring sub-modules are attached.

2. **Pre-Built Technic Mechanisms & Underside Sub-Modules (`UndersideSubassemblySpec`)**:
   - Inside each suspended underside pocket, identifies:
     - **Technic axle/bar mechanisms**: connected clusters of non-stud-host Technic mechanism parts (`>= 2` parts with at least one axle and one non-axle mechanism part, touching the deck or a loose round-hole bearing or having a vertical axle).
     - **Cohesive underside structural sub-modules**: remaining connected structural components inside the pocket with `>= 4` parts that either have multi-layer vertical height (`>= 14` LDU) or contain wheels (`Wheel Assembly` when wheeled, `Underside Module` otherwise). Rather than constructing complex housings or wheeled assemblies brick-by-brick hanging upside down (which leaves cantilevered pieces and impossible between-brick insertions), each sub-module is built right-side up bottom-up first as its own standalone sub-chapter and snapped onto the flipped deck in one clean attachment step.
   - **Immediate Next-Step Submodel Attachment (Official LEGO Manual Rule)**: Every submodel — including nested duplicate sub-assemblies inside sub-modules (`emitSubmodelWithNested`) and deferred center assemblies inside `Connect Halves & Finish` (`joinSteps`) — is emitted **inline immediately before the parent step that attaches it**, splitting the parent chapter into continuation chunks (`isSectionContinuation: true`) sharing a unique `sectionId`. Camera optimization (`optimizeManualStepCameras`), auto placement offsets (`assignAutoPlacementOffsets`), rotation/flip cues (`findPreviousStudioModelStep`), continuous step numbering (`renumberContinuousSteps`), cumulative previous parts (`getPreviousPartsForStep`), framing metrics (`rebuildPages`), and overview thumbnail signatures (`computeOverviewStepSignatures`) all chain seamlessly across continuation chunks while suppressing duplicate intro banners.

3. **Three-Phase Section Build Order & Batching Underside Parts** (wired in `buildLocalSubmodelSteps` in `src/studioRuntime.ts`):
   - **Phase 0 (Pre-Built Sub-Chapters, Gravity-Stable Upright & Nested Duplicate Sub-Assemblies)**: Build any extracted `mechanisms` and `subassemblies` in their own local frame first. When a pre-built Technic mechanism contains net downward-headed vertical shafts (`headedShaftDir[1] < -0.85`, e.g., a towball-axle or stop-axle whose wide ball/head would hang downward and fall out under gravity), its standalone canonical build frame is rotated 180° around X (`rotateCanonicalParts180X`) so the wide head drops straight down into the host beam on Step 1, and all underside retaining bushes/collars slide upward onto the protruding shafts on Step 2 in the same upright orientation (`keepUpright: true` / `forceSide: 'top'`, with zero unnecessary `flip_vertical`). Inside compact standalone sub-modules (`>= 12` parts, such as wheeled housings or chassis sub-modules), `buildLocalSubmodelSteps` also runs `detectDuplicateSubassemblies` (both explicit `.io`/`.mpd` submodels and pure geometric rigid-body matching, with `maxSubSize = 35%` for compact sub-modules `<= 48` parts) to extract repeated symmetric sub-assemblies (e.g., paired bracket side assemblies `×2` and wheel hubs `×2`), which `emitSubmodelWithNested` interleaves inline immediately before the parent sub-module step that attaches them.
   - **Phase 1 (Upright, `side: 'top'`)**: Build the Primary Structural Deck while enforcing `belowMap` vertical prerequisites (excluding deferred underside-only plates `strictUnderInDeck` from blocking top-of-deck plates) and deferring **only** genuine underside-only deck parts (`isStrictDeckUndersidePart`) into `deferredDeckUnderside` — never routing top-of-deck plates into upside-down Phase 2 steps.
   - **Phase 2 (Upside Down — Model Flipped, `side: 'bottom'`, `cue: 'flip_vertical'`)**:
     - Lock camera side via `forceSide: 'bottom'` in `optimizeStudioStepCameraSequence` (`src/engine/stepCamera.ts`).
     - Place `deferredDeckUnderside` plates and `undersidePlan.deckUndersideIndices` standalone underside pieces onto the now-exposed inverted deck first (Phase 2.0), before any adjacent underside sub-modules block access.
     - For each suspended underside pocket:
       1. Insert any pre-built **Technic mechanism** into the underside deck holes first (single attachment step with submodel callout).
       2. Attach any pre-built **Underside Module** / **Wheel Assembly** onto the flipped deck in a single attachment step with a clear vertical downward drop onto the inverted deck (`-44` world-Y offset = above on screen on the flipped model).
       3. Stack any remaining flat/small `looseStructuralIndices` in **inverted-gravity order** (descending world Y, obeying `buildInvertedVerticalPrereqMap`), deferring loose round-hole bearings (`isLooseHoleBearing`) until their retaining cap plate is placed so they co-attach cleanly via `collectCapInnerAttachments` instead of floating alone on an axle.
   - **Phase 3 (Upright, `side: 'top'`, `cue: 'flip_vertical'`)**: Flip right-side up and build the remaining upper structure bottom-up, avoiding mixing upright and strict-underside parts in the same step and finishing upright parts in the active layer band first so any remaining underside overhang parts batch together cleanly instead of triggering repeated camera flips.

---

## 3. Smooth Studless Tile, Partial-Stud Slope & Narrowed Bottom-Footprint Clutch Physics (`src/engine/partContact.ts`, `src/engine/datCompiler.ts`)

- **Smooth studless top faces**: A smooth studless top surface (tiles, flat ingots, grilles, studless panels/windscreens — detected via `isSmoothStudlessTopPart` in `src/studioRuntime.ts`, excluding modified tiles with studs/clips/bars/jumper studs) provides **zero** vertical stud-clutch grip on its top face.
- `boxesPhysicallyTouchBasic` and `partsPhysicallyTouch` reject false vertical adjacency when the lower part has `smoothTop = true` (while still permitting minifigures `role === 'figure'` resting on tiles, studded undersides below a tile, and 3-axis through-axles/pins `role === 'axle' | 'pin'` passing through hole-bearing tiles).
- **Partial-stud top & narrowed bottom-footprint verification**:
  - `compileDatEntry` (`src/engine/datCompiler.ts`) computes a tight `bottomBox` from triangle vertices within `2.5` LDU of `minY` whenever a part's bottom foot is at least `12` LDU wide on both horizontal axes (filtering out thin bracket flanges/clips/pins) and narrower than the outer AABB by `>= 6` LDU along X or Z (e.g., inverted 45° slopes `3665`/`3660`).
  - `buildSpatialAdjacency` (`src/studioRuntime.ts`) computes world-space upward stud coordinates (`computePartUpwardStuds`) and upright narrowed bottom footprints (`computePartBottomFootprint`) and passes them into `partsPhysicallyTouch`.
  - For vertical stacking seams (non-fasteners, not deep 3-axis interlocking or flush sideways SNOT), `partsPhysicallyTouch` verifies that the upper part's real bottom footprint overlaps the lower part horizontally (`>= 3` LDU on X and Z) AND that at least one upward stud of the lower part falls inside the upper part's bottom footprint (`±2` LDU). This eliminates phantom adjacency between a brick/inverted slope hovering above a 45° slope's studless angled ramp (such as `3665` above `3040`), so inverted slopes clutching only to the deck floor stay out of underside sub-modules instead of floating inside them.
- `buildPhysicalVerticalPrereqMap` similarly excludes smooth-top tiles below `u` from counting as structural lower support in `hasLowerOrSideSupport(u)` (while preserving floor-supported tile prereq ordering so tiles aren't trapped under overhead roofs). As a result, structural bricks never attach onto smooth tiles as if they had studs, and inverted/underside sub-assemblies naturally build from real studded clutch connections.

---

## 4. Generalized Naming (`src/engine/subdivisionAnalyzer.ts`)

- Replaced theme-specific `'Middle Bogie'` / `'Center Joint & Bogie'` labels in `autoNameEndAssembly` and join section naming with general mechanical labels **`Center Wheel Assembly`** and **`Center Joint & Wheels`** so wheeled articulated models of any theme (vehicles, rovers, trailers, trains) receive accurate domain-neutral names.
- Submodel names authored directly inside imported `.io`/`.mpd` files (such as user-named minifigure submodels) continue to be preserved verbatim from the source file.

