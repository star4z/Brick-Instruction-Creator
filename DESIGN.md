---
name: Brick Instruction Works
description: Calibrated European print-proofing studio for converting BrickLink Studio and LDraw brick models into publication-ready instruction manuals.
colors:
  registration-vermilion: "#c9341b"
  registration-vermilion-hover: "#b02b14"
  registration-vermilion-foreground: "#ffffff"
  registration-vermilion-soft: "rgba(201, 52, 27, 0.11)"
  registration-vermilion-border: "rgba(201, 52, 27, 0.38)"
  registration-vermilion-dark: "#eb593e"
  registration-vermilion-hover-dark: "#f26c52"
  registration-vermilion-foreground-dark: "#18100d"
  registration-vermilion-soft-dark: "rgba(235, 89, 62, 0.16)"
  registration-vermilion-border-dark: "rgba(235, 89, 62, 0.44)"
  carbon-ink-rail: "#1b1a18"
  carbon-ink-rail-foreground: "#f4f2ec"
  carbon-ink-rail-muted: "#b5b1a7"
  carbon-ink-rail-border: "#32302c"
  carbon-ink-rail-surface: "#282623"
  carbon-ink-rail-hover: "#35332e"
  carbon-ink-rail-accent: "#eb593e"
  carbon-ink-rail-dark: "#111110"
  carbon-ink-rail-muted-dark: "#a6a298"
  carbon-ink-rail-border-dark: "#282723"
  carbon-ink-rail-surface-dark: "#1e1d1a"
  carbon-ink-rail-hover-dark: "#2b2925"
  mineral-stone: "#dcdfd9"
  pressroom-chrome: "#f1f0eb"
  archival-paper: "#faf9f6"
  surface-sunken: "#ecebe5"
  surface-hover: "#e2e1da"
  carbon-ink: "#1b1a18"
  graphite-muted: "#56544d"
  warm-mineral-hairline: "#c9c8c0"
  warm-mineral-hairline-strong: "#aeada4"
  registration-mark: "rgba(27, 26, 24, 0.36)"
  mineral-stone-dark: "#171614"
  pressroom-chrome-dark: "#1e1d1a"
  archival-paper-dark: "#23221f"
  surface-sunken-dark: "#2b2a26"
  surface-hover-dark: "#34322d"
  carbon-ink-dark: "#f3f1ec"
  graphite-muted-dark: "#a8a49a"
  warm-mineral-hairline-dark: "#3a3832"
  warm-mineral-hairline-strong-dark: "#524f47"
  registration-mark-dark: "rgba(243, 241, 236, 0.26)"
  ink-bar-accent: "#ff937d"
  status-info: "#255b8a"
  status-info-soft: "rgba(37, 91, 138, 0.12)"
  status-success: "#246848"
  status-success-soft: "rgba(36, 104, 72, 0.12)"
  status-warning: "#8c560e"
  status-warning-soft: "rgba(140, 86, 14, 0.13)"
  status-danger: "#b4261a"
  status-danger-soft: "rgba(180, 38, 26, 0.1)"
  status-info-dark: "#7ab3e6"
  status-info-soft-dark: "rgba(122, 179, 230, 0.16)"
  status-success-dark: "#6bc497"
  status-success-soft-dark: "rgba(107, 196, 151, 0.16)"
  status-warning-dark: "#e5b35c"
  status-warning-soft-dark: "rgba(229, 179, 92, 0.16)"
  status-danger-dark: "#f6877b"
  status-danger-soft-dark: "rgba(246, 135, 123, 0.14)"
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
    backgroundColor: "{colors.registration-vermilion}"
    textColor: "{colors.registration-vermilion-foreground}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.registration-vermilion-hover}"
    textColor: "{colors.registration-vermilion-foreground}"
  button-secondary:
    backgroundColor: "{colors.archival-paper}"
    textColor: "{colors.carbon-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.md}"
    padding: "10px 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.surface-hover}"
  button-rail:
    backgroundColor: "{colors.carbon-ink-rail-surface}"
    textColor: "{colors.carbon-ink-rail-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  button-rail-hover:
    backgroundColor: "{colors.carbon-ink-rail-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
  mode-segment:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  mode-segment-active:
    backgroundColor: "{colors.registration-vermilion}"
    textColor: "{colors.registration-vermilion-foreground}"
  input-field:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.carbon-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
  proofing-sheet:
    backgroundColor: "{colors.archival-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.md}"
    padding: "24px 32px"
  sheet-panel:
    backgroundColor: "{colors.archival-paper}"
    textColor: "{colors.carbon-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  top-rail:
    backgroundColor: "{colors.carbon-ink-rail}"
    textColor: "{colors.carbon-ink-rail-foreground}"
    padding: "0 16px"
    height: "52px"
  folio-dock:
    backgroundColor: "{colors.pressroom-chrome}"
    textColor: "{colors.carbon-ink}"
    padding: "8px 16px"
  status-bar:
    backgroundColor: "{colors.carbon-ink-rail}"
    textColor: "{colors.carbon-ink-rail-foreground}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
