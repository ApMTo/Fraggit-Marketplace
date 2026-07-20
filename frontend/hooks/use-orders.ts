'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { orderKeys, ordersService } from '@/services/orders.service';
import type {
  CreateOrderPayload,
  FindOrdersParams,
  SubmitCredentialsPayload,
} from '@/types/order';

export function useOrders(params: FindOrdersParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => ordersService.getById(id!),
    enabled: Boolean(id),
    staleTime: 15_000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) =>
      ordersService.create(payload),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useSubmitOrderCredentials(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitCredentialsPayload) =>
      ordersService.submitCredentials(orderId, payload),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}

export function useConfirmOrder(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => ordersService.confirm(orderId),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
    },
  });
}
