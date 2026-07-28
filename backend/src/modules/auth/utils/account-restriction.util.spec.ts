import { UserStatus } from '@prisma/client';
import {
  buildAccountRestriction,
  throwIfAccountRestricted,
  formatStatusCaseId,
} from './account-restriction.util';

describe('account-restriction.util', () => {
  it('throws with restriction payload for banned user', () => {
    let thrown: unknown;

    try {
      throwIfAccountRestricted({
        status: UserStatus.BANNED,
        statusPublicMessage: 'Scam in order #12',
        statusCaseId: 'CASE-ABCDEF12',
        suspendedUntil: null,
      });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toEqual(
      expect.objectContaining({
        response: expect.objectContaining({
          code: 'errors.account_blocked',
          restriction: buildAccountRestriction({
            status: UserStatus.BANNED,
            statusPublicMessage: 'Scam in order #12',
            statusCaseId: 'CASE-ABCDEF12',
            suspendedUntil: null,
          }),
        }),
      }),
    );
  });

  it('does nothing for active user', () => {
    expect(() =>
      throwIfAccountRestricted({
        status: UserStatus.ACTIVE,
        statusPublicMessage: null,
        statusCaseId: null,
        suspendedUntil: null,
      }),
    ).not.toThrow();
  });

  it('formats case id from audit action id', () => {
    expect(formatStatusCaseId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(
      'CASE-A1B2C3D4',
    );
  });
});
