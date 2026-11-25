import { describe, expect, it } from 'vitest';
import {
  KEYBOARD_SHORTCUTS_STORAGE_KEY,
  SHORTCUT_ACTIONS,
  SHORTCUT_CATEGORIES,
  canRunShortcutAction,
  countCustomizedShortcuts,
  detectMacPlatform,
  eventToCanonicalCombo,
  filterShortcutActions,
  findShortcutConflict,
  formatShortcutCombo,
  formatShortcutTooltip,
  getEffectiveShortcut,
  getResetAllShortcutsNotice,
  isEditableEventTarget,
  isInteractiveActivationTarget,
  isShortcutCustomized,
  loadShortcutOverridesFromStorage,
  normalizeShortcutCombo,
  resetAllShortcutOverrides,
  resetShortcutOverride,
  resolveShortcutActionForEvent,
  sanitizeShortcutOverrides,
  saveShortcutOverridesToStorage,
  setShortcutOverride,
  validateRecordedCombo,
  type ShortcutMatchContext,
  type StorageLike,
} from '../keyboardShortcuts';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { store: Map<string, string> } {
  const store = new Map<string, string>(Object.entries(initial));
  return {
    store,
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

function stepPageContext(patch: Partial<ShortcutMatchContext> = {}): ShortcutMatchContext {
  return {
    blockingSurface: 'none',
    hasModel: true,
    pageKind: 'steps',
    mode: 'pan',
    selectedPartCount: 0,
    isRepeat: false,
    isMac: false,
    ...patch,
  };
}

describe('keyboardShortcuts default catalog invariants', () => {
  it('assigns unique, valid default bindings with zero collisions across all actions and secondary aliases', () => {
    const seenPrimary = new Set<string>();
    const categoryIds = new Set(SHORTCUT_CATEGORIES.map((c) => c.id));

    for (const action of SHORTCUT_ACTIONS) {
      expect(categoryIds.has(action.category)).toBe(true);
      const checked = validateRecordedCombo(action.defaultCombo);
      expect(checked.valid).toBe(true);
      expect(seenPrimary.has(action.defaultCombo)).toBe(false);
      seenPrimary.add(action.defaultCombo);
    }

    for (const action of SHORTCUT_ACTIONS) {
      if (action.secondaryDefaultCombo) {
        expect(seenPrimary.has(action.secondaryDefaultCombo)).toBe(false);
      }
    }
  });

  it('includes Undo and Redo with standard cross-platform defaults', () => {
    expect(getEffectiveShortcut('undo', {})).toBe('Mod+Z');
    expect(getEffectiveShortcut('redo', {})).toBe('Mod+Shift+Z');
  });
});

describe('eventToCanonicalCombo & normalizeShortcutCombo', () => {
  it('maps Ctrl on Windows/Linux and Meta on macOS to Mod consistently', () => {
    expect(
      eventToCanonicalCombo({ key: 'z', code: 'KeyZ', ctrlKey: true }, false),
    ).toBe('Mod+Z');
    expect(
      eventToCanonicalCombo({ key: 'z', code: 'KeyZ', metaKey: true }, true),
    ).toBe('Mod+Z');
    expect(
      eventToCanonicalCombo({ key: 'Z', code: 'KeyZ', ctrlKey: true, shiftKey: true }, false),
    ).toBe('Mod+Shift+Z');
    expect(
      eventToCanonicalCombo({ key: 'z', code: 'KeyZ', metaKey: true, shiftKey: true }, true),
    ).toBe('Mod+Shift+Z');
    // Explicit Ctrl on macOS remains distinct from Command (Mod)
    expect(
      eventToCanonicalCombo({ key: 'z', code: 'KeyZ', ctrlKey: true }, true),
    ).toBe('Ctrl+Z');
  });

  it('handles macOS Option+letter diacritics using physical e.code fallback', () => {
    expect(
      eventToCanonicalCombo({ key: '®', code: 'KeyR', altKey: true }, true),
    ).toBe('Alt+R');
    expect(
      eventToCanonicalCombo({ key: 'º', code: 'Digit0', altKey: true }, true),
    ).toBe('Alt+0');
  });

  it('normalizes =, Shift+= (+), NumpadAdd, NumpadSubtract, and Shift+/ (?) cleanly', () => {
    expect(eventToCanonicalCombo({ key: '=', code: 'Equal' }, false)).toBe('+');
    expect(eventToCanonicalCombo({ key: '+', code: 'Equal', shiftKey: true }, false)).toBe('+');
    expect(eventToCanonicalCombo({ key: '+', code: 'NumpadAdd' }, false)).toBe('+');
    expect(eventToCanonicalCombo({ key: '-', code: 'NumpadSubtract' }, false)).toBe('-');
    expect(eventToCanonicalCombo({ key: '?', code: 'Slash', shiftKey: true }, false)).toBe('?');
    expect(normalizeShortcutCombo('Mod+=')).toBe('Mod++');
    expect(normalizeShortcutCombo('Mod++')).toBe('Mod++');
    expect(normalizeShortcutCombo('+')).toBe('+');
  });

  it('ignores modifier-only keypresses', () => {
    expect(eventToCanonicalCombo({ key: 'Shift', shiftKey: true }, false)).toBeNull();
    expect(eventToCanonicalCombo({ key: 'Control', ctrlKey: true }, false)).toBeNull();
    expect(eventToCanonicalCombo({ key: 'Meta', metaKey: true }, true)).toBeNull();
    expect(eventToCanonicalCombo({ key: 'Alt', altKey: true }, false)).toBeNull();
    expect(eventToCanonicalCombo({ key: 'CapsLock' }, false)).toBeNull();
  });

  it('protects Escape, Tab, Shift+Tab, and bare Enter in validateRecordedCombo', () => {
    expect(validateRecordedCombo('Escape').valid).toBe(false);
    expect(validateRecordedCombo('Tab').valid).toBe(false);
    expect(validateRecordedCombo('Shift+Tab').valid).toBe(false);
    expect(validateRecordedCombo('Enter').valid).toBe(false);
    expect(validateRecordedCombo('Mod+Enter')).toEqual({ valid: true, combo: 'Mod+Enter' });
    expect(validateRecordedCombo('Alt+Q')).toEqual({ valid: true, combo: 'Alt+Q' });
  });
});

describe('formatShortcutCombo & formatShortcutTooltip', () => {
  it('formats combos with platform-native symbols on macOS and text labels on Windows/Linux', () => {
    expect(formatShortcutCombo('Mod+Z', false)).toBe('Ctrl+Z');
    expect(formatShortcutCombo('Mod+Z', true)).toBe('⌘Z');
    expect(formatShortcutCombo('Mod+Shift+Z', false)).toBe('Ctrl+Shift+Z');
    expect(formatShortcutCombo('Mod+Shift+Z', true)).toBe('⇧⌘Z');
    expect(formatShortcutCombo('Alt+Shift+ArrowUp', true)).toBe('⌥⇧↑');
    expect(formatShortcutCombo('Shift+ArrowUp', false)).toBe('Shift+↑');
    expect(formatShortcutCombo('+', false)).toBe('+');
    expect(formatShortcutCombo('Mod++', false)).toBe('Ctrl++');
    expect(formatShortcutCombo('Mod++', true)).toBe('⌘+');
    expect(formatShortcutCombo('-', false)).toBe('−');
    expect(formatShortcutCombo('ArrowLeft', false)).toBe('←');
    expect(formatShortcutCombo(null, false)).toBe('Unbound');
  });

  it('appends active shortcut to tooltips and omits parentheses when unbound', () => {
    expect(formatShortcutTooltip('Undo', 'Mod+Z', false)).toBe('Undo (Ctrl+Z)');
    expect(formatShortcutTooltip('Undo', 'Mod+Z', true)).toBe('Undo (⌘Z)');
    expect(formatShortcutTooltip('Undo', null, false)).toBe('Undo');
  });

  it('detects Apple platforms accurately', () => {
    expect(detectMacPlatform('MacIntel', '')).toBe(true);
    expect(detectMacPlatform('iPad', '')).toBe(true);
    expect(detectMacPlatform('Win32', 'Windows NT 10.0')).toBe(false);
    expect(detectMacPlatform('Linux x86_64', 'X11; Linux')).toBe(false);
  });
});

describe('isEditableEventTarget & isInteractiveActivationTarget', () => {
  it('blocks shortcuts inside text/number/search/range inputs, textareas, selects, and contentEditable', () => {
    expect(isEditableEventTarget({ tagName: 'INPUT', type: 'text' })).toBe(true);
    expect(isEditableEventTarget({ tagName: 'INPUT', type: 'search' })).toBe(true);
    expect(isEditableEventTarget({ tagName: 'INPUT', type: 'number' })).toBe(true);
    expect(isEditableEventTarget({ tagName: 'INPUT', type: 'range' })).toBe(true);
    expect(isEditableEventTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isEditableEventTarget({ tagName: 'SELECT' })).toBe(true);
    expect(isEditableEventTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
  });

  it('allows shortcuts when focused on buttons, checkboxes, or stage containers', () => {
    expect(isEditableEventTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isEditableEventTarget({ tagName: 'INPUT', type: 'checkbox' })).toBe(false);
    expect(isEditableEventTarget({ tagName: 'DIV' })).toBe(false);
    expect(isInteractiveActivationTarget({ tagName: 'BUTTON' })).toBe(true);
    expect(isInteractiveActivationTarget({ tagName: 'INPUT', type: 'checkbox' })).toBe(true);
    expect(isInteractiveActivationTarget({ tagName: 'DIV' })).toBe(false);
  });
});

describe('resolveShortcutActionForEvent & context gating', () => {
  it('triggers Undo and Redo (including Windows/Linux Ctrl+Y secondary alias)', () => {
    const winCtx = stepPageContext({ isMac: false });
    const macCtx = stepPageContext({ isMac: true });

    expect(
      resolveShortcutActionForEvent({ key: 'z', code: 'KeyZ', ctrlKey: true }, {}, winCtx),
    ).toBe('undo');
    expect(
      resolveShortcutActionForEvent({ key: 'z', code: 'KeyZ', metaKey: true }, {}, macCtx),
    ).toBe('undo');
    expect(
      resolveShortcutActionForEvent({ key: 'Z', code: 'KeyZ', ctrlKey: true, shiftKey: true }, {}, winCtx),
    ).toBe('redo');
    expect(
      resolveShortcutActionForEvent({ key: 'z', code: 'KeyZ', metaKey: true, shiftKey: true }, {}, macCtx),
    ).toBe('redo');
    // Ctrl+Y works on Windows/Linux by default, but Cmd+Y is NOT stolen on macOS
    expect(
      resolveShortcutActionForEvent({ key: 'y', code: 'KeyY', ctrlKey: true }, {}, winCtx),
    ).toBe('redo');
    expect(
      resolveShortcutActionForEvent({ key: 'y', code: 'KeyY', metaKey: true }, {}, macCtx),
    ).toBeNull();
  });

  it('lets an explicit binding on Mod+Y take priority over Redo secondary alias', () => {
    const { overrides } = setShortcutOverride({}, 'toggleStyle', 'Mod+Y');
    expect(
      resolveShortcutActionForEvent(
        { key: 'y', code: 'KeyY', ctrlKey: true },
        overrides,
        stepPageContext({ isMac: false }),
      ),
    ).toBe('toggleStyle');
  });

  it('gates actions by model presence, page kind, Parts selection, repeat, and blocking surface', () => {
    // No model loaded: Menu, Bricks Library, Import, and Shortcuts work; Undo & Navigation do not
    const emptyCtx = stepPageContext({ hasModel: false, pageKind: null });
    expect(resolveShortcutActionForEvent({ key: 'm' }, {}, emptyCtx)).toBe('toggleMenu');
    expect(resolveShortcutActionForEvent({ key: 'k' }, {}, emptyCtx)).toBe('openBricksLibrary');
    expect(resolveShortcutActionForEvent({ key: '?', shiftKey: true }, {}, emptyCtx)).toBe('openShortcuts');
    expect(resolveShortcutActionForEvent({ key: 'o', ctrlKey: true }, {}, emptyCtx)).toBe('importFile');
    expect(resolveShortcutActionForEvent({ key: 'z', ctrlKey: true }, {}, emptyCtx)).toBeNull();
    expect(resolveShortcutActionForEvent({ key: 'ArrowRight' }, {}, emptyCtx)).toBeNull();

    // Parts nudge requires Parts mode AND selected parts
    expect(
      resolveShortcutActionForEvent(
        { key: 'ArrowUp', shiftKey: true },
        {},
        stepPageContext({ mode: 'pan', selectedPartCount: 0 }),
      ),
    ).toBeNull();
    expect(
      resolveShortcutActionForEvent(
        { key: 'ArrowUp', shiftKey: true },
        {},
        stepPageContext({ mode: 'parts', selectedPartCount: 2 }),
      ),
    ).toBe('partNudgeUp');

    // Camera flip only applies on steps pages, while rotate applies on steps/cover/complete
    expect(canRunShortcutAction('cameraFlipSide', stepPageContext({ pageKind: 'cover' }))).toBe(false);
    expect(canRunShortcutAction('cameraRotateRight', stepPageContext({ pageKind: 'cover' }))).toBe(true);
    expect(canRunShortcutAction('cameraRotateRight', stepPageContext({ pageKind: 'bom' }))).toBe(false);

    // Repeat is allowed for Undo/Page Next/Zoom In/Camera Rotate, blocked for toggles/modals
    expect(canRunShortcutAction('undo', stepPageContext({ isRepeat: true }))).toBe(true);
    expect(canRunShortcutAction('pageNext', stepPageContext({ isRepeat: true }))).toBe(true);
    expect(canRunShortcutAction('toggleMenu', stepPageContext({ isRepeat: true }))).toBe(false);
    expect(canRunShortcutAction('exportProject', stepPageContext({ isRepeat: true }))).toBe(false);

    // Blocking modal guards
    expect(canRunShortcutAction('undo', stepPageContext({ blockingSurface: 'overview' }))).toBe(true);
    expect(canRunShortcutAction('pageNext', stepPageContext({ blockingSurface: 'overview' }))).toBe(false);
    expect(canRunShortcutAction('undo', stepPageContext({ blockingSurface: 'pageSetup' }))).toBe(false);
    expect(canRunShortcutAction('openPageSetup', stepPageContext({ blockingSurface: 'pageSetup' }))).toBe(true);
    expect(canRunShortcutAction('toggleMenu', stepPageContext({ blockingSurface: 'menu' }))).toBe(true);
    expect(canRunShortcutAction('pageNext', stepPageContext({ blockingSurface: 'menu' }))).toBe(false);

    // Parts List Setup shortcut is blocked when Parts List page is disabled (except closing if already open)
    expect(canRunShortcutAction('openBomSetup', stepPageContext({ showPartsList: true }))).toBe(true);
    expect(canRunShortcutAction('openBomSetup', stepPageContext({ showPartsList: false }))).toBe(false);
    expect(
      resolveShortcutActionForEvent({ key: 'l' }, {}, stepPageContext({ showPartsList: false })),
    ).toBeNull();
    expect(
      canRunShortcutAction(
        'openBomSetup',
        stepPageContext({ blockingSurface: 'bomSetup', showPartsList: false }),
      ),
    ).toBe(true);
  });
});

describe('customization, conflict detection, reset & storage persistence', () => {
  it('supports custom rebinding, conflict detection, unbinding, and single/full resets', () => {
    expect(findShortcutConflict('Mod+Z', 'redo', {})).toBe('undo');
    expect(findShortcutConflict('Mod+Z', 'undo', {})).toBeNull();

    // Rebinding undo to Alt+U works and marks 1 customized shortcut
    const step1 = setShortcutOverride({}, 'undo', 'Alt+U');
    expect(step1.unboundActionId).toBeNull();
    expect(getEffectiveShortcut('undo', step1.overrides)).toBe('Alt+U');
    expect(isShortcutCustomized('undo', step1.overrides)).toBe(true);
    expect(countCustomizedShortcuts(step1.overrides)).toBe(1);

    // Rebinding cameraReset to T conflicts with toggleStyle and unbinds toggleStyle
    const step2 = setShortcutOverride(step1.overrides, 'cameraReset', 'T');
    expect(step2.unboundActionId).toBe('toggleStyle');
    expect(getEffectiveShortcut('cameraReset', step2.overrides)).toBe('T');
    expect(getEffectiveShortcut('toggleStyle', step2.overrides)).toBeNull();
    expect(countCustomizedShortcuts(step2.overrides)).toBe(3);

    // Resetting toggleStyle restores T and cleanly unbinds cameraReset to preserve uniqueness
    const step3 = resetShortcutOverride(step2.overrides, 'toggleStyle');
    expect(step3.unboundActionId).toBe('cameraReset');
    expect(getEffectiveShortcut('toggleStyle', step3.overrides)).toBe('T');
    expect(getEffectiveShortcut('cameraReset', step3.overrides)).toBeNull();

    // Reset all returns empty override map
    const cleared = resetAllShortcutOverrides();
    expect(cleared).toEqual({});
    expect(countCustomizedShortcuts(cleared)).toBe(0);
    expect(getResetAllShortcutsNotice(0)).toBeNull();
    expect(getResetAllShortcutsNotice(2)?.message).toContain('2 custom shortcuts');
  });

  it('persists overrides to storage and sanitizes malformed or colliding entries on load', () => {
    const mem = createMemoryStorage();
    const { overrides } = setShortcutOverride({}, 'undo', 'Alt+Z');
    const { overrides: withUnbound } = setShortcutOverride(overrides, 'cameraFlipSide', null);

    saveShortcutOverridesToStorage(withUnbound, mem);
    expect(mem.store.has(KEYBOARD_SHORTCUTS_STORAGE_KEY)).toBe(true);

    const loaded = loadShortcutOverridesFromStorage(mem);
    expect(loaded).toEqual({ undo: 'Alt+Z', cameraFlipSide: null });

    // Saving empty overrides removes the storage key cleanly
    saveShortcutOverridesToStorage({}, mem);
    expect(mem.store.has(KEYBOARD_SHORTCUTS_STORAGE_KEY)).toBe(false);

    // Sanitizing malformed JSON, reserved keys, and duplicate custom combos
    const sanitized = sanitizeShortcutOverrides({
      undo: 'Escape', // reserved -> dropped
      redo: 'Alt+R',
      cameraReset: 'Alt+R', // duplicate of redo -> unbound
      unknownAction: 'X', // unknown -> dropped
      zoomIn: 123, // wrong type -> dropped
    });
    expect(sanitized.undo).toBeUndefined();
    expect(sanitized.redo).toBe('Alt+R');
    expect(sanitized.cameraReset).toBeNull();
  });

  it('filters shortcuts by label, category, description, and formatted key', () => {
    const undoMatches = filterShortcutActions('undo', {}, false);
    expect(undoMatches.some((a) => a.id === 'undo')).toBe(true);
    expect(undoMatches.some((a) => a.id === 'redo')).toBe(true);

    const cameraMatches = filterShortcutActions('camera', {}, false);
    expect(cameraMatches.length).toBeGreaterThanOrEqual(4);

    const keyMatches = filterShortcutActions('⌘z', {}, true);
    expect(keyMatches.some((a) => a.id === 'undo')).toBe(true);
  });
});
