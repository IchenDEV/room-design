import type { Editor2D } from '../editor';

export function drawBoxSelect(ed: Editor2D) {
  const box = ed.st.boxSelect;
  if (!box) return;
  const { ctx, pal } = ed;
  const a = ed.w2s(box.a), b = ed.w2s(box.b);
  const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y);
  const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y);
  ctx.save();
  ctx.fillStyle = pal.selSoft;
  ctx.strokeStyle = pal.sel;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([7, 5]);
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
