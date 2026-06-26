import type { Store } from '../core/store/store';
import { roomCeiling, roomFloor } from '../core/store/selectors';

export interface SceneSignatures { shell: string; items: string }

const n = (v: number | undefined): number => Math.round((v ?? 0) * 100) / 100;

export function sceneSignatures(store: Store): SceneSignatures {
  const p = store.project;
  const walls = p.walls.map((w) => [
    w.id, n(w.a.x), n(w.a.y), n(w.b.x), n(w.b.y), n(w.thickness), n(w.height),
    w.color, w.material ?? 'solid', w.texture ?? 'paint', n(w.glassGap ?? 120),
  ]);
  const openings = p.openings.map((o) => [
    o.id, o.wallId, o.kind, n(o.t), n(o.width), n(o.height), n(o.sill),
    o.flip ? 1 : 0, o.style ?? '', o.swing ?? '', o.openDir ?? '',
  ]);
  const rooms = store.rooms.map((r) => {
    const c = roomCeiling(store, r);
    return [
      r.metaId ?? '', roomFloor(store, r), c.style, n(c.drop), n(c.inset), c.color,
      r.poly.map((pt) => [n(pt.x), n(pt.y)]),
    ];
  });
  const items = p.items.map((it) => [
    it.id, it.defId, n(it.x), n(it.y), n(it.rot), n(it.w), n(it.d), n(it.h),
    it.color ?? '', it.texture ?? '', it.flipX ? 1 : 0, n(it.z),
  ]);
  return {
    shell: JSON.stringify([walls, openings, rooms, p.settings.showCeiling ? 1 : 0, n(p.settings.wallHeight)]),
    items: JSON.stringify(items),
  };
}
