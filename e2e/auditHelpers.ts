import { expect, type Page } from '@playwright/test';

export interface RuntimeIssueCollector {
  pageErrors: string[];
  consoleErrors: string[];
  localHttpErrors: string[];
  assertClean: (contextLabel: string) => void;
}

/**
 * Attaches listeners to capture uncaught page exceptions, JS console.error logs,
 * and same-origin HTTP >= 400 asset failures. External third-party hosts (e.g.
 * LDraw CDN mirrors) are aborted immediately so offline E2E runs stay fast and
 * deterministic without waiting on external network timeouts.
 */
export async function attachRuntimeIssueCollector(page: Page): Promise<RuntimeIssueCollector> {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const localHttpErrors: string[] = [];

  await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/, (route) => route.abort('failed'));

  page.on('pageerror', (err) => {
    pageErrors.push(err.stack || err.message || String(err));
  });

  page.on('response', (res) => {
    const url = res.url();
    if (/^https?:\/\/(127\.0\.0\.1|localhost)/.test(url) && res.status() >= 400 && !url.endsWith('/favicon.ico')) {
      localHttpErrors.push(`${res.status()} ${url}`);
    }
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Network resource errors from aborted external mirrors are expected in offline E2E;
      // local asset 4xx/5xx are captured strictly via localHttpErrors above.
      if (text.startsWith('Failed to load resource:')) return;
      consoleErrors.push(text);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    localHttpErrors,
    assertClean(contextLabel: string) {
      expect(
        pageErrors,
        `[${contextLabel}] Uncaught pageerror(s):\n${pageErrors.join('\n')}`
      ).toEqual([]);
      expect(
        localHttpErrors,
        `[${contextLabel}] Local HTTP error(s):\n${localHttpErrors.join('\n')}`
      ).toEqual([]);
      expect(
        consoleErrors,
        `[${contextLabel}] console.error(s):\n${consoleErrors.join('\n')}`
      ).toEqual([]);
    },
  };
}

export interface SurfaceAuditOptions {
  /** Selector of the active modal / popover / drawer container to audit in detail */
  activeContainerSelector?: string;
  /** Whether to verify workspace floating chrome (topRightPills, bottomDock, contextOverlay) */
  checkWorkspaceChrome?: boolean;
  /** Whether a model is currently loaded */
  hasModel?: boolean;
}

/**
 * Audits the current UI surface for desktop & mobile layout issues:
 * - Zero horizontal viewport overflow
 * - Active modal/popover fits inside the viewport without clipping
 * - Visible interactive buttons inside the active surface stay within viewport bounds
 * - Floating chrome (menu header, top-right pills, mobile brand pill, bottom dock,
 *   context overlay) does not overlap or clip outside the viewport
 * - Desktop side menu docks cleanly without overlapping workspaceArea; mobile menu
 *   overlays with backdrop when expanded
 */
