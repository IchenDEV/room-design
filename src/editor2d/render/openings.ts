import type { Editor2D } from '../editor';
import type { Opening, Pt, Wall } from '../../core/types';
import { lerp, wallDir, wallNormal, wallLen } from '../../core/geometry/vec';

/** 屏幕坐标系局部点：u 沿墙(cm)，v 垂直墙(cm) */
function mkLocal(ed: Editor2D, w: Wall, c: Pt) {
  const cs = ed.w2s(c);
  const d = wallDir(w), n = wallNormal(w), s = ed.view.s;
  return (u: number, v: number): Pt => ({
    x: cs.x + (d.x * u + n.x * v) * s,
    y: cs.y - (d.y * u + n.y * v) * s,
  });
}

function drawDoor(ed: Editor2D, w: Wall, o: Opening, ghost = false) {
  const { ctx, pal } = ed;
  const L = mkLocal(ed, w, lerp(w.a, w.b, o.t));
  const half = o.width / 2, ht = w.thickness / 2 + 1;
  const col = o.style === 'glass' ? pal.doorGlass : pal.door;
  const gap = [L(-half, ht), L(half, ht), L(half, -ht), L(-half, -ht)];
  ctx.beginPath();
  gap.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = pal.paper;
  ctx.globalAlpha = ghost ? 0.55 : 1;
  ctx.fill();
  ctx.strokeStyle = col;
  ctx.lineWidth = 1.4;
  const side = o.flip ? -1 : 1;
  const drawLeaf = (hingeU: number, closedU: number, width: number) => {
    const hinge = L(hingeU, 0);
    const tip = L(hingeU + Math.sign(closedU - hingeU) * width * 0.04, side * width);
    ctx.beginPath(); ctx.moveTo(hinge.x, hinge.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    if (o.style === 'glass') {
      const g0 = L(hingeU + Math.sign(closedU - hingeU) * width * 0.1, 0);
      const g1 = L(hingeU + Math.sign(closedU - hingeU) * width * 0.12, side * width * 0.94);
      ctx.beginPath(); ctx.moveTo(g0.x, g0.y); ctx.lineTo(g1.x, g1.y); ctx.stroke();
    }
    const closed = L(closedU, 0);
    const a0 = Math.atan2(closed.y - hinge.y, closed.x - hinge.x);
    const a1 = Math.atan2(tip.y - hinge.y, tip.x - hinge.x);
    ctx.beginPath();
    ctx.arc(hinge.x, hinge.y, width * ed.view.s, Math.min(a0, a1), Math.max(a0, a1));
    ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
  };
  if (o.swing === 'double') {
    drawLeaf(-half, 0, o.width / 2);
    drawLeaf(half, 0, o.width / 2);
    const mid = L(0, 0);
    ctx.beginPath(); ctx.arc(mid.x, mid.y, 2.5, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  } else {
    drawLeaf(o.flip ? half : -half, o.flip ? -half : half, o.width);
  }
  ctx.globalAlpha = 1;
}

function drawWindow(ed: Editor2D, w: Wall, o: Opening, ghost = false) {
  const { ctx, pal } = ed;
  const L = mkLocal(ed, w, lerp(w.a, w.b, o.t));
  const half = o.width / 2, ht = w.thickness / 2 + 1;
  ctx.globalAlpha = ghost ? 0.55 : 1;
  const gap = [L(-half, ht), L(half, ht), L(half, -ht), L(-half, -ht)];
  ctx.beginPath();
  gap.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fillStyle = pal.paper;
  ctx.fill();
  ctx.strokeStyle = pal.win;
  for (const v of [-ht * 0.7, 0, ht * 0.7]) {
    ctx.lineWidth = v === 0 ? 1 : 1.6;
    const p1 = L(-half, v), p2 = L(half, v);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  for (const u of [-half, half]) {
    const p1 = L(u, -ht), p2 = L(u, ht);
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  const dir = o.flip ? -1 : 1;
  const s1 = L(-dir * half * 0.75, -ht * 0.65), s2 = L(dir * half * 0.75, ht * 0.65);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke();
  ctx.globalAlpha = 1;
}

export function drawOpenings(ed: Editor2D) {
  const { ctx, store, pal } = ed;
  for (const o of store.project.openings) {
    const w = store.project.walls.find((x) => x.id === o.wallId);
    if (!w || wallLen(w) < 1) continue;
    if (o.kind === 'door') drawDoor(ed, w, o); else drawWindow(ed, w, o);
    if (store.sel?.kind === 'opening' && store.sel.id === o.id) {
      const c = ed.w2s(lerp(w.a, w.b, o.t));
      ctx.strokeStyle = pal.sel;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(c.x - (o.width / 2 + 8) * ed.view.s, c.y - 24, (o.width + 16) * ed.view.s, 48);
      ctx.setLineDash([]);
    }
  }
  // 放置幽灵
  const g = ed.st.ghostOpen;
  const tool = store.ui.tool.type;
  if (g && (tool === 'door' || tool === 'window')) {
    const w = store.project.walls.find((x) => x.id === g.wallId);
    if (w) {
      const tmp: Opening = {
        id: '_g', wallId: g.wallId, kind: tool, t: g.t,
        width: tool === 'door' ? 90 : 150, height: 0, sill: 0, flip: false,
      };
      if (tool === 'door') drawDoor(ed, w, tmp, true); else drawWindow(ed, w, tmp, true);
      const c = ed.w2s(lerp(w.a, w.b, g.t));
      ctx.fillStyle = g.valid ? pal.ghostOk : pal.ghostBad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
