import type { Mat3 } from './minifigPose';
import { R_IDENTITY, mat3Multiply, mat3Vec } from './minifigPose';

export interface DatEntrySource {
  key: string;
  lines: string[];
  offset?: [number, number, number] | null;
  virtual?: boolean;
}

export interface CompiledDatMesh {
  tris: Float32Array;
  norms: Float32Array;
  edges: Float32Array;
  triCols: Int16Array | null;
  min: [number, number, number];
  max: [number, number, number];
}

export interface CompileDatOptions {
  /** Maximum triangle float entries (9 floats per triangle). Default: 450,000 (50,000 triangles). */
  maxTriFloats?: number;
  /** Maximum edge float entries (6 floats per edge). Default: 48,000 (8,000 edges). */
  maxEdgeFloats?: number;
  /** Maximum subfile recursion depth. Default: 16. */
  maxDepth?: number;
  /** Triangle floats reserved per remaining sibling subfile so dense prints never starve later parts (e.g. arms/hands/toruses). */
  subTriReserve?: number;
  /** Edge floats reserved per remaining sibling subfile. */
  subEdgeReserve?: number;
}

export const DEFAULT_MAX_TRI_FLOATS = 450000; // 50,000 triangles (9 floats each)
export const DEFAULT_MAX_EDGE_FLOATS = 48000; // 8,000 edges (6 floats each)
export const DEFAULT_MAX_DEPTH = 16;
export const DEFAULT_SUB_TRI_RESERVE = 18000; // 2,000 triangles reserved per heavy sibling
export const DEFAULT_SUB_EDGE_RESERVE = 3000; // 500 edges reserved per sibling

export function normalizeDatRef(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\\/g, '/')
    .toLowerCase()
    .replace(/^ldraw\//, '')
    .replace(/^parts\//, '')
    .replace(/^p\//, '')
    .replace(/\.dat$/i, '');
}

const SKIPPED_UNDERSIDE_RE = /^(stud3|stud4|stud4a|stud10|stud15|axlehol[2-9]|axleho10|npeghol|beamhol)/;
const SYNTH_ARC_RE = /^(\d+)-(\d+)(cyli|cylo|cylc|disc|edge|ring\d+|rin\d+|chrd|ndis)$/;
const FALLBACK_TORUS_RE = /^t(\d+)([oiq])(\d{4})$/;
const FALLBACK_CONE_RE = /^(\d+)-(\d+)con(\d+)$/;
const FALLBACK_CYL_VAR_RE = /^(\d+)-(\d+)(?:cyli2|cylh|ccyli)$/;

function isFastStudBase(base: string): boolean {
  return base === 'stud' || base === 'stud2' || base === 'stud2a' || base === 'studp01';
}

function canSynthesizePrim(base: string): boolean {
  if (base === 'rect' || base === 'rect2p') return true;
  const m = base.match(SYNTH_ARC_RE);
  if (!m) return false;
  const num = +m[1];
  const den = +m[2];
  return den > 0 && num > 0 && num <= den;
}

function isLightweightPrimitiveBase(base: string): boolean {
  return (
    FALLBACK_TORUS_RE.test(base) ||
    FALLBACK_CONE_RE.test(base) ||
    FALLBACK_CYL_VAR_RE.test(base) ||
    base === 'box' ||
    base === 'box5' ||
    base === 'box4'
  );
}

function isLineKind(raw: string, kind: string): boolean {
  return raw[0] === kind && (raw[1] === ' ' || raw[1] === '\t');
}

/**
 * Expands raw LDraw lines while properly handling `0 !TEXMAP START / FALLBACK / END` blocks:
 * - When a `!TEXMAP` block includes `0 !TEXMAP FALLBACK`, keep the fallback polygon geometry
 *   (which preserves multi-color printed face patterns without UV textures) and ignore `0 !: ` lines.
 * - When a `!TEXMAP` block has NO `0 !TEXMAP FALLBACK` section, unwrap the `0 !: ` lines so
 *   textured-only surfaces still render instead of turning into missing chunks.
 */
function preprocessTexmapLines(lines: string[]): string[] {
  let hasTexmap = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.length >= 10 && l[0] === '0' && /!TEXMAP/i.test(l)) {
      hasTexmap = true;
      break;
    }
  }
  if (!hasTexmap) return lines;

  const out: string[] = [];
  let inTexmap = false;
  let inFallback = false;
  let texmapGeomLines: string[] = [];
  let fallbackLines: string[] = [];

  const flushTexmap = () => {
    if (inFallback && fallbackLines.length > 0) {
      for (const fl of fallbackLines) out.push(fl);
    } else if (texmapGeomLines.length > 0) {
      for (const tl of texmapGeomLines) out.push(tl);
    }
    inTexmap = false;
    inFallback = false;
    texmapGeomLines = [];
    fallbackLines = [];
  };

  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (/^0\s+!TEXMAP\s+(?:START|NEXT)\b/i.test(l)) {
      if (inTexmap) flushTexmap();
      inTexmap = true;
      inFallback = false;
      texmapGeomLines = [];
      fallbackLines = [];
      continue;
    }
    if (inTexmap && /^0\s+!TEXMAP\s+FALLBACK\b/i.test(l)) {
      inFallback = true;
      continue;
    }
    if (inTexmap && /^0\s+!TEXMAP\s+END\b/i.test(l)) {
      flushTexmap();
      continue;
    }

    if (inTexmap) {
      if (inFallback) {
        fallbackLines.push(l);
      } else {
        const mGeom = l.match(/^0\s+!:\s*(.+)$/);
        if (mGeom) texmapGeomLines.push(mGeom[1].trim());
        else if (l[0] !== '0') texmapGeomLines.push(l);
      }
    } else {
      out.push(l);
    }
  }

  if (inTexmap) flushTexmap();
  return out;
}

