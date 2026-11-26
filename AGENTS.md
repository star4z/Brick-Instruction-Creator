# AI Agent Instructions

## Workflow & Verification
- After making and verifying changes (`npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, and `npm run detect:design` when changing UI/styles), prefer committing and pushing directly to `main` unless asked otherwise.
- When adding or modifying a UI page, modal, drawer, popover, or user-facing feature, keep `e2e/ui-audit.spec.ts` updated so the desktop + mobile UI audit covers it.
- Always include all architecture specs and feature design proposals directly in the repository under `docs/` (and index them in `docs/README.md`). Treat them as living documents and update them as needed when designs or implementation phases change.
- Include the live GitHub Pages link (`https://star4z.github.io/Brick-Instruction-Creator/`) at the end of the final response/description.

## Product, UI & Copy Standards
- **Keep chrome minimal**: The manual page is the hero. Avoid adding inline summaries/descriptions, status counts, decorative outlines, or extra control options to menus and compact controls unless requested.
- **Official manual craft**: Default manual visuals, layouts, and iconography to authentic official LEGO manual conventions (see `docs/OFFICIAL_MANUAL_CRAFT_DESIGN.md` and `docs/MULTI_MANUAL_CRAFT_AUDIT.md`) rather than generic CAD/editor conventions.
- **Canonical references**: Follow `PRODUCT.md` (brand: **Brick Instruction Works**), `DESIGN.md` (visual tokens), `docs/TERMINOLOGY.md` (`parts` in editor UI via `formatPartCount()`, `pcs` only on printed pages, `brick` only for category/brand), and `docs/DESTRUCTIVE_ACTIONS_DESIGN.md` (3-tier confirmation UX).

## Engineering & Rendering Principles
- **Generalize physically/geometrically**: Never make model-specific choices or hardcode heuristics for a particular model or theme (such as trains/bogies); always generalize rules and algorithms using physical/geometric principles and official LDraw specs so the desired result emerges naturally for any model.
- **Multi-surface parity**: When changing manual rendering, layout, or visual styling, maintain parity across Live DOM preview, PDF export, Print CSS, and Interactive 3D HTML export (as well as step views, minifigure callouts, 1:1 boxes, and Bricks Library previews) unless intentionally surface-specific.
- **Mobile & iOS Safari first-class**: Keep mobile controls compact so the 3D manual page stays visible, prevent popover/menu clipping on narrow viewports (`390×844`), and guard WebGL/canvas memory allocations against iOS Safari crashes.
