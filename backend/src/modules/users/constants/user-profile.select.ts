import { Prisma } from '@prisma/client';

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
  telegramUsername: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type UserProfile = Prisma.UserGetPayload<{
  select: typeof USER_PROFILE_SELECT;
}>;
