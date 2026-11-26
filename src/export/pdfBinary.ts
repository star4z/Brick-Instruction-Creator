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

export interface PdfBookmark {
  title: string;
  /** 0-based page index */
  pageIndex: number;
}

export interface PdfBuildOptions {
  title?: string;
  author?: string;
  creator?: string;
  bookmarks?: PdfBookmark[];
}

const SAFE_PDF_URI_RE = /^https?:\/\//i;

function isSafePdfUri(url: string): boolean {
  const trimmed = url.trim();
  return trimmed.length > 0 && SAFE_PDF_URI_RE.test(trimmed);
}

function escapePdfLiteralString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n]/g, '')
    // Restrict to safe printable ASCII for standard Type1 WinAnsiEncoding
    .replace(/[^\x20-\x7e]/g, ' ');
}

function encodePdfTextString(str: string): string {
  // Use UTF-16BE hex string with BOM when non-ASCII characters are present (PDF 1.4 spec 3.8.1)
  if (/[^\x20-\x7e]/.test(str)) {
    let hex = 'FEFF';
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      hex += code.toString(16).toUpperCase().padStart(4, '0');
    }
    return `<${hex}>`;
  }
  return `(${escapePdfLiteralString(str)})`;
}

/**
 * Builds PDF 1.4 binary chunks without allocating an extra contiguous Uint8Array copy.
 * Callers creating a Blob can pass the returned array directly to `new Blob(chunks, { type: 'application/pdf' })`.
 */
