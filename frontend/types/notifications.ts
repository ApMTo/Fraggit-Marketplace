export type NotificationType =
  | 'ORDER_CREATED'
  | 'ORDER_CREDENTIALS'
  | 'ORDER_APPROVED'
  | 'TICKET_REPLY'
  | 'REPORT_STATUS'
  | 'TICKET_RESOLVED';

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string | null;
  href: string | null;
  readAt: string | null;
  entityType: string | null;
  entityId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type NotificationListResult = {
  items: AppNotification[];
  total: number;
  page: number;
  limit: number;
};

export type UnreadCountResult = {
  count: number;
};

export type WsNotificationPayload = {
  notification: AppNotification;
};
