import { Suspense } from 'react';
import { dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Spinner } from '@/components/ui/spinner';
import { ListingsHydration } from '@/features/listings/components/listings-hydration';
import { CreateLotPage } from '@/features/listings/create-lot-page';
import {
  prefetchCreateLot,
  type NextSearchParams,
} from '@/features/listings/lib/prefetch-listings.server';
import { makeQueryClient } from '@/lib/query-client';

type PageProps = {
  searchParams: Promise<NextSearchParams>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('listings.create');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

function CreateLotFallback() {
  return (
    <div className="mx-auto flex w-full max-w-[760px] justify-center px-5 py-20">
      <Spinner size="lg" />
    </div>
  );
}

export default async function Page({ searchParams }: PageProps) {
  const resolved = await searchParams;
  const categoryId =
    typeof resolved.categoryId === 'string' ? resolved.categoryId : undefined;
  const subcategoryId =
    typeof resolved.subcategoryId === 'string'
      ? resolved.subcategoryId
      : undefined;

  const queryClient = makeQueryClient();
  await prefetchCreateLot(queryClient, { categoryId, subcategoryId });

  return (
    <ListingsHydration state={dehydrate(queryClient)}>
      <Suspense fallback={<CreateLotFallback />}>
        <CreateLotPage />
      </Suspense>
    </ListingsHydration>
  );
}
