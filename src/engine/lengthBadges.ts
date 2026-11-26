/**
 * Official LEGO-Style Length Badges, True-Scale 1:1 Orthographic Silhouettes,
 * and 1:1 Coaxial Assembly-Position Callouts.
 *
 * Pure, domain-neutral geometric helpers shared across Live DOM Preview,
 * PDF / System Print Canvas, and Interactive 3D HTML export:
 *   - Circled `(N)` badges for cylindrical/cross-section axles & bars (including fractional lengths like `3.2`).
 *   - Squared `[N]` badges for Technic liftarms, beams, and perforated Technic bricks/plates.
 *   - True-scale orthographic SVG & Canvas 2D silhouettes (fluted cross-axles, rounded bars, N-hole liftarms).
 *   - Coaxial assembly-position detection (`detectCoaxialPositionCallout`) for gears/bushes/collars
 *     mounted partway along an axle or bar (rendering a 1:1 positional depth callout).
 */

export type LengthBadgeShape = 'circle' | 'square';
export type LengthGuideKind = 'axle' | 'bar' | 'liftarm' | 'technic_brick';

export interface PartLengthBadge {
  /** Length in studs (L), e.g. 3, 4, 5, 6, 3.2, 6.6. */
  lengthL: number;
  /** Formatted numeral string, e.g. "4", "3.2", "5". */
  label: string;
  /** Circled `(N)` for axles/bars; squared `[N]` for liftarms/beams. */
  shape: LengthBadgeShape;
  kind: LengthGuideKind;
  /** True physical length in millimeters (`lengthL * 8.0 mm`). */
  mm: number;
}

export interface CoaxialPartSnapshot {
  id: string;
  title: string;
  colorHex: string;
  box: {
    min: [number, number, number];
    max: [number, number, number];
    center: [number, number, number];
  };
}

export interface CoaxialPositionCallout {
  axlePartId: string;
  collarPartId: string;
  axleLengthL: number;
  axleLabel: string;
  axleKind: 'axle' | 'bar';
  axleColorHex: string;
  collarColorHex: string;
  collarKind: 'gear' | 'bush' | 'collar';
  /** Normalized 0..1 position of the collar center along the axle (from near end = 0 to far end = 1). */
  positionRatio: number;
  /** Physical distance from the near axle end to the collar center in mm. */
  offsetFromEndMm: number;
  /** Total physical length of the axle in mm. */
  axleLengthMm: number;
  /** Physical thickness of the collar along the axle in mm. */
  collarThicknessMm: number;
}

const MM_PER_STUD = 8.0;

/**
 * Classifies an LDraw part title (and optional partId) into an official LEGO
 * length badge (`(N)` circle for axles/bars, `[N]` square for liftarms/beams).
 * Returns `null` when the part does not warrant a length badge.
 */
