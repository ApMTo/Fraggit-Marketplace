import { Request, Response } from 'express';
import { clearAuthCookies, setAuthCookies } from './auth-cookies.util';

describe('auth-cookies.util', () => {
  let res: {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };
  let req: Request;

  beforeEach(() => {
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    req = { res: res as unknown as Response } as Request;
  });

  it('sets all auth cookies', () => {
    setAuthCookies(req, 'access', 'refresh', 'device-1', 'session-1', 'csrf-1');

    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'access',
      expect.objectContaining({ httpOnly: true }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
      expect.objectContaining({ path: '/api/auth/refresh' }),
    );
    expect(res.cookie).toHaveBeenCalledWith('deviceId', 'device-1', expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith('sessionId', 'session-1', expect.any(Object));
    expect(res.cookie).toHaveBeenCalledWith(
      'XSRF-TOKEN',
      'csrf-1',
      expect.objectContaining({ httpOnly: false }),
    );
  });

  it('clears all auth cookies', () => {
    clearAuthCookies(req);

    expect(res.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('deviceId', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('sessionId', expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith('XSRF-TOKEN', expect.any(Object));
  });

  it('does nothing when response is missing', () => {
    setAuthCookies({} as Request, 'a', 'r', 'd', 's', 'c');
    clearAuthCookies({} as Request);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });
});
