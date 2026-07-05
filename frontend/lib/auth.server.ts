import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api-server';
import type { AuthProfileResponse, AuthUser } from '@/types/auth';

export async function getSessionUser(): Promise<AuthUser | null> {
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
}
