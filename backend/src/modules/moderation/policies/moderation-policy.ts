import { ForbiddenException } from '@nestjs/common';
import { ReportTargetType, UserRole } from '@prisma/client';
import { RoleHierarchy } from '../../auth/enums/roles.enum';

/** Actor may act on target only when actor role is strictly above target role. */
export function assertCanModerateUser(
  actorRole: UserRole,
  targetRole: UserRole,
): void {
  if (RoleHierarchy[actorRole] <= RoleHierarchy[targetRole]) {
    throw new ForbiddenException({
      code: 'errors.cannot_moderate_peer_or_higher',
    });
  }
}

/** SUPER_ADMIN+ may change roles; ADMIN+ only OWNER may assign. */
export function assertCanAssignRole(
  actorRole: UserRole,
  newRole: UserRole,
): void {
  if (RoleHierarchy[actorRole] < RoleHierarchy[UserRole.SUPER_ADMIN]) {
    throw new ForbiddenException({ code: 'errors.insufficient_role' });
  }

  if (
    RoleHierarchy[newRole] >= RoleHierarchy[UserRole.ADMIN] &&
    actorRole !== UserRole.OWNER
  ) {
    throw new ForbiddenException({ code: 'errors.cannot_assign_admin_role' });
  }

  if (RoleHierarchy[newRole] >= RoleHierarchy[actorRole]) {
    throw new ForbiddenException({
      code: 'errors.cannot_assign_peer_or_higher',
    });
  }
}

export function isStaffRole(role: UserRole): boolean {
  return RoleHierarchy[role] >= RoleHierarchy[UserRole.MODERATOR];
}

/** Staff accounts must not buy or sell on the marketplace. */
export function assertStaffCannotTrade(role: UserRole): void {
  if (isStaffRole(role)) {
    throw new ForbiddenException({ code: 'errors.staff_cannot_trade' });
  }
}

/** Staff cannot moderate a dispute they participate in as buyer or seller. */
export function assertNotOrderDisputeParty(
  actorId: string,
  order: { buyerId: string; sellerId: string } | null | undefined,
): void {
  if (!order) {
    return;
  }

  if (order.buyerId === actorId || order.sellerId === actorId) {
    throw new ForbiddenException({
      code: 'errors.ticket_claim_party_conflict',
    });
  }
}

export function isAdminRole(role: UserRole): boolean {
  return RoleHierarchy[role] >= RoleHierarchy[UserRole.ADMIN];
}

/**
 * Lot reports require lot moderation powers, and message reports require
 * reading private conversations. Both are ADMIN+ only.
 */
const ADMIN_ONLY_REPORT_TARGETS: readonly ReportTargetType[] = [
  ReportTargetType.LOT,
  ReportTargetType.MESSAGE,
];

export function allowedReportTargets(actorRole: UserRole): ReportTargetType[] {
  const all = Object.values(ReportTargetType);

  return isAdminRole(actorRole)
    ? all
    : all.filter((target) => !ADMIN_ONLY_REPORT_TARGETS.includes(target));
}

export function assertCanHandleReportTarget(
  actorRole: UserRole,
  targetType: ReportTargetType,
): void {
  if (!allowedReportTargets(actorRole).includes(targetType)) {
    throw new ForbiddenException({ code: 'errors.insufficient_role' });
  }
}
