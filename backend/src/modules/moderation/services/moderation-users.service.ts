import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LotStatus,
  ModerationActionType,
  ModerationTargetType,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UserAuthCacheService } from '../../auth/user-auth-cache.service';
import { SessionsService } from '../../sessions/sessions.service';
import { MOD_USER_LIST_SELECT } from '../constants/moderation.select';
import {
  FindModerationUsersQueryDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from '../dto/moderation-users.dto';
import {
  assertCanAssignRole,
  assertCanChangeUserStatus,
  assertCanModerateUser,
  assertCanRevokeUserSessions,
  isStaffRole,
} from '../policies/moderation-policy';
import { formatStatusCaseId } from '../../auth/utils/account-restriction.util';
import { ModerationAuditService } from './moderation-audit.service';

const MUTABLE_STATUSES = new Set<UserStatus>([
  UserStatus.ACTIVE,
  UserStatus.BANNED,
  UserStatus.SUSPENDED,
]);

@Injectable()
export class ModerationUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: ModerationAuditService,
    private readonly sessions: SessionsService,
    private readonly userAuthCache: UserAuthCacheService,
  ) {}

  async findUsers(query: FindModerationUsersQueryDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.role ? { role: query.role } : {}),
      ...(query.search
        ? {
            OR: [
              {
                username: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                displayName: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: query.limit,
        select: MOD_USER_LIST_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page: query.page, limit: query.limit };
  }

  async findUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: MOD_USER_LIST_SELECT,
    });

    if (!user) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    const [lots, orders, reports] = await Promise.all([
      this.prisma.lot.findMany({
        where: { sellerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          price: true,
          createdAt: true,
        },
      }),
      this.prisma.order.findMany({
        where: { OR: [{ buyerId: userId }, { sellerId: userId }] },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          price: true,
          buyerId: true,
          sellerId: true,
          createdAt: true,
        },
      }),
      this.prisma.report.findMany({
        where: {
          OR: [
            { reporterId: userId },
            { targetType: 'USER', targetId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          targetType: true,
          targetId: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return { user, lots, orders, reports };
  }

  async updateStatus(
    actorId: string,
    actorRole: UserRole,
    userId: string,
    dto: UpdateUserStatusDto,
  ) {
    if (!MUTABLE_STATUSES.has(dto.status)) {
      throw new BadRequestException({ code: 'errors.invalid_user_status' });
    }

    if (actorId === userId) {
      throw new BadRequestException({ code: 'errors.cannot_moderate_self' });
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
        suspendedUntil: true,
      },
    });

    if (!target) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    assertCanChangeUserStatus(actorRole);
    assertCanModerateUser(actorRole, target.role);

    const suspendedUntil =
      dto.status === UserStatus.SUSPENDED ? (dto.suspendedUntil ?? null) : null;

    const result = await this.prisma.$transaction(async (tx) => {
      let lotsRemoved = 0;
      if (
        dto.status === UserStatus.BANNED ||
        dto.status === UserStatus.SUSPENDED
      ) {
        const lotResult = await tx.lot.updateMany({
          where: { sellerId: userId, status: LotStatus.OPEN },
          data: { status: LotStatus.REMOVED },
        });
        lotsRemoved = lotResult.count;
      }

      const auditAction = await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.USER_STATUS_CHANGE,
          targetType: ModerationTargetType.USER,
          targetId: userId,
          reason: dto.reason,
          before: {
            status: target.status,
            suspendedUntil: target.suspendedUntil,
          },
          after: {
            status: dto.status,
            suspendedUntil,
          },
          metadata: { lotsRemoved },
        },
        tx,
      );

      const isRestricted =
        dto.status === UserStatus.BANNED || dto.status === UserStatus.SUSPENDED;
      const publicMessage = isRestricted
        ? dto.userMessage?.trim() || dto.reason.trim()
        : null;
      const caseId = isRestricted ? formatStatusCaseId(auditAction.id) : null;

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          status: dto.status,
          suspendedUntil,
          statusPublicMessage: isRestricted ? publicMessage : null,
          statusCaseId: isRestricted ? caseId : null,
        },
        select: MOD_USER_LIST_SELECT,
      });

      return { user: updated, lotsRemoved };
    });

    if (
      dto.status === UserStatus.BANNED ||
      dto.status === UserStatus.SUSPENDED
    ) {
      await this.sessions.revokeAllSessions(userId);
    }

    await this.userAuthCache.invalidate(userId);
    return result;
  }

  async revokeSessions(
    actorId: string,
    actorRole: UserRole,
    userId: string,
    reason: string,
  ) {
    if (actorId === userId) {
      throw new BadRequestException({ code: 'errors.cannot_moderate_self' });
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    assertCanRevokeUserSessions(actorRole);
    assertCanModerateUser(actorRole, target.role);

    const revokedSessions = await this.sessions.revokeAllSessions(userId);

    await this.audit.append({
      actorId,
      actionType: ModerationActionType.USER_SESSIONS_REVOKE,
      targetType: ModerationTargetType.USER,
      targetId: userId,
      reason,
      after: { revokedSessions },
    });

    await this.userAuthCache.invalidate(userId);
    return { revokedSessions };
  }

  async resetTwoFactor(
    actorId: string,
    actorRole: UserRole,
    userId: string,
    reason: string,
  ) {
    if (actorId === userId) {
      throw new BadRequestException({ code: 'errors.cannot_moderate_self' });
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, twoFactorEnabled: true },
    });

    if (!target) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    assertCanModerateUser(actorRole, target.role);

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false },
        select: MOD_USER_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.USER_2FA_RESET,
          targetType: ModerationTargetType.USER,
          targetId: userId,
          reason,
          before: { twoFactorEnabled: target.twoFactorEnabled },
          after: { twoFactorEnabled: false },
        },
        tx,
      );

      return updated;
    });

    await this.sessions.revokeAllSessions(userId);
    await this.userAuthCache.invalidate(userId);
    return { user };
  }

  async updateRole(
    actorId: string,
    actorRole: UserRole,
    userId: string,
    dto: UpdateUserRoleDto,
  ) {
    if (actorId === userId) {
      throw new BadRequestException({ code: 'errors.cannot_moderate_self' });
    }

    const target = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!target) {
      throw new NotFoundException({ code: 'errors.user_not_found' });
    }

    assertCanModerateUser(actorRole, target.role);
    assertCanAssignRole(actorRole, dto.role);

    const user = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: userId },
        data: { role: dto.role },
        select: MOD_USER_LIST_SELECT,
      });

      await this.audit.append(
        {
          actorId,
          actionType: ModerationActionType.USER_ROLE_CHANGE,
          targetType: ModerationTargetType.USER,
          targetId: userId,
          reason: dto.reason,
          before: { role: target.role },
          after: { role: updated.role },
        },
        tx,
      );

      return updated;
    });

    if (isStaffRole(target.role) && !isStaffRole(dto.role)) {
      await this.sessions.revokeAllSessions(userId);
    }

    await this.userAuthCache.invalidate(userId);
    return { user };
  }
}
