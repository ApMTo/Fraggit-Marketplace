import { Prisma } from '@prisma/client';

export const SUBCATEGORY_PUBLIC_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
} satisfies Prisma.SubcategorySelect;

export const SUBCATEGORY_ADMIN_SELECT = {
  ...SUBCATEGORY_PUBLIC_SELECT,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubcategorySelect;

export type SubcategoryPublic = Prisma.SubcategoryGetPayload<{
  select: typeof SUBCATEGORY_PUBLIC_SELECT;
}>;

export type SubcategoryAdmin = Prisma.SubcategoryGetPayload<{
  select: typeof SUBCATEGORY_ADMIN_SELECT;
}>;
