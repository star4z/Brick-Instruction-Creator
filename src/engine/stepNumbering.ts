/**
 * Step numbering model.
 *
 * Every step carries two numbers:
 *  - `num`    — the *printed* (display) step number. It restarts at 1 for each
 *               submodel chapter (and for non-classic minifigure chapters), so it
 *               is NOT unique across the manual.
 *  - `absNum` — the *absolute* step number: a 1-based, gap-free index across every
 *               chapter in manual order. It is unique and is the only number that
 *               step ranges (camera-angle ranges, layout groups, overview range
 *               selection, diagnostics lookups) may use.
 *
 * See docs/ABSOLUTE_STEP_NUMBERING_DESIGN.md.
 */

export interface NumberedStepLike {
  num: number;
  absNum?: number;
}

export interface NumberedChapterLike<S extends NumberedStepLike = NumberedStepLike> {
  kind?: string;
  steps: S[];
}

/** Assigns `absNum` (1..N) to every step across all chapters in manual order. Returns N. */
export function assignAbsoluteStepNumbers(chapters: ReadonlyArray<NumberedChapterLike>): number {
  let abs = 0;
  for (const ch of chapters) {
    for (const s of ch.steps) s.absNum = ++abs;
  }
  return abs;
}

/** Returns the absolute number for a step, falling back to its printed number. */
export function getAbsStepNum(step: NumberedStepLike | null | undefined): number {
  if (!step) return 0;
  return typeof step.absNum === 'number' && step.absNum > 0 ? step.absNum : step.num;
}

/** Short label showing both numbers, e.g. `Step 3 · #11`. Omits the absolute part when equal. */
export function formatDualStepLabel(step: NumberedStepLike, opts: { alwaysShowAbs?: boolean } = {}): string {
  const abs = getAbsStepNum(step);
  if (!opts.alwaysShowAbs && abs === step.num) return `Step ${step.num}`;
  return `Step ${step.num} · #${abs}`;
}

/** Formats an inclusive absolute range, e.g. `#4–#9` or `#4`. */
export function formatAbsRange(lo: number, hi: number): string {
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  return a === b ? `#${a}` : `#${a}–#${b}`;
}

/** An inclusive 1-based absolute step span [start..end] with start <= end. */
export interface StepRangeSpan {
  start: number;
  end: number;
}

/**
 * Normalizes a list of inclusive 1-based step spans:
 * clamps values to >= 1 (and <= maxStep when given), orders start <= end,
 * sorts ascending, and merges overlapping or adjacent spans.
 */
