import { getCookie } from '@/lib/cookies';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';

let memoryToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  memoryToken = token;
}

export function getCsrfToken(): string | null {
  if (memoryToken) {
    return memoryToken;
  }

  return getCookie(CSRF_COOKIE_NAME);
}

export function clearCsrfToken(): void {
  memoryToken = null;
}

export function syncCsrfFromCookie(): void {
  const cookieToken = getCookie(CSRF_COOKIE_NAME);
  if (cookieToken) {
    memoryToken = cookieToken;
  }
}
