import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminPage } from '@/features/admin/admin-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('admin')} | Fraggit`,
  };
}

export default async function Page() {
  const t = await getTranslations('pages');

  return <AdminPage title={t('admin')} />;
}
