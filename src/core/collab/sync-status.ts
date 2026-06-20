import { store } from '../store/store';
import { isSupabaseConfigured } from '../supabase/client';

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncState {
  status: SyncStatus;
  at: number;        // 最后一次状态变更时间戳
  message?: string;  // 错误/离线说明
}

const state: SyncState = { status: 'local', at: Date.now() };

function announce() { store.emit('ui'); }

export function getSyncState(): SyncState { return state; }

export function setSync(status: SyncStatus, message?: string): void {
  state.status = status;
  state.at = Date.now();
  state.message = message;
  announce();
}

/** 初始状态：未配置 Supabase 永远是 local；未登录也是 local */
export function initSyncStatus(): void {
  state.status = 'local';
  announce();
}

export function isCloudActive(): boolean {
  return isSupabaseConfigured && !!store.user;
}
