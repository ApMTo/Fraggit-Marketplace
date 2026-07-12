import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Spinner } from '@/components/ui/spinner';
import { CategoryListingsPage } from '@/features/listings/category-listings-page';

type PageProps = {
  params: Promise<{ categorySlug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categorySlug } = await params;
  const t = await getTranslations('listings');

  return {
    title: `${categorySlug} | ${t('title')} | Fraggit`,
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

export default async function Page({ params }: PageProps) {
  const { categorySlug } = await params;

  return (
    <Suspense fallback={<ListingsFallback />}>
      <CategoryListingsPage categorySlug={categorySlug} />
    </Suspense>
  );
}
