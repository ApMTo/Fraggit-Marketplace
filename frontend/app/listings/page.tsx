import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListingsHubPage } from '@/features/listings/listings-hub-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('listings');

  return {
    title: `${t('title')} | Fraggit`,
    description: t('subtitle'),
  };
}

export default function Page() {
  return <ListingsHubPage />;
}
