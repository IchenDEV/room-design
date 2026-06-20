import { useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { signInOAuth, signInPassword, signUpPassword, validateUsername } from '../core/auth/auth';
import { isSupabaseConfigured } from '../core/supabase/client';
import { toastErr, toastOk } from './toast';
import { Ic } from './icons';

type Tab = 'signin' | 'signup';

export function AuthModal() {
  useTick();
  if (store.ui.modal !== 'auth') return null;
  return <AuthBody />;
}

function AuthBody() {
  const [tab, setTab] = useState<Tab>('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [pwd, setPwd] = useState('');
  const [busy, setBusy] = useState(false);
  const close = () => store.patchUI({ modal: null });

  const submit = async () => {
    if (pwd.length < 6) { toastErr('请输入至少 6 位密码'); return; }
    if (!isSupabaseConfigured) { toastErr('未配置 Supabase，无法登录'); return; }
    if (tab === 'signin' && !identifier.trim()) { toastErr('请输入用户名或邮箱'); return; }
    if (tab === 'signup') {
      const nameErr = validateUsername(username);
      if (nameErr) { toastErr(nameErr); return; }
      if (!email.trim()) { toastErr('请输入邮箱'); return; }
    }
    setBusy(true);
    const err = tab === 'signin'
      ? await signInPassword(identifier.trim(), pwd)
      : await signUpPassword(username.trim(), email.trim(), pwd);
    setBusy(false);
    if (err) { toastErr(err); return; }
    if (tab === 'signup') toastOk('注册成功，请查收验证邮件');
    else { toastOk('登录成功'); close(); }
  };

  const oauth = async (p: 'google' | 'github') => {
    if (!isSupabaseConfigured) { toastErr('未配置 Supabase，无法登录'); return; }
    const err = await signInOAuth(p);
    if (err) toastErr(err);
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <b>{tab === 'signin' ? '登录栖居' : '注册账号'}</b>
          <button className="tb-btn" title="关闭" onClick={close}><Ic n="close" /></button>
        </div>
        <div className="modal-body">
          <div className="auth-tabs">
            <button className={`seg-btn ${tab === 'signin' ? 'on' : ''}`} onClick={() => setTab('signin')}>登录</button>
            <button className={`seg-btn ${tab === 'signup' ? 'on' : ''}`} onClick={() => setTab('signup')}>注册</button>
          </div>
          {tab === 'signin' ? (
            <input className="text-input" placeholder="用户名或邮箱" value={identifier}
              onChange={(e) => setIdentifier(e.target.value)} autoFocus />
          ) : (
            <>
              <input className="text-input" placeholder="用户名" value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())} autoFocus />
              <input className="text-input" type="email" placeholder="邮箱" value={email}
                onChange={(e) => setEmail(e.target.value)} />
            </>
          )}
          <input className="text-input" type="password" placeholder="密码（至少 6 位）" value={pwd}
            onChange={(e) => setPwd(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
          <button className="btn auth-primary" disabled={busy} onClick={submit}>
            {busy ? '处理中…' : tab === 'signin' ? '登录' : '注册'}
          </button>
          <div className="auth-or"><span>或</span></div>
          <button className="btn auth-oauth" onClick={() => oauth('google')}>
            <OAuthMark kind="g" />使用 Google 继续
          </button>
          <button className="btn auth-oauth" onClick={() => oauth('github')}>
            <OAuthMark kind="gh" />使用 GitHub 继续
          </button>
          <p className="auth-note">登录后可云端同步方案、跨设备编辑与多人协作。</p>
        </div>
      </div>
    </div>
  );
}

function OAuthMark({ kind }: { kind: 'g' | 'gh' }) {
  if (kind === 'gh') return <span className="oauth-mark gh" />;
  return (
    <span className="oauth-mark g">
      <span style={{ background: '#ea4335' }} />
      <span style={{ background: '#fbbc05' }} />
      <span style={{ background: '#34a853' }} />
      <span style={{ background: '#4285f4' }} />
    </span>
  );
}
