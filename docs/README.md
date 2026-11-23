# Design Documentation

All architecture specifications and feature design proposals for **Brick Instruction Creator** are stored in this `docs/` directory as living documents and updated as features evolve.

## Documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Core system architecture, invariants, data model, algorithms, and deployment constraints.
- [`COVER_PAGE_DESIGN.md`](./COVER_PAGE_DESIGN.md) — Official LEGO-style front cover layout, page-filling hero 3D render pipeline, pure-TS QR code generator, and clickable PDF link annotations.
- [`SUBDIVISION_DESIGN.md`](./SUBDIVISION_DESIGN.md) — Large & elongated model subdivision suggestions on import (2D PCA halves, modular floors, natural sub-assemblies, spatial sectors, and 3D exploded import assistant with tap-to-reveal overlay controls).
- [`MINIFIG_POSE_DESIGN.md`](./MINIFIG_POSE_DESIGN.md) — Standing upright minifigure normalization, default arm positioning (with purse/satchel/clearance exceptions), and pre-placement posing.
- [`MINIFIG_STEP_STYLES_DESIGN.md`](./MINIFIG_STEP_STYLES_DESIGN.md) — Official LEGO minifigure instruction styles: Exploded Stack Callout (vertical white box, red arrows, horizontal connector, accessory callouts) and Sequential Step-by-Step (numbered sub-steps, blue arrows, multi-part accessory pill, completion starburst).
- [`PART_TEXTURES_DESIGN.md`](./PART_TEXTURES_DESIGN.md) — BrickLink Studio `PE_TEX_PATH`/`PE_TEX_INFO` and LDraw `!TEXMAP`/`!DATA` embedded PNG decal pipeline, synchronous pre-decoding, direct RGB colors, and WebGL PBR/step compositing for minifigure faces and printed parts.
- [`LDR_IMPORT_DESIGN.md`](./LDR_IMPORT_DESIGN.md) — Automatic LDraw (`.ldr`/`.mpd`) part shape & `!TEXMAP` texture downloading on import and session restore, CORS mirror failover, MPD parser normalization, `~Moved to` title resolution, and extended LDConfig color support.
- [`BRICKS_LIBRARY_DESIGN.md`](./BRICKS_LIBRARY_DESIGN.md) — Dedicated Bricks Library screen linked from the menu: searchable 3D parts preview & multi-angle inspector, top-level parts vs subparts/primitives classification, context-aware model fetch, curated online starter packs, local `.zip`/`.dat` import, and clearly separated 2-step Saved Library clearing.
- [`IMPORT_MISSING_PARTS_DESIGN.md`](./IMPORT_MISSING_PARTS_DESIGN.md) — Pre-import missing parts & printed decal detection and inline fetch prompt shown before subdivision analysis and the Step Generation Wizard.
- [`INTERACTIVE_HTML_EXPORT_DESIGN.md`](./INTERACTIVE_HTML_EXPORT_DESIGN.md) — Self-contained offline Interactive 3D HTML instruction viewer export with deduplicated WebGL part meshes, embedded decals, free 360° orbit/pan/zoom on all 3D pages (including Cover & Build Complete), and direct link back to the Studio editor.
- [`PAGE_LAYOUT_GROUPS_DESIGN.md`](./PAGE_LAYOUT_GROUPS_DESIGN.md) — Customizable steps per page (1–24), explicit column/row grids, row-first vs column-first fill order, mixed step proportions (`Large Left`, `Large Top`, `Large Right`, per-slot S/M/L weights), and reusable editable Step Range Groups.
- [`DYNAMIC_STEP_SIZING_DESIGN.md`](./DYNAMIC_STEP_SIZING_DESIGN.md) — Cognitive-budget dynamic bricks-per-step sizing (structured rows/grids/pairs vs. scattered texture, even-chunk splitting, gentle Step 1 opening, opposite-wall guards) and sticky camera-corner selection with camera-aware frontier ordering.
- [`CONCAVE_CONTACT_AND_SUPPORT_DESIGN.md`](./CONCAVE_CONTACT_AND_SUPPORT_DESIGN.md) — Local concave sub-box collider from compiled `.dat` geometry, two-phase physical clutch verification, top-hung-safe vertical prerequisites, and zero-floating step invariants.

## Conventions

- Every new feature design proposal or architectural spec should be committed under `docs/` (e.g., `docs/<FEATURE>_DESIGN.md`) and listed in this index.
- Keep existing design documents up to date when requirements, algorithms, or implementation phases change.
