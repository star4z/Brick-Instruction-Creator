// Photorealistic Multi-Pass WebGL Studio Renderer for LEGO Instruction Covers
// Pure WebGL 1.0 (zero external dependencies, zero float-texture requirements):
//   1. Telephoto studio perspective camera with tight camera-space framing
//   2. 3x 24-bit RGBA-packed Softbox Shadow Maps (Key, Fill, Overhead Dome)
//   3. Linear-space PBR LEGO ABS Plastic (GGX Cook-Torrance + Schlick Fresnel + Procedural Softbox Studio Env + ACES Filmic)
//   4. 3D Shadow-Catcher Studio Floor Plane with multi-light penumbra + tight contact shadow
//   5. Screen-Space Ambient Occlusion (SSAO) + depth-aware bilateral smooth composite

import { computeCameraBasis } from './coverLayout';

export interface StudioTexDraw {
  texKey: string;
  triPos: Float32Array;
  triNorm: Float32Array;
  triUv: Float32Array;
  triCol: Uint8Array;
  fadeMix?: number;
}

export interface StudioMeshData {
  triPos: Float32Array;
  triNorm: Float32Array;
  triCol: Uint8Array;
  opaqueCount: number;
  transCount: number;
  texDraws?: StudioTexDraw[];
  linePos: Float32Array;
  lineCol: Uint8Array;
  center: [number, number, number];
  radius: number;
  fullRadius: number;
  bounds: {
    minX: number;
    minY: number;
    minZ: number;
    maxX: number;
    maxY: number;
    maxZ: number;
  };
}

export interface StudioCameraResult {
  view: Float32Array;
  proj: Float32Array;
  mvp: Float32Array;
  eye: [number, number, number];
  target: [number, number, number];
  near: number;
  far: number;
  fovYDeg: number;
}

export interface StudioRenderOptions {
  azDeg: number;
  elDeg: number;
  width: number;
  height: number;
  zoom?: number;
  darkBackground?: boolean;
  fovYDeg?: number;
  getTextureImage?: (texKey: string) => TexImageSource | null;
}

// =========================================================================
// Matrix & Camera Math (Pure, Unit-Testable)
// =========================================================================

function lookAtMat4(
  eye: [number, number, number],
  target: [number, number, number],
  up: [number, number, number],
): Float32Array {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  const zl = Math.hypot(zx, zy, zz) || 1;
  zx /= zl;
  zy /= zl;
  zz /= zl;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  const xl = Math.hypot(xx, xy, xz) || 1;
  xx /= xl;
  xy /= xl;
  xz /= xl;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

function orthoMat4(l: number, r: number, b: number, t: number, n: number, f: number): Float32Array {
  return new Float32Array([
    2 / (r - l), 0, 0, 0,
    0, 2 / (t - b), 0, 0,
    0, 0, -2 / (f - n), 0,
    -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1,
  ]);
}

function perspectiveMat4(fovYRad: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1 / Math.tan(fovYRad * 0.5);
  const invRange = 1 / (near - far);
  return new Float32Array([
    f / Math.max(0.05, aspect), 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * invRange, -1,
    0, 0, 2 * far * near * invRange, 0,
  ]);
}

function mulMat4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

/**
 * Computes a telephoto studio perspective camera (`fovYDeg ≈ 18°`, ~115mm product lens feel)
 * tightly fitted to the exact projected silhouette of the model so models of any aspect ratio
 * fill the cover frame cleanly while retaining authentic photographic depth.
 */
export function computeStudioTelephotoCamera(
  triPos: Float32Array,
  origin: [number, number, number],
  azDeg: number,
  elDeg: number,
  width: number,
  height: number,
  zoom = 1.0,
  fovYDeg = 18.5,
): StudioCameraResult {
  const { right, up, forward } = computeCameraBasis(azDeg, elDeg);
  const aspect = Math.max(0.15, width / Math.max(1, height));
  const fovRad = (fovYDeg * Math.PI) / 180;
  const tanHalfY = Math.tan(fovRad * 0.5);
  const tanHalfX = tanHalfY * aspect;
  const safeZoom = Math.max(0.45, Math.min(2.0, zoom));

  const [ox, oy, oz] = origin;
  let minRx = Infinity;
  let maxRx = -Infinity;
  let minUy = Infinity;
  let maxUy = -Infinity;
  let minFz = Infinity;
  let maxFz = -Infinity;

  const stride = Math.max(3, Math.floor(triPos.length / 24000) * 3);
  for (let i = 0; i < triPos.length; i += stride) {
    const dx = triPos[i] - ox;
    const dy = triPos[i + 1] - oy;
    const dz = triPos[i + 2] - oz;
    const rx = dx * right[0] + dy * right[1] + dz * right[2];
    const uy = dx * up[0] + dy * up[1] + dz * up[2];
    const fz = dx * forward[0] + dy * forward[1] + dz * forward[2];
    if (rx < minRx) minRx = rx;
    if (rx > maxRx) maxRx = rx;
    if (uy < minUy) minUy = uy;
    if (uy > maxUy) maxUy = uy;
    if (fz < minFz) minFz = fz;
    if (fz > maxFz) maxFz = fz;
  }

  if (!Number.isFinite(minRx)) {
    minRx = -20; maxRx = 20; minUy = -20; maxUy = 20; minFz = -20; maxFz = 20;
  }

  // Shift look-at target to projected visual center (with tiny downward bias to leave room for floor shadow)
  const midRx = (minRx + maxRx) * 0.5;
  const spanUy = Math.max(10, maxUy - minUy);
  const midUy = (minUy + maxUy) * 0.5 - spanUy * 0.032;
  const midFz = (minFz + maxFz) * 0.5;

  const target: [number, number, number] = [
    ox + right[0] * midRx + up[0] * midUy + forward[0] * midFz,
    oy + right[1] * midRx + up[1] * midUy + forward[1] * midFz,
    oz + right[2] * midRx + up[2] * midUy + forward[2] * midFz,
  ];

  // Solve exact camera distance along `forward` so EVERY projected vertex stays inside 93% of frame
  const fillMargin = 1.075 / safeZoom;
  let reqDist = 60;
  for (let i = 0; i < triPos.length; i += stride) {
    const dx = triPos[i] - target[0];
    const dy = triPos[i + 1] - target[1];
    const dz = triPos[i + 2] - target[2];
    const rx = Math.abs(dx * right[0] + dy * right[1] + dz * right[2]);
    const uy = Math.abs(dx * up[0] + dy * up[1] + dz * up[2]);
    const fz = dx * forward[0] + dy * forward[1] + dz * forward[2];
    const distForX = fz + (rx * fillMargin) / tanHalfX;
    const distForY = fz + (uy * fillMargin) / tanHalfY;
    if (distForX > reqDist) reqDist = distForX;
    if (distForY > reqDist) reqDist = distForY;
  }

  const halfDepth = Math.max(20, (maxFz - minFz) * 0.5);
  const dist = Math.max(reqDist, halfDepth * 2.2 + 24);
  const eye: [number, number, number] = [
    target[0] + forward[0] * dist,
    target[1] + forward[1] * dist,
    target[2] + forward[2] * dist,
  ];

  const depthPad = Math.max(halfDepth * 2.4, Math.hypot(maxRx - minRx, maxUy - minUy) * 1.15);
  const near = Math.max(2, dist - depthPad);
  const far = dist + depthPad * 1.5;

  const view = lookAtMat4(eye, target, [0, 1, 0]);
  const proj = perspectiveMat4(fovRad, aspect, near, far);
  const mvp = mulMat4(proj, view);

  return { view, proj, mvp, eye, target, near, far, fovYDeg };
}

/**
 * Computes an orthographic shadow-map light matrix tightly framing the model bounding sphere.
 */
export function computeLightOrthoMVP(
  center: [number, number, number],
  radius: number,
  lightDir: [number, number, number],
  margin = 1.28,
): Float32Array {
  const len = Math.hypot(lightDir[0], lightDir[1], lightDir[2]) || 1;
  const lx = lightDir[0] / len;
  const ly = lightDir[1] / len;
  const lz = lightDir[2] / len;
  const r = Math.max(20, radius * margin);
  const dist = r * 2.4;
  const eye: [number, number, number] = [
    center[0] + lx * dist,
    center[1] + ly * dist,
    center[2] + lz * dist,
  ];
  const up: [number, number, number] = Math.abs(ly) > 0.96 ? [0, 0, -1] : [0, 1, 0];
  const view = lookAtMat4(eye, center, up);
  const proj = orthoMat4(-r, r, -r, r, 1, dist + r * 2.2);
  return mulMat4(proj, view);
}

/**
 * Computes camera-relative 3-point studio softbox light directions (Key, Fill, Rim, Overhead).
 */
export function computeStudioLightDirs(azDeg: number): {
  key: [number, number, number];
  fill: [number, number, number];
  rim: [number, number, number];
  overhead: [number, number, number];
} {
  const dirFrom = (az: number, el: number): [number, number, number] => {
    const a = (az * Math.PI) / 180;
    const e = (el * Math.PI) / 180;
    return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)];
  };
  return {
    key: dirFrom(azDeg + 36, 60),       // High overhead-front-right main studio softbox
    fill: dirFrom(azDeg - 58, 42),      // Soft cool studio bounce from front-left
    rim: dirFrom(azDeg + 152, 46),      // High back-rim strip for crisp dark-brick bevel catchlights
    overhead: dirFrom(azDeg + 8, 84),   // Large overhead studio light-tent dome for grounded floor & underside AO
  };
}

