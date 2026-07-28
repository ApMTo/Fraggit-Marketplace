import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../decorators/public.decorator';
import { SessionsService } from '../../sessions/sessions.service';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let sessionsService: { getSession: jest.Mock };

  const createContext = (
    overrides: {
      method?: string;
      cookies?: Record<string, string>;
      headers?: Record<string, string>;
    } = {},
  ): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          method: overrides.method ?? 'POST',
          cookies: overrides.cookies ?? { sessionId: 'session-1' },
          headers: overrides.headers ?? { 'x-csrf-token': 'csrf-token' },
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    sessionsService = {
      getSession: jest.fn().mockResolvedValue({ csrfToken: 'csrf-token' }),
    };
    guard = new CsrfGuard(
      reflector as unknown as Reflector,
      sessionsService as unknown as SessionsService,
    );
  });

  it('allows public routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      IS_PUBLIC_KEY,
      expect.any(Array),
    );
  });

  it('allows safe HTTP methods', async () => {
    await expect(
      guard.canActivate(createContext({ method: 'GET' })),
    ).resolves.toBe(true);
  });

  it('allows requests without session cookie when no access token', async () => {
    await expect(
      guard.canActivate(createContext({ cookies: {} })),
    ).resolves.toBe(true);
  });

  it('rejects mutations with access token but no session cookie', async () => {
    await expect(
      guard.canActivate(
        createContext({ cookies: { access_token: 'jwt-here' } }),
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws when csrf header is missing', async () => {
    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws when csrf token does not match session', async () => {
    sessionsService.getSession.mockResolvedValue({ csrfToken: 'other-token' });

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('allows valid csrf token', async () => {
    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });
});
