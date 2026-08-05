'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { LegalFooter } from '@/features/legal';
import { isChatRoute } from '@/lib/chat-route';
import { cn } from '@/lib/utils';

const AUTH_ROUTES = new Set(['/login', '/register']);
const LEGAL_ROUTES = new Set([
  '/terms',
  '/privacy',
  '/marketplace-rules',
  '/seller-policy',
]);

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname) || pathname.startsWith('/auth/');
}

function shouldShowLegalFooter(pathname: string): boolean {
  return pathname !== '/' && !isAuthRoute(pathname) && !LEGAL_ROUTES.has(pathname);
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideHeader = isAuthRoute(pathname);
  const lockViewport = isChatRoute(pathname);
  const showLegalFooter = shouldShowLegalFooter(pathname);
  const showBottomNav = !hideHeader;

  return (
    <div
      className={cn(
        'flex min-h-dvh flex-col',
        lockViewport && 'h-dvh overflow-hidden',
      )}
    >
      {!hideHeader ? <AppHeader /> : null}
      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col',
          lockViewport && 'overflow-hidden',
          showBottomNav &&
            'pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0',
        )}
      >
        <main
          className={cn(
            'flex min-h-0 flex-col',
            hideHeader ? 'min-h-dvh flex-1' : 'flex-1',
            lockViewport && 'overflow-hidden',
          )}
        >
          {children}
        </main>
        {showLegalFooter ? <LegalFooter /> : null}
      </div>
      {showBottomNav ? <MobileBottomNav /> : null}
    </div>
  );
}
