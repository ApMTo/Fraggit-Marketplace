'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, PackageOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { HeaderCategorySearch } from '@/components/layout/header-category-search';
import { CategoryBrowseHero } from '@/features/listings/components/category-browse-hero';
import { ListingsPagination } from '@/features/listings/components/listings-pagination';
import { LotBrowseToolbar } from '@/features/listings/components/lot-browse-toolbar';
import { LotGrid } from '@/features/listings/components/lot-grid';
import { SubcategoryPills } from '@/features/listings/components/subcategory-pills';
import { createLotHref } from '@/features/listings/lib/create-lot-href';
import {
  listingsHref,
  parseListingsSearchParams,
  type LotFilters,
} from '@/features/listings/lib/listings-search-params';
import {
  useCategories,
  useListingFilterAttributes,
  useLots,
  useSubcategories,
} from '@/hooks';
import type { CategoryPublic } from '@/types/category';
import type { LotSort } from '@/types/lot';
import { DEFAULT_LOTS_LIMIT } from '@/types/lot';

type CategoryListingsPageProps = {
  categorySlug: string;
  subcategorySlug?: string;
};

export function CategoryListingsPage({
  categorySlug,
  subcategorySlug,
}: CategoryListingsPageProps) {
  const t = useTranslations('listings');
  const router = useRouter();
  const searchParams = useSearchParams();

  const browseParams = useMemo(
    () => parseListingsSearchParams(searchParams),
    [searchParams],
  );

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();

  const category = useMemo(
    () => categories?.find((item) => item.slug === categorySlug) ?? null,
    [categories, categorySlug],
  );

  const {
    data: subcategories,
    isLoading: subcategoriesLoading,
    isError: subcategoriesError,
  } = useSubcategories(category?.id ?? null);

  const activeSubcategory = useMemo(() => {
    if (!subcategories?.length) {
      return null;
    }

    if (subcategorySlug) {
      return (
        subcategories.find((item) => item.slug === subcategorySlug) ?? null
      );
    }

    return subcategories[0] ?? null;
  }, [subcategories, subcategorySlug]);

  const { data: filterAttributes, isLoading: attributesLoading } =
    useListingFilterAttributes(activeSubcategory?.id ?? null);

  const lotsQuery = useMemo(
    () => ({
      search: browseParams.search || undefined,
      sort: browseParams.sort,
      page: browseParams.page,
      limit: DEFAULT_LOTS_LIMIT,
      filters:
        Object.keys(browseParams.filters).length > 0
          ? browseParams.filters
          : undefined,
    }),
    [browseParams],
  );

  const lotsSubcategorySlug =
    subcategorySlug ?? activeSubcategory?.slug ?? null;

  const {
    data: lots,
    isLoading: lotsLoading,
    isError: lotsError,
    isFetching,
  } = useLots(categorySlug, lotsSubcategorySlug, lotsQuery);

  const replaceBrowse = useCallback(
    (next: {
      search?: string;
      sort?: LotSort;
      page?: number;
      filters?: LotFilters;
      subcategorySlug?: string | null;
    }) => {
      const href = listingsHref(
        categorySlug,
        next.subcategorySlug === undefined
          ? (activeSubcategory?.slug ?? subcategorySlug)
          : next.subcategorySlug,
        {
          search: next.search ?? browseParams.search,
          sort: next.sort ?? browseParams.sort,
          page: next.page ?? browseParams.page,
          filters: next.filters ?? browseParams.filters,
        },
      );
      router.replace(href, { scroll: false });
    },
    [
      activeSubcategory?.slug,
      browseParams.filters,
      browseParams.page,
      browseParams.search,
      browseParams.sort,
      categorySlug,
      router,
      subcategorySlug,
    ],
  );

  const handleSearchChange = useCallback(
    (search: string) => {
      replaceBrowse({ search, page: 1 });
    },
    [replaceBrowse],
  );

  const handleSortChange = useCallback(
    (sort: LotSort) => {
      replaceBrowse({ sort, page: 1 });
    },
    [replaceBrowse],
  );

  const handleFiltersChange = useCallback(
    (filters: LotFilters) => {
      replaceBrowse({ filters, page: 1 });
    },
    [replaceBrowse],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      replaceBrowse({ page });
    },
    [replaceBrowse],
  );

  const bootLoading =
    categoriesLoading || (Boolean(category) && subcategoriesLoading);
  const bootError = categoriesError || subcategoriesError;

  if (bootLoading) {
    return (
      <div className="mx-auto flex w-full max-w-site justify-center px-5 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (bootError) {
    return (
      <PageFrame>
        <EmptyState
          icon={Package}
          title={t('loadErrorTitle')}
          description={t('loadErrorDescription')}
        />
      </PageFrame>
    );
  }

  if (!category) {
    return (
      <PageFrame>
        <EmptyState
          icon={Package}
          title={t('categoryNotFoundTitle')}
          description={t('categoryNotFoundDescription')}
          action={
            <Link
              href="/listings"
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {t('backToCategories')}
            </Link>
          }
        />
      </PageFrame>
    );
  }

  const createHref = createLotHref({
    categoryId: category.id,
    subcategoryId: activeSubcategory?.id,
  });

  if (!subcategories?.length) {
    return (
      <BrowseShell category={category} createHref={createHref}>
        <EmptyState
          icon={PackageOpen}
          title={t('emptySubcategoriesTitle')}
          description={t('emptySubcategoriesDescription')}
        />
      </BrowseShell>
    );
  }

  if (subcategorySlug && !activeSubcategory) {
    return (
      <BrowseShell category={category} createHref={createHref}>
        <EmptyState
          icon={Package}
          title={t('subcategoryNotFoundTitle')}
          description={t('subcategoryNotFoundDescription')}
          action={
            <Link
              href={listingsHref(category.slug, subcategories[0]?.slug)}
              className="btn-secondary inline-flex h-11 items-center px-6 text-sm"
            >
              {t('backToCategory')}
            </Link>
          }
        />
      </BrowseShell>
    );
  }

  const showLotsSpinner = lotsLoading && !lots;
  const total = lots?.total ?? 0;

  return (
    <BrowseShell category={category} createHref={createHref}>
      <SubcategoryPills
        categorySlug={category.slug}
        subcategories={subcategories}
        activeSlug={activeSubcategory!.slug}
      />

      <LotBrowseToolbar
        attributes={filterAttributes}
        attributesLoading={attributesLoading}
        filters={browseParams.filters}
        search={browseParams.search}
        sort={browseParams.sort}
        total={total}
        onFiltersChange={handleFiltersChange}
        onSearchChange={handleSearchChange}
        onSortChange={handleSortChange}
      />

      {showLotsSpinner ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : null}

      {lotsError ? (
        <EmptyState
          icon={Package}
          title={t('loadErrorTitle')}
          description={t('loadErrorDescription')}
        />
      ) : null}

      {!showLotsSpinner && !lotsError && lots?.items.length === 0 ? (
        <EmptyState
          icon={PackageOpen}
          title={t('emptyLotsTitle')}
          description={t('emptyLotsDescription')}
        />
      ) : null}

      {!showLotsSpinner && !lotsError && lots && lots.items.length > 0 ? (
        <div
          className={
            isFetching && !lotsLoading
              ? 'opacity-70 transition-opacity'
              : undefined
          }
        >
          <LotGrid
            lots={lots.items}
            categorySlug={category.slug}
            subcategorySlug={activeSubcategory!.slug}
          />
        </div>
      ) : null}

      {lots && !lotsError ? (
        <ListingsPagination
          page={browseParams.page}
          total={total}
          limit={lots.limit}
          onPageChange={handlePageChange}
        />
      ) : null}
    </BrowseShell>
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-site px-5 py-10">{children}</div>
  );
}

function BrowseShell({
  category,
  createHref,
  children,
}: {
  category: CategoryPublic;
  createHref?: string;
  children: ReactNode;
}) {
  const t = useTranslations('listings');

  return (
    <div className="mx-auto flex w-full max-w-site flex-col gap-5 px-5 py-8 sm:py-10">
      <CategoryBrowseHero category={category} createHref={createHref} />
      <div className="md:hidden">
        <HeaderCategorySearch
          id="game-search"
          className="max-w-none flex-none"
        />
        <p className="mt-2 text-xs text-muted">{t('searchGamesHint')}</p>
      </div>
      {children}
    </div>
  );
}
