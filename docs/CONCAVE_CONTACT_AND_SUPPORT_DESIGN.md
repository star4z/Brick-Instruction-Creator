# Concave Contact Detection & Zero-Floating Step Support Design

## Motivation

Real LEGO models frequently combine **concave structural parts** with **top-hung / underside-attached parts** — for example, a train bogie composed of two T-shaped Train Wheel Holders (`2878` / `38339`), two L-shaped `Bogie Side Plate` pieces tucked into the side cutouts between the wheel housings, and a spanning top/bogie plate that locks all four pieces together from above.

Previously, two interacting flaws allowed top-hung pieces like `Bogie Side Plate` to be placed **floating in mid-air** before the spanning plate that actually holds them:

1. **Concave outer-AABB false-positive adjacency**: `boxesPhysicallyTouch` only tested whole-part outer AABBs. Because a T-shaped Train Wheel Holder's outer AABB swallows the empty side cutout beside its lowered center deck, a `Bogie Side Plate` sitting in that cutout overlapped the wheel holder's outer AABB in all three axes (`ovX >= 3 && ovZ >= 3`) despite having **zero** real stud/clip/interlocking contact with the wheel holder. The same false positive affected L-shaped brackets, corner plates (`2420`), arches (`3659`), frames, and vehicle mudguards.
2. **Permissive vertical-prerequisite & base-layer bypasses**:
   - `buildVerticalPrereqMap` treated any part within `baseMinY + 20` LDU as base-supported, adding pure top-hung pieces (`Bogie Side Plate`) into `belowMap[topPlate]` and blocking the spanning top plate until after the hanging pieces were placed.
   - `collectBasePrereqs` and `sameBaseLayer` injected/accepted unconnected parts within `baseMinY + 24` LDU into steps even when they had zero physical adjacency to the already-built structure.

---

## Core Design

### 1. Local Concave Sub-Box Collider (`src/engine/partContact.ts`, `src/engine/datCompiler.ts`)

When [`compileDatEntry`](../src/engine/datCompiler.ts) compiles an LDraw `.dat` part once per unique `partId`:

- **Anti-stud tube preservation**: Skipped hidden underside primitives (`stud3`, `stud3a`, `stud4`, `stud4a`) are still omitted from WebGL render buffers for speed, but their local bounding boxes are captured for collider generation.
- **Tight cell-clamped voxelization (`buildLocalSubBoxes`)**:
  - Part triangles (including textured decal batches) and underside anti-stud boxes are rasterized onto a compact local grid (`10 × 8 × 10` LDU target cells, capped at `18 × 14 × 18`).
  - Multi-cell triangles use an exact Akenine-Möller Triangle-vs-AABB SAT test against internally shrunk cell dividers (`eps = 0.35` LDU), storing the exact triangle-clamped min/max inside each occupied cell so flush faces never bleed into adjacent empty cutouts.
  - **Enclosed-cavity fill**: Empty interior cells enclosed on all four horizontal sides with a ceiling above (e.g., the hollow underside of a simplified brick/plate without `stud4`) are filled so studs snapping under the center of hollow bricks always register solid clutch contact, while open exterior cutouts (T-notches, L-notches, arch doorways, frames) stay strictly empty.
  - **Greedy 3D box merging & convex fast path**: Adjacent cells with matching perpendicular bounds merge into a minimal set of tight `LocalBox6` sub-boxes. Solid/convex parts (solid volume ≥ 90% of outer AABB, or ≤ 1 merged box) collapse to `subBoxes = undefined`, incurring **zero** narrow-phase overhead on standard bricks/plates.

### 2. Two-Phase Physical Contact Verification (`partsPhysicallyTouch` & `minSubBoxGap`)

