import * as THREE from 'three';
import { box, cyl, legs4, mat } from './parts';
import { shade } from '../../core/geometry/vec';

export type Builder = (w: number, d: number, h: number, c: string) => THREE.Group;

export const sofa: Builder = (w, d, h, c) => {
  const g = new THREE.Group();
  const fab = mat(c, 0.92), cush = mat(shade(c, 18), 0.95), wood = mat('#6f553c', 0.7);
  g.add(box(w, h * 0.32, d * 0.95, fab, 0, 8 + h * 0.16, 0));
  const seats = w > 150 ? 3 : w > 100 ? 2 : 1;
  const sw = (w - w * 0.26) / seats;
  for (let i = 0; i < seats; i++) {
    g.add(box(sw - 5, h * 0.15, d * 0.58, cush, -(w - w * 0.26) / 2 + sw * (i + 0.5), 8 + h * 0.38, d * 0.08));
  }
  g.add(box(w, h * 0.62, d * 0.22, fab, 0, 8 + h * 0.31, -d / 2 + d * 0.11));
  for (const s of [-1, 1]) g.add(box(w * 0.12, h * 0.52, d * 0.86, fab, s * (w / 2 - w * 0.06), 8 + h * 0.26, 0));
  legs4(g, w * 0.92, d * 0.8, 8, 3, wood);
  return g;
};

export const chair: Builder = (w, d, h, c) => {
  const g = new THREE.Group();
  const m1 = mat(c, 0.85), wood = mat('#7b5c3a', 0.7);
  g.add(box(w, 5, d, m1, 0, h * 0.5, 0));
  g.add(box(w, h * 0.48, 4.5, m1, 0, h * 0.74, -d / 2 + 2.5));
  legs4(g, w * 0.9, d * 0.9, h * 0.5 - 2.5, 2.2, wood);
  return g;
};

export const stool: Builder = (w, d, h, c) => {
  const g = new THREE.Group();
  g.add(box(w, 6, d, mat(c, 0.85), 0, h - 3, 0));
  legs4(g, w * 0.85, d * 0.85, h - 6, 2.4, mat(shade(c, -50), 0.7));
  return g;
};

export const barstool: Builder = (w, d, h, c) => {
  const g = new THREE.Group();
  const metal = mat('#9aa0a6', 0.35, 0.8);
  g.add(cyl(w / 2 - 2, w / 2 - 2, 7, mat(c, 0.85), 0, h - 3.5, 0));
  g.add(cyl(2.6, 2.6, h - 12, metal, 0, (h - 12) / 2 + 5, 0));
  g.add(cyl(w * 0.32, w * 0.32, 2, metal, 0, h * 0.35, 0));
  g.add(cyl(w * 0.42, w * 0.42, 3, metal, 0, 1.5, 0));
  return g;
};

export const bench: Builder = (w, d, h, c) => {
  const g = new THREE.Group();
  g.add(box(w, 6.5, d, mat(c, 0.8), 0, h - 3.2, 0));
  legs4(g, w * 0.9, d * 0.8, h - 6.5, 3, mat(shade(c, -55), 0.75));
  return g;
};
