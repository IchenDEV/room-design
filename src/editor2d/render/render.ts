import type { Editor2D } from '../editor';
import { drawRooms } from './rooms';
import { drawWalls } from './walls';
import { drawOpenings } from './openings';
import { drawItems } from './items';
import { drawOverlays } from './overlays';

export function drawAll(ed: Editor2D) {
  const { ctx } = ed;
  const size = ed.cssSize();
  ctx.fillStyle = ed.pal.paper;
  ctx.fillRect(0, 0, size.x, size.y);
  drawGrid(ed, size.x, size.y);
  drawRooms(ed);
  drawWalls(ed);
  drawOpenings(ed);
  drawItems(ed);
  drawOverlays(ed);
}

function drawGrid(ed: Editor2D, w: number, h: number) {
  const { ctx, view, pal } = ed;
  const tl = ed.s2w(0, 0);
  const br = ed.s2w(w, h);
  const step = 50;
  if (step * view.s < 5) return;

  const x0 = Math.floor(tl.x / step) * step;
  const y0 = Math.floor(br.y / step) * step;
  ctx.lineWidth = 1;
  for (let x = x0; x <= br.x; x += step) {
    const sx = ed.w2s({ x, y: 0 }).x;
    ctx.strokeStyle = x % 500 === 0 ? pal.gridMajor : pal.gridMinor;
    ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke();
  }
  for (let y = y0; y <= tl.y; y += step) {
    const sy = ed.w2s({ x: 0, y }).y;
    ctx.strokeStyle = y % 500 === 0 ? pal.gridMajor : pal.gridMinor;
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(w, sy); ctx.stroke();
  }
  // 原点轴
  const o = ed.w2s({ x: 0, y: 0 });
  ctx.strokeStyle = pal.axis;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(o.x, 0); ctx.lineTo(o.x, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, o.y); ctx.lineTo(w, o.y); ctx.stroke();
}
