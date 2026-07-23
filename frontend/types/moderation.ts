import type { UserRole } from './auth';
import type { UserStatus } from './user';

export type LotStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'ARCHIVED'
  | 'REMOVED'
  | 'UNDER_REVIEW';

export type ReportTargetType = 'USER' | 'LOT' | 'REVIEW' | 'MESSAGE';
export type ReportReason = 'SPAM' | 'SCAM' | 'ABUSE' | 'STOLEN' | 'OTHER';
export type ReportStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type TicketType = 'ORDER_DISPUTE' | 'SUPPORT';
export type TicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_USER'
  | 'RESOLVED'
  | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH';
export type TicketResolution =
  | 'NONE'
  | 'BUYER_FAVOR'
  | 'SELLER_FAVOR'
  | 'NO_ACTION';

export type ModUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  suspendedUntil: string | null;
  rating: number;
  ratingCount: number;
  successfulSales: number;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ModLot = {
  id: string;
  title: string;
  price: string;
  stock: number;
  status: LotStatus;
  previewUrl: string | null;
  sellerId: string;
  categoryId: string;
  subcategoryId: string;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    username: string;
    displayName: string;
    status: UserStatus;
    role: UserRole;
  };
};

export type ModReport = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  assignedToId: string | null;
  resolvedById: string | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; username: string; displayName: string };
  assignedTo: { id: string; username: string; displayName: string } | null;
};

export type ModTicket = {
  id: string;
  type: TicketType;
  orderId: string | null;
  reporterId: string;
  subject: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  resolution: TicketResolution;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: { id: string; username: string; displayName: string };
  assignee: { id: string; username: string; displayName: string } | null;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    buyerId: string;
    sellerId: string;
  } | null;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export type ModOverview = {
  openReports: number;
  openTickets: number;
};

export type ModUserDetail = {
  user: ModUser;
  lots: Array<{
    id: string;
    title: string;
    status: LotStatus;
    price: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    price: string;
    buyerId: string;
    sellerId: string;
    createdAt: string;
  }>;
  reports: Array<{
    id: string;
    targetType: ReportTargetType;
    targetId: string;
    reason: ReportReason;
    status: ReportStatus;
    createdAt: string;
  }>;
};

export type CreateReportPayload = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

export type UpdateUserStatusPayload = {
  status: UserStatus;
  reason: string;
  suspendedUntil?: string;
};

export type ModerationReasonPayload = {
  reason: string;
};

export type ModerationTargetType =
  | 'USER'
  | 'LOT'
  | 'REVIEW'
  | 'REPORT'
  | 'TICKET';

export type ModAuditAction = {
  id: string;
  actorId: string;
  actionType: string;
  targetType: ModerationTargetType;
  targetId: string;
  reason: string;
  before: unknown;
  after: unknown;
  metadata: unknown;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    role: UserRole;
  };
};
