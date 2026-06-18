import { useEffect, useRef } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { Editor2D } from '../editor2d/editor';
import { Viewer3D } from '../viewer3d/viewer';
import { editors } from './editors';

export function Stage() {
  useTick();
  const ref2 = useRef<HTMLCanvasElement>(null);
  const ref3 = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const e2 = new Editor2D(ref2.current!, store);
    const v3 = new Viewer3D(ref3.current!, store);
    editors.e2 = e2;
    editors.v3 = v3;
    const sync = () => v3.setVisible(store.ui.mode === '3d');
    sync();
    const off = store.on('ui', sync);
    return () => {
      off();
      e2.dispose();
      v3.dispose();
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
      {store.ui.walking && (
        <div className="walk-hint">
          漫游中：<b>W/A/S/D</b> 移动 · 拖拽鼠标转视角 · <b>Shift</b> 加速 · <b>Esc</b> 退出 · 靠近门时门会打开
        </div>
      )}
    </div>
  );
}
