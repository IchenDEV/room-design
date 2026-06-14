import type { Pt } from '../core/types';
import type { Editor2D } from './editor';
import { hitItemResizeHandle, hitItemRotateHandle, resizeCursor } from './item-handles';
import { updatePlaceSnap } from './input-item';
import { updateGhostOpen } from './input-down';
import { updateRulerHover } from './ruler';
import { updateMeasureHover } from './measure';
import { snapWallPoint } from './snap';

export function updateHoverState(ed: Editor2D, s: Pt, p: Pt) {
  const tool = ed.store.ui.tool;
  if (tool.type === 'wall') {
    const ref = ed.st.chain[ed.st.chain.length - 1] ?? null;
    const snap = snapWallPoint(ed, p, ref);
    ed.st.chainCur = snap.pt;
    ed.st.guides = snap.guides;
    ed.st.snapped = snap.hard ? snap.pt : null;
    ed.st.snapLabel = null;
  } else if (tool.type === 'rect' && ed.st.rectA) {
    ed.st.rectB = snapWallPoint(ed, p, ed.st.rectA).pt;
    ed.st.snapLabel = null;
  } else if (tool.type === 'place') {
    updatePlaceSnap(ed, tool.defId, p);
  } else if (tool.type === 'ruler') {
    updateRulerHover(ed, p);
  } else if (tool.type === 'measure') {
    updateMeasureHover(ed, p);
  } else if (tool.type === 'boxSelect') {
    ed.canvas.style.cursor = 'crosshair';
    ed.st.guides = [];
    ed.st.snapped = null;
    ed.st.snapLabel = null;
  } else {
    const resize = tool.type === 'select' ? hitItemResizeHandle(ed, s) : null;
    ed.canvas.style.cursor = resize ? resizeCursor(resize.corner)
      : tool.type === 'select' && hitItemRotateHandle(ed, s) ? 'grab' : 'default';
    ed.st.guides = [];
    ed.st.snapped = null;
    ed.st.snapLabel = null;
    updateGhostOpen(ed, s.x, s.y);
  }
}
