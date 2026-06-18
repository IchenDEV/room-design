import type { Bounds } from './item-bounds';
import { itemBounds } from './item-bounds';
import type { Guide, Item, Project, Pt, Wall } from '../types';
import { distPtSeg, projT, wallNormal } from './vec';

export type ItemSnapMode = 'wall' | 'align' | 'grid';

export interface ItemSnapResult {
  pt: Pt;
  rot: number | null;
  guides: Guide[];
  label: string;
  mode: ItemSnapMode;
}

const GRID = 5;
const EDGE_TOL = 10;

const norm = (deg: number) => Math.round((deg + 360) % 360);
const grid = (v: number) => Math.round(v / GRID) * GRID;

function halfExtents(it: Pick<Item, 'w' | 'd' | 'rot'>) {
  const r = (it.rot * Math.PI) / 180;
  const c = Math.abs(Math.cos(r)), s = Math.abs(Math.sin(r));
  return { x: c * it.w / 2 + s * it.d / 2, y: s * it.w / 2 + c * it.d / 2 };
}

function wallSnap(project: Project, p: Pt, it: Item): ItemSnapResult | null {
  let best: { wall: Wall; d: number; t: number } | null = null;
  for (const w of project.walls) {
    const d = distPtSeg(p, w.a, w.b);
    // 容差：家具外缘离墙 6cm 内才贴墙（it.d/2 + 墙半厚 = 刚好贴墙的距离）
    const limit = it.d / 2 + w.thickness / 2 + 6;
    if (d < limit && (!best || d < best.d)) best = { wall: w, d, t: projT(p, w.a, w.b) };
  }
  if (!best) return null;
  const w = best.wall;
  const n = wallNormal(w);
  const base = { x: w.a.x + (w.b.x - w.a.x) * best.t, y: w.a.y + (w.b.y - w.a.y) * best.t };
  const side = Math.sign((p.x - base.x) * n.x + (p.y - base.y) * n.y) || 1;
  const off = w.thickness / 2 + it.d / 2;
  const ang = (Math.atan2(w.b.y - w.a.y, w.b.x - w.a.x) * 180) / Math.PI;
  const rot = norm(side > 0 ? ang : ang + 180);
  return {
    pt: { x: base.x + n.x * off * side, y: base.y + n.y * off * side },
    rot,
    guides: [{ a: w.a, b: w.b, label: '贴墙' }],
    label: `贴墙 ${rot}°`,
    mode: 'wall',
  };
}

function alignAxis(base: number[], target: number[]): { delta: number; i: number } | null {
  let best: { delta: number; i: number } | null = null;
  for (const b of base) for (let i = 0; i < target.length; i++) {
    const delta = target[i] - b;
    if (Math.abs(delta) <= EDGE_TOL && (!best || Math.abs(delta) < Math.abs(best.delta))) best = { delta, i };
  }
  return best;
}

const centerOf = (b: Bounds): Pt => ({ x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 });

function boundsAlign(project: Project, b: Bounds, exclude: Set<string>): ItemSnapResult | null {
  const p = centerOf(b);
  const baseX = [b.minX, p.x, b.maxX];
  const baseY = [b.minY, p.y, b.maxY];
  let dx: number | null = null, dy: number | null = null;
  const guides: Guide[] = [];
  for (const other of project.items) {
    if (exclude.has(other.id)) continue;
    const ob = itemBounds(other);
    const op = centerOf(ob);
    const tx = [ob.minX, op.x, ob.maxX];
    const ty = [ob.minY, op.y, ob.maxY];
    const ax = alignAxis(baseX, tx);
    const ay = alignAxis(baseY, ty);
    if (ax && (dx === null || Math.abs(ax.delta) < Math.abs(dx))) {
      dx = ax.delta;
      const x = tx[ax.i], y0 = Math.min(b.minY, ob.minY), y1 = Math.max(b.maxY, ob.maxY);
      guides[0] = { a: { x, y: y0 }, b: { x, y: y1 }, label: ax.i === 1 ? '中心对齐' : '边缘对齐' };
    }
    if (ay && (dy === null || Math.abs(ay.delta) < Math.abs(dy))) {
      dy = ay.delta;
      const y = ty[ay.i], x0 = Math.min(b.minX, ob.minX), x1 = Math.max(b.maxX, ob.maxX);
      guides[1] = { a: { x: x0, y }, b: { x: x1, y }, label: ay.i === 1 ? '中心对齐' : '边缘对齐' };
    }
  }
  if (dx === null && dy === null) return null;
  return {
    pt: { x: dx === null ? grid(p.x) : p.x + dx, y: dy === null ? grid(p.y) : p.y + dy },
    rot: null,
    guides: guides.filter(Boolean),
    label: guides.some((g) => g.label === '中心对齐') ? '中心对齐' : '边缘对齐',
    mode: 'align',
  };
}

function itemAlign(project: Project, p: Pt, it: Item): ItemSnapResult | null {
  const h = halfExtents(it);
  const b = { minX: p.x - h.x, minY: p.y - h.y, maxX: p.x + h.x, maxY: p.y + h.y };
  return boundsAlign(project, b, new Set([it.id]));
}

export function snapItem(project: Project, p: Pt, it: Item): ItemSnapResult {
  const wall = wallSnap(project, p, it);
  if (wall) return wall;
  const align = itemAlign(project, p, it);
  if (align) return align;
  return { pt: { x: grid(p.x), y: grid(p.y) }, rot: null, guides: [], label: '网格', mode: 'grid' };
}

export function snapGroup(project: Project, bounds: Bounds, excludeIds: string[]): ItemSnapResult {
  const align = boundsAlign(project, bounds, new Set(excludeIds));
  if (align) return align;
  const p = centerOf(bounds);
  return { pt: { x: grid(p.x), y: grid(p.y) }, rot: null, guides: [], label: '网格', mode: 'grid' };
}