// =========================================================================
// GLSL Shaders (Pure WebGL 1.0, 24-bit Depth Packing, GGX PBR, PCF Shadows, SSAO)
// =========================================================================

const DEPTH_PACK_GLSL = `
vec4 packDepth24(float d) {
  float c = clamp(d, 0.0, 0.999999);
  vec3 enc = fract(c * vec3(1.0, 255.0, 65025.0));
  enc.xy -= enc.yz * (1.0 / 255.0);
  return vec4(enc, 1.0);
}
float unpackDepth24(vec4 v) {
  return dot(v.rgb, vec3(1.0, 1.0 / 255.0, 1.0 / 65025.0));
}
`;

// 1) Shadow Depth Pass
const VS_DEPTH = `
attribute vec3 aPos;
uniform mat4 uMVP;
varying float vDepth;
void main() {
  vec4 p = uMVP * vec4(aPos, 1.0);
  gl_Position = p;
  vDepth = (p.z / p.w) * 0.5 + 0.5;
}
`;

const FS_DEPTH = `
precision highp float;
varying float vDepth;
${DEPTH_PACK_GLSL}
void main() {
  gl_FragColor = packDepth24(vDepth);
}
`;

// 2) View-Space Linear Depth Pass (for Screen-Space Ambient Occlusion)
const VS_VIEW_DEPTH = `
attribute vec3 aPos;
uniform mat4 uMVP;
uniform mat4 uView;
uniform float uNear;
uniform float uFar;
varying float vLinDepth;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  vec4 vp = uView * vec4(aPos, 1.0);
  vLinDepth = clamp((-vp.z - uNear) / max(1.0, uFar - uNear), 0.0, 1.0);
}
`;

const FS_VIEW_DEPTH = `
precision highp float;
varying float vLinDepth;
${DEPTH_PACK_GLSL}
void main() {
  gl_FragColor = packDepth24(vLinDepth);
}
`;

// 3) Photorealistic PBR ABS Plastic Brick Pass (Linear Space + GGX + Fresnel + Procedural Studio Softbox Env + Triple Soft Shadows + ACES)
const VS_PBR = `
attribute vec3 aPos;
attribute vec3 aNorm;
attribute vec4 aCol;
attribute vec2 aUv;
uniform mat4 uMVP;
uniform mat4 uKeyMVP;
uniform mat4 uFillMVP;
uniform mat4 uOverMVP;
varying vec3 vWorldPos;
varying vec3 vWorldNorm;
varying vec4 vCol;
varying vec2 vUv;
varying vec3 vKeyCoord;
varying vec3 vFillCoord;
varying vec3 vOverCoord;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  vWorldPos = aPos;
  vWorldNorm = aNorm;
  vCol = aCol;
  vUv = aUv;
  vec4 kp = uKeyMVP * vec4(aPos, 1.0);
  vKeyCoord = (kp.xyz / kp.w) * 0.5 + 0.5;
  vec4 fp = uFillMVP * vec4(aPos, 1.0);
  vFillCoord = (fp.xyz / fp.w) * 0.5 + 0.5;
  vec4 op = uOverMVP * vec4(aPos, 1.0);
  vOverCoord = (op.xyz / op.w) * 0.5 + 0.5;
}
`;

