import { describe, expect, it } from 'vitest';
import {
  BACK_COVER_CREDIT,
  COVER_MADE_WITH_LABEL,
  COVER_QR_HINT_TEXT,
  PROGRAM_NAME,
  PROGRAM_URL,
  computeCoverLayout,
  computeTightCameraBounds,
  createDefaultBackMeta,
  createDefaultCompleteMeta,
  createDefaultCoverMeta,
  isHeroCameraCustomized,
  normalizeBackMeta,
  normalizeCompleteMeta,
  normalizeCoverMeta,
} from '../coverLayout';
import { buildQrSvg, generateQrMatrix } from '../qrCode';
import {
  computeLightOrthoMVP,
  computeShadowNormalOffsets,
  computeStudioLightDirs,
  computeStudioOrthoCamera,
  computeStudioTelephotoCamera,
} from '../studioPhotoRenderer';
import { buildPdfBinary, canvasRectToPdfLink } from '../../export/pdfBinary';

// Minimal ISO/IEC 18004 verifier: extracts format info, unmasks data modules, verifies GF(256)
// Reed-Solomon syndromes for Version 4-M, and decodes the Byte-mode UTF-8 payload!
function decodeVersion4MBytePayload(modules: boolean[][]): {
  ecBits: number;
  mask: number;
  text: string;
  syndromeZeros: boolean;
} {
  const size = modules.length;
  expect(size).toBe(33); // Version 4

  // Read Copy 1 format bits
  const coords1: Array<[number, number]> = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  let fmt1 = 0;
  for (const [r, c] of coords1) fmt1 = (fmt1 << 1) | (modules[r][c] ? 1 : 0);

  // Read Copy 2 format bits and ensure exact agreement
  let fmt2 = 0;
  for (let i = 0; i < 7; i++) fmt2 = (fmt2 << 1) | (modules[size - 1 - i][8] ? 1 : 0);
  for (let i = 0; i < 8; i++) fmt2 = (fmt2 << 1) | (modules[8][size - 8 + i] ? 1 : 0);
  expect(fmt1).toBe(fmt2);

  const unmaskedFmt = fmt1 ^ 0x5412;
  const data5 = unmaskedFmt >>> 10;
  const ecBits = (data5 >>> 3) & 0b11;
  const mask = data5 & 0b111;

  // Rebuild reserved mask for Version 4
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const markFinder = (t: number, l: number) => {
    for (let dr = -1; dr <= 7; dr++) {
      for (let dc = -1; dc <= 7; dc++) {
        const r = t + dr;
        const c = l + dc;
        if (r >= 0 && r < size && c >= 0 && c < size) reserved[r][c] = true;
      }
    }
  };
  markFinder(0, 0);
  markFinder(0, size - 7);
  markFinder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
  }
  // V4 alignment at (26, 26)
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      reserved[26 + dr][26 + dc] = true;
    }
  }
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }
  reserved[size - 8][8] = true;

  const maskBit = (r: number, c: number) => {
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
  };

  // Extract bits in zigzag order
  const bits: number[] = [];
  let upward = true;
  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    if (rightCol === 6) rightCol = 5;
    for (let step = 0; step < size; step++) {
      const r = upward ? size - 1 - step : step;
      for (let dx = 0; dx < 2; dx++) {
        const c = rightCol - dx;
        if (reserved[r][c]) continue;
        const raw = modules[r][c];
        const unmasked = maskBit(r, c) ? !raw : raw;
        bits.push(unmasked ? 1 : 0);
      }
    }
    upward = !upward;
  }

  // Convert first 800 bits -> 100 interleaved codewords (V4-M: 2 blocks of 32 data + 18 EC)
  const codewords = new Uint8Array(100);
  for (let i = 0; i < 100; i++) {
    let b = 0;
    for (let k = 0; k < 8; k++) b = (b << 1) | bits[i * 8 + k];
    codewords[i] = b;
  }

  // De-interleave into 2 blocks of 32 data + 18 EC
  const blocks = [new Uint8Array(50), new Uint8Array(50)];
  for (let i = 0; i < 32; i++) {
    blocks[0][i] = codewords[i * 2];
    blocks[1][i] = codewords[i * 2 + 1];
  }
  for (let i = 0; i < 18; i++) {
    blocks[0][32 + i] = codewords[64 + i * 2];
    blocks[1][32 + i] = codewords[64 + i * 2 + 1];
  }

  // Verify Reed-Solomon syndromes at alpha^0 .. alpha^17 in GF(256) (poly 0x11d)
  const exp = new Uint8Array(512);
  const log = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = x;
    log[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const mul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : exp[log[a] + log[b]]);

  let syndromeZeros = true;
  for (const blk of blocks) {
    for (let root = 0; root < 18; root++) {
      let acc = 0;
      const alpha = exp[root];
      for (let i = 0; i < blk.length; i++) {
        acc = mul(acc, alpha) ^ blk[i];
      }
      if (acc !== 0) syndromeZeros = false;
    }
  }

  // Reconstruct 64 data bytes -> decode Byte mode payload
  const dataBytes = new Uint8Array(64);
  dataBytes.set(blocks[0].subarray(0, 32), 0);
  dataBytes.set(blocks[1].subarray(0, 32), 32);

  const dataBits: number[] = [];
  for (const b of dataBytes) {
    for (let k = 7; k >= 0; k--) dataBits.push((b >>> k) & 1);
  }
  const readBits = (pos: number, len: number) => {
    let v = 0;
    for (let i = 0; i < len; i++) v = (v << 1) | dataBits[pos + i];
    return v;
  };
  const mode = readBits(0, 4);
  expect(mode).toBe(0b0100);
  const byteLen = readBits(4, 8);
  const payload = new Uint8Array(byteLen);
  for (let i = 0; i < byteLen; i++) {
    payload[i] = readBits(12 + i * 8, 8);
  }
  return {
    ecBits,
    mask,
    text: new TextDecoder().decode(payload),
    syndromeZeros,
  };
}

