import { useSyncExternalStore } from 'react';
import { store } from './store';
import type { EventName } from './store';

const EVENTS: EventName[] = ['change', 'sel', 'ui', 'saved', 'project', 'auth', 'toast'];

function subscribe(cb: () => void): () => void {
  const offs = EVENTS.map((ev) => store.on(ev, cb));
  return () => offs.forEach((off) => off());
}

const subscribeUI = (cb: () => void): (() => void) => store.on('ui', cb);

/** 订阅 store 所有事件：任何变化触发重渲染 */
export function useTick(): number {
  return useSyncExternalStore(subscribe, () => store.version);
}

/** 仅订阅 UI 事件：用于画布舞台这类不依赖工程数据的组件 */
export function useUiTick(): number {
  return useSyncExternalStore(subscribeUI, () => store.version);
}
