import { cache } from 'react';
import { getLocale } from 'next-intl/server';
import type { QueryClient } from '@tanstack/react-query';
import { serverGet } from '@/lib/api-server';
import {
  parseListingsSearchParams,
  type ListingsBrowseParams,
} from '@/features/listings/lib/listings-search-params';
import { attributeDefinitionKeys } from '@/services/attribute-definitions.service';
import { categoryKeys } from '@/services/categories.service';
import {
  buildLotsQuery,
  listingKeys,
} from '@/services/listings.service';
import { subcategoryKeys } from '@/services/subcategories.service';
import type {
  AttributeDefinitionPublic,
  CategoryPublic,
  SubcategoryPublic,
} from '@/types/category';
import type { FindLotsParams, LotDetail, LotListResult } from '@/types/lot';
import { DEFAULT_LOTS_LIMIT } from '@/types/lot';

export type NextSearchParams = Record<
  string,
  string | string[] | undefined
>;

export function toUrlSearchParams(
  searchParams: NextSearchParams,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      params.set(key, value);
    } else if (Array.isArray(value) && value[0] !== undefined) {
      params.set(key, value[0]);
    }
  }

  return params;
}

export function browseParamsFromSearch(
  searchParams: NextSearchParams,
): ListingsBrowseParams {
  return parseListingsSearchParams(toUrlSearchParams(searchParams));
}

export function toFindLotsParams(
  browse: ListingsBrowseParams,
): FindLotsParams {
  return {
    search: browse.search || undefined,
    sort: browse.sort,
    page: browse.page,
    limit: DEFAULT_LOTS_LIMIT,
    filters:
      Object.keys(browse.filters).length > 0 ? browse.filters : undefined,
  };
}

export const fetchCategories = cache(
  async (locale?: string): Promise<CategoryPublic[] | null> => {
    const { data } = await serverGet<CategoryPublic[]>('/categories', {
      locale,
    });
    return data;
  },
);

export const fetchSubcategories = cache(
  async (
    categoryId: string,
    locale?: string,
  ): Promise<SubcategoryPublic[] | null> => {
    const { data } = await serverGet<SubcategoryPublic[]>(
      `/categories/${categoryId}/subcategories`,
      { locale },
    );
    return data;
  },
);

export const fetchFilterableAttributes = cache(
  async (
    subcategoryId: string,
    locale?: string,
  ): Promise<AttributeDefinitionPublic[] | null> => {
    const { data } = await serverGet<AttributeDefinitionPublic[]>(
      `/subcategories/${subcategoryId}/filterable-attributes`,
      { locale },
    );
    return data;
  },
);

export const fetchLotsBySlugs = cache(
  async (
    categorySlug: string,
    subcategorySlug: string,
    params: FindLotsParams,
    locale?: string,
  ): Promise<LotListResult | null> => {
    const { data } = await serverGet<LotListResult>(
      `/listings/${categorySlug}/${subcategorySlug}`,
      { locale, query: buildLotsQuery(params) },
    );
    return data;
  },
);

export const fetchLotById = cache(
  async (id: string, locale?: string): Promise<LotDetail | null> => {
    const { data } = await serverGet<LotDetail>(`/listings/${id}`, { locale });
    return data;
  },
);

async function requireData<T>(
  data: T | null,
  message: string,
): Promise<T> {
  if (data == null) {
    throw new Error(message);
  }
  return data;
}

async function seedCategories(
  queryClient: QueryClient,
  locale: string,
): Promise<CategoryPublic[]> {
  return queryClient.fetchQuery({
    queryKey: categoryKeys.list(),
    queryFn: async () =>
      requireData(await fetchCategories(locale), 'Failed to load categories'),
  });
}

async function seedSubcategories(
  queryClient: QueryClient,
  categoryId: string,
  locale: string,
): Promise<SubcategoryPublic[]> {
  return queryClient.fetchQuery({
    queryKey: subcategoryKeys.list(categoryId, locale),
    queryFn: async () =>
      requireData(
        await fetchSubcategories(categoryId, locale),
        'Failed to load subcategories',
      ),
  });
}

