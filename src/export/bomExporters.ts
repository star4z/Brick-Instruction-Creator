/**
 * BOM External Parts-Order Exporters:
 *   - BrickLink Wanted List XML (`<INVENTORY>...</INVENTORY>`)
 *   - Rebrickable CSV (`Part,Color,Quantity`)
 *
 * Pure, dependency-free formatters matching official BrickLink & Rebrickable import specs.
 */

export interface BomExportItem {
  partId: string;
  colorId: number;
  qty: number;
  name?: string;
}

function escapeXml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeDesignId(partId: string): string {
  return String(partId || '')
    .replace(/\.dat$/i, '')
    .replace(/^parts[\\/]/i, '')
    .trim();
}

/**
 * Generates a BrickLink Wanted List XML string ready for direct upload at
 * bricklink.com/v2/wanted/upload.page.
 */
export function buildBrickLinkWantedXml(items: ReadonlyArray<BomExportItem>): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>', '<INVENTORY>'];
  for (const item of items) {
    const id = normalizeDesignId(item.partId);
    const qty = Math.max(1, Math.round(item.qty || 1));
    if (!id) continue;
    lines.push('  <ITEM>');
    lines.push('    <ITEMTYPE>P</ITEMTYPE>');
    lines.push(`    <ITEMID>${escapeXml(id)}</ITEMID>`);
    if (Number.isFinite(item.colorId) && item.colorId >= 0) {
      lines.push(`    <COLOR>${Math.round(item.colorId)}</COLOR>`);
    }
    lines.push(`    <MINQTY>${qty}</MINQTY>`);
    lines.push('  </ITEM>');
  }
  lines.push('</INVENTORY>');
  return lines.join('\n') + '\n';
}

/**
 * Generates a Rebrickable-compatible CSV parts list (`Part,Color,Quantity`).
 */
export function buildRebrickableCsv(items: ReadonlyArray<BomExportItem>): string {
  const rows: string[] = ['Part,Color,Quantity'];
  for (const item of items) {
    const id = normalizeDesignId(item.partId);
    const qty = Math.max(1, Math.round(item.qty || 1));
    if (!id) continue;
    const color = Number.isFinite(item.colorId) ? Math.round(item.colorId) : 0;
    const safeId = /[",\n]/.test(id) ? `"${id.replace(/"/g, '""')}"` : id;
    rows.push(`${safeId},${color},${qty}`);
  }
  return rows.join('\n') + '\n';
}
