import api from '@/lib/api';
import type {
  AttributeDefinitionAdmin,
  AttributeDefinitionPublic,
  CreateAttributeDefinitionPayload,
  UpdateAttributeDefinitionPayload,
} from '@/types/category';

export const attributeDefinitionKeys = {
  all: ['attribute-definitions'] as const,
  lists: () => [...attributeDefinitionKeys.all, 'list'] as const,
  byCategory: (categoryId: string) =>
    [...attributeDefinitionKeys.lists(), 'category', categoryId] as const,
  bySubcategory: (subcategoryId: string) =>
    [...attributeDefinitionKeys.lists(), 'subcategory', subcategoryId] as const,
  filterableBySubcategory: (subcategoryId: string) =>
    [
      ...attributeDefinitionKeys.lists(),
      'filterable',
      subcategoryId,
    ] as const,
  details: () => [...attributeDefinitionKeys.all, 'detail'] as const,
  detail: (id: string) => [...attributeDefinitionKeys.details(), id] as const,
};

export const attributeDefinitionsService = {
  async getByCategoryId(
    categoryId: string,
  ): Promise<AttributeDefinitionPublic[]> {
    const { data } = await api.get<AttributeDefinitionPublic[]>(
      `/categories/${categoryId}/attribute-definitions`,
    );
    return data;
  },

  async getBySubcategoryId(
    subcategoryId: string,
  ): Promise<AttributeDefinitionPublic[]> {
    const { data } = await api.get<AttributeDefinitionPublic[]>(
      `/subcategories/${subcategoryId}/attribute-definitions`,
    );
    return data;
  },

  async getFilterableBySubcategoryId(
    subcategoryId: string,
  ): Promise<AttributeDefinitionPublic[]> {
    const { data } = await api.get<AttributeDefinitionPublic[]>(
      `/subcategories/${subcategoryId}/filterable-attributes`,
    );
    return data;
  },

  async getById(id: string): Promise<AttributeDefinitionAdmin> {
    const { data } = await api.get<AttributeDefinitionAdmin>(
      `/attribute-definitions/${id}`,
    );
    return data;
  },

  async createForCategory(
    categoryId: string,
    payload: CreateAttributeDefinitionPayload,
  ): Promise<AttributeDefinitionAdmin> {
    const { data } = await api.post<AttributeDefinitionAdmin>(
      `/categories/${categoryId}/attribute-definitions`,
      payload,
    );
    return data;
  },

  async createForSubcategory(
    subcategoryId: string,
    payload: CreateAttributeDefinitionPayload,
  ): Promise<AttributeDefinitionAdmin> {
    const { data } = await api.post<AttributeDefinitionAdmin>(
      `/subcategories/${subcategoryId}/attribute-definitions`,
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: UpdateAttributeDefinitionPayload,
  ): Promise<AttributeDefinitionAdmin> {
    const { data } = await api.patch<AttributeDefinitionAdmin>(
      `/attribute-definitions/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/attribute-definitions/${id}`);
  },
};