export async function auditSurface(
  page: Page,
  label: string,
  options: SurfaceAuditOptions = {}
): Promise<void> {
  const { activeContainerSelector, checkWorkspaceChrome = false, hasModel = false } = options;

  // Wait for finite CSS entrance transitions/animations (e.g. 180ms pressSheetIn) to settle
  await page.evaluate(async (sel) => {
    const root = sel ? document.querySelector(sel) : document.body;
    if (!root) return;
    const anims = root.getAnimations({ subtree: true }).filter((a) => {
      const timing = a.effect?.getComputedTiming();
      return timing && Number.isFinite(timing.iterations) && timing.iterations < 10;
    });
    if (anims.length > 0) {
      await Promise.race([
        Promise.allSettled(anims.map((a) => a.finished)),
        new Promise((r) => setTimeout(r, 350)),
      ]);
    }
  }, activeContainerSelector ?? null);

  const report = await page.evaluate(
    ({ activeContainerSelector, checkWorkspaceChrome, hasModel }) => {
      const issues: string[] = [];
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isDesktop = vw >= 1024;
      const eps = 2;

      const isVisible = (el: Element | null): el is HTMLElement => {
        if (!el || !(el instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0.5 && rect.height > 0.5;
      };

      const overlaps = (a: DOMRect, b: DOMRect, pad = 1): boolean =>
        a.left < b.right - pad &&
        a.right > b.left + pad &&
        a.top < b.bottom - pad &&
        a.bottom > b.top + pad;

      // 1. Global horizontal overflow check
      if (document.documentElement.scrollWidth > vw + eps) {
        issues.push(
          `Document horizontal overflow: scrollWidth=${document.documentElement.scrollWidth} > innerWidth=${vw}`
        );
      }
      if (document.body.scrollWidth > vw + eps) {
        issues.push(
          `Body horizontal overflow: scrollWidth=${document.body.scrollWidth} > innerWidth=${vw}`
        );
      }

      // 2. Side menu docking / layout check
      const menuDrawer = document.getElementById('menuDrawer');
      const workspaceArea = document.getElementById('workspaceArea');
      if (menuDrawer && workspaceArea) {
        const expanded = menuDrawer.getAttribute('data-expanded') === 'true';
        const mode = menuDrawer.getAttribute('data-mode');
        if (isDesktop && expanded && mode === 'docked') {
          const mRect = menuDrawer.getBoundingClientRect();
          const wRect = workspaceArea.getBoundingClientRect();
          if (wRect.left < mRect.right - eps) {
            issues.push(
              `Desktop docked menu overlaps workspaceArea: menu.right=${Math.round(mRect.right)} > workspace.left=${Math.round(wRect.left)}`
            );
          }
        }
        if (!isDesktop && expanded) {
          const mRect = menuDrawer.getBoundingClientRect();
          if (mRect.right > vw + eps) {
            issues.push(`Mobile menu drawer overflows viewport width: right=${Math.round(mRect.right)} > vw=${vw}`);
          }
        }
      }

      // 3. Active modal / popover / drawer geometry & button bounds
      if (activeContainerSelector) {
        const container = document.querySelector(activeContainerSelector);
        if (!isVisible(container)) {
          issues.push(`Expected active surface "${activeContainerSelector}" to be visible`);
        } else {
          // If the selector is a full-screen modal backdrop, audit its inner sheet child
          const sheet =
            (container.querySelector('.studio-sheet, .style-popover-body') as HTMLElement | null) ||
            (container.firstElementChild instanceof HTMLElement &&
            container.classList.contains('fixed') &&
            container.classList.contains('inset-0')
              ? container.firstElementChild
              : container);

          const sRect = sheet.getBoundingClientRect();
          if (sRect.width < 160 || sRect.height < 60) {
            issues.push(
              `Active surface "${activeContainerSelector}" has suspiciously small size: ${Math.round(sRect.width)}x${Math.round(sRect.height)}`
            );
          }
          if (sRect.left < -eps || sRect.right > vw + eps) {
            issues.push(
              `Active surface "${activeContainerSelector}" overflows horizontally: [${Math.round(sRect.left)}, ${Math.round(sRect.right)}] vs vw=${vw}`
            );
          }
          if (sRect.top < -eps || sRect.bottom > vh + eps) {
            issues.push(
              `Active surface "${activeContainerSelector}" overflows vertically: [${Math.round(sRect.top)}, ${Math.round(sRect.bottom)}] vs vh=${vh}`
            );
          }

          // Check visible buttons/links inside the sheet that are NOT inside an overflow-x-auto strip
          const interactive = Array.from(sheet.querySelectorAll('button, a[href]'));
          for (const el of interactive) {
            if (!isVisible(el)) continue;
            // Skip items inside horizontally scrollable strips or scrolled-out vertical lists
            const insideHorizScroll = el.closest('.overflow-x-auto, .theme-strip');
            const scrollParent = el.closest('.overflow-y-auto');
            const r = el.getBoundingClientRect();
            if (scrollParent && scrollParent !== sheet) {
              const spRect = scrollParent.getBoundingClientRect();
              if (r.bottom < spRect.top || r.top > spRect.bottom) continue;
            }
            if (!insideHorizScroll) {
              if (r.left < -eps || r.right > vw + eps) {
                const name =
                  el.id || el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || el.tagName;
                issues.push(
                  `Button/link "${name}" in "${activeContainerSelector}" clipped horizontally: [${Math.round(r.left)}, ${Math.round(r.right)}] vs vw=${vw}`
                );
              }
            }
          }
        }
      }

      // 4. Workspace floating chrome overlap & bounds checks
      if (checkWorkspaceChrome) {
        const menuHeader = document.getElementById('menuHeaderBar');
        const topRight = document.getElementById('topRightPills');
        const bottomDock = document.getElementById('bottomDock');
        const contextOverlay = document.getElementById('contextOverlay');
        const mobileBrand = document.getElementById('mobileEditorBrandPill');

        if (isVisible(menuHeader) && isVisible(topRight)) {
          const mRect = menuHeader.getBoundingClientRect();
          const tRect = topRight.getBoundingClientRect();
          if (overlaps(mRect, tRect)) {
            issues.push(
              `menuHeaderBar (${Math.round(mRect.left)}..${Math.round(mRect.right)}) overlaps topRightPills (${Math.round(tRect.left)}..${Math.round(tRect.right)})`
            );
          }
        }

        if (isVisible(topRight)) {
          const tRect = topRight.getBoundingClientRect();
          if (tRect.left < -eps || tRect.right > vw + eps) {
            issues.push(`topRightPills clipped horizontally: [${Math.round(tRect.left)}, ${Math.round(tRect.right)}]`);
          }
        }

        if (!isDesktop && hasModel && isVisible(mobileBrand)) {
          const bRect = mobileBrand.getBoundingClientRect();
          if (bRect.left < -eps || bRect.right > vw + eps) {
            issues.push(`mobileEditorBrandPill clipped horizontally: [${Math.round(bRect.left)}, ${Math.round(bRect.right)}]`);
          }
          if (isVisible(menuHeader) && overlaps(bRect, menuHeader.getBoundingClientRect())) {
            issues.push('mobileEditorBrandPill overlaps menuHeaderBar');
          }
          if (isVisible(topRight) && overlaps(bRect, topRight.getBoundingClientRect())) {
            issues.push('mobileEditorBrandPill overlaps topRightPills');
          }
        }

        if (hasModel && isVisible(bottomDock)) {
          const dRect = bottomDock.getBoundingClientRect();
          if (dRect.left < -eps || dRect.right > vw + eps) {
            issues.push(
              `bottomDock clipped horizontally: [${Math.round(dRect.left)}, ${Math.round(dRect.right)}] vs vw=${vw}`
            );
          }
          if (dRect.bottom > vh + eps) {
            issues.push(`bottomDock clipped at bottom: bottom=${Math.round(dRect.bottom)} > vh=${vh}`);
          }
          if (isVisible(topRight) && overlaps(dRect, topRight.getBoundingClientRect())) {
            issues.push('bottomDock overlaps topRightPills');
          }
          if (isVisible(contextOverlay)) {
            const cRect = contextOverlay.getBoundingClientRect();
            if (cRect.left < -eps || cRect.right > vw + eps) {
              issues.push(
                `contextOverlay clipped horizontally: [${Math.round(cRect.left)}, ${Math.round(cRect.right)}] vs vw=${vw}`
              );
            }
            if (overlaps(cRect, dRect, 2)) {
              issues.push(
                `contextOverlay (bottom=${Math.round(cRect.bottom)}) overlaps bottomDock (top=${Math.round(dRect.top)})`
              );
            }
          }
        }
      }

      return { issues, vw, vh };
    },
    { activeContainerSelector, checkWorkspaceChrome, hasModel }
  );

  expect(
    report.issues,
    `[${label}] Layout audit failed (${report.vw}x${report.vh}):\n- ${report.issues.join('\n- ')}`
  ).toEqual([]);
}

/**
 * Ensures the side menu is open so menu buttons can be clicked on both desktop and mobile.
 */
export async function ensureMenuOpen(page: Page): Promise<void> {
  const expanded = await page.locator('#menuDrawer').getAttribute('data-expanded');
  if (expanded !== 'true') {
    await page.locator('#btnOpenMenu').click();
    await expect(page.locator('#menuDrawer')).toHaveAttribute('data-expanded', 'true');
  }
}

/**
 * Ensures the side menu is closed on mobile so it does not cover the stage.
 */
export async function closeMenuOnMobile(page: Page): Promise<void> {
  const vw = page.viewportSize()?.width ?? 1280;
  if (vw >= 1024) return;
  const expanded = await page.locator('#menuDrawer').getAttribute('data-expanded');
  if (expanded === 'true') {
    await page.locator('#btnOpenMenu').click();
    await expect(page.locator('#menuDrawer')).toHaveAttribute('data-expanded', 'false');
  }
}

/**
 * Uploads an in-memory .ldr file through the hidden #fileInput.
 */
export async function uploadLdrFile(page: Page, filename: string, content: string): Promise<void> {
  await page.locator('#fileInput').setInputFiles({
    name: filename,
    mimeType: 'text/plain',
    buffer: Buffer.from(content, 'utf-8'),
  });
}
