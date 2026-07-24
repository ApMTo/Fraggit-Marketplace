import type { UserRole } from '@/types/auth';

export type AppNavItemId =
  | 'listings'
  | 'orders'
  | 'chat'
  | 'profile'
  | 'moderation'
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
    id: 'moderation',
    href: '/moderation',
    group: 'account',
    showWhen: 'authenticated',
    roles: ['MODERATOR', 'ADMIN', 'SUPER_ADMIN', 'OWNER'],
  },
  {
    id: 'admin',
    href: '/admin',
    group: 'account',
    showWhen: 'authenticated',
    roles: ['ADMIN', 'SUPER_ADMIN', 'OWNER'],
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
