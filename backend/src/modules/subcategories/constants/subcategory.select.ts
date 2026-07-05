import { Prisma } from '@prisma/client';

export const SUBCATEGORY_PUBLIC_SELECT = {
  id: true,
  categoryId: true,
  name: true,
  slug: true,
} satisfies Prisma.SubcategorySelect;

const SUBCATEGORY_ADMIN_BASE_SELECT = {
  ...SUBCATEGORY_PUBLIC_SELECT,
  createdAt: true,
  updatedAt: true,
  globalAttributeLinks: {
    select: { attributeDefinitionId: true },
  },
} satisfies Prisma.SubcategorySelect;

export const SUBCATEGORY_ADMIN_SELECT = SUBCATEGORY_ADMIN_BASE_SELECT;

export type SubcategoryPublic = Prisma.SubcategoryGetPayload<{
  select: typeof SUBCATEGORY_PUBLIC_SELECT;
}>;

type SubcategoryAdminRecord = Prisma.SubcategoryGetPayload<{
  select: typeof SUBCATEGORY_ADMIN_BASE_SELECT;
}>;

export type SubcategoryAdmin = Omit<
  SubcategoryAdminRecord,
  'globalAttributeLinks'
> & {
  globalAttributeIds: string[];
};

export function formatSubcategoryAdmin(
  subcategory: SubcategoryAdminRecord,
): SubcategoryAdmin {
  const { globalAttributeLinks, ...rest } = subcategory;

  return {
    ...rest,
    globalAttributeIds: globalAttributeLinks.map(
      (link) => link.attributeDefinitionId,
    ),
  };
}
