// Pure-TypeScript ISO/IEC 18004 QR Code Generator (Byte mode, Versions 1–6, EC L/M)
// Zero external dependencies — Neocities & offline friendly.

export type QrErrorCorrectionLevel = 'L' | 'M';

export interface QrMatrix {
  version: number;
  size: number;
  ecLevel: QrErrorCorrectionLevel;
  maskPattern: number;
  modules: boolean[][];
}

interface VersionSpec {
  version: number;
  totalDataCodewords: number;
  ecCodewordsPerBlock: number;
  blocks: number;
  alignmentCenters: number[];
}

// ISO/IEC 18004 Tables 1 & 9 for Versions 1–6 (all blocks have equal length in V1–V6 for L & M)
const VERSION_SPECS: Record<QrErrorCorrectionLevel, VersionSpec[]> = {
  L: [
    { version: 1, totalDataCodewords: 19, ecCodewordsPerBlock: 7, blocks: 1, alignmentCenters: [] },
    { version: 2, totalDataCodewords: 34, ecCodewordsPerBlock: 10, blocks: 1, alignmentCenters: [6, 18] },
    { version: 3, totalDataCodewords: 55, ecCodewordsPerBlock: 15, blocks: 1, alignmentCenters: [6, 22] },
    { version: 4, totalDataCodewords: 80, ecCodewordsPerBlock: 20, blocks: 1, alignmentCenters: [6, 26] },
    { version: 5, totalDataCodewords: 108, ecCodewordsPerBlock: 26, blocks: 1, alignmentCenters: [6, 30] },
    { version: 6, totalDataCodewords: 136, ecCodewordsPerBlock: 18, blocks: 2, alignmentCenters: [6, 34] },
  ],
  M: [
    { version: 1, totalDataCodewords: 16, ecCodewordsPerBlock: 10, blocks: 1, alignmentCenters: [] },
    { version: 2, totalDataCodewords: 28, ecCodewordsPerBlock: 16, blocks: 1, alignmentCenters: [6, 18] },
    { version: 3, totalDataCodewords: 44, ecCodewordsPerBlock: 26, blocks: 1, alignmentCenters: [6, 22] },
    { version: 4, totalDataCodewords: 64, ecCodewordsPerBlock: 18, blocks: 2, alignmentCenters: [6, 26] },
    { version: 5, totalDataCodewords: 86, ecCodewordsPerBlock: 24, blocks: 2, alignmentCenters: [6, 30] },
    { version: 6, totalDataCodewords: 108, ecCodewordsPerBlock: 16, blocks: 4, alignmentCenters: [6, 34] },
  ],
};

// Precompute GF(256) exp/log tables with primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11d)
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    GF_EXP[i] = GF_EXP[i - 255];
  }
}

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    const factor = GF_EXP[i];
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], factor);
    }
    poly = next;
  }
  return poly;
}

function rsComputeRemainder(data: Uint8Array, ecCount: number): Uint8Array {
  const gen = rsGeneratorPoly(ecCount);
  const rem = new Uint8Array(ecCount);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < ecCount - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    rem[ecCount - 1] = gfMul(gen[ecCount], factor);
  }
  return rem;
}

function encodeByteDataCodewords(bytes: Uint8Array, totalDataCodewords: number): Uint8Array {
  const bits: number[] = [];
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bits.push((val >>> i) & 1);
    }
  };

  // Byte mode indicator (0100) + 8-bit character count (Versions 1–9)
  pushBits(0b0100, 4);
  pushBits(bytes.length, 8);
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  const maxBits = totalDataCodewords * 8;
  // Terminator (up to 4 zero bits)
  const termLen = Math.min(4, maxBits - bits.length);
  for (let i = 0; i < termLen; i++) bits.push(0);
  // Pad to byte boundary
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = new Uint8Array(totalDataCodewords);
  const byteLen = bits.length / 8;
  for (let i = 0; i < byteLen; i++) {
    let b = 0;
    for (let bit = 0; bit < 8; bit++) {
      b = (b << 1) | bits[i * 8 + bit];
    }
    codewords[i] = b;
  }

  // Pad remaining capacity with alternating 0xEC, 0x11
  let padToggle = true;
  for (let i = byteLen; i < totalDataCodewords; i++) {
    codewords[i] = padToggle ? 0xec : 0x11;
    padToggle = !padToggle;
  }
  return codewords;
}

