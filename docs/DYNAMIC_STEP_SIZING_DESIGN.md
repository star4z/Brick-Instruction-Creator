# Dynamic Step Sizing & Sticky Camera-Corner Design

## Motivation

Previously, auto-generated steps used a static `Few / Step` (`3`), `Balanced` (`6`), or `Many / Step` (`12`) button group in the menu drawer:

1. **Unresponsive & unclear UI**: Tapping a pacing pill did not regenerate steps until the user also clicked **Regenerate Steps from Model**, and the labels did not clearly explain that they were merely hard upper caps on bricks per step.
2. **Cluttered mixed steps**: Without a cognitive-load model or variety surcharge, the generator frequently filled up to 6 bricks by scooping `1×` each of several unrelated parts from the same layer, even when identical pieces could be grouped cleanly.
3. **One-size-fits-all limits**: A straight row of 16 identical tiles, a scattered castle-wall masonry texture, Step 1's opening foundation, and a cluster of compact unique pieces should not share the same fixed count.
4. **Static front-right view**: Normal steps always stayed fixed at `top / front_right` even when pieces were placed on the far back corner or underneath an overhang.

---

## Core Design

The static `Few / Balanced / Many` buttons are removed from the drawer. All auto-generated builds (main sections, subdivided sections/bags, and submodels) use the dynamic engine in [`src/engine/dynamicStepSizer.ts`](../src/engine/dynamicStepSizer.ts).

### 1. Cognitive-Budget Step Sizing

Instead of a fixed piece cap, each step has a **cognitive budget** (`STEP_COGNITIVE_BUDGET = 8.0` units):

- **Gentle opening (Step 1)**: Step 1 of a model or section starts with `1–3` anchor bricks (budget `3.0`, or `2.0` for tiny ≤4-piece submodels) so the builder establishes orientation cleanly before ramping up.
- **Unique SKU cost (`1.0` base)**: Each distinct `(partId, colorId)` SKU costs `1.0` unit (plus a mild spread surcharge when pieces are spaced farther apart), allowing up to **8 unique simple pieces** when tightly clustered in one readable zone, and fewer when spread out.
- **Strong identical-piece preference**: Candidates matching an already-in-step SKU receive the highest priority score (`+170` structured, `+80` scattered), and once a step contains `≥ 2` (or `≥ 4`) identical pieces, switching to an unrelated SKU adds a surcharge (`+0.75` / `+1.6`) so repeated runs stay clean rather than turning into mixed grab-bags.

### 2. Pattern Classification: Structured Runs vs. Scattered Texture

When a candidate matches an already-in-step SKU, `classifySameSkuPattern` distinguishes repeatable geometry from irregular texture:

- **Structured repeats** (`cost = 0.45`, up to `12` per step):
  - **Linear row** along X or Z (same level, touching or uniform pitch)
  - **Uniform 2D grid** (matching existing X column and Z row within nearby span)
  - **Mirror-symmetric pair** across the section centerline (within a compact visible span `≤ 180` LDU)
- **Even-chunk splitting for large uniform runs**: When a contiguous ready structured run exceeds `12` pieces, `computeEvenRunTarget` splits it evenly (e.g., `16 → 8 + 8`, `20 → 10 + 10`, `24 → 8 + 8 + 8`) and finishes cleanly at the chunk boundary without tacking on unrelated singletons.
- **Scattered / irregular repeats** (`cost = 1.15+`, capped at `4–5` per step): Identical parts placed at irregular offsets (e.g. castle-wall masonry texture or rockwork greebling) are split into smaller steps so every piece is easy to locate.

### 3. Spatial Face & Footprint Coherence

To ensure every step reads clearly in a single camera frame without requiring ray-cast overhead:

- **Opposite-wall guard (`areOnOppositeWalls`)**: On builds `≥ 80` LDU wide/deep, a single step will not mix pieces from opposite exterior walls (except compact mirror pairs on spans `≤ 140` LDU).
- **Cluster footprint cap**: Mixed/scattered steps stay compact (`120–185` LDU), while clean linear structured rows may span slightly wider (`160–260` LDU).

### 4. Camera-Aware Frontier Ordering, Occlusion-Driven Camera Selection & Steady Framing

The camera follows two principles: **stay rock-steady whenever the new bricks are already clearly visible**, and **only rotate or flip when previously built structure genuinely occludes them** (see [`STEP_CAMERA_STABILITY_DESIGN.md`](./STEP_CAMERA_STABILITY_DESIGN.md) for full details).

1. **Camera-aware frontier sorting (`compareFrontierCandidates`)**:
   - Strictly preserves wheel-last and bottom-up vertical layering (`16` LDU layer band).
   - Defers tall walls/panels/windows (`height ≥ 48` LDU) until shorter bricks and plates on the same floor band are placed, preventing tall foreground walls from prematurely hiding interior or back-side pieces.
   - Within the same vertical band, prioritizes bricks on the currently camera-facing corner/half (`cameraCornerBucket` = `0`) before neutral (`1`) and far-side (`2`) bricks so once a rotation is needed, all bricks on that side finish cleanly together.
