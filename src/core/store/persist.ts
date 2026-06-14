import type { Store } from './store';
import { bindProjectFilePersistence, initProjectFiles } from './project-files';
export { isValidProject } from './project-files';

/** 启动恢复 + 编辑实时（防抖 300ms）写入 IndexedDB */
export async function initPersist(store: Store) {
  await initProjectFiles(store);
  store.patchUI({ hydrated: true });
  bindProjectFilePersistence(store);
}