export function buildPdfBinaryChunks(
  jpegPages: PdfJpegPage[],
  pageWpt: number,
  pageHpt: number,
  options?: PdfBuildOptions,
): Uint8Array[] {
  const safePageW = Number.isFinite(pageWpt) && pageWpt > 0 ? pageWpt : 612;
  const safePageH = Number.isFinite(pageHpt) && pageHpt > 0 ? pageHpt : 792;
  const encoder = new TextEncoder();
  const enc = (s: string) => encoder.encode(s);
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
  const pageBookmarks = jpegPages
    .map((p, idx) => ({ title: String(p.bookmarkTitle || '').trim(), pageIndex: idx }))
    .filter((b) => b.title.length > 0);
  const rawBookmarks = (options?.bookmarks && options.bookmarks.length > 0) ? options.bookmarks : pageBookmarks;
  const validBookmarks = rawBookmarks.filter(
    (b) => b && typeof b.title === 'string' && b.title.trim().length > 0 && Number.isInteger(b.pageIndex) && b.pageIndex >= 0 && b.pageIndex < jpegPages.length,
  );
  const hasOutlines = validBookmarks.length > 0;
  const hasInfo = Boolean(options?.title || options?.author || options?.creator);

  // Pre-assign object numbers:
  // Obj 1: Catalog, Obj 2: Pages, optional Font, optional Info, optional Outlines + Outline items, then per-page objects
  let nextObj = 3;
  const fontObj = hasAnySearchText ? nextObj++ : 0;
  const infoObj = hasInfo ? nextObj++ : 0;
  const outlinesObj = hasOutlines ? nextObj++ : 0;
  const outlineItemObjs = validBookmarks.map((bm) => ({ objNum: nextObj++, bm }));

  const pageLayouts: Array<{
    pgObj: number;
    imgObj: number;
    cntObj: number;
    annotObjs: Array<{ objNum: number; link: PdfLinkRect }>;
  }> = [];

  for (let i = 0; i < jpegPages.length; i++) {
    const pgObj = nextObj++;
    const imgObj = nextObj++;
    const cntObj = nextObj++;
    const validLinks = (jpegPages[i].links ?? []).filter(
      (l) => l && typeof l.url === 'string' && isSafePdfUri(l.url) && l.urx > l.llx && l.ury > l.lly,
    );
    const annotObjs = validLinks.map((link) => ({ objNum: nextObj++, link }));
    pageLayouts.push({ pgObj, imgObj, cntObj, annotObjs });
  }

  // Obj 1: Catalog
  offsets.push(offset);
  const outlinesCatalogEntry = hasOutlines ? ` /Outlines ${outlinesObj} 0 R /PageMode /UseOutlines` : '';
  pushStr(`1 0 obj\n<< /Type /Catalog /Pages 2 0 R${outlinesCatalogEntry} >>\nendobj\n`);

  // Obj 2: Pages
  offsets.push(offset);
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageLayouts.map((p) => `${p.pgObj} 0 R`).join(' ')}] /Count ${pageLayouts.length} >>\nendobj\n`,
  );

  // Optional Font
  if (hasAnySearchText) {
    offsets.push(offset);
    pushStr(
      `${fontObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    );
  }

  // Optional Info dictionary
  if (hasInfo) {
    offsets.push(offset);
    const parts: string[] = [];
    if (options?.title) parts.push(`/Title ${encodePdfTextString(options.title)}`);
    if (options?.author) parts.push(`/Author ${encodePdfTextString(options.author)}`);
    if (options?.creator) parts.push(`/Creator ${encodePdfTextString(options.creator)}`);
    pushStr(`${infoObj} 0 obj\n<< ${parts.join(' ')} /Producer (Brick Instruction Works) >>\nendobj\n`);
  }

  // Optional Outlines (chapter bookmarks)
  if (hasOutlines) {
    offsets.push(offset);
    const firstObj = outlineItemObjs[0].objNum;
    const lastObj = outlineItemObjs[outlineItemObjs.length - 1].objNum;
    pushStr(
      `${outlinesObj} 0 obj\n<< /Type /Outlines /First ${firstObj} 0 R /Last ${lastObj} 0 R /Count ${outlineItemObjs.length} >>\nendobj\n`,
    );
    for (let bi = 0; bi < outlineItemObjs.length; bi++) {
      const item = outlineItemObjs[bi];
      const prevEntry = bi > 0 ? ` /Prev ${outlineItemObjs[bi - 1].objNum} 0 R` : '';
      const nextEntry = bi < outlineItemObjs.length - 1 ? ` /Next ${outlineItemObjs[bi + 1].objNum} 0 R` : '';
      const targetPgObj = pageLayouts[item.bm.pageIndex].pgObj;
      offsets.push(offset);
      pushStr(
        `${item.objNum} 0 obj\n<< /Title ${encodePdfTextString(item.bm.title.trim())} /Parent ${outlinesObj} 0 R${prevEntry}${nextEntry} /Dest [${targetPgObj} 0 R /Fit] >>\nendobj\n`,
      );
    }
  }

  for (let i = 0; i < jpegPages.length; i++) {
    const { pgObj, imgObj, cntObj, annotObjs } = pageLayouts[i];
    const { bytes, pxW, pxH, searchableText } = jpegPages[i];
    const safePxW = Math.max(1, Math.round(Number.isFinite(pxW) ? pxW : 1));
    const safePxH = Math.max(1, Math.round(Number.isFinite(pxH) ? pxH : 1));
    const isJpeg = bytes instanceof Uint8Array && bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xd8;

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
      `${pgObj} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${safePageW} ${safePageH}] /TrimBox [0 0 ${safePageW} ${safePageH}] /Resources << /XObject << /Im0 ${imgObj} 0 R >>${fontResEntry} >> /Contents ${cntObj} 0 R${annotsEntry} >>\nendobj\n`,
    );

    // JPEG Image XObject
    offsets.push(offset);
    const imgBytes = isJpeg ? bytes : new Uint8Array(0);
    pushStr(
      `${imgObj} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${safePxW} /Height ${safePxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`,
    );
    push(imgBytes);
    pushStr('\nendstream\nendobj\n');

    // Content Stream (image + optional invisible Ctrl+F searchable text metadata via `3 Tr`)
    let contentStr = isJpeg ? `q ${safePageW} 0 0 ${safePageH} 0 0 cm /Im0 Do Q\n` : '';
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
      const escapedUri = escapePdfLiteralString(link.url.trim());
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
  const infoTrailerEntry = hasInfo ? ` /Info ${infoObj} 0 R` : '';
  pushStr(`trailer\n<< /Size ${offsets.length} /Root 1 0 R${infoTrailerEntry} >>\nstartxref\n${xrefPos}\n%%EOF`);

  return chunks;
}

export function buildPdfBinary(
  jpegPages: PdfJpegPage[],
  pageWpt: number,
  pageHpt: number,
  options?: PdfBuildOptions,
): Uint8Array {
  const chunks = buildPdfBinaryChunks(jpegPages, pageWpt, pageHpt, options);
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}
