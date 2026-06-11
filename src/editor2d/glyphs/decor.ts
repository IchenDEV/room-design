import { rr, seg, ring, ell, fs } from './util';
import type { GlyphFn } from './util';

export const rug: GlyphFn = (ctx, w, d, fill) => {
  const hw = w / 2, hd = d / 2;
  ctx.save();
  ctx.globalAlpha = 0.55;
  rr(ctx, -hw, -hd, w, d, 4); ctx.fill();
  ctx.restore();
  rr(ctx, -hw, -hd, w, d, 4); ctx.stroke();
  rr(ctx, -hw + 5, -hd + 5, w - 10, d - 10, 3); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -d * 0.2); ctx.lineTo(w * 0.12, 0); ctx.lineTo(0, d * 0.2); ctx.lineTo(-w * 0.12, 0);
  ctx.closePath(); ctx.stroke();
};

export const lamp: GlyphFn = (ctx, w, d) => {
  const r = Math.min(w, d) / 2;
  ring(ctx, 0, 0, r, true); ctx.stroke();
  ring(ctx, 0, 0, r * 0.45);
  seg(ctx, -r * 0.6, 0, r * 0.6, 0);
  seg(ctx, 0, -r * 0.6, 0, r * 0.6);
};

export const plant: GlyphFn = (ctx, w, d) => {
  const r = Math.min(w, d) / 2;
  ring(ctx, 0, 0, r * 0.55, true); ctx.stroke();      // 花盆
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ell(ctx, Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.34, r * 0.2);
    ctx.save();
    ctx.globalAlpha = 0.75;
    fs(ctx);
    ctx.restore();
  }
  ring(ctx, 0, 0, r * 0.16, true);
};
