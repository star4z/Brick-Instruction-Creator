---
name: Brick Instruction Works
description: Calibrated European print-proofing studio for converting BrickLink Studio and LDraw brick models into publication-ready instruction manuals.
colors:
  brand-sky: "#38bdf8"
  brand-maroon: "#7c152e"
  brand-orange: "#ed7d1f"
  logo-maroon: "#7c152e"
  logo-maroon-hover: "#641025"
  logo-maroon-foreground: "#ffffff"
  logo-maroon-soft: "rgba(124, 21, 46, 0.1)"
  logo-maroon-border: "rgba(124, 21, 46, 0.36)"
  logo-maroon-dark: "#eb6a84"
  logo-maroon-hover-dark: "#f28096"
  logo-maroon-foreground-dark: "#1a0a0f"
  logo-maroon-soft-dark: "rgba(235, 106, 132, 0.16)"
  logo-maroon-border-dark: "rgba(235, 106, 132, 0.44)"
  accent-warm: "#c75d0c"
  accent-warm-dark: "#f59342"
  claret-ink-rail: "#23121a"
  claret-ink-rail-foreground: "#f7f3f5"
  claret-ink-rail-muted: "#c0aeb6"
  claret-ink-rail-border: "#3d222e"
  claret-ink-rail-surface: "#331c26"
  claret-ink-rail-hover: "#442633"
  claret-ink-rail-accent: "#f59342"
  claret-ink-rail-dark: "#160c11"
  claret-ink-rail-muted-dark: "#b8a5ae"
  claret-ink-rail-border-dark: "#2f1a24"
  claret-ink-rail-surface-dark: "#23141b"
  claret-ink-rail-hover-dark: "#321d26"
  slate-stone: "#e4e7ec"
  pressroom-chrome: "#f2f4f7"
  archival-paper: "#fcfcfd"
  surface-sunken: "#eaeef3"
  surface-hover: "#dfe4ec"
  claret-ink: "#1e161a"
  muted-ink: "#5a5157"
  slate-hairline: "#cfd4dc"
  slate-hairline-strong: "#b4bcc8"
  registration-mark: "rgba(35, 18, 26, 0.34)"
  slate-stone-dark: "#151318"
  pressroom-chrome-dark: "#1c1920"
  archival-paper-dark: "#221e26"
  surface-sunken-dark: "#2b2630"
  surface-hover-dark: "#352f3c"
  claret-ink-dark: "#f6f3f7"
  muted-ink-dark: "#aba2b0"
  slate-hairline-dark: "#3c3543"
  slate-hairline-strong-dark: "#554c5e"
  registration-mark-dark: "rgba(246, 243, 247, 0.26)"
  ink-bar-accent: "#fb9e4f"
  status-info: "#0369a1"
  status-info-soft: "rgba(56, 189, 248, 0.14)"
  status-success: "#1f6a4a"
  status-success-soft: "rgba(31, 106, 74, 0.12)"
  status-warning: "#ad5107"
  status-warning-soft: "rgba(237, 125, 31, 0.14)"
  status-danger: "#b32030"
  status-danger-soft: "rgba(179, 32, 48, 0.1)"
  status-info-dark: "#38bdf8"
  status-info-soft-dark: "rgba(56, 189, 248, 0.16)"
  status-success-dark: "#5fc296"
  status-success-soft-dark: "rgba(95, 194, 150, 0.16)"
  status-warning-dark: "#f59342"
  status-warning-soft-dark: "rgba(237, 125, 31, 0.16)"
  status-danger-dark: "#f4798a"
  status-danger-soft-dark: "rgba(244, 121, 138, 0.14)"
typography:
  display:
    fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  headline:
    fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "-0.025em"
  title:
    fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "0em"
  label:
    fontFamily: '"Public Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0.05em"
  mono:
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "0em"
    fontFeature: '"tnum"'
