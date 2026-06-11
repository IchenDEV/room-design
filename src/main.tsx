import { createRoot } from 'react-dom/client';
import App from './App';
import { store } from './core/store/store';
import { initPersist } from './core/store/persist';
import './styles/theme.css';
import './styles/layout.css';
import './styles/panels.css';
import './styles/widgets.css';

// 主题初始化：本地偏好 > 系统偏好
const savedTheme = localStorage.getItem('qiju-theme');
store.ui.theme = savedTheme === 'light' || savedTheme === 'dark'
  ? savedTheme
  : window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
document.documentElement.dataset.theme = store.ui.theme;

// 调试辅助：错误收集 + 全局句柄
import { editors } from './ui/editors';
const errs: string[] = [];
window.addEventListener('error', (e) => errs.push(String(e.message)));
window.addEventListener('unhandledrejection', (e) => errs.push(`rejection: ${e.reason}`));
declare global {
  interface Window { __errs: string[]; __studio: { store: typeof store; editors: typeof editors } }
}
window.__errs = errs;
window.__studio = { store, editors };

initPersist(store);
createRoot(document.getElementById('root')!).render(<App />);
