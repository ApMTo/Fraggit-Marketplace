import { randomUUID } from 'node:crypto';
import Redis from 'ioredis';

export type TestUserPayload = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

export function createTestUserPayload(
  overrides: Partial<TestUserPayload> = {},
): TestUserPayload {
  const suffix = randomUUID().replace(/-/g, '').slice(0, 10);

  return {
    username: `e2e_${suffix}`,
    displayName: 'E2E Test User',
    email: `e2e_${suffix}@fraggit.test`,
    password: 'Str0ng!Pass',
    ...overrides,
  };
}

export async function registerAndGetVerificationToken(
  user: TestUserPayload,
): Promise<string> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

  const response = await fetch(`${backendUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error(`Registration failed with status ${response.status}`);
  }

  const redis = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    const token = await redis.get(`reg:email:${user.email.toLowerCase()}`);

    if (!token) {
      throw new Error('Verification token was not found in Redis');
    }

    return token;
  } finally {
    await redis.quit().catch(() => undefined);
  }
}

export async function areE2eServicesAvailable(): Promise<boolean> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3001';

  try {
    const response = await fetch(`${backendUrl}/api/categories`, {
      signal: AbortSignal.timeout(3_000),
    });

    return response.ok;
  } catch {
    return false;
  }
}
