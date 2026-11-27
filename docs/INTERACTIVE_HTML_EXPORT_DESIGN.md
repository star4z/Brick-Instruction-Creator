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
  - 1-finger drag / left-mouse drag: smooth 360° orbit rotation with constant `+Y` up vector (`el` clamped to `[-85°, 85°]`) so crossing the horizontal midline never flips the model upside down.
  - 2-finger pinch / mouse wheel / `+` `−` buttons: smooth zoom (`0.4×–4.8×`).
  - 2-finger drag / Shift+drag / right-mouse drag: smooth 2D pan.
  - Double-tap / `R` / Reset button: smoothly eases camera back to the step's authored angle.
  - First (`#btnFirst`) / Prev / Next / Last (`#btnLast`) dock buttons, keyboard `←`/`→`/`Home`/`End`, linear scrubber slider, and full Pages & Steps drawer (with scroll-aware jump-to-top and jump-to-bottom arrow buttons when the list overflows). Steps are flattened into one linear progression with no left-side sub-step tab clutter or redundant cover play button.
  - Toggleable Parts Needed (PLI) tray, Highlight New Pieces, X-Ray Previous Assembly, and an animated Piece Placement Offset toggle button (`#btnToggleExplode`) — with Highlight, X-Ray, and Offset hidden automatically when a step has no previous pieces being attached to.

## In-App Live Preview (iOS & Desktop)
- **No-Download Preview Modal (`#interactiveHtmlPreviewModal`)**: Users can test and explore the exact generated Interactive 3D HTML viewer without downloading a file via **Preview 3D Interactive Viewer** in either the Side Menu (`#menuPreviewHtmlBtn`) or the Export & Print Modal (`#btnPreviewInteractiveHtml`).
- **Full iOS Safari Support & Memory Guards**: Because the preview loads the generated single-file HTML into a full-screen same-origin `blob:` `<iframe>` (`#interactiveHtmlPreviewFrame`, permitted by `frame-src 'self' blob:` in CSP), JavaScript and WebGL run natively right inside iOS/iPadOS Safari without triggering the iOS local-file download warning or popup blockers. To prevent iOS Safari Jetsam OOM crashes on large models while keeping models crisp:
  - Live preview sets `skipStaticFallback: true` (skipping unused Quick Look JPEG snapshots, duplicate static fallback DOM, and external top-right editor link) and drops the generated `htmlDoc` string immediately after creating the `blob:` URL.
  - Opening the preview disposes the parent studio's active WebGL engine (`activeLiveEngine`), releases `studioPhotoEngine` transient buffers, and shrinks `snapshotCanvas` to `1×1` while hidden, restoring the current studio page when closed.
  - Composite parts (`part.children`, e.g., minifigure legs/torsos, hinged assemblies) are recursively expanded to leaf prototypes so every sub-part renders with its exact geometry and decals.
  - Inside the viewer, part prototypes are decoded lazily on first GPU upload (`ensureProtoGpu`) with immediate CPU array & base64 release (`pr.raw = null`, `DATA.prototypes = []`), WebGL DPR/canvas dimensions target crisp Retina (`2.0×` DPR, `2048px` max dimension on touch/compact viewports), dark/light glass contrast (`--glass-text`) adapts automatically from theme luminance, and `pagehide` explicitly deletes GPU buffers/textures and calls `WEBGL_lose_context.loseContext()`.
- **Minimal Preview Chrome & Clean Teardown**: A compact safe-area-aware header bar provides a **Download HTML** button (closes the preview to free GPU RAM, shows the iOS warning if on iOS, and builds the full standalone export with Quick Look fallbacks) and a **Close** button (also wired to `Escape` and workspace reset). Closing dispatches `pagehide` inside the iframe, navigates it to `about:blank`, and calls `URL.revokeObjectURL()`.

## Security, iOS Compatibility & Robustness
- **iOS/iPadOS Export Warning Dialog**: When a user on iOS or iPadOS (including iPadOS 13+ desktop-mode Safari, detected via `isIosDevice()`) selects **Export 3D Interactive Viewer (HTML)** from either the Side Menu (`#menuExportHtmlBtn`) or the Export & Print Modal (`#btnExpInteractiveHtml`), `runInteractiveHtmlExport()` opens an amber warning dialog (`getIosHtmlExportWarningDialog()` via `#confirmActionModal` with `tone: 'warning'`) explaining that exported HTML files cannot be viewed directly on iOS/iPadOS because Files, Mail, Messages, and Safari block scripts in local HTML files, and pointing them to **Preview 3D Interactive Viewer** to view/test right in the app on iOS. Users can **Cancel** (default focus, keeping them on the Export modal where PDF export and Live Preview are available) or **Export Anyway** if they intend to share the file to a Mac, Windows PC, or Android device.
- **iOS Quick Look Fallback (`#noJsFallback`)**: iOS Files, Mail, Messages, and AirDrop open `.html` files in Quick Look (`QLPreviewController`), which disables `<script>` execution. The exported HTML renders a complete, scrollable static illustrated manual (Cover, step renders + parts boxes, Parts List, and Back Cover with a `Brick Instruction Creator ↗` link) by default alongside a brief note explaining that opening in a browser unlocks interactive 3D rotation & zoom.
- **Graceful 3D Activation**: When opened in any JS + WebGL browser, the boot script validates shader compilation/linking and enables `html.js-3d-active` inside a `try/catch`, hiding `#noJsFallback` and launching the full-screen 3D viewer. If WebGL is unavailable or throws, `#noJsFallback` stays visible so the user never sees a blank screen.
- **Strict WebGL1 Attribute Hygiene**: Explicitly resets enabled vertex attribute arrays (`resetAttribs`) between triangle, decal-textured, and edge-line shader passes for iOS Safari compatibility, and respects `100dvh` + `env(safe-area-inset-*)`.
- All embedded JSON is serialized via `serializeJsonForScriptTag()` (escaping `<`, `>`, `&`, U+2028, U+2029) so model metadata can never terminate the inline `<script>` tag.
- Supports `navigator.share({ files })` on iOS/mobile with automatic blob download fallback on desktop.
