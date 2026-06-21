import * as THREE from 'three';
import { box, cyl, mat, rodX, softBox, sph } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const officedesk: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const top = mat(c, 0.65, 0, tex), leg = mat('#6b7077', 0.45, 0.5);
  g.add(softBox(w, 4.5, d, top, 0, h - 2.2, 0, 2));
  g.add(cyl(3, 3, 0.8, mat('#30353b', 0.5), -w * 0.28, h + 0.4, -d * 0.28, 18));
  for (const s of [-1, 1]) g.add(softBox(5, h - 5, d * 0.85, leg, s * (w / 2 - 5), (h - 5) / 2, 0, 1.2));
  const mw = Math.min(w * 0.42, 62);
  g.add(softBox(mw, mw * 0.6, 2.5, mat('#14171c', 0.3), 0, h + mw * 0.3 + 9, -d * 0.22, 1.6));
  g.add(box(mw * 0.82, mw * 0.46, 1, mat('#253647', 0.36, 0.15), 0, h + mw * 0.3 + 9, -d * 0.22 + 1.8));
  g.add(cyl(2, 3, 8, leg, 0, h + 4, -d * 0.22));
  g.add(softBox(mw * 0.5, 1.6, 14, mat('#2e333a', 0.5), 0, h + 0.8, d * 0.05, 0.8));
  g.add(softBox(mw * 0.18, 1.3, 10, mat('#3a4048', 0.45), w * 0.18, h + 0.75, d * 0.08, 1));
  return g;
};

export const officechair: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.85, 0, tex), metal = mat('#888e94', 0.35, 0.7);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = box(w * 0.42, 2.4, 4, metal, Math.cos(a) * w * 0.21, 3, Math.sin(a) * w * 0.21);
    arm.rotation.y = -a;
    g.add(arm);
    g.add(sph(2.2, mat('#2f3439', 0.42, 0.35), Math.cos(a) * w * 0.42, 1.8, Math.sin(a) * w * 0.42));
  }
  g.add(cyl(2.6, 2.6, h * 0.28, metal, 0, h * 0.18, 0));
  g.add(softBox(w * 0.78, 7, d * 0.72, body, 0, h * 0.42, 0, 3));
  g.add(softBox(w * 0.66, h * 0.42, 6, body, 0, h * 0.62, -d * 0.3, 3));
  g.add(box(w * 0.52, 1, 1.2, mat(shade(c, -24), 0.9, 0, tex), 0, h * 0.7, -d * 0.26));
  for (const s of [-1, 1]) g.add(softBox(4, 3, d * 0.4, metal, s * w * 0.36, h * 0.5, 0, 1));
  return g;
};

export const filecabinet: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.5, 0.3, tex), front = mat(shade(c, 12), 0.5, 0.3, tex);
  g.add(softBox(w, h, d, body, 0, h / 2, 0, 1.8));
  const n = 4;
  for (let i = 0; i < n; i++) {
    const y = (h / n) * (i + 0.5);
    g.add(softBox(w - 6, h / n - 5, 2, front, 0, y, d / 2 + 1, 1));
    g.add(rodX(w * 0.3, 0.9, mat('#3f444a', 0.4, 0.6), 0, y + h / n / 2 - 7, d / 2 + 2.4));
    g.add(box(w * 0.22, 1.4, 1.2, mat('#cdd3d6', 0.55, 0.15), -w * 0.26, y + 3, d / 2 + 2.5));
  }
  return g;
};

export const whiteboard: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const metal = mat('#9aa0a6', 0.4, 0.6);
  g.add(softBox(w, w * 0.62, 3, mat(c, 0.35, 0, tex), 0, h * 0.62, 0, 1.6));
  g.add(box(w + 6, w * 0.62 + 6, 2, metal, 0, h * 0.62, -1));
  g.add(softBox(w * 0.7, 2.5, 8, metal, 0, h * 0.62 - w * 0.31 - 4, 3, 1));
  g.add(rodX(w * 0.16, 0.8, mat('#2f6f9f', 0.55), -w * 0.18, h * 0.62 - w * 0.31 - 1, 8));
  g.add(rodX(w * 0.14, 0.8, mat('#9f3e3e', 0.55), w * 0.04, h * 0.62 - w * 0.31 - 1, 8));
  for (const s of [-1, 1]) {
    g.add(cyl(1.8, 1.8, h * 0.6, metal, s * w * 0.42, h * 0.3, 0));
    g.add(box(3, 3, d + 18, metal, s * w * 0.42, 1.5, 0));
  }
  return g;
};

export const printer: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(softBox(w, h * 0.4, d, mat(shade(c, -18), 0.6, 0, tex), 0, h * 0.2, 0, 2));
  g.add(softBox(w * 0.94, h * 0.34, d * 0.92, mat(c, 0.55, 0, tex), 0, h * 0.57, 0, 2));
  g.add(softBox(w * 0.6, 2, d * 0.5, mat('#e9e7e0', 0.8), 0, h * 0.76, -d * 0.1, 1));
  g.add(softBox(w * 0.5, h * 0.06, d * 0.3, mat('#3a3f45', 0.5), 0, h * 0.78, d * 0.25, 0.6));
  g.add(box(w * 0.22, 1.2, 1.2, mat('#7fa2b5', 0.4, 0.1), w * 0.25, h * 0.8, d * 0.1));
  return g;
};

export const partition: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(softBox(w, h - 12, Math.max(d, 5), mat(c, 0.95, 0, tex), 0, (h - 12) / 2 + 12, 0, 2));
  g.add(box(w * 0.9, 1.2, Math.max(d, 5) + 0.8, mat(shade(c, -16), 0.98, 0, tex), 0, h * 0.58, 0));
  g.add(box(w + 4, 4, Math.max(d, 5) + 2, mat(shade(c, -35), 0.6), 0, h - 8, 0));
  const metal = mat('#7d838a', 0.4, 0.6);
  for (const s of [-1, 1]) {
    g.add(cyl(1.8, 1.8, 12, metal, s * (w / 2 - 6), 6, 0));
    g.add(box(3, 2.5, 26, metal, s * (w / 2 - 6), 1.2, 0));
  }
  return g;
};