const FS_PBR = `
precision highp float;
uniform vec3 uEyePos;
uniform vec3 uKeyDir;
uniform vec3 uFillDir;
uniform vec3 uRimDir;
uniform vec3 uOverDir;
uniform sampler2D uKeyMap;
uniform sampler2D uFillMap;
uniform sampler2D uOverMap;
uniform sampler2D uDecalMap;
uniform float uUseDecal;
uniform vec2 uKeyTexel;
uniform vec2 uFillTexel;
uniform vec2 uOverTexel;
uniform float uMinY;
uniform float uModelHeight;

varying vec3 vWorldPos;
varying vec3 vWorldNorm;
varying vec4 vCol;
varying vec2 vUv;
varying vec3 vKeyCoord;
varying vec3 vFillCoord;
varying vec3 vOverCoord;

${DEPTH_PACK_GLSL}

float igNoise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float samplePcf12(sampler2D map, vec3 coord, vec2 texel, float bias, float spread, float angle) {
  if (coord.x < 0.01 || coord.x > 0.99 || coord.y < 0.01 || coord.y > 0.99 || coord.z > 0.999) {
    return 1.0;
  }
  float ca = cos(angle);
  float sa = sin(angle);
  mat2 rot = mat2(ca, -sa, sa, ca);
  float lit = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float r = sqrt((fi + 0.5) / 12.0) * spread;
    float theta = fi * 2.39996323;
    vec2 ofs = rot * vec2(cos(theta), sin(theta)) * r * texel;
    float d = unpackDepth24(texture2D(map, coord.xy + ofs));
    lit += step(coord.z - bias, d);
  }
  return lit / 12.0;
}

float ggxDistribution(float NdotH, float roughness) {
  float a = roughness * roughness;
  float a2 = a * a;
  float denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
  return a2 / max(0.0001, 3.14159265 * denom * denom);
}

float geomSmith(float NdotV, float NdotL, float roughness) {
  float k = ((roughness + 1.0) * (roughness + 1.0)) * 0.125;
  float gv = NdotV / max(0.0001, NdotV * (1.0 - k) + k);
  float gl = NdotL / max(0.0001, NdotL * (1.0 - k) + k);
  return gv * gl;
}

// Procedural Photographic Studio Softbox Light-Tent Environment
vec3 sampleStudioEnv(vec3 R, float roughness, vec3 keyDir, vec3 fillDir, vec3 rimDir) {
  float upMask = smoothstep(-0.15, 0.72, R.y);
  // Subtle dark studio gap at horizon -> clean white overhead light-tent softbox
  vec3 floorBounce = vec3(0.22, 0.24, 0.28);
  vec3 wallSweep = vec3(0.56, 0.59, 0.64);
  vec3 env = mix(floorBounce, wallSweep, upMask);

  // Overhead studio softbox panel (tight enough to gleam on bevels without washing flat tops)
  float topBox = smoothstep(0.62 - roughness * 0.25, 0.94, R.y);
  env += vec3(0.62, 0.61, 0.59) * topBox;

  // Crisp Key softbox reflection card
  float keyCard = pow(max(dot(R, keyDir), 0.0), mix(56.0, 14.0, roughness));
  env += vec3(1.10, 1.07, 1.02) * keyCard;

  // Gentle Fill reflection strip
  float fillCard = pow(max(dot(R, fillDir), 0.0), mix(34.0, 10.0, roughness));
  env += vec3(0.38, 0.43, 0.52) * fillCard;

  // Focused Rim highlight strip for glossy edge bevels
  float rimCard = pow(max(dot(R, rimDir), 0.0), mix(64.0, 16.0, roughness));
  env += vec3(0.45, 0.47, 0.52) * rimCard;

  return env;
}

vec3 acesFilm(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec3 N = normalize(vWorldNorm);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uEyePos - vWorldPos);
  float NdotV = max(dot(N, V), 0.001);

  // Composite printed decal (e.g. minifigure face/torso) over plastic base color in sRGB, then convert to linear
  vec3 srgbBase = vCol.rgb;
  if (uUseDecal > 0.5 && vUv.x >= 0.0 && vUv.x <= 1.0 && vUv.y >= 0.0 && vUv.y <= 1.0) {
    vec4 decal = texture2D(uDecalMap, vUv);
    srgbBase = mix(srgbBase, decal.rgb, decal.a);
  }
  // sRGB -> Linear albedo (with slight photographic saturation fidelity)
  vec3 albedo = pow(clamp(srgbBase, 0.0, 1.0), vec3(2.2));
  float alpha = vCol.a;
  float isTrans = step(alpha, 0.96);

  // Authentic glossy injection-molded LEGO ABS plastic (IOR ~ 1.54 -> F0 = 0.044)
  float luma = dot(albedo, vec3(0.2126, 0.7152, 0.0722));
  float roughness = mix(mix(0.18, 0.16, smoothstep(0.05, 0.6, luma)), 0.09, isTrans);
  vec3 F0 = vec3(mix(0.044, 0.06, isTrans));

  vec3 Lkey = normalize(uKeyDir);
  vec3 Lfill = normalize(uFillDir);
  vec3 Lrim = normalize(uRimDir);
  vec3 Lover = normalize(uOverDir);

  float NdotLKey = max(dot(N, Lkey), 0.0);
  float NdotLFill = max(dot(N, Lfill), 0.0);
  float NdotLRim = max(dot(N, Lrim), 0.0);
  float NdotLOver = max(dot(N, Lover), 0.0);

  // Per-pixel rotated Vogel-disk PCF soft shadows
  float rotAng = igNoise(gl_FragCoord.xy) * 6.2831853;
  float keyBias = max(0.0009, 0.0032 * (1.0 - NdotLKey));
  float fillBias = max(0.0010, 0.0034 * (1.0 - NdotLFill));
  float overBias = max(0.0011, 0.0035 * (1.0 - NdotLOver));

  float keyVis = samplePcf12(uKeyMap, vKeyCoord, uKeyTexel, keyBias, 2.2, rotAng);
  float fillVis = samplePcf12(uFillMap, vFillCoord, uFillTexel, fillBias, 2.8, rotAng + 1.7);
  float overVis = samplePcf12(uOverMap, vOverCoord, uOverTexel, overBias, 3.8, rotAng + 3.1);

  vec3 direct = vec3(0.0);

  // 1) Key Studio Softbox (crisp warm daylight — primary sculptural light!)
  if (NdotLKey > 0.0) {
    vec3 H = normalize(V + Lkey);
    float NdotH = max(dot(N, H), 0.0);
    float HdotV = max(dot(H, V), 0.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
    float D = ggxDistribution(NdotH, roughness);
    float G = geomSmith(NdotV, NdotLKey, roughness);
    vec3 spec = (D * G * F) / max(0.001, 4.0 * NdotV * NdotLKey);
    vec3 kD = (1.0 - F);
    vec3 rad = vec3(1.52, 1.48, 1.42) * mix(0.14, 1.0, keyVis);
    direct += (kD * albedo / 3.14159265 + spec * 0.92) * rad * NdotLKey;
  }

  // 2) Fill Studio Softbox (controlled cool-neutral fill so shadow sides keep rich 3D depth!)
  if (NdotLFill > 0.0) {
    vec3 H = normalize(V + Lfill);
    float NdotH = max(dot(N, H), 0.0);
    float HdotV = max(dot(H, V), 0.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
    float D = ggxDistribution(NdotH, roughness + 0.08);
    float G = geomSmith(NdotV, NdotLFill, roughness + 0.08);
    vec3 spec = (D * G * F) / max(0.001, 4.0 * NdotV * NdotLFill);
    vec3 kD = (1.0 - F);
    vec3 rad = vec3(0.42, 0.46, 0.52) * mix(0.26, 1.0, fillVis);
    direct += (kD * albedo / 3.14159265 + spec * 0.45) * rad * NdotLFill;
  }

  // 3) Back Rim Studio Strip (sharp specular catchlights on beveled edges & curved stud tops)
  if (NdotLRim > 0.0) {
    vec3 H = normalize(V + Lrim);
    float NdotH = max(dot(N, H), 0.0);
    float HdotV = max(dot(H, V), 0.0);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - HdotV, 5.0);
    float D = ggxDistribution(NdotH, roughness + 0.02);
    float G = geomSmith(NdotV, NdotLRim, roughness + 0.02);
    vec3 spec = (D * G * F) / max(0.001, 4.0 * NdotV * NdotLRim);
    vec3 rad = vec3(0.55, 0.56, 0.60);
    direct += (albedo * 0.07 + spec * 0.75) * rad * NdotLRim;
  }

  // 4) Indirect Studio Light-Tent Ambient + Subtle White Floor Bounce + Restrained ABS Fresnel Reflection
  float skyOcclusion = mix(0.32, 1.0, overVis);
  float heightNorm = clamp((vWorldPos.y - uMinY) / max(10.0, uModelHeight), 0.0, 1.0);
  float floorBounceFactor = (1.0 - smoothstep(0.0, 0.35, heightNorm)) * max(-N.y * 0.7 + 0.3, 0.0);

  vec3 hemiAmb = mix(vec3(0.14, 0.16, 0.19), vec3(0.30, 0.31, 0.34), N.y * 0.5 + 0.5);
  vec3 ambientDiff = albedo * (hemiAmb * skyOcclusion + vec3(0.08, 0.085, 0.095) * floorBounceFactor);

  // Calibrated dielectric Schlick Fresnel reflection so dark bricks stay rich obsidian-black while bevels gleam
  vec3 Fview = F0 + (vec3(0.36) - F0) * pow(1.0 - NdotV, 5.0);
  vec3 R = reflect(-V, N);
  vec3 envRefl = sampleStudioEnv(R, roughness, Lkey, Lfill, Lrim) * mix(0.35, 1.0, skyOcclusion);
  vec3 ambientSpec = envRefl * Fview * mix(0.32, 1.15, isTrans);

  // Subtle translucent polycarbonate internal glow for clear bricks
  vec3 transLift = albedo * (0.14 * isTrans);

  vec3 hdr = direct + ambientDiff + ambientSpec + transLift;
  // Photographic studio exposure -> ACES filmic tone map -> sRGB
  vec3 mapped = acesFilm(hdr * 1.08);
  vec3 srgb = pow(mapped, vec3(1.0 / 2.2));

  float outAlpha = mix(1.0, clamp(alpha + Fview.r * 0.6, 0.34, 0.92), isTrans);
  gl_FragColor = vec4(srgb, outAlpha);
}
`;

