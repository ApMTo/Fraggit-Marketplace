'use client';

import { useTranslations } from 'next-intl';
import { AppNavLinks } from '@/components/layout/app-nav-links';
import { HeaderCategorySearch } from '@/components/layout/header-category-search';
import { HeaderPreferences } from '@/components/layout/header-preferences';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { SellNavButton } from '@/components/layout/sell-nav-button';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/layout/logo';
import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import { ChatNavIcon } from '@/features/chat/components/chat-nav-icon';
import { NotificationsBell } from '@/features/notifications/components/notifications-bell';
import { useAuth } from '@/providers/AuthProvider';

export function AppHeader() {
  const t = useTranslations('auth');
  const { isAuthenticated, isLoading } = useAuth();
  const showAuthChrome = !isLoading && isAuthenticated;

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex h-16 max-w-site items-center gap-3 px-5 lg:gap-4">
        <Logo />

        <HeaderCategorySearch />

        <nav
          aria-label="Main"
          className="hidden shrink-0 items-center md:flex"
        >
          <AppNavLinks orientation="horizontal" />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
          {showAuthChrome ? (
            <div className="flex items-center gap-0.5">
              <ChatNavIcon enabled />
              <NotificationsBell enabled />
            </div>
          ) : null}

          <div className="hidden items-center gap-2 md:flex">
            <HeaderPreferences />

            {isLoading ? (
              <span className="size-9 animate-pulse rounded-full bg-surface-elevated" />
            ) : isAuthenticated ? (
              <>
                <span
                  className="mx-0.5 hidden h-5 w-px bg-border sm:block"
                  aria-hidden="true"
                />
                <SellNavButton className="size-p" />
                <UserMenu />
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
          </div>

          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
