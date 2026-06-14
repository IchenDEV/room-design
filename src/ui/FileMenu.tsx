import { useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import {
  activeProjectFile, createProjectFile, deleteProjectFile,
  duplicateProjectFile, projectFiles, switchProjectFile,
} from '../core/store/project-files';
import { Ic } from './icons';

const fmtTime = (t: number) => new Date(t).toLocaleString('zh-CN', {
  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
});

async function run(action: () => Promise<string | null | void>) {
  const err = await action();
  if (err) alert(err);
}

export function FileMenu() {
  useTick();
  const [open, setOpen] = useState(false);
  const active = activeProjectFile();
  const files = projectFiles();
  const close = () => setOpen(false);
  const del = () => {
    if (confirm(`删除“${store.project.name}”？此操作不可撤销。`)) {
      run(() => deleteProjectFile(store, active?.id ?? '')).then(close);
    }
  };

  return (
    <div className="dropdown">
      <button className="tb-btn wide file-btn" title="本地方案文件" onClick={() => setOpen(!open)}>
        <Ic n="sample" /><span>{active?.name ?? store.project.name}</span><Ic n="chev" size={14} />
      </button>
      {open && (
        <>
          <div className="dd-backdrop" onClick={close} />
          <div className="dd-menu file-menu">
            <div className="file-menu-title">方案文件</div>
            <div className="file-list">
              {files.map((f) => (
                <button key={f.id} className={`file-item ${f.id === active?.id ? 'on' : ''}`}
                  onClick={() => run(() => switchProjectFile(store, f.id)).then(close)}>
                  <span className="file-name">{f.name}</span>
                  <span className="file-time">{fmtTime(f.updatedAt)}</span>
                </button>
              ))}
            </div>
            <div className="dd-sep" />
            <button className="dd-item" onClick={() => run(() => createProjectFile(store)).then(close)}>
              <Ic n="sample" size={15} /><span>新建空白方案</span>
            </button>
            <button className="dd-item" onClick={() => run(() => duplicateProjectFile(store)).then(close)}>
              <Ic n="copy" size={15} /><span>复制当前方案</span>
            </button>
            <button className="dd-item danger" onClick={del}>
              <Ic n="trash" size={15} /><span>删除当前方案</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