/**
 * Recursively compiles an LDraw `.dat` entry into WebGL-ready Y-up triangle,
 * normal, edge, and per-triangle color buffers.
 *
 * Uses sibling-fair triangle & edge budgeting so high-poly printed torsos,
 * minifigure faces, or complex subparts can never starve later sibling subfiles
 * (such as minifigure arms `3818`/`3819`, hands `3820`, or head torus bevels
 * `t04o6250`/`t08o6250`/`t16o6250`).
 */
export function compileDatEntry(
  found: DatEntrySource,
  lookupSubfile: (ref: string) => DatEntrySource | null | undefined,
  options: CompileDatOptions = {},
): CompiledDatMesh | null {
  const maxTriFloats = options.maxTriFloats ?? DEFAULT_MAX_TRI_FLOATS;
  const maxEdgeFloats = options.maxEdgeFloats ?? DEFAULT_MAX_EDGE_FLOATS;
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  const subTriReserve = options.subTriReserve ?? DEFAULT_SUB_TRI_RESERVE;
  const subEdgeReserve = options.subEdgeReserve ?? DEFAULT_SUB_EDGE_RESERVE;

  const tris: number[] = [];
  const norms: number[] = [];
  const edges: number[] = [];
  const triCols: number[] = [];
  let hasSubColor = false;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  const upd = (p: [number, number, number]) => {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
    if (p[2] < minZ) minZ = p[2]; if (p[2] > maxZ) maxZ = p[2];
  };

  const ld2gl = (pt: [number, number, number]): [number, number, number] => [pt[0], -pt[1], -pt[2]];

  const emitTri = (
    la: [number, number, number],
    lb: [number, number, number],
    lc: [number, number, number],
    colId = 16,
  ) => {
    const a = ld2gl(la), b = ld2gl(lb), c = ld2gl(lc);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz);
    if (nl < 1e-9 || !Number.isFinite(nl)) return;
    nx /= nl; ny /= nl; nz /= nl;
    tris.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    norms.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    triCols.push(colId);
    if (colId !== 16) hasSubColor = true;
    upd(a); upd(b); upd(c);
  };

  const cross3 = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
  ): [number, number, number] => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    return [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
  };

  const dot3 = (u: [number, number, number], v: [number, number, number]): number =>
    u[0] * v[0] + u[1] * v[1] + u[2] * v[2];

  // Safe quad triangulation: handles convex, concave, and bowtie quads without folding or notches
  const emitQuad = (
    pa: [number, number, number],
    pb: [number, number, number],
    pc: [number, number, number],
    pd: [number, number, number],
    colId = 16,
  ) => {
    const n1 = cross3(pa, pb, pc);
    const n2 = cross3(pa, pc, pd);
    if (dot3(n1, n2) >= 0) {
      emitTri(pa, pb, pc, colId);
      emitTri(pa, pc, pd, colId);
      return;
    }
    const m1 = cross3(pa, pb, pd);
    const m2 = cross3(pb, pc, pd);
    if (dot3(m1, m2) >= 0) {
      emitTri(pa, pb, pd, colId);
      emitTri(pb, pc, pd, colId);
      return;
    }
    const b1 = cross3(pa, pc, pb);
    const b2 = cross3(pa, pb, pd);
    if (dot3(b1, b2) >= 0) {
      emitTri(pa, pc, pb, colId);
      emitTri(pa, pb, pd, colId);
    } else {
      emitTri(pa, pb, pd, colId);
      emitTri(pa, pd, pc, colId);
    }
  };

  const emitEdge = (la: [number, number, number], lb: [number, number, number]) => {
    const a = ld2gl(la), b = ld2gl(lb);
    edges.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    upd(a); upd(b);
  };

  // Lightweight 8-sided cylinder stud (flush seated, with top rim & inner wall for hollow stud2/stud2a)
  const emitFastStud = (
    px: number, py: number, pz: number, pm: Mat3, hollow: boolean, colId: number, edgeLimit: number,
  ) => {
    const segs = 8, r = 6, rIn = 4;
    const tp = (x: number, y: number, z: number): [number, number, number] => {
      const v = mat3Vec(pm, x, y, z);
      return [px + v[0], py + v[1], pz + v[2]];
    };
    const topC = tp(0, -4, 0);
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0);
      const c1 = Math.cos(a1), s1 = Math.sin(a1);
      const t0 = tp(c0 * r, -4, s0 * r);
      const t1 = tp(c1 * r, -4, s1 * r);
      const b0 = tp(c0 * r, 0.4, s0 * r);
      const b1 = tp(c1 * r, 0.4, s1 * r);
      emitTri(b0, b1, t1, colId);
      emitTri(b0, t1, t0, colId);
      if (hollow) {
        const it0 = tp(c0 * rIn, -4, s0 * rIn);
        const it1 = tp(c1 * rIn, -4, s1 * rIn);
        const ib0 = tp(c0 * rIn, 0, s0 * rIn);
        const ib1 = tp(c1 * rIn, 0, s1 * rIn);
        emitTri(it0, t0, t1, colId);
        emitTri(it0, t1, it1, colId);
        emitTri(ib0, it1, ib1, colId);
        emitTri(ib0, it0, it1, colId);
      } else {
        emitTri(topC, t0, t1, colId);
      }
      if (edges.length < edgeLimit) emitEdge(t0, t1);
    }
  };

  // Synthesize standard LDraw arc & rect primitives at exact LDraw circle resolution
  // (8/ -> 8, standard -> 16, 48/ -> 48) so cylinders/rings/ndis align vertex-for-vertex
  // with toruses and printed minifigure face patterns with zero seam cracks!
  const emitSynthPrim = (
    base: string,
    circleRes: 8 | 16 | 48,
    px: number, py: number, pz: number, pm: Mat3, colId: number, edgeLimit: number,
  ): boolean => {
    const tp = (x: number, y: number, z: number): [number, number, number] => {
      const v = mat3Vec(pm, x, y, z);
      return [px + v[0], py + v[1], pz + v[2]];
    };
    if (base === 'rect' || base === 'rect2p') {
      const p0 = tp(-1, 0, -1), p1 = tp(1, 0, -1), p2 = tp(1, 0, 1), p3 = tp(-1, 0, 1);
      emitTri(p0, p1, p2, colId);
      emitTri(p0, p2, p3, colId);
      if (edges.length < edgeLimit) {
        if (base === 'rect') {
          emitEdge(p0, p1); emitEdge(p1, p2); emitEdge(p2, p3); emitEdge(p3, p0);
        } else {
          emitEdge(p0, p1); emitEdge(p2, p3);
        }
      }
      return true;
    }
    const m = base.match(SYNTH_ARC_RE);
    if (!m) return false;
    const num = +m[1], den = +m[2], kind = m[3];
    if (!den || num <= 0) return false;
    const frac = Math.min(1, num / den);
    const minSegs = kind === 'chrd' ? 2 : 1;
    const segs = Math.max(minSegs, Math.round(circleRes * frac));
    const maxA = frac * Math.PI * 2;
    if (kind === 'edge') {
      if (edges.length < edgeLimit) {
        for (let i = 0; i < segs; i++) {
          const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
          emitEdge(tp(Math.cos(a0), 0, Math.sin(a0)), tp(Math.cos(a1), 0, Math.sin(a1)));
        }
      }
      return true;
    }
    if (kind === 'cyli' || kind === 'cylo' || kind === 'cylc') {
      const topC = kind === 'cylc' ? tp(0, 0, 0) : null;
      const botC = kind === 'cylc' ? tp(0, 1, 0) : null;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        const t0 = tp(Math.cos(a0), 0, Math.sin(a0)), t1 = tp(Math.cos(a1), 0, Math.sin(a1));
        const b0 = tp(Math.cos(a0), 1, Math.sin(a0)), b1 = tp(Math.cos(a1), 1, Math.sin(a1));
        emitTri(t0, t1, b1, colId);
        emitTri(t0, b1, b0, colId);
        if (topC && botC) {
          emitTri(topC, t0, t1, colId);
          emitTri(botC, b1, b0, colId);
        }
      }
      return true;
    }
    if (kind === 'disc') {
      const c = tp(0, 0, 0);
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        emitTri(c, tp(Math.cos(a0), 0, Math.sin(a0)), tp(Math.cos(a1), 0, Math.sin(a1)), colId);
      }
      return true;
    }
    if (kind === 'ndis') {
      // Negative disc (1-4ndis, 2-4ndis, 3-4ndis, 4-4ndis, 1-8ndis, 1-16ndis, etc.):
      // Fills the area between the unit circle arc and the enclosing square corners (±1, 0, ±1).
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        const aMid = (a0 + a1) * 0.5;
        const cx = Math.cos(aMid) >= 0 ? 1 : -1;
        const cz = Math.sin(aMid) >= 0 ? 1 : -1;
        emitTri(
          tp(Math.cos(a1), 0, Math.sin(a1)),
          tp(Math.cos(a0), 0, Math.sin(a0)),
          tp(cx, 0, cz),
          colId,
        );
      }
      return true;
    }
    if (kind === 'chrd') {
      const pStart = tp(1, 0, 0);
      for (let i = 1; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        emitTri(pStart, tp(Math.cos(a0), 0, Math.sin(a0)), tp(Math.cos(a1), 0, Math.sin(a1)), colId);
      }
      return true;
    }
    if (kind.startsWith('ring') || kind.startsWith('rin')) {
      const ri = parseInt(kind.replace(/^ring?/, ''), 10);
      if (!Number.isFinite(ri) || ri < 1) return false;
      const ro = ri + 1;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        const i0 = tp(Math.cos(a0) * ri, 0, Math.sin(a0) * ri);
        const i1 = tp(Math.cos(a1) * ri, 0, Math.sin(a1) * ri);
        const o0 = tp(Math.cos(a0) * ro, 0, Math.sin(a0) * ro);
        const o1 = tp(Math.cos(a1) * ro, 0, Math.sin(a1) * ro);
        emitTri(i0, o0, o1, colId);
        emitTri(i0, o1, i1, colId);
      }
      return true;
    }
    return false;
  };

  // Procedural fallback for standard LDraw primitives (torus t04o6250/t08o6250/t16o6250,
  // cones conN, cylinder variants cyli2/cylh/ccyli, boxes box/box5/box4) when missing from library
  const emitFallbackPrim = (
    base: string,
    circleRes: 8 | 16 | 48,
    px: number, py: number, pz: number, pm: Mat3, colId: number,
  ): boolean => {
    const tp = (x: number, y: number, z: number): [number, number, number] => {
      const v = mat3Vec(pm, x, y, z);
      return [px + v[0], py + v[1], pz + v[2]];
    };

    const mTorus = base.match(FALLBACK_TORUS_RE);
    if (mTorus) {
      const sweepDiv = parseInt(mTorus[1], 10);
      const mode = mTorus[2];
      const minorR = parseInt(mTorus[3], 10) / 10000;
      if (!sweepDiv || minorR <= 0) return false;
      const sweepSegs = Math.max(1, Math.round(circleRes / sweepDiv));
      const maxA = (Math.PI * 2) / sweepDiv;
      const phiStart = mode === 'i' ? Math.PI / 2 : 0;
      const phiEnd = mode === 'o' ? Math.PI / 2 : mode === 'i' ? Math.PI : Math.PI * 2;
      const tubeSegs = mode === 'q' ? 16 : circleRes === 48 ? 6 : 4;
      const torusPt = (a: number, phi: number): [number, number, number] => {
        const rad = 1 + minorR * Math.cos(phi);
        return tp(rad * Math.cos(a), minorR * Math.sin(phi), rad * Math.sin(a));
      };
      for (let i = 0; i < sweepSegs; i++) {
        const a0 = (i / sweepSegs) * maxA;
        const a1 = ((i + 1) / sweepSegs) * maxA;
        for (let j = 0; j < tubeSegs; j++) {
          const p0 = phiStart + (j / tubeSegs) * (phiEnd - phiStart);
          const p1 = phiStart + ((j + 1) / tubeSegs) * (phiEnd - phiStart);
          const v00 = torusPt(a0, p0);
          const v10 = torusPt(a1, p0);
          const v11 = torusPt(a1, p1);
          const v01 = torusPt(a0, p1);
          emitTri(v00, v10, v11, colId);
          emitTri(v00, v11, v01, colId);
        }
      }
      return true;
    }

    const mCon = base.match(FALLBACK_CONE_RE);
    if (mCon) {
      const num = +mCon[1], den = +mCon[2], rTop = +mCon[3];
      if (!num || !den) return false;
      const rBot = rTop + 1;
      const frac = Math.min(1, num / den);
      const segs = Math.max(1, Math.round(circleRes * frac));
      const maxA = frac * Math.PI * 2;
      const apex = rTop === 0 ? tp(0, 1, 0) : null;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        const b0 = tp(Math.cos(a0) * rBot, 0, Math.sin(a0) * rBot);
        const b1 = tp(Math.cos(a1) * rBot, 0, Math.sin(a1) * rBot);
        if (apex) {
          emitTri(apex, b1, b0, colId);
        } else {
          const t0 = tp(Math.cos(a0) * rTop, 1, Math.sin(a0) * rTop);
          const t1 = tp(Math.cos(a1) * rTop, 1, Math.sin(a1) * rTop);
          emitTri(t0, t1, b1, colId);
          emitTri(t0, b1, b0, colId);
        }
      }
      return true;
    }

    const mCylVar = base.match(FALLBACK_CYL_VAR_RE);
    if (mCylVar) {
      const num = +mCylVar[1], den = +mCylVar[2];
      if (!num || !den) return false;
      const frac = Math.min(1, num / den);
      const segs = Math.max(1, Math.round(circleRes * frac));
      const maxA = frac * Math.PI * 2;
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        const t0 = tp(Math.cos(a0), 0, Math.sin(a0)), t1 = tp(Math.cos(a1), 0, Math.sin(a1));
        const b0 = tp(Math.cos(a0), 1, Math.sin(a0)), b1 = tp(Math.cos(a1), 1, Math.sin(a1));
        emitTri(t0, t1, b1, colId);
        emitTri(t0, b1, b0, colId);
      }
      return true;
    }

    if (base === 'box' || base === 'box5' || base === 'box4') {
      const yMin = base === 'box' ? -1 : 0;
      const yMax = 1;
      const p000 = tp(-1, yMin, -1), p100 = tp(1, yMin, -1);
      const p101 = tp(1, yMin, 1), p001 = tp(-1, yMin, 1);
      const p010 = tp(-1, yMax, -1), p110 = tp(1, yMax, -1);
      const p111 = tp(1, yMax, 1), p011 = tp(-1, yMax, 1);
      emitQuad(p011, p001, p101, p111, colId);
      emitQuad(p010, p000, p001, p011, colId);
      emitQuad(p110, p100, p000, p010, colId);
      emitQuad(p111, p101, p100, p110, colId);
      if (base === 'box5' || base === 'box') emitQuad(p011, p111, p110, p010, colId);
      if (base === 'box') emitQuad(p000, p100, p101, p001, colId);
      return true;
    }

    return false;
  };

  const resolveLineCol = (rawColStr: string, curColor: number): number => {
    const c = parseInt(rawColStr, 10);
    return Number.isFinite(c) && c !== 16 && c !== 24 ? c : curColor;
  };

  const walk = (
    rawLines: string[],
    px: number,
    py: number,
    pz: number,
    pm: Mat3,
    depth: number,
    curColor: number,
    triLimit: number,
    edgeLimit: number,
  ) => {
    if (depth > maxDepth || tris.length >= triLimit) return;
    const lines = preprocessTexmapLines(rawLines);

    // Count recursive type-1 subfile references in this file so direct print decals
    // or early subparts can never starve later siblings (e.g. torso sides, arms, hands, head toruses).
    let heavySubCount = 0;
    let lightSubCount = 0;
    for (const raw of lines) {
      if (!isLineKind(raw, '1')) continue;
      const t = raw.split(/\s+/);
      if (t.length < 15) continue;
      const ref = normalizeDatRef(t.slice(14).join(' '));
      const base = ref.split('/').pop() || '';
      if (isFastStudBase(base) || SKIPPED_UNDERSIDE_RE.test(base) || canSynthesizePrim(base)) continue;
      if (isLightweightPrimitiveBase(base)) lightSubCount++;
      else heavySubCount++;
    }

    const totalSubCount = heavySubCount + lightSubCount;
    const availTriStart = Math.max(0, triLimit - tris.length);
    const neededReserve = heavySubCount * subTriReserve + lightSubCount * 1800; // 200 tris per torus/cone/box
    const directTriReserve =
      totalSubCount > 0 ? Math.min(neededReserve, Math.floor(availTriStart * 0.4)) : 0;
    const directTriLimit = Math.max(tris.length, triLimit - directTriReserve);

    const availEdgeStart = Math.max(0, edgeLimit - edges.length);
    const directEdgeReserve =
      heavySubCount > 0 ? Math.min(heavySubCount * subEdgeReserve, Math.floor(availEdgeStart * 0.4)) : 0;
    const directEdgeLimit = Math.max(edges.length, edgeLimit - directEdgeReserve);

    let subIdx = 0;
    for (const raw of lines) {
      if (isLineKind(raw, '3')) {
        if (tris.length >= directTriLimit) continue;
        const t = raw.split(/\s+/);
        if (t.length >= 11) {
          const colId = resolveLineCol(t[1], curColor);
          const a = mat3Vec(pm, +t[2], +t[3], +t[4]);
          const b = mat3Vec(pm, +t[5], +t[6], +t[7]);
          const c = mat3Vec(pm, +t[8], +t[9], +t[10]);
          emitTri(
            [px + a[0], py + a[1], pz + a[2]],
            [px + b[0], py + b[1], pz + b[2]],
            [px + c[0], py + c[1], pz + c[2]],
            colId,
          );
        }
      } else if (isLineKind(raw, '4')) {
        if (tris.length >= directTriLimit) continue;
        const t = raw.split(/\s+/);
        if (t.length >= 14) {
          const colId = resolveLineCol(t[1], curColor);
          const a = mat3Vec(pm, +t[2], +t[3], +t[4]);
          const b = mat3Vec(pm, +t[5], +t[6], +t[7]);
          const c = mat3Vec(pm, +t[8], +t[9], +t[10]);
          const d = mat3Vec(pm, +t[11], +t[12], +t[13]);
          emitQuad(
            [px + a[0], py + a[1], pz + a[2]],
            [px + b[0], py + b[1], pz + b[2]],
            [px + c[0], py + c[1], pz + c[2]],
            [px + d[0], py + d[1], pz + d[2]],
            colId,
          );
        }
      } else if (isLineKind(raw, '2')) {
        if (edges.length >= directEdgeLimit) continue;
        const t = raw.split(/\s+/);
        if (t.length >= 8) {
          const a = mat3Vec(pm, +t[2], +t[3], +t[4]);
          const b = mat3Vec(pm, +t[5], +t[6], +t[7]);
          if (Number.isFinite(a[0]) && Number.isFinite(b[0])) {
            emitEdge([px + a[0], py + a[1], pz + a[2]], [px + b[0], py + b[1], pz + b[2]]);
          }
        }
      } else if (isLineKind(raw, '1')) {
        const t = raw.split(/\s+/);
        if (t.length < 15) continue;
        const childCol = resolveLineCol(t[1], curColor);
        const lx = +t[2], ly = +t[3], lz = +t[4];
        const lm: Mat3 = [
          +t[5], +t[6], +t[7],
          +t[8], +t[9], +t[10],
          +t[11], +t[12], +t[13],
        ];
        if ([lx, ly, lz, ...lm].some((n) => !Number.isFinite(n))) continue;
        const v = mat3Vec(pm, lx, ly, lz);
        const nx = px + v[0], ny = py + v[1], nz = pz + v[2];
        const nm = mat3Multiply(pm, lm);
        const ref = normalizeDatRef(t.slice(14).join(' '));
        const circleRes: 8 | 16 | 48 = ref.startsWith('48/') ? 48 : ref.startsWith('8/') ? 8 : 16;
        const base = ref.split('/').pop() || '';

        // Fast studs & skip hidden underside tubes/recesses!
        if (isFastStudBase(base)) {
          if (tris.length < triLimit) {
            emitFastStud(nx, ny, nz, nm, base.startsWith('stud2'), childCol, edgeLimit);
          }
          continue;
        }
        if (SKIPPED_UNDERSIDE_RE.test(base)) continue;

        // Synthesize standard circular/rect primitives at exact LDraw circle resolution
        if (canSynthesizePrim(base)) {
          if (tris.length < triLimit) {
            emitSynthPrim(base, circleRes, nx, ny, nz, nm, childCol, edgeLimit);
          }
          continue;
        }

        const remainingSiblings = Math.max(0, totalSubCount - 1 - subIdx);
        subIdx++;
        const availTriNow = Math.max(0, triLimit - tris.length);
        const reserveTriForRest =
          remainingSiblings > 0
            ? Math.min(
                remainingSiblings * subTriReserve,
                Math.floor(availTriNow * (remainingSiblings / (remainingSiblings + 1))),
              )
            : 0;
        const childTriLimit = Math.max(tris.length, triLimit - reserveTriForRest);

        const availEdgeNow = Math.max(0, edgeLimit - edges.length);
        const reserveEdgeForRest =
          remainingSiblings > 0
            ? Math.min(
                remainingSiblings * subEdgeReserve,
                Math.floor(availEdgeNow * (remainingSiblings / (remainingSiblings + 1))),
              )
            : 0;
        const childEdgeLimit = Math.max(edges.length, edgeLimit - reserveEdgeForRest);

        const sub = lookupSubfile(ref);
        if (sub) {
          walk(sub.lines, nx, ny, nz, nm, depth + 1, childCol, childTriLimit, childEdgeLimit);
        } else if (tris.length < childTriLimit) {
          // Procedural fallback for missing torus bevels (t04o6250, t08o6250, t16o6250), cones, boxes
          emitFallbackPrim(base, circleRes, nx, ny, nz, nm, childCol);
        }
      }
    }
  };

  const [rootOx, rootOy, rootOz] = found.offset || [0, 0, 0];
  walk(found.lines, rootOx, rootOy, rootOz, R_IDENTITY, 0, 16, maxTriFloats, maxEdgeFloats);

  if (tris.length === 0) return null;
  return {
    tris: new Float32Array(tris),
    norms: new Float32Array(norms),
    edges: new Float32Array(edges),
    triCols: hasSubColor ? new Int16Array(triCols) : null,
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}
