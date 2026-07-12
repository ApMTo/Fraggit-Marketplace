import { Prisma } from '@prisma/client';

import type { AppLocale, LocalizedName } from '../../../common/i18n/locale';
import {
  parseLocalizedName,
  resolveLocalizedName,
} from '../../../common/i18n/locale';

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

type SubcategoryPublicRecord = Prisma.SubcategoryGetPayload<{
  select: typeof SUBCATEGORY_PUBLIC_SELECT;
}>;

type SubcategoryAdminRecord = Prisma.SubcategoryGetPayload<{
  select: typeof SUBCATEGORY_ADMIN_BASE_SELECT;
}>;

export type SubcategoryPublic = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
};

export type SubcategoryAdmin = SubcategoryPublic & {
  translations: LocalizedName;
  createdAt: Date;
  updatedAt: Date;
  globalAttributeIds: string[];
};

export function formatSubcategoryPublic(
  subcategory: SubcategoryPublicRecord,
  locale?: AppLocale | null,
): SubcategoryPublic {
  return {
    id: subcategory.id,
    categoryId: subcategory.categoryId,
    name: resolveLocalizedName(subcategory.name, locale),
    slug: subcategory.slug,
  };
}

export function formatSubcategoryAdmin(
  subcategory: SubcategoryAdminRecord,
  locale?: AppLocale | null,
): SubcategoryAdmin {
  const { globalAttributeLinks, name, ...rest } = subcategory;

  return {
    ...rest,
    name: resolveLocalizedName(name, locale),
    translations: parseLocalizedName(name),
    globalAttributeIds: globalAttributeLinks.map(
      (link) => link.attributeDefinitionId,
    ),
  };
}
