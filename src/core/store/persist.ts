import type { Store } from './store';
import { bindProjectFilePersistence, initProjectFiles } from './files';
import { consumeShareLink } from '../share';
import { initSyncStatus } from '../collab/sync-status';
import { redeemInvite } from '../cloud/invites';
import { consumeInviteToken } from '../invite-link';
import { toastErr, toastOk } from '../../ui/toast';
export { isValidProject } from './files';

export interface InviteConsumeResult { projectId: string | null; error: string | null }

/** 兑换 URL 中的邀请 token，加入项目。返回错误信息（成功为 null）。 */
export async function consumeInviteLink(): Promise<InviteConsumeResult> {
  const token = consumeInviteToken();
  if (!token) return { projectId: null, error: null };
  try {
    const projectId = await redeemInvite(token);
    toastOk('已加入协作项目');
    return { projectId, error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { projectId: null, error: `加入协作失败：${msg}` };
  }
}

let bound = false;

export async function loadLocalProjectFiles(store: Store): Promise<void> {
  await initProjectFiles(store);
  const shareErr = await consumeShareLink(store);
  store.patchUI({ hydrated: true });
  if (shareErr) setTimeout(() => toastErr(shareErr), 0);
}

/** 启动编辑实时（本地防抖 300ms / 云端防抖 1s）写入；项目加载由认证状态决定。 */
export function initPersist(store: Store) {
  initSyncStatus();
  if (bound) return;
  bound = true;
  bindProjectFilePersistence(store);
}
