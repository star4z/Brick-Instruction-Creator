/**
 * Official LEGO-Style Brick Separator Ergonomic Guide Page (Live DOM SVG + PDF Canvas 2D).
 *
 * Inspired by Police Station (#10278 p. 4) and Iron Man Art (#31199 p. 14):
 * Four clean visual panels demonstrating:
 *   1. Lift Plates (lever upward from top studs)
 *   2. Pry Tiles (wedge beveled tail under smooth tile edge)
 *   3. Push Axles (use Technic cross-pin pusher through beam holes)
 *   4. Separate Underneath (lever downward from underside anti-studs)
 *
 * Works seamlessly in both standard and Wordless modes.
 */

export interface BrickSeparatorPanel {
  id: 'plates' | 'tiles' | 'axles' | 'underside';
  title: string;
  caption: string;
}

export const BRICK_SEPARATOR_PANELS: ReadonlyArray<BrickSeparatorPanel> = [
  { id: 'plates', title: 'Lift Plates', caption: 'Press onto studs & lever up' },
  { id: 'tiles', title: 'Pry Tiles', caption: 'Slide thin edge under tile' },
  { id: 'axles', title: 'Push Axles', caption: 'Press cross-pin through hole' },
  { id: 'underside', title: 'Separate Below', caption: 'Hook underside & lever down' },
];

export function buildBrickSeparatorPanelSvg(
  id: BrickSeparatorPanel['id'],
  sizePx = 120,
  opts?: { accent?: string; ink?: string },
): string {
  const s = Math.max(72, Math.round(sizePx));
  const sep = opts?.accent || '#f97316';
  const ink = opts?.ink || '#0f172a';
  const arrow = '#dc2626';

  if (id === 'plates') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 120 120" aria-label="Lift plates with brick separator">` +
      `<rect x="18" y="76" width="84" height="16" rx="2" fill="#94a3b8" stroke="${ink}" stroke-width="1.8"/>` +
      `<rect x="26" y="64" width="44" height="12" rx="2" fill="#cbd5e1" stroke="${ink}" stroke-width="1.8"/>` +
      `<path d="M30 62 L62 62 L98 40 L94 32 L58 50 L30 50 Z" fill="${sep}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M88 26 Q98 18 104 30" fill="none" stroke="${arrow}" stroke-width="3" stroke-linecap="round"/>` +
      `<polygon points="84,29 90,20 93,29" fill="${arrow}"/>` +
      `</svg>`;
  }
  if (id === 'tiles') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 120 120" aria-label="Pry tiles with brick separator">` +
      `<rect x="18" y="78" width="84" height="16" rx="2" fill="#94a3b8" stroke="${ink}" stroke-width="1.8"/>` +
      `<rect x="24" y="68" width="42" height="10" rx="1.5" fill="#e2e8f0" stroke="${ink}" stroke-width="1.8"/>` +
      `<path d="M62 76 L104 54 L108 62 L66 78 Z" fill="${sep}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<path d="M98 44 L76 56" fill="none" stroke="${arrow}" stroke-width="3" stroke-linecap="round"/>` +
      `<polygon points="71,59 78,50 82,58" fill="${arrow}"/>` +
      `</svg>`;
  }
  if (id === 'axles') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 120 120" aria-label="Push Technic axles with brick separator">` +
      `<rect x="20" y="64" width="80" height="22" rx="11" fill="#64748b" stroke="${ink}" stroke-width="1.8"/>` +
      `<circle cx="40" cy="75" r="5" fill="#1e293b"/><circle cx="60" cy="75" r="5" fill="#1e293b"/><circle cx="80" cy="75" r="5" fill="#1e293b"/>` +
      `<rect x="57" y="42" width="6" height="22" rx="1" fill="${sep}" stroke="${ink}" stroke-width="1.6"/>` +
      `<path d="M36 30 H84 L78 44 H42 Z" fill="${sep}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
      `<line x1="60" y1="14" x2="60" y2="25" stroke="${arrow}" stroke-width="3" stroke-linecap="round"/>` +
      `<polygon points="60,29 55,22 65,22" fill="${arrow}"/>` +
      `</svg>`;
  }
  // underside
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 120 120" aria-label="Separate plates from underside">` +
    `<rect x="18" y="34" width="84" height="16" rx="2" fill="#94a3b8" stroke="${ink}" stroke-width="1.8"/>` +
    `<rect x="26" y="50" width="44" height="12" rx="2" fill="#cbd5e1" stroke="${ink}" stroke-width="1.8"/>` +
    `<path d="M30 64 L62 64 L98 86 L94 94 L58 76 L30 76 Z" fill="${sep}" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>` +
    `<path d="M88 100 Q98 108 104 96" fill="none" stroke="${arrow}" stroke-width="3" stroke-linecap="round"/>` +
    `<polygon points="84,97 93,97 90,106" fill="${arrow}"/>` +
    `</svg>`;
}

