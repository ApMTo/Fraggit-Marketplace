import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: {
    notification: {
      upsert: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      findUniqueOrThrow: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      notification: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('upserts notifications for each recipient', async () => {
    prisma.notification.upsert
      .mockResolvedValueOnce({
        id: 'n-1',
        userId: 'seller-1',
        type: NotificationType.ORDER_CREATED,
      })
      .mockResolvedValueOnce({
        id: 'n-2',
        userId: 'buyer-1',
        type: NotificationType.ORDER_CREATED,
      });

    const result = await service.createMany([
      {
        userId: 'seller-1',
        type: NotificationType.ORDER_CREATED,
        title: 'Новый заказ',
        entityId: 'order-1',
      },
      {
        userId: 'buyer-1',
        type: NotificationType.ORDER_CREATED,
        title: 'Заказ оформлен',
        entityId: 'order-1',
      },
    ]);

    expect(result).toHaveLength(2);
    expect(prisma.notification.upsert).toHaveBeenCalledTimes(2);
  });

  it('returns unread count', async () => {
    prisma.notification.count.mockResolvedValue(3);

    await expect(service.unreadCount('user-1')).resolves.toEqual({ count: 3 });
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: { userId: 'user-1', readAt: null },
    });
  });

  it('marks notification as read for owner', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      userId: 'user-1',
      readAt: null,
    });
    prisma.notification.update.mockResolvedValue({
      id: 'n-1',
      userId: 'user-1',
      readAt: new Date(),
    });

    await service.markAsRead('user-1', 'n-1');

    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'n-1' },
        data: { readAt: expect.any(Date) },
      }),
    );
  });

  it('forbids marking another users notification', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      userId: 'other',
      readAt: null,
    });

    await expect(service.markAsRead('user-1', 'n-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws when notification is missing', async () => {
    prisma.notification.findUnique.mockResolvedValue(null);

    await expect(service.markAsRead('user-1', 'n-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
