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

### 3. Global Viterbi DP Camera Sequence Optimizer & Layout Aspect Alignment (`optimizeStudioStepCameraSequence`, `computeLayoutAlignedCanonicalAzimuth`, `chooseMinifigPlacementCamera`)
- Runs in [`src/studioRuntime.ts`](../src/studioRuntime.ts) (`optimizeManualStepCameras`) across every continuous build sequence:
  - Each standalone submodel chapter in its own local coordinate frame
  - Each continuous main build section (including chapters split around submodel callouts)
  - Numbered build bag chains (`sectionId: 'sec_bags'`) without resetting at bag boundaries
  - Modular `Connect & Finish` join sequences
- **Page-Aspect Camera Alignment (`computeLayoutAlignedCanonicalAzimuth`)**: Evaluates symmetric 3/4 canonical view sets `[θ, 180°−θ, 180°+θ, 360°−θ]` across `θ ∈ [24°, 66°]` against the active page's usable aspect ratio. Compact/cube-like models (`horizRatio < 1.35`) remain at the classic `38°` angle, while elongated models smoothly turn so their long axis aligns with the page's wider (Landscape) or taller (Portrait) dimension—achieving identical rendered stud scale regardless of whether a model was built along X or Z—and automatically re-aligning non-overridden cameras whenever page orientation changes.
- Integrates smoothly with `chooseMinifigPlacementCamera`: normal runs preceding a minifigure placement optimize first so the minifigure inherits the true active camera (with tightened `rotPenalty = 0.09 / 0.12` so already-unobstructed minifigures stay steady), shares the sequence's layout-aligned `baseAzimuthDeg`, includes steep elevated (`el = 66°`) candidates for narrow walled interiors, and scores candidates for layout-aspect efficiency so elongated open-top interiors align horizontally on Landscape pages (or vertically on Portrait pages) while visibility always remains the primary objective.
- One-time non-accumulating corner-alignment tie-breaks (`±0.01`) apply only on actual turns (`u ≠ v`), guaranteeing zero bias accumulation while staying at a clear angle.
- `chooseStickyStepCamera` (`src/engine/dynamicStepSizer.ts`) and `optimizeCameraSequence` (`src/engine/cameraOptimizer.ts`) share the same occlusion-first & deadband principles, and `compareFrontierCandidates` defers tall foreground panels/windows (`height ≥ 48` LDU) until shorter bricks on the same floor are placed so walls do not prematurely hide interior/rear bricks.

### 4. Steady Auto Step Framing, Per-Part 2D Projection & Readability-Aware Zoom (`computeStepCameraFraming`, `computeProjectedBoxesExtents`, `computeStepOrthoFrustum`)
- **`full` ("Full Model")**: Always frames the full model built so far.
- **`focus` / `regional` ("Close-Up" / "Regional")**: Preserves tight per-step close-up framing when explicitly selected by the user in Edit Step.
- **`auto` (default)**:
  - On fixed physical print sheets (`paperFormat !== 'screen'`), stays **100% rock-steady on the full model** whenever the full model renders at `≥ 0.5 cm/stud`. When a very large/joined model's full view falls below `0.5 cm/stud`, smoothly zooms in just enough to keep `1 stud ≥ 0.5 cm` (showing the maximum possible surrounding model context at a steady scale across consecutive steps, displaying the bottom-left regional locator inset, and never cropping any newly added parts).
  - On `Screen Fit`, stays rock-steady on the full built model up to `fullRadius ≤ 340` LDU and applies a smooth, bounded, context-preserving zoom assist on truly massive builds with tiny new details.
- **Per-Part 2D Projected Silhouette, Visual Centering, Zoom Clamping & PLI Clearance (`computeProjectedBoxesExtents` + `computeStepOrthoFrustum`)**:
  - Projects individual part boxes (including offset bricks & their canonical target seats) onto the active camera's `(right, up)` plane with a clean `1.06` framing margin (`STEP_CAMERA_FRAMING_MARGIN`), eliminating phantom 8-corner union-AABB dead space on asymmetric, L-shaped, or offset-arrow steps while keeping O(parts) 60fps orbit performance.
  - Visually centers full-model steps on their exact 2D silhouette midpoint `(centerOffsetR, centerOffsetU)` and clamps zoomed-in frustums to the full model's padded 2D bounds so zero empty air is wasted beyond an end while keeping all newly added parts strictly inside the frame.
  - On 1-up full-page steps with a compact single-row top-left PLI pill, verifies whether all visible projected part boxes clear the top-left PLI obstacle (naturally or via a bounded collision-free 2D shift) so the 3D render reclaims the full vertical slot height cleanly without ever overlapping the step number or parts list.
  - Shared 1:1 across `WebGLBrickEngine.computeMVP`, `computeStudioOrthoCamera` (Studio PBR), PDF export, and `pageLayout.ts` readability checks, with exact slot visual dimensions passed to `computeStepSlotRenderSize` to prevent `object-contain` letterboxing waste.

### 5. Free-Orbit & Continuous-Section Rotation Indicators (`resolveEffectiveStudioStepCue`)
- `resolveStudioStepCamera()` resolves each step's effective `(side, corner, az, el)` pose from both automatic optimizer outputs and any user preset or free-orbit override (deriving `side` from `el < 0` when omitted and wrapping azimuth cleanly into `[0°, 360°)`).
- `findPreviousStudioModelStep()` and `resolveEffectiveStudioStepCue()` walk the exact same continuous build sequences as `optimizeManualStepCameras` and `getPreviousPartsForStep` (local frame for `submodel` chapters; unified `sectionId` chain across `main`/`bag`/`join` chapters while skipping standalone minifigure & pose steps). Every step's rotation badge is computed directly from the effective poses of the previous and current steps, so free-orbited steps (both the orbited step and its successor, including across bag or post-submodel chapter boundaries) always show accurate `90°` / `180°` / `Flip Over` indicators in live preview, PDF export, and Interactive 3D HTML export.
- During live drag-to-orbit on `#liveRotateCanvas`, `syncVisibleStepRotationBadges()` updates rotation badges across all visible step slots on the page in real time without recreating the WebGL canvas, and pointer release (`endOrbit`) commits `renderAll()` to sync static snapshots, stacked header layouts, the floating Camera card, and session autosave.
- In the modular optimizer (`src/engine/cameraOptimizer.ts` + `src/store/useManualStore.ts`), `optimizeCameraSequence()` honors free-orbit `customAzimuthDeg` / `customElevationDeg` overrides during DP pinning and `rotationCue` computation, and `recomputeStepRotationCues()` refreshes chapter rotation indicators on single-step camera updates/resets without retroactively spinning neighboring steps.
