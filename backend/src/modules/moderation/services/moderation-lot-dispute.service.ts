import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LotDisputeMessageKind,
  LotDisputeRoomStatus,
  Prisma,
  TicketStatus,
  TicketType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { RoleHierarchy } from '../../auth/enums/roles.enum';
import { CHAT_USER_SELECT } from '../../chat/constants/chat.select';
import { LOT_DISPUTE_SYSTEM_EVENT } from '../constants/lot-dispute.constants';
import { ModerationNotificationsService } from './moderation-notifications.service';
import {
  assertNotOrderDisputeParty,
  assertStaffCanViewDisputeRoom,
} from '../policies/moderation-policy';

const OPEN_TICKET_STATUSES: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_USER,
];

const ROOM_SELECT = {
  id: true,
  lotId: true,
  orderId: true,
  reportId: true,
  ticketId: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  report: {
    select: {
      id: true,
      status: true,
      reason: true,
      reporter: {
        select: { id: true, username: true, displayName: true },
      },
    },
  },
  ticket: {
    select: {
      id: true,
      status: true,
      reporter: {
        select: { id: true, username: true, displayName: true },
      },
      order: {
        select: {
          id: true,
          orderNumber: true,
          buyerId: true,
          sellerId: true,
        },
      },
    },
  },
  lot: {
    select: {
      id: true,
      title: true,
      sellerId: true,
      seller: {
        select: { id: true, username: true, displayName: true },
      },
    },
  },
} satisfies Prisma.LotDisputeRoomSelect;

const DISPUTE_AUTHOR_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
} satisfies Prisma.UserSelect;

const MESSAGE_SELECT = {
  id: true,
  roomId: true,
  authorId: true,
  kind: true,
  body: true,
  metadata: true,
  createdAt: true,
  author: { select: DISPUTE_AUTHOR_SELECT },
} satisfies Prisma.LotDisputeMessageSelect;

