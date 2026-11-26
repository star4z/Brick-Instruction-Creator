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
 *   - Bottom-Edge Build Progress Bar (`computeAbsoluteStepProgressFraction`, `buildProgressBarHtml`,
 *     `drawProgressBarCanvas`): sleek horizontal track with circular bead marker tracking
 *     progress continuously across the model's absolute steps (`1..N`).
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
 * across the entire model's absolute step sequence (`1..totalAbsoluteSteps`).
 *
 * Advances monotonically from `0` at absolute step `#1` to `1` at the final absolute step
 * `#N` across all chapters (minifigures, submodels, bags, and main build), without
 * finishing early or restarting when printed step labels reset.
 */
export function computeAbsoluteStepProgressFraction(
  absoluteStepNum: number,
  totalAbsoluteSteps: number,
): number {
  if (!Number.isFinite(totalAbsoluteSteps) || totalAbsoluteSteps <= 1) return 1;
  if (!Number.isFinite(absoluteStepNum)) return 0;
  const clamped = Math.max(1, Math.min(totalAbsoluteSteps, absoluteStepNum));
  return (clamped - 1) / (totalAbsoluteSteps - 1);
}

/**
 * Computes a normalized `0..1` progress fraction for a 0-based index within a fixed count.
 */
export function computeBagProgressFraction(
  stepIndexInStage: number,
  totalStepsInStage: number,
): number {
  if (totalStepsInStage <= 1) return 1;
  const clamped = Math.max(0, Math.min(totalStepsInStage - 1, stepIndexInStage));
  return clamped / (totalStepsInStage - 1);
}

export type ProgressBarSpanMode = 'page' | 'spread';
export type ProgressBarSegment = 'full' | 'left' | 'right';

export interface StepPageProgressDescriptor {
  /** 1-based physical page number. */
  pageNum: number;
  /** True when this page renders step slots and a build progress bar. */
  isStepPage: boolean;
  /** Highest absolute step number rendered on this page (0 if unavailable). */
  lastAbsStepNum: number;
}

export interface ResolvedPageProgressBar {
  /**
   * Normalized `0..1` build progress across the full bar:
   * always `0` on the first step page/spread (all the way to the left) and `1` on the
   * final step page/spread when there are 2+ step pages/spreads.
   */
  fraction: number;
  /**
   * Horizontal portion of the bar drawn on this page:
   * - `'full'`: complete `0..1` bar on a single page
   * - `'left'`: left half (`0..0.5`) on an even (verso) page, extending flush to the right spine
   * - `'right'`: right half (`0.5..1.0`) on an odd (recto) page, starting flush at the left spine
   */
  segment: ProgressBarSegment;
}

export interface ProgressBarSegmentRender {
  /** Normalized `0..1` fill ratio within this page's track width. */
  localFill: number;
  /** Normalized `0..1` bead position within this page's track width, or `null` when the bead sits on the facing page. */
  beadPos: number | null;
  /** Whether the left end of this track is rounded (false when flush with the left spine). */
  roundLeft: boolean;
  /** Whether the right end of this track is rounded (false when flush with the right spine). */
  roundRight: boolean;
}

/**
 * Resolves the normalized `0..1` progress fraction and horizontal bar segment for a step page.
 *
 * - Anchors the first step page/spread to `0` (all the way to the left) even when the first
 *   step page packs multiple steps, and the final step page/spread to `1` (all the way to the right).
 * - In `'spread'` mode (for double-sided booklet printing), facing even/odd step page pairs
 *   `(2k, 2k+1)` share one continuous progress bar across the center spine (`'left'` for `2k`,
 *   `'right'` for `2k+1`) with a single shared spread progress fraction. Any step page whose
 *   facing partner is not a step page falls back cleanly to `'full'` so the marker bead is
 *   always visible.
 */
