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

  it('wires destructive notices for off-screen override impacts and non-undoable actions without warning on undoable on-screen actions', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');
    const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf8');

    expect(css).toContain('.destructive-notice');
    expect(css).toContain('.destructive-notice[data-tone="warning"]');
    expect(css).toContain('.destructive-notice[data-tone="danger"]');

    for (const id of [
      'menuCloseModelNotice',
      'themeDeleteNotice',
      'mpReplaceModelNotice',
      'impKeepNotice',
      'impActionNotice',
      'grpOverlapNotice',
      'wordlessToggleNotice',
      'applyAngleConflictNotice',
      'openModelReplaceNotice',
      'libClearModelImpactNotice',
    ]) {
      expect(html).toContain(`id="${id}"`);
      expect(runtime).toContain(`'${id}'`);
    }

    // Undoable actions that only affect what is visible on the current screen must not render warnings
    for (const removedId of ['overviewClearPinsNotice', 'grpDeleteNotice']) {
      expect(html).not.toContain(`id="${removedId}"`);
      expect(runtime).not.toContain(`'${removedId}'`);
    }

    for (const fnName of [
      'getApplyCameraDestructiveNotice(',
      'getWordlessToggleDestructiveNotice(',
      'getMergeStepDestructiveNotice(',
      'getPartsMoveStepDestructiveNotice(',
      'getStepGenerationDestructiveNotice(',
      'getCloseModelDestructiveNotice(',
      'getReplaceModelModalDestructiveNotice(',
      'getDeleteThemeDestructiveNotice(',
      'getLayoutGroupOverlapDestructiveNotice(',
      'getLibraryRemovePartDestructiveNotice(',
      'getLibraryClearSavedDestructiveNotice(',
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

    // Every path in public/logo.svg appears in all 5 inline SVG logos in index.html and in BRAND_LOGO_PATHS
    for (const [d, fill] of svgPaths) {
      const htmlTag = `<path d="${d}" fill="${fill}"/>`;
      expect(html.split(htmlTag).length - 1).toBe(5);
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
});
