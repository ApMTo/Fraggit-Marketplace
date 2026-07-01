import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/roles.enum';

export const ROLES_KEY = 'roles';
export const STRICT_ROLES_KEY = 'strict_roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

export const StrictRoles = (...roles: UserRole[]) =>
  SetMetadata(STRICT_ROLES_KEY, roles);
