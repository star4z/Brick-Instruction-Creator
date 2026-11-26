# 2026 Full-Program Audit & Remediation Summary

This document tracks the comprehensive static-analysis and live-runtime audit of **Brick Instruction Works** and the phased remediation applied across security, exporters, 3D WebGL rendering, core layout/step algorithms, UI/accessibility, and CI/build hygiene.

## Phase 1 — Security, Exporters & Data Integrity
- **Streaming PDF Export (`src/export/pdfBinary.ts`, `src/studioRuntime.ts`)**: Added zero-copy `buildPdfBinaryChunks()` streaming directly into a `Blob`, avoiding full-document `Uint8Array` memory doubling on large manuals; added PDF `/Info` metadata, `/Outlines` chapter bookmarks, `/TrimBox`, strict `https?://` `/URI` annotation validation, and JPEG SOI + finite positive dimension guards. Added concurrency locking and `try/catch/finally` around `runPdfExport()`.
- **Interactive 3D HTML Export (`src/export/interactiveHtmlExporter.ts`, `src/studioRuntime.ts`)**:
  - Made the pre-export step preview loop asynchronous with periodic yields (`setTimeout(0)`) so multi-step models no longer freeze the main thread.
  - Sanitized CSS color tokens, validated `editorUrl` schemes (`https?://`), and enforced `data:image/` on embedded `<img>` tags (`sanitizeExportImageUrl` / `safeImgSrc`).
  - Defined missing `--border` and `--surface` CSS custom properties.
  - Fixed `hexToRgb01` so `#000000` renders as true black rather than falling back to magenta.
  - Fixed broken BOM Jump-to-Step (`vi.step && Array.isArray(vi.step.pli)` + `vi.step.stepNum`), added `webglcontextlost`/`webglcontextrestored` handling, added hero 3-point specular lighting and normal zero-length guards to `fsTex`, fixed double-tap drag false reset, added keyboard accessibility (`tabindex="0"`, `role="checkbox"`, `aria-checked`) on BOM items, added `role="dialog" aria-modal="true"` on the Pages drawer, and guarded global `keydown` against text inputs.
- **Static HTML Exporter (`src/export/htmlExporter.ts`)**: Fixed stored XSS vulnerabilities by escaping `</script>`, sanitizing CSS colors, and escaping/validating HTML and image attributes.
- **Storage & Theme Hardening (`src/storage/fileFormats.ts`, `src/storage/projectStorage.ts`, `src/themes/customThemes.ts`, `src/themes/customFonts.ts`, `src/studioRuntime.ts`)**:
  - Recursively stripped `__proto__`, `constructor`, and `prototype` keys in `parseStudioProjectJson`.
  - Cached a singleton IndexedDB handle in `openSessionDB()` with `onclose`/`onversionchange`/`onblocked` reset and `QuotaExceededError` handling; cleared rejected `dbPromise` in `projectStorage.ts` and `partsProvider.ts`; fixed `getCachedCount()` double-counting.
  - Hardened `SAFE_RGBA_RE`, `applyThemeBackgroundToElement`, `localStorage` `try/catch` guards, `FontFace` URL quoting, and non-spreading chunked base64 encoding.
  - Preserved all visual settings (`showProgressBar`, `arrow*`, `highlight*`, `fade*`, `showRotCues`, `customPaperW/H`) in `.biw` project save/load.

