import type { UserRole } from '@/types/auth';

export type AppNavItemId =
  | 'listings'
  | 'dashboard'
  | 'orders'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'admin';

export type AppNavGroup = 'header' | 'account';

type AppNavItem = {
  id: AppNavItemId;
  href: string;
  group: AppNavGroup;
  showWhen: 'always' | 'guest' | 'authenticated';
  roles?: UserRole[];
};

const APP_NAV_ITEMS: AppNavItem[] = [
  { id: 'listings', href: '/listings', group: 'header', showWhen: 'always' },
  {
    id: 'dashboard',
    href: '/dashboard',
    group: 'account',
    showWhen: 'authenticated',
  },
  {
    id: 'orders',
    href: '/orders',
    group: 'account',
    showWhen: 'authenticated',
  },
  { id: 'chat', href: '/chat', group: 'account', showWhen: 'authenticated' },
  {
    id: 'profile',
    href: '/profile',
    group: 'account',
    showWhen: 'authenticated',
  },
  {
    id: 'settings',
    href: '/settings',
    group: 'account',
    showWhen: 'authenticated',
  },
  {
    id: 'admin',
    href: '/admin',
    group: 'account',
    showWhen: 'authenticated',
    roles: ['ADMIN', 'MODERATOR', 'OWNER', 'SUPER_ADMIN'],
  },
];

type GetAppNavItemsOptions = {
  isAuthenticated: boolean;
  role?: UserRole;
  group?: AppNavGroup;
  username?: string;
};

export function getAppNavItems({
  isAuthenticated,
  role,
  group,
  username,
}: GetAppNavItemsOptions) {
  return APP_NAV_ITEMS.filter((item) => {
    if (group && item.group !== group) {
      return false;
    }

    if (item.showWhen === 'guest' && isAuthenticated) {
      return false;
    }

    if (item.showWhen === 'authenticated' && !isAuthenticated) {
      return false;
    }

    if (item.roles && (!role || !item.roles.includes(role))) {
      return false;
    }

    return true;
  }).map((item) => {
    if (item.id === 'profile' && username) {
      return { ...item, href: `/user/${username}` };
    }

    return item;
  });
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function userProfileHref(username: string) {
  return `/user/${username.trim().toLowerCase()}`;
}
