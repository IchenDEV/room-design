import type { Item, Pt } from '../core/types';
import type { Editor2D } from './editor';

const HANDLE_GAP = 28;
const HIT_R = 13;
const SIZE_GRID = 5;
const MIN_W = 20;
const MIN_D = 10;

export type ItemResizeCorner = 'nw' | 'ne' | 'se' | 'sw';

const signs: Record<ItemResizeCorner, Pt> = {
  nw: { x: -1, y: 1 }, ne: { x: 1, y: 1 }, se: { x: 1, y: -1 }, sw: { x: -1, y: -1 },
};
const opposite: Record<ItemResizeCorner, ItemResizeCorner> = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' };

function rotVec(rot: number, lx: number, ly: number): Pt {
  const r = (rot * Math.PI) / 180;
  return {
    x: lx * Math.cos(r) - ly * Math.sin(r),
    y: lx * Math.sin(r) + ly * Math.cos(r),
  };
}

export function itemLocalToWorld(it: Pick<Item, 'x' | 'y' | 'rot'>, lx: number, ly: number): Pt {
  const v = rotVec(it.rot, lx, ly);
  return { x: it.x + v.x, y: it.y + v.y };
}

function itemLocalToScreen(ed: Editor2D, it: Item, lx: number, ly: number): Pt {
  return ed.w2s(itemLocalToWorld(it, lx, ly));
}

export function itemTopScreen(ed: Editor2D, it: Item): Pt {
  return itemLocalToScreen(ed, it, 0, it.d / 2 + 6 / ed.view.s);
}

export function rotateHandleScreen(ed: Editor2D, it: Item): Pt {
  return itemLocalToScreen(ed, it, 0, it.d / 2 + HANDLE_GAP / ed.view.s);
}

export function resizeHandlesScreen(ed: Editor2D, it: Item): { corner: ItemResizeCorner; pt: Pt }[] {
  return (Object.keys(signs) as ItemResizeCorner[]).map((corner) => {
    const s = signs[corner];
    return { corner, pt: itemLocalToScreen(ed, it, s.x * it.w / 2, s.y * it.d / 2) };
  });
}

export function hitItemResizeHandle(ed: Editor2D, s: Pt): { id: string; corner: ItemResizeCorner } | null {
  const sel = ed.store.sel;
  if (sel?.kind !== 'item') return null;
  const it = ed.store.project.items.find((x) => x.id === sel.id);
  if (!it) return null;
  for (const h of resizeHandlesScreen(ed, it)) {
    if (Math.hypot(s.x - h.pt.x, s.y - h.pt.y) <= HIT_R) return { id: it.id, corner: h.corner };
  }
  return null;
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

export function resizeAnchor(it: Item, corner: ItemResizeCorner): Pt {
  const s = signs[opposite[corner]];
  return itemLocalToWorld(it, s.x * it.w / 2, s.y * it.d / 2);
}

export function resizeFromAnchor(anchor: Pt, rot: number, corner: ItemResizeCorner, p: Pt) {
  const dx = p.x - anchor.x, dy = p.y - anchor.y;
  const r = (-rot * Math.PI) / 180;
  const local = { x: dx * Math.cos(r) - dy * Math.sin(r), y: dx * Math.sin(r) + dy * Math.cos(r) };
  const sg = signs[corner];
  const w = Math.max(MIN_W, Math.round(Math.max(0, sg.x * local.x) / SIZE_GRID) * SIZE_GRID);
  const d = Math.max(MIN_D, Math.round(Math.max(0, sg.y * local.y) / SIZE_GRID) * SIZE_GRID);
  const mid = rotVec(rot, sg.x * w / 2, sg.y * d / 2);
  return { x: anchor.x + mid.x, y: anchor.y + mid.y, w, d };
}

export const resizeCursor = (corner: ItemResizeCorner) => (corner === 'nw' || corner === 'se' ? 'nwse-resize' : 'nesw-resize');
