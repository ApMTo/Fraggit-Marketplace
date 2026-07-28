'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { formatChatListTime } from '@/lib/chat-time';
import {
  formatNotificationBody,
  formatNotificationTitle,
} from '@/lib/format-notification';
import { unlockNotificationSound } from '@/lib/notification-sound';
import { cn } from '@/lib/utils';
import { useNotificationsRealtime } from '@/hooks/use-notifications-realtime';
import {
  notificationKeys,
  notificationsService,
} from '@/services/notifications.service';
import type { AppNotification } from '@/types/notifications';

type NotificationsBellProps = {
  enabled: boolean;
};

export function NotificationsBell({ enabled }: NotificationsBellProps) {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useNotificationsRealtime({ enabled });

  const unreadQuery = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsService.unreadCount(),
    enabled,
    staleTime: 30_000,
  });

  const listQuery = useQuery({
    queryKey: notificationKeys.list({ page: 1, limit: 20 }),
    queryFn: () => notificationsService.list({ page: 1, limit: 20 }),
    enabled: enabled && open,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const unlock = () => unlockNotificationSound();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [enabled]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, close]);

  if (!enabled) {
    return null;
  }

  const unreadCount = unreadQuery.data?.count ?? 0;
  const items = listQuery.data?.items ?? [];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={t('open')}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-muted transition-[background-color,color] duration-300 hover:bg-surface-elevated hover:text-foreground"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-full bg-brand-cyan px-1 text-[10px] font-semibold leading-none text-[oklch(0.145_0.018_265)]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="dropdown-panel absolute top-[calc(100%+0.75rem)] right-0 z-50 w-[min(100vw-2rem,22rem)] overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
            <p className="text-sm font-medium text-foreground">{t('title')}</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                className="cursor-pointer text-xs text-brand-cyan hover:underline"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                {t('markAllRead')}
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5">
            {listQuery.isLoading ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                {t('loading')}
              </p>
            ) : listQuery.isError ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                {t('loadError')}
              </p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted">
                {t('empty')}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.id}>
                    <NotificationRow
                      notification={item}
                      locale={locale}
                      onSelect={() => {
                        if (!item.readAt) {
                          markReadMutation.mutate(item.id);
                        }
                        close();
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NotificationRow({
  notification,
  locale,
  onSelect,
}: {
  notification: AppNotification;
  locale: string;
  onSelect: () => void;
}) {
  const t = useTranslations('notifications');
  const time = formatChatListTime(notification.createdAt, locale);
  const isUnread = !notification.readAt;
  const href = notification.href || '/orders';
  const title = formatNotificationTitle(notification, t);
  const body = formatNotificationBody(notification, t);

  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className={cn(
        'block rounded-[var(--radius-sm)] px-3 py-2.5 transition-[background-color] duration-300 hover:bg-surface-hover',
        isUnread && 'bg-surface-elevated/70',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {isUnread ? (
          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-brand-cyan" />
        ) : null}
      </div>
      {body ? (
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">{body}</p>
      ) : null}
      {time ? (
        <time
          dateTime={notification.createdAt}
          className="mt-1 block text-[11px] text-subtle"
        >
          {time}
        </time>
      ) : null}
    </Link>
  );
}
