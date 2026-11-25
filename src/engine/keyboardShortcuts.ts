/**
 * Customizable Keyboard Shortcuts Engine for Brick Instruction Works.
 *
 * Pure, DOM-free shortcut registry, cross-platform combo normalization
 * (`Mod` = Cmd on macOS/iPadOS, Ctrl on Windows/Linux), conflict resolution,
 * surface/context gating, search filtering, tooltip formatting, and
 * `localStorage` persistence.
 */

export const KEYBOARD_SHORTCUTS_STORAGE_KEY = 'biw_keyboard_shortcuts_v1';

export type ShortcutCategoryId =
  | 'history'
  | 'navigation'
  | 'view'
  | 'modes'
  | 'camera'
  | 'parts'
  | 'panels';

export type ShortcutActionId =
  // History
  | 'undo'
  | 'redo'
  // Page & step navigation
  | 'pagePrev'
  | 'pageNext'
  | 'pageFirst'
  | 'pageLast'
  | 'stepPrevSlot'
  | 'stepNextSlot'
  // View & canvas zoom
  | 'zoomIn'
  | 'zoomOut'
  | 'zoomReset'
  // Editor modes (bottom dock)
  | 'modePan'
  | 'modeParts'
  | 'modeStepCamera'
  | 'modePage'
  // Step & hero camera + page breaks
  | 'cameraRotateLeft'
  | 'cameraRotateRight'
  | 'cameraFlipSide'
  | 'cameraReset'
  | 'togglePageBreak'
  // Parts mode editing
  | 'partNudgeUp'
  | 'partNudgeDown'
  | 'partNudgeLeft'
  | 'partNudgeRight'
  | 'partToggleArrow'
  // Panels, dialogs & files
  | 'toggleMenu'
  | 'toggleOverview'
  | 'toggleStyle'
  | 'openPageSetup'
  | 'openBomSetup'
  | 'openBricksLibrary'
  | 'importFile'
  | 'exportProject'
  | 'openExport'
  | 'openShortcuts';

export type ShortcutBlockingSurface =
  | 'none'
  | 'menu'
  | 'overview'
  | 'pageSetup'
  | 'bomSetup'
  | 'export'
  | 'openModel'
  | 'import'
  | 'missingParts'
  | 'errors'
  | 'applyAngle'
  | 'bricksLibrary';

export interface ShortcutCategoryDef {
  id: ShortcutCategoryId;
  label: string;
}

export interface ShortcutActionDef {
  id: ShortcutActionId;
  category: ShortcutCategoryId;
  label: string;
  description: string;
  /** Canonical combo string, e.g. 'Mod+Z', 'ArrowLeft', 'Shift+ArrowUp', '?', '+' */
  defaultCombo: string;
  /** Optional secondary alias active when this action uses its default and no other action binds it */
  secondaryDefaultCombo?: string;
  /** When true, `secondaryDefaultCombo` only applies on non-macOS platforms (e.g. Ctrl+Y for Redo) */
  secondaryNonMacOnly?: boolean;
  /** Whether holding the key down repeats the action */
  allowRepeat: boolean;
  /** Whether a model must be loaded for this action to run */
  requiresModel: boolean;
  /** Page kinds where this action applies (omit = any page) */
  allowedPageKinds?: readonly string[];
  /** When true, requires Parts mode with at least one selected part */
  requiresSelectedParts?: boolean;
  /** Surfaces where this shortcut may fire (defaults to ['none']) */
  allowedSurfaces?: readonly ShortcutBlockingSurface[];
}

/**
 * Sparse override map persisted in `localStorage`:
 * - Key omitted => use `defaultCombo`
 * - `null` => explicitly unbound / disabled by user
 * - string => custom canonical combo
 */
export type ShortcutOverrides = Partial<Record<ShortcutActionId, string | null>>;

export interface ShortcutKeyEventLike {
  key: string;
  code?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
}

export interface EditableTargetLike {
  tagName?: string;
  type?: string;
  isContentEditable?: boolean;
  getAttribute?: (name: string) => string | null;
}

export interface ShortcutMatchContext {
  blockingSurface: ShortcutBlockingSurface;
  hasModel: boolean;
  pageKind: string | null;
  mode: string;
  selectedPartCount: number;
  isRepeat?: boolean;
  isMac?: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}

export const SHORTCUT_CATEGORIES: readonly ShortcutCategoryDef[] = [
  { id: 'history', label: 'History' },
  { id: 'navigation', label: 'Page Navigation' },
  { id: 'view', label: 'View & Zoom' },
  { id: 'modes', label: 'Editor Modes' },
  { id: 'camera', label: 'Step & Camera' },
  { id: 'parts', label: 'Parts Editing' },
  { id: 'panels', label: 'Panels & Files' },
];

