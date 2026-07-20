export type OrderStatus =
  | 'PENDING'
  | 'AWAITING_BUYER_CONFIRMATION'
  | 'APPROVED';

export type OrderRole = 'buyer' | 'seller';

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
  credentials: string | null;
  credentialsProvidedAt: string | null;
  autoApproveAt: string | null;
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
};

export type SubmitCredentialsPayload = {
  credentials: string;
};
