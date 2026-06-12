import type { Item, Pt } from '../core/types';
import type { Editor2D } from './editor';

const HANDLE_GAP = 28;
const HIT_R = 13;

function localToScreen(ed: Editor2D, it: Item, lx: number, ly: number): Pt {
  const c = ed.w2s({ x: it.x, y: it.y });
  const r = (-it.rot * Math.PI) / 180;
  return {
    x: c.x + lx * Math.cos(r) - ly * Math.sin(r),
    y: c.y + lx * Math.sin(r) + ly * Math.cos(r),
  };
}

export function itemTopScreen(ed: Editor2D, it: Item): Pt {
  return localToScreen(ed, it, 0, (-it.d / 2) * ed.view.s - 6);
}

export function rotateHandleScreen(ed: Editor2D, it: Item): Pt {
  return localToScreen(ed, it, 0, (-it.d / 2) * ed.view.s - HANDLE_GAP);
}

export function hitItemRotateHandle(ed: Editor2D, s: Pt): string | null {
  const sel = ed.store.sel;
  if (sel?.kind !== 'item') return null;
  const it = ed.store.project.items.find((x) => x.id === sel.id);
  if (!it) return null;
  const h = rotateHandleScreen(ed, it);
  return Math.hypot(s.x - h.x, s.y - h.y) <= HIT_R ? it.id : null;
}

export function snappedItemAngle(it: Item, p: Pt): number {
  const deg = 90 - (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI;
  return (Math.round(deg / 15) * 15 + 360) % 360;
}
