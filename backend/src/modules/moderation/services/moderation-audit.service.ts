import { Injectable } from '@nestjs/common';
import {
  ModerationActionType,
  ModerationTargetType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';

export type AuditWriteInput = {
  actorId: string;
  actionType: ModerationActionType;
  targetType: ModerationTargetType;
  targetId: string;
  reason: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  metadata?: Prisma.InputJsonValue;
};

type Tx = Prisma.TransactionClient;

@Injectable()
export class ModerationAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async append(input: AuditWriteInput, tx?: Tx) {
    const db = tx ?? this.prisma;
    return db.moderationAction.create({
      data: {
        actorId: input.actorId,
        actionType: input.actionType,
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.reason.trim(),
        before: input.before ?? Prisma.JsonNull,
        after: input.after ?? Prisma.JsonNull,
        metadata: input.metadata ?? Prisma.JsonNull,
      },
      select: {
        id: true,
        actorId: true,
        actionType: true,
        targetType: true,
        targetId: true,
        reason: true,
        before: true,
        after: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  async list(params: {
    targetType?: ModerationTargetType;
    targetId?: string;
    actorId?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.ModerationActionWhereInput = {
      ...(params.targetType ? { targetType: params.targetType } : {}),
      ...(params.targetId ? { targetId: params.targetId } : {}),
      ...(params.actorId ? { actorId: params.actorId } : {}),
    };
    const skip = (params.page - 1) * params.limit;

    const [items, total] = await Promise.all([
      this.prisma.moderationAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.limit,
        select: {
          id: true,
          actorId: true,
          actionType: true,
          targetType: true,
          targetId: true,
          reason: true,
          before: true,
          after: true,
          metadata: true,
          createdAt: true,
          actor: {
            select: {
              id: true,
              username: true,
              displayName: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.moderationAction.count({ where }),
    ]);

    return { items, total, page: params.page, limit: params.limit };
  }
}
