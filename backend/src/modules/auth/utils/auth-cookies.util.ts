import type { Request, CookieOptions } from 'express';

const ACCESS_TOKEN_MAX_AGE_MS = 20 * 60 * 1000;
const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const isProduction = process.env.NODE_ENV === 'production';

function getCookieOptions(maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

const refreshCookieOptions: CookieOptions = {
  ...getCookieOptions(SESSION_MAX_AGE_MS),
  path: '/api/auth/refresh',
};

const xsrfCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: isProduction,
  sameSite: 'lax',
  maxAge: SESSION_MAX_AGE_MS,
};

export function setAuthCookies(
  req: Request,
  accessToken: string,
  refreshToken: string,
  deviceId: string,
  sessionId: string,
  csrfToken: string,
) {
  const res = req.res;
  if (!res) return;

  res.cookie(
    'access_token',
    accessToken,
    getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS),
  );
  res.cookie('refresh_token', refreshToken, refreshCookieOptions);
  res.cookie('deviceId', deviceId, getCookieOptions(SESSION_MAX_AGE_MS));
  res.cookie('sessionId', sessionId, getCookieOptions(SESSION_MAX_AGE_MS));
  res.cookie('XSRF-TOKEN', csrfToken, xsrfCookieOptions);
}

export function clearAuthCookies(req: Request) {
  const res = req.res;
  if (!res) return;

  res.clearCookie('access_token', getCookieOptions(ACCESS_TOKEN_MAX_AGE_MS));
  res.clearCookie('refresh_token', refreshCookieOptions);
  res.clearCookie('deviceId', getCookieOptions(SESSION_MAX_AGE_MS));
  res.clearCookie('sessionId', getCookieOptions(SESSION_MAX_AGE_MS));
  res.clearCookie('XSRF-TOKEN', xsrfCookieOptions);
}
