import * as THREE from 'three';
import { box, cyl, mat, rodX, rodZ, softBox, sph, torus } from './parts';
import { shade } from '../../core/geometry/vec';
import type { Builder } from './seating3d';

export const bed: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const frame = mat('#8a6a48', 0.75), mattress = mat('#f0ece2', 0.95);
  const blanket = mat(c, 0.92, 0, tex), pillow = mat('#ffffff', 0.95);
  g.add(softBox(w + 10, 22, d + 8, frame, 0, 11, 0, 3));
  g.add(softBox(w + 10, h + 26, 6, frame, 0, (h + 26) / 2, -d / 2 - 4, 3));
  g.add(softBox(w, 16, d * 0.98, mattress, 0, 30, 0, 5));
  g.add(softBox(w + 2, 7, d * 0.55, blanket, 0, 41, d * 0.2, 4));
  g.add(box(w * 0.86, 1.4, 2, mat(shade(c, -20), 0.94, 0, tex), 0, 45, d * 0.48));
  const pw = w > 140 ? w * 0.38 : w * 0.7;
  for (const s of w > 140 ? [-1, 1] : [0]) {
    g.add(softBox(pw, 7, d * 0.14, pillow, s * w * 0.23, 42.5, -d / 2 + d * 0.12, 3));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(5, 8, 5, frame, sx * w * 0.45, 4, sz * d * 0.42));
  return g;
};

export const toilet: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const por = mat(c, 0.25, 0, tex);
  g.add(softBox(w * 0.92, h * 0.5, 16, por, 0, h * 0.55, -d / 2 + 8, 2));
  g.add(softBox(w * 0.38, 1.6, 2, mat('#d7d3ca', 0.28, 0.3), 0, h * 0.82, -d / 2 + 16.8, 0.8));
  const bowl = cyl(w * 0.42, w * 0.3, 28, por, 0, 14, d * 0.1, 24);
  bowl.scale.z = 1.25;
  g.add(bowl);
  const seat = cyl(w * 0.45, w * 0.45, 4, mat(shade(c, -8), 0.4), 0, 30, d * 0.1, 24);
  seat.scale.z = 1.25;
  g.add(seat);
  const hole = cyl(w * 0.24, w * 0.24, 4.4, mat('#d8e7ea', 0.22), 0, 32.4, d * 0.1, 20);
  hole.scale.z = 1.35;
  g.add(hole);
  return g;
};

export const bathsink: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  g.add(softBox(w, h - 12, d - 4, mat(c, 0.7, 0, tex), 0, (h - 12) / 2 + 4, 0, 2));
  g.add(softBox(w, 5, d, mat('#eceada', 0.4), 0, h - 2.5, 0, 2));
  const basin = cyl(w * 0.26, w * 0.2, 10, mat('#f4f2ea', 0.25), 0, h + 4, 0, 24);
  basin.scale.z = 0.75;
  g.add(basin);
  const metal = mat('#c4beb2', 0.25, 0.85);
  g.add(cyl(1.8, 1.8, 16, metal, 0, h + 10, -d * 0.3));
  g.add(rodZ(12, 1.4, metal, 0, h + 17, -d * 0.2));
  g.add(rodX(w * 0.42, 0.7, mat(shade(c, -22), 0.7, 0, tex), 0, h * 0.48, d / 2 + 1));
  return g;
};

export const bathtub: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const por = mat(c, 0.3, 0, tex);
  const metal = mat('#c4beb2', 0.25, 0.85);
  g.add(softBox(w, h, d, por, 0, h / 2, 0, 5));
  g.add(softBox(w - 14, 4, d - 14, mat('#b9cdd6', 0.2), 0, h - 1, 0, 4));
  g.add(softBox(w + 6, 5, d + 6, mat(shade(c, -8), 0.35), 0, h - 2.5, 0, 3));
  g.add(sph(3, metal, -w / 2 + 12, h + 4, 0));
  g.add(rodZ(14, 1.4, metal, -w / 2 + 16, h + 6, -d * 0.18));
  return g;
};

export const shower: Builder = (w, d, h, c, tex) => {
  const g = new THREE.Group();
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xcfe4ef, roughness: 0.05, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false,
  });
  g.add(softBox(w, 5, d, mat(c, 0.5, 0, tex), 0, 2.5, 0, 2));
  const gw = new THREE.Mesh(new THREE.BoxGeometry(w, h - 10, 1.6), glass);
  gw.position.set(0, (h - 10) / 2 + 5, d / 2 - 1);
  g.add(gw);
  const gw2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, h - 10, d), glass);
  gw2.position.set(w / 2 - 1, (h - 10) / 2 + 5, 0);
  g.add(gw2);
  const metal = mat('#c4beb2', 0.25, 0.85);
  g.add(rodX(w, 1.1, metal, 0, h - 5, d / 2));
  g.add(rodZ(d, 1.1, metal, w / 2, h - 5, 0));
  g.add(cyl(1.6, 1.6, h - 14, metal, -w / 2 + 6, (h - 14) / 2 + 5, -d / 2 + 6));
  g.add(sph(4, metal, -w / 2 + 10, h - 12, -d / 2 + 10));
  const head = torus(5, 0.8, metal, -w / 2 + 14, h - 15, -d / 2 + 12, 20);
  head.rotation.y = Math.PI / 2;
  g.add(head);
  return g;
};