rounded:
  xs: "2px"
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.logo-maroon}"
    textColor: "{colors.logo-maroon-foreground}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.logo-maroon-hover}"
    textColor: "{colors.logo-maroon-foreground}"
  button-secondary:
    backgroundColor: "{colors.archival-paper}"
    textColor: "{colors.claret-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-hover}"
  button-rail:
    backgroundColor: "{colors.claret-ink-rail-surface}"
    textColor: "{colors.claret-ink-rail-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-rail-hover:
    backgroundColor: "{colors.claret-ink-rail-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  mode-segment:
    backgroundColor: "transparent"
    textColor: "{colors.muted-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  mode-segment-active:
    backgroundColor: "{colors.logo-maroon}"
    textColor: "{colors.logo-maroon-foreground}"
  input-field:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.claret-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
  proofing-sheet:
    backgroundColor: "{colors.archival-paper}"
    textColor: "{colors.claret-ink}"
    rounded: "{rounded.md}"
    padding: "24px 32px"
  sheet-panel:
    backgroundColor: "{colors.archival-paper}"
    textColor: "{colors.claret-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  top-rail:
    backgroundColor: "{colors.claret-ink-rail}"
    textColor: "{colors.claret-ink-rail-foreground}"
    padding: "0 16px"
    height: "52px"
  folio-dock:
    backgroundColor: "{colors.pressroom-chrome}"
    textColor: "{colors.claret-ink}"
    padding: "8px 16px"
  status-bar:
    backgroundColor: "{colors.claret-ink-rail}"
    textColor: "{colors.claret-ink-rail-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

# Design System: Brick Instruction Works

## Overview

**Creative North Star: "Logo-Matched Print-Proofing Table"**

Brick Instruction Works treats brick-model instruction authoring like a calibrated European print-proofing table harmonized directly with its three-plume emblem (`#38bdf8` sky blue, `#7c152e` deep maroon, `#ed7d1f` warm orange). Opaque archival-paper floating pills (`#FCFCFD` light / `#221E26` dark) edged with crisp slate hairlines float above a cool slate-stone proofing stage where either the welcome proofing sheet or the builder's live shadowed manual page sits as the undisputed hero. Every floating control, drawer, modal, and folio readout operates as an opaque pressroom instrument—quiet, tactile, hairline-separated, and legible on desktop monitors, tablets, and phones alike.

Because builders spend long sessions verifying piece visibility, camera angles, page breaks, and BOM layout on live instruction pages that carry their own bright LEGO brick colors and output themes, the studio chrome stays calm and low-chroma across surfaces while assigning disciplined roles to the logo's three colors: deep maroon (`--primary`) for primary actions and active states, warm orange (`--accent-warm`, `--warning`, `--rail-accent`) for studio tool icons and warning/toast highlights, and sky blue (`--info`) for technical and project-file accents. It rejects translucent frosted-glass blur, nested cards inside cards, and decorative glow shadows.

**Key Characteristics:**
- **Opaque archival floating pills:** Crisp solid-paper pills (`.studio-pill`) with `1px` `--border-strong` hairlines and neutral offset shadows float at top-left, top-right, and bottom-center so the manual page occupies the full viewport without glass blur.
- **Always-present editor identity:** Before load, the welcome proofing sheet (`#emptyState`) showcases the 3-plume logo and `Brick Instruction Works` across desktop and mobile without a redundant floating chip. Once a model is loaded, `#desktopModelChip` (`md+`) and `#mobileEditorBrandPill` (`< md`) anchor the logo, `Brick Instruction Works`, and active model title in the editor view.
- **Logo-harmonized proofing palette:** Cool slate-stone ground (`--background`) gives bright manual pages accurate neutral contrast while pairing cleanly with logo maroon, warm orange, and sky blue across light and dark modes.
- **Self-hosted institutional typography:** Variable `Public Sans` handles all prose and controls (`>= 12px` functional floor), paired with tabular `JetBrains Mono` strictly for folios, part IDs, file extensions, dimensions, and percentages.
- **Opaque hairline-separated sheets:** Drawers, popovers, and modals use solid archival paper (`--card`) divided by `1px` slate rules (`--border`) rather than translucent glass or nested boxes, paired with a deep claret-ink drawer header (`--rail`) and ink notification pills (`--ink-bar`).

## Colors

A calm pressroom neutral scale—cool slate stone, crisp archival paper, and deep claret-charcoal ink—paired with the logo's three signature colors calibrated for WCAG AA contrast in both light and system dark (`@media (prefers-color-scheme: dark)`) modes.

