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

### 4. Camera-Aware Frontier Ordering & Sticky Camera-Corner Selection

The camera follows two principles: **prefer not to change the camera**, and **keep placed pieces on the corner closest to the camera**.

1. **Camera-aware frontier sorting (`compareFrontierCandidates`)**:
   - Strictly preserves wheel-last and bottom-up vertical layering (`16` LDU layer band).
   - Within the same vertical band, prioritizes bricks on the currently camera-facing corner/half (`cameraCornerBucket` = `0`) before neutral (`1`) and far-side (`2`) bricks, so the generator finishes the visible side smoothly before turning the model.
2. **Sticky camera-corner selection (`chooseStickyStepCamera`)**:
   - **Strong hysteresis**: Stays at the active corner whenever the model is still tiny/flat (`< 4` built bricks or `< 80` LDU span & `< 40` LDU height), whenever the step sits on the camera-facing half/center (`currentDot ≥ -0.15`), or when rotating would not meaningfully improve closeness (`bestDot - currentDot < 0.45`). Top-surface/roof steps use even stronger hysteresis (`currentDot < -0.55`, improvement `≥ 0.85`).
   - **Corner rotation**: When pieces fall clearly on a far side/corner away from the active camera, rotates to the closest of the 4 horizontal corners (`front_right`, `back_right`, `back_left`, `front_left`), emits the matching rotation cue (`yaw_90_cw`, `yaw_90_ccw`, `yaw_180`), and stays at that corner for subsequent steps.
   - **Underside flip**: When ≥60% of a step's bricks sit strictly underneath already-built overhead structure (`isUndersidePlacement`), flips to `side: 'bottom'` (`flip_vertical`) and flips back to `side: 'top'` once building resumes upright.
   - **Minifigure integration**: `optimizeMinifigPlacementCameras` continues to run after step generation and synchronizes all rotation cues across both sticky normal steps and occlusion-checked minifigure placement steps.

---

## Planned Future Extensions

- **Complex Technic & Mechanical Tiers** (deferred from v1): Distinguish standard Technic bricks/plates (normal brick rules) and parallel pins/bushes inserted along the same axis (batchable parallel sets) from complex mechanical assemblies (gears, liftarms/beams, multi-hole axles, turntables, universal joints → 1 piece at a time).
