import { createPortal } from 'react-dom';
import { useTick } from '../core/store/react';
import { allToasts, dismiss, type ToastType } from './toast';

const LABEL: Record<ToastType, string> = {
  info: '提示', success: '成功', error: '错误', warn: '注意',
};

export function Toaster() {
  useTick();
  const list = allToasts();
  if (!list.length) return null;
  return createPortal(
    <div className="toaster" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
          <span className="toast-kind">{LABEL[t.type]}</span>
          <span className="toast-msg">{t.msg}</span>
        </div>
      ))}
    </div>,
    document.body,
  );
}
