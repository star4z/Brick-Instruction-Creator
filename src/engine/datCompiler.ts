import type { Mat3 } from './minifigPose';
import { R_IDENTITY, mat3Multiply, mat3Vec } from './minifigPose';
import { buildLocalSubBoxes, type LocalBox6 } from './partContact';
import { hashTextureBase64 } from './textureStore';

/**
 * High-bit tag for LDraw direct RGB colors (`0x2RRGGBB`) stored inside `triCols: Int32Array`.
 * Disjoint from all standard LDraw color indices (0..99999).
 */
export const DIRECT_RGB_COLOR_FLAG = 0x2000000;

/**
 * Returns true iff `cid` is a tagged LDraw direct RGB color (`0x2RRGGBB`).
 * Uses a range check rather than bitwise `&` so negative signed integers (such as `-1`,
 * whose 32-bit two's complement representation is `0xFFFFFFFF`) can never false-match as white.
 */
export function isDirectRgbColor(cid: number): boolean {
  return cid >= DIRECT_RGB_COLOR_FLAG && cid < DIRECT_RGB_COLOR_FLAG + 0x1000000;
}

export interface DatEntrySource {
  key: string;
  lines: string[];
  offset?: [number, number, number] | null;
  virtual?: boolean;
}

export interface CompiledTexBatch {
  /** Stable deduplicated texture key (content hash for PE_TEX_INFO or normalized name key for !TEXMAP). */
  texKey: string;
  /** Raw base64 PNG/WebP/JPEG payload when embedded inline via PE_TEX_INFO or !DATA. */
  base64Png?: string;
  /** Y-up WebGL triangle positions (9 floats per triangle). */
  tris: Float32Array;
  /** Y-up WebGL triangle normals (9 floats per triangle). */
  norms: Float32Array;
  /** OpenGL-convention UV coordinates (6 floats per triangle: u0,v0, u1,v1, u2,v2 where v=0 bottom, v=1 top). */
  uvs: Float32Array;
  /** Per-triangle LDraw base plastic color IDs (16 = main part color, or DIRECT_RGB_COLOR_FLAG | rgb). */
  triCols: Int32Array | null;
}

export interface CompiledDatMesh {
  tris: Float32Array;
  norms: Float32Array;
  edges: Float32Array;
  triCols: Int32Array | null;
  /** Textured decal batches from BrickLink Studio PE_TEX_INFO or LDraw !TEXMAP. */
  texBatches?: CompiledTexBatch[];
  /** Compact local-space tight sub-boxes for concave parts (undefined for solid/convex bricks). */
  subBoxes?: LocalBox6[];
  min: [number, number, number];
  max: [number, number, number];
}

export interface TextureLookupResult {
  texKey: string;
  base64Png?: string;
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
  /** Optional resolver for LDraw `!TEXMAP` external / `!DATA` texture filenames. */
  lookupTexture?: (texName: string) => TextureLookupResult | null | undefined;
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

// Only skip hidden underside anti-stud tubes (stud3/stud3a/stud4/stud4a).
// Never skip axlehol* (used for visible exterior Technic cross-axle shafts in parts like
// 2736 Technic Axle Towball, 32062, 32209 as well as axle holes), beamhol*/npeghol*
// (visible Technic liftarm faces), or stud10/stud15 (visible top studs on 2x2 round parts).
const SKIPPED_UNDERSIDE_RE = /^(stud3|stud3a|stud4|stud4a)$/;
const SYNTH_ARC_RE = /^(\d+)-(\d+)(cyli|cylo|cylc|disc|edge|ring\d+|rin\d+|chrd|ndis)$/;
const FALLBACK_TORUS_RE = /^t(\d+)([oiq])(\d{4})$/;
const FALLBACK_CONE_RE = /^(\d+)-(\d+)con(\d+)$/;
const FALLBACK_CYL_VAR_RE = /^(\d+)-(\d+)(?:cyli2|cylh|ccyli)$/;

const AXLE_PROFILE: readonly [number, number][] = [
  [6, 0],
  [5.6023, 2],
  [2, 2],
  [2, 5.6023],
  [0, 6],
  [-2, 5.6023],
  [-2, 2],
  [-5.6023, 2],
  [-6, 0],
  [-5.6023, -2],
  [-2, -2],
  [-2, -5.6023],
  [0, -6],
  [2, -5.6023],
  [2, -2],
  [5.6023, -2],
];

type Vec3 = [number, number, number];
type Vec2 = [number, number];

interface PeTexProjection {
  tx: number;
  ty: number;
  tz: number;
  /** Orthonormal (sign-preserving) columns of the projection frame in LDraw coordinates. */
  rx: Vec3;
  ry: Vec3;
  rz: Vec3;
  halfExtents: Vec3;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

interface PeTexInfo {
  texKey: string;
  base64Png: string;
  proj: PeTexProjection | null;
  nextShear: boolean;
}

interface PeTexPathEntry {
  /** Remaining child type-1 line indices; empty or [-1] applies to the current file. */
  path: number[];
  info: PeTexInfo;
}

interface TexmapProjection {
  texKey: string;
  base64Png?: string;
  method: 'PLANAR' | 'CYLINDRICAL' | 'SPHERICAL';
  /** Parameters transformed into the root compiled LDraw coordinate space. */
  p1: Vec3;
  p2: Vec3;
  p3: Vec3;
  angle1Rad: number;
  angle2Rad: number;
}

interface TexBatchBuilder {
  texKey: string;
  base64Png?: string;
  tris: number[];
  norms: number[];
  uvs: number[];
  triCols: number[];
  hasSubColor: boolean;
}

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
    base === 'box4' ||
    base === 'box2-9p' ||
    base === 'axlehol2' ||
    base === 'axlehol8' ||
    base === 'axlehol9' ||
    base === 'axleend'
  );
}

function isLineKind(raw: string, kind: string): boolean {
  return raw[0] === kind && (raw[1] === ' ' || raw[1] === '\t');
}

function sub3(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot3(u: Vec3, v: Vec3): number {
  return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
}

function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function norm3(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]);
  return l > 1e-9 ? [v[0] / l, v[1] / l, v[2] / l] : [0, 0, 0];
}

