'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  categoriesService,
  categoryKeys,
} from '@/services/categories.service';
import type {
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/types/category';

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesService.getAll(),
    staleTime: 60_000,
  });
}

export function useCategory(id: string | null) {
  return useQuery({
    queryKey: categoryKeys.detail(id ?? ''),
    queryFn: () => categoriesService.getById(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useCategoryMutations() {
  const queryClient = useQueryClient();

  const invalidateCategories = () =>
    queryClient.invalidateQueries({ queryKey: categoryKeys.all });

  const createMutation = useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      categoriesService.create(payload),
    onSuccess: invalidateCategories,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => categoriesService.update(id, payload),
    onSuccess: (_, { id }) => {
      invalidateCategories();
      queryClient.invalidateQueries({ queryKey: categoryKeys.detail(id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesService.remove(id),
    onSuccess: invalidateCategories,
  });

  return { createMutation, updateMutation, deleteMutation };
}
