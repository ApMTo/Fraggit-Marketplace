import type { LotSort } from '@/types/lot';
import { LOT_SORT_OPTIONS } from '@/types/lot';

export type LotFilters = Record<string, string>;

export type ListingsBrowseParams = {
  search: string;
  sort: LotSort;
  page: number;
  filters: LotFilters;
};

const SORT_SET = new Set<string>(LOT_SORT_OPTIONS);

function parseFiltersParam(raw: string | null): LotFilters {
  if (!raw) {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return {};
    }

    const filters: LotFilters = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) {
        filters[key] = value.trim();
      } else if (typeof value === 'number' && Number.isFinite(value)) {
        filters[key] = String(value);
      } else if (typeof value === 'boolean') {
        filters[key] = value ? 'true' : 'false';
      }
    }
    return filters;
  } catch {
    return {};
  }
}

export function parseListingsSearchParams(
  params: URLSearchParams,
): ListingsBrowseParams {
  const sortParam = params.get('sort') ?? 'default';
  const pageParam = Number(params.get('page') ?? '1');

  return {
    search: params.get('search')?.trim() ?? '',
    sort: SORT_SET.has(sortParam) ? (sortParam as LotSort) : 'default',
    page: Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1,
    filters: parseFiltersParam(params.get('filters')),
  };
}

export function toListingsSearchParams({
  search,
  sort,
  page,
  filters,
}: ListingsBrowseParams): URLSearchParams {
  const params = new URLSearchParams();

  if (search) {
    params.set('search', search);
  }

  if (sort !== 'default') {
    params.set('sort', sort);
  }

  if (page > 1) {
    params.set('page', String(page));
  }

  if (Object.keys(filters).length > 0) {
    params.set('filters', JSON.stringify(filters));
  }

  return params;
}

export function listingsHref(
  categorySlug: string,
  subcategorySlug?: string | null,
  browse?: Partial<ListingsBrowseParams>,
): string {
  const base = subcategorySlug
    ? `/listings/${categorySlug}/${subcategorySlug}`
    : `/listings/${categorySlug}`;

  if (!browse) {
    return base;
  }

  const query = toListingsSearchParams({
    search: browse.search ?? '',
    sort: browse.sort ?? 'default',
    page: browse.page ?? 1,
    filters: browse.filters ?? {},
  }).toString();

  return query ? `${base}?${query}` : base;
}

export function countActiveFilters(filters: LotFilters): number {
  return Object.keys(filters).length;
}