function parsePeTexInfoLine(
  line: string,
  nextShear: boolean,
  px: number,
  py: number,
  pz: number,
  pm: Mat3,
): PeTexInfo | null {
  const m = line.match(/^0\s+PE_TEX_INFO\s+(.+)$/i);
  if (!m) return null;
  const toks = m[1].trim().split(/\s+/);
  if (toks.length === 0) return null;
  const b64 = toks[toks.length - 1];
  if (b64.length < 16 || !/^[A-Za-z0-9+/=]+$/.test(b64)) return null;
  const texKey = hashTextureBase64(b64);

  // Explicit per-vertex UV mode: `0 PE_TEX_INFO <base64>`
  if (toks.length < 17) {
    return { texKey, base64Png: b64, proj: null, nextShear };
  }

  // Planar box projection mode: `0 PE_TEX_INFO tx ty tz m00..m22 minX minY maxX maxY <base64>`
  const nums: number[] = [];
  for (let i = 0; i < 16; i++) {
    const v = parseFloat(toks[i]);
    if (!Number.isFinite(v)) {
      return { texKey, base64Png: b64, proj: null, nextShear };
    }
    nums.push(v);
  }
  const [tx, ty, tz, m00, m01, m02, m10, m11, m12, m20, m21, m22, minX, minY, maxX, maxY] = nums;
  const tv = mat3Vec(pm, tx, ty, tz);
  const cx = mat3Vec(pm, m00, m10, m20);
  const cy = mat3Vec(pm, m01, m11, m21);
  const cz = mat3Vec(pm, m02, m12, m22);
  const sx = Math.hypot(cx[0], cx[1], cx[2]);
  const sy = Math.hypot(cy[0], cy[1], cy[2]);
  const sz = Math.hypot(cz[0], cz[1], cz[2]);
  if (sx < 1e-6 || sy < 1e-6 || sz < 1e-6) {
    return { texKey, base64Png: b64, proj: null, nextShear };
  }
  const rx: Vec3 = [cx[0] / sx, cx[1] / sx, cx[2] / sx];
  const ry: Vec3 = [cy[0] / sy, cy[1] / sy, cy[2] / sy];
  const rz: Vec3 = [cz[0] / sz, cz[1] / sz, cz[2] / sz];
  return {
    texKey,
    base64Png: b64,
    proj: {
      tx: px + tv[0],
      ty: py + tv[1],
      tz: pz + tv[2],
      rx,
      ry,
      rz,
      halfExtents: [sx * 0.55, sy * 0.55, sz * 0.55],
      minX,
      minY,
      maxX,
      maxY,
    },
    nextShear,
  };
}

function projectTriWithPeTex(
  pa: Vec3,
  pb: Vec3,
  pc: Vec3,
  proj: PeTexProjection,
): [Vec2, Vec2, Vec2] | null {
  const diffX = proj.maxX - proj.minX;
  const diffY = proj.maxY - proj.minY;
  if (Math.abs(diffX) < 1e-6 || Math.abs(diffY) < 1e-6) return null;

  const toLocal = (p: Vec3): Vec3 => {
    const dx = p[0] - proj.tx;
    const dy = p[1] - proj.ty;
    const dz = p[2] - proj.tz;
    return [
      dx * proj.rx[0] + dy * proj.rx[1] + dz * proj.rx[2],
      dx * proj.ry[0] + dy * proj.ry[1] + dz * proj.ry[2],
      dx * proj.rz[0] + dy * proj.rz[1] + dz * proj.rz[2],
    ];
  };

  const la = toLocal(pa);
  const lb = toLocal(pb);
  const lc = toLocal(pc);

  // Fast AABB rejection against the oriented projection box
  for (let axis = 0; axis < 3; axis++) {
    const h = proj.halfExtents[axis];
    const mn = Math.min(la[axis], lb[axis], lc[axis]);
    const mx = Math.max(la[axis], lb[axis], lc[axis]);
    if (mx < -h || mn > h) return null;
  }

  // Face normal alignment check: local projection axis is Y (surface must not be perpendicular to projection)
  const nLocal = norm3(cross3(sub3(lb, la), sub3(lc, la)));
  if (Math.abs(nLocal[1]) < 0.08) return null;

  const mapUv = (lp: Vec3): Vec2 => [
    (lp[0] - proj.minX) / diffX,
    (-lp[2] - proj.minY) / diffY,
  ];
  const uva = mapUv(la);
  const uvb = mapUv(lb);
  const uvc = mapUv(lc);

  // Reject triangles completely outside [0, 1] x [0, 1] UV bounds
  const minU = Math.min(uva[0], uvb[0], uvc[0]);
  const maxU = Math.max(uva[0], uvb[0], uvc[0]);
  const minV = Math.min(uva[1], uvb[1], uvc[1]);
  const maxV = Math.max(uva[1], uvb[1], uvc[1]);
  if (maxU < 0 || minU > 1 || maxV < 0 || minV > 1) return null;

  return [uva, uvb, uvc];
}

function parseTexmapHeader(
  line: string,
  px: number,
  py: number,
  pz: number,
  pm: Mat3,
  lookupTexture?: (texName: string) => TextureLookupResult | null | undefined,
): TexmapProjection | null {
  if (!lookupTexture) return null;
  const m = line.match(/^0\s+!TEXMAP\s+(?:START|NEXT)\s+(PLANAR|CYLINDRICAL|SPHERICAL)\s+(.+)$/i);
  if (!m) return null;
  const method = m[1].toUpperCase() as 'PLANAR' | 'CYLINDRICAL' | 'SPHERICAL';
  const rest = m[2].trim().split(/\s+/);
  const paramCount = method === 'PLANAR' ? 9 : method === 'CYLINDRICAL' ? 10 : 11;
  if (rest.length <= paramCount) return null;

  const vals: number[] = [];
  for (let i = 0; i < paramCount; i++) {
    const n = parseFloat(rest[i]);
    if (!Number.isFinite(n)) return null;
    vals.push(n);
  }
  // Filename may be followed by optional GLOSSMAP <file>
  let rawTexName = rest[paramCount];
  if (rawTexName.startsWith('"')) {
    const joined = rest.slice(paramCount).join(' ');
    const qm = joined.match(/^"([^"]+)"/);
    if (qm) rawTexName = qm[1];
  }
  const resolved = lookupTexture(rawTexName);
  if (!resolved) return null;

  const xf = (x: number, y: number, z: number): Vec3 => {
    const v = mat3Vec(pm, x, y, z);
    return [px + v[0], py + v[1], pz + v[2]];
  };

  return {
    texKey: resolved.texKey,
    base64Png: resolved.base64Png,
    method,
    p1: xf(vals[0], vals[1], vals[2]),
    p2: xf(vals[3], vals[4], vals[5]),
    p3: xf(vals[6], vals[7], vals[8]),
    angle1Rad: paramCount >= 10 ? (vals[9] * Math.PI) / 180 : 0,
    angle2Rad: paramCount >= 11 ? (vals[10] * Math.PI) / 180 : 0,
  };
}

