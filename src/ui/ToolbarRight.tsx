import { useRef, useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { clearAll, loadSample } from '../core/store/actions';
import { exportProject, importProjectFileAsNew } from '../core/io';
import { SAMPLES } from '../core/samples';
import { editors } from './editors';
import { Ic } from './icons';
import { FileMenu } from './FileMenu';

export function ToolbarRight() {
  useTick();
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const theme = store.ui.theme;

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const err = await importProjectFileAsNew(store, f);
    if (err) alert(`导入失败：${err}`);
  };

  return (
    <div className="tb-group right">
      <FileMenu />
      <div className="dropdown">
        <button className="tb-btn wide" onClick={() => setOpen(!open)}>
          <span>示例方案</span><Ic n="chev" size={14} />
        </button>
        {open && (
          <>
            <div className="dd-backdrop" onClick={() => setOpen(false)} />
            <div className="dd-menu">
              {SAMPLES.map((s) => (
                <button key={s.id} className="dd-item" onClick={() => { loadSample(store, s.id); setOpen(false); }}>
                  <Ic n="sample" size={15} /><span>{s.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <button className="tb-btn" title="导入为新方案文件 (JSON)" onClick={() => fileRef.current?.click()}><Ic n="upload" /></button>
      <input ref={fileRef} type="file" accept=".json,application/json" hidden
        onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
      <button className="tb-btn" title="导出方案 (JSON)" onClick={() => exportProject(store)}><Ic n="download" /></button>
      <button className="tb-btn" title="导出截图 (PNG)"
        onClick={() => (store.ui.mode === '2d' ? editors.e2?.screenshot() : editors.v3?.screenshot())}>
        <Ic n="camera" />
      </button>
      <button className="tb-btn" title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
        onClick={() => store.patchUI({ theme: theme === 'dark' ? 'light' : 'dark' })}>
        <Ic n={theme === 'dark' ? 'sun' : 'moon'} />
      </button>
      <button className="tb-btn" title="快捷键说明" onClick={() => store.patchUI({ help: !store.ui.help })}><Ic n="help" /></button>
      <button className="tb-btn" title="清空画布"
        onClick={() => { if (confirm('确定清空当前方案？（可撤销）')) clearAll(store); }}>
        <Ic n="clear" />
      </button>
    </div>
  );
}
