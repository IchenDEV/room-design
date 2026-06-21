import * as THREE from 'three';
import { box, cyl, mat, rodX, softBox, torus } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const wardrobe: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.8, 0, tex), front = mat(shade(c, 14), 0.75, 0, tex), metal = mat('#c9c3b8', 0.3, 0.8);
  g.add(softBox(w, h, d, body, 0, h / 2, 0, 2.4));
  g.add(box(w * 0.96, 3, d + 2, mat(shade(c, -22), 0.78, 0, tex), 0, h - 1.5, 0));
  for (const s of [-1, 1]) {
    g.add(softBox(w / 2 - 3, h - 8, 2, front, s * w / 4, h / 2, d / 2 + 1, 1.6));
    g.add(box(1.2, h - 18, 2.2, mat(shade(c, -18), 0.82, 0, tex), s * 1.2, h / 2, d / 2 + 2));
    g.add(cyl(1.1, 1.1, 18, metal, s * 5, h / 2, d / 2 + 3));
  }
  return g;
};

export const nightstand: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.78, 0, tex), front = mat(shade(c, 16), 0.75, 0, tex), metal = mat('#cfc9bd', 0.3, 0.8);
  g.add(softBox(w, h - 8, d, body, 0, (h - 8) / 2 + 8, 0, 2));
  for (const y of [h * 0.44, h * 0.68]) {
    g.add(softBox(w - 7, h * 0.18, 2, front, 0, y, d / 2 + 1, 1.2));
    g.add(rodX(w * 0.28, 0.8, metal, 0, y + h * 0.02, d / 2 + 2.5));
  }
  g.add(softBox(w * 0.74, 5, d * 0.72, mat('#d8cfc0', 0.85), 0, h + 2.5, 0, 2));
  return g;
};

export const dresser: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.78, 0, tex), front = mat(shade(c, 12), 0.75, 0, tex), metal = mat('#b8b2a8', 0.3, 0.75);
  g.add(softBox(w, h - 4, d, body, 0, (h - 4) / 2, 0, 2));
  g.add(softBox(w, 4, d + 3, mat(shade(c, 20), 0.7, 0, tex), 0, h - 2, 0, 1.4));
  g.add(softBox(w * 0.48, w * 0.56, 3, mat('#aebfca', 0.1, 0.9), 0, h + w * 0.28 + 4, -d / 2 + 4, 2));
  g.add(box(w * 0.54, 3, 4, mat(shade(c, -30), 0.72, 0, tex), 0, h + 4, -d / 2 + 4));
  for (let row = 0; row < 3; row++) {
    const y = h * (0.23 + row * 0.22);
    for (const s of [-1, 1]) {
      g.add(softBox(w * 0.44, h * 0.16, 2, front, s * w * 0.24, y, d / 2 + 1, 1.2));
      g.add(rodX(w * 0.18, 0.75, metal, s * w * 0.24, y, d / 2 + 2.5));
    }
  }
  return g;
};

export const fridge: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.35, 0.45, tex), seam = mat(shade(c, -35), 0.4, 0.4);
  g.add(softBox(w, h, d, body, 0, h / 2, 0, 2.5));
  g.add(box(w - 4, 1.6, 2, seam, 0, h * 0.62, d / 2 + 0.6));
  g.add(softBox(w * 0.22, h * 0.12, 2.2, mat('#263746', 0.28, 0.4), -w * 0.18, h * 0.77, d / 2 + 1.2, 1));
  for (const y of [h * 0.78, h * 0.36]) g.add(box(2.4, h * 0.22, 2.4, mat('#e8e4dc', 0.3, 0.6), w / 2 - 7, y, d / 2 + 2));
  return g;
};

export const waterdispenser: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const bodyH = h * 0.72, r = Math.min(w, d) * 0.24;
  const body = mat(c, 0.55, 0.05, tex), dark = mat('#4a535c', 0.45, 0.2);
  const water = new THREE.MeshStandardMaterial({ color: '#9fd2e7', roughness: 0.2, metalness: 0.02 });
  g.add(softBox(w * 0.82, bodyH, d * 0.82, body, 0, bodyH / 2, 0, 2));
  g.add(box(w * 0.52, h * 0.24, 2, dark, 0, bodyH * 0.55, d * 0.42 + 1));
  g.add(box(w * 0.42, 4, 5, mat(shade(c, -28), 0.55), 0, bodyH * 0.32, d * 0.42 + 2.5));
  for (const x of [-w * 0.12, w * 0.12]) g.add(box(w * 0.08, 3, 5, mat('#dfe6ea', 0.35, 0.2), x, bodyH * 0.6, d * 0.42 + 3));
  g.add(cyl(r * 0.72, r, h * 0.2, water, 0, bodyH + h * 0.1, 0, 28));
  g.add(cyl(r * 0.32, r * 0.32, h * 0.08, water, 0, bodyH + h * 0.24, 0, 20));
  g.add(box(w * 0.9, 5, d * 0.88, mat(shade(c, -18), 0.62), 0, 2.5, 0));
  return g;
};

export const washer: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(softBox(w, h, d, mat(c, 0.4, 0.35, tex), 0, h / 2, 0, 2.2));
  const door = cyl(Math.min(w, h) * 0.3, Math.min(w, h) * 0.3, 3, mat('#3d444c', 0.15, 0.5), 0, h * 0.45, d / 2 + 1);
  door.rotation.x = Math.PI / 2;
  g.add(door);
  const ring = torus(Math.min(w, h) * 0.31, 1.2, mat('#cbd1d5', 0.3, 0.55), 0, h * 0.45, d / 2 + 2, 32);
  g.add(ring);
  g.add(softBox(w - 8, 6, 2, mat(shade(c, -25), 0.5), 0, h - 8, d / 2 + 1, 1));
  g.add(cyl(1.6, 1.6, 2.2, mat('#69717a', 0.35, 0.5), w * 0.32, h - 8, d / 2 + 2.3, 16));
  return g;
};

export const counter: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.8, 0, tex), top = mat('#e6e1d5', 0.5), dark = mat(shade(c, -30), 0.8);
  const metal = mat('#c8c2b6', 0.25, 0.85);
  g.add(softBox(w, h - 6, d - 4, body, 0, (h - 6) / 2, 0, 2));
  g.add(softBox(w, 6, d, top, 0, h - 3, 0, 2));
  const n = Math.max(2, Math.round(w / 60));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w / n) * (i + 0.5);
    g.add(softBox(w / n - 5, h - 14, 2, dark, x, (h - 6) / 2, d / 2 - 1, 1));
    g.add(rodX(Math.min(18, w / n * 0.42), 0.7, metal, x, h * 0.58, d / 2 + 1));
  }
  g.add(cyl(2, 2, 14, metal, -w * 0.22, h + 6, -d * 0.25));
  g.add(softBox(w * 0.22, 1.6, d * 0.22, mat('#aebfc8', 0.28, 0.05), -w * 0.22, h + 0.8, -d * 0.25, 3));
  for (const t of [[0.12, -0.15], [0.3, -0.15], [0.12, 0.15], [0.3, 0.15]]) {
    g.add(cyl(7, 7, 1.4, mat('#2c3036', 0.6), t[0] * w, h + 0.8, t[1] * d, 16));
  }
  return g;
};
