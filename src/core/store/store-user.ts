import type { Store } from './store';
import { fetchProfile, getSession, onAuthChange } from '../auth/auth';
import type { UserProfile } from '../auth/types';
import { isSupabaseConfigured } from '../supabase/client';
import { hasInviteToken } from '../invite-link';
import { consumeInviteLink, loadLocalProjectFiles } from './persist';
import { activeProjectFile, initProjectFiles } from './files';
import { startCollab, stopCollab } from '../collab/sync';
import { toastErr } from '../../ui/toast';

let appliedUserId: string | null | undefined;

async function applyUser(store: Store, userId: string | null) {
  if (appliedUserId === userId && !hasInviteToken()) return;
  appliedUserId = userId;
  // 登出：先断开协作，再清用户态
  if (!userId) {
    stopCollab();
    store.user = null;
    await loadLocalProjectFiles(store);
    if (hasInviteToken()) store.patchUI({ modal: 'auth' });
    store.authLoading = false;
    store.emit('auth');
    return;
  }
  // 登录：拉档案 → 兑换邀请（若有）→ 重新加载项目列表 → 启动协作
  const profile = await fetchProfile(userId);
  store.user = profile;
  const invite = await consumeInviteLink().catch((e) => ({
    projectId: null,
    error: e instanceof Error ? e.message : String(e),
  }));
  if (invite.error) toastErr(invite.error);
  try {
    await initProjectFiles(store, invite.projectId ?? undefined);
    if (invite.projectId && !location.hash.startsWith('#/studio')) location.hash = '#/studio';
    const meta = activeProjectFile();
    if (meta?.cloudId) await startCollab(meta.cloudId);
  } catch { /* 未配置或加载失败由 files.ts 处理 */ }
  store.patchUI({ hydrated: true });
  store.authLoading = false;
  store.emit('auth');
}

/**
 * 启动认证：处理 PKCE 回跳 → 拉取初始会话 → 订阅登录/登出变化 → 同步 store.user。
 * 未配置 Supabase 时直接标记为完成（纯本地模式）。
 */
export function initAuth(store: Store): () => void {
  if (!isSupabaseConfigured) {
    loadLocalProjectFiles(store).finally(() => {
      store.authLoading = false;
      store.emit('auth');
    });
    return () => {};
  }
  getSession().then((s) => applyUser(store, s?.user?.id ?? null));
  const off = onAuthChange((userId) => applyUser(store, userId));
  return off;
}

export function setUser(store: Store, user: UserProfile | null) {
  store.user = user;
  store.emit('auth');
}
