# Design Documentation

All architecture specifications and feature design proposals for **Brick Instruction Creator** are stored in this `docs/` directory as living documents and updated as features evolve.

## Documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — Core system architecture, invariants, data model, algorithms, and deployment constraints.
- [`COVER_PAGE_DESIGN.md`](./COVER_PAGE_DESIGN.md) — Official LEGO-style front cover layout, page-filling hero 3D render pipeline, pure-TS QR code generator, and clickable PDF link annotations.
- [`SUBDIVISION_DESIGN.md`](./SUBDIVISION_DESIGN.md) — Large & elongated model subdivision suggestions on import (2D PCA halves, modular floors, structural modules, numbered bags, spatial sectors, and 3D exploded import assistant).
- [`MINIFIG_POSE_DESIGN.md`](./MINIFIG_POSE_DESIGN.md) — Standing upright minifigure normalization, default arm positioning (with purse/satchel/clearance exceptions), and pre-placement posing.
- [`MINIFIG_STEP_STYLES_DESIGN.md`](./MINIFIG_STEP_STYLES_DESIGN.md) — Official LEGO minifigure instruction styles: Exploded Stack Callout (vertical white box, red arrows, horizontal connector, accessory callouts) and Sequential Step-by-Step (numbered sub-steps, blue arrows, multi-part accessory pill, completion starburst).
- [`PART_TEXTURES_DESIGN.md`](./PART_TEXTURES_DESIGN.md) — BrickLink Studio `PE_TEX_PATH`/`PE_TEX_INFO` and LDraw `!TEXMAP`/`!DATA` embedded PNG decal pipeline, synchronous pre-decoding, direct RGB colors, and WebGL PBR/step compositing for minifigure faces and printed parts.
- [`LDR_IMPORT_DESIGN.md`](./LDR_IMPORT_DESIGN.md) — Automatic LDraw (`.ldr`/`.mpd`) part shape & `!TEXMAP` texture downloading on import and session restore, CORS mirror failover, MPD parser normalization, `~Moved to` title resolution, and extended LDConfig color support.
- [`BRICKS_LIBRARY_DESIGN.md`](./BRICKS_LIBRARY_DESIGN.md) — Dedicated Bricks Library screen linked from the menu: searchable 3D parts preview & multi-angle inspector, top-level parts vs subparts/primitives classification, context-aware model fetch, curated online starter packs, local `.zip`/`.dat` import, and clearly separated 2-step Saved Library clearing.
- [`IMPORT_MISSING_PARTS_DESIGN.md`](./IMPORT_MISSING_PARTS_DESIGN.md) — Pre-import missing parts & printed decal detection and inline fetch prompt shown before subdivision analysis and the Step Generation Wizard.

## Conventions

- Every new feature design proposal or architectural spec should be committed under `docs/` (e.g., `docs/<FEATURE>_DESIGN.md`) and listed in this index.
- Keep existing design documents up to date when requirements, algorithms, or implementation phases change.
