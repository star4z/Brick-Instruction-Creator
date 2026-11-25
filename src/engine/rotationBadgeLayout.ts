import type { RotationCueDisplay } from './wordlessMode';

export interface RotationBadgeMetrics {
  /** Inner circular accent medallion diameter in pixels. */
  medallionPx: number;
  /** Total badge height (outer pill/circle diameter) in pixels. */
  outerH: number;
  /** Inner SVG arrow glyph size in pixels. */
  svgPx: number;
  /** Label font size in pixels (when not icon-only). */
  fontPx: number;
  /** Top/bottom padding around the medallion in pixels. */
  padY: number;
  /** Left padding around the medallion in pixels. */
  padL: number;
  /** Right padding after the label in pixels. */
  padR: number;
  /** Gap between the medallion and the label text in pixels. */
  gapPx: number;
  /** Outer accent border thickness in pixels. */
  borderPx: number;
  /** Estimated total badge width in pixels (used before DOM/Canvas text measurement). */
  estWidth: number;
}

export interface Rect2D {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MeshBounds3D {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface RotationBadgeLayoutInput {
  /** Visual render container width in layout pixels. */
  containerW: number;
  /** Visual render container height in layout pixels. */
  containerH: number;
  /** Badge outer width in layout pixels. */
  badgeW: number;
  /** Badge outer height in layout pixels. */
  badgeH: number;
  /** Rendered snapshot image pixel width. */
  snapW: number;
  /** Rendered snapshot image pixel height. */
  snapH: number;
  /** 4x4 column-major MVP matrix used to render the snapshot. */
  mvp?: ArrayLike<number> | null;
  /** Triangle vertex positions [x0,y0,z0, x1,y1,z1, ...] from the rendered mesh. */
  triPos?: ArrayLike<number> | null;
  /** Optional textured draw batches containing extra triPos buffers. */
  texDraws?: Array<{ triPos?: ArrayLike<number> | null }> | null;
  /** Optional 3D AABB fallback when triPos is unavailable. */
  bounds?: MeshBounds3D | null;
  /** Optional obstacle rectangles in container pixel coords (e.g. bottom-right ×N badge). */
  obstacles?: Rect2D[];
  /** Minimum margin from container edges in pixels. */
  edgeMargin?: number;
  /** Ideal gap between badge edge and nearest model pixel in pixels. */
  idealGap?: number;
  /** Minimum desired clearance from model silhouette in pixels. */
  minClearance?: number;
}

export interface RotationBadgePlacement {
  /** Top-left X in container pixels. */
  x: number;
  /** Top-left Y in container pixels. */
  y: number;
  /** Left percentage (0..100) for responsive DOM positioning. */
  leftPct: number;
  /** Top percentage (0..100) for responsive DOM positioning. */
  topPct: number;
  /** True when the badge has zero overlap with the projected model silhouette. */
  clearOfModel: boolean;
  /** Estimated minimum Euclidean distance (px) from the badge rect to the model silhouette. */
  distanceToModelPx: number;
}

/**
 * Computes spacious, balanced visual dimensions for the rotation cue badge
 * so Live DOM Preview, PDF Canvas Export, and intelligent placement all agree.
 */
export function computeRotationBadgeMetrics(
  pt: (points: number) => number,
  isTightSlot: boolean,
  disp: Pick<RotationCueDisplay, 'text' | 'iconOnly'>,
): RotationBadgeMetrics {
  const medallionPx = disp.iconOnly
    ? Math.max(isTightSlot ? 36 : 46, Math.round(pt(isTightSlot ? 31 : 40)))
    : Math.max(isTightSlot ? 30 : 38, Math.round(pt(isTightSlot ? 26 : 33)));
  const svgPx = Math.max(22, Math.round(medallionPx * (disp.iconOnly ? 0.72 : 0.7)));
  const fontPx = Math.max(isTightSlot ? 11 : 13.5, Math.round(pt(isTightSlot ? 10 : 12.5)));
  const padY = 0;
  const padL = 0;
  const padR = 0;
  const gapPx = Math.max(6, Math.round(pt(isTightSlot ? 5 : 7)));
  const borderPx = 0;
  const outerH = medallionPx;
  const estTextW = disp.iconOnly ? 0 : Math.ceil((disp.text || '').length * fontPx * 0.62);
  const estWidth = disp.iconOnly ? outerH : medallionPx + gapPx + estTextW;

  return {
    medallionPx,
    outerH,
    svgPx,
    fontPx,
    padY,
    padL,
    padR,
    gapPx,
    borderPx,
    estWidth,
  };
}

export interface RotationBadgeColors {
  /** Soft, understated circular medallion fill color (CSS / Canvas compatible). */
  bg: string;
  /** Crisp arrow stroke color inside the medallion. */
  fg: string;
}

function parseHexRgb(hex: string | undefined | null, fallback: [number, number, number]): [number, number, number] {
  const s = String(hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    return [
      parseInt(s[0] + s[0], 16),
      parseInt(s[1] + s[1], 16),
      parseInt(s[2] + s[2], 16),
    ];
  }
  if (/^[0-9a-fA-F]{6}$/.test(s)) {
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
    ];
  }
  return fallback;
}

function relLuminance([r, g, b]: [number, number, number]): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/**
 * Derives a calm, understated circular medallion background and crisp arrow color
 * from the active theme's accent and page background colors.
 */
export function resolveRotationBadgeColors(
  accentHex?: string | null,
  bgHex?: string | null,
): RotationBadgeColors {
  const [ar, ag, ab] = parseHexRgb(accentHex, [26, 115, 232]);
  const bgRgb = parseHexRgb(bgHex, [255, 255, 255]);
  const darkBg = relLuminance(bgRgb) < 0.45;

  if (darkBg) {
    // Subtle translucent accent wash on dark/blueprint pages
    return {
      bg: `rgba(${ar}, ${ag}, ${ab}, 0.18)`,
      fg: `rgb(${ar}, ${ag}, ${ab})`,
    };
  }

  // Light pages: soft, calm accent wash (never a glaring solid block)
  // If the accent itself is very pale, darken the arrow stroke slightly for legibility.
  const accentLum = relLuminance([ar, ag, ab]);
  const fgR = accentLum > 0.72 ? Math.round(ar * 0.55) : ar;
  const fgG = accentLum > 0.72 ? Math.round(ag * 0.55) : ag;
  const fgB = accentLum > 0.72 ? Math.round(ab * 0.55) : ab;

  return {
    bg: `rgba(${ar}, ${ag}, ${ab}, 0.14)`,
    fg: `rgb(${fgR}, ${fgG}, ${fgB})`,
  };
}

/** Projects a 3D world point through a 4x4 column-major MVP matrix to NDC. */
function projectPointToNdc(
  x: number,
  y: number,
  z: number,
  m: ArrayLike<number>,
): [number, number, number] | null {
  const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  if (!Number.isFinite(cw) || Math.abs(cw) < 1e-6) return null;
  return [cx / cw, cy / cw, cw];
}

function edgeCross(ax: number, ay: number, bx: number, by: number, px: number, py: number): number {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

/**
 * Computes an intelligent, model-aware (x, y) placement for the rotation cue badge
 * inside the step's 3D visual container:
 * - Rasterizes the projected 3D model silhouette onto a coarse 2D occupancy grid.
 * - Strictly avoids overlapping the model silhouette and any known obstacle rects.
 * - Hugs close to the model at a comfortable visual gap (`idealGap`) rather than
 *   drifting into a distant empty page corner.
 * - Gently prefers the upper-right / upper-left shoulder of the model among equally
 *   clear, equally close candidates.
 */
export function computeRotationBadgePlacement(
  input: RotationBadgeLayoutInput,
): RotationBadgePlacement {
  const containerW = Math.max(1, input.containerW);
  const containerH = Math.max(1, input.containerH);
  const badgeW = Math.min(Math.max(1, input.badgeW), Math.max(1, containerW - 2));
  const badgeH = Math.min(Math.max(1, input.badgeH), Math.max(1, containerH - 2));

  const maxMarginX = Math.max(0, Math.floor((containerW - badgeW) / 2));
  const maxMarginY = Math.max(0, Math.floor((containerH - badgeH) / 2));
  const margin = Math.min(input.edgeMargin ?? 8, maxMarginX, maxMarginY);

  const minX = margin;
  const maxX = Math.max(minX, containerW - badgeW - margin);
  const minY = margin;
  const maxY = Math.max(minY, containerH - badgeH - margin);

  const makeResult = (
    x: number,
    y: number,
    clearOfModel: boolean,
    distanceToModelPx: number,
  ): RotationBadgePlacement => {
    const clampedX = Math.max(minX, Math.min(maxX, x));
    const clampedY = Math.max(minY, Math.min(maxY, y));
    return {
      x: clampedX,
      y: clampedY,
      leftPct: (clampedX / containerW) * 100,
      topPct: (clampedY / containerH) * 100,
      clearOfModel,
      distanceToModelPx,
    };
  };

  const mvp = input.mvp;
  const snapW = Math.max(1, input.snapW || containerW);
  const snapH = Math.max(1, input.snapH || containerH);
  if (!mvp || mvp.length < 16) {
    return makeResult(maxX, minY, true, 0);
  }

  // Exact object-contain / drawContain image rect inside container
  const imgAspect = snapW / snapH;
  const boxAspect = containerW / containerH;
  let imgDrawW = containerW;
  let imgDrawH = containerH;
  let imgOffX = 0;
  let imgOffY = 0;
  if (boxAspect > imgAspect) {
    imgDrawW = containerH * imgAspect;
    imgOffX = (containerW - imgDrawW) * 0.5;
  } else {
    imgDrawH = containerW / imgAspect;
    imgOffY = (containerH - imgDrawH) * 0.5;
  }

  // Coarse 32x32 occupancy grid in container coordinates
  const COLS = 32;
  const ROWS = 32;
  const cellW = containerW / COLS;
  const cellH = containerH / ROWS;
  const halfCell = 0.5 * Math.min(cellW, cellH);
  const occ = new Uint8Array(COLS * ROWS);

  const ndcToPxX = (nx: number) => imgOffX + (nx + 1) * 0.5 * imgDrawW;
  const ndcToPxY = (ny: number) => imgOffY + (1 - ny) * 0.5 * imgDrawH;

  const buffers: ArrayLike<number>[] = [];
  if (input.triPos && input.triPos.length >= 9) buffers.push(input.triPos);
  if (input.texDraws) {
    for (const td of input.texDraws) {
      if (td?.triPos && td.triPos.length >= 9) buffers.push(td.triPos);
    }
  }

  let totalTris = 0;
  for (const buf of buffers) totalTris += Math.floor(buf.length / 9);
  const triStride = totalTris > 12000 ? Math.max(1, Math.floor(totalTris / 12000)) : 1;

  let anyOccupied = false;

  for (const buf of buffers) {
    const triCount = Math.floor(buf.length / 9);
    for (let t = 0; t < triCount; t += triStride) {
      const i = t * 9;
      const p0 = projectPointToNdc(buf[i], buf[i + 1], buf[i + 2], mvp);
      const p1 = projectPointToNdc(buf[i + 3], buf[i + 4], buf[i + 5], mvp);
      const p2 = projectPointToNdc(buf[i + 6], buf[i + 7], buf[i + 8], mvp);
      if (!p0 || !p1 || !p2) continue;

      const x0 = ndcToPxX(p0[0]);
      const y0 = ndcToPxY(p0[1]);
      const x1 = ndcToPxX(p1[0]);
      const y1 = ndcToPxY(p1[1]);
      const x2 = ndcToPxX(p2[0]);
      const y2 = ndcToPxY(p2[1]);

      const tMinX = Math.min(x0, x1, x2);
      const tMaxX = Math.max(x0, x1, x2);
      const tMinY = Math.min(y0, y1, y2);
      const tMaxY = Math.max(y0, y1, y2);

      if (tMaxX < 0 || tMinX > containerW || tMaxY < 0 || tMinY > containerH) continue;

      const c0 = Math.max(0, Math.min(COLS - 1, Math.floor(tMinX / cellW)));
      const c1 = Math.max(0, Math.min(COLS - 1, Math.floor(tMaxX / cellW)));
      const r0 = Math.max(0, Math.min(ROWS - 1, Math.floor(tMinY / cellH)));
      const r1 = Math.max(0, Math.min(ROWS - 1, Math.floor(tMaxY / cellH)));

      if (c1 - c0 <= 1 && r1 - r0 <= 1) {
        for (let r = r0; r <= r1; r++) {
          const rowOff = r * COLS;
          for (let c = c0; c <= c1; c++) {
            occ[rowOff + c] = 1;
          }
        }
        anyOccupied = true;
      } else {
        // Rasterize larger triangles accurately so big flat plates mark interior cells
        // without over-inflating diagonal bounding boxes.
        const area2 = edgeCross(x0, y0, x1, y1, x2, y2);
        const absArea = Math.abs(area2);
        const sign = area2 >= 0 ? 1 : -1;
        // Tolerance allows thin beams/edges to mark cells whose center is within ~0.55 cell
        const edge01Len = Math.hypot(x1 - x0, y1 - y0);
        const edge12Len = Math.hypot(x2 - x1, y2 - y1);
        const edge20Len = Math.hypot(x0 - x2, y0 - y2);
        const padDist = 0.55 * Math.max(cellW, cellH);
        const tol01 = edge01Len * padDist;
        const tol12 = edge12Len * padDist;
        const tol20 = edge20Len * padDist;

        for (let r = r0; r <= r1; r++) {
          const py = (r + 0.5) * cellH;
          const rowOff = r * COLS;
          for (let c = c0; c <= c1; c++) {
            if (occ[rowOff + c]) continue;
            const px = (c + 0.5) * cellW;
            if (absArea < 1e-4) {
              occ[rowOff + c] = 1;
              anyOccupied = true;
              continue;
            }
            const e0 = edgeCross(x0, y0, x1, y1, px, py) * sign;
            const e1 = edgeCross(x1, y1, x2, y2, px, py) * sign;
            const e2 = edgeCross(x2, y2, x0, y0, px, py) * sign;
            if (e0 >= -tol01 && e1 >= -tol12 && e2 >= -tol20) {
              occ[rowOff + c] = 1;
              anyOccupied = true;
            }
          }
        }
      }
    }
  }

  // Fallback to 3D AABB projection if no triangle geometry was available
  if (!anyOccupied && input.bounds) {
    const b = input.bounds;
    const xs = [b.minX, b.maxX];
    const ys = [b.minY, b.maxY];
    const zs = [b.minZ, b.maxZ];
    let pMinX = Infinity;
    let pMaxX = -Infinity;
    let pMinY = Infinity;
    let pMaxY = -Infinity;
    for (const bx of xs) {
      for (const by of ys) {
        for (const bz of zs) {
          const p = projectPointToNdc(bx, by, bz, mvp);
          if (!p) continue;
          const px = ndcToPxX(p[0]);
          const py = ndcToPxY(p[1]);
          if (px < pMinX) pMinX = px;
          if (px > pMaxX) pMaxX = px;
          if (py < pMinY) pMinY = py;
          if (py > pMaxY) pMaxY = py;
        }
      }
    }
    if (Number.isFinite(pMinX) && Number.isFinite(pMaxX)) {
      const c0 = Math.max(0, Math.min(COLS - 1, Math.floor(pMinX / cellW)));
      const c1 = Math.max(0, Math.min(COLS - 1, Math.floor(pMaxX / cellW)));
      const r0 = Math.max(0, Math.min(ROWS - 1, Math.floor(pMinY / cellH)));
      const r1 = Math.max(0, Math.min(ROWS - 1, Math.floor(pMaxY / cellH)));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          occ[r * COLS + c] = 1;
          anyOccupied = true;
        }
      }
    }
  }

