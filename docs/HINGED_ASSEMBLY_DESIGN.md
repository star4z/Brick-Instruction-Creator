# Hinged Sub-Assembly Upright Construction & Deferred Tilt Design

## Overview
Official LEGO instruction manuals never ask a builder to insert a hinge brick top plate (`3938`, `6134`, etc.) at an arbitrary oblique angle (e.g., `8.6°`) and stack an angled windshield, canopy, or hood in mid-air before the adjacent roof or frame behind it exists.

Instead, official manuals follow a four-stage physical build sequence:
1. **Place hinge bases first**: Every stacked upright hinge base (e.g., `3937` Hinge Brick 1×2 Base) is placed strictly before its mating hinge top plate (`3938`/`6134`).
2. **Insert hinge top plates straight down from the top (`+Y`) at `0°` upright**: Open-top interlocking hinge plates snap vertically downward into the base's open top U-slot rather than sliding sideways along the hinge pin.
3. **Build attached hinged structure straight up-and-down (`0°`)**: All bricks, windows, glass, plates, and slopes mounted to the hinge top plate are stacked cleanly upright (`0°`) with vertical placement arrows.
4. **Emit a dedicated Hinge Tilt (`Angle`) step after rest-stop structure is attached**: Once both the hinged assembly AND all stationary rest-stop parts near the final tilted pose (such as cab frame edges or a separately attached removable roof module) are in place, a dedicated numbered step (`isHingePoseStep: true`, empty PLI box, subtle upright ghost, final tilted pose, and bold 3D curved red arrows) tilts the assembly smoothly onto its resting edge.

All detection, kinematics, collision checks, and timing rules are derived purely from 3D rigid-body geometry and official LDraw part semantics with zero model-specific or theme-specific heuristics.

## Architecture (`src/engine/hingedAssembly.ts`)

### 1. Hinge Base → Top Prerequisite Enforcement
`analyzeTiltedHingedAssemblies(parts, adj)` always records stacked `[hingeTopIdx, baseIdx]` pairs in `allBasePrereqPairs` — even when a hinge is built at `0°` — so vertical prerequisite maps (`belowMap`) always guarantee every hinge base precedes its hinge top plate, even when the top plate's lower tabs nest inside the base's U-slot (`top.min[1] < base.max[1]`).

### 2. Oblique Hinged Cluster Detection & Exact 3D Kinematics
- Identifies connected co-tilted part clusters (`3° <= tiltDeg <= 60°`, `>= 2` parts, consistent local-up direction within `3°`) anchored to one or more upright stationary hinge base(s).
- Computes the exact 3D hinge axis `axis = normalize(cross([0, 1, 0], meanUp))` and horizontal tilt tangent `tangent = normalize(cross(axis, [0, 1, 0]))`.
- Solves the exact 3D hinge pivot `P` along the hinge pin via rigid-body kinematics (`r = dTan / sin(theta)` between hinge base and hinge top origins, with overlap-midpoint fallback for end-to-end plate hinges).
- Applies the exact inverse rotation `-theta` around `(P, axis)` to every part in the cluster to obtain `uprightTransforms` (`0°`), verifying clearance against all stationary non-cluster parts so an upright pose is skipped if it would deeply interpenetrate an existing wall or frame.

### 3. Same-Section & Cross-Section Rest-Stop Deferral
- Scans stationary non-figure parts adjacent to the upper half of the final tilted bounding box (`finalBox`) on the `+tangent` tilt-target side (`within 24 LDU`) to collect `restStopIndices`.
- **Same-section / un-subdivided models**: `buildLocalSubmodelSteps` and the main build loop place the hinged assembly upright (`0°`) and emit `isHingePoseStep` via `flushReadyHingePoses()` as soon as both the hinged cluster and all `restStopIndices` are placed.
- **Subdivided modular models (`Detachable Sub-Assemblies` / `Body Sections`)**: `buildManualFromParsed` runs full-model `analyzeTiltedHingedAssemblies` before building section chapters. When a hinged assembly's `restStopIndices` include parts belonging to a **different** section module (e.g., a removable roof cap module attached later in `Connect Sections & Finish`), the owner section module builds and finishes the hinged assembly straight upright (`0°`), and `Connect Sections & Finish` emits the `isHingePoseStep` via `flushReadyJoinHingePoses()` immediately after that rest-stop module is attached.

### 4. Camera Orientation, 3D Curved Arrows, & Multi-Surface Parity
- **Front-facing 3/4 camera**: `optimizeManualStepCameras` supplies `[-tangent[0], 0, -tangent[2]]` as `engagedSideNormals` on `isHingePoseStep` so the camera automatically faces the outward-facing side of the hinged panel and the roof/frame edge it tilts onto.
- **High-curvature 3D curved tilt arrows**: Each `HingedAssemblySpec` emits `hinge_tilt` curved 3D arrow indicator(s) (paired left/right flanking arrows when `axisSpan >= 52` LDU, single centered arrow when narrow) arching cleanly over the upper rim from upright toward the resting edge (`50°..72°` legible arc even for small `8.6°` tilts).
- **Top-entry hinge insertion (`src/engine/placementArrows.ts`)**: `analyzeContacts` recognizes upright open-top coaxial interlocking parts (`isTopEntryInterlock`, requiring `coaxialXZ && !hangsOffOneSide && max[1] >= rb.max[1] - 1.5 && min[1] >= rb.min[1] + 2.0`), snapping `3938`/`6134` straight down from above (`+Y`) instead of pulling laterally.
- **Zero part double-counting & full surface parity**: `isHingePoseStep` carries `parts: []` and `hingePose: { posedParts, ghostParts, indicators, tangent }`, keeping BOM/Parts List counts exact, hiding the PLI box cleanly, substituting posed transforms in `getPreviousPartsForStep` and `getAllParts`, and rendering consistently across Live DOM preview, Live 3D Orbit, Overview thumbnails (`overviewPreviews.ts`), Apply-Camera thumbnails, PDF export, Print CSS, and Interactive 3D HTML export.
- **WebGL outline/transparency pass ordering**: `WebGLBrickEngine.draw()` draws hard and conditional brick outlines against the opaque depth buffer before blending transparent glass and translucent ghost triangles (and cleanly disables `xCol` after textured decal draws and `cCol` after conditional edge draws), eliminating depth-bleed artifacts on scenes with ghost parts.
