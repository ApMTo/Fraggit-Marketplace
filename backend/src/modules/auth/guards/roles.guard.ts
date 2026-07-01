import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, RoleHierarchy } from '../enums/roles.enum';
import { ROLES_KEY, STRICT_ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const strictRoles = this.reflector.getAllAndOverride<UserRole[]>(
      STRICT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: UserRole } }>();

    const userRole = request.user?.role;

    if (!userRole) {
      throw new ForbiddenException({ code: 'errors.insufficient_role' });
    }

    if (strictRoles?.length && requiredRoles?.length) {
      throw new Error(
        'Invalid usage of @Roles and @StrictRoles together on the same route',
      );
    }

    if (strictRoles?.length) {
      if (!strictRoles.includes(userRole)) {
        throw new ForbiddenException({ code: 'errors.insufficient_role' });
      }
      return true;
    }

    if (!requiredRoles?.length) {
      return true;
    }

    const userLevel = RoleHierarchy[userRole];
    const hasAccess = requiredRoles.some(
      (role) => userLevel >= RoleHierarchy[role],
    );

    if (!hasAccess) {
      throw new ForbiddenException({ code: 'errors.insufficient_role' });
    }

    return true;
  }
}