  if (!anyOccupied) {
    return makeResult(maxX, minY, true, 0);
  }

  // Extract model silhouette boundary cells + silhouette bbox & centroid
  const boundaryX: number[] = [];
  const boundaryY: number[] = [];
  let sumX = 0;
  let sumY = 0;
  let occCount = 0;
  let mMinX = containerW;
  let mMaxX = 0;
  let mMinY = containerH;
  let mMaxY = 0;

  for (let r = 0; r < ROWS; r++) {
    const rowOff = r * COLS;
    const cy = (r + 0.5) * cellH;
    for (let c = 0; c < COLS; c++) {
      if (!occ[rowOff + c]) continue;
      const cx = (c + 0.5) * cellW;
      sumX += cx;
      sumY += cy;
      occCount++;
      if (c * cellW < mMinX) mMinX = c * cellW;
      if ((c + 1) * cellW > mMaxX) mMaxX = (c + 1) * cellW;
      if (r * cellH < mMinY) mMinY = r * cellH;
      if ((r + 1) * cellH > mMaxY) mMaxY = (r + 1) * cellH;

      const isBoundary =
        c === 0 ||
        c === COLS - 1 ||
        r === 0 ||
        r === ROWS - 1 ||
        !occ[rowOff + c - 1] ||
        !occ[rowOff + c + 1] ||
        !occ[rowOff - COLS + c] ||
        !occ[rowOff + COLS + c];
      if (isBoundary) {
        boundaryX.push(cx);
        boundaryY.push(cy);
      }
    }
  }

