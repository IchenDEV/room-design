import * as THREE from 'three';
import { box, cyl, mat, sph } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const rug: Builder = (w, d, _h, c, tex) => {
  const g = new THREE.Group();
  const m = mat(c, 1, 0, tex);
  const r = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, d), m);
  r.position.y = 0.8;
  r.receiveShadow = true;
  g.add(r);
  g.add(box(w * 0.82, 0.5, d * 0.82, mat(shade(c, -22), 1), 0, 1.8, 0));
  return g;
};

export const lamp: Builder = (w, _d, h, c, tex) => {
  const g = new THREE.Group();
  const metal = mat('#8c8676', 0.4, 0.6);
  g.add(cyl(w * 0.4, w * 0.45, 3, metal, 0, 1.5, 0));
  g.add(cyl(1.6, 1.6, h - w * 0.8, metal, 0, (h - w * 0.8) / 2 + 3, 0));
  const shadeMat = new THREE.MeshStandardMaterial({
    color: tex ? '#ffffff' : c, roughness: 0.9, emissive: 0xffd9a0, emissiveIntensity: 0.55, side: THREE.DoubleSide,
  });
  g.add(cyl(w * 0.42, w * 0.55, w * 0.7, shadeMat, 0, h - w * 0.35, 0));
  return g;
};

export const plant: Builder = (w, _d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(cyl(w * 0.32, w * 0.24, h * 0.24, mat('#a8593d', 0.85), 0, h * 0.12, 0));
  g.add(cyl(1.8, 2.4, h * 0.3, mat('#6d553a', 0.9), 0, h * 0.38, 0));
  const leaf1 = mat(c, 0.95, 0, tex), leaf2 = mat(shade(c, -25), 0.95, 0, tex);
  g.add(sph(w * 0.42, leaf1, 0, h * 0.66, 0));
  g.add(sph(w * 0.3, leaf2, w * 0.22, h * 0.55, w * 0.1));
  g.add(sph(w * 0.28, leaf2, -w * 0.2, h * 0.78, -w * 0.08));
  g.add(sph(w * 0.24, leaf1, w * 0.12, h * 0.84, -w * 0.16));
  return g;
};

export const outlet: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const body = mat(c, 0.65, tex === 'metal' ? 0.65 : 0.05, tex);
  const dark = mat('#4d5660', 0.75, 0.05);
  if (d < w * 0.55) {
    g.add(box(w, h, d, body, 0, h / 2, 0));
    g.add(box(w * 0.12, h * 0.42, d + 0.4, dark, -w * 0.18, h * 0.52, 0));
    g.add(box(w * 0.12, h * 0.42, d + 0.4, dark, w * 0.18, h * 0.52, 0));
    return g;
  }
  g.add(box(w, h, d, body, 0, h / 2, 0));
  g.add(box(w * 0.52, h * 0.25, d * 0.52, mat('#f4f0e5', 0.7), 0, h + 0.2, 0));
  g.add(box(w * 0.38, h * 0.35, 1, dark, 0, h + 0.5, 0));
  return g;
};

export const weakbox: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const y = 105;
  const body = mat(c, 0.55, 0.45, tex);
  const line = mat('#68727d', 0.7, 0.2);
  g.add(box(w, h, d, body, 0, y + h / 2, 0));
  g.add(box(w * 0.82, h * 0.08, d + 0.5, line, 0, y + h * 0.78, 0));
  g.add(box(w * 0.48, h * 0.06, d + 0.6, line, -w * 0.12, y + h * 0.5, 0));
  g.add(box(w * 0.34, h * 0.05, d + 0.6, line, -w * 0.18, y + h * 0.34, 0));
  g.add(cyl(1.6, 1.6, d + 0.8, line, w * 0.33, y + h * 0.5, 0, 12));
  g.children.at(-1)?.rotateX(Math.PI / 2);
  return g;
};

export const accesspanel: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const y = 112;
  const body = mat(c, 0.58, 0.05, tex);
  const glass = mat('#6aa1c8', 0.25, 0.02);
  const key = mat('#d7dee7', 0.65, 0.05);
  g.add(box(w, h, d, body, 0, y + h / 2, 0));
  g.add(box(w * 0.52, h * 0.26, d + 0.5, glass, -w * 0.08, y + h * 0.68, 0));
  for (let row = 0; row < 2; row++) for (let col = 0; col < 3; col++) {
    g.add(box(w * 0.1, h * 0.08, d + 0.7, key, w * (-0.24 + col * 0.18), y + h * (0.3 + row * 0.16), 0));
  }
  return g;
};
