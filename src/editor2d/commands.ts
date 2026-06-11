import { uid } from '../core/types';
import type { Pt } from '../core/types';
import type { Editor2D } from './editor';
import { wallLen, lerp } from '../core/geometry/vec';
import { defOf } from '../core/catalog/catalog';
import { snapItemPos } from './snap';

const wallTpl = (ed: Editor2D, a: Pt, b: Pt) => ({
  id: uid('w'), a: { ...a }, b: { ...b },
  thickness: ed.store.project.settings.wallThickness,
  height: ed.store.project.settings.wallHeight,
  color: '#e8e4da',
});

export function escape(ed: Editor2D) {
  const st = ed.st;
  if (st.chain.length || st.rectA) {
    st.chain = []; st.chainCur = null; st.rectA = null; st.rectB = null;
  } else if (ed.store.ui.tool.type !== 'select') {
    ed.store.setTool({ type: 'select' });
  } else {
    ed.store.setSel(null);
  }
  st.ghostOpen = null;
  st.guides = [];
  ed.requestDraw();
}

/** 画墙：点击追加锚点，每段即时成墙 */
export function addChainPoint(ed: Editor2D, pt: Pt) {
  const st = ed.st;
  const last = st.chain[st.chain.length - 1];
  if (last && Math.hypot(pt.x - last.x, pt.y - last.y) < 5) { endChain(ed); return; }
  if (last) ed.store.commit((p) => { p.walls.push(wallTpl(ed, last, pt)); });
  st.chain.push({ ...pt });
}

export function endChain(ed: Editor2D) {
  ed.st.chain = [];
  ed.st.chainCur = null;
  ed.st.guides = [];
  ed.requestDraw();
}

export function commitRect(ed: Editor2D) {
  const { rectA: a, rectB: b } = ed.st;
  if (a && b && Math.abs(a.x - b.x) > 20 && Math.abs(a.y - b.y) > 20) {
    const c = [{ x: a.x, y: a.y }, { x: b.x, y: a.y }, { x: b.x, y: b.y }, { x: a.x, y: b.y }];
    ed.store.commit((p) => {
      for (let i = 0; i < 4; i++) p.walls.push(wallTpl(ed, c[i], c[(i + 1) % 4]));
    });
  }
  ed.st.rectA = null;
  ed.st.rectB = null;
}

/** 门窗放置（依赖 ghostOpen 校验结果） */
export function placeOpening(ed: Editor2D, kind: 'door' | 'window') {
  const g = ed.st.ghostOpen;
  if (!g?.valid) return;
  const id = uid('o');
  ed.store.commit((p) => {
    p.openings.push({
      id, wallId: g.wallId, kind, t: g.t,
      width: kind === 'door' ? 90 : 150,
      height: kind === 'door' ? 210 : 140,
      sill: kind === 'door' ? 0 : 90, flip: false,
    });
  });
  ed.store.setSel({ kind: 'opening', id });
}

export function ghostValid(ed: Editor2D, wallId: string, t: number, width: number): boolean {
  const w = ed.store.project.walls.find((x) => x.id === wallId);
  if (!w) return false;
  const len = wallLen(w);
  const c = t * len;
  if (c - width / 2 < 4 || c + width / 2 > len - 4) return false;
  for (const o of ed.store.project.openings) {
    if (o.wallId !== wallId) continue;
    if (Math.abs(o.t * len - c) < o.width / 2 + width / 2 + 6) return false;
  }
  return true;
}

export function placeItem(ed: Editor2D, defId: string, p: Pt) {
  const def = defOf(defId);
  const snap = snapItemPos(ed, p, def.d);
  const id = uid('i');
  ed.store.commit((proj) => {
    proj.items.push({ id, defId, x: snap.pt.x, y: snap.pt.y, rot: snap.rot ?? 0, w: def.w, d: def.d, h: def.h });
  });
  ed.store.setSel({ kind: 'item', id });
}

export function rotateSel(ed: Editor2D, delta = 90) {
  const sel = ed.store.sel;
  if (sel?.kind !== 'item') return;
  ed.store.commit((p) => {
    const it = p.items.find((i) => i.id === sel.id);
    if (it) it.rot = (it.rot + delta + 360) % 360;
  });
}

export function nudgeSel(ed: Editor2D, dx: number, dy: number) {
  const sel = ed.store.sel;
  if (sel?.kind !== 'item') return;
  ed.store.commit((p) => {
    const it = p.items.find((i) => i.id === sel.id);
    if (it) { it.x += dx; it.y += dy; }
  });
}

/** 门窗在墙上的两个端点（世界坐标） */
export function openingSpan(ed: Editor2D, openingId: string): { a: Pt; b: Pt } | null {
  const o = ed.store.project.openings.find((x) => x.id === openingId);
  const w = o && ed.store.project.walls.find((x) => x.id === o.wallId);
  if (!o || !w) return null;
  const len = wallLen(w) || 1;
  return { a: lerp(w.a, w.b, o.t - o.width / 2 / len), b: lerp(w.a, w.b, o.t + o.width / 2 / len) };
}
