import type { Guide, Item, Pt, Wall } from '../core/types';
import type { Editor2D } from './editor';
import { distPtSeg, projT } from '../core/geometry/vec';
import { snapItem, type ItemSnapResult } from '../core/geometry/item-snap';

const GRID = 10;

/** 画墙吸附：端点 > 墙投影 > 轴对齐 > 角度 > 网格 */
export function snapWallPoint(ed: Editor2D, p: Pt, ref: Pt | null): { pt: Pt; guides: Guide[]; hard: boolean } {
  const walls = ed.store.project.walls;
  const tol = 12 / ed.view.s;
  const guides: Guide[] = [];

  for (const w of walls) {
    for (const end of [w.a, w.b]) {
      if (Math.hypot(p.x - end.x, p.y - end.y) <= tol) return { pt: { ...end }, guides, hard: true };
    }
  }
  for (const w of walls) {
    if (distPtSeg(p, w.a, w.b) <= tol) {
      const t = projT(p, w.a, w.b);
      const q = { x: w.a.x + (w.b.x - w.a.x) * t, y: w.a.y + (w.b.y - w.a.y) * t };
      return { pt: q, guides, hard: true };
    }
  }

  let out = { ...p };
  let ax = false, ay = false;
  if (ref) {
    if (Math.abs(p.x - ref.x) <= tol) { out.x = ref.x; ax = true; }
    if (Math.abs(p.y - ref.y) <= tol) { out.y = ref.y; ay = true; }
    if (!ax && !ay) {
      const dx = p.x - ref.x, dy = p.y - ref.y;
      const r = Math.hypot(dx, dy);
      if (r > 1) {
        const ang = Math.atan2(dy, dx);
        const snapAng = Math.round(ang / (Math.PI / 12)) * (Math.PI / 12);
        if (Math.abs(snapAng - ang) < 0.12) out = { x: ref.x + Math.cos(snapAng) * r, y: ref.y + Math.sin(snapAng) * r };
      }
    }
    if (ax) guides.push({ a: ref, b: out });
    if (ay) guides.push({ a: ref, b: out });
  }
  for (const w of walls) {
    for (const end of [w.a, w.b]) {
      if (!ax && Math.abs(out.x - end.x) <= tol) { out.x = end.x; ax = true; guides.push({ a: end, b: out }); }
      if (!ay && Math.abs(out.y - end.y) <= tol) { out.y = end.y; ay = true; guides.push({ a: end, b: out }); }
    }
  }
  if (!ax) out.x = Math.round(out.x / GRID) * GRID;
  if (!ay) out.y = Math.round(out.y / GRID) * GRID;
  return { pt: out, guides, hard: false };
}

/** 家具吸附：贴墙、家具边/中心线、网格 */
export function snapItemPos(ed: Editor2D, p: Pt, item: Item): ItemSnapResult {
  return snapItem(ed.store.project, p, item);
}

/** 求最近墙及参数位置：门窗放置 */
export function nearestWall(ed: Editor2D, p: Pt, maxDist: number): { wall: Wall; t: number } | null {
  let best: { wall: Wall; t: number; d: number } | null = null;
  for (const w of ed.store.project.walls) {
    const d = distPtSeg(p, w.a, w.b);
    if (d <= maxDist && (!best || d < best.d)) best = { wall: w, t: projT(p, w.a, w.b), d };
  }
  return best ? { wall: best.wall, t: best.t } : null;
}

/** 与端点重合的所有墙端（拖拽端点联动） */
export function endGroup(ed: Editor2D, at: Pt): { wallId: string; end: 'a' | 'b' }[] {
  const out: { wallId: string; end: 'a' | 'b' }[] = [];
  for (const w of ed.store.project.walls) {
    if (Math.hypot(w.a.x - at.x, w.a.y - at.y) < 2) out.push({ wallId: w.id, end: 'a' });
    if (Math.hypot(w.b.x - at.x, w.b.y - at.y) < 2) out.push({ wallId: w.id, end: 'b' });
  }
  return out;
}