## Phase 2 — 3D WebGL Renderer, Shaders, Geometry, Cover & Caching
- **Conditional-Line Stray Streaks (`src/studioRuntime.ts`, `src/cover/studioPhotoRenderer.ts`)**: Fixed diagonal streak artifacts across steps by canonicalizing endpoint ordering (`swapOrder`) in `vsCondLine` and `VS_COND_LINE` and clipping rejected lines outside NDC.
- **WebGL Robustness (`src/studioRuntime.ts`, `src/cover/studioPhotoRenderer.ts`, `src/engine/stepRenderResolution.ts`)**: Added `webglcontextlost` recovery & `isContextLost()` guards, `highp` PBR fragment precision, zero-length normal guards, `MAX_TEXTURE_SIZE` clamping, shader compile/link checks + `gl.deleteShader`, `blendFuncSeparate`, cofactor normals in `xformNorm`, POT mipmaps for decals, FBO partial-init cleanup, `impPreviewEngine.dispose()` on modal close, and `screenMaxPixels` budget clamping in `computeCoverHeroRenderSize`.
- **Cover & QR (`src/cover/coverLayout.ts`, `src/cover/qrCode.ts`)**: Clamped `el` in `normalizeBackMeta`, eliminated gimbal lock in `computeCameraBasis` at `el = ±90°`, upgraded default QR `quietZone` to ISO 4 modules, escaped SVG attributes, and drew contiguous horizontal runs in `drawQrCanvas`.
- **Caching & Chunks (`src/engine/pageRenderCache.ts`, `src/engine/partsChunks.ts`, `src/engine/textureStore.ts`, `src/engine/datCompiler.ts`)**: Included `hingeDeg` and arrow override fields in `buildLiveStepRenderCacheKey`; reset `manifestPromise` on failure and decoupled caller `AbortSignal` from shared chunk fetches; matched `PE_TEX_INFO` case-insensitively without marking decode timeouts permanently failed; fixed fallback quarter-torus (`t*q*`) and `box5`/`box4` bounds in `datCompiler.ts`; guarded `fetchPartsOnline` against model-switch races.

## Phase 3 — Core Engine & Algorithms
- Fixed negative-Y deck sentinel (`chosenDeckY: number | null`) in `src/engine/undersideAssembly.ts`.
- Fixed anti-parallel vector alignment in `mat3AlignVectors` and zero-step guard in `quantize` (`src/engine/math.ts`).
- Fixed `'flat'` arrow winding and invalid hex fallback in `src/engine/placementArrows.ts`.
- Generated unique SVG gradient IDs in `buildAttachmentStarburstSvg` and fixed CCW `translate(44,0)` in `buildCurvedMotionArrowSvg` (`src/engine/calloutCraft.ts`).
- Made `compareFrontierCandidates` transitive via discrete buckets (`src/engine/dynamicStepSizer.ts`).
- Fixed `packSmartAutoPage` early-break so `2×2` (`k = 4`) is evaluated when `3×1` (`k = 3`) fails (`src/engine/pageLayout.ts`).
- Added missing fields to `isUnmodifiedLegacyBomConfig`, removed readonly mutation in `filterLibraryItems`, updated `serializePartOffsets` to hash `x/y/z/tilt`, detected `_step_split_` and `bm.el` in `summarizeManualEdits`, scaled minifig accessory `dy` by accessory height, shrunk 3+ digit bag numbers in `buildNumberedBagSvg`, checked `secondaryDefaultCombo` in `findShortcutConflict`, avoided `partCountByColor` double-counting, remapped `attachToSectionId` in `mergeProposedSections`, and sanitized CSS colors + added `roundRect` fallback in `src/engine/buildRoadmap.ts`.

## Phase 4 — UI, UX, Accessibility & CSS
- Removed `maximum-scale=1.0, user-scalable=no` from `index.html` viewport meta to restore pinch-zoom accessibility.
- Added `role="dialog"`, `aria-modal="true"`, and `aria-label` to all modals; added `role="alert"` and high-contrast positioning to `#errorBanner`; added `role="status" aria-live="polite"` to `#toast`; added `role="progressbar"` to progress bars and `aria-label` to library search inputs.
- Fixed multi-control `<label>` conflicts on `#arrowColor` and `#highlightColor` and `#errListBody` flex `min-h-0` conflict.
- Added missing `@keyframes pressRevealUp`, restricted `#zoomControlsBar` touch hiding to `@media (pointer: coarse) and (max-width: 639px)`, added `@page { margin: 0; }` for print, fixed `Bungee`/`Bangers` `font-weight` in `src/themeFonts.css`, and deduplicated the Import Wizard part-count subtitle.

## Phase 5 — Build, E2E & CI
- Added `configurePreviewServer`, stream error handling, `Cache-Control` headers, and live-bundle `manualChunks` in `vite.config.ts`.
- Narrowed console error suppression in `e2e/auditHelpers.ts`, added manifest JSON validation to `scripts/check-neocities.mjs`, and added `npm test` to `.github/workflows/ui-audit.yml`.
- Added targeted regression unit tests (`src/__tests__/remediationFixes.test.ts`) and E2E accessibility + async Interactive HTML export coverage (`e2e/ui-audit.spec.ts`).
