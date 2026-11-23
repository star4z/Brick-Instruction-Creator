// Embedded Texture Registry & Pre-Decoder for BrickLink Studio (PE_TEX_INFO)
// and LDraw (!TEXMAP / !DATA) printed part decals (minifigure faces, torsos, tiles, slopes).

export interface TextureRecord {
  texKey: string;
  base64Png: string;
  mimeType: string;
  source: 'embedded' | 'library';
  image: TexImageSource | null;
  failed: boolean;
  decoding: Promise<void> | null;
}

/**
 * Fast deterministic 64-bit FNV-1a fingerprint (two independent 32-bit hashes + length)
 * for deduplicating embedded base64 PNG textures across repeated parts & minifigures.
 */
export function hashTextureBase64(b64: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const len = b64.length;
  // Sample every byte up to 4KB, then stride for huge textures while always including head & tail
  const step = len > 8192 ? Math.max(1, Math.floor(len / 4096)) : 1;
  for (let i = 0; i < len; i += step) {
    const ch = b64.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= ch + (i & 0xff);
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  // Always mix the final 64 chars so identical PNG headers with different pixels never collide
  const tailStart = Math.max(0, len - 64);
  for (let i = tailStart; i < len; i++) {
    const ch = b64.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= ch ^ 0xa5;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  return `tex_${h1.toString(36)}_${h2.toString(36)}_${len.toString(36)}`;
}

export function normalizeTextureName(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^ldraw\//, '')
    .replace(/^parts\//, '')
    .replace(/^textures\//, '');
}

function detectMimeFromBase64(b64: string): string {
  if (b64.startsWith('/9j/')) return 'image/jpeg';
  if (b64.startsWith('UklGR')) return 'image/webp';
  return 'image/png';
}

/**
 * Extracts raw base64 payload from a `0 PE_TEX_INFO ...` line if present.
 * Handles both:
 * - `0 PE_TEX_INFO <base64>` (explicit UV mode)
 * - `0 PE_TEX_INFO <16 projection floats> <base64>` (planar box projection mode)
 */
export function extractBase64FromPeTexInfoLine(line: string): string | null {
  const m = line.match(/^0\s+PE_TEX_INFO\s+(.+)$/i);
  if (!m) return null;
  const toks = m[1].trim().split(/\s+/);
  if (toks.length === 0) return null;
  const last = toks[toks.length - 1];
  if (last.length < 24 || !/^[A-Za-z0-9+/=]+$/.test(last)) return null;
  return last;
}

/**
 * Extracts referenced image filenames (e.g. `3626cpx0a.png`) from LDraw
 * `0 !TEXMAP START|NEXT PLANAR|CYLINDRICAL|SPHERICAL ... <file.png>` directives.
 */
export function extractTexmapTextureNamesFromLines(lines: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.length < 18 || l[0] !== '0' || !/!TEXMAP/i.test(l)) continue;
    const m = l.match(/^0\s+!TEXMAP\s+(?:START|NEXT)\s+(PLANAR|CYLINDRICAL|SPHERICAL)\s+(.+)$/i);
    if (!m) continue;
    const method = m[1].toUpperCase();
    const paramCount = method === 'PLANAR' ? 9 : method === 'CYLINDRICAL' ? 10 : 11;
    const rest = m[2].trim().split(/\s+/);
    if (rest.length <= paramCount) continue;
    let rawTex = rest[paramCount];
    if (rawTex.startsWith('"')) {
      const qm = rest.slice(paramCount).join(' ').match(/^"([^"]+)"/);
      if (qm) rawTex = qm[1];
    }
    const norm = normalizeTextureName(rawTex);
    if (norm && /\.(png|jpg|jpeg|webp)$/i.test(norm) && !seen.has(norm)) {
      seen.add(norm);
      out.push(norm);
    }
  }
  return out;
}

class EmbeddedTextureStore {
  private byKey = new Map<string, TextureRecord>();
  private byName = new Map<string, string>();

  registerBase64Texture(
    rawBase64: string,
    opts?: { name?: string; source?: 'embedded' | 'library' },
  ): string | null {
    const clean = String(rawBase64 || '').replace(/\s+/g, '');
    if (clean.length < 16) return null;
    const texKey = hashTextureBase64(clean);
    const source = opts?.source ?? 'embedded';
    if (!this.byKey.has(texKey)) {
      this.byKey.set(texKey, {
        texKey,
        base64Png: clean,
        mimeType: detectMimeFromBase64(clean),
        source,
        image: null,
        failed: false,
        decoding: null,
      });
    }
    if (opts?.name) {
      const norm = normalizeTextureName(opts.name);
      if (norm) {
        this.byName.set(norm, texKey);
        const base = norm.split('/').pop();
        if (base && base !== norm) this.byName.set(base, texKey);
      }
    }
    return texKey;
  }

  lookupByName(rawName: string): { texKey: string; base64Png: string } | null {
    const norm = normalizeTextureName(rawName);
    if (!norm) return null;
    const base = norm.split('/').pop() || norm;
    const texKey = this.byName.get(norm) || this.byName.get(base);
    if (!texKey) return null;
    const rec = this.byKey.get(texKey);
    if (!rec) return null;
    return { texKey: rec.texKey, base64Png: rec.base64Png };
  }

  getRecord(texKey: string): TextureRecord | undefined {
    return this.byKey.get(texKey);
  }

  getDecodedImage(texKey: string): TexImageSource | null {
    return this.byKey.get(texKey)?.image ?? null;
  }

  scanDatLinesForTextures(lines: string[], source: 'embedded' | 'library' = 'embedded'): string[] {
    const keys: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (l.length < 30 || l[0] !== '0') continue;
      if (!l.includes('PE_TEX_INFO') && !l.includes('pe_tex_info')) continue;
      const b64 = extractBase64FromPeTexInfoLine(l);
      if (b64) {
        const key = this.registerBase64Texture(b64, { source });
        if (key) keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Decodes a single texture asynchronously into an HTMLImageElement so WebGL can upload it synchronously.
   */
  decodeTexture(texKey: string, onReady?: () => void): Promise<void> {
    const rec = this.byKey.get(texKey);
    if (!rec || rec.image || rec.failed) return Promise.resolve();
    if (rec.decoding) {
      return onReady ? rec.decoding.then(() => { if (rec.image) onReady(); }) : rec.decoding;
    }
    if (typeof Image === 'undefined') return Promise.resolve();

    const p = new Promise<void>((resolve) => {
      const img = new Image();
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (ok && img.naturalWidth > 0 && img.naturalHeight > 0) {
          rec.image = img;
          if (onReady) onReady();
        } else {
          rec.failed = true;
        }
        rec.decoding = null;
        resolve();
      };
      const timer = setTimeout(() => finish(false), 6000);
      img.onload = () => finish(true);
      img.onerror = () => finish(false);
      img.src = `data:${rec.mimeType};base64,${rec.base64Png}`;
    });

    rec.decoding = p;
    return p;
  }

  /**
   * Pre-decodes all registered undecoded textures in parallel (bounded by a soft timeout).
   * Calling this during async .io/.ldr import ensures every minifigure face & torso print
   * is ready synchronously on the very first WebGL render and PDF/HTML export!
   */
  async predecodeAllPending(timeoutMs = 8000): Promise<number> {
    if (typeof Image === 'undefined') return 0;
    const pending: Promise<void>[] = [];
    for (const rec of this.byKey.values()) {
      if (!rec.image && !rec.failed) {
        pending.push(this.decodeTexture(rec.texKey));
      }
    }
    if (pending.length === 0) return 0;
    await Promise.race([
      Promise.all(pending),
      new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
    ]);
    let readyCount = 0;
    for (const rec of this.byKey.values()) {
      if (rec.image) readyCount++;
    }
    return readyCount;
  }

  clearEmbedded(): void {
    for (const [k, rec] of this.byKey.entries()) {
      if (rec.source === 'embedded') this.byKey.delete(k);
    }
    for (const [name, k] of this.byName.entries()) {
      if (!this.byKey.has(k)) this.byName.delete(name);
    }
  }

  clearAll(): void {
    this.byKey.clear();
    this.byName.clear();
  }

  get size(): number {
    return this.byKey.size;
  }
}

export const textureStore = new EmbeddedTextureStore();
