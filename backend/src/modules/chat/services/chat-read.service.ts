import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ConversationService } from './conversation.service';

export type MarkReadResult = {
  conversationId: string;
  lastReadMessageId: string;
  lastReadAt: Date;
  participantIds: string[];
};

@Injectable()
export class ChatReadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
  ) {}

  /**
   * Read status is stored as a cursor on ConversationParticipant.
   * This avoids updating every message row and scales better for long histories.
   */
  async markAsRead(
    userId: string,
    conversationId: string,
    lastReadMessageId: string,
  ): Promise<MarkReadResult> {
    const participantIds =
      await this.conversationService.assertUserIsParticipant(
        conversationId,
        userId,
      );

    const message = await this.prisma.message.findFirst({
      where: { id: lastReadMessageId, conversationId },
      select: { id: true, createdAt: true },
    });

    if (!message) {
      throw new NotFoundException('chat_message_not_found');
    }

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: {
        lastReadMessageId: true,
        lastReadMessage: {
          select: { createdAt: true },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('chat_participant_not_found');
    }

    if (
      participant.lastReadMessage &&
      participant.lastReadMessage.createdAt > message.createdAt
    ) {
      throw new BadRequestException('chat_read_cursor_outdated');
    }

    const updated = await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadMessageId: message.id,
        lastReadAt: message.createdAt,
      },
      select: {
        conversationId: true,
        lastReadMessageId: true,
        lastReadAt: true,
      },
    });

    if (!updated.lastReadMessageId || !updated.lastReadAt) {
      throw new BadRequestException('chat_read_update_failed');
    }

    return {
      conversationId: updated.conversationId,
      lastReadMessageId: updated.lastReadMessageId,
      lastReadAt: updated.lastReadAt,
      participantIds,
    };
  }
}
