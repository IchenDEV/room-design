import { idbGet, idbSet, idbDel } from '../store/idb';

const PREFIX = 'ydoc:';

/** 读取本地缓存的 ydoc 字节（离线兜底） */
export async function readCachedYDoc(projectId: string): Promise<Uint8Array | null> {
  const raw = await idbGet<Uint8Array>(PREFIX + projectId);
  return raw ?? null;
}

/** 写入本地缓存的 ydoc（联网时由 provider 调用） */
export async function writeCachedYDoc(projectId: string, bytes: Uint8Array): Promise<void> {
  try { await idbSet(PREFIX + projectId, bytes); } catch { /* 配额或隐私模式，忽略 */ }
}

/** 删除本地缓存（项目删除时清理） */
export async function deleteCachedYDoc(projectId: string): Promise<void> {
  try { await idbDel(PREFIX + projectId); } catch { /* ignore */ }
}
