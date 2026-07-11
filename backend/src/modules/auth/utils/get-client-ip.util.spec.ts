import { Request } from 'express';
import { getClientIp } from './get-client-ip.util';

describe('getClientIp', () => {
  it('prefers x-forwarded-for header', () => {
    const req = {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    expect(getClientIp(req)).toBe('203.0.113.1');
  });

  it('falls back to socket remote address', () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    expect(getClientIp(req)).toBe('127.0.0.1');
  });

  it('returns empty string when no ip is available', () => {
    const req = {
      headers: {},
      socket: {},
    } as unknown as Request;

    expect(getClientIp(req)).toBe('');
  });
});
