'use client';

import { useCallback, useEffect, useId, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, Menu, UserRound, X } from 'lucide-react';
import { AccountNavLinks } from '@/components/layout/account-nav-links';
import { AppNavLinks } from '@/components/layout/app-nav-links';
import { HeaderPreferences } from '@/components/layout/header-preferences';
import { SellNavButton } from '@/components/layout/sell-nav-button';
import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import { Button } from '@/components/ui/button';
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

function MobileMenuContent() {
  const tAuth = useTranslations('auth');
  const tNav = useTranslations('common.nav');
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const close = useCallback(() => setOpen(false), []);

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

  const menu = open ? (
    <>
      <button
        type="button"
        aria-label={tNav('closeMenu')}
        onClick={close}
        className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm"
      />

      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label={tNav('menu')}
        className="fixed inset-y-0 right-0 z-[110] flex w-full flex-col border-l border-border bg-surface text-foreground shadow-[var(--dropdown-shadow)]"
      >
        <div className="flex w-full items-center justify-between border-b border-border px-5 py-4">
          <span className="font-display text-base font-semibold text-foreground">
            {tNav('menu')}
          </span>
          <button
            type="button"
            aria-label={tNav('closeMenu')}
            onClick={close}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted transition-colors duration-300 hover:bg-surface-hover hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="z-50 flex-1 overflow-y-auto px-3 py-4">
          <AppNavLinks onNavigate={close} />

          {isAuthenticated && user ? (
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2 px-3 py-1 text-sm text-foreground">
                <UserRound className="size-4 text-brand-cyan" />
                <span>{user.displayName}</span>
              </div>
              <AccountNavLinks onNavigate={close} />
            </div>
          ) : null}
        </div>

        <div className="space-y-4 border-t border-border bg-surface px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <HeaderPreferences />
            {isAuthenticated ? (
              <SellNavButton onClick={close} />
            ) : null}
          </div>

          {isLoading ? (
            <span className="block h-11 animate-pulse rounded-[var(--radius-sm)] bg-surface-elevated" />
          ) : isAuthenticated && user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                close();
                void logout();
              }}
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" />
              {tAuth('logout')}
            </Button>
          ) : (
            <div className="grid gap-2">
              <SecondaryButton href="/register" size="sm" onClick={close}>
                {tAuth('register.submit')}
              </SecondaryButton>
              <BrandButton href="/login" size="sm" onClick={close}>
                {tAuth('login.submit')}
              </BrandButton>
            </div>
          )}
        </div>
      </div>
    </>
  ) : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={open ? tNav('closeMenu') : tNav('openMenu')}
        onClick={() => setOpen((value) => !value)}
        className="dropdown-trigger inline-flex size-10 cursor-pointer items-center justify-center text-foreground"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {mounted && menu ? createPortal(menu, document.body) : null}
    </div>
  );
}

export function MobileMenu() {
  const pathname = usePathname();

  return <MobileMenuContent key={pathname} />;
}
