import * as THREE from 'three';
import type { Store } from '../core/store/store';
import { roomCeiling, roomFloor } from '../core/store/selectors';
import { floorMat } from './mats';
import { buildCeiling } from './build-ceilings';

/** 房间地板（含程序纹理）与可选吊顶 */
export function buildFloors(store: Store, group: THREE.Group) {
  const H = store.project.settings.wallHeight;
  for (const r of store.rooms) {
    const shape = new THREE.Shape();
    r.poly.forEach((p, i) => (i === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y)));
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, floorMat(roomFloor(store, r)));
    mesh.position.y = 0.5;
    mesh.receiveShadow = true;
    group.add(mesh);

    if (store.project.settings.showCeiling) buildCeiling(group, r, H, roomCeiling(store, r));
  }
}
