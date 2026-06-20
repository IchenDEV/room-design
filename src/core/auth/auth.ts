import { supabase, isSupabaseConfigured } from '../supabase/client';
import type { UserProfile } from './types';

const COLORS = ['#4f8cff', '#4ecf8a', '#f5a623', '#e36a6a', '#a259ff', '#22b8cf', '#f56684'];

function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function isAuthReady(): boolean { return isSupabaseConfigured; }

/** 邮箱密码注册 */
export async function signUpEmail(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signUp({ email, password });
  return error?.message ?? null;
}

/** 邮箱密码登录 */
export async function signInEmail(email: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

/** OAuth 登录（google / github），跳转 Supabase 统一回调 */
export async function signInOAuth(provider: 'google' | 'github'): Promise<string | null> {
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
    .from('profiles').select('id,display_name,avatar_url,color').eq('id', userId).maybeSingle();
  if (!data) return { id: userId, email, displayName: email.split('@')[0] || '我', avatarUrl: null, color: colorFor(userId) };
  return {
    id: data.id, email,
    displayName: data.display_name || email.split('@')[0] || '我',
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
