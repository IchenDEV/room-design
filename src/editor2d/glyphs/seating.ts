import { rr, fs, seg, ring } from './util';
import type { GlyphFn } from './util';

export const sofa: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, d * 0.16); fs(ctx);
  rr(ctx, -hw + 2, -hd + 2, w - 4, d * 0.26, 3); fs(ctx);            // 靠背
  rr(ctx, -hw + 2, -hd + 2, w * 0.14, d - 4, 3); fs(ctx);           // 左扶手
  rr(ctx, hw - 2 - w * 0.14, -hd + 2, w * 0.14, d - 4, 3); fs(ctx); // 右扶手
  const seats = w > d * 1.6 ? 3 : w > d * 1.1 ? 2 : 1;
  const sw = (w - 4 - w * 0.28) / seats;
  for (let i = 1; i < seats; i++) seg(ctx, -hw + 2 + w * 0.14 + sw * i, -hd + d * 0.3, -hw + 2 + w * 0.14 + sw * i, hd - 3);
};

export const chair: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd + d * 0.18, w, d * 0.82, 3); fs(ctx);
  rr(ctx, -hw + 1, -hd, w - 2, d * 0.2, 2); fs(ctx);
};

export const stool: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 3); fs(ctx);
  rr(ctx, -w / 2 + 3, -d / 2 + 3, w - 6, d - 6, 2); ctx.stroke();
};

export const barstool: GlyphFn = (ctx, w, d) => {
  ring(ctx, 0, 0, Math.min(w, d) / 2, true); ctx.stroke();
  ring(ctx, 0, 0, Math.min(w, d) / 3.2);
};

export const bench: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 3); fs(ctx);
  for (const t of [-0.25, 0, 0.25]) seg(ctx, -hw + 3, t * d, hw - 3, t * d);
};
