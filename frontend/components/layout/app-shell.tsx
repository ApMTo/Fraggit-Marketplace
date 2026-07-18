'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { isChatRoute } from '@/lib/chat-route';
import { cn } from '@/lib/utils';

const AUTH_ROUTES = new Set(['/login', '/register']);

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname) || pathname.startsWith('/auth/');
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const hideHeader = isAuthRoute(pathname);
  const lockViewport = isChatRoute(pathname);

  return (
    <div
      className={cn(
        'flex min-h-dvh flex-col',
        lockViewport && 'h-dvh overflow-hidden',
      )}
    >
      {!hideHeader ? <AppHeader /> : null}
      <main
        className={cn(
          'flex min-h-0 flex-col',
          hideHeader ? 'min-h-dvh flex-1' : 'flex-1',
          lockViewport && 'overflow-hidden',
        )}
      >
        {children}
      </main>
    </div>
  );
}