---

# Design System: Brick Instruction Works

## Overview

**Creative North Star: "Billund Print-Proofing Table"**

Brick Instruction Works treats brick-model instruction authoring like a calibrated European print-proofing table. Opaque archival-paper floating pills (`#FAF9F6` light / `#23221F` dark) edged with strong mineral hairlines float quietly above a calm mineral-stone proofing stage where either the welcome proofing sheet or the builder's live shadowed manual page sits as the undisputed hero. Every floating control, drawer, modal, and folio readout operates as an opaque pressroom instrument—quiet, tactile, hairline-separated, and legible on desktop monitors, tablets, and phones alike.

Because builders spend long sessions verifying piece visibility, camera angles, page breaks, and BOM layout on live instruction pages that carry their own bright LEGO brick colors and output themes, the studio chrome deliberately stays dry and achromatic outside a single registration-vermilion action accent. It rejects translucent frosted-glass blur, nested cards inside cards, generic blue CAD chrome, and decorative glow shadows in favor of solid archival paper pills and sheets, warm-mineral hairlines, and crisp mechanical transitions.

**Key Characteristics:**
- **Opaque archival floating pills:** Crisp solid-paper pills (`.studio-pill`) with `1px` `--border-strong` hairlines and neutral offset shadows float at top-left, top-right, and bottom-center so the manual page occupies the full viewport without glass blur. On mobile, the identity/title pill is hidden from the main canvas and lives inside the slide-out menu drawer.
- **Mineral-stone proofing table:** Neutral stone ground (`--background`) gives bright archival manual sheets crisp physical contrast without beige warmth or cool blue cast.
- **Single-accent discipline:** Registration vermilion (`--primary`) marks only primary actions, active selections, focus rings, and key indicators.
- **Self-hosted institutional typography:** Variable `Public Sans` handles all prose and controls (`>= 12px` functional floor), paired with tabular `JetBrains Mono` strictly for folios, part IDs, file extensions, dimensions, and percentages.
- **Opaque hairline-separated sheets:** Drawers, popovers, and modals use solid archival paper (`--card`) divided by `1px` mineral rules (`--border`) rather than translucent glass or nested boxes, paired with a committed carbon-ink drawer header (`--rail`) and ink notification pills (`--ink-bar`).

## Colors

An achromatic pressroom palette—mineral stone, archival paper, and carbon ink—punctuated by one registration-vermilion signal accent and muted semantic status tones, calibrated for both light and system dark (`@media (prefers-color-scheme: dark)`) modes.

