import './style.css';
import { Store } from './core/store';
import { Editor2D } from './editor2d/editor2d';
import { Viewer3D } from './viewer3d/viewer3d';
import { initChrome } from './ui/chrome';
import { initCatalog } from './ui/catalogPanel';
import { initProps } from './ui/propsPanel';

// 运行时错误收集（便于验收排查）
interface DebugWindow extends Window {
  __errs: string[];
  __studio: { store: Store; editor: Editor2D; viewer: Viewer3D };
}
const dw = window as unknown as DebugWindow;
dw.__errs = [];
window.addEventListener('error', e => dw.__errs.push(String(e.message)));
window.addEventListener('unhandledrejection', e => dw.__errs.push('rejection: ' + String((e as PromiseRejectionEvent).reason)));

const store = new Store();
const canvas2d = document.getElementById('canvas2d') as HTMLCanvasElement;
const canvas3d = document.getElementById('canvas3d') as HTMLCanvasElement;

let chrome: ReturnType<typeof initChrome> | null = null;
const editor = new Editor2D(canvas2d, store, {
  status: (coords, zoom) => chrome?.setStatus(coords, zoom),
});
const viewer = new Viewer3D(canvas3d, store);
chrome = initChrome(store, editor, viewer);
initCatalog(store);
initProps(store, { screenshot: () => chrome!.screenshot() });

requestAnimationFrame(() => {
  editor.fit();
  editor.requestDraw();
});

// ---------------- 全局快捷键 ----------------
function ensure2d() {
  if (store.ui.mode !== '2d') store.setMode('2d');
}

window.addEventListener('keydown', e => {
  const tgt = e.target as HTMLElement | null;
  const typing = !!tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA' || tgt.isContentEditable);
  if (typing) return;

  if (e.key === ' ') {
    editor.spaceDown = true;
    e.preventDefault();
    return;
  }

  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    if (e.shiftKey) store.redo();
    else store.undo();
    return;
  }
  if (mod && e.key.toLowerCase() === 's') {
    e.preventDefault();
    store.scheduleSave();
    return;
  }
  if (mod) return;

  // 漫游模式下把 WASD 留给 3D 视图
  if (store.ui.walking && e.key !== 'Escape') return;

  switch (e.key) {
    case 'v': case 'V': store.setTool({ type: 'select' }); break;
    case 'w': case 'W': ensure2d(); store.setTool({ type: 'wall' }); break;
    case 'b': case 'B': ensure2d(); store.setTool({ type: 'rect' }); break;
    case 'd': case 'D': ensure2d(); store.setTool({ type: 'door' }); break;
    case 'n': case 'N': ensure2d(); store.setTool({ type: 'window' }); break;
    case 'r': case 'R': editor.rotateSel(); break;
    case '2': store.setMode('2d'); break;
    case '3': store.setMode('3d'); break;
    case 'Enter': editor.endChain(); break;
    case 'Escape':
      if (chrome?.isHelpOpen()) chrome.closeHelp();
      else if (store.ui.walking) viewer.toggleWalk();
      else editor.escape();
      break;
    case 'Delete': case 'Backspace': store.deleteSelection(); break;
    case 'ArrowLeft': e.preventDefault(); editor.nudge(e.shiftKey ? -10 : -1, 0); break;
    case 'ArrowRight': e.preventDefault(); editor.nudge(e.shiftKey ? 10 : 1, 0); break;
    case 'ArrowUp': e.preventDefault(); editor.nudge(0, e.shiftKey ? 10 : 1); break;
    case 'ArrowDown': e.preventDefault(); editor.nudge(0, e.shiftKey ? -10 : -1); break;
    case '?': chrome?.toggleHelp(); break;
  }
});

window.addEventListener('keyup', e => {
  if (e.key === ' ') editor.spaceDown = false;
});

// 调试句柄
dw.__studio = { store, editor, viewer };
