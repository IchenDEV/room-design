import type { Store } from '../core/store';
import type { Editor2D } from '../editor2d/editor2d';
import type { Viewer3D } from '../viewer3d/viewer3d';

const HINTS: Record<string, string> = {
  select: '单击选择 · 拖拽移动 · 双击空白平移画布 · 滚轮缩放',
  wall: '单击放置墙体端点（自动吸附端点/墙线/角度）· Enter/双击结束 · Esc 取消 · Shift 自由绘制',
  rect: '按住拖拽，绘制一个矩形房间（四面墙）',
  door: '移动到墙体上，单击放置门',
  window: '移动到墙体上，单击放置窗',
  place: '单击放置家具 · R 旋转 · Shift+单击连续放置 · Esc 取消',
  mode3d: '左键拖拽环绕 · 右键拖拽平移 · 滚轮缩放 · 单击家具选中后可拖动 · 「漫游」进入第一人称',
  walking: 'W A S D 移动 · 按住拖拽转动视角 · Shift 加速 · Esc 退出漫游',
};

export function initChrome(store: Store, editor: Editor2D, viewer: Viewer3D) {
  const $ = (id: string) => document.getElementById(id)!;
  const toolBtns = [...document.querySelectorAll<HTMLButtonElement>('#toolButtons .tb')];
  const segBtns = [...document.querySelectorAll<HTMLButtonElement>('#viewSeg .seg-btn')];
  const btnUndo = $('btnUndo') as HTMLButtonElement;
  const btnRedo = $('btnRedo') as HTMLButtonElement;
  const btnWalk = $('btnWalk') as HTMLButtonElement;
  const wrap3d = $('wrap3d');
  const modal = $('modal');

  // ---- 工具切换 ----
  toolBtns.forEach(btn =>
    btn.addEventListener('click', () => {
      if (store.ui.mode === '3d') setMode('2d');
      store.setTool({ type: btn.dataset.tool as 'select' | 'wall' | 'rect' | 'door' | 'window' });
    }),
  );

  // ---- 视图切换 ----
  function setMode(m: '2d' | '3d') {
    store.setMode(m);
  }
  segBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode as '2d' | '3d')));

  // ---- 编辑操作 ----
  btnUndo.addEventListener('click', () => store.undo());
  btnRedo.addEventListener('click', () => store.redo());
  $('btnDelete').addEventListener('click', () => store.deleteSelection());
  btnWalk.addEventListener('click', () => viewer.toggleWalk());

  // ---- 截图 / 示例 / 清空 ----
  function screenshot() {
    const url = store.ui.mode === '3d' ? viewer.screenshot() : editor.screenshot();
    const a = document.createElement('a');
    a.href = url;
    a.download = `栖居设计_${store.ui.mode === '3d' ? '三维' : '平面'}.png`;
    a.click();
  }
  $('btnShot').addEventListener('click', screenshot);
  $('btnSample').addEventListener('click', () => store.loadSample());
  $('btnClear').addEventListener('click', () => {
    if (confirm('确定清空当前方案？（可通过撤销恢复）')) store.clearAll();
  });

  // ---- 帮助弹层 ----
  $('btnHelp').addEventListener('click', () => { modal.hidden = false; });
  $('modalClose').addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', e => { if (e.target === modal) modal.hidden = true; });

  // ---- 状态栏 ----
  const hintEl = $('hint');
  const statsEl = $('stats');
  const saveEl = $('saveState');

  function syncHint() {
    if (store.ui.walking) hintEl.textContent = HINTS.walking;
    else if (store.ui.mode === '3d') hintEl.textContent = HINTS.mode3d;
    else hintEl.textContent = HINTS[store.ui.tool.type] ?? '';
  }

  function syncStats() {
    const s = store.stats;
    statsEl.textContent = `房间 ${s.rooms} · ${s.area.toFixed(1)} ㎡ · 墙 ${s.walls} · 门窗 ${s.openings} · 家具 ${s.items}`;
  }

  function syncUI() {
    const tool = store.ui.tool;
    toolBtns.forEach(b => b.classList.toggle('active', store.ui.mode === '2d' && tool.type === b.dataset.tool));
    segBtns.forEach(b => b.classList.toggle('active', store.ui.mode === b.dataset.mode));
    wrap3d.hidden = store.ui.mode !== '3d';
    btnWalk.disabled = store.ui.mode !== '3d';
    btnWalk.classList.toggle('active', store.ui.walking);
    $('walkHint').hidden = !store.ui.walking;
    viewer.setVisible(store.ui.mode === '3d');
    syncHint();
  }

  store.on('ui', syncUI);
  store.on('change', e => {
    if (!e?.transient) {
      btnUndo.disabled = !store.canUndo;
      btnRedo.disabled = !store.canRedo;
      saveEl.textContent = '保存中…';
    }
    syncStats();
  });
  store.on('saved', () => {
    const t = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    saveEl.textContent = `已自动保存 ${pad(t.getHours())}:${pad(t.getMinutes())}`;
  });

  syncUI();
  syncStats();
  btnUndo.disabled = !store.canUndo;
  btnRedo.disabled = !store.canRedo;

  return {
    setStatus(coords: string, zoom: string) {
      $('coords').textContent = coords;
      $('zoomLabel').textContent = zoom;
    },
    toggleHelp() { modal.hidden = !modal.hidden; },
    closeHelp() { modal.hidden = true; },
    isHelpOpen() { return !modal.hidden; },
    screenshot,
  };
}
