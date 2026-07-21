'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { listingKeys, listingsService } from '@/services/listings.service';
import type {
  CreateLotPayload,
  FindLotsParams,
  FindSellerLotsParams,
  UpdateLotPayload,
} from '@/types/lot';

export function useLots(
  categorySlug: string | null,
  subcategorySlug: string | null,
  params: FindLotsParams = {},
) {
  return useQuery({
    queryKey: listingKeys.list(
      categorySlug ?? '',
      subcategorySlug ?? '',
      params,
    ),
    queryFn: () =>
      listingsService.getBySlugs(categorySlug!, subcategorySlug!, params),
    enabled: Boolean(categorySlug && subcategorySlug),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useSellerLots(params: FindSellerLotsParams) {
  const hasSeller = Boolean(
    params.sellerUsername?.trim() || params.sellerId?.trim(),
  );

  return useQuery({
    queryKey: listingKeys.sellerList(params),
    queryFn: () => listingsService.getBySeller(params),
    enabled: hasSeller,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useLot(id: string | null) {
  return useQuery({
    queryKey: listingKeys.detail(id ?? ''),
    queryFn: () => listingsService.getById(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useCreateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateLotPayload) => listingsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: listingKeys.sellerLists() });
    },
  });
}

export function useUpdateLot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLotPayload }) =>
      listingsService.update(id, payload),
    onSuccess: (lot) => {
      queryClient.setQueryData(listingKeys.detail(lot.id), lot);
      queryClient.invalidateQueries({ queryKey: listingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: listingKeys.sellerLists() });
    },
  });
}
