import { store } from '../core/store/store';

export type ToastType = 'info' | 'success' | 'error' | 'warn';
export interface Toast { id: number; msg: string; type: ToastType }

let nextId = 1;
const toasts = new Map<number, Toast>();

function emit() { store.emit('toast'); }

/** 推送一条非阻塞提示，3.5s 后自动消失 */
export function toast(msg: string, type: ToastType = 'info'): number {
  const id = nextId++;
  toasts.set(id, { id, msg, type });
  emit();
  setTimeout(() => dismiss(id), 3500);
  return id;
}

export function dismiss(id: number): void {
  if (toasts.delete(id)) emit();
}

export const allToasts = (): Toast[] => [...toasts.values()];

export const toastInfo = (m: string) => toast(m, 'info');
export const toastOk = (m: string) => toast(m, 'success');
export const toastErr = (m: string) => toast(m, 'error');
export const toastWarn = (m: string) => toast(m, 'warn');
