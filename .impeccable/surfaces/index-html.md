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

THESIS: Brick Instruction Works treats instruction authoring like a calibrated European print-proofing table—pairing a logo-matched tri-plume palette (deep maroon `#7c152e` primary, warm orange `#ed7d1f` secondary/warning accents, and sky blue `#38bdf8` info/technical accents over cool archival slate-paper surfaces) with crisp opaque floating pills (zero glass blur, zero nested cards) so the builder's live manual page commands the viewport with cohesive studio identity.

OWN-WORLD: Logo-Matched Print-Proofing Table—cool slate-stone proofing ground (`#E4E7EC` light / `#151318` deep plum-charcoal dark), crisp archival paper floating pills and sheets (`#FCFCFD` / `#221E26`) edged with slate hairlines (`#B4BCC8` / `#554C5E`), deep claret-ink drawer headers and notification bars (`#23121A` / `#160C11`) with warm logo-orange highlights (`#F59342` / `#FB9E4F`), logo-maroon primary actions (`#7C152E` light / `#EB6A84` dark), sky-blue technical/info accents (`#0369A1` light / `#38BDF8` dark), and self-hosted `Public Sans` (`>= 12px` functional floor, `>= 14px` body) paired with tabular `JetBrains Mono` strictly for page folios, part IDs, file extensions, dimensions, and zoom/scale data.

STORY: A builder arrives on desktop or mobile, drops or imports a `.io`/`.ldr`/`.mpd` file or imports a saved `.biw` project via equally prominent welcome actions, sees their manual page cleanly framed on the proofing table beneath floating archival pills (with the 3-plume logo and `Brick Instruction Works` name visible in both the welcome sheet and the editor view on desktop and mobile, plus prominent dual-arrow rotation cues on rotated steps), can close the current model cleanly from the menu drawer at any time, and exports or prints the complete document (PDF, 3D Interactive Viewer HTML, or full-manual system print).

FIRST VIEWPORT: Floating top-left pill cluster (circular `40px` menu button + desktop `md+` identity pill always displaying the restored 3-plume emblem and `Brick Instruction Works` beside the active model title & metadata when loaded) + mobile editor identity pill (`#mobileEditorBrandPill` centered at `top-[60px]` on `< md` when a model is loaded) and floating top-right pill cluster (`Bricks Library` / `Import Project` before load; `Undo`/`Redo` pill, `Style` popover pill, and primary logo-maroon `Export` pill after load) over a full-bleed proofing stage centering either the architectural welcome proofing sheet (displaying the restored 3-plume logo, 3-dot registration strip, and `Brick Instruction Works` app name on both mobile and desktop above equal-prominence `Import Model File` and `Import Project` pills before load) or the live shadowed manual page (after load), with floating bottom pills (`#modePill` segmented mode pill stacked over the combined Page Folio & Zoom pill) and a centered 3-action full-document Export & Print dialog (`Export to PDF`, `Export 3D Interactive Viewer (HTML)`, `Print`).

FORM: Logo-Matched Print-Proofing Table with opaque floating pill chrome. Signature interaction: crisp opaque archival-paper floating pills over cool slate-stone, calibrated print-folio & zoom pill, Pages & Steps overview, Bricks Library catalog, full-document multi-page print spooler, and 180ms exponential ease-out (`--ease-press`) transitions on popover, drawer, and modal sheets with zero glass blur or colored glow shadows.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
