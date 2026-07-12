import api from '@/lib/api';
import type {
  CreateLotPayload,
  FindLotsParams,
  LotDetail,
  LotListResult,
} from '@/types/lot';

export const listingKeys = {
  all: ['listings'] as const,
  lists: () => [...listingKeys.all, 'list'] as const,
  list: (
    categorySlug: string,
    subcategorySlug: string,
    params: FindLotsParams,
  ) => [...listingKeys.lists(), categorySlug, subcategorySlug, params] as const,
  details: () => [...listingKeys.all, 'detail'] as const,
  detail: (id: string) => [...listingKeys.details(), id] as const,
};

export function buildLotsQuery(params: FindLotsParams): Record<string, string> {
  const query: Record<string, string> = {};

  if (params.search?.trim()) {
    query.search = params.search.trim();
  }

  if (params.sort && params.sort !== 'default') {
    query.sort = params.sort;
  }

  if (params.page && params.page > 1) {
    query.page = String(params.page);
  }

  if (params.limit) {
    query.limit = String(params.limit);
  }

  if (params.filters && Object.keys(params.filters).length > 0) {
    query.filters = JSON.stringify(params.filters);
  }

  return query;
}

function buildCreateLotFormData(payload: CreateLotPayload): FormData {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('price', String(payload.price));
  formData.append('categoryId', payload.categoryId);
  formData.append('subcategoryId', payload.subcategoryId);
  formData.append('attributes', JSON.stringify(payload.attributes));

  if (payload.description != null && payload.description !== '') {
    formData.append('description', payload.description);
  }

  if (payload.stock != null) {
    formData.append('stock', String(payload.stock));
  }

  for (const photo of payload.photos ?? []) {
    formData.append('photos', photo);
  }

  return formData;
}

export const listingsService = {
  async getBySlugs(
    categorySlug: string,
    subcategorySlug: string,
    params: FindLotsParams = {},
  ): Promise<LotListResult> {
    const { data } = await api.get<LotListResult>(
      `/listings/${categorySlug}/${subcategorySlug}`,
      { params: buildLotsQuery(params) },
    );
    return data;
  },

  async getById(id: string): Promise<LotDetail> {
    const { data } = await api.get<LotDetail>(`/listings/${id}`);
    return data;
  },

  async create(payload: CreateLotPayload): Promise<LotDetail> {
    const formData = buildCreateLotFormData(payload);
    const { data } = await api.post<LotDetail>('/listings', formData);
    return data;
  },
};
