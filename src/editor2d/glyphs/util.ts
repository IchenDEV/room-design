import { shade } from '../../core/geometry/vec';

/** 图例绘制函数：画布已平移到家具中心，w/d 为像素尺寸，背朝 -y */
export type GlyphFn = (ctx: CanvasRenderingContext2D, w: number, d: number, fill: string, line: string) => void;

export const rr = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2)));
};

export const fs = (ctx: CanvasRenderingContext2D) => { ctx.fill(); ctx.stroke(); };

export const seg = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
};

export const ring = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, filled = false) => {
  ctx.beginPath(); ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  if (filled) ctx.fill(); else ctx.stroke();
};

export const ell = (ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) => {
  ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), 0, 0, Math.PI * 2);
};

/** 设定填色/描边，返回描边色 */
export function prep(ctx: CanvasRenderingContext2D, fill: string): string {
  let line: string;
  try { line = shade(fill, -70); } catch { line = '#555'; }
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';
  return line;
}
