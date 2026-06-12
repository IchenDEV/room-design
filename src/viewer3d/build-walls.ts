import * as THREE from 'three';
import type { Opening, Wall } from '../core/types';
import { wallLen } from '../core/geometry/vec';
import { glassMat, frameMat, wallMat } from './mats';
import { addDoor, addWindow } from './build-openings';
import type { DoorRef } from './build-openings';

export interface WallBuild { group: THREE.Group; doors: DoorRef[] }

/** 单面墙：带门窗洞的拉伸体（局部 X 沿墙、Y 向上、Z 为厚度） */
export function buildWall(wall: Wall, openings: Opening[]): WallBuild {
  const L = wallLen(wall);
  const H = wall.height, T = wall.thickness;
  const glass = wall.material === 'glass';
  const group = new THREE.Group();
  group.position.set(wall.a.x, 0, -wall.a.y);
  group.rotation.y = Math.atan2(wall.b.y - wall.a.y, wall.b.x - wall.a.x);

  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(L, 0);
  shape.lineTo(L, H);
  shape.lineTo(0, H);
  shape.closePath();

  const list = openings.filter((o) => o.wallId === wall.id);
  for (const o of list) {
    const c = o.t * L;
    const x0 = Math.max(1, c - o.width / 2);
    const x1 = Math.min(L - 1, c + o.width / 2);
    if (x1 - x0 < 8) continue;
    const y0 = o.kind === 'door' ? 0.2 : Math.min(o.sill, H - 30);
    const y1 = Math.min(y0 + o.height, H - 4);
    const hole = new THREE.Path();
    hole.moveTo(x0, y0);
    hole.lineTo(x1, y0);
    hole.lineTo(x1, y1);
    hole.lineTo(x0, y1);
    hole.closePath();
    shape.holes.push(hole);
  }

  const geo = new THREE.ExtrudeGeometry(shape, { depth: T, bevelEnabled: false });
  geo.translate(0, 0, -T / 2);
  const mesh = new THREE.Mesh(geo, glass ? glassMat : wallMat(wall.color));
  mesh.castShadow = !glass;
  mesh.receiveShadow = true;
  mesh.userData.wallId = wall.id;
  group.add(mesh);

  if (glass) {
    // 玻璃隔断：上下铝轨 + 竖向分格条
    const railT = Math.max(T + 2, 6);
    for (const y of [2.5, H - 2.5]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(L, 5, railT), frameMat);
      rail.position.set(L / 2, y, 0);
      rail.castShadow = true;
      group.add(rail);
    }
    const n = Math.max(1, Math.round(L / 120));
    for (let i = 1; i < n; i++) {
      const mull = new THREE.Mesh(new THREE.BoxGeometry(3, H - 10, railT - 2), frameMat);
      mull.position.set((L / n) * i, H / 2, 0);
      group.add(mull);
    }
  }

  const doors: DoorRef[] = [];
  for (const o of list) {
    if (o.kind === 'door') doors.push(...addDoor(group, o, L, T, H));
    else addWindow(group, o, L, T, H);
  }
  return { group, doors };
}
