import { useRef, useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { clearAll, loadSample } from '../core/store/actions';
import { exportProject, importProjectFileAsNew } from '../core/io';
import { shareProject } from '../core/share';
import { SAMPLES } from '../core/samples';
import { editors } from './editors';
import { Ic } from './icons';
import { FileMenu } from './FileMenu';

function useToggle() {
  const [open, setOpen] = useState(false);
  return { open, on: () => setOpen(true), off: () => setOpen(false), flip: () => setOpen((v) => !v) };
}

const shot = () => (store.ui.mode === '2d' ? editors.e2?.screenshot() : editors.v3?.screenshot());

export function ToolbarRight() {
  useTick();
  const sample = useToggle();
  const exp = useToggle();
  const more = useToggle();
  const [sharing, setSharing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const theme = store.ui.theme;
  const flipTheme = () => store.patchUI({ theme: theme === 'dark' ? 'light' : 'dark' });

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const err = await importProjectFileAsNew(store, f);
    if (err) alert(`导入失败：${err}`);
  };
  const onShare = async () => {
    if (sharing) return;
    setSharing(true);
    try { alert(await shareProject(store)); }
    catch { alert('分享失败，请稍后再试'); }
    finally { setSharing(false); }
  };

  return (
    <div className="tb-group right">
      <FileMenu />
      <div className="dropdown">
        <button className="tb-btn wide" title="示例方案" onClick={sample.flip}>
          <Ic n="sample" size={15} /><span>示例</span><Ic n="chev" size={13} />
        </button>
        {sample.open && (<>
          <div className="dd-backdrop" onClick={sample.off} />
          <div className="dd-menu">
            <div className="dd-head">载入示例方案</div>
            {SAMPLES.map((s) => (
              <button key={s.id} className="dd-item" onClick={() => { loadSample(store, s.id); sample.off(); }}>
                <Ic n="sample" size={15} /><span>{s.name}</span>
              </button>
            ))}
          </div>
        </>)}
      </div>

      <span className="tb-divider" />

      <div className="dropdown">
        <button className="tb-btn wide" title="导入 / 导出 / 分享 / 截图" onClick={exp.flip}>
          <Ic n="download" size={15} /><span>导出</span><Ic n="chev" size={13} />
        </button>
        {exp.open && (<>
          <div className="dd-backdrop" onClick={exp.off} />
          <div className="dd-menu">
            <div className="dd-head">导入与导出</div>
            <button className="dd-item" onClick={() => { exportProject(store); exp.off(); }}>
              <Ic n="download" size={15} /><span>导出方案 (JSON)</span>
            </button>
            <button className="dd-item" onClick={() => { fileRef.current?.click(); exp.off(); }}>
              <Ic n="upload" size={15} /><span>导入方案 (JSON)</span>
            </button>
            <div className="dd-sep" />
            <button className="dd-item" disabled={sharing} onClick={() => { onShare(); exp.off(); }}>
              <Ic n="share" size={15} /><span>{sharing ? '分享中…' : '分享方案链接'}</span>
            </button>
            <button className="dd-item" onClick={() => { shot(); exp.off(); }}>
              <Ic n="camera" size={15} /><span>导出截图 (PNG)</span>
            </button>
          </div>
        </>)}
      </div>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden
        onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />

      <span className="tb-divider" />

      <button className="tb-btn" title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'} onClick={flipTheme}>
        <Ic n={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
      <div className="dropdown">
        <button className="tb-btn" title="更多" onClick={more.flip}><Ic n="more" /></button>
        {more.open && (<>
          <div className="dd-backdrop" onClick={more.off} />
          <div className="dd-menu">
            <button className="dd-item" onClick={() => { store.patchUI({ help: !store.ui.help }); more.off(); }}>
              <Ic n="help" size={15} /><span>快捷键说明</span>
            </button>
            <div className="dd-sep" />
            <button className="dd-item danger" onClick={() => {
              if (confirm('确定清空当前方案？（可撤销）')) { clearAll(store); more.off(); }
            }}>
              <Ic n="clear" size={15} /><span>清空画布</span>
            </button>
          </div>
        </>)}
      </div>
    </div>
  );
}
