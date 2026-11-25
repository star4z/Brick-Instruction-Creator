/**
 * Pure responsive state and layout calculations for the unified side menu.
 *
 * Design invariants:
 * - On desktop (`viewportWidth >= 1024px`), the side menu starts expanded by
 *   default as a docked left panel that reserves horizontal workspace width
 *   instead of covering the proofing stage with a modal scrim.
 * - On tablet/mobile (`viewportWidth < 1024px`), the side menu starts collapsed
 *   and opens as a dismissible overlay drawer above a backdrop scrim.
 * - In all states, the side menu combines with the top-left menu button and
 *   site title (`Brick Instruction Works`) as one continuous header instead of
 *   replacing them with a separate drawer header.
 */

export const DESKTOP_SIDE_MENU_BREAKPOINT_PX = 1024;
export const TABLET_BRAND_BREAKPOINT_PX = 768;
export const SIDE_MENU_WIDTH_PX = 328;
export const SIDE_MENU_INSET_PX = 12;
export const SIDE_MENU_DESKTOP_WORKSPACE_INSET_PX = SIDE_MENU_WIDTH_PX + SIDE_MENU_INSET_PX;

export interface SideMenuState {
  /** Whether the docked desktop side menu is expanded (defaults to true). */
  desktopExpanded: boolean;
  /** Whether the mobile/tablet overlay side menu is open (defaults to false). */
  overlayOpen: boolean;
}

export interface SideMenuLayoutInput {
  state: SideMenuState;
  viewportWidth: number;
  hasModel: boolean;
  errorBadgeCount?: number;
}

export type SideMenuMode = 'docked' | 'overlay' | 'collapsed';

export interface SideMenuLayout {
  isDesktop: boolean;
  isExpanded: boolean;
  isDocked: boolean;
  isOverlay: boolean;
  mode: SideMenuMode;
  showBackdrop: boolean;
  workspaceLeftInsetPx: number;
  showBrandTitleInHeader: boolean;
  showModelNameInHeader: boolean;
  showMobileEditorBrandPill: boolean;
  showMenuButtonErrorBadge: boolean;
  isCompactPill: boolean;
}

export function createInitialSideMenuState(): SideMenuState {
  return {
    desktopExpanded: true,
    overlayOpen: false,
  };
}

export function isDesktopSideMenuViewport(viewportWidth: number): boolean {
  return Number.isFinite(viewportWidth) && viewportWidth >= DESKTOP_SIDE_MENU_BREAKPOINT_PX;
}

export function computeSideMenuLayout(input: SideMenuLayoutInput): SideMenuLayout {
  const width = Number.isFinite(input.viewportWidth) && input.viewportWidth > 0
    ? input.viewportWidth
    : DESKTOP_SIDE_MENU_BREAKPOINT_PX;
  const hasModel = Boolean(input.hasModel);
  const errorBadgeCount = Math.max(0, Math.floor(Number(input.errorBadgeCount) || 0));

  const isDesktop = isDesktopSideMenuViewport(width);
  const isTabletOrLarger = width >= TABLET_BRAND_BREAKPOINT_PX;
  const isExpanded = isDesktop ? input.state.desktopExpanded : input.state.overlayOpen;
  const isDocked = isDesktop && isExpanded;
  const isOverlay = !isDesktop && isExpanded;
  const mode: SideMenuMode = isDocked ? 'docked' : isOverlay ? 'overlay' : 'collapsed';

  // The menu button + site title always stay combined when expanded and on md+
  // viewports. On narrow mobile (<768px) when collapsed, compact to the circular
  // menu button so it never collides with top-right editor pills or duplicates
  // the welcome sheet headline right below it.
  const showBrandTitleInHeader = isExpanded || isTabletOrLarger;

  // When collapsed on md+ with a loaded model, surface the active model title
  // inline next to the site title. When expanded, #menuModelCard directly below
  // the header already presents the model name, file type, and stats.
  const showModelNameInHeader = !isExpanded && hasModel && isTabletOrLarger;

  const showMobileEditorBrandPill = !isExpanded && hasModel && !isTabletOrLarger;
  const showMenuButtonErrorBadge = !isExpanded && errorBadgeCount > 0;
  const isCompactPill = !isExpanded && !showBrandTitleInHeader;

  return {
    isDesktop,
    isExpanded,
    isDocked,
    isOverlay,
    mode,
    showBackdrop: isOverlay,
    workspaceLeftInsetPx: isDocked ? SIDE_MENU_DESKTOP_WORKSPACE_INSET_PX : 0,
    showBrandTitleInHeader,
    showModelNameInHeader,
    showMobileEditorBrandPill,
    showMenuButtonErrorBadge,
    isCompactPill,
  };
}

export function toggleSideMenuState(current: SideMenuState, viewportWidth: number): SideMenuState {
  if (isDesktopSideMenuViewport(viewportWidth)) {
    return {
      desktopExpanded: !current.desktopExpanded,
      overlayOpen: false,
    };
  }
  return {
    desktopExpanded: current.desktopExpanded,
    overlayOpen: !current.overlayOpen,
  };
}

export function openSideMenuState(current: SideMenuState, viewportWidth: number): SideMenuState {
  if (isDesktopSideMenuViewport(viewportWidth)) {
    return {
      desktopExpanded: true,
      overlayOpen: false,
    };
  }
  return {
    desktopExpanded: current.desktopExpanded,
    overlayOpen: true,
  };
}

/**
 * Dismisses the side menu only when it is acting as a temporary overlay drawer
 * (`viewportWidth < 1024px`). On desktop, the docked side menu stays expanded
 * while modals or actions run unless the user explicitly collapses it.
 */
export function closeSideMenuOverlayState(current: SideMenuState, viewportWidth: number): SideMenuState {
  if (isDesktopSideMenuViewport(viewportWidth)) {
    if (!current.overlayOpen) return current;
    return {
      desktopExpanded: current.desktopExpanded,
      overlayOpen: false,
    };
  }
  if (!current.overlayOpen) return current;
  return {
    desktopExpanded: current.desktopExpanded,
    overlayOpen: false,
  };
}

export function computeWorkspaceViewportSize(
  windowWidth: number,
  windowHeight: number,
  layout: Pick<SideMenuLayout, 'workspaceLeftInsetPx'>,
): { width: number; height: number } {
  const safeW = Number.isFinite(windowWidth) && windowWidth > 0 ? windowWidth : 1024;
  const safeH = Number.isFinite(windowHeight) && windowHeight > 0 ? windowHeight : 768;
  const inset = Math.max(0, Number(layout.workspaceLeftInsetPx) || 0);
  return {
    width: Math.max(280, safeW - inset),
    height: Math.max(300, safeH),
  };
}
