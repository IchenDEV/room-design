import type { PresenceUser } from '../auth/types';
import { store } from '../store/store';

/** 在线协作者列表（含光标），由 provider 写入、PresenceBar / 远端光标层读取 */
const presence = new Map<string, PresenceUser>();
let version = 0;

export function setPresence(list: PresenceUser[]): void {
  presence.clear();
  for (const u of list) if (u.id !== store.user?.id) presence.set(u.id, u);
  version++;
  store.emit('ui');
}

export function getPresence(): PresenceUser[] {
  return [...presence.values()];
}

export function presenceVersion(): number {
  return version;
}

/** 本地用户的感知信息（光标 + 身份），供 provider 广播 */
export function localAwareness(cursor: { x: number; y: number } | null): PresenceUser | null {
  const u = store.user;
  if (!u) return null;
  return { id: u.id, name: u.displayName, color: u.color, cursor };
}
