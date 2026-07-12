'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Package, PackageOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/ui/empty-state';
import { Spinner } from '@/components/ui/spinner';
import { ListingsPagination } from '@/features/listings/components/listings-pagination';
import { LotBrowseToolbar } from '@/features/listings/components/lot-browse-toolbar';
import { LotTable } from '@/features/listings/components/lot-table';
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
    useListingFilterAttributes(
      category?.id ?? null,
      activeSubcategory?.id ?? null,
    );

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

  const {
    data: lots,
    isLoading: lotsLoading,
    isError: lotsError,
    isFetching,
  } = useLots(categorySlug, activeSubcategory?.slug ?? null, lotsQuery);

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
      <div className="mx-auto flex w-full max-w-[1240px] justify-center px-5 py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (bootError) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-5 py-10">
        <EmptyState
          icon={Package}
          title={t('loadErrorTitle')}
          description={t('loadErrorDescription')}
        />
      </div>
    );
  }

  if (!category) {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-5 py-10">
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
      </div>
    );
  }

  const createHref = createLotHref({
    categoryId: category.id,
    subcategoryId: activeSubcategory?.id,
  });

  if (!subcategories?.length) {
    return (
      <BrowseShell categoryName={category.name}>
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
      <BrowseShell categoryName={category.name}>
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
    <BrowseShell categoryName={category.name}>
      <SubcategoryPills
        categorySlug={category.slug}
        subcategories={subcategories}
        activeSlug={activeSubcategory!.slug}
      />

      <LotBrowseToolbar
        attributes={filterAttributes}
        attributesLoading={attributesLoading}
        filters={browseParams.filters}
        sort={browseParams.sort}
        createHref={createHref}
        onFiltersChange={handleFiltersChange}
        onSortChange={handleSortChange}
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-subtle">
          {t('resultsCount', { count: total })}
        </p>
      </div>

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
          <LotTable
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

function BrowseShell({
  categoryName,
  children,
}: {
  categoryName: string;
  children: ReactNode;
}) {
  const t = useTranslations('listings');

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 px-5 py-10">
      <header className="space-y-3">
        <Link
          href="/listings"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('backToCategories')}
        </Link>
        <div className="space-y-1">
          <h1 className="page-title text-3xl">{categoryName}</h1>
          <p className="text-sm text-subtle">{t('categorySubtitle')}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
