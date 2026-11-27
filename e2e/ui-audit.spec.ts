import { expect, test, type Page } from '@playwright/test';
import {
  attachRuntimeIssueCollector,
  auditSurface,
  closeMenuOnMobile,
  ensureMenuOpen,
  uploadLdrFile,
} from './auditHelpers';
import {
  CLEAN_MINIFIG_MODEL_LDR,
  CLEAN_MULTI_STEP_LDR,
  MISSING_PART_LDR,
  MULTI_CHAPTER_MPD,
} from './fixtures/sampleModels';

async function loadCleanManual(page: Page): Promise<void> {
  await uploadLdrFile(page, 'test-tower.ldr', CLEAN_MULTI_STEP_LDR);
  const wizard = page.locator('#importWizardModal');
  await expect(wizard).toBeVisible();
  await page.locator('#impWizBtnGenerate').click();
  await expect(wizard).toBeHidden();
  await expect(page.locator('#stageViewport')).toBeVisible();
  await expect(page.locator('#bottomDock')).toBeVisible();
  await expect(page.locator('#pageFrame')).toBeVisible();
}

test.describe('Full UI & Feature Audit (Desktop + Mobile)', () => {
  test('Empty State, Side Menu, Open Model, Keyboard Shortcuts, and Bricks Library', async ({ page }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);
    const isDesktop = testInfo.project.name === 'desktop';

    await page.goto('/');
    await expect(page.locator('#emptyState')).toBeVisible();
    await expect(page.locator('#emptyImportBtn')).toBeVisible();
    await expect(page.locator('#emptyLoadProjBtn')).toBeVisible();

    // Side menu default state: docked & expanded on desktop, collapsed on mobile
    if (isDesktop) {
      await expect(page.locator('#menuDrawer')).toHaveAttribute('data-expanded', 'true');
      await expect(page.locator('#menuDrawer')).toHaveAttribute('data-mode', 'docked');
    } else {
      await expect(page.locator('#menuDrawer')).toHaveAttribute('data-expanded', 'false');
    }
    await auditSurface(page, `${testInfo.project.name}: Empty State`, {
      activeContainerSelector: '#emptyState',
      checkWorkspaceChrome: true,
      hasModel: false,
    });

    // Toggle side menu
    if (isDesktop) {
      await page.locator('#btnOpenMenu').click();
      await expect(page.locator('#menuDrawer')).toHaveAttribute('data-expanded', 'false');
      await auditSurface(page, `${testInfo.project.name}: Empty State (Menu Collapsed)`, {
        activeContainerSelector: '#emptyState',
        checkWorkspaceChrome: true,
        hasModel: false,
      });
      await page.locator('#btnOpenMenu').click();
      await expect(page.locator('#menuDrawer')).toHaveAttribute('data-expanded', 'true');
    } else {
      await ensureMenuOpen(page);
      await expect(page.locator('#menuBackdrop')).toBeVisible();
      await auditSurface(page, `${testInfo.project.name}: Mobile Menu Drawer`, {
        activeContainerSelector: '#menuDrawer',
      });
    }

    // Side menu items omit inline summaries and item descriptions
    await expect(page.locator('#menuScrollBody p')).toHaveCount(0);
    await expect(page.locator('#menuBricksLibBtn')).toHaveText(/^\s*Bricks Library\s*$/);
    await expect(page.locator('#menuShortcutsBtn')).toHaveText(/^\s*Customize Shortcuts\s*$/);
    await expect(page.locator('#menuSettingsBtn')).toHaveText(/^\s*App Settings\s*$/);

    // 1. Open Model Modal
    await ensureMenuOpen(page);
    await page.locator('#menuImportBtn').click();
    await expect(page.locator('#openModelModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Open Model Modal`, {
      activeContainerSelector: '#openModelModal',
    });
    await page.locator('#btnCloseOpenModel').click();
    await expect(page.locator('#openModelModal')).toBeHidden();

    // 2. Keyboard Shortcuts Modal
    await ensureMenuOpen(page);
    await page.locator('#menuShortcutsBtn').click();
    await expect(page.locator('#shortcutsModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Keyboard Shortcuts Modal`, {
      activeContainerSelector: '#shortcutsModal',
    });
    await page.locator('#shortcutsSearchInput').fill('zoom');
    await expect(page.locator('#shortcutsGroupsList')).toContainText(/Zoom/i);
    await page.locator('#shortcutsSearchClearBtn').click();
    await expect(page.locator('#shortcutsSearchInput')).toHaveValue('');
    await page.locator('#btnCloseShortcuts').click();
    await expect(page.locator('#shortcutsModal')).toBeHidden();

    // 3. Bricks Library Modal (Browse & Search + Color Popovers + Fetch & Import Tab)
    await ensureMenuOpen(page);
    await page.locator('#menuBricksLibBtn').click();
    await expect(page.locator('#bricksLibraryModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Bricks Library (Browse)`, {
      activeContainerSelector: '#bricksLibraryModal',
    });

    await page.locator('#libSearchInput').fill('3001');
    await expect(page.locator('#libBrowseGrid')).toContainText('3001');

    // Open 3D Preview Color Popover
    await page.locator('#libColorPickerBtn').click();
    await expect(page.locator('#libColorPopover')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Bricks Library Color Popover`, {
      activeContainerSelector: '#libColorPopover',
    });
    await page.locator('#libColorPopoverClose').click();
    await expect(page.locator('#libColorPopover')).toBeHidden();

    // Open Available Color Filter Popover
    await page.locator('#libColorFilterBtn').click();
    await expect(page.locator('#libColorFilterPopover')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Bricks Library Color Filter Popover`, {
      activeContainerSelector: '#libColorFilterPopover',
    });
    await page.locator('#libColorFilterPopoverClose').click();
    await expect(page.locator('#libColorFilterPopover')).toBeHidden();

    // Switch to Fetch & Import tab
    await page.locator('[data-lib-tab="manage"]').click();
    await expect(page.locator('#libTabManage')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Bricks Library (Fetch & Import)`, {
      activeContainerSelector: '#bricksLibraryModal',
    });

    await page.locator('#btnCloseBricksLib').click();
    await expect(page.locator('#bricksLibraryModal')).toBeHidden();

    // 4. App Settings Modal (+ Custom Defaults including Page Number Position)
    await ensureMenuOpen(page);
    await page.locator('#menuSettingsBtn').click();
    await expect(page.locator('#settingsModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: App Settings Modal`, {
      activeContainerSelector: '#settingsModal',
    });
    await page.locator('[data-settings-defaults-mode="custom"]').click();
    await expect(page.locator('#settingsCustomDefaultsWrap')).toBeVisible();
    await page.locator('[data-settings-pgnum-pos="outside"]').click();
    await expect(page.locator('[data-settings-pgnum-pos="outside"]')).toHaveAttribute('aria-pressed', 'true');
    await auditSurface(page, `${testInfo.project.name}: App Settings Modal (Custom Defaults)`, {
      activeContainerSelector: '#settingsModal',
    });
    await page.locator('[data-settings-defaults-mode="builtin"]').click();
    await page.locator('#btnCloseSettings').click();
    await expect(page.locator('#settingsModal')).toBeHidden();

    runtime.assertClean(`${testInfo.project.name}: Pre-model UI`);
  });

  test('Missing Parts Modal and Import Wizard Navigation Flow', async ({ page }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);
    await page.goto('/');

    // Upload a model with an unknown part to trigger Missing Parts Modal
    await uploadLdrFile(page, 'missing-part-check.ldr', MISSING_PART_LDR);
    await expect(page.locator('#missingPartsModal')).toBeVisible();
    await expect(page.locator('#mpList')).toContainText('999999nonexistent');
    await auditSurface(page, `${testInfo.project.name}: Missing Parts Modal`, {
      activeContainerSelector: '#missingPartsModal',
    });

    // Skip & Continue -> opens Import Wizard
    await page.locator('#mpBtnSkip').click();
    await expect(page.locator('#missingPartsModal')).toBeHidden();
    await expect(page.locator('#importWizardModal')).toBeVisible();
    await expect(page.locator('#impWizItemsList')).not.toContainText('LEGO-Style');
    await expect(page.locator('#impWizItemsList button[data-wiz-section="slicing"] > span').nth(1).locator('> span')).toHaveCount(2);
    await expect(page.locator('#impWizItemsList button[data-wiz-section="theme"] > span').nth(1).locator('> span')).toHaveCount(2);
    await auditSurface(page, `${testInfo.project.name}: Import Wizard Modal`, {
      activeContainerSelector: '#importWizardModal',
    });

    // Click into Step Generation — Slicing from Import Wizard and verify back-navigation
    const wizardSlicingBtn = page.locator('#impWizItemsList button[data-wiz-section="slicing"]');
    if (await wizardSlicingBtn.isVisible()) {
      await wizardSlicingBtn.click();
      await expect(page.locator('#importModal')).toBeVisible();
      await expect(page.locator('#btnBackStepGenWizard')).toBeVisible();
      await auditSurface(page, `${testInfo.project.name}: Import Wizard -> Step Generation`, {
        activeContainerSelector: '#importModal',
      });
      await page.locator('#btnBackStepGenWizard').click();
      await expect(page.locator('#importWizardModal')).toBeVisible();
    }

    // Click into Page Setup from Import Wizard and verify back-navigation
    const wizardPageSetupBtn = page.locator('#impWizItemsList button').filter({ hasText: /Page Format|Wordless/i }).first();
    if (await wizardPageSetupBtn.isVisible()) {
      await wizardPageSetupBtn.click();
      await expect(page.locator('#pageSetupModal')).toBeVisible();
      await expect(page.locator('#btnBackPageSetupWizard')).toBeVisible();
      await auditSurface(page, `${testInfo.project.name}: Import Wizard -> Page Setup`, {
        activeContainerSelector: '#pageSetupModal',
      });
      await page.locator('#btnBackPageSetupWizard').click();
      await expect(page.locator('#importWizardModal')).toBeVisible();
    }

    // Generate manual from wizard
    await page.locator('#impWizBtnGenerate').click();
    await expect(page.locator('#importWizardModal')).toBeHidden();
    await expect(page.locator('#stageViewport')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Post-Wizard Workspace`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    runtime.assertClean(`${testInfo.project.name}: Import Flow`);
  });

  test('Workspace Pages, Bottom Dock Modes, Zoom, Apply Camera, and Overview Modal', async ({ page }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);
    const isDesktop = testInfo.project.name === 'desktop';

    await page.goto('/');
    await loadCleanManual(page);
    await closeMenuOnMobile(page);

    // Front Cover Page (Page 1)
    await expect(page.locator('#pageLabelText')).not.toBeEmpty();
    if (!isDesktop) {
      await expect(page.locator('#desktopModelChip')).toBeVisible();
      await expect(page.locator('#headerBrandLogo')).toBeVisible();
      await expect(page.locator('#headerBrandTitle')).toBeVisible();
      await expect(page.locator('#headerBrandTitle')).toHaveText('Brick Instruction Works');
      await expect(page.locator('#desktopModelSep')).toBeHidden();
      await expect(page.locator('#desktopModelName')).toBeHidden();
    }
    await auditSurface(page, `${testInfo.project.name}: Cover Page (Pan)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    // Cover Modes: Camera -> Page -> Pan
    const cameraModeBtn = page.locator('#modePill [data-mode="camera"]');
    if (await cameraModeBtn.isVisible()) {
      await cameraModeBtn.click();
      await expect(page.locator('#contextOverlay')).toBeVisible();
      await expect(page.locator('#contextOverlay .hero-rotate-btn')).toHaveText(['−90°', '+90°']);
      await auditSurface(page, `${testInfo.project.name}: Cover Page (Camera Mode)`, {
        checkWorkspaceChrome: true,
        hasModel: true,
      });
    }
    await page.locator('#modePill [data-mode="page"]').click();
    await expect(page.locator('#contextOverlay')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Cover Page (Page Mode)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });
    await page.locator('#modePill [data-mode="pan"]').click();

    // Navigate to Step Page (Page 2)
    await page.locator('#nextPage').click();
    await expect(page.locator('#modePill [data-mode="step"]')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Step Page (Pan)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    // Step Page Modes: Parts -> Step (+ Apply Camera Modal) -> Page -> Pan
    await page.locator('#modePill [data-mode="parts"]').click();
    await expect(page.locator('#contextOverlay')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Step Page (Parts Mode)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    await page.locator('#modePill [data-mode="step"]').click();
    await expect(page.locator('#contextOverlay')).toBeVisible();
    await expect(page.locator('#contextOverlay .step-rotate-btn')).toHaveText(['−90°', '+90°']);
    await auditSurface(page, `${testInfo.project.name}: Step Page (Step Mode)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    // Open Apply Camera to Steps modal from Step context overlay if present
    const applyCameraBtn = page.locator('#contextOverlay button').filter({ hasText: /Apply to Steps|Apply Camera|Steps…/i }).first();
    if (await applyCameraBtn.isVisible()) {
      await applyCameraBtn.click();
      await expect(page.locator('#applyAngleModal')).toBeVisible();
      await auditSurface(page, `${testInfo.project.name}: Apply Camera to Steps Modal`, {
        activeContainerSelector: '#applyAngleModal',
      });
      await page.locator('#btnCancelApplyAngle').click();
      await expect(page.locator('#applyAngleModal')).toBeHidden();
    }

    await page.locator('#modePill [data-mode="page"]').click();
    await expect(page.locator('#contextOverlay')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Step Page (Page Mode)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });
    await page.locator('#modePill [data-mode="pan"]').click();

    // Zoom controls: visible on desktop, hidden on mobile
    if (isDesktop) {
      await expect(page.locator('#zoomControlsBar')).toBeVisible();
      await page.locator('#btnZoomIn').click();
      await page.locator('#btnZoomOut').click();
      await page.locator('#btnZoomFit').click();
    } else {
      await expect(page.locator('#zoomControlsBar')).toBeHidden();
    }

    // Navigate to Last Page (Back Cover), then step back to Build Complete page and verify clean hero-only render
    await page.locator('#lastPage').click();
    await auditSurface(page, `${testInfo.project.name}: Last Page`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    // Jump to Build Complete page via Overview Modal and verify clean hero-only render
    await page.locator('#btnPageOverview').click();
    await expect(page.locator('#overviewModal')).toBeVisible();
    const completeRow = page.locator('#overviewList > div').filter({ hasText: /Build Complete/i }).first();
    await expect(completeRow).toBeVisible();
    await completeRow.click();
    await expect(page.locator('#overviewModal')).toBeHidden();
    await expect(page.locator('#pageFrame [data-cover-hero-img="true"]')).toHaveCount(1);
    await expect(page.locator('#pageFrame img, #pageFrame canvas')).toHaveCount(1);
    await auditSurface(page, `${testInfo.project.name}: Build Complete Page`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });
    await page.locator('#firstPage').click();

    // Pages & Steps Overview Modal
    await page.locator('#btnPageOverview').click();
    await expect(page.locator('#overviewModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Pages & Steps Overview Modal`, {
      activeContainerSelector: '#overviewModal',
    });

    // Toggle Select Range mode inside Overview Modal
    await page.locator('#btnOverviewRangeMode').click();
    await expect(page.locator('#overviewRangeBar')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Overview Modal (Range Select)`, {
      activeContainerSelector: '#overviewModal',
    });
    await page.locator('#btnOverviewRangeMode').click();
    await page.locator('#btnCloseOverview').click();
    await expect(page.locator('#overviewModal')).toBeHidden();

    runtime.assertClean(`${testInfo.project.name}: Workspace & Navigation`);
  });

  test('Style & Themes Popover, Arrow Style, Step Dividers, and Undo/Redo', async ({
    page,
  }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);

    await page.goto('/');
    await loadCleanManual(page);
    await closeMenuOnMobile(page);

    // 1. Style & Themes Popover + Font Picker + Undo/Redo
    await page.locator('#btnStylePop').click();
    await expect(page.locator('#stylePopover')).toBeVisible();
    await expect(page.locator('#stylePopoverHeader')).toBeVisible();
    await expect(page.locator('#stylePopoverHeader')).toContainText('Styles');
    await expect(page.locator('#btnToggleAllStyleSections')).toContainText('Collapse All');
    await auditSurface(page, `${testInfo.project.name}: Style & Themes Popover`, {
      activeContainerSelector: '#stylePopover',
    });

    // Verify Collapse All / Expand All and individual collapsible section toggle
    await page.locator('#btnToggleAllStyleSections').click();
    await expect(page.locator('#btnToggleAllStyleSections')).toContainText('Expand All');
    await expect(page.locator('#stylePageBgSection')).not.toHaveAttribute('open', '');
    await expect(page.locator('#styleTypographySection')).not.toHaveAttribute('open', '');
    await page.locator('#btnToggleAllStyleSections').click();
    await expect(page.locator('#btnToggleAllStyleSections')).toContainText('Collapse All');
    await expect(page.locator('#stylePageBgSection')).toHaveAttribute('open', '');
    await expect(page.locator('#styleTypographySection')).toHaveAttribute('open', '');

    // Open Typography Font Picker inside Style Popover
    await page.locator('#btnThemeHeadingFont').click();
    await expect(page.locator('#themeFontPickerPanel')).toBeVisible();
    await page.locator('#themeFontSearchInput').fill('Outfit');
    await expect(page.locator('#themeFontList')).toContainText('Outfit');
    await page.locator('#btnCloseFontPicker').click();
    await expect(page.locator('#themeFontPickerPanel')).toBeHidden();

    // Verify default rendering style: lighting off, outline all parts on, fade earlier pieces off
    await expect(page.locator('#stepLightingHint')).toHaveText('Flat uniform colors');
    await expect(page.locator('#toggleStarkBlackOutlines')).toBeChecked();
    await expect(page.locator('#fadePreviewStatus')).toHaveText('No fade');

    // Verify Placement Arrow Style controls (default: Flat 2D, no outlines, no lighting) & customization
    await expect(page.locator('#arrowStyleWrap')).toBeVisible();
    await expect(page.locator('#toggleArrowOutlines')).not.toBeChecked();
    await expect(page.locator('#toggleArrowLighting')).not.toBeChecked();
    await page.locator('.arrow-style-chip[data-arrow-style="3d"]').click();
    await page.locator('#toggleArrowOutlines').click();
    await expect(page.locator('#toggleArrowOutlines')).toBeChecked();
    await page.locator('#toggleArrowLighting').click();
    await expect(page.locator('#toggleArrowLighting')).toBeChecked();
    await page.locator('.arrow-style-chip[data-arrow-style="flat"]').click();
    await page.locator('#toggleArrowOutlines').click();
    await page.locator('#toggleArrowLighting').click();

    // Verify Step Number Weight (Light | Medium | Bold) controls
    await expect(page.locator('.step-num-weight-btn[data-step-num-weight="300"]')).toBeVisible();
    await page.locator('.step-num-weight-btn[data-step-num-weight="300"]').click();
    await expect(page.locator('.step-num-weight-btn[data-step-num-weight="300"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.step-num-weight-btn[data-step-num-weight="800"]').click();
    await expect(page.locator('.step-num-weight-btn[data-step-num-weight="800"]')).toHaveAttribute('aria-pressed', 'true');

    // Verify Step Dividers default to LEGO-style Lines and Build Progress Bar + Span controls inside Style Popover (auto-forking built-in theme)
    await expect(page.locator('#toggleProgressBar')).toBeVisible();
    await expect(page.locator('#stylePopover .progress-bar-span-btn[data-progress-bar-span="page"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#stylePopover .progress-bar-span-btn[data-progress-bar-span="spread"]').click();
    await expect(page.locator('#stylePopover .progress-bar-span-btn[data-progress-bar-span="spread"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#stylePopover .progress-bar-span-btn[data-progress-bar-span="page"]').click();
    await expect(page.locator('#stylePopover .progress-bar-span-btn[data-progress-bar-span="page"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#stylePopover .step-border-style-btn[data-step-border-style="lines"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#stylePopover .step-border-style-btn[data-step-border-style="boxes"]').click();
    await expect(page.locator('#stylePopover .step-border-style-btn[data-step-border-style="boxes"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#btnDeleteTheme')).toBeEnabled();
    await page.locator('#stylePopover .step-border-style-btn[data-step-border-style="lines"]').click();
    await expect(page.locator('#stylePopover .step-border-style-btn[data-step-border-style="lines"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btnStylePop').click();
    await expect(page.locator('#stylePopover')).toBeHidden();

    // Verify Undo & Redo via a manual-level Cover Page edit
    await page.locator('#modePill [data-mode="page"]').click();
    const covTextToggle = page.locator('#covTextToggle');
    if (await covTextToggle.isVisible()) {
      await covTextToggle.click();
      await expect(page.locator('#btnUndo')).toBeEnabled();
      await page.locator('#btnUndo').click();
      await expect(page.locator('#btnRedo')).toBeEnabled();
      await page.locator('#btnRedo').click();
    }
    await page.locator('#modePill [data-mode="pan"]').click();

    runtime.assertClean(`${testInfo.project.name}: Style Popover & Undo/Redo`);
  });

  test('Page Setup, Step Dividers Priority, Booklet Page Numbers, and Export', async ({
    page,
  }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);

    await page.goto('/');
    await loadCleanManual(page);
    await closeMenuOnMobile(page);

    // Page Setup Modal (Paper formats + Custom size + Orientation + Step Dividers & Flow Priority + Page Number Position)
    await ensureMenuOpen(page);
    await expect(page.locator('#menuPageSetupBtn')).toHaveText(/^\s*Page Setup\s*$/);
    await expect(page.locator('#menuStyleBtn')).toHaveText(/^\s*Style\s*$/);
    await expect(page.locator('#menuBomSetupBtn')).toHaveText(/^\s*Parts List Setup\s*$/);
    await expect(page.locator('#menuStepGenBtn')).toHaveText(/^\s*Step Generation\s*$/);
    await page.locator('#menuPageSetupBtn').click();
    await expect(page.locator('#pageSetupModal')).toBeVisible();
    for (const sel of ['#toggleShowSpecSheet', '#toggleShowBrickSeparator', '#toggleShowBuildRoadmap', '#toggleShowPlayFeatures']) {
      await expect(page.locator(sel)).toBeVisible();
    }
    await page.locator('#toggleShowPlayFeatures').click();
    await expect(page.locator('#toggleShowPlayFeatures')).toBeChecked();
    await page.locator('#toggleShowPlayFeatures').click();
    await expect(page.locator('#toggleShowPlayFeatures')).not.toBeChecked();
    await expect(page.locator('#pageSetupModal .step-border-style-setup-btn[data-step-border-style="lines"]')).toHaveAttribute('aria-pressed', 'true');
    await auditSurface(page, `${testInfo.project.name}: Page Setup Modal`, {
      activeContainerSelector: '#pageSetupModal',
    });

    // Verify 2×2 preview divider priority switches cleanly between Columns (vertical-only) and Rows (horizontal + gapped verticals)
    await page.locator('#layoutColsSelect').selectOption('2');
    await page.locator('#layoutRowsSelect').selectOption('2');
    await expect(page.locator('#layoutGridPreview svg[data-preview-dividers="true"] line')).toHaveCount(1);
    await page.locator('#pageSetupModal .step-flow-btn[data-step-flow="row"]').click();
    await expect(page.locator('#layoutGridPreview svg[data-preview-dividers="true"] line')).toHaveCount(3);
    await page.locator('#pageSetupModal .step-flow-btn[data-step-flow="column"]').click();
    await expect(page.locator('#layoutGridPreview svg[data-preview-dividers="true"] line')).toHaveCount(1);
    await page.locator('#pageSetupModal .step-border-style-setup-btn[data-step-border-style="none"]').click();
    await expect(page.locator('#layoutGridPreview svg[data-preview-dividers="true"]')).toHaveCount(0);
    await page.locator('#pageSetupModal .step-border-style-setup-btn[data-step-border-style="lines"]').click();
    await page.locator('#layoutColsSelect').selectOption('auto');
    await page.locator('#layoutRowsSelect').selectOption('auto');

    await page.locator('#paperFormatSelect').selectOption('custom');
    await expect(page.locator('#customSizeWrap')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Page Setup Modal (Custom Size)`, {
      activeContainerSelector: '#pageSetupModal',
    });
    await page.locator('#paperFormatSelect').selectOption('letter');
    await page.locator('#paperFormatSelect').selectOption('screen');

    // Page Number Position: disabled when Page Number Format is Off, active for Outside Edge (Booklet)
    await page.locator('[data-pgnum="none"]').click();
    await expect(page.locator('[data-pgnum-pos="outside"]')).toBeDisabled();
    await page.locator('[data-pgnum="number"]').click();
    await expect(page.locator('[data-pgnum-pos="outside"]')).toBeEnabled();
    await page.locator('[data-pgnum-pos="outside"]').click();
    await expect(page.locator('[data-pgnum-pos="outside"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btnClosePageSetup').click();
    await expect(page.locator('#pageSetupModal')).toBeHidden();

    // Verify booklet outside-edge placement geometrically on even (Page 2 -> left) and odd (Page 3 -> right)
    await closeMenuOnMobile(page);
    await page.locator('#nextPage').click(); // Page 2 (even / verso -> left edge)
    const p2Num = page.locator('#pageFrame [data-page-number="true"]');
    await expect(p2Num).toHaveAttribute('data-page-number-side', 'left');
    const p2FrameBox = await page.locator('#pageFrame').boundingBox();
    const p2NumBox = await p2Num.boundingBox();
    expect(p2FrameBox && p2NumBox).toBeTruthy();
    if (p2FrameBox && p2NumBox) {
      expect(p2NumBox.x + p2NumBox.width / 2).toBeLessThan(p2FrameBox.x + p2FrameBox.width / 2);
    }

    await page.locator('#nextPage').click(); // Page 3 (odd / recto -> right edge)
    const p3Num = page.locator('#pageFrame [data-page-number="true"]');
    await expect(p3Num).toHaveAttribute('data-page-number-side', 'right');
    const p3FrameBox = await page.locator('#pageFrame').boundingBox();
    const p3NumBox = await p3Num.boundingBox();
    expect(p3FrameBox && p3NumBox).toBeTruthy();
    if (p3FrameBox && p3NumBox) {
      expect(p3NumBox.x + p3NumBox.width / 2).toBeGreaterThan(p3FrameBox.x + p3FrameBox.width / 2);
    }
    await page.locator('#firstPage').click();

    // 3. Export & Print Modal (verifies booklet outside-edge summary note too)
    await closeMenuOnMobile(page);
    await page.locator('#btnHeaderExport').click();
    await expect(page.locator('#exportModal')).toBeVisible();
    await expect(page.locator('#expFormatSummary')).toContainText('Booklet outside page numbers');
    await expect(page.locator('#btnExpBrickLinkXml')).toBeVisible();
    await expect(page.locator('#btnExpRebrickableCsv')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Export & Print Modal`, {
      activeContainerSelector: '#exportModal',
    });
    await page.locator('#btnCloseExport').click();
    await expect(page.locator('#exportModal')).toBeHidden();

    runtime.assertClean(`${testInfo.project.name}: Style, Page Setup & Export`);
  });

  test('Parts List Setup, Step Generation, Issues, and Confirm Close', async ({
    page,
  }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);

    await page.goto('/');
    await loadCleanManual(page);
    await closeMenuOnMobile(page);

    // 1. Parts List (BOM) Setup Modal (Grid Auto, Grid Custom, Table)
    await ensureMenuOpen(page);
    await page.locator('#menuBomSetupBtn').click();
    await expect(page.locator('#bomSetupModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Parts List Setup (Grid Auto)`, {
      activeContainerSelector: '#bomSetupModal',
    });

    await page.locator('[data-bom-grid-mode="custom"]').click();
    await expect(page.locator('#bomCustomSizeWrap')).toBeVisible();
    await expect(page.locator('#bomRelativeScale')).toBeVisible();
    await page.locator('#bomRelativeScale').click();
    await expect(page.locator('#bomShowLengthBadges')).toBeChecked();
    await expect(page.locator('#bomVariableWidthColumns')).toBeVisible();
    await page.locator('#bomVariableWidthColumns').click();
    await expect(page.locator('#bomVariableWidthColumns')).toBeChecked();
    await auditSurface(page, `${testInfo.project.name}: Parts List Setup (Grid Custom)`, {
      activeContainerSelector: '#bomSetupModal',
    });

    await page.locator('[data-bom-format="table"]').click();
    await auditSurface(page, `${testInfo.project.name}: Parts List Setup (Table)`, {
      activeContainerSelector: '#bomSetupModal',
    });
    await page.locator('[data-bom-format="grid"]').click();
    await page.locator('#btnCloseBomSetup').click();
    await expect(page.locator('#bomSetupModal')).toBeHidden();

    // 2. Step Generation Modal (3D preview + Build Organization)
    await ensureMenuOpen(page);
    await page.locator('#menuStepGenBtn').click();
    await expect(page.locator('#importModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Step Generation Modal`, {
      activeContainerSelector: '#importModal',
    });
    await page.locator('#impBtnCancel').click();
    await expect(page.locator('#importModal')).toBeHidden();

    // 3. Model Issues Modal (when visible in menu)
    await ensureMenuOpen(page);
    const errorsBtn = page.locator('#menuErrorsBtn');
    if (await errorsBtn.isVisible()) {
      await errorsBtn.click();
      await expect(page.locator('#errorsModal')).toBeVisible();
      await auditSurface(page, `${testInfo.project.name}: Model Issues Modal`, {
        activeContainerSelector: '#errorsModal',
      });
      await page.locator('#btnCloseErrors').click();
      await expect(page.locator('#errorsModal')).toBeHidden();
    }

    // 4. Destructive Action Confirmation Modal (Close Model -> Cancel, then Confirm)
    await ensureMenuOpen(page);
    await page.locator('#menuCloseModelBtn').click();
    await expect(page.locator('#confirmActionModal')).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Confirm Action Modal`, {
      activeContainerSelector: '#confirmActionModal',
    });
    await page.locator('#confirmActionCancel').click();
    await expect(page.locator('#confirmActionModal')).toBeHidden();
    await expect(page.locator('#stageViewport')).toBeVisible();

    await ensureMenuOpen(page);
    await page.locator('#menuCloseModelBtn').click();
    await expect(page.locator('#confirmActionModal')).toBeVisible();
    await page.locator('#confirmActionConfirm').click();
    await expect(page.locator('#confirmActionModal')).toBeHidden();
    await expect(page.locator('#emptyState')).toBeVisible();

    runtime.assertClean(`${testInfo.project.name}: Modals & Confirm Flow`);
  });

  test('Build Progress Bar advances monotonically across absolute steps without restarting per chapter', async ({
    page,
  }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);

    await page.goto('/');
    await uploadLdrFile(page, 'multi-chapter-progress.mpd', MULTI_CHAPTER_MPD);
    const wizard = page.locator('#importWizardModal');
    await expect(wizard).toBeVisible();
    await page.locator('#impWizBtnGenerate').click();
    await expect(wizard).toBeHidden();
    await expect(page.locator('#stageViewport')).toBeVisible();
    await closeMenuOnMobile(page);

    const progressFractions: number[] = [];
    const nextBtn = page.locator('#nextPage');
    for (let guard = 0; guard < 30; guard++) {
      const isStepPage = (await page.locator('#pageFrame [data-step-visual]').count()) > 0;
      if (isStepPage) {
        const bar = page.locator('#pageFrame .biw-progress-bar');
        await expect(bar.first()).toBeVisible();
        const raw = await bar.first().getAttribute('data-progress-fraction');
        expect(raw).not.toBeNull();
        progressFractions.push(Number(raw));
      }
      if (await nextBtn.isDisabled()) break;
      await nextBtn.click();
    }

    // Must span multiple step pages across submodel + main build chapters
    expect(progressFractions.length).toBeGreaterThanOrEqual(2);
    // First step page starts all the way to the left (0.0), final step page reaches 100% (1.0)
    expect(progressFractions[0]).toBe(0);
    expect(progressFractions[progressFractions.length - 1]).toBe(1);
    for (let i = 0; i < progressFractions.length - 1; i++) {
      expect(progressFractions[i]).toBeLessThan(1);
      expect(progressFractions[i + 1]).toBeGreaterThan(progressFractions[i]);
    }

    // Enable 2-Page Spread progress bar from Page Setup modal and verify facing-page segments
    await ensureMenuOpen(page);
    await page.locator('#menuPageSetupBtn').click();
    await expect(page.locator('#pageSetupModal')).toBeVisible();
    await expect(page.locator('#toggleProgressBarSetup')).toBeChecked();
    await page.locator('.progress-bar-span-setup-btn[data-progress-bar-span="spread"]').click();
    await expect(page.locator('.progress-bar-span-setup-btn[data-progress-bar-span="spread"]')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('#btnClosePageSetup').click();
    await expect(page.locator('#pageSetupModal')).toBeHidden();
    await closeMenuOnMobile(page);

    // Navigate back to first page and walk forward to inspect spread segments
    const prevBtn = page.locator('#prevPage');
    for (let guard = 0; guard < 30; guard++) {
      if (await prevBtn.isDisabled()) break;
      await prevBtn.click();
    }
    const spreadEntries: Array<{ frac: number; seg: string | null }> = [];
    for (let guard = 0; guard < 30; guard++) {
      const isStepPage = (await page.locator('#pageFrame [data-step-visual]').count()) > 0;
      if (isStepPage) {
        const bar = page.locator('#pageFrame .biw-progress-bar').first();
        await expect(bar).toBeVisible();
        spreadEntries.push({
          frac: Number(await bar.getAttribute('data-progress-fraction')),
          seg: await bar.getAttribute('data-progress-segment'),
        });
      }
      if (await nextBtn.isDisabled()) break;
      await nextBtn.click();
    }
    expect(spreadEntries.length).toBeGreaterThanOrEqual(2);
    expect(spreadEntries[0].frac).toBe(0);
    expect(spreadEntries.some((e) => e.seg === 'left')).toBe(true);
    expect(spreadEntries.some((e) => e.seg === 'right')).toBe(true);

    runtime.assertClean(`${testInfo.project.name}: Absolute Step Progress Bar`);
  });

  test('Minifigure Page (Exploded & Sequential + 1:1) and Cached Page Navigation', async ({ page }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);

    await page.goto('/');
    await expect(page.locator('#emptyState')).toBeVisible();
    await uploadLdrFile(page, 'minifig-tower.ldr', CLEAN_MINIFIG_MODEL_LDR);
    const mpSkip = page.locator('#mpBtnSkip');
    const wizard = page.locator('#importWizardModal');
    await Promise.race([
      wizard.waitFor({ state: 'visible' }),
      mpSkip.waitFor({ state: 'visible' }),
    ]);
    if (await mpSkip.isVisible()) {
      await mpSkip.click();
      await expect(wizard).toBeVisible();
    }
    await page.locator('#impWizBtnGenerate').click();
    await expect(wizard).toBeHidden();
    await expect(page.locator('#pageFrame')).toBeVisible();
    await closeMenuOnMobile(page);

    // Navigate to Minifigure 1 (Exploded style by default)
    await page.locator('#nextPage').click();
    await expect(page.locator('#pageLabelText')).toContainText(/Minifigure/i);
    await expect(page.locator('#pageFrame canvas').first()).toBeVisible();
    const expCanvasBox = await page.locator('#pageFrame canvas').first().boundingBox();
    expect(expCanvasBox && expCanvasBox.width > 40 && expCanvasBox.height > 40).toBeTruthy();
    await auditSurface(page, `${testInfo.project.name}: Minifigure Page (Exploded)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    // Advance to step page and revisit Minifigure 1 to verify cached canvas remounting
    await page.locator('#nextPage').click();
    await expect(page.locator('#pageFrame canvas').first()).toBeVisible();
    await page.locator('#prevPage').click();
    await expect(page.locator('#pageLabelText')).toContainText(/Minifigure/i);
    await expect(page.locator('#pageFrame canvas').first()).toBeVisible();

    // Switch to Sequential style + 1:1 reference via Style popover
    await page.locator('#btnStylePop').click();
    await expect(page.locator('#stylePopover')).toBeVisible();
    const mf1Chk = page.locator('#toggleMinifig1to1');
    if (await mf1Chk.isVisible() && !(await mf1Chk.isChecked())) {
      await mf1Chk.click();
    }
    const seqBtn = page.locator('.mf-style-btn[data-mf-style="sequential"]');
    if (await seqBtn.isVisible()) {
      await seqBtn.click();
    }
    await page.locator('#btnStylePop').click();
    await expect(page.locator('#stylePopover')).toBeHidden();

    // Verify Sequential Minifigure page mounts stage + 1:1 canvases cleanly
    await expect(page.locator('#pageLabelText')).toContainText(/Minifigure/i);
    await expect(page.locator('#pageFrame canvas').first()).toBeVisible();
    await auditSurface(page, `${testInfo.project.name}: Minifigure Page (Sequential + 1:1)`, {
      checkWorkspaceChrome: true,
      hasModel: true,
    });

    // Flip forward & back across cached sequential minifig / step pages
    await page.locator('#nextPage').click();
    await expect(page.locator('#pageFrame canvas').first()).toBeVisible();
    await page.locator('#prevPage').click();
    await expect(page.locator('#pageLabelText')).toContainText(/Minifigure/i);
    await expect(page.locator('#pageFrame canvas').first()).toBeVisible();

    runtime.assertClean(`${testInfo.project.name}: Minifigure & Cached Navigation`);
  });

  test('Accessibility semantics and async Interactive 3D HTML export', async ({ page }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);
    await page.goto('/');
    await loadCleanManual(page);

    // Viewport meta must not disable user pinch-zoom
    const viewportContent = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewportContent || '').not.toMatch(/user-scalable\s*=\s*no/i);

    // Live regions & modal ARIA roles
    await expect(page.locator('#errorBanner')).toHaveAttribute('role', 'alert');
    await expect(page.locator('#toast')).toHaveAttribute('role', 'status');
    await expect(page.locator('#toast')).toHaveAttribute('aria-live', 'polite');

    for (const modalId of [
      '#exportModal',
      '#pageSetupModal',
      '#settingsModal',
      '#shortcutsModal',
      '#bricksLibraryModal',
    ]) {
      await expect(page.locator(modalId)).toHaveAttribute('role', 'dialog');
      await expect(page.locator(modalId)).toHaveAttribute('aria-modal', 'true');
    }
    await expect(page.locator('#confirmActionModal')).toHaveAttribute('role', 'alertdialog');
    await expect(page.locator('#confirmActionModal')).toHaveAttribute('aria-modal', 'true');

    // Trigger Interactive 3D HTML export and verify it completes cleanly without hanging
    await ensureMenuOpen(page);
    const downloadPromise = page.waitForEvent('download', { timeout: 25_000 });
    await page.locator('#menuExportHtmlBtn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/\.html$/i);

    runtime.assertClean(`${testInfo.project.name}: Accessibility & Interactive HTML Export`);
  });

  test('Startup model loading screen appears when restoring last open model and clears cleanly', async ({ page }, testInfo) => {
    const runtime = await attachRuntimeIssueCollector(page);
    await page.goto('/');
    await expect(page.locator('#emptyState')).toBeVisible();
    await expect(page.locator('#startupLoadingScreen')).toBeHidden();

    // Load a model so it is persisted as the last open model
    await loadCleanManual(page);
    const savedHint = await page.evaluate(() => localStorage.getItem('biw.lastModelHint.v1'));
    expect(savedHint).toBeTruthy();
    expect(savedHint).toContain('test-tower');

    // Reload with a brief IndexedDB delay so we can reliably verify and audit the startup loading screen
    await page.addInitScript(() => {
      const origOpen = indexedDB.open.bind(indexedDB);
      indexedDB.open = ((name: string, version?: number) => {
        const realReq = version !== undefined ? origOpen(name, version) : origOpen(name);
        const proxy: Record<string, unknown> = {};
        let delayedSuccess: ((ev: Event) => void) | null = null;
        Object.defineProperty(proxy, 'onsuccess', {
          get: () => delayedSuccess,
          set: (fn: ((ev: Event) => void) | null) => {
            delayedSuccess = fn;
            realReq.onsuccess = (ev: Event) => {
              setTimeout(() => {
                if (delayedSuccess) delayedSuccess.call(realReq, ev);
              }, 350);
            };
          },
        });
        Object.defineProperty(proxy, 'onerror', {
          get: () => realReq.onerror,
          set: (fn) => { realReq.onerror = fn; },
        });
        Object.defineProperty(proxy, 'onupgradeneeded', {
          get: () => realReq.onupgradeneeded,
          set: (fn) => { realReq.onupgradeneeded = fn; },
        });
        Object.defineProperty(proxy, 'result', { get: () => realReq.result });
        Object.defineProperty(proxy, 'error', { get: () => realReq.error });
        return proxy as unknown as IDBOpenDBRequest;
      }) as typeof indexedDB.open;
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#startupLoadingScreen')).toBeVisible();
    await expect(page.locator('#emptyState')).toBeHidden();
    await expect(page.locator('#startupLoadingScreen')).toHaveAttribute('role', 'status');
    await expect(page.locator('#startupLoadingTitle')).toContainText(/Loading/i);
    await auditSurface(page, `${testInfo.project.name}: Startup Loading Screen`, {
      activeContainerSelector: '#startupLoadingScreen',
    });

    // Once restore finishes, the loading screen hides and the manual stage appears
    await expect(page.locator('#stageViewport')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('#startupLoadingScreen')).toBeHidden();
    await expect(page.locator('#emptyState')).toBeHidden();

    // Closing the model clears the startup hint so a fresh reload lands directly on Empty State
    await ensureMenuOpen(page);
    await page.locator('#menuCloseModelBtn').click();
    await expect(page.locator('#confirmActionModal')).toBeVisible();
    await page.locator('#confirmActionConfirm').click();
    await expect(page.locator('#emptyState')).toBeVisible();
    const clearedHint = await page.evaluate(() => localStorage.getItem('biw.lastModelHint.v1'));
    expect(clearedHint).toBeNull();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page.locator('#emptyState')).toBeVisible();
    await expect(page.locator('#startupLoadingScreen')).toBeHidden();

    runtime.assertClean(`${testInfo.project.name}: Startup Model Loading Screen`);
  });
});
