/** 事件总线：store 继承它并重写 emit 以累加 version（供 useSyncExternalStore 订阅） */
export type EventName =
  | 'change' | 'sel' | 'ui' | 'saved' | 'project'
  | 'auth' | 'toast';

export interface ChangeInfo { transient?: boolean }
export type Listener = (e?: ChangeInfo) => void;

export class Emitter {
  private listeners = new Map<EventName, Set<Listener>>();

  on(ev: EventName, fn: Listener): () => void {
    if (!this.listeners.has(ev)) this.listeners.set(ev, new Set());
    this.listeners.get(ev)!.add(fn);
    return () => { this.listeners.get(ev)?.delete(fn); };
  }

  protected fire(ev: EventName, e?: ChangeInfo) {
    this.listeners.get(ev)?.forEach((fn) => fn(e));
  }
}
