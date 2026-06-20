import * as Y from 'yjs';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';
import { store } from '../store/store';
import { bytesFromBytea, projectFromYDoc, seedYDocFromProject } from './ydoc';
import { setPresence, localAwareness } from './awareness';
import { setSync } from './sync-status';
import { saveCloudProject } from '../cloud/projects';
import { readCachedYDoc, writeCachedYDoc } from './offline';
import type { Project } from '../types';

/** 本地 origin 标记：本地产生的 Yjs 事务不触发回环广播 */
const LOCAL = 'local';
type UpdateMsg = { type: 'update'; payload: number[] };
type AwareMsg = { type: 'aware'; user: ReturnType<typeof localAwareness> };

export interface CollabProvider {
  doc: Y.Doc;
  destroy: () => void;
}

/**
 * 打开一个项目的实时协同会话：
 * 1. 拉云端 ydoc 初始化本地 Y.Doc
 * 2. 接入 Realtime broadcast 频道收发更新
 * 3. Presence 广播光标 / 在线成员
 * 4. 本地 doc 变更防抖回写云端
 */
export async function openCollab(projectId: string): Promise<CollabProvider> {
  const doc = new Y.Doc();
  setSync('syncing');

  // 初始加载：云端 ydoc → 本地 doc；云端无则尝试离线缓存；都无则用当前 store 播种
  const { data } = await supabase.from('projects').select('ydoc').eq('id', projectId).maybeSingle();
  const cloudBytes = bytesFromBytea(data?.ydoc);
  if (cloudBytes && cloudBytes.length) {
    Y.applyUpdate(doc, cloudBytes);
  } else {
    const cached = await readCachedYDoc(projectId);
    if (cached && cached.length) Y.applyUpdate(doc, cached);
    else seedYDocFromProject(doc, store.project);
  }
  syncStoreFromDoc(doc);

  const channel: RealtimeChannel = supabase.channel(`yjs:${projectId}`, {
    config: { private: true, broadcast: { self: false }, presence: { key: store.user?.id ?? 'anon' } },
  });

  // doc 更新统一处理：远端→同步镜像+持久化；本地→广播给他人
  doc.on('update', (update: Uint8Array, origin: unknown) => {
    if (origin === LOCAL) {
      channel.send({ type: 'broadcast', event: 'y', payload: { type: 'update', payload: [...update] } });
    } else {
      syncStoreFromDoc(doc);
      schedulePersist(projectId, doc);
    }
  });

  channel
    .on('broadcast', { event: 'y' }, ({ payload }) => {
      const msg = payload as UpdateMsg | AwareMsg;
      if (msg.type === 'update') {
        doc.transact(() => Y.applyUpdate(doc, new Uint8Array(msg.payload)), 'remote');
      } else if (msg.type === 'aware' && msg.user) {
        mergePresence(msg.user);
      }
    })
    .on('presence', { event: 'sync' }, () => refreshPresence(channel))
    .on('presence', { event: 'join' }, () => refreshPresence(channel))
    .on('presence', { event: 'leave' }, () => refreshPresence(channel))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        const me = localAwareness(null);
        if (me) channel.track(me);
        setSync('synced');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setSync('offline', '实时连接断开');
      }
    });

  return {
    doc,
    destroy: () => {
      flushPersist(projectId, doc);
      supabase.removeChannel(channel);
      doc.destroy();
    },
  };
}

/** 把本地一次修改推入 Yjs（实体级整体覆盖，Phase 3 v1） */
export function pushLocalEdit(doc: Y.Doc, project: Project): void {
  doc.transact(() => seedYDocFromProject(doc, project), LOCAL);
}

function syncStoreFromDoc(doc: Y.Doc): void {
  const p = projectFromYDoc(doc);
  store.project = p;
  store.recompute();
  store.emit('change');
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(projectId: string, doc: Y.Doc): void {
  if (persistTimer) clearTimeout(persistTimer);
  setSync('syncing');
  persistTimer = setTimeout(() => flushPersist(projectId, doc), 1500);
}
function flushPersist(projectId: string, doc: Y.Doc): void {
  if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
  const bytes = Y.encodeStateAsUpdate(doc);
  // 离线缓存即时写入（兜底），云端写入异步
  writeCachedYDoc(projectId, bytes).catch(() => {});
  saveCloudProject(projectId, projectFromYDoc(doc))
    .then(() => setSync('synced'))
    .catch((e) => setSync('error', e instanceof Error ? e.message : String(e)));
}

let presenceBuf: ReturnType<typeof localAwareness>[] = [];
function mergePresence(u: NonNullable<ReturnType<typeof localAwareness>>): void {
  presenceBuf = presenceBuf.filter((p) => p && p.id !== u.id).concat([u]);
  setPresence(presenceBuf.filter((p): p is NonNullable<typeof p> => !!p));
}
function refreshPresence(channel: RealtimeChannel): void {
  const state = channel.presenceState();
  const list = Object.values(state).map((s: any) => s[0]).filter(Boolean);
  setPresence(list);
}
