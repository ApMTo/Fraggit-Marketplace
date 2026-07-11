import { describe, expect, it } from 'vitest';
import { isApiSuccessEnvelope, unwrapApiResponse } from './api-response';

describe('isApiSuccessEnvelope', () => {
  it('returns true for success envelope', () => {
    expect(isApiSuccessEnvelope({ status: 'success', result: { id: 1 } })).toBe(
      true,
    );
  });

  it('returns false for plain objects', () => {
    expect(isApiSuccessEnvelope({ id: 1 })).toBe(false);
    expect(isApiSuccessEnvelope(null)).toBe(false);
  });
});

describe('unwrapApiResponse', () => {
  it('unwraps success envelope', () => {
    expect(
      unwrapApiResponse({ status: 'success', result: { token: 'abc' } }),
    ).toEqual({ token: 'abc' });
  });

  it('returns value as-is when not enveloped', () => {
    expect(unwrapApiResponse({ token: 'abc' })).toEqual({ token: 'abc' });
  });
});
