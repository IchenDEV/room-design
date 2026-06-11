import type { Editor2D } from '../editor';
import { defOf } from '../../core/catalog/catalog';
import { drawGlyph } from '../glyphs/glyphs';
import { snapItemPos } from '../snap';
import { pill } from './overlays';

export function drawItems(ed: Editor2D) {
  const { ctx, store, pal } = ed;
  const s = ed.view.s;
  const selId = store.sel?.kind === 'item' ? store.sel.id : null;

  for (const it of store.project.items) {
    const def = defOf(it.defId);
    const cs = ed.w2s({ x: it.x, y: it.y });
    ctx.save();
    ctx.translate(cs.x, cs.y);
    ctx.rotate((-it.rot * Math.PI) / 180);
    drawGlyph(ctx, def.kind, it.w * s, it.d * s, it.color ?? def.color);
    if (it.id === selId) {
      ctx.strokeStyle = pal.sel;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect((-it.w / 2) * s - 5, (-it.d / 2) * s - 5, it.w * s + 10, it.d * s + 10);
      ctx.setLineDash([]);
    }
    ctx.restore();
    if (it.id === selId) {
      pill(ed, cs.x, cs.y - (it.d / 2) * s - 20, `${def.name} ${Math.round(it.w)}×${Math.round(it.d)}`);
    }
  }

  // 放置幽灵
  const tool = store.ui.tool;
  if (tool.type === 'place' && ed.st.hoverPt && !ed.st.drag) {
    const def = defOf(tool.defId);
    const snap = snapItemPos(ed, ed.st.hoverPt, def.d);
    const cs = ed.w2s(snap.pt);
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.translate(cs.x, cs.y);
    ctx.rotate((-(snap.rot ?? 0) * Math.PI) / 180);
    drawGlyph(ctx, def.kind, def.w * s, def.d * s, def.color);
    ctx.strokeStyle = pal.ghostOk;
    ctx.lineWidth = 1.6;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect((-def.w / 2) * s - 4, (-def.d / 2) * s - 4, def.w * s + 8, def.d * s + 8);
    ctx.restore();
  }
}
