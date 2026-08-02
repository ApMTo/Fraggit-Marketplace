import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorCode, isApiError } from './api-error';

function createAxiosError(data: unknown): AxiosError {
  const error = new AxiosError('Request failed');
  error.isAxiosError = true;
  error.response = {
    data,
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {} as never,
  };
  return error;
}

describe('isApiError', () => {
  it('returns true for axios errors', () => {
    expect(isApiError(createAxiosError({}))).toBe(true);
  });

  it('returns false for non-axios errors', () => {
    expect(isApiError(new Error('boom'))).toBe(false);
    expect(isApiError(null)).toBe(false);
  });
});

describe('getApiErrorCode', () => {
  it('returns string message code', () => {
    const error = createAxiosError({
      error: { message: 'invalid_credentials' },
    });

    expect(getApiErrorCode(error)).toBe('invalid_credentials');
  });

  it('returns first item from message array', () => {
    const error = createAxiosError({
      error: { message: ['first_code', 'second_code'] },
    });

    expect(getApiErrorCode(error)).toBe('first_code');
  });

  it('returns code from message object', () => {
    const error = createAxiosError({
      error: { message: { code: 'too_many_attempts' } },
    });

    expect(getApiErrorCode(error)).toBe('too_many_attempts');
  });

  it('returns Nest HttpException string response shape', () => {
    const error = createAxiosError({
      status: 'error',
      error: {
        message: {
          message: 'email_already_exists',
          error: 'Conflict',
          statusCode: 409,
        },
        code: 409,
      },
    });

    expect(getApiErrorCode(error)).toBe('email_already_exists');
  });

  it('returns null when response is missing', () => {
    expect(getApiErrorCode(new Error('boom'))).toBeNull();
  });
});
