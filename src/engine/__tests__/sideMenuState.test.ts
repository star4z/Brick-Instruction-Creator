import { describe, expect, it } from 'vitest';
import {
  DESKTOP_SIDE_MENU_BREAKPOINT_PX,
  SIDE_MENU_DESKTOP_WORKSPACE_INSET_PX,
  TABLET_BRAND_BREAKPOINT_PX,
  closeSideMenuOverlayState,
  computeSideMenuLayout,
  computeWorkspaceViewportSize,
  createInitialSideMenuState,
  isDesktopSideMenuViewport,
  openSideMenuState,
  toggleSideMenuState,
} from '../sideMenuState';

describe('sideMenuState', () => {
  it('defaults to expanded docked side menu on desktop viewports', () => {
    const initial = createInitialSideMenuState();
    const layout = computeSideMenuLayout({
      state: initial,
      viewportWidth: 1440,
      hasModel: false,
      errorBadgeCount: 2,
    });

    expect(layout).toEqual({
      isDesktop: true,
      isExpanded: true,
      isDocked: true,
      isOverlay: false,
      mode: 'docked',
      showBackdrop: false,
      workspaceLeftInsetPx: SIDE_MENU_DESKTOP_WORKSPACE_INSET_PX,
      showBrandTitleInHeader: true,
      showModelNameInHeader: false,
      showMobileEditorBrandPill: false,
      showMenuButtonErrorBadge: false,
      isCompactPill: false,
    });
  });

  it('defaults to expanded at the exact desktop breakpoint (1024px) and collapsed below it', () => {
    const initial = createInitialSideMenuState();
    expect(isDesktopSideMenuViewport(DESKTOP_SIDE_MENU_BREAKPOINT_PX)).toBe(true);
    expect(isDesktopSideMenuViewport(DESKTOP_SIDE_MENU_BREAKPOINT_PX - 1)).toBe(false);

    const atDesktop = computeSideMenuLayout({
      state: initial,
      viewportWidth: DESKTOP_SIDE_MENU_BREAKPOINT_PX,
      hasModel: true,
    });
    expect(atDesktop.isExpanded).toBe(true);
    expect(atDesktop.isDocked).toBe(true);
    expect(atDesktop.showBackdrop).toBe(false);

    const belowDesktop = computeSideMenuLayout({
      state: initial,
      viewportWidth: DESKTOP_SIDE_MENU_BREAKPOINT_PX - 1,
      hasModel: true,
    });
    expect(belowDesktop.isExpanded).toBe(false);
    expect(belowDesktop.isDocked).toBe(false);
    expect(belowDesktop.mode).toBe('collapsed');
    expect(belowDesktop.workspaceLeftInsetPx).toBe(0);
    expect(belowDesktop.showBrandTitleInHeader).toBe(true);
    expect(belowDesktop.showModelNameInHeader).toBe(true);
  });

  it('collapses cleanly on desktop while keeping the site title and active model name combined', () => {
    const initial = createInitialSideMenuState();
    const collapsed = toggleSideMenuState(initial, 1280);

    const layout = computeSideMenuLayout({
      state: collapsed,
      viewportWidth: 1280,
      hasModel: true,
      errorBadgeCount: 3,
    });

    expect(layout.isExpanded).toBe(false);
    expect(layout.isDocked).toBe(false);
    expect(layout.mode).toBe('collapsed');
    expect(layout.workspaceLeftInsetPx).toBe(0);
    expect(layout.showBrandTitleInHeader).toBe(true);
    expect(layout.showModelNameInHeader).toBe(true);
    expect(layout.showMenuButtonErrorBadge).toBe(true);
    expect(layout.isCompactPill).toBe(false);

    // Re-opening on desktop restores docked mode and folds the model name into the card below
    const reopened = openSideMenuState(collapsed, 1280);
    const reopenedLayout = computeSideMenuLayout({
      state: reopened,
      viewportWidth: 1280,
      hasModel: true,
      errorBadgeCount: 3,
    });
    expect(reopenedLayout.isExpanded).toBe(true);
    expect(reopenedLayout.isDocked).toBe(true);
    expect(reopenedLayout.showBrandTitleInHeader).toBe(true);
    expect(reopenedLayout.showModelNameInHeader).toBe(false);
    expect(reopenedLayout.showMenuButtonErrorBadge).toBe(false);
  });

  it('keeps mobile collapsed as a compact menu pill and combines with the site title when opened', () => {
    const initial = createInitialSideMenuState();
    const collapsedMobile = computeSideMenuLayout({
      state: initial,
      viewportWidth: TABLET_BRAND_BREAKPOINT_PX - 1,
      hasModel: true,
      errorBadgeCount: 1,
    });

    expect(collapsedMobile.isExpanded).toBe(false);
    expect(collapsedMobile.isCompactPill).toBe(true);
    expect(collapsedMobile.showBrandTitleInHeader).toBe(false);
    expect(collapsedMobile.showMobileEditorBrandPill).toBe(true);
    expect(collapsedMobile.showMenuButtonErrorBadge).toBe(true);
    expect(collapsedMobile.showBackdrop).toBe(false);

    const openedState = openSideMenuState(initial, 390);
    const openedMobile = computeSideMenuLayout({
      state: openedState,
      viewportWidth: 390,
      hasModel: true,
      errorBadgeCount: 1,
    });

    expect(openedMobile.isExpanded).toBe(true);
    expect(openedMobile.isOverlay).toBe(true);
    expect(openedMobile.mode).toBe('overlay');
    expect(openedMobile.showBackdrop).toBe(true);
    expect(openedMobile.showBrandTitleInHeader).toBe(true);
    expect(openedMobile.showMobileEditorBrandPill).toBe(false);
    expect(openedMobile.showMenuButtonErrorBadge).toBe(false);
    expect(openedMobile.workspaceLeftInsetPx).toBe(0);
  });

  it('dismisses overlay drawer on mobile/tablet actions without collapsing the docked desktop side menu', () => {
    const desktopState = createInitialSideMenuState();
    const afterDesktopAction = closeSideMenuOverlayState(desktopState, 1440);
    expect(afterDesktopAction.desktopExpanded).toBe(true);

    const tabletOpen = openSideMenuState(desktopState, 820);
    expect(tabletOpen.overlayOpen).toBe(true);
    const afterTabletAction = closeSideMenuOverlayState(tabletOpen, 820);
    expect(afterTabletAction.overlayOpen).toBe(false);
    expect(afterTabletAction.desktopExpanded).toBe(true);
  });

  it('preserves explicit desktop collapsed preference across viewport resizes', () => {
    const collapsedOnDesktop = toggleSideMenuState(createInitialSideMenuState(), 1440);
    expect(collapsedOnDesktop.desktopExpanded).toBe(false);

    // Narrow to mobile and open/close overlay
    const mobileOpen = openSideMenuState(collapsedOnDesktop, 390);
    const mobileClosed = closeSideMenuOverlayState(mobileOpen, 390);
    expect(mobileClosed.desktopExpanded).toBe(false);

    // Widen back to desktop: remains collapsed as the user requested
    const backOnDesktop = computeSideMenuLayout({
      state: mobileClosed,
      viewportWidth: 1440,
      hasModel: false,
    });
    expect(backOnDesktop.isExpanded).toBe(false);
  });

  it('subtracts docked workspace inset from available workspace viewport width', () => {
    const docked = computeWorkspaceViewportSize(1440, 900, {
      workspaceLeftInsetPx: SIDE_MENU_DESKTOP_WORKSPACE_INSET_PX,
    });
    expect(docked).toEqual({
      width: 1440 - SIDE_MENU_DESKTOP_WORKSPACE_INSET_PX,
      height: 900,
    });

    const collapsed = computeWorkspaceViewportSize(1440, 900, {
      workspaceLeftInsetPx: 0,
    });
    expect(collapsed).toEqual({ width: 1440, height: 900 });
  });
});
