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

export const outlet: GlyphFn = (ctx, w, d, fill, line) => {
  const hw = w / 2, hd = d / 2;
  if (d < w * 0.55) {
    rr(ctx, -hw, -hd, w, d, 1.8); fs(ctx);
    ctx.save();
    ctx.strokeStyle = line;
    ctx.lineWidth = Math.max(1, Math.min(w, d) * 0.18);
    seg(ctx, -w * 0.18, -d * 0.16, -w * 0.18, d * 0.16);
    seg(ctx, w * 0.18, -d * 0.16, w * 0.18, d * 0.16);
    ctx.restore();
    return;
  }
  rr(ctx, -hw, -hd, w, d, Math.min(w, d) * 0.18); fs(ctx);
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = line;
  rr(ctx, -w * 0.26, -d * 0.26, w * 0.52, d * 0.52, Math.min(w, d) * 0.08); ctx.stroke();
  seg(ctx, -w * 0.18, 0, w * 0.18, 0);
  seg(ctx, 0, -d * 0.18, 0, d * 0.18);
  ctx.restore();
};

export const weakbox: GlyphFn = (ctx, w, d, _fill, line) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 2.5); fs(ctx);
  ctx.save();
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(1, d * 0.18);
  rr(ctx, -hw + d * 0.42, -hd + d * 0.38, w - d * 0.84, d * 0.24, 1); ctx.stroke();
  seg(ctx, -w * 0.32, 0, w * 0.32, 0);
  seg(ctx, -w * 0.18, d * 0.22, w * 0.18, d * 0.22);
  ctx.beginPath();
  ctx.arc(w * 0.34, 0, Math.max(1, d * 0.16), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

export const accesspanel: GlyphFn = (ctx, w, d, fill, line) => {
  const hw = w / 2, hd = d / 2;
  rr(ctx, -hw, -hd, w, d, 1.8); fs(ctx);
  ctx.save();
  ctx.strokeStyle = line;
  ctx.fillStyle = fill;
  ctx.lineWidth = Math.max(1, d * 0.16);
  rr(ctx, -w * 0.32, -d * 0.24, w * 0.36, d * 0.28, 1); ctx.stroke();
  for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) {
    ctx.beginPath();
    ctx.arc(w * (0.17 + x * 0.13), d * (-0.18 + y * 0.22), Math.max(0.7, d * 0.06), 0, Math.PI * 2);
    ctx.stroke();
  }
  seg(ctx, -w * 0.3, d * 0.24, -w * 0.12, d * 0.24);
  seg(ctx, -w * 0.28, d * 0.34, -w * 0.08, d * 0.34);
  ctx.restore();
};
