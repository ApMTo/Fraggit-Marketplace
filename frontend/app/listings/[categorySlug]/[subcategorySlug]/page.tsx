import { Suspense } from 'react';
import { dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { Spinner } from '@/components/ui/spinner';
import { ListingsHydration } from '@/features/listings/components/listings-hydration';
import { CategoryListingsPage } from '@/features/listings/category-listings-page';
import {
  fetchCategories,
  fetchSubcategories,
  prefetchCategoryListings,
  type NextSearchParams,
} from '@/features/listings/lib/prefetch-listings.server';
import { makeQueryClient } from '@/lib/query-client';

type PageProps = {
  params: Promise<{ categorySlug: string; subcategorySlug: string }>;
  searchParams: Promise<NextSearchParams>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categorySlug, subcategorySlug } = await params;
  const t = await getTranslations('listings');
  const locale = await getLocale();
  const categories = await fetchCategories(locale);
  const category = categories?.find((item) => item.slug === categorySlug);
  const subcategories = category
    ? await fetchSubcategories(category.id, locale)
    : null;
  const subcategory = subcategories?.find(
    (item) => item.slug === subcategorySlug,
  );

  const titleParts = [
    subcategory?.name ?? subcategorySlug,
    category?.name ?? categorySlug,
  ];

  return {
    title: `${titleParts.join(' · ')} | ${t('title')} | Fraggit`,
    description: t('categorySubtitle'),
  };
}

function ListingsFallback() {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] justify-center px-5 py-20">
      <Spinner size="lg" />
    </div>
  );
}

export default async function Page({ params, searchParams }: PageProps) {
  const { categorySlug, subcategorySlug } = await params;
  const resolvedSearchParams = await searchParams;
  const queryClient = makeQueryClient();

  await prefetchCategoryListings(
    queryClient,
    categorySlug,
    subcategorySlug,
    resolvedSearchParams,
  );

  return (
    <ListingsHydration state={dehydrate(queryClient)}>
      <Suspense fallback={<ListingsFallback />}>
        <CategoryListingsPage
          categorySlug={categorySlug}
          subcategorySlug={subcategorySlug}
        />
      </Suspense>
    </ListingsHydration>
  );
}
