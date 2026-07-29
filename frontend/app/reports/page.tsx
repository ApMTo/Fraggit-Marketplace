import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { MyReportsPage } from '@/features/moderation/my-reports-page';
import { requireSessionUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('myReports');
  return { title: `${t('title')} | Fraggit` };
}

export default async function Page() {
  await requireSessionUser();
  const t = await getTranslations('myReports');
  return <MyReportsPage title={t('title')} />;
}