### Primary & Logo Triad
- **Logo Maroon** (`--primary`: `#7c152e` light / `#eb6a84` dark): Primary actions (Import Model, Export pill, Export to PDF, Save, Done, Next Page), active mode pill buttons, active tabs, `.IO` file badge, checkboxes/sliders, caret color, and `:focus-visible` outlines.
- **Logo Maroon Hover** (`--primary-hover`: `#641025` light / `#f28096` dark): Hover state for primary filled buttons, deepening in light mode and brightening in dark mode.
- **Logo Maroon Foreground** (`--primary-foreground`: `#ffffff` light / `#1a0a0f` dark): High-contrast label and icon ink seated on primary fills (`10.48:1` light / `6.33:1` dark).
- **Logo Maroon Soft / Border** (`--primary-soft` / `--primary-border`): Tinted fills and borders for secondary-emphasis buttons, active presets, dashed section dividers, and `::selection` highlights.
- **Warm Logo Orange** (`--accent-warm`: `#c75d0c` light / `#f59342` dark; `--brand-orange`: `#ed7d1f`; `--ink-bar-accent`: `#fb9e4f`): Studio tool icon accent (`Bricks Library`, `Style`), `--rail-accent`, `.LDR` badge (`--warning`), and high-legibility action text (`See issues`) inside the dark `--ink-bar` notification pill.
- **Logo Sky Blue** (`--info`: `#0369a1` light / `#38bdf8` dark; `--brand-sky`: `#38bdf8`): Project import icon accent, `.MPD` badge, informational diagnostics, and the first calibration dot on the proofing table strip.

### Neutral
- **Deep Claret Ink Rail** (`--rail`: `#23121a` light / `#160c11` dark): Slide-out menu drawer header and `--ink-bar` notification/toast pills.
- **Rail Alabaster Ink** (`--rail-foreground`: `#f7f3f5`, `--ink-bar-foreground`: `#f7f3f5`): Primary text and icons inside the claret-ink drawer header and toast/error pills.
- **Rail Muted Ink** (`--rail-muted`: `#c0aeb6` light / `#b8a5ae` dark): Secondary subtitle copy inside the dark drawer header.
- **Slate Stone Ground** (`--background`: `#e4e7ec` light / `#151318` dark): Full-bleed proofing table canvas behind the welcome sheet and live manual page.
- **Pressroom Chrome** (`--chrome`: `#f2f4f7` light / `#1c1920` dark): Modal headers and footers, drawer footer, and the Bricks Library 3D preview rail.
- **Archival Paper** (`--card`: `#fcfcfd` light / `#221e26` dark): Primary elevated surface for floating pills (`.studio-pill`), the welcome proofing sheet, modal bodies, style popover, drawer body, and secondary buttons.
- **Sunken Surface** (`--surface-sunken`: `#eaeef3` light / `#2b2630` dark): Calibration strips, capability footers, text inputs, selects, progress tracks, and info callouts.
- **Interactive Hover Surface** (`--surface-hover`: `#dfe4ec` light / `#352f3c` dark): Hover fill for floating pill triggers, secondary archival buttons, and ghost icon buttons.
- **Claret Ink & Muted Ink** (`--foreground`: `#1e161a` light / `#f6f3f7` dark; `--muted-foreground`: `#5a5157` light / `#aba2b0` dark): Primary headings, body prose, helper descriptions, and folio counts.
- **Slate Hairlines** (`--border`: `#cfd4dc` light / `#3c3543` dark; `--border-strong`: `#b4bcc8` light / `#554c5e` dark): `1px` structural dividers, input outlines, modal sheet borders, floating pill edges, scrollbars, and page-frame outlines.

### Semantic Status
- **Info / Sky Blue** (`--info`: `#0369a1` light / `#38bdf8` dark; `--info-soft`: `rgba(56, 189, 248, 0.14)` / `0.16`): Informational diagnostics, `.MPD` badges, and project import cues.
- **Success** (`--success`: `#1f6a4a` light / `#5fc296` dark; `--success-soft`): Export completion (`PDF Ready`) and resolved import status.
- **Warning / Orange** (`--warning`: `#ad5107` light / `#f59342` dark; `--warning-soft`: `rgba(237, 125, 31, 0.14)` / `0.16`): Missing parts count badges (`#mpCountBadge`, `#libTabManageBadge`), `.LDR` badges, and tolerance notices.
- **Danger** (`--danger`: `#b32030` light / `#f4798a` dark; `--danger-soft`): Error count badges, missing-part markers, and destructive actions (Delete Theme, Clear Entire Saved Library).

