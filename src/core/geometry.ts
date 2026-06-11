import type { Pt, Wall, RoomPoly } from './types';

/** 端点合并容差 (cm) */
export const EPS = 1.5;
/** 房间最小面积 5000 cm² = 0.5 m² */
const MIN_ROOM_AREA = 5000;

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

export const wallA = (w: Wall): Pt => ({ x: w.ax, y: w.ay });
export const wallB = (w: Wall): Pt => ({ x: w.bx, y: w.by });
export const wallLen = (w: Wall) => Math.hypot(w.bx - w.ax, w.by - w.ay);

export function wallDir(w: Wall): Pt {
  const l = wallLen(w) || 1;
  return { x: (w.bx - w.ax) / l, y: (w.by - w.ay) / l };
}

export function wallNormal(w: Wall): Pt {
  const d = wallDir(w);
  return { x: -d.y, y: d.x };
}

/** 点到线段的最近距离与投影参数 */
export function distPtSeg(p: Pt, a: Pt, b: Pt): { d: number; t: number } {
  const vx = b.x - a.x, vy = b.y - a.y;
  const l2 = vx * vx + vy * vy;
  if (l2 < 1e-9) return { d: dist(p, a), t: 0 };
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2;
  t = Math.max(0, Math.min(1, t));
  return { d: Math.hypot(p.x - (a.x + vx * t), p.y - (a.y + vy * t)), t };
}

export function segSegIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): { t: number; u: number } | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / den;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / den;
  return { t, u };
}

/** 有向面积（y 轴向上时逆时针为正） */
export function polygonArea(poly: Pt[]) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

export function polygonCentroid(poly: Pt[]): Pt {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const c = p.x * q.y - q.x * p.y;
    a += c; cx += (p.x + q.x) * c; cy += (p.y + q.y) * c;
  }
  if (Math.abs(a) < 1e-6) {
    let sx = 0, sy = 0;
    for (const p of poly) { sx += p.x; sy += p.y; }
    return { x: sx / poly.length, y: sy / poly.length };
  }
  a *= 0.5;
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

export function pointInPoly(p: Pt, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

/**
 * 房间自动识别：
 * 1. 在 T 形交点 / 交叉处把墙体拆分为子线段
 * 2. 合并相近端点构建平面图
 * 3. 沿"最小转角"规则遍历有向边，提取所有内部面（逆时针、有向面积为正）
 */
export function detectRooms(walls: Wall[]): RoomPoly[] {
  const segs = walls.filter(w => wallLen(w) > EPS * 2);
  if (segs.length < 3) return [];

  // ---- 1. 计算每面墙的拆分参数 ----
  const splitTs: number[][] = segs.map(() => [0, 1]);
  for (let i = 0; i < segs.length; i++) {
    const A = wallA(segs[i]), B = wallB(segs[i]);
    const Li = wallLen(segs[i]);
    for (let j = 0; j < segs.length; j++) {
      if (i === j) continue;
      const C = wallA(segs[j]), D = wallB(segs[j]);
      // 其它墙的端点落在本墙中段（T 形）
      for (const q of [C, D]) {
        const { d, t } = distPtSeg(q, A, B);
        if (d < EPS && t * Li > EPS && (1 - t) * Li > EPS) splitTs[i].push(t);
      }
      // 真正的十字交叉
      const hit = segSegIntersect(A, B, C, D);
      if (hit) {
        const Lj = wallLen(segs[j]);
        if (hit.t * Li > EPS && (1 - hit.t) * Li > EPS && hit.u * Lj > EPS && (1 - hit.u) * Lj > EPS) {
          splitTs[i].push(hit.t);
        }
      }
    }
  }

  // ---- 2. 节点合并 + 边去重 ----
  const nodes: Pt[] = [];
  const nodeId = (p: Pt) => {
    for (let k = 0; k < nodes.length; k++) if (dist(nodes[k], p) <= EPS) return k;
    nodes.push({ x: p.x, y: p.y });
    return nodes.length - 1;
  };
  const edges: { a: number; b: number }[] = [];
  const seen = new Set<string>();
  segs.forEach((w, i) => {
    const ts = [...new Set(splitTs[i].map(t => Math.round(t * 1e5) / 1e5))].sort((a, b) => a - b);
    const A = wallA(w), B = wallB(w);
    for (let k = 0; k + 1 < ts.length; k++) {
      const ia = nodeId(lerp(A, B, ts[k]));
      const ib = nodeId(lerp(A, B, ts[k + 1]));
      if (ia === ib) continue;
      const key = ia < ib ? `${ia}_${ib}` : `${ib}_${ia}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ a: ia, b: ib });
    }
  });
  if (edges.length < 3) return [];

  // ---- 3. 邻接表（按方位角逆时针排序） ----
  const adj: { to: number; edge: number; ang: number }[][] = nodes.map(() => []);
  edges.forEach((e, idx) => {
    const A = nodes[e.a], B = nodes[e.b];
    adj[e.a].push({ to: e.b, edge: idx, ang: Math.atan2(B.y - A.y, B.x - A.x) });
    adj[e.b].push({ to: e.a, edge: idx, ang: Math.atan2(A.y - B.y, A.x - B.x) });
  });
  adj.forEach(l => l.sort((p, q) => p.ang - q.ang));

  // ---- 4. 有向边面遍历 ----
  const dirKey = (edge: number, from: number) => edge * 2 + (edges[edge].a === from ? 0 : 1);
  const visited = new Set<number>();
  const rooms: RoomPoly[] = [];

  for (let ei = 0; ei < edges.length; ei++) {
    for (const start of [
      { u: edges[ei].a, v: edges[ei].b },
      { u: edges[ei].b, v: edges[ei].a },
    ]) {
      if (visited.has(dirKey(ei, start.u))) continue;
      const faceNodes: number[] = [];
      let u = start.u, v = start.v, e = ei;
      let guard = 0;
      while (guard++ < 20000) {
        visited.add(dirKey(e, u));
        faceNodes.push(u);
        // 在 v 处选取"从来边顺时针方向的下一条边"
        const list = adj[v];
        const idx = list.findIndex(x => x.edge === e);
        const nxt = list[(idx - 1 + list.length) % list.length];
        u = v; v = nxt.to; e = nxt.edge;
        if (u === start.u && v === start.v && e === ei) break;
      }

      // ---- 去除毛刺（来回走的死端） ----
      let seq = faceNodes.slice();
      let changed = true;
      while (changed && seq.length >= 3) {
        changed = false;
        for (let i = 0; i < seq.length; i++) {
          const n = seq.length;
          if (seq[(i - 1 + n) % n] === seq[(i + 1) % n]) {
            const r1 = i, r2 = (i + 1) % n;
            const [hi, lo] = r1 > r2 ? [r1, r2] : [r2, r1];
            seq.splice(hi, 1);
            seq.splice(lo, 1);
            changed = true;
            break;
          }
        }
      }
      // 连续重复节点去重
      seq = seq.filter((n, i) => n !== seq[(i + 1) % seq.length]);
      if (seq.length < 3) continue;

      const poly = seq.map(n => ({ x: nodes[n].x, y: nodes[n].y }));
      const area = polygonArea(poly);
      if (area > MIN_ROOM_AREA) {
        rooms.push({ poly, area, centroid: polygonCentroid(poly), metaId: null });
      }
    }
  }

  rooms.sort((a, b) => b.area - a.area);
  return rooms;
}

/** 颜色加深/变亮工具 */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
