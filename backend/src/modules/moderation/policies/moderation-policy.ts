import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
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
