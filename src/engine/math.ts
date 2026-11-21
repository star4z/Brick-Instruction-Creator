import type { Mat3, Vec3 } from '../types/manual';

export const IDENTITY_MAT3: Mat3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function vec3Scale(a: Vec3, s: number): Vec3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function vec3Len(a: Vec3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

export function vec3Dist(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function vec3Normalize(a: Vec3): Vec3 {
  const len = vec3Len(a);
  if (len < 1e-8) return [0, 1, 0];
  return [a[0] / len, a[1] / len, a[2] / len];
}

export function mat3MulVec(m: Mat3, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

export function mat3Mul(a: Mat3, b: Mat3): Mat3 {
  return [
    a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
    a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
    a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
    a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
    a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
    a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
    a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
    a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
    a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
  ];
}

export function mat3Transpose(m: Mat3): Mat3 {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

export function mat3Det(m: Mat3): number {
  return (
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6])
  );
}

/**
 * Convert LDraw right-handed Y-down coordinate/rotation to internal right-handed Y-up.
 * Uses S = diag(1, -1, -1), det(S) = +1, S = S^-1.
 */
export function ldrawPosToYUp(pos: Vec3): Vec3 {
  return [pos[0], -pos[1], -pos[2]];
}

export function ldrawMatToYUp(m: Mat3): Mat3 {
  // S * M * S where S = diag(1, -1, -1)
  return [
    m[0], -m[1], -m[2],
    -m[3], m[4], m[5],
    -m[6], m[7], m[8],
  ];
}

export function mat3FromAxisAngle(axis: Vec3, angleRad: number): Mat3 {
  const [x, y, z] = vec3Normalize(axis);
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  const t = 1 - c;
  return [
    t * x * x + c, t * x * y - s * z, t * x * z + s * y,
    t * x * y + s * z, t * y * y + c, t * y * z - s * x,
    t * x * z - s * y, t * y * z + s * x, t * z * z + c,
  ];
}

/**
 * Computes a rotation matrix that aligns `fromNormal` with `toNormal` (snapped to clean axes if close).
 */
export function mat3AlignVectors(fromNormal: Vec3, toNormal: Vec3): Mat3 {
  const f = vec3Normalize(fromNormal);
  const t = vec3Normalize(toNormal);
  const dot = vec3Dot(f, t);
  if (dot > 0.999) return [...IDENTITY_MAT3];
  if (dot < -0.999) {
    // 180 deg flip around X (or Z if parallel to X)
    const axis: Vec3 = Math.abs(f[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
    return mat3FromAxisAngle(axis, Math.PI);
  }
  const axis = vec3Normalize(vec3Cross(f, t));
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
  return mat3FromAxisAngle(axis, angle);
}

export function quantize(val: number, step = 1): number {
  return Math.round(val / step) * step;
}

export function transformPoint(pos: Vec3, rot: Mat3, local: Vec3): Vec3 {
  return vec3Add(pos, mat3MulVec(rot, local));
}

export function transformNormal(rot: Mat3, localNormal: Vec3): Vec3 {
  return vec3Normalize(mat3MulVec(rot, localNormal));
}
