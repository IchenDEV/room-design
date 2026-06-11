import * as THREE from 'three';
import type { Store } from '../core/store/store';
import { roomFloor } from '../core/store/selectors';
import { floorTexture } from './textures';
import { ceilMat } from './mats';

/** 房间地板（含程序纹理）与可选吊顶 */
export function buildFloors(store: Store, group: THREE.Group) {
  const H = store.project.settings.wallHeight;
  for (const r of store.rooms) {
    const shape = new THREE.Shape();
    r.poly.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y)));
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);

    const tex = floorTexture(roomFloor(store, r)).clone();
    tex.needsUpdate = true;
    tex.repeat.set(1 / 320, 1 / 320);
    // ShapeGeometry 的 uv 为原始坐标，按 cm 缩放至纹理空间
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, metalness: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.5;
    mesh.receiveShadow = true;
    group.add(mesh);

    if (store.project.settings.showCeiling) {
      const ceil = new THREE.Mesh(geo.clone(), ceilMat);
      ceil.position.y = H - 0.5;
      group.add(ceil);
    }
  }
}
