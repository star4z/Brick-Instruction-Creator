import * as THREE from 'three';
import { getLDrawColor } from '../data/ldrawColors';
import { resolvePartDefinition, type PartDefinition } from '../data/partCatalog';
import { partsProvider } from '../engine/partsProvider';
import type { PartInstance, PresentationTransform, ThemeSettings } from '../types/manual';

const STUD_PITCH = 20;
const STUD_RADIUS = 5.8;
const STUD_HEIGHT = 4.2;

function desaturateHex(hex: string, amount: number): THREE.Color {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  hsl.s *= 1 - Math.max(0, Math.min(1, amount));
  // Lift very dark colors slightly when faded so edges stay readable
  hsl.l = hsl.l * 0.85 + 0.12 * amount;
  c.setHSL(hsl.h, hsl.s, Math.min(0.92, hsl.l));
  return c;
}

function addBoxMesh(
  group: THREE.Group,
  w: number,
  h: number,
  d: number,
  cx: number,
  cy: number,
  cz: number,
  mat: THREE.Material,
  edgeMat: THREE.LineBasicMaterial | null,
  outlineMat: THREE.Material | null,
) {
  const geom = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(cx, cy, cz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (edgeMat) {
    const edges = new THREE.EdgesGeometry(geom, 24);
    const line = new THREE.LineSegments(edges, edgeMat);
    line.position.set(cx, cy, cz);
    group.add(line);
  }
  if (outlineMat) {
    const oMesh = new THREE.Mesh(geom, outlineMat);
    oMesh.position.set(cx, cy, cz);
    oMesh.scale.set(
      (w + 2.4) / w,
      (h + 2.4) / h,
      (d + 2.4) / d,
    );
    group.add(oMesh);
  }
}

function addCylinderMesh(
  group: THREE.Group,
  rTop: number,
  rBottom: number,
  h: number,
  cx: number,
  cy: number,
  cz: number,
  rot: [number, number, number],
  mat: THREE.Material,
  edgeMat: THREE.LineBasicMaterial | null,
  outlineMat: THREE.Material | null,
  radialSegments = 16,
) {
  const geom = new THREE.CylinderGeometry(rTop, rBottom, h, radialSegments);
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(cx, cy, cz);
  mesh.rotation.set(rot[0], rot[1], rot[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (edgeMat) {
    const edges = new THREE.EdgesGeometry(geom, 32);
    const line = new THREE.LineSegments(edges, edgeMat);
    line.position.set(cx, cy, cz);
    line.rotation.set(rot[0], rot[1], rot[2]);
    group.add(line);
  }
  if (outlineMat) {
    const oMesh = new THREE.Mesh(geom, outlineMat);
    oMesh.position.set(cx, cy, cz);
    oMesh.rotation.set(rot[0], rot[1], rot[2]);
    oMesh.scale.set(1.16, 1.06, 1.16);
    group.add(oMesh);
  }
}

function addSlopeMesh(
  group: THREE.Group,
  w: number,
  h: number,
  d: number,
  inverted: boolean,
  mat: THREE.Material,
  edgeMat: THREE.LineBasicMaterial | null,
  outlineMat: THREE.Material | null,
) {
  const shape = new THREE.Shape();
  const halfW = w / 2;
  const flatTopW = w > 22 ? STUD_PITCH : w * 0.25;

  if (!inverted) {
    shape.moveTo(-halfW, -h);
    shape.lineTo(halfW, -h);
    shape.lineTo(halfW, -h + 4);
    shape.lineTo(-halfW + flatTopW, 0);
    shape.lineTo(-halfW, 0);
    shape.closePath();
  } else {
    shape.moveTo(-halfW, 0);
    shape.lineTo(halfW, 0);
    shape.lineTo(halfW, -4);
    shape.lineTo(-halfW + flatTopW, -h);
    shape.lineTo(-halfW, -h);
    shape.closePath();
  }

  const geom = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  geom.translate(0, 0, -d / 2);

  const mesh = new THREE.Mesh(geom, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  if (edgeMat) {
    const edges = new THREE.EdgesGeometry(geom, 20);
    group.add(new THREE.LineSegments(edges, edgeMat));
  }
  if (outlineMat) {
    const oMesh = new THREE.Mesh(geom, outlineMat);
    oMesh.scale.set(1.06, 1.06, 1.06);
    group.add(oMesh);
  }
}

function addTopStuds(
  group: THREE.Group,
  def: PartDefinition,
  mat: THREE.Material,
  edgeMat: THREE.LineBasicMaterial | null,
) {
  if (!def.hasTopStuds) return;
  const topX = def.meta?.topStudsX ?? def.studsX;
  const startX = -((def.studsX - 1) * STUD_PITCH) / 2;
  const startZ = -((def.studsZ - 1) * STUD_PITCH) / 2;

  for (let ix = 0; ix < topX; ix++) {
    for (let iz = 0; iz < def.studsZ; iz++) {
      addCylinderMesh(
        group,
        STUD_RADIUS,
        STUD_RADIUS,
        STUD_HEIGHT + 0.6,
        startX + ix * STUD_PITCH,
        STUD_HEIGHT / 2 - 0.3,
        startZ + iz * STUD_PITCH,
        [0, 0, 0],
        mat,
        edgeMat,
        null,
        14,
      );
    }
  }
}

export interface BuildMeshOptions {
  isNew: boolean;
  isFaded: boolean;
  theme: ThemeSettings;
  transform?: PresentationTransform;
}

/**
 * Constructs a crisp Three.js Group for a single LEGO part instance with:
 * - Accurate parametric or raw LDraw .dat geometry
 * - Soft plastic technical shading + dark LDraw edge lines
 * - Optional new-part highlight outline & previous-step fade/desaturation
 * - Optional non-destructive presentation transforms (exploded offset & hinge angle)
 */
export function buildPartMeshGroup(
  part: PartInstance,
  options: BuildMeshOptions,
): THREE.Group {
  const { isNew, isFaded, theme, transform } = options;
  const def = resolvePartDefinition(part.partId);
  const colorInfo = getLDrawColor(part.colorId);

  const baseColor =
    isFaded && theme.fadePreviousParts
      ? desaturateHex(colorInfo.hex, theme.fadeDesaturation)
      : new THREE.Color(colorInfo.hex);

  const opacity =
    isFaded && theme.fadePreviousParts
      ? Math.min(colorInfo.alpha, theme.fadeOpacity)
      : colorInfo.alpha;

  const isTransparent = opacity < 0.98;

  const mat = new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness: colorInfo.metallic ? 0.28 : isTransparent ? 0.14 : 0.36,
    metalness: colorInfo.metallic ? 0.65 : 0.04,
    transparent: isTransparent,
    opacity,
    emissive:
      isNew && theme.highlightNewParts
        ? new THREE.Color(theme.highlightColor)
        : new THREE.Color(0x000000),
    emissiveIntensity:
      isNew && theme.highlightNewParts ? theme.highlightIntensity * 0.14 : 0,
  });

  const baseC = new THREE.Color(colorInfo.hex);
  const baseLuma = 0.299 * baseC.r + 0.587 * baseC.g + 0.114 * baseC.b;
  const adaptiveEdgeHex = baseLuma < 0.2 ? '#cbd5e1' : colorInfo.edgeHex;
  const edgeColor =
    isNew && theme.highlightNewParts
      ? new THREE.Color(theme.highlightColor)
      : new THREE.Color(adaptiveEdgeHex);

  const edgeMat = theme.showEdgeLines
    ? new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: isFaded && theme.fadePreviousParts,
        opacity: isFaded && theme.fadePreviousParts ? Math.max(0.35, theme.fadeOpacity) : 1,
      })
    : null;

  // Backface silhouette highlight outline for newly added pieces
  const outlineMat =
    isNew && theme.highlightNewParts
      ? new THREE.MeshBasicMaterial({
          color: new THREE.Color(theme.highlightColor),
          side: THREE.BackSide,
          transparent: true,
          opacity: Math.min(0.95, 0.45 + theme.highlightIntensity * 0.5),
        })
      : null;

  const localGroup = new THREE.Group();

  // Check if we have raw LDraw .dat triangle geometry from embedded/local library
  const rawDat = partsProvider.getCachedRawGeometry(part.partId);
  if (rawDat && rawDat.triangles.length >= 9) {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(rawDat.triangles, 3));
    geom.computeVertexNormals();
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    localGroup.add(mesh);

    if (edgeMat) {
      if (rawDat.lines.length >= 6) {
        const lineGeom = new THREE.BufferGeometry();
        lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(rawDat.lines, 3));
        localGroup.add(new THREE.LineSegments(lineGeom, edgeMat));
      } else {
        localGroup.add(new THREE.LineSegments(new THREE.EdgesGeometry(geom, 24), edgeMat));
      }
    }
    if (outlineMat) {
      const oMesh = new THREE.Mesh(geom, outlineMat);
      oMesh.scale.set(1.04, 1.04, 1.04);
      localGroup.add(oMesh);
    }
  } else {
    const w = def.studsX * STUD_PITCH - 0.6;
    const d = def.studsZ * STUD_PITCH - 0.6;
    const h = def.heightLdu;

    switch (def.shape) {
      case 'bar': {
        const len = def.meta?.barLengthLdu ?? h;
        addCylinderMesh(localGroup, 3.8, 3.8, len, 0, 0, 0, [0, 0, 0], mat, edgeMat, outlineMat, 14);
        break;
      }
      case 'round_brick':
      case 'round_plate': {
        const radius = (def.studsX * STUD_PITCH) / 2 - 0.4;
        addCylinderMesh(localGroup, radius, radius, h, 0, -h / 2, 0, [0, 0, 0], mat, edgeMat, outlineMat, 20);
        addTopStuds(localGroup, def, mat, edgeMat);
        break;
      }
      case 'cone': {
        addCylinderMesh(localGroup, 5.8, 9.6, h, 0, -h / 2, 0, [0, 0, 0], mat, edgeMat, outlineMat, 18);
        addTopStuds(localGroup, def, mat, edgeMat);
        break;
      }
      case 'slope': {
        addSlopeMesh(localGroup, w, h, d, false, mat, edgeMat, outlineMat);
        addTopStuds(localGroup, def, mat, edgeMat);
        break;
      }
      case 'inverted_slope': {
        addSlopeMesh(localGroup, w, h, d, true, mat, edgeMat, outlineMat);
        addTopStuds(localGroup, def, mat, edgeMat);
        break;
      }
      case 'canopy': {
        addSlopeMesh(localGroup, w, h, d, false, mat, edgeMat, outlineMat);
        break;
      }
      case 'snot_brick': {
        addBoxMesh(localGroup, w, h, d, 0, -h / 2, 0, mat, edgeMat, outlineMat);
        addTopStuds(localGroup, def, mat, edgeMat);
        const faces = def.meta?.snotFaces ?? ['px'];
        for (const f of faces) {
          if (f === 'px') {
            addCylinderMesh(localGroup, STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, w / 2 + STUD_HEIGHT / 2, -h / 2, 0, [0, 0, -Math.PI / 2], mat, edgeMat, null, 14);
          } else if (f === 'nx') {
            addCylinderMesh(localGroup, STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, -w / 2 - STUD_HEIGHT / 2, -h / 2, 0, [0, 0, Math.PI / 2], mat, edgeMat, null, 14);
          } else if (f === 'pz') {
            addCylinderMesh(localGroup, STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 0, -h / 2, d / 2 + STUD_HEIGHT / 2, [Math.PI / 2, 0, 0], mat, edgeMat, null, 14);
          } else if (f === 'nz') {
            addCylinderMesh(localGroup, STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 0, -h / 2, -d / 2 - STUD_HEIGHT / 2, [-Math.PI / 2, 0, 0], mat, edgeMat, null, 14);
          }
        }
        break;
      }
      case 'snot_bracket': {
        addBoxMesh(localGroup, w, h, d, 0, -h / 2, 0, mat, edgeMat, outlineMat);
        addBoxMesh(localGroup, w, 20, 4, 0, -14, d / 2 + 2, mat, edgeMat, outlineMat);
        addTopStuds(localGroup, def, mat, edgeMat);
        addCylinderMesh(localGroup, STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, -10, -14, d / 2 + 6, [Math.PI / 2, 0, 0], mat, edgeMat, null, 14);
        addCylinderMesh(localGroup, STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, 10, -14, d / 2 + 6, [Math.PI / 2, 0, 0], mat, edgeMat, null, 14);
        break;
      }
      case 'clip_plate': {
        addBoxMesh(localGroup, w, h, d, 0, -h / 2, 0, mat, edgeMat, outlineMat);
        addTopStuds(localGroup, def, mat, edgeMat);
        const side = def.meta?.clipSide ?? 'px';
        if (side === 'py') {
          // Vertical clip jaws on top
          addBoxMesh(localGroup, 4, 12, 8, -4.5, 6, 0, mat, edgeMat, outlineMat);
          addBoxMesh(localGroup, 4, 12, 8, 4.5, 6, 0, mat, edgeMat, outlineMat);
        } else if (side === 'pz') {
          addBoxMesh(localGroup, 6, 6, 10, -10, -h / 2, d / 2 + 5, mat, edgeMat, outlineMat);
          addBoxMesh(localGroup, 6, 6, 10, 10, -h / 2, d / 2 + 5, mat, edgeMat, outlineMat);
        } else {
          // Horizontal C-clip on +X
          addBoxMesh(localGroup, 10, 3.2, 8, w / 2 + 5, -1.6, 0, mat, edgeMat, outlineMat);
          addBoxMesh(localGroup, 10, 3.2, 8, w / 2 + 5, -6.4, 0, mat, edgeMat, outlineMat);
        }
        break;
      }
      case 'bar_plate': {
        addBoxMesh(localGroup, w, h, d, 0, -h / 2, 0, mat, edgeMat, outlineMat);
        addTopStuds(localGroup, def, mat, edgeMat);
        addCylinderMesh(localGroup, 3.5, 3.5, 26, 0, -h / 2, d / 2 + 6, [0, 0, Math.PI / 2], mat, edgeMat, outlineMat, 12);
        break;
      }
      case 'minifig_legs': {
        addBoxMesh(localGroup, 32, 6, 16, 0, -3, 0, mat, edgeMat, outlineMat);
        addBoxMesh(localGroup, 14, 22, 14, -8.5, -17, 0, mat, edgeMat, outlineMat);
        addBoxMesh(localGroup, 14, 22, 14, 8.5, -17, 0, mat, edgeMat, outlineMat);
        break;
      }
      case 'minifig_torso': {
        addBoxMesh(localGroup, 30, 28, 15, 0, -14, 0, mat, edgeMat, outlineMat);
        // Left & right arms
        addBoxMesh(localGroup, 7, 22, 8, -18.5, -15, 0, mat, edgeMat, outlineMat);
        addBoxMesh(localGroup, 7, 22, 8, 18.5, -15, 0, mat, edgeMat, outlineMat);
        // Neck stud seated flush into torso top
        addCylinderMesh(localGroup, 5.8, 5.8, 5.2, 0, 2.0, 0, [0, 0, 0], mat, edgeMat, null, 14);
        break;
      }
      case 'minifig_head': {
        addCylinderMesh(localGroup, 9.5, 9.5, 22, 0, -11, 0, [0, 0, 0], mat, edgeMat, outlineMat, 18);
        addCylinderMesh(localGroup, 5.8, 5.8, 4.6, 0, 1.9, 0, [0, 0, 0], mat, edgeMat, null, 14);
        break;
      }
      case 'minifig_helmet': {
        addCylinderMesh(localGroup, 11.5, 12.2, 20, 0, -12, 0, [0, 0, 0], mat, edgeMat, outlineMat, 18);
        addBoxMesh(localGroup, 16, 8, 6, 0, -11, 10, mat, edgeMat, null);
        break;
      }
      case 'wheel': {
        addCylinderMesh(localGroup, 14, 14, 14, 0, -12, 0, [Math.PI / 2, 0, 0], mat, edgeMat, outlineMat, 20);
        break;
      }
      default: {
        // Standard brick, plate, tile, wedge_plate, technic_brick, hinge_plate
        addBoxMesh(localGroup, w, h, d, 0, -h / 2, 0, mat, edgeMat, outlineMat);
        addTopStuds(localGroup, def, mat, edgeMat);
        break;
      }
    }
  }

  // Apply world transform from PartInstance
  const worldGroup = new THREE.Group();
  worldGroup.add(localGroup);

  const r = part.rotation;
  const rotMat4 = new THREE.Matrix4().set(
    r[0], r[1], r[2], 0,
    r[3], r[4], r[5], 0,
    r[6], r[7], r[8], 0,
    0, 0, 0, 1,
  );
  localGroup.quaternion.setFromRotationMatrix(rotMat4);

  // Apply non-destructive presentation hinge rotation override if present
  if (transform && Math.abs(transform.hingeAngleDeg) > 0.1) {
    const rad = (transform.hingeAngleDeg * Math.PI) / 180;
    const axis =
      transform.hingeAxis === 'x'
        ? new THREE.Vector3(1, 0, 0)
        : transform.hingeAxis === 'y'
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(0, 0, 1);
    const hingeQ = new THREE.Quaternion().setFromAxisAngle(axis, rad);
    localGroup.quaternion.premultiply(hingeQ);
  }

  const offset = transform?.offset ?? [0, 0, 0];
  worldGroup.position.set(
    part.position[0] + offset[0],
    part.position[1] + offset[1],
    part.position[2] + offset[2],
  );

  return worldGroup;
}

/**
 * Adds a sleek 3D placement arrow pointing from an exploded/offset brick back to its snapped destination.
 */
export function buildPlacementArrow(
  from: [number, number, number],
  to: [number, number, number],
  colorHex: string,
): THREE.Group | null {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const delta = new THREE.Vector3().subVectors(end, start);
  const len = delta.length();
  if (len < 4) return null;

  const group = new THREE.Group();
  const dir = delta.clone().normalize();
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(colorHex) });

  const shaftLen = Math.max(2, len - 9);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, shaftLen, 10), mat);
  const head = new THREE.Mesh(new THREE.ConeGeometry(4.6, 10, 12), mat);

  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(up, dir);

  shaft.quaternion.copy(q);
  shaft.position.copy(start).addScaledVector(dir, shaftLen / 2);
  head.quaternion.copy(q);
  head.position.copy(start).addScaledVector(dir, shaftLen + 4);

  group.add(shaft, head);
  return group;
}
