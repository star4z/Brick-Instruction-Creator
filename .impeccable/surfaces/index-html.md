---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: ["src/index.css","public/logo.svg"]
---

# Surface Brief — Brick Instruction Works Studio (`index.html`)

- **Scope**: Full studio UI baseline (`index.html`, `src/index.css`, `public/logo.svg`, and runtime chrome classes in `src/studioRuntime.ts`)
- **Visitor Mode**: Operate (code-led by contract; `.impeccable/config.json`'s `"buildPath": "comp"` applies to Persuade/Experience surfaces only)
- **Primary Task**: Import BrickLink Studio (`.io`) or LDraw (`.ldr`/`.mpd`) models, inspect and refine generated instruction manual pages non-destructively (camera angles, step arrangement, page breaks, themes, cover/BOM, Bricks Library, diagnostics), and export printable PDFs or offline interactive HTML guides across desktop, tablet, and mobile.
- **Constraints**: Preserve all DOM IDs, runtime bindings (`src/studioRuntime.ts`), Vitest suite (`npm test`), `@media print` layout, and Neocities static deployment compliance (`< 5 MB`/file, allowed extensions only, `base: './'`).

## Direction contract

THESIS: Brick Instruction Works treats instruction authoring like a calibrated European print-proofing table—refusing generic SaaS translucent glass pills, nested cards, and Google-blue CAD chrome so the builder's live manual page sits calmly on mineral stone beneath a committed carbon-ink studio rail while every control reads as one coherent pressroom instrument.

OWN-WORLD: Billund Print-Proofing Table—committed deep carbon-ink top studio rail (`#1B1A18` light / `#111110` dark) with alabaster ink (`#F4F2EC`), mineral-stone proofing table ground (`#DCDFD9` light / `#171614` true neutral charcoal dark), archival bright-paper surfaces (`#FAF9F6` / `#23221F`), carbon ink (`#1B1A18` / `#F3F1EC`), warm-mineral hairlines (`#C9C8C0` / `#3A3832`), single registration-vermilion primary action (`#C9341B` / `#EB593E`), self-hosted `Public Sans` (`>= 12px` functional floor, `>= 14px` body) paired with `JetBrains Mono` strictly for page folios, part IDs, file extensions, dimensions, and zoom/scale data, and crisp hairline-separated sheets replacing nested cards and floating glass capsules.

STORY: A builder arrives on desktop or mobile, recognizes Brick Instruction Works as a dry, purposeful, zero-gimmick instruction pressroom, drops or imports a `.io`/`.ldr`/`.mpd` file, opens a saved `.bic.json` project, or loads a built-in sample model, sees their manual page cleanly framed on the proofing table, and switches effortlessly between inspecting, editing, selecting, rotating, arranging steps/page breaks, styling themes, browsing the Bricks Library, and exporting PDF/HTML right from the top rail.

FIRST VIEWPORT: Committed carbon-ink full-width top studio rail (left: menu trigger `>= 40px` mobile touch target, optical-scale 20px industrial emblem + `Brick Instruction Works` wordmark / active model title; right: Bricks Library & Import Project before load, or Undo/Redo, Style popover toggle, and primary Export action after load) over a full-bleed mineral-stone proofing stage with calibrated corner/center registration ticks centering either the architectural welcome proofing sheet (before load, with dropzone, primary Import Model, Load Sample Model, and Open Project actions) or the live shadowed manual page (after load), anchored at bottom by a unified studio dock combining the runtime mode segmented control (`Pan` / `Edit` / `Select` / `Rotate` / `Arrange`), monospace folio locator (`Page N · N/M`), and zoom stepper—all with `>= 40px` touch targets on mobile and unified full-width bottom sheets.

FORM: Billund Print-Proofing Table — candidate 1 of 7 (Impeccable's Pick), seed:f7f7b4c4aa653821. Signature interaction: calibrated print-folio & registration-mark system unifying the proofing stage corners, welcome proof sheet, bottom folio locator, Pages & Steps overview, and Bricks Library catalog, with crisp 180ms exponential ease-out (`--ease-press`) reveal transitions on popover, drawer, and modal sheets and zero glass blur or colored glow shadows.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
