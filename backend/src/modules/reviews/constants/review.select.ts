import { Prisma } from '@prisma/client';

export const REVIEW_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export const REVIEW_ORDER_LOT_SELECT = {
  id: true,
  title: true,
} satisfies Prisma.LotSelect;

export const REVIEW_DETAIL_SELECT = {
  id: true,
  orderId: true,
  reviewerId: true,
  revieweeId: true,
  rating: true,
  text: true,
  createdAt: true,
  updatedAt: true,
  reviewer: { select: REVIEW_USER_SELECT },
  reviewee: { select: REVIEW_USER_SELECT },
  order: {
    select: {
      id: true,
      lot: { select: REVIEW_ORDER_LOT_SELECT },
    },
  },
} satisfies Prisma.ReviewSelect;

export type ReviewDetail = Prisma.ReviewGetPayload<{
  select: typeof REVIEW_DETAIL_SELECT;
}>;

export const REVIEW_LIST_SELECT = {
  id: true,
  orderId: true,
  reviewerId: true,
  revieweeId: true,
  rating: true,
  text: true,
  createdAt: true,
  reviewer: { select: REVIEW_USER_SELECT },
  order: {
    select: {
      id: true,
      lot: { select: REVIEW_ORDER_LOT_SELECT },
    },
  },
} satisfies Prisma.ReviewSelect;

export type ReviewListItem = Prisma.ReviewGetPayload<{
  select: typeof REVIEW_LIST_SELECT;
}>;
