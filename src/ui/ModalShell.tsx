import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Ic } from './icons';

type ModalShellProps = {
  children: ReactNode;
  className?: string;
  closeTitle?: string;
  onClose: () => void;
  title: ReactNode;
};

export function ModalShell({ children, className, closeTitle = '关闭', onClose, title }: ModalShellProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusId = requestAnimationFrame(() => {
      if (!dialogRef.current?.contains(document.activeElement)) closeRef.current?.focus({ preventScroll: true });
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(focusId);
      document.removeEventListener('keydown', onKey);
      previous?.focus({ preventScroll: true });
    };
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div aria-labelledby={titleId} aria-modal="true" className={['modal', className].filter(Boolean).join(' ')}
        onMouseDown={(e) => e.stopPropagation()} ref={dialogRef} role="dialog">
        <div className="modal-head">
          <b id={titleId}>{title}</b>
          <button aria-label={closeTitle} className="tb-btn" ref={closeRef}
            title={closeTitle} onClick={onClose}><Ic n="close" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
