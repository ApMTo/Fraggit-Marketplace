import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { resolveAuthErrorKey } from './auth-errors';

function createAxiosError(code: string): AxiosError {
  const error = new AxiosError('Request failed');
  error.isAxiosError = true;
  error.response = {
    data: { error: { message: code } },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {} as never,
  };
  return error;
}

describe('resolveAuthErrorKey', () => {
  it('returns known error code without errors prefix', () => {
    expect(resolveAuthErrorKey(createAxiosError('errors.invalid_credentials'))).toBe(
      'invalid_credentials',
    );
  });

  it('returns known error code as-is', () => {
    expect(resolveAuthErrorKey(createAxiosError('too_many_attempts'))).toBe(
      'too_many_attempts',
    );
  });

  it('returns session security codes', () => {
    expect(resolveAuthErrorKey(createAxiosError('errors.invalid_device'))).toBe(
      'invalid_device',
    );
    expect(resolveAuthErrorKey(createAxiosError('errors.ip_mismatch'))).toBe(
      'ip_mismatch',
    );
    expect(resolveAuthErrorKey(createAxiosError('errors.ua_mismatch'))).toBe(
      'ua_mismatch',
    );
  });

  it('returns validation password mismatch', () => {
    expect(
      resolveAuthErrorKey(createAxiosError('validation.password_mismatch')),
    ).toBe('password_mismatch');
  });

  it('returns generic for unknown codes', () => {
    expect(resolveAuthErrorKey(createAxiosError('something_unknown'))).toBe(
      'generic',
    );
  });

  it('returns generic for non-api errors', () => {
    expect(resolveAuthErrorKey(new Error('network'))).toBe('generic');
  });
});
