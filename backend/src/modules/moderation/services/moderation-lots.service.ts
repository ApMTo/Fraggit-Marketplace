import { Injectable, NotFoundException } from '@nestjs/common';
import {
  LotStatus,
  ModerationActionType,
  ModerationTargetType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { ChatGateway } from '../../chat/chat.gateway';
import { MOD_LOT_LIST_SELECT } from '../constants/moderation.select';
import { FindModerationLotsQueryDto } from '../dto/moderation-lots.dto';
import { ModerationAuditService } from './moderation-audit.service';

@Injectable()
export class ModerationLotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async findLots(query: FindModerationLotsQueryDto) {
    const where: Prisma.LotWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.sellerId ? { sellerId: query.sellerId } : {}),
      ...(query.search
        ? {
            title: {
              contains: query.search,
              mode: 'insensitive',
            },
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.lot.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: MOD_LOT_LIST_SELECT,
      }),
      this.prisma.lot.count({ where }),
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  async remove(actorId: string, lotId: string, reason: string) {
    return this.setStatus(
      actorId,
      lotId,
      LotStatus.REMOVED,
      ModerationActionType.LOT_REMOVE,
      reason,
    );
  }

  async underReview(actorId: string, lotId: string, reason: string) {
    return this.setStatus(
      actorId,
      lotId,
      LotStatus.UNDER_REVIEW,
      ModerationActionType.LOT_UNDER_REVIEW,
      reason,
    );
  }

  async restore(actorId: string, lotId: string, reason: string) {
    const lot = await this.requireLot(lotId);
    const nextStatus = lot.stock > 0 ? LotStatus.OPEN : LotStatus.CLOSED;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.lot.update({
        where: { id: lotId },
        data: { status: nextStatus },
        select: MOD_LOT_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.LOT_RESTORE,
          targetType: ModerationTargetType.LOT,
          targetId: lotId,
          reason,
          before: { status: lot.status },
          after: { status: updated.status },
        },
        tx,
      );

      return { lot: updated };
    });

    this.chatGateway.emitLotStatusUpdate({
      lotId,
      status: result.lot.status,
      sellerId: lot.sellerId,
    });

    return result;
  }

  private async setStatus(
    actorId: string,
    lotId: string,
    status: LotStatus,
    actionType: ModerationActionType,
    reason: string,
  ) {
    const lot = await this.requireLot(lotId);

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.lot.update({
        where: { id: lotId },
        data: { status },
        select: MOD_LOT_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType,
          targetType: ModerationTargetType.LOT,
          targetId: lotId,
          reason,
          before: { status: lot.status },
          after: { status: updated.status },
        },
        tx,
      );

      return { lot: updated };
    });

    this.chatGateway.emitLotStatusUpdate({
      lotId,
      status: result.lot.status,
      sellerId: lot.sellerId,
    });

    return result;
  }

  private async requireLot(lotId: string) {
    const lot = await this.prisma.lot.findUnique({
      where: { id: lotId },
      select: { id: true, status: true, stock: true, sellerId: true },
    });

    if (!lot) {
      throw new NotFoundException({ code: 'errors.lot_not_found' });
    }

    return lot;
  }
}
