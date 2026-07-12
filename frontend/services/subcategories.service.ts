import api from '@/lib/api';
import type {
  CreateSubcategoryPayload,
  SubcategoryAdmin,
  SubcategoryPublic,
  UpdateSubcategoryPayload,
} from '@/types/category';

export const subcategoryKeys = {
  all: ['subcategories'] as const,
  lists: () => [...subcategoryKeys.all, 'list'] as const,
  list: (categoryId: string, locale: string) =>
    [...subcategoryKeys.lists(), categoryId, locale] as const,
  details: () => [...subcategoryKeys.all, 'detail'] as const,
  detail: (id: string, locale: string) =>
    [...subcategoryKeys.details(), id, locale] as const,
};

export const subcategoriesService = {
  async getByCategoryId(categoryId: string): Promise<SubcategoryPublic[]> {
    const { data } = await api.get<SubcategoryPublic[]>(
      `/categories/${categoryId}/subcategories`,
    );
    return data;
  },

  async getById(id: string): Promise<SubcategoryAdmin> {
    const { data } = await api.get<SubcategoryAdmin>(`/subcategories/${id}`);
    return data;
  },

  async create(
    categoryId: string,
    payload: CreateSubcategoryPayload,
  ): Promise<SubcategoryAdmin> {
    const { data } = await api.post<SubcategoryAdmin>(
      `/categories/${categoryId}/subcategories`,
      payload,
    );
    return data;
  },

  async update(
    id: string,
    payload: UpdateSubcategoryPayload,
  ): Promise<SubcategoryAdmin> {
    const { data } = await api.patch<SubcategoryAdmin>(
      `/subcategories/${id}`,
      payload,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/subcategories/${id}`);
  },
};
