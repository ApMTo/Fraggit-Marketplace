import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DashboardPage } from '@/features/dashboard';
import { requireSessionUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('dashboard')} | Fraggit`,
  };
}

export default async function Page() {
  const user = await requireSessionUser();

  const t = await getTranslations('pages');

  return (
    <DashboardPage
      title={t('dashboard')}
      displayName={user.displayName}
      username={user.username}
    />
  );
}
