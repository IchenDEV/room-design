import { useState } from 'react';
import { store } from '../core/store/store';
import { useTick } from '../core/store/react';
import { signInOAuth, signInPassword, signUpPassword, validateUsername } from '../core/auth/auth';
import { isSupabaseConfigured } from '../core/supabase/client';
import { toastErr, toastOk } from './toast';
import { ModalShell } from './ModalShell';

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
    <ModalShell className="auth-modal" onClose={close} title={tab === 'signin' ? '登录栖居' : '注册账号'}>
      <div className="auth-tabs">
        <button className={`seg-btn ${tab === 'signin' ? 'on' : ''}`} onClick={() => setTab('signin')}>登录</button>
        <button className={`seg-btn ${tab === 'signup' ? 'on' : ''}`} onClick={() => setTab('signup')}>注册</button>
      </div>
      {tab === 'signin' ? (
        <>
          <label className="sr-only" htmlFor="auth-identifier">用户名或邮箱</label>
          <input autoComplete="username" className="text-input" id="auth-identifier"
            placeholder="用户名或邮箱" value={identifier}
            onChange={(e) => setIdentifier(e.target.value)} autoFocus />
        </>
      ) : (
        <>
          <label className="sr-only" htmlFor="auth-username">用户名</label>
          <input autoComplete="username" className="text-input" id="auth-username"
            placeholder="用户名" value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())} autoFocus />
          <label className="sr-only" htmlFor="auth-email">邮箱</label>
          <input autoComplete="email" className="text-input" id="auth-email" type="email"
            placeholder="邮箱" value={email} onChange={(e) => setEmail(e.target.value)} />
        </>
      )}
      <label className="sr-only" htmlFor="auth-password">密码</label>
      <input autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
        className="text-input" id="auth-password" type="password" placeholder="密码（至少 6 位）"
        value={pwd} onChange={(e) => setPwd(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
      <button aria-busy={busy} className="btn auth-primary" disabled={busy} onClick={submit}>
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
    </ModalShell>
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
