# Unified Side Menu Design

> **Status**: Implemented. Pure responsive state machine lives in [`src/engine/sideMenuState.ts`](../src/engine/sideMenuState.ts) with unit tests in [`src/engine/__tests__/sideMenuState.test.ts`](../src/engine/__tests__/sideMenuState.test.ts).

## 1. Goals

1. **Expanded by Default on Desktop (`>= 1024px`)**: Desktop users immediately have access to model summary, file import/export, Page Setup, Parts List Setup, Step Generation, Bricks Library, and Page Inserts without first opening a hidden drawer.
2. **Unified Menu Button & Site Title**: Instead of a separate modal drawer sliding over and replacing the top-left menu button (`#btnOpenMenu`) and site title (`Brick Instruction Works`) with a dark header bar and close (`×`) button, the side menu **combines directly with** the top-left menu button and site title in one continuous `#menuDrawer` surface.
3. **Clean Brand Identity**: No `"Instruction Studio"` subtitle appears in the side menu header — only the 3-plume emblem and `"Brick Instruction Works"`.
4. **Non-Obstructing Docked Workspace**: When expanded on desktop, the side menu docks cleanly at the left edge (`12px` inset, `328px` wide) without a dark backdrop scrim, and `#workspaceArea` reserves `340px` on the left so the welcome sheet, manual page stage, zoom/pan framing, contextual overlays, bottom dock, error banner, and toast notifications remain centered and fully interactive.

## 2. Responsive Behavior

| Viewport | Default State | Expansion Mode | Header Content (Collapsed) | Header Content (Expanded) |
|---|---|---|---|---|
| **Desktop (`>= 1024px`)** | Expanded | Docked (`z-40`, no backdrop, `340px` workspace inset) | `☰` + Logo + `Brick Instruction Works` (+ `\| Model Name` when loaded) | Same `☰` + Logo + `Brick Instruction Works` (zero positional shift; model summary moves directly into `#menuModelCard` below) |
| **Tablet (`768px–1023px`)** | Collapsed | Overlay (`z-47` over `z-46` scrim, `0px` workspace inset) | `☰` + Logo + `Brick Instruction Works` (+ `\| Model Name` when loaded) | Same `☰` + Logo + `Brick Instruction Works` directly above the unfolded menu body |
| **Mobile (`< 768px`)** | Collapsed | Overlay (`z-47` over `z-46` scrim, `0px` workspace inset) | Compact `40×40` circular `☰` pill (`#mobileEditorBrandPill` displays title below when a model is loaded) | Expands in place from `(12px, 12px)` into `☰` + Logo + `Brick Instruction Works` + menu body |

## 3. Interaction & State Invariants

- **Single Continuous Header (`#menuHeaderBar`)**: `#btnOpenMenu` (`32×32` circular toggle inside a `38px` inner header bar) and `#desktopModelChip` (logo + `"Brick Instruction Works"`) stay in the exact same DOM node and `(x, y)` coordinates across collapsed and expanded states. The dividing hairline sits on `#menuDrawerPanel` (`border-t`) so the header height never shifts.
- **Toggle Semantics**:
  - Clicking `#btnOpenMenu` (`☰`) toggles expanded ↔ collapsed on all viewports (`aria-expanded`, `aria-label`, and `title` update live).
  - Clicking `#desktopModelChip` (or `#mobileEditorBrandPill`) when collapsed opens the side menu.
  - On desktop, opening modals (Page Setup, Parts List Setup, Bricks Library, Export, Step Generation, Model Issues) or triggering menu actions keeps the docked side menu open (`closeSideMenuOverlayState` only dismisses `< 1024px` overlay drawers).
  - On tablet/mobile, tapping `#menuBackdrop`, pressing `Escape`, or selecting a menu action dismisses the overlay drawer.
- **Explicit Preference Preservation**: Collapsing the side menu on desktop is preserved if the window narrows below `1024px` and later returns to desktop width.
- **Workspace Sizing & Print Safety**: `computeWorkspaceViewportSize()` subtracts `workspaceLeftInsetPx` (`340px` when docked, `0` otherwise) for `computePageFrameDimensions()`, pan clamping, and Screen Fit aspect previews. `@media print` resets `#workspaceArea` margin to `0`.
