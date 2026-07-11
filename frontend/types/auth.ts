export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN' | 'OWNER';

export type AuthUser = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
};

export type AuthSessionResponse = {
  accessToken: string;
  sessionToken: string;
  csrfToken: string;
};

export type AuthMessageResponse = {
  message: string;
};

export type AuthProfileResponse = {
  message: { code: string };
  user: AuthUser;
};

export type VerifyUserResponse = {
  message: string;
  user: AuthUser;
};

export type LogoutResponse = {
  message: { code: string };
};

export type RegisterPayload = {
  username: string;
  displayName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ApiErrorBody = {
  status: 'error';
  error: {
    message: string | { code: string } | string[];
    code: number;
  };
};
