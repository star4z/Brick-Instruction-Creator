# Minifigure Standing Normalization & Arm Pose Design

## Overview

When building LEGO instruction manuals from BrickLink Studio (`.io`) or LDraw (`.ldr` / `.mpd`) models, minifigures are often posed inside the final scene—seated in vehicles, rotated backward, tilted, or with arms raised to grip handlebars, doors, or props.

In official LEGO instruction manuals, each minifigure is constructed **standing upright facing the camera** in its initial build chapter with limbs in their **default neutral position**, and only posed/rotated right before placement onto the main model.

This document specifies the canonical minifigure normalization rules implemented in [`src/engine/minifigPose.ts`](../src/engine/minifigPose.ts) and integrated via [`src/studioRuntime.ts`](../src/studioRuntime.ts).

---

## Core Rules

### 1. Upright Front-Facing Canonical Frame
- Determine the body reference frame from `torso → hips → legs_unit → head → first leaf`.
- Transform all leaves of the minifigure group into the upright (`+Y`), front-facing (`+Z`) torso coordinate frame.
- Straighten hips and legs (`3815`/`970`, `3816`/`971`, `3817`/`972`, `970c*`, `3815c*`) to standing straight down (`R_IDENTITY`).
- Straighten turned heads (and attached headgear) to face `+Z`, while preserving intentional 180° double-sided alternate faces when headgear already faces forward.
- Recenter the standing figure at `(0, 0, 0)` with feet resting cleanly on `Y = 0`.

### 2. Default Neutral Arm Position in Initial Build Steps & PLI
- Both arms (`3818`/`982` Right Arm, `3819`/`981` Left Arm) and their matched hands (`3820`/`983`) return to their **default hanging position** at the minifigure's sides in the initial build step and in Parts List (PLI) torso thumbnails (`normalizeCompositeThumbPart`).
- **Broad BrickLink Studio & LDraw Part Support**:
  - Recognizes both LDraw IDs (`3818`, `3819`, `3820`, `973`, `3814`, `76382`, `3815`, `3816`, `3817`) and BrickLink IDs (`981`, `982`, `983`, `970`, `971`, `972`) with digit-boundary guards so unrelated 5-digit bricks (e.g., `98138`, `98283`, `98385`) are never misclassified.
  - Recognizes BrickLink part titles (`Arm, Right`, `Arm, Left`, `Hand`, `Leg, Right`, `Leg, Left`, `Torso ...`) as well as LDraw `Minifig ...` titles.
  - Provides a canonical-frame structural fallback inside torso assemblies (`isTorsoAsm`) that identifies custom/printed arms by shoulder peg proximity `(±15.552, -9, 0)` and remaining wrist children as hands.
- **Arbitrary Studio Rotations & Reflections**:
  - Pure shoulder-pin rotations (`u[0] > 0.5 && |u[2]| < 0.08`) preserve the arm's exact shoulder-pin slope while un-rotating around the shoulder pivot.
  - Off-pin, yawed, splayed, or flipped arm rotations snap cleanly back to the official LDraw `973c01.dat` neutral hanging matrices (`ARM_R_CANONICAL_GL` / `ARM_L_CANONICAL_GL`).
  - Mirrored arm transforms (`det < 0`) factor out `REFLECT_X` before orthonormalization and re-apply it afterward so normals and handedness stay intact while `R_corr` remains a proper rigid rotation (`det = +1`).

### 3. Accessory-Required Arm Pose Exceptions (e.g., Purses & Satchels)
An individual arm **keeps its posed angle** in the initial build step **only when physically required** by an accessory belonging to the minifigure:

1. **Purse / Handbag / Satchel / Shoulder-Carry Accessory (`isArmPosingAccessory`)**:
   - Held in that arm's hand (e.g., `93091` Handbag/Purse, `93082` Purse, `10169` Sack/Bag, `4449` Briefcase/Suitcase, guitars), **or**
   - Mounted on the torso/neck and resting on that arm's side within arm proximity (e.g., `61976` Crossbody Messenger Bag / Satchel hanging at the hip).
   - Note: `61976` is classified as `'accessory'` (not `'headgear'`) so it stays anchored to the torso and participates in arm clearance checks.
2. **Two-Handed Grip**:
   - Any accessory gripped simultaneously by both hands keeps both arms posed so the grip is not broken.
3. **3D Geometric Clearance Guard (for any unknown/custom accessory)**:
   - Before resetting an arm, simulate the neutral pose of the arm, hand, and any carried handheld item:
     - Keep posed if moving the arm/hand to neutral creates a new 3D overlap (`> 2.0 LDU` depth) with a non-carried body/shoulder accessory.
     - Keep posed if lowering a carried handheld item creates a new 3D overlap (`> 2.5 LDU`) with the standing torso/hips/legs, or pushes the carried item below the minifigure's standing feet (`minY < feetMinY - 2.0`).
