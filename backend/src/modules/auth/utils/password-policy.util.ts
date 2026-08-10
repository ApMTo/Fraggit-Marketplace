import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as argon2 from 'argon2';

export function enforcePasswordPolicy(password: string): void {
  const meetsPolicy =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  if (!meetsPolicy) {
    throw new BadRequestException({ code: 'errors.weak_password' });
  }
}

export async function hashPassword(password: string): Promise<string> {
  try {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  } catch {
    throw new InternalServerErrorException({
      code: 'errors.failed_to_hash_password',
    });
  }
}

export async function verifyPassword(
  hashedPassword: string | null | undefined,
  password: string,
): Promise<boolean> {
  if (!hashedPassword) {
    return false;
  }

  try {
    return await argon2.verify(hashedPassword, password);
  } catch {
    return false;
  }
}
