import { BadRequestException, ForbiddenException } from '@nestjs/common';
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

/** Ban, suspend, restore account — ADMIN+ only (mods investigate via tickets/reports). */
export function assertCanChangeUserStatus(actorRole: UserRole): void {
  if (!isAdminRole(actorRole)) {
    throw new ForbiddenException({ code: 'errors.insufficient_role' });
  }
}

/** Force sign-out — ADMIN+ only. */
export function assertCanRevokeUserSessions(actorRole: UserRole): void {
  if (!isAdminRole(actorRole)) {
    throw new ForbiddenException({ code: 'errors.insufficient_role' });
  }
}

export function assertCanCloseReport(
  actorRole: UserRole,
  targetType: ReportTargetType,
): void {
  if (targetType === ReportTargetType.USER && !isAdminRole(actorRole)) {
    throw new ForbiddenException({ code: 'errors.insufficient_role' });
  }
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

export function assertTicketAssigneeIsStaff(assigneeRole: UserRole): void {
  if (!isStaffRole(assigneeRole)) {
    throw new BadRequestException({ code: 'errors.invalid_ticket_assignee' });
  }
}

/**
 * MODERATOR may read a dispute room only when assigned to the linked ticket.
 * ADMIN+ may read any dispute room.
 */
export function assertStaffCanViewDisputeRoom(
  viewerRole: UserRole,
  viewerId: string,
  room: { ticket: { assigneeId: string | null } | null },
): void {
  if (!isStaffRole(viewerRole)) {
    throw new ForbiddenException({ code: 'errors.lot_dispute_forbidden' });
  }

  if (isAdminRole(viewerRole)) {
    return;
  }

  if (room.ticket?.assigneeId === viewerId) {
    return;
  }

  throw new ForbiddenException({ code: 'errors.lot_dispute_forbidden' });
}

/** Buyer–seller DM for a ticket: assignee moderator or ADMIN+. */
export function assertCanViewTicketPrivateChat(
  viewerRole: UserRole,
  viewerId: string,
  ticket: { assigneeId: string | null },
): void {
  if (!isStaffRole(viewerRole)) {
    throw new ForbiddenException({ code: 'errors.ticket_forbidden' });
  }

  if (isAdminRole(viewerRole)) {
    return;
  }

  if (ticket.assigneeId === viewerId) {
    return;
  }

  throw new ForbiddenException({
    code: 'errors.ticket_conversation_forbidden',
  });
}
