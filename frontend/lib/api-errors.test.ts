import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { resolveApiError, resolveApiErrorKey } from './api-errors';

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

describe('resolveApiError', () => {
  it('normalizes errors and messages prefixes', () => {
    expect(resolveApiErrorKey(createAxiosError('errors.lot_not_found'))).toBe(
      'lot_not_found',
    );
    expect(resolveApiErrorKey(createAxiosError('validation.invalid_email'))).toBe(
      'invalid_email',
    );
  });

  it('extracts parameterized error keys', () => {
    expect(resolveApiError(createAxiosError('attribute_required:platform'))).toEqual(
      {
        key: 'attribute_required',
        values: { key: 'platform' },
      },
    );
  });

  it('returns generic for non-api errors', () => {
    expect(resolveApiError(new Error('network'))).toEqual({ key: 'generic' });
  });
});
