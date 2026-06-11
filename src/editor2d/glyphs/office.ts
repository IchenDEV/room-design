import { rr, fs, seg, ring } from './util';
import type { GlyphFn } from './util';

export const officechair: GlyphFn = (ctx, w, d) => {
  const r = Math.min(w, d) / 2;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    seg(ctx, 0, 0, Math.cos(a) * r, Math.sin(a) * r);             // 五星脚
  }
  ring(ctx, 0, 0, r * 0.62, true); ctx.stroke();                  // 座面
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.86, Math.PI * 1.2, Math.PI * 1.8);          // 靠背弧
  ctx.lineWidth = 2.4; ctx.stroke(); ctx.lineWidth = 1.4;
};

export const filecabinet: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 1.5); fs(ctx);
  for (const t of [-0.25, 0, 0.25]) {
    seg(ctx, -hw + 2, t * d, hw - 2, t * d);
  }
  ring(ctx, 0, -d * 0.36, 1.2, true); ring(ctx, 0, -d * 0.12, 1.2, true);
};

export const whiteboard: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 1); fs(ctx);
  ctx.beginPath();
  ctx.moveTo(-w * 0.34, 0);
  ctx.quadraticCurveTo(-w * 0.1, -d * 0.5, w * 0.08, 0);
  ctx.quadraticCurveTo(w * 0.2, d * 0.4, w * 0.34, 0);
  ctx.stroke();                                                    // 笔迹
};

export const printer: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2.5); fs(ctx);
  rr(ctx, -hw + 3, -hd + 3, w - 6, d * 0.28, 1.5); ctx.stroke();   // 出纸口
  seg(ctx, -hw + 3, hd - d * 0.25, hw - 3, hd - d * 0.25);
  ring(ctx, hw - 5, hd - 5, 1.2, true);
};

export const partition: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 1.5); fs(ctx);
  for (const t of [-0.3, -0.1, 0.1, 0.3]) {
    seg(ctx, t * w, -d / 2 + 1, t * w + w * 0.08, d / 2 - 1);      // 斜纹
  }
};
