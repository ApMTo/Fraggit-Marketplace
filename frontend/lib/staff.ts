import type { UserRole } from '@/types/auth';

export const STAFF_ROLES: UserRole[] = [
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN',
  'OWNER',
];

export function isStaffRole(role: UserRole | undefined | null): boolean {
  return Boolean(role && STAFF_ROLES.includes(role));
}
