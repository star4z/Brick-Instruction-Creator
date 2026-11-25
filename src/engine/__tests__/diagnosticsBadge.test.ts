import { describe, expect, it } from 'vitest';
import {
  type ModelDiagnosticLike,
  acknowledgeDiagnostics,
  deserializeSeenDiagnosticKeys,
  formatMenuIconErrorBadge,
  getDiagnosticKey,
  getMenuIconErrorBadgeCount,
  pruneSeenDiagnosticKeys,
  serializeSeenDiagnosticKeys,
} from '../diagnosticsBadge';

const missingBrick: ModelDiagnosticLike = {
  category: 'missing_shape',
  severity: 'error',
  title: 'Brick 2 x 4 (3×)',
  partCode: '3001.dat',
  detail: 'Missing shape in Step 1.',
  stepNum: 1,
};

const missingTile: ModelDiagnosticLike = {
  category: 'missing_shape',
  severity: 'error',
  title: 'Tile 1 x 2 (1×)',
  partCode: '3069b.dat',
  detail: 'Missing shape in Step 4.',
  stepNum: 4,
};

const floatingPart: ModelDiagnosticLike = {
  category: 'floating',
  severity: 'error',
  title: 'Floating piece: Plate 1 x 1',
  detail: 'Part "3024" in Step 2 is floating 2.00 studs above the ground with no nearby pieces touching it.',
  stepNum: 2,
};

const unknownColor: ModelDiagnosticLike = {
  category: 'color',
  severity: 'warning',
  colorId: 999,
  title: 'Unknown LDraw color #999 (2×)',
  detail: 'Color ID 999 is not in the color palette and fell back to Light Bluish Gray. First seen in Step 3.',
  stepNum: 3,
};

describe('Menu icon error badge acknowledgement', () => {
  it('shows all errors on the menu icon badge before the user opens the errors page', () => {
    const diagnostics = [missingBrick, floatingPart, unknownColor];
    expect(getMenuIconErrorBadgeCount(diagnostics, new Set())).toBe(3);
  });

  it('clears the menu icon badge once the user views the errors page', () => {
    const diagnostics = [missingBrick, floatingPart, unknownColor];
    const seen = acknowledgeDiagnostics(diagnostics, new Set());
    expect(getMenuIconErrorBadgeCount(diagnostics, seen)).toBe(0);
  });

  it('keeps the badge hidden when some acknowledged errors are resolved and remaining ones were already seen', () => {
    const initial = [missingBrick, missingTile, floatingPart];
    const seenAfterViewing = acknowledgeDiagnostics(initial, new Set());

    // User fetches missingTile, leaving missingBrick and floatingPart
    const remaining = [missingBrick, floatingPart];
    const pruned = pruneSeenDiagnosticKeys(remaining, seenAfterViewing);
    expect(getMenuIconErrorBadgeCount(remaining, pruned)).toBe(0);
  });

  it('re-alerts on the menu icon badge when genuinely new errors appear or resolved errors return', () => {
    const initial = [missingBrick, floatingPart];
    let seen = acknowledgeDiagnostics(initial, new Set());
    expect(getMenuIconErrorBadgeCount(initial, seen)).toBe(0);

    // User resolves missingBrick via library import
    seen = pruneSeenDiagnosticKeys([floatingPart], seen);
    expect(getMenuIconErrorBadgeCount([floatingPart], seen)).toBe(0);

    // User clears library: missingBrick returns AND missingTile appears
    const afterClear = [missingBrick, missingTile, floatingPart];
    seen = pruneSeenDiagnosticKeys(afterClear, seen);
    expect(getMenuIconErrorBadgeCount(afterClear, seen)).toBe(2);
  });

  it('matches missing_shape and color diagnostics stably even when step numbering or counts shift', () => {
    const seen = acknowledgeDiagnostics([missingBrick, unknownColor], new Set());
    const renumberedMissing: ModelDiagnosticLike = {
      ...missingBrick,
      title: 'Brick 2 x 4 (5×)',
      detail: 'Missing shape in Steps 2, 7.',
      stepNum: 2,
    };
    const renumberedColor: ModelDiagnosticLike = {
      ...unknownColor,
      title: 'Unknown LDraw color #999 (4×)',
      detail: 'Color ID 999 is not in the color palette. First seen in Step 8.',
      stepNum: 8,
    };

    expect(getDiagnosticKey(renumberedMissing)).toBe(getDiagnosticKey(missingBrick));
    expect(getDiagnosticKey(renumberedColor)).toBe(getDiagnosticKey(unknownColor));
    expect(getMenuIconErrorBadgeCount([renumberedMissing, renumberedColor], seen)).toBe(0);
  });

  it('round-trips seen diagnostic keys cleanly for session persistence', () => {
    const seen = acknowledgeDiagnostics([missingBrick, floatingPart], new Set());
    const serialized = serializeSeenDiagnosticKeys(seen);
    const restored = deserializeSeenDiagnosticKeys(serialized);
    expect(getMenuIconErrorBadgeCount([missingBrick, floatingPart], restored)).toBe(0);

    // Gracefully ignores invalid persisted payloads
    expect(deserializeSeenDiagnosticKeys(null).size).toBe(0);
    expect(deserializeSeenDiagnosticKeys(['', 123, null, 'valid']).has('valid')).toBe(true);
    expect(deserializeSeenDiagnosticKeys(['', 123, null, 'valid']).size).toBe(1);
  });

  it('formats menu icon badge counts with 99+ cap', () => {
    expect(formatMenuIconErrorBadge(0)).toBe('0');
    expect(formatMenuIconErrorBadge(1)).toBe('1');
    expect(formatMenuIconErrorBadge(99)).toBe('99');
    expect(formatMenuIconErrorBadge(100)).toBe('99+');
  });

  it('tracks page-size layout warnings cleanly across acknowledgement, format switch, and resolution', () => {
    const a5LayoutWarning: ModelDiagnosticLike = {
      category: 'layout',
      severity: 'warning',
      title: 'Page size too small (4 steps, min 0.34 cm/stud)',
      detail: '4 steps cannot fit at A5 while keeping 1 stud >= 0.5 cm. Try US Letter.',
      stepNum: 12,
    };
    const halfLetterWarning: ModelDiagnosticLike = {
      category: 'layout',
      severity: 'warning',
      title: 'Page size too small (4 steps, min 0.31 cm/stud)',
      detail: '4 steps cannot fit at Half Letter while keeping 1 stud >= 0.5 cm. Try US Letter.',
      stepNum: 12,
    };

    // New layout warning shows on badge until Model Issues is viewed
    expect(getMenuIconErrorBadgeCount([a5LayoutWarning], new Set())).toBe(1);
    let seen = acknowledgeDiagnostics([a5LayoutWarning], new Set());
    expect(getMenuIconErrorBadgeCount([a5LayoutWarning], seen)).toBe(0);

    // Switching to another too-small paper size re-alerts with a distinct key
    seen = pruneSeenDiagnosticKeys([halfLetterWarning], seen);
    expect(getMenuIconErrorBadgeCount([halfLetterWarning], seen)).toBe(1);

    // Switching to a fitting paper size (or Screen Fit) resolves and prunes the warning
    seen = pruneSeenDiagnosticKeys([], seen);
    expect(seen.size).toBe(0);
    expect(getMenuIconErrorBadgeCount([], seen)).toBe(0);
  });
});
