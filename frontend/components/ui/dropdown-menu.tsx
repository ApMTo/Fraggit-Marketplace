'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const DropdownCloseContext = createContext<(() => void) | null>(null);

type DropdownMenuProps = {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  /** Compact menu trigger (default) or full-width form field. */
  variant?: 'default' | 'field' | 'bare';
  size?: 'default' | 'sm';
  showChevron?: boolean;
  hasError?: boolean;
  disabled?: boolean;
  id?: string;
  triggerClassName?: string;
};

export function DropdownMenu({
  trigger,
  children,
  align = 'end',
  className = '',
  variant = 'default',
  size = 'default',
  showChevron = true,
  hasError = false,
  disabled = false,
  id,
  triggerClassName,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const isField = variant === 'field';
  const isBare = variant === 'bare';
  const isSm = size === 'sm';

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  return (
    <div
      ref={rootRef}
      className={cn('relative', isField && 'w-full', className)}
    >
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-invalid={hasError || undefined}
        onClick={() => {
          if (!disabled) {
            setOpen((value) => !value);
          }
        }}
        className={cn(
          'inline-flex cursor-pointer items-center text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50',
          isField
            ? cn(
                'h-11 w-full justify-between gap-1.5 rounded-[var(--radius-sm)] border bg-input px-4 transition-[border-color,box-shadow,background-color] duration-200 ease-out focus-visible:border-primary focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--blue-a24)]',
                hasError
                  ? 'border-destructive focus-visible:shadow-none'
                  : 'border-input-border',
              )
            : isBare
              ? 'border-0 bg-transparent p-0 shadow-none'
              : cn(
                  'dropdown-trigger',
                  isSm
                    ? 'h-9 gap-1 px-2.5 text-xs'
                    : 'h-9 gap-1.5 px-3 text-sm',
                ),
          triggerClassName,
        )}
      >
        <span className={cn('min-w-0', isField && 'truncate text-left')}>
          {trigger}
        </span>
        {showChevron ? (
          <ChevronDown
            className={cn(
              'shrink-0 text-muted transition-transform',
              isSm ? 'size-3.5' : 'size-4',
              open && 'rotate-180',
            )}
          />
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'dropdown-panel absolute z-50 overflow-hidden p-1.5',
            isField
              ? 'top-[calc(100%+0.5rem)] left-0 w-full'
              : cn(
                  'top-[calc(100%+0.75rem)] min-w-[10rem]',
                  align === 'end' ? 'right-0' : 'left-0',
                ),
          )}
        >
          <div className="max-h-64 overflow-y-auto">
            <DropdownCloseContext.Provider value={close}>
              {children}
            </DropdownCloseContext.Provider>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type DropdownItemProps = {
  children: ReactNode;
  onSelect: () => void;
  isActive?: boolean;
};

export function DropdownItem({
  children,
  onSelect,
  isActive = false,
}: DropdownItemProps) {
  const close = useContext(DropdownCloseContext);

  return (
    <button
      type="button"
      role="menuitem"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
        close?.();
      }}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-[background-color,color] duration-300',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground hover:bg-surface-hover',
      )}
    >
      {children}
    </button>
  );
}
