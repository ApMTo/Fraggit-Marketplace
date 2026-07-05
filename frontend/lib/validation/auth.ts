const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'usernameRequired';
  }

  if (trimmed.length < 3) {
    return 'usernameLength';
  }

  if (!USERNAME_PATTERN.test(trimmed)) {
    return 'usernameFormat';
  }

  return undefined;
}

export function validateDisplayName(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'displayNameRequired';
  }

  if (trimmed.length < 2) {
    return 'displayNameLength';
  }

  return undefined;
}

export function validateEmail(value: string): string | undefined {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'emailRequired';
  }

  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'invalidEmail';
  }

  return undefined;
}

export function validateLoginPassword(value: string): string | undefined {
  if (!value) {
    return 'passwordRequired';
  }

  if (value.length < 8) {
    return 'passwordMinLength';
  }

  return undefined;
}

export function validateRegisterPassword(value: string): string | undefined {
  if (!value) {
    return 'passwordRequired';
  }

  if (value.length < 10) {
    return 'passwordMinLength10';
  }

  const meetsPolicy =
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  if (!meetsPolicy) {
    return 'passwordPolicy';
  }

  return undefined;
}

export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | undefined {
  if (!confirmation) {
    return 'passwordConfirmRequired';
  }

  if (password !== confirmation) {
    return 'passwordMismatch';
  }

  return undefined;
}
