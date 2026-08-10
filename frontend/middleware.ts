import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { UserRole } from '@/types/auth';
import { unwrapApiResponse } from '@/lib/api-response';
import type { AuthProfileResponse } from '@/types/auth';
import {
  getStaffRouteRequirement,
  roleMeetsStaffRequirement,
} from '@/lib/staff-route-access';

const PROTECTED_PREFIXES = [
  '/profile',
  '/settings',
  '/admin',
  '/moderation',
  '/orders',
  '/chat',
  '/reports',
];

const PROTECTED_EXACT = new Set(['/listings/new']);

const LOT_EDIT_PATH =
  /^\/listings\/[^/]+\/[^/]+\/lot\/[^/]+\/edit$/;

const GUEST_EXACT = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/auth/complete-google',
]);

const GUEST_PREFIXES = ['/auth/reset-password'];

function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_EXACT.has(pathname) || LOT_EDIT_PATH.test(pathname)) {
    return true;
  }

  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isGuestPath(pathname: string): boolean {
  if (GUEST_EXACT.has(pathname)) {
    return true;
  }

  return GUEST_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function hasSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get('sessionId')?.value);
}

function getBackendApiBase(): string {
  const origin =
    process.env.BACKEND_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';

  return `${origin}/api`;
}

function clearAuthCookies(response: NextResponse): void {
  const expired = new Date(0);
  const secure = process.env.NODE_ENV === 'production';
  const base = {
    expires: expired,
    maxAge: 0,
    secure,
    sameSite: 'lax' as const,
    path: '/',
  };

  response.cookies.set('access_token', '', { ...base, httpOnly: true });
  response.cookies.set('sessionId', '', { ...base, httpOnly: true });
  response.cookies.set('deviceId', '', { ...base, httpOnly: true });
  response.cookies.set('XSRF-TOKEN', '', { ...base, httpOnly: false });
  response.cookies.set('refresh_token', '', {
    ...base,
    httpOnly: true,
    path: '/api/auth/refresh',
  });
}

async function fetchSessionRole(
  request: NextRequest,
): Promise<UserRole | null> {
  const cookieHeader = request.cookies
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  try {
    const response = await fetch(`${getBackendApiBase()}/auth/me`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const json: unknown = await response.json();
    const data = unwrapApiResponse<AuthProfileResponse>(json);

    return data?.user?.role ?? null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionActive = hasSession(request);

  if (isProtectedPath(pathname) && !sessionActive) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const staffRequirement = getStaffRouteRequirement(pathname);
  if (staffRequirement && sessionActive) {
    const role = await fetchSessionRole(request);

    if (!role || !roleMeetsStaffRequirement(role, staffRequirement)) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      homeUrl.search = '';
      const response = NextResponse.redirect(homeUrl);
      if (!role) {
        clearAuthCookies(response);
      }
      return response;
    }
  }

  if (isGuestPath(pathname) && sessionActive) {
    const role = await fetchSessionRole(request);

    if (role) {
      const homeUrl = request.nextUrl.clone();
      homeUrl.pathname = '/';
      homeUrl.search = '';
      return NextResponse.redirect(homeUrl);
    }

    // Stale httpOnly cookies (expired/revoked session) — clear and allow login.
    const response = NextResponse.next();
    clearAuthCookies(response);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
