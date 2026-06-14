import type { Pt } from '../core/types';
import type { Editor2D } from './editor';
import { fmtLen } from '../core/store/actions';
import { uid } from '../core/types';
import { setStatus } from '../ui/statusBus';
import { snapWallPoint } from './snap';

export function startMeasure(ed: Editor2D, p: Pt) {
  const snap = snapWallPoint(ed, p, null);
  ed.st.measure = { a: snap.pt, b: snap.pt };
  ed.st.drag = { kind: 'measure' };
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.hard ? snap.pt : null;
  ed.st.snapLabel = null;
  pushMeasureStatus(ed);
}

export function updateMeasure(ed: Editor2D, p: Pt) {
  if (!ed.st.measure) return;
  const snap = snapWallPoint(ed, p, ed.st.measure.a);
  ed.st.measure.b = snap.pt;
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.hard ? snap.pt : null;
  ed.st.snapLabel = null;
  pushMeasureStatus(ed);
}

export function updateMeasureHover(ed: Editor2D, p: Pt) {
  const snap = snapWallPoint(ed, p, ed.st.measure?.a ?? null);
  ed.st.guides = snap.guides;
  ed.st.snapped = snap.hard ? snap.pt : null;
  ed.st.snapLabel = null;
}

export function commitMeasure(ed: Editor2D) {
  const m = ed.st.measure;
  ed.st.measure = null;
  if (!m || Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y) < 8) return;
  const id = uid('m');
  ed.store.commit((p) => {
    (p.measures ??= []).push({ id, a: { ...m.a }, b: { ...m.b } });
  });
  ed.store.setSel({ kind: 'measure', id });
}

function pushMeasureStatus(ed: Editor2D) {
  const m = ed.st.measure;
  if (!m) return;
  const dx = m.b.x - m.a.x, dy = m.b.y - m.a.y;
  setStatus(`标注 ${fmtLen(Math.hypot(dx, dy))}`, `${Math.round(ed.view.s * 100)}%`);
}
