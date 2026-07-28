import { ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { ModerationUsersService } from './moderation-users.service';

describe('ModerationUsersService ban side-effects', () => {
  const targetId = 'target-user';
  const actorId = 'actor-user';

  function createService() {
    const lotUpdateMany = jest.fn().mockResolvedValue({ count: 3 });
    const userUpdate = jest.fn().mockResolvedValue({
      id: targetId,
      status: UserStatus.BANNED,
      suspendedUntil: null,
      email: 't@example.com',
      username: 'target',
      displayName: 'Target',
      avatarUrl: null,
      role: UserRole.USER,
      rating: 0,
      ratingCount: 0,
      successfulSales: 0,
      twoFactorEnabled: false,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const auditAppend = jest.fn().mockResolvedValue({
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    });
    const revokeAllSessions = jest.fn().mockResolvedValue(2);
    const invalidate = jest.fn().mockResolvedValue(undefined);

    const tx = {
      user: { update: userUpdate },
      lot: { updateMany: lotUpdateMany },
    };

    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: targetId,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          suspendedUntil: null,
        }),
      },
      $transaction: jest.fn(async (cb: (t: typeof tx) => Promise<unknown>) =>
        cb(tx),
      ),
    };

    const service = new ModerationUsersService(
      prisma as never,
      { append: auditAppend } as never,
      { revokeAllSessions } as never,
      { invalidate } as never,
    );

    return {
      service,
      lotUpdateMany,
      revokeAllSessions,
      invalidate,
      auditAppend,
    };
  }

  it('removes open lots, revokes sessions, and invalidates auth cache on ban', async () => {
    const {
      service,
      lotUpdateMany,
      revokeAllSessions,
      invalidate,
      auditAppend,
    } = createService();

    const result = await service.updateStatus(
      actorId,
      UserRole.ADMIN,
      targetId,
      { status: UserStatus.BANNED, reason: 'scam seller' },
    );

    expect(lotUpdateMany).toHaveBeenCalledWith({
      where: { sellerId: targetId, status: 'OPEN' },
      data: { status: 'REMOVED' },
    });
    expect(revokeAllSessions).toHaveBeenCalledWith(targetId);
    expect(invalidate).toHaveBeenCalledWith(targetId);
    expect(auditAppend).toHaveBeenCalled();
    expect(result.lotsRemoved).toBe(3);
  });

  it('does not revoke sessions when restoring to ACTIVE', async () => {
    const { service, revokeAllSessions, lotUpdateMany } = createService();

    await service.updateStatus(actorId, UserRole.ADMIN, targetId, {
      status: UserStatus.ACTIVE,
      reason: 'appeal accepted',
    });

    expect(lotUpdateMany).not.toHaveBeenCalled();
    expect(revokeAllSessions).not.toHaveBeenCalled();
  });

  it('blocks moderator from changing user status', async () => {
    const { service } = createService();

    await expect(
      service.updateStatus(actorId, UserRole.MODERATOR, targetId, {
        status: UserStatus.BANNED,
        reason: 'scam seller',
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
