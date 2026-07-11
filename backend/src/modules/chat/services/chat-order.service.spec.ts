import { ConfigService } from '@nestjs/config';
import { MessageType } from '@prisma/client';
import { ChatGateway } from '../chat.gateway';
import { CHAT_SYSTEM_EVENT } from '../constants/chat.constants';
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
  let chatGateway: { emitMessageToParticipants: jest.Mock };

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
      sendSystemMessage: jest.fn().mockResolvedValue({
        id: 'sys-1',
        conversationId: 'conv-1',
        senderId: null,
        type: MessageType.SYSTEM,
        content: null,
        metadata: { event: CHAT_SYSTEM_EVENT.ORDER_CREATED },
        createdAt: new Date(),
        sender: null,
        attachments: [],
      }),
    };
    configService = {
      get: jest.fn().mockReturnValue('https://fraggit.test'),
    };
    chatGateway = {
      emitMessageToParticipants: jest.fn(),
    };

    service = new ChatOrderService(
      conversationService as unknown as ConversationService,
      messageService as unknown as MessageService,
      configService as unknown as ConfigService,
      chatGateway as unknown as ChatGateway,
    );
  });

  it('creates/reuses chat, writes system message and emits to participants', async () => {
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
  });
});
