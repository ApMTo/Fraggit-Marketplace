import type { UserRole } from './auth';

export type UserStatus = 'ACTIVE' | 'BANNED' | 'SUSPENDED' | 'PENDING_VERIFICATION';

/** Full private profile from GET /users/me */
export type UserProfile = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  status: UserStatus;
  rating: number;
  ratingCount: number;
  successfulSales: number;
  emailVerified: boolean;
  telegramUsername: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Public profile from GET /users/:username */
export type UserPublicProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  rating: number;
  ratingCount: number;
  successfulSales: number;
  createdAt: string;
};

export type UserProfileResponse = {
  message: { code: string };
  user: UserProfile;
};

export type UserPublicProfileResponse = {
  message: { code: string };
  user: UserPublicProfile;
};

export type UpdateProfilePayload = {
  username: string;
  displayName: string;
  bio?: string | null;
  avatar?: File;
};

export const PROFILE_BIO_MAX_LENGTH = 500;
export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';
