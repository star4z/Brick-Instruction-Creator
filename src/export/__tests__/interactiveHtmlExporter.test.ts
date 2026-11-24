import { describe, expect, it } from 'vitest';
import {
  buildInteractiveHtmlFilename,
  DEFAULT_EDITOR_URL,
  encodeTypedArrayBase64,
  generateInteractiveHtmlDocument,
  serializeJsonForScriptTag,
  type InteractiveHtmlPayload,
} from '../interactiveHtmlExporter';

describe('interactiveHtmlExporter', () => {
  it('encodes Float32Array and Uint8Array to base64 losslessly', () => {
    const f = new Float32Array([1.5, -2.25, 0, 42]);
    const b64 = encodeTypedArrayBase64(f);
    expect(b64.length).toBeGreaterThan(0);
    const decoded = Buffer.from(b64, 'base64');
    const back = new Float32Array(decoded.buffer, decoded.byteOffset, decoded.byteLength / 4);
    expect(Array.from(back)).toEqual([1.5, -2.25, 0, 42]);

    const u = new Uint8Array([255, 0, 128, 255]);
    const uBack = Buffer.from(encodeTypedArrayBase64(u), 'base64');
    expect(Array.from(uBack)).toEqual([255, 0, 128, 255]);
  });

  it('prevents </script> injection in embedded JSON payload', () => {
    const raw = serializeJsonForScriptTag({ title: '</script><script>alert(1)</script>' });
    expect(raw).not.toContain('</script>');
    expect(raw).toContain('\\u003c/script\\u003e');
  });

  it('generates slugified filenames for interactive HTML exports', () => {
    expect(buildInteractiveHtmlFilename('SF Muni LRV4 Train!')).toBe('sf-muni-lrv4-train-interactive-3d.html');
    expect(buildInteractiveHtmlFilename('')).toBe('manual-interactive-3d.html');
  });

  it('generates a complete self-contained HTML document with WebGL viewer, all pages, and editor link', () => {
    const payload: InteractiveHtmlPayload = {
      version: 1,
      title: 'Space Rover',
      subtitle: 'Custom MOC',
      author: 'Builder',
      editorUrl: DEFAULT_EDITOR_URL,
      totalPieces: 2,
      totalSteps: 1,
      theme: {
        bg: '#d8ecfd',
        bgEnd: '#b7daf9',
        bgType: 'gradient',
        bgAngle: 180,
        text: '#172536',
        muted: '#4a607a',
        accent: '#1a73e8',
        pliBg: '#ffffff',
        pliBorder: '#8ab8e6',
        calloutBg: '#fffbe6',
        calloutBorder: '#eab308',
        isDark: false,
      },
      highlightNew: true,
      highlightColor: '#ff2d55',
      fadePrev: true,
      fadeOpacity: 0.65,
      prototypes: [
        {
          tp: encodeTypedArrayBase64(new Float32Array([0, 0, 0, 10, 0, 0, 0, 10, 0])),
          tn: encodeTypedArrayBase64(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1])),
          tc: encodeTypedArrayBase64(new Uint8Array([200, 30, 30, 255, 200, 30, 30, 255, 200, 30, 30, 255])),
          oc: 3,
          xc: 0,
          lp: '',
          lc: '',
          b: [0, 0, 0, 10, 10, 1],
        },
      ],
      textures: {},
      parts: [{ k: 0, x: 0, y: 0, z: 0 }],
      pages: [
        {
          id: 'cover',
          kind: 'cover',
          num: 1,
          label: 'Cover',
          title: 'Space Rover',
          previewUrl: 'data:image/jpeg;base64,COVERPREVIEW',
          scene: { prevPartIdx: [], newPartIdx: [0], az: 38, el: 28, zoom: 1.0, hero: true },
        },
        {
          id: 'pg_s1',
          kind: 'steps',
          num: 2,
          label: 'Step 1',
          steps: [
            {
              stepId: 's1',
              stepNum: 1,
              label: 'Step 1',
              previewUrl: 'data:image/jpeg;base64,STEP1PREVIEW',
              prevPartIdx: [],
              newPartIdx: [0],
              az: 38,
              el: 28,
              zoom: 1.0,
              pli: [{ partId: '3001', name: 'Brick 2 x 4', qty: 1, thumb: '' }],
            },
          ],
        },
        {
          id: 'complete',
          kind: 'complete',
          num: 3,
          label: 'Build Complete',
          title: 'Build Complete!',
          scene: { prevPartIdx: [], newPartIdx: [0], az: 38, el: 28, zoom: 1.0, hero: true },
        },
      ],
    };

    const html = generateInteractiveHtmlDocument(payload);
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Space Rover — Interactive 3D Instructions');
    expect(html).toContain(DEFAULT_EDITOR_URL);
    expect(html).toContain('Brick Instruction Creator ↗');
    expect(html).not.toContain('Brick Studio');
    expect(html).toContain('id="noJsFallback"');
    expect(html).toContain('data:image/jpeg;base64,COVERPREVIEW');
    expect(html).toContain('data:image/jpeg;base64,STEP1PREVIEW');
    expect(html).toContain('canvas id="glStage"');
    expect(html).toContain('Start Building');
    expect(html).toContain('"kind":"cover"');
    expect(html).toContain('"kind":"complete"');
    expect(html).toContain('id="btnDrawerJumpTop"');
    expect(html).toContain('id="btnDrawerJumpBottom"');
    // Zero external script tags (100% offline self-contained)
    expect(html).not.toMatch(/<script[^>]+src=/i);

    // Inline script must parse with zero syntax errors and omit duplicated previewUrl blobs
    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).toBeTruthy();
    expect(() => new Function(scriptMatch![1])).not.toThrow();
    expect(scriptMatch![1]).not.toContain('STEP1PREVIEW');
  });
});

describe('interactiveHtmlExporter font stacks', () => {
  it('strips characters that could break out of the inline style block', async () => {
    const { sanitizeFontStack } = await import('../interactiveHtmlExporter');
    expect(sanitizeFontStack('"Public Sans", sans-serif')).toBe('"Public Sans", sans-serif');
    expect(sanitizeFontStack('x; } </style><script>alert(1)</script>')).not.toMatch(/[;{}<>()/]/);
    expect(sanitizeFontStack(undefined)).toContain('sans-serif');
  });
});
