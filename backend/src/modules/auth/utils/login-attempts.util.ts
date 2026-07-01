import { UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../../database/redis.service';

const LOGIN_FAIL_WINDOW_SECONDS = 15 * 60;
const LOGIN_FAIL_LIMIT = 5;

export async function checkLoginBlocked(
  redisService: RedisService,
  email: string,
) {
  const blocked = await redisService.get(`auth:login:block:${email}`);
  if (blocked) {
    throw new UnauthorizedException({ code: 'too_many_attempts' });
  }
}

export async function registerFailedLoginAttempt(
  redisService: RedisService,
  email: string,
) {
  const key = `auth:login:fail:${email}`;
  const attempts = await redisService.client.incr(key);
  if (attempts === 1) {
    await redisService.client.expire(key, LOGIN_FAIL_WINDOW_SECONDS);
  }
  if (attempts >= LOGIN_FAIL_LIMIT) {
    await redisService.set(
      `auth:login:block:${email}`,
      '1',
      LOGIN_FAIL_WINDOW_SECONDS,
    );
  }
}

export async function clearFailedLoginAttempts(
  redisService: RedisService,
  email: string,
) {
  await redisService.del(`auth:login:fail:${email}`);
  await redisService.del(`auth:login:block:${email}`);
}