describe('QR Code Generator (ISO/IEC 18004)', () => {
  it('encodes the Brick Instruction Creator URL into a valid, syndrome-clean Version 4-M QR matrix', () => {
    const qr = generateQrMatrix(PROGRAM_URL, 'M');
    expect(qr.version).toBe(4);
    expect(qr.size).toBe(33);
    expect(qr.ecLevel).toBe('M');

    // Verify all 3 finder pattern cores & timing pattern & fixed dark module
    expect(qr.modules[3][3]).toBe(true);
    expect(qr.modules[3][qr.size - 4]).toBe(true);
    expect(qr.modules[qr.size - 4][3]).toBe(true);
    expect(qr.modules[qr.size - 8][8]).toBe(true);
    expect(qr.modules[6][8]).toBe(true);
    expect(qr.modules[6][9]).toBe(false);
    // Version 4 alignment pattern center at (26, 26)
    expect(qr.modules[26][26]).toBe(true);
    expect(qr.modules[25][26]).toBe(false);
    expect(qr.modules[24][26]).toBe(true);

    // Full mathematical round-trip decode + Reed-Solomon syndrome verification
    const decoded = decodeVersion4MBytePayload(qr.modules);
    expect(decoded.ecBits).toBe(0b00); // EC level M
    expect(decoded.mask).toBe(qr.maskPattern);
    expect(decoded.syndromeZeros).toBe(true);
    expect(decoded.text).toBe(PROGRAM_URL);
  });

  it('builds a crisp single-path SVG for the QR code', () => {
    const svg = buildQrSvg(PROGRAM_URL, { quietZone: 1, ariaLabel: `QR code for ${PROGRAM_NAME}` });
    expect(svg).toContain('viewBox="0 0 35 35"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('<path d="M');
  });
});

describe('Cover Metadata & LEGO-Style Layout Geometry', () => {
  it('exposes canonical front and back cover branding copy', () => {
    expect(PROGRAM_NAME).toBe('Brick Instruction Works');
    expect(COVER_MADE_WITH_LABEL).toBe('Made with');
    expect(COVER_QR_HINT_TEXT).toBe('Scan QR to visit the website');
    expect(BACK_COVER_CREDIT).toBe('Made with Brick Instruction Works');
  });

  it('creates clean editorial defaults with optional empty subtitle and locked attribution + QR', () => {
    const def = createDefaultCoverMeta();
    expect(def.title).toBe('');
    expect(def.subtitle).toBe('');
    expect(def.creatorLogoSrc).toBeNull();
    expect(def.themeImageSrc).toBeNull();
    expect(def.bgSrc).toBeNull();
    expect(def.showQrCode).toBe(true);
    expect(def.showProgramBadge).toBe(true);
    expect(def.el).toBe(18);

    const withCreatorDefaults = createDefaultCoverMeta({
      showText: true,
      creatorLogoSrc: 'data:image/png;base64,AAA=',
      subtitle: 'Designed by Test Studio',
    });
    expect(withCreatorDefaults.creatorLogoSrc).toBe('data:image/png;base64,AAA=');
    expect(withCreatorDefaults.subtitle).toBe('Designed by Test Studio');
    expect(withCreatorDefaults.showText).toBe(true);

    const emptyLogo = createDefaultCoverMeta({ creatorLogoSrc: '', subtitle: '' });
    expect(emptyLogo.creatorLogoSrc).toBeNull();
    expect(emptyLogo.subtitle).toBe('');

    const backDef = createDefaultBackMeta();
    expect(backDef.subtitle).toBe(BACK_COVER_CREDIT);
    expect(backDef.bgSrc).toBeNull();
  });

  it('normalizes legacy or modified coverMeta and backMeta while keeping Brick Instruction Works bits non-editable', () => {
    const legacy = normalizeCoverMeta({
      title: 'Cargo Ship',
      subtitle: '',
      az: 45,
      el: 99,
      bgSrc: null,
      showQrCode: false,
      showProgramBadge: false,
    });
    expect(legacy.title).toBe('Cargo Ship');
    expect(legacy.el).toBe(75); // Clamped into full hero elevation range (-75..75)
    expect(legacy.zoom).toBe(1.0);
    expect(legacy.showQrCode).toBe(true);
    expect(legacy.showProgramBadge).toBe(true);
    expect(legacy.creatorLogoSrc).toBeNull();
    expect(legacy.themeImageSrc).toBeNull();

    const customBack = normalizeBackMeta({
      subtitle: 'Custom Edited Credit',
      bgSrc: 'data:image/png;base64,ABC',
      az: 90,
      el: 20,
    });
    expect(customBack.subtitle).toBe(BACK_COVER_CREDIT);
    expect(customBack.bgSrc).toBe('data:image/png;base64,ABC');
  });

  it('normalizes Build Complete metadata with full elevation (-75..75) and zoom (0.5..2.0) bounds', () => {
    const def = createDefaultCompleteMeta();
    expect(def.az).toBe(315);
    expect(def.el).toBe(28);
    expect(def.zoom).toBe(1.0);
    expect(def.showText).toBe(true);
    expect(def.showFireworks).toBe(true);

    const norm = normalizeCompleteMeta({ title: 'Done!', az: -45, el: -30, zoom: 2.5, showFireworks: false });
    expect(norm.title).toBe('Done!');
    expect(norm.az).toBe(315);
    expect(norm.el).toBe(-30); // allows full bottom-view inspection
    expect(norm.zoom).toBe(2.0); // clamped to max hero zoom
    expect(norm.showText).toBe(true);
    expect(norm.showFireworks).toBe(false);

    const clampedLow = normalizeCompleteMeta({ el: -120, zoom: 0.1 });
    expect(clampedLow.el).toBe(-75);
    expect(clampedLow.zoom).toBe(0.5);
  });

  it('detects whether a hero camera differs from its default angle, elevation, or zoom', () => {
    const def = createDefaultCoverMeta();
    expect(isHeroCameraCustomized({ az: 34, el: 18, zoom: 1.0 }, def)).toBe(false);
    expect(isHeroCameraCustomized({ az: 394, el: 18, zoom: 1.0 }, def)).toBe(false); // 360° wrap
    expect(isHeroCameraCustomized({ az: 142, el: 18, zoom: 1.0 }, def)).toBe(true);
    expect(isHeroCameraCustomized({ az: 34, el: 30, zoom: 1.0 }, def)).toBe(true);
    expect(isHeroCameraCustomized({ az: 34, el: 18, zoom: 1.2 }, def)).toBe(true);
  });

  it('computes a page-filling hero region and non-overlapping corner zones on landscape, portrait, square, and narrow pages', () => {
    for (const [pageW, pageH] of [[1100, 850], [850, 1100], [900, 900], [528, 816]]) {
      const layout = computeCoverLayout({
        pageW,
        pageH,
        hasCreatorLogo: true,
        hasSubtitle: true,
        hasThemeImage: true,
      });

      // Hero render fills nearly the entire page width and generous height with clean corner clearance
      expect(layout.heroRect.w / pageW).toBeGreaterThan(0.92);
      expect(layout.heroRect.h / pageH).toBeGreaterThan(0.64);

      // Top-left and top-right zones never overlap horizontally
      expect(layout.pad + layout.topLeftMaxW).toBeLessThan(pageW - layout.pad - layout.topRightMaxW);

      // Bottom-right clickable group always contains both attribution card and QR square inside page bounds
      expect(layout.brandGroupRect.x).toBeGreaterThanOrEqual(layout.pad);
      expect(layout.brandGroupRect.y).toBeGreaterThan(0);
      expect(layout.brandGroupRect.x + layout.brandGroupRect.w).toBeLessThanOrEqual(pageW - layout.pad + 1);
      expect(layout.brandGroupRect.y + layout.brandGroupRect.h).toBeLessThanOrEqual(pageH - layout.pad + 1);
      expect(layout.qrCardRect.w).toBe(layout.qrCardRect.h);
      expect(layout.brandEyebrowFontPx).toBeGreaterThan(0);
      expect(layout.brandTitleFontPx).toBeGreaterThan(layout.brandEyebrowFontPx);
      expect(layout.brandQrHintFontPx).toBeGreaterThan(0);
    }
  });

  it('always keeps the program attribution badge and QR code present even if false flags are passed', () => {
    const layout = computeCoverLayout({
      pageW: 1100,
      pageH: 850,
      hasCreatorLogo: false,
      hasSubtitle: false,
      hasThemeImage: false,
      showQrCode: false,
      showProgramBadge: false,
    });
    expect(layout.qrCardRect.w).toBeGreaterThan(30);
    expect(layout.qrCardRect.w).toBe(layout.qrCardRect.h);
    expect(layout.brandCardRect.w).toBeGreaterThan(100);
    expect(layout.brandGroupRect.w).toBe(layout.brandCardRect.w + layout.brandGap + layout.qrCardRect.w);
  });

  it('supports optional wordless coverMeta.showText and expands heroRect upward when title is hidden', () => {
    const wordlessMeta = createDefaultCoverMeta({ showText: false });
    expect(wordlessMeta.showText).toBe(false);
    expect(wordlessMeta.showQrCode).toBe(true);
    expect(wordlessMeta.showProgramBadge).toBe(true);

    // Legacy coverMeta without showText respects fallback defaultShowText
    expect(normalizeCoverMeta({ title: 'Rover' }, true).showText).toBe(true);
    expect(normalizeCoverMeta({ title: 'Rover' }, false).showText).toBe(false);
    expect(normalizeCoverMeta({ title: 'Rover', showText: true }, false).showText).toBe(true);

    const withTitle = computeCoverLayout({
      pageW: 1100,
      pageH: 850,
      hasCreatorLogo: false,
      hasTitle: true,
      hasSubtitle: false,
      hasThemeImage: false,
    });
    const withoutTitle = computeCoverLayout({
      pageW: 1100,
      pageH: 850,
      hasCreatorLogo: false,
      hasTitle: false,
      hasSubtitle: false,
      hasThemeImage: false,
    });
    expect(withoutTitle.heroRect.y).toBeLessThan(withTitle.heroRect.y);
    expect(withoutTitle.heroRect.h).toBeGreaterThan(withTitle.heroRect.h);
  });

  it('computes tight camera-space orthographic bounds for elongated models', () => {
    // 4:1 wide container-ship-like box: X in [-200..200], Y in [0..80], Z in [-40..40]
    const corners = [
      -200, 0, -40, 200, 0, -40, 200, 80, -40,
      -200, 0, 40, 200, 80, 40, -200, 80, 40,
    ];
    const tb = computeTightCameraBounds(
      new Float32Array(corners),
      [0, 40, 0],
      0,
      0,
      1000,
      600,
      1.0,
      1.06,
    );
    expect(tb).not.toBeNull();
    // SpanX = 400 -> halfW should be tight around 200 * 1.06 = 212 (much tighter than bounding sphere ~220 * aspect!)
    expect(tb!.halfW).toBeCloseTo(212, 1);
    expect(tb!.centerX).toBeCloseTo(0, 2);
    expect(tb!.centerY).toBeCloseTo(0, 2);
  });

  it('includes all vertex buffers when computing tight bounds across untextured and textured meshes', () => {
    const baseTri = new Float32Array([-20, 0, 0, 20, 0, 0, 0, 20, 0]);
    const texTri = new Float32Array([-20, -40, 0, 20, -40, 0, 0, -10, 0]);
    const tb = computeTightCameraBounds([baseTri, texTri], [0, -10, 0], 0, 0, 400, 400, 1.0, 1.0);
    expect(tb).not.toBeNull();
    // Combined Y span is [-40..20] = 60 -> halfH = 30
    expect(tb!.halfH).toBeCloseTo(30, 1);
    expect(tb!.centerY).toBeCloseTo(0, 1);
  });
});

describe('PDF 1.4 Binary Builder with Clickable Link Annotations', () => {
  it('converts top-left canvas pixel coordinates into PDF bottom-left point coordinates', () => {
    const link = canvasRectToPdfLink(
      { x: 800, y: 700, w: 250, h: 100 },
      1100,
      850,
      792,
      612,
      PROGRAM_URL,
    );
    // Top of box is y=700/850 down from top -> ury = 612 * (1 - 700/850) = 108
    // Bottom of box is y=800/850 down from top -> lly = 612 * (1 - 800/850) = 36
    expect(link.llx).toBeCloseTo((800 / 1100) * 792, 1);
    expect(link.urx).toBeCloseTo((1050 / 1100) * 792, 1);
    expect(link.ury).toBeCloseTo(108, 1);
    expect(link.lly).toBeCloseTo(36, 1);
    expect(link.url).toBe(PROGRAM_URL);
  });

  it('builds a valid multi-page PDF 1.4 with clickable URI annotations and exact byte-accurate xref offsets', () => {
    const fakeJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
    const coverLink = canvasRectToPdfLink(
      { x: 800, y: 720, w: 240, h: 80 },
      1100,
      850,
      792,
      612,
      PROGRAM_URL,
    );
    const backLink = canvasRectToPdfLink(
      { x: 420, y: 360, w: 260, h: 160 },
      1100,
      850,
      792,
      612,
      PROGRAM_URL,
    );

    const pdf = buildPdfBinary(
      [
        { bytes: fakeJpeg, pxW: 1100, pxH: 850, links: [coverLink] },
        { bytes: fakeJpeg, pxW: 1100, pxH: 850 },
        { bytes: fakeJpeg, pxW: 1100, pxH: 850, links: [backLink] },
      ],
      792,
      612,
    );

    const text = new TextDecoder('latin1').decode(pdf);
    expect(text.startsWith('%PDF-1.4\n')).toBe(true);
    expect(text.endsWith('%%EOF')).toBe(true);
    expect(text).toContain('/Count 3');
    expect(text).toContain(`/Annots [6 0 R]`);
    expect(text).toContain(`/Subtype /Link`);
    expect(text).toContain(`/Border [0 0 0]`);
    expect(text).toContain(`/URI (${PROGRAM_URL})`);

    // Verify every single xref offset points to the exact byte start of `<id> 0 obj`!
    const xrefIdx = text.lastIndexOf('\nxref\n') + 1;
    expect(xrefIdx).toBeGreaterThan(0);
    const startxrefMatch = text.match(/startxref\n(\d+)\n%%EOF$/);
    expect(startxrefMatch).not.toBeNull();
    expect(Number(startxrefMatch![1])).toBe(xrefIdx);

    const xrefLines = text.slice(xrefIdx).split('\n');
    const headerParts = xrefLines[1].trim().split(' ');
    const objCount = Number(headerParts[1]); // 1 free + 2 (Catalog, Pages) + 3*3 + 2 annots = 14
    expect(objCount).toBe(14);
    for (let objId = 1; objId < objCount; objId++) {
      const entry = xrefLines[2 + objId];
      const byteOffset = Number(entry.slice(0, 10));
      const slice = text.slice(byteOffset, byteOffset + 20);
      expect(slice.startsWith(`${objId} 0 obj\n`)).toBe(true);
    }
  });
});

describe('Photorealistic Studio Camera & Softbox Light Rig', () => {
  it('fits every vertex of an elongated model tightly inside the telephoto perspective frustum', () => {
    const corners = new Float32Array([
      -200, 0, -40, 200, 0, -40, 200, 90, -40,
      -200, 0, 40, 200, 90, 40, -200, 90, 40,
    ]);
    const cam = computeStudioTelephotoCamera(corners, [0, 45, 0], 34, 18, 1200, 720, 1.0, 18.5);
    expect(cam.near).toBeGreaterThan(0);
    expect(cam.far).toBeGreaterThan(cam.near);

    // Project every corner through cam.mvp and ensure all sit cleanly inside [-1, 1] NDC
    let maxAbsX = 0;
    let maxAbsY = 0;
    for (let i = 0; i < corners.length; i += 3) {
      const x = corners[i], y = corners[i + 1], z = corners[i + 2];
      const m = cam.mvp;
      const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
      const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
      const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      maxAbsX = Math.max(maxAbsX, Math.abs(cx / cw));
      maxAbsY = Math.max(maxAbsY, Math.abs(cy / cw));
    }
    expect(maxAbsX).toBeGreaterThan(0.8);
    expect(maxAbsX).toBeLessThanOrEqual(0.98);
    expect(maxAbsY).toBeLessThanOrEqual(0.98);
  });

  it('produces normalized upward-angled studio softbox lights and finite shadow-map matrices', () => {
    const lights = computeStudioLightDirs(34);
    for (const dir of [lights.key, lights.fill, lights.rim, lights.overhead]) {
      const len = Math.hypot(dir[0], dir[1], dir[2]);
      expect(len).toBeCloseTo(1.0, 5);
      expect(dir[1]).toBeGreaterThan(0.5); // All studio softboxes sit above the horizon
    }
    const keyMvp = computeLightOrthoMVP([0, 40, 0], 180, lights.key);
    expect(keyMvp.length).toBe(16);
    expect(Array.from(keyMvp).every((v) => Number.isFinite(v))).toBe(true);
  });

  it('computes orthographic step camera matrices aligned to target center and zoom', () => {
    const cam1x = computeStudioOrthoCamera([10, 20, -5], 80, 120, 45, 30, 1200, 900, 1.0);
    const cam2x = computeStudioOrthoCamera([10, 20, -5], 80, 120, 45, 30, 1200, 900, 2.0);
    expect(cam1x.fovYDeg).toBe(0);
    expect(cam1x.mvp.length).toBe(16);
    expect(Array.from(cam1x.mvp).every((v) => Number.isFinite(v))).toBe(true);
    // Target center projects to NDC (0, 0)
    const m = cam1x.mvp;
    const cx = m[0] * 10 + m[4] * 20 + m[8] * -5 + m[12];
    const cy = m[1] * 10 + m[5] * 20 + m[9] * -5 + m[13];
    expect(Math.abs(cx)).toBeLessThan(1e-4);
    expect(Math.abs(cy)).toBeLessThan(1e-4);
    // 2x zoom doubles orthographic projection scale
    expect(Math.abs(cam2x.proj[0] / cam1x.proj[0])).toBeCloseTo(2.0, 5);
    expect(Math.abs(cam2x.proj[5] / cam1x.proj[5])).toBeCloseTo(2.0, 5);

    // With elongated bounds, projected orthographic framing scales significantly larger than sphere-only framing
    const elongatedBounds = { minX: -40, maxX: 40, minY: 0, maxY: 100, minZ: -400, maxZ: 400 };
    const r = Math.hypot(40, 50, 400);
    const sphereCam = computeStudioOrthoCamera([0, 50, 0], r, r, 38, 28, 800, 1000, 1.0);
    const projCam = computeStudioOrthoCamera(
      [0, 50, 0],
      r,
      r,
      38,
      28,
      800,
      1000,
      1.0,
      0,
      undefined,
      0,
      0,
      elongatedBounds,
    );
    expect(Math.abs(projCam.proj[0])).toBeGreaterThan(Math.abs(sphereCam.proj[0]) * 1.35);
    expect(Math.abs(projCam.proj[5])).toBeGreaterThan(Math.abs(sphereCam.proj[5]) * 1.35);
  });

  it('computes normal-offset shadow biases that clear PCF spreads on vertical walls for any model size', () => {
    const lights = computeStudioLightDirs(34);
    const small = computeShadowNormalOffsets(120, 2048, 1024, 1024);
    const large = computeShadowNormalOffsets(600, 2048, 1024, 1024);

    // Scales linearly with model radius
    expect(large[0] / small[0]).toBeCloseTo(5.0, 5);
    expect(large[1] / small[1]).toBeCloseTo(5.0, 5);
    expect(large[2] / small[2]).toBeCloseTo(5.0, 5);

    // On a vertical wall (normal = [1, 0, 0]), the overhead normal-offset * sin(theta)
    // must strictly exceed the 2.8-texel overhead PCF radius so horizontal acne bands never form.
    const overTexelWorld = (2 * 600 * 1.4) / 1024;
    const od = lights.overhead[0]; // dot([1, 0, 0], overhead)
    const overSin = Math.sqrt(Math.max(0, 1 - od * od));
    const effectiveOverTexels = (large[2] * overSin) / overTexelWorld;
    expect(effectiveOverTexels).toBeGreaterThan(2.8);

    // On a horizontal top face (normal = [0, 1, 0]), overhead sin(theta) stays tiny (< 0.4 texels)
    // so stud contact shadows remain tight with zero peter-panning.
    const topSin = Math.sqrt(Math.max(0, 1 - lights.overhead[1] * lights.overhead[1]));
    const effectiveTopTexels = (large[2] * topSin) / overTexelWorld;
    expect(effectiveTopTexels).toBeLessThan(0.4);
  });

  it('flips the model upside down (world -Y up on screen) and inverts the studio light dome when elDeg < 0', () => {
    const camBottom = computeStudioOrthoCamera([0, 20, 0], 80, 120, 38, -30, 1200, 900, 1.0);
    // Project a point below center (y = 0) vs above center (y = 40) through camBottom.mvp:
    // Because the model is flipped upside down on the table, lower world-Y projects HIGHER on screen (larger NDC y)!
    const m = camBottom.mvp;
    const ndcYBelow = m[1] * 0 + m[5] * 0 + m[9] * 0 + m[13];
    const ndcYAbove = m[1] * 0 + m[5] * 40 + m[9] * 0 + m[13];
    expect(ndcYBelow).toBeGreaterThan(ndcYAbove);

    // Studio softbox lights flip onto the -Y side so the exposed upward-facing underside is brightly lit from above
    const bottomLights = computeStudioLightDirs(38, -30);
    for (const dir of [bottomLights.key, bottomLights.fill, bottomLights.rim, bottomLights.overhead]) {
      expect(Math.hypot(dir[0], dir[1], dir[2])).toBeCloseTo(1.0, 5);
      expect(dir[1]).toBeLessThan(-0.5);
    }
  });

  it('keeps the model upright (world +Y up on screen) when keepUpright is true even if elDeg < 0', () => {
    const camUpright = computeStudioOrthoCamera([0, 20, 0], 80, 120, 38, -30, 1200, 900, 1.0, 0, undefined, 0, 0, null, null, true);
    const m = camUpright.mvp;
    const ndcYBelow = m[1] * 0 + m[5] * 0 + m[9] * 0 + m[13];
    const ndcYAbove = m[1] * 0 + m[5] * 40 + m[9] * 0 + m[13];
    expect(ndcYAbove).toBeGreaterThan(ndcYBelow);

    const uprightLights = computeStudioLightDirs(38, -30, true);
    for (const dir of [uprightLights.key, uprightLights.fill, uprightLights.rim, uprightLights.overhead]) {
      expect(dir[1]).toBeGreaterThan(0.5);
    }
  });
});



