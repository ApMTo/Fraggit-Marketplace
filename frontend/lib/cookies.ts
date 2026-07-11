const SESSION_HINT_COOKIE_NAMES = ['sessionId', 'XSRF-TOKEN'] as const;
const CLIENT_AUTH_COOKIE_NAMES = ['XSRF-TOKEN', 'sessionId', 'deviceId'] as const;

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : null;
}

export function hasSessionCookie(): boolean {
  return SESSION_HINT_COOKIE_NAMES.some((name) => getCookie(name) !== null);
}

export function hasRefreshCredentials(): boolean {
  return getCookie('XSRF-TOKEN') !== null;
}

export function clearClientAuthCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const expires = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';

  for (const name of CLIENT_AUTH_COOKIE_NAMES) {
    document.cookie = `${name}=; ${expires}; path=/`;
  }
}
