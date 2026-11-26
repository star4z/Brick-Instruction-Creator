# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Hobbyist MOC designers** turning digital models into clear, publishable instruction manuals to share with communities (such as Rebrickable), friends, or fellow builders.
- **Personal MOC builders** generating step-by-step manuals for their own physical builds and custom kits.
- **Casual builders, families, and educators** converting digital brick models into approachable, easy-to-follow building guides.

## Product Purpose

Brick Instruction Works converts BrickLink Studio (`.io`) and LDraw (`.ldr` / `.mpd`) models into publication-ready LEGO instruction manuals automatically—right in the browser—while giving builders non-destructive control over every page, step, camera angle, and visual style afterward.

Success means a builder can drop in a model file on desktop, tablet, or phone, immediately get an accurate, buildable, official-caliber manual with zero floating pieces and clear viewpoints, make targeted refinements without breaking later pages, and export clean printable PDFs or offline interactive HTML guides.

## Positioning

Unlike BrickLink Studio's instruction maker—where editing an early step cascades into broken page layouts across the rest of the manual—every override here (camera viewpoints, presentation offsets, hinge poses, multi-step layouts, and per-step page breaks) binds to stable semantic `StepId`s rather than page numbers. Combined with a hybrid physical-connectivity step generator (studs, anti-studs, SNOT, bars/clips, Technic pins/axles, hinges, repeated subassembly callouts, and visibility-aware minifigure placement) and global Viterbi camera optimization, the app produces structurally sound manuals automatically and survives re-imports without losing layout work.

## Operating Context

- **Equal priority across desktop and mobile/tablet**: Builders import models, inspect pages, arrange steps, lock 3D camera angles, customize themes, manage their Bricks Library, and export manuals on both desktop monitors and touch devices (including mobile Safari / iOS WebView).
- **Direct manipulation over a live manual page**: The primary working artifact is the rendered instruction manual page itself (zoomable/pannable stage), supported by focused workflows for import & model subdivision, page/step arrangement, cover & BOM setup, theme customization, diagnostics/model issues, bricks library management, and PDF/HTML/project export.
- **Offline-capable, client-side workflow**: Models, custom themes, and LDraw part libraries live locally in the browser (IndexedDB autosave, `.biw` portable project files, `.biwtheme` custom theme files, local `.dat`/`complete.zip` imports, and on-demand LDraw mirror fetches).

## Capabilities and Constraints

- **Core workflows to preserve**:
  - Model import (`.io`, `.ldr`, `.mpd`) with smart re-import diffing, missing-parts fetch prompt, and large/elongated model subdivision wizard.
  - Full-screen zoomable live manual stage with semantic per-step overrides (camera orbit/lock, exploded offsets, hinge poses, callouts, per-step page breaks).
  - 3-tier cascading manual styling (opinionated theme presets, global design tokens, custom theme editor, per-step overrides) plus Cover Page and Bill of Materials (BOM) configuration.
  - Bricks Library browser with searchable 3D part preview and local/remote LDraw library management.
  - Diagnostics & Model Issues inspector (floating parts, missing shapes, tolerance warnings).
  - Exports: high-resolution streaming PDF 1.4 (desktop & iOS WebView safe, with bookmarks & clickable links), self-contained offline Interactive 3D HTML Viewer, BrickLink XML / Rebrickable CSV BOM export, printable CSS layout (`@media print`), and portable `.biw` project / `.biwtheme` custom theme save/load.
- **Technical & deployment constraints**:
  - 100% client-side static TypeScript + Vite + Tailwind CSS + custom WebGL1 + zero-dependency PDF 1.4 web app (`base: './'`).
  - Deployed to GitHub Pages and verified for Neocities static hosting compliance (`< 5 MB` per output file, allowed static extensions only, checked via `npm run check:neocities`).
  - Existing DOM runtime hooks (`src/studioRuntime.ts` bindings in `index.html`) and Vitest engine/UI safety suite (`npm test`) must remain intact and passing.

## Brand Commitments

- **Confirmed product name**: **Brick Instruction Works** — dry, literal, industrial-era institutional naming describing exactly what the tool produces.
- **Logo**: Redesigned geometric industrial mark replacing the old three-stripe ribbon (`public/logo.svg`), aligned with the Billund Print-Proofing Table visual system.

## Evidence on Hand

- Live application codebase (`index.html`, `src/studioRuntime.ts`, `src/engine/`, `src/themes/`, `src/cover/`, `src/export/`, `src/storage/`) and architectural design docs under `docs/` (`docs/ARCHITECTURE.md` and feature specs).
- Built-in manual output themes (Classic Manual Blue, Modern Studio White, Collector 18+ Dark, Drafting Blueprint, Technical Gray, and additional craft presets) and bundled demo/test fixtures.
- **Absences not to fabricate**: No external customer testimonials, user-count metrics, pricing tiers, or press quotes exist.

## Product Principles

1. **The manual page is the hero**: The builder's rendered instruction page deserves maximum visual calm and clarity; editing controls exist to serve the page, not compete with it.
2. **Non-destructive confidence**: Every structural edit, theme tweak, or re-import should feel safe, reversible, and locally scoped—never threatening downstream pages.
3. **Approachable for casual builders, sharp for MOC veterans**: First-run import and automatic generation should feel effortless for a family or hobbyist, while deep controls (camera locks, SNOT callouts, page breaks, BOM, custom themes) stay fast and discoverable without clutter.
4. **First-class touch and desktop ergonomics**: Controls, sheets, popovers, and stage navigation must feel intentional and comfortable on phones, tablets, and desktop screens alike—not a desktop tool shrunk down or a mobile sheet stretched out.
5. **Self-contained craft**: Fast, client-side, print-ready, and offline-resilient with zero backend lock-in.
