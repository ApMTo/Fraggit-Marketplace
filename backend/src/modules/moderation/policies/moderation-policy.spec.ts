import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  assertCanAssignRole,
  assertCanChangeUserStatus,
  assertCanModerateUser,
  assertStaffCanViewDisputeRoom,
  assertCanViewTicketPrivateChat,
  assertTicketAssigneeIsStaff,
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

  describe('assertCanChangeUserStatus', () => {
    it('allows admin', () => {
      expect(() => assertCanChangeUserStatus(UserRole.ADMIN)).not.toThrow();
    });

    it('blocks moderator', () => {
      expect(() => assertCanChangeUserStatus(UserRole.MODERATOR)).toThrow(
        ForbiddenException,
      );
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

  describe('assertTicketAssigneeIsStaff', () => {
    it('allows staff assignees', () => {
      expect(() =>
        assertTicketAssigneeIsStaff(UserRole.MODERATOR),
      ).not.toThrow();
    });

    it('rejects regular users', () => {
      expect(() => assertTicketAssigneeIsStaff(UserRole.USER)).toThrow(
        BadRequestException,
      );
    });
  });

  describe('assertStaffCanViewDisputeRoom', () => {
    const room = { ticket: { assigneeId: 'mod-1' } };

    it('allows admin without assignment', () => {
      expect(() =>
        assertStaffCanViewDisputeRoom(UserRole.ADMIN, 'other', room),
      ).not.toThrow();
    });

    it('allows assigned moderator', () => {
      expect(() =>
        assertStaffCanViewDisputeRoom(UserRole.MODERATOR, 'mod-1', room),
      ).not.toThrow();
    });

    it('blocks unassigned moderator', () => {
      expect(() =>
        assertStaffCanViewDisputeRoom(UserRole.MODERATOR, 'mod-2', room),
      ).toThrow(ForbiddenException);
    });
  });

  describe('assertCanViewTicketPrivateChat', () => {
    it('allows admin without assignment', () => {
      expect(() =>
        assertCanViewTicketPrivateChat(UserRole.ADMIN, 'a1', {
          assigneeId: 'mod-1',
        }),
      ).not.toThrow();
    });

    it('allows assigned moderator', () => {
      expect(() =>
        assertCanViewTicketPrivateChat(UserRole.MODERATOR, 'mod-1', {
          assigneeId: 'mod-1',
        }),
      ).not.toThrow();
    });

    it('blocks unassigned moderator', () => {
      expect(() =>
        assertCanViewTicketPrivateChat(UserRole.MODERATOR, 'mod-2', {
          assigneeId: 'mod-1',
        }),
      ).toThrow(ForbiddenException);
    });
  });
});
