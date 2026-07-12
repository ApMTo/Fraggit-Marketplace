import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { resolveAdminErrorKey } from './admin-errors';

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

describe('resolveAdminErrorKey', () => {
  it('maps known snake_case codes to camelCase keys', () => {
    expect(resolveAdminErrorKey(createAxiosError('category_not_found'))).toBe(
      'categoryNotFound',
    );
  });

  it('maps prefixed insufficient role', () => {
    expect(resolveAdminErrorKey(createAxiosError('errors.insufficient_role'))).toBe(
      'insufficientRole',
    );
  });

  it('maps file upload errors', () => {
    expect(resolveAdminErrorKey(createAxiosError('file_size_exceeded'))).toBe(
      'fileSizeExceeded',
    );
    expect(resolveAdminErrorKey(createAxiosError('upload_failed'))).toBe(
      'uploadFailed',
    );
  });

  it('maps unique constraint failures', () => {
    expect(resolveAdminErrorKey(createAxiosError('unique_constraint_failed'))).toBe(
      'uniqueConstraintFailed',
    );
  });

  it('returns generic for unknown codes', () => {
    expect(resolveAdminErrorKey(createAxiosError('something_unknown'))).toBe(
      'generic',
    );
  });

  it('returns generic for non-api errors', () => {
    expect(resolveAdminErrorKey(new Error('network'))).toBe('generic');
  });
});
