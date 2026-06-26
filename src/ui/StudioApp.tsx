import { useEffect } from 'react';
import { store } from '../core/store/store';
import { initPersist } from '../core/store/persist';
import { useTick } from '../core/store/react';
import { useShortcuts } from '../hooks/useShortcuts';
import { CatalogPanel } from './CatalogPanel';
import { ContextMenu } from './ContextMenu';
import { HelpModal } from './HelpModal';
import { ModalHost } from './ModalHost';
import { PropsPanel } from './PropsPanel';
import { Stage } from './Stage';
import { StatusBar } from './StatusBar';
import { Toolbar } from './Toolbar';

export function StudioApp() {
  useTick();
  useShortcuts();

  useEffect(() => {
    let offAuth: (() => void) | undefined;
    let cancelled = false;
    initPersist(store);
    void import('../core/store/store-user')
      .then(({ initAuth }) => {
        if (!cancelled) offAuth = initAuth(store);
      })
      .catch((err) => {
        console.error('Failed to initialize studio auth', err);
        store.patchUI({ hydrated: true });
      });
    return () => {
      cancelled = true;
      offAuth?.();
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = store.ui.theme;
    localStorage.setItem('qiju-theme', store.ui.theme);
  }, [store.ui.theme]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const collapse = () => {
      if (mq.matches && (store.ui.panelL || store.ui.panelR)) store.patchUI({ panelL: false, panelR: false });
    };
    collapse();
    mq.addEventListener('change', collapse);
    return () => mq.removeEventListener('change', collapse);
  }, []);

  if (!store.ui.hydrated) return <LoadingScreen />;

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
      <ModalHost />
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
