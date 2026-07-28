import { describe, expect, it } from 'vitest';
import { getSafeRedirectPath } from './navigation';

describe('getSafeRedirectPath', () => {
  it('returns valid relative path', () => {
    expect(getSafeRedirectPath('/listings')).toBe('/listings');
  });

  it('returns home for missing path', () => {
    expect(getSafeRedirectPath(undefined)).toBe('/');
    expect(getSafeRedirectPath(null)).toBe('/');
    expect(getSafeRedirectPath('')).toBe('/');
  });

  it('blocks protocol-relative and external paths', () => {
    expect(getSafeRedirectPath('//evil.com')).toBe('/');
    expect(getSafeRedirectPath('https://evil.com')).toBe('/');
  });
});
