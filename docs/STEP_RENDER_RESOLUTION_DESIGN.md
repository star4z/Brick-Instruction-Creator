# Step Page High-Resolution Model Rendering Design

## Overview

Models rendered on instruction step pages (both on-screen in the Studio editor and in exported PDF / Interactive 3D HTML manuals) use a unified, pure resolution-sizing engine (`src/engine/stepRenderResolution.ts`) combined with WebGL supersampling, smooth curved procedural geometry, mipmapped/anisotropic decal filtering, and zoom-aware in-place sharpening.

## Architecture

### 1. Pure Resolution Sizing Engine (`src/engine/stepRenderResolution.ts`)
- **`computePreviewResolutionScale(dpr, zoom)`**:
  - Establishes a minimum **2.25×** supersampling floor even on `1×` desktop displays and supports up to **3.25×** on HiDPI/Retina screens (`iPhone` / `iPad Pro`).
  - Boosts smoothly with page zoom (`zoom > 1.05`, up to `5.0×` total multiplier before per-slot caps).
- **`computeStepSlotRenderSize(input)`**:
  - Computes WebGL framebuffer dimensions from each step slot's **actual visual aspect ratio** (clamped to `[0.72, 2.25]`) rather than fixed landscape dimensions, eliminating wasted letterboxing pixels on tall portrait and 2-up side-by-side slots.
  - Enforces high-resolution floors (`2400+` px wide on 1-up, `1550+` px on 2-up, `1450+` px on 4-up compact slots) and scales cleanly up to **`3600px`** max edge (`9.6M` px budget) on screen and **`3840px`** max edge (`11M` px budget) in PDF export, clamped against the device's WebGL `MAX_VIEWPORT_DIMS` / `MAX_RENDERBUFFER_SIZE`.
- **`computeMinifigDiagramRenderSize(input)`**:
  - Scales Exploded Stack and Sequential Step-by-Step minifigure diagrams up to `3600px` on screen and `3840px` in PDF export.
  - Inside `renderMinifigExplodedDiagram` and `renderMinifigSequentialStage`, each sub-render is supersampled `1.65×`–`2.0×` before high-quality downsampling (`imageSmoothingQuality = 'high'`).
- **`computePdfPagePixelDimensions(pageWpt, pageHpt, pageKind)`**:
  - Renders PDF step/BOM/divider pages at **`3.472×` points (~250 DPI)** (capped at `3400px` long edge, `9.2M` px budget) and Cover/Build Complete pages at **`4.167×` points (300 DPI)**.
  - Renders each PDF step model at `1.75×` supersampling over its drawn slot rectangle, downsampled onto the PDF canvas with `imageSmoothingQuality = 'high'`.

### 2. Zoom-Aware In-Place Sharpening
- During pinch-zoom, wheel-zoom, or toolbar zoom, the page stage continues to transform smoothly at 60fps via CSS `translate3d(...) scale(...)`.
- Once zoom settles (`180ms` debounce), `refreshStepModelsForZoom()` checks `shouldUpgradeStepRenderForZoom()` for each visible step slot.
- Standard and Studio High-Quality steps reuse their cached `info.snap.mesh` directly via `renderMeshSnapshot()` (zero mesh rebuild, zero DOM flicker) and swap `img.src` in place at up to `3600px` resolution.

### 3. Style Options: Studio High-Quality Step Render & Stark Black Outlines (`src/themes/customThemes.ts`)
Both options live under **Styles → Step Display** and are saved per theme (`.biwtheme`), per project (`.biw`), and in session preferences:
- **Studio High-Quality Render (`highQualityStepRender`)**:
  - Runs the cover's photorealistic multi-pass `StudioPhotoRenderer` (micro-beveled ABS bricks, 3× RGBA-packed softbox shadow maps, GGX Cook-Torrance PBR, procedural studio softbox reflections, ACES filmic tone mapping, and SSAO crevice occlusion) in orthographic step projection (`computeStudioOrthoCamera`) across live step pages, real-time drag-to-orbit (`#liveRotateCanvas`), zoom-aware sharpening, and PDF export.
- **Stark Black Outlines & Studs (`starkBlackOutlines`)**:
  - Renders crisp official LEGO-style pure black (`#000000`) outlines on all brick edges, Technic holes, and **both top rim and base ring** of every stud (automatically switching to crisp light-gray `#ccd4de` on near-black bricks with perceived luminance `< 56` so dark parts stay sharp and readable).
  - Applies a resolution-scaled screen-space multi-tap line pass (`uLineOffset` in both `WebGLBrickEngine` and `StudioPhotoRenderer`) so outlines remain bold and evenly weighted even at `2400–3600px` supersampled resolutions where WebGL `gl.lineWidth` is clamped to `1.0`.
  - Applies consistently across step models, subassembly callouts, Parts Box (PLI) thumbnails, BOM thumbnails, and PDF export.

### 4. Full Cover & Build Complete Camera Support (`src/cover/coverLayout.ts`, `src/studioRuntime.ts`)
- Cover and Build Complete pages in **Camera** mode now mount an interactive live 3D orbit canvas (`#liveHeroCanvas`) using `StudioPhotoRenderer` (rAF-throttled interactive resolution during drag, full 4K resolution on release) alongside full camera controls: **Drag 3D model to orbit**, live azimuth/elevation readout, **Top / Bottom** view toggle (`-75°` to `+75°`, auto-hiding the studio floor when viewing from underneath), **FR / BR / BL / FL** corner presets, **50%–200%** zoom stepper, keyboard flip shortcut, and **Reset Camera**.

### 5. WebGL Framing, Decal Filtering & Procedural Geometry Detail
- **Portrait-safe Orthographic Framing (`WebGLBrickEngine.computeMVP` & `computeStudioOrthoCamera`)**: When a slot canvas is taller than wide (`aspect < 1`), vertical `halfH` expands by `1 / aspect` so wide models never clip horizontally while filling portrait slots at full resolution.
- **Texture Filtering (`WebGLBrickEngine.getOrCreateGlTexture`)**: Generates mipmaps (`LINEAR_MIPMAP_LINEAR`) for power-of-two printed decals and enables `EXT_texture_filter_anisotropic` (up to `8×`) when supported, eliminating aliasing shimmer on minifigure faces and printed tiles.
- **Procedural Geometry Smoothness (`buildMeshBuffers`)**: Steps with `<= 320` parts (or `heroQuality`) use smooth vertex normals (`pushTriSmooth`) and higher radial segment counts on studs, cylinders, wheels, minifigure heads, limbs, and curved slopes while retaining crisp technical instruction edge outlines (`gl.LINES`).
- **Secondary Step Thumbnails**: Upgraded PLI part thumbs (`420×420`), BOM multi-span thumbs (up to `560px`), subassembly callouts (up to `2400px`), and section dividers (up to `3200px`).
- **Interactive 3D HTML Export**: Raises the WebGL DPR floor/cap to `[1.5, 3]` so exported interactive viewers stay crisp on 1× through 3× Retina displays.
