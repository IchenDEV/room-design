import { useEffect, useRef, useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { stats } from '../core/store/selectors';
import { bindStatus } from './statusBus';

const HINTS: Record<string, string> = {
  select: '左键选择/拖拽 · 右键快捷菜单 · 滚轮缩放 · 空格+拖拽平移',
  wall: '点击放置墙体锚点，双击/回车结束，Esc 取消',
  rect: '按住拖拽画出矩形房间',
  door: '移动到墙上点击放置门',
  window: '移动到墙上点击放置窗',
  place: '在画布点击放置素材，靠墙自动贴齐，R 旋转',
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
  const hint = store.ui.walking
    ? 'W/A/S/D 移动 · 拖拽转视角 · Shift 加速 · Esc 退出漫游'
    : HINTS[store.ui.tool.type] ?? '';

  return (
    <footer className="statusbar">
      <span className="sb-hint">{hint}</span>
      <span className="sb-spacer" />
      <span ref={coordRef} className="sb-mono">—</span>
      <span className="sb-sep">|</span>
      <span ref={zoomRef} className="sb-mono">100%</span>
      <span className="sb-sep">|</span>
      <span>{s.rooms} 房间 · {s.area.toFixed(1)} ㎡ · {s.items} 家具</span>
      <span className="sb-sep">|</span>
      <span className="sb-saved" title="所有编辑实时保存到浏览器 IndexedDB">
        {savedAt ? `已保存 ${savedAt}` : 'IndexedDB 实时存储'}
      </span>
    </footer>
  );
}
