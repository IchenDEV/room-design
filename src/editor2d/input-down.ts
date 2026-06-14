import type { Editor2D } from './editor';
import { hitAny, hitNode, hitRoom } from './hit';
import { endGroup, nearestWall, snapWallPoint } from './snap';
import { addChainPoint, ghostValid, placeItem, placeOpening } from './commands';
import { ensureRoomMeta } from '../core/store/actions';
import { itemGroupId, toggleItemSelection } from '../core/store/item-groups';
import { hitItemResizeHandle, hitItemRotateHandle, resizeAnchor } from './item-handles';
import { startRuler } from './ruler';

export function onDown(ed: Editor2D, e: PointerEvent) {
  const s = ed.evPos(e);
  const p = ed.s2w(s.x, s.y);
  const store = ed.store;
  const tool = store.ui.tool;

  if (e.button === 2) return; // 右键交给 contextmenu
  if (e.button === 1 || ed.spaceDown) {
    ed.st.drag = { kind: 'pan', sx: s.x, sy: s.y, ox: ed.view.ox, oy: ed.view.oy };
    return;
  }
  if (e.button !== 0) return;

  if (tool.type === 'select') {
    const resize = hitItemResizeHandle(ed, s);
    if (resize) {
      const it = store.project.items.find((i) => i.id === resize.id);
      if (!it) return;
      store.begin();
      ed.st.drag = {
        kind: 'item-resize', id: resize.id, corner: resize.corner,
        anchor: resizeAnchor(it, resize.corner), rot: it.rot, moved: false,
      };
      return;
    }
    const rotateId = hitItemRotateHandle(ed, s);
    if (rotateId) {
      store.begin();
      ed.st.drag = { kind: 'item-rotate', id: rotateId, moved: false };
      return;
    }
    const node = hitNode(ed, p, 14 / ed.view.s);
    if (node) {
      const w = store.project.walls.find((x) => x.id === node.wallId)!;
      store.begin();
      ed.st.drag = { kind: 'node', ends: endGroup(ed, w[node.end]), moved: false };
      return;
    }
    const hit = hitAny(ed, p);
    if (hit) {
      if (hit.kind === 'item' && e.shiftKey) { toggleItemSelection(store, hit.id); return; }
      const groupId = hit.kind === 'item' ? itemGroupId(store.project, hit.id) : null;
      const sel = groupId ? { kind: 'group' as const, id: groupId } : hit;
      store.setSel(sel);
      store.begin();
      if (sel.kind === 'group') {
        ed.st.drag = { kind: 'group', id: sel.id, last: p, moved: false };
      } else if (hit.kind === 'item') {
        const it = store.project.items.find((i) => i.id === hit.id)!;
        ed.st.drag = { kind: 'item', id: hit.id, off: { x: p.x - it.x, y: p.y - it.y }, moved: false };
      } else if (hit.kind === 'wall') {
        ed.st.drag = { kind: 'wall', id: hit.id, last: p, moved: false };
      } else if (hit.kind === 'opening') {
        ed.st.drag = { kind: 'opening', id: hit.id, moved: false };
      }
      return;
    }
    const room = hitRoom(ed, p);
    if (room >= 0) {
      const metaId = ensureRoomMeta(store, room);
      store.setSel({ kind: 'room', metaId });
      return;
    }
    store.setSel(null);
    ed.st.drag = { kind: 'pan', sx: s.x, sy: s.y, ox: ed.view.ox, oy: ed.view.oy };
    return;
  }

  if (tool.type === 'wall') {
    const ref = ed.st.chain[ed.st.chain.length - 1] ?? null;
    const snap = snapWallPoint(ed, p, ref);
    addChainPoint(ed, snap.pt);
    ed.requestDraw();
    return;
  }

  if (tool.type === 'rect') {
    const snap = snapWallPoint(ed, p, null);
    ed.st.rectA = snap.pt;
    ed.st.rectB = snap.pt;
    return;
  }

  if (tool.type === 'door' || tool.type === 'window') {
    placeOpening(ed, tool.type);
    return;
  }

  if (tool.type === 'place') {
    placeItem(ed, tool.defId, p);
    return;
  }

  if (tool.type === 'ruler') {
    startRuler(ed, p);
  }
}

/** 工具切换时复位临时态 */
export function syncToolState(ed: Editor2D) {
  const t = ed.store.ui.tool.type;
  if (t !== 'wall') { ed.st.chain = []; ed.st.chainCur = null; }
  if (t !== 'rect') { ed.st.rectA = null; ed.st.rectB = null; }
  if (t !== 'door' && t !== 'window') ed.st.ghostOpen = null;
  if (t !== 'ruler') ed.st.ruler = null;
  ed.st.guides = [];
  ed.st.snapped = null;
  ed.st.snapLabel = null;
  ed.canvas.style.cursor = t === 'select' ? 'default' : 'crosshair';
}

/** 更新门窗放置幽灵 */
export function updateGhostOpen(ed: Editor2D, px: number, py: number) {
  const tool = ed.store.ui.tool.type;
  if (tool !== 'door' && tool !== 'window') return;
  const near = nearestWall(ed, ed.s2w(px, py), 40 / ed.view.s + 25);
  if (!near) { ed.st.ghostOpen = null; return; }
  const width = tool === 'door' ? 90 : 150;
  ed.st.ghostOpen = { wallId: near.wall.id, t: near.t, valid: ghostValid(ed, near.wall.id, near.t, width) };
}
