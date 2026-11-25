// @ts-nocheck
/* eslint-disable */
// Brick Instruction Works — Interactive WebGL Manual Studio Runtime
// Compiled & bundled locally by Vite for GitHub Pages and Neocities deployment.

import {
  analyzeModelSubdivisions,
  classifySubdivisionPartFlags,
  SECTION_PREVIEW_PALETTE,
} from './engine/subdivisionAnalyzer';
import {
  compileDatEntry as compileLDrawDatEntry,
  isDirectRgbColor,
} from './engine/datCompiler';
import {
  extractTexmapTextureNamesFromLines,
  normalizeTextureName,
  textureStore,
} from './engine/textureStore';
import { analyzeMissingParts } from './engine/missingParts';
import {
  PUBLIC_LDRAW_MIRRORS,
  buildMirrorConfigList,
  extractCleanDatTitle,
  extractMovedToTarget,
  fetchLDrawDependencyGraph,
  hasMpdGeometryOrPartLines,
  isLDrawPartSubfile,
  normalizeMpdSubfileKey,
  parseLDrawColorToken,
} from './engine/ldrLibrary';
import {
  classifyDetachedPart,
  computeGroundPlaneY,
} from './engine/floatingCheck';
import {
  acknowledgeDiagnostics,
  deserializeSeenDiagnosticKeys,
  formatMenuIconErrorBadge,
  getMenuIconErrorBadgeCount,
  pruneSeenDiagnosticKeys,
  serializeSeenDiagnosticKeys,
} from './engine/diagnosticsBadge';
import {
  canInsertDividerAfterPage,
  computeMenuVisibility,
} from './engine/menuVisibility';
import { computeScrollJumpVisibility } from './engine/scrollJump';
import {
  computePageNavigationState,
  resolvePageNavigationTarget,
} from './engine/pageNavigation';
import {
  MINIFIG_BUILD_CAMERA,
  MINIFIG_POSE_CAMERA,
  classifyMinifigGroupKind,
  classifyMinifigLeafRole,
  computeMinifigOneToOneLayout,
  extractMinifigureGroups,
  normalizeCompositeThumbPart,
  normalizeMinifigureForBuild,
} from './engine/minifigPose';
import {
  DEFAULT_STUDIO_CAMERA,
  chooseMinifigPlacementCamera,
  computeStudioRotationCue,
} from './engine/minifigCamera';
import {
  chooseStickyStepCamera,
  compareFrontierCandidates,
  computeBoundsFromBoxes,
  computeEvenRunTarget,
  createGroundedPrereqChecker,
  expandBoundsWithBox,
  isCandidateConnectedForStep,
  selectDynamicStepIndices,
} from './engine/dynamicStepSizer';
import {
  computeStepCameraFraming,
  optimizeStudioStepCameraSequence,
  resolveEffectiveStudioStepCue,
  resolveStudioStepCamera,
} from './engine/stepCamera';
import {
  buildPhysicalVerticalPrereqMap,
  minSubBoxGap,
  partsPhysicallyTouch,
  transformLocalBox6ToWorld,
} from './engine/partContact';
import {
  buildMinifigExplodedPlan,
  buildMinifigSequentialPlan,
  normalizeMinifigStepStyle,
  paginateMinifigSequentialStages,
} from './engine/minifigSteps';
import {
  clearAllStepPageBreaks,
  computeHelpTooltipPosition,
  countStepPageBreaks,
  findPageIndexForStep,
  getPageBreakHelpExplanation,
  getStepBreakFeedbackMessage,
  getStepBreakTooltip,
  hasStepPageBreak,
  isStepBreakContinuationSlice,
  toggleStepPageBreakOverride,
} from './engine/pageBreaks';
import {
  computePageSlotRects,
  createDefaultPageLayoutSpec,
  describePageLayoutSpec,
  findLayoutGroupForStep,
  getSpecStepsPerPageCap,
  normalizeLayoutGroups,
  normalizePageLayoutSpec,
  withDerivedStepsPerPage,
} from './engine/pageLayout';
import {
  buildPagePreviewCacheKey,
  buildStepPreviewCacheKey,
  computeOverviewStepSignatures,
  computeOverviewThumbDimensions,
  computeStepPreviewPartSignature,
  createOverviewThumbCache,
  resolveOverviewPagePreviewKind,
} from './engine/overviewPreviews';
import {
  BOM_FIELD_META,
  MAX_BOM_GRID_TRACKS,
  MAX_BOM_TABLE_ROWS,
  MIN_BOM_GRID_TRACKS,
  MIN_BOM_TABLE_ROWS,
  comparePartIdsNatural,
  computeBomCellTypography,
  computeBomTableColumns,
  computeBomTablePlan,
  computeBomTableTypography,
  createDefaultBomConfig,
  formatDisplayPartId,
  getEnabledBomFields,
  isBomFieldEnabled,
  normalizeBomConfig,
  packBomGridPages,
  projectPartDimensionsLdu,
  reorderBomFields,
  resolveBomGridPlan,
  summarizeBomConfig,
  toggleBomField,
} from './engine/partsList';
import {
  CAMERA_ANGLE_PRESETS,
  FOCUS_MODE_OPTIONS,
  MINIFIG_STYLE_OPTIONS,
  PAPER_FORMAT_SPECS,
  applyCameraAngleToStepRange,
  clampStepModelScale,
  clearStepArrangeOverride,
  clearStepCameraOverride,
  computePaperPreviewBox,
  findMatchingCameraPreset,
  getCameraAngleLabel,
  getEditModeButtonLabel,
  getFocusModeDescription,
  getVisibleModeTabs,
  migratePageInsertsToSteps,
  resolveModeForPage,
  resolveStepToolbarCapabilities,
} from './engine/stepToolbar';
import {
  getApplyCameraDestructiveNotice,
  getClearAllPageBreaksDestructiveNotice,
  getCloseModelDestructiveNotice,
  getDeleteDividerDestructiveNotice,
  getDeleteThemeDestructiveNotice,
  getHeroResetCameraDestructiveNotice,
  getLayoutGroupDestructiveNotices,
  getLibraryClearSavedDestructiveNotice,
  getLibraryRemovePartDestructiveNotice,
  getMergeStepDestructiveNotice,
  getPartsActionDestructiveNotices,
  getReplaceModelModalDestructiveNotice,
  getStepGenerationDestructiveNotice,
  getStepResetCameraDestructiveNotice,
  getWordlessToggleDestructiveNotice,
  hasCameraAngleOverride,
  hasCameraFramingOverride,
  hasCameraZoomOverride,
  summarizeManualEdits,
} from './engine/destructiveActions';
import {
  clampRenderDimensions,
  computeCoverHeroRenderSize,
  computeMinifigDiagramRenderSize,
  computePdfPagePixelDimensions,
  computePreviewResolutionScale,
  computeStepSlotRenderSize,
  shouldUpgradeStepRenderForZoom,
} from './engine/stepRenderResolution';
import {
  DEFAULT_EDITOR_URL,
  buildInteractiveHtmlFilename,
  encodeTypedArrayBase64,
  generateInteractiveHtmlDocument,
} from './export/interactiveHtmlExporter';
import {
  BUILT_IN_THEMES,
  BUILT_IN_THEME_IDS,
  THEME_FONTS,
  THEME_FONT_IDS,
  THEME_STYLE_OPTION_KEYS,
  applyThemeBackgroundToElement,
  applyThemeFontsToElement,
  buildThemeBgCss,
  createThemeDraftFromBase,
  ensureThemeFontsLoaded,
  fillThemeBackgroundCanvas,
  getAllThemes,
  getThemeFontStack,
  getThemeStyleOptions,
  loadThemeRecentsFromStorage,
  makeUniqueThemeName,
  loadCustomThemesFromStorage,
  mergeImportedThemes,
  normalizeCustomTheme,
  normalizeThemeStyleOptions,
  orderThemesByRecent,
  parseImportedThemeFile,
  resolveThemeById,
  sanitizeThemeFontId,
  saveCustomThemesToStorage,
  saveThemeRecentsToStorage,
  serializeThemeExport,
  themeCanvasFont,
  themeStyleOptionsEqual,
  toHexColor,
  touchThemeRecent,
} from './themes/customThemes';
import {
  CUSTOM_FILE_MIME_TYPE,
  PROJECT_FILE_EXT,
  PROJECT_FILE_FORMAT,
  PROJECT_FILE_STUDIO_VERSION,
  THEME_FILE_EXT,
  assertProjectFileName,
  buildProjectFileName,
  buildThemeFileName,
  isProjectFileName,
  parseStudioProjectJson,
} from './storage/fileFormats';
import {
  BACK_COVER_CREDIT,
  COVER_MADE_WITH_LABEL,
  COVER_QR_HINT_TEXT,
  PROGRAM_NAME,
  PROGRAM_URL,
  clampCoverElevation,
  clampCoverZoom,
  computeCameraBasis,
  computeCoverLayout,
  computeTightCameraBounds,
  createDefaultBackMeta,
  createDefaultCompleteMeta,
  createDefaultCoverMeta,
  isHeroCameraCustomized,
  normalizeBackMeta,
  normalizeCompleteMeta,
  normalizeCoverMeta,
} from './cover/coverLayout';
import { buildQrSvg, drawQrCanvas } from './cover/qrCode';
import { StudioPhotoRenderer } from './cover/studioPhotoRenderer';
import { buildPdfBinary, canvasRectToPdfLink } from './export/pdfBinary';
import {
  computeCanonicalPageMetrics,
  computePageTypography,
} from './engine/pageTypography';
import {
  ONLINE_STARTER_PACKS,
  buildLibraryColorPalette,
  buildLibraryIndex,
  classifyDatEntryKind,
  computeStarterPackProgress,
  extractFetchablePartIdFromQuery,
  filterLibraryItems,
  formatLibraryMenuSummary,
  getAllStarterPackPartIds,
  getModelFetchCopy,
  isOnlineOnlyItem,
  parsePartIdListInput,
} from './engine/bricksLibrary';
import { loadPartsCatalog } from './engine/partsCatalog';
import {
  assignAbsoluteStepNumbers,
  formatAbsRange,
  formatDualStepLabel,
  getAbsStepNum,
  getChapterAbsRange,
  getSectionAbsRange,
  migrateLegacyLayoutGroups,
} from './engine/stepNumbering';
import {
  DEFAULT_WORDLESS_MODE,
  buildAttachArrowIconSvg,
  buildBrickGlyphSvg,
  buildFlipVerticalIconInnerSvg,
  buildMinifigPoseIconSvg,
  buildNumberedBagSvg,
  buildPartsGridIconSvg,
  buildPoseAdjustIconSvg,
  buildStepHintIconSvg,
  buildStepsBookletIconSvg,
  classifyStepHintAction,
  drawAttachArrowIconCanvas,
  drawBrickGlyphCanvas,
  drawMinifigPoseIconCanvas,
  drawNumberedBagCanvas,
  drawPartsGridIconCanvas,
  drawPoseAdjustIconCanvas,
  drawStepHintIconCanvas,
  drawStepsBookletIconCanvas,
  formatManualPageNumber,
  formatMinifig1to1Header,
  formatMinifigPoseBadgeText,
  getBomTableHeaderText,
  getRotationCueDisplay,
  getWordlessSurfaceDefaults,
  resolveEffectiveBomConfig,
  resolvePageNumberFormatForMode,
} from './engine/wordlessMode';

const BRAND_LOGO_ROTATION_DEG = 12;
const BRAND_LOGO_PATHS: ReadonlyArray<readonly [string, string]> = [
  ['M24.8 7.8 C14.9 14.8 10.1 24.6 11.6 35.3 L14.9 32.7 Q13.9 38.0 13.3 42.8 Q14.6 45.2 15.8 47.2 L18.2 42.8 Q19.8 48.9 21.1 54.7 Q14.1 52.2 6.7 49.4 L13.1 48.9 C9.6 39.9 8.4 32.5 9.8 26.2 Q9.4 20.7 8.7 14.7 L11.7 19.3 Q17.3 12.2 24.8 7.8 Z', '#38bdf8'],
  ['M31.7 7.1 Q34.8 10.1 37.5 15.7 L40.5 12.6 Q39.4 17.0 38.6 21.0 C40.9 31.5 39.2 44.1 37.2 52.6 L43.4 51.6 Q37.7 54.5 32.1 57.0 Q31.0 52.0 30.1 46.7 L33.7 51.3 Q34.4 49.7 35.3 47.6 Q34.4 43.5 33.2 39.1 L36.2 41.6 Q36.7 38.7 37.0 35.4 Q35.0 30.9 32.5 26.0 L36.9 28.4 C36.7 20.4 35.1 12.5 31.7 7.1 Z', '#7c152e'],
  ['M38.5 8.3 C50.8 15.1 56.3 21.9 55.5 33.5 L60.9 30.3 Q57.1 36.0 53.8 41.3 Q53.3 43.4 52.6 45.4 L58.5 45.0 Q51.8 48.7 45.4 51.9 Q46.2 46.3 47.4 40.3 L49.8 43.9 C53.1 37.2 53.7 31.1 52.3 25.6 Q50.1 22.7 47.5 19.6 L50.0 19.8 Q45.5 13.1 38.5 8.3 Z', '#ed7d1f'],
];
const BRAND_LOGO_SVG_BODY = `<g transform="rotate(${BRAND_LOGO_ROTATION_DEG} 32 32)">${BRAND_LOGO_PATHS.map(([d, col]) => `<path d="${d}" fill="${col}"/>`).join('')}</g>`;

let initialized = false;

export function initBrickInstructionCreator(): void {
  if (initialized) return;
  initialized = true;

// =========================================================================
// 1. COLORS, THEMES, PAPER FORMATS & PART CATALOG
// =========================================================================
const COLORS = {
  0:{name:'Black',hex:'#1e2126',edge:'#525864'},
  1:{name:'Blue',hex:'#0055bf',edge:'#002f6c'},
  2:{name:'Green',hex:'#237841',edge:'#144626'},
  3:{name:'Dark Turquoise',hex:'#008f9b',edge:'#00535b'},
  4:{name:'Red',hex:'#c91a09',edge:'#780f05'},
  5:{name:'Dark Pink',hex:'#c870a0',edge:'#7a3d5f'},
  6:{name:'Brown',hex:'#583927',edge:'#332016'},
  7:{name:'Light Gray',hex:'#9ba19d',edge:'#5d625f'},
  8:{name:'Dark Gray',hex:'#6d6e5c',edge:'#3f4035'},
  9:{name:'Light Blue',hex:'#b4d2e3',edge:'#6f93a8'},
  10:{name:'Bright Green',hex:'#4b9f4a',edge:'#295e28'},
  11:{name:'Light Turquoise',hex:'#55a5af',edge:'#2e646b'},
  12:{name:'Salmon',hex:'#f2705e',edge:'#9e3a2d'},
  13:{name:'Pink',hex:'#fc97ac',edge:'#a85466'},
  14:{name:'Yellow',hex:'#f2cd37',edge:'#9e810d'},
  15:{name:'White',hex:'#f6f7f9',edge:'#9aa0a6'},
  17:{name:'Light Green',hex:'#c2dab8',edge:'#739168'},
  18:{name:'Light Yellow',hex:'#fbe696',edge:'#ad9747'},
  19:{name:'Tan',hex:'#e4cd9e',edge:'#947d50'},
  20:{name:'Light Violet',hex:'#c9cae2',edge:'#7f809c'},
  22:{name:'Purple',hex:'#81007b',edge:'#4a0047'},
  23:{name:'Dark Blue-Violet',hex:'#2032b0',edge:'#101a66'},
  25:{name:'Orange',hex:'#fe8a18',edge:'#a15003'},
  26:{name:'Magenta',hex:'#923978',edge:'#541d44'},
  27:{name:'Lime',hex:'#bbe90b',edge:'#6d8a04'},
  28:{name:'Dark Tan',hex:'#958a73',edge:'#595243'},
  29:{name:'Bright Pink',hex:'#e4adc8',edge:'#9c617f'},
  30:{name:'Medium Lavender',hex:'#ac78ba',edge:'#6b4276'},
  31:{name:'Lavender',hex:'#e1d5ed',edge:'#9683ab'},
  33:{name:'Trans-Dark Blue',hex:'#0020a0',edge:'#001155',alpha:0.46},
  34:{name:'Trans-Green',hex:'#237841',edge:'#124223',alpha:0.46},
  35:{name:'Trans-Bright Green',hex:'#56e646',edge:'#2d8723',alpha:0.48},
  36:{name:'Trans-Red',hex:'#c91a09',edge:'#730e04',alpha:0.48},
  37:{name:'Trans-Dark Pink',hex:'#df6695',edge:'#8a3657',alpha:0.48},
  38:{name:'Trans-Neon Orange',hex:'#ff800d',edge:'#9e4a00',alpha:0.50},
  40:{name:'Trans-Black',hex:'#42464f',edge:'#1d2026',alpha:0.42},
  41:{name:'Trans-Light Blue',hex:'#7ec8f2',edge:'#3b7ca3',alpha:0.44},
  42:{name:'Trans-Neon Green',hex:'#d8f030',edge:'#849613',alpha:0.50},
  43:{name:'Trans-Very Lt Blue',hex:'#c1dff0',edge:'#719ab3',alpha:0.42},
  44:{name:'Trans-Light Purple',hex:'#96709f',edge:'#563a5e',alpha:0.46},
  45:{name:'Trans-Pink',hex:'#fc97ac',edge:'#a85466',alpha:0.46},
  46:{name:'Trans-Yellow',hex:'#f5cd2f',edge:'#9c7e09',alpha:0.50},
  47:{name:'Trans-Clear',hex:'#e2ecf5',edge:'#8a99a8',alpha:0.34},
  52:{name:'Trans-Purple',hex:'#a5a5cb',edge:'#5e5e82',alpha:0.46},
  54:{name:'Trans-Neon Yellow',hex:'#dab000',edge:'#826800',alpha:0.48},
  57:{name:'Trans-Orange',hex:'#f08f1c',edge:'#945205',alpha:0.50},
  68:{name:'Very Light Orange',hex:'#f3cf9b',edge:'#a68352'},
  69:{name:'Light Purple',hex:'#cd6298',edge:'#80355b'},
  70:{name:'Reddish Brown',hex:'#582a12',edge:'#2e1406'},
  71:{name:'Light Bluish Gray',hex:'#a0a5a9',edge:'#5c6064'},
  72:{name:'Dark Bluish Gray',hex:'#6c6e68',edge:'#3a3c38'},
  73:{name:'Medium Blue',hex:'#5a93db',edge:'#2e5991'},
  74:{name:'Medium Green',hex:'#73dca1',edge:'#388a5b'},
  77:{name:'Light Pink',hex:'#fecccf',edge:'#b37d81'},
  78:{name:'Light Nougat',hex:'#f6d7b3',edge:'#a88760'},
  80:{name:'Metallic Silver',hex:'#a5a9b4',edge:'#626670'},
  81:{name:'Metallic Green',hex:'#899b5f',edge:'#505c34'},
  82:{name:'Metallic Gold',hex:'#dbac34',edge:'#8a6915'},
  84:{name:'Medium Nougat',hex:'#aa7d55',edge:'#63452a'},
  85:{name:'Dark Purple',hex:'#3f3691',edge:'#211b54'},
  86:{name:'Dark Nougat',hex:'#7c503a',edge:'#452a1d'},
  89:{name:'Royal Blue',hex:'#4c61db',edge:'#25348a'},
  92:{name:'Nougat',hex:'#d09168',edge:'#825335'},
  100:{name:'Light Salmon',hex:'#febabd',edge:'#b06f72'},
  110:{name:'Violet',hex:'#4354a3',edge:'#242f63'},
  112:{name:'Blue-Violet',hex:'#6874ca',edge:'#394282'},
  115:{name:'Medium Lime',hex:'#c7d23c',edge:'#7c8519'},
  118:{name:'Aqua',hex:'#b3d7d1',edge:'#6a8f89'},
  120:{name:'Light Lime',hex:'#d9e4a7',edge:'#8c965c'},
  125:{name:'Light Orange',hex:'#f9ba61',edge:'#a87429'},
  128:{name:'Dark Nougat Alt',hex:'#ad6140',edge:'#66351f'},
  134:{name:'Copper',hex:'#ae7a59',edge:'#66432d'},
  135:{name:'Pearl Light Gray',hex:'#9ca3a8',edge:'#5a6066'},
  142:{name:'Pearl Light Gold',hex:'#dcbe61',edge:'#8c752e'},
  148:{name:'Pearl Dark Gray',hex:'#575857',edge:'#2d2e2d'},
  150:{name:'Pearl Very Light Gray',hex:'#bbbfc2',edge:'#73777a'},
  151:{name:'Very Light Bluish Gray',hex:'#e6e3e0',edge:'#9c9895'},
  178:{name:'Flat Dark Gold',hex:'#b48455',edge:'#6b4b2b'},
  179:{name:'Flat Silver',hex:'#898788',edge:'#4e4d4e'},
  183:{name:'Pearl White',hex:'#f2f3f2',edge:'#9ea19e'},
  191:{name:'Bright Light Orange',hex:'#f8bb3d',edge:'#a37414'},
  212:{name:'Bright Light Blue',hex:'#9fc3e9',edge:'#577ea8'},
  216:{name:'Rust',hex:'#b31004',edge:'#690700'},
  218:{name:'Reddish Lilac',hex:'#8e5597',edge:'#522c59'},
  219:{name:'Lilac',hex:'#564e9d',edge:'#2d275e'},
  222:{name:'Light Purple',hex:'#ee9dc3',edge:'#a3587b'},
  226:{name:'Bright Light Yellow',hex:'#fff03a',edge:'#a69a12'},
  232:{name:'Sky Blue',hex:'#7dbfdd',edge:'#427a94'},
  272:{name:'Dark Blue',hex:'#0a3463',edge:'#041a33'},
  288:{name:'Dark Green',hex:'#184632',edge:'#0b2419'},
  295:{name:'Flamingo Pink',hex:'#ff94c2',edge:'#b0537b'},
  297:{name:'Pearl Gold',hex:'#aa7f2e',edge:'#614613'},
  308:{name:'Dark Brown',hex:'#352100',edge:'#1a1000'},
  313:{name:'Maersk Blue',hex:'#3592c3',edge:'#1b5778'},
  320:{name:'Dark Red',hex:'#720e0f',edge:'#3d0607'},
  321:{name:'Dark Azure',hex:'#078bc9',edge:'#034e73'},
  322:{name:'Medium Azure',hex:'#36aebf',edge:'#1b6570'},
  323:{name:'Light Aqua',hex:'#adc3c0',edge:'#637a77'},
  325:{name:'Lavender Alt',hex:'#cda4de',edge:'#845c94'},
  326:{name:'Yellowish Green',hex:'#dfeea5',edge:'#8e9e53'},
  330:{name:'Olive Green',hex:'#9b9a5a',edge:'#57562d'},
  334:{name:'Chrome Gold',hex:'#bba53d',edge:'#70611b'},
  335:{name:'Sand Red',hex:'#d67572',edge:'#8a413f'},
  351:{name:'Medium Dark Pink',hex:'#f785b1',edge:'#a8476d'},
  353:{name:'Vibrant Coral',hex:'#ff6d77',edge:'#b03b43'},
  366:{name:'Earth Orange',hex:'#fa9c1c',edge:'#a66005'},
  368:{name:'Neon Yellow',hex:'#edff21',edge:'#9aa807'},
  373:{name:'Sand Purple',hex:'#845e84',edge:'#4d334d'},
  378:{name:'Sand Green',hex:'#a0bcac',edge:'#5b7566'},
  379:{name:'Sand Blue',hex:'#6074a1',edge:'#374566'},
  383:{name:'Chrome Silver',hex:'#e0e0e0',edge:'#8c8c8c'},
  450:{name:'Fabuland Brown',hex:'#b67b50',edge:'#6e4629'},
  462:{name:'Medium Orange',hex:'#ffa70b',edge:'#a86800'},
  484:{name:'Dark Orange',hex:'#a95500',edge:'#5e2f00'},
  503:{name:'Very Light Gray',hex:'#e6e3da',edge:'#99968e'},
  // Additional standard LDConfig.ldr rubber, translucent, satin, metallic & modern LEGO colors
  21:{name:'Glow In Dark Opaque',hex:'#e0ffb0',edge:'#8fa66a'},
  32:{name:'Trans-Black IR Lens',hex:'#2b2024',edge:'#140d10',alpha:0.55},
  49:{name:'Trans-Very Light Green',hex:'#c0e8c0',edge:'#6f996f',alpha:0.44},
  114:{name:'Glitter Trans-Dark Pink',hex:'#df6695',edge:'#8a3657',alpha:0.48},
  117:{name:'Glitter Trans-Clear',hex:'#e8f0f7',edge:'#8a99a8',alpha:0.38},
  129:{name:'Glitter Trans-Purple',hex:'#7f66a8',edge:'#463466',alpha:0.48},
  137:{name:'Metal Blue',hex:'#6a7a8a',edge:'#38434f'},
  154:{name:'New Dark Red',hex:'#720e0f',edge:'#3d0607'},
  182:{name:'Trans-Bright Orange',hex:'#f08f1c',edge:'#945205',alpha:0.50},
  231:{name:'Trans-Bright Light Orange',hex:'#fcb76d',edge:'#a87032',alpha:0.50},
  234:{name:'Trans-Fire Yellow',hex:'#fbe890',edge:'#a69444',alpha:0.50},
  256:{name:'Rubber Black',hex:'#212121',edge:'#555860'},
  273:{name:'Rubber Blue',hex:'#0033b2',edge:'#001c66'},
  284:{name:'Trans-Reddish Lilac',hex:'#c281a5',edge:'#784662',alpha:0.48},
  285:{name:'Trans-Light Green',hex:'#7dc291',edge:'#3e784f',alpha:0.46},
  293:{name:'Trans-Light Blue Violet',hex:'#6babeb',edge:'#36689c',alpha:0.46},
  294:{name:'Glow In Dark Trans',hex:'#bdc6ad',edge:'#727a66',alpha:0.62},
  300:{name:'Metallic Copper',hex:'#c27f53',edge:'#734629'},
  324:{name:'Rubber Red',hex:'#c40026',edge:'#6e0015'},
  329:{name:'Glow In Dark White',hex:'#f5f3d7',edge:'#a3a082'},
  339:{name:'Satin Trans-Light Blue',hex:'#68bcc5',edge:'#36767d',alpha:0.52},
  360:{name:'Satin Trans-Clear',hex:'#dce6ee',edge:'#8a99a8',alpha:0.46},
  362:{name:'Satin Trans-Dark Blue',hex:'#155299',edge:'#0a2c54',alpha:0.52},
  363:{name:'Satin Trans-Brown',hex:'#6b5a52',edge:'#382e29',alpha:0.50},
  364:{name:'Satin Trans-Purple',hex:'#845e84',edge:'#4a334a',alpha:0.52},
  365:{name:'Satin Trans-Bright Green',hex:'#56e646',edge:'#2d8723',alpha:0.52},
  367:{name:'Satin Trans-Dark Pink',hex:'#df6695',edge:'#8a3657',alpha:0.52},
  370:{name:'Medium Brown',hex:'#755945',edge:'#423125'},
  371:{name:'Warm Tan',hex:'#cca373',edge:'#80613e'},
  375:{name:'Rubber Light Gray',hex:'#c1c2c1',edge:'#737573'},
  402:{name:'Reddish Orange',hex:'#ca4c0b',edge:'#782b04'},
  406:{name:'Rubber Dark Blue',hex:'#001d68',edge:'#000d33'},
  422:{name:'Sienna Brown',hex:'#915c3c',edge:'#52321e'},
  423:{name:'Umber Brown',hex:'#5e3f33',edge:'#332018'},
  449:{name:'Rubber Purple',hex:'#81007b',edge:'#450042'},
  490:{name:'Rubber Lime',hex:'#d7f000',edge:'#7f8f00'},
  494:{name:'Electric Contact Alloy',hex:'#d0d0d0',edge:'#7c7c7c'},
  495:{name:'Electric Contact Copper',hex:'#ae7a59',edge:'#66432d'},
  496:{name:'Rubber Light Bluish Gray',hex:'#a3a2a4',edge:'#5c5c5e'},
  504:{name:'Rubber Flat Silver',hex:'#898788',edge:'#4e4d4e'},
  511:{name:'Rubber White',hex:'#fafafa',edge:'#9aa0a6'},
};

function resolveColorInfo(colorId) {
  if (COLORS[colorId]) return COLORS[colorId];
  if (typeof colorId === 'number' && isDirectRgbColor(colorId)) {
    const rgb = colorId & 0xffffff;
    const r = (rgb >> 16) & 255, g = (rgb >> 8) & 255, b = rgb & 255;
    const hex = '#' + rgb.toString(16).padStart(6, '0');
    const er = Math.round(r * 0.58), eg = Math.round(g * 0.58), eb = Math.round(b * 0.58);
    const edge = '#' + ((er << 16) | (eg << 8) | eb).toString(16).padStart(6, '0');
    return { name: `RGB ${hex.toUpperCase()}`, hex, edge };
  }
  return null;
}

const THEMES = BUILT_IN_THEMES;
let customThemes = loadCustomThemesFromStorage();

function getActiveTheme() {
  return resolveThemeById(state.themeId, customThemes);
}

function persistCustomThemes() {
  clearTimeout(persistThemesTimer);
  saveCustomThemesToStorage(customThemes);
  if (typeof dbPut === 'function') {
    dbPut('customThemes', customThemes);
  }
}

// Theme recents: the Style dialog strip shows the current theme first, then by last use.
let themeRecents = loadThemeRecentsFromStorage();
let persistThemesTimer = null;
let themeRenderRaf = 0;

function schedulePersistCustomThemes() {
  clearTimeout(persistThemesTimer);
  persistThemesTimer = setTimeout(persistCustomThemes, 300);
}

function scheduleThemeRender() {
  if (themeRenderRaf) return;
  themeRenderRaf = requestAnimationFrame(() => { themeRenderRaf = 0; renderAll(); });
}

/** Mirrors the active theme's step-display style options into `state`. */
function applyActiveThemeStyleToState() {
  const opts = getThemeStyleOptions(getActiveTheme());
  for (const k of THEME_STYLE_OPTION_KEYS) state[k] = opts[k];
}

function noteThemeUsed() {
  if (themeRecents[0] === state.themeId) return;
  themeRecents = touchThemeRecent(themeRecents, state.themeId);
  saveThemeRecentsToStorage(themeRecents);
}

function selectTheme(id) {
  // Commit/abandon an in-progress rename before switching themes.
  const nameEl = document.getElementById('themeNameInput');
  if (nameEl && document.activeElement === nameEl) nameEl.blur();
  state.themeId = resolveThemeById(id, customThemes).id;
  applyActiveThemeStyleToState();
  renderAll();
}

/** Creates (and selects) a new custom theme copied from `base`, with optional overrides. */
function forkThemeIntoCustom(base, overrides = {}) {
  const desired = base.builtIn ? `${base.name} Custom` : `${base.name} Copy`;
  const draft = createThemeDraftFromBase(base, makeUniqueThemeName(desired, getAllThemes(customThemes).map(t => t.name)));
  const normalized = normalizeCustomTheme({ ...draft, ...overrides, id: draft.id }, draft);
  customThemes.push(normalized);
  persistCustomThemes();
  state.themeId = normalized.id;
  applyActiveThemeStyleToState();
  return normalized;
}

/**
 * Applies a partial change to the active theme. Built-in themes are never
 * modified: the first edit forks them into a new custom theme automatically.
 */
function patchActiveTheme(patch, { render = true } = {}) {
  const theme = getActiveTheme();
  if (theme.builtIn || BUILT_IN_THEME_IDS.has(theme.id)) {
    const forked = forkThemeIntoCustom(theme, patch);
    showToast(`Created "${forked.name}" — built-in themes stay unchanged.`);
  } else {
    const idx = customThemes.findIndex(t => t.id === theme.id);
    const normalized = normalizeCustomTheme({ ...theme, ...patch, id: theme.id, updatedAt: new Date().toISOString() }, theme);
    if (!normalized) return;
    const next = { ...normalized, createdAt: theme.createdAt || normalized.createdAt };
    if (idx >= 0) customThemes[idx] = next; else customThemes.push(next);
    schedulePersistCustomThemes();
    applyActiveThemeStyleToState();
  }
  if (render) scheduleThemeRender();
}

/**
 * Updates the active theme's Parts List (`bomConfig`) settings. Built-in themes
 * are automatically forked into a custom theme on the first edit.
 */
function patchBomConfig(partial, { immediate = false } = {}) {
  const cur = normalizeBomConfig(getActiveTheme().bomConfig);
  const next = normalizeBomConfig({ ...cur, ...partial }, cur);
  patchActiveTheme({ bomConfig: next }, { render: !immediate });
  if (immediate) renderAll();
}

/**
 * Migrates pre-theme style options (old session prefs / .biw projects) into the
 * active theme. Built-in themes are forked; custom themes are updated in place.
 */
function adoptLegacyStyleOptions(raw) {
  if (!raw || typeof raw !== 'object') return;
  if (!THEME_STYLE_OPTION_KEYS.some(k => raw[k] !== undefined)) return;
  const theme = getActiveTheme();
  const current = getThemeStyleOptions(theme);
  const legacy = normalizeThemeStyleOptions(raw, current);
  if (themeStyleOptionsEqual(current, legacy)) return;
  patchActiveTheme(legacy, { render: false });
}

async function shareOrDownloadCustomFile(textContent, fileName, sharedMsg, savedMsg) {
  const blob = new Blob([textContent], { type: CUSTOM_FILE_MIME_TYPE });
  const file = new File([blob], fileName, { type: CUSTOM_FILE_MIME_TYPE });
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      showToast(sharedMsg);
      return;
    } catch (_) {
      // Fall back to direct file download if Share Sheet is canceled/unavailable
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  showToast(savedMsg);
}

const PAPER_FORMATS = PAPER_FORMAT_SPECS;

const DENSITY_PAD = {
  compact:  { pad: 12, gap: 8 },
  balanced: { pad: 20, gap: 14 },
  spacious: { pad: 30, gap: 20 },
};

const CORNERS = CAMERA_ANGLE_PRESETS;

const PARTS_CATALOG = {
  // Standard Bricks
  '3005':{name:'Brick 1×1',sx:1,sz:1,h:24,studs:true}, '3004':{name:'Brick 1×2',sx:2,sz:1,h:24,studs:true},
  '3622':{name:'Brick 1×3',sx:3,sz:1,h:24,studs:true}, '3010':{name:'Brick 1×4',sx:4,sz:1,h:24,studs:true},
  '3009':{name:'Brick 1×6',sx:6,sz:1,h:24,studs:true}, '3008':{name:'Brick 1×8',sx:8,sz:1,h:24,studs:true},
  '6111':{name:'Brick 1×10',sx:10,sz:1,h:24,studs:true}, '6112':{name:'Brick 1×12',sx:12,sz:1,h:24,studs:true},
  '3003':{name:'Brick 2×2',sx:2,sz:2,h:24,studs:true}, '3002':{name:'Brick 2×3',sx:3,sz:2,h:24,studs:true},
  '3001':{name:'Brick 2×4',sx:4,sz:2,h:24,studs:true}, '2456':{name:'Brick 2×6',sx:6,sz:2,h:24,studs:true},
  '3007':{name:'Brick 2×8',sx:8,sz:2,h:24,studs:true}, '3006':{name:'Brick 2×10',sx:10,sz:2,h:24,studs:true},
  '2357':{name:'Brick 2×2 Corner',sx:2,sz:2,h:24,studs:true,shape:'corner',studLayout:'corner'},
  '6541':{name:'Technic Brick 1×1',sx:1,sz:1,h:24,studs:true,shape:'technic_brick'},
  '3700':{name:'Technic Brick 1×2',sx:2,sz:1,h:24,studs:true,shape:'technic_brick'},
  '3701':{name:'Technic Brick 1×4',sx:4,sz:1,h:24,studs:true,shape:'technic_brick'},
  '3894':{name:'Technic Brick 1×6',sx:6,sz:1,h:24,studs:true,shape:'technic_brick'},
  // Standard Plates
  '3024':{name:'Plate 1×1',sx:1,sz:1,h:8,studs:true}, '3023':{name:'Plate 1×2',sx:2,sz:1,h:8,studs:true},
  '3623':{name:'Plate 1×3',sx:3,sz:1,h:8,studs:true}, '3710':{name:'Plate 1×4',sx:4,sz:1,h:8,studs:true},
  '3666':{name:'Plate 1×6',sx:6,sz:1,h:8,studs:true}, '3460':{name:'Plate 1×8',sx:8,sz:1,h:8,studs:true},
  '4477':{name:'Plate 1×10',sx:10,sz:1,h:8,studs:true}, '60479':{name:'Plate 1×12',sx:12,sz:1,h:8,studs:true},
  '3022':{name:'Plate 2×2',sx:2,sz:2,h:8,studs:true}, '2420':{name:'Plate 2×2 Corner',sx:2,sz:2,h:8,studs:true,shape:'corner',studLayout:'corner'},
  '3021':{name:'Plate 2×3',sx:3,sz:2,h:8,studs:true}, '3020':{name:'Plate 2×4',sx:4,sz:2,h:8,studs:true},
  '3795':{name:'Plate 2×6',sx:6,sz:2,h:8,studs:true}, '3034':{name:'Plate 2×8',sx:8,sz:2,h:8,studs:true},
  '3832':{name:'Plate 2×10',sx:10,sz:2,h:8,studs:true}, '2445':{name:'Plate 2×12',sx:12,sz:2,h:8,studs:true},
  '3031':{name:'Plate 4×4',sx:4,sz:4,h:8,studs:true}, '3032':{name:'Plate 4×6',sx:6,sz:4,h:8,studs:true},
  '3035':{name:'Plate 4×8',sx:8,sz:4,h:8,studs:true}, '3030':{name:'Plate 4×10',sx:10,sz:4,h:8,studs:true},
  '3029':{name:'Plate 4×12',sx:12,sz:4,h:8,studs:true},
  '3958':{name:'Plate 6×6',sx:6,sz:6,h:8,studs:true}, '3036':{name:'Plate 6×8',sx:8,sz:6,h:8,studs:true},
  '3033':{name:'Plate 6×10',sx:10,sz:6,h:8,studs:true}, '3028':{name:'Plate 6×12',sx:12,sz:6,h:8,studs:true},
  '35480':{name:'Rounded Plate 1×2',sx:2,sz:1,h:8,studs:true,shape:'rounded_plate'},
  '3794':{name:'Jumper Plate 1×2',sx:2,sz:1,h:8,studs:true,studLayout:'center'},
  '15573':{name:'Jumper Plate 1×2',sx:2,sz:1,h:8,studs:true,studLayout:'center'},
  '87580':{name:'Jumper Plate 2×2',sx:2,sz:2,h:8,studs:true,studLayout:'center'},
  '92593':{name:'Plate 1×4 (2 Studs)',sx:4,sz:1,h:8,studs:true,studLayout:'ends'},
  '41740':{name:'Plate 1×4 (2 Studs)',sx:4,sz:1,h:8,studs:true,studLayout:'ends'},
  '32001':{name:'Technic Plate 2×6',sx:6,sz:2,h:8,studs:true,shape:'technic_plate'},
  // Tiles & Grilles
  '3070b':{name:'Tile 1×1',sx:1,sz:1,h:8,studs:false}, '3069b':{name:'Tile 1×2',sx:2,sz:1,h:8,studs:false},
  '63864':{name:'Tile 1×3',sx:3,sz:1,h:8,studs:false}, '2431':{name:'Tile 1×4',sx:4,sz:1,h:8,studs:false},
  '6636':{name:'Tile 1×6',sx:6,sz:1,h:8,studs:false}, '4162':{name:'Tile 1×8',sx:8,sz:1,h:8,studs:false},
  '3068b':{name:'Tile 2×2',sx:2,sz:2,h:8,studs:false}, '26603':{name:'Tile 2×3',sx:3,sz:2,h:8,studs:false},
  '87079':{name:'Tile 2×4',sx:4,sz:2,h:8,studs:false}, '69729':{name:'Tile 2×6',sx:6,sz:2,h:8,studs:false},
  '2412b':{name:'Grille Tile 1×2',sx:2,sz:1,h:8,studs:false,shape:'grille'},
  '25269':{name:'Quarter Round Tile 1×1',sx:1,sz:1,h:8,studs:false,shape:'quarter_round'},
  '98138':{name:'Round Tile 1×1',sx:1,sz:1,h:8,studs:false,shape:'round'}, '14769':{name:'Round Tile 2×2',sx:2,sz:2,h:8,studs:false,shape:'round'},
  '15535':{name:'Round Tile 2×2 w/ Hole',sx:2,sz:2,h:8,studs:false,shape:'round_hole'},
  // Round Bricks & Plates
  '4073':{name:'Round Plate 1×1',sx:1,sz:1,h:8,studs:true,shape:'round'}, '4032':{name:'Round Plate 2×2',sx:2,sz:2,h:8,studs:true,shape:'round'},
  '60474':{name:'Round Plate 4×4',sx:4,sz:4,h:8,studs:true,shape:'round'}, '3062b':{name:'Round Brick 1×1',sx:1,sz:1,h:24,studs:true,shape:'round'},
  '3941':{name:'Round Brick 2×2',sx:2,sz:2,h:24,studs:true,shape:'round'},
  // Slopes, Brackets, Windows, Clips & Modified
  '54200':{name:'Cheese Slope 1×1',sx:1,sz:1,h:16,studs:false,shape:'slope'}, '85984':{name:'Slope 30° 1×2×2/3',sx:2,sz:1,h:16,studs:false,shape:'slope'},
  '3040b':{name:'Slope 45° 2×1',sx:2,sz:1,h:24,studs:true,shape:'slope',topStudsX:1}, '3665':{name:'Inverted Slope 45° 2×1',sx:2,sz:1,h:24,studs:true,shape:'slope_inv'},
  '3039':{name:'Slope 45° 2×2',sx:2,sz:2,h:24,studs:true,shape:'slope',topStudsX:1}, '49307':{name:'Curved Slope 1×1×2/3',sx:1,sz:1,h:16,studs:false,shape:'curved_slope'},
  '4733':{name:'SNOT Brick 1×1 (4 Sides)',sx:1,sz:1,h:24,studs:true,shape:'snot4'}, '87087':{name:'SNOT Brick 1×1 (1 Side)',sx:1,sz:1,h:24,studs:true,shape:'snot1'},
  '99206':{name:'Plate 2×2×2/3 Bracket',sx:2,sz:2,h:16,studs:true,shape:'bracket'}, '44728':{name:'Bracket 1×2 - 2×2',sx:2,sz:2,h:24,studs:true,shape:'bracket'},
  '99780':{name:'Bracket 1×2 - 1×2 Inverted',sx:2,sz:1,h:24,studs:true,shape:'bracket_inv'}, '99781':{name:'Bracket 1×2 - 1×2',sx:2,sz:1,h:24,studs:true,shape:'bracket'},
  '60475b':{name:'Brick 1×1 w/ Vertical Clip',sx:1,sz:1,h:24,studs:true,shape:'clip_h'}, '15712':{name:'Tile 1×1 w/ Clip',sx:1,sz:1,h:8,studs:false,shape:'clip_v'},
  '60470b':{name:'Plate 1×2 with Clips',sx:2,sz:1,h:8,studs:true,shape:'clip_h'}, '6019':{name:'Plate 1×1 with Clip',sx:1,sz:1,h:8,studs:true,shape:'clip_h'},
  '4085d':{name:'Plate 1×1 Vertical Clip',sx:1,sz:1,h:8,studs:false,shape:'clip_v'},
  '60594':{name:'Window Frame 1×4×3',sx:4,sz:1,h:72,studs:true,shape:'window_frame'}, '60593':{name:'Window Frame 1×2×3',sx:2,sz:1,h:72,studs:true,shape:'window_frame'},
  '60603':{name:'Window Glass 1×4×3',sx:4,sz:0.3,h:64,studs:false}, '60601':{name:'Window Glass 1×2×2',sx:2,sz:0.3,h:48,studs:false},
  '4079':{name:'Minifigure Seat 2×2',sx:2,sz:2,h:24,studs:false,shape:'seat'}, '38339':{name:'Train Wheel Holder',sx:2,sz:6,h:24,studs:true,shape:'wheel_holder'},
  '38340':{name:'Train Wheel RC',sx:1,sz:2,h:32,studs:false,shape:'wheel'},
  // Bars & Technic Axles (1:1 Size Guides)
  '30374':{name:'Bar 4L',sx:0.4,sz:0.4,h:80,studs:false,shape:'bar',lengthL:4},
  '63965':{name:'Bar 6L',sx:0.4,sz:0.4,h:120,studs:false,shape:'bar',lengthL:6},
  '3707':{name:'Technic Axle 8L',sx:0.4,sz:0.4,h:160,studs:false,shape:'axle',centered:true,lengthL:8},
  '4519':{name:'Technic Axle 3L',sx:0.4,sz:0.4,h:60,studs:false,shape:'axle',centered:true,lengthL:3},
  '32062':{name:'Technic Axle 2L',sx:0.4,sz:0.4,h:40,studs:false,shape:'axle',centered:true,lengthL:2},
  '3705':{name:'Technic Axle 4L',sx:0.4,sz:0.4,h:80,studs:false,shape:'axle',centered:true,lengthL:4},
  '32073':{name:'Technic Axle 5L',sx:0.4,sz:0.4,h:100,studs:false,shape:'axle',centered:true,lengthL:5},
  '3706':{name:'Technic Axle 6L',sx:0.4,sz:0.4,h:120,studs:false,shape:'axle',centered:true,lengthL:6},
  '3815c01':{name:'Minifigure Hips & Legs',sx:1.6,sz:0.8,h:28,studs:false,shape:'mf_legs'},
  '970c00':{name:'Minifigure Hips & Legs',sx:1.6,sz:0.8,h:28,studs:false,shape:'mf_legs'},
  '973':{name:'Minifigure Torso',sx:1.5,sz:0.75,h:32,studs:false,shape:'mf_torso_body'},
  '973c01':{name:'Minifigure Torso Assembly',sx:1.9,sz:0.8,h:32,studs:false,shape:'mf_torso'},
  '3626':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3626b':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3626c':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3626cp01':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '28621':{name:'Minifigure Head',sx:1,sz:1,h:24,studs:true,shape:'mf_head'},
  '3842a':{name:'Minifigure Helmet',sx:1.2,sz:1.2,h:24,studs:false,shape:'mf_helmet'},
};

// Embedded .dat definitions extracted from Studio .io model2.ldr + User-imported LDraw Library
const embeddedDatRaw = new Map();
const embeddedDatTitles = new Map();
const userLibRaw = new Map();
const userLibTitles = new Map();
const embeddedDatCompiled = new Map();
const movedToAliases = new Map(); // LDraw ~Moved to <target> redirect chains for clean human names
const notFoundDatCache = new Set(); // Session cache of confirmed 404 part IDs to avoid repeat probes
const compositePartDefs = new Map(); // Fused assemblies (e.g., Minifig Torso+Arms+Hands, Hips+Legs)

function normId(raw) {
  return String(raw || '').trim().replace(/\\/g, '/').toLowerCase().replace(/^ldraw\//,'').replace(/^parts\//,'').replace(/^p\//,'').replace(/\.dat$/i,'');
}

// BrickLink Studio un-expanded torso assemblies (bl_973pb*c01, bl_973c*) have their local origin at waist corner
// instead of LDraw 973c01's neck-base origin: shifted by (-20, -32, +10) in LDraw coords.
function isBrickLinkTorsoAssemblyId(k) {
  const clean = normId(k).replace(/-bl$/, '');
  return /^bl_973(?:p[a-z0-9]*)?c\d+[a-z]?$/i.test(clean);
}

// Map BrickLink Studio / decorated / printed part IDs (bl_*, *-bl, *pb####*, *_torso)
// to their canonical unprinted LDraw base IDs so local cache & public LDraw mirrors resolve them!
function getPartIdFallbacks(raw) {
  const k = normId(raw);
  if (!k || k.includes('/')) return [];
  const out = [];
  const add = (id) => { if (id && id !== k && !out.includes(id)) out.push(id); };

  const noBl = k.replace(/^bl_/, '').replace(/-bl$/, '');

  // Minifig bare torso bodies (no arms!) vs complete torso+arms+hands assemblies
  if (/^973.*_torso$/i.test(noBl)) {
    add('973');
    return out;
  }
  if (/^973(?:p[a-z0-9]*)?c\d+[a-z]?$/i.test(noBl) || /^76382(?:p[a-z0-9]*)?(?:c\d+[a-z]?)?$/i.test(noBl)) {
    add('973c01');
    return out;
  }
  if (/^973p[a-z0-9]+$/i.test(noBl)) {
    add('973');
    return out;
  }

  // Strip BrickLink print/sticker suffixes (pb####, ps####, pat####, pr####)
  const noBlPrint = noBl.replace(/(?:pb|ps|pat|pr)\d+[a-z0-9_]*$/i, '');
  if (noBlPrint && noBlPrint !== noBl) {
    add(noBlPrint);
  } else if (noBl !== k) {
    add(noBl);
  }

  // Strip LDraw print/pattern suffix when preceded by a 3+ digit base mold (e.g., 3626cp01 -> 3626c)
  const candBase = noBlPrint || noBl;
  const mLdrawPrint = candBase.match(/^(\d{3,}[a-z]?)(?:p[0-9a-z]{2,}|d\d+)$/i);
  if (mLdrawPrint) add(mLdrawPrint[1]);

  const effective = mLdrawPrint ? mLdrawPrint[1] : candBase;
  if (/^\d{3,}[a-z]$/i.test(effective)) add(effective.slice(0, -1));
  if (/^\d{3,}c\d+$/i.test(effective)) add(effective.replace(/c\d+$/i, ''));

  // Known exact LDraw / BrickLink mold equivalences
  if (effective === '28621') { add('3626c'); add('3626b'); add('3626'); }
  if (effective === '3626c') { add('3626b'); add('3626'); }
  if (/^970c\d+$/i.test(effective)) { add('970c00'); add('3815c01'); }
  if (effective === '970') { add('3815'); }
  if (effective === '971') { add('3816'); }
  if (effective === '972') { add('3817'); }
  if (effective === '3814') { add('973'); }
  if (effective === '981') { add('3819'); }
  if (effective === '982') { add('3818'); }
  if (effective === '983') { add('3820'); }

  return out;
}

// Friendly human-readable names for common BrickLink / Studio & specialty LDraw part IDs
const KNOWN_EXTRA_PART_NAMES = {
  '28621': 'Minifigure Head (Hollow Stud)',
  '29085': 'Train Buffer Beam with Magnet Coupler',
  '29085c01': 'Train Buffer Beam with Magnet Coupler',
  'bb892': 'Powered Up Bluetooth Hub',
  'bb892c01': 'Powered Up Bluetooth Hub',
  '28740': 'Powered Up Train Motor',
  '28740c01': 'Powered Up Train Motor',
  '76925': 'Minifigure Hair / Headgear',
  '26066': 'Minifigure Hair / Headgear',
  '11303': 'Minifigure Hair',
  '66913': 'Minifigure Hair',
  '21778': 'Minifigure Hair',
  '98385': 'Minifigure Hair',
  '15207': 'Panel 1×4×1',
  '14716': 'Brick 1×1×3',
  '86996': 'Brick 1×1×2/3',
  '11477': 'Curved Slope 2×1',
  '41740': 'Plate 1×4 (2 Studs)',
  '15068': 'Curved Slope 2×2×2/3',
  '61976': 'Minifigure Messenger Bag',
  '93091': 'Minifigure Handbag / Purse',
  '93082': 'Minifigure Purse / Handbag',
  '92590': 'Minifigure Backpack / Bag',
  '10169': 'Minifigure Bag with Handle',
  '4449': 'Minifigure Suitcase / Briefcase',
  '24093': 'Minifigure Accessory',
  '3814': 'Minifigure Torso',
  '3815': 'Minifigure Hips',
  '3816': 'Minifigure Leg (Right)',
  '3817': 'Minifigure Leg (Left)',
  '3818': 'Minifigure Arm (Right)',
  '3819': 'Minifigure Arm (Left)',
  '3820': 'Minifigure Hand',
  '970': 'Minifigure Hips',
  '971': 'Minifigure Leg (Right)',
  '972': 'Minifigure Leg (Left)',
  '981': 'Minifigure Arm (Left)',
  '982': 'Minifigure Arm (Right)',
  '983': 'Minifigure Hand',
};

// Bundled Online Parts Catalog (official + unofficial/Studio IDs & titles), loaded lazily on first
// Bricks Library open. Declared here (above getHumanPartName) to avoid TDZ issues during startup.
let onlinePartsCatalog = null;
let onlinePartsCatalogPromise = null;

function getHumanPartName(pid) {
  let k = normId(pid);
  // Follow LDraw `~Moved to <target>` redirect chains (up to 4 hops) for clean official titles
  for (let hop = 0; hop < 4 && movedToAliases.has(k); hop++) {
    const next = movedToAliases.get(k);
    if (!next || next === k) break;
    k = next;
  }
  const isMeaningfulTitle = (t, id) => Boolean(t && !/^~?Moved\s+to\s+/i.test(t) && normId(t) !== normId(id));
  const directTitle = embeddedDatTitles.get(k) || userLibTitles.get(k);
  if (isMeaningfulTitle(directTitle, k)) return directTitle;
  const directCatalog = onlinePartsCatalog?.entries.get(k);
  if (directCatalog && isMeaningfulTitle(directCatalog.name, k) && !/^(?:Part |Printed Part$|Printed BrickLink Studio Part$|BrickLink )/.test(directCatalog.name)) {
    return directCatalog.name;
  }

  const isPrinted = /(?:pb|ps|pat|pr)\d+/i.test(k) || /^\d{3,}[a-z]?p[0-9a-z]{2,}/i.test(k);
  const lookupName = (id) => {
    let cur = id;
    for (let hop = 0; hop < 4 && movedToAliases.has(cur); hop++) {
      const next = movedToAliases.get(cur);
      if (!next || next === cur) break;
      cur = next;
    }
    const t = embeddedDatTitles.get(cur) || userLibTitles.get(cur);
    if (isMeaningfulTitle(t, cur)) return t;
    if (KNOWN_EXTRA_PART_NAMES[cur]) return KNOWN_EXTRA_PART_NAMES[cur];
    if (PARTS_CATALOG[cur]?.name) return PARTS_CATALOG[cur].name;
    const cat = onlinePartsCatalog?.entries.get(cur);
    if (cat && isMeaningfulTitle(cat.name, cur) && !/^(?:Part |Printed Part$|Printed BrickLink Studio Part$|BrickLink )/.test(cat.name)) return cat.name;
    return null;
  };

  let baseName = lookupName(k);
  if (!baseName) {
    for (const fb of getPartIdFallbacks(k)) {
      baseName = lookupName(fb);
      if (baseName) break;
    }
  }
  if (!baseName) {
    const noBl = k.replace(/^bl_/, '').replace(/-bl$/, '');
    baseName = lookupName(noBl) || lookupName(noBl.replace(/[a-z].*$/, ''));
  }
  if (!baseName) {
    if (/^bb\d+/i.test(k)) return 'BrickLink Custom Assembly';
    if (/^bl_/i.test(k)) return isPrinted ? 'Printed BrickLink Studio Part' : 'BrickLink Studio Custom Part';
    if (isPrinted) return 'Printed Part';
    return `Part ${k.toUpperCase()}`;
  }
  if (isPrinted && !/^printed\b/i.test(baseName)) return `Printed ${baseName}`;
  return baseName;
}

function explainMissingPartReason(pid) {
  const k = normId(pid);
  const fbs = getPartIdFallbacks(k);
  const isPrinted = /(?:pb|ps|pat|pr)\d+/i.test(k) || /_torso$/i.test(k);
  const isBlCustom = /^bl_|-bl$/i.test(k);
  const isBbCustom = /^bb\d+/i.test(k);

  if (isPrinted || isBlCustom) {
    if (fbs.length > 0) {
      return `BrickLink Studio ${isPrinted ? 'printed/decorated' : 'custom'} part ID (not in official LDraw). Tap Fetch Online to load it from the LDraw Unofficial & Studio parts mirror (falls back to its unprinted base shape ${fbs[0]}.dat if it isn't hosted), or open the original .io file.`;
    }
    return `BrickLink Studio custom part ID not distributed in standard LDraw mirrors. Open the original Studio .io file to include its exact 3D geometry.`;
  }
  if (isBbCustom) {
    return `BrickLink custom assembly ID (not distributed in standard LDraw mirrors). Open the original Studio .io file to include its 3D geometry.`;
  }
  return `3D geometry for ${k}.dat is not in your saved Bricks Library yet. Tap Fetch Online to download it from the public LDraw library, or import complete.zip.`;
}

function hasKnownShape(pid) {
  const k = normId(pid);
  if (compositePartDefs.has(k)) return true;
  if (compileEmbeddedDat(k)) return true;
  if (PARTS_CATALOG[k]) return true;
  for (const fb of getPartIdFallbacks(k)) {
    if (PARTS_CATALOG[fb]) return true;
  }
  const base = k.replace(/[a-z].*$/, '');
  return Boolean(PARTS_CATALOG[base]);
}

function resolvePart(pid) {
  const k = normId(pid);
  if (compositePartDefs.has(k)) {
    const comp = compositePartDefs.get(k);
    return { name: comp.name, sx: 1.8, sz: 1, h: 28, studs: false };
  }
  const friendly = getHumanPartName(k);
  if (PARTS_CATALOG[k]) return { ...PARTS_CATALOG[k], name: friendly };
  for (const fb of getPartIdFallbacks(k)) {
    if (PARTS_CATALOG[fb]) return { ...PARTS_CATALOG[fb], name: friendly };
  }
  const base = k.replace(/[a-z].*$/, '');
  if (PARTS_CATALOG[base]) return { ...PARTS_CATALOG[base], name: friendly };
  return { name: friendly, sx: 1, sz: 1, h: 24, studs: true };
}

// Detect 1:1 Actual-Size Guide length (in studs / L) for axles, bars, beams
function getActualSizeGuide(pid) {
  const k = normId(pid);
  const cat = PARTS_CATALOG[k] || PARTS_CATALOG[k.replace(/[a-z].*$/, '')];
  if (cat?.lengthL && cat.lengthL >= 2) return { lengthL: cat.lengthL, kind: /axle/i.test(cat.name) ? 'axle' : 'bar' };
  const title = (embeddedDatTitles.get(k) || userLibTitles.get(k) || '').toLowerCase();
  const mAx = title.match(/(?:axle|bar|hose)[^0-9]*(\d+(?:\.\d+)?)\s*l\b/i);
  if (mAx && parseFloat(mAx[1]) >= 2) return { lengthL: parseFloat(mAx[1]), kind: title.includes('axle') ? 'axle' : 'bar' };
  const mBm = title.match(/(?:liftarm|technic,?\s*plate|technic,?\s*brick)[^0-9]*1\s*x\s*(\d+)/i);
  if (mBm && parseInt(mBm[1], 10) >= 3) return { lengthL: parseInt(mBm[1], 10), kind: 'beam' };
  return null;
}

// =========================================================================
// 2. MATH & LOW-MEMORY HIGH-SPEED WEBGL 3D ENGINE (iOS Safari Safe!)
// =========================================================================
const R_ID = [1,0,0, 0,1,0, 0,0,1];
function mat3Mul(a, b) {
  return [
    a[0]*b[0]+a[1]*b[3]+a[2]*b[6], a[0]*b[1]+a[1]*b[4]+a[2]*b[7], a[0]*b[2]+a[1]*b[5]+a[2]*b[8],
    a[3]*b[0]+a[4]*b[3]+a[5]*b[6], a[3]*b[1]+a[4]*b[4]+a[5]*b[7], a[3]*b[2]+a[4]*b[5]+a[5]*b[8],
    a[6]*b[0]+a[7]*b[3]+a[8]*b[6], a[6]*b[1]+a[7]*b[4]+a[8]*b[7], a[6]*b[2]+a[7]*b[5]+a[8]*b[8],
  ];
}
function m3v(m, x, y, z) {
  return [m[0]*x+m[1]*y+m[2]*z, m[3]*x+m[4]*y+m[5]*z, m[6]*x+m[7]*y+m[8]*z];
}
function xformPt(p, m, ox, oy, oz, hingeRad = 0) {
  let [x, y, z] = p;
  if (hingeRad) {
    const c = Math.cos(hingeRad), s = Math.sin(hingeRad);
    const ny = y*c - z*s, nz = y*s + z*c; y = ny; z = nz;
  }
  return [m[0]*x+m[1]*y+m[2]*z+ox, m[3]*x+m[4]*y+m[5]*z+oy, m[6]*x+m[7]*y+m[8]*z+oz];
}
function xformNorm(n, m, hingeRad = 0) {
  let [x, y, z] = n;
  if (hingeRad) {
    const c = Math.cos(hingeRad), s = Math.sin(hingeRad);
    const ny = y*c - z*s, nz = y*s + z*c; y = ny; z = nz;
  }
  const rx = m[0]*x+m[1]*y+m[2]*z, ry = m[3]*x+m[4]*y+m[5]*z, rz = m[6]*x+m[7]*y+m[8]*z;
  const l = Math.hypot(rx, ry, rz) || 1;
  return [rx/l, ry/l, rz/l];
}
function hexToRgb255(hex, fadeMix = 0) {
  const n = parseInt((hex || '#999999').replace('#',''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return [
    Math.round(r * (1 - fadeMix) + 218 * fadeMix),
    Math.round(g * (1 - fadeMix) + 222 * fadeMix),
    Math.round(b * (1 - fadeMix) + 228 * fadeMix),
  ];
}
function lookAtMat4(eye, target, up) {
  let zx = eye[0]-target[0], zy = eye[1]-target[1], zz = eye[2]-target[2];
  let zl = Math.hypot(zx, zy, zz) || 1; zx/=zl; zy/=zl; zz/=zl;
  let xx = up[1]*zz - up[2]*zy, xy = up[2]*zx - up[0]*zz, xz = up[0]*zy - up[1]*zx;
  let xl = Math.hypot(xx, xy, xz) || 1; xx/=xl; xy/=xl; xz/=xl;
  let yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
    -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
    -(zx*eye[0]+zy*eye[1]+zz*eye[2]),
    1,
  ]);
}
function orthoMat4(l, r, b, t, n, f) {
  return new Float32Array([
    2/(r-l), 0, 0, 0,
    0, 2/(t-b), 0, 0,
    0, 0, -2/(f-n), 0,
    -(r+l)/(r-l), -(t+b)/(t-b), -(f+n)/(f-n), 1,
  ]);
}
function mulMat4(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      out[c*4+r] = a[0*4+r]*b[c*4+0] + a[1*4+r]*b[c*4+1] + a[2*4+r]*b[c*4+2] + a[3*4+r]*b[c*4+3];
  return out;
}
function projectWorldToNdc(pt, mvp) {
  const x = mvp[0]*pt[0] + mvp[4]*pt[1] + mvp[8]*pt[2] + mvp[12];
  const y = mvp[1]*pt[0] + mvp[5]*pt[1] + mvp[9]*pt[2] + mvp[13];
  const z = mvp[2]*pt[0] + mvp[6]*pt[1] + mvp[10]*pt[2] + mvp[14];
  const w = mvp[3]*pt[0] + mvp[7]*pt[1] + mvp[11]*pt[2] + mvp[15] || 1;
  return [x/w, y/w, z/w];
}

// Virtual LDraw definitions for Minifig Torso (973) & Torso Assembly (973c01) so un-expanded
// BrickLink Studio torso assemblies (e.g., bl_973pb*c01) immediately reuse real embedded LDraw
// arms (3818/3819), hands (3820), and torso subparts (s/973s01) already present in the model!
const VIRTUAL_973_WITH_SUBPART = [
  '1 16 0 0 0 1 0 0 0 1 0 0 0 1 s/973s01.dat',
  '4 16 -19 32 -10 19 32 -10 19 29 -10 -19 29 -10',
  '4 16 14.345 2 -10 -14.345 2 -10 -19 29 -10 19 29 -10',
  '4 16 12 0 -10 -12 0 -10 -14.345 2 -10 14.345 2 -10',
  '4 16 -19 29 10 19 29 10 19 32 10 -19 32 10',
  '4 16 19 29 10 -19 29 10 -14.345 2 10 14.345 2 10',
  '4 16 14.345 2 10 -14.345 2 10 -12 0 10 12 0 10',
];

const VIRTUAL_973_SOLID = [
  // Front & back tapered torso faces (exact LDraw 973.dat coordinates)
  '4 16 -19 32 -10 19 32 -10 19 29 -10 -19 29 -10',
  '4 16 14.345 2 -10 -14.345 2 -10 -19 29 -10 19 29 -10',
  '4 16 12 0 -10 -12 0 -10 -14.345 2 -10 14.345 2 -10',
  '4 16 -19 29 10 19 29 10 19 32 10 -19 32 10',
  '4 16 19 29 10 -19 29 10 -14.345 2 10 14.345 2 10',
  '4 16 14.345 2 10 -14.345 2 10 -12 0 10 12 0 10',
  // Left & right sides (waist band, sloped torso walls, shoulder bevels)
  '4 16 -19 32 -10 -19 29 -10 -19 29 10 -19 32 10',
  '4 16 -19 29 -10 -14.345 2 -10 -14.345 2 10 -19 29 10',
  '4 16 -14.345 2 -10 -12 0 -10 -12 0 10 -14.345 2 10',
  '4 16 19 32 10 19 29 10 19 29 -10 19 32 -10',
  '4 16 19 29 10 14.345 2 10 14.345 2 -10 19 29 -10',
  '4 16 14.345 2 10 12 0 10 12 0 -10 14.345 2 -10',
  // Shoulder top & waist bottom caps
  '4 16 -12 0 -10 12 0 -10 12 0 10 -12 0 10',
  '4 16 -19 32 10 19 32 10 19 32 -10 -19 32 -10',
  // Neck post (r=6, y=0..-12)
  '1 16 0 0 0 6 0 0 0 -12 0 0 0 6 4-4cyli.dat',
  '1 16 0 -12 0 6 0 0 0 1 0 0 0 6 4-4disc.dat',
  '1 16 0 0 0 6 0 0 0 1 0 0 0 6 4-4edge.dat',
  '1 16 0 -12 0 6 0 0 0 1 0 0 0 6 4-4edge.dat',
  // Clean outer silhouette edges
  '2 24 -19 32 -10 19 32 -10', '2 24 -19 32 10 19 32 10',
  '2 24 -19 32 -10 -19 29 -10', '2 24 19 32 -10 19 29 -10',
  '2 24 -19 32 10 -19 29 10', '2 24 19 32 10 19 29 10',
  '2 24 -19 29 -10 -14.345 2 -10', '2 24 19 29 -10 14.345 2 -10',
  '2 24 -19 29 10 -14.345 2 10', '2 24 19 29 10 14.345 2 10',
  '2 24 -14.345 2 -10 -12 0 -10', '2 24 14.345 2 -10 12 0 -10',
  '2 24 -14.345 2 10 -12 0 10', '2 24 14.345 2 10 12 0 10',
  '2 24 -12 0 -10 12 0 -10', '2 24 -12 0 10 12 0 10',
  '2 24 -19 32 -10 -19 32 10', '2 24 19 32 -10 19 32 10',
  '2 24 -12 0 -10 -12 0 10', '2 24 12 0 -10 12 0 10',
];

const VIRTUAL_973C01_LINES = [
  '1 16 0 0 0 1 0 0 0 1 0 0 0 1 973.dat',
  '1 16 -15.552 9 0 0.985 -0.17 0 0.17 0.985 0 0 0 1 3818.dat',
  '1 16 15.552 9 0 0.985 0.17 0 -0.17 0.985 0 0 0 1 3819.dat',
  '1 14 -23.6904 26.774 -9.8982 0.985 -0.1202 0.1202 0.17 0.6964 -0.6964 0 0.707 0.707 3820.dat',
  '1 14 23.6904 26.774 -9.8982 0.985 0.1202 -0.1202 -0.17 0.6964 -0.6964 0 0.707 0.707 3820.dat',
];

function hasRawDatKey(k) {
  return embeddedDatRaw.has(k) || userLibRaw.has(k);
}

function lookupVirtualMinifigDat(targetKey, offset) {
  if (targetKey === '973c01') {
    if ((hasRawDatKey('3818') || hasRawDatKey('3819')) && hasRawDatKey('3820')) {
      return { key: '973c01', lines: VIRTUAL_973C01_LINES, offset, virtual: true };
    }
    return null;
  }
  if (targetKey === '973') {
    if (hasRawDatKey('s/973s01') || hasRawDatKey('973s01')) {
      return { key: '973', lines: VIRTUAL_973_WITH_SUBPART, offset, virtual: true };
    }
    return { key: '973', lines: VIRTUAL_973_SOLID, offset, virtual: true };
  }
  if (targetKey === '3819' && hasRawDatKey('3818')) {
    return { key: '3819', lines: ['1 16 0 0 0 -1 0 0 0 1 0 0 0 1 3818.dat'], offset, virtual: true };
  }
  if (targetKey === '3818' && hasRawDatKey('3819')) {
    return { key: '3818', lines: ['1 16 0 0 0 -1 0 0 0 1 0 0 0 1 3819.dat'], offset, virtual: true };
  }
  return null;
}

let texReadyRerenderTimer = null;
function scheduleTextureReadyRerender() {
  if (texReadyRerenderTimer) return;
  texReadyRerenderTimer = setTimeout(() => {
    texReadyRerenderTimer = null;
    pliThumbCache.clear();
    submodelThumbCache.clear();
    clearMinifigDiagramCaches();
    coverHeroCache.clear();
    overviewThumbCache.bumpEpoch();
    if (state.model) {
      renderAll();
      if (isOverviewModalOpen()) renderOverviewModal();
    }
  }, 60);
}

// Exact raw .dat lookup (WITHOUT falling back to unprinted base molds like 3626c)
// Used by fetchMissingPartsOnline so printed heads/torsos in .ldr files are fetched even when blank 3626c is cached.
function lookupExactRawDat(ref) {
  const k = normId(ref);
  const stripped = k.replace(/^(48|8|s)\//, '');
  const base = k.split('/').pop();
  const blPrefixed = !k.includes('/') && !k.startsWith('bl_') ? `bl_${k}` : null;
  const blSuffixed = !k.includes('/') && !k.endsWith('-bl') ? `${k}-bl` : null;
  const noBlPrefix = k.startsWith('bl_') ? k.slice(3) : null;
  for (const store of [embeddedDatRaw, userLibRaw]) {
    if (store.has(k)) return { key: k, lines: store.get(k), offset: null };
    if (blPrefixed && store.has(blPrefixed)) return { key: blPrefixed, lines: store.get(blPrefixed), offset: null };
    if (blSuffixed && store.has(blSuffixed)) return { key: blSuffixed, lines: store.get(blSuffixed), offset: null };
    if (noBlPrefix && store.has(noBlPrefix)) return { key: noBlPrefix, lines: store.get(noBlPrefix), offset: null };
    if (store.has(stripped)) return { key: stripped, lines: store.get(stripped), offset: null };
    if (store.has(base)) return { key: base, lines: store.get(base), offset: null };
  }
  return null;
}

// Fast recursive LDraw .dat compiler (checks embedded .io model2.ldr first, then user-imported LDraw Library!)
function lookupEmbeddedDat(ref, allowVirtual = true) {
  const exact = lookupExactRawDat(ref);
  if (exact) return exact;
  const k = normId(ref);
  const fbs = getPartIdFallbacks(k);
  const offset = isBrickLinkTorsoAssemblyId(k) ? [-20, -32, 10] : null;
  if (fbs.length > 0) {
    for (const fb of fbs) {
      for (const store of [embeddedDatRaw, userLibRaw]) {
        if (store.has(fb)) return { key: fb, lines: store.get(fb), offset };
      }
    }
  }
  if (allowVirtual) {
    const directVirt = lookupVirtualMinifigDat(k, null);
    if (directVirt) return directVirt;
    for (const fb of fbs) {
      const fbVirt = lookupVirtualMinifigDat(fb, offset);
      if (fbVirt) return fbVirt;
    }
  }
  return null;
}

function compileDatEntry(found) {
  const res = compileLDrawDatEntry(found, lookupEmbeddedDat, {
    lookupTexture: (texName) => textureStore.lookupByName(texName),
  });
  if (res?.texBatches?.length) {
    for (const tb of res.texBatches) {
      if (tb.base64Png && !textureStore.getRecord(tb.texKey)) {
        textureStore.registerBase64Texture(tb.base64Png, { source: 'embedded' });
      }
      if (!textureStore.getDecodedImage(tb.texKey)) {
        textureStore.decodeTexture(tb.texKey, scheduleTextureReadyRerender);
      }
    }
  }
  return res;
}

function compileEmbeddedDat(partId) {
  const k = normId(partId);
  if (embeddedDatCompiled.has(k)) return embeddedDatCompiled.get(k);
  const found = lookupEmbeddedDat(k);
  let res = found ? compileDatEntry(found) : null;
  // If a direct embedded stub produced 0 triangles (missing subparts), try canonical base fallbacks too
  if (!res) {
    const offset = isBrickLinkTorsoAssemblyId(k) ? [-20, -32, 10] : null;
    for (const fb of getPartIdFallbacks(k)) {
      if (found && found.key === fb) continue;
      const fbFound = lookupEmbeddedDat(fb);
      if (fbFound) {
        res = compileDatEntry(offset ? { ...fbFound, offset } : fbFound);
        if (res) break;
      }
    }
  }
  embeddedDatCompiled.set(k, res);
  return res;
}

// Compact Growable Typed Buffers (eliminates 100MB JS array spikes on iOS!)
class FloatBuf {
  constructor(cap = 4096) { this.d = new Float32Array(cap); this.len = 0; }
  ensure(n) {
    if (this.len + n <= this.d.length) return;
    let nc = this.d.length * 2; while (nc < this.len + n) nc *= 2;
    const nd = new Float32Array(nc); nd.set(this.d.subarray(0, this.len)); this.d = nd;
  }
  push3(a, b, c) { this.ensure(3); const i = this.len; this.d[i]=a; this.d[i+1]=b; this.d[i+2]=c; this.len = i+3; }
  push6(a0,a1, b0,b1, c0,c1) {
    this.ensure(6); const i = this.len, d = this.d;
    d[i]=a0; d[i+1]=a1; d[i+2]=b0; d[i+3]=b1; d[i+4]=c0; d[i+5]=c1;
    this.len = i+6;
  }
  push9(a0,a1,a2, b0,b1,b2, c0,c1,c2) {
    this.ensure(9); const i = this.len, d = this.d;
    d[i]=a0; d[i+1]=a1; d[i+2]=a2; d[i+3]=b0; d[i+4]=b1; d[i+5]=b2; d[i+6]=c0; d[i+7]=c1; d[i+8]=c2;
    this.len = i+9;
  }
  slice() { return this.d.subarray(0, this.len); }
}
class ByteBuf {
  constructor(cap = 4096) { this.d = new Uint8Array(cap); this.len = 0; }
  ensure(n) {
    if (this.len + n <= this.d.length) return;
    let nc = this.d.length * 2; while (nc < this.len + n) nc *= 2;
    const nd = new Uint8Array(nc); nd.set(this.d.subarray(0, this.len)); this.d = nd;
  }
  push4(r, g, b, a) { this.ensure(4); const i = this.len; this.d[i]=r; this.d[i+1]=g; this.d[i+2]=b; this.d[i+3]=a; this.len = i+4; }
  push12(r, g, b, a) {
    this.ensure(12); const i = this.len, d = this.d;
    d[i]=r; d[i+1]=g; d[i+2]=b; d[i+3]=a;
    d[i+4]=r; d[i+5]=g; d[i+6]=b; d[i+7]=a;
    d[i+8]=r; d[i+9]=g; d[i+10]=b; d[i+11]=a;
    this.len = i+12;
  }
  slice() { return this.d.subarray(0, this.len); }
}

function buildMeshBuffers(prevParts, newParts, opts) {
  const totalParts = prevParts.length + newParts.length;
  const includeEdges = totalParts <= 320;
  const opPos = new FloatBuf(totalParts * 180), opNorm = new FloatBuf(totalParts * 180), opCol = new ByteBuf(totalParts * 240);
  const trPos = new FloatBuf(2048), trNorm = new FloatBuf(2048), trCol = new ByteBuf(2048);
  const lnPos = new FloatBuf(totalParts * 60), lnCol = new ByteBuf(totalParts * 80);
  const texGroups = new Map();

  const heroQuality = Boolean(opts.heroQuality);
  const smoothCurves = heroQuality || totalParts <= 320;

  const pushTri = (a, b, c, n, col, aByte) => {
    const isTrans = aByte < 245;
    const P = isTrans ? trPos : opPos, N = isTrans ? trNorm : opNorm, C = isTrans ? trCol : opCol;
    P.push9(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    N.push9(n[0],n[1],n[2], n[0],n[1],n[2], n[0],n[1],n[2]);
    C.push12(col[0], col[1], col[2], aByte);
  };
  const pushTexTri = (texKey, fadeMix, isNewPart, a, b, c, n, uv0, uv1, uv2, col, aByte) => {
    const fadeKey = Math.round(fadeMix * 100);
    const gKey = `${texKey}|${fadeKey}`;
    let g = texGroups.get(gKey);
    if (!g) {
      g = {
        texKey,
        fadeMix,
        pos: new FloatBuf(512),
        norm: new FloatBuf(512),
        uv: new FloatBuf(342),
        col: new ByteBuf(684),
        prevPosEnd: 0,
      };
      texGroups.set(gKey, g);
    }
    if (!isNewPart) g.prevPosEnd = g.pos.len + 9;
    g.pos.push9(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    g.norm.push9(n[0],n[1],n[2], n[0],n[1],n[2], n[0],n[1],n[2]);
    g.uv.push6(uv0[0],uv0[1], uv1[0],uv1[1], uv2[0],uv2[1]);
    g.col.push12(col[0], col[1], col[2], aByte);
  };
  const pushTriSmooth = (a, b, c, na, nb, nc, col, aByte) => {
    const isTrans = aByte < 245;
    const P = isTrans ? trPos : opPos, N = isTrans ? trNorm : opNorm, C = isTrans ? trCol : opCol;
    P.push9(a[0],a[1],a[2], b[0],b[1],b[2], c[0],c[1],c[2]);
    N.push9(na[0],na[1],na[2], nb[0],nb[1],nb[2], nc[0],nc[1],nc[2]);
    C.push12(col[0], col[1], col[2], aByte);
  };
  const pushEdge = (a, b, col, aByte) => {
    lnPos.push3(a[0],a[1],a[2]); lnPos.push3(b[0],b[1],b[2]);
    lnCol.push4(col[0],col[1],col[2],aByte); lnCol.push4(col[0],col[1],col[2],aByte);
  };

  const addBox = (cx, cy, cz, w, h, d, m, ox, oy, oz, hinge, col, eCol, aByte, eAlpha = aByte) => {
    const hw=w/2, hh=h/2, hd=d/2;
    if (heroQuality && hw > 0.6 && hh > 0.6 && hd > 0.6) {
      // Micro-beveled LEGO ABS brick: inset main faces + 12 chamfered 45° edges + 8 corner facets
      // catches realistic glossy studio softbox highlights along every brick seam!
      const b = Math.min(0.48, hw * 0.16, hh * 0.16, hd * 0.16);
      const iw = hw - b, ih = hh - b, id = hd - b;
      const pt = (x, y, z) => xformPt([cx + x, cy + y, cz + z], m, ox, oy, oz, hinge);
      const qFace = (p0, p1, p2, p3, nLocal) => {
        const wn = xformNorm(nLocal, m, hinge);
        pushTri(p0, p1, p2, wn, col, aByte);
        pushTri(p0, p2, p3, wn, col, aByte);
      };
      // 6 inset face quads (4 corners per face)
      const fZ1 = [pt(-iw,-ih, hd), pt( iw,-ih, hd), pt( iw, ih, hd), pt(-iw, ih, hd)];
      const fZ0 = [pt( iw,-ih,-hd), pt(-iw,-ih,-hd), pt(-iw, ih,-hd), pt( iw, ih,-hd)];
      const fY1 = [pt(-iw, hh, id), pt( iw, hh, id), pt( iw, hh,-id), pt(-iw, hh,-id)];
      const fY0 = [pt(-iw,-hh,-id), pt( iw,-hh,-id), pt( iw,-hh, id), pt(-iw,-hh, id)];
      const fX1 = [pt( hw,-ih, id), pt( hw,-ih,-id), pt( hw, ih,-id), pt( hw, ih, id)];
      const fX0 = [pt(-hw,-ih,-id), pt(-hw,-ih, id), pt(-hw, ih, id), pt(-hw, ih,-id)];

      qFace(fZ1[0], fZ1[1], fZ1[2], fZ1[3], [0, 0, 1]);
      qFace(fZ0[0], fZ0[1], fZ0[2], fZ0[3], [0, 0,-1]);
      qFace(fY1[0], fY1[1], fY1[2], fY1[3], [0, 1, 0]);
      qFace(fY0[0], fY0[1], fY0[2], fY0[3], [0,-1, 0]);
      qFace(fX1[0], fX1[1], fX1[2], fX1[3], [1, 0, 0]);
      qFace(fX0[0], fX0[1], fX0[2], fX0[3], [-1, 0, 0]);

      const s2 = 0.70710678;
      const s3 = 0.57735027;
      // 4 top edge bevels
      qFace(fZ1[3], fZ1[2], fY1[1], fY1[0], [0, s2, s2]);
      qFace(fZ0[3], fZ0[2], fY1[3], fY1[2], [0, s2,-s2]);
      qFace(fX1[3], fX1[2], fY1[2], fY1[1], [s2, s2, 0]);
      qFace(fX0[3], fX0[2], fY1[0], fY1[3], [-s2, s2, 0]);
      // 4 bottom edge bevels
      qFace(fY0[3], fY0[2], fZ1[1], fZ1[0], [0,-s2, s2]);
      qFace(fY0[1], fY0[0], fZ0[1], fZ0[0], [0,-s2,-s2]);
      qFace(fY0[2], fY0[1], fX1[1], fX1[0], [s2,-s2, 0]);
      qFace(fY0[0], fY0[3], fX0[1], fX0[0], [-s2,-s2, 0]);
      // 4 vertical edge bevels
      qFace(fZ1[1], fX1[0], fX1[3], fZ1[2], [s2, 0, s2]);
      qFace(fX1[1], fZ0[0], fZ0[3], fX1[2], [s2, 0,-s2]);
      qFace(fZ0[1], fX0[0], fX0[3], fZ0[2], [-s2, 0,-s2]);
      qFace(fX0[1], fZ1[0], fZ1[3], fX0[2], [-s2, 0, s2]);
      // 8 corner bevel triangles
      pushTri(fZ1[2], fX1[3], fY1[1], xformNorm([ s3, s3, s3], m, hinge), col, aByte);
      pushTri(fX1[2], fZ0[3], fY1[2], xformNorm([ s3, s3,-s3], m, hinge), col, aByte);
      pushTri(fZ0[2], fX0[3], fY1[3], xformNorm([-s3, s3,-s3], m, hinge), col, aByte);
      pushTri(fX0[2], fZ1[3], fY1[0], xformNorm([-s3, s3, s3], m, hinge), col, aByte);
      pushTri(fZ1[1], fY0[2], fX1[0], xformNorm([ s3,-s3, s3], m, hinge), col, aByte);
      pushTri(fX1[1], fY0[1], fZ0[0], xformNorm([ s3,-s3,-s3], m, hinge), col, aByte);
      pushTri(fZ0[1], fY0[0], fX0[0], xformNorm([-s3,-s3,-s3], m, hinge), col, aByte);
      pushTri(fX0[1], fY0[3], fZ1[0], xformNorm([-s3,-s3, s3], m, hinge), col, aByte);
      return;
    }

    const v = [
      xformPt([cx-hw,cy-hh,cz+hd],m,ox,oy,oz,hinge), xformPt([cx+hw,cy-hh,cz+hd],m,ox,oy,oz,hinge),
      xformPt([cx+hw,cy+hh,cz+hd],m,ox,oy,oz,hinge), xformPt([cx-hw,cy+hh,cz+hd],m,ox,oy,oz,hinge),
      xformPt([cx-hw,cy-hh,cz-hd],m,ox,oy,oz,hinge), xformPt([cx+hw,cy-hh,cz-hd],m,ox,oy,oz,hinge),
      xformPt([cx+hw,cy+hh,cz-hd],m,ox,oy,oz,hinge), xformPt([cx-hw,cy+hh,cz-hd],m,ox,oy,oz,hinge),
    ];
    const faces = [
      [[0,1,2,3],[0,0,1]], [[5,4,7,6],[0,0,-1]], [[3,2,6,7],[0,1,0]],
      [[4,5,1,0],[0,-1,0]], [[1,5,6,2],[1,0,0]], [[4,0,3,7],[-1,0,0]],
    ];
    for (const [q, n] of faces) {
      const wn = xformNorm(n, m, hinge);
      pushTri(v[q[0]],v[q[1]],v[q[2]], wn, col, aByte);
      pushTri(v[q[0]],v[q[2]],v[q[3]], wn, col, aByte);
    }
    if (includeEdges) {
      for (const [i,j] of [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]])
        pushEdge(v[i], v[j], eCol, eAlpha);
    }
  };

  const addCyl = (cx, cy, cz, rTop, rBot, h, axis, segs, m, ox, oy, oz, hinge, col, eCol, aByte, bevelTop = false) => {
    const effSegs = heroQuality
      ? Math.max(segs, 20)
      : (smoothCurves ? Math.max(segs, Math.max(rTop, rBot) > 7 ? 18 : 14) : segs);
    const hh = h / 2;
    const mk = (u, v, t) => axis === 'y' ? [cx+u,cy+t,cz+v] : axis === 'x' ? [cx+t,cy+u,cz+v] : [cx+u,cy+v,cz+t];
    const mkN = (u, v, t) => xformNorm(axis === 'y' ? [u, t, v] : axis === 'x' ? [t, u, v] : [u, v, t], m, hinge);
    const nTop = xformNorm(axis==='y'?[0,1,0]:axis==='x'?[1,0,0]:[0,0,1], m, hinge);
    const nBot = [-nTop[0], -nTop[1], -nTop[2]];
    const topC = xformPt(mk(0,0,hh), m, ox, oy, oz, hinge);
    const botC = xformPt(mk(0,0,-hh), m, ox, oy, oz, hinge);
    const useBevel = heroQuality && bevelTop && rTop > 1.0 && h > 1.2;
    const bev = useBevel ? Math.min(0.42, rTop * 0.12, h * 0.16) : 0;
    const sideTopY = hh - bev;
    const capR = rTop - bev;
    for (let i = 0; i < effSegs; i++) {
      const a0 = (i/effSegs)*Math.PI*2, a1 = ((i+1)/effSegs)*Math.PI*2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const t0 = xformPt(mk(c0*rTop, s0*rTop, sideTopY), m, ox, oy, oz, hinge);
      const t1 = xformPt(mk(c1*rTop, s1*rTop, sideTopY), m, ox, oy, oz, hinge);
      const b0 = xformPt(mk(c0*rBot, s0*rBot, -hh), m, ox, oy, oz, hinge);
      const b1 = xformPt(mk(c1*rBot, s1*rBot, -hh), m, ox, oy, oz, hinge);
      if (smoothCurves) {
        const sn0 = mkN(c0, s0, 0);
        const sn1 = mkN(c1, s1, 0);
        pushTriSmooth(b0, b1, t1, sn0, sn1, sn1, col, aByte);
        pushTriSmooth(b0, t1, t0, sn0, sn1, sn0, col, aByte);
      } else {
        const am = (a0+a1)/2;
        const sn = mkN(Math.cos(am), Math.sin(am), 0);
        pushTri(b0, b1, t1, sn, col, aByte); pushTri(b0, t1, t0, sn, col, aByte);
      }
      if (useBevel) {
        const ct0 = xformPt(mk(c0*capR, s0*capR, hh), m, ox, oy, oz, hinge);
        const ct1 = xformPt(mk(c1*capR, s1*capR, hh), m, ox, oy, oz, hinge);
        const bn0 = mkN(c0 * 0.7071, s0 * 0.7071, 0.7071);
        const bn1 = mkN(c1 * 0.7071, s1 * 0.7071, 0.7071);
        pushTriSmooth(t0, t1, ct1, bn0, bn1, bn1, col, aByte);
        pushTriSmooth(t0, ct1, ct0, bn0, bn1, bn0, col, aByte);
        pushTri(topC, ct0, ct1, nTop, col, aByte);
      } else {
        if (rTop > 0.05) pushTri(topC, t0, t1, nTop, col, aByte);
      }
      if (rBot > 0.05) pushTri(botC, b1, b0, nBot, col, aByte);
      if (!heroQuality && includeEdges && rTop > 0.05) pushEdge(t0, t1, eCol, aByte);
    }
  };

  // Hollow cylindrical ring / annulus (for round tiles with holes, Technic hole collars, and clips)
  const addAnnulus = (cx, cy, cz, rOut, rIn, h, axis, segs, m, ox, oy, oz, hinge, col, eCol, aByte, startAng = 0, endAng = Math.PI * 2) => {
    const isFull = Math.abs((endAng - startAng) - Math.PI * 2) < 1e-4;
    const effSegs = heroQuality
      ? Math.max(segs, isFull ? 24 : 16)
      : (smoothCurves ? Math.max(segs, isFull ? 18 : 14) : segs);
    const hh = h / 2;
    const mk = (u, v, t) => axis === 'y' ? [cx+u,cy+t,cz+v] : axis === 'x' ? [cx+t,cy+u,cz+v] : [cx+u,cy+v,cz+t];
    const mkN = (u, v, t) => xformNorm(axis === 'y' ? [u, t, v] : axis === 'x' ? [t, u, v] : [u, v, t], m, hinge);
    const nTop = xformNorm(axis==='y'?[0,1,0]:axis==='x'?[1,0,0]:[0,0,1], m, hinge);
    const nBot = [-nTop[0], -nTop[1], -nTop[2]];
    for (let i = 0; i < effSegs; i++) {
      const a0 = startAng + (i / effSegs) * (endAng - startAng);
      const a1 = startAng + ((i + 1) / effSegs) * (endAng - startAng);
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const ot0 = xformPt(mk(c0*rOut, s0*rOut, hh), m, ox, oy, oz, hinge);
      const ot1 = xformPt(mk(c1*rOut, s1*rOut, hh), m, ox, oy, oz, hinge);
      const ob0 = xformPt(mk(c0*rOut, s0*rOut, -hh), m, ox, oy, oz, hinge);
      const ob1 = xformPt(mk(c1*rOut, s1*rOut, -hh), m, ox, oy, oz, hinge);
      const it0 = xformPt(mk(c0*rIn, s0*rIn, hh), m, ox, oy, oz, hinge);
      const it1 = xformPt(mk(c1*rIn, s1*rIn, hh), m, ox, oy, oz, hinge);
      const ib0 = xformPt(mk(c0*rIn, s0*rIn, -hh), m, ox, oy, oz, hinge);
      const ib1 = xformPt(mk(c1*rIn, s1*rIn, -hh), m, ox, oy, oz, hinge);
      if (smoothCurves) {
        const on0 = mkN(c0, s0, 0), on1 = mkN(c1, s1, 0);
        const in0 = mkN(-c0, -s0, 0), in1 = mkN(-c1, -s1, 0);
        pushTriSmooth(ob0, ob1, ot1, on0, on1, on1, col, aByte);
        pushTriSmooth(ob0, ot1, ot0, on0, on1, on0, col, aByte);
        pushTriSmooth(it0, it1, ib1, in0, in1, in1, col, aByte);
        pushTriSmooth(it0, ib1, ib0, in0, in1, in0, col, aByte);
      } else {
        const am = (a0 + a1) / 2;
        const on = mkN(Math.cos(am), Math.sin(am), 0);
        const inn = mkN(-Math.cos(am), -Math.sin(am), 0);
        pushTri(ob0, ob1, ot1, on, col, aByte); pushTri(ob0, ot1, ot0, on, col, aByte);
        pushTri(it0, it1, ib1, inn, col, aByte); pushTri(it0, ib1, ib0, inn, col, aByte);
      }
      pushTri(it0, ot0, ot1, nTop, col, aByte); pushTri(it0, ot1, it1, nTop, col, aByte);
      pushTri(ob0, ib0, ib1, nBot, col, aByte); pushTri(ob0, ib1, ob1, nBot, col, aByte);
      if (!heroQuality && includeEdges) {
        pushEdge(ot0, ot1, eCol, aByte);
        pushEdge(it0, it1, eCol, aByte);
      }
      if (!isFull && i === 0) {
        const capN = mkN(s0, -c0, 0);
        pushTri(ib0, ob0, ot0, capN, col, aByte); pushTri(ib0, ot0, it0, capN, col, aByte);
      }
      if (!isFull && i === effSegs - 1) {
        const capN = mkN(-s1, c1, 0);
        pushTri(ob1, ib1, it1, capN, col, aByte); pushTri(ob1, it1, ot1, capN, col, aByte);
      }
    }
  };

  // Extrude a CCW 2D polygon in the XY plane along Z from z0 to z1 (slopes, curved slopes, wedges)
  const addExtrudedProfile = (pts2D, z0, z1, m, ox, oy, oz, hinge, col, eCol, aByte, eAlpha = aByte, smoothNorms = null) => {
    const nPts = pts2D.length;
    if (nPts < 3) return;
    let cx2 = 0, cy2 = 0;
    for (let i = 0; i < nPts; i++) { cx2 += pts2D[i][0]; cy2 += pts2D[i][1]; }
    cx2 /= nPts; cy2 /= nPts;
    const fCenter = xformPt([cx2, cy2, z1], m, ox, oy, oz, hinge);
    const bCenter = xformPt([cx2, cy2, z0], m, ox, oy, oz, hinge);
    const nFront = xformNorm([0, 0, 1], m, hinge);
    const nBack = xformNorm([0, 0, -1], m, hinge);
    const fPts = pts2D.map(([x, y]) => xformPt([x, y, z1], m, ox, oy, oz, hinge));
    const bPts = pts2D.map(([x, y]) => xformPt([x, y, z0], m, ox, oy, oz, hinge));
    for (let i = 0; i < nPts; i++) {
      const j = (i + 1) % nPts;
      pushTri(fCenter, fPts[i], fPts[j], nFront, col, aByte);
      pushTri(bCenter, bPts[j], bPts[i], nBack, col, aByte);
      const dx = pts2D[j][0] - pts2D[i][0];
      const dy = pts2D[j][1] - pts2D[i][1];
      const len = Math.hypot(dx, dy) || 1;
      const flatN = xformNorm([dy / len, -dx / len, 0], m, hinge);
      if (smoothCurves && smoothNorms && smoothNorms[i] && smoothNorms[j]) {
        const sn0 = xformNorm([smoothNorms[i][0], smoothNorms[i][1], 0], m, hinge);
        const sn1 = xformNorm([smoothNorms[j][0], smoothNorms[j][1], 0], m, hinge);
        pushTriSmooth(fPts[i], bPts[i], bPts[j], sn0, sn0, sn1, col, aByte);
        pushTriSmooth(fPts[i], bPts[j], fPts[j], sn0, sn1, sn1, col, aByte);
      } else {
        pushTri(fPts[i], bPts[i], bPts[j], flatN, col, aByte);
        pushTri(fPts[i], bPts[j], fPts[j], flatN, col, aByte);
      }
      if (!heroQuality && includeEdges) {
        pushEdge(fPts[i], fPts[j], eCol, eAlpha);
        pushEdge(bPts[i], bPts[j], eCol, eAlpha);
        if (!smoothNorms || !smoothNorms[i]) {
          pushEdge(fPts[i], bPts[i], eCol, eAlpha);
        }
      }
    }
  };

  // Arbitrary-direction 3D Arrow (points cleanly from start -> target along ANY 3D vector!)
  const addArrow3D = (s, t, col) => {
    const dx = t[0]-s[0], dy = t[1]-s[1], dz = t[2]-s[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 6) return;
    const ux = dx/len, uy = dy/len, uz = dz/len;
    // Orthonormal basis around arrow axis u
    let rx = Math.abs(uy) < 0.9 ? 0 : 1, ry = Math.abs(uy) < 0.9 ? 1 : 0, rz = 0;
    let bx = uy*rz - uz*ry, by = uz*rx - ux*rz, bz = ux*ry - uy*rx;
    const bl = Math.hypot(bx, by, bz) || 1; bx/=bl; by/=bl; bz/=bl;
    const cx = by*uz - bz*uy, cy = bz*ux - bx*uz, cz = bx*uy - by*ux;

    const headLen = Math.min(12, len * 0.45);
    const shaftEnd = [t[0] - ux*headLen, t[1] - uy*headLen, t[2] - uz*headLen];
    const segs = 10;
    const ring = (center, r, ang) => [
      center[0] + (Math.cos(ang)*bx + Math.sin(ang)*cx)*r,
      center[1] + (Math.cos(ang)*by + Math.sin(ang)*cy)*r,
      center[2] + (Math.cos(ang)*bz + Math.sin(ang)*cz)*r,
    ];
    for (let i = 0; i < segs; i++) {
      const a0 = (i/segs)*Math.PI*2, a1 = ((i+1)/segs)*Math.PI*2;
      const am = (a0+a1)/2;
      const sn = [Math.cos(am)*bx + Math.sin(am)*cx, Math.cos(am)*by + Math.sin(am)*cy, Math.cos(am)*bz + Math.sin(am)*cz];
      // Shaft
      const s0 = ring(s, 1.7, a0), s1 = ring(s, 1.7, a1), e0 = ring(shaftEnd, 1.7, a0), e1 = ring(shaftEnd, 1.7, a1);
      pushTri(s0, s1, e1, sn, col, 255); pushTri(s0, e1, e0, sn, col, 255);
      // Arrowhead cone
      const h0 = ring(shaftEnd, 5.2, a0), h1 = ring(shaftEnd, 5.2, a1);
      pushTri(h0, h1, t, sn, col, 255);
      pushTri(shaftEnd, h1, h0, [-ux,-uy,-uz], col, 255);
    }
  };

  // Curved 3D Rotation Arc Arrow (shows FROM starting pose -> TO target pose around any 3D joint/axis!)
  const addCurvedArrow3D = (ind) => {
    const totalAng = ((ind.angleDeg || 0) * Math.PI) / 180;
    const r = ind.radius || 22;
    if (totalAng < 0.12 || r < 4) return;
    const al = Math.hypot(ind.axis[0], ind.axis[1], ind.axis[2]) || 1;
    const ax = [ind.axis[0] / al, ind.axis[1] / al, ind.axis[2] / al];
    const sd = ind.startDir;
    const d0 = sd[0] * ax[0] + sd[1] * ax[1] + sd[2] * ax[2];
    let u0 = [sd[0] - ax[0] * d0, sd[1] - ax[1] * d0, sd[2] - ax[2] * d0];
    const u0l = Math.hypot(u0[0], u0[1], u0[2]);
    if (u0l < 1e-4) return;
    u0 = [u0[0] / u0l, u0[1] / u0l, u0[2] / u0l];
    const u1 = [
      ax[1] * u0[2] - ax[2] * u0[1],
      ax[2] * u0[0] - ax[0] * u0[2],
      ax[0] * u0[1] - ax[1] * u0[0],
    ];
    const lat = ind.lateralOffset || [0, 0, 0];
    const ctr = [ind.pivot[0] + lat[0], ind.pivot[1] + lat[1], ind.pivot[2] + lat[2]];
    const col = hexToRgb255(ind.color || opts.accent || '#f97316', 0);
    const ink = [24, 34, 48];

    const radAt = (a) => {
      const ca = Math.cos(a), sa = Math.sin(a);
      return [ca * u0[0] + sa * u1[0], ca * u0[1] + sa * u1[1], ca * u0[2] + sa * u1[2]];
    };
    const arcPt = (a, radScale = 1) => {
      const rd = radAt(a);
      return [ctr[0] + rd[0] * r * radScale, ctr[1] + rd[1] * r * radScale, ctr[2] + rd[2] * r * radScale];
    };

    const arcLen = r * totalAng;
    const headLen = Math.min(10.5, Math.max(5.5, arcLen * 0.34));
    const headAng = Math.min(totalAng * 0.42, headLen / Math.max(6, r));
    const shaftEndAng = Math.max(0.05, totalAng - headAng);
    const isBodyYaw = ind.kind === 'body_yaw';
    const tubeR = isBodyYaw ? 1.85 : 2.05;
    const coneR = isBodyYaw ? 5.1 : 5.5;
    const segs = Math.max(10, Math.min(32, Math.ceil(((shaftEndAng * 180) / Math.PI) / 7)));
    const crossSegs = 8;

    // 1. Start anchor marker ("FROM" node at angle = 0)
    const startC = arcPt(0);
    const nodeR = tubeR * 1.75;
    const nodeH = tubeR * 0.95;
    const nodeSegs = 10;
    const nTopC = [startC[0] + ax[0] * nodeH, startC[1] + ax[1] * nodeH, startC[2] + ax[2] * nodeH];
    const nBotC = [startC[0] - ax[0] * nodeH, startC[1] - ax[1] * nodeH, startC[2] - ax[2] * nodeH];
    for (let k = 0; k < nodeSegs; k++) {
      const p0 = (k / nodeSegs) * Math.PI * 2, p1 = ((k + 1) / nodeSegs) * Math.PI * 2, pm = (p0 + p1) / 2;
      const dA = [Math.cos(p0) * u0[0] + Math.sin(p0) * u1[0], Math.cos(p0) * u0[1] + Math.sin(p0) * u1[1], Math.cos(p0) * u0[2] + Math.sin(p0) * u1[2]];
      const dB = [Math.cos(p1) * u0[0] + Math.sin(p1) * u1[0], Math.cos(p1) * u0[1] + Math.sin(p1) * u1[1], Math.cos(p1) * u0[2] + Math.sin(p1) * u1[2]];
      const sn = [Math.cos(pm) * u0[0] + Math.sin(pm) * u1[0], Math.cos(pm) * u0[1] + Math.sin(pm) * u1[1], Math.cos(pm) * u0[2] + Math.sin(pm) * u1[2]];
      const t0 = [nTopC[0] + dA[0] * nodeR, nTopC[1] + dA[1] * nodeR, nTopC[2] + dA[2] * nodeR];
      const t1 = [nTopC[0] + dB[0] * nodeR, nTopC[1] + dB[1] * nodeR, nTopC[2] + dB[2] * nodeR];
      const b0 = [nBotC[0] + dA[0] * nodeR, nBotC[1] + dA[1] * nodeR, nBotC[2] + dA[2] * nodeR];
      const b1 = [nBotC[0] + dB[0] * nodeR, nBotC[1] + dB[1] * nodeR, nBotC[2] + dB[2] * nodeR];
      pushTri(b0, b1, t1, sn, col, 255); pushTri(b0, t1, t0, sn, col, 255);
      pushTri(nTopC, t0, t1, ax, col, 255);
      pushTri(nBotC, b1, b0, [-ax[0], -ax[1], -ax[2]], col, 255);
      pushEdge(t0, t1, ink, 220);
      pushEdge(b0, b1, ink, 220);
    }

    // Crisp start & target reference ticks for whole-body/head turns so "from -> to" is unmistakable
    if (isBodyYaw || ind.kind === 'head') {
      pushEdge(arcPt(0, 0.72), arcPt(0, 0.96), ink, 210);
      pushEdge(arcPt(totalAng, 0.72), arcPt(totalAng, 0.96), col, 240);
    }

    // 2. Smooth 3D curved tube shaft with crisp inner & outer silhouette rails
    const ringAt = (a) => {
      const c = arcPt(a);
      const rd = radAt(a);
      const pts = [];
      const norms = [];
      for (let k = 0; k < crossSegs; k++) {
        const phi = (k / crossSegs) * Math.PI * 2;
        const cp = Math.cos(phi), sp = Math.sin(phi);
        const n = [cp * rd[0] + sp * ax[0], cp * rd[1] + sp * ax[1], cp * rd[2] + sp * ax[2]];
        norms.push(n);
        pts.push([c[0] + n[0] * tubeR, c[1] + n[1] * tubeR, c[2] + n[2] * tubeR]);
      }
      return { pts, norms };
    };

    let prevRing = ringAt(0);
    const halfCross = crossSegs >> 1;
    for (let i = 1; i <= segs; i++) {
      const a = (i / segs) * shaftEndAng;
      const curRing = ringAt(a);
      for (let k = 0; k < crossSegs; k++) {
        const kn = (k + 1) % crossSegs;
        const n = [
          (prevRing.norms[k][0] + prevRing.norms[kn][0] + curRing.norms[k][0] + curRing.norms[kn][0]) * 0.25,
          (prevRing.norms[k][1] + prevRing.norms[kn][1] + curRing.norms[k][1] + curRing.norms[kn][1]) * 0.25,
          (prevRing.norms[k][2] + prevRing.norms[kn][2] + curRing.norms[k][2] + curRing.norms[kn][2]) * 0.25,
        ];
        pushTri(prevRing.pts[k], prevRing.pts[kn], curRing.pts[kn], n, col, 255);
        pushTri(prevRing.pts[k], curRing.pts[kn], curRing.pts[k], n, col, 255);
      }
      pushEdge(prevRing.pts[0], curRing.pts[0], ink, 225);
      pushEdge(prevRing.pts[halfCross], curRing.pts[halfCross], ink, 225);
      prevRing = curRing;
    }

    // 3. Sharp 3D cone arrowhead pointing directly into the target pose ("TO" tip)
    const baseC = arcPt(shaftEndAng);
    const tip = arcPt(totalAng);
    const cdx = tip[0] - baseC[0], cdy = tip[1] - baseC[1], cdz = tip[2] - baseC[2];
    const clen = Math.hypot(cdx, cdy, cdz) || 1;
    const cu = [cdx / clen, cdy / clen, cdz / clen];
    const rdEnd = radAt(shaftEndAng);
    const dEnd = rdEnd[0] * cu[0] + rdEnd[1] * cu[1] + rdEnd[2] * cu[2];
    let b1 = [rdEnd[0] - cu[0] * dEnd, rdEnd[1] - cu[1] * dEnd, rdEnd[2] - cu[2] * dEnd];
    const b1l = Math.hypot(b1[0], b1[1], b1[2]) || 1;
    b1 = [b1[0] / b1l, b1[1] / b1l, b1[2] / b1l];
    const b2 = [
      cu[1] * b1[2] - cu[2] * b1[1],
      cu[2] * b1[0] - cu[0] * b1[2],
      cu[0] * b1[1] - cu[1] * b1[0],
    ];
    const coneSegs = 10;
    const coneRing = (ang) => [
      baseC[0] + (Math.cos(ang) * b1[0] + Math.sin(ang) * b2[0]) * coneR,
      baseC[1] + (Math.cos(ang) * b1[1] + Math.sin(ang) * b2[1]) * coneR,
      baseC[2] + (Math.cos(ang) * b1[2] + Math.sin(ang) * b2[2]) * coneR,
    ];
    for (let k = 0; k < coneSegs; k++) {
      const a0 = (k / coneSegs) * Math.PI * 2, a1 = ((k + 1) / coneSegs) * Math.PI * 2, am = (a0 + a1) / 2;
      const sn = [
        Math.cos(am) * b1[0] + Math.sin(am) * b2[0],
        Math.cos(am) * b1[1] + Math.sin(am) * b2[1],
        Math.cos(am) * b1[2] + Math.sin(am) * b2[2],
      ];
      const h0 = coneRing(a0), h1 = coneRing(a1);
      pushTri(h0, h1, tip, sn, col, 255);
      pushTri(baseC, h1, h0, [-cu[0], -cu[1], -cu[2]], col, 255);
      pushEdge(h0, h1, ink, 225);
    }
    pushEdge(coneRing(0), tip, ink, 225);
    pushEdge(coneRing(Math.PI), tip, ink, 225);
  };

  const addTopStuds = (def, m, ox, oy, oz, hinge, col, eCol, aByte) => {
    if (!def.studs) return;
    const studSegs = heroQuality ? 18 : (totalParts <= 200 ? 14 : totalParts <= 450 ? 10 : 8);
    const emitStud = (x, z) => {
      addCyl(x, 1.8, z, 5.8, 5.8, 4.4, 'y', studSegs, m, ox, oy, oz, hinge, col, eCol, aByte, true);
    };
    if (def.studLayout === 'center') {
      emitStud(0, 0);
      return;
    }
    const topX = def.topStudsX || Math.round(def.sx);
    const sx = Math.round(def.sx), sz = Math.round(def.sz);
    const startX = -((sx - 1) * 20) / 2, startZ = -((sz - 1) * 20) / 2;
    if (def.studLayout === 'ends') {
      emitStud(startX, 0);
      if (sx > 1) emitStud(startX + (sx - 1) * 20, 0);
      return;
    }
    const roundR = def.shape === 'round' ? (def.sx * 20) / 2 - 2.5 : Infinity;
    for (let ix = 0; ix < topX; ix++) {
      for (let iz = 0; iz < sz; iz++) {
        if (def.studLayout === 'corner' && ix === sx - 1 && iz === sz - 1) continue;
        const px = startX + ix * 20;
        const pz = startZ + iz * 20;
        if (def.shape === 'round' && sx >= 4 && Math.hypot(px, pz) + 4.5 > roundR) continue;
        emitStud(px, pz);
      }
    }
  };

  // Tapered arbitrary-axis limb segment (for sculpted minifigure arms & wrists)
  const addLimb = (p0, p1, r0, r1, segs, m, ox, oy, oz, hinge, col, eCol, aByte, capEdges = false) => {
    const effSegs = heroQuality ? Math.max(segs, 14) : (smoothCurves ? Math.max(segs, 12) : segs);
    const dx = p1[0]-p0[0], dy = p1[1]-p0[1], dz = p1[2]-p0[2];
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.1) return;
    const ux = dx/len, uy = dy/len, uz = dz/len;
    const rx = Math.abs(uy) < 0.9 ? 0 : 1, ry = Math.abs(uy) < 0.9 ? 1 : 0, rz = 0;
    let bx = uy*rz - uz*ry, by = uz*rx - ux*rz, bz = ux*ry - uy*rx;
    const bl = Math.hypot(bx, by, bz) || 1; bx/=bl; by/=bl; bz/=bl;
    const cx = by*uz - bz*uy, cy = bz*ux - bx*uz, cz = bx*uy - by*ux;
    const c0 = xformPt(p0, m, ox, oy, oz, hinge);
    const c1 = xformPt(p1, m, ox, oy, oz, hinge);
    const n0 = xformNorm([-ux, -uy, -uz], m, hinge);
    const n1 = xformNorm([ux, uy, uz], m, hinge);
    const ringPt = (center, r, ang) => xformPt([
      center[0] + (Math.cos(ang)*bx + Math.sin(ang)*cx)*r,
      center[1] + (Math.cos(ang)*by + Math.sin(ang)*cy)*r,
      center[2] + (Math.cos(ang)*bz + Math.sin(ang)*cz)*r,
    ], m, ox, oy, oz, hinge);
    const ringNorm = (ang) => xformNorm([
      Math.cos(ang)*bx + Math.sin(ang)*cx,
      Math.cos(ang)*by + Math.sin(ang)*cy,
      Math.cos(ang)*bz + Math.sin(ang)*cz,
    ], m, hinge);
    for (let i = 0; i < effSegs; i++) {
      const a0 = (i/effSegs)*Math.PI*2, a1 = ((i+1)/effSegs)*Math.PI*2, am = (a0+a1)/2;
      const v00 = ringPt(p0, r0, a0), v01 = ringPt(p0, r0, a1);
      const v10 = ringPt(p1, r1, a0), v11 = ringPt(p1, r1, a1);
      if (smoothCurves) {
        const sn0 = ringNorm(a0), sn1 = ringNorm(a1);
        pushTriSmooth(v00, v01, v11, sn0, sn1, sn1, col, aByte);
        pushTriSmooth(v00, v11, v10, sn0, sn1, sn0, col, aByte);
      } else {
        const sn = ringNorm(am);
        pushTri(v00, v01, v11, sn, col, aByte);
        pushTri(v00, v11, v10, sn, col, aByte);
      }
      if (r0 > 0.1) pushTri(c0, v01, v00, n0, col, aByte);
      if (r1 > 0.1) pushTri(c1, v10, v11, n1, col, aByte);
      if (!heroQuality && capEdges && includeEdges) {
        pushEdge(v10, v11, eCol, aByte);
      }
    }
  };

  // Sculpted authentic LEGO minifigure torso (exact LDraw 973.dat trapezoid + optional arms & yellow C-hands)
  const addMinifigTorso = (sh, withArms, m, ox, oy, oz, hinge, col, eCol, handCol, handEdge, aByte) => {
    const [sx, sy, sz] = sh;
    const tp = (x, y, z) => xformPt([sx + x, sy + y, sz + z], m, ox, oy, oz, hinge);
    const quad = (p0, p1, p2, p3, nLocal) => {
      const a = tp(p0[0], p0[1], p0[2]), b = tp(p1[0], p1[1], p1[2]);
      const c = tp(p2[0], p2[1], p2[2]), d = tp(p3[0], p3[1], p3[2]);
      const wn = xformNorm(nLocal, m, hinge);
      pushTri(a, b, c, wn, col, aByte);
      pushTri(a, c, d, wn, col, aByte);
    };
    const edge = (p0, p1) => {
      if (!includeEdges) return;
      pushEdge(tp(p0[0], p0[1], p0[2]), tp(p1[0], p1[1], p1[2]), eCol, aByte);
    };

    // Tapered torso tiers matching LDraw 973.dat (waist y=-32, band y=-29, bevel y=-2, top y=0, depth z=±10)
    const tiers = [
      { y0: -32, w0: 19, y1: -29, w1: 19 },
      { y0: -29, w0: 19, y1: -2,  w1: 14.345 },
      { y0: -2,  w0: 14.345, y1: 0, w1: 12 },
    ];
    for (const t of tiers) {
      // Front (+Z) & Back (-Z)
      quad([-t.w0, t.y0, 10], [t.w0, t.y0, 10], [t.w1, t.y1, 10], [-t.w1, t.y1, 10], [0, 0, 1]);
      quad([t.w0, t.y0, -10], [-t.w0, t.y0, -10], [-t.w1, t.y1, -10], [t.w1, t.y1, -10], [0, 0, -1]);
      // Sloped Left (-X) & Right (+X) walls
      const dy = t.y1 - t.y0, dw = t.w0 - t.w1;
      const nl = Math.hypot(dy, dw) || 1;
      quad([-t.w0, t.y0, -10], [-t.w0, t.y0, 10], [-t.w1, t.y1, 10], [-t.w1, t.y1, -10], [-dy/nl, dw/nl, 0]);
      quad([t.w0, t.y0, 10], [t.w0, t.y0, -10], [t.w1, t.y1, -10], [t.w1, t.y1, 10], [dy/nl, dw/nl, 0]);
    }
    // Top & bottom caps
    quad([-12, 0, 10], [12, 0, 10], [12, 0, -10], [-12, 0, -10], [0, 1, 0]);
    quad([-19, -32, -10], [19, -32, -10], [19, -32, 10], [-19, -32, 10], [0, -1, 0]);
    // Clean outer silhouette edges
    for (const z of [-10, 10]) {
      edge([-19, -32, z], [19, -32, z]);
      edge([-19, -32, z], [-19, -29, z]); edge([19, -32, z], [19, -29, z]);
      edge([-19, -29, z], [-14.345, -2, z]); edge([19, -29, z], [14.345, -2, z]);
      edge([-14.345, -2, z], [-12, 0, z]); edge([14.345, -2, z], [12, 0, z]);
      edge([-12, 0, z], [12, 0, z]);
    }
    edge([-19, -32, -10], [-19, -32, 10]); edge([19, -32, -10], [19, -32, 10]);
    edge([-12, 0, -10], [-12, 0, 10]); edge([12, 0, -10], [12, 0, 10]);
    // Neck post
    addCyl(sx, sy + 5.6, sz, 5.8, 5.8, 11.2, 'y', 12, m, ox, oy, oz, hinge, col, eCol, aByte);

    if (!withArms) return;

    // Sculpted angled LEGO minifigure arms & yellow C-shaped hands (matching LDraw 973c01.dat)
    for (const s of [-1, 1]) {
      // Rounded shoulder cap seated flush against torso slope + upper arm + forward-angled forearm
      addLimb([sx + s*14.6, sy - 9.0, sz], [sx + s*18.6, sy - 9.4, sz], 4.6, 4.7, 10, m, ox, oy, oz, hinge, col, eCol, aByte);
      addLimb([sx + s*18.0, sy - 6.2, sz], [sx + s*18.6, sy - 9.6, sz], 3.4, 4.9, 10, m, ox, oy, oz, hinge, col, eCol, aByte);
      addLimb([sx + s*18.6, sy - 9.4, sz], [sx + s*21.0, sy - 20.6, sz + 0.6], 4.9, 4.6, 10, m, ox, oy, oz, hinge, col, eCol, aByte);
      addLimb([sx + s*21.0, sy - 20.6, sz + 0.6], [sx + s*23.3, sy - 26.4, sz + 9.2], 4.5, 3.8, 10, m, ox, oy, oz, hinge, col, eCol, aByte, true);
      // Wrist pin (yellow)
      addLimb([sx + s*23.3, sy - 26.4, sz + 9.2], [sx + s*23.6, sy - 27.0, sz + 11.4], 2.5, 2.5, 8, m, ox, oy, oz, hinge, handCol, handEdge, aByte);
      // C-shaped LEGO hand claw (250° arc opening forward toward +Z, grip axis tilted slightly forward)
      const hc = [sx + s*23.8, sy - 27.4, sz + 14.0];
      const segs = 8, rOut = 5.4, rIn = 3.2, hh = 3.1;
      // Local hand basis: up axis tilted forward ~18°, forward axis points +Z/-Y
      const ux = 0, uy = 0.951, uz = 0.309;
      const fx = 0, fy = -0.309, fz = 0.951;
      const hpt = (r, ang, hOff) => xformPt([
        hc[0] + Math.sin(ang)*r + ux*hOff,
        hc[1] + Math.cos(ang)*r*fy + uy*hOff,
        hc[2] + Math.cos(ang)*r*fz + uz*hOff,
      ], m, ox, oy, oz, hinge);
      const startA = 0.72, endA = Math.PI * 2 - 0.72;
      const nTop = xformNorm([ux, uy, uz], m, hinge);
      const nBot = xformNorm([-ux, -uy, -uz], m, hinge);
      for (let i = 0; i < segs; i++) {
        const a0 = startA + (i / segs) * (endA - startA);
        const a1 = startA + ((i + 1) / segs) * (endA - startA);
        const am = (a0 + a1) / 2;
        const outN = xformNorm([Math.sin(am), Math.cos(am)*fy, Math.cos(am)*fz], m, hinge);
        const inN = [-outN[0], -outN[1], -outN[2]];
        const ot0 = hpt(rOut, a0, hh), ot1 = hpt(rOut, a1, hh), ob0 = hpt(rOut, a0, -hh), ob1 = hpt(rOut, a1, -hh);
        const it0 = hpt(rIn, a0, hh),  it1 = hpt(rIn, a1, hh),  ib0 = hpt(rIn, a0, -hh),  ib1 = hpt(rIn, a1, -hh);
        pushTri(ob0, ob1, ot1, outN, handCol, aByte); pushTri(ob0, ot1, ot0, outN, handCol, aByte);
        pushTri(it0, it1, ib1, inN, handCol, aByte);  pushTri(it0, ib1, ib0, inN, handCol, aByte);
        pushTri(it0, ot0, ot1, nTop, handCol, aByte); pushTri(it0, ot1, it1, nTop, handCol, aByte);
        pushTri(ob0, ib0, ib1, nBot, handCol, aByte); pushTri(ob0, ib1, ob1, nBot, handCol, aByte);
        if (includeEdges) {
          pushEdge(ot0, ot1, handEdge, aByte);
          pushEdge(ob0, ob1, handEdge, aByte);
        }
        if (i === 0) {
          const capN = xformNorm([-Math.cos(a0), Math.sin(a0)*fy, Math.sin(a0)*fz], m, hinge);
          pushTri(ib0, ob0, ot0, capN, handCol, aByte); pushTri(ib0, ot0, it0, capN, handCol, aByte);
        }
        if (i === segs - 1) {
          const capN = xformNorm([Math.cos(a1), -Math.sin(a1)*fy, -Math.sin(a1)*fz], m, hinge);
          pushTri(ob1, ib1, it1, capN, handCol, aByte); pushTri(ob1, it1, ot1, capN, handCol, aByte);
        }
      }
    }
  };

  const emitSingleLeaf = (leafPart, isNew, isSelected, offX, offY, offZ, hingeRad, parentId = null, isGhost = false) => {
    const def = resolvePart(leafPart.p);
    const cInfo = resolveColorInfo(leafPart.c) || COLORS[71];
    const lookupId = parentId || leafPart.id;
    const overrideHex = isGhost ? null : (opts.partColorOverrides?.[lookupId] || opts.partColorOverrides?.[leafPart.id] || null);
    const isDimmed = !isGhost && Boolean(opts.dimPartIds && (opts.dimPartIds.has(lookupId) || opts.dimPartIds.has(leafPart.id)));
    const isFaded = (!isNew && opts.fadePrev) || isDimmed;
    const isRealTrans = !isGhost && !overrideHex && (cInfo.alpha || 1) < 0.96;
    // Fade solid earlier bricks via clean color muting (NOT alpha transparency with depthMask=false!)
    // so bricks underneath ALWAYS stay properly depth-occluded by plates above them!
    const fadeMix = isGhost
      ? 0.62
      : isDimmed
        ? 0.72
        : isFaded
          ? Math.max(0, Math.min(0.76, (1.0 - opts.fadeOpacity) * 0.95 + (opts.fadeOpacity < 0.99 ? 0.16 : 0)))
          : 0;
    const hasSelectiveHighlight = Boolean(opts.highlightOnlyPartIds);
    const matchesSelectiveHighlight = hasSelectiveHighlight && (opts.highlightOnlyPartIds.has(leafPart.id) || opts.highlightOnlyPartIds.has(lookupId));
    const shouldHighlight = !isGhost && isNew && (
      hasSelectiveHighlight ? matchesSelectiveHighlight : Boolean(opts.highlightNew)
    );
    const hlColorHex = (hasSelectiveHighlight && !opts.highlightNew) ? '#f97316' : (opts.highlightColor || '#f97316');
    const baseHex = overrideHex || cInfo.hex;
    const baseCol = isGhost
      ? hexToRgb255(baseHex, 0.58)
      : isSelected
        ? [26, 115, 232]
        : hexToRgb255(baseHex, fadeMix);
    const edgeCol = isGhost
      ? [51, 65, 85]
      : isSelected
        ? [255, 255, 255]
        : overrideHex
          ? hexToRgb255('#1e293b', isDimmed ? 0.72 : 0.25)
          : (shouldHighlight ? hexToRgb255(hlColorHex, 0) : hexToRgb255(cInfo.edge, fadeMix * 0.85));
    const aByte = isGhost
      ? 82
      : isRealTrans
        ? Math.round(255 * (cInfo.alpha || 0.7) * (isFaded ? Math.max(0.55, opts.fadeOpacity) : 1))
        : 255;
    const edgeAlpha = isGhost ? 185 : aByte;
    const m = leafPart.m || R_ID;
    const ox = leafPart.x + offX, oy = leafPart.y + offY, oz = leafPart.z + offZ;

    const compiled = compileEmbeddedDat(leafPart.p);
    if (compiled) {
      const T = compiled.tris, N = compiled.norms, E = compiled.edges, TC = compiled.triCols;
      const allowSubCols = !isSelected && !overrideHex && !isGhost;
      const subColCache = allowSubCols ? new Map() : null;
      const resolveSubColor = (cid) => {
        if (!subColCache || cid === 16 || cid < 0) return null;
        let cached = subColCache.get(cid);
        if (cached !== undefined) return cached;
        if (isDirectRgbColor(cid)) {
          const r = (cid >> 16) & 255, g = (cid >> 8) & 255, b = cid & 255;
          cached = {
            rgb: [
              Math.round(r * (1 - fadeMix) + 218 * fadeMix),
              Math.round(g * (1 - fadeMix) + 222 * fadeMix),
              Math.round(b * (1 - fadeMix) + 228 * fadeMix),
            ],
            alpha: 255,
          };
        } else if (COLORS[cid]) {
          const sc = COLORS[cid];
          const scTrans = (sc.alpha || 1) < 0.96;
          cached = {
            rgb: hexToRgb255(sc.hex, fadeMix),
            alpha: scTrans ? Math.round(255 * (sc.alpha || 0.7) * (isFaded ? Math.max(0.55, opts.fadeOpacity) : 1)) : 255,
          };
        } else {
          cached = null;
        }
        subColCache.set(cid, cached);
        return cached;
      };
      for (let i = 0, ti = 0; i < T.length; i += 9, ti++) {
        const a = xformPt([T[i],T[i+1],T[i+2]], m, ox, oy, oz, hingeRad);
        const b = xformPt([T[i+3],T[i+4],T[i+5]], m, ox, oy, oz, hingeRad);
        const c = xformPt([T[i+6],T[i+7],T[i+8]], m, ox, oy, oz, hingeRad);
        const n = xformNorm([N[i],N[i+1],N[i+2]], m, hingeRad);
        let triRgb = baseCol;
        let triAlpha = aByte;
        if (TC && subColCache) {
          const sc = resolveSubColor(TC[ti]);
          if (sc) { triRgb = sc.rgb; triAlpha = sc.alpha; }
        }
        pushTri(a, b, c, n, triRgb, triAlpha);
      }
      if (compiled.texBatches && compiled.texBatches.length > 0) {
        const useTextures = !isSelected && !overrideHex && !isGhost;
        for (const tb of compiled.texBatches) {
          const BT = tb.tris, BN = tb.norms, BU = tb.uvs, BTC = tb.triCols;
          for (let i = 0, ui = 0, ti = 0; i < BT.length; i += 9, ui += 6, ti++) {
            const a = xformPt([BT[i],BT[i+1],BT[i+2]], m, ox, oy, oz, hingeRad);
            const b = xformPt([BT[i+3],BT[i+4],BT[i+5]], m, ox, oy, oz, hingeRad);
            const c = xformPt([BT[i+6],BT[i+7],BT[i+8]], m, ox, oy, oz, hingeRad);
            const n = xformNorm([BN[i],BN[i+1],BN[i+2]], m, hingeRad);
            let triRgb = baseCol;
            let triAlpha = aByte;
            if (BTC && subColCache) {
              const sc = resolveSubColor(BTC[ti]);
              if (sc) { triRgb = sc.rgb; triAlpha = sc.alpha; }
            }
            if (useTextures) {
              pushTexTri(
                tb.texKey,
                fadeMix,
                isNew,
                a, b, c, n,
                [BU[ui], BU[ui+1]],
                [BU[ui+2], BU[ui+3]],
                [BU[ui+4], BU[ui+5]],
                triRgb,
                triAlpha,
              );
            } else {
              pushTri(a, b, c, n, triRgb, triAlpha);
            }
          }
        }
      }
      if ((includeEdges || isNew || isSelected || isGhost) && E.length > 0) {
        for (let i = 0; i < E.length; i += 6) {
          const a = xformPt([E[i],E[i+1],E[i+2]], m, ox, oy, oz, hingeRad);
          const b = xformPt([E[i+3],E[i+4],E[i+5]], m, ox, oy, oz, hingeRad);
          pushEdge(a, b, edgeCol, edgeAlpha);
        }
      }
      return;
    }

    const w = def.sx * 20 - 0.5, d = def.sz * 20 - 0.5, h = def.h;
    const holeCol = [
      Math.max(12, Math.round(baseCol[0] * 0.28)),
      Math.max(12, Math.round(baseCol[1] * 0.28)),
      Math.max(12, Math.round(baseCol[2] * 0.28)),
    ];
    if (def.shape === 'bar') {
      addCyl(0, def.centered ? 0 : -h/2, 0, 3.8, 3.8, h, 'y', heroQuality ? 20 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
    } else if (def.shape === 'axle') {
      const cy = def.centered ? 0 : -h/2;
      addBox(0, cy, 0, 7.6, h, 2.5, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(0, cy, 0, 2.5, h, 7.6, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
    } else if (def.shape === 'round') {
      addCyl(0, -h/2, 0, (def.sx*20)/2-0.3, (def.sx*20)/2-0.3, h, 'y', heroQuality ? 24 : 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'round_hole') {
      const rOut = (def.sx * 20) / 2 - 0.3;
      addAnnulus(0, -h/2, 0, rOut, 4.8, h, 'y', heroQuality ? 24 : 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'rounded_plate') {
      const rEnd = d / 2;
      const midW = Math.max(2, w - d);
      addBox(0, -h/2, 0, midW, h, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addCyl(-midW/2, -h/2, 0, rEnd, rEnd, h, 'y', heroQuality ? 20 : 12, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addCyl(midW/2, -h/2, 0, rEnd, rEnd, h, 'y', heroQuality ? 20 : 12, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'quarter_round') {
      // True 90° quarter-circle tile extrusion in XZ plane (center at back-left corner)
      const segs = heroQuality ? 14 : 8;
      const ox0 = -w / 2, oz0 = -d / 2, r = Math.min(w, d);
      const nTop = xformNorm([0, 1, 0], m, hingeRad);
      const nBot = xformNorm([0, -1, 0], m, hingeRad);
      const cTop = xformPt([ox0, 0, oz0], m, ox, oy, oz, hingeRad);
      const cBot = xformPt([ox0, -h, oz0], m, ox, oy, oz, hingeRad);
      const pTop = (ang) => xformPt([ox0 + Math.cos(ang)*r, 0, oz0 + Math.sin(ang)*r], m, ox, oy, oz, hingeRad);
      const pBot = (ang) => xformPt([ox0 + Math.cos(ang)*r, -h, oz0 + Math.sin(ang)*r], m, ox, oy, oz, hingeRad);
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * (Math.PI / 2), a1 = ((i + 1) / segs) * (Math.PI / 2);
        const t0 = pTop(a0), t1 = pTop(a1), b0 = pBot(a0), b1 = pBot(a1);
        pushTri(cTop, t1, t0, nTop, baseCol, aByte);
        pushTri(cBot, b0, b1, nBot, baseCol, aByte);
        if (heroQuality) {
          const sn0 = xformNorm([Math.cos(a0), 0, Math.sin(a0)], m, hingeRad);
          const sn1 = xformNorm([Math.cos(a1), 0, Math.sin(a1)], m, hingeRad);
          pushTriSmooth(b0, b1, t1, sn0, sn1, sn1, baseCol, aByte);
          pushTriSmooth(b0, t1, t0, sn0, sn1, sn0, baseCol, aByte);
        } else {
          const am = (a0 + a1) / 2;
          const sn = xformNorm([Math.cos(am), 0, Math.sin(am)], m, hingeRad);
          pushTri(b0, b1, t1, sn, baseCol, aByte);
          pushTri(b0, t1, t0, sn, baseCol, aByte);
          if (includeEdges) { pushEdge(t0, t1, edgeCol, edgeAlpha); pushEdge(b0, b1, edgeCol, edgeAlpha); }
        }
      }
      // Two straight radial walls along -Z and -X
      const tStart = pTop(0), bStart = pBot(0), tEnd = pTop(Math.PI / 2), bEnd = pBot(Math.PI / 2);
      const nBackZ = xformNorm([0, 0, -1], m, hingeRad);
      const nBackX = xformNorm([-1, 0, 0], m, hingeRad);
      pushTri(cBot, bStart, tStart, nBackZ, baseCol, aByte); pushTri(cBot, tStart, cTop, nBackZ, baseCol, aByte);
      pushTri(cBot, cTop, tEnd, nBackX, baseCol, aByte); pushTri(cBot, tEnd, bEnd, nBackX, baseCol, aByte);
      if (!heroQuality && includeEdges) {
        pushEdge(cTop, tStart, edgeCol, edgeAlpha); pushEdge(cTop, tEnd, edgeCol, edgeAlpha);
        pushEdge(cBot, bStart, edgeCol, edgeAlpha); pushEdge(cBot, bEnd, edgeCol, edgeAlpha);
        pushEdge(cBot, cTop, edgeCol, edgeAlpha); pushEdge(bStart, tStart, edgeCol, edgeAlpha); pushEdge(bEnd, tEnd, edgeCol, edgeAlpha);
      }
    } else if (def.shape === 'corner') {
      // Authentic L-shaped 2×2 corner brick/plate (3 quadrants)
      const armW = w / 2 - 0.1, armD = d / 2 - 0.1;
      addBox(0, -h/2, -d/4, w, h, d/2, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(-w/4, -h/2, d/4, armW, h, armD, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'grille') {
      // Base rim + 4 parallel raised grille slats with open air gaps
      addBox(0, -h + 1.5, 0, w, 3.0, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(0, -h/2, -d/2 + 2.2, w, h, 4.4, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(0, -h/2,  d/2 - 2.2, w, h, 4.4, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      const slats = 4;
      const span = w - 8;
      for (let i = 0; i < slats; i++) {
        const sxPos = -span / 2 + (i / (slats - 1)) * span;
        addBox(sxPos, -h/2, 0, 4.2, h, d - 2.0, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      }
    } else if (def.shape === 'technic_brick') {
      addBox(0, -h/2, 0, w, h, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      const sxCount = Math.round(def.sx);
      const holeCount = sxCount <= 1 ? 1 : sxCount - 1;
      const holeY = -13.6;
      const startHX = holeCount <= 1 ? 0 : -((holeCount - 1) * 20) / 2;
      for (let i = 0; i < holeCount; i++) {
        const hx = startHX + i * 20;
        for (const zs of [-1, 1]) {
          addAnnulus(hx, holeY, zs * (d/2 + 0.12), 6.2, 4.6, 0.9, 'z', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
          addCyl(hx, holeY, zs * (d/2 + 0.04), 4.6, 4.6, 0.4, 'z', heroQuality ? 16 : 10, m,ox,oy,oz,hingeRad,holeCol,edgeCol,aByte);
        }
      }
    } else if (def.shape === 'technic_plate') {
      addBox(0, -h/2, 0, w, h, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      const holeCount = Math.max(1, Math.round(def.sx) - 1);
      const startHX = -((holeCount - 1) * 20) / 2;
      for (let i = 0; i < holeCount; i++) {
        const hx = startHX + i * 20;
        addAnnulus(hx, 0.15, 0, 5.6, 4.3, 0.7, 'y', heroQuality ? 16 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
        addCyl(hx, 0.08, 0, 4.3, 4.3, 0.4, 'y', heroQuality ? 16 : 10, m,ox,oy,oz,hingeRad,holeCol,edgeCol,aByte);
      }
    } else if (def.shape === 'slope') {
      const lipH = h <= 16 ? 3.2 : 4.2;
      const flatEnd = def.topStudsX ? (-w/2 + def.topStudsX * 20 - 0.5) : (-w/2 + 3.2);
      const pts = [
        [-w/2, -h],
        [ w/2, -h],
        [ w/2, -h + lipH],
        [flatEnd, 0],
        [-w/2, 0],
      ];
      addExtrudedProfile(pts, -d/2, d/2, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'slope_inv') {
      const baseEnd = -w/2 + 19.5;
      const pts = [
        [-w/2, -h],
        [baseEnd, -h],
        [ w/2, -4.5],
        [ w/2, 0],
        [-w/2, 0],
      ];
      addExtrudedProfile(pts, -d/2, d/2, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'curved_slope') {
      // Smooth curved arch slope with interpolated top normals
      const steps = heroQuality ? 10 : 6;
      const lipH = 3.2;
      const pts = [[-w/2, -h], [w/2, -h], [w/2, -h + lipH]];
      const norms = [null, null, null];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps; // 0 at front (+w/2), 1 at back (-w/2)
        const ang = t * (Math.PI / 2);
        const px = -w/2 + Math.cos(ang) * w;
        const py = (-h + lipH) + Math.sin(ang) * (h - lipH);
        pts.push([px, py]);
        const nx = Math.cos(ang) * (h - lipH);
        const ny = Math.sin(ang) * w;
        const nl = Math.hypot(nx, ny) || 1;
        norms.push([nx / nl, ny / nl]);
      }
      addExtrudedProfile(pts, -d/2, d/2, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha, norms);
    } else if (def.shape === 'snot4' || def.shape === 'snot1') {
      addBox(0,-h/2,0, w,h,d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(w/2+1.9,-h/2,0, 5.8,5.8,4.6,'x', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      if (def.shape === 'snot4') {
        addCyl(-w/2-1.9,-h/2,0, 5.8,5.8,4.6,'x', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
        addCyl(0,-h/2,d/2+1.9, 5.8,5.8,4.6,'z', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
        addCyl(0,-h/2,-d/2-1.9, 5.8,5.8,4.6,'z', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      }
    } else if (def.shape === 'bracket' || def.shape === 'bracket_inv') {
      const plateH = 8;
      const flangeT = 4.2;
      const inv = def.shape === 'bracket_inv';
      if (!inv) {
        addBox(0, -plateH/2, 0, w, plateH, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
        addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
        const flH = Math.max(12, h);
        addBox(0, -flH/2, d/2 - flangeT/2, w, flH, flangeT, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
        const sxC = Math.round(def.sx);
        const startX = -((sxC - 1) * 20) / 2;
        const rows = flH >= 22 ? 2 : 1;
        for (let ix = 0; ix < sxC; ix++) {
          for (let ry = 0; ry < rows; ry++) {
            const syPos = rows === 2 ? (-6 - ry * 12) : (-flH / 2);
            addCyl(startX + ix*20, syPos, d/2 + 2.0, 5.8, 5.8, 4.4, 'z', heroQuality ? 16 : 8, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
          }
        }
      } else {
        addBox(0, -h + plateH/2, 0, w, plateH, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
        addBox(0, -h/2, d/2 - flangeT/2, w, h, flangeT, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
        const sxC = Math.round(def.sx);
        const startX = -((sxC - 1) * 20) / 2;
        for (let ix = 0; ix < sxC; ix++) {
          addCyl(startX + ix*20, -h + plateH + 1.8, 0, 5.8, 5.8, 4.4, 'y', heroQuality ? 16 : 8, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
          addCyl(startX + ix*20, -h/2 + 4, d/2 + 2.0, 5.8, 5.8, 4.4, 'z', heroQuality ? 16 : 8, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
        }
      }
    } else if (def.shape === 'clip_h') {
      addBox(0, -h/2, 0, w, h, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      const clips = Math.round(def.sx);
      const startX = -((clips - 1) * 20) / 2;
      const clipY = h > 12 ? -h/2 : -4;
      for (let i = 0; i < clips; i++) {
        const cx = startX + i * 20;
        addBox(cx, clipY, d/2 + 3.0, 6.2, 5.2, 6.0, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
        addAnnulus(cx, clipY, d/2 + 8.8, 6.2, 3.6, 6.4, 'x', heroQuality ? 16 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, 0.55, Math.PI * 2 - 0.55);
      }
    } else if (def.shape === 'clip_v') {
      addBox(0, -h/2, 0, w, h, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(0, 2.5, 0, 6.4, 5.0, 7.6, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addAnnulus(0, 9.2, 0, 6.4, 3.7, 7.6, 'z', heroQuality ? 16 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, Math.PI * 0.5 + 0.55, Math.PI * 2.5 - 0.55);
    } else if (def.shape === 'window_frame') {
      // True hollow rectangular window frame: sill, lintel, left & right jambs
      const frameT = 5.4;
      const sillH = 6.0;
      const innerH = Math.max(8, h - sillH * 2);
      addBox(0, -sillH/2, 0, w, sillH, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(0, -h + sillH/2, 0, w, sillH, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(-w/2 + frameT/2, -h/2, 0, frameT, innerH, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox( w/2 - frameT/2, -h/2, 0, frameT, innerH, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'seat') {
      // Sculpted LEGO minifigure chair: seat cushion, backrest, and side armrests
      addBox(0, -h + 4, 0, w, 8, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(0, -h/2, -d/2 + 4.2, w, h, 8.4, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(-w/2 + 3.2, -h + 10.5, 2, 6.4, 13, d - 6, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox( w/2 - 3.2, -h + 10.5, 2, 6.4, 13, d - 6, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
    } else if (def.shape === 'wheel_holder') {
      // Train bogie plate + recessed lower wheel housing + axle bearings
      addBox(0, -4, 0, w, 8, d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addBox(0, -14, 0, w * 0.72, 14, d * 0.86, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      for (const zOff of [-d * 0.28, d * 0.28]) {
        addCyl(0, -16, zOff, 5.2, 5.2, w + 1.5, 'x', heroQuality ? 16 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
        addCyl(0, -16, zOff, 2.4, 2.4, w + 2.1, 'x', heroQuality ? 12 : 8, m,ox,oy,oz,hingeRad,holeCol,edgeCol,aByte);
      }
    } else if (def.shape === 'wheel') {
      // Flanged horizontal train wheel oriented along X axis
      const treadR = 13.5, flangeR = 16.5;
      addCyl(-3.6, -treadR, 0, flangeR, flangeR, 2.6, 'x', heroQuality ? 24 : 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addCyl(0.8, -treadR, 0, treadR, treadR, 8.2, 'x', heroQuality ? 24 : 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addCyl(5.0, -treadR, 0, 5.4, 5.4, 2.8, 'x', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addCyl(5.6, -treadR, 0, 2.8, 2.8, 2.0, 'x', heroQuality ? 14 : 8, m,ox,oy,oz,hingeRad,holeCol,edgeCol,aByte);
    } else if (def.shape === 'mf_legs') {
      // Sculpted minifigure hips + cylindrical hip joint + legs with foot toes
      addBox(0, -2.8, 0, 32, 5.6, 16, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addBox(0, -8.5, 0, 3.6, 9.5, 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addCyl(0, -9.2, 0, 6.8, 6.8, 30.5, 'x', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      for (const sx of [-8.6, 8.6]) {
        addBox(sx, -18.5, -0.5, 13.6, 19, 13.5, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
        addBox(sx, -25.8, 1.8, 13.6, 5.2, 16.5, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      }
    } else if (def.shape === 'mf_torso_body') {
      // Bare minifigure torso (exact LDraw 973.dat proportions: y=0 shoulders, y=-32 waist, neck +0..+11.2)
      addMinifigTorso([0, 0, 0], false, m, ox, oy, oz, hingeRad, baseCol, edgeCol, baseCol, edgeCol, aByte);
    } else if (def.shape === 'mf_torso') {
      const sh = isBrickLinkTorsoAssemblyId(normId(leafPart.p)) ? [-20, 32, -10] : [0, 0, 0];
      const yellowInfo = COLORS[14];
      const handCol = (isSelected || overrideHex || isGhost) ? baseCol : hexToRgb255(yellowInfo.hex, fadeMix);
      const handEdge = (isSelected || overrideHex || isGhost)
        ? edgeCol
        : (shouldHighlight ? hexToRgb255(hlColorHex, 0) : hexToRgb255(yellowInfo.edge, fadeMix * 0.85));
      addMinifigTorso(sh, true, m, ox, oy, oz, hingeRad, baseCol, edgeCol, handCol, handEdge, aByte);
    } else if (def.shape === 'mf_head') {
      // Authentic LEGO minifigure head proportions (matches LDraw 3626c / 28621: crown y=0, neck bottom y=-24)
      addCyl(0, 2.0, 0, 5.8, 5.8, 4.4, 'y', heroQuality ? 18 : 10, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addCyl(0, -1.8, 0, 8.6, 12.6, 3.6, 'y', heroQuality ? 22 : 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -10.5, 0, 12.6, 12.6, 13.8, 'y', heroQuality ? 22 : 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -19.2, 0, 12.6, 8.6, 3.6, 'y', heroQuality ? 22 : 14, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -22.5, 0, 8.0, 8.0, 3.2, 'y', heroQuality ? 18 : 12, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    } else if (def.shape === 'mf_helmet') {
      // Smooth domed helmet shell + open face visor guard
      const hSegs = heroQuality ? 22 : 12;
      addCyl(0, -1.2, 0, 4.5, 9.2, 2.4, 'y', hSegs, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, true);
      addCyl(0, -4.4, 0, 9.2, 13.0, 4.0, 'y', hSegs, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addCyl(0, -8.2, 0, 13.0, 13.6, 3.8, 'y', hSegs, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
      addAnnulus(0, -16.2, 0, 13.6, 11.2, 12.4, 'y', hSegs, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, Math.PI * 0.28, Math.PI * 1.72);
      // Curved front brow brim
      addAnnulus(0, -9.8, 0, 15.2, 12.2, 2.4, 'y', hSegs, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte, -Math.PI * 0.34, Math.PI * 0.34);
    } else {
      addBox(0,-h/2,0, w,h,d, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte,edgeAlpha);
      addTopStuds(def, m,ox,oy,oz,hingeRad,baseCol,edgeCol,aByte);
    }
  };

  const emitPart = (part, isNew) => {
    const pOv = isNew ? (opts.partOffsets?.[part.id] || null) : null;
    const stepOv = isNew ? (opts.ov || null) : null;
    const offX = (pOv?.x || 0) + (stepOv?.offX || 0);
    const offY = (pOv?.y || 0) + (stepOv?.offY || 0);
    const offZ = (pOv?.z || 0) + (stepOv?.offZ || 0);
    const hingeRad = (((pOv?.tilt || 0) + (stepOv?.hingeDeg || 0)) * Math.PI) / 180;
    const isSel = isNew && Boolean(opts.selectedPartIds?.has(part.id));

    if (part.children && part.children.length > 0) {
      for (const ch of part.children) emitSingleLeaf(ch, isNew, isSel, offX, offY, offZ, hingeRad, part.id);
    } else {
      emitSingleLeaf(part, isNew, isSel, offX, offY, offZ, hingeRad, part.id);
    }

    // Placement Arrows ONLY when a piece is ACTUALLY offset/exploded! (Zero random arrows!)
    const hasOffset = Math.hypot(offX, offY, offZ) >= 6;
    const arrowEnabled = pOv ? (pOv.arrow !== false) : (opts.showArrows !== false);
    if (isNew && hasOffset && arrowEnabled) {
      const box = computeWorldBox(part);
      const from = [box.center[0] + offX, box.center[1] + offY, box.center[2] + offZ];
      const to = [box.center[0], box.center[1], box.center[2]];
      addArrow3D(from, to, hexToRgb255(opts.accent || '#1a73e8', 0));
    }
  };

  prevParts.forEach(p => emitPart(p, false));
  const prevOpEnd = opPos.len, prevTrEnd = trPos.len;
  newParts.forEach(p => emitPart(p, true));

  // Starting-pose translucent ghost limbs & 3D curved rotation indicators (for minifigure Prepare steps!)
  if (Array.isArray(opts.ghostParts) && opts.ghostParts.length > 0) {
    for (const gp of opts.ghostParts) {
      if (gp.children && gp.children.length > 0) {
        for (const ch of gp.children) emitSingleLeaf(ch, false, false, 0, 0, 0, 0, gp.id, true);
      } else {
        emitSingleLeaf(gp, false, false, 0, 0, 0, 0, gp.id, true);
      }
    }
  }
  if (Array.isArray(opts.minifigIndicators) && opts.minifigIndicators.length > 0) {
    for (const ind of opts.minifigIndicators) addCurvedArrow3D(ind);
  }

  const opP = opPos.slice(), trP = trPos.slice();
  const opN = opNorm.slice(), trN = trNorm.slice();
  const opC = opCol.slice(), trC = trCol.slice();

  const triPos = new Float32Array(opP.length + trP.length); triPos.set(opP, 0); triPos.set(trP, opP.length);
  const triNorm = new Float32Array(opN.length + trN.length); triNorm.set(opN, 0); triNorm.set(trN, opN.length);
  const triCol = new Uint8Array(opC.length + trC.length); triCol.set(opC, 0); triCol.set(trC, opC.length);

  const texDraws = [];
  for (const g of texGroups.values()) {
    if (g.pos.len < 9) continue;
    texDraws.push({
      texKey: g.texKey,
      fadeMix: g.fadeMix,
      prevPosEnd: g.prevPosEnd,
      triPos: new Float32Array(g.pos.slice()),
      triNorm: new Float32Array(g.norm.slice()),
      triUv: new Float32Array(g.uv.slice()),
      triCol: new Uint8Array(g.col.slice()),
    });
  }

  // 1. Full model bounding sphere
  let minX=Infinity,minY=Infinity,minZ=Infinity,maxX=-Infinity,maxY=-Infinity,maxZ=-Infinity;
  const scanBounds = (arr) => {
    for (let i=0; i<arr.length; i+=3) {
      const x=arr[i], y=arr[i+1], z=arr[i+2];
      if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;if(z<minZ)minZ=z;if(z>maxZ)maxZ=z;
    }
  };
  scanBounds(triPos);
  for (const td of texDraws) scanBounds(td.triPos);
  const fcx=isFinite(minX)?(minX+maxX)/2:0, fcy=isFinite(minY)?(minY+maxY)/2:0, fcz=isFinite(minZ)?(minZ+maxZ)/2:0;
  let fullR2 = 0;
  const scanFullR = (arr) => {
    for (let i=0; i<arr.length; i+=3) {
      const dx=arr[i]-fcx, dy=arr[i+1]-fcy, dz=arr[i+2]-fcz;
      const r2 = dx*dx + dy*dy + dz*dz;
      if (r2 > fullR2) fullR2 = r2;
    }
  };
  scanFullR(triPos);
  for (const td of texDraws) scanFullR(td.triPos);
  const fullRadius = Math.max(Math.sqrt(fullR2), 20);

  // 2. New-pieces-only bounding sphere (for smart Close-Up framing on large models!)
  let nMinX=Infinity,nMinY=Infinity,nMinZ=Infinity,nMaxX=-Infinity,nMaxY=-Infinity,nMaxZ=-Infinity;
  const scanRange = (arr, start, end) => {
    for (let i = start; i < end; i += 3) {
      const x = arr[i], y = arr[i+1], z = arr[i+2];
      if(x<nMinX)nMinX=x;if(x>nMaxX)nMaxX=x;if(y<nMinY)nMinY=y;if(y>nMaxY)nMaxY=y;if(z<nMinZ)nMinZ=z;if(z>nMaxZ)nMaxZ=z;
    }
  };
  scanRange(opP, prevOpEnd, opP.length);
  scanRange(trP, prevTrEnd, trP.length);
  for (const td of texDraws) scanRange(td.triPos, td.prevPosEnd, td.triPos.length);

  let targetCenter = [fcx, fcy, fcz];
  let viewRadius = fullRadius;
  let isZoomedIn = false;

  if (prevParts.length > 0 && isFinite(nMinX)) {
    const ncx = (nMinX + nMaxX) / 2, ncy = (nMinY + nMaxY) / 2, ncz = (nMinZ + nMaxZ) / 2;
    let newR2 = 0;
    const scanR = (arr, start, end) => {
      for (let i = start; i < end; i += 3) {
        const dx = arr[i]-ncx, dy = arr[i+1]-ncy, dz = arr[i+2]-ncz;
        const r2 = dx*dx + dy*dy + dz*dz;
        if (r2 > newR2) newR2 = r2;
      }
    };
    scanR(opP, prevOpEnd, opP.length);
    scanR(trP, prevTrEnd, trP.length);
    for (const td of texDraws) scanR(td.triPos, td.prevPosEnd, td.triPos.length);
    const newRadius = Math.max(Math.sqrt(newR2), 18);
    const framing = computeStepCameraFraming({
      focusMode: opts.ov?.focusMode || 'auto',
      hasPrevParts: prevParts.length > 0,
      fullCenter: [fcx, fcy, fcz],
      fullRadius,
      newCenter: [ncx, ncy, ncz],
      newRadius,
    });
    targetCenter = framing.center;
    viewRadius = framing.radius;
    isZoomedIn = framing.isZoomedIn;
  }

  return {
    triPos, triNorm, triCol,
    opaqueCount: opP.length / 3,
    transCount: trP.length / 3,
    texDraws,
    linePos: new Float32Array(lnPos.slice()),
    lineCol: new Uint8Array(lnCol.slice()),
    center: targetCenter,
    radius: viewRadius,
    fullRadius,
    isZoomedIn,
    bounds: isFinite(minX) ? { minX, minY, minZ, maxX, maxY, maxZ } : { minX: -20, minY: 0, minZ: -10, maxX: 20, maxY: 100, maxZ: 10 },
  };
}

function getPreviewResolutionScale() {
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  return computePreviewResolutionScale(dpr, 1);
}

function computePreviewLightDirs(right, up, forward) {
  const combine = (wr, wu, wf) => {
    const x = right[0] * wr + up[0] * wu + forward[0] * wf;
    const y = right[1] * wr + up[1] * wu + forward[1] * wf;
    const z = right[2] * wr + up[2] * wu + forward[2] * wf;
    const len = Math.hypot(x, y, z) || 1;
    return [x / len, y / len, z / len];
  };
  return {
    // Primary warm studio key light (upper-front-right relative to camera)
    key: combine(0.64, 0.64, 0.42),
    // Secondary cool-neutral studio fill light (opposing front-left & slightly lower relative to camera)
    fill: combine(-0.74, 0.16, 0.66),
    // Back-rim catchlight strip (upper-back-left relative to camera)
    rim: combine(-0.30, 0.64, -0.70),
  };
}

// GPU-Cached WebGL Engine: Uploads buffers ONLY once per mesh (0 bytes uploaded while orbiting!)
class WebGLBrickEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.uploadedMesh = null;
    this.glTextures = new Map();
    this.maxDim = 2048;
    this.anisoExt = null;
    this.maxAniso = 1;
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'default' });
    this.gl = gl;
    if (!gl) return;
    try {
      const vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      const rb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 2048;
      const vpMin = vp && vp.length >= 2 ? Math.min(vp[0], vp[1]) : 2048;
      this.maxDim = Math.max(1024, Math.min(vpMin, rb, 4096));
      this.anisoExt = gl.getExtension('EXT_texture_filter_anisotropic')
        || gl.getExtension('WEBKIT_EXT_TEXTURE_FILTER_ANISOTROPIC')
        || gl.getExtension('MOZ_EXT_TEXTURE_FILTER_ANISOTROPIC');
      if (this.anisoExt) {
        this.maxAniso = Math.min(8, gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1);
      }
    } catch (_) {}
    const vsTri = `attribute vec3 aPos; attribute vec3 aNorm; attribute vec4 aCol; uniform mat4 uMVP; varying vec3 vPos; varying vec3 vNorm; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); vPos = aPos; vNorm = aNorm; vCol = aCol; }`;
    const absPbrGlsl = `
      float ggxDist(float NdotH, float rough) {
        float a = rough * rough;
        float a2 = a * a;
        float d = (NdotH * NdotH) * (a2 - 1.0) + 1.0;
        return a2 / max(0.0002, 3.14159265 * d * d);
      }
      float geomSmithAbs(float NdotV, float NdotL, float rough) {
        float k = ((rough + 1.0) * (rough + 1.0)) * 0.125;
        float gv = NdotV / max(0.0002, NdotV * (1.0 - k) + k);
        float glv = NdotL / max(0.0002, NdotL * (1.0 - k) + k);
        return gv * glv;
      }
      vec3 sampleStudioAbsEnv(vec3 R, float rough, vec3 keyDir, vec3 fillDir, vec3 rimDir, vec3 camUp) {
        float upR = dot(R, camUp);
        float upMask = smoothstep(-0.22, 0.72, upR);
        vec3 env = mix(vec3(0.20, 0.22, 0.27), vec3(0.62, 0.65, 0.70), upMask);
        float topBox = smoothstep(0.42 - rough * 0.25, 0.88, upR);
        env += vec3(0.76, 0.75, 0.73) * topBox;
        float keyCard = pow(max(dot(R, keyDir), 0.0), mix(44.0, 12.0, rough));
        env += vec3(1.28, 1.24, 1.16) * keyCard;
        float fillCard = pow(max(dot(R, fillDir), 0.0), mix(26.0, 9.0, rough));
        env += vec3(0.56, 0.64, 0.78) * fillCard;
        float rimCard = pow(max(dot(R, rimDir), 0.0), mix(48.0, 14.0, rough));
        env += vec3(0.55, 0.59, 0.66) * rimCard;
        return env;
      }
      vec3 acesAbsTone(vec3 x) {
        return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
      }
      vec4 shadeAbsPlastic(vec3 baseRgb, float alpha, vec3 worldPos, vec3 rawNorm, float heroMode, vec3 eyePos, vec3 keyDirIn, vec3 fillDirIn, vec3 rimDirIn, vec3 camUpIn) {
        vec3 N = normalize(rawNorm);
        if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(eyePos - worldPos);
        float NdotV = max(dot(N, V), 0.002);
        vec3 Lkey = normalize(keyDirIn);
        vec3 Lfill = normalize(fillDirIn);
        vec3 Lrim = normalize(rimDirIn);
        vec3 camUp = normalize(camUpIn);

        vec3 albedo = pow(clamp(baseRgb, 0.0, 1.0), vec3(2.2));
        float isTrans = step(alpha, 0.96);
        float baseRough = mix(0.22, 0.17, heroMode);
        float rough = mix(baseRough, 0.10, isTrans);
        vec3 F0 = vec3(mix(0.052, 0.068, isTrans));

        float NdotLKey = max(dot(N, Lkey), 0.0);
        float NdotLFill = max(dot(N, Lfill), 0.0);
        float NdotLRim = max(dot(N, Lrim), 0.0);

        vec3 direct = vec3(0.0);
        if (NdotLKey > 0.0) {
          vec3 H = normalize(V + Lkey);
          float NdotH = max(dot(N, H), 0.0);
          float HdotV = max(dot(H, V), 0.0);
          vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
          float D = ggxDist(NdotH, rough);
          float G = geomSmithAbs(NdotV, NdotLKey, rough);
          vec3 spec = (D * G * F) / max(0.001, 4.0 * NdotV * NdotLKey);
          vec3 rad = vec3(1.52, 1.48, 1.40);
          direct += ((1.0 - F) * albedo / 3.14159265 + spec * mix(0.95, 1.15, heroMode)) * rad * NdotLKey;
        }
        if (NdotLFill > 0.0) {
          vec3 H = normalize(V + Lfill);
          float NdotH = max(dot(N, H), 0.0);
          float HdotV = max(dot(H, V), 0.0);
          vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
          float D = ggxDist(NdotH, rough + 0.05);
          float G = geomSmithAbs(NdotV, NdotLFill, rough + 0.05);
          vec3 spec = (D * G * F) / max(0.001, 4.0 * NdotV * NdotLFill);
          vec3 rad = vec3(0.66, 0.73, 0.85);
          direct += ((1.0 - F) * albedo / 3.14159265 + spec * mix(0.75, 0.95, heroMode)) * rad * NdotLFill;
        }
        if (NdotLRim > 0.0) {
          vec3 H = normalize(V + Lrim);
          float NdotH = max(dot(N, H), 0.0);
          float HdotV = max(dot(H, V), 0.0);
          vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
          float D = ggxDist(NdotH, rough + 0.02);
          float G = geomSmithAbs(NdotV, NdotLRim, rough + 0.02);
          vec3 spec = (D * G * F) / max(0.001, 4.0 * NdotV * NdotLRim);
          vec3 rad = vec3(0.56, 0.60, 0.68);
          direct += (albedo * 0.06 + spec * mix(0.55, 0.85, heroMode)) * rad * NdotLRim;
        }

        float camUpDot = dot(N, camUp);
        vec3 hemiAmb = mix(vec3(0.17, 0.19, 0.23), vec3(0.35, 0.36, 0.39), camUpDot * 0.5 + 0.5);
        vec3 ambientDiff = albedo * hemiAmb;

        vec3 Fview = F0 + (vec3(0.46) - F0) * pow(1.0 - NdotV, 4.0);
        vec3 R = reflect(-V, N);
        vec3 envRefl = sampleStudioAbsEnv(R, rough, Lkey, Lfill, Lrim, camUp);
        vec3 ambientSpec = envRefl * Fview * mix(mix(0.48, 0.62, heroMode), 1.15, isTrans);

        vec3 hdr = direct + ambientDiff + ambientSpec + albedo * (0.12 * isTrans);
        vec3 mapped = acesAbsTone(hdr * 1.24);
        vec3 srgb = pow(mapped, vec3(1.0 / 2.2));
        float outAlpha = mix(alpha, clamp(alpha + Fview.r * 0.45, 0.34, 0.94), isTrans);
        return vec4(srgb, outAlpha);
      }
    `;
    const fsTri = `precision mediump float;
      uniform float uHeroMode;
      uniform vec3 uEyePos;
      uniform vec3 uKeyDir;
      uniform vec3 uFillDir;
      uniform vec3 uRimDir;
      uniform vec3 uCamUp;
      varying vec3 vPos;
      varying vec3 vNorm;
      varying vec4 vCol;
      ${absPbrGlsl}
      void main(){
        gl_FragColor = shadeAbsPlastic(vCol.rgb, vCol.a, vPos, vNorm, uHeroMode, uEyePos, uKeyDir, uFillDir, uRimDir, uCamUp);
      }`;
    const vsTex = `attribute vec3 aPos; attribute vec3 aNorm; attribute vec2 aUv; attribute vec4 aCol; uniform mat4 uMVP; varying vec3 vPos; varying vec3 vNorm; varying vec2 vUv; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); vPos = aPos; vNorm = aNorm; vUv = aUv; vCol = aCol; }`;
    const fsTex = `precision mediump float;
      uniform float uHeroMode;
      uniform vec3 uEyePos;
      uniform vec3 uKeyDir;
      uniform vec3 uFillDir;
      uniform vec3 uRimDir;
      uniform vec3 uCamUp;
      uniform sampler2D uTex;
      uniform float uUseTex;
      uniform float uFadeMix;
      varying vec3 vPos;
      varying vec3 vNorm;
      varying vec2 vUv;
      varying vec4 vCol;
      ${absPbrGlsl}
      void main(){
        vec3 baseRgb = vCol.rgb;
        if (uUseTex > 0.5 && vUv.x >= 0.0 && vUv.x <= 1.0 && vUv.y >= 0.0 && vUv.y <= 1.0) {
          vec4 decal = texture2D(uTex, vUv);
          vec3 decalRgb = mix(decal.rgb, vec3(0.855, 0.871, 0.894), uFadeMix);
          baseRgb = mix(baseRgb, decalRgb, decal.a);
        }
        gl_FragColor = shadeAbsPlastic(baseRgb, vCol.a, vPos, vNorm, uHeroMode, uEyePos, uKeyDir, uFillDir, uRimDir, uCamUp);
      }`;
    const vsLine = `attribute vec3 aPos; attribute vec4 aCol; uniform mat4 uMVP; varying vec4 vCol; void main(){ gl_Position = uMVP * vec4(aPos,1.0); gl_Position.z -= 0.00022; vCol = aCol; }`;
    const fsLine = `precision mediump float; uniform float uLineAlpha; varying vec4 vCol; void main(){ gl_FragColor = vec4(vCol.rgb, vCol.a * uLineAlpha); }`;
    const cmp = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); return sh; };
    const lnk = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, cmp(gl.VERTEX_SHADER, v)); gl.attachShader(p, cmp(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p); return p; };
    this.triProg = lnk(vsTri, fsTri);
    this.texProg = lnk(vsTex, fsTex);
    this.lineProg = lnk(vsLine, fsLine);
    this.loc = {
      tMVP: gl.getUniformLocation(this.triProg, 'uMVP'),
      tHeroMode: gl.getUniformLocation(this.triProg, 'uHeroMode'),
      tEyePos: gl.getUniformLocation(this.triProg, 'uEyePos'),
      tKeyDir: gl.getUniformLocation(this.triProg, 'uKeyDir'),
      tFillDir: gl.getUniformLocation(this.triProg, 'uFillDir'),
      tRimDir: gl.getUniformLocation(this.triProg, 'uRimDir'),
      tCamUp: gl.getUniformLocation(this.triProg, 'uCamUp'),
      tPos: gl.getAttribLocation(this.triProg, 'aPos'),
      tNorm: gl.getAttribLocation(this.triProg, 'aNorm'),
      tCol: gl.getAttribLocation(this.triProg, 'aCol'),
      xMVP: gl.getUniformLocation(this.texProg, 'uMVP'),
      xHeroMode: gl.getUniformLocation(this.texProg, 'uHeroMode'),
      xEyePos: gl.getUniformLocation(this.texProg, 'uEyePos'),
      xKeyDir: gl.getUniformLocation(this.texProg, 'uKeyDir'),
      xFillDir: gl.getUniformLocation(this.texProg, 'uFillDir'),
      xRimDir: gl.getUniformLocation(this.texProg, 'uRimDir'),
      xCamUp: gl.getUniformLocation(this.texProg, 'uCamUp'),
      xTex: gl.getUniformLocation(this.texProg, 'uTex'),
      xUseTex: gl.getUniformLocation(this.texProg, 'uUseTex'),
      xFadeMix: gl.getUniformLocation(this.texProg, 'uFadeMix'),
      xPos: gl.getAttribLocation(this.texProg, 'aPos'),
      xNorm: gl.getAttribLocation(this.texProg, 'aNorm'),
      xUv: gl.getAttribLocation(this.texProg, 'aUv'),
      xCol: gl.getAttribLocation(this.texProg, 'aCol'),
      lMVP: gl.getUniformLocation(this.lineProg, 'uMVP'),
      lAlpha: gl.getUniformLocation(this.lineProg, 'uLineAlpha'),
      lPos: gl.getAttribLocation(this.lineProg, 'aPos'),
      lCol: gl.getAttribLocation(this.lineProg, 'aCol'),
    };
    this.bTriPos = gl.createBuffer(); this.bTriNorm = gl.createBuffer(); this.bTriCol = gl.createBuffer();
    this.bTexPos = gl.createBuffer(); this.bTexNorm = gl.createBuffer(); this.bTexUv = gl.createBuffer(); this.bTexCol = gl.createBuffer();
    this.bLinePos = gl.createBuffer(); this.bLineCol = gl.createBuffer();
    this.emptyTex = gl.createTexture();
    if (this.emptyTex) {
      gl.bindTexture(gl.TEXTURE_2D, this.emptyTex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    }
  }
  getOrCreateGlTexture(texKey) {
    const gl = this.gl;
    if (!gl) return null;
    const cached = this.glTextures.get(texKey);
    if (cached) return cached;
    const img = textureStore.getDecodedImage(texKey);
    if (!img) return null;
    const tex = gl.createTexture();
    if (!tex) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const iw = img.naturalWidth || img.width || 0;
    const ih = img.naturalHeight || img.height || 0;
    const isPow2 = iw > 0 && ih > 0 && (iw & (iw - 1)) === 0 && (ih & (ih - 1)) === 0;
    if (isPow2) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    if (this.anisoExt && this.maxAniso > 1) {
      gl.texParameterf(gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, this.maxAniso);
    }
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    this.glTextures.set(texKey, tex);
    return tex;
  }
  uploadIfNeeded(mesh) {
    if (this.uploadedMesh === mesh || !this.gl) return;
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos); gl.bufferData(gl.ARRAY_BUFFER, mesh.triPos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm); gl.bufferData(gl.ARRAY_BUFFER, mesh.triNorm, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol); gl.bufferData(gl.ARRAY_BUFFER, mesh.triCol, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bLinePos); gl.bufferData(gl.ARRAY_BUFFER, mesh.linePos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bLineCol); gl.bufferData(gl.ARRAY_BUFFER, mesh.lineCol, gl.STATIC_DRAW);
    this.uploadedMesh = mesh;
  }
  computeMVP(mesh, w, h, azDeg, elDeg, zoom = 1, fixedHalfH = 0, tightFit = false, fixedCenter = null, panX = 0, panY = 0) {
    const az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
    const center = fixedCenter || mesh.center;
    // Tight near/far ortho depth range around full model radius for 4x sharper Z-buffer occlusion!
    const clipRadius = Math.max(mesh.fullRadius || mesh.radius, mesh.radius, fixedHalfH > 0 ? fixedHalfH * 1.35 : 0);
    const dist = clipRadius * 2.5;
    const eye = [center[0]+dist*Math.sin(az)*Math.cos(el), center[1]+dist*Math.sin(el), center[2]+dist*Math.cos(az)*Math.cos(el)];
    const near = Math.max(1, dist - clipRadius * 2.4);
    const far = dist + clipRadius * 2.4;
    const view = lookAtMat4(eye, center, [0, 1, 0]);
    const tightPos = mesh.triPos && mesh.triPos.length >= 9
      ? mesh.triPos
      : (mesh.texDraws && mesh.texDraws.length > 0 ? mesh.texDraws[0].triPos : null);
    if (tightFit && fixedHalfH <= 0 && tightPos && tightPos.length >= 9) {
      const tb = computeTightCameraBounds(tightPos, center, azDeg, elDeg, w, h, zoom, 1.07);
      if (tb) {
        // Reserve a small bottom strip (~3.5%) so the soft studio floor shadow never clips
        const shadowShiftY = tb.halfH * 0.035;
        return mulMat4(
          orthoMat4(
            tb.centerX - tb.halfW,
            tb.centerX + tb.halfW,
            tb.centerY - tb.halfH - shadowShiftY,
            tb.centerY + tb.halfH - shadowShiftY,
            near,
            far,
          ),
          view,
        );
      }
    }
    const aspect = w / Math.max(1, h);
    const safeZoom = Math.max(0.4, zoom);
    let halfH = fixedHalfH > 0
      ? (fixedCenter ? fixedHalfH / safeZoom : fixedHalfH)
      : ((mesh.radius * 1.12) / safeZoom);
    // Ensure portrait/tall slots never clip wide models horizontally
    if (fixedHalfH <= 0 && aspect < 1) {
      halfH = halfH / Math.max(0.5, aspect);
    }
    const halfW = halfH * aspect;
    const pxX = panX * halfW * safeZoom;
    const pxY = panY * halfH * safeZoom;
    return mulMat4(orthoMat4(-halfW - pxX, halfW - pxX, -halfH + pxY, halfH + pxY, near, far), view);
  }
  draw(mesh, w, h, azDeg, elDeg, zoom = 1, fixedHalfH = 0, drawOpts = null) {
    const gl = this.gl;
    const hasTexDraws = Boolean(mesh.texDraws && mesh.texDraws.length > 0);
    if (!gl || (mesh.triPos.length === 0 && !hasTexDraws)) return null;
    const clamped = clampRenderDimensions(w, h, this.maxDim || 2048, (this.maxDim || 2048) * (this.maxDim || 2048), 32);
    const dw = clamped.width;
    const dh = clamped.height;
    if (this.canvas.width !== dw || this.canvas.height !== dh) { this.canvas.width = dw; this.canvas.height = dh; }
    this.uploadIfNeeded(mesh);
    gl.viewport(0, 0, dw, dh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1.0, 1.0);

    const tightFit = Boolean(drawOpts?.tightFit);
    const heroShading = Boolean(drawOpts?.heroShading);
    const lineAlpha = typeof drawOpts?.lineAlpha === 'number' ? drawOpts.lineAlpha : (heroShading ? 0.52 : 1.0);
    const fixedCenter = drawOpts?.fixedCenter || null;
    const panX = typeof drawOpts?.panX === 'number' ? drawOpts.panX : 0;
    const panY = typeof drawOpts?.panY === 'number' ? drawOpts.panY : 0;
    const mvp = this.computeMVP(mesh, dw, dh, azDeg, elDeg, zoom, fixedHalfH, tightFit, fixedCenter, panX, panY);
    const { right, up, forward } = computeCameraBasis(azDeg, elDeg);
    const lights = computePreviewLightDirs(right, up, forward);
    const center = fixedCenter || mesh.center;
    const clipRadius = Math.max(mesh.fullRadius || mesh.radius, mesh.radius, fixedHalfH > 0 ? fixedHalfH * 1.35 : 0, 12);
    const eyeDist = clipRadius * 3.6;
    const eyePos = [
      center[0] + forward[0] * eyeDist,
      center[1] + forward[1] * eyeDist,
      center[2] + forward[2] * eyeDist,
    ];

    gl.useProgram(this.triProg);
    gl.uniformMatrix4fv(this.loc.tMVP, false, mvp);
    gl.uniform1f(this.loc.tHeroMode, heroShading ? 1.0 : 0.0);
    gl.uniform3f(this.loc.tEyePos, eyePos[0], eyePos[1], eyePos[2]);
    gl.uniform3f(this.loc.tKeyDir, lights.key[0], lights.key[1], lights.key[2]);
    gl.uniform3f(this.loc.tFillDir, lights.fill[0], lights.fill[1], lights.fill[2]);
    gl.uniform3f(this.loc.tRimDir, lights.rim[0], lights.rim[1], lights.rim[2]);
    gl.uniform3f(this.loc.tCamUp, up[0], up[1], up[2]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos); gl.enableVertexAttribArray(this.loc.tPos); gl.vertexAttribPointer(this.loc.tPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm); gl.enableVertexAttribArray(this.loc.tNorm); gl.vertexAttribPointer(this.loc.tNorm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol); gl.enableVertexAttribArray(this.loc.tCol); gl.vertexAttribPointer(this.loc.tCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);

    gl.depthMask(true);
    if (mesh.opaqueCount > 0) gl.drawArrays(gl.TRIANGLES, 0, mesh.opaqueCount);

    if (hasTexDraws) {
      gl.polygonOffset(0.5, 0.5);
      gl.useProgram(this.texProg);
      gl.uniformMatrix4fv(this.loc.xMVP, false, mvp);
      gl.uniform1f(this.loc.xHeroMode, heroShading ? 1.0 : 0.0);
      gl.uniform3f(this.loc.xEyePos, eyePos[0], eyePos[1], eyePos[2]);
      gl.uniform3f(this.loc.xKeyDir, lights.key[0], lights.key[1], lights.key[2]);
      gl.uniform3f(this.loc.xFillDir, lights.fill[0], lights.fill[1], lights.fill[2]);
      gl.uniform3f(this.loc.xRimDir, lights.rim[0], lights.rim[1], lights.rim[2]);
      gl.uniform3f(this.loc.xCamUp, up[0], up[1], up[2]);
      gl.uniform1i(this.loc.xTex, 0);
      gl.enableVertexAttribArray(this.loc.xPos);
      gl.enableVertexAttribArray(this.loc.xNorm);
      gl.enableVertexAttribArray(this.loc.xUv);
      gl.enableVertexAttribArray(this.loc.xCol);
      for (const td of mesh.texDraws) {
        if (td.triPos.length < 9) continue;
        const glTex = this.getOrCreateGlTexture(td.texKey);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, glTex || this.emptyTex);
        gl.uniform1f(this.loc.xUseTex, glTex ? 1.0 : 0.0);
        gl.uniform1f(this.loc.xFadeMix, td.fadeMix || 0.0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexPos);
        gl.bufferData(gl.ARRAY_BUFFER, td.triPos, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xPos, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexNorm);
        gl.bufferData(gl.ARRAY_BUFFER, td.triNorm, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xNorm, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexUv);
        gl.bufferData(gl.ARRAY_BUFFER, td.triUv, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xUv, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTexCol);
        gl.bufferData(gl.ARRAY_BUFFER, td.triCol, gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(this.loc.xCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, td.triPos.length / 3);
      }
      gl.disableVertexAttribArray(this.loc.xUv);
      gl.polygonOffset(1.0, 1.0);
      // Restore triProg for transparent bricks if needed
      if (mesh.transCount > 0) {
        gl.useProgram(this.triProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos); gl.enableVertexAttribArray(this.loc.tPos); gl.vertexAttribPointer(this.loc.tPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm); gl.enableVertexAttribArray(this.loc.tNorm); gl.vertexAttribPointer(this.loc.tNorm, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol); gl.enableVertexAttribArray(this.loc.tCol); gl.vertexAttribPointer(this.loc.tCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      }
    }

    if (mesh.transCount > 0) {
      gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES, mesh.opaqueCount, mesh.transCount);
      gl.depthMask(true);
    }
    if (mesh.linePos.length > 0 && lineAlpha > 0.01) {
      gl.useProgram(this.lineProg);
      gl.uniformMatrix4fv(this.loc.lMVP, false, mvp);
      gl.uniform1f(this.loc.lAlpha, lineAlpha);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLinePos); gl.enableVertexAttribArray(this.loc.lPos); gl.vertexAttribPointer(this.loc.lPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLineCol); gl.enableVertexAttribArray(this.loc.lCol); gl.vertexAttribPointer(this.loc.lCol, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      gl.drawArrays(gl.LINES, 0, mesh.linePos.length / 3);
    }
    return mvp;
  }
  dispose() {
    if (!this.gl) return;
    for (const tex of this.glTextures.values()) this.gl.deleteTexture(tex);
    this.glTextures.clear();
    if (this.emptyTex) this.gl.deleteTexture(this.emptyTex);
    this.emptyTex = null;
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
  }
}

const snapshotCanvas = document.createElement('canvas');
const snapshotEngine = new WebGLBrickEngine(snapshotCanvas);
let studioPhotoEngine = null;
let activeLiveEngine = null;
const pliThumbCache = new Map();
const coverHeroCache = new Map();
const overviewThumbCache = createOverviewThumbCache();

function getStudioPhotoEngine() {
  if (!studioPhotoEngine) {
    try {
      studioPhotoEngine = new StudioPhotoRenderer();
    } catch (_) {
      studioPhotoEngine = null;
    }
  }
  return studioPhotoEngine;
}

function isDarkHexColor(hex) {
  const clean = String(hex || '#ffffff').replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean.padEnd(6, '0');
  const r = parseInt(full.slice(0, 2), 16) || 255;
  const g = parseInt(full.slice(2, 4), 16) || 255;
  const b = parseInt(full.slice(4, 6), 16) || 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
}

function getPliThumb(part) {
  const key = `${part.p}:${part.c}`;
  if (pliThumbCache.has(key)) return pliThumbCache.get(key);
  const samplePart = normalizeCompositeThumbPart(part, (pid) => resolvePart(pid).name, computeWorldBox);
  const mesh = buildMeshBuffers([], [samplePart], { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  snapshotEngine.draw(mesh, 360, 360, 32, 22, 1.08);
  const url = snapshotCanvas.toDataURL('image/png');
  if (pliThumbCache.size > 360) pliThumbCache.clear();
  pliThumbCache.set(key, url);
  return url;
}

function getBomPartThumb(part, colSpan = 1, rowSpan = 1) {
  const cs = Math.max(1, Math.round(colSpan || 1));
  const rs = Math.max(1, Math.round(rowSpan || 1));
  if (cs === 1 && rs === 1) return getPliThumb(part);
  const key = `${part.p}:${part.c}:bom_${cs}x${rs}`;
  if (pliThumbCache.has(key)) return pliThumbCache.get(key);
  const maxSpan = Math.max(cs, rs);
  const basePx = Math.min(480, Math.round(240 * Math.min(2.0, 0.85 + maxSpan * 0.45)));
  const rw = Math.max(180, Math.round((basePx * cs) / maxSpan));
  const rh = Math.max(180, Math.round((basePx * rs) / maxSpan));
  const samplePart = normalizeCompositeThumbPart(part, (pid) => resolvePart(pid).name, computeWorldBox);
  const mesh = buildMeshBuffers([], [samplePart], { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  snapshotEngine.draw(mesh, rw, rh, 32, 22, 1.04, 0, { tightFit: true });
  const url = snapshotCanvas.toDataURL('image/png');
  if (pliThumbCache.size > 360) pliThumbCache.clear();
  pliThumbCache.set(key, url);
  return url;
}

function renderSnapshot(prev, next, az, el, w, h, zoom, opts) {
  const mesh = buildMeshBuffers(prev, next, opts);
  const mvp = snapshotEngine.draw(mesh, w, h, az, el, zoom, opts?.fixedHalfH || 0, opts);
  return {
    url: snapshotCanvas.toDataURL('image/png'),
    mesh,
    mvp,
    w: snapshotCanvas.width || w,
    h: snapshotCanvas.height || h,
  };
}

function renderMeshSnapshot(mesh, az, el, w, h, zoom, opts) {
  const mvp = snapshotEngine.draw(mesh, w, h, az, el, zoom, opts?.fixedHalfH || 0, opts);
  return {
    url: snapshotCanvas.toDataURL('image/png'),
    mesh,
    mvp,
    w: snapshotCanvas.width || w,
    h: snapshotCanvas.height || h,
  };
}

function drawSupersampledMeshToCtx(ctx, mesh, dstX, dstY, dstW, dstH, az, el, zoom = 1.0, fixedHalfH = 0, drawOpts = null, factor = 1.5) {
  const ss = clampRenderDimensions(
    Math.round(dstW * factor),
    Math.round(dstH * factor),
    Math.min(snapshotEngine.maxDim || 2048, 2200),
    3_600_000,
    Math.max(48, Math.round(Math.min(dstW, dstH))),
  );
  const mvp = snapshotEngine.draw(mesh, ss.width, ss.height, az, el, zoom, fixedHalfH, drawOpts);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(snapshotCanvas, 0, 0, snapshotCanvas.width, snapshotCanvas.height, dstX, dstY, dstW, dstH);
  return mvp;
}

function getCoverHeroGpuMaxDim() {
  const photo = getStudioPhotoEngine();
  if (photo && photo.isAvailable()) return photo.getMaxDimension();
  return snapshotEngine?.maxDim || 4096;
}

function getCoverHeroMesh(parts, theme) {
  const meshCacheKey = `__hero_mesh_${parts.length}`;
  let mesh = coverHeroCache.get(meshCacheKey);
  if (!mesh) {
    mesh = buildMeshBuffers([], parts, {
      highlightNew: false,
      fadePrev: false,
      showArrows: false,
      heroQuality: true,
      accent: theme?.accent || '#1a73e8',
    });
    coverHeroCache.set(meshCacheKey, mesh);
  }
  return { mesh, meshCacheKey };
}

function renderCoverHeroSnapshot(parts, az, el, zoom, targetW, targetH, theme) {
  const safeZoom = clampCoverZoom(zoom ?? 1.0);
  const photo = getStudioPhotoEngine();
  const maxDim = Math.max(1024, Math.min(4096, (photo && photo.isAvailable() ? photo.getMaxDimension() : snapshotEngine?.maxDim) || 4096));
  const rw = Math.max(480, Math.min(maxDim, Math.round(targetW)));
  const rh = Math.max(320, Math.min(maxDim, Math.round(targetH)));
  const darkTheme = isDarkHexColor(toHexColor(theme?.bgColor || '#ffffff', '#ffffff'));
  const cacheKey = `${parts.length}|${Math.round(az * 10)}|${Math.round(el * 10)}|${safeZoom}|${rw}x${rh}|${darkTheme ? 'd' : 'l'}`;
  if (coverHeroCache.has(cacheKey)) return coverHeroCache.get(cacheKey);

  // Reuse hero beveled mesh across angle/zoom/theme edits for instant responsiveness
  const { mesh, meshCacheKey } = getCoverHeroMesh(parts, theme);

  // Primary path: Photorealistic multi-pass WebGL Studio Renderer (triple softbox shadow maps,
  // linear-space GGX ABS plastic PBR, Fresnel softbox reflections, 3D shadow-catcher floor, SSAO)
  if (photo && photo.isAvailable()) {
    const rendered = photo.render(mesh, {
      azDeg: az,
      elDeg: el,
      width: rw,
      height: rh,
      zoom: safeZoom,
      darkBackground: darkTheme,
      getTextureImage: (texKey) => textureStore.getDecodedImage(texKey),
    });
    if (rendered) {
      const out = { url: rendered.url, mesh, mvp: null, w: rendered.width, h: rendered.height };
      if (coverHeroCache.size > 6) {
        const keepMesh = coverHeroCache.get(meshCacheKey);
        coverHeroCache.clear();
        if (keepMesh) coverHeroCache.set(meshCacheKey, keepMesh);
      }
      coverHeroCache.set(cacheKey, out);
      return out;
    }
  }

  // Fallback path if FBO shadow maps are unavailable on the current device
  const mvp = snapshotEngine.draw(mesh, rw, rh, az, el, safeZoom, 0, {
    tightFit: true,
    heroShading: true,
    lineAlpha: 0.32,
  });

  const comp = document.createElement('canvas');
  comp.width = rw;
  comp.height = rh;
  const cctx = comp.getContext('2d');
  if (cctx && mvp && mesh.triPos.length >= 9) {
    const minY = mesh.bounds.minY;
    const baseTol = minY + Math.max(10, (mesh.bounds.maxY - minY) * 0.09);
    let allMinX = Infinity, allMaxX = -Infinity, allMinY = Infinity, allMaxY = -Infinity;
    let baseMinX = Infinity, baseMaxX = -Infinity, baseMinY = Infinity, baseMaxY = -Infinity;
    const stride = Math.max(3, Math.floor(mesh.triPos.length / 9000) * 3);
    for (let i = 0; i < mesh.triPos.length; i += stride) {
      const vx = mesh.triPos[i], vy = mesh.triPos[i + 1], vz = mesh.triPos[i + 2];
      const ndc = projectWorldToNdc([vx, minY, vz], mvp);
      const sx = (ndc[0] * 0.5 + 0.5) * rw;
      const sy = (0.5 - ndc[1] * 0.5) * rh;
      if (sx < allMinX) allMinX = sx;
      if (sx > allMaxX) allMaxX = sx;
      if (sy < allMinY) allMinY = sy;
      if (sy > allMaxY) allMaxY = sy;
      if (vy <= baseTol) {
        if (sx < baseMinX) baseMinX = sx;
        if (sx > baseMaxX) baseMaxX = sx;
        if (sy < baseMinY) baseMinY = sy;
        if (sy > baseMaxY) baseMaxY = sy;
      }
    }

    const drawSoftEllipse = (cx, cy, rx, ry, innerAlpha, midAlpha) => {
      if (!Number.isFinite(cx) || rx <= 2 || ry <= 2) return;
      cctx.save();
      cctx.translate(cx, cy);
      cctx.scale(rx, ry);
      const g = cctx.createRadialGradient(0, 0, 0.05, 0, 0, 1);
      const rgb = darkTheme ? '0,0,0' : '15,23,42';
      g.addColorStop(0, `rgba(${rgb},${innerAlpha})`);
      g.addColorStop(0.55, `rgba(${rgb},${midAlpha})`);
      g.addColorStop(1, `rgba(${rgb},0)`);
      cctx.fillStyle = g;
      cctx.beginPath();
      cctx.arc(0, 0, 1, 0, Math.PI * 2);
      cctx.fill();
      cctx.restore();
    };

    if (Number.isFinite(allMinX)) {
      const ambCx = (allMinX + allMaxX) * 0.5;
      const ambCy = (allMinY + allMaxY) * 0.5 + rh * 0.012;
      const ambRx = Math.max(rw * 0.08, (allMaxX - allMinX) * 0.56);
      const ambRy = Math.max(rh * 0.025, Math.min(rh * 0.14, (allMaxY - allMinY) * 0.54 + rh * 0.024));
      drawSoftEllipse(ambCx, ambCy, ambRx, ambRy, darkTheme ? 0.36 : 0.13, darkTheme ? 0.16 : 0.06);
    }
    if (Number.isFinite(baseMinX)) {
      const conCx = (baseMinX + baseMaxX) * 0.5;
      const conCy = (baseMinY + baseMaxY) * 0.5 + rh * 0.006;
      const conRx = Math.max(rw * 0.05, (baseMaxX - baseMinX) * 0.52);
      const conRy = Math.max(rh * 0.014, Math.min(rh * 0.08, (baseMaxY - baseMinY) * 0.48 + rh * 0.012));
      drawSoftEllipse(conCx, conCy, conRx, conRy, darkTheme ? 0.48 : 0.22, darkTheme ? 0.22 : 0.09);
    }

    cctx.imageSmoothingEnabled = true;
    cctx.imageSmoothingQuality = 'high';
    cctx.drawImage(snapshotCanvas, 0, 0, rw, rh);
  }

  const out = { url: comp.toDataURL('image/png'), mesh, mvp, w: rw, h: rh };
  if (coverHeroCache.size > 18) coverHeroCache.clear();
  coverHeroCache.set(cacheKey, out);
  return out;
}

function renderMinifigOneToOne(parts, pagePxH, pageHIn, maxPxW, maxPxH, accent = '#1a73e8') {
  const mesh = buildMeshBuffers([], parts, { highlightNew: false, fadePrev: false, showArrows: false, accent });
  const widthLdu = Math.max(16, mesh.bounds.maxX - mesh.bounds.minX);
  const heightLdu = Math.max(24, mesh.bounds.maxY - mesh.bounds.minY);
  const layout = computeMinifigOneToOneLayout({ widthLdu, heightLdu }, pagePxH, pageHIn, maxPxW, maxPxH);
  const aspect = layout.worldSpanW / Math.max(1, layout.worldSpanH);
  const rh = Math.max(240, Math.min(960, Math.round(layout.displayPxH * 3.0)));
  const rw = Math.max(140, Math.round(rh * aspect));
  snapshotEngine.draw(mesh, rw, rh, 0, 0, 1.0, layout.fixedHalfH);
  return { url: snapshotCanvas.toDataURL('image/png'), ...layout };
}

const minifigDiagramCache = new Map();
const minifigSeqPlanCache = new Map();

function clearMinifigDiagramCaches() {
  minifigDiagramCache.clear();
  minifigSeqPlanCache.clear();
}

function getMinifigSequentialPlanForStep(step) {
  const key = `${step.id}|${(step.parts || []).map(p => `${p.id}:${p.p}:${p.c}`).join(',')}`;
  if (minifigSeqPlanCache.has(key)) return minifigSeqPlanCache.get(key);
  const plan = buildMinifigSequentialPlan(step.parts || [], (pid) => resolvePart(pid).name, computeWorldBox);
  if (minifigSeqPlanCache.size > 48) minifigSeqPlanCache.clear();
  minifigSeqPlanCache.set(key, plan);
  return plan;
}

function projectWorldToCanvasPt(pt, mvp, offX, offY, w, h) {
  const ndc = projectWorldToNdc(pt, mvp);
  return [offX + (ndc[0] * 0.5 + 0.5) * w, offY + (0.5 - ndc[1] * 0.5) * h];
}

function drawMinifigRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawVectorArrow2D(ctx, x0, y0, x1, y1, opts = {}) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < 6) return;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  const color = opts.color || '#1f2937';
  const lineW = Math.max(1.6, opts.lineWidth || 2.4);
  const headLen = Math.min(len * 0.44, Math.max(7, opts.headLen || lineW * 4.2));
  const headHalfW = Math.max(3.6, opts.headHalfW || headLen * 0.46);
  const shaftEndX = x1 - ux * (headLen * 0.85);
  const shaftEndY = y1 - uy * (headLen * 0.85);
  const baseLeftX = x1 - ux * headLen + px * headHalfW;
  const baseLeftY = y1 - uy * headLen + py * headHalfW;
  const baseRightX = x1 - ux * headLen - px * headHalfW;
  const baseRightY = y1 - uy * headLen - py * headHalfW;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (opts.haloColor) {
    ctx.strokeStyle = opts.haloColor;
    ctx.lineWidth = lineW + (opts.haloWidth || 3.2);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(shaftEndX, shaftEndY);
    ctx.stroke();

    ctx.fillStyle = opts.haloColor;
    ctx.strokeStyle = opts.haloColor;
    ctx.lineWidth = opts.haloWidth || 2.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(baseLeftX, baseLeftY);
    ctx.lineTo(baseRightX, baseRightY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = lineW;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(baseLeftX, baseLeftY);
  ctx.lineTo(baseRightX, baseRightY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFivePointStar2D(ctx, cx, cy, outerR, innerR, strokeColor, fillColor, lineWidth) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function drawMinifigCelebrationStarburst(ctx, cx, cy, radius, theme) {
  const bgHex = toHexColor(theme?.bgColor || '#ffffff', '#ffffff').toLowerCase();
  const darkBg = isDarkHexColor(bgHex);
  const pureWhiteBg = bgHex === '#ffffff' || bgHex === '#fefefe' || bgHex === '#fcfcfc' || bgHex === '#f9fafb';
  const cw = ctx.canvas.width || 320;
  const ch = ctx.canvas.height || 460;
  const maxFitR = Math.max(40, Math.min(radius, cw - cx - 6, cx - 6, cy - 6, ch - cy - 6));

  ctx.save();
  // Alternating luminous starburst rays radiating behind completed minifigure (official LEGO IMG_0315 Step 6!)
  const rayCount = 18;
  for (let i = 0; i < rayCount; i++) {
    const aMid = (i / rayCount) * Math.PI * 2;
    const halfSpread = ((Math.PI * 2) / rayCount) * (i % 2 === 0 ? 0.34 : 0.2);
    const rOuter = maxFitR * (i % 2 === 0 ? 1.0 : 0.8);
    const rInner = maxFitR * 0.14;
    const grad = ctx.createRadialGradient(cx, cy, rInner, cx, cy, rOuter);
    if (darkBg) {
      grad.addColorStop(0, 'rgba(255,255,255,0.22)');
      grad.addColorStop(0.6, 'rgba(255,255,255,0.09)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    } else if (pureWhiteBg) {
      grad.addColorStop(0, 'rgba(186,214,245,0.52)');
      grad.addColorStop(0.62, 'rgba(203,221,244,0.26)');
      grad.addColorStop(1, 'rgba(203,221,244,0)');
    } else {
      grad.addColorStop(0, 'rgba(255,255,255,0.72)');
      grad.addColorStop(0.62, 'rgba(255,255,255,0.34)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(aMid - halfSpread * 0.4) * rInner, cy + Math.sin(aMid - halfSpread * 0.4) * rInner);
    ctx.lineTo(cx + Math.cos(aMid - halfSpread) * rOuter, cy + Math.sin(aMid - halfSpread) * rOuter);
    ctx.lineTo(cx + Math.cos(aMid + halfSpread) * rOuter, cy + Math.sin(aMid + halfSpread) * rOuter);
    ctx.lineTo(cx + Math.cos(aMid + halfSpread * 0.4) * rInner, cy + Math.sin(aMid + halfSpread * 0.4) * rInner);
    ctx.closePath();
    ctx.fill();
  }

  // Three hollow 5-point outline stars floating around the completed minifigure (strictly inside stage bounds!)
  const starStroke = darkBg ? 'rgba(241,245,249,0.68)' : 'rgba(71,85,105,0.55)';
  const starFill = darkBg ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)';
  const lw = Math.max(1.3, maxFitR * 0.015);
  const starSpecs = [
    { dx: -0.14, dy: -0.80, r: 0.145 },
    { dx: 0.62, dy: -0.34, r: 0.165 },
    { dx: -0.62, dy: 0.54, r: 0.16 },
  ];
  for (const st of starSpecs) {
    const sr = Math.max(8, maxFitR * st.r);
    const sx = Math.max(sr + 6, Math.min(cw - sr - 6, cx + maxFitR * st.dx));
    const sy = Math.max(sr + 6, Math.min(ch - sr - 6, cy + radius * st.dy));
    drawFivePointStar2D(ctx, sx, sy, sr, sr * 0.43, starStroke, starFill, lw);
  }
  ctx.restore();
}

function drawProjectedMinifigArrows(ctx, arrows, mvp, offX, offY, w, h, colorMap, lineW, haloColor) {
  if (!mvp || !arrows || arrows.length === 0) return;
  for (const arr of arrows) {
    const p0 = projectWorldToCanvasPt(arr.from, mvp, offX, offY, w, h);
    const p1 = projectWorldToCanvasPt(arr.to, mvp, offX, offY, w, h);
    const col = colorMap[arr.color] || colorMap.blue || '#0088ce';
    drawVectorArrow2D(ctx, p0[0], p0[1], p1[0], p1[1], {
      color: col,
      lineWidth: lineW,
      headLen: Math.max(7, lineW * 4.0),
      headHalfW: Math.max(3.4, lineW * 1.8),
      haloColor,
      haloWidth: haloColor ? Math.max(2, lineW * 1.1) : 0,
    });
  }
}

/**
 * Option 1 (Official LEGO IMG_0316): Exploded Stack Callout
 * Left white vertical box with exploded body layers + red downward arrows,
 * black horizontal arrow -> completed standing minifigure + optional handheld accessory callout(s).
 */
function renderMinifigExplodedDiagram(step, cam, w, h, theme, zoom = 1.0) {
  const rw = Math.max(320, Math.round(w));
  const rh = Math.max(240, Math.round(h));
  const bgHex = toHexColor(theme?.bgColor || '#ffffff', '#ffffff');
  const darkBg = isDarkHexColor(bgHex);
  const cacheKey = `exp|${step.id}|${(step.parts || []).length}|${Math.round(cam.az)}|${Math.round(cam.el)}|${Math.round(zoom * 100)}|${rw}x${rh}|${darkBg ? 'd' : 'l'}`;
  if (minifigDiagramCache.has(cacheKey)) return minifigDiagramCache.get(cacheKey);

  const plan = buildMinifigExplodedPlan(step.parts || [], (pid) => resolvePart(pid).name, computeWorldBox);
  const comp = document.createElement('canvas');
  comp.width = rw;
  comp.height = rh;
  const ctx = comp.getContext('2d');
  if (!ctx) return { url: '', w: rw, h: rh, plan };

  const hasAcc = plan.accessoryCallouts.length > 0;
  const padX = Math.round(rw * 0.05);
  const padY = Math.round(rh * 0.06);

  // 1. Left white vertical exploded callout box (slender vertical proportions matching IMG_0316)
  const boxH = Math.round(rh - padY * 2);
  const boxW = Math.round(Math.min(rw * 0.34, Math.max(rw * 0.22, boxH * 0.42)));
  const boxX = Math.round(padX + Math.max(0, (rw * 0.4 - boxW) * 0.42));
  const boxY = padY;

  ctx.save();
  ctx.shadowColor = darkBg ? 'rgba(0,0,0,0.45)' : 'rgba(15,23,42,0.12)';
  ctx.shadowBlur = Math.max(4, rh * 0.014);
  ctx.shadowOffsetY = Math.max(1, rh * 0.004);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.restore();

  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = Math.max(1.6, Math.min(2.6, rh * 0.0042));
  ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1);

  // Render exploded body stack inside the white callout box
  const innerPadX = Math.round(boxW * 0.08);
  const innerPadY = Math.round(boxH * 0.045);
  const stackW = Math.max(48, boxW - innerPadX * 2);
  const stackH = Math.max(80, boxH - innerPadY * 2);
  const stackMesh = buildMeshBuffers([], plan.stackParts, {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    accent: theme?.accent || '#1a73e8',
    partOffsets: plan.stackOffsets,
  });
  const stackMvp = drawSupersampledMeshToCtx(
    ctx,
    stackMesh,
    boxX + innerPadX,
    boxY + innerPadY,
    stackW,
    stackH,
    cam.az,
    cam.el,
    Math.max(0.82, Math.min(1.18, zoom)),
    0,
    { tightFit: true },
    1.5,
  );

  // Crisp crimson-red vertical downward arrows between exploded body layers
  const redLineW = Math.max(1.8, Math.min(3.2, rh * 0.0048));
  drawProjectedMinifigArrows(
    ctx,
    plan.stackArrows,
    stackMvp,
    boxX + innerPadX,
    boxY + innerPadY,
    stackW,
    stackH,
    { red: '#d92626', blue: '#0088ce', dark: '#1f2937' },
    redLineW,
    'rgba(255,255,255,0.82)',
  );

  // 2. Right region: Completed standing minifigure (with headroom above if accessories exist)
  const connGap = Math.round(Math.max(42, rw * 0.11));
  const figAreaX = boxX + boxW + connGap;
  const figAreaW = Math.max(96, rw - figAreaX - padX);
  const figTopOffset = hasAcc ? Math.round(rh * 0.28) : Math.round(rh * 0.16);
  const figAreaH = Math.max(110, rh - figTopOffset - padY);
  const figAreaY = figTopOffset;

  const figMesh = buildMeshBuffers([], plan.assembledParts, {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    accent: theme?.accent || '#1a73e8',
  });
  const figMvp = drawSupersampledMeshToCtx(
    ctx,
    figMesh,
    figAreaX,
    figAreaY,
    figAreaW,
    figAreaH,
    cam.az,
    cam.el,
    Math.max(0.75, Math.min(1.25, zoom)),
    0,
    { tightFit: true },
    1.5,
  );

  // 3. Horizontal black connector arrow from lower-right edge of white callout box to the standing figure's legs
  const bodyBox = plan.decomposed.bodyBox;
  const legsTargetY = bodyBox.min[1] + (bodyBox.max[1] - bodyBox.min[1]) * 0.18;
  const figLeftLegPt = figMvp
    ? projectWorldToCanvasPt([bodyBox.min[0] - 3, legsTargetY, bodyBox.center[2]], figMvp, figAreaX, figAreaY, figAreaW, figAreaH)
    : [figAreaX + figAreaW * 0.3, boxY + boxH * 0.84];
  const arrowY = Math.max(boxY + boxH * 0.62, Math.min(boxY + boxH * 0.91, figLeftLegPt[1]));
  const arrowEndX = Math.max(boxX + boxW + 26, Math.min(figAreaX + figAreaW * 0.42, figLeftLegPt[0] - 8));
  drawVectorArrow2D(ctx, boxX + boxW + 1, arrowY, arrowEndX, arrowY, {
    color: darkBg ? '#f8fafc' : '#1f2937',
    lineWidth: Math.max(2.0, rh * 0.0046),
    headLen: Math.max(9, rh * 0.022),
    headHalfW: Math.max(4.5, rh * 0.0105),
    haloColor: darkBg ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.65)',
    haloWidth: 2.4,
  });

  // 4. Optional handheld accessory callout box(es) above the minifigure's hand(s) (matching IMG_0316 envelope box!)
  if (hasAcc && figMvp) {
    const shownAcc = plan.accessoryCallouts.slice(0, 2);
    const placedBoxes = [];
    for (let ai = 0; ai < shownAcc.length; ai++) {
      const acc = shownAcc[ai];
      const accCenterPt = projectWorldToCanvasPt(acc.box.center, figMvp, figAreaX, figAreaY, figAreaW, figAreaH);
      const accTopPt = projectWorldToCanvasPt(
        [acc.box.center[0], acc.box.max[1], acc.box.center[2]],
        figMvp,
        figAreaX,
        figAreaY,
        figAreaW,
        figAreaH,
      );

      const accBoxW = Math.round(Math.max(58, Math.min(rw * 0.16, rh * (acc.isMultiPart ? 0.18 : 0.21))));
      const accBoxH = Math.round(Math.max(46, Math.min(rh * (acc.isMultiPart ? 0.27 : 0.18), accTopPt[1] - padY - 26)));

      // Position cleanly above the accessory's X coordinate, avoiding the vertical stack box and other accessory boxes
      let ax = Math.round(accCenterPt[0] - accBoxW / 2);
      const minAx = boxX + boxW + 16;
      const maxAx = rw - padX - accBoxW;
      ax = Math.max(minAx, Math.min(maxAx, ax));
      for (const prevB of placedBoxes) {
        if (Math.abs(ax - prevB.x) < accBoxW + 10) {
          ax = Math.min(maxAx, prevB.x + prevB.w + 10);
        }
      }
      const ay = Math.round(Math.max(padY, Math.min(accTopPt[1] - accBoxH - 26, figAreaY - accBoxH * 0.35)));
      placedBoxes.push({ x: ax, y: ay, w: accBoxW, h: accBoxH });

      ctx.save();
      ctx.shadowColor = darkBg ? 'rgba(0,0,0,0.42)' : 'rgba(15,23,42,0.12)';
      ctx.shadowBlur = Math.max(3, rh * 0.01);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ax, ay, accBoxW, accBoxH);
      ctx.restore();
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = Math.max(1.5, rh * 0.0036);
      ctx.strokeRect(ax + 0.5, ay + 0.5, accBoxW - 1, accBoxH - 1);

      const aPad = Math.max(5, Math.round(Math.min(accBoxW, accBoxH) * 0.12));
      const aInnerW = Math.max(28, accBoxW - aPad * 2);
      const aInnerH = Math.max(28, accBoxH - aPad * 2);
      // Front-facing preview (primary part un-rotated to face the camera) so the piece is
      // recognizable; the assembled figure on the right keeps its exact posed rotation.
      const accDisplay = acc.display || acc;
      const accMesh = buildMeshBuffers([], accDisplay.parts, {
        highlightNew: false,
        fadePrev: false,
        showArrows: false,
        accent: theme?.accent || '#1a73e8',
        partOffsets: acc.isMultiPart ? accDisplay.subassemblyOffsets : {},
      });
      const accMvp = drawSupersampledMeshToCtx(
        ctx,
        accMesh,
        ax + aPad,
        ay + aPad,
        aInnerW,
        aInnerH,
        cam.az,
        cam.el,
        1.0,
        0,
        { tightFit: true },
        2.0,
      );

      if (acc.isMultiPart && accDisplay.subassemblyArrows.length > 0) {
        drawProjectedMinifigArrows(
          ctx,
          accDisplay.subassemblyArrows.map(a => ({ ...a, color: 'red' })),
          accMvp,
          ax + aPad,
          ay + aPad,
          aInnerW,
          aInnerH,
          { red: '#d92626', blue: '#0088ce', dark: '#1f2937' },
          Math.max(1.5, rh * 0.0036),
          'rgba(255,255,255,0.85)',
        );
      }

      // Crisp white-haloed downward pointer arrow straight to the accessory in the minifigure's hand
      const ptrStartX = Math.max(ax + 8, Math.min(ax + accBoxW - 8, accCenterPt[0]));
      const ptrStartY = ay + accBoxH + 1;
      const ptrEndX = accCenterPt[0];
      const ptrEndY = Math.max(ptrStartY + 14, accTopPt[1] - 3);
      drawVectorArrow2D(ctx, ptrStartX, ptrStartY, ptrEndX, ptrEndY, {
        color: darkBg ? '#f8fafc' : '#1f2937',
        lineWidth: Math.max(1.8, rh * 0.0038),
        headLen: Math.max(8, rh * 0.019),
        headHalfW: Math.max(4, rh * 0.009),
        haloColor: darkBg ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.92)',
        haloWidth: 2.8,
      });
    }
  }

  const out = { url: comp.toDataURL('image/png'), w: rw, h: rh, plan };
  if (minifigDiagramCache.size > 64) minifigDiagramCache.clear();
  minifigDiagramCache.set(cacheKey, out);
  return out;
}

/**
 * Option 2 (Official LEGO IMG_0315): Sequential Step-by-Step Minifigure Assembly
 * Renders one numbered sub-step (1, 2, 3...) at a shared foot baseline & physical scale,
 * with cyan-blue assembly arrows, warm peach multi-part accessory subassembly pill,
 * and final radial starburst + outline stars celebration!
 */
function renderMinifigSequentialStage(step, stage, plan, cam, w, h, theme, zoom = 1.0) {
  const rw = Math.max(200, Math.round(w));
  const rh = Math.max(240, Math.round(h));
  const bgHex = toHexColor(theme?.bgColor || '#ffffff', '#ffffff');
  const darkBg = isDarkHexColor(bgHex);
  const textColor = theme?.text || (darkBg ? '#f8fafc' : '#1f2937');
  const cacheKey = `seq|${step.id}|s${stage.stepNumber}|${(step.parts || []).length}|${Math.round(cam.az)}|${Math.round(cam.el)}|${Math.round(zoom * 100)}|${rw}x${rh}|${bgHex}|${textColor}`;
  if (minifigDiagramCache.has(cacheKey)) return minifigDiagramCache.get(cacheKey);

  const comp = document.createElement('canvas');
  comp.width = rw;
  comp.height = rh;
  const ctx = comp.getContext('2d');
  if (!ctx) return { url: '', w: rw, h: rh };

  const numColW = Math.round(rw * 0.14);
  const rightPad = Math.round(rw * 0.04);
  const topPad = Math.round(rh * 0.04);
  const botPad = Math.round(rh * 0.05);
  const figX = numColW;
  const figY = topPad;
  const figW = Math.max(96, rw - numColW - rightPad);
  const figH = Math.max(120, rh - topPad - botPad);

  const stageMesh = buildMeshBuffers(stage.baseParts, stage.addedParts, {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    accent: theme?.accent || '#1a73e8',
    partOffsets: stage.partOffsets || {},
  });
  const stageSs = clampRenderDimensions(
    Math.round(figW * 1.5),
    Math.round(figH * 1.5),
    Math.min(snapshotEngine.maxDim || 2048, 2200),
    3_600_000,
    Math.max(96, Math.min(figW, figH)),
  );
  const stageMvp = snapshotEngine.draw(
    stageMesh,
    stageSs.width,
    stageSs.height,
    cam.az,
    cam.el,
    Math.max(0.65, Math.min(1.6, zoom)),
    plan.sharedHalfH,
    { fixedCenter: plan.sharedCenter },
  );

  // 1. Celebratory starburst behind completed minifigure on the final sub-step (IMG_0315 Step 6!)
  if (stage.isCelebration && stageMvp) {
    const bodyBox = plan.decomposed.bodyBox;
    const centerPt = projectWorldToCanvasPt(bodyBox.center, stageMvp, figX, figY, figW, figH);
    const topPt = projectWorldToCanvasPt([bodyBox.center[0], bodyBox.max[1], bodyBox.center[2]], stageMvp, figX, figY, figW, figH);
    const botPt = projectWorldToCanvasPt([bodyBox.center[0], bodyBox.min[1], bodyBox.center[2]], stageMvp, figX, figY, figW, figH);
    const figVisualH = Math.max(80, Math.abs(botPt[1] - topPt[1]));
    drawMinifigCelebrationStarburst(ctx, centerPt[0], centerPt[1], figVisualH * 0.78, theme);
  }

  // 2. Composite crisp supersampled WebGL minifigure stage
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(snapshotCanvas, 0, 0, snapshotCanvas.width, snapshotCanvas.height, figX, figY, figW, figH);

  // 3. Crisp official LEGO cyan-blue assembly arrows
  const blueColor = darkBg ? '#38bdf8' : '#0088ce';
  const blueLineW = Math.max(2.0, Math.min(3.4, rh * 0.0056));
  drawProjectedMinifigArrows(
    ctx,
    stage.arrows,
    stageMvp,
    figX,
    figY,
    figW,
    figH,
    { blue: blueColor, red: '#d92626', dark: darkBg ? '#f8fafc' : '#1f2937' },
    blueLineW,
    darkBg ? 'rgba(15,23,42,0.55)' : 'rgba(255,255,255,0.68)',
  );

  // 4. Multi-part accessory subassembly warm peach rounded pill box (IMG_0315 Step 5 lightsaber!)
  if (stage.accessoryPill && stageMvp) {
    const acc = stage.accessoryPill;
    const accTopPt = projectWorldToCanvasPt(
      [acc.box.center[0], acc.box.max[1], acc.box.center[2]],
      stageMvp,
      figX,
      figY,
      figW,
      figH,
    );
    // Pill shows the front-facing preview; the figure keeps the posed accessory
    const accDisplay = acc.display || acc;
    const accSpanX = accDisplay.box.max[0] - accDisplay.box.min[0];
    const accSpanY = accDisplay.box.max[1] - accDisplay.box.min[1];
    const isTallAcc = accSpanY >= accSpanX * 0.8;

    const pillW = Math.round(
      isTallAcc
        ? Math.max(46, Math.min(rw * 0.25, rh * 0.145))
        : Math.max(72, Math.min(rw * 0.42, rh * 0.26)),
    );
    const maxAvailH = Math.max(72, accTopPt[1] - topPad - 28);
    const pillH = Math.round(
      isTallAcc
        ? Math.max(76, Math.min(maxAvailH, rh * 0.36))
        : Math.max(52, Math.min(maxAvailH, rh * 0.22)),
    );
    const pillX = Math.round(Math.max(numColW + 4, Math.min(rw - rightPad - pillW, accTopPt[0] - pillW / 2)));
    const pillY = Math.round(Math.max(topPad + 2, accTopPt[1] - pillH - 28));

    ctx.save();
    drawMinifigRoundedRect(ctx, pillX, pillY, pillW, pillH, Math.min(14, pillW * 0.28));
    ctx.fillStyle = '#fde4a6';
    ctx.fill();
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = Math.max(1.6, rh * 0.004);
    ctx.stroke();
    ctx.restore();

    const pPadX = Math.max(5, Math.round(pillW * 0.14));
    const pPadY = Math.max(6, Math.round(pillH * 0.08));
    const pInnerW = Math.max(24, pillW - pPadX * 2);
    const pInnerH = Math.max(36, pillH - pPadY * 2);
    const pillMesh = buildMeshBuffers([], accDisplay.parts, {
      highlightNew: false,
      fadePrev: false,
      showArrows: false,
      accent: theme?.accent || '#1a73e8',
      partOffsets: accDisplay.subassemblyOffsets || {},
    });
    const pillMvp = drawSupersampledMeshToCtx(
      ctx,
      pillMesh,
      pillX + pPadX,
      pillY + pPadY,
      pInnerW,
      pInnerH,
      cam.az,
      cam.el,
      1.0,
      0,
      { tightFit: true },
      2.0,
    );

    // Blue downward arrow inside the warm peach pill (blade -> hilt)
    drawProjectedMinifigArrows(
      ctx,
      accDisplay.subassemblyArrows,
      pillMvp,
      pillX + pPadX,
      pillY + pPadY,
      pInnerW,
      pInnerH,
      { blue: '#0088ce', red: '#d92626', dark: '#1f2937' },
      Math.max(1.8, rh * 0.0044),
      'rgba(253,228,166,0.8)',
    );

    // Crisp black downward arrow from peach pill straight down to the accessory in the minifigure's hand
    const ptrX = Math.max(pillX + 10, Math.min(pillX + pillW - 10, accTopPt[0]));
    const ptrY0 = pillY + pillH + 1;
    const ptrY1 = Math.max(ptrY0 + 14, accTopPt[1] - 4);
    drawVectorArrow2D(ctx, ptrX, ptrY0, accTopPt[0], ptrY1, {
      color: darkBg ? '#f8fafc' : '#1f2937',
      lineWidth: Math.max(1.9, rh * 0.0044),
      headLen: Math.max(9, rh * 0.022),
      headHalfW: Math.max(4.4, rh * 0.01),
      haloColor: darkBg ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.6)',
      haloWidth: 2.0,
    });
  }

  // 5. Crisp official LEGO sequential step number (1, 2, 3...) positioned to the left of the minifigure
  const bodyBox = plan.decomposed.bodyBox;
  const torsoLevelPt = stageMvp
    ? projectWorldToCanvasPt([bodyBox.min[0], bodyBox.min[1] + (bodyBox.max[1] - bodyBox.min[1]) * 0.56, bodyBox.center[2]], stageMvp, figX, figY, figW, figH)
    : [figX, figY + figH * 0.65];
  const fontSize = Math.round(Math.max(18, Math.min(34, rh * 0.072, rw * 0.11)));
  ctx.save();
  ctx.fillStyle = textColor;
  ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const numX = Math.max(4, Math.round(rw * 0.035));
  const numY = Math.max(fontSize, Math.min(rh - fontSize, Math.round(torsoLevelPt[1])));
  ctx.fillText(String(stage.stepNumber), numX, numY);
  ctx.restore();

  const out = { url: comp.toDataURL('image/png'), w: rw, h: rh };
  if (minifigDiagramCache.size > 96) minifigDiagramCache.clear();
  minifigDiagramCache.set(cacheKey, out);
  return out;
}

// =========================================================================
// 3. STUDIO .io PARSER WITH PRE-ASSEMBLED MINIFIGURE FUSION + ZERO-FLOATING STEP GENERATOR
// =========================================================================
function splitMpd(src, fallbackName) {
  const map = new Map();
  const lines = src.replace(/^\uFEFF/, '').split(/\r?\n/);
  let name = fallbackName, buf = [], sawFile = false;
  let dataName = null, dataChunks = [];
  const flushFile = () => { if (buf.length > 0 && name) map.set(normalizeMpdSubfileKey(name), { name, lines: buf }); };
  const flushData = () => {
    if (dataName && dataChunks.length > 0) {
      textureStore.registerBase64Texture(dataChunks.join(''), { name: dataName, source: 'embedded' });
    }
    dataName = null;
    dataChunks = [];
  };
  for (const raw of lines) {
    const l = raw.trim(); if (!l) continue;
    const mFile = l.match(/^0\s+FILE\s+(.+)$/i);
    if (mFile) {
      flushData();
      // Ignore comment-only preambles before the first `0 FILE` so the first real subfile becomes root
      if (sawFile || (buf.length > 0 && hasMpdGeometryOrPartLines(buf))) flushFile();
      sawFile = true;
      name = mFile[1].trim();
      buf = [];
      continue;
    }
    const mData = l.match(/^0\s+!DATA\s+(.+)$/i);
    if (mData) {
      flushData();
      if (sawFile || (buf.length > 0 && hasMpdGeometryOrPartLines(buf))) flushFile();
      sawFile = true;
      name = null;
      buf = [];
      dataName = mData[1].trim();
      dataChunks = [];
      continue;
    }
    if (/^0\s+NOFILE\b/i.test(l)) { flushData(); flushFile(); name = null; buf = []; continue; }
    if (dataName) {
      const mChunk = l.match(/^0\s+!:\s*(.+)$/);
      if (mChunk) dataChunks.push(mChunk[1].trim());
      continue;
    }
    if (!name) name = fallbackName;
    buf.push(l);
  }
  flushData();
  flushFile();
  return map;
}

function registerEmbeddedDatEntry(sf, source = 'embedded') {
  const nk = normId(sf.name);
  const movedTarget = extractMovedToTarget(sf.lines);
  if (movedTarget && movedTarget !== nk) movedToAliases.set(nk, movedTarget);
  const cleanTitle = extractCleanDatTitle(sf.lines);
  const title = cleanTitle || cleanSubName(sf.name);
  embeddedDatRaw.set(nk, sf.lines);
  if (cleanTitle || !movedTarget) embeddedDatTitles.set(nk, title);
  textureStore.scanDatLinesForTextures(sf.lines, source);
  // Also alias BrickLink Studio `0 BL_Item_No <id>` so model.ldr refs like `3626pb3988` resolve directly to `bl_3626pb3988`
  for (let i = 0; i < Math.min(sf.lines.length, 16); i++) {
    const mBl = sf.lines[i].match(/^0\s+BL_Item_No\s+(\S+)/i);
    if (mBl && mBl[1] && mBl[1] !== '-1') {
      const alias = normId(mBl[1]);
      if (alias && alias !== nk && !embeddedDatRaw.has(alias)) {
        embeddedDatRaw.set(alias, sf.lines);
        if (cleanTitle || !movedTarget) embeddedDatTitles.set(alias, title);
      }
      break;
    }
  }
}

function cleanSubName(raw) {
  return String(raw || 'Main Build').replace(/\.(ldr|mpd|io)$/i,'').replace(/\s+copy(\s*\d+)?$/i,'').trim() || 'Main Build';
}

function isAssemblySubfile(sf) {
  if (!sf) return false;
  if (sf.lines.some(l => /^0\s+IsAssembly\s+True/i.test(l))) return true;
  if (sf.lines.some(l => /^0\s+FlexibleBrick:/i.test(l))) return true;
  const nk = normId(sf.name);
  if (/^(bl_)?(973|76382|3815|970|970c|3815c)[a-z0-9_]*c\d+/i.test(nk)) return true;
  return false;
}

function getSubfileTitle(sf) {
  return extractCleanDatTitle(sf.lines) || cleanSubName(sf.name);
}

async function readZipEntryBytes(bytes, view, entry) {
  if (entry.flags & 1) throw new Error('This .io file uses legacy Studio encryption. Re-save in Studio 2.x or export as .ldr.');
  const lOff = entry.localOffset;
  const dataStart = lOff + 30 + view.getUint16(lOff + 26, true) + view.getUint16(lOff + 28, true);
  const compBytes = bytes.subarray(dataStart, dataStart + entry.compSize);
  if (entry.method === 0) return compBytes;
  if (entry.method === 8) {
    const stream = new Blob([compBytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }
  throw new Error(`Unsupported ZIP method (${entry.method}).`);
}

async function readZipEntryText(bytes, view, entry) {
  const u8 = await readZipEntryBytes(bytes, view, entry);
  return new TextDecoder().decode(u8);
}

function bytesToBase64(u8) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + chunk));
  }
  return btoa(bin);
}

async function extractIoArchive(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Not a valid BrickLink Studio (.io) archive.');
  const cdCount = view.getUint16(eocd + 10, true);
  let ptr = view.getUint32(eocd + 16, true);
  const entries = [];
  for (let i = 0; i < cdCount; i++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const flags = view.getUint16(ptr + 8, true);
    const method = view.getUint16(ptr + 10, true);
    const compSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localOffset = view.getUint32(ptr + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    entries.push({ name, flags, method, compSize, localOffset });
    ptr += 46 + nameLen + extraLen + commentLen;
  }

  const pick = (target) => entries.find(e => e.name.toLowerCase().split('/').pop() === target);
  const m1Entry = pick('model.ldr') || pick('modelv2.ldr') || entries.find(e => /\.(ldr|mpd)$/i.test(e.name));
  const m2Entry = pick('model2.ldr');
  if (!m1Entry && !m2Entry) throw new Error('Could not find model.ldr inside this .io file.');

  const m1Text = m1Entry ? await readZipEntryText(bytes, view, m1Entry) : '';
  const m2Text = m2Entry ? await readZipEntryText(bytes, view, m2Entry) : '';

  embeddedDatRaw.clear(); embeddedDatTitles.clear(); embeddedDatCompiled.clear(); compositePartDefs.clear(); pliThumbCache.clear(); submodelThumbCache.clear(); clearMinifigDiagramCaches(); overviewThumbCache.bumpEpoch();
  textureStore.clearEmbedded();

  // Extract any embedded texture PNGs bundled directly in the .io archive (skipping thumbnail.png)
  for (const ent of entries) {
    const lowerName = ent.name.toLowerCase();
    const baseName = lowerName.split('/').pop() || '';
    if (!/\.(png|jpg|jpeg|webp)$/i.test(baseName) || baseName === 'thumbnail.png' || (ent.flags & 1)) continue;
    try {
      const u8 = await readZipEntryBytes(bytes, view, ent);
      if (u8.length > 24) {
        textureStore.registerBase64Texture(bytesToBase64(u8), { name: ent.name, source: 'embedded' });
      }
    } catch (_) {}
  }

  if (m2Text) {
    const m2Map = splitMpd(m2Text, 'model2.ldr');
    for (const sf of m2Map.values()) {
      const isPart = sf.name.toLowerCase().endsWith('.dat') || sf.lines.some(l => /^0\s+IsSubModel\s+False/i.test(l));
      if (isPart) {
        registerEmbeddedDatEntry(sf, 'embedded');
      }
    }
  }
  await textureStore.predecodeAllPending();
  return { m1Text, m2Text };
}

function flattenMpd(source, fileName, useIsSubModelFlag = false) {
  const subfiles = splitMpd(source, fileName);
  const root = subfiles.values().next().value;
  if (!root) return { parts: [], hasSteps: false, submodelCount: 0 };
  const parts = [];
  let hasSteps = false, submodelCount = 0, seq = 0, asmSeq = 0, subInstSeq = 0;

  const visit = (sf, px, py, pz, pm, parentCol, topSub, depth, assemblyTag, subChain) => {
    if (!sf || depth > 18) return;
    let stepIdx = 0;
    for (const line of sf.lines) {
      if (/^0\s+STEP\b/i.test(line)) { stepIdx++; hasSteps = true; continue; }
      if (!line.startsWith('1 ') && !line.startsWith('11 ')) continue;
      const t = line.split(/\s+/);
      if (t.length < 15) continue;
      const c = parseLDrawColorToken(t[1], parentCol);
      const lx=+t[2], ly=+t[3], lz=+t[4];
      const lm=[+t[5],+t[6],+t[7], +t[8],+t[9],+t[10], +t[11],+t[12],+t[13]];
      if ([lx,ly,lz,...lm].some(n => !isFinite(n))) continue;
      const r = m3v(pm, lx, ly, lz);
      const wx = px+r[0], wy = py+r[1], wz = pz+r[2];
      const wm = mat3Mul(pm, lm);
      const ref = t.slice(14).join(' ').trim();
      const child = subfiles.get(normalizeMpdSubfileKey(ref));

      // Detect pre-assembled LEGO assemblies (Minifig Torso+Arms+Hands, Hips+Legs) -> tag all children with same assemblyTag!
      const childIsAsm = !assemblyTag && child && isAssemblySubfile(child);
      const childLooksLikePart = child && isLDrawPartSubfile(child.name, child.lines);
      const isChildSub = useIsSubModelFlag
        ? (child && child.lines.some(l => /^0\s+IsSubModel\s+True/i.test(l)))
        : (child && (childIsAsm || !childLooksLikePart));

      if (isChildSub && child !== sf) {
        if (depth === 0 && !childIsAsm) submodelCount++;
        const nextAsm = childIsAsm
          ? { id: 'asm_' + (++asmSeq), key: normId(child.name.replace(/\s+copy(\s*\d+)?$/i,'')), name: getSubfileTitle(child), rootPos: [wx, -wy, -wz] }
          : assemblyTag;
        const cleanName = cleanSubName(child.name);
        const nextChain = childIsAsm ? subChain : [...subChain, { name: cleanName, instId: ++subInstSeq }];
        visit(child, wx, wy, wz, wm, c, topSub || (childIsAsm ? null : cleanName), depth + 1, nextAsm, nextChain);
      } else {
        parts.push({
          id: 'imp_' + (++seq),
          p: normId(ref),
          c,
          x: wx, y: -wy, z: -wz,
          m: [wm[0],-wm[1],-wm[2], -wm[3],wm[4],wm[5], -wm[6],wm[7],wm[8]],
          sub: topSub || 'Main Build',
          subChain,
          origStep: stepIdx,
          asm: assemblyTag || null,
        });
      }
    }
  };
  visit(root, 0, 0, 0, R_ID, 71, null, 0, null, []);
  return { parts, hasSteps, submodelCount };
}

// Fuse tagged pre-assembled minifigure parts (Torso+Arms+Hands -> 1 piece, Hips+Legs -> 1 piece)!
function fuseAssemblies(rawParts) {
  const out = [];
  const asmMap = new Map();
  for (const p of rawParts) {
    if (p.asm) {
      let group = asmMap.get(p.asm.id);
      if (!group) {
        const compKey = 'asm_' + p.asm.key + '_' + p.c;
        compositePartDefs.set(compKey, { name: p.asm.name });
        group = {
          id: p.asm.id,
          p: compKey,
          c: p.c,
          x: p.asm.rootPos[0], y: p.asm.rootPos[1], z: p.asm.rootPos[2],
          m: R_ID,
          sub: p.sub,
          subChain: p.subChain || [],
          origStep: p.origStep,
          children: [],
        };
        asmMap.set(p.asm.id, group);
        out.push(group);
      }
      group.children.push(p);
    } else {
      out.push(p);
    }
  }
  // Center composite root coordinates on average of children for clean thumbnails & arrows
  for (const g of asmMap.values()) {
    let sx=0, sy=0, sz=0;
    for (const c of g.children) { sx += c.x; sy += c.y; sz += c.z; }
    g.x = sx / g.children.length; g.y = sy / g.children.length; g.z = sz / g.children.length;
  }
  return out;
}

function parseImportedModel(m1Text, m2Text, fileName) {
  if (m1Text) {
    const m1Map = splitMpd(m1Text, fileName);
    for (const sf of m1Map.values()) {
      const isEmbeddedPart = isLDrawPartSubfile(sf.name, sf.lines);
      if (isEmbeddedPart) {
        const nk = normId(sf.name);
        if (!embeddedDatRaw.has(nk)) {
          registerEmbeddedDatEntry(sf, 'embedded');
        } else {
          textureStore.scanDatLinesForTextures(sf.lines, 'embedded');
        }
      }
    }
  }
  const f1 = m1Text ? flattenMpd(m1Text, fileName, false) : { parts:[], hasSteps:false, submodelCount:0 };
  const f2 = m2Text ? flattenMpd(m2Text, fileName, true) : { parts:[], hasSteps:false, submodelCount:0 };
  let rawParts;
  if (f2.parts.length > 0 && f2.parts.length === f1.parts.length) {
    // 1-to-1 pair: exact .dat meshes & IsAssembly tags from model2.ldr + exact standard LDraw colors from model.ldr!
    rawParts = f2.parts.map((p2, idx) => ({ ...p2, c: f1.parts[idx].c, origStep: f1.parts[idx].origStep }));
  } else if (f1.parts.length > 0) {
    rawParts = f1.parts;
  } else {
    rawParts = f2.parts;
  }
  if (rawParts.length === 0) throw new Error('No LEGO part placements found inside this file.');
  const parts = fuseAssemblies(rawParts);
  return {
    title: cleanSubName(fileName),
    parts,
    hasSteps: f1.hasSteps || f2.hasSteps,
    submodelCount: Math.max(f1.submodelCount, f2.submodelCount),
  };
}

function computeLeafWorldBox(part) {
  const compiled = compileEmbeddedDat(part.p);
  let lMin, lMax;
  if (compiled) { lMin = compiled.min; lMax = compiled.max; }
  else {
    const def = resolvePart(part.p);
    const hx = (def.sx*20)/2, hz = (def.sz*20)/2;
    if (def.shape === 'mf_torso_body') {
      lMin = [-19, -32, -10];
      lMax = [19, 11.2, 10];
    } else if (def.shape === 'mf_torso') {
      const sh = isBrickLinkTorsoAssemblyId(normId(part.p)) ? [-20, 32, -10] : [0, 0, 0];
      lMin = [sh[0] - 27, sh[1] - 32, sh[2] - 10];
      lMax = [sh[0] + 27, sh[1] + 11.2, sh[2] + 19];
    } else if (def.shape === 'mf_head') {
      lMin = [-12.6, -24, -12.6];
      lMax = [12.6, 4.2, 12.6];
    } else {
      lMin = [-hx, -def.h, -hz]; lMax = [hx, def.studs ? 4 : 0, hz];
    }
  }
  let mn=[Infinity,Infinity,Infinity], mx=[-Infinity,-Infinity,-Infinity];
  for (const x of [lMin[0],lMax[0]]) for (const y of [lMin[1],lMax[1]]) for (const z of [lMin[2],lMax[2]]) {
    const w = xformPt([x,y,z], part.m || R_ID, part.x, part.y, part.z, 0);
    if(w[0]<mn[0])mn[0]=w[0]; if(w[1]<mn[1])mn[1]=w[1]; if(w[2]<mn[2])mn[2]=w[2];
    if(w[0]>mx[0])mx[0]=w[0]; if(w[1]>mx[1])mx[1]=w[1]; if(w[2]>mx[2])mx[2]=w[2];
  }
  return { min: mn, max: mx, center: [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2] };
}

function computeWorldBox(part) {
  if (part.children && part.children.length > 0) {
    let mn=[Infinity,Infinity,Infinity], mx=[-Infinity,-Infinity,-Infinity];
    for (const ch of part.children) {
      const b = computeLeafWorldBox(ch);
      for (let k=0;k<3;k++) { if(b.min[k]<mn[k])mn[k]=b.min[k]; if(b.max[k]>mx[k])mx[k]=b.max[k]; }
    }
    return { min: mn, max: mx, center: [(mn[0]+mx[0])/2, (mn[1]+mx[1])/2, (mn[2]+mx[2])/2] };
  }
  return computeLeafWorldBox(part);
}

function computeLeafWorldSubBoxes(leaf) {
  const compiled = compileEmbeddedDat(leaf.p);
  if (!compiled || !compiled.subBoxes || compiled.subBoxes.length <= 1) return null;
  const m = leaf.m || R_ID;
  return compiled.subBoxes.map(sb => transformLocalBox6ToWorld(sb, m, leaf.x, leaf.y, leaf.z));
}

function computeWorldSubBoxes(part) {
  if (part.children && part.children.length > 0) {
    const nonWheelChildren = part.children.filter(ch => classifyPartRole(ch) !== 'wheel');
    const activeChildren = nonWheelChildren.length > 0 ? nonWheelChildren : part.children;
    const out = [];
    for (const ch of activeChildren) {
      const subs = computeLeafWorldSubBoxes(ch);
      if (subs) out.push(...subs);
      else out.push(computeLeafWorldBox(ch));
    }
    return out.length > 1 ? out : null;
  }
  return computeLeafWorldSubBoxes(part);
}

// Identify wheels, wheel holders, axles, and loose accessories so Step 1 NEVER starts on a floating wheel!
function classifyPartRole(part) {
  const k = normId(part.p);
  const name = (resolvePart(part.p).name || '').toLowerCase();
  if (/^(?:bl_)?(?:38339|2878|4025|4092|65632|28740|bb892|88011|88002)(?:c\d+)?[a-z]?$/.test(k) ||
      /wheel\s*holder|bogie\s*(?:plate|holder)|train\s*motor/i.test(name)) {
    return 'wheel_holder';
  }
  if (/^(?:bl_)?(?:38340|55423|57878|50254|2928|4180|7049|73983|85489|65734|65735|64711)(?:c\d+)?[a-z]?$/.test(k) ||
      (/\b(wheel|tire|tyre|rim)\b/.test(name) && !/holder|bogie|motor|plate|brick|arch|fender|mudguard|steering|ship|cog|gear|pulley|knob\s+wheel|belt\s+wheel/.test(name))) {
    return 'wheel';
  }
  if (/^(?:bl_)?(?:32062|4519|3705|32073|3706|44294|3707|60485|3737|23948|3708|50451|50450|6587|24316|87083|15462|32209|55013)[a-z]?$/.test(k) ||
      (/\baxle\b/.test(name) && !/hole|brick|plate|wheel|connector|hub|frame|beam|liftarm|bush|gear|cam|holder|steering/.test(name))) {
    return 'axle';
  }
  if (classifyMinifigGroupKind(part, (pid) => resolvePart(pid).name) !== null) return 'figure';
  if (/plate|brick|tile|frame|base|beam|liftarm|chassis|slope|panel|bracket|hinge|turntable/.test(name)) return 'structural';
  return 'detail';
}

// Detect smooth finish tiles & sideways (SNOT) decorative cladding that should NOT
// stick out/hang in mid-air before the structural walls & supports behind their full height are built.
function isSidewaysCladdingPart(part, box) {
  if (!part || part.children) return false;
  const m = part.m || R_ID;
  const isSideways = Math.abs(m[4]) < 0.5; // local +Y stud axis rotated sideways (SNOT)
  const def = resolvePart(part.p);
  const name = (def.name || '').toLowerCase();
  const isSmoothTile = /\btile\b/.test(name) && !/clip|hinge|bar|holder|handle|modified|turntable/.test(name);
  const isFinishCladding = isSmoothTile || (def.studs === false && !/wheel|tire|tyre|rim|axle|pin|bar|rod|technic|bracket|hinge|clip|holder|window|door|seat|chair|steering/.test(name));
  const dy = box ? (box.max[1] - box.min[1]) : 0;
  return (isSideways && isFinishCladding) || (isSmoothTile && dy > 20);
}

// Effective build-layer height for bottom-up ordering:
// Upright bricks build from their bottom (min.y); sideways/vertical cladding tiles wait for their TOP (max.y)
// so walls and upper SNOT anchors behind them are solidly in place first.
function computeBuildLayerY(part, box) {
  if (isSidewaysCladdingPart(part, box)) return box.max[1] + 8;
  const def = resolvePart(part.p);
  const name = (def.name || '').toLowerCase();
  const isSmoothTile = /\btile\b/.test(name) && !/clip|hinge|bar|holder|handle|modified|turntable/.test(name);
  return isSmoothTile ? box.min[1] + 6 : box.min[1];
}

// Returns true when a tall vertical/sideways cladding tile still has unplaced non-cladding wall/SNOT
// supports along its upper half (prevents sticking a tall tile straight up into empty air).
function isCladdingWaitingForUpperSupport(idx, claddingFlags, boxes, adj, placed) {
  if (!claddingFlags[idx]) return false;
  const b = boxes[idx];
  if (b.max[1] - b.min[1] <= 24) return false;
  const upperNbs = adj[idx].filter(nb => boxes[nb].max[1] >= b.center[1] && !claddingFlags[nb]);
  if (upperNbs.length === 0) return false;
  return !upperNbs.some(nb => placed.has(nb));
}

// True ONLY if a part has genuine sideways connection capability (SNOT orientation, side studs,
// brackets, clips, hinges, Technic pins/holes, bars, axles, window frames/glass, etc.).
// Two plain upright bricks/plates/slopes/tiles grazing side-by-side do NOT physically stick together!
function canConnectSideways(part, role) {
  if (!part) return true;
  if (role === 'wheel' || role === 'axle' || role === 'figure') return true;
  const m = part.m || R_ID;
  if (Math.abs(m[4]) < 0.5) return true; // SNOT / sideways-mounted part
  const k = normId(part.p);
  const def = resolvePart(part.p);
  const name = (def.name || '').toLowerCase();
  if (def.shape === 'snot1' || def.shape === 'snot4' || def.shape === 'clip_h' || def.shape === 'clip_v' || def.shape === 'bar' || def.shape === 'axle' || def.shape === 'bracket' || def.shape === 'bracket_inv' || def.shape === 'technic_brick' || def.shape === 'window_frame') return true;
  if (/snot|bracket|clip|hinge|bar|axle|pin|technic|liftarm|beam|turntable|handle|hook|grab|magnet|coupler|buffer|ball|socket|window|glass|door|fence|rail|ladder|hose|antenna|lever/.test(name)) return true;
  if (/^(3937|3938|44302|63868|37494|92582|2429|2430|3700|3701|3702|3894|32000|32018|6541|4070|87087|4733|47905|22885|99206|99207|99780|99781|44728|60475|15712|60470|6019|4085|36840|36841|29085|bb892)/.test(k)) return true;
  return false;
}

// Strict LEGO clutch contact check:
// - Train wheels attach ONLY to wheel holders or Technic axles.
// - Upright bricks/plates/slopes/tiles connect via vertical stud footprint overlap (ovX >= 3 && ovZ >= 3),
//   NOT by grazing smooth vertical side walls (which caused floating inverted slopes & train-body bleed into bogies!).
// - Sideways contacts require either 3-axis interlocking (SNOT studs/pins/clips engaged >= 1.5 LDU)
//   or BOTH parts having sideways/SNOT/clip/hinge/window connection capability.
function boxesPhysicallyTouch(a, b, roleA, roleB, sideCapA = true, sideCapB = true, subA = null, subB = null) {
  return partsPhysicallyTouch(a, b, subA, subB, roleA, roleB, sideCapA, sideCapB);
}

function mat3Transpose(m) {
  return [m[0],m[3],m[6], m[1],m[4],m[7], m[2],m[5],m[8]];
}
function mat3Det(m) {
  return m[0]*(m[4]*m[8]-m[5]*m[7]) - m[1]*(m[3]*m[8]-m[5]*m[6]) + m[2]*(m[3]*m[7]-m[4]*m[6]);
}

// Normalize a single canonical copy of a submodel to centered local coordinates (bottom at y=0)
function normalizeCanonicalSubParts(rawList, prefix) {
  let mnX = Infinity, mnY = Infinity, mnZ = Infinity, mxX = -Infinity, mxZ = -Infinity;
  for (const p of rawList) {
    const b = computeWorldBox(p);
    if (b.min[0] < mnX) mnX = b.min[0]; if (b.max[0] > mxX) mxX = b.max[0];
    if (b.min[1] < mnY) mnY = b.min[1];
    if (b.min[2] < mnZ) mnZ = b.min[2]; if (b.max[2] > mxZ) mxZ = b.max[2];
  }
  const cx = isFinite(mnX) ? (mnX + mxX) / 2 : 0;
  const cy = isFinite(mnY) ? mnY : 0;
  const cz = isFinite(mnZ) ? (mnZ + mxZ) / 2 : 0;
  return rawList.map((p, idx) => ({
    ...p,
    id: `${prefix}_c${idx}`,
    x: p.x - cx,
    y: p.y - cy,
    z: p.z - cz,
    children: p.children ? p.children.map((ch, ci) => ({
      ...ch,
      id: `${prefix}_c${idx}_${ci}`,
      x: ch.x - cx,
      y: ch.y - cy,
      z: ch.z - cz,
    })) : undefined,
  }));
}

function autoNameDuplicateSubmodel(indices, parts, fallbackNum) {
  const names = indices.map(i => (resolvePart(parts[i].p).name || '').toLowerCase());
  if (names.some(n => /wheel|bogie/.test(n))) return 'Wheel Assembly';
  if (names.some(n => /window|glass|windscreen/.test(n))) return 'Window Module';
  if (names.some(n => /door/.test(n))) return 'Door Assembly';
  if (names.some(n => /seat|chair/.test(n))) return 'Seat Assembly';
  if (names.some(n => /bracket|hinge|clip/.test(n))) return 'Side Assembly';
  if (names.some(n => /slope|wedge|arch/.test(n))) return 'Body Module';
  return `Submodel ${fallbackNum}`;
}

// Detect duplicate submodels AUTOMATICALLY:
// Stage 1: Explicit file submodels (.io / .mpd) appearing >= 2 times
// Stage 2: Submodel-agnostic geometric rigid-body duplicate detection on remaining bricks!
function detectDuplicateSubassemblies(parts, boxes, adj, roles) {
  if (!state.detectDuplicates || parts.length < 6) return [];
  const maxSubSize = Math.min(36, Math.max(8, Math.floor(parts.length * 0.28)));
  const candidates = [];

  // Stage 1: Explicit submodel instances from .io / .mpd files
  const byInst = new Map();
  for (let i = 0; i < parts.length; i++) {
    const chain = parts[i].subChain || [];
    for (const entry of chain) {
      if (!byInst.has(entry.instId)) byInst.set(entry.instId, { name: entry.name, indices: [] });
      byInst.get(entry.instId).indices.push(i);
    }
  }
  const byExplicitSig = new Map();
  for (const rec of byInst.values()) {
    if (rec.indices.length < 2 || rec.indices.length > maxSubSize) continue;
    if (rec.indices.every(i => roles[i] === 'figure')) continue;
    const sig = rec.indices.map(i => `${parts[i].p}:${parts[i].c}`).sort().join('|');
    if (!byExplicitSig.has(sig)) byExplicitSig.set(sig, []);
    byExplicitSig.get(sig).push(rec);
  }
  for (const instList of byExplicitSig.values()) {
    const disjoint = [];
    const seen = new Set();
    for (const rec of instList) {
      if (rec.indices.some(i => seen.has(i))) continue;
      rec.indices.forEach(i => seen.add(i));
      disjoint.push(rec.indices);
    }
    if (disjoint.length >= 2) {
      const sz = disjoint[0].length;
      const cleanName = (instList[0].name || 'Submodel').replace(/\s+copy(\s*\d+)?$/i, '').trim() || 'Submodel';
      candidates.push({
        name: cleanName,
        explicit: true,
        size: sz,
        count: disjoint.length,
        savings: (disjoint.length - 1) * sz + 20,
        instances: disjoint,
      });
    }
  }

  // Stage 2: Automatic geometric rigid-body duplicate detection (works even on flat .ldr files with ZERO submodels!)
  const byPC = new Map();
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].children || roles[i] === 'figure') continue;
    const k = `${parts[i].p}:${parts[i].c}`;
    if (!byPC.has(k)) byPC.set(k, []);
    byPC.get(k).push(i);
  }

  const triedGeoSigs = new Set();
  for (const idxs of byPC.values()) {
    if (idxs.length < 2 || idxs.length > 18) continue;
    const seedA = idxs[0];
    const mAT = mat3Transpose(parts[seedA].m || R_ID);
    const maxPairs = Math.min(idxs.length, 8);
    for (let bi = 1; bi < maxPairs; bi++) {
      const seedB = idxs[bi];
      const T = mat3Mul(parts[seedB].m || R_ID, mAT);
      if (Math.abs(mat3Det(T) - 1) > 0.08) continue;
      const rA = m3v(T, parts[seedA].x, parts[seedA].y, parts[seedA].z);
      const tx = parts[seedB].x - rA[0], ty = parts[seedB].y - rA[1], tz = parts[seedB].z - rA[2];
      if (Math.hypot(tx, ty, tz) < 5) continue;

      const setA = new Set([seedA]), setB = new Set([seedB]);
      const q = [seedA];
      while (q.length && setA.size < maxSubSize) {
        const u = q.shift();
        for (const nb of adj[u]) {
          if (setA.has(nb) || setB.has(nb) || parts[nb].children || roles[nb] === 'figure') continue;
          const pNb = parts[nb];
          const ru = m3v(T, pNb.x, pNb.y, pNb.z);
          const ex = ru[0] + tx, ey = ru[1] + ty, ez = ru[2] + tz;
          const pool = byPC.get(`${pNb.p}:${pNb.c}`);
          if (!pool) continue;
          let match = -1, bestD = 3.2;
          for (const cand of pool) {
            if (setA.has(cand) || setB.has(cand)) continue;
            const d = Math.hypot(parts[cand].x - ex, parts[cand].y - ey, parts[cand].z - ez);
            if (d < bestD) { bestD = d; match = cand; }
          }
          if (match >= 0) { setA.add(nb); setB.add(match); q.push(nb); }
        }
      }

      if (setA.size >= 3) {
        const arrA = Array.from(setA).sort((a, b) => a - b);
        const geoSig = arrA.join(',');
        if (triedGeoSigs.has(geoSig)) continue;
        triedGeoSigs.add(geoSig);

        const instances = [arrA];
        const used = new Set(arrA);
        for (const candSeed of idxs) {
          if (used.has(candSeed)) continue;
          const Tc = mat3Mul(parts[candSeed].m || R_ID, mAT);
          if (Math.abs(mat3Det(Tc) - 1) > 0.08) continue;
          const rc = m3v(Tc, parts[seedA].x, parts[seedA].y, parts[seedA].z);
          const tcx = parts[candSeed].x - rc[0], tcy = parts[candSeed].y - rc[1], tcz = parts[candSeed].z - rc[2];
          const matched = [], localUsed = new Set();
          let ok = true;
          for (const u of arrA) {
            const pu = parts[u];
            const ru = m3v(Tc, pu.x, pu.y, pu.z);
            const ex = ru[0] + tcx, ey = ru[1] + tcy, ez = ru[2] + tcz;
            const pool = byPC.get(`${pu.p}:${pu.c}`);
            let best = -1, bestD = 3.2;
            for (const v of pool) {
              if (used.has(v) || localUsed.has(v)) continue;
              const d = Math.hypot(parts[v].x - ex, parts[v].y - ey, parts[v].z - ez);
              if (d < bestD) { bestD = d; best = v; }
            }
            if (best < 0) { ok = false; break; }
            matched.push(best); localUsed.add(best);
          }
          if (ok) {
            instances.push(matched);
            matched.forEach(v => used.add(v));
          }
        }
        if (instances.length >= 2) {
          // Reject hollow/carved-out Stage 2 geometric submodels that sandwich external parts
          // vertically between lower and upper bricks of the submodel (physically impossible to assemble!).
          let sandwichesExternal = false;
          for (const inst of instances) {
            const instSet = new Set(inst);
            for (let u = 0; u < parts.length; u++) {
              if (instSet.has(u) || roles[u] === 'wheel' || roles[u] === 'figure') continue;
              const bu = boxes[u];
              let hasAbove = false, hasBelow = false;
              for (const pi of inst) {
                const bi = boxes[pi];
                const ovX = Math.min(bu.max[0], bi.max[0]) - Math.max(bu.min[0], bi.min[0]);
                const ovZ = Math.min(bu.max[2], bi.max[2]) - Math.max(bu.min[2], bi.min[2]);
                if (ovX < 3.0 || ovZ < 3.0) continue;
                if (!hasAbove && bi.min[1] >= bu.max[1] - 4.5 && bi.center[1] > bu.center[1] + 2.0 && (bi.min[1] - bu.max[1]) <= 36) hasAbove = true;
                if (!hasBelow && bu.min[1] >= bi.max[1] - 4.5 && bu.center[1] > bi.center[1] + 2.0 && (bu.min[1] - bi.max[1]) <= 36) hasBelow = true;
                if (hasAbove && hasBelow) break;
              }
              if (hasAbove && hasBelow) { sandwichesExternal = true; break; }
            }
            if (sandwichesExternal) break;
          }
          if (!sandwichesExternal) {
            candidates.push({
              name: null,
              explicit: false,
              size: arrA.length,
              count: instances.length,
              savings: (instances.length - 1) * arrA.length,
              instances,
            });
          }
        }
      }
    }
  }

  candidates.sort((a, b) => (b.explicit ? 1 : 0) - (a.explicit ? 1 : 0) || b.savings - a.savings || b.count - a.count || b.size - a.size);
  const claimed = new Uint8Array(parts.length);
  const groups = [];
  let gSeq = 0;
  for (const c of candidates) {
    if (c.instances.some(inst => inst.some(i => claimed[i]))) continue;
    c.instances.forEach(inst => inst.forEach(i => { claimed[i] = 1; }));
    gSeq++;
    const name = c.name || autoNameDuplicateSubmodel(c.instances[0], parts, gSeq);
    const gid = `dupsub_${gSeq}`;
    groups.push({
      id: gid,
      name,
      repeatCount: c.instances.length,
      instances: c.instances,
      canonicalParts: normalizeCanonicalSubParts(c.instances[0].map(i => parts[i]), gid),
    });
  }
  return groups;
}

// Build strict bottom-up vertical prerequisite DAG:
// belowMap[i] = parts sitting directly underneath `i` that have lower/side support and MUST be
// placed before `i` (pure top-hung/underside-attached pieces are excluded so they snap cleanly
// onto the spanning upper plate after it is placed, instead of floating in mid-air before it!).
function buildVerticalPrereqMap(boxes, adj, roles, claddingFlags, activeIndices, subBoxes = null) {
  return buildPhysicalVerticalPrereqMap(boxes, adj, roles, claddingFlags, activeIndices, subBoxes);
}

// Build bottom-up zero-floating steps for 1 canonical copy of a duplicate submodel or modular section
function buildLocalSubmodelSteps(canonicalParts, groupId, repeatCount) {
  const n = canonicalParts.length;
  const boxes = canonicalParts.map(p => computeWorldBox(p));
  const subBoxes = canonicalParts.map(p => computeWorldSubBoxes(p));
  const roles = canonicalParts.map(p => classifyPartRole(p));
  const sideCaps = canonicalParts.map((p, i) => canConnectSideways(p, roles[i]));
  const claddingFlags = canonicalParts.map((p, i) => isSidewaysCladdingPart(p, boxes[i]));
  const layerY = canonicalParts.map((p, i) => computeBuildLayerY(p, boxes[i]));
  const adj = buildSpatialAdjacency(canonicalParts, boxes, roles, sideCaps, subBoxes);
  const { belowMap } = buildVerticalPrereqMap(boxes, adj, roles, claddingFlags, undefined, subBoxes);
  const subDescriptors = canonicalParts.map((p, i) => ({
    index: i,
    partId: normId(p.p),
    colorId: p.c,
    sku: `${normId(p.p)}|${p.c}`,
    role: roles[i],
    box: boxes[i],
    layerY: layerY[i],
    isCladding: claddingFlags[i],
  }));
  const subModelBounds = computeBoundsFromBoxes(boxes);
  let builtBounds = null;
  const builtBoxes = [];
  let activeCam = { ...DEFAULT_STUDIO_CAMERA };
  const placed = new Set();
  const remaining = new Set(Array.from({ length: n }, (_, i) => i));
  const steps = [];
  let sNum = 0;

  while (remaining.size > 0) {
    const placedBeforeStep = new Set(placed);
    const isPrereqGrounded = placedBeforeStep.size > 0
      ? createGroundedPrereqChecker(adj, belowMap, placedBeforeStep, remaining)
      : null;
    let frontier;
    if (placed.size === 0) {
      const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i] && !belowMap[i].some(u => remaining.has(u)));
      const pool = nonWheels.length > 0 ? nonWheels : Array.from(remaining);
      pool.sort((a, b) => layerY[a] - layerY[b]);
      const minY = layerY[pool[0]];
      const lowBand = pool.filter(i => layerY[i] <= minY + 32);
      lowBand.sort((a, b) => {
        const sa = (roles[a] === 'structural' || roles[a] === 'wheel_holder' ? 50 : 0) + adj[a].length * 6 - (layerY[a] - minY) * 0.8;
        const sb = (roles[b] === 'structural' || roles[b] === 'wheel_holder' ? 50 : 0) + adj[b].length * 6 - (layerY[b] - minY) * 0.8;
        return sb - sa;
      });
      frontier = lowBand;
    } else {
      const rawFrontier = Array.from(remaining).filter(i => adj[i].some(nb => placedBeforeStep.has(nb)));
      const unblocked = rawFrontier.filter(i =>
        !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placedBeforeStep)
        && !belowMap[i].some(u => remaining.has(u) && isPrereqGrounded(u))
      );
      if (unblocked.length > 0) {
        frontier = unblocked;
      } else {
        const claddingReady = rawFrontier.filter(i => !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placedBeforeStep));
        frontier = claddingReady.length > 0 ? claddingReady : rawFrontier;
      }
      if (frontier.length === 0) frontier = Array.from(remaining).sort((a, b) => layerY[a] - layerY[b]);
      const skuCountsInBand = new Map();
      for (const idx of frontier) {
        const sku = subDescriptors[idx].sku;
        skuCountsInBand.set(sku, (skuCountsInBand.get(sku) || 0) + 1);
      }
      const refBounds = builtBounds || subModelBounds;
      frontier.sort((a, b) => compareFrontierCandidates(subDescriptors[a], subDescriptors[b], activeCam.corner, refBounds, skuCountsInBand));
    }
    const anchor = frontier[0];
    const anchorY = layerY[anchor];
    const anchorConnectedToPrev = placedBeforeStep.size > 0 && adj[anchor].some(nb => placedBeforeStep.has(nb));
    const stepIdx = selectDynamicStepIndices({
      anchor,
      parts: subDescriptors,
      getEligibleCandidates: (placedInStep) => {
        const supportSet = placedBeforeStep.size > 0 ? placedBeforeStep : placedInStep;
        return Array.from(remaining).filter(i => {
          if (placedInStep.has(i)) return false;
          if (Math.abs(layerY[i] - anchorY) > 12) return false;
          if (isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, supportSet)) return false;
          if (placedBeforeStep.size > 0) {
            if (belowMap[i].some(u => !placedBeforeStep.has(u) && isPrereqGrounded(u))) return false;
          } else {
            if (belowMap[i].length > 0) return false;
          }
          return isCandidateConnectedForStep(i, anchorConnectedToPrev, adj, placedBeforeStep, placedInStep);
        });
      },
      modelBounds: subModelBounds,
      builtBounds,
      activeCam,
      isFirstStep: sNum === 0,
      totalPartsInScope: n,
      isSubmodel: true,
    });
    for (const i of stepIdx) { remaining.delete(i); placed.add(i); }
    const stepBoxes = stepIdx.map(i => boxes[i]);
    const camChoice = chooseStickyStepCamera(stepBoxes, builtBoxes, builtBounds, activeCam);
    activeCam = { side: camChoice.side, corner: camChoice.corner, az: camChoice.az, el: camChoice.el };
    for (const b of stepBoxes) {
      builtBounds = expandBoundsWithBox(builtBounds, b);
      builtBoxes.push(b);
    }
    sNum++;
    steps.push({
      id: `${groupId}_s${sNum}`,
      num: sNum,
      side: camChoice.side,
      corner: camChoice.corner,
      az: camChoice.az,
      el: camChoice.el,
      cue: sNum === 1 ? 'none' : camChoice.cue,
      parts: stepIdx.map(i => canonicalParts[i]),
      isSubmodelStep: true,
    });
  }
  // Indicate ×N on ONLY the last step of repeated submodels (repeatCount > 1)
  if (steps.length > 0 && repeatCount > 1) {
    steps[steps.length - 1].isSubmodelFinal = true;
    steps[steps.length - 1].submodelRepeat = repeatCount;
  }
  return steps;
}

// Fast 3D spatial hash broad-phase adjacency builder (wheel-aware & rejects smooth side-wall grazing + concave AABB cutouts!)
function buildSpatialAdjacency(parts, boxes, roles, sideCaps = null, subBoxes = null) {
  const n = parts.length;
  const caps = sideCaps || parts.map((p, i) => canConnectSideways(p, roles[i]));
  const subs = subBoxes || parts.map(p => computeWorldSubBoxes(p));
  const adj = Array.from({ length: n }, () => []);
  const cellSize = 80;
  const pad = 12;
  const cells = new Map();
  const oversized = [];

  for (let i = 0; i < n; i++) {
    const b = boxes[i];
    const minCx = Math.floor((b.min[0] - pad) / cellSize);
    const maxCx = Math.floor((b.max[0] + pad) / cellSize);
    const minCy = Math.floor((b.min[1] - pad) / cellSize);
    const maxCy = Math.floor((b.max[1] + pad) / cellSize);
    const minCz = Math.floor((b.min[2] - pad) / cellSize);
    const maxCz = Math.floor((b.max[2] + pad) / cellSize);
    const cellCount = (maxCx - minCx + 1) * (maxCy - minCy + 1) * (maxCz - minCz + 1);
    if (cellCount > 256) {
      oversized.push(i);
      continue;
    }
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        for (let cz = minCz; cz <= maxCz; cz++) {
          const key = `${cx},${cy},${cz}`;
          let bucket = cells.get(key);
          if (!bucket) { bucket = []; cells.set(key, bucket); }
          bucket.push(i);
        }
      }
    }
  }

  const tested = new Set();
  const testPair = (i, j) => {
    const lo = i < j ? i : j;
    const hi = i < j ? j : i;
    const pk = lo * n + hi;
    if (tested.has(pk)) return;
    tested.add(pk);
    if (boxesPhysicallyTouch(boxes[lo], boxes[hi], roles[lo], roles[hi], caps[lo], caps[hi], subs[lo], subs[hi])) {
      adj[lo].push(hi);
      adj[hi].push(lo);
    }
  };

  for (const bucket of cells.values()) {
    for (let a = 0; a < bucket.length; a++) {
      for (let b = a + 1; b < bucket.length; b++) {
        testPair(bucket[a], bucket[b]);
      }
    }
  }
  for (const oi of oversized) {
    for (let j = 0; j < n; j++) {
      if (oi !== j) testPair(oi, j);
    }
  }

  // Pass 1: Fallback for any isolated wheel/detail whose axle wasn't tagged wheel_holder: connect to nearest structural/axle neighbor
  const fallbackDist = new Float64Array(n);
  fallbackDist.fill(-1);
  for (let i = 0; i < n; i++) {
    parts[i]._detachedGap = 0;
    parts[i]._floatHeight = 0;
    if (adj[i].length > 0) continue;
    let bestJ = -1, bestD = 12, bestVert = false;
    for (let j = 0; j < n; j++) {
      if (i === j || roles[j] === 'wheel') continue;
      const gx = Math.max(0, boxes[i].min[0]-boxes[j].max[0], boxes[j].min[0]-boxes[i].max[0]);
      const gy = Math.max(0, boxes[i].min[1]-boxes[j].max[1], boxes[j].min[1]-boxes[i].max[1]);
      const gz = Math.max(0, boxes[i].min[2]-boxes[j].max[2], boxes[j].min[2]-boxes[i].max[2]);
      if (Math.hypot(gx, gy, gz) >= bestD + 0.01) continue;
      const { gap: d, hasVerticalOverlap: vert } = minSubBoxGap(boxes[i], boxes[j], subs[i], subs[j]);
      if (d < bestD - 1e-4 || (Math.abs(d - bestD) <= 1e-4 && vert && !bestVert)) {
        bestD = d; bestJ = j; bestVert = vert;
      }
    }
    if (bestJ >= 0) {
      adj[i].push(bestJ); adj[bestJ].push(i);
      fallbackDist[i] = bestD;
    } else {
      fallbackDist[i] = Infinity;
    }
  }

  // Pass 2: Ground-aware floating/weak-connection classification.
  // Standalone pieces resting on the model's ground plane (e.g., loose props/accessories)
  // are NOT flagged as floating; only pieces actually elevated above ground are flagged.
  if (n > 1) {
    const groundY = computeGroundPlaneY(boxes, (idx) => adj[idx].length > 0);
    for (let i = 0; i < n; i++) {
      if (fallbackDist[i] < 0) continue;
      const res = classifyDetachedPart({
        box: boxes[i],
        groundY,
        nearestGapLdu: fallbackDist[i],
        isWheel: roles[i] === 'wheel',
      });
      parts[i]._detachedGap = res.detachedGap;
      parts[i]._floatHeight = res.floatHeight;
    }
  }

  // Pass 3: Bridge small non-figure sub-assemblies (e.g., 2–16 part bogies, pantographs, headlights, mirrors)
  // that have a tiny CAD clearance gap (<= 12 LDU) to the main structure so they never detach during subdivision.
  const compVisited = new Uint8Array(n);
  const subComps = [];
  for (let i = 0; i < n; i++) {
    if (compVisited[i] || roles[i] === 'figure') continue;
    const comp = [];
    const q = [i];
    compVisited[i] = 1;
    let head = 0;
    while (head < q.length) {
      const u = q[head++];
      comp.push(u);
      for (const v of adj[u]) {
        if (!compVisited[v] && roles[v] !== 'figure') {
          compVisited[v] = 1;
          q.push(v);
        }
      }
    }
    subComps.push(comp);
  }
  if (subComps.length > 1) {
    subComps.sort((a, b) => b.length - a.length);
    const compIdOf = new Int32Array(n).fill(-1);
    subComps.forEach((comp, cid) => {
      for (const u of comp) compIdOf[u] = cid;
    });
    for (let cid = 1; cid < subComps.length; cid++) {
      const comp = subComps[cid];
      if (comp.length > 16) continue;
      let bestU = -1, bestV = -1, bestD = 12, bestVert = false;
      for (const u of comp) {
        const bu = boxes[u];
        for (let v = 0; v < n; v++) {
          if (compIdOf[v] < 0 || compIdOf[v] === cid || roles[v] === 'wheel' || roles[v] === 'figure') continue;
          const bv = boxes[v];
          const gx = Math.max(0, bu.min[0] - bv.max[0], bv.min[0] - bu.max[0]);
          const gy = Math.max(0, bu.min[1] - bv.max[1], bv.min[1] - bu.max[1]);
          const gz = Math.max(0, bu.min[2] - bv.max[2], bv.min[2] - bu.max[2]);
          if (Math.hypot(gx, gy, gz) >= bestD + 0.01) continue;
          const { gap: d, hasVerticalOverlap: vert } = minSubBoxGap(bu, bv, subs[u], subs[v]);
          if (d < bestD - 1e-4 || (Math.abs(d - bestD) <= 1e-4 && vert && !bestVert)) {
            bestD = d; bestU = u; bestV = v; bestVert = vert;
          }
        }
      }
      if (bestU >= 0 && bestV >= 0) {
        adj[bestU].push(bestV);
        adj[bestV].push(bestU);
        const targetCid = compIdOf[bestV];
        for (const u of comp) compIdOf[u] = targetCid;
      }
    }
  }
  return adj;
}

function hasEmbeddedAxleHole(pid) {
  const k = normId(pid);
  const lines = embeddedDatRaw.get(k) || userLibRaw.get(k);
  if (!lines) return false;
  return lines.some(l => /axlehol/i.test(l));
}

function prepareSubdivisionData(parsed) {
  const parts = parsed.parts;
  const boxes = parts.map(p => computeWorldBox(p));
  const subBoxes = parts.map(p => computeWorldSubBoxes(p));
  const roles = parts.map(p => classifyPartRole(p));
  const sideCaps = parts.map((p, i) => canConnectSideways(p, roles[i]));
  const adjacency = buildSpatialAdjacency(parts, boxes, roles, sideCaps, subBoxes);
  const {
    groups: minifigGroups,
    claimed: mfClaimed,
  } = extractMinifigureGroups(parts, boxes, (pid) => resolvePart(pid).name, adjacency);
  const inputs = parts.map((p, index) => {
    const def = resolvePart(p.p);
    const m = p.m || R_ID;
    const isUpright = Math.abs(m[4]) >= 0.7;
    const isInverted = m[4] <= -0.7;
    const lastSub = p.subChain && p.subChain.length > 0 ? p.subChain[p.subChain.length - 1] : null;
    const flags = classifySubdivisionPartFlags(normId(p.p), def.name, boxes[index], {
      isTile: def.studs === false && def.h <= 10,
      hasTopStuds: def.studs !== false,
      hasEmbeddedAxleHole: hasEmbeddedAxleHole(p.p),
      isSidewaysCapable: sideCaps[index],
      isUpright,
      isInverted,
    });
    return {
      index,
      id: p.id,
      partId: normId(p.p),
      partName: def.name,
      colorId: p.c,
      box: boxes[index],
      ...flags,
      isMinifig: Boolean(mfClaimed[index]),
      submodelKey: p.sub || undefined,
      submodelInstanceId: lastSub ? String(lastSub.instId) : undefined,
    };
  });
  return { boxes, roles, adjacency, inputs, mfClaimed, minifigGroups };
}

function extractTargetBoxesForMinifig(partsList) {
  const out = [];
  for (const p of partsList || []) {
    if (p.children && p.children.length > 0) {
      for (const ch of p.children) {
        out.push({
          box: computeLeafWorldBox(ch),
          role: classifyMinifigLeafRole(ch.p, resolvePart(ch.p).name),
        });
      }
    } else {
      out.push({
        box: computeLeafWorldBox(p),
        role: classifyMinifigLeafRole(p.p, resolvePart(p.p).name),
      });
    }
  }
  return out;
}

function appendOccluderBoxes(partsList, out) {
  for (const p of partsList || []) {
    if (p.children && p.children.length > 0) {
      for (const ch of p.children) {
        const col = resolveColorInfo(ch.c);
        out.push({
          box: computeLeafWorldBox(ch),
          transparent: Boolean(col && typeof col.alpha === 'number' && col.alpha < 0.99),
        });
      }
    } else {
      const col = resolveColorInfo(p.c);
      out.push({
        box: computeLeafWorldBox(p),
        transparent: Boolean(col && typeof col.alpha === 'number' && col.alpha < 0.99),
      });
    }
  }
}

// Globally optimizes step-to-step cameras across every build section, bag chain, join sequence,
// and submodel using orthographic ray-AABB occlusion + Viterbi DP smoothing (preventing needless
// spinning and 1-step ping-pongs), while keeping minifigure placement steps unobstructed and
// all rotation cue badges accurately synchronized.
function optimizeManualStepCameras(chapters) {
  const optimizeStepList = (steps) => {
    const allOccluders = [];
    let builtBounds = null;
    let lastModelCam = null;

    let pendingSteps = [];
    let pendingInputs = [];

    const flushPendingRun = () => {
      if (pendingSteps.length === 0) return;
      const chosenList = optimizeStudioStepCameraSequence(pendingInputs, {
        initialCamera: lastModelCam,
      });
      for (let k = 0; k < pendingSteps.length; k++) {
        const s = pendingSteps[k];
        const ch = chosenList[k];
        s.side = ch.side;
        s.corner = ch.corner;
        s.az = ch.az;
        s.el = ch.el;
        s.cue = lastModelCam ? computeStudioRotationCue(lastModelCam, ch) : 'none';
        lastModelCam = { side: ch.side, corner: ch.corner, az: ch.az, el: ch.el };
      }
      pendingSteps = [];
      pendingInputs = [];
    };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.isStandaloneFigure || step.isMinifigPoseStep) continue;

      if (step.attachedMinifig) {
        flushPendingRun();
        const prevCam = lastModelCam || DEFAULT_STUDIO_CAMERA;
        const targets = extractTargetBoxesForMinifig(step.parts);
        const chosen = chooseMinifigPlacementCamera(
          targets,
          allOccluders,
          step.attachedMinifig.worldForward,
          prevCam,
        );
        step.side = chosen.side;
        step.corner = chosen.corner;
        step.az = chosen.az;
        step.el = chosen.el;
        step.cue = lastModelCam ? chosen.cue : 'none';
        lastModelCam = {
          side: chosen.side,
          corner: chosen.corner,
          az: chosen.az,
          el: chosen.el,
        };
        const beforeLen = allOccluders.length;
        appendOccluderBoxes(step.parts, allOccluders);
        for (let k = beforeLen; k < allOccluders.length; k++) {
          builtBounds = expandBoundsWithBox(builtBounds, allOccluders[k].box);
        }
      } else {
        const occluderCountBefore = allOccluders.length;
        const builtBoundsBefore = builtBounds;
        const stepOccs = [];
        appendOccluderBoxes(step.parts, stepOccs);
        const stepBoxes = stepOccs.map((o) => o.box);

        pendingSteps.push(step);
        pendingInputs.push({
          stepBoxes,
          occludersBefore: allOccluders,
          occluderCountBefore,
          builtBoundsBefore,
          isSectionAttach: Boolean(step.attachedSubmodel?.isSectionAttach),
        });

        for (let k = 0; k < stepOccs.length; k++) {
          allOccluders.push(stepOccs[k]);
          builtBounds = expandBoundsWithBox(builtBounds, stepOccs[k].box);
        }
      }
    }

    flushPendingRun();
  };

  // 1. Optimize each standalone submodel chapter in its own local frame
  const sectionSteps = new Map();
  for (const ch of chapters) {
    if (ch.kind === 'minifigure') continue;
    if (ch.kind === 'submodel') {
      optimizeStepList(ch.steps || []);
      continue;
    }
    const secKey = ch.sectionId || ch.id;
    if (!sectionSteps.has(secKey)) sectionSteps.set(secKey, []);
    const list = sectionSteps.get(secKey);
    for (const s of ch.steps || []) list.push(s);
  }

  // 2. Optimize each continuous main / bag / join section as one unified step sequence
  for (const list of sectionSteps.values()) {
    optimizeStepList(list);
  }
}

// ZERO-FLOATING CHASSIS-FIRST STEP GENERATOR (with dynamic cognitive-budget step sizing, sticky camera-corner selection, duplicate submodels & subdivision chapters!)
function buildManualFromParsed(parsed, mode, subdivisionPlan = null) {
  const parts = parsed.parts;
  const boxes = parts.map(p => computeWorldBox(p));
  const roles = parts.map(p => classifyPartRole(p));
  const claddingFlags = parts.map((p, i) => isSidewaysCladdingPart(p, boxes[i]));
  const layerY = parts.map((p, i) => computeBuildLayerY(p, boxes[i]));
  const allPartDescriptors = parts.map((p, i) => ({
    index: i,
    partId: normId(p.p),
    colorId: p.c,
    sku: `${normId(p.p)}|${p.c}`,
    role: roles[i],
    box: boxes[i],
    layerY: layerY[i],
    isCladding: claddingFlags[i],
  }));

  if (mode === 'keep' && parsed.hasSteps) {
    for (const p of parts) { p._detachedGap = 0; p._floatHeight = 0; }
    const bySub = new Map();
    for (const p of parts) {
      const k = cleanSubName(p.sub);
      if (!bySub.has(k)) bySub.set(k, []);
      bySub.get(k).push(p);
    }
    const chapters = [];
    let globalStep = 0, chIdx = 0;
    for (const [subName, list] of Array.from(bySub.entries()).sort((a,b) => a[1].length - b[1].length)) {
      chIdx++;
      const byOrig = new Map();
      for (const p of list) {
        const k = p.origStep || 0;
        if (!byOrig.has(k)) byOrig.set(k, []);
        byOrig.get(k).push(p);
      }
      const steps = Array.from(byOrig.keys()).sort((a,b)=>a-b).map(k => ({
        id: `kc${chIdx}_s${++globalStep}`, num: globalStep,
        side: 'top', corner: 'front_right', cue: 'none', parts: byOrig.get(k),
      }));
      chapters.push({ id: `kch_${chIdx}`, name: subName, kind: 'main', sectionId: `ksec_${chIdx}`, steps });
    }
    return { title: parsed.title, subtitle: `${parts.length} pieces · ${globalStep} steps`, chapters, _parsed: parsed, _mode: mode, _subdivisionPlan: null };
  }

  // 1. Build strict physical adjacency graph via 3D spatial hash broad-phase (wheel-aware & rejects smooth side-wall grazing + concave AABB cutouts!)
  const subBoxes = parts.map(p => computeWorldSubBoxes(p));
  const sideCaps = parts.map((p, i) => canConnectSideways(p, roles[i]));
  const adj = buildSpatialAdjacency(parts, boxes, roles, sideCaps, subBoxes);

  // 1a. Whole-Minifigure Assembly Grouping (NEVER build just a head — and NEVER sweep chairs/seats or furniture into figures!)
  const {
    groups: minifigGroups,
    kinds: mfKinds,
    claimed: mfClaimed,
  } = extractMinifigureGroups(parts, boxes, (pid) => resolvePart(pid).name, adj);
  for (let i = 0; i < parts.length; i++) {
    if (mfClaimed[i]) parts[i]._floatHeight = 0;
  }

  // 1b. Automatic Duplicate Submodel Detection (explicit submodels + geometric-only duplicates!)
  const dupGroups = detectDuplicateSubassemblies(parts, boxes, adj, roles).filter(g =>
    !g.instances.some(inst => inst.some(pi => mfClaimed[pi]))
  );
  const partToDup = new Map();
  for (const g of dupGroups) {
    g.instances.forEach((inst, instIdx) => {
      for (const pi of inst) partToDup.set(pi, { group: g, instIdx });
    });
  }

  // 2. Connected components for non-minifigure model parts
  const visited = new Uint8Array(parts.length);
  for (let i = 0; i < parts.length; i++) if (mfClaimed[i]) visited[i] = 1;
  const rawComps = [];
  for (let i = 0; i < parts.length; i++) {
    if (visited[i]) continue;
    const q = [i], comp = []; visited[i] = 1;
    while (q.length) {
      const u = q.shift(); comp.push(u);
      for (const v of adj[u]) if (!visited[v]) { visited[v] = 1; q.push(v); }
    }
    rawComps.push(comp);
  }
  rawComps.sort((a, b) => b.length - a.length);
  const largeComps = rawComps.filter(c => c.length > 20 || rawComps.length === 1);
  const straySmall = rawComps.filter(c => c.length <= 20 && rawComps.length > 1);
  // Fold tiny stray non-figure clips/bars into the primary model component so they build with the model, not as fake figures!
  if (largeComps.length > 0 && straySmall.length > 0) {
    for (const sc of straySmall) largeComps[0].push(...sc);
  } else if (largeComps.length === 0 && straySmall.length > 0) {
    largeComps.push(straySmall.flat());
  }
  const groupedComps = largeComps.map((c, idx) => ({
    name: largeComps.length === 1 ? parsed.title : `${parsed.title} · Section ${idx + 1}`,
    indices: c,
  }));

  // 3. Normalize all detected minifigures into canonical standing-up front-facing construction pose,
  //    and prepare their placement transforms to run right before they are placed on the model!
  const hasMainModel = groupedComps.length > 0;
  const normalizedMinifigs = minifigGroups.map((mg, mfIdx) => {
    const order = { legs: 0, torso: 1, head: 2, headgear: 3 };
    const sortedIdx = [...mg.indices].sort((a, b) =>
      (order[mfKinds[a]] ?? 4) - (order[mfKinds[b]] ?? 4) || boxes[a].min[1] - boxes[b].min[1]
    );
    const worldParts = sortedIdx.map(i => parts[i]);
    const mfId = `mf_${mfIdx + 1}`;
    const norm = normalizeMinifigureForBuild(
      worldParts,
      (pid) => resolvePart(pid).name,
      computeWorldBox,
      mfId,
    );
    const wMin = [Infinity, Infinity, Infinity], wMax = [-Infinity, -Infinity, -Infinity];
    for (const idx of sortedIdx) {
      for (let k = 0; k < 3; k++) {
        if (boxes[idx].min[k] < wMin[k]) wMin[k] = boxes[idx].min[k];
        if (boxes[idx].max[k] > wMax[k]) wMax[k] = boxes[idx].max[k];
      }
    }
    const worldBox = {
      min: wMin, max: wMax,
      center: [(wMin[0] + wMax[0]) / 2, (wMin[1] + wMax[1]) / 2, (wMin[2] + wMax[2]) / 2],
    };
    return {
      id: mfId,
      name: mg.name || `Minifigure ${mfIdx + 1}`,
      indices: sortedIdx,
      worldParts,
      worldBox,
      ...norm,
    };
  });

  // Assign each minifigure to its closest main-model section so it is posed & placed right onto the model
  const sectionMinifigs = groupedComps.map(() => []);
  if (hasMainModel) {
    for (const nm of normalizedMinifigs) {
      let bestSec = 0, bestD = Infinity;
      groupedComps.forEach((g, secIdx) => {
        for (const pi of g.indices) {
          const b = boxes[pi];
          const gx = Math.max(0, nm.worldBox.min[0] - b.max[0], b.min[0] - nm.worldBox.max[0]);
          const gy = Math.max(0, nm.worldBox.min[1] - b.max[1], b.min[1] - nm.worldBox.max[1]);
          const gz = Math.max(0, nm.worldBox.min[2] - b.max[2], b.min[2] - nm.worldBox.max[2]);
          const d = Math.hypot(gx, gy, gz);
          if (d < bestD) { bestD = d; bestSec = secIdx; }
        }
      });
      sectionMinifigs[bestSec].push(nm);
    }
  }

  // 4. Emit complete Minifigures chapter FIRST (standing upright, facing camera in front 3/4 view),
  //    then Chassis-First Main Build with pre-placement pose/rotation + placement steps!
  const chapters = [];
  const emittedSubChapters = new Set();
  let globalStep = 0, chSeq = 0;

  if (normalizedMinifigs.length > 0) {
    const mfSteps = normalizedMinifigs.map((nm) => {
      globalStep++;
      return {
        id: `mf_s${globalStep}`,
        num: globalStep,
        side: MINIFIG_BUILD_CAMERA.side,
        corner: MINIFIG_BUILD_CAMERA.corner,
        az: MINIFIG_BUILD_CAMERA.az,
        el: MINIFIG_BUILD_CAMERA.el,
        cue: 'none',
        isStandaloneFigure: true,
        isMinifigBuildStep: true,
        placedInMain: hasMainModel,
        minifigId: nm.id,
        minifigName: nm.name,
        minifigMetrics: nm.metrics,
        parts: nm.canonicalParts,
      };
    });
    chapters.push({
      id: `ach_${++chSeq}`,
      name: normalizedMinifigs.length === 1 ? 'Minifigure' : 'Minifigures',
      kind: 'minifigure',
      sectionId: 'sec_minifigs',
      steps: mfSteps,
    });
  }

  // Compute horizontal span for adaptive spatial spread guard (stops far-end pieces from grouping on long builds)
  let mMinX = Infinity, mMaxX = -Infinity, mMinZ = Infinity, mMaxZ = -Infinity;
  for (let i = 0; i < parts.length; i++) {
    if (mfClaimed[i]) continue;
    if (boxes[i].min[0] < mMinX) mMinX = boxes[i].min[0];
    if (boxes[i].max[0] > mMaxX) mMaxX = boxes[i].max[0];
    if (boxes[i].min[2] < mMinZ) mMinZ = boxes[i].min[2];
    if (boxes[i].max[2] > mMaxZ) mMaxZ = boxes[i].max[2];
  }
  const modelHorizSpan = isFinite(mMinX) ? Math.max(mMaxX - mMinX, mMaxZ - mMinZ) : 0;
  const adaptiveMaxSpread = modelHorizSpan >= 400 ? 120 : 160;

  // Helper: zero-floating chassis-first step generation for any subset of world part indices
  const buildStepsForIndexList = (idxList, idPrefix, prePlacedSet = new Set(), _maxSpread = adaptiveMaxSpread, initialCam = DEFAULT_STUDIO_CAMERA) => {
    const placed = new Set(prePlacedSet);
    const remaining = new Set(idxList);
    const outSteps = [];
    const scopeIndices = Array.from(new Set([...Array.from(prePlacedSet), ...idxList]));
    const { belowMap } = buildVerticalPrereqMap(boxes, adj, roles, claddingFlags, scopeIndices, subBoxes);
    const scopeBounds = computeBoundsFromBoxes(scopeIndices.map(i => boxes[i]));
    let builtBounds = prePlacedSet.size > 0
      ? computeBoundsFromBoxes(Array.from(prePlacedSet).map(i => boxes[i]))
      : null;
    const builtBoxes = Array.from(prePlacedSet).map(i => boxes[i]);
    let activeCam = { ...(initialCam || DEFAULT_STUDIO_CAMERA) };
    let localStepCount = 0;

    while (remaining.size > 0) {
      const placedBeforeStep = new Set(placed);
      const isPrereqGrounded = placedBeforeStep.size > 0
        ? createGroundedPrereqChecker(adj, belowMap, placedBeforeStep, remaining)
        : null;
      let frontier;
      if (placed.size === 0) {
        const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i] && !belowMap[i].some(u => remaining.has(u)));
        const pool = nonWheels.length > 0 ? nonWheels : Array.from(remaining);
        pool.sort((a, b) => layerY[a] - layerY[b]);
        const minY = layerY[pool[0]];
        const lowBand = pool.filter(i => layerY[i] <= minY + 32);
        lowBand.sort((a, b) => {
          const sa = (roles[a] === 'structural' || roles[a] === 'wheel_holder' ? 50 : 0) + adj[a].length * 6 - (layerY[a] - minY) * 0.8;
          const sb = (roles[b] === 'structural' || roles[b] === 'wheel_holder' ? 50 : 0) + adj[b].length * 6 - (layerY[b] - minY) * 0.8;
          return sb - sa;
        });
        frontier = lowBand;
      } else {
        const rawFrontier = Array.from(remaining).filter(i => adj[i].some(nb => placedBeforeStep.has(nb)));
        const unblocked = rawFrontier.filter(i =>
          !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placedBeforeStep)
          && !belowMap[i].some(u => remaining.has(u) && isPrereqGrounded(u))
        );
        if (unblocked.length > 0) {
          frontier = unblocked;
        } else {
          const readyFrontier = rawFrontier.filter(i => !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placedBeforeStep));
          frontier = readyFrontier.length > 0 ? readyFrontier : rawFrontier;
        }
        if (frontier.length === 0) {
          frontier = Array.from(remaining).sort((a, b) => layerY[a] - layerY[b]);
        }
        const skuCountsInBand = new Map();
        for (const idx of frontier) {
          const sku = allPartDescriptors[idx].sku;
          skuCountsInBand.set(sku, (skuCountsInBand.get(sku) || 0) + 1);
        }
        const refBounds = builtBounds || scopeBounds;
        frontier.sort((a, b) => compareFrontierCandidates(allPartDescriptors[a], allPartDescriptors[b], activeCam.corner, refBounds, skuCountsInBand));
      }

      const anchor = frontier[0];
      const anchorY = layerY[anchor];
      const anchorConnectedToPrev = placedBeforeStep.size > 0 && adj[anchor].some(nb => placedBeforeStep.has(nb));
      const stepIndices = selectDynamicStepIndices({
        anchor,
        parts: allPartDescriptors,
        getEligibleCandidates: (placedInStep) => {
          const supportSet = placedBeforeStep.size > 0 ? placedBeforeStep : placedInStep;
          return Array.from(remaining).filter(i => {
            if (placedInStep.has(i)) return false;
            if (isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, supportSet)) return false;
            if (Math.abs(layerY[i] - anchorY) > 12) return false;
            if (placedBeforeStep.size > 0) {
              if (belowMap[i].some(u => !placedBeforeStep.has(u) && isPrereqGrounded(u))) return false;
            } else {
              if (belowMap[i].length > 0) return false;
            }
            return isCandidateConnectedForStep(i, anchorConnectedToPrev, adj, placedBeforeStep, placedInStep);
          });
        },
        modelBounds: scopeBounds,
        builtBounds,
        activeCam,
        isFirstStep: localStepCount === 0 && prePlacedSet.size === 0,
        totalPartsInScope: idxList.length,
      });

      for (const i of stepIndices) {
        remaining.delete(i);
        placed.add(i);
      }

      const stepBoxes = stepIndices.map(i => boxes[i]);
      const camChoice = chooseStickyStepCamera(stepBoxes, builtBoxes, builtBounds, activeCam);
      activeCam = { side: camChoice.side, corner: camChoice.corner, az: camChoice.az, el: camChoice.el };
      for (const b of stepBoxes) {
        builtBounds = expandBoundsWithBox(builtBounds, b);
        builtBoxes.push(b);
      }

      localStepCount++;
      globalStep++;
      outSteps.push({
        id: `${idPrefix}_s${globalStep}`,
        num: globalStep,
        side: camChoice.side,
        corner: camChoice.corner,
        az: camChoice.az,
        el: camChoice.el,
        cue: localStepCount === 1 && prePlacedSet.size === 0 ? 'none' : camChoice.cue,
        parts: stepIndices.map(i => parts[i]),
      });
    }
    return { steps: outSteps, placed, lastCam: activeCam };
  };

  // 3b. SUBDIVISION PLAN EXECUTION (Modular Halves / Floors / Modules + Connect, OR Numbered Build Bags!)
  if (subdivisionPlan && subdivisionPlan.strategy !== 'none' && Array.isArray(subdivisionPlan.sections) && subdivisionPlan.sections.length >= 1) {
    // Track every non-minifig part index so zero bricks are ever duplicated or dropped
    const assigned = new Set();
    const filterUnassigned = (list) => {
      const clean = [];
      for (const idx of list || []) {
        if (idx >= 0 && idx < parts.length && !mfClaimed[idx] && !assigned.has(idx)) {
          assigned.add(idx);
          clean.push(idx);
        }
      }
      return clean;
    };

    const resolvedSections = subdivisionPlan.sections.map((sec) => {
      if (sec.repeatPartIndexGroups && sec.repeatPartIndexGroups.length > 1) {
        const groups = sec.repeatPartIndexGroups.map(g => filterUnassigned(g)).filter(g => g.length > 0);
        return { ...sec, cleanIndices: groups[0] || [], cleanRepeatGroups: groups };
      }
      const clean = filterUnassigned(sec.partIndices);
      return { ...sec, cleanIndices: clean, cleanRepeatGroups: clean.length > 0 ? [clean] : [] };
    }).filter(s => s.cleanIndices.length > 0);

    // Fold any stray unassigned non-minifig parts into a join/final bucket
    const leftover = [];
    for (let i = 0; i < parts.length; i++) {
      if (!mfClaimed[i] && !assigned.has(i)) leftover.push(i);
    }

    const appendMinifigPlacementSteps = (targetSteps, nm, idPrefix) => {
      if (nm.needsTransform) {
        globalStep++;
        const poseCam = nm.poseCamera || MINIFIG_POSE_CAMERA;
        targetSteps.push({
          id: `${idPrefix}_mfpose_${nm.id}_s${globalStep}`,
          num: globalStep,
          side: poseCam.side,
          corner: poseCam.corner,
          az: poseCam.az,
          el: poseCam.el,
          cue: 'none',
          isMinifigPoseStep: true,
          minifigPrep: {
            id: nm.id,
            name: nm.name,
            label: nm.transformLabel,
            canonicalParts: nm.canonicalParts,
            poseSummary: nm.poseSummary,
            indicators: nm.poseIndicators || [],
            ghostParts: nm.poseGhostParts || [],
            rotatedPartIds: nm.rotatedPartIds || [],
          },
          parts: nm.posedFrontParts || nm.posedPreviewParts,
        });
      }
      globalStep++;
      targetSteps.push({
        id: `${idPrefix}_mfplace_${nm.id}_s${globalStep}`,
        num: globalStep,
        side: 'top',
        corner: 'front_right',
        cue: 'none',
        attachedMinifig: {
          id: nm.id,
          name: nm.name,
          repeatCount: 1,
          previewParts: nm.posedPreviewParts,
          canonicalParts: nm.canonicalParts,
          needsTransform: nm.needsTransform,
          transformLabel: nm.transformLabel,
          worldForward: nm.worldForward,
        },
        parts: nm.worldParts,
      });
    };

    if (subdivisionPlan.outputMode === 'numbered_bags') {
      const runningPlaced = new Set();
      const bagSections = [...resolvedSections];
      if (leftover.length > 0) {
        if (bagSections.length > 0) {
          bagSections[bagSections.length - 1].cleanRepeatGroups[0].push(...leftover);
          bagSections[bagSections.length - 1].cleanIndices.push(...leftover);
        } else {
          bagSections.push({ id: 'bag_rest', name: 'Final Bag', role: 'bag', cleanIndices: leftover, cleanRepeatGroups: [leftover] });
        }
      }

      // Assign each minifigure to the bag whose bricks are closest to its placement spot
      const bagMinifigs = bagSections.map(() => []);
      for (const nm of normalizedMinifigs) {
        let bestBag = Math.max(0, bagSections.length - 1), bestD = Infinity;
        bagSections.forEach((sec, bIdx) => {
          for (const pi of sec.cleanRepeatGroups.flat()) {
            const b = boxes[pi];
            const gx = Math.max(0, nm.worldBox.min[0] - b.max[0], b.min[0] - nm.worldBox.max[0]);
            const gy = Math.max(0, nm.worldBox.min[1] - b.max[1], b.min[1] - nm.worldBox.max[1]);
            const gz = Math.max(0, nm.worldBox.min[2] - b.max[2], b.min[2] - nm.worldBox.max[2]);
            const d = Math.hypot(gx, gy, gz);
            if (d < bestD) { bestD = d; bestBag = bIdx; }
          }
        });
        if (bagMinifigs[bestBag]) bagMinifigs[bestBag].push(nm);
      }

      let runningCam = { ...DEFAULT_STUDIO_CAMERA };
      bagSections.forEach((sec, bIdx) => {
        const bagIndices = sec.cleanRepeatGroups.flat();
        const { steps: bagSteps, placed: afterPlaced, lastCam } = buildStepsForIndexList(
          bagIndices,
          `bag${bIdx + 1}`,
          runningPlaced,
          adaptiveMaxSpread,
          runningCam,
        );
        if (lastCam) runningCam = lastCam;
        for (const pi of afterPlaced) runningPlaced.add(pi);
        for (const nm of (bagMinifigs[bIdx] || [])) {
          appendMinifigPlacementSteps(bagSteps, nm, `bag${bIdx + 1}`);
        }
        if (bagSteps.length > 0) {
          chapters.push({
            id: `bagch_${++chSeq}_${sec.id}`,
            name: sec.name || `Bag ${bIdx + 1}`,
            kind: 'bag',
            sectionId: 'sec_bags',
            bagNumber: bIdx + 1,
            pieceCount: bagIndices.length,
            bagPreviewParts: bagIndices.map(i => parts[i]),
            steps: bagSteps,
          });
        }
      });

      optimizeManualStepCameras(chapters);
      return {
        title: parsed.title,
        subtitle: `${parts.length} pieces · ${globalStep} steps · ${bagSections.length} build bags`,
        chapters,
        _parsed: parsed,
        _mode: mode,
        _subdivisionPlan: subdivisionPlan,
      };
    } else {
      // MODULAR CHAPTERS + CONNECT / FINAL ASSEMBLY
      const moduleSecs = resolvedSections.filter(s => s.role !== 'join');
      const joinSecs = resolvedSections.filter(s => s.role === 'join');
      const joinIndices = [
        ...joinSecs.flatMap(s => s.cleanRepeatGroups.flat()),
        ...leftover,
      ];
      const artSec = joinSecs.find(s => s.articulatedJoin);
      const artJoin = artSec?.articulatedJoin || null;

      const attachQueue = [];
      moduleSecs.forEach((sec, mIdx) => {
        const repeatCount = sec.cleanRepeatGroups.length;
        const subId = `mod_${mIdx + 1}_${sec.id}`;
        const canonicalParts = normalizeCanonicalSubParts(sec.cleanIndices.map(i => parts[i]), subId);
        const subSteps = buildLocalSubmodelSteps(canonicalParts, subId, repeatCount);
        // Mark as a standalone section module (uses clean "SECTION · N pcs" banner when repeatCount === 1)
        chapters.push({
          id: `subch_${++chSeq}_${subId}`,
          name: sec.name || `Section ${mIdx + 1}`,
          kind: 'submodel',
          isSectionModule: true,
          sectionId: `subsec_${subId}`,
          repeatCount,
          pieceCount: sec.cleanIndices.length,
          canonicalParts,
          steps: subSteps,
        });

        sec.cleanRepeatGroups.forEach((grpIndices, copyIdx) => {
          attachQueue.push({
            id: `${subId}_c${copyIdx}`,
            name: repeatCount > 1 ? `${sec.name} #${copyIdx + 1}` : sec.name,
            baseName: sec.name,
            indices: grpIndices,
            canonicalParts,
            isDetachableCap: Boolean(sec.isDetachableCap),
          });
        });
      });

      const primaryAttachQueue = attachQueue.filter(item => !item.isDetachableCap);
      const capAttachQueue = attachQueue.filter(item => item.isDetachableCap);
      const mainAttachList = primaryAttachQueue.length > 0 ? primaryAttachQueue : attachQueue;
      const deferredCaps = primaryAttachQueue.length > 0 ? capAttachQueue : [];

      // Partition join indices cleanly when an articulated axle-through-round-hole joint is present
      let useArticulatedSequence = false;
      let cleanCollarIndices = [];
      let cleanRodIndices = [];
      let cleanBogieIndices = [];
      let cleanFinishIndices = [];
      let bogieSubId = null;
      let bogieCanonical = null;

      if (artJoin && mainAttachList.length >= 2) {
        const joinPool = new Set(joinIndices);
        const takeFromPool = (list) => {
          const out = [];
          for (const idx of list || []) {
            if (joinPool.has(idx)) {
              joinPool.delete(idx);
              out.push(idx);
            }
          }
          return out;
        };
        cleanCollarIndices = takeFromPool(artJoin.floatingCollarIndices);
        cleanRodIndices = takeFromPool(artJoin.pivotRodIndices);
        cleanBogieIndices = takeFromPool(artJoin.bogiePartIndices);
        cleanFinishIndices = [...takeFromPool(artJoin.finishPartIndices), ...Array.from(joinPool)];

        if (cleanBogieIndices.length > 0 || cleanRodIndices.length > 0) {
          useArticulatedSequence = true;
          // Build the intact end assembly (e.g. Middle Bogie / Pivot Assembly) as its own zoomed-in chapter first!
          if (cleanBogieIndices.length >= 2) {
            bogieSubId = 'mod_center_end_asm';
            bogieCanonical = normalizeCanonicalSubParts(cleanBogieIndices.map(i => parts[i]), bogieSubId);
            const bogieSteps = buildLocalSubmodelSteps(bogieCanonical, bogieSubId, 1);
            chapters.push({
              id: `subch_${++chSeq}_${bogieSubId}`,
              name: artJoin.bogieName || 'Center Assembly',
              kind: 'submodel',
              isSectionModule: true,
              sectionId: `subsec_${bogieSubId}`,
              repeatCount: 1,
              pieceCount: cleanBogieIndices.length,
              canonicalParts: bogieCanonical,
              steps: bogieSteps,
            });
          }
        }
      }

      // Emit Connect & Finish chapter joining all completed sections + any center connector bricks!
      const joinSteps = [];
      const joinedPlaced = new Set();

      if (useArticulatedSequence) {
        const halfA = mainAttachList[0];
        const halfB = mainAttachList[1];
        const endSide = artJoin.endAttachSide === 'top' ? 'top' : 'bottom';
        const endName = artJoin.bogieName || 'Center Assembly';
        const [ax, az] = artJoin.slideAxis || [1, 0];
        const centroidXZ = (idxList) => {
          let sx = 0, sz = 0;
          for (const i of idxList) { sx += boxes[i].center[0]; sz += boxes[i].center[2]; }
          const denom = Math.max(1, idxList.length);
          return [sx / denom, sz / denom];
        };
        const cA = centroidXZ(halfA.indices);
        const cB = centroidXZ(halfB.indices);
        const dirSign = ((cB[0] - cA[0]) * ax + (cB[1] - cA[1]) * az) >= 0 ? 1 : -1;
        const slideDir = [ax * dirSign, 0, az * dirSign];

        // Stage 1: Place First Half
        for (const pi of halfA.indices) joinedPlaced.add(pi);
        globalStep++;
        joinSteps.push({
          id: `join_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          cue: 'none',
          parts: halfA.indices.map(i => parts[i]),
          attachedSubmodel: {
            id: halfA.id,
            name: halfA.name,
            repeatCount: 1,
            totalRepeatCount: 1,
            isSectionAttach: true,
            attachVerb: 'Place',
            canonicalParts: halfA.canonicalParts,
          },
        });

        // Stage 2: Drop floating circular cross-axle pieces into the cavity/scoop before closing halves
        if (cleanCollarIndices.length > 0) {
          const sortedCollars = [...cleanCollarIndices].sort((a, b) => boxes[a].min[1] - boxes[b].min[1]);
          const chunkSize = Math.max(1, computeEvenRunTarget(sortedCollars.length, 8, 6));
          for (let ci = 0; ci < sortedCollars.length; ci += chunkSize) {
            const chunk = sortedCollars.slice(ci, ci + chunkSize);
            const defaultPartOffsets = {};
            chunk.forEach((idx, posInChunk) => {
              joinedPlaced.add(idx);
              defaultPartOffsets[parts[idx].id] = {
                x: Math.round(slideDir[0] * 18),
                y: 28,
                z: Math.round(slideDir[2] * 18),
                tilt: 0,
                arrow: posInChunk === 0 || posInChunk === chunk.length - 1,
              };
            });
            globalStep++;
            joinSteps.push({
              id: `join_collar_s${globalStep}`,
              num: globalStep,
              side: 'top',
              corner: 'front_right',
              cue: 'none',
              stepHint: 'Drop into joint',
              defaultPartOffsets,
              parts: chunk.map(i => parts[i]),
            });
          }
        }

        // Stage 3: Slide the Second Half together with the First Half around the center pieces
        const halfBOffsets = {};
        let minProjB = Infinity, midYB = 0;
        for (const i of halfB.indices) midYB += boxes[i].center[1];
        midYB /= Math.max(1, halfB.indices.length);
        let leadArrowId = parts[halfB.indices[0]]?.id || null;
        let bestLeadScore = Infinity;
        for (const i of halfB.indices) {
          const pr = boxes[i].center[0] * slideDir[0] + boxes[i].center[2] * slideDir[2];
          if (pr < minProjB) minProjB = pr;
        }
        for (const i of halfB.indices) {
          const pr = boxes[i].center[0] * slideDir[0] + boxes[i].center[2] * slideDir[2];
          const score = (pr - minProjB) + Math.abs(boxes[i].center[1] - midYB) * 0.4;
          if (score < bestLeadScore) { bestLeadScore = score; leadArrowId = parts[i].id; }
        }
        const slideOffX = Math.round(slideDir[0] * 60);
        const slideOffZ = Math.round(slideDir[2] * 60);
        for (const i of halfB.indices) {
          joinedPlaced.add(i);
          halfBOffsets[parts[i].id] = {
            x: slideOffX,
            y: 0,
            z: slideOffZ,
            tilt: 0,
            arrow: parts[i].id === leadArrowId,
          };
        }
        globalStep++;
        joinSteps.push({
          id: `join_slide_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          cue: 'none',
          stepHint: 'Slide sections together',
          defaultPartOffsets: halfBOffsets,
          parts: halfB.indices.map(i => parts[i]),
          attachedSubmodel: {
            id: halfB.id,
            name: halfB.name,
            repeatCount: 1,
            totalRepeatCount: 1,
            isSectionAttach: true,
            attachVerb: 'Slide Together',
            canonicalParts: halfB.canonicalParts,
          },
        });

        // Attach any extra non-cap modules beyond the first two halves
        for (let aIdx = 2; aIdx < mainAttachList.length; aIdx++) {
          const item = mainAttachList[aIdx];
          for (const pi of item.indices) joinedPlaced.add(pi);
          globalStep++;
          joinSteps.push({
            id: `join_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            parts: item.indices.map(i => parts[i]),
            attachedSubmodel: {
              id: item.id,
              name: item.name,
              repeatCount: 1,
              totalRepeatCount: 1,
              isSectionAttach: true,
              attachVerb: 'Connect',
              canonicalParts: item.canonicalParts,
            },
          });
        }

        // Stage 4: Push the vertical Technic axle/rod through both halves & cross-axle pieces
        let rodTargetXZ = null;
        if (cleanRodIndices.length > 0) {
          const rodOffsets = {};
          let rSx = 0, rSz = 0;
          for (const rIdx of cleanRodIndices) {
            joinedPlaced.add(rIdx);
            const rb = boxes[rIdx];
            rSx += rb.center[0];
            rSz += rb.center[2];
            if (endSide === 'bottom') {
              let seamMaxY = rb.max[1];
              for (const pi of joinedPlaced) {
                if (pi === rIdx) continue;
                const pb = boxes[pi];
                if (Math.hypot(pb.center[0] - rb.center[0], pb.center[2] - rb.center[2]) <= 60 && pb.max[1] > seamMaxY) {
                  seamMaxY = pb.max[1];
                }
              }
              const liftY = Math.round(Math.max(48, Math.min(96, (seamMaxY - rb.max[1]) + 34)));
              rodOffsets[parts[rIdx].id] = { x: 0, y: liftY, z: 0, tilt: 0, arrow: true };
            } else {
              rodOffsets[parts[rIdx].id] = { x: 0, y: -56, z: 0, tilt: 0, arrow: true };
            }
          }
          rodTargetXZ = [rSx / cleanRodIndices.length, rSz / cleanRodIndices.length];
          globalStep++;
          joinSteps.push({
            id: `join_rod_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            stepHint: 'Push axle through',
            defaultPartOffsets: rodOffsets,
            parts: cleanRodIndices.map(i => parts[i]),
          });
        }

        // Stage 5: Attach the intact end assembly (e.g., Middle Bogie / Pivot Assembly) onto the protruding end of the rod
        if (cleanBogieIndices.length > 0) {
          const bogieOffsets = {};
          let bCx = 0, bCz = 0;
          for (const i of cleanBogieIndices) { bCx += boxes[i].center[0]; bCz += boxes[i].center[2]; }
          bCx /= cleanBogieIndices.length;
          bCz /= cleanBogieIndices.length;
          const refX = rodTargetXZ ? rodTargetXZ[0] : bCx;
          const refZ = rodTargetXZ ? rodTargetXZ[1] : bCz;
          let bogieArrowId = parts[cleanBogieIndices[0]]?.id || null;
          let bestBogieScore = Infinity;
          for (const i of cleanBogieIndices) {
            const dXZ = Math.hypot(boxes[i].center[0] - refX, boxes[i].center[2] - refZ);
            const yBias = endSide === 'bottom' ? -boxes[i].max[1] * 0.25 : boxes[i].min[1] * 0.25;
            const score = dXZ + yBias;
            if (score < bestBogieScore) { bestBogieScore = score; bogieArrowId = parts[i].id; }
          }
          const endOffY = endSide === 'bottom' ? -44 : 44;
          for (const i of cleanBogieIndices) {
            joinedPlaced.add(i);
            bogieOffsets[parts[i].id] = {
              x: 0,
              y: endOffY,
              z: 0,
              tilt: 0,
              arrow: parts[i].id === bogieArrowId,
            };
          }
          globalStep++;
          const bogieStep = {
            id: `join_bogie_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            stepHint: cleanRodIndices.length > 0 ? `Attach ${endName.toLowerCase()} to axle` : `Attach ${endName.toLowerCase()}`,
            defaultPartOffsets: bogieOffsets,
            parts: cleanBogieIndices.map(i => parts[i]),
          };
          if (bogieCanonical && bogieSubId) {
            bogieStep.attachedSubmodel = {
              id: `${bogieSubId}_c0`,
              name: endName,
              repeatCount: 1,
              totalRepeatCount: 1,
              isSectionAttach: true,
              attachVerb: cleanRodIndices.length > 0 ? 'Attach to Axle' : 'Attach',
              canonicalParts: bogieCanonical,
            };
          }
          joinSteps.push(bogieStep);
        }

        // Stage 6: Any remaining finish/connector pieces after the articulated joint is locked
        if (cleanFinishIndices.length > 0) {
          const { steps: connectorSteps } = buildStepsForIndexList(
            cleanFinishIndices,
            'join_conn',
            joinedPlaced,
            adaptiveMaxSpread,
          );
          joinSteps.push(...connectorSteps);
        }
      } else {
        const pendingAttach = [...mainAttachList];
        let pendingJoin = [...joinIndices];
        const countTouchEdges = (indices, targetSet) => {
          let edges = 0;
          for (const pi of indices) {
            for (const nb of (adj[pi] || [])) {
              if (targetSet.has(nb)) edges++;
            }
          }
          return edges;
        };
        const emitAttachItem = (item, isFirst) => {
          for (const pi of item.indices) joinedPlaced.add(pi);
          globalStep++;
          joinSteps.push({
            id: `join_s${globalStep}`,
            num: globalStep,
            side: 'top',
            corner: 'front_right',
            cue: 'none',
            parts: item.indices.map(i => parts[i]),
            attachedSubmodel: {
              id: item.id,
              name: item.name,
              repeatCount: 1,
              totalRepeatCount: 1,
              isSectionAttach: true,
              attachVerb: isFirst ? 'Place' : 'Connect',
              canonicalParts: item.canonicalParts,
            },
          });
        };

        if (pendingAttach.length > 0) {
          emitAttachItem(pendingAttach.shift(), true);
        }
        while (pendingAttach.length > 0) {
          let bestIdx = -1, bestEdges = 0;
          for (let i = 0; i < pendingAttach.length; i++) {
            const edges = countTouchEdges(pendingAttach[i].indices, joinedPlaced);
            if (edges > bestEdges) { bestEdges = edges; bestIdx = i; }
          }
          if (bestIdx >= 0) {
            emitAttachItem(pendingAttach.splice(bestIdx, 1)[0], false);
            continue;
          }
          if (pendingJoin.length > 0 && countTouchEdges(pendingJoin, joinedPlaced) > 0) {
            const { steps: bridgeSteps, placed: afterBridge } = buildStepsForIndexList(
              pendingJoin,
              'join_conn',
              joinedPlaced,
              adaptiveMaxSpread,
            );
            for (const pi of afterBridge) joinedPlaced.add(pi);
            joinSteps.push(...bridgeSteps);
            pendingJoin = [];
            continue;
          }
          emitAttachItem(pendingAttach.shift(), false);
        }

        if (pendingJoin.length > 0) {
          const { steps: connectorSteps } = buildStepsForIndexList(
            pendingJoin,
            'join_conn',
            joinedPlaced,
            adaptiveMaxSpread,
          );
          joinSteps.push(...connectorSteps);
        }
      }

      // Place minifigures BEFORE snapping on removable roofs/caps so interior figures can be seated easily!
      for (const nm of normalizedMinifigs) {
        appendMinifigPlacementSteps(joinSteps, nm, 'join');
      }

      // Snap removable tile-majority roofs / caps cleanly onto the finished model with crisp downward arrows!
      for (const cap of deferredCaps) {
        const capOffsets = {};
        let cx = 0, cz = 0;
        for (const i of cap.indices) { cx += boxes[i].center[0]; cz += boxes[i].center[2]; }
        cx /= Math.max(1, cap.indices.length);
        cz /= Math.max(1, cap.indices.length);
        let capArrowId = parts[cap.indices[0]]?.id || null;
        let bestCapD = Infinity;
        for (const i of cap.indices) {
          const d = Math.hypot(boxes[i].center[0] - cx, boxes[i].center[2] - cz);
          if (d < bestCapD) { bestCapD = d; capArrowId = parts[i].id; }
        }
        for (const i of cap.indices) {
          joinedPlaced.add(i);
          capOffsets[parts[i].id] = {
            x: 0,
            y: 44,
            z: 0,
            tilt: 0,
            arrow: parts[i].id === capArrowId,
          };
        }
        globalStep++;
        joinSteps.push({
          id: `join_cap_s${globalStep}`,
          num: globalStep,
          side: 'top',
          corner: 'front_right',
          cue: 'none',
          stepHint: /roof/i.test(cap.name) ? 'Place removable roof' : 'Place removable cap',
          defaultPartOffsets: capOffsets,
          parts: cap.indices.map(i => parts[i]),
          attachedSubmodel: {
            id: cap.id,
            name: cap.name,
            repeatCount: 1,
            totalRepeatCount: 1,
            isSectionAttach: true,
            attachVerb: 'Place',
            canonicalParts: cap.canonicalParts,
          },
        });
      }

      if (joinSteps.length > 0) {
        chapters.push({
          id: `ach_${++chSeq}_connect`,
          name: mainAttachList.length === 2 ? 'Connect Halves & Finish' : 'Connect Sections & Finish',
          kind: 'main',
          sectionId: 'sec_connect',
          steps: joinSteps,
        });
      }

      optimizeManualStepCameras(chapters);
      const modCount = moduleSecs.length + (bogieCanonical ? 1 : 0);
      return {
        title: parsed.title,
        subtitle: `${parts.length} pieces · ${modCount} section${modCount === 1 ? '' : 's'} + final join`,
        chapters,
        _parsed: parsed,
        _mode: mode,
        _subdivisionPlan: subdivisionPlan,
      };
    }
  }

  groupedComps.forEach((group, secIdx) => {
    const sectionId = `sec_${secIdx + 1}`;
    const isFigSec = false;
    const indices = group.indices;
    const placed = new Set();
    const remaining = new Set(indices);
    const { belowMap } = buildVerticalPrereqMap(boxes, adj, roles, claddingFlags, indices, subBoxes);
    let curSteps = [];

    // Analyze support & overhead enclosure for minifigures belonging to this model section
    const indexSet = new Set(indices);
    const unplacedMinifigs = (sectionMinifigs[secIdx] || []).map((nm) => {
      const mfIdxSet = new Set(nm.indices);
      const wb = nm.worldBox;
      const supportSet = new Set();
      const overheadSet = new Set();
      for (const j of indices) {
        const b = boxes[j];
        const ovX = Math.min(wb.max[0] + 8, b.max[0]) - Math.max(wb.min[0] - 8, b.min[0]);
        const ovZ = Math.min(wb.max[2] + 8, b.max[2]) - Math.max(wb.min[2] - 8, b.min[2]);
        if (ovX > 2 && ovZ > 2 && b.max[1] <= wb.min[1] + 28 && b.max[1] >= wb.min[1] - 32) {
          supportSet.add(j);
        }
        const strictOvX = Math.min(wb.max[0], b.max[0]) - Math.max(wb.min[0], b.min[0]);
        const strictOvZ = Math.min(wb.max[2], b.max[2]) - Math.max(wb.min[2], b.min[2]);
        if (strictOvX >= 6 && strictOvZ >= 6 && b.min[1] >= wb.max[1] - 12) {
          overheadSet.add(j);
        }
      }
      for (const mi of mfIdxSet) {
        for (const nb of adj[mi]) {
          if (indexSet.has(nb) && boxes[nb].max[1] <= wb.min[1] + 32) supportSet.add(nb);
        }
      }
      return {
        nm,
        supportIndices: Array.from(supportSet),
        overheadIndices: overheadSet,
        isEnclosed: overheadSet.size > 0,
      };
    });

    const emitMinifigPlacement = (nm) => {
      // Position / rotate / pose minifigure right before placing it on the model!
      if (nm.needsTransform) {
        globalStep++;
        const poseCam = nm.poseCamera || MINIFIG_POSE_CAMERA;
        curSteps.push({
          id: `ac${secIdx + 1}_mfpose_${nm.id}_s${globalStep}`,
          num: globalStep,
          side: poseCam.side,
          corner: poseCam.corner,
          az: poseCam.az,
          el: poseCam.el,
          cue: 'none',
          isMinifigPoseStep: true,
          minifigPrep: {
            id: nm.id,
            name: nm.name,
            label: nm.transformLabel,
            canonicalParts: nm.canonicalParts,
            poseSummary: nm.poseSummary,
            indicators: nm.poseIndicators || [],
            ghostParts: nm.poseGhostParts || [],
            rotatedPartIds: nm.rotatedPartIds || [],
          },
          parts: nm.posedFrontParts || nm.posedPreviewParts,
        });
      }
      globalStep++;
      curSteps.push({
        id: `ac${secIdx + 1}_mfplace_${nm.id}_s${globalStep}`,
        num: globalStep,
        side: 'top',
        corner: 'front_right',
        cue: 'none',
        attachedMinifig: {
          id: nm.id,
          name: nm.name,
          repeatCount: 1,
          previewParts: nm.posedPreviewParts,
          canonicalParts: nm.canonicalParts,
          needsTransform: nm.needsTransform,
          transformLabel: nm.transformLabel,
          worldForward: nm.worldForward,
        },
        parts: nm.worldParts,
      });
    };

    const flushReadyEnclosedMinifigs = (upcomingIndices = null) => {
      for (let mi = 0; mi < unplacedMinifigs.length; ) {
        const entry = unplacedMinifigs[mi];
        if (!entry.isEnclosed) { mi++; continue; }
        const supportReady = entry.supportIndices.length > 0 && entry.supportIndices.every(s => placed.has(s));
        const aboutToEnclose = Boolean(upcomingIndices && placed.size > 0 && upcomingIndices.some(u => entry.overheadIndices.has(u)));
        if (supportReady || aboutToEnclose) {
          unplacedMinifigs.splice(mi, 1);
          emitMinifigPlacement(entry.nm);
        } else {
          mi++;
        }
      }
    };

    const isInstBlockedFromBelow = (instIndices, isPrereqGrounded = null) => {
      const instSet = new Set(instIndices);
      for (const pi of instIndices) {
        if (!remaining.has(pi)) continue;
        for (const u of belowMap[pi]) {
          if (!instSet.has(u) && remaining.has(u) && (!isPrereqGrounded || isPrereqGrounded(u))) {
            return true;
          }
        }
      }
      return false;
    };

    const isPartBlockedFromBelow = (i, isPrereqGrounded = null) => {
      const di = partToDup.get(i);
      if (di) return isInstBlockedFromBelow(di.group.instances[di.instIdx], isPrereqGrounded);
      return belowMap[i].some(u => remaining.has(u) && (!isPrereqGrounded || isPrereqGrounded(u)));
    };

    const flushMainSteps = () => {
      if (curSteps.length === 0) return;
      chapters.push({
        id: `ach_${++chSeq}`,
        name: group.name,
        kind: isFigSec ? 'minifigure' : 'main',
        sectionId,
        steps: curSteps,
      });
      curSteps = [];
    };

    const sectionBounds = computeBoundsFromBoxes(indices.map(i => boxes[i]));
    let builtBounds = null;
    const builtBoxes = [];
    let activeCam = { ...DEFAULT_STUDIO_CAMERA };
    let emittedInSection = 0;

    while (remaining.size > 0) {
      const isPrereqGrounded = placed.size > 0
        ? createGroundedPrereqChecker(adj, belowMap, placed, remaining)
        : null;
      let frontier;
      if (placed.size === 0) {
        const nonWheels = Array.from(remaining).filter(i => roles[i] !== 'wheel' && !claddingFlags[i] && !isPartBlockedFromBelow(i, null));
        const pool = nonWheels.length > 0 ? nonWheels : Array.from(remaining);
        pool.sort((a, b) => layerY[a] - layerY[b]);
        const minY = layerY[pool[0]];
        const lowBand = pool.filter(i => layerY[i] <= minY + 32);
        lowBand.sort((a, b) => {
          const sa = (partToDup.has(a) ? -80 : 0) + (roles[a] === 'structural' || roles[a] === 'wheel_holder' ? 50 : 0) + adj[a].length * 6 - (layerY[a] - minY) * 0.8;
          const sb = (partToDup.has(b) ? -80 : 0) + (roles[b] === 'structural' || roles[b] === 'wheel_holder' ? 50 : 0) + adj[b].length * 6 - (layerY[b] - minY) * 0.8;
          return sb - sa;
        });
        frontier = lowBand;
      } else {
        const rawFrontier = Array.from(remaining).filter(i => adj[i].some(nb => placed.has(nb)));
        const unblocked = rawFrontier.filter(i =>
          !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed)
          && !isPartBlockedFromBelow(i, isPrereqGrounded)
        );
        if (unblocked.length > 0) {
          frontier = unblocked;
        } else {
          const claddingReady = rawFrontier.filter(i => !isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, placed));
          frontier = claddingReady.length > 0 ? claddingReady : rawFrontier;
        }
        if (frontier.length === 0) {
          frontier = Array.from(remaining).sort((a, b) => layerY[a] - layerY[b]);
        }
        const skuCountsInBand = new Map();
        for (const idx of frontier) {
          const sku = allPartDescriptors[idx].sku;
          skuCountsInBand.set(sku, (skuCountsInBand.get(sku) || 0) + 1);
        }
        const refBounds = builtBounds || sectionBounds;
        frontier.sort((a, b) => compareFrontierCandidates(allPartDescriptors[a], allPartDescriptors[b], activeCam.corner, refBounds, skuCountsInBand));
      }

      const anchor = frontier[0];
      const dupInfo = partToDup.get(anchor);

      // DUPLICATE SUBMODEL HANDLING: Build 1 canonical copy with ×N, then attach copies cleanly!
      if (dupInfo) {
        const g = dupInfo.group;
        const readyInsts = [];
        g.instances.forEach((instIndices, instIdx) => {
          const unplacedInSec = instIndices.filter(pi => remaining.has(pi));
          if (unplacedInSec.length === 0) return;
          const isAnchorInst = instIdx === dupInfo.instIdx;
          const touchesPlaced = placed.size > 0 && unplacedInSec.some(pi => adj[pi].some(nb => placed.has(nb)));
          const underClear = !isInstBlockedFromBelow(instIndices, isPrereqGrounded);
          if (isAnchorInst || (touchesPlaced && underClear)) readyInsts.push(unplacedInSec);
        });

        const attachIndices = readyInsts.flat();
        flushReadyEnclosedMinifigs(attachIndices);

        // Emit the submodel's own step-by-step chapter ONCE right before its first attachment!
        if (!emittedSubChapters.has(g.id)) {
          flushMainSteps();
          const subSteps = buildLocalSubmodelSteps(g.canonicalParts, g.id, g.repeatCount);
          chapters.push({
            id: `subch_${++chSeq}_${g.id}`,
            name: g.name,
            kind: 'submodel',
            sectionId: `subsec_${g.id}`,
            repeatCount: g.repeatCount,
            canonicalParts: g.canonicalParts,
            steps: subSteps,
          });
          emittedSubChapters.add(g.id);
        }

        for (const pi of attachIndices) { remaining.delete(pi); placed.add(pi); }
        const attachBoxes = attachIndices.map(i => boxes[i]);
        const camChoice = chooseStickyStepCamera(attachBoxes, builtBoxes, builtBounds, activeCam);
        activeCam = { side: camChoice.side, corner: camChoice.corner, az: camChoice.az, el: camChoice.el };
        for (const b of attachBoxes) {
          builtBounds = expandBoundsWithBox(builtBounds, b);
          builtBoxes.push(b);
        }
        emittedInSection++;
        globalStep++;
        curSteps.push({
          id: `ac${secIdx+1}_s${globalStep}`,
          num: globalStep,
          side: camChoice.side,
          corner: camChoice.corner,
          az: camChoice.az,
          el: camChoice.el,
          cue: emittedInSection === 1 ? 'none' : camChoice.cue,
          parts: attachIndices.map(i => parts[i]),
          attachedSubmodel: {
            id: g.id,
            name: g.name,
            repeatCount: readyInsts.length,
            totalRepeatCount: g.repeatCount,
            canonicalParts: g.canonicalParts,
          },
        });
        flushReadyEnclosedMinifigs();
        continue;
      }

      // NORMAL STEP (non-duplicate-submodel bricks)
      const placedBeforeStep = new Set(placed);
      const anchorY = layerY[anchor];
      const anchorConnectedToPrev = placedBeforeStep.size > 0 && adj[anchor].some(nb => placedBeforeStep.has(nb));
      const stepIndices = selectDynamicStepIndices({
        anchor,
        parts: allPartDescriptors,
        getEligibleCandidates: (placedInStep) => {
          const supportSet = placedBeforeStep.size > 0 ? placedBeforeStep : placedInStep;
          return Array.from(remaining).filter(i => {
            if (placedInStep.has(i)) return false;
            if (partToDup.has(i)) return false;
            if (isCladdingWaitingForUpperSupport(i, claddingFlags, boxes, adj, supportSet)) return false;
            if (Math.abs(layerY[i] - anchorY) > 12) return false;
            if (placedBeforeStep.size > 0) {
              if (belowMap[i].some(u => !placedBeforeStep.has(u) && isPrereqGrounded(u))) return false;
            } else {
              if (belowMap[i].length > 0) return false;
            }
            return isCandidateConnectedForStep(i, anchorConnectedToPrev, adj, placedBeforeStep, placedInStep);
          });
        },
        modelBounds: sectionBounds,
        builtBounds,
        activeCam,
        isFirstStep: placedBeforeStep.size === 0,
        totalPartsInScope: indices.length,
      });

      for (const i of stepIndices) {
        remaining.delete(i);
        placed.add(i);
      }

      // If this step places an overhead roof brick over an enclosed minifig, pose & place that minifig right BEFORE!
      flushReadyEnclosedMinifigs(stepIndices);

      const stepBoxes = stepIndices.map(i => boxes[i]);
      const camChoice = chooseStickyStepCamera(stepBoxes, builtBoxes, builtBounds, activeCam);
      activeCam = { side: camChoice.side, corner: camChoice.corner, az: camChoice.az, el: camChoice.el };
      for (const b of stepBoxes) {
        builtBounds = expandBoundsWithBox(builtBounds, b);
        builtBoxes.push(b);
      }

      emittedInSection++;
      globalStep++;
      curSteps.push({
        id: `ac${secIdx+1}_s${globalStep}`,
        num: globalStep,
        side: camChoice.side,
        corner: camChoice.corner,
        az: camChoice.az,
        el: camChoice.el,
        cue: emittedInSection === 1 ? 'none' : camChoice.cue,
        parts: stepIndices.map(i => parts[i]),
      });

      // If this step finished the floor/seat under an enclosed minifig, pose & place it right now!
      flushReadyEnclosedMinifigs();
    }

    // Place any remaining open-air / exterior minifigures at the end of this build section
    while (unplacedMinifigs.length > 0) {
      const entry = unplacedMinifigs.shift();
      emitMinifigPlacement(entry.nm);
    }

    flushMainSteps();
  });

  optimizeManualStepCameras(chapters);
  const dupSummary = dupGroups.length > 0 ? ` · ${dupGroups.length} repeated submodel${dupGroups.length === 1 ? '' : 's'}` : '';
  return { title: parsed.title, subtitle: `${parts.length} pieces · ${globalStep} steps${dupSummary}`, chapters, _parsed: parsed, _mode: mode, _subdivisionPlan: null };
}

// =========================================================================
// 4. APPLICATION STATE, UNDO/REDO STACK & PAGINATION
// =========================================================================
const initialWordlessDefaults = getWordlessSurfaceDefaults(DEFAULT_WORDLESS_MODE);
const state = {
  model: null,
  themeId: 'blue',
  paperFormat: 'screen',   // screen | letter | a4 | square | custom
  orientation: 'landscape',// landscape | portrait
  customWidth: 10,         // stored in customUnit
  customHeight: 8,
  customUnit: 'in',        // 'in' | 'cm'
  density: 'balanced',     // compact | balanced | spacious
  layout: 'auto',          // legacy mirror ('auto' | '1-up' | '2-up' | '4-up' | 'custom')
  layoutConfig: createDefaultPageLayoutSpec(),
  layoutGroups: [],        // editable StepLayoutGroup[] for per-range layouts & styles
  detectDuplicates: true,  // auto-detect explicit + geometric duplicate submodels
  highlightNew: true,
  highlightColor: '#ff2d55',
  fadePrev: true,
  fadeOpacity: 0.82,
  showRotCues: true,
  showSizeGuides: true,
  minifigStyle: 'exploded', // 'exploded' (IMG_0316) | 'sequential' (IMG_0315) | 'classic'
  showMinifig1to1: false,
  showStepBorders: true,
  showPageTitle: true,
  wordlessMode: DEFAULT_WORDLESS_MODE, // LEGO-style icon/number-only instructions (no translation needed)
  bomShowTextFields: initialWordlessDefaults.bomShowTextFields,
  pageNumberFormat: initialWordlessDefaults.pageNumberFormat, // 'number' | 'page_n' | 'n_of_total' | 'none'
  showExtras: true,
  overrides: {},           // keyed by stepId: { pin, side, corner, az, el, modelScale, pliScale, pliPos:{x,y}, calloutPos:{x,y}, calloutDir, calloutAsPages, minifigStyle, partOffsets:{ [partId]: {x,y,z,tilt,arrow} } }
  stepInserts: {},         // keyed by stepId: [ { id, kind:'text'|'image', text, src, corner, x, y, scale } ]
  pageInserts: {},         // legacy page-keyed inserts (auto-migrated to stepInserts on load)
  dividerAfter: {},        // keyed by pageId: { title, note }
  coverMeta: createDefaultCoverMeta({ showText: initialWordlessDefaults.coverShowText }),
  completeMeta: { ...createDefaultCompleteMeta(), showText: initialWordlessDefaults.completeShowText },
  backMeta:  createDefaultBackMeta(),
  bomConfig: createDefaultBomConfig(),
  pages: [],
  pageIdx: 0,
  mode: 'pan',             // pan | parts | camera | step | page
  stepSubTab: 'camera',    // camera | layout | notes
  selectedStepId: null,
  selectedPartIds: new Set(),
  selectedArrangeEl: null, // legacy / optional dragged element state
  zoom: 1,
  panX: 0,
  panY: 0,
  pendingImport: null,
  undoStack: [],
  redoStack: [],
};

// Keep hit-test projection metadata for active rendered step slots
let currentSlotRenderInfo = new Map();

function getEffectiveBomConfig() {
  return resolveEffectiveBomConfig(normalizeBomConfig(state.bomConfig), Boolean(state.bomShowTextFields));
}

function applyWordlessMode(enabled, { pushHistory = true, render = true } = {}) {
  const next = Boolean(enabled);
  if (pushHistory && state.model) pushUndo();
  const defs = getWordlessSurfaceDefaults(next);
  state.wordlessMode = next;
  state.coverMeta = { ...normalizeCoverMeta(state.coverMeta, defs.coverShowText), showText: defs.coverShowText };
  state.completeMeta = { ...state.completeMeta, showText: defs.completeShowText };
  state.bomShowTextFields = defs.bomShowTextFields;
  state.pageNumberFormat = resolvePageNumberFormatForMode(state.pageNumberFormat, next);
  overviewThumbCache.bumpEpoch();
  if (render) renderAll();
}

function captureHistorySnap() {
  return JSON.stringify({
    chapters: state.model.chapters,
    overrides: state.overrides,
    stepInserts: state.stepInserts,
    pageInserts: state.pageInserts,
    dividerAfter: state.dividerAfter,
    coverMeta: state.coverMeta,
    completeMeta: state.completeMeta,
    backMeta: state.backMeta,
    wordlessMode: state.wordlessMode,
    bomShowTextFields: state.bomShowTextFields,
    pageNumberFormat: state.pageNumberFormat,
    layoutConfig: state.layoutConfig,
    layoutGroups: state.layoutGroups,
  });
}

function pushUndo() {
  if (!state.model) return;
  const snap = captureHistorySnap();
  state.undoStack.push(snap);
  if (state.undoStack.length > 35) state.undoStack.shift();
  state.redoStack = [];
}

function applyHistorySnap(json) {
  const s = JSON.parse(json);
  state.model.chapters = s.chapters;
  state.overrides = s.overrides;
  state.stepInserts = s.stepInserts || {};
  state.pageInserts = s.pageInserts || {};
  state.dividerAfter = s.dividerAfter;
  if (typeof s.wordlessMode === 'boolean') state.wordlessMode = s.wordlessMode;
  if (typeof s.bomShowTextFields === 'boolean') state.bomShowTextFields = s.bomShowTextFields;
  if (s.pageNumberFormat) state.pageNumberFormat = s.pageNumberFormat;
  state.coverMeta = normalizeCoverMeta(s.coverMeta, !state.wordlessMode);
  if (s.completeMeta) state.completeMeta = normalizeCompleteMeta(s.completeMeta);
  state.backMeta = normalizeBackMeta(s.backMeta);
  if (s.layoutConfig) state.layoutConfig = normalizePageLayoutSpec(s.layoutConfig);
  if (Array.isArray(s.layoutGroups)) state.layoutGroups = normalizeLayoutGroups(s.layoutGroups);
  state.selectedPartIds.clear();
  overviewThumbCache.bumpEpoch();
  renderAll();
  const ovModal = document.getElementById('overviewModal');
  if (ovModal && !ovModal.classList.contains('hidden')) {
    renderOverviewModal();
  }
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3600);
}

function getAllSteps(model) { return model ? model.chapters.flatMap(ch => ch.steps.map(step => ({ ch, step }))) : []; }
function getMainSteps(model) { return model ? model.chapters.filter(ch => ch.kind !== 'submodel').flatMap(ch => ch.steps.map(step => ({ ch, step }))) : []; }
function getAllParts(model) {
  return getMainSteps(model)
    .filter(({ step }) => !step.isMinifigPoseStep && !(step.isMinifigBuildStep && step.placedInMain))
    .flatMap(x => x.step.parts);
}
function getEffectiveMinifigStyle(step) {
  const ovStyle = step ? state.overrides[step.id]?.minifigStyle : null;
  return normalizeMinifigStepStyle(ovStyle || state.minifigStyle);
}
function renumberContinuousSteps(model) {
  // `num` = printed step number (restarts per submodel / non-classic minifig chapter).
  // `absNum` = absolute step number, unique across the whole manual; used for all ranges.
  let mainNum = 0;
  for (const ch of model.chapters) {
    if (ch.kind === 'submodel') {
      const rep = ch.repeatCount ?? (ch.isSectionModule ? 1 : 2);
      ch.steps.forEach((s, idx) => {
        s.num = idx + 1;
        s.isMainNumbered = false;
        s.isSubmodelStep = true;
        s.isSubmodelFinal = idx === ch.steps.length - 1 && rep > 1;
        s.submodelRepeat = rep;
      });
    } else if (ch.kind === 'minifigure' && normalizeMinifigStepStyle(state.minifigStyle) !== 'classic') {
      ch.steps.forEach((s, idx) => { s.num = idx + 1; s.isMainNumbered = false; });
    } else {
      for (const s of ch.steps) { s.num = ++mainNum; s.isMainNumbered = true; }
    }
  }
  assignAbsoluteStepNumbers(model.chapters);
  if (state.layoutGroups?.some((g) => g.stepBasis !== 'absolute')) {
    const refs = getAllSteps(model).map(({ step }) => ({ num: step.num, absNum: step.absNum, isMain: Boolean(step.isMainNumbered) }));
    state.layoutGroups = migrateLegacyLayoutGroups(state.layoutGroups, refs);
  }
}
function getPreviousPartsForStep(model, ch, step) {
  const prev = [];
  if (step.isStandaloneFigure || step.isMinifigPoseStep) return prev;
  if (ch.kind === 'submodel') {
    for (const s of ch.steps) { if (s.id === step.id) break; prev.push(...s.parts); }
    return prev;
  }
  const sec = ch.sectionId || ch.id;
  for (const c of model.chapters) {
    if (c.kind === 'submodel') continue;
    if ((c.sectionId || c.id) !== sec) continue;
    for (const s of c.steps) {
      if (s.id === step.id) return prev;
      if (s.isMinifigPoseStep || s.isStandaloneFigure) continue;
      prev.push(...s.parts);
    }
    if (c.id === ch.id) break;
  }
  return prev;
}
const submodelThumbCache = new Map();
function getSubmodelThumb(subObj, w = 220, h = 150) {
  if (!subObj || !subObj.canonicalParts?.length) return '';
  if (submodelThumbCache.size > 120) submodelThumbCache.clear();
  const k = `${subObj.id || subObj.name}_${w}x${h}`;
  if (submodelThumbCache.has(k)) return submodelThumbCache.get(k);
  const snap = renderSnapshot([], subObj.canonicalParts, 38, 28, w, h, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  submodelThumbCache.set(k, snap.url);
  return snap.url;
}
function getMinifigThumb(partsList, cacheKey, az = MINIFIG_BUILD_CAMERA.az, el = MINIFIG_BUILD_CAMERA.el, w = 140, h = 140) {
  if (!partsList?.length) return '';
  if (submodelThumbCache.size > 140) submodelThumbCache.clear();
  const k = `mf_${cacheKey}_${az}_${el}_${w}x${h}`;
  if (submodelThumbCache.has(k)) return submodelThumbCache.get(k);
  const snap = renderSnapshot([], partsList, az, el, w, h, 1.04, { highlightNew:false, fadePrev:false, showArrows:false, accent:'#1a73e8' });
  submodelThumbCache.set(k, snap.url);
  return snap.url;
}

function formatPageNumber(num, total) {
  return formatManualPageNumber(num, total, state.pageNumberFormat, Boolean(state.wordlessMode));
}

function getBomUsableAreaInches() {
  const dims = computePageFrameDimensions();
  const cfg = getEffectiveBomConfig();
  const typo = computePageTypography({
    widthIn: dims.widthIn,
    heightIn: dims.heightIn,
    pxPerInch: dims.pxPerInch,
    density: state.density,
    bomDensity: cfg.density,
  });
  const contentWidthIn = Math.max(1.5, (dims.width - typo.pad * 2) / dims.pxPerInch);
  const contentHeightIn = Math.max(1.5, (dims.height - typo.pad * 2 - typo.footerH - typo.bom.headerH) / dims.pxPerInch);
  return { dims, typo, contentWidthIn, contentHeightIn };
}

function getPartLocalDimsLdu(part) {
  if (part.children && part.children.length > 0) {
    const sample = normalizeCompositeThumbPart(part, (pid) => resolvePart(pid).name, computeWorldBox);
    const box = computeWorldBox(sample);
    return [
      Math.max(4, box.max[0] - box.min[0]),
      Math.max(4, box.max[1] - box.min[1]),
      Math.max(4, box.max[2] - box.min[2]),
    ];
  }
  const compiled = compileEmbeddedDat(part.p);
  if (compiled && compiled.min && compiled.max) {
    return [
      Math.max(4, compiled.max[0] - compiled.min[0]),
      Math.max(4, compiled.max[1] - compiled.min[1]),
      Math.max(4, compiled.max[2] - compiled.min[2]),
    ];
  }
  const def = resolvePart(part.p);
  return [
    Math.max(4, (def.sx || 1) * 20),
    Math.max(4, def.h || 24),
    Math.max(4, (def.sz || 1) * 20),
  ];
}

function getDisplayPartIdForPart(part) {
  const raw = String(part?.p || '');
  if (compositePartDefs.has(normId(raw)) && Array.isArray(part?.children) && part.children.length > 0) {
    return formatDisplayPartId(part.children[0].p || raw);
  }
  return formatDisplayPartId(raw);
}

function classifyBomCategory(part) {
  const name = (resolvePart(part.p).name || '').toLowerCase();
  if (classifyMinifigGroupKind(part, (pid) => resolvePart(pid).name) !== null) return [7, 'Minifigures'];
  if (/wheel|tire|tyre|rim|bogie|track/.test(name)) return [6, 'Wheels & Tires'];
  if (/window|door|glass|panel|windscreen|fence|lattice|frame/.test(name)) return [5, 'Windows & Panels'];
  if (/technic|axle|pin|beam|liftarm|gear|bush|connector|cross/.test(name)) return [4, 'Technic'];
  if (/slope|wedge|curved|cheese|roof|wing|cone|dish/.test(name)) return [3, 'Slopes & Wedges'];
  if (/tile/.test(name)) return [2, 'Tiles'];
  if (/plate|baseplate|jumper|bracket|hinge|turntable|clip|bar/.test(name)) return [1, 'Plates'];
  if (/brick|arch|cylinder|round|pillar|column/.test(name)) return [0, 'Bricks'];
  return [8, 'Other'];
}

function getColorSortKey(colorId) {
  const col = resolveColorInfo(colorId) || { name: `Color ${colorId}`, hex: '#9ea3a8' };
  const cname = (col.name || '').toLowerCase();
  const isSpecial = /trans|chrome|pearl|metal|glow|glitter/.test(cname);
  const hex = (col.hex || '#9ea3a8').replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255 || 0;
  const g = parseInt(hex.slice(2, 4), 16) / 255 || 0;
  const b = parseInt(hex.slice(4, 6), 16) / 255 || 0;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const lum = (max + min) / 2;
  const d = max - min;
  const sat = d === 0 ? 0 : d / (1 - Math.abs(2 * lum - 1));
  let hue = 0;
  if (d > 0) {
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  // Group 0: Neutrals (white -> gray -> black), Group 1: Solid colors by hue, Group 2: Trans/Metallic
  const grp = isSpecial ? 2 : (sat < 0.14 ? 0 : 1);
  const ord = grp === 0 ? (1 - lum) : (hue / 360);
  return grp * 1000 + ord * 100 + (1 - lum) * 10;
}

function getSortedBomEntries(allParts) {
  const cfg = normalizeBomConfig(state.bomConfig);
  const map = new Map();
  for (const p of allParts) {
    const k = `${p.p}:${p.c}`;
    if (!map.has(k)) {
      const meta = resolvePart(p.p);
      const [catIdx, catName] = classifyBomCategory(p);
      const colInfo = resolveColorInfo(p.c) || { name: `Color ${p.c}`, hex: '#9ea3a8' };
      const [dx, dy, dz] = getPartLocalDimsLdu(p);
      const proj = projectPartDimensionsLdu(dx, dy, dz);
      const partIdDisplay = getDisplayPartIdForPart(p);
      map.set(k, {
        part: p,
        qty: 0,
        meta,
        partIdDisplay,
        colorName: colInfo.name || `Color ${p.c}`,
        colorHex: colInfo.hex || '#9ea3a8',
        catIdx,
        catName,
        colorKey: getColorSortKey(p.c),
        dx: proj.dx,
        dy: proj.dy,
        dz: proj.dz,
        projW: proj.projW,
        projH: proj.projH,
        sizeScore: proj.sizeScore,
      });
    }
    map.get(k).qty++;
  }
  const cmpTrait = (a, b, trait) => {
    if (trait === 'color') return (a.colorKey - b.colorKey) || (a.part.c - b.part.c);
    if (trait === 'category') return (a.catIdx - b.catIdx) || a.meta.name.localeCompare(b.meta.name);
    if (trait === 'qty') return b.qty - a.qty;
    if (trait === 'size') return b.sizeScore - a.sizeScore;
    if (trait === 'name') return a.meta.name.localeCompare(b.meta.name);
    if (trait === 'partId') return comparePartIdsNatural(a.partIdDisplay, b.partIdDisplay);
    return 0;
  };
  const primary = cfg.sortPrimary || 'color';
  const secondary = cfg.sortSecondary || 'category';
  return Array.from(map.values()).sort((a, b) =>
    cmpTrait(a, b, primary)
    || cmpTrait(a, b, secondary)
    || (b.qty - a.qty)
    || comparePartIdsNatural(a.partIdDisplay, b.partIdDisplay)
    || a.meta.name.localeCompare(b.meta.name)
  );
}

const FIREWORK_BURSTS = [
  { cx: 14, cy: 20, r: 9.5, rays: 12, color: '#f59e0b', sub: '#ef4444' },
  { cx: 86, cy: 19, r: 10.5, rays: 14, color: '#1a73e8', sub: '#38bdf8' },
  { cx: 12, cy: 76, r: 8.5, rays: 10, color: '#10b981', sub: '#fbbf24' },
  { cx: 88, cy: 74, r: 9.0, rays: 12, color: '#ec4899', sub: '#f59e0b' },
  { cx: 26, cy: 11, r: 5.5, rays: 8,  color: '#ef4444', sub: '#facc15' },
  { cx: 75, cy: 84, r: 6.0, rays: 8,  color: '#38bdf8', sub: '#8b5cf6' },
];

function buildFireworksSvg() {
  const els = [];
  for (const b of FIREWORK_BURSTS) {
    for (let i = 0; i < b.rays; i++) {
      const a = (i / b.rays) * Math.PI * 2;
      const isLong = i % 2 === 0;
      const r0 = b.r * 0.28;
      const r1 = b.r * (isLong ? 1.0 : 0.68);
      const x0 = (b.cx + Math.cos(a) * r0).toFixed(2);
      const y0 = (b.cy + Math.sin(a) * r0).toFixed(2);
      const x1 = (b.cx + Math.cos(a) * r1).toFixed(2);
      const y1 = (b.cy + Math.sin(a) * r1).toFixed(2);
      const col = isLong ? b.color : b.sub;
      els.push(`<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${col}" stroke-width="${isLong ? 0.65 : 0.45}" stroke-linecap="round" opacity="0.88"/>`);
      if (isLong) {
        const dx = (b.cx + Math.cos(a) * (r1 + 1.35)).toFixed(2);
        const dy = (b.cy + Math.sin(a) * (r1 + 1.35)).toFixed(2);
        els.push(`<circle cx="${dx}" cy="${dy}" r="0.52" fill="${b.sub}" opacity="0.9"/>`);
      }
    }
    els.push(`<circle cx="${b.cx}" cy="${b.cy}" r="0.9" fill="${b.color}" opacity="0.85"/>`);
  }
  return `<svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${els.join('')}</svg>`;
}

function drawFireworksCanvas(ctx, pxW, pxH) {
  const unit = Math.min(pxW, pxH) / 100;
  ctx.save();
  for (const b of FIREWORK_BURSTS) {
    const cx = (b.cx / 100) * pxW;
    const cy = (b.cy / 100) * pxH;
    const rad = b.r * unit;
    for (let i = 0; i < b.rays; i++) {
      const a = (i / b.rays) * Math.PI * 2;
      const isLong = i % 2 === 0;
      const r0 = rad * 0.28;
      const r1 = rad * (isLong ? 1.0 : 0.68);
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
      ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.strokeStyle = isLong ? b.color : b.sub;
      ctx.lineWidth = Math.max(1.5, (isLong ? 0.65 : 0.45) * unit);
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.88;
      ctx.stroke();
      if (isLong) {
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * (r1 + 1.35 * unit), cy + Math.sin(a) * (r1 + 1.35 * unit), Math.max(1.5, 0.52 * unit), 0, Math.PI * 2);
        ctx.fillStyle = b.sub;
        ctx.globalAlpha = 0.9;
        ctx.fill();
      }
    }
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, 0.9 * unit), 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.restore();
}

function rebuildPages() {
  if (!state.model) { state.pages = []; return; }
  renumberContinuousSteps(state.model);
  const pages = [];
  let pNum = 0;
  const isLandPage = state.paperFormat === 'screen'
    ? computePageFrameDimensions().isLandscape
    : getActivePagePhysicalInches()[0] >= getActivePagePhysicalInches()[1];
  if (state.showExtras) pages.push({ id:'cover', kind:'cover', num:++pNum, label:'Cover' });

  for (const ch of state.model.chapters) {
    let i = 0;
    let isFirstChPage = true;
    const isSubCh = ch.kind === 'submodel';
    const subRepeat = ch.repeatCount ?? (ch.isSectionModule ? 1 : 2);

    // Emit an official-style Bag / Stage opener divider page before each numbered bag chapter
    if (ch.kind === 'bag' && ch.steps.length > 0) {
      pages.push({
        id: `secdiv_${ch.id}`,
        kind: 'section_divider',
        num: ++pNum,
        label: ch.name,
        chapterName: ch.name,
        bagNumber: ch.bagNumber || 1,
        pieceCount: ch.pieceCount || ch.steps.reduce((acc, s) => acc + s.parts.length, 0),
        stepCount: ch.steps.length,
        firstStepNum: ch.steps[0].num,
        lastStepNum: ch.steps[ch.steps.length - 1].num,
        previewParts: ch.bagPreviewParts || ch.steps.flatMap(s => s.parts),
      });
    }

    while (i < ch.steps.length) {
      const first = ch.steps[i];
      const firstOv = state.overrides[first.id] || {};
      const isFirstMfBuild = Boolean((first.isStandaloneFigure || ch.kind === 'minifigure') && !first.isMinifigPoseStep);
      const firstMfStyle = isFirstMfBuild ? getEffectiveMinifigStyle(first) : 'classic';

      // Sequential Step-by-Step Minifigure Assembly (IMG_0315): 1 horizontal row per page (e.g. 1-3 then 4-6)
      if (isFirstMfBuild && firstMfStyle === 'sequential') {
        const seqPlan = getMinifigSequentialPlanForStep(first);
        const slices = paginateMinifigSequentialStages(seqPlan.stages.length, isLandPage);
        const mfTitle = first.minifigName || (ch.steps.length > 1 ? `Minifigure ${i + 1}` : 'Minifigure');
        for (const sl of slices) {
          const pgId = sl.pageIdx === 0 ? `pg_${first.id}` : `pg_${first.id}_seq${sl.pageIdx + 1}`;
          const stepLabel = sl.end - sl.start === 1 ? `Step ${sl.start + 1}` : `Steps ${sl.start + 1}–${sl.end}`;
          pages.push({
            id: pgId,
            kind: 'steps',
            num: ++pNum,
            label: `${mfTitle} · ${stepLabel}`,
            chapterName: mfTitle,
            isSubmodelPage: false,
            submodelIntro: null,
            pinned: sl.pageIdx === 0 ? Boolean(firstOv.pin) : false,
            slots: [{ ch, step: first, minifigSeqSlice: sl }],
          });
          if (state.dividerAfter[pgId]) {
            pages.push({ id: 'div_' + pgId, kind: 'divider', num: ++pNum, label: 'Divider Page', sourcePgId: pgId });
          }
        }
        i++;
        isFirstChPage = false;
        continue;
      }

      // Submodel converted to Full Pages gets its own dedicated page before attachment!
      if (first.subassembly && firstOv.calloutAsPages) {
        pages.push({
          id: 'subpg_' + first.id, kind: 'submodel_page', num: ++pNum,
          label: `${first.subassembly.name} (${first.subassembly.repeatCount}×)`,
          chapterName: ch.name, step: first, ch,
        });
      }
      const nextStep = ch.steps[i + 1];
      const isPosePlacePair = Boolean(first.isMinifigPoseStep && nextStep?.attachedMinifig);
      const firstGroup = findLayoutGroupForStep(state.layoutGroups, getAbsStepNum(first));
      const pageLayoutSpec = firstGroup ? firstGroup.layout : state.layoutConfig;
      const explicitCap = getSpecStepsPerPageCap(pageLayoutSpec);
      const cap = explicitCap !== null
        ? explicitCap
        : (isPosePlacePair
          ? 2
          : (isFirstMfBuild && firstMfStyle === 'exploded'
            ? (isLandPage && first.parts.length <= 7 ? 2 : 1)
            : (first.subassembly || first.attachedSubmodel || first.attachedMinifig || first.parts.length >= 6 ? 1 : 2)));
      const slots = [];
      for (let k = 0; k < cap && i < ch.steps.length; k++) {
        const s = ch.steps[i];
        const sGroup = findLayoutGroupForStep(state.layoutGroups, getAbsStepNum(s));
        if (k > 0 && (sGroup?.id || null) !== (firstGroup?.id || null)) break;
        const isSMfBuild = Boolean((s.isStandaloneFigure || ch.kind === 'minifigure') && !s.isMinifigPoseStep);
        if (k > 0 && isSMfBuild && getEffectiveMinifigStyle(s) === 'sequential') break;
        if (k > 0 && state.overrides[s.id]?.pin) break;
        if (k > 0 && (s.subassembly || s.attachedSubmodel || (s.attachedMinifig && !isPosePlacePair) || s.isMinifigPoseStep) && explicitCap === null) break;
        slots.push({ ch, step: s });
        i++;
        if ((s.subassembly || s.attachedSubmodel || s.attachedMinifig) && explicitCap === null) break;
      }
      const allExplodedMf = slots.every(sl =>
        Boolean((sl.step.isStandaloneFigure || sl.ch.kind === 'minifigure') && !sl.step.isMinifigPoseStep) &&
        getEffectiveMinifigStyle(sl.step) === 'exploded',
      );
      const stepRange = slots.length === 1 ? `Step ${slots[0].step.num}` : `Steps ${slots[0].step.num}–${slots[slots.length-1].step.num}`;
      const label = allExplodedMf
        ? (slots.length === 1 ? (slots[0].step.minifigName || 'Minifigure') : `Minifigures ${slots[0].step.num}–${slots[slots.length - 1].step.num}`)
        : isSubCh
          ? (subRepeat > 1 ? `${ch.name} ×${subRepeat} · ${stepRange}` : `${ch.name} · ${stepRange}`)
          : (ch.kind === 'bag' ? `${ch.name} · ${stepRange}` : stepRange);
      const pgId = 'pg_' + slots[0].step.id;
      pages.push({
        id: pgId,
        kind: 'steps',
        num: ++pNum,
        label,
        chapterName: isSubCh && subRepeat > 1 ? `${ch.name} (×${subRepeat})` : ch.name,
        isSubmodelPage: isSubCh,
        submodelIntro: (isSubCh && isFirstChPage) ? {
          id: ch.id,
          name: ch.name,
          repeatCount: subRepeat,
          isSectionModule: Boolean(ch.isSectionModule),
          pieceCount: ch.pieceCount || (ch.canonicalParts ? ch.canonicalParts.length : 0),
          canonicalParts: ch.canonicalParts || [],
        } : null,
        pinned: Boolean(state.overrides[slots[0].step.id]?.pin),
        layoutSpec: pageLayoutSpec,
        layoutGroup: firstGroup || null,
        slots,
      });
      isFirstChPage = false;
      if (state.dividerAfter[pgId]) {
        pages.push({ id: 'div_' + pgId, kind: 'divider', num: ++pNum, label: 'Divider Page', sourcePgId: pgId });
      }
    }
  }
  if (state.showExtras) {
    // 1. Build Complete celebration page BEFORE Parts List
    pages.push({ id:'complete', kind:'complete', num:++pNum, label:'Build Complete' });

    // 2. Multi-page spillover Parts List (zero cut-off!) — Grid or Table format
    const allParts = getAllParts(state.model);
    const bomEntries = getSortedBomEntries(allParts);
    const bomCfg = getEffectiveBomConfig();
    const { contentWidthIn, contentHeightIn } = getBomUsableAreaInches();

    if (bomCfg.format === 'table') {
      const tablePlan = computeBomTablePlan({
        items: bomEntries,
        config: bomCfg,
        contentHeightIn,
      });
      const bomPageCount = Math.max(1, tablePlan.pageCount);
      for (let bi = 0; bi < bomPageCount; bi++) {
        const slice = tablePlan.pages[bi] || [];
        pages.push({
          id: `bom_${bi}`,
          kind: 'bom',
          num: ++pNum,
          label: bomPageCount > 1 ? `Parts List (${bi + 1}/${bomPageCount})` : 'Parts List',
          bomFormat: 'table',
          bomPageIdx: bi,
          bomPageCount,
          bomTotalUnique: bomEntries.length,
          bomTotalPieces: allParts.length,
          bomTableRowsPerPage: tablePlan.rowsPerPage,
          bomEntries: slice,
        });
      }
    } else {
      const gridPlan = resolveBomGridPlan({
        items: bomEntries,
        config: bomCfg,
        contentWidthIn,
        contentHeightIn,
      });
      const bomPageCount = Math.max(1, gridPlan.pageCount);
      for (let bi = 0; bi < bomPageCount; bi++) {
        const pageCells = gridPlan.pages[bi] || [];
        pages.push({
          id: `bom_${bi}`,
          kind: 'bom',
          num: ++pNum,
          label: bomPageCount > 1 ? `Parts List (${bi + 1}/${bomPageCount})` : 'Parts List',
          bomFormat: 'grid',
          bomPageIdx: bi,
          bomPageCount,
          bomTotalUnique: bomEntries.length,
          bomTotalPieces: allParts.length,
          bomCols: gridPlan.cols,
          bomRows: gridPlan.rows,
          bomCellWidthIn: gridPlan.cellWidthIn,
          bomCellHeightIn: gridPlan.cellHeightIn,
          bomCells: pageCells,
          bomEntries: pageCells.map((c) => c.item),
        });
      }
    }

    // 3. Distinct Back Cover
    pages.push({ id:'back', kind:'back', num:++pNum, label:'Back Cover' });
  }
  const wasOnBom = state.pages[state.pageIdx]?.kind === 'bom';
  state.pages = pages;
  if (state.pageIdx >= pages.length) state.pageIdx = Math.max(0, pages.length - 1);
  if (wasOnBom && state.pages[state.pageIdx]?.kind !== 'bom') {
    let lastBomIdx = -1;
    for (let pi = pages.length - 1; pi >= 0; pi--) {
      if (pages[pi].kind === 'bom') { lastBomIdx = pi; break; }
    }
    if (lastBomIdx >= 0) state.pageIdx = lastBomIdx;
  }
}

function getStepCamera(step) {
  return resolveStudioStepCamera(step, step?.id ? state.overrides[step.id] : undefined);
}

function getEffectiveStepCue(ch, step) {
  return resolveEffectiveStudioStepCue(state.model?.chapters, ch, step, state.overrides);
}

function getActiveStepObj() {
  const pg = state.pages[state.pageIdx];
  if (!pg || pg.kind !== 'steps') return null;
  const found = pg.slots.find(s => s.step.id === state.selectedStepId) || pg.slots[0];
  if (found) state.selectedStepId = found.step.id;
  return found;
}

// =========================================================================
// 5. ZOOM & PAN ENGINE (Hardware-Accelerated CSS Transform — Zero Crash!)
// =========================================================================
let stageRafId = 0, lastZoomText = '', currentPageFitScale = 1;
let zoomHiResTimer = 0, lastZoomRendered = 1;
function getEffectiveStageScale() {
  return Math.max(0.1, currentPageFitScale * state.zoom);
}
let currentCoverHeroInfo = null;
function refreshStepModelsForZoom() {
  zoomHiResTimer = 0;
  if (!state.model) return;
  const pg = state.pages[state.pageIdx];
  const frame = document.getElementById('pageFrame');
  if (!pg || !frame) return;
  const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
  lastZoomRendered = state.zoom;

  if ((pg.kind === 'cover' || pg.kind === 'complete') && currentCoverHeroInfo) {
    const target = computeCoverHeroRenderSize({
      heroWidth: currentCoverHeroInfo.heroW,
      heroHeight: currentCoverHeroInfo.heroH,
      dpr,
      zoom: state.zoom,
      stageFitScale: currentPageFitScale,
      mode: 'screen',
      gpuMaxDim: getCoverHeroGpuMaxDim(),
    });
    if (shouldUpgradeStepRenderForZoom(currentCoverHeroInfo.w, currentCoverHeroInfo.h, target.width, target.height)) {
      const upgraded = renderCoverHeroSnapshot(
        currentCoverHeroInfo.parts,
        currentCoverHeroInfo.az,
        currentCoverHeroInfo.el,
        currentCoverHeroInfo.zoom,
        target.width,
        target.height,
        currentCoverHeroInfo.theme,
      );
      currentCoverHeroInfo.w = upgraded.w;
      currentCoverHeroInfo.h = upgraded.h;
      const img = frame.querySelector('img[data-cover-hero-img="true"]');
      if (img && upgraded.url) img.src = upgraded.url;
    }
    return;
  }

  if (pg.kind !== 'steps' || currentSlotRenderInfo.size === 0) return;

  for (const [stepId, info] of currentSlotRenderInfo.entries()) {
    if (state.mode === 'step' && state.stepSubTab === 'camera' && state.selectedStepId === stepId) continue;
    if (info.isMfExploded) {
      const expSize = computeMinifigDiagramRenderSize({
        kind: 'exploded',
        slotCount: info.slotCount || 1,
        isFeatured: Boolean(info.isFeatured),
        dpr,
        zoom: state.zoom,
        mode: 'screen',
        gpuMaxDim: snapshotEngine.maxDim,
      });
      if (!shouldUpgradeStepRenderForZoom(info.mfExplodedW || 0, info.mfExplodedH || 0, expSize.width, expSize.height)) continue;
      const upgraded = renderMinifigExplodedDiagram(info.step, info.cam, expSize.width, expSize.height, info.theme, info.modelScale);
      info.mfExplodedW = upgraded.w;
      info.mfExplodedH = upgraded.h;
      const img = frame.querySelector(`img[data-pick-step="${stepId}"]`);
      if (img && upgraded.url) img.src = upgraded.url;
    } else if (!info.isMfSeq && info.snap?.mesh) {
      const target = computeStepSlotRenderSize({
        slotWidth: info.estSlotW || 640,
        slotHeight: info.estSlotH || 440,
        slotCount: info.slotCount || 1,
        isFeatured: Boolean(info.isFeatured),
        isCompact: Boolean(info.isCompact),
        dpr,
        zoom: state.zoom,
        stageFitScale: currentPageFitScale,
        mode: 'screen',
        gpuMaxDim: snapshotEngine.maxDim,
      });
      if (!shouldUpgradeStepRenderForZoom(info.snap.w, info.snap.h, target.width, target.height)) continue;
      const upgraded = renderMeshSnapshot(
        info.snap.mesh,
        info.cam.az,
        info.cam.el,
        target.width,
        target.height,
        info.modelScale,
        info.opts,
      );
      info.snap = upgraded;
      const img = frame.querySelector(`.step-render-img[data-pick-step="${stepId}"]`);
      if (img && upgraded.url) img.src = upgraded.url;
    }
  }
}
function scheduleZoomHiResRefresh() {
  if (zoomHiResTimer) clearTimeout(zoomHiResTimer);
  if (state.zoom <= 1.05 || Math.abs(state.zoom - lastZoomRendered) < 0.14) return;
  zoomHiResTimer = window.setTimeout(refreshStepModelsForZoom, 180);
}
function getStageOrigin() {
  const stage = document.getElementById('stageViewport');
  if (!stage) return { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };
  const rect = stage.getBoundingClientRect();
  const cs = getComputedStyle(stage);
  const pl = parseFloat(cs.paddingLeft) || 0;
  const pr = parseFloat(cs.paddingRight) || 0;
  const pt = parseFloat(cs.paddingTop) || 0;
  const pb = parseFloat(cs.paddingBottom) || 0;
  return {
    cx: rect.left + pl + (rect.width - pl - pr) / 2,
    cy: rect.top + pt + (rect.height - pt - pb) / 2,
  };
}
function flushStageTransform() {
  stageRafId = 0;
  const container = document.getElementById('stageContainer');
  if (!container) return;
  // Softly clamp pan so the page can't be lost completely offscreen
  const limX = Math.max(window.innerWidth * 0.75, window.innerWidth * state.zoom * 0.65);
  const limY = Math.max(window.innerHeight * 0.75, window.innerHeight * state.zoom * 0.65);
  state.panX = Math.max(-limX, Math.min(limX, state.panX));
  state.panY = Math.max(-limY, Math.min(limY, state.panY));
  const effScale = getEffectiveStageScale();
  container.style.transform = `translate3d(${state.panX.toFixed(2)}px, ${state.panY.toFixed(2)}px, 0) scale(${effScale.toFixed(4)})`;
  const txt = Math.round(state.zoom * 100) + '%';
  if (txt !== lastZoomText) {
    lastZoomText = txt;
    const lbl = document.getElementById('btnZoomFit');
    if (lbl) lbl.textContent = txt;
  }
  scheduleZoomHiResRefresh();
}

function applyStageTransform() {
  if (!stageRafId) stageRafId = requestAnimationFrame(flushStageTransform);
}

function setZoom(nextZoom, focalX = null, focalY = null) {
  const prevZoom = state.zoom;
  const clamped = Math.max(0.45, Math.min(4.5, nextZoom));
  if (focalX !== null && focalY !== null) {
    const { cx, cy } = getStageOrigin();
    const vx = focalX - cx, vy = focalY - cy;
    const ratio = clamped / prevZoom;
    state.panX = vx - (vx - state.panX) * ratio;
    state.panY = vy - (vy - state.panY) * ratio;
  }
  state.zoom = clamped;
  if (Math.abs(state.zoom - 1) < 0.03 && focalX === null) { state.zoom = 1; state.panX = 0; state.panY = 0; }
  applyStageTransform();
}

function resetZoom() { state.zoom = 1; state.panX = 0; state.panY = 0; applyStageTransform(); }

function getActivePagePhysicalInches() {
  if (state.paperFormat === 'custom') {
    const div = state.customUnit === 'cm' ? 2.54 : 1;
    const wIn = Math.max(2, Math.min(48, (Number(state.customWidth) || 10) / div));
    const hIn = Math.max(2, Math.min(48, (Number(state.customHeight) || 8) / div));
    return [wIn, hIn];
  }
  const fmt = PAPER_FORMATS[state.paperFormat] || PAPER_FORMATS.letter;
  if (!fmt.supportsOrientation) return [fmt.wIn, fmt.hIn];
  const shortSide = Math.min(fmt.wIn, fmt.hIn), longSide = Math.max(fmt.wIn, fmt.hIn);
  return state.orientation === 'portrait' ? [shortSide, longSide] : [longSide, shortSide];
}

function formatPhysicalDims(wIn, hIn) {
  const wCm = wIn * 2.54, hCm = hIn * 2.54;
  return `${wIn.toFixed(1)} × ${hIn.toFixed(1)} in · ${wCm.toFixed(1)} × ${hCm.toFixed(1)} cm`;
}

function computePageFrameDimensions() {
  const [wIn, hIn] = getActivePagePhysicalInches();
  return computeCanonicalPageMetrics({
    paperFormat: state.paperFormat,
    widthIn: wIn,
    heightIn: hIn,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
  });
}

// =========================================================================
// 6. MAIN RENDERER (LIVE FULL-SCREEN PAGE + FLOATING CONTEXT OVERLAYS)
// =========================================================================
function getModelFileTypeLabel() {
  const rec = lastSourceRecord;
  const rawName = (rec?.fileName || '').trim();
  const lower = rawName.toLowerCase();
  if (lower.endsWith('.io') || rec?.kind === 'io') {
    return 'BrickLink Studio (.io)';
  }
  if (lower.endsWith('.mpd')) {
    return 'LDraw Multi-Part (.mpd)';
  }
  if (lower.endsWith('.ldr') || rec?.kind === 'ldr') {
    return 'LDraw (.ldr)';
  }
  if (rec?.kind === 'project' || isProjectFileName(rawName)) {
    return `Saved Project (${PROJECT_FILE_EXT})`;
  }
  return 'Imported Model';
}

function isPanGestureEnabled() {
  const page = state.pages[state.pageIdx];
  return state.mode === 'pan' || getVisibleModeTabs(page?.kind).length === 0;
}

function syncModePillButtons(page) {
  const visibleModes = getVisibleModeTabs(page?.kind);
  const modePill = document.getElementById('modePill');
  if (modePill) modePill.classList.toggle('hidden', visibleModes.length === 0);
  const isBom = page?.kind === 'bom';
  const bomModalOpen = isBom && isBomSetupModalOpen();
  const editLabelEl = document.getElementById('modeEditLabel');
  if (editLabelEl) editLabelEl.textContent = getEditModeButtonLabel(page?.kind);
  const editIconDef = document.getElementById('modeEditIconDefault');
  const editIconBom = document.getElementById('modeEditIconBom');
  if (editIconDef) editIconDef.classList.toggle('hidden', isBom);
  if (editIconBom) editIconBom.classList.toggle('hidden', !isBom);
  document.querySelectorAll('.mode-btn').forEach(b => {
    const m = b.getAttribute('data-mode');
    const visible = visibleModes.includes(m);
    const active = visible && (isBom
      ? (bomModalOpen ? m === 'page' : m === 'pan')
      : m === state.mode);
    b.className = `mode-btn ${visible ? 'flex' : 'hidden'} min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-full items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
      active ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'
    }`;
  });
}

function getRotationCueLabel(cue, wordless = Boolean(state.wordlessMode)) {
  return getRotationCueDisplay(cue, wordless).text;
}

function renderRotationCueBadgeHtml(cue, theme, typo, isTightSlot = false, wordless = Boolean(state.wordlessMode)) {
  if (!cue || cue === 'none') return '';
  const disp = getRotationCueDisplay(cue, wordless);
  const label = disp.text;
  const medallionPx = Math.max(isTightSlot ? 24 : 30, Math.round(typo.pt(isTightSlot ? 20 : 26)));
  const svgPx = Math.max(15, Math.round(medallionPx * 0.66));
  const fontPx = Math.max(isTightSlot ? 10 : 12, Math.round(typo.pt(isTightSlot ? 9 : 11)));
  const padY = Math.max(3, Math.round(typo.pt(isTightSlot ? 2.5 : 3.5)));
  const padL = Math.max(3, Math.round(typo.pt(isTightSlot ? 2.5 : 3.5)));
  const padR = Math.max(9, Math.round(typo.pt(isTightSlot ? 7.5 : 10.5)));
  const gapPx = Math.max(5, Math.round(typo.pt(isTightSlot ? 4.5 : 6)));
  const borderPx = Math.max(2, Math.round(typo.pt(2.2)));

  let svgInner = '';
  if (cue === 'flip_vertical') {
    svgInner = wordless
      ? buildFlipVerticalIconInnerSvg()
      : `
      <path d="M5 10.5C5 6.3 8.1 3.5 12 3.5c3.9 0 7 2.8 7 7"/>
      <polyline points="16.2 8.2 19 11 21.8 8.2"/>
      <path d="M19 13.5c0 4.2-3.1 7-7 7-3.9 0-7-2.8-7-7"/>
      <polyline points="7.8 15.8 5 13 2.2 15.8"/>`;
  } else {
    const mirror = cue === 'yaw_90_ccw' ? ' transform="translate(24 0) scale(-1 1)"' : '';
    const pivotDot = cue === 'yaw_180' ? '<circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none"/>' : '';
    svgInner = `<g${mirror}>
      <path d="M20.5 11.5A8.5 8.5 0 0 0 6.2 5.4L4 7.6"/>
      <polyline points="4 3.5 4 7.6 8.1 7.6"/>
      <path d="M3.5 12.5A8.5 8.5 0 0 0 17.8 18.6L20 16.4"/>
      <polyline points="20 20.5 20 16.4 15.9 16.4"/>
      ${pivotDot}
    </g>`;
  }

  if (disp.iconOnly) {
    const outerPx = medallionPx + padY * 2;
    const iconSvgPx = Math.max(17, Math.round(medallionPx * 0.72));
    return `<span class="inline-flex items-center justify-center rounded-full bg-white shrink-0" style="width:${outerPx}px;height:${outerPx}px;border:${borderPx}px solid ${theme.accent};box-shadow:0 3px 10px rgba(0,0,0,0.18)" title="${escHtml(disp.ariaLabel)}" aria-label="${escHtml(disp.ariaLabel)}">
      <span class="rounded-full flex items-center justify-center shrink-0" style="width:${medallionPx}px;height:${medallionPx}px;background:${theme.accent};color:#ffffff">
        <svg style="width:${iconSvgPx}px;height:${iconSvgPx}px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgInner}</svg>
      </span>
    </span>`;
  }

  return `<span class="inline-flex items-center font-extrabold rounded-full bg-white text-[#18181b] whitespace-nowrap shrink-0" style="gap:${gapPx}px;border:${borderPx}px solid ${theme.accent};font-size:${fontPx}px;padding:${padY}px ${padR}px ${padY}px ${padL}px;box-shadow:0 3px 10px rgba(0,0,0,0.18)" title="${escHtml(disp.ariaLabel)}">
    <span class="rounded-full flex items-center justify-center shrink-0" style="width:${medallionPx}px;height:${medallionPx}px;background:${theme.accent};color:#ffffff">
      <svg style="width:${svgPx}px;height:${svgPx}px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgInner}</svg>
    </span>
    <span class="tracking-tight leading-none">${escHtml(label)}</span>
  </span>`;
}

function drawRotationCueBadgeCanvas(ctx, cue, rightX, topY, theme, typo, isTightSlot, drawRRect, wordless = Boolean(state.wordlessMode)) {
  if (!cue || cue === 'none') return rightX;
  const disp = getRotationCueDisplay(cue, wordless);
  const label = disp.text;
  const medallionD = Math.max(isTightSlot ? 24 : 30, Math.round(typo.pt(isTightSlot ? 20 : 26)));
  const cueFont = Math.max(isTightSlot ? 10 : 12, Math.round(typo.pt(isTightSlot ? 9 : 11)));
  const padY = Math.max(3, Math.round(typo.pt(isTightSlot ? 2.5 : 3.5)));
  const padL = Math.max(3, Math.round(typo.pt(isTightSlot ? 2.5 : 3.5)));
  const padR = Math.max(10, Math.round(typo.pt(isTightSlot ? 8 : 11)));
  const gap = Math.max(5, Math.round(typo.pt(isTightSlot ? 4.5 : 6)));

  ctx.save();
  ctx.font = themeCanvasFont(theme, 800, cueFont);
  const textW = disp.iconOnly ? 0 : Math.ceil(ctx.measureText(label).width);
  const cueH = medallionD + padY * 2;
  const cueW = disp.iconOnly ? cueH : (padL + medallionD + gap + textW + padR);
  const cueX = rightX - cueW;
  const cueY = topY;

  // Pill or circular medallion body with crisp drop shadow and accent border
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  drawRRect(cueX, cueY, cueW, cueH, cueH / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  drawRRect(cueX, cueY, cueW, cueH, cueH / 2);
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = Math.max(2, typo.pt(2.2));
  ctx.stroke();

  // Solid accent circular medallion
  const cx = disp.iconOnly ? (cueX + cueW / 2) : (cueX + padL + medallionD / 2);
  const cy = cueY + cueH / 2;
  const r = medallionD / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = theme.accent;
  ctx.fill();

  // Bold white dual curved arrows inside medallion
  ctx.save();
  ctx.translate(cx, cy);
  if (cue === 'yaw_90_ccw') ctx.scale(-1, 1);
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = Math.max(2, medallionD * 0.1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const ar = r * 0.56;
  const drawArrowHead = (ax, ay, angle) => {
    const hs = Math.max(3.2, medallionD * 0.16);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-hs, -hs * 0.65);
    ctx.lineTo(-hs, hs * 0.65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  if (cue === 'flip_vertical') {
    if (wordless) {
      // Centered brick bar + top/bottom flip arcs (LEGO-style vertical flip icon)
      const bw = r * 0.62;
      const bh = Math.max(2.6, r * 0.28);
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh * 0.35);
      else ctx.rect(-bw / 2, -bh / 2, bw, bh);
      ctx.fill();
    }
    // Top arch right + bottom arch left
    ctx.beginPath();
    ctx.arc(0, -ar * 0.18, ar * 0.96, Math.PI * 1.12, Math.PI * 1.88, false);
    ctx.stroke();
    drawArrowHead(Math.cos(Math.PI * 1.88) * ar * 0.96, -ar * 0.18 + Math.sin(Math.PI * 1.88) * ar * 0.96, Math.PI * 0.42);

    ctx.beginPath();
    ctx.arc(0, ar * 0.18, ar * 0.96, Math.PI * 0.12, Math.PI * 0.88, false);
    ctx.stroke();
    drawArrowHead(Math.cos(Math.PI * 0.88) * ar * 0.96, ar * 0.18 + Math.sin(Math.PI * 0.88) * ar * 0.96, -Math.PI * 0.58);
  } else {
    // Dual opposing rotation arcs
    ctx.beginPath();
    ctx.arc(0, 0, ar, Math.PI * 1.15, Math.PI * 1.92, false);
    ctx.stroke();
    drawArrowHead(Math.cos(Math.PI * 1.92) * ar, Math.sin(Math.PI * 1.92) * ar, Math.PI * 0.42);

    ctx.beginPath();
    ctx.arc(0, 0, ar, Math.PI * 0.15, Math.PI * 0.92, false);
    ctx.stroke();
    drawArrowHead(Math.cos(Math.PI * 0.92) * ar, Math.sin(Math.PI * 0.92) * ar, -Math.PI * 0.58);

    if (cue === 'yaw_180') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1.8, medallionD * 0.08), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Bold label (omitted when iconOnly)
  if (!disp.iconOnly) {
    ctx.fillStyle = '#18181b';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cueX + padL + medallionD + gap, cy + 0.5);
  }
  ctx.restore();
  return cueX - 8;
}

function getThemeForPage(page) {
  if (page?.layoutGroup?.themeId) {
    return resolveThemeById(page.layoutGroup.themeId, customThemes);
  }
  return getActiveTheme();
}

function renderAll() {
  if (activeLiveEngine) { activeLiveEngine.dispose(); activeLiveEngine = null; }
  currentSlotRenderInfo.clear();

  const hasModel = Boolean(state.model);
  document.getElementById('emptyState').classList.toggle('hidden', hasModel);
  document.getElementById('stageViewport').classList.toggle('hidden', !hasModel);
  document.getElementById('topRightPills').classList.toggle('hidden', !hasModel);
  document.getElementById('bottomDock').classList.toggle('hidden', !hasModel);
  const desktopModelChip = document.getElementById('desktopModelChip');
  if (desktopModelChip) {
    desktopModelChip.classList.toggle('md:inline-flex', hasModel);
  }
  const mobileBrandPill = document.getElementById('mobileEditorBrandPill');
  if (mobileBrandPill) {
    mobileBrandPill.classList.toggle('hidden', !hasModel);
    mobileBrandPill.classList.toggle('flex', hasModel);
  }

  const desktopSepEl = document.getElementById('desktopModelSep');
  const desktopNameEl = document.getElementById('desktopModelName');
  const mobileModelSepEl = document.getElementById('mobileEditorModelSep');
  const mobileModelNameEl = document.getElementById('mobileEditorModelName');

  const fileTypeEl = document.getElementById('menuModelFileType');
  const statsEl = document.getElementById('menuModelStats');

  if (!hasModel) {
    if (desktopSepEl) desktopSepEl.classList.add('hidden');
    if (desktopNameEl) { desktopNameEl.textContent = ''; desktopNameEl.classList.add('hidden'); }
    if (mobileModelSepEl) mobileModelSepEl.classList.add('hidden');
    if (mobileModelNameEl) { mobileModelNameEl.textContent = ''; mobileModelNameEl.classList.add('hidden'); }
    document.getElementById('menuModelName').textContent = 'No model loaded';
    if (fileTypeEl) { fileTypeEl.textContent = 'Import a model below to get started.'; fileTypeEl.classList.remove('hidden'); }
    if (statsEl) { statsEl.innerHTML = ''; statsEl.classList.add('hidden'); }
    document.getElementById('contextOverlay').classList.add('hidden');
    syncMenuControls();
    return;
  }

  rebuildPages();
  const page = state.pages[state.pageIdx];
  const theme = getThemeForPage(page);
  const allSteps = getAllSteps(state.model);
  const allParts = getAllParts(state.model);
  const fileTypeLabel = getModelFileTypeLabel();

  if (desktopSepEl) desktopSepEl.classList.remove('hidden');
  if (desktopNameEl) { desktopNameEl.textContent = state.model.title; desktopNameEl.classList.remove('hidden'); }
  if (mobileModelSepEl) mobileModelSepEl.classList.remove('hidden');
  if (mobileModelNameEl) { mobileModelNameEl.textContent = state.model.title; mobileModelNameEl.classList.remove('hidden'); }
  document.getElementById('menuModelName').textContent = state.model.title;
  if (fileTypeEl) {
    fileTypeEl.textContent = fileTypeLabel;
    fileTypeEl.classList.remove('hidden');
  }
  if (statsEl) {
    statsEl.innerHTML = `
      <span class="px-2 py-0.5 rounded bg-[var(--card)] border border-[var(--border)]">${formatPartCount(allParts.length)}</span>
      <span class="px-2 py-0.5 rounded bg-[var(--card)] border border-[var(--border)]">${allSteps.length} steps</span>
      <span class="px-2 py-0.5 rounded bg-[var(--card)] border border-[var(--border)]">${state.pages.length} pages</span>`;
    statsEl.classList.remove('hidden');
  }

  document.getElementById('btnUndo').disabled = state.undoStack.length === 0;
  document.getElementById('btnRedo').disabled = state.redoStack.length === 0;

  const fullLabel = `${page.label} · ${page.num}/${state.pages.length}`;
  document.getElementById('pageLabelText').textContent = page.label;
  const pageCountEl = document.getElementById('pageCountText');
  if (pageCountEl) pageCountEl.textContent = `· ${page.num}/${state.pages.length}`;
  document.getElementById('btnPageOverview').title = fullLabel;
  const navState = computePageNavigationState(state.pageIdx, state.pages.length);
  const firstPageEl = document.getElementById('firstPage');
  if (firstPageEl) firstPageEl.disabled = !navState.canGoFirst;
  document.getElementById('prevPage').disabled = !navState.canGoPrev;
  document.getElementById('nextPage').disabled = !navState.canGoNext;
  const lastPageEl = document.getElementById('lastPage');
  if (lastPageEl) lastPageEl.disabled = !navState.canGoLast;

  state.mode = resolveModeForPage(state.mode, page?.kind);
  if (state.mode !== 'parts' && state.selectedPartIds.size > 0) {
    state.selectedPartIds.clear();
  }
  if (state.pageInserts && Object.keys(state.pageInserts).length > 0 && state.pages.length > 0) {
    state.stepInserts = migratePageInsertsToSteps(state.pageInserts, state.stepInserts, state.pages);
    state.pageInserts = {};
  }

  // Update Mode Pill visibility & styling for the current page type
  syncModePillButtons(page);

  // Apply Canonical Physical Print / Screen Proportions & Unified Typography to Live Page Frame!
  const frame = document.getElementById('pageFrame');
  const dims = computePageFrameDimensions();
  currentPageFitScale = dims.fitScale;
  const typo = computePageTypography({
    widthIn: dims.widthIn,
    heightIn: dims.heightIn,
    pxPerInch: dims.pxPerInch,
    density: state.density,
    bomDensity: state.bomConfig?.density,
  });
  const padPx = typo.pad;
  const gapPx = typo.gap;
  const footerH = typo.footerH;
  const invFit = 1 / Math.max(0.25, dims.fitScale);
  frame.style.width = dims.width + 'px';
  frame.style.height = dims.height + 'px';
  frame.style.minHeight = '';
  frame.style.borderRadius = Math.round(14 * invFit) + 'px';
  frame.style.borderWidth = Math.max(1, Number(invFit.toFixed(2))) + 'px';
  frame.classList.remove('blueprint-grid');
  applyThemeBackgroundToElement(frame, theme);
  applyThemeFontsToElement(frame, theme);
  frame.style.color = theme.text;
  frame.innerHTML = '';
  // Apply stage scale immediately so there is never an unscaled flash before rAF
  flushStageTransform();

  const footerPadBottom = Math.max(4, Math.round(padPx * 0.42));
  const wordless = Boolean(state.wordlessMode);
  const showFooterTitle = !wordless && Boolean(state.showPageTitle);

  // Render Page Contents
  if (page.kind === 'cover') {
    const dens = DENSITY_PAD[state.density] || DENSITY_PAD.balanced;
    state.coverMeta = normalizeCoverMeta(state.coverMeta, !wordless);
    const cm = state.coverMeta;
    const showCoverText = cm.showText !== false;
    const title = showCoverText ? (cm.title || state.model.title || 'Untitled Model').trim() : '';
    const sub = showCoverText ? (cm.subtitle || '').trim() : '';
    const layout = computeCoverLayout({
      pageW: dims.width,
      pageH: dims.height,
      hasCreatorLogo: Boolean(cm.creatorLogoSrc),
      hasTitle: showCoverText && title.length > 0,
      hasSubtitle: showCoverText && sub.length > 0,
      hasThemeImage: Boolean(cm.themeImageSrc),
      densityPadFactor: dens.pad / 20,
    });
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const heroSize = computeCoverHeroRenderSize({
      heroWidth: layout.heroRect.w,
      heroHeight: layout.heroRect.h,
      dpr,
      zoom: state.zoom,
      stageFitScale: currentPageFitScale,
      mode: 'screen',
      gpuMaxDim: getCoverHeroGpuMaxDim(),
    });
    const snap = renderCoverHeroSnapshot(
      allParts,
      cm.az,
      cm.el,
      cm.zoom,
      heroSize.width,
      heroSize.height,
      theme,
    );
    currentCoverHeroInfo = {
      parts: allParts,
      az: cm.az,
      el: cm.el,
      zoom: cm.zoom,
      heroW: layout.heroRect.w,
      heroH: layout.heroRect.h,
      w: snap.w,
      h: snap.h,
      theme,
    };
    const darkBg = isDarkHexColor(toHexColor(theme.bgColor || '#ffffff', '#ffffff'));
    const badgeSurface = darkBg ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.92)';
    const badgeBorder = darkBg ? 'rgba(255,255,255,0.20)' : 'rgba(15,23,42,0.14)';
    const badgeTextColor = darkBg ? '#f8fafc' : '#1e293b';
    const qrSvg = buildQrSvg(PROGRAM_URL, {
      fg: '#111827',
      bg: '#ffffff',
      quietZone: 1,
      ariaLabel: `${COVER_QR_HINT_TEXT} — ${PROGRAM_NAME}`,
    });
    const titleShadow = cm.bgSrc ? 'text-shadow:0 1px 8px rgba(0,0,0,0.28);' : '';
    const maxBrandCardDomW = Math.max(
      layout.brandCardRect.w,
      dims.width - layout.pad * 2 - layout.qrCardRect.w - layout.brandGap,
    );
    const qrHintArrowGap = Math.max(3, Math.round(layout.brandQrHintFontPx * 0.35));
    const qrHintArrowSize = Math.max(7, Math.round(layout.brandQrHintFontPx * 1.05));

    frame.innerHTML = `
      <div class="relative w-full h-full overflow-hidden" style="${cm.bgSrc ? `background-image:url(${cm.bgSrc});background-size:cover;background-position:center;` : ''}">
        <!-- High-Quality Page-Filling Hero Render -->
        <div class="absolute z-0 flex items-center justify-center pointer-events-none" style="left:${layout.heroRect.x}px;top:${layout.heroRect.y}px;width:${layout.heroRect.w}px;height:${layout.heroRect.h}px;">
          <img data-cover-hero-img="true" src="${snap.url}" alt="${escHtml(title || state.model.title || 'Model')}" class="w-full h-full object-contain pointer-events-none select-none" />
        </div>

        <!-- Top-Left: Optional Creator Logo + Optional Model Name & Subtitle -->
        ${(cm.creatorLogoSrc || (showCoverText && (title || sub))) ? `
          <div class="absolute z-10 flex flex-col items-start pointer-events-none" style="left:${layout.pad}px;top:${layout.pad}px;max-width:${layout.topLeftMaxW}px;">
            ${cm.creatorLogoSrc ? `
              <img src="${cm.creatorLogoSrc}" alt="Creator logo" class="block object-contain object-left pointer-events-none select-none" style="max-width:${layout.creatorLogoMaxW}px;max-height:${layout.creatorLogoMaxH}px;margin-bottom:${showCoverText && (title || sub) ? layout.creatorLogoGap : 0}px;" />
            ` : ''}
            ${showCoverText && title ? `
              <h1 class="font-extrabold tracking-tight" style="font-size:${layout.titleFontPx}px;line-height:${layout.titleLineHeightPx}px;letter-spacing:-0.02em;color:${theme.text};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;${titleShadow}">${escHtml(title)}</h1>
            ` : ''}
            ${showCoverText && sub ? `
              <p class="font-medium" style="font-size:${layout.subtitleFontPx}px;line-height:1.25;margin-top:${layout.subtitleGap}px;color:${theme.muted};display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;${titleShadow}">${escHtml(sub)}</p>
            ` : ''}
          </div>
        ` : ''}

        <!-- Top-Right: Optional Series / Theme Logo -->
        ${cm.themeImageSrc ? `
          <div class="absolute z-10 flex items-start justify-end pointer-events-none" style="right:${layout.pad}px;top:${layout.pad}px;max-width:${layout.topRightMaxW}px;max-height:${layout.topRightMaxH}px;">
            <img src="${cm.themeImageSrc}" alt="Series / Theme logo" class="block object-contain object-right-top pointer-events-none select-none" style="max-width:${layout.topRightMaxW}px;max-height:${layout.topRightMaxH}px;" />
          </div>
        ` : ''}

        <!-- Bottom-Right: Non-Editable Clickable Program Attribution + QR Code -->
        <a href="${PROGRAM_URL}" target="_blank" rel="noopener noreferrer" data-cover-link="true" title="Open ${PROGRAM_NAME}" class="absolute z-10 flex items-stretch hover:opacity-90 active:scale-[0.98] transition cursor-pointer" style="right:${layout.pad}px;bottom:${layout.pad}px;height:${layout.brandGroupRect.h}px;gap:${layout.brandGap}px;text-decoration:none;">
          <div class="flex items-center shrink-0 shadow-xs overflow-hidden" style="min-width:${layout.brandCardRect.w}px;max-width:${maxBrandCardDomW}px;height:${layout.brandCardRect.h}px;border-radius:${layout.cardRadius}px;padding:0 ${layout.brandPadX}px;gap:${layout.brandInnerGap}px;background:${badgeSurface};border:1px solid ${badgeBorder};backdrop-filter:blur(6px);">
            <svg class="shrink-0" style="width:${layout.brandIconSize}px;height:${layout.brandIconSize}px;" viewBox="0 0 64 64" fill="none" aria-hidden="true">${BRAND_LOGO_SVG_BODY}</svg>
            <div class="min-w-0 flex flex-col justify-center" style="color:${badgeTextColor};">
              <div class="font-semibold whitespace-nowrap" style="font-size:${layout.brandEyebrowFontPx}px;line-height:1.15;opacity:0.72;">${escHtml(COVER_MADE_WITH_LABEL)}</div>
              <div class="font-extrabold tracking-tight whitespace-nowrap" style="font-size:${layout.brandTitleFontPx}px;line-height:1.16;">${escHtml(PROGRAM_NAME)}</div>
              <div class="font-medium whitespace-nowrap flex items-center" style="font-size:${layout.brandQrHintFontPx}px;line-height:1.15;margin-top:${layout.brandQrHintGap}px;gap:${qrHintArrowGap}px;opacity:0.76;">
                <span>${escHtml(COVER_QR_HINT_TEXT)}</span>
                <svg class="shrink-0" style="width:${qrHintArrowSize}px;height:${qrHintArrowSize}px;" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 8h11"/><path d="M9.5 4.2 13.5 8l-4 3.8"/></svg>
              </div>
            </div>
          </div>
          <div class="shrink-0 shadow-xs overflow-hidden flex items-center justify-center" style="width:${layout.qrCardRect.w}px;height:${layout.qrCardRect.h}px;border-radius:${layout.cardRadius}px;padding:${layout.qrInnerInset}px;background:#ffffff;border:1px solid rgba(15,23,42,0.14);">
            <div class="w-full h-full">${qrSvg}</div>
          </div>
        </a>
      </div>`;
  } else if (page.kind === 'complete') {
    state.completeMeta = normalizeCompleteMeta(state.completeMeta);
    const cm = state.completeMeta;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const compW = Math.max(240, dims.width - padPx * 2);
    const compH = Math.max(200, Math.round(dims.height * 0.72));
    const heroSize = computeCoverHeroRenderSize({
      heroWidth: compW,
      heroHeight: compH,
      dpr,
      zoom: state.zoom,
      stageFitScale: currentPageFitScale,
      mode: 'screen',
      gpuMaxDim: getCoverHeroGpuMaxDim(),
    });
    const snap = renderCoverHeroSnapshot(allParts, cm.az, cm.el, cm.zoom, heroSize.width, heroSize.height, theme);
    currentCoverHeroInfo = {
      parts: allParts,
      az: cm.az,
      el: cm.el,
      zoom: cm.zoom,
      heroW: compW,
      heroH: compH,
      w: snap.w,
      h: snap.h,
      theme,
    };
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    const showText = cm.showText !== false;
    const showFw = cm.showFireworks !== false;
    frame.innerHTML = `
      <div class="relative w-full h-full text-center flex flex-col items-center justify-between overflow-hidden" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px;${cm.bgSrc ? `background-image:url(${cm.bgSrc});background-size:cover;background-position:center;` : ''}">
        ${showFw ? buildFireworksSvg() : ''}
        <div class="relative z-10 shrink-0 pointer-events-none ${showText ? '' : 'hidden'}">
          <h2 class="font-extrabold leading-tight" style="font-size:${typo.complete.titleFont}px">${escHtml(cm.title || 'Build Complete!')}</h2>
          ${cm.subtitle ? `<p style="color:${theme.muted};font-size:${typo.complete.subtitleFont}px;margin-top:${Math.round(typo.pt(2.5))}px">${escHtml(cm.subtitle)}</p>` : ''}
        </div>
        <div class="relative z-10 flex-1 min-h-0 w-full overflow-hidden pointer-events-none" style="margin:${Math.round(typo.pt(8))}px 0;">
          <img data-cover-hero-img="true" src="${snap.url}" alt="Completed build" class="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
        </div>
        <div class="absolute z-10 flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${showFooterTitle ? escHtml(state.model.title) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else if (page.kind === 'back') {
    const bm = normalizeBackMeta(state.backMeta);
    const credit = BACK_COVER_CREDIT;
    frame.innerHTML = `
      <div class="relative w-full h-full text-center flex flex-col items-center justify-center overflow-hidden" style="padding:${padPx + Math.round(typo.pt(8))}px;${bm.bgSrc ? `background-image:url(${bm.bgSrc});background-size:cover;background-position:center;` : ''}">
        <a href="${PROGRAM_URL}" target="_blank" rel="noopener noreferrer" data-cover-link="true" title="Open ${PROGRAM_NAME}" class="inline-flex flex-col items-center hover:opacity-90 transition cursor-pointer" style="gap:${Math.round(typo.pt(12))}px;text-decoration:none;">
          <div class="flex items-center justify-center shadow-sm" style="width:${typo.back.logoBox}px;height:${typo.back.logoBox}px;border-radius:${Math.round(typo.back.logoBox * 0.28)}px;background:${theme.pliBg};border:1px solid ${theme.pliBorder}">
            <svg style="width:${typo.back.logoIcon}px;height:${typo.back.logoIcon}px" viewBox="0 0 64 64" fill="none" aria-hidden="true">${BRAND_LOGO_SVG_BODY}</svg>
          </div>
          <span class="font-semibold" style="color:${theme.muted};font-size:${typo.back.creditFont}px">${escHtml(credit)}</span>
        </a>
      </div>`;
  } else if (page.kind === 'divider') {
    const d = state.dividerAfter[page.sourcePgId] || { title: wordless ? '' : 'Section Divider', note:'' };
    const divTitle = (d.title || '').trim();
    const divNote = (d.note || '').trim() || (wordless ? '' : 'Switch to Page mode to edit this divider page.');
    frame.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center text-center" style="padding:${padPx + Math.round(typo.pt(10))}px;gap:${Math.round(typo.pt(8))}px">
        ${divTitle ? `<div class="font-extrabold" style="font-size:${typo.divider.customTitleFont}px">${escHtml(divTitle)}</div>` : ''}
        ${divNote ? `<div style="color:${theme.muted};font-size:${typo.divider.customNoteFont}px;max-width:${Math.round(typo.pt(320))}px">${escHtml(divNote)}</div>` : ''}
      </div>`;
  } else if (page.kind === 'section_divider') {
    const resScale = getPreviewResolutionScale();
    const divSize = clampRenderDimensions(
      Math.round(Math.max(920, dims.width - padPx * 2) * resScale),
      Math.round(Math.max(580, dims.height - padPx * 2 - footerH - 80) * resScale),
      Math.min(snapshotEngine.maxDim || 2048, 2200),
      3_800_000,
      480,
    );
    const snap = renderSnapshot([], page.previewParts || [], 38, 28, divSize.width, divSize.height, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    const pillPadX = Math.round(typo.pt(8));
    const pillPadY = Math.round(typo.pt(2.5));
    const bagHeaderHtml = wordless
      ? `<div class="shrink-0 flex items-center justify-between" style="gap:${Math.round(typo.pt(12))}px">
          <div class="shrink-0">${buildNumberedBagSvg(page.bagNumber || 1, Math.round(typo.pt(56)), theme.accent, theme.pliBg, theme.text)}</div>
          <div class="shrink-0 flex flex-col items-end font-bold" style="gap:${Math.round(typo.pt(4))}px;font-size:${typo.divider.metaFont}px">
            <span class="inline-flex items-center rounded-full tabular-nums" style="gap:${Math.round(typo.pt(4))}px;background:${theme.pliBg};border:1px solid ${theme.pliBorder};padding:${pillPadY}px ${pillPadX}px">${buildBrickGlyphSvg(Math.max(12, Math.round(typo.divider.metaFont * 1.1)))}<span>${page.pieceCount || 0}</span></span>
            <span class="inline-flex items-center tabular-nums" style="gap:${Math.round(typo.pt(4))}px;color:${theme.muted};font-size:${typo.divider.subMetaFont}px">${buildStepsBookletIconSvg(Math.max(11, Math.round(typo.divider.subMetaFont * 1.15)))}<span>${page.firstStepNum}–${page.lastStepNum}</span></span>
          </div>
        </div>`
      : `<div class="shrink-0 flex items-center justify-between" style="gap:${Math.round(typo.pt(12))}px">
          <div class="min-w-0">
            <span class="inline-block font-extrabold uppercase tracking-wider rounded-full text-white" style="background:${theme.accent};font-size:${typo.divider.badgeFont}px;padding:${pillPadY}px ${pillPadX}px;margin-bottom:${Math.round(typo.pt(4))}px">Build Stage ${page.bagNumber || 1}</span>
            <h2 class="font-extrabold tracking-tight leading-tight truncate" style="font-size:${typo.divider.titleFont}px">${escHtml(page.chapterName || page.label)}</h2>
          </div>
          <div class="shrink-0 flex flex-col items-end font-bold" style="gap:${Math.round(typo.pt(3))}px;font-size:${typo.divider.metaFont}px">
            <span class="rounded-full" style="background:${theme.pliBg};border:1px solid ${theme.pliBorder};padding:${pillPadY}px ${pillPadX}px">${page.pieceCount || 0} pcs</span>
            <span style="color:${theme.muted};font-size:${typo.divider.subMetaFont}px">Steps ${page.firstStepNum}–${page.lastStepNum}</span>
          </div>
        </div>`;
    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between overflow-hidden" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        ${bagHeaderHtml}
        <div class="relative flex-1 min-h-0 overflow-hidden" style="margin:${Math.round(typo.pt(8))}px 0">
          <img src="${snap.url}" alt="${escHtml(page.chapterName || 'Stage')}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${showFooterTitle ? escHtml(state.model.title) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else if (page.kind === 'submodel_page') {
    const sub = page.step.subassembly;
    const resScale = getPreviewResolutionScale();
    const subPageSize = clampRenderDimensions(
      Math.round(Math.max(920, dims.width - padPx * 2) * resScale),
      Math.round(Math.max(580, dims.height - padPx * 2 - footerH - 80) * resScale),
      Math.min(snapshotEngine.maxDim || 2048, 2200),
      3_800_000,
      480,
    );
    const snap = renderSnapshot([], sub.buildParts, 38, 30, subPageSize.width, subPageSize.height, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col justify-between overflow-hidden" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        <div class="shrink-0 flex items-center ${wordless ? 'justify-end' : 'justify-between'}">
          ${wordless ? '' : `<h2 class="font-extrabold" style="font-size:${typo.submodelPage.titleFont}px">${escHtml(sub.name)}</h2>`}
          <span class="rounded-full font-black text-white" style="background:${theme.accent};font-size:${typo.submodelPage.badgeFont}px;padding:${Math.round(typo.pt(2.5))}px ${Math.round(typo.pt(9))}px">${wordless ? `×${sub.repeatCount}` : `Build ${sub.repeatCount}×`}</span>
        </div>
        <div class="relative flex-1 min-h-0 overflow-hidden" style="margin:${Math.round(typo.pt(8))}px 0">
          <img src="${snap.url}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        </div>
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${showFooterTitle ? escHtml(page.chapterName) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else if (page.kind === 'bom') {
    const cfg = getEffectiveBomConfig();
    const enabledFields = getEnabledBomFields(cfg);
    const entries = page.bomEntries || [];
    const pgNumText = formatPageNumber(page.num, state.pages.length);
    const bt = typo.bom;
    const bodyW = Math.max(60, dims.width - padPx * 2);
    const bodyH = Math.max(60, dims.height - padPx * 2 - footerH - bt.headerH);

    let bomBodyHtml = '';
    if (page.bomFormat === 'table') {
      const rowsPerPage = page.bomTableRowsPerPage || 20;
      const tTypo = computeBomTableTypography({
        tableHeightPx: bodyH,
        rowsPerPage,
        pxPerInch: dims.pxPerInch,
        typeScale: typo.typeScale,
      });
      const tCols = computeBomTableColumns(enabledFields, bodyW, tTypo.rowH);
      const headerRowHtml = `
        <div class="shrink-0 flex items-center border-b font-bold ${wordless ? '' : 'uppercase tracking-wider'}" style="height:${tTypo.headerH}px;background:${theme.pliBg};border-color:${theme.pliBorder};color:${theme.muted};font-size:${tTypo.headerFont}px;border-top-left-radius:${Math.round(typo.pt(4))}px;border-top-right-radius:${Math.round(typo.pt(4))}px">
          ${tCols.map((c) => {
            const ta = c.align === 'right' ? 'text-right justify-end' : c.align === 'center' ? 'text-center justify-center' : 'text-left justify-start';
            const colInner = wordless
              ? (c.id === 'image'
                ? buildBrickGlyphSvg(Math.max(11, Math.round(tTypo.headerFont * 1.35)))
                : `<span class="truncate">${escHtml(getBomTableHeaderText(c.id, true))}</span>`)
              : `<span class="truncate">${escHtml(c.label)}</span>`;
            return `<div class="h-full flex items-center overflow-hidden ${ta}" style="width:${(c.widthFrac * 100).toFixed(4)}%;padding:0 ${tTypo.cellPadX}px">${colInner}</div>`;
          }).join('')}
        </div>`;

      const rowsHtml = entries.map((entry, idx) => {
        const { part, qty, meta, partIdDisplay, colorName, colorHex } = entry;
        const stripeBg = idx % 2 === 1 ? 'rgba(127,127,127,0.06)' : 'transparent';
        const cellsHtml = tCols.map((c) => {
          const wStyle = `width:${(c.widthFrac * 100).toFixed(4)}%;padding:0 ${tTypo.cellPadX}px`;
          if (c.id === 'image') {
            const thumb = getPliThumb(part);
            return `<div class="h-full flex items-center justify-center overflow-hidden" style="${wStyle};padding:${tTypo.imgPad}px ${tTypo.cellPadX}px">
              <img src="${thumb}" alt="${escHtml(meta.name)}" class="max-w-full max-h-full object-contain pointer-events-none" />
            </div>`;
          }
          if (c.id === 'qty') {
            return `<div class="h-full flex items-center justify-end font-extrabold tabular-nums overflow-hidden" style="${wStyle};font-size:${tTypo.qtyFont}px;color:${theme.text}"><span class="truncate">${qty}×</span></div>`;
          }
          if (c.id === 'partId') {
            return `<div class="h-full flex items-center justify-start font-mono overflow-hidden" style="${wStyle};font-size:${tTypo.monoFont}px;color:${theme.muted}"><span class="truncate">${escHtml(partIdDisplay)}</span></div>`;
          }
          if (c.id === 'color') {
            return `<div class="h-full flex items-center justify-start overflow-hidden" style="${wStyle};gap:${Math.max(3, Math.round(tTypo.swatchSize * 0.5))}px;font-size:${tTypo.bodyFont}px;color:${theme.text}">
              <span class="shrink-0 rounded-full" style="width:${tTypo.swatchSize}px;height:${tTypo.swatchSize}px;background:${escHtml(colorHex)};border:1px solid rgba(127,127,127,0.45)"></span>
              <span class="truncate">${escHtml(colorName)}</span>
            </div>`;
          }
          return `<div class="h-full flex items-center justify-start font-medium overflow-hidden" style="${wStyle};font-size:${tTypo.bodyFont}px;color:${theme.text}" title="${escHtml(meta.name)}"><span class="truncate">${escHtml(meta.name)}</span></div>`;
        }).join('');
        return `<div class="shrink-0 flex items-center border-b overflow-hidden" style="height:${tTypo.rowH}px;background:${stripeBg};border-color:color-mix(in srgb, ${theme.pliBorder} 48%, transparent)">${cellsHtml}</div>`;
      }).join('');

      bomBodyHtml = `<div class="flex-1 min-h-0 w-full flex flex-col overflow-hidden">${headerRowHtml}<div class="flex-1 min-h-0 flex flex-col overflow-hidden">${rowsHtml}</div></div>`;
    } else {
      const cells = page.bomCells || [];
      const renderTextFieldHtml = (fieldId, entry, ct, alignLeft) => {
        const alignCls = alignLeft ? 'text-left' : 'text-center';
        if (fieldId === 'qty') {
          return `<div class="shrink-0 font-extrabold w-full truncate ${alignCls}" style="font-size:${ct.qtyFont}px;line-height:1.12;color:${theme.text}">${entry.qty}×</div>`;
        }
        if (fieldId === 'name') {
          return `<div class="shrink-0 font-medium w-full truncate opacity-85 ${alignCls}" style="font-size:${ct.nameFont}px;line-height:1.18;color:${theme.text}" title="${escHtml(entry.meta.name)}">${escHtml(entry.meta.name)}</div>`;
        }
        if (fieldId === 'partId') {
          return `<div class="shrink-0 font-mono w-full truncate opacity-75 ${alignCls}" style="font-size:${ct.partIdFont}px;line-height:1.15;color:${theme.muted}">${escHtml(entry.partIdDisplay)}</div>`;
        }
        if (fieldId === 'color') {
          const jc = alignLeft ? 'justify-start' : 'justify-center';
          return `<div class="shrink-0 w-full flex items-center ${jc} overflow-hidden" style="gap:${Math.max(2, Math.round(ct.swatchSize * 0.45))}px;font-size:${ct.colorFont}px;line-height:1.18;color:${theme.muted}">
            <span class="shrink-0 rounded-full" style="width:${ct.swatchSize}px;height:${ct.swatchSize}px;background:${escHtml(entry.colorHex)};border:1px solid rgba(127,127,127,0.45)"></span>
            <span class="truncate">${escHtml(entry.colorName)}</span>
          </div>`;
        }
        return '';
      };

      const gridCellsHtml = cells.map(({ item, colSpan, rowSpan, xFrac, yFrac, wFrac, hFrac }) => {
        const cellW = wFrac * bodyW;
        const cellH = hFrac * bodyH;
        const ct = computeBomCellTypography({
          cellW,
          cellH,
          pxPerInch: dims.pxPerInch,
          enabledFields,
          typeScale: typo.typeScale,
        });
        const thumb = enabledFields.includes('image') ? getBomPartThumb(item.part, colSpan, rowSpan) : '';
        const posStyle = `left:${(xFrac * 100).toFixed(4)}%;top:${(yFrac * 100).toFixed(4)}%;width:${(wFrac * 100).toFixed(4)}%;height:${(hFrac * 100).toFixed(4)}%;padding:${ct.padY}px ${ct.padX}px;background:transparent`;

        if (ct.layoutMode === 'horizontal-img-first' || ct.layoutMode === 'horizontal-img-last') {
          const textFields = enabledFields.filter((f) => f !== 'image');
          const imgHtml = `<div class="relative h-full shrink-0" style="width:44%">
            <img src="${thumb}" alt="${escHtml(item.meta.name)}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" style="padding:${ct.imgPad}px" />
          </div>`;
          const textsHtml = `<div class="flex-1 min-w-0 h-full flex flex-col justify-center overflow-hidden" style="gap:${ct.textGap}px;padding-left:${ct.layoutMode === 'horizontal-img-first' ? Math.max(3, ct.padX) : 0}px;padding-right:${ct.layoutMode === 'horizontal-img-last' ? Math.max(3, ct.padX) : 0}px">
            ${textFields.map((f) => renderTextFieldHtml(f, item, ct, true)).join('')}
          </div>`;
          return `<div class="absolute flex flex-row items-center overflow-hidden" style="${posStyle}">${
            ct.layoutMode === 'horizontal-img-first' ? (imgHtml + textsHtml) : (textsHtml + imgHtml)
          }</div>`;
        }

        const hasImage = enabledFields.includes('image');
        const innerHtml = enabledFields.map((f) => {
          if (f === 'image') {
            return `<div class="relative flex-1 min-h-0 w-full">
              <img src="${thumb}" alt="${escHtml(item.meta.name)}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" style="padding:${ct.imgPad}px" />
            </div>`;
          }
          return renderTextFieldHtml(f, item, ct, false);
        }).join('');

        return `<div class="absolute flex flex-col items-center ${hasImage ? 'justify-between' : 'justify-center'} text-center overflow-hidden" style="${posStyle};gap:${ct.textGap}px">${innerHtml}</div>`;
      }).join('');

      bomBodyHtml = `<div class="relative flex-1 min-h-0 w-full">${gridCellsHtml}</div>`;
    }

    const bomHeaderHtml = wordless
      ? `<div class="shrink-0 flex items-center justify-between border-b" style="border-color:${theme.pliBorder};padding-bottom:${bt.headerPb}px;margin-bottom:${bt.headerMb}px;gap:${Math.round(typo.pt(8))}px">
          <div class="flex items-center min-w-0" style="gap:${Math.round(typo.pt(7))}px">
            <span class="inline-flex items-center shrink-0" style="color:${theme.accent}">${buildPartsGridIconSvg(Math.max(14, Math.round(bt.titleFont * 1.12)))}</span>
            ${page.bomPageCount > 1 ? `<span class="font-bold opacity-80 shrink-0 tabular-nums" style="font-size:${bt.pageCountFont}px">${page.bomPageIdx + 1} / ${page.bomPageCount}</span>` : ''}
          </div>
          <span class="shrink-0 inline-flex items-center font-bold tabular-nums" style="gap:${Math.round(typo.pt(4))}px;color:${theme.muted};font-size:${bt.summaryFont}px">${buildBrickGlyphSvg(Math.max(12, Math.round(bt.summaryFont * 1.2)))}<span>${page.bomTotalPieces}</span></span>
        </div>`
      : `<div class="shrink-0 flex items-baseline justify-between border-b" style="border-color:${theme.pliBorder};padding-bottom:${bt.headerPb}px;margin-bottom:${bt.headerMb}px;gap:${Math.round(typo.pt(8))}px">
          <div class="flex items-baseline min-w-0" style="gap:${Math.round(typo.pt(8))}px">
            <h2 class="font-bold truncate leading-tight" style="font-size:${bt.titleFont}px">Parts List</h2>
            ${page.bomPageCount > 1 ? `<span class="font-semibold opacity-70 shrink-0" style="font-size:${bt.pageCountFont}px">${page.bomPageIdx + 1} / ${page.bomPageCount}</span>` : ''}
          </div>
          <span class="shrink-0 font-medium" style="color:${theme.muted};font-size:${bt.summaryFont}px">${page.bomTotalPieces} pcs · ${page.bomTotalUnique} unique</span>
        </div>`;

    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col overflow-hidden" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        ${bomHeaderHtml}
        ${bomBodyHtml}
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${showFooterTitle ? escHtml(state.model.title) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;
  } else {
    // STEPS PAGE
    if (zoomHiResTimer) { clearTimeout(zoomHiResTimer); zoomHiResTimer = 0; }
    lastZoomRendered = state.zoom;
    const activeObj = getActiveStepObj();
    const slots = page.slots;
    const pageSpec = page.layoutSpec || state.layoutConfig;
    const subIntroImg = page.submodelIntro ? getSubmodelThumb(page.submodelIntro, 480, 300) : null;
    const effectivePageHIn = dims.heightIn;
    const st = typo.steps;
    const introEstH = page.submodelIntro ? Math.round(st.introThumbH + typo.pt(20)) : 0;
    const gridW = Math.max(120, dims.width - padPx * 2);
    const gridH = Math.max(120, dims.height - padPx * 2 - footerH - introEstH);
    const slotRects = computePageSlotRects(slots.length, pageSpec, dims.isLandscape, gridW, gridH, gapPx);
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;

    const slotData = slots.map(({ ch, step, minifigSeqSlice }, slotIdx) => {
      const slotRect = slotRects[slotIdx] || { x: 0, y: 0, w: gridW, h: gridH, isFeatured: slots.length === 1, isCompact: false };
      const estSlotW = Math.max(90, slotRect.w);
      const estSlotH = Math.max(90, slotRect.h);
      const prev = getPreviousPartsForStep(state.model, ch, step);
      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const modelScale = ov.modelScale || 1.0;
      const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
      const mfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : 'classic';
      const isMfExploded = isMfBuild && mfStyle === 'exploded';
      const isMfSeq = isMfBuild && mfStyle === 'sequential';
      const effectivePartOffsets = step.defaultPartOffsets
        ? { ...step.defaultPartOffsets, ...(ov.partOffsets || {}) }
        : (ov.partOffsets || {});
      const mfPrep = step.isMinifigPoseStep ? step.minifigPrep : null;
      const opts = {
        highlightNew: state.highlightNew, highlightColor: state.highlightColor,
        fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity,
        showArrows: true, accent: theme.accent, ov,
        partOffsets: effectivePartOffsets,
        selectedPartIds: state.mode === 'parts' && state.selectedStepId === step.id ? state.selectedPartIds : null,
        ...(mfPrep ? {
          minifigIndicators: mfPrep.indicators || [],
          ghostParts: mfPrep.ghostParts || [],
          highlightOnlyPartIds: new Set(mfPrep.rotatedPartIds || []),
        } : {}),
      };
      const resScale = getPreviewResolutionScale();
      const stepRenderDims = computeStepSlotRenderSize({
        slotWidth: estSlotW,
        slotHeight: estSlotH,
        slotCount: slots.length,
        isFeatured: Boolean(slotRect.isFeatured),
        isCompact: Boolean(slotRect.isCompact),
        dpr,
        zoom: state.zoom,
        stageFitScale: currentPageFitScale,
        mode: 'screen',
        gpuMaxDim: snapshotEngine.maxDim,
      });
      const rw = stepRenderDims.width;
      const rh = stepRenderDims.height;
      const snap = renderSnapshot(prev, step.parts, cam.az, cam.el, rw, rh, modelScale, opts);

      let mfExploded = null;
      let mfSeqStages = null;
      if (isMfExploded) {
        const expDims = computeMinifigDiagramRenderSize({
          kind: 'exploded',
          slotCount: slots.length,
          isFeatured: Boolean(slotRect.isFeatured),
          dpr,
          zoom: state.zoom,
          mode: 'screen',
          gpuMaxDim: snapshotEngine.maxDim,
        });
        mfExploded = renderMinifigExplodedDiagram(step, cam, expDims.width, expDims.height, theme, modelScale);
      } else if (isMfSeq) {
        const seqPlan = getMinifigSequentialPlanForStep(step);
        const sl = minifigSeqSlice || { start: 0, end: seqPlan.stages.length, cols: Math.min(3, seqPlan.stages.length), pageIdx: 0, pageCount: 1 };
        const visibleStages = seqPlan.stages.slice(sl.start, sl.end);
        const seqDims = computeMinifigDiagramRenderSize({
          kind: 'sequential',
          slotCount: slots.length,
          stageCount: visibleStages.length,
          dpr,
          zoom: state.zoom,
          mode: 'screen',
          gpuMaxDim: snapshotEngine.maxDim,
        });
        mfSeqStages = visibleStages.map(st => ({
          stage: st,
          img: renderMinifigSequentialStage(step, st, seqPlan, cam, seqDims.width, seqDims.height, theme, modelScale),
        }));
      }

      const isTightSlot = slotRect.isCompact || estSlotH < typo.pt(250) || estSlotW < typo.pt(230);
      const effectiveCue = getEffectiveStepCue(ch, step);
      const hasStaticBadges = Boolean(step.stepHint || step.minifigPrep);

      currentSlotRenderInfo.set(step.id, {
        ch,
        step,
        prev,
        cam,
        ov,
        snap,
        modelScale,
        opts,
        isMfBuild,
        isMfExploded,
        isMfSeq,
        estSlotW,
        estSlotH,
        slotCount: slots.length,
        isFeatured: Boolean(slotRect.isFeatured),
        isCompact: Boolean(slotRect.isCompact),
        isTightSlot,
        theme,
        typo,
        wordless,
        hasStaticBadges,
        lastEffectiveCue: effectiveCue,
        mfExplodedW: mfExploded?.w || 0,
        mfExplodedH: mfExploded?.h || 0,
      });

      const subCalloutDims = clampRenderDimensions(
        Math.round(380 * resScale),
        Math.round(260 * resScale),
        Math.min(snapshotEngine.maxDim || 2048, 1400),
        1_500_000,
        240,
      );
      const subImg = (step.subassembly && !ov.calloutAsPages)
        ? renderSnapshot([], step.subassembly.buildParts, 38, 30, subCalloutDims.width, subCalloutDims.height, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent }).url
        : null;
      const attSubImg = step.attachedSubmodel ? getSubmodelThumb(step.attachedSubmodel, 360, 270) : null;
      const mfPrepImg = step.minifigPrep
        ? getMinifigThumb(step.minifigPrep.canonicalParts, `prep_${step.minifigPrep.id}`, MINIFIG_BUILD_CAMERA.az, MINIFIG_BUILD_CAMERA.el, 320, 320)
        : null;
      const attMfImg = step.attachedMinifig
        ? getMinifigThumb(
            step.attachedMinifig.previewParts || step.attachedMinifig.canonicalParts,
            `att_${step.attachedMinifig.id}`,
            Math.round(cam.az),
            Math.round(Math.min(30, Math.max(16, cam.el))),
            320,
            320,
          )
        : null;
      const allowMf1to1OnPage = !isMfSeq || !minifigSeqSlice || minifigSeqSlice.pageIdx === minifigSeqSlice.pageCount - 1;
      const mf1to1 = (state.showMinifig1to1 && isMfBuild && allowMf1to1OnPage)
        ? renderMinifigOneToOne(step.parts, dims.height, effectivePageHIn, Math.round(estSlotW * (isMfSeq ? 0.24 : 0.32)), Math.round(estSlotH * 0.64), theme.accent)
        : null;

      // Group PLI items + detect 1:1 Actual-Size Guides (skip individual bricks on official exploded/sequential minifig styles or submodel attachments!)
      const pliMap = new Map();
      if (!step.attachedSubmodel && !step.attachedMinifig && !step.minifigPrep && !isMfExploded && !isMfSeq) {
        for (const p of step.parts) {
          const k = `${p.p}:${p.c}`;
          if (!pliMap.has(k)) pliMap.set(k, { part: p, ids: [], qty: 0, guide: getActualSizeGuide(p.p) });
          const item = pliMap.get(k);
          item.qty++; item.ids.push(p.id);
        }
      }
      return { ch, step, minifigSeqSlice, slotRect, estSlotW, estSlotH, prev, cam, ov, snap, isMfBuild, isMfExploded, isMfSeq, mfExploded, mfSeqStages, subImg, attSubImg, mfPrepImg, attMfImg, mf1to1, pli: Array.from(pliMap.values()) };
    });

    const isLiveStepCamera = state.mode === 'step' && state.stepSubTab === 'camera';
    const isStepNotesMode = state.mode === 'step' && state.stepSubTab === 'notes';
    const isPartsMode = state.mode === 'parts';
    const isArrangeMode = false;
    const pgNumText = formatPageNumber(page.num, state.pages.length);

    frame.innerHTML = `
      <div class="relative w-full h-full flex flex-col overflow-hidden" style="padding:${padPx}px;padding-bottom:${padPx + footerH}px">
        ${page.submodelIntro ? `
          <div class="shrink-0 flex items-center justify-between shadow-xs overflow-hidden" style="margin-bottom:${Math.round(typo.pt(7))}px;padding:${Math.round(typo.pt(5))}px ${Math.round(typo.pt(10))}px;border-radius:${Math.round(typo.pt(10))}px;gap:${Math.round(typo.pt(10))}px;background:${theme.calloutBg};border:1.5px solid ${theme.calloutBorder}">
            <div class="flex items-center min-w-0 flex-1" style="gap:${Math.round(typo.pt(8))}px">
              <img src="${subIntroImg}" alt="${escHtml(page.submodelIntro.name)}" style="width:${st.introThumbW}px;height:${st.introThumbH}px" class="object-contain shrink-0 pointer-events-none" />
              ${wordless ? '' : `
                <div class="min-w-0 flex-1 overflow-hidden">
                  <div class="font-bold uppercase tracking-wider opacity-65 truncate" style="font-size:${st.introLabelFont}px">${page.submodelIntro.isSectionModule ? 'Build Section' : 'Submodel'}</div>
                  <div class="font-extrabold truncate" style="font-size:${st.introTitleFont}px">${escHtml(page.submodelIntro.name)}</div>
                </div>`}
            </div>
            <span class="shrink-0 inline-flex items-center rounded-full font-black text-white shadow-xs tabular-nums" style="gap:${Math.round(typo.pt(3.5))}px;background:${theme.accent};font-size:${st.introPillFont}px;padding:${Math.round(typo.pt(3))}px ${Math.round(typo.pt(10))}px">${page.submodelIntro.repeatCount > 1 ? `×${page.submodelIntro.repeatCount}` : (wordless ? `${buildBrickGlyphSvg(Math.max(11, Math.round(st.introPillFont * 1.05)))}<span>${page.submodelIntro.pieceCount || page.submodelIntro.canonicalParts.length}</span>` : `${page.submodelIntro.pieceCount || page.submodelIntro.canonicalParts.length} pcs`)}</span>
          </div>` : ''}
        <div class="relative flex-1 min-h-0">
          ${slotData.map(({ ch, step, minifigSeqSlice, slotRect, estSlotW, estSlotH, ov, snap, isMfExploded, isMfSeq, mfExploded, mfSeqStages, subImg, attSubImg, mfPrepImg, attMfImg, mf1to1, pli }) => {
            const isTightSlot = slotRect.isCompact || estSlotH < typo.pt(250) || estSlotW < typo.pt(230);
            const stepNumPx = (slots.length === 1 || slotRect.isFeatured) ? st.stepNum1Up : (isTightSlot ? st.stepNumTight : st.stepNum2Up);
            const pliThumbPx = isTightSlot ? st.pliThumbTight : st.pliThumb;
            const pliQtyPx = isTightSlot ? st.pliQtyFontTight : st.pliQtyFont;
            const slotLeftPct = (slotRect.x / gridW) * 100;
            const slotTopPct = (slotRect.y / gridH) * 100;
            const slotWidthPct = (slotRect.w / gridW) * 100;
            const slotHeightPct = (slotRect.h / gridH) * 100;
            const isSelStep = state.selectedStepId === step.id;
            const showLive3D = isLiveStepCamera && isSelStep;
            const isOfficialMfStyle = isMfExploded || isMfSeq;
            const pliScale = ov.pliScale || (isTightSlot ? 0.9 : 1.0);
            const pliPos = ov.pliPos || { x: 0, y: 0 };
            const calloutPos = ov.calloutPos || { x: 0, y: 0 };
            const calloutSel = isArrangeMode && state.selectedArrangeEl?.stepId === step.id && state.selectedArrangeEl?.kind === 'callout';
            const pliSel = isArrangeMode && state.selectedArrangeEl?.stepId === step.id && state.selectedArrangeEl?.kind === 'pli';
            const effectiveBorders = typeof page.layoutGroup?.showStepBorders === 'boolean' ? page.layoutGroup.showStepBorders : state.showStepBorders;
            const showSlotFrame = effectiveBorders && !(isOfficialMfStyle && slots.length === 1);
            const slotBorderStyle = showSlotFrame
              ? (isSelStep && state.mode !== 'pan' ? `2px solid ${theme.accent}` : `1px solid ${theme.pliBorder}`)
              : (isSelStep && state.mode !== 'pan' && slots.length > 1 ? `1.5px dashed ${theme.accent}` : '1px solid transparent');
            const slotBgStyle = showSlotFrame ? 'rgba(255,255,255,0.05)' : 'transparent';

            const calloutPliScale = ov.pliScale || 1.0;
            const calloutPliStyle = `gap:${Math.round(typo.pt(isTightSlot ? 4.5 : 6))}px;padding:${Math.round(typo.pt(3.5))}px ${Math.round(typo.pt(isTightSlot ? 5.5 : 7))}px;border-radius:${Math.round(typo.pt(8))}px;background:${theme.calloutBg};border:${pliSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${calloutPliScale});transform-origin:top left;`;
            const renderCalloutPli = (imgSrc, imgW, imgH, topText, topWeightCls, nameText, wordlessBadgeHtml = '') => wordless
              ? `<div data-drag="pli" data-step="${step.id}" title="${escHtml(`${topText} — ${nameText}`)}" class="draggable-el flex items-center shadow-xs w-fit max-w-full min-w-0 overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="${calloutPliStyle}">
                  <img src="${imgSrc}" alt="${escHtml(nameText)}" style="width:${imgW}px;height:${imgH}px" class="shrink-0 object-contain pointer-events-none" />
                  <div class="inline-flex items-center shrink-0 font-black leading-none" style="gap:${Math.round(typo.pt(3))}px;color:${theme.accent};font-size:${st.pliSubCountFont}px">${wordlessBadgeHtml}</div>
                </div>`
              : `<div data-drag="pli" data-step="${step.id}" title="${escHtml(`${topText} — ${nameText}`)}" class="draggable-el flex items-center shadow-xs w-fit max-w-full min-w-0 overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="${calloutPliStyle}">
                  <img src="${imgSrc}" alt="${escHtml(nameText)}" style="width:${imgW}px;height:${imgH}px" class="shrink-0 object-contain pointer-events-none" />
                  <div class="min-w-0 flex-1 overflow-hidden leading-tight">
                    <div class="${topWeightCls} truncate" style="color:${theme.accent};font-size:${st.pliSubCountFont}px">${escHtml(topText)}</div>
                    <div class="font-semibold opacity-75 truncate" style="font-size:${st.pliSubNameFont}px">${escHtml(nameText)}</div>
                  </div>
                </div>`;

            const pliIconPx = Math.max(13, Math.round(st.pliSubCountFont * 1.18));
            const pliBoxHtml = isOfficialMfStyle
              ? ''
              : step.attachedSubmodel
              ? renderCalloutPli(
                  attSubImg,
                  isTightSlot ? st.pliSubThumbWTight : st.pliSubThumbW,
                  isTightSlot ? st.pliSubThumbHTight : st.pliSubThumbH,
                  step.attachedSubmodel.isSectionAttach ? (step.attachedSubmodel.attachVerb || 'Connect') : `×${step.attachedSubmodel.repeatCount}`,
                  'font-black',
                  step.attachedSubmodel.name || 'Submodel',
                  step.attachedSubmodel.isSectionAttach
                    ? `${buildAttachArrowIconSvg(pliIconPx)}${(step.attachedSubmodel.repeatCount || 1) > 1 ? `<span>×${step.attachedSubmodel.repeatCount}</span>` : ''}`
                    : `<span>×${step.attachedSubmodel.repeatCount}</span>`,
                )
              : step.minifigPrep
              ? renderCalloutPli(
                  mfPrepImg,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  step.minifigPrep.label || 'Position',
                  'font-extrabold',
                  step.minifigPrep.name || 'Minifigure',
                  buildPoseAdjustIconSvg(pliIconPx),
                )
              : step.attachedMinifig
              ? renderCalloutPli(
                  attMfImg,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  isTightSlot ? st.pliMfThumbTight : st.pliMfThumb,
                  `×${step.attachedMinifig.repeatCount || 1}`,
                  'font-black',
                  step.attachedMinifig.name || 'Minifigure',
                  `<span>×${step.attachedMinifig.repeatCount || 1}</span>`,
                )
              : (!step.subassembly || ov.calloutAsPages ? `
                <div data-drag="pli" data-step="${step.id}" class="draggable-el flex items-center flex-wrap shadow-xs w-fit max-w-full min-w-0 ${isArrangeMode ? 'cursor-move' : ''}" style="gap:${Math.round(typo.pt(5))}px;padding:${Math.round(typo.pt(2.5))}px ${Math.round(typo.pt(6))}px;border-radius:${Math.round(typo.pt(8))}px;background:${theme.pliBg};border:${pliSel ? `2px solid ${theme.accent}` : `1px solid ${theme.pliBorder}`};transform:translate(${pliPos.x}px,${pliPos.y}px) scale(${pliScale});transform-origin:top left;">
                  ${pli.slice(0, 7).map(item => {
                    const anySel = isPartsMode && item.ids.some(id => state.selectedPartIds.has(id));
                    const thumb = getPliThumb(item.part);
                    const guideRingPx = Math.max(12, Math.round(st.pliGuideFont * 1.45));
                    return `<button type="button" data-pli-ids="${item.ids.join(',')}" data-step="${step.id}" class="pli-chip flex flex-col items-center rounded-lg transition ${isPartsMode ? 'cursor-pointer' : ''} ${anySel ? 'ring-2 ring-[var(--primary)] bg-[var(--primary-soft)]' : ''}" style="padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(2))}px" title="${escHtml(resolvePart(item.part.p).name)}">
                      <div class="flex items-center font-bold" style="gap:${Math.round(typo.pt(2.5))}px;font-size:${pliQtyPx}px">
                        <img src="${thumb}" style="width:${pliThumbPx}px;height:${pliThumbPx}px" class="shrink-0 object-contain pointer-events-none" />
                        <span>${item.qty}×</span>
                      </div>
                      ${state.showSizeGuides && item.guide ? (wordless ? `
                        <div class="flex items-center font-extrabold rounded-full bg-black/10 dark:bg-white/15" style="gap:${Math.round(typo.pt(3))}px;font-size:${st.pliGuideFont}px;padding:${Math.round(typo.pt(0.8))}px ${Math.round(typo.pt(3.5))}px">
                          <span>1:1</span>
                          <span class="inline-block rounded-full bg-current" style="height:${Math.max(2, Math.round(typo.pt(2.5)))}px;width:${Math.min(34, Math.round(item.guide.lengthL * typo.pt(3)))}px"></span>
                          <span class="inline-flex items-center justify-center rounded-full border border-current leading-none" style="min-width:${guideRingPx}px;height:${guideRingPx}px;padding:0 ${Math.round(typo.pt(2))}px">${item.guide.lengthL}</span>
                        </div>` : `
                        <div class="flex items-center font-extrabold rounded-full bg-black/10 dark:bg-white/15" style="gap:${Math.round(typo.pt(3))}px;font-size:${st.pliGuideFont}px;padding:0 ${Math.round(typo.pt(3.5))}px">
                          <span class="inline-block rounded-full bg-current" style="height:${Math.max(2, Math.round(typo.pt(2.5)))}px;width:${Math.min(34, Math.round(item.guide.lengthL * typo.pt(3)))}px"></span>
                          <span>1:1 ${item.guide.lengthL}L</span>
                        </div>`) : ''}
                    </button>`;
                  }).join('')}
                </div>` : '');

            const effectiveCue = getEffectiveStepCue(ch, step);
            const iconBadgeOuterPx = Math.max(isTightSlot ? 24 : 28, Math.round(typo.pt(isTightSlot ? 22 : 26)));
            const iconBadgeSvgPx = Math.max(13, Math.round(iconBadgeOuterPx * 0.58));
            const staticHeaderBadgesHtml = [
              step.stepHint
                ? (wordless
                  ? `<span class="inline-flex items-center justify-center rounded-full bg-white shadow-xs shrink-0" style="width:${iconBadgeOuterPx}px;height:${iconBadgeOuterPx}px;border:1.8px solid ${theme.accent};color:${theme.accent}" title="${escHtml(step.stepHint)}" aria-label="${escHtml(step.stepHint)}">${buildStepHintIconSvg(classifyStepHintAction(step.stepHint), iconBadgeSvgPx)}</span>`
                  : `<span class="font-bold rounded-full bg-white text-[#202124] shadow-xs whitespace-nowrap max-w-full truncate" style="border:1.5px solid ${theme.accent};font-size:${st.cueFont}px;padding:${Math.round(typo.pt(2))}px ${Math.round(typo.pt(6))}px">${escHtml(step.stepHint)}</span>`)
                : '',
              step.minifigPrep
                ? (wordless
                  ? `<span class="inline-flex items-center justify-center rounded-full bg-white shadow-xs shrink-0" style="width:${iconBadgeOuterPx}px;height:${iconBadgeOuterPx}px;border:1.8px solid ${theme.accent};color:${theme.accent}" title="Prepare minifigure pose" aria-label="Prepare minifigure pose">${buildPoseAdjustIconSvg(iconBadgeSvgPx)}</span>`
                  : `<span class="font-bold rounded-full bg-white text-[#202124] shadow-xs whitespace-nowrap max-w-full truncate" style="border:1.5px solid ${theme.accent};font-size:${st.cueFont}px;padding:${Math.round(typo.pt(2))}px ${Math.round(typo.pt(6))}px">↻ Prepare</span>`)
                : '',
            ].filter(Boolean).join('');
            const rotBadgeHtml = state.showRotCues && effectiveCue && effectiveCue !== 'none'
              ? renderRotationCueBadgeHtml(effectiveCue, theme, typo, isTightSlot, wordless)
              : '';
            const hasHeaderBadges = Boolean(staticHeaderBadgesHtml || rotBadgeHtml);
            const headerBadgesInnerHtml = `${staticHeaderBadgesHtml}<span data-rot-cue-host="${step.id}" class="${rotBadgeHtml ? 'inline-flex' : 'hidden'} items-center shrink-0">${rotBadgeHtml}</span>`;
            const stackHeaderBadges = hasHeaderBadges && (isTightSlot || estSlotW < typo.pt(250));

            return `
              <div data-step="${step.id}" class="step-slot absolute flex flex-col min-h-0 overflow-hidden transition ${isArrangeMode && slots.length > 1 ? 'cursor-pointer' : ''}" style="left:${slotLeftPct.toFixed(4)}%;top:${slotTopPct.toFixed(4)}%;width:${slotWidthPct.toFixed(4)}%;height:${slotHeightPct.toFixed(4)}%;border-radius:${typo.borderRadius}px;padding:${isOfficialMfStyle ? Math.round(st.slotPad * 0.5) : (isTightSlot ? Math.max(4, Math.round(st.slotPad * 0.72)) : st.slotPad)}px;border:${slotBorderStyle};background:${slotBgStyle}">
                <!-- Step Number & Draggable Parts List Box -->
                ${(() => {
                  const pinIconPx = Math.round(st.cueFont * 1.05);
                  const pinBadgeHtml = hasStepPageBreak(state.overrides, step.id, { step, minifigSeqSlice })
                    ? `<span class="no-print inline-flex items-center font-bold rounded-full bg-[var(--primary-soft)] text-[var(--primary)] shrink-0 whitespace-nowrap" style="gap:${Math.round(typo.pt(2))}px;font-size:${st.cueFont}px;padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(5))}px" title="Page break: Step ${step.num} always starts a new page so earlier edits won't shift later pages"><svg style="width:${pinIconPx}px;height:${pinIconPx}px" class="shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4"/><path d="M10 12h4"/><path d="M17 12h4"/><path d="M6 4v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4"/><path d="M6 20v-3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg><span>Page Break</span></span>`
                    : '';
                  if (isOfficialMfStyle) {
                    const showMfLabel = !wordless && (ch.steps.length > 1 || slots.length > 1);
                    if (!showMfLabel && !pinBadgeHtml && !hasHeaderBadges) return '';
                    return `
                <div class="relative z-10 shrink-0 flex items-center justify-between gap-1.5 px-1 min-w-0">
                  <div class="flex items-center gap-1.5 min-w-0">
                    ${showMfLabel ? `<span class="font-bold tracking-tight opacity-75 truncate" style="font-size:${st.pliSubNameFont}px">${escHtml(step.minifigName || `Minifigure ${step.num}`)}</span>` : ''}
                    ${pinBadgeHtml}
                  </div>
                  <div data-step-badges="${step.id}" class="${hasHeaderBadges ? 'flex' : 'hidden'} items-center gap-1.5 shrink-0">${headerBadgesInnerHtml}</div>
                </div>`;
                  }
                  return stackHeaderBadges ? `
                <div class="relative z-10 shrink-0 flex flex-col min-w-0" style="gap:${Math.round(typo.pt(4))}px">
                  <div class="flex items-center justify-between min-w-0" style="gap:${Math.round(typo.pt(4))}px">
                    <div class="flex items-center min-w-0 shrink-0" style="gap:${Math.round(typo.pt(4))}px">
                      <span class="font-extrabold leading-none shrink-0" style="font-size:${stepNumPx}px">${step.num}</span>
                      ${pinBadgeHtml}
                    </div>
                    <div data-step-badges="${step.id}" class="${hasHeaderBadges ? 'flex' : 'hidden'} items-center min-w-0 max-w-[82%] justify-end" style="gap:${Math.round(typo.pt(4))}px">${headerBadgesInnerHtml}</div>
                  </div>
                  ${pliBoxHtml ? `<div class="min-w-0 max-w-full">${pliBoxHtml}</div>` : ''}
                </div>` : `
                <div class="relative z-10 shrink-0 flex items-start justify-between min-w-0" style="gap:${Math.round(typo.pt(5))}px">
                  <div class="flex items-start flex-wrap min-w-0 flex-1" style="gap:${Math.round(typo.pt(6))}px">
                    <span class="font-extrabold leading-none shrink-0" style="font-size:${stepNumPx}px">${step.num}</span>
                    ${pinBadgeHtml}
                    ${pliBoxHtml}
                  </div>
                  <div data-step-badges="${step.id}" class="${hasHeaderBadges ? 'flex' : 'hidden'} items-center shrink-0 flex-wrap justify-end max-w-[55%]" style="gap:${Math.round(typo.pt(4))}px">${headerBadgesInnerHtml}</div>
                </div>`;
                })()}

                <!-- Step Visual Area (Callout + 3D Render / Official Minifig Style + Optional 1:1 Minifig Card — STRICT min-h-0 so NEVER clipped!) -->
                <div class="flex-1 min-h-0 flex ${ov.calloutDir === 'vertical' ? 'flex-col' : 'flex-row'} items-center justify-center overflow-hidden" style="gap:${Math.round(typo.pt(6))}px;margin-top:${isOfficialMfStyle ? 0 : Math.round(typo.pt(4))}px">
                  ${step.subassembly && !ov.calloutAsPages && !isOfficialMfStyle ? `
                    <div data-drag="callout" data-step="${step.id}" class="draggable-el shrink-0 ${ov.calloutDir === 'vertical' ? 'max-w-full' : 'max-w-[48%]'} max-h-full flex flex-col overflow-hidden ${isArrangeMode ? 'cursor-move' : ''}" style="width:${isTightSlot ? st.calloutWTight : st.calloutW}px;padding:${Math.round(typo.pt(5))}px;border-radius:${Math.round(typo.pt(8))}px;background:${theme.calloutBg};border:${calloutSel ? `2px solid ${theme.accent}` : `1.5px solid ${theme.calloutBorder}`};transform:translate(${calloutPos.x}px,${calloutPos.y}px)">
                      <div class="flex items-center ${wordless ? 'justify-end' : 'justify-between'} font-bold shrink-0 min-w-0" style="gap:${Math.round(typo.pt(4))}px;font-size:${st.calloutFont}px">
                        ${wordless ? '' : `<span class="min-w-0 truncate">${escHtml(step.subassembly.name)}</span>`}
                        <span class="rounded-full text-white shrink-0" style="background:${theme.accent};padding:${Math.round(typo.pt(1))}px ${Math.round(typo.pt(4.5))}px">${step.subassembly.repeatCount}×</span>
                      </div>
                      <img src="${subImg}" class="w-full flex-1 min-h-0 object-contain pointer-events-none" />
                    </div>` : ''}

                  <div class="flex-1 min-w-0 min-h-0 w-full h-full flex items-center justify-center relative overflow-hidden">
                    ${showLive3D
                      ? `<canvas id="liveRotateCanvas" class="absolute inset-0 w-full h-full object-contain cursor-grab active:cursor-grabbing" style="touch-action:none;"></canvas>`
                      : isMfExploded && mfExploded
                        ? `<img data-pick-step="${step.id}" src="${mfExploded.url}" alt="${escHtml(step.minifigName || 'Minifigure assembly')}" class="absolute inset-0 w-full h-full object-contain pointer-events-none" />`
                        : isMfSeq && mfSeqStages
                          ? `<div class="w-full h-full grid items-center justify-items-center gap-1 sm:gap-2 px-1" style="grid-template-columns:repeat(${mfSeqStages.length},minmax(0,1fr))">
                              ${mfSeqStages.map(({ stage, img }) => `
                                <div class="w-full h-full min-w-0 min-h-0 flex items-center justify-center overflow-hidden">
                                  <img src="${img.url}" alt="${escHtml(`Step ${stage.stepNumber}: ${stage.label}`)}" class="max-w-full max-h-full w-full h-full object-contain pointer-events-none" />
                                </div>`).join('')}
                            </div>`
                          : `<img data-pick-step="${step.id}" src="${snap.url}" class="step-render-img absolute inset-0 w-full h-full object-contain ${isPartsMode ? 'cursor-crosshair' : 'pointer-events-none'}" />`
                    }
                    ${step.isSubmodelFinal ? `<span class="absolute rounded-full font-black text-white shadow-md pointer-events-none" style="bottom:${Math.round(typo.pt(5))}px;right:${Math.round(typo.pt(5))}px;padding:${Math.round(typo.pt(3))}px ${Math.round(typo.pt(9))}px;font-size:${st.subFinalFont}px;background:${theme.accent}">×${step.submodelRepeat || 2}</span>` : ''}
                  </div>

                  ${mf1to1 ? (() => {
                    const mf1Hdr = formatMinifig1to1Header(mf1to1.heightMm, mf1to1.isExact, wordless);
                    return `
                    <div class="shrink-0 max-w-[45%] flex flex-col items-center justify-center max-h-full overflow-hidden shadow-xs" style="border-radius:${Math.round(typo.pt(8))}px;padding:${Math.round(typo.pt(5))}px ${Math.round(typo.pt(7))}px;gap:${Math.round(typo.pt(4))}px;background:${theme.calloutBg};border:1.5px solid ${theme.calloutBorder}" title="Actual-size 1:1 minifigure reference (${Math.round(mf1to1.heightMm)} mm tall)">
                      <div class="flex items-center font-extrabold leading-none max-w-full overflow-hidden whitespace-nowrap" style="gap:${Math.round(typo.pt(4))}px;font-size:${st.mf1to1Font}px">
                        <span class="rounded-full text-white shrink-0" style="background:${theme.accent};padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(5))}px">${escHtml(mf1Hdr.badge)}</span>
                        ${mf1Hdr.detail ? `<span class="opacity-75 tabular-nums truncate">${escHtml(mf1Hdr.detail)}</span>` : ''}
                      </div>
                      <div class="flex items-center" style="gap:${Math.round(typo.pt(4))}px">
                        <img src="${mf1to1.url}" alt="1:1 actual size minifigure" style="width:${mf1to1.displayPxW}px;height:${mf1to1.displayPxH}px" class="block shrink-0 pointer-events-none" />
                        <div class="flex flex-col items-center justify-between opacity-55" style="height:${Math.max(24, Math.round(mf1to1.displayPxH * 0.92))}px">
                          <span class="w-1.5 h-[1.5px] bg-current"></span>
                          <span class="w-[1.5px] flex-1 bg-current"></span>
                          <span class="w-1.5 h-[1.5px] bg-current"></span>
                        </div>
                      </div>
                    </div>`;
                  })() : ''}
                </div>
                ${step.isMinifigPoseStep && step.minifigPrep?.indicators?.length > 0 ? `
                  <div class="shrink-0 flex items-center justify-center flex-wrap pointer-events-none" style="gap:${Math.round(typo.pt(4))}px;margin-top:${Math.round(typo.pt(4))}px">
                    ${step.minifigPrep.indicators.map(ind => `
                      <span class="inline-flex items-center font-bold rounded-full shadow-xs bg-white/90 text-[#1e293b] whitespace-nowrap" style="gap:${Math.round(typo.pt(3.5))}px;padding:${Math.round(typo.pt(1.5))}px ${Math.round(typo.pt(6))}px;font-size:${st.cueFont}px;border:1.5px solid ${ind.color || theme.accent}" title="${escHtml(ind.label)}">
                        <span class="rounded-full shrink-0" style="width:${Math.max(6, Math.round(st.cueFont * 0.72))}px;height:${Math.max(6, Math.round(st.cueFont * 0.72))}px;background:${ind.color || theme.accent}"></span>
                        ${wordless ? `<span class="inline-flex items-center shrink-0" style="color:${ind.color || theme.accent}">${buildMinifigPoseIconSvg(ind.kind, Math.max(11, Math.round(st.cueFont * 1.22)))}</span>` : ''}
                        <span class="tabular-nums">${escHtml(formatMinifigPoseBadgeText(ind, wordless))}</span>
                      </span>`).join('')}
                  </div>` : ''}
                <!-- Step-Specific Custom Callouts (Notes & Images bound to this exact step) -->
                ${(state.stepInserts[step.id] || []).map((ins, insIdx) => {
                  const corner = ins.corner || 'bottom-right';
                  const hasCustomXY = typeof ins.x === 'number' && typeof ins.y === 'number';
                  const offsetPx = Math.round(typo.pt(8));
                  const stackShift = insIdx * Math.round(typo.pt(28));
                  const posStyle = hasCustomXY
                    ? `left:${ins.x}px;top:${ins.y}px;transform-origin:top left;`
                    : corner === 'top-left'
                      ? `left:${offsetPx}px;top:${offsetPx + stackShift}px;transform-origin:top left;`
                      : corner === 'top-right'
                        ? `right:${offsetPx}px;top:${offsetPx + stackShift}px;transform-origin:top right;`
                        : corner === 'bottom-left'
                          ? `left:${offsetPx}px;bottom:${offsetPx + stackShift}px;transform-origin:bottom left;`
                          : `right:${offsetPx}px;bottom:${offsetPx + stackShift}px;transform-origin:bottom right;`;
                  return `<div data-drag="step-insert" data-step="${step.id}" data-insert-id="${ins.id}" class="draggable-el absolute z-20 ${isStepNotesMode ? 'cursor-move ring-1 ring-dashed ring-[var(--primary)]/55' : 'pointer-events-none'}" style="${posStyle}padding:${Math.round(typo.pt(5))}px ${Math.round(typo.pt(7))}px;border-radius:${Math.round(typo.pt(8))}px;transform:scale(${ins.scale || 1});border:1px solid ${ins.kind === 'text' ? theme.calloutBorder : 'transparent'};background:${ins.kind === 'text' ? theme.calloutBg : 'transparent'};box-shadow:0 2px 6px rgba(0,0,0,0.08);touch-action:${isStepNotesMode ? 'none' : 'auto'};">
                    ${ins.kind === 'text'
                      ? `<div class="font-bold leading-snug break-words overflow-hidden" style="font-size:${st.insertTextFont}px;max-width:${st.insertTextMaxW}px">${escHtml(ins.text)}</div>`
                      : `<img src="${ins.src}" style="width:${st.insertImgSize}px;height:${st.insertImgSize}px" class="object-contain rounded-lg pointer-events-none" />`}
                  </div>`;
                }).join('')}
              </div>`;
          }).join('')}
        </div>

        <!-- Page Footer -->
        <div class="absolute flex justify-between font-medium pointer-events-none" style="bottom:${footerPadBottom}px;left:${padPx}px;right:${padPx}px;font-size:${typo.footerFont}px;color:${theme.muted}">
          <span class="truncate">${showFooterTitle ? escHtml(page.chapterName) : ''}</span>
          <span style="color:${theme.text}" class="font-bold shrink-0">${escHtml(pgNumText)}</span>
        </div>
      </div>`;

    bindStepPageInteractions(page);
  }

  renderContextOverlay(page);
  syncMenuControls();
  applyStageTransform();
}

// =========================================================================
// 7. DIRECT CANVAS INTERACTIONS (Part Picking, Step Orbit, Notes Drag)
// =========================================================================
function syncVisibleStepRotationBadges() {
  const frame = document.getElementById('pageFrame');
  if (!frame || currentSlotRenderInfo.size === 0) return;

  const hosts = new Map();
  frame.querySelectorAll('[data-rot-cue-host]').forEach((el) => {
    const sid = el.getAttribute('data-rot-cue-host');
    if (sid) hosts.set(sid, el);
  });
  const wraps = new Map();
  frame.querySelectorAll('[data-step-badges]').forEach((el) => {
    const sid = el.getAttribute('data-step-badges');
    if (sid) wraps.set(sid, el);
  });

  for (const [sid, sInfo] of currentSlotRenderInfo.entries()) {
    const nextCue = getEffectiveStepCue(sInfo.ch, sInfo.step);
    if (nextCue === sInfo.lastEffectiveCue) continue;
    sInfo.lastEffectiveCue = nextCue;
    const badgeHtml = state.showRotCues && nextCue && nextCue !== 'none'
      ? renderRotationCueBadgeHtml(nextCue, sInfo.theme, sInfo.typo, sInfo.isTightSlot, sInfo.wordless)
      : '';
    const host = hosts.get(sid);
    if (host) {
      host.innerHTML = badgeHtml;
      host.classList.toggle('inline-flex', Boolean(badgeHtml));
      host.classList.toggle('hidden', !badgeHtml);
    }
    const wrap = wraps.get(sid);
    if (wrap) {
      const hasAny = Boolean(badgeHtml || sInfo.hasStaticBadges);
      wrap.classList.toggle('flex', hasAny);
      wrap.classList.toggle('hidden', !hasAny);
    }
  }
}

function bindStepPageInteractions(page) {
  const frame = document.getElementById('pageFrame');
  const isPartsMode = state.mode === 'parts';
  const isLiveStepCamera = state.mode === 'step' && state.stepSubTab === 'camera';
  const isStepNotesMode = state.mode === 'step' && state.stepSubTab === 'notes';

  // Tap a step slot to make it active
  frame.querySelectorAll('.step-slot').forEach(slotEl => {
    slotEl.addEventListener('click', () => {
      const sid = slotEl.getAttribute('data-step');
      if (state.selectedStepId !== sid) {
        state.selectedStepId = sid;
        state.selectedPartIds.clear();
        renderAll();
      }
    });
  });

  // PARTS MODE: Tap PLI chip to select/toggle those exact parts
  frame.querySelectorAll('.pli-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (!isPartsMode) return;
      e.stopPropagation();
      const sid = btn.getAttribute('data-step');
      const ids = btn.getAttribute('data-pli-ids').split(',').filter(Boolean);
      if (state.selectedStepId !== sid) { state.selectedStepId = sid; state.selectedPartIds.clear(); }
      const allSelected = ids.every(id => state.selectedPartIds.has(id));
      ids.forEach(id => allSelected ? state.selectedPartIds.delete(id) : state.selectedPartIds.add(id));
      renderAll();
    });
  });

  // PARTS MODE: Tap directly on a 3D part in the step render to pick it
  frame.querySelectorAll('.step-render-img').forEach(img => {
    img.addEventListener('click', (e) => {
      if (!isPartsMode) return;
      e.stopPropagation();
      const sid = img.getAttribute('data-pick-step');
      const info = currentSlotRenderInfo.get(sid);
      if (!info || !info.snap.mvp) return;
      const rect = img.getBoundingClientRect();
      // Account for object-contain letterboxing inside the img element
      const imgAspect = info.snap.w / info.snap.h;
      const boxAspect = rect.width / rect.height;
      let drawW = rect.width, drawH = rect.height, ox = 0, oy = 0;
      if (boxAspect > imgAspect) { drawW = rect.height * imgAspect; ox = (rect.width - drawW) / 2; }
      else { drawH = rect.width / imgAspect; oy = (rect.height - drawH) / 2; }
      const ndcX = ((e.clientX - rect.left - ox) / drawW) * 2 - 1;
      const ndcY = 1 - ((e.clientY - rect.top - oy) / drawH) * 2;

      // Pick closest new part in this step whose projected 3D box contains (or is nearest to) tap
      let bestId = null, bestScore = 0.28;
      const ov = info.ov || {};
      for (const p of info.step.parts) {
        const pOv = ov.partOffsets?.[p.id] || info.step.defaultPartOffsets?.[p.id] || {};
        const box = computeWorldBox(p);
        const dx = (pOv.x || 0) + (ov.offX || 0), dy = (pOv.y || 0) + (ov.offY || 0), dz = (pOv.z || 0) + (ov.offZ || 0);
        const c = projectWorldToNdc([box.center[0]+dx, box.center[1]+dy, box.center[2]+dz], info.snap.mvp);
        const dist = Math.hypot(c[0] - ndcX, c[1] - ndcY);
        if (dist < bestScore) { bestScore = dist; bestId = p.id; }
      }
      if (bestId) {
        if (state.selectedStepId !== sid) { state.selectedStepId = sid; state.selectedPartIds.clear(); }
        if (state.selectedPartIds.has(bestId)) state.selectedPartIds.delete(bestId);
        else state.selectedPartIds.add(bestId);
        renderAll();
      } else {
        showToast('Tap a highlighted part or a part in the Parts Box.');
      }
    });
  });

  // STEP -> CAMERA MODE: Attach single GPU-cached live WebGL canvas matching static snapshot size identically
  if (isLiveStepCamera) {
    const liveCanvas = document.getElementById('liveRotateCanvas');
    const info = currentSlotRenderInfo.get(state.selectedStepId);
    if (liveCanvas && info) {
      activeLiveEngine = new WebGLBrickEngine(liveCanvas);
      const w = info.snap.w || 760;
      const h = info.snap.h || 500;
      const fixedHalfH = info.opts?.fixedHalfH || 0;
      const liveDrawOpts = (info.isMfExploded || info.isMfSeq)
        ? { ...(info.opts || {}), tightFit: true }
        : (info.opts || null);
      let az = info.cam.az, el = info.cam.el;
      activeLiveEngine.draw(info.snap.mesh, w, h, az, el, info.modelScale, fixedHalfH, liveDrawOpts);

      let dragging = false, moved = false, pushedUndo = false, startX = 0, startY = 0, lx = 0, ly = 0;
      liveCanvas.onpointerdown = (e) => {
        e.stopPropagation();
        dragging = true;
        moved = false;
        pushedUndo = false;
        startX = lx = e.clientX;
        startY = ly = e.clientY;
        liveCanvas.setPointerCapture(e.pointerId);
      };
      liveCanvas.onpointermove = (e) => {
        if (!dragging || !activeLiveEngine) return;
        e.stopPropagation();
        const dx = e.clientX - lx;
        const dy = e.clientY - ly;
        lx = e.clientX;
        ly = e.clientY;
        if (!moved && Math.hypot(e.clientX - startX, e.clientY - startY) < 2) return;
        if (!pushedUndo) {
          pushUndo();
          pushedUndo = true;
        }
        moved = true;
        az = (((az - dx * 0.7) % 360) + 360) % 360;
        el = Math.max(-75, Math.min(75, el + dy * 0.5));
        const nextSide = el < 0 ? 'bottom' : 'top';
        const matchedPreset = findMatchingCameraPreset(az);
        const roundedAz = ((Math.round(az) % 360) + 360) % 360;
        const roundedEl = Math.round(el);
        const nextOv = {
          ...(state.overrides[info.step.id] || {}),
          side: nextSide,
          az: roundedAz,
          el: roundedEl,
        };
        if (matchedPreset) nextOv.corner = matchedPreset.id;
        else delete nextOv.corner;
        state.overrides[info.step.id] = nextOv;
        info.cam = getStepCamera(info.step);
        const readout = document.getElementById('stepCamReadout');
        if (readout) readout.textContent = `${roundedAz}° / ${roundedEl}°`;
        syncVisibleStepRotationBadges();
        activeLiveEngine.draw(info.snap.mesh, w, h, az, el, info.modelScale, fixedHalfH, liveDrawOpts);
      };
      const endOrbit = (e) => {
        if (!dragging) return;
        e.stopPropagation();
        dragging = false;
        if (moved) {
          renderAll();
        }
      };
      liveCanvas.onpointerup = endOrbit;
      liveCanvas.onpointercancel = endOrbit;
    }
  }

  // STEP -> NOTES MODE: Allow dragging step-bound custom callouts directly inside their step slot
  if (isStepNotesMode) {
    frame.querySelectorAll('[data-drag="step-insert"]').forEach(el => {
      let dragging = false, sx = 0, sy = 0, origX = 0, origY = 0, moved = false, pushedUndo = false;
      const sid = el.getAttribute('data-step');
      const insId = el.getAttribute('data-insert-id');
      el.onpointerdown = (e) => {
        e.stopPropagation();
        dragging = true; moved = false; pushedUndo = false;
        sx = e.clientX; sy = e.clientY;
        el.setPointerCapture(e.pointerId);
        const slotEl = el.closest('.step-slot');
        const slotRect = slotEl ? slotEl.getBoundingClientRect() : null;
        const elRect = el.getBoundingClientRect();
        const effScale = getEffectiveStageScale();
        origX = slotRect ? Math.round((elRect.left - slotRect.left) / effScale) : 12;
        origY = slotRect ? Math.round((elRect.top - slotRect.top) / effScale) : 12;
      };
      el.onpointermove = (e) => {
        if (!dragging) return;
        e.stopPropagation();
        const effScale = getEffectiveStageScale();
        const dx = (e.clientX - sx) / effScale, dy = (e.clientY - sy) / effScale;
        if (Math.hypot(dx, dy) > 2) moved = true;
        if (!moved) return;
        if (!pushedUndo) {
          pushUndo();
          pushedUndo = true;
        }
        const nx = Math.max(0, Math.round(origX + dx));
        const ny = Math.max(0, Math.round(origY + dy));
        const ins = (state.stepInserts[sid] || []).find(x => x.id === insId);
        if (ins) {
          ins.x = nx; ins.y = ny;
          el.style.right = 'auto';
          el.style.bottom = 'auto';
          el.style.left = nx + 'px';
          el.style.top = ny + 'px';
          el.style.transformOrigin = 'top left';
        }
      };
      el.onpointerup = (e) => {
        if (dragging && moved) {
          e.stopPropagation();
          renderContextOverlay(page);
        }
        dragging = false;
      };
    });
  }
}

// =========================================================================
// 8. FLOATING CONTEXTUAL CARDS (Scope-Organized: Parts | Camera | Step | Page)
// =========================================================================
function renderScopeBadge(tier, label) {
  if (tier === 'range') {
    return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning)]/30 whitespace-nowrap shrink-0" title="Affects multiple steps or pages"><svg class="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg><span>${escHtml(label)}</span></span>`;
  }
  if (tier === 'manual') {
    return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--info-soft)] text-[var(--info)] border border-[var(--info)]/30 whitespace-nowrap shrink-0" title="Applies across the whole manual"><svg class="w-2.5 h-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg><span>${escHtml(label)}</span></span>`;
  }
  return `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-[var(--surface-sunken)] text-[var(--muted-foreground)] border border-[var(--border)] whitespace-nowrap shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-current opacity-65"></span><span>${escHtml(label)}</span></span>`;
}

const DESTRUCTIVE_ALERT_SVG = '<svg class="destructive-notice-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>';

function renderDestructiveNoticeHtml(notice, { compact = false, extraClass = '' } = {}) {
  if (!notice || !notice.message) return '';
  const cls = `destructive-notice${compact ? ' destructive-notice-compact' : ''}${extraClass ? ` ${extraClass}` : ''}`;
  return `<div role="note" data-tone="${notice.tone === 'danger' ? 'danger' : 'warning'}" class="${cls}">${DESTRUCTIVE_ALERT_SVG}<span class="min-w-0 flex-1">${escHtml(notice.message)}</span></div>`;
}

function applyDestructiveNoticeToEl(elOrId, notice) {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  if (!notice || !notice.message) {
    el.classList.add('hidden');
    el.removeAttribute('data-tone');
    el.innerHTML = '';
    return;
  }
  el.setAttribute('data-tone', notice.tone === 'danger' ? 'danger' : 'warning');
  el.innerHTML = `${DESTRUCTIVE_ALERT_SVG}<span class="min-w-0 flex-1">${escHtml(notice.message)}</span>`;
  el.classList.remove('hidden');
}

function getCurrentManualEditsSummary() {
  if (!state.model) return summarizeManualEdits({});
  return summarizeManualEdits({
    chapters: state.model.chapters,
    overrides: state.overrides,
    stepInserts: state.stepInserts,
    dividerAfter: state.dividerAfter,
    layoutGroups: state.layoutGroups,
    coverMeta: state.coverMeta,
    completeMeta: state.completeMeta,
    backMeta: state.backMeta,
    modelTitle: state.model.title,
    wordlessMode: state.wordlessMode,
  });
}

// Visual Cube + Simple Stylized Camera SVG icons shared across Cover, Build Complete & Step Camera controls
function buildCameraViewSvg(kind) {
  if (kind === 'top') {
    return `<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="8" y="2" width="8" height="4.5" rx="1.2" fill="currentColor"/>
      <path d="M10.5 6.5 9 9.5h6l-1.5-3" fill="currentColor" opacity="0.5"/>
      <path d="M12 11.5 18 14.5 12 17.5 6 14.5 12 11.5Z" fill="currentColor" fill-opacity="0.22" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M6 14.5V19.5L12 22.5L18 19.5V14.5M12 17.5V22.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
  }
  if (kind === 'bottom') {
    return `<svg class="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 1.5 18 4.5 12 7.5 6 4.5 12 1.5Z" fill="currentColor" fill-opacity="0.16" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M6 4.5V9.5L12 12.5L18 9.5V4.5M12 7.5V12.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      <path d="M10.5 17.5 9 14.5h6l-1.5 3" fill="currentColor" opacity="0.5"/>
      <rect x="8" y="17.5" width="8" height="4.5" rx="1.2" fill="currentColor"/>
    </svg>`;
  }
  const camPos = {
    se: { x: 18.5, y: 18.5, ray: 'M15.8 16.2 13.8 14.6' },
    ne: { x: 18.5, y: 5.5,  ray: 'M15.8 7.8 13.8 9.4' },
    nw: { x: 5.5,  y: 5.5,  ray: 'M8.2 7.8 10.2 9.4' },
    sw: { x: 5.5,  y: 18.5, ray: 'M8.2 16.2 10.2 14.6' },
  }[kind] || { x: 18.5, y: 18.5, ray: 'M15.8 16.2 13.8 14.6' };
  return `<svg class="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 7.2 16.4 9.5 12 11.8 7.6 9.5 12 7.2Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M7.6 9.5V14.5L12 16.8L16.4 14.5V9.5M12 11.8V16.8" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="${camPos.ray}" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" opacity="0.7"/>
    <rect x="${(camPos.x - 3).toFixed(1)}" y="${(camPos.y - 2.3).toFixed(1)}" width="6" height="4.6" rx="1.2" fill="currentColor"/>
    <circle cx="${camPos.x}" cy="${camPos.y}" r="1.1" fill="var(--card)"/>
  </svg>`;
}

function renderZoomStepperHtml({ downId, upId, pct, downLabel, upLabel }) {
  return `<div class="inline-flex items-center gap-0.5 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] p-0.5">
    <button type="button" id="${downId}" aria-label="${escHtml(downLabel)}" title="${escHtml(downLabel)}" class="w-6 h-6 rounded bg-[var(--card)] hover:bg-[var(--surface-hover)] font-bold flex items-center justify-center cursor-pointer">−</button>
    <span class="font-mono text-[11px] font-bold tabular-nums min-w-[40px] text-center">${pct}%</span>
    <button type="button" id="${upId}" aria-label="${escHtml(upLabel)}" title="${escHtml(upLabel)}" class="w-6 h-6 rounded bg-[var(--card)] hover:bg-[var(--surface-hover)] font-bold flex items-center justify-center cursor-pointer">+</button>
  </div>`;
}

function renderContextOverlay(page) {
  const box = document.getElementById('contextOverlay');
  box.innerHTML = '';

  // PARTS LIST: Edited directly via the bottom mode pill ("Customize Parts List" -> #bomSetupModal)
  if (page.kind === 'bom') {
    box.classList.add('hidden');
    return;
  }

  if (state.mode === 'pan') { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');

  const icoClose = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  const icoSpark = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>';
  const icoOrbit = '<svg class="w-3.5 h-3.5 text-[var(--primary)] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.5 6.3"/><path d="M3 12a9 9 0 0 1 15.5-6.3"/><polyline points="3 16 3 12 7 12"/><polyline points="21 8 21 12 17 12"/></svg>';

  // =========================================================================
  // COVER & BUILD COMPLETE — CAMERA MODE (Preset Angles + Zoom)
  // =========================================================================
  if ((page.kind === 'cover' || page.kind === 'complete') && state.mode === 'camera') {
    const isCover = page.kind === 'cover';
    if (isCover) state.coverMeta = normalizeCoverMeta(state.coverMeta, !state.wordlessMode);
    else state.completeMeta = normalizeCompleteMeta(state.completeMeta);
    const meta = isCover ? state.coverMeta : state.completeMeta;
    const defaults = isCover ? createDefaultCoverMeta() : createDefaultCompleteMeta();
    const matchedPreset = findMatchingCameraPreset(meta.az);
    const clampedZoom = clampCoverZoom(meta.zoom ?? 1.0);
    const zoomPct = Math.round(clampedZoom * 100);
    const customized = isHeroCameraCustomized(meta, defaults);
    const heroResetNotice = customized
      ? getHeroResetCameraDestructiveNotice({
          pageLabel: isCover ? 'Cover Page' : 'Build Complete',
          az: meta.az,
          el: meta.el,
          zoom: clampedZoom,
          defaultAz: defaults.az,
          defaultEl: defaults.el,
          defaultZoom: defaults.zoom,
        })
      : null;

    box.innerHTML = `
      <div class="pointer-events-auto studio-surface rounded-xl p-3.5 w-full space-y-2.5 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-bold">${isCover ? 'Cover Camera' : 'Build Complete Camera'}</span>
            ${renderScopeBadge('local', isCover ? 'Cover Page' : 'Build Complete')}
          </div>
          <span class="font-mono text-[11px] font-semibold text-[var(--muted-foreground)] tabular-nums shrink-0">${Math.round(meta.az) % 360}° / ${Math.round(meta.el)}°</span>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mr-0.5">Angle</span>
          ${CORNERS.map(c => `<button type="button" data-hero-corner="${c.id}" title="Set camera to ${c.label} corner" class="hero-corner-btn px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${matchedPreset?.id === c.id ? 'bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary)]' : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)]'}">${buildCameraViewSvg(c.quadrant)}<span class="font-mono">${c.label}</span></button>`).join('')}
        </div>
        <div class="space-y-2 pt-2 border-t border-[var(--border)]">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Zoom</span>
              ${renderZoomStepperHtml({ downId: 'heroZoomOut', upId: 'heroZoomIn', pct: zoomPct, downLabel: 'Zoom model out', upLabel: 'Zoom model in' })}
            </div>
            ${customized ? `<button id="heroResetCam" type="button" class="px-2.5 py-1 rounded-md border border-[var(--warning)]/35 bg-[var(--warning-soft)] text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white text-xs font-semibold transition-colors cursor-pointer">Reset Camera</button>` : ''}
          </div>
          ${renderDestructiveNoticeHtml(heroResetNotice, { compact: true })}
        </div>
      </div>`;

    box.querySelectorAll('.hero-corner-btn').forEach(b => {
      b.onclick = () => {
        const cObj = CORNERS.find(c => c.id === b.getAttribute('data-hero-corner'));
        if (!cObj) return;
        pushUndo();
        meta.az = cObj.az;
        meta.el = clampCoverElevation(meta.el);
        renderAll();
      };
    });
    box.querySelector('#heroZoomOut').onclick = () => {
      pushUndo();
      meta.zoom = clampCoverZoom((meta.zoom ?? 1.0) - 0.1);
      renderAll();
    };
    box.querySelector('#heroZoomIn').onclick = () => {
      pushUndo();
      meta.zoom = clampCoverZoom((meta.zoom ?? 1.0) + 0.1);
      renderAll();
    };
    const resetBtn = box.querySelector('#heroResetCam');
    if (resetBtn) {
      resetBtn.onclick = () => {
        pushUndo();
        meta.az = defaults.az;
        meta.el = defaults.el;
        meta.zoom = defaults.zoom;
        renderAll();
      };
    }
    return;
  }

  // =========================================================================
  // COVER / BUILD COMPLETE / BACK COVER — PAGE MODE (Content & Branding Only)
  // =========================================================================
  if (page.kind === 'cover' || page.kind === 'complete' || page.kind === 'back') {
    const isCover = page.kind === 'cover';
    const isComplete = page.kind === 'complete';
    const isBack = page.kind === 'back';
    if (isCover) state.coverMeta = normalizeCoverMeta(state.coverMeta, !state.wordlessMode);
    if (isComplete) state.completeMeta = normalizeCompleteMeta(state.completeMeta);
    if (isBack) state.backMeta = normalizeBackMeta(state.backMeta);
    const meta = isCover ? state.coverMeta : isComplete ? state.completeMeta : state.backMeta;
    const defaultTitle = isCover ? state.model.title : 'Build Complete!';

    if (isCover) {
      const showCoverText = meta.showText !== false;
      const hasCreatorLogo = Boolean(meta.creatorLogoSrc);
      const hasThemeImg = Boolean(meta.themeImageSrc);
      const hasBg = Boolean(meta.bgSrc);
      const paperSpec = PAPER_FORMAT_SPECS[state.paperFormat] || PAPER_FORMAT_SPECS.screen;
      const orientTxt = paperSpec.supportsOrientation ? (state.orientation === 'portrait' ? 'Portrait' : 'Landscape') : '';
      const manualSummary = [paperSpec.shortName, orientTxt].filter(Boolean).join(' · ');
      box.innerHTML = `
        <div class="pointer-events-auto studio-surface rounded-xl p-3.5 w-full space-y-2.5 text-xs">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="font-bold">Cover Page</span>
            ${renderScopeBadge('local', 'This Page')}
          </div>
          <div class="grid grid-cols-2 gap-2 ${showCoverText ? '' : 'hidden'}">
            <input id="covTitleIn" value="${escHtml(meta.title || defaultTitle)}" placeholder="Model name" class="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] outline-none focus:border-[var(--primary)]" />
            <input id="covSubIn" value="${escHtml(meta.subtitle || '')}" placeholder="Subtitle (optional)" class="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] outline-none focus:border-[var(--primary)]" />
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button id="covTextToggle" type="button" title="Show or hide front cover title and subtitle" class="px-2.5 py-1.5 rounded-md font-semibold cursor-pointer ${showCoverText ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)]'}">Title Text</button>
            <div class="inline-flex items-center rounded-md overflow-hidden ${hasCreatorLogo ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)]'}">
              <button id="covCreatorLogoBtn" type="button" class="px-2.5 py-1.5 font-semibold cursor-pointer">Creator Logo</button>
              ${hasCreatorLogo ? `<button id="covCreatorLogoClr" type="button" title="Remove creator logo" aria-label="Remove creator logo" class="pr-2 pl-1 py-1.5 flex items-center justify-center opacity-85 hover:opacity-100 cursor-pointer">${icoClose}</button>` : ''}
            </div>
            <div class="inline-flex items-center rounded-md overflow-hidden ${hasThemeImg ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)]'}">
              <button id="covThemeImgBtn" type="button" title="Upload top-right series or theme logo" class="px-2.5 py-1.5 font-semibold cursor-pointer">Series / Theme Logo</button>
              ${hasThemeImg ? `<button id="covThemeImgClr" type="button" title="Remove series or theme logo" aria-label="Remove series or theme logo" class="pr-2 pl-1 py-1.5 flex items-center justify-center opacity-85 hover:opacity-100 cursor-pointer">${icoClose}</button>` : ''}
            </div>
            <div class="inline-flex items-center rounded-md overflow-hidden ${hasBg ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)]'}">
              <button id="covBgBtn" type="button" class="px-2.5 py-1.5 font-semibold cursor-pointer">Background Image</button>
              ${hasBg ? `<button id="covBgClr" type="button" title="Remove background image" aria-label="Remove background image" class="pr-2 pl-1 py-1.5 flex items-center justify-center opacity-85 hover:opacity-100 cursor-pointer">${icoClose}</button>` : ''}
            </div>
          </div>
          <div class="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 min-w-0 flex-1">
              ${renderScopeBadge('manual', 'All Pages')}
              <span class="font-mono text-[11px] text-[var(--muted-foreground)] truncate">${escHtml(manualSummary)}</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button id="covOpenPageSetupBtn" type="button" class="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer">Page Setup…</button>
              <button id="covOpenStyleBtn" type="button" class="px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer">Style…</button>
            </div>
          </div>
        </div>`;

      box.querySelector('#covOpenPageSetupBtn').onclick = () => openPageSetupModal();
      box.querySelector('#covOpenStyleBtn').onclick = () => setStylePopoverOpen(true);
      box.querySelector('#covTextToggle').onclick = () => { pushUndo(); meta.showText = !(meta.showText !== false); renderAll(); };
      box.querySelector('#covTitleIn').onchange = (e) => { pushUndo(); meta.title = e.target.value; renderAll(); };
      box.querySelector('#covSubIn').onchange = (e) => { pushUndo(); meta.subtitle = e.target.value; renderAll(); };
      box.querySelector('#covCreatorLogoBtn').onclick = () => openCoverImagePicker('creatorLogo');
      const clrCreator = box.querySelector('#covCreatorLogoClr');
      if (clrCreator) clrCreator.onclick = () => { pushUndo(); meta.creatorLogoSrc = null; renderAll(); };
      box.querySelector('#covThemeImgBtn').onclick = () => openCoverImagePicker('themeImage');
      const clrTheme = box.querySelector('#covThemeImgClr');
      if (clrTheme) clrTheme.onclick = () => { pushUndo(); meta.themeImageSrc = null; renderAll(); };
      box.querySelector('#covBgBtn').onclick = () => openCoverImagePicker('bg');
      const clrBg = box.querySelector('#covBgClr');
      if (clrBg) clrBg.onclick = () => { pushUndo(); meta.bgSrc = null; renderAll(); };
      return;
    }

    const hasBg = Boolean(meta.bgSrc);
    box.innerHTML = `
      <div class="pointer-events-auto studio-surface rounded-xl p-3.5 w-full space-y-2.5 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="font-bold">${isComplete ? 'Build Complete Page' : 'Back Cover'}</span>
            ${renderScopeBadge('local', 'This Page')}
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${isComplete ? `
              <button id="compToggleText" type="button" class="px-2.5 py-1.5 rounded-md font-semibold cursor-pointer ${meta.showText !== false ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)]'}">Text</button>
              <button id="compToggleFw" type="button" class="px-2.5 py-1.5 rounded-md font-semibold inline-flex items-center gap-1 cursor-pointer ${meta.showFireworks !== false ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)]'}">${icoSpark}<span>Fireworks</span></button>
            ` : ''}
            <div class="inline-flex items-center rounded-md overflow-hidden ${hasBg ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)]'}">
              <button id="covBgBtn" type="button" class="px-2.5 py-1.5 font-semibold cursor-pointer">Background Image</button>
              ${hasBg ? `<button id="covBgClr" type="button" title="Remove background image" aria-label="Remove background image" class="pr-2 pl-1 py-1.5 flex items-center justify-center opacity-85 hover:opacity-100 cursor-pointer">${icoClose}</button>` : ''}
            </div>
          </div>
        </div>
        ${!isBack ? `
          <div class="grid grid-cols-2 gap-2">
            <input id="covTitleIn" value="${escHtml(meta.title || defaultTitle)}" placeholder="Title" class="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] outline-none focus:border-[var(--primary)]" />
            <input id="covSubIn" value="${escHtml(meta.subtitle || '')}" placeholder="Subtitle" class="px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] outline-none focus:border-[var(--primary)]" />
          </div>
        ` : ''}
      </div>`;
    const titleIn = box.querySelector('#covTitleIn');
    if (titleIn) titleIn.onchange = (e) => { pushUndo(); meta.title = e.target.value; renderAll(); };
    const subIn = box.querySelector('#covSubIn');
    if (subIn) subIn.onchange = (e) => { pushUndo(); meta.subtitle = e.target.value; renderAll(); };
    const tText = box.querySelector('#compToggleText');
    if (tText) tText.onclick = () => { pushUndo(); meta.showText = !(meta.showText !== false); renderAll(); };
    const tFw = box.querySelector('#compToggleFw');
    if (tFw) tFw.onclick = () => { pushUndo(); meta.showFireworks = !(meta.showFireworks !== false); renderAll(); };
    box.querySelector('#covBgBtn').onclick = () => openCoverImagePicker('bg');
    const clrBg = box.querySelector('#covBgClr');
    if (clrBg) clrBg.onclick = () => { pushUndo(); meta.bgSrc = null; renderAll(); };
    return;
  }

  // DIVIDER — PAGE MODE
  if (page.kind === 'divider') {
    const d = state.dividerAfter[page.sourcePgId] || { title:'Section Divider', note:'' };
    const divDeleteNotice = getDeleteDividerDestructiveNotice({ title: d.title, note: d.note });
    box.innerHTML = `
      <div class="pointer-events-auto studio-surface rounded-xl p-3.5 w-full space-y-2.5 text-xs">
        <div class="flex justify-between items-center gap-2">
          <div class="flex items-center gap-2">
            <span class="font-bold">Divider Page</span>
            ${renderScopeBadge('local', 'This Page')}
          </div>
          <button id="delDividerBtn" type="button" class="px-3 py-1.5 rounded-md border border-[var(--danger)]/35 bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white font-semibold transition-colors cursor-pointer">Delete Page</button>
        </div>
        ${renderDestructiveNoticeHtml(divDeleteNotice, { compact: true })}
        <input id="divTitleIn" value="${escHtml(d.title)}" class="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] outline-none focus:border-[var(--primary)]" placeholder="Divider Title" />
        <input id="divNoteIn" value="${escHtml(d.note || '')}" class="w-full px-3 py-2 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] outline-none focus:border-[var(--primary)]" placeholder="Optional note…" />
      </div>`;
    box.querySelector('#divTitleIn').onchange = (e) => { pushUndo(); state.dividerAfter[page.sourcePgId].title = e.target.value; renderAll(); };
    box.querySelector('#divNoteIn').onchange = (e) => { pushUndo(); state.dividerAfter[page.sourcePgId].note = e.target.value; renderAll(); };
    box.querySelector('#delDividerBtn').onclick = () => { pushUndo(); delete state.dividerAfter[page.sourcePgId]; state.pageIdx = Math.max(0, state.pageIdx - 1); renderAll(); };
    return;
  }

  if (page.kind !== 'steps') { box.classList.add('hidden'); return; }
  const active = getActiveStepObj();
  if (!active) { box.classList.add('hidden'); return; }
  const { ch, step } = active;
  const ov = state.overrides[step.id] || {};
  const slots = page.slots || [];

  // =========================================================================
  // STEP PAGES — PARTS MODE (Part-Level Controls + Clearly Scoped Split/Move)
  // =========================================================================
  if (state.mode === 'parts') {
    const selCount = state.selectedPartIds.size;
    if (selCount === 0) {
      box.innerHTML = `
        <div class="pointer-events-auto studio-surface rounded-xl px-3.5 py-2.5 w-full space-y-2 text-xs">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-[var(--primary)] shrink-0"></span>
              <span class="font-semibold">Tap parts in the 3D step or Parts Box to nudge, tilt, or split them</span>
            </div>
            ${renderScopeBadge('local', `Step ${step.num}`)}
          </div>
          ${slots.length > 1 ? `
            <div class="flex items-center gap-1 flex-wrap">
              <span class="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mr-0.5">Active</span>
              ${slots.map(sl => `<button type="button" data-parts-slot="${sl.step.id}" class="parts-slot-btn px-2 py-0.5 rounded-md font-semibold cursor-pointer ${sl.step.id === step.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)]'}">Step ${sl.step.num}</button>`).join('')}
            </div>` : ''}
        </div>`;
      box.querySelectorAll('.parts-slot-btn').forEach(b => {
        b.onclick = () => {
          const sid = b.getAttribute('data-parts-slot');
          if (sid && state.selectedStepId !== sid) { state.selectedStepId = sid; state.selectedPartIds.clear(); renderAll(); }
        };
      });
      return;
    }

    const selectedPartIdsArr = Array.from(state.selectedPartIds);
    const firstId = selectedPartIdsArr[0];
    const pOv = ov.partOffsets?.[firstId] || step.defaultPartOffsets?.[firstId] || { x:0, y:0, z:0, tilt:0, arrow:true };
    const studY = Math.round((pOv.y || 0) / 20);
    const studX = Math.round((pOv.x || 0) / 20);
    const studZ = Math.round((pOv.z || 0) / 20);
    const tiltDeg = Math.round(pOv.tilt || 0);
    const partsNotices = getPartsActionDestructiveNotices({
      stepNum: step.num,
      totalPartsInStep: step.parts.length,
      selectedPartIds: selectedPartIdsArr,
      override: ov,
      defaultPartOffsets: step.defaultPartOffsets,
      insertCount: (state.stepInserts[step.id] || []).length,
      existingSubassemblyName: step.subassembly?.name || null,
    });
    const icoArrUp = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5"/><path d="m6 11 6-6 6 6"/></svg>';
    const icoArrDown = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m18 13-6 6-6-6"/></svg>';
    const icoArrLeft = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></svg>';
    const icoArrRight = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>';
    const icoArrFwd = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M17 7 7 17"/><path d="M16 17H7V8"/></svg>';
    const icoArrBack = '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
    const icoTiltL = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="10" width="10" height="7" rx="1.2" transform="rotate(-16 12 13.5)" fill="currentColor" fill-opacity="0.14"/><path d="M6.5 6.5A8 8 0 0 1 16 5"/><path d="M6.5 3.5v3.5H10"/></svg>';
    const icoTiltR = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="10" width="10" height="7" rx="1.2" transform="rotate(16 12 13.5)" fill="currentColor" fill-opacity="0.14"/><path d="M17.5 6.5A8 8 0 0 0 8 5"/><path d="M17.5 3.5v3.5H14"/></svg>';

    box.innerHTML = `
      <div class="pointer-events-auto studio-surface rounded-xl p-3.5 w-full max-h-[46vh] overflow-y-auto space-y-2.5 text-xs">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-bold text-[var(--primary)]">${formatPartCount(selCount)} selected · Step ${step.num}</span>
              ${renderScopeBadge('local', 'Selected Parts')}
            </div>
            <div class="flex items-center gap-1.5">
              <button id="btnToggleArrow" type="button" class="px-2.5 py-1 rounded-md border text-xs font-semibold cursor-pointer ${pOv.arrow !== false ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]' : 'border-[var(--border)] bg-[var(--surface-sunken)]'}">Arrow ${pOv.arrow !== false ? 'On' : 'Off'}</button>
              <button id="btnResetSelPos" type="button" class="px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${partsNotices.resetNotice ? 'border border-[var(--warning)]/35 bg-[var(--warning-soft)] text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white' : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)]'}">Reset</button>
              <button id="btnClearSel" type="button" aria-label="Clear selection" class="w-7 h-7 rounded-md bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)] flex items-center justify-center cursor-pointer">${icoClose}</button>
            </div>
          </div>
          ${renderDestructiveNoticeHtml(partsNotices.resetNotice, { compact: true })}
        </div>

        <!-- Part-Level Placement: Visual 3D Axis Move Pad + Brick Tilt -->
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <div class="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]" title="Move Up / Down">
              <span class="px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">Up/Dn</span>
              <button data-nudge="0,20,0" type="button" class="nudge-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[var(--success)] flex items-center justify-center cursor-pointer" title="Lift Up 1 stud" aria-label="Lift Up">${icoArrUp}</button>
              <button data-nudge="0,-20,0" type="button" class="nudge-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[var(--success)] flex items-center justify-center cursor-pointer" title="Lower 1 stud" aria-label="Lower">${icoArrDown}</button>
              ${studY !== 0 ? `<span class="px-1 font-mono text-[10px] font-bold">${studY > 0 ? `+${studY}` : studY}</span>` : ''}
            </div>
            <div class="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]" title="Move Left / Right">
              <span class="px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">L/R</span>
              <button data-nudge="-20,0,0" type="button" class="nudge-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[var(--primary)] flex items-center justify-center cursor-pointer" title="Move Left 1 stud" aria-label="Left">${icoArrLeft}</button>
              <button data-nudge="20,0,0" type="button" class="nudge-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[var(--primary)] flex items-center justify-center cursor-pointer" title="Move Right 1 stud" aria-label="Right">${icoArrRight}</button>
              ${studX !== 0 ? `<span class="px-1 font-mono text-[10px] font-bold">${studX > 0 ? `+${studX}` : studX}</span>` : ''}
            </div>
            <div class="inline-flex items-center gap-0.5 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]" title="Move Forward / Back">
              <span class="px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--info)]">Depth</span>
              <button data-nudge="0,0,20" type="button" class="nudge-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[var(--info)] flex items-center justify-center cursor-pointer" title="Move Forward 1 stud" aria-label="Forward">${icoArrFwd}</button>
              <button data-nudge="0,0,-20" type="button" class="nudge-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] text-[var(--info)] flex items-center justify-center cursor-pointer" title="Move Back 1 stud" aria-label="Back">${icoArrBack}</button>
              ${studZ !== 0 ? `<span class="px-1 font-mono text-[10px] font-bold">${studZ > 0 ? `+${studZ}` : studZ}</span>` : ''}
            </div>
          </div>
          <div class="inline-flex items-center gap-1 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]" title="Tilt selected part">
            <span class="px-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted-foreground)]">Tilt</span>
            <button data-tilt="-15" type="button" class="tilt-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] flex items-center justify-center cursor-pointer" title="Tilt Left −15°" aria-label="Tilt Left">${icoTiltL}</button>
            <span class="font-mono text-[11px] font-bold min-w-[30px] text-center">${tiltDeg > 0 ? `+${tiltDeg}°` : `${tiltDeg}°`}</span>
            <button data-tilt="15" type="button" class="tilt-btn h-7 w-7 rounded-md bg-[var(--card)] hover:bg-[var(--surface-hover)] flex items-center justify-center cursor-pointer" title="Tilt Right +15°" aria-label="Tilt Right">${icoTiltR}</button>
          </div>
        </div>

        <!-- Cross-Step Reorganization (Explicitly marked as affecting other steps) -->
        <div class="pt-2.5 border-t border-[var(--border)] space-y-2">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Move or Split Selected Parts</span>
            ${renderScopeBadge('range', 'Affects Other Steps')}
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button id="actNewBefore" type="button" class="px-2.5 py-1.5 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold cursor-pointer">New Step Before</button>
            <button id="actNewAfter" type="button" class="px-2.5 py-1.5 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold cursor-pointer">New Step After</button>
            <button id="actMoveStep" type="button" class="px-2.5 py-1.5 rounded-md bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer">Move to Step…</button>
            <button id="actMakeSub" type="button" class="px-2.5 py-1.5 rounded-md bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer">Make Submodel</button>
          </div>
          ${renderDestructiveNoticeHtml(partsNotices.reorgNotice, { compact: true })}
        </div>
      </div>`;

    const nudgeSelected = (dx, dy, dz, dtilt) => {
      pushUndo();
      const curOv = state.overrides[step.id] || {};
      const po = { ...(curOv.partOffsets || {}) };
      for (const id of state.selectedPartIds) {
        const cur = po[id] || step.defaultPartOffsets?.[id] || { x:0, y:0, z:0, tilt:0, arrow:true };
        po[id] = { x: cur.x + dx, y: cur.y + dy, z: cur.z + dz, tilt: cur.tilt + dtilt, arrow: cur.arrow };
      }
      state.overrides[step.id] = { ...curOv, partOffsets: po };
      renderAll();
    };
    box.querySelectorAll('.nudge-btn').forEach(b => {
      b.onclick = () => { const [dx,dy,dz] = b.getAttribute('data-nudge').split(',').map(Number); nudgeSelected(dx,dy,dz,0); };
    });
    box.querySelectorAll('.tilt-btn').forEach(b => {
      b.onclick = () => nudgeSelected(0,0,0, Number(b.getAttribute('data-tilt')));
    });
    box.querySelector('#btnToggleArrow').onclick = () => {
      pushUndo();
      const curOv = state.overrides[step.id] || {};
      const po = { ...(curOv.partOffsets || {}) };
      const nextVal = pOv.arrow === false;
      for (const id of state.selectedPartIds) {
        const cur = po[id] || step.defaultPartOffsets?.[id] || { x:0, y:0, z:0, tilt:0, arrow:true };
        po[id] = { ...cur, arrow: nextVal };
      }
      state.overrides[step.id] = { ...curOv, partOffsets: po };
      renderAll();
    };
    box.querySelector('#btnResetSelPos').onclick = () => {
      pushUndo();
      const curOv = state.overrides[step.id] || {};
      const po = { ...(curOv.partOffsets || {}) };
      for (const id of state.selectedPartIds) {
        if (step.defaultPartOffsets?.[id]) po[id] = { x:0, y:0, z:0, tilt:0, arrow:false };
        else delete po[id];
      }
      state.overrides[step.id] = { ...curOv, partOffsets: po };
      renderAll();
    };
    box.querySelector('#btnClearSel').onclick = () => { state.selectedPartIds.clear(); renderAll(); };

    const splitSelectedToOffset = (deltaIdx) => {
      const moved = step.parts.filter(p => state.selectedPartIds.has(p.id));
      const kept = step.parts.filter(p => !state.selectedPartIds.has(p.id));
      if (moved.length === 0 || kept.length === 0) { showToast('Select a subset of parts in this step to split.'); return; }
      pushUndo();
      step.parts = kept;
      const idx = ch.steps.indexOf(step);
      const newStep = { id: step.id + '_s_' + Date.now().toString(36), num: step.num, side: step.side, corner: step.corner, cue: 'none', parts: moved };
      ch.steps.splice(idx + (deltaIdx < 0 ? 0 : 1), 0, newStep);
      state.selectedStepId = newStep.id;
      state.selectedPartIds.clear();
      showToast(`Moved ${formatPartCount(moved.length)} into a new step.`);
      renderAll();
    };
    box.querySelector('#actNewBefore').onclick = () => splitSelectedToOffset(-1);
    box.querySelector('#actNewAfter').onclick = () => splitSelectedToOffset(1);
    box.querySelector('#actMoveStep').onclick = () => {
      const targetNum = parseInt(prompt(`Move selected parts to which absolute Step # (1–${getAllSteps(state.model).length})? This step is #${getAbsStepNum(step)}.`), 10);
      if (!targetNum) return;
      const all = getAllSteps(state.model);
      const dest = all.find(x => getAbsStepNum(x.step) === targetNum);
      if (!dest || dest.step.id === step.id) { showToast('Pick a different valid step number.'); return; }
      pushUndo();
      const moved = step.parts.filter(p => state.selectedPartIds.has(p.id));
      step.parts = step.parts.filter(p => !state.selectedPartIds.has(p.id));
      dest.step.parts.push(...moved);
      if (step.parts.length === 0) {
        ch.steps.splice(ch.steps.indexOf(step), 1);
        delete state.overrides[step.id];
      }
      state.selectedPartIds.clear();
      showToast(`Moved ${formatPartCount(moved.length)} to ${dest.ch.name ? `${dest.ch.name} ` : ''}Step ${dest.step.num} (#${targetNum}).`);
      renderAll();
    };
    box.querySelector('#actMakeSub').onclick = () => {
      const picked = step.parts.filter(p => state.selectedPartIds.has(p.id));
      if (picked.length === 0) return;
      const name = prompt('Submodel name:', 'Subassembly');
      if (!name) return;
      pushUndo();
      step.subassembly = { name, repeatCount: 1, direction: 'horizontal', asPages: false, buildParts: picked };
      state.selectedPartIds.clear();
      showToast(`Created "${name}" callout on Step ${step.num}.`);
      renderAll();
    };
    return;
  }

  const allStepsList = getAllSteps(state.model);
  const stepIdxInCh = ch.steps.indexOf(step);
  const followingCount = stepIdxInCh >= 0 ? Math.max(0, ch.steps.length - 1 - stepIdxInCh) : 0;
  const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
  const curMfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : 'classic';
  const stepInserts = state.stepInserts[step.id] || [];
  const caps = resolveStepToolbarCapabilities({
    isMinifigBuild: isMfBuild,
    minifigStyle: curMfStyle,
    hasSubassembly: Boolean(step.subassembly),
    override: ov,
    stepInsertCount: stepInserts.length,
    totalStepCount: allStepsList.length,
    followingStepCount: followingCount,
    canMergeWithPrev: stepIdxInCh > 0,
  });

  // =========================================================================
  // STEP PAGES — STEP MODE (Inline Sub-Tabs: Camera | Layout | Notes)
  // =========================================================================
  if (state.mode === 'step') {
    const subTab = state.stepSubTab || 'camera';
    const absNum = getAbsStepNum(step);
    const stepHeaderLeft = slots.length > 1
      ? `<div class="inline-flex items-center gap-0.5 rounded-md bg-[var(--surface-sunken)] p-0.5 text-xs font-bold overflow-x-auto no-scrollbar max-w-full">
          ${slots.map(sl => `<button type="button" data-pick-slot="${sl.step.id}" class="step-slot-pick-btn px-2 py-0.5 rounded-md whitespace-nowrap transition-colors cursor-pointer ${sl.step.id === step.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--surface-hover)]'}">Step ${sl.step.num}</button>`).join('')}
        </div>`
      : `<div class="flex items-center gap-1.5 min-w-0">
          <span class="font-bold truncate">${escHtml(getStepShortLabel(step, ch))}</span>
          ${absNum !== step.num ? `<span class="px-1 py-0.5 rounded border border-[var(--border)] font-mono text-[10px] font-semibold text-[var(--muted-foreground)]" title="Absolute step number">#${absNum}</span>` : ''}
        </div>`;

    const subTabsHtml = `
      <div class="inline-flex items-center gap-0.5 rounded-md bg-[var(--surface-sunken)] p-0.5 text-xs font-semibold shrink-0" role="tablist" aria-label="Step control sections">
        <button type="button" role="tab" aria-selected="${subTab === 'camera'}" data-step-subtab="camera" class="step-subtab-btn px-2.5 py-1 rounded transition-colors cursor-pointer ${subTab === 'camera' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'}">Camera</button>
        <button type="button" role="tab" aria-selected="${subTab === 'layout'}" data-step-subtab="layout" class="step-subtab-btn px-2.5 py-1 rounded transition-colors cursor-pointer ${subTab === 'layout' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'}">Layout</button>
        <button type="button" role="tab" aria-selected="${subTab === 'notes'}" data-step-subtab="notes" class="step-subtab-btn px-2.5 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1 ${subTab === 'notes' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)]'}"><span>Notes</span>${stepInserts.length > 0 ? `<span class="font-mono text-[10px] px-1 rounded ${subTab === 'notes' ? 'bg-white/20' : 'bg-[var(--card)] border border-[var(--border)]'}">${stepInserts.length}</span>` : ''}</button>
      </div>`;

    let bodyHtml = '';

    if (subTab === 'camera') {
      const cam = getStepCamera(step);
      const isMfStep = isMfBuild || Boolean(step.isMinifigPoseStep);
      const mfDefaultCam = step.isMinifigPoseStep
        ? { side: 'top', corner: step.corner || MINIFIG_POSE_CAMERA.corner, az: step.az ?? MINIFIG_POSE_CAMERA.az, el: step.el ?? MINIFIG_POSE_CAMERA.el }
        : MINIFIG_BUILD_CAMERA;
      const isFront34 = isMfStep && Math.abs(cam.az - mfDefaultCam.az) <= 4 && Math.abs(cam.el - mfDefaultCam.el) <= 4;
      const matchedCorner = findMatchingCameraPreset(cam.az);
      const modelScalePct = Math.round((ov.modelScale || 1.0) * 100);
      const fMode = ov.focusMode || 'auto';
      const camResetNotice = caps.hasCustomCameraAny
        ? getStepResetCameraDestructiveNotice({ stepNum: step.num, override: ov })
        : null;

      bodyHtml = `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--primary-soft)] border border-[var(--primary-border)] text-[var(--foreground)] font-extrabold text-xs tracking-tight">
                ${icoOrbit}
                <span>Drag 3D model to orbit</span>
              </span>
              ${renderScopeBadge('local', 'This Step')}
              <span id="stepCamReadout" class="font-mono text-[11px] font-semibold text-[var(--muted-foreground)] tabular-nums">${Math.round(cam.az) % 360}° / ${Math.round(cam.el)}°</span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">View</span>
              <div class="inline-flex rounded-md bg-[var(--surface-sunken)] p-0.5 text-xs font-semibold gap-0.5">
                <button type="button" id="camTop" title="Look down from above" class="px-2 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer ${cam.side === 'top' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--surface-hover)]'}">${buildCameraViewSvg('top')}<span>Top</span></button>
                <button type="button" id="camBot" title="Look up from underneath" class="px-2 py-1 rounded inline-flex items-center gap-1 transition-colors cursor-pointer ${cam.side === 'bottom' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--surface-hover)]'}">${buildCameraViewSvg('bottom')}<span>Bottom</span></button>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mr-0.5">Angle</span>
            ${isMfStep ? `<button type="button" id="btnMfFront34" class="px-2.5 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${isFront34 ? 'bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary)]' : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)]'}"><span>3/4 Pose</span></button>` : ''}
            ${CORNERS.map(c => `<button type="button" data-corner="${c.id}" title="Orbit camera to ${c.label} corner" class="corner-btn px-2 py-1 rounded-md text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer ${!isFront34 && matchedCorner?.id === c.id ? 'bg-[var(--primary-soft)] text-[var(--primary)] ring-1 ring-[var(--primary)]' : 'bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)]'}">${buildCameraViewSvg(c.quadrant)}<span class="font-mono">${c.label}</span></button>`).join('')}
          </div>

          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Zoom</span>
                ${renderZoomStepperHtml({ downId: 'stepCamZoomDown', upId: 'stepCamZoomUp', pct: modelScalePct, downLabel: 'Zoom step model out', upLabel: 'Zoom step model in' })}
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Framing</span>
                <div class="inline-flex rounded-md bg-[var(--surface-sunken)] p-0.5 gap-0.5">
                  ${FOCUS_MODE_OPTIONS.map(opt => `<button type="button" data-step-focus="${opt.id}" title="${escHtml(opt.description)}" class="step-focus-btn px-2 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${fMode === opt.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--surface-hover)]'}">${escHtml(opt.label)}</button>`).join('')}
                </div>
              </div>
            </div>
            ${caps.hasCustomCameraAny ? `<button type="button" id="btnResetCam" class="px-2.5 py-1 rounded-md border border-[var(--warning)]/35 bg-[var(--warning-soft)] text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white text-xs font-semibold transition-colors cursor-pointer">Reset</button>` : ''}
          </div>
          ${renderDestructiveNoticeHtml(camResetNotice, { compact: true })}
        </div>

        ${caps.canApplyAngleToRange ? `
          <div class="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[var(--border)]">
            <div class="flex items-center gap-2 min-w-0">
              ${renderScopeBadge('range', 'Step Range')}
              <span class="text-[11px] text-[var(--muted-foreground)] truncate">Share this camera across steps</span>
            </div>
            <button type="button" id="btnApplyAngleRange" class="px-3 py-1.5 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] text-xs font-semibold shrink-0 cursor-pointer">Apply Camera to Steps…</button>
          </div>` : ''}`;
    } else if (subTab === 'layout') {
      const pliScalePct = Math.round((ov.pliScale || 1.0) * 100);
      const prevStep = stepIdxInCh > 0 ? ch.steps[stepIdxInCh - 1] : null;
      const hasLocalLayout = caps.hasPartsBox || (caps.showSubassemblySettings && !ov.calloutAsPages);
      const sections = [];

      if (hasLocalLayout) {
        sections.push(`
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Step Display</span>
              ${renderScopeBadge('local', 'This Step')}
            </div>
            ${caps.hasPartsBox ? `
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-semibold">Parts Box Size</span>
                <div class="flex items-center gap-1.5">
                  ${renderZoomStepperHtml({ downId: 'stepPliDown', upId: 'stepPliUp', pct: pliScalePct, downLabel: 'Decrease Parts Box size', upLabel: 'Increase Parts Box size' })}
                  ${pliScalePct !== 100 ? `<button type="button" id="stepPliReset" class="px-2 py-1 rounded-md bg-[var(--surface-sunken)] hover:bg-[var(--surface-hover)] text-xs font-semibold cursor-pointer">Reset</button>` : ''}
                </div>
              </div>` : ''}
            ${caps.showSubassemblySettings && !ov.calloutAsPages ? `
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="font-semibold">Callout Position</span>
                <div class="inline-flex rounded-md bg-[var(--surface-sunken)] p-0.5 gap-0.5">
                  <button type="button" id="stepSubHoriz" class="px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${ov.calloutDir !== 'vertical' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--surface-hover)]'}">Side-by-Side</button>
                  <button type="button" id="stepSubVert" class="px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${ov.calloutDir === 'vertical' ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'hover:bg-[var(--surface-hover)]'}">Stacked</button>
                </div>
              </div>` : ''}
          </div>`);
      }

      if (caps.showSubassemblySettings) {
        sections.push(`
          <div class="space-y-1.5">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="font-semibold">${escHtml(step.subassembly.name || 'Subassembly')} Display</span>
              ${renderScopeBadge('range', 'Adds / Removes Pages')}
            </div>
            <div class="grid grid-cols-2 gap-1.5">
              <button type="button" id="stepSubCallout" class="py-1.5 px-2.5 rounded-md border font-semibold transition-colors cursor-pointer ${!ov.calloutAsPages ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}">Inline Callout Box</button>
              <button type="button" id="stepSubPages" class="py-1.5 px-2.5 rounded-md border font-semibold transition-colors cursor-pointer ${ov.calloutAsPages ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}">Separate Full Pages</button>
            </div>
          </div>`);
      }

      if (caps.canMergeWithPrev && prevStep) {
        const mergeNotice = getMergeStepDestructiveNotice({
          stepNum: step.num,
          prevStepNum: prevStep.num,
          override: ov,
          insertCount: stepInserts.length,
          hasSubassembly: Boolean(step.subassembly),
          defaultPartOffsets: step.defaultPartOffsets,
        });
        sections.push(`
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2 min-w-0">
                ${renderScopeBadge('range', 'Affects Prev Step')}
                <span class="text-[11px] text-[var(--muted-foreground)] truncate">Combine parts into Step ${prevStep.num}</span>
              </div>
              <button type="button" id="stepMergePrevBtn" class="px-2.5 py-1.5 rounded-md border border-[var(--warning)]/35 bg-[var(--warning-soft)] text-[var(--warning)] hover:bg-[var(--warning)] hover:text-white font-semibold shrink-0 transition-colors cursor-pointer">Merge into Step ${prevStep.num}</button>
            </div>
            ${renderDestructiveNoticeHtml(mergeNotice, { compact: true })}
          </div>`);
      }

      if (caps.showMinifigSettings) {
        sections.push(`
          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <span class="font-semibold">Minifigure Style</span>
              ${renderScopeBadge('manual', 'All Minifigures')}
            </div>
            <div class="grid grid-cols-3 gap-1.5">
              ${MINIFIG_STYLE_OPTIONS.map(opt => `<button type="button" data-step-mf-style="${opt.id}" title="${escHtml(opt.description)}" class="step-mf-style-btn py-1.5 px-2 rounded-md border font-semibold text-xs transition-colors cursor-pointer ${curMfStyle === opt.id ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}">${escHtml(opt.label)}</button>`).join('')}
            </div>
            <label class="flex items-center justify-between gap-2 cursor-pointer">
              <span class="text-[11px] font-medium text-[var(--muted-foreground)]">1:1 Actual-Size Height Card</span>
              <input id="stepMf1to1Chk" type="checkbox" ${state.showMinifig1to1 ? 'checked' : ''} class="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
            </label>
          </div>`);
      }

      bodyHtml = sections.length > 0
        ? sections.map((sec, idx) => `<div class="${idx > 0 ? 'pt-2.5 border-t border-[var(--border)]' : ''}">${sec}</div>`).join('')
        : `<p class="text-[11px] text-[var(--muted-foreground)]">No additional layout controls for this step.</p>`;
    } else {
      // subTab === 'notes'
      const corners = [
        { id: 'top-left', lbl: 'TL', title: 'Top Left' },
        { id: 'top-right', lbl: 'TR', title: 'Top Right' },
        { id: 'bottom-left', lbl: 'BL', title: 'Bottom Left' },
        { id: 'bottom-right', lbl: 'BR', title: 'Bottom Right' },
      ];
      bodyHtml = `
        <div class="space-y-2">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[11px] text-[var(--muted-foreground)]">Stays attached to Step ${step.num} even if pages reflow. Drag callouts on the step to position.</span>
            ${renderScopeBadge('local', 'This Step')}
          </div>
          <div class="flex items-center gap-1.5">
            <input id="stepNoteInput" type="text" maxlength="160" placeholder="Add a builder note for Step ${step.num}…" class="flex-1 min-w-0 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] outline-none focus:border-[var(--primary)]" />
            <button type="button" id="stepAddNoteBtn" class="px-2.5 py-1.5 rounded-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-foreground)] font-semibold shrink-0 cursor-pointer">+ Note</button>
            <button type="button" id="stepAddImgBtn" class="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] font-semibold shrink-0 cursor-pointer">+ Image</button>
          </div>
          ${stepInserts.length > 0 ? `
            <div class="space-y-1.5 max-h-28 overflow-y-auto pr-0.5">
              ${stepInserts.map(ins => {
                const curCorner = ins.corner || 'bottom-right';
                const insPct = Math.round((ins.scale || 1) * 100);
                return `
                  <div class="flex items-center justify-between gap-2 flex-wrap px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-sunken)]/70">
                    <div class="flex items-center gap-1.5 min-w-0 flex-1">
                      ${ins.kind === 'image'
                        ? `<img src="${ins.src}" alt="Step image" class="w-6 h-6 rounded object-contain border border-[var(--border)] shrink-0 bg-[var(--card)]" />`
                        : `<span class="px-1.5 py-0.5 rounded bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold shrink-0">Note</span>`}
                      <span class="truncate font-medium">${ins.kind === 'text' ? escHtml(ins.text) : `Image (${insPct}%)`}</span>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      ${corners.map(c => `<button type="button" data-ins-corner="${ins.id}:${c.id}" title="${c.title}" class="step-ins-corner px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold cursor-pointer ${curCorner === c.id && typeof ins.x !== 'number' ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}">${c.lbl}</button>`).join('')}
                      <div class="inline-flex items-center gap-0.5 rounded border border-[var(--border)] bg-[var(--card)] px-0.5">
                        <button type="button" data-ins-scale="${ins.id}:down" aria-label="Smaller" class="step-ins-scale w-5 h-5 rounded hover:bg-[var(--surface-hover)] font-bold cursor-pointer">−</button>
                        <span class="font-mono text-[10px] font-bold min-w-[28px] text-center">${insPct}%</span>
                        <button type="button" data-ins-scale="${ins.id}:up" aria-label="Larger" class="step-ins-scale w-5 h-5 rounded hover:bg-[var(--surface-hover)] font-bold cursor-pointer">+</button>
                      </div>
                      <button type="button" data-del-insert="${ins.id}" title="Delete" aria-label="Delete callout" class="step-del-ins w-6 h-6 rounded bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center cursor-pointer">${icoClose}</button>
                    </div>
                  </div>`;
              }).join('')}
            </div>` : ''}
        </div>`;
    }

    box.innerHTML = `
      <div class="pointer-events-auto studio-surface rounded-xl p-3.5 w-full max-h-[46vh] overflow-y-auto space-y-2.5 text-xs">
        <div class="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-[var(--border)]">
          ${stepHeaderLeft}
          ${subTabsHtml}
        </div>
        ${bodyHtml}
      </div>`;

    box.querySelectorAll('.step-slot-pick-btn').forEach(b => {
      b.onclick = () => {
        const sid = b.getAttribute('data-pick-slot');
        if (sid && state.selectedStepId !== sid) {
          state.selectedStepId = sid;
          state.selectedPartIds.clear();
          renderAll();
        }
      };
    });
    box.querySelectorAll('.step-subtab-btn').forEach(b => {
      b.onclick = () => {
        const nextTab = b.getAttribute('data-step-subtab');
        if (nextTab && state.stepSubTab !== nextTab) {
          state.stepSubTab = nextTab;
          renderAll();
        }
      };
    });

    if (subTab === 'camera') {
      const isMfStep = isMfBuild || Boolean(step.isMinifigPoseStep);
      const mfDefaultCam = step.isMinifigPoseStep
        ? { side: 'top', corner: step.corner || MINIFIG_POSE_CAMERA.corner, az: step.az ?? MINIFIG_POSE_CAMERA.az, el: step.el ?? MINIFIG_POSE_CAMERA.el }
        : MINIFIG_BUILD_CAMERA;
      const setCam = (patch) => {
        pushUndo();
        const cur = state.overrides[step.id] || {};
        const curCam = getStepCamera(step);
        const nextSide = patch.side ?? curCam.side ?? 'top';
        const nextCorner = patch.corner ?? cur.corner ?? step.corner ?? 'front_right';
        const cObj = CORNERS.find(c => c.id === nextCorner) || CORNERS[0];
        const nextAz = patch.az ?? (patch.corner !== undefined ? cObj.az : curCam.az);
        const nextEl = patch.el ?? (nextSide === 'bottom' ? -30 : 30);
        const matched = findMatchingCameraPreset(nextAz);
        const nextOv = {
          ...cur,
          side: nextSide,
          az: nextAz,
          el: nextEl,
        };
        if (patch.corner !== undefined) nextOv.corner = nextCorner;
        else if (matched) nextOv.corner = matched.id;
        else delete nextOv.corner;
        state.overrides[step.id] = nextOv;
        renderAll();
      };
      box.querySelector('#camTop').onclick = () => setCam({ side: 'top' });
      box.querySelector('#camBot').onclick = () => setCam({ side: 'bottom' });
      const mf34Btn = box.querySelector('#btnMfFront34');
      if (mf34Btn) {
        mf34Btn.onclick = () => setCam({ side: 'top', corner: mfDefaultCam.corner, az: mfDefaultCam.az, el: mfDefaultCam.el });
      }
      box.querySelectorAll('.corner-btn').forEach(b => { b.onclick = () => setCam({ corner: b.getAttribute('data-corner') }); });
      box.querySelector('#stepCamZoomDown').onclick = () => {
        pushUndo();
        state.overrides[step.id] = { ...(state.overrides[step.id] || {}), modelScale: clampStepModelScale((ov.modelScale || 1) - 0.1) };
        renderAll();
      };
      box.querySelector('#stepCamZoomUp').onclick = () => {
        pushUndo();
        state.overrides[step.id] = { ...(state.overrides[step.id] || {}), modelScale: clampStepModelScale((ov.modelScale || 1) + 0.1) };
        renderAll();
      };
      box.querySelectorAll('.step-focus-btn').forEach(b => {
        b.onclick = () => {
          pushUndo();
          state.overrides[step.id] = { ...(state.overrides[step.id] || {}), focusMode: b.getAttribute('data-step-focus') };
          renderAll();
        };
      });
      const resetCamBtn = box.querySelector('#btnResetCam');
      if (resetCamBtn) {
        resetCamBtn.onclick = () => {
          pushUndo();
          state.overrides[step.id] = clearStepCameraOverride(state.overrides[step.id], true);
          showToast(`Reset camera for Step ${step.num}.`);
          renderAll();
        };
      }
      const applyRangeBtn = box.querySelector('#btnApplyAngleRange');
      if (applyRangeBtn) {
        applyRangeBtn.onclick = () => openApplyAngleModal(step, ch);
      }
    } else if (subTab === 'layout') {
      const pliDown = box.querySelector('#stepPliDown');
      const pliUp = box.querySelector('#stepPliUp');
      const pliReset = box.querySelector('#stepPliReset');
      if (pliDown) pliDown.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, pliScale: Math.max(0.6, Number(((ov.pliScale || 1) - 0.1).toFixed(2))) }; renderAll(); };
      if (pliUp) pliUp.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, pliScale: Math.min(1.6, Number(((ov.pliScale || 1) + 0.1).toFixed(2))) }; renderAll(); };
      if (pliReset) pliReset.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, pliScale: 1 }; renderAll(); };

      const subHoriz = box.querySelector('#stepSubHoriz');
      const subVert = box.querySelector('#stepSubVert');
      if (subHoriz) subHoriz.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, calloutDir: 'horizontal' }; renderAll(); };
      if (subVert) subVert.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, calloutDir: 'vertical' }; renderAll(); };

      const subCallout = box.querySelector('#stepSubCallout');
      const subPages = box.querySelector('#stepSubPages');
      if (subCallout) subCallout.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, calloutAsPages: false }; renderAll(); };
      if (subPages) subPages.onclick = () => { pushUndo(); state.overrides[step.id] = { ...ov, calloutAsPages: true }; renderAll(); };

      const mergeBtn = box.querySelector('#stepMergePrevBtn');
      if (mergeBtn) {
        mergeBtn.onclick = () => {
          const idx = ch.steps.indexOf(step);
          if (idx <= 0) { showToast('No previous step in this section to merge into.'); return; }
          pushUndo();
          ch.steps[idx - 1].parts.push(...step.parts);
          ch.steps.splice(idx, 1);
          delete state.overrides[step.id];
          state.selectedStepId = ch.steps[idx - 1].id;
          state.selectedPartIds.clear();
          showToast(`Merged into Step ${ch.steps[idx - 1].num}.`);
          renderAll();
        };
      }

      box.querySelectorAll('.step-mf-style-btn').forEach(b => {
        b.onclick = () => applyMinifigStyleChange(b.getAttribute('data-step-mf-style'), step.id);
      });
      const mf1to1Chk = box.querySelector('#stepMf1to1Chk');
      if (mf1to1Chk) {
        mf1to1Chk.onchange = (e) => patchActiveTheme({ showMinifig1to1: Boolean(e.target.checked) });
      }
    } else {
      // subTab === 'notes'
      const noteInput = box.querySelector('#stepNoteInput');
      const addNote = () => {
        const txt = (noteInput?.value || '').trim();
        if (!txt) {
          showToast('Enter note text first.');
          noteInput?.focus();
          return;
        }
        pushUndo();
        const arr = state.stepInserts[step.id] || [];
        arr.push({ id: 'ins_' + Date.now().toString(36), kind: 'text', text: txt, corner: 'bottom-right', scale: 1 });
        state.stepInserts[step.id] = arr;
        showToast(`Added note to Step ${step.num}.`);
        renderAll();
      };
      box.querySelector('#stepAddNoteBtn').onclick = addNote;
      if (noteInput) {
        noteInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); addNote(); } };
      }
      box.querySelector('#stepAddImgBtn').onclick = () => document.getElementById('insertImageInput').click();
      box.querySelectorAll('.step-ins-corner').forEach(b => {
        b.onclick = () => {
          const [id, corner] = (b.getAttribute('data-ins-corner') || '').split(':');
          const ins = (state.stepInserts[step.id] || []).find(x => x.id === id);
          if (!ins || !corner) return;
          pushUndo();
          ins.corner = corner;
          delete ins.x;
          delete ins.y;
          renderAll();
        };
      });
      box.querySelectorAll('.step-ins-scale').forEach(b => {
        b.onclick = () => {
          const [id, dir] = (b.getAttribute('data-ins-scale') || '').split(':');
          const ins = (state.stepInserts[step.id] || []).find(x => x.id === id);
          if (!ins) return;
          pushUndo();
          const delta = dir === 'up' ? 0.15 : -0.15;
          ins.scale = Math.max(0.5, Math.min(2.2, Number(((ins.scale || 1) + delta).toFixed(2))));
          renderAll();
        };
      });
      box.querySelectorAll('.step-del-ins').forEach(b => {
        b.onclick = () => {
          const id = b.getAttribute('data-del-insert');
          pushUndo();
          state.stepInserts[step.id] = (state.stepInserts[step.id] || []).filter(x => x.id !== id);
          if (state.stepInserts[step.id].length === 0) delete state.stepInserts[step.id];
          renderAll();
        };
      });
    }
    return;
  }

  // =========================================================================
  // STEP PAGES — PAGE MODE (This Page Flow vs Step Range vs All Pages)
  // =========================================================================
  if (state.mode === 'page') {
    const canAddDiv = canInsertDividerAfterPage(page, state.dividerAfter);
    const activeGroup = page.layoutGroup || null;
    const firstAbs = slots.length > 0 ? getAbsStepNum(slots[0].step) : getAbsStepNum(step);
    const lastAbs = slots.length > 0 ? getAbsStepNum(slots[slots.length - 1].step) : firstAbs;
    const paperSpec = PAPER_FORMAT_SPECS[state.paperFormat] || PAPER_FORMAT_SPECS.screen;
    const orientTxt = paperSpec.supportsOrientation ? (state.orientation === 'portrait' ? 'Portrait' : 'Landscape') : '';
    const gridSummary = describePageLayoutSpec(state.layoutConfig);
    const manualSummary = [paperSpec.shortName, orientTxt, gridSummary].filter(Boolean).join(' · ');

    box.innerHTML = `
      <div class="pointer-events-auto studio-surface rounded-xl p-3.5 w-full max-h-[46vh] overflow-y-auto space-y-2.5 text-xs">
        <div class="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border)]">
          <div class="flex items-center gap-2 min-w-0">
            <span class="font-bold truncate">Page ${page.num} of ${state.pages.length}</span>
            <span class="text-[11px] text-[var(--muted-foreground)] truncate">${escHtml(page.label)}</span>
          </div>
          ${renderScopeBadge('local', 'This Page')}
        </div>

        <!-- Page Breaks & Page Inserts (affects later pages) -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Page Breaks &amp; Dividers</span>
            ${renderScopeBadge('range', 'Affects Later Pages')}
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${slots.map((sl, slIdx) => {
              const pinned = Boolean((state.overrides[sl.step.id] || {}).pin);
              const slLabel = getStepShortLabel(sl.step, sl.ch);
              const tip = getStepBreakTooltip({ stepLabel: slLabel, pinned, slotIndex: slIdx });
              return `<span class="pb-btn-group inline-flex items-stretch rounded-md border transition-colors ${pinned ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'border-[var(--border)] bg-[var(--card)]'}">
                <button type="button" data-page-break-step="${sl.step.id}" title="${escHtml(tip)}" aria-pressed="${pinned ? 'true' : 'false'}" class="page-break-slot-btn pl-2.5 pr-2 py-1.5 rounded-l-[5px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${pinned ? 'hover:bg-[var(--primary-hover)]' : 'hover:bg-[var(--surface-hover)]'}">
                  <svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4"/><path d="M10 12h4"/><path d="M17 12h4"/><path d="M6 4v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4"/><path d="M6 20v-3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>
                  <span>Step ${sl.step.num}: ${pinned ? 'Break On' : 'New Page'}</span>
                </button>
                <button type="button" aria-label="${escHtml(`What is a Page Break? (${slLabel})`)}" aria-expanded="false" data-pb-help-step="${escHtml(slLabel)}" data-pb-help-pinned="${pinned ? '1' : '0'}" class="pb-help-btn page-break-help-btn px-2 py-1.5 rounded-r-[5px] border-l inline-flex items-center justify-center font-bold leading-none transition-colors cursor-pointer ${pinned ? 'pb-help-btn-pinned' : 'pb-help-btn-default'}"><span aria-hidden="true">?</span></button>
              </span>`;
            }).join('')}
            ${canAddDiv ? `
              <button id="pageInsertDividerBtn" type="button" class="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] font-semibold inline-flex items-center gap-1 cursor-pointer">
                <span>+ Divider After</span>
              </button>` : ''}
          </div>
        </div>

        <!-- Step Range Group (affects a custom range of steps/pages) -->
        <div class="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            ${renderScopeBadge('range', 'Step Range')}
            <span class="text-[11px] text-[var(--muted-foreground)] truncate">${activeGroup ? `${escHtml(activeGroup.name)} (#${activeGroup.startStepNum}–#${activeGroup.endStepNum})` : 'Using manual default grid'}</span>
          </div>
          <button id="pageRangeGroupBtn" type="button" class="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] font-semibold shrink-0 cursor-pointer">${activeGroup ? 'Edit Group…' : 'Custom Layout for Page…'}</button>
        </div>

        <!-- Whole-Manual Settings (affects all pages) -->
        <div class="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2 min-w-0 flex-1">
            ${renderScopeBadge('manual', 'All Pages')}
            <span class="font-mono text-[11px] text-[var(--muted-foreground)] truncate">${escHtml(manualSummary)}</span>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <button id="pageOpenSetupBtn" type="button" class="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer">Page Setup…</button>
            <button id="pageOpenStyleBtn" type="button" class="px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] font-semibold cursor-pointer">Style…</button>
          </div>
        </div>
      </div>`;

    box.querySelectorAll('.page-break-slot-btn').forEach(b => {
      b.onclick = () => {
        const sid = b.getAttribute('data-page-break-step');
        const found = slots.find(sl => sl.step.id === sid);
        if (found) toggleStepPageBreak(found.step, { ch: found.ch, followToggledStep: true });
      };
    });
    box.querySelectorAll('.page-break-help-btn').forEach(helpBtn => {
      helpBtn.onclick = (e) => {
        e.stopPropagation();
        togglePageBreakHelpTooltip(helpBtn);
      };
    });
    const divBtn = box.querySelector('#pageInsertDividerBtn');
    if (divBtn) {
      divBtn.onclick = () => {
        if (!canInsertDividerAfterPage(page, state.dividerAfter)) return;
        pushUndo();
        state.dividerAfter[page.id] = { title: 'Next Section', note: '' };
        renderAll();
        showToast('Inserted divider page after current page.');
      };
    }
    box.querySelector('#pageRangeGroupBtn').onclick = () => {
      openPageSetupModal();
      if (activeGroup) openLayoutGroupEditor(activeGroup);
      else openLayoutGroupEditor(null, { start: firstAbs, end: lastAbs });
    };
    box.querySelector('#pageOpenSetupBtn').onclick = () => openPageSetupModal();
    box.querySelector('#pageOpenStyleBtn').onclick = () => setStylePopoverOpen(true);
    return;
  }
}

// =========================================================================
// 8A. APPLY CAMERA TO STEP RANGE MODAL (Dual-Handle Range + 3D Thumbs)
// =========================================================================
const applyAngleState = {
  sourceStep: null,
  sourceCh: null,
  camera: null,
  sourceModelScale: 1.0,
  sourceFocusMode: 'auto',
  includeFraming: false,
  allSteps: [],
  startNum: 1,
  endNum: 1,
  awaitingEndClick: false,
  thumbCache: new Map(),
  renderJobId: 0,
};

function closeApplyAngleModal() {
  applyAngleState.renderJobId++;
  document.getElementById('applyAngleModal')?.classList.add('hidden');
}

function openApplyAngleModal(step, ch) {
  const allSteps = getAllSteps(state.model);
  if (allSteps.length < 2) return;
  const cam = getStepCamera(step);
  const ov = state.overrides[step.id] || {};
  const modelScale = clampStepModelScale(ov.modelScale ?? 1.0);
  const focusMode = ov.focusMode || 'auto';
  const focusLabel = (FOCUS_MODE_OPTIONS.find(o => o.id === focusMode) || FOCUS_MODE_OPTIONS[0]).label;
  // All range values below are ABSOLUTE step numbers (unique across the manual).
  const maxNum = getAbsStepNum(allSteps[allSteps.length - 1].step);
  const srcAbs = getAbsStepNum(step);
  const chMaxNum = ch?.steps?.length ? getAbsStepNum(ch.steps[ch.steps.length - 1]) : maxNum;

  applyAngleState.sourceStep = step;
  applyAngleState.sourceCh = ch;
  applyAngleState.camera = { side: cam.side, corner: cam.corner, az: Math.round(cam.az), el: Math.round(cam.el) };
  applyAngleState.sourceModelScale = modelScale;
  applyAngleState.sourceFocusMode = focusMode;
  applyAngleState.includeFraming = false;
  applyAngleState.allSteps = allSteps;
  applyAngleState.startNum = srcAbs;
  applyAngleState.endNum = Math.min(maxNum, Math.max(srcAbs, chMaxNum || maxNum));
  applyAngleState.awaitingEndClick = false;
  applyAngleState.thumbCache.clear();
  applyAngleState.renderJobId++;

  const sub = document.getElementById('applyAngleSubtitle');
  if (sub) {
    sub.textContent = `Sharing ${ch?.name ? `${ch.name} · ` : ''}${formatDualStepLabel(step, { alwaysShowAbs: true })} camera (${cam.side === 'bottom' ? 'Bottom' : 'Top'} · ${Math.round(cam.az)}° / ${Math.round(cam.el)}°)`;
  }

  const incChk = document.getElementById('applyCameraIncludeFraming');
  const incLbl = document.getElementById('applyCameraIncludeFramingLabel');
  if (incChk) incChk.checked = false;
  if (incLbl) incLbl.textContent = `Also copy Zoom (${Math.round(modelScale * 100)}%) & Framing (${focusLabel})`;

  const minInp = document.getElementById('angleRangeMin');
  const maxInp = document.getElementById('angleRangeMax');
  const firstNum = getAbsStepNum(allSteps[0].step);
  if (minInp && maxInp) {
    minInp.min = String(firstNum);
    minInp.max = String(maxNum);
    maxInp.min = String(firstNum);
    maxInp.max = String(maxNum);
  }

  // Range presets: "This Submodel" only for submodel steps; hide "This Section" when it would be identical.
  const subRange = ch?.kind === 'submodel' ? getChapterAbsRange(ch) : null;
  const secRange = getSectionAbsRange(state.model.chapters, ch);
  const subBtn = document.getElementById('btnAnglePresetSubmodel');
  if (subBtn) {
    subBtn.classList.toggle('hidden', !subRange);
    subBtn.title = subRange ? `${ch.name} · ${formatAbsRange(subRange.lo, subRange.hi)}` : '';
  }
  const secBtn = document.getElementById('btnAnglePresetSection');
  if (secBtn) {
    const sameAsSub = Boolean(subRange && secRange && subRange.lo === secRange.lo && subRange.hi === secRange.hi);
    secBtn.classList.toggle('hidden', !secRange || sameAsSub);
    secBtn.title = secRange ? formatAbsRange(secRange.lo, secRange.hi) : '';
  }

  document.getElementById('applyAngleModal')?.classList.remove('hidden');
  renderApplyAngleModal(true);
}

function syncApplyAngleRangeUI() {
  const allSteps = applyAngleState.allSteps;
  if (!allSteps.length) return;
  const minBound = getAbsStepNum(allSteps[0].step);
  const maxBound = getAbsStepNum(allSteps[allSteps.length - 1].step);
  const lo = Math.min(applyAngleState.startNum, applyAngleState.endNum);
  const hi = Math.max(applyAngleState.startNum, applyAngleState.endNum);

  const minInp = document.getElementById('angleRangeMin');
  const maxInp = document.getElementById('angleRangeMax');
  if (minInp) minInp.value = String(lo);
  if (maxInp) maxInp.value = String(hi);

  const span = Math.max(1, maxBound - minBound);
  const leftPct = ((lo - minBound) / span) * 100;
  const rightPct = ((hi - minBound) / span) * 100;
  const fill = document.getElementById('angleRangeFill');
  if (fill) {
    fill.style.left = `${leftPct.toFixed(2)}%`;
    fill.style.width = `${Math.max(2, rightPct - leftPct).toFixed(2)}%`;
  }

  const startLbl = document.getElementById('angleRangeStartLbl');
  const endLbl = document.getElementById('angleRangeEndLbl');
  const loStep = allSteps.find(({ step }) => getAbsStepNum(step) === lo)?.step;
  const hiStep = allSteps.find(({ step }) => getAbsStepNum(step) === hi)?.step;
  if (startLbl) startLbl.textContent = loStep ? formatDualStepLabel(loStep, { alwaysShowAbs: true }) : `#${lo}`;
  if (endLbl) endLbl.textContent = hiStep ? formatDualStepLabel(hiStep, { alwaysShowAbs: true }) : `#${hi}`;

  const selectedCount = allSteps.filter(({ step }) => getAbsStepNum(step) >= lo && getAbsStepNum(step) <= hi).length;
  const countBadge = document.getElementById('angleRangeCountBadge');
  if (countBadge) countBadge.textContent = `${selectedCount} step${selectedCount === 1 ? '' : 's'}`;

  const confirmBtn = document.getElementById('btnConfirmApplyAngle');
  if (confirmBtn) confirmBtn.textContent = `Apply Camera to ${selectedCount} Step${selectedCount === 1 ? '' : 's'}`;

  const conflictRes = getApplyCameraDestructiveNotice({
    steps: allSteps.map(x => x.step),
    overrides: state.overrides,
    sourceStepId: applyAngleState.sourceStep?.id,
    startNum: lo,
    endNum: hi,
    includeFraming: applyAngleState.includeFraming,
  });
  applyDestructiveNoticeToEl('applyAngleConflictNotice', conflictRes.notice);
  const conflictSet = new Set(conflictRes.affectedStepIds);

  // Update row highlights without recreating thumbnails
  const listEl = document.getElementById('angleStepList');
  if (!listEl) return;
  listEl.querySelectorAll('.angle-step-row').forEach((row) => {
    const num = Number(row.getAttribute('data-step-num'));
    const sid = row.getAttribute('data-step-id');
    const inRange = num >= lo && num <= hi;
    const isEdge = num === lo || num === hi;
    const willOverwrite = Boolean(sid && conflictSet.has(sid));
    const badge = row.querySelector('.angle-edge-badge');
    const ovChip = row.querySelector('.angle-override-chip');
    row.className = `angle-step-row w-full flex items-center gap-3 p-2 rounded-lg border text-left transition-colors cursor-pointer ${
      isEdge
        ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary)]'
        : inRange
          ? 'border-[var(--primary-border)] bg-[var(--primary-soft)]/55'
          : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'
    }`;
    if (ovChip) {
      if (willOverwrite) {
        ovChip.textContent = 'Will overwrite';
        ovChip.className = 'angle-override-chip px-1.5 py-0.5 rounded bg-[var(--warning-soft)] border border-[var(--warning)]/35 text-[10px] font-semibold text-[var(--warning)] shrink-0';
      } else {
        const baseLbl = ovChip.getAttribute('data-base-label') || '';
        ovChip.textContent = baseLbl;
        ovChip.className = baseLbl
          ? 'angle-override-chip px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border)] text-[10px] font-semibold text-[var(--muted-foreground)] shrink-0'
          : 'angle-override-chip hidden';
      }
    }
    if (badge) {
      if (num === lo && num === hi) {
        badge.textContent = 'Start & End';
        badge.className = 'angle-edge-badge px-2 py-0.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold shrink-0';
      } else if (num === lo) {
        badge.textContent = 'Start';
        badge.className = 'angle-edge-badge px-2 py-0.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold shrink-0';
      } else if (num === hi) {
        badge.textContent = 'End';
        badge.className = 'angle-edge-badge px-2 py-0.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold shrink-0';
      } else if (inRange) {
        badge.textContent = 'Included';
        badge.className = 'angle-edge-badge px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--primary-border)] text-[var(--primary)] text-[10px] font-semibold shrink-0';
      } else {
        badge.textContent = '';
        badge.className = 'angle-edge-badge hidden';
      }
    }
  });
}

function renderApplyAngleModal(scrollToSource = false) {
  const listEl = document.getElementById('angleStepList');
  if (!listEl) return;
  const allSteps = applyAngleState.allSteps;
  const srcId = applyAngleState.sourceStep?.id;
  const jobId = ++applyAngleState.renderJobId;

  let prevChId = null;
  listEl.innerHTML = allSteps.map(({ ch, step }) => {
    const isCur = step.id === srcId;
    const stepCam = getStepCamera(step);
    const abs = getAbsStepNum(step);
    const stepOv = state.overrides[step.id];
    const hasAngleOv = !isCur && hasCameraAngleOverride(stepOv);
    const hasFramingOv = !isCur && (hasCameraZoomOverride(stepOv) || hasCameraFramingOverride(stepOv));
    const baseOvLabel = hasAngleOv ? 'Custom cam' : hasFramingOv ? 'Custom zoom' : '';
    const chHeader = ch.id !== prevChId
      ? `<div class="angle-ch-header px-1 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted-foreground)]">${escHtml(ch.name || 'Steps')} · #${abs}–#${getAbsStepNum(ch.steps[ch.steps.length - 1])}</div>`
      : '';
    prevChId = ch.id;
    return `${chHeader}
      <button type="button" data-step-num="${abs}" data-step-id="${step.id}" class="angle-step-row w-full flex items-center gap-3 p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-left transition-colors cursor-pointer">
        <div class="w-14 h-14 rounded-md border border-[var(--border)] bg-[var(--surface-sunken)] shrink-0 overflow-hidden flex items-center justify-center relative">
          <img data-angle-thumb="${step.id}" alt="Step ${step.num} (absolute #${abs}) 3D preview" class="w-full h-full object-contain opacity-0 transition-opacity duration-150" />
          <span data-angle-ph="${step.id}" class="font-mono text-[10px] text-[var(--muted-foreground)] absolute">#${abs}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs">Step ${step.num}</span>
            <span class="px-1 py-0.5 rounded border border-[var(--border)] font-mono text-[10px] font-semibold text-[var(--muted-foreground)]" title="Absolute step number (unique across the whole manual)">#${abs}</span>
            ${isCur ? `<span class="px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border)] text-[10px] font-bold text-[var(--foreground)]">Current</span>` : ''}
            <span data-base-label="${escHtml(baseOvLabel)}" class="angle-override-chip ${baseOvLabel ? 'px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] border border-[var(--border)] text-[10px] font-semibold text-[var(--muted-foreground)] shrink-0' : 'hidden'}">${escHtml(baseOvLabel)}</span>
            <span class="font-mono text-[10px] text-[var(--muted-foreground)]">${formatPartCount(step.parts.length)}</span>
          </div>
          <div class="text-[11px] text-[var(--muted-foreground)] truncate mt-0.5">${escHtml(ch.name)} · ${stepCam.side === 'bottom' ? 'Bottom' : 'Top'} ${Math.round(stepCam.az)}°</div>
        </div>
        <span class="angle-edge-badge hidden"></span>
      </button>`;
  }).join('');

  listEl.querySelectorAll('.angle-step-row').forEach((row) => {
    row.onclick = () => {
      const clickedNum = Number(row.getAttribute('data-step-num'));
      if (!applyAngleState.awaitingEndClick) {
        applyAngleState.startNum = clickedNum;
        applyAngleState.endNum = clickedNum;
        applyAngleState.awaitingEndClick = true;
      } else {
        applyAngleState.endNum = clickedNum;
        applyAngleState.awaitingEndClick = false;
      }
      syncApplyAngleRangeUI();
    };
  });

  syncApplyAngleRangeUI();

  if (scrollToSource && srcId) {
    const curRow = listEl.querySelector(`[data-step-id="${srcId}"]`);
    if (curRow) curRow.scrollIntoView({ block: 'center', behavior: 'instant' });
  }

  // Progressively render 3D square step thumbnails in small batches so UI stays 60fps
  const theme = getActiveTheme();
  let idx = 0;
  const renderBatch = () => {
    if (applyAngleState.renderJobId !== jobId) return;
    const end = Math.min(allSteps.length, idx + 4);
    for (; idx < end; idx++) {
      const { ch, step } = allSteps[idx];
      const imgEl = listEl.querySelector(`[data-angle-thumb="${step.id}"]`);
      const phEl = listEl.querySelector(`[data-angle-ph="${step.id}"]`);
      if (!imgEl) continue;
      let url = applyAngleState.thumbCache.get(step.id);
      if (!url) {
        const prev = getPreviousPartsForStep(state.model, ch, step);
        const c = getStepCamera(step);
        const snap = renderSnapshot(prev, step.parts, c.az, c.el, 112, 112, 1.0, {
          highlightNew: state.highlightNew,
          highlightColor: state.highlightColor,
          fadePrev: state.fadePrev,
          fadeOpacity: state.fadeOpacity,
          showArrows: false,
          accent: theme.accent,
          ov: state.overrides[step.id] || {},
        });
        url = snap.url;
        applyAngleState.thumbCache.set(step.id, url);
      }
      imgEl.src = url;
      imgEl.classList.remove('opacity-0');
      if (phEl) phEl.classList.add('hidden');
    }
    if (idx < allSteps.length) {
      requestAnimationFrame(renderBatch);
    }
  };
  requestAnimationFrame(renderBatch);
}

function getStepShortLabel(step, ch = null) {
  const isMfBuild = Boolean((step.isStandaloneFigure || ch?.kind === 'minifigure') && !step.isMinifigPoseStep);
  if (isMfBuild && step.minifigName) return `Step ${step.num} (${step.minifigName})`;
  return `Step ${step.num}`;
}

const pageBreakHelpState = {
  activeTrigger: null,
  pinned: false,
  hideTimer: 0,
};

function isPageBreakHelpTooltipOpen() {
  const tip = document.getElementById('pageBreakHelpTooltip');
  return Boolean(pageBreakHelpState.activeTrigger && tip && !tip.classList.contains('hidden'));
}

function hidePageBreakHelpTooltip() {
  if (pageBreakHelpState.hideTimer) {
    clearTimeout(pageBreakHelpState.hideTimer);
    pageBreakHelpState.hideTimer = 0;
  }
  const prevTrigger = pageBreakHelpState.activeTrigger;
  if (prevTrigger) {
    prevTrigger.classList.remove('is-help-open');
    prevTrigger.setAttribute('aria-expanded', 'false');
    prevTrigger.removeAttribute('aria-describedby');
  }
  pageBreakHelpState.activeTrigger = null;
  pageBreakHelpState.pinned = false;
  const tip = document.getElementById('pageBreakHelpTooltip');
  if (tip) {
    tip.classList.add('hidden');
    tip.setAttribute('aria-hidden', 'true');
  }
}

function positionPageBreakHelpTooltip(triggerEl) {
  const tip = document.getElementById('pageBreakHelpTooltip');
  if (!tip || !triggerEl) return;
  const anchorRect = triggerEl.getBoundingClientRect();
  if (anchorRect.width === 0 && anchorRect.height === 0) {
    hidePageBreakHelpTooltip();
    return;
  }
  const pos = computeHelpTooltipPosition({
    anchor: anchorRect,
    tooltip: { width: tip.offsetWidth || 260, height: tip.offsetHeight || 72 },
    viewport: { width: window.innerWidth, height: window.innerHeight },
  });
  tip.style.left = `${pos.left}px`;
  tip.style.top = `${pos.top}px`;
  tip.dataset.placement = pos.placement;
  tip.style.setProperty('--pb-arrow-left', `${pos.arrowLeft}px`);
}

function showPageBreakHelpTooltip(triggerEl, opts = {}) {
  const tip = document.getElementById('pageBreakHelpTooltip');
  const textEl = document.getElementById('pageBreakHelpTooltipText');
  if (!tip || !textEl || !triggerEl) return;
  if (pageBreakHelpState.hideTimer) {
    clearTimeout(pageBreakHelpState.hideTimer);
    pageBreakHelpState.hideTimer = 0;
  }
  if (pageBreakHelpState.activeTrigger && pageBreakHelpState.activeTrigger !== triggerEl) {
    pageBreakHelpState.activeTrigger.classList.remove('is-help-open');
    pageBreakHelpState.activeTrigger.setAttribute('aria-expanded', 'false');
    pageBreakHelpState.activeTrigger.removeAttribute('aria-describedby');
  }
  const stepLabel = triggerEl.dataset?.pbHelpStep || '';
  const isPinnedBreak = triggerEl.dataset?.pbHelpPinned === '1';
  textEl.textContent = getPageBreakHelpExplanation({ stepLabel, pinned: isPinnedBreak });

  pageBreakHelpState.activeTrigger = triggerEl;
  pageBreakHelpState.pinned = Boolean(opts.pinned);
  triggerEl.classList.add('is-help-open');
  triggerEl.setAttribute('aria-expanded', 'true');
  triggerEl.setAttribute('aria-describedby', 'pageBreakHelpTooltip');

  tip.classList.remove('hidden');
  tip.setAttribute('aria-hidden', 'false');
  positionPageBreakHelpTooltip(triggerEl);
}

function togglePageBreakHelpTooltip(triggerEl) {
  if (!triggerEl) return;
  if (isPageBreakHelpTooltipOpen() && pageBreakHelpState.activeTrigger === triggerEl && pageBreakHelpState.pinned) {
    hidePageBreakHelpTooltip();
    return;
  }
  showPageBreakHelpTooltip(triggerEl, { pinned: true });
}

function scheduleHidePageBreakHelpTooltip() {
  if (pageBreakHelpState.pinned) return;
  if (pageBreakHelpState.hideTimer) clearTimeout(pageBreakHelpState.hideTimer);
  pageBreakHelpState.hideTimer = window.setTimeout(() => {
    pageBreakHelpState.hideTimer = 0;
    if (!pageBreakHelpState.pinned) hidePageBreakHelpTooltip();
  }, 130);
}

function toggleStepPageBreak(step, opts = {}) {
  if (!step) return;
  hidePageBreakHelpTooltip();
  const { ch = null, followToggledStep = false, refreshOverview = false } = opts;
  const currentPage = state.pages[state.pageIdx];
  const anchorStepId = state.selectedStepId || currentPage?.slots?.[0]?.step?.id || null;
  const prevPageIdx = findPageIndexForStep(state.pages, step.id);
  const prevPage = prevPageIdx >= 0 ? state.pages[prevPageIdx] : null;
  const prevSlotIdx = prevPage?.slots ? prevPage.slots.findIndex(sl => sl.step.id === step.id) : 0;
  const toggledWasSelectedOnCurrentPage = Boolean(
    currentPage?.slots?.some(sl => sl.step.id === step.id) && state.selectedStepId === step.id,
  );

  pushUndo();
  const res = toggleStepPageBreakOverride(state.overrides, step.id);
  state.overrides = res.overrides;
  rebuildPages();

  const targetIdx = findPageIndexForStep(state.pages, step.id);
  if (followToggledStep || toggledWasSelectedOnCurrentPage) {
    if (targetIdx >= 0) state.pageIdx = targetIdx;
    state.selectedStepId = step.id;
  } else if (anchorStepId) {
    const anchorIdx = findPageIndexForStep(state.pages, anchorStepId);
    if (anchorIdx >= 0) state.pageIdx = anchorIdx;
  }

  renderAll();
  const ovModal = document.getElementById('overviewModal');
  if (refreshOverview || (ovModal && !ovModal.classList.contains('hidden'))) {
    renderOverviewModal();
  }

  const targetPg = targetIdx >= 0 ? state.pages[targetIdx] : null;
  const movedToNewPage = res.pinned && prevSlotIdx > 0;
  showToast(getStepBreakFeedbackMessage({
    stepLabel: getStepShortLabel(step, ch),
    pinned: res.pinned,
    movedToNewPage,
    targetPageNum: targetPg?.num ?? null,
  }));
}

function applyMinifigStyleChange(rawStyle, anchorStepId = null) {
  const nextStyle = normalizeMinifigStepStyle(rawStyle);
  const currentStepId = anchorStepId || state.pages[state.pageIdx]?.slots?.[0]?.step?.id || null;
  patchActiveTheme({ minifigStyle: nextStyle }, { render: false });
  rebuildPages();
  if (currentStepId) {
    const idx = state.pages.findIndex(pg => pg.slots?.some(sl => sl.step.id === currentStepId));
    if (idx >= 0) state.pageIdx = idx;
  }
  renderAll();
}

// =========================================================================
// 9. MENU, STYLE POPOVER, PAGE LAYOUT GROUPS & PAGE OVERVIEW OVERLAY SYNC
// =========================================================================
const overviewRangeState = { active: false, startStep: null, endStep: null };
const layoutGroupEditorState = { editingId: null, slotSizes: [] };

function syncLegacyLayoutFlag() {
  const lc = state.layoutConfig;
  if (lc.mode === 'auto') state.layout = 'auto';
  else if (lc.stepsPerPage === 1 && lc.mixedLayout === 'even') state.layout = '1-up';
  else if (lc.stepsPerPage === 2 && lc.mixedLayout === 'even') state.layout = '2-up';
  else if (lc.stepsPerPage === 4 && lc.mixedLayout === 'even' && lc.flow === 'row') state.layout = '4-up';
  else state.layout = 'custom';
}

function renderSlotSizeButtons(containerEl, count, sizesArr, onChange) {
  if (!containerEl) return;
  const n = Math.max(2, Math.min(12, Number(count) || 4));
  const nextLabel = { sm: 'S', md: 'M', lg: 'L' };
  const cycleOrder = { sm: 'md', md: 'lg', lg: 'sm' };
  containerEl.innerHTML = Array.from({ length: n }, (_, i) => {
    const val = sizesArr[i] === 'sm' || sizesArr[i] === 'lg' ? sizesArr[i] : 'md';
    const tone = val === 'lg'
      ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
      : val === 'sm'
        ? 'border-[var(--border)] bg-[var(--card)] opacity-75'
        : 'border-[var(--primary)]/50 bg-[var(--primary-soft)] text-[var(--primary)]';
    return `<button type="button" data-slot-idx="${i}" class="slot-size-chip px-2.5 py-1 rounded-full border text-[11px] font-bold transition ${tone}">#${i + 1} · ${nextLabel[val]}</button>`;
  }).join('');
  containerEl.querySelectorAll('.slot-size-chip').forEach((btn) => {
    btn.onclick = () => {
      const idx = Number(btn.getAttribute('data-slot-idx'));
      const next = Array.from({ length: n }, (_, i) => (sizesArr[i] === 'sm' || sizesArr[i] === 'lg' ? sizesArr[i] : 'md'));
      next[idx] = cycleOrder[next[idx]] || 'md';
      onChange(next);
    };
  });
}

function populateGroupThemeOptions(selectedThemeId = '') {
  const sel = document.getElementById('grpThemeSelect');
  if (!sel) return;
  const allThemes = [...Object.values(BUILT_IN_THEMES), ...customThemes];
  sel.innerHTML = `<option value="">Use Manual Default</option>` +
    allThemes.map((t) => `<option value="${escHtml(t.id)}">${escHtml(t.name)}</option>`).join('');
  sel.value = selectedThemeId || '';
}

function renderPaperFormatPreviewUI() {
  const boxEl = document.getElementById('paperFormatPreview');
  const dimsEl = document.getElementById('paperFormatDimsLabel');
  const ratioEl = document.getElementById('paperFormatRatioLabel');
  const selEl = document.getElementById('paperFormatSelect');
  if (selEl && selEl.value !== state.paperFormat) {
    selEl.value = state.paperFormat;
  }
  const cDiv = state.customUnit === 'cm' ? 2.54 : 1;
  const cWIn = Math.max(2, (Number(state.customWidth) || 10) / cDiv);
  const cHIn = Math.max(2, (Number(state.customHeight) || 8) / cDiv);
  const screenAspect = Math.max(0.62, Math.min(1.68, (window.innerWidth - 24) / Math.max(300, window.innerHeight - 170)));
  const preview = computePaperPreviewBox({
    paperFormat: state.paperFormat,
    orientation: state.orientation,
    customWidthIn: cWIn,
    customHeightIn: cHIn,
    screenAspect,
    maxWidthPx: 82,
    maxHeightPx: 66,
  });
  const activeFmt = PAPER_FORMATS[state.paperFormat] || PAPER_FORMATS.screen;
  if (dimsEl) {
    dimsEl.textContent = state.paperFormat === 'screen'
      ? 'Adapts automatically to your current screen'
      : `${formatPhysicalDims(preview.widthIn, preview.heightIn)}`;
  }
  if (ratioEl) {
    ratioEl.textContent = state.paperFormat === 'screen'
      ? (preview.isLandscape ? 'Screen · Wide' : 'Screen · Tall')
      : `${preview.isLandscape ? 'Landscape' : (Math.abs(preview.widthIn - preview.heightIn) < 0.05 ? 'Square' : 'Portrait')} · ${preview.ratioLabel}`;
  }
  if (boxEl) {
    const shortLbl = activeFmt.shortName || activeFmt.name;
    boxEl.innerHTML = `
      <div class="relative rounded-[4px] border-2 border-[var(--primary)] bg-[var(--card)] shadow-xs flex flex-col items-center justify-center transition-all duration-150 overflow-hidden" style="width:${preview.widthPx}px;height:${preview.heightPx}px">
        <span class="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-[var(--primary)]/60"></span>
        <span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-[var(--primary)]/60"></span>
        <span class="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-[var(--primary)]/60"></span>
        <span class="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-[var(--primary)]/60"></span>
        <span class="font-mono text-[9px] font-bold text-[var(--primary)] leading-tight text-center px-1 truncate max-w-full">${escHtml(shortLbl)}</span>
        ${state.paperFormat !== 'screen' ? `<span class="font-mono text-[8px] text-[var(--muted-foreground)] leading-none mt-0.5">${preview.widthIn.toFixed(1)}×${preview.heightIn.toFixed(1)}"</span>` : ''}
      </div>`;
  }
}

function renderGridPreviewInto(containerEl, spec, maxW = 136, maxH = 92) {
  if (!containerEl) return;
  const cDiv = state.customUnit === 'cm' ? 2.54 : 1;
  const cWIn = Math.max(2, (Number(state.customWidth) || 10) / cDiv);
  const cHIn = Math.max(2, (Number(state.customHeight) || 8) / cDiv);
  const screenAspect = Math.max(0.62, Math.min(1.68, (window.innerWidth - 24) / Math.max(300, window.innerHeight - 170)));
  const pageBox = computePaperPreviewBox({
    paperFormat: state.paperFormat,
    orientation: state.orientation,
    customWidthIn: cWIn,
    customHeightIn: cHIn,
    screenAspect,
    maxWidthPx: maxW,
    maxHeightPx: maxH,
  });
  const padPx = state.density === 'compact' ? 4 : state.density === 'spacious' ? 9 : 6;
  const gapPx = state.density === 'compact' ? 2 : state.density === 'spacious' ? 4 : 3;
  const innerW = Math.max(24, pageBox.widthPx - padPx * 2);
  const innerH = Math.max(20, pageBox.heightPx - padPx * 2 - 6);
  const derivedCap = getSpecStepsPerPageCap(spec);
  const sampleCount = derivedCap === null ? 2 : Math.max(1, Math.min(12, derivedCap));
  const rects = computePageSlotRects(sampleCount, spec, pageBox.isLandscape, innerW, innerH, gapPx);
  const showBorders = state.showStepBorders !== false;
  containerEl.innerHTML = `
    <div class="relative rounded-[5px] border border-[var(--border-strong)] bg-[var(--card)] shadow-xs overflow-hidden transition-all duration-150" style="width:${pageBox.widthPx}px;height:${pageBox.heightPx}px;padding:${padPx}px ${padPx}px ${padPx + 5}px">
      <div class="relative w-full h-full">
        ${rects.map((r, i) => {
          const leftPct = (r.x / innerW) * 100;
          const topPct = (r.y / innerH) * 100;
          const widthPct = (r.w / innerW) * 100;
          const heightPct = (r.h / innerH) * 100;
          const accentFill = r.isFeatured ? 'bg-[var(--primary-soft)] border-[var(--primary)] text-[var(--primary)]' : 'bg-[var(--surface-sunken)] border-[var(--border-strong)] text-[var(--foreground)]';
          const borderCls = showBorders ? 'border' : 'border border-dashed opacity-85';
          return `<div class="absolute rounded-[3px] ${borderCls} ${accentFill} flex items-center justify-center font-mono font-bold" style="left:${leftPct.toFixed(2)}%;top:${topPct.toFixed(2)}%;width:${widthPct.toFixed(2)}%;height:${heightPct.toFixed(2)}%;font-size:${sampleCount > 6 ? 8 : 10}px">${i + 1}</div>`;
        }).join('')}
      </div>
      <div class="absolute bottom-1 right-1.5 font-mono text-[7px] text-[var(--muted-foreground)] leading-none pointer-events-none">${spec.flow === 'column' ? '↓' : '→'}</div>
    </div>`;
}

function readGroupEditorDraftSpec() {
  const colsRaw = document.getElementById('grpColsSelect')?.value || 'auto';
  const rowsRaw = document.getElementById('grpRowsSelect')?.value || 'auto';
  const flow = document.getElementById('grpFlowSelect')?.value === 'column' ? 'column' : 'row';
  const mixedLayout = document.getElementById('grpMixedSelect')?.value || 'even';
  return normalizePageLayoutSpec({
    cols: colsRaw === 'auto' ? 'auto' : parseInt(colsRaw, 10),
    rows: rowsRaw === 'auto' ? 'auto' : parseInt(rowsRaw, 10),
    flow,
    mixedLayout,
    slotSizes: mixedLayout === 'custom_weights' ? [...layoutGroupEditorState.slotSizes] : [],
  });
}

function renderGroupGridPreviewUI() {
  const el = document.getElementById('grpGridPreview');
  if (!el) return;
  renderGridPreviewInto(el, readGroupEditorDraftSpec(), 128, 78);
}

function renderLayoutGroupsList() {
  const listEl = document.getElementById('layoutGroupsList');
  if (!listEl) return;
  if (!state.layoutGroups || state.layoutGroups.length === 0) {
    listEl.innerHTML = `<div class="text-[11px] text-[var(--muted-foreground)] px-2.5 py-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)]/60">No step groups yet. Create one to customize layout or theme for a range of steps.</div>`;
    return;
  }
  listEl.innerHTML = state.layoutGroups.map((grp) => {
    const themeObj = grp.themeId ? resolveThemeById(grp.themeId, customThemes) : null;
    const summary = describePageLayoutSpec(grp.layout);
    const rangeLabel = formatAbsRange(grp.startStepNum, grp.endStepNum);
    const rangeDetail = describeAbsStepRange(grp.startStepNum, grp.endStepNum);
    return `
      <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)]">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="font-bold text-xs truncate">${escHtml(grp.name)}</span>
            <span class="px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[10px] font-bold font-mono" title="Absolute step range">${escHtml(rangeLabel)}</span>
            ${themeObj ? `<span class="px-1.5 py-0.5 rounded-full border border-[var(--border)] bg-[var(--card)] text-[10px] font-semibold">${escHtml(themeObj.name)}</span>` : ''}
          </div>
          <div class="text-[10px] text-[var(--muted-foreground)] mt-0.5">${escHtml(summary)}${rangeDetail ? ` · ${escHtml(rangeDetail)}` : ''}</div>
        </div>
        <button type="button" data-edit-grp="${escHtml(grp.id)}" class="grp-edit-btn px-2.5 py-1 rounded-full border border-[var(--border)] bg-[var(--card)] text-[11px] font-semibold hover:border-[var(--primary)] shrink-0 transition cursor-pointer">Edit</button>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.grp-edit-btn').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-edit-grp');
      const grp = state.layoutGroups.find((g) => g.id === id);
      if (grp) openLayoutGroupEditor(grp);
    };
  });
}

/** Finds a step by its absolute step number (unique across the manual). */
function findStepByAbsNum(absNum) {
  return getAllSteps(state.model).find(({ step }) => getAbsStepNum(step) === absNum) || null;
}

/** Human-readable mapping of an absolute range to chapter + printed step numbers. */
function describeAbsStepRange(lo, hi) {
  if (!state.model) return '';
  const a = findStepByAbsNum(Math.min(lo, hi));
  const b = findStepByAbsNum(Math.max(lo, hi));
  const fmt = (x) => (x ? `${x.ch.name ? `${x.ch.name} ` : ''}Step ${x.step.num}` : 'out of range');
  if (lo === hi) return fmt(a);
  if (a && b && a.ch.id === b.ch.id) return `${a.ch.name ? `${a.ch.name} ` : ''}Steps ${a.step.num}–${b.step.num}`;
  return `${fmt(a)} → ${fmt(b)}`;
}

function syncGroupEditorDestructiveNotices() {
  const s = parseInt(document.getElementById('grpStartStepInput')?.value, 10) || 1;
  const e = parseInt(document.getElementById('grpEndStepInput')?.value, 10) || s;
  const existing = layoutGroupEditorState.editingId
    ? state.layoutGroups.find((g) => g.id === layoutGroupEditorState.editingId)
    : null;
  const themeName = existing?.themeId ? resolveThemeById(existing.themeId, customThemes)?.name || null : null;
  const notices = getLayoutGroupDestructiveNotices({
    editingId: layoutGroupEditorState.editingId,
    editingGroupThemeName: themeName,
    startStepNum: s,
    endStepNum: e,
    existingGroups: state.layoutGroups,
  });
  applyDestructiveNoticeToEl('grpOverlapNotice', notices.overlapNotice);
  applyDestructiveNoticeToEl('grpDeleteNotice', notices.deleteNotice);
}

function syncGroupRangeHintUI() {
  const hint = document.getElementById('grpRangeHint');
  if (!hint) return;
  const s = parseInt(document.getElementById('grpStartStepInput')?.value, 10) || 1;
  const e = parseInt(document.getElementById('grpEndStepInput')?.value, 10) || s;
  hint.textContent = `${formatAbsRange(s, e)} = ${describeAbsStepRange(s, e)}`;
  syncGroupEditorDestructiveNotices();
}

function openLayoutGroupEditor(existingGroup = null, prefillRange = null) {
  const wrap = document.getElementById('layoutGroupEditor');
  if (!wrap) return;
  const allSteps = getAllSteps(state.model);
  const maxStep = Math.max(1, allSteps.length);
  const curPage = state.pages[state.pageIdx];
  const curSlots = curPage?.slots || [];
  const defaultStart = prefillRange?.start ?? (curSlots[0]?.step ? getAbsStepNum(curSlots[0].step) : 1);
  const defaultEnd = prefillRange?.end ?? (curSlots[curSlots.length - 1]?.step ? getAbsStepNum(curSlots[curSlots.length - 1].step) : Math.min(maxStep, defaultStart + 3));

  layoutGroupEditorState.editingId = existingGroup?.id || null;
  layoutGroupEditorState.slotSizes = existingGroup?.layout?.slotSizes ? [...existingGroup.layout.slotSizes] : [];

  document.getElementById('grpEditorTitle').textContent = existingGroup ? `Edit "${existingGroup.name}"` : 'New Step Range Group';
  document.getElementById('grpNameInput').value = existingGroup ? existingGroup.name : `Steps ${formatAbsRange(defaultStart, defaultEnd)}`;
  document.getElementById('grpStartStepInput').value = String(existingGroup ? existingGroup.startStepNum : defaultStart);
  document.getElementById('grpEndStepInput').value = String(existingGroup ? existingGroup.endStepNum : defaultEnd);
  for (const id of ['grpStartStepInput', 'grpEndStepInput']) {
    const inp = document.getElementById(id);
    if (inp) { inp.max = String(maxStep); inp.oninput = syncGroupRangeHintUI; }
  }
  syncGroupRangeHintUI();
  document.getElementById('grpColsSelect').value = existingGroup ? String(existingGroup.layout.cols) : 'auto';
  document.getElementById('grpRowsSelect').value = existingGroup ? String(existingGroup.layout.rows) : 'auto';
  document.getElementById('grpFlowSelect').value = existingGroup ? existingGroup.layout.flow : 'row';
  document.getElementById('grpMixedSelect').value = existingGroup ? existingGroup.layout.mixedLayout : 'even';
  populateGroupThemeOptions(existingGroup?.themeId || '');
  document.getElementById('btnGrpDelete').classList.toggle('hidden', !existingGroup);
  syncGroupEditorSlotSizesUI();
  renderGroupGridPreviewUI();
  wrap.classList.remove('hidden');
  wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeLayoutGroupEditor() {
  layoutGroupEditorState.editingId = null;
  applyDestructiveNoticeToEl('grpOverlapNotice', null);
  applyDestructiveNoticeToEl('grpDeleteNotice', null);
  const wrap = document.getElementById('layoutGroupEditor');
  if (wrap) wrap.classList.add('hidden');
}

function syncGroupEditorSlotSizesUI() {
  const mixed = document.getElementById('grpMixedSelect')?.value || 'even';
  const wrap = document.getElementById('grpSlotSizesWrap');
  const list = document.getElementById('grpSlotSizesList');
  if (!wrap || !list) return;
  wrap.classList.toggle('hidden', mixed !== 'custom_weights');
  if (mixed === 'custom_weights') {
    const count = Math.max(2, Math.min(12, getSpecStepsPerPageCap(readGroupEditorDraftSpec()) ?? 4));
    renderSlotSizeButtons(list, count, layoutGroupEditorState.slotSizes, (next) => {
      layoutGroupEditorState.slotSizes = next;
      syncGroupEditorSlotSizesUI();
    });
  }
  renderGroupGridPreviewUI();
}

function syncPageLayoutControlsUI() {
  const lc = state.layoutConfig;
  const derivedCap = getSpecStepsPerPageCap(lc);
  const chip = document.getElementById('layoutSummaryChip');
  if (chip) chip.textContent = describePageLayoutSpec(lc);

  // Render live default grid preview & explanatory text
  renderGridPreviewInto(document.getElementById('layoutGridPreview'), lc, 138, 94);
  const gridTitle = document.getElementById('layoutGridPreviewTitle');
  const gridDesc = document.getElementById('layoutGridPreviewDesc');
  if (gridTitle && gridDesc) {
    if (derivedCap === null) {
      gridTitle.textContent = 'Smart Auto Grid';
      gridDesc.textContent = 'Automatically chooses 1–2 steps per page based on each step’s complexity and your paper orientation. Page breaks always start a new page.';
    } else {
      const flowTxt = lc.flow === 'column' ? 'top-to-bottom columns' : 'left-to-right rows';
      const mixedTxt = lc.mixedLayout === 'hero_left' ? 'with Step 1 featured large on the left'
        : lc.mixedLayout === 'hero_top' ? 'with Step 1 featured wide across the top'
        : lc.mixedLayout === 'hero_right' ? 'with the final step featured large on the right'
        : lc.mixedLayout === 'custom_weights' ? 'using custom S / M / L slot sizes'
        : 'in evenly sized step cells';
      gridTitle.textContent = `Up to ${derivedCap} Step${derivedCap === 1 ? '' : 's'} per Page · ${describePageLayoutSpec(lc)}`;
      gridDesc.textContent = `Fills ${flowTxt}, ${mixedTxt}. Page breaks end a page early.`;
    }
  }

  const colsSel = document.getElementById('layoutColsSelect');
  if (colsSel) colsSel.value = String(lc.cols);
  const rowsSel = document.getElementById('layoutRowsSelect');
  if (rowsSel) rowsSel.value = String(lc.rows);

  document.querySelectorAll('.step-flow-btn').forEach((b) => {
    const act = b.getAttribute('data-step-flow') === lc.flow;
    b.className = `step-flow-btn py-2 px-3 rounded-md border font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}`;
  });

  document.querySelectorAll('.mixed-layout-btn').forEach((b) => {
    const act = b.getAttribute('data-mixed-layout') === lc.mixedLayout;
    b.className = `mixed-layout-btn py-2 px-2 rounded-md border font-semibold text-xs flex flex-col items-center gap-1 transition cursor-pointer ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}`;
  });

  const defWrap = document.getElementById('defaultSlotSizesWrap');
  const defList = document.getElementById('defaultSlotSizesList');
  if (defWrap && defList) {
    defWrap.classList.toggle('hidden', lc.mixedLayout !== 'custom_weights');
    if (lc.mixedLayout === 'custom_weights') {
      const slotCount = Math.max(2, Math.min(12, derivedCap ?? 4));
      renderSlotSizeButtons(defList, slotCount, lc.slotSizes || [], (next) => {
        state.layoutConfig = { ...state.layoutConfig, slotSizes: next };
        renderAll();
      });
    }
  }

  renderLayoutGroupsList();
}

function syncMenuControls() {
  const hasModel = Boolean(state.model);
  const hasParsedModel = Boolean(state.model?._parsed);
  const currentPage = state.pages[state.pageIdx] || null;
  const diagCount = Array.isArray(state.diagnostics) ? state.diagnostics.length : 0;
  const vis = computeMenuVisibility({
    hasModel,
    hasParsedModel,
    pageCount: state.pages.length,
    canInsertDividerAfterCurrentPage: canInsertDividerAfterPage(currentPage, state.dividerAfter),
    diagnosticCount: diagCount,
    savedLibraryCount: userLibRaw.size,
    hasMissingPartsToFetch: hasModel ? hasMissingPartsToFetch() : false,
    isFetchingLibrary: fetchPartsInFlight,
  });

  const setVisible = (id, show) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('hidden', !show);
  };

  setVisible('menuModelCard', vis.showModelCard);
  setVisible('menuCloseModelBtn', vis.showCloseModel);
  applyDestructiveNoticeToEl(
    'menuCloseModelNotice',
    vis.showCloseModel
      ? getCloseModelDestructiveNotice({
          modelTitle: state.model?.title,
          editsSummary: getCurrentManualEditsSummary(),
        })
      : null,
  );
  setVisible('menuSaveProj', vis.showExportProject);
  setVisible('menuErrorsBtn', vis.showModelIssues);
  setVisible('menuPagePrintSection', vis.showPagePrintSection);
  setVisible('menuPageSetupBtn', vis.showPageSetup);
  setVisible('menuBomSetupBtn', vis.showBomSetup);
  setVisible('menuPrintBtn', vis.showPrintPdf);
  setVisible('menuExportHtmlBtn', vis.showPrintPdf);
  setVisible('bomSetupJumpBtn', vis.showBomSetup);
  setVisible('menuFetchLibWrap', vis.showFetchLibrary);
  setVisible('menuClearLibBtn', vis.showClearLibrary);
  setVisible('menuAutoGenSection', vis.showAutoGenerateSection);
  setVisible('menuStepGenBtn', vis.showAutoGenerateSection);
  setVisible('menuPageInsertsSection', vis.showPageInsertsSection);
  setVisible('menuAddDivider', vis.showInsertDivider);

  const stepGenSum = document.getElementById('menuStepGenSummary');
  if (stepGenSum) {
    const plan = state.model?._subdivisionPlan;
    const baseText = plan?.sections?.length
      ? `${plan.sections.length} Sections`
      : (state.detectDuplicates ? 'Auto · Dupes On' : 'Single Build');
    stepGenSum.textContent = state.wordlessMode ? `${baseText} · Wordless` : baseText;
  }

  const activeFmt = PAPER_FORMATS[state.paperFormat] || PAPER_FORMATS.screen;
  document.getElementById('customSizeWrap').classList.toggle('hidden', state.paperFormat !== 'custom');
  document.getElementById('orientationWrap').classList.toggle('hidden', !activeFmt.supportsOrientation);
  const wInEl = document.getElementById('customWidthIn'), hInEl = document.getElementById('customHeightIn');
  if (wInEl && document.activeElement !== wInEl) wInEl.value = String(Number(state.customWidth.toFixed(2)));
  if (hInEl && document.activeElement !== hInEl) hInEl.value = String(Number(state.customHeight.toFixed(2)));
  document.querySelectorAll('.unit-btn').forEach(b => {
    const act = b.getAttribute('data-unit') === state.customUnit;
    b.className = `unit-btn px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${act ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)]'}`;
  });
  const cDiv = state.customUnit === 'cm' ? 2.54 : 1;
  const cWIn = Math.max(2, (Number(state.customWidth) || 10) / cDiv);
  const cHIn = Math.max(2, (Number(state.customHeight) || 8) / cDiv);
  const equivEl = document.getElementById('customUnitEquiv');
  if (equivEl) {
    equivEl.textContent = state.customUnit === 'in'
      ? `= ${(cWIn * 2.54).toFixed(1)} × ${(cHIn * 2.54).toFixed(1)} cm`
      : `= ${cWIn.toFixed(2)} × ${cHIn.toFixed(2)} in`;
  }
  const [actWIn, actHIn] = getActivePagePhysicalInches();
  const menuPageSum = document.getElementById('menuPageSetupSummary');
  if (menuPageSum) {
    const orientShort = activeFmt.supportsOrientation
      ? ` · ${state.orientation === 'portrait' ? 'Portrait' : 'Landscape'}`
      : state.paperFormat === 'custom'
        ? ` · ${state.customWidth}×${state.customHeight} ${state.customUnit}`
        : '';
    menuPageSum.textContent = `${activeFmt.shortName || activeFmt.name}${orientShort}`;
  }
  const pageSetupSub = document.getElementById('pageSetupSubtitle');
  if (pageSetupSub) {
    pageSetupSub.textContent = state.paperFormat === 'screen'
      ? 'Adapts to current screen · Change paper size, grids & step groups'
      : `${activeFmt.shortName || activeFmt.name} · ${formatPhysicalDims(actWIn, actHIn)}`;
  }
  renderPaperFormatPreviewUI();
  document.querySelectorAll('.orient-btn').forEach(b => {
    const act = b.getAttribute('data-orient') === state.orientation;
    b.className = `orient-btn py-2.5 px-3 rounded-lg border font-semibold flex items-center justify-center gap-2.5 transition cursor-pointer ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}`;
  });
  syncPageLayoutControlsUI();
  document.querySelectorAll('.dens-btn').forEach(b => {
    const act = b.getAttribute('data-density') === state.density;
    b.className = `dens-btn py-2.5 px-2 rounded-lg border font-semibold flex flex-col items-center gap-1.5 transition cursor-pointer ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]'}`;
  });
  const effPgFmt = state.wordlessMode && state.pageNumberFormat === 'page_n' ? 'number' : state.pageNumberFormat;
  document.querySelectorAll('.pgnum-btn').forEach(b => {
    const fmt = b.getAttribute('data-pgnum');
    const disabled = Boolean(state.wordlessMode && fmt === 'page_n');
    const act = !disabled && fmt === effPgFmt;
    b.disabled = disabled;
    b.title = disabled ? 'Wordless mode hides the word "Page" on printed pages' : '';
    b.className = `pgnum-btn py-2.5 px-1.5 rounded-lg border font-semibold flex flex-col items-center gap-1 transition ${
      disabled
        ? 'border-[var(--border)] bg-[var(--surface-sunken)] opacity-45 cursor-not-allowed'
        : act
          ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)] cursor-pointer'
          : 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)] cursor-pointer'
    }`;
  });
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
  setChk('toggleWordlessMode', state.wordlessMode);
  setChk('toggleStepBorders', state.showStepBorders);
  setChk('toggleStepBordersSetup', state.showStepBorders);
  setChk('togglePageTitle', state.showPageTitle);
  setChk('togglePageTitleSetup', state.showPageTitle);
  const covShowText = normalizeCoverMeta(state.coverMeta, !state.wordlessMode).showText !== false;
  const compShowText = state.completeMeta.showText !== false;
  setChk('toggleCoverText', covShowText);
  setChk('toggleCompleteText', compShowText);
  setChk('toggleCompleteFireworks', state.completeMeta.showFireworks !== false);
  setChk('toggleBomTextFields', state.bomShowTextFields);
  applyDestructiveNoticeToEl(
    'wordlessToggleNotice',
    getWordlessToggleDestructiveNotice({
      currentWordless: Boolean(state.wordlessMode),
      coverShowText: covShowText,
      completeShowText: compShowText,
      bomShowTextFields: Boolean(state.bomShowTextFields),
      pageNumberFormat: state.pageNumberFormat,
    }),
  );
  setChk('toggleExtras', state.showExtras);
  setChk('toggleDetectDuplicates', state.detectDuplicates);
  setChk('toggleMinifig1to1', state.showMinifig1to1);
  const curMfStyleGlobal = normalizeMinifigStepStyle(state.minifigStyle);
  document.querySelectorAll('.mf-style-btn').forEach(b => {
    const act = b.getAttribute('data-mf-style') === curMfStyleGlobal;
    b.className = `mf-style-btn py-1.5 px-2 rounded-md border font-semibold text-xs transition ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--surface-sunken)]'}`;
  });

  syncBomSetupUI();

  document.querySelectorAll('.fade-chip').forEach(b => {
    const act = Math.abs(parseFloat(b.getAttribute('data-fade')) - state.fadeOpacity) < 0.05;
    b.className = `fade-chip py-1 rounded-md border font-semibold transition ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });

  syncStylePanel();
}

let overviewThumbObserver = null;
let overviewThumbQueue = [];
let overviewThumbRafId = 0;
let overviewThumbRenderJobId = 0;
const overviewThumbTasks = new WeakMap();

function isOverviewModalOpen() {
  const modal = document.getElementById('overviewModal');
  return Boolean(modal && !modal.classList.contains('hidden'));
}

function stopOverviewThumbQueue() {
  overviewThumbRenderJobId++;
  overviewThumbQueue = [];
  if (overviewThumbRafId) {
    cancelAnimationFrame(overviewThumbRafId);
    overviewThumbRafId = 0;
  }
  if (overviewThumbObserver) {
    overviewThumbObserver.disconnect();
    overviewThumbObserver = null;
  }
}

function closeOverviewModal() {
  hidePageBreakHelpTooltip();
  stopOverviewThumbQueue();
  document.getElementById('overviewModal')?.classList.add('hidden');
}

function renderOverviewThumbTask(task) {
  if (task.kind === 'bom_grid') {
    const imgs = task.bomImgs || [];
    const entries = task.bomEntries || [];
    let anyLoaded = false;
    for (let i = 0; i < imgs.length && i < entries.length; i++) {
      const url = getPliThumb(entries[i].part);
      if (url) {
        imgs[i].src = url;
        imgs[i].classList.remove('opacity-0');
        anyLoaded = true;
      }
    }
    if (anyLoaded && task.phEl) task.phEl.classList.add('hidden');
    return;
  }

  let url = overviewThumbCache.get(task.cacheKey);
  if (!url) {
    if (task.kind === 'step') {
      const { ch, step, minifigSeqSlice, cam, ov, modelScale, effectivePartOffsets, isMfSeq, accent, width, height } = task;
      let prev = [];
      let next = step.parts || [];
      let snapOpts = {
        highlightNew: state.highlightNew,
        highlightColor: state.highlightColor,
        fadePrev: state.fadePrev,
        fadeOpacity: state.fadeOpacity,
        showArrows: false,
        accent,
        ov,
        partOffsets: effectivePartOffsets,
      };
      if (isMfSeq && minifigSeqSlice) {
        const seqPlan = getMinifigSequentialPlanForStep(step);
        const stageIdx = Math.max(0, Math.min(seqPlan.stages.length - 1, minifigSeqSlice.end - 1));
        const stage = seqPlan.stages[stageIdx];
        if (stage) {
          prev = stage.baseParts || [];
          next = stage.addedParts || [];
          snapOpts = {
            ...snapOpts,
            partOffsets: stage.partOffsets || {},
          };
        }
      } else {
        prev = getPreviousPartsForStep(state.model, ch, step);
        const mfPrep = step.isMinifigPoseStep ? step.minifigPrep : null;
        if (mfPrep) {
          snapOpts = {
            ...snapOpts,
            minifigIndicators: mfPrep.indicators || [],
            ghostParts: mfPrep.ghostParts || [],
            highlightOnlyPartIds: new Set(mfPrep.rotatedPartIds || []),
          };
        }
      }
      if (prev.length === 0 && next.length === 0) return;
      const snap = renderSnapshot(prev, next, cam.az, cam.el, width, height, modelScale, snapOpts);
      url = snap.url;
    } else if (task.kind === 'page_3d') {
      if (!task.parts || task.parts.length === 0) return;
      const snap = renderSnapshot([], task.parts, task.az, task.el, task.width, task.height, 1.0, {
        highlightNew: false,
        fadePrev: false,
        showArrows: false,
        tightFit: Boolean(task.tightFit),
        heroShading: Boolean(task.heroShading),
        accent: task.accent,
      });
      url = snap.url;
    }
    if (url) overviewThumbCache.set(task.cacheKey, url);
  }

  if (url && task.imgEl) {
    task.imgEl.src = url;
    task.imgEl.classList.remove('opacity-0');
    if (task.phEl) task.phEl.classList.add('hidden');
  }
}

function flushOverviewThumbQueue(jobId) {
  overviewThumbRafId = 0;
  if (jobId !== overviewThumbRenderJobId || !isOverviewModalOpen()) {
    overviewThumbQueue = [];
    return;
  }
  const listEl = document.getElementById('overviewList');
  const listRect = listEl ? listEl.getBoundingClientRect() : null;
  const budget = 3;
  let rendered = 0;
  while (overviewThumbQueue.length > 0 && rendered < budget) {
    let pickIdx = 0;
    if (listRect && listRect.height > 0 && overviewThumbQueue.length > 1) {
      const visIdx = overviewThumbQueue.findIndex((t) => {
        if (!t.targetEl?.isConnected) return false;
        const r = t.targetEl.getBoundingClientRect();
        return r.bottom >= listRect.top - 180 && r.top <= listRect.bottom + 180;
      });
      if (visIdx >= 0) pickIdx = visIdx;
    }
    const task = overviewThumbQueue.splice(pickIdx, 1)[0];
    if (!task || !task.targetEl?.isConnected || task.done) continue;
    task.done = true;
    try {
      renderOverviewThumbTask(task);
    } catch (_) {}
    rendered++;
  }
  if (overviewThumbQueue.length > 0 && jobId === overviewThumbRenderJobId) {
    overviewThumbRafId = requestAnimationFrame(() => flushOverviewThumbQueue(jobId));
  }
}

function enqueueOverviewThumbTask(task, jobId) {
  if (!task || task.done || jobId !== overviewThumbRenderJobId) return;
  if (task.cacheKey) {
    const cached = overviewThumbCache.get(task.cacheKey);
    if (cached && task.imgEl) {
      task.done = true;
      task.imgEl.src = cached;
      task.imgEl.classList.remove('opacity-0');
      if (task.phEl) task.phEl.classList.add('hidden');
      return;
    }
  }
  overviewThumbQueue.push(task);
  if (!overviewThumbRafId) {
    overviewThumbRafId = requestAnimationFrame(() => flushOverviewThumbQueue(jobId));
  }
}

function observeOverviewThumbs(targets, scrollRoot, jobId) {
  if (!targets.length || jobId !== overviewThumbRenderJobId) return;
  if (typeof IntersectionObserver !== 'undefined') {
    overviewThumbObserver = new IntersectionObserver((entries) => {
      if (jobId !== overviewThumbRenderJobId) return;
      for (const entry of entries) {
        if (entry.isIntersecting) {
          overviewThumbObserver?.unobserve(entry.target);
          const task = overviewThumbTasks.get(entry.target);
          if (task) enqueueOverviewThumbTask(task, jobId);
        }
      }
    }, { root: scrollRoot || null, rootMargin: '180px 0px' });
    for (const el of targets) overviewThumbObserver.observe(el);
  } else {
    for (const el of targets) {
      const task = overviewThumbTasks.get(el);
      if (task) enqueueOverviewThumbTask(task, jobId);
    }
  }
}

let bomFieldDragIdx = -1;

function buildBomAlignIconSvg(flowAxis, horizontalDir, verticalDir, align) {
  // 4x2 grid (rows mode) or 2x4 grid (columns mode) showing 1 full track + 2-item partial track
  const isCols = flowAxis === 'columns';
  const cols = isCols ? 2 : 4;
  const rows = isCols ? 4 : 2;
  const demoItems = [1, 2, 3, 4, 5, 6];
  const demoSpans = demoItems.map(() => ({ colSpan: 1, rowSpan: 1 }));
  const cells = packBomGridPages(demoItems, demoSpans, cols, rows, {
    flowAxis,
    horizontalDir,
    verticalDir,
    align,
  })[0] || [];

  const w = 36, h = 20, pad = 2, gap = 1.6;
  const cw = (w - pad * 2 - gap * (cols - 1)) / cols;
  const ch = (h - pad * 2 - gap * (rows - 1)) / rows;
  const rects = cells.map((c, idx) => {
    const x = pad + c.col * (cw + gap);
    const y = pad + c.row * (ch + gap);
    const isHanging = idx >= 4;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${ch.toFixed(1)}" rx="1" fill="currentColor" fill-opacity="${isHanging ? '0.68' : '0.22'}" stroke="currentColor" stroke-width="0.9" stroke-opacity="${isHanging ? '0.95' : '0.45'}"/>`;
  }).join('');
  return `<svg class="w-9 h-5" viewBox="0 0 ${w} ${h}" fill="none" aria-hidden="true"><rect x="0.6" y="0.6" width="${w - 1.2}" height="${h - 1.2}" rx="2" stroke="currentColor" stroke-width="1" opacity="0.32"/>${rects}</svg>`;
}

const BOM_FIELD_ICONS = {
  image: '<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  qty: '<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/></svg>',
  name: '<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>',
  partId: '<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9v6M11 9v6M15 9v6M17 9v6"/></svg>',
  color: '<svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
};

function renderBomFieldsList(bc) {
  const listEl = document.getElementById('bomFieldsList');
  if (!listEl) return;
  const fields = bc.fields || [];
  const showTextFields = Boolean(state.bomShowTextFields);
  const enabledCount = fields.filter(f => f.enabled).length;
  const sig = `${fields.map(f => `${f.id}:${f.enabled ? 1 : 0}`).join('|')}::txt=${showTextFields ? 1 : 0}`;
  if (listEl.dataset.sig === sig && listEl.children.length === fields.length) return;
  listEl.dataset.sig = sig;
  listEl.innerHTML = '';

  fields.forEach((f, idx) => {
    const meta = BOM_FIELD_META[f.id] || { label: f.id, sample: '' };
    const isTextField = f.id === 'name' || f.id === 'color';
    const hiddenByWordless = isTextField && !showTextFields;
    const effEnabled = f.enabled && !hiddenByWordless;
    const row = document.createElement('div');
    row.setAttribute('role', 'listitem');
    row.draggable = true;
    row.dataset.fieldIdx = String(idx);
    row.dataset.fieldId = f.id;
    row.className = `bom-field-row flex items-center gap-2 px-2.5 py-2 rounded-lg border select-none ${
      effEnabled
        ? 'border-[var(--border)] bg-[var(--card)]'
        : 'border-[var(--border)]/60 bg-[var(--surface-sunken)]/60 opacity-65'
    }`;

    const sampleBadge = hiddenByWordless
      ? '<span class="px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Wordless</span>'
      : f.id === 'color'
        ? '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] text-[10px] font-medium text-[var(--muted-foreground)]"><span class="w-2 h-2 rounded-full bg-[#c91a09] inline-block border border-black/20"></span>Red</span>'
        : `<span class="px-1.5 py-0.5 rounded bg-[var(--surface-sunken)] text-[10px] ${f.id === 'partId' ? 'font-mono' : f.id === 'qty' ? 'font-extrabold' : 'font-medium'} text-[var(--muted-foreground)]">${escHtml(meta.sample)}</span>`;

    const isLastEnabled = effEnabled && enabledCount <= 1;
    row.innerHTML = `
      <span class="bom-field-handle touch-none cursor-grab active:cursor-grabbing text-[var(--muted-foreground)] hover:text-[var(--foreground)] px-0.5 py-1" title="Drag to reorder" aria-hidden="true">
        <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>
      </span>
      <input type="checkbox" ${effEnabled ? 'checked' : ''} ${isLastEnabled ? 'disabled title="At least one field must stay enabled"' : ''} aria-label="Show ${escHtml(meta.label)}" class="bom-field-chk w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0 disabled:opacity-50" />
      <span class="text-[var(--muted-foreground)] inline-flex shrink-0">${BOM_FIELD_ICONS[f.id] || ''}</span>
      <span class="font-semibold flex-1 min-w-0 truncate">${escHtml(meta.label)}</span>
      ${sampleBadge}
      <div class="inline-flex items-center gap-0.5 shrink-0">
        <button type="button" class="bom-field-up w-6 h-6 rounded hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" ${idx === 0 ? 'disabled' : ''} aria-label="Move ${escHtml(meta.label)} up" title="Move up">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button type="button" class="bom-field-down w-6 h-6 rounded hover:bg-[var(--surface-hover)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" ${idx === fields.length - 1 ? 'disabled' : ''} aria-label="Move ${escHtml(meta.label)} down" title="Move down">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>`;

    const chk = row.querySelector('.bom-field-chk');
    chk.onchange = (e) => {
      if (isTextField && e.target.checked && !state.bomShowTextFields) {
        if (state.model) pushUndo();
        state.bomShowTextFields = true;
        overviewThumbCache.bumpEpoch();
      }
      const nextFields = toggleBomField(normalizeBomConfig(state.bomConfig).fields, f.id, e.target.checked);
      patchBomConfig({ fields: nextFields }, { immediate: true });
    };
    const upBtn = row.querySelector('.bom-field-up');
    upBtn.onclick = () => {
      if (idx <= 0) return;
      const nextFields = reorderBomFields(normalizeBomConfig(state.bomConfig).fields, idx, idx - 1);
      patchBomConfig({ fields: nextFields }, { immediate: true });
    };
    const downBtn = row.querySelector('.bom-field-down');
    downBtn.onclick = () => {
      if (idx >= fields.length - 1) return;
      const nextFields = reorderBomFields(normalizeBomConfig(state.bomConfig).fields, idx, idx + 1);
      patchBomConfig({ fields: nextFields }, { immediate: true });
    };

    // Touch/Pen pointer-drag on grip handle (iOS/Android support)
    const handleEl = row.querySelector('.bom-field-handle');
    if (handleEl) {
      handleEl.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        e.preventDefault();
        const pid = e.pointerId;
        handleEl.setPointerCapture?.(pid);
        row.classList.add('is-dragging');
        let targetIdx = idx;

        const clearIndicators = () => {
          listEl.querySelectorAll('.bom-field-row').forEach((el) => {
            el.classList.remove('is-drag-over-above', 'is-drag-over-below');
          });
        };
        const onMove = (ev) => {
          if (ev.pointerId !== pid) return;
          clearIndicators();
          const rows = Array.from(listEl.querySelectorAll('.bom-field-row'));
          let best = idx;
          for (let ri = 0; ri < rows.length; ri++) {
            const r = rows[ri].getBoundingClientRect();
            if (ev.clientY >= r.top && ev.clientY <= r.bottom) {
              const after = ev.clientY >= r.top + r.height / 2;
              rows[ri].classList.toggle('is-drag-over-above', !after);
              rows[ri].classList.toggle('is-drag-over-below', after);
              let to = after ? ri + 1 : ri;
              if (idx < to) to -= 1;
              best = Math.max(0, Math.min(rows.length - 1, to));
              break;
            }
          }
          targetIdx = best;
        };
        const onFinish = (ev) => {
          if (ev.pointerId !== pid) return;
          handleEl.removeEventListener('pointermove', onMove);
          handleEl.removeEventListener('pointerup', onFinish);
          handleEl.removeEventListener('pointercancel', onFinish);
          row.classList.remove('is-dragging');
          clearIndicators();
          if (targetIdx !== idx) {
            const nextFields = reorderBomFields(normalizeBomConfig(state.bomConfig).fields, idx, targetIdx);
            patchBomConfig({ fields: nextFields }, { immediate: true });
          }
        };
        handleEl.addEventListener('pointermove', onMove);
        handleEl.addEventListener('pointerup', onFinish);
        handleEl.addEventListener('pointercancel', onFinish);
      });
    }

    // HTML5 Drag & Drop reordering (desktop)
    row.addEventListener('dragstart', (e) => {
      bomFieldDragIdx = idx;
      row.classList.add('is-dragging');
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(idx));
      }
    });
    row.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (bomFieldDragIdx < 0 || bomFieldDragIdx === idx) return;
      const rect = row.getBoundingClientRect();
      const above = e.clientY < rect.top + rect.height / 2;
      row.classList.toggle('is-drag-over-above', above);
      row.classList.toggle('is-drag-over-below', !above);
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    });
    row.addEventListener('dragleave', () => {
      row.classList.remove('is-drag-over-above', 'is-drag-over-below');
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      row.classList.remove('is-drag-over-above', 'is-drag-over-below');
      const from = bomFieldDragIdx >= 0 ? bomFieldDragIdx : parseInt(e.dataTransfer?.getData('text/plain') || '-1', 10);
      bomFieldDragIdx = -1;
      if (from < 0 || from === idx) return;
      const rect = row.getBoundingClientRect();
      const dropAfter = e.clientY >= rect.top + rect.height / 2;
      let to = dropAfter ? idx + 1 : idx;
      if (from < to) to -= 1;
      to = Math.max(0, Math.min(fields.length - 1, to));
      if (from === to) return;
      const nextFields = reorderBomFields(normalizeBomConfig(state.bomConfig).fields, from, to);
      patchBomConfig({ fields: nextFields }, { immediate: true });
    });
    row.addEventListener('dragend', () => {
      bomFieldDragIdx = -1;
      row.classList.remove('is-dragging');
      listEl.querySelectorAll('.bom-field-row').forEach((el) => {
        el.classList.remove('is-drag-over-above', 'is-drag-over-below');
      });
    });

    listEl.appendChild(row);
  });
}

function renderBomSetupPreview(bc) {
  const previewEl = document.getElementById('bomLayoutPreview');
  const anatomyEl = document.getElementById('bomCellAnatomyPreview');
  const captionEl = document.getElementById('bomPreviewCaption');
  const metricsEl = document.getElementById('bomLiveMetrics');
  if (!previewEl || !anatomyEl) return;

  const theme = getActiveTheme();
  const { dims, contentWidthIn, contentHeightIn } = getBomUsableAreaInches();
  const isCompactViewport = typeof window !== 'undefined' && window.innerWidth < 460;
  const cDiv = state.customUnit === 'cm' ? 2.54 : 1;
  const cWIn = Math.max(2, (Number(state.customWidth) || 10) / cDiv);
  const cHIn = Math.max(2, (Number(state.customHeight) || 8) / cDiv);
  const screenAspect = dims.widthIn / Math.max(0.01, dims.heightIn);
  const box = computePaperPreviewBox({
    paperFormat: state.paperFormat,
    orientation: state.orientation,
    customWidthIn: cWIn,
    customHeightIn: cHIn,
    screenAspect,
    maxWidthPx: isCompactViewport ? 142 : 176,
    maxHeightPx: isCompactViewport ? 104 : 118,
  });
  const enabledFields = getEnabledBomFields(bc);
  const bomPages = state.pages.filter(p => p.kind === 'bom');
  const firstBom = bomPages[0];

  if (bc.format === 'table') {
    const rowsPerPage = firstBom?.bomTableRowsPerPage || (bc.tableRowsMode === 'custom' ? bc.tableRowsPerPage : 18);
    const visRows = Math.min(8, Math.max(4, Math.round(rowsPerPage / 3)));
    const tCols = computeBomTableColumns(enabledFields, Math.max(40, box.widthPx - 14), 14);
    if (captionEl) captionEl.textContent = `Table · ${enabledFields.length} column${enabledFields.length === 1 ? '' : 's'} · ${rowsPerPage} rows/page`;
    if (metricsEl) {
      metricsEl.textContent = bomPages.length > 0
        ? `${rowsPerPage} rows/pg · ${bomPages.length} pg`
        : `${rowsPerPage} rows/pg`;
    }

    const headCols = tCols.map(c => {
      const lbl = state.wordlessMode ? (c.id === 'image' ? '▪' : getBomTableHeaderText(c.id, true)) : c.label;
      return `<div class="truncate font-bold ${state.wordlessMode ? '' : 'uppercase'}" style="width:${(c.widthFrac * 100).toFixed(1)}%;font-size:6px;text-align:${c.align};padding:0 2px">${escHtml(lbl)}</div>`;
    }).join('');
    const rowHtml = Array.from({ length: visRows }, (_, ri) => {
      const cells = tCols.map(c => {
        if (c.id === 'image') return `<div class="flex items-center justify-center" style="width:${(c.widthFrac * 100).toFixed(1)}%"><span class="inline-block w-2.5 h-2 rounded-[1px]" style="background:${theme.accent};opacity:0.75"></span></div>`;
        if (c.id === 'qty') return `<div class="font-mono font-bold text-right" style="width:${(c.widthFrac * 100).toFixed(1)}%;font-size:6px;padding:0 2px">${(ri + 1) * 2}×</div>`;
        if (c.id === 'color') return `<div class="flex items-center gap-0.5" style="width:${(c.widthFrac * 100).toFixed(1)}%;padding:0 2px"><span class="w-1.5 h-1.5 rounded-full shrink-0" style="background:${ri % 2 === 0 ? '#c91a09' : '#0055bf'}"></span><span class="h-1 flex-1 rounded-full" style="background:${theme.muted};opacity:0.45"></span></div>`;
        return `<div class="flex items-center" style="width:${(c.widthFrac * 100).toFixed(1)}%;padding:0 2px"><span class="h-1 rounded-full" style="width:${c.id === 'partId' ? '65%' : '82%'};background:${c.id === 'partId' ? theme.muted : theme.text};opacity:${c.id === 'partId' ? 0.55 : 0.45}"></span></div>`;
      }).join('');
      return `<div class="flex items-center flex-1 border-b" style="border-color:${theme.pliBorder};opacity:0.9;background:${ri % 2 === 1 ? 'rgba(127,127,127,0.08)' : 'transparent'}">${cells}</div>`;
    }).join('');

    previewEl.innerHTML = `<div class="rounded-md border shadow-xs flex flex-col overflow-hidden" style="width:${box.widthPx}px;height:${box.heightPx}px;padding:6px;border-color:${theme.pliBorder};color:${theme.text}">
      <div class="shrink-0 flex items-center justify-between pb-1 mb-1 border-b" style="border-color:${theme.pliBorder};font-size:7px;font-weight:800"><span>Parts List</span><span style="color:${theme.muted};font-size:6px">Table</span></div>
      <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div class="shrink-0 flex items-center py-0.5 border-b" style="background:${theme.pliBg};border-color:${theme.pliBorder};color:${theme.muted}">${headCols}</div>
        <div class="flex-1 min-h-0 flex flex-col">${rowHtml}</div>
      </div>
    </div>`;
    applyThemeBackgroundToElement(previewEl.firstElementChild, theme);
    applyThemeFontsToElement(previewEl.firstElementChild, theme);

    // Sample row anatomy
    const sampleRowCells = enabledFields.map((id) => {
      if (id === 'image') return '<span class="px-1.5 py-0.5 rounded bg-[#c91a09]/15 text-[#c91a09] font-bold text-[10px]">🧱</span>';
      if (id === 'qty') return '<span class="font-extrabold text-[11px]">4×</span>';
      if (id === 'name') return '<span class="font-medium text-[10px] truncate">Brick 2×4</span>';
      if (id === 'partId') return '<span class="font-mono text-[10px] text-[var(--muted-foreground)]">3001</span>';
      return '<span class="inline-flex items-center gap-1 text-[10px]"><span class="w-2 h-2 rounded-full bg-[#c91a09] inline-block"></span>Red</span>';
    }).join('<span class="text-[var(--border-strong)]">│</span>');
    anatomyEl.innerHTML = `<div class="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-1">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Row Column Order</div>
      <div class="flex flex-wrap items-center gap-1 py-1 px-1.5 rounded border border-[var(--border)] bg-[var(--surface-sunken)]">${sampleRowCells}</div>
      <div class="text-[10px] text-[var(--muted-foreground)] leading-snug">Left-to-right column sequence.</div>
    </div>`;
  } else {
    const actualCols = firstBom?.bomCols || (bc.gridMode === 'custom' ? bc.customCols : 6);
    const actualRows = firstBom?.bomRows || (bc.gridMode === 'custom' ? bc.customRows : 5);
    const cellWIn = firstBom?.bomCellWidthIn || (contentWidthIn / Math.max(1, actualCols));
    const cellHIn = firstBom?.bomCellHeightIn || (contentHeightIn / Math.max(1, actualRows));
    const hLabel = bc.horizontalDir === 'rtl' ? 'R → L' : 'L → R';
    const vLabel = bc.verticalDir === 'btt' ? 'Bottom → Top' : 'Top → Bottom';
    if (captionEl) captionEl.textContent = `${bc.flowAxis === 'columns' ? 'Columns' : 'Rows'} · ${hLabel} · ${vLabel}`;
    if (metricsEl) {
      const modeTag = bc.gridMode === 'auto' ? 'Auto ' : '';
      metricsEl.textContent = `${modeTag}${actualCols}×${actualRows} · ${cellWIn.toFixed(2)}"×${cellHIn.toFixed(2)}"`;
    }

    // Miniature page diagram with readable numbered cells demonstrating exact direction, alignment & variable sizing
    const prevCols = Math.min(6, Math.max(3, Math.min(actualCols, dims.isLandscape ? 5 : 4)));
    const prevRows = Math.min(5, Math.max(2, Math.min(actualRows, dims.isLandscape ? 3 : 4)));
    let demoItems, demoSpans;
    if (bc.variableSizing) {
      demoSpans = [
        { colSpan: Math.min(2, prevCols), rowSpan: Math.min(2, prevRows) },
        { colSpan: Math.min(2, prevCols), rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: Math.min(2, prevRows) },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
        { colSpan: 1, rowSpan: 1 },
      ];
      demoItems = demoSpans.map((_, i) => i + 1);
    } else {
      // Leave 2 cells open on the final track so hanging alignment is immediately visible!
      const totalSlots = prevCols * prevRows;
      const demoCount = Math.max(2, totalSlots - Math.min(2, Math.max(1, (bc.flowAxis === 'columns' ? prevRows : prevCols) - 1)));
      demoItems = Array.from({ length: demoCount }, (_, i) => i + 1);
      demoSpans = demoItems.map(() => ({ colSpan: 1, rowSpan: 1 }));
    }
    const demoCells = packBomGridPages(demoItems, demoSpans, prevCols, prevRows, {
      flowAxis: bc.flowAxis,
      horizontalDir: bc.horizontalDir,
      verticalDir: bc.verticalDir,
      align: bc.align,
    })[0] || [];

    const cellsHtml = demoCells.map((c, idx) => {
      const isFirst = idx === 0;
      const isSpan = c.colSpan > 1 || c.rowSpan > 1;
      const bg = isFirst ? theme.accent : (isSpan ? theme.pliBg : 'rgba(127,127,127,0.12)');
      const fg = isFirst ? '#ffffff' : theme.text;
      const label = isSpan ? `${c.item} (${c.colSpan}×${c.rowSpan})` : String(c.item);
      return `<div class="absolute flex items-center justify-center rounded-[2px] border font-mono font-bold leading-none overflow-hidden" style="left:calc(${(c.xFrac * 100).toFixed(2)}% + 1px);top:calc(${(c.yFrac * 100).toFixed(2)}% + 1px);width:calc(${(c.wFrac * 100).toFixed(2)}% - 2px);height:calc(${(c.hFrac * 100).toFixed(2)}% - 2px);background:${bg};color:${fg};border-color:${isFirst ? theme.accent : theme.pliBorder};font-size:${isSpan ? '6.5px' : '7.5px'}">${label}</div>`;
    }).join('');

    previewEl.innerHTML = `<div class="rounded-md border shadow-xs flex flex-col overflow-hidden" style="width:${box.widthPx}px;height:${box.heightPx}px;padding:6px;border-color:${theme.pliBorder};color:${theme.text}">
      <div class="shrink-0 flex items-center justify-between pb-1 mb-1 border-b" style="border-color:${theme.pliBorder};font-size:7px;font-weight:800"><span>Parts List</span><span class="font-mono" style="color:${theme.muted};font-size:6.5px">${actualCols}×${actualRows}</span></div>
      <div class="relative flex-1 min-h-0 w-full">${cellsHtml}</div>
    </div>`;
    applyThemeBackgroundToElement(previewEl.firstElementChild, theme);
    applyThemeFontsToElement(previewEl.firstElementChild, theme);

    // Sample Grid cell anatomy showing exact field order
    const cellLines = enabledFields.map((id) => {
      if (id === 'image') {
        return `<div class="w-full h-8 rounded flex items-center justify-center border border-dashed" style="border-color:${theme.pliBorder};background:${theme.pliBg}">
          <svg class="w-5 h-5 text-[#c91a09]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 9l8-4 8 4v7l-8 4-8-4V9z" opacity="0.9"/><path d="M12 5l8 4-8 4-8-4 8-4z" fill="#ef4444"/></svg>
        </div>`;
      }
      if (id === 'qty') return `<div class="font-extrabold text-[11px] leading-tight" style="color:${theme.text}">4×</div>`;
      if (id === 'name') return `<div class="font-medium text-[10px] leading-tight truncate w-full" style="color:${theme.text}">Brick 2×4</div>`;
      if (id === 'partId') return `<div class="font-mono text-[9.5px] leading-tight" style="color:${theme.muted}">3001</div>`;
      return `<div class="inline-flex items-center justify-center gap-1 text-[9.5px] leading-tight" style="color:${theme.muted}"><span class="w-2 h-2 rounded-full bg-[#c91a09] inline-block border border-black/20"></span>Red</div>`;
    }).join('');
    anatomyEl.innerHTML = `<div class="p-2 rounded-lg border border-[var(--border)] bg-[var(--card)] space-y-1">
      <div class="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Grid Cell Format</div>
      <div id="bomSampleCellInner" class="rounded-md border p-1.5 flex flex-col items-center text-center gap-0.5" style="border-color:${theme.pliBorder}">${cellLines}</div>
    </div>`;
    const sampleInner = anatomyEl.querySelector('#bomSampleCellInner');
    if (sampleInner) {
      applyThemeBackgroundToElement(sampleInner, theme);
      applyThemeFontsToElement(sampleInner, theme);
    }
  }
}

function syncBomSetupUI() {
  const bc = normalizeBomConfig(state.bomConfig);
  const theme = getActiveTheme();
  const isBuiltIn = Boolean(theme.builtIn || BUILT_IN_THEME_IDS.has(theme.id));

  const activeCls = 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]';
  const idleCls = 'border-[var(--border)] bg-[var(--card)] hover:bg-[var(--surface-hover)]';

  // Theme ownership banner
  const themeNameEl = document.getElementById('bomThemeName');
  if (themeNameEl) themeNameEl.textContent = theme.name;
  const themeSwatchEl = document.getElementById('bomThemeSwatch');
  if (themeSwatchEl) themeSwatchEl.style.background = theme.bg || theme.bgColor;
  document.getElementById('bomThemeBuiltInNote')?.classList.toggle('hidden', !isBuiltIn);

  // Format buttons
  document.querySelectorAll('.bom-format-btn').forEach(b => {
    const act = b.getAttribute('data-bom-format') === bc.format;
    b.className = `bom-format-btn p-2.5 rounded-lg border font-semibold flex items-center gap-3 text-left transition cursor-pointer ${act ? activeCls : idleCls}`;
  });
  document.getElementById('bomGridSettingsWrap')?.classList.toggle('hidden', bc.format === 'table');
  document.getElementById('bomTableSettingsWrap')?.classList.toggle('hidden', bc.format !== 'table');

  // Grid mode (Auto vs Custom)
  document.querySelectorAll('.bom-gridmode-btn').forEach(b => {
    const act = b.getAttribute('data-bom-grid-mode') === bc.gridMode;
    b.className = `bom-gridmode-btn p-2.5 rounded-lg border font-semibold flex items-center gap-2.5 text-left transition cursor-pointer ${act ? activeCls : idleCls}`;
  });
  document.getElementById('bomAutoSizeWrap')?.classList.toggle('hidden', bc.gridMode !== 'auto');
  document.getElementById('bomCustomSizeWrap')?.classList.toggle('hidden', bc.gridMode !== 'custom');

  // Auto min cell size controls
  const minSlider = document.getElementById('bomMinCellSlider');
  if (minSlider && Math.abs(parseFloat(minSlider.value) - bc.minCellSizeIn) > 0.005) {
    minSlider.value = String(bc.minCellSizeIn);
  }
  const minReadout = document.getElementById('bomMinCellReadout');
  if (minReadout) {
    minReadout.textContent = `${bc.minCellSizeIn.toFixed(2)} in · ${(bc.minCellSizeIn * 25.4).toFixed(1)} mm`;
  }
  document.querySelectorAll('.bom-minsize-btn').forEach(b => {
    const v = parseFloat(b.getAttribute('data-bom-minsize'));
    const act = Math.abs(v - bc.minCellSizeIn) < 0.03;
    b.className = `bom-minsize-btn py-2 px-1.5 rounded-md border font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${act ? activeCls : idleCls}`;
  });

  // Custom cols × rows controls
  const colsEl = document.getElementById('bomCustomCols');
  if (colsEl && document.activeElement !== colsEl) colsEl.value = String(bc.customCols);
  const rowsEl = document.getElementById('bomCustomRows');
  if (rowsEl && document.activeElement !== rowsEl) rowsEl.value = String(bc.customRows);
  document.querySelectorAll('.bom-preset-btn').forEach(b => {
    const [pc, pr] = String(b.getAttribute('data-bom-preset') || '').split('x').map(Number);
    const act = pc === bc.customCols && pr === bc.customRows;
    b.className = `bom-preset-btn px-2 py-1 rounded border font-mono text-[11px] font-semibold transition cursor-pointer ${act ? activeCls : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]'}`;
  });
  const customHint = document.getElementById('bomCustomCellHint');
  if (customHint) {
    const { contentWidthIn, contentHeightIn } = getBomUsableAreaInches();
    const cw = contentWidthIn / Math.max(1, bc.customCols);
    const ch = contentHeightIn / Math.max(1, bc.customRows);
    customHint.textContent = `${bc.customCols * bc.customRows} cells/page · ${cw.toFixed(2)}" × ${ch.toFixed(2)}" (${(cw * 25.4).toFixed(0)} × ${(ch * 25.4).toFixed(0)} mm) per 1×1 cell`;
  }

  // Variable Part Sizing buttons
  document.querySelectorAll('.bom-varsize-btn').forEach(b => {
    const wantVar = b.getAttribute('data-bom-varsize') === 'variable';
    const act = wantVar === Boolean(bc.variableSizing);
    b.className = `bom-varsize-btn p-2.5 rounded-lg border font-semibold flex items-center gap-2.5 text-left transition cursor-pointer ${act ? activeCls : idleCls}`;
  });

  // Fill order, Horizontal, Vertical buttons
  document.querySelectorAll('.bom-flowaxis-btn').forEach(b => {
    const act = b.getAttribute('data-bom-flow-axis') === bc.flowAxis;
    b.className = `bom-flowaxis-btn p-2.5 rounded-lg border font-semibold flex items-center gap-2.5 text-left transition cursor-pointer ${act ? activeCls : idleCls}`;
  });
  document.querySelectorAll('.bom-hdir-btn').forEach(b => {
    const act = b.getAttribute('data-bom-hdir') === bc.horizontalDir;
    b.className = `bom-hdir-btn py-2 px-2 rounded-lg border font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${act ? activeCls : idleCls}`;
  });
  document.querySelectorAll('.bom-vdir-btn').forEach(b => {
    const act = b.getAttribute('data-bom-vdir') === bc.verticalDir;
    b.className = `bom-vdir-btn py-2 px-2 rounded-lg border font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${act ? activeCls : idleCls}`;
  });

  // Hanging alignment (labels & dynamic SVGs follow active flow direction)
  const alignHead = document.getElementById('bomAlignHeading');
  if (alignHead) alignHead.textContent = bc.flowAxis === 'columns' ? 'Hanging Column Alignment' : 'Hanging Row Alignment';
  const alignLabels = bc.flowAxis === 'columns'
    ? (bc.verticalDir === 'btt'
      ? { start: 'Bottom', center: 'Center', end: 'Top' }
      : { start: 'Top', center: 'Center', end: 'Bottom' })
    : (bc.horizontalDir === 'rtl'
      ? { start: 'Right', center: 'Center', end: 'Left' }
      : { start: 'Left', center: 'Center', end: 'Right' });
  document.querySelectorAll('.bom-align-btn').forEach(b => {
    const id = b.getAttribute('data-bom-align');
    const act = id === bc.align;
    b.className = `bom-align-btn py-2 px-2 rounded-lg border font-semibold flex flex-col items-center gap-1 transition cursor-pointer ${act ? activeCls : idleCls}`;
    const lblEl = document.getElementById(`bomAlignLabel_${id}`);
    if (lblEl) lblEl.textContent = alignLabels[id] || id;
    const icoEl = document.getElementById(`bomAlignIcon_${id}`);
    if (icoEl) icoEl.innerHTML = buildBomAlignIconSvg(bc.flowAxis, bc.horizontalDir, bc.verticalDir, id);
  });

  // Table rows controls
  document.querySelectorAll('.bom-tablemode-btn').forEach(b => {
    const act = b.getAttribute('data-bom-table-mode') === bc.tableRowsMode;
    b.className = `bom-tablemode-btn p-2.5 rounded-lg border font-semibold flex items-center gap-2.5 text-left transition cursor-pointer ${act ? activeCls : idleCls}`;
  });
  document.getElementById('bomTableCustomRowsWrap')?.classList.toggle('hidden', bc.tableRowsMode !== 'custom');
  const tRowsInput = document.getElementById('bomTableRowsInput');
  if (tRowsInput && document.activeElement !== tRowsInput) tRowsInput.value = String(bc.tableRowsPerPage);
  document.querySelectorAll('.bom-trows-btn').forEach(b => {
    const act = Number(b.getAttribute('data-bom-trows')) === bc.tableRowsPerPage;
    b.className = `bom-trows-btn px-2 py-1 rounded border font-mono text-[11px] font-semibold transition cursor-pointer ${act ? activeCls : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]'}`;
  });

  // Draggable fields & columns list
  document.getElementById('bomWordlessFieldsBanner')?.classList.toggle('hidden', Boolean(state.bomShowTextFields));
  renderBomFieldsList(bc);

  // Sorting selects
  const spEl = document.getElementById('bomSortPrimary');
  if (spEl) spEl.value = bc.sortPrimary;
  const ssEl = document.getElementById('bomSortSecondary');
  if (ssEl) ssEl.value = bc.sortSecondary;

  // Summaries in side menu, modal subtitle, and Style popover
  const effBc = getEffectiveBomConfig();
  const traitNames = { color: 'Color', category: 'Category', qty: 'Quantity', size: 'Size', name: 'Name', partId: 'Part ID' };
  const bomMenuSum = document.getElementById('menuBomSetupSummary');
  if (bomMenuSum) bomMenuSum.textContent = summarizeBomConfig(effBc);
  const bomSub = document.getElementById('bomSetupSubtitle');
  if (bomSub) {
    const bomPages = state.pages.filter(p => p.kind === 'bom');
    const uniqueN = bomPages[0]?.bomTotalUnique || 0;
    bomSub.textContent = bomPages.length > 0
      ? `${uniqueN} unique parts across ${bomPages.length} page${bomPages.length === 1 ? '' : 's'} · ${traitNames[bc.sortPrimary] || 'Color'} → ${traitNames[bc.sortSecondary] || 'Category'}`
      : `${summarizeBomConfig(effBc)} · Then by ${traitNames[bc.sortSecondary] || 'Category'}`;
  }

  // Live preview inside modal
  renderBomSetupPreview(effBc);
}

function renderOverviewModal(opts = {}) {
  const list = document.getElementById('overviewList');
  if (!list) return;
  hidePageBreakHelpTooltip();
  const prevScrollTop = list.scrollTop;
  stopOverviewThumbQueue();
  const jobId = overviewThumbRenderJobId;
  list.innerHTML = '';

  const pageBreakSvg = '<svg class="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h4"/><path d="M10 12h4"/><path d="M17 12h4"/><path d="M6 4v3a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V4"/><path d="M6 20v-3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3"/></svg>';
  const resScale = getPreviewResolutionScale();
  const { width: thumbW, height: thumbH } = computeOverviewThumbDimensions(resScale);
  const thumbEpoch = overviewThumbCache.getEpoch();
  const stepSigs = computeOverviewStepSignatures(state.model?.chapters);
  const allModelParts = state.model ? getAllParts(state.model) : [];
  const allModelPartsSig = computeStepPreviewPartSignature(allModelParts);
  const observedTargets = [];

  const breakCount = countStepPageBreaks(state.model?.chapters, state.overrides);

  const pinsBar = document.getElementById('overviewPinsBar');
  const pinsStatus = document.getElementById('overviewPinsStatus');
  const clearBtn = document.getElementById('btnClearAllPins');
  if (pinsBar) pinsBar.classList.toggle('hidden', breakCount === 0);
  if (pinsStatus) {
    pinsStatus.innerHTML = breakCount > 0
      ? `<span class="text-[var(--primary)] inline-flex items-center">${pageBreakSvg}</span><span>${breakCount} active page break${breakCount === 1 ? '' : 's'}</span>`
      : '';
  }
  applyDestructiveNoticeToEl(
    'overviewClearPinsNotice',
    getClearAllPageBreaksDestructiveNotice(breakCount),
  );
  if (clearBtn) {
    if (breakCount > 0) {
      clearBtn.textContent = 'Clear All';
      clearBtn.title = `Remove all ${breakCount} page break${breakCount === 1 ? '' : 's'}`;
      clearBtn.classList.remove('hidden');
      clearBtn.onclick = () => {
        const anchorStepId = state.selectedStepId || state.pages[state.pageIdx]?.slots?.[0]?.step?.id || null;
        pushUndo();
        const cleared = clearAllStepPageBreaks(state.overrides);
        state.overrides = cleared.overrides;
        rebuildPages();
        if (anchorStepId) {
          const anchorIdx = findPageIndexForStep(state.pages, anchorStepId);
          if (anchorIdx >= 0) state.pageIdx = anchorIdx;
        }
        renderAll();
        renderOverviewModal();
        showToast('Cleared all page breaks — pages can reflow freely.');
      };
    } else {
      clearBtn.classList.add('hidden');
      clearBtn.onclick = null;
    }
  }

  const rangeModeBtn = document.getElementById('btnOverviewRangeMode');
  const rangeBar = document.getElementById('overviewRangeBar');
  const rangeStatus = document.getElementById('overviewRangeStatus');
  const rangeCreateBtn = document.getElementById('btnOverviewRangeCreate');
  const ovSub = document.getElementById('overviewSubtitle');

  if (rangeModeBtn) {
    rangeModeBtn.textContent = overviewRangeState.active ? 'Done Selecting' : 'Select Range';
    rangeModeBtn.className = `px-2.5 py-1.5 rounded-full border text-[11px] font-semibold transition ${overviewRangeState.active ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]'}`;
  }
  if (ovSub) {
    ovSub.textContent = overviewRangeState.active
      ? 'Tap a start step and an end step (or page header) to group them'
      : 'Tap any page or step to jump to it';
  }
  if (rangeBar) rangeBar.classList.toggle('hidden', !overviewRangeState.active);
  if (rangeStatus && rangeCreateBtn) {
    if (overviewRangeState.startStep != null && overviewRangeState.endStep != null) {
      const lo = Math.min(overviewRangeState.startStep, overviewRangeState.endStep);
      const hi = Math.max(overviewRangeState.startStep, overviewRangeState.endStep);
      rangeStatus.textContent = `Selected ${formatAbsRange(lo, hi)} · ${describeAbsStepRange(lo, hi)}`;
      rangeCreateBtn.disabled = false;
    } else if (overviewRangeState.startStep != null) {
      rangeStatus.textContent = `Start: #${overviewRangeState.startStep} (${describeAbsStepRange(overviewRangeState.startStep, overviewRangeState.startStep)}) · Tap an end step`;
      rangeCreateBtn.disabled = false;
    } else {
      rangeStatus.textContent = 'Tap a start step, then an end step to group them';
      rangeCreateBtn.disabled = true;
    }
  }

  const pickRangeStep = (stepNum) => {
    if (overviewRangeState.startStep == null || overviewRangeState.endStep != null) {
      overviewRangeState.startStep = stepNum;
      overviewRangeState.endStep = null;
    } else {
      overviewRangeState.endStep = stepNum;
    }
    renderOverviewModal();
  };
  const pickRangeSpan = (lo, hi) => {
    if (overviewRangeState.startStep == null || overviewRangeState.endStep != null) {
      overviewRangeState.startStep = lo;
      overviewRangeState.endStep = hi;
    } else {
      overviewRangeState.startStep = Math.min(overviewRangeState.startStep, lo);
      overviewRangeState.endStep = Math.max(overviewRangeState.startStep, hi);
    }
    renderOverviewModal();
  };
  const isStepInOverviewRange = (num) => {
    if (!overviewRangeState.active || overviewRangeState.startStep == null) return false;
    const lo = Math.min(overviewRangeState.startStep, overviewRangeState.endStep ?? overviewRangeState.startStep);
    const hi = Math.max(overviewRangeState.startStep, overviewRangeState.endStep ?? overviewRangeState.startStep);
    return num >= lo && num <= hi;
  };

  const jumpToPageAndStep = (idx, stepId = null) => {
    state.pageIdx = idx;
    if (stepId) state.selectedStepId = stepId;
    state.selectedPartIds.clear();
    closeOverviewModal();
    resetZoom();
    renderAll();
  };

  const createPreviewBox = (pageTheme, highlighted) => {
    const box = document.createElement('div');
    box.className = `w-14 h-[44px] sm:w-[76px] sm:h-[56px] rounded-md border shrink-0 overflow-hidden flex items-center justify-center relative select-none ${highlighted ? 'border-[var(--primary)] ring-1 ring-[var(--primary-border)]' : 'border-[var(--border)]'}`;
    applyThemeBackgroundToElement(box, pageTheme);
    return box;
  };

  state.pages.forEach((pg, idx) => {
    const active = idx === state.pageIdx;
    const slots = pg.slots || [];
    const pageTheme = getThemeForPage(pg);

    // Non-step pages (Cover, Divider, Submodel Page, Build Complete, Parts List, Back Cover)
    if (slots.length === 0) {
      const row = document.createElement('div');
      if (active) row.dataset.active = 'true';
      row.className = `flex items-center justify-between gap-2.5 sm:gap-3 px-3 py-2 rounded-lg border cursor-pointer transition ${active ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary-border)]'}`;

      const thumbBox = createPreviewBox(pageTheme, active);
      const previewKind = resolveOverviewPagePreviewKind(pg);

      if (previewKind === 'model_3d') {
        let parts = [];
        let partsSig = '0:0';
        let az = 38;
        let el = 28;
        let tightFit = false;
        let heroShading = false;
        if (pg.kind === 'cover') {
          const cm = normalizeCoverMeta(state.coverMeta);
          parts = allModelParts;
          partsSig = allModelPartsSig;
          az = cm.az;
          el = cm.el;
          tightFit = true;
          heroShading = true;
        } else if (pg.kind === 'complete') {
          const cm = normalizeCompleteMeta(state.completeMeta);
          parts = allModelParts;
          partsSig = allModelPartsSig;
          az = cm.az;
          el = cm.el;
          tightFit = true;
          heroShading = true;
        } else if (pg.kind === 'section_divider') {
          parts = pg.previewParts || [];
          partsSig = computeStepPreviewPartSignature(parts);
          az = 38;
          el = 28;
        } else if (pg.kind === 'submodel_page') {
          parts = pg.step?.subassembly?.buildParts || [];
          partsSig = computeStepPreviewPartSignature(parts);
          az = 38;
          el = 30;
        }
        const cacheKey = buildPagePreviewCacheKey({
          epoch: thumbEpoch,
          kind: pg.kind,
          pageId: pg.id,
          partsSignature: partsSig,
          camAz: az,
          camEl: el,
          accent: pageTheme.accent,
          width: thumbW,
          height: thumbH,
        });
        const cachedUrl = parts.length > 0 ? overviewThumbCache.get(cacheKey) : undefined;
        const img = document.createElement('img');
        img.alt = `${pg.label} preview`;
        img.className = `w-full h-full object-contain p-0.5 pointer-events-none ${cachedUrl ? '' : 'opacity-0 transition-opacity duration-150'}`;
        if (cachedUrl) img.src = cachedUrl;
        const ph = document.createElement('span');
        ph.className = `font-mono text-[10px] font-semibold absolute pointer-events-none ${cachedUrl ? 'hidden' : ''}`;
        ph.style.color = pageTheme.muted || '#64748b';
        ph.setAttribute('aria-hidden', 'true');
        ph.textContent = `P${pg.num}`;
        thumbBox.appendChild(img);
        thumbBox.appendChild(ph);
        if (!cachedUrl && parts.length > 0) {
          overviewThumbTasks.set(thumbBox, {
            kind: 'page_3d',
            targetEl: thumbBox,
            imgEl: img,
            phEl: ph,
            cacheKey,
            parts,
            az,
            el,
            tightFit,
            heroShading,
            accent: pageTheme.accent,
            width: thumbW,
            height: thumbH,
            done: false,
          });
          observedTargets.push(thumbBox);
        }
      } else if (previewKind === 'bom_grid') {
        const bomSample = (pg.bomEntries || []).slice(0, 4);
        const grid = document.createElement('div');
        grid.className = 'w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5 p-1 pointer-events-none';
        const bomImgs = [];
        for (let i = 0; i < 4; i++) {
          const cell = document.createElement('div');
          cell.className = 'w-full h-full flex items-center justify-center overflow-hidden';
          if (bomSample[i]) {
            const im = document.createElement('img');
            im.alt = '';
            im.className = 'w-full h-full object-contain opacity-0 transition-opacity duration-150';
            cell.appendChild(im);
            bomImgs.push(im);
          }
          grid.appendChild(cell);
        }
        const ph = document.createElement('span');
        ph.className = 'absolute pointer-events-none flex items-center justify-center';
        ph.style.color = pageTheme.muted || '#64748b';
        ph.setAttribute('aria-hidden', 'true');
        ph.innerHTML = '<svg class="w-4 h-4 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>';
        thumbBox.appendChild(grid);
        thumbBox.appendChild(ph);
        if (bomSample.length > 0) {
          overviewThumbTasks.set(thumbBox, {
            kind: 'bom_grid',
            targetEl: thumbBox,
            bomImgs,
            bomEntries: bomSample,
            phEl: ph,
            done: false,
          });
          observedTargets.push(thumbBox);
        }
      } else if (previewKind === 'divider_card') {
        thumbBox.innerHTML = `
          <div class="w-full h-full flex flex-col items-center justify-center gap-1 px-2 pointer-events-none" aria-hidden="true">
            <span class="w-5 h-1 rounded-full" style="background:${escHtml(pageTheme.accent || '#7c152e')}"></span>
            <span class="w-8 h-0.5 rounded-full opacity-45" style="background:${escHtml(pageTheme.muted || '#64748b')}"></span>
            <span class="w-6 h-0.5 rounded-full opacity-30" style="background:${escHtml(pageTheme.muted || '#64748b')}"></span>
          </div>`;
      } else if (previewKind === 'back_card') {
        thumbBox.innerHTML = `
          <div class="w-7 h-7 rounded-md flex items-center justify-center pointer-events-none" style="background:${escHtml(pageTheme.pliBg || 'rgba(255,255,255,0.75)')};border:1px solid ${escHtml(pageTheme.pliBorder || 'rgba(15,23,42,0.12)')}" aria-hidden="true">
            <svg class="w-4 h-4" viewBox="0 0 64 64" fill="none">${BRAND_LOGO_SVG_BODY}</svg>
          </div>`;
      } else {
        thumbBox.innerHTML = `<span class="font-mono text-[10px] font-semibold" style="color:${escHtml(pageTheme.muted || '#64748b')}" aria-hidden="true">P${pg.num}</span>`;
      }

      const showChapterSub = Boolean(pg.chapterName && pg.chapterName !== pg.label);
      const infoWrap = document.createElement('div');
      infoWrap.className = 'flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1';
      infoWrap.appendChild(thumbBox);
      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0 flex-1';
      textWrap.innerHTML = `
        <div class="flex items-center gap-1.5 min-w-0">
          ${active ? '<span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" aria-hidden="true"></span>' : ''}
          <span class="font-bold truncate ${active ? 'text-[var(--primary)]' : ''}">${escHtml(`Page ${pg.num} · ${pg.label}`)}</span>
        </div>
        ${showChapterSub ? `<div class="text-xs text-[var(--muted-foreground)] truncate mt-0.5">${escHtml(pg.chapterName)}</div>` : ''}`;
      infoWrap.appendChild(textWrap);
      row.appendChild(infoWrap);
      row.onclick = () => jumpToPageAndStep(idx, null);
      list.appendChild(row);
      return;
    }

    const firstSlot = slots[0];
    const firstStep = firstSlot.step;
    const startsWithBreak = hasStepPageBreak(state.overrides, firstStep.id, firstSlot);

    if (startsWithBreak) {
      const divider = document.createElement('div');
      divider.className = 'flex items-center gap-2 px-2 pt-1 text-xs font-bold text-[var(--primary)] select-none';
      divider.innerHTML = `
        <div class="flex-1 border-t border-dashed border-[var(--primary-border)]"></div>
        <span class="inline-flex items-center gap-1 whitespace-nowrap">
          ${pageBreakSvg}
          <span>Page Break · ${escHtml(getStepShortLabel(firstStep, firstSlot.ch))} starts a new page</span>
        </span>
        <div class="flex-1 border-t border-dashed border-[var(--primary-border)]"></div>`;
      list.appendChild(divider);
    }

    const card = document.createElement('div');
    card.className = `rounded-lg border overflow-hidden transition ${active ? 'border-[var(--primary)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-[var(--background)]'}`;

    const pageHeader = document.createElement('div');
    pageHeader.className = `flex items-center justify-between gap-2 px-3 py-1.5 border-b cursor-pointer transition ${active ? 'border-[var(--primary-border)] bg-[var(--primary-soft)]' : 'border-[var(--border)]/70 bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'}`;
    const showChapterName = Boolean(pg.chapterName);
    const grpBadge = pg.layoutGroup
      ? `<span class="px-1.5 py-0.5 rounded-full bg-[var(--primary-soft)] text-[var(--primary)] text-[9px] font-bold truncate max-w-[110px]">${escHtml(pg.layoutGroup.name)}</span>`
      : '';
    pageHeader.innerHTML = `
      <div class="flex items-center gap-1.5 min-w-0 text-xs">
        <span class="font-bold shrink-0">Page ${pg.num}</span>
        ${showChapterName ? `<span class="text-[var(--muted-foreground)] truncate">· ${escHtml(pg.chapterName)}</span>` : ''}
        ${grpBadge}
      </div>
      <span class="text-xs font-semibold text-[var(--muted-foreground)] shrink-0">${slots.length === 1 ? '1 step' : `${slots.length} steps`}</span>`;
    pageHeader.onclick = () => {
      if (overviewRangeState.active) {
        pickRangeSpan(getAbsStepNum(slots[0].step), getAbsStepNum(slots[slots.length - 1].step));
      } else {
        jumpToPageAndStep(idx, firstStep.id);
      }
    };
    card.appendChild(pageHeader);

    const stepsWrap = document.createElement('div');
    stepsWrap.className = 'divide-y divide-[var(--border)]/60';

    slots.forEach((slot, slotIdx) => {
      const step = slot.step;
      const isSeqCont = isStepBreakContinuationSlice(slot);
      const hasBreak = hasStepPageBreak(state.overrides, step.id, slot);
      const isStepActive = active && (state.selectedStepId === step.id || (!state.selectedStepId && slotIdx === 0));
      const inSelRange = isStepInOverviewRange(getAbsStepNum(step));
      const isMfBuild = Boolean((step.isStandaloneFigure || slot.ch?.kind === 'minifigure') && !step.isMinifigPoseStep);
      const mfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : null;
      const isMfSeq = Boolean(isMfBuild && mfStyle === 'sequential');

      const stepTitle = isMfBuild && step.minifigName
        ? `Step ${step.num} · ${step.minifigName}`
        : `Step ${step.num}`;
      const absNum = getAbsStepNum(step);
      const absBadge = `#${absNum}`;

      const metaParts = [];
      if (slot.minifigSeqSlice) {
        const sl = slot.minifigSeqSlice;
        metaParts.push(sl.end - sl.start === 1 ? `Sub-step ${sl.start + 1}` : `Sub-steps ${sl.start + 1}–${sl.end}`);
      } else {
        const partCount = (step.parts || []).length;
        if (partCount > 0) metaParts.push(formatPartCount(partCount));
      }
      if (step.subassembly) metaParts.push(step.subassembly.name || 'Callout');
      else if (step.attachedSubmodel) metaParts.push(`Attach ${step.attachedSubmodel.name || 'Submodel'}`);
      else if (step.attachedMinifig) metaParts.push(`Place ${step.attachedMinifig.name || 'Minifigure'}`);
      else if (step.isMinifigPoseStep) metaParts.push('Pose');
      const stepMeta = metaParts.join(' · ');

      const stepRow = document.createElement('div');
      if (isStepActive) stepRow.dataset.active = 'true';
      stepRow.className = `flex items-center justify-between gap-2 px-3 py-2 cursor-pointer transition ${inSelRange ? 'bg-[var(--primary-soft)] ring-1 ring-inset ring-[var(--primary-border)]' : (isStepActive ? 'bg-[var(--primary-soft)]' : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]')}`;

      const stepShortLabel = getStepShortLabel(step, slot.ch);
      const breakTitle = getStepBreakTooltip({
        stepLabel: stepShortLabel,
        pinned: hasBreak,
        slotIndex: slotIdx,
      });

      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const modelScale = ov.modelScale || 1.0;
      const effectivePartOffsets = step.defaultPartOffsets
        ? { ...step.defaultPartOffsets, ...(ov.partOffsets || {}) }
        : (ov.partOffsets || {});
      const sigInfo = stepSigs.get(step.id) || {
        prevCount: 0,
        prevSignature: '0:0',
        stepSignature: computeStepPreviewPartSignature(step.parts),
      };
      const cacheKey = buildStepPreviewCacheKey({
        epoch: thumbEpoch,
        stepId: step.id,
        prevSignature: sigInfo.prevSignature,
        stepSignature: sigInfo.stepSignature,
        camAz: cam.az,
        camEl: cam.el,
        modelScale,
        partOffsets: effectivePartOffsets,
        highlightNew: state.highlightNew,
        highlightColor: state.highlightColor,
        fadePrev: state.fadePrev,
        fadeOpacity: state.fadeOpacity,
        accent: pageTheme.accent,
        minifigStyle: mfStyle,
        seqSlice: slot.minifigSeqSlice ? { start: slot.minifigSeqSlice.start, end: slot.minifigSeqSlice.end } : null,
        isMinifigPoseStep: Boolean(step.isMinifigPoseStep),
        width: thumbW,
        height: thumbH,
      });
      const cachedUrl = overviewThumbCache.get(cacheKey);

      const thumbBox = createPreviewBox(pageTheme, inSelRange || isStepActive);
      const img = document.createElement('img');
      img.alt = `Step ${step.num} (absolute #${absNum}) preview`;
      img.className = `w-full h-full object-contain p-0.5 pointer-events-none ${cachedUrl ? '' : 'opacity-0 transition-opacity duration-150'}`;
      if (cachedUrl) img.src = cachedUrl;
      const ph = document.createElement('span');
      ph.className = `font-mono text-[10px] font-semibold absolute pointer-events-none ${cachedUrl ? 'hidden' : ''}`;
      ph.style.color = pageTheme.muted || '#64748b';
      ph.setAttribute('aria-hidden', 'true');
      ph.textContent = absBadge;
      thumbBox.appendChild(img);
      thumbBox.appendChild(ph);
      if (inSelRange) {
        const chk = document.createElement('span');
        chk.className = 'absolute top-0.5 left-0.5 w-4 h-4 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold inline-flex items-center justify-center shadow-xs pointer-events-none';
        chk.setAttribute('aria-hidden', 'true');
        chk.textContent = '✓';
        thumbBox.appendChild(chk);
      }

      if (!cachedUrl) {
        overviewThumbTasks.set(thumbBox, {
          kind: 'step',
          targetEl: thumbBox,
          imgEl: img,
          phEl: ph,
          cacheKey,
          ch: slot.ch,
          step,
          minifigSeqSlice: slot.minifigSeqSlice || null,
          cam,
          ov,
          modelScale,
          effectivePartOffsets,
          isMfSeq,
          accent: pageTheme.accent,
          width: thumbW,
          height: thumbH,
          done: false,
        });
        observedTargets.push(thumbBox);
      }

      const leftWrap = document.createElement('div');
      leftWrap.className = 'flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1';
      leftWrap.appendChild(thumbBox);

      const textWrap = document.createElement('div');
      textWrap.className = 'min-w-0 flex-1';
      textWrap.innerHTML = `
        <div class="flex items-center gap-1.5 min-w-0">
          ${!inSelRange && isStepActive ? '<span class="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" aria-hidden="true"></span>' : ''}
          <span class="font-semibold truncate ${inSelRange || isStepActive ? 'text-[var(--primary)]' : ''}">${escHtml(stepTitle)}</span>
          <span class="shrink-0 px-1 py-0.5 rounded border border-[var(--border)] font-mono text-[10px] font-semibold text-[var(--muted-foreground)]" title="Absolute step number (unique across the whole manual)">${absBadge}</span>
        </div>
        ${stepMeta ? `<div class="text-xs text-[var(--muted-foreground)] truncate mt-0.5">${escHtml(stepMeta)}</div>` : ''}`;
      leftWrap.appendChild(textWrap);

      const rightWrap = document.createElement('div');
      rightWrap.className = 'flex items-center gap-1 shrink-0';
      rightWrap.innerHTML = isSeqCont
        ? '<span class="px-2 py-0.5 rounded-md text-xs font-medium text-[var(--muted-foreground)] bg-black/5 dark:bg-white/10">Continued</span>'
        : `<span class="pb-btn-group inline-flex items-stretch rounded-md text-xs font-semibold border transition ${hasBreak ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent' : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary-border)]'}"><button type="button" title="${escHtml(breakTitle)}" aria-label="${escHtml(`Page break before Step ${step.num}`)}" aria-pressed="${hasBreak ? 'true' : 'false'}" class="ov-step-pin pl-2 pr-1.5 py-1 sm:pl-2.5 sm:pr-2 rounded-l-[5px] inline-flex items-center gap-1 transition-colors cursor-pointer ${hasBreak ? 'hover:bg-[var(--primary-hover)]' : 'hover:bg-[var(--surface-hover)]'}">${pageBreakSvg}<span>Page Break</span></button><button type="button" aria-label="${escHtml(`What is a Page Break? (${stepShortLabel})`)}" aria-expanded="false" data-pb-help-step="${escHtml(stepShortLabel)}" data-pb-help-pinned="${hasBreak ? '1' : '0'}" class="pb-help-btn px-1.5 sm:px-2 py-1 rounded-r-[5px] border-l inline-flex items-center justify-center font-bold leading-none transition-colors cursor-pointer ${hasBreak ? 'pb-help-btn-pinned' : 'pb-help-btn-default'}"><span aria-hidden="true">?</span></button></span>`;

      stepRow.appendChild(leftWrap);
      stepRow.appendChild(rightWrap);

      stepRow.onclick = () => {
        if (overviewRangeState.active) {
          pickRangeStep(absNum);
        } else {
          jumpToPageAndStep(idx, step.id);
        }
      };

      const pinBtn = stepRow.querySelector('.ov-step-pin');
      if (pinBtn) {
        pinBtn.onclick = (e) => {
          e.stopPropagation();
          toggleStepPageBreak(step, { ch: slot.ch, refreshOverview: true });
        };
      }
      const pinHelpBtn = stepRow.querySelector('.pb-help-btn');
      if (pinHelpBtn) {
        pinHelpBtn.onclick = (e) => {
          e.stopPropagation();
          e.preventDefault();
          togglePageBreakHelpTooltip(pinHelpBtn);
        };
      }

      stepsWrap.appendChild(stepRow);
    });

    card.appendChild(stepsWrap);
    list.appendChild(card);
  });

  if (opts && opts.scrollActiveIntoView) {
    const activeRow = list.querySelector('[data-active="true"]');
    if (activeRow) activeRow.scrollIntoView({ block: 'center', behavior: 'instant' });
  } else {
    list.scrollTop = prevScrollTop;
  }

  observeOverviewThumbs(observedTargets, list, jobId);
  syncOverviewScrollButtons();
  requestAnimationFrame(syncOverviewScrollButtons);
}

function syncOverviewScrollButtons() {
  const list = document.getElementById('overviewList');
  const topBtn = document.getElementById('btnOverviewJumpTop');
  const bottomBtn = document.getElementById('btnOverviewJumpBottom');
  if (!list || !topBtn || !bottomBtn) return;
  const { showJumpTop, showJumpBottom } = computeScrollJumpVisibility({
    scrollTop: list.scrollTop,
    clientHeight: list.clientHeight,
    scrollHeight: list.scrollHeight,
  });
  topBtn.classList.toggle('hidden', !showJumpTop);
  bottomBtn.classList.toggle('hidden', !showJumpBottom);
}

function scrollOverviewListTo(edge) {
  const list = document.getElementById('overviewList');
  if (!list) return;
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const targetTop = edge === 'top' ? 0 : Math.max(0, list.scrollHeight - list.clientHeight);
  if (typeof list.scrollTo === 'function') {
    list.scrollTo({ top: targetTop, behavior: reducedMotion ? 'auto' : 'smooth' });
  } else {
    list.scrollTop = targetTop;
  }
  syncOverviewScrollButtons();
}

// =========================================================================
// 10. STAGE GESTURES (Zero-Jitter Native Touch Pinch/Pan + Focal Wheel Zoom)
// =========================================================================
(function setupStageGestures() {
  const stage = document.getElementById('stageViewport');
  let modeTouch = null; // 'pan' | 'pinch' | null
  let startZoom = 1, startPanX = 0, startPanY = 0;
  let startX = 0, startY = 0, startDist = 0, startMidX = 0, startMidY = 0;
  let lastTapTime = 0, touchMoved = false;

  // Desktop mouse wheel focal-point zoom
  stage.addEventListener('wheel', (e) => {
    if (!state.model) return;
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0018);
    setZoom(state.zoom * factor, e.clientX, e.clientY);
  }, { passive: false });

  // Native synchronous Touch Events (iOS Safari samples both fingers on the exact same timestamp -> ZERO jitter!)
  stage.addEventListener('touchstart', (e) => {
    if (!state.model) return;
    if (e.target?.closest?.('a[href]')) return;
    const t = e.touches;
    if (t.length === 2) {
      e.preventDefault();
      modeTouch = 'pinch'; touchMoved = true;
      startZoom = state.zoom; startPanX = state.panX; startPanY = state.panY;
      startDist = Math.max(10, Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY));
      startMidX = (t[0].clientX + t[1].clientX) / 2;
      startMidY = (t[0].clientY + t[1].clientY) / 2;
    } else if (t.length === 1 && isPanGestureEnabled()) {
      e.preventDefault();
      const now = Date.now();
      if (now - lastTapTime < 280) { resetZoom(); modeTouch = null; touchMoved = true; return; }
      lastTapTime = now;
      modeTouch = 'pan'; touchMoved = false;
      startPanX = state.panX; startPanY = state.panY;
      startX = t[0].clientX; startY = t[0].clientY;
    }
  }, { passive: false });

  stage.addEventListener('touchmove', (e) => {
    if (!state.model || !modeTouch) return;
    const t = e.touches;
    if (modeTouch === 'pinch' && t.length >= 2) {
      e.preventDefault();
      touchMoved = true;
      const dist = Math.max(10, Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY));
      const midX = (t[0].clientX + t[1].clientX) / 2;
      const midY = (t[0].clientY + t[1].clientY) / 2;
      const nextZoom = Math.max(0.45, Math.min(4.5, startZoom * (dist / startDist)));
      const { cx, cy } = getStageOrigin();
      const ratio = nextZoom / startZoom;
      state.zoom = nextZoom;
      state.panX = (midX - cx) - ((startMidX - cx) - startPanX) * ratio;
      state.panY = (midY - cy) - ((startMidY - cy) - startPanY) * ratio;
      applyStageTransform();
    } else if (modeTouch === 'pan' && t.length === 1 && isPanGestureEnabled()) {
      e.preventDefault();
      if (Math.hypot(t[0].clientX - startX, t[0].clientY - startY) > 10) touchMoved = true;
      state.panX = startPanX + (t[0].clientX - startX);
      state.panY = startPanY + (t[0].clientY - startY);
      applyStageTransform();
    }
  }, { passive: false });

  const endTouch = (e) => {
    const t = e.touches;
    if (t.length === 1 && isPanGestureEnabled()) {
      modeTouch = 'pan';
      startPanX = state.panX; startPanY = state.panY;
      startX = t[0].clientX; startY = t[0].clientY;
    } else if (t.length === 0) {
      modeTouch = null;
    }
  };
  stage.addEventListener('touchend', endTouch, { passive: true });
  stage.addEventListener('touchcancel', endTouch, { passive: true });

  // Desktop mouse drag panning (Pan mode or read-only pages)
  let mouseDragging = false;
  stage.addEventListener('mousedown', (e) => {
    if (!state.model || !isPanGestureEnabled() || e.button !== 0) return;
    if (e.target?.closest?.('a[href]')) return;
    mouseDragging = true;
    startPanX = state.panX; startPanY = state.panY;
    startX = e.clientX; startY = e.clientY;
  });
  window.addEventListener('mousemove', (e) => {
    if (!mouseDragging) return;
    state.panX = startPanX + (e.clientX - startX);
    state.panY = startPanY + (e.clientY - startY);
    applyStageTransform();
  });
  window.addEventListener('mouseup', () => { mouseDragging = false; });
})();

// =========================================================================
// 11. INDEXEDDB PERSISTENCE, BRICKS LIBRARY IMPORTER & ERRORS/DIAGNOSTICS
// =========================================================================
const DB_NAME = 'BrickInstructionCreatorDB', DB_STORE = 'session', LIB_STORE = 'partsLib';
function openSessionDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('No IndexedDB'));
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE);
      if (!req.result.objectStoreNames.contains(LIB_STORE)) req.result.createObjectStore(LIB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPut(key, val, storeName = DB_STORE) {
  try {
    const db = await openSessionDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(val, key);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch (_) {}
}
async function dbGet(key, storeName = DB_STORE) {
  try {
    const db = await openSessionDB();
    return await new Promise((res, rej) => {
      const tx = db.transaction(storeName, 'readonly');
      const r = tx.objectStore(storeName).get(key);
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  } catch (_) { return null; }
}
async function dbClearStore(storeName) {
  try {
    const db = await openSessionDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch (_) {}
}
async function dbDelete(key, storeName = DB_STORE) {
  try {
    const db = await openSessionDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch (_) {}
}

function registerUserLibDat(rawName, text) {
  if (typeof rawName === 'string' && rawName.startsWith('__tex__:')) {
    const texName = rawName.slice('__tex__:'.length);
    if (texName && typeof text === 'string' && text.length > 16) {
      textureStore.registerBase64Texture(text, { name: texName, source: 'library' });
    }
    return;
  }
  const k = normId(rawName);
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return;
  userLibRaw.set(k, lines);
  notFoundDatCache.delete(k);
  textureStore.scanDatLinesForTextures(lines, 'library');
  const movedTarget = extractMovedToTarget(lines);
  if (movedTarget && movedTarget !== k) movedToAliases.set(k, movedTarget);
  const title = extractCleanDatTitle(lines);
  if (title) userLibTitles.set(k, title);
  for (let i = 0; i < Math.min(lines.length, 16); i++) {
    const mBl = lines[i].match(/^0\s+BL_Item_No\s+(\S+)/i);
    if (mBl && mBl[1] && mBl[1] !== '-1') {
      const alias = normId(mBl[1]);
      if (alias && alias !== k && !userLibRaw.has(alias)) {
        userLibRaw.set(alias, lines);
        if (title) userLibTitles.set(alias, title);
      }
      break;
    }
  }
}

function getDirectLoadedDatLines(normKey) {
  const k = normId(normKey);
  const blPrefixed = !k.includes('/') && !k.startsWith('bl_') ? `bl_${k}` : null;
  const blSuffixed = !k.includes('/') && !k.endsWith('-bl') ? `${k}-bl` : null;
  const noBlPrefix = k.startsWith('bl_') ? k.slice(3) : null;
  for (const store of [embeddedDatRaw, userLibRaw]) {
    if (store.has(k)) return store.get(k);
    if (blPrefixed && store.has(blPrefixed)) return store.get(blPrefixed);
    if (blSuffixed && store.has(blSuffixed)) return store.get(blSuffixed);
    if (noBlPrefix && store.has(noBlPrefix)) return store.get(noBlPrefix);
  }
  return null;
}

function collectLeafPartIdsFromParsed(parsed) {
  const ids = [];
  if (!parsed || !Array.isArray(parsed.parts)) return ids;
  for (const p of parsed.parts) {
    const leaves = p.children && p.children.length > 0 ? p.children : [p];
    for (const lf of leaves) {
      if (lf?.p) ids.push(lf.p);
    }
  }
  return ids;
}

function refreshSubdivisionPlanForParsed(parsed, prevPlan) {
  if (!parsed || !prevPlan || prevPlan.strategy === 'none') return prevPlan || null;
  try {
    const prep = prepareSubdivisionData(parsed);
    const { proposals } = analyzeModelSubdivisions(prep.inputs, prep.adjacency);
    const matched =
      proposals.find(p => p.id === prevPlan.id) ||
      proposals.find(p => p.strategy === prevPlan.strategy && p.outputMode === prevPlan.outputMode) ||
      proposals.find(p => p.strategy === prevPlan.strategy) ||
      null;
    return matched ? JSON.parse(JSON.stringify(matched)) : prevPlan;
  } catch (_) {
    return prevPlan;
  }
}

const libThumbCache = new Map();
const libUiState = {
  tab: 'browse', // 'browse' | 'manage'
  query: '',
  scope: 'all',
  category: 'all',
  includeHelpers: false,
  previewColor: 'model', // 'model' (match loaded model colors) | LDraw numeric color ID
  colorPickerOpen: false,
  colorQuery: '',
  previewAz: 38,
  previewEl: 24,
  selectedId: null,
  visibleLimit: 48,
};

const LIB_PAGE_BATCH_SIZE = 48;
let libCachedSnapshot = null;
let libThumbObserver = null;
let libScrollObserver = null;
let libCurrentFilteredItems = [];
let libRenderedCount = 0;
let libThumbQueue = [];
let libThumbRafId = 0;
let libSearchDebounceTimer = null;
let libPreviewMeshCache = { key: '', mesh: null };
/** Catalog-only parts already auto-downloaded on selection this session (avoids refetch loops on 404). */
const libAutoFetchAttempted = new Set();

function invalidateLibraryRenderCaches() {
  embeddedDatCompiled.clear();
  pliThumbCache.clear();
  submodelThumbCache.clear();
  clearMinifigDiagramCaches();
  coverHeroCache.clear();
  overviewThumbCache.bumpEpoch();
  libThumbCache.clear();
  libPreviewMeshCache = { key: '', mesh: null };
  libCachedSnapshot = null;
}

function collectCurrentModelPartSets() {
  const modelPartIds = new Set();
  const missingShapePartIds = new Set();
  const missingExactDatPartIds = new Set();
  const modelColorCounts = new Map();
  const modelPartColors = new Map();
  if (state.model) {
    for (const { step } of getAllSteps(state.model)) {
      for (const p of step.parts) {
        const leaves = p.children && p.children.length > 0 ? p.children : [p];
        for (const lf of leaves) {
          const k = normId(lf.p);
          if (!k) continue;
          modelPartIds.add(k);
          if (!hasKnownShape(k)) missingShapePartIds.add(k);
          if (!lookupExactRawDat(k)) missingExactDatPartIds.add(k);
          const colId = Number(lf.c);
          if (Number.isFinite(colId) && COLORS[colId]) {
            modelColorCounts.set(colId, (modelColorCounts.get(colId) || 0) + 1);
            let perPart = modelPartColors.get(k);
            if (!perPart) {
              perPart = new Map();
              modelPartColors.set(k, perPart);
            }
            perPart.set(colId, (perPart.get(colId) || 0) + 1);
          }
        }
      }
    }
  }
  return { modelPartIds, missingShapePartIds, missingExactDatPartIds, modelColorCounts, modelPartColors };
}

function getLibrarySnapshot(forceRebuild = false) {
  if (!forceRebuild && libCachedSnapshot) return libCachedSnapshot;
  const {
    modelPartIds,
    missingShapePartIds,
    missingExactDatPartIds,
    modelColorCounts,
    modelPartColors,
  } = collectCurrentModelPartSets();
  const built = buildLibraryIndex({
    userLibRaw,
    userLibTitles,
    embeddedDatRaw,
    embeddedDatTitles,
    builtInCatalog: PARTS_CATALOG,
    modelPartIds,
    missingShapePartIds,
    missingExactDatPartIds,
    resolveName: (id) => getHumanPartName(id),
    savedTextureCount: textureStore.getLibraryCount(),
    onlineCatalog: onlinePartsCatalog?.entries || null,
  });
  libCachedSnapshot = { ...built, modelColorCounts, modelPartColors };
  return libCachedSnapshot;
}

function getPartModelColorList(partId) {
  const { modelPartColors } = getLibrarySnapshot();
  const perPart = modelPartColors?.get(partId);
  if (!perPart || perPart.size === 0) return [];
  return Array.from(perPart.entries())
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id - b.id);
}

function getEffectivePreviewColorForPart(partId) {
  if (typeof libUiState.previewColor === 'number' && Number.isFinite(libUiState.previewColor)) {
    return libUiState.previewColor;
  }
  if (state.model) {
    const partColors = getPartModelColorList(partId);
    if (partColors.length > 0) return partColors[0].id;
    return 71; // Neutral Light Bluish Gray for catalog shapes when matching model colors
  }
  return 4; // Classic Red when no model is loaded
}

/** Lazily loads the bundled Online Parts Catalog (once per session) and refreshes the library UI. */
function ensureOnlinePartsCatalog() {
  if (onlinePartsCatalog || onlinePartsCatalogPromise) return onlinePartsCatalogPromise;
  onlinePartsCatalogPromise = loadPartsCatalog('', fetch)
    .then((catalog) => {
      if (catalog.entries.size === 0) {
        onlinePartsCatalogPromise = null; // allow retry (e.g. offline) on next open
        return null;
      }
      onlinePartsCatalog = catalog;
      libCachedSnapshot = null;
      if (isBricksLibraryModalOpen()) renderBricksLibraryModal(false);
      return catalog;
    })
    .catch(() => {
      onlinePartsCatalogPromise = null;
      return null;
    });
  return onlinePartsCatalogPromise;
}

function isBricksLibraryModalOpen() {
  const el = document.getElementById('bricksLibraryModal');
  return Boolean(el && !el.classList.contains('hidden'));
}

function updateLibraryStatusUI() {
  const snapshot = getLibrarySnapshot(true);
  const { stats } = snapshot;
  const statusEl = document.getElementById('libStatusText');
  if (statusEl) {
    statusEl.textContent = formatLibraryMenuSummary(stats);
    statusEl.classList.toggle('text-amber-600', stats.modelMissingShapeCount > 0);
    statusEl.classList.toggle('dark:text-amber-400', stats.modelMissingShapeCount > 0);
    statusEl.classList.toggle('font-bold', stats.modelMissingShapeCount > 0);
  }
  if (isBricksLibraryModalOpen()) {
    renderBricksLibraryModal(false);
  }
}

async function loadSavedBricksLibrary() {
  try {
    const db = await openSessionDB();
    await new Promise((res, rej) => {
      const tx = db.transaction(LIB_STORE, 'readonly');
      const req = tx.objectStore(LIB_STORE).openCursor();
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const key = String(cursor.key || '');
          if (key.startsWith('__tex__:')) {
            const texName = key.slice(8);
            if (typeof cursor.value === 'string') {
              textureStore.registerBase64Texture(cursor.value, { name: texName, source: 'library' });
            }
          } else {
            registerUserLibDat(key, cursor.value);
          }
          cursor.continue();
        } else res();
      };
      req.onerror = () => rej(req.error);
    });
  } catch (_) {}
  await textureStore.predecodeAllPending();
  updateLibraryStatusUI();
}

async function importBricksLibraryFiles(fileList) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const progWrap = document.getElementById('libProgressWrap');
  const progLabel = document.getElementById('libProgressLabel');
  const progPct = document.getElementById('libProgressPct');
  const progBar = document.getElementById('libProgressBar');
  const cancelBtn = document.getElementById('libCancelOpBtn');
  if (progWrap) progWrap.classList.remove('hidden');
  if (cancelBtn) cancelBtn.classList.add('hidden');

  let importedParts = 0;
  let importedHelpers = 0;
  try {
    const db = await openSessionDB().catch(() => null);
    for (const file of files) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.dat')) {
        const text = await file.text();
        const k = normId(file.name);
        registerUserLibDat(k, text);
        const kind = classifyDatEntryKind(k, userLibRaw.get(k), userLibTitles.get(k));
        if (kind === 'part') importedParts++;
        else importedHelpers++;
        if (db) await dbPut(k, text, LIB_STORE);
      } else if (lower.endsWith('.zip')) {
        if (progLabel) progLabel.textContent = `Reading ${file.name}…`;
        const ab = await file.arrayBuffer();
        const bytes = new Uint8Array(ab), view = new DataView(ab);
        let eocd = -1;
        for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65558); i--) {
          if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
        }
        if (eocd < 0) throw new Error('Not a valid ZIP archive.');
        const cdCount = view.getUint16(eocd + 10, true);
        let ptr = view.getUint32(eocd + 16, true);
        const datEntries = [];
        const texEntries = [];
        for (let i = 0; i < cdCount; i++) {
          if (view.getUint32(ptr, true) !== 0x02014b50) break;
          const flags = view.getUint16(ptr + 8, true);
          const method = view.getUint16(ptr + 10, true);
          const compSize = view.getUint32(ptr + 20, true);
          const nameLen = view.getUint16(ptr + 28, true);
          const extraLen = view.getUint16(ptr + 30, true);
          const commentLen = view.getUint16(ptr + 32, true);
          const localOffset = view.getUint32(ptr + 42, true);
          const name = new TextDecoder().decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
          const ln = name.toLowerCase();
          if (ln.endsWith('.dat') && !(flags & 1)) {
            datEntries.push({ name, flags, method, compSize, localOffset });
          } else if (/\.(png|jpg|jpeg|webp)$/i.test(ln) && ln.includes('texture') && !(flags & 1)) {
            texEntries.push({ name, flags, method, compSize, localOffset });
          }
          ptr += 46 + nameLen + extraLen + commentLen;
        }
        const texToStore = [];
        for (const ent of texEntries) {
          try {
            const u8 = await readZipEntryBytes(bytes, view, ent);
            if (u8.length > 24) {
              const b64 = bytesToBase64(u8);
              const normName = normalizeTextureName(ent.name);
              textureStore.registerBase64Texture(b64, { name: normName || ent.name, source: 'library' });
              if (normName) texToStore.push([`__tex__:${normName}`, b64]);
            }
          } catch (_) {}
        }
        if (db && texToStore.length) {
          for (let i = 0; i < texToStore.length; i += 100) {
            const chunk = texToStore.slice(i, i + 100);
            await new Promise((res) => {
              const tx = db.transaction(LIB_STORE, 'readwrite');
              const st = tx.objectStore(LIB_STORE);
              for (const [k, b64] of chunk) st.put(b64, k);
              tx.oncomplete = () => res(); tx.onerror = () => res();
            });
          }
        }
        // Batch write to IndexedDB in chunks of 250 for speed & stability
        for (let i = 0; i < datEntries.length; i += 250) {
          const batch = datEntries.slice(i, i + 250);
          const decoded = [];
          for (const ent of batch) {
            try {
              const txt = await readZipEntryText(bytes, view, ent);
              const k = normId(ent.name);
              registerUserLibDat(k, txt);
              const kind = classifyDatEntryKind(k, userLibRaw.get(k), userLibTitles.get(k));
              if (kind === 'part') importedParts++;
              else importedHelpers++;
              decoded.push([k, txt]);
            } catch (_) {}
          }
          if (db && decoded.length) {
            await new Promise((res) => {
              const tx = db.transaction(LIB_STORE, 'readwrite');
              const st = tx.objectStore(LIB_STORE);
              for (const [k, txt] of decoded) st.put(txt, k);
              tx.oncomplete = () => res(); tx.onerror = () => res();
            });
          }
          const totalDone = importedParts + importedHelpers;
          const pct = Math.round((Math.min(i + 250, datEntries.length) / Math.max(1, datEntries.length)) * 100);
          if (progLabel) progLabel.textContent = `Imported ${importedParts.toLocaleString()} parts (+${importedHelpers.toLocaleString()} subparts/primitives · ${totalDone.toLocaleString()}/${datEntries.length.toLocaleString()} files)…`;
          if (progPct) progPct.textContent = pct + '%';
          if (progBar) progBar.style.width = pct + '%';
          await new Promise(r => setTimeout(r, 4));
        }
      }
    }
    notFoundDatCache.clear();
    await textureStore.predecodeAllPending();
    invalidateLibraryRenderCaches();
    updateLibraryStatusUI();
    if (state.model && !mpState.parsed) {
      if (state.model._parsed) {
        const nextPlan = (importedParts + importedHelpers) > 0
          ? refreshSubdivisionPlanForParsed(state.model._parsed, state.model._subdivisionPlan || null)
          : (state.model._subdivisionPlan || null);
        state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto', nextPlan);
        if (lastSourceRecord && nextPlan !== state.model._subdivisionPlan) {
          lastSourceRecord = { ...lastSourceRecord, subdivisionPlan: nextPlan };
          dbPut('lastModel', lastSourceRecord);
        }
      }
      computeModelDiagnostics();
      renderAll();
    }
    const helperNote = importedHelpers > 0 ? ` (+${importedHelpers.toLocaleString()} subparts & primitives)` : '';
    showToast(`Imported ${formatPartCount(importedParts)}${helperNote} into library.`);
  } catch (err) {
    showToast(err?.message || 'Could not import bricks library.');
  } finally {
    if (progWrap) progWrap.classList.add('hidden');
  }
}

function getSelectedMirrorConfigs() {
  const sel = document.getElementById('libSourceSelect')?.value || PUBLIC_LDRAW_MIRRORS[0].url;
  const custom = (document.getElementById('libCustomUrlInput')?.value || '').trim();
  return buildMirrorConfigList(sel, custom);
}

async function persistLibraryBatchToDb(db, datBatch, texBatch) {
  if (!db || (datBatch.length === 0 && texBatch.length === 0)) return;
  await new Promise((res) => {
    const tx = db.transaction(LIB_STORE, 'readwrite');
    const st = tx.objectStore(LIB_STORE);
    for (const [k, txt] of datBatch) st.put(txt, k);
    for (const [texName, b64] of texBatch) {
      const normName = normalizeTextureName(texName) || texName;
      st.put(b64, `__tex__:${normName}`);
    }
    tx.oncomplete = () => res();
    tx.onerror = () => res();
  });
}

/**
 * Automatically downloads missing official LDraw 3D shapes, nested subparts/primitives, and
 * `!TEXMAP` PNG textures for a parsed model (used on session restore).
 */
async function autoFetchMissingPartsForParsed(parsed, displayName = '') {
  const rootPartIds = collectLeafPartIdsFromParsed(parsed);
  if (rootPartIds.length === 0) {
    return { fetched: 0, texturesFetched: 0, networkBlocked: false, aborted: false, alreadyComplete: true };
  }

  const overlay = document.getElementById('importFetchOverlay');
  const titleEl = document.getElementById('impFetchTitle');
  const subEl = document.getElementById('impFetchSub');
  const labelEl = document.getElementById('impFetchLabel');
  const pctEl = document.getElementById('impFetchPct');
  const barEl = document.getElementById('impFetchBar');
  const skipBtn = document.getElementById('impFetchSkipBtn');

  let overlayShown = false;
  const showOverlay = () => {
    if (overlayShown || !overlay) return;
    overlayShown = true;
    if (titleEl) titleEl.textContent = displayName ? `Loading 3D shapes for ${cleanSubName(displayName)}…` : 'Downloading 3D part shapes…';
    if (subEl) subEl.textContent = 'Fetching official LDraw parts & caching locally for instant reuse.';
    if (labelEl) labelEl.textContent = 'Downloading parts…';
    if (pctEl) pctEl.textContent = '0%';
    if (barEl) barEl.style.width = '4%';
    overlay.classList.remove('hidden');
  };

  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const onSkip = () => { if (ctrl) ctrl.abort(); };
  if (skipBtn) skipBtn.addEventListener('click', onSkip, { once: true });

  // Only reveal overlay if network fetch actually starts (avoids flicker when all parts are already cached!)
  const overlayTimer = setTimeout(showOverlay, 120);
  const mirrors = getSelectedMirrorConfigs();
  const db = await openSessionDB().catch(() => null);

  try {
    const res = await fetchLDrawDependencyGraph({
      rootPartIds,
      mirrors,
      getDirectLoadedLines: getDirectLoadedDatLines,
      getFallbacks: getPartIdFallbacks,
      hasTexture: (texName) => Boolean(textureStore.lookupByName(texName)),
      notFoundCache: notFoundDatCache,
      onDatLoaded: (storeKey, _reqKey, text) => {
        registerUserLibDat(storeKey, text);
      },
      onTextureLoaded: (texName, b64) => {
        const normName = normalizeTextureName(texName) || texName;
        textureStore.registerBase64Texture(b64, { name: normName, source: 'library' });
      },
      onBatchComplete: (datBatch, texBatch) => persistLibraryBatchToDb(db, datBatch, texBatch),
      onProgress: ({ fetched, processed, total }) => {
        showOverlay();
        const pct = Math.min(99, Math.max(4, Math.round((processed / Math.max(1, total)) * 100)));
        if (labelEl) labelEl.textContent = `Loaded ${fetched} shape${fetched === 1 ? '' : 's'} (${processed}/${total})…`;
        if (pctEl) pctEl.textContent = pct + '%';
        if (barEl) barEl.style.width = pct + '%';
      },
      concurrency: 16,
      maxQueue: 2500,
      timeoutMs: 8000,
      signal: ctrl?.signal,
    });

    if (res.fetched > 0 || res.texturesFetched > 0) {
      await textureStore.predecodeAllPending();
      invalidateLibraryRenderCaches();
      updateLibraryStatusUI();
    }
    return res;
  } finally {
    clearTimeout(overlayTimer);
    if (skipBtn) skipBtn.removeEventListener('click', onSkip);
    if (overlay) overlay.classList.add('hidden');
  }
}

let fetchPartsInFlight = false;
let fetchCancelRequested = false;
let activeFetchAbortCtrl = null;

function collectMissingFetchTargets(parsedOverride = null) {
  const queue = [];
  const queued = new Set();
  const visitedLoaded = new Set();
  const texQueue = [];
  const texQueued = new Set();

  const enqueueTex = (texName) => {
    const clean = normalizeTextureName(texName);
    if (!clean || texQueued.has(clean) || textureStore.lookupByName(clean)) return;
    texQueued.add(clean);
    texQueue.push(clean);
  };

  const scanLinesForRefs = (lines) => {
    for (const rawLine of lines) {
      const tr = rawLine.trim();
      const unwrapped = /^0\s+!:\s*/.test(tr) ? tr.replace(/^0\s+!:\s*/, '').trim() : tr;
      if (/^1\s/.test(unwrapped)) {
        const toks = unwrapped.split(/\s+/);
        if (toks.length >= 15) enqueue(toks.slice(14).join(' '));
      }
    }
    for (const tn of extractTexmapTextureNamesFromLines(lines)) enqueueTex(tn);
  };

  const enqueue = (rawId) => {
    const k = normId(rawId);
    const base = k.split('/').pop();
    if (!k || queued.has(k)) return;
    if (/^(stud|stud2|stud2a|stud3|stud3a|stud4|stud4a|studp01|rect|rect2p|\d+-\d+(cyli|cylo|cylc|disc|edge|ring\d+|rin\d+|chrd|ndis))$/.test(base)) return;
    const existing = lookupExactRawDat(k);
    if (existing) {
      if (!visitedLoaded.has(existing.key)) {
        visitedLoaded.add(existing.key);
        scanLinesForRefs(existing.lines);
      }
      return;
    }
    // BrickLink-numbered prints (3626cpb1965, bl_3626cpb1211) may be hosted on UnOfficial mirrors —
    // only fall back to the unprinted base mold once the exact print has 404'd this session.
    if (!k.includes('/') && /(?:(?:pb|ps|pat|pr)\d{3,}|_torso$)/i.test(k) && notFoundDatCache.has(k)) {
      const fbs = getPartIdFallbacks(k);
      if (fbs.length > 0) {
        enqueue(fbs[0]);
        return;
      }
    }
    queued.add(k);
    queue.push(k);
  };

  if (parsedOverride) {
    for (const p of (parsedOverride.parts || [])) {
      const leaves = p.children && p.children.length > 0 ? p.children : [p];
      for (const lf of leaves) {
        if (lf?.p) enqueue(lf.p);
      }
    }
  } else if (state.model) {
    for (const { step } of getAllSteps(state.model)) {
      for (const p of step.parts) {
        const leaves = p.children && p.children.length > 0 ? p.children : [p];
        for (const lf of leaves) {
          if (lf?.p) enqueue(lf.p);
        }
      }
    }
  }

  return { queue, texQueue, scanLinesForRefs };
}

function hasMissingPartsToFetch() {
  if (!state.model) return false;
  const { queue, texQueue } = collectMissingFetchTargets();
  return queue.length > 0 || texQueue.length > 0;
}

async function fetchPartsOnline(opts = {}) {
  const mode = opts.mode || 'model_missing'; // 'model_missing' | 'pack' | 'custom_ids'
  const silent = Boolean(opts.silent);
  const parsedOverride = opts.parsed || null;
  const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : null;
  const label = opts.label || (mode === 'model_missing' ? 'missing model parts' : 'selected parts');
  const maxFiles = opts.maxFiles || 2500;

  if (fetchPartsInFlight) {
    if (!silent) showToast('A library download is already in progress.');
    return { fetchedParts: 0, fetchedHelpers: 0, fetched: 0, fetchedTex: 0, processed: 0, total: 0, networkBlocked: false, alreadyLoaded: false, canceled: false, busy: true };
  }

  // Never silently download an arbitrary starter set when asked to fetch missing model parts with no model loaded!
  if (mode === 'model_missing' && !parsedOverride && !state.model) {
    if (!silent) {
      showToast('No model is loaded. Choose a starter pack, enter part IDs, or import complete.zip.');
    }
    return { fetchedParts: 0, fetchedHelpers: 0, fetched: 0, fetchedTex: 0, processed: 0, total: 0, networkBlocked: false, alreadyLoaded: true, canceled: false };
  }

  const rootPartIds = [];
  if (parsedOverride) {
    for (const pid of collectLeafPartIdsFromParsed(parsedOverride)) {
      if (pid) rootPartIds.push(pid);
    }
  } else if (mode === 'model_missing' && state.model) {
    for (const { step } of getAllSteps(state.model)) {
      for (const p of step.parts) {
        const leaves = p.children && p.children.length > 0 ? p.children : [p];
        for (const lf of leaves) {
          if (lf?.p) rootPartIds.push(lf.p);
        }
      }
    }
  } else if (Array.isArray(opts.partIds)) {
    for (const pid of opts.partIds) {
      if (pid) rootPartIds.push(pid);
    }
  }

  if (rootPartIds.length === 0) {
    if (!silent) showToast('No part IDs to fetch.');
    return { fetchedParts: 0, fetchedHelpers: 0, fetched: 0, fetchedTex: 0, processed: 0, total: 0, networkBlocked: false, alreadyLoaded: true, canceled: false };
  }

  fetchPartsInFlight = true;
  fetchCancelRequested = false;
  activeFetchAbortCtrl = typeof AbortController !== 'undefined' ? new AbortController() : null;

  const progWrap = document.getElementById('libProgressWrap');
  const progLabel = document.getElementById('libProgressLabel');
  const progPct = document.getElementById('libProgressPct');
  const progBar = document.getElementById('libProgressBar');
  const cancelBtn = document.getElementById('libCancelOpBtn');

  if (!silent && progWrap) {
    progWrap.classList.remove('hidden');
    if (progLabel) progLabel.textContent = `Checking ${label}…`;
    if (progPct) progPct.textContent = '0%';
    if (progBar) progBar.style.width = '0%';
    if (cancelBtn) {
      cancelBtn.classList.remove('hidden');
      cancelBtn.disabled = false;
      cancelBtn.textContent = 'Cancel';
    }
  }
  if (!silent || parsedOverride) {
    // Manual or pre-import trigger clears session 404 cache so switching mirrors or reconnecting retries cleanly
    notFoundDatCache.clear();
  }
  if (onProgress) onProgress({ phase: 'scan', fetched: 0, fetchedTex: 0, processed: 0, total: 0, pct: 0 });

  const mirrors = getSelectedMirrorConfigs();
  const db = await openSessionDB().catch(() => null);
  let fetchedParts = 0;
  let fetchedHelpers = 0;

  try {
    const res = await fetchLDrawDependencyGraph({
      rootPartIds,
      mirrors,
      getDirectLoadedLines: getDirectLoadedDatLines,
      getFallbacks: getPartIdFallbacks,
      hasTexture: (texName) => Boolean(textureStore.lookupByName(texName)),
      notFoundCache: notFoundDatCache,
      onDatLoaded: (storeKey, _reqKey, text) => {
        registerUserLibDat(storeKey, text);
        const kind = classifyDatEntryKind(storeKey, userLibRaw.get(storeKey), userLibTitles.get(storeKey));
        if (kind === 'part') fetchedParts++;
        else fetchedHelpers++;
      },
      onTextureLoaded: (texName, b64) => {
        const normName = normalizeTextureName(texName) || texName;
        textureStore.registerBase64Texture(b64, { name: normName, source: 'library' });
      },
      onBatchComplete: (datBatch, texBatch) => persistLibraryBatchToDb(db, datBatch, texBatch),
      onProgress: ({ fetched, texturesFetched = 0, processed, total }) => {
        const pct = Math.min(99, Math.round((processed / Math.max(1, total)) * 100));
        if (!silent) {
          const helperTxt = fetchedHelpers > 0 ? ` + ${fetchedHelpers} subparts` : '';
          if (progLabel) progLabel.textContent = `Fetching ${label}: ${fetchedParts} part${fetchedParts === 1 ? '' : 's'}${helperTxt} (${processed}/${total} files)…`;
          if (progPct) progPct.textContent = pct + '%';
          if (progBar) progBar.style.width = pct + '%';
        }
        if (onProgress) {
          onProgress({ phase: 'parts', fetched, fetchedTex: texturesFetched, processed, total, pct });
        }
      },
      concurrency: 16,
      maxQueue: maxFiles,
      timeoutMs: 8000,
      signal: activeFetchAbortCtrl?.signal,
    });

    if (res.alreadyComplete) {
      if (!silent) {
        showToast(mode === 'model_missing'
          ? 'All parts in this model already have exact 3D shapes loaded!'
          : 'All requested parts are already saved in your Bricks Library!');
      }
      return { fetchedParts: 0, fetchedHelpers: 0, fetched: 0, fetchedTex: 0, processed: 0, total: 0, networkBlocked: false, alreadyLoaded: true, canceled: false };
    }

    if (res.networkBlocked) {
      if (!silent) showToast('Online fetch is blocked or offline. Use Import .zip / .dat for offline libraries.');
      return { fetchedParts: 0, fetchedHelpers: 0, fetched: res.fetched, fetchedTex: res.texturesFetched || 0, processed: res.processed, total: res.total, networkBlocked: true, alreadyLoaded: false, canceled: false };
    }

    await textureStore.predecodeAllPending();
    const totalDatFetched = fetchedParts + fetchedHelpers;
    const fetchedTex = res.texturesFetched || 0;
    if (totalDatFetched > 0 || fetchedTex > 0) {
      invalidateLibraryRenderCaches();
      updateLibraryStatusUI();
      if (!parsedOverride && state.model) {
        if (totalDatFetched > 0 && state.model._parsed) {
          const nextPlan = refreshSubdivisionPlanForParsed(state.model._parsed, state.model._subdivisionPlan || null);
          state.model = buildManualFromParsed(state.model._parsed, state.model._mode || 'auto', nextPlan);
          if (lastSourceRecord && nextPlan) {
            lastSourceRecord = { ...lastSourceRecord, subdivisionPlan: nextPlan };
            dbPut('lastModel', lastSourceRecord);
          }
        }
        computeModelDiagnostics();
        renderAll();
      }
    }
    if (onProgress) onProgress({ phase: 'done', fetched: res.fetched, fetchedTex, processed: res.processed, total: res.total, pct: 100 });
    if (!silent) {
      const totalFetched = totalDatFetched + fetchedTex;
      if (fetchCancelRequested || res.aborted) {
        showToast(totalDatFetched > 0
          ? `Canceled download. Saved ${fetchedParts} part${fetchedParts === 1 ? '' : 's'}${fetchedHelpers > 0 ? ` (+${fetchedHelpers} subparts/primitives)` : ''} so far.`
          : 'Download canceled.');
      } else if (totalFetched > 0) {
        const helperPart = fetchedHelpers > 0 ? ` (+${fetchedHelpers} subpart${fetchedHelpers === 1 ? '' : 's'}/primitive${fetchedHelpers === 1 ? '' : 's'})` : '';
        const texPart = fetchedTex > 0 ? ` and ${fetchedTex} decal texture${fetchedTex === 1 ? '' : 's'}` : '';
        showToast(`Fetched ${fetchedParts} part${fetchedParts === 1 ? '' : 's'}${helperPart}${texPart} from public LDraw library.`);
      } else {
        showToast('No matching parts found at that public source.');
      }
    }
    return { fetchedParts, fetchedHelpers, fetched: res.fetched, fetchedTex, processed: res.processed, total: res.total, networkBlocked: false, alreadyLoaded: false, canceled: Boolean(fetchCancelRequested || res.aborted) };
  } finally {
    fetchPartsInFlight = false;
    fetchCancelRequested = false;
    activeFetchAbortCtrl = null;
    if (!silent && progWrap) progWrap.classList.add('hidden');
    syncMenuControls();
  }
}

async function fetchMissingPartsOnline(fetchOpts = {}) {
  return fetchPartsOnline({
    mode: 'model_missing',
    silent: Boolean(fetchOpts && fetchOpts.silent),
    parsed: fetchOpts && fetchOpts.parsed ? fetchOpts.parsed : null,
    onProgress: fetchOpts && typeof fetchOpts.onProgress === 'function' ? fetchOpts.onProgress : null,
    label: fetchOpts?.parsed?.title
      ? `${fetchOpts.parsed.title} parts`
      : (state.model?.title ? `${state.model.title} parts` : 'missing model parts'),
  });
}

// ---- DEDICATED BRICKS LIBRARY SCREEN (BROWSE, SEARCH, 3D PREVIEW, FETCH & MANAGE) ----
const LIB_THUMB_SIZE = 320;
const LIB_THUMB_AZ = 34;
const LIB_THUMB_EL = 22;
const LIB_INSPECTOR_SIZE = 880;

function renderPartPreviewDataUrl(partId, colorId, size = LIB_THUMB_SIZE, az = 38, el = 24) {
  const cacheKey = `${partId}:${colorId}:${size}:${az}:${el}`;
  if (libThumbCache.has(cacheKey)) return libThumbCache.get(cacheKey);
  const rawPart = { id: `lib_${partId}`, p: partId, c: colorId, x: 0, y: 0, z: 0, r: R_ID };
  const samplePart = normalizeCompositeThumbPart(rawPart, (pid) => resolvePart(pid).name, computeWorldBox);
  const mesh = buildMeshBuffers([], [samplePart], {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    heroQuality: true,
    accent: '#1a73e8',
  });
  snapshotEngine.draw(mesh, size, size, az, el, 1.0, 0, {
    tightFit: true,
    heroShading: true,
    lineAlpha: 0.24,
  });
  const url = snapshotCanvas.toDataURL('image/png');
  if (libThumbCache.size > 320) {
    const oldestKey = libThumbCache.keys().next().value;
    if (oldestKey !== undefined) libThumbCache.delete(oldestKey);
  }
  libThumbCache.set(cacheKey, url);
  return url;
}

function getOrBuildLibPreviewMesh(partId, colorId) {
  const key = `${partId}:${colorId}`;
  if (libPreviewMeshCache.key === key && libPreviewMeshCache.mesh) {
    return libPreviewMeshCache.mesh;
  }
  const rawPart = { id: `lib_${partId}`, p: partId, c: colorId, x: 0, y: 0, z: 0, r: R_ID };
  const samplePart = normalizeCompositeThumbPart(rawPart, (pid) => resolvePart(pid).name, computeWorldBox);
  const mesh = buildMeshBuffers([], [samplePart], {
    highlightNew: false,
    fadePrev: false,
    showArrows: false,
    heroQuality: true,
    accent: '#1a73e8',
  });
  libPreviewMeshCache = { key, mesh };
  return mesh;
}

function drawLibPreviewCanvas(partId, colorId, hiRes = true) {
  const canvas = document.getElementById('libPreviewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const renderSize = hiRes ? LIB_INSPECTOR_SIZE : 440;
  const mesh = getOrBuildLibPreviewMesh(partId, colorId);
  snapshotEngine.draw(mesh, renderSize, renderSize, libUiState.previewAz, libUiState.previewEl, 1.0, 0, {
    tightFit: true,
    heroShading: true,
    lineAlpha: 0.24,
  });
  if (canvas.width !== renderSize || canvas.height !== renderSize) {
    canvas.width = renderSize;
    canvas.height = renderSize;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(snapshotCanvas, 0, 0, renderSize, renderSize, 0, 0, canvas.width, canvas.height);
}

function stopLibThumbQueue() {
  libThumbQueue = [];
  if (libThumbRafId) {
    cancelAnimationFrame(libThumbRafId);
    libThumbRafId = 0;
  }
  if (libThumbObserver) {
    libThumbObserver.disconnect();
    libThumbObserver = null;
  }
  if (libScrollObserver) {
    libScrollObserver.disconnect();
    libScrollObserver = null;
  }
}

function flushLibThumbQueue() {
  libThumbRafId = 0;
  if (!isBricksLibraryModalOpen() || libUiState.tab !== 'browse') {
    libThumbQueue = [];
    return;
  }
  const budget = 4;
  let rendered = 0;
  while (libThumbQueue.length > 0 && rendered < budget) {
    const imgEl = libThumbQueue.shift();
    if (!imgEl || !imgEl.isConnected || imgEl.dataset.loaded === '1') continue;
    const pid = imgEl.dataset.partId;
    if (!pid) continue;
    const rawCol = Number(imgEl.dataset.colorId);
    const col = Number.isFinite(rawCol) ? rawCol : getEffectivePreviewColorForPart(pid);
    try {
      imgEl.src = renderPartPreviewDataUrl(pid, col, LIB_THUMB_SIZE, LIB_THUMB_AZ, LIB_THUMB_EL);
      imgEl.dataset.loaded = '1';
      imgEl.classList.remove('opacity-0');
    } catch (_) {}
    rendered++;
  }
  if (libThumbQueue.length > 0) {
    libThumbRafId = requestAnimationFrame(flushLibThumbQueue);
  }
}

function enqueueLibThumbImg(imgEl) {
  if (!imgEl || imgEl.dataset.loaded === '1') return;
  const pid = imgEl.dataset.partId;
  if (!pid) return;
  const rawCol = Number(imgEl.dataset.colorId);
  const col = Number.isFinite(rawCol) ? rawCol : getEffectivePreviewColorForPart(pid);
  const cacheKey = `${pid}:${col}:${LIB_THUMB_SIZE}:${LIB_THUMB_AZ}:${LIB_THUMB_EL}`;
  if (libThumbCache.has(cacheKey)) {
    imgEl.src = libThumbCache.get(cacheKey);
    imgEl.dataset.loaded = '1';
    imgEl.classList.remove('opacity-0');
    return;
  }
  libThumbQueue.push(imgEl);
  if (!libThumbRafId) {
    libThumbRafId = requestAnimationFrame(flushLibThumbQueue);
  }
}

function observeLibThumbImgs(imgs, scrollRoot) {
  if (!imgs.length) return;
  if (typeof IntersectionObserver !== 'undefined') {
    if (!libThumbObserver) {
      libThumbObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            libThumbObserver?.unobserve(entry.target);
            enqueueLibThumbImg(entry.target);
          }
        }
      }, { root: scrollRoot || null, rootMargin: '140px 0px' });
    }
    for (const img of imgs) libThumbObserver.observe(img);
  } else {
    for (const img of imgs) enqueueLibThumbImg(img);
  }
}

function getSourceBadgeHtml(item) {
  if (item.isMissingInModel) {
    return '<span class="px-1.5 py-0.5 rounded-md text-xs font-bold bg-[var(--danger-soft)] text-[var(--danger)]">Missing</span>';
  }
  if (item.primarySource === 'embedded') {
    return '<span class="px-1.5 py-0.5 rounded-md text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">.io</span>';
  }
  if (item.primarySource === 'saved') {
    return '<span class="px-1.5 py-0.5 rounded-md text-xs font-bold bg-[var(--primary-soft)] text-[var(--primary)]">LDraw</span>';
  }
  if (item.primarySource === 'official') {
    return '<span class="px-1.5 py-0.5 rounded-md text-xs font-semibold bg-sky-500/12 text-sky-700 dark:text-sky-300">Online</span>';
  }
  if (item.primarySource === 'unofficial') {
    return '<span class="px-1.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">Unofficial</span>';
  }
  return '<span class="px-1.5 py-0.5 rounded-md text-xs font-semibold bg-black/6 dark:bg-white/10 text-[var(--muted-foreground)]">Built-in</span>';
}

const LIB_MODEL_MOSAIC_BG = 'conic-gradient(#c91a09 0 25%, #0055bf 25% 50%, #f2cd37 50% 75%, #237841 75% 100%)';

function getSwatchStyleAttr(col) {
  if (!col) return 'background:#c91a09';
  if (col.alpha !== undefined) {
    return `background:linear-gradient(135deg, ${col.hex}cc 0%, ${col.hex}88 55%, #ffffffaa 100%)`;
  }
  return `background:${col.hex}`;
}

function formatColorReadoutHtml(colorMode) {
  if (colorMode === 'model' && state.model) {
    return `<span class="inline-flex items-center gap-1.5 min-w-0"><span class="w-3 h-3 rounded-full border border-black/25 dark:border-white/25 shrink-0" style="background:${LIB_MODEL_MOSAIC_BG}"></span><span class="font-semibold text-[var(--foreground)] truncate">Model colors</span></span><span class="shrink-0">Per-part from model</span>`;
  }
  const colId = typeof colorMode === 'number' && Number.isFinite(colorMode) ? colorMode : 4;
  const col = COLORS[colId] || COLORS[4];
  const { modelColorCounts } = getLibrarySnapshot();
  const inModelCount = modelColorCounts?.get(colId) || 0;
  const countNote = inModelCount > 0 ? ` · ${inModelCount.toLocaleString()} in model` : '';
  return `<span class="inline-flex items-center gap-1.5 min-w-0"><span class="w-3 h-3 rounded-full border border-black/25 dark:border-white/25 shrink-0" style="${getSwatchStyleAttr(col)}"></span><span class="font-semibold text-[var(--foreground)] truncate">${escHtml(col?.name || `Color ${colId}`)}</span></span><span class="font-mono shrink-0">#${colId}${escHtml(countNote)}</span>`;
}

function setLibColorPickerOpen(open) {
  libUiState.colorPickerOpen = Boolean(open);
  const popover = document.getElementById('libColorPopover');
  const btn = document.getElementById('libColorPickerBtn');
  if (popover) popover.classList.toggle('hidden', !libUiState.colorPickerOpen);
  if (btn) btn.setAttribute('aria-expanded', libUiState.colorPickerOpen ? 'true' : 'false');
  if (libUiState.colorPickerOpen) {
    renderLibColorSwatches();
    const searchEl = document.getElementById('libColorSearchInput');
    if (searchEl) {
      searchEl.value = libUiState.colorQuery;
      requestAnimationFrame(() => searchEl.focus());
    }
  }
}

function applyLibPreviewColor(nextColor, closeAfter = true) {
  if (nextColor !== libUiState.previewColor) {
    libUiState.previewColor = nextColor;
    renderLibBrowseTab(false);
    renderLibPreviewInspector();
  }
  if (closeAfter) {
    setLibColorPickerOpen(false);
  }
  renderLibColorSwatches();
}

function renderLibColorSwatches() {
  const btnSwatch = document.getElementById('libColorBtnSwatch');
  const btnLabel = document.getElementById('libColorBtnLabel');
  const popover = document.getElementById('libColorPopover');
  const btn = document.getElementById('libColorPickerBtn');
  const isModelMode = libUiState.previewColor === 'model' && Boolean(state.model);
  const activeColId = typeof libUiState.previewColor === 'number' ? libUiState.previewColor : 4;
  const activeCol = COLORS[activeColId] || COLORS[4];

  if (btnSwatch) {
    btnSwatch.setAttribute('style', isModelMode ? `background:${LIB_MODEL_MOSAIC_BG}` : getSwatchStyleAttr(activeCol));
  }
  if (btnLabel) {
    btnLabel.textContent = isModelMode ? 'Model colors' : (activeCol?.name || `Color ${activeColId}`);
  }
  if (btn) {
    btn.setAttribute('aria-expanded', libUiState.colorPickerOpen ? 'true' : 'false');
  }
  if (!popover || !libUiState.colorPickerOpen) return;

  const { modelColorCounts } = getLibrarySnapshot();
  const modelModeWrap = document.getElementById('libColorModelModeWrap');
  if (modelModeWrap) {
    if (state.model) {
      modelModeWrap.classList.remove('hidden');
      modelModeWrap.innerHTML = `
        <button type="button" data-lib-color="model" class="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${isModelMode ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]' : 'border-[var(--border)] bg-[var(--surface-sunken)] hover:border-[var(--primary-border)] text-[var(--foreground)]'}">
          <span class="inline-flex items-center gap-2 min-w-0">
            <span class="w-4 h-4 rounded-full border border-black/25 dark:border-white/25 shrink-0" style="background:${LIB_MODEL_MOSAIC_BG}"></span>
            <span class="truncate">Match model colors</span>
          </span>
          <span class="text-[11px] font-normal text-[var(--muted-foreground)] shrink-0">${isModelMode ? 'Active' : 'Auto'}</span>
        </button>
      `;
    } else {
      modelModeWrap.classList.add('hidden');
      modelModeWrap.innerHTML = '';
    }
  }

  const sectionsEl = document.getElementById('libColorPaletteSections');
  const readoutEl = document.getElementById('libColorHoverReadout');
  const sections = buildLibraryColorPalette(COLORS, {
    modelColorCounts: state.model ? modelColorCounts : null,
    query: libUiState.colorQuery,
  });

  if (sectionsEl) {
    if (sections.length === 0) {
      sectionsEl.innerHTML = `<div class="py-6 text-center text-xs text-[var(--muted-foreground)]">No LDraw colors matching “${escHtml(libUiState.colorQuery)}”</div>`;
    } else {
      sectionsEl.innerHTML = sections.map((sec) => {
        const swatches = sec.colors.map((c) => {
          const active = !isModelMode && libUiState.previewColor === c.id;
          const title = `${c.name} (#${c.id})${c.countInModel ? ` — ${c.countInModel} in model` : ''}`;
          return `<button type="button" data-lib-color="${c.id}" title="${escHtml(title)}" aria-label="${escHtml(title)}" class="w-6 h-6 rounded-md border transition cursor-pointer ${active ? 'ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--card)] scale-110 border-white/90 z-10' : 'border-black/25 dark:border-white/25 hover:scale-110'}" style="${getSwatchStyleAttr(c)}"></button>`;
        }).join('');
        return `
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>${escHtml(sec.label)}</span>
              <span class="font-mono font-normal">${sec.colors.length}</span>
            </div>
            <div class="grid grid-cols-10 gap-1.5">${swatches}</div>
          </div>
        `;
      }).join('');
    }
  }

  if (readoutEl) {
    readoutEl.innerHTML = formatColorReadoutHtml(isModelMode ? 'model' : activeColId);
  }

  popover.querySelectorAll('button[data-lib-color]').forEach((swBtn) => {
    const rawVal = swBtn.getAttribute('data-lib-color');
    const parsedVal = rawVal === 'model' ? 'model' : Number(rawVal);
    swBtn.onclick = () => {
      applyLibPreviewColor(parsedVal, true);
    };
    swBtn.onmouseenter = () => {
      if (readoutEl) readoutEl.innerHTML = formatColorReadoutHtml(parsedVal);
    };
    swBtn.onmouseleave = () => {
      if (readoutEl) readoutEl.innerHTML = formatColorReadoutHtml(isModelMode ? 'model' : activeColId);
    };
  });
}

function renderLibPreviewInspector() {
  const pane = document.getElementById('libPreviewPane');
  const emptyEl = document.getElementById('libPreviewEmpty');
  const detailEl = document.getElementById('libPreviewDetail');
  const canvasEl = document.getElementById('libPreviewCanvas');
  const loadingEl = document.getElementById('libPreviewLoading');
  const hintEl = document.getElementById('libPreviewOrbitHint');
  const metaEl = document.getElementById('libPreviewMeta');
  const actionsEl = document.getElementById('libPreviewActions');
  if (!pane || !emptyEl || !detailEl || !canvasEl || !metaEl || !actionsEl) return;

  const { items } = getLibrarySnapshot();
  const item = libUiState.selectedId ? items.find((x) => x.id === libUiState.selectedId) : null;

  if (!item) {
    emptyEl.classList.remove('hidden');
    detailEl.classList.add('hidden');
    // On mobile, keep inspector collapsed when nothing is selected
    pane.classList.add('hidden');
    pane.classList.add('md:flex');
    return;
  }

  pane.classList.remove('hidden');
  pane.classList.add('flex');
  emptyEl.classList.add('hidden');
  detailEl.classList.remove('hidden');

  const effectiveColor = getEffectivePreviewColorForPart(item.id);
  const onlineOnly = isOnlineOnlyItem(item);
  if (onlineOnly) {
    const ctx = canvasEl.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (hintEl) hintEl.classList.add('hidden');
    // Selecting a catalog-only part downloads its exact geometry (once) and re-renders the preview.
    if (!fetchPartsInFlight && !libAutoFetchAttempted.has(item.id)) {
      libAutoFetchAttempted.add(item.id);
      void fetchPartsOnline({ mode: 'custom_ids', partIds: [item.id], label: `part ${item.id}` }).then(() => {
        if (isBricksLibraryModalOpen()) renderBricksLibraryModal(false);
      });
    }
  } else {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (hintEl) hintEl.classList.remove('hidden');
    try {
      drawLibPreviewCanvas(item.id, effectiveColor, true);
    } catch (_) {}
  }

  const sourceLabels = [];
  if (item.sources.includes('embedded')) sourceLabels.push('<span class="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300">Embedded (.io)</span>');
  if (item.sources.includes('saved')) sourceLabels.push('<span class="px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--primary-soft)] text-[var(--primary)]">Saved LDraw .dat</span>');
  if (item.sources.includes('builtin')) sourceLabels.push('<span class="px-2 py-0.5 rounded-md text-xs font-semibold bg-black/6 dark:bg-white/10 text-[var(--muted-foreground)]">Built-in Shape</span>');
  if (item.sources.includes('official')) sourceLabels.push('<span class="px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-500/12 text-sky-700 dark:text-sky-300">Official LDraw Library</span>');
  if (item.sources.includes('unofficial')) sourceLabels.push('<span class="px-2 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300">LDraw Unofficial &amp; Studio</span>');
  if (item.isMissingInModel) sourceLabels.push('<span class="px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--danger-soft)] text-[var(--danger)]">Missing in Model</span>');
  else if (item.inCurrentModel) sourceLabels.push('<span class="px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--success-soft)] text-[var(--success)]">In Current Model</span>');

  const kindLabel = item.kind === 'part' ? 'Part' : item.kind === 'subpart' ? 'Subpart' : 'Primitive';
  const colorObj = COLORS[effectiveColor] || COLORS[4];
  const colorName = colorObj?.name || `Color ${effectiveColor}`;
  const partModelColors = getPartModelColorList(item.id);
  const modelColorsHtml = partModelColors.length > 0
    ? `
      <div class="space-y-1.5 pt-1">
        <div class="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Colors in model (${partModelColors.length})</div>
        <div class="flex items-center gap-1.5 flex-wrap">
          ${partModelColors.map((mc) => {
            const cDef = COLORS[mc.id];
            const isSel = effectiveColor === mc.id;
            return `<button type="button" data-inspector-color="${mc.id}" title="${escHtml(`${cDef?.name || `Color ${mc.id}`} (#${mc.id}) — ×${mc.count} in model`)}" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[11px] font-mono transition cursor-pointer ${isSel ? 'border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] font-bold' : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-[var(--primary-border)]'}"><span class="w-3 h-3 rounded-full border border-black/25 dark:border-white/25 shrink-0" style="${getSwatchStyleAttr(cDef)}"></span><span>×${mc.count}</span></button>`;
          }).join('')}
        </div>
      </div>
    `
    : '';
  const onlineHint = onlineOnly
    ? `<div class="text-xs text-[var(--muted-foreground)] pt-0.5">${fetchPartsInFlight ? 'Downloading exact 3D shape…' : 'Exact 3D shape not downloaded yet — it\u2019s fetched on demand from the online library.'}</div>`
    : '';

  metaEl.innerHTML = `
    <div class="font-bold text-[13px] leading-snug break-words">${escHtml(item.name)}</div>
    <div class="flex items-center gap-1.5 flex-wrap">
      <span class="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-black/6 dark:bg-white/10">${escHtml(item.id)}.dat</span>
      <span class="text-xs text-[var(--muted-foreground)] capitalize">${escHtml(kindLabel)} · ${escHtml(item.category)}</span>
    </div>
    <div class="flex items-center gap-1 flex-wrap pt-0.5">${sourceLabels.join('')}</div>
    ${onlineHint}
    ${modelColorsHtml}
    <div class="text-xs text-[var(--muted-foreground)] pt-0.5 flex items-center gap-1.5 flex-wrap">
      <span>Preview:</span>
      <button type="button" id="libInspectorColorBtn" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary-border)] text-[var(--foreground)] font-semibold transition cursor-pointer" title="Choose from all 150+ LDraw preview colors">
        <span class="w-3 h-3 rounded-full border border-black/25 dark:border-white/25 shrink-0" style="${getSwatchStyleAttr(colorObj)}"></span>
        <span>${escHtml(colorName)}</span>
        <span class="font-mono text-[10px] text-[var(--muted-foreground)]">#${effectiveColor}</span>
      </button>
      ${item.subpartRefCount > 0 ? `<span>· ${item.subpartRefCount} subfile ref${item.subpartRefCount === 1 ? '' : 's'}</span>` : ''}
    </div>
  `;

  metaEl.querySelectorAll('button[data-inspector-color]').forEach((cBtn) => {
    cBtn.onclick = () => {
      const nextCol = Number(cBtn.getAttribute('data-inspector-color'));
      if (Number.isFinite(nextCol)) applyLibPreviewColor(nextCol, false);
    };
  });
  const inspColorBtn = metaEl.querySelector('#libInspectorColorBtn');
  if (inspColorBtn) {
    inspColorBtn.onclick = (e) => {
      e.stopPropagation();
      setLibColorPickerOpen(true);
    };
  }

  const actionButtons = [];
  if (item.sources.includes('embedded') && !item.sources.includes('saved')) {
    actionButtons.push(`
      <button id="libPreviewSaveEmbeddedBtn" class="w-full py-2 px-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:opacity-95 transition cursor-pointer">
        Save ${escHtml(item.id)}.dat to Local Library
      </button>
    `);
  } else if (!item.sources.includes('saved')) {
    actionButtons.push(`
      <button id="libPreviewFetchBtn" class="w-full py-2 px-3 rounded-xl bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold hover:opacity-95 transition cursor-pointer">
        Fetch Exact ${escHtml(item.id)}.dat Online
      </button>
    `);
  }
  if (item.sources.includes('saved')) {
    const removePartNotice = getLibraryRemovePartDestructiveNotice({
      partId: item.id,
      usedInModel: Boolean(item.usedInModel),
      hasEmbeddedCopy: item.sources.includes('embedded'),
    });
    actionButtons.push(`
      <button id="libPreviewRemoveBtn" class="w-full py-2.5 px-3 rounded-md border border-[var(--danger)]/40 bg-[var(--danger-soft)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white font-semibold transition-colors cursor-pointer">
        Remove ${escHtml(item.id)}.dat from Saved Library
      </button>
      ${renderDestructiveNoticeHtml(removePartNotice, { compact: true })}
    `);
  }
  actionsEl.innerHTML = actionButtons.join('');

  const saveEmbeddedBtn = actionsEl.querySelector('#libPreviewSaveEmbeddedBtn');
  if (saveEmbeddedBtn) {
    saveEmbeddedBtn.onclick = async () => {
      const savedCount = await saveEmbeddedPartToLocalLibrary(item.id);
      if (savedCount > 0) {
        showToast(`Saved ${item.id}.dat${savedCount > 1 ? ` (+${savedCount - 1} subfiles)` : ''} to Local Bricks Library.`);
      }
      renderBricksLibraryModal(false);
    };
  }
  const fetchOneBtn = actionsEl.querySelector('#libPreviewFetchBtn');
  if (fetchOneBtn) {
    fetchOneBtn.onclick = async () => {
      await fetchPartsOnline({
        mode: 'custom_ids',
        partIds: [item.id],
        label: `part ${item.id}`,
      });
      renderBricksLibraryModal(false);
    };
  }
  const removeOneBtn = actionsEl.querySelector('#libPreviewRemoveBtn');
  if (removeOneBtn) {
    removeOneBtn.onclick = async () => {
      const removedLines = userLibRaw.get(item.id);
      userLibRaw.delete(item.id);
      userLibTitles.delete(item.id);
      if (removedLines) {
        for (const [k, lns] of Array.from(userLibRaw.entries())) {
          if (lns === removedLines) {
            userLibRaw.delete(k);
            userLibTitles.delete(k);
          }
        }
      }
      await dbDelete(item.id, LIB_STORE);
      invalidateLibraryRenderCaches();
      updateLibraryStatusUI();
      if (state.model) {
        computeModelDiagnostics();
        renderAll();
      }
      showToast(`Removed ${item.id}.dat from Saved Bricks Library.`);
      renderBricksLibraryModal(false);
    };
  }
}

async function saveEmbeddedPartToLocalLibrary(rootId) {
  const startKey = normId(rootId);
  if (!startKey || !embeddedDatRaw.has(startKey)) return 0;
  const queue = [startKey];
  const visited = new Set();
  const toSave = [];

  while (queue.length > 0) {
    const k = queue.shift();
    if (!k || visited.has(k)) continue;
    visited.add(k);
    const lines = embeddedDatRaw.get(k);
    if (!lines) continue;
    if (!userLibRaw.has(k)) {
      toSave.push({ key: k, text: lines.join('\n') });
    }
    for (const raw of lines) {
      const tr = raw.trim();
      if (!tr.startsWith('1 ')) continue;
      const tokens = tr.split(/\s+/);
      if (tokens.length < 15) continue;
      const refKey = normId(tokens.slice(14).join(' ').trim());
      if (refKey && !visited.has(refKey) && embeddedDatRaw.has(refKey)) {
        queue.push(refKey);
      } else if (refKey && refKey.includes('/')) {
        const base = refKey.split('/').pop();
        if (base && !visited.has(base) && embeddedDatRaw.has(base)) {
          queue.push(base);
        }
      }
    }
  }

  if (toSave.length === 0) return 0;
  const db = await openSessionDB().catch(() => null);
  for (const entry of toSave) {
    registerUserLibDat(entry.key, entry.text);
    if (db) await dbPut(entry.key, entry.text, LIB_STORE).catch(() => {});
  }
  invalidateLibraryRenderCaches();
  updateLibraryStatusUI();
  return toSave.length;
}

function renderLibBrowseTab(resetLimit = false) {
  if (resetLimit) libUiState.visibleLimit = 48;
  const { items, stats } = getLibrarySnapshot();

  // Render scope filter pills
  const scopeBar = document.getElementById('libScopeFilterBar');
  if (scopeBar) {
    const scopeDefs = [
      { id: 'all', label: 'All', show: true },
      { id: 'saved', label: `Saved (${stats.savedParts.toLocaleString()})`, show: true },
      { id: 'embedded', label: `Embedded .io (${stats.embeddedParts.toLocaleString()})`, show: stats.embeddedParts > 0 },
      { id: 'builtin', label: `Built-in (${stats.builtInParts})`, show: true },
      { id: 'official', label: `Official LDraw (${stats.catalogOfficialParts.toLocaleString()})`, show: stats.catalogOfficialParts > 0 },
      { id: 'unofficial', label: `Unofficial & Studio (${stats.catalogUnofficialParts.toLocaleString()})`, show: stats.catalogUnofficialParts > 0 },
      { id: 'model', label: `In Model (${stats.modelUniqueParts})`, show: Boolean(state.model) },
      { id: 'missing', label: `Missing (${stats.modelMissingShapeCount})`, show: stats.modelMissingShapeCount > 0 },
    ].filter((s) => s.show);

    if (!scopeDefs.some((s) => s.id === libUiState.scope)) {
      libUiState.scope = 'all';
    }

    scopeBar.innerHTML = scopeDefs.map((s) => {
      const active = libUiState.scope === s.id;
      return `<button type="button" data-lib-scope="${s.id}" class="px-2.5 py-1 rounded-md border text-xs font-semibold whitespace-nowrap transition ${active ? 'bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)]' : 'bg-[var(--background)] border-[var(--border)] hover:border-[var(--primary-border)]'}">${escHtml(s.label)}</button>`;
    }).join('');
    scopeBar.querySelectorAll('button[data-lib-scope]').forEach((btn) => {
      btn.onclick = () => {
        libUiState.scope = btn.getAttribute('data-lib-scope') || 'all';
        renderLibBrowseTab(true);
      };
    });
  }

  const filtered = filterLibraryItems(items, {
    query: libUiState.query,
    scope: libUiState.scope,
    category: libUiState.category,
    includeHelpers: libUiState.includeHelpers,
  });

  const summaryEl = document.getElementById('libBrowseSummary');
  const gridEl = document.getElementById('libBrowseGrid');
  const gridWrap = document.getElementById('libBrowseGridWrap');
  const loadMoreWrap = document.getElementById('libLoadMoreWrap');
  const fetchBannerEl = document.getElementById('libSearchFetchBanner');
  if (!gridEl) return;

  if (summaryEl) {
    summaryEl.textContent = filtered.length === 0
      ? 'No matching parts'
      : `${filtered.length.toLocaleString()} part${filtered.length === 1 ? '' : 's'}`;
  }

  // Only offer a direct online fetch banner if the user typed an unlisted part ID that isn't already
  // saved locally, embedded in the current .io model, already shown in search results, or already fetched.
  if (fetchBannerEl) {
    const fetchableId = extractFetchablePartIdFromQuery(libUiState.query);
    const alreadyInResults = Boolean(fetchableId && filtered.some((it) => it.id === fetchableId));
    if (
      fetchableId &&
      !userLibRaw.has(fetchableId) &&
      !embeddedDatRaw.has(fetchableId) &&
      !alreadyInResults &&
      !libAutoFetchAttempted.has(fetchableId)
    ) {
      fetchBannerEl.classList.remove('hidden');
      fetchBannerEl.innerHTML = `
        <div class="text-xs min-w-0">
          <div class="font-bold text-[var(--primary)]">Fetch <span class="font-mono">${escHtml(fetchableId)}.dat</span> from online LDraw library?</div>
          <div class="text-[var(--muted-foreground)]">Not listed in the local catalog — downloads its exact 3D geometry and subparts into your saved library.</div>
        </div>
        <button id="libQuickSearchFetchBtn" class="px-3.5 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold shrink-0 hover:opacity-95 transition cursor-pointer">
          Fetch ${escHtml(fetchableId)} Online
        </button>
      `;
      const qBtn = fetchBannerEl.querySelector('#libQuickSearchFetchBtn');
      if (qBtn) {
        qBtn.onclick = async () => {
          libAutoFetchAttempted.add(fetchableId);
          const res = await fetchPartsOnline({
            mode: 'custom_ids',
            partIds: [fetchableId],
            label: `part ${fetchableId}`,
          });
          if (res.fetchedParts > 0 || userLibRaw.has(fetchableId)) {
            libUiState.selectedId = fetchableId;
          }
          renderBricksLibraryModal(false);
        };
      }
    } else {
      fetchBannerEl.classList.add('hidden');
      fetchBannerEl.innerHTML = '';
    }
  }

  stopLibThumbQueue();
  libCurrentFilteredItems = filtered;
  libRenderedCount = 0;
  if (resetLimit && gridWrap) {
    gridWrap.scrollTop = 0;
  }

  if (filtered.length === 0) {
    gridEl.innerHTML = `
      <div class="col-span-full py-10 text-center space-y-2 text-[var(--muted-foreground)]">
        <div class="font-bold text-sm text-[var(--foreground)]">No parts found</div>
        <p class="text-xs max-w-sm mx-auto leading-relaxed">
          Try a different part ID or name, switch filters above, or go to <b>Fetch &amp; Import</b> to download starter packs or import <b>complete.zip</b>.
        </p>
      </div>
    `;
    if (loadMoreWrap) loadMoreWrap.classList.add('hidden');
    return;
  }

  gridEl.innerHTML = '';
  const initialCount = Math.max(LIB_PAGE_BATCH_SIZE, libUiState.visibleLimit);
  appendLibBrowseBatch(initialCount);

  if (loadMoreWrap && typeof IntersectionObserver !== 'undefined') {
    libScrollObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && libRenderedCount < libCurrentFilteredItems.length) {
          appendLibBrowseBatch(LIB_PAGE_BATCH_SIZE);
        }
      }
    }, { root: gridWrap || null, rootMargin: '280px 0px' });
    libScrollObserver.observe(loadMoreWrap);
  }
}

function renderLibPartCardHtml(item) {
  const selected = libUiState.selectedId === item.id;
  // Catalog-only parts have no local geometry yet — show a download placeholder instead of
  // rendering an approximate box; tapping the card downloads & previews the exact shape.
  const thumbHtml = isOnlineOnlyItem(item)
    ? `<div class="flex flex-col items-center justify-center gap-1 text-[var(--muted-foreground)]" title="Tap to download & preview">
         <svg viewBox="0 0 24 24" class="w-8 h-8 opacity-60" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 8.5a4 4 0 0 1-.5 7.97"/><path d="M12 12v8"/><path d="m9 17 3 3 3-3"/></svg>
         <span class="text-[10px] font-semibold">Tap to preview</span>
       </div>`
    : `<img data-part-id="${escHtml(item.id)}" data-color-id="${getEffectivePreviewColorForPart(item.id)}" alt="${escHtml(item.name)}" class="w-full h-full object-contain opacity-0 transition-opacity duration-150 drop-shadow-[0_3px_6px_rgba(15,23,42,0.12)]" />`;
  return `
    <button type="button" data-lib-part="${escHtml(item.id)}" class="group text-left p-2 rounded-lg border transition flex flex-col gap-1.5 ${selected ? 'border-[var(--primary)] ring-2 ring-[var(--primary-border)] bg-[var(--primary-soft)]' : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary-border)]'}">
      <div class="aspect-square w-full rounded-xl bg-[radial-gradient(circle_at_50%_40%,var(--card)_0%,var(--surface-sunken)_100%)] border border-[var(--border)]/60 relative flex items-center justify-center p-2 overflow-hidden">
        ${thumbHtml}
        <div class="absolute top-1.5 right-1.5">${getSourceBadgeHtml(item)}</div>
      </div>
      <div class="px-0.5 min-w-0 space-y-0.5">
        <div class="font-mono text-xs font-bold truncate">${escHtml(item.id)}</div>
        <div class="text-xs text-[var(--muted-foreground)] leading-tight line-clamp-2 min-h-[26px]">${escHtml(item.name)}</div>
      </div>
    </button>
  `;
}

function appendLibBrowseBatch(batchSize = LIB_PAGE_BATCH_SIZE) {
  const gridEl = document.getElementById('libBrowseGrid');
  const gridWrap = document.getElementById('libBrowseGridWrap');
  const loadMoreWrap = document.getElementById('libLoadMoreWrap');
  const loadMoreBtn = document.getElementById('libLoadMoreBtn');
  if (!gridEl) return;

  const start = libRenderedCount;
  const end = Math.min(libCurrentFilteredItems.length, start + batchSize);
  if (end <= start) {
    if (loadMoreWrap) loadMoreWrap.classList.add('hidden');
    return;
  }

  const batch = libCurrentFilteredItems.slice(start, end);
  const template = document.createElement('template');
  template.innerHTML = batch.map(renderLibPartCardHtml).join('');
  const frag = template.content;

  const newButtons = Array.from(frag.querySelectorAll('button[data-lib-part]'));
  const newImgs = Array.from(frag.querySelectorAll('img[data-part-id]'));

  for (const btn of newButtons) {
    btn.onclick = () => {
      const pid = btn.getAttribute('data-lib-part');
      libUiState.selectedId = pid;
      // Highlight selection without rebuilding the entire grid DOM
      gridEl.querySelectorAll('button[data-lib-part]').forEach((card) => {
        const isSel = card.getAttribute('data-lib-part') === pid;
        card.classList.toggle('border-[var(--primary)]', isSel);
        card.classList.toggle('ring-2', isSel);
        card.classList.toggle('ring-[var(--primary-border)]', isSel);
        card.classList.toggle('bg-[var(--primary-soft)]', isSel);
        card.classList.toggle('border-[var(--border)]', !isSel);
        card.classList.toggle('bg-[var(--background)]', !isSel);
      });
      renderLibPreviewInspector();
    };
  }

  gridEl.appendChild(frag);
  libRenderedCount = end;
  libUiState.visibleLimit = Math.max(libUiState.visibleLimit, libRenderedCount);
  observeLibThumbImgs(newImgs, gridWrap);

  const hasMore = libRenderedCount < libCurrentFilteredItems.length;
  if (loadMoreWrap) {
    loadMoreWrap.classList.toggle('hidden', !hasMore);
  }
  if (loadMoreBtn && hasMore) {
    loadMoreBtn.textContent = 'Loading more parts…';
  }
}

function renderLibManageTab() {
  const { items, stats } = getLibrarySnapshot();

  // 1. Current Model Fetch Card (unambiguous whether a model is loaded or not!)
  const modelCopy = getModelFetchCopy({
    hasModel: Boolean(state.model),
    modelTitle: state.model?.title,
    missingShapeCount: stats.modelMissingShapeCount,
    missingExactDatCount: stats.modelMissingExactDatCount,
  });
  const headingEl = document.getElementById('libModelFetchHeading');
  const descEl = document.getElementById('libModelFetchDesc');
  const fetchModelBtn = document.getElementById('libFetchModelBtn');
  const fetchModelBtnLabel = document.getElementById('libFetchModelBtnLabel');
  const chipsEl = document.getElementById('libModelMissingChips');

  if (headingEl) headingEl.textContent = modelCopy.heading;
  if (descEl) descEl.textContent = modelCopy.description;
  if (fetchModelBtn) fetchModelBtn.disabled = !modelCopy.buttonEnabled || fetchPartsInFlight;
  if (fetchModelBtnLabel) fetchModelBtnLabel.textContent = modelCopy.buttonLabel;

  if (chipsEl) {
    const missingItems = items.filter((it) => it.isMissingInModel);
    if (state.model && missingItems.length > 0) {
      chipsEl.classList.remove('hidden');
      const maxChips = 10;
      const chipHtml = missingItems.slice(0, maxChips).map((it) =>
        `<span class="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-[var(--danger-soft)] text-[var(--danger)] border border-red-500/25">${escHtml(it.id)}.dat</span>`,
      ).join('');
      const moreHtml = missingItems.length > maxChips
        ? `<span class="text-xs font-semibold text-[var(--muted-foreground)]">+${missingItems.length - maxChips} more</span>`
        : '';
      chipsEl.innerHTML = chipHtml + moreHtml;
    } else {
      chipsEl.classList.add('hidden');
      chipsEl.innerHTML = '';
    }
  }

  // 2. Curated Starter Packs Grid
  const allPackIds = getAllStarterPackPartIds();
  const allPackRemaining = allPackIds.filter((id) => !userLibRaw.has(id));
  const fetchAllBtn = document.getElementById('libFetchAllPacksBtn');
  if (fetchAllBtn) {
    fetchAllBtn.disabled = allPackRemaining.length === 0 || fetchPartsInFlight;
    fetchAllBtn.textContent = allPackRemaining.length === 0
      ? `All ${allPackIds.length} Starter Parts Saved ✓`
      : `Fetch All Starter Packs (${allPackRemaining.length} remaining)`;
  }

  const packsGrid = document.getElementById('libStarterPacksGrid');
  if (packsGrid) {
    packsGrid.innerHTML = ONLINE_STARTER_PACKS.map((pack) => {
      const prog = computeStarterPackProgress(pack, (id) => userLibRaw.has(id));
      const done = prog.missingIds.length === 0;
      return `
        <div class="p-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] flex flex-col justify-between gap-2.5">
          <div class="space-y-1">
            <div class="flex items-center justify-between gap-2">
              <span class="font-bold text-[12px]">${escHtml(pack.name)}</span>
              <span class="px-2 py-0.5 rounded-md text-xs font-bold ${done ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-black/6 dark:bg-white/10 text-[var(--muted-foreground)]'}">${prog.savedCount} / ${prog.totalCount} saved</span>
            </div>
            <p class="text-xs text-[var(--muted-foreground)] leading-snug">${escHtml(pack.description)}</p>
          </div>
          <button type="button" data-fetch-pack="${escHtml(pack.id)}" ${done || fetchPartsInFlight ? 'disabled' : ''} class="w-full py-1.5 px-3 rounded-xl font-semibold transition ${done ? 'border border-[var(--success)]/35 bg-[var(--success-soft)] text-[var(--success)] cursor-default' : 'border border-[var(--primary-border)] bg-[var(--primary-soft)] text-[var(--primary)] hover:bg-[var(--primary-soft)] disabled:opacity-45'}">
            ${done ? 'Saved in Library ✓' : `Fetch ${prog.missingIds.length} Part${prog.missingIds.length === 1 ? '' : 's'}`}
          </button>
        </div>
      `;
    }).join('');

    packsGrid.querySelectorAll('button[data-fetch-pack]').forEach((btn) => {
      btn.onclick = async () => {
        const packId = btn.getAttribute('data-fetch-pack');
        const pack = ONLINE_STARTER_PACKS.find((p) => p.id === packId);
        if (!pack) return;
        const prog = computeStarterPackProgress(pack, (id) => userLibRaw.has(id));
        if (!prog.missingIds.length) return;
        await fetchPartsOnline({
          mode: 'pack',
          partIds: prog.missingIds,
          label: `${pack.name} pack`,
        });
        renderBricksLibraryModal(false);
      };
    });
  }

  // 3. Saved Library Storage (Danger Zone — clearly separated from Import!)
  const storageEl = document.getElementById('libStorageSummary');
  const clearBtn = document.getElementById('libClearSavedBtn');
  const confirmWrap = document.getElementById('libClearConfirmWrap');
  const confirmText = document.getElementById('libClearConfirmText');
  const totalStored = stats.savedTotalFiles + stats.savedTextures;
  if (storageEl) {
    if (totalStored === 0) {
      storageEl.textContent = '0 saved files in browser storage';
    } else {
      const partsLabel = `${stats.savedParts.toLocaleString()} part${stats.savedParts === 1 ? '' : 's'}`;
      const helpersLabel = stats.savedHelpers > 0 ? ` + ${stats.savedHelpers.toLocaleString()} subpart${stats.savedHelpers === 1 ? '' : 's'}/primitive${stats.savedHelpers === 1 ? '' : 's'}` : '';
      const texLabel = stats.savedTextures > 0 ? ` · ${stats.savedTextures.toLocaleString()} texture${stats.savedTextures === 1 ? '' : 's'}` : '';
      storageEl.textContent = `${partsLabel}${helpersLabel} (${stats.savedTotalFiles.toLocaleString()} files${texLabel})`;
    }
  }
  if (clearBtn) clearBtn.disabled = totalStored === 0;
  const modelReliantSavedCount = state.model
    ? items.filter((it) => it.usedInModel && it.sources.includes('saved') && !it.sources.includes('embedded')).length
    : 0;
  applyDestructiveNoticeToEl(
    'libClearModelImpactNotice',
    getLibraryClearSavedDestructiveNotice({
      savedFileCount: totalStored,
      modelReliantSavedCount,
    }),
  );
  if (confirmWrap && totalStored === 0) confirmWrap.classList.add('hidden');
  if (confirmText) {
    confirmText.textContent = `Delete all ${stats.savedTotalFiles.toLocaleString()} saved file${stats.savedTotalFiles === 1 ? '' : 's'}${stats.savedTextures > 0 ? ` and ${stats.savedTextures.toLocaleString()} texture${stats.savedTextures === 1 ? '' : 's'}` : ''} from your Bricks Library?`;
  }
}

function renderBricksLibraryModal(resetLimit = false) {
  const { items, stats } = getLibrarySnapshot();

  // Header subtitle & stats pills
  const subtitleEl = document.getElementById('libModalSubtitle');
  if (subtitleEl) {
    const partsBreakdown = stats.savedParts > 0
      ? `${stats.savedParts.toLocaleString()} saved part${stats.savedParts === 1 ? '' : 's'}${stats.savedHelpers > 0 ? ` (+${stats.savedHelpers.toLocaleString()} subparts/primitives)` : ''}`
      : 'No saved LDraw parts yet';
    const catalogTotal = stats.catalogOfficialParts + stats.catalogUnofficialParts;
    const catalogNote = catalogTotal > 0
      ? ` · ${catalogTotal.toLocaleString()} in online catalog`
      : onlinePartsCatalogPromise ? ' · loading online catalog…' : '';
    subtitleEl.textContent = `${partsBreakdown} · ${stats.builtInParts} built-in shapes${stats.embeddedParts > 0 ? ` · ${stats.embeddedParts.toLocaleString()} embedded (.io)` : ''}${catalogNote}`;
  }

  const browseCountEl = document.getElementById('libTabBrowseCount');
  if (browseCountEl) {
    const browsableParts = items.filter((it) => it.kind === 'part').length;
    browseCountEl.textContent = browsableParts.toLocaleString();
  }

  const manageBadgeEl = document.getElementById('libTabManageBadge');
  if (manageBadgeEl) {
    manageBadgeEl.classList.toggle('hidden', stats.modelMissingShapeCount === 0);
    manageBadgeEl.textContent = `${stats.modelMissingShapeCount} missing`;
  }

  const statsPillsEl = document.getElementById('libHeaderStatsPills');
  if (statsPillsEl) {
    const pills = [];
    if (stats.savedParts > 0) {
      pills.push(`<span class="px-2 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] font-semibold">${stats.savedParts.toLocaleString()} saved</span>`);
    }
    if (stats.embeddedParts > 0) {
      pills.push(`<span class="px-2 py-0.5 rounded-md bg-purple-500/12 text-purple-700 dark:text-purple-300 font-semibold">${stats.embeddedParts.toLocaleString()} embedded (.io)</span>`);
    }
    if (stats.modelMissingShapeCount > 0) {
      pills.push(`<span class="px-2 py-0.5 rounded-md bg-[var(--danger-soft)] text-[var(--danger)] font-bold">${stats.modelMissingShapeCount} missing in model</span>`);
    }
    statsPillsEl.innerHTML = pills.join('');
  }

  // Active tab state
  document.querySelectorAll('.lib-tab-btn').forEach((btn) => {
    const active = btn.getAttribute('data-lib-tab') === libUiState.tab;
    btn.classList.toggle('bg-[var(--primary)]', active);
    btn.classList.toggle('text-[var(--primary-foreground)]', active);
    btn.classList.toggle('shadow-xs', active);
    btn.classList.toggle('text-[var(--muted-foreground)]', !active);
  });

  const browsePanel = document.getElementById('libTabBrowse');
  const managePanel = document.getElementById('libTabManage');
  if (browsePanel) browsePanel.classList.toggle('hidden', libUiState.tab !== 'browse');
  if (managePanel) managePanel.classList.toggle('hidden', libUiState.tab !== 'manage');

  if (libUiState.tab === 'browse') {
    renderLibColorSwatches();
    renderLibBrowseTab(resetLimit);
    renderLibPreviewInspector();
  } else {
    stopLibThumbQueue();
    renderLibManageTab();
  }
}

function openBricksLibraryModal(preferredTab = null) {
  closeMenu();
  const confirmWrap = document.getElementById('libClearConfirmWrap');
  if (confirmWrap) confirmWrap.classList.add('hidden');
  const { stats } = getLibrarySnapshot(true);
  if (preferredTab === 'browse' || preferredTab === 'manage') {
    libUiState.tab = preferredTab;
  } else if (stats.modelMissingShapeCount > 0) {
    libUiState.tab = 'manage';
  }
  const modal = document.getElementById('bricksLibraryModal');
  if (modal) modal.classList.remove('hidden');
  void ensureOnlinePartsCatalog();
  renderBricksLibraryModal(true);
}

function closeBricksLibraryModal() {
  stopLibThumbQueue();
  const confirmWrap = document.getElementById('libClearConfirmWrap');
  if (confirmWrap) confirmWrap.classList.add('hidden');
  const modal = document.getElementById('bricksLibraryModal');
  if (modal) modal.classList.add('hidden');
}

// ---- MODEL ERRORS & DIAGNOSTICS ENGINE ----
state.diagnostics = [];
state.seenDiagnosticKeys = new Set();
let errFilter = 'all', errorBannerTimer = null;

function computeModelDiagnostics() {
  const diags = [];
  if (!state.model) {
    state.diagnostics = [];
    state.seenDiagnosticKeys = new Set();
    updateErrorIndicators();
    return;
  }
  const missingByPart = new Map();
  const unknownColors = new Map();
  const allSteps = getMainSteps(state.model);

  for (const { step } of allSteps) {
    if (step.isMinifigPoseStep || (step.isMinifigBuildStep && step.placedInMain)) continue;
    for (const p of step.parts) {
      const leaves = p.children && p.children.length > 0 ? p.children : [p];
      // 1. Check for missing 3D piece shapes
      const missingLeaf = leaves.find(lf => !hasKnownShape(lf.p));
      if (missingLeaf) {
        const k = normId(missingLeaf.p);
        if (!missingByPart.has(k)) missingByPart.set(k, { partId: k, count: 0, steps: new Set() });
        const rec = missingByPart.get(k);
        rec.count++; rec.steps.add(getAbsStepNum(step));
      }
      // 2. Check for unmapped / unknown LDraw color IDs
      for (const lf of leaves) {
        if (!resolveColorInfo(lf.c)) {
          if (!unknownColors.has(lf.c)) unknownColors.set(lf.c, { colorId: lf.c, count: 0, steps: new Set() });
          const rec = unknownColors.get(lf.c);
          rec.count++; rec.steps.add(getAbsStepNum(step));
        }
      }
      // 3. Check for disconnected / floating pieces
      if (p._detachedGap && p._detachedGap > 0) {
        const name = resolvePart(p.p).name;
        const isCompletelyFloating = !isFinite(p._detachedGap);
        diags.push({
          category: 'floating',
          severity: isCompletelyFloating ? 'error' : 'warning',
          title: isCompletelyFloating ? `Floating piece: ${name}` : `Weak connection: ${name}`,
          detail: isCompletelyFloating
            ? (p._floatHeight && p._floatHeight > 0
                ? `Part "${p.p}" in Step ${step.num} is floating ${(p._floatHeight / 20).toFixed(2)} studs above the ground with no nearby parts touching it.`
                : `Part "${p.p}" in Step ${step.num} had no nearby parts touching it and was placed on its own.`)
            : `Part "${p.p}" in Step ${step.num} was ${(p._detachedGap / 20).toFixed(2)} studs away from its nearest neighbor.`,
          stepNum: step.num,
          stepAbsNum: getAbsStepNum(step),
          stepId: step.id,
        });
      }
    }
  }

  for (const rec of missingByPart.values()) {
    const stepArr = Array.from(rec.steps).sort((a, b) => a - b);
    const firstStep = allSteps.find(x => getAbsStepNum(x.step) === stepArr[0])?.step;
    const friendlyName = getHumanPartName(rec.partId);
    const reason = explainMissingPartReason(rec.partId);
    diags.push({
      category: 'missing_shape',
      severity: 'error',
      title: `${friendlyName} (${rec.count}×)`,
      partCode: `${rec.partId}.dat`,
      detail: `${reason} Used in Step${stepArr.length > 1 ? 's' : ''} ${stepArr.slice(0, 5).map(n => `#${n}`).join(', ')}${stepArr.length > 5 ? '…' : ''}.`,
      stepNum: firstStep?.num ?? stepArr[0],
      stepAbsNum: stepArr[0],
      stepId: firstStep?.id || null,
    });
  }

  for (const rec of unknownColors.values()) {
    const stepArr = Array.from(rec.steps).sort((a, b) => a - b);
    const firstStep = allSteps.find(x => getAbsStepNum(x.step) === stepArr[0])?.step;
    diags.push({
      category: 'color',
      severity: 'warning',
      colorId: rec.colorId,
      title: `Unknown LDraw color #${rec.colorId} (${rec.count}×)`,
      detail: `Color ID ${rec.colorId} is not in the color palette and fell back to Light Bluish Gray. First seen in Step #${stepArr[0]}.`,
      stepNum: firstStep?.num ?? stepArr[0],
      stepAbsNum: stepArr[0],
      stepId: firstStep?.id || null,
    });
  }

  state.diagnostics = diags;
  state.seenDiagnosticKeys = pruneSeenDiagnosticKeys(diags, state.seenDiagnosticKeys);
  const errModalEl = document.getElementById('errorsModal');
  const isErrorsModalOpen = Boolean(errModalEl && !errModalEl.classList.contains('hidden'));
  if (isErrorsModalOpen) {
    state.seenDiagnosticKeys = acknowledgeDiagnostics(diags, state.seenDiagnosticKeys);
  }
  updateErrorIndicators();
  updateLibraryStatusUI();
  if (isErrorsModalOpen) renderErrorsModal();
}

function acknowledgeCurrentDiagnostics() {
  if (state.diagnostics.length === 0) return;
  const beforeSize = state.seenDiagnosticKeys.size;
  state.seenDiagnosticKeys = acknowledgeDiagnostics(state.diagnostics, state.seenDiagnosticKeys);
  updateErrorIndicators();
  if (state.seenDiagnosticKeys.size !== beforeSize) {
    scheduleSaveSessionPrefs();
  }
}

function updateErrorIndicators() {
  const totalCount = state.diagnostics.length;
  const badgeCount = getMenuIconErrorBadgeCount(state.diagnostics, state.seenDiagnosticKeys);
  const menuDot = document.getElementById('menuBtnErrorBadge');
  const menuBtn = document.getElementById('menuErrorsBtn');
  const menuPill = document.getElementById('menuErrorCountBadge');
  if (menuDot) {
    menuDot.textContent = formatMenuIconErrorBadge(badgeCount);
    menuDot.classList.toggle('hidden', badgeCount === 0);
  }
  if (menuBtn) {
    menuBtn.classList.toggle('hidden', !state.model || totalCount === 0);
  }
  if (menuPill) {
    menuPill.textContent = String(totalCount);
    menuPill.className = 'px-2 py-0.5 rounded-md text-xs font-bold bg-red-600 text-white';
  }
}

let errorBannerFadeTimer = null;
function dismissErrorBanner(immediate = false) {
  clearTimeout(errorBannerTimer);
  clearTimeout(errorBannerFadeTimer);
  const el = document.getElementById('errorBanner');
  if (!el) return;
  if (immediate || el.classList.contains('hidden')) {
    el.classList.add('hidden');
    el.classList.remove('opacity-0', 'pointer-events-none');
    return;
  }
  el.classList.add('opacity-0', 'pointer-events-none');
  errorBannerFadeTimer = setTimeout(() => {
    el.classList.add('hidden');
    el.classList.remove('opacity-0', 'pointer-events-none');
  }, 300);
}

function showImportErrorBanner() {
  const n = state.diagnostics.length;
  if (n === 0) { dismissErrorBanner(true); return; }
  const txt = document.getElementById('errorBannerText');
  if (txt) txt.textContent = n === 1 ? 'There is 1 issue.' : `There are ${n} issues.`;
  const el = document.getElementById('errorBanner');
  clearTimeout(errorBannerTimer);
  clearTimeout(errorBannerFadeTimer);
  el.classList.remove('hidden', 'opacity-0', 'pointer-events-none');
  errorBannerTimer = setTimeout(() => dismissErrorBanner(false), 4500);
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderErrorsModal() {
  const diags = state.diagnostics;
  const counts = {
    all: diags.length,
    missing_shape: diags.filter(d => d.category === 'missing_shape').length,
    floating: diags.filter(d => d.category === 'floating').length,
    color: diags.filter(d => d.category === 'color').length,
  };
  if (!Object.prototype.hasOwnProperty.call(counts, errFilter)) errFilter = 'all';

  document.getElementById('errModalTitle').textContent = diags.length === 0
    ? 'No Model Issues'
    : `Model Issues (${diags.length})`;

  const tabs = [
    { id: 'all', label: `All (${counts.all})` },
    { id: 'missing_shape', label: `Missing Shapes (${counts.missing_shape})` },
    { id: 'floating', label: `Disconnected (${counts.floating})` },
    { id: 'color', label: `Colors (${counts.color})` },
  ];
  const bar = document.getElementById('errFilterBar');
  bar.innerHTML = tabs.map(t => `
    <button data-ef="${t.id}" class="ef-btn shrink-0 px-3 py-1 rounded-md font-semibold transition ${errFilter === t.id ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--background)] border border-[var(--border)]'}">${t.label}</button>
  `).join('');
  bar.querySelectorAll('.ef-btn').forEach(b => {
    b.onclick = () => {
      errFilter = b.getAttribute('data-ef') || 'all';
      renderErrorsModal();
    };
  });

  const body = document.getElementById('errListBody');
  // Reset scroll offset BEFORE replacing innerHTML so iOS WebKit never leaves the
  // composited scroll layer stranded below shorter tab content (e.g., 22 items -> 1 item).
  body.scrollTop = 0;

  const filtered = errFilter === 'all' ? diags : diags.filter(d => d.category === errFilter);

  if (filtered.length === 0) {
    body.innerHTML = `
      <div class="py-10 text-center space-y-2">
        <div class="w-11 h-11 mx-auto rounded-md bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-lg font-bold">✓</div>
        <div class="font-bold text-sm">Looking clean!</div>
        <p class="text-xs text-[var(--muted-foreground)]">No issues in this category.</p>
      </div>`;
    body.scrollTop = 0;
    requestAnimationFrame(() => { body.scrollTop = 0; });
    return;
  }

  let html = '';
  if (counts.missing_shape > 0 && (errFilter === 'all' || errFilter === 'missing_shape')) {
    html += `
      <div class="p-3 rounded-2xl bg-[var(--primary-soft)] border border-[var(--primary-border)] flex items-center justify-between gap-2 flex-wrap">
        <div class="text-xs">
          <div class="font-bold text-[var(--primary)]">Missing ${counts.missing_shape} piece shape${counts.missing_shape > 1 ? 's' : ''}</div>
          <div class="text-[var(--muted-foreground)]">Fetch missing shapes from the public LDraw library or import <b>complete.zip</b>.</div>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button id="errFetchLibQuick" class="px-3 py-1.5 rounded-md bg-[var(--primary)] text-[var(--primary-foreground)] font-semibold">Fetch Online</button>
          <button id="errImportLibQuick" class="px-3 py-1.5 rounded-md border border-[var(--primary-border)] text-[var(--primary)] bg-[var(--card)] font-semibold">Import .zip</button>
        </div>
      </div>`;
  }

  html += filtered.map(d => {
    const isErr = d.severity === 'error';
    return `
      <div class="p-3 rounded-2xl border border-[var(--border)] bg-[var(--background)] flex items-start justify-between gap-2.5">
        <div class="space-y-1 min-w-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="px-2 py-0.5 rounded-md text-xs font-bold ${isErr ? 'bg-[var(--danger-soft)] text-[var(--danger)]' : 'bg-[var(--warning-soft)] text-[var(--warning)]'}">${isErr ? 'Error' : 'Warning'}</span>
            <span class="font-bold break-words">${escHtml(d.title)}</span>
            ${d.partCode ? `<span class="px-1.5 py-0.5 rounded-md text-xs font-mono bg-black/5 dark:bg-white/10 text-[var(--muted-foreground)] break-all">${escHtml(d.partCode)}</span>` : ''}
          </div>
          <p class="text-xs text-[var(--muted-foreground)] leading-relaxed break-words">${escHtml(d.detail)}</p>
        </div>
        ${d.stepId ? `<button data-jump-step="${escHtml(d.stepId)}" class="jump-step-btn shrink-0 px-2.5 py-1.5 rounded-md border border-[var(--border)] bg-[var(--card)] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)]">Step ${d.stepNum}${d.stepAbsNum && d.stepAbsNum !== d.stepNum ? ` · #${d.stepAbsNum}` : ''} →</button>` : ''}
      </div>`;
  }).join('');

  body.innerHTML = html;
  // Force clean scroll & WebKit compositing sync after DOM update
  body.scrollTop = 0;
  void body.offsetHeight;
  requestAnimationFrame(() => { body.scrollTop = 0; });

  const quickFetch = body.querySelector('#errFetchLibQuick');
  if (quickFetch) quickFetch.onclick = async () => {
    document.getElementById('errorsModal').classList.add('hidden');
    openBricksLibraryModal('manage');
    await fetchMissingPartsOnline();
  };
  const quickLib = body.querySelector('#errImportLibQuick');
  if (quickLib) quickLib.onclick = () => {
    document.getElementById('errorsModal').classList.add('hidden');
    openBricksLibraryModal('manage');
    document.getElementById('libImportInput').click();
  };
  body.querySelectorAll('.jump-step-btn').forEach(btn => {
    btn.onclick = () => {
      const sid = btn.getAttribute('data-jump-step');
      const pIdx = state.pages.findIndex(pg => pg.slots?.some(sl => sl.step.id === sid));
      if (pIdx >= 0) {
        state.pageIdx = pIdx; state.selectedStepId = sid; state.selectedPartIds.clear();
        document.getElementById('errorsModal').classList.add('hidden');
        resetZoom(); renderAll();
      }
    };
  });
}

function openErrorsModal() {
  closeMenu();
  dismissErrorBanner();
  if (errFilter !== 'all' && state.diagnostics.length > 0 && !state.diagnostics.some(d => d.category === errFilter)) {
    errFilter = 'all';
  }
  acknowledgeCurrentDiagnostics();
  renderErrorsModal();
  document.getElementById('errorsModal').classList.remove('hidden');
}

function openPageSetupModal() {
  closeMenu();
  syncMenuControls();
  document.getElementById('pageSetupModal').classList.remove('hidden');
}

function isBomSetupModalOpen() {
  const el = document.getElementById('bomSetupModal');
  return Boolean(el && !el.classList.contains('hidden'));
}

function openBomSetupModal() {
  closeMenu();
  document.getElementById('stylePopover')?.classList.add('hidden');
  syncMenuControls();
  document.getElementById('bomSetupModal').classList.remove('hidden');
  const page = state.pages[state.pageIdx];
  if (page) syncModePillButtons(page);
}

function closeBomSetupModal() {
  const el = document.getElementById('bomSetupModal');
  if (el) el.classList.add('hidden');
  const page = state.pages[state.pageIdx];
  if (page) syncModePillButtons(page);
}

let lastSourceRecord = null; // { kind:'io'|'ldr'|'project', fileName, data, importMode }
let savePrefsTimer = null;
function scheduleSaveSessionPrefs() {
  if (!state.model) return;
  clearTimeout(savePrefsTimer);
  savePrefsTimer = setTimeout(() => {
    dbPut('prefs', {
      themeId: state.themeId, paperFormat: state.paperFormat, orientation: state.orientation,
      customWidth: state.customWidth, customHeight: state.customHeight, customUnit: state.customUnit,
      density: state.density, layout: state.layout,
      layoutConfig: state.layoutConfig, layoutGroups: state.layoutGroups,
      detectDuplicates: state.detectDuplicates, highlightNew: state.highlightNew, highlightColor: state.highlightColor,
      fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity, showRotCues: state.showRotCues,
      showSizeGuides: state.showSizeGuides, minifigStyle: state.minifigStyle, showMinifig1to1: state.showMinifig1to1, showStepBorders: state.showStepBorders,
      showPageTitle: state.showPageTitle, wordlessMode: state.wordlessMode, bomShowTextFields: state.bomShowTextFields,
      pageNumberFormat: state.pageNumberFormat,
      showExtras: state.showExtras, bomConfig: state.bomConfig,
      overrides: state.overrides, stepInserts: state.stepInserts, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter,
      coverMeta: state.coverMeta, completeMeta: state.completeMeta, backMeta: state.backMeta, pageIdx: state.pageIdx,
      seenDiagnosticKeys: serializeSeenDiagnosticKeys(state.seenDiagnosticKeys),
    });
  }, 450);
}

// Hook renderAll to keep session preferences persisted automatically
const _origRenderAll = renderAll;
renderAll = function () {
  applyActiveThemeStyleToState();
  noteThemeUsed();
  _origRenderAll();
  updateLibraryStatusUI();
  updateErrorIndicators();
  scheduleSaveSessionPrefs();
};

async function restoreLastSessionOnStart() {
  await loadSavedBricksLibrary();
  const dbThemes = await dbGet('customThemes');
  if (Array.isArray(dbThemes) && dbThemes.length > 0 && customThemes.length === 0) {
    const restored = dbThemes.map(t => normalizeCustomTheme(t)).filter(Boolean);
    if (restored.length > 0) {
      customThemes = restored;
      saveCustomThemesToStorage(customThemes);
    }
  } else if (customThemes.length > 0 && (!Array.isArray(dbThemes) || dbThemes.length === 0)) {
    dbPut('customThemes', customThemes);
  }
  const rec = await dbGet('lastModel');
  if (!rec) { renderAll(); return; }
  const prefs = (await dbGet('prefs')) || {};
  try {
    if (prefs.themeId) state.themeId = resolveThemeById(prefs.themeId, customThemes).id;
    if (prefs.paperFormat) state.paperFormat = prefs.paperFormat;
    if (prefs.orientation) state.orientation = prefs.orientation;
    if (typeof prefs.customWidth === 'number') state.customWidth = prefs.customWidth;
    if (typeof prefs.customHeight === 'number') state.customHeight = prefs.customHeight;
    if (prefs.customUnit === 'in' || prefs.customUnit === 'cm') state.customUnit = prefs.customUnit;
    if (prefs.density) state.density = prefs.density;
    if (prefs.layout) state.layout = prefs.layout;
    state.layoutConfig = normalizePageLayoutSpec(prefs.layoutConfig, prefs.layout);
    state.layoutGroups = normalizeLayoutGroups(prefs.layoutGroups);
    syncLegacyLayoutFlag();
    if (typeof prefs.detectDuplicates === 'boolean') state.detectDuplicates = prefs.detectDuplicates;
    adoptLegacyStyleOptions(prefs);
    // Legacy sessions saved before Wordless mode keep their prior labeled defaults.
    state.wordlessMode = typeof prefs.wordlessMode === 'boolean' ? prefs.wordlessMode : false;
    state.bomShowTextFields = typeof prefs.bomShowTextFields === 'boolean' ? prefs.bomShowTextFields : !state.wordlessMode;
    if (prefs.pageNumberFormat) state.pageNumberFormat = prefs.pageNumberFormat;
    else state.pageNumberFormat = getWordlessSurfaceDefaults(state.wordlessMode).pageNumberFormat;
    if (typeof prefs.showExtras === 'boolean') state.showExtras = prefs.showExtras;

    let effectiveRec = rec;
    if (rec.kind === 'io' && rec.data) {
      const { m1Text, m2Text } = await extractIoArchive(rec.data);
      const parsed = parseImportedModel(m1Text, m2Text, rec.fileName);
      const fetchRes = await autoFetchMissingPartsForParsed(parsed, rec.fileName);
      await textureStore.predecodeAllPending();
      const subPlan = (fetchRes.fetched > 0 && rec.subdivisionPlan && rec.subdivisionPlan.strategy !== 'none')
        ? refreshSubdivisionPlanForParsed(parsed, rec.subdivisionPlan)
        : (rec.subdivisionPlan || null);
      if (subPlan !== rec.subdivisionPlan) {
        effectiveRec = { ...rec, subdivisionPlan: subPlan };
        dbPut('lastModel', effectiveRec);
      }
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto', subPlan);
    } else if (rec.kind === 'ldr' && typeof rec.data === 'string') {
      textureStore.clearEmbedded();
      const parsed = parseImportedModel(rec.data, '', rec.fileName);
      const fetchRes = await autoFetchMissingPartsForParsed(parsed, rec.fileName);
      await textureStore.predecodeAllPending();
      const subPlan = (fetchRes.fetched > 0 && rec.subdivisionPlan && rec.subdivisionPlan.strategy !== 'none')
        ? refreshSubdivisionPlanForParsed(parsed, rec.subdivisionPlan)
        : (rec.subdivisionPlan || null);
      if (subPlan !== rec.subdivisionPlan) {
        effectiveRec = { ...rec, subdivisionPlan: subPlan };
        dbPut('lastModel', effectiveRec);
      }
      state.model = buildManualFromParsed(parsed, rec.importMode || 'auto', subPlan);
    } else {
      renderAll(); return;
    }

    lastSourceRecord = effectiveRec;
    state.overrides = prefs.overrides || {};
    state.stepInserts = prefs.stepInserts || {};
    state.pageInserts = prefs.pageInserts || {};
    state.dividerAfter = prefs.dividerAfter || {};
    state.coverMeta = normalizeCoverMeta(prefs.coverMeta ? { ...state.coverMeta, ...prefs.coverMeta } : state.coverMeta, !state.wordlessMode);
    state.completeMeta = normalizeCompleteMeta(prefs.completeMeta ? { ...state.completeMeta, ...prefs.completeMeta } : { ...state.completeMeta, showText: !state.wordlessMode });
    if (prefs.backMeta) state.backMeta = normalizeBackMeta({ ...state.backMeta, ...prefs.backMeta });
    state.pageIdx = Math.max(0, prefs.pageIdx || 0);
    state.seenDiagnosticKeys = deserializeSeenDiagnosticKeys(prefs.seenDiagnosticKeys);
    // Sync checkboxes in DOM
    document.getElementById('toggleExtras').checked = state.showExtras;
    document.getElementById('toggleHighlight').checked = state.highlightNew;
    document.getElementById('highlightColor').value = state.highlightColor;
    document.getElementById('toggleFade').checked = state.fadePrev;
    document.getElementById('toggleRotCues').checked = state.showRotCues;
    document.getElementById('toggleSizeGuides').checked = state.showSizeGuides;
    const mf1El = document.getElementById('toggleMinifig1to1');
    if (mf1El) mf1El.checked = state.showMinifig1to1;
    const dupEl = document.getElementById('toggleDetectDuplicates');
    if (dupEl) dupEl.checked = state.detectDuplicates;
    const wlEl = document.getElementById('toggleWordlessMode');
    if (wlEl) wlEl.checked = state.wordlessMode;
    const covTxtEl = document.getElementById('toggleCoverText');
    if (covTxtEl) covTxtEl.checked = state.coverMeta.showText !== false;
    const bomTxtEl = document.getElementById('toggleBomTextFields');
    if (bomTxtEl) bomTxtEl.checked = state.bomShowTextFields;

    computeModelDiagnostics();
    resetZoom();
    renderAll();
    if (rec.kind === 'ldr') void fetchMissingPartsOnline({ silent: true });
    showToast(`Reloaded ${state.model.title}`);
    if (getMenuIconErrorBadgeCount(state.diagnostics, state.seenDiagnosticKeys) > 0) showImportErrorBanner();
  } catch (_) {
    renderAll();
  }
}

// =========================================================================
// 12. PURE-JS MULTI-PAGE PDF 1.4 GENERATOR (Imported from src/export/pdfBinary.ts)
// =========================================================================
function getPdfPaperPts() {
  const [wIn, hIn] = getActivePagePhysicalInches();
  return [Math.round(wIn * 72), Math.round(hIn * 72)];
}

function loadImgPromise(src) {
  return new Promise((res) => { const img = new Image(); img.onload = () => res(img); img.onerror = () => res(null); img.src = src; });
}

function drawContain(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height || w <= 2 || h <= 2) return null;
  const sc = Math.min(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

function drawAlignedContain(ctx, img, x, y, maxW, maxH, alignX = 'left', alignY = 'top') {
  if (!img || !img.width || !img.height || maxW <= 2 || maxH <= 2) return null;
  const sc = Math.min(maxW / img.width, maxH / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  const dx = alignX === 'right' ? (x + maxW - dw) : alignX === 'center' ? (x + (maxW - dw) / 2) : x;
  const dy = alignY === 'bottom' ? (y + maxH - dh) : alignY === 'center' ? (y + (maxH - dh) / 2) : y;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { x: dx, y: dy, w: dw, h: dh };
}

function drawCoverImage(ctx, img, x, y, w, h) {
  if (!img || !img.width || !img.height || w <= 2 || h <= 2) return;
  const sc = Math.max(w / img.width, h / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawWrappedText(ctx, text, x, y, maxW, lineH, maxLines = 2) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 0;
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`;
    if (ctx.measureText(candidate).width <= maxW) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length >= maxLines - 1) {
        const rest = [current, ...words.slice(i + 1)].join(' ');
        current = rest;
        break;
      }
    }
  }
  lines.push(current);
  const finalLines = lines.slice(0, maxLines);
  finalLines.forEach((ln, idx) => {
    ctx.fillText(ln, x, y + idx * lineH, maxW);
  });
  return finalLines.length * lineH;
}

function drawBrandLogoCanvas(ctx, x, y, size) {
  if (typeof Path2D === 'undefined') return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 64, size / 64);
  ctx.translate(32, 32);
  ctx.rotate((BRAND_LOGO_ROTATION_DEG * Math.PI) / 180);
  ctx.translate(-32, -32);
  for (const [d, col] of BRAND_LOGO_PATHS) { ctx.fillStyle = col; ctx.fill(new Path2D(d)); }
  ctx.restore();
}

async function renderPageToJpegBytes(page, pxW, pxH, pageWpt = 792, pageHpt = 612) {
  const canvas = document.createElement('canvas');
  canvas.width = pxW; canvas.height = pxH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const theme = getThemeForPage(page);
  await ensureThemeFontsLoaded(theme);
  const allParts = getAllParts(state.model);
  const allSteps = getAllSteps(state.model);
  const links = [];

  // Fill background (supports solid, angled gradient, and blueprint grid for built-in & custom themes)
  fillThemeBackgroundCanvas(ctx, theme, pxW, pxH);

  const [wIn, hIn] = getActivePagePhysicalInches();
  const pxPerInch = pxW / Math.max(1, wIn);
  const typo = computePageTypography({
    widthIn: wIn,
    heightIn: hIn,
    pxPerInch,
    density: state.density,
    bomDensity: state.bomConfig?.density,
  });
  const pad = typo.pad;
  const footerH = typo.footerH;
  const footerTextY = pxH - Math.max(6, Math.round(pad * 0.42)) - Math.round(typo.footerFont * 1.15);
  const pgNumText = formatPageNumber(page.num, state.pages.length);
  const wordless = Boolean(state.wordlessMode);
  const showFooterTitle = !wordless && Boolean(state.showPageTitle);
  const drawFooter = (leftLabel) => {
    if (showFooterTitle && leftLabel) {
      ctx.fillStyle = theme.muted;
      ctx.font = themeCanvasFont(theme, 600, typo.footerFont);
      ctx.fillText(leftLabel, pad, footerTextY);
    }
    if (pgNumText) {
      ctx.fillStyle = theme.text; ctx.textAlign = 'right';
      ctx.font = themeCanvasFont(theme, 700, typo.footerFont);
      ctx.fillText(pgNumText, pxW - pad, footerTextY);
      ctx.textAlign = 'left';
    }
  };
  ctx.fillStyle = theme.text;
  ctx.textBaseline = 'top';

  if (page.kind === 'cover') {
    const dens = DENSITY_PAD[state.density] || DENSITY_PAD.balanced;
    const cm = normalizeCoverMeta(state.coverMeta, !wordless);
    const showCoverText = cm.showText !== false;
    const title = showCoverText ? (cm.title || state.model.title || 'Untitled Model').trim() : '';
    const sub = showCoverText ? (cm.subtitle || '').trim() : '';
    const layout = computeCoverLayout({
      pageW: pxW,
      pageH: pxH,
      hasCreatorLogo: Boolean(cm.creatorLogoSrc),
      hasTitle: showCoverText && title.length > 0,
      hasSubtitle: showCoverText && sub.length > 0,
      hasThemeImage: Boolean(cm.themeImageSrc),
      densityPadFactor: dens.pad / 20,
    });

    if (cm.bgSrc) {
      const bgImg = await loadImgPromise(cm.bgSrc);
      if (bgImg) drawCoverImage(ctx, bgImg, 0, 0, pxW, pxH);
    }

    // 1. High-Quality Page-Filling Hero Model Render (300 DPI print quality)
    const heroSize = computeCoverHeroRenderSize({
      heroWidth: layout.heroRect.w,
      heroHeight: layout.heroRect.h,
      mode: 'pdf',
      gpuMaxDim: getCoverHeroGpuMaxDim(),
    });
    const snap = renderCoverHeroSnapshot(
      allParts,
      cm.az,
      cm.el,
      cm.zoom,
      heroSize.width,
      heroSize.height,
      theme,
    );
    const heroImg = await loadImgPromise(snap.url);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    drawContain(ctx, heroImg, layout.heroRect.x, layout.heroRect.y, layout.heroRect.w, layout.heroRect.h);

    // 2. Top-Left: Optional Creator Logo + Optional Model Name & Subtitle
    let topLeftY = layout.pad;
    if (cm.creatorLogoSrc) {
      const creatorImg = await loadImgPromise(cm.creatorLogoSrc);
      const drawn = drawAlignedContain(
        ctx,
        creatorImg,
        layout.pad,
        topLeftY,
        layout.creatorLogoMaxW,
        layout.creatorLogoMaxH,
        'left',
        'top',
      );
      if (drawn) topLeftY += drawn.h + layout.creatorLogoGap;
    }

    if (showCoverText && (title || sub)) {
      ctx.save();
      if (cm.bgSrc) {
        ctx.shadowColor = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur = Math.max(4, Math.round(pxH * 0.008));
        ctx.shadowOffsetY = 1;
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      let titleH = 0;
      if (title) {
        ctx.fillStyle = theme.text;
        ctx.font = themeCanvasFont(theme, 800, layout.titleFontPx);
        titleH = drawWrappedText(ctx, title, layout.pad, topLeftY, layout.topLeftMaxW, layout.titleLineHeightPx, 2);
      }

      if (sub) {
        ctx.fillStyle = theme.muted;
        ctx.font = themeCanvasFont(theme, 500, layout.subtitleFontPx);
        drawWrappedText(
          ctx,
          sub,
          layout.pad,
          topLeftY + (titleH > 0 ? titleH + layout.subtitleGap : 0),
          layout.topLeftMaxW,
          Math.round(layout.subtitleFontPx * 1.25),
          2,
        );
      }
      ctx.restore();
    }

    // 3. Top-Right: Optional Theming Image
    if (cm.themeImageSrc) {
      const themeImg = await loadImgPromise(cm.themeImageSrc);
      drawAlignedContain(
        ctx,
        themeImg,
        pxW - layout.pad - layout.topRightMaxW,
        layout.pad,
        layout.topRightMaxW,
        layout.topRightMaxH,
        'right',
        'top',
      );
    }

    // 4. Bottom-Right: Non-Editable Clickable Program Attribution + QR Code
    {
      const darkBg = isDarkHexColor(toHexColor(theme.bgColor || '#ffffff', '#ffffff'));
      const qr = layout.qrCardRect;
      const lineW = Math.max(1, Math.round(pxH * 0.0014));
      const brandPadX = layout.brandPadX;
      const brandInnerGap = layout.brandInnerGap;
      const qrHintArrowGap = Math.max(3, Math.round(layout.brandQrHintFontPx * 0.35));
      const qrHintArrowSize = Math.max(7, Math.round(layout.brandQrHintFontPx * 1.05));

      ctx.font = themeCanvasFont(theme, 600, layout.brandEyebrowFontPx);
      const eyebrowW = Math.ceil(ctx.measureText(COVER_MADE_WITH_LABEL).width);
      ctx.font = themeCanvasFont(theme, 800, layout.brandTitleFontPx);
      const titleW = Math.ceil(ctx.measureText(PROGRAM_NAME).width);
      ctx.font = themeCanvasFont(theme, 500, layout.brandQrHintFontPx);
      const hintTextW = Math.ceil(ctx.measureText(COVER_QR_HINT_TEXT).width);
      const hintTotalW = hintTextW + qrHintArrowGap + qrHintArrowSize;

      const maxBrandCardW = Math.max(
        layout.brandCardRect.w,
        pxW - layout.pad * 2 - qr.w - layout.brandGap,
      );
      const neededBrandW =
        brandPadX * 2 +
        layout.brandIconSize +
        brandInnerGap +
        Math.max(eyebrowW, titleW, hintTotalW) +
        2;
      const actualBrandW = Math.min(maxBrandCardW, Math.max(layout.brandCardRect.w, neededBrandW));
      const bc = {
        x: qr.x - layout.brandGap - actualBrandW,
        y: layout.brandCardRect.y,
        w: actualBrandW,
        h: layout.brandCardRect.h,
      };
      const actualGroupRect = {
        x: bc.x,
        y: layout.brandGroupRect.y,
        w: qr.x + qr.w - bc.x,
        h: layout.brandGroupRect.h,
      };

      // Program attribution card
      drawRoundedRectPath(ctx, bc.x, bc.y, bc.w, bc.h, layout.cardRadius);
      ctx.fillStyle = darkBg ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.94)';
      ctx.fill();
      ctx.strokeStyle = darkBg ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.14)';
      ctx.lineWidth = lineW;
      ctx.stroke();

      const iconX = bc.x + brandPadX;
      const iconY = bc.y + Math.round((bc.h - layout.brandIconSize) / 2);
      drawBrandLogoCanvas(ctx, iconX, iconY, layout.brandIconSize);

      const textX = iconX + layout.brandIconSize + brandInnerGap;
      const textMaxW = Math.max(20, bc.x + bc.w - textX - brandPadX);
      const eyebrowLineH = Math.round(layout.brandEyebrowFontPx * 1.15);
      const titleLineH = Math.round(layout.brandTitleFontPx * 1.16);
      const hintLineH = Math.round(layout.brandQrHintFontPx * 1.15);
      const totalTextH = eyebrowLineH + titleLineH + layout.brandQrHintGap + hintLineH;
      const textStartY = bc.y + Math.round((bc.h - totalTextH) / 2);
      const badgeInk = darkBg ? '#f8fafc' : '#1e293b';

      ctx.fillStyle = badgeInk;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      ctx.globalAlpha = 0.72;
      ctx.font = themeCanvasFont(theme, 600, layout.brandEyebrowFontPx);
      ctx.fillText(COVER_MADE_WITH_LABEL, textX, textStartY, textMaxW);

      ctx.globalAlpha = 1;
      ctx.font = themeCanvasFont(theme, 800, layout.brandTitleFontPx);
      ctx.fillText(PROGRAM_NAME, textX, textStartY + eyebrowLineH, textMaxW);

      const hintY = textStartY + eyebrowLineH + titleLineH + layout.brandQrHintGap;
      const hintTextMaxW = Math.max(20, textMaxW - qrHintArrowGap - qrHintArrowSize);
      ctx.globalAlpha = 0.76;
      ctx.font = themeCanvasFont(theme, 500, layout.brandQrHintFontPx);
      ctx.fillText(COVER_QR_HINT_TEXT, textX, hintY, hintTextMaxW);

      const drawnHintW = Math.min(hintTextW, hintTextMaxW);
      const arrowLeft = textX + drawnHintW + qrHintArrowGap;
      const arrowMidY = hintY + hintLineH * 0.52;
      const arrowRight = arrowLeft + qrHintArrowSize * 0.85;
      const headSize = qrHintArrowSize * 0.28;
      ctx.save();
      ctx.strokeStyle = badgeInk;
      ctx.lineWidth = Math.max(1, qrHintArrowSize * 0.13);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(arrowLeft + qrHintArrowSize * 0.1, arrowMidY);
      ctx.lineTo(arrowRight, arrowMidY);
      ctx.moveTo(arrowRight - headSize, arrowMidY - headSize);
      ctx.lineTo(arrowRight, arrowMidY);
      ctx.lineTo(arrowRight - headSize, arrowMidY + headSize);
      ctx.stroke();
      ctx.restore();
      ctx.globalAlpha = 1;

      // QR Code square card
      drawRoundedRectPath(ctx, qr.x, qr.y, qr.w, qr.h, layout.cardRadius);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,23,42,0.16)';
      ctx.lineWidth = lineW;
      ctx.stroke();

      const inset = layout.qrInnerInset;
      drawQrCanvas(ctx, PROGRAM_URL, qr.x + inset, qr.y + inset, qr.w - inset * 2, {
        fg: '#111827',
        bg: '#ffffff',
        quietZone: 1,
      });

      // Register clickable PDF hyperlink over the program attribution + QR code
      links.push(canvasRectToPdfLink(actualGroupRect, pxW, pxH, pageWpt, pageHpt, PROGRAM_URL));
    }
  } else if (page.kind === 'complete') {
    const cm = normalizeCompleteMeta(state.completeMeta);
    if (cm.bgSrc) {
      const bgImg = await loadImgPromise(cm.bgSrc);
      if (bgImg) drawCoverImage(ctx, bgImg, 0, 0, pxW, pxH);
    }
    if (cm.showFireworks !== false) drawFireworksCanvas(ctx, pxW, pxH);
    const showText = cm.showText !== false;
    let topOff = pad + Math.round(typo.pt(8));
    if (showText) {
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'center';
      ctx.font = themeCanvasFont(theme, 800, typo.complete.titleFont);
      ctx.fillText(cm.title || 'Build Complete!', pxW / 2, pad);
      topOff = pad + Math.round(typo.complete.titleFont * 1.3);
      if (cm.subtitle) {
        ctx.fillStyle = theme.muted;
        ctx.font = themeCanvasFont(theme, 500, typo.complete.subtitleFont);
        ctx.fillText(cm.subtitle, pxW / 2, topOff);
        topOff += Math.round(typo.complete.subtitleFont * 1.5);
      }
      ctx.textAlign = 'left';
    }
    const availH = pxH - topOff - pad - footerH;
    const heroSize = computeCoverHeroRenderSize({
      heroWidth: pxW - pad * 2,
      heroHeight: availH,
      mode: 'pdf',
      gpuMaxDim: getCoverHeroGpuMaxDim(),
    });
    const snap = renderCoverHeroSnapshot(allParts, cm.az, cm.el, cm.zoom, heroSize.width, heroSize.height, theme);
    const img = await loadImgPromise(snap.url);
    drawContain(ctx, img, pad, topOff, pxW - pad * 2, availH);
    drawFooter(state.model.title);
  } else if (page.kind === 'back') {
    const bm = normalizeBackMeta(state.backMeta);
    if (bm.bgSrc) {
      const bgImg = await loadImgPromise(bm.bgSrc);
      if (bgImg) drawCoverImage(ctx, bgImg, 0, 0, pxW, pxH);
    }
    const credit = BACK_COVER_CREDIT;
    ctx.textAlign = 'center';
    const logoSz = typo.back.logoIcon;
    const logoY = Math.round(pxH * 0.5 - logoSz * 0.65);
    drawBrandLogoCanvas(ctx, (pxW - logoSz) / 2, logoY, logoSz);

    const creditFontPx = typo.back.creditFont;
    const creditY = logoY + logoSz + Math.round(typo.pt(12));
    ctx.fillStyle = theme.muted;
    ctx.font = themeCanvasFont(theme, 600, creditFontPx);
    ctx.fillText(credit, pxW / 2, creditY);
    const creditW = Math.max(logoSz, Math.round(ctx.measureText(credit).width));
    ctx.textAlign = 'left';

    links.push(
      canvasRectToPdfLink(
        {
          x: Math.round((pxW - creditW) / 2),
          y: logoY,
          w: creditW,
          h: creditY + creditFontPx * 1.4 - logoY,
        },
        pxW,
        pxH,
        pageWpt,
        pageHpt,
        PROGRAM_URL,
      ),
    );
  } else if (page.kind === 'divider') {
    const d = state.dividerAfter[page.sourcePgId] || { title: wordless ? '' : 'Section Divider', note: '' };
    const divTitle = (d.title || '').trim();
    const divNote = (d.note || '').trim();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (divTitle) {
      ctx.fillStyle = theme.text;
      ctx.font = themeCanvasFont(theme, 800, typo.divider.customTitleFont);
      ctx.fillText(divTitle, pxW / 2, divNote ? pxH * 0.45 : pxH * 0.5, pxW - pad * 2);
    }
    if (divNote) {
      ctx.fillStyle = theme.muted;
      ctx.font = themeCanvasFont(theme, 500, typo.divider.customNoteFont);
      ctx.fillText(divNote, pxW / 2, divTitle ? pxH * 0.56 : pxH * 0.5, Math.min(pxW - pad * 2, Math.round(typo.pt(360))));
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  } else if (page.kind === 'submodel_page' && page.step?.subassembly) {
    const sub = page.step.subassembly;
    const badgeLabel = wordless ? `×${sub.repeatCount}` : `Build ${sub.repeatCount}×`;
    ctx.font = themeCanvasFont(theme, 900, typo.submodelPage.badgeFont);
    const bW = Math.max(Math.round(typo.pt(42)), Math.ceil(ctx.measureText(badgeLabel).width + typo.pt(18)));
    const bH = Math.round(typo.submodelPage.badgeFont * 1.85);
    const bX = pxW - pad - bW;
    const bY = pad;
    if (!wordless) {
      ctx.fillStyle = theme.text;
      ctx.font = themeCanvasFont(theme, 800, typo.submodelPage.titleFont);
      ctx.fillText(sub.name || 'Submodel', pad, pad, Math.max(40, bX - pad - typo.pt(12)));
    }
    drawRoundedRectPath(ctx, bX, bY, bW, bH, bH / 2);
    ctx.fillStyle = theme.accent;
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = themeCanvasFont(theme, 900, typo.submodelPage.badgeFont);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeLabel, bX + bW / 2, bY + bH / 2 + 0.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const imgTop = pad + Math.max(bH, Math.round(typo.submodelPage.titleFont * 1.4)) + Math.round(typo.pt(8));
    const subAvailW = pxW - pad * 2;
    const subAvailH = Math.max(120, pxH - imgTop - pad - footerH);
    const subDims = computeStepSlotRenderSize({
      slotWidth: subAvailW,
      slotHeight: subAvailH,
      slotCount: 1,
      isFeatured: true,
      mode: 'pdf',
      gpuMaxDim: snapshotEngine.maxDim,
    });
    const snap = renderSnapshot([], sub.buildParts || [], 38, 30, subDims.width, subDims.height, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const img = await loadImgPromise(snap.url);
    drawContain(ctx, img, pad, imgTop, subAvailW, subAvailH);
    drawFooter(page.chapterName || state.model.title);
  } else if (page.kind === 'section_divider') {
    let imgTop;
    if (wordless) {
      const bagH = Math.round(typo.pt(56));
      const bagNumStr = String(page.bagNumber || 1);
      drawNumberedBagCanvas(
        ctx,
        pad,
        pad,
        bagH,
        page.bagNumber || 1,
        theme.accent,
        theme.pliBg,
        theme.text,
        themeCanvasFont(theme, 900, bagNumStr.length >= 2 ? 24 : 30),
      );
      // Right-aligned brick glyph + piece count pill & booklet icon + step range
      const metaFont = typo.divider.metaFont;
      const subMetaFont = typo.divider.subMetaFont;
      const pieceStr = String(page.pieceCount || 0);
      const brickSz = Math.max(12, Math.round(metaFont * 1.12));
      const pillGap = Math.round(typo.pt(4));
      const pillPadX = Math.round(typo.pt(8));
      const pillPadY = Math.round(typo.pt(3));
      ctx.font = themeCanvasFont(theme, 800, metaFont);
      const pieceW = Math.ceil(ctx.measureText(pieceStr).width);
      const pillW = pillPadX * 2 + brickSz + pillGap + pieceW;
      const pillH = Math.max(brickSz, metaFont) + pillPadY * 2;
      const pillX = pxW - pad - pillW;
      const pillY = pad + Math.round(typo.pt(4));
      drawRoundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = theme.pliBg;
      ctx.fill();
      ctx.strokeStyle = theme.pliBorder;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      drawBrickGlyphCanvas(ctx, pillX + pillPadX, pillY + (pillH - brickSz) / 2, brickSz, theme.text);
      ctx.fillStyle = theme.text;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(pieceStr, pillX + pillPadX + brickSz + pillGap, pillY + pillH / 2 + 0.5);

      const rangeStr = `${page.firstStepNum}–${page.lastStepNum}`;
      const bookSz = Math.max(11, Math.round(subMetaFont * 1.15));
      ctx.font = themeCanvasFont(theme, 700, subMetaFont);
      const rangeW = Math.ceil(ctx.measureText(rangeStr).width);
      const rangeX = pxW - pad - rangeW;
      const rangeY = pillY + pillH + Math.round(typo.pt(5)) + Math.max(bookSz, subMetaFont) / 2;
      drawStepsBookletIconCanvas(ctx, rangeX - pillGap - bookSz, rangeY - bookSz / 2, bookSz, theme.muted);
      ctx.fillStyle = theme.muted;
      ctx.fillText(rangeStr, rangeX, rangeY + 0.5);
      ctx.textBaseline = 'top';
      imgTop = pad + bagH + Math.round(typo.pt(10));
    } else {
      ctx.fillStyle = theme.accent;
      ctx.font = themeCanvasFont(theme, 800, typo.divider.badgeFont);
      ctx.fillText(`BUILD STAGE ${page.bagNumber || 1}`, pad, pad);
      const titleY = pad + Math.round(typo.divider.badgeFont * 1.5);
      ctx.fillStyle = theme.text;
      ctx.font = themeCanvasFont(theme, 800, typo.divider.titleFont);
      ctx.fillText(page.chapterName || page.label || 'Build Stage', pad, titleY);
      ctx.fillStyle = theme.muted;
      ctx.textAlign = 'right';
      ctx.font = themeCanvasFont(theme, 700, typo.divider.metaFont);
      ctx.fillText(`${page.pieceCount || 0} pcs · Steps ${page.firstStepNum}–${page.lastStepNum}`, pxW - pad, titleY + Math.round((typo.divider.titleFont - typo.divider.metaFont) * 0.5));
      ctx.textAlign = 'left';
      imgTop = titleY + Math.round(typo.divider.titleFont * 1.4);
    }
    const divAvailW = pxW - pad * 2;
    const divAvailH = Math.max(120, pxH - imgTop - pad - footerH);
    const divDims = computeStepSlotRenderSize({
      slotWidth: divAvailW,
      slotHeight: divAvailH,
      slotCount: 1,
      isFeatured: true,
      mode: 'pdf',
      gpuMaxDim: snapshotEngine.maxDim,
    });
    const snap = renderSnapshot([], page.previewParts || [], 38, 28, divDims.width, divDims.height, 1.0, { highlightNew:false, fadePrev:false, showArrows:false, accent:theme.accent });
    const img = await loadImgPromise(snap.url);
    drawContain(ctx, img, pad, imgTop, divAvailW, divAvailH);
    drawFooter(state.model.title);
  } else if (page.kind === 'bom') {
    const cfg = getEffectiveBomConfig();
    const enabledFields = getEnabledBomFields(cfg);
    const entries = page.bomEntries || [];
    const bt = typo.bom;
    const monoStack = THEME_FONTS.mono.stack;
    const headerTitle = page.bomPageCount > 1
      ? `Parts List  ${page.bomPageIdx + 1} / ${page.bomPageCount}`
      : 'Parts List';

    const fitText = (rawText, maxW) => {
      const text = String(rawText || '');
      if (!text || maxW <= 2) return '';
      if (ctx.measureText(text).width <= maxW) return text;
      const ell = '…';
      const ellW = ctx.measureText(ell).width;
      if (ellW >= maxW) return '';
      let lo = 0, hi = text.length;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (ctx.measureText(text.slice(0, mid)).width + ellW <= maxW) lo = mid;
        else hi = mid - 1;
      }
      return lo > 0 ? text.slice(0, lo).trimEnd() + ell : ell;
    };

    const headerH = bt.headerH;
    if (wordless) {
      const hdrContentH = Math.max(14, headerH - bt.headerMb - bt.headerPb);
      const hdrMidY = pad + hdrContentH / 2;
      const gridSz = Math.max(14, Math.round(bt.titleFont * 1.12));
      drawPartsGridIconCanvas(ctx, pad, hdrMidY - gridSz / 2, gridSz, theme.accent);
      if (page.bomPageCount > 1) {
        ctx.fillStyle = theme.muted;
        ctx.font = themeCanvasFont(theme, 700, bt.pageCountFont);
        ctx.textBaseline = 'middle';
        ctx.fillText(`${page.bomPageIdx + 1} / ${page.bomPageCount}`, pad + gridSz + Math.round(typo.pt(7)), hdrMidY + 0.5);
      }
      const totalStr = String(page.bomTotalPieces || allParts.length);
      const brickSz = Math.max(12, Math.round(bt.summaryFont * 1.2));
      const brickGap = Math.round(typo.pt(4));
      ctx.font = themeCanvasFont(theme, 700, bt.summaryFont);
      const totalW = Math.ceil(ctx.measureText(totalStr).width);
      drawBrickGlyphCanvas(ctx, pxW - pad - totalW - brickGap - brickSz, hdrMidY - brickSz / 2, brickSz, theme.muted);
      ctx.fillStyle = theme.muted;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(totalStr, pxW - pad, hdrMidY + 0.5);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
    } else {
      ctx.fillStyle = theme.text;
      ctx.font = themeCanvasFont(theme, 700, bt.titleFont);
      ctx.fillText(headerTitle, pad, pad);
      ctx.fillStyle = theme.muted;
      ctx.textAlign = 'right';
      ctx.font = themeCanvasFont(theme, 500, bt.summaryFont);
      ctx.fillText(`${page.bomTotalPieces || allParts.length} pcs · ${page.bomTotalUnique || entries.length} unique`, pxW - pad, pad + Math.round((bt.titleFont - bt.summaryFont) * 0.72));
      ctx.textAlign = 'left';
    }

    ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.25;
    ctx.beginPath(); ctx.moveTo(pad, pad + headerH - bt.headerMb); ctx.lineTo(pxW - pad, pad + headerH - bt.headerMb); ctx.stroke();

    const bodyX = pad, bodyY = pad + headerH;
    const bodyW = pxW - pad * 2, bodyH = pxH - bodyY - pad - footerH;

    if (page.bomFormat === 'table') {
      const rowsPerPage = page.bomTableRowsPerPage || 20;
      const tTypo = computeBomTableTypography({
        tableHeightPx: bodyH,
        rowsPerPage,
        pxPerInch,
        typeScale: typo.typeScale,
      });
      const tCols = computeBomTableColumns(enabledFields, bodyW, tTypo.rowH);

      // Header row
      ctx.fillStyle = theme.pliBg;
      ctx.fillRect(bodyX, bodyY, bodyW, tTypo.headerH);
      ctx.strokeStyle = theme.pliBorder;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(bodyX, bodyY + tTypo.headerH);
      ctx.lineTo(bodyX + bodyW, bodyY + tTypo.headerH);
      ctx.stroke();

      ctx.textBaseline = 'middle';
      ctx.fillStyle = theme.muted;
      ctx.font = themeCanvasFont(theme, 700, tTypo.headerFont);
      for (const col of tCols) {
        const midY = bodyY + tTypo.headerH / 2;
        if (wordless && col.id === 'image') {
          const icoSz = Math.max(11, Math.min(tTypo.headerH - 4, Math.round(tTypo.headerFont * 1.35)));
          drawBrickGlyphCanvas(ctx, bodyX + col.x + (col.width - icoSz) / 2, midY - icoSz / 2, icoSz, theme.muted);
          continue;
        }
        const label = wordless ? getBomTableHeaderText(col.id, true) : col.label.toUpperCase();
        const maxW = Math.max(8, col.width - tTypo.cellPadX * 2);
        const fitted = fitText(label, maxW);
        if (col.align === 'right') {
          ctx.textAlign = 'right';
          ctx.fillText(fitted, bodyX + col.x + col.width - tTypo.cellPadX, midY);
        } else if (col.align === 'center') {
          ctx.textAlign = 'center';
          ctx.fillText(fitted, bodyX + col.x + col.width / 2, midY);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(fitted, bodyX + col.x + tTypo.cellPadX, midY);
        }
      }

      // Data rows
      for (let ri = 0; ri < entries.length; ri++) {
        const entry = entries[ri];
        const ry = bodyY + tTypo.headerH + ri * tTypo.rowH;
        const midY = ry + tTypo.rowH / 2;
        if (ri % 2 === 1) {
          ctx.fillStyle = 'rgba(127, 127, 127, 0.06)';
          ctx.fillRect(bodyX, ry, bodyW, tTypo.rowH);
        }
        ctx.save();
        ctx.globalAlpha = 0.48;
        ctx.strokeStyle = theme.pliBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(bodyX, ry + tTypo.rowH);
        ctx.lineTo(bodyX + bodyW, ry + tTypo.rowH);
        ctx.stroke();
        ctx.restore();

        for (const col of tCols) {
          const cx = bodyX + col.x;
          const cw = col.width;
          const maxW = Math.max(8, cw - tTypo.cellPadX * 2);
          if (col.id === 'image') {
            const img = await loadImgPromise(getPliThumb(entry.part));
            drawContain(ctx, img, cx + tTypo.cellPadX, ry + tTypo.imgPad, maxW, Math.max(8, tTypo.rowH - tTypo.imgPad * 2));
          } else if (col.id === 'qty') {
            ctx.textAlign = 'right';
            ctx.fillStyle = theme.text;
            ctx.font = themeCanvasFont(theme, 800, tTypo.qtyFont);
            ctx.fillText(fitText(`${entry.qty}×`, maxW), cx + cw - tTypo.cellPadX, midY);
          } else if (col.id === 'partId') {
            ctx.textAlign = 'left';
            ctx.fillStyle = theme.muted;
            ctx.font = `500 ${tTypo.monoFont}px ${monoStack}`;
            ctx.fillText(fitText(entry.partIdDisplay, maxW), cx + tTypo.cellPadX, midY);
          } else if (col.id === 'color') {
            const sw = tTypo.swatchSize;
            const swGap = Math.max(3, Math.round(sw * 0.5));
            const sx = cx + tTypo.cellPadX + sw / 2;
            ctx.beginPath();
            ctx.arc(sx, midY, sw / 2, 0, Math.PI * 2);
            ctx.fillStyle = entry.colorHex || '#9ea3a8';
            ctx.fill();
            ctx.strokeStyle = 'rgba(127, 127, 127, 0.45)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.textAlign = 'left';
            ctx.fillStyle = theme.text;
            ctx.font = themeCanvasFont(theme, 500, tTypo.bodyFont);
            ctx.fillText(fitText(entry.colorName, Math.max(6, maxW - sw - swGap)), cx + tTypo.cellPadX + sw + swGap, midY);
          } else {
            ctx.textAlign = 'left';
            ctx.fillStyle = theme.text;
            ctx.font = themeCanvasFont(theme, 500, tTypo.bodyFont);
            ctx.fillText(fitText(entry.meta.name, maxW), cx + tTypo.cellPadX, midY);
          }
        }
      }
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
    } else {
      const cells = page.bomCells || [];
      const drawGridTextField = (fieldId, entry, ct, xLeft, boxW, yTop, centered) => {
        ctx.textBaseline = 'top';
        if (fieldId === 'qty') {
          ctx.fillStyle = theme.text;
          ctx.font = themeCanvasFont(theme, 800, ct.qtyFont);
          ctx.textAlign = centered ? 'center' : 'left';
          ctx.fillText(fitText(`${entry.qty}×`, boxW), centered ? xLeft + boxW / 2 : xLeft, yTop);
          return ct.qtyLineH;
        }
        if (fieldId === 'name') {
          ctx.fillStyle = theme.text;
          ctx.font = themeCanvasFont(theme, 500, ct.nameFont);
          ctx.textAlign = centered ? 'center' : 'left';
          ctx.fillText(fitText(entry.meta.name, boxW), centered ? xLeft + boxW / 2 : xLeft, yTop);
          return ct.textLineH;
        }
        if (fieldId === 'partId') {
          ctx.fillStyle = theme.muted;
          ctx.font = `500 ${ct.partIdFont}px ${monoStack}`;
          ctx.textAlign = centered ? 'center' : 'left';
          ctx.fillText(fitText(entry.partIdDisplay, boxW), centered ? xLeft + boxW / 2 : xLeft, yTop);
          return ct.idLineH;
        }
        if (fieldId === 'color') {
          ctx.font = themeCanvasFont(theme, 500, ct.colorFont);
          const sw = ct.swatchSize;
          const swGap = Math.max(2, Math.round(sw * 0.45));
          const txt = fitText(entry.colorName, Math.max(4, boxW - sw - swGap));
          const totalW = sw + swGap + ctx.measureText(txt).width;
          const startX = centered ? xLeft + (boxW - totalW) / 2 : xLeft;
          const cyMid = yTop + ct.textLineH * 0.46;
          ctx.beginPath();
          ctx.arc(startX + sw / 2, cyMid, sw / 2, 0, Math.PI * 2);
          ctx.fillStyle = entry.colorHex || '#9ea3a8';
          ctx.fill();
          ctx.strokeStyle = 'rgba(127, 127, 127, 0.45)';
          ctx.lineWidth = 0.85;
          ctx.stroke();
          ctx.fillStyle = theme.muted;
          ctx.textAlign = 'left';
          ctx.fillText(txt, startX + sw + swGap, yTop);
          return ct.textLineH;
        }
        return 0;
      };

      for (const c of cells) {
        const entry = c.item;
        const cx = bodyX + c.xFrac * bodyW;
        const cy = bodyY + c.yFrac * bodyH;
        const cw = c.wFrac * bodyW;
        const ch = c.hFrac * bodyH;
        const ct = computeBomCellTypography({
          cellW: cw,
          cellH: ch,
          pxPerInch,
          enabledFields,
          typeScale: typo.typeScale,
        });

        const hasImage = enabledFields.includes('image');
        const img = hasImage ? await loadImgPromise(getBomPartThumb(entry.part, c.colSpan || 1, c.rowSpan || 1)) : null;

        if (ct.layoutMode === 'horizontal-img-first' || ct.layoutMode === 'horizontal-img-last') {
          const innerW = Math.max(10, cw - ct.padX * 2);
          const innerH = Math.max(10, ch - ct.padY * 2);
          const imgColW = innerW * 0.44;
          const txtColW = Math.max(10, innerW - imgColW - Math.max(3, ct.padX));
          const imgX = ct.layoutMode === 'horizontal-img-first'
            ? cx + ct.padX + ct.imgPad
            : cx + cw - ct.padX - imgColW + ct.imgPad;
          const txtX = ct.layoutMode === 'horizontal-img-first'
            ? cx + ct.padX + imgColW + Math.max(3, ct.padX)
            : cx + ct.padX;
          if (img) {
            drawContain(ctx, img, imgX, cy + ct.padY + ct.imgPad, Math.max(8, imgColW - ct.imgPad * 2), Math.max(8, innerH - ct.imgPad * 2));
          }
          const textFields = enabledFields.filter((f) => f !== 'image');
          let curY = cy + ct.padY + Math.max(0, (innerH - ct.totalTextH) / 2);
          for (const f of textFields) {
            const lh = drawGridTextField(f, entry, ct, txtX, txtColW, curY, false);
            curY += lh + ct.textGap;
          }
        } else {
          const innerX = cx + ct.padX;
          const innerW = Math.max(10, cw - ct.padX * 2);
          const innerH = Math.max(10, ch - ct.padY * 2);
          const totalGap = Math.max(0, enabledFields.length - 1) * ct.textGap;
          const imgSlotH = hasImage ? Math.max(8, innerH - ct.totalTextH - totalGap) : 0;
          let curY = hasImage
            ? cy + ct.padY
            : cy + ct.padY + Math.max(0, (innerH - ct.totalTextH) / 2);

          for (const f of enabledFields) {
            if (f === 'image') {
              if (img) {
                drawContain(ctx, img, innerX + ct.imgPad, curY + ct.imgPad, Math.max(8, innerW - ct.imgPad * 2), Math.max(8, imgSlotH - ct.imgPad * 2));
              }
              curY += imgSlotH + ct.textGap;
            } else {
              const lh = drawGridTextField(f, entry, ct, innerX, innerW, curY, true);
              curY += lh + ct.textGap;
            }
          }
        }
      }
      ctx.textAlign = 'left';
    }
    drawFooter(state.model.title);
  } else if (page.kind === 'steps') {
    const drawRRect = (x, y, w, h, r) => {
      const rr = Math.min(r, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
    };
    const drawTruncatedText = (rawText, x, y, maxW) => {
      const text = String(rawText || '');
      if (!text || maxW <= 2) return;
      if (ctx.measureText(text).width <= maxW) {
        ctx.fillText(text, x, y);
        return;
      }
      const ell = '…';
      const ellW = ctx.measureText(ell).width;
      if (ellW >= maxW) return;
      let lo = 0;
      let hi = text.length;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (ctx.measureText(text.slice(0, mid)).width + ellW <= maxW) lo = mid;
        else hi = mid - 1;
      }
      ctx.fillText(lo > 0 ? text.slice(0, lo).trimEnd() + ell : ell, x, y);
    };

    const slots = page.slots;
    const isLand = pxW >= pxH;
    const pageSpec = page.layoutSpec || state.layoutConfig;
    const gap = typo.gap;
    const st = typo.steps;

    // Optional Finished Submodel / Section Intro Banner at top of chapter's first page
    let topY = pad;
    if (page.submodelIntro) {
      const sub = page.submodelIntro;
      const bannerH = Math.round(st.introThumbH + typo.pt(12));
      const bannerW = pxW - pad * 2;
      drawRRect(pad, pad, bannerW, bannerH, Math.round(typo.pt(10)));
      ctx.fillStyle = theme.calloutBg;
      ctx.fill();
      ctx.strokeStyle = theme.calloutBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const hasMult = sub.repeatCount > 1;
      const rawCount = sub.pieceCount || sub.canonicalParts?.length || 0;
      const multLabel = hasMult ? `×${sub.repeatCount}` : (wordless ? String(rawCount) : `${rawCount} pcs`);
      const introBrickSz = wordless && !hasMult ? Math.max(11, Math.round(st.introPillFont * 1.08)) : 0;
      const introBrickGap = introBrickSz > 0 ? Math.round(typo.pt(4)) : 0;
      ctx.font = themeCanvasFont(theme, 900, st.introPillFont);
      const multTextW = Math.ceil(ctx.measureText(multLabel).width);
      const pillW = Math.max(Math.round(typo.pt(42)), Math.round(multTextW + introBrickSz + introBrickGap + typo.pt(20)));
      const pillH = Math.round(st.introPillFont * 1.9);
      const pillX = pad + bannerW - pillW - Math.round(typo.pt(10));
      const pillY = pad + Math.round((bannerH - pillH) / 2);

      ctx.save();
      drawRRect(pad, pad, bannerW, bannerH, Math.round(typo.pt(10)));
      ctx.clip();
      const thumbUrl = getSubmodelThumb(sub, 520, 320);
      if (thumbUrl) {
        const introImg = await loadImgPromise(thumbUrl);
        drawContain(ctx, introImg, pad + Math.round(typo.pt(10)), pad + Math.round(typo.pt(6)), st.introThumbW, bannerH - Math.round(typo.pt(12)));
      }
      if (!wordless) {
        const textX = pad + Math.round(typo.pt(10)) + st.introThumbW + Math.round(typo.pt(10));
        const introTextMaxW = Math.max(0, pillX - textX - Math.round(typo.pt(8)));
        ctx.fillStyle = theme.muted;
        ctx.font = themeCanvasFont(theme, 700, st.introLabelFont);
        drawTruncatedText(sub.isSectionModule ? 'BUILD SECTION' : 'SUBMODEL', textX, pad + Math.round(bannerH * 0.22), introTextMaxW);
        ctx.fillStyle = theme.text;
        ctx.font = themeCanvasFont(theme, 800, st.introTitleFont);
        drawTruncatedText(sub.name || 'Submodel', textX, pad + Math.round(bannerH * 0.48), introTextMaxW);
      }

      drawRRect(pillX, pillY, pillW, pillH, pillH / 2);
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = themeCanvasFont(theme, 900, st.introPillFont);
      ctx.textBaseline = 'middle';
      if (introBrickSz > 0) {
        const innerW = introBrickSz + introBrickGap + multTextW;
        const innerX = pillX + (pillW - innerW) / 2;
        drawBrickGlyphCanvas(ctx, innerX, pillY + (pillH - introBrickSz) / 2, introBrickSz, '#ffffff');
        ctx.textAlign = 'left';
        ctx.fillText(multLabel, innerX + introBrickSz + introBrickGap, pillY + pillH / 2 + 1);
      } else {
        ctx.textAlign = 'center';
        ctx.fillText(multLabel, pillX + pillW / 2, pillY + pillH / 2 + 1);
      }
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.restore();

      topY = pad + bannerH + Math.round(gap * 0.8);
    }

    const availW = Math.max(80, pxW - pad * 2);
    const availH = Math.max(80, pxH - topY - pad - footerH);
    const slotRects = computePageSlotRects(slots.length, pageSpec, isLand, availW, availH, gap);
    const effectiveBorders = typeof page.layoutGroup?.showStepBorders === 'boolean' ? page.layoutGroup.showStepBorders : state.showStepBorders;

    for (let idx = 0; idx < slots.length; idx++) {
      const { ch, step, minifigSeqSlice } = slots[idx];
      const rect = slotRects[idx] || { x: 0, y: 0, w: availW, h: availH, isFeatured: slots.length === 1, isCompact: false };
      const sx = pad + rect.x;
      const sy = topY + rect.y;
      const slotW = rect.w;
      const slotH = rect.h;
      const isTightSlot = rect.isCompact || slotH < typo.pt(250) || slotW < typo.pt(230);
      const stepNumPx = (slots.length === 1 || rect.isFeatured) ? st.stepNum1Up : (isTightSlot ? st.stepNumTight : st.stepNum2Up);
      const pliThumbPx = isTightSlot ? st.pliThumbTight : st.pliThumb;
      const pliQtyPx = isTightSlot ? st.pliQtyFontTight : st.pliQtyFont;
      const isMfBuild = Boolean((step.isStandaloneFigure || ch.kind === 'minifigure') && !step.isMinifigPoseStep);
      const mfStyle = isMfBuild ? getEffectiveMinifigStyle(step) : 'classic';
      const isMfExploded = isMfBuild && mfStyle === 'exploded';
      const isMfSeq = isMfBuild && mfStyle === 'sequential';
      const isOfficialMfStyle = isMfExploded || isMfSeq;

      if (effectiveBorders && !(isOfficialMfStyle && slots.length === 1)) {
        ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.5;
        ctx.strokeRect(sx, sy, slotW, slotH);
      }

      const cam = getStepCamera(step);
      const ov = state.overrides[step.id] || {};
      const modelScale = ov.modelScale || 1.0;

      const pliH = Math.min(Math.round(pliThumbPx + typo.pt(10)), slotH * 0.22);
      const pliRadius = Math.round(typo.pt(7));
      const mfPrep = step.isMinifigPoseStep ? step.minifigPrep : null;
      const poseLegendH = (mfPrep && mfPrep.indicators && mfPrep.indicators.length > 0) ? Math.round(typo.pt(22)) : 0;
      let renderTopY = sy + st.slotPad + pliH + Math.round(typo.pt(8));
      let renderAvailH = Math.max(40, slotH - st.slotPad * 2 - pliH - Math.round(typo.pt(10)) - poseLegendH);

      if (isOfficialMfStyle) {
        const showMfLabel = !wordless && (ch.steps.length > 1 || slots.length > 1);
        if (showMfLabel) {
          ctx.fillStyle = theme.muted;
          ctx.font = themeCanvasFont(theme, 700, st.pliSubNameFont);
          ctx.fillText(step.minifigName || `Minifigure ${step.num}`, sx + st.slotPad, sy + st.slotPad);
          renderTopY = sy + st.slotPad + Math.round(st.pliSubNameFont * 1.6);
          renderAvailH = Math.max(40, slotH - st.slotPad * 2 - Math.round(st.pliSubNameFont * 1.8));
        } else {
          renderTopY = sy + st.slotPad;
          renderAvailH = Math.max(40, slotH - st.slotPad * 2);
        }
      } else {
        // Step number
        ctx.fillStyle = theme.text;
        ctx.font = themeCanvasFont(theme, 800, stepNumPx);
        ctx.fillText(String(step.num), sx + st.slotPad, sy + st.slotPad);
        const numWidth = Math.max(Math.round(stepNumPx * 1.15), Math.round(ctx.measureText(String(step.num)).width));

        // PLI Box (shows finished submodel/minifigure thumbnail + ×N or Connect verb/icon on prep & attachment steps, or raw parts otherwise)
        const pliX = sx + st.slotPad + numWidth + Math.round(typo.pt(8));
        const pliY = sy + st.slotPad;
        const pliIconSz = Math.max(13, Math.round(st.pliSubCountFont * 1.25));
        if (step.attachedSubmodel) {
          const att = step.attachedSubmodel;
          const attBoxW = wordless
            ? Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(76)), Math.round(pliH * 1.25 + pliIconSz + typo.pt(28))))
            : Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(115)), pliH * 3.4));
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.fillStyle = theme.calloutBg;
          ctx.fill();
          ctx.strokeStyle = theme.calloutBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.save();
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.clip();
          const attUrl = getSubmodelThumb(att, 360, 270);
          if (attUrl) {
            const attImg = await loadImgPromise(attUrl);
            drawContain(ctx, attImg, pliX + 6, pliY + 4, pliH * 1.25, pliH - 8);
          }
          const tx = pliX + 6 + pliH * 1.25 + 8;
          const textMaxW = Math.max(0, pliX + attBoxW - tx - 8);
          if (wordless) {
            if (att.isSectionAttach) {
              drawAttachArrowIconCanvas(ctx, tx, pliY + (pliH - pliIconSz) / 2, pliIconSz, theme.accent);
              if ((att.repeatCount || 1) > 1) {
                ctx.fillStyle = theme.accent;
                ctx.font = themeCanvasFont(theme, 900, st.pliSubCountFont);
                ctx.textBaseline = 'middle';
                ctx.fillText(`×${att.repeatCount}`, tx + pliIconSz + 4, pliY + pliH / 2 + 0.5);
                ctx.textBaseline = 'top';
              }
            } else {
              ctx.fillStyle = theme.accent;
              ctx.font = themeCanvasFont(theme, 900, st.pliSubCountFont);
              ctx.textBaseline = 'middle';
              ctx.fillText(`×${att.repeatCount}`, tx, pliY + pliH / 2 + 0.5);
              ctx.textBaseline = 'top';
            }
          } else {
            ctx.fillStyle = theme.accent;
            ctx.font = themeCanvasFont(theme, 900, st.pliSubCountFont);
            drawTruncatedText(att.isSectionAttach ? (att.attachVerb || 'Connect') : `×${att.repeatCount}`, tx, pliY + Math.round(pliH * 0.16), textMaxW);
            ctx.fillStyle = theme.text;
            ctx.font = themeCanvasFont(theme, 600, st.pliSubNameFont);
            drawTruncatedText(att.name || 'Submodel', tx, pliY + Math.round(pliH * 0.56), textMaxW);
          }
          ctx.restore();
        } else if (step.minifigPrep) {
          const prep = step.minifigPrep;
          const prepBoxW = wordless
            ? Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(64)), Math.round(pliH * 1.0 + pliIconSz + typo.pt(24))))
            : Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(130)), pliH * 3.8));
          drawRRect(pliX, pliY, prepBoxW, pliH, pliRadius);
          ctx.fillStyle = theme.calloutBg;
          ctx.fill();
          ctx.strokeStyle = theme.calloutBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.save();
          drawRRect(pliX, pliY, prepBoxW, pliH, pliRadius);
          ctx.clip();
          const prepUrl = getMinifigThumb(prep.canonicalParts, `prep_${prep.id}`, MINIFIG_BUILD_CAMERA.az, MINIFIG_BUILD_CAMERA.el, 320, 320);
          if (prepUrl) {
            const prepImg = await loadImgPromise(prepUrl);
            drawContain(ctx, prepImg, pliX + 6, pliY + 4, pliH * 1.0, pliH - 8);
          }
          const tx = pliX + 6 + pliH * 1.0 + 8;
          const textMaxW = Math.max(0, pliX + prepBoxW - tx - 8);
          if (wordless) {
            drawPoseAdjustIconCanvas(ctx, tx, pliY + (pliH - pliIconSz) / 2, pliIconSz, theme.accent);
          } else {
            ctx.fillStyle = theme.accent;
            ctx.font = themeCanvasFont(theme, 800, st.pliSubCountFont);
            drawTruncatedText(prep.label || 'Position', tx, pliY + Math.round(pliH * 0.16), textMaxW);
            ctx.fillStyle = theme.text;
            ctx.font = themeCanvasFont(theme, 600, st.pliSubNameFont);
            drawTruncatedText(prep.name || 'Minifigure', tx, pliY + Math.round(pliH * 0.56), textMaxW);
          }
          ctx.restore();
        } else if (step.attachedMinifig) {
          const att = step.attachedMinifig;
          const attBoxW = wordless
            ? Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(68)), Math.round(pliH * 1.0 + typo.pt(34))))
            : Math.min(slotW - (pliX - sx) - st.slotPad, Math.max(Math.round(typo.pt(115)), pliH * 3.3));
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.fillStyle = theme.calloutBg;
          ctx.fill();
          ctx.strokeStyle = theme.calloutBorder;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.save();
          drawRRect(pliX, pliY, attBoxW, pliH, pliRadius);
          ctx.clip();
          const attUrl = getMinifigThumb(
            att.previewParts || att.canonicalParts,
            `att_${att.id}`,
            Math.round(cam.az),
            Math.round(Math.min(30, Math.max(16, cam.el))),
            320,
            320,
          );
          if (attUrl) {
            const attImg = await loadImgPromise(attUrl);
            drawContain(ctx, attImg, pliX + 6, pliY + 4, pliH * 1.0, pliH - 8);
          }
          const tx = pliX + 6 + pliH * 1.0 + 8;
          const textMaxW = Math.max(0, pliX + attBoxW - tx - 8);
          if (wordless) {
            ctx.fillStyle = theme.accent;
            ctx.font = themeCanvasFont(theme, 900, st.pliSubCountFont);
            ctx.textBaseline = 'middle';
            ctx.fillText(`×${att.repeatCount || 1}`, tx, pliY + pliH / 2 + 0.5);
            ctx.textBaseline = 'top';
          } else {
            ctx.fillStyle = theme.accent;
            ctx.font = themeCanvasFont(theme, 900, st.pliSubCountFont);
            drawTruncatedText(`×${att.repeatCount || 1}`, tx, pliY + Math.round(pliH * 0.16), textMaxW);
            ctx.fillStyle = theme.text;
            ctx.font = themeCanvasFont(theme, 600, st.pliSubNameFont);
            drawTruncatedText(att.name || 'Minifigure', tx, pliY + Math.round(pliH * 0.56), textMaxW);
          }
          ctx.restore();
        } else {
          const pliMap = new Map();
          for (const p of step.parts) { const k = `${p.p}:${p.c}`; if (!pliMap.has(k)) pliMap.set(k, { part: p, qty: 0 }); pliMap.get(k).qty++; }
          const pli = Array.from(pliMap.values()).slice(0, 6);
          if (pli.length > 0) {
            const itemW = Math.min(Math.round(pliThumbPx * 1.95), (slotW - (pliX - sx) - st.slotPad - 10) / Math.max(1, pli.length));
            drawRRect(pliX, pliY, pli.length * itemW + 10, pliH, pliRadius);
            ctx.fillStyle = theme.pliBg;
            ctx.fill();
            ctx.strokeStyle = theme.pliBorder; ctx.lineWidth = 1.25;
            ctx.stroke();
            for (let pi = 0; pi < pli.length; pi++) {
              const im = await loadImgPromise(getPliThumb(pli[pi].part));
              drawContain(ctx, im, pliX + 5 + pi * itemW, pliY + 4, itemW * 0.54, pliH - 8);
              ctx.fillStyle = theme.text; ctx.font = themeCanvasFont(theme, 700, pliQtyPx);
              ctx.fillText(`${pli[pi].qty}×`, pliX + 5 + pi * itemW + itemW * 0.58, pliY + Math.round((pliH - pliQtyPx) * 0.45));
            }
          }
        }
      }

      let badgeRightX = sx + slotW - 10;
      const effectiveCue = getEffectiveStepCue(ch, step);
      if (state.showRotCues && effectiveCue && effectiveCue !== 'none') {
        badgeRightX = drawRotationCueBadgeCanvas(ctx, effectiveCue, badgeRightX, sy + 10, theme, typo, slots.length > 2, drawRRect, wordless);
      }

      if (step.minifigPrep) {
        if (wordless) {
          const bD = Math.max(24, Math.round(typo.pt(isTightSlot ? 22 : 26)));
          const bx = badgeRightX - bD;
          const by = sy + 10;
          drawRRect(bx, by, bD, bD, bD / 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          const icoSz = Math.max(13, Math.round(bD * 0.58));
          drawPoseAdjustIconCanvas(ctx, bx + (bD - icoSz) / 2, by + (bD - icoSz) / 2, icoSz, theme.accent);
          badgeRightX = bx - 6;
        } else {
          ctx.font = themeCanvasFont(theme, 700, Math.max(10, st.cueFont));
          const prepLbl = '↻ Prepare';
          const prepW = Math.ceil(ctx.measureText(prepLbl).width + 16);
          const prepH = Math.round(Math.max(20, st.cueFont * 1.9));
          const px = badgeRightX - prepW;
          const py = sy + 12;
          drawRRect(px, py, prepW, prepH, prepH / 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.fillStyle = '#202124';
          ctx.textBaseline = 'middle';
          ctx.fillText(prepLbl, px + 8, py + prepH / 2 + 0.5);
          ctx.textBaseline = 'top';
          badgeRightX = px - 6;
        }
      }

      if (step.stepHint) {
        if (wordless) {
          const bD = Math.max(24, Math.round(typo.pt(isTightSlot ? 22 : 26)));
          const bx = badgeRightX - bD;
          const by = sy + 10;
          drawRRect(bx, by, bD, bD, bD / 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1.8;
          ctx.stroke();
          const icoSz = Math.max(13, Math.round(bD * 0.58));
          drawStepHintIconCanvas(ctx, classifyStepHintAction(step.stepHint), bx + (bD - icoSz) / 2, by + (bD - icoSz) / 2, icoSz, theme.accent);
          badgeRightX = bx - 6;
        } else {
          ctx.font = themeCanvasFont(theme, 700, 11);
          const hintW = Math.min(slotW * 0.42, ctx.measureText(step.stepHint).width + 18);
          const hintX = badgeRightX - hintW;
          const hintY = sy + 12;
          drawRRect(hintX, hintY, hintW, 22, 11);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = theme.accent;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.fillStyle = '#202124';
          ctx.fillText(step.stepHint, hintX + 9, hintY + 5, hintW - 16);
          badgeRightX = hintX - 6;
        }
      }

      // 3D Step Render / Official Minifig Style (+ optional true physical 1:1 Minifigure View card on printed paper!)
      const prev = getPreviousPartsForStep(state.model, ch, step);
      const allowMf1to1OnPage = !isMfSeq || !minifigSeqSlice || minifigSeqSlice.pageIdx === minifigSeqSlice.pageCount - 1;
      const show1to1Here = Boolean(state.showMinifig1to1 && isMfBuild && allowMf1to1OnPage);

      let mainAvailW = slotW - st.slotPad * 2;
      let mf1CardInfo = null;
      if (show1to1Here) {
        const mf1 = renderMinifigOneToOne(step.parts, pxH, hIn, Math.round(slotW * (isMfSeq ? 0.24 : 0.34)), Math.round(renderAvailH * 0.72), theme.accent);
        const cardPad = Math.round(typo.pt(8));
        const headerH = Math.round(st.mf1to1Font * 1.9);
        const mfHeaderLabel = formatMinifig1to1Header(mf1.heightMm, mf1.isExact, wordless).canvasLabel;
        ctx.font = themeCanvasFont(theme, 800, st.mf1to1Font);
        const mfHeaderW = Math.ceil(ctx.measureText(mfHeaderLabel).width);
        const cardW = Math.min(Math.round(slotW * 0.44), Math.max(Math.round(typo.pt(68)), mfHeaderW + cardPad * 2, mf1.displayPxW + cardPad * 2 + 12));
        const cardH = Math.min(renderAvailH - 4, mf1.displayPxH + headerH + cardPad * 2);
        const cardX = sx + slotW - cardW - st.slotPad;
        const cardY = renderTopY + Math.round((renderAvailH - cardH) / 2);
        const cardRadius = Math.round(typo.pt(8));
        mainAvailW = Math.max(40, cardX - (sx + st.slotPad + 8));
        mf1CardInfo = { mf1, cardPad, headerH, mfHeaderLabel, cardW, cardH, cardX, cardY, cardRadius };
      }

      if (isMfExploded) {
        const expDims = computeMinifigDiagramRenderSize({
          kind: 'exploded',
          slotCount: slots.length,
          isFeatured: Boolean(rect.isFeatured),
          targetWidth: mainAvailW,
          targetHeight: renderAvailH,
          mode: 'pdf',
          gpuMaxDim: snapshotEngine.maxDim,
        });
        const expDiag = renderMinifigExplodedDiagram(step, cam, expDims.width, expDims.height, theme, modelScale);
        const expImg = await loadImgPromise(expDiag.url);
        drawContain(ctx, expImg, sx + st.slotPad, renderTopY, mainAvailW, renderAvailH);
      } else if (isMfSeq) {
        const seqPlan = getMinifigSequentialPlanForStep(step);
        const sl = minifigSeqSlice || { start: 0, end: seqPlan.stages.length, cols: Math.min(3, seqPlan.stages.length), pageIdx: 0, pageCount: 1 };
        const visibleStages = seqPlan.stages.slice(sl.start, sl.end);
        const stGap = Math.round(Math.max(8, mainAvailW * 0.015));
        const stCellW = (mainAvailW - stGap * Math.max(0, visibleStages.length - 1)) / Math.max(1, visibleStages.length);
        const seqDims = computeMinifigDiagramRenderSize({
          kind: 'sequential',
          slotCount: slots.length,
          stageCount: visibleStages.length,
          targetWidth: stCellW,
          targetHeight: renderAvailH,
          mode: 'pdf',
          gpuMaxDim: snapshotEngine.maxDim,
        });
        for (let si = 0; si < visibleStages.length; si++) {
          const stDiag = renderMinifigSequentialStage(step, visibleStages[si], seqPlan, cam, seqDims.width, seqDims.height, theme, modelScale);
          const stImg = await loadImgPromise(stDiag.url);
          drawContain(ctx, stImg, sx + st.slotPad + si * (stCellW + stGap), renderTopY, stCellW, renderAvailH);
        }
      } else {
        const effectivePartOffsets = step.defaultPartOffsets
          ? { ...step.defaultPartOffsets, ...(ov.partOffsets || {}) }
          : (ov.partOffsets || {});
        const pdfStepDims = computeStepSlotRenderSize({
          slotWidth: mainAvailW,
          slotHeight: renderAvailH,
          slotCount: slots.length,
          isFeatured: Boolean(rect.isFeatured),
          isCompact: Boolean(rect.isCompact),
          mode: 'pdf',
          gpuMaxDim: snapshotEngine.maxDim,
        });
        const snap = renderSnapshot(prev, step.parts, cam.az, cam.el, pdfStepDims.width, pdfStepDims.height, modelScale, {
          highlightNew: state.highlightNew, highlightColor: state.highlightColor,
          fadePrev: state.fadePrev, fadeOpacity: state.fadeOpacity,
          showArrows: true, accent: theme.accent, ov, partOffsets: effectivePartOffsets,
          ...(mfPrep ? {
            minifigIndicators: mfPrep.indicators || [],
            ghostParts: mfPrep.ghostParts || [],
            highlightOnlyPartIds: new Set(mfPrep.rotatedPartIds || []),
          } : {}),
        });
        const stepImg = await loadImgPromise(snap.url);
        drawContain(ctx, stepImg, sx + st.slotPad, renderTopY, mainAvailW, renderAvailH);
      }

      if (mf1CardInfo) {
        const { mf1, cardPad, headerH, mfHeaderLabel, cardW, cardH, cardX, cardY, cardRadius } = mf1CardInfo;
        drawRRect(cardX, cardY, cardW, cardH, cardRadius);
        ctx.fillStyle = theme.calloutBg;
        ctx.fill();
        ctx.strokeStyle = theme.calloutBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.save();
        drawRRect(cardX, cardY, cardW, cardH, cardRadius);
        ctx.clip();
        ctx.fillStyle = theme.accent;
        ctx.font = themeCanvasFont(theme, 800, st.mf1to1Font);
        drawTruncatedText(mfHeaderLabel, cardX + cardPad, cardY + Math.round(cardPad * 0.7), Math.max(0, cardW - cardPad * 2));
        const mf1Img = await loadImgPromise(mf1.url);
        const imgX = cardX + Math.round((cardW - 10 - mf1.displayPxW) / 2);
        const imgY = cardY + headerH + Math.round((cardH - headerH - cardPad - mf1.displayPxH) / 2);
        ctx.drawImage(mf1Img, imgX, imgY, mf1.displayPxW, mf1.displayPxH);

        // Vertical height bracket next to 1:1 figure
        const rx = imgX + mf1.displayPxW + 5;
        const ry0 = imgY + Math.round(mf1.displayPxH * 0.04);
        const ry1 = imgY + Math.round(mf1.displayPxH * 0.96);
        ctx.strokeStyle = theme.muted;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(rx - 3, ry0); ctx.lineTo(rx + 3, ry0);
        ctx.moveTo(rx, ry0); ctx.lineTo(rx, ry1);
        ctx.moveTo(rx - 3, ry1); ctx.lineTo(rx + 3, ry1);
        ctx.stroke();
        ctx.restore();
      }

      // Color-coded rotation indicator pills at bottom of minifigure Prepare steps
      if (mfPrep && mfPrep.indicators && mfPrep.indicators.length > 0) {
        const pillFont = Math.max(9, st.cueFont);
        ctx.font = themeCanvasFont(theme, 700, pillFont);
        const pillH = Math.round(pillFont * 1.85), pillGap = Math.round(typo.pt(6)), dotR = Math.max(3, pillFont * 0.34);
        const poseIcoSz = wordless ? Math.max(11, Math.round(pillFont * 1.22)) : 0;
        const poseIcoGap = wordless ? Math.round(typo.pt(3.5)) : 0;
        const pills = mfPrep.indicators.map(ind => {
          const text = formatMinifigPoseBadgeText(ind, wordless);
          const textW = ctx.measureText(text).width;
          return { ind, text, w: Math.ceil(textW + pillFont * 2.1 + poseIcoSz + poseIcoGap) };
        });
        const totalW = pills.reduce((sum, p) => sum + p.w, 0) + pillGap * Math.max(0, pills.length - 1);
        let pxCur = sx + Math.max(st.slotPad, Math.round((slotW - totalW) / 2));
        const pyCur = sy + slotH - pillH - st.slotPad;
        for (const p of pills) {
          if (pxCur + p.w > sx + slotW - st.slotPad) break;
          const pCol = p.ind.color || theme.accent;
          drawRRect(pxCur, pyCur, p.w, pillH, pillH / 2);
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          ctx.fill();
          ctx.strokeStyle = pCol;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = pCol;
          ctx.beginPath();
          ctx.arc(pxCur + Math.round(pillFont * 0.9), pyCur + pillH / 2, dotR, 0, Math.PI * 2);
          ctx.fill();
          let txtX = pxCur + Math.round(pillFont * 1.5);
          if (wordless && poseIcoSz > 0) {
            drawMinifigPoseIconCanvas(ctx, p.ind.kind, txtX, pyCur + (pillH - poseIcoSz) / 2, poseIcoSz, pCol);
            txtX += poseIcoSz + poseIcoGap;
          }
          ctx.fillStyle = '#1e293b';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.text, txtX, pyCur + pillH / 2 + 0.5);
          ctx.textBaseline = 'top';
          pxCur += p.w + pillGap;
        }
      }

      // Final step of a duplicate submodel: show prominent ×N badge ONLY on this last step
      if (step.isSubmodelFinal) {
        const badgeLabel = `×${step.submodelRepeat || 2}`;
        const badgeFont = st.subFinalFont;
        ctx.font = themeCanvasFont(theme, 900, badgeFont);
        const bW = Math.max(Math.round(badgeFont * 2.1), Math.round(ctx.measureText(badgeLabel).width + typo.pt(16)));
        const bH = Math.round(badgeFont * 1.6);
        const bX = sx + slotW - bW - st.slotPad;
        const bY = sy + slotH - bH - st.slotPad;
        drawRRect(bX, bY, bW, bH, bH / 2);
        ctx.fillStyle = theme.accent;
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badgeLabel, bX + bW / 2, bY + bH / 2 + 1);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
      }

      // Step-specific custom callouts (notes & images)
      const slotInserts = state.stepInserts[step.id] || [];
      for (let insIdx = 0; insIdx < slotInserts.length; insIdx++) {
        const ins = slotInserts[insIdx];
        const scale = ins.scale || 1;
        const corner = ins.corner || 'bottom-right';
        const padIn = Math.round(typo.pt(8));
        const stackShift = insIdx * Math.round(typo.pt(28));
        if (ins.kind === 'text' && ins.text) {
          const fontPx = Math.round(st.insertTextFont * scale);
          ctx.font = themeCanvasFont(theme, 700, fontPx);
          const maxBoxW = Math.min(slotW - padIn * 2, Math.round(st.insertTextMaxW * scale));
          const txtW = Math.min(maxBoxW, Math.ceil(ctx.measureText(ins.text).width));
          const boxPadX = Math.round(typo.pt(7) * scale);
          const boxPadY = Math.round(typo.pt(5) * scale);
          const boxW = txtW + boxPadX * 2;
          const boxH = Math.round(fontPx * 1.35) + boxPadY * 2;
          let ix = corner.endsWith('left') ? sx + padIn : sx + slotW - padIn - boxW;
          let iy = corner.startsWith('top') ? sy + padIn + stackShift : sy + slotH - padIn - boxH - stackShift;
          if (typeof ins.x === 'number' && typeof ins.y === 'number') {
            ix = sx + ins.x;
            iy = sy + ins.y;
          }
          drawRRect(ix, iy, boxW, boxH, Math.round(typo.pt(8)));
          ctx.fillStyle = theme.calloutBg;
          ctx.fill();
          ctx.strokeStyle = theme.calloutBorder;
          ctx.lineWidth = 1.25;
          ctx.stroke();
          ctx.fillStyle = theme.text;
          ctx.textBaseline = 'top';
          drawTruncatedText(ins.text, ix + boxPadX, iy + boxPadY, Math.max(10, boxW - boxPadX * 2));
        } else if (ins.kind === 'image' && ins.src) {
          try {
            const insImg = await loadImgPromise(ins.src);
            const imgSz = Math.round(st.insertImgSize * scale);
            let ix = corner.endsWith('left') ? sx + padIn : sx + slotW - padIn - imgSz;
            let iy = corner.startsWith('top') ? sy + padIn + stackShift : sy + slotH - padIn - imgSz - stackShift;
            if (typeof ins.x === 'number' && typeof ins.y === 'number') {
              ix = sx + ins.x;
              iy = sy + ins.y;
            }
            const ar = insImg.naturalWidth / Math.max(1, insImg.naturalHeight);
            const dw = ar >= 1 ? imgSz : Math.round(imgSz * ar);
            const dh = ar >= 1 ? Math.round(imgSz / ar) : imgSz;
            ctx.drawImage(insImg, ix + (imgSz - dw) / 2, iy + (imgSz - dh) / 2, dw, dh);
          } catch (_) {}
        }
      }
    }

    drawFooter(page.chapterName || '');
  }

  const jpegQuality = page.kind === 'cover' ? 0.94 : 0.92;
  const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
  const b64 = dataUrl.split(',')[1];
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return { bytes, pxW, pxH, dataUrl, links };
}

let lastGeneratedPdfBlob = null, lastGeneratedPdfUrl = null, lastGeneratedPdfName = 'manual.pdf';
async function runPdfExport(pagesToExport) {
  const [pageWpt, pageHpt] = getPdfPaperPts();
  document.getElementById('expProgressWrap').classList.remove('hidden');
  document.getElementById('expReadyWrap').classList.add('hidden');
  const jpegPages = [];
  for (let i = 0; i < pagesToExport.length; i++) {
    const pct = Math.round(((i + 1) / pagesToExport.length) * 100);
    document.getElementById('expProgressLabel').textContent = `Rendering page ${i + 1} of ${pagesToExport.length}…`;
    document.getElementById('expProgressPct').textContent = pct + '%';
    document.getElementById('expProgressBar').style.width = pct + '%';
    await new Promise(r => setTimeout(r, 8));
    const pg = pagesToExport[i];
    const pgDims = computePdfPagePixelDimensions(pageWpt, pageHpt, pg.kind);
    jpegPages.push(await renderPageToJpegBytes(pg, pgDims.width, pgDims.height, pageWpt, pageHpt));
  }
  const pdfBytes = buildPdfBinary(jpegPages, pageWpt, pageHpt);
  if (lastGeneratedPdfUrl) URL.revokeObjectURL(lastGeneratedPdfUrl);
  lastGeneratedPdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
  lastGeneratedPdfUrl = URL.createObjectURL(lastGeneratedPdfBlob);
  lastGeneratedPdfName = `${state.model.title.replace(/[^a-z0-9_-]+/gi, '_')}_${pagesToExport.length === 1 ? 'page' + pagesToExport[0].num : 'manual'}.pdf`;

  document.getElementById('expProgressWrap').classList.add('hidden');
  document.getElementById('expReadyWrap').classList.remove('hidden');
  document.getElementById('expReadyNote').textContent = `PDF Ready (${(pdfBytes.length / 1024).toFixed(0)} KB · ${pagesToExport.length} page${pagesToExport.length > 1 ? 's' : ''})`;
  const prevImg = document.getElementById('expPreviewImg');
  if (prevImg && jpegPages[0]?.dataUrl) prevImg.src = jpegPages[0].dataUrl;
  const dlLink = document.getElementById('linkDownloadPdf');
  dlLink.href = lastGeneratedPdfUrl; dlLink.download = lastGeneratedPdfName;

  const shareBtn = document.getElementById('btnSharePdf');
  const canShareFiles = Boolean(navigator.share && navigator.canShare && navigator.canShare({ files: [new File([lastGeneratedPdfBlob], lastGeneratedPdfName, { type: 'application/pdf' })] }));
  shareBtn.classList.toggle('hidden', !canShareFiles);
}

// =========================================================================
// 13. EVENT WIRING & FILE IMPORT / EXPORT
// =========================================================================
function openMenu() { document.getElementById('menuBackdrop').classList.remove('hidden'); syncMenuControls(); }
function closeMenu() { document.getElementById('menuBackdrop').classList.add('hidden'); }

document.getElementById('btnOpenMenu').onclick = openMenu;
document.getElementById('desktopModelChip').onclick = openMenu;
const mobileEditorBrandPillEl = document.getElementById('mobileEditorBrandPill');
if (mobileEditorBrandPillEl) mobileEditorBrandPillEl.onclick = openMenu;
document.getElementById('btnCloseMenu').onclick = closeMenu;
document.getElementById('menuDismissArea').onclick = closeMenu;

const stylePopEl = document.getElementById('stylePopover');
const btnStylePopEl = document.getElementById('btnStylePop');

function updateStylePopoverTail() {
  if (!stylePopEl || !btnStylePopEl || stylePopEl.classList.contains('hidden')) return;
  const btnRect = btnStylePopEl.getBoundingClientRect();
  const popRect = stylePopEl.getBoundingClientRect();
  const btnCenterX = btnRect.left + btnRect.width / 2;
  const tailRight = Math.max(24, Math.min(popRect.width - 24, popRect.right - btnCenterX));
  stylePopEl.style.setProperty('--style-tail-right', `${tailRight.toFixed(1)}px`);
}

function setStylePopoverOpen(open) {
  if (!stylePopEl || !btnStylePopEl) return;
  stylePopEl.classList.toggle('hidden', !open);
  btnStylePopEl.classList.toggle('style-chip-open', open);
  btnStylePopEl.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    syncMenuControls();
    updateStylePopoverTail();
  }
}

btnStylePopEl.onclick = () => {
  setStylePopoverOpen(stylePopEl.classList.contains('hidden'));
};
document.addEventListener('pointerdown', (e) => {
  if (!stylePopEl || stylePopEl.classList.contains('hidden')) return;
  const t = e.target;
  if (t instanceof Node && (stylePopEl.contains(t) || (btnStylePopEl && btnStylePopEl.contains(t)))) return;
  setStylePopoverOpen(false);
}, true);

/* ------------------------------------------------------------------
 * Style dialog: theme strip + inline theme editing
 * ------------------------------------------------------------------ */
const THEME_COLOR_FIELDS = [
  ['themeColorBg', 'bgColor', '#d8ecfd'],
  ['themeColorBgEnd', 'bgColorEnd', '#b7daf9'],
  ['themeColorText', 'text', '#172536'],
  ['themeColorMuted', 'muted', '#4a607a'],
  ['themeColorAccent', 'accent', '#1a73e8'],
  ['themeColorPliBg', 'pliBg', '#ffffff'],
  ['themeColorPliBorder', 'pliBorder', '#8ab8e6'],
  ['themeColorCalloutBg', 'calloutBg', '#fffbe6'],
  ['themeColorCalloutBorder', 'calloutBorder', '#eab308'],
];

function buildThemeStripCard(t, isActive) {
  const card = document.createElement('button');
  card.type = 'button';
  card.setAttribute('role', 'option');
  card.setAttribute('aria-selected', isActive ? 'true' : 'false');
  card.title = `${t.name}${t.builtIn ? '' : ' (custom)'}${isActive ? ' — current' : ''}`;
  card.className = `theme-strip-card snap-start shrink-0 w-[112px] rounded-lg border p-1.5 text-left transition cursor-pointer ${isActive ? 'border-[var(--primary)] ring-2 ring-[var(--primary-border)]' : 'border-[var(--border)] hover:border-[var(--primary-border)]'}`;

  const preview = document.createElement('div');
  preview.className = 'theme-card-preview h-[58px] rounded-md border border-black/10 relative overflow-hidden px-2 py-1.5 flex flex-col justify-between';
  applyThemeBackgroundToElement(preview, t);
  applyThemeFontsToElement(preview, t);
  preview.style.color = t.text;

  const top = document.createElement('div');
  top.className = 'flex items-start justify-between gap-1';
  const num = document.createElement('span');
  num.className = 'font-black text-lg leading-none';
  num.textContent = '1';
  const pli = document.createElement('span');
  pli.className = 'px-1 py-0.5 rounded-[3px] text-[9px] font-bold leading-none flex items-center gap-0.5';
  pli.style.background = t.pliBg;
  pli.style.border = `1px solid ${t.pliBorder}`;
  pli.innerHTML = '<span class="w-2 h-1.5 rounded-[1px] bg-[#c91a09] inline-block"></span><span>2×</span>';
  top.appendChild(num);
  top.appendChild(pli);

  const bottom = document.createElement('div');
  bottom.className = 'flex items-center justify-between gap-1 text-[9px] font-medium leading-none';
  const muted = document.createElement('span');
  muted.className = 'truncate';
  muted.style.color = t.muted;
  muted.textContent = 'Aa Bb';
  const dot = document.createElement('span');
  dot.className = 'w-2.5 h-2.5 rounded-full border border-white/70 shrink-0';
  dot.style.background = t.accent;
  bottom.appendChild(muted);
  bottom.appendChild(dot);

  preview.appendChild(top);
  preview.appendChild(bottom);

  const label = document.createElement('div');
  label.className = 'mt-1 flex items-center gap-1 min-w-0';
  const name = document.createElement('span');
  name.className = 'text-[11px] font-semibold truncate min-w-0';
  name.textContent = t.name;
  label.appendChild(name);
  if (!t.builtIn) {
    // Compact pencil marker for custom themes (keeps names readable on narrow cards)
    const tag = document.createElement('span');
    tag.className = 'shrink-0 text-[var(--muted-foreground)]';
    tag.setAttribute('aria-label', 'Custom theme');
    tag.innerHTML = '<svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    label.insertBefore(tag, name);
  }

  card.appendChild(preview);
  card.appendChild(label);
  card.onclick = () => {
    if (t.id === state.themeId) return;
    selectTheme(t.id);
    const strip = document.getElementById('themeStrip');
    if (strip) strip.scrollTo({ left: 0, behavior: 'smooth' });
  };
  return card;
}

function renderThemeStrip() {
  const strip = document.getElementById('themeStrip');
  if (!strip) return;
  const ordered = orderThemesByRecent(getAllThemes(customThemes), themeRecents, state.themeId);
  const sig = ordered.map(t => `${t.id}:${t.updatedAt || ''}:${t.name}`).join('|') + `#${state.themeId}`;
  if (strip.dataset.sig === sig) return;
  const keepScroll = strip.dataset.sigHead === `${state.themeId}` ? strip.scrollLeft : 0;
  strip.dataset.sig = sig;
  strip.dataset.sigHead = `${state.themeId}`;
  strip.innerHTML = '';
  for (const t of ordered) strip.appendChild(buildThemeStripCard(t, t.id === state.themeId));
  strip.scrollLeft = keepScroll;
}

function syncStylePanel() {
  const t = getActiveTheme();
  const isBuiltIn = Boolean(t.builtIn || BUILT_IN_THEME_IDS.has(t.id));
  renderThemeStrip();

  const nameInput = document.getElementById('themeNameInput');
  if (nameInput && document.activeElement !== nameInput && nameInput.value !== t.name) nameInput.value = t.name;
  document.getElementById('themeBuiltInHint')?.classList.toggle('hidden', !isBuiltIn);
  const delBtn = document.getElementById('btnDeleteTheme');
  if (delBtn) {
    delBtn.disabled = isBuiltIn;
    delBtn.title = isBuiltIn ? 'Built-in themes cannot be deleted' : `Delete "${t.name}"`;
  }
  const referencingGroupNames = isBuiltIn
    ? []
    : (state.layoutGroups || []).filter((g) => g.themeId === t.id).map((g) => g.name);
  applyDestructiveNoticeToEl(
    'themeDeleteNotice',
    getDeleteThemeDestructiveNotice({
      themeName: t.name,
      isBuiltIn,
      referencingGroupNames,
    }),
  );
  const expBtn = document.getElementById('btnExportTheme');
  if (expBtn) expBtn.title = `Export "${t.name}" (${THEME_FILE_EXT})`;

  for (const [elId, field, fallback] of THEME_COLOR_FIELDS) {
    const el = document.getElementById(elId);
    if (el) {
      const v = toHexColor(t[field] || fallback, t.bgColor);
      if (el.value !== v) el.value = v;
    }
  }
  const bpEl = document.getElementById('themeBlueprintGrid');
  if (bpEl) bpEl.checked = Boolean(t.bp);
  const isGrad = t.bgType === 'gradient';
  document.getElementById('themeColorBgEndWrap')?.classList.toggle('hidden', !isGrad);
  document.getElementById('themeAngleWrap')?.classList.toggle('hidden', !isGrad);
  document.querySelectorAll('.theme-bgtype-btn').forEach(b => {
    const act = b.getAttribute('data-bg-type') === t.bgType;
    b.className = `theme-bgtype-btn px-2.5 py-1 rounded text-xs font-semibold transition cursor-pointer ${act ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'text-[var(--muted-foreground)]'}`;
  });
  document.querySelectorAll('.theme-angle-btn').forEach(b => {
    const act = Number(b.getAttribute('data-bg-angle')) === Number(t.bgAngle);
    b.className = `theme-angle-btn py-1.5 rounded-md border font-semibold transition cursor-pointer ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--background)]'}`;
  });

  const headingSel = document.getElementById('themeHeadingFont');
  const hf = sanitizeThemeFontId(t.headingFont);
  if (headingSel && headingSel.value !== hf) headingSel.value = hf;
  const bodySel = document.getElementById('themeBodyFont');
  const bf = sanitizeThemeFontId(t.bodyFont);
  if (bodySel && bodySel.value !== bf) bodySel.value = bf;

  const opts = getThemeStyleOptions(t);
  const setChk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = Boolean(val); };
  setChk('toggleHighlight', opts.highlightNew);
  setChk('toggleFade', opts.fadePrev);
  setChk('toggleRotCues', opts.showRotCues);
  setChk('toggleSizeGuides', opts.showSizeGuides);
  setChk('toggleMinifig1to1', opts.showMinifig1to1);
  setChk('toggleStepBorders', opts.showStepBorders);
  setChk('toggleStepBordersSetup', opts.showStepBorders);
  setChk('togglePageTitle', opts.showPageTitle);
  setChk('togglePageTitleSetup', opts.showPageTitle);
  const wordlessOn = Boolean(state.wordlessMode);
  for (const [chkId, lblId, noteId] of [
    ['togglePageTitle', 'togglePageTitleLabel', 'pageTitleWordlessNote'],
    ['togglePageTitleSetup', 'togglePageTitleSetupLabel', 'pageTitleSetupWordlessNote'],
  ]) {
    const chk = document.getElementById(chkId);
    const lbl = document.getElementById(lblId);
    const note = document.getElementById(noteId);
    if (chk) chk.disabled = wordlessOn;
    if (lbl) {
      lbl.classList.toggle('opacity-55', wordlessOn);
      lbl.title = wordlessOn ? 'Hidden while Wordless Instructions is enabled' : '';
    }
    if (note) note.classList.toggle('hidden', !wordlessOn);
  }
  const hlEl = document.getElementById('highlightColor');
  if (hlEl && hlEl.value !== opts.highlightColor) hlEl.value = opts.highlightColor;

  const bc = normalizeBomConfig(opts.bomConfig);
  const effBc = resolveEffectiveBomConfig(bc, Boolean(state.bomShowTextFields));
  const styleBomSum = document.getElementById('styleBomSummary');
  if (styleBomSum) styleBomSum.textContent = summarizeBomConfig(effBc);
  document.querySelectorAll('.style-bom-format-btn').forEach(b => {
    const act = b.getAttribute('data-style-bom-format') === bc.format;
    b.className = `style-bom-format-btn py-1.5 px-2 rounded-md border font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${act ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]' : 'border-[var(--border)] bg-[var(--surface-sunken)] hover:border-[var(--primary)]'}`;
  });
  setChk('styleToggleBomPartId', isBomFieldEnabled(bc, 'partId'));
}

function populateThemeFontSelect(elId) {
  const sel = document.getElementById(elId);
  if (!sel) return;
  sel.innerHTML = THEME_FONT_IDS.map((id) => {
    const f = THEME_FONTS[id];
    return `<option value="${id}" style="font-family:${f.stack.replace(/"/g, '&quot;')}">${escHtml(f.label)}</option>`;
  }).join('');
  sel.onchange = (e) => {
    patchActiveTheme({ [elId === 'themeHeadingFont' ? 'headingFont' : 'bodyFont']: sanitizeThemeFontId(e.target.value) });
  };
}
populateThemeFontSelect('themeHeadingFont');
populateThemeFontSelect('themeBodyFont');

for (const [elId, field] of THEME_COLOR_FIELDS) {
  const el = document.getElementById(elId);
  if (el) el.oninput = (e) => patchActiveTheme({ [field]: e.target.value });
}
document.querySelectorAll('.theme-bgtype-btn').forEach(b => {
  b.onclick = () => patchActiveTheme({ bgType: b.getAttribute('data-bg-type') === 'gradient' ? 'gradient' : 'solid' });
});
document.querySelectorAll('.theme-angle-btn').forEach(b => {
  b.onclick = () => patchActiveTheme({ bgAngle: Number(b.getAttribute('data-bg-angle')) || 180 });
});
document.getElementById('themeBlueprintGrid').onchange = (e) => patchActiveTheme({ bp: e.target.checked });

const themeNameInputEl = document.getElementById('themeNameInput');
themeNameInputEl.oninput = (e) => {
  const v = String(e.target.value || '').slice(0, 40);
  if (!v.trim()) return; // keep the old name until something is typed
  patchActiveTheme({ name: v });
};
themeNameInputEl.onblur = () => { themeNameInputEl.value = getActiveTheme().name; };
themeNameInputEl.onkeydown = (e) => { if (e.key === 'Enter') themeNameInputEl.blur(); };

document.getElementById('btnNewCustomTheme').onclick = () => {
  const created = forkThemeIntoCustom(getActiveTheme());
  renderAll();
  showToast(`Created "${created.name}" from the current theme.`);
  requestAnimationFrame(() => {
    const strip = document.getElementById('themeStrip');
    if (strip) strip.scrollTo({ left: 0, behavior: 'smooth' });
    themeNameInputEl.focus();
    themeNameInputEl.select();
  });
};

document.getElementById('btnDeleteTheme').onclick = () => {
  const t = getActiveTheme();
  if (t.builtIn || BUILT_IN_THEME_IDS.has(t.id)) return;
  if (!confirm(`Delete the custom theme "${t.name}"?`)) return;
  customThemes = customThemes.filter(c => c.id !== t.id);
  themeRecents = themeRecents.filter(id => id !== t.id);
  saveThemeRecentsToStorage(themeRecents);
  persistCustomThemes();
  const next = orderThemesByRecent(getAllThemes(customThemes), themeRecents, '')[0];
  selectTheme(next ? next.id : 'blue');
  showToast(`Deleted "${t.name}".`);
};

document.getElementById('btnExportTheme').onclick = async () => {
  const t = getActiveTheme();
  const payload = serializeThemeExport(t);
  const fileName = buildThemeFileName(t.name);
  await shareOrDownloadCustomFile(payload, fileName, `Shared "${t.name}" theme.`, `Exported ${fileName}`);
};

document.getElementById('btnImportTheme').onclick = () => {
  document.getElementById('themeImportInput').click();
};

document.getElementById('themeImportInput').onchange = async (e) => {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (!f) return;
  try {
    const incoming = await parseImportedThemeFile(f);
    const { merged, importedIds } = mergeImportedThemes(customThemes, incoming);
    customThemes = merged;
    persistCustomThemes();
    // Older theme packs may contain several themes; surface them all in the strip.
    for (const id of [...importedIds].reverse()) themeRecents = touchThemeRecent(themeRecents, id);
    saveThemeRecentsToStorage(themeRecents);
    if (importedIds.length > 0) selectTheme(importedIds[0]);
    else renderAll();
    const first = customThemes.find(t => t.id === importedIds[0]);
    showToast(
      importedIds.length === 1 && first
        ? `Imported theme "${first.name}".`
        : `Imported ${importedIds.length} custom themes.`,
    );
  } catch (err) {
    showToast(err?.message || 'Could not import theme file.');
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  const applyModal = document.getElementById('applyAngleModal');
  if (isPageBreakHelpTooltipOpen()) {
    hidePageBreakHelpTooltip();
  } else if (isBricksLibraryModalOpen()) {
    closeBricksLibraryModal();
  } else if (applyModal && !applyModal.classList.contains('hidden')) {
    closeApplyAngleModal();
  } else if (isBomSetupModalOpen()) {
    closeBomSetupModal();
  } else if (isOverviewModalOpen()) {
    closeOverviewModal();
  } else if (stylePopEl && !stylePopEl.classList.contains('hidden')) {
    setStylePopoverOpen(false);
  }
});

// Delegated hover, keyboard focus, and outside-click handlers for Page Break `?` help buttons
document.addEventListener('pointerover', (e) => {
  if (e.pointerType === 'touch') return;
  const target = e.target;
  if (!(target instanceof Element)) return;
  if (target.closest('#pageBreakHelpTooltip')) {
    if (pageBreakHelpState.hideTimer) {
      clearTimeout(pageBreakHelpState.hideTimer);
      pageBreakHelpState.hideTimer = 0;
    }
    return;
  }
  const trigger = target.closest('.pb-help-btn');
  if (!trigger) return;
  if (pageBreakHelpState.hideTimer) {
    clearTimeout(pageBreakHelpState.hideTimer);
    pageBreakHelpState.hideTimer = 0;
  }
  if (pageBreakHelpState.pinned && pageBreakHelpState.activeTrigger !== trigger) return;
  if (!isPageBreakHelpTooltipOpen() || pageBreakHelpState.activeTrigger !== trigger) {
    showPageBreakHelpTooltip(trigger, {
      pinned: pageBreakHelpState.pinned && pageBreakHelpState.activeTrigger === trigger,
    });
  }
});

document.addEventListener('pointerout', (e) => {
  if (e.pointerType === 'touch') return;
  if (!isPageBreakHelpTooltipOpen() || pageBreakHelpState.pinned) return;
  const target = e.target;
  if (!(target instanceof Element)) return;
  const fromHelp = target.closest('.pb-help-btn') || target.closest('#pageBreakHelpTooltip');
  if (!fromHelp) return;
  const related = e.relatedTarget;
  if (
    related instanceof Element
    && (related.closest('.pb-help-btn') === pageBreakHelpState.activeTrigger || related.closest('#pageBreakHelpTooltip'))
  ) {
    return;
  }
  scheduleHidePageBreakHelpTooltip();
});

document.addEventListener('focusin', (e) => {
  const target = e.target;
  if (!(target instanceof Element)) return;
  const trigger = target.closest('.pb-help-btn');
  if (!trigger) {
    if (isPageBreakHelpTooltipOpen() && !pageBreakHelpState.pinned && !target.closest('#pageBreakHelpTooltip')) {
      hidePageBreakHelpTooltip();
    }
    return;
  }
  let isKeyboardFocus = false;
  try { isKeyboardFocus = trigger.matches(':focus-visible'); } catch {}
  if (!isKeyboardFocus) return;
  if (pageBreakHelpState.pinned && pageBreakHelpState.activeTrigger !== trigger) return;
  showPageBreakHelpTooltip(trigger, {
    pinned: pageBreakHelpState.pinned && pageBreakHelpState.activeTrigger === trigger,
  });
});

document.addEventListener('focusout', (e) => {
  if (!isPageBreakHelpTooltipOpen() || pageBreakHelpState.pinned) return;
  const target = e.target;
  if (!(target instanceof Element)) return;
  if (!target.closest('.pb-help-btn')) return;
  const related = e.relatedTarget;
  if (related instanceof Element && related.closest('#pageBreakHelpTooltip')) return;
  hidePageBreakHelpTooltip();
});

const dismissPageBreakHelpOnOutside = (e) => {
  if (!isPageBreakHelpTooltipOpen()) return;
  const target = e.target;
  if (target instanceof Element && (target.closest('#pageBreakHelpTooltip') || target.closest('.pb-help-btn'))) {
    return;
  }
  hidePageBreakHelpTooltip();
};
document.addEventListener('pointerdown', dismissPageBreakHelpOnOutside, true);
document.addEventListener('click', dismissPageBreakHelpOnOutside, true);
window.addEventListener('resize', () => {
  if (isPageBreakHelpTooltipOpen()) hidePageBreakHelpTooltip();
});

document.getElementById('btnPageOverview').onclick = () => {
  const modal = document.getElementById('overviewModal');
  modal.classList.remove('hidden');
  renderOverviewModal({ scrollActiveIntoView: true });
};
document.getElementById('btnCloseOverview').onclick = () => closeOverviewModal();
document.getElementById('overviewModal').onclick = (e) => {
  if (e.target === e.currentTarget) closeOverviewModal();
};
const overviewListEl = document.getElementById('overviewList');
if (overviewListEl) {
  overviewListEl.addEventListener('scroll', () => {
    syncOverviewScrollButtons();
    if (isPageBreakHelpTooltipOpen()) hidePageBreakHelpTooltip();
  }, { passive: true });
  if (typeof ResizeObserver === 'function') {
    const overviewRo = new ResizeObserver(() => syncOverviewScrollButtons());
    overviewRo.observe(overviewListEl);
  }
}
const stepEditBodyEl = document.getElementById('stepEditBody');
if (stepEditBodyEl) {
  stepEditBodyEl.addEventListener('scroll', () => {
    if (isPageBreakHelpTooltipOpen()) hidePageBreakHelpTooltip();
  }, { passive: true });
}
const btnOverviewJumpTop = document.getElementById('btnOverviewJumpTop');
if (btnOverviewJumpTop) {
  btnOverviewJumpTop.onclick = () => scrollOverviewListTo('top');
}
const btnOverviewJumpBottom = document.getElementById('btnOverviewJumpBottom');
if (btnOverviewJumpBottom) {
  btnOverviewJumpBottom.onclick = () => scrollOverviewListTo('bottom');
}

document.getElementById('btnUndo').onclick = () => {
  if (!state.undoStack.length) return;
  state.redoStack.push(captureHistorySnap());
  applyHistorySnap(state.undoStack.pop());
};
document.getElementById('btnRedo').onclick = () => {
  if (!state.redoStack.length) return;
  state.undoStack.push(captureHistorySnap());
  applyHistorySnap(state.redoStack.pop());
};

// Apply Camera to Step Range Modal bindings
const applyAngleModalEl = document.getElementById('applyAngleModal');
if (applyAngleModalEl) {
  applyAngleModalEl.onclick = (e) => { if (e.target === applyAngleModalEl) closeApplyAngleModal(); };
}
const btnCloseApplyAngle = document.getElementById('btnCloseApplyAngle');
if (btnCloseApplyAngle) btnCloseApplyAngle.onclick = closeApplyAngleModal;
const btnCancelApplyAngle = document.getElementById('btnCancelApplyAngle');
if (btnCancelApplyAngle) btnCancelApplyAngle.onclick = closeApplyAngleModal;
const angleRangeMinEl = document.getElementById('angleRangeMin');
const angleRangeMaxEl = document.getElementById('angleRangeMax');
if (angleRangeMinEl) {
  angleRangeMinEl.oninput = (e) => {
    const val = Number(e.target.value);
    const curHi = Math.max(applyAngleState.startNum, applyAngleState.endNum);
    applyAngleState.startNum = Math.min(val, curHi);
    applyAngleState.endNum = curHi;
    applyAngleState.awaitingEndClick = false;
    syncApplyAngleRangeUI();
  };
}
if (angleRangeMaxEl) {
  angleRangeMaxEl.oninput = (e) => {
    const val = Number(e.target.value);
    const curLo = Math.min(applyAngleState.startNum, applyAngleState.endNum);
    applyAngleState.startNum = curLo;
    applyAngleState.endNum = Math.max(val, curLo);
    applyAngleState.awaitingEndClick = false;
    syncApplyAngleRangeUI();
  };
}
const btnAnglePresetFollowing = document.getElementById('btnAnglePresetFollowing');
if (btnAnglePresetFollowing) {
  btnAnglePresetFollowing.onclick = () => {
    const all = applyAngleState.allSteps;
    if (!all.length || !applyAngleState.sourceStep) return;
    applyAngleState.startNum = getAbsStepNum(applyAngleState.sourceStep);
    applyAngleState.endNum = getAbsStepNum(all[all.length - 1].step);
    applyAngleState.awaitingEndClick = false;
    syncApplyAngleRangeUI();
  };
}
const btnAnglePresetSubmodel = document.getElementById('btnAnglePresetSubmodel');
if (btnAnglePresetSubmodel) {
  btnAnglePresetSubmodel.onclick = () => {
    const r = applyAngleState.sourceCh?.kind === 'submodel' ? getChapterAbsRange(applyAngleState.sourceCh) : null;
    if (!r) return;
    applyAngleState.startNum = r.lo;
    applyAngleState.endNum = r.hi;
    applyAngleState.awaitingEndClick = false;
    syncApplyAngleRangeUI();
  };
}
const btnAnglePresetSection = document.getElementById('btnAnglePresetSection');
if (btnAnglePresetSection) {
  btnAnglePresetSection.onclick = () => {
    const r = getSectionAbsRange(state.model?.chapters || [], applyAngleState.sourceCh);
    if (!r) return;
    applyAngleState.startNum = r.lo;
    applyAngleState.endNum = r.hi;
    applyAngleState.awaitingEndClick = false;
    syncApplyAngleRangeUI();
  };
}
const btnAnglePresetAll = document.getElementById('btnAnglePresetAll');
if (btnAnglePresetAll) {
  btnAnglePresetAll.onclick = () => {
    const all = applyAngleState.allSteps;
    if (!all.length) return;
    applyAngleState.startNum = getAbsStepNum(all[0].step);
    applyAngleState.endNum = getAbsStepNum(all[all.length - 1].step);
    applyAngleState.awaitingEndClick = false;
    syncApplyAngleRangeUI();
  };
}
const applyCameraIncludeFramingEl = document.getElementById('applyCameraIncludeFraming');
if (applyCameraIncludeFramingEl) {
  applyCameraIncludeFramingEl.onchange = (e) => {
    applyAngleState.includeFraming = Boolean(e.target.checked);
    syncApplyAngleRangeUI();
  };
}
const btnConfirmApplyAngle = document.getElementById('btnConfirmApplyAngle');
if (btnConfirmApplyAngle) {
  btnConfirmApplyAngle.onclick = () => {
    if (!applyAngleState.camera || !applyAngleState.allSteps.length) return;
    pushUndo();
    const cameraPayload = applyAngleState.includeFraming
      ? {
          ...applyAngleState.camera,
          modelScale: applyAngleState.sourceModelScale,
          focusMode: applyAngleState.sourceFocusMode,
        }
      : applyAngleState.camera;
    const res = applyCameraAngleToStepRange(
      applyAngleState.allSteps.map(x => x.step),
      state.overrides,
      applyAngleState.startNum,
      applyAngleState.endNum,
      cameraPayload,
    );
    state.overrides = res.overrides;
    closeApplyAngleModal();
    showToast(`Applied camera${applyAngleState.includeFraming ? ', zoom & framing' : ''} to ${res.appliedCount} step${res.appliedCount === 1 ? '' : 's'}.`);
    renderAll();
  };
}

document.querySelectorAll('.mode-btn').forEach(b => {
  b.onclick = () => {
    const nextMode = b.getAttribute('data-mode');
    if (!nextMode) return;
    const curPage = state.pages[state.pageIdx];
    if (nextMode === 'page' && curPage?.kind === 'bom') {
      if (isBomSetupModalOpen()) {
        closeBomSetupModal();
      } else {
        openBomSetupModal();
      }
      return;
    }
    if (isBomSetupModalOpen()) closeBomSetupModal();
    state.mode = nextMode;
    if (state.mode !== 'parts') state.selectedPartIds.clear();
    state.selectedArrangeEl = null;
    renderAll();
  };
});

function navigatePage(action) {
  dismissErrorBanner();
  const targetIdx = resolvePageNavigationTarget(state.pageIdx, state.pages.length, action);
  if (targetIdx !== state.pageIdx) {
    state.pageIdx = targetIdx;
    state.selectedPartIds.clear();
    resetZoom();
    renderAll();
  }
}
const firstPageBtn = document.getElementById('firstPage');
if (firstPageBtn) firstPageBtn.onclick = () => navigatePage('first');
document.getElementById('prevPage').onclick = () => navigatePage('prev');
document.getElementById('nextPage').onclick = () => navigatePage('next');
const lastPageBtn = document.getElementById('lastPage');
if (lastPageBtn) lastPageBtn.onclick = () => navigatePage('last');
document.getElementById('btnZoomIn').onclick = () => setZoom(state.zoom * 1.22);
document.getElementById('btnZoomOut').onclick = () => setZoom(state.zoom * 0.82);
document.getElementById('btnZoomFit').onclick = resetZoom;

// Print & Page Setup + Parts List Setup
const paperFormatSelectEl = document.getElementById('paperFormatSelect');
if (paperFormatSelectEl) {
  paperFormatSelectEl.onchange = (e) => {
    state.paperFormat = e.target.value;
    resetZoom();
    renderAll();
  };
}
document.querySelectorAll('.unit-btn').forEach(b => {
  b.onclick = () => {
    const nextUnit = b.getAttribute('data-unit');
    if (nextUnit === state.customUnit) return;
    if (nextUnit === 'cm') { state.customWidth = +(state.customWidth * 2.54).toFixed(1); state.customHeight = +(state.customHeight * 2.54).toFixed(1); }
    else { state.customWidth = +(state.customWidth / 2.54).toFixed(2); state.customHeight = +(state.customHeight / 2.54).toFixed(2); }
    state.customUnit = nextUnit;
    renderAll();
  };
});
const onCustomDimChange = () => {
  const w = parseFloat(document.getElementById('customWidthIn').value);
  const h = parseFloat(document.getElementById('customHeightIn').value);
  if (isFinite(w) && w >= 2) state.customWidth = w;
  if (isFinite(h) && h >= 2) state.customHeight = h;
  resetZoom();
  renderAll();
};
document.getElementById('customWidthIn').onchange = onCustomDimChange;
document.getElementById('customHeightIn').onchange = onCustomDimChange;
document.querySelectorAll('.orient-btn').forEach(b => { b.onclick = () => { state.orientation = b.getAttribute('data-orient'); resetZoom(); renderAll(); }; });

// Customizable Step Grid, Order Direction, Mixed Layouts & Step Range Groups
// (steps per page is derived from the grid / mixed layout and page breaks — not edited directly)
const setLayoutConfig = (patch) => {
  state.layoutConfig = withDerivedStepsPerPage({ ...state.layoutConfig, ...patch });
  syncLegacyLayoutFlag();
  renderAll();
};
const layoutColsSel = document.getElementById('layoutColsSelect');
if (layoutColsSel) {
  layoutColsSel.onchange = (e) => {
    const v = e.target.value === 'auto' ? 'auto' : Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 1));
    setLayoutConfig({ cols: v });
  };
}
const layoutRowsSel = document.getElementById('layoutRowsSelect');
if (layoutRowsSel) {
  layoutRowsSel.onchange = (e) => {
    const v = e.target.value === 'auto' ? 'auto' : Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 1));
    setLayoutConfig({ rows: v });
  };
}
document.querySelectorAll('.step-flow-btn').forEach(b => {
  b.onclick = () => {
    setLayoutConfig({ flow: b.getAttribute('data-step-flow') === 'column' ? 'column' : 'row' });
  };
});
document.querySelectorAll('.mixed-layout-btn').forEach(b => {
  b.onclick = () => {
    setLayoutConfig({ mixedLayout: b.getAttribute('data-mixed-layout') || 'even' });
  };
});

// Step Range Group Editor controls
const btnNewLayoutGroup = document.getElementById('btnNewLayoutGroup');
if (btnNewLayoutGroup) btnNewLayoutGroup.onclick = () => openLayoutGroupEditor(null);
const btnGrpCancel = document.getElementById('btnGrpCancel');
if (btnGrpCancel) btnGrpCancel.onclick = closeLayoutGroupEditor;
const btnGrpUseCur = document.getElementById('btnGrpUseCurrentPage');
if (btnGrpUseCur) {
  btnGrpUseCur.onclick = () => {
    const curSlots = state.pages[state.pageIdx]?.slots || [];
    if (curSlots.length === 0) { showToast('Navigate to a step page first.'); return; }
    const s1 = getAbsStepNum(curSlots[0].step);
    const s2 = getAbsStepNum(curSlots[curSlots.length - 1].step);
    document.getElementById('grpStartStepInput').value = String(s1);
    document.getElementById('grpEndStepInput').value = String(s2);
    syncGroupRangeHintUI();
  };
}
const grpMixedSel = document.getElementById('grpMixedSelect');
if (grpMixedSel) grpMixedSel.onchange = syncGroupEditorSlotSizesUI;
const grpColsSel = document.getElementById('grpColsSelect');
if (grpColsSel) grpColsSel.onchange = syncGroupEditorSlotSizesUI;
const grpRowsSel = document.getElementById('grpRowsSelect');
if (grpRowsSel) grpRowsSel.onchange = syncGroupEditorSlotSizesUI;
const grpFlowSel = document.getElementById('grpFlowSelect');
if (grpFlowSel) grpFlowSel.onchange = renderGroupGridPreviewUI;
const btnGrpSave = document.getElementById('btnGrpSave');
if (btnGrpSave) {
  btnGrpSave.onclick = () => {
    const rawStart = Math.max(1, parseInt(document.getElementById('grpStartStepInput')?.value, 10) || 1);
    const rawEnd = Math.max(1, parseInt(document.getElementById('grpEndStepInput')?.value, 10) || rawStart);
    const startStepNum = Math.min(rawStart, rawEnd);
    const endStepNum = Math.max(rawStart, rawEnd);
    const colsRaw = document.getElementById('grpColsSelect')?.value || 'auto';
    const rowsRaw = document.getElementById('grpRowsSelect')?.value || 'auto';
    const flow = document.getElementById('grpFlowSelect')?.value === 'column' ? 'column' : 'row';
    const mixedLayout = document.getElementById('grpMixedSelect')?.value || 'even';
    const themeId = (document.getElementById('grpThemeSelect')?.value || '').trim() || null;
    const name = (document.getElementById('grpNameInput')?.value || '').trim() || `Steps ${formatAbsRange(startStepNum, endStepNum)}`;

    const newGroup = {
      id: layoutGroupEditorState.editingId || `grp_${Date.now().toString(36)}`,
      name,
      startStepNum,
      endStepNum,
      stepBasis: 'absolute',
      layout: normalizePageLayoutSpec({
        cols: colsRaw === 'auto' ? 'auto' : parseInt(colsRaw, 10),
        rows: rowsRaw === 'auto' ? 'auto' : parseInt(rowsRaw, 10),
        flow,
        mixedLayout,
        slotSizes: mixedLayout === 'custom_weights' ? [...layoutGroupEditorState.slotSizes] : [],
      }),
      themeId,
    };

    pushUndo();
    const existingIdx = state.layoutGroups.findIndex((g) => g.id === newGroup.id);
    if (existingIdx >= 0) {
      state.layoutGroups[existingIdx] = newGroup;
    } else {
      state.layoutGroups = [...state.layoutGroups, newGroup];
    }
    closeLayoutGroupEditor();
    renderAll();
    showToast(`Saved step group "${newGroup.name}".`);
  };
}
const btnGrpDelete = document.getElementById('btnGrpDelete');
if (btnGrpDelete) {
  btnGrpDelete.onclick = () => {
    if (!layoutGroupEditorState.editingId) return;
    pushUndo();
    state.layoutGroups = state.layoutGroups.filter((g) => g.id !== layoutGroupEditorState.editingId);
    closeLayoutGroupEditor();
    renderAll();
    showToast('Removed step group.');
  };
}

// Pages & Steps Overview: Select Range -> Group shortcut
const btnOverviewRangeMode = document.getElementById('btnOverviewRangeMode');
if (btnOverviewRangeMode) {
  btnOverviewRangeMode.onclick = () => {
    overviewRangeState.active = !overviewRangeState.active;
    if (!overviewRangeState.active) {
      overviewRangeState.startStep = null;
      overviewRangeState.endStep = null;
    }
    renderOverviewModal();
  };
}
const btnOverviewRangeClear = document.getElementById('btnOverviewRangeClear');
if (btnOverviewRangeClear) {
  btnOverviewRangeClear.onclick = () => {
    overviewRangeState.startStep = null;
    overviewRangeState.endStep = null;
    renderOverviewModal();
  };
}
const btnOverviewRangeCreate = document.getElementById('btnOverviewRangeCreate');
if (btnOverviewRangeCreate) {
  btnOverviewRangeCreate.onclick = () => {
    if (overviewRangeState.startStep == null) return;
    const lo = Math.min(overviewRangeState.startStep, overviewRangeState.endStep ?? overviewRangeState.startStep);
    const hi = Math.max(overviewRangeState.startStep, overviewRangeState.endStep ?? overviewRangeState.startStep);
    overviewRangeState.active = false;
    overviewRangeState.startStep = null;
    overviewRangeState.endStep = null;
    closeOverviewModal();
    openPageSetupModal();
    openLayoutGroupEditor(null, { start: lo, end: hi });
  };
}

document.querySelectorAll('.dens-btn').forEach(b => { b.onclick = () => { state.density = b.getAttribute('data-density'); renderAll(); }; });
document.querySelectorAll('.pgnum-btn').forEach(b => {
  b.onclick = () => {
    const fmt = b.getAttribute('data-pgnum');
    if (state.wordlessMode && fmt === 'page_n') return;
    state.pageNumberFormat = fmt;
    renderAll();
  };
});
document.querySelectorAll('.fade-chip').forEach(b => { b.onclick = () => patchActiveTheme({ fadeOpacity: parseFloat(b.getAttribute('data-fade')) }); });

// Parts List Setup controls (saved with active theme; built-ins auto-fork on edit)
document.querySelectorAll('.bom-format-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ format: b.getAttribute('data-bom-format') === 'table' ? 'table' : 'grid' }, { immediate: true });
});
document.querySelectorAll('.style-bom-format-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ format: b.getAttribute('data-style-bom-format') === 'table' ? 'table' : 'grid' }, { immediate: true });
});
const styleBomPartIdEl = document.getElementById('styleToggleBomPartId');
if (styleBomPartIdEl) {
  styleBomPartIdEl.onchange = (e) => {
    const nextFields = toggleBomField(normalizeBomConfig(state.bomConfig).fields, 'partId', e.target.checked);
    patchBomConfig({ fields: nextFields }, { immediate: true });
  };
}
const btnStyleOpenBomSetup = document.getElementById('btnStyleOpenBomSetup');
if (btnStyleOpenBomSetup) {
  btnStyleOpenBomSetup.onclick = () => {
    setStylePopoverOpen(false);
    openBomSetupModal();
  };
}

document.querySelectorAll('.bom-gridmode-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ gridMode: b.getAttribute('data-bom-grid-mode') === 'custom' ? 'custom' : 'auto' }, { immediate: true });
});
document.querySelectorAll('.bom-minsize-btn').forEach(b => {
  b.onclick = () => {
    const val = parseFloat(b.getAttribute('data-bom-minsize'));
    if (Number.isFinite(val)) patchBomConfig({ gridMode: 'auto', minCellSizeIn: val }, { immediate: true });
  };
});
const bomMinCellSliderEl = document.getElementById('bomMinCellSlider');
if (bomMinCellSliderEl) {
  bomMinCellSliderEl.oninput = (e) => {
    const val = parseFloat(e.target.value);
    if (Number.isFinite(val)) patchBomConfig({ gridMode: 'auto', minCellSizeIn: val });
  };
}

const setBomCustomTrack = (field, rawVal) => {
  const n = Math.max(MIN_BOM_GRID_TRACKS, Math.min(MAX_BOM_GRID_TRACKS, Math.round(Number(rawVal) || 1)));
  patchBomConfig({ gridMode: 'custom', [field]: n }, { immediate: true });
};
const bomColsInput = document.getElementById('bomCustomCols');
const bomRowsInput = document.getElementById('bomCustomRows');
if (bomColsInput) {
  bomColsInput.onchange = (e) => setBomCustomTrack('customCols', e.target.value);
  bomColsInput.oninput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isFinite(v) && v >= MIN_BOM_GRID_TRACKS && v <= MAX_BOM_GRID_TRACKS) {
      patchBomConfig({ gridMode: 'custom', customCols: v });
    }
  };
}
if (bomRowsInput) {
  bomRowsInput.onchange = (e) => setBomCustomTrack('customRows', e.target.value);
  bomRowsInput.oninput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isFinite(v) && v >= MIN_BOM_GRID_TRACKS && v <= MAX_BOM_GRID_TRACKS) {
      patchBomConfig({ gridMode: 'custom', customRows: v });
    }
  };
}
const bomColsDec = document.getElementById('bomColsDec');
const bomColsInc = document.getElementById('bomColsInc');
const bomRowsDec = document.getElementById('bomRowsDec');
const bomRowsInc = document.getElementById('bomRowsInc');
if (bomColsDec) bomColsDec.onclick = () => setBomCustomTrack('customCols', normalizeBomConfig(state.bomConfig).customCols - 1);
if (bomColsInc) bomColsInc.onclick = () => setBomCustomTrack('customCols', normalizeBomConfig(state.bomConfig).customCols + 1);
if (bomRowsDec) bomRowsDec.onclick = () => setBomCustomTrack('customRows', normalizeBomConfig(state.bomConfig).customRows - 1);
if (bomRowsInc) bomRowsInc.onclick = () => setBomCustomTrack('customRows', normalizeBomConfig(state.bomConfig).customRows + 1);
document.querySelectorAll('.bom-preset-btn').forEach(b => {
  b.onclick = () => {
    const [pc, pr] = String(b.getAttribute('data-bom-preset') || '').split('x').map(Number);
    if (pc >= 1 && pr >= 1) patchBomConfig({ gridMode: 'custom', customCols: pc, customRows: pr }, { immediate: true });
  };
});

document.querySelectorAll('.bom-varsize-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ variableSizing: b.getAttribute('data-bom-varsize') === 'variable' }, { immediate: true });
});
document.querySelectorAll('.bom-flowaxis-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ flowAxis: b.getAttribute('data-bom-flow-axis') === 'columns' ? 'columns' : 'rows' }, { immediate: true });
});
document.querySelectorAll('.bom-hdir-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ horizontalDir: b.getAttribute('data-bom-hdir') === 'rtl' ? 'rtl' : 'ltr' }, { immediate: true });
});
document.querySelectorAll('.bom-vdir-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ verticalDir: b.getAttribute('data-bom-vdir') === 'btt' ? 'btt' : 'ttb' }, { immediate: true });
});
document.querySelectorAll('.bom-align-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ align: b.getAttribute('data-bom-align') }, { immediate: true });
});

document.querySelectorAll('.bom-tablemode-btn').forEach(b => {
  b.onclick = () => patchBomConfig({ tableRowsMode: b.getAttribute('data-bom-table-mode') === 'custom' ? 'custom' : 'auto' }, { immediate: true });
});
const setBomTableRows = (rawVal) => {
  const n = Math.max(MIN_BOM_TABLE_ROWS, Math.min(MAX_BOM_TABLE_ROWS, Math.round(Number(rawVal) || 20)));
  patchBomConfig({ tableRowsMode: 'custom', tableRowsPerPage: n }, { immediate: true });
};
const bomTableRowsInputEl = document.getElementById('bomTableRowsInput');
if (bomTableRowsInputEl) {
  bomTableRowsInputEl.onchange = (e) => setBomTableRows(e.target.value);
  bomTableRowsInputEl.oninput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (Number.isFinite(v) && v >= MIN_BOM_TABLE_ROWS && v <= MAX_BOM_TABLE_ROWS) {
      patchBomConfig({ tableRowsMode: 'custom', tableRowsPerPage: v });
    }
  };
}
const bomTableRowsDec = document.getElementById('bomTableRowsDec');
const bomTableRowsInc = document.getElementById('bomTableRowsInc');
if (bomTableRowsDec) bomTableRowsDec.onclick = () => setBomTableRows(normalizeBomConfig(state.bomConfig).tableRowsPerPage - 1);
if (bomTableRowsInc) bomTableRowsInc.onclick = () => setBomTableRows(normalizeBomConfig(state.bomConfig).tableRowsPerPage + 1);
document.querySelectorAll('.bom-trows-btn').forEach(b => {
  b.onclick = () => setBomTableRows(b.getAttribute('data-bom-trows'));
});

document.getElementById('bomSortPrimary').onchange = (e) => patchBomConfig({ sortPrimary: e.target.value }, { immediate: true });
document.getElementById('bomSortSecondary').onchange = (e) => patchBomConfig({ sortSecondary: e.target.value }, { immediate: true });

document.getElementById('toggleExtras').onchange = (e) => { state.showExtras = e.target.checked; renderAll(); };
// Step display options are part of the active theme (built-ins fork on first edit)
document.getElementById('toggleHighlight').onchange = (e) => patchActiveTheme({ highlightNew: e.target.checked });
document.getElementById('highlightColor').oninput = (e) => patchActiveTheme({ highlightColor: e.target.value });
document.getElementById('toggleFade').onchange = (e) => patchActiveTheme({ fadePrev: e.target.checked });
document.getElementById('toggleRotCues').onchange = (e) => patchActiveTheme({ showRotCues: e.target.checked });
document.getElementById('toggleSizeGuides').onchange = (e) => patchActiveTheme({ showSizeGuides: e.target.checked });
const mf1to1ToggleEl = document.getElementById('toggleMinifig1to1');
if (mf1to1ToggleEl) mf1to1ToggleEl.onchange = (e) => patchActiveTheme({ showMinifig1to1: e.target.checked });
document.querySelectorAll('.mf-style-btn').forEach(b => {
  b.onclick = () => applyMinifigStyleChange(b.getAttribute('data-mf-style'));
});
const setStepBorders = (e) => patchActiveTheme({ showStepBorders: e.target.checked });
document.getElementById('toggleStepBorders').onchange = setStepBorders;
document.getElementById('toggleStepBordersSetup').onchange = setStepBorders;
const setPageTitle = (e) => patchActiveTheme({ showPageTitle: e.target.checked });
document.getElementById('togglePageTitle').onchange = setPageTitle;
document.getElementById('togglePageTitleSetup').onchange = setPageTitle;
const toggleWordlessEl = document.getElementById('toggleWordlessMode');
if (toggleWordlessEl) {
  toggleWordlessEl.onchange = (e) => applyWordlessMode(e.target.checked);
}
const toggleCoverTextEl = document.getElementById('toggleCoverText');
if (toggleCoverTextEl) {
  toggleCoverTextEl.onchange = (e) => {
    if (state.model) pushUndo();
    state.coverMeta = { ...normalizeCoverMeta(state.coverMeta, !state.wordlessMode), showText: e.target.checked };
    overviewThumbCache.bumpEpoch();
    renderAll();
  };
}
document.getElementById('toggleCompleteText').onchange = (e) => {
  if (state.model) pushUndo();
  state.completeMeta.showText = e.target.checked;
  overviewThumbCache.bumpEpoch();
  renderAll();
};
document.getElementById('toggleCompleteFireworks').onchange = (e) => { state.completeMeta.showFireworks = e.target.checked; renderAll(); };
const toggleBomTextEl = document.getElementById('toggleBomTextFields');
if (toggleBomTextEl) {
  toggleBomTextEl.onchange = (e) => {
    if (state.model) pushUndo();
    state.bomShowTextFields = e.target.checked;
    overviewThumbCache.bumpEpoch();
    renderAll();
  };
}
const btnBomEnableTextEl = document.getElementById('btnBomEnableTextFields');
if (btnBomEnableTextEl) {
  btnBomEnableTextEl.onclick = () => {
    if (state.model) pushUndo();
    state.bomShowTextFields = true;
    overviewThumbCache.bumpEpoch();
    renderAll();
  };
}
const toggleDupEl = document.getElementById('toggleDetectDuplicates');
if (toggleDupEl) {
  toggleDupEl.onchange = (e) => {
    state.detectDuplicates = e.target.checked;
    scheduleSaveSessionPrefs();
    syncMenuControls();
    const impModal = document.getElementById('importModal');
    if (impState.parsed && impModal && !impModal.classList.contains('hidden')) {
      renderImportAssistantUI();
    }
  };
}

// Self-Contained Interactive 3D HTML Export (LEGO Builder-style offline shareable viewer)
async function runInteractiveHtmlExport() {
  if (!state.model || state.pages.length === 0) {
    showToast('Import a model first.');
    return;
  }
  closeMenu();
  const progWrap = document.getElementById('expProgressWrap');
  const progLbl = document.getElementById('expProgressLabel');
  const progPct = document.getElementById('expProgressPct');
  const progBar = document.getElementById('expProgressBar');
  const modalOpen = !document.getElementById('exportModal').classList.contains('hidden');
  if (modalOpen && progWrap) {
    progWrap.classList.remove('hidden');
    if (progLbl) progLbl.textContent = 'Building Interactive 3D Viewer…';
    if (progPct) progPct.textContent = '15%';
    if (progBar) progBar.style.width = '15%';
    await new Promise((r) => setTimeout(r, 15));
  }

  try {
    const theme = getActiveTheme();
    const allParts = getAllParts(state.model);
    const allSteps = getAllSteps(state.model);
    const protoIndexByKey = new Map();
    const prototypes = [];
    const textures = {};
    const partIndexById = new Map();
    const exportedParts = [];

    const ensurePrototype = (part) => {
      const key = `${normId(part.p)}:${part.c}`;
      if (protoIndexByKey.has(key)) return protoIndexByKey.get(key);
      const idPart = { id: 'proto', p: part.p, c: part.c, x: 0, y: 0, z: 0, m: [1, 0, 0, 0, 1, 0, 0, 0, 1] };
      const mesh = buildMeshBuffers([], [idPart], {
        highlightNew: false,
        fadePrev: false,
        fadeOpacity: 1.0,
        showArrows: false,
        accent: theme.accent,
      });

      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      const scanPos = (arr) => {
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i], y = arr[i + 1], z = arr[i + 2];
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
          if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
        }
      };
      scanPos(mesh.triPos);
      const texDraws = [];
      if (Array.isArray(mesh.texDraws)) {
        for (const td of mesh.texDraws) {
          if (!td.triPos || td.triPos.length < 9) continue;
          scanPos(td.triPos);
          if (!textures[td.texKey]) {
            const rec = textureStore.getRecord(td.texKey);
            if (rec && rec.base64Png) {
              textures[td.texKey] = `data:${rec.mimeType || 'image/png'};base64,${rec.base64Png}`;
            }
          }
          texDraws.push({
            k: td.texKey,
            tp: encodeTypedArrayBase64(td.triPos),
            tn: encodeTypedArrayBase64(td.triNorm),
            uv: encodeTypedArrayBase64(td.triUv),
            tc: encodeTypedArrayBase64(td.triCol),
          });
        }
      }
      if (!Number.isFinite(minX)) { minX = -10; minY = -10; minZ = -10; maxX = 10; maxY = 10; maxZ = 10; }

      const idx = prototypes.length;
      prototypes.push({
        tp: encodeTypedArrayBase64(mesh.triPos),
        tn: encodeTypedArrayBase64(mesh.triNorm),
        tc: encodeTypedArrayBase64(mesh.triCol),
        oc: mesh.opaqueCount || 0,
        xc: mesh.transCount || 0,
        lp: encodeTypedArrayBase64(mesh.linePos),
        lc: encodeTypedArrayBase64(mesh.lineCol),
        ...(texDraws.length > 0 ? { td: texDraws } : {}),
        b: [+minX.toFixed(2), +minY.toFixed(2), +minZ.toFixed(2), +maxX.toFixed(2), +maxY.toFixed(2), +maxZ.toFixed(2)],
      });
      protoIndexByKey.set(key, idx);
      return idx;
    };

    const registerPart = (part, extraOffset = null) => {
      const hasOff = extraOffset && (Math.abs(extraOffset.x || 0) > 0.01 || Math.abs(extraOffset.y || 0) > 0.01 || Math.abs(extraOffset.z || 0) > 0.01);
      const cacheKey = hasOff ? `${part.id}@${Math.round(extraOffset.x || 0)},${Math.round(extraOffset.y || 0)},${Math.round(extraOffset.z || 0)}` : part.id;
      if (partIndexById.has(cacheKey)) return partIndexById.get(cacheKey);
      const k = ensurePrototype(part);
      const m = part.m || [1, 0, 0, 0, 1, 0, 0, 0, 1];
      const isId = Math.abs(m[0] - 1) < 1e-4 && Math.abs(m[4] - 1) < 1e-4 && Math.abs(m[8] - 1) < 1e-4 &&
        Math.abs(m[1]) < 1e-4 && Math.abs(m[2]) < 1e-4 && Math.abs(m[3]) < 1e-4 &&
        Math.abs(m[5]) < 1e-4 && Math.abs(m[6]) < 1e-4 && Math.abs(m[7]) < 1e-4;
      const entry = {
        k,
        x: +((part.x || 0) + (extraOffset?.x || 0)).toFixed(2),
        y: +((part.y || 0) + (extraOffset?.y || 0)).toFixed(2),
        z: +((part.z || 0) + (extraOffset?.z || 0)).toFixed(2),
        ...(isId ? {} : { m: m.map((v) => +Number(v).toFixed(5)) }),
      };
      const idx = exportedParts.length;
      exportedParts.push(entry);
      partIndexById.set(cacheKey, idx);
      return idx;
    };

    const allPartIndices = allParts.map((p) => registerPart(p));
    if (modalOpen && progPct && progBar) { progPct.textContent = '55%'; progBar.style.width = '55%'; await new Promise((r) => setTimeout(r, 10)); }

    const fbCanvas = document.createElement('canvas');
    fbCanvas.width = 480;
    fbCanvas.height = 320;
    const fbCtx = fbCanvas.getContext('2d');
    const renderFallbackPreview = (prevList, newList, az, el, zoom, extraOpts = {}) => {
      try {
        const snap = renderSnapshot(prevList, newList, az, el, 480, 320, zoom || 1.0, {
          highlightNew: state.highlightNew,
          highlightColor: state.highlightColor,
          fadePrev: state.fadePrev,
          fadeOpacity: state.fadeOpacity,
          showArrows: false,
          accent: theme.accent,
          ...extraOpts,
        });
        if (!fbCtx || !snapshotCanvas) return snap?.url || '';
        fbCtx.fillStyle = theme.bg || '#ffffff';
        fbCtx.fillRect(0, 0, fbCanvas.width, fbCanvas.height);
        fbCtx.drawImage(snapshotCanvas, 0, 0, fbCanvas.width, fbCanvas.height);
        return fbCanvas.toDataURL('image/jpeg', 0.78);
      } catch (_) {
        return '';
      }
    };

    const wordless = Boolean(state.wordlessMode);
    const cm = normalizeCoverMeta(state.coverMeta, !wordless);
    const showCoverText = cm.showText !== false;
    const showCompleteText = state.completeMeta?.showText !== false;
    const exportPages = [];

    for (const pg of state.pages) {
      if (pg.kind === 'cover') {
        const az = cm.az ?? 38, el = cm.el ?? 26, zoom = cm.zoom ?? 1.0;
        exportPages.push({
          id: pg.id,
          kind: 'cover',
          num: pg.num,
          label: pg.label || 'Cover',
          title: showCoverText ? (cm.title || state.model.title || 'Untitled Model').trim() : '',
          subtitle: showCoverText
            ? (cm.subtitle || (wordless ? '' : `${allParts.length} pieces · ${allSteps.length} steps`)).trim()
            : '',
          badge: wordless
            ? (showCoverText && cm.creatorName ? cm.creatorName.trim() : '')
            : (cm.creatorName ? cm.creatorName.trim() : `${allParts.length} pcs`),
          previewUrl: renderFallbackPreview([], allParts, az, el, zoom, { highlightNew: false, fadePrev: false }),
          scene: {
            prevPartIdx: [],
            newPartIdx: allPartIndices,
            az,
            el,
            zoom,
            hero: true,
          },
        });
      } else if (pg.kind === 'complete') {
        const comp = normalizeCompleteMeta(state.completeMeta);
        const az = comp.az, el = comp.el, zoom = comp.zoom;
        exportPages.push({
          id: pg.id,
          kind: 'complete',
          num: pg.num,
          label: pg.label || 'Build Complete',
          title: showCompleteText ? (comp.title || 'Build Complete!') : '',
          subtitle: showCompleteText
            ? (comp.subtitle || (wordless ? '' : `${allParts.length} pieces assembled`))
            : '',
          badge: wordless ? '' : 'Complete',
          previewUrl: renderFallbackPreview([], allParts, az, el, zoom, { highlightNew: false, fadePrev: false }),
          scene: {
            prevPartIdx: [],
            newPartIdx: allPartIndices,
            az,
            el,
            zoom,
            hero: true,
          },
        });
      } else if (pg.kind === 'back') {
        const bm = normalizeBackMeta(state.backMeta);
        const az = bm.az ?? 215, el = bm.el ?? 24;
        exportPages.push({
          id: pg.id,
          kind: 'back',
          num: pg.num,
          label: pg.label || 'Back Cover',
          title: wordless ? '' : (bm.title || state.model.title),
          subtitle: BACK_COVER_CREDIT,
          note: wordless ? '' : `${allParts.length} pieces · ${allSteps.length} steps`,
          previewUrl: renderFallbackPreview([], allParts, az, el, 0.95, { highlightNew: false, fadePrev: false }),
          scene: {
            prevPartIdx: [],
            newPartIdx: allPartIndices,
            az,
            el,
            zoom: 0.95,
            hero: true,
          },
        });
      } else if (pg.kind === 'section_divider') {
        const previewIdx = (pg.previewParts || []).map((p) => registerPart(p));
        exportPages.push({
          id: pg.id,
          kind: 'section_divider',
          num: pg.num,
          bagNumber: pg.bagNumber || 1,
          label: wordless ? String(pg.bagNumber || 1) : (pg.label || pg.chapterName || 'Section'),
          title: wordless ? '' : (pg.chapterName || pg.label),
          subtitle: wordless
            ? `${pg.pieceCount || previewIdx.length}`
            : `${pg.pieceCount || previewIdx.length} pieces · ${pg.stepCount || 0} steps`,
          badge: wordless
            ? String(pg.bagNumber || 1)
            : (pg.bagNumber ? `Section ${pg.bagNumber}` : 'Section'),
          previewUrl: (pg.previewParts || []).length > 0 ? renderFallbackPreview([], pg.previewParts, 38, 28, 1.0, { highlightNew: false, fadePrev: false }) : undefined,
          scene: previewIdx.length > 0 ? { prevPartIdx: [], newPartIdx: previewIdx, az: 38, el: 28, zoom: 1.0, hero: true } : undefined,
        });
      } else if (pg.kind === 'submodel_page' && pg.step?.subassembly) {
        const subRaw = pg.step.subassembly.buildParts || [];
        const subParts = subRaw.map((p) => registerPart(p));
        const rep = pg.step.subassembly.repeatCount || 1;
        exportPages.push({
          id: pg.id,
          kind: 'submodel_page',
          num: pg.num,
          label: wordless ? `×${rep}` : (pg.label || pg.step.subassembly.name),
          title: wordless ? '' : (pg.step.subassembly.name || 'Submodel'),
          badge: `×${rep}`,
          previewUrl: subRaw.length > 0 ? renderFallbackPreview([], subRaw, 38, 28, 1.0, { highlightNew: false, fadePrev: false }) : undefined,
          scene: { prevPartIdx: [], newPartIdx: subParts, az: 38, el: 28, zoom: 1.0, hero: false },
        });
      } else if (pg.kind === 'bom') {
        const bomCfg = getEffectiveBomConfig();
        const rawEntries = pg.bomEntries || pg.entries || [];
        const bomItems = rawEntries.map((e) => {
          const colInfo = resolveColorInfo(e.part.c);
          return {
            partId: e.partIdDisplay || getDisplayPartIdForPart(e.part),
            name: e.meta?.name || resolvePart(e.part.p).name,
            colorName: e.colorName || colInfo?.name || `Color ${e.part.c}`,
            colorHex: e.colorHex || colInfo?.hex || '#9ea3a8',
            qty: e.qty,
            thumb: getPliThumb(e.part),
          };
        });
        const pageCount = pg.bomPageCount || pg.bomTotal || 1;
        const pageIdx = pg.bomPageIdx ?? pg.bomIdx ?? 0;
        exportPages.push({
          id: pg.id,
          kind: 'bom',
          num: pg.num,
          label: pg.label || 'Parts List',
          title: wordless
            ? (pageCount > 1 ? `${pageIdx + 1}/${pageCount}` : '')
            : (pageCount > 1 ? `Parts List (${pageIdx + 1}/${pageCount})` : 'Parts List'),
          bomFormat: pg.bomFormat || bomCfg.format,
          bomFields: getEnabledBomFields(bomCfg),
          bomItems,
        });
      } else if (pg.kind === 'divider') {
        const divMeta = state.dividerAfter[pg.sourcePgId] || {};
        exportPages.push({
          id: pg.id,
          kind: 'divider',
          num: pg.num,
          label: pg.label || 'Divider',
          title: divMeta.title || (wordless ? '' : 'Next Section'),
          subtitle: divMeta.note || '',
        });
      } else if (pg.kind === 'steps' && pg.slots?.length > 0) {
        const stepScenes = pg.slots.map(({ ch, step }) => {
          const prev = getPreviousPartsForStep(state.model, ch, step);
          const cam = getStepCamera(step);
          const ov = state.overrides[step.id] || {};
          const effOffsets = step.defaultPartOffsets
            ? { ...step.defaultPartOffsets, ...(ov.partOffsets || {}) }
            : (ov.partOffsets || {});
          const prevPartIdx = prev.map((p) => registerPart(p));
          const newPartIdx = (step.parts || []).map((p) => registerPart(p, effOffsets[p.id] || null));

          const pliMap = new Map();
          for (const p of step.parts || []) {
            const k = `${p.p}:${p.c}`;
            if (!pliMap.has(k)) {
              pliMap.set(k, {
                partId: p.p,
                name: resolvePart(p.p).name,
                colorName: COLORS[p.c]?.name || '',
                qty: 0,
                thumb: getPliThumb(p),
              });
            }
            pliMap.get(k).qty++;
          }
          const effectiveCue = getEffectiveStepCue(ch, step);
          const hasCue = Boolean(state.showRotCues && effectiveCue && effectiveCue !== 'none');
          const cueLabel = hasCue ? getRotationCueLabel(effectiveCue, wordless) : undefined;
          const subLabel = step.attachedSubmodel
            ? (wordless ? `×${step.attachedSubmodel.repeatCount || 1}` : `Attach ${step.attachedSubmodel.name} (×${step.attachedSubmodel.repeatCount || 1})`)
            : step.subassembly
              ? (wordless ? `×${step.subassembly.repeatCount || 1}` : `Includes ${step.subassembly.name} (×${step.subassembly.repeatCount || 1})`)
              : step.isSubmodelFinal
                ? (wordless ? `×${step.submodelRepeat || 2}` : `Repeat ×${step.submodelRepeat || 2}`)
                : undefined;

          return {
            stepId: step.id,
            stepNum: step.num,
            label: wordless ? String(step.num) : `Step ${step.num}`,
            rotationCue: cueLabel,
            rotationCueKind: hasCue ? effectiveCue : undefined,
            subLabel,
            pli: Array.from(pliMap.values()),
            previewUrl: renderFallbackPreview(prev, step.parts || [], cam.az, cam.el, ov.modelScale || 1.0, { partOffsets: effOffsets }),
            prevPartIdx,
            newPartIdx,
            az: cam.az,
            el: cam.el,
            zoom: ov.modelScale || 1.0,
          };
        });
        exportPages.push({
          id: pg.id,
          kind: 'steps',
          num: pg.num,
          label: pg.label,
          chapterName: wordless ? '' : pg.chapterName,
          steps: stepScenes,
        });
      }
    }

    if (modalOpen && progPct && progBar) { progPct.textContent = '90%'; progBar.style.width = '90%'; }

    const htmlDoc = generateInteractiveHtmlDocument({
      version: 1,
      title: cm.title || state.model.title || 'Brick Instruction Manual',
      subtitle: cm.subtitle || '',
      author: cm.creatorName || '',
      editorUrl: PROGRAM_URL || DEFAULT_EDITOR_URL,
      wordless,
      totalPieces: allParts.length,
      totalSteps: allSteps.length,
      theme: {
        bg: theme.bg,
        bgEnd: theme.bgEnd,
        bgType: theme.bgType || 'solid',
        bgAngle: theme.bgAngle ?? 180,
        text: theme.text,
        muted: theme.muted,
        accent: theme.accent,
        pliBg: theme.pliBg,
        pliBorder: theme.pliBorder,
        calloutBg: theme.calloutBg,
        calloutBorder: theme.calloutBorder,
        headingFont: getThemeFontStack(theme, 'heading'),
        bodyFont: getThemeFontStack(theme, 'body'),
        isDark: isDarkHexColor(theme.bg),
      },
      highlightNew: state.highlightNew,
      highlightColor: state.highlightColor,
      fadePrev: state.fadePrev,
      fadeOpacity: state.fadeOpacity,
      prototypes,
      textures,
      parts: exportedParts,
      pages: exportPages,
    });

    const fileName = buildInteractiveHtmlFilename(state.model.title);
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    if (modalOpen && progWrap) progWrap.classList.add('hidden');

    let shared = false;
    if (navigator.canShare && typeof File !== 'undefined') {
      try {
        const file = new File([blob], fileName, { type: 'text/html' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          shared = true;
        }
      } catch (_) {}
    }
    if (!shared) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    }
    showToast(`Exported ${fileName}`);
  } catch (err) {
    if (modalOpen && progWrap) progWrap.classList.add('hidden');
    showToast('Could not export Interactive 3D HTML.');
  }
}

let isPrintPrepActive = false;

function cleanupPrintAllPages() {
  document.body.classList.remove('printing-all-pages');
  const container = document.getElementById('printAllPagesContainer');
  if (container) container.innerHTML = '';
  const dynStyle = document.getElementById('dynamicPrintPageStyle');
  if (dynStyle) dynStyle.remove();
}

async function runSystemPrintAllPages() {
  if (!state.model || state.pages.length === 0 || isPrintPrepActive) return;
  if (typeof window.print !== 'function') {
    showToast('Printing is not supported in this browser.');
    return;
  }
  isPrintPrepActive = true;
  const progWrap = document.getElementById('expProgressWrap');
  const progLbl = document.getElementById('expProgressLabel');
  const progPct = document.getElementById('expProgressPct');
  const progBar = document.getElementById('expProgressBar');
  const readyWrap = document.getElementById('expReadyWrap');
  const printContainer = document.getElementById('printAllPagesContainer');

  try {
    cleanupPrintAllPages();
    if (readyWrap) readyWrap.classList.add('hidden');
    if (progWrap) progWrap.classList.remove('hidden');

    const pagesToPrint = state.pages;
    const [pageWpt, pageHpt] = getPdfPaperPts();
    const [wIn, hIn] = getActivePagePhysicalInches();
    const basePxW = Math.round(pageWpt * 1.45);
    const basePxH = Math.round(pageHpt * 1.45);
    const coverPxW = Math.min(2400, Math.round(pageWpt * 2.1));
    const coverPxH = Math.min(2400, Math.round(pageHpt * 2.1));

    const renderedPages = [];
    for (let i = 0; i < pagesToPrint.length; i++) {
      const pct = Math.round(((i + 1) / pagesToPrint.length) * 100);
      if (progLbl) progLbl.textContent = `Preparing page ${i + 1} of ${pagesToPrint.length} for print…`;
      if (progPct) progPct.textContent = `${pct}%`;
      if (progBar) progBar.style.width = `${pct}%`;
      await new Promise((r) => setTimeout(r, 8));
      const pg = pagesToPrint[i];
      const w = pg.kind === 'cover' ? coverPxW : basePxW;
      const h = pg.kind === 'cover' ? coverPxH : basePxH;
      renderedPages.push(await renderPageToJpegBytes(pg, w, h, pageWpt, pageHpt));
    }

    if (printContainer) {
      const decodePromises = [];
      for (let i = 0; i < renderedPages.length; i++) {
        const sheet = document.createElement('div');
        sheet.className = 'print-page-sheet';
        const img = document.createElement('img');
        img.className = 'print-page-img';
        img.alt = `Page ${i + 1}`;
        img.src = renderedPages[i].dataUrl;
        sheet.appendChild(img);
        printContainer.appendChild(sheet);
        if (typeof img.decode === 'function') {
          decodePromises.push(img.decode().catch(() => {}));
        }
      }
      await Promise.all(decodePromises);

      const styleEl = document.createElement('style');
      styleEl.id = 'dynamicPrintPageStyle';
      styleEl.textContent = `@media print { @page { size: ${wIn.toFixed(2)}in ${hIn.toFixed(2)}in; margin: 0; } }`;
      document.head.appendChild(styleEl);
      document.body.classList.add('printing-all-pages');
    }

    if (progWrap) progWrap.classList.add('hidden');
    document.getElementById('exportModal').classList.add('hidden');
    resetZoom();

    const onAfterPrint = () => {
      window.removeEventListener('afterprint', onAfterPrint);
      cleanupPrintAllPages();
    };
    window.addEventListener('afterprint', onAfterPrint);
    window.print();
  } catch (_) {
    cleanupPrintAllPages();
    if (progWrap) progWrap.classList.add('hidden');
    showToast('Could not prepare pages for printing.');
  } finally {
    isPrintPrepActive = false;
  }
}

// Open real Export & Print Modal (never silently closes!)
function openExportModal() {
  if (!state.model || state.pages.length === 0) { showToast('Import a model first.'); return; }
  cleanupPrintAllPages();
  closeMenu();
  closeBricksLibraryModal();
  closeBomSetupModal();
  document.getElementById('pageSetupModal').classList.add('hidden');
  const fmt = PAPER_FORMATS[state.paperFormat] || PAPER_FORMATS.letter;
  const [wIn, hIn] = getActivePagePhysicalInches();
  document.getElementById('expFormatSummary').textContent = `${fmt.name} (${formatPhysicalDims(wIn, hIn)}) · ${state.pages.length} pages`;
  const sysPrintBtn = document.getElementById('btnSysPrint');
  if (sysPrintBtn) sysPrintBtn.classList.toggle('hidden', typeof window.print !== 'function');
  document.getElementById('expProgressWrap').classList.add('hidden');
  document.getElementById('expReadyWrap').classList.add('hidden');
  document.getElementById('exportModal').classList.remove('hidden');
}
document.getElementById('menuPrintBtn').onclick = openExportModal;
const menuExportHtmlBtn = document.getElementById('menuExportHtmlBtn');
if (menuExportHtmlBtn) menuExportHtmlBtn.onclick = runInteractiveHtmlExport;
const btnExpInteractiveHtml = document.getElementById('btnExpInteractiveHtml');
if (btnExpInteractiveHtml) btnExpInteractiveHtml.onclick = runInteractiveHtmlExport;
document.getElementById('menuPageSetupBtn').onclick = openPageSetupModal;
const closePageSetupModal = () => { closeLayoutGroupEditor(); document.getElementById('pageSetupModal').classList.add('hidden'); };
document.getElementById('btnClosePageSetup').onclick = closePageSetupModal;
document.getElementById('pageSetupDoneBtn').onclick = closePageSetupModal;
document.getElementById('pageSetupModal').onclick = (e) => { if (e.target.id === 'pageSetupModal') closePageSetupModal(); };

document.getElementById('menuBomSetupBtn').onclick = openBomSetupModal;
document.getElementById('btnCloseBomSetup').onclick = closeBomSetupModal;
document.getElementById('bomSetupDoneBtn').onclick = closeBomSetupModal;
document.getElementById('bomSetupModal').onclick = (e) => { if (e.target.id === 'bomSetupModal') closeBomSetupModal(); };
document.getElementById('bomSetupJumpBtn').onclick = () => {
  closeBomSetupModal();
  if (!state.model) { showToast('Import a model first.'); return; }
  if (!state.showExtras) { state.showExtras = true; rebuildPages(); }
  const idx = state.pages.findIndex(p => p.kind === 'bom');
  if (idx >= 0) { state.pageIdx = idx; resetZoom(); renderAll(); }
};
document.getElementById('errorsModal').onclick = (e) => { if (e.target.id === 'errorsModal') document.getElementById('errorsModal').classList.add('hidden'); };
document.getElementById('btnCloseExport').onclick = () => document.getElementById('exportModal').classList.add('hidden');
document.getElementById('btnExpAllPdf').onclick = () => runPdfExport(state.pages);
document.getElementById('btnSharePdf').onclick = async () => {
  if (!lastGeneratedPdfBlob) return;
  try {
    const file = new File([lastGeneratedPdfBlob], lastGeneratedPdfName, { type: 'application/pdf' });
    await navigator.share({ files: [file] });
  } catch (_) {}
};
document.getElementById('btnSysPrint').onclick = () => {
  runSystemPrintAllPages();
};

document.getElementById('menuAddDivider').onclick = () => {
  if (!state.model) return;
  const pg = state.pages[state.pageIdx];
  if (!canInsertDividerAfterPage(pg, state.dividerAfter)) return;
  pushUndo();
  state.dividerAfter[pg.id] = { title: state.wordlessMode ? '' : 'Next Section', note: '' };
  closeMenu(); renderAll(); showToast('Inserted divider page after current page.');
};
const menuStepGenBtn = document.getElementById('menuStepGenBtn');
if (menuStepGenBtn) {
  menuStepGenBtn.onclick = () => {
    if (!state.model?._parsed) { showToast('Import a model first.'); return; }
    closeMenu();
    openImportAssistant(state.model._parsed, true);
  };
}

// Export / Import .biw Project (supports iOS Share Sheet + Download!)
document.getElementById('menuSaveProj').onclick = async () => {
  if (!state.model) return;
  const activeTheme = getActiveTheme();
  const embeddedCustomTheme = activeTheme && !activeTheme.builtIn && !BUILT_IN_THEME_IDS.has(activeTheme.id) ? activeTheme : undefined;
  const payload = JSON.stringify({ format: PROJECT_FILE_FORMAT, version: PROJECT_FILE_STUDIO_VERSION, title: state.model.title, chapters: state.model.chapters, overrides: state.overrides, stepInserts: state.stepInserts, pageInserts: state.pageInserts, dividerAfter: state.dividerAfter, coverMeta: state.coverMeta, completeMeta: state.completeMeta, backMeta: state.backMeta, bomConfig: state.bomConfig, wordlessMode: state.wordlessMode, bomShowTextFields: state.bomShowTextFields, showStepBorders: state.showStepBorders, showPageTitle: state.showPageTitle, pageNumberFormat: state.pageNumberFormat, detectDuplicates: state.detectDuplicates, minifigStyle: state.minifigStyle, showMinifig1to1: state.showMinifig1to1, themeId: state.themeId, ...(embeddedCustomTheme ? { customTheme: embeddedCustomTheme } : {}), paperFormat: state.paperFormat, orientation: state.orientation, density: state.density, layout: state.layout, layoutConfig: state.layoutConfig, layoutGroups: state.layoutGroups }, null, 2);
  const fileName = buildProjectFileName(state.model.title);
  closeMenu();
  await shareOrDownloadCustomFile(payload, fileName, 'Shared project file.', `Exported ${fileName}`);
};

async function handleIncomingProjectFile(f) {
  if (!f) return;
  try {
    assertProjectFileName(f.name);
    const data = parseStudioProjectJson(await f.text());
    submodelThumbCache.clear();
    coverHeroCache.clear();
    clearMinifigDiagramCaches();
    overviewThumbCache.bumpEpoch();
    state.model = { title: data.title || 'Loaded Manual', subtitle: '', chapters: data.chapters || [] };
    state.overrides = data.overrides || {};
    state.stepInserts = data.stepInserts || {};
    state.pageInserts = data.pageInserts || {};
    state.dividerAfter = data.dividerAfter || {};
    // Legacy .biw projects saved before Wordless mode keep their prior labeled appearance.
    state.wordlessMode = typeof data.wordlessMode === 'boolean' ? data.wordlessMode : false;
    state.bomShowTextFields = typeof data.bomShowTextFields === 'boolean' ? data.bomShowTextFields : !state.wordlessMode;
    state.coverMeta = normalizeCoverMeta(data.coverMeta, !state.wordlessMode);
    state.completeMeta = normalizeCompleteMeta(data.completeMeta ? data.completeMeta : { showText: !state.wordlessMode });
    state.backMeta = normalizeBackMeta(data.backMeta);
    if (data.pageNumberFormat) state.pageNumberFormat = data.pageNumberFormat;
    else state.pageNumberFormat = getWordlessSurfaceDefaults(state.wordlessMode).pageNumberFormat;
    if (typeof data.detectDuplicates === 'boolean') state.detectDuplicates = data.detectDuplicates;
    if (data.customTheme) {
      const incomingTheme = (data.customTheme.bomConfig === undefined && data.bomConfig)
        ? { ...data.customTheme, bomConfig: data.bomConfig }
        : data.customTheme;
      const normalized = normalizeCustomTheme(incomingTheme);
      if (normalized) {
        const { merged, importedIds } = mergeImportedThemes(customThemes, [normalized]);
        customThemes = merged;
        persistCustomThemes();
        if (importedIds[0]) state.themeId = importedIds[0];
      }
    } else if (data.themeId) {
      state.themeId = resolveThemeById(data.themeId, customThemes).id;
    }
    // Pre-theme projects stored step display & parts list options at the top level.
    if (!data.customTheme) adoptLegacyStyleOptions(data);
    if (data.paperFormat) state.paperFormat = data.paperFormat;
    if (data.orientation) state.orientation = data.orientation;
    if (data.density) state.density = data.density;
    if (data.layout) state.layout = data.layout;
    state.layoutConfig = normalizePageLayoutSpec(data.layoutConfig, data.layout);
    state.layoutGroups = normalizeLayoutGroups(data.layoutGroups);
    syncLegacyLayoutFlag();
    state.pageIdx = 0; state.undoStack = []; state.redoStack = [];
    state.seenDiagnosticKeys = new Set();
    errFilter = 'all';
    lastSourceRecord = { kind: 'project', fileName: f.name };
    computeModelDiagnostics();
    closeMenu(); closeOpenModelModal(); renderAll(); showToast(`Imported ${state.model.title}.`);
  } catch (err) {
    showToast(err?.message || `Could not read project (${PROJECT_FILE_EXT}) file.`);
  }
}

const triggerProjectLoad = () => { closeOpenModelModal(); document.getElementById('projectLoadInput').click(); };
const emptyLoadProjBtn = document.getElementById('emptyLoadProjBtn');
if (emptyLoadProjBtn) emptyLoadProjBtn.onclick = triggerProjectLoad;
document.getElementById('projectLoadInput').onchange = async (e) => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  await handleIncomingProjectFile(f);
};

// Image Insert & Cover Image Uploads (Creator Logo, Series / Theme Logo, Background)
let pendingCoverImageSlot = 'bg';
function openCoverImagePicker(slot = 'bg') {
  pendingCoverImageSlot = slot;
  const inp = document.getElementById('coverImageInput');
  if (inp) inp.click();
}

document.getElementById('insertImageInput').onchange = (e) => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const active = getActiveStepObj();
    if (!active) return;
    pushUndo();
    const arr = state.stepInserts[active.step.id] || [];
    arr.push({ id: 'ins_' + Date.now().toString(36), kind: 'image', src: r.result, corner: 'bottom-right', scale: 1 });
    state.stepInserts[active.step.id] = arr;
    showToast(`Added image to Step ${active.step.num}.`);
    renderAll();
  };
  r.readAsDataURL(f);
};
document.getElementById('coverImageInput').onchange = (e) => {
  const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
  const slot = pendingCoverImageSlot || 'bg';
  pendingCoverImageSlot = 'bg';
  const r = new FileReader();
  r.onload = () => {
    const pg = state.pages[state.pageIdx];
    pushUndo();
    if (pg.kind === 'cover') {
      state.coverMeta = normalizeCoverMeta(state.coverMeta);
      if (slot === 'creatorLogo') state.coverMeta.creatorLogoSrc = r.result;
      else if (slot === 'themeImage') state.coverMeta.themeImageSrc = r.result;
      else state.coverMeta.bgSrc = r.result;
    } else if (pg.kind === 'complete') {
      state.completeMeta.bgSrc = r.result;
    } else if (pg.kind === 'back') {
      state.backMeta.bgSrc = r.result;
    }
    renderAll();
  };
  r.readAsDataURL(f);
};

// Open / Import Model & Project Proofing Sheet Dialog
function openOpenModelModal() {
  closeMenu();
  applyDestructiveNoticeToEl(
    'openModelReplaceNotice',
    getReplaceModelModalDestructiveNotice({
      hasOpenModel: Boolean(state.model),
      modelTitle: state.model?.title,
      editsSummary: getCurrentManualEditsSummary(),
    }),
  );
  document.getElementById('openModelModal')?.classList.remove('hidden');
}
function closeOpenModelModal() {
  document.getElementById('openModelModal')?.classList.add('hidden');
}
const triggerImport = () => { closeMenu(); closeOpenModelModal(); document.getElementById('fileInput').click(); };
document.getElementById('emptyImportBtn').onclick = triggerImport;
document.getElementById('menuImportBtn').onclick = openOpenModelModal;
const btnCloseOpenModel = document.getElementById('btnCloseOpenModel');
if (btnCloseOpenModel) btnCloseOpenModel.onclick = closeOpenModelModal;
const openModelModalEl = document.getElementById('openModelModal');
if (openModelModalEl) {
  openModelModalEl.onclick = (e) => { if (e.target === openModelModalEl) closeOpenModelModal(); };
  openModelModalEl.addEventListener('dragover', (e) => { e.preventDefault(); });
  openModelModalEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    closeOpenModelModal();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (isProjectFileName(file.name)) {
      await handleIncomingProjectFile(file);
      return;
    }
    await handleIncomingModelFile(file);
  });
}
const openModalImportBtn = document.getElementById('openModalImportBtn');
if (openModalImportBtn) openModalImportBtn.onclick = triggerImport;
const openModalLoadProjBtn = document.getElementById('openModalLoadProjBtn');
if (openModalLoadProjBtn) openModalLoadProjBtn.onclick = triggerProjectLoad;

// Errors Modal, Bottom Error Banner & Dedicated Bricks Library Screen Wiring
document.getElementById('menuErrorsBtn').onclick = openErrorsModal;
document.getElementById('btnCloseErrors').onclick = () => document.getElementById('errorsModal').classList.add('hidden');
document.getElementById('btnBannerSeeErrors').onclick = openErrorsModal;
document.getElementById('btnBannerDismiss').onclick = dismissErrorBanner;
document.getElementById('menuBricksLibBtn').onclick = () => openBricksLibraryModal();
document.getElementById('btnCloseBricksLib').onclick = closeBricksLibraryModal;
document.getElementById('bricksLibDoneBtn').onclick = closeBricksLibraryModal;
document.getElementById('bricksLibraryModal').onclick = (e) => {
  if (e.target.id === 'bricksLibraryModal') {
    closeBricksLibraryModal();
    return;
  }
  if (libUiState.colorPickerOpen) {
    const wrap = document.getElementById('libColorPickerWrap');
    if (wrap && !wrap.contains(e.target)) {
      setLibColorPickerOpen(false);
    }
  }
};
const libColorPickerBtnEl = document.getElementById('libColorPickerBtn');
if (libColorPickerBtnEl) {
  libColorPickerBtnEl.onclick = (e) => {
    e.stopPropagation();
    setLibColorPickerOpen(!libUiState.colorPickerOpen);
  };
}
const libColorPopoverCloseEl = document.getElementById('libColorPopoverClose');
if (libColorPopoverCloseEl) {
  libColorPopoverCloseEl.onclick = () => setLibColorPickerOpen(false);
}
const libColorSearchInputEl = document.getElementById('libColorSearchInput');
if (libColorSearchInputEl) {
  libColorSearchInputEl.oninput = (e) => {
    libUiState.colorQuery = e.target.value || '';
    renderLibColorSwatches();
  };
}

document.querySelectorAll('.lib-tab-btn').forEach((btn) => {
  btn.onclick = () => {
    const nextTab = btn.getAttribute('data-lib-tab');
    if (nextTab === 'browse' || nextTab === 'manage') {
      libUiState.tab = nextTab;
      renderBricksLibraryModal(false);
    }
  };
});

const libSearchInputEl = document.getElementById('libSearchInput');
const libSearchClearBtnEl = document.getElementById('libSearchClearBtn');
if (libSearchInputEl) {
  libSearchInputEl.oninput = (e) => {
    const val = e.target.value || '';
    if (libSearchClearBtnEl) libSearchClearBtnEl.classList.toggle('hidden', val.length === 0);
    clearTimeout(libSearchDebounceTimer);
    libSearchDebounceTimer = setTimeout(() => {
      libUiState.query = val;
      renderLibBrowseTab(true);
    }, 90);
  };
}
if (libSearchClearBtnEl) {
  libSearchClearBtnEl.onclick = () => {
    libUiState.query = '';
    if (libSearchInputEl) {
      libSearchInputEl.value = '';
      libSearchInputEl.focus();
    }
    libSearchClearBtnEl.classList.add('hidden');
    renderLibBrowseTab(true);
  };
}

const libCategorySelectEl = document.getElementById('libCategorySelect');
if (libCategorySelectEl) {
  libCategorySelectEl.onchange = (e) => {
    libUiState.category = e.target.value || 'all';
    renderLibBrowseTab(true);
  };
}

const libIncludeHelpersEl = document.getElementById('libIncludeHelpersToggle');
if (libIncludeHelpersEl) {
  libIncludeHelpersEl.onchange = (e) => {
    libUiState.includeHelpers = Boolean(e.target.checked);
    renderLibBrowseTab(true);
  };
}

const libLoadMoreBtnEl = document.getElementById('libLoadMoreBtn');
if (libLoadMoreBtnEl) {
  libLoadMoreBtnEl.onclick = () => {
    appendLibBrowseBatch(LIB_PAGE_BATCH_SIZE);
  };
}

const btnCloseLibPreviewEl = document.getElementById('btnCloseLibPreview');
if (btnCloseLibPreviewEl) {
  btnCloseLibPreviewEl.onclick = () => {
    libUiState.selectedId = null;
    renderLibBrowseTab(false);
    renderLibPreviewInspector();
  };
}

const libPreviewStageEl = document.getElementById('libPreviewStage');
if (libPreviewStageEl) {
  let orbitActive = false;
  let orbitPointerId = null;
  let orbitStartX = 0;
  let orbitStartY = 0;
  let orbitStartAz = 38;
  let orbitStartEl = 24;
  let orbitRaf = 0;

  const scheduleOrbitDraw = (hiRes) => {
    if (orbitRaf) cancelAnimationFrame(orbitRaf);
    orbitRaf = requestAnimationFrame(() => {
      orbitRaf = 0;
      const pid = libUiState.selectedId;
      if (!pid) return;
      const { items } = getLibrarySnapshot();
      const item = items.find((x) => x.id === pid);
      if (!item || isOnlineOnlyItem(item)) return;
      try {
        drawLibPreviewCanvas(pid, getEffectivePreviewColorForPart(pid), hiRes);
      } catch (_) {}
    });
  };

  libPreviewStageEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const pid = libUiState.selectedId;
    if (!pid) return;
    orbitActive = true;
    orbitPointerId = e.pointerId;
    orbitStartX = e.clientX;
    orbitStartY = e.clientY;
    orbitStartAz = libUiState.previewAz;
    orbitStartEl = libUiState.previewEl;
    const hintEl = document.getElementById('libPreviewOrbitHint');
    if (hintEl) hintEl.classList.add('opacity-0');
    try { libPreviewStageEl.setPointerCapture(e.pointerId); } catch (_) {}
    e.preventDefault();
  });

  libPreviewStageEl.addEventListener('pointermove', (e) => {
    if (!orbitActive || e.pointerId !== orbitPointerId) return;
    const dx = e.clientX - orbitStartX;
    const dy = e.clientY - orbitStartY;
    libUiState.previewAz = ((orbitStartAz - dx * 0.7) % 360 + 360) % 360;
    libUiState.previewEl = Math.max(-85, Math.min(85, orbitStartEl + dy * 0.55));
    scheduleOrbitDraw(false);
  });

  const endOrbit = (e) => {
    if (!orbitActive || (orbitPointerId !== null && e.pointerId !== orbitPointerId)) return;
    orbitActive = false;
    orbitPointerId = null;
    const hintEl = document.getElementById('libPreviewOrbitHint');
    if (hintEl) hintEl.classList.remove('opacity-0');
    try { libPreviewStageEl.releasePointerCapture(e.pointerId); } catch (_) {}
    scheduleOrbitDraw(true);
  };

  libPreviewStageEl.addEventListener('pointerup', endOrbit);
  libPreviewStageEl.addEventListener('pointercancel', endOrbit);
  libPreviewStageEl.addEventListener('dblclick', () => {
    libUiState.previewAz = 38;
    libUiState.previewEl = 24;
    scheduleOrbitDraw(true);
  });
}

document.getElementById('libSourceSelect').onchange = (e) => {
  notFoundDatCache.clear();
  const customWrap = document.getElementById('libCustomUrlWrap');
  if (customWrap) customWrap.classList.toggle('hidden', e.target.value !== 'custom');
};

document.getElementById('libCancelOpBtn').onclick = () => {
  if (!fetchPartsInFlight) return;
  fetchCancelRequested = true;
  if (activeFetchAbortCtrl) activeFetchAbortCtrl.abort();
  const cancelBtn = document.getElementById('libCancelOpBtn');
  if (cancelBtn) {
    cancelBtn.disabled = true;
    cancelBtn.textContent = 'Canceling…';
  }
};

document.getElementById('libFetchModelBtn').onclick = async () => {
  await fetchMissingPartsOnline();
  renderBricksLibraryModal(false);
};

document.getElementById('libFetchAllPacksBtn').onclick = async () => {
  const remaining = getAllStarterPackPartIds().filter((id) => !userLibRaw.has(id));
  if (!remaining.length) {
    showToast('All starter pack parts are already saved in your Bricks Library!');
    return;
  }
  await fetchPartsOnline({
    mode: 'pack',
    partIds: remaining,
    label: 'all starter packs',
    maxFiles: 3500,
  });
  renderBricksLibraryModal(false);
};

const runCustomIdsFetch = async () => {
  const input = document.getElementById('libCustomIdsInput');
  const ids = parsePartIdListInput(input?.value || '');
  if (!ids.length) {
    showToast('Enter at least one LDraw part ID (for example: 3001, 3069b, 3626c).');
    return;
  }
  const res = await fetchPartsOnline({
    mode: 'custom_ids',
    partIds: ids,
    label: ids.length === 1 ? `part ${ids[0]}` : `${ids.length} part IDs`,
  });
  if (res.fetchedParts > 0 && input) input.value = '';
  if (ids.length === 1 && userLibRaw.has(ids[0])) {
    libUiState.selectedId = ids[0];
  }
  renderBricksLibraryModal(false);
};
document.getElementById('libFetchCustomIdsBtn').onclick = runCustomIdsFetch;
document.getElementById('libCustomIdsInput').onkeydown = (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    void runCustomIdsFetch();
  }
};

document.getElementById('libImportLocalBtn').onclick = () => document.getElementById('libImportInput').click();
document.getElementById('libImportInput').onchange = async (e) => {
  const files = e.target.files;
  if (files && files.length) {
    await importBricksLibraryFiles(files);
    if (mpState.parsed) refreshMissingPartsPromptAfterLibraryImport();
  }
  e.target.value = '';
};

document.getElementById('libClearSavedBtn').onclick = () => {
  const confirmWrap = document.getElementById('libClearConfirmWrap');
  if (confirmWrap) confirmWrap.classList.remove('hidden');
};
document.getElementById('libClearConfirmCancel').onclick = () => {
  const confirmWrap = document.getElementById('libClearConfirmWrap');
  if (confirmWrap) confirmWrap.classList.add('hidden');
};
document.getElementById('libClearConfirmYes').onclick = async () => {
  userLibRaw.clear();
  userLibTitles.clear();
  movedToAliases.clear();
  notFoundDatCache.clear();
  textureStore.clearLibrary();
  invalidateLibraryRenderCaches();
  await dbClearStore(LIB_STORE);
  const confirmWrap = document.getElementById('libClearConfirmWrap');
  if (confirmWrap) confirmWrap.classList.add('hidden');
  updateLibraryStatusUI();
  if (state.model) {
    computeModelDiagnostics();
    renderAll();
  }
  showToast('Cleared all saved files from Bricks Library.');
};

let pendingRawFile = null; // { kind:'io'|'ldr', fileName, data }
let mpState = {
  parsed: null,
  analysis: null,
  fetching: false,
  attemptedFetch: false,
  token: 0,
};
let impPreviewEngine = null;
let impPreviewMesh = null;
let impState = {
  parsed: null,
  prep: null,
  assessment: null,
  proposals: [],
  selectedId: 'none', // 'none' or proposal.id
  activeProposal: null,
  explodePct: 50,
  isExploded: true,
  colorMode: 'sections', // 'sections' | 'bricks'
  az: 38,
  el: 28,
  zoom: 1.0,
  panX: 0,
  panY: 0,
  isPostImport: false,
  skipAutoFetch: false,
  pickerOpen: false,
  pickerFocusIdx: 0,
  wordlessMode: DEFAULT_WORDLESS_MODE,
};

function closeImportAssistant(keepPendingRaw = false) {
  if (impExplodeAnimRaf) {
    cancelAnimationFrame(impExplodeAnimRaf);
    impExplodeAnimRaf = 0;
  }
  state.pendingImport = null;
  if (!keepPendingRaw) pendingRawFile = null;
  impState.parsed = null;
  impState.activeProposal = null;
  impState.skipAutoFetch = false;
  impState.pickerOpen = false;
  impPreviewMesh = null;
  document.getElementById('importModal').classList.add('hidden');
}

function getPreviewPartMaps() {
  const parts = impState.parsed?.parts || [];
  const prop = impState.activeProposal;
  const partOffsets = {};
  const partColorOverrides = impState.colorMode === 'sections' ? {} : null;

  if (prop && prop.sections?.length) {
    const spanRef = Math.max(160, impState.assessment?.longestSpanLdu || 320);
    const explodeDist = Math.min(240, Math.max(48, spanRef * 0.24)) * (impState.explodePct / 100);
    const renderedGroups = [];
    const coveredIndices = new Set();

    prop.sections.forEach((sec) => {
      const groups = sec.repeatPartIndexGroups && sec.repeatPartIndexGroups.length > 1
        ? sec.repeatPartIndexGroups
        : [sec.partIndices];

      groups.forEach((grp, gIdx) => {
        const sign = groups.length === 2 && gIdx === 1 ? -1 : 1;
        const ox = (sec.explodeOffset?.[0] || 0) * explodeDist * sign;
        const oy = (sec.explodeOffset?.[1] || 0) * explodeDist;
        const oz = (sec.explodeOffset?.[2] || 0) * explodeDist * sign;
        const colHex = groups.length === 2 && gIdx === 1 ? '#38bdf8' : sec.previewColor;

        renderedGroups.push({ indices: grp, ox, oy, oz });

        for (const pi of grp) {
          coveredIndices.add(pi);
          const p = parts[pi];
          if (!p) continue;
          if (explodeDist > 1) partOffsets[p.id] = { x: ox, y: oy, z: oz, arrow: false };
          if (partColorOverrides) partColorOverrides[p.id] = colHex;
        }
      });
    });

    // Move each minifigure assembly together with its closest host section so seated drivers &
    // passengers ride inside their car in the 3D exploded preview instead of floating in empty space!
    const boxes = impState.prep?.boxes;
    const minifigGroups = impState.prep?.minifigGroups || [];
    if (boxes && renderedGroups.length > 0 && minifigGroups.length > 0) {
      for (const mg of minifigGroups) {
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        for (const idx of mg.indices) {
          const b = boxes[idx];
          if (!b) continue;
          if (b.min[0] < minX) minX = b.min[0]; if (b.max[0] > maxX) maxX = b.max[0];
          if (b.min[1] < minY) minY = b.min[1]; if (b.max[1] > maxY) maxY = b.max[1];
          if (b.min[2] < minZ) minZ = b.min[2]; if (b.max[2] > maxZ) maxZ = b.max[2];
        }
        if (!isFinite(minX)) continue;
        let bestGrp = renderedGroups[0], bestD = Infinity;
        for (const rg of renderedGroups) {
          for (const pi of rg.indices) {
            const b = boxes[pi];
            if (!b) continue;
            const gx = Math.max(0, minX - b.max[0], b.min[0] - maxX);
            const gy = Math.max(0, minY - b.max[1], b.min[1] - maxY);
            const gz = Math.max(0, minZ - b.max[2], b.min[2] - maxZ);
            const d = Math.hypot(gx, gy, gz);
            if (d < bestD) { bestD = d; bestGrp = rg; }
          }
        }
        for (const idx of mg.indices) {
          if (coveredIndices.has(idx)) continue;
          const p = parts[idx];
          if (!p) continue;
          if (explodeDist > 1) {
            partOffsets[p.id] = { x: bestGrp.ox, y: bestGrp.oy, z: bestGrp.oz, arrow: false };
          }
        }
      }
    }
  } else if (partColorOverrides) {
    // Single Continuous Build: tint the entire model in one unified section color
    const singleColor = SECTION_PREVIEW_PALETTE[0] || '#2563eb';
    for (const p of parts) {
      if (p) partColorOverrides[p.id] = singleColor;
    }
  }
  return { parts, partOffsets, partColorOverrides };
}

function rebuildAndDrawImportPreview() {
  const canvas = document.getElementById('impPreviewCanvas');
  if (!canvas || !impState.parsed) return;
  if (!impPreviewEngine) impPreviewEngine = new WebGLBrickEngine(canvas);

  const { parts, partOffsets, partColorOverrides } = getPreviewPartMaps();
  impPreviewMesh = buildMeshBuffers([], parts, {
    highlightNew: false,
    fadePrev: false,
    fadeOpacity: 1.0,
    showArrows: false,
    accent: '#1a73e8',
    partOffsets,
    partColorOverrides,
  });
  drawImportPreviewFrame();
}

function drawImportPreviewFrame() {
  const canvas = document.getElementById('impPreviewCanvas');
  if (!canvas || !impPreviewEngine || !impPreviewMesh) return;
  const host = canvas.parentElement || canvas;
  const cssW = host.clientWidth || 360;
  const cssH = host.clientHeight || 240;
  const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1.75), 3);
  const w = Math.max(540, Math.round(cssW * dpr));
  const h = Math.max(380, Math.round(cssH * dpr));
  impPreviewEngine.draw(impPreviewMesh, w, h, impState.az, impState.el, impState.zoom || 1.0, 0, {
    heroShading: true,
    lineAlpha: 0.48,
    panX: impState.panX || 0,
    panY: impState.panY || 0,
  });
}

// Orbit, zoom (wheel/pinch), and pan pointer gestures for the 3D Import Preview canvas
const IMP_EXPLODED_PCT = 50;
const IMP_MIN_ZOOM = 0.45;
const IMP_MAX_ZOOM = 5.0;
const IMP_MAX_PAN = 2.5;
let impExplodeAnimRaf = 0;

function syncImportPreviewControlsUI() {
  const wrap = document.getElementById('impPreviewControls');
  const expBtn = document.getElementById('impExplodeToggleBtn');
  const colBtn = document.getElementById('impColorModeToggleBtn');
  const hasProposal = Boolean(impState.activeProposal);
  const show = Boolean(impState.parsed);
  if (wrap) {
    wrap.classList.toggle('opacity-0', !show);
    wrap.classList.toggle('pointer-events-none', !show);
    wrap.classList.toggle('scale-95', !show);
    wrap.classList.toggle('opacity-100', show);
    wrap.classList.toggle('scale-100', show);
  }
  if (expBtn) {
    const isExp = Boolean(impState.isExploded);
    expBtn.className = `glass-pill w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition ${isExp ? '!bg-[var(--primary)] !text-white !border-transparent' : ''} ${hasProposal ? '' : 'hidden'}`;
    expBtn.title = isExp ? 'Collapse sections' : 'Explode sections';
    expBtn.setAttribute('aria-pressed', isExp ? 'true' : 'false');
    expBtn.innerHTML = isExp
      ? `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" x2="21" y1="10" y2="3"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`
      : `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`;
  }
  if (colBtn) {
    const isSec = impState.colorMode === 'sections';
    colBtn.className = `glass-pill w-9 h-9 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition ${isSec ? '!bg-[var(--primary)] !text-white !border-transparent' : ''}`;
    colBtn.title = isSec ? 'Section Colors (tap for Part Colors)' : 'Part Colors (tap for Section Colors)';
    colBtn.setAttribute('aria-pressed', isSec ? 'true' : 'false');
  }
}

function animateImportExplode(nextExploded) {
  if (impExplodeAnimRaf) {
    cancelAnimationFrame(impExplodeAnimRaf);
    impExplodeAnimRaf = 0;
  }
  impState.isExploded = Boolean(nextExploded);
  syncImportPreviewControlsUI();
  const startPct = Number(impState.explodePct) || 0;
  const targetPct = impState.isExploded ? IMP_EXPLODED_PCT : 0;
  if (Math.abs(targetPct - startPct) < 0.5) {
    impState.explodePct = targetPct;
    rebuildAndDrawImportPreview();
    return;
  }
  const durationMs = 340;
  const startTime = performance.now();
  const stepFrame = (now) => {
    const t = Math.min(1, (now - startTime) / durationMs);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    impState.explodePct = startPct + (targetPct - startPct) * eased;
    rebuildAndDrawImportPreview();
    if (t < 1) {
      impExplodeAnimRaf = requestAnimationFrame(stepFrame);
    } else {
      impState.explodePct = targetPct;
      impExplodeAnimRaf = 0;
    }
  };
  impExplodeAnimRaf = requestAnimationFrame(stepFrame);
}

(function bindImportPreviewOrbit() {
  const canvas = document.getElementById('impPreviewCanvas');
  if (!canvas) return;
  const pointers = new Map();
  let lastPinchDist = 0;
  let lastMid = null;
  let movedDist = 0;
  let lastTapTime = 0;

  const applyPanDelta = (dx, dy) => {
    const host = canvas.parentElement || canvas;
    const cssW = Math.max(100, host.clientWidth || 360);
    const cssH = Math.max(100, host.clientHeight || 240);
    const zoom = Math.max(IMP_MIN_ZOOM, impState.zoom || 1.0);
    impState.panX = Math.max(-IMP_MAX_PAN, Math.min(IMP_MAX_PAN, impState.panX + (dx / cssW) * (2.0 / zoom)));
    impState.panY = Math.max(-IMP_MAX_PAN, Math.min(IMP_MAX_PAN, impState.panY + (dy / cssH) * (2.0 / zoom)));
  };

  canvas.addEventListener('pointerdown', (e) => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, btn: e.button, shift: e.shiftKey });
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    if (pointers.size === 1) {
      movedDist = 0;
    } else if (pointers.size === 2) {
      const pts = Array.from(pointers.values());
      lastPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      lastMid = { x: (pts[0].x + pts[1].x) * 0.5, y: (pts[0].y + pts[1].y) * 0.5 };
      movedDist = 999;
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    if (pointers.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      prev.x = e.clientX; prev.y = e.clientY;
      movedDist += Math.hypot(dx, dy);
      if (e.shiftKey || prev.btn === 2 || prev.btn === 1 || (e.buttons & 2) || (e.buttons & 4)) {
        applyPanDelta(dx, dy);
      } else {
        impState.az = (impState.az - dx * 0.55 + 360) % 360;
        impState.el = Math.max(-75, Math.min(80, impState.el + dy * 0.45));
      }
      drawImportPreviewFrame();
    } else if (pointers.size === 2) {
      prev.x = e.clientX; prev.y = e.clientY;
      const pts = Array.from(pointers.values());
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const mid = { x: (pts[0].x + pts[1].x) * 0.5, y: (pts[0].y + pts[1].y) * 0.5 };
      if (lastPinchDist > 5) {
        impState.zoom = Math.max(IMP_MIN_ZOOM, Math.min(IMP_MAX_ZOOM, (impState.zoom || 1.0) * (dist / lastPinchDist)));
      }
      if (lastMid) {
        applyPanDelta(mid.x - lastMid.x, mid.y - lastMid.y);
      }
      lastPinchDist = dist;
      lastMid = mid;
      movedDist = 999;
      drawImportPreviewFrame();
    }
  });

  const endPtr = (e) => {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) {
      lastPinchDist = 0;
      lastMid = null;
    }
  };

  canvas.addEventListener('pointerup', (e) => {
    const now = Date.now();
    if (pointers.size === 1 && movedDist < 6) {
      if (now - lastTapTime < 280) {
        impState.az = 38;
        impState.el = 28;
        impState.zoom = 1.0;
        impState.panX = 0;
        impState.panY = 0;
        lastTapTime = 0;
        drawImportPreviewFrame();
      } else {
        lastTapTime = now;
      }
    }
    endPtr(e);
  });
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const step = Math.max(0.75, Math.min(1.35, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018))));
    impState.zoom = Math.max(IMP_MIN_ZOOM, Math.min(IMP_MAX_ZOOM, (impState.zoom || 1.0) * step));
    drawImportPreviewFrame();
  }, { passive: false });

  if (typeof ResizeObserver !== 'undefined' && canvas.parentElement) {
    const ro = new ResizeObserver(() => {
      const modal = document.getElementById('importModal');
      if (modal && !modal.classList.contains('hidden')) drawImportPreviewFrame();
    });
    ro.observe(canvas.parentElement);
  }
})();

const SINGLE_BUILD_DESCRIPTION = 'Generates clean, buildable steps in one continuous chapter without splitting the model into sections.';

function formatPartCount(n) {
  const v = Number(n) || 0;
  return `${v.toLocaleString()} part${v === 1 ? '' : 's'}`;
}

function getImportPickerOptions() {
  const shouldPrompt = Boolean(impState.assessment?.shouldPrompt);
  const opts = impState.proposals.map((prop, idx) => {
    const secs = (prop.sections || []).filter(s => s.role !== 'join');
    return {
      id: prop.id,
      title: prop.title,
      description: prop.rationale,
      isRec: idx === 0 && shouldPrompt,
      sections: secs,
      totalParts: (prop.sections || []).reduce((acc, s) => {
        const groups = s.repeatPartIndexGroups && s.repeatPartIndexGroups.length > 1 ? s.repeatPartIndexGroups : [s.partIndices || []];
        return acc + groups.reduce((a, g) => a + g.length, 0);
      }, 0),
    };
  });
  opts.push({
    id: 'none',
    title: 'Single Continuous Build',
    description: SINGLE_BUILD_DESCRIPTION,
    isRec: !shouldPrompt,
    sections: [],
    totalParts: impState.parsed?.parts?.length || 0,
  });
  return opts;
}

function renderSectionChips(sections) {
  if (!sections || sections.length === 0) return '';
  return `<div class="flex flex-wrap gap-1.5 pt-1.5">${sections.map((s) => {
    const repeat = s.repeatPartIndexGroups && s.repeatPartIndexGroups.length > 1 ? s.repeatPartIndexGroups.length : 1;
    const count = s.partIndices?.length || 0;
    return `<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-[var(--border)] bg-[var(--card)] text-[11px] font-semibold"><span class="w-2 h-2 rounded-full shrink-0" style="background:${escHtml(s.previewColor || 'var(--primary)')}" aria-hidden="true"></span>${escHtml(s.name)}<span class="font-normal text-[var(--muted-foreground)]">${repeat > 1 ? `×${repeat} · ` : ''}${formatPartCount(count)}${repeat > 1 ? ' each' : ''}</span></span>`;
  }).join('')}</div>`;
}

const RECOMMENDED_BADGE_HTML = '<span class="px-1.5 py-0.5 rounded bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-bold uppercase tracking-wider">Recommended</span>';

function selectImportProposal(pid) {
  impState.selectedId = pid;
  if (pid === 'none') {
    impState.activeProposal = null;
  } else {
    const found = impState.proposals.find(p => p.id === pid);
    impState.activeProposal = found ? JSON.parse(JSON.stringify(found)) : null;
  }
  impState.pickerOpen = false;
  renderImportAssistantUI();
  rebuildAndDrawImportPreview();
  document.getElementById('impProposalTrigger')?.focus();
}

function renderImportProposalPicker() {
  const pickerEl = document.getElementById('impProposalPicker');
  if (!pickerEl) return;
  const opts = getImportPickerOptions();
  const selectedIdx = Math.max(0, opts.findIndex(o => o.id === (impState.selectedId || 'none')));
  const sel = opts[selectedIdx];
  const isOpen = Boolean(impState.pickerOpen);
  const focusIdx = Math.max(0, Math.min(opts.length - 1, impState.pickerFocusIdx ?? selectedIdx));

  const chevron = `<svg class="w-4 h-4 shrink-0 mt-0.5 text-[var(--muted-foreground)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
  const check = `<svg class="w-4 h-4 shrink-0 mt-0.5 text-[var(--primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>`;

  const triggerHtml = `
    <button id="impProposalTrigger" type="button" aria-haspopup="listbox" aria-expanded="${isOpen ? 'true' : 'false'}" aria-controls="impProposalListbox" aria-labelledby="impProposalLabel impProposalTrigger"
      class="w-full text-left p-3 rounded-lg border ${isOpen ? 'border-[var(--primary)]' : 'border-[var(--border)]'} bg-[var(--surface-sunken)] hover:border-[var(--primary)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] transition-colors cursor-pointer flex items-start gap-2.5">
      <div class="min-w-0 flex-1 space-y-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[13px] font-bold text-[var(--foreground)]">${escHtml(sel.title)}</span>
          ${sel.isRec ? RECOMMENDED_BADGE_HTML : ''}
        </div>
        <p class="text-xs text-[var(--muted-foreground)] leading-snug">${escHtml(sel.description)}</p>
        ${renderSectionChips(sel.sections)}
      </div>
      ${chevron}
    </button>`;

  const listHtml = isOpen ? `
    <ul id="impProposalListbox" role="listbox" tabindex="-1" aria-labelledby="impProposalLabel" aria-activedescendant="impProposalOpt_${focusIdx}"
      class="mt-1.5 p-1 rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sheet)] space-y-0.5 outline-none">
      ${opts.map((o, i) => {
        const isSel = i === selectedIdx;
        const isFocus = i === focusIdx;
        const secCount = o.sections.length;
        const meta = o.id === 'none'
          ? `1 chapter · ${formatPartCount(o.totalParts)}`
          : `${secCount} section${secCount === 1 ? '' : 's'} · ${formatPartCount(o.totalParts)}`;
        return `
        <li id="impProposalOpt_${i}" role="option" aria-selected="${isSel ? 'true' : 'false'}" data-opt-idx="${i}" data-opt-id="${escHtml(o.id)}"
          class="flex items-start gap-2.5 px-2.5 py-2.5 rounded-md cursor-pointer transition-colors ${isFocus ? 'bg-[var(--surface-hover)]' : 'hover:bg-[var(--surface-hover)]'}">
          <div class="min-w-0 flex-1 space-y-0.5">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[13px] font-semibold ${isSel ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}">${escHtml(o.title)}</span>
              ${o.isRec ? RECOMMENDED_BADGE_HTML : ''}
            </div>
            <p class="text-xs text-[var(--muted-foreground)] leading-snug">${escHtml(o.description)}</p>
            <p class="text-[11px] text-[var(--muted-foreground)] font-medium">${meta}</p>
          </div>
          ${isSel ? check : '<span class="w-4 shrink-0" aria-hidden="true"></span>'}
        </li>`;
      }).join('')}
    </ul>` : '';

  pickerEl.innerHTML = triggerHtml + listHtml;

  const trigger = document.getElementById('impProposalTrigger');
  const listbox = document.getElementById('impProposalListbox');
  const openAt = (idx) => {
    impState.pickerOpen = true;
    impState.pickerFocusIdx = idx;
    renderImportProposalPicker();
    document.getElementById('impProposalListbox')?.focus();
    document.getElementById(`impProposalOpt_${idx}`)?.scrollIntoView({ block: 'nearest' });
  };
  const close = () => {
    impState.pickerOpen = false;
    renderImportProposalPicker();
    document.getElementById('impProposalTrigger')?.focus();
  };

  trigger.onclick = () => {
    if (impState.pickerOpen) close();
    else openAt(selectedIdx);
  };
  trigger.onkeydown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openAt(selectedIdx);
    }
  };
  if (listbox) {
    listbox.onkeydown = (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        openAt((focusIdx + delta + opts.length) % opts.length);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        openAt(e.key === 'Home' ? 0 : opts.length - 1);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectImportProposal(opts[focusIdx].id);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      } else if (e.key === 'Tab') {
        impState.pickerOpen = false;
        renderImportProposalPicker();
      }
    };
    listbox.querySelectorAll('[role="option"]').forEach((li) => {
      li.addEventListener('click', () => selectImportProposal(li.getAttribute('data-opt-id')));
    });
  }
}

// Close the Build Organization picker when tapping anywhere outside it
document.addEventListener('pointerdown', (e) => {
  if (!impState.pickerOpen) return;
  const pickerEl = document.getElementById('impProposalPicker');
  if (pickerEl && !pickerEl.contains(e.target)) {
    impState.pickerOpen = false;
    renderImportProposalPicker();
  }
});

function renderImportAssistantUI() {
  const autoBtn = document.getElementById('impBtnAuto');
  const dupChk = document.getElementById('toggleDetectDuplicates');
  if (dupChk) dupChk.checked = Boolean(state.detectDuplicates);

  document.querySelectorAll('.imp-wordless-btn').forEach((b) => {
    const isWlBtn = b.getAttribute('data-imp-wordless') !== 'false';
    const act = Boolean(impState.wordlessMode) === isWlBtn;
    b.setAttribute('aria-checked', act ? 'true' : 'false');
    b.className = `imp-wordless-btn text-left p-3 rounded-lg border transition-colors cursor-pointer flex items-start gap-2.5 ${
      act
        ? 'border-[var(--primary)] bg-[var(--primary-soft)] ring-1 ring-[var(--primary)]/30'
        : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-hover)]'
    }`;
    const iconWrap = b.querySelector('span');
    if (iconWrap) {
      iconWrap.className = `mt-0.5 w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
        act
          ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
          : 'bg-[var(--surface-sunken)] text-[var(--muted-foreground)]'
      }`;
    }
  });

  syncImportPreviewControlsUI();
  renderImportProposalPicker();

  const editsSummary = getCurrentManualEditsSummary();
  const willChangeWordless =
    impState.isPostImport && Boolean(impState.wordlessMode) !== Boolean(state.wordlessMode);
  applyDestructiveNoticeToEl(
    'impActionNotice',
    getStepGenerationDestructiveNotice({
      isPostImport: impState.isPostImport,
      hasOpenModel: Boolean(state.model),
      openModelTitle: state.model?.title,
      editsSummary,
      willChangeWordless,
      targetWordless: Boolean(impState.wordlessMode),
      isKeepStepsAction: false,
    }),
  );
  applyDestructiveNoticeToEl(
    'impKeepNotice',
    impState.parsed?.hasSteps
      ? getStepGenerationDestructiveNotice({
          isPostImport: impState.isPostImport,
          hasOpenModel: Boolean(state.model),
          openModelTitle: state.model?.title,
          editsSummary,
          willChangeWordless,
          targetWordless: Boolean(impState.wordlessMode),
          isKeepStepsAction: true,
        })
      : null,
  );

  const active = impState.activeProposal;

  if (!active) {
    autoBtn.textContent = impState.isPostImport ? 'Regenerate & Apply Steps' : 'Generate Manual';
    return;
  }

  const isMod = active.outputMode === 'modular_chapters';
  const primarySecs = active.sections.filter(s => s.role !== 'join');
  const hasJoin = active.sections.some(s => s.role === 'join');
  const secCountLabel = isMod
    ? `${primarySecs.length} Section${primarySecs.length === 1 ? '' : 's'}${hasJoin ? ' + Join' : ''}`
    : `${active.sections.length} Sections`;
  autoBtn.textContent = `${impState.isPostImport ? 'Apply & Regenerate' : 'Generate Manual'} (${secCountLabel})`;
}

function openImportAssistant(parsed, isPostImport = false) {
  if (impExplodeAnimRaf) {
    cancelAnimationFrame(impExplodeAnimRaf);
    impExplodeAnimRaf = 0;
  }
  const prep = prepareSubdivisionData(parsed);
  const { assessment, proposals } = analyzeModelSubdivisions(prep.inputs, prep.adjacency);

  state.pendingImport = parsed;
  impState.parsed = parsed;
  impState.prep = prep;
  impState.assessment = assessment;
  impState.proposals = proposals;
  impState.isPostImport = isPostImport;
  impState.wordlessMode = isPostImport ? Boolean(state.wordlessMode) : DEFAULT_WORDLESS_MODE;
  impState.pickerOpen = false;
  impState.colorMode = 'sections';
  impState.az = 38;
  impState.el = 28;
  impState.zoom = 1.0;
  impState.panX = 0;
  impState.panY = 0;

  // When reopened from Step Generation menu, match the currently active plan if any; otherwise pick recommended
  const currentPlan = isPostImport ? state.model?._subdivisionPlan : null;
  const matchedExisting = currentPlan
    ? proposals.find(p => p.id === currentPlan.id || p.strategy === currentPlan.strategy)
    : null;

  if (matchedExisting) {
    impState.selectedId = matchedExisting.id;
    impState.activeProposal = JSON.parse(JSON.stringify(matchedExisting));
  } else if (isPostImport && !currentPlan) {
    impState.selectedId = 'none';
    impState.activeProposal = null;
  } else if (assessment.shouldPrompt && proposals.length > 0) {
    impState.selectedId = proposals[0].id;
    impState.activeProposal = JSON.parse(JSON.stringify(proposals[0]));
  } else {
    impState.selectedId = 'none';
    impState.activeProposal = null;
  }

  impState.isExploded = Boolean(impState.activeProposal);
  impState.explodePct = impState.isExploded ? IMP_EXPLODED_PCT : 0;

  document.getElementById('impTitle').textContent = isPostImport
    ? 'Step Generation'
    : assessment.shouldPrompt
      ? `Step Generation — ${parsed.title}`
      : `Import ${parsed.title}`;

  const reasonStr = assessment.reasons.length > 0
    ? `${parsed.title} · Detected ${assessment.reasons.join(' · ')}.`
    : `${parsed.title} · ${formatPartCount(parsed.parts.length)}${parsed.submodelCount ? ` across ${parsed.submodelCount} submodels` : ''}.`;
  document.getElementById('impSummary').textContent = reasonStr;

  document.getElementById('impKeepWrap').classList.toggle('hidden', !parsed.hasSteps);
  document.getElementById('importModal').classList.remove('hidden');
  renderImportAssistantUI();
  requestAnimationFrame(() => rebuildAndDrawImportPreview());
}

// Wire Import Preview overlay controls
const impExplodeToggleBtn = document.getElementById('impExplodeToggleBtn');
if (impExplodeToggleBtn) {
  impExplodeToggleBtn.onclick = (e) => {
    e.stopPropagation();
    if (!impState.activeProposal) return;
    animateImportExplode(!impState.isExploded);
  };
}
const impColorModeToggleBtn = document.getElementById('impColorModeToggleBtn');
if (impColorModeToggleBtn) {
  impColorModeToggleBtn.onclick = (e) => {
    e.stopPropagation();
    impState.colorMode = impState.colorMode === 'sections' ? 'bricks' : 'sections';
    syncImportPreviewControlsUI();
    rebuildAndDrawImportPreview();
  };
}
document.querySelectorAll('.imp-wordless-btn').forEach((b) => {
  b.onclick = () => {
    impState.wordlessMode = b.getAttribute('data-imp-wordless') !== 'false';
    renderImportAssistantUI();
  };
});

function finishImport(parsed, mode, subdivisionPlan = null, isPostImport = false, importOpts = {}) {
  if (isPostImport) pushUndo();
  const skipAutoFetch = Boolean(importOpts && importOpts.skipAutoFetch);
  const hasExplicitWordless = typeof importOpts?.wordlessMode === 'boolean';
  const targetWordless = hasExplicitWordless
    ? importOpts.wordlessMode
    : (isPostImport ? Boolean(state.wordlessMode) : DEFAULT_WORDLESS_MODE);
  submodelThumbCache.clear();
  coverHeroCache.clear();
  overviewThumbCache.bumpEpoch();
  state.model = buildManualFromParsed(parsed, mode, subdivisionPlan);
  if (!isPostImport) {
    const wlDefs = getWordlessSurfaceDefaults(targetWordless);
    state.wordlessMode = targetWordless;
    state.bomShowTextFields = wlDefs.bomShowTextFields;
    state.pageNumberFormat = wlDefs.pageNumberFormat;
    state.overrides = {}; state.stepInserts = {}; state.pageInserts = {}; state.dividerAfter = {};
    state.layoutGroups = [];
    state.coverMeta = createDefaultCoverMeta({ showText: wlDefs.coverShowText });
    state.completeMeta = { ...createDefaultCompleteMeta(), showText: wlDefs.completeShowText };
    state.backMeta = createDefaultBackMeta();
    state.undoStack = []; state.redoStack = [];
    state.seenDiagnosticKeys = new Set();
  } else if (hasExplicitWordless && targetWordless !== Boolean(state.wordlessMode)) {
    applyWordlessMode(targetWordless, { pushHistory: false, render: false });
  }
  state.pageIdx = 0; state.mode = 'pan'; state.selectedPartIds.clear();
  errFilter = 'all';
  closeImportAssistant(true);
  if (!isPostImport && pendingRawFile) {
    lastSourceRecord = { ...pendingRawFile, importMode: mode, subdivisionPlan: subdivisionPlan || null };
    dbPut('lastModel', lastSourceRecord);
    pendingRawFile = null;
  } else if (isPostImport && lastSourceRecord && (lastSourceRecord.kind === 'io' || lastSourceRecord.kind === 'ldr')) {
    lastSourceRecord = { ...lastSourceRecord, importMode: mode, subdivisionPlan: subdivisionPlan || null };
    dbPut('lastModel', lastSourceRecord);
  }
  computeModelDiagnostics();
  resetZoom(); renderAll();
  const steps = getAllSteps(state.model);
  const subSummary = subdivisionPlan && subdivisionPlan.strategy !== 'none'
    ? ` · ${subdivisionPlan.title}`
    : '';
  showToast(`${isPostImport ? 'Updated' : 'Imported'} ${parsed.title} (${formatPartCount(parsed.parts.length)}, ${steps.length} steps${subSummary}).`);
  if (!isPostImport && state.diagnostics.length > 0) showImportErrorBanner();
  if (!isPostImport && !skipAutoFetch && lastSourceRecord?.kind === 'ldr') {
    void fetchMissingPartsOnline({ silent: true });
  }
}

document.getElementById('impBtnAuto').onclick = () => {
  if (!impState.parsed) return;
  finishImport(impState.parsed, 'auto', impState.activeProposal, impState.isPostImport, {
    skipAutoFetch: impState.skipAutoFetch,
    wordlessMode: impState.wordlessMode,
  });
};
document.getElementById('impBtnKeep').onclick = () => {
  if (!impState.parsed) return;
  finishImport(impState.parsed, 'keep', null, impState.isPostImport, {
    skipAutoFetch: impState.skipAutoFetch,
    wordlessMode: impState.wordlessMode,
  });
};
document.getElementById('impBtnCancel').onclick = () => closeImportAssistant(false);
document.getElementById('impBtnCloseX').onclick = () => closeImportAssistant(false);
document.getElementById('importModal').onclick = (e) => {
  if (e.target.id === 'importModal') closeImportAssistant(false);
};

function analyzePendingImportMissingParts(parsed) {
  return analyzeMissingParts(parsed?.parts || [], {
    lookupExactRawDat: (k) => lookupExactRawDat(k),
    hasKnownShape: (k) => hasKnownShape(k),
    getPartIdFallbacks: (k) => getPartIdFallbacks(k),
    hasTexture: (tn) => Boolean(textureStore.lookupByName(tn)),
  });
}

function proceedAfterMissingPartsCheck(parsed, opts = {}) {
  const skipAutoFetch = Boolean(opts && opts.skipAutoFetch);
  const prep = prepareSubdivisionData(parsed);
  const { assessment } = analyzeModelSubdivisions(prep.inputs, prep.adjacency);
  impState.skipAutoFetch = skipAutoFetch;
  if (parsed.hasSteps || parsed.submodelCount > 0 || assessment.shouldPrompt) {
    openImportAssistant(parsed, false);
  } else {
    finishImport(parsed, 'auto', null, false, { skipAutoFetch, wordlessMode: DEFAULT_WORDLESS_MODE });
    if (assessment.tier === 'borderline') {
      showToast(`Imported ${parsed.title}. Tip: Open Menu → Subdivide Model to split into sections.`);
    }
  }
}

function closeMissingPartsPrompt(keepPendingRaw = false) {
  mpState.token++;
  mpState.parsed = null;
  mpState.analysis = null;
  mpState.fetching = false;
  mpState.attemptedFetch = false;
  if (!keepPendingRaw) pendingRawFile = null;
  document.getElementById('missingPartsModal').classList.add('hidden');
  document.getElementById('mpProgressWrap').classList.add('hidden');
  document.getElementById('mpStatusBox').classList.add('hidden');
}

function renderMissingPartsPromptUI(statusMsg = null, statusTone = 'info') {
  const parsed = mpState.parsed;
  const analysis = mpState.analysis;
  if (!parsed || !analysis) return;

  const titleEl = document.getElementById('mpTitle');
  const badgeEl = document.getElementById('mpCountBadge');
  const summaryEl = document.getElementById('mpSummary');
  const listEl = document.getElementById('mpList');
  const statusEl = document.getElementById('mpStatusBox');
  const fetchBtn = document.getElementById('mpBtnFetch');
  const fetchLabel = document.getElementById('mpBtnFetchLabel');
  const skipBtn = document.getElementById('mpBtnSkip');
  const importBtn = document.getElementById('mpBtnImportLib');
  const closeX = document.getElementById('mpBtnCloseX');

  const shapeN = analysis.missingShapes.length;
  const printN = analysis.missingPrinted.length;
  const texN = analysis.missingTextures.length;

  titleEl.textContent = shapeN > 0 ? 'Missing Parts Found' : 'Missing Printed Parts Found';
  badgeEl.textContent = `${analysis.totalMissingUnique} Missing`;

  const clauses = [];
  if (shapeN > 0) clauses.push(`${shapeN} 3D part shape${shapeN === 1 ? '' : 's'}`);
  if (printN > 0) clauses.push(`${printN} printed part${printN === 1 ? '' : 's'}`);
  if (texN > 0) clauses.push(`${texN} decal texture${texN === 1 ? '' : 's'}`);
  summaryEl.textContent = `"${parsed.title}" references ${clauses.join(' and ')} not yet in your Bricks Library.`;
  applyDestructiveNoticeToEl(
    'mpReplaceModelNotice',
    getReplaceModelModalDestructiveNotice({
      hasOpenModel: Boolean(state.model),
      modelTitle: state.model?.title,
      editsSummary: getCurrentManualEditsSummary(),
    }),
  );

  const rows = [];
  for (const item of analysis.missingShapes) {
    const tag = item.fetchable
      ? '<span class="text-xs font-bold px-1.5 py-0.5 rounded-md bg-[var(--warning-soft)] text-[var(--warning)] shrink-0">Shape</span>'
      : '<span class="text-xs font-bold px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 shrink-0">Custom ID</span>';
    rows.push({
      name: getHumanPartName(item.partId),
      code: `${item.partId}.dat`,
      count: item.count,
      tag,
    });
  }
  for (const item of analysis.missingPrinted) {
    rows.push({
      name: getHumanPartName(item.partId),
      code: `${item.partId}.dat`,
      count: item.count,
      tag: '<span class="text-xs font-bold px-1.5 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">Printed</span>',
    });
  }
  for (const tn of analysis.missingTextures) {
    rows.push({
      name: 'Decal Texture',
      code: tn,
      count: null,
      tag: '<span class="text-xs font-bold px-1.5 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)] shrink-0">Decal PNG</span>',
    });
  }

  const MAX_VISIBLE = 24;
  const visibleRows = rows.slice(0, MAX_VISIBLE);
  const extraCount = rows.length - visibleRows.length;
  listEl.innerHTML = visibleRows.map((r) => `
    <div class="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-[var(--card)] border border-[var(--border)]">
      <div class="min-w-0">
        <div class="text-xs font-semibold truncate">${escHtml(r.name)}${r.count ? ` <span class="text-[var(--muted-foreground)] font-normal">(${r.count}×)</span>` : ''}</div>
        <div class="text-xs font-mono text-[var(--muted-foreground)] truncate">${escHtml(r.code)}</div>
      </div>
      ${r.tag}
    </div>
  `).join('') + (extraCount > 0
    ? `<div class="text-center text-xs font-semibold text-[var(--muted-foreground)] py-1.5">+${extraCount} more missing part${extraCount === 1 ? '' : 's'}…</div>`
    : '');

  let effectiveStatus = statusMsg;
  let effectiveTone = statusTone;
  if (!effectiveStatus && analysis.fetchableCount === 0 && analysis.customOnlyCount > 0) {
    effectiveStatus = 'These look like BrickLink Studio custom part IDs that are not hosted on public LDraw mirrors. Open the original .io file or import local .dat/.zip parts, or continue to step generation.';
    effectiveTone = 'warn';
  }

  if (effectiveStatus) {
    statusEl.className = effectiveTone === 'warn'
      ? 'p-3.5 rounded-lg border border-[var(--warning)]/35 bg-[var(--warning-soft)] text-[var(--warning)] text-xs leading-relaxed'
      : 'p-3.5 rounded-lg border border-[var(--success)]/35 bg-[var(--success-soft)] text-[var(--success)] text-xs leading-relaxed';
    statusEl.textContent = effectiveStatus;
    statusEl.classList.remove('hidden');
  } else {
    statusEl.classList.add('hidden');
  }

  const isContinueMode = mpState.attemptedFetch || analysis.fetchableCount === 0;
  fetchBtn.disabled = mpState.fetching;
  skipBtn.disabled = mpState.fetching;
  importBtn.disabled = mpState.fetching;
  closeX.disabled = mpState.fetching;
  fetchBtn.classList.toggle('opacity-70', mpState.fetching);

  if (mpState.fetching) {
    fetchLabel.textContent = 'Fetching Parts…';
    skipBtn.classList.remove('hidden');
  } else if (isContinueMode) {
    fetchLabel.textContent = 'Continue to Step Wizard';
    skipBtn.classList.add('hidden');
  } else {
    fetchLabel.textContent = 'Fetch Missing Parts Online';
    skipBtn.classList.remove('hidden');
  }
}

function openMissingPartsPrompt(parsed, analysis) {
  mpState.token++;
  mpState.parsed = parsed;
  mpState.analysis = analysis;
  mpState.fetching = false;
  mpState.attemptedFetch = false;
  document.getElementById('mpProgressWrap').classList.add('hidden');
  document.getElementById('mpProgressBar').style.width = '0%';
  document.getElementById('mpProgressPct').textContent = '0%';
  renderMissingPartsPromptUI();
  document.getElementById('missingPartsModal').classList.remove('hidden');
}

function refreshMissingPartsPromptAfterLibraryImport() {
  if (!mpState.parsed || mpState.fetching) return;
  const parsed = mpState.parsed;
  const after = analyzePendingImportMissingParts(parsed);
  if (!after.shouldPrompt) {
    closeMissingPartsPrompt(true);
    showToast('All missing parts loaded — opening step wizard.');
    proceedAfterMissingPartsCheck(parsed, { skipAutoFetch: true });
    return;
  }
  mpState.analysis = after;
  if (after.fetchableCount > 0) mpState.attemptedFetch = false;
  renderMissingPartsPromptUI(`Library updated. ${after.totalMissingUnique} missing item${after.totalMissingUnique === 1 ? '' : 's'} remaining.`, 'info');
}

document.getElementById('mpBtnFetch').onclick = async () => {
  if (!mpState.parsed || mpState.fetching) return;
  const parsed = mpState.parsed;
  const analysis = mpState.analysis;

  // After a partial/blocked fetch or when only Studio-custom IDs remain, primary CTA advances to the wizard
  if (mpState.attemptedFetch || !analysis || analysis.fetchableCount === 0) {
    closeMissingPartsPrompt(true);
    proceedAfterMissingPartsCheck(parsed, { skipAutoFetch: true });
    return;
  }

  const token = mpState.token;
  mpState.fetching = true;
  const progWrap = document.getElementById('mpProgressWrap');
  const progLabel = document.getElementById('mpProgressLabel');
  const progPct = document.getElementById('mpProgressPct');
  const progBar = document.getElementById('mpProgressBar');
  progWrap.classList.remove('hidden');
  progLabel.textContent = 'Checking public LDraw library…';
  progPct.textContent = '0%';
  progBar.style.width = '0%';
  renderMissingPartsPromptUI();

  const res = await fetchMissingPartsOnline({
    parsed,
    silent: true,
    onProgress: (ev) => {
      if (mpState.token !== token) return;
      const pct = Math.max(0, Math.min(100, ev.pct || 0));
      progPct.textContent = `${pct}%`;
      progBar.style.width = `${pct}%`;
      if (ev.phase === 'textures') {
        progLabel.textContent = `Fetching decal textures (${ev.processed}/${ev.total})…`;
      } else if (ev.phase === 'parts') {
        progLabel.textContent = `Fetched ${ev.fetched} part${ev.fetched === 1 ? '' : 's'} (${ev.processed}/${ev.total})…`;
      } else if (ev.phase === 'done') {
        progLabel.textContent = 'Preparing 3D previews…';
      }
    },
  });

  if (mpState.token !== token) return;
  mpState.fetching = false;
  progWrap.classList.add('hidden');

  const after = analyzePendingImportMissingParts(parsed);
  if (!res.networkBlocked && (!after.shouldPrompt || after.fetchableCount === 0)) {
    const fetchedMsg = res.fetched > 0 || res.fetchedTex > 0
      ? `Fetched ${res.fetched} part shape${res.fetched === 1 ? '' : 's'}${res.fetchedTex > 0 ? ` and ${res.fetchedTex} decal${res.fetchedTex === 1 ? '' : 's'}` : ''}.`
      : 'Part shapes ready.';
    if (!after.shouldPrompt) {
      closeMissingPartsPrompt(true);
      showToast(fetchedMsg);
      proceedAfterMissingPartsCheck(parsed, { skipAutoFetch: true });
      return;
    }
    // Only Studio-custom parts remain: inform user briefly and switch primary CTA to Continue
    mpState.analysis = after;
    mpState.attemptedFetch = true;
    renderMissingPartsPromptUI(
      `${fetchedMsg} ${after.customOnlyCount} BrickLink Studio custom ID${after.customOnlyCount === 1 ? '' : 's'} could not be fetched from public LDraw mirrors — import local .dat/.zip or continue now.`,
      'info',
    );
    return;
  }

  mpState.analysis = after;
  mpState.attemptedFetch = true;
  if (res.networkBlocked) {
    renderMissingPartsPromptUI(
      'Online fetch appears offline or blocked in this environment. You can import LDraw complete.zip / .dat files locally or continue to the step wizard.',
      'warn',
    );
  } else if (res.fetched > 0 || res.fetchedTex > 0) {
    renderMissingPartsPromptUI(
      `Fetched ${res.fetched} part shape${res.fetched === 1 ? '' : 's'}${res.fetchedTex > 0 ? ` and ${res.fetchedTex} decal${res.fetchedTex === 1 ? '' : 's'}` : ''}. ${after.totalMissingUnique} item${after.totalMissingUnique === 1 ? '' : 's'} could not be found on public LDraw mirrors — continue when ready.`,
      'info',
    );
  } else {
    renderMissingPartsPromptUI(
      'No matching parts were found on public LDraw mirrors (they may be custom or unofficial IDs). Import local .dat/.zip files, open the original .io file, or continue to the step wizard.',
      'warn',
    );
  }
};

document.getElementById('mpBtnSkip').onclick = () => {
  if (!mpState.parsed || mpState.fetching) return;
  const parsed = mpState.parsed;
  closeMissingPartsPrompt(true);
  proceedAfterMissingPartsCheck(parsed, { skipAutoFetch: true });
};
document.getElementById('mpBtnImportLib').onclick = () => {
  if (mpState.fetching) return;
  document.getElementById('libImportInput').click();
};
document.getElementById('mpBtnCloseX').onclick = () => {
  if (!mpState.fetching) closeMissingPartsPrompt(false);
};
document.getElementById('missingPartsModal').onclick = (e) => {
  if (e.target.id === 'missingPartsModal' && !mpState.fetching) closeMissingPartsPrompt(false);
};

async function handleIncomingModelFile(file) {
  if (!file) return;
  const lower = file.name.toLowerCase();
  if (!lower.endsWith('.io') && !lower.endsWith('.ldr') && !lower.endsWith('.mpd')) {
    showToast('Please select a BrickLink Studio (.io) or LDraw (.ldr / .mpd) file.'); return;
  }
  showToast(`Reading ${file.name}…`);
  try {
    let parsed;
    if (lower.endsWith('.io')) {
      const ab = await file.arrayBuffer();
      pendingRawFile = { kind: 'io', fileName: file.name, data: ab };
      const { m1Text, m2Text } = await extractIoArchive(ab);
      parsed = parseImportedModel(m1Text, m2Text, file.name);
      await textureStore.predecodeAllPending();
    } else {
      embeddedDatRaw.clear(); embeddedDatTitles.clear(); embeddedDatCompiled.clear(); compositePartDefs.clear(); pliThumbCache.clear(); submodelThumbCache.clear(); clearMinifigDiagramCaches(); overviewThumbCache.bumpEpoch();
      textureStore.clearEmbedded();
      const txt = await file.text();
      pendingRawFile = { kind: 'ldr', fileName: file.name, data: txt };
      parsed = parseImportedModel(txt, '', file.name);
      await textureStore.predecodeAllPending();
    }
    const missingAnalysis = analyzePendingImportMissingParts(parsed);
    if (missingAnalysis.shouldPrompt) {
      openMissingPartsPrompt(parsed, missingAnalysis);
    } else {
      proceedAfterMissingPartsCheck(parsed, { skipAutoFetch: false });
    }
  } catch (err) {
    showToast(err?.message || 'Could not import this file.');
  }
}

document.getElementById('fileInput').onchange = async (e) => {
  const file = e.target.files?.[0]; e.target.value = '';
  await handleIncomingModelFile(file);
};

async function closeCurrentModel() {
  if (!state.model) {
    closeMenu();
    return;
  }
  const closedTitle = state.model.title || 'model';
  closeMenu();
  closeBomSetupModal();
  closeApplyAngleModal();
  closeBricksLibraryModal();
  stopOverviewThumbQueue();
  setStylePopoverOpen(false);
  cleanupPrintAllPages();

  for (const modalId of [
    'openModelModal',
    'exportModal',
    'pageSetupModal',
    'errorsModal',
    'overviewModal',
    'importModal',
    'missingPartsModal',
    'errorBanner',
  ]) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('hidden');
  }

  if (activeLiveEngine) {
    activeLiveEngine.dispose();
    activeLiveEngine = null;
  }
  currentSlotRenderInfo.clear();

  clearTimeout(savePrefsTimer);
  savePrefsTimer = null;
  lastSourceRecord = null;
  pendingRawFile = null;

  embeddedDatRaw.clear();
  embeddedDatTitles.clear();
  embeddedDatCompiled.clear();
  compositePartDefs.clear();
  pliThumbCache.clear();
  submodelThumbCache.clear();
  clearMinifigDiagramCaches();
  overviewThumbCache.bumpEpoch();
  textureStore.clearEmbedded();

  state.model = null;
  state.pages = [];
  state.pageIdx = 0;
  state.mode = 'pan';
  state.stepSubTab = 'camera';
  state.selectedStepId = null;
  state.selectedPartIds.clear();
  state.selectedArrangeEl = null;
  state.overrides = {};
  state.stepInserts = {};
  state.pageInserts = {};
  state.dividerAfter = {};
  state.layoutGroups = [];
  state.layout = 'auto';
  const wlDefs = getWordlessSurfaceDefaults(DEFAULT_WORDLESS_MODE);
  state.layoutConfig = createDefaultPageLayoutSpec();
  state.wordlessMode = DEFAULT_WORDLESS_MODE;
  state.bomShowTextFields = wlDefs.bomShowTextFields;
  state.pageNumberFormat = wlDefs.pageNumberFormat;
  state.coverMeta = createDefaultCoverMeta({ showText: wlDefs.coverShowText });
  state.completeMeta = { ...createDefaultCompleteMeta(), showText: wlDefs.completeShowText };
  state.backMeta = createDefaultBackMeta();
  state.pendingImport = null;
  state.undoStack = [];
  state.redoStack = [];
  state.diagnostics = [];
  state.seenDiagnosticKeys = new Set();

  const frame = document.getElementById('pageFrame');
  if (frame) frame.innerHTML = '';

  resetZoom();
  renderAll();
  try {
    await dbDelete('lastModel');
  } catch (_) {}
  showToast(`Closed ${closedTitle}.`);
}

// Top-rail Export, Close Model, and Dropzone handlers
const menuCloseModelBtnEl = document.getElementById('menuCloseModelBtn');
if (menuCloseModelBtnEl) menuCloseModelBtnEl.onclick = closeCurrentModel;
const btnHeaderExportEl = document.getElementById('btnHeaderExport');
if (btnHeaderExportEl) btnHeaderExportEl.onclick = openExportModal;

const emptyStateEl = document.getElementById('emptyState');
const emptyDropZoneEl = document.getElementById('emptyDropZone');
if (emptyStateEl) {
  const setDropActive = (on) => {
    if (!emptyDropZoneEl) return;
    emptyDropZoneEl.classList.toggle('border-[var(--primary)]', on);
    emptyDropZoneEl.classList.toggle('bg-[var(--primary-soft)]', on);
  };
  emptyStateEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    setDropActive(true);
  });
  emptyStateEl.addEventListener('dragleave', (e) => {
    if (!emptyStateEl.contains(e.relatedTarget)) setDropActive(false);
  });
  emptyStateEl.addEventListener('drop', async (e) => {
    e.preventDefault();
    setDropActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (isProjectFileName(file.name)) {
      await handleIncomingProjectFile(file);
    } else {
      await handleIncomingModelFile(file);
    }
  });
}

// iOS/iPadOS Files app greys out unregistered custom extensions when `accept`
// is set; strip `accept` on Apple touch devices while JS strictly enforces
// `.biw` and `.biwtheme` extensions on every platform.
const isAppleTouchDevice =
  /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
  (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
if (isAppleTouchDevice) {
  document.getElementById('projectLoadInput')?.removeAttribute('accept');
  document.getElementById('themeImportInput')?.removeAttribute('accept');
}

window.addEventListener('resize', () => {
  if (state.model) renderAll();
  if (impState.parsed && !document.getElementById('importModal').classList.contains('hidden')) {
    drawImportPreviewFrame();
  }
  if (isBomSetupModalOpen()) {
    renderBomSetupPreview(normalizeBomConfig(state.bomConfig));
  }
  updateStylePopoverTail();
});

// Automatically reload last opened model & session on start!
restoreLastSessionOnStart();
}
