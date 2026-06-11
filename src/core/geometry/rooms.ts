import type { Pt, Wall, RoomPoly } from '../types';
import { dist, segIntersect } from './vec';
import { traceFaces } from './faces';

const EPS = 3; // 端点合并容差 cm

interface Seg { a: Pt; b: Pt }

/** 在交叉/丁字处打断所有墙段 */
function splitSegments(walls: Wall[]): Seg[] {
  let segs: Seg[] = walls.map((w) => ({ a: { ...w.a }, b: { ...w.b } }));
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    const out: Seg[] = [];
    for (const s of segs) {
      const cuts: number[] = [];
      for (const o of segs) {
        if (o === s) continue;
        const hit = segIntersect(s.a, s.b, o.a, o.b);
        if (hit && hit.t > 0.001 && hit.t < 0.999) cuts.push(hit.t);
      }
      if (!cuts.length) { out.push(s); continue; }
      changed = true;
      const ts = [0, ...cuts.sort((x, y) => x - y), 1];
      for (let i = 0; i < ts.length - 1; i++) {
        const a = { x: s.a.x + (s.b.x - s.a.x) * ts[i], y: s.a.y + (s.b.y - s.a.y) * ts[i] };
        const b = { x: s.a.x + (s.b.x - s.a.x) * ts[i + 1], y: s.a.y + (s.b.y - s.a.y) * ts[i + 1] };
        if (dist(a, b) > 1) out.push({ a, b });
      }
    }
    segs = out;
    if (!changed) break;
  }
  return segs;
}

export interface Graph { nodes: Pt[]; edges: [number, number][] }

function buildGraph(segs: Seg[]): Graph {
  const nodes: Pt[] = [];
  const idOf = (p: Pt) => {
    for (let i = 0; i < nodes.length; i++) if (dist(nodes[i], p) < EPS) return i;
    nodes.push({ ...p });
    return nodes.length - 1;
  };
  const set = new Set<string>();
  const edges: [number, number][] = [];
  for (const s of segs) {
    const i = idOf(s.a), j = idOf(s.b);
    if (i === j) continue;
    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (set.has(key)) continue;
    set.add(key);
    edges.push([i, j]);
  }
  return { nodes, edges };
}

/** 从墙体集合自动识别房间（平面图最小回路） */
export function detectRooms(walls: Wall[]): RoomPoly[] {
  if (walls.length < 3) return [];
  return traceFaces(buildGraph(splitSegments(walls)));
}