### Primary
- **Registration Vermilion** (`--primary`: `#c9341b` light / `#eb593e` dark): Primary actions (Import Model, Export pill, Export to PDF, Save, Done, Next Page), active mode pill buttons, active tabs, checkboxes/sliders (`accent-color`), caret color, and `:focus-visible` outlines.
- **Registration Vermilion Hover** (`--primary-hover`: `#b02b14` light / `#f26c52` dark): Hover state for primary filled buttons, deepening in light mode and brightening in dark mode.
- **Registration Vermilion Foreground** (`--primary-foreground`: `#ffffff` light / `#18100d` dark): High-contrast label and icon ink seated on primary vermilion fills.
- **Registration Vermilion Soft** (`--primary-soft`: `rgba(201, 52, 27, 0.11)` light / `rgba(235, 89, 62, 0.16)` dark): Tinted fills for secondary-emphasis vermilion buttons (Subdivide Model, Fetch All Starter Packs), active page/step highlights, drag-over dropzone state, progress panels, and `::selection` highlights.
- **Registration Vermilion Border** (`--primary-border`: `rgba(201, 52, 27, 0.38)` light / `rgba(235, 89, 62, 0.44)` dark): Borders for soft-vermilion actions, active preset rings, dashed section dividers, and `.print-margin-guide` outlines.
- **Ink Bar Accent** (`--ink-bar-accent`: `#ff937d`): High-legibility coral-vermilion action text (`See issues`) inside the dark `--ink-bar` notification pill.

### Neutral
- **Carbon Ink Rail** (`--rail`: `#1b1a18` light / `#111110` dark): Slide-out menu drawer header and `--ink-bar` notification/toast pills.
- **Rail Alabaster Ink** (`--rail-foreground`: `#f4f2ec`, `--ink-bar-foreground`: `#f4f2ec`): Primary text and icons inside the carbon-ink drawer header and toast/error pills.
- **Rail Muted Ink** (`--rail-muted`: `#b5b1a7` light / `#a6a298` dark): Secondary subtitle copy inside the dark drawer header.
- **Mineral Stone Ground** (`--background`: `#dcdfd9` light / `#171614` dark): Full-bleed proofing table canvas behind the welcome sheet and live manual page. Deliberately mineral-grey rather than warm beige or cool blue-grey so every brick manual theme reads true.
- **Pressroom Chrome** (`--chrome`: `#f1f0eb` light / `#1e1d1a` dark): Modal headers and footers, drawer footer, and the Bricks Library 3D preview rail.
- **Archival Paper** (`--card`: `#faf9f6` light / `#23221f` dark): Primary elevated surface for floating pills (`.studio-pill`), the welcome proofing sheet, modal bodies, style popover, drawer body, and secondary buttons.
- **Sunken Surface** (`--surface-sunken`: `#ecebe5` light / `#2b2a26` dark): Calibration strips, capability footers, text inputs, selects, progress tracks, and info callouts.
- **Interactive Hover Surface** (`--surface-hover`: `#e2e1da` light / `#34322d` dark): Hover fill for floating pill triggers, secondary archival buttons, and ghost icon buttons.
- **Carbon Ink** (`--foreground`: `#1b1a18` light / `#f3f1ec` dark): Primary headings, body copy, labels, and active icons on light/dark studio surfaces.
- **Graphite Muted** (`--muted-foreground`: `#56544d` light / `#a8a49a` dark): Helper copy, section headers, secondary descriptions, inactive mode icons, and folio counts.
- **Warm Mineral Hairlines** (`--border`: `#c9c8c0` light / `#3a3832` dark; `--border-strong`: `#aeada4` light / `#524f47` dark): `1px` structural dividers, input outlines, modal sheet borders, floating pill edges (`--border-strong`), scrollbars (`--border-strong`), and proof-sheet/page-frame outlines (`--border-strong`).

