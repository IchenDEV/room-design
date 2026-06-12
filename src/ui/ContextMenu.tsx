import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import {
  closeCtxMenu, deleteSelection, duplicateItem, rotateItem,
  toggleDoorStyle, toggleDoorSwing, toggleItemFlip, toggleOpeningFlip, toggleWallMaterial,
} from '../core/store/actions';
import { openingOf, wallOf } from '../core/store/selectors';

/** 快捷右键菜单：旋转 / 复制 / 删除 / 玻璃切换（需求 6） */
export function ContextMenu() {
  useTick();
  const ctx = store.ui.ctx;
  if (!ctx) return null;
  const { sel } = ctx;

  const entries: { label: string; danger?: boolean; fn: () => void }[] = [];
  if (sel.kind === 'item') {
    entries.push(
      { label: '旋转 90°', fn: () => rotateItem(store, sel.id) },
      { label: '左右翻转', fn: () => toggleItemFlip(store, sel.id) },
      { label: '复制', fn: () => duplicateItem(store, sel.id) },
      { label: '删除', danger: true, fn: () => deleteSelection(store) },
    );
  } else if (sel.kind === 'wall') {
    const glass = wallOf(store, sel.id)?.material === 'glass';
    entries.push(
      { label: glass ? '改为实体墙' : '改为玻璃墙', fn: () => toggleWallMaterial(store, sel.id) },
      { label: '删除墙体', danger: true, fn: () => deleteSelection(store) },
    );
  } else if (sel.kind === 'opening') {
    const o = openingOf(store, sel.id);
    if (o?.kind === 'door') {
      entries.push({ label: o.style === 'glass' ? '改为木门' : '改为玻璃门', fn: () => toggleDoorStyle(store, sel.id) });
      entries.push({ label: o.swing === 'double' ? '改为单开门' : '改为双开门', fn: () => toggleDoorSwing(store, sel.id) });
    }
    entries.push({ label: '左右翻转', fn: () => toggleOpeningFlip(store, sel.id) });
    entries.push({ label: o?.kind === 'door' ? '删除门' : '删除窗', danger: true, fn: () => deleteSelection(store) });
  }
  if (!entries.length) return null;

  const x = Math.min(ctx.x, window.innerWidth - 150);
  const y = Math.min(ctx.y, window.innerHeight - entries.length * 34 - 16);

  return (
    <>
      <div className="ctx-backdrop"
        onPointerDown={() => closeCtxMenu(store)}
        onContextMenu={(e) => { e.preventDefault(); closeCtxMenu(store); }} />
      <div className="ctx-menu" style={{ left: x, top: y }}>
        {entries.map((en) => (
          <button key={en.label} className={`ctx-item ${en.danger ? 'danger' : ''}`}
            onClick={() => { en.fn(); closeCtxMenu(store); }}>
            {en.label}
          </button>
        ))}
      </div>
    </>
  );
}
