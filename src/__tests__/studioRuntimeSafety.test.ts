import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

describe('studioRuntime safety checks', () => {
  it('has no undeclared identifiers (prevents ReferenceErrors hidden by @ts-nocheck)', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8').replace(/^\/\/ @ts-nocheck/, '');

    const compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      lib: ['lib.esnext.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
      types: [],
      skipLibCheck: true,
      noEmit: true,
    };

    const host = ts.createCompilerHost(compilerOptions);
    const origGetSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      if (path.resolve(fileName) === runtimePath) {
        return ts.createSourceFile(fileName, sourceText, languageVersion);
      }
      return origGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    };

    const program = ts.createProgram([runtimePath], compilerOptions, host);
    const sf = program.getSourceFile(runtimePath);
    expect(sf).toBeDefined();

    // TS2304: Cannot find name 'X'.
    // TS2552: Cannot find name 'X'. Did you mean 'Y'?
    const undeclared = program
      .getSemanticDiagnostics(sf!)
      .filter((d) => d.code === 2304 || d.code === 2552)
      .map((d) => {
        const pos = d.file!.getLineAndCharacterOfPosition(d.start!);
        const msg = ts.flattenDiagnosticMessageText(d.messageText, ' ');
        return `L${pos.line + 1}:${pos.character + 1} TS${d.code}: ${msg}`;
      });

    expect(undeclared).toEqual([]);
  }, 30_000);

  it('implements procedural geometry for every shape declared in PARTS_CATALOG', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const catalogMatch = sourceText.match(/const PARTS_CATALOG = \{([\s\S]*?)\n\};/);
    expect(catalogMatch).not.toBeNull();
    const declaredShapes = new Set<string>();
    for (const m of catalogMatch![1].matchAll(/shape:\s*'([^']+)'/g)) {
      declaredShapes.add(m[1]);
    }
    expect(declaredShapes.size).toBeGreaterThanOrEqual(20);

    const emitStart = sourceText.indexOf('const emitSingleLeaf =');
    const emitEnd = sourceText.indexOf('const emitPart =', emitStart);
    expect(emitStart).toBeGreaterThan(-1);
    expect(emitEnd).toBeGreaterThan(emitStart);
    const emitBody = sourceText.slice(emitStart, emitEnd);

    const unhandled = Array.from(declaredShapes).filter(
      (shape) => !emitBody.includes(`def.shape === '${shape}'`),
    );
    expect(unhandled).toEqual([]);
  });

  it('renders Bricks Library previews with heroQuality, heroShading, and tightFit', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const fnStart = sourceText.indexOf('function renderPartPreviewDataUrl(');
    const fnEnd = sourceText.indexOf('function stopLibThumbQueue(', fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const fnBody = sourceText.slice(fnStart, fnEnd);

    expect(fnBody).toContain('heroQuality: true');
    expect(fnBody).toContain('heroShading: true');
    expect(fnBody).toContain('tightFit: true');
  });

  it('uses camera-relative primary and secondary light sources in WebGLBrickEngine', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const engStart = sourceText.indexOf('class WebGLBrickEngine {');
    const engEnd = sourceText.indexOf('const snapshotCanvas =', engStart);
    expect(engStart).toBeGreaterThan(-1);
    expect(engEnd).toBeGreaterThan(engStart);
    const engBody = sourceText.slice(engStart, engEnd);

    expect(engBody).toContain('uniform vec3 uEyePos;');
    expect(engBody).toContain('uniform vec3 uKeyDir;');
    expect(engBody).toContain('uniform vec3 uFillDir;');
    expect(engBody).toContain('uniform vec3 uRimDir;');
    expect(engBody).toContain('uniform vec3 uCamUp;');
    expect(engBody).toContain('shadeAbsPlastic(');
    expect(engBody).toContain('sampleStudioAbsEnv(');
    expect(engBody).toContain('computePreviewLightDirs(right, up, forward)');
    expect(engBody).toContain('this.loc.tEyePos');
    expect(engBody).toContain('this.loc.xEyePos');
    expect(engBody).toContain('this.loc.tFillDir');
    expect(engBody).toContain('this.loc.xFillDir');
  });

  it('renders step, library, and import previews at HiDPI resolution', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const thumbMatch = sourceText.match(/const LIB_THUMB_SIZE = (\d+);/);
    const inspectorMatch = sourceText.match(/const LIB_INSPECTOR_SIZE = (\d+);/);
    expect(thumbMatch).not.toBeNull();
    expect(inspectorMatch).not.toBeNull();
    expect(Number(thumbMatch![1])).toBeGreaterThanOrEqual(300);
    expect(Number(inspectorMatch![1])).toBeGreaterThanOrEqual(768);
    expect(sourceText).toContain('function getPreviewResolutionScale()');
    expect(sourceText).toContain('const resScale = getPreviewResolutionScale();');
    expect(sourceText).toContain('computeStepSlotRenderSize(');
    expect(sourceText).toContain('computePdfPagePixelDimensions(');
    expect(sourceText).toContain('function refreshStepModelsForZoom()');
  });

  it('renders Pages & Steps list with cached HiDPI lazy step & page previews', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const fnStart = sourceText.indexOf('function renderOverviewModal(');
    const fnEnd = sourceText.indexOf('// 10. STAGE GESTURES', fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const fnBody = sourceText.slice(fnStart, fnEnd);

    expect(fnBody).toContain('computeOverviewThumbDimensions(resScale)');
    expect(fnBody).toContain('buildStepPreviewCacheKey(');
    expect(fnBody).toContain('buildPagePreviewCacheKey(');
    expect(fnBody).toContain('observeOverviewThumbs(');
    expect(fnBody).toContain('applyThemeBackgroundToElement(');
  });

  it('wires jump-to-top and jump-to-bottom arrows in the Pages & Steps overview list', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    expect(html).toContain('id="btnOverviewJumpTop"');
    expect(html).toContain('id="btnOverviewJumpBottom"');
    expect(runtime).toContain('computeScrollJumpVisibility');
    expect(runtime).toContain('function syncOverviewScrollButtons()');
    expect(runtime).toContain('function scrollOverviewListTo(');
  });

  it('wires jump-to-first and jump-to-last buttons in the page navigation pill', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    expect(html).toContain('id="firstPage"');
    expect(html).toContain('id="lastPage"');
    expect(runtime).toContain('computePageNavigationState');
    expect(runtime).toContain('resolvePageNavigationTarget');
    expect(runtime).toContain("navigatePage('first')");
    expect(runtime).toContain("navigatePage('last')");
  });

  it('tints the entire model one color for Single Continuous Build in Section Colors mode', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const fnStart = sourceText.indexOf('function getPreviewPartMaps()');
    const fnEnd = sourceText.indexOf('function rebuildAndDrawImportPreview()', fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const fnBody = sourceText.slice(fnStart, fnEnd);

    expect(fnBody).toContain("const partColorOverrides = impState.colorMode === 'sections' ? {} : null;");
    expect(fnBody).toContain('SECTION_PREVIEW_PALETTE[0]');
  });

  it('keeps front and back cover Brick Instruction Works attribution non-editable with Made with and QR hint copy', () => {
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // No QR code toggle or back-cover credit editor input in overlay controls
    expect(runtime).not.toContain('id="covQrToggle"');
    expect(runtime).not.toContain('#covQrToggle');
    expect(runtime).not.toContain('placeholder="Back cover text"');

    // Front cover no longer splits "Brick Instruction" and "Works" across two lines
    expect(runtime).not.toContain('>Brick Instruction<');
    expect(runtime).not.toContain("fillText('Brick Instruction'");

    // Both live DOM and PDF canvas render Made with, unified PROGRAM_NAME, QR hint, and fixed back credit
    expect(runtime.match(/COVER_MADE_WITH_LABEL/g)?.length).toBeGreaterThanOrEqual(3);
    expect(runtime.match(/COVER_QR_HINT_TEXT/g)?.length).toBeGreaterThanOrEqual(4);
    expect(runtime.match(/BACK_COVER_CREDIT/g)?.length).toBeGreaterThanOrEqual(4);
  });

  it('replaces inline page break instructions with `?` help tooltip triggers on Page Break buttons', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // Always-visible instructions copy removed from overview modal & step/page controls
    expect(html).not.toContain('locks a step to the start of a new page so editing earlier steps');
    expect(runtime).not.toContain('Pins a page break before Step ${step.num} so adding, splitting, or merging earlier steps');

    // Global tooltip & conditional active breaks bar exist in index.html
    expect(html).toContain('id="pageBreakHelpTooltip"');
    expect(html).toContain('id="overviewPinsBar"');

    // Both overview and floating Page card Page Break buttons include integrated `?` triggers wired to tooltip controller
    expect(runtime).toContain('page-break-help-btn');
    expect(runtime).toContain('class="pb-help-btn');
    expect(runtime).toContain('function showPageBreakHelpTooltip(');
    expect(runtime).toContain('function togglePageBreakHelpTooltip(');
    expect(runtime).toContain('function hidePageBreakHelpTooltip(');
    expect(runtime).toContain('computeHelpTooltipPosition(');
    expect(runtime).toContain('getPageBreakHelpExplanation(');
  });

  it('wires scope-based editor cards and 3-tier scope badges without Cover/Complete drag-to-orbit', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    expect(sourceText).toContain('function renderScopeBadge(');
    expect(sourceText).toContain('resolveModeForPage(');
    expect(sourceText).not.toContain('bindHeroCameraOrbit');
    expect(sourceText).not.toContain('liveHeroOrbitCanvas');
    expect(sourceText).not.toContain('heroOrbitContainer');
    expect(sourceText.match(/Drag 3D model to orbit/g)?.length).toBe(1);
    expect(sourceText).not.toContain('openStepEditModal');
    expect(sourceText).not.toContain('closeStepEditModal');
  });

  it('keeps the Parts List live layout preview pinned above the scroll pane with valid paper preview dimensions', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const modalStart = html.indexOf('id="bomSetupModal"');
    const previewHeaderIdx = html.indexOf('id="bomSetupPreviewHeader"', modalStart);
    const scrollIdx = html.indexOf('id="bomSetupScroll"', modalStart);
    const layoutPreviewIdx = html.indexOf('id="bomLayoutPreview"', modalStart);
    const anatomyPreviewIdx = html.indexOf('id="bomCellAnatomyPreview"', modalStart);
    const liveMetricsIdx = html.indexOf('id="bomLiveMetrics"', modalStart);

    expect(modalStart).toBeGreaterThan(-1);
    expect(previewHeaderIdx).toBeGreaterThan(modalStart);
    expect(scrollIdx).toBeGreaterThan(previewHeaderIdx);
    // All live preview pieces stay inside the pinned header before the scrollable settings container
    expect(layoutPreviewIdx).toBeGreaterThan(previewHeaderIdx);
    expect(layoutPreviewIdx).toBeLessThan(scrollIdx);
    expect(anatomyPreviewIdx).toBeGreaterThan(previewHeaderIdx);
    expect(anatomyPreviewIdx).toBeLessThan(scrollIdx);
    expect(liveMetricsIdx).toBeGreaterThan(previewHeaderIdx);
    expect(liveMetricsIdx).toBeLessThan(scrollIdx);

    const headerChunk = html.slice(previewHeaderIdx, scrollIdx);
    expect(headerChunk).toContain('shrink-0');

    const fnStart = runtime.indexOf('function renderBomSetupPreview(');
    const fnEnd = runtime.indexOf('function syncBomSetupUI(', fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const fnBody = runtime.slice(fnStart, fnEnd);

    expect(fnBody).toContain('computePaperPreviewBox({');
    expect(fnBody).toContain('box.widthPx');
    expect(fnBody).toContain('box.heightPx');
    expect(fnBody).not.toContain('box.w ');
    expect(fnBody).not.toContain('${box.w}');
    expect(fnBody).not.toContain('${box.h}');
  });

  it('updates rotation indicators live during free-orbit dragging and commits renderAll on endOrbit', () => {
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    expect(runtime).toContain('resolveStudioStepCamera(');
    expect(runtime).toContain('resolveEffectiveStudioStepCue(');
    expect(runtime).toContain('data-rot-cue-host=');
    expect(runtime).toContain('data-step-badges=');
    expect(runtime).toContain('function syncVisibleStepRotationBadges()');

    const orbitStart = runtime.indexOf("const liveCanvas = document.getElementById('liveRotateCanvas');");
    const orbitEnd = runtime.indexOf('liveCanvas.onpointercancel = endOrbit;', orbitStart);
    expect(orbitStart).toBeGreaterThan(-1);
    expect(orbitEnd).toBeGreaterThan(orbitStart);
    const orbitBody = runtime.slice(orbitStart, orbitEnd);

    expect(orbitBody).toContain('syncVisibleStepRotationBadges();');
    expect(orbitBody).toContain('renderAll();');
    expect(orbitBody).not.toContain('renderContextOverlay(page);');
  });

  it('uses inline notices only for undoable off-screen override impacts and #confirmActionModal for permanent actions', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');

    expect(css).toContain('.destructive-notice');
    expect(css).toContain('.destructive-notice[data-tone="warning"]');

    // Static inline notice slots are strictly for undoable off-screen / cross-surface overrides
    for (const id of [
      'impKeepNotice',
      'impActionNotice',
      'grpOverlapNotice',
      'wordlessToggleNotice',
      'applyAngleConflictNotice',
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(runtime).toContain(`'${id}'`);
    }

    // Unified "Are you sure?" confirmation dialog for permanent (non-undoable) actions
    for (const id of [
      'confirmActionModal',
      'confirmActionTitle',
      'confirmActionMessage',
      'confirmActionDetail',
      'confirmActionCancel',
      'confirmActionConfirm',
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(runtime).toContain(`'${id}'`);
    }
    expect(runtime).toContain('function openConfirmActionDialog(');
    expect(runtime).toContain('if (isConfirmActionDialogOpen())');
    // No raw browser window.confirm() calls left for permanent actions
    expect(runtime).not.toMatch(/\bconfirm\(/);

    // Neither undoable on-screen actions nor permanent actions render inline warning banners
    for (const removedId of [
      'overviewClearPinsNotice',
      'grpDeleteNotice',
      'menuCloseModelNotice',
      'themeDeleteNotice',
      'mpReplaceModelNotice',
      'openModelReplaceNotice',
      'libClearModelImpactNotice',
      'libClearConfirmWrap',
    ]) {
      expect(html).not.toContain(`id="${removedId}"`);
      expect(runtime).not.toContain(`'${removedId}'`);
    }

    for (const fnName of [
      'getApplyCameraDestructiveNotice(',
      'getWordlessToggleDestructiveNotice(',
      'getMergeStepDestructiveNotice(',
      'getPartsMoveStepDestructiveNotice(',
      'getStepGenerationDestructiveNotice(',
      'getLayoutGroupOverlapDestructiveNotice(',
      'getCloseModelConfirmDialog(',
      'getReplaceModelConfirmDialog(',
      'getDeleteThemeConfirmDialog(',
      'getLibraryRemovePartConfirmDialog(',
      'getLibraryClearSavedConfirmDialog(',
    ]) {
      expect(runtime).toContain(fnName);
    }

    for (const removedFn of [
      'getStepResetCameraDestructiveNotice',
      'getHeroResetCameraDestructiveNotice',
      'getClearAllPageBreaksDestructiveNotice',
      'getDeleteDividerDestructiveNotice',
      'getPartsActionDestructiveNotices',
      'getLayoutGroupDestructiveNotices',
      'getCloseModelDestructiveNotice',
      'getReplaceModelModalDestructiveNotice',
      'getDeleteThemeDestructiveNotice',
      'getLibraryRemovePartDestructiveNotice',
      'getLibraryClearSavedDestructiveNotice',
    ]) {
      expect(runtime).not.toContain(removedFn);
    }
  });

  it('does not include a Print / Save PDF button in the Page Setup dialog', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const modalStart = html.indexOf('id="pageSetupModal"');
    const modalEnd = html.indexOf('id="bomSetupModal"', modalStart);
    expect(modalStart).toBeGreaterThan(-1);
    expect(modalEnd).toBeGreaterThan(modalStart);

    const pageSetupHtml = html.slice(modalStart, modalEnd);
    expect(pageSetupHtml).not.toContain('pageSetupPrintBtn');
    expect(pageSetupHtml).not.toContain('Print / Save PDF');
    expect(pageSetupHtml).toContain('id="pageSetupDoneBtn"');
    expect(runtime).not.toContain('pageSetupPrintBtn');
  });

  it('keeps the 3-arc half-barbed brand logo synchronized across public/logo.svg, index.html, and studioRuntime.ts', () => {
    const logoSvg = fs.readFileSync(path.resolve(process.cwd(), 'public/logo.svg'), 'utf8');
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const svgPaths = Array.from(logoSvg.matchAll(/<path d="([^"]+)" fill="([^"]+)"\/>/g)).map(
      ([, d, fill]) => [d, fill] as const,
    );
    expect(svgPaths).toHaveLength(3);
    expect(svgPaths.map(([, fill]) => fill)).toEqual(['#38bdf8', '#7c152e', '#ed7d1f']);

    // Every path in public/logo.svg appears in all 4 inline SVG logos in index.html
    // (unified menu header, mobile editor brand pill, welcome sheet, open-model modal) and in BRAND_LOGO_PATHS
    for (const [d, fill] of svgPaths) {
      const htmlTag = `<path d="${d}" fill="${fill}"/>`;
      expect(html.split(htmlTag).length - 1).toBe(4);
      expect(runtime).toContain(`['${d}', '${fill}']`);
    }
  });

  it('uses physical Smart Auto Grid packing (no 1–2 step cap) and wires page-size readability warnings', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // Old 1–2 step auto copy is gone
    expect(html).not.toContain('fits 1–2 steps per page');
    expect(runtime).not.toContain('chooses 1–2 steps per page');

    // Physical Smart Auto Grid & page-size warning engine are wired into pagination, DOM, and PDF export
    expect(runtime).toContain('buildSmartAutoPageContext(');
    expect(runtime).toContain('packSmartAutoPage(');
    expect(runtime).toContain('analyzePageSizeFit(');
    expect(runtime).toContain('formatPageSizeWarningForPage(');
    expect(runtime).toContain('computePageSlotRects(slots.length, pageSpec, dims.isLandscape, gridW, gridH, gapPx, page.autoGrid)');
    expect(runtime).toContain('computePageSlotRects(slots.length, pageSpec, isLand, availW, availH, gap, page.autoGrid)');

    // Warning surfaces exist in index.html and are synced in studioRuntime.ts
    for (const id of [
      'pageSizeWarningBanner',
      'pageSizeWarningText',
      'btnApplySuggestedPageSize',
      'btnOpenPageSetupFromWarning',
      'btnDismissPageSizeWarning',
      'pageSizeFitWarning',
      'menuPageSetupWarnDot',
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(runtime).toContain(`'${id}'`);
    }
  });

  it('wires customizable keyboard shortcuts in the main menu and handles every registered action', async () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    const { SHORTCUT_ACTIONS } = await import('../engine/keyboardShortcuts');

    // Keyboard Shortcuts section lives inside the main menu drawer (#menuScrollBody)
    const menuBodyStart = html.indexOf('id="menuScrollBody"');
    const menuFooterStart = html.indexOf('id="menuProvideFeedbackLink"', menuBodyStart);
    const shortcutsSectionIdx = html.indexOf('id="menuShortcutsSection"', menuBodyStart);
    expect(menuBodyStart).toBeGreaterThan(-1);
    expect(shortcutsSectionIdx).toBeGreaterThan(menuBodyStart);
    expect(shortcutsSectionIdx).toBeLessThan(menuFooterStart);

    for (const id of [
      'menuShortcutsToggleBtn',
      'menuShortcutsSummary',
      'menuShortcutsCustomBadge',
      'menuShortcutsPanel',
      'shortcutsSearchInput',
      'shortcutsConflictBanner',
      'shortcutsGroupsList',
      'btnResetAllShortcuts',
      'shortcutsResetAllNotice',
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(runtime).toContain(`'${id}'`);
    }

    expect(css).toContain('.shortcut-kbd-btn');
    expect(css).toContain('.shortcut-kbd-btn[data-recording="true"]');
    expect(css).toContain('.shortcut-kbd-btn[data-customized="true"]');

    // Every registered shortcut action must have a case inside executeShortcutAction()
    const execStart = runtime.indexOf('function executeShortcutAction(actionId)');
    const execEnd = runtime.indexOf("document.addEventListener('keydown'", execStart);
    expect(execStart).toBeGreaterThan(-1);
    expect(execEnd).toBeGreaterThan(execStart);
    const execBody = runtime.slice(execStart, execEnd);

    for (const action of SHORTCUT_ACTIONS) {
      expect(execBody).toContain(`case '${action.id}':`);
    }

    expect(runtime).toContain('function performUndo(');
    expect(runtime).toContain('function performRedo(');
    expect(runtime).toContain('resolveShortcutActionForEvent(');
    expect(runtime).toContain('syncShortcutTooltips()');
    expect(runtime).toContain('loadShortcutOverridesFromStorage()');
    expect(runtime).toContain('saveShortcutOverridesToStorage(');
  });

  it('keeps the Parts List section in the Style popover to a direct link to the Parts List Setup dialog', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const styleStart = html.indexOf('id="stylePopover"');
    const styleEnd = html.indexOf('id="overviewModal"', styleStart);
    expect(styleStart).toBeGreaterThan(-1);
    expect(styleEnd).toBeGreaterThan(styleStart);

    const styleHtml = html.slice(styleStart, styleEnd);
    const partsListStart = styleHtml.indexOf('<!-- Parts List');
    expect(partsListStart).toBeGreaterThan(-1);
    const partsListHtml = styleHtml.slice(partsListStart);

    // Only the Parts List Setup link button (and live summary) remains — no inline format buttons or toggles
    expect(partsListHtml).toContain('id="btnStyleOpenBomSetup"');
    expect(partsListHtml).toContain('id="styleBomSummary"');
    expect(partsListHtml).toContain('Parts List Setup');
    expect(partsListHtml).not.toContain('style-bom-format-btn');
    expect(partsListHtml).not.toContain('data-style-bom-format');
    expect(partsListHtml).not.toContain('styleToggleBomPartId');
    expect(partsListHtml).not.toContain('<input');
    expect(partsListHtml.match(/<button\b/g)?.length).toBe(1);

    // Runtime keeps link wiring and drops dead inline control references
    expect(runtime).toContain("document.getElementById('btnStyleOpenBomSetup')");
    expect(runtime).toContain('openBomSetupModal();');
    expect(runtime).not.toContain('style-bom-format-btn');
    expect(runtime).not.toContain('styleToggleBomPartId');
  });

  it('moves Insert Blank / Divider Page After Current from the menu drawer into Step -> Layout', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    expect(html).not.toContain('id="menuPageInsertsSection"');
    expect(html).not.toContain('id="menuAddDivider"');
    expect(html).not.toContain('Insert Blank / Divider Page After Current');
    expect(runtime).not.toContain('menuPageInsertsSection');
    expect(runtime).not.toContain('menuAddDivider');

    const stepLayoutStart = runtime.indexOf("} else if (subTab === 'layout') {");
    const stepNotesStart = runtime.indexOf("// subTab === 'notes'", stepLayoutStart);
    expect(stepLayoutStart).toBeGreaterThan(-1);
    expect(stepNotesStart).toBeGreaterThan(stepLayoutStart);

    const stepLayoutHtml = runtime.slice(stepLayoutStart, stepNotesStart);
    expect(stepLayoutHtml).toContain('id="stepInsertDividerBtn"');
    expect(stepLayoutHtml).toContain('Insert Blank / Divider Page After Current');
    expect(stepLayoutHtml).toContain('id="stepGotoDividerBtn"');

    expect(runtime).toContain('function insertDividerAfterCurrentPage(');
    expect(runtime).toContain("box.querySelector('#stepInsertDividerBtn')");
    expect(runtime).toContain("box.querySelector('#stepGotoDividerBtn')");
  });

  it('combines the menu button and site title into the side menu without Instruction Studio copy and expands by default on desktop', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // "Instruction Studio" subtitle must not appear in the UI
    expect(html.toLowerCase()).not.toContain('instruction studio');

    // Unified side menu contains the menu toggle button, site title, and collapsible panel in one shell
    const drawerStart = html.indexOf('id="menuDrawer"');
    const drawerEnd = html.indexOf('</aside>', drawerStart);
    expect(drawerStart).toBeGreaterThan(-1);
    expect(drawerEnd).toBeGreaterThan(drawerStart);
    const drawerHtml = html.slice(drawerStart, drawerEnd);

    expect(drawerHtml).toContain('id="menuHeaderBar"');
    expect(drawerHtml).toContain('id="btnOpenMenu"');
    expect(drawerHtml).toContain('id="desktopModelChip"');
    expect(drawerHtml).toContain('Brick Instruction Works');
    expect(drawerHtml).toContain('id="menuDrawerPanel"');
    // No separate close-button/dark-rail replacement header
    expect(drawerHtml).not.toContain('id="btnCloseMenu"');
    expect(html).not.toContain('id="menuDismissArea"');

    // Workspace area wraps stage and floating dock so docked desktop side menu never obscures content
    const wsStart = html.indexOf('id="workspaceArea"');
    expect(wsStart).toBeGreaterThan(drawerEnd);
    expect(html.indexOf('id="emptyState"', wsStart)).toBeGreaterThan(wsStart);
    expect(html.indexOf('id="stageViewport"', wsStart)).toBeGreaterThan(wsStart);
    expect(html.indexOf('id="bottomDock"', wsStart)).toBeGreaterThan(wsStart);

    // Runtime wires pure desktop-default side menu state machine and workspace viewport sizing
    expect(runtime).toContain('createInitialSideMenuState(');
    expect(runtime).toContain('computeSideMenuLayout(');
    expect(runtime).toContain('toggleSideMenuState(');
    expect(runtime).toContain('openSideMenuState(');
    expect(runtime).toContain('closeSideMenuOverlayState(');
    expect(runtime).toContain('computeWorkspaceViewportSize(');
    expect(runtime).toContain('function syncSideMenuLayout(');
  });

  it('switches the bottom mode pill back to Pan when clicking blank stage space outside #pageFrame', () => {
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const start = runtime.indexOf('(function setupStageGestures()');
    const end = runtime.indexOf('// 11. INDEXEDDB PERSISTENCE', start);
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const gesturesBody = runtime.slice(start, end);

    expect(gesturesBody).toContain("const pageFrame = document.getElementById('pageFrame');");
    expect(gesturesBody).toContain('isBlankStageClickTarget(');
    expect(gesturesBody).toContain('shouldResetModeOnBlankStageClick({');
    expect(gesturesBody).toContain("switchStudioMode('pan');");
    expect(gesturesBody).toContain('suppressedBlankResetEvent');

    expect(runtime).toContain('function switchStudioMode(nextMode)');
    expect(runtime).toContain('suppressedBlankResetEvent = e;');
  });

  it('removes duplicate Extra Pages text toggles from Page Setup and exposes separate toggles with per-page Settings links', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const modalStart = html.indexOf('id="pageSetupModal"');
    const modalEnd = html.indexOf('id="bomSetupModal"', modalStart);
    expect(modalStart).toBeGreaterThan(-1);
    expect(modalEnd).toBeGreaterThan(modalStart);

    const pageSetupHtml = html.slice(modalStart, modalEnd);
    for (const removed of [
      'Extra Pages',
      'toggleExtras',
      'toggleCoverText',
      'toggleCompleteText',
      'toggleCompleteFireworks',
      'toggleBomTextFields',
    ]) {
      expect(pageSetupHtml).not.toContain(removed);
      expect(runtime).not.toContain(removed);
    }

    for (const requiredId of [
      'toggleShowCover',
      'toggleShowComplete',
      'toggleShowPartsList',
      'toggleShowBackCover',
      'btnOpenCoverSettings',
      'btnOpenCompleteSettings',
      'btnOpenPartsListSettings',
      'btnOpenBackCoverSettings',
    ]) {
      expect(pageSetupHtml).toContain(`id="${requiredId}"`);
      expect(runtime).toContain(`'${requiredId}'`);
    }

    expect(runtime).toContain('if (state.showCover)');
    expect(runtime).toContain('if (state.showBuildComplete)');
    expect(runtime).toContain('if (state.showPartsList)');
    expect(runtime).toContain('if (state.showBackCover)');
    expect(runtime).toContain('openExtraPageSettings');
  });

  it('keeps text selectable across the app and exported HTML viewer', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const exporter = fs.readFileSync(
      path.resolve(process.cwd(), 'src/export/interactiveHtmlExporter.ts'),
      'utf8',
    );

    const bodyMatch = html.match(/<body[^>]*>/);
    expect(bodyMatch).not.toBeNull();
    expect(bodyMatch![0]).not.toContain('select-none');

    const activeBodyStart = exporter.indexOf('html.js-3d-active, html.js-3d-active body {');
    const activeBodyEnd = exporter.indexOf('}', activeBodyStart);
    expect(activeBodyStart).toBeGreaterThan(-1);
    expect(exporter.slice(activeBodyStart, activeBodyEnd)).not.toContain('user-select: none');
  });

  it('includes a desktop Shift+Scroll hint and left-margin alignment on the Style dialog theme strip', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const popStart = html.indexOf('id="stylePopover"');
    const popEnd = html.indexOf('id="overviewModal"', popStart);
    expect(popStart).toBeGreaterThan(-1);
    expect(popEnd).toBeGreaterThan(popStart);

    const styleHtml = html.slice(popStart, popEnd);
    expect(styleHtml).toContain('id="themeStrip"');
    expect(styleHtml).toContain('scroll-px-4');
    expect(styleHtml).toContain('id="themeStripScrollHint"');
    expect(styleHtml).toContain('Shift');
    expect(styleHtml).toContain('Scroll');

    expect(css).toContain('scroll-padding-inline: 1rem;');
    expect(css).toContain('.theme-strip-scroll-hint');
    expect(css).toContain('@media (hover: hover) and (pointer: fine)');
    expect(runtime).toContain("themeStripWheelEl.addEventListener('wheel'");
  });

  it('does not include a redundant View Parts List button in the Parts List Setup dialog', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const modalStart = html.indexOf('id="bomSetupModal"');
    const modalEnd = html.indexOf('id="applyAngleModal"', modalStart);
    expect(modalStart).toBeGreaterThan(-1);
    expect(modalEnd).toBeGreaterThan(modalStart);

    const bomSetupHtml = html.slice(modalStart, modalEnd);
    expect(bomSetupHtml).not.toContain('bomSetupJumpBtn');
    expect(bomSetupHtml).not.toContain('View Parts List');
    expect(bomSetupHtml).toContain('id="bomSetupDoneBtn"');
    expect(runtime).not.toContain('bomSetupJumpBtn');
  });
});

