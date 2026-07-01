import { UserRole } from '../enums/roles.enum';

export class UserPayload {
  userId!: string;
  email!: string;
  role!: UserRole;
  username!: string;
  displayName!: string;
}
