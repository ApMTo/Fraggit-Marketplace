import { Prisma } from '@prisma/client';

export const LOT_SELLER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  rating: true,
  ratingCount: true,
} satisfies Prisma.UserSelect;

export const LOT_ATTRIBUTE_VALUE_SELECT = {
  id: true,
  attributeId: true,
  value: true,
  attribute: {
    select: {
      key: true,
      label: true,
      type: true,
    },
  },
} satisfies Prisma.LotAttributeValueSelect;

export const LOT_IMAGE_SELECT = {
  id: true,
  url: true,
  sortOrder: true,
} satisfies Prisma.LotImageSelect;

export const LOT_DETAIL_SELECT = {
  id: true,
  title: true,
  description: true,
  previewUrl: true,
  type: true,
  serviceQuestion: true,
  price: true,
  stock: true,
  status: true,
  sellerId: true,
  categoryId: true,
  subcategoryId: true,
  createdAt: true,
  updatedAt: true,
  seller: { select: LOT_SELLER_SELECT },
  attributes: {
    select: LOT_ATTRIBUTE_VALUE_SELECT,
    orderBy: { attribute: { sortOrder: 'asc' } },
  },
  images: {
    select: LOT_IMAGE_SELECT,
    orderBy: { sortOrder: 'asc' },
  },
} satisfies Prisma.LotSelect;

export type LotDetail = Prisma.LotGetPayload<{
  select: typeof LOT_DETAIL_SELECT;
}>;

export const LOT_LIST_ATTRIBUTE_SELECT = {
  value: true,
  attribute: {
    select: {
      key: true,
      label: true,
    },
  },
} satisfies Prisma.LotAttributeValueSelect;

/** List/table payload: no images; first few attrs for preview columns. */
export const LOT_LIST_ATTRIBUTE_PREVIEW_TAKE = 3;

export const LOT_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  previewUrl: true,
  type: true,
  price: true,
  stock: true,
  status: true,
  categoryId: true,
  subcategoryId: true,
  createdAt: true,
  seller: { select: LOT_SELLER_SELECT },
  category: { select: { slug: true } },
  subcategory: { select: { slug: true } },
  attributes: {
    select: LOT_LIST_ATTRIBUTE_SELECT,
    orderBy: { attribute: { sortOrder: 'asc' } },
    take: LOT_LIST_ATTRIBUTE_PREVIEW_TAKE,
  },
} satisfies Prisma.LotSelect;

type LotListItemRaw = Prisma.LotGetPayload<{
  select: typeof LOT_LIST_SELECT;
}>;

export type LotListItemAttribute = {
  key: string;
  label: string;
  value: string;
};

export type LotListItem = Omit<LotListItemRaw, 'attributes'> & {
  attributes: LotListItemAttribute[];
};

export function formatLotListItem(item: LotListItemRaw): LotListItem {
  return {
    ...item,
    description: item.description
      ? item.description.slice(0, 160)
      : item.description,
    attributes: item.attributes.map(({ value, attribute }) => ({
      key: attribute.key,
      label: attribute.label,
      value,
    })),
  };
}
