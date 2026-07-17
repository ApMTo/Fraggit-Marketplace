import api from '@/lib/api';
import type {
  AppNotification,
  NotificationListResult,
  UnreadCountResult,
} from '@/types/notifications';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { page?: number; limit?: number }) =>
    [...notificationKeys.all, 'list', params ?? {}] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export const notificationsService = {
  async list(params?: {
    page?: number;
    limit?: number;
  }): Promise<NotificationListResult> {
    const { data } = await api.get<NotificationListResult>('/notifications', {
      params,
    });
    return data;
  },

  async unreadCount(): Promise<UnreadCountResult> {
    const { data } = await api.get<UnreadCountResult>(
      '/notifications/unread-count',
    );
    return data;
  },

  async markAsRead(id: string): Promise<AppNotification> {
    const { data } = await api.patch<AppNotification>(
      `/notifications/${encodeURIComponent(id)}/read`,
    );
    return data;
  },

  async markAllAsRead(): Promise<{ updated: number }> {
    const { data } = await api.post<{ updated: number }>(
      '/notifications/read-all',
    );
    return data;
  },
};
