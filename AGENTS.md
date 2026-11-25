# AI Agent Instructions

## Workflow Preferences
- After making and verifying changes (`npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` covering every UI page & feature in both desktop and mobile layouts), prefer committing and pushing directly to `main` unless asked otherwise.
- When adding or modifying a UI page, modal, drawer, popover, or user-facing feature, keep `e2e/ui-audit.spec.ts` updated so the desktop + mobile UI audit covers it.
- Never make model-specific choices or hardcode heuristics for a particular model or theme (such as trains/bogies); always generalize rules and algorithms using physical/geometric principles so the desired result emerges naturally for any model.
- Always include all architecture specs and feature design proposals directly in the repository under `docs/` (and index them in `docs/README.md`). Treat them as living documents and update them as needed when designs or implementation phases change.
- Include the live GitHub Pages link (`https://star4z.github.io/Brick-Instruction-Creator/`) at the end of the final response/description.
