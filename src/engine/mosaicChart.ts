/**
 * LEGO Art-Style Color-Numbered Mosaic Grid Chart Planner & Renderer (Phase D).
 *
 * Inspired by official LEGO Art manuals (e.g. #31199 Iron Man p. 35, 49, 79):
 *   - Automatically detects flat 1-layer 1×1 stud/tile mosaic grids (`>= 12` 1×1 tiles
 *     sharing a horizontal plane on a 20-LDU stud grid).
 *   - Assigns stable 1-based color numbers (`1..N`) with a vertical color-key legend sidebar.
 *   - Renders circular dots (round 1×1 tiles/plates) or rounded squares (square 1×1 tiles)
 *     with 4×4 quadrant hairlines and auto-contrasting black/white numerals.
 */

export interface MosaicPartInput {
  id: string;
  partId: string;
  colorId: number;
  colorHex: string;
  colorName?: string;
  isRound?: boolean;
  center: [number, number, number];
  spanLdu: [number, number, number];
}

export interface MosaicLegendEntry {
  colorNum: number;
  colorId: number;
  colorHex: string;
  colorName: string;
  count: number;
}

export interface MosaicCell {
  col: number;
  row: number;
  colorNum: number;
  colorHex: string;
  isRound: boolean;
}

export interface MosaicChartPlan {
  cols: number;
  rows: number;
  cells: MosaicCell[];
  legend: MosaicLegendEntry[];
}

function luma255(hex: string): number {
  const h = (hex || '#888888').replace('#', '').trim();
  const full = h.length === 3 ? `${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}` : h.padEnd(6, '0').slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Detects whether a step's parts form a flat 1-layer 1×1 mosaic grid (`>= 12` tiles
 * on a shared horizontal plane with 20-LDU stud pitch).
 */
export function detectMosaicGridStep(
  parts: ReadonlyArray<MosaicPartInput>,
): MosaicChartPlan | null {
  if (parts.length < 12) return null;

  // All parts must be ~1x1 footprint (<= 24 LDU in X and Z) and share the same Y plane (within 6 LDU)
  const meanY = parts.reduce((s, p) => s + p.center[1], 0) / parts.length;
  for (const p of parts) {
    if (Math.abs(p.center[1] - meanY) > 6) return null;
    if (p.spanLdu[0] > 24 || p.spanLdu[2] > 24) return null;
  }

  let minX = Infinity;
  let minZ = Infinity;
  for (const p of parts) {
    if (p.center[0] < minX) minX = p.center[0];
    if (p.center[2] < minZ) minZ = p.center[2];
  }

  const colorCounts = new Map<number, { hex: string; name: string; count: number }>();
  for (const p of parts) {
    const cur = colorCounts.get(p.colorId);
    if (cur) cur.count += 1;
    else colorCounts.set(p.colorId, { hex: p.colorHex, name: p.colorName || `Color ${p.colorId}`, count: 1 });
  }
  const sortedColors = Array.from(colorCounts.entries()).sort((a, b) => b[1].count - a[1].count);
  const colorNumMap = new Map<number, number>();
  const legend: MosaicLegendEntry[] = sortedColors.map(([colorId, info], idx) => {
    const colorNum = idx + 1;
    colorNumMap.set(colorId, colorNum);
    return {
      colorNum,
      colorId,
      colorHex: info.hex,
      colorName: info.name,
      count: info.count,
    };
  });

  let maxCol = 0;
  let maxRow = 0;
  const cells: MosaicCell[] = [];
  for (const p of parts) {
    const col = Math.max(0, Math.round((p.center[0] - minX) / 20));
    const row = Math.max(0, Math.round((p.center[2] - minZ) / 20));
    if (col > 48 || row > 48) return null;
    if (col > maxCol) maxCol = col;
    if (row > maxRow) maxRow = row;
    cells.push({
      col,
      row,
      colorNum: colorNumMap.get(p.colorId) || 1,
      colorHex: p.colorHex,
      isRound: p.isRound !== false,
    });
  }

  return {
    cols: maxCol + 1,
    rows: maxRow + 1,
    cells,
    legend,
  };
}

/**
 * Renders a LEGO Art-style color-numbered mosaic grid chart with vertical color-key
 * legend sidebar and 4×4 quadrant dividers as crisp inline SVG.
 */
