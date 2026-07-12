'use client';

import { useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  attributeDefinitionKeys,
  attributeDefinitionsService,
} from '@/services/attribute-definitions.service';
import type {
  CreateAttributeDefinitionPayload,
  UpdateAttributeDefinitionPayload,
} from '@/types/category';

export function useCategoryAttributes(categoryId: string | null) {
  return useQuery({
    queryKey: attributeDefinitionKeys.byCategory(categoryId ?? ''),
    queryFn: () => attributeDefinitionsService.getByCategoryId(categoryId!),
    enabled: Boolean(categoryId),
    staleTime: 60_000,
  });
}

export function useSubcategoryAttributes(subcategoryId: string | null) {
  return useQuery({
    queryKey: attributeDefinitionKeys.bySubcategory(subcategoryId ?? ''),
    queryFn: () =>
      attributeDefinitionsService.getBySubcategoryId(subcategoryId!),
    enabled: Boolean(subcategoryId),
    staleTime: 60_000,
  });
}

/** Category globals + subcategory-specific attrs, deduped for listing filters. */
export function useListingFilterAttributes(
  categoryId: string | null,
  subcategoryId: string | null,
) {
  const categoryQuery = useCategoryAttributes(categoryId);
  const subcategoryQuery = useSubcategoryAttributes(subcategoryId);

  const attributes = useMemo(() => {
    if (!categoryQuery.data && !subcategoryQuery.data) {
      return undefined;
    }

    const byId = new Map(
      [...(categoryQuery.data ?? []), ...(subcategoryQuery.data ?? [])].map(
        (attribute) => [attribute.id, attribute],
      ),
    );

    return [...byId.values()].sort(
      (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label),
    );
  }, [categoryQuery.data, subcategoryQuery.data]);

  return {
    data: attributes,
    isLoading: categoryQuery.isLoading || subcategoryQuery.isLoading,
    isError: categoryQuery.isError || subcategoryQuery.isError,
  };
}

export function useAttributeDefinition(id: string | null) {
  return useQuery({
    queryKey: attributeDefinitionKeys.detail(id ?? ''),
    queryFn: () => attributeDefinitionsService.getById(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

type AttributeScope = 'category' | 'subcategory';

export function useAttributeMutations(
  scope: AttributeScope,
  parentId: string | null,
) {
  const queryClient = useQueryClient();

  const invalidateAttributes = () => {
    if (!parentId) {
      return;
    }

    const listKey =
      scope === 'category'
        ? attributeDefinitionKeys.byCategory(parentId)
        : attributeDefinitionKeys.bySubcategory(parentId);

    queryClient.invalidateQueries({ queryKey: listKey });
    queryClient.invalidateQueries({ queryKey: attributeDefinitionKeys.all });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateAttributeDefinitionPayload) =>
      scope === 'category'
        ? attributeDefinitionsService.createForCategory(parentId!, payload)
        : attributeDefinitionsService.createForSubcategory(parentId!, payload),
    onSuccess: invalidateAttributes,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAttributeDefinitionPayload;
    }) => attributeDefinitionsService.update(id, payload),
    onSuccess: (_, { id }) => {
      invalidateAttributes();
      queryClient.invalidateQueries({
        queryKey: attributeDefinitionKeys.detail(id),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => attributeDefinitionsService.remove(id),
    onSuccess: invalidateAttributes,
  });

  return { createMutation, updateMutation, deleteMutation };
}
