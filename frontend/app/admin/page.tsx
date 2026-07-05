import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminPage } from '@/features/admin/admin-page';
import { requireAdminUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('admin')} | Fraggit`,
  };
}

export default async function Page() {
  await requireAdminUser();
  const t = await getTranslations('pages');

  return <AdminPage title={t('admin')} />;
}
