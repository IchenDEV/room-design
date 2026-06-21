import * as THREE from 'three';
import type { Project, Wall } from '../core/types';
import { wallLen } from '../core/geometry/vec';

const WALK_RADIUS = 28;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function inDoorGap(project: Project, wall: Wall, t: number): boolean {
  const len = wallLen(wall);
  return project.openings.some((o) => {
    if (o.wallId !== wall.id || o.kind !== 'door') return false;
    return Math.abs(t - o.t) * len < Math.max(0, o.width / 2 - WALK_RADIUS);
  });
}

function hitsWall(project: Project, x: number, z: number): boolean {
  const py = -z;
  for (const w of project.walls) {
    const dx = w.b.x - w.a.x, dy = w.b.y - w.a.y;
    const len2 = dx * dx + dy * dy;
    if (len2 < 4) continue;
    const t = clamp01(((x - w.a.x) * dx + (py - w.a.y) * dy) / len2);
    if (inDoorGap(project, w, t)) continue;
    const cx = w.a.x + dx * t, cy = w.a.y + dy * t;
    const limit = WALK_RADIUS + w.thickness / 2;
    if (Math.hypot(x - cx, py - cy) < limit) return true;
  }
  return false;
}

export function moveWithCollision(project: Project, from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 {
  if (!project.settings.solidCollision) return to;
  if (!hitsWall(project, to.x, to.z)) return to;
  const xOnly = new THREE.Vector3(to.x, to.y, from.z);
  if (!hitsWall(project, xOnly.x, xOnly.z)) return xOnly;
  const zOnly = new THREE.Vector3(from.x, to.y, to.z);
  if (!hitsWall(project, zOnly.x, zOnly.z)) return zOnly;
  return from.clone();
}
