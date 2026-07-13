'use client';

import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, UserRound } from 'lucide-react';
import {
  getAppNavItems,
  isNavItemActive,
  type AppNavItemId,
} from '@/lib/app-nav';
import { useAuth } from '@/providers/AuthProvider';
import { DropdownItem, DropdownMenu } from '@/components/ui/dropdown-menu';

export function UserMenu() {
  const tNav = useTranslations('common.nav');
  const tAuth = useTranslations('auth');
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const items = getAppNavItems({
    isAuthenticated: true,
    role: user.role,
    group: 'account',
    username: user.username,
  });

  return (
    <DropdownMenu
      trigger={
        <>
          <UserRound className="size-4 text-brand-cyan" />
          <span>{user.displayName}</span>
        </>
      }
    >
      {items.map((item) => (
        <DropdownItem
          key={item.id}
          isActive={isNavItemActive(pathname, item.href)}
          onSelect={() => router.push(item.href)}
        >
          {tNav(item.id as AppNavItemId)}
        </DropdownItem>
      ))}
      <DropdownItem onSelect={() => void logout()}>
        <LogOut className="size-4" />
        {tAuth('logout')}
      </DropdownItem>
    </DropdownMenu>
  );
}