export function drawBrickSeparatorPanelCanvas(
  ctx: CanvasRenderingContext2D,
  id: BrickSeparatorPanel['id'],
  cx: number,
  cy: number,
  size = 110,
  opts?: { accent?: string; ink?: string },
): void {
  const s = size / 120;
  const sep = opts?.accent || '#f97316';
  const ink = opts?.ink || '#0f172a';
  const arrow = '#dc2626';
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(s, s);
  ctx.lineWidth = 2;
  ctx.strokeStyle = ink;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (id === 'plates') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(18, 76, 84, 16);
    ctx.strokeRect(18, 76, 84, 16);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(26, 64, 44, 12);
    ctx.strokeRect(26, 64, 44, 12);
    ctx.fillStyle = sep;
    ctx.beginPath();
    ctx.moveTo(30, 62); ctx.lineTo(62, 62); ctx.lineTo(98, 40); ctx.lineTo(94, 32); ctx.lineTo(58, 50); ctx.lineTo(30, 50); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = arrow; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(100, 28); ctx.quadraticCurveTo(95, 18, 86, 25); ctx.stroke();
  } else if (id === 'tiles') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(18, 78, 84, 16); ctx.strokeRect(18, 78, 84, 16);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(24, 68, 42, 10); ctx.strokeRect(24, 68, 42, 10);
    ctx.fillStyle = sep;
    ctx.beginPath();
    ctx.moveTo(62, 76); ctx.lineTo(104, 54); ctx.lineTo(108, 62); ctx.lineTo(66, 78); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = arrow; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(98, 44); ctx.lineTo(74, 57); ctx.stroke();
  } else if (id === 'axles') {
    ctx.fillStyle = '#64748b';
    ctx.beginPath(); ctx.roundRect(20, 64, 80, 22, 11); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1e293b';
    for (const hx of [40, 60, 80]) { ctx.beginPath(); ctx.arc(hx, 75, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = sep;
    ctx.fillRect(57, 42, 6, 22); ctx.strokeRect(57, 42, 6, 22);
    ctx.beginPath(); ctx.moveTo(36, 30); ctx.lineTo(84, 30); ctx.lineTo(78, 44); ctx.lineTo(42, 44); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = arrow; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(60, 14); ctx.lineTo(60, 26); ctx.stroke();
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(18, 34, 84, 16); ctx.strokeRect(18, 34, 84, 16);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(26, 50, 44, 12); ctx.strokeRect(26, 50, 44, 12);
    ctx.fillStyle = sep;
    ctx.beginPath();
    ctx.moveTo(30, 64); ctx.lineTo(62, 64); ctx.lineTo(98, 86); ctx.lineTo(94, 94); ctx.lineTo(58, 76); ctx.lineTo(30, 76); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = arrow; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(100, 98); ctx.quadraticCurveTo(95, 108, 86, 100); ctx.stroke();
  }
  ctx.restore();
}
