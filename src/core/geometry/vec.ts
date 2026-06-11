import type { Pt, Wall } from '../types';

export const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
export const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
export const wallLen = (w: Wall) => dist(w.a, w.b);
export const wallDir = (w: Wall): Pt => {
  const l = wallLen(w) || 1;
  return { x: (w.b.x - w.a.x) / l, y: (w.b.y - w.a.y) / l };
};
export const wallNormal = (w: Wall): Pt => {
  const d = wallDir(w);
  return { x: -d.y, y: d.x };
};

/** 点到线段最近参数 t (0..1) */
export function projT(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return 0;
  return Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
}

export function distPtSeg(p: Pt, a: Pt, b: Pt): number {
  const t = projT(p, a, b);
  return dist(p, { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
}

/** 线段相交（不含端点重合），返回交点参数 */
export function segIntersect(p1: Pt, p2: Pt, p3: Pt, p4: Pt): { t: number; u: number; pt: Pt } | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y, d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const den = d1x * d2y - d1y * d2x;
  if (Math.abs(den) < 1e-9) return null;
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / den;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / den;
  if (t < -1e-6 || t > 1 + 1e-6 || u < -1e-6 || u > 1 + 1e-6) return null;
  return { t, u, pt: { x: p1.x + d1x * t, y: p1.y + d1y * t } };
}

/** 颜色明暗调整 amt: -255..255 */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  const r = c(n >> 16), g = c((n >> 8) & 0xff), b = c(n & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
