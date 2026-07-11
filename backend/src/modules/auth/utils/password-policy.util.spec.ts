import { BadRequestException } from '@nestjs/common';
import {
  enforcePasswordPolicy,
  hashPassword,
  verifyPassword,
} from './password-policy.util';

describe('password-policy.util', () => {
  describe('enforcePasswordPolicy', () => {
    it('accepts strong passwords', () => {
      expect(() => enforcePasswordPolicy('Str0ng!Pass')).not.toThrow();
    });

    it('rejects weak passwords', () => {
      expect(() => enforcePasswordPolicy('weakpass')).toThrow(
        BadRequestException,
      );
      expect(() => enforcePasswordPolicy('NoSpecial1')).toThrow(
        BadRequestException,
      );
    });
  });

  describe('hashPassword / verifyPassword', () => {
    it('hashes and verifies password', async () => {
      const password = 'Str0ng!Pass';
      const hash = await hashPassword(password);

      expect(hash).not.toBe(password);
      await expect(verifyPassword(hash, password)).resolves.toBe(true);
      await expect(verifyPassword(hash, 'wrong-password')).resolves.toBe(false);
    });
  });
});
