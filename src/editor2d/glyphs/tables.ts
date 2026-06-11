import { rr, fs, seg, ring, ell } from './util';
import type { GlyphFn } from './util';

export const table: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 3); fs(ctx);
  rr(ctx, -w / 2 + 3, -d / 2 + 3, w - 6, d - 6, 2); ctx.stroke();
};

export const roundtable: GlyphFn = (ctx, w, d) => {
  ell(ctx, 0, 0, w / 2, d / 2); fs(ctx);
  ell(ctx, 0, 0, w / 2 - 4, d / 2 - 4); ctx.stroke();
};

export const tvstand: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2); fs(ctx);
  ctx.lineWidth = 3;
  seg(ctx, -w * 0.32, -hd + 2.5, w * 0.32, -hd + 2.5); // 电视屏
  ctx.lineWidth = 1.4;
  seg(ctx, -hw + 3, hd - d * 0.35, hw - 3, hd - d * 0.35);
};

export const shelf: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 1.5); fs(ctx);
  for (const t of [-0.25, 0, 0.25]) seg(ctx, t * w, -d / 2 + 1.5, t * w, d / 2 - 1.5);
};

export const officedesk: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2.5); fs(ctx);
  rr(ctx, -w * 0.2, -hd + 2, w * 0.4, d * 0.12, 1.5); fs(ctx);   // 显示器
  ring(ctx, 0, -hd + d * 0.2, 1.2, true);                         // 支架
  rr(ctx, -w * 0.16, -d * 0.06, w * 0.32, d * 0.18, 1.5); ctx.stroke(); // 键盘
};
