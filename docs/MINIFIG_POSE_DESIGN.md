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