async function seedLots(
  queryClient: QueryClient,
  categorySlug: string,
  subcategorySlug: string,
  params: FindLotsParams,
  locale: string,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: listingKeys.list(categorySlug, subcategorySlug, params),
    queryFn: async () =>
      requireData(
        await fetchLotsBySlugs(
          categorySlug,
          subcategorySlug,
          params,
          locale,
        ),
        'Failed to load lots',
      ),
  });
}

async function seedFilterAttributes(
  queryClient: QueryClient,
  subcategoryId: string,
  locale: string,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryKey: attributeDefinitionKeys.filterableBySubcategory(subcategoryId),
    queryFn: async () =>
      requireData(
        await fetchFilterableAttributes(subcategoryId, locale),
        'Failed to load filterable attributes',
      ),
  });
}

export async function prefetchListingsHub(
  queryClient: QueryClient,
): Promise<void> {
  const locale = await getLocale();
  try {
    await seedCategories(queryClient, locale);
  } catch {
    // Client shows the existing error/empty UI from the query state.
  }
}

export async function prefetchCategoryListings(
  queryClient: QueryClient,
  categorySlug: string,
  subcategorySlug: string | undefined,
  searchParams: NextSearchParams,
): Promise<void> {
  const locale = await getLocale();
  const browse = browseParamsFromSearch(searchParams);
  const lotsParams = toFindLotsParams(browse);

  if (subcategorySlug) {
    const lotsPromise = seedLots(
      queryClient,
      categorySlug,
      subcategorySlug,
      lotsParams,
      locale,
    );

    try {
      const categories = await seedCategories(queryClient, locale);
      const category = categories.find((item) => item.slug === categorySlug);

      if (!category) {
        await lotsPromise.catch(() => undefined);
        return;
      }

      const subcategories = await seedSubcategories(
        queryClient,
        category.id,
        locale,
      );
      const activeSubcategory =
        subcategories.find((item) => item.slug === subcategorySlug) ?? null;

      await Promise.all([
        lotsPromise,
        activeSubcategory
          ? seedFilterAttributes(queryClient, activeSubcategory.id, locale)
          : Promise.resolve(),
      ]);
    } catch {
      await lotsPromise.catch(() => undefined);
    }
    return;
  }

  try {
    const categories = await seedCategories(queryClient, locale);
    const category = categories.find((item) => item.slug === categorySlug);
    if (!category) {
      return;
    }

    const subcategories = await seedSubcategories(
      queryClient,
      category.id,
      locale,
    );
    const activeSubcategory = subcategories[0] ?? null;
    if (!activeSubcategory) {
      return;
    }

    await Promise.all([
      seedLots(
        queryClient,
        categorySlug,
        activeSubcategory.slug,
        lotsParams,
        locale,
      ),
      seedFilterAttributes(queryClient, activeSubcategory.id, locale),
    ]);
  } catch {
    // Dehydrated error/partial state is enough for the client UI.
  }
}

export async function prefetchLotDetail(
  queryClient: QueryClient,
  lotId: string,
): Promise<LotDetail | null> {
  const locale = await getLocale();

  try {
    return await queryClient.fetchQuery({
      queryKey: listingKeys.detail(lotId),
      queryFn: async () =>
        requireData(await fetchLotById(lotId, locale), 'Lot not found'),
    });
  } catch {
    return null;
  }
}

export async function prefetchCreateLot(
  queryClient: QueryClient,
  options: {
    categoryId?: string;
    subcategoryId?: string;
  } = {},
): Promise<void> {
  const locale = await getLocale();

  try {
    const categories = await seedCategories(queryClient, locale);
    const categoryId = options.categoryId;
    if (!categoryId || !categories.some((item) => item.id === categoryId)) {
      return;
    }

    const subcategories = await seedSubcategories(
      queryClient,
      categoryId,
      locale,
    );

    const subcategoryId = options.subcategoryId;
    if (
      !subcategoryId ||
      !subcategories.some((item) => item.id === subcategoryId)
    ) {
      return;
    }

    await seedFilterAttributes(queryClient, subcategoryId, locale);
  } catch {
    // Client form can still load catalog data on demand.
  }
}
