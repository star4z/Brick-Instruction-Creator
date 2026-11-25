/**
 * BrickLink Studio (`model2.ldr`) color ID -> standard LDraw (`LDConfig.ldr`) color ID mapping.
 *
 * Inside a BrickLink Studio `.io` archive:
 * - `model.ldr` uses standard LDraw color IDs (`16` = inherit, `24` = edge).
 * - `model2.ldr` embeds full `.dat` part & assembly definitions (e.g. `973pb*c01.dat`, printed
 *   heads/torsos/slopes) using **BrickLink** color IDs (`-1` = inherit, `-2` = edge).
 *
 * Without translating BrickLink color IDs to LDraw color IDs, embedded Studio `.dat` subparts
 * render in completely wrong colors — for example:
 * - BL 36 (Bright Green) was read as LDraw 36 (Trans-Red, making a minifigure arm clear pink/red!)
 * - BL 71 (Magenta) was read as LDraw 71 (Light Bluish Gray)
 * - BL 3 (Yellow) was read as LDraw 3 (Dark Turquoise)
 * - BL 11 (Black) was read as LDraw 11 (Light Turquoise)
 */

export const STUDIO_DAT_CONVERTED_MARKER = '0 // BIC_LDRAW_COLORS';

export const BRICKLINK_TO_LDRAW_COLOR: Record<number, number> = {
  // Solid colors
  1: 15,   // White
  2: 19,   // Tan
  3: 14,   // Yellow
  4: 25,   // Orange
  5: 4,    // Red
  6: 2,    // Green
  7: 1,    // Blue
  8: 6,    // Brown
  9: 7,    // Light Gray
  10: 8,   // Dark Gray
  11: 0,   // Black
  23: 13,  // Pink
  24: 22,  // Purple
  25: 12,  // Salmon
  26: 100, // Light Salmon
  28: 92,  // Nougat
  29: 366, // Earth Orange
  31: 462, // Medium Orange
  32: 125, // Light Orange
  33: 18,  // Light Yellow
  34: 27,  // Lime
  35: 120, // Light Lime
  36: 10,  // Bright Green
  37: 74,  // Medium Green
  38: 17,  // Light Green
  39: 3,   // Dark Turquoise
  40: 11,  // Light Turquoise
  41: 118, // Aqua
  42: 73,  // Medium Blue
  43: 110, // Violet
  44: 20,  // Light Violet
  47: 5,   // Dark Pink
  48: 378, // Sand Green
  49: 503, // Very Light Gray
  54: 373, // Sand Purple
  55: 379, // Sand Blue
  56: 77,  // Light Pink
  58: 335, // Sand Red
  59: 320, // Dark Red
  62: 9,   // Light Blue
  63: 272, // Dark Blue
  68: 484, // Dark Orange
  69: 28,  // Dark Tan
  71: 26,  // Magenta
  72: 313, // Maersk Blue
  73: 112, // Medium Violet / Blue-Violet
  76: 115, // Medium Lime
  80: 288, // Dark Green
  85: 72,  // Dark Bluish Gray
  86: 71,  // Light Bluish Gray
  87: 232, // Sky Blue
  88: 70,  // Reddish Brown
  89: 85,  // Dark Purple
  90: 78,  // Light Nougat
  91: 86,  // Light Brown
  93: 69,  // Light Purple
  94: 351, // Medium Dark Pink
  96: 68,  // Very Light Orange
  97: 112, // Blue-Violet
  99: 151, // Very Light Bluish Gray
  103: 226, // Bright Light Yellow
  104: 29,  // Bright Pink
  105: 212, // Bright Light Blue
  106: 450, // Fabuland Brown
  109: 23,  // Dark Blue-Violet
  110: 191, // Bright Light Orange
  120: 308, // Dark Brown
  150: 84,  // Medium Nougat
  152: 323, // Light Aqua
  153: 321, // Dark Azure
  154: 31,  // Lavender
  155: 330, // Olive Green
  156: 322, // Medium Azure
  157: 30,  // Medium Lavender
  158: 326, // Yellowish Green
  167: 402, // Reddish Orange
  168: 423, // Umber Brown
  169: 422, // Sienna Brown
  220: 353, // Coral / Vibrant Coral
  225: 128, // Dark Nougat
  236: 368, // Neon Yellow
  240: 370, // Medium Brown
  241: 371, // Medium Tan / Warm Tan

  // Transparent colors
  12: 47,  // Trans-Clear
  13: 40,  // Trans-Black
  14: 33,  // Trans-Dark Blue
  15: 41,  // Trans-Light Blue
  16: 42,  // Trans-Neon Green
  17: 36,  // Trans-Red
  18: 38,  // Trans-Neon Orange
  19: 46,  // Trans-Yellow
  20: 34,  // Trans-Green
  50: 37,  // Trans-Dark Pink
  51: 52,  // Trans-Purple
  74: 293, // Trans-Medium Blue
  98: 57,  // Trans-Orange
  107: 45, // Trans-Pink
  108: 35, // Trans-Bright Green
  113: 43, // Trans-Very Light Blue
  114: 44, // Trans-Light Purple
  121: 54, // Trans-Neon Yellow
  164: 231, // Trans-Light Orange
  221: 285, // Trans-Light Green
  226: 49,  // Trans-Light Bright Green
  251: 40,  // Trans-Black (2023)

  // Chrome, Pearl, Metallic, Glitter, Satin, Glow & Speckle
  21: 334,  // Chrome Gold
  22: 383,  // Chrome Silver
  46: 21,   // Glow In Dark Opaque
  61: 142,  // Pearl Light Gold
  65: 82,   // Metallic Gold
  66: 135,  // Pearl Light Gray
  67: 80,   // Metallic Silver
  77: 148,  // Pearl Dark Gray
  78: 137,  // Metal Blue
  81: 178,  // Flat Dark Gold
  83: 183,  // Pearl White
  84: 134,  // Copper
  95: 179,  // Flat Silver
  100: 114, // Glitter Trans-Dark Pink
  101: 117, // Glitter Trans-Clear
  102: 129, // Glitter Trans-Purple
  115: 297, // Pearl Gold
  116: 134, // Speckle Black-Copper -> Copper
  118: 294, // Glow In Dark Trans
  119: 150, // Pearl Very Light Gray
  159: 329, // Glow In Dark White
  223: 339, // Satin Trans-Light Blue
  224: 367, // Satin Trans-Dark Pink
  228: 360, // Satin Trans-Clear
  229: 363, // Satin Trans-Brown / Black
  230: 364, // Satin Trans-Purple
  232: 362, // Satin Trans-Dark Blue
  233: 365, // Satin Trans-Bright Green
  250: 300, // Metallic Copper
};

