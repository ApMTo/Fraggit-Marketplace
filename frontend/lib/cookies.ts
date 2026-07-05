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
  return getCookie('sessionId') !== null;
}
