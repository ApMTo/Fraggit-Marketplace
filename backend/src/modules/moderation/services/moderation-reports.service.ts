import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ModerationActionType,
  ModerationTargetType,
  Prisma,
  ReportStatus,
  ReportTargetType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { MOD_REPORT_LIST_SELECT } from '../constants/moderation.select';
import {
  CreateReportDto,
  FindReportsQueryDto,
  UpdateReportDto,
} from '../dto/moderation-reports.dto';
import {
  allowedReportTargets,
  assertCanHandleReportTarget,
} from '../policies/moderation-policy';
import { ModerationAuditService } from './moderation-audit.service';
import { ModerationNotificationsService } from './moderation-notifications.service';

@Injectable()
export class ModerationReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
    private readonly notifications: ModerationNotificationsService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto) {
    if (
      dto.targetType === ReportTargetType.USER &&
      dto.targetId === reporterId
    ) {
      throw new BadRequestException({ code: 'errors.cannot_report_self' });
    }

    await this.assertTargetExists(dto.targetType, dto.targetId);

    const existing = await this.prisma.report.findFirst({
      where: {
        reporterId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException({ code: 'errors.report_already_open' });
    }

    try {
      const report = await this.prisma.report.create({
        data: {
          reporterId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          reason: dto.reason,
          details: dto.details?.trim() || null,
        },
        select: MOD_REPORT_LIST_SELECT,
      });

      return report;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({ code: 'errors.report_already_open' });
      }
      throw error;
    }
  }

  async findReports(query: FindReportsQueryDto, actorRole: UserRole) {
    if (query.targetType) {
      assertCanHandleReportTarget(actorRole, query.targetType);
    }

    const where: Prisma.ReportWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      targetType: query.targetType ?? { in: allowedReportTargets(actorRole) },
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: MOD_REPORT_LIST_SELECT,
      }),
      this.prisma.report.count({ where }),
    ]);

    const enriched = await this.enrichReportTargets(items);

    return { items: enriched, total, page: query.page, limit: query.limit };
  }

  async findMyReports(reporterId: string, query: FindReportsQueryDto) {
    const where: Prisma.ReportWhereInput = {
      reporterId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: MOD_REPORT_LIST_SELECT,
      }),
      this.prisma.report.count({ where }),
    ]);

    const enriched = await this.enrichReportTargets(items);

    return { items: enriched, total, page: query.page, limit: query.limit };
  }

  async update(
    actorId: string,
    actorRole: UserRole,
    reportId: string,
    dto: UpdateReportDto,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        reporterId: true,
        targetType: true,
        status: true,
        assignedToId: true,
        resolvedById: true,
        resolutionNote: true,
      },
    });

    if (!report) {
      throw new NotFoundException({ code: 'errors.report_not_found' });
    }

    assertCanHandleReportTarget(actorRole, report.targetType);

    const nextStatus = dto.status ?? report.status;
    const isClosing =
      nextStatus === ReportStatus.RESOLVED ||
      nextStatus === ReportStatus.DISMISSED;
    const wasOpen =
      report.status === ReportStatus.OPEN ||
      report.status === ReportStatus.IN_REVIEW;

    const actionType =
      nextStatus === ReportStatus.DISMISSED
        ? ModerationActionType.REPORT_DISMISS
        : nextStatus === ReportStatus.RESOLVED
          ? ModerationActionType.REPORT_RESOLVE
          : ModerationActionType.REPORT_ASSIGN;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.report.update({
        where: { id: reportId },
        data: {
          status: nextStatus,
          assignedToId:
            dto.assignedToId === undefined
              ? report.assignedToId
              : dto.assignedToId,
          resolvedById: isClosing ? actorId : report.resolvedById,
          resolutionNote: dto.resolutionNote?.trim() ?? report.resolutionNote,
        },
        select: MOD_REPORT_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType,
          targetType: ModerationTargetType.REPORT,
          targetId: reportId,
          reason: dto.reason,
          before: {
            status: report.status,
            assignedToId: report.assignedToId,
          },
          after: {
            status: updated.status,
            assignedToId: updated.assignedToId,
          },
        },
        tx,
      );

      return { report: updated };
    });

    if (
      wasOpen &&
      (nextStatus === ReportStatus.RESOLVED ||
        nextStatus === ReportStatus.DISMISSED)
    ) {
      await this.notifications.notifyReportStatus({
        reporterId: report.reporterId,
        reportId: report.id,
        status: nextStatus,
        note: result.report.resolutionNote,
      });
    }

    return result;
  }

  async countOpen(actorRole: UserRole) {
    return this.prisma.report.count({
      where: {
        status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] },
        targetType: { in: allowedReportTargets(actorRole) },
      },
    });
  }

  private async enrichReportTargets(
    items: Array<
      Prisma.ReportGetPayload<{ select: typeof MOD_REPORT_LIST_SELECT }>
    >,
  ) {
    const lotIds = items
      .filter((r) => r.targetType === ReportTargetType.LOT)
      .map((r) => r.targetId);
    const userIds = items
      .filter((r) => r.targetType === ReportTargetType.USER)
      .map((r) => r.targetId);

    const [lots, users] = await Promise.all([
      lotIds.length
        ? this.prisma.lot.findMany({
            where: { id: { in: lotIds } },
            select: {
              id: true,
              title: true,
              status: true,
              seller: { select: { id: true, username: true } },
            },
          })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              username: true,
              displayName: true,
              status: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const lotMap = new Map(lots.map((l) => [l.id, l]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    return items.map((report) => ({
      ...report,
      target:
        report.targetType === ReportTargetType.LOT
          ? (lotMap.get(report.targetId) ?? null)
          : report.targetType === ReportTargetType.USER
            ? (userMap.get(report.targetId) ?? null)
            : null,
    }));
  }

  private async assertTargetExists(
    targetType: ReportTargetType,
    targetId: string,
  ) {
    let exists = false;

    switch (targetType) {
      case ReportTargetType.USER:
        exists = Boolean(
          await this.prisma.user.findUnique({
            where: { id: targetId },
            select: { id: true },
          }),
        );
        break;
      case ReportTargetType.LOT:
        exists = Boolean(
          await this.prisma.lot.findUnique({
            where: { id: targetId },
            select: { id: true },
          }),
        );
        break;
      case ReportTargetType.REVIEW:
        exists = Boolean(
          await this.prisma.review.findUnique({
            where: { id: targetId },
            select: { id: true },
          }),
        );
        break;
      case ReportTargetType.MESSAGE:
        exists = Boolean(
          await this.prisma.message.findUnique({
            where: { id: targetId },
            select: { id: true },
          }),
        );
        break;
    }

    if (!exists) {
      throw new NotFoundException({ code: 'errors.report_target_not_found' });
    }
  }
}
