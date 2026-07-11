import { afterEach, describe, expect, it } from 'vitest';
import {
  clearClientAuthCookies,
  getCookie,
  hasRefreshCredentials,
  hasSessionCookie,
} from './cookies';

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
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('returns true when sessionId cookie exists', () => {
    document.cookie = 'sessionId=sess-1; path=/';

    expect(hasSessionCookie()).toBe(true);
  });

  it('returns true when only XSRF-TOKEN exists', () => {
    document.cookie = 'XSRF-TOKEN=csrf-1; path=/';

    expect(hasSessionCookie()).toBe(true);
  });

  it('returns false when session cookies are absent', () => {
    expect(hasSessionCookie()).toBe(false);
  });
});

describe('hasRefreshCredentials', () => {
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('returns true when XSRF-TOKEN exists', () => {
    document.cookie = 'XSRF-TOKEN=csrf-1; path=/';

    expect(hasRefreshCredentials()).toBe(true);
  });

  it('returns false when XSRF-TOKEN is absent', () => {
    expect(hasRefreshCredentials()).toBe(false);
  });
});

describe('clearClientAuthCookies', () => {
  afterEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
    document.cookie = 'deviceId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });

  it('clears auth-related cookies visible to document.cookie', () => {
    document.cookie = 'XSRF-TOKEN=csrf-1; path=/';
    document.cookie = 'sessionId=sess-1; path=/';
    document.cookie = 'deviceId=device-1; path=/';

    clearClientAuthCookies();

    expect(getCookie('XSRF-TOKEN')).toBeNull();
    expect(getCookie('sessionId')).toBeNull();
    expect(getCookie('deviceId')).toBeNull();
  });
});
