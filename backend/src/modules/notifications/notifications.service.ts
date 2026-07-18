import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  NOTIFICATION_SELECT,
  NotificationItem,
} from './constants/notification.select';
import { FindNotificationsQueryDto } from './dto/find-notifications.query.dto';

export type NotificationListResult = {
  items: NotificationItem[];
  total: number;
  page: number;
  limit: number;
};

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  href?: string;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    inputs: CreateNotificationInput[],
  ): Promise<NotificationItem[]> {
    if (inputs.length === 0) {
      return [];
    }

    const created: NotificationItem[] = [];

    for (const input of inputs) {
      const notification = await this.prisma.notification.upsert({
        where: {
          userId_type_entityId: {
            userId: input.userId,
            type: input.type,
            entityId: input.entityId ?? '',
          },
        },
        create: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          href: input.href,
          entityType: input.entityType,
          entityId: input.entityId ?? '',
          metadata: input.metadata,
        },
        update: {
          title: input.title,
          body: input.body,
          href: input.href,
          entityType: input.entityType,
          metadata: input.metadata,
          readAt: null,
        },
        select: NOTIFICATION_SELECT,
      });

      created.push(notification);
    }

    return created;
  }

  async findMany(
    userId: string,
    query: FindNotificationsQueryDto,
  ): Promise<NotificationListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = { userId };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: NOTIFICATION_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });

    return { count };
  }

  async markAsRead(userId: string, id: string): Promise<NotificationItem> {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
      select: { userId: true, readAt: true },
    });

    if (!existing) {
      throw new NotFoundException('notification_not_found');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenException('notification_forbidden');
    }

    if (existing.readAt) {
      return this.prisma.notification.findUniqueOrThrow({
        where: { id },
        select: NOTIFICATION_SELECT,
      });
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
      select: NOTIFICATION_SELECT,
    });
  }

  async markAllAsRead(userId: string): Promise<{ updated: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });

    return { updated: result.count };
  }
}