// 4) 3D Shadow-Catcher Studio Floor Plane (Unified overhead softbox studio shadow — zero harsh double ghosts!)
const VS_FLOOR = `
attribute vec3 aPos;
uniform mat4 uMVP;
uniform mat4 uKeyMVP;
uniform mat4 uFillMVP;
uniform mat4 uOverMVP;
varying vec3 vWorldPos;
varying vec3 vKeyCoord;
varying vec3 vFillCoord;
varying vec3 vOverCoord;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  vWorldPos = aPos;
  vec4 kp = uKeyMVP * vec4(aPos, 1.0);
  vKeyCoord = (kp.xyz / kp.w) * 0.5 + 0.5;
  vec4 fp = uFillMVP * vec4(aPos, 1.0);
  vFillCoord = (fp.xyz / fp.w) * 0.5 + 0.5;
  vec4 op = uOverMVP * vec4(aPos, 1.0);
  vOverCoord = (op.xyz / op.w) * 0.5 + 0.5;
}
`;

const FS_FLOOR = `
precision highp float;
uniform sampler2D uKeyMap;
uniform sampler2D uFillMap;
uniform sampler2D uOverMap;
uniform vec2 uKeyTexel;
uniform vec2 uFillTexel;
uniform vec2 uOverTexel;
uniform vec3 uFloorCenter;
uniform float uFloorRadius;
uniform float uDarkBg;

varying vec3 vWorldPos;
varying vec3 vKeyCoord;
varying vec3 vFillCoord;
varying vec3 vOverCoord;

${DEPTH_PACK_GLSL}

float igNoise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float sampleFloorShadow(sampler2D map, vec3 coord, vec2 texel, float spread, float angle, float proxFade) {
  if (coord.x < 0.02 || coord.x > 0.98 || coord.y < 0.02 || coord.y > 0.98) return 0.0;
  float ca = cos(angle);
  float sa = sin(angle);
  mat2 rot = mat2(ca, -sa, sa, ca);
  float occ = 0.0;
  float bias = 0.0020;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float r = sqrt((fi + 0.5) / 16.0) * spread;
    float theta = fi * 2.39996323;
    vec2 ofs = rot * vec2(cos(theta), sin(theta)) * r * texel;
    float d = unpackDepth24(texture2D(map, coord.xy + ofs));
    float gap = coord.z - d;
    if (gap > bias) {
      float prox = 1.0 - smoothstep(0.0, proxFade, gap);
      occ += mix(0.28, 1.0, prox);
    }
  }
  return occ / 16.0;
}

void main() {
  float radial = length(vWorldPos.xz - uFloorCenter.xz) / max(1.0, uFloorRadius);
  float edgeFade = 1.0 - smoothstep(0.45, 0.92, radial);
  if (edgeFade <= 0.001) discard;

  float rotAng = igNoise(gl_FragCoord.xy) * 6.2831853;
  // 1) Crisp, rich contact shadow directly underneath grounded stands/wheels
  float contactOcc = sampleFloorShadow(uOverMap, vOverCoord, uOverTexel, 2.2, rotAng, 0.14);
  // 2) Medium soft diffused shadow directly below the base & lower hull
  float midOverOcc = sampleFloorShadow(uOverMap, vOverCoord, uOverTexel, 8.5, rotAng + 1.3, 0.34);
  // 3) Wide, ultra-velvety overhead softbox ambient falloff (like official LEGO white-sweep photography)
  float wideOverOcc = sampleFloorShadow(uOverMap, vOverCoord, uOverTexel, 18.0, rotAng + 2.6, 0.55);
  // 4) Gentle directional drift from the high key softbox (kept soft so there is zero double-shadow artifact!)
  float keyOcc = sampleFloorShadow(uKeyMap, vKeyCoord, uKeyTexel, 12.0, rotAng + 3.9, 0.35);

  float combined = clamp(contactOcc * 0.46 + midOverOcc * 0.28 + wideOverOcc * 0.18 + keyOcc * 0.14, 0.0, 1.0);
  float strength = mix(0.48, 0.72, uDarkBg);
  float a = combined * strength * edgeFade;
  if (a < 0.003) discard;

  vec3 shadowCol = mix(vec3(0.05, 0.07, 0.11), vec3(0.0, 0.0, 0.0), uDarkBg);
  gl_FragColor = vec4(shadowCol, a);
}
`;

