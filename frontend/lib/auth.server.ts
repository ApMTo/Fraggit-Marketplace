import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { serverFetch } from '@/lib/api-server';
import type { AuthProfileResponse, AuthUser, UserRole } from '@/types/auth';

const ADMIN_ROLES = new Set<UserRole>(['ADMIN', 'SUPER_ADMIN', 'OWNER']);
const MODERATOR_ROLES = new Set<UserRole>([
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN',
  'OWNER',
]);

export const getSessionUser = cache(async (): Promise<AuthUser | null> => {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('sessionId');

  if (!sessionId) {
    return null;
  }

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const { data, status } = await serverFetch<AuthProfileResponse>(
    '/auth/me',
    cookieHeader,
  );

  if (data?.user) {
    return data.user;
  }

  if (status === 401) {
    return null;
  }

  return null;
});

export async function requireSessionUser(): Promise<AuthUser> {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}

export async function requireAdminUser(): Promise<AuthUser> {
  const user = await requireSessionUser();

  if (!ADMIN_ROLES.has(user.role)) {
    redirect('/dashboard');
  }

  return user;
}

export async function requireModeratorUser(): Promise<AuthUser> {
  const user = await requireSessionUser();

  if (!MODERATOR_ROLES.has(user.role)) {
    redirect('/dashboard');
  }

  return user;
}