export function classifyPartLengthBadge(title: string, partId = ''): PartLengthBadge | null {
  if (!title) return null;
  const t = String(title).trim();
  const id = String(partId || '').toLowerCase();

  // 1. Technic Axles (exclude axle-hole bricks/connectors/wheels/hubs/gears)
  if (
    /\baxle\b/i.test(t) &&
    !/hole|brick|plate|wheel|connector|hub|frame|beam|liftarm|bush|gear|cam|holder|steering|pin\s+with|with\s+pin|towing|towball|fork|shock|motor|turntable|differential|portal/i.test(t)
  ) {
    const m = t.match(/\baxle\s+(\d+(?:\.\d+)?)\b/i) || t.match(/\b(\d+(?:\.\d+)?)L\b/i);
    if (m) {
      const lengthL = parseFloat(m[1]);
      if (Number.isFinite(lengthL) && lengthL >= 2 && lengthL <= 32) {
        return {
          lengthL,
          label: formatLengthNumeral(lengthL),
          shape: 'circle',
          kind: 'axle',
          mm: lengthL * MM_PER_STUD,
        };
      }
    }
  }

  // 2. Bars / Rods / Hose Rigid (circled numeral, supports fractional like 3.2L, 6.6L)
  if (
    (/\b(?:bar|rod|hose\s+rigid)\b/i.test(t) || id === '30374' || id === '4095' || id === '63965') &&
    !/holder|clip|plate|brick|tile|handle|hinge|grille|fence|ladder|door|window|frame|minifig/i.test(t)
  ) {
    const m = t.match(/\b(?:bar|rod|hose\s+rigid)[^0-9]*?(\d+(?:\.\d+)?)L?\b/i) || t.match(/\b(\d+(?:\.\d+)?)L\b/i);
    if (m) {
      const lengthL = parseFloat(m[1]);
      if (Number.isFinite(lengthL) && lengthL >= 2 && lengthL <= 32) {
        return {
          lengthL,
          label: formatLengthNumeral(lengthL),
          shape: 'circle',
          kind: 'bar',
          mm: lengthL * MM_PER_STUD,
        };
      }
    }
  }

  // 3. Technic Liftarms & Straight Beams (squared numeral `[N]`)
  if (/\b(?:liftarm|technic\s+beam)\b/i.test(t) && !/bent|triangle|frame|thin\s+1\s*x\s*2/i.test(t)) {
    const m = t.match(/1\s*x\s*(\d+)/i);
    if (m) {
      const lengthL = parseInt(m[1], 10);
      if (Number.isFinite(lengthL) && lengthL >= 3 && lengthL <= 16) {
        return {
          lengthL,
          label: String(lengthL),
          shape: 'square',
          kind: 'liftarm',
          mm: lengthL * MM_PER_STUD,
        };
      }
    }
  }

  // 4. Technic Bricks / Perforated Plates `1 x N` (squared numeral `[N]` for length >= 4)
  if (/\btechnic[,\s]+(?:brick|plate)\b/i.test(t)) {
    const m = t.match(/1\s*x\s*(\d+)/i);
    if (m) {
      const lengthL = parseInt(m[1], 10);
      if (Number.isFinite(lengthL) && lengthL >= 4 && lengthL <= 16) {
        return {
          lengthL,
          label: String(lengthL),
          shape: 'square',
          kind: 'technic_brick',
          mm: lengthL * MM_PER_STUD,
        };
      }
    }
  }

  return null;
}

function formatLengthNumeral(lengthL: number): string {
  if (Math.abs(lengthL - Math.round(lengthL)) < 0.01) return String(Math.round(lengthL));
  return Number(lengthL.toFixed(1)).toString();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Builds an inline SVG for a circled `(N)` or squared `[N]` length badge.
 */
export function buildLengthBadgeSvg(
  badge: PartLengthBadge,
  sizePx = 18,
  opts?: { bg?: string; fg?: string; border?: string },
): string {
  const s = Math.max(12, Math.round(sizePx));
  const bg = opts?.bg || '#ffffff';
  const fg = opts?.fg || '#0f172a';
  const border = opts?.border || '#1e293b';
  const isWide = badge.label.length >= 3;
  const w = isWide ? Math.round(s * 1.38) : s;
  const fontSize = badge.label.length >= 3 ? s * 0.48 : badge.label.length === 2 ? s * 0.54 : s * 0.62;
  const shapeSvg = badge.shape === 'circle'
    ? (isWide
        ? `<rect x="1" y="1" width="${w - 2}" height="${s - 2}" rx="${(s - 2) / 2}" fill="${bg}" stroke="${border}" stroke-width="1.35"/>`
        : `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 1}" fill="${bg}" stroke="${border}" stroke-width="1.35"/>`)
    : `<rect x="1" y="1" width="${w - 2}" height="${s - 2}" rx="${Math.max(1.5, s * 0.14).toFixed(1)}" fill="${bg}" stroke="${border}" stroke-width="1.35"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${s}" viewBox="0 0 ${w} ${s}" class="inline-block align-middle shrink-0" aria-hidden="true">${shapeSvg}<text x="${w / 2}" y="${s / 2 + fontSize * 0.35}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="${fontSize.toFixed(1)}" fill="${fg}">${escapeXml(badge.label)}</text></svg>`;
}

/**
 * Draws a circled `(N)` or squared `[N]` length badge directly onto a 2D Canvas (PDF export).
 */
export function drawLengthBadgeCanvas(
  ctx: CanvasRenderingContext2D,
  badge: PartLengthBadge,
  cx: number,
  cy: number,
  sizePx: number,
  opts?: { bg?: string; fg?: string; border?: string },
): number {
  const s = Math.max(10, sizePx);
  const bg = opts?.bg || '#ffffff';
  const fg = opts?.fg || '#0f172a';
  const border = opts?.border || '#1e293b';
  const isWide = badge.label.length >= 3;
  const w = isWide ? s * 1.38 : s;
  const r = badge.shape === 'circle' ? s / 2 : Math.max(2, s * 0.14);

  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = Math.max(1, s * 0.075);
  ctx.beginPath();
  if (badge.shape === 'circle' && !isWide) {
    ctx.arc(cx, cy, s / 2 - ctx.lineWidth * 0.5, 0, Math.PI * 2);
  } else {
    const x = cx - w / 2;
    const y = cy - s / 2;
    ctx.roundRect(x, y, w, s, r);
  }
  ctx.fill();
  ctx.stroke();

  const fontSize = badge.label.length >= 3 ? s * 0.48 : badge.label.length === 2 ? s * 0.54 : s * 0.62;
  ctx.fillStyle = fg;
  ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge.label, cx, cy + fontSize * 0.04);
  ctx.restore();
  return w;
}

