import type { UserRole } from '@/types/auth';
import { STAFF_ROLES } from '@/lib/staff';

const ADMIN_ROLES = new Set<UserRole>(['ADMIN', 'SUPER_ADMIN', 'OWNER']);
const MODERATOR_ROLES = new Set<UserRole>(STAFF_ROLES);

export type StaffRouteRequirement = 'moderator' | 'admin';

const ADMIN_ONLY_MODERATION_PREFIXES = [
  '/moderation/lots',
  '/moderation/reports/lots',
  '/moderation/reports/messages',
] as const;

export function getStaffRouteRequirement(
  pathname: string,
): StaffRouteRequirement | null {
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return 'admin';
  }

  if (pathname !== '/moderation' && !pathname.startsWith('/moderation/')) {
    return null;
  }

  const needsAdmin = ADMIN_ONLY_MODERATION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  return needsAdmin ? 'admin' : 'moderator';
}

export function roleMeetsStaffRequirement(
  role: UserRole,
  requirement: StaffRouteRequirement,
): boolean {
  if (requirement === 'admin') {
    return ADMIN_ROLES.has(role);
  }

  return MODERATOR_ROLES.has(role);
}
