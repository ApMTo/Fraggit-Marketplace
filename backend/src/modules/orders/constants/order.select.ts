import { Prisma } from '@prisma/client';

export const ORDER_LOT_SELECT = {
  id: true,
  title: true,
  price: true,
  status: true,
  previewUrl: true,
  images: {
    select: { url: true, sortOrder: true },
    orderBy: { sortOrder: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.LotSelect;

export const ORDER_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export const ORDER_DETAIL_SELECT = {
  id: true,
  orderNumber: true,
  lotId: true,
  buyerId: true,
  sellerId: true,
  price: true,
  status: true,
  credentials: true,
  credentialsProvidedAt: true,
  autoApproveAt: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  lot: { select: ORDER_LOT_SELECT },
  buyer: { select: ORDER_USER_SELECT },
  seller: { select: ORDER_USER_SELECT },
} satisfies Prisma.OrderSelect;

export type OrderDetail = Prisma.OrderGetPayload<{
  select: typeof ORDER_DETAIL_SELECT;
}>;

export const ORDER_LIST_SELECT = {
  id: true,
  orderNumber: true,
  lotId: true,
  buyerId: true,
  sellerId: true,
  price: true,
  status: true,
  credentialsProvidedAt: true,
  autoApproveAt: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  lot: { select: ORDER_LOT_SELECT },
  buyer: { select: ORDER_USER_SELECT },
  seller: { select: ORDER_USER_SELECT },
} satisfies Prisma.OrderSelect;

export type OrderListItem = Prisma.OrderGetPayload<{
  select: typeof ORDER_LIST_SELECT;
}>;
