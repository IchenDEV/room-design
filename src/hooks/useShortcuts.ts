import { useEffect } from 'react';
import { store } from '../core/store/store';
import { closeCtxMenu, deleteSelection } from '../core/store/actions';
import { createGroupFromSelection, idsFromSelection, ungroupSelection } from '../core/store/item-groups';
import { editors } from '../ui/editors';
import { endChain, escape, nudgeSel, rotateSel } from '../editor2d/commands';

const isTyping = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement;
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable;
};

export function useShortcuts() {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      // 漫游优先消费按键
      if (editors.v3?.walk.onKey(e.code, true)) { e.preventDefault(); return; }

      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) store.redo(); else store.undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyY') { e.preventDefault(); store.redo(); return; }
      if (e.metaKey || e.ctrlKey) return;

      switch (e.code) {
        case 'Escape':
          if (store.ui.ctx) { closeCtxMenu(store); break; }
          if (store.ui.help) { store.patchUI({ help: false }); break; }
          if (editors.v3?.walk.active) { editors.v3.walk.exit(); break; }
          if (editors.e2) escape(editors.e2);
          break;
        case 'Enter':
          if (editors.e2) endChain(editors.e2);
          break;
        case 'KeyV': store.setTool({ type: 'select' }); break;
        case 'KeyK': store.setTool({ type: 'boxSelect' }); break;
        case 'KeyW': store.setTool({ type: 'wall' }); break;
        case 'KeyT': store.setTool({ type: 'rect' }); break;
        case 'KeyD': store.setTool({ type: 'door' }); break;
        case 'KeyN': store.setTool({ type: 'window' }); break;
        case 'KeyL': store.setTool({ type: 'ruler' }); break;
        case 'KeyB': store.setTool({ type: 'measure' }); break;
        case 'KeyR':
          if (editors.e2) rotateSel(editors.e2);
          break;
        case 'KeyF':
          if (store.ui.mode === '2d') editors.e2?.fit(); else editors.v3?.fitCamera();
          break;
        case 'KeyM': store.setMode(store.ui.mode === '2d' ? '3d' : '2d'); break;
        case 'KeyG':
          if (store.ui.mode === '3d') editors.v3?.walk.toggle();
          else if (store.sel?.kind === 'multi') createGroupFromSelection(store);
          else if (store.sel?.kind === 'group') ungroupSelection(store);
          break;
        case 'Delete':
        case 'Backspace': deleteSelection(store); break;
        case 'Space':
          if (editors.e2) { editors.e2.spaceDown = true; e.preventDefault(); }
          break;
        case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': {
          const step = e.shiftKey ? 10 : 1;
          const dx = e.code === 'ArrowLeft' ? -step : e.code === 'ArrowRight' ? step : 0;
          const dy = e.code === 'ArrowDown' ? -step : e.code === 'ArrowUp' ? step : 0;
          if (idsFromSelection(store).length && editors.e2) {
            e.preventDefault();
            nudgeSel(editors.e2, dx, dy);
          }
          break;
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      editors.v3?.walk.onKey(e.code, false);
      if (e.code === 'Space' && editors.e2) editors.e2.spaceDown = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
}
