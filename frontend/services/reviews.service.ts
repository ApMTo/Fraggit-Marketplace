import api from '@/lib/api';
import type {
  CreateReviewPayload,
  FindReviewsParams,
  ReviewDetail,
  ReviewListResult,
} from '@/types/review';

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (params: FindReviewsParams) =>
    [...reviewKeys.lists(), params] as const,
  byOrder: (orderId: string) =>
    [...reviewKeys.all, 'order', orderId] as const,
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (id: string) => [...reviewKeys.details(), id] as const,
};

function buildReviewsQuery(
  params: FindReviewsParams,
): Record<string, string> {
  const query: Record<string, string> = {
    sellerId: params.sellerId,
  };

  if (params.page && params.page > 1) {
    query.page = String(params.page);
  }

  if (params.limit) {
    query.limit = String(params.limit);
  }

  return query;
}

export const reviewsService = {
  async create(payload: CreateReviewPayload): Promise<ReviewDetail> {
    const { data } = await api.post<ReviewDetail>('/reviews', payload);
    return data;
  },

  async list(params: FindReviewsParams): Promise<ReviewListResult> {
    const { data } = await api.get<ReviewListResult>('/reviews', {
      params: buildReviewsQuery(params),
    });
    return data;
  },

  async getByOrder(orderId: string): Promise<ReviewDetail | null> {
    const { data } = await api.get<ReviewDetail | null>(
      `/reviews/order/${encodeURIComponent(orderId)}`,
    );
    return data;
  },

  async getById(id: string): Promise<ReviewDetail> {
    const { data } = await api.get<ReviewDetail>(
      `/reviews/${encodeURIComponent(id)}`,
    );
    return data;
  },
};
