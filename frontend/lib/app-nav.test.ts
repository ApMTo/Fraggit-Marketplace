import { describe, expect, it } from 'vitest';
import { getAppNavItems, isNavItemActive } from './app-nav';

describe('app nav', () => {
  it('returns only listings in header for guests', () => {
    expect(
      getAppNavItems({ isAuthenticated: false, group: 'header' }).map(
        (item) => item.id,
      ),
    ).toEqual(['listings']);
  });

  it('returns account links for authenticated users', () => {
    expect(
      getAppNavItems({
        isAuthenticated: true,
        role: 'USER',
        group: 'account',
      }).map((item) => item.id),
    ).toEqual(['dashboard', 'orders', 'chat', 'profile', 'settings']);
  });

  it('includes admin link in account menu for moderators and admins', () => {
    expect(
      getAppNavItems({
        isAuthenticated: true,
        role: 'ADMIN',
        group: 'account',
      }).map((item) => item.id),
    ).toContain('admin');
  });

  it('detects active nav items', () => {
    expect(isNavItemActive('/', '/')).toBe(true);
    expect(isNavItemActive('/listings', '/')).toBe(false);
    expect(isNavItemActive('/listings/123', '/listings')).toBe(true);
  });
});