/**
 * Computes perceived luminance (0..255) from a hex color string to choose crisp
 * dark-vs-light internal detail lines on 1:1 orthographic silhouettes.
 */
export function hexLuminance255(hex: string): number {
  const h = (hex || '#64748b').replace('#', '');
  const full = h.length === 3 ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : h.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Builds a true-scale orthographic SVG silhouette for an axle, bar, or N-hole liftarm/beam.
 */
export function build1to1SilhouetteSvg(
  badge: PartLengthBadge,
  widthPx: number,
  heightPx: number,
  colorHex: string,
): string {
  const w = Math.max(18, Math.round(widthPx));
  const h = Math.max(8, Math.round(heightPx));
  const fill = colorHex || '#475569';
  const isDark = hexLuminance255(fill) < 62;
  const stroke = isDark ? '#cbd5e1' : '#1e293b';
  const innerStroke = isDark ? 'rgba(226,232,240,0.68)' : 'rgba(15,23,42,0.58)';

  if (badge.kind === 'liftarm' || badge.kind === 'technic_brick') {
    const holes = Math.max(2, Math.min(16, Math.round(badge.lengthL)));
    const rOuter = badge.kind === 'liftarm' ? h * 0.48 : Math.min(2, h * 0.16);
    const holeR = Math.max(1.8, Math.min(h * 0.31, (w / holes) * 0.33));
    const holeCircles: string[] = [];
    for (let i = 0; i < holes; i++) {
      const hx = ((i + 0.5) / holes) * w;
      holeCircles.push(
        `<circle cx="${hx.toFixed(1)}" cy="${(h / 2).toFixed(1)}" r="${holeR.toFixed(1)}" fill="#ffffff" fill-opacity="0.88" stroke="${stroke}" stroke-width="1"/>`,
      );
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="block shrink-0" aria-hidden="true"><rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="${rOuter.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>${holeCircles.join('')}</svg>`;
  }

  if (badge.kind === 'axle') {
    // Fluted cross-section Technic axle with crisp top/mid/bottom ridge lines
    const yMid1 = (h * 0.36).toFixed(1);
    const yMid2 = (h * 0.64).toFixed(1);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="block shrink-0" aria-hidden="true"><rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="${Math.min(2.2, h * 0.22).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="1.1"/><line x1="2" y1="${yMid1}" x2="${w - 2}" y2="${yMid1}" stroke="${innerStroke}" stroke-width="0.9"/><line x1="2" y1="${yMid2}" x2="${w - 2}" y2="${yMid2}" stroke="${innerStroke}" stroke-width="0.9"/></svg>`;
  }

  // Smooth cylindrical bar / rod
  const rBar = Math.min(h * 0.45, 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="block shrink-0" aria-hidden="true"><rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="${rBar.toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="1.1"/><line x1="3" y1="${(h * 0.34).toFixed(1)}" x2="${w - 3}" y2="${(h * 0.34).toFixed(1)}" stroke="rgba(255,255,255,0.45)" stroke-width="1"/></svg>`;
}

/**
 * Draws a true-scale orthographic silhouette for an axle, bar, or N-hole liftarm on a 2D Canvas.
 */
export function draw1to1SilhouetteCanvas(
  ctx: CanvasRenderingContext2D,
  badge: PartLengthBadge,
  x: number,
  y: number,
  w: number,
  h: number,
  colorHex: string,
): void {
  const fill = colorHex || '#475569';
  const isDark = hexLuminance255(fill) < 62;
  const stroke = isDark ? '#cbd5e1' : '#1e293b';
  const innerStroke = isDark ? 'rgba(226,232,240,0.68)' : 'rgba(15,23,42,0.58)';

  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, h * 0.09);

  if (badge.kind === 'liftarm' || badge.kind === 'technic_brick') {
    const holes = Math.max(2, Math.min(16, Math.round(badge.lengthL)));
    const rOuter = badge.kind === 'liftarm' ? h * 0.48 : Math.min(3, h * 0.16);
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, rOuter);
    ctx.fill();
    ctx.stroke();

    const holeR = Math.max(2, Math.min(h * 0.31, (w / holes) * 0.33));
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    ctx.strokeStyle = stroke;
    ctx.lineWidth = Math.max(0.9, h * 0.075);
    for (let i = 0; i < holes; i++) {
      const hx = x + ((i + 0.5) / holes) * w;
      ctx.beginPath();
      ctx.arc(hx, y + h / 2, holeR, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  const r = badge.kind === 'bar' ? Math.min(h * 0.45, 5) : Math.min(h * 0.22, 3);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  if (badge.kind === 'axle') {
    ctx.strokeStyle = innerStroke;
    ctx.lineWidth = Math.max(0.8, h * 0.08);
    ctx.beginPath();
    ctx.moveTo(x + 2, y + h * 0.36);
    ctx.lineTo(x + w - 2, y + h * 0.36);
    ctx.moveTo(x + 2, y + h * 0.64);
    ctx.lineTo(x + w - 2, y + h * 0.64);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = Math.max(0.8, h * 0.1);
    ctx.beginPath();
    ctx.moveTo(x + 3, y + h * 0.34);
    ctx.lineTo(x + w - 3, y + h * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Pure geometric detector for 1:1 Coaxial Assembly-Position Callouts:
 * detects when a step mounts a gear, bush, or collar partway along a Technic axle or bar
 * (not flush at either end), so a 1:1 positional callout shows exact stop depth (like 31172 p. 29).
 */
export function detectCoaxialPositionCallout(
  stepParts: ReadonlyArray<CoaxialPartSnapshot>,
  prevParts: ReadonlyArray<CoaxialPartSnapshot>,
): CoaxialPositionCallout | null {
  if (stepParts.length === 0) return null;
  const allParts = [...stepParts, ...prevParts];

  const isCollarLike = (t: string): 'gear' | 'bush' | 'collar' | null => {
    if (/\bgear\b/i.test(t)) return 'gear';
    if (/\bbush\b/i.test(t)) return 'bush';
    if (/\b(?:pulley|cam|collar|ring|disc|wheel\s+hub|steering\s+arm|connector)\b/i.test(t)) return 'collar';
    return null;
  };

  for (const part of stepParts) {
    const collarKind = isCollarLike(part.title);
    if (!collarKind) continue;

    // Look for a touching coaxial axle or bar (either newly added in this step or already present)
    for (const candidate of allParts) {
      if (candidate.id === part.id) continue;
      const badge = classifyPartLengthBadge(candidate.title);
      if (!badge || (badge.kind !== 'axle' && badge.kind !== 'bar') || badge.lengthL < 3) continue;

      const s = [
        Math.max(1, candidate.box.max[0] - candidate.box.min[0]),
        Math.max(1, candidate.box.max[1] - candidate.box.min[1]),
        Math.max(1, candidate.box.max[2] - candidate.box.min[2]),
      ];
      // Identify the axle's dominant longitudinal axis
      let axis: 0 | 1 | 2 = 0;
      if (s[1] >= s[0] && s[1] >= s[2]) axis = 1;
      else if (s[2] >= s[0] && s[2] >= s[1]) axis = 2;

      const axleSpan = s[axis];
      if (axleSpan < 48) continue; // at least ~2.5L

      // Verify coaxial alignment on the two perpendicular axes
      let coaxial = true;
      for (let k = 0; k < 3; k++) {
        if (k === axis) continue;
        if (Math.abs(part.box.center[k] - candidate.box.center[k]) > 14) {
          coaxial = false;
          break;
        }
      }
      if (!coaxial) continue;

      // Verify collar sits along the interior of the axle (with at least 5 LDU margin from both ends)
      const collarCenter = part.box.center[axis];
      const collarSpan = Math.max(4, part.box.max[axis] - part.box.min[axis]);
      const distFromMin = collarCenter - candidate.box.min[axis];
      const distFromMax = candidate.box.max[axis] - collarCenter;
      if (distFromMin < 6 || distFromMax < 6) continue;
      if (collarSpan >= axleSpan * 0.72) continue;

      const nearDist = Math.min(distFromMin, distFromMax);
      // Skip exact center (50/50) only if trivial; keep any clear non-flush position
      const positionRatio = Math.max(0.12, Math.min(0.88, nearDist / axleSpan));
      const axleLengthMm = badge.mm;
      const offsetFromEndMm = positionRatio * axleLengthMm;
      const collarThicknessMm = Math.max(3.2, Math.min(axleLengthMm * 0.45, (collarSpan / 20) * MM_PER_STUD));

      return {
        axlePartId: candidate.id,
        collarPartId: part.id,
        axleLengthL: badge.lengthL,
        axleLabel: badge.label,
        axleKind: badge.kind,
        axleColorHex: candidate.colorHex || '#334155',
        collarColorHex: part.colorHex || '#d4a84f',
        collarKind,
        positionRatio,
        offsetFromEndMm,
        axleLengthMm,
        collarThicknessMm,
      };
    }
  }

  return null;
}

/**
 * Renders a cream `1:1` coaxial assembly-position callout card as inline SVG (matching 31172 p. 29).
 */
export function buildCoaxialPositionCalloutSvg(
  callout: CoaxialPositionCallout,
  pxPerMm = 3.78,
  opts?: { bg?: string; border?: string; text?: string },
): string {
  const bg = opts?.bg || '#fff5cc';
  const border = opts?.border || '#1e293b';
  const text = opts?.text || '#0f172a';
  const axleH = Math.max(38, Math.min(132, Math.round(callout.axleLengthMm * pxPerMm)));
  const padX = 14;
  const padTop = 10;
  const padBot = 22;
  const w = Math.max(52, padX * 2 + 26);
  const h = axleH + padTop + padBot;
  const cx = w / 2;
  const axleW = 8;
  const axleX = cx - axleW / 2;
  const axleY = padTop;

  const collarH = Math.max(7, Math.min(16, Math.round(callout.collarThicknessMm * pxPerMm)));
  const collarW = callout.collarKind === 'gear' ? 24 : 18;
  // Place collar near bottom end (LEGO convention: short protruding tip at bottom, long shaft upward)
  const collarCy = axleY + axleH - Math.round(callout.positionRatio * axleH);
  const collarY = Math.max(axleY + 3, Math.min(axleY + axleH - collarH - 3, collarCy - collarH / 2));

  const axleStroke = hexLuminance255(callout.axleColorHex) < 62 ? '#cbd5e1' : '#1e293b';
  const collarStroke = hexLuminance255(callout.collarColorHex) < 62 ? '#cbd5e1' : '#1e293b';
  const teethSvg = callout.collarKind === 'gear'
    ? `<line x1="${(cx - collarW / 2 + 4).toFixed(1)}" y1="${collarY.toFixed(1)}" x2="${(cx - collarW / 2 + 4).toFixed(1)}" y2="${(collarY + collarH).toFixed(1)}" stroke="${collarStroke}" stroke-width="0.8"/><line x1="${cx.toFixed(1)}" y1="${collarY.toFixed(1)}" x2="${cx.toFixed(1)}" y2="${(collarY + collarH).toFixed(1)}" stroke="${collarStroke}" stroke-width="0.8"/><line x1="${(cx + collarW / 2 - 4).toFixed(1)}" y1="${collarY.toFixed(1)}" x2="${(cx + collarW / 2 - 4).toFixed(1)}" y2="${(collarY + collarH).toFixed(1)}" stroke="${collarStroke}" stroke-width="0.8"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" class="block shrink-0" aria-label="1:1 coaxial assembly position"><rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8" fill="${bg}" stroke="${border}" stroke-width="1.35"/><rect x="${axleX.toFixed(1)}" y="${axleY}" width="${axleW}" height="${axleH}" rx="1.5" fill="${callout.axleColorHex}" stroke="${axleStroke}" stroke-width="1"/><line x1="${(cx - 1.2).toFixed(1)}" y1="${axleY + 1}" x2="${(cx - 1.2).toFixed(1)}" y2="${axleY + axleH - 1}" stroke="${axleStroke}" stroke-opacity="0.55" stroke-width="0.7"/><line x1="${(cx + 1.2).toFixed(1)}" y1="${axleY + 1}" x2="${(cx + 1.2).toFixed(1)}" y2="${axleY + axleH - 1}" stroke="${axleStroke}" stroke-opacity="0.55" stroke-width="0.7"/><rect x="${(cx - collarW / 2).toFixed(1)}" y="${collarY.toFixed(1)}" width="${collarW}" height="${collarH}" rx="2" fill="${callout.collarColorHex}" stroke="${collarStroke}" stroke-width="1.1"/>${teethSvg}<text x="${cx}" y="${h - 7}" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="11" fill="${text}">1:1</text></svg>`;
}

/**
 * Draws the cream `1:1` coaxial assembly-position callout card on a 2D Canvas (PDF export).
 */
export function drawCoaxialPositionCalloutCanvas(
  ctx: CanvasRenderingContext2D,
  callout: CoaxialPositionCallout,
  x: number,
  y: number,
  pxPerMm: number,
  opts?: { bg?: string; border?: string; text?: string },
): { w: number; h: number } {
  const bg = opts?.bg || '#fff5cc';
  const border = opts?.border || '#1e293b';
  const text = opts?.text || '#0f172a';
  const axleH = Math.max(44, Math.min(180, callout.axleLengthMm * pxPerMm));
  const w = Math.max(58, Math.round(axleH * 0.52));
  const padTop = Math.round(w * 0.18);
  const padBot = Math.round(w * 0.36);
  const h = axleH + padTop + padBot;
  const cx = x + w / 2;
  const axleW = Math.max(8, w * 0.14);
  const axleY = y + padTop;
  const collarH = Math.max(8, Math.min(20, callout.collarThicknessMm * pxPerMm));
  const collarW = callout.collarKind === 'gear' ? w * 0.48 : w * 0.34;
  const collarCy = axleY + axleH - callout.positionRatio * axleH;
  const collarY = Math.max(axleY + 3, Math.min(axleY + axleH - collarH - 3, collarCy - collarH / 2));

  const axleStroke = hexLuminance255(callout.axleColorHex) < 62 ? '#cbd5e1' : '#1e293b';
  const collarStroke = hexLuminance255(callout.collarColorHex) < 62 ? '#cbd5e1' : '#1e293b';

  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = Math.max(1.2, w * 0.022);
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(6, w * 0.14));
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = callout.axleColorHex;
  ctx.strokeStyle = axleStroke;
  ctx.lineWidth = Math.max(1, w * 0.016);
  ctx.beginPath();
  ctx.roundRect(cx - axleW / 2, axleY, axleW, axleH, 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = callout.collarColorHex;
  ctx.strokeStyle = collarStroke;
  ctx.beginPath();
  ctx.roundRect(cx - collarW / 2, collarY, collarW, collarH, 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = text;
  ctx.font = `800 ${Math.max(10, Math.round(w * 0.2))}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('1:1', cx, y + h - padBot * 0.48);
  ctx.restore();
  return { w, h };
}

export interface MultiPart1to1Item {
  badge: PartLengthBadge;
  colorHex: string;
}

/**
 * Renders a unified Technic-style `1:1` comparison strip stacking 1..4 color-matched
 * axles/bars/beams shortest-to-longest with left baselines flush (matching 42083 p. 37, 74, 130, 148).
 */
export function buildMultiPart1to1CardSvg(
  items: ReadonlyArray<MultiPart1to1Item>,
  pxPerMm = 3.78,
  opts?: { bg?: string; border?: string; text?: string },
): string {
  if (!items.length) return '';
  const sorted = [...items].sort((a, b) => a.badge.lengthL - b.badge.lengthL).slice(0, 4);
  const bg = opts?.bg || '#ffffff';
  const border = opts?.border || '#475569';
  const text = opts?.text || '#0f172a';
  const rowH = 18;
  const padX = 10;
  const padY = 7;
  const badgeSz = 14;
  const labelW = 28;
  const maxBarPx = Math.max(
    36,
    ...sorted.map((it) => Math.max(24, Math.min(220, Math.round(it.badge.lengthL * 8 * pxPerMm)))),
  );
  const w = padX * 2 + maxBarPx + badgeSz + 8 + labelW;
  const h = padY * 2 + sorted.length * rowH;

  const rowsSvg = sorted.map((it, idx) => {
    const barW = Math.max(24, Math.min(220, Math.round(it.badge.lengthL * 8 * pxPerMm)));
    const ry = padY + idx * rowH;
    const cy = ry + rowH / 2;
    const stroke = hexLuminance255(it.colorHex) < 62 ? '#cbd5e1' : '#1e293b';
    const shapeSvg = it.badge.kind === 'liftarm'
      ? `<rect x="${padX}" y="${cy - 4.5}" width="${barW}" height="9" rx="4.5" fill="${it.colorHex}" stroke="${stroke}" stroke-width="1"/>`
      : `<rect x="${padX}" y="${cy - 3.5}" width="${barW}" height="7" rx="1.8" fill="${it.colorHex}" stroke="${stroke}" stroke-width="1"/><line x1="${padX + 2}" y1="${cy}" x2="${padX + barW - 2}" y2="${cy}" stroke="${stroke}" stroke-width="0.7" opacity="0.65"/>`;
    const bx = padX + barW + 4;
    const badgeSvg = it.badge.shape === 'circle'
      ? `<circle cx="${bx + badgeSz / 2}" cy="${cy}" r="${badgeSz / 2}" fill="#0f172a"/><text x="${bx + badgeSz / 2}" y="${cy + 0.5}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="8.5" font-weight="800" font-family="system-ui,sans-serif">${it.badge.label}</text>`
      : `<rect x="${bx}" y="${cy - badgeSz / 2}" width="${badgeSz}" height="${badgeSz}" rx="2" fill="#0f172a"/><text x="${bx + badgeSz / 2}" y="${cy + 0.5}" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-size="8.5" font-weight="800" font-family="system-ui,sans-serif">${it.badge.label}</text>`;
    return shapeSvg + badgeSvg;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-label="1:1 length comparison">` +
    `<rect x="0.75" y="0.75" width="${w - 1.5}" height="${h - 1.5}" rx="5" fill="${bg}" stroke="${border}" stroke-width="1.2"/>` +
    rowsSvg +
    `<text x="${w - padX - 2}" y="${h / 2 + 0.5}" text-anchor="end" dominant-baseline="central" fill="${text}" font-size="11" font-weight="800" font-family="system-ui,sans-serif">1:1</text>` +
    `</svg>`;
}

/**
 * Canvas 2D renderer for the unified multi-part `1:1` ruler card (PDF export parity).
 */
export function drawMultiPart1to1CardCanvas(
  ctx: CanvasRenderingContext2D,
  items: ReadonlyArray<MultiPart1to1Item>,
  x: number,
  y: number,
  pxPerMm = 3.78,
  opts?: { bg?: string; border?: string; text?: string },
): { w: number; h: number } {
  if (!items.length) return { w: 0, h: 0 };
  const sorted = [...items].sort((a, b) => a.badge.lengthL - b.badge.lengthL).slice(0, 4);
  const bg = opts?.bg || '#ffffff';
  const border = opts?.border || '#475569';
  const text = opts?.text || '#0f172a';
  const rowH = 18;
  const padX = 10;
  const padY = 7;
  const badgeSz = 14;
  const labelW = 28;
  const maxBarPx = Math.max(
    36,
    ...sorted.map((it) => Math.max(24, Math.min(220, Math.round(it.badge.lengthL * 8 * pxPerMm)))),
  );
  const w = padX * 2 + maxBarPx + badgeSz + 8 + labelW;
  const h = padY * 2 + sorted.length * rowH;

  ctx.save();
  ctx.fillStyle = bg;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();

  for (let idx = 0; idx < sorted.length; idx++) {
    const it = sorted[idx];
    const barW = Math.max(24, Math.min(220, Math.round(it.badge.lengthL * 8 * pxPerMm)));
    const cy = y + padY + idx * rowH + rowH / 2;
    const stroke = hexLuminance255(it.colorHex) < 62 ? '#cbd5e1' : '#1e293b';
    ctx.fillStyle = it.colorHex;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (it.badge.kind === 'liftarm') {
      ctx.roundRect(x + padX, cy - 4.5, barW, 9, 4.5);
    } else {
      ctx.roundRect(x + padX, cy - 3.5, barW, 7, 1.8);
    }
    ctx.fill();
    ctx.stroke();

    const bx = x + padX + barW + 4;
    drawLengthBadgeCanvas(ctx, it.badge, bx + badgeSz / 2, cy, badgeSz);
  }

  ctx.fillStyle = text;
  ctx.font = '800 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText('1:1', x + w - padX - 2, y + h / 2 + 0.5);
  ctx.restore();
  return { w, h };
}

