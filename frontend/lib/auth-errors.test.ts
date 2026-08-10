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

  it('returns known code from Nest HttpException response shape', () => {
    const error = new AxiosError('Request failed');
    error.isAxiosError = true;
    error.response = {
      data: {
        status: 'error',
        error: {
          message: {
            message: 'email_already_exists',
            error: 'Conflict',
            statusCode: 409,
          },
          code: 409,
        },
      },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
    };

    expect(resolveAuthErrorKey(error)).toBe('email_already_exists');
  });

  it('prefers API message over Axios ERR_* code', () => {
    const error = new AxiosError('Request failed');
    error.isAxiosError = true;
    error.code = 'ERR_BAD_REQUEST';
    error.response = {
      data: {
        status: 'error',
        error: {
          message: { code: 'username_already_exists' },
          code: 409,
        },
      },
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
    };

    expect(resolveAuthErrorKey(error)).toBe('username_already_exists');
  });

  it('reads plain redirect error payloads', () => {
    expect(resolveAuthErrorKey({ code: 'google_auth_failed' })).toBe(
      'google_auth_failed',
    );
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
