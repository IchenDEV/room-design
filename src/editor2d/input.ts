import type { Editor2D } from './editor';
import { onDown, syncToolState } from './input-down';
import { nearestWall } from './snap';
import { snapWallMove, snapWallNode } from './wall-snap';
import { commitRect, endChain, ghostValid } from './commands';
import { projT } from '../core/geometry/vec';
import { moveDraggedItem, resizeDraggedItem, rotateDraggedItem } from './input-item';
import { moveDraggedGroup } from './input-group';
import { openEditorContext } from './input-context';
import { updateHoverState } from './input-hover';
import { updateRuler } from './ruler';
import { commitMeasure, updateMeasure } from './measure';
import { commitBoxSelect, updateBoxSelect } from './box-select';

function onMove(ed: Editor2D, e: PointerEvent) {
  const s = ed.evPos(e);
  const p = ed.s2w(s.x, s.y);
  ed.st.hoverPt = p;
  ed.pushStatus();
  const d = ed.st.drag;

  if (d?.kind === 'pan') {
    ed.view.ox = d.ox + (s.x - d.sx);
    ed.view.oy = d.oy + (s.y - d.sy);
  } else if (d?.kind === 'item') {
    d.moved = true;
    moveDraggedItem(ed, d.id, d.off, p);
  } else if (d?.kind === 'group') {
    d.moved = true;
    moveDraggedGroup(ed, d, p);
  } else if (d?.kind === 'item-rotate') {
    d.moved = true;
    rotateDraggedItem(ed, d.id, p);
  } else if (d?.kind === 'item-resize') {
    d.moved = true;
    resizeDraggedItem(ed, d.id, d.corner, d.anchor, d.rot, p);
  } else if (d?.kind === 'node') {
    d.moved = true;
    const snap = snapWallNode(ed, p, d.ends, d.refs);
    ed.st.snapped = snap.hard || snap.label ? snap.pt : null;
    ed.st.guides = snap.guides;
    ed.st.snapLabel = snap.label;
    ed.store.update((proj) => {
      for (const en of d.ends) {
        const w = proj.walls.find((x) => x.id === en.wallId);
        if (w) { w[en.end].x = snap.pt.x; w[en.end].y = snap.pt.y; }
      }
    });
  } else if (d?.kind === 'wall') {
    d.moved = true;
    const snap = snapWallMove(ed, d.ends, p.x - d.start.x, p.y - d.start.y);
    ed.st.guides = snap.guides;
    ed.st.snapped = snap.snapped;
    ed.st.snapLabel = snap.label;
    ed.store.update((proj) => {
      for (const en of d.ends) {
        const w = proj.walls.find((x) => x.id === en.wallId);
        if (w) { w[en.end].x = en.origin.x + snap.dx; w[en.end].y = en.origin.y + snap.dy; }
      }
    });
  } else if (d?.kind === 'opening') {
    d.moved = true;
    const near = nearestWall(ed, p, 50);
    if (near) {
      ed.store.update((proj) => {
        const o = proj.openings.find((x) => x.id === d.id);
        if (o && ghostValid(ed, near.wall.id, near.t, o.width)) { o.wallId = near.wall.id; o.t = near.t; }
        else if (o && o.wallId === near.wall.id) o.t = Math.max(0.02, Math.min(0.98, projT(p, near.wall.a, near.wall.b)));
      });
    }
  } else if (d?.kind === 'ruler') {
    updateRuler(ed, p);
  } else if (d?.kind === 'measure') {
    updateMeasure(ed, p);
  } else if (d?.kind === 'boxSelect') {
    updateBoxSelect(ed, p);
  } else {
    updateHoverState(ed, s, p);
  }
  ed.requestDraw();
}

function onUp(ed: Editor2D, e: PointerEvent) {
  if (ed.store.ui.tool.type === 'rect' && ed.st.rectA && e.button === 0) commitRect(ed);
  const d = ed.st.drag;
  if (!d) { ed.requestDraw(); return; }
  if (d.kind === 'measure') commitMeasure(ed);
  else if (d.kind === 'boxSelect') commitBoxSelect(ed);
  else if (d.kind !== 'pan') ed.store.end();
  ed.st.drag = null;
  ed.st.snapped = null;
  ed.st.snapLabel = null;
  if (ed.store.ui.tool.type !== 'wall') ed.st.guides = [];
  ed.requestDraw();
}

export function bindInput(ed: Editor2D): () => void {
  const c = ed.canvas;
  const down = (e: PointerEvent) => { c.setPointerCapture(e.pointerId); onDown(ed, e); ed.requestDraw(); };
  const move = (e: PointerEvent) => onMove(ed, e);
  const up = (e: PointerEvent) => onUp(ed, e);
  const wheel = (e: WheelEvent) => {
    e.preventDefault();
    const s = ed.evPos(e);
    ed.zoomAt(s.x, s.y, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  };
  const dbl = () => { if (ed.store.ui.tool.type === 'wall') endChain(ed); };
  const ctx = (e: MouseEvent) => openEditorContext(ed, e);
  const leave = () => {
    ed.st.hoverPt = null; ed.st.ghostOpen = null; ed.st.snapLabel = null; ed.st.snapped = null; ed.requestDraw();
  };
  c.addEventListener('pointerdown', down);
  c.addEventListener('pointermove', move);
  c.addEventListener('pointerup', up);
  c.addEventListener('wheel', wheel, { passive: false });
  c.addEventListener('dblclick', dbl);
  c.addEventListener('contextmenu', ctx);
  c.addEventListener('pointerleave', leave);
  const offTool = ed.store.on('ui', () => syncToolState(ed));
  return () => {
    c.removeEventListener('pointerdown', down);
    c.removeEventListener('pointermove', move);
    c.removeEventListener('pointerup', up);
    c.removeEventListener('wheel', wheel);
    c.removeEventListener('dblclick', dbl);
    c.removeEventListener('contextmenu', ctx);
    c.removeEventListener('pointerleave', leave);
    offTool();
  };
}
