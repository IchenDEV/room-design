import {
  cloneElement,
  isValidElement,
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';

type DropdownProps = {
  children: ReactNode;
  menuClassName?: string;
  onClose: () => void;
  open: boolean;
  trigger: ReactNode;
};

type TriggerProps = {
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
  'aria-controls'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu';
};

export function Dropdown({ children, menuClassName, onClose, open, trigger }: DropdownProps) {
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const focusTrigger = () => {
    rootRef.current?.querySelector<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')?.focus();
  };
  const focusFirstItem = () => {
    menuRef.current?.querySelector<HTMLElement>(
      'button:not(:disabled), [href], input, select, [tabindex]:not([tabindex="-1"])',
    )?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        focusTrigger();
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusFirstItem();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const triggerEl = isValidElement<TriggerProps>(trigger)
    ? cloneElement(trigger as ReactElement<TriggerProps>, {
      'aria-controls': open ? menuId : undefined,
      'aria-expanded': open,
      'aria-haspopup': true,
      onKeyDown: (event) => {
        trigger.props.onKeyDown?.(event);
        if (!open || event.defaultPrevented) return;
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          focusFirstItem();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      },
    })
    : trigger;

  return (
    <div className="dropdown" ref={rootRef}>
      {triggerEl}
      {open && (
        <>
          <div className="dd-backdrop" onMouseDown={onClose} />
          <div className={['dd-menu', menuClassName].filter(Boolean).join(' ')}
            id={menuId} ref={menuRef}>{children}</div>
        </>
      )}
    </div>
  );
}
