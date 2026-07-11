import { UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../../database/redis.service';
import {
  checkLoginBlocked,
  clearFailedLoginAttempts,
  registerFailedLoginAttempt,
} from './login-attempts.util';

describe('login-attempts.util', () => {
  let redisService: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
    client: {
      incr: jest.Mock;
      expire: jest.Mock;
    };
  };

  beforeEach(() => {
    redisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      client: {
        incr: jest.fn(),
        expire: jest.fn(),
      },
    };
  });

  describe('checkLoginBlocked', () => {
    it('throws when email is blocked', async () => {
      redisService.get.mockResolvedValue('1');

      await expect(
        checkLoginBlocked(
          redisService as unknown as RedisService,
          'user@test.com',
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('passes when email is not blocked', async () => {
      redisService.get.mockResolvedValue(null);

      await expect(
        checkLoginBlocked(
          redisService as unknown as RedisService,
          'user@test.com',
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('registerFailedLoginAttempt', () => {
    it('sets expire on first failed attempt', async () => {
      redisService.client.incr.mockResolvedValue(1);

      await registerFailedLoginAttempt(
        redisService as unknown as RedisService,
        'user@test.com',
      );

      expect(redisService.client.expire).toHaveBeenCalledWith(
        'auth:login:fail:user@test.com',
        15 * 60,
      );
      expect(redisService.set).not.toHaveBeenCalled();
    });

    it('blocks email after limit is reached', async () => {
      redisService.client.incr.mockResolvedValue(5);

      await registerFailedLoginAttempt(
        redisService as unknown as RedisService,
        'user@test.com',
      );

      expect(redisService.set).toHaveBeenCalledWith(
        'auth:login:block:user@test.com',
        '1',
        15 * 60,
      );
    });
  });

  describe('clearFailedLoginAttempts', () => {
    it('clears fail and block keys', async () => {
      await clearFailedLoginAttempts(
        redisService as unknown as RedisService,
        'user@test.com',
      );

      expect(redisService.del).toHaveBeenCalledWith(
        'auth:login:fail:user@test.com',
      );
      expect(redisService.del).toHaveBeenCalledWith(
        'auth:login:block:user@test.com',
      );
    });
  });
});
