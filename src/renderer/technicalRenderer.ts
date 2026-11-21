import * as THREE from 'three';
import { CANONICAL_VIEW_MAP } from '../engine/cameraOptimizer';
import { IDENTITY_MAT3, mat3MulVec, vec3Add, vec3Scale, vec3Sub } from '../engine/math';
import type {
  CanonicalViewId,
  Mat3,
  PartInstance,
  PresentationTransform,
  ThemeSettings,
  Vec3,
} from '../types/manual';
import { buildPartMeshGroup, buildPlacementArrow } from './brickGeometry';

export interface StepRenderRequest {
  previousParts: PartInstance[];
  newParts: PartInstance[];
  viewId: CanonicalViewId;
  customAzimuthDeg?: number;
  customElevationDeg?: number;
  zoomScale?: number;
  theme: ThemeSettings;
  transforms?: Record<string, PresentationTransform>;
  insertionDirection?: Vec3;
  /** Optional whole-scene reorientation matrix (used to render SNOT subassemblies upright!) */
  sceneRotation?: Mat3;
  width: number;
  height: number;
}

class TechnicalSnapshotRenderer {
  private renderer: THREE.WebGLRenderer | null = null;
  private pliCache = new Map<string, string>();
  private stepCache = new Map<string, string>();

  private ensureRenderer(): THREE.WebGLRenderer | null {
    if (typeof document === 'undefined') return null;
    if (!this.renderer) {
      try {
        const canvas = document.createElement('canvas');
        this.renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.08;
      } catch {
        return null;
      }
    }
    return this.renderer;
  }

  clearStepCache(): void {
    this.stepCache.clear();
  }

  private buildSceneAndCamera(req: StepRenderRequest): {
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
  } {
    const scene = new THREE.Scene();

    // Crisp, official-manual studio lighting (key + cool fill + soft rim)
    const ambient = new THREE.AmbientLight(0xffffff, 0.72);
    const keyLight = new THREE.DirectionalLight(0xfffcf5, 0.92);
    keyLight.position.set(160, 260, 180);
    const fillLight = new THREE.DirectionalLight(0xdbeeff, 0.42);
    fillLight.position.set(-200, 100, -140);
    const bottomBounce = new THREE.DirectionalLight(0xffffff, 0.25);
    bottomBounce.position.set(0, -180, 60);
    scene.add(ambient, keyLight, fillLight, bottomBounce);

    const root = new THREE.Group();
    const allParts = [...req.previousParts, ...req.newParts];

    // Optional scene reorientation (e.g. build SNOT subassembly upright in its natural orientation)
    let centroid: Vec3 = [0, 0, 0];
    if (req.sceneRotation && allParts.length > 0) {
      for (const p of allParts) centroid = vec3Add(centroid, p.position);
      centroid = vec3Scale(centroid, 1 / allParts.length);
    }

    const applySceneOrientation = (p: PartInstance): PartInstance => {
      if (!req.sceneRotation) return p;
      const r = req.sceneRotation;
      const rel = vec3Sub(p.position, centroid);
      const newPos = mat3MulVec(r, rel);
      const pr = p.rotation;
      const newRot: Mat3 = [
        r[0] * pr[0] + r[1] * pr[3] + r[2] * pr[6],
        r[0] * pr[1] + r[1] * pr[4] + r[2] * pr[7],
        r[0] * pr[2] + r[1] * pr[5] + r[2] * pr[8],
        r[3] * pr[0] + r[4] * pr[3] + r[5] * pr[6],
        r[3] * pr[1] + r[4] * pr[4] + r[5] * pr[7],
        r[3] * pr[2] + r[4] * pr[5] + r[5] * pr[8],
        r[6] * pr[0] + r[7] * pr[3] + r[8] * pr[6],
        r[6] * pr[1] + r[7] * pr[4] + r[8] * pr[7],
        r[6] * pr[2] + r[7] * pr[5] + r[8] * pr[8],
      ];
      return { ...p, position: newPos, rotation: newRot };
    };

    for (const p of req.previousParts) {
      const oriented = applySceneOrientation(p);
      root.add(
        buildPartMeshGroup(oriented, {
          isNew: false,
          isFaded: true,
          theme: req.theme,
        }),
      );
    }

    const hasPrev = req.previousParts.length > 0;
    for (const p of req.newParts) {
      const oriented = applySceneOrientation(p);
      const transform = req.transforms?.[p.id];
      root.add(
        buildPartMeshGroup(oriented, {
          isNew: true,
          isFaded: false,
          theme: req.theme,
          transform,
        }),
      );

      // Draw placement arrow when part has manual offset OR global placement arrows are active on steps 2+
      if (transform && transform.showArrow && (transform.offset[0] || transform.offset[1] || transform.offset[2])) {
        const from: Vec3 = vec3Add(oriented.position, transform.offset);
        const arrow = buildPlacementArrow(from, oriented.position, req.theme.accentColor);
        if (arrow) root.add(arrow);
      } else if (req.theme.showPlacementArrows && hasPrev && req.newParts.length <= 4) {
        const dir = req.insertionDirection ?? [0, 1, 0];
        const arrowFrom: Vec3 = vec3Add(oriented.position, vec3Scale(dir, 26));
        const arrowTo: Vec3 = vec3Add(oriented.position, vec3Scale(dir, 6));
        const arrow = buildPlacementArrow(arrowFrom, arrowTo, req.theme.accentColor);
        if (arrow) root.add(arrow);
      }
    }

    scene.add(root);

    // Frame bounding box cleanly inside orthographic camera
    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    if (box.isEmpty()) {
      center.set(0, 0, 0);
      size.set(60, 60, 60);
    } else {
      box.getCenter(center);
      box.getSize(size);
    }

    const viewSpec = CANONICAL_VIEW_MAP[req.viewId];
    const azDeg = req.customAzimuthDeg ?? viewSpec.azimuthDeg;
    const elDeg = req.customElevationDeg ?? viewSpec.elevationDeg;
    const az = (azDeg * Math.PI) / 180;
    const el = (elDeg * Math.PI) / 180;

    const radius = Math.max(size.length() * 0.55, 24);
    const dist = radius * 3.6;

    const aspect = req.width / Math.max(1, req.height);
    const zoom = req.zoomScale ?? 1;
    const halfH = (radius * 1.18) / Math.max(0.35, zoom);
    const halfW = halfH * aspect;

    const camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 1, dist * 5);
    camera.position.set(
      center.x + dist * Math.sin(az) * Math.cos(el),
      center.y + dist * Math.sin(el),
      center.z + dist * Math.cos(az) * Math.cos(el),
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();

    return { scene, camera };
  }

