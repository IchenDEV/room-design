import * as THREE from 'three';
import { box, cyl, legs4, mat, rodX, rodZ, softBox, torus } from './parts';
import { shade } from '../../core/geometry/vec';
import type { FurnTexture } from '../../core/catalog/catalog';

export type Builder = (w: number, d: number, h: number, c: string, texture?: FurnTexture) => THREE.Group;

export const sofa: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const fab = mat(c, 0.92, 0, tex), cush = mat(shade(c, 18), 0.95, 0, tex);
  const seam = mat(shade(c, -26), 0.96, 0, tex), wood = mat('#6f553c', 0.7);
  g.add(softBox(w, h * 0.32, d * 0.95, fab, 0, 8 + h * 0.16, 0, 5));
  const seats = w > 150 ? 3 : w > 100 ? 2 : 1;
  const sw = (w - w * 0.26) / seats;
  for (let i = 0; i < seats; i++) {
    const x = -(w - w * 0.26) / 2 + sw * (i + 0.5);
    g.add(softBox(sw - 5, h * 0.15, d * 0.58, cush, x, 8 + h * 0.38, d * 0.08, 4));
    g.add(softBox(sw - 7, h * 0.32, d * 0.08, cush, x, 8 + h * 0.55, -d * 0.35, 3));
    g.add(rodX(sw - 12, 0.8, seam, x, 8 + h * 0.47, d * 0.37));
  }
  g.add(softBox(w, h * 0.62, d * 0.22, fab, 0, 8 + h * 0.31, -d / 2 + d * 0.11, 5));
  for (const s of [-1, 1]) {
    g.add(softBox(w * 0.12, h * 0.52, d * 0.86, fab, s * (w / 2 - w * 0.06), 8 + h * 0.26, 0, 4));
  }
  if (w > 110) {
    g.add(softBox(w * 0.16, h * 0.18, d * 0.1, mat(shade(c, 45), 0.96), -w * 0.25, 8 + h * 0.55, -d * 0.06, 3));
    g.add(softBox(w * 0.14, h * 0.16, d * 0.1, mat(shade(c, -18), 0.96), w * 0.23, 8 + h * 0.52, -d * 0.02, 3));
  }
  legs4(g, w * 0.92, d * 0.8, 8, 3, wood);
  return g;
};

export const chair: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const m1 = mat(c, 0.85, 0, tex), wood = mat('#7b5c3a', 0.7);
  g.add(softBox(w, 5.5, d, m1, 0, h * 0.5, 0, 2.8));
  g.add(softBox(w * 0.9, h * 0.46, 5, m1, 0, h * 0.74, -d / 2 + 3, 2.5));
  g.add(rodX(w * 0.7, 1.2, wood, 0, h * 0.88, -d / 2 + 6));
  legs4(g, w * 0.9, d * 0.9, h * 0.5 - 2.5, 2.2, wood);
  return g;
};

export const stool: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const wood = mat(shade(c, -50), 0.7);
  g.add(softBox(w, 6, d, mat(c, 0.85, 0, tex), 0, h - 3, 0, 2.5));
  legs4(g, w * 0.85, d * 0.85, h - 6, 2.4, wood);
  g.add(rodX(w * 0.62, 1, wood, 0, h * 0.42, d * 0.34));
  g.add(rodZ(d * 0.62, 1, wood, w * 0.34, h * 0.42, 0));
  return g;
};

export const barstool: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const metal = mat('#9aa0a6', 0.35, 0.8);
  g.add(cyl(w / 2 - 2, w / 2 - 2, 7, mat(c, 0.85, 0, tex), 0, h - 3.5, 0));
  g.add(cyl(2.6, 2.6, h - 12, metal, 0, (h - 12) / 2 + 5, 0));
  const foot = torus(w * 0.32, 1.1, metal, 0, h * 0.35, 0);
  foot.rotation.x = Math.PI / 2;
  g.add(foot);
  g.add(cyl(w * 0.42, w * 0.42, 3, metal, 0, 1.5, 0));
  g.add(rodX(w * 0.34, 1.1, metal, 0, h * 0.5, d * 0.22));
  return g;
};

export const bench: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const wood = mat(shade(c, -55), 0.75);
  g.add(softBox(w, 6.5, d, mat(c, 0.8, 0, tex), 0, h - 3.2, 0, 2.5));
  g.add(box(w * 0.88, 1.5, d * 0.74, mat(shade(c, 18), 0.82, 0, tex), 0, h + 0.8, 0));
  legs4(g, w * 0.9, d * 0.8, h - 6.5, 3, wood);
  g.add(rodX(w * 0.72, 1.1, wood, 0, h * 0.46, -d * 0.31));
  return g;
};