- **Broad phase**: Fast spatial hash + outer AABB check (`boxesPhysicallyTouchBasic`), unchanged in asymptotic complexity. Wheel-to-holder/axle and minifigure-to-minifigure pairs keep their existing outer-box snap clearances.
- **Narrow phase**: Whenever either part is concave (`subBoxes.length > 1`, including fused composite assemblies via `computeWorldSubBoxes`), world sub-boxes are computed via exact O(1) Arvo center-extent transforms (`transformLocalBox6ToWorld`) and verified pairwise. Flush side-wall grazing in empty cutouts (`ov = 0`) is rejected unless both parts have compatible flush-mating sideways connectors.
- **Typed sideways flush-contact guard (`classifySidewaysCapability` & `canFlushSidewaysConnect`)**:
  - `wheel_holder` parts (e.g., `38339` *Train Wheel Bogie With Pin Slots*, `2878` *Train Wheel Bogie Single Axle*) always classify as `'none'` so words like *"Pin"* or *"Axle"* in their names never allow flush side-wall grazing against adjacent brackets or plates (wheels still use the dedicated `wheel <-> wheel_holder` rule, and Technic pins in motor holes engage via 3-axis interlocking).
  - Compiled `.dat` upright SNOT bricks and brackets (`44728`, `99207`, `99780`, `99781`, `87087`, `4733`, etc.) classify as `'none'` because their real 4 LDU side studs already satisfy 3-axis interlocking (`ovX >= 1.5 && ovY >= 1.5 && ovZ >= 1.5`) when a sideways plate/tile genuinely snaps onto them, while two brackets sitting flush side-by-side (`ov = 0`) or a bracket sitting flush against a wheel holder never register as connected.
  - Two sideways-rotated plates/tiles (`'sideways_plate'`) sitting edge-to-edge (`ov = 0`) never connect via flush grazing; genuine SNOT-on-SNOT stacking connects via 4 LDU stud interlocking.
  - True flush/small-clearance connectors (`'articulated'`: clips, bars, hinges, magnets, couplers, buffers, ball/socket joints, Technic pins/axles, wheels, minifigures) and procedural non-`.dat` SNOT demo hosts (`'snot_host_synth' <-> 'sideways_plate'`) continue to connect cleanly.
- **Sub-box fallback distances (`minSubBoxGap`)**: Pass 1 and Pass 3 of `buildSpatialAdjacency` measure true sub-box gaps and prefer vertical footprint overlap over flush sideways grazing when bridging tiny CAD clearances.

### 3. Top-Hung-Safe Vertical Prerequisites & Zero-Floating Step Invariant

- **`buildPhysicalVerticalPrereqMap`**:
  - Horizontal overlap between candidate `lower` and `upper` parts is verified against solid sub-boxes (`hasSolidHorizontalOverlap`) when available.
  - A lower part `u` is ONLY added to `belowMap[upper]` if `u` has at least one genuine non-upper structural neighbor `w ∈ adj[u]` (something supporting `u` from below or sideways, NOT merely resting on top of `u`).
  - Floor-supported interior parts (e.g., walls/seats standing on a floor beneath a roof) retain `hasLowerOrSideSupport = true`, so roofs still wait for them and never sandwich/trap them.
  - Pure top-hung / underside-attached parts (`Bogie Side Plate`, hanging skirts, underside brackets, un-baseplated legs) have `hasLowerOrSideSupport = false`, so they never block the spanning plate above them and instead snap cleanly onto its underside after the spanning plate is placed.
- **Strict step connectivity across all 3 step generators** (`buildLocalSubmodelSteps`, `buildStepsForIndexList`, and the main section loop in `src/studioRuntime.ts`):
  - Removed the `collectBasePrereqs` frontier injection and `sameBaseLayer` candidate bypasses.
  - Every part added in Step 1 after the anchor must physically connect to `placedInStep`; every part added in Step `K > 1` must physically connect to `placedBeforeStep`.
  - Submodel Step 1 uses the same degree-weighted low-band foundation selector as main sections so builds start on the core chassis/wheel holder rather than a 1-connection leaf.
