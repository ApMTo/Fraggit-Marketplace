import { ConfigService } from '@nestjs/config';
import { MessageType } from '@prisma/client';
import { RedisService } from '../../../database/redis.service';
import { MailQueueService } from '../../mail/mail-queue.service';
import {
  CHAT_NOTIFY_COOLDOWN_KEY_PREFIX,
  CHAT_NOTIFY_COOLDOWN_SECONDS,
} from '../constants/chat.constants';
import { ChatMessage } from '../constants/chat.select';
import { ChatNotificationQueueService } from './chat-notification-queue.service';
import { ChatNotificationService } from './chat-notification.service';
import { ChatPresenceService } from './chat-presence.service';
import { MessageService } from './message.service';

describe('ChatNotificationService', () => {
  let service: ChatNotificationService;
  let chatPresence: { isOnline: jest.Mock };
  let chatNotificationQueue: {
    enqueueOfflineNotification: jest.Mock;
    enqueueOfflineOrderNotification: jest.Mock;
  };
  let messageService: {
    getUserEmail: jest.Mock;
  };
  let mailQueue: { enqueue: jest.Mock };
  let configService: { get: jest.Mock };
  let redis: { setIfNotExists: jest.Mock };

  const message: ChatMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    type: MessageType.TEXT,
    content: 'hello there',
    metadata: null,
    createdAt: new Date('2026-07-09T12:00:00.000Z'),
    sender: {
      id: 'user-1',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
    },
    attachments: [],
  };

  let telegramService: {
    tryNotifyOfflineChat: jest.Mock;
    tryNotifyOfflineOrder: jest.Mock;
  };

  beforeEach(() => {
    chatPresence = { isOnline: jest.fn() };
    chatNotificationQueue = {
      enqueueOfflineNotification: jest.fn().mockResolvedValue(undefined),
      enqueueOfflineOrderNotification: jest.fn().mockResolvedValue(undefined),
    };
    messageService = {
      getUserEmail: jest.fn().mockResolvedValue('bob@test.com'),
    };
    mailQueue = { enqueue: jest.fn().mockResolvedValue(undefined) };
    configService = {
      get: jest.fn().mockReturnValue('https://fraggit.test'),
    };
    redis = {
      setIfNotExists: jest.fn().mockResolvedValue(true),
    };

    telegramService = {
      tryNotifyOfflineChat: jest.fn().mockResolvedValue(false),
      tryNotifyOfflineOrder: jest.fn().mockResolvedValue(false),
    };

    service = new ChatNotificationService(
      chatPresence as unknown as ChatPresenceService,
      chatNotificationQueue as unknown as ChatNotificationQueueService,
      messageService as unknown as MessageService,
      mailQueue as unknown as MailQueueService,
      configService as unknown as ConfigService,
      telegramService as never,
      redis as unknown as RedisService,
    );
  });

  const participantIds = ['user-1', 'user-2'];

  it('skips notification for system messages without sender', async () => {
    await service.notifyAboutNewMessage(
      { ...message, senderId: null },
      'Alice',
      participantIds,
    );

    expect(chatPresence.isOnline).not.toHaveBeenCalled();
    expect(
      chatNotificationQueue.enqueueOfflineNotification,
    ).not.toHaveBeenCalled();
  });

  it('skips email queue when recipient is online', async () => {
    chatPresence.isOnline.mockResolvedValue(true);

    await service.notifyAboutNewMessage(message, 'Alice', participantIds);

    expect(chatPresence.isOnline).toHaveBeenCalledWith('user-2');
    expect(
      chatNotificationQueue.enqueueOfflineNotification,
    ).not.toHaveBeenCalled();
  });

  it('enqueues offline notification when recipient is offline', async () => {
    chatPresence.isOnline.mockResolvedValue(false);

    await service.notifyAboutNewMessage(message, 'Alice', participantIds);

    expect(redis.setIfNotExists).toHaveBeenCalledWith(
      `${CHAT_NOTIFY_COOLDOWN_KEY_PREFIX}user-2:user-1`,
      '1',
      CHAT_NOTIFY_COOLDOWN_SECONDS,
    );
    expect(
      chatNotificationQueue.enqueueOfflineNotification,
    ).toHaveBeenCalledWith({
      recipientUserId: 'user-2',
      recipientEmail: 'bob@test.com',
      senderDisplayName: 'Alice',
      conversationId: 'conv-1',
      messagePreview: 'hello there',
    });
  });

  it('skips offline chat notification during sender cooldown', async () => {
    chatPresence.isOnline.mockResolvedValue(false);
    redis.setIfNotExists.mockResolvedValue(false);

    await service.notifyAboutNewMessage(message, 'Alice', participantIds);

    expect(
      chatNotificationQueue.enqueueOfflineNotification,
    ).not.toHaveBeenCalled();
  });

  it('still notifies when cooldown Redis check fails open', async () => {
    chatPresence.isOnline.mockResolvedValue(false);
    redis.setIfNotExists.mockResolvedValue(null);

    await service.notifyAboutNewMessage(message, 'Alice', participantIds);

    expect(chatNotificationQueue.enqueueOfflineNotification).toHaveBeenCalled();
  });

  it('sends offline email through mail queue', async () => {
    await service.sendOfflineEmail({
      recipientEmail: 'bob@test.com',
      senderDisplayName: 'Alice <script>',
      conversationId: 'conv-1',
      messagePreview: 'hi <b>x</b>',
    });

    expect(mailQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'bob@test.com',
        type: 'chat_notification',
        subject: 'New message from Alice <script>',
        html: expect.stringContaining('Alice &lt;script&gt;'),
      }),
    );
    expect(mailQueue.enqueue.mock.calls[0][0].html).toContain(
      'https://fraggit.test/chat/conv-1',
    );
    expect(mailQueue.enqueue.mock.calls[0][0].html).toContain(
      'hi &lt;b&gt;x&lt;/b&gt;',
    );
  });

  it('enqueues offline order notification when recipient is offline', async () => {
    chatPresence.isOnline.mockResolvedValue(false);

    await service.notifyOfflineAboutOrderNotification({
      id: 'n-1',
      userId: 'user-2',
      type: 'ORDER_CREATED',
      title: 'items.orderCreated.seller.title',
      body: 'items.orderCreated.seller.body',
      href: '/orders/order-1',
      readAt: null,
      entityType: 'order',
      entityId: 'order-1',
      metadata: {
        orderNumber: 'FRG-100',
        listingTitle: 'Rare skin',
        role: 'seller',
      },
      createdAt: new Date(),
    });

    expect(telegramService.tryNotifyOfflineOrder).not.toHaveBeenCalled();
    expect(
      chatNotificationQueue.enqueueOfflineOrderNotification,
    ).toHaveBeenCalledWith({
      recipientUserId: 'user-2',
      recipientEmail: 'bob@test.com',
      subject: 'New order',
      title: 'New order',
      body: 'A buyer placed order #FRG-100 (Rare skin).',
      href: 'https://fraggit.test/orders/order-1',
      titleKey: 'items.orderCreated.seller.title',
      bodyKey: 'items.orderCreated.seller.body',
      notificationParams: {
        orderNumber: 'FRG-100',
        listingTitle: 'Rare skin',
      },
    });
  });

  it('sends Telegram for order notification even when recipient is online', async () => {
    chatPresence.isOnline.mockResolvedValue(true);

    await service.notifyOfflineAboutOrderNotification({
      id: 'n-1',
      userId: 'user-2',
      type: 'ORDER_CREATED',
      title: 'items.orderCreated.seller.title',
      body: 'items.orderCreated.seller.body',
      href: '/orders/order-1',
      readAt: null,
      entityType: 'order',
      entityId: 'order-1',
      metadata: {
        orderNumber: 'FRG-100',
        listingTitle: 'Rare skin',
        role: 'seller',
      },
      createdAt: new Date(),
    });

    expect(telegramService.tryNotifyOfflineOrder).toHaveBeenCalledWith({
      recipientUserId: 'user-2',
      titleKey: 'items.orderCreated.seller.title',
      bodyKey: 'items.orderCreated.seller.body',
      notificationParams: {
        orderNumber: 'FRG-100',
        listingTitle: 'Rare skin',
      },
      href: 'https://fraggit.test/orders/order-1',
    });
    expect(
      chatNotificationQueue.enqueueOfflineOrderNotification,
    ).not.toHaveBeenCalled();
  });

  it('sends offline order email through mail queue', async () => {
    await service.sendOfflineOrderEmail({
      recipientEmail: 'bob@test.com',
      subject: 'Новый заказ',
      title: 'Новый заказ',
      body: 'Заказ #1',
      href: 'https://fraggit.test/orders/order-1',
    });

    expect(mailQueue.enqueue).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'bob@test.com',
        type: 'order_notification',
        subject: 'Новый заказ',
        html: expect.stringContaining('/orders/order-1'),
      }),
    );
  });
});
