import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ChatAuthService } from './chat-auth.service';
import { ConversationService } from './conversation.service';

describe('ConversationService', () => {
  let service: ConversationService;
  let prisma: {
    user: { findUnique: jest.Mock };
    conversation: {
      findUnique: jest.Mock;
      create: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    conversationParticipant: { findMany: jest.Mock };
    $queryRaw: jest.Mock;
  };
  let chatAuth: {
    assertNotSelf: jest.Mock;
    assertParticipant: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      conversation: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      conversationParticipant: { findMany: jest.fn() },
      $queryRaw: jest.fn(),
    };

    chatAuth = {
      assertNotSelf: jest.fn(),
      assertParticipant: jest.fn().mockResolvedValue(undefined),
    };

    service = new ConversationService(
      prisma as unknown as PrismaService,
      chatAuth as unknown as ChatAuthService,
    );
  });

  describe('findOrCreateDirectConversation', () => {
    it('rejects self chat via auth helper', async () => {
      chatAuth.assertNotSelf.mockImplementation(() => {
        throw new BadRequestException('chat_cannot_message_self');
      });

      await expect(
        service.findOrCreateDirectConversation('user-1', 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns existing conversation when pairKey already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
      prisma.conversation.findUnique.mockResolvedValue({ id: 'conv-1' });

      await expect(
        service.findOrCreateDirectConversation('user-1', 'user-2'),
      ).resolves.toEqual({ id: 'conv-1', created: false });

      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it('creates conversation with both participants when missing', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-2' });
      prisma.conversation.findUnique.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue({ id: 'conv-new' });

      await expect(
        service.findOrCreateDirectConversation('user-1', 'user-2'),
      ).resolves.toEqual({ id: 'conv-new', created: true });

      expect(prisma.conversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            pairKey: 'user-1:user-2',
            participants: {
              create: [{ userId: 'user-1' }, { userId: 'user-2' }],
            },
          }),
        }),
      );
    });

    it('throws when other user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findOrCreateDirectConversation('user-1', 'missing'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('assertUserIsParticipant', () => {
    it('returns participant ids when user is allowed', async () => {
      prisma.conversation.findUnique.mockResolvedValue({
        id: 'conv-1',
        participants: [{ userId: 'user-1' }, { userId: 'user-2' }],
      });

      await expect(
        service.assertUserIsParticipant('conv-1', 'user-1'),
      ).resolves.toEqual(['user-1', 'user-2']);

      expect(chatAuth.assertParticipant).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
        ['user-1', 'user-2'],
      );
    });

    it('throws when conversation is missing', async () => {
      prisma.conversation.findUnique.mockResolvedValue(null);

      await expect(
        service.assertUserIsParticipant('missing', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listConversations', () => {
    it('maps other participant, last message and unread counts', async () => {
      prisma.conversation.findMany.mockResolvedValue([
        {
          id: 'conv-1',
          lastMessageAt: new Date('2026-07-09T12:00:00.000Z'),
          createdAt: new Date('2026-07-01T00:00:00.000Z'),
          participants: [
            {
              userId: 'user-1',
              lastReadAt: null,
              lastReadMessageId: null,
              user: {
                id: 'user-1',
                username: 'alice',
                displayName: 'Alice',
                avatarUrl: null,
              },
            },
            {
              userId: 'user-2',
              lastReadAt: null,
              lastReadMessageId: null,
              user: {
                id: 'user-2',
                username: 'bob',
                displayName: 'Bob',
                avatarUrl: null,
              },
            },
          ],
          messages: [
            {
              id: 'msg-1',
              type: 'TEXT',
              content: 'hi',
              metadata: null,
              createdAt: new Date('2026-07-09T12:00:00.000Z'),
              senderId: 'user-2',
              sender: {
                id: 'user-2',
                username: 'bob',
                displayName: 'Bob',
                avatarUrl: null,
              },
            },
          ],
        },
      ]);
      prisma.conversation.count.mockResolvedValue(1);
      prisma.$queryRaw.mockResolvedValue([
        { conversationId: 'conv-1', unreadCount: 3n },
      ]);

      const result = await service.listConversations('user-1', {
        page: 1,
        limit: 20,
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        id: 'conv-1',
        unreadCount: 3,
        otherParticipant: {
          id: 'user-2',
          username: 'bob',
          displayName: 'Bob',
        },
        lastMessage: expect.objectContaining({ id: 'msg-1', content: 'hi' }),
      });
    });
  });
});
