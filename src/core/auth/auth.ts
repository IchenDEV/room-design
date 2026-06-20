import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { UserProfile } from './types';
import { rememberInviteToken } from '../invite-link';

const COLORS = ['#4f8cff', '#4ecf8a', '#f5a623', '#e36a6a', '#a259ff', '#22b8cf', '#f56684'];
const USERNAME_RE = /^[a-z0-9_]{3,24}$/;

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function isAuthReady(): boolean { return isSupabaseConfigured; }

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (!USERNAME_RE.test(normalized)) return '用户名需为 3-24 位小写字母、数字或下划线';
  return null;
}

/** 用户名 + 邮箱 + 密码注册；Supabase Auth 仍使用邮箱保存凭证 */
export async function signUpPassword(username: string, email: string, password: string): Promise<string | null> {
  const normalized = normalizeUsername(username);
  const nameErr = validateUsername(normalized);
  if (nameErr) return nameErr;

  const { data: available, error: lookupError } = await supabase.rpc('is_username_available', {
    p_username: normalized,
  });
  if (lookupError) return lookupError.message;
  if (!available) return '用户名已被占用';

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username: normalized, display_name: normalized } },
  });
  return error?.message ?? null;
}

/** 用户名或邮箱 + 密码登录 */
export async function signInPassword(identifier: string, password: string): Promise<string | null> {
  const login = identifier.trim();
  let email = login;
  if (!login.includes('@')) {
    const nameErr = validateUsername(login);
    if (nameErr) return nameErr;
    const { data, error } = await supabase.rpc('email_for_username', {
      p_username: normalizeUsername(login),
    });
    if (error) return error.message;
    if (!data) return '用户名不存在';
    email = data as string;
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

/** OAuth 登录（google / github），跳转 Supabase 统一回调 */
export async function signInOAuth(provider: 'google' | 'github'): Promise<string | null> {
  rememberInviteToken();
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  return error?.message ?? null;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** 读取当前会话（含 PKCE 回跳 exchange） */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthChange(cb: (userId: string | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => {
    cb(session?.user?.id ?? null);
  });
  return () => data.subscription.unsubscribe();
}

/** 拉取用户档案；profile 未生成时用邮箱兜底 */
export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data: u } = await supabase.auth.getUser();
  const email = u.user?.email ?? '';
  const { data } = await supabase
    .from('profiles').select('id,username,display_name,avatar_url,color').eq('id', userId).maybeSingle();
  if (!data) {
    const fallback = email.split('@')[0] || '我';
    return { id: userId, email, username: null, displayName: fallback, avatarUrl: null, color: colorFor(userId) };
  }
  const name = data.display_name || data.username || email.split('@')[0] || '我';
  return {
    id: data.id, email, username: data.username,
    displayName: name,
    avatarUrl: data.avatar_url,
    color: data.color || colorFor(userId),
  };
}

/** 更新自己的档案（昵称 / 头像色） */
export async function updateProfile(updates: { display_name?: string; color?: string }): Promise<string | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return '未登录';
  const { error } = await supabase.from('profiles').update(updates).eq('id', u.user.id);
  return error?.message ?? null;
}
