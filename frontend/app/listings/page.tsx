import { dehydrate } from '@tanstack/react-query';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListingsHydration } from '@/features/listings/components/listings-hydration';
import { ListingsHubPage } from '@/features/listings/listings-hub-page';
import { prefetchListingsHub } from '@/features/listings/lib/prefetch-listings.server';
import { makeQueryClient } from '@/lib/query-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('listings');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default async function Page() {
  const queryClient = makeQueryClient();
  await prefetchListingsHub(queryClient);

  return (
    <ListingsHydration state={dehydrate(queryClient)}>
      <ListingsHubPage />
    </ListingsHydration>
  );
}