function interleaveCodewords(data: Uint8Array, spec: VersionSpec): Uint8Array {
  const blockDataLen = spec.totalDataCodewords / spec.blocks;
  const dataBlocks: Uint8Array[] = [];
  const ecBlocks: Uint8Array[] = [];

  for (let b = 0; b < spec.blocks; b++) {
    const slice = data.subarray(b * blockDataLen, (b + 1) * blockDataLen);
    dataBlocks.push(slice);
    ecBlocks.push(rsComputeRemainder(slice, spec.ecCodewordsPerBlock));
  }

  const out = new Uint8Array(spec.totalDataCodewords + spec.blocks * spec.ecCodewordsPerBlock);
  let pos = 0;
  for (let i = 0; i < blockDataLen; i++) {
    for (let b = 0; b < spec.blocks; b++) {
      out[pos++] = dataBlocks[b][i];
    }
  }
  for (let i = 0; i < spec.ecCodewordsPerBlock; i++) {
    for (let b = 0; b < spec.blocks; b++) {
      out[pos++] = ecBlocks[b][i];
    }
  }
  return out;
}

function computeFormatBits(ecLevel: QrErrorCorrectionLevel, maskPattern: number): number {
  const ecBits = ecLevel === 'L' ? 0b01 : 0b00; // M = 00, L = 01
  const data = (ecBits << 3) | (maskPattern & 0b111);
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >>> i) & 1) {
      rem ^= 0x537 << (i - 10);
    }
  }
  return ((data << 10) | rem) ^ 0x5412;
}

function maskCondition(mask: number, r: number, c: number): boolean {
  switch (mask) {
    case 0: return (r + c) % 2 === 0;
    case 1: return r % 2 === 0;
    case 2: return c % 3 === 0;
    case 3: return (r + c) % 3 === 0;
    case 4: return (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
    case 5: return ((r * c) % 2) + ((r * c) % 3) === 0;
    case 6: return (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
    case 7: return (((r + c) % 2) + ((r * c) % 3)) % 2 === 0;
    default: return false;
  }
}

function drawFormatInfo(modules: boolean[][], size: number, ecLevel: QrErrorCorrectionLevel, mask: number): void {
  const bits = computeFormatBits(ecLevel, mask);
  const bitAt = (idx: number) => ((bits >>> idx) & 1) === 1;

  // Copy 1 around top-left finder
  const coords1: Array<[number, number]> = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  for (let i = 0; i < 15; i++) {
    const [r, c] = coords1[i];
    modules[r][c] = bitAt(14 - i);
  }

  // Copy 2 along bottom-left & top-right
  for (let i = 0; i < 7; i++) {
    modules[size - 1 - i][8] = bitAt(14 - i);
  }
  modules[size - 8][8] = true; // Fixed dark module
  for (let i = 0; i < 8; i++) {
    modules[8][size - 8 + i] = bitAt(7 - i);
  }
}

function evaluatePenalty(modules: boolean[][], size: number): number {
  let penalty = 0;

  // Rule 1: 5+ consecutive same-color modules in rows/columns
  for (let r = 0; r < size; r++) {
    let runColor = modules[r][0];
    let runLen = 1;
    for (let c = 1; c < size; c++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }
  for (let c = 0; c < size; c++) {
    let runColor = modules[0][c];
    let runLen = 1;
    for (let r = 1; r < size; r++) {
      if (modules[r][c] === runColor) {
        runLen++;
      } else {
        if (runLen >= 5) penalty += 3 + (runLen - 5);
        runColor = modules[r][c];
        runLen = 1;
      }
    }
    if (runLen >= 5) penalty += 3 + (runLen - 5);
  }

  // Rule 2: 2x2 blocks of same color
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const m = modules[r][c];
      if (m === modules[r][c + 1] && m === modules[r + 1][c] && m === modules[r + 1][c + 1]) {
        penalty += 3;
      }
    }
  }

  // Rule 3: Finder-like 1:1:3:1:1 patterns with 4 light modules before or after
  const checkPattern = (arr: boolean[]) => {
    for (let i = 0; i <= arr.length - 11; i++) {
      const a =
        arr[i] && !arr[i + 1] && arr[i + 2] && arr[i + 3] && arr[i + 4] && !arr[i + 5] && arr[i + 6] &&
        !arr[i + 7] && !arr[i + 8] && !arr[i + 9] && !arr[i + 10];
      const b =
        !arr[i] && !arr[i + 1] && !arr[i + 2] && !arr[i + 3] &&
        arr[i + 4] && !arr[i + 5] && arr[i + 6] && arr[i + 7] && arr[i + 8] && !arr[i + 9] && arr[i + 10];
      if (a || b) penalty += 40;
    }
  };
  for (let r = 0; r < size; r++) checkPattern(modules[r]);
  const colBuf = new Array<boolean>(size);
  for (let c = 0; c < size; c++) {
    for (let r = 0; r < size; r++) colBuf[r] = modules[r][c];
    checkPattern(colBuf);
  }

  // Rule 4: Balance of dark vs light modules
  let dark = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) dark++;
    }
  }
  const pct = (dark * 100) / (size * size);
  const k = Math.floor(Math.abs(pct - 50) / 5);
  penalty += k * 10;

  return penalty;
}

