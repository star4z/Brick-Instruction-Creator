import { describe, expect, it } from 'vitest';
import { buildPdfBinary, buildPdfBinaryChunks } from '../export/pdfBinary';
import { generateInteractiveHtmlDocument } from '../export/interactiveHtmlExporter';
import {
  parseStudioProjectJson,
  PROJECT_FILE_FORMAT,
  PROJECT_FILE_STUDIO_VERSION,
} from '../storage/fileFormats';
import { sanitizeCssColor } from '../themes/customThemes';
import { computeCameraBasis, normalizeBackMeta } from '../cover/coverLayout';
import { buildQrSvg } from '../cover/qrCode';
import { mat3AlignVectors, mat3Det, mat3MulVec, quantize } from '../engine/math';
import { buildAttachmentStarburstSvg, buildCurvedMotionArrowSvg } from '../engine/calloutCraft';
import { buildLiveStepRenderCacheKey } from '../engine/pageRenderCache';
import { buildProgressBarHtml } from '../engine/buildRoadmap';
import { findShortcutConflict } from '../engine/keyboardShortcuts';
import { parseLDrawSource } from '../engine/ldrawParser';
import { compileDatEntry } from '../engine/datCompiler';
import { isBoxGrounded } from '../engine/floatingCheck';
import { getStudioOriginOffset } from '../engine/studioPartOrigins';
import { extractDatDependencies } from '../engine/ldrLibrary';

