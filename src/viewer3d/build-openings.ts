import * as THREE from 'three';
import type { Opening } from '../core/types';
import { glassMat, frameMat, darkFrameMat, woodDoorMat, handleMat } from './mats';

export interface DoorRef { pivot: THREE.Group; openAngle: number }

const bar = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  return mesh;
};

/** 门：含门框 + 可动门扇（pivot 铰链在洞口一侧） */
export function addDoor(g: THREE.Group, o: Opening, L: number, T: number, H: number): DoorRef {
  const w = o.width, h = Math.min(o.height, H - 6);
  const c = o.t * L;
  const x0 = c - w / 2, x1 = c + w / 2;
  const jm = o.style === 'glass' ? frameMat : darkFrameMat;
  g.add(bar(4, h, T + 2, jm, x0 + 2, h / 2, 0));
  g.add(bar(4, h, T + 2, jm, x1 - 2, h / 2, 0));
  g.add(bar(w, 4, T + 2, jm, c, h - 2, 0));

  const pivot = new THREE.Group();
  const hingeX = o.flip ? x1 - 2 : x0 + 2;
  pivot.position.set(hingeX, 0, 0);
  const pw = w - 6, sign = o.flip ? -1 : 1;
  const panel = new THREE.Group();
  if (o.style === 'glass') {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(pw - 6, h - 12, 1.6), glassMat);
    pane.position.set(0, 0, 0);
    panel.add(pane);
    panel.add(bar(pw, 5, 3.4, frameMat, 0, h / 2 - 5.5, 0));
    panel.add(bar(pw, 5, 3.4, frameMat, 0, -h / 2 + 8.5, 0));
    panel.add(bar(4, h - 6, 3.4, frameMat, -pw / 2 + 2, 1.5, 0));
    panel.add(bar(4, h - 6, 3.4, frameMat, pw / 2 - 2, 1.5, 0));
  } else {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(pw, h - 6, 4.2), woodDoorMat);
    slab.castShadow = true;
    panel.add(slab);
    for (const s of [-1, 1]) {
      const knob = new THREE.Mesh(new THREE.SphereGeometry(3, 14, 10), handleMat);
      knob.position.set(sign * (pw / 2 - 9), -h * 0.04, s * 4);
      panel.add(knob);
    }
  }
  panel.position.set(sign * pw / 2, h / 2, 0);
  pivot.add(panel);
  g.add(pivot);
  return { pivot, openAngle: sign * Math.PI * 0.52 };
}

/** 窗：铝框 + 玻璃 + 中梃 */
export function addWindow(g: THREE.Group, o: Opening, L: number, T: number, H: number) {
  const w = o.width;
  const y0 = Math.min(o.sill, H - 30);
  const h = Math.min(o.height, H - y0 - 6);
  const c = o.t * L;
  const yc = y0 + h / 2;
  g.add(bar(w, 5, T + 2, frameMat, c, y0 + 2.5, 0));
  g.add(bar(w, 5, T + 2, frameMat, c, y0 + h - 2.5, 0));
  g.add(bar(5, h, T + 2, frameMat, c - w / 2 + 2.5, yc, 0));
  g.add(bar(5, h, T + 2, frameMat, c + w / 2 - 2.5, yc, 0));
  g.add(bar(4, h - 8, 3, frameMat, c, yc, 0));
  const pane = new THREE.Mesh(new THREE.BoxGeometry(w - 8, h - 8, 1.2), glassMat);
  pane.position.set(c, yc, 0);
  g.add(pane);
}
