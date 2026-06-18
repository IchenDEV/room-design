import type { Editor2D } from './editor';
import { closeCtxMenu, ensureRoomMeta, openCtxMenu } from '../core/store/actions';
import { itemGroupId } from '../core/store/item-groups';
import { hitAny, hitRoom } from './hit';

export function openEditorContext(ed: Editor2D, e: MouseEvent) {
  e.preventDefault();
  const s = ed.evPos(e);
  const p = ed.s2w(s.x, s.y);
  const hit = hitAny(ed, p);
  const cur = ed.store.sel;
  if (hit?.kind === 'item' && cur?.kind === 'multi' && cur.ids.includes(hit.id)) {
    openCtxMenu(ed.store, e.clientX, e.clientY, cur);
    return;
  }
  const gid = hit?.kind === 'item' ? itemGroupId(ed.store.project, hit.id) : null;
  if (gid) openCtxMenu(ed.store, e.clientX, e.clientY, { kind: 'group', id: gid });
  else if (hit) openCtxMenu(ed.store, e.clientX, e.clientY, hit);
  else {
    const room = hitRoom(ed, p);
    if (room >= 0) {
      const metaId = ensureRoomMeta(ed.store, room);
      openCtxMenu(ed.store, e.clientX, e.clientY, { kind: 'room', metaId });
    } else closeCtxMenu(ed.store);
  }
}