export const SHORTCUT_ACTIONS: readonly ShortcutActionDef[] = [
  // History
  {
    id: 'undo',
    category: 'history',
    label: 'Undo',
    description: 'Undo the last edit to steps, cameras, parts, or layout',
    defaultCombo: 'Mod+Z',
    allowRepeat: true,
    requiresModel: true,
    allowedSurfaces: ['none', 'overview'],
  },
  {
    id: 'redo',
    category: 'history',
    label: 'Redo',
    description: 'Reapply the last undone edit',
    defaultCombo: 'Mod+Shift+Z',
    secondaryDefaultCombo: 'Mod+Y',
    secondaryNonMacOnly: true,
    allowRepeat: true,
    requiresModel: true,
    allowedSurfaces: ['none', 'overview'],
  },

  // Page Navigation
  {
    id: 'pagePrev',
    category: 'navigation',
    label: 'Previous Page',
    description: 'Go to the previous manual page',
    defaultCombo: 'ArrowLeft',
    allowRepeat: true,
    requiresModel: true,
  },
  {
    id: 'pageNext',
    category: 'navigation',
    label: 'Next Page',
    description: 'Go to the next manual page',
    defaultCombo: 'ArrowRight',
    allowRepeat: true,
    requiresModel: true,
  },
  {
    id: 'pageFirst',
    category: 'navigation',
    label: 'First Page',
    description: 'Jump to the first page (Cover)',
    defaultCombo: 'Home',
    allowRepeat: false,
    requiresModel: true,
  },
  {
    id: 'pageLast',
    category: 'navigation',
    label: 'Last Page',
    description: 'Jump to the last page (Back Cover)',
    defaultCombo: 'End',
    allowRepeat: false,
    requiresModel: true,
  },
  {
    id: 'stepPrevSlot',
    category: 'navigation',
    label: 'Previous Step on Page',
    description: 'Select the previous step on a multi-step page',
    defaultCombo: '[',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps'],
  },
  {
    id: 'stepNextSlot',
    category: 'navigation',
    label: 'Next Step on Page',
    description: 'Select the next step on a multi-step page',
    defaultCombo: ']',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps'],
  },

  // View & Zoom
  {
    id: 'zoomIn',
    category: 'view',
    label: 'Zoom Page In',
    description: 'Zoom into the live page canvas',
    defaultCombo: '+',
    allowRepeat: true,
    requiresModel: true,
  },
  {
    id: 'zoomOut',
    category: 'view',
    label: 'Zoom Page Out',
    description: 'Zoom out of the live page canvas',
    defaultCombo: '-',
    allowRepeat: true,
    requiresModel: true,
  },
  {
    id: 'zoomReset',
    category: 'view',
    label: 'Reset Page Zoom',
    description: 'Fit the page back to 100%',
    defaultCombo: '0',
    allowRepeat: false,
    requiresModel: true,
  },

  // Editor Modes
  {
    id: 'modePan',
    category: 'modes',
    label: 'Pan Mode',
    description: 'Switch to Pan mode to drag and inspect the page',
    defaultCombo: '1',
    allowRepeat: false,
    requiresModel: true,
  },
  {
    id: 'modeParts',
    category: 'modes',
    label: 'Parts Mode',
    description: 'Switch to Parts mode to select, nudge, or split parts',
    defaultCombo: '2',
    allowRepeat: false,
    requiresModel: true,
    allowedPageKinds: ['steps'],
  },
  {
    id: 'modeStepCamera',
    category: 'modes',
    label: 'Step / Camera Mode',
    description: 'Switch to Step mode (or Camera mode on Cover / Complete)',
    defaultCombo: '3',
    allowRepeat: false,
    requiresModel: true,
    allowedPageKinds: ['steps', 'cover', 'complete'],
  },
  {
    id: 'modePage',
    category: 'modes',
    label: 'Page / Parts List Mode',
    description: 'Switch to Page mode (or Parts List Setup on Parts List pages)',
    defaultCombo: '4',
    allowRepeat: false,
    requiresModel: true,
  },

  // Step & Camera
  {
    id: 'cameraRotateLeft',
    category: 'camera',
    label: 'Rotate Camera −90°',
    description: 'Rotate active step or Cover / Complete camera counter-clockwise',
    defaultCombo: 'Q',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps', 'cover', 'complete'],
  },
  {
    id: 'cameraRotateRight',
    category: 'camera',
    label: 'Rotate Camera +90°',
    description: 'Rotate active step or Cover / Complete camera clockwise',
    defaultCombo: 'E',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps', 'cover', 'complete'],
  },
  {
    id: 'cameraFlipSide',
    category: 'camera',
    label: 'Flip Camera Top / Bottom',
    description: 'Toggle between top-down and underside camera view for the active step',
    defaultCombo: 'F',
    allowRepeat: false,
    requiresModel: true,
    allowedPageKinds: ['steps'],
  },
  {
    id: 'cameraReset',
    category: 'camera',
    label: 'Reset Camera',
    description: 'Reset custom camera angle, zoom, and framing for the active step or hero page',
    defaultCombo: 'R',
    allowRepeat: false,
    requiresModel: true,
    allowedPageKinds: ['steps', 'cover', 'complete'],
  },
  {
    id: 'togglePageBreak',
    category: 'camera',
    label: 'Toggle Page Break',
    description: 'Pin or unpin a page break before the active step',
    defaultCombo: 'B',
    allowRepeat: false,
    requiresModel: true,
    allowedPageKinds: ['steps'],
  },

  // Parts Editing
  {
    id: 'partNudgeUp',
    category: 'parts',
    label: 'Nudge Parts Up',
    description: 'Lift selected parts up by 1 stud (Parts mode)',
    defaultCombo: 'Shift+ArrowUp',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps'],
    requiresSelectedParts: true,
  },
  {
    id: 'partNudgeDown',
    category: 'parts',
    label: 'Nudge Parts Down',
    description: 'Lower selected parts down by 1 stud (Parts mode)',
    defaultCombo: 'Shift+ArrowDown',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps'],
    requiresSelectedParts: true,
  },
  {
    id: 'partNudgeLeft',
    category: 'parts',
    label: 'Nudge Parts Left',
    description: 'Move selected parts left by 1 stud (Parts mode)',
    defaultCombo: 'Shift+ArrowLeft',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps'],
    requiresSelectedParts: true,
  },
  {
    id: 'partNudgeRight',
    category: 'parts',
    label: 'Nudge Parts Right',
    description: 'Move selected parts right by 1 stud (Parts mode)',
    defaultCombo: 'Shift+ArrowRight',
    allowRepeat: true,
    requiresModel: true,
    allowedPageKinds: ['steps'],
    requiresSelectedParts: true,
  },
  {
    id: 'partToggleArrow',
    category: 'parts',
    label: 'Toggle Placement Arrow',
    description: 'Show or hide exploded placement arrows on selected parts',
    defaultCombo: 'A',
    allowRepeat: false,
    requiresModel: true,
    allowedPageKinds: ['steps'],
    requiresSelectedParts: true,
  },

  // Panels & Files
  {
    id: 'toggleMenu',
    category: 'panels',
    label: 'Toggle Studio Menu',
    description: 'Open or close the main studio menu drawer',
    defaultCombo: 'M',
    allowRepeat: false,
    requiresModel: false,
    allowedSurfaces: ['none', 'menu'],
  },
  {
    id: 'toggleOverview',
    category: 'panels',
    label: 'Pages & Steps Overview',
    description: 'Open or close the Pages & Steps overview',
    defaultCombo: 'G',
    allowRepeat: false,
    requiresModel: true,
    allowedSurfaces: ['none', 'menu', 'overview'],
  },
  {
    id: 'toggleStyle',
    category: 'panels',
    label: 'Style & Themes',
    description: 'Open or close the Style & Themes popover',
    defaultCombo: 'T',
    allowRepeat: false,
    requiresModel: true,
    allowedSurfaces: ['none', 'menu'],
  },
  {
    id: 'openPageSetup',
    category: 'panels',
    label: 'Page Setup',
    description: 'Open or close Page Setup',
    defaultCombo: 'P',
    allowRepeat: false,
    requiresModel: true,
    allowedSurfaces: ['none', 'menu', 'pageSetup'],
  },
  {
    id: 'openBomSetup',
    category: 'panels',
    label: 'Parts List Setup',
    description: 'Open or close Parts List Setup',
    defaultCombo: 'L',
    allowRepeat: false,
    requiresModel: true,
    allowedSurfaces: ['none', 'menu', 'bomSetup'],
  },
  {
    id: 'openBricksLibrary',
    category: 'panels',
    label: 'Bricks Library',
    description: 'Open or close the 3D Bricks Library',
    defaultCombo: 'K',
    allowRepeat: false,
    requiresModel: false,
    allowedSurfaces: ['none', 'menu', 'bricksLibrary'],
  },
  {
    id: 'importFile',
    category: 'panels',
    label: 'Import Model / Project',
    description: 'Open the Import Model or Project dialog',
    defaultCombo: 'Mod+O',
    allowRepeat: false,
    requiresModel: false,
    allowedSurfaces: ['none', 'menu', 'openModel'],
  },
  {
    id: 'exportProject',
    category: 'panels',
    label: 'Export Project (.biw)',
    description: 'Save/export the current project as a .biw file',
    defaultCombo: 'Mod+S',
    allowRepeat: false,
    requiresModel: true,
    allowedSurfaces: ['none', 'menu'],
  },
  {
    id: 'openExport',
    category: 'panels',
    label: 'Print / Export PDF',
    description: 'Open the Print & Export PDF dialog',
    defaultCombo: 'Mod+P',
    allowRepeat: false,
    requiresModel: true,
    allowedSurfaces: ['none', 'menu', 'export'],
  },
  {
    id: 'openShortcuts',
    category: 'panels',
    label: 'Keyboard Shortcuts',
    description: 'Open the Keyboard Shortcuts section in the main menu',
    defaultCombo: '?',
    allowRepeat: false,
    requiresModel: false,
    allowedSurfaces: ['none', 'menu'],
  },
];

