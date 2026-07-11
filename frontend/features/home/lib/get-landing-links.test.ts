import { describe, expect, it } from 'vitest';
import { getLandingLinks } from './get-landing-links';

describe('getLandingLinks', () => {
  it('returns auth-aware links for authenticated users', () => {
    expect(getLandingLinks({ isAuthenticated: true })).toEqual({
      startShopping: '/listings',
      becomeSeller: '/listings',
      createAccount: '/dashboard',
      dashboard: '/dashboard',
    });
  });

  it('returns guest links for unauthenticated users', () => {
    expect(getLandingLinks({ isAuthenticated: false })).toEqual({
      startShopping: '/login?next=/listings',
      becomeSeller: '/register',
      createAccount: '/register',
      dashboard: '/dashboard',
    });
  });
});
