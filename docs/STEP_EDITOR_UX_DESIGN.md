# Step Editing & Mode Toolbar UX Design

## Problem Statement

Previously, the floating contextual overlays for **Rotate** and **Arrange** accumulated unrelated and overlapping step/page controls:
- **Duplicate controls across tabs**: Minifigure styles (`Exploded` / `Step-by-Step` / `Classic`) appeared in `Style`, `Rotate`, and `Arrange`; `1:1 View` appeared in both `Style` and `Rotate`.
- **Unrelated settings inside direct-manipulation modes**: Camera framing (`Auto` / `Close-Up` / `Full`), 3D model scale (`100%`), minifigure styles, and `1:1 View` were crowded into `Rotate`; page breaks, text/image inserts, minifigure styles, and subassembly callout conversions were crowded into `Arrange` (including a dead `Parts Box` scaler on `Exploded` minifigure pages that do not render a Parts Box).
- **Unlabeled pill clusters**: Buttons lacked section labels or scope indicators (`This step` vs. `This page` vs. `All minifigure steps`), and tall multi-row floating overlays obscured a large portion of the live page on mobile viewports.

---

## Architecture & Separation of Concerns

### 1. Bottom Mode Pill (`#modePill`)
Every mode tab now owns a single, unambiguous responsibility:
- **Step pages (`page.kind === 'steps'`)**: `[ Pan | Select | Rotate | Arrange | Edit ]`
  - **`Pan`**: 1-finger pan & pinch zoom on the live page (hides contextual overlays).
  - **`Select`**: 1-finger tap on 3D bricks or Parts Box entries to nudge, tilt, toggle arrows, split/merge steps, or create submodels.
  - **`Rotate`**: Strictly 3D camera orientation (`Drag 3D to orbit`, labeled `View: Top / Bottom`, labeled `Angle` presets, `Reset Angle`, and `Apply Angle to Following`).
  - **`Arrange`**: Strictly 2D box positioning & sizing (`Drag boxes to move`, context-aware `Parts Box Size` only when a Parts Box exists, `Selected Note / Image` scale & delete, and `Reset Box Layout`).
  - **`Edit`**: Opens the dedicated full-page **`Edit Step & Page`** dialog (`#stepEditModal`) without discarding the user's underlying canvas mode.
- **Simple edit pages (`cover`, `complete`, `back`, `divider`, `bom`)**: `[ Pan | Edit ]`

### 2. Dedicated Full-Page `Edit Step & Page` Modal (`#stepEditModal`)
Matches the app's existing full-page dialog pattern (`Page Setup`, `Parts List Setup`, `Bricks Library`) with a sticky header, multi-step switcher bar (on multi-step pages), scrollable clearly labeled cards with explicit **scope badges**, and a sticky `Done` footer:

1. **Minifigure Instruction Style** *(shown on minifigure build steps · Scope: `All minifigure steps`)*
   - Descriptive option cards for **Exploded**, **Step-by-Step**, and **Classic** (each with plain-English explanation).
   - **1:1 Actual-Size Minifigure Preview** toggle with description.
2. **Step Display & Framing** *(Scope: `This step`)*
   - **Camera Framing** (`Auto` | `Close-Up` | `Full Model`) with dynamic description.
   - **3D Model Size** (`−` / `%` / `+` + `Reset`).
   - **Parts Box Size** (`−` / `%` / `+` + `Reset`) — shown only when the active step renders a Parts Box.
   - **3D Camera Angle** summary with a direct **`Rotate in 3D →`** shortcut (avoiding control duplication).
3. **Subassembly Layout** *(shown when the step has a subassembly · Scope: `This step`)*
   - **Display Style**: `Inline Callout Box` vs. `Separate Full Pages`.
   - **Callout Box Position**: `Side-by-Side` vs. `Stacked Vertically`.
4. **Pagination & Page Break** *(Scope: `This step`)*
   - **Start Step N on a New Page** toggle with clear explanation of pinned page breaks.
   - **`Open Page Setup…`** shortcut for manual-wide paper size, grid layout, and step range groups.
5. **Page Notes & Images** *(Scope: `This page`)*
   - Inline builder note text input (`+ Add Note`) replacing `window.prompt()`.
   - **`+ Add Image / Logo`** upload button.
   - Live list of existing notes/images on the current page with inline `Delete` and a **`Move in Arrange →`** shortcut.

---

## Pure Capability Module

[`src/engine/stepToolbar.ts`](../src/engine/stepToolbar.ts) centralizes:
- `getVisibleModeTabs(pageKind)` — canonical bottom mode pill tab visibility per page kind.
- `resolveStepToolbarCapabilities(input)` — computes `hasPartsBox`, `hasMovableCallout`, `hasMovableElements`, `hasCustomCameraAngle`, `hasCustomArrangeLayout`, `canApplyAngleToFollowing`, `showMinifigSettings`, and `showSubassemblySettings`.
- `clearStepCameraOverride(override)` & `clearStepArrangeOverride(override)` — targeted non-destructive reset helpers.
- `MINIFIG_STYLE_OPTIONS` & `FOCUS_MODE_OPTIONS` — canonical labels and plain-English descriptions.

Unit tests live in [`src/engine/__tests__/stepToolbar.test.ts`](../src/engine/__tests__/stepToolbar.test.ts).
