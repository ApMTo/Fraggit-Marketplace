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
