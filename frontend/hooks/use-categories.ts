'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  categoriesService,
  categoryKeys,
  filterCategoriesByName,
} from '@/services/categories.service';
import type {
  CategoryPublic,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/types/category';

const SEARCH_STALE_TIME_MS = 5 * 60_000;
const SEARCH_GC_TIME_MS = 30 * 60_000;

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: () => categoriesService.getAll(),
    staleTime: 60_000,
  });
}

export function useCategorySearch(query: string) {
  const queryClient = useQueryClient();
  const normalized = query.trim().toLocaleLowerCase();

  return useQuery({
    queryKey: categoryKeys.search(normalized),
    queryFn: async () => {
      const cached = queryClient.getQueryData<CategoryPublic[]>(
        categoryKeys.list(),
      );
      const categories = cached ?? (await categoriesService.getAll());

      if (!cached) {
        queryClient.setQueryData(categoryKeys.list(), categories);
      }

      return filterCategoriesByName(categories, normalized);
    },
    enabled: normalized.length > 0,
    staleTime: SEARCH_STALE_TIME_MS,
    gcTime: SEARCH_GC_TIME_MS,
    placeholderData: (previous) => previous,
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
