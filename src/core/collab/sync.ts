import type { CollabProvider } from './provider';
import { openCollab, pushLocalEdit } from './provider';
import { store } from '../store/store';
import { isCloudActive } from './sync-status';
import { activeProjectFile } from '../store/files';

let current: CollabProvider | null = null;
let unsubChange: (() => void) | null = null;

/** 当前是否已建立实时协同会话 */
export function isCollabConnected(): boolean { return !!current; }

/** 打开当前项目的实时协同会话 */
export async function startCollab(): Promise<void> {
  if (current || !isCloudActive()) return;
  const meta = activeProjectFile();
  if (!meta?.cloudId) return;
  current = await openCollab(meta.cloudId);
  // 接管：本地每次非瞬时提交都把改动推入 Yjs → 广播 + 持久化
  unsubChange = store.on('change', (e) => {
    if (e?.transient || !current) return;
    pushLocalEdit(current.doc, store.project);
  });
}

export function stopCollab(): void {
  if (unsubChange) { unsubChange(); unsubChange = null; }
  current?.destroy();
  current = null;
}
