export type ReviewUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ReviewLot = {
  id: string;
  title: string;
};

export type ReviewDetail = {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  reviewer: ReviewUser;
  reviewee: ReviewUser;
  order: {
    id: string;
    lot: ReviewLot;
  };
};

export type ReviewListItem = {
  id: string;
  orderId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  text: string;
  createdAt: string;
  reviewer: ReviewUser;
  order: {
    id: string;
    lot: ReviewLot;
  };
};

export type ReviewListResult = {
  items: ReviewListItem[];
  total: number;
  page: number;
  limit: number;
};

export type FindReviewsParams = {
  sellerId: string;
  page?: number;
  limit?: number;
};

export type CreateReviewPayload = {
  orderId: string;
  rating: number;
  text: string;
};
