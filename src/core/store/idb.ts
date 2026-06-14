const DB_NAME = 'qiju-studio';
const OS = 'kv';
let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (!dbp) dbp = new Promise((res, rej) => {
    const rq = indexedDB.open(DB_NAME, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore(OS);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
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

export async function idbDel(key: string): Promise<void> {
  const d = await db();
  return new Promise((res, rej) => {
    const tx = d.transaction(OS, 'readwrite');
    tx.objectStore(OS).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
