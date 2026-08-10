'use client';

import {
  useCallback,
  useEffect,
  useId,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, X } from 'lucide-react';
import {
  getAppNavItems,
  isNavItemActive,
  type AppNavItemId,
} from '@/lib/app-nav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

function subscribeToClient() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

type MobileAccountMenuProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileAccountMenu({ open, onClose }: MobileAccountMenuProps) {
  const tNav = useTranslations('common.nav');
  const tAuth = useTranslations('auth');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const titleId = useId();
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  const close = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  if (!mounted || !open || !user) {
    return null;
  }

  const items = getAppNavItems({
    isAuthenticated: true,
    role: user.role,
    group: 'account',
    username: user.username,
  });

  function goTo(href: string) {
    close();
    router.push(href);
  }

  return createPortal(
    <>
      <button
        type="button"
        aria-label={tNav('closeMenu')}
        onClick={close}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm md:hidden"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-x-0 bottom-0 z-[110] max-h-[min(85dvh,32rem)] overflow-hidden rounded-t-[var(--radius-lg)] border border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-[var(--shadow-lg)] md:hidden"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id={titleId} className="text-sm font-semibold text-foreground">
            {tNav('profile')}
          </h2>
          <button
            type="button"
            aria-label={tNav('closeMenu')}
            onClick={close}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav aria-label={tNav('menu')} className="overflow-y-auto p-2">
          {items.map((item) => (
            <AccountMenuButton
              key={item.id}
              isActive={isNavItemActive(pathname, item.href)}
              onSelect={() => goTo(item.href)}
            >
              {tNav(item.id as AppNavItemId)}
            </AccountMenuButton>
          ))}
          <AccountMenuButton
            onSelect={() => {
              close();
              void logout();
            }}
          >
            <LogOut className="size-4" />
            {tAuth('logout')}
          </AccountMenuButton>
        </nav>
      </div>
    </>,
    document.body,
  );
}

type AccountMenuButtonProps = {
  children: ReactNode;
  onSelect: () => void;
  isActive?: boolean;
};

function AccountMenuButton({
  children,
  onSelect,
  isActive = false,
}: AccountMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-3 py-3 text-left text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground hover:bg-surface-hover',
      )}
    >
      {children}
    </button>
  );
}
