'use client';

import { LogOut, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { HeaderPreferences } from '@/components/layout/header-preferences';
import { Logo } from '@/components/layout/logo';
import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';

export function AppHeader() {
  const t = useTranslations('auth');
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />

        <nav className="flex items-center gap-2 sm:gap-3">
          <HeaderPreferences />

          {isLoading ? (
            <span className="size-8 animate-pulse rounded-full bg-surface-elevated" />
          ) : isAuthenticated && user ? (
            <>
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-elevated hover:text-foreground sm:flex"
              >
                <UserRound className="size-4 text-brand-cyan" />
                <span>{user.displayName}</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void logout()}
                className="gap-2"
              >
                <LogOut className="size-4" />
                <span className="hidden sm:inline">{t('logout')}</span>
              </Button>
            </>
          ) : (
            <>
              <SecondaryButton href="/register" size="sm">
                {t('register.submit')}
              </SecondaryButton>
              <BrandButton href="/login" size="sm">
                {t('login.submit')}
              </BrandButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
