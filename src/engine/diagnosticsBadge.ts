/**
 * Model diagnostics notification badge tracking.
 *
 * The floating menu icon badge (#menuBtnErrorBadge) alerts the user to unseen
 * model errors/warnings and clears once the user opens the Errors & Warnings
 * page (modal). Inside the menu drawer, the Errors & Warnings row pill
 * continues to display the full active diagnostic count.
 */

export interface ModelDiagnosticLike {
  category: string;
  severity: string;
  title: string;
  partCode?: string;
  colorId?: number | string;
  detail?: string;
  stepNum?: number | null;
}

/**
 * Produces a stable identity key for a diagnostic item so previously viewed
 * errors remain acknowledged across renders, partial fixes, and reloads, while
 * genuinely new errors surface on the menu icon badge again.
 */
export function getDiagnosticKey(diag: ModelDiagnosticLike): string {
  if (diag.category === 'missing_shape' && diag.partCode) {
    return `missing_shape:${String(diag.partCode).toLowerCase()}`;
  }
  if (diag.category === 'color' && diag.colorId !== undefined && diag.colorId !== null) {
    return `color:${String(diag.colorId)}`;
  }
  return `${diag.category}:${diag.severity}:${diag.title}:${diag.detail ?? ''}`;
}

/**
 * Marks all current diagnostics as seen/acknowledged by returning a new set
 * containing both previously seen keys and all keys from `diagnostics`.
 */
export function acknowledgeDiagnostics(
  diagnostics: readonly ModelDiagnosticLike[],
  seenKeys: ReadonlySet<string>,
): Set<string> {
  const next = new Set(seenKeys);
  for (const diag of diagnostics) {
    next.add(getDiagnosticKey(diag));
  }
  return next;
}

/**
 * Retains only seen keys that still correspond to an active diagnostic so that
 * resolved errors can notify again if they reappear later (e.g. after clearing
 * the Bricks Library) and persisted state stays compact.
 */
export function pruneSeenDiagnosticKeys(
  diagnostics: readonly ModelDiagnosticLike[],
  seenKeys: ReadonlySet<string>,
): Set<string> {
  if (diagnostics.length === 0 || seenKeys.size === 0) return new Set();
  const activeKeys = new Set(diagnostics.map(getDiagnosticKey));
  const pruned = new Set<string>();
  for (const key of seenKeys) {
    if (activeKeys.has(key)) pruned.add(key);
  }
  return pruned;
}

/**
 * Counts how many active diagnostics have not yet been viewed on the errors page.
 */
export function getMenuIconErrorBadgeCount(
  diagnostics: readonly ModelDiagnosticLike[],
  seenKeys: ReadonlySet<string>,
): number {
  let unseen = 0;
  for (const diag of diagnostics) {
    if (!seenKeys.has(getDiagnosticKey(diag))) {
      unseen++;
    }
  }
  return unseen;
}

/**
 * Formats the menu icon error badge label (capped at "99+").
 */
export function formatMenuIconErrorBadge(count: number): string {
  if (count <= 0) return '0';
  return count > 99 ? '99+' : String(count);
}

export function serializeSeenDiagnosticKeys(seenKeys: ReadonlySet<string>): string[] {
  return Array.from(seenKeys);
}

export function deserializeSeenDiagnosticKeys(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((item): item is string => typeof item === 'string' && item.length > 0));
}
