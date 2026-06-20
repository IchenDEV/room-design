import { useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { fetchProfile, updateProfile } from '../core/auth/auth';
import { setUser } from '../core/store/store-user';
import { toastErr, toastOk } from './toast';
import { Ic } from './icons';

const PALETTE = ['#4f8cff', '#4ecf8a', '#f5a623', '#e36a6a', '#a259ff', '#22b8cf', '#f56684'];

export function AccountModal() {
  useTick();
  if (store.ui.modal !== 'account' || !store.user) return null;
  return <AccountBody />;
}

function AccountBody() {
  const u = store.user!;
  const [name, setName] = useState(u.displayName);
  const [color, setColor] = useState(u.color);
  const [busy, setBusy] = useState(false);
  const close = () => store.patchUI({ modal: null });

  const save = async () => {
    setBusy(true);
    const err = await updateProfile({ display_name: name.trim() || u.displayName, color });
    if (err) { toastErr(err); setBusy(false); return; }
    const fresh = await fetchProfile(u.id);
    if (fresh) setUser(store, fresh);
    setBusy(false);
    toastOk('已保存');
    close();
  };

  const initial = (name || u.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal account-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>账号设置</b>
          <button className="tb-btn" title="关闭" onClick={close}><Ic n="close" /></button>
        </div>
        <div className="modal-body">
          <div className="account-preview">
            <span className="account-avatar xl" style={{ background: color }}>{initial}</span>
            <div>
              <b>{name || u.displayName}</b>
              <span className="account-email">{u.email}</span>
            </div>
          </div>
          <label className="prop-label">昵称</label>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <label className="prop-label">协作光标颜色</label>
          <div className="swatches">
            {PALETTE.map((c) => (
              <button key={c} className={`swatch ${c === color ? 'on' : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} aria-label={c} />
            ))}
          </div>
          <div className="btn-row">
            <button className="btn" onClick={close}>取消</button>
            <button className="btn auth-primary" disabled={busy} onClick={save}>
              {busy ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
