import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import {
  alignItems, closeCtxMenu, deleteSelection, duplicateItem, resetItemZ, reverseWall,
  rotateItem, toggleDoorStyle, toggleDoorSwing, toggleItemFlip, toggleOpeningFlip, toggleWallMaterial,
} from '../core/store/actions';
import type { AlignMode } from '../core/store/actions';
import { openingOf, wallOf } from '../core/store/selectors';
import { createGroupFromSelection, duplicateGroup, ungroupSelection } from '../core/store/item-groups';
import { Ic } from './icons';

type Entry = { label: string; icon: string; danger?: boolean; fn: () => void } | { sep: true };

const alignMenus: { label: string; mode: AlignMode }[] = [
  { label: '左对齐', mode: 'left' }, { label: '右对齐', mode: 'right' },
  { label: '顶对齐', mode: 'top' }, { label: '底对齐', mode: 'bottom' },
  { label: '水平居中', mode: 'hCenter' }, { label: '垂直居中', mode: 'vCenter' },
];

/** 快捷右键菜单：变换 / 复制 / 材质切换 / 对齐 / 删除 */
export function ContextMenu() {
  useTick();
  const ctx = store.ui.ctx;
  if (!ctx) return null;
  const { sel } = ctx;
  const e: Entry[] = [];
  const item = (label: string, icon: string, fn: () => void, danger = false) => e.push({ label, icon, fn, danger });
  const sep = () => e.push({ sep: true });

  if (sel.kind === 'item') {
    item('旋转 90°', 'rotate', () => rotateItem(store, sel.id));
    item('左右翻转', 'flip', () => toggleItemFlip(store, sel.id));
    sep();
    item('复制', 'copy', () => duplicateItem(store, sel.id));
    if ((store.project.items.find((i) => i.id === sel.id)?.z ?? 0) > 0)
      item('重置高度', 'align', () => resetItemZ(store, sel.id));
    sep();
    item('删除', 'trash', () => deleteSelection(store), true);
  } else if (sel.kind === 'multi') {
    for (const a of alignMenus) item(a.label, 'align', () => alignItems(store, a.mode));
    sep();
    item('创建组合', 'group', () => createGroupFromSelection(store));
    sep();
    item('删除', 'trash', () => deleteSelection(store), true);
  } else if (sel.kind === 'group') {
    item('复制组合', 'copy', () => duplicateGroup(store, sel.id));
    item('解组', 'ungroup', () => ungroupSelection(store));
    sep();
    item('删除组合', 'trash', () => deleteSelection(store), true);
  } else if (sel.kind === 'wall') {
    const glass = wallOf(store, sel.id)?.material === 'glass';
    item(glass ? '改为实体墙' : '改为玻璃墙', glass ? 'solid' : 'glass', () => toggleWallMaterial(store, sel.id));
    item('反转方向', 'flip', () => reverseWall(store, sel.id));
    sep();
    item('删除墙体', 'trash', () => deleteSelection(store), true);
  } else if (sel.kind === 'opening') {
    const o = openingOf(store, sel.id);
    if (o?.kind === 'door') {
      item(o.style === 'glass' ? '改为木门' : '改为玻璃门', o.style === 'glass' ? 'door' : 'glass', () => toggleDoorStyle(store, sel.id));
      item(o.swing === 'double' ? '改为单开门' : '改为双开门', 'door', () => toggleDoorSwing(store, sel.id));
    }
    item('左右翻转', 'flip', () => toggleOpeningFlip(store, sel.id));
    sep();
    item(o?.kind === 'door' ? '删除门' : '删除窗', 'trash', () => deleteSelection(store), true);
  } else if (sel.kind === 'measure') {
    item('删除标注', 'trash', () => deleteSelection(store), true);
  } else if (sel.kind === 'room') {
    item('移除房间标注', 'trash', () => deleteSelection(store), true);
  }

  const real = e.filter((x) => !('sep' in x));
  if (!real.length) return null;
  const x = Math.min(ctx.x, window.innerWidth - 156);
  const y = Math.min(ctx.y, window.innerHeight - real.length * 34 - 16);

  return (
    <>
      <div className="ctx-backdrop"
        onPointerDown={() => closeCtxMenu(store)}
        onContextMenu={(ev) => { ev.preventDefault(); closeCtxMenu(store); }} />
      <div className="ctx-menu" style={{ left: x, top: y }}>
        {e.map((en, i) => ('sep' in en ? (
          <div key={i} className="ctx-sep" />
        ) : (
          <button key={en.label} className={`ctx-item ${en.danger ? 'danger' : ''}`}
            onClick={() => { en.fn(); closeCtxMenu(store); }}>
            <Ic n={en.icon} size={15} /><span>{en.label}</span>
          </button>
        )))}
      </div>
    </>
  );
}