export function normalizeStepRangeSpans(
  spans: ReadonlyArray<StepRangeSpan> | null | undefined,
  maxStep?: number,
): StepRangeSpan[] {
  if (!Array.isArray(spans) || spans.length === 0) return [];
  const cap = typeof maxStep === 'number' && Number.isFinite(maxStep) && maxStep >= 1
    ? Math.floor(maxStep)
    : null;
  const cleaned: StepRangeSpan[] = [];
  for (const sp of spans) {
    if (!sp || typeof sp !== 'object') continue;
    const rawA = Number(sp.start);
    const rawB = Number(sp.end);
    if (!Number.isFinite(rawA) || !Number.isFinite(rawB)) continue;
    let a = Math.max(1, Math.round(Math.min(rawA, rawB)));
    let b = Math.max(1, Math.round(Math.max(rawA, rawB)));
    if (cap !== null) {
      if (a > cap) continue;
      b = Math.min(b, cap);
    }
    cleaned.push({ start: a, end: b });
  }
  if (cleaned.length === 0) return [];
  cleaned.sort((x, y) => x.start - y.start || x.end - y.end);
  const merged: StepRangeSpan[] = [{ ...cleaned[0] }];
  for (let i = 1; i < cleaned.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = cleaned[i];
    if (cur.start <= prev.end + 1) {
      prev.end = Math.max(prev.end, cur.end);
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

/** Converts an iterable of 1-based step numbers into sorted, merged StepRangeSpans. */
export function stepSetToRangeSpans(
  steps: Iterable<number>,
  maxStep?: number,
): StepRangeSpan[] {
  const cap = typeof maxStep === 'number' && Number.isFinite(maxStep) && maxStep >= 1
    ? Math.floor(maxStep)
    : null;
  const nums: number[] = [];
  for (const n of steps) {
    if (typeof n !== 'number' || !Number.isFinite(n)) continue;
    const r = Math.round(n);
    if (r < 1) continue;
    if (cap !== null && r > cap) continue;
    nums.push(r);
  }
  if (nums.length === 0) return [];
  nums.sort((a, b) => a - b);
  const out: StepRangeSpan[] = [];
  let start = nums[0];
  let end = nums[0];
  for (let i = 1; i < nums.length; i++) {
    const n = nums[i];
    if (n === end) continue;
    if (n === end + 1) {
      end = n;
    } else {
      out.push({ start, end });
      start = n;
      end = n;
    }
  }
  out.push({ start, end });
  return out;
}

/** Expands StepRangeSpans into a Set of 1-based absolute step numbers. */
export function rangeSpansToStepSet(spans: ReadonlyArray<StepRangeSpan> | null | undefined): Set<number> {
  const set = new Set<number>();
  for (const sp of normalizeStepRangeSpans(spans)) {
    for (let n = sp.start; n <= sp.end; n++) set.add(n);
  }
  return set;
}

/** Returns true if `stepNum` falls inside any span. */
export function isStepInRangeSpans(
  stepNum: number,
  spans: ReadonlyArray<StepRangeSpan> | null | undefined,
): boolean {
  if (!spans || spans.length === 0) return false;
  for (const sp of spans) {
    const lo = Math.min(sp.start, sp.end);
    const hi = Math.max(sp.start, sp.end);
    if (stepNum >= lo && stepNum <= hi) return true;
  }
  return false;
}

/** Returns true if any span in `a` shares at least one step with any span in `b`. */
export function doRangeSpansOverlap(
  a: ReadonlyArray<StepRangeSpan>,
  b: ReadonlyArray<StepRangeSpan>,
): boolean {
  for (const sa of a) {
    const aLo = Math.min(sa.start, sa.end);
    const aHi = Math.max(sa.start, sa.end);
    for (const sb of b) {
      const bLo = Math.min(sb.start, sb.end);
      const bHi = Math.max(sb.start, sb.end);
      if (aLo <= bHi && aHi >= bLo) return true;
    }
  }
  return false;
}

/** Counts total unique steps covered by the given spans. */
export function countStepsInRangeSpans(spans: ReadonlyArray<StepRangeSpan> | null | undefined): number {
  let total = 0;
  for (const sp of normalizeStepRangeSpans(spans)) {
    total += sp.end - sp.start + 1;
  }
  return total;
}

/**
 * Formats a list of spans into a compact label.
 * Default: `#1–#3, #5, #8–#10`. With `{ prefix: '', rangeDash: '-' }`: `1-3, 5, 8-10`.
 */
export function formatStepRangeSpans(
  spans: ReadonlyArray<StepRangeSpan> | null | undefined,
  opts: { prefix?: string; separator?: string; rangeDash?: string } = {},
): string {
  const norm = normalizeStepRangeSpans(spans);
  if (norm.length === 0) return '';
  const prefix = opts.prefix ?? '#';
  const separator = opts.separator ?? ', ';
  const rangeDash = opts.rangeDash ?? '–';
  return norm
    .map((sp) => (sp.start === sp.end ? `${prefix}${sp.start}` : `${prefix}${sp.start}${rangeDash}${prefix}${sp.end}`))
    .join(separator);
}

/**
 * Parses a user-entered step range expression such as `"1-3, 5, 8–10"` or `"#1-#3, #5"`
 * into normalized, sorted, merged StepRangeSpans.
 */
export function parseStepRangeInput(input: string | null | undefined, maxStep?: number): StepRangeSpan[] {
  if (typeof input !== 'string') return [];
  const trimmed = input.trim();
  if (!trimmed) return [];
  const tokens = trimmed.split(/[,;]+/);
  const rawSpans: StepRangeSpan[] = [];
  for (const tok of tokens) {
    const part = tok.trim().replace(/#/g, '');
    if (!part) continue;
    const rangeMatch = part.match(/^(\d+)\s*[-–—]\s*(\d+)$/);
    if (rangeMatch) {
      const a = parseInt(rangeMatch[1], 10);
      const b = parseInt(rangeMatch[2], 10);
      if (a >= 1 && b >= 1) rawSpans.push({ start: Math.min(a, b), end: Math.max(a, b) });
      continue;
    }
    const singleMatch = part.match(/^(\d+)$/);
    if (singleMatch) {
      const n = parseInt(singleMatch[1], 10);
      if (n >= 1) rawSpans.push({ start: n, end: n });
    }
  }
  return normalizeStepRangeSpans(rawSpans, maxStep);
}

export interface LegacyGroupLike {
  startStepNum: number;
  endStepNum: number;
  stepRanges?: StepRangeSpan[];
  stepBasis?: 'absolute' | 'legacy' | null;
}

export interface StepNumberRef {
  num: number;
  absNum: number;
  /** True for steps that used the continuous (pre-absolute) main numbering. */
  isMain: boolean;
}

/**
 * Converts layout groups saved before absolute numbering existed (whose ranges
 * referenced printed main-build step numbers) to absolute ranges.
 *
 * The legacy start maps to the first main step whose printed num ≥ start; the
 * legacy end maps to the last main step whose printed num ≤ end. Groups with no
 * matching main steps keep their raw values. All returned groups are tagged
 * `stepBasis: 'absolute'`.
 */
export function migrateLegacyLayoutGroups<G extends LegacyGroupLike>(
  groups: ReadonlyArray<G>,
  steps: ReadonlyArray<StepNumberRef>,
): G[] {
  const main = steps.filter((s) => s.isMain);
  return groups.map((g) => {
    if (g.stepBasis === 'absolute') return g;
    const lo = Math.min(g.startStepNum, g.endStepNum);
    const hi = Math.max(g.startStepNum, g.endStepNum);
    const first = main.find((s) => s.num >= lo && s.num <= hi);
    let last: StepNumberRef | undefined;
    for (let i = main.length - 1; i >= 0; i--) {
      if (main[i].num >= lo && main[i].num <= hi) { last = main[i]; break; }
    }
    if (!first || !last) return { ...g, stepBasis: 'absolute' };
    const absStart = first.absNum;
    const absEnd = Math.max(first.absNum, last.absNum);
    return {
      ...g,
      startStepNum: absStart,
      endStepNum: absEnd,
      ...(g.stepRanges ? { stepRanges: [{ start: absStart, end: absEnd }] } : {}),
      stepBasis: 'absolute',
    };
  });
}

export interface RangeChapterLike {
  id: string;
  kind?: string;
  sectionId?: string | null;
  steps: NumberedStepLike[];
}

export interface AbsRange {
  lo: number;
  hi: number;
}

/** Absolute range covering every step of one chapter (e.g. a single submodel). */
export function getChapterAbsRange(ch: RangeChapterLike | null | undefined): AbsRange | null {
  if (!ch || !ch.steps.length) return null;
  return { lo: getAbsStepNum(ch.steps[0]), hi: getAbsStepNum(ch.steps[ch.steps.length - 1]) };
}

/**
 * Absolute range covering every non-submodel chapter that shares the source chapter's section
 * (e.g. all bags of the main build). For a submodel source this is just that submodel.
 */
export function getSectionAbsRange(
  chapters: ReadonlyArray<RangeChapterLike>,
  ch: RangeChapterLike | null | undefined,
): AbsRange | null {
  if (!ch) return null;
  if (ch.kind === 'submodel') return getChapterAbsRange(ch);
  const sec = ch.sectionId || ch.id;
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of chapters) {
    if (c.kind === 'submodel' || (c.sectionId || c.id) !== sec) continue;
    const r = getChapterAbsRange(c);
    if (!r) continue;
    lo = Math.min(lo, r.lo);
    hi = Math.max(hi, r.hi);
  }
  return Number.isFinite(lo) ? { lo, hi } : getChapterAbsRange(ch);
}
