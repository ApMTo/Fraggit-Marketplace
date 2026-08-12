import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { MediaUrlService } from '../../cloudinary/media-url.service';
import { ChatRateLimitService } from './chat-rate-limit.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

describe('MessageService', () => {
  let service: MessageService;
  let prisma: {
    message: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    conversation: {
      update: jest.Mock;
    };
    conversationParticipant: {
      findFirst: jest.Mock;
    };
    user: {
      findUnique: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let conversationService: {
    assertUserIsParticipant: jest.Mock;
  };
  let chatRateLimit: {
    assertCanSendMessage: jest.Mock;
  };
  let mediaUrl: {
    resolveInTree: jest.Mock;
  };

  const createdMessage = {
    id: 'msg-1',
    conversationId: 'conv-1',
    senderId: 'user-1',
    type: MessageType.TEXT,
    content: 'hello',
    metadata: null,
    createdAt: new Date('2026-07-09T10:00:00.000Z'),
    sender: {
      id: 'user-1',
      username: 'alice',
      displayName: 'Alice',
      avatarUrl: null,
    },
    attachments: [],
  };

  beforeEach(() => {
    prisma = {
      message: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      conversation: {
        update: jest.fn(),
      },
      conversationParticipant: {
        findFirst: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    conversationService = {
      assertUserIsParticipant: jest
        .fn()
        .mockResolvedValue(['user-1', 'user-2']),
    };

    chatRateLimit = {
      assertCanSendMessage: jest.fn().mockResolvedValue(undefined),
    };

    mediaUrl = {
      resolveInTree: jest.fn((value) => value),
    };

    service = new MessageService(
      prisma as unknown as PrismaService,
      conversationService as unknown as ConversationService,
      chatRateLimit as unknown as ChatRateLimitService,
      mediaUrl as unknown as MediaUrlService,
    );
  });

  describe('listMessages', () => {
    it('returns chronological page and next cursor when more exist', async () => {
      const older = {
        ...createdMessage,
        id: 'msg-0',
        createdAt: new Date('2026-07-09T09:00:00.000Z'),
        content: 'older',
      };
      const mid = {
        ...createdMessage,
        id: 'msg-1',
        createdAt: new Date('2026-07-09T10:00:00.000Z'),
        content: 'mid',
      };
      const newer = {
        ...createdMessage,
        id: 'msg-2',
        createdAt: new Date('2026-07-09T11:00:00.000Z'),
        content: 'newer',
      };

      // take = limit + 1, ordered desc
      prisma.message.findMany.mockResolvedValue([newer, mid, older]);

      const result = await service.listMessages('user-1', 'conv-1', {
        limit: 2,
      });

      expect(conversationService.assertUserIsParticipant).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
      );
      expect(result.hasMore).toBe(true);
      expect(result.items.map((item) => item.id)).toEqual(['msg-1', 'msg-2']);
      expect(result.nextBeforeMessageId).toBe('msg-1');
    });

    it('throws when cursor message is missing', async () => {
      prisma.message.findFirst.mockResolvedValue(null);

      await expect(
        service.listMessages('user-1', 'conv-1', {
          limit: 30,
          beforeMessageId: 'missing',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('sendTextMessage', () => {
    it('rate-limits, sanitizes, persists and bumps lastMessageAt', async () => {
      const tx = {
        message: {
          create: jest.fn().mockResolvedValue(createdMessage),
        },
        conversation: {
          update: jest.fn().mockResolvedValue({ id: 'conv-1' }),
        },
      };

      prisma.$transaction.mockImplementation(async (cb) => cb(tx));

      const result = await service.sendTextMessage({
        senderId: 'user-1',
        conversationId: 'conv-1',
        content: '  <b>hello</b>  ',
      });

      expect(chatRateLimit.assertCanSendMessage).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        message: createdMessage,
        participantIds: ['user-1', 'user-2'],
      });
      expect(tx.message.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: 'conv-1',
            senderId: 'user-1',
            type: MessageType.TEXT,
            content: 'hello',
          }),
        }),
      );
      expect(tx.conversation.update).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { lastMessageAt: createdMessage.createdAt },
      });
    });

    it('rejects empty content after sanitize', async () => {
      await expect(
        service.sendTextMessage({
          senderId: 'user-1',
          conversationId: 'conv-1',
          content: '   <br>   ',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('sendImageMessage', () => {
    it('rejects unsupported mime type', async () => {
      await expect(
        service.sendImageMessage({
          senderId: 'user-1',
          conversationId: 'conv-1',
          url: 'https://cdn.test/a.gif',
          mimeType: 'image/gif',
          size: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects non-https absolute attachment url', async () => {
      await expect(
        service.sendImageMessage({
          senderId: 'user-1',
          conversationId: 'conv-1',
          url: 'http://cdn.test/a.jpg',
          mimeType: 'image/jpeg',
          size: 100,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists image message with relative media path', async () => {
      const imageMessage = {
        ...createdMessage,
        type: MessageType.IMAGE,
        content: null,
        attachments: [
          {
            id: 'att-1',
            url: 'uploads/a.jpg',
            mimeType: 'image/jpeg',
            size: 100,
            width: 10,
            height: 10,
          },
        ],
      };

      prisma.$transaction.mockImplementation(async (cb) =>
        cb({
          message: {
            create: jest.fn().mockResolvedValue(imageMessage),
          },
          conversation: {
            update: jest.fn().mockResolvedValue({ id: 'conv-1' }),
          },
        }),
      );

      const result = await service.sendImageMessage({
        senderId: 'user-1',
        conversationId: 'conv-1',
        url: 'uploads/a.jpg',
        mimeType: 'image/jpeg',
        size: 100,
        width: 10,
        height: 10,
      });

      expect(result.message.type).toBe(MessageType.IMAGE);
      expect(result.message.attachments).toHaveLength(1);
      expect(result.participantIds).toEqual(['user-1', 'user-2']);
    });

    it('persists image message with attachment', async () => {
      const imageMessage = {
        ...createdMessage,
        type: MessageType.IMAGE,
        content: null,
        attachments: [
          {
            id: 'att-1',
            url: 'https://cdn.test/a.jpg',
            mimeType: 'image/jpeg',
            size: 100,
            width: 10,
            height: 10,
          },
        ],
      };

      prisma.$transaction.mockImplementation(async (cb) =>
        cb({
          message: {
            create: jest.fn().mockResolvedValue(imageMessage),
          },
          conversation: {
            update: jest.fn().mockResolvedValue({ id: 'conv-1' }),
          },
        }),
      );

      const result = await service.sendImageMessage({
        senderId: 'user-1',
        conversationId: 'conv-1',
        url: 'https://cdn.test/a.jpg',
        mimeType: 'image/jpeg',
        size: 100,
        width: 10,
        height: 10,
      });

      expect(result.message.type).toBe(MessageType.IMAGE);
      expect(result.message.attachments).toHaveLength(1);
      expect(result.participantIds).toEqual(['user-1', 'user-2']);
    });
  });

  describe('helpers', () => {
    it('returns other participant id', async () => {
      prisma.conversationParticipant.findFirst.mockResolvedValue({
        userId: 'user-2',
      });

      await expect(
        service.getOtherParticipantId('conv-1', 'user-1'),
      ).resolves.toBe('user-2');
    });

    it('throws when other participant is missing', async () => {
      prisma.conversationParticipant.findFirst.mockResolvedValue(null);

      await expect(
        service.getOtherParticipantId('conv-1', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