export function buildMosaicChartSvg(
  plan: MosaicChartPlan,
  cellPx = 18,
  opts?: { bg?: string; gridColor?: string; textColor?: string },
): string {
  const bg = opts?.bg || '#0b0f17';
  const gridColor = opts?.gridColor || 'rgba(255,255,255,0.28)';
  const textColor = opts?.textColor || '#f8fafc';
  const pad = 12;
  const legendW = 58;
  const gridW = plan.cols * cellPx;
  const gridH = plan.rows * cellPx;
  const w = pad * 2 + legendW + 10 + gridW;
  const h = Math.max(pad * 2 + gridH, pad * 2 + plan.legend.length * 18);
  const gx = pad + legendW + 10;
  const gy = pad;

  const legendSvg = plan.legend.map((entry, idx) => {
    const ly = pad + idx * 18 + 9;
    const fg = luma255(entry.colorHex) < 128 ? '#ffffff' : '#0f172a';
    return `<circle cx="${pad + 10}" cy="${ly}" r="7" fill="${entry.colorHex}" stroke="${gridColor}" stroke-width="0.9"/>` +
      `<text x="${pad + 10}" y="${ly + 0.5}" text-anchor="middle" dominant-baseline="central" fill="${fg}" font-size="8.5" font-weight="800" font-family="system-ui,sans-serif">${entry.colorNum}</text>` +
      `<text x="${pad + 22}" y="${ly + 0.5}" dominant-baseline="central" fill="${textColor}" font-size="8.5" font-weight="700" font-family="system-ui,sans-serif">${entry.count}×</text>`;
  }).join('');

  const cellsSvg = plan.cells.map((c) => {
    const cx = gx + c.col * cellPx + cellPx / 2;
    const cy = gy + c.row * cellPx + cellPx / 2;
    const r = cellPx * 0.43;
    const fg = luma255(c.colorHex) < 128 ? '#ffffff' : '#0f172a';
    const shape = c.isRound
      ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${c.colorHex}" stroke="rgba(255,255,255,0.22)" stroke-width="0.7"/>`
      : `<rect x="${(cx - r).toFixed(1)}" y="${(cy - r).toFixed(1)}" width="${(r * 2).toFixed(1)}" height="${(r * 2).toFixed(1)}" rx="2.5" fill="${c.colorHex}" stroke="rgba(255,255,255,0.22)" stroke-width="0.7"/>`;
    return `${shape}<text x="${cx.toFixed(1)}" y="${(cy + 0.5).toFixed(1)}" text-anchor="middle" dominant-baseline="central" fill="${fg}" font-size="${Math.max(7, Math.round(cellPx * 0.44))}" font-weight="800" font-family="system-ui,sans-serif">${c.colorNum}</text>`;
  }).join('');

  // 4x4 quadrant hairlines
  let quadLines = '';
  for (let c = 4; c < plan.cols; c += 4) {
    const x = gx + c * cellPx;
    quadLines += `<line x1="${x}" y1="${gy}" x2="${x}" y2="${gy + gridH}" stroke="${gridColor}" stroke-width="1"/>`;
  }
  for (let r = 4; r < plan.rows; r += 4) {
    const y = gy + r * cellPx;
    quadLines += `<line x1="${gx}" y1="${y}" x2="${gx + gridW}" y2="${y}" stroke="${gridColor}" stroke-width="1"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-label="Color-numbered mosaic chart">` +
    `<rect x="0" y="0" width="${w}" height="${h}" rx="8" fill="${bg}"/>` +
    legendSvg +
    `<rect x="${gx}" y="${gy}" width="${gridW}" height="${gridH}" fill="none" stroke="${gridColor}" stroke-width="1.2"/>` +
    cellsSvg +
    quadLines +
    `</svg>`;
}

/**
 * Canvas 2D renderer for color-numbered LEGO Art mosaic charts (PDF export parity).
 */
export function drawMosaicChartCanvas(
  ctx: CanvasRenderingContext2D,
  plan: MosaicChartPlan,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
  opts?: { bg?: string; gridColor?: string; textColor?: string },
): void {
  const bg = opts?.bg || '#0b0f17';
  const gridColor = opts?.gridColor || 'rgba(255,255,255,0.28)';
  const textColor = opts?.textColor || '#f8fafc';
  const pad = 12;
  const legendW = 56;
  const cellPx = Math.max(
    8,
    Math.min(
      24,
      Math.floor((maxW - pad * 2 - legendW - 10) / Math.max(1, plan.cols)),
      Math.floor((maxH - pad * 2) / Math.max(1, plan.rows)),
    ),
  );
  const gridW = plan.cols * cellPx;
  const gridH = plan.rows * cellPx;
  const totalW = pad * 2 + legendW + 10 + gridW;
  const totalH = Math.max(pad * 2 + gridH, pad * 2 + plan.legend.length * 18);
  const ox = x + Math.max(0, (maxW - totalW) / 2);
  const oy = y + Math.max(0, (maxH - totalH) / 2);
  const gx = ox + pad + legendW + 10;
  const gy = oy + pad;

  ctx.save();
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(ox, oy, totalW, totalH, 8);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let idx = 0; idx < plan.legend.length; idx++) {
    const entry = plan.legend[idx];
    const ly = oy + pad + idx * 18 + 9;
    const fg = luma255(entry.colorHex) < 128 ? '#ffffff' : '#0f172a';
    ctx.fillStyle = entry.colorHex;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(ox + pad + 10, ly, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.font = '800 8.5px system-ui, sans-serif';
    ctx.fillText(String(entry.colorNum), ox + pad + 10, ly + 0.5);
    ctx.fillStyle = textColor;
    ctx.textAlign = 'left';
    ctx.font = '700 8.5px system-ui, sans-serif';
    ctx.fillText(`${entry.count}×`, ox + pad + 22, ly + 0.5);
    ctx.textAlign = 'center';
  }

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(gx, gy, gridW, gridH);

  const fontSz = Math.max(7, Math.round(cellPx * 0.44));
  ctx.font = `800 ${fontSz}px system-ui, sans-serif`;
  for (const c of plan.cells) {
    const cx = gx + c.col * cellPx + cellPx / 2;
    const cy = gy + c.row * cellPx + cellPx / 2;
    const r = cellPx * 0.43;
    const fg = luma255(c.colorHex) < 128 ? '#ffffff' : '#0f172a';
    ctx.fillStyle = c.colorHex;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    if (c.isRound) ctx.arc(cx, cy, r, 0, Math.PI * 2);
    else ctx.roundRect(cx - r, cy - r, r * 2, r * 2, 2.5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.fillText(String(c.colorNum), cx, cy + 0.5);
  }

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  for (let c = 4; c < plan.cols; c += 4) {
    ctx.beginPath();
    ctx.moveTo(gx + c * cellPx, gy);
    ctx.lineTo(gx + c * cellPx, gy + gridH);
    ctx.stroke();
  }
  for (let r = 4; r < plan.rows; r += 4) {
    ctx.beginPath();
    ctx.moveTo(gx, gy + r * cellPx);
    ctx.lineTo(gx + gridW, gy + r * cellPx);
    ctx.stroke();
  }
  ctx.restore();
}

