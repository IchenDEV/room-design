import { useEffect, useRef, useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { stats } from '../core/store/selectors';
import { bindStatus } from './statusBus';

const HINTS: Record<string, string> = {
  select: '左键选择/拖拽 · 右键快捷菜单 · 滚轮缩放 · 空格+拖拽平移',
  boxSelect: '拖拽框选家具，框到家具外接框即可选中',
  wall: '点击放置墙体锚点，双击/回车结束，Esc 取消',
  rect: '按住拖拽画出矩形房间',
  door: '移动到墙上点击放置门',
  window: '移动到墙上点击放置窗',
  ruler: '按住拖拽测量距离，端点可吸附墙端/墙线',
  measure: '按住拖拽创建距离标注，端点可吸附墙端/墙线',
  place: '在画布上点击放置，R 旋转',
};

export function StatusBar() {
  useTick();
  const coordRef = useRef<HTMLSpanElement>(null);
  const zoomRef = useRef<HTMLSpanElement>(null);
  const [savedAt, setSavedAt] = useState('');

  useEffect(() => {
    bindStatus(coordRef.current, zoomRef.current);
    const off = store.on('saved', () => setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false })));
    return () => { bindStatus(null, null); off(); };
  }, []);

  const s = stats(store);
  const base = store.ui.walking
    ? 'W/A/S/D 移动 · 拖拽转视角 · Shift 加速 · Esc 退出漫游'
    : HINTS[store.ui.tool.type] ?? '';
  const selItem3d = store.ui.mode === '3d' && !store.ui.walking && store.sel?.kind === 'item';
  const hint = selItem3d ? `${base} · Shift+拖拽 调高度` : base;

  return (
    <footer className="statusbar">
      <span className="sb-hint">{hint}</span>
      <span className="sb-spacer" />
      <span ref={coordRef} className="sb-mono">—</span>
      <span ref={zoomRef} className="sb-mono">100%</span>
      <span className="sb-stat">房间<b>{s.rooms}</b></span>
      <span className="sb-stat">面积<b>{s.area.toFixed(1)}㎡</b></span>
      <span className="sb-stat">家具<b>{s.items}</b></span>
      <span className="sb-saved" title="编辑会自动保存到本地">
        <i className="sb-dot" />{savedAt ? `已保存 ${savedAt}` : '已自动保存'}
      </span>
    </footer>
  );
}
