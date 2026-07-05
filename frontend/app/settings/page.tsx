import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsPage } from '@/features/settings/settings-page';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');

  return {
    title: `${t('settings')} | Fraggit`,
  };
}

export default async function Page() {
  const t = await getTranslations('pages');

  return <SettingsPage title={t('settings')} />;
}
