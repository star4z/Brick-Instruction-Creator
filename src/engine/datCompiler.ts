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
  /** Maximum triangle float entries (9 floats per triangle). Default: 270,000 (30,000 triangles). */
  maxTriFloats?: number;
  /** Maximum edge float entries (6 floats per edge). Default: 48,000 (8,000 edges). */
  maxEdgeFloats?: number;
  /** Maximum subfile recursion depth. Default: 12. */
  maxDepth?: number;
  /** Triangle floats reserved per remaining sibling subfile so dense prints never starve later parts (e.g. arms/hands). */
  subTriReserve?: number;
  /** Edge floats reserved per remaining sibling subfile. */
  subEdgeReserve?: number;
}

export const DEFAULT_MAX_TRI_FLOATS = 270000; // 30,000 triangles (9 floats each)
export const DEFAULT_MAX_EDGE_FLOATS = 48000; // 8,000 edges (6 floats each)
export const DEFAULT_MAX_DEPTH = 12;
export const DEFAULT_SUB_TRI_RESERVE = 18000; // 2,000 triangles reserved per sibling
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
const SYNTH_ARC_RE = /^(\d+)-(\d+)(cyli|cylo|cylc|disc|edge|ring\d+|chrd|ndis)$/;

function isFastStudBase(base: string): boolean {
  return base === 'stud' || base === 'stud2' || base === 'stud2a' || base === 'studp01';
}

function canSynthesizePrim(base: string): boolean {
  if (base === 'rect' || base === 'rect2p') return true;
  const m = base.match(SYNTH_ARC_RE);
  if (!m) return false;
  if (m[3] === 'ndis') {
    const num = +m[1];
    const den = +m[2];
    return den > 0 && num > 0 && num <= den && (num * 4) % den === 0;
  }
  return true;
}

function isLineKind(raw: string, kind: string): boolean {
  return raw[0] === kind && (raw[1] === ' ' || raw[1] === '\t');
}

