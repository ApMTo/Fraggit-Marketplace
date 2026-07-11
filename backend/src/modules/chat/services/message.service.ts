import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MessageType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CHAT_USER_SELECT,
  ChatMessage,
  MESSAGE_SELECT,
} from '../constants/chat.select';
import { FindMessagesQueryDto } from '../dto/chat.dto';
import { sanitizeMessageText } from '../utils/sanitize-message.util';
import { ChatRateLimitService } from './chat-rate-limit.service';
import { ConversationService } from './conversation.service';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export type MessageListResult = {
  items: ChatMessage[];
  hasMore: boolean;
  nextBeforeMessageId: string | null;
};

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversationService: ConversationService,
    private readonly chatRateLimit: ChatRateLimitService,
  ) {}

  async listMessages(
    userId: string,
    conversationId: string,
    query: FindMessagesQueryDto,
  ): Promise<MessageListResult> {
    await this.conversationService.assertUserIsParticipant(
      conversationId,
      userId,
    );

    const where: Prisma.MessageWhereInput = { conversationId };

    if (query.beforeMessageId) {
      const cursorMessage = await this.prisma.message.findFirst({
        where: { id: query.beforeMessageId, conversationId },
        select: { createdAt: true, id: true },
      });

      if (!cursorMessage) {
        throw new NotFoundException('chat_message_not_found');
      }

      where.OR = [
        { createdAt: { lt: cursorMessage.createdAt } },
        {
          createdAt: cursorMessage.createdAt,
          id: { lt: cursorMessage.id },
        },
      ];
    }

    const rows = await this.prisma.message.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: query.limit + 1,
      select: MESSAGE_SELECT,
    });

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    const items = pageRows.reverse();
    const nextBeforeMessageId = hasMore ? (items[0]?.id ?? null) : null;

    return {
      items,
      hasMore,
      nextBeforeMessageId,
    };
  }

  async sendTextMessage(params: {
    senderId: string;
    conversationId: string;
    content: string;
  }): Promise<ChatMessage> {
    await this.chatRateLimit.assertCanSendMessage(params.senderId);
    await this.conversationService.assertUserIsParticipant(
      params.conversationId,
      params.senderId,
    );

    const content = sanitizeMessageText(params.content);

    if (!content) {
      throw new BadRequestException('chat_message_empty');
    }

    return this.persistMessage({
      conversationId: params.conversationId,
      senderId: params.senderId,
      type: MessageType.TEXT,
      content,
    });
  }

  async sendImageMessage(params: {
    senderId: string;
    conversationId: string;
    url: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
  }): Promise<ChatMessage> {
    await this.chatRateLimit.assertCanSendMessage(params.senderId);
    await this.conversationService.assertUserIsParticipant(
      params.conversationId,
      params.senderId,
    );

    if (!ALLOWED_IMAGE_MIME_TYPES.has(params.mimeType)) {
      throw new BadRequestException('invalid_file_type');
    }

    if (!params.url.startsWith('https://')) {
      throw new BadRequestException('chat_invalid_attachment_url');
    }

    return this.persistMessage({
      conversationId: params.conversationId,
      senderId: params.senderId,
      type: MessageType.IMAGE,
      attachments: {
        create: {
          url: params.url,
          mimeType: params.mimeType,
          size: params.size,
          width: params.width,
          height: params.height,
        },
      },
    });
  }

  async sendSystemMessage(params: {
    conversationId: string;
    metadata: Prisma.InputJsonValue;
  }): Promise<ChatMessage> {
    return this.persistMessage({
      conversationId: params.conversationId,
      senderId: null,
      type: MessageType.SYSTEM,
      metadata: params.metadata,
    });
  }

  async getMessageById(messageId: string): Promise<ChatMessage | null> {
    return this.prisma.message.findUnique({
      where: { id: messageId },
      select: MESSAGE_SELECT,
    });
  }

  private async persistMessage(params: {
    conversationId: string;
    senderId: string | null;
    type: MessageType;
    content?: string;
    metadata?: Prisma.InputJsonValue;
    attachments?: Prisma.MessageAttachmentCreateNestedManyWithoutMessageInput;
  }): Promise<ChatMessage> {
    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId: params.conversationId,
          senderId: params.senderId,
          type: params.type,
          content: params.content,
          metadata: params.metadata,
          attachments: params.attachments,
        },
        select: MESSAGE_SELECT,
      });

      await tx.conversation.update({
        where: { id: params.conversationId },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    return message;
  }

  async getOtherParticipantId(
    conversationId: string,
    currentUserId: string,
  ): Promise<string> {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: { not: currentUserId },
      },
      select: { userId: true },
    });

    if (!participant) {
      throw new NotFoundException('chat_participant_not_found');
    }

    return participant.userId;
  }

  async getUserEmail(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      throw new NotFoundException('user_not_found');
    }

    return user.email;
  }

  async getUserPreview(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: CHAT_USER_SELECT,
    });
  }
}
