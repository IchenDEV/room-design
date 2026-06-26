import { useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { signOut } from '../core/auth/auth';
import { isSupabaseConfigured } from '../core/supabase/client';
import { toastOk } from './toast';
import { Ic } from './icons';
import { Dropdown } from './Dropdown';

export function AccountMenu() {
  useTick();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const u = store.user;

  if (!isSupabaseConfigured) return null;

  if (!u) {
    return (
      <button className="tb-btn account-signin" title="登录 / 注册"
        onClick={() => store.patchUI({ modal: 'auth' })}>
        <Ic n="user" size={15} /><span>登录</span>
      </button>
    );
  }

  const handle = u.username ? `@${u.username}` : u.email;
  const initial = (u.displayName || u.username || u.email || '?').trim().charAt(0).toUpperCase();
  const out = async () => {
    close();
    await signOut();
    toastOk('已退出登录');
  };

  return (
    <Dropdown
      menuClassName="account-menu"
      onClose={close}
      open={open}
      trigger={<button className="tb-btn account-btn" title={handle} onClick={() => setOpen(!open)}>
        <span className="account-avatar" style={{ background: u.color }}>{initial}</span>
        <span className="account-name">{u.displayName}</span>
        <Ic n="chev" size={13} />
      </button>}
    >
      <div className="account-card">
        <span className="account-avatar lg" style={{ background: u.color }}>{initial}</span>
        <div className="account-meta">
          <b>{u.displayName}</b>
          <span className="account-email">{handle}</span>
        </div>
      </div>
      <div className="dd-sep" />
      <button className="dd-item" onClick={() => { close(); store.patchUI({ modal: 'account' }); }}>
        <Ic n="settings" size={15} /><span>账号设置</span>
      </button>
      <button className="dd-item danger" onClick={out}>
        <Ic n="logout" size={15} /><span>退出登录</span>
      </button>
    </Dropdown>
  );
}
