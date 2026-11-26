# UI & Feature E2E Testing Architecture (Desktop & Mobile)

## Overview

Every update to **Brick Instruction Works** must be verified in a real headless browser across **both Desktop (`1280×800`) and Mobile (`390×844`, touch-enabled)** layouts. The automated Playwright E2E audit suite (`e2e/`) exercises every UI surface, modal, drawer, popover, and core workflow while checking for runtime errors, horizontal overflow, clipped controls, and overlapping floating chrome.

## Test Projects & Viewports

Configured in [`playwright.config.ts`](../playwright.config.ts):

| Project | Viewport | Input Mode | Purpose |
| --- | --- | --- | --- |
| `desktop` | `1280×800` | Mouse (`isMobile: false`, `hasTouch: false`) | Docked side menu (`>= 1024px`), desktop zoom bar, 2-pane modals, top-right pills, floating style popover |
| `mobile` | `390×844` (2× DPR) | Touch (`isMobile: true`, `hasTouch: true`) | Collapsed overlay menu + scrim, mobile identity pill, hidden zoom bar, bottom-sheet modals, stacked Step Generation layout |

The suite runs against the production static build (`vite preview` serving `dist/`) with WebGL software rendering enabled (`--use-gl=angle --use-angle=swiftshader`) so Three.js 3D canvases render deterministically in headless Linux/CI environments.

## Automated Layout & Runtime Checks (`e2e/auditHelpers.ts`)

Every UI state transition calls `auditSurface(...)` and verifies:

1. **Zero Runtime Errors**: No uncaught `pageerror` exceptions and no `console.error` output.
2. **Zero Horizontal Viewport Overflow**: `document.documentElement.scrollWidth <= window.innerWidth` and `document.body.scrollWidth <= window.innerWidth`.
3. **Side Menu Layout Invariants**:
   - On desktop (`>= 1024px`), expanded `#menuDrawer` docks cleanly without overlapping `#workspaceArea`.
   - On mobile (`< 1024px`), `#menuDrawer` starts collapsed and stays within viewport bounds when expanded over `#menuBackdrop`.
4. **Modal / Popover Geometry & Button Bounds**:
   - Every open modal/popover sheet has valid non-zero dimensions and fits within `[0, viewportWidth]` and `[0, viewportHeight]`.
   - Visible interactive `<button>` and `<a href>` controls inside active sheets are not clipped off the horizontal edges of the viewport.
5. **Non-Overlapping Floating Chrome**:
   - `#menuHeaderBar`, `#topRightPills`, `#bottomDock`, and `#contextOverlay` do not overlap each other or clip outside the viewport.

## Covered UI Surfaces & Features (`e2e/ui-audit.spec.ts`)

All tests use offline synthetic LDraw fixtures (`e2e/fixtures/sampleModels.ts`) built from procedural parts so runs are fast, deterministic, and independent of external mirrors.

1. **Empty State & Pre-Model Chrome**: Welcome proofing sheet, desktop docked toggle, mobile overlay drawer + backdrop.
2. **Open Model Modal** (`#openModelModal`): Import Model / Import Project triggers and close.
3. **Keyboard Shortcuts Modal** (`#shortcutsModal`): Search filter, clear filter, and close.
4. **Bricks Library Modal** (`#bricksLibraryModal`): Browse & Search tab, part search (`3001`), 3D Preview Color popover (`#libColorPopover`), Available Color Filter popover (`#libColorFilterPopover`), and Fetch & Import tab.
5. **App Settings Modal** (`#settingsModal`): Opened from `#menuSettingsBtn`, verifies layout, defaults controls, and close.
5. **Missing Parts Modal** (`#missingPartsModal`): Triggered via synthetic `.ldr` with an unknown part ID, verifies missing part list and Skip & Continue transition.
6. **Import Wizard Modal** (`#importWizardModal`): Read-only project defaults summary, deep-link into editable setup pages with back-navigation, and Generate Manual action.
7. **Live Workspace, Page Types & Bottom Dock Modes**:
   - Front Cover (`Pan`, `Camera`, `Page` modes + `#contextOverlay`).
   - Step Page (`Pan`, `Parts`, `Step`, `Page` modes + **Apply Camera to Steps Modal** `#applyAngleModal`).
   - Last Page (Parts List / Back Cover) and first/prev/next/last pagination.
   - Desktop zoom controls (`#btnZoomIn`, `#btnZoomOut`, `#btnZoomFit`) and mobile auto-hide verification.
8. **Pages & Steps Overview Modal** (`#overviewModal`): Page list, Select Range bar toggle, and close.
9. **Style & Themes Popover** (`#stylePopover`): Theme strip, inline Typography Font Picker (`#themeFontPickerPanel`) + search, rendering toggles, and Undo/Redo state.
10. **Page Setup Modal** (`#pageSetupModal`): Paper format switching (`screen` / `letter` / `custom` dimensions panel).
11. **Parts List (BOM) Setup Modal** (`#bomSetupModal`): Sticky live layout preview, Grid Automatic, Grid Custom, and Table formats.
12. **Step Generation Modal** (`#importModal`): 3D exploded preview pane + overlay controls + Build Organization picker on both 2-pane desktop and stacked mobile layouts.
13. **Export & Print Modal** (`#exportModal`): PDF, Interactive 3D HTML, and Print actions.
14. **Model Issues Modal** (`#errorsModal`): Opened when diagnostics are present.
15. **Destructive Action Confirmation Modal** (`#confirmActionModal`): Close Model cancel (preserves workspace) and confirm (returns cleanly to Empty State).

## Running & CI Integration

- **Local command**: `npm run build && npm run test:e2e` (or `npm run test:e2e:desktop` / `npm run test:e2e:mobile`).
- **CI enforcement**:
  - `.github/workflows/deploy-pages.yml` runs `npm run test:e2e` on every push to `main` before uploading and deploying the GitHub Pages artifact.
  - `.github/workflows/ui-audit.yml` runs the desktop + mobile Playwright UI audit on every pull request and push to `main`, uploading HTML reports and failure screenshots as workflow artifacts when any check fails.
