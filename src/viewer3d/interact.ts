import * as THREE from 'three';
import type { Viewer3D } from './viewer';
import { closeCtxMenu, openCtxMenu } from '../core/store/actions';
import { snapItem } from '../core/geometry/item-snap';

/** 3D 拾取：点选家具、平面拖拽、右键菜单 */
export function bindInteract(v: Viewer3D): () => void {
  const canvas = v.canvas;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPt = new THREE.Vector3();
  let dragId: string | null = null;
  let off = { x: 0, z: 0 };

  const setNdc = (e: MouseEvent) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, v.camera);
  };
  const pickItem = (e: MouseEvent): string | null => {
    setNdc(e);
    const hits = ray.intersectObjects(v.itemGroup.children, true);
    return (hits[0]?.object.userData.itemId as string) ?? null;
  };
  const planePt = (): THREE.Vector3 | null => (ray.ray.intersectPlane(planeY, hitPt) ? hitPt : null);

  const down = (e: PointerEvent) => {
    if (v.walk.active || e.button !== 0) return;
    const id = pickItem(e);
    if (!id) { v.store.setSel(null); return; }
    v.store.setSel({ kind: 'item', id });
    const it = v.store.project.items.find((i) => i.id === id);
    const p = planePt();
    if (!it || !p) return;
    dragId = id;
    off = { x: p.x - it.x, z: p.z + it.y };
    v.controls.enabled = false;
    v.store.begin();
    canvas.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!dragId) return;
    setNdc(e);
    const p = planePt();
    if (!p) return;
    v.store.update((proj) => {
      const it = proj.items.find((i) => i.id === dragId);
      if (it) {
        const snap = snapItem(proj, { x: p.x - off.x, y: -(p.z - off.z) }, it);
        it.x = snap.pt.x;
        it.y = snap.pt.y;
        if (snap.rot !== null) it.rot = snap.rot;
      }
    });
  };
  const up = () => {
    if (!dragId) return;
    dragId = null;
    v.store.end();
    v.controls.enabled = !v.walk.active;
  };
  const ctx = (e: MouseEvent) => {
    e.preventDefault();
    if (v.walk.active) return;
    const id = pickItem(e);
    if (id) {
      openCtxMenu(v.store, e.clientX, e.clientY, { kind: 'item', id });
    } else closeCtxMenu(v.store);
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('contextmenu', ctx);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('contextmenu', ctx);
  };
}