function projectPointWithTexmap(p: Vec3, tm: TexmapProjection): Vec2 {
  if (tm.method === 'PLANAR') {
    const uVec = sub3(tm.p2, tm.p1);
    const vVec = sub3(tm.p3, tm.p1);
    const uLen2 = dot3(uVec, uVec) || 1;
    const vLen2 = dot3(vVec, vVec) || 1;
    const d = sub3(p, tm.p1);
    const u = dot3(d, uVec) / uLen2;
    const vTopDown = dot3(d, vVec) / vLen2;
    return [u, 1 - vTopDown];
  }
  if (tm.method === 'CYLINDRICAL') {
    // LDraw spec: P1 = bottom/top axis endpoint, P2 = opposite axis endpoint, P3 = front center on P2 plane
    const up = sub3(tm.p1, tm.p2);
    const upLen2 = dot3(up, up) || 1;
    const upDir = norm3(up);
    const frontRaw = sub3(tm.p3, tm.p2);
    const front = norm3(sub3(frontRaw, [
      upDir[0] * dot3(frontRaw, upDir),
      upDir[1] * dot3(frontRaw, upDir),
      upDir[2] * dot3(frontRaw, upDir),
    ]));
    const right = norm3(cross3(front, upDir));
    const d = sub3(p, tm.p2);
    const v = dot3(d, up) / upLen2;
    const dp: Vec3 = [d[0] - up[0] * v, d[1] - up[1] * v, d[2] - up[2] * v];
    const theta = Math.atan2(dot3(dp, right), dot3(dp, front));
    const u = tm.angle1Rad > 1e-6 ? 0.5 + theta / tm.angle1Rad : 0.5;
    return [u, v];
  }
  // SPHERICAL
  const front = norm3(sub3(tm.p2, tm.p1));
  const upRaw = sub3(tm.p3, tm.p1);
  const up = norm3(sub3(upRaw, [
    front[0] * dot3(upRaw, front),
    front[1] * dot3(upRaw, front),
    front[2] * dot3(upRaw, front),
  ]));
  const right = norm3(cross3(front, up));
  const dir = norm3(sub3(p, tm.p1));
  const theta = Math.atan2(dot3(dir, right), dot3(dir, front));
  const phi = Math.asin(Math.max(-1, Math.min(1, dot3(dir, up))));
  const u = tm.angle1Rad > 1e-6 ? 0.5 + theta / tm.angle1Rad : 0.5;
  const v = tm.angle2Rad > 1e-6 ? 0.5 + phi / tm.angle2Rad : 0.5;
  return [u, v];
}

interface ProcessedLine {
  text: string;
  texmap: TexmapProjection | null;
}

/**
 * Expands raw LDraw lines while properly handling `0 !TEXMAP START / NEXT / FALLBACK / END` blocks:
 * - When a `!TEXMAP` block references a texture that IS available via `lookupTexture`, unwrap the
 *   `0 !: ` lines with the active `TexmapProjection` and skip `0 !TEXMAP FALLBACK`.
 * - When the texture is NOT available and a `0 !TEXMAP FALLBACK` section exists, keep the fallback
 *   polygon geometry (which preserves multi-color printed face patterns without UV textures).
 * - When the texture is NOT available and NO `0 !TEXMAP FALLBACK` section exists, unwrap `0 !: `
 *   lines so textured-only surfaces still render instead of turning into missing chunks.
 */
function preprocessTexmapLines(
  lines: string[],
  px: number,
  py: number,
  pz: number,
  pm: Mat3,
  lookupTexture?: (texName: string) => TextureLookupResult | null | undefined,
): ProcessedLine[] {
  let hasTexmap = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.length >= 10 && l[0] === '0' && /!TEXMAP/i.test(l)) {
      hasTexmap = true;
      break;
    }
  }
  if (!hasTexmap) {
    const simple: ProcessedLine[] = new Array(lines.length);
    for (let i = 0; i < lines.length; i++) simple[i] = { text: lines[i], texmap: null };
    return simple;
  }

  const out: ProcessedLine[] = [];
  let inTexmap = false;
  let inFallback = false;
  let isNextMode = false;
  let activeProj: TexmapProjection | null = null;
  let texmapGeomLines: string[] = [];
  let fallbackLines: string[] = [];

  const flushTexmap = () => {
    if (activeProj && texmapGeomLines.length > 0) {
      for (const tl of texmapGeomLines) out.push({ text: tl, texmap: activeProj });
    } else if (inFallback && fallbackLines.length > 0) {
      for (const fl of fallbackLines) out.push({ text: fl, texmap: null });
    } else if (texmapGeomLines.length > 0) {
      for (const tl of texmapGeomLines) out.push({ text: tl, texmap: null });
    }
    inTexmap = false;
    inFallback = false;
    isNextMode = false;
    activeProj = null;
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
      isNextMode = /^0\s+!TEXMAP\s+NEXT\b/i.test(l);
      activeProj = parseTexmapHeader(l, px, py, pz, pm, lookupTexture);
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
        const unwrapped = mGeom ? mGeom[1].trim() : l[0] !== '0' ? l : null;
        if (unwrapped) {
          texmapGeomLines.push(unwrapped);
          if (isNextMode && /^[134]\s/.test(unwrapped)) {
            flushTexmap();
          }
        }
      }
    } else {
      out.push({ text: l, texmap: null });
    }
  }

  if (inTexmap) flushTexmap();
  return out;
}

/**
 * Recursively compiles an LDraw `.dat` entry into WebGL-ready Y-up triangle,
 * normal, edge, per-triangle color, and textured decal buffers.
 *
 * Supports:
 * - BrickLink Studio embedded PNG decals (`0 PE_TEX_PATH`, `0 PE_TEX_NEXT_SHEAR`, `0 PE_TEX_INFO`,
 *   both explicit per-vertex UV coordinates on type-3/4 lines and 16-float planar box projection)
 * - Official LDraw `0 !TEXMAP` (`PLANAR`, `CYLINDRICAL`, `SPHERICAL`) + `FALLBACK`
 * - Direct RGB colors (`0x2RRGGBB`) in `Int32Array` `triCols`
 * - Sibling-fair triangle & edge budgeting so dense prints never starve later subparts
 *   (minifigure arms `3818`/`3819`, hands `3820`, or head torus bevels `t04o6250`).
 */
const SMOOTH_CREASE_COS_DEFAULT = Math.cos((42 * Math.PI) / 180);

/**
 * Computes angle-weighted smooth per-vertex normals for a compiled LDraw mesh in place.
 * Smooths adjacent faces whose dihedral angle is within `creaseAngleDeg` (default 42°),
 * while strictly preserving crisp creases across LDraw type-2 hard edges and sharp corners.
 */
