import type { Pt, Selection } from '../core/types';
import type { Editor2D } from './editor';
import { distPtSeg, lerp, wallLen } from '../core/geometry/vec';
import { pointInPoly } from '../core/geometry/polygon';

/** 命中家具（含旋转，倒序=后画的优先；地毯让位） */
export function hitItem(ed: Editor2D, p: Pt): string | null {
  const items = ed.store.project.items;
  let rugHit: string | null = null;
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i];
    const rad = (-it.rot * Math.PI) / 180;
    const dx = p.x - it.x, dy = p.y - it.y;
    const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    if (Math.abs(lx) <= it.w / 2 && Math.abs(ly) <= it.d / 2) {
      if (it.defId === 'rug') { rugHit = rugHit ?? it.id; continue; }
      return it.id;
    }
  }
  return rugHit;
}

export function hitOpening(ed: Editor2D, p: Pt, tol: number): string | null {
  for (const o of ed.store.project.openings) {
    const w = ed.store.project.walls.find((x) => x.id === o.wallId);
    if (!w) continue;
    const c = lerp(w.a, w.b, o.t);
    const half = o.width / 2 + tol;
    if (Math.hypot(p.x - c.x, p.y - c.y) <= half && distPtSeg(p, w.a, w.b) <= w.thickness / 2 + tol) return o.id;
  }
  return null;
}

export function hitWall(ed: Editor2D, p: Pt, tol: number): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  for (const w of ed.store.project.walls) {
    const d = distPtSeg(p, w.a, w.b);
    if (d <= w.thickness / 2 + tol && d < bestD) { bestD = d; best = w.id; }
  }
  return best;
}

/** 命中墙端点（仅当该墙被选中时显示手柄） */
export function hitNode(ed: Editor2D, p: Pt, tol: number): { wallId: string; end: 'a' | 'b' } | null {
  const sel = ed.store.sel;
  if (sel?.kind !== 'wall') return null;
  const w = ed.store.project.walls.find((x) => x.id === sel.id);
  if (!w || wallLen(w) < 1) return null;
  for (const end of ['a', 'b'] as const) {
    if (Math.hypot(p.x - w[end].x, p.y - w[end].y) <= tol) return { wallId: w.id, end };
  }
  return null;
}

export function hitRoom(ed: Editor2D, p: Pt): number {
  for (let i = 0; i < ed.store.rooms.length; i++) {
    if (pointInPoly(p, ed.store.rooms[i].poly)) return i;
  }
  return -1;
}

/** 综合命中：用于选择与右键菜单 */
export function hitAny(ed: Editor2D, p: Pt): Selection | null {
  const tol = 8 / ed.view.s;
  const item = hitItem(ed, p);
  if (item) return { kind: 'item', id: item };
  const open = hitOpening(ed, p, tol);
  if (open) return { kind: 'opening', id: open };
  const wall = hitWall(ed, p, tol);
  if (wall) return { kind: 'wall', id: wall };
  return null;
}