const STUDIO_HEADER_RE = /^\s*0\s+(?:IsSubModel|IsAssembly|BL_Item_No|BL_Item_Key|FlexibleType|BL_CategoryIndex)\b/i;
const STUDIO_NEG_COLOR_RE = /^\s*(?:0\s+!:\s+)?[12345]\s+-(?:1|2)(?:\s|$)/;
const GEOM_OR_REF_LINE_RE = /^(\s*(?:0\s+!:\s+)?[12345]\s+)(\S+)([\s\S]*)$/;

export function mapBrickLinkColorToLDraw(blColorId: number): number {
  if (blColorId === -1) return 16;
  if (blColorId === -2) return 24;
  return BRICKLINK_TO_LDRAW_COLOR[blColorId] ?? blColorId;
}

/**
 * Returns true if a `.dat` file's raw lines appear to be unconverted BrickLink Studio
 * `model2.ldr` content (which uses BrickLink color IDs and `-1`/`-2` inherit/edge tokens).
 */
export function isUnconvertedStudioDatLines(lines: readonly string[]): boolean {
  const markerScan = Math.min(lines.length, 4);
  for (let i = 0; i < markerScan; i++) {
    if (lines[i].trim() === STUDIO_DAT_CONVERTED_MARKER) return false;
  }
  const headerScan = Math.min(lines.length, 24);
  for (let i = 0; i < headerScan; i++) {
    if (STUDIO_HEADER_RE.test(lines[i])) return true;
  }
  for (let i = 0; i < lines.length; i++) {
    if (STUDIO_NEG_COLOR_RE.test(lines[i])) return true;
  }
  return false;
}

/**
 * Converts BrickLink color IDs (including `-1` -> `16` and `-2` -> `24`) inside a Studio
 * `model2.ldr` embedded `.dat` file to standard LDraw color IDs, and tags the lines with
 * `STUDIO_DAT_CONVERTED_MARKER` so repeated calls are a no-op.
 */
export function convertStudioDatLinesToLDraw(lines: readonly string[]): string[] {
  const markerScan = Math.min(lines.length, 4);
  for (let i = 0; i < markerScan; i++) {
    if (lines[i].trim() === STUDIO_DAT_CONVERTED_MARKER) return lines.slice();
  }
  const out: string[] = [STUDIO_DAT_CONVERTED_MARKER];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = GEOM_OR_REF_LINE_RE.exec(line);
    if (!m) {
      out.push(line);
      continue;
    }
    const rawCol = m[2];
    if (/^0[xX]2[0-9a-fA-F]{6}$/.test(rawCol)) {
      out.push(line);
      continue;
    }
    const parsed = parseInt(rawCol, 10);
    if (!Number.isFinite(parsed)) {
      out.push(line);
      continue;
    }
    const ldrawCol = mapBrickLinkColorToLDraw(parsed);
    out.push(ldrawCol === parsed ? line : `${m[1]}${ldrawCol}${m[3]}`);
  }
  return out;
}
