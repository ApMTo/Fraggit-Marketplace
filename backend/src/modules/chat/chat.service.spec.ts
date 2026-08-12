import { MessageType } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../auth/enums/roles.enum';
import { ChatService } from './chat.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatOrderService } from './services/chat-order.service';
import { ChatReadService } from './services/chat-read.service';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';

describe('ChatService', () => {
  let service: ChatService;
  let conversationService: {
    listConversations: jest.Mock;
    findOrCreateDirectConversation: jest.Mock;
    getConversationParticipantIds: jest.Mock;
  };
  let messageService: {
    listMessages: jest.Mock;
    sendTextMessage: jest.Mock;
    sendImageMessage: jest.Mock;
  };
  let chatReadService: { markAsRead: jest.Mock };
  let chatNotificationService: { notifyAboutNewMessage: jest.Mock };
  let chatOrderService: { onOrderCreated: jest.Mock };
  let chatGateway: { emitMessageToParticipants: jest.Mock };

  const user: AuthUser = {
    id: 'user-1',
    email: 'alice@test.com',
    role: UserRole.USER,
    username: 'alice',
    displayName: 'Alice',
  };

  const message = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    type: MessageType.TEXT,
    content: 'hello',
    metadata: null,
    createdAt: new Date(),
    sender: {
      id: 'user-1',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
    },
    attachments: [],
  };

  const participantIds = ['user-1', 'user-2'];

  beforeEach(() => {
    conversationService = {
      listConversations: jest
        .fn()
        .mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 }),
      findOrCreateDirectConversation: jest
        .fn()
        .mockResolvedValue({ id: 'conv-1', created: true }),
      getConversationParticipantIds: jest
        .fn()
        .mockResolvedValue(['user-1', 'user-2']),
    };
    messageService = {
      listMessages: jest.fn().mockResolvedValue({
        items: [],
        hasMore: false,
        nextBeforeMessageId: null,
      }),
      sendTextMessage: jest.fn().mockResolvedValue({ message, participantIds }),
      sendImageMessage: jest.fn().mockResolvedValue({
        message: {
          ...message,
          type: MessageType.IMAGE,
          content: null,
        },
        participantIds,
      }),
    };
    chatReadService = {
      markAsRead: jest.fn().mockResolvedValue({
        conversationId: 'conv-1',
        lastReadMessageId: 'msg-1',
        lastReadAt: new Date(),
      }),
    };
    chatNotificationService = {
      notifyAboutNewMessage: jest.fn().mockResolvedValue(undefined),
    };
    chatOrderService = {
      onOrderCreated: jest.fn().mockResolvedValue(message),
    };
    chatGateway = {
      emitMessageToParticipants: jest.fn(),
    };
    const logger = {
      setContext: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };

    service = new ChatService(
      conversationService as unknown as ConversationService,
      messageService as unknown as MessageService,
      chatReadService as unknown as ChatReadService,
      chatNotificationService as unknown as ChatNotificationService,
      chatOrderService as unknown as ChatOrderService,
      chatGateway as never,
      logger as unknown as PinoLogger,
    );
  });

  it('delegates listConversations', async () => {
    await service.listConversations(user, { page: 1, limit: 20 });
    expect(conversationService.listConversations).toHaveBeenCalledWith(
      'user-1',
      { page: 1, limit: 20 },
    );
  });

  it('starts conversation for participant', async () => {
    await expect(
      service.startConversation(user, { participantUserId: 'user-2' }),
    ).resolves.toEqual({ id: 'conv-1', created: true });
  });

  it('sends text and triggers offline notification flow', async () => {
    const result = await service.sendTextMessage(user, 'conv-1', {
      content: 'hello',
    });

    expect(messageService.sendTextMessage).toHaveBeenCalledWith({
      senderId: 'user-1',
      conversationId: 'conv-1',
      content: 'hello',
    });
    expect(
      conversationService.getConversationParticipantIds,
    ).not.toHaveBeenCalled();
    expect(chatGateway.emitMessageToParticipants).toHaveBeenCalledWith(
      participantIds,
      message,
    );
    expect(chatNotificationService.notifyAboutNewMessage).toHaveBeenCalledWith(
      message,
      'Alice',
      participantIds,
    );
    expect(result).toEqual(message);
  });

  it('sends image and triggers notification', async () => {
    await service.sendImageMessage(user, 'conv-1', {
      url: 'https://cdn.test/a.jpg',
      mimeType: 'image/jpeg',
      size: 100,
    });

    expect(messageService.sendImageMessage).toHaveBeenCalled();
    expect(chatGateway.emitMessageToParticipants).toHaveBeenCalled();
    expect(chatNotificationService.notifyAboutNewMessage).toHaveBeenCalled();
  });

  it('marks conversation as read', async () => {
    await service.markAsRead(user, 'conv-1', { lastReadMessageId: 'msg-1' });

    expect(chatReadService.markAsRead).toHaveBeenCalledWith(
      'user-1',
      'conv-1',
      'msg-1',
    );
  });
});