### Semantic Status
- **Press Info** (`--info`: `#255b8a` light / `#7ab3e6` dark; `--info-soft`: `rgba(37, 91, 138, 0.12)` light / `rgba(122, 179, 230, 0.16)` dark): Informational diagnostics and neutral status indicators.
- **Press Success** (`--success`: `#246848` light / `#6bc497` dark; `--success-soft`: `rgba(36, 104, 72, 0.12)` light / `rgba(107, 196, 151, 0.16)` dark): Export completion (`PDF Ready`) and resolved import status.
- **Press Warning** (`--warning`: `#8c560e` light / `#e5b35c` dark; `--warning-soft`: `rgba(140, 86, 14, 0.13)` light / `rgba(229, 179, 92, 0.16)` dark): Missing parts count badges (`#mpCountBadge`, `#libTabManageBadge`) and tolerance notices.
- **Press Danger** (`--danger`: `#b4261a` light / `#f6877b` dark; `--danger-soft`: `rgba(180, 38, 26, 0.1)` light / `rgba(246, 135, 123, 0.14)` dark): Error count badges, missing-part markers, and destructive actions (Delete Theme, Clear Entire Saved Library).

### Named Rules
**The One-Accent Pressroom Rule.** Registration vermilion (`--primary`) is the sole studio chrome accent. Never introduce secondary brand colors into floating pills, popovers, or drawers; keep brick and theme colors isolated inside the live manual page and theme preview swatches.

**The Neutral Mineral Ground Rule.** The proofing stage (`--background`) remains low-chroma mineral stone (`#dcdfd9` light, `#171614` dark)—never beige parchment and never cool blue-grey—so Warm, Classic Blue, Modern White, Collector Dark, and Blueprint manual pages all retain accurate color perception.

**The Mobile Clean-Canvas Rule.** On mobile (`< 768px`), omit the main-page title/identity pill (`#desktopModelChip`) so only compact floating controls appear over the canvas; the studio and active model title live cleanly inside the slide-out menu drawer.

## Typography

**Display Font:** `Public Sans` (self-hosted variable WOFF2 `100 900`, Latin + Latin-Ext, with `-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif` fallback)
**Body Font:** `Public Sans` (same variable family; base root `16px`, body `0.875rem` / `14px`, line-height `1.45`)
**Label/Mono Font:** `JetBrains Mono` (self-hosted variable WOFF2 `100 800`, Latin + Latin-Ext, with `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace` fallback, enforced with `font-variant-numeric: tabular-nums` via `.font-mono` and `.folio-num`)

**Character:** Dry, institutional, and pressroom-calibrated. `Public Sans` delivers crisp geometric neutrality at compact studio UI sizes without quirk or warmth bias, while tabular `JetBrains Mono` locks every folio number, part ID, dimension, and zoom percentage onto an unwavering mechanical grid. All font files are self-hosted in `src/assets/fonts/` (`font-display: swap`) for offline and Neocities compliance.

### Hierarchy
- **Display** (`700`, `1.5rem` mobile / `1.875rem` sm+ (`24px`–`30px`), line-height `1.25`, tracking `-0.025em`): Primary welcome proofing-sheet headline (`Set a brick model for print.`).
- **Headline** (`700`, `1rem` (`16px`), line-height `1.35`, tracking `-0.025em`): Modal sheet titles (`Page Setup`, `Parts List Setup`, `Bricks Library`, `Import Model`, `Pages & Steps`, `Model Issues`, `Export & Print`).
- **Title** (`600`–`700`, `0.875rem` (`14px`), line-height `1.35`, tracking `-0.015em`): Desktop identity pill wordmark (`Brick Instruction Works`), drawer model title, primary action buttons, format card titles, and manage-tab section headings.
- **Body** (`400`–`500`, `0.875rem` (`14px`) default body / `0.75rem` (`12px`) compact control copy, line-height `1.45`–`1.625`, max measure `54ch` on welcome prose): Explanatory paragraphs, toggle labels, and helper descriptions.
- **Label** (`600`, `0.75rem` (`12px`), tracking `0.05em`, uppercase): Section headers inside the slide-out drawer, Style popover, and setup modals (`Model & Project`, `Page & Export`, `Page Format`, `Custom Themes`).
- **Mono / Telemetry** (`600`, `0.75rem` (`12px`), `font-variant-numeric: tabular-nums`): Folio readouts (`Page 1 · 1/N`), zoom percentage (`100%`), part counts, LDraw part IDs, file extensions (`.io · .ldr · .mpd`, `.bic.json`, `complete.zip`), paper dimensions (`8.5 × 11 in`), and progress percentages.

