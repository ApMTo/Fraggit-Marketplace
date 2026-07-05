import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ListingsPage } from '@/features/listings/listings-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('listings')} | Fraggit`,
  };
}

export default async function Page() {
  const t = await getTranslations('pages');

  return <ListingsPage title={t('listings')} />;
}
