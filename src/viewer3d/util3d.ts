import * as THREE from 'three';
import type { Wall } from '../core/types';

/** 释放组内全部几何与材质并清空 */
export function disposeGroup(g: THREE.Group) {
  g.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry?.dispose();
      const m = mesh.material;
      if (Array.isArray(m)) m.forEach((x) => x.dispose());
      else m?.dispose();
    }
  });
  g.clear();
}

export interface Bounds { center: THREE.Vector3; radius: number }

/** 根据墙体求场景中心与半径（3D 坐标） */
export function sceneBounds(walls: Wall[]): Bounds {
  if (!walls.length) return { center: new THREE.Vector3(450, 0, -350), radius: 700 };
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const w of walls) {
    for (const p of [w.a, w.b]) {
      minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
    }
  }
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  const radius = Math.max(300, Math.hypot(maxX - minX, maxY - minY) / 2);
  return { center: new THREE.Vector3(cx, 0, -cy), radius };
}
