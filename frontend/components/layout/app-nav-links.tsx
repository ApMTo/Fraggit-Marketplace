'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getAppNavItems, isNavItemActive, type AppNavItemId } from '@/lib/app-nav';
import { useAuth } from '@/providers/AuthProvider';

type AppNavLinksProps = {
  onNavigate?: () => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
};

export function AppNavLinks({
  onNavigate,
  orientation = 'vertical',
  className = '',
  linkClassName = '',
  activeLinkClassName = '',
}: AppNavLinksProps) {
  const t = useTranslations('common.nav');
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();

  const items = getAppNavItems({
    isAuthenticated,
    role: user?.role,
    group: 'header',
  });

  const inactiveClassName =
    linkClassName ||
    'text-muted hover:bg-surface-elevated hover:text-foreground';
  const activeClassName =
    activeLinkClassName || 'bg-accent text-accent-foreground';
  const layoutClassName =
    orientation === 'horizontal'
      ? 'inline-flex items-center'
      : 'block w-full';

  return (
    <ul
      className={
        className ||
        (orientation === 'horizontal'
          ? 'flex items-center gap-1 lg:gap-2'
          : 'space-y-1')
      }
    >
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={`${layoutClassName} rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-[background-color,color] duration-300 ${
                isActive ? activeClassName : inactiveClassName
              }`}
            >
              {t(item.id as AppNavItemId)}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
