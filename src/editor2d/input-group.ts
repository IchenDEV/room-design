import type { Bounds } from '../core/geometry/item-bounds';
import { itemsBounds } from '../core/geometry/item-bounds';
import { groupItems } from '../core/store/item-groups';
import { snapGroup } from '../core/geometry/item-snap';
import type { Pt } from '../core/types';
import type { Editor2D } from './editor';
import type { Drag } from './state';

const center = (b: Bounds): Pt => ({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });
const shifted = (b: Bounds, dx: number, dy: number): Bounds => ({
  minX: b.minX + dx, minY: b.minY + dy, maxX: b.maxX + dx, maxY: b.maxY + dy,
});

export function startGroupDrag(ed: Editor2D, id: string, p: Pt): Drag | null {
  const items = groupItems(ed.store, id);
  const bounds = itemsBounds(items);
  if (!bounds) return null;
  const origin = center(bounds);
  return {
    kind: 'group',
    id,
    off: { x: p.x - origin.x, y: p.y - origin.y },
    origin,
    bounds,
    items: items.map((it) => ({ id: it.id, x: it.x, y: it.y })),
    moved: false,
  };
}

export function moveDraggedGroup(ed: Editor2D, d: Extract<Drag, { kind: 'group' }>, p: Pt) {
  const raw = { x: p.x - d.off.x, y: p.y - d.off.y };
  const rawDx = raw.x - d.origin.x, rawDy = raw.y - d.origin.y;
  const snap = snapGroup(ed.store.project, shifted(d.bounds, rawDx, rawDy), d.items.map((it) => it.id));
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.mode === 'grid' ? null : snap.pt;
  ed.st.snapLabel = snap.label;
  const dx = snap.pt.x - d.origin.x, dy = snap.pt.y - d.origin.y;
  ed.store.update((proj) => {
    for (const start of d.items) {
      const it = proj.items.find((x) => x.id === start.id);
      if (it) { it.x = start.x + dx; it.y = start.y + dy; }
    }
  });
}
