'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { categoryKeys } from '@/services/categories.service';
import {
  subcategoriesService,
  subcategoryKeys,
} from '@/services/subcategories.service';
import type {
  CreateSubcategoryPayload,
  UpdateSubcategoryPayload,
} from '@/types/category';

export function useSubcategories(categoryId: string | null) {
  return useQuery({
    queryKey: subcategoryKeys.list(categoryId ?? ''),
    queryFn: () => subcategoriesService.getByCategoryId(categoryId!),
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  });
}

export function useSubcategory(id: string | null) {
  return useQuery({
    queryKey: subcategoryKeys.detail(id ?? ''),
    queryFn: () => subcategoriesService.getById(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useSubcategoryMutations(categoryId: string | null) {
  const queryClient = useQueryClient();

  const invalidateSubcategories = () => {
    if (categoryId) {
      queryClient.invalidateQueries({
        queryKey: subcategoryKeys.list(categoryId),
      });
    }
    queryClient.invalidateQueries({ queryKey: subcategoryKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateSubcategoryPayload) =>
      subcategoriesService.create(categoryId!, payload),
    onSuccess: invalidateSubcategories,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubcategoryPayload;
    }) => subcategoriesService.update(id, payload),
    onSuccess: (_, { id }) => {
      invalidateSubcategories();
      queryClient.invalidateQueries({ queryKey: subcategoryKeys.detail(id) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subcategoriesService.remove(id),
    onSuccess: invalidateSubcategories,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function usePrefetchSubcategories() {
  const queryClient = useQueryClient();

  return (categoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: subcategoryKeys.list(categoryId),
      queryFn: () => subcategoriesService.getByCategoryId(categoryId),
      staleTime: 60_000,
    });
  };
}

export { categoryKeys };