@Injectable()
export class ModerationLotDisputeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: ModerationNotificationsService,
  ) {}

  async ensureRoomForTicket(ticketId: string) {
    const existing = await this.prisma.lotDisputeRoom.findUnique({
      where: { ticketId },
      select: ROOM_SELECT,
    });

    if (existing) {
      return existing;
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        type: true,
        orderId: true,
        reporter: { select: { username: true } },
        order: { select: { id: true, lotId: true } },
      },
    });

    if (
      !ticket ||
      ticket.type !== TicketType.ORDER_DISPUTE ||
      !ticket.orderId ||
      !ticket.order
    ) {
      throw new NotFoundException({ code: 'errors.ticket_not_found' });
    }

    const room = await this.prisma.$transaction(async (tx) => {
      const created = await tx.lotDisputeRoom.create({
        data: {
          lotId: ticket.order!.lotId,
          orderId: ticket.orderId,
          ticketId: ticket.id,
        },
        select: ROOM_SELECT,
      });

      await tx.lotDisputeMessage.create({
        data: {
          roomId: created.id,
          kind: LotDisputeMessageKind.SYSTEM,
          body: LOT_DISPUTE_SYSTEM_EVENT.TICKET_OPENED,
          metadata: {
            event: LOT_DISPUTE_SYSTEM_EVENT.TICKET_OPENED,
            reporterUsername: ticket.reporter.username,
          },
        },
      });

      return created;
    });

    return room;
  }

  async findRoomForOrder(
    orderId: string,
    viewerId: string,
    viewerRole: UserRole,
  ) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        orderId,
        type: TicketType.ORDER_DISPUTE,
        status: { in: OPEN_TICKET_STATUSES },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!ticket) {
      return { room: null, messages: [], participants: [] };
    }

    const room = await this.ensureRoomForTicket(ticket.id);

    if (!(await this.canAccessRoom(room.id, viewerId, viewerRole))) {
      throw new ForbiddenException({ code: 'errors.lot_dispute_forbidden' });
    }

    return this.findRoom(room.id, viewerId, viewerRole, 200);
  }

  async findRoom(
    roomId: string,
    viewerId: string,
    viewerRole: UserRole,
    limit: number,
  ) {
    await this.assertCanAccessRoom(roomId, viewerId, viewerRole);

    const room = await this.prisma.lotDisputeRoom.findUnique({
      where: { id: roomId },
      select: ROOM_SELECT,
    });

    if (!room) {
      throw new NotFoundException({ code: 'errors.lot_dispute_not_found' });
    }

    const messages = await this.prisma.lotDisputeMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: MESSAGE_SELECT,
    });

    const participants = await this.collectParticipantsForRoom(room);

    return { room, messages, participants };
  }

  async findRoomByTicket(
    ticketId: string,
    viewerId: string,
    viewerRole: UserRole,
    limit: number,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { type: true },
    });

    if (!ticket || ticket.type !== TicketType.ORDER_DISPUTE) {
      throw new NotFoundException({ code: 'errors.ticket_not_found' });
    }

    await this.ensureRoomForTicket(ticketId);
    const room = await this.prisma.lotDisputeRoom.findUnique({
      where: { ticketId },
      select: { id: true },
    });

    if (!room) {
      throw new NotFoundException({ code: 'errors.lot_dispute_not_found' });
    }

    return this.findRoom(room.id, viewerId, viewerRole, limit);
  }

  async addMessage(
    roomId: string,
    authorId: string,
    authorRole: UserRole,
    body: string,
  ) {
    await this.assertCanAccessRoom(roomId, authorId, authorRole);

    const room = await this.prisma.lotDisputeRoom.findUnique({
      where: { id: roomId },
      select: {
        id: true,
        status: true,
        lotId: true,
        orderId: true,
        report: {
          select: {
            id: true,
            reporterId: true,
          },
        },
        ticket: {
          select: {
            id: true,
            reporterId: true,
            order: {
              select: { buyerId: true, sellerId: true },
            },
          },
        },
        lot: {
          select: {
            sellerId: true,
            title: true,
            category: { select: { slug: true } },
            subcategory: { select: { slug: true } },
          },
        },
      },
    });

    if (!room) {
      throw new NotFoundException({ code: 'errors.lot_dispute_not_found' });
    }

    if (room.status === LotDisputeRoomStatus.CLOSED) {
      throw new ForbiddenException({ code: 'errors.lot_dispute_closed' });
    }

    const isStaff =
      RoleHierarchy[authorRole] >= RoleHierarchy[UserRole.MODERATOR];

    if (isStaff && room.ticket?.id) {
      const order = room.ticket.order;
      assertNotOrderDisputeParty(authorId, order ?? undefined);

      const ticket = await this.prisma.ticket.findUnique({
        where: { id: room.ticket.id },
        select: { assigneeId: true },
      });

      if (!ticket?.assigneeId || ticket.assigneeId !== authorId) {
        throw new ForbiddenException({ code: 'errors.ticket_claim_required' });
      }
    }

    const message = await this.prisma.lotDisputeMessage.create({
      data: {
        roomId,
        authorId,
        kind: LotDisputeMessageKind.TEXT,
        body: body.trim(),
      },
      select: MESSAGE_SELECT,
    });

    const recipientIds = this.recipientIdsForRoom(room);
    if (!room.orderId) {
      throw new ForbiddenException({ code: 'errors.lot_dispute_forbidden' });
    }

    const href = `/orders/${room.orderId}#order-dispute`;

    await this.notifications.notifyLotDisputeMessage({
      recipientIds: recipientIds.filter((id) => id !== authorId),
      roomId: room.id,
      lotId: room.lotId,
      lotTitle: room.lot.title,
      reportId: room.report?.id,
      authorUsername: message.author?.username,
      preview: body.trim().slice(0, 120),
      href,
    });

    return { message };
  }

  async onTicketClaimed(ticketId: string, assigneeUsername: string) {
    const room = await this.prisma.lotDisputeRoom.findUnique({
      where: { ticketId },
      select: { id: true },
    });

    if (!room) {
      return;
    }

    await this.prisma.lotDisputeMessage.create({
      data: {
        roomId: room.id,
        kind: LotDisputeMessageKind.SYSTEM,
        body: LOT_DISPUTE_SYSTEM_EVENT.TICKET_CLAIMED,
        metadata: {
          event: LOT_DISPUTE_SYSTEM_EVENT.TICKET_CLAIMED,
          assigneeUsername,
        },
      },
    });
  }

  async onTicketClosed(ticketId: string) {
    const room = await this.prisma.lotDisputeRoom.findUnique({
      where: { ticketId },
      select: { id: true },
    });

    if (!room) {
      return;
    }

    await this.closeRoom(room.id, LOT_DISPUTE_SYSTEM_EVENT.TICKET_CLOSED, {});
  }

  private async closeRoom(
    roomId: string,
    event: string,
    metadata: Record<string, unknown>,
  ) {
    await this.prisma.$transaction([
      this.prisma.lotDisputeMessage.create({
        data: {
          roomId,
          kind: LotDisputeMessageKind.SYSTEM,
          body: event,
          metadata: { event, ...metadata },
        },
      }),
      this.prisma.lotDisputeRoom.update({
        where: { id: roomId },
        data: { status: LotDisputeRoomStatus.CLOSED },
      }),
    ]);
  }

  private async canAccessRoom(
    roomId: string,
    viewerId: string,
    viewerRole: UserRole,
  ): Promise<boolean> {
    try {
      await this.assertCanAccessRoom(roomId, viewerId, viewerRole);
      return true;
    } catch {
      return false;
    }
  }

  private async assertCanAccessRoom(
    roomId: string,
    viewerId: string,
    viewerRole: UserRole,
  ) {
    const room = await this.prisma.lotDisputeRoom.findUnique({
      where: { id: roomId },
      select: {
        lotId: true,
        orderId: true,
        report: { select: { reporterId: true } },
        ticket: {
          select: {
            reporterId: true,
            assigneeId: true,
            order: { select: { buyerId: true, sellerId: true } },
          },
        },
        lot: { select: { sellerId: true } },
      },
    });

    if (!room) {
      throw new NotFoundException({ code: 'errors.lot_dispute_not_found' });
    }

    if (room.orderId && room.ticket?.order) {
      const { buyerId, sellerId } = room.ticket.order;
      if (viewerId === buyerId || viewerId === sellerId) {
        return;
      }
    }

    assertStaffCanViewDisputeRoom(viewerRole, viewerId, room);
  }

  private recipientIdsForRoom(room: {
    ticket: {
      reporterId: string;
      order: { buyerId: string; sellerId: string } | null;
    } | null;
  }) {
    if (!room.ticket?.order) {
      return [];
    }

    return [
      ...new Set([
        room.ticket.order.buyerId,
        room.ticket.order.sellerId,
        room.ticket.reporterId,
      ]),
    ];
  }

  private async collectParticipantsForRoom(
    room: Prisma.LotDisputeRoomGetPayload<{ select: typeof ROOM_SELECT }>,
  ) {
    const byId = new Map<
      string,
      {
        id: string;
        username: string;
        displayName: string;
        avatarUrl: string | null;
      }
    >();

    if (room.ticket?.order) {
      const order = await this.prisma.order.findUnique({
        where: { id: room.ticket.order.id },
        select: {
          buyer: { select: CHAT_USER_SELECT },
          seller: { select: CHAT_USER_SELECT },
        },
      });
      if (order?.buyer) byId.set(order.buyer.id, order.buyer);
      if (order?.seller) byId.set(order.seller.id, order.seller);
    }

    if (room.ticket?.reporter) {
      const reporter = await this.prisma.user.findUnique({
        where: { id: room.ticket.reporter.id },
        select: CHAT_USER_SELECT,
      });
      if (reporter) byId.set(reporter.id, reporter);
    }

    return [...byId.values()];
  }
}