export function resolvePageProgressBar(
  pages: readonly StepPageProgressDescriptor[],
  targetPageNum: number,
  span: ProgressBarSpanMode = 'page',
): ResolvedPageProgressBar | null {
  if (!Array.isArray(pages) || pages.length === 0) return null;
  const byNum = new Map<number, StepPageProgressDescriptor>();
  for (const p of pages) {
    if (p && Number.isFinite(p.pageNum)) byNum.set(p.pageNum, p);
  }
  const target = byNum.get(targetPageNum);
  if (!target || !target.isStepPage) return null;

  interface ProgressUnit {
    key: string;
    endStep: number;
    pageNums: number[];
  }

  const units: ProgressUnit[] = [];
  const unitByPage = new Map<number, { unitIndex: number; segment: ProgressBarSegment }>();
  const seenUnits = new Map<string, number>();

  const ordered = [...pages].filter((p) => p && p.isStepPage).sort((a, b) => a.pageNum - b.pageNum);
  for (const p of ordered) {
    let segment: ProgressBarSegment = 'full';
    let key = `p:${p.pageNum}`;
    let endStep = Number.isFinite(p.lastAbsStepNum) && p.lastAbsStepNum > 0 ? p.lastAbsStepNum : 0;

    if (span === 'spread') {
      const isEven = p.pageNum % 2 === 0;
      const partnerNum = isEven ? p.pageNum + 1 : p.pageNum - 1;
      const partner = byNum.get(partnerNum);
      if (partner && partner.isStepPage) {
        segment = isEven ? 'left' : 'right';
        const leftNum = isEven ? p.pageNum : partnerNum;
        key = `s:${leftNum}`;
        const partnerEnd = Number.isFinite(partner.lastAbsStepNum) && partner.lastAbsStepNum > 0
          ? partner.lastAbsStepNum
          : 0;
        endStep = Math.max(endStep, partnerEnd);
      }
    }

    let unitIndex = seenUnits.get(key);
    if (unitIndex === undefined) {
      unitIndex = units.length;
      seenUnits.set(key, unitIndex);
      units.push({ key, endStep, pageNums: [p.pageNum] });
    } else {
      units[unitIndex].endStep = Math.max(units[unitIndex].endStep, endStep);
      units[unitIndex].pageNums.push(p.pageNum);
    }
    unitByPage.set(p.pageNum, { unitIndex, segment });
  }

  const resolved = unitByPage.get(targetPageNum);
  if (!resolved) return null;
  if (units.length <= 1) {
    return { fraction: 0, segment: resolved.segment };
  }

  const firstUnit = units[0];
  const lastUnit = units[units.length - 1];
  const targetUnit = units[resolved.unitIndex];

  let fraction: number;
  if (
    firstUnit.endStep > 0 &&
    lastUnit.endStep > firstUnit.endStep &&
    targetUnit.endStep > 0
  ) {
    fraction = Math.max(
      0,
      Math.min(1, (targetUnit.endStep - firstUnit.endStep) / (lastUnit.endStep - firstUnit.endStep)),
    );
  } else {
    fraction = Math.max(0, Math.min(1, resolved.unitIndex / (units.length - 1)));
  }

  return { fraction, segment: resolved.segment };
}

/**
 * Projects a full `0..1` progress fraction onto a `'full'`, `'left'` (0..0.5),
 * or `'right'` (0.5..1.0) progress bar segment.
 */
export function computeProgressBarSegmentRender(
  fraction: number,
  segment: ProgressBarSegment = 'full',
): ProgressBarSegmentRender {
  const f = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  if (segment === 'left') {
    const localFill = Math.max(0, Math.min(1, f * 2));
    const showBead = f <= 0.5 + 1e-6;
    return {
      localFill,
      beadPos: showBead ? localFill : null,
      roundLeft: true,
      roundRight: false,
    };
  }
  if (segment === 'right') {
    const localFill = Math.max(0, Math.min(1, (f - 0.5) * 2));
    const showBead = f >= 0.5 - 1e-6;
    return {
      localFill,
      beadPos: showBead ? localFill : null,
      roundLeft: false,
      roundRight: true,
    };
  }
  return {
    localFill: f,
    beadPos: f,
    roundLeft: true,
    roundRight: true,
  };
}

