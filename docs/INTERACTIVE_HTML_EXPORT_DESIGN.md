# Interactive 3D HTML Export Design

## Purpose
Provide a shareable, offline-capable **Interactive 3D Instruction Viewer** exported as a single `.html` file—similar to the LEGO Builder app—without requiring users to upload arbitrary model files to a hosted server.

## Core Design Principles
1. **Zero Server Uploads / Single File**: Exports a self-contained `.html` file (`<model-slug>-interactive-3d.html`) with no external CDN script dependencies so it can be shared via AirDrop, Messages, email, or local files and opened offline on iOS Safari, Android, and desktop browsers.
2. **Full Manual Page Fidelity + 3D Everywhere**: Mirrors the PDF manual's page sequence—Cover, Section Dividers, Submodel Pages, Build Steps, Divider Pages, Build Complete, Parts List (with tap-to-check inventory), and Back Cover. Editorial pages (Cover, Build Complete, Section Dividers, Back Cover) also present a freely rotatable 3D model.
3. **Link Back to the Studio**: Includes a clean top-bar link and Back Cover CTA pointing to the live editor (`https://star4z.github.io/Brick-Instruction-Creator/`).

## Asset Packaging & WebGL Architecture
Implemented in [`src/export/interactiveHtmlExporter.ts`](../src/export/interactiveHtmlExporter.ts) and wired in [`src/studioRuntime.ts`](../src/studioRuntime.ts):

- **Deduplicated Prototypes**: Each unique `(partId, colorId)` combination is compiled once at the identity transform via `buildMeshBuffers`, storing base64-encoded `Float32Array` positions/normals/UVs/edges, `Uint8Array` RGBA colors, and a precomputed local AABB `[minX, minY, minZ, maxX, maxY, maxZ]`.
- **Embedded Decal Textures**: Any referenced printed minifigure faces or decals from `textureStore` are stored once in `payload.textures` as PNG data URLs and uploaded asynchronously to WebGL textures on viewer startup.
- **Per-Instance Transforms**: Each placed brick instance stores only `{ k: prototypeIndex, x, y, z, m? }` (omitting `m` when identity). The embedded vanilla WebGL renderer caches GPU VBOs per prototype and renders instances using `uModel` (`mat4`) and inverse-transpose `uNormMat` (`mat3`) uniforms, keeping step navigation instantaneous and file sizes compact.
- **Interactive Controls**:
  - 1-finger drag / left-mouse drag: unconstrained 360° orbit rotation.
  - 2-finger pinch / mouse wheel / `+` `−` buttons: smooth zoom (`0.4×–4.8×`).
  - 2-finger drag / Shift+drag / right-mouse drag: smooth 2D pan.
  - Double-tap / `R` / Reset button: smoothly eases camera back to the step's authored angle.
  - Keyboard `←`/`→`, scrubber slider, multi-step page switcher pills, and full Pages & Steps drawer (with scroll-aware jump-to-top and jump-to-bottom arrow buttons when the list overflows).
  - Toggleable Parts Needed (PLI) tray and Highlight New Pieces toggle.

## Security, iOS Compatibility & Robustness
- **iOS Quick Look Fallback (`#noJsFallback`)**: iOS Files, Mail, Messages, and AirDrop open `.html` files in Quick Look (`QLPreviewController`), which disables `<script>` execution. The exported HTML renders a complete, scrollable static illustrated manual (Cover, step renders + parts boxes, Parts List, and Back Cover with a `Brick Instruction Creator ↗` link) by default alongside a brief note explaining that opening in a browser unlocks interactive 3D rotation & zoom.
- **Graceful 3D Activation**: When opened in any JS + WebGL browser, the boot script validates shader compilation/linking and enables `html.js-3d-active` inside a `try/catch`, hiding `#noJsFallback` and launching the full-screen 3D viewer. If WebGL is unavailable or throws, `#noJsFallback` stays visible so the user never sees a blank screen.
- **Strict WebGL1 Attribute Hygiene**: Explicitly resets enabled vertex attribute arrays (`resetAttribs`) between triangle, decal-textured, and edge-line shader passes for iOS Safari compatibility, and respects `100dvh` + `env(safe-area-inset-*)`.
- All embedded JSON is serialized via `serializeJsonForScriptTag()` (escaping `<`, `>`, `&`, U+2028, U+2029) so model metadata can never terminate the inline `<script>` tag.
- Supports `navigator.share({ files })` on iOS/mobile with automatic blob download fallback on desktop.
