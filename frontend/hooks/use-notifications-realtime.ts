'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  acquireChatSocket,
  CHAT_WS_EVENTS,
  releaseChatSocket,
} from '@/lib/chat-socket';
import { playNotificationSound } from '@/lib/notification-sound';
import { notificationKeys } from '@/services/notifications.service';
import type {
  AppNotification,
  NotificationListResult,
  UnreadCountResult,
  WsNotificationPayload,
} from '@/types/notifications';

type UseNotificationsRealtimeOptions = {
  enabled?: boolean;
};

/**
 * Keeps notification list / unread-count caches in sync via the shared /chat socket.
 */
export function useNotificationsRealtime({
  enabled = true,
}: UseNotificationsRealtimeOptions = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const socket = acquireChatSocket();

    const handleNotificationNew = (payload: WsNotificationPayload) => {
      const notification = payload?.notification;
      if (!notification?.id) {
        return;
      }

      playNotificationSound();

      queryClient.setQueryData<UnreadCountResult>(
        notificationKeys.unreadCount(),
        (prev) => ({ count: (prev?.count ?? 0) + 1 }),
      );

      queryClient.setQueriesData<NotificationListResult>(
        { queryKey: [...notificationKeys.all, 'list'] },
        (prev) => {
          if (!prev) {
            return prev;
          }

          const withoutDup = prev.items.filter(
            (item: AppNotification) => item.id !== notification.id,
          );

          return {
            ...prev,
            total: prev.total + (withoutDup.length === prev.items.length ? 1 : 0),
            items: [notification, ...withoutDup].slice(0, prev.limit),
          };
        },
      );
    };

    socket.on(CHAT_WS_EVENTS.NOTIFICATION_NEW, handleNotificationNew);

    return () => {
      socket.off(CHAT_WS_EVENTS.NOTIFICATION_NEW, handleNotificationNew);
      releaseChatSocket();
    };
  }, [enabled, queryClient]);
}
