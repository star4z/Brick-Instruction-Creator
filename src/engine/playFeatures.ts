/**
 * Official LEGO-Style Play-Feature Demonstration Page Planner & Motion Glyph Renderers.
 *
 * Inspired by Creator 3-in-1 Record Player (#31172 p. 103) and Ideas Saturn V (#92176 p. 4, 13):
 *   - Purely geometric & physical feature detection (zero model-specific heuristics):
 *     1. Articulated / hinged parts (non-orthogonal rotation matrices, hinges, clips, turntables)
 *     2. Rotating / spinning mechanisms (wheels, gears, axles, rotors, turntables)
 *     3. Detachable / modular sub-sections (2+ distinct submodels or multi-floor sections)
 *     4. Multi-angle display showcase fallback (ensuring every model gets a rich 2–3 panel spread)
 *   - Renders bold official yellow-with-charcoal-outline motion arrows (`hinge`, `rotate`, `detach`, `view`)
 *     in both SVG (Live DOM & Interactive HTML) and Canvas 2D (PDF Export).
 */

export type PlayFeatureKind = 'hinge' | 'rotate' | 'detach' | 'view';

export interface PlayFeaturePanel {
  id: string;
  kind: PlayFeatureKind;
  label: string;
  /** Recommended camera azimuth (degrees) to showcase this feature clearly. */
  az: number;
  /** Recommended camera elevation (degrees). */
  el: number;
  /** Optional part IDs participating in this play feature (for highlight/framing). */
  partIds: string[];
}

export interface PlayFeaturePartInput {
  id: string;
  partId: string;
  title: string;
  /** Optional 3×3 row-major rotation matrix. */
  m?: ReadonlyArray<number>;
}

export interface PlayFeatureChapterInput {
  id: string;
  kind?: string;
  name?: string;
  isSectionModule?: boolean;
}

const ROTATE_RE = /\b(wheel|tire|tyre|gear|turntable|propeller|rotor|axle|pulley|steering)\b/i;
const HINGE_RE = /\b(hinge|clip|ball\s*joint|socket|bar\s*holder|door|hatch|lid|wing|arm)\b/i;

function hasNonOrthogonalRotation(m?: ReadonlyArray<number>): boolean {
  if (!m || m.length < 9) return false;
  for (let i = 0; i < 9; i++) {
    const a = Math.abs(m[i]);
    if (a > 0.08 && Math.abs(a - 1) > 0.08) return true;
  }
  return false;
}

/**
 * Purely geometric/physical detector returning 2–3 demonstration panels for the
 * Play Features page placed right before Build Complete.
 */
export function detectPlayFeaturePanels(
  parts: ReadonlyArray<PlayFeaturePartInput>,
  chapters: ReadonlyArray<PlayFeatureChapterInput> = [],
): PlayFeaturePanel[] {
  const panels: PlayFeaturePanel[] = [];

  const hingedIds = parts
    .filter((p) => hasNonOrthogonalRotation(p.m) || HINGE_RE.test(p.title || ''))
    .map((p) => p.id);
  if (hingedIds.length > 0) {
    panels.push({
      id: 'pf_hinge',
      kind: 'hinge',
      label: 'Articulated Motion',
      az: 35,
      el: 26,
      partIds: hingedIds.slice(0, 24),
    });
  }

  const rotatingIds = parts
    .filter((p) => ROTATE_RE.test(p.title || ''))
    .map((p) => p.id);
  if (rotatingIds.length > 0) {
    panels.push({
      id: 'pf_rotate',
      kind: 'rotate',
      label: 'Spinning & Rolling',
      az: -40,
      el: 24,
      partIds: rotatingIds.slice(0, 24),
    });
  }

  const subSections = chapters.filter(
    (c) => c.kind === 'submodel' || c.isSectionModule,
  );
  if (subSections.length >= 2) {
    panels.push({
      id: 'pf_detach',
      kind: 'detach',
      label: 'Modular Sections',
      az: 135,
      el: 30,
      partIds: [],
    });
  }

  // Always ensure at least 2 visually balanced showcase panels
  if (panels.length === 0) {
    panels.push({
      id: 'pf_front',
      kind: 'view',
      label: 'Front 3/4 View',
      az: 38,
      el: 24,
      partIds: [],
    });
  }
  if (panels.length < 2) {
    panels.push({
      id: 'pf_rear',
      kind: 'view',
      label: 'Alternate Angle',
      az: -140,
      el: 26,
      partIds: [],
    });
  }

  return panels.slice(0, 3);
}

