import { createRoot } from 'react-dom/client';
import App from './App';
import { store } from './core/store/store';
import './styles/theme.css';
import './styles/layout.css';
import './styles/toolbar.css';
import './styles/loading.css';
import './styles/stage.css';
import './styles/panels.css';
import './styles/panel-tabs.css';
import './styles/panel-collapse.css';
import './styles/count-animations.css';
import './styles/widgets.css';
import './styles/actions.css';
import './styles/templates.css';
import './styles/ai.css';
import './styles/ai-chat.css';
import './styles/ai-images.css';
import './styles/files.css';
import './styles/collab.css';
import './styles/studio-responsive.css';
import './styles/landing.css';
import './styles/landing-hero.css';
import './styles/landing-workflow.css';
import './styles/landing-plan.css';
import './styles/landing-sections.css';
import './styles/landing-responsive.css';

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

createRoot(document.getElementById('root')!).render(<App />);
