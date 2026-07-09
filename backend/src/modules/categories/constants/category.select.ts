import { Prisma } from '@prisma/client';

export const CATEGORY_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  iconUrl: true,
  previewUrl: true,
} satisfies Prisma.CategorySelect;

export const CATEGORY_ADMIN_SELECT = {
  ...CATEGORY_PUBLIC_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

export type CategoryPublic = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_PUBLIC_SELECT;
}>;

export type CategoryAdmin = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_ADMIN_SELECT;
}>;
