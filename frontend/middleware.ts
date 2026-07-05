import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/profile',
  '/settings',
  '/admin',
  '/orders',
  '/chat',
  '/listings',
];

const GUEST_EXACT = new Set(['/login', '/register']);

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isGuestPath(pathname: string): boolean {
  return GUEST_EXACT.has(pathname);
}

function hasSession(request: NextRequest): boolean {
  return Boolean(request.cookies.get('sessionId')?.value);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionActive = hasSession(request);

  if (isProtectedPath(pathname) && !sessionActive) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isGuestPath(pathname) && sessionActive) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = '/dashboard';
    dashboardUrl.search = '';
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
