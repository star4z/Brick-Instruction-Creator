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

THESIS: Brick Instruction Works treats instruction authoring like a calibrated European print-proofing table—pairing the Billund mineral-stone, archival-paper, carbon-ink, and registration-vermilion palette with crisp opaque floating pills (zero glass blur, zero nested cards, zero Google-blue CAD chrome) so the builder's live manual page commands the full viewport without visual competition.

OWN-WORLD: Billund Print-Proofing Table—mineral-stone proofing table ground (`#DCDFD9` light / `#171614` true neutral charcoal dark), opaque archival bright-paper floating pills and sheets (`#FAF9F6` / `#23221F`) edged with strong mineral hairlines (`#AEADA4` / `#524F47`), carbon-ink drawer headers and notification bars (`#1B1A18` / `#111110`) with alabaster ink (`#F4F2EC`), single registration-vermilion primary action (`#C9341B` / `#EB593E`), and self-hosted `Public Sans` (`>= 12px` functional floor, `>= 14px` body) paired with tabular `JetBrains Mono` strictly for page folios, part IDs, file extensions, dimensions, and zoom/scale data.

STORY: A builder arrives on desktop or mobile, drops or imports a `.io`/`.ldr`/`.mpd` file, opens a saved `.bic.json` project, or loads a built-in sample model, sees their manual page cleanly framed on the proofing table beneath floating archival pills, and switches effortlessly between inspecting, editing, selecting, rotating, arranging steps/page breaks, styling themes, browsing the Bricks Library, and exporting or printing the complete document (PDF, 3D Interactive Viewer HTML, or full-manual system print).

FIRST VIEWPORT: Floating top-left pill cluster (circular `40px` menu button + desktop-only `md+` identity/model pill with optical-scale 20px emblem; title pill intentionally omitted on mobile where it lives inside the menu drawer) and floating top-right pill cluster (`Bricks Library` / `Open Project` before load; `Undo`/`Redo` pill, `Style` popover pill, and primary vermilion `Export` pill after load) over a full-bleed mineral-stone proofing stage centering either the architectural welcome proofing sheet (before load) or the live shadowed manual page (after load), with floating bottom pills (`#modePill` segmented mode pill stacked over the combined Page Folio & Zoom pill) and a centered 3-action full-document Export & Print dialog (`Export to PDF`, `Export 3D Interactive Viewer (HTML)`, `Print`).

FORM: Billund Print-Proofing Table with opaque floating pill chrome. Signature interaction: crisp opaque archival-paper floating pills over mineral stone, calibrated print-folio & zoom pill, Pages & Steps overview, Bricks Library catalog, full-document multi-page print spooler, and 180ms exponential ease-out (`--ease-press`) transitions on popover, drawer, and modal sheets with zero glass blur or colored glow shadows.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
