'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { reviewKeys, reviewsService } from '@/services/reviews.service';
import { userKeys } from '@/services/users.service';
import type { CreateReviewPayload, FindReviewsParams } from '@/types/review';

export function useSellerReviews(params: FindReviewsParams | null) {
  return useQuery({
    queryKey: reviewKeys.list(params ?? { sellerId: '' }),
    queryFn: () => reviewsService.list(params!),
    enabled: Boolean(params?.sellerId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useOrderReview(
  orderId: string | null,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: reviewKeys.byOrder(orderId ?? ''),
    queryFn: () => reviewsService.getByOrder(orderId!),
    enabled: Boolean(orderId) && (options?.enabled ?? true),
    staleTime: 30_000,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) =>
      reviewsService.create(payload),
    onSuccess: (review) => {
      queryClient.setQueryData(reviewKeys.byOrder(review.orderId), review);
      queryClient.setQueryData(reviewKeys.detail(review.id), review);
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
