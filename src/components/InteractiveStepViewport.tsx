import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CANONICAL_VIEW_MAP } from '../engine/cameraOptimizer';
import { vec3Add, vec3Scale } from '../engine/math';
import { buildPartMeshGroup, buildPlacementArrow } from '../renderer/brickGeometry';
import type {
  CanonicalViewId,
  PartInstance,
  PresentationTransform,
  ThemeSettings,
  Vec3,
} from '../types/manual';

interface Props {
  previousParts: PartInstance[];
  newParts: PartInstance[];
  viewId: CanonicalViewId;
  initialAzimuthDeg?: number;
  initialElevationDeg?: number;
  theme: ThemeSettings;
  transforms?: Record<string, PresentationTransform>;
  insertionDirection?: Vec3;
  onSaveAngle: (azimuthDeg: number, elevationDeg: number) => void;
  onClose: () => void;
}

export function InteractiveStepViewport({
  previousParts,
  newParts,
  viewId,
  initialAzimuthDeg,
  initialElevationDeg,
  theme,
  transforms,
  insertionDirection,
  onSaveAngle,
  onClose,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spec = CANONICAL_VIEW_MAP[viewId];
  const [angles, setAngles] = useState({
    az: initialAzimuthDeg ?? spec.azimuthDeg,
    el: initialElevationDeg ?? spec.elevationDeg,
  });
  const anglesRef = useRef(angles);
  anglesRef.current = angles;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const width = el.clientWidth || 500;
    const height = el.clientHeight || 360;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.innerHTML = '';
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xffffff, 0.72));
    const key = new THREE.DirectionalLight(0xfffcf5, 0.92);
    key.position.set(160, 260, 180);
    const fill = new THREE.DirectionalLight(0xdbeeff, 0.42);
    fill.position.set(-200, 100, -140);
    scene.add(key, fill);

    const root = new THREE.Group();
    for (const p of previousParts) {
      root.add(buildPartMeshGroup(p, { isNew: false, isFaded: true, theme }));
    }
    for (const p of newParts) {
      const tr = transforms?.[p.id];
      root.add(buildPartMeshGroup(p, { isNew: true, isFaded: false, theme, transform: tr }));
      if (tr && tr.showArrow && (tr.offset[0] || tr.offset[1] || tr.offset[2])) {
        const arrow = buildPlacementArrow(vec3Add(p.position, tr.offset), p.position, theme.accentColor);
        if (arrow) root.add(arrow);
      } else if (theme.showPlacementArrows && previousParts.length > 0 && newParts.length <= 4) {
        const dir = insertionDirection ?? [0, 1, 0];
        const arrow = buildPlacementArrow(
          vec3Add(p.position, vec3Scale(dir, 26)),
          vec3Add(p.position, vec3Scale(dir, 6)),
          theme.accentColor,
        );
        if (arrow) root.add(arrow);
      }
    }
    scene.add(root);

    const box = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    if (!box.isEmpty()) {
      box.getCenter(center);
      box.getSize(size);
    } else {
      size.set(60, 60, 60);
    }
    const radius = Math.max(size.length() * 0.55, 24);
    const dist = radius * 3.6;

    const aspect = width / Math.max(1, height);
    const halfH = radius * 1.18;
    const camera = new THREE.OrthographicCamera(
      -halfH * aspect,
      halfH * aspect,
      halfH,
      -halfH,
      1,
      dist * 5,
    );

    let rafId = 0;
    const renderFrame = () => {
      const azRad = (anglesRef.current.az * Math.PI) / 180;
      const elRad = (anglesRef.current.el * Math.PI) / 180;
      camera.position.set(
        center.x + dist * Math.sin(azRad) * Math.cos(elRad),
        center.y + dist * Math.sin(elRad),
        center.z + dist * Math.cos(azRad) * Math.cos(elRad),
      );
      camera.lookAt(center);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(renderFrame);
    };
    renderFrame();

    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      setAngles((prev) => ({
        az: (prev.az - dx * 0.7 + 360) % 360,
        el: Math.max(-75, Math.min(75, prev.el + dy * 0.55)),
      }));
    };
    const onUp = () => {
      dragging = false;
    };

    const dom = renderer.domElement;
    dom.style.cursor = 'grab';
    dom.style.touchAction = 'none';
    dom.addEventListener('pointerdown', onDown);
    dom.addEventListener('pointermove', onMove);
    dom.addEventListener('pointerup', onUp);

    return () => {
      cancelAnimationFrame(rafId);
      dom.removeEventListener('pointerdown', onDown);
      dom.removeEventListener('pointermove', onMove);
      dom.removeEventListener('pointerup', onUp);
      renderer.dispose();
    };
  }, [previousParts, newParts, theme, transforms, insertionDirection]);

  return (
    <div className="relative w-full h-full min-h-[260px] flex flex-col">
      <div ref={containerRef} className="flex-1 w-full h-full" />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 bg-white/92 backdrop-blur-sm border border-[#dcd9d0] rounded-lg px-2.5 py-1.5 text-xs shadow-sm">
        <span className="font-mono-tech text-[#5a5f66]">
          Drag to orbit · Az {Math.round(angles.az)}° · El {Math.round(angles.el)}°
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSaveAngle(Math.round(angles.az), Math.round(angles.el))}
            className="px-2.5 py-1 rounded-md bg-[#006cb7] text-white font-semibold hover:bg-[#005799] transition cursor-pointer"
          >
            Lock Angle for Step
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-md border border-[#dcd9d0] bg-white text-[#17191c] font-medium hover:bg-[#f4f3ef] transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
