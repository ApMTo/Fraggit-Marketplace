import { describe, expect, it } from 'vitest';
import {
  validateBio,
  validateDisplayName,
  validateEmail,
  validateLoginPassword,
  validatePasswordConfirmation,
  validateRegisterPassword,
  validateUsername,
} from './auth';

describe('validateUsername', () => {
  it('returns undefined for valid username', () => {
    expect(validateUsername('user_123')).toBeUndefined();
  });

  it('returns usernameRequired for empty value', () => {
    expect(validateUsername('   ')).toBe('usernameRequired');
  });

  it('returns usernameLength when too short', () => {
    expect(validateUsername('ab')).toBe('usernameLength');
  });

  it('returns usernameFormat for invalid characters', () => {
    expect(validateUsername('user-name')).toBe('usernameFormat');
  });
});

describe('validateDisplayName', () => {
  it('returns undefined for valid display name', () => {
    expect(validateDisplayName('John Doe')).toBeUndefined();
  });

  it('returns displayNameRequired for empty value', () => {
    expect(validateDisplayName('')).toBe('displayNameRequired');
  });

  it('returns displayNameLength when too short', () => {
    expect(validateDisplayName('A')).toBe('displayNameLength');
  });
});

describe('validateBio', () => {
  it('returns undefined when within limit', () => {
    expect(validateBio('Hello', 500)).toBeUndefined();
  });

  it('returns bioMax when too long', () => {
    expect(validateBio('a'.repeat(501), 500)).toBe('bioMax');
  });
});

describe('validateEmail', () => {
  it('returns undefined for valid email', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
  });

  it('returns emailRequired for empty value', () => {
    expect(validateEmail('')).toBe('emailRequired');
  });

  it('returns invalidEmail for malformed address', () => {
    expect(validateEmail('not-an-email')).toBe('invalidEmail');
  });
});

describe('validateLoginPassword', () => {
  it('returns undefined for password with 8+ chars', () => {
    expect(validateLoginPassword('password123')).toBeUndefined();
  });

  it('returns passwordRequired for empty value', () => {
    expect(validateLoginPassword('')).toBe('passwordRequired');
  });

  it('returns passwordMinLength when too short', () => {
    expect(validateLoginPassword('short')).toBe('passwordMinLength');
  });
});

describe('validateRegisterPassword', () => {
  it('returns undefined for strong password', () => {
    expect(validateRegisterPassword('Str0ng!Pass')).toBeUndefined();
  });

  it('returns passwordMinLength10 when too short', () => {
    expect(validateRegisterPassword('Short1!')).toBe('passwordMinLength10');
  });

  it('returns passwordPolicy when complexity rules fail', () => {
    expect(validateRegisterPassword('alllowercase123')).toBe('passwordPolicy');
  });
});

describe('validatePasswordConfirmation', () => {
  it('returns undefined when passwords match', () => {
    expect(validatePasswordConfirmation('Str0ng!Pass', 'Str0ng!Pass')).toBeUndefined();
  });

  it('returns passwordConfirmRequired for empty confirmation', () => {
    expect(validatePasswordConfirmation('Str0ng!Pass', '')).toBe(
      'passwordConfirmRequired',
    );
  });

  it('returns passwordMismatch when values differ', () => {
    expect(validatePasswordConfirmation('Str0ng!Pass', 'Other1!Pass')).toBe(
      'passwordMismatch',
    );
  });
});
