# Part Textures & Printed Minifigure Decals Design

## Problem Statement

Most modern LEGO minifigure heads (`bl_3626pb*`, `3626cpb*`, `28621pb*`), printed torsos (`bl_973pb*`), and decorated bricks in BrickLink Studio `.io` files do **not** encode their artwork as multi-color LDraw polygons. Instead, BrickLink Studio embeds RGBA PNG decals directly inside `model2.ldr` using PartDesigner/Studio meta-commands (`0 PE_TEX_PATH`, `0 PE_TEX_NEXT_SHEAR`, `0 PE_TEX_INFO <base64 PNG>`) paired with per-vertex UV coordinates on type-3/type-4 geometry lines (or a 16-float planar box projection). Modern LDraw parts also use `0 !TEXMAP` (`PLANAR`, `CYLINDRICAL`, `SPHERICAL`) paired with `0 !DATA` embedded PNGs or `parts/textures/*.png`.

Previously, the `.dat` compiler ignored `0 PE_TEX_*` directives, discarded trailing UV coordinates, lacked WebGL texture sampling, and mapped only ~55 LDraw color IDs (missing several skin/lip/pastel tones and `0x2RRGGBB` direct RGB colors). As a result, only legacy polygon-printed heads (such as `3626cp01`) displayed faces, while almost all modern BrickLink Studio minifigures rendered as blank solid-color heads and torsos.

## Architecture

### 1. Texture Registry & Synchronous Pre-Decoding (`src/engine/textureStore.ts`)
- Deduplicates base64 PNG payloads via a deterministic 64-bit FNV-1a content fingerprint (`hashTextureBase64`), ensuring repeated minifigures/prints share one GPU `WebGLTexture`.
- Extracts embedded textures from four sources:
  1. `0 PE_TEX_INFO` lines inside `model2.ldr` / `.mpd` / user-library `.dat` files.
  2. `0 !DATA <filename>` base64 blocks in `.mpd` / `.dat` files.
  3. Bundled image files inside `.io` or LDraw `complete.zip` archives (excluding `thumbnail.png`).
- Pre-decodes all registered textures in parallel (`predecodeAllPending()`) during async import / session restore so every synchronous WebGL render (step snapshots, minifigure exploded stacks, 1:1 scale boxes, PLI thumbnails, cover hero renders, PDF/HTML exports) has decoded images immediately available on frame 1.
- Provides a lazy decode + debounced re-render fallback for textures discovered after initial load.

### 2. LDraw & Studio `.dat` Compiler (`src/engine/datCompiler.ts`)
- **`PE_TEX_PATH` / `PE_TEX_NEXT_SHEAR` / `PE_TEX_INFO`**:
  - Tracks 0-based type-1 subfile indices (`subfileLineIndex`) and hierarchical path tails (including `-1` for current file + descendants, `1` / `2` for dual-sided minifigure heads, and multi-hop paths such as `0 4`).
  - **Explicit UV mode** (`0 PE_TEX_INFO <base64>`): reads per-vertex `(u, v)` pairs from type-3 (`17` tokens) and type-4 (`22` tokens) lines and preserves exact vertex-to-UV correspondence across safe concave/bowtie quad triangulation.
  - **Planar projection mode** (`0 PE_TEX_INFO tx ty tz m00..m22 minX minY maxX maxY <base64>`): transforms the projection frame into root compiled LDraw space, filters triangles against the oriented bounding box and projection axis normal, and projects `(u, v)` coordinates.
- **Official LDraw `!TEXMAP`**:
  - Resolves `PLANAR`, `CYLINDRICAL`, and `SPHERICAL` blocks when the referenced texture exists in `textureStore`, computing exact OpenGL-convention UVs (`v = 0` bottom, `v = 1` top).
  - Gracefully falls back to `0 !TEXMAP FALLBACK` polygon geometry when the texture image is unavailable.
- **Direct RGB Colors (`0x2RRGGBB`) & Studio `-1`/`-2` Inheritance**:
  - Upgrades `triCols` to `Int32Array`, encodes `0x2RRGGBB` direct colors with `DIRECT_RGB_COLOR_FLAG` (`0x2000000`), and validates them via range-checked `isDirectRgbColor(cid)` (`[0x2000000, 0x3000000)`) so signed negative values can never false-match via bitwise `&`.
  - Normalizes BrickLink Studio `model2.ldr` negative sentinel color IDs (`-1` main / `-2` edge) to inherit `curColor` just like LDraw `16` / `24`, preserving true brick colors and avoiding unnecessary `triCols` allocations on single-color `.io` parts.
- Emits textured geometry in `CompiledDatMesh.texBatches` alongside untextured `tris`/`norms`/`edges`, contributing to bounding box calculations so camera framing remains exact.

### 3. WebGL Decal Compositing (`src/studioRuntime.ts` & `src/cover/studioPhotoRenderer.ts`)
- **Step & Live Interactive Renderer (`WebGLBrickEngine`)**:
  - Adds `texProg` (`vsTex` / `fsTex`) with a per-context `glTextures` cache (`UNPACK_FLIP_Y_WEBGL = 1`, `CLAMP_TO_EDGE`, `LINEAR`).
  - Composites RGBA decal pixels over the underlying plastic color (`mix(vCol.rgb, decalRgb, decal.a)`) before applying directional/hemisphere or hero lighting, so transparent decal regions show exact LEGO plastic color and previous-step fading (`uFadeMix`) fades artwork harmoniously with bricks.
  - Uses `gl.polygonOffset(0.5, 0.5)` so coplanar decal surfaces win depth ties over untextured base surfaces while crisp edge lines still draw cleanly on top.
- **Photorealistic Cover Hero Renderer (`StudioPhotoRenderer`)**:
  - Adds `aUv`, `uUseDecal`, and `uDecalMap` (`TEXTURE3`) to `VS_PBR` / `FS_PBR`, compositing decals in sRGB prior to linear-space GGX PBR shading, softbox reflections, shadow maps, and SSAO.
- **Import & Alias Resolution**:
  - Indexes `0 BL_Item_No <id>` aliases and checks `bl_*` / `*-bl` keys before falling back to unprinted base molds.
  - Prevents `.mpd` flattening from splitting `.dat` parts containing `PE_TEX_INFO` / `PE_TEX_PATH` / `!TEXMAP` into separate sub-parts.
  - Expands the LDraw `COLORS` table with the full standard `LDConfig` palette (skin tones, coral, pinks, metallics, sand colors) so polygon-printed faces never silently fall back to base head color.
