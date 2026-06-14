import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { Ic } from './icons';

const ROWS: [string, string][] = [
  ['V / K / W / T / D / N / L / B', '选择 / 框选 / 画墙 / 矩形房间 / 门 / 窗 / 尺子 / 距离标注'],
  ['R', '旋转选中家具 90°'],
  ['方向键 (+Shift)', '微移家具 1cm (10cm)'],
  ['Delete / Backspace', '删除选中元素'],
  ['⌘Z / ⇧⌘Z', '撤销 / 重做'],
  ['Enter / 双击', '结束画墙'],
  ['Esc', '取消工具 / 关闭菜单 / 退出漫游'],
  ['F', '适配视图'],
  ['M', '切换 2D / 3D'],
  ['G', '3D 漫游（W/A/S/D 移动，靠近门自动开门）'],
  ['右键', '快捷菜单：旋转 / 复制 / 删除 / 玻璃切换'],
  ['空格 + 拖拽', '平移画布'],
];

export function HelpModal() {
  useTick();
  if (!store.ui.help) return null;
  const close = () => store.patchUI({ help: false });
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>快捷键</b>
          <button className="tb-btn" title="关闭" onClick={close}><Ic n="close" /></button>
        </div>
        <div className="modal-body">
          {ROWS.map(([k, v]) => (
            <div className="hk-row" key={k}>
              <span className="hk-key">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
