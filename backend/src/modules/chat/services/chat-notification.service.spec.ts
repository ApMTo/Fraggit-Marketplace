import { ConfigService } from '@nestjs/config';
import { MessageType } from '@prisma/client';
import { ChatMessage } from '../constants/chat.select';
import { ChatNotificationQueueService } from './chat-notification-queue.service';
import { ChatNotificationService } from './chat-notification.service';
import { ChatPresenceService } from './chat-presence.service';
import { MessageService } from './message.service';
import { MailQueueService } from '../../mail/mail-queue.service';

describe('ChatNotificationService', () => {
  let service: ChatNotificationService;
  let chatPresence: { isOnline: jest.Mock };
  let chatNotificationQueue: {
    enqueueOfflineNotification: jest.Mock;
    enqueueOfflineOrderNotification: jest.Mock;
  };
  let messageService: {
    getOtherParticipantId: jest.Mock;
    getUserEmail: jest.Mock;
  };
  let mailQueue: { enqueue: jest.Mock };
  let configService: { get: jest.Mock };

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

  beforeEach(() => {
    chatPresence = { isOnline: jest.fn() };
    chatNotificationQueue = {
      enqueueOfflineNotification: jest.fn().mockResolvedValue(undefined),
      enqueueOfflineOrderNotification: jest.fn().mockResolvedValue(undefined),
    };
    messageService = {
      getOtherParticipantId: jest.fn().mockResolvedValue('user-2'),
      getUserEmail: jest.fn().mockResolvedValue('bob@test.com'),
    };
    mailQueue = { enqueue: jest.fn().mockResolvedValue(undefined) };
    configService = {
      get: jest.fn().mockReturnValue('https://fraggit.test'),
    };

    service = new ChatNotificationService(
      chatPresence as unknown as ChatPresenceService,
      chatNotificationQueue as unknown as ChatNotificationQueueService,
      messageService as unknown as MessageService,
      mailQueue as unknown as MailQueueService,
      configService as unknown as ConfigService,
    );
  });

  it('skips notification for system messages without sender', async () => {
    await service.notifyAboutNewMessage(
      { ...message, senderId: null },
      'Alice',
    );

    expect(chatPresence.isOnline).not.toHaveBeenCalled();
    expect(
      chatNotificationQueue.enqueueOfflineNotification,
    ).not.toHaveBeenCalled();
  });

  it('skips email queue when recipient is online', async () => {
    chatPresence.isOnline.mockResolvedValue(true);

    await service.notifyAboutNewMessage(message, 'Alice');

    expect(chatPresence.isOnline).toHaveBeenCalledWith('user-2');
    expect(
      chatNotificationQueue.enqueueOfflineNotification,
    ).not.toHaveBeenCalled();
  });

  it('enqueues offline notification when recipient is offline', async () => {
    chatPresence.isOnline.mockResolvedValue(false);

    await service.notifyAboutNewMessage(message, 'Alice');

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
      title: 'Новый заказ',
      body: 'Заказ #FRG-100',
      href: '/orders/order-1',
      readAt: null,
      entityType: 'order',
      entityId: 'order-1',
      metadata: null,
      createdAt: new Date(),
    });

    expect(
      chatNotificationQueue.enqueueOfflineOrderNotification,
    ).toHaveBeenCalledWith({
      recipientUserId: 'user-2',
      recipientEmail: 'bob@test.com',
      subject: 'Новый заказ',
      title: 'Новый заказ',
      body: 'Заказ #FRG-100',
      href: 'https://fraggit.test/orders/order-1',
    });
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
