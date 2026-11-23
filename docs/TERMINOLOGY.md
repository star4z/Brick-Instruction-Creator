# UI Terminology: Parts, Pieces & Bricks

> **Status**: Convention adopted. Editor/import UI strings swept in [`studioRuntime.ts`](../src/studioRuntime.ts), [`index.html`](../index.html), and [`subdivisionAnalyzer.ts`](../src/engine/subdivisionAnalyzer.ts). Living document—update when new user-facing copy is added.

## Why

The app used to say "pieces", "pcs", "bricks", and "parts" for the same thing, sometimes in the same dialog (e.g. "Detected 1,718 pieces" above section chips showing just a bare `1169`). Using one word makes counts easier to read and avoids implying that "bricks" means only the `Brick` category.

## Convention

| Term | Use for | Examples |
| :--- | :--- | :--- |
| **part** / **parts** | Any single LEGO element, in all **editor & import UI** copy, and **every count** shown in the app. Counts always include the noun. | `1,718 parts`, `Front Half · 1,169 parts`, `2 sections · 1,718 parts`, `Tap parts in the 3D step…`, `Outline New Parts`, `Part Colors` |
| **pcs** | Only inside the **generated/printed manual pages** (PLI pills, BOM header, section dividers), following the official LEGO manual convention where space is tight. | `12 pcs`, `318 pcs · 74 unique` |
| **brick** | Only as (a) the part **category** (`Bricks` vs `Plates`, `Tiles`), (b) product/feature names (*Brick Instruction Creator*, *Bricks Library*), or (c) describing a whole *brick model*. Never as a generic word for one element. | `Bricks` filter, `Open a brick model…` |
| **piece** | Avoid in the editor UI. Existing manual/export copy (e.g. cover subtitle `N pieces · M steps`) may keep it as LEGO-style manual wording. | — |

### Helper

Use `formatPartCount(n)` in [`studioRuntime.ts`](../src/studioRuntime.ts) for any UI count: it localizes the number and pluralizes correctly (`1 part`, `1,718 parts`).

## Follow-ups

- Exported manual copy (`htmlExporter.ts`, `interactiveHtmlExporter.ts`, cover/complete-page subtitles) still mixes "pieces" and "pcs"; decide whether exported manuals should standardize on "pcs" everywhere.
- Internal identifiers (`colorMode: 'bricks'`, `bomTotalPieces`, `pieceCount`) are unchanged; renaming is optional and not user-visible.
