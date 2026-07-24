export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_BUYER_CONFIRMATION'
  | 'DISPUTED'
  | 'APPROVED';

export type OrderRole = 'buyer' | 'seller';

export type LotType = 'ACCOUNT' | 'SERVICE';

export type OrderUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type OrderLot = {
  id: string;
  title: string;
  price: string | number;
  status: string;
  type: LotType;
  previewUrl: string | null;
  images: Array<{
    url: string;
    sortOrder: number;
  }>;
};

export type OrderDetail = {
  id: string;
  orderNumber: string;
  lotId: string;
  buyerId: string;
  sellerId: string;
  price: string | number;
  status: OrderStatus;
  serviceQuestion: string | null;
  buyerAnswer: string | null;
  credentials: string | null;
  credentialsProvidedAt: string | null;
  autoApproveAt: string | null;
  disputePausedFromStatus: OrderStatus | null;
  autoApproveRemainingMs: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lot: OrderLot;
  buyer: OrderUser;
  seller: OrderUser;
};

export type OrderListItem = {
  id: string;
  orderNumber: string;
  lotId: string;
  buyerId: string;
  sellerId: string;
  price: string | number;
  status: OrderStatus;
  credentialsProvidedAt: string | null;
  autoApproveAt: string | null;
  disputePausedFromStatus: OrderStatus | null;
  autoApproveRemainingMs: number | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lot: OrderLot;
  buyer: OrderUser;
  seller: OrderUser;
};

export type OrderListResult = {
  items: OrderListItem[];
  total: number;
  page: number;
  limit: number;
};

export type FindOrdersParams = {
  role?: OrderRole;
  status?: OrderStatus;
  page?: number;
  limit?: number;
};

export type CreateOrderPayload = {
  lotId: string;
  buyerAnswer?: string;
};

export type SubmitCredentialsPayload = {
  credentials: string;
};
