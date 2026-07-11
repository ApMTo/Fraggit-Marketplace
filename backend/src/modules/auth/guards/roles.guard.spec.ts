import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/roles.enum';
import { ROLES_KEY, STRICT_ROLES_KEY } from '../decorators/roles.decorator';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };

  const createContext = (role?: UserRole): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: role ? { role } : undefined }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('allows access when no roles are required', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === ROLES_KEY) return undefined;
      if (key === STRICT_ROLES_KEY) return undefined;
      return undefined;
    });

    expect(guard.canActivate(createContext(UserRole.USER))).toBe(true);
  });

  it('throws when user role is missing', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });

  it('allows hierarchy-based access', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === ROLES_KEY) return [UserRole.MODERATOR];
      if (key === STRICT_ROLES_KEY) return undefined;
      return undefined;
    });

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
    expect(() => guard.canActivate(createContext(UserRole.USER))).toThrow(
      ForbiddenException,
    );
  });

  it('enforces strict role match', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === ROLES_KEY) return undefined;
      if (key === STRICT_ROLES_KEY) return [UserRole.ADMIN];
      return undefined;
    });

    expect(guard.canActivate(createContext(UserRole.ADMIN))).toBe(true);
    expect(() => guard.canActivate(createContext(UserRole.MODERATOR))).toThrow(
      ForbiddenException,
    );
  });

  it('throws when strict and hierarchy decorators are combined', () => {
    reflector.getAllAndOverride.mockImplementation((key: string) => {
      if (key === ROLES_KEY) return [UserRole.ADMIN];
      if (key === STRICT_ROLES_KEY) return [UserRole.ADMIN];
      return undefined;
    });

    expect(() => guard.canActivate(createContext(UserRole.ADMIN))).toThrow(
      'Invalid usage of @Roles and @StrictRoles together on the same route',
    );
  });
});
