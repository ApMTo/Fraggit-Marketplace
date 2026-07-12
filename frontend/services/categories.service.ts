import api from '@/lib/api';
import type {
  CategoryAdmin,
  CategoryPublic,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '@/types/category';

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: () => [...categoryKeys.lists()] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
};

function buildCategoryFormData(
  payload: CreateCategoryPayload | UpdateCategoryPayload,
): FormData {
  const formData = new FormData();

  if ('name' in payload && payload.name !== undefined) {
    formData.append('name', payload.name);
  }

  if (payload.slug) {
    formData.append('slug', payload.slug);
  }

  if (payload.icon instanceof File) {
    formData.append('icon', payload.icon);
  }

  if (payload.preview instanceof File) {
    formData.append('preview', payload.preview);
  }

  return formData;
}

export const categoriesService = {
  async getAll(): Promise<CategoryPublic[]> {
    const { data } = await api.get<CategoryPublic[]>('/categories');
    return data;
  },

  async getById(id: string): Promise<CategoryAdmin> {
    const { data } = await api.get<CategoryAdmin>(`/categories/${id}`);
    return data;
  },

  async create(payload: CreateCategoryPayload): Promise<CategoryAdmin> {
    const formData = buildCategoryFormData(payload);
    const { data } = await api.post<CategoryAdmin>('/categories', formData);
    return data;
  },

  async update(
    id: string,
    payload: UpdateCategoryPayload,
  ): Promise<CategoryAdmin> {
    const formData = buildCategoryFormData(payload);
    const { data } = await api.patch<CategoryAdmin>(
      `/categories/${id}`,
      formData,
    );
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