function buildFunctionMatrix(spec: VersionSpec): { modules: boolean[][]; reserved: boolean[][] } {
  const size = 17 + spec.version * 4;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

  const setFn = (r: number, c: number, dark: boolean) => {
    if (r < 0 || r >= size || c < 0 || c >= size) return;
    modules[r][c] = dark;
    reserved[r][c] = true;
  };

  // 3 Finder patterns + 1-module white separators
  const drawFinder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = top + dr;
        const c = left + dc;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
        const onBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6;
        const inCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
        setFn(r, c, inOuter && (onBorder || inCore));
      }
    }
  };
  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    const dark = i % 2 === 0;
    setFn(6, i, dark);
    setFn(i, 6, dark);
  }

  // Alignment patterns (Version 2+)
  const centers = spec.alignmentCenters;
  for (const cr of centers) {
    for (const cc of centers) {
      if (reserved[cr][cc]) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const dist = Math.max(Math.abs(dr), Math.abs(dc));
          setFn(cr + dr, cc + dc, dist === 0 || dist === 2);
        }
      }
    }
  }

  // Reserve format info modules + dark module
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      reserved[8][i] = true;
      reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  setFn(size - 8, 8, true);

  return { modules, reserved };
}

const qrCache = new Map<string, QrMatrix>();

