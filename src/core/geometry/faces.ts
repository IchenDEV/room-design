import type { RoomPoly } from '../types';
import { polygonArea, polygonCentroid } from './polygon';
import type { Graph } from './rooms';

interface HalfEdge { to: number; edge: number; ang: number }

/** 去除悬空墙产生的毛刺（A-B-A 折返） */
function trimSpurs(face: number[]): number[] {
  const c = face.slice();
  let again = true;
  while (again && c.length >= 3) {
    again = false;
    for (let i = 0; i < c.length; i++) {
      const n = c.length;
      if (c[(i - 1 + n) % n] === c[(i + 1) % n]) {
        const j = (i + 1) % n;
        const [hi, lo] = i > j ? [i, j] : [j, i];
        c.splice(hi, 1); c.splice(lo, 1);
        again = true;
        break;
      }
    }
  }
  return c.filter((v, i) => v !== c[(i + 1) % c.length]);
}

/** 半边遍历：提取平面图全部有界面（房间多边形） */
export function traceFaces({ nodes, edges }: Graph): RoomPoly[] {
  const adj: HalfEdge[][] = nodes.map(() => []);
  edges.forEach(([a, b], idx) => {
    adj[a].push({ to: b, edge: idx, ang: Math.atan2(nodes[b].y - nodes[a].y, nodes[b].x - nodes[a].x) });
    adj[b].push({ to: a, edge: idx, ang: Math.atan2(nodes[a].y - nodes[b].y, nodes[a].x - nodes[b].x) });
  });
  adj.forEach((l) => l.sort((x, y) => x.ang - y.ang));

  const heKey = (edge: number, from: number) => edge * 2 + (edges[edge][0] === from ? 0 : 1);
  const used = new Set<number>();
  const out: RoomPoly[] = [];

  for (let e = 0; e < edges.length; e++) {
    for (const start of [{ u: edges[e][0], v: edges[e][1] }, { u: edges[e][1], v: edges[e][0] }]) {
      if (used.has(heKey(e, start.u))) continue;
      const face: number[] = [];
      let from = start.u, to = start.v, edge = e, guard = 0;
      while (guard++ < 20000) {
        used.add(heKey(edge, from));
        face.push(from);
        const ring = adj[to];
        const back = ring.findIndex((h) => h.edge === edge);
        const next = ring[(back - 1 + ring.length) % ring.length];
        from = to; to = next.to; edge = next.edge;
        if (from === start.u && to === start.v && edge === e) break;
      }
      const clean = trimSpurs(face);
      if (clean.length < 3) continue;
      const poly = clean.map((i) => ({ x: nodes[i].x, y: nodes[i].y }));
      const area = polygonArea(poly);
      if (area > 15000) out.push({ poly, area, centroid: polygonCentroid(poly) });
    }
  }
  out.sort((a, b) => b.area - a.area);
  return out;
}
