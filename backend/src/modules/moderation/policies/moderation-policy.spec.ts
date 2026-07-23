import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  assertCanAssignRole,
  assertCanModerateUser,
  isStaffRole,
} from './moderation-policy';

describe('moderation-policy', () => {
  describe('assertCanModerateUser', () => {
    it('allows moderator to act on USER', () => {
      expect(() =>
        assertCanModerateUser(UserRole.MODERATOR, UserRole.USER),
      ).not.toThrow();
    });

    it('blocks moderator from acting on peer or higher', () => {
      expect(() =>
        assertCanModerateUser(UserRole.MODERATOR, UserRole.MODERATOR),
      ).toThrow(ForbiddenException);
      expect(() =>
        assertCanModerateUser(UserRole.MODERATOR, UserRole.ADMIN),
      ).toThrow(ForbiddenException);
    });

    it('allows admin to act on moderator', () => {
      expect(() =>
        assertCanModerateUser(UserRole.ADMIN, UserRole.MODERATOR),
      ).not.toThrow();
    });
  });

  describe('assertCanAssignRole', () => {
    it('blocks admin from assigning roles', () => {
      expect(() =>
        assertCanAssignRole(UserRole.ADMIN, UserRole.MODERATOR),
      ).toThrow(ForbiddenException);
    });

    it('allows super admin to assign moderator but not admin', () => {
      expect(() =>
        assertCanAssignRole(UserRole.SUPER_ADMIN, UserRole.MODERATOR),
      ).not.toThrow();
      expect(() =>
        assertCanAssignRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
      ).toThrow(ForbiddenException);
    });

    it('allows owner to assign admin', () => {
      expect(() =>
        assertCanAssignRole(UserRole.OWNER, UserRole.ADMIN),
      ).not.toThrow();
    });

    it('blocks assigning peer or higher role', () => {
      expect(() =>
        assertCanAssignRole(UserRole.SUPER_ADMIN, UserRole.SUPER_ADMIN),
      ).toThrow(ForbiddenException);
      expect(() => assertCanAssignRole(UserRole.OWNER, UserRole.OWNER)).toThrow(
        ForbiddenException,
      );
    });
  });

  describe('isStaffRole', () => {
    it('detects staff roles', () => {
      expect(isStaffRole(UserRole.USER)).toBe(false);
      expect(isStaffRole(UserRole.MODERATOR)).toBe(true);
      expect(isStaffRole(UserRole.OWNER)).toBe(true);
    });
  });
});