  const mCx = sumX / Math.max(1, occCount);
  const mCy = sumY / Math.max(1, occCount);

  // Mark optional obstacles (e.g. bottom-right ×N badge)
  const obstacles = input.obstacles || [];
  const obsOcc = new Uint8Array(COLS * ROWS);
  for (const ob of obstacles) {
    if (ob.w <= 0 || ob.h <= 0) continue;
    const c0 = Math.max(0, Math.min(COLS - 1, Math.floor(ob.x / cellW)));
    const c1 = Math.max(0, Math.min(COLS - 1, Math.floor((ob.x + ob.w) / cellW)));
    const r0 = Math.max(0, Math.min(ROWS - 1, Math.floor(ob.y / cellH)));
    const r1 = Math.max(0, Math.min(ROWS - 1, Math.floor((ob.y + ob.h) / cellH)));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        obsOcc[r * COLS + c] = 1;
      }
    }
  }

  // Scale idealGap & minClearance sensibly for tiny vs spacious slots
  const minDim = Math.min(containerW, containerH);
  const idealGap = input.idealGap ?? Math.max(10, Math.min(20, Math.round(minDim * 0.045)));
  const minClearance = input.minClearance ?? Math.max(6, Math.round(idealGap * 0.55));

  // Build candidate coordinates: regular 22x22 grid + corners + hugging anchor points around model bbox
  const candidates: Array<[number, number]> = [];
  const SAMPLES = 22;
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  for (let iy = 0; iy < SAMPLES; iy++) {
    const y = spanY > 0 ? minY + (spanY * iy) / (SAMPLES - 1) : minY;
    for (let ix = 0; ix < SAMPLES; ix++) {
      const x = spanX > 0 ? minX + (spanX * ix) / (SAMPLES - 1) : minX;
      candidates.push([x, y]);
    }
  }

  // Add tight model-hugging anchors around the silhouette bbox
  const clampX = (v: number) => Math.max(minX, Math.min(maxX, v));
  const clampY = (v: number) => Math.max(minY, Math.min(maxY, v));
  const anchorPoints: Array<[number, number]> = [
    // Upper-right shoulder & side
    [clampX(mMaxX + idealGap), clampY(mMinY)],
    [clampX(mMaxX - badgeW), clampY(mMinY - badgeH - idealGap)],
    [clampX(mMaxX + idealGap), clampY(mMinY - badgeH * 0.5)],
    // Upper-left shoulder & side
    [clampX(mMinX - badgeW - idealGap), clampY(mMinY)],
    [clampX(mMinX), clampY(mMinY - badgeH - idealGap)],
    // Lower-right & lower-left
    [clampX(mMaxX + idealGap), clampY(mMaxY - badgeH)],
    [clampX(mMinX - badgeW - idealGap), clampY(mMaxY - badgeH)],
    // Top-right fallback corner
    [maxX, minY],
  ];
  for (const pt of anchorPoints) candidates.push(pt);

  let bestX = maxX;
  let bestY = minY;
  let bestScore = Infinity;
  let bestClear = false;
  let bestDist = 0;

  const bLen = boundaryX.length;

  for (let ci = 0; ci < candidates.length; ci++) {
    const x = candidates[ci][0];
    const y = candidates[ci][1];
    const x2 = x + badgeW;
    const y2 = y + badgeH;

    // 1. Check grid overlap with model & obstacles
    const c0 = Math.max(0, Math.min(COLS - 1, Math.floor(x / cellW)));
    const c1 = Math.max(0, Math.min(COLS - 1, Math.floor((x2 - 0.01) / cellW)));
    const r0 = Math.max(0, Math.min(ROWS - 1, Math.floor(y / cellH)));
    const r1 = Math.max(0, Math.min(ROWS - 1, Math.floor((y2 - 0.01) / cellH)));

    let modelOverlap = 0;
    let obsOverlap = 0;
    for (let r = r0; r <= r1; r++) {
      const rowOff = r * COLS;
      for (let c = c0; c <= c1; c++) {
        if (occ[rowOff + c]) modelOverlap++;
        if (obsOcc[rowOff + c]) obsOverlap++;
      }
    }

    // 2. Minimum Euclidean distance from badge rect to model silhouette boundary
    let minDistPx = 0;
    if (modelOverlap === 0) {
      let minDistSq = Infinity;
      for (let bi = 0; bi < bLen; bi++) {
        const bx = boundaryX[bi];
        const by = boundaryY[bi];
        const dx = bx < x ? x - bx : bx > x2 ? bx - x2 : 0;
        const dy = by < y ? y - by : by > y2 ? by - y2 : 0;
        const d2 = dx * dx + dy * dy;
        if (d2 < minDistSq) minDistSq = d2;
      }
      minDistPx = Math.max(0, Math.sqrt(minDistSq) - halfCell);
    }

    // 3. Score candidate (lower is better)
    let score = modelOverlap * 100_000 + obsOverlap * 50_000;

    if (modelOverlap === 0) {
      if (minDistPx < minClearance) {
        score += (minClearance - minDistPx) * 450;
      } else if (minDistPx < idealGap) {
        score += (idealGap - minDistPx) * 6;
      } else {
        score += (minDistPx - idealGap) * 3.2;
      }
    }

    // Gentle visual-composition tie-breaker: prefer upper-right, then upper-left,
    // then lower-right, then lower-left relative to the model centroid.
    const bcx = x + badgeW * 0.5;
    const bcy = y + badgeH * 0.5;
    if (bcy > mCy) score += 12;
    if (bcx < mCx) score += 5;
    if (y2 > containerH * 0.86) score += 6;

    if (score < bestScore) {
      bestScore = score;
      bestX = x;
      bestY = y;
      bestClear = modelOverlap === 0;
      bestDist = minDistPx;
    }
  }

  return makeResult(bestX, bestY, bestClear, bestDist);
}
