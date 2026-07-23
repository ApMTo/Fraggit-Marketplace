'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/moderation', id: 'overview' as const, exact: true },
  { href: '/moderation/users', id: 'users' as const },
  { href: '/moderation/lots', id: 'lots' as const },
  { href: '/moderation/reports', id: 'reports' as const },
  { href: '/moderation/tickets', id: 'tickets' as const },
  { href: '/moderation/audit', id: 'audit' as const },
];

type ModerationShellProps = {
  title: string;
  children: React.ReactNode;
};

export function ModerationShell({ title, children }: ModerationShellProps) {
  const pathname = usePathname();
  const t = useTranslations('moderation.nav');

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <nav className="mt-4 flex flex-wrap gap-2 border-b border-border pb-3">
          {LINKS.map((link) => {
            const active = link.exact
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {t(link.id)}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
