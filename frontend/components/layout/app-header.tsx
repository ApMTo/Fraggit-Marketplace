'use client';

import { useTranslations } from 'next-intl';
import { AppNavLinks } from '@/components/layout/app-nav-links';
import { HeaderCategorySearch } from '@/components/layout/header-category-search';
import { HeaderPreferences } from '@/components/layout/header-preferences';
import { MobileMenu } from '@/components/layout/mobile-menu';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/layout/logo';
import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import { ChatNavIcon } from '@/features/chat/components/chat-nav-icon';
import { NotificationsBell } from '@/features/notifications/components/notifications-bell';
import { useAuth } from '@/providers/AuthProvider';

export function AppHeader() {
  const t = useTranslations('auth');
  const tListings = useTranslations('listings');
  const { isAuthenticated, isLoading } = useAuth();
  const showAuthChrome = !isLoading && isAuthenticated;

  return (
    <header className="glass-header sticky top-0 z-50 border-b border-border">
      <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-3 px-5 sm:gap-4">
        <Logo />

        <HeaderCategorySearch />

        <nav
          aria-label="Main"
          className="hidden items-center gap-1 md:flex lg:gap-2"
        >
          <AppNavLinks orientation="horizontal" />
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {showAuthChrome ? (
            <>
              <ChatNavIcon enabled />
              <NotificationsBell enabled />
            </>
          ) : null}

          <div className="hidden md:flex md:items-center md:gap-2 lg:gap-3">
            <HeaderPreferences />

            {isLoading ? (
              <span className="size-8 animate-pulse rounded-[var(--radius-md)] bg-surface-elevated" />
            ) : isAuthenticated ? (
              <>
                <BrandButton href="/listings/new" size="sm">
                  {tListings('createLot')}
                </BrandButton>
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