### Named Rules
**The Logo-Triad Hierarchy Rule.** Logo maroon (`--primary`) owns primary filled CTAs and active state fills; warm logo orange (`--accent-warm`/`--warning`) and logo sky blue (`--info`) stay restrained to icon accents, file-type badges, status indicators, and the 3-dot proofing registration strip—never competing filled CTA buttons.

**The Neutral Proofing Ground Rule.** The proofing stage (`--background`) remains low-chroma cool slate (`#e4e7ec` light, `#151318` dark) so Warm, Classic Blue, Modern White, Collector Dark, and Blueprint manual pages all retain accurate color perception.

**The Persistent Brand Identity Rule.** Both the restored 3-plume logo and `Brick Instruction Works` name remain visible in both welcome (`#emptyState` proofing sheet) and editor views across desktop (`#desktopModelChip`) and mobile (`#mobileEditorBrandPill`).

## Typography

**Display Font:** `Public Sans` (self-hosted variable WOFF2 `100 900`, Latin + Latin-Ext, with `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` fallback)
**Body Font:** `Public Sans` (same variable family; base root `16px`, body `0.875rem` / `14px`, line-height `1.45`)
**Label/Mono Font:** `JetBrains Mono` (self-hosted variable WOFF2 `100 800`, Latin + Latin-Ext, with `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` fallback, enforced with `font-variant-numeric: tabular-nums` via `.font-mono` and `.folio-num`)

**Character:** Dry, institutional, and pressroom-calibrated. `Public Sans` delivers crisp geometric neutrality at compact studio UI sizes without quirk or warmth bias, while tabular `JetBrains Mono` locks every folio number, part ID, dimension, and zoom percentage onto an unwavering mechanical grid. All font files are self-hosted in `src/assets/fonts/` (`font-display: swap`) for offline and Neocities compliance.

### Hierarchy
- **Display** (`700`, `1.5rem` mobile / `1.875rem` sm+ (`24px`–`30px`), line-height `1.25`, tracking `-0.025em`): Primary welcome proofing-sheet headline (`Brick Instruction Works`).
- **Headline** (`700`, `1rem` (`16px`), line-height `1.35`, tracking `-0.025em`): Modal sheet titles (`Page Setup`, `Parts List Setup`, `Bricks Library`, `Import Model`, `Pages & Steps`, `Model Issues`, `Export & Print`).
- **Title** (`600`–`700`, `0.875rem` (`14px`), line-height `1.35`, tracking `-0.015em`): Desktop identity pill wordmark (`Brick Instruction Works`), drawer model title, primary action buttons, format card titles, and manage-tab section headings.
- **Body** (`400`–`500`, `0.875rem` (`14px`) default body / `0.75rem` (`12px`) compact control copy, line-height `1.45`–`1.625`, max measure `54ch` on welcome prose): Explanatory paragraphs, toggle labels, and helper descriptions.
- **Label** (`600`, `0.75rem` (`12px`), tracking `0.05em`, uppercase): Section headers inside the slide-out drawer, Style popover, and setup modals (`Model & Project`, `Page & Export`, `Page Format`, `Custom Themes`).
- **Mono / Telemetry** (`600`, `0.75rem` (`12px`), `font-variant-numeric: tabular-nums`): Folio readouts (`Page 1 · 1/N`), zoom percentage (`100%`), part counts, LDraw part IDs, file extensions (`.io · .ldr · .mpd`, `.biw`, `.biwtheme`, `complete.zip`), paper dimensions (`8.5 × 11 in`), and progress percentages.

### Named Rules
**The 12px Functional Floor Rule.** Every interactive label, helper caption, badge, and monospace readout in studio chrome sits at `>= 12px` (`0.75rem`), with primary prose and body at `14px` (`0.875rem`). Never drop studio UI labels to sub-12px micro-type.

