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

  it('applies Style Rendering Style (lighting, outlines, outline weight) to Bricks Library thumbnails and 3D inspector', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    const fnStart = sourceText.indexOf('function getLibRenderStyleState(');
    const fnEnd = sourceText.indexOf('function stopLibThumbQueue(', fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const fnBody = sourceText.slice(fnStart, fnEnd);

    expect(fnBody).toContain('function buildLibThumbCacheKey(');
    expect(fnBody).toContain('function drawLibPartMesh(');
    expect(fnBody).toContain('sanitizeStepLightingMode(');
    expect(fnBody).toContain('photo.renderToCanvas(mesh');
    expect(fnBody).toContain("unlit: style.stepLighting === 'none'");
    expect(fnBody).toContain('starkBlackOutlines: style.starkBlackOutlines');
    expect(fnBody).toContain('outlineLineWeight: style.outlineLineWeight');
    expect(fnBody).toContain('heroQuality: true, includeHeroEdges: true');
    expect(fnBody).toContain('tightFit: true');

    // Enqueue lookup must share the style-aware cache key helper
    const enqStart = sourceText.indexOf('function enqueueLibThumbImg(');
    const enqEnd = sourceText.indexOf('function observeLibThumbImgs(', enqStart);
    expect(enqStart).toBeGreaterThan(-1);
    expect(enqEnd).toBeGreaterThan(enqStart);
    expect(sourceText.slice(enqStart, enqEnd)).toContain('buildLibThumbCacheKey(');
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

  it('wires scope-based editor cards, 3-tier scope badges, and full Cover/Complete + Step drag-to-orbit camera controls', () => {
    const runtimePath = path.resolve(process.cwd(), 'src/studioRuntime.ts');
    const sourceText = fs.readFileSync(runtimePath, 'utf8');

    expect(sourceText).toContain('function renderScopeBadge(');
    expect(sourceText).toContain('resolveModeForPage(');
    expect(sourceText).toContain('function bindHeroCameraInteractions(');
    expect(sourceText).toContain('id="liveHeroCanvas"');
    expect(sourceText).toContain('id="heroCamTop"');
    expect(sourceText).toContain('id="heroCamBot"');
    expect(sourceText).toContain('data-hero-rotate=');
    expect(sourceText).toContain('data-step-rotate=');
    expect(sourceText).toContain('rotateCameraAzimuth(');
    expect(sourceText).not.toContain('hero-corner-btn');
    expect(sourceText).not.toContain('class="corner-btn');
    expect(sourceText.match(/Drag 3D model to orbit/g)?.length).toBe(2);
    expect(sourceText).not.toContain('openStepEditModal');
    expect(sourceText).not.toContain('closeStepEditModal');

    // Regression guard: renderContextOverlay replaces state.coverMeta / state.completeMeta via normalize*Meta
    // right after bindHeroCameraInteractions runs, so drag-to-orbit must always read/write the live state ref.
    const heroFnStart = sourceText.indexOf('function bindHeroCameraInteractions(');
    const heroFnEnd = sourceText.indexOf('function bindStepPageInteractions(', heroFnStart);
    expect(heroFnStart).toBeGreaterThan(-1);
    expect(heroFnEnd).toBeGreaterThan(heroFnStart);
    const heroFnBody = sourceText.slice(heroFnStart, heroFnEnd);
    expect(heroFnBody).toContain('const getHeroMeta = () => (isCover ? state.coverMeta : state.completeMeta);');
    expect(heroFnBody).not.toContain('const meta = isCover ? state.coverMeta : state.completeMeta;');
  });

  it('wires Rendering Style lighting (None/Standard/Studio), outlines, and fades inside Style popover', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const popStart = html.indexOf('id="stylePopover"');
    const popEnd = html.indexOf('id="overviewModal"');
    expect(popStart).toBeGreaterThan(-1);
    expect(popEnd).toBeGreaterThan(popStart);
    const popChunk = html.slice(popStart, popEnd);
    const renderStyleIdx = popChunk.indexOf('>Rendering Style<');
    const stepDisplayIdx = popChunk.indexOf('>Step Display<');
    expect(renderStyleIdx).toBeGreaterThan(-1);
    expect(stepDisplayIdx).toBeGreaterThan(renderStyleIdx);
    const renderStyleChunk = popChunk.slice(renderStyleIdx, stepDisplayIdx);

    expect(renderStyleChunk).toContain('data-step-lighting="none"');
    expect(renderStyleChunk).toContain('data-step-lighting="standard"');
    expect(renderStyleChunk).toContain('data-step-lighting="studio"');
    expect(renderStyleChunk).toContain('id="toggleHighlight"');
    expect(renderStyleChunk).toContain('id="toggleStarkBlackOutlines"');
    expect(renderStyleChunk).toContain('Outline All Parts');
    expect(renderStyleChunk).toContain('data-hl-weight="extra-heavy"');
    expect(renderStyleChunk).toContain('data-outline-weight="extra-heavy"');
    expect(renderStyleChunk).toContain('Fade Earlier Pieces');

    expect(runtime).toContain("querySelectorAll('.step-lighting-chip')");
    expect(runtime).toContain("getElementById('toggleStarkBlackOutlines')");
    expect(runtime).toContain('function renderStepWithStudioPhoto(');
    expect(runtime).toContain('uniform float uUnlit;');
    expect(runtime).toContain('stepLighting');
    expect(runtime).toContain('starkBlackOutlines');
    expect(runtime).toContain('highlightLineWeight');
    expect(runtime).toContain('outlineLineWeight');
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
    // (unified menu header, welcome sheet, startup loading screen, open-model modal) and in BRAND_LOGO_PATHS
    for (const [d, fill] of svgPaths) {
      const htmlTag = `<path d="${d}" fill="${fill}"/>`;
      expect(html.split(htmlTag).length - 1).toBe(4);
      expect(runtime).toContain(`['${d}', '${fill}']`);
    }
  });

  it('uses physical Smart Auto Grid packing (no 1–2 step cap) and surfaces page-size warnings as regular diagnostics', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // Old 1–2 step auto copy and "Up to N Steps/Page" max-number framing are gone
    expect(html).not.toContain('fits 1–2 steps per page');
    expect(runtime).not.toContain('chooses 1–2 steps per page');
    expect(runtime).not.toContain('Smart Auto Grid · Up to ');
    expect(runtime).toContain('Smart Auto Grid · ${proportionTitle}');
    expect(html).not.toContain('Step Proportions (Mixed Layouts)');
    expect(html).toContain('>Step Proportions<');

    // Intrusive floating canvas overlay banner is removed
    expect(html).not.toContain('id="pageSizeWarningBanner"');
    expect(runtime).not.toContain("'pageSizeWarningBanner'");

    // Physical Smart Auto Grid & page-size warning engine are wired into pagination, DOM, and PDF export
    expect(runtime).toContain('buildSmartAutoPageContext(');
    expect(runtime).toContain('packSmartAutoPage(');
    expect(runtime).toContain('analyzePageSizeFit(');
    expect(runtime).toContain('formatPageSizeWarningForPage(');
    expect(runtime).toContain('getPageSizeWarningStepLinks(');
    expect(runtime).toContain('function jumpToStepById(');
    expect(runtime).toContain('function renderPageSizeWarningMessageHtml(');
    expect(runtime).toContain('function bindPageSizeWarningStepLinks(');
    expect(runtime).toContain('computePageSlotRects(slots.length, pageSpec, dims.isLandscape, gridW, gridH, gapPx, page.autoGrid)');
    expect(runtime).toContain('computePageSlotRects(slots.length, pageSpec, isLand, availW, availH, gap, page.autoGrid)');

    // Regular warning integration in Model Issues + non-blocking Page Setup / menu indicators
    expect(runtime).toContain('function buildLayoutDiagnostic(');
    expect(runtime).toContain('function syncLayoutDiagnostic(');
    expect(runtime).toContain("category: 'layout'");
    expect(runtime).toContain('Page Layout (');
    expect(runtime).toContain('#errApplyLargerSizeQuick');
    expect(runtime).toContain('#errOpenPageSetupQuick');

    for (const id of [
      'pageSizeFitWarning',
      'menuPageSetupWarnDot',
      'menuErrorCountBadge',
      'errorBannerDot',
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

    // Keyboard Shortcuts launcher lives inside the main menu drawer (#menuScrollBody),
    // while the customizer itself lives in its own dedicated screen modal (#shortcutsModal)
    const menuBodyStart = html.indexOf('id="menuScrollBody"');
    const menuFooterStart = html.indexOf('id="menuProvideFeedbackLink"', menuBodyStart);
    const shortcutsSectionIdx = html.indexOf('id="menuShortcutsSection"', menuBodyStart);
    const shortcutsModalIdx = html.indexOf('id="shortcutsModal"');
    expect(menuBodyStart).toBeGreaterThan(-1);
    expect(shortcutsSectionIdx).toBeGreaterThan(menuBodyStart);
    expect(shortcutsSectionIdx).toBeLessThan(menuFooterStart);
    expect(shortcutsModalIdx).toBeGreaterThan(menuFooterStart);
    expect(html).not.toContain('id="menuShortcutsPanel"');

    for (const id of [
      'menuShortcutsBtn',
      'menuShortcutsCustomBadge',
      'shortcutsModal',
      'shortcutsModalCustomBadge',
      'btnCloseShortcuts',
      'shortcutsDoneBtn',
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
    const partsListEnd = styleHtml.indexOf('id="styleWizardFooter"', partsListStart);
    const partsListHtml = partsListEnd > partsListStart
      ? styleHtml.slice(partsListStart, partsListEnd)
      : styleHtml.slice(partsListStart);

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
    expect(drawerHtml).toContain('id="menuStyleBtn"');
    expect(drawerHtml).not.toContain('id="menuStyleSummary"');
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
    expect(runtime).toContain("setVisible('menuStyleBtn', vis.showStyle)");
    expect(runtime).toContain("setTitle('menuStyleBtn', 'toggleStyle'");
    expect(runtime).toContain('menuStyleBtnEl.contains(t)');
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

  it('links the Parts List Setup Saved with theme banner to the Style dialog', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const modalStart = html.indexOf('id="bomSetupModal"');
    const modalEnd = html.indexOf('id="applyAngleModal"', modalStart);
    expect(modalStart).toBeGreaterThan(-1);
    expect(modalEnd).toBeGreaterThan(modalStart);

    const bomSetupHtml = html.slice(modalStart, modalEnd);
    const btnStart = bomSetupHtml.indexOf('<button id="btnBomOpenStyle"');
    const btnEnd = bomSetupHtml.indexOf('</button>', btnStart);
    expect(btnStart).toBeGreaterThan(-1);
    expect(btnEnd).toBeGreaterThan(btnStart);

    const bannerHtml = bomSetupHtml.slice(btnStart, btnEnd);
    expect(bannerHtml).toContain('Saved with theme:');
    expect(bannerHtml).toContain('id="bomThemeName"');

    const wireStart = runtime.indexOf("const btnBomOpenStyle = document.getElementById('btnBomOpenStyle');");
    const wireEnd = runtime.indexOf('document.querySelectorAll(\'.bom-gridmode-btn\')', wireStart);
    expect(wireStart).toBeGreaterThan(-1);
    expect(wireEnd).toBeGreaterThan(wireStart);

    const wireBlock = runtime.slice(wireStart, wireEnd);
    expect(wireBlock).toContain('closeBomSetupModal();');
    expect(wireBlock).toContain('setStylePopoverOpen(true);');
  });

  it('warns iOS users with a dialog when selecting Export HTML before generating the file', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    expect(html).toContain('id="confirmActionIcon"');
    expect(runtime).toContain("const isWarning = spec.tone === 'warning';");
    expect(runtime).toContain("iconEl.classList.toggle('bg-[var(--warning-soft)]', isWarning);");

    const fnStart = runtime.indexOf('async function runInteractiveHtmlExport()');
    const fnEnd = runtime.indexOf('const htmlDoc = generateInteractiveHtmlDocument(', fnStart);
    expect(fnStart).toBeGreaterThan(-1);
    expect(fnEnd).toBeGreaterThan(fnStart);
    const exportHead = runtime.slice(fnStart, fnEnd);
    expect(exportHead).toContain('const iosWarning = getIosHtmlExportWarningDialog();');
    expect(exportHead).toContain('if (iosWarning && !(await openConfirmActionDialog(iosWarning))) return;');
  });

  it('prevents opening settings for disabled extra pages from Menu, Style popover, Page Setup, and shortcuts', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    expect(html).toContain('id="styleBomSection"');
    expect(runtime).toContain('showPartsList: Boolean(state.showPartsList)');
    expect(runtime).toContain("document.getElementById('styleBomSection')");
    expect(runtime).toContain('if (!state.showPartsList && isBomSetupModalOpen())');

    const openBomStart = runtime.indexOf('function openBomSetupModal()');
    const openBomEnd = runtime.indexOf('function closePageSetupModal()', openBomStart);
    expect(openBomStart).toBeGreaterThan(-1);
    expect(openBomEnd).toBeGreaterThan(openBomStart);
    expect(runtime.slice(openBomStart, openBomEnd)).toContain(
      "if (!canOpenExtraPageSettings(state, 'bom', Boolean(state.model))) return;",
    );

    const openExtraStart = runtime.indexOf('const openExtraPageSettings =');
    const openExtraEnd = runtime.indexOf("for (const [chkId, key] of [", openExtraStart);
    expect(openExtraStart).toBeGreaterThan(-1);
    expect(openExtraEnd).toBeGreaterThan(openExtraStart);
    const openExtraBody = runtime.slice(openExtraStart, openExtraEnd);
    expect(openExtraBody).toContain('if (!canOpenExtraPageSettings(state, kind, Boolean(state.model))) return;');
    expect(openExtraBody).toContain('if (idx < 0) return;');
  });

  it('keeps Step Generation focused on slicing and wires a read-only Import Wizard linking to project-level pages', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // Step Generation modal (#importModal) focuses on slicing — no Wordless controls
    const stepGenStart = html.indexOf('id="importModal"');
    const stepGenEnd = html.indexOf('id="exportModal"', stepGenStart);
    expect(stepGenStart).toBeGreaterThan(-1);
    expect(stepGenEnd).toBeGreaterThan(stepGenStart);
    const stepGenHtml = html.slice(stepGenStart, stepGenEnd);
    expect(stepGenHtml).not.toContain('imp-wordless-btn');
    expect(stepGenHtml).not.toContain('Instruction Language');
    expect(stepGenHtml).toContain('id="impProposalPicker"');
    expect(stepGenHtml).toContain('id="toggleDetectDuplicates"');
    expect(stepGenHtml).toContain('id="impBtnWizardDone"');

    // Wordless toggle lives in Page Setup (#pageSetupModal)
    expect(html).toContain('id="pageSetupWordlessSection"');
    expect(html).toContain('id="pageSetupRangeGroupsSection"');
    expect(html).toContain('id="toggleWordlessMode"');

    // Main Import Wizard modal (#importWizardModal) is read-only (no form inputs) and links to editable pages
    const wizStart = html.indexOf('id="importWizardModal"');
    const wizEnd = html.indexOf('id="importModal"', wizStart);
    expect(wizStart).toBeGreaterThan(-1);
    expect(wizEnd).toBeGreaterThan(wizStart);
    const wizHtml = html.slice(wizStart, wizEnd);
    expect(wizHtml).toContain('id="impWizItemsList"');
    expect(wizHtml).toContain('id="impWizBtnGenerate"');
    expect(wizHtml).not.toContain('<input');
    expect(wizHtml).not.toContain('<select');
    expect(wizHtml).not.toContain('<textarea');

    // Style modal supports wizard chrome, top-left back arrow, and section targeting
    expect(html).toContain('id="styleWizardHeader"');
    expect(html).toContain('id="btnBackStyleWizard"');
    expect(html).toContain('id="styleWizardFooter"');
    expect(html).toContain('id="styleStepDisplaySection"');

    // Page Setup and Step Generation include top-left back arrows for wizard mode & Text & Labels copy
    expect(html).toContain('id="btnBackPageSetupWizard"');
    expect(html).toContain('id="btnBackStepGenWizard"');
    expect(html).toContain('Text &amp; Labels');
    expect(html).not.toContain('Instruction Language');

    // Runtime wires Import Wizard defaults, summary, subpage links, and project-level visibility
    expect(runtime).toContain('getFreshImportWizardDefaults(');
    expect(runtime).toContain('buildImportWizardSummaryItems(');
    expect(runtime).toContain('getWizardSubpageVisibility(');
    expect(runtime).toContain('function openImportWizard(');
    expect(runtime).toContain('function openSlicingFromImportWizard(');
    expect(runtime).toContain('function openStyleFromImportWizard(');
    expect(runtime).toContain('function openPageSetupFromImportWizard(');
    expect(runtime).not.toContain('imp-wordless-btn');
  });

  it('opens Bricks Library Part Preview as a dedicated mobile page without browse filters and hoists color popover to sheet level', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const modalStart = html.indexOf('id="bricksLibraryModal"');
    const modalEnd = html.indexOf('id="shortcutsModal"', modalStart);
    expect(modalStart).toBeGreaterThan(-1);
    expect(modalEnd).toBeGreaterThan(modalStart);
    const modalHtml = html.slice(modalStart, modalEnd);

    expect(modalHtml).toContain('id="libTopTabsBar"');
    expect(modalHtml).toContain('id="libBrowseFiltersBar"');
    expect(modalHtml).toContain('id="libPreviewPane"');
    expect(modalHtml).toContain('id="btnCloseLibPreview"');

    // #libColorPopover must live outside #libBrowseGridWrap so it remains usable on the Part Preview page
    const gridWrapStart = modalHtml.indexOf('id="libBrowseGridWrap"');
    const previewPaneStart = modalHtml.indexOf('id="libPreviewPane"', gridWrapStart);
    const colorPopoverPos = modalHtml.indexOf('id="libColorPopover"');
    expect(gridWrapStart).toBeGreaterThan(-1);
    expect(previewPaneStart).toBeGreaterThan(gridWrapStart);
    expect(colorPopoverPos).toBeGreaterThan(previewPaneStart);

    // Runtime syncs mobile page visibility for tabs, filters, grid, and preview pane
    const syncStart = runtime.indexOf('function syncLibMobilePreviewPageState(');
    const syncEnd = runtime.indexOf('function closeLibPartPreview(', syncStart);
    expect(syncStart).toBeGreaterThan(-1);
    expect(syncEnd).toBeGreaterThan(syncStart);
    const syncBody = runtime.slice(syncStart, syncEnd);
    expect(syncBody).toContain("getElementById('libTopTabsBar')");
    expect(syncBody).toContain("getElementById('libBrowseFiltersBar')");
    expect(syncBody).toContain("getElementById('libBrowseGridWrap')");
    expect(syncBody).toContain("getElementById('libPreviewPane')");
    expect(syncBody).toContain("tabsBar.classList.toggle('hidden', active)");
    expect(syncBody).toContain("filtersBar.classList.toggle('hidden', active)");
    expect(syncBody).toContain("gridWrap.classList.toggle('hidden', active)");
  });

  it('wires the App Settings page with New Manual Defaults, Creator/Cover Defaults, Workspace, Missing Parts, and Reset', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    expect(html).toContain('id="menuSettingsBtn"');
    expect(html).not.toContain('id="menuSettingsSummary"');

    const settingsStart = html.indexOf('id="settingsModal"');
    const settingsEnd = html.indexOf('id="confirmActionModal"', settingsStart);
    expect(settingsStart).toBeGreaterThan(-1);
    expect(settingsEnd).toBeGreaterThan(settingsStart);
    const settingsHtml = html.slice(settingsStart, settingsEnd);

    for (const id of [
      'settingsCustomDefaultsWrap',
      'btnSettingsCopyFromProject',
      'settingsDefTheme',
      'settingsDefPaperFormat',
      'settingsDefCols',
      'settingsDefRows',
      'settingsDefWordless',
      'settingsDefShowCover',
      'settingsDefShowComplete',
      'settingsDefShowPartsList',
      'settingsDefShowBackCover',
      'btnSettingsUploadLogo',
      'btnSettingsClearLogo',
      'settingsDefCoverSubtitle',
      'btnSettingsReset',
      'settingsDoneBtn',
    ]) {
      expect(settingsHtml).toContain(`id="${id}"`);
    }

    expect(settingsHtml).toContain('Never Fetch');
    expect(settingsHtml).not.toContain('Offline Only');
    expect(settingsHtml).not.toContain('Duplicate Submodels');

    expect(runtime).toContain('loadAppSettings()');
    expect(runtime).toContain('resolveImportStartDefaults(');
    expect(runtime).toContain('shouldOpenImportWizard(');
    expect(runtime).toContain('resolveInitialDesktopSideMenuExpanded(');
    expect(runtime).toContain('formatPhysicalDimensionsForUnit(');
    expect(runtime).toContain('function openSettingsModal()');
    expect(runtime).toContain('function closeSettingsModal()');
  });

  it('omits inline summaries and item descriptions from the side menu items', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const menuBodyStart = html.indexOf('id="menuScrollBody"');
    const menuFooterStart = html.indexOf('id="menuDrawerFooter"', menuBodyStart);
    expect(menuBodyStart).toBeGreaterThan(-1);
    expect(menuFooterStart).toBeGreaterThan(menuBodyStart);
    const menuBodyHtml = html.slice(menuBodyStart, menuFooterStart);

    // No paragraph descriptions under side menu items
    expect(menuBodyHtml).not.toContain('<p ');
    expect(menuBodyHtml).not.toContain('<p>');

    // No inline summary elements in side menu buttons
    for (const removedId of [
      'menuPageSetupSummary',
      'menuStyleSummary',
      'menuBomSetupSummary',
      'menuStepGenSummary',
      'libStatusText',
      'menuShortcutsSummary',
      'menuShortcutsHintKey',
      'menuSettingsSummary',
    ]) {
      expect(html).not.toContain(`id="${removedId}"`);
      expect(runtime).not.toContain(`'${removedId}'`);
    }
  });

  it('places minifigures directly without standalone pose steps and uses standing front-facing PLI thumbnails', () => {
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // Neither step-generation pipeline emits standalone isMinifigPoseStep / _mfpose_ steps
    expect(runtime).not.toContain('_mfpose_');
    expect(runtime).not.toContain('isMinifigPoseStep: true');

    // Both HTML page rendering and PDF export use standing front-facing canonicalParts for attachedMinifig thumbs
    const htmlAttStart = runtime.indexOf('const attMfImg = step.attachedMinifig');
    expect(htmlAttStart).toBeGreaterThan(-1);
    const htmlAttChunk = runtime.slice(htmlAttStart, htmlAttStart + 320);
    expect(htmlAttChunk).toContain('step.attachedMinifig.canonicalParts || step.attachedMinifig.previewParts');
    expect(htmlAttChunk).toContain('MINIFIG_BUILD_CAMERA.az');

    const pdfAttStart = runtime.indexOf('const attUrl = getMinifigThumb(');
    expect(pdfAttStart).toBeGreaterThan(-1);
    const pdfAttChunk = runtime.slice(pdfAttStart, pdfAttStart + 260);
    expect(pdfAttChunk).toContain('att.canonicalParts || att.previewParts');
    expect(pdfAttChunk).toContain('MINIFIG_BUILD_CAMERA.az');
  });

  it('renders only the completed 3D hero on Build Complete without a duplicate overlapping minifigure ensemble strip', () => {
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');
    const completeStart = runtime.indexOf("} else if (page.kind === 'complete') {");
    const backStart = runtime.indexOf("} else if (page.kind === 'back') {", completeStart);
    expect(completeStart).toBeGreaterThan(-1);
    expect(backStart).toBeGreaterThan(completeStart);
    const completeChunk = runtime.slice(completeStart, backStart);

    // Minifigures are already placed in allParts; flattening a minifigure chapter's steps
    // would superimpose every origin-normalized minifigure on top of each other.
    expect(completeChunk).not.toContain('ensembleChapters');
    expect(completeChunk).not.toContain('ensembleHtml');
    expect(completeChunk).not.toContain('getMinifigThumb(');
    expect(completeChunk).toContain('renderCoverHeroSnapshot(allParts');
  });

  it('reuses shared snapshotEngine with rAF throttling and iOS GPU memory guards during live step and hero orbit', () => {
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    // Never allocate duplicate WebGL contexts / VBOs for live orbit canvases
    expect(runtime).not.toContain('new WebGLBrickEngine(liveCanvas)');
    expect(runtime).toContain('resolveDeviceGpuBudget()');
    expect(runtime).toContain('computeLiveOrbitRenderSize(');
    expect(runtime).toContain('studioPhotoEngine.releaseTransientBuffers()');

    // Live step orbit must throttle all drags via requestAnimationFrame and use single-tap interactive LOD
    const orbitStart = runtime.indexOf("const liveCanvas = document.getElementById('liveRotateCanvas');");
    const orbitEnd = runtime.indexOf('liveCanvas.onpointercancel = endOrbit;', orbitStart);
    expect(orbitStart).toBeGreaterThan(-1);
    expect(orbitEnd).toBeGreaterThan(orbitStart);
    const orbitBody = runtime.slice(orbitStart, orbitEnd);
    expect(orbitBody).toContain('requestAnimationFrame(');
    expect(orbitBody).toContain("outlineLineWeight: 'light'");
    expect(orbitBody).toContain('activePointerId');
    expect(orbitBody).toContain('snapshotEngine.draw(');
  });

  it('mounts #startupLoadingScreen inside #workspaceArea and wires synchronous session hint restoration', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const wsStart = html.indexOf('id="workspaceArea"');
    const loadingIdx = html.indexOf('id="startupLoadingScreen"', wsStart);
    const stageIdx = html.indexOf('id="stageViewport"', wsStart);
    expect(wsStart).toBeGreaterThan(-1);
    expect(loadingIdx).toBeGreaterThan(wsStart);
    expect(stageIdx).toBeGreaterThan(loadingIdx);
    expect(html).toContain('id="startupLoadingTitle"');
    expect(html).toContain('id="startupLoadingStatus"');
    expect(html).toContain('id="startupLoadingBar"');
    expect(html).toContain('biw.lastModelHint.v1');

    expect(runtime).toContain('readStartupModelHint(');
    expect(runtime).toContain('writeStartupModelHint(');
    expect(runtime).toContain('showStartupLoadingScreen(');
    expect(runtime).toContain('hideStartupLoadingScreen(');
    expect(runtime).toContain('isRestorableModelRecord(');

    // Shared operation loading overlay for model import, manual generation, .biw project import, and side-menu HTML export
    expect(html).toContain('id="operationLoadingOverlay"');
    expect(html).toContain('id="opLoadTitle"');
    expect(html).toContain('id="opLoadStatus"');
    expect(html).toContain('id="opLoadPct"');
    expect(html).toContain('id="opLoadBar"');
    expect(runtime).toContain('showOperationLoadingOverlay(');
    expect(runtime).toContain('hideOperationLoadingOverlay(');
  });

  it('gives the Styles popover a Styles header with Expand/Collapse All, collapsible sections, and widgets moved off section headers', () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf8');
    const runtime = fs.readFileSync(path.resolve(process.cwd(), 'src/studioRuntime.ts'), 'utf8');

    const popStart = html.indexOf('id="stylePopover"');
    const popEnd = html.indexOf('id="overviewModal"', popStart);
    expect(popStart).toBeGreaterThan(-1);
    expect(popEnd).toBeGreaterThan(popStart);
    const styleHtml = html.slice(popStart, popEnd);

    // Styles header with Expand/Collapse All control
    expect(styleHtml).toContain('id="stylePopoverHeader"');
    expect(styleHtml).toContain('>Styles<');
    expect(styleHtml).toContain('id="btnToggleAllStyleSections"');
    expect(styleHtml).toContain('Collapse All');

    // All major sections are collapsible <details class="style-section" ...>
    for (const id of [
      'styleThemesSection',
      'styleThemeIdentitySection',
      'stylePageBgSection',
      'stylePaletteSection',
      'styleTypographySection',
      'styleStepDisplaySection',
      'styleStepFeaturesSection',
      'styleBomSection',
    ]) {
      expect(styleHtml).toContain(`<details id="${id}" class="style-section`);
    }

    // Solid / Gradient is inside Page Background body (after </summary>) and at the top (before themeColorBg)
    const bgStart = styleHtml.indexOf('id="stylePageBgSection"');
    const bgSummaryEnd = styleHtml.indexOf('</summary>', bgStart);
    const bgSolidIdx = styleHtml.indexOf('data-bg-type="solid"', bgStart);
    const bgColorIdx = styleHtml.indexOf('id="themeColorBg"', bgStart);
    expect(bgSummaryEnd).toBeGreaterThan(bgStart);
    expect(bgSolidIdx).toBeGreaterThan(bgSummaryEnd);
    expect(bgColorIdx).toBeGreaterThan(bgSolidIdx);

    // Upload Font is inside Typography body (after </summary>) and at the bottom (after themeFontPickerPanel)
    const typoStart = styleHtml.indexOf('id="styleTypographySection"');
    const typoEnd = styleHtml.indexOf('</details>', typoStart);
    const typoSummaryEnd = styleHtml.indexOf('</summary>', typoStart);
    const fontPickerIdx = styleHtml.indexOf('id="themeFontPickerPanel"', typoStart);
    const uploadFontIdx = styleHtml.indexOf('id="btnUploadCustomFont"', typoStart);
    expect(typoSummaryEnd).toBeGreaterThan(typoStart);
    expect(uploadFontIdx).toBeGreaterThan(fontPickerIdx);
    expect(uploadFontIdx).toBeLessThan(typoEnd);

    // New from Current is inside Themes body (after </summary>) rather than inline in the header
    const themesStart = styleHtml.indexOf('id="styleThemesSection"');
    const themesSummaryEnd = styleHtml.indexOf('</summary>', themesStart);
    const newThemeIdx = styleHtml.indexOf('id="btnNewCustomTheme"', themesStart);
    expect(newThemeIdx).toBeGreaterThan(themesSummaryEnd);

    // Runtime wires Expand/Collapse All toggle
    expect(runtime).toContain('function syncStyleSectionsToggleAllUI(');
    expect(runtime).toContain("setVisible('stylePopoverHeader'");
  });
});
