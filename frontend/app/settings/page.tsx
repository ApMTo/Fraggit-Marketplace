import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/features/settings/settings-page';
import { requireSessionUser } from '@/lib/auth.server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('settings');

  return {
    title: `${t('title')} | Fraggit`,
  };
}

export default async function Page() {
  await requireSessionUser();

  return <SettingsPage />;
}