**The Telemetry-Only Mono Rule.** Reserve `JetBrains Mono` strictly for quantitative and machine-formatted data—folios, zoom scales, dimensions, counts, part codes, and file extensions—with `tabular-nums` enabled so live counters never jitter horizontally.

## Layout

Brick Instruction Works uses a locked full-viewport pressroom shell (`html`, `body`: `100% × 100%`, `overflow: hidden`, `overscroll-behavior: none`) where the proofing table fills 100% of the viewport and opaque floating pills anchor cleanly to the perimeter:

1. **Floating Top-Left Pill Cluster (`fixed top-3 left-3 z-40`):** Circular `40px` `#btnOpenMenu` floating pill (`studio-pill rounded-full`), paired on desktop (`md+`) with `#desktopModelChip` (`hidden`, toggled to `md:inline-flex` once a model is loaded) displaying the 3-plume logo + `Brick Instruction Works` + a vertical hairline divider + active model title.
2. **Mobile Editor Identity Pill (`#mobileEditorBrandPill`, `fixed top-[60px] left-1/2 -translate-x-1/2 z-30 md:hidden`):** Shown on `< md` whenever a model is loaded in the editor view, displaying the 3-plume logo, `Brick Instruction Works`, and the active model title without colliding with top-right editor controls.
3. **Floating Top-Right Pill Cluster (`fixed top-3 right-3 z-40`):** Shown when a model is loaded (`#topRightPills`: `Undo`/`Redo` pill, `Style` popover pill, and primary logo-maroon `Export` pill); omitted on the empty welcome page so Bricks Library and Import actions live in the menu and welcome sheet.
4. **Full-Bleed Proofing Stage (`#emptyState` / `#stageViewport`):** Fills the entire viewport (`flex-1 min-h-0`). Before load, centers the `max-w-2xl` (`672px`) welcome proofing sheet with top clearance (`pt-16 pb-6 px-4 sm:p-8`) below the top floating pills. After load, hosts the touch-locked (`touch-action: none`) infinite pan/zoom viewport centering `#pageFrame` with stage clearance (`pt-[104px] md:pt-16 pb-28 px-3`).
5. **Floating Bottom Dock (`#bottomDock`, `fixed bottom-3 left-1/2 -translate-x-1/2 z-40`):** Shown after model load as two stacked opaque floating pills: `#modePill` (`Pan` / `Edit` / `Select` / `Rotate`) stacked over the combined Page Folio & Zoom pill (`First`, primary maroon `Previous`, clickable `Page N · N/M` overview trigger, primary maroon `Next`, `Last`, hairline divider, `−`, `100%`, `+`). Mode-specific contextual overlays (`#contextOverlay`) and import issue banners (`#errorBanner`) float cleanly above at `bottom: 114px`.

**Responsive Breakpoints & Sheet Behavior:**
- **Mobile (`< 640px`):** Floating top pills remain `40px` (`h-10`) touch targets; welcome screen showcases the 3-plume logo + `Brick Instruction Works` on the proofing sheet, while the editor view anchors `#mobileEditorBrandPill` cleanly at `top-[60px]` above the manual page. Modals rise flush to the viewport bottom as full-width bottom sheets (`items-end p-0 rounded-t-xl`, max height `85vh`–`93vh`). The slide-out menu drawer spans `min(88vw, 356px)`.
- **Tablet (`sm: 640px+` / `md: 768px+`):** Modals detach into centered floating sheets (`items-center p-4 rounded-xl`, widths `max-w-sm` to `max-w-4xl`). At `md`, `#desktopModelChip` appears beside the menu pill and the Bricks Library opens its static `300px` right-hand 3D Part Preview inspector.
- **Desktop (`lg: 1024px+`):** The Import & Subdivision modal switches from stacked vertical panes to a 2-pane split (`46%` live 3D exploded canvas left, scrollable build organization proposals right), and the Bricks Library grid expands to 4 columns.

