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
  const { categorySlug, subcategorySlug, lotId } = await params;
  const t = await getTranslations('listings');
  const lot = await fetchLotById(lotId);

  if (!lot) {
    return {
      title: `${t('lotDetails')} | Fraggit`,
      description: t('categorySubtitle'),
    };
  }

  const description =
    lot.description?.replace(/\s+/g, ' ').trim().slice(0, 160) ||
    t('categorySubtitle');
  const imageUrl = lot.previewUrl ?? lot.images[0]?.url ?? null;
  const path = `/listings/${categorySlug}/${subcategorySlug}/lot/${lotId}`;

  return {
    title: `${lot.title} | Fraggit`,
    description,
    openGraph: {
      title: lot.title,
      description,
      type: 'website',
      url: path,
      siteName: 'Fraggit',
      ...(imageUrl
        ? {
            images: [
              {
                url: imageUrl,
                alt: lot.title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: imageUrl ? 'summary_large_image' : 'summary',
      title: lot.title,
      description,
      ...(imageUrl ? { images: [imageUrl] } : {}),
    },
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