4. **Per-Arm Independence & Pre-Placement Pose Step**:
   - Only the arm(s) actually required by the purse/accessory remain posed; the opposite arm still resets to its default hanging position.
   - `poseSummary.armsMoved` only counts arms that were actually reset during normalization, avoiding redundant `"Pose arms"` pre-placement prompts when an arm already holds its final purse pose from the build step.
   - `posedPreviewParts` always preserves the exact final scene pose so any reset limbs are clearly posed right before attaching the minifigure to the model.

### 4. Direct Official-Style Minifigure Placement (No Standalone Pose Steps)
Matching official LEGO instruction manuals, Brick Instruction Creator does **not** insert a separate standalone "Pose / Rotate minifigure" preparation step (`isMinifigPoseStep`) before placing a minifigure onto the model:

1. **Build Standing, Place Directly in Final Pose**:
   - In its build step, each minifigure is constructed standing upright, front-facing (`+Z`), with neutral hanging arms (preserving only accessory-required arm poses such as bags or handheld tools).
   - When it is time to add the minifigure to the model, a single placement step (`attachedMinifig`) places the minifigure directly into the scene in its exact final world pose (`worldParts` — seated, rotated, arms/head positioned in context).
2. **Front-Facing Standing Callout Thumbnail & Unobstructed Placement Camera**:
   - The placement step's `×1` minifigure callout box renders the recognizable front-3/4 standing minifigure (`canonicalParts` at `MINIFIG_BUILD_CAMERA`) in both the interactive viewer and PDF export, while the main 3D step render shows the minifigure seated/positioned in the model from an unobstructed camera chosen by `chooseMinifigPlacementCamera`.
   - Eliminating standalone pose steps removes confusing 3D curved arc arrows, ghost limbs, unreadable degree legend pills, and redundant "rotate an already-built figure" PLI callouts.
   - `normalizeMinifigureForBuild` continues to compute pose analysis metadata (`poseSummary`, `posedPreviewParts`, `posedFrontParts`, `poseIndicators`, `poseGhostParts`) cleanly for diagnostics and legacy `.biw` project compatibility.

### 5. Minifigure Group Extraction, Structural Bar Exclusion & Naming
- **Strict Structural & Fixture Exclusion (`isNonMinifigPart` & `extractMinifigureGroups`)**:
  - Chairs/seats (e.g., `4079` *Minifigure Seat 2×2*), furniture, vehicle controls, structural bricks/plates/tiles, and **structural LEGO bars/poles/handrails/hoses/antennas** (e.g., `30374` *Bar 4L (Lightsaber Blade / Wand)*, `63965` *Bar 6L*, `87994` *Bar 3L*, `4095` *Bar 6.6L with Stop Ring (Patio Umbrella Stand)*, `21462`/`78258` *Bar 2L*) are excluded from minifigure classification (`isNonMinifigPart === true`, `classifyMinifigGroupKind === null`) so train stanchions/grab poles and architectural bars stay in the main model rather than being pulled into nearby passengers.
  - Physical model adjacency (`adjacency` from `buildSpatialAdjacency`) is passed into `extractMinifigureGroups` so non-wearable props physically mounted to surrounding model/train structure (e.g., a mug on a table, radio on a console, or unknown vertical side pole anchored to a floor/roof) remain part of the model unless gripped in a minifigure's hand.
  - **Unified Handheld Accessory Post-Pass**: After Stage A (explicit single-figure submodels) and Stage B (geometric loose figures), a unified post-pass checks all remaining unclaimed non-structural parts against every detected minifigure's hand anchor points (`collectGroupHandPoints`). Any recognized minifigure accessory/utensil (`kind === 'headgear'`) within `14 LDU` of a hand — or any unanchored, handheld-proportioned custom/unofficial prop (max span `≤ 130 LDU`, second dimension `≤ 40 LDU`) within `12 LDU` of a hand — is attached to the minifigure with the closest gripping hand. This ensures long-handled tools (brooms, oars, staves, shovels, etc.) placed outside a minifigure's submodel are built and placed with the minifigure holding them rather than standing alone.
  - **Lightsaber Blade Exception**: After core/wearable/hilt grouping, a `30374` Bar 4L blade is attached to a minifigure **only** when it directly touches a claimed lightsaber hilt (`64567`, `577`, `30373`, etc.) on that figure and is not anchored to any surrounding structural model part.
- **Minifigure Naming Sources**:
  - **Stage A (Explicit Single-Figure Studio/MPD Submodel)**: When a minifigure is grouped in its own 2–16 part submodel inside the imported `.io`/`.mpd` file, its label comes directly from that submodel's `0 FILE <name>` header (cleaned via `cleanSubName`, stripping `.ldr`/`.mpd`/`.io` and trailing `copy N`).
  - **Stage B (Geometric Fallback)**: When a minifigure is placed loosely in the main model or inside a larger/multi-figure submodel, it receives the automatic sequential fallback label `Minifigure 1`, `Minifigure 2`, etc.