// Minimal valid 1x1 JPEG bytes (SOI + EOI)
const MINIMAL_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('Remediation regression tests', () => {
  describe('pdfBinary', () => {
    it('streams chunks via buildPdfBinaryChunks with /Info metadata, /Outlines bookmarks, and /TrimBox', () => {
      const chunks = buildPdfBinaryChunks(
        [
          {
            bytes: MINIMAL_JPEG,
            pxW: 100,
            pxH: 100,
            links: [
              { llx: 10, lly: 10, urx: 90, ury: 30, url: 'https://example.com/ok' },
              { llx: 10, lly: 40, urx: 90, ury: 60, url: 'javascript:alert(1)' },
            ],
          },
        ],
        612,
        792,
        {
          title: 'Test Manual',
          author: 'Creator',
          bookmarks: [{ title: 'Cover', pageIndex: 0 }],
        },
      );
      expect(chunks.length).toBeGreaterThan(2);
      const totalLen = chunks.reduce((acc, c) => acc + c.byteLength, 0);
      const merged = new Uint8Array(totalLen);
      let off = 0;
      for (const c of chunks) {
        merged.set(c, off);
        off += c.byteLength;
      }
      const text = new TextDecoder('latin1').decode(merged);
      expect(text).toContain('/Info ');
      expect(text).toContain('/Outlines ');
      expect(text).toContain('/TrimBox [0 0 612 792]');
      expect(text).toContain('https://example.com/ok');
      expect(text).not.toContain('javascript:alert(1)');
    });

    it('sanitizes non-JPEG bytes and invalid dimensions gracefully in buildPdfBinary', () => {
      const pdfNonJpeg = buildPdfBinary(
        [{ bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), pxW: 0, pxH: -5 }],
        612,
        792,
      );
      const text = new TextDecoder('latin1').decode(pdfNonJpeg);
      expect(text).toContain('/Width 1 /Height 1');
      expect(text).toContain('/Length 0');
    });
  });

  describe('interactiveHtmlExporter', () => {
    it('sanitizes CSS colors and editorUrl, fixes BOM jump-to-step, and preserves #000000 black', () => {
      const html = generateInteractiveHtmlDocument({
        version: 1,
        title: 'Test Model',
        subtitle: '',
        author: 'Tester',
        totalPieces: 0,
        totalSteps: 0,
        editorUrl: 'javascript:alert(1)',
        theme: {
          bg: 'white; }</style><script>alert(1)</script>',
          text: '#111111',
          muted: '#64748b',
          accent: '#1a73e8',
          pliBg: '#f1f5f9',
          pliBorder: '#cbd5e1',
          calloutBg: '#ffffff',
          calloutBorder: '#cbd5e1',
          isDark: false,
        },
        highlightNew: false,
        highlightColor: '#ef4444',
        fadePrev: false,
        fadeOpacity: 0.35,
        prototypes: [],
        textures: {},
        parts: [],
        pages: [],
      });
      expect(html).not.toContain('</style><script>alert(1)');
      expect(html).not.toContain('javascript:alert(1)');
      expect(html).toContain('--border:');
      expect(html).toContain('--surface:');
      expect(html).toContain('webglcontextlost');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('vi.step && Array.isArray(vi.step.pli)');
      expect(html).toContain('vi.step.stepNum');
      // hexToRgb01 uses Number.isNaN instead of falsy `||` so #000000 is true black [0,0,0]
      expect(html).toContain('Number.isNaN(r)');
    });
  });

  describe('fileFormats prototype pollution defense', () => {
    it('strips __proto__, constructor, and prototype keys recursively', () => {
      const raw = JSON.stringify({
        format: PROJECT_FILE_FORMAT,
        version: PROJECT_FILE_STUDIO_VERSION,
        chapters: [],
        state: JSON.parse('{"__proto__":{"polluted":true},"nested":{"constructor":{"x":1},"ok":42}}'),
      });
      const parsed = parseStudioProjectJson(raw);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      const st = parsed.state as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(st, '__proto__')).toBe(false);
      const nested = st.nested as Record<string, unknown>;
      expect(Object.prototype.hasOwnProperty.call(nested, 'constructor')).toBe(false);
      expect(nested.ok).toBe(42);
    });
  });

  describe('customThemes color sanitization', () => {
    it('clamps out-of-range rgb() channels and accepts alpha 1.0', () => {
      expect(sanitizeCssColor('rgba(255, 0, 128, 1.0)', '#000000')).toBe('rgba(255, 0, 128, 1)');
      expect(sanitizeCssColor('rgb(999, 0, 0)', '#000000')).toBe('rgb(255, 0, 0)');
      expect(sanitizeCssColor('red; background: url(x)', '#123456')).toBe('#123456');
    });
  });

  describe('coverLayout & qrCode', () => {
    it('clamps back cover elevation and avoids gimbal lock at el = ±90°', () => {
      const back = normalizeBackMeta({ el: 180 });
      expect(back.el).toBeLessThanOrEqual(80);
      const top = computeCameraBasis(45, 90);
      const bot = computeCameraBasis(45, -90);
      for (const b of [top, bot]) {
        for (const v of [b.right, b.up, b.forward]) {
          expect(v.every(Number.isFinite)).toBe(true);
          const len = Math.hypot(v[0], v[1], v[2]);
          expect(len).toBeCloseTo(1, 5);
        }
      }
    });

    it('uses ISO 4-module quiet zone by default and escapes SVG attributes', () => {
      const svg = buildQrSvg('https://example.com', {
        fg: '#000" onload="alert(1)',
        ariaLabel: 'QR <test> & "quote"',
      });
      expect(svg).not.toContain('onload="alert(1)"');
      expect(svg).toContain('&quot;');
      expect(svg).toContain('&lt;test&gt;');
      // 25-module v2 QR + 4*2 quiet zone = 33, path starts at (4, 4)
      expect(svg).toContain('viewBox="0 0 33 33"');
      expect(svg).toContain('d="M4 4');
    });
  });

  describe('math, calloutCraft, pageRenderCache, buildRoadmap & keyboardShortcuts', () => {
    it('mat3AlignVectors handles anti-parallel vectors with proper rotation (det = +1) and quantize guards step=0', () => {
      const m = mat3AlignVectors([0, 1, 0], [0, -1, 0]);
      expect(mat3Det(m)).toBeCloseTo(1, 5);
      const rotated = mat3MulVec(m, [0, 1, 0]);
      expect(rotated[0]).toBeCloseTo(0, 5);
      expect(rotated[1]).toBeCloseTo(-1, 5);
      expect(rotated[2]).toBeCloseTo(0, 5);
      expect(quantize(7.25, 0)).toBe(7.25);
    });

    it('buildAttachmentStarburstSvg emits unique gradient IDs and buildCurvedMotionArrowSvg flips CCW cleanly', () => {
      const s1 = buildAttachmentStarburstSvg(24);
      const s2 = buildAttachmentStarburstSvg(24);
      const id1 = s1.match(/id="(sbGrad_\d+)"/)?.[1];
      const id2 = s2.match(/id="(sbGrad_\d+)"/)?.[1];
      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);

      const ccw = buildCurvedMotionArrowSvg(32, 'ccw');
      expect(ccw).toContain('translate(44,0) scale(-1,1)');
    });

    it('buildLiveStepRenderCacheKey distinguishes hingeDeg and part arrowColorOverride', () => {
      const base = {
        epoch: 1,
        stepId: 's1',
        prevSignature: 'p0',
        stepSignature: 'p1',
        camAz: 35,
        camEl: 28,
        modelScale: 1,
        width: 400,
        height: 300,
        highlightNew: false,
        fadePrev: false,
        stepLighting: 'standard',
        starkBlackOutlines: false,
        darkBackground: false,
        showArrows: true,
      };
      const k0 = buildLiveStepRenderCacheKey({ ...base, hingeDeg: 0 });
      const k1 = buildLiveStepRenderCacheKey({ ...base, hingeDeg: 45 });
      const k2 = buildLiveStepRenderCacheKey({
        ...base,
        partOffsets: { p1: { dx: 0, dy: 20, dz: 0, arrowColorOverride: '#00ff00' } },
      });
      expect(k0).not.toBe(k1);
      expect(k0).not.toBe(k2);
    });

    it('buildProgressBarHtml sanitizes injected CSS colors', () => {
      const html = buildProgressBarHtml(0.5, {
        accent: '#1a73e8; background: url(javascript:alert(1))',
        trackBg: 'rgba(0,0,0,0.1)',
      });
      expect(html).not.toContain('javascript:');
      expect(html).toContain('#1d4ed8');
    });

    it('findShortcutConflict detects conflict against secondaryDefaultCombo (e.g. Ctrl+Y for redo)', () => {
      const conflict = findShortcutConflict('Mod+Y', 'undo', {});
      expect(conflict).toBe('redo');
    });
  });

  describe('Batch B: parser, BFC/mirrored normals, grounding, origins & !TEXMAP', () => {
    it('ldrawParser handles 0 NOFILE, 0x2RRGGBB colors, mutual recursion, and unique model IDs', () => {
      const mpd = [
        '0 FILE main.ldr',
        '1 0x2FF0088 0 0 0 1 0 0 0 1 0 0 0 1 subA.ldr',
        '0 NOFILE',
        '0 FILE subA.ldr',
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 subB.ldr',
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 3001.dat',
        '0 FILE subB.ldr',
        '1 16 0 0 0 1 0 0 0 1 0 0 0 1 subA.ldr',
      ].join('\n');
      const m1 = parseLDrawSource(mpd, 'test.mpd', 'mpd');
      const m2 = parseLDrawSource(mpd, 'test.mpd', 'mpd');
      expect(m1.id).not.toBe(m2.id);
      expect(m1.parts.length).toBeGreaterThanOrEqual(1);
      expect(m1.parts[0].colorId).toBe(0x2ff0088);
    });

    it('datCompiler flips triangle winding for 0 BFC CW and negative-determinant subfiles', () => {
      const ccwLines = ['0 BFC CERTIFY CCW', '3 16 0 0 0 10 0 0 0 0 10'];
      const cwLines = ['0 BFC CERTIFY CW', '3 16 0 0 0 10 0 0 0 0 10'];
      const mirroredParent = ['1 16 0 0 0 -1 0 0 0 1 0 0 0 1 child.dat'];
      const ccw = compileDatEntry({ key: 't_ccw', lines: ccwLines }, () => null);
      const cw = compileDatEntry({ key: 't_cw', lines: cwLines }, () => null);
      const mirrored = compileDatEntry(
        { key: 't_mir', lines: mirroredParent },
        (ref) => (ref === 'child' || ref === 'child.dat' ? { key: 'child', lines: ccwLines } : null),
      );
      expect(ccw).not.toBeNull();
      expect(cw).not.toBeNull();
      expect(mirrored).not.toBeNull();
      // CW normal should be opposite sign of CCW normal on Y axis
      expect(ccw!.norms[1]).toBeCloseTo(-cw!.norms[1], 4);
      // Mirrored X-reflection flips winding back so Y normal matches unmirrored CCW
      expect(mirrored!.norms[1]).toBeCloseTo(ccw!.norms[1], 4);
    });

    it('isBoxGrounded rejects parts fallen far below the ground plane', () => {
      expect(isBoxGrounded({ min: [0, 0, 0], max: [20, 24, 20] }, 0)).toBe(true);
      expect(isBoxGrounded({ min: [0, -500, 0], max: [20, -476, 20] }, 0)).toBe(false);
    });

    it('getStudioOriginOffset normalizes backslashes and parts/ prefixes', () => {
      expect(getStudioOriginOffset('parts\\93091.dat')).not.toBeNull();
    });

    it('extractDatDependencies preserves spaces inside quoted !TEXMAP filenames', () => {
      const { textures } = extractDatDependencies(
        '0 !TEXMAP START PLANAR 0 0 0 10 0 0 0 10 0 "my  spaced  decal.png"',
      );
      expect(textures).toContain('my  spaced  decal.png');
    });
  });
});
