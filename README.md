# Brick Instruction Works — Automatic LEGO Instruction Studio

An opinionated yet fully customizable client-side TypeScript web application that converts **BrickLink Studio (`.io`)** and **LDraw (`.ldr` / `.mpd`)** models into publication-ready LEGO instruction manuals—without BrickLink Studio's cascading page-reformatting side effects.

## Key Features

- **Zero Cascading Page Breakage**: All overrides (camera angles, visual offsets, hinge poses, page layouts, and **Pin Page Break** boundaries) bind to semantic `StepId`s rather than page indices. Editing or splitting a step on page 2—or re-importing an updated `.io`/`.ldr` file via **Smart Re-Import Diffing**—keeps pages 3–199 intact.
- **Zero-Floating Multi-Directional Step Generation**: Hybrid connectivity graph matching studs, anti-studs, SNOT side-studs, bars/rods, clips, Technic pins/axles, and hinges (plus Studio snap-tolerance fallback). Automatically extracts SNOT/cantilevered modules and collapses identical copies (`2×`, `4×`) into natural-orientation subassembly callouts, separates disconnected figures/accessories into ordered build chapters, and flags truly floating parts.
- **Automatic Camera & Rotation Optimization**: Global Viterbi Dynamic Programming selects discrete canonical isometric viewpoints (4 yaw angles × underside flips) to maximize new-piece visibility while minimizing unnecessary rotations, automatically adding rotation indicator icons when orientation changes.
- **Step-Level Presentation Movements**: Automatically shows build-vs-attach subassembly orientation rotations and lets you add non-destructive per-step exploded `X/Y/Z` visual offsets, hinge articulation angles, and placement arrows without altering canonical model geometry.
- **3-Tier Cascading Customization**:
  1. **Opinionated Theme Presets**: Classic Manual Blue, Modern Studio White, Collector 18+ Dark, Drafting Blueprint.
  2. **Global Design Tokens**: Page size/orientation, `auto`/`1-up`–`4-up` multi-step layouts, solid/gradient/blueprint/image backgrounds, typography, highlight outlines for new pieces, fade/desaturation for unmodified pieces, placement arrows, Cover/Back pages, and sortable Bill of Materials (BOM).
  3. **Per-Step Overrides**: Semantic camera overrides, live 3D orbit angle locking, Pin Page Breaks, and piece presentation poses.
- **Exports & Persistence**: High-res hybrid vector+raster **PDF**, self-contained offline **Interactive HTML Viewer**, portable `.bic.json` project save/load, browser **IndexedDB** autosave, and local LDraw `complete.zip`/`.dat` library caching.
- **Neocities Static Ready**: Relative asset paths (`base: './'`), only Neocities-allowed static extensions, and code-split chunks strictly under 5 MB per file (verified automatically by `npm run check:neocities`).

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — Start local Vite dev server
- `npm run typecheck` — Strict TypeScript check
- `npm test` — Run Vitest engine verification suite
- `npm run build` — Typecheck, production build, and Neocities file-size/extension compliance check
- `npm run detect:design` — Run Impeccable anti-pattern & design quality detector on `src/`
- `npm run detect:design:dist` — Run Impeccable detector on the built `dist/index.html` bundle

## Product & Design Documentation

- [PRODUCT.md](PRODUCT.md) — Durable product truth, audiences, workflows, and brand commitments
- [DESIGN.md](DESIGN.md) — Billund Print-Proofing Table visual baseline, design tokens, typography, and component rules
- All architecture specs and feature design proposals live in [`docs/`](docs/README.md) and are updated as the project evolves:
  - [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Core system architecture & invariants
  - [docs/SUBDIVISION_DESIGN.md](docs/SUBDIVISION_DESIGN.md) — Large & elongated model subdivision on import