**Spacing Rhythm:** Anchored on a `4px` base unit (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`). Floating perimeter pills sit `12px` (`top-3` / `bottom-3` / `left-3` / `right-3`) from viewport edges with `8px` (`gap-2`) rhythm.

**Full-Document Print Media (`@media print`):** Clicking `Print` in `#exportModal` renders every page of `state.pages` into `#printAllPagesContainer` with dynamic `@page` dimensions matching the active paper format and orientation, hides all `.no-print` chrome and the interactive viewport (`body.printing-all-pages`), prints each page cleanly with `break-after: page`, and cleans up automatically on `afterprint`.

## Elevation & Depth

Surfaces are completely opaque and use a restrained hybrid of tonal paper shifts (`--background` → `--chrome` → `--card`) paired with crisp `1px` mineral hairlines (`--border`, `--border-strong`) and neutral ink-tinted drop shadows—never frosted glass (`backdrop-filter: blur`) and never colored accent glows.

### Shadow Vocabulary
- **Surface Lift (`--shadow-surface`):**
  - Light: `box-shadow: 0 2px 8px rgba(27, 26, 24, 0.08), 0 1px 2px rgba(27, 26, 24, 0.06)`
  - Dark: `box-shadow: 0 4px 14px rgba(0, 0, 0, 0.38), 0 1px 2px rgba(0, 0, 0, 0.28)`
  - Used on floating `.studio-pill` controls, `.studio-surface`, and floating contextual mode bars.
- **Modal & Sheet Lift (`--shadow-sheet`):**
  - Light: `box-shadow: 0 16px 38px rgba(27, 26, 24, 0.16), 0 2px 6px rgba(27, 26, 24, 0.08)`
  - Dark: `box-shadow: 0 22px 52px rgba(0, 0, 0, 0.56), 0 4px 12px rgba(0, 0, 0, 0.36)`
  - Used on `.studio-sheet` modals, the slide-out `#menuDrawer`, the `#stylePopover`, and the floating `--ink-bar` toast and issue notification pills.
- **Proofing Page Lift (`--shadow-page`):**
  - Light: `box-shadow: 0 14px 34px rgba(27, 26, 24, 0.16), 0 2px 6px rgba(27, 26, 24, 0.08)`
  - Dark: `box-shadow: 0 18px 46px rgba(0, 0, 0, 0.54), 0 2px 8px rgba(0, 0, 0, 0.36)`
  - Used exclusively on physical sheet artifacts seated on the proofing table: the live manual `#pageFrame` (`.studio-page-frame`) and the welcome `.proof-sheet-frame`.

### Named Rules
**The Opaque Pressroom Rule.** Studio chrome never uses `backdrop-filter` blur or translucent glass fills. Every floating pill, popover, drawer, and modal is solid archival paper or carbon ink backed by a `1px` hairline border and neutral offset shadow.

**The Flat-Internal-Bands Rule.** Inside modals, drawers, and the welcome proofing sheet, separate sections with `1px` `--border` hairlines and subtle `--surface-sunken` or `--chrome` band shifts—never stack bordered cards inside bordered cards.

## Shapes

Form language combines crisp floating pills for stage-overlay controls with architectural sheets for dialogs and printed artifacts:

- **Micro (`2px`):** Swatch chips and rotated popover tail top-left tip (`border-top-left-radius: 2px`).
- **Small (`4px`, `rounded`):** Inline monospace badges and file/status tags.
- **Medium (`6px`, `rounded-md`):** Modal footer buttons, setup option grids, and compact numeric controls.
- **Large (`8px`, `rounded-lg`):** Full-width drawer/export action buttons, text inputs, select dropdowns, drawer summary bands, and theme preview cards.
- **Extra-Large (`12px`, `rounded-xl` / `rounded-t-xl`):** Welcome `.proof-sheet-frame`, floating modal sheets, and the anchored `#stylePopover` body.
- **Full (`999px`, `rounded-full`):** Floating studio pills (`.studio-pill`, `#btnOpenMenu`, `#desktopModelChip`, `#topRightPills`, `#modePill`, Page & Zoom pill, hero welcome CTAs, `#errorBanner`, `#toast`), progress bar tracks, `7px` scrollbar thumbs, `8px` status dots, and circular error count badges.
- **Brand Emblem (`public/logo.svg`):** The `64×64` three-plume arrow-arc mark tilted `12°` around `(32, 32)` in sky blue (`#38bdf8`), deep maroon (`#7c152e`), and warm orange (`#ed7d1f`), with full normal end arrowheads on each arc and balanced single-sided (left or right half) intermediate barbs (`L/R` on blue, `R/L/L` on maroon, `L/R` on orange) along smooth continuous arc edges. Rendered directly on archival paper surfaces (`#emptyState` welcome header, `#desktopModelChip`, `#openModelModal`, and generated manual cover/back-cover badges) and seated on a `36×36` archival-paper tile (`#faf9f6`) inside the dark carbon-ink `#menuDrawer` header so the deep maroon center plume retains full contrast.

## Components

Controls feel crisp, immediate, and mechanical—instant color feedback on hover, explicit `2px solid var(--primary)` (`2px` offset) `:focus-visible` rings, and an authored `180ms` exponential ease-out (`--ease-press: cubic-bezier(0.16, 1, 0.3, 1)`) entrance curve on sheets, popovers, and drawers. All animations collapse to `0.01ms` under `@media (prefers-reduced-motion: reduce)`.

### Buttons
- **Floating Studio Pill (`.studio-pill`):** Opaque `--card` fill, `1px solid var(--border-strong)`, `--shadow-surface`, `999px` (`rounded-full`), `40px` (`h-10`) height on top perimeter controls, shifting cleanly to `--surface-hover` on hover. When the Style popover is open, `.style-chip-open` flips `#btnStylePop` to solid `--primary` with `--primary-foreground`.
- **Primary:** `--primary` fill (`#c9341b` light / `#eb593e` dark) with `--primary-foreground` text (`#ffffff` light / `#18100d` dark), `600` weight, transitioning to `--primary-hover`.
- **Secondary Archival:** `--card` fill with `1px solid var(--border-strong)` (or `--border`), `--foreground` text, transitioning to `--surface-hover`.
- **Export & Print Modal Stack (`#exportModal`):** Three balanced, full-width, center-aligned full-document actions with zero redundant per-page option or `Offline` badge:
  1. `Export to PDF` (primary registration vermilion — exports all pages)
  2. `Export 3D Interactive Viewer (HTML)` (secondary archival — exports all pages & steps)
  3. `Print` (secondary archival — renders and prints all pages via system print dialog)
- **Ghost & Destructive:** Ghost buttons use transparent background and `--muted-foreground` text shifting to `--surface-hover`. Destructive actions use `--danger-soft` fill, `40%` `--danger` border, and `--danger` ink (or solid `--danger` with white text on final confirmation).

### Chips & Segmented Controls
- **Floating Mode Pill (`#modePill`):** Opaque `.studio-pill` (`rounded-full`, `p-1`) housing `Pan`, `Edit` (contextual), `Select`, `Rotate`, and `Arrange` pill buttons (`min-h-[34px]`, `rounded-full`). Active mode takes solid `--primary` + `--primary-foreground`; inactive modes show `--muted-foreground`, shifting to `--foreground` on `--surface-hover`.
- **Option & Filter Grids:** Segmented multi-column choice buttons inside modals follow the same binary state rule: inactive `1px solid var(--border)` on `--background`/`--card`, active solid `--primary` + `--primary-foreground` (or `--primary-soft` + `--primary` border on descriptive format cards).

### Cards / Containers
- **Welcome Sheet (`.proof-sheet-frame`):** `max-w-2xl` archival paper sheet (`--card`), `12px` radius, `1px solid var(--border-strong)`, `--shadow-page`. Divides cleanly into the main identity band displaying the restored 3-plume logo beside the `Brick Instruction Works` title and subtitle (visible on both mobile and desktop), a dashed-top dropzone band (`#emptyDropZone`) with equal-prominence pill CTAs (`Import Model File` and `Import Project`), and a 3-column capability strip.
- **Modal Sheets (`.studio-sheet`):** Full-width bottom sheet (`rounded-t-xl`) on mobile and centered `12px` (`rounded-xl`) sheet on `sm+`, `1px solid var(--border)`, `--shadow-sheet`, over `rgba(0,0,0,0.5)` scrims. Top header and bottom footer use `--chrome` separated by `1px solid var(--border)` from the scrollable `--card` body.
- **Slide-Out Menu Drawer (`#menuDrawer`):** Left-anchored `min(88vw, 356px)` full-height sheet (`--card`, right `--border`, `--shadow-sheet`) topped by a `--rail` carbon-ink header, flat hairline-separated sections (`gap-6`, `pt-5 border-t`), and a `--chrome` footer.
- **Anchored Style Popover (`#stylePopover`):** Fixed top-right (`top: 60px`, `right: 12px`, `w-[min(92vw,336px)]`) `.studio-sheet` (`rounded-xl`, `p-4`) connected to `#btnStylePop` by a `13px × 13px` rotated `.style-popover-tail` diamond positioned dynamically via `--style-tail-right`.

### Inputs / Fields
- **Style:** `--surface-sunken` fill, `1px solid var(--border)`, `8px` (`rounded-lg`) or `6px` (`rounded-md`) corners, `10px 12px`–`14px` padding, `12px`–`14px` `Public Sans` (or `JetBrains Mono` for numeric custom page dimensions).
- **Focus & Selection:** Border shifts cleanly to `--primary`; text inputs carry `caret-color: var(--primary)` and `::selection` in `--primary-soft`.

### Navigation
- **Floating Top Perimeter Pills:** Top-left circular Menu pill + desktop-only identity pill (`md+`), paired with top-right empty-state or loaded-model pills (`Undo`/`Redo`, `Style`, primary vermilion `Export`).
- **Floating Bottom Folio & Zoom Dock (`#bottomDock`):** Floating `#modePill` stacked cleanly above the combined Page Folio (`First`, `Previous`, `Page N · N/M` overview trigger, `Next`, `Last`) and monospace Zoom (`−`, `100%`, `+`) pill.

### Signature Components: Proofing Stage & Ink Notification Pills
- **Proofing Stage (`.proofing-stage` + `.studio-page-frame`):** Full-bleed `--background` mineral table centering `#pageFrame` (`.studio-page-frame`: `1px solid var(--border-strong)` and `--shadow-page`). Note: `.blueprint-grid` is strictly an output-manual canvas theme rendered inside `#pageFrame`, never on studio chrome.
- **High-Contrast Ink Notification Pills (`#errorBanner` & `#toast`):** Floating carbon-ink (`--ink-bar`) pills (`rounded-full`) with `--ink-bar-foreground` text, `1px solid rgba(255,255,255,0.15)` border, and `--shadow-sheet`.

## Do's and Don'ts

### Do:
- **Do** keep studio chrome strictly in the Billund mineral-stone, archival-paper, and carbon-ink palette, reserving registration vermilion (`--primary`) for primary actions, active selections, focus outlines, and key indicators.
- **Do** use opaque `.studio-pill` archival-paper pills with `1px solid var(--border-strong)` and neutral `--shadow-surface` for floating perimeter controls—never translucent frosted glass.
- **Do** keep `#desktopModelChip` hidden on mobile (`hidden md:inline-flex`) so the main page stays title-free on narrow viewports.
- **Do** use self-hosted `Public Sans` at `>= 12px` for all UI labels and `14px` for body prose, and reserve tabular `JetBrains Mono` (`.font-mono` / `.folio-num`) strictly for folios, part IDs, file extensions, dimensions, counts, and percentages.
- **Do** separate internal drawer, modal, and welcome-sheet sections using `1px solid var(--border)` hairlines and subtle `--surface-sunken` / `--chrome` bands.
- **Do** reveal popovers, drawers, and modal sheets with `180ms var(--ease-press)` (`cubic-bezier(0.16, 1, 0.3, 1)`) and honor `prefers-reduced-motion: reduce`.
- **Do** keep all Export & Print modal actions full-document and center-aligned (`Export to PDF`, `Export 3D Interactive Viewer (HTML)`, `Print`).

### Don't:
- **Don't** apply `backdrop-filter` glass blur, translucent pill fills, or colored accent drop-shadows anywhere in the studio interface.
- **Don't** nest bordered cards inside bordered cards inside drawers, modals, or the welcome proofing sheet.
- **Don't** introduce secondary brand hues (such as SaaS blue or purple) into studio controls or tint the mineral-stone proofing stage beige or blue-grey.
- **Don't** apply `.blueprint-grid` to studio chrome—it exists exclusively as a user-selectable output theme inside the rendered manual page (`#pageFrame`).
- **Don't** drop studio UI text below `12px` or load external CDN fonts; keep all variable WOFF2 font faces self-hosted under `src/assets/fonts/` for offline and static-host compliance.
