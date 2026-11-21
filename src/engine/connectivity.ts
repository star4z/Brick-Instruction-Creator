import { resolvePartDefinition } from '../data/partCatalog';
import { partsProvider } from './partsProvider';
import type {
  ConnectionEdge,
  ConnectionType,
  ConnectivityGraph,
  FloatingPartWarning,
  PartInstance,
  SnapKind,
  Vec3,
} from '../types/manual';
import {
  transformNormal,
  transformPoint,
  vec3Dist,
  vec3Dot,
  vec3Normalize,
  vec3Sub,
} from './math';

interface WorldSnap {
  kind: SnapKind;
  position: Vec3;
  normal: Vec3;
  radius: number;
}

interface WorldAabb {
  min: Vec3;
  max: Vec3;
  center: Vec3;
}

export function computePartWorldAabb(part: PartInstance): WorldAabb {
  const raw = partsProvider.getCachedRawGeometry(part.partId);
  const def = resolvePartDefinition(part.partId);
  const [minX, minY, minZ] = raw ? raw.boundsMin : def.boundsMin;
  const [maxX, maxY, maxZ] = raw ? raw.boundsMax : def.boundsMax;

  const corners: Vec3[] = [
    [minX, minY, minZ],
    [maxX, minY, minZ],
    [minX, maxY, minZ],
    [maxX, maxY, minZ],
    [minX, minY, maxZ],
    [maxX, minY, maxZ],
    [minX, maxY, maxZ],
    [maxX, maxY, maxZ],
  ];

  const outMin: Vec3 = [Infinity, Infinity, Infinity];
  const outMax: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const c of corners) {
    const w = transformPoint(part.position, part.rotation, c);
    for (let i = 0; i < 3; i++) {
      if (w[i] < outMin[i]) outMin[i] = w[i];
      if (w[i] > outMax[i]) outMax[i] = w[i];
    }
  }
  return {
    min: outMin,
    max: outMax,
    center: [
      (outMin[0] + outMax[0]) / 2,
      (outMin[1] + outMax[1]) / 2,
      (outMin[2] + outMax[2]) / 2,
    ],
  };
}

function getWorldSnaps(part: PartInstance): WorldSnap[] {
  const def = resolvePartDefinition(part.partId);
  return def.snaps.map((s) => ({
    kind: s.kind,
    position: transformPoint(part.position, part.rotation, s.position),
    normal: transformNormal(part.rotation, s.normal),
    radius: s.radius ?? 4,
  }));
}

function aabbGap(a: WorldAabb, b: WorldAabb): number {
  const dx = Math.max(0, a.min[0] - b.max[0], b.min[0] - a.max[0]);
  const dy = Math.max(0, a.min[1] - b.max[1], b.min[1] - a.max[1]);
  const dz = Math.max(0, a.min[2] - b.max[2], b.min[2] - a.max[2]);
  return Math.hypot(dx, dy, dz);
}

function matchSnapPair(
  sa: WorldSnap,
  sb: WorldSnap,
  toleranceLdu: number,
): { type: ConnectionType; strength: number; direction: Vec3; gap: number } | null {
  const dist = vec3Dist(sa.position, sb.position);

  // Stud <-> Anti-Stud (including SNOT side_stud <-> anti_stud)
  const isStudAnti =
    (sa.kind === 'stud' && sb.kind === 'anti_stud') ||
    (sa.kind === 'anti_stud' && sb.kind === 'stud');
  const isSnotAnti =
    (sa.kind === 'side_stud' && sb.kind === 'anti_stud') ||
    (sa.kind === 'anti_stud' && sb.kind === 'side_stud');

  if ((isStudAnti || isSnotAnti) && dist <= 4.5 + toleranceLdu) {
    const dot = vec3Dot(sa.normal, sb.normal);
    if (dot < -0.75) {
      const dir = sa.kind === 'anti_stud' ? sb.normal : sa.normal;
      return {
        type: isSnotAnti ? 'snot' : 'stud',
        strength: isSnotAnti ? 2.6 : 3.0,
        direction: dir,
        gap: dist,
      };
    }
  }

  // Bar/Rod <-> Clip (rods can enter clips from any perpendicular or axial orientation)
  const isBarClip =
    (sa.kind === 'bar' && sb.kind === 'clip') ||
    (sa.kind === 'clip' && sb.kind === 'bar');
  if (isBarClip && dist <= 8.5 + toleranceLdu) {
    const dir = sa.kind === 'clip' ? sa.normal : sb.normal;
    return {
      type: 'bar_clip',
      strength: 2.4,
      direction: dir,
      gap: dist,
    };
  }

  // Bar <-> hollow stud / round plate / bar holder
  const isBarStud =
    (sa.kind === 'bar' && (sb.kind === 'stud' || sb.kind === 'anti_stud')) ||
    (sb.kind === 'bar' && (sa.kind === 'stud' || sa.kind === 'anti_stud'));
  if (isBarStud && dist <= 6.5 + toleranceLdu) {
    return {
      type: 'bar_clip',
      strength: 2.0,
      direction: sa.kind === 'bar' ? sa.normal : sb.normal,
      gap: dist,
    };
  }

  // Technic Pin <-> Pin Hole, Axle <-> Axle Hole
  const isPin =
    (sa.kind === 'pin' && sb.kind === 'pin_hole') ||
    (sa.kind === 'pin_hole' && sb.kind === 'pin') ||
    (sa.kind === 'axle' && sb.kind === 'axle_hole') ||
    (sa.kind === 'axle_hole' && sb.kind === 'axle');
  if (isPin && dist <= 5.5 + toleranceLdu) {
    return {
      type: 'technic',
      strength: 2.8,
      direction: sa.normal,
      gap: dist,
    };
  }

  // Hinge <-> Hinge
  if (sa.kind === 'hinge' && sb.kind === 'hinge' && dist <= 6.0 + toleranceLdu) {
    return {
      type: 'hinge',
      strength: 2.2,
      direction: sa.normal,
      gap: dist,
    };
  }

  return null;
}

