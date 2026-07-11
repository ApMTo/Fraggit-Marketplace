import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '../auth/enums/roles.enum';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: {
    signAsync: jest.Mock;
    verifyAsync: jest.Mock;
  };
  let configService: { getOrThrow: jest.Mock };

  const payload = {
    userId: 'user-1',
    email: 'user@test.com',
    role: UserRole.USER,
    username: 'testuser',
    displayName: 'Test User',
  };

  beforeEach(() => {
    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
      verifyAsync: jest.fn(),
    };
    configService = {
      getOrThrow: jest.fn((key: string) => {
        if (key === 'jwt.accessSecret') return 'access-secret';
        if (key === 'jwt.refreshSecret') return 'refresh-secret';
        throw new Error(`Unknown key: ${key}`);
      }),
    };

    service = new TokenService(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('generates access and refresh tokens', async () => {
    const result = await service.generateTokens(payload);

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.refreshTokenId).toEqual(expect.any(String));
    expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
  });

  it('verifies refresh token with configured secret', async () => {
    jwtService.verifyAsync.mockResolvedValue({ ...payload, jti: 'jti-1' });

    await expect(service.verifyRefreshToken('refresh-token')).resolves.toEqual({
      ...payload,
      jti: 'jti-1',
    });

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('refresh-token', {
      secret: 'refresh-secret',
    });
  });
});