export function smoothMeshNormals(
  tris: Float32Array,
  norms: Float32Array,
  edges: Float32Array,
  creaseAngleDeg = 42,
): void {
  const triCount = (tris.length / 9) | 0;
  if (triCount < 2 || norms.length < tris.length) return;

  const cosCrease =
    creaseAngleDeg === 42
      ? SMOOTH_CREASE_COS_DEFAULT
      : Math.cos((creaseAngleDeg * Math.PI) / 180);

  const slotCount = triCount * 3;
  const triVids = new Int32Array(slotCount);
  const cornerAngles = new Float32Array(slotCount);
  const faceNorms = new Float32Array(triCount * 3);

  const posMap = new Map<string, number>();
  const vertSlots: number[][] = [];

  for (let t = 0; t < triCount; t++) {
    const t9 = t * 9;
    const t3 = t * 3;
    faceNorms[t3] = norms[t9];
    faceNorms[t3 + 1] = norms[t9 + 1];
    faceNorms[t3 + 2] = norms[t9 + 2];

    const ax = tris[t9], ay = tris[t9 + 1], az = tris[t9 + 2];
    const bx = tris[t9 + 3], by = tris[t9 + 4], bz = tris[t9 + 5];
    const cx = tris[t9 + 6], cy = tris[t9 + 7], cz = tris[t9 + 8];

    const coords: [number, number, number][] = [
      [ax, ay, az],
      [bx, by, bz],
      [cx, cy, cz],
    ];
    for (let c = 0; c < 3; c++) {
      const [px, py, pz] = coords[c];
      const key = `${Math.round(px * 100) + 0},${Math.round(py * 100) + 0},${Math.round(pz * 100) + 0}`;
      let vid = posMap.get(key);
      if (vid === undefined) {
        vid = vertSlots.length;
        posMap.set(key, vid);
        vertSlots.push([]);
      }
      const slot = t3 + c;
      triVids[slot] = vid;
      vertSlots[vid].push(slot);
    }

    // Corner interior angles (eliminates triangulation-diagonal bias on quads)
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    const bcx = cx - bx, bcy = cy - by, bcz = cz - bz;
    const lab = Math.hypot(abx, aby, abz);
    const lac = Math.hypot(acx, acy, acz);
    const lbc = Math.hypot(bcx, bcy, bcz);
    if (lab > 1e-7 && lac > 1e-7 && lbc > 1e-7) {
      const d0 = Math.max(-1, Math.min(1, (abx * acx + aby * acy + abz * acz) / (lab * lac)));
      const d1 = Math.max(-1, Math.min(1, (-abx * bcx - aby * bcy - abz * bcz) / (lab * lbc)));
      const a0 = Math.max(1e-4, Math.acos(d0));
      const a1 = Math.max(1e-4, Math.acos(d1));
      const a2 = Math.max(1e-4, Math.PI - a0 - a1);
      cornerAngles[t3] = a0;
      cornerAngles[t3 + 1] = a1;
      cornerAngles[t3 + 2] = a2;
    } else {
      cornerAngles[t3] = 1;
      cornerAngles[t3 + 1] = 1;
      cornerAngles[t3 + 2] = 1;
    }
  }

  const uniqueVerts = vertSlots.length;
  const hasHardEdge = new Uint8Array(uniqueVerts);
  const hardEdgeSet = new Set<number>();
  const EDGE_STRIDE = 1048576;
  const useIntEdgeKey = uniqueVerts < EDGE_STRIDE;
  const hardEdgeStrSet = useIntEdgeKey ? null : new Set<string>();

  for (let i = 0; i + 5 < edges.length; i += 6) {
    const ka = `${Math.round(edges[i] * 100) + 0},${Math.round(edges[i + 1] * 100) + 0},${Math.round(edges[i + 2] * 100) + 0}`;
    const va = posMap.get(ka);
    if (va === undefined) continue;
    const kb = `${Math.round(edges[i + 3] * 100) + 0},${Math.round(edges[i + 4] * 100) + 0},${Math.round(edges[i + 5] * 100) + 0}`;
    const vb = posMap.get(kb);
    if (vb === undefined || va === vb) continue;
    hasHardEdge[va] = 1;
    hasHardEdge[vb] = 1;
    const lo = va < vb ? va : vb;
    const hi = va < vb ? vb : va;
    if (useIntEdgeKey) {
      hardEdgeSet.add(lo * EDGE_STRIDE + hi);
    } else {
      hardEdgeStrSet!.add(`${lo},${hi}`);
    }
  }

  const isHardEdge = (a: number, b: number): boolean => {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;
    return useIntEdgeKey
      ? hardEdgeSet.has(lo * EDGE_STRIDE + hi)
      : hardEdgeStrSet!.has(`${lo},${hi}`);
  };

  for (let vid = 0; vid < uniqueVerts; vid++) {
    const slots = vertSlots[vid];
    const deg = slots.length;
    if (deg <= 1) continue;

    if (!hasHardEdge[vid]) {
      for (let i = 0; i < deg; i++) {
        const si = slots[i];
        const ti3 = ((si / 3) | 0) * 3;
        const fnx = faceNorms[ti3], fny = faceNorms[ti3 + 1], fnz = faceNorms[ti3 + 2];
        let sx = 0, sy = 0, sz = 0;
        for (let j = 0; j < deg; j++) {
          const sj = slots[j];
          const tj3 = ((sj / 3) | 0) * 3;
          const jx = faceNorms[tj3], jy = faceNorms[tj3 + 1], jz = faceNorms[tj3 + 2];
          if (fnx * jx + fny * jy + fnz * jz >= cosCrease) {
            const w = cornerAngles[sj];
            sx += jx * w;
            sy += jy * w;
            sz += jz * w;
          }
        }
        const sl = Math.hypot(sx, sy, sz);
        if (sl > 1e-6) {
          const ni = si * 3;
          norms[ni] = sx / sl;
          norms[ni + 1] = sy / sl;
          norms[ni + 2] = sz / sl;
        }
      }
      continue;
    }

    // Vertex touches at least one LDraw type-2 hard edge: partition incident faces into
    // smooth connected components that never cross a hard edge or exceed the crease angle.
    const visited = new Uint8Array(deg);
    const comp: number[] = [];
    for (let i = 0; i < deg; i++) {
      if (visited[i]) continue;
      visited[i] = 1;
      comp.length = 0;
      comp.push(i);
      let head = 0;
      while (head < comp.length) {
        const curIdx = comp[head++];
        const sCur = slots[curIdx];
        const tCur = (sCur / 3) | 0;
        const cCur = sCur - tCur * 3;
        const tCur3 = tCur * 3;
        const oa1 = triVids[tCur3 + ((cCur + 1) % 3)];
        const oa2 = triVids[tCur3 + ((cCur + 2) % 3)];
        const fnx = faceNorms[tCur3], fny = faceNorms[tCur3 + 1], fnz = faceNorms[tCur3 + 2];

        for (let j = 0; j < deg; j++) {
          if (visited[j]) continue;
          const sNext = slots[j];
          const tNext = (sNext / 3) | 0;
          const tNext3 = tNext * 3;
          const jx = faceNorms[tNext3], jy = faceNorms[tNext3 + 1], jz = faceNorms[tNext3 + 2];
          if (fnx * jx + fny * jy + fnz * jz < cosCrease) continue;

          const cNext = sNext - tNext * 3;
          const ob1 = triVids[tNext3 + ((cNext + 1) % 3)];
          const ob2 = triVids[tNext3 + ((cNext + 2) % 3)];

          let sharedOther = -1;
          if (oa1 === ob1 || oa1 === ob2) sharedOther = oa1;
          else if (oa2 === ob1 || oa2 === ob2) sharedOther = oa2;
          if (sharedOther < 0 || sharedOther === vid) continue;
          if (isHardEdge(vid, sharedOther)) continue;

          visited[j] = 1;
          comp.push(j);
        }
      }

      if (comp.length <= 1) continue;
      let sx = 0, sy = 0, sz = 0;
      for (let k = 0; k < comp.length; k++) {
        const sk = slots[comp[k]];
        const tk3 = ((sk / 3) | 0) * 3;
        const w = cornerAngles[sk];
        sx += faceNorms[tk3] * w;
        sy += faceNorms[tk3 + 1] * w;
        sz += faceNorms[tk3 + 2] * w;
      }
      const sl = Math.hypot(sx, sy, sz);
      if (sl > 1e-6) {
        const nx = sx / sl, ny = sy / sl, nz = sz / sl;
        for (let k = 0; k < comp.length; k++) {
          const ni = slots[comp[k]] * 3;
          norms[ni] = nx;
          norms[ni + 1] = ny;
          norms[ni + 2] = nz;
        }
      }
    }
  }
}

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
  const lookupTexture = options.lookupTexture;

  const tris: number[] = [];
  const norms: number[] = [];
  const edges: number[] = [];
  const triCols: number[] = [];
  let hasSubColor = false;
  let totalTriFloats = 0;

  const texBatchMap = new Map<string, TexBatchBuilder>();
  const getTexBatch = (texKey: string, base64Png?: string): TexBatchBuilder => {
    let b = texBatchMap.get(texKey);
    if (!b) {
      b = { texKey, base64Png, tris: [], norms: [], uvs: [], triCols: [], hasSubColor: false };
      texBatchMap.set(texKey, b);
    } else if (base64Png && !b.base64Png) {
      b.base64Png = base64Png;
    }
    return b;
  };

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  const undersideBoxes: LocalBox6[] = [];

  const upd = (p: Vec3) => {
    if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
    if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
    if (p[2] < minZ) minZ = p[2]; if (p[2] > maxZ) maxZ = p[2];
  };

  const ld2gl = (pt: Vec3): Vec3 => [pt[0], -pt[1], -pt[2]];

  const emitTri = (
    la: Vec3,
    lb: Vec3,
    lc: Vec3,
    colId = 16,
    texInfo?: { texKey: string; base64Png?: string; uva: Vec2; uvb: Vec2; uvc: Vec2 } | null,
  ) => {
    const a = ld2gl(la), b = ld2gl(lb), c = ld2gl(lc);
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz);
    if (nl < 1e-9 || !Number.isFinite(nl)) return;
    nx /= nl; ny /= nl; nz /= nl;

    if (texInfo) {
      const batch = getTexBatch(texInfo.texKey, texInfo.base64Png);
      batch.tris.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      batch.norms.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      batch.uvs.push(
        texInfo.uva[0], texInfo.uva[1],
        texInfo.uvb[0], texInfo.uvb[1],
        texInfo.uvc[0], texInfo.uvc[1],
      );
      batch.triCols.push(colId);
      if (colId !== 16) batch.hasSubColor = true;
    } else {
      tris.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      norms.push(nx, ny, nz, nx, ny, nz, nx, ny, nz);
      triCols.push(colId);
      if (colId !== 16) hasSubColor = true;
    }
    totalTriFloats += 9;
    upd(a); upd(b); upd(c);
  };

  const triCross = (a: Vec3, b: Vec3, c: Vec3): Vec3 => cross3(sub3(b, a), sub3(c, a));

  // Safe quad triangulation: handles convex, concave, and bowtie quads without folding or notches
  // while preserving exact per-vertex UVs across whichever diagonal is chosen.
  const emitQuad = (
    pa: Vec3,
    pb: Vec3,
    pc: Vec3,
    pd: Vec3,
    colId = 16,
    quadTex?: { texKey: string; base64Png?: string; uva: Vec2; uvb: Vec2; uvc: Vec2; uvd: Vec2 } | null,
  ) => {
    const mk = (u1: Vec2, u2: Vec2, u3: Vec2) =>
      quadTex ? { texKey: quadTex.texKey, base64Png: quadTex.base64Png, uva: u1, uvb: u2, uvc: u3 } : null;
    const ua = quadTex?.uva ?? ([0, 0] as Vec2);
    const ub = quadTex?.uvb ?? ([0, 0] as Vec2);
    const uc = quadTex?.uvc ?? ([0, 0] as Vec2);
    const ud = quadTex?.uvd ?? ([0, 0] as Vec2);

    const n1 = triCross(pa, pb, pc);
    const n2 = triCross(pa, pc, pd);
    if (dot3(n1, n2) >= 0) {
      emitTri(pa, pb, pc, colId, mk(ua, ub, uc));
      emitTri(pa, pc, pd, colId, mk(ua, uc, ud));
      return;
    }
    const m1 = triCross(pa, pb, pd);
    const m2 = triCross(pb, pc, pd);
    if (dot3(m1, m2) >= 0) {
      emitTri(pa, pb, pd, colId, mk(ua, ub, ud));
      emitTri(pb, pc, pd, colId, mk(ub, uc, ud));
      return;
    }
    const b1 = triCross(pa, pc, pb);
    const b2 = triCross(pa, pb, pd);
    if (dot3(b1, b2) >= 0) {
      emitTri(pa, pc, pb, colId, mk(ua, uc, ub));
      emitTri(pa, pb, pd, colId, mk(ua, ub, ud));
    } else {
      emitTri(pa, pb, pd, colId, mk(ua, ub, ud));
      emitTri(pa, pd, pc, colId, mk(ua, ud, uc));
    }
  };

  const emitEdge = (la: Vec3, lb: Vec3) => {
    const a = ld2gl(la), b = ld2gl(lb);
    edges.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    upd(a); upd(b);
  };

  const emitTriWithActiveTex = (
    la: Vec3,
    lb: Vec3,
    lc: Vec3,
    colId: number,
    explicitTex: PeTexInfo | null,
    explicitUvs: [Vec2, Vec2, Vec2] | null,
    activeTexmap: TexmapProjection | null,
    projPeList: PeTexInfo[],
  ) => {
    if (explicitTex && explicitUvs) {
      emitTri(la, lb, lc, colId, {
        texKey: explicitTex.texKey,
        base64Png: explicitTex.base64Png,
        uva: explicitUvs[0],
        uvb: explicitUvs[1],
        uvc: explicitUvs[2],
      });
      return;
    }
    if (activeTexmap) {
      emitTri(la, lb, lc, colId, {
        texKey: activeTexmap.texKey,
        base64Png: activeTexmap.base64Png,
        uva: projectPointWithTexmap(la, activeTexmap),
        uvb: projectPointWithTexmap(lb, activeTexmap),
        uvc: projectPointWithTexmap(lc, activeTexmap),
      });
      return;
    }
    if (projPeList.length > 0) {
      for (let i = projPeList.length - 1; i >= 0; i--) {
        const pi = projPeList[i];
        if (!pi.proj) continue;
        const uvs = projectTriWithPeTex(la, lb, lc, pi.proj);
        if (uvs) {
          emitTri(la, lb, lc, colId, {
            texKey: pi.texKey,
            base64Png: pi.base64Png,
            uva: uvs[0],
            uvb: uvs[1],
            uvc: uvs[2],
          });
          return;
        }
      }
    }
    emitTri(la, lb, lc, colId);
  };

  // Circular cylinder stud (flush seated, with top rim & inner wall for hollow stud2/stud2a).
  // Defaults to 24 segments so studs render smoothly circular even zoomed in on mobile,
  // stepping down gracefully only on huge baseplates (>128 studs) to stay within mesh budgets.
  const emitFastStud = (
    px: number, py: number, pz: number, pm: Mat3, hollow: boolean, colId: number, edgeLimit: number, segs = 24,
  ) => {
    const r = 6, rIn = 4;
    const tp = (x: number, y: number, z: number): Vec3 => {
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
    activeTexmap: TexmapProjection | null,
    projPeList: PeTexInfo[],
  ): boolean => {
    const tp = (x: number, y: number, z: number): Vec3 => {
      const v = mat3Vec(pm, x, y, z);
      return [px + v[0], py + v[1], pz + v[2]];
    };
    const emitT = (a: Vec3, b: Vec3, c: Vec3) =>
      emitTriWithActiveTex(a, b, c, colId, null, null, activeTexmap, projPeList);

    if (base === 'rect' || base === 'rect2p') {
      const p0 = tp(-1, 0, -1), p1 = tp(1, 0, -1), p2 = tp(1, 0, 1), p3 = tp(-1, 0, 1);
      emitT(p0, p1, p2);
      emitT(p0, p2, p3);
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
        emitT(t0, t1, b1);
        emitT(t0, b1, b0);
        if (topC && botC) {
          emitT(topC, t0, t1);
          emitT(botC, b1, b0);
        }
      }
      return true;
    }
    if (kind === 'disc') {
      const c = tp(0, 0, 0);
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        emitT(c, tp(Math.cos(a0), 0, Math.sin(a0)), tp(Math.cos(a1), 0, Math.sin(a1)));
      }
      return true;
    }
    if (kind === 'ndis') {
      for (let i = 0; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        const aMid = (a0 + a1) * 0.5;
        const cx = Math.cos(aMid) >= 0 ? 1 : -1;
        const cz = Math.sin(aMid) >= 0 ? 1 : -1;
        emitT(
          tp(Math.cos(a1), 0, Math.sin(a1)),
          tp(Math.cos(a0), 0, Math.sin(a0)),
          tp(cx, 0, cz),
        );
      }
      return true;
    }
    if (kind === 'chrd') {
      const pStart = tp(1, 0, 0);
      for (let i = 1; i < segs; i++) {
        const a0 = (i / segs) * maxA, a1 = ((i + 1) / segs) * maxA;
        emitT(pStart, tp(Math.cos(a0), 0, Math.sin(a0)), tp(Math.cos(a1), 0, Math.sin(a1)));
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
        emitT(i0, o0, o1);
        emitT(i0, o1, i1);
      }
      return true;
    }
    return false;
  };

  // Procedural fallback for standard LDraw primitives (torus t04o6250/t08o6250/t16o6250,
  // cones conN, cylinder variants cyli2/cylh/ccyli, boxes box/box5/box4/box2-9p,
  // and Technic cross-axle primitives axlehol8/axlehol2/axlehol9/axleend) when missing from library
  const emitFallbackPrim = (
    base: string,
    circleRes: 8 | 16 | 48,
    px: number, py: number, pz: number, pm: Mat3, colId: number, edgeLimit: number,
    activeTexmap: TexmapProjection | null,
    projPeList: PeTexInfo[],
  ): boolean => {
    const tp = (x: number, y: number, z: number): Vec3 => {
      const v = mat3Vec(pm, x, y, z);
      return [px + v[0], py + v[1], pz + v[2]];
    };
    const emitT = (a: Vec3, b: Vec3, c: Vec3) =>
      emitTriWithActiveTex(a, b, c, colId, null, null, activeTexmap, projPeList);

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
      const torusPt = (a: number, phi: number): Vec3 => {
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
          emitT(v00, v10, v11);
          emitT(v00, v11, v01);
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
          emitT(apex, b1, b0);
        } else {
          const t0 = tp(Math.cos(a0) * rTop, 1, Math.sin(a0) * rTop);
          const t1 = tp(Math.cos(a1) * rTop, 1, Math.sin(a1) * rTop);
          emitT(t0, t1, b1);
          emitT(t0, b1, b0);
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
        emitT(t0, t1, b1);
        emitT(t0, b1, b0);
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
      const emitQ = (q0: Vec3, q1: Vec3, q2: Vec3, q3: Vec3) => {
        emitT(q0, q1, q2);
        emitT(q0, q2, q3);
      };
      emitQ(p011, p001, p101, p111);
      emitQ(p010, p000, p001, p011);
      emitQ(p110, p100, p000, p010);
      emitQ(p111, p101, p100, p110);
      if (base === 'box5' || base === 'box') emitQ(p011, p111, p110, p010);
      if (base === 'box') emitQ(p000, p100, p101, p001);
      return true;
    }

    if (base === 'box2-9p') {
      const p111 = tp(1, 1, 1), p11n = tp(1, 1, -1), pn1n = tp(-1, 1, -1), pn11 = tp(-1, 1, 1);
      const pnn1 = tp(-1, -1, 1), p1n1 = tp(1, -1, 1);
      emitQuad(p111, p11n, pn1n, pn11, colId);
      emitQuad(p111, pn11, pnn1, p1n1, colId);
      if (edges.length < edgeLimit) {
        emitEdge(p111, pn11);
        emitEdge(p1n1, pnn1);
        emitEdge(p11n, pn1n);
      }
      return true;
    }

    if (base === 'axlehol8') {
      const n = AXLE_PROFILE.length;
      for (let i = 0; i < n; i++) {
        const [x0, z0] = AXLE_PROFILE[i];
        const [x1, z1] = AXLE_PROFILE[(i + 1) % n];
        const b0 = tp(x0, 0, z0), b1 = tp(x1, 0, z1);
        const t0 = tp(x0, 1, z0), t1 = tp(x1, 1, z1);
        emitQuad(b0, b1, t1, t0, colId);
        if (i % 4 !== 0 && edges.length < edgeLimit) {
          emitEdge(b0, t0);
        }
      }
      return true;
    }

    if (base === 'axlehol2' || base === 'axlehol9') {
      if (edges.length < edgeLimit) {
        const n = AXLE_PROFILE.length;
        for (let i = 0; i < n; i++) {
          const isOuter = i % 4 === 0 || i % 4 === 3;
          if ((base === 'axlehol2' && isOuter) || (base === 'axlehol9' && !isOuter)) {
            const [x0, z0] = AXLE_PROFILE[i];
            const [x1, z1] = AXLE_PROFILE[(i + 1) % n];
            emitEdge(tp(x0, 0, z0), tp(x1, 0, z1));
          }
        }
      }
      return true;
    }

    if (base === 'axleend') {
      const center = tp(0, 0, 0);
      const n = AXLE_PROFILE.length;
      for (let k = 0; k < n; k += 2) {
        const [x0, z0] = AXLE_PROFILE[k];
        const [x1, z1] = AXLE_PROFILE[k + 1];
        const [x2, z2] = AXLE_PROFILE[(k + 2) % n];
        emitQuad(center, tp(x0, 0, z0), tp(x1, 0, z1), tp(x2, 0, z2), colId);
      }
      return true;
    }

    return false;
  };

  const resolveLineCol = (rawColStr: string, curColor: number): number => {
    if (/^0[xX]2[0-9a-fA-F]{6}$/.test(rawColStr)) {
      const rgb = parseInt(rawColStr.slice(3), 16);
      if (Number.isFinite(rgb)) return DIRECT_RGB_COLOR_FLAG | (rgb & 0xffffff);
    }
    const c = parseInt(rawColStr, 10);
    // BrickLink Studio model2.ldr encodes LDraw color 16 (inherit/main) as -1 and color 24 (edge) as -2.
    // Negative color IDs must always inherit `curColor` instead of leaking into `triCols`.
    return Number.isFinite(c) && c >= 0 && c !== 16 && c !== 24 ? c : curColor;
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
    inheritedTexmap: TexmapProjection | null,
    inheritedPeTex: PeTexPathEntry[],
  ) => {
    if (depth > maxDepth || totalTriFloats >= triLimit) return;
    const lines = preprocessTexmapLines(rawLines, px, py, pz, pm, lookupTexture);

    // Resolve incoming PE_TEX_PATH entries targeted at this file vs its subfile children
    let activeExplicitPeTex: PeTexInfo | null = null;
    const activeProjPeTex: PeTexInfo[] = [];
    const peBySubIdx = new Map<number, PeTexPathEntry[]>();
    const addSubPe = (idx: number, entry: PeTexPathEntry) => {
      let arr = peBySubIdx.get(idx);
      if (!arr) { arr = []; peBySubIdx.set(idx, arr); }
      arr.push(entry);
    };

    for (const entry of inheritedPeTex) {
      if (entry.path.length === 0 || (entry.path.length === 1 && entry.path[0] === -1)) {
        if (!entry.info.proj) activeExplicitPeTex = entry.info;
        else activeProjPeTex.push(entry.info);
      } else if (entry.path[0] >= 0) {
        addSubPe(entry.path[0], { path: entry.path.slice(1), info: entry.info });
      }
    }

    // Count recursive type-1 subfile references in this file so direct print decals
    // or early subparts can never starve later siblings (e.g. torso sides, arms, hands, head toruses).
    let heavySubCount = 0;
    let lightSubCount = 0;
    let fastStudCount = 0;
    for (const item of lines) {
      const raw = item.text;
      if (!isLineKind(raw, '1')) continue;
      const t = raw.split(/\s+/);
      if (t.length < 15) continue;
      const ref = normalizeDatRef(t.slice(14).join(' '));
      const base = ref.split('/').pop() || '';
      if (isFastStudBase(base)) { fastStudCount++; continue; }
      if (SKIPPED_UNDERSIDE_RE.test(base) || canSynthesizePrim(base)) continue;
      if (isLightweightPrimitiveBase(base)) lightSubCount++;
      else heavySubCount++;
    }
    const studSegs = fastStudCount > 384 ? 12 : fastStudCount > 128 ? 16 : 24;

    const totalSubCount = heavySubCount + lightSubCount;
    const availTriStart = Math.max(0, triLimit - totalTriFloats);
    const neededReserve = heavySubCount * subTriReserve + lightSubCount * 1800; // 200 tris per torus/cone/box
    const directTriReserve =
      totalSubCount > 0 ? Math.min(neededReserve, Math.floor(availTriStart * 0.4)) : 0;
    const directTriLimit = Math.max(totalTriFloats, triLimit - directTriReserve);

    const availEdgeStart = Math.max(0, edgeLimit - edges.length);
    const directEdgeReserve =
      heavySubCount > 0 ? Math.min(heavySubCount * subEdgeReserve, Math.floor(availEdgeStart * 0.4)) : 0;
    const directEdgeLimit = Math.max(edges.length, edgeLimit - directEdgeReserve);

    let pendingPePath: number[] | null = null;
    let pendingNextShear = false;
    let subfileLineIndex = 0;
    let subIdx = 0;

    for (const item of lines) {
      const raw = item.text;
      const lineTexmap = item.texmap ?? inheritedTexmap;

      // BrickLink Studio PE_TEX_* meta commands (embedded base64 PNG decals!)
      if (raw[0] === '0') {
        if (raw.includes('PE_TEX_')) {
          const mPath = raw.match(/^0\s+PE_TEX_PATH\s+(.+)$/i);
          if (mPath) {
            const idxs = mPath[1]
              .trim()
              .split(/\s+/)
              .map((s) => parseInt(s, 10))
              .filter((n) => Number.isFinite(n));
            if (idxs.length > 0) {
              pendingPePath = idxs;
              pendingNextShear = false;
            }
            continue;
          }
          if (/^0\s+PE_TEX_NEXT_SHEAR\b/i.test(raw)) {
            pendingNextShear = true;
            continue;
          }
          if (/^0\s+PE_TEX_INFO\s+/i.test(raw)) {
            const parsedInfo = parsePeTexInfoLine(raw, pendingNextShear, px, py, pz, pm);
            pendingNextShear = false;
            if (parsedInfo) {
              if (!pendingPePath || pendingPePath.length === 0 || (pendingPePath.length === 1 && pendingPePath[0] === -1)) {
                if (!parsedInfo.proj) activeExplicitPeTex = parsedInfo;
                else activeProjPeTex.push(parsedInfo);
              } else if (pendingPePath[0] >= 0) {
                addSubPe(pendingPePath[0], { path: pendingPePath.slice(1), info: parsedInfo });
              }
            }
            continue;
          }
        }
        continue;
      }

      if (isLineKind(raw, '3')) {
        pendingPePath = null;
        pendingNextShear = false;
        if (totalTriFloats >= directTriLimit) continue;
        const t = raw.split(/\s+/);
        if (t.length >= 11) {
          const colId = resolveLineCol(t[1], curColor);
          const a = mat3Vec(pm, +t[2], +t[3], +t[4]);
          const b = mat3Vec(pm, +t[5], +t[6], +t[7]);
          const c = mat3Vec(pm, +t[8], +t[9], +t[10]);
          const pa: Vec3 = [px + a[0], py + a[1], pz + a[2]];
          const pb: Vec3 = [px + b[0], py + b[1], pz + b[2]];
          const pc: Vec3 = [px + c[0], py + c[1], pz + c[2]];

          let explicitUvs: [Vec2, Vec2, Vec2] | null = null;
          if (activeExplicitPeTex && t.length >= 17) {
            const u0 = +t[11], v0 = +t[12], u1 = +t[13], v1 = +t[14], u2 = +t[15], v2 = +t[16];
            if ([u0, v0, u1, v1, u2, v2].every(Number.isFinite)) {
              explicitUvs = [[u0, v0], [u1, v1], [u2, v2]];
            }
          }
          emitTriWithActiveTex(
            pa, pb, pc, colId,
            activeExplicitPeTex, explicitUvs,
            lineTexmap, activeProjPeTex,
          );
        }
      } else if (isLineKind(raw, '4')) {
        pendingPePath = null;
        pendingNextShear = false;
        if (totalTriFloats >= directTriLimit) continue;
        const t = raw.split(/\s+/);
        if (t.length >= 14) {
          const colId = resolveLineCol(t[1], curColor);
          const a = mat3Vec(pm, +t[2], +t[3], +t[4]);
          const b = mat3Vec(pm, +t[5], +t[6], +t[7]);
          const c = mat3Vec(pm, +t[8], +t[9], +t[10]);
          const d = mat3Vec(pm, +t[11], +t[12], +t[13]);
          const pa: Vec3 = [px + a[0], py + a[1], pz + a[2]];
          const pb: Vec3 = [px + b[0], py + b[1], pz + b[2]];
          const pc: Vec3 = [px + c[0], py + c[1], pz + c[2]];
          const pd: Vec3 = [px + d[0], py + d[1], pz + d[2]];

          if (activeExplicitPeTex && t.length >= 22) {
            const u0 = +t[14], v0 = +t[15], u1 = +t[16], v1 = +t[17];
            const u2 = +t[18], v2 = +t[19], u3 = +t[20], v3 = +t[21];
            if ([u0, v0, u1, v1, u2, v2, u3, v3].every(Number.isFinite)) {
              emitQuad(pa, pb, pc, pd, colId, {
                texKey: activeExplicitPeTex.texKey,
                base64Png: activeExplicitPeTex.base64Png,
                uva: [u0, v0],
                uvb: [u1, v1],
                uvc: [u2, v2],
                uvd: [u3, v3],
              });
              continue;
            }
          }
          if (lineTexmap) {
            emitQuad(pa, pb, pc, pd, colId, {
              texKey: lineTexmap.texKey,
              base64Png: lineTexmap.base64Png,
              uva: projectPointWithTexmap(pa, lineTexmap),
              uvb: projectPointWithTexmap(pb, lineTexmap),
              uvc: projectPointWithTexmap(pc, lineTexmap),
              uvd: projectPointWithTexmap(pd, lineTexmap),
            });
            continue;
          }
          if (activeProjPeTex.length > 0) {
            // Project triangles individually via emitTriWithActiveTex using safe quad split
            const n1 = triCross(pa, pb, pc);
            const n2 = triCross(pa, pc, pd);
            if (dot3(n1, n2) >= 0) {
              emitTriWithActiveTex(pa, pb, pc, colId, null, null, null, activeProjPeTex);
              emitTriWithActiveTex(pa, pc, pd, colId, null, null, null, activeProjPeTex);
            } else {
              emitTriWithActiveTex(pa, pb, pd, colId, null, null, null, activeProjPeTex);
              emitTriWithActiveTex(pb, pc, pd, colId, null, null, null, activeProjPeTex);
            }
            continue;
          }
          emitQuad(pa, pb, pc, pd, colId);
        }
      } else if (isLineKind(raw, '2')) {
        pendingPePath = null;
        pendingNextShear = false;
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
        pendingPePath = null;
        pendingNextShear = false;
        const t = raw.split(/\s+/);
        if (t.length < 15) continue;
        const curSubLineIdx = subfileLineIndex++;

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

        // Gather PE_TEX entries applicable to this child subfile
        const childPeTex: PeTexPathEntry[] = [];
        if (activeExplicitPeTex) {
          childPeTex.push({ path: [-1], info: activeExplicitPeTex });
        }
        const targeted = peBySubIdx.get(curSubLineIdx);
        if (targeted) {
          for (const te of targeted) childPeTex.push(te);
        }
        const childProjForPrim = childPeTex
          .filter((e) => (e.path.length === 0 || (e.path.length === 1 && e.path[0] === -1)) && e.info.proj)
          .map((e) => e.info);
        const primProjList = activeProjPeTex.length > 0 || childProjForPrim.length > 0
          ? [...activeProjPeTex, ...childProjForPrim]
          : [];

        // Fast studs & skip hidden underside tubes/recesses!
        if (isFastStudBase(base)) {
          if (totalTriFloats < triLimit) {
            emitFastStud(nx, ny, nz, nm, base.startsWith('stud2'), childCol, edgeLimit, studSegs);
          }
          continue;
        }
        if (SKIPPED_UNDERSIDE_RE.test(base)) {
          // Preserve anti-stud tube occupancy for physical clutch detection without emitting render triangles
          const r = base.startsWith('stud4') ? 8.14 : 3.2;
          let uMinX = Infinity, uMinY = Infinity, uMinZ = Infinity;
          let uMaxX = -Infinity, uMaxY = -Infinity, uMaxZ = -Infinity;
          for (const lx of [-r, r]) {
            for (const ly of [0, 1]) {
              for (const lz of [-r, r]) {
                const v = mat3Vec(nm, lx, ly, lz);
                const g = ld2gl([nx + v[0], ny + v[1], nz + v[2]]);
                if (g[0] < uMinX) uMinX = g[0]; if (g[0] > uMaxX) uMaxX = g[0];
                if (g[1] < uMinY) uMinY = g[1]; if (g[1] > uMaxY) uMaxY = g[1];
                if (g[2] < uMinZ) uMinZ = g[2]; if (g[2] > uMaxZ) uMaxZ = g[2];
              }
            }
          }
          undersideBoxes.push([uMinX, uMinY, uMinZ, uMaxX, uMaxY, uMaxZ]);
          continue;
        }

        // Synthesize standard circular/rect primitives at exact LDraw circle resolution
        if (canSynthesizePrim(base)) {
          if (totalTriFloats < triLimit) {
            emitSynthPrim(base, circleRes, nx, ny, nz, nm, childCol, edgeLimit, lineTexmap, primProjList);
          }
          continue;
        }

        const remainingSiblings = Math.max(0, totalSubCount - 1 - subIdx);
        subIdx++;
        const availTriNow = Math.max(0, triLimit - totalTriFloats);
        const reserveTriForRest =
          remainingSiblings > 0
            ? Math.min(
                remainingSiblings * subTriReserve,
                Math.floor(availTriNow * (remainingSiblings / (remainingSiblings + 1))),
              )
            : 0;
        const childTriLimit = Math.max(totalTriFloats, triLimit - reserveTriForRest);

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
          walk(
            sub.lines,
            nx, ny, nz, nm,
            depth + 1,
            childCol,
            childTriLimit,
            childEdgeLimit,
            lineTexmap,
            childPeTex,
          );
        } else if (totalTriFloats < childTriLimit) {
          // Procedural fallback for missing torus bevels (t04o6250, t08o6250, t16o6250), cones, boxes, axles
          emitFallbackPrim(base, circleRes, nx, ny, nz, nm, childCol, childEdgeLimit, lineTexmap, primProjList);
        }
      }
    }
  };

  const [rootOx, rootOy, rootOz] = found.offset || [0, 0, 0];
  walk(found.lines, rootOx, rootOy, rootOz, R_IDENTITY, 0, 16, maxTriFloats, maxEdgeFloats, null, []);

  if (totalTriFloats === 0) return null;

  const texBatches: CompiledTexBatch[] = [];
  for (const b of texBatchMap.values()) {
    if (b.tris.length === 0) continue;
    texBatches.push({
      texKey: b.texKey,
      base64Png: b.base64Png,
      tris: new Float32Array(b.tris),
      norms: new Float32Array(b.norms),
      uvs: new Float32Array(b.uvs),
      triCols: b.hasSubColor ? new Int32Array(b.triCols) : null,
    });
  }

  const trisArr = new Float32Array(tris);
  const normsArr = new Float32Array(norms);
  const edgesArr = new Float32Array(edges);
  smoothMeshNormals(trisArr, normsArr, edgesArr);
  for (const tb of texBatches) {
    smoothMeshNormals(tb.tris, tb.norms, edgesArr);
  }
  const subBoxes = buildLocalSubBoxes(
    trisArr,
    [minX, minY, minZ],
    [maxX, maxY, maxZ],
    undersideBoxes.length > 0 ? undersideBoxes : undefined,
    texBatches.length > 0 ? texBatches : undefined,
  );

  return {
    tris: trisArr,
    norms: normsArr,
    edges: edgesArr,
    triCols: hasSubColor ? new Int32Array(triCols) : null,
    ...(texBatches.length > 0 ? { texBatches } : {}),
    ...(subBoxes ? { subBoxes } : {}),
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}
