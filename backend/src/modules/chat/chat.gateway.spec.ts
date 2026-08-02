import { MessageType } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';
import { AuthUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../auth/enums/roles.enum';
import { ChatGateway } from './chat.gateway';
import { CHAT_WS_EVENTS } from './constants/chat.constants';
import { ChatAuthService } from './services/chat-auth.service';
import { ChatNotificationService } from './services/chat-notification.service';
import { ChatPresenceService } from './services/chat-presence.service';
import { ChatReadService } from './services/chat-read.service';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatAuthService: { authenticateHandshake: jest.Mock };
  let chatPresenceService: {
    setOnline: jest.Mock;
    setOffline: jest.Mock;
    refreshOnline: jest.Mock;
  };
  let conversationService: { getConversationParticipantIds: jest.Mock };
  let messageService: { sendTextMessage: jest.Mock };
  let chatReadService: { markAsRead: jest.Mock };
  let chatNotificationService: { notifyAboutNewMessage: jest.Mock };
  let logger: {
    setContext: jest.Mock;
    info: jest.Mock;
    warn: jest.Mock;
  };

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

  beforeEach(() => {
    chatAuthService = {
      authenticateHandshake: jest.fn().mockResolvedValue(user),
    };
    chatPresenceService = {
      setOnline: jest.fn().mockResolvedValue(undefined),
      setOffline: jest.fn().mockResolvedValue(undefined),
      refreshOnline: jest.fn().mockResolvedValue(undefined),
    };
    conversationService = {
      getConversationParticipantIds: jest
        .fn()
        .mockResolvedValue(['user-1', 'user-2']),
    };
    messageService = {
      sendTextMessage: jest.fn().mockResolvedValue(message),
    };
    chatReadService = {
      markAsRead: jest.fn(),
    };
    chatNotificationService = {
      notifyAboutNewMessage: jest.fn().mockResolvedValue(undefined),
    };
    logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    gateway = new ChatGateway(
      chatAuthService as unknown as ChatAuthService,
      chatPresenceService as unknown as ChatPresenceService,
      conversationService as unknown as ConversationService,
      messageService as unknown as MessageService,
      chatReadService as unknown as ChatReadService,
      chatNotificationService as unknown as ChatNotificationService,
      logger as unknown as PinoLogger,
    );

    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });

    gateway.server = {
      to,
      in: jest.fn().mockReturnValue({
        fetchSockets: jest.fn().mockResolvedValue([]),
      }),
    } as never;

    (gateway as unknown as { __emit: jest.Mock; __to: jest.Mock }).__emit =
      emit;
    (gateway as unknown as { __emit: jest.Mock; __to: jest.Mock }).__to = to;
  });

  it('authenticates connection and marks user online', async () => {
    const client = {
      id: 'socket-1',
      handshake: { headers: { cookie: 'access_token=token' } },
      data: {} as { user?: AuthUser },
      join: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(chatAuthService.authenticateHandshake).toHaveBeenCalledWith(
      client.handshake,
    );
    expect(client.join).toHaveBeenCalledWith('user:user-1');
    expect(chatPresenceService.setOnline).toHaveBeenCalledWith('user-1');
    expect(client.data.user).toEqual(user);
  });

  it('rejects invalid handshake', async () => {
    chatAuthService.authenticateHandshake.mockRejectedValue(new Error('nope'));

    const client = {
      id: 'socket-2',
      handshake: { headers: {} },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    };

    await gateway.handleConnection(client as never);

    expect(client.emit).toHaveBeenCalledWith(CHAT_WS_EVENTS.ERROR, {
      code: 'chat_auth_failed',
    });
    expect(client.disconnect).toHaveBeenCalledWith(true);
  });

  it('sends message to all participants and notifies offline flow', async () => {
    const client = {
      id: 'socket-1',
      data: { user },
      emit: jest.fn(),
    };

    const result = await gateway.handleMessageSend(client as never, {
      conversationId: 'conv-1',
      content: 'hello',
    });

    expect(messageService.sendTextMessage).toHaveBeenCalledWith({
      senderId: 'user-1',
      conversationId: 'conv-1',
      content: 'hello',
    });
    expect(chatNotificationService.notifyAboutNewMessage).toHaveBeenCalledWith(
      message,
      'Alice',
    );
    expect(result).toEqual({ message });

    const helpers = gateway as unknown as {
      __to: jest.Mock;
      __emit: jest.Mock;
    };
    expect(helpers.__to).toHaveBeenCalledWith('user:user-1');
    expect(helpers.__to).toHaveBeenCalledWith('user:user-2');
    expect(client.emit).toHaveBeenCalledWith(CHAT_WS_EVENTS.MESSAGE_SENT, {
      message,
    });
  });

  it('marks offline only when no other sockets remain', async () => {
    const client = {
      id: 'socket-1',
      data: { user },
    };

    await gateway.handleDisconnect(client as never);

    expect(chatPresenceService.setOffline).toHaveBeenCalledWith('user-1');
  });
});
