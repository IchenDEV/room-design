import * as THREE from 'three';
import { box, cyl, legs4, mat } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const table: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(box(w, 5, d, mat(c, 0.7, 0, tex), 0, h - 2.5, 0));
  legs4(g, w * 0.9, d * 0.88, h - 5, 3, mat(shade(c, -40), 0.7));
  return g;
};

export const roundtable: Builder = (w, _d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(cyl(w / 2, w / 2, 5, mat(c, 0.7, 0, tex), 0, h - 2.5, 0, 28));
  g.add(cyl(5, 7, h - 9, mat(shade(c, -45), 0.7), 0, (h - 9) / 2 + 4, 0));
  g.add(cyl(w * 0.3, w * 0.3, 4, mat(shade(c, -55), 0.7), 0, 2, 0, 24));
  return g;
};

export const tvstand: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.75, 0, tex);
  g.add(box(w, h - 10, d, body, 0, (h - 10) / 2 + 8, 0));
  g.add(box(w * 0.96, 2.5, d * 0.9, mat(shade(c, -35), 0.7), 0, h - 9, 0));
  legs4(g, w * 0.9, d * 0.8, 8, 2.5, mat('#5d4a33', 0.7));
  const tvW = Math.min(w * 0.78, 145);
  g.add(box(tvW, tvW * 0.56, 3.5, mat('#15181c', 0.35), 0, h + tvW * 0.28 + 8, -d * 0.18));
  g.add(box(tvW * 0.3, 8, 14, mat('#22262b', 0.5), 0, h + 2, -d * 0.18));
  return g;
};

export const shelf: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const wood = mat(c, 0.8, 0, tex);
  for (const s of [-1, 1]) g.add(box(4, h, d, wood, s * (w / 2 - 2), h / 2, 0));
  g.add(box(w, h, 2.5, wood, 0, h / 2, -d / 2 + 1.2));
  const layers = 4;
  for (let i = 0; i <= layers; i++) g.add(box(w - 8, 3.5, d - 4, wood, 0, 6 + (h - 12) * (i / layers), 0));
  const rnd = [0x8a6d9c, 0x5d7f9e, 0xa3554e, 0x4e8a64, 0xc2a14e];
  for (let i = 0; i < layers; i++) {
    const y = 6 + (h - 12) * (i / layers) + 14;
    for (let b = 0; b < 3; b++) {
      g.add(box(7, 24 - b * 3, d * 0.6, mat(rnd[(i + b) % 5], 0.9), -w * 0.3 + b * 11 + i * 5, y, 0));
    }
  }
  return g;
};
