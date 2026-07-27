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
  target?:
    | {
        id: string;
        title: string;
        status: LotStatus;
        seller: { id: string; username: string };
      }
    | {
        id: string;
        username: string;
        displayName: string;
        status: UserStatus;
      }
    | null;
};

export type ModConversationMessage = {
  id: string;
  conversationId: string;
  senderId: string | null;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  content: string | null;
  metadata: unknown;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
  attachments: Array<{
    id: string;
    url: string;
    mimeType: string;
    size: number;
    width: number | null;
    height: number | null;
  }>;
};

export type ModReportedConversation = {
  conversationId: string | null;
  reportedMessageId: string | null;
  participants: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
  messages: ModConversationMessage[];
  emptyReason?: 'no_order' | 'no_conversation' | null;
};

export type LotDisputeRoomStatus = 'OPEN' | 'CLOSED';

export type LotDisputeMessageKind = 'TEXT' | 'SYSTEM';

export type LotDisputeRoomSummary = {
  id: string;
  lotId: string;
  orderId: string | null;
  reportId: string | null;
  ticketId: string | null;
  status: LotDisputeRoomStatus;
  createdAt: string;
  updatedAt: string;
  report?: {
    id: string;
    status: ReportStatus;
    reason: ReportReason;
    reporter: { id: string; username: string; displayName: string };
  } | null;
  ticket?: {
    id: string;
    status: TicketStatus;
    reporter: { id: string; username: string; displayName: string };
    order: {
      id: string;
      orderNumber: string;
      buyerId: string;
      sellerId: string;
    } | null;
  } | null;
  lot: {
    id: string;
    title: string;
    sellerId: string;
    seller: { id: string; username: string; displayName: string };
  };
};

export type LotDisputeMessage = {
  id: string;
  roomId: string;
  authorId: string | null;
  kind: LotDisputeMessageKind;
  body: string;
  metadata: unknown;
  createdAt: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    role: UserRole;
  } | null;
};

export type LotDisputeRoomDetail = {
  room: LotDisputeRoomSummary;
  messages: LotDisputeMessage[];
  participants: Array<{
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  }>;
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
    autoApproveAt: string | null;
    disputePausedFromStatus: string | null;
    autoApproveRemainingMs: number | null;
    buyer?: { id: string; username: string; displayName: string };
    seller?: { id: string; username: string; displayName: string };
    lot: { id: string; title: string } | null;
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

export type CreateTicketPayload = {
  type: TicketType;
  orderId?: string;
  subject: string;
  body: string;
  priority?: TicketPriority;
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
  | 'TICKET'
  | 'CONVERSATION';

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
