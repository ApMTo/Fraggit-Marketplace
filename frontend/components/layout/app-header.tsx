'use client';

import { useTranslations } from 'next-intl';
import { AppNavLinks } from '@/components/layout/app-nav-links';
import { HeaderPreferences } from '@/components/layout/header-preferences';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/layout/logo';
import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import { useAuth } from '@/providers/AuthProvider';

export function AppHeader() {
  const t = useTranslations('auth');
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-4 px-5">
        <Logo />

        <nav
          aria-label="Main"
          className="hidden items-center gap-1 md:flex lg:gap-2"
        >
          <AppNavLinks orientation="horizontal" />
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
            <HeaderPreferences />

            {isLoading ? (
              <span className="size-8 animate-pulse rounded-[var(--radius-md)] bg-surface-elevated" />
            ) : isAuthenticated ? (
              <UserMenu />
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
          </div>

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
