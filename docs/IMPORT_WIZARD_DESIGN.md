# Import Wizard & Project-Level Setup — Design Specification

> **Status**: Implemented. Pure summary & project-level visibility logic lives in [`src/engine/importWizard.ts`](../src/engine/importWizard.ts) with unit tests in [`src/engine/__tests__/importWizard.test.ts`](../src/engine/__tests__/importWizard.test.ts).

## 1. Goals & Separation of Concerns

1. **Step Generation (`#importModal`) is strictly about slicing**:
   - Build organization / subdivision plan (`#impProposalPicker` + live 3D exploded preview), duplicate submodel detection (`#toggleDetectDuplicates`), and optional **Keep Existing File Steps** (`#impBtnKeep`).
   - Instruction Language (**Wordless (LEGO-Style)** vs. **With Text Labels**) belongs in **Page Setup** (`#pageSetupModal`), not in Step Generation.
2. **Import Wizard (`#importWizardModal`) is distinct from editing pages**:
   - Shown on fresh model imports (`.io`, `.ldr`, `.mpd`) after the optional Missing Parts check.
   - Displays a **read-only summary** of the project-level defaults selected for the new manual — no inline inputs, toggles, or dropdowns on the main wizard page.
   - Each summary row links directly to the editable **project-level** setup page that modifies it, with a clear return path (`Back to Import Wizard`) and a single primary `Generate Manual` action on the main wizard page.
3. **All wizard sub-pages are strictly project-level**:
   - Because steps have not been rendered yet during import, any step-specific or rendered-page-specific UI is hidden while editing inside the wizard.

## 2. Main Import Wizard Summary Items

`buildImportWizardSummaryItems()` in [`src/engine/importWizard.ts`](../src/engine/importWizard.ts) formats the five read-only rows:

| Row | Selected Default Shown | Links To (Editable Page) | Scroll Target |
|---|---|---|---|
| **Slicing** | Recommended subdivision sections, `Single Continuous Build`, or `Keep Existing File Steps` + duplicate submodel status | **Step Generation** (`#importModal` in wizard mode) | Top |
| **Theme** | Active theme name + live color swatch (background, text, accent) + built-in/custom status | **Style & Themes** (`#stylePopover` in centered wizard modal mode) | Top (`Themes`) |
| **Instruction Language** | `Wordless (LEGO-Style)` (default) or `With Text Labels` | **Page Setup** (`#pageSetupModal` in wizard mode) | `#pageSetupWordlessSection` |
| **Rendering Style** | `Standard` or `Studio High-Quality` + outline mode/weight + earlier-piece fade level | **Style & Themes** (`#stylePopover` in centered wizard modal mode) | `#styleStepDisplaySection` |
| **Page Format** | Paper size & orientation (or `Screen Fit` / custom dimensions) + default grid & margin density | **Page Setup** (`#pageSetupModal` in wizard mode) | `#pageSetupFormatSection` (top) |

## 3. Project-Level Visibility Rules During Import Wizard

`getWizardSubpageVisibility(isWizardMode)` enforces that sub-pages opened from the Import Wizard expose only project-level controls:

- **Page Setup (`#pageSetupModal`)**:
  - **Shown**: Page Format & Orientation, Default Page Grid, Page Density & Margins, Instruction Language (Wordless), Page Number Format, Box Around Each Step, Model Title on Every Page, and Included Pages checkboxes (Cover, Build Complete, Parts List, Back Cover).
  - **Hidden**: Step Range Groups (`#pageSetupRangeGroupsSection`), step-based Page Size Fit Warning (`#pageSizeFitWarning`), per-page `Settings` navigation links (`Cover` / `Build Complete` / `Parts List` / `Back Cover`), and post-import Wordless destructive notices (`#wordlessToggleNotice`).
- **Style & Themes (`#stylePopover`)**:
  - Presented as a centered modal (`.style-popover-wizard-mode`) with `#styleWizardHeader` and `#styleWizardFooter` (`Back to Import Wizard`).
  - **Shown**: Theme strip, Theme identity/palette/background/typography, and Step Display (all theme/project-level rendering options).
  - **Hidden**: Popover anchor tail and Parts List Setup link (`#styleBomSection`).
- **Step Generation (`#importModal`)**:
  - **Shown**: 3D Exploded Partition Preview, Build Organization picker, Auto-Detect Duplicate Submodels, optional Keep Existing File Steps (selects `keep` mode and returns to the wizard), and `Back to Import Wizard` button (`#impBtnWizardDone`).
  - **Hidden**: Post-import destructive notices and direct `Generate Manual` / `Regenerate & Apply Steps` footer buttons.

## 4. State Safety & Cancellation

- Before entering the Import Wizard, `capturePreWizardStateSnapshot()` captures project-level `state` preferences.
- Clicking **Cancel** (or pressing `Escape` / clicking the backdrop on `#importWizardModal`) restores the snapshot so any previously loaded manual remains untouched.
- Clicking **Done / Back to Import Wizard** (or pressing `Escape` / clicking the backdrop) on any sub-page returns to `#importWizardModal` with the summary list refreshed.
- Clicking **Generate Manual** commits the selected slicing plan, `wordlessMode`, `pageNumberFormat`, theme, rendering options, and page format in a single `finishImport()` pass.
