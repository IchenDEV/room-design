import type { Pt } from '../core/types';
import type { Editor2D } from './editor';
import { fmtLen } from '../core/store/actions';
import { setStatus } from '../ui/statusBus';
import { snapWallPoint } from './snap';

export function startRuler(ed: Editor2D, p: Pt) {
  const snap = snapWallPoint(ed, p, null);
  ed.st.ruler = { a: snap.pt, b: snap.pt };
  ed.st.drag = { kind: 'ruler' };
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.hard ? snap.pt : null;
  ed.st.snapLabel = null;
  pushRulerStatus(ed);
}

export function updateRuler(ed: Editor2D, p: Pt) {
  if (!ed.st.ruler) return;
  const snap = snapWallPoint(ed, p, ed.st.ruler.a);
  ed.st.ruler.b = snap.pt;
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.hard ? snap.pt : null;
  ed.st.snapLabel = null;
  pushRulerStatus(ed);
}

export function updateRulerHover(ed: Editor2D, p: Pt) {
  const snap = snapWallPoint(ed, p, ed.st.ruler?.a ?? null);
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.hard ? snap.pt : null;
  ed.st.snapLabel = null;
}

function pushRulerStatus(ed: Editor2D) {
  const r = ed.st.ruler;
  if (!r) return;
  const dx = r.b.x - r.a.x, dy = r.b.y - r.a.y;
  const len = Math.hypot(dx, dy);
  setStatus(`测量 ${fmtLen(len)} · 水平 ${fmtLen(Math.abs(dx))} · 垂直 ${fmtLen(Math.abs(dy))}`,
    `${Math.round(ed.view.s * 100)}%`);
}
