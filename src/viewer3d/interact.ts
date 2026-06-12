import * as THREE from 'three';
import type { Viewer3D } from './viewer';
import { closeCtxMenu, openCtxMenu } from '../core/store/actions';
import { snapItem } from '../core/geometry/item-snap';
import { idsFromSelection, itemGroupId, moveItems } from '../core/store/item-groups';

type DragTarget = { kind: 'item' | 'group'; id: string; pickedId: string };

/** 3D 拾取：点选家具、平面拖拽、右键菜单 */
export function bindInteract(v: Viewer3D): () => void {
  const canvas = v.canvas;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPt = new THREE.Vector3();
  let drag: DragTarget | null = null;
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
    const groupId = itemGroupId(v.store.project, id);
    const sel = groupId ? { kind: 'group' as const, id: groupId } : { kind: 'item' as const, id };
    v.store.setSel(sel);
    const it = v.store.project.items.find((i) => i.id === id);
    const p = planePt();
    if (!it || !p) return;
    drag = { kind: sel.kind, id: sel.id, pickedId: id };
    off = { x: p.x - it.x, z: p.z + it.y };
    v.controls.enabled = false;
    v.store.begin();
    canvas.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    setNdc(e);
    const p = planePt();
    if (!p) return;
    v.store.update((proj) => {
      const it = proj.items.find((i) => i.id === drag?.pickedId);
      if (!it || !drag) return;
      const next = { x: p.x - off.x, y: -(p.z - off.z) };
      if (drag.kind === 'group') {
        moveItems(proj, idsFromSelection(v.store, { kind: 'group', id: drag.id }), next.x - it.x, next.y - it.y);
      } else {
        const snap = snapItem(proj, next, it);
        it.x = snap.pt.x;
        it.y = snap.pt.y;
        if (snap.rot !== null) it.rot = snap.rot;
      }
    });
  };
  const up = () => {
    if (!drag) return;
    drag = null;
    v.store.end();
    v.controls.enabled = !v.walk.active;
  };
  const ctx = (e: MouseEvent) => {
    e.preventDefault();
    if (v.walk.active) return;
    const id = pickItem(e);
    if (id) {
      const groupId = itemGroupId(v.store.project, id);
      openCtxMenu(v.store, e.clientX, e.clientY, groupId ? { kind: 'group', id: groupId } : { kind: 'item', id });
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
