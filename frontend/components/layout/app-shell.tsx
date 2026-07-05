'use client';

import { usePathname } from 'next/navigation';
import { type ReactNode } from 'react';
import { AppHeader } from '@/components/layout/app-header';

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

  return (
    <>
      {!hideHeader ? <AppHeader /> : null}
      <main className={hideHeader ? 'flex min-h-svh flex-col' : 'flex-1'}>
        {children}
      </main>
    </>
  );
}