2. **Occlusion-driven sticky camera & global Viterbi DP smoothing (`chooseStickyStepCamera` + `optimizeStudioStepCameraSequence`)**:
   - **True 3D orthographic occlusion + deadband**: Evaluates exact orthographic ray-AABB visibility against previously placed bricks. Any view with `visibility ≥ 0.72` incurs zero penalty, eliminating layer-by-layer spinning on flat baseplates, open walls, and elongated decks.
   - **Global sequence optimization**: Runs Viterbi dynamic programming across each continuous build section, bag chain, join sequence, and submodel with strong transition costs (`0.68` for 90°, `0.95` for 180°, `1.35` for flips), eliminating 1-step ping-pongs and choosing shared angles across consecutive occluded steps.
   - **Strict underside flip**: Flips to `side: 'bottom'` (`flip_vertical`) only when ≥60% of a step's bricks sit closely underneath overhead built structure (`gap ≤ 32` LDU) AND top views are genuinely occluded (`bestTopVis < 0.55`).
   - **Minifigure integration**: `optimizeManualStepCameras` seamlessly weaves occlusion-checked minifigure placement steps into the section DP, keeping unobstructed minifigures steady and continuing subsequent steps from the active camera without snap-backs.
3. **Steady default step framing (`computeStepCameraFraming`)**:
   - `focusMode: 'auto'` keeps the full built model steadily framed and centered across normal, medium, and subdivided builds (`fullRadius ≤ 340` LDU), preventing step-to-step zoom bouncing and corner panning while preserving explicit per-step `Close-Up` and `Full Model` overrides.

### 5. Strict Step Connectivity & Grounded Vertical Prerequisites

To prevent disconnected pieces from being grouped into the same step (or placed detached before their connecting structure exists):

- **No disconnected `sameBaseLayer` or `collectBasePrereqs` bypasses**: Both `isCandidateConnectedForStep` and `createGroundedPrereqChecker` in [`src/engine/dynamicStepSizer.ts`](../src/engine/dynamicStepSizer.ts) enforce that:
  - On **Step 1** (`placedBeforeStep.size === 0`), every added brick must physically connect to `placedInStep` — with one strictly physical exception: **Co-planar floor foundation co-placement (`findCoPlanarFloorFoundation`)**. When Step 1's anchor rests on the lowest floor plane and an immediate upper bridging piece sitting on `anchor` would otherwise awkwardly overhang (`< 55%` of its footprint supported by `anchor` alone), strictly co-planar floor-plane partners (`min[1]` and `max[1]` within `1.5` LDU of `anchor`) that sit directly underneath that bridging piece are laid out together flat on the table in Step 1 (up to 5 parts / 4 SKUs) so Step 2's bridging plates drop cleanly onto a fully supported foundation instead of overhanging and forcing later plates to be tucked underneath.
  - On **Steps 2+**, when `anchor` connects to the already-built model (`placedBeforeStep`), every added brick in that step must also physically connect to `placedBeforeStep` (never scooping detached plates sitting on the same base elevation).
  - In the rare **disconnected-island fallback**, candidates may only extend `anchor`'s own connected island (`placedInStep`), never merging two unrelated islands into one step.
- **Avoidable-overhang prioritization (`hasAvoidableOverhang`)**: On Steps 2+, `compareFrontierCandidates` and `selectDynamicStepIndices` prefer solidly supported pieces ahead of pieces that have `< 55%` footprint support from `placedBeforeStep` (`< 65%` of total underlying support placed) while unplaced lower support parts still exist directly underneath them. Intentional cantilevers (wings, spoilers, eaves with zero unplaced parts underneath) are unaffected.
- **Grounded vertical prerequisites (`createGroundedPrereqChecker`)**: A bridging plate or floor is only blocked by an unplaced lower brick `u ∈ belowMap[i]` when `u` is physically reachable from `placed` (directly touching `placed` or resting atop a chain of lower unplaced bricks that reaches `placed`). Grounded walls on an already-built baseplate still build strictly bottom-up with zero trapped bricks, while unattached underside plates (e.g., `4×6`/`2×6` plates hanging beneath an unplaced train floor) wait until the connecting floor is placed and then snap directly onto it.

---

## Planned Future Extensions

- **Complex Technic & Mechanical Tiers** (deferred from v1): Distinguish standard Technic bricks/plates (normal brick rules) and parallel pins/bushes inserted along the same axis (batchable parallel sets) from complex mechanical assemblies (gears, liftarms/beams, multi-hole axles, turntables, universal joints → 1 piece at a time).
