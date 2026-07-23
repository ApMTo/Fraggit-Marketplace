import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationActionType,
  ModerationTargetType,
  Prisma,
  TicketResolution,
  TicketStatus,
  TicketType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RoleHierarchy } from '../../auth/enums/roles.enum';
import { MOD_TICKET_LIST_SELECT } from '../constants/moderation.select';
import {
  CreateTicketDto,
  CreateTicketMessageDto,
  FindTicketsQueryDto,
  ResolveTicketDto,
  UpdateTicketDto,
} from '../dto/moderation-tickets.dto';
import { ModerationAuditService } from './moderation-audit.service';

@Injectable()
export class ModerationTicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
  ) {}

  async create(reporterId: string, dto: CreateTicketDto) {
    if (dto.type === TicketType.ORDER_DISPUTE) {
      if (!dto.orderId) {
        throw new BadRequestException({
          code: 'errors.dispute_requires_order',
        });
      }

      const order = await this.prisma.order.findUnique({
        where: { id: dto.orderId },
        select: { id: true, buyerId: true, sellerId: true },
      });

      if (!order) {
        throw new NotFoundException({ code: 'errors.order_not_found' });
      }

      if (order.buyerId !== reporterId && order.sellerId !== reporterId) {
        throw new ForbiddenException({ code: 'errors.dispute_forbidden' });
      }
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

  /**
   * Records dispute outcome only. Escrow/payments side-effects intentionally omitted.
   */
  async resolve(actorId: string, ticketId: string, dto: ResolveTicketDto) {
    if (dto.resolution === TicketResolution.NONE) {
      throw new BadRequestException({
        code: 'errors.invalid_ticket_resolution',
      });
    }

    const ticket = await this.requireTicket(ticketId);

    return this.prisma.$transaction(async (tx) => {
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
            // Payments microservice hook: apply escrow release/refund here later.
            paymentsSideEffect: 'noop',
          },
        },
        tx,
      );

      return { ticket: updated };
    });
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
          in: [
            TicketStatus.OPEN,
            TicketStatus.IN_PROGRESS,
            TicketStatus.WAITING_USER,
          ],
        },
      },
    });
  }

  private async requireTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
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
