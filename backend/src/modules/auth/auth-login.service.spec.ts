import { UnauthorizedException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';
import { AuthLoginService } from './auth-login.service';
import * as loginAttempts from './utils/login-attempts.util';
import * as passwordPolicy from './utils/password-policy.util';

jest.mock('./utils/login-attempts.util');
jest.mock('./utils/password-policy.util');

describe('AuthLoginService', () => {
  let service: AuthLoginService;
  let prisma: { user: { findUnique: jest.Mock } };
  let redis: Record<string, never>;
  let authSession: { createSession: jest.Mock };
  let authTwoFactor: { issueLoginChallenge: jest.Mock };
  let req: Record<string, never>;

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
    };
    redis = {};
    authSession = {
      createSession: jest.fn().mockResolvedValue({ accessToken: 'token' }),
    };
    authTwoFactor = {
      issueLoginChallenge: jest.fn().mockResolvedValue({
        requiresTwoFactor: true,
        challengeId: 'challenge-1',
      }),
    };
    req = {};

    service = new AuthLoginService(
      prisma as never,
      redis as never,
      authSession as never,
      authTwoFactor as never,
    );

    jest.spyOn(loginAttempts, 'checkLoginBlocked').mockResolvedValue(undefined);
    jest
      .spyOn(loginAttempts, 'registerFailedLoginAttempt')
      .mockResolvedValue(undefined);
    jest
      .spyOn(loginAttempts, 'clearFailedLoginAttempts')
      .mockResolvedValue(undefined);
    jest.spyOn(passwordPolicy, 'verifyPassword').mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates session for valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: 'hash',
      role: UserRole.USER,
      username: 'testuser',
      displayName: 'Test User',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      twoFactorEnabled: false,
    });

    const result = await service.login(
      { email: ' User@Test.com ', password: 'Str0ng!Pass' },
      req as never,
    );

    expect(result).toEqual({ accessToken: 'token' });
    expect(authTwoFactor.issueLoginChallenge).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@test.com' },
      select: expect.any(Object),
    });
    expect(loginAttempts.clearFailedLoginAttempts).toHaveBeenCalled();
  });

  it('issues two-factor challenge when enabled', async () => {
    const user = {
      id: 'user-1',
      email: 'user@test.com',
      passwordHash: 'hash',
      role: UserRole.USER,
      username: 'testuser',
      displayName: 'Test User',
      status: UserStatus.ACTIVE,
      emailVerified: true,
      twoFactorEnabled: true,
    };
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.login(
      { email: 'user@test.com', password: 'Str0ng!Pass' },
      req as never,
    );

    expect(result).toEqual({
      requiresTwoFactor: true,
      challengeId: 'challenge-1',
    });
    expect(authTwoFactor.issueLoginChallenge).toHaveBeenCalledWith(user);
    expect(authSession.createSession).not.toHaveBeenCalled();
  });

  it('throws for unknown user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login(
        { email: 'missing@test.com', password: 'pass' },
        req as never,
      ),
    ).rejects.toThrow(UnauthorizedException);

    expect(loginAttempts.registerFailedLoginAttempt).toHaveBeenCalled();
  });

  it('throws for suspended account', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.SUSPENDED,
      emailVerified: true,
    });

    await expect(
      service.login({ email: 'user@test.com', password: 'pass' }, req as never),
    ).rejects.toMatchObject({ response: { code: 'account_deactivated' } });
  });

  it('throws for unverified email', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      status: UserStatus.ACTIVE,
      emailVerified: false,
    });

    await expect(
      service.login({ email: 'user@test.com', password: 'pass' }, req as never),
    ).rejects.toMatchObject({ response: { code: 'email_not_verified' } });
  });

  it('throws for invalid password', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      passwordHash: 'hash',
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    jest.spyOn(passwordPolicy, 'verifyPassword').mockResolvedValue(false);

    await expect(
      service.login(
        { email: 'user@test.com', password: 'wrong' },
        req as never,
      ),
    ).rejects.toMatchObject({ response: { code: 'invalid_credentials' } });
  });
});
