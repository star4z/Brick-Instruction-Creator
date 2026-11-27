/**
 * Hash URL Routing for Manual Pages & App Views
 *
 * Provides stable, bookmarkable, GitHub-Pages-safe hash URLs for:
 * - Manual pages: `#/cover`, `#/page/3`, `#/step/12`, `#/complete`, `#/parts-list`, `#/parts-list/2`, `#/back-cover`
 * - App views / modals: `#/settings`, `#/bricks-library`, `#/overview`, `#/page-setup`,
 *   `#/parts-list-setup`, `#/export`, `#/issues`, `#/shortcuts`, `#/open`
 * - Composed page + modal URLs: e.g. `#/page/4?view=settings` or `#/cover?view=page-setup`
 *
 * Unknown, empty, or out-of-range routes return null so the app falls back to
 * its default behavior (saved `prefs.pageIdx` or welcome screen).
 */

export type AppModalRouteId =
  | 'settings'
  | 'bricks-library'
  | 'overview'
  | 'page-setup'
  | 'parts-list-setup'
  | 'export'
  | 'issues'
  | 'shortcuts'
  | 'open';

export const APP_MODAL_ROUTE_IDS: readonly AppModalRouteId[] = [
  'settings',
  'bricks-library',
  'overview',
  'page-setup',
  'parts-list-setup',
  'export',
  'issues',
  'shortcuts',
  'open',
] as const;

const APP_MODAL_ROUTE_SET = new Set<string>(APP_MODAL_ROUTE_IDS);

export type ManualPageRouteTarget =
  | { kind: 'page'; pageNum: number }
  | { kind: 'step'; stepNum: number }
  | { kind: 'cover' }
  | { kind: 'complete' }
  | { kind: 'parts-list'; bomPageNum?: number }
  | { kind: 'back-cover' };

export interface ParsedAppRoute {
  page: ManualPageRouteTarget | null;
  modal: AppModalRouteId | null;
}

export interface RoutablePageLike {
  kind?: string;
  num?: number;
  slots?: Array<{ step?: { num?: number }; num?: number }>;
}

function parsePositiveInt(raw: string | undefined): number | null {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isSafeInteger(n) && n >= 1 ? n : null;
}

export function isAppModalRouteId(value: string | null | undefined): value is AppModalRouteId {
  return typeof value === 'string' && APP_MODAL_ROUTE_SET.has(value);
}

/**
 * Parses a URL hash (e.g. `#/page/3?view=settings`, `#/cover`, `#/bricks-library`)
 * into a structured route. Returns `null` if the hash is empty or unrecognized.
 */
export function parseAppRoute(rawHash: string | null | undefined): ParsedAppRoute | null {
  if (typeof rawHash !== 'string') return null;
  const trimmed = rawHash.trim();
  if (!trimmed || trimmed === '#' || trimmed === '#/') return null;

  const withoutHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
  const qIdx = withoutHash.indexOf('?');
  const pathPart = (qIdx >= 0 ? withoutHash.slice(0, qIdx) : withoutHash).replace(/^\/+|\/+$/g, '');
  const queryPart = qIdx >= 0 ? withoutHash.slice(qIdx + 1) : '';

  const segments = pathPart ? pathPart.split('/').map((s) => decodeURIComponent(s).toLowerCase()) : [];
  let modalFromQuery: AppModalRouteId | null = null;
  if (queryPart) {
    const params = new URLSearchParams(queryPart);
    const viewParam = params.get('view')?.trim().toLowerCase();
    if (isAppModalRouteId(viewParam)) {
      modalFromQuery = viewParam;
    }
  }

  let page: ManualPageRouteTarget | null = null;
  let modal: AppModalRouteId | null = modalFromQuery;

  if (segments.length === 0) {
    return modal ? { page: null, modal } : null;
  }

  const head = segments[0];
  if (isAppModalRouteId(head) && segments.length === 1) {
    modal = head;
  } else if (head === 'page' && segments.length === 2) {
    const pageNum = parsePositiveInt(segments[1]);
    if (pageNum) page = { kind: 'page', pageNum };
  } else if (head === 'step' && segments.length === 2) {
    const stepNum = parsePositiveInt(segments[1]);
    if (stepNum) page = { kind: 'step', stepNum };
  } else if (head === 'cover' && segments.length === 1) {
    page = { kind: 'cover' };
  } else if (head === 'complete' && segments.length === 1) {
    page = { kind: 'complete' };
  } else if ((head === 'parts-list' || head === 'bom') && segments.length <= 2) {
    if (segments.length === 1) {
      page = { kind: 'parts-list' };
    } else {
      const bomPageNum = parsePositiveInt(segments[1]);
      if (bomPageNum) page = { kind: 'parts-list', bomPageNum };
    }
  } else if (head === 'back-cover' && segments.length === 1) {
    page = { kind: 'back-cover' };
  }

  if (!page && !modal) return null;
  return { page, modal };
}