### Named Rules
**The 12px Functional Floor Rule.** Every interactive label, helper caption, badge, and monospace readout in studio chrome sits at `>= 12px` (`0.75rem`), with primary prose and body at `14px` (`0.875rem`). Never drop studio UI labels to sub-12px micro-type.

**The Telemetry-Only Mono Rule.** Reserve `JetBrains Mono` strictly for quantitative and machine-formatted data—folios, zoom scales, dimensions, counts, part codes, and file extensions—with `tabular-nums` enabled so live counters never jitter horizontally.

## Layout

Brick Instruction Works uses a locked full-viewport pressroom shell (`html`, `body`: `100% × 100%`, `overflow: hidden`, `overscroll-behavior: none`) where the proofing table fills 100% of the viewport and opaque floating pills anchor cleanly to the perimeter:

1. **Floating Top-Left Pill Cluster (`fixed top-3 left-3 z-40`):** Circular `40px` `#btnOpenMenu` floating pill (`studio-pill rounded-full`) paired on desktop (`md+`) with the `#desktopModelChip` identity/model pill (`hidden md:inline-flex`). On mobile, only the compact circular menu pill appears—no title sits on the main page.
2. **Floating Top-Right Pill Cluster (`fixed top-3 right-3 z-40`):** Switches cleanly between empty-state quick tools (`#headerEmptyActions`: `Bricks Library` / `Bricks` pill + desktop `Open Project` pill) and loaded-model controls (`#topRightPills`: `Undo`/`Redo` pill, `Style` popover pill, and primary registration-vermilion `Export` pill).
3. **Full-Bleed Proofing Stage (`#emptyState` / `#stageViewport`):** Fills the entire viewport (`flex-1 min-h-0`). Before load, centers the `max-w-2xl` (`672px`) welcome proofing sheet with top clearance (`pt-16 pb-6 px-4 sm:p-8`) below the top floating pills. After load, hosts the touch-locked (`touch-action: none`) infinite pan/zoom viewport centering `#pageFrame` with stage clearance (`pt-16 pb-28 px-3`).
4. **Floating Bottom Dock (`#bottomDock`, `fixed bottom-3 left-1/2 -translate-x-1/2 z-40`):** Shown after model load as two stacked opaque floating pills: `#modePill` (`Pan` / `Edit` / `Select` / `Rotate` / `Arrange`) stacked over the combined Page Folio & Zoom pill (`Previous`, clickable `Page N · N/M` overview trigger, primary vermilion `Next`, hairline divider, `−`, `100%`, `+`). Mode-specific contextual overlays (`#contextOverlay`) and import issue banners (`#errorBanner`) float cleanly above at `bottom: 114px`.

**Responsive Breakpoints & Sheet Behavior:**
- **Mobile (`< 640px`):** Floating top pills remain `40px` (`h-10`) touch targets; `#desktopModelChip` stays hidden (`hidden md:inline-flex`) so the canvas stays uncluttered. Modals rise flush to the viewport bottom as full-width bottom sheets (`items-end p-0 rounded-t-xl`, max height `85vh`–`93vh`). The slide-out menu drawer spans `min(88vw, 356px)`.
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

