import { Prisma } from '@prisma/client';

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
  price: true,
  stock: true,
  status: true,
  sellerId: true,
  categoryId: true,
  subcategoryId: true,
  createdAt: true,
  updatedAt: true,
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

export const LOT_LIST_SELECT = {
  id: true,
  title: true,
  description: true,
  price: true,
  stock: true,
  status: true,
  categoryId: true,
  subcategoryId: true,
  createdAt: true,
  attributes: {
    select: LOT_LIST_ATTRIBUTE_SELECT,
    orderBy: { attribute: { sortOrder: 'asc' } },
  },
  images: {
    select: LOT_IMAGE_SELECT,
    orderBy: { sortOrder: 'asc' },
    take: 1,
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
    attributes: item.attributes.map(({ value, attribute }) => ({
      key: attribute.key,
      label: attribute.label,
      value,
    })),
  };
}
