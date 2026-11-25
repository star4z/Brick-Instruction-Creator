# App Settings — Design Specification

> **Status**: Implemented. Pure settings model, persistence, and resolvers live in [`src/engine/appSettings.ts`](../src/engine/appSettings.ts) with unit tests in [`src/engine/__tests__/appSettings.test.ts`](../src/engine/__tests__/appSettings.test.ts).

## 1. Overview

The **App Settings** modal (`#settingsModal`), accessible from the Side Menu (`#menuSettingsBtn`), manages app-wide preferences stored in `localStorage` (`bic_app_settings_v1`). All settings are independent of any individual `.biw` project and never mutate existing saved projects.

## 2. Settings Sections

### 2.1 New Manual Defaults
- **Defaults Mode**:
  - **Built-in** *(default)*: Always start fresh imports with `Classic Blue` (Flat / No Lighting, Outline All Parts, No Fade), `Screen Fit`, `Landscape`, `Auto` grid, `Balanced` margins, `Bottom Right` page numbers, `Wordless (LEGO-Style)`, and all four included booklet pages enabled.
  - **Custom Defaults**: Configure preferred Default Theme (built-in or custom), Page Format & Orientation, Grid Columns × Rows, Page Margins, Page Number Position (`Bottom Right` / `Outside Edge (Booklet)`), Wordless mode, and Included Pages. Includes a one-click **Copy from Current Project** action when a model is open.
  - **Remember Last Used**: Carry over the previous project's theme, format, orientation, grid, margins, page number position, Wordless mode, and included pages into the next import (falling back to `Classic Blue` if a custom theme was deleted).
- **Show Import Wizard on Import**:
  - **Always** *(default)*
  - **When Needed** (opens only when the model has existing file steps, submodels, or suggested subdivision sections)
  - **Never** (immediately generates the manual using the resolved defaults)

### 2.2 Creator & Cover Defaults
- **Default Creator Logo**: Optional saved image (`data:image/*`, up to 2 MB) automatically applied to the Front Cover of every newly imported manual.
- **Default Cover Subtitle**: Optional default subtitle string applied to `coverMeta.subtitle` on new manuals (visible when Text & Labels is enabled).

### 2.3 Editor & Workspace
- **Measurement Units**: `Inches (in)` *(default)* or `Centimeters (cm)` — sets the default unit for custom page dimensions and orders physical page size readouts with the preferred unit first.
- **Desktop Side Menu on Startup**: `Expanded` *(default)*, `Collapsed`, or `Remember` (persists the last desktop expanded/collapsed state).

### 2.4 Missing Parts on Import
- **Ask First** *(default)*: Show the Missing Parts prompt before entering the Import Wizard.
- **Fetch Automatically**: Automatically start fetching missing fetchable parts online during import, then advance to the wizard.
- **Never Fetch**: Skip the Missing Parts prompt and disable background online part fetching on import.

### 2.5 Reset
- **Reset Settings** (`#btnSettingsReset`): Opens `#confirmActionModal` and resets all app settings back to built-in defaults without affecting saved Bricks Library shapes, custom themes, or keyboard shortcuts.
