import type { Store } from './store';
import { bindProjectFilePersistence, initProjectFiles } from './files';
import { consumeShareLink } from '../share';
import { initSyncStatus } from '../collab/sync-status';
import { redeemInvite } from '../cloud/invites';
import { toastErr, toastOk } from '../../ui/toast';
export { isValidProject } from './files';

function currentInviteToken(): string | null {
  const hash = location.hash.slice(1);
  const q = hash.indexOf('?');
  if (q < 0) return null;
  return new URLSearchParams(hash.slice(q + 1)).get('invite');
}
function clearInviteToken(): void {
  const hash = location.hash.slice(1);
  const q = hash.indexOf('?');
  if (q < 0) return;
  const path = hash.slice(0, q) || '/studio';
  const params = new URLSearchParams(hash.slice(q + 1));
  if (!params.has('invite')) return;
  params.delete('invite');
  const next = new URL(location.href);
  const query = params.toString();
  next.hash = `${path}${query ? `?${query}` : ''}`;
  history.replaceState(null, '', next);
}

/** 兑换 URL 中的邀请 token，加入项目。返回错误信息（成功为 null）。 */
export async function consumeInviteLink(): Promise<string | null> {
  const token = currentInviteToken();
  if (!token) return null;
  clearInviteToken();
  try {
    await redeemInvite(token);
    toastOk('已加入协作项目');
    return null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return `加入协作失败：${msg}`;
  }
}

/** 启动恢复 + 编辑实时（本地防抖 300ms / 云端防抖 1s）写入 */
export async function initPersist(store: Store) {
  initSyncStatus();
  await initProjectFiles(store);
  const shareErr = await consumeShareLink(store);
  store.patchUI({ hydrated: true });
  bindProjectFilePersistence(store);
  if (shareErr) setTimeout(() => toastErr(shareErr), 0);
}