/**
 * Builds the sleek bottom-edge horizontal progress bar HTML with circular marker bead
 * for Live DOM Preview & Interactive HTML Export.
 */
export function buildProgressBarHtml(
  fraction: number,
  opts?: { accent?: string; trackBg?: string; heightPx?: number; segment?: ProgressBarSegment },
): string {
  const f = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const segment: ProgressBarSegment = opts?.segment === 'left' || opts?.segment === 'right' ? opts.segment : 'full';
  const seg = computeProgressBarSegmentRender(f, segment);
  const fillPct = (seg.localFill * 100).toFixed(2);
  const accent = opts?.accent || '#1d4ed8';
  const trackBg = opts?.trackBg || 'rgba(100,116,139,0.28)';
  const h = Math.max(3, Math.round(opts?.heightPx ?? 4));
  const bead = Math.max(9, h * 2 + 2);
  const trackRadius = `${seg.roundLeft ? '999px' : '0'} ${seg.roundRight ? '999px' : '0'} ${seg.roundRight ? '999px' : '0'} ${seg.roundLeft ? '999px' : '0'}`;
  const fillRoundRight = seg.roundRight || seg.localFill < 0.999;
  const fillRadius = `${seg.roundLeft ? '999px' : '0'} ${fillRoundRight ? '999px' : '0'} ${fillRoundRight ? '999px' : '0'} ${seg.roundLeft ? '999px' : '0'}`;
  const beadHtml = seg.beadPos !== null
    ? `<div class="biw-progress-bead" style="position:absolute;top:50%;left:${(seg.beadPos * 100).toFixed(2)}%;width:${bead}px;height:${bead}px;transform:translate(-50%,-50%);border-radius:999px;background:${accent};border:1.5px solid #0f172a;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,0.45);"></div>`
    : '';

  return `<div class="biw-progress-bar relative flex-1 flex items-center" data-progress-fraction="${f.toFixed(4)}" data-progress-segment="${segment}" style="height:${bead}px;min-width:60px;" aria-hidden="true">` +
    `<div style="position:relative;width:100%;height:${h}px;border-radius:${trackRadius};background:${trackBg};overflow:visible;">` +
      `<div style="position:absolute;left:0;top:0;height:100%;width:${fillPct}%;border-radius:${fillRadius};background:${accent};"></div>` +
      beadHtml +
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
  opts?: { accent?: string; trackBg?: string; barHeight?: number; segment?: ProgressBarSegment },
): void {
  if (width < 24) return;
  const f = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const segment: ProgressBarSegment = opts?.segment === 'left' || opts?.segment === 'right' ? opts.segment : 'full';
  const seg = computeProgressBarSegmentRender(f, segment);
  const accent = opts?.accent || '#1d4ed8';
  const trackBg = opts?.trackBg || 'rgba(100,116,139,0.32)';
  const h = Math.max(3, opts?.barHeight ?? 4.5);
  const r = h / 2;
  const rL = seg.roundLeft ? r : 0;
  const rR = seg.roundRight ? r : 0;
  const beadR = Math.max(5, h * 1.18);

  ctx.save();
  // Full track
  ctx.fillStyle = trackBg;
  ctx.beginPath();
  ctx.roundRect(x, yCenter - r, width, h, [rL, rR, rR, rL]);
  ctx.fill();

  // Filled portion
  if (seg.localFill > 0.002) {
    const fillW = seg.localFill >= 0.999 ? width : Math.max(h, seg.localFill * width);
    const fillRR = seg.roundRight || seg.localFill < 0.999 ? r : 0;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.roundRect(x, yCenter - r, fillW, h, [rL, fillRR, fillRR, rL]);
    ctx.fill();
  }

  // Circular marker bead (omitted when bead sits on the facing spread page)
  if (seg.beadPos !== null) {
    const beadX = x + seg.beadPos * width;
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
  }
  ctx.restore();
}
