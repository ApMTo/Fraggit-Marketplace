import { describe, expect, it, vi, beforeEach } from 'vitest';
import { authService } from './auth.service';

const postMock = vi.fn();
const getMock = vi.fn();

vi.mock('@/lib/api', () => ({
  default: {
    post: (...args: unknown[]) => postMock(...args),
    get: (...args: unknown[]) => getMock(...args),
  },
}));

vi.mock('@/lib/csrf', () => ({
  setCsrfToken: vi.fn(),
  clearCsrfToken: vi.fn(),
  syncCsrfFromCookie: vi.fn(),
}));

describe('authService', () => {
  beforeEach(() => {
    postMock.mockReset();
    getMock.mockReset();
  });

  it('registers user via API', async () => {
    postMock.mockResolvedValue({ data: { message: 'ok' } });

    await expect(
      authService.register({
        email: 'user@test.com',
        username: 'testuser',
        displayName: 'Test User',
        password: 'Str0ng!Pass',
        acceptedTerms: true,
        acceptedPrivacy: true,
      }),
    ).resolves.toEqual({ message: 'ok' });

    expect(postMock).toHaveBeenCalledWith('/auth/register', {
      email: 'user@test.com',
      username: 'testuser',
      displayName: 'Test User',
      password: 'Str0ng!Pass',
      acceptedTerms: true,
      acceptedPrivacy: true,
    });
  });

  it('logs out and clears csrf token', async () => {
    const { clearCsrfToken } = await import('@/lib/csrf');
    postMock.mockResolvedValue({ data: { message: 'logged_out' } });

    await expect(authService.logout()).resolves.toEqual({ message: 'logged_out' });
    expect(clearCsrfToken).toHaveBeenCalled();
  });
});