  renderStepDataUrl(cacheKey: string, req: StepRenderRequest): string | null {
    const cached = this.stepCache.get(cacheKey);
    if (cached) return cached;

    const renderer = this.ensureRenderer();
    if (!renderer) return null;

    renderer.setSize(req.width, req.height, false);
    const { scene, camera } = this.buildSceneAndCamera(req);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);

    const url = renderer.domElement.toDataURL('image/png');
    // Limit cache size to avoid memory bloat on 200-page manuals
    if (this.stepCache.size > 120) {
      const firstKey = this.stepCache.keys().next().value;
      if (firstKey) this.stepCache.delete(firstKey);
    }
    this.stepCache.set(cacheKey, url);
    return url;
  }

  renderPliThumbnail(partId: string, colorId: number, theme: ThemeSettings): string | null {
    const key = `${partId}:${colorId}:${theme.showEdgeLines ? 1 : 0}`;
    const cached = this.pliCache.get(key);
    if (cached) return cached;

    const dummyPart: PartInstance = {
      id: 'pli_preview',
      signature: key,
      partId,
      partName: partId,
      colorId,
      position: [0, 0, 0],
      rotation: IDENTITY_MAT3,
      submodelPath: [],
      originalStepIndex: 0,
    };

    const previewTheme: ThemeSettings = {
      ...theme,
      highlightNewParts: false,
      fadePreviousParts: false,
      showPlacementArrows: false,
    };

    const renderer = this.ensureRenderer();
    if (!renderer) return null;

    renderer.setSize(128, 128, false);
    const { scene, camera } = this.buildSceneAndCamera({
      previousParts: [],
      newParts: [dummyPart],
      viewId: 'top_front_right',
      theme: previewTheme,
      width: 128,
      height: 128,
      zoomScale: 1.05,
    });
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);

    const url = renderer.domElement.toDataURL('image/png');
    this.pliCache.set(key, url);
    return url;
  }
}

export const technicalRenderer = new TechnicalSnapshotRenderer();
