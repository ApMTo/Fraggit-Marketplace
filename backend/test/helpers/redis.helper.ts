import Redis from 'ioredis';

function createRedisClient(): Redis {
  return new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });
}

export async function getRegistrationTokenForEmail(
  email: string,
): Promise<string | null> {
  const redis = createRedisClient();

  try {
    await redis.connect();
    return redis.get(`reg:email:${email.toLowerCase()}`);
  } finally {
    await redis.quit().catch(() => undefined);
  }
}
