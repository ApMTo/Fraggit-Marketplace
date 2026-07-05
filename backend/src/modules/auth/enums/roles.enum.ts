import { UserRole } from '@prisma/client';

export { UserRole };

export const RoleHierarchy: Record<UserRole, number> = {
  [UserRole.USER]: 0,
  [UserRole.MODERATOR]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3,
  [UserRole.OWNER]: 4,
};

export const ROLE_VALUES = new Set<string>(Object.values(UserRole));
