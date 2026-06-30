import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { deleteSelection } from '../core/store/actions';
import { stats } from '../core/store/selectors';
import { editors } from './editors';
import { Ic } from './icons';
import { FileMenu } from './FileMenu';
import { ToolbarRight } from './ToolbarRight';
import { PresenceBar } from './PresenceBar';
import type { Tool } from '../core/types';

const TOOLS: { id: Tool['type']; icon: string; name: string; key: string }[] = [
  { id: 'select', icon: 'select', name: '选择', key: 'V' },
  { id: 'boxSelect', icon: 'boxSelect', name: '框选', key: 'K' },
  { id: 'wall', icon: 'wall', name: '画墙', key: 'W' },
  { id: 'rect', icon: 'rect', name: '矩形房间', key: 'T' },
  { id: 'door', icon: 'door', name: '门', key: 'D' },
  { id: 'window', icon: 'window', name: '窗', key: 'N' },
  { id: 'ruler', icon: 'ruler', name: '尺子', key: 'L' },
  { id: 'measure', icon: 'measure', name: '距离标注', key: 'B' },
];

const logoMark = `${import.meta.env.BASE_URL}qiju-logo-mark.svg`;

export function Toolbar() {
  useTick();
  const ui = store.ui;
  const s = stats(store);
  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <a className="brand" href="#top" title="返回官网">
          <img className="brand-mark" src={logoMark} alt="" aria-hidden="true" />
          <span className="brand-name">栖居设计</span>
        </a>
        <span className="tb-divider" />
        <FileMenu />
        <div className="toolbar-stats" aria-label="当前方案概览">
          <span><Ic n="room" size={13} />{s.rooms} 房间</span>
          <span><Ic n="area" size={13} />{s.area.toFixed(1)}㎡</span>
          <span><Ic n="package" size={13} />{s.items} 家具</span>
        </div>
      </div>
      <div className="tb-group">
        {TOOLS.map((t) => (
          <button key={t.id} className={`tb-btn ${ui.tool.type === t.id ? 'on' : ''}`}
            title={`${t.name} (${t.key})`}
            onClick={() => store.setTool(ui.tool.type === t.id ? { type: 'select' } : ({ type: t.id } as Tool))}>
            <Ic n={t.icon} />
          </button>
        ))}
        <span className="tb-divider" />
        <button className="tb-btn" title="撤销 (⌘Z)" disabled={!store.canUndo} onClick={() => store.undo()}><Ic n="undo" /></button>
        <button className="tb-btn" title="重做 (⇧⌘Z)" disabled={!store.canRedo} onClick={() => store.redo()}><Ic n="redo" /></button>
        <button className="tb-btn" title="删除选中 (Del)" disabled={!store.sel} onClick={() => deleteSelection(store)}><Ic n="trash" /></button>
        <button className="tb-btn" title="适配视图 (F)"
          onClick={() => (ui.mode === '2d' ? editors.e2?.fit() : editors.v3?.fitCamera())}><Ic n="fit" /></button>
        <button className={`tb-btn ${ui.panelView === 'templates' ? 'on' : ''}`} title="模板方案" aria-label="模板方案"
          onClick={() => store.patchUI({ panelView: ui.panelView === 'templates' ? 'props' : 'templates', panelR: true })}><Ic n="template" /></button>
        <button className={`tb-btn ${ui.panelView === 'ai' ? 'on' : ''}`} title="AI 辅助设计" aria-label="AI 辅助设计"
          onClick={() => store.patchUI({ panelView: ui.panelView === 'ai' ? 'props' : 'ai', panelR: true })}><Ic n="sparkle" /></button>
      </div>
      <div className="tb-group seg">
        <button className={`tb-btn mode-btn ${ui.mode === '2d' ? 'on' : ''}`} title="2D 平面图"
          onClick={() => store.setMode('2d')}><Ic n="plan" /><span>2D 平面</span></button>
        <button className={`tb-btn mode-btn ${ui.mode === '3d' ? 'on' : ''}`} title="3D 视图"
          onClick={() => store.setMode('3d')}><Ic n="cube" /><span>3D 视图</span></button>
        <button className={`tb-btn mode-btn ${ui.walking ? 'on' : ''}`} title="第一人称漫游 (G)" disabled={ui.mode !== '3d'}
          onClick={() => editors.v3?.walk.toggle()}><Ic n="walk" /><span>漫游</span></button>
      </div>
      <div className="tb-spacer" />
      <PresenceBar />
      <ToolbarRight />
    </header>
  );
}
