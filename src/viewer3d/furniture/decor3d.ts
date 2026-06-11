import * as THREE from 'three';
import { box, cyl, mat, sph } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const rug: Builder = (w, d, _h, c) => {
  const g = new THREE.Group();
  const m = mat(c, 1);
  const r = new THREE.Mesh(new THREE.BoxGeometry(w, 1.6, d), m);
  r.position.y = 0.8;
  r.receiveShadow = true;
  g.add(r);
  g.add(box(w * 0.82, 0.5, d * 0.82, mat(shade(c, -22), 1), 0, 1.8, 0));
  return g;
};

export const lamp: Builder = (w, _d, h, c) => {
  const g = new THREE.Group();
  const metal = mat('#8c8676', 0.4, 0.6);
  g.add(cyl(w * 0.4, w * 0.45, 3, metal, 0, 1.5, 0));
  g.add(cyl(1.6, 1.6, h - w * 0.8, metal, 0, (h - w * 0.8) / 2 + 3, 0));
  const shadeMat = new THREE.MeshStandardMaterial({
    color: c, roughness: 0.9, emissive: 0xffd9a0, emissiveIntensity: 0.55, side: THREE.DoubleSide,
  });
  g.add(cyl(w * 0.42, w * 0.55, w * 0.7, shadeMat, 0, h - w * 0.35, 0));
  return g;
};

export const plant: Builder = (w, _d, h, c) => {
  const g = new THREE.Group();
  g.add(cyl(w * 0.32, w * 0.24, h * 0.24, mat('#a8593d', 0.85), 0, h * 0.12, 0));
  g.add(cyl(1.8, 2.4, h * 0.3, mat('#6d553a', 0.9), 0, h * 0.38, 0));
  const leaf1 = mat(c, 0.95), leaf2 = mat(shade(c, -25), 0.95);
  g.add(sph(w * 0.42, leaf1, 0, h * 0.66, 0));
  g.add(sph(w * 0.3, leaf2, w * 0.22, h * 0.55, w * 0.1));
  g.add(sph(w * 0.28, leaf2, -w * 0.2, h * 0.78, -w * 0.08));
  g.add(sph(w * 0.24, leaf1, w * 0.12, h * 0.84, -w * 0.16));
  return g;
};
