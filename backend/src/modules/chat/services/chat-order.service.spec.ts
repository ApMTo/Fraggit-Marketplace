import { ConfigService } from '@nestjs/config';
import { MessageType, NotificationType } from '@prisma/client';
import { NotificationsService } from '../../notifications/notifications.service';
import { ChatGateway } from '../chat.gateway';
import { CHAT_SYSTEM_EVENT } from '../constants/chat.constants';
import { ChatNotificationService } from './chat-notification.service';
import { ChatOrderService } from './chat-order.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

describe('ChatOrderService', () => {
  let service: ChatOrderService;
  let conversationService: {
    findOrCreateDirectConversation: jest.Mock;
    getConversationParticipantIds: jest.Mock;
  };
  let messageService: { sendSystemMessage: jest.Mock };
  let configService: { get: jest.Mock };
  let chatGateway: {
    emitMessageToParticipants: jest.Mock;
    emitNotificationToUser: jest.Mock;
  };
  let notificationsService: { createMany: jest.Mock };
  let chatNotificationService: {
    notifyOfflineAboutOrderNotification: jest.Mock;
  };

  const systemMessage = {
    id: 'sys-1',
    conversationId: 'conv-1',
    senderId: null,
    type: MessageType.SYSTEM,
    content: 'Заказ #FRG-100 создан.',
    metadata: { event: CHAT_SYSTEM_EVENT.ORDER_CREATED },
    createdAt: new Date(),
    sender: null,
    attachments: [],
  };

  beforeEach(() => {
    conversationService = {
      findOrCreateDirectConversation: jest
        .fn()
        .mockResolvedValue({ id: 'conv-1', created: true }),
      getConversationParticipantIds: jest
        .fn()
        .mockResolvedValue(['buyer-1', 'seller-1']),
    };
    messageService = {
      sendSystemMessage: jest.fn().mockResolvedValue(systemMessage),
    };
    configService = {
      get: jest.fn().mockReturnValue('https://fraggit.test'),
    };
    chatGateway = {
      emitMessageToParticipants: jest.fn(),
      emitNotificationToUser: jest.fn(),
    };
    notificationsService = {
      createMany: jest.fn().mockResolvedValue([
        {
          id: 'n-seller',
          userId: 'seller-1',
          type: NotificationType.ORDER_CREATED,
          title: 'Новый заказ',
          body: 'body',
          href: '/orders/order-1',
          readAt: null,
          entityType: 'order',
          entityId: 'order-1',
          metadata: null,
          createdAt: new Date(),
        },
        {
          id: 'n-buyer',
          userId: 'buyer-1',
          type: NotificationType.ORDER_CREATED,
          title: 'Заказ оформлен',
          body: 'body',
          href: '/orders/order-1',
          readAt: null,
          entityType: 'order',
          entityId: 'order-1',
          metadata: null,
          createdAt: new Date(),
        },
      ]),
    };
    chatNotificationService = {
      notifyOfflineAboutOrderNotification: jest
        .fn()
        .mockResolvedValue(undefined),
    };

    service = new ChatOrderService(
      conversationService as unknown as ConversationService,
      messageService as unknown as MessageService,
      configService as unknown as ConfigService,
      chatGateway as unknown as ChatGateway,
      notificationsService as unknown as NotificationsService,
      chatNotificationService as unknown as ChatNotificationService,
    );
  });

  it('creates/reuses chat, writes system message, notifies and emits', async () => {
    const message = await service.onOrderCreated({
      orderId: 'order-1',
      orderNumber: 'FRG-100',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      listingId: 'listing-1',
      listingTitle: 'Rare skin',
    });

    expect(
      conversationService.findOrCreateDirectConversation,
    ).toHaveBeenCalledWith('buyer-1', 'seller-1');
    expect(messageService.sendSystemMessage).toHaveBeenCalledWith({
      conversationId: 'conv-1',
      content: 'Заказ #FRG-100 создан.',
      metadata: expect.objectContaining({
        event: CHAT_SYSTEM_EVENT.ORDER_CREATED,
        orderId: 'order-1',
        orderNumber: 'FRG-100',
        url: 'https://fraggit.test/orders/order-1',
        body: 'Заказ #FRG-100 создан.',
      }),
    });
    expect(chatGateway.emitMessageToParticipants).toHaveBeenCalledWith(
      ['buyer-1', 'seller-1'],
      message,
    );
    expect(notificationsService.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'seller-1',
          type: NotificationType.ORDER_CREATED,
        }),
        expect.objectContaining({
          userId: 'buyer-1',
          type: NotificationType.ORDER_CREATED,
        }),
      ]),
    );
    expect(chatGateway.emitNotificationToUser).toHaveBeenCalledTimes(2);
    expect(
      chatNotificationService.notifyOfflineAboutOrderNotification,
    ).toHaveBeenCalledTimes(2);
  });

  it('notifies buyer when credentials are submitted', async () => {
    notificationsService.createMany.mockResolvedValue([
      {
        id: 'n-buyer',
        userId: 'buyer-1',
        type: NotificationType.ORDER_CREDENTIALS,
        title: 'Данные по заказу',
        body: 'body',
        href: '/orders/order-1',
        readAt: null,
        entityType: 'order',
        entityId: 'order-1',
        metadata: null,
        createdAt: new Date(),
      },
    ]);

    await service.onOrderCredentialsSubmitted({
      orderId: 'order-1',
      orderNumber: 'FRG-100',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      listingId: 'listing-1',
      listingTitle: 'Rare skin',
    });

    expect(messageService.sendSystemMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          event: CHAT_SYSTEM_EVENT.ORDER_CREDENTIALS,
        }),
      }),
    );
    expect(notificationsService.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        userId: 'buyer-1',
        type: NotificationType.ORDER_CREDENTIALS,
      }),
    ]);
  });

  it('notifies buyer and seller when order is approved', async () => {
    notificationsService.createMany.mockResolvedValue([
      {
        id: 'n-seller',
        userId: 'seller-1',
        type: NotificationType.ORDER_APPROVED,
        title: 'Заказ завершён',
        body: 'body',
        href: '/orders/order-1',
        readAt: null,
        entityType: 'order',
        entityId: 'order-1',
        metadata: null,
        createdAt: new Date(),
      },
      {
        id: 'n-buyer',
        userId: 'buyer-1',
        type: NotificationType.ORDER_APPROVED,
        title: 'Заказ завершён',
        body: 'body',
        href: '/orders/order-1',
        readAt: null,
        entityType: 'order',
        entityId: 'order-1',
        metadata: null,
        createdAt: new Date(),
      },
    ]);

    await service.onOrderApproved({
      orderId: 'order-1',
      orderNumber: 'FRG-100',
      buyerId: 'buyer-1',
      sellerId: 'seller-1',
      listingId: 'listing-1',
      listingTitle: 'Rare skin',
    });

    expect(messageService.sendSystemMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          event: CHAT_SYSTEM_EVENT.ORDER_APPROVED,
        }),
      }),
    );
    expect(notificationsService.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'seller-1',
          type: NotificationType.ORDER_APPROVED,
        }),
        expect.objectContaining({
          userId: 'buyer-1',
          type: NotificationType.ORDER_APPROVED,
        }),
      ]),
    );
  });
});
