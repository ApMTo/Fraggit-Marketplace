import { Prisma } from '@prisma/client';

/** Full private profile for GET /users/me */
export const USER_PROFILE_SELECT = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  role: true,
  status: true,
  rating: true,
  ratingCount: true,
  successfulSales: true,
  emailVerified: true,
  twoFactorEnabled: true,
  telegramUsername: true,
  emailChangedAt: true,
  usernameChangedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserProfile = Prisma.UserGetPayload<{
  select: typeof USER_PROFILE_SELECT;
}>;

export const USER_PUBLIC_PROFILE_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  rating: true,
  ratingCount: true,
  successfulSales: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type UserPublicProfile = Prisma.UserGetPayload<{
  select: typeof USER_PUBLIC_PROFILE_SELECT;
}>;
