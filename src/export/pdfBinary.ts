// Pure-JS PDF 1.4 multi-page generator with JPEG image pages and clickable URI link annotations.
// Zero external dependencies.

export interface PdfLinkRect {
  /** Left X in PDF points (origin = bottom-left) */
  llx: number;
  /** Bottom Y in PDF points (origin = bottom-left) */
  lly: number;
  /** Right X in PDF points (origin = bottom-left) */
  urx: number;
  /** Top Y in PDF points (origin = bottom-left) */
  ury: number;
  /** Target URL (e.g. https://star4z.github.io/Brick-Instruction-Creator/) */
  url: string;
}

export interface PdfJpegPage {
  bytes: Uint8Array;
  pxW: number;
  pxH: number;
  links?: PdfLinkRect[];
}

/**
 * Converts a rectangle in top-left canvas pixel coordinates into a PDF bottom-left point rectangle.
 */
export function canvasRectToPdfLink(
  rect: { x: number; y: number; w: number; h: number },
  canvasW: number,
  canvasH: number,
  pageWpt: number,
  pageHpt: number,
  url: string,
): PdfLinkRect {
  const safeW = Math.max(1, canvasW);
  const safeH = Math.max(1, canvasH);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const llx = clamp((rect.x / safeW) * pageWpt, 0, pageWpt);
  const urx = clamp(((rect.x + rect.w) / safeW) * pageWpt, 0, pageWpt);
  const ury = clamp(pageHpt - (rect.y / safeH) * pageHpt, 0, pageHpt);
  const lly = clamp(pageHpt - ((rect.y + rect.h) / safeH) * pageHpt, 0, pageHpt);
  return {
    llx: Math.round(llx * 100) / 100,
    lly: Math.round(lly * 100) / 100,
    urx: Math.round(urx * 100) / 100,
    ury: Math.round(ury * 100) / 100,
    url,
  };
}

function escapePdfLiteralString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]/g, '');
}

export function buildPdfBinary(
  jpegPages: PdfJpegPage[],
  pageWpt: number,
  pageHpt: number,
): Uint8Array {
  const enc = (s: string) => new TextEncoder().encode(s);
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const push = (u8: Uint8Array) => {
    chunks.push(u8);
    offset += u8.length;
  };
  const pushStr = (s: string) => push(enc(s));

  pushStr('%PDF-1.4\n');
  push(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
  const offsets: number[] = [0]; // 1-indexed object offsets

  // Pre-assign object numbers:
  // Obj 1: Catalog, Obj 2: Pages
  // For each page: pgObj, imgObj, cntObj, plus 1 annotObj per clickable link
  const pageLayouts: Array<{
    pgObj: number;
    imgObj: number;
    cntObj: number;
    annotObjs: Array<{ objNum: number; link: PdfLinkRect }>;
  }> = [];

  let nextObj = 3;
  for (let i = 0; i < jpegPages.length; i++) {
    const pgObj = nextObj++;
    const imgObj = nextObj++;
    const cntObj = nextObj++;
    const validLinks = (jpegPages[i].links ?? []).filter(
      (l) => l && typeof l.url === 'string' && l.url.length > 0 && l.urx > l.llx && l.ury > l.lly,
    );
    const annotObjs = validLinks.map((link) => ({ objNum: nextObj++, link }));
    pageLayouts.push({ pgObj, imgObj, cntObj, annotObjs });
  }

  // Obj 1: Catalog
  offsets.push(offset);
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets.push(offset);
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageLayouts.map((p) => `${p.pgObj} 0 R`).join(' ')}] /Count ${pageLayouts.length} >>\nendobj\n`,
  );

  for (let i = 0; i < jpegPages.length; i++) {
    const { pgObj, imgObj, cntObj, annotObjs } = pageLayouts[i];
    const { bytes, pxW, pxH } = jpegPages[i];

    const annotsEntry =
      annotObjs.length > 0
        ? ` /Annots [${annotObjs.map((a) => `${a.objNum} 0 R`).join(' ')}]`
        : '';

    // Page object
    offsets.push(offset);
    pushStr(
      `${pgObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWpt} ${pageHpt}] /Resources << /XObject << /Im0 ${imgObj} 0 R >> >> /Contents ${cntObj} 0 R${annotsEntry} >>\nendobj\n`,
    );

    // JPEG Image XObject
    offsets.push(offset);
    pushStr(
      `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,
    );
    push(bytes);
    pushStr('\nendstream\nendobj\n');

    // Content Stream
    const contentStr = `q ${pageWpt} 0 0 ${pageHpt} 0 0 cm /Im0 Do Q\n`;
    offsets.push(offset);
    pushStr(
      `${cntObj} 0 obj\n<< /Length ${contentStr.length} >>\nstream\n${contentStr}endstream\nendobj\n`,
    );

    // Clickable URI Link Annotations
    for (const { objNum, link } of annotObjs) {
      const escapedUri = escapePdfLiteralString(link.url);
      offsets.push(offset);
      pushStr(
        `${objNum} 0 obj\n<< /Type /Annot /Subtype /Link /Rect [${link.llx} ${link.lly} ${link.urx} ${link.ury}] /Border [0 0 0] /H /I /A << /Type /Action /S /URI /URI (${escapedUri}) >> >>\nendobj\n`,
      );
    }
  }

  const xrefPos = offset;
  pushStr(`xref\n0 ${offsets.length}\n0000000000 65535 f \n`);
  for (let i = 1; i < offsets.length; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`);

  const out = new Uint8Array(offset);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