/**
 * Builds the Hybrid Connectivity Graph for a CanonicalModel:
 * 1. Typed snap matching (studs, SNOT side studs, bars/rods, clips, Technic pins/axles, hinges)
 * 2. 3D AABB surface-contact proximity fallback within configurable Studio tolerance
 * 3. Connected component extraction (chapters) & floating-part diagnostics
 */
export function buildConnectivityGraph(
  parts: PartInstance[],
  snapToleranceLdu = 2.5,
): ConnectivityGraph {
  const aabbs = new Map<string, WorldAabb>();
  const snaps = new Map<string, WorldSnap[]>();
  const adjacency: Record<string, ConnectionEdge[]> = {};

  for (const part of parts) {
    aabbs.set(part.id, computePartWorldAabb(part));
    snaps.set(part.id, getWorldSnaps(part));
    adjacency[part.id] = [];
  }

  const edges: ConnectionEdge[] = [];

  for (let i = 0; i < parts.length; i++) {
    const pa = parts[i];
    const boxA = aabbs.get(pa.id)!;
    const snapsA = snaps.get(pa.id)!;

    for (let j = i + 1; j < parts.length; j++) {
      const pb = parts[j];
      const boxB = aabbs.get(pb.id)!;

      // Fast broad-phase rejection
      const boxDist = aabbGap(boxA, boxB);
      if (boxDist > 18 + snapToleranceLdu) continue;

      const snapsB = snaps.get(pb.id)!;
      let bestMatch: {
        type: ConnectionType;
        strength: number;
        direction: Vec3;
        gap: number;
      } | null = null;
      let matchCount = 0;

      for (const sa of snapsA) {
        for (const sb of snapsB) {
          const m = matchSnapPair(sa, sb, snapToleranceLdu);
          if (m) {
            matchCount += 1;
            if (!bestMatch || m.strength > bestMatch.strength || (m.strength === bestMatch.strength && m.gap < bestMatch.gap)) {
              bestMatch = m;
            }
          }
        }
      }

      if (bestMatch) {
        const edge: ConnectionEdge = {
          a: pa.id,
          b: pb.id,
          type: bestMatch.type,
          strength: bestMatch.strength + Math.min(3, (matchCount - 1) * 0.5),
          direction: bestMatch.direction,
          gap: bestMatch.gap,
        };
        edges.push(edge);
        adjacency[pa.id].push(edge);
        adjacency[pb.id].push({
          ...edge,
          a: pb.id,
          b: pa.id,
          direction: [-edge.direction[0], -edge.direction[1], -edge.direction[2]],
        });
      } else if (boxDist <= snapToleranceLdu) {
        // Check genuine surface contact (not just diagonal corner grazing)
        const overlapX = Math.min(boxA.max[0], boxB.max[0]) - Math.max(boxA.min[0], boxB.min[0]);
        const overlapY = Math.min(boxA.max[1], boxB.max[1]) - Math.max(boxA.min[1], boxB.min[1]);
        const overlapZ = Math.min(boxA.max[2], boxB.max[2]) - Math.max(boxA.min[2], boxB.min[2]);
        const positiveAxes = [overlapX, overlapY, overlapZ].filter((o) => o > 2).length;
        if (positiveAxes >= 2) {
          const dir = vec3Normalize(vec3Sub(boxB.center, boxA.center));
          const edge: ConnectionEdge = {
            a: pa.id,
            b: pb.id,
            type: 'proximity',
            strength: 1.0,
            direction: dir,
            gap: boxDist,
          };
          edges.push(edge);
          adjacency[pa.id].push(edge);
          adjacency[pb.id].push({
            ...edge,
            a: pb.id,
            b: pa.id,
            direction: [-dir[0], -dir[1], -dir[2]],
          });
        }
      }
    }
  }

  // Extract connected components via BFS
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const part of parts) {
    if (visited.has(part.id)) continue;
    const comp: string[] = [];
    const queue: string[] = [part.id];
    visited.add(part.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      comp.push(curr);
      for (const edge of adjacency[curr] ?? []) {
        if (!visited.has(edge.b)) {
          visited.add(edge.b);
          queue.push(edge.b);
        }
      }
    }
    components.push(comp);
  }

  // Identify genuinely floating singletons (when model has >1 part)
  const floatingWarnings: FloatingPartWarning[] = [];
  if (parts.length > 1) {
    for (const comp of components) {
      if (comp.length === 1) {
        const inst = parts.find((p) => p.id === comp[0])!;
        const box = aabbs.get(inst.id)!;
        let nearest = Infinity;
        for (const other of parts) {
          if (other.id === inst.id) continue;
          const d = aabbGap(box, aabbs.get(other.id)!);
          if (d < nearest) nearest = d;
        }
        floatingWarnings.push({
          partId: inst.partId,
          partName: inst.partName,
          instanceId: inst.id,
          nearestDistance: Math.round(nearest * 10) / 10,
          message: `${inst.partName} (${inst.partId}) has no detected physical connection (nearest part is ${nearest.toFixed(1)} LDU away).`,
        });
      }
    }
  }

  return {
    edges,
    adjacency,
    components,
    floatingWarnings,
  };
}
