import * as THREE from 'three';
import { box, cyl, mat } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const wardrobe: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.8, 0, tex), front = mat(shade(c, 14), 0.75, 0, tex), metal = mat('#c9c3b8', 0.3, 0.8);
  g.add(box(w, h, d, body, 0, h / 2, 0));
  for (const s of [-1, 1]) {
    g.add(box(w / 2 - 3, h - 6, 2, front, s * w / 4, h / 2, d / 2 + 1));
    g.add(cyl(1.2, 1.2, 14, metal, s * 5, h / 2, d / 2 + 3));
  }
  return g;
};

export const nightstand: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(box(w, h - 8, d, mat(c, 0.78, 0, tex), 0, (h - 8) / 2 + 8, 0));
  g.add(box(w - 6, (h - 8) / 2 - 4, 2, mat(shade(c, 16), 0.75, 0, tex), 0, h * 0.62, d / 2 + 1));
  g.add(cyl(1.4, 1.4, 1.4, mat('#cfc9bd', 0.3, 0.8), 0, h * 0.62, d / 2 + 2.4));
  g.add(box(w * 0.8, 8, d * 0.8, mat('#d8cfc0', 0.85), 0, h + 4, 0)); // 台灯底座装饰
  return g;
};

export const dresser: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(box(w, h - 4, d, mat(c, 0.78, 0, tex), 0, (h - 4) / 2, 0));
  g.add(box(w, 4, d + 3, mat(shade(c, 20), 0.7, 0, tex), 0, h - 2, 0));
  g.add(box(w * 0.42, w * 0.5, 3, mat('#aebfca', 0.1, 0.9), 0, h + w * 0.25 + 4, -d / 2 + 4));
  for (const s of [-1, 1]) g.add(box(w * 0.22, 3, d * 0.5, mat(shade(c, -20), 0.8), s * w * 0.3, h + 1.5, 0));
  return g;
};

export const fridge: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.35, 0.45, tex), seam = mat(shade(c, -35), 0.4, 0.4);
  g.add(box(w, h, d, body, 0, h / 2, 0));
  g.add(box(w - 4, 1.6, 2, seam, 0, h * 0.62, d / 2 + 0.6));
  for (const y of [h * 0.78, h * 0.36]) g.add(box(2.4, h * 0.22, 2.4, mat('#e8e4dc', 0.3, 0.6), w / 2 - 7, y, d / 2 + 2));
  return g;
};

export const washer: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(box(w, h, d, mat(c, 0.4, 0.35, tex), 0, h / 2, 0));
  const door = cyl(Math.min(w, h) * 0.3, Math.min(w, h) * 0.3, 3, mat('#3d444c', 0.15, 0.5), 0, h * 0.45, d / 2 + 1);
  door.rotation.x = Math.PI / 2;
  g.add(door);
  g.add(box(w - 8, 6, 2, mat(shade(c, -25), 0.5), 0, h - 8, d / 2 + 1));
  return g;
};

export const counter: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.8, 0, tex), top = mat('#e6e1d5', 0.5), dark = mat(shade(c, -30), 0.8);
  g.add(box(w, h - 6, d - 4, body, 0, (h - 6) / 2, 0));
  g.add(box(w, 6, d, top, 0, h - 3, 0));
  const n = Math.max(2, Math.round(w / 60));
  for (let i = 0; i < n; i++) {
    g.add(box(w / n - 5, h - 14, 2, dark, -w / 2 + (w / n) * (i + 0.5), (h - 6) / 2, d / 2 - 1));
  }
  g.add(cyl(2, 2, 14, mat('#c8c2b6', 0.25, 0.85), -w * 0.22, h + 6, -d * 0.25));
  for (const t of [[0.12, -0.15], [0.3, -0.15], [0.12, 0.15], [0.3, 0.15]]) {
    g.add(cyl(7, 7, 1.4, mat('#2c3036', 0.6), t[0] * w, h + 0.8, t[1] * d, 16));
  }
  return g;
};
