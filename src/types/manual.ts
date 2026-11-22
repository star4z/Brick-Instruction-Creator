export type Vec3 = [number, number, number];
export type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

export type SourceFormat = 'io' | 'ldr' | 'mpd' | 'demo';

export type ImportMode =
  | 'regenerate_all'
  | 'preserve_submodels'
  | 'preserve_steps';

export type PacingPreset = 'kids' | 'standard' | 'adult';

export type CanonicalViewId =
  | 'top_front_right'
  | 'top_back_right'
  | 'top_back_left'
  | 'top_front_left'
  | 'bottom_front_right'
  | 'bottom_back_right'
  | 'bottom_back_left'
  | 'bottom_front_left';

export type RotationCueType =
  | 'none'
  | 'yaw_90_cw'
  | 'yaw_90_ccw'
  | 'yaw_180'
  | 'flip_vertical';

export type ConnectionType =
  | 'stud'
  | 'snot'
  | 'bar_clip'
  | 'technic'
  | 'hinge'
  | 'proximity';

export type SnapKind =
  | 'stud'
  | 'anti_stud'
  | 'side_stud'
  | 'bar'
  | 'clip'
  | 'pin'
  | 'pin_hole'
  | 'axle'
  | 'axle_hole'
  | 'hinge';

export interface SnapPoint {
  kind: SnapKind;
  position: Vec3; // Local LDU coordinates (Y-up internal convention)
  normal: Vec3;   // Unit vector pointing outward along connection axis
  radius?: number;
  length?: number;
}

export interface RawLDrawGeometry {
  triangles: number[]; // flat xyz triplets
  lines: number[];     // flat xyz segment pairs
  boundsMin: Vec3;
  boundsMax: Vec3;
}

export interface PartInstance {
  id: string;
  signature: string;
  partId: string;
  partName: string;
  colorId: number;
  position: Vec3; // Canonical Y-up LDU coordinates (1 stud = 20 LDU, 1 plate = 8 LDU, 1 brick = 24 LDU)
  rotation: Mat3;
  submodelPath: string[];
  originalStepIndex: number;
}

export interface ExplicitSubmodel {
  name: string;
  partIds: string[];
  hasSteps: boolean;
}

export interface CanonicalModel {
  id: string;
  name: string;
  author: string;
  sourceFormat: SourceFormat;
  parts: PartInstance[];
  explicitSubmodels: ExplicitSubmodel[];
  embeddedLDrawFiles: Record<string, string>;
  hasExistingSteps: boolean;
  hasExistingSubmodels: boolean;
  importTimestamp: number;
}

export interface ConnectionEdge {
  a: string;
  b: string;
  type: ConnectionType;
  strength: number;
  direction: Vec3; // Unit vector from a -> b
  gap: number;     // Distance in LDU
}

export interface FloatingPartWarning {
  partId: string;
  partName: string;
  instanceId: string;
  nearestDistance: number;
  message: string;
}

export interface ConnectivityGraph {
  edges: ConnectionEdge[];
  adjacency: Record<string, ConnectionEdge[]>;
  components: string[][]; // Connected component instance IDs
  floatingWarnings: FloatingPartWarning[];
}

export interface PresentationTransform {
  offset: Vec3; // Visual exploded offset in LDU
  hingeAngleDeg: number; // Articulation/hinge angle override in degrees
  hingeAxis: 'x' | 'y' | 'z';
  showArrow: boolean;
}

export interface StepNode {
  id: string;
  chapterId: string;
  subassemblyId?: string;
  stepNumber: number; // Display number within chapter or subassembly
  partIds: string[];
  attachedSubassemblyIds: string[];
  cameraView: CanonicalViewId;
  rotationCue: RotationCueType;
  insertionDirection: Vec3; // Dominant placement axis for arrows
  attachedChapterIds?: string[]; // Completed modular chapters attached in this step
  note?: string;
}

export interface SubassemblyNode {
  id: string;
  name: string;
  chapterId: string;
  kind: 'snot' | 'cantilever' | 'repeated' | 'explicit';
  partIds: string[];
  instancePartIdGroups: string[][]; // All repeated copies' partIds (index 0 is canonical copy)
  repeatCount: number;
  buildOrientation: Mat3;  // Transform to orient subassembly upright for building
  attachOrientation: Mat3; // Final orientation when attached to main model
  attachDirection: Vec3;   // Direction along which subassembly slides/clips on
  requiresAttachRotation: boolean;
  steps: StepNode[];
}

export interface BuildChapter {
  id: string;
  name: string;
  kind: 'accessory' | 'minifigure' | 'bag' | 'module' | 'final_assembly' | 'main';
  partIds: string[];
  stepIds: string[];
  subassemblyIds: string[];
  continuesFromChapterId?: string;
  repeatCount?: number;
  instancePartIdGroups?: string[][];
  bookletIndex?: number;
}

export type SubdivisionStrategyId =
  | 'none'
  | 'longitudinal_halves'
  | 'structural_modules'
  | 'horizontal_floors'
  | 'numbered_bags'
  | 'spatial_sectors'
  | 'refine_existing';

export type SubdivisionOutputMode =
  | 'modular_chapters'
  | 'numbered_bags'
  | 'multi_booklet';

