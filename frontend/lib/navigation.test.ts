import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './navigation';

describe('getSafeRedirectPath', () => {
  it('returns valid relative path', () => {
    expect(getSafeRedirectPath('/listings')).toBe('/listings');
  });

  it('returns dashboard for missing path', () => {
    expect(getSafeRedirectPath(undefined)).toBe('/dashboard');
    expect(getSafeRedirectPath(null)).toBe('/dashboard');
    expect(getSafeRedirectPath('')).toBe('/dashboard');
  });

  it('blocks protocol-relative and external paths', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/dashboard');
    expect(getSafeRedirectPath('https://evil.com')).toBe('/dashboard');
  });
});
