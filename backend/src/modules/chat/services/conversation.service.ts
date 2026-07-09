import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CONVERSATION_LIST_SELECT,
  ConversationListRow,
} from '../constants/chat.select';
import { FindConversationsQueryDto } from '../dto/chat.dto';
import { buildConversationPairKey } from '../utils/conversation-pair-key.util';
import { ChatAuthService } from './chat-auth.service';

export type ConversationListItem = {
  id: string;
  lastMessageAt: Date | null;
  createdAt: Date;
  otherParticipant: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  lastMessage: ConversationListRow['messages'][number] | null;
  unreadCount: number;
};

export type ConversationListResult = {
  items: ConversationListItem[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatAuth: ChatAuthService,
  ) {}

  async findOrCreateDirectConversation(
    currentUserId: string,
    otherUserId: string,
  ): Promise<{ id: string; created: boolean }> {
    this.chatAuth.assertNotSelf(currentUserId, otherUserId);

    const otherUser = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });

    if (!otherUser) {
      throw new NotFoundException('user_not_found');
    }

    const pairKey = buildConversationPairKey(currentUserId, otherUserId);

    const existing = await this.prisma.conversation.findUnique({
      where: { pairKey },
      select: { id: true },
    });

    if (existing) {
      return { id: existing.id, created: false };
    }

    const created = await this.prisma.conversation.create({
      data: {
        pairKey,
        participants: {
          create: [{ userId: currentUserId }, { userId: otherUserId }],
        },
      },
      select: { id: true },
    });

    return { id: created.id, created: true };
  }

  async getConversationParticipantIds(
    conversationId: string,
  ): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    return participants.map((participant) => participant.userId);
  }

  async assertUserIsParticipant(
    conversationId: string,
    userId: string,
  ): Promise<string[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participants: { select: { userId: true } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('chat_not_found');
    }

    const participantIds = conversation.participants.map(
      (participant) => participant.userId,
    );

    await this.chatAuth.assertParticipant(
      conversationId,
      userId,
      participantIds,
    );

    return participantIds;
  }

  async listConversations(
    userId: string,
    query: FindConversationsQueryDto,
  ): Promise<ConversationListResult> {
    const skip = (query.page - 1) * query.limit;

    const where: Prisma.ConversationWhereInput = {
      participants: {
        some: {
          userId,
          hiddenAt: null,
        },
      },
    };

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.AND = [
        {
          participants: {
            some: {
              userId,
              hiddenAt: null,
            },
          },
        },
        {
          participants: {
            some: {
              userId: { not: userId },
              hiddenAt: null,
              user: {
                OR: [
                  { username: { contains: search, mode: 'insensitive' } },
                  { displayName: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
      delete where.participants;
    }

    const [rows, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
        select: CONVERSATION_LIST_SELECT,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    const conversationIds = rows.map((row) => row.id);
    const unreadMap = await this.getUnreadCounts(userId, conversationIds);

    const items = rows.map((row) => this.mapConversationRow(userId, row, unreadMap));

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  private mapConversationRow(
    userId: string,
    row: ConversationListRow,
    unreadMap: Map<string, number>,
  ): ConversationListItem {
    const otherParticipant = row.participants.find(
      (participant) => participant.userId !== userId,
    );

    if (!otherParticipant) {
      throw new BadRequestException('chat_invalid_participants');
    }

    return {
      id: row.id,
      lastMessageAt: row.lastMessageAt,
      createdAt: row.createdAt,
      otherParticipant: otherParticipant.user,
      lastMessage: row.messages[0] ?? null,
      unreadCount: unreadMap.get(row.id) ?? 0,
    };
  }
  async getUnreadCounts(
    userId: string,
    conversationIds: string[],
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>();

    if (conversationIds.length === 0) {
      return result;
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ conversationId: string; unreadCount: bigint }>
    >`
      SELECT
        m."conversationId" AS "conversationId",
        COUNT(*)::bigint AS "unreadCount"
      FROM "Message" m
      INNER JOIN "ConversationParticipant" cp
        ON cp."conversationId" = m."conversationId"
        AND cp."userId" = ${userId}
      WHERE m."conversationId" IN (${Prisma.join(conversationIds)})
        AND (m."senderId" IS NULL OR m."senderId" <> ${userId})
        AND (
          cp."lastReadAt" IS NULL
          OR m."createdAt" > cp."lastReadAt"
        )
      GROUP BY m."conversationId"
    `;

    for (const row of rows) {
      result.set(row.conversationId, Number(row.unreadCount));
    }

    return result;
  }
}
