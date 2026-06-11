import type { Store } from './store';
import type { Project } from '../types';

const DB_NAME = 'qiju-studio';
const OS = 'kv';
const KEY = 'project:current';
let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const rq = indexedDB.open(DB_NAME, 1);
      rq.onupgradeneeded = () => rq.result.createObjectStore(OS);
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
  }
  return dbp;
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  const d = await db();
  return new Promise((res, rej) => {
    const rq = d.transaction(OS, 'readonly').objectStore(OS).get(key);
    rq.onsuccess = () => res(rq.result as T | undefined);
    rq.onerror = () => rej(rq.error);
  });
}

export async function idbSet(key: string, val: unknown): Promise<void> {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction(OS, 'readwrite');
    tx.objectStore(OS).put(val, key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

export function isValidProject(p: unknown): p is Project {
  const x = p as Project;
  return !!x && x.version === 1 && Array.isArray(x.walls) && Array.isArray(x.openings)
    && Array.isArray(x.items) && Array.isArray(x.roomMetas) && !!x.settings;
}

/** 启动恢复 + 编辑实时（防抖 300ms）写入 IndexedDB */
export async function initPersist(store: Store) {
  try {
    const raw = await idbGet<string>(KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (isValidProject(p)) store.hydrate(p);
    }
  } catch { /* 容错：损坏数据直接忽略 */ }
  store.patchUI({ hydrated: true });

  let timer: ReturnType<typeof setTimeout> | null = null;
  const flush = () => {
    timer = null;
    idbSet(KEY, store.snapshot()).then(() => store.emit('saved')).catch(() => {});
  };
  store.on('change', (e) => {
    if (e?.transient) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 300);
  });
}
