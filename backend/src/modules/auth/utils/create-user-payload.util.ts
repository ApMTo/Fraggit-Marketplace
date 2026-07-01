import { UserPayload } from '../dto/user-payload.dto';
import { UserRole } from '../enums/roles.enum';

type UserLike = {
  email: string;
  role: UserRole | string;
  username: string;
  displayName: string;
};

export function createUserPayload(
  userId: string,
  user: UserLike,
): UserPayload {
  return {
    userId,
    email: user.email,
    role: user.role as UserRole,
    username: user.username,
    displayName: user.displayName,
  };
}
