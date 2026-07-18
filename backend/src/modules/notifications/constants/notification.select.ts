import { Prisma } from '@prisma/client';

export const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  type: true,
  title: true,
  body: true,
  href: true,
  readAt: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationItem = Prisma.NotificationGetPayload<{
  select: typeof NOTIFICATION_SELECT;
}>;
