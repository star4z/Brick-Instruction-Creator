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
  /** Optional searchable tokens (e.g. LDraw part IDs and step numbers) embedded as invisible PDF text for Ctrl+F lookup. */
  searchableText?: string[];
  /** Optional PDF sidebar bookmark title (e.g. "Cover", "Bag 1", "Parts List") for native /Outlines navigation. */
  bookmarkTitle?: string;
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
    .replace(/[\r\n]/g, '')
    // Restrict invisible search tokens to safe printable ASCII for standard Type1 WinAnsiEncoding
    .replace(/[^\x20-\x7e]/g, ' ');
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

  const hasAnySearchText = jpegPages.some((p) => Array.isArray(p.searchableText) && p.searchableText.length > 0);
  const fontObj = hasAnySearchText ? 3 : 0;

  // Pre-assign object numbers:
  // Obj 1: Catalog, Obj 2: Pages, (Optional Obj 3: Standard Helvetica Type1 Font for invisible search metadata)
  // For each page: pgObj, imgObj, cntObj, plus 1 annotObj per clickable link
  const pageLayouts: Array<{
    pgObj: number;
    imgObj: number;
    cntObj: number;
    annotObjs: Array<{ objNum: number; link: PdfLinkRect }>;
  }> = [];

  let nextObj = hasAnySearchText ? 4 : 3;
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

  // Optional PDF /Outlines bookmark tree for sidebar navigation
  const bookmarks: Array<{ title: string; pgObj: number; objNum: number }> = [];
  let outlinesRootObj = 0;
  const rawBookmarks = jpegPages
    .map((p, idx) => ({ title: String(p.bookmarkTitle || '').trim(), pgObj: pageLayouts[idx].pgObj }))
    .filter((b) => b.title.length > 0);
  if (rawBookmarks.length > 0) {
    outlinesRootObj = nextObj++;
    for (const b of rawBookmarks) {
      bookmarks.push({ title: b.title, pgObj: b.pgObj, objNum: nextObj++ });
    }
  }

  // Obj 1: Catalog
  offsets.push(offset);
  const outlinesCatalogEntry = outlinesRootObj > 0 ? ` /Outlines ${outlinesRootObj} 0 R` : '';
  pushStr(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R${outlinesCatalogEntry} >>\nendobj\n`);

  // Obj 2: Pages
  offsets.push(offset);
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageLayouts.map((p) => `${p.pgObj} 0 R`).join(' ')}] /Count ${pageLayouts.length} >>\nendobj\n`,
  );

  // Optional Obj 3: Standard Helvetica Type1 Font (zero font-embedding bloat)
  if (hasAnySearchText) {
    offsets.push(offset);
    pushStr(
      `${fontObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    );
  }

  for (let i = 0; i < jpegPages.length; i++) {
    const { pgObj, imgObj, cntObj, annotObjs } = pageLayouts[i];
    const { bytes, pxW, pxH, searchableText } = jpegPages[i];

    const annotsEntry =
      annotObjs.length > 0
        ? ` /Annots [${annotObjs.map((a) => `${a.objNum} 0 R`).join(' ')}]`
        : '';
    const pageSearchTokens = Array.isArray(searchableText)
      ? searchableText.map((s) => String(s || '').trim()).filter(Boolean)
      : [];
    const fontResEntry = pageSearchTokens.length > 0 ? ` /Font << /F1 ${fontObj} 0 R >>` : '';

    // Page object
    offsets.push(offset);
    pushStr(
      `${pgObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWpt} ${pageHpt}] /Resources << /XObject << /Im0 ${imgObj} 0 R >>${fontResEntry} >> /Contents ${cntObj} 0 R${annotsEntry} >>\nendobj\n`,
    );

    // JPEG Image XObject
    offsets.push(offset);
    pushStr(
      `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`,
    );
    push(bytes);
    pushStr('\nendstream\nendobj\n');

    // Content Stream (image + optional invisible Ctrl+F searchable text metadata via `3 Tr`)
    let contentStr = `q ${pageWpt} 0 0 ${pageHpt} 0 0 cm /Im0 Do Q\n`;
    if (pageSearchTokens.length > 0) {
      const joined = escapePdfLiteralString(pageSearchTokens.join(' '));
      contentStr += `BT /F1 1 Tf 3 Tr 4 4 Td (${joined}) Tj ET\n`;
    }
    const contentBytes = enc(contentStr);
    offsets.push(offset);
    pushStr(
      `${cntObj} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`,
    );
    push(contentBytes);
    pushStr('endstream\nendobj\n');

    // Clickable URI Link Annotations
    for (const { objNum, link } of annotObjs) {
      const escapedUri = escapePdfLiteralString(link.url);
      offsets.push(offset);
      pushStr(
        `${objNum} 0 obj\n<< /Type /Annot /Subtype /Link /Rect [${link.llx} ${link.lly} ${link.urx} ${link.ury}] /Border [0 0 0] /H /I /A << /Type /Action /S /URI /URI (${escapedUri}) >> >>\nendobj\n`,
      );
    }
  }

  // Emit optional /Outlines root & items
  if (outlinesRootObj > 0 && bookmarks.length > 0) {
    offsets.push(offset);
    pushStr(
      `${outlinesRootObj} 0 obj\n<< /Type /Outlines /First ${bookmarks[0].objNum} 0 R /Last ${bookmarks[bookmarks.length - 1].objNum} 0 R /Count ${bookmarks.length} >>\nendobj\n`,
    );
    for (let bi = 0; bi < bookmarks.length; bi++) {
      const b = bookmarks[bi];
      const prevEntry = bi > 0 ? ` /Prev ${bookmarks[bi - 1].objNum} 0 R` : '';
      const nextEntry = bi < bookmarks.length - 1 ? ` /Next ${bookmarks[bi + 1].objNum} 0 R` : '';
      offsets.push(offset);
      pushStr(
        `${b.objNum} 0 obj\n<< /Title (${escapePdfLiteralString(b.title)}) /Parent ${outlinesRootObj} 0 R${prevEntry}${nextEntry} /Dest [${b.pgObj} 0 R /Fit] >>\nendobj\n`,
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
