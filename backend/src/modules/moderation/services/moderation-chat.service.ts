import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationActionType,
  ModerationTargetType,
  Prisma,
  ReportTargetType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  assertCanHandleReportTarget,
  assertCanViewTicketPrivateChat,
  assertNotOrderDisputeParty,
} from '../policies/moderation-policy';
import {
  CHAT_USER_SELECT,
  MESSAGE_SELECT,
} from '../../chat/constants/chat.select';
import { buildConversationPairKey } from '../../chat/utils/conversation-pair-key.util';
import { ModerationAuditService } from './moderation-audit.service';

/**
 * Reading private conversations is only reachable through a MESSAGE report and
 * is limited to a window around the reported message. Every read is audited.
 */
@Injectable()
export class ModerationChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
  ) {}

  async findReportedConversation(
    actorId: string,
    reportId: string,
    context: number,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, targetType: true, targetId: true },
    });

    if (!report) {
      throw new NotFoundException({ code: 'errors.report_not_found' });
    }

    if (report.targetType === ReportTargetType.LOT) {
      return this.findLotPartiesConversation(actorId, report, context);
    }

    if (report.targetType !== ReportTargetType.MESSAGE) {
      throw new BadRequestException({
        code: 'errors.report_target_not_message',
      });
    }

    const message = await this.prisma.message.findUnique({
      where: { id: report.targetId },
      select: MESSAGE_SELECT,
    });

    if (!message) {
      throw new NotFoundException({ code: 'errors.report_target_not_found' });
    }

    const [participants, before, after] = await Promise.all([
      this.prisma.conversationParticipant.findMany({
        where: { conversationId: message.conversationId },
        orderBy: { joinedAt: 'asc' },
        select: { userId: true, user: { select: CHAT_USER_SELECT } },
      }),
      this.findNeighbours(message, context, 'before'),
      this.findNeighbours(message, context, 'after'),
    ]);

    await this.audit.append({
      actorId,
      actionType: ModerationActionType.CHAT_VIEW,
      targetType: ModerationTargetType.CONVERSATION,
      targetId: message.conversationId,
      reason: 'chat_view_report',
      metadata: { reportId: report.id, messageId: message.id },
    });

    return {
      conversationId: message.conversationId,
      reportedMessageId: message.id,
      participants: participants.map((p) => p.user),
      messages: [...before, message, ...after],
    };
  }

  private async findLotPartiesConversation(
    actorId: string,
    report: { id: string; targetId: string },
    context: number,
  ) {
    const order = await this.prisma.order.findFirst({
      where: { lotId: report.targetId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!order) {
      return {
        conversationId: null,
        reportedMessageId: null,
        participants: [],
        messages: [],
        emptyReason: 'no_order' as const,
      };
    }

    return this.findOrderPartiesConversation(actorId, order.id, context, {
      reportId: report.id,
      lotId: report.targetId,
      reason: 'chat_view_lot_report',
    });
  }

  async findTicketPartiesConversation(
    actorId: string,
    actorRole: UserRole,
    ticketId: string,
    context: number,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        orderId: true,
        assigneeId: true,
        order: { select: { buyerId: true, sellerId: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException({ code: 'errors.ticket_not_found' });
    }

    assertNotOrderDisputeParty(actorId, ticket.order);
    assertCanViewTicketPrivateChat(actorRole, actorId, ticket);

    if (!ticket.orderId) {
      throw new NotFoundException({ code: 'errors.ticket_not_found' });
    }

    return this.findOrderPartiesConversation(actorId, ticket.orderId, context, {
      ticketId: ticket.id,
      reason: 'chat_view_order_ticket',
    });
  }

  private async findOrderPartiesConversation(
    actorId: string,
    orderId: string,
    context: number,
    audit: {
      reason: string;
      reportId?: string;
      lotId?: string;
      ticketId?: string;
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true, sellerId: true },
    });

    if (!order) {
      return {
        conversationId: null,
        reportedMessageId: null,
        participants: [],
        messages: [],
        emptyReason: 'no_order' as const,
      };
    }

    const pairKey = buildConversationPairKey(order.buyerId, order.sellerId);
    const conversation = await this.prisma.conversation.findUnique({
      where: { pairKey },
      select: { id: true },
    });

    if (!conversation) {
      return {
        conversationId: null,
        reportedMessageId: null,
        participants: [],
        messages: [],
        emptyReason: 'no_conversation' as const,
      };
    }

    const take = Math.max(1, context);
    const messages = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: MESSAGE_SELECT,
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: conversation.id },
      orderBy: { joinedAt: 'asc' },
      select: { userId: true, user: { select: CHAT_USER_SELECT } },
    });

    await this.audit.append({
      actorId,
      actionType: ModerationActionType.CHAT_VIEW,
      targetType: ModerationTargetType.CONVERSATION,
      targetId: conversation.id,
      reason: audit.reason,
      metadata: {
        orderId,
        reportId: audit.reportId,
        lotId: audit.lotId,
        ticketId: audit.ticketId,
      },
    });

    return {
      conversationId: conversation.id,
      reportedMessageId: null,
      participants: participants.map((p) => p.user),
      messages: messages.reverse(),
      emptyReason: null,
    };
  }

  private async findNeighbours(
    message: { id: string; conversationId: string; createdAt: Date },
    context: number,
    direction: 'before' | 'after',
  ) {
    if (context <= 0) {
      return [];
    }

    const isBefore = direction === 'before';
    const order: Prisma.SortOrder = isBefore ? 'desc' : 'asc';
    const boundary = isBefore
      ? { lt: message.createdAt }
      : { gt: message.createdAt };
    const tieBreaker = isBefore ? { lt: message.id } : { gt: message.id };

    const rows = await this.prisma.message.findMany({
      where: {
        conversationId: message.conversationId,
        OR: [
          { createdAt: boundary },
          { createdAt: message.createdAt, id: tieBreaker },
        ],
      },
      orderBy: [{ createdAt: order }, { id: order }],
      take: context,
      select: MESSAGE_SELECT,
    });

    return isBefore ? rows.reverse() : rows;
  }

  async listUserReportConversations(
    actorId: string,
    actorRole: UserRole,
    reportId: string,
  ) {
    const report = await this.requireUserReport(actorId, actorRole, reportId);

    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId: report.targetId } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
      select: {
        id: true,
        updatedAt: true,
        participants: {
          orderBy: { joinedAt: 'asc' },
          select: { user: { select: CHAT_USER_SELECT } },
        },
        messages: {
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          take: 1,
          select: {
            content: true,
            type: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      items: conversations.map((conversation) => ({
        conversationId: conversation.id,
        updatedAt: conversation.updatedAt,
        participants: conversation.participants.map((p) => p.user),
        lastMessage: conversation.messages[0] ?? null,
      })),
    };
  }

  async findUserReportConversation(
    actorId: string,
    actorRole: UserRole,
    reportId: string,
    conversationId: string,
    context: number,
  ) {
    const report = await this.requireUserReport(actorId, actorRole, reportId);

    const membership = await this.prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: report.targetId,
      },
      select: { conversationId: true },
    });

    if (!membership) {
      throw new NotFoundException({ code: 'errors.conversation_not_found' });
    }

    const take = Math.max(1, context);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take,
      select: MESSAGE_SELECT,
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      orderBy: { joinedAt: 'asc' },
      select: { userId: true, user: { select: CHAT_USER_SELECT } },
    });

    await this.audit.append({
      actorId,
      actionType: ModerationActionType.CHAT_VIEW,
      targetType: ModerationTargetType.CONVERSATION,
      targetId: conversationId,
      reason: 'chat_view_user_report',
      metadata: { reportId: report.id, targetUserId: report.targetId },
    });

    return {
      conversationId,
      reportedMessageId: null,
      participants: participants.map((p) => p.user),
      messages: messages.reverse(),
      emptyReason: null,
    };
  }

  private async requireUserReport(
    actorId: string,
    actorRole: UserRole,
    reportId: string,
  ) {
    void actorId;

    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, targetType: true, targetId: true },
    });

    if (!report) {
      throw new NotFoundException({ code: 'errors.report_not_found' });
    }

    if (report.targetType !== ReportTargetType.USER) {
      throw new BadRequestException({
        code: 'errors.report_target_not_user',
      });
    }

    assertCanHandleReportTarget(actorRole, report.targetType);

    return report;
  }
}
