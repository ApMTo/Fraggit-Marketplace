import { describe, expect, it } from 'vitest';
import { getAppNavItems, isNavItemActive } from './app-nav';

describe('app nav', () => {
  it('returns listings and blog in header for guests', () => {
    expect(
      getAppNavItems({ isAuthenticated: false, group: 'header' }).map(
        (item) => item.id,
      ),
    ).toEqual(['listings', 'blog']);
  });

  it('returns account links for authenticated users', () => {
    expect(
      getAppNavItems({
        isAuthenticated: true,
        role: 'USER',
        group: 'account',
      }).map((item) => item.id),
    ).toEqual(['orders', 'chat', 'reports', 'profile']);
  });

  it('includes moderation for moderators and admin for admins', () => {
    expect(
      getAppNavItems({
        isAuthenticated: true,
        role: 'MODERATOR',
        group: 'account',
      }).map((item) => item.id),
    ).toContain('moderation');

    expect(
      getAppNavItems({
        isAuthenticated: true,
        role: 'MODERATOR',
        group: 'account',
      }).map((item) => item.id),
    ).not.toContain('admin');

    expect(
      getAppNavItems({
        isAuthenticated: true,
        role: 'ADMIN',
        group: 'account',
      }).map((item) => item.id),
    ).toEqual(
      expect.arrayContaining(['moderation', 'admin']),
    );
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
