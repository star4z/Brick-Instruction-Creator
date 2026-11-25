/**
 * Official LEGO-Style Callout Craft, Orthogonal/Forked Leader Routing,
 * Chiral Mirrored Subassembly Pairing, Attachment Starbursts, and
 * Curved Yellow Articulation / Motion Arrows.
 *
 * Pure, domain-neutral geometric algorithms shared across Live DOM Preview,
 * PDF / System Print Canvas, and Interactive 3D HTML export.
 */

export interface Rect2D {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface OrthogonalLeaderPath {
  /** Ordered polyline vertices from callout exit edge to the target anchor. */
  points: Point2D[];
  /** Unit direction vector of the final segment entering `target` (for arrowhead orientation). */
  tipDir: Point2D;
}

export interface ChiralPartLike {
  partId: string;
  colorId: number;
  /** Local center position relative to subassembly origin in LDU. */
  pos: [number, number, number];
}

export interface ChiralSubassemblyCandidate {
  id: string;
  parts: ChiralPartLike[];
}

export interface MirroredSubassemblyPair {
  leftId: string;
  rightId: string;
  mirrorAxis: 'x' | 'z';
}

export interface HingeArticulationCue {
  /** World-space pivot point of the articulated subassembly. */
  pivot: [number, number, number];
  /** Hinge rotation axis unit vector. */
  axis: [number, number, number];
  /** Final articulated angle in degrees (15°..165°). */
  angleDeg: number;
  /** Radius of the curved motion arrow in LDU. */
  radius: number;
}

/**
 * Routes clean orthogonal L-shaped or multi-forked leader lines from a callout box
 * (`calloutRect`) to one or more projected 2D target anchor points on the step render.
 *
 * - For 1 target: exits the nearest face of `calloutRect` and routes a single clean
 *   orthogonal elbow directly to the target.
 * - For 2+ targets (e.g. `2×` or `4×` repeated callout): emits a shared trunk from the
 *   callout box to a horizontal/vertical bus line, then branches orthogonally to every
 *   target point (matching 31172 p. 59/99 and 75192 p. 74/107).
 */
export function routeOrthogonalLeaders(
  calloutRect: Rect2D,
  targets: ReadonlyArray<Point2D>,
): OrthogonalLeaderPath[] {
  if (targets.length === 0) return [];

  const cx = calloutRect.x + calloutRect.w / 2;
  const cy = calloutRect.y + calloutRect.h / 2;

  // Determine dominant side of the callout box relative to the targets' centroid
  let avgX = 0;
  let avgY = 0;
  for (const t of targets) {
    avgX += t.x;
    avgY += t.y;
  }
  avgX /= targets.length;
  avgY /= targets.length;

  const dx = avgX - cx;
  const dy = avgY - cy;

  // Choose exit edge: bottom/top if targets are predominantly below/above; else right/left
  const verticalDominant = Math.abs(dy) >= Math.abs(dx) * 0.65;
  const exitBottom = verticalDominant && dy >= 0;
  const exitTop = verticalDominant && dy < 0;
  const exitRight = !verticalDominant && dx >= 0;

  if (targets.length === 1) {
    const t = targets[0];
    if (exitBottom || exitTop) {
      const exitY = exitBottom ? calloutRect.y + calloutRect.h : calloutRect.y;
      // Straight vertical drop if target X falls within the callout horizontal span
      if (t.x >= calloutRect.x + 8 && t.x <= calloutRect.x + calloutRect.w - 8) {
        return [{
          points: [{ x: t.x, y: exitY }, { x: t.x, y: t.y }],
          tipDir: { x: 0, y: exitBottom ? 1 : -1 },
        }];
      }
      // L-elbow: drop vertically from center, then turn horizontally to target
      const elbowY = t.y;
      return [{
        points: [
          { x: cx, y: exitY },
          { x: cx, y: elbowY },
          { x: t.x, y: t.y },
        ],
        tipDir: { x: t.x >= cx ? 1 : -1, y: 0 },
      }];
    } else {
      const exitX = exitRight ? calloutRect.x + calloutRect.w : calloutRect.x;
      if (t.y >= calloutRect.y + 8 && t.y <= calloutRect.y + calloutRect.h - 8) {
        return [{
          points: [{ x: exitX, y: t.y }, { x: t.x, y: t.y }],
          tipDir: { x: exitRight ? 1 : -1, y: 0 },
        }];
      }
      return [{
        points: [
          { x: exitX, y: cy },
          { x: t.x, y: cy },
          { x: t.x, y: t.y },
        ],
        tipDir: { x: 0, y: t.y >= cy ? 1 : -1 },
      }];
    }
  }

  // Multi-target forked orthogonal bus routing
  if (exitBottom || exitTop) {
    const exitY = exitBottom ? calloutRect.y + calloutRect.h : calloutRect.y;
    const nearestTargetY = exitBottom
      ? Math.min(...targets.map((t) => t.y))
      : Math.max(...targets.map((t) => t.y));
    const busY = exitBottom
      ? Math.max(exitY + 8, Math.min(nearestTargetY - 12, exitY + (nearestTargetY - exitY) * 0.45))
      : Math.min(exitY - 8, Math.max(nearestTargetY + 12, exitY + (nearestTargetY - exitY) * 0.45));

    return targets.map((t) => ({
      points: [
        { x: cx, y: exitY },
        { x: cx, y: busY },
        { x: t.x, y: busY },
        { x: t.x, y: t.y },
      ],
      tipDir: { x: 0, y: t.y >= busY ? 1 : -1 },
    }));
  } else {
    const exitX = exitRight ? calloutRect.x + calloutRect.w : calloutRect.x;
    const nearestTargetX = exitRight
      ? Math.min(...targets.map((t) => t.x))
      : Math.max(...targets.map((t) => t.x));
    const busX = exitRight
      ? Math.max(exitX + 8, Math.min(nearestTargetX - 12, exitX + (nearestTargetX - exitX) * 0.45))
      : Math.min(exitX - 8, Math.max(nearestTargetX + 12, exitX + (nearestTargetX - exitX) * 0.45));

    return targets.map((t) => ({
      points: [
        { x: exitX, y: cy },
        { x: busX, y: cy },
        { x: busX, y: t.y },
        { x: t.x, y: t.y },
      ],
      tipDir: { x: t.x >= busX ? 1 : -1, y: 0 },
    }));
  }
}

/**
 * Renders routed orthogonal leader paths as an overlay SVG string with crisp black arrowheads.
 */
export function buildOrthogonalLeadersSvg(
  paths: ReadonlyArray<OrthogonalLeaderPath>,
  width: number,
  height: number,
  opts?: { stroke?: string; strokeWidth?: number; arrowSize?: number },
): string {
  if (paths.length === 0) return '';
  const stroke = opts?.stroke || '#111827';
  const sw = opts?.strokeWidth ?? 1.4;
  const ah = opts?.arrowSize ?? 7;

  const elements: string[] = [];
  for (const p of paths) {
    if (p.points.length < 2) continue;
    const last = p.points[p.points.length - 1];
    // Pull polyline end back slightly so the crisp arrowhead tip lands cleanly at `last`
    const pts = p.points.map((pt, idx) => {
      if (idx === p.points.length - 1) {
        return `${(pt.x - p.tipDir.x * (ah * 0.65)).toFixed(1)},${(pt.y - p.tipDir.y * (ah * 0.65)).toFixed(1)}`;
      }
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    });
    elements.push(
      `<polyline points="${pts.join(' ')}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="square" stroke-linejoin="miter"/>`,
    );
    // Crisp triangular arrowhead
    const px = -p.tipDir.y;
    const py = p.tipDir.x;
    const baseX = last.x - p.tipDir.x * ah;
    const baseY = last.y - p.tipDir.y * ah;
    const wing = ah * 0.44;
    const p1 = `${last.x.toFixed(1)},${last.y.toFixed(1)}`;
    const p2 = `${(baseX + px * wing).toFixed(1)},${(baseY + py * wing).toFixed(1)}`;
    const p3 = `${(baseX - px * wing).toFixed(1)},${(baseY - py * wing).toFixed(1)}`;
    elements.push(`<polygon points="${p1} ${p2} ${p3}" fill="${stroke}"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" class="pointer-events-none" aria-hidden="true">${elements.join('')}</svg>`;
}

/**
 * Draws routed orthogonal leader paths directly onto a 2D Canvas (PDF export).
 */
export function drawOrthogonalLeadersCanvas(
  ctx: CanvasRenderingContext2D,
  paths: ReadonlyArray<OrthogonalLeaderPath>,
  opts?: { stroke?: string; strokeWidth?: number; arrowSize?: number },
): void {
  if (paths.length === 0) return;
  const stroke = opts?.stroke || '#111827';
  const sw = opts?.strokeWidth ?? 1.6;
  const ah = opts?.arrowSize ?? 9;

  ctx.save();
  ctx.strokeStyle = stroke;
  ctx.fillStyle = stroke;
  ctx.lineWidth = sw;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'miter';

  for (const p of paths) {
    if (p.points.length < 2) continue;
    const last = p.points[p.points.length - 1];
    ctx.beginPath();
    ctx.moveTo(p.points[0].x, p.points[0].y);
    for (let i = 1; i < p.points.length - 1; i++) {
      ctx.lineTo(p.points[i].x, p.points[i].y);
    }
    ctx.lineTo(last.x - p.tipDir.x * (ah * 0.65), last.y - p.tipDir.y * (ah * 0.65));
    ctx.stroke();

    const px = -p.tipDir.y;
    const py = p.tipDir.x;
    const baseX = last.x - p.tipDir.x * ah;
    const baseY = last.y - p.tipDir.y * ah;
    const wing = ah * 0.44;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(baseX + px * wing, baseY + py * wing);
    ctx.lineTo(baseX - px * wing, baseY - py * wing);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Quantized structural signature of a subassembly under an optional mirror reflection
 * (`mirrorAxis: null | 'x' | 'z'`) and 90° Y-rotations (`rot90: 0..3`).
 */
function buildCenteredSignature(
  parts: ReadonlyArray<ChiralPartLike>,
  mirrorAxis: null | 'x' | 'z',
  rot90: 0 | 1 | 2 | 3,
): string {
  if (parts.length === 0) return '';
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (const p of parts) {
    cx += p.pos[0];
    cy += p.pos[1];
    cz += p.pos[2];
  }
  cx /= parts.length;
  cy /= parts.length;
  cz /= parts.length;

  const cos = rot90 === 0 ? 1 : rot90 === 1 ? 0 : rot90 === 2 ? -1 : 0;
  const sin = rot90 === 0 ? 0 : rot90 === 1 ? 1 : rot90 === 2 ? 0 : -1;

  const tokens = parts.map((p) => {
    let x = p.pos[0] - cx;
    const y = p.pos[1] - cy;
    let z = p.pos[2] - cz;
    if (mirrorAxis === 'x') x = -x;
    else if (mirrorAxis === 'z') z = -z;
    const rx = x * cos - z * sin;
    const rz = x * sin + z * cos;
    const qx = Math.round(rx / 4);
    const qy = Math.round(y / 4);
    const qz = Math.round(rz / 4);
    return `${p.partId}:${p.colorId}:${qx},${qy},${qz}`;
  });
  tokens.sort();
  return tokens.join('|');
}

/**
 * Detects pairs of chiral (mirror-symmetric, non-rotationally-identical) subassemblies
 * so they can be paired side-by-side in a single step sharing a consolidated `2×` PLI
 * (matching 75192 p. 459 Step 1375).
 */
export function detectMirroredSubassemblyPairs(
  candidates: ReadonlyArray<ChiralSubassemblyCandidate>,
): MirroredSubassemblyPair[] {
  const pairs: MirroredSubassemblyPair[] = [];
  const used = new Set<string>();

  for (let i = 0; i < candidates.length; i++) {
    const a = candidates[i];
    if (used.has(a.id) || a.parts.length < 2) continue;

    // Precompute A's rigid rotational signatures (if B matches any of these, it's identical, not chiral)
    const aRotSigs = new Set<string>([
      buildCenteredSignature(a.parts, null, 0),
      buildCenteredSignature(a.parts, null, 1),
      buildCenteredSignature(a.parts, null, 2),
      buildCenteredSignature(a.parts, null, 3),
    ]);
    const aMirrorXSigs = new Set<string>([
      buildCenteredSignature(a.parts, 'x', 0),
      buildCenteredSignature(a.parts, 'x', 1),
      buildCenteredSignature(a.parts, 'x', 2),
      buildCenteredSignature(a.parts, 'x', 3),
    ]);
    const aMirrorZSigs = new Set<string>([
      buildCenteredSignature(a.parts, 'z', 0),
      buildCenteredSignature(a.parts, 'z', 1),
      buildCenteredSignature(a.parts, 'z', 2),
      buildCenteredSignature(a.parts, 'z', 3),
    ]);

    for (let j = i + 1; j < candidates.length; j++) {
      const b = candidates[j];
      if (used.has(b.id) || b.parts.length !== a.parts.length) continue;

      const bSig0 = buildCenteredSignature(b.parts, null, 0);
      if (aRotSigs.has(bSig0)) continue; // Rigidly identical (handled by `2×` repeat), not chiral

      if (aMirrorXSigs.has(bSig0)) {
        used.add(a.id);
        used.add(b.id);
        pairs.push({ leftId: a.id, rightId: b.id, mirrorAxis: 'x' });
        break;
      }
      if (aMirrorZSigs.has(bSig0)) {
        used.add(a.id);
        used.add(b.id);
        pairs.push({ leftId: a.id, rightId: b.id, mirrorAxis: 'z' });
        break;
      }
    }
  }

  return pairs;
}

/**
 * Returns true when a standalone submodel/subassembly sequence should show a soft-opacity
 * ghost preview card of the finished subassembly above the PLI (matching 31172 p. 99).
 */
export function shouldShowGhostSubmodelPreview(stepCount: number, isSubmodelSequence: boolean): boolean {
  return isSubmodelSequence && stepCount >= 2;
}

/**
 * Builds a subtle radiant white starburst SVG to sit behind a newly attached subassembly
 * (matching 31172 p. 30 & p. 103).
 */
export function buildAttachmentStarburstSvg(
  sizePx = 160,
  opts?: { color?: string; rays?: number },
): string {
  const s = Math.max(48, Math.round(sizePx));
  const c = s / 2;
  const rays = opts?.rays ?? 14;
  const color = opts?.color || '#ffffff';
  const rInner = s * 0.14;
  const rOuter = s * 0.49;

  const polygons: string[] = [];
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 0.46) / rays) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const x0 = c + Math.cos(a0) * rInner;
    const y0 = c + Math.sin(a0) * rInner;
    const x1 = c + Math.cos(a1) * rInner;
    const y1 = c + Math.sin(a1) * rInner;
    const x2 = c + Math.cos(am) * rOuter;
    const y2 = c + Math.sin(am) * rOuter;
    polygons.push(
      `<polygon points="${x0.toFixed(1)},${y0.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x1.toFixed(1)},${y1.toFixed(1)}" fill="${color}" fill-opacity="0.52"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" class="pointer-events-none" aria-hidden="true"><defs><radialGradient id="sbGrad" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${color}" stop-opacity="0.72"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></radialGradient></defs><circle cx="${c}" cy="${c}" r="${rOuter.toFixed(1)}" fill="url(#sbGrad)"/>${polygons.join('')}</svg>`;
}

/**
 * Draws a subtle radiant white starburst onto a 2D Canvas (PDF export).
 */
export function drawAttachmentStarburstCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  opts?: { color?: string; rays?: number },
): void {
  const rays = opts?.rays ?? 14;
  const color = opts?.color || '#ffffff';
  const rInner = radius * 0.22;

  ctx.save();
  const grad = ctx.createRadialGradient(cx, cy, rInner * 0.5, cx, cy, radius);
  grad.addColorStop(0, 'rgba(255,255,255,0.68)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.45;
  for (let i = 0; i < rays; i++) {
    const a0 = (i / rays) * Math.PI * 2;
    const a1 = ((i + 0.44) / rays) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * rInner, cy + Math.sin(a0) * rInner);
    ctx.lineTo(cx + Math.cos(am) * radius, cy + Math.sin(am) * radius);
    ctx.lineTo(cx + Math.cos(a1) * rInner, cy + Math.sin(a1) * rInner);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Builds an official-style curved segmented yellow motion arrow SVG (matching 31172 p. 104
 * and 75192 p. 107 Step 223) for hinge folding / play-feature rotation cues.
 */
export function buildCurvedMotionArrowSvg(
  sizePx = 44,
  direction: 'cw' | 'ccw' = 'cw',
  opts?: { fill?: string; stroke?: string },
): string {
  const s = Math.max(24, Math.round(sizePx));
  const fill = opts?.fill || '#facc15';
  const stroke = opts?.stroke || '#1e293b';
  const flip = direction === 'ccw' ? ` transform="translate(${s},0) scale(-1,1)"` : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 44 44" class="pointer-events-none" aria-hidden="true"><g${flip}><path d="M8 29 A16 16 0 0 1 28 11 L28 6 L38 14.5 L28 23 L28 18 A9 9 0 0 0 15 29 Z" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round"/><line x1="12.5" y1="22.5" x2="17" y2="25" stroke="${stroke}" stroke-width="1.2"/><line x1="17.5" y1="16.5" x2="20.5" y2="20.5" stroke="${stroke}" stroke-width="1.2"/></g></svg>`;
}

/**
 * Draws a curved segmented yellow motion arrow onto a 2D Canvas (PDF export).
 */
export function drawCurvedMotionArrowCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  direction: 'cw' | 'ccw' = 'cw',
  opts?: { fill?: string; stroke?: string },
): void {
  const fill = opts?.fill || '#facc15';
  const stroke = opts?.stroke || '#1e293b';
  const sign = direction === 'ccw' ? -1 : 1;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(sign, 1);
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1.2, radius * 0.08);
  ctx.lineJoin = 'round';

  const rOuter = radius;
  const rInner = radius * 0.56;
  const startA = Math.PI * 0.92;
  const endA = -Math.PI * 0.25;

  ctx.beginPath();
  ctx.arc(0, 0, rOuter, startA, endA, false);
  const tipX = Math.cos(endA + 0.34) * (rOuter * 0.84);
  const tipY = Math.sin(endA + 0.34) * (rOuter * 0.84);
  const outerWingX = Math.cos(endA) * (rOuter * 1.24);
  const outerWingY = Math.sin(endA) * (rOuter * 1.24);
  const innerWingX = Math.cos(endA) * (rInner * 0.72);
  const innerWingY = Math.sin(endA) * (rInner * 0.72);
  ctx.lineTo(outerWingX, outerWingY);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(innerWingX, innerWingY);
  ctx.arc(0, 0, rInner, endA, startA, true);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/**
 * Detects whether a subassembly or part's 3×3 rotation matrix represents a non-orthogonal
 * articulated hinge angle (`15°..165°` from canonical grid axes), warranting an optional
 * fold-into-place articulation cue.
 */
export function detectNonOrthogonalArticulationAngle(rotMat3x3: ReadonlyArray<number>): number | null {
  if (!rotMat3x3 || rotMat3x3.length < 9) return null;
  // Check the local Y-axis (up) and local X-axis against canonical axes
  const axes = [
    [rotMat3x3[0], rotMat3x3[3], rotMat3x3[6]],
    [rotMat3x3[1], rotMat3x3[4], rotMat3x3[7]],
    [rotMat3x3[2], rotMat3x3[5], rotMat3x3[8]],
  ];
  let bestTiltDeg = 0;
  for (const ax of axes) {
    const len = Math.hypot(ax[0], ax[1], ax[2]);
    if (len < 1e-4) continue;
    const maxCard = Math.max(Math.abs(ax[0]), Math.abs(ax[1]), Math.abs(ax[2])) / len;
    const angleDeg = (Math.acos(Math.max(-1, Math.min(1, maxCard))) * 180) / Math.PI;
    if (angleDeg > bestTiltDeg) bestTiltDeg = angleDeg;
  }
  if (bestTiltDeg >= 14 && bestTiltDeg <= 76) {
    return Math.round(bestTiltDeg);
  }
  return null;
}
