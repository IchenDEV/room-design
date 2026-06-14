import type { Pt } from '../core/types';
import type { Editor2D } from './editor';
import type { Bounds } from '../core/geometry/item-bounds';
import { itemBounds } from '../core/geometry/item-bounds';
import { setStatus } from '../ui/statusBus';

const boundsOf = (a: Pt, b: Pt): Bounds => ({
  minX: Math.min(a.x, b.x), minY: Math.min(a.y, b.y),
  maxX: Math.max(a.x, b.x), maxY: Math.max(a.y, b.y),
});

const intersects = (a: Bounds, b: Bounds) =>
  a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;

const selectedIds = (ed: Editor2D): string[] => {
  const box = ed.st.boxSelect;
  if (!box) return [];
  const r = boundsOf(box.a, box.b);
  return ed.store.project.items.filter((it) => intersects(r, itemBounds(it))).map((it) => it.id);
};

export function startBoxSelect(ed: Editor2D, p: Pt) {
  ed.store.setSel(null);
  ed.st.boxSelect = { a: p, b: p };
  ed.st.drag = { kind: 'boxSelect' };
  setStatus('框选 0 件家具', `${Math.round(ed.view.s * 100)}%`);
}

export function updateBoxSelect(ed: Editor2D, p: Pt) {
  if (!ed.st.boxSelect) return;
  ed.st.boxSelect.b = p;
  setStatus(`框选 ${selectedIds(ed).length} 件家具`, `${Math.round(ed.view.s * 100)}%`);
}

export function commitBoxSelect(ed: Editor2D) {
  const box = ed.st.boxSelect;
  const ids = selectedIds(ed);
  ed.st.boxSelect = null;
  if (!box || Math.abs(box.a.x - box.b.x) < 4 || Math.abs(box.a.y - box.b.y) < 4 || !ids.length) {
    ed.store.setSel(null);
  } else {
    ed.store.setSel(ids.length === 1 ? { kind: 'item', id: ids[0] } : { kind: 'multi', ids });
  }
}
