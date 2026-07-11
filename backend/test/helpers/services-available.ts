import Redis from 'ioredis';
import { Client } from 'pg';

export async function areE2eServicesAvailable(): Promise<boolean> {
  const databaseUrl =
    process.env.DATABASE_URL ??
    'postgresql://fraggit:fraggit@localhost:5432/fraggit?schema=public';

  const redisHost = process.env.REDIS_HOST ?? 'localhost';
  const redisPort = Number(process.env.REDIS_PORT ?? 6379);

  let pgClient: Client | null = null;
  let redisClient: Redis | null = null;

  try {
    pgClient = new Client({ connectionString: databaseUrl });
    await pgClient.connect();
    await pgClient.query('SELECT 1');

    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 1,
      connectTimeout: 3_000,
      lazyConnect: true,
    });
    await redisClient.connect();
    await redisClient.ping();

    return true;
  } catch {
    return false;
  } finally {
    await pgClient?.end().catch(() => undefined);
    await redisClient?.quit().catch(() => undefined);
  }
}