// 5) Subtle Hairline Seam Pass (ultra-delicate micro-seam hint for flat LDraw parts)
const VS_SEAM = `
attribute vec3 aPos;
attribute vec4 aCol;
uniform mat4 uMVP;
varying vec4 vCol;
void main() {
  gl_Position = uMVP * vec4(aPos, 1.0);
  gl_Position.z -= 0.00018;
  vCol = aCol;
}
`;

const FS_SEAM = `
precision mediump float;
uniform float uAlpha;
varying vec4 vCol;
void main() {
  gl_FragColor = vec4(vCol.rgb, vCol.a * uAlpha);
}
`;

// 6) Screen-Space Ambient Occlusion + Final Filmic Composite Pass
const VS_QUAD = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FS_SSAO_COMPOSITE = `
precision highp float;
uniform sampler2D uColorMap;
uniform sampler2D uDepthMap;
uniform vec2 uTexel;
varying vec2 vUv;

${DEPTH_PACK_GLSL}

float igNoise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec4 baseCol = texture2D(uColorMap, vUv);
  if (baseCol.a < 0.004) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float centerDepth = unpackDepth24(texture2D(uDepthMap, vUv));
  // Only apply SSAO to solid model geometry (background/floor depth is ~1.0)
  if (centerDepth >= 0.995) {
    gl_FragColor = baseCol;
    return;
  }

  float rotAng = igNoise(gl_FragCoord.xy) * 6.2831853;
  float ca = cos(rotAng);
  float sa = sin(rotAng);
  mat2 rot = mat2(ca, -sa, sa, ca);

  // Dual-ring screen-space crevice & contact occlusion (scaled to render resolution)
  float occ = 0.0;
  float weightSum = 0.0;
  float resFactor = clamp(1.0 / max(0.0001, 1600.0 * min(uTexel.x, uTexel.y)), 0.85, 2.6);
  float maxRadiusPx = 11.0 * resFactor;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float r = mix(1.6, maxRadiusPx, (fi + 0.5) / 16.0);
    float theta = fi * 2.39996323;
    vec2 ofs = rot * vec2(cos(theta), sin(theta)) * r * uTexel;
    float sDepth = unpackDepth24(texture2D(uDepthMap, clamp(vUv + ofs, 0.0, 1.0)));
    float diff = centerDepth - sDepth;
    // Ignore far background discontinuities (prevents dark halos around outer silhouette!)
    float rangeW = 1.0 - smoothstep(0.012, 0.065, abs(diff));
    float sampleOcc = smoothstep(0.0012, 0.014, diff) * rangeW;
    occ += sampleOcc;
    weightSum += 1.0;
  }

  float ao = 1.0 - clamp((occ / max(1.0, weightSum)) * 0.92, 0.0, 0.44);
  // Subtle micro-contrast polish in crevices without darkening bright highlights
  vec3 finalRgb = baseCol.rgb * mix(ao, 1.0, 0.14);
  gl_FragColor = vec4(finalRgb, baseCol.a);
}
`;

// =========================================================================
// WebGL FBO Helpers & Multi-Pass Studio Photo Renderer
// =========================================================================

interface FboTarget {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
  depthRb: WebGLRenderbuffer;
  w: number;
  h: number;
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function linkProgram(gl: WebGLRenderingContext, vsSrc: string, fsSrc: string): WebGLProgram | null {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

function createFboTarget(gl: WebGLRenderingContext, w: number, h: number, linearFilter: boolean): FboTarget | null {
  const tex = gl.createTexture();
  const fbo = gl.createFramebuffer();
  const depthRb = gl.createRenderbuffer();
  if (!tex || !fbo || !depthRb) return null;

  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, linearFilter ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, linearFilter ? gl.LINEAR : gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);

  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);

  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.bindRenderbuffer(gl.RENDERBUFFER, null);
  if (!ok) {
    gl.deleteTexture(tex);
    gl.deleteRenderbuffer(depthRb);
    gl.deleteFramebuffer(fbo);
    return null;
  }
  return { fbo, tex, depthRb, w, h };
}

function destroyFboTarget(gl: WebGLRenderingContext, t: FboTarget | null): void {
  if (!t) return;
  gl.deleteTexture(t.tex);
  gl.deleteRenderbuffer(t.depthRb);
  gl.deleteFramebuffer(t.fbo);
}

