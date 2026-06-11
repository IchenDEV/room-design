import { rr, fs, seg, ring, ell } from './util';
import type { GlyphFn } from './util';

export const bed: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 3); fs(ctx);
  const pw = w > 60 ? (w - 12) / 2 : w - 8;
  rr(ctx, -hw + 4, -hd + 3, pw, d * 0.12, 2); fs(ctx);          // 枕头
  if (w > 60) { rr(ctx, 8 - hw + pw, -hd + 3, pw, d * 0.12, 2); fs(ctx); }
  seg(ctx, -hw + 2, -hd + d * 0.3, hw - 2, -hd + d * 0.3);      // 被沿
  seg(ctx, -hw + 2, -hd + d * 0.38, hw - 2, -hd + d * 0.38);
};

export const toilet: GlyphFn = (ctx, w, d) => {
  const hd = d / 2;
  rr(ctx, -w / 2, -hd, w, d * 0.3, 2); fs(ctx);                  // 水箱
  ell(ctx, 0, d * 0.12, w * 0.36, d * 0.34); fs(ctx);            // 座圈
  ell(ctx, 0, d * 0.12, w * 0.22, d * 0.22); ctx.stroke();
};

export const bathsink: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 2.5); fs(ctx);
  ell(ctx, 0, d * 0.05, w * 0.3, d * 0.26); ctx.stroke();
  ring(ctx, 0, -d * 0.3, 1.5, true);                              // 龙头
};

export const bathtub: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 4); fs(ctx);
  rr(ctx, -w / 2 + 4, -d / 2 + 4, w - 8, d - 8, 6); ctx.stroke();
  ring(ctx, -w / 2 + 9, 0, 1.6, true);                            // 下水
};

export const shower: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2); fs(ctx);
  seg(ctx, -hw + 3, -hd + 3, hw - 3, hd - 3);
  seg(ctx, -hw + 3, hd - 3, hw - 3, -hd + 3);
  ring(ctx, -hw + 6, -hd + 6, 2.2);                               // 花洒
};
