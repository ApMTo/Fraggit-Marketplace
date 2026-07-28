import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationActionType,
  ModerationTargetType,
  OrderStatus,
  Prisma,
  TicketResolution,
  TicketStatus,
  TicketPriority,
  TicketType,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RoleHierarchy } from '../../auth/enums/roles.enum';
import { OrderCompletionService } from '../../orders/services/order-completion.service';
import {
  assertNotOrderDisputeParty,
  assertTicketAssigneeIsStaff,
} from '../policies/moderation-policy';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  FindTicketsQueryDto,
  RequestTicketVerdictDto,
  ResolveTicketDto,
  UpdateTicketDto,
} from '../dto/moderation-tickets.dto';
import { MOD_TICKET_LIST_SELECT } from '../constants/moderation.select';
import { ModerationAuditService } from './moderation-audit.service';
import { ModerationLotDisputeService } from './moderation-lot-dispute.service';
import { ModerationNotificationsService } from './moderation-notifications.service';

const OPEN_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_USER,
  TicketStatus.AWAITING_VERDICT,
];

const DISPUTABLE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.AWAITING_BUYER_CONFIRMATION,
];

@Injectable()
export class ModerationTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
    private readonly orderCompletion: OrderCompletionService,
    private readonly notifications: ModerationNotificationsService,
    private readonly lotDisputes: ModerationLotDisputeService,
  ) {}

  async create(reporterId: string, dto: CreateTicketDto) {
    if (dto.type === TicketType.ORDER_DISPUTE) {
      return this.createOrderDispute(reporterId, dto);
    }

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          type: dto.type,
          orderId: dto.orderId ?? null,
          reporterId,
          subject: dto.subject.trim(),
          body: dto.body.trim(),
          priority: dto.priority,
        },
        select: MOD_TICKET_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId: reporterId,
          actionType: ModerationActionType.TICKET_CREATE,
          targetType: ModerationTargetType.TICKET,
          targetId: created.id,
          reason: 'ticket_created',
          after: { type: created.type, status: created.status },
        },
        tx,
      );

      return created;
    });

    return { ticket };
  }

  async findTickets(query: FindTicketsQueryDto) {
    const where: Prisma.TicketWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: MOD_TICKET_LIST_SELECT,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  async findById(ticketId: string, viewerId: string, viewerRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        ...MOD_TICKET_LIST_SELECT,
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            authorId: true,
            body: true,
            isInternal: true,
            createdAt: true,
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException({ code: 'errors.ticket_not_found' });
    }

    const isStaff =
      RoleHierarchy[viewerRole] >= RoleHierarchy[UserRole.MODERATOR];

    if (!isStaff && ticket.reporterId !== viewerId) {
      throw new ForbiddenException({ code: 'errors.ticket_forbidden' });
    }

    if (
      ticket.type === TicketType.ORDER_DISPUTE &&
      OPEN_TICKET_STATUSES.includes(ticket.status)
    ) {
      try {
        await this.lotDisputes.ensureRoomForTicket(ticketId);
      } catch {
        // Room creation is best-effort; mediation GET will retry.
      }
    }

    if (!isStaff) {
      return {
        ...ticket,
        messages: ticket.messages.filter((m) => !m.isInternal),
      };
    }

    return ticket;
  }

  async update(actorId: string, ticketId: string, dto: UpdateTicketDto) {
    const ticket = await this.requireTicket(ticketId);

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: dto.assigneeId },
        select: { role: true },
      });

      if (!assignee) {
        throw new NotFoundException({ code: 'errors.user_not_found' });
      }

      assertTicketAssigneeIsStaff(assignee.role);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: dto.status ?? ticket.status,
          priority: dto.priority ?? ticket.priority,
          assigneeId:
            dto.assigneeId === undefined ? ticket.assigneeId : dto.assigneeId,
        },
        select: MOD_TICKET_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.TICKET_UPDATE,
          targetType: ModerationTargetType.TICKET,
          targetId: ticketId,
          reason: dto.reason,
          before: {
            status: ticket.status,
            priority: ticket.priority,
            assigneeId: ticket.assigneeId,
          },
          after: {
            status: updated.status,
            priority: updated.priority,
            assigneeId: updated.assigneeId,
          },
        },
        tx,
      );

      return { ticket: updated };
    });
  }

  async claim(actorId: string, ticketId: string) {
    const ticket = await this.requireTicket(ticketId);

    if (
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CLOSED
    ) {
      throw new ConflictException({ code: 'errors.ticket_closed' });
    }

    if (ticket.type === TicketType.ORDER_DISPUTE && ticket.orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: ticket.orderId },
        select: { buyerId: true, sellerId: true },
      });
      assertNotOrderDisputeParty(actorId, order);
    }

    const nextStatus =
      ticket.status === TicketStatus.OPEN
        ? TicketStatus.IN_PROGRESS
        : ticket.status;

    const result = await this.update(actorId, ticketId, {
      assigneeId: actorId,
      status: nextStatus,
      reason: 'ticket_claimed',
    });

    if (ticket.type === TicketType.ORDER_DISPUTE) {
      const assignee = await this.prisma.user.findUnique({
        where: { id: actorId },
        select: { username: true },
      });
      await this.lotDisputes.onTicketClaimed(
        ticketId,
        assignee?.username ?? 'staff',
      );
    }

    return result;
  }

  /**
   * Assignee moderator hands the ticket to admins for final resolve (summary + notify).
   */
  async requestAdminVerdict(
    actorId: string,
    actorRole: UserRole,
    ticketId: string,
    dto: RequestTicketVerdictDto,
  ) {
    if (RoleHierarchy[actorRole] >= RoleHierarchy[UserRole.ADMIN]) {
      throw new BadRequestException({
        code: 'errors.ticket_verdict_not_needed',
      });
    }

    const ticket = await this.requireTicket(ticketId);

    if (
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CLOSED
    ) {
      throw new ConflictException({ code: 'errors.ticket_closed' });
    }

    if (ticket.status === TicketStatus.AWAITING_VERDICT) {
      throw new ConflictException({
        code: 'errors.ticket_already_awaiting_verdict',
      });
    }

    if (ticket.assigneeId !== actorId) {
      throw new ForbiddenException({
        code: 'errors.ticket_verdict_assignee_only',
      });
    }

    const summary = dto.summary.trim();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId: actorId,
          body: summary,
          isInternal: true,
        },
      });

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.AWAITING_VERDICT,
          priority: TicketPriority.HIGH,
        },
        select: MOD_TICKET_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.TICKET_UPDATE,
          targetType: ModerationTargetType.TICKET,
          targetId: ticketId,
          reason: 'ticket_verdict_requested',
          before: { status: ticket.status },
          after: {
            status: updated.status,
            priority: updated.priority,
          },
          metadata: { summaryPreview: summary.slice(0, 200) },
        },
        tx,
      );

      return updated;
    });

    const admins = await this.prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.OWNER],
        },
        status: UserStatus.ACTIVE,
      },
      select: { id: true },
    });

    await this.notifications.notifyTicketVerdictRequested({
      recipientIds: admins.map((a) => a.id),
      ticketId,
      subject: result.subject,
      summary,
      moderatorId: actorId,
    });

    return { ticket: result };
  }

  /**
   * Resolves dispute and applies order side-effects:
   * - SELLER_FAVOR → approve order (if timer was running) or restore PENDING
   * - BUYER_FAVOR → keep DISPUTED (refund/escrow later)
   * - NO_ACTION → restore previous status + resume remaining auto-approve timer
   */
  async resolve(actorId: string, ticketId: string, dto: ResolveTicketDto) {
    if (dto.resolution === TicketResolution.NONE) {
      throw new BadRequestException({
        code: 'errors.invalid_ticket_resolution',
      });
    }

    const ticket = await this.requireTicket(ticketId);
    const alreadyClosed =
      ticket.status === TicketStatus.RESOLVED ||
      ticket.status === TicketStatus.CLOSED;

    const result = await this.prisma.$transaction(async (tx) => {
      if (
        ticket.type === TicketType.ORDER_DISPUTE &&
        ticket.orderId &&
        !alreadyClosed
      ) {
        await this.applyDisputeResolution(tx, ticket.orderId, dto.resolution);
      }

      const updated = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.RESOLVED,
          resolution: dto.resolution,
          resolutionNote: dto.resolutionNote?.trim() ?? null,
        },
        select: MOD_TICKET_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.TICKET_RESOLVE,
          targetType: ModerationTargetType.TICKET,
          targetId: ticketId,
          reason: dto.reason,
          before: {
            status: ticket.status,
            resolution: ticket.resolution,
          },
          after: {
            status: updated.status,
            resolution: updated.resolution,
          },
          metadata: {
            paymentsSideEffect: 'noop',
            orderId: ticket.orderId,
            disputeResolution: dto.resolution,
          },
        },
        tx,
      );

      return { ticket: updated };
    });

    if (!alreadyClosed) {
      const recipientIds = [ticket.reporterId];
      if (result.ticket.order) {
        recipientIds.push(
          result.ticket.order.buyerId,
          result.ticket.order.sellerId,
        );
      }

      await this.notifications.notifyTicketResolved({
        recipientIds,
        ticketId: result.ticket.id,
        orderId: result.ticket.orderId,
        orderNumber: result.ticket.order?.orderNumber,
        listingTitle: result.ticket.order?.lot?.title,
        resolution: dto.resolution,
        note: result.ticket.resolutionNote,
      });

      await this.lotDisputes.onTicketClosed(ticketId);
    }

    return result;
  }

  async addMessage(
    authorId: string,
    authorRole: UserRole,
    ticketId: string,
    dto: CreateTicketMessageDto,
  ) {
    const ticket = await this.requireTicket(ticketId);
    const isStaff =
      RoleHierarchy[authorRole] >= RoleHierarchy[UserRole.MODERATOR];

    if (!isStaff && ticket.reporterId !== authorId) {
      throw new ForbiddenException({ code: 'errors.ticket_forbidden' });
    }

    if (!isStaff && dto.isInternal) {
      throw new ForbiddenException({ code: 'errors.internal_note_forbidden' });
    }

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ticketMessage.create({
        data: {
          ticketId,
          authorId,
          body: dto.body.trim(),
          isInternal: Boolean(dto.isInternal && isStaff),
        },
        select: {
          id: true,
          ticketId: true,
          authorId: true,
          body: true,
          isInternal: true,
          createdAt: true,
        },
      });

      if (
        ticket.status === TicketStatus.OPEN ||
        ticket.status === TicketStatus.WAITING_USER
      ) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status: isStaff
              ? TicketStatus.WAITING_USER
              : TicketStatus.IN_PROGRESS,
          },
        });
      }

      await this.audit.append(
        {
          actorId: authorId,
          actionType: ModerationActionType.TICKET_MESSAGE,
          targetType: ModerationTargetType.TICKET,
          targetId: ticketId,
          reason: 'ticket_message',
          after: {
            messageId: created.id,
            isInternal: created.isInternal,
          },
        },
        tx,
      );

      return created;
    });

    return { message };
  }

  async countOpen() {
    return this.prisma.ticket.count({
      where: {
        status: {
          in: OPEN_TICKET_STATUSES,
        },
      },
    });
  }

  private async createOrderDispute(reporterId: string, dto: CreateTicketDto) {
    if (!dto.orderId) {
      throw new BadRequestException({
        code: 'errors.dispute_requires_order',
      });
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true,
        autoApproveAt: true,
      },
    });

    if (!order) {
      throw new NotFoundException({ code: 'errors.order_not_found' });
    }

    if (order.buyerId !== reporterId && order.sellerId !== reporterId) {
      throw new ForbiddenException({ code: 'errors.dispute_forbidden' });
    }

    if (!DISPUTABLE_ORDER_STATUSES.includes(order.status)) {
      throw new ConflictException({ code: 'errors.dispute_not_allowed' });
    }

    const existing = await this.prisma.ticket.findFirst({
      where: {
        type: TicketType.ORDER_DISPUTE,
        orderId: order.id,
        status: { in: OPEN_TICKET_STATUSES },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({ code: 'errors.dispute_already_open' });
    }

    const now = new Date();
    let autoApproveRemainingMs: number | null = null;

    if (
      order.status === OrderStatus.AWAITING_BUYER_CONFIRMATION &&
      order.autoApproveAt
    ) {
      autoApproveRemainingMs = Math.max(
        0,
        order.autoApproveAt.getTime() - now.getTime(),
      );
    }

    const ticket = await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.DISPUTED,
          disputePausedFromStatus: order.status,
          autoApproveAt: null,
          autoApproveRemainingMs,
        },
      });

      const created = await tx.ticket.create({
        data: {
          type: TicketType.ORDER_DISPUTE,
          orderId: order.id,
          reporterId,
          subject: dto.subject.trim(),
          body: dto.body.trim(),
          priority: dto.priority ?? undefined,
        },
        select: MOD_TICKET_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId: reporterId,
          actionType: ModerationActionType.TICKET_CREATE,
          targetType: ModerationTargetType.TICKET,
          targetId: created.id,
          reason: 'order_dispute_opened',
          after: {
            type: created.type,
            status: created.status,
            orderId: order.id,
            orderStatus: OrderStatus.DISPUTED,
            autoApproveRemainingMs,
          },
        },
        tx,
      );

      return created;
    });

    await this.lotDisputes.ensureRoomForTicket(ticket.id);

    return { ticket };
  }

  private async applyDisputeResolution(
    tx: Prisma.TransactionClient,
    orderId: string,
    resolution: TicketResolution,
  ) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        disputePausedFromStatus: true,
        autoApproveRemainingMs: true,
      },
    });

    if (!order || order.status !== OrderStatus.DISPUTED) {
      return;
    }

    if (resolution === TicketResolution.SELLER_FAVOR) {
      if (
        order.disputePausedFromStatus ===
        OrderStatus.AWAITING_BUYER_CONFIRMATION
      ) {
        await this.orderCompletion.approveOrder(orderId, {
          fromStatuses: [OrderStatus.DISPUTED],
          tx,
        });
        return;
      }

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PENDING,
          disputePausedFromStatus: null,
          autoApproveRemainingMs: null,
          autoApproveAt: null,
        },
      });
      return;
    }

    if (resolution === TicketResolution.BUYER_FAVOR) {
      await tx.order.update({
        where: { id: orderId },
        data: {
          autoApproveAt: null,
          autoApproveRemainingMs: null,
          disputePausedFromStatus: null,
        },
      });
      return;
    }

    // NO_ACTION — restore previous status and remaining timer
    const restoreStatus =
      order.disputePausedFromStatus ?? OrderStatus.AWAITING_BUYER_CONFIRMATION;

    let autoApproveAt: Date | null = null;
    if (
      restoreStatus === OrderStatus.AWAITING_BUYER_CONFIRMATION &&
      order.autoApproveRemainingMs != null
    ) {
      autoApproveAt = new Date(Date.now() + order.autoApproveRemainingMs);
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: restoreStatus,
        autoApproveAt,
        autoApproveRemainingMs: null,
        disputePausedFromStatus: null,
      },
    });
  }

  private async requireTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        type: true,
        orderId: true,
        status: true,
        priority: true,
        assigneeId: true,
        reporterId: true,
        resolution: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException({ code: 'errors.ticket_not_found' });
    }

    return ticket;
  }
}
