import { useEffect, useRef, useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { stats } from '../core/store/selectors';
import { bindStatus } from './statusBus';
import { getSyncState, isCloudActive, type SyncStatus } from '../core/collab/sync-status';
import { Ic } from './icons';

const SYNC_TEXT: Record<SyncStatus, string> = {
  local: '本地已保存',
  syncing: '同步中…',
  synced: '已同步到云端',
  offline: '离线',
  error: '同步失败',
};

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
  const prevItems = useRef<number | null>(null);
  const [savedAt, setSavedAt] = useState('');
  const [itemPulse, setItemPulse] = useState<{ id: number; delta: number } | null>(null);
  const s = stats(store);

  useEffect(() => {
    bindStatus(coordRef.current, zoomRef.current);
    const off = store.on('saved', () => setSavedAt(new Date().toLocaleTimeString('zh-CN', { hour12: false })));
    return () => { bindStatus(null, null); off(); };
  }, []);

  useEffect(() => {
    const prev = prevItems.current;
    prevItems.current = s.items;
    if (prev === null || prev === s.items) return;
    setItemPulse({ id: Date.now(), delta: s.items - prev });
    const t = window.setTimeout(() => setItemPulse(null), 850);
    return () => window.clearTimeout(t);
  }, [s.items]);

  const baseWalk = store.project.settings.solidCollision
    ? 'W/A/S/D 移动 · 单击/E 互动 · 实体碰撞开启 · 拖拽转视角 · Shift 加速 · Esc 退出漫游'
    : 'W/A/S/D 移动 · 单击/E 互动 · 拖拽转视角 · Shift 加速 · Esc 退出漫游';
  const base = store.ui.walking
    ? baseWalk
    : HINTS[store.ui.tool.type] ?? '';
  const selItem3d = store.ui.mode === '3d' && !store.ui.walking && store.sel?.kind === 'item';
  const hint = selItem3d ? `${base} · Shift+拖拽 调高度` : base;
  const sync = getSyncState();
  const syncCls = isCloudActive() ? `sb-sync sb-sync-${sync.status}` : 'sb-sync sb-sync-local';
  const syncIcon = isCloudActive() ? (sync.status === 'syncing' ? 'sync' : 'cloud') : 'save';

  return (
    <footer className="statusbar">
      <span className="sb-hint">{hint}</span>
      <span className="sb-spacer" />
      <span ref={coordRef} className="sb-mono">—</span>
      <span ref={zoomRef} className="sb-mono">100%</span>
      <span className="sb-stat"><Ic n="room" size={13} />房间<b>{s.rooms}</b></span>
      <span className="sb-stat"><Ic n="area" size={13} />面积<b>{s.area.toFixed(1)}㎡</b></span>
      <span className={`sb-stat sb-count${itemPulse ? ' pop' : ''}`} aria-live="polite">
        <Ic n="package" size={13} />
        家具
        <span className="sb-count-wrap">
          <b key={s.items}>{s.items}</b>
          {itemPulse && (
            <i key={itemPulse.id} className={`sb-delta ${itemPulse.delta < 0 ? 'down' : ''}`} aria-hidden="true">
              {itemPulse.delta > 0 ? `+${itemPulse.delta}` : itemPulse.delta}
            </i>
          )}
        </span>
      </span>
      <span className={syncCls} title={sync.message || SYNC_TEXT[sync.status]}>
        <Ic n={syncIcon} size={13} />
        <i className="sb-dot" />
        {isCloudActive()
          ? (sync.status === 'syncing' ? '同步中…' : sync.status === 'synced' ? '已同步' : sync.status === 'error' ? '同步失败' : '已同步')
          : (savedAt ? `已保存 ${savedAt}` : '已自动保存')}
      </span>
    </footer>
  );
}