export const SHORTCUT_ACTION_MAP: Readonly<Record<ShortcutActionId, ShortcutActionDef>> =
  Object.fromEntries(SHORTCUT_ACTIONS.map((a) => [a.id, a])) as Record<
    ShortcutActionId,
    ShortcutActionDef
  >;

const MODIFIER_ONLY_KEYS = new Set([
  'Shift',
  'Control',
  'Alt',
  'Meta',
  'OS',
  'AltGraph',
  'CapsLock',
  'NumLock',
  'ScrollLock',
  'Fn',
  'FnLock',
  'Symbol',
  'SymbolLock',
  'Dead',
  'Process',
  'Unidentified',
  '',
]);

const SPECIAL_KEY_ALIASES: Readonly<Record<string, string>> = {
  arrowleft: 'ArrowLeft',
  left: 'ArrowLeft',
  arrowright: 'ArrowRight',
  right: 'ArrowRight',
  arrowup: 'ArrowUp',
  up: 'ArrowUp',
  arrowdown: 'ArrowDown',
  down: 'ArrowDown',
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pagedown: 'PageDown',
  backspace: 'Backspace',
  delete: 'Delete',
  del: 'Delete',
  insert: 'Insert',
  escape: 'Escape',
  esc: 'Escape',
  tab: 'Tab',
  enter: 'Enter',
  return: 'Enter',
  space: 'Space',
  spacebar: 'Space',
  ' ': 'Space',
  plus: '+',
  '=': '+',
  minus: '-',
};

