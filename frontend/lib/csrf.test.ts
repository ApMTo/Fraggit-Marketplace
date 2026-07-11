import { afterEach, describe, expect, it } from 'vitest';
import {
  clearCsrfToken,
  getCsrfToken,
  setCsrfToken,
  syncCsrfFromCookie,
} from './csrf';

describe('csrf token helpers', () => {
  afterEach(() => {
    clearCsrfToken();
    document.cookie = '';
  });

  it('prefers in-memory token over cookie', () => {
    document.cookie = 'XSRF-TOKEN=cookie-token; path=/';
    setCsrfToken('memory-token');

    expect(getCsrfToken()).toBe('memory-token');
  });

  it('falls back to cookie when memory is empty', () => {
    document.cookie = 'XSRF-TOKEN=cookie-token; path=/';

    expect(getCsrfToken()).toBe('cookie-token');
  });

  it('syncs token from cookie into memory', () => {
    document.cookie = 'XSRF-TOKEN=synced-token; path=/';

    syncCsrfFromCookie();

    expect(getCsrfToken()).toBe('synced-token');
  });

  it('clears in-memory token', () => {
    setCsrfToken('to-clear');
    clearCsrfToken();
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

    expect(getCsrfToken()).toBeNull();
  });
});
