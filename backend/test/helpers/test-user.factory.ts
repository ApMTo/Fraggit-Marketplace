import { randomUUID } from 'crypto';

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
