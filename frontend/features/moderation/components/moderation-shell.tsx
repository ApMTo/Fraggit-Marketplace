'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/moderation', id: 'overview' as const, exact: true },
  { href: '/moderation/users', id: 'users' as const },
  { href: '/moderation/lots', id: 'lots' as const },
  { href: '/moderation/tickets', id: 'tickets' as const },
  { href: '/moderation/audit', id: 'audit' as const },
];

const REPORT_LINKS = [
  {
    href: '/moderation/reports/lots',
    target: 'LOT' as const,
    match: '/moderation/reports/lots',
  },
  {
    href: '/moderation/reports/users',
    target: 'USER' as const,
    match: '/moderation/reports/users',
  },
  {
    href: '/moderation/reports/reviews',
    target: 'REVIEW' as const,
    match: '/moderation/reports/reviews',
  },
  {
    href: '/moderation/reports/messages',
    target: 'MESSAGE' as const,
    match: '/moderation/reports/messages',
  },
];

type ModerationShellProps = {
  title: string;
  children: React.ReactNode;
};

export function ModerationShell({ title, children }: ModerationShellProps) {
  const pathname = usePathname();
  const t = useTranslations('moderation.nav');
  const tReports = useTranslations('moderation.reports');

  return (
    <div className="mx-auto w-full max-w-site px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="shrink-0 lg:w-56">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:mb-4">
            {t('section')}
          </p>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {LINKS.slice(0, 3).map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {t(link.id)}
                </Link>
              );
            })}

            <div className="hidden lg:block">
              <p className="mb-1 mt-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('reports')}
              </p>
              <div className="flex flex-col gap-0.5">
                {REPORT_LINKS.map((link) => {
                  const active = pathname === link.match;
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
                      {tReports(`sections.${link.target}`)}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-1 lg:hidden">
              {REPORT_LINKS.map((link) => {
                const active = pathname === link.match;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'shrink-0 rounded-md px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {tReports(`targetLabels.${link.target}`)}
                  </Link>
                );
              })}
            </div>

            {LINKS.slice(3).map((link) => {
              const active =
                pathname === link.href ||
                pathname.startsWith(`${link.href}/`);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'shrink-0 rounded-md px-3 py-2 text-sm transition-colors',
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
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
