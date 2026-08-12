import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ChatReadService } from './chat-read.service';
import { ConversationService } from './conversation.service';

describe('ChatReadService', () => {
  let service: ChatReadService;
  let prisma: {
    message: { findFirst: jest.Mock };
    conversationParticipant: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let conversationService: {
    assertUserIsParticipant: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      message: { findFirst: jest.fn() },
      conversationParticipant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    conversationService = {
      assertUserIsParticipant: jest
        .fn()
        .mockResolvedValue(['user-1', 'user-2']),
    };

    service = new ChatReadService(
      prisma as unknown as PrismaService,
      conversationService as unknown as ConversationService,
    );
  });

  it('updates read cursor when message exists and is newer', async () => {
    const message = {
      id: 'msg-2',
      createdAt: new Date('2026-07-09T12:00:00.000Z'),
    };

    prisma.message.findFirst.mockResolvedValue(message);
    prisma.conversationParticipant.findUnique.mockResolvedValue({
      lastReadMessageId: 'msg-1',
      lastReadMessage: {
        createdAt: new Date('2026-07-09T11:00:00.000Z'),
      },
    });
    prisma.conversationParticipant.update.mockResolvedValue({
      conversationId: 'conv-1',
      lastReadMessageId: 'msg-2',
      lastReadAt: message.createdAt,
    });

    const result = await service.markAsRead('user-1', 'conv-1', 'msg-2');

    expect(result).toEqual({
      conversationId: 'conv-1',
      lastReadMessageId: 'msg-2',
      lastReadAt: message.createdAt,
      participantIds: ['user-1', 'user-2'],
    });
    expect(prisma.conversationParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          lastReadMessageId: 'msg-2',
          lastReadAt: message.createdAt,
        },
      }),
    );
  });

  it('throws when message is not in conversation', async () => {
    prisma.message.findFirst.mockResolvedValue(null);

    await expect(
      service.markAsRead('user-1', 'conv-1', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects outdated read cursor', async () => {
    prisma.message.findFirst.mockResolvedValue({
      id: 'msg-1',
      createdAt: new Date('2026-07-09T10:00:00.000Z'),
    });
    prisma.conversationParticipant.findUnique.mockResolvedValue({
      lastReadMessageId: 'msg-2',
      lastReadMessage: {
        createdAt: new Date('2026-07-09T12:00:00.000Z'),
      },
    });

    await expect(
      service.markAsRead('user-1', 'conv-1', 'msg-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
