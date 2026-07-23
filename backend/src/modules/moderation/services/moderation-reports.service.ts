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
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { MOD_REPORT_LIST_SELECT } from '../constants/moderation.select';
import {
  CreateReportDto,
  FindReportsQueryDto,
  UpdateReportDto,
} from '../dto/moderation-reports.dto';
import { ModerationAuditService } from './moderation-audit.service';

@Injectable()
export class ModerationReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
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
      return await this.prisma.report.create({
        data: {
          reporterId,
          targetType: dto.targetType,
          targetId: dto.targetId,
          reason: dto.reason,
          details: dto.details?.trim() || null,
        },
        select: MOD_REPORT_LIST_SELECT,
      });
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

  async findReports(query: FindReportsQueryDto) {
    const where: Prisma.ReportWhereInput = {
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

    return { items, total, page: query.page, limit: query.limit };
  }

  async update(actorId: string, reportId: string, dto: UpdateReportDto) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: {
        id: true,
        status: true,
        assignedToId: true,
        resolvedById: true,
        resolutionNote: true,
      },
    });

    if (!report) {
      throw new NotFoundException({ code: 'errors.report_not_found' });
    }

    const nextStatus = dto.status ?? report.status;
    const isClosing =
      nextStatus === ReportStatus.RESOLVED ||
      nextStatus === ReportStatus.DISMISSED;

    const actionType =
      nextStatus === ReportStatus.DISMISSED
        ? ModerationActionType.REPORT_DISMISS
        : nextStatus === ReportStatus.RESOLVED
          ? ModerationActionType.REPORT_RESOLVE
          : ModerationActionType.REPORT_ASSIGN;

    return this.prisma.$transaction(async (tx) => {
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
  }

  async countOpen() {
    return this.prisma.report.count({
      where: {
        status: { in: [ReportStatus.OPEN, ReportStatus.IN_REVIEW] },
      },
    });
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