export function generateQrMatrix(text: string, ecLevel: QrErrorCorrectionLevel = 'M'): QrMatrix {
  const cacheKey = `${ecLevel}:${text}`;
  const cached = qrCache.get(cacheKey);
  if (cached) return cached;

  const bytes = new TextEncoder().encode(text);
  // Byte mode overhead is 4 (mode) + 8 (count) = 12 bits -> need at least bytes.length + 2 codewords
  const specs = VERSION_SPECS[ecLevel];
  const spec = specs.find((s) => bytes.length + 2 <= s.totalDataCodewords);
  if (!spec) {
    throw new Error(`QR payload (${bytes.length} bytes) exceeds supported Version 6-${ecLevel} capacity.`);
  }

  const size = 17 + spec.version * 4;
  const dataCodewords = encodeByteDataCodewords(bytes, spec.totalDataCodewords);
  const fullCodewords = interleaveCodewords(dataCodewords, spec);

  const { modules: baseModules, reserved } = buildFunctionMatrix(spec);

  // Place data bits in upward/downward zigzag pairs
  let bitIdx = 0;
  const totalBits = fullCodewords.length * 8;
  let upward = true;
  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5; // Skip vertical timing column
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = rightCol - dx;
        if (reserved[r][c]) continue;
        let dark = false;
        if (bitIdx < totalBits) {
          const byteVal = fullCodewords[bitIdx >>> 3];
          dark = ((byteVal >>> (7 - (bitIdx & 7))) & 1) === 1;
        }
        bitIdx++;
        baseModules[r][c] = dark;
      }
    }
    upward = !upward;
  }

  // Evaluate all 8 mask patterns and choose minimum penalty
  let bestMask = 0;
  let bestPenalty = Infinity;
  let bestModules = baseModules;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = baseModules.map((row, r) =>
      row.map((val, c) => (reserved[r][c] ? val : maskCondition(mask, r, c) ? !val : val)),
    );
    drawFormatInfo(candidate, size, ecLevel, mask);
    const pen = evaluatePenalty(candidate, size);
    if (pen < bestPenalty) {
      bestPenalty = pen;
      bestMask = mask;
      bestModules = candidate;
    }
  }

  const result: QrMatrix = {
    version: spec.version,
    size,
    ecLevel,
    maskPattern: bestMask,
    modules: bestModules,
  };
  if (qrCache.size > 32) qrCache.clear();
  qrCache.set(cacheKey, result);
  return result;
}

export interface QrRenderOptions {
  fg?: string;
  bg?: string;
  quietZone?: number;
  ecLevel?: QrErrorCorrectionLevel;
  ariaLabel?: string;
}

export function buildQrSvg(text: string, options: QrRenderOptions = {}): string {
  const fg = options.fg ?? '#111827';
  const bg = options.bg ?? '#ffffff';
  const quiet = Math.max(0, options.quietZone ?? 2);
  const qr = generateQrMatrix(text, options.ecLevel ?? 'M');
  const viewSize = qr.size + quiet * 2;

  const pathParts: string[] = [];
  for (let r = 0; r < qr.size; r++) {
    let c = 0;
    while (c < qr.size) {
      if (!qr.modules[r][c]) {
        c++;
        continue;
      }
      const start = c;
      while (c < qr.size && qr.modules[r][c]) c++;
      const run = c - start;
      pathParts.push(`M${start + quiet} ${r + quiet}h${run}v1h-${run}z`);
    }
  }

  const labelAttr = options.ariaLabel
    ? ` role="img" aria-label="${options.ariaLabel.replace(/"/g, '&quot;')}"`
    : ' aria-hidden="true"';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewSize} ${viewSize}" shape-rendering="crispEdges"${labelAttr}><rect width="${viewSize}" height="${viewSize}" fill="${bg}"/><path d="${pathParts.join('')}" fill="${fg}"/></svg>`;
}

export function drawQrCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  sizePx: number,
  options: QrRenderOptions = {},
): void {
  const fg = options.fg ?? '#111827';
  const bg = options.bg ?? '#ffffff';
  const quiet = Math.max(0, options.quietZone ?? 2);
  const qr = generateQrMatrix(text, options.ecLevel ?? 'M');
  const totalModules = qr.size + quiet * 2;
  const cell = sizePx / totalModules;

  ctx.save();
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, sizePx, sizePx);
  ctx.fillStyle = fg;
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (!qr.modules[r][c]) continue;
      const rx = Math.floor(x + (c + quiet) * cell);
      const ry = Math.floor(y + (r + quiet) * cell);
      const rw = Math.ceil(x + (c + quiet + 1) * cell) - rx;
      const rh = Math.ceil(y + (r + quiet + 1) * cell) - ry;
      ctx.fillRect(rx, ry, rw, rh);
    }
  }
  ctx.restore();
}