export class StudioPhotoRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null;
  private ready = false;

  private depthProg: WebGLProgram | null = null;
  private viewDepthProg: WebGLProgram | null = null;
  private pbrProg: WebGLProgram | null = null;
  private floorProg: WebGLProgram | null = null;
  private seamProg: WebGLProgram | null = null;
  private ssaoProg: WebGLProgram | null = null;

  private bTriPos: WebGLBuffer | null = null;
  private bTriNorm: WebGLBuffer | null = null;
  private bTriCol: WebGLBuffer | null = null;
  private bDecalPos: WebGLBuffer | null = null;
  private bDecalNorm: WebGLBuffer | null = null;
  private bDecalUv: WebGLBuffer | null = null;
  private bDecalCol: WebGLBuffer | null = null;
  private bLinePos: WebGLBuffer | null = null;
  private bLineCol: WebGLBuffer | null = null;
  private bFloorPos: WebGLBuffer | null = null;
  private bQuadPos: WebGLBuffer | null = null;

  private glTextures = new Map<string, WebGLTexture>();
  private emptyTex: WebGLTexture | null = null;

  private keyFbo: FboTarget | null = null;
  private fillFbo: FboTarget | null = null;
  private overFbo: FboTarget | null = null;
  private colorFbo: FboTarget | null = null;
  private viewDepthFbo: FboTarget | null = null;

  private uploadedMesh: StudioMeshData | null = null;
  private maxDim = 2048;
  private anisoExt: EXT_texture_filter_anisotropic | null = null;
  private maxAniso = 1;

  constructor(canvas?: HTMLCanvasElement) {
    this.canvas = canvas ?? document.createElement('canvas');
    const gl = this.canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.gl = gl;
    if (!gl) return;

    try {
      const vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
      const rb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 2048;
      const texMax = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
      const vpMin = vp && vp.length >= 2 ? Math.min(vp[0], vp[1]) : 2048;
      this.maxDim = Math.max(1024, Math.min(vpMin, rb, texMax, 4096));
      this.anisoExt = gl.getExtension('EXT_texture_filter_anisotropic')
        || gl.getExtension('WEBKIT_EXT_TEXTURE_FILTER_ANISOTROPIC')
        || gl.getExtension('MOZ_EXT_TEXTURE_FILTER_ANISOTROPIC');
      if (this.anisoExt) {
        this.maxAniso = Math.min(8, gl.getParameter(this.anisoExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT) || 1);
      }
    } catch (_) {}

    this.depthProg = linkProgram(gl, VS_DEPTH, FS_DEPTH);
    this.viewDepthProg = linkProgram(gl, VS_VIEW_DEPTH, FS_VIEW_DEPTH);
    this.pbrProg = linkProgram(gl, VS_PBR, FS_PBR);
    this.floorProg = linkProgram(gl, VS_FLOOR, FS_FLOOR);
    this.seamProg = linkProgram(gl, VS_SEAM, FS_SEAM);
    this.ssaoProg = linkProgram(gl, VS_QUAD, FS_SSAO_COMPOSITE);

    if (!this.depthProg || !this.viewDepthProg || !this.pbrProg || !this.floorProg || !this.seamProg || !this.ssaoProg) {
      return;
    }

    this.bTriPos = gl.createBuffer();
    this.bTriNorm = gl.createBuffer();
    this.bTriCol = gl.createBuffer();
    this.bDecalPos = gl.createBuffer();
    this.bDecalNorm = gl.createBuffer();
    this.bDecalUv = gl.createBuffer();
    this.bDecalCol = gl.createBuffer();
    this.bLinePos = gl.createBuffer();
    this.bLineCol = gl.createBuffer();
    this.bFloorPos = gl.createBuffer();
    this.bQuadPos = gl.createBuffer();

    const empty = gl.createTexture();
    if (empty) {
      gl.bindTexture(gl.TEXTURE_2D, empty);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
      this.emptyTex = empty;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bQuadPos);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );

    // High-res shadow maps (nearest filtering because 24-bit depth is packed in RGBA!)
    const keyShadowDim = Math.min(2048, this.maxDim);
    const auxShadowDim = Math.min(1024, this.maxDim);
    this.keyFbo = createFboTarget(gl, keyShadowDim, keyShadowDim, false);
    this.fillFbo = createFboTarget(gl, auxShadowDim, auxShadowDim, false);
    this.overFbo = createFboTarget(gl, auxShadowDim, auxShadowDim, false);

    this.ready = Boolean(this.keyFbo && this.fillFbo && this.overFbo);
  }

  getMaxDimension(): number {
    return this.maxDim;
  }

  private getOrCreateDecalTexture(
    texKey: string,
    getTextureImage?: (key: string) => TexImageSource | null,
  ): WebGLTexture | null {
    const gl = this.gl;
    if (!gl) return null;
    const cached = this.glTextures.get(texKey);
    if (cached) return cached;
    const img = getTextureImage?.(texKey) ?? null;
    if (!img) return null;
    const tex = gl.createTexture();
    if (!tex) return null;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    if (this.anisoExt && this.maxAniso > 1) {
      gl.texParameterf(gl.TEXTURE_2D, this.anisoExt.TEXTURE_MAX_ANISOTROPY_EXT, this.maxAniso);
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    this.glTextures.set(texKey, tex);
    return tex;
  }

  isAvailable(): boolean {
    return this.ready && Boolean(this.gl);
  }

  private ensureScreenFbos(w: number, h: number): boolean {
    const gl = this.gl;
    if (!gl) return false;
    if (this.colorFbo && this.viewDepthFbo && this.colorFbo.w === w && this.colorFbo.h === h) {
      return true;
    }
    destroyFboTarget(gl, this.colorFbo);
    destroyFboTarget(gl, this.viewDepthFbo);
    this.colorFbo = createFboTarget(gl, w, h, true);
    this.viewDepthFbo = createFboTarget(gl, w, h, false);
    return Boolean(this.colorFbo && this.viewDepthFbo);
  }

  private uploadMesh(mesh: StudioMeshData): void {
    const gl = this.gl;
    if (!gl || this.uploadedMesh === mesh) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.triPos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.triNorm, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.triCol, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bLinePos);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.linePos, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bLineCol);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.lineCol, gl.STATIC_DRAW);
    this.uploadedMesh = mesh;
  }

  private renderShadowMap(fboTarget: FboTarget, mesh: StudioMeshData, lightMvp: Float32Array): void {
    const gl = this.gl!;
    const prog = this.depthProg!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboTarget.fbo);
    gl.viewport(0, 0, fboTarget.w, fboTarget.h);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.8, 2.2);

    gl.useProgram(prog);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMVP'), false, lightMvp);
    const posLoc = gl.getAttribLocation(prog, 'aPos');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    const totalTris = mesh.opaqueCount + mesh.transCount;
    if (totalTris > 0) gl.drawArrays(gl.TRIANGLES, 0, totalTris);
    if (mesh.texDraws && mesh.texDraws.length > 0) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bDecalPos);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      for (const td of mesh.texDraws) {
        if (td.triPos.length < 9) continue;
        gl.bufferData(gl.ARRAY_BUFFER, td.triPos, gl.DYNAMIC_DRAW);
        gl.drawArrays(gl.TRIANGLES, 0, td.triPos.length / 3);
      }
    }
    gl.disable(gl.POLYGON_OFFSET_FILL);
  }

  render(mesh: StudioMeshData, options: StudioRenderOptions): { url: string; width: number; height: number } | null {
    const gl = this.gl;
    const hasTexDraws = Boolean(mesh.texDraws && mesh.texDraws.length > 0);
    if (!gl || !this.ready || (mesh.triPos.length < 9 && !hasTexDraws)) return null;

    const w = Math.max(320, Math.min(this.maxDim, Math.round(options.width)));
    const h = Math.max(240, Math.min(this.maxDim, Math.round(options.height)));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    this.uploadMesh(mesh);

    const cam = computeStudioTelephotoCamera(
      mesh.triPos.length >= 9 ? mesh.triPos : mesh.texDraws![0].triPos,
      mesh.center,
      options.azDeg,
      options.elDeg,
      w,
      h,
      options.zoom ?? 1.0,
      options.fovYDeg ?? 18.5,
    );

    const lights = computeStudioLightDirs(options.azDeg);
    const modelRadius = Math.max(mesh.fullRadius || mesh.radius, 20);
    const keyMvp = computeLightOrthoMVP(mesh.center, modelRadius, lights.key, 1.32);
    const fillMvp = computeLightOrthoMVP(mesh.center, modelRadius, lights.fill, 1.36);
    const overMvp = computeLightOrthoMVP(mesh.center, modelRadius, lights.overhead, 1.4);

    // 1. Render 3 Softbox Shadow Maps
    this.renderShadowMap(this.keyFbo!, mesh, keyMvp);
    this.renderShadowMap(this.fillFbo!, mesh, fillMvp);
    this.renderShadowMap(this.overFbo!, mesh, overMvp);

    const useSsao = this.ensureScreenFbos(w, h);

    // 2. Render Linear View-Space Depth Pass for SSAO
    if (useSsao && this.viewDepthFbo) {
      const prog = this.viewDepthProg!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.viewDepthFbo.fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);

      gl.useProgram(prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMVP'), false, cam.mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uView'), false, cam.view);
      gl.uniform1f(gl.getUniformLocation(prog, 'uNear'), cam.near);
      gl.uniform1f(gl.getUniformLocation(prog, 'uFar'), cam.far);
      const posLoc = gl.getAttribLocation(prog, 'aPos');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      if (mesh.opaqueCount > 0) gl.drawArrays(gl.TRIANGLES, 0, mesh.opaqueCount);
      if (mesh.texDraws && mesh.texDraws.length > 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bDecalPos);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
        for (const td of mesh.texDraws) {
          if (td.triPos.length < 9) continue;
          gl.bufferData(gl.ARRAY_BUFFER, td.triPos, gl.DYNAMIC_DRAW);
          gl.drawArrays(gl.TRIANGLES, 0, td.triPos.length / 3);
        }
      }
    }

    // 3. Render Main Studio Floor Shadow-Catcher + Photorealistic PBR Model
    gl.bindFramebuffer(gl.FRAMEBUFFER, useSsao && this.colorFbo ? this.colorFbo.fbo : null);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    // Bind the 3 shadow maps to texture units 0, 1, 2
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.keyFbo!.tex);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.fillFbo!.tex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.overFbo!.tex);

    // 3a. 3D Shadow-Catcher Studio Floor Plane at y = minY - 0.12
    const floorY = mesh.bounds.minY - 0.12;
    const floorSpan = Math.max(modelRadius * 2.8, 120);
    const fx = (mesh.bounds.minX + mesh.bounds.maxX) * 0.5;
    const fz = (mesh.bounds.minZ + mesh.bounds.maxZ) * 0.5;
    const floorVerts = new Float32Array([
      fx - floorSpan, floorY, fz - floorSpan,
      fx + floorSpan, floorY, fz - floorSpan,
      fx + floorSpan, floorY, fz + floorSpan,
      fx - floorSpan, floorY, fz - floorSpan,
      fx + floorSpan, floorY, fz + floorSpan,
      fx - floorSpan, floorY, fz + floorSpan,
    ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.bFloorPos);
    gl.bufferData(gl.ARRAY_BUFFER, floorVerts, gl.DYNAMIC_DRAW);

    {
      const prog = this.floorProg!;
      gl.useProgram(prog);
      gl.depthMask(false);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMVP'), false, cam.mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uKeyMVP'), false, keyMvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uFillMVP'), false, fillMvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uOverMVP'), false, overMvp);
      gl.uniform1i(gl.getUniformLocation(prog, 'uKeyMap'), 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'uFillMap'), 1);
      gl.uniform1i(gl.getUniformLocation(prog, 'uOverMap'), 2);
      gl.uniform2f(gl.getUniformLocation(prog, 'uKeyTexel'), 1 / this.keyFbo!.w, 1 / this.keyFbo!.h);
      gl.uniform2f(gl.getUniformLocation(prog, 'uFillTexel'), 1 / this.fillFbo!.w, 1 / this.fillFbo!.h);
      gl.uniform2f(gl.getUniformLocation(prog, 'uOverTexel'), 1 / this.overFbo!.w, 1 / this.overFbo!.h);
      gl.uniform3f(gl.getUniformLocation(prog, 'uFloorCenter'), fx, floorY, fz);
      gl.uniform1f(gl.getUniformLocation(prog, 'uFloorRadius'), floorSpan * 0.92);
      gl.uniform1f(gl.getUniformLocation(prog, 'uDarkBg'), options.darkBackground ? 1.0 : 0.0);

      const posLoc = gl.getAttribLocation(prog, 'aPos');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bFloorPos);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
    }

    // 3b. Photorealistic PBR LEGO Bricks (Opaque + Textured Decals + Transparent)
    {
      const prog = this.pbrProg!;
      gl.useProgram(prog);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(1.0, 1.0);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMVP'), false, cam.mvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uKeyMVP'), false, keyMvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uFillMVP'), false, fillMvp);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uOverMVP'), false, overMvp);
      gl.uniform3f(gl.getUniformLocation(prog, 'uEyePos'), cam.eye[0], cam.eye[1], cam.eye[2]);
      gl.uniform3f(gl.getUniformLocation(prog, 'uKeyDir'), lights.key[0], lights.key[1], lights.key[2]);
      gl.uniform3f(gl.getUniformLocation(prog, 'uFillDir'), lights.fill[0], lights.fill[1], lights.fill[2]);
      gl.uniform3f(gl.getUniformLocation(prog, 'uRimDir'), lights.rim[0], lights.rim[1], lights.rim[2]);
      gl.uniform3f(gl.getUniformLocation(prog, 'uOverDir'), lights.overhead[0], lights.overhead[1], lights.overhead[2]);
      gl.uniform1i(gl.getUniformLocation(prog, 'uKeyMap'), 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'uFillMap'), 1);
      gl.uniform1i(gl.getUniformLocation(prog, 'uOverMap'), 2);
      gl.uniform1i(gl.getUniformLocation(prog, 'uDecalMap'), 3);
      gl.uniform1f(gl.getUniformLocation(prog, 'uUseDecal'), 0.0);
      gl.uniform2f(gl.getUniformLocation(prog, 'uKeyTexel'), 1 / this.keyFbo!.w, 1 / this.keyFbo!.h);
      gl.uniform2f(gl.getUniformLocation(prog, 'uFillTexel'), 1 / this.fillFbo!.w, 1 / this.fillFbo!.h);
      gl.uniform2f(gl.getUniformLocation(prog, 'uOverTexel'), 1 / this.overFbo!.w, 1 / this.overFbo!.h);
      gl.uniform1f(gl.getUniformLocation(prog, 'uMinY'), mesh.bounds.minY);
      gl.uniform1f(gl.getUniformLocation(prog, 'uModelHeight'), Math.max(10, mesh.bounds.maxY - mesh.bounds.minY));

      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.emptyTex);

      const pLoc = gl.getAttribLocation(prog, 'aPos');
      const nLoc = gl.getAttribLocation(prog, 'aNorm');
      const cLoc = gl.getAttribLocation(prog, 'aCol');
      const uvLoc = gl.getAttribLocation(prog, 'aUv');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos);
      gl.enableVertexAttribArray(pLoc);
      gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm);
      gl.enableVertexAttribArray(nLoc);
      gl.vertexAttribPointer(nLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol);
      gl.enableVertexAttribArray(cLoc);
      gl.vertexAttribPointer(cLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      if (uvLoc >= 0) {
        gl.disableVertexAttribArray(uvLoc);
        gl.vertexAttrib2f(uvLoc, 0, 0);
      }

      gl.depthMask(true);
      if (mesh.opaqueCount > 0) gl.drawArrays(gl.TRIANGLES, 0, mesh.opaqueCount);

      if (mesh.texDraws && mesh.texDraws.length > 0) {
        gl.polygonOffset(0.5, 0.5);
        const useDecalLoc = gl.getUniformLocation(prog, 'uUseDecal');
        if (uvLoc >= 0) gl.enableVertexAttribArray(uvLoc);
        for (const td of mesh.texDraws) {
          if (td.triPos.length < 9) continue;
          const glTex = this.getOrCreateDecalTexture(td.texKey, options.getTextureImage);
          gl.activeTexture(gl.TEXTURE3);
          gl.bindTexture(gl.TEXTURE_2D, glTex ?? this.emptyTex);
          gl.uniform1f(useDecalLoc, glTex ? 1.0 : 0.0);

          gl.bindBuffer(gl.ARRAY_BUFFER, this.bDecalPos);
          gl.bufferData(gl.ARRAY_BUFFER, td.triPos, gl.DYNAMIC_DRAW);
          gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, this.bDecalNorm);
          gl.bufferData(gl.ARRAY_BUFFER, td.triNorm, gl.DYNAMIC_DRAW);
          gl.vertexAttribPointer(nLoc, 3, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, this.bDecalCol);
          gl.bufferData(gl.ARRAY_BUFFER, td.triCol, gl.DYNAMIC_DRAW);
          gl.vertexAttribPointer(cLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

          if (uvLoc >= 0) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.bDecalUv);
            gl.bufferData(gl.ARRAY_BUFFER, td.triUv, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
          }

          gl.drawArrays(gl.TRIANGLES, 0, td.triPos.length / 3);
        }
        gl.uniform1f(useDecalLoc, 0.0);
        if (uvLoc >= 0) {
          gl.disableVertexAttribArray(uvLoc);
          gl.vertexAttrib2f(uvLoc, 0, 0);
        }
        // Rebind main buffers for transparent pass
        gl.polygonOffset(1.0, 1.0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriPos);
        gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriNorm);
        gl.vertexAttribPointer(nLoc, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bTriCol);
        gl.vertexAttribPointer(cLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      }

      if (mesh.transCount > 0) {
        gl.depthMask(false);
        gl.drawArrays(gl.TRIANGLES, mesh.opaqueCount, mesh.transCount);
        gl.depthMask(true);
      }
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }

    // 3c. Ultra-subtle seam lines (only 0.16 alpha so flat LDraw parts retain delicate brick parting lines)
    if (mesh.linePos.length > 0) {
      const prog = this.seamProg!;
      gl.useProgram(prog);
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uMVP'), false, cam.mvp);
      gl.uniform1f(gl.getUniformLocation(prog, 'uAlpha'), 0.16);
      const pLoc = gl.getAttribLocation(prog, 'aPos');
      const cLoc = gl.getAttribLocation(prog, 'aCol');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLinePos);
      gl.enableVertexAttribArray(pLoc);
      gl.vertexAttribPointer(pLoc, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bLineCol);
      gl.enableVertexAttribArray(cLoc);
      gl.vertexAttribPointer(cLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);
      gl.drawArrays(gl.LINES, 0, mesh.linePos.length / 3);
    }

    // 4. Final Fullscreen SSAO Crevice Occlusion Composite Pass -> Default Canvas
    if (useSsao && this.colorFbo && this.viewDepthFbo) {
      const prog = this.ssaoProg!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.colorFbo.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.viewDepthFbo.tex);

      gl.useProgram(prog);
      gl.uniform1i(gl.getUniformLocation(prog, 'uColorMap'), 0);
      gl.uniform1i(gl.getUniformLocation(prog, 'uDepthMap'), 1);
      gl.uniform2f(gl.getUniformLocation(prog, 'uTexel'), 1 / w, 1 / h);

      const pLoc = gl.getAttribLocation(prog, 'aPos');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.bQuadPos);
      gl.enableVertexAttribArray(pLoc);
      gl.vertexAttribPointer(pLoc, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    return {
      url: this.canvas.toDataURL('image/png'),
      width: w,
      height: h,
    };
  }

  dispose(): void {
    const gl = this.gl;
    if (!gl) return;
    for (const tex of this.glTextures.values()) gl.deleteTexture(tex);
    this.glTextures.clear();
    if (this.emptyTex) gl.deleteTexture(this.emptyTex);
    this.emptyTex = null;
    destroyFboTarget(gl, this.keyFbo);
    destroyFboTarget(gl, this.fillFbo);
    destroyFboTarget(gl, this.overFbo);
    destroyFboTarget(gl, this.colorFbo);
    destroyFboTarget(gl, this.viewDepthFbo);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    this.gl = null;
    this.ready = false;
  }
}
