# Step Page High-Resolution Model Rendering Design

## Overview

Models rendered on instruction step pages (both on-screen in the Studio editor and in exported PDF / Interactive 3D HTML manuals) use a unified, pure resolution-sizing engine (`src/engine/stepRenderResolution.ts`) combined with WebGL supersampling, smooth curved procedural geometry, mipmapped/anisotropic decal filtering, and zoom-aware in-place sharpening.

## Architecture

### 1. Pure Resolution Sizing Engine (`src/engine/stepRenderResolution.ts`)
- **`computePreviewResolutionScale(dpr, zoom)`**:
  - Establishes a minimum **2.0×** supersampling floor even on `1×` desktop displays and supports up to **3.0×** native Retina screens (`iPhone` / `iPad Pro`).
  - Boosts smoothly with page zoom (`zoom > 1.05`, up to `4.5×` total multiplier before per-slot caps).
- **`computeStepSlotRenderSize(input)`**:
  - Computes WebGL framebuffer dimensions from each step slot's **actual visual aspect ratio** (clamped to `[0.72, 2.25]`) rather than fixed landscape dimensions, eliminating wasted letterboxing pixels on tall portrait and 2-up side-by-side slots.
  - Enforces crisp resolution floors (`1600+` px wide on 1-up, `1050+` px on 2-up, `960+` px on 4-up compact slots) and scales cleanly up to `2400px` max edge (`4.2M` px budget) on screen and `2800px` max edge (`5.8M` px budget) in PDF export, clamped against the device's WebGL `MAX_VIEWPORT_DIMS` / `MAX_RENDERBUFFER_SIZE`.
- **`computeMinifigDiagramRenderSize(input)`**:
  - Removes the legacy `1.5×` resolution cap on Exploded Stack and Sequential Step-by-Step minifigure diagrams.
  - Inside `renderMinifigExplodedDiagram` and `renderMinifigSequentialStage`, each sub-render (exploded stack, assembled figure, handheld accessory callouts, and peach accessory pills) is supersampled `1.5×`–`2.0×` before high-quality downsampling (`imageSmoothingQuality = 'high'`).
- **`computePdfPagePixelDimensions(pageWpt, pageHpt, pageKind)`**:
  - Upgrades PDF step/BOM/divider pages from `1.45×` points (~104 DPI) to **`2.5×` points (~180 DPI)** (e.g., `1980 × 1530` for US Letter Landscape, capped at `2500px` long edge) and JPEG quality `0.92`.
  - Renders each PDF step model at `1.5×` supersampling over its drawn slot dimensions, downsampled onto the PDF canvas with `imageSmoothingQuality = 'high'`.

### 2. Zoom-Aware In-Place Sharpening
- During pinch-zoom, wheel-zoom, or toolbar zoom, the page stage continues to transform smoothly at 60fps via CSS `translate3d(...) scale(...)`.
- Once zoom settles (`180ms` debounce), `refreshStepModelsForZoom()` checks `shouldUpgradeStepRenderForZoom()` for each visible step slot.
- Standard steps reuse their cached `info.snap.mesh` directly via `renderMeshSnapshot()` (zero mesh rebuild, zero DOM flicker) and swap `img.src` in place at up to `2400px` resolution.

### 3. WebGL Framing, Decal Filtering & Procedural Geometry Detail
- **Portrait-safe Orthographic Framing (`WebGLBrickEngine.computeMVP`)**: When a slot canvas is taller than wide (`aspect < 1`), vertical `halfH` expands by `1 / aspect` so wide models never clip horizontally while filling portrait slots at full resolution.
- **Texture Filtering (`WebGLBrickEngine.getOrCreateGlTexture`)**: Generates mipmaps (`LINEAR_MIPMAP_LINEAR`) for power-of-two printed decals and enables `EXT_texture_filter_anisotropic` (up to `8×`) when supported, eliminating aliasing shimmer on minifigure faces and printed tiles.
- **Procedural Geometry Smoothness (`buildMeshBuffers`)**: Steps with `<= 320` parts use smooth vertex normals (`pushTriSmooth`) and higher radial segment counts on studs (`14` vs `8`), cylinders, wheels, minifigure heads, limbs, and curved slopes while retaining crisp technical instruction edge outlines (`gl.LINES`).
- **Secondary Step Thumbnails**: Upgraded PLI part thumbs (`360×360`), submodel intro banners (`480×300` screen / `520×320` PDF), attached submodel PLI cards (`360×270`), minifigure prep/attach PLI cards (`320×320`), subassembly callouts (`380×260 × resScale`), and 1:1 minifigure cards (up to `960px` tall).
- **Interactive 3D HTML Export**: Raises the WebGL DPR floor/cap to `[1.5, 3]` so exported interactive viewers stay crisp on 1× through 3× Retina displays.
