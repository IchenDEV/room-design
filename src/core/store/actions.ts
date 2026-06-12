import type { Store } from './store';
import type { Pt, Selection } from '../types';
import { uid } from '../types';
import { dist, wallDir, wallLen } from '../geometry/vec';
import { itemOf, wallOf } from './selectors';
import { sampleOf } from '../samples';
import { emptyProject } from '../types';

/** 删除当前选中元素（含墙上开口级联） */
export function deleteSelection(s: Store) {
  const sel = s.sel;
  if (!sel) return;
  s.commit((p) => {
    if (sel.kind === 'wall') {
      p.walls = p.walls.filter((w) => w.id !== sel.id);
      p.openings = p.openings.filter((o) => o.wallId !== sel.id);
    } else if (sel.kind === 'opening') p.openings = p.openings.filter((o) => o.id !== sel.id);
    else if (sel.kind === 'item') p.items = p.items.filter((i) => i.id !== sel.id);
    else if (sel.kind === 'room') p.roomMetas = p.roomMetas.filter((m) => m.id !== sel.metaId);
  });
  s.setSel(null);
}

/** 复制家具：偏移 30cm 并选中副本 */
export function duplicateItem(s: Store, id: string) {
  const src = itemOf(s, id);
  if (!src) return;
  const copy = { ...src, id: uid('i'), x: src.x + 30, y: src.y - 30 };
  s.commit((p) => { p.items.push(copy); });
  s.setSel({ kind: 'item', id: copy.id });
}

export function rotateItem(s: Store, id: string, delta = 90) {
  s.commit((p) => {
    const it = p.items.find((i) => i.id === id);
    if (it) it.rot = (it.rot + delta + 360) % 360;
  });
}

export function toggleItemFlip(s: Store, id: string) {
  s.commit((p) => {
    const it = p.items.find((i) => i.id === id);
    if (it) it.flipX = !it.flipX;
  });
}

/** 精确设墙长：固定 a 端，b 端连同重合端点一起平移 */
export function setWallLength(s: Store, id: string, len: number) {
  const w = wallOf(s, id);
  if (!w || len < 10) return;
  const d = wallDir(w);
  const nb: Pt = { x: w.a.x + d.x * len, y: w.a.y + d.y * len };
  const dx = nb.x - w.b.x, dy = nb.y - w.b.y;
  const old = { ...w.b };
  s.commit((p) => {
    for (const o of p.walls) {
      if (dist(o.a, old) < 2) { o.a.x += dx; o.a.y += dy; }
      if (dist(o.b, old) < 2) { o.b.x += dx; o.b.y += dy; }
    }
  });
}

export function toggleWallMaterial(s: Store, id: string) {
  s.commit((p) => {
    const w = p.walls.find((x) => x.id === id);
    if (w) w.material = w.material === 'glass' ? 'solid' : 'glass';
  });
}

export function toggleDoorStyle(s: Store, id: string) {
  s.commit((p) => {
    const o = p.openings.find((x) => x.id === id);
    if (o && o.kind === 'door') o.style = o.style === 'glass' ? 'wood' : 'glass';
  });
}

export function toggleOpeningFlip(s: Store, id: string) {
  s.commit((p) => {
    const o = p.openings.find((x) => x.id === id);
    if (o) o.flip = !o.flip;
  });
}

export function toggleDoorSwing(s: Store, id: string) {
  s.commit((p) => {
    const o = p.openings.find((x) => x.id === id);
    if (o?.kind === 'door') o.swing = o.swing === 'double' ? 'single' : 'double';
  });
}

export function loadSample(s: Store, id: string) {
  const def = sampleOf(id);
  if (def) s.replaceProject(def.make());
}

export function clearAll(s: Store) {
  s.replaceProject(emptyProject());
}

export function openCtxMenu(s: Store, x: number, y: number, sel: Selection) {
  s.setSel(sel);
  s.patchUI({ ctx: { x, y, sel } });
}

export function closeCtxMenu(s: Store) {
  if (s.ui.ctx) s.patchUI({ ctx: null });
}

/** 确保房间有 meta（点选房间时自动建档） */
export function ensureRoomMeta(s: Store, roomIdx: number): string {
  const r = s.rooms[roomIdx];
  if (r.metaId) return r.metaId;
  const id = uid('r');
  s.commit((p) => {
    p.roomMetas.push({ id, anchor: { ...r.centroid }, name: `房间${p.roomMetas.length + 1}`, floor: 'woodLight' });
  });
  return id;
}

export const fmtLen = (cm: number) => (cm >= 100 ? `${(cm / 100).toFixed(2)} m` : `${Math.round(cm)} cm`);
export const wallLenOf = wallLen;
