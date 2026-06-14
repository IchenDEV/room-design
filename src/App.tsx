import { useEffect } from 'react';
import { useState } from 'react';
import { store } from './core/store/store';
import { useTick } from './core/store/react';
import { useShortcuts } from './hooks/useShortcuts';
import { LandingPage } from './ui/LandingPage';
import { Toolbar } from './ui/Toolbar';
import { CatalogPanel } from './ui/CatalogPanel';
import { Stage } from './ui/Stage';
import { PropsPanel } from './ui/PropsPanel';
import { StatusBar } from './ui/StatusBar';
import { ContextMenu } from './ui/ContextMenu';
import { HelpModal } from './ui/HelpModal';

export default function App() {
  const [studio, setStudio] = useState(() => location.hash.startsWith('#/studio'));

  useEffect(() => {
    const sync = () => setStudio(location.hash.startsWith('#/studio'));
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('landing-mode', !studio);
    document.body.classList.toggle('studio-mode', studio);
    if (!studio) document.documentElement.dataset.theme = 'light';
  }, [studio]);

  return studio ? <StudioApp /> : <LandingPage />;
}

function StudioApp() {
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
