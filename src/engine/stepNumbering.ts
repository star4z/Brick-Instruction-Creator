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

export interface LegacyGroupLike {
  startStepNum: number;
  endStepNum: number;
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
    return { ...g, startStepNum: first.absNum, endStepNum: Math.max(first.absNum, last.absNum), stepBasis: 'absolute' };
  });
}
