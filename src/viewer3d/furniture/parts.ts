import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { FurnTexture } from '../../core/catalog/catalog';
import { furnitureMap } from './material-textures';

const hex = (color: string | number) => (typeof color === 'number' ? `#${color.toString(16).padStart(6, '0')}` : color);
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export const mat = (color: string | number, rough = 0.85, metal = 0, texture?: FurnTexture) => {
  const key = `${hex(color)}:${rough}:${metal}:${texture ?? ''}`;
  let hit = materialCache.get(key);
  if (hit) return hit;
  hit = new THREE.MeshStandardMaterial({
    color: texture ? '#ffffff' : color,
    map: texture ? furnitureMap(texture, hex(color)) : null,
    roughness: rough,
    metalness: metal,
  });
  hit.userData.shared = true;
  materialCache.set(key, hit);
  return hit;
};

function prepMesh(m: THREE.Mesh, x: number, y: number, z: number, shadow: boolean): THREE.Mesh {
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = shadow;
  return m;
}

const boxShadow = (w: number, h: number, d: number) => Math.max(w, h, d) > 10 && w * h * d > 500;
const cylShadow = (rt: number, rb: number, h: number) => Math.max(rt, rb) ** 2 * h > 150;

export const box = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0) =>
  prepMesh(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), x, y, z, boxShadow(w, h, d));

export const softBox = (w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, r = 2, seg = 2) =>
  prepMesh(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, Math.max(0.1, r)), m), x, y, z, boxShadow(w, h, d));

export const cyl = (rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 20) =>
  prepMesh(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m), x, y, z, cylShadow(rt, rb, h));

export const sph = (r: number, m: THREE.Material, x = 0, y = 0, z = 0) =>
  prepMesh(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), m), x, y, z, r > 5);

export const torus = (r: number, tube: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 32) =>
  prepMesh(new THREE.Mesh(new THREE.TorusGeometry(r, tube, 8, seg), m), x, y, z, r > 8 && tube > 0.7);

export const rodX = (len: number, r: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 16) => {
  const o = cyl(r, r, len, m, x, y, z, seg);
  o.rotation.z = Math.PI / 2;
  return o;
};

export const rodZ = (len: number, r: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 16) => {
  const o = cyl(r, r, len, m, x, y, z, seg);
  o.rotation.x = Math.PI / 2;
  return o;
};

/** 四条腿 */
export function legs4(g: THREE.Group, w: number, d: number, h: number, r: number, m: THREE.Material) {
  const ox = w / 2 - r * 1.6, oz = d / 2 - r * 1.6;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(cyl(r, r, h, m, sx * ox, h / 2, sz * oz));
}

export const grp = (...objs: THREE.Object3D[]): THREE.Group => {
  const g = new THREE.Group();
  objs.forEach((o) => g.add(o));
  return g;
};
