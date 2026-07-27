'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks';
import type { UserRole } from '@/types/auth';
import { cn } from '@/lib/utils';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'OWNER'];

type NavLink = {
  href: string;
  id: 'overview' | 'users' | 'lots' | 'tickets' | 'audit';
  exact?: boolean;
  adminOnly?: boolean;
};

type ReportLink = {
  href: string;
  target: 'LOT' | 'USER' | 'REVIEW' | 'MESSAGE';
  match: string;
  adminOnly?: boolean;
};

const PRIMARY_LINKS: NavLink[] = [
  { href: '/moderation', id: 'overview', exact: true },
  { href: '/moderation/users', id: 'users' },
  { href: '/moderation/lots', id: 'lots', adminOnly: true },
];

const SECONDARY_LINKS: NavLink[] = [
  { href: '/moderation/tickets', id: 'tickets' },
  { href: '/moderation/audit', id: 'audit' },
];

const REPORT_LINKS: ReportLink[] = [
  {
    href: '/moderation/reports/lots',
    target: 'LOT',
    match: '/moderation/reports/lots',
    adminOnly: true,
  },
  {
    href: '/moderation/reports/users',
    target: 'USER',
    match: '/moderation/reports/users',
  },
  {
    href: '/moderation/reports/reviews',
    target: 'REVIEW',
    match: '/moderation/reports/reviews',
  },
  {
    href: '/moderation/reports/messages',
    target: 'MESSAGE',
    match: '/moderation/reports/messages',
    adminOnly: true,
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
  const { user } = useAuth();

  const isAdmin = Boolean(user && ADMIN_ROLES.includes(user.role));
  const isVisible = (link: { adminOnly?: boolean }) =>
    isAdmin || !link.adminOnly;

  const primaryLinks = PRIMARY_LINKS.filter(isVisible);
  const secondaryLinks = SECONDARY_LINKS.filter(isVisible);
  const reportLinks = REPORT_LINKS.filter(isVisible);

  return (
    <div className="mx-auto w-full max-w-site px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="shrink-0 lg:w-56">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:mb-4">
            {t('section')}
          </p>
          <nav className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {primaryLinks.map((link) => {
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
                {reportLinks.map((link) => {
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
              {reportLinks.map((link) => {
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

            {secondaryLinks.map((link) => {
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
