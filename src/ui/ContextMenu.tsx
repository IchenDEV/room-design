import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import {
  closeCtxMenu, deleteSelection, duplicateItem, rotateItem,
  toggleDoorStyle, toggleDoorSwing, toggleItemFlip, toggleOpeningFlip, toggleWallMaterial,
} from '../core/store/actions';
import { openingOf, wallOf } from '../core/store/selectors';
import { createGroupFromSelection, duplicateGroup, ungroupSelection } from '../core/store/item-groups';
import { Ic } from './icons';

/** 快捷右键菜单：旋转 / 复制 / 删除 / 玻璃切换（需求 6） */
export function ContextMenu() {
  useTick();
  const ctx = store.ui.ctx;
  if (!ctx) return null;
  const { sel } = ctx;

  const entries: { label: string; icon: string; danger?: boolean; fn: () => void }[] = [];
  if (sel.kind === 'item') {
    entries.push(
      { label: '旋转 90°', icon: 'rotate', fn: () => rotateItem(store, sel.id) },
      { label: '左右翻转', icon: 'flip', fn: () => toggleItemFlip(store, sel.id) },
      { label: '复制', icon: 'copy', fn: () => duplicateItem(store, sel.id) },
      { label: '删除', icon: 'trash', danger: true, fn: () => deleteSelection(store) },
    );
  } else if (sel.kind === 'multi') {
    entries.push(
      { label: '创建组合', icon: 'group', fn: () => createGroupFromSelection(store) },
      { label: '删除', icon: 'trash', danger: true, fn: () => deleteSelection(store) },
    );
  } else if (sel.kind === 'group') {
    entries.push(
      { label: '复制组合', icon: 'copy', fn: () => duplicateGroup(store, sel.id) },
      { label: '解组', icon: 'ungroup', fn: () => ungroupSelection(store) },
      { label: '删除组合', icon: 'trash', danger: true, fn: () => deleteSelection(store) },
    );
  } else if (sel.kind === 'wall') {
    const glass = wallOf(store, sel.id)?.material === 'glass';
    entries.push(
      { label: glass ? '改为实体墙' : '改为玻璃墙', icon: glass ? 'solid' : 'glass', fn: () => toggleWallMaterial(store, sel.id) },
      { label: '删除墙体', icon: 'trash', danger: true, fn: () => deleteSelection(store) },
    );
  } else if (sel.kind === 'opening') {
    const o = openingOf(store, sel.id);
    if (o?.kind === 'door') {
      entries.push({ label: o.style === 'glass' ? '改为木门' : '改为玻璃门', icon: o.style === 'glass' ? 'door' : 'glass', fn: () => toggleDoorStyle(store, sel.id) });
      entries.push({ label: o.swing === 'double' ? '改为单开门' : '改为双开门', icon: 'door', fn: () => toggleDoorSwing(store, sel.id) });
    }
    entries.push({ label: '左右翻转', icon: 'flip', fn: () => toggleOpeningFlip(store, sel.id) });
    entries.push({ label: o?.kind === 'door' ? '删除门' : '删除窗', icon: 'trash', danger: true, fn: () => deleteSelection(store) });
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
            <Ic n={en.icon} size={15} /><span>{en.label}</span>
          </button>
        ))}
      </div>
    </>
  );
}
