'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  getAppNavItems,
  isNavItemActive,
  type AppNavItemId,
} from '@/lib/app-nav';
import { useAuth } from '@/providers/AuthProvider';

type AccountNavLinksProps = {
  onNavigate?: () => void;
};

export function AccountNavLinks({ onNavigate }: AccountNavLinksProps) {
  const t = useTranslations('common.nav');
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const items = getAppNavItems({
    isAuthenticated: true,
    role: user.role,
    group: 'account',
  });

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = isNavItemActive(pathname, item.href);

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? 'page' : undefined}
              className={`block w-full rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-[background-color,color] duration-300 ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted hover:bg-surface-elevated hover:text-foreground'
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
