import type { Editor2D } from '../editor';
import { floorOf } from '../../core/catalog/catalog';
import { roomFloor, roomName } from '../../core/store/selectors';

export function drawRooms(ed: Editor2D) {
  const { ctx, store, pal } = ed;
  for (const r of store.rooms) {
    const sel = store.sel?.kind === 'room' && store.sel.metaId === r.metaId && !!r.metaId;
    const mat = floorOf(roomFloor(store, r));
    ctx.beginPath();
    r.poly.forEach((p, i) => {
      const s = ed.w2s(p);
      if (i === 0) ctx.moveTo(s.x, s.y); else ctx.lineTo(s.x, s.y);
    });
    ctx.closePath();
    ctx.fillStyle = mat.plan;
    ctx.globalAlpha = store.ui.theme === 'dark' ? 0.85 : 1;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (sel) {
      ctx.fillStyle = pal.selSoft;
      ctx.fill();
      ctx.strokeStyle = pal.sel;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = pal.roomEdge;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    drawLabel(ed, r.centroid.x, r.centroid.y, roomName(store, r), `${(r.area / 10000).toFixed(1)} ㎡`);
  }
}

function drawLabel(ed: Editor2D, x: number, y: number, name: string, sub: string) {
  if (ed.view.s < 0.18) return;
  const { ctx, pal } = ed;
  const s = ed.w2s({ x, y });
  ctx.textAlign = 'center';
  ctx.fillStyle = pal.roomLabel;
  ctx.font = '600 13px "PingFang SC", sans-serif';
  ctx.fillText(name, s.x, s.y - 3);
  ctx.fillStyle = pal.roomSub;
  ctx.font = '11px "PingFang SC", sans-serif';
  ctx.fillText(sub, s.x, s.y + 13);
}