/**
 * Shifted punctuation characters whose Shift state is implicit in the symbol itself
 * (e.g., `?` is `Shift+/` on US keyboards, `+` is `Shift+=` on US keyboards).
 */
const SHIFT_IMPLICIT_PUNCTUATION = new Set([
  '?',
  '+',
  '!',
  '@',
  '#',
  '$',
  '%',
  '^',
  '&',
  '*',
  '(',
  ')',
  '_',
  '{',
  '}',
  '|',
  ':',
  '"',
  '<',
  '>',
  '~',
]);

const NON_TEXT_INPUT_TYPES = new Set([
  'button',
  'submit',
  'reset',
  'checkbox',
  'radio',
  'file',
  'image',
]);

export function detectMacPlatform(platformLike?: string, userAgentLike?: string): boolean {
  const plat =
    platformLike ??
    (typeof navigator !== 'undefined' ? navigator.platform || '' : '');
  const ua =
    userAgentLike ??
    (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');
  return /Mac|iPhone|iPad|iPod/i.test(plat) || /Macintosh|iPhone|iPad|iPod/i.test(ua);
}

/**
 * Returns true when the event target is a text entry, select, slider, color picker,
 * or contentEditable element where keyboard shortcuts must NEVER hijack input.
 */
export function isEditableEventTarget(target: EditableTargetLike | null | undefined): boolean {
  if (!target) return false;
  if (target.isContentEditable) return true;
  const ce = target.getAttribute?.('contenteditable');
  if (ce !== null && ce !== undefined && ce !== 'false') return true;
  const tag = (target.tagName || '').toUpperCase();
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (tag === 'INPUT') {
    const inputType = (target.type || 'text').toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(inputType);
  }
  return false;
}

/**
 * Returns true when the target is an interactive button/link/checkbox/radio where
 * unmodified Space or Enter should perform native control activation instead of a shortcut.
 */
export function isInteractiveActivationTarget(
  target: EditableTargetLike | null | undefined,
): boolean {
  if (!target) return false;
  const tag = (target.tagName || '').toUpperCase();
  if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') return true;
  if (tag === 'INPUT') {
    const inputType = (target.type || '').toLowerCase();
    return inputType === 'checkbox' || inputType === 'radio' || inputType === 'button' || inputType === 'submit';
  }
  const role = (target.getAttribute?.('role') || '').toLowerCase();
  return role === 'button' || role === 'tab' || role === 'option' || role === 'switch';
}

function canonicalizeKeyToken(rawKey: string): string | null {
  if (typeof rawKey !== 'string') return null;
  if (rawKey === ' ') return 'Space';
  const trimmed = rawKey.trim();
  if (!trimmed || MODIFIER_ONLY_KEYS.has(trimmed)) return null;

  const lower = trimmed.toLowerCase();
  if (SPECIAL_KEY_ALIASES[lower]) return SPECIAL_KEY_ALIASES[lower];

  // Function keys F1..F24
  if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Single ASCII letter -> uppercase
  if (/^[a-zA-Z]$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // Single printable ASCII character (digits, punctuation)
  if (trimmed.length === 1 && trimmed.charCodeAt(0) >= 33 && trimmed.charCodeAt(0) <= 126) {
    return trimmed;
  }

  return null;
}

/**
 * Normalizes a persisted or user-supplied shortcut combo string into canonical form:
 * `[Mod+][Ctrl+][Meta+][Alt+][Shift+]<Key>`.
 */
export function normalizeShortcutCombo(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  const str = raw.trim();
  if (!str) return null;

  // Handle '+' as the key itself (e.g. '+' or 'Mod++' or 'Shift++')
  let working = str;
  let trailingPlus = false;
  if (working === '+') {
    return '+';
  }
  if (working.endsWith('++')) {
    trailingPlus = true;
    working = working.slice(0, -1);
  }

  const parts = working.split('+').filter((p) => p.length > 0);
  if (trailingPlus) parts.push('+');
  if (parts.length === 0) return null;

  let mod = false;
  let ctrl = false;
  let meta = false;
  let alt = false;
  let shift = false;
  let keyToken: string | null = null;

  for (let i = 0; i < parts.length; i++) {
    const token = parts[i];
    const lower = token.toLowerCase();
    const isLast = i === parts.length - 1;

    if (!isLast || (parts.length === 1 && (lower === 'mod' || lower === 'ctrl' || lower === 'meta' || lower === 'alt' || lower === 'shift'))) {
      if (lower === 'mod' || lower === 'cmdorctrl') {
        mod = true;
        continue;
      }
      if (lower === 'ctrl' || lower === 'control') {
        ctrl = true;
        continue;
      }
      if (lower === 'meta' || lower === 'cmd' || lower === 'command' || lower === 'super') {
        meta = true;
        continue;
      }
      if (lower === 'alt' || lower === 'option' || lower === 'opt') {
        alt = true;
        continue;
      }
      if (lower === 'shift') {
        shift = true;
        continue;
      }
    }

    if (isLast) {
      keyToken = canonicalizeKeyToken(token);
    } else {
      return null;
    }
  }

  if (!keyToken) return null;

  // Implicitly shifted punctuation does not carry a redundant Shift+ prefix
  if (shift && SHIFT_IMPLICIT_PUNCTUATION.has(keyToken)) {
    shift = false;
  }

  const out: string[] = [];
  if (mod) out.push('Mod');
  if (ctrl) out.push('Ctrl');
  if (meta) out.push('Meta');
  if (alt) out.push('Alt');
  if (shift) out.push('Shift');
  out.push(keyToken);
  return out.join('+');
}

/**
 * Converts a live browser `KeyboardEvent` into a canonical shortcut combo string.
 * Both shortcut recording and runtime dispatch use this exact function to guarantee
 * 100% round-trip matching across operating systems and keyboard layouts.
 */
export function eventToCanonicalCombo(
  event: ShortcutKeyEventLike,
  isMac = detectMacPlatform(),
): string | null {
  if (!event || typeof event.key !== 'string') return null;
  if (MODIFIER_ONLY_KEYS.has(event.key)) return null;

  const code = event.code || '';
  let rawKey = event.key;

  // Numpad operators normalize cleanly to canonical '+' / '-'
  if (code === 'NumpadAdd') {
    rawKey = '+';
  } else if (code === 'NumpadSubtract') {
    rawKey = '-';
  } else if (event.altKey) {
    // On macOS, Option+Letter/Digit produces diacritic/symbol glyphs (e.g. Option+R => '®').
    // Fall back to physical key code for ASCII letters/digits so Alt/Option combos work reliably.
    if (/^Key[A-Z]$/.test(code)) {
      rawKey = code.slice(3);
    } else if (/^Digit[0-9]$/.test(code)) {
      rawKey = code.slice(5);
    }
  }

  const keyToken = canonicalizeKeyToken(rawKey);
  if (!keyToken) return null;

  const mod = isMac ? Boolean(event.metaKey) : Boolean(event.ctrlKey);
  const ctrl = isMac ? Boolean(event.ctrlKey) : false;
  const meta = isMac ? false : Boolean(event.metaKey);
  const alt = Boolean(event.altKey);
  let shift = Boolean(event.shiftKey);

  // Consume implicit Shift on punctuation keys like `?` (Shift+/) and `+` (Shift+=)
  if (shift && SHIFT_IMPLICIT_PUNCTUATION.has(keyToken)) {
    shift = false;
  }

  const out: string[] = [];
  if (mod) out.push('Mod');
  if (ctrl) out.push('Ctrl');
  if (meta) out.push('Meta');
  if (alt) out.push('Alt');
  if (shift) out.push('Shift');
  out.push(keyToken);
  return out.join('+');
}

/**
 * Validates whether a recorded combo may be assigned to a customizable action.
 * Protects Escape (universal dismiss), Tab/Shift+Tab (focus navigation), and bare Enter.
 */
export function validateRecordedCombo(
  combo: string | null,
): { valid: true; combo: string } | { valid: false; reason: string } {
  const norm = normalizeShortcutCombo(combo);
  if (!norm) {
    return { valid: false, reason: 'Press a key or modifier combo (e.g. Ctrl+Z, Alt+R, or Q).' };
  }
  if (norm === 'Escape') {
    return { valid: false, reason: 'Escape is always reserved to close dialogs and cancel modes.' };
  }
  if (norm === 'Tab' || norm === 'Shift+Tab') {
    return { valid: false, reason: 'Tab is reserved for keyboard focus navigation.' };
  }
  if (norm === 'Enter') {
    return { valid: false, reason: 'Bare Enter is reserved for activating buttons. Combine with a modifier.' };
  }
  return { valid: true, combo: norm };
}

const DISPLAY_KEY_LABELS: Readonly<Record<string, string>> = {
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  ArrowDown: '↓',
  Home: 'Home',
  End: 'End',
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  Backspace: '⌫',
  Delete: 'Del',
  Insert: 'Ins',
  Escape: 'Esc',
  Enter: '↵',
  Space: 'Space',
  '+': '+',
  '-': '−',
};

/**
 * Formats a canonical combo string for human-readable keycap display.
 * Uses native Apple glyphs (`⌃⌥⇧⌘`) on macOS/iPadOS and `Ctrl+Alt+Shift+` on Windows/Linux.
 */
export function formatShortcutCombo(
  combo: string | null | undefined,
  isMac = detectMacPlatform(),
): string {
  const norm = normalizeShortcutCombo(combo);
  if (!norm) return 'Unbound';
  if (norm === '+') return '+';

  const hasTrailingPlus = norm.endsWith('++');
  const rawParts = (hasTrailingPlus ? norm.slice(0, -1) : norm)
    .split('+')
    .filter(Boolean);
  if (hasTrailingPlus) rawParts.push('+');

  const key = rawParts[rawParts.length - 1];
  const mods = new Set(rawParts.slice(0, -1));
  const keyLabel = DISPLAY_KEY_LABELS[key] ?? key;

  if (isMac) {
    // Apple HIG modifier order: Control, Option, Shift, Command
    let prefix = '';
    if (mods.has('Ctrl')) prefix += '⌃';
    if (mods.has('Alt')) prefix += '⌥';
    if (mods.has('Shift')) prefix += '⇧';
    if (mods.has('Mod') || mods.has('Meta')) prefix += '⌘';
    return `${prefix}${keyLabel}`;
  }

  const tokens: string[] = [];
  if (mods.has('Mod') || mods.has('Ctrl')) tokens.push('Ctrl');
  if (mods.has('Meta')) tokens.push('Win');
  if (mods.has('Alt')) tokens.push('Alt');
  if (mods.has('Shift')) tokens.push('Shift');
  tokens.push(keyLabel);
  return tokens.join('+');
}

/**
 * Formats a button tooltip with its live shortcut binding appended in parentheses,
 * or returns `baseLabel` unchanged when the shortcut is unbound.
 */
export function formatShortcutTooltip(
  baseLabel: string,
  combo: string | null | undefined,
  isMac = detectMacPlatform(),
): string {
  const norm = normalizeShortcutCombo(combo);
  if (!norm) return baseLabel;
  return `${baseLabel} (${formatShortcutCombo(norm, isMac)})`;
}

export function getEffectiveShortcut(
  actionId: ShortcutActionId,
  overrides: ShortcutOverrides,
): string | null {
  const def = SHORTCUT_ACTION_MAP[actionId];
  if (!def) return null;
  if (Object.prototype.hasOwnProperty.call(overrides, actionId)) {
    const val = overrides[actionId];
    return val === null ? null : normalizeShortcutCombo(val);
  }
  return def.defaultCombo;
}

export function isShortcutCustomized(
  actionId: ShortcutActionId,
  overrides: ShortcutOverrides,
): boolean {
  const def = SHORTCUT_ACTION_MAP[actionId];
  if (!def) return false;
  const eff = getEffectiveShortcut(actionId, overrides);
  return eff !== def.defaultCombo;
}

export function countCustomizedShortcuts(overrides: ShortcutOverrides): number {
  let count = 0;
  for (const action of SHORTCUT_ACTIONS) {
    if (isShortcutCustomized(action.id, overrides)) count++;
  }
  return count;
}

/**
 * Returns the ID of any OTHER action currently assigned to `combo`, or `null` if free.
 */
export function findShortcutConflict(
  combo: string,
  targetActionId: ShortcutActionId,
  overrides: ShortcutOverrides,
): ShortcutActionId | null {
  const norm = normalizeShortcutCombo(combo);
  if (!norm) return null;
  for (const action of SHORTCUT_ACTIONS) {
    if (action.id === targetActionId) continue;
    if (getEffectiveShortcut(action.id, overrides) === norm) {
      return action.id;
    }
  }
  return null;
}

/**
 * Returns a new override map with `actionId` bound to `combo` (or `null` to unbind).
 * Restoring an action to its own default removes its sparse override key cleanly.
 * When `unbindConflicting` is true (default), any other action holding `combo` is unbound.
 */
export function setShortcutOverride(
  overrides: ShortcutOverrides,
  actionId: ShortcutActionId,
  combo: string | null,
  opts: { unbindConflicting?: boolean } = {},
): { overrides: ShortcutOverrides; unboundActionId: ShortcutActionId | null } {
  const def = SHORTCUT_ACTION_MAP[actionId];
  if (!def) return { overrides: { ...overrides }, unboundActionId: null };

  const next: ShortcutOverrides = { ...overrides };
  let unboundActionId: ShortcutActionId | null = null;

  if (combo === null) {
    next[actionId] = null;
    return { overrides: next, unboundActionId: null };
  }

  const norm = normalizeShortcutCombo(combo);
  if (!norm) return { overrides: next, unboundActionId: null };

  if (opts.unbindConflicting !== false) {
    const conflictId = findShortcutConflict(norm, actionId, next);
    if (conflictId) {
      next[conflictId] = null;
      unboundActionId = conflictId;
    }
  }

  if (norm === def.defaultCombo) {
    delete next[actionId];
  } else {
    next[actionId] = norm;
  }

  return { overrides: next, unboundActionId };
}

/**
 * Resets a single action back to its default shortcut. If another customized action
 * currently holds that default combo, it is cleanly unbound so bindings remain unique.
 */
export function resetShortcutOverride(
  overrides: ShortcutOverrides,
  actionId: ShortcutActionId,
): { overrides: ShortcutOverrides; unboundActionId: ShortcutActionId | null } {
  const def = SHORTCUT_ACTION_MAP[actionId];
  if (!def) return { overrides: { ...overrides }, unboundActionId: null };
  return setShortcutOverride(overrides, actionId, def.defaultCombo, { unbindConflicting: true });
}

export function resetAllShortcutOverrides(): ShortcutOverrides {
  return {};
}

export function canRunShortcutAction(
  actionId: ShortcutActionId,
  ctx: ShortcutMatchContext,
): boolean {
  const def = SHORTCUT_ACTION_MAP[actionId];
  if (!def) return false;

  if (ctx.isRepeat && !def.allowRepeat) return false;

  const allowedSurfaces = def.allowedSurfaces ?? ['none'];
  if (!allowedSurfaces.includes(ctx.blockingSurface)) return false;

  if (def.requiresModel && !ctx.hasModel) return false;

  if (def.allowedPageKinds && def.allowedPageKinds.length > 0) {
    if (!ctx.pageKind || !def.allowedPageKinds.includes(ctx.pageKind)) return false;
  }

  if (def.requiresSelectedParts) {
    if (ctx.mode !== 'parts' || ctx.selectedPartCount <= 0) return false;
  }

  return true;
}

/**
 * Resolves which shortcut action (if any) should execute for a live `KeyboardEvent`.
 * Explicit primary bindings always take precedence over secondary default aliases
 * (such as `Ctrl+Y` for Redo on Windows/Linux).
 */
export function resolveShortcutActionForEvent(
  event: ShortcutKeyEventLike,
  overrides: ShortcutOverrides,
  ctx: ShortcutMatchContext,
): ShortcutActionId | null {
  const isMac = ctx.isMac ?? detectMacPlatform();
  const combo = eventToCanonicalCombo(event, isMac);
  if (!combo) return null;

  const evalCtx: ShortcutMatchContext = {
    ...ctx,
    isRepeat: ctx.isRepeat ?? Boolean(event.repeat),
    isMac,
  };

  // Pass 1: Match active primary bindings
  for (const action of SHORTCUT_ACTIONS) {
    const eff = getEffectiveShortcut(action.id, overrides);
    if (eff === combo) {
      return canRunShortcutAction(action.id, evalCtx) ? action.id : null;
    }
  }

  // Pass 2: Match secondary default aliases (only when action is unmodified and no other action owns combo)
  for (const action of SHORTCUT_ACTIONS) {
    if (!action.secondaryDefaultCombo) continue;
    if (action.secondaryNonMacOnly && isMac) continue;
    if (isShortcutCustomized(action.id, overrides)) continue;
    if (action.secondaryDefaultCombo === combo) {
      return canRunShortcutAction(action.id, evalCtx) ? action.id : null;
    }
  }

  return null;
}

export function filterShortcutActions(
  query: string,
  overrides: ShortcutOverrides,
  isMac = detectMacPlatform(),
): ShortcutActionDef[] {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [...SHORTCUT_ACTIONS];

  const catLabels = new Map(SHORTCUT_CATEGORIES.map((c) => [c.id, c.label.toLowerCase()]));

  return SHORTCUT_ACTIONS.filter((action) => {
    const eff = getEffectiveShortcut(action.id, overrides);
    const formatted = formatShortcutCombo(eff, isMac).toLowerCase();
    const cat = catLabels.get(action.category) || '';
    return (
      action.label.toLowerCase().includes(q) ||
      action.description.toLowerCase().includes(q) ||
      cat.includes(q) ||
      formatted.includes(q) ||
      (eff ? eff.toLowerCase().includes(q) : false)
    );
  });
}

/**
 * Validates and deduplicates raw persisted shortcut overrides loaded from storage.
 */
export function sanitizeShortcutOverrides(raw: unknown): ShortcutOverrides {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const input = raw as Record<string, unknown>;
  const out: ShortcutOverrides = {};

  for (const action of SHORTCUT_ACTIONS) {
    if (!Object.prototype.hasOwnProperty.call(input, action.id)) continue;
    const val = input[action.id];
    if (val === null) {
      out[action.id] = null;
      continue;
    }
    if (typeof val !== 'string') continue;
    const checked = validateRecordedCombo(val);
    if (!checked.valid) continue;
    if (checked.combo === action.defaultCombo) continue;
    out[action.id] = checked.combo;
  }

  // Deduplicate active bindings: earlier actions win if a hand-edited JSON introduced a duplicate.
  const seen = new Set<string>();
  for (const action of SHORTCUT_ACTIONS) {
    const eff = getEffectiveShortcut(action.id, out);
    if (!eff) continue;
    if (seen.has(eff)) {
      out[action.id] = null;
    } else {
      seen.add(eff);
    }
  }

  return out;
}

function getDefaultStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadShortcutOverridesFromStorage(
  storage: StorageLike | null = getDefaultStorage(),
): ShortcutOverrides {
  if (!storage) return {};
  try {
    const raw = storage.getItem(KEYBOARD_SHORTCUTS_STORAGE_KEY);
    if (!raw) return {};
    return sanitizeShortcutOverrides(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function saveShortcutOverridesToStorage(
  overrides: ShortcutOverrides,
  storage: StorageLike | null = getDefaultStorage(),
): void {
  if (!storage) return;
  try {
    const clean = sanitizeShortcutOverrides(overrides);
    if (Object.keys(clean).length === 0 && typeof storage.removeItem === 'function') {
      storage.removeItem(KEYBOARD_SHORTCUTS_STORAGE_KEY);
      return;
    }
    storage.setItem(KEYBOARD_SHORTCUTS_STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export function getResetAllShortcutsNotice(
  customizedCount: number,
): { tone: 'warning'; message: string; undoable: false } | null {
  if (customizedCount <= 0) return null;
  const noun = customizedCount === 1 ? 'custom shortcut' : 'custom shortcuts';
  return {
    tone: 'warning',
    message: `Restores ${customizedCount} ${noun} back to default bindings.`,
    undoable: false,
  };
}