/**
 * Recursively compiles an LDraw `.dat` entry into WebGL-ready Y-up triangle,
 * normal, edge, and per-triangle color buffers.
 *
 * Uses sibling-fair triangle & edge budgeting so high-poly printed torsos or
 * complex subparts can never starve later sibling subfiles (such as minifigure
 * arms `3818`/`3819` and both hands `3820`).
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
    if (nl < 1e-6) return;
    nx /= nl; ny /= nl; nz /= nl;
    tris.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    norms.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
    triCols.push(colId);
    if (colId !== 16) hasSubColor = true;
    upd(a); upd(b); upd(c);
  };

  const emitEdge = (la: [number, number, number], lb: [number, number, number]) => {
    const a = ld2gl(la), b = ld2gl(lb);
    edges.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    upd(a); upd(b);
  };

  // Lightweight 8-sided cylinder stud (flush seated, 5x faster than 16/48-sided stud.dat!)
  const emitFastStud = (
    px: number, py: number, pz: number, pm: Mat3, hollow: boolean, colId: number, edgeLimit: number,
  ) => {
    const segs = 8, r = 6;
    const tp = (x: number, y: number, z: number): [number, number, number] => {
      const v = mat3Vec(pm, x, y, z);
      return [px + v[0], py + v[1], pz + v[2]];
    };
    const topC = tp(0, -4, 0);
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2, a1 = ((i + 1) / segs) * Math.PI * 2;
      const t0 = tp(Math.cos(a0) * r, -4, Math.sin(a0) * r);
      const t1 = tp(Math.cos(a1) * r, -4, Math.sin(a1) * r);
      const b0 = tp(Math.cos(a0) * r, 0.4, Math.sin(a0) * r);
      const b1 = tp(Math.cos(a1) * r, 0.4, Math.sin(a1) * r);
      emitTri(b0, b1, t1, colId);
      emitTri(b0, t1, t0, colId);
      if (!hollow) emitTri(topC, t0, t1, colId);
      if (edges.length < edgeLimit) emitEdge(t0, t1);
    }
  };

  // Synthesize LDraw arc & basic primitives (low-poly 8-10 segs to stay fast on mobile!)
  const emitSynthPrim = (
    base: string, px: number, py: number, pz: number, pm: Mat3, colId: number, edgeLimit: number,
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
    const segs = Math.max(2, Math.round(10 * frac));
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
      if ((num * 4) % den !== 0) return false;
      const quadrants = Math.min(4, Math.round((num * 4) / den));
      const corners: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];
      const qSegs = 3;
      for (let q = 0; q < quadrants; q++) {
        const [cx, cz] = corners[q];
        const corner = tp(cx, 0, cz);
        const startA = q * (Math.PI / 2);
        for (let i = 0; i < qSegs; i++) {
          const a0 = startA + (i / qSegs) * (Math.PI / 2);
          const a1 = startA + ((i + 1) / qSegs) * (Math.PI / 2);
          emitTri(corner, tp(Math.cos(a1), 0, Math.sin(a1)), tp(Math.cos(a0), 0, Math.sin(a0)), colId);
        }
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
    if (kind.startsWith('ring')) {
      const ri = parseInt(kind.slice(4), 10) || 1, ro = ri + 1;
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

  const resolveLineCol = (rawColStr: string, curColor: number): number => {
    const c = parseInt(rawColStr, 10);
    return Number.isFinite(c) && c !== 16 && c !== 24 ? c : curColor;
  };

  const walk = (
    lines: string[],
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

    // Count recursive type-1 subfile references in this file so direct print decals
    // or early subparts can never starve later siblings (e.g. torso sides, arms, hands).
    let subfileCount = 0;
    for (const raw of lines) {
      if (!isLineKind(raw, '1')) continue;
      const t = raw.split(/\s+/);
      if (t.length < 15) continue;
      const ref = normalizeDatRef(t.slice(14).join(' '));
      const base = ref.split('/').pop() || '';
      if (isFastStudBase(base) || SKIPPED_UNDERSIDE_RE.test(base) || canSynthesizePrim(base)) continue;
      subfileCount++;
    }

    const availTriStart = Math.max(0, triLimit - tris.length);
    const directTriReserve =
      subfileCount > 0 ? Math.min(subfileCount * subTriReserve, Math.floor(availTriStart * 0.5)) : 0;
    const directTriLimit = Math.max(tris.length, triLimit - directTriReserve);

    const availEdgeStart = Math.max(0, edgeLimit - edges.length);
    const directEdgeReserve =
      subfileCount > 0 ? Math.min(subfileCount * subEdgeReserve, Math.floor(availEdgeStart * 0.5)) : 0;
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
          const pa: [number, number, number] = [px + a[0], py + a[1], pz + a[2]];
          const pb: [number, number, number] = [px + b[0], py + b[1], pz + b[2]];
          const pc: [number, number, number] = [px + c[0], py + c[1], pz + c[2]];
          const pd: [number, number, number] = [px + d[0], py + d[1], pz + d[2]];
          emitTri(pa, pb, pc, colId);
          emitTri(pa, pc, pd, colId);
        }
      } else if (isLineKind(raw, '2')) {
        if (edges.length >= directEdgeLimit) continue;
        const t = raw.split(/\s+/);
        if (t.length >= 8) {
          const a = mat3Vec(pm, +t[2], +t[3], +t[4]);
          const b = mat3Vec(pm, +t[5], +t[6], +t[7]);
          emitEdge([px + a[0], py + a[1], pz + a[2]], [px + b[0], py + b[1], pz + b[2]]);
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
        const base = ref.split('/').pop() || '';

        // Fast studs & skip hidden underside tubes/recesses!
        if (isFastStudBase(base)) {
          if (tris.length < triLimit) {
            emitFastStud(nx, ny, nz, nm, base.startsWith('stud2'), childCol, edgeLimit);
          }
          continue;
        }
        if (SKIPPED_UNDERSIDE_RE.test(base)) continue;
        // Synthesize 48/ hi-res arcs as fast 10-sided primitives instead of 48-sided!
        if (canSynthesizePrim(base)) {
          if (tris.length < triLimit) {
            emitSynthPrim(base, nx, ny, nz, nm, childCol, edgeLimit);
          }
          continue;
        }

        const remainingSiblings = Math.max(0, subfileCount - 1 - subIdx);
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