/**
 * Renders an official-style bold yellow-with-dark-outline play-feature motion arrow SVG.
 */
export function buildPlayFeatureArrowSvg(
  kind: PlayFeatureKind,
  sizePx = 46,
): string {
  const s = Math.max(24, Math.round(sizePx));
  const fill = '#facc15';
  const stroke = '#0f172a';
  if (kind === 'rotate') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" aria-label="Spinning motion">` +
      `<path d="M12 24 A12 12 0 1 1 32 33" fill="none" stroke="${stroke}" stroke-width="6.5" stroke-linecap="round"/>` +
      `<path d="M12 24 A12 12 0 1 1 32 33" fill="none" stroke="${fill}" stroke-width="3.6" stroke-linecap="round"/>` +
      `<polygon points="36,36 27,36 33,28" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `</svg>`;
  }
  if (kind === 'hinge') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" aria-label="Hinged articulation">` +
      `<path d="M11 33 Q24 8 37 22" fill="none" stroke="${stroke}" stroke-width="6.5" stroke-linecap="round"/>` +
      `<path d="M11 33 Q24 8 37 22" fill="none" stroke="${fill}" stroke-width="3.6" stroke-linecap="round"/>` +
      `<polygon points="40,26 31,24 37,16" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `<polygon points="8,37 9,28 16,34" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>` +
      `</svg>`;
  }
  if (kind === 'detach') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" aria-label="Detachable modular section">` +
      `<path d="M24 10 L33 20 H27 V28 H33 L24 38 L15 28 H21 V20 H15 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `</svg>`;
  }
  // 'view': subtle 360° display showcase badge
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 48 48" aria-label="Display angle">` +
    `<path d="M10 24 A14 8 0 0 1 38 24" fill="none" stroke="${stroke}" stroke-width="5.2" stroke-linecap="round"/>` +
    `<path d="M10 24 A14 8 0 0 1 38 24" fill="none" stroke="${fill}" stroke-width="2.8" stroke-linecap="round"/>` +
    `<polygon points="40,26 33,24 37,19" fill="${fill}" stroke="${stroke}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `</svg>`;
}

/**
 * Canvas 2D renderer for play-feature motion arrows (PDF export parity).
 */
export function drawPlayFeatureArrowCanvas(
  ctx: CanvasRenderingContext2D,
  kind: PlayFeatureKind,
  cx: number,
  cy: number,
  size = 42,
): void {
  const r = size * 0.34;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'detach') {
    const hw = size * 0.14;
    const ah = size * 0.28;
    const tip = size * 0.42;
    ctx.beginPath();
    ctx.moveTo(0, -tip);
    ctx.lineTo(ah, -tip + ah);
    ctx.lineTo(hw, -tip + ah);
    ctx.lineTo(hw, tip - ah);
    ctx.lineTo(ah, tip - ah);
    ctx.lineTo(0, tip);
    ctx.lineTo(-ah, tip - ah);
    ctx.lineTo(-hw, tip - ah);
    ctx.lineTo(-hw, -tip + ah);
    ctx.lineTo(-ah, -tip + ah);
    ctx.closePath();
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  } else {
    const startA = kind === 'rotate' ? Math.PI * 0.85 : Math.PI * 1.1;
    const endA = kind === 'rotate' ? Math.PI * 2.35 : Math.PI * 1.9;
    ctx.beginPath();
    ctx.arc(0, 0, r, startA, endA);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    const tx = Math.cos(endA) * r;
    const ty = Math.sin(endA) * r;
    ctx.beginPath();
    ctx.arc(tx, ty, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}
