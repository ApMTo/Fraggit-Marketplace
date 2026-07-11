import { Request } from 'express';
import { UserRole } from '../enums/roles.enum';
import { createUserPayload } from './create-user-payload.util';

describe('createUserPayload', () => {
  it('maps user fields into payload', () => {
    const payload = createUserPayload('user-1', {
      email: 'user@test.com',
      role: UserRole.USER,
      username: 'testuser',
      displayName: 'Test User',
    });

    expect(payload).toEqual({
      userId: 'user-1',
      email: 'user@test.com',
      role: UserRole.USER,
      username: 'testuser',
      displayName: 'Test User',
    });
  });
});
