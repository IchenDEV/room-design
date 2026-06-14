import type { Editor2D } from '../editor';
import type { Pt } from '../../core/types';
import { wallNormal } from '../../core/geometry/vec';
import { fmtLen } from '../../core/store/actions';

export function pill(ed: Editor2D, x: number, y: number, text: string) {
  const { ctx, pal } = ed;
  ctx.font = '11px "PingFang SC", sans-serif';
  const w = ctx.measureText(text).width + 14;
  ctx.fillStyle = pal.dimPill;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y - 10, w, 19, 9);
  ctx.fill();
  ctx.fillStyle = pal.dimText;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y + 3.5);
}

function dimSeg(ed: Editor2D, a: Pt, b: Pt, color?: string) {
  const { ctx, pal } = ed;
  const sa = ed.w2s(a), sb = ed.w2s(b);
  ctx.strokeStyle = color ?? pal.sel;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(sa.x, sa.y); ctx.lineTo(sb.x, sb.y); ctx.stroke();
  pill(ed, (sa.x + sb.x) / 2, (sa.y + sb.y) / 2 - 13, fmtLen(Math.hypot(b.x - a.x, b.y - a.y)));
}

function drawRuler(ed: Editor2D) {
  const r = ed.st.ruler;
  if (!r) return;
  const { ctx, pal } = ed;
  const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y;
  const len = Math.hypot(dx, dy);
  const sa = ed.w2s(r.a), sb = ed.w2s(r.b);
  const corner = ed.w2s({ x: r.b.x, y: r.a.y });

  if (Math.abs(dx) > 1 && Math.abs(dy) > 1) {
    ctx.save();
    ctx.globalAlpha = 0.72;
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = pal.guide;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(sa.x, sa.y); ctx.lineTo(corner.x, corner.y); ctx.lineTo(sb.x, sb.y);
    ctx.stroke();
    ctx.restore();
    if (Math.abs(dx) > 20) pill(ed, (sa.x + corner.x) / 2, sa.y - 12, `水平 ${fmtLen(Math.abs(dx))}`);
    if (Math.abs(dy) > 20) pill(ed, corner.x + 36, (corner.y + sb.y) / 2, `垂直 ${fmtLen(Math.abs(dy))}`);
  }

  ctx.strokeStyle = pal.guide;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(sa.x, sa.y); ctx.lineTo(sb.x, sb.y); ctx.stroke();
  ctx.fillStyle = pal.paper;
  ctx.strokeStyle = pal.sel;
  for (const p of [sa, sb]) {
    ctx.beginPath(); ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  pill(ed, (sa.x + sb.x) / 2, (sa.y + sb.y) / 2 - 16, `距离 ${fmtLen(len)}`);
}

export function drawOverlays(ed: Editor2D) {
  const { ctx, store, pal, st } = ed;

  // 吸附参考线
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = pal.guide;
  ctx.lineWidth = 1;
  for (const g of st.guides) {
    const a = ed.w2s(g.a), b = ed.w2s(g.b);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  ctx.setLineDash([]);
  if (st.snapped) {
    const s = ed.w2s(st.snapped);
    ctx.strokeStyle = pal.guide;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, Math.PI * 2); ctx.stroke();
    if (st.snapLabel) pill(ed, s.x, s.y - 18, st.snapLabel);
  }

  // 画墙链预览
  const tool = store.ui.tool.type;
  if (tool === 'wall' && st.chain.length && st.chainCur) {
    const last = st.chain[st.chain.length - 1];
    const a = ed.w2s(last), b = ed.w2s(st.chainCur);
    const th = store.project.settings.wallThickness * ed.view.s;
    ctx.strokeStyle = pal.hover;
    ctx.lineWidth = Math.max(2, th);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    dimSeg(ed, last, st.chainCur);
  }

  // 矩形房间预览
  if (tool === 'rect' && st.rectA && st.rectB) {
    const a = ed.w2s(st.rectA), b = ed.w2s(st.rectB);
    ctx.strokeStyle = pal.sel;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(Math.min(a.x, b.x), Math.min(a.y, b.y), Math.abs(b.x - a.x), Math.abs(b.y - a.y));
    ctx.setLineDash([]);
    pill(ed, (a.x + b.x) / 2, Math.min(a.y, b.y) - 14,
      `${fmtLen(Math.abs(st.rectB.x - st.rectA.x))} × ${fmtLen(Math.abs(st.rectB.y - st.rectA.y))}`);
  }

  drawRuler(ed);

  // 选中墙体的尺寸标注
  if (store.sel?.kind === 'wall') {
    const selId = store.sel.id;
    const w = store.project.walls.find((x) => x.id === selId);
    if (w) {
      const n = wallNormal(w);
      const off = w.thickness / 2 + 26 / ed.view.s;
      dimSeg(ed, { x: w.a.x + n.x * off, y: w.a.y + n.y * off }, { x: w.b.x + n.x * off, y: w.b.y + n.y * off });
    }
  }
}
