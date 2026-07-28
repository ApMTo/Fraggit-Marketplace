import { dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListingsHydration } from '@/features/listings/components/listings-hydration';
import { EditLotPage } from '@/features/listings/edit-lot-page';
import {
  prefetchCreateLot,
  prefetchLotDetail,
} from '@/features/listings/lib/prefetch-listings.server';
import { makeQueryClient } from '@/lib/query-client';

type PageProps = {
  params: Promise<{
    categorySlug: string;
    subcategorySlug: string;
    lotId: string;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('listings.edit');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const { categorySlug, subcategorySlug, lotId } = await params;
  const queryClient = makeQueryClient();
  const lot = await prefetchLotDetail(queryClient, lotId);

  if (lot) {
    await prefetchCreateLot(queryClient, {
      categoryId: lot.categoryId,
      subcategoryId: lot.subcategoryId,
    });
  }

  return (
    <ListingsHydration state={dehydrate(queryClient)}>
      <EditLotPage
        lotId={lotId}
        categorySlug={categorySlug}
        subcategorySlug={subcategorySlug}
      />
    </ListingsHydration>
  );
}
