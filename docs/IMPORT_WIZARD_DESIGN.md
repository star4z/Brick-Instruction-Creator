# Import Wizard & Project-Level Setup — Design Specification

> **Status**: Implemented. Pure summary & project-level visibility logic lives in [`src/engine/importWizard.ts`](../src/engine/importWizard.ts) with unit tests in [`src/engine/__tests__/importWizard.test.ts`](../src/engine/__tests__/importWizard.test.ts).

## 1. Goals & Separation of Concerns

1. **Step Generation (`#importModal`) is strictly about slicing**:
   - Build organization / subdivision plan (`#impProposalPicker` + live 3D exploded preview), duplicate submodel detection (`#toggleDetectDuplicates`), and optional **Keep Existing File Steps** (`#impBtnKeep`).
   - **Text & Labels** (**Wordless** vs. **With Text Labels**) belongs in **Page Setup** (`#pageSetupModal`), not in Step Generation.
2. **Import Wizard (`#importWizardModal`) is distinct from editing pages**:
   - Shown on fresh model imports (`.io`, `.ldr`, `.mpd`) after the optional Missing Parts check.
   - Initializes clean, built-in project defaults via `getFreshImportWizardDefaults()` (`Classic Blue` built-in theme with Flat / No Lighting, Outline All Parts, and No Fade, `Screen Fit` / `Landscape`, `Auto` grid, `Balanced` margins, `Wordless`, duplicate detection on, all included pages on) so prior session overrides (such as a custom theme or Portrait print layout) do not bleed into a new import.
   - Displays a **read-only summary** of the project-level defaults selected for the new manual — no inline inputs, toggles, or dropdowns on the main wizard page.
   - Each summary row links directly to the editable **project-level** setup page that modifies it, with a **top-left back arrow (`←`)** in the header and a `Back to Import Wizard` button in the footer, returning to the main wizard page's single primary `Generate Manual` action.
3. **All wizard sub-pages are strictly project-level**:
   - Because steps have not been rendered yet during import, any step-specific or rendered-page-specific UI is hidden while editing inside the wizard.

## 2. Main Import Wizard Summary Items

`buildImportWizardSummaryItems()` in [`src/engine/importWizard.ts`](../src/engine/importWizard.ts) formats the five read-only rows:

| Row | Selected Default Shown | Links To (Editable Page) | Scroll Target |
|---|---|---|---|
| **Slicing** | Concise slicing method name (e.g. `Split into Halves`, `Modular Floors`, `Natural Sub-Assemblies`, `Single Continuous Build`, or `Keep Existing File Steps`) — no wizard description; section details live on the Slicing page | **Step Generation** (`#importModal` in wizard mode) | Top |
| **Theme** | Active theme name (`Classic Blue` by default) + live color swatch (background, text, accent) — no wizard description | **Style & Themes** (`#stylePopover` in centered wizard modal mode) | Top (`Themes`) |
| **Text & Labels** | `Wordless` (default) or `With Text Labels` | **Page Setup** (`#pageSetupModal` in wizard mode) | `#pageSetupWordlessSection` |
| **Rendering Style** | `Flat (No Lighting)` (default), `Standard Lighting`, or `Studio Lighting` + outline mode/weight + earlier-piece fade level | **Style & Themes** (`#stylePopover` in centered wizard modal mode) | `#styleStepDisplaySection` |
| **Page Format** | `Screen Fit` (default) or paper size & orientation (`Landscape` default) + default grid & margin density | **Page Setup** (`#pageSetupModal` in wizard mode) | `#pageSetupFormatSection` (top) |

## 3. Project-Level Visibility Rules During Import Wizard

`getWizardSubpageVisibility(isWizardMode)` enforces that sub-pages opened from the Import Wizard expose only project-level controls and include a top-left back arrow (`showWizardBackButton`):

- **Page Setup (`#pageSetupModal`)**:
  - **Shown**: Top-left back arrow (`#btnBackPageSetupWizard`), Page Format & Orientation, Default Page Grid, Page Density & Margins, Text & Labels (Wordless), Page Number Format, Box Around Each Step, Model Title on Every Page, and Included Pages checkboxes (Cover, Build Complete, Parts List, Back Cover).
  - **Hidden**: Step Range Groups (`#pageSetupRangeGroupsSection`), step-based Page Size Fit Warning (`#pageSizeFitWarning`), per-page `Settings` navigation links (`Cover` / `Build Complete` / `Parts List` / `Back Cover`), and post-import Wordless destructive notices (`#wordlessToggleNotice`).
- **Style & Themes (`#stylePopover`)**:
  - Presented as a centered modal (`.style-popover-wizard-mode`) with `#styleWizardHeader` (including top-left back arrow `#btnBackStyleWizard`) and `#styleWizardFooter` (`Back to Import Wizard`).
  - **Shown**: Theme strip, Theme identity/palette/background/typography, and Rendering Style (all theme/project-level rendering options).
  - **Hidden**: Popover anchor tail and Parts List Setup link (`#styleBomSection`).
- **Step Generation (`#importModal`)**:
  - **Shown**: Top-left back arrow (`#btnBackStepGenWizard`), 3D Exploded Partition Preview, Build Organization picker, Auto-Detect Duplicate Submodels, optional Keep Existing File Steps (selects `keep` mode and returns to the wizard), and `Back to Import Wizard` button (`#impBtnWizardDone`).
  - **Hidden**: Post-import destructive notices and direct `Generate Manual` / `Regenerate & Apply Steps` footer buttons.

## 4. State Safety & Cancellation

- Before entering the Import Wizard, `capturePreWizardStateSnapshot()` captures project-level `state` preferences.
- Clicking **Cancel** (or pressing `Escape` / clicking the backdrop on `#importWizardModal`) restores the snapshot so any previously loaded manual remains untouched.
- Clicking **Done / Back to Import Wizard** (or pressing `Escape` / clicking the backdrop) on any sub-page returns to `#importWizardModal` with the summary list refreshed.
- Clicking **Generate Manual** commits the selected slicing plan, `wordlessMode`, `pageNumberFormat`, theme, rendering options, and page format in a single `finishImport()` pass.
