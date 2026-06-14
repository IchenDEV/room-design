import { rr, fs, seg, ring } from './util';
import type { GlyphFn } from './util';

export const wardrobe: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2); fs(ctx);
  seg(ctx, 0, -hd + 2, 0, hd - 2);
  ring(ctx, -4, 0, 1.3, true); ring(ctx, 4, 0, 1.3, true);
  seg(ctx, -hw + 2, hd - 3, hw - 2, hd - 3);
};

export const nightstand: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 2); fs(ctx);
  seg(ctx, -w / 2 + 2, 0, w / 2 - 2, 0);
  ring(ctx, 0, -d / 4, 1.2, true);
};

export const dresser: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2); fs(ctx);
  ring(ctx, 0, -hd * 0.25, Math.min(w, d) * 0.22);  // 镜子
  seg(ctx, -hw + 2, hd * 0.4, hw - 2, hd * 0.4);
};

export const fridge: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2.5); fs(ctx);
  seg(ctx, -hw + 2, -hd * 0.2, hw - 2, -hd * 0.2);
  seg(ctx, hw - 4, -hd * 0.55, hw - 4, -hd * 0.05);
  seg(ctx, hw - 4, hd * 0.15, hw - 4, hd * 0.7);
};

export const waterdispenser: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2, r = Math.min(w, d) * 0.2;
  rr(ctx, -hw, -hd, w, d, 2.5); fs(ctx);
  ring(ctx, 0, -hd * 0.35, r);
  rr(ctx, -w * 0.24, -d * 0.03, w * 0.48, d * 0.42, 1.5); ctx.stroke();
  seg(ctx, -w * 0.12, d * 0.1, w * 0.12, d * 0.1);
  ring(ctx, -w * 0.11, d * 0.02, 1.2, true); ring(ctx, w * 0.11, d * 0.02, 1.2, true);
};

export const washer: GlyphFn = (ctx, w, d) => {
  rr(ctx, -w / 2, -d / 2, w, d, 2.5); fs(ctx);
  ring(ctx, 0, d * 0.06, Math.min(w, d) * 0.3);
  ring(ctx, 0, d * 0.06, Math.min(w, d) * 0.18);
  ring(ctx, -w / 2 + 5, -d / 2 + 4, 1.5, true);
};

export const counter: GlyphFn = (ctx, w, d) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2); fs(ctx);
  rr(ctx, -hw + 3, -hd + 3, w - 6, d - 6, 1.5); ctx.stroke();
  ring(ctx, -w * 0.25, 0, Math.min(w, d) * 0.18);            // 水槽
  for (const t of [[0.13, -0.16], [0.32, -0.16], [0.13, 0.16], [0.32, 0.16]]) {
    ring(ctx, t[0] * w, t[1] * d, Math.min(w, d) * 0.08);     // 灶眼
  }
};
