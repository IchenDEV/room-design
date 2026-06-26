import { useEffect, useRef, useState } from 'react';
import { store } from '../core/store/store';
import { useUiTick } from '../core/store/react';
import { Editor2D } from '../editor2d/editor';
import { editors } from './editors';
import type { Viewer3D } from '../viewer3d/viewer';

type Viewer3DModule = typeof import('../viewer3d/viewer');

let viewer3DModule: Promise<Viewer3DModule> | null = null;

const loadViewer3D = () => (viewer3DModule ??= import('../viewer3d/viewer'));

const warmupViewer3D = () => {
  const run = () => { void loadViewer3D(); };
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(run, { timeout: 2200 });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(run, 1400);
  return () => globalThis.clearTimeout(id);
};

export function Stage() {
  useUiTick();
  const ref2 = useRef<HTMLCanvasElement>(null);
  const ref3 = useRef<HTMLCanvasElement>(null);
  const v3Ref = useRef<Viewer3D | null>(null);
  const loadingRef = useRef<Promise<Viewer3D | null> | null>(null);
  const [v3Loading, setV3Loading] = useState(false);
  const [v3Error, setV3Error] = useState(false);

  useEffect(() => {
    let alive = true;
    const e2 = new Editor2D(ref2.current!, store);
    editors.e2 = e2;

    const ensureViewer3D = () => {
      if (v3Ref.current) return Promise.resolve(v3Ref.current);
      if (loadingRef.current) return loadingRef.current;
      setV3Loading(true);
      setV3Error(false);
      loadingRef.current = loadViewer3D()
        .then(({ Viewer3D }) => {
          if (!alive || !ref3.current) return null;
          const viewer = new Viewer3D(ref3.current, store);
          v3Ref.current = viewer;
          editors.v3 = viewer;
          return viewer;
        })
        .catch((err) => {
          console.error('Failed to load 3D viewer', err);
          if (alive) setV3Error(true);
          return null;
        })
        .finally(() => {
          loadingRef.current = null;
          if (alive) setV3Loading(false);
        });
      return loadingRef.current;
    };

    const sync = () => {
      if (store.ui.mode !== '3d') {
        v3Ref.current?.setVisible(false);
        return;
      }
      void ensureViewer3D().then((viewer) => viewer?.setVisible(store.ui.mode === '3d'));
    };
    sync();
    const off = store.on('ui', sync);
    const cancelWarmup = warmupViewer3D();
    return () => {
      alive = false;
      cancelWarmup();
      off();
      e2.dispose();
      v3Ref.current?.dispose();
      editors.e2 = null;
      editors.v3 = null;
    };
  }, []);

  const mode = store.ui.mode;
  return (
    <div className="stage">
      <div className="cv-host" style={{ visibility: mode === '2d' ? 'visible' : 'hidden' }}>
        <canvas ref={ref2} className="cv" />
      </div>
      <div className="cv-host" style={{ visibility: mode === '3d' ? 'visible' : 'hidden' }}>
        <canvas ref={ref3} className="cv" />
      </div>
      {mode === '3d' && (v3Loading || v3Error) && (
        <div className="stage-status" role="status" aria-live="polite">
          {!v3Error && <span className="stage-spinner" aria-hidden="true" />}
          <span>{v3Error ? '3D 视图加载失败，请刷新后重试' : '正在打开 3D 视图…'}</span>
        </div>
      )}
      {store.ui.walking && (
        <div className="walk-hint">
          漫游中：<b>W/A/S/D</b> 移动 · 拖拽鼠标转视角 · <b>Shift</b> 加速 · <b>Esc</b> 退出 · 靠近门时门会打开
        </div>
      )}
    </div>
  );
}
