import { useEffect } from 'react';
import { store } from './core/store/store';
import { useTick } from './core/store/react';
import { useShortcuts } from './hooks/useShortcuts';
import { Toolbar } from './ui/Toolbar';
import { CatalogPanel } from './ui/CatalogPanel';
import { Stage } from './ui/Stage';
import { PropsPanel } from './ui/PropsPanel';
import { StatusBar } from './ui/StatusBar';
import { ContextMenu } from './ui/ContextMenu';
import { HelpModal } from './ui/HelpModal';

export default function App() {
  useTick();
  useShortcuts();

  // 深浅主题同步到 DOM 与本地偏好
  useEffect(() => {
    document.documentElement.dataset.theme = store.ui.theme;
    localStorage.setItem('qiju-theme', store.ui.theme);
  }, [store.ui.theme]);

  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <CatalogPanel />
        <Stage />
        <PropsPanel />
      </div>
      <StatusBar />
      <ContextMenu />
      <HelpModal />
    </div>
  );
}
