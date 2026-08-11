import type { UserRole } from '@/types/auth';

export function isMediaRole(role: UserRole | undefined | null): boolean {
  return role === 'MEDIA';
}
