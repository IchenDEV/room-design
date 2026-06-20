import { useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import {
  activeProjectFile, createProjectFile, deleteProjectFile,
  duplicateProjectFile, projectFiles, switchProjectFile,
} from '../core/store/files';
import { isCloudActive } from '../core/collab/sync-status';
import { createSnapshot } from '../core/cloud/snapshots';
import { Ic } from './icons';
import { toastErr, toastOk } from './toast';

const fmtTime = (t: number) => new Date(t).toLocaleString('zh-CN', {
  month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
});

async function run(action: () => Promise<string | null | void>) {
  const err = await action();
  if (err) toastErr(err);
}

export function FileMenu() {
  useTick();
  const [open, setOpen] = useState(false);
  const active = activeProjectFile();
  const files = projectFiles();
  const cloud = isCloudActive();
  const close = () => setOpen(false);
  const del = () => {
    if (confirm(`删除“${store.project.name}”？${cloud ? '云端与本地均会移除。' : '此操作不可撤销。'}`)) {
      run(() => deleteProjectFile(store, active?.id ?? '')).then(close);
    }
  };
  const saveVer = () => {
    const meta = activeProjectFile();
    if (!meta?.cloudId) return;
    const name = `${store.project.name} ${new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}`;
    createSnapshot(meta.cloudId, name, store.project)
      .then(() => { toastOk('已保存版本快照'); close(); })
      .catch((e) => toastErr(e instanceof Error ? e.message : String(e)));
  };

  return (
    <div className="dropdown">
      <button className="tb-btn wide file-btn" title={cloud ? '云端方案文件' : '本地方案文件'} onClick={() => setOpen(!open)}>
        <Ic n={cloud ? 'cloud' : 'sample'} size={15} />
        <span>{active?.name ?? store.project.name}</span>
        <Ic n="chev" size={14} />
      </button>
      {open && (
        <>
          <div className="dd-backdrop" onClick={close} />
          <div className="dd-menu file-menu">
            <div className="file-menu-title">{cloud ? '云端方案' : '本地方案'}</div>
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
            {cloud && <button className="dd-item" onClick={saveVer}>
              <Ic n="sync" size={15} /><span>保存版本快照</span>
            </button>}
            <button className="dd-item danger" onClick={del}>
              <Ic n="trash" size={15} /><span>删除当前方案</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
