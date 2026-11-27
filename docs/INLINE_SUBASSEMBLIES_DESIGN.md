# Automatic Inline Micro-Subassemblies Design

## Goal
Ensure compact, self-contained hinged/lidded/enclosed props (such as a LEGO **Book** `24324 + 24093 (+ 3069b page tile)`, **Treasure Chest** `base + lid (+ contents)`, **Suitcase**, **Laptop**, **Coffin**, or compact **Container + Lid**) are constructed **in a single dedicated step with an inline submodel callout box**, rather than being split across multiple steps or mixed into a busy structural wall/plate step.

## Generalized Physical & LDraw Spec Rules
Implemented in `src/engine/inlineSubassemblies.ts` (`classifyEnclosurePart`, `detectInlineSubassemblies`):

1. **Official LDraw Enclosure Families (zero model-specific heuristics)**:
   - `book`: Minifig Book Base/Spine (`24324`, `33009k01`, or LDraw `Book ... Base/Spine/Back`) paired with Minifig Book Cover/Front/Joint (`24093`, `29167`, `33009k02..k05`, or LDraw `Book ... Cover/Front/Joint`).
   - `chest`: Treasure Chest base (`4738*`, `54195`, `62622`) paired with Treasure Chest Lid (`4739*`, `62623`, `80835`).
   - `coffin`: Coffin base (`30163`) paired with Coffin Lid (`10304`, `30164`).
   - `suitcase`: Minifig Suitcase halves (`4449k*`, `37178k*`, `37702`).
   - `laptop`: Minifig Computer Laptop Keyboard (`62698k01`) paired with Hinge/Screen (`62698k02`, `62698k03`).
   - `container`: Any compact LDraw `Container ...` base (`maxSpan <= 140 LDU`) paired with a matching `Container ... Lid/Cover`.
   - Stickers, bookcases, panels, Duplo, and pre-assembled single-piece shortcuts (`*c01`, `*-f1`) are excluded.

2. **Greedy Closest-Pair Shell Matching**:
   - Bases and covers of the same family are paired 1-to-1 by smallest 3D AABB surface gap whenever they are adjacent in the contact graph `adj` or within `<= 10 LDU` (tolerating open/angled covers and small CAD clearance gaps).
   - Multi-part shell families (`33009k*`, `4449k*`, `62698k*`) may claim additional adjacent/nearby (`<= 8 LDU`) shell pieces up to `maxClusterSize` (default `6`).

3. **Enclosed Interior Part Collection**:
   - Any small non-figure part whose 3D center lies inside the combined shell AABB (padded by `3 LDU`), whose span fits inside the enclosure, that touches a shell piece (or is within `4 LDU` of the base), has no external vertical dependents (`belowMap`), and has `< 2` external structural neighbors is absorbed into the same cluster (e.g., a `1×2` page tile studded inside `24324`, without ever absorbing exterior wall tiles).

4. **Structural Leaf Safety Guard**:
   - If any external part outside the cluster rests vertically on top of any member of the cluster (`belowMap`), the cluster is skipped so structural load-bearing assemblies are never pulled out of normal bottom-up masonry order.

## Step Generation & Multi-Surface Parity
- **Step Generation (`buildLocalSubmodelSteps` and `buildStepsForIndexList` in `src/studioRuntime.ts`)**:
  - Inline micro-subassembly parts are excluded from unrelated structural steps (`getEligibleCandidates`) and held until all external vertical prerequisites of the cluster are placed.
  - When the cluster's anchor is selected, all cluster parts are emitted atomically in **one step** with `step.subassembly = { name, repeatCount: 1, direction: 'horizontal', asPages: false, buildParts }`.
  - Auto-placement exploded offsets skip `step.subassembly` so the completed submodel stays intact as a unit on the main model.
- **Live DOM Preview**:
  - Renders the step's consolidated top-left PLI pill alongside the inline submodel callout box (`sub_callout` render + orthogonal leader), omitting the `1×` repeat badge when `repeatCount <= 1` and omitting the header row in wordless mode when no badge is present.
- **PDF Export (`renderPageToCanvas`)**:
  - Renders the inline submodel callout box (`calloutBg`, `calloutBorder`, optional label/`×N` badge, and `buildParts` 3D snapshot) beside the main model with an orthogonal leader arrow.
- **Interactive 3D HTML Export (`src/export/interactiveHtmlExporter.ts`)**:
  - Embeds deduplicated `inlineCalloutThumbKey` thumbnails in `submodelThumbs` and renders an inline submodel callout pill in the step HUD.
