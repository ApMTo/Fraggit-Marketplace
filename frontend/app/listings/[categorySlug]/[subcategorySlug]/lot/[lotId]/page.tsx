import { dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListingsHydration } from '@/features/listings/components/listings-hydration';
import { LotDetailPage } from '@/features/listings/lot-detail-page';
import {
  fetchLotById,
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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { lotId } = await params;
  const t = await getTranslations('listings');
  const lot = await fetchLotById(lotId);

  if (!lot) {
    return {
      title: `${t('lotDetails')} | Fraggit`,
      description: t('categorySubtitle'),
    };
  }

  return {
    title: `${lot.title} | Fraggit`,
    description: lot.description?.slice(0, 160) || t('categorySubtitle'),
  };
}

export default async function Page({ params }: PageProps) {
  const { categorySlug, subcategorySlug, lotId } = await params;
  const queryClient = makeQueryClient();
  await prefetchLotDetail(queryClient, lotId);

  return (
    <ListingsHydration state={dehydrate(queryClient)}>
      <LotDetailPage
        lotId={lotId}
        categorySlug={categorySlug}
        subcategorySlug={subcategorySlug}
      />
    </ListingsHydration>
  );
}
