'use client';

import { useTranslations } from 'next-intl';
import { HeaderCategorySearch } from '@/components/layout/header-category-search';
import { HeaderPreferences } from '@/components/layout/header-preferences';
import { SellNavButton } from '@/components/layout/sell-nav-button';
import { UserMenu } from '@/components/layout/user-menu';
import { Logo } from '@/components/layout/logo';
import { BrandButton, SecondaryButton } from '@/components/ui/nav-button';
import { ChatNavIcon } from '@/features/chat/components/chat-nav-icon';
import { NotificationsBell } from '@/features/notifications/components/notifications-bell';
import { isStaffRole } from '@/lib/staff';
import { useAuth } from '@/providers/AuthProvider';

export function AppHeader() {
  const t = useTranslations('auth');
  const { isAuthenticated, isLoading, user } = useAuth();
  const showAuthChrome = !isLoading && isAuthenticated;
  const showSell = showAuthChrome && !isStaffRole(user?.role);

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 pb-2 md:px-5">
      <div className="glass-header-bar mx-auto flex h-14 max-w-site items-center gap-3 px-4 md:h-[4.25rem] lg:gap-5 lg:px-5">
        <Logo />

        <div className="hidden min-w-0 flex-1 md:block">
          <HeaderCategorySearch />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <HeaderPreferences />

          {isLoading ? (
            <span className="hidden size-9 animate-pulse rounded-full bg-surface-elevated md:block" />
          ) : null}

          {showAuthChrome ? (
            <>
              {showSell ? (
                <div className="hidden md:block">
                  <SellNavButton />
                </div>
              ) : null}
              <ChatNavIcon enabled />
              <NotificationsBell enabled />
              <div className="hidden md:block">
                <UserMenu />
              </div>
            </>
          ) : !isLoading ? (
            <div className="hidden items-center gap-2 md:flex">
              <SecondaryButton href="/register" size="sm">
                {t('register.submit')}
              </SecondaryButton>
              <BrandButton href="/login" size="sm">
                {t('login.submit')}
              </BrandButton>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
