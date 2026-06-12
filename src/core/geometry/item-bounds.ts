import type { Item } from '../types';

export interface Bounds { minX: number; minY: number; maxX: number; maxY: number }

function half(it: Pick<Item, 'w' | 'd' | 'rot'>) {
  const r = (it.rot * Math.PI) / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return { x: c * it.w / 2 + s * it.d / 2, y: s * it.w / 2 + c * it.d / 2 };
}

export function itemBounds(it: Item): Bounds {
  const h = half(it);
  return { minX: it.x - h.x, minY: it.y - h.y, maxX: it.x + h.x, maxY: it.y + h.y };
}

export function itemsBounds(items: Item[]): Bounds | null {
  if (!items.length) return null;
  let out = itemBounds(items[0]);
  for (const it of items.slice(1)) {
    const b = itemBounds(it);
    out = {
      minX: Math.min(out.minX, b.minX),
      minY: Math.min(out.minY, b.minY),
      maxX: Math.max(out.maxX, b.maxX),
      maxY: Math.max(out.maxY, b.maxY),
    };
  }
  return out;
}
