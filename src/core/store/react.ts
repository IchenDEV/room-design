import { useSyncExternalStore } from 'react';
import { store } from './store';
import type { EventName } from './store';

const EVENTS: EventName[] = ['change', 'sel', 'ui', 'saved', 'project', 'auth', 'toast'];

function subscribe(cb: () => void): () => void {
  const offs = EVENTS.map((ev) => store.on(ev, cb));
  return () => offs.forEach((off) => off());
}

/** 订阅 store 所有事件：任何变化触发重渲染 */
export function useTick(): number {
  return useSyncExternalStore(subscribe, () => store.version);
}
