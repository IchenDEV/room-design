import { useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { fetchProfile, updateProfile } from '../core/auth/auth';
import { setUser } from '../core/store/store-user';
import { toastErr, toastOk } from './toast';
import { ModalShell } from './ModalShell';

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

  const handle = u.username ? `@${u.username}` : u.email;
  const initial = (name || u.username || u.email || '?').trim().charAt(0).toUpperCase();

  return (
    <ModalShell className="account-modal-box" onClose={close} title="账号设置">
      <div className="account-preview">
        <span className="account-avatar xl" style={{ background: color }}>{initial}</span>
        <div>
          <b>{name || u.displayName}</b>
          <span className="account-email">{handle}</span>
        </div>
      </div>
      <label className="prop-label" htmlFor="account-display-name">昵称</label>
      <input autoComplete="name" className="text-input" id="account-display-name"
        value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <div className="prop-label" id="account-color-label">协作光标颜色</div>
      <div aria-labelledby="account-color-label" className="swatches" role="group">
        {PALETTE.map((c) => (
          <button key={c} className={`swatch ${c === color ? 'on' : ''}`}
            style={{ background: c }} onClick={() => setColor(c)} aria-label={`选择协作光标颜色 ${c}`} />
        ))}
      </div>
      <div className="btn-row">
        <button className="btn" onClick={close}>取消</button>
        <button aria-busy={busy} className="btn auth-primary" disabled={busy} onClick={save}>
          {busy ? '保存中…' : '保存'}
        </button>
      </div>
    </ModalShell>
  );
}
