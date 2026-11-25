/**
 * Official LEGO-Style Build Roadmap, Inline Bag Opener Cards,
 * and Bottom-Edge Build Progress Bar.
 *
 * Pure, domain-neutral helpers shared across Live DOM Preview,
 * PDF / System Print Canvas, and Interactive 3D HTML export:
 *   - Visual Build Roadmap (`computeBuildRoadmapPages`): 2-column × 3-row cumulative
 *     stage progression spread (matching 75192 p. 17–18) showing Bag 1 → Bag N + minifigures.
 *   - Inline Bag Opener Card (`classifyLooseUnbaggedParts`): identifies oversized/long
 *     parts (>= 12L beams/plates or large baseplates) alongside the numbered bag icon
 *     (matching 75192 p. 20).
 *   - Bottom-Edge Build Progress Bar (`computeBagProgressFraction`, `buildProgressBarHtml`,
 *     `drawProgressBarCanvas`): sleek horizontal track with circular bead marker tracking
 *     progress across the current bag/section (matching 31172 p. 4–103).
 */

export interface RoadmapStageInput {
  stageNumber: number;
  title: string;
  partCount: number;
  stepStart: number;
  stepEnd: number;
  /** Preview image data URL of the cumulative model through this stage. */
  previewUrl?: string;
  /** Optional minifigure thumbnail data URLs built in this stage. */
  minifigThumbs?: string[];
}

export interface RoadmapPage {
  pageIndex: number;
  totalPages: number;
  cols: 1 | 2;
  rows: number;
  stages: RoadmapStageInput[];
}

export interface LoosePartSummary {
  partId: string;
  colorId: number;
  count: number;
  title: string;
}

/**
 * Splits multi-stage builds into clean Build Roadmap pages (up to 6 stages per page
 * in a 2-column × 3-row grid, matching 75192 p. 17–18).
 */
export function computeBuildRoadmapPages(
  stages: ReadonlyArray<RoadmapStageInput>,
  maxStagesPerPage = 6,
): RoadmapPage[] {
  if (stages.length < 2) return [];
  const cap = Math.max(2, Math.min(8, Math.round(maxStagesPerPage)));
  const totalPages = Math.ceil(stages.length / cap);
  const pages: RoadmapPage[] = [];

  for (let p = 0; p < totalPages; p++) {
    const slice = stages.slice(p * cap, (p + 1) * cap);
    const cols: 1 | 2 = slice.length >= 2 ? 2 : 1;
    const rows = Math.ceil(slice.length / cols);
    pages.push({
      pageIndex: p,
      totalPages,
      cols,
      rows,
      stages: slice,
    });
  }
  return pages;
}

/**
 * Identifies oversized/unbagged structural parts (e.g. >= 12L plates/beams or large
 * baseplates with max dimension >= 240 LDU) so inline bag opener cards can call them
 * out beside the numbered bag graphic (`[part] + [Bag N]`, matching 75192 p. 20).
 */
export function classifyLooseUnbaggedParts(
  parts: ReadonlyArray<{
    partId: string;
    colorId: number;
    title: string;
    maxDimLdu: number;
  }>,
  minLooseDimLdu = 240,
): LoosePartSummary[] {
  const map = new Map<string, LoosePartSummary>();
  for (const p of parts) {
    if (p.maxDimLdu < minLooseDimLdu) continue;
    const key = `${p.partId}:${p.colorId}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, {
        partId: p.partId,
        colorId: p.colorId,
        count: 1,
        title: p.title,
      });
    }
  }
  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

/**
 * Computes the normalized `0..1` progress fraction along the bottom-edge progress bar
 * within the current bag/stage (resets cleanly to `0` at the start of each new bag,
 * reaches `1` at the final step of that bag — matching 31172 p. 4–103).
 */
export function computeBagProgressFraction(
  stepIndexInStage: number,
  totalStepsInStage: number,
): number {
  if (totalStepsInStage <= 1) return 1;
  const clamped = Math.max(0, Math.min(totalStepsInStage - 1, stepIndexInStage));
  return clamped / (totalStepsInStage - 1);
}

/**
 * Builds the sleek bottom-edge horizontal progress bar HTML with circular marker bead
 * (matching 31172 p. 4–103) for Live DOM Preview & Interactive HTML Export.
 */
export function buildProgressBarHtml(
  fraction: number,
  opts?: { accent?: string; trackBg?: string; heightPx?: number },
): string {
  const f = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const pct = (f * 100).toFixed(2);
  const accent = opts?.accent || '#1d4ed8';
  const trackBg = opts?.trackBg || 'rgba(100,116,139,0.28)';
  const h = Math.max(3, Math.round(opts?.heightPx ?? 4));
  const bead = Math.max(9, h * 2 + 2);

  return `<div class="biw-progress-bar relative flex-1 flex items-center" style="height:${bead}px;min-width:60px;" aria-hidden="true">` +
    `<div style="position:relative;width:100%;height:${h}px;border-radius:999px;background:${trackBg};overflow:visible;">` +
      `<div style="position:absolute;left:0;top:0;height:100%;width:${pct}%;border-radius:999px;background:${accent};"></div>` +
      `<div style="position:absolute;top:50%;left:${pct}%;width:${bead}px;height:${bead}px;transform:translate(-50%,-50%);border-radius:999px;background:${accent};border:1.5px solid #0f172a;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,0.45);"></div>` +
    `</div>` +
  `</div>`;
}

/**
 * Draws the bottom-edge horizontal progress bar with circular marker bead onto a 2D Canvas (PDF export).
 */
export function drawProgressBarCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  yCenter: number,
  width: number,
  fraction: number,
  opts?: { accent?: string; trackBg?: string; barHeight?: number },
): void {
  if (width < 24) return;
  const f = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const accent = opts?.accent || '#1d4ed8';
  const trackBg = opts?.trackBg || 'rgba(100,116,139,0.32)';
  const h = Math.max(3, opts?.barHeight ?? 4.5);
  const r = h / 2;
  const beadR = Math.max(5, h * 1.18);
  const beadX = x + f * width;

  ctx.save();
  // Full track
  ctx.fillStyle = trackBg;
  ctx.beginPath();
  ctx.roundRect(x, yCenter - r, width, h, r);
  ctx.fill();

  // Filled portion
  if (f > 0.002) {
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(x, yCenter - r, Math.max(h, f * width), h, r);
    ctx.fill();
  }

  // Circular marker bead
  ctx.fillStyle = accent;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(1.1, h * 0.28);
  ctx.beginPath();
  ctx.arc(beadX, yCenter, beadR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Subtle inner highlight ring
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = Math.max(0.8, h * 0.18);
  ctx.beginPath();
  ctx.arc(beadX, yCenter, beadR * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