- **Micro (`2px`):** Swatch chips, rotated popover tail top-left tip (`border-top-left-radius: 2px`), and the `2×2` brick plate outline inside `public/logo.svg`.
- **Small (`4px`, `rounded`):** Inline monospace badges and file/status tags.
- **Medium (`6px`, `rounded-md`):** Modal footer buttons, setup option grids, and compact numeric controls.
- **Large (`8px`, `rounded-lg`):** Full-width drawer/export action buttons, text inputs, select dropdowns, drawer summary bands, and theme preview cards.
- **Extra-Large (`12px`, `rounded-xl` / `rounded-t-xl`):** Welcome `.proof-sheet-frame`, floating modal sheets, and the anchored `#stylePopover` body.
- **Full (`999px`, `rounded-full`):** Floating studio pills (`.studio-pill`, `#btnOpenMenu`, `#desktopModelChip`, `#headerEmptyActions`, `#topRightPills`, `#modePill`, Page & Zoom pill, hero welcome CTAs, `#errorBanner`, `#toast`), progress bar tracks, `7px` scrollbar thumbs, `8px` status dots, and circular error count badges.
- **Geometric Emblem (`public/logo.svg`):** A `64×64` square mark with outer registration crop ticks framing a `36×36` (`rx="2"`) `2×2` archival-paper brick plate bearing four `r="5"` studs: top-left filled registration vermilion (`#C9341B`), top-right and bottom-left outlined carbon ink, bottom-right filled carbon ink (`#1B1A18`). At `20px` in the desktop identity pill, the outer crop ticks are dropped for optical clarity.

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
- **Welcome Proofing Sheet (`.proof-sheet-frame`):** `max-w-2xl` archival paper sheet (`--card`), `12px` radius, `1px solid var(--border-strong)`, `--shadow-page`. Divides cleanly into a sunken calibration strip (`Proofing Table` + `.io · .ldr · .mpd`), main identity & description body, dashed-top dropzone band (`#emptyDropZone`) with pill-shaped primary/secondary CTAs, and a 3-column capability strip.
- **Modal Sheets (`.studio-sheet`):** Full-width bottom sheet (`rounded-t-xl`) on mobile and centered `12px` (`rounded-xl`) sheet on `sm+`, `1px solid var(--border)`, `--shadow-sheet`, over `rgba(0,0,0,0.5)` scrims. Top header and bottom footer use `--chrome` separated by `1px solid var(--border)` from the scrollable `--card` body.
- **Slide-Out Menu Drawer (`#menuDrawer`):** Left-anchored `min(88vw, 356px)` full-height sheet (`--card`, right `--border`, `--shadow-sheet`) topped by a `--rail` carbon-ink header, flat hairline-separated sections (`gap-6`, `pt-5 border-t`), and a `--chrome` footer.
- **Anchored Style Popover (`#stylePopover`):** Fixed top-right (`top: 60px`, `right: 12px`, `w-[min(92vw,336px)]`) `.studio-sheet` (`rounded-xl`, `p-4`) connected to `#btnStylePop` by a `13px × 13px` rotated `.style-popover-tail` diamond positioned dynamically via `--style-tail-right`.

### Inputs / Fields
- **Style:** `--surface-sunken` fill, `1px solid var(--border)`, `8px` (`rounded-lg`) or `6px` (`rounded-md`) corners, `10px 12px`–`14px` padding, `12px`–`14px` `Public Sans` (or `JetBrains Mono` for numeric custom page dimensions).
- **Focus & Selection:** Border shifts cleanly to `--primary`; text inputs carry `caret-color: var(--primary)` and `::selection` in `--primary-soft`.

### Navigation
- **Floating Top Perimeter Pills:** Top-left circular Menu pill + desktop-only identity pill (`md+`), paired with top-right empty-state or loaded-model pills (`Undo`/`Redo`, `Style`, primary vermilion `Export`).
- **Floating Bottom Folio & Zoom Dock (`#bottomDock`):** Floating `#modePill` stacked cleanly above the combined Page Folio (`Previous`, `Page N · N/M` overview trigger, primary vermilion `Next`) and monospace Zoom (`−`, `100%`, `+`) pill.

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
