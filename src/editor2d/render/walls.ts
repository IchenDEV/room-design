import type { Editor2D } from '../editor';
import type { Wall } from '../../core/types';
import { wallDir, wallNormal, wallLen } from '../../core/geometry/vec';

/** 墙体四角（世界坐标，端头外延半厚做简易接角） */
export function wallQuad(w: Wall) {
  const d = wallDir(w);
  const n = wallNormal(w);
  const h = w.thickness / 2;
  const a = { x: w.a.x - d.x * h, y: w.a.y - d.y * h };
  const b = { x: w.b.x + d.x * h, y: w.b.y + d.y * h };
  return [
    { x: a.x + n.x * h, y: a.y + n.y * h },
    { x: b.x + n.x * h, y: b.y + n.y * h },
    { x: b.x - n.x * h, y: b.y - n.y * h },
    { x: a.x - n.x * h, y: a.y - n.y * h },
  ];
}

export function drawWalls(ed: Editor2D) {
  const { ctx, store, pal } = ed;
  const selId = store.sel?.kind === 'wall' ? store.sel.id : null;

  for (const w of store.project.walls) {
    if (wallLen(w) < 1) continue;
    const glass = w.material === 'glass';
    const quad = wallQuad(w).map((p) => ed.w2s(p));
    ctx.beginPath();
    quad.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = glass ? pal.glassFill : pal.wallFill;
    ctx.fill();
    if (!glass && w.texture === 'wallpaper') drawWallpaperFill(ctx, quad);
    ctx.strokeStyle = glass ? pal.glassStroke : pal.wallStroke;
    ctx.lineWidth = glass ? 1.5 : 1;
    ctx.stroke();

    if (glass) {
      // 玻璃墙：中心双细线示意
      const a = ed.w2s(w.a), b = ed.w2s(w.b);
      ctx.strokeStyle = pal.glassStroke;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    if (w.id === selId) {
      ctx.strokeStyle = pal.sel;
      ctx.lineWidth = 2.2;
      ctx.stroke();
      drawHandles(ed, w);
    }
  }
}

function drawWallpaperFill(ctx: CanvasRenderingContext2D, quad: { x: number; y: number }[]) {
  const xs = quad.map((p) => p.x), ys = quad.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);

  ctx.save();
  ctx.beginPath();
  quad.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = 'rgba(70, 83, 96, 0.24)';
  ctx.lineWidth = 1;
  const startX = Math.floor(minX / 12) * 12;
  for (let x = startX; x <= maxX + 12; x += 12) {
    ctx.beginPath();
    ctx.moveTo(x, minY - 8);
    ctx.lineTo(x, maxY + 8);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  const startY = Math.floor(minY / 24) * 24;
  for (let y = startY; y <= maxY + 24; y += 24) {
    ctx.beginPath();
    ctx.moveTo(minX - 8, y);
    ctx.lineTo(maxX + 8, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHandles(ed: Editor2D, w: Wall) {
  const { ctx, pal } = ed;
  for (const end of [w.a, w.b]) {
    const s = ed.w2s(end);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = pal.handle;
    ctx.fill();
    ctx.strokeStyle = pal.sel;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}
