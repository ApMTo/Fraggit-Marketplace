import { afterEach, describe, expect, it } from 'vitest';
import { getCookie, hasSessionCookie } from './cookies';

describe('getCookie', () => {
  afterEach(() => {
    document.cookie = '';
  });

  it('returns cookie value when present', () => {
    document.cookie = 'sessionId=abc123; path=/';

    expect(getCookie('sessionId')).toBe('abc123');
  });

  it('returns null when cookie is missing', () => {
    expect(getCookie('missing')).toBeNull();
  });

  it('decodes URI-encoded values', () => {
    document.cookie = 'token=hello%20world; path=/';

    expect(getCookie('token')).toBe('hello world');
  });
});

describe('hasSessionCookie', () => {
  afterEach(() => {
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('returns true when sessionId cookie exists', () => {
    document.cookie = 'sessionId=sess-1; path=/';

    expect(hasSessionCookie()).toBe(true);
  });

  it('returns false when sessionId cookie is absent', () => {
    expect(hasSessionCookie()).toBe(false);
  });
});
