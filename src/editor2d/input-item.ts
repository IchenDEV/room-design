import type { Pt } from '../core/types';
import { defOf } from '../core/catalog/catalog';
import type { Editor2D } from './editor';
import { snapItemPos } from './snap';
import { resizeFromAnchor, snappedItemAngle, type ItemResizeCorner } from './item-handles';

const applySnapFeedback = (ed: Editor2D, snap: ReturnType<typeof snapItemPos>) => {
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.mode === 'grid' ? null : snap.pt;
  ed.st.snapLabel = snap.label;
};

export function moveDraggedItem(ed: Editor2D, id: string, off: Pt, p: Pt) {
  const it = ed.store.project.items.find((i) => i.id === id);
  if (!it) return;
  const snap = snapItemPos(ed, { x: p.x - off.x, y: p.y - off.y }, it);
  applySnapFeedback(ed, snap);
  ed.store.update((proj) => {
    const t = proj.items.find((i) => i.id === id)!;
    t.x = snap.pt.x; t.y = snap.pt.y;
    if (snap.rot !== null) t.rot = snap.rot;
  });
}

export function rotateDraggedItem(ed: Editor2D, id: string, p: Pt) {
  const it = ed.store.project.items.find((i) => i.id === id);
  if (!it) return;
  const rot = snappedItemAngle(it, p);
  ed.st.guides = [{ a: { x: it.x, y: it.y }, b: p, label: '旋转' }];
  ed.st.snapped = p;
  ed.st.snapLabel = `${rot}°`;
  ed.store.update((proj) => {
    const t = proj.items.find((i) => i.id === id);
    if (t) t.rot = rot;
  });
}

export function resizeDraggedItem(ed: Editor2D, id: string, corner: ItemResizeCorner, anchor: Pt, rot: number, p: Pt) {
  const next = resizeFromAnchor(anchor, rot, corner, p);
  ed.st.guides = [
    { a: anchor, b: { x: next.x, y: next.y }, label: '尺寸' },
    { a: { x: next.x, y: next.y }, b: p, label: '拖拽' },
  ];
  ed.st.snapped = p;
  ed.st.snapLabel = `${next.w}×${next.d} cm`;
  ed.store.update((proj) => {
    const t = proj.items.find((i) => i.id === id);
    if (t) { t.x = next.x; t.y = next.y; t.w = next.w; t.d = next.d; }
  });
}

export function updatePlaceSnap(ed: Editor2D, defId: string, p: Pt) {
  const def = defOf(defId);
  const ghost = { id: 'ghost', defId, x: p.x, y: p.y, rot: 0, w: def.w, d: def.d, h: def.h };
  applySnapFeedback(ed, snapItemPos(ed, p, ghost));
}
