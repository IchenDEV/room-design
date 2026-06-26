import { lazy, Suspense, useEffect } from 'react';
import { useState } from 'react';
import { LandingPage } from './ui/LandingPage';
import { Toaster } from './ui/Toaster';

const StudioApp = lazy(() => import('./ui/StudioApp').then((m) => ({ default: m.StudioApp })));

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
      {studio ? (
        <Suspense fallback={<StudioLoading />}>
          <StudioApp />
        </Suspense>
      ) : <LandingPage />}
      <Toaster />
    </>
  );
}

function StudioLoading() {
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
