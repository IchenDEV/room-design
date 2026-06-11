import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { deleteSelection } from '../core/store/actions';
import { editors } from './editors';
import { Ic } from './icons';
import { ToolbarRight } from './ToolbarRight';
import type { Tool } from '../core/types';

const TOOLS: { id: Tool['type']; icon: string; name: string; key: string }[] = [
  { id: 'select', icon: 'select', name: '选择', key: 'V' },
  { id: 'wall', icon: 'wall', name: '画墙', key: 'W' },
  { id: 'rect', icon: 'rect', name: '矩形房间', key: 'T' },
  { id: 'door', icon: 'door', name: '门', key: 'D' },
  { id: 'window', icon: 'window', name: '窗', key: 'N' },
];

export function Toolbar() {
  useTick();
  const ui = store.ui;
  return (
    <header className="toolbar">
      <div className="brand">
        <span className="brand-mark">栖</span>
        <span className="brand-name">栖居设计</span>
      </div>
      <div className="tb-group">
        {TOOLS.map((t) => (
          <button key={t.id} className={`tb-btn ${ui.tool.type === t.id ? 'on' : ''}`}
            title={`${t.name} (${t.key})`}
            onClick={() => store.setTool(ui.tool.type === t.id ? { type: 'select' } : ({ type: t.id } as Tool))}>
            <Ic n={t.icon} />
          </button>
        ))}
      </div>
      <div className="tb-group">
        <button className="tb-btn" title="撤销 (⌘Z)" disabled={!store.canUndo} onClick={() => store.undo()}><Ic n="undo" /></button>
        <button className="tb-btn" title="重做 (⇧⌘Z)" disabled={!store.canRedo} onClick={() => store.redo()}><Ic n="redo" /></button>
        <button className="tb-btn" title="删除选中 (Del)" disabled={!store.sel} onClick={() => deleteSelection(store)}><Ic n="trash" /></button>
        <button className="tb-btn" title="适配视图 (F)"
          onClick={() => (ui.mode === '2d' ? editors.e2?.fit() : editors.v3?.fitCamera())}><Ic n="fit" /></button>
      </div>
      <div className="tb-group seg">
        <button className={`tb-btn wide ${ui.mode === '2d' ? 'on' : ''}`} onClick={() => store.setMode('2d')}>
          <Ic n="plan" /><span>2D 平面</span>
        </button>
        <button className={`tb-btn wide ${ui.mode === '3d' ? 'on' : ''}`} onClick={() => store.setMode('3d')}>
          <Ic n="cube" /><span>3D 效果</span>
        </button>
        <button className={`tb-btn wide ${ui.walking ? 'on' : ''}`} title="第一人称漫游 (G)" disabled={ui.mode !== '3d'}
          onClick={() => editors.v3?.walk.toggle()}>
          <Ic n="walk" /><span>漫游</span>
        </button>
      </div>
      <div className="tb-spacer" />
      <ToolbarRight />
    </header>
  );
}
