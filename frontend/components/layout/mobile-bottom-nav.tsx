'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MessageSquare, Plus, Search, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { useConversations } from '@/hooks/use-chat';
import { isChatRoute } from '@/lib/chat-route';
import { userProfileHref } from '@/lib/app-nav';
import { isStaffRole } from '@/lib/staff';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

type NavItem = {
  id: 'search' | 'sell' | 'chat' | 'profile';
  href: string;
  label: string;
  active: boolean;
  badge?: number;
  icon: ReactNode;
};

export function MobileBottomNav() {
  const t = useTranslations('common.nav');
  const tListings = useTranslations('listings');
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const onChatPage = isChatRoute(pathname);

  const conversationsQuery = useConversations({ enabled: isAuthenticated });
  const unreadTotal =
    conversationsQuery.data?.items.reduce(
      (sum, item) => sum + (item.unreadCount ?? 0),
      0,
    ) ?? 0;

  const profileHref = user
    ? userProfileHref(user.username)
    : `/login?next=${encodeURIComponent(pathname)}`;

  const sellHref = isAuthenticated
    ? '/listings/new'
    : `/login?next=${encodeURIComponent('/listings/new')}`;

  const chatHref = isAuthenticated
    ? '/chat'
    : `/login?next=${encodeURIComponent('/chat')}`;

  const showSell = !isLoading && (!isAuthenticated || !isStaffRole(user?.role));

  const items: NavItem[] = [
    {
      id: 'search',
      href: '/listings',
      label: t('search'),
      active:
        pathname === '/listings' ||
        (pathname.startsWith('/listings/') &&
          !pathname.startsWith('/listings/new') &&
          !pathname.includes('/lot/')),
      icon: <Search className="size-5" strokeWidth={2} aria-hidden="true" />,
    },
    ...(showSell
      ? [
          {
            id: 'sell' as const,
            href: sellHref,
            label: tListings('sell'),
            active: pathname.startsWith('/listings/new'),
            icon: (
              <span className="flex size-5 items-center justify-center rounded-full border border-current">
                <Plus className="size-3" strokeWidth={2.5} aria-hidden="true" />
              </span>
            ),
          },
        ]
      : []),
    {
      id: 'chat',
      href: chatHref,
      label: t('chats'),
      active: onChatPage,
      badge: onChatPage || !isAuthenticated ? undefined : unreadTotal,
      icon: (
        <MessageSquare className="size-5" strokeWidth={2} aria-hidden="true" />
      ),
    },
    {
      id: 'profile',
      href: profileHref,
      label: t('profile'),
      active: Boolean(
        user && pathname.startsWith(userProfileHref(user.username)),
      ),
      icon: <UserRound className="size-5" strokeWidth={2} aria-hidden="true" />,
    },
  ];

  return (
    <nav
      aria-label={t('menu')}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-[var(--header-bg)] pb-[env(safe-area-inset-bottom)] backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <div className="mx-auto flex max-w-site items-stretch justify-around px-1 pt-1.5 pb-1">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={(event) => {
              if (item.id === 'search' && pathname === '/listings') {
                event.preventDefault();
                document
                  .getElementById('game-search')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                document
                  .querySelector<HTMLInputElement>('#game-search input')
                  ?.focus();
                return;
              }

              if (
                item.id === 'search' &&
                pathname.startsWith('/listings/') &&
                !pathname.startsWith('/listings/new')
              ) {
                event.preventDefault();
                const input = document.querySelector<HTMLInputElement>(
                  '#game-search input',
                );
                if (input) {
                  input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  input.focus();
                  return;
                }
                router.push('/listings');
              }
            }}
            className={cn(
              'relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[11px] font-medium tracking-wide transition-colors',
              item.active
                ? 'text-brand-cyan'
                : 'text-muted hover:text-foreground',
            )}
          >
            <span className="relative inline-flex size-6 items-center justify-center">
              {item.icon}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-brand-cyan px-1 text-[9px] font-semibold leading-none text-[oklch(0.145_0.018_265)]">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              ) : null}
            </span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