export interface ProposedSection {
  id: string;
  name: string;
  partIndices: number[];
  partIds: string[];
  repeatPartIndexGroups?: number[][];
  repeatPartIdGroups?: string[][];
  role: 'module' | 'join' | 'bag';
  cutEdgeCount: number;
  attachToSectionId?: string;
  attachNormal?: Vec3;
  explodeOffset: Vec3;
  previewColor: string;
  bookletIndex?: number;
}

export interface SubdivisionAssessment {
  partCount: number;
  spanX: number;
  spanY: number;
  spanZ: number;
  longestSpanLdu: number;
  medianSpanLdu: number;
  aspectRatio: number;
  medianPartDiag: number;
  readabilityRatio: number;
  shouldPrompt: boolean;
  tier: 'compact' | 'borderline' | 'suggest' | 'massive';
  reasons: string[];
}

export interface SubdivisionProposal {
  id: string;
  strategy: SubdivisionStrategyId;
  outputMode: SubdivisionOutputMode;
  title: string;
  rationale: string;
  zoomGainEstimate?: number;
  confidence: number; // 0..100
  sections: ProposedSection[];
  estimatedStepCount: number;
  estimatedPageCount: number;
  hasIdenticalHalves?: boolean;
}

export interface InstructionPlan {
  pacing: PacingPreset;
  importMode: ImportMode;
  chapters: BuildChapter[];
  steps: Record<string, StepNode>;
  subassemblies: Record<string, SubassemblyNode>;
  floatingWarnings: FloatingPartWarning[];
  subdivisionStrategy?: SubdivisionStrategyId;
}

export type PageLayoutTemplate = 'auto' | '1-up' | '2-up' | '3-up' | '4-up';

export interface StepOverride {
  cameraViewOverride?: CanonicalViewId;
  customAzimuthDeg?: number;
  customElevationDeg?: number;
  zoomScale?: number;
  pinPageBreakBefore?: boolean;
  pageLayoutOverride?: Exclude<PageLayoutTemplate, 'auto'>;
  showSubassemblyAttachRotation?: boolean;
  presentationTransforms?: Record<string, PresentationTransform>;
}

export type ThemePresetId =
  | 'classic-lego-blue'
  | 'modern-clean-white'
  | 'dark-collector'
  | 'technical-blueprint';

export type PageSizeId = 'letter' | 'a4' | 'square';
export type PageOrientation = 'landscape' | 'portrait';
export type BackgroundMode = 'solid' | 'gradient' | 'blueprint-grid' | 'image';
export type BomSortMode = 'color-part' | 'quantity-desc' | 'part-id';

export interface ThemeSettings {
  presetId: ThemePresetId;
  pageSize: PageSizeId;
  orientation: PageOrientation;
  defaultLayout: PageLayoutTemplate;
  backgroundMode: BackgroundMode;
  backgroundColor: string;
  backgroundGradientEnd: string;
  backgroundImageDataUrl?: string;
  accentColor: string;
  textColor: string;
  mutedTextColor: string;
  pliBackground: string;
  pliBorderColor: string;
  calloutBackground: string;
  calloutBorderColor: string;
  fontFamily: 'jakarta' | 'space' | 'mono';
  stepNumberScale: number; // 0.8 - 1.5
  showPageNumbers: boolean;
  // 3D Rendering indicators
  highlightNewParts: boolean;
  highlightColor: string;
  highlightIntensity: number; // 0.2 - 1.0
  fadePreviousParts: boolean;
  fadeOpacity: number; // 0.25 - 1.0
  fadeDesaturation: number; // 0 - 1.0
  showEdgeLines: boolean;
  showPlacementArrows: boolean;
  showRotationIndicators: boolean;
}

export interface CoverConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  author: string;
  setNumber: string;
  showPieceCount: boolean;
  showStepCount: boolean;
  heroView: CanonicalViewId;
  customLogoDataUrl?: string;
}

export interface BackConfig {
  enabled: boolean;
  headline: string;
  footerNote: string;
  showCompletionRender: boolean;
  showStatsSummary: boolean;
}

export interface BomConfig {
  enabled: boolean;
  title: string;
  sortMode: BomSortMode;
  columns: number; // 4 - 8
}

export interface BomEntry {
  partId: string;
  partName: string;
  colorId: number;
  quantity: number;
}

export type PageKind = 'cover' | 'section-divider' | 'steps' | 'bom' | 'back';

export interface PageSlot {
  stepId: string;
  chapterId: string;
  subassemblyIds: string[];
}

export interface PagePlan {
  id: string;
  pageNumber: number;
  kind: PageKind;
  chapterId?: string;
  chapterName?: string;
  layout?: Exclude<PageLayoutTemplate, 'auto'>;
  slots?: PageSlot[];
  bomEntries?: BomEntry[];
  bomPageIndex?: number;
  bomTotalPages?: number;
  pinnedStart?: boolean;
}

export interface ReimportDiffReport {
  matchedCount: number;
  addedCount: number;
  removedCount: number;
  preservedOverrideCount: number;
  affectedStepIds: string[];
}

export interface BicProjectFile {
  version: 1;
  savedAt: string;
  model: CanonicalModel;
  plan: InstructionPlan;
  overrides: Record<string, StepOverride>;
  theme: ThemeSettings;
  cover: CoverConfig;
  back: BackConfig;
  bom: BomConfig;
}
