import { Prisma } from '@prisma/client';

export const MOD_USER_LIST_SELECT = {
  id: true,
  email: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  status: true,
  suspendedUntil: true,
  rating: true,
  ratingCount: true,
  successfulSales: true,
  twoFactorEnabled: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type ModUserListItem = Prisma.UserGetPayload<{
  select: typeof MOD_USER_LIST_SELECT;
}>;

export const MOD_LOT_LIST_SELECT = {
  id: true,
  title: true,
  price: true,
  stock: true,
  status: true,
  previewUrl: true,
  sellerId: true,
  categoryId: true,
  subcategoryId: true,
  createdAt: true,
  updatedAt: true,
  seller: {
    select: {
      id: true,
      username: true,
      displayName: true,
      status: true,
      role: true,
    },
  },
} satisfies Prisma.LotSelect;

export type ModLotListItem = Prisma.LotGetPayload<{
  select: typeof MOD_LOT_LIST_SELECT;
}>;

export const MOD_REPORT_LIST_SELECT = {
  id: true,
  reporterId: true,
  targetType: true,
  targetId: true,
  reason: true,
  details: true,
  status: true,
  assignedToId: true,
  resolvedById: true,
  resolutionNote: true,
  createdAt: true,
  updatedAt: true,
  reporter: {
    select: { id: true, username: true, displayName: true },
  },
  assignedTo: {
    select: { id: true, username: true, displayName: true },
  },
} satisfies Prisma.ReportSelect;

export type ModReportListItem = Prisma.ReportGetPayload<{
  select: typeof MOD_REPORT_LIST_SELECT;
}>;

export const MOD_TICKET_LIST_SELECT = {
  id: true,
  type: true,
  orderId: true,
  reporterId: true,
  subject: true,
  body: true,
  status: true,
  priority: true,
  assigneeId: true,
  resolution: true,
  resolutionNote: true,
  createdAt: true,
  updatedAt: true,
  reporter: {
    select: { id: true, username: true, displayName: true },
  },
  assignee: {
    select: { id: true, username: true, displayName: true },
  },
  order: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
      buyerId: true,
      sellerId: true,
      autoApproveAt: true,
      disputePausedFromStatus: true,
      autoApproveRemainingMs: true,
      buyer: {
        select: { id: true, username: true, displayName: true },
      },
      seller: {
        select: { id: true, username: true, displayName: true },
      },
      lot: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
} satisfies Prisma.TicketSelect;

export type ModTicketListItem = Prisma.TicketGetPayload<{
  select: typeof MOD_TICKET_LIST_SELECT;
}>;
