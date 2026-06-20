import type { Guide, Pt, Wall } from '../core/types';
import type { Editor2D } from './editor';
import type { WallDragEnd, WallEndRef, WallNodeRef } from './state';
import { distPtSeg, projT } from '../core/geometry/vec';
import { endGroup } from './snap';

const GRID = 10;
const RIGHT_ANGLE = '直角';

type SnapResult = { pt: Pt; guides: Guide[]; hard: boolean; label: string | null };

const grid = (v: number) => Math.round(v / GRID) * GRID;
const endKey = (en: WallEndRef) => `${en.wallId}:${en.end}`;
const otherEnd = (end: 'a' | 'b') => (end === 'a' ? 'b' : 'a');

function stationaryEnds(ed: Editor2D, excludeEnds: WallEndRef[]): Pt[] {
  const exclude = new Set(excludeEnds.map(endKey));
  const out: Pt[] = [];
  for (const w of ed.store.project.walls) {
    if (!exclude.has(`${w.id}:a`)) out.push(w.a);
    if (!exclude.has(`${w.id}:b`)) out.push(w.b);
  }
  return out;
}

function orthogonalSnap(p: Pt, refs: Pt[], tol: number): SnapResult | null {
  let sx: { d: number; ref: Pt } | null = null;
  let sy: { d: number; ref: Pt } | null = null;

  for (const ref of refs) {
    const dx = Math.abs(p.x - ref.x);
    const dy = Math.abs(p.y - ref.y);
    if (dx <= tol && (!sx || dx < sx.d)) sx = { d: dx, ref };
    if (dy <= tol && (!sy || dy < sy.d)) sy = { d: dy, ref };
  }
  if (!sx && !sy) return null;

  const out = { x: sx ? sx.ref.x : p.x, y: sy ? sy.ref.y : p.y };
  const guides: Guide[] = [];
  if (sx) guides.push({ a: sx.ref, b: out, label: RIGHT_ANGLE });
  if (sy) guides.push({ a: sy.ref, b: out, label: RIGHT_ANGLE });
  return { pt: out, guides, hard: false, label: RIGHT_ANGLE };
}

/** 拖墙端点时，相连墙的另一端就是直角吸附参考点。 */
export function wallNodeRefs(ed: Editor2D, ends: WallEndRef[]): WallNodeRef[] {
  const refs: WallNodeRef[] = [];
  const seen = new Set<string>();
  for (const en of ends) {
    const w = ed.store.project.walls.find((x) => x.id === en.wallId);
    if (!w) continue;
    const end = otherEnd(en.end);
    const key = `${w.id}:${end}`;
    if (seen.has(key)) continue;
    seen.add(key);
    refs.push({ wallId: w.id, end, pt: { ...w[end] } });
  }
  return refs;
}

/** 整段拖墙时记录所有联动墙端，用起始点计算绝对位移，避免增量吸附抖动。 */
export function wallDragEnds(ed: Editor2D, wall: Wall): WallDragEnd[] {
  const groups = [...endGroup(ed, wall.a), ...endGroup(ed, wall.b)];
  const out: WallDragEnd[] = [];
  const seen = new Set<string>();
  for (const g of groups) {
    const key = endKey(g);
    if (seen.has(key)) continue;
    seen.add(key);
    const w = ed.store.project.walls.find((x) => x.id === g.wallId);
    if (w) out.push({ ...g, origin: { ...w[g.end] } });
  }
  return out;
}

/** 已有墙端点吸附：墙端/墙线硬吸附，其次吸附为水平/垂直的直角关系。 */
export function snapWallNode(ed: Editor2D, p: Pt, ends: WallEndRef[], refs: WallNodeRef[]): SnapResult {
  const tol = 12 / ed.view.s;
  const movingWalls = new Set(ends.map((en) => en.wallId));

  for (const end of stationaryEnds(ed, ends)) {
    if (Math.hypot(p.x - end.x, p.y - end.y) <= tol) return { pt: { ...end }, guides: [], hard: true, label: null };
  }
  for (const w of ed.store.project.walls) {
    if (movingWalls.has(w.id)) continue;
    if (distPtSeg(p, w.a, w.b) <= tol) {
      const t = projT(p, w.a, w.b);
      return {
        pt: { x: w.a.x + (w.b.x - w.a.x) * t, y: w.a.y + (w.b.y - w.a.y) * t },
        guides: [],
        hard: true,
        label: null,
      };
    }
  }

  const ortho = orthogonalSnap(p, refs.map((r) => r.pt), tol);
  if (ortho) return ortho;

  let out = { ...p };
  let ax = false, ay = false;
  const guides: Guide[] = [];
  for (const end of stationaryEnds(ed, ends)) {
    if (!ax && Math.abs(out.x - end.x) <= tol) { out.x = end.x; ax = true; guides.push({ a: end, b: out }); }
    if (!ay && Math.abs(out.y - end.y) <= tol) { out.y = end.y; ay = true; guides.push({ a: end, b: out }); }
  }
  if (!ax) out.x = grid(out.x);
  if (!ay) out.y = grid(out.y);
  return { pt: out, guides, hard: false, label: null };
}

export function snapWallMove(ed: Editor2D, ends: WallDragEnd[], rawDx: number, rawDy: number) {
  const tol = 12 / ed.view.s;
  const stationary = stationaryEnds(ed, ends);
  let sx: { d: number; delta: number; target: Pt; moving: WallDragEnd } | null = null;
  let sy: { d: number; delta: number; target: Pt; moving: WallDragEnd } | null = null;

  for (const moving of ends) {
    const raw = { x: moving.origin.x + rawDx, y: moving.origin.y + rawDy };
    for (const target of stationary) {
      const dx = target.x - raw.x;
      const dy = target.y - raw.y;
      if (Math.abs(dx) <= tol && (!sx || Math.abs(dx) < sx.d)) sx = { d: Math.abs(dx), delta: dx, target, moving };
      if (Math.abs(dy) <= tol && (!sy || Math.abs(dy) < sy.d)) sy = { d: Math.abs(dy), delta: dy, target, moving };
    }
  }

  const dx = rawDx + (sx?.delta ?? 0);
  const dy = rawDy + (sy?.delta ?? 0);
  const guides: Guide[] = [];
  const finalOf = (en: WallDragEnd): Pt => ({ x: en.origin.x + dx, y: en.origin.y + dy });
  if (sx) guides.push({ a: sx.target, b: finalOf(sx.moving), label: RIGHT_ANGLE });
  if (sy) guides.push({ a: sy.target, b: finalOf(sy.moving), label: RIGHT_ANGLE });
  const snapped = sx || sy ? finalOf((sx ?? sy)!.moving) : null;
  return { dx, dy, guides, snapped, label: snapped ? RIGHT_ANGLE : null };
}
