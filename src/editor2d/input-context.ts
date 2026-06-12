import type { Editor2D } from './editor';
import { closeCtxMenu, openCtxMenu } from '../core/store/actions';
import { itemGroupId } from '../core/store/item-groups';
import { hitAny } from './hit';

export function openEditorContext(ed: Editor2D, e: MouseEvent) {
  e.preventDefault();
  const s = ed.evPos(e);
  const hit = hitAny(ed, ed.s2w(s.x, s.y));
  const cur = ed.store.sel;
  if (hit?.kind === 'item' && cur?.kind === 'multi' && cur.ids.includes(hit.id)) {
    openCtxMenu(ed.store, e.clientX, e.clientY, cur);
    return;
  }
  const gid = hit?.kind === 'item' ? itemGroupId(ed.store.project, hit.id) : null;
  if (gid) openCtxMenu(ed.store, e.clientX, e.clientY, { kind: 'group', id: gid });
  else if (hit) openCtxMenu(ed.store, e.clientX, e.clientY, hit);
  else closeCtxMenu(ed.store);
}
