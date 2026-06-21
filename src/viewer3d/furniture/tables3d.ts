import * as THREE from 'three';
import { box, cyl, legs4, mat, rodX, rodZ, softBox, torus } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const table: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const top = mat(c, 0.7, 0, tex), leg = mat(shade(c, -40), 0.7);
  g.add(softBox(w, 5, d, top, 0, h - 2.5, 0, 2.8));
  g.add(box(w * 0.9, 3, d * 0.82, mat(shade(c, -18), 0.75, 0, tex), 0, h - 6.4, 0));
  legs4(g, w * 0.9, d * 0.88, h - 5, 3, leg);
  g.add(rodX(w * 0.72, 1.1, leg, 0, h * 0.44, d * 0.38));
  g.add(rodZ(d * 0.68, 1.1, leg, w * 0.38, h * 0.44, 0));
  return g;
};

export const roundtable: Builder = (w, _d, h, c, tex) => {
  const g = new THREE.Group();
  const top = mat(c, 0.7, 0, tex), dark = mat(shade(c, -48), 0.7);
  g.add(cyl(w / 2, w / 2, 5, top, 0, h - 2.5, 0, 36));
  const rim = torus(w / 2 - 2, 1, mat(shade(c, -18), 0.74, 0, tex), 0, h - 0.6, 0, 48);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  g.add(cyl(5, 7, h - 9, dark, 0, (h - 9) / 2 + 4, 0, 24));
  g.add(cyl(w * 0.3, w * 0.3, 4, dark, 0, 2, 0, 28));
  return g;
};

export const tvstand: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.75, 0, tex);
  const front = mat(shade(c, 14), 0.72, 0, tex), metal = mat('#b8b2a8', 0.32, 0.75);
  g.add(softBox(w, h - 10, d, body, 0, (h - 10) / 2 + 8, 0, 2.5));
  g.add(softBox(w * 0.96, 2.5, d * 0.9, mat(shade(c, -35), 0.7), 0, h - 9, 0, 1.4));
  legs4(g, w * 0.9, d * 0.8, 8, 2.5, mat('#5d4a33', 0.7));
  for (const x of [-w * 0.26, w * 0.26]) {
    g.add(softBox(w * 0.38, h * 0.36, 2, front, x, h * 0.46, d / 2 + 1.2, 1.6));
    g.add(rodX(w * 0.18, 0.9, metal, x, h * 0.54, d / 2 + 2.8));
  }
  g.add(box(w * 0.18, h * 0.28, 1.8, mat('#2b3036', 0.5), 0, h * 0.48, d / 2 + 1.5));
  const tvW = Math.min(w * 0.78, 145);
  g.add(softBox(tvW, tvW * 0.56, 3.5, mat('#15181c', 0.35), 0, h + tvW * 0.28 + 8, -d * 0.18, 2));
  g.add(box(tvW * 0.9, 1.5, 1, mat('#4d545c', 0.45, 0.5), 0, h + tvW * 0.56 + 8, -d * 0.18 + 2));
  g.add(box(tvW * 0.3, 8, 14, mat('#22262b', 0.5), 0, h + 2, -d * 0.18));
  return g;
};

export const shelf: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const wood = mat(c, 0.8, 0, tex);
  for (const s of [-1, 1]) g.add(softBox(4, h, d, wood, s * (w / 2 - 2), h / 2, 0, 1.2));
  g.add(box(w, h, 2.5, mat(shade(c, -12), 0.82, 0, tex), 0, h / 2, -d / 2 + 1.2));
  const layers = 4;
  for (let i = 0; i <= layers; i++) g.add(softBox(w - 8, 3.5, d - 4, wood, 0, 6 + (h - 12) * (i / layers), 0, 1.2));
  const rnd = [0x8a6d9c, 0x5d7f9e, 0xa3554e, 0x4e8a64, 0xc2a14e];
  for (let i = 0; i < layers; i++) {
    const y = 6 + (h - 12) * (i / layers) + 14;
    for (let b = 0; b < 3; b++) {
      g.add(softBox(7, 24 - b * 3, d * 0.58, mat(rnd[(i + b) % 5], 0.9), -w * 0.3 + b * 11 + i * 5, y, 0, 0.8));
    }
    g.add(softBox(w * 0.16, 9, d * 0.46, mat(shade(c, i % 2 ? 24 : -24), 0.84, 0, tex), w * 0.28, y - 6, 0, 1));
  }
  return g;
};
