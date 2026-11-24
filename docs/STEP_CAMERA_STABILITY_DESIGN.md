# Step-to-Step Camera Stability & Steady Framing Design

## Problem

Previously, stepping through an auto-generated instruction manual could feel dizzying because the camera moved on too many consecutive steps for two independent reasons:

1. **Over-eager camera rotations (`chooseStickyStepCamera`)**:
   - The step-time camera selector rotated purely by comparing `cornerAlignmentDot` against `builtBounds` (`currentDot < -0.15 && bestDot - currentDot >= 0.45`), without testing whether previously built bricks actually **occluded** the new bricks.
   - As soon as a single brick raised `builtBounds.max[1]` on a layer, `isTopSurface` turned `false` for all remaining steps on that layer—spinning the camera 90°/180° around flat baseplates, open walls, and elongated train decks even when every brick was 100% visible from the active camera.
   - `isUndersidePlacement` checked any overhead brick above the step regardless of vertical distance, which could flip the model upside down for interior bricks sitting under a distant roof.
   - Greedy per-step camera choices had no lookahead across the step sequence (allowing 1-step ping-pongs and chained turns), numbered bags reset `activeCam` back to `front_right` at each bag boundary, and unobstructed minifigure placements could spin unnecessarily for minor `frontAlignment` differences.
2. **Aggressive step-to-step auto zoom & panning (`focusMode: 'auto'`)**:
   - `buildMeshBuffers` triggered tight close-up framing whenever `fullRadius > 115` LDU (~11 studs) and `newRadius / fullRadius < 0.44`, snapping `targetCenter` 88% toward the new bricks and shrinking `viewRadius` down to `0.26 × fullRadius`.
   - On almost any model larger than 10 studs, this caused the camera to jump wildly from corner to corner and bounce between tight close-ups and full-model framing from one step to the next.

---

## Architecture (`src/engine/stepCamera.ts`)

### 1. Exact Orthographic Ray-AABB Occlusion Visibility (`evaluateStepOcclusionVisibility`)
- Evaluates visibility of a step's newly added bricks against all previously placed bricks using the exact orthographic camera basis (`cameraBasis`) and ray-AABB hit test (`rayHitsBoxInFront`) shared with `WebGLBrickEngine.computeMVP` and `minifigCamera.ts`.
- Precomputes per-view occluder projection intervals `(maxD, minR, maxR, minU, maxU)` once per shared occluder array and applies both step-level and per-brick 2D/depth culling for fast evaluation (<100 ms on 100-step / 1,000-brick models).
- Ignores coarse concave parent AABBs that significantly envelop a brick (`overlapRatio > 0.35`, e.g., inside an arch or corner-brick cutout) and treats transparent parts (`alpha < 0.99`) as partially see-through (`0.40` attenuation).
- Combines mean and minimum per-brick visibility (`0.72 × mean + 0.28 × min`) so a hidden brick inside a multi-brick step is noticed without letting a single edge-grazed face trigger false rotations.

### 2. Zero-Cost Visibility Deadband & Strict Underside Guard
- **Readability deadband (`STEP_VISIBILITY_DEADBAND = 0.72`)**: Any viewpoint with `visibility ≥ 0.72` incurs **`0.00`** penalty (`stepVisibilityPenalty`). Because staying put costs `0.00` and rotating carries strong transition penalties (`0.68` for 90°, `0.95` for 180°, `1.35` for top ↔ bottom flip), the camera **never** leaves a clear angle to chase marginal gains.
- **Piecewise occlusion ramp**: Mild partial occlusion (`0.35..0.72`) incurs a gentle penalty (`0..0.65`) that prevents 1-step ping-pong excursions while still justifying a single turn for multi-step occluded runs; severe occlusion (`< 0.35`) escalates steeply (up to `3.05` at `vis = 0`) so genuinely hidden or underside bricks always rotate/flip into clear view.
- **Strict underside proximity (`isStrictUndersidePlacement`)**: Underside flips are only permitted when ≥60% of a step's bricks sit closely underneath overhead built bricks (`vertical gap ≤ 32` LDU, not a distant high roof) AND all top canonical views are occluded (`bestTopVis < 0.55`).

### 3. Global Viterbi DP Camera Sequence Optimizer (`optimizeStudioStepCameraSequence`)
- Runs in [`src/studioRuntime.ts`](../src/studioRuntime.ts) (`optimizeManualStepCameras`) across every continuous build sequence:
  - Each standalone submodel chapter in its local coordinate frame
  - Each continuous main build section (including chapters split around submodel callouts)
  - Numbered build bag chains (`sectionId: 'sec_bags'`) without resetting at bag boundaries
  - Modular `Connect & Finish` join sequences
- Integrates smoothly with `chooseMinifigPlacementCamera`: normal runs preceding a minifigure placement optimize first so the minifigure inherits the true active camera (with tightened `rotPenalty = 0.09 / 0.12` so already-unobstructed minifigures stay steady), and subsequent steps continue from `initialCamera` so they do not snap back needlessly.
- One-time non-accumulating corner-alignment tie-breaks (`±0.01`) apply only on actual turns (`u ≠ v`), guaranteeing zero bias accumulation while staying at a clear angle.
- `chooseStickyStepCamera` (`src/engine/dynamicStepSizer.ts`) and `optimizeCameraSequence` (`src/engine/cameraOptimizer.ts`) share the same occlusion-first & deadband principles, and `compareFrontierCandidates` defers tall foreground panels/windows (`height ≥ 48` LDU) until shorter bricks on the same floor are placed so walls do not prematurely hide interior/rear bricks.

### 4. Steady Auto Step Framing (`computeStepCameraFraming`)
- **`full` ("Full Model")**: Always frames the full model built so far.
- **`focus` ("Close-Up")**: Preserves tight per-step close-up framing when explicitly selected by the user in Edit Step.
- **`auto` (default)**: Keeps framing rock-steady on the full built model for all normal, medium, and subdivided models (`fullRadius ≤ 340` LDU, ~34+ studs across). Only on truly massive un-subdivided builds (`fullRadius > 340` LDU) with tiny details (`newRadius / fullRadius < 0.24`) does it apply a smooth, cliff-free, context-preserving zoom assist (`radius ≥ 0.62 × fullRadius`, center staying ≥58% anchored to the full model center).
