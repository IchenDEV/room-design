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
import { Toaster } from './ui/Toaster';
import { AuthModal } from './ui/AuthModal';
import { AccountModal } from './ui/AccountModal';
import { ShareModal } from './ui/ShareModal';

const isStudioHash = () => location.hash.startsWith('#/studio') || location.hash.startsWith('#/i/');

export default function App() {
  const [studio, setStudio] = useState(isStudioHash);

  useEffect(() => {
    const sync = () => setStudio(isStudioHash());
    addEventListener('hashchange', sync);
    return () => removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('landing-mode', !studio);
    document.body.classList.toggle('studio-mode', studio);
    if (!studio) document.documentElement.dataset.theme = 'light';
  }, [studio]);

  return (
    <>
      {studio ? <StudioApp /> : <LandingPage />}
      <Toaster />
      <AuthModal />
      <AccountModal />
      <ShareModal />
    </>
  );
}

function StudioApp() {
  useTick();
  useShortcuts();

  // 深浅主题同步到 DOM 与本地偏好
  useEffect(() => {
    document.documentElement.dataset.theme = store.ui.theme;
    localStorage.setItem('qiju-theme', store.ui.theme);
  }, [store.ui.theme]);

  if (!store.ui.hydrated) {
    return <LoadingScreen />;
  }

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

function LoadingScreen() {
  return (
    <div className="app app-loading" aria-busy="true">
      <div className="loading-blueprint" aria-hidden="true">
        <span className="loading-room loading-room-living" />
        <span className="loading-room loading-room-bed" />
        <span className="loading-room loading-room-bath" />
        <span className="loading-wall loading-wall-x loading-wall-top" />
        <span className="loading-wall loading-wall-x loading-wall-mid" />
        <span className="loading-wall loading-wall-x loading-wall-bottom" />
        <span className="loading-wall loading-wall-y loading-wall-left" />
        <span className="loading-wall loading-wall-y loading-wall-right" />
        <span className="loading-wall loading-wall-y loading-wall-inner" />
        <span className="loading-door" />
        <span className="loading-furniture loading-furniture-sofa" />
        <span className="loading-furniture loading-furniture-table" />
        <span className="loading-pencil" />
      </div>
      <div className="loading-copy" role="status" aria-live="polite">
        <span className="loading-title">正在加载方案…</span>
        <span className="loading-subtitle">铺开蓝图，摆好第一件家具</span>
      </div>
    </div>
  );
}