/**
 * Formats a manual page target + optional modal into a canonical hash string
 * (or `''` when neither is present).
 */
export function formatAppRoute(route: {
  page?: ManualPageRouteTarget | null;
  modal?: AppModalRouteId | null;
}): string {
  const page = route.page ?? null;
  const modal = route.modal && isAppModalRouteId(route.modal) ? route.modal : null;

  let path = '';
  if (page) {
    switch (page.kind) {
      case 'cover':
        path = '/cover';
        break;
      case 'complete':
        path = '/complete';
        break;
      case 'back-cover':
        path = '/back-cover';
        break;
      case 'parts-list':
        path = page.bomPageNum && page.bomPageNum > 1
          ? `/parts-list/${Math.floor(page.bomPageNum)}`
          : '/parts-list';
        break;
      case 'step':
        path = `/step/${Math.max(1, Math.floor(page.stepNum))}`;
        break;
      case 'page':
        path = `/page/${Math.max(1, Math.floor(page.pageNum))}`;
        break;
    }
  }

  if (path && modal) {
    return `#${path}?view=${modal}`;
  }
  if (path) {
    return `#${path}`;
  }
  if (modal) {
    return `#/${modal}`;
  }
  return '';
}

/**
 * Builds the canonical `ManualPageRouteTarget` for the page at `pageIdx`.
 */
export function buildPageTargetFromPage(
  pages: readonly RoutablePageLike[],
  pageIdx: number,
): ManualPageRouteTarget | null {
  if (!Array.isArray(pages) || pageIdx < 0 || pageIdx >= pages.length) return null;
  const page = pages[pageIdx];
  if (!page) return null;

  if (page.kind === 'cover') return { kind: 'cover' };
  if (page.kind === 'complete') return { kind: 'complete' };
  if (page.kind === 'back') return { kind: 'back-cover' };
  if (page.kind === 'bom') {
    let bomIdx = 0;
    for (let i = 0; i <= pageIdx; i++) {
      if (pages[i]?.kind === 'bom') bomIdx++;
    }
    return bomIdx > 1 ? { kind: 'parts-list', bomPageNum: bomIdx } : { kind: 'parts-list' };
  }
  return { kind: 'page', pageNum: pageIdx + 1 };
}

/**
 * Resolves a parsed `ManualPageRouteTarget` to a 0-based index into `pages`,
 * or `null` if the target does not exist in the current manual (triggering fallback).
 */
export function resolvePageIndexFromRouteTarget(
  pages: readonly RoutablePageLike[],
  target: ManualPageRouteTarget | null | undefined,
): number | null {
  if (!target || !Array.isArray(pages) || pages.length === 0) return null;

  switch (target.kind) {
    case 'cover': {
      const idx = pages.findIndex((p) => p?.kind === 'cover');
      return idx >= 0 ? idx : null;
    }
    case 'complete': {
      const idx = pages.findIndex((p) => p?.kind === 'complete');
      return idx >= 0 ? idx : null;
    }
    case 'back-cover': {
      const idx = pages.findIndex((p) => p?.kind === 'back');
      return idx >= 0 ? idx : null;
    }
    case 'parts-list': {
      const bomIndices: number[] = [];
      for (let i = 0; i < pages.length; i++) {
        if (pages[i]?.kind === 'bom') bomIndices.push(i);
      }
      if (bomIndices.length === 0) return null;
      const wanted = Math.max(1, target.bomPageNum ?? 1);
      return wanted <= bomIndices.length ? bomIndices[wanted - 1] : null;
    }
    case 'step': {
      const idx = pages.findIndex((p) =>
        Array.isArray(p?.slots) &&
        p.slots.some((slot: { step?: { num?: number }; num?: number }) => (slot?.step?.num ?? slot?.num) === target.stepNum),
      );
      return idx >= 0 ? idx : null;
    }
    case 'page': {
      const idx = target.pageNum - 1;
      return idx >= 0 && idx < pages.length ? idx : null;
    }
  }
}
