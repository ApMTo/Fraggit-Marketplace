'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useLocale } from 'next-intl';
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
  const locale = useLocale();

  return useQuery({
    queryKey: subcategoryKeys.list(categoryId ?? '', locale),
    queryFn: () => subcategoriesService.getByCategoryId(categoryId!),
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  });
}

export function useSubcategory(id: string | null) {
  const locale = useLocale();

  return useQuery({
    queryKey: subcategoryKeys.detail(id ?? '', locale),
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
        queryKey: subcategoryKeys.lists(),
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
    onSuccess: () => {
      invalidateSubcategories();
      queryClient.invalidateQueries({
        queryKey: subcategoryKeys.details(),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subcategoriesService.remove(id),
    onSuccess: invalidateSubcategories,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export function usePrefetchSubcategories() {
  const locale = useLocale();
  const queryClient = useQueryClient();

  return (categoryId: string) => {
    queryClient.prefetchQuery({
      queryKey: subcategoryKeys.list(categoryId, locale),
      queryFn: () => subcategoriesService.getByCategoryId(categoryId),
      staleTime: 60_000,
    });
  };
}

export { categoryKeys };
